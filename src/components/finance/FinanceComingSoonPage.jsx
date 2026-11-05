import React from 'react';
import {
  ArrowLeftRight,
  BarChart3,
  CheckCircle2,
  FileText,
  Receipt,
  Shield,
  Wallet
} from '../common/Icons';

const FINANCE_PAGE_CONFIG = {
  'finance-overview': {
    title: 'Finance Overview',
    description: 'A connected finance control centre for profitability, collections, payables and financing visibility.',
    icon: BarChart3
  },
  'finance-pnl': {
    title: 'P&L Statement',
    description: 'Profit and loss reporting across the fleet, rentals, operating costs and finance activity.',
    icon: BarChart3
  },
  'finance-cash-flow': {
    title: 'Cash Flow',
    description: 'Cash inflow and outflow visibility with reconciled operating and financing movements.',
    icon: ArrowLeftRight
  },
  'finance-accounts-receivable': {
    title: 'Accounts Receivable',
    description: 'Customer dues, collection ageing and receivable follow-up workflows in one controlled view.',
    icon: Receipt
  },
  'finance-customer-soa': {
    title: 'Customer SOA',
    description: 'Customer-wise statements of account with invoices, receipts, adjustments and balance history.',
    icon: FileText
  },
  'finance-accounts-payable': {
    title: 'Accounts Payable',
    description: 'Vendor and partner liabilities, payable ageing and approval-ready payment visibility.',
    icon: Receipt
  },
  'finance-asset-financing': {
    title: 'Asset EMI / Financing',
    description: 'Vehicle financing schedules, EMI obligations, lender details and outstanding principal tracking.',
    icon: Wallet
  },
  'finance-management-reports': {
    title: 'Management Reports',
    description: 'Decision-ready finance summaries for leadership review, controls and monthly close.',
    icon: BarChart3
  },
  'finance-reference-screens': {
    title: 'Reference Screens',
    description: 'Reference layouts and finance control screens for the next implementation phase.',
    icon: FileText
  }
};

const PREPARATION_CARDS = [
  {
    title: 'Data foundation',
    detail: 'Connected to live operational records when this module is released.',
    icon: Wallet,
    tone: 'blue'
  },
  {
    title: 'Control checks',
    detail: 'Approvals, reconciliation and audit history are part of the planned workflow.',
    icon: Shield,
    tone: 'violet'
  },
  {
    title: 'Release status',
    detail: 'This screen is reserved for the upcoming Finance implementation phase.',
    icon: CheckCircle2,
    tone: 'green'
  }
];

export default function FinanceComingSoonPage({ routeId, onBackToDashboard }) {
  const page = FINANCE_PAGE_CONFIG[routeId] || FINANCE_PAGE_CONFIG['finance-pnl'];
  const PageIcon = page.icon;

  return (
    <div className="terminal-content finance-coming-soon-stage">
      <div className="command-header finance-command-header">
        <div>
          <div className="breadcrumb-nav">
            <span className="breadcrumb-link" onClick={onBackToDashboard}>Dashboard</span>
            <span className="breadcrumb-sep">/</span>
            <span className="breadcrumb-link">Finance</span>
            <span className="breadcrumb-sep">/</span>
            <span className="breadcrumb-active">{page.title}</span>
          </div>
          <div className="finance-page-eyebrow">FINANCE WORKSPACE</div>
          <h1 className="executive-greeting">{page.title}</h1>
          <div className="executive-subline">{page.description}</div>
        </div>
        <button className="btn-create-order" onClick={onBackToDashboard}>
          ← Back to Dashboard
        </button>
      </div>

      <section className="finance-coming-soon-hero">
        <div className="finance-coming-soon-icon"><PageIcon size={30} /></div>
        <div className="finance-coming-soon-copy">
          <span className="finance-status-pill">COMING SOON</span>
          <h2>{page.title} is being prepared</h2>
          <p>
            This Finance workspace is planned as a connected, audit-ready module. It will use the same live
            records as the rest of the admin panel once the Finance release is enabled.
          </p>
        </div>
      </section>

      <div className="finance-coming-soon-card-grid">
        {PREPARATION_CARDS.map((card) => {
          const CardIcon = card.icon;
          return (
            <article className={`finance-coming-soon-card finance-coming-soon-card-${card.tone}`} key={card.title}>
              <div className="finance-card-icon"><CardIcon size={19} /></div>
              <div>
                <div className="finance-card-kicker">FINANCE RELEASE</div>
                <h3>{card.title}</h3>
                <p>{card.detail}</p>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
