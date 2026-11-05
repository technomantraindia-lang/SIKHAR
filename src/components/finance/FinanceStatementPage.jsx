import React, { useEffect, useMemo, useState } from 'react';
import {
  BarChart3,
  Calendar,
  ChevronRight,
  Download,
  FileText,
  Info,
  Printer,
  RefreshCw,
  TrendingUp
} from '../common/Icons';
import { fetchFinanceReportApi } from '../../services/api';

const REPORT_COPY = {
  pnl: {
    title: 'P&L Statement',
    eyebrow: 'FINANCE / PROFITABILITY',
    description: 'A clean view of recognised revenue, approved costs and the operating result for the selected period.',
    empty: 'No approved income or expense records fall inside this period.'
  },
  'cash-flow': {
    title: 'Cash Flow',
    eyebrow: 'FINANCE / CASH MOVEMENT',
    description: 'External receipts, wallet funding, escrow deposits and verified payments—without double-counting internal wallet movements.',
    empty: 'No external cash movements fall inside this period.'
  }
};

function formatMoney(value, sign = '') {
  const number = Number(value || 0);
  return `${sign}₹${Math.abs(number).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
}

function formatDate(value) {
  if (!value) return '—';
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function percentageChange(current, previous) {
  const now = Number(current || 0);
  const before = Number(previous || 0);
  if (!before) return now ? 'New period' : 'No change';
  const change = ((now - before) / Math.abs(before)) * 100;
  return `${change >= 0 ? '+' : ''}${change.toFixed(1)}% vs previous period`;
}

function changeValue(current, previous) {
  const now = Number(current || 0);
  const before = Number(previous || 0);
  if (!before) return now ? 'New' : '—';
  const change = ((now - before) / Math.abs(before)) * 100;
  return `${change >= 0 ? '+' : ''}${change.toFixed(1)}%`;
}

function StatCard({ label, value, subline, tone = '', icon }) {
  return (
    <div className={`finance-statement-stat ${tone}`}>
      <div className="finance-statement-stat-top">
        <div className="finance-statement-stat-label">{label}</div>
        <span className="finance-statement-stat-icon">{icon}</span>
      </div>
      <div className="finance-statement-stat-value">{value}</div>
      <div className="finance-statement-stat-subline">{subline}</div>
    </div>
  );
}

function EmptyState({ message }) {
  return (
    <div className="finance-statement-empty">
      <div className="finance-statement-empty-icon"><BarChart3 size={23} /></div>
      <strong>{message}</strong>
      <span>Change the reporting period or complete the linked operational transaction first.</span>
    </div>
  );
}

function buildCsv(report, rows, isPnl) {
  const headers = isPnl
    ? ['Description', 'This period', 'Previous period', 'Change']
    : ['Date', 'Description', 'Category', 'Source', 'Movement'];
  const body = isPnl
    ? rows.map(row => [row.label, row.current, row.previous, row.change])
    : rows.map(item => [item.date, item.description, item.category, `${item.source} / ${item.sourceId}`, `${item.direction === 'outflow' ? '-' : '+'}${item.amount}`]);
  return [headers, ...body]
    .map(row => row.map(cell => `"${String(cell ?? '').replaceAll('"', '""')}"`).join(','))
    .join('\n');
}

function StatementTable({ rows }) {
  return (
    <div className="finance-statement-table-wrap">
      <table className="finance-statement-table">
        <thead>
          <tr><th>Description</th><th>This period</th><th>Previous period</th><th>Change</th></tr>
        </thead>
        <tbody>
          {rows.map(row => (
            <tr className={`finance-statement-line ${row.type || ''}`} key={row.label}>
              <td>{row.type?.includes('total') ? <strong>{row.label}</strong> : row.label}</td>
              <td className={row.current < 0 ? 'negative' : ''}>{formatMoney(row.current, row.current < 0 ? '-' : '')}</td>
              <td className={row.previous < 0 ? 'negative' : ''}>{formatMoney(row.previous, row.previous < 0 ? '-' : '')}</td>
              <td><span className={`finance-change-badge ${row.changeTone || ''}`}>{row.change}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function FinanceStatementPage({ reportType, onBackToDashboard, onNavigate }) {
  const copy = REPORT_COPY[reportType] || REPORT_COPY.pnl;
  const [report, setReport] = useState(null);
  const [period, setPeriod] = useState(null);
  const [draftPeriod, setDraftPeriod] = useState({ from: '', to: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    fetchFinanceReportApi(reportType, period || {})
      .then((data) => {
        if (cancelled) return;
        setReport(data);
        if (!period) setDraftPeriod({ from: data.period.from, to: data.period.to });
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || 'Finance report could not be loaded.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [reportType, period, reloadToken]);

  const isPnl = reportType === 'pnl';
  const entries = report?.entries || report?.flows || [];
  const summary = report?.summary || {};
  const comparison = report?.comparison || {};
  const previousCategoryTotals = report?.comparisonCategoryTotals || {};

  const categoryRows = useMemo(() => {
    if (!report?.categoryTotals) return [];
    return Object.entries(report.categoryTotals)
      .map(([label, value]) => ({ label, value: Number(value || 0) }))
      .sort((a, b) => Math.abs(b.value) - Math.abs(a.value));
  }, [report]);

  const statementRows = useMemo(() => {
    if (!isPnl || !report) return [];
    const revenue = categoryRows.filter(row => row.value >= 0);
    const expenses = categoryRows.filter(row => row.value < 0);
    const revenueTotal = revenue.reduce((sum, row) => sum + row.value, 0);
    const expenseTotal = expenses.reduce((sum, row) => sum + Math.abs(row.value), 0);
    const previousRevenue = revenue.reduce((sum, row) => sum + Math.max(0, Number(previousCategoryTotals[row.label] || 0)), 0);
    const previousExpenses = expenses.reduce((sum, row) => sum + Math.abs(Math.min(0, Number(previousCategoryTotals[row.label] || 0))), 0);
    return [
      ...revenue.map(row => ({ label: row.label, current: row.value, previous: Math.max(0, Number(previousCategoryTotals[row.label] || 0)), change: changeValue(row.value, Math.max(0, Number(previousCategoryTotals[row.label] || 0))), changeTone: row.value >= Number(previousCategoryTotals[row.label] || 0) ? 'positive' : 'negative', type: 'revenue' })),
      { label: 'TOTAL REVENUE', current: revenueTotal, previous: previousRevenue, change: changeValue(revenueTotal, previousRevenue), type: 'total total-revenue' },
      ...expenses.map(row => ({ label: row.label, current: Math.abs(row.value), previous: Math.abs(Math.min(0, Number(previousCategoryTotals[row.label] || 0))), change: changeValue(Math.abs(row.value), Math.abs(Math.min(0, Number(previousCategoryTotals[row.label] || 0)))), changeTone: Math.abs(row.value) <= Math.abs(Number(previousCategoryTotals[row.label] || 0)) ? 'positive' : 'negative', type: 'expense' })),
      { label: 'TOTAL EXPENSES', current: expenseTotal, previous: previousExpenses, change: changeValue(expenseTotal, previousExpenses), type: 'total total-expenses' },
      { label: 'NET PROFIT / (LOSS)', current: summary.netProfit || 0, previous: comparison.netProfit || 0, change: changeValue(summary.netProfit, comparison.netProfit), type: `total net-result ${(summary.netProfit || 0) < 0 ? 'loss-row' : 'profit-row'}` }
    ];
  }, [categoryRows, comparison.netProfit, isPnl, previousCategoryTotals, report, summary.netProfit]);

  const chartRows = useMemo(() => {
    const rows = categoryRows.filter(row => Math.abs(row.value) > 0).slice(0, 6);
    const max = Math.max(...rows.map(row => Math.abs(row.value)), 1);
    return rows.map(row => ({ ...row, width: Math.max(4, (Math.abs(row.value) / max) * 100) }));
  }, [categoryRows]);

  const applyPeriod = () => {
    if (!draftPeriod.from || !draftPeriod.to) return;
    if (draftPeriod.from > draftPeriod.to) {
      setError('The From date cannot be after the To date.');
      return;
    }
    setPeriod({ ...draftPeriod });
  };

  const resetPeriod = () => { setPeriod(null); setError(''); };
  const sourceAction = (route) => { if (route && onNavigate) onNavigate(route); };
  const refresh = () => setReloadToken(token => token + 1);

  const exportReport = () => {
    if (!report) return;
    const csv = buildCsv(report, isPnl ? statementRows : entries, isPnl);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${isPnl ? 'pnl-statement' : 'cash-flow'}-${report.period.from}-to-${report.period.to}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="terminal-content finance-statement-stage">
      <div className="finance-statement-hero">
        <div>
          <div className="breadcrumb-nav"><span className="breadcrumb-link" onClick={onBackToDashboard}>Dashboard</span><ChevronRight size={13} className="breadcrumb-sep" /><span className="breadcrumb-link">Finance</span><ChevronRight size={13} className="breadcrumb-sep" /><span className="breadcrumb-active">{copy.title}</span></div>
          <div className="finance-page-eyebrow">{copy.eyebrow}</div>
          <h1 className="finance-statement-title">{copy.title}</h1>
          <div className="finance-statement-description">{copy.description}</div>
        </div>
        <div className="finance-statement-actions">
          <button className="btn finance-action-button" onClick={refresh}><RefreshCw size={15} /> Refresh</button>
          <button className="btn finance-action-button" onClick={() => window.print()}><Printer size={15} /> Print</button>
          <button className="btn primary finance-action-button" onClick={exportReport}><Download size={15} /> Export CSV</button>
        </div>
      </div>

      <div className="finance-statement-toolbar">
        <div className="finance-period-heading"><Calendar size={17} /><span>Reporting period</span></div>
        <label><span>From</span><input type="date" value={draftPeriod.from} onChange={(event) => setDraftPeriod(prev => ({ ...prev, from: event.target.value }))} /></label>
        <label><span>To</span><input type="date" value={draftPeriod.to} onChange={(event) => setDraftPeriod(prev => ({ ...prev, to: event.target.value }))} /></label>
        <button className="btn primary finance-period-apply" onClick={applyPeriod}>Apply period</button>
        <button className="btn finance-period-reset" onClick={resetPeriod}>Latest available</button>
        <span className={`finance-source-status ${report?.dataSource?.connected ? 'connected' : 'fallback'}`}><span className="finance-source-dot" />{report?.dataSource?.label || 'Checking data source...'}</span>
      </div>

      {error && <div className="finance-statement-error"><Info size={16} />{error}</div>}

      {loading && !report ? <div className="finance-statement-loading">Building {copy.title.toLowerCase()} from connected source records...</div> : report ? (
        <>
          <div className="finance-period-caption"><span><strong>{formatDate(report.period.from)}</strong> to <strong>{formatDate(report.period.to)}</strong></span><span className="finance-period-source"><FileText size={14} /> {report.dataSource?.recordCount || entries.length} posted source lines</span></div>

          <div className="finance-statement-stats">
            {isPnl ? <>
              <StatCard label="RECOGNISED REVENUE" value={formatMoney(summary.revenue)} subline={percentageChange(summary.revenue, comparison.revenue)} tone="income" icon={<TrendingUp size={16} />} />
              <StatCard label="APPROVED EXPENSES" value={formatMoney(summary.expenses)} subline={percentageChange(summary.expenses, comparison.expenses)} tone="expense" icon={<BarChart3 size={16} />} />
              <StatCard label="NET PROFIT / (LOSS)" value={formatMoney(summary.netProfit, summary.netProfit < 0 ? '-' : '')} subline={`${summary.grossMargin || 0}% operating margin`} tone={summary.netProfit < 0 ? 'loss' : 'profit'} icon={<TrendingUp size={16} />} />
              <StatCard label="GST EXCLUDED" value={formatMoney(report.controls?.gstExcluded)} subline="Tracked outside revenue" tone="neutral" icon={<Info size={16} />} />
            </> : <>
              <StatCard label="TOTAL INFLOWS" value={formatMoney(summary.totalInflow)} subline={percentageChange(summary.totalInflow, comparison.totalInflow)} tone="income" icon={<TrendingUp size={16} />} />
              <StatCard label="TOTAL OUTFLOWS" value={formatMoney(summary.totalOutflow)} subline={percentageChange(summary.totalOutflow, comparison.totalOutflow)} tone="expense" icon={<BarChart3 size={16} />} />
              <StatCard label="NET CASH MOVEMENT" value={formatMoney(summary.netMovement, summary.netMovement < 0 ? '-' : '')} subline={`${summary.inflowCount} inflows · ${summary.outflowCount} outflows`} tone={summary.netMovement < 0 ? 'loss' : 'profit'} icon={<TrendingUp size={16} />} />
              <StatCard label="RESTRICTED INFLOWS" value={formatMoney(summary.restrictedInflow)} subline="Wallet + escrow funds" tone="neutral" icon={<Info size={16} />} />
            </>}
          </div>

          {isPnl && <div className="finance-statement-visual-grid">
            <section className="finance-statement-panel finance-visual-card finance-health-card">
              <div className="finance-panel-header"><div><div className="finance-card-kicker">AT A GLANCE</div><h2>Profitability signal</h2></div><span className={`finance-result-chip ${summary.netProfit < 0 ? 'loss' : 'profit'}`}>{summary.netProfit < 0 ? 'Loss' : 'Profit'}</span></div>
              <div className="finance-profit-visual"><div className="finance-profit-visual-top"><span>Revenue</span><strong>{formatMoney(summary.revenue)}</strong></div><div className="finance-profit-track"><span style={{ width: `${summary.revenue ? Math.min(100, Math.max(6, (summary.expenses / summary.revenue) * 100)) : 0}%` }} /></div><div className="finance-profit-visual-bottom"><span>Expenses consume {summary.revenue ? Math.round((summary.expenses / summary.revenue) * 100) : 0}% of revenue</span><strong>{formatMoney(summary.expenses)}</strong></div></div>
              <div className="finance-profit-result"><span>Net result</span><strong className={summary.netProfit < 0 ? 'negative' : 'positive'}>{formatMoney(summary.netProfit, summary.netProfit < 0 ? '-' : '+')}</strong></div>
            </section>
            <section className="finance-statement-panel finance-visual-card">
              <div className="finance-panel-header"><div><div className="finance-card-kicker">CATEGORY MIX</div><h2>What drives the result</h2></div><BarChart3 size={18} className="finance-control-icon" /></div>
              <div className="finance-category-bars">{chartRows.length ? chartRows.map(row => <div className="finance-category-bar-row" key={row.label}><div className="finance-category-bar-meta"><span>{row.label}</span><strong className={row.value < 0 ? 'negative' : ''}>{formatMoney(Math.abs(row.value))}</strong></div><div className={`finance-category-bar-track ${row.value < 0 ? 'expense-bar' : 'income-bar'}`}><span style={{ width: `${row.width}%` }} /></div></div>) : <EmptyState message="No category totals available." />}</div>
            </section>
          </div>}

          <section className="finance-statement-panel finance-statement-report-panel">
            <div className="finance-panel-header finance-report-panel-header"><div><div className="finance-card-kicker">{isPnl ? 'MANAGEMENT VIEW' : 'CASH MOVEMENT VIEW'}</div><h2>{isPnl ? 'Statement summary' : 'Where cash moved'}</h2></div><span className="finance-record-count">Compared with previous period</span></div>
            {isPnl ? <StatementTable rows={statementRows} /> : <div className="finance-cash-summary-list finance-cash-summary-grid"><div className="finance-category-row"><span>Operating inflows</span><strong>{formatMoney(summary.operatingInflow)}</strong></div><div className="finance-category-row"><span>Restricted inflows</span><strong>{formatMoney(summary.restrictedInflow)}</strong></div><div className="finance-category-row"><span>Verified external outflows</span><strong className="negative">-{formatMoney(summary.totalOutflow)}</strong></div><div className="finance-category-row total"><span>Net movement</span><strong>{formatMoney(summary.netMovement, summary.netMovement < 0 ? '-' : '+')}</strong></div></div>}
          </section>

          <div className="finance-statement-main-grid">
            <section className="finance-statement-panel finance-control-panel"><div className="finance-panel-header"><div><div className="finance-card-kicker">CONTROL NOTES</div><h2>Accounting guardrails</h2></div><Info size={18} className="finance-control-icon" /></div><div className="finance-control-list">{(report.definitions || []).map(definition => <div className="finance-control-row" key={definition}><span>✓</span><p>{definition}</p></div>)}{!isPnl && <div className="finance-control-row finance-control-warning"><span>!</span><p>Opening balance: <strong>{report.controls?.openingBalance}</strong>. Closing cash is not invented until opening cash is configured.</p></div>}</div></section>
            <section className="finance-statement-panel finance-next-actions-card"><div className="finance-panel-header"><div><div className="finance-card-kicker">QUICK ACTIONS</div><h2>Review source records</h2></div><FileText size={18} className="finance-control-icon" /></div><button className="finance-link-action" onClick={() => sourceAction('invoices')}>Review invoices <ChevronRight size={15} /></button><button className="finance-link-action" onClick={() => sourceAction('maintenance')}>Review approved maintenance <ChevronRight size={15} /></button><button className="finance-link-action" onClick={() => sourceAction('fuel')}>Review fuel and energy <ChevronRight size={15} /></button></section>
          </div>

          <section className="finance-statement-panel finance-ledger-panel"><div className="finance-panel-header"><div><div className="finance-card-kicker">SOURCE LEDGER</div><h2>{isPnl ? 'Income and approved expense lines' : 'External cash movement lines'}</h2></div><span className="finance-period-source">Click a source to open its operational page</span></div>{entries.length ? <div className="finance-ledger-table-wrap"><table className="finance-ledger-table"><thead><tr><th>Date</th><th>Description</th><th>Category</th><th>Source</th><th className="amount-column">{isPnl ? 'Amount' : 'Movement'}</th></tr></thead><tbody>{entries.map(item => { const negative = isPnl ? item.direction === 'expense' : item.direction === 'outflow'; return <tr key={item.id}><td>{formatDate(item.date)}</td><td><strong>{item.description}</strong><small>{item.note}</small></td><td><span className={`finance-direction-pill ${negative ? 'expense' : 'income'}`}>{item.category}</span></td><td><button className="finance-source-link" onClick={() => sourceAction(item.sourceRoute)}>{item.source} · {item.sourceId}</button></td><td className={`amount-column finance-amount ${negative ? 'negative' : 'positive'}`}>{negative ? '-' : '+'}{formatMoney(item.amount)}</td></tr>; })}</tbody></table></div> : <EmptyState message={copy.empty} />}</section>

          <div className="finance-statement-footnote"><TrendingUp size={16} /><span>{isPnl ? `${summary.invoiceCount || 0} invoices were considered; ${summary.approvedExpenseCount || 0} approved expense lines were posted.` : `${summary.inflowCount || 0} external inflows and ${summary.outflowCount || 0} external outflows were posted. ${report.controls?.internalMovementsExcluded || 0} internal wallet movements were excluded.`}</span></div>
        </>
      ) : null}
    </div>
  );
}
