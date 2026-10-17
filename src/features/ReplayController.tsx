import { useMutation, useQueryClient } from '@tanstack/react-query';
import { FastForward, Pause, Play, RotateCcw, StepForward } from 'lucide-react';
import type { ReplayState } from '../api/contracts';
import { api } from '../api/client';
import { keys } from '../app/queries';
import { Badge, Button } from '../components/ui';
import { formatDate, number } from '../domain/formatters';
export function ReplayController({ state, onReset }: { state: ReplayState; onReset: () => void }) {
  const client = useQueryClient();
  const mutation = useMutation({
    mutationFn: api.replay,
    onSuccess: async (next, action) => {
      await client.cancelQueries({ queryKey: ['analysis'] });
      if (action === 'reset') {
        client.removeQueries({ queryKey: ['analysis'] });
        onReset();
      }
      client.setQueryData(keys.state, next);
    },
  });
  const running = state.status === 'running';
  return (
    <section className="replay-panel" aria-label="Historical replay controls">
      <div className="replay-title">
        <span className="replay-icon">
          <FastForward size={20} />
        </span>
        <div>
          <h2>
            Historical replay <Badge tone={running ? 'success' : 'neutral'}>{state.status}</Badge>
          </h2>
          <p>Historical synthetic samples · {number(state.published_bundles)} published bundles</p>
        </div>
      </div>
      <div className="replay-clock">
        <span className="field-label">Replay date</span>
        <strong>{formatDate(state.demo_date)}</strong>
      </div>
      <div className="replay-actions">
        <Button
          variant="primary"
          disabled={mutation.isPending || state.status === 'completed'}
          onClick={() => mutation.mutate(running ? 'pause' : 'start')}
        >
          {running ? <Pause size={15} /> : <Play size={15} />} {running ? 'Pause' : 'Start'}
        </Button>
        <Button
          disabled={mutation.isPending || running || state.status === 'completed'}
          onClick={() => mutation.mutate('step')}
        >
          <StepForward size={16} />
          Step
        </Button>
        <Button
          variant="ghost"
          disabled={mutation.isPending}
          onClick={() => mutation.mutate('reset')}
        >
          <RotateCcw size={15} />
          Reset
        </Button>
      </div>
      {mutation.isError && (
        <p role="alert" className="replay-error">
          {mutation.error.message}
        </p>
      )}
    </section>
  );
}
