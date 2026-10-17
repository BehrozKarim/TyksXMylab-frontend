import { useEffect, useRef, useState } from 'react';
import { useIsFetching, useQueryClient } from '@tanstack/react-query';
import {
  Activity,
  ArrowDownToLine,
  ArrowRight,
  BookOpen,
  ChevronRight,
  CircleHelp,
  FlaskConical,
  LayoutDashboard,
  Menu,
  Microscope,
  PanelLeftClose,
  UsersRound,
  SearchCheck,
  BellDot,
} from 'lucide-react';
import { Link, Navigate, Route, Routes, useLocation, useSearchParams } from 'react-router-dom';
import { api, DATA_MODE } from '../api/client';
import type { Analysis, CohortQuery, Meta, ReplayState, WindowKey } from '../api/contracts';
import { useAnalysis, useMeta, useReplayState } from './queries';
import { Button, Drawer, ErrorPanel, Loading } from '../components/ui';
import { rememberTrigger } from '../components/focus';
import { readCohort, writeCohort } from '../domain/cohort';
import { cohortLabel, drugLabel, formatDate } from '../domain/formatters';
import { CohortControls } from '../features/CohortControls';
import { EvidenceCards } from '../features/EvidenceCards';
import { AntibioticComparison } from '../features/AntibioticComparison';
import { ReviewFlags } from '../features/ReviewFlags';
import { PatientHistoryDrawer } from '../features/PatientHistoryDrawer';
import { ProvenanceDrawer } from '../features/ProvenanceDrawer';
import { InvestigationPage } from '../features/InvestigationPage';
import { CohortInvestigation } from '../features/CohortInvestigation';
import { SusceptibilityTrend } from '../features/SusceptibilityTrend';
import { ResistanceAlerts, ResistanceInvestigation } from '../features/ResistanceAlerts';

function Brand() {
  return (
    <span className="brand">
      <span className="brand-mark">
        <svg width="29" height="29" viewBox="0 0 40 40" fill="none" aria-hidden="true">
          <path
            d="M9 11v13a6 6 0 0 0 11 3 6 6 0 0 0 11-3V11M20 14v13"
            stroke="currentColor"
            strokeWidth="3.3"
            strokeLinecap="round"
          />
        </svg>
      </span>
      <span className="brand-type">
        ward<span>evidence</span>
      </span>
    </span>
  );
}
function Workspace({
  meta,
  state,
  updatesConnected,
}: {
  meta: Meta;
  state: ReplayState;
  updatesConnected: boolean;
}) {
  const updating = useIsFetching({ queryKey: ['analysis'] }) > 0;
  const [search, setSearch] = useSearchParams();
  const location = useLocation();
  const { query, issues, pinned } = readCohort(search, meta, state);
  const [patientOpen, setPatientOpen] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const [provenance, setProvenance] = useState<{ analysis: Analysis; window?: WindowKey } | null>(
    null,
  );
  const client = useQueryClient();
  const previousRun = useRef(state.run_id);
  useEffect(() => {
    if (previousRun.current !== state.run_id) {
      const oldRun = previousRun.current;
      void client.cancelQueries({
        predicate: (q) => q.queryKey[0] === 'analysis' && q.queryKey[2] === oldRun,
      });
      client.removeQueries({
        predicate: (q) => q.queryKey[0] === 'analysis' && q.queryKey[2] === oldRun,
      });
      setPatientOpen(false);
      setProvenance(null);
      previousRun.current = state.run_id;
    }
  }, [state.run_id, client]);
  useEffect(() => {
    if (!navOpen) return;
    const close = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setNavOpen(false);
        document.querySelector<HTMLElement>('[aria-label="Toggle navigation"]')?.focus();
      }
    };
    document.addEventListener('keydown', close);
    return () => document.removeEventListener('keydown', close);
  }, [navOpen]);
  const investigation = location.pathname.startsWith('/investigate');
  const alertsPage = location.pathname.startsWith('/alerts');
  const serialized = writeCohort(query, pinned).toString();
  const searchString = search.toString();
  useEffect(() => {
    if (!issues.length && serialized !== searchString) setSearch(serialized, { replace: true });
  }, [serialized, searchString, setSearch, issues.length]);
  useEffect(() => {
    setNavOpen(false);
    (document.querySelector<HTMLElement>('h1') ?? document.getElementById('main-content'))?.focus();
    window.scrollTo({ top: 0 });
  }, [location.pathname]);
  const apply = (next: CohortQuery, datePinned = pinned) =>
    setSearch(writeCohort(next, datePinned));
  const showProvenance = (analysis: Analysis, window?: WindowKey) => {
    rememberTrigger();
    setProvenance({ analysis, window });
  };
  const showPatients = () => {
    rememberTrigger();
    setPatientOpen(true);
  };
  const showGuide = () => {
    rememberTrigger();
    setGuideOpen(true);
  };
  return (
    <div className="app-shell">
      <a href="#main-content" className="skip-link">
        Skip to evidence
      </a>
      <aside className={`sidebar ${navOpen ? 'sidebar--open' : ''}`} aria-label="Main navigation">
        <Link to={`/ward?${search}`} className="brand-link" aria-label="Ward Evidence home">
          <Brand />
        </Link>
        <div className="workspace-label">WORKSPACE</div>
        <nav>
          <Link
            aria-label="Ward overview"
            className={`nav-item ${!investigation && !alertsPage ? 'active' : ''}`}
            aria-current={!investigation && !alertsPage ? 'page' : undefined}
            to={`/ward?${search}`}
          >
            <LayoutDashboard size={19} />
            <span>Ward overview</span>
          </Link>
          <Link
            aria-label="Investigate susceptibility"
            className={`nav-item ${investigation ? 'active' : ''}`}
            aria-current={investigation ? 'page' : undefined}
            to={`/investigate?${search}`}
          >
            <SearchCheck size={19} />
            <span>Investigate susceptibility</span>
          </Link>
          {meta.capabilities?.alerts && (
            <Link
              className={`nav-item ${alertsPage ? 'active' : ''}`}
              aria-label="Resistance alerts"
              aria-current={alertsPage ? 'page' : undefined}
              to={`/alerts?${search}`}
            >
              <BellDot size={19} />
              <span>Resistance alerts</span>
            </Link>
          )}
          <button className="nav-item" aria-label="Patient history" onClick={showPatients}>
            <UsersRound size={19} />
            <span>Patient history</span>
          </button>
        </nav>
        <div className="sidebar-divider" />
        <div className="workspace-label">RESOURCES</div>
        <button className="nav-item" aria-label="Reading the evidence" onClick={showGuide}>
          <BookOpen size={19} />
          <span>Reading the evidence</span>
        </button>
        <div className="sidebar-bottom">
          <div className="sidebar-lab">
            <span className="sidebar-lab-icon">
              <Microscope size={23} />
            </span>
            <h3>Tyks × Mylab</h3>
            <p>Laboratory susceptibility research.</p>
            <button onClick={showGuide}>
              About this workspace <ArrowRight size={14} />
            </button>
          </div>
          <div className="partner-mark">
            TYKS <span>×</span> mylab
            <span className="partner-sub">JunctionX Turku · Prototype</span>
          </div>
        </div>
      </aside>
      {navOpen && (
        <button
          className="mobile-backdrop"
          aria-label="Close navigation"
          onClick={() => setNavOpen(false)}
        />
      )}
      <div className="app-body">
        <header className="topbar">
          <div className="topbar-left">
            <Button
              variant="ghost"
              className="mobile-menu icon-button"
              aria-label="Toggle navigation"
              aria-expanded={navOpen}
              onClick={() => setNavOpen(!navOpen)}
            >
              {navOpen ? <PanelLeftClose size={20} /> : <Menu size={20} />}
            </Button>
            <span className="topbar-title">Clinical surveillance</span>
            <ChevronRight size={14} />
            <span className="topbar-current">
              {alertsPage ? 'Resistance alerts' : investigation ? 'Investigation' : 'Ward overview'}
            </span>
          </div>
          <div className="topbar-right">
            <span className="synthetic-label">
              <span />
              {state.mode === 'feed' ? 'External feed' : 'Synthetic data'}
            </span>
            <span className="topbar-divider" />
            <Button
              variant="ghost"
              className="icon-button"
              aria-label="About this workspace"
              onClick={showGuide}
            >
              <CircleHelp size={19} />
            </Button>
            <span className="workspace-avatar" aria-label="Research workspace">
              WE
            </span>
          </div>
        </header>
        <main id="main-content" className="main-content" tabIndex={-1}>
          {state.mode === 'feed' && (
            <p className="inline-notice feed-status">
              <strong>{state.feed_source_label ?? 'External feed'}</strong> ·{' '}
              {updatesConnected ? 'Live updates connected' : 'Checking for updates'}
              {' · '}
              {state.clock_mode === 'wall_utc' ? 'UTC reporting date' : 'Simulated reporting date'}
              {state.status === 'receiving' && ' · Receiving results'}
            </p>
          )}
          {updating && (
            <p className="small-note" role="status">
              Updating analyses… Any results still visible belong to their displayed saved snapshot.
            </p>
          )}
          {DATA_MODE === 'fixtures' && (
            <div className="fixture-notice">
              <FlaskConical size={15} />
              <span>
                {DATA_MODE === 'fixtures' ? (
                  <>
                    <strong>Fixture preview</strong>
                    <span className="notice-divider">/</span>Authored examples for exploring the
                    interface. Not findings from the source dataset.
                  </>
                ) : (
                  <>
                    <strong>Synthetic research workspace</strong>
                    <span className="notice-divider">/</span>Connected to the configured evidence
                    API.
                  </>
                )}
              </span>
              <button onClick={showGuide}>
                Details <ArrowRight size={13} />
              </button>
            </div>
          )}
          {issues.length > 0 && (
            <div className="validation-notice" role="alert">
              <strong>Some link values needed attention.</strong> {issues.join(' ')} The controls
              below show the explicit defaults.
            </div>
          )}
          <Routes>
            <Route path="/" element={<Navigate to={`/ward?${search}`} replace />} />
            <Route
              path="/ward"
              element={
                <WardPage
                  meta={meta}
                  state={state}
                  query={query}
                  pinned={pinned}
                  search={`?${search}`}
                  onApply={apply}
                  onPatients={showPatients}
                  onProvenance={showProvenance}
                />
              }
            />
            <Route
              path="/investigate"
              element={
                <CohortInvestigation
                  state={state}
                  meta={meta}
                  query={query}
                  onApply={apply}
                  onProvenance={showProvenance}
                />
              }
            />
            <Route
              path="/investigate/:investigationId"
              element={
                DATA_MODE === 'api' ? (
                  <ResistanceInvestigation state={state} meta={meta} />
                ) : (
                  <InvestigationPage state={state} meta={meta} onProvenance={showProvenance} />
                )
              }
            />
            <Route
              path="/alerts"
              element={
                <ResistanceAlerts
                  state={state}
                  meta={meta}
                  reportDate={query.as_of}
                  onLatest={() => apply({ ...query, as_of: state.demo_date }, false)}
                />
              }
            />
            <Route
              path="*"
              element={
                <div className="not-found">
                  <h1>Page not found</h1>
                  <p>Return to the ward workspace to continue.</p>
                  <Link className="button button--primary" to="/ward">
                    Open ward overview
                  </Link>
                </div>
              }
            />
          </Routes>
          <footer className="page-footer">
            <span>
              <span className="tiny-dot" />
              Imported dataset: {formatDate(meta.source.start)} – {formatDate(meta.source.end)}
              {state.mode === 'feed' && ' · Feed completeness is not certified'}
            </span>
            <span>
              {state.method_version} <span className="separator-dot">·</span> Snapshot{' '}
              {state.state_revision} <span className="separator-dot">·</span> {state.run_id}
            </span>
          </footer>
        </main>
      </div>
      {patientOpen && (
        <PatientHistoryDrawer
          key={state.run_id}
          open={patientOpen}
          onClose={() => setPatientOpen(false)}
          state={state}
          asOf={query.as_of}
          meta={meta}
        />
      )}
      <ProvenanceDrawer
        key={provenance?.analysis.analysis_id ?? 'closed'}
        analysis={provenance?.analysis ?? null}
        window={provenance?.window}
        meta={meta}
        onClose={() => setProvenance(null)}
      />
      <Drawer
        open={guideOpen}
        onClose={() => setGuideOpen(false)}
        title="Reading the evidence"
        description="A research workspace for understanding observed laboratory susceptibility."
      >
        <div className="guide-hero">
          <Activity size={30} />
          <h3>Every number needs its context.</h3>
          <p>
            Choose a cohort, read its last 12-month and 28-day evidence, then investigate the
            counts.
          </p>
        </div>
        <div className="drawer-section">
          <h3>What these results mean</h3>
          <p>
            Susceptible and resistant describe recorded laboratory results. The interval describes
            uncertainty in the observed proportion; it does not predict treatment success.
          </p>
          <p>
            At least 30 tested isolates are required to display a percentage. Missing tests remain
            visible and do not count as resistance.
          </p>
        </div>
        <div className="drawer-section">
          <h3>About this preview</h3>
          <p>
            {DATA_MODE === 'fixtures'
              ? 'This preview uses authored fixtures for interface testing.'
              : 'Evidence is requested from the published dataset API. Each export retains its original analysis snapshot.'}
          </p>
          <p>
            The source contains synthetic microbiology samples. The report end date sets both
            rolling periods; the chart year applies only to the time chart.
          </p>
        </div>
        {DATA_MODE === 'fixtures' && (
          <div className="drawer-section">
            <h3>Explore support states</h3>
            <p>
              In fixture mode: Urology demonstrates available evidence; Intensive care shows a
              sparse recent cohort; Geriatrics shows missing tests; Health centre North shows an
              empty cohort. Mecillinam demonstrates a paired denominator below 30.
            </p>
          </div>
        )}
        <div className="small-note">
          Tyks × Mylab · JunctionX Turku
          <br />A prototype using synthetic microbiology evidence.
        </div>
      </Drawer>
    </div>
  );
}
function WardPage({
  meta,
  state,
  query,
  pinned,
  search,
  onApply,
  onPatients,
  onProvenance,
}: {
  meta: Meta;
  state: ReplayState;
  query: CohortQuery;
  pinned: boolean;
  search: string;
  onApply: (q: CohortQuery, pinned?: boolean) => void;
  onPatients: () => void;
  onProvenance: (a: Analysis, w?: WindowKey) => void;
}) {
  const evidence = useAnalysis('evidence', state, query, (signal) =>
    api.evidence(query, state, signal),
  );
  return (
    <>
      <div className="page-heading">
        <div>
          <div className="page-eyebrow">
            <span className="eyebrow">Antibiotic susceptibility</span>
            <span className="heading-dash" />
            <span className="heading-hospital">Tyks × Mylab</span>
          </div>
          <h1 tabIndex={-1}>Ward overview</h1>
          <p>Choose a cohort. See how susceptibility compares over time.</p>
        </div>
        <div className="heading-actions">
          <Link className="button button--primary" to={`/investigate${search}`}>
            <SearchCheck size={17} />
            Investigate cohort
          </Link>
          <Button
            disabled={!evidence.data}
            onClick={() => evidence.data && onProvenance(evidence.data)}
          >
            <ArrowDownToLine size={16} />
            Export snapshot
          </Button>
        </div>
      </div>
      <div className="overview-toolbar">
        <div className="date-controls">
          <label className="field inline-field">
            <span>Report end date</span>
            <input
              type="date"
              aria-describedby="report-date-help"
              value={query.as_of}
              min={meta.source.start}
              max={state.demo_date}
              onChange={(e) => {
                if (e.target.value)
                  onApply(
                    {
                      ...query,
                      as_of: e.target.value,
                      calendar_year: Math.min(
                        query.calendar_year,
                        Number(e.target.value.slice(0, 4)),
                      ),
                    },
                    true,
                  );
              }}
            />
          </label>
          {pinned ? (
            <Button
              variant="ghost"
              onClick={() => onApply({ ...query, as_of: state.demo_date }, false)}
            >
              Use latest date
            </Button>
          ) : (
            <span className="following-label">
              <span />
              Latest published samples
            </span>
          )}
        </div>
      </div>
      <p id="report-date-help" className="report-date-help">
        Both headline periods end on this date. The chart year below affects only the time chart.
      </p>
      <CohortControls key={JSON.stringify(query)} query={query} meta={meta} onApply={onApply} />
      <div className="applied-context">
        <p>
          <span className="context-indicator" /> {cohortLabel(query, meta)}
        </p>
        <Button variant="ghost" onClick={onPatients}>
          <UsersRound size={16} />
          Patient history <ArrowRight size={14} />
        </Button>
      </div>
      <div className="evidence-section-title">
        <div>
          <h2>Susceptibility at a glance</h2>
          <p>
            <strong>{drugLabel(query.antibiotic_code, meta)}</strong> · observed laboratory
            susceptibility
          </p>
          <p className="period-overlap-note">
            The last 12 months includes the recent 28 days. These are overlapping time periods.
          </p>
        </div>
      </div>
      <div aria-live="polite" className="sr-only">
        {evidence.data
          ? `Evidence loaded for ${cohortLabel(evidence.data.context.filters, meta)}, through ${formatDate(evidence.data.context.as_of)}.`
          : 'Updating evidence.'}
      </div>
      {evidence.isPending ? (
        <div className="period-loading" aria-busy="true">
          <Loading />
          {[1].map((n) => (
            <div className="skeleton-card" key={n} />
          ))}
        </div>
      ) : evidence.isError ? (
        <ErrorPanel error={evidence.error} onRetry={() => void evidence.refetch()} />
      ) : (
        <EvidenceCards
          evidence={evidence.data}
          onProvenance={(window) => onProvenance(evidence.data, window)}
          onLongerWindow={() => {
            onApply({ ...query, window: 'rolling_12m' });
            document.getElementById('comparison')?.scrollIntoView({ behavior: 'smooth' });
          }}
        />
      )}
      <AntibioticComparison
        query={query}
        state={state}
        meta={meta}
        onChange={onApply}
        onProvenance={onProvenance}
      />
      <SusceptibilityTrend
        key={`${query.calendar_year}-${query.as_of}`}
        query={query}
        state={state}
        meta={meta}
        onProvenance={onProvenance}
        onYearChange={(year) => onApply({ ...query, calendar_year: year })}
      />
      {DATA_MODE === 'fixtures' && (
        <details className="data-disclosure fixture-flags" id="review">
          <summary>Authored resistance-alert scenario</summary>
          <ReviewFlags
            state={state}
            asOf={query.as_of}
            search={search}
            onFollow={() => onApply({ ...query, as_of: state.demo_date }, false)}
          />
        </details>
      )}
    </>
  );
}
export default function App() {
  const meta = useMeta();
  const state = useReplayState();
  if (meta.isPending || state.isPending)
    return (
      <div className="boot-screen">
        <Brand />
        <Loading label="Preparing your evidence workspace…" />
      </div>
    );
  if (meta.isError || state.isError)
    return (
      <div className="boot-screen">
        <Brand />
        <ErrorPanel
          error={meta.error ?? state.error}
          title="Could not open the workspace"
          onRetry={() => {
            void meta.refetch();
            void state.refetch();
          }}
        />
      </div>
    );
  return (
    <Workspace meta={meta.data} state={state.data} updatesConnected={state.updatesConnected} />
  );
}
