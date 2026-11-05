import React from 'react';
import {
  ArrowLeftRight,
  BarChart3,
  CheckCircle2,
  ChevronRight,
  FileText,
  Receipt,
  Shield,
  Wallet
} from '../common/Icons';

const FINANCE_REFERENCES = [
  { route: 'finance-pnl', title: 'P&L Statement', detail: 'Revenue, expenses, margin and net result', icon: BarChart3, status: 'Implemented' },
  { route: 'finance-cash-flow', title: 'Cash Flow', detail: 'Money in, money out and daily close controls', icon: ArrowLeftRight, status: 'Implemented' },
  { route: 'finance-accounts-receivable', title: 'Accounts Receivable', detail: 'Outstanding balances and ageing exposure', icon: Receipt, status: 'Implemented' },
  { route: 'finance-customer-soa', title: 'Customer SOA', detail: 'Customer ledger, invoices and receipts', icon: FileText, status: 'Implemented' },
  { route: 'finance-accounts-payable', title: 'Accounts Payable', detail: 'Vendor bills, ageing and payments', icon: Wallet, status: 'Implemented' },
  { route: 'finance-asset-financing', title: 'Asset EMI / Financing', detail: 'Financed assets and collection coverage', icon: BarChart3, status: 'Implemented' },
  { route: 'finance-management-reports', title: 'Management Reports', detail: 'Leadership scorecard and management pack', icon: CheckCircle2, status: 'Implemented' }
];

const OPERATIONAL_REFERENCES = [
  ['Fleet Control Tower', 'Live asset status, driver state, maintenance pipeline and action queue', 'fleet'],
  ['Driver Control Tower', 'Driver health, wallet, attendance and assignment visibility', 'drivers'],
  ['Vehicle Master', 'Single source of truth for vehicle lifecycle and compliance links', 'vehicles'],
  ['Escalation Master', 'Ownership, SLA, evidence and resolution audit trail', 'escalation-master'],
  ['Maintenance Control Centre', 'Ten-stage service workflow from due date to release', 'maintenance'],
  ['Bookings / Leases', 'Customer onboarding, agreement, deposit and vehicle activation', 'bookings']
];

function ReferenceCard({ reference, onNavigate }) {
  const Icon = reference.icon;
  return (
    <button className="reference-screen-card" onClick={() => onNavigate?.(reference.route)}>
      <span className="reference-screen-icon"><Icon size={18} /></span>
      <span className="reference-screen-copy"><strong>{reference.title}</strong><small>{reference.detail}</small></span>
      <span className="reference-screen-status"><CheckCircle2 size={13} />{reference.status}</span>
      <ChevronRight size={16} />
    </button>
  );
}

export default function ReferenceScreensPage({ onBackToDashboard, onNavigate }) {
  return (
    <div className="terminal-content reference-screens-stage">
      <div className="reference-screens-hero">
        <div>
          <div className="breadcrumb-nav"><span className="breadcrumb-link" onClick={onBackToDashboard}>Dashboard</span><ChevronRight size={13} className="breadcrumb-sep" /><span className="breadcrumb-link">Finance</span><ChevronRight size={13} className="breadcrumb-sep" /><span className="breadcrumb-active">Reference Screens</span></div>
          <div className="finance-page-eyebrow">PRODUCT REFERENCE / MODULE MAP</div>
          <h1 className="reference-screens-title">Reference Screens</h1>
          <p className="reference-screens-description">A visual index of the supplied client plan and unified wireframe logic, mapped to the live Sikhar Fleet workspace.</p>
        </div>
        <div className="reference-screens-hero-badge"><Shield size={18} /><span>Reference coverage<strong>14 control surfaces</strong></span></div>
      </div>

      <section className="reference-callout"><div className="reference-callout-icon"><CheckCircle2 size={20} /></div><div><strong>Reference logic is retained in the product flow</strong><p>Each reference screen opens the corresponding working module so leadership can move from a report definition to the source workflow without losing context.</p></div></section>

      <section className="reference-screen-section">
        <div className="management-section-heading"><div><span className="management-kicker">FINANCIAL REFERENCE SET</span><h2>Finance screens</h2><p>Core finance screens from the supplied wireframe and client system plan.</p></div><span className="management-section-count">{FINANCE_REFERENCES.length} implemented</span></div>
        <div className="reference-screen-grid">{FINANCE_REFERENCES.map(reference => <ReferenceCard key={reference.route} reference={reference} onNavigate={onNavigate} />)}</div>
      </section>

      <section className="reference-screen-section">
        <div className="management-section-heading"><div><span className="management-kicker">OPERATIONAL REFERENCE SET</span><h2>Connected control surfaces</h2><p>Operational masters and control towers that feed management decisions.</p></div><span className="management-section-count">{OPERATIONAL_REFERENCES.length} mapped workflows</span></div>
        <div className="reference-operations-table-wrap"><table className="reference-operations-table"><thead><tr><th>Control surface</th><th>Reference logic</th><th>Status</th><th /></tr></thead><tbody>{OPERATIONAL_REFERENCES.map(([title, detail, route]) => <tr key={route}><td><strong>{title}</strong></td><td>{detail}</td><td><span className="management-status"><span />Mapped</span></td><td><button className="management-table-link" onClick={() => onNavigate?.(route)}>Open <ChevronRight size={14} /></button></td></tr>)}</tbody></table></div>
      </section>

      <section className="reference-notes-grid"><div className="reference-note-card"><div className="reference-note-icon blue"><FileText size={17} /></div><div><span className="management-kicker">SOURCE DOCUMENTS</span><h3>Client system plan</h3><p>Business controls, operational masters and finance ownership are represented as product modules instead of disconnected screens.</p></div></div><div className="reference-note-card"><div className="reference-note-icon green"><BarChart3 size={17} /></div><div><span className="management-kicker">WIREFRAME PRINCIPLE</span><h3>One decision, one next action</h3><p>Every scorecard and reference card points to the source record or operational action needed to close the loop.</p></div></div></section>
    </div>
  );
}
