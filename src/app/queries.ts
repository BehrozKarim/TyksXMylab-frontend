import { QueryClient, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, ApiError, DATA_MODE } from '../api/client';
import { subscribeToUpdates } from '../api/updates';
import type { ReplayState } from '../api/contracts';
import { useEffect, useRef, useState } from 'react';
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: (count, error) =>
        count < 1 &&
        !(
          error instanceof ApiError &&
          (error.status < 500 ||
            error.code === 'invalid_contract' ||
            error.code === 'invalid_context')
        ),
      refetchOnWindowFocus: false,
    },
    mutations: { retry: false },
  },
});
export const keys = {
  meta: ['meta'] as const,
  state: ['state'] as const,
  analysis: (kind: string, state: ReplayState, params: unknown) =>
    ['analysis', kind, state.run_id, state.state_revision, state.method_version, params] as const,
};
export function useMeta() {
  return useQuery({
    queryKey: keys.meta,
    queryFn: ({ signal }) => api.meta(signal),
    staleTime: Infinity,
  });
}
export function useReplayState() {
  const client = useQueryClient();
  const [connected, setConnected] = useState(false);
  useEffect(() => {
    if (DATA_MODE !== 'api') return;
    return subscribeToUpdates(
      () => void client.invalidateQueries({ queryKey: keys.state }),
      setConnected,
    );
  }, [client]);
  const result = useQuery({
    queryKey: keys.state,
    queryFn: ({ signal }) => api.state(signal),
    refetchInterval: connected ? 30_000 : 2000,
    refetchIntervalInBackground: false,
  });
  const revision = result.data ? `${result.data.run_id}/${result.data.state_revision}` : undefined;
  const previous = useRef<string | undefined>(undefined);
  useEffect(() => {
    // Feed publication can introduce dictionary entries as well as result revisions.
    if (revision && previous.current && revision !== previous.current)
      void client.invalidateQueries({ queryKey: keys.meta });
    previous.current = revision;
  }, [revision, client]);
  return { ...result, updatesConnected: connected };
}
export function useAnalysis<T>(
  kind: string,
  state: ReplayState,
  params: unknown,
  fn: (signal: AbortSignal) => Promise<T>,
  enabled = true,
) {
  const client = useQueryClient();
  const recoveredAt = useRef(0);
  return useQuery<T>({
    queryKey: keys.analysis(kind, state, params),
    enabled,
    placeholderData: (previous, previousQuery) => {
      const key = previousQuery?.queryKey;
      // Retain complete same-population snapshots during revision refresh only.
      // Never borrow values across filters, patient/cursor changes, dates or runs.
      return key?.[2] === state.run_id && JSON.stringify(key[5]) === JSON.stringify(params)
        ? previous
        : undefined;
    },
    queryFn: async ({ signal }) => {
      try {
        return await fn(signal);
      } catch (error) {
        if (
          error instanceof ApiError &&
          error.code === 'state_changed' &&
          Date.now() - recoveredAt.current >= 2000
        ) {
          // One refresh per request; changing the state key schedules the fresh snapshot.
          // A further race remains visible until the next state poll, without a retry loop.
          recoveredAt.current = Date.now();
          const latest = await api.state(signal);
          client.setQueryData(keys.state, latest);
        }
        throw error;
      }
    },
    retry: (count, error) =>
      count < 1 &&
      !(
        error instanceof ApiError &&
        ((error.status < 500 && error.code !== 'publication_busy') ||
          ['invalid_contract', 'invalid_context'].includes(error.code))
      ),
  });
}
