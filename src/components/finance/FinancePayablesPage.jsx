import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  ChevronRight,
  Download,
  FileText,
  RefreshCw,
  Search,
  Wallet
} from '../common/Icons';
import { fetchPayablesApi } from '../../services/api';

const AGEING_ORDER = ['0–30 days', '31–60 days', '61–90 days', '90+ days'];

function money(value) {
  return `₹${Number(value || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
}

function dateLabel(value) {
  if (!value) return '—';
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function exportBills(bills) {
  const rows = [
    ['Vendor', 'Invoice', 'Invoice date', 'Due date', 'Total', 'Paid', 'Outstanding', 'Status'],
    ...bills.map(bill => [bill.vendor, bill.invoiceNo, bill.invoiceDate, bill.dueDate, bill.total, bill.paid, bill.outstanding, bill.status])
  ];
  const csv = rows.map(row => row.map(cell => `"${String(cell ?? '').replaceAll('"', '""')}"`).join(',')).join('\n');
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = 'accounts-payable.csv';
  link.click();
  URL.revokeObjectURL(url);
}

function Stat({ label, value, detail, tone = '' }) {
  return <div className={`finance-ap-stat ${tone}`}><div className="finance-ap-stat-label">{label}</div><strong>{value}</strong><span>{detail}</span></div>;
}

export default function FinancePayablesPage({ onBackToDashboard, onNavigate }) {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      setReport(await fetchPayablesApi());
    } catch (err) {
      setError(err.message || 'Accounts payable could not be loaded.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const bills = useMemo(() => {
    const query = search.trim().toLowerCase();
    return (report?.bills || []).filter(bill => {
      const textMatches = !query || [bill.vendor, bill.invoiceNo, bill.vehicle, bill.description].some(value => String(value || '').toLowerCase().includes(query));
      const statusMatches = statusFilter === 'all' || (statusFilter === 'open' && bill.outstanding > 0) || bill.status.toLowerCase() === statusFilter;
      return textMatches && statusMatches;
    });
  }, [report, search, statusFilter]);
  const maxAgeing = Math.max(...AGEING_ORDER.map(label => Number(report?.ageing?.[label] || 0)), 1);

  return (
    <div className="terminal-content finance-ap-stage">
      <div className="finance-ap-hero">
        <div>
          <div className="breadcrumb-nav"><span className="breadcrumb-link" onClick={onBackToDashboard}>Dashboard</span><ChevronRight size={13} className="breadcrumb-sep" /><span className="breadcrumb-link">Finance</span><ChevronRight size={13} className="breadcrumb-sep" /><span className="breadcrumb-active">Accounts Payable</span></div>
          <div className="finance-page-eyebrow">FINANCE / VENDOR CONTROL</div>
          <h1 className="finance-ap-title">Accounts Payable</h1>
          <p className="finance-ap-description">Vendor bills, payment status and ageing obligations flowing from maintenance and fleet operations.</p>
        </div>
        <div className="finance-ap-actions">
          <button className="btn" onClick={loadData}><RefreshCw size={15} /> Refresh</button>
          <button className="btn" onClick={() => exportBills(bills)} disabled={!bills.length}><Download size={15} /> Export CSV</button>
          <button className="btn primary" onClick={() => onNavigate?.('maintenance')}><FileText size={15} /> Review maintenance</button>
        </div>
      </div>

      {error && <div className="finance-ap-error"><AlertTriangle size={16} />{error}</div>}
      {loading && !report ? <div className="finance-ap-loading"><RefreshCw size={22} className="spin-icon" />Building payables from verified vendor bills…</div> : report && (
        <>
          <div className="finance-ap-source-line"><span>As of <strong>{dateLabel(report.asOf)}</strong></span><span className="finance-ap-source-pill"><span />{report.dataSource?.label} · {report.dataSource?.recordCount || 0} bills</span></div>
          <div className="finance-ap-stat-grid">
            <Stat label="TOTAL PAYABLE" value={money(report.summary.totalPayable)} detail={`${report.summary.openBills} open vendor bills`} tone="danger" />
            <Stat label="OVERDUE BILLS" value={report.summary.overdueBills} detail="Past due using invoice terms" tone="warning" />
            <Stat label="PAYMENTS THIS MONTH" value={money(report.summary.paymentsThisMonth)} detail={`${report.summary.totalPaid ? money(report.summary.totalPaid) : '₹0'} paid overall`} tone="success" />
            <Stat label="ACTIVE VENDORS" value={report.summary.vendorCount} detail={`${money(report.summary.totalSpend)} total billed spend`} />
          </div>

          <div className="finance-ap-overview-grid">
            <section className="finance-ap-panel finance-ap-ageing-panel">
              <div className="finance-ap-panel-head"><div><div className="finance-ap-kicker">LIABILITY AGEING</div><h2>Payable exposure by due date</h2></div><BarChart3 size={18} /></div>
              <div className="finance-ap-ageing-list">{AGEING_ORDER.map(label => <div className="finance-ap-ageing-row" key={label}><div><span>{label}</span><strong>{money(report.ageing[label])}</strong></div><div className="finance-ap-ageing-track"><span style={{ width: `${Math.max(3, Number(report.ageing[label] || 0) / maxAgeing * 100)}%` }} /></div></div>)}</div>
              <div className="finance-ap-note"><Wallet size={14} /> {report.controls.defaultTerms} Paid bills remain visible for audit traceability but do not contribute to payable ageing.</div>
            </section>

            <section className="finance-ap-panel finance-ap-vendor-panel">
              <div className="finance-ap-panel-head"><div><div className="finance-ap-kicker">VENDOR EXPOSURE</div><h2>Top vendors by outstanding</h2></div><AlertTriangle size={18} /></div>
              <div className="finance-ap-vendor-list">{(report.vendors || []).slice(0, 4).map(vendor => <button key={vendor.vendor} className="finance-ap-vendor-row" onClick={() => setSearch(vendor.vendor)}><span><strong>{vendor.vendor}</strong><small>{vendor.billCount} bills · {vendor.overdueBills} overdue</small></span><b>{money(vendor.outstanding)}</b><ChevronRight size={15} /></button>)}{!report.vendors?.length && <div className="finance-ap-empty-mini">No vendor bills found.</div>}</div>
              <div className="finance-ap-note">Click a vendor to filter the bill register below. The payable is cleared only when a payment record is posted.</div>
            </section>
          </div>

          <section className="finance-ap-panel finance-ap-register-panel">
            <div className="finance-ap-table-head"><div><div className="finance-ap-kicker">BILL REGISTER</div><h2>Vendor bills and payment status</h2><p>Maintenance bills are matched to recorded payments and UTR references.</p></div><div className="finance-ap-table-tools"><div className="finance-ap-search"><Search size={15} /><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Search vendor, invoice, vehicle" /></div><select value={statusFilter} onChange={event => setStatusFilter(event.target.value)} aria-label="Filter vendor bills"><option value="all">All bills</option><option value="open">Open</option><option value="overdue">Overdue</option><option value="paid">Paid</option></select></div></div>
            <div className="finance-ap-table-wrap"><table className="finance-ap-table"><thead><tr><th>Vendor / bill</th><th>Vehicle</th><th>Invoice date</th><th>Due date</th><th>Total</th><th>Paid</th><th>Outstanding</th><th>Status</th><th /></tr></thead><tbody>{bills.map(bill => <tr key={bill.id}><td><strong>{bill.vendor}</strong><small>{bill.invoiceNo} · {bill.description}</small></td><td>{bill.vehicle || '—'}</td><td>{dateLabel(bill.invoiceDate)}</td><td><strong>{dateLabel(bill.dueDate)}</strong><small>{bill.dueDateSource}</small></td><td>{money(bill.total)}</td><td className="finance-ap-paid">{money(bill.paid)}</td><td className={bill.outstanding ? 'finance-ap-outstanding' : 'finance-ap-paid'}><strong>{money(bill.outstanding)}</strong></td><td><span className={`finance-ap-status ${bill.status.toLowerCase()}`}>{bill.status === 'Paid' ? <CheckCircle2 size={12} /> : <AlertTriangle size={12} />}{bill.status}</span></td><td><button className="finance-ap-view-btn" onClick={() => onNavigate?.('maintenance')}>View job <ChevronRight size={14} /></button></td></tr>)}{!bills.length && <tr><td colSpan="9" className="finance-ap-empty">No vendor bills match this filter.</td></tr>}</tbody></table></div>
          </section>
        </>
      )}
    </div>
  );
}
