import { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, FlaskConical, Search, UserRound } from 'lucide-react';
import type { ReplayState } from '../api/contracts';
import { api } from '../api/client';
import { useAnalysis } from '../app/queries';
import {
  Badge,
  Button,
  DataTable,
  Drawer,
  EmptyState,
  ErrorPanel,
  Loading,
} from '../components/ui';
import { formatDate } from '../domain/formatters';
export function PatientHistoryDrawer({
  open,
  onClose,
  state,
  asOf,
}: {
  open: boolean;
  onClose: () => void;
  state: ReplayState;
  asOf: string;
}) {
  const [text, setText] = useState('');
  const [search, setSearch] = useState('');
  const [patient, setPatient] = useState('');
  const [expanded, setExpanded] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setSearch(text.trim()), 300);
    return () => clearTimeout(timer);
  }, [text]);
  const results = useAnalysis(
    'patients',
    state,
    { search, asOf },
    (signal) => api.patients(search, asOf, state, signal),
    open && !!search && !patient,
  );
  const history = useAnalysis(
    'history',
    state,
    { patient, asOf },
    (signal) => api.history(patient, asOf, state, signal),
    open && !!patient,
  );
  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="Patient microbiology history"
      description={`Samples collected before ${formatDate(asOf, 'long')}. All specimen types and wards are included.`}
    >
      {!patient ? (
        <>
          <label className="field patient-search">
            <span>Synthetic patient identifier</span>
            <div className="search-input">
              <Search size={18} />
              <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Search, e.g. P-00142"
                autoComplete="off"
              />
            </div>
          </label>
          {!search ? (
            <EmptyState title="Find a patient">
              Search a synthetic identifier to inspect samples from the preceding 12 months.
            </EmptyState>
          ) : results.isPending ? (
            <Loading label="Searching patients…" />
          ) : results.isError ? (
            <ErrorPanel
              title="Could not search patients"
              error={results.error}
              onRetry={() => void results.refetch()}
            />
          ) : results.data.patients.length === 0 ? (
            <EmptyState title="No matching patients">Try another synthetic identifier.</EmptyState>
          ) : (
            <div className="patient-results">
              {results.data.patients.map((p) => (
                <button key={p.patient_id} onClick={() => setPatient(p.patient_id)}>
                  <span className="patient-avatar">
                    <UserRound size={20} />
                  </span>
                  <span>
                    <strong>{p.patient_id}</strong>
                    <small>{p.label}</small>
                  </span>
                  <ArrowRight size={16} />
                </button>
              ))}
            </div>
          )}
        </>
      ) : (
        <>
          <Button variant="ghost" onClick={() => setPatient('')}>
            <ArrowLeft size={15} />
            Back to search
          </Button>
          <div className="patient-heading">
            <span className="patient-avatar">
              <UserRound size={23} />
            </span>
            <div>
              <h3>{patient}</h3>
              <Badge>Synthetic patient</Badge>
            </div>
          </div>
          {history.isPending ? (
            <Loading label="Loading prior samples…" />
          ) : history.isError ? (
            <ErrorPanel
              title="Could not load history"
              error={history.error}
              onRetry={() => void history.refetch()}
            />
          ) : (
            <>
              <div className="history-context">
                <span>Lookback starts {formatDate(history.data.lookback_start)}</span>
                <span>Strict cutoff {formatDate(history.data.cutoff)}</span>
              </div>
              {history.data.cultures.length === 0 ? (
                <EmptyState title="No recorded samples in this lookback period">
                  This does not establish the absence of resistance history outside the selected
                  period.
                </EmptyState>
              ) : (
                <>
                  <div className="history-toolbar">
                    <strong>{history.data.cultures.length} prior cultures</strong>
                    <Button
                      variant="ghost"
                      onClick={() => setExpanded(!expanded)}
                      aria-pressed={expanded}
                    >
                      {expanded ? 'Compact results' : 'Expand all results'}
                    </Button>
                  </div>
                  <div className="history-timeline">
                    {history.data.cultures.map((c) => (
                      <article key={c.culture_id} className="history-culture">
                        <span className="history-marker">
                          <FlaskConical size={15} />
                        </span>
                        <div className="culture-heading">
                          <h3>{formatDate(c.sample_date)}</h3>
                          <Badge>{c.specimen}</Badge>
                        </div>
                        <p>
                          {c.ward} <span className="separator-dot">·</span> {c.culture_id}
                        </p>
                        {c.isolates.length === 0 ? (
                          <div className="negative-culture">{c.result}</div>
                        ) : (
                          c.isolates.map((i) => (
                            <div className="history-isolate" key={i.isolate_id}>
                              <h4>{i.organism}</h4>
                              {i.phenotypes.map((flag) => (
                                <Badge tone="warning" key={flag}>
                                  {flag}
                                </Badge>
                              ))}
                              <DataTable label={`Susceptibility results for ${i.isolate_id}`}>
                                <table>
                                  <caption className="sr-only">
                                    Recorded laboratory susceptibility
                                  </caption>
                                  <thead>
                                    <tr>
                                      <th>Antibiotic</th>
                                      <th>Result</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {i.tests.slice(0, expanded ? undefined : 3).map((t) => (
                                      <tr key={t.antibiotic_code}>
                                        <td>
                                          {t.label}
                                          {t.screening && (
                                            <small className="screening-label">
                                              Screening test
                                            </small>
                                          )}
                                        </td>
                                        <td>
                                          <Badge tone={t.result === 'S' ? 'success' : 'danger'}>
                                            {t.result === 'S' ? 'S · Susceptible' : 'R · Resistant'}
                                          </Badge>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </DataTable>
                            </div>
                          ))
                        )}
                      </article>
                    ))}
                  </div>
                </>
              )}
              <p className="small-note">
                Collection dates do not establish when results became available. Unlisted
                antibiotics have no recorded result.
              </p>
            </>
          )}
        </>
      )}
    </Drawer>
  );
}
