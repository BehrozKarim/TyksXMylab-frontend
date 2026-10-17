import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { FastForward, Pause, Play, RotateCcw, StepForward } from 'lucide-react';
import type { ReplayState } from '../api/contracts';
import { api, ApiError } from '../api/client';
import { keys } from '../app/queries';
import { Badge, Button } from '../components/ui';
import { formatDate, number } from '../domain/formatters';
export function ReplayController({ state, onReset }: { state: ReplayState; onReset: () => void }) {
  const client = useQueryClient();
  const [feedback, setFeedback] = useState('');
  const mutation = useMutation({
    mutationFn: async (action: 'start' | 'pause' | 'step' | 'reset') => {
      await client.cancelQueries({ queryKey: ['analysis'] });
      return api.replay(action, state);
    },
    retry: (count, error) =>
      count < 2 && error instanceof ApiError && error.code === 'publication_busy',
    retryDelay: 1500,
    onSuccess: async (next, action) => {
      await client.cancelQueries({ queryKey: ['analysis'] });
      if (action === 'reset') {
        client.removeQueries({ queryKey: ['analysis'] });
        onReset();
      }
      client.setQueryData(keys.state, next);
      const added = next.published_bundles - state.published_bundles;
      setFeedback(
        action === 'reset'
          ? `Demo reset to ${formatDate(next.demo_date)}. Earlier samples remain published.`
          : action === 'start'
            ? 'Playback started: one dataset day every four seconds. Reports follow the published date.'
            : action === 'pause'
              ? `Paused at ${formatDate(next.demo_date)}. You can now inspect a stable report.`
              : `${formatDate(next.demo_date)}: ${added > 0 ? `${number(added)} new samples published.` : 'No new samples on this day.'} Rolling evidence now uses this date.`,
      );
    },
    onError: () => void client.invalidateQueries({ queryKey: keys.state }),
  });
  const running = state.status === 'running';
  return (
    <section className="replay-panel replay-explained" aria-label="Historical replay controls">
      <p className="replay-explanation">
        This demo reveals the dataset in collection-date order. <strong>Play</strong> advances
        automatically; <strong>Next day</strong> publishes one day of samples. The ward report
        updates to match.
      </p>
      <div className="replay-title">
        <span className="replay-icon">
          <FastForward size={20} />
        </span>
        <div>
          <h2>
            Dataset playback <Badge tone={running ? 'success' : 'neutral'}>{state.status}</Badge>
          </h2>
          <p>
            {number(state.published_bundles)} samples published
            {state.published_isolates !== undefined &&
              ` · ${number(state.published_isolates)} isolates`}
          </p>
        </div>
      </div>
      <div className="replay-progress">
        <progress
          aria-label="Dataset replay progress"
          max={Math.max(
            1,
            Date.parse(state.replay_bounds.end) - Date.parse(state.replay_bounds.start),
          )}
          value={
            state.status === 'completed'
              ? Math.max(
                  1,
                  Date.parse(state.replay_bounds.end) - Date.parse(state.replay_bounds.start),
                )
              : Math.max(0, Date.parse(state.demo_date) - Date.parse(state.replay_bounds.start))
          }
        />
        <div>
          <span>{formatDate(state.replay_bounds.start)}</span>
          <span>{formatDate(state.replay_bounds.end)}</span>
        </div>
      </div>
      <div className="replay-clock">
        <span className="field-label">Replay date</span>
        <strong>{formatDate(state.demo_date)}</strong>
      </div>
      <div className="replay-actions">
        <Button
          variant="primary"
          disabled={mutation.isPending || state.status === 'completed' || state.status === 'error'}
          onClick={() => mutation.mutate(running ? 'pause' : 'start')}
        >
          {running ? <Pause size={15} /> : <Play size={15} />}{' '}
          {running ? 'Pause playback' : 'Play days'}
        </Button>
        <Button
          disabled={mutation.isPending || state.status !== 'paused'}
          onClick={() => mutation.mutate('step')}
        >
          <StepForward size={16} />
          Next day
        </Button>
        <Button
          variant="ghost"
          disabled={mutation.isPending}
          onClick={() => mutation.mutate('reset')}
        >
          <RotateCcw size={15} />
          Restart demo
        </Button>
      </div>
      {state.status === 'completed' && (
        <p className="inline-notice">
          All samples in this replay are published. Restart the demo to watch the final weeks arrive
          again.
        </p>
      )}
      <p className="replay-feedback" role="status" aria-live="polite">
        {mutation.isPending
          ? 'Updating the published dataset…'
          : feedback || 'Open the ward overview after each day to compare the updated evidence.'}
      </p>
      {mutation.isError && (
        <p role="alert" className="replay-error">
          {mutation.error.message}
        </p>
      )}
    </section>
  );
}
