import React, { useState } from 'react';
import {
  CreditCard,
  Lock,
  CheckCircle2,
  Clock,
  RefreshCw,
  Receipt,
  Shield,
  Info,
  Phone
} from '../common/Icons';

const cleanText = (value = '') => String(value)
  .replaceAll('â‚¹', '₹')
  .replaceAll('âˆ’', '−')
  .replaceAll('Â·', '·')
  .replaceAll('â€¢', '•');

const formatMoney = (value) => `₹${Number(value || 0).toLocaleString('en-IN')}`;

export default function DriverWalletView({ driverUser, onRefresh, refreshing }) {
  const driver = driverUser || {};
  const wallet = driver.wallet || {};
  const vehicle = driver.vehicle || {};
  const deal = driver.deal || {};
  const [activeFilter, setActiveFilter] = useState('all');

  const rawTransactions = wallet.transactionHistory || wallet.recentTransactions || [
    {
      id: 'WTX-5767',
      date: '18 Nov 2026, 06:36 AM',
      type: 'Wallet Top-up',
      amount: '+₹2,000.00',
      category: 'credit',
      method: 'UPI (UPI-83760289) · Terminal Cashier',
      status: 'Success'
    },
    {
      id: 'WTX-INV-0083',
      date: '18 Nov 2026, 06:34 AM',
      type: 'Daily Rental Auto-Debit',
      amount: '-₹1,000.00',
      category: 'debit',
      method: 'Invoice Paid: INV-26-633552 [DL52GD6605]',
      status: 'Settled'
    },
    {
      id: 'WTX-6347',
      date: '15 Oct 2026, 03:26 PM',
      type: 'Wallet Top-up',
      amount: '+₹500.00',
      category: 'credit',
      method: 'UPI (UPI-58173138) · Terminal Cashier',
      status: 'Success'
    },
    {
      id: 'WTX-1394',
      date: '15 Oct 2026, 10:00 AM',
      type: 'Initial Escrow Credit',
      amount: '+₹500.00',
      category: 'credit',
      method: 'Initial Credit Onboarding · Fleet Ops',
      status: 'Success'
    }
  ];

  const filteredTransactions = rawTransactions.filter((tx) => {
    if (activeFilter === 'credits') return cleanText(tx.amount).startsWith('+');
    if (activeFilter === 'debits') return cleanText(tx.amount).startsWith('-');
    return true;
  });

  const spendableBalance = Number(wallet.spendableBalance || 0);
  const postedBalance = Number(wallet.postedBalance || spendableBalance);
  const activeHolds = Number(wallet.activeHolds || 0);
  const isHealthy = spendableBalance >= Number(wallet.lowBalanceThreshold || 500);

  return (
    <div className="driver-wallet-page">
      <header className="driver-wallet-page-header">
        <div>
          <div className="driver-wallet-eyebrow">
            <span>Driver Console</span>
            <span className="driver-wallet-slash">/</span>
            <span>Finance &amp; Billing</span>
          </div>
          <h1>3-Pocket Smart Wallet</h1>
          <p>Track available funds, automated settlements, and every wallet movement in one place.</p>
        </div>
        <div className="driver-wallet-header-actions">
          <span className="driver-wallet-sync-status">
            <span className="driver-wallet-live-dot" /> Live ledger
          </span>
          <button type="button" className="driver-wallet-sync-btn" onClick={onRefresh} disabled={refreshing}>
            <RefreshCw size={14} className={refreshing ? 'spinning-icon' : ''} />
            {refreshing ? 'Syncing…' : 'Sync balance'}
          </button>
        </div>
      </header>

      <section className="driver-wallet-summary-grid" aria-label="Wallet summary">
        <article className="driver-wallet-summary-card driver-wallet-summary-card--primary">
          <div className="driver-wallet-card-topline">
            <div className="driver-wallet-card-label"><CreditCard size={14} /> Pocket 1 · Spendable</div>
            <span className="driver-wallet-status-chip driver-wallet-status-chip--light">Available</span>
          </div>
          <div className="driver-wallet-summary-amount">{formatMoney(spendableBalance)}</div>
          <p>Ready for daily rental deductions and operational disbursements.</p>
          <div className="driver-wallet-primary-footer">
            <span>Wallet ID <strong>{driver.id || 'DRV-14'}</strong></span>
            <span>{isHealthy ? 'Healthy balance' : 'Recharge recommended'}</span>
          </div>
        </article>

        <article className="driver-wallet-summary-card">
          <div className="driver-wallet-card-topline">
            <div className="driver-wallet-card-label"><Shield size={14} /> Pocket 2 · Posted</div>
            <span className="driver-wallet-status-chip driver-wallet-status-chip--green">Good standing</span>
          </div>
          <div className="driver-wallet-summary-amount driver-wallet-summary-amount--dark">{formatMoney(postedBalance)}</div>
          <p className="driver-wallet-positive-copy"><CheckCircle2 size={14} /> Above minimum threshold of {formatMoney(wallet.lowBalanceThreshold || 500)}</p>
          <div className="driver-wallet-card-footnote">Total posted ledger balance</div>
        </article>

        <article className="driver-wallet-summary-card">
          <div className="driver-wallet-card-topline">
            <div className="driver-wallet-card-label"><Lock size={14} /> Pocket 3 · Holds &amp; tolls</div>
            <span className={`driver-wallet-status-chip ${activeHolds ? 'driver-wallet-status-chip--amber' : 'driver-wallet-status-chip--neutral'}`}>
              {activeHolds ? 'Active hold' : 'Zero holds'}
            </span>
          </div>
          <div className={`driver-wallet-summary-amount ${activeHolds ? 'driver-wallet-summary-amount--amber' : 'driver-wallet-summary-amount--green'}`}>
            {formatMoney(activeHolds)}
          </div>
          <p>{activeHolds ? 'Reserved against unbilled tolls or charging sessions.' : 'No outstanding security holds or penalties.'}</p>
          <div className="driver-wallet-card-footnote">Released after settlement</div>
        </article>
      </section>

      <section className="driver-wallet-policy-banner">
        <div className="driver-wallet-policy-icon"><Lock size={16} /></div>
        <div>
          <strong>Read-only institutional ledger</strong>
          <p>Wallet credits, rental debits, and settlement entries are administered by Sikhar Fleet Operations and synced automatically.</p>
        </div>
        <span className="driver-wallet-policy-tag">Driver view</span>
      </section>

      <div className="driver-wallet-main-grid">
        <section className="driver-wallet-panel driver-wallet-billing-panel">
          <div className="driver-wallet-panel-heading">
            <div className="driver-wallet-panel-icon driver-wallet-panel-icon--blue"><Receipt size={17} /></div>
            <div>
              <h2>Rental billing &amp; settlement</h2>
              <p>Commercial lease parameters linked to this wallet</p>
            </div>
          </div>

          <div className="driver-wallet-parameter-list">
            <div className="driver-wallet-parameter-row">
              <div><span>Daily lease rate</span><strong>{cleanText(deal.rate || '₹1,000 / daily')}</strong></div>
              <span className="driver-wallet-mini-tag driver-wallet-mini-tag--green">Fixed lease</span>
            </div>
            <div className="driver-wallet-parameter-row">
              <div><span>Automated settlement schedule</span><strong>Daily at 06:00 AM <em>(shift-start auto-debit)</em></strong></div>
              <span className="driver-wallet-mini-tag driver-wallet-mini-tag--blue">Automated</span>
            </div>
            <div className="driver-wallet-parameter-row">
              <div><span>Allocated vehicle</span><strong className="driver-wallet-vehicle-number">{vehicle.registration || 'DL52GD6605'}</strong></div>
              <small>{vehicle.model || 'TATA TIGOR EV XPRESS T'}</small>
            </div>
            <div className="driver-wallet-parameter-row">
              <div><span>Escrow security deposit</span><strong>{cleanText(deal.deposit || '₹5,000 (secured in escrow)')}</strong></div>
              <span className="driver-wallet-mini-tag driver-wallet-mini-tag--green">Held safe</span>
            </div>
          </div>

          <div className="driver-wallet-guidance">
            <div className="driver-wallet-guidance-title"><Info size={15} /> How to top up your fleet wallet</div>
            <ol>
              <li><strong>Hub cashier:</strong> Visit Gurgaon Central Terminal #1 to pay by cash or scan the terminal POS QR.</li>
              <li><strong>Bank escrow:</strong> Mention your Driver ID <b>{driver.id || 'DRV-14'}</b> in the payment remarks.</li>
              <li><strong>Need help?</strong> Contact Hub Dispatch at <a href="tel:+919818778654"><Phone size={12} /> +91 98187 78654</a>.</li>
            </ol>
          </div>
        </section>

        <section className="driver-wallet-panel driver-wallet-ledger-panel">
          <div className="driver-wallet-panel-heading driver-wallet-ledger-heading">
            <div className="driver-wallet-panel-heading-content">
              <div className="driver-wallet-panel-icon driver-wallet-panel-icon--green"><Clock size={17} /></div>
              <div>
                <h2>Smart wallet transaction ledger</h2>
                <p>Audited credits, rental auto-debits, and settlement entries</p>
              </div>
            </div>
            <button type="button" className="driver-wallet-quiet-btn" onClick={onRefresh} disabled={refreshing}>
              <RefreshCw size={13} className={refreshing ? 'spinning-icon' : ''} /> Refresh
            </button>
          </div>

          <div className="driver-wallet-filter-bar" role="tablist" aria-label="Transaction filters">
            {[
              { id: 'all', label: `All (${rawTransactions.length})` },
              { id: 'credits', label: 'Credits (+)' },
              { id: 'debits', label: 'Rental debits (−)' }
            ].map((filter) => (
              <button
                key={filter.id}
                type="button"
                role="tab"
                aria-selected={activeFilter === filter.id}
                className={`driver-wallet-filter ${activeFilter === filter.id ? 'is-active' : ''}`}
                onClick={() => setActiveFilter(filter.id)}
              >
                {filter.label}
              </button>
            ))}
          </div>

          <div className="driver-wallet-transaction-list">
            {filteredTransactions.map((tx) => {
              const amount = cleanText(tx.amount);
              const isCredit = amount.startsWith('+');
              return (
                <article className="driver-wallet-transaction" key={tx.id}>
                  <div className={`driver-wallet-transaction-icon ${isCredit ? 'is-credit' : 'is-debit'}`}>
                    {isCredit ? '+' : '−'}
                  </div>
                  <div className="driver-wallet-transaction-copy">
                    <div className="driver-wallet-transaction-title-row">
                      <strong>{cleanText(tx.type)}</strong>
                      <span className={`driver-wallet-transaction-status ${tx.status === 'Success' ? 'is-success' : 'is-settled'}`}>
                        <CheckCircle2 size={11} /> {cleanText(tx.status)}
                      </span>
                    </div>
                    <span>{cleanText(tx.date)} <b>·</b> {cleanText(tx.method)}</span>
                    <small>Reference: {cleanText(tx.id)}</small>
                  </div>
                  <strong className={`driver-wallet-transaction-amount ${isCredit ? 'is-credit' : 'is-debit'}`}>{amount}</strong>
                </article>
              );
            })}
            {filteredTransactions.length === 0 && (
              <div className="driver-wallet-empty-state">No transactions match the selected filter.</div>
            )}
          </div>

          <div className="driver-wallet-ledger-footer">
            <span>Showing {filteredTransactions.length} of {rawTransactions.length} all-time transactions</span>
            <span className="driver-wallet-ledger-protection"><Shield size={12} /> Secure audit trail</span>
          </div>
        </section>
      </div>
    </div>
  );
}
