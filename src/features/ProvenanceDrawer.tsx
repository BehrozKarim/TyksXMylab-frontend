import { useState } from 'react';
import { Download, FileJson, Fingerprint } from 'lucide-react';
import type { Analysis, Meta, WindowKey } from '../api/contracts';
import { api } from '../api/client';
import { Badge, Button, Drawer } from '../components/ui';
import { cohortLabel, formatDate, formatRange, windowLabels } from '../domain/formatters';
export function ProvenanceDrawer({
  analysis,
  window,
  meta,
  onClose,
}: {
  analysis: Analysis | null;
  window?: WindowKey;
  meta: Meta;
  onClose: () => void;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const download = async (format: 'csv' | 'json') => {
    if (!analysis) return;
    setPending(true);
    setError('');
    try {
      await api.export(analysis.analysis_id, format);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setPending(false);
    }
  };
  const c = analysis?.context;
  return (
    <Drawer
      open={!!analysis}
      onClose={onClose}
      title="Behind the evidence"
      description="Calculation context and an export of the exact snapshot you opened."
    >
      {analysis && c && (
        <>
          <div className="provenance-intro">
            <Fingerprint size={26} />
            <div>
              <Badge tone="violet">Frozen analysis</Badge>
              <h3>{window ? windowLabels[window] : 'Evidence snapshot'}</h3>
              <p>Samples through {formatDate(c.as_of, 'long')}</p>
            </div>
          </div>
          <div className="drawer-section">
            <h3>Applied population</h3>
            <p>{cohortLabel(c.filters, meta)}</p>
            {'antibiotic_code' in analysis && (
              <p>
                Antibiotic: <strong>{analysis.antibiotic_code}</strong>
              </p>
            )}
            {'comparison' in analysis && (
              <p>
                Paired antibiotics:{' '}
                <strong>
                  {analysis.comparison.antibiotic_a} / {analysis.comparison.antibiotic_b}
                </strong>
              </p>
            )}
          </div>
          <div className="drawer-section">
            <h3>Reporting periods</h3>
            {(window ? [window] : (['annual', 'rolling_12m', 'last_28d'] as WindowKey[])).map(
              (key) => (
                <div className="provenance-period" key={key}>
                  <strong>{windowLabels[key]}</strong>
                  <span>{formatRange(c.date_bounds[key])}</span>
                  <code>
                    [{c.date_bounds[key].start_inclusive}, {c.date_bounds[key].end_exclusive})
                  </code>
                  {!c.coverage[key].source_covers_requested_window && (
                    <Badge tone="warning">Partial source coverage</Badge>
                  )}
                </div>
              ),
            )}
          </div>
          <div className="drawer-section">
            <h3>How counts are formed</h3>
            <ol className="method-list">
              <li>Resolve the latest visible isolate revisions.</li>
              <li>
                Keep the first isolate per patient, organism and specimen in each period, across
                wards.
              </li>
              <li>Apply the selected ward and population filters.</li>
              <li>
                Use only isolates tested for the selected antibiotic. Paired comparisons require
                both tests.
              </li>
              <li>Hide percentages and intervals below {meta.minimum_tested} tested isolates.</li>
            </ol>
            <p className="small-note">
              Intervals: {meta.interval_method}. Missing tests do not imply resistance.
              Repeat-removal counts are not supplied by this contract fixture.
            </p>
          </div>
          <dl className="provenance-meta">
            <div>
              <dt>Source dates</dt>
              <dd>
                {formatDate(meta.source.start)} – {formatDate(meta.source.end)}
              </dd>
            </div>
            <div>
              <dt>Source manifest</dt>
              <dd>{c.source_manifest_id}</dd>
            </div>
            <div>
              <dt>Method</dt>
              <dd>{c.method_version}</dd>
            </div>
            <div>
              <dt>Run / revision</dt>
              <dd>
                {c.run_id} / {c.state_revision}
              </dd>
            </div>
            <div>
              <dt>Analysis ID</dt>
              <dd>{analysis.analysis_id}</dd>
            </div>
          </dl>
          <div className="export-box">
            <h3>Export this snapshot</h3>
            <p>
              Downloads retain the values, nulls, filters and revision displayed here, even after
              replay advances.
            </p>
            <div className="export-actions">
              <Button disabled={pending} variant="primary" onClick={() => void download('csv')}>
                <Download size={16} />
                Download CSV
              </Button>
              <Button disabled={pending} onClick={() => void download('json')}>
                <FileJson size={16} />
                Download JSON
              </Button>
            </div>
            {error && (
              <p role="alert" className="form-error">
                {error} Use the same download button to retry.
              </p>
            )}
          </div>
        </>
      )}
    </Drawer>
  );
}
