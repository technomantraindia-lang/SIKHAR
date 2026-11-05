import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeftRight,
  BarChart3,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Download,
  FileText,
  Printer,
  Receipt,
  RefreshCw,
  TrendingUp,
  Wallet
} from '../common/Icons';
import {
  fetchAssetFinancingApi,
  fetchDashboardApi,
  fetchFinanceReportApi,
  fetchPayablesApi,
  fetchReceivablesApi
} from '../../services/api';

const REPORT_CARDS = [
  { route: 'finance-pnl', title: 'P&L Statement', description: 'Revenue, expenses, net profit/loss and margin', icon: BarChart3, tone: 'blue' },
  { route: 'finance-cash-flow', title: 'Cash Flow', description: 'Money in/out, net movement and daily close controls', icon: ArrowLeftRight, tone: 'green' },
  { route: 'finance-accounts-receivable', title: 'Accounts Receivable', description: 'Outstanding, ageing, collections and DSO', icon: Receipt, tone: 'orange' },
  { route: 'finance-customer-soa', title: 'Customer SOA', description: 'Customer-level running account and ledger', icon: FileText, tone: 'violet' },
  { route: 'finance-accounts-payable', title: 'Accounts Payable', description: 'Vendor spend, ageing and payment obligations', icon: Wallet, tone: 'red' },
  { route: 'finance-asset-financing', title: 'Asset EMI / Financing', description: 'Financed assets, EMI burden and recovery', icon: TrendingUp, tone: 'slate' }
];

const numberValue = (value) => Number(value || 0);

function money(value, placeholder = '—') {
  if (value === null || value === undefined || value === '') return placeholder;
  return `₹${numberValue(value).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}

function percent(value, placeholder = '—') {
  if (value === null || value === undefined || value === '') return placeholder;
  return `${numberValue(value).toLocaleString('en-IN', { maximumFractionDigits: 1 })}%`;
}

function dateLabel(value) {
  if (!value) return 'Latest available';
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function csvCell(value) {
  return `"${String(value ?? '').replaceAll('"', '""')}"`;
}

function exportManagementPack(scorecard, reports) {
  const rows = [
    ['Sikhar Fleet Management Report Pack'],
    ['Metric', 'Value'],
    ...scorecard.map(item => [item.label, item.value]),
    [],
    ['Report', 'Status', 'Source'],
    ...reports.map(item => [item.title, 'Available', item.description])
  ];
  const csv = rows.map(row => row.map(csvCell).join(',')).join('\n');
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = 'sikhar-management-report-pack.csv';
  link.click();
  URL.revokeObjectURL(url);
}

function KpiCard({ label, value, detail, tone = 'neutral', icon: Icon }) {
  return (
    <article className={`management-report-kpi ${tone}`}>
      <div className="management-report-kpi-top"><span>{label}</span><Icon size={16} /></div>
      <strong>{value}</strong>
      <small>{detail}</small>
    </article>
  );
}

function ReportCard({ item, onNavigate }) {
  const Icon = item.icon;
  return (
    <button className={`management-report-card ${item.tone}`} onClick={() => onNavigate?.(item.route)}>
      <span className="management-report-card-icon"><Icon size={18} /></span>
      <span className="management-report-card-copy"><strong>{item.title}</strong><small>{item.description}</small></span>
      <ChevronRight size={16} />
    </button>
  );
}

export default function ManagementReportsPage({ onBackToDashboard, onNavigate }) {
  const [bundle, setBundle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [period, setPeriod] = useState({ from: '', to: '' });
  const [draftPeriod, setDraftPeriod] = useState({ from: '', to: '' });
  const [reloadToken, setReloadToken] = useState(0);

  const loadReports = useCallback(async () => {
    setLoading(true);
    setError('');
    const results = await Promise.allSettled([
      fetchFinanceReportApi('pnl', period),
      fetchFinanceReportApi('cash-flow', period),
      fetchReceivablesApi(),
      fetchPayablesApi(),
      fetchAssetFinancingApi('month'),
      fetchDashboardApi()
    ]);
    const [pnl, cashFlow, receivables, payables, financing, dashboard] = results.map(result => result.status === 'fulfilled' ? result.value : null);
    if (!pnl && !cashFlow && !receivables && !payables && !financing) {
      setError('Management reports could not be loaded from the connected sources.');
    }
    setBundle({ pnl, cashFlow, receivables, payables, financing, dashboard });
    if (!period.from && pnl?.period?.from) {
      const nextPeriod = { from: pnl.period.from, to: pnl.period.to };
      setPeriod(nextPeriod);
      setDraftPeriod(nextPeriod);
    }
    setLoading(false);
  }, [period]);

  useEffect(() => { loadReports(); }, [loadReports, reloadToken]);

  const pnlSummary = bundle?.pnl?.summary || {};
  const cashSummary = bundle?.cashFlow?.summary || {};
  const arSummary = bundle?.receivables?.summary || {};
  const apSummary = bundle?.payables?.summary || {};
  const emiSummary = bundle?.financing?.summary || {};
  const dashboardMetrics = bundle?.dashboard?.metrics || {};

  const utilization = dashboardMetrics.utilizedStock?.subline?.match(/[0-9]+(?:\.[0-9]+)?/)?.[0]
    || dashboardMetrics.utilization?.value
    || null;

  const scorecard = useMemo(() => [
    { label: 'Fleet utilization', value: percent(utilization), tone: 'positive' },
    { label: 'Recognised revenue', value: money(pnlSummary.revenue), tone: 'positive' },
    { label: 'Collections', value: money(arSummary.collectionsThisMonth), tone: 'positive' },
    { label: 'Wallet health', value: `${dashboardMetrics.walletBreached?.value || '—'} breached`, tone: 'negative' },
    { label: 'Credit notes / waivers', value: money(pnlSummary.waivers), tone: 'negative' },
    { label: 'Vendor payables', value: money(apSummary.totalPayable), tone: 'warning' },
    { label: 'Free cash flow', value: money(cashSummary.netMovement), tone: 'positive' }
  ], [arSummary.collectionsThisMonth, apSummary.totalPayable, cashSummary.netMovement, dashboardMetrics.walletBreached, pnlSummary.revenue, pnlSummary.waivers, utilization]);

  const actions = [
    { label: 'Recover overdue customer balances', value: arSummary.overdueCustomers ?? '—', tone: 'negative', route: 'finance-accounts-receivable' },
    { label: 'Review open receivables', value: arSummary.unpaidInvoices ?? '—', tone: 'warning', route: 'finance-accounts-receivable' },
    { label: 'Reconcile vendor bills', value: apSummary.openBills ?? '—', tone: 'warning', route: 'finance-accounts-payable' },
    { label: 'Review EMI coverage shortfall', value: emiSummary.coverage == null ? '—' : percent(emiSummary.coverage), tone: emiSummary.coverage < 100 ? 'negative' : 'positive', route: 'finance-asset-financing' },
    { label: 'Close daily cash flow', value: 'Open', tone: 'blue', route: 'finance-cash-flow' }
  ];

  const categoryRows = Object.entries(bundle?.pnl?.categoryTotals || {})
    .map(([label, value]) => ({ label, value: numberValue(value) }))
    .sort((a, b) => Math.abs(b.value) - Math.abs(a.value))
    .slice(0, 5);
  const largestCategory = Math.max(...categoryRows.map(row => Math.abs(row.value)), 1);

  const applyPeriod = () => {
    if (!draftPeriod.from || !draftPeriod.to || draftPeriod.from > draftPeriod.to) return;
    setPeriod({ ...draftPeriod });
  };

  const scorecardWithSource = scorecard.map(item => ({ ...item, value: item.value || '—' }));
  const sourceLabel = bundle?.pnl?.dataSource?.label || 'Connected finance sources';

  return (
    <div className="terminal-content management-reports-stage">
      <div className="management-reports-hero">
        <div>
          <div className="breadcrumb-nav"><span className="breadcrumb-link" onClick={onBackToDashboard}>Dashboard</span><ChevronRight size={13} className="breadcrumb-sep" /><span className="breadcrumb-link">Finance</span><ChevronRight size={13} className="breadcrumb-sep" /><span className="breadcrumb-active">Management Reports</span></div>
          <div className="finance-page-eyebrow">FINANCE / LEADERSHIP CONTROL</div>
          <h1 className="management-reports-title">Management Reports</h1>
          <p className="management-reports-description">Decision-ready finance summaries and operational scorecards for leadership review, controls and monthly close.</p>
        </div>
        <div className="management-reports-actions">
          <button className="btn" onClick={() => setReloadToken(token => token + 1)}><RefreshCw size={15} /> Refresh</button>
          <button className="btn" onClick={() => window.print()}><Printer size={15} /> Print</button>
          <button className="btn primary" onClick={() => exportManagementPack(scorecardWithSource, REPORT_CARDS)}><Download size={15} /> Export management pack</button>
        </div>
      </div>

      <div className="management-reports-toolbar">
        <div className="management-period-heading"><Calendar size={16} /><span>Reporting period</span></div>
        <label><span>From</span><input type="date" value={draftPeriod.from} onChange={event => setDraftPeriod(previous => ({ ...previous, from: event.target.value }))} /></label>
        <label><span>To</span><input type="date" value={draftPeriod.to} onChange={event => setDraftPeriod(previous => ({ ...previous, to: event.target.value }))} /></label>
        <button className="btn primary" onClick={applyPeriod}>Apply period</button>
        <button className="btn" onClick={() => { setPeriod({}); setDraftPeriod({}); }}>Latest available</button>
        <span className="management-source-pill"><span />{sourceLabel} {bundle?.pnl?.dataSource?.connected ? '· live' : ''}</span>
      </div>

      {error && <div className="management-reports-error"><AlertTriangle size={16} />{error}</div>}

      {loading && !bundle ? (
        <div className="management-reports-loading"><RefreshCw size={22} className="spin-icon" />Building management report pack from connected records…</div>
      ) : (
        <>
          <div className="management-report-kpi-grid">
            <KpiCard label="RECOGNISED REVENUE" value={money(pnlSummary.revenue)} detail={`${dateLabel(bundle?.pnl?.period?.from)} → ${dateLabel(bundle?.pnl?.period?.to)}`} tone="income" icon={TrendingUp} />
            <KpiCard label="APPROVED EXPENSES" value={money(pnlSummary.expenses)} detail="Posted operating expense lines" tone="expense" icon={Receipt} />
            <KpiCard label="NET PROFIT / (LOSS)" value={money(pnlSummary.netProfit)} detail={`${pnlSummary.grossMargin ?? '—'}% operating margin`} tone={pnlSummary.netProfit < 0 ? 'loss' : 'profit'} icon={BarChart3} />
            <KpiCard label="TOTAL OUTSTANDING" value={money(arSummary.totalOutstanding)} detail={`${arSummary.overdueCustomers ?? '—'} customers overdue`} tone="warning" icon={AlertTriangle} />
            <KpiCard label="VENDOR PAYABLE" value={money(apSummary.totalPayable)} detail={`${apSummary.openBills ?? '—'} open bills`} tone="neutral" icon={Wallet} />
            <KpiCard label="NET CASH MOVEMENT" value={money(cashSummary.netMovement)} detail={`${cashSummary.inflowCount ?? '—'} inflows · ${cashSummary.outflowCount ?? '—'} outflows`} tone={cashSummary.netMovement < 0 ? 'loss' : 'profit'} icon={ArrowLeftRight} />
          </div>

          <section className="management-report-section">
            <div className="management-section-heading"><div><span className="management-kicker">REPORT LIBRARY</span><h2>Open a management report</h2><p>Each screen keeps its source records, controls and audit notes visible.</p></div><span className="management-section-count">{REPORT_CARDS.length} connected views</span></div>
            <div className="management-report-library">{REPORT_CARDS.map(item => <ReportCard key={item.route} item={item} onNavigate={onNavigate} />)}</div>
          </section>

          <div className="management-report-grid-two">
            <section className="management-report-panel">
              <div className="management-panel-heading"><div><span className="management-kicker">CEO DAILY SCORECARD</span><h2>What needs leadership attention</h2></div><CheckCircle2 size={18} /></div>
              <div className="management-scorecard-list">{scorecardWithSource.map(item => <div className="management-scorecard-row" key={item.label}><span>{item.label}</span><strong className={item.tone}>{item.value}</strong></div>)}</div>
            </section>
            <section className="management-report-panel management-action-panel">
              <div className="management-panel-heading"><div><span className="management-kicker">MANAGEMENT ACTION QUEUE</span><h2>Next decisions to close</h2></div><AlertTriangle size={18} /></div>
              <div className="management-action-list">{actions.map(action => <button className="management-action-row" key={action.label} onClick={() => onNavigate?.(action.route)}><span>{action.label}</span><strong className={action.tone}>{action.value}</strong><ChevronRight size={15} /></button>)}</div>
            </section>
          </div>

          <div className="management-report-grid-two">
            <section className="management-report-panel">
              <div className="management-panel-heading"><div><span className="management-kicker">PROFITABILITY MIX</span><h2>What is driving the result</h2></div><BarChart3 size={18} /></div>
              <div className="management-category-chart">{categoryRows.length ? categoryRows.map(row => <div className="management-category-row" key={row.label}><div><span>{row.label}</span><strong className={row.value < 0 ? 'negative' : 'positive'}>{money(Math.abs(row.value))}</strong></div><div className={`management-category-track ${row.value < 0 ? 'expense' : ''}`}><span style={{ width: `${Math.max(6, Math.abs(row.value) / largestCategory * 100)}%` }} /></div></div>) : <div className="management-empty">No category totals available for this period.</div>}</div>
              <div className="management-panel-note">Revenue and approved expense lines are sourced from the finance ledger. Click P&L Statement for the full category and period breakdown.</div>
            </section>
            <section className="management-report-panel">
              <div className="management-panel-heading"><div><span className="management-kicker">CASH CONTROL</span><h2>Cash movement at a glance</h2></div><ArrowLeftRight size={18} /></div>
              <div className="management-cash-visual"><div className="management-cash-bar"><span style={{ width: `${Math.min(100, numberValue(cashSummary.totalInflow) / Math.max(numberValue(cashSummary.totalInflow), numberValue(cashSummary.totalOutflow), 1) * 100)}%` }} /></div><div className="management-cash-legend"><div><span className="management-dot inflow" />Inflow <strong>{money(cashSummary.totalInflow)}</strong></div><div><span className="management-dot outflow" />Outflow <strong>{money(cashSummary.totalOutflow)}</strong></div></div></div>
              <div className="management-cash-result"><span>Net movement</span><strong className={cashSummary.netMovement < 0 ? 'negative' : 'positive'}>{money(cashSummary.netMovement)}</strong></div>
              <div className="management-panel-note">Internal wallet movements stay excluded from external cash flow until they are posted as verified ledger entries.</div>
            </section>
          </div>

          <section className="management-report-panel management-pack-panel">
            <div className="management-panel-heading"><div><span className="management-kicker">MANAGEMENT PACK</span><h2>Included reports and control purpose</h2></div><FileText size={18} /></div>
            <div className="management-pack-table-wrap"><table className="management-pack-table"><thead><tr><th>Report</th><th>Leadership question</th><th>Source status</th><th /></tr></thead><tbody>{REPORT_CARDS.map(item => <tr key={item.route}><td><strong>{item.title}</strong></td><td>{item.description}</td><td><span className="management-status"><span />Available</span></td><td><button className="management-table-link" onClick={() => onNavigate?.(item.route)}>Open <ChevronRight size={14} /></button></td></tr>)}</tbody></table></div>
          </section>
        </>
      )}
    </div>
  );
}
