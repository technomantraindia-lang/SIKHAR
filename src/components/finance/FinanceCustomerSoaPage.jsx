import React, { useEffect, useState } from 'react';
import {
  ChevronRight,
  Download,
  FileText,
  Printer,
  RefreshCw,
  Send
} from '../common/Icons';
import { fetchCustomerSoaApi, fetchReceivablesApi } from '../../services/api';

function money(value) {
  return `₹${Number(value || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
}

function dateLabel(value) {
  if (!value) return '—';
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function exportLedger(report) {
  const rows = [
    ['Date', 'Type', 'Reference', 'Description', 'Debit', 'Credit', 'Activity', 'Running balance'],
    ...(report.entries || []).map(entry => [entry.date, entry.type, entry.reference, entry.description, entry.debit, entry.credit, entry.movement, entry.balance])
  ];
  const csv = rows.map(row => row.map(cell => `"${String(cell ?? '').replaceAll('"', '""')}"`).join(',')).join('\n');
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = `customer-soa-${report.customer.customerId || report.customer.name.replaceAll(' ', '-')}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

function Stat({ label, value, tone = '' }) {
  return <div className={`finance-soa-stat ${tone}`}><div className="finance-soa-stat-label">{label}</div><strong>{money(value)}</strong></div>;
}

export default function FinanceCustomerSoaPage({ onBackToDashboard, onNavigate }) {
  const [customers, setCustomers] = useState([]);
  const [selectedKey, setSelectedKey] = useState(() => localStorage.getItem('sikhar_selected_customer_key') || '');
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadStatement = async (key) => {
    if (!key) return;
    try {
      setLoading(true);
      setError('');
      const data = await fetchCustomerSoaApi(key);
      setReport(data);
    } catch (err) {
      setError(err.message || 'Customer SOA could not be loaded.');
    } finally {
      setLoading(false);
    }
  };

  const loadPage = async () => {
    try {
      setLoading(true);
      const receivables = await fetchReceivablesApi();
      setCustomers(receivables.customers || []);
      const key = selectedKey && receivables.customers.some(customer => customer.key === selectedKey)
        ? selectedKey
        : receivables.customers[0]?.key || '';
      setSelectedKey(key);
      if (key) {
        localStorage.setItem('sikhar_selected_customer_key', key);
        setReport(await fetchCustomerSoaApi(key));
      } else {
        setReport(null);
      }
      setError('');
    } catch (err) {
      setError(err.message || 'Customer SOA could not be loaded.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadPage(); }, []);

  const handleCustomerChange = (event) => {
    const key = event.target.value;
    setSelectedKey(key);
    localStorage.setItem('sikhar_selected_customer_key', key);
    loadStatement(key);
  };

  const sendEmail = () => {
    if (!report) return;
    const subject = `Statement of Account · ${report.customer.name}`;
    const body = `Please find the current statement for ${report.customer.name}. Outstanding balance: ${money(report.summary.totalOutstanding)}. As of ${dateLabel(report.asOf)}.`;
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  return (
    <div className="terminal-content finance-soa-stage">
      <div className="finance-soa-hero">
        <div>
          <div className="breadcrumb-nav"><span className="breadcrumb-link" onClick={onBackToDashboard}>Dashboard</span><ChevronRight size={13} className="breadcrumb-sep" /><span className="breadcrumb-link">Finance</span><ChevronRight size={13} className="breadcrumb-sep" /><span className="breadcrumb-active">Customer SOA</span></div>
          <div className="finance-page-eyebrow">FINANCE / CUSTOMER LEDGER</div>
          <h1 className="finance-soa-title">Customer Statement of Account</h1>
          <p className="finance-soa-description">Invoices, receipts, credit notes, deposits and wallet activity in one traceable customer ledger.</p>
        </div>
        <div className="finance-soa-actions">
          <button className="btn" onClick={loadPage}><RefreshCw size={15} /> Refresh</button>
          <button className="btn" onClick={() => window.print()} disabled={!report}><Printer size={15} /> Print</button>
          <button className="btn" onClick={() => report && exportLedger(report)} disabled={!report}><Download size={15} /> Export CSV</button>
          <button className="btn primary" onClick={sendEmail} disabled={!report}><Send size={15} /> Send email</button>
        </div>
      </div>

      {error && <div className="finance-soa-error">{error}</div>}
      {loading && !report ? <div className="finance-soa-loading"><RefreshCw size={22} className="spin-icon" />Building customer ledger…</div> : report ? (
        <>
          <div className="finance-soa-toolbar">
            <div className="finance-soa-selector-label"><FileText size={17} /><span>Select customer</span></div>
            <select value={selectedKey} onChange={handleCustomerChange} aria-label="Select customer statement">
              {customers.map(customer => <option key={customer.key} value={customer.key}>{customer.name}{customer.customerId ? ` · ${customer.customerId}` : ''}</option>)}
            </select>
            <span className="finance-soa-asof">As of <strong>{dateLabel(report.asOf)}</strong></span>
            <button className="btn" onClick={() => onNavigate?.('finance-accounts-receivable')}>← Accounts Receivable</button>
          </div>

          <section className="finance-soa-customer-card">
            <div className="finance-soa-customer-identity"><div className="finance-soa-avatar">{report.customer.name.slice(0, 1).toUpperCase()}</div><div><div className="finance-ar-kicker">CUSTOMER ACCOUNT</div><h2>{report.customer.name}</h2><p>{report.customer.customerId || 'Customer ID not assigned'} {report.customer.phone ? `· ${report.customer.phone}` : ''}</p></div></div>
            <div className="finance-soa-customer-meta"><span>Vehicle <strong>{report.customer.vehicleRegistrations?.join(', ') || '—'}</strong></span><span>Lease <strong>{report.customer.leaseNumber || '—'}</strong></span><span>Status <strong className={report.customer.leaseStatus === 'Active' ? 'finance-soa-good' : ''}>{report.customer.leaseStatus || '—'}</strong></span></div>
          </section>

          <div className="finance-soa-stat-grid">
            <Stat label="CURRENT (0–30)" value={report.summary.current} />
            <Stat label="31–60 DAYS" value={report.summary.days31to60} tone="warning" />
            <Stat label="61–90 DAYS" value={report.summary.days61to90} tone="warning" />
            <Stat label="90+ DAYS" value={report.summary.over90} tone="danger" />
            <Stat label="TOTAL OUTSTANDING" value={report.summary.totalOutstanding} tone="danger" />
          </div>

          <section className="finance-soa-panel">
            <div className="finance-soa-panel-head"><div><div className="finance-ar-kicker">RUNNING CUSTOMER LEDGER</div><h2>Invoices, payments and account activity</h2><p>Only invoices, payments and credit notes change the receivable balance. Deposits and wallet funding remain informational until applied.</p></div><span className="finance-soa-ledger-count">{report.entries.length} entries</span></div>
            <div className="finance-soa-table-wrap">
              <table className="finance-soa-table">
                <thead><tr><th>Date</th><th>Type</th><th>Reference</th><th>Description</th><th>Debit</th><th>Credit</th><th>Activity</th><th>Balance</th></tr></thead>
                <tbody>
                  {report.entries.map(entry => (
                    <tr key={entry.id} className={entry.affectsBalance ? '' : 'finance-soa-informational-row'}>
                      <td>{dateLabel(entry.date)}</td>
                      <td><span className={`finance-soa-type ${entry.type.toLowerCase().replace(' ', '-')}`}>{entry.type}</span></td>
                      <td className="finance-soa-reference">{entry.reference}</td>
                      <td><strong>{entry.description}</strong><small>{entry.status}</small></td>
                      <td className="finance-soa-debit">{entry.debit ? money(entry.debit) : '—'}</td>
                      <td className="finance-soa-credit">{entry.credit ? money(entry.credit) : '—'}</td>
                      <td>{entry.affectsBalance ? '—' : money(entry.movement)}</td>
                      <td><strong>{money(entry.balance)}</strong></td>
                    </tr>
                  ))}
                  {!report.entries.length && <tr><td colSpan="8" className="finance-soa-empty">No ledger entries found for this customer.</td></tr>}
                </tbody>
              </table>
            </div>
          </section>
          <div className="finance-soa-footnote"><span>ⓘ</span> This statement is derived from the same rental invoice, lease and driver-wallet records used by Collections. Use Rental Invoices to post a payment or issue a credit note.</div>
        </>
      ) : <div className="finance-soa-empty-state">No customer records are available yet. Generate an invoice or create a lease first.</div>}
    </div>
  );
}
