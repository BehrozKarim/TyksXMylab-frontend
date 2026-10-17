import { z } from 'zod';
import {
  alertsSchema,
  comparisonSchema,
  evidenceSchema,
  historySchema,
  investigationResponseSchema,
  metaSchema,
  patientsSchema,
  stateSchema,
} from './contracts';
import type { AnalysisContext, CohortQuery, ReplayState } from './contracts';

export const DATA_MODE = import.meta.env.VITE_DATA_MODE ?? 'fixtures';
export const API_BASE = (import.meta.env.VITE_API_BASE_URL ?? '/api/v1').replace(/\/$/, '');
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code = 'request_failed',
  ) {
    super(message);
  }
}
export const queryString = (params: Record<string, unknown>) => {
  const search = new URLSearchParams();
  Object.entries(params)
    .sort(([a], [b]) => a.localeCompare(b))
    .forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') search.set(key, String(value));
    });
  return search.toString();
};
async function request<T>(
  path: string,
  schema: z.ZodType<T>,
  params: Record<string, unknown> = {},
  signal?: AbortSignal,
  method = 'GET',
  body?: unknown,
): Promise<T> {
  const response = await fetch(
    `${API_BASE}${path}${Object.keys(params).length ? `?${queryString(params)}` : ''}`,
    {
      signal,
      method,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    },
  );
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new ApiError(
      data.error?.message ?? `Request failed (${response.status}). Please try again.`,
      response.status,
      data.error?.code,
    );
  }
  const result = schema.safeParse(await response.json());
  if (!result.success)
    throw new ApiError(
      'The API returned an incompatible evidence contract. Check the /api/v1 integration.',
      502,
      'invalid_contract',
    );
  return result.data;
}
const guard = (state: ReplayState) => ({
  expected_run_id: state.run_id,
  expected_revision: state.state_revision,
});
export function assertContext(context: AnalysisContext, state: ReplayState, query?: CohortQuery) {
  if (
    context.run_id !== state.run_id ||
    context.state_revision !== state.state_revision ||
    context.method_version !== state.method_version
  )
    throw new ApiError('The snapshot changed. Refreshing evidence…', 409, 'state_changed');
  if (
    query &&
    (context.as_of !== query.as_of ||
      Object.keys(context.filters).some(
        (key) =>
          context.filters[key as keyof typeof context.filters] !== query[key as keyof CohortQuery],
      ))
  )
    throw new ApiError('The response does not match the selected cohort.', 502, 'invalid_context');
}
function cohortParams(q: CohortQuery) {
  const { antibiotic_b: _b, window: _w, ...rest } = q;
  void _b;
  void _w;
  return rest;
}
export const api = {
  meta: (signal?: AbortSignal) => request('/meta', metaSchema, {}, signal),
  state: (signal?: AbortSignal) => request('/state', stateSchema, {}, signal),
  async evidence(query: CohortQuery, state: ReplayState, signal?: AbortSignal) {
    const data = await request(
      '/evidence',
      evidenceSchema,
      { ...cohortParams(query), ...guard(state) },
      signal,
    );
    assertContext(data.context, state, query);
    if (data.antibiotic_code !== query.antibiotic_code)
      throw new ApiError('The response has a different antibiotic.', 502, 'invalid_context');
    return data;
  },
  async comparison(query: CohortQuery, state: ReplayState, signal?: AbortSignal) {
    const { antibiotic_code, ...params } = cohortParams(query);
    const data = await request(
      '/comparisons',
      comparisonSchema,
      {
        ...params,
        antibiotic_a: antibiotic_code,
        antibiotic_b: query.antibiotic_b,
        window: query.window,
        ...guard(state),
      },
      signal,
    );
    assertContext(data.context, state, query);
    if (
      data.comparison.antibiotic_a !== query.antibiotic_code ||
      data.comparison.antibiotic_b !== query.antibiotic_b ||
      data.comparison.window !== query.window
    )
      throw new ApiError('The response has a different comparison.', 502, 'invalid_context');
    return data;
  },
  async alerts(state: ReplayState, signal?: AbortSignal) {
    const data = await request('/alerts', alertsSchema, guard(state), signal);
    if (
      data.run_id !== state.run_id ||
      data.state_revision !== state.state_revision ||
      data.monitoring_as_of !== state.demo_date
    )
      throw new ApiError('Review flags are updating.', 409, 'state_changed');
    return data;
  },
  async investigation(id: string, state: ReplayState, signal?: AbortSignal) {
    const response = await request(
      `/investigations/${encodeURIComponent(id)}`,
      investigationResponseSchema,
      guard(state),
      signal,
    );
    const serving = response.serving_context;
    if (
      serving.run_id !== state.run_id ||
      serving.state_revision !== state.state_revision ||
      serving.method_version !== state.method_version ||
      serving.demo_date !== state.demo_date
    )
      throw new ApiError('The snapshot changed. Refreshing evidence…', 409, 'state_changed');
    const data = response.analysis;
    if (
      data.context.run_id !== state.run_id ||
      data.context.state_revision > state.state_revision ||
      data.context.as_of > state.demo_date ||
      data.context.as_of !== data.alert.detected_on ||
      data.alert.id !== id
    )
      throw new ApiError(
        'The response does not match this detection snapshot.',
        502,
        'invalid_context',
      );
    return data;
  },
  patients: (search: string, as_of: string, state: ReplayState, signal?: AbortSignal) =>
    request('/patients', patientsSchema, { search, as_of, ...guard(state) }, signal),
  async history(id: string, as_of: string, state: ReplayState, signal?: AbortSignal) {
    const data = await request(
      `/patients/${encodeURIComponent(id)}/history`,
      historySchema,
      { as_of, ...guard(state) },
      signal,
    );
    assertContext(data.context, state);
    if (
      data.patient_id !== id ||
      data.cutoff !== as_of ||
      data.cultures.some((c) => c.sample_date >= as_of || c.sample_date < data.lookback_start)
    )
      throw new ApiError(
        'Patient history does not match the collection cutoff.',
        502,
        'invalid_context',
      );
    return data;
  },
  replay: (action: 'start' | 'pause' | 'step' | 'reset') =>
    request(
      `/replay/${action}`,
      stateSchema,
      {},
      undefined,
      'POST',
      action === 'start' ? { days_per_tick: 1, interval_ms: 4000 } : {},
    ),
  async export(id: string, format: 'csv' | 'json') {
    const response = await fetch(
      `${API_BASE}/analyses/${encodeURIComponent(id)}/export?format=${format}`,
    );
    if (!response.ok)
      throw new ApiError(
        'This snapshot could not be downloaded. Retry to export the same analysis.',
        response.status,
      );
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ward-evidence-${id}.${format}`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  },
};
