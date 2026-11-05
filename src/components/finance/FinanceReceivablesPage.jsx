import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  BarChart3,
  ChevronRight,
  Download,
  FileText,
  RefreshCw,
  Search
} from '../common/Icons';
import { fetchReceivablesApi } from '../../services/api';

const AGEING_ORDER = ['0–30 days', '31–60 days', '61–90 days', '90+ days'];

function money(value) {
  return `₹${Number(value || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
}

function shortDate(value) {
  if (!value) return '—';
  const parsed = new Date(`${value}T00:00:00`);
  return Number.isNaN(parsed.getTime())
    ? value
    : parsed.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function exportCustomers(customers) {
  const rows = [
    ['Customer', 'Customer ID', 'Phone', 'Open invoices', 'Outstanding', 'Oldest due', 'Status'],
    ...customers.map(customer => [
      customer.name,
      customer.customerId,
      customer.phone,
      customer.openInvoiceCount,
      customer.outstanding,
      customer.oldestDue || '',
      customer.status
    ])
  ];
  const csv = rows.map(row => row.map(cell => `"${String(cell ?? '').replaceAll('"', '""')}"`).join(',')).join('\n');
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = 'accounts-receivable.csv';
  link.click();
  URL.revokeObjectURL(url);
}

function Stat({ label, value, detail, tone = '' }) {
  return (
    <div className={`finance-ar-stat ${tone}`}>
      <div className="finance-ar-stat-label">{label}</div>
      <div className="finance-ar-stat-value">{value}</div>
      <div className="finance-ar-stat-detail">{detail}</div>
    </div>
  );
}

export default function FinanceReceivablesPage({ onBackToDashboard, onNavigate }) {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      setReport(await fetchReceivablesApi());
    } catch (err) {
      setError(err.message || 'Accounts receivable could not be loaded.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const customers = useMemo(() => {
    const query = search.trim().toLowerCase();
    return (report?.customers || []).filter(customer => {
      const matchesSearch = !query || [customer.name, customer.customerId, customer.phone, ...customer.vehicleRegistrations]
        .some(value => String(value || '').toLowerCase().includes(query));
      const matchesStatus = statusFilter === 'all'
        || (statusFilter === 'overdue' && customer.status === 'Overdue')
        || (statusFilter === 'open' && customer.outstanding > 0);
      return matchesSearch && matchesStatus;
    });
  }, [report, search, statusFilter]);

  const openSoa = (customer) => {
    localStorage.setItem('sikhar_selected_customer_key', customer.key);
    onNavigate?.('finance-customer-soa');
  };

  const maxAgeing = Math.max(...AGEING_ORDER.map(label => Number(report?.ageing?.[label] || 0)), 1);

  return (
    <div className="terminal-content finance-ar-stage">
      <div className="finance-ar-hero">
        <div>
          <div className="breadcrumb-nav">
            <span className="breadcrumb-link" onClick={onBackToDashboard}>Dashboard</span>
            <ChevronRight size={13} className="breadcrumb-sep" />
            <span className="breadcrumb-link">Finance</span>
            <ChevronRight size={13} className="breadcrumb-sep" />
            <span className="breadcrumb-active">Accounts Receivable</span>
          </div>
          <div className="finance-page-eyebrow">FINANCE / COLLECTION CONTROL</div>
          <h1 className="finance-ar-title">Accounts Receivable</h1>
          <p className="finance-ar-description">Outstanding invoices, ageing exposure and collection follow-up connected to rental billing.</p>
        </div>
        <div className="finance-ar-actions">
          <button className="btn" onClick={loadData}><RefreshCw size={15} /> Refresh</button>
          <button className="btn" onClick={() => exportCustomers(customers)} disabled={!customers.length}><Download size={15} /> Export CSV</button>
          <button className="btn primary" onClick={() => onNavigate?.('invoices')}><FileText size={15} /> Review invoices</button>
        </div>
      </div>

      {error && <div className="finance-ar-error"><AlertTriangle size={16} />{error}</div>}

      {loading && !report ? (
        <div className="finance-ar-loading"><RefreshCw size={22} className="spin-icon" />Building receivables from invoice records…</div>
      ) : report && (
        <>
          <div className="finance-ar-source-line">
            <span>As of <strong>{shortDate(report.asOf)}</strong></span>
            <span className="finance-ar-source-pill"><span />{report.dataSource?.label || 'Operational records'} · {report.dataSource?.recordCount || 0} invoices</span>
          </div>

          <div className="finance-ar-stat-grid">
            <Stat label="TOTAL OUTSTANDING" value={money(report.summary.totalOutstanding)} detail={`${report.summary.openCustomers} customers with open dues`} tone="danger" />
            <Stat label="UNPAID INVOICES" value={report.summary.unpaidInvoices} detail={`${report.summary.overdueCustomers} customers overdue`} tone="warning" />
            <Stat label="COLLECTIONS THIS MONTH" value={money(report.summary.collectionsThisMonth)} detail="Posted invoice receipts" tone="success" />
            <Stat label="DSO" value={report.summary.dso == null ? '—' : `${report.summary.dso} days`} detail="Trailing 30-day billing basis" />
          </div>

          <div className="finance-ar-overview-grid">
            <section className="finance-ar-panel">
              <div className="finance-ar-panel-head"><div><div className="finance-ar-kicker">AGEING EXPOSURE</div><h2>Where outstanding sits</h2></div><BarChart3 size={18} /></div>
              <div className="finance-ar-ageing-list">
                {AGEING_ORDER.map((label) => (
                  <div className="finance-ar-ageing-row" key={label}>
                    <div className="finance-ar-ageing-meta"><span>{label}</span><strong>{money(report.ageing[label])}</strong></div>
                    <div className="finance-ar-ageing-track"><span style={{ width: `${Math.max(2, (Number(report.ageing[label] || 0) / maxAgeing) * 100)}%` }} /></div>
                  </div>
                ))}
              </div>
              <div className="finance-ar-note">Ageing is calculated from the invoice due date. Paid and waived invoices do not contribute to outstanding balances.</div>
            </section>

            <section className="finance-ar-panel finance-ar-control-panel">
              <div className="finance-ar-panel-head"><div><div className="finance-ar-kicker">COLLECTION CONTROL</div><h2>Next actions</h2></div><AlertTriangle size={18} /></div>
              <button className="finance-ar-action-row" onClick={() => setStatusFilter('overdue')}><span><strong>{report.summary.overdueCustomers}</strong> overdue customers</span><ChevronRight size={16} /></button>
              <button className="finance-ar-action-row" onClick={() => setStatusFilter('open')}><span><strong>{report.summary.unpaidInvoices}</strong> open invoices</span><ChevronRight size={16} /></button>
              <button className="finance-ar-action-row" onClick={() => onNavigate?.('finance-customer-soa')}><span>Open customer statements</span><ChevronRight size={16} /></button>
              <div className="finance-ar-note">Payments and credit notes posted from Rental Invoices flow into the customer SOA automatically.</div>
            </section>
          </div>

          <section className="finance-ar-panel finance-ar-customers-panel">
            <div className="finance-ar-table-head">
              <div><div className="finance-ar-kicker">CUSTOMER FOLLOW-UP</div><h2>Outstanding by customer</h2><p>Open a Customer SOA to review the complete debit, credit and activity trail.</p></div>
              <div className="finance-ar-table-tools">
                <div className="finance-ar-search"><Search size={15} /><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Search customer, ID, phone or vehicle" /></div>
                <select value={statusFilter} onChange={event => setStatusFilter(event.target.value)} aria-label="Filter customers">
                  <option value="all">All customers</option><option value="open">Open balances</option><option value="overdue">Overdue only</option>
                </select>
              </div>
            </div>
            <div className="finance-ar-table-wrap">
              <table className="finance-ar-table">
                <thead><tr><th>Customer</th><th>Open invoices</th><th>Outstanding</th><th>Oldest due</th><th>Age</th><th>Status</th><th /></tr></thead>
                <tbody>
                  {customers.map(customer => (
                    <tr key={customer.key}>
                      <td><strong>{customer.name}</strong><small>{customer.customerId || customer.phone || 'Customer record'}</small></td>
                      <td>{customer.openInvoiceCount}</td>
                      <td className={customer.outstanding ? 'finance-ar-negative' : 'finance-ar-positive'}><strong>{money(customer.outstanding)}</strong></td>
                      <td>{shortDate(customer.oldestDue)}</td>
                      <td>{customer.outstanding ? `${customer.maxAgeDays} days` : '—'}</td>
                      <td><span className={`finance-ar-status ${customer.status.toLowerCase()}`}>{customer.status}</span></td>
                      <td><button className="finance-ar-view-btn" onClick={() => openSoa(customer)}>View SOA <ChevronRight size={14} /></button></td>
                    </tr>
                  ))}
                  {!customers.length && <tr><td colSpan="7" className="finance-ar-empty">No customer balances match this filter.</td></tr>}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
