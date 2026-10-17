import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  alertAnalysisSchema,
  alertWindowSchema,
  resistanceInvestigationSchema,
} from '../api/alerts';
import { api } from '../api/client';
import { initialState } from '../mocks/fixtures';

const monitor = {
  ward_code: 'ED',
  organism: 'Escherichia coli',
  specimen: 'urine',
  antibiotic_code: 'CIP',
  sex: null,
  age_min: null,
  age_max: null,
  dedup_scope: 'selected_cohort',
};
const measurements = {
  raw_isolates_before_dedup_and_demographics: 30,
  sex_counts: { F: 15, M: 15 },
  age_bin_counts: { '18-64': 30 },
  collection_setting_counts: { outpatient: 30 },
  organism_mix_counts: { 'Escherichia coli': 30 },
  hospital_day_3_or_later: 0,
  hospital_day_1_or_2: 0,
  timing_unknown: 0,
  timing_not_applicable: 30,
};
const recent = {
  start_date: '2026-08-31',
  end_date_exclusive: '2026-09-28',
  n_eligible: 30,
  n_tested: 30,
  n_s: 21,
  n_r: 9,
  n_not_tested: 0,
  resistance_pct: 30,
  measurements,
  coverage: { source_date_span_covers_window: true, source_fully_imported: true },
};
const context = {
  run_id: initialState.run_id,
  state_revision: 7,
  method_version: 'alert-v1',
  demo_date: '2026-09-27',
  source_manifest_id: 'source',
  monitoring_as_of: '2026-09-27',
  monitor_id: 'ED-CIP',
  monitor,
  rule_version: 'resistance-rise-v1',
  minimum_tested: 30,
  threshold_pp: 10,
  confirmation: 'proposed_pending_partner_confirmation',
  caveats: ['Populations are not independent.'],
};
const analysis = {
  analysis_id: 'detection',
  context,
  evaluation: {
    status: 'triggered',
    reason: null,
    baseline: {
      ...recent,
      start_date: '2025-08-31',
      end_date_exclusive: '2026-08-31',
      n_s: 24,
      n_r: 6,
      resistance_pct: 20,
    },
    recent,
    resistance_change_pp: 10,
    shared_patients_between_windows: 0,
  },
};
const record = {
  alert_id: 'alert1',
  investigation_id: 'alert1',
  run_id: initialState.run_id,
  monitor_id: 'ED-CIP',
  antibiotic_code: 'CIP',
  rule_version: 'resistance-rise-v1',
  status: 'new',
  last_sufficient_state: 'new',
  first_trigger_revision: 7,
  last_trigger_revision: 7,
  first_trigger_date: '2026-09-27',
  last_trigger_date: '2026-09-27',
  original_analysis_id: 'detection',
  current_analysis_id: 'latest',
};
afterEach(() => vi.restoreAllMocks());
describe('Published resistance alerts', () => {
  it('validates separate baseline/recent dates and rejects date overlap', () => {
    expect(alertAnalysisSchema.safeParse(analysis).success).toBe(true);
    expect(
      alertAnalysisSchema.safeParse({
        ...analysis,
        evaluation: {
          ...analysis.evaluation,
          baseline: { ...analysis.evaluation.baseline, end_date_exclusive: '2026-09-28' },
        },
      }).success,
    ).toBe(false);
  });
  it('rejects leaked resistance below 30 tested isolates', () => {
    const sparse = { ...recent, n_eligible: 29, n_tested: 29, n_s: 20 };
    expect(alertWindowSchema.safeParse(sparse).success).toBe(false);
    expect(alertWindowSchema.safeParse({ ...sparse, resistance_pct: null }).success).toBe(true);
  });
  it('withholds a percentage-point change when the alert is insufficient', () => {
    expect(
      alertAnalysisSchema.safeParse({
        ...analysis,
        evaluation: { ...analysis.evaluation, status: 'insufficient_evidence' },
      }).success,
    ).toBe(false);
  });
  it('keeps archived original detections and rejects substituted identities', () => {
    const archived = {
      alert: record,
      original_detection: analysis,
      current_analysis: null,
      current_analysis_status: 'archived_run',
      transitions: [],
    };
    expect(resistanceInvestigationSchema.safeParse(archived).success).toBe(true);
    expect(
      resistanceInvestigationSchema.safeParse({
        ...archived,
        original_detection: { ...analysis, analysis_id: 'different' },
      }).success,
    ).toBe(false);
  });
  it('accepts a lagging monitoring revision after a replay control revision', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      Response.json({
        run_id: initialState.run_id,
        state_revision: 8,
        monitoring_revision: 7,
        monitoring_as_of: '2026-09-27',
        configuration: { threshold_pp: 10, minimum_tested: 30, monitors: [monitor] },
        alerts: [record],
        monitors: [analysis],
      }),
    );
    const data = await api.resistanceAlerts(initialState);
    expect(data.monitoring_revision).toBe(7);
  });
  it('accepts alert-v1 current analysis separately from the evidence method', async () => {
    const current = {
      ...analysis,
      analysis_id: 'latest',
      context: { ...context, state_revision: 8 },
    };
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      Response.json({
        alert: record,
        original_detection: analysis,
        current_analysis: current,
        current_analysis_status: 'available',
        transitions: [],
      }),
    );
    const result = await api.resistanceInvestigation('alert1', initialState);
    expect(result.original_detection.context.state_revision).toBe(7);
    expect(result.current_analysis?.context.state_revision).toBe(8);
  });
});
