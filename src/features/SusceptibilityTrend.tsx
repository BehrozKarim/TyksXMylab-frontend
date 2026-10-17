import { useState } from 'react';
import { ChartNoAxesCombined } from 'lucide-react';
import type { Analysis, CohortQuery, Meta, ReplayState } from '../api/contracts';
import { api } from '../api/client';
import { trendDates } from '../domain/trend';
import { useAnalysis } from '../app/queries';
import {
  Button,
  DataTable,
  ErrorPanel,
  Loading,
  Panel,
  SectionHeading,
  Select,
} from '../components/ui';
import { formatDate, percentage } from '../domain/formatters';

export function SusceptibilityTrend({
  query,
  state,
  meta,
  onProvenance,
  onYearChange,
}: {
  query: CohortQuery;
  state: ReplayState;
  meta: Meta;
  onProvenance: (analysis: Analysis) => void;
  onYearChange: (year: number) => void;
}) {
  const [enabled, setEnabled] = useState(false);
  const dates = trendDates(query.calendar_year, query.as_of, meta.source.start);
  const result = useAnalysis(
    'trend',
    state,
    { query, dates },
    async (signal) => {
      // The reference backend serializes calculations. Limit work to two requests.
      const points = [];
      for (let i = 0; i < dates.length; i += 2) {
        const batch = await Promise.all(
          dates.slice(i, i + 2).map((as_of) => api.evidence({ ...query, as_of }, state, signal)),
        );
        points.push(...batch);
      }
      return points;
    },
    enabled && dates.length > 0 && state.status !== 'running',
  );
  const points = result.data ?? [];
  const x = (index: number) => 52 + (index / Math.max(1, points.length - 1)) * 684;
  const y = (value: number) => 210 - value * 1.7;
  let segment = '';
  const segments: string[] = [];
  points.forEach((p, i) => {
    const value = p.windows.last_28d.susceptibility_pct;
    if (value === null) {
      if (segment) segments.push(segment);
      segment = '';
    } else segment += `${segment ? ' L' : 'M'}${x(i)},${y(value)}`;
  });
  if (segment) segments.push(segment);
  const label = '28-day susceptibility at monthly collection cutoffs';
  return (
    <Panel className="trend-panel">
      <SectionHeading
        title="Susceptibility over time"
        description="28-day estimates sampled at each month end, up to the report end date."
        action={
          <span className="section-icon">
            <ChartNoAxesCombined size={20} />
          </span>
        }
      />
      <div className="chart-controls">
        <Select
          id="chart-year"
          label="Chart year"
          value={query.calendar_year}
          aria-describedby="chart-year-help"
          onChange={(event) => onYearChange(Number(event.target.value))}
        >
          {Array.from(
            {
              length: Number(query.as_of.slice(0, 4)) - Number(meta.source.start.slice(0, 4)) + 1,
            },
            (_, i) => Number(meta.source.start.slice(0, 4)) + i,
          ).map((year) => (
            <option key={year}>{year}</option>
          ))}
        </Select>
        <p id="chart-year-help">
          Showing {query.calendar_year} in this chart only. The overview still ends on{' '}
          {formatDate(query.as_of)}.
        </p>
      </div>
      {state.status === 'running' ? (
        <p className="inline-notice">
          Pause dataset playback before loading a trend so all points use one stable snapshot.
        </p>
      ) : !enabled ? (
        <div className="trend-intro">
          <p>
            Load {dates.length} monthly cutoffs for {query.calendar_year}, using your selected
            cohort.
          </p>
          <Button onClick={() => setEnabled(true)} disabled={!dates.length}>
            Load monthly trend
          </Button>
        </div>
      ) : result.isPending ? (
        <Loading label={`Loading ${dates.length} monthly cutoffs…`} />
      ) : result.isError ? (
        <ErrorPanel error={result.error} onRetry={() => void result.refetch()} />
      ) : (
        <>
          {points.some((p) => p.windows.last_28d.status === 'available') ? (
            <div className="trend-chart">
              <svg viewBox="0 0 780 260" role="img" aria-label={label}>
                {[0, 25, 50, 75, 100].map((v) => (
                  <g key={v}>
                    <line x1="52" x2="736" y1={y(v)} y2={y(v)} className="trend-grid" />
                    <text x="40" y={y(v) + 4} textAnchor="end">
                      {v}%
                    </text>
                  </g>
                ))}
                {segments.map((d, i) => (
                  <path key={i} d={d} className="trend-line" />
                ))}
                {points.map((p, i) => {
                  const m = p.windows.last_28d;
                  return (
                    <g key={p.analysis_id}>
                      {m.susceptibility_pct !== null && (
                        <circle
                          cx={x(i)}
                          cy={y(m.susceptibility_pct)}
                          r="5"
                          className="trend-point"
                        >
                          <title>
                            {formatDate(p.context.as_of)}: {percentage(m.susceptibility_pct)},{' '}
                            {m.n_tested} tested
                          </title>
                        </circle>
                      )}
                      <text x={x(i)} y="240" textAnchor="middle">
                        {new Intl.DateTimeFormat('en', { month: 'short', timeZone: 'UTC' }).format(
                          new Date(`${p.context.as_of}T12:00:00Z`),
                        )}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
          ) : (
            <p className="inline-notice">
              No monthly cutoff has 30 tested isolates. Counts remain available below.
            </p>
          )}
          <p className="small-note">
            Gaps indicate fewer than 30 tests or unavailable evidence. All points use the same
            published snapshot; they do not reproduce when results became known.
          </p>
          <details className="data-disclosure">
            <summary>Monthly values, counts & exports</summary>
            <DataTable label={label}>
              <table>
                <thead>
                  <tr>
                    <th>28-day period ending</th>
                    <th>Susceptible</th>
                    <th>Tested</th>
                    <th>95% interval</th>
                    <th>Snapshot</th>
                  </tr>
                </thead>
                <tbody>
                  {points.map((p) => {
                    const m = p.windows.last_28d;
                    return (
                      <tr key={p.analysis_id}>
                        <td>{formatDate(p.context.as_of)}</td>
                        <td>
                          {m.susceptibility_pct === null
                            ? 'Not reported'
                            : percentage(m.susceptibility_pct)}
                        </td>
                        <td>{m.n_tested}</td>
                        <td>
                          {m.status === 'available'
                            ? `${percentage(m.ci95.susceptibility.lower)}–${percentage(m.ci95.susceptibility.upper)}`
                            : 'Not reported'}
                        </td>
                        <td>
                          <Button variant="ghost" onClick={() => onProvenance(p)}>
                            Inspect
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </DataTable>
          </details>
        </>
      )}
    </Panel>
  );
}
