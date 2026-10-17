import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import type { ReplayState } from '../api/contracts';
import { Button, RefreshNotice } from '../components/ui';
import { API_BASE } from '../api/client';

const statusSchema = z.object({
  phase: z.enum(['starting', 'ready', 'processing', 'complete', 'error']),
  run_id: z.string(),
  next_batch: z
    .object({ delivery_id: z.string(), cultures: z.number(), as_of: z.string() })
    .nullable(),
  published_batches: z.number(),
  skipped_batches: z.number(),
  last_publication: z
    .object({ cultures: z.number(), as_of: z.string(), revision: z.number() })
    .nullable(),
  error: z.string().nullable(),
});

async function controlRequest(path: string, init?: RequestInit) {
  const base = import.meta.env.VITE_HOSTED_DEMO === '1' ? `${API_BASE}/demo` : '/__demo';
  const response = await fetch(`${base}/${path}`, {
    ...init,
    cache: 'no-store',
    signal: init?.signal ?? AbortSignal.timeout(90_000),
  });
  // A stale tab or duplicate click returns the current status without advancing.
  if (!response.ok && response.status !== 409)
    throw new Error('Could not reach demo controls. The server may be waking up; retry shortly.');
  return statusSchema.parse(await response.json());
}

export function DemoControls({ state }: { state: ReplayState }) {
  if (import.meta.env.VITE_DEMO_CONTROLS !== '1') return null;
  return <ManualFeed state={state} />;
}

function ManualFeed({ state }: { state: ReplayState }) {
  const client = useQueryClient();
  const key = ['demo-control', state.run_id];
  const status = useQuery({
    queryKey: key,
    queryFn: ({ signal }) => controlRequest('status', { signal }),
    refetchInterval: (query) => query.state.data?.phase === 'processing' ? 1000 : 5000,
    retry: false,
  });
  const send = useMutation({
    mutationFn: (deliveryId: string) =>
      controlRequest('next', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ delivery_id: deliveryId }),
      }),
    retry: false,
    onMutate: () => client.cancelQueries({ queryKey: key }),
    onSuccess: (value) => client.setQueryData(key, value),
    onSettled: () => void client.invalidateQueries({ queryKey: key }),
  });
  const data = status.data;
  const matches =
    data?.run_id === state.run_id && state.mode === 'feed' && state.status === 'receiving';
  const busy = send.isPending || data?.phase === 'processing';
  const last = data?.last_publication;
  return (
    <section className="demo-controls inline-notice" aria-label="Demo controls">
      <div className="demo-controls-row">
        <div>
          <strong>Demo controls</strong>
          <p>Synthetic laboratory results arrive only when you send a batch.</p>
        </div>
        <Button
          variant="primary"
          disabled={!matches || data?.phase !== 'ready' || busy || status.isError}
          onClick={() => data?.next_batch && send.mutate(data.next_batch.delivery_id)}
        >
          {busy ? 'Processing batch…' : 'Send next lab batch'}
        </Button>
      </div>
      <p role="status" aria-live="polite">
        {!data
          ? 'Connecting to demo controls…'
          : !matches
            ? 'Demo run changed. Ask the demo owner to initialize it again.'
            : busy
              ? 'Processing — waiting for publication.'
              : data.phase === 'complete'
                ? 'All demo batches published. The demo owner can start a new run.'
                : data.phase === 'error'
                  ? data.error
                  : data.next_batch
                    ? `Ready: ${data.next_batch.cultures} cultures dated ${data.next_batch.as_of}.`
                    : 'Preparing the next batch…'}
      </p>
      {last && (
        <p>
          Published {last.cultures} cultures · {last.as_of} · revision {last.revision}. The
          dashboard updates automatically.
        </p>
      )}
      {!!data?.skipped_batches && (
        <p>{data.skipped_batches} previously published batches skipped.</p>
      )}
      <RefreshNotice
        error={status.error ?? send.error}
        onRetry={() => {
          send.reset();
          void status.refetch();
        }}
        pending={status.isFetching}
        title="Could not confirm demo status"
      />
    </section>
  );
}
