import { ArrowRight, CalendarDays, CircleHelp, Clock3, Layers3 } from 'lucide-react';
import type { Evidence, WindowKey, WindowMeasure } from '../api/contracts';
import { Badge, Button } from '../components/ui';
import { IntervalPlot } from '../components/IntervalPlot';
import { formatRange, number, percentage, windowLabels } from '../domain/formatters';

const supportTitles: Record<WindowMeasure['status'], string> = {
  available: 'Available',
  insufficient_data: 'Insufficient data',
  no_tests: 'No susceptibility tests recorded',
  empty_cohort: 'No eligible isolates in this period',
  not_applicable: 'This comparison is not applicable',
};
export function EvidenceCards({
  evidence,
  onProvenance,
  onLongerWindow,
}: {
  evidence: Evidence;
  onProvenance: (key: WindowKey) => void;
  onLongerWindow: () => void;
}) {
  return (
    <div className="period-grid">
      {(['annual', 'rolling_12m', 'last_28d'] as const).map((key, index) => {
        const m = evidence.windows[key];
        const cov = evidence.context.coverage[key];
        const Icon = [CalendarDays, Layers3, Clock3][index];
        const title =
          key === 'annual'
            ? `Calendar year ${evidence.context.filters.calendar_year}`
            : windowLabels[key];
        return (
          <section
            className={`period-card ${index === 0 && m.status === 'available' ? 'period-card--featured' : ''}`}
            key={key}
            aria-label={`${title} evidence`}
          >
            <div className="period-title">
              <span className="period-icon">
                <Icon size={17} />
              </span>
              <h3>{title}</h3>
              {key === 'annual' && cov.is_year_to_date && (
                <span className="period-tag">To date</span>
              )}
              <Button
                variant="ghost"
                className="icon-button"
                aria-label={`How calculated: ${title}`}
                onClick={() => onProvenance(key)}
              >
                <CircleHelp size={16} />
              </Button>
            </div>
            <p className="period-date">{formatRange(evidence.context.date_bounds[key])}</p>
            {m.status === 'available' ? (
              <>
                <div className="period-value">
                  {m.susceptibility_pct!.toFixed(1)}
                  <span>%</span>
                </div>
                <p className="measure-label">susceptible to {evidence.antibiotic_code}</p>
                <div className="period-counts">
                  <strong>
                    {number(m.n_s)} / {number(m.n_tested)}
                  </strong>{' '}
                  tested isolates<span>{percentage(m.resistance_pct)} resistant</span>
                </div>
                <IntervalPlot
                  value={m.susceptibility_pct!}
                  lower={m.ci95.susceptibility.lower!}
                  upper={m.ci95.susceptibility.upper!}
                />
              </>
            ) : (
              <div className="support-state">
                <Badge tone="warning">
                  {m.status === 'insufficient_data'
                    ? `${m.n_tested} tested · minimum 30`
                    : 'Evidence unavailable'}
                </Badge>
                <h3>{supportTitles[m.status]}</h3>
                <p>
                  {m.reason ??
                    (m.status === 'insufficient_data'
                      ? 'Percentages and intervals are hidden below 30 tested isolates.'
                      : `${m.n_eligible} eligible isolates. No percentage is reported.`)}
                </p>
                {key === 'last_28d' && (
                  <Button variant="ghost" onClick={onLongerWindow}>
                    Use the 12-month comparison <ArrowRight size={14} />
                  </Button>
                )}
              </div>
            )}
            <div className="period-footer">
              <span>{number(m.n_eligible)} eligible</span>
              <span>{m.n_not_tested} not tested</span>
            </div>
            {!cov.source_covers_requested_window && (
              <p className="coverage-warning">
                Partial source coverage · requested dates extend beyond source data.
              </p>
            )}
          </section>
        );
      })}
    </div>
  );
}
