import { QueryClient, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, ApiError } from '../api/client';
import type { ReplayState } from '../api/contracts';
import { useRef } from 'react';
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
  return useQuery({
    queryKey: keys.state,
    queryFn: ({ signal }) => api.state(signal),
    refetchInterval: 2000,
    refetchIntervalInBackground: false,
  });
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
  return useQuery({
    queryKey: keys.analysis(kind, state, params),
    enabled,
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
