import React, { useState, useEffect, useCallback } from 'react';
import {
  Receipt,
  Plus,
  RefreshCw,
  Search,
  CheckCircle2,
  Clock,
  Car,
  Users,
  CreditCard,
  ChevronRight,
  Eye,
  Printer,
  Download,
  AlertTriangle,
  RotateCcw,
  FileText,
  X
} from '../common/Icons';
import {
  fetchInvoicesApi,
  createInvoiceApi,
  payInvoiceWalletApi,
  payInvoiceDirectApi,
  waiveInvoiceApi,
  fetchDriversApi
} from '../../services/api';

export default function InvoicesPage({ onNavigate, onBackToDashboard }) {
  const [loading, setLoading] = useState(true);
  const [invoices, setInvoices] = useState([]);
  const [summary, setSummary] = useState({});
  const [drivers, setDrivers] = useState([]);
  const [toastMessage, setToastMessage] = useState(null);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'pending' | 'paid'

  // Modals
  const [collectModal, setCollectModal] = useState(null); // invoice object for manual UPI/Cash payment
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [paymentRef, setPaymentRef] = useState('');
  const [isPaying, setIsPaying] = useState(false);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3800);
  };

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [invRes, drvRes] = await Promise.all([
        fetchInvoicesApi(statusFilter, searchQuery),
        fetchDriversApi('all', 'all')
      ]);

      if (invRes) {
        setInvoices(invRes.invoices || []);
        setSummary(invRes.summary || {});
      }
      if (drvRes && drvRes.drivers) {
        setDrivers(drvRes.drivers);
      }
    } catch (err) {
      console.error('Failed to load invoices:', err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, searchQuery]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Pay Invoice from Driver Wallet
  const handlePayFromWallet = async (invoice) => {
    try {
      setIsPaying(true);
      const res = await payInvoiceWalletApi(invoice.id);
      showToast(`✅ ${res.message || 'Invoice paid from driver wallet!'}`);
      loadData();
    } catch (err) {
      alert(err.message || 'Failed to pay invoice from wallet.');
    } finally {
      setIsPaying(false);
    }
  };

  // Collect via UPI / Cash
  const handleDirectPayment = async (e) => {
    e.preventDefault();
    if (!collectModal) return;
    try {
      setIsPaying(true);
      const ref = paymentRef || `${paymentMethod}-${Date.now().toString().slice(-6)}`;
      const res = await payInvoiceDirectApi(collectModal.id, paymentMethod, ref);
      showToast(`✅ ${res.message || 'Payment successfully recorded!'}`);
      setCollectModal(null);
      setPaymentRef('');
      loadData();
    } catch (err) {
      alert(err.message || 'Failed to record payment.');
    } finally {
      setIsPaying(false);
    }
  };

  // Waive Invoice / Issue Credit Note
  const handleWaiveInvoice = async (invoice) => {
    const reason = prompt(`Waive invoice ${invoice.invoiceNumber}? Enter reason:`, 'Administrative concession / vehicle downtime waiver');
    if (!reason) return;
    try {
      const res = await waiveInvoiceApi(invoice.id, reason);
      showToast(`✅ ${res.message || 'Invoice waived.'}`);
      loadData();
    } catch (err) {
      alert(err.message || 'Failed to waive invoice.');
    }
  };

  return (
    <div className="terminal-content invoices-stage-container">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="clean-toast-notification">
          <div className="clean-toast-content">
            <CheckCircle2 size={16} color="#10b981" />
            <span>{toastMessage}</span>
          </div>
          <button
            type="button"
            className="toast-dismiss-btn"
            onClick={() => setToastMessage(null)}
            title="Dismiss"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Top Header */}
      <div className="command-header">
        <div>
          <div className="breadcrumb-nav">
            <span className="breadcrumb-link" onClick={() => onBackToDashboard && onBackToDashboard()}>Dashboard</span>
            <ChevronRight size={13} className="breadcrumb-sep" />
            <span className="breadcrumb-link">Rentals &amp; Collections</span>
            <ChevronRight size={13} className="breadcrumb-sep" />
            <span className="breadcrumb-active">Rental Invoices &amp; Billing</span>
          </div>
          <h1 className="executive-greeting" style={{ marginTop: '4px' }}>
            Rental Invoices &amp; Payment Collections
          </h1>
          <div className="executive-subline">
            Automated Daily Lease Invoicing · Spendable Wallet Auto-Debit · UPI/Cash Collections · Formal Tax Invoices
          </div>
        </div>

        <div className="command-actions-row">
          <button
            className="btn primary"
            onClick={() => onNavigate && onNavigate('generate-invoice')}
          >
            <Plus size={15} />
            <span>+ Generate Invoice</span>
          </button>
          <button
            className="btn secondary"
            onClick={loadData}
            title="Refresh invoices"
          >
            <RefreshCw size={15} />
            <span>Sync Invoices</span>
          </button>
        </div>
      </div>

      {/* Metric Highlight Cards */}
      <div className="assignment-stats-strip">
        <div className="assignment-stat-card">
          <div className="stat-card-top">
            <span className="stat-card-label">TOTAL BILLED (INVOICED)</span>
            <div className="stat-icon-bubble blue">
              <Receipt size={16} />
            </div>
          </div>
          <div className="stat-card-val">₹{(summary.totalBilled || 6400).toLocaleString('en-IN')}</div>
          <div className="stat-card-subline">
            Across {invoices.length} commercial rental invoices
          </div>
        </div>

        <div className="assignment-stat-card">
          <div className="stat-card-top">
            <span className="stat-card-label">COLLECTIONS REALIZED</span>
            <div className="stat-icon-bubble green">
              <CheckCircle2 size={16} />
            </div>
          </div>
          <div className="stat-card-val" style={{ color: '#047857' }}>
            ₹{(summary.totalCollected || 2400).toLocaleString('en-IN')}
          </div>
          <div className="stat-card-subline">
            {summary.paidCount || 2} invoices paid &amp; settled
          </div>
        </div>

        <div className="assignment-stat-card">
          <div className="stat-card-top">
            <span className="stat-card-label">OUTSTANDING UNPAID DUES</span>
            <div className="stat-icon-bubble amber">
              <Clock size={16} />
            </div>
          </div>
          <div className="stat-card-val" style={{ color: '#b45309' }}>
            ₹{(summary.totalPending || 4000).toLocaleString('en-IN')}
          </div>
          <div className="stat-card-subline">
            {summary.overdueCount || 4} invoices pending payment
          </div>
        </div>

        <div className="assignment-stat-card">
          <div className="stat-card-top">
            <span className="stat-card-label">GST COLLECTED (5%)</span>
            <div className="stat-icon-bubble purple">
              <FileText size={16} />
            </div>
          </div>
          <div className="stat-card-val">
            ₹{Math.round((summary.totalBilled || 6400) * 0.05).toLocaleString('en-IN')}
          </div>
          <div className="stat-card-subline">
            SAC Code 996601 (Commercial Passenger)
          </div>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="assignment-controls-bar">
        <div className="controls-search-wrap">
          <Search size={15} color="#64748b" />
          <input
            type="text"
            placeholder="Search by invoice # (INV-26...), customer name, vehicle plate, or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="clean-search-input"
          />
        </div>

        <div className="controls-right-filters">
          <div className="pill-filter-group">
            <button
              className={`pill-filter-btn ${statusFilter === 'all' ? 'active' : ''}`}
              onClick={() => setStatusFilter('all')}
            >
              All Invoices ({invoices.length})
            </button>
            <button
              className={`pill-filter-btn ${statusFilter === 'pending' ? 'active' : ''}`}
              onClick={() => setStatusFilter('pending')}
            >
              Pending Dues ({invoices.filter(i => i.status === 'Pending').length})
            </button>
            <button
              className={`pill-filter-btn ${statusFilter === 'paid' ? 'active' : ''}`}
              onClick={() => setStatusFilter('paid')}
            >
              Paid &amp; Settled ({invoices.filter(i => i.status === 'Paid').length})
            </button>
          </div>

          <button
            className="btn secondary"
            onClick={() => onNavigate && onNavigate('bookings')}
          >
            <FileText size={14} />
            <span>View Leases →</span>
          </button>
        </div>
      </div>

      {/* Invoices Master Table */}
      {loading ? (
        <div className="loading-state-box">
          <RefreshCw size={24} className="spin-icon" color="#1868f0" />
          <p>Loading invoices...</p>
        </div>
      ) : invoices.length === 0 ? (
        <div className="no-active-state-box">
          <div className="empty-graphic-circle">
            <Receipt size={36} color="#0284c7" />
          </div>
          <h3>No Invoices Found</h3>
          <p>No invoices matched your current query or filter.</p>
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="enterprise-table">
            <thead>
              <tr>
                <th>Invoice Number</th>
                <th>Customer / Driver</th>
                <th>Vehicle Asset</th>
                <th>Period Date</th>
                <th>Taxable Base + GST</th>
                <th>Total Value</th>
                <th>Status</th>
                <th style={{ textAlign: 'right', paddingRight: '20px' }}>Collections &amp; Actions</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => {
                const isPaid = inv.status === 'Paid';
                const isWaived = inv.status === 'Waived';

                return (
                  <tr key={inv.id} className="interactive-table-row">
                    <td>
                      <strong
                        className="mono-text"
                        style={{ color: '#1868f0', fontSize: '13px', cursor: 'pointer' }}
                        onClick={() => {
                          localStorage.setItem('sikhar_selected_invoice_id', inv.id);
                          if (onNavigate) onNavigate('invoice-detail');
                        }}
                        title="Click to view full Tax Invoice on dedicated page"
                      >
                        {inv.invoiceNumber}
                      </strong>
                      {(inv.leaseNumber || inv.leaseId) && (
                        <div style={{ marginTop: '2px' }}>
                          <span
                            className="sub-cell-text"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '3px',
                              background: '#eff6ff',
                              color: '#1d4ed8',
                              padding: '1px 6px',
                              borderRadius: '4px',
                              fontSize: '10.5px',
                              fontWeight: 600,
                              cursor: 'pointer'
                            }}
                            onClick={() => {
                              if (onNavigate) onNavigate('bookings');
                            }}
                            title="Linked Commercial Lease Agreement — Click to view Leases"
                          >
                            📄 {inv.leaseNumber || inv.leaseId}
                          </span>
                        </div>
                      )}
                      <div className="sub-cell-text">Due: {inv.dueDate}</div>
                    </td>
                    <td>
                      <strong style={{ color: '#0f172a' }}>{inv.customerName}</strong>
                      <div className="sub-cell-text">📱 {inv.driverPhone}</div>
                      {inv.driverName && inv.driverName !== inv.customerName && (
                        <div className="sub-cell-text">Driver: {inv.driverName}</div>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span className="veh-reg-badge primary">{inv.vehicleRegistration}</span>
                      </div>
                      <div className="sub-cell-text">{inv.vehicleModel}</div>
                    </td>
                    <td>
                      <strong>{inv.period}</strong>
                      <div className="sub-cell-text">{inv.notes || 'Daily Lease'}</div>
                    </td>
                    <td>
                      <div>Base: ₹{inv.baseAmount?.toLocaleString('en-IN')}</div>
                      <div className="sub-cell-text">GST 5%: ₹{inv.gstAmount?.toLocaleString('en-IN')}</div>
                    </td>
                    <td>
                      <strong style={{ fontSize: '14px', color: isPaid ? '#047857' : '#0f172a' }}>
                        ₹{inv.totalAmount?.toLocaleString('en-IN')}
                      </strong>
                      {!isPaid && !isWaived && (
                        <div className="sub-cell-text" style={{ color: '#ea580c' }}>
                          Due: ₹{inv.balanceDue?.toLocaleString('en-IN')}
                        </div>
                      )}
                    </td>
                    <td>
                      <span className={`status-pill ${isPaid ? 'good' : isWaived ? 'blue' : 'warn'}`}>
                        {inv.status}
                      </span>
                      {inv.paymentMethod && (
                        <div className="sub-cell-text" style={{ fontSize: '11px', marginTop: '2px' }}>
                          via {inv.paymentMethod}
                        </div>
                      )}
                    </td>
                    <td style={{ textAlign: 'right', paddingRight: '20px' }}>
                      <div className="table-actions-cluster">
                        {!isPaid && !isWaived ? (
                          <>
                            <button
                              className="btn-action-pill primary-wallet"
                              onClick={() => handlePayFromWallet(inv)}
                              disabled={isPaying}
                              title="Deduct from driver's spendable wallet balance"
                            >
                              <CreditCard size={12} />
                              <span>Pay from Wallet</span>
                            </button>
                            <button
                              className="btn-action-pill outline-collect"
                              onClick={() => setCollectModal(inv)}
                              title="Record payment via UPI or Cash"
                            >
                              <span>Collect</span>
                            </button>
                            <button
                              className="btn-action-pill ghost-waive"
                              onClick={() => handleWaiveInvoice(inv)}
                              title="Waive invoice and issue credit note"
                            >
                              <span>Waive</span>
                            </button>
                          </>
                        ) : (
                          <span className="settled-tag">
                            {isPaid ? '✓ Paid & Settled' : '— Waived'}
                          </span>
                        )}

                        <button
                          className="btn-action-pill pdf-view"
                          onClick={() => {
                            localStorage.setItem('sikhar_selected_invoice_id', inv.id);
                            if (onNavigate) onNavigate('invoice-detail');
                          }}
                          title="Open Tax Invoice document on dedicated page"
                        >
                          <Eye size={12} />
                          <span>View Invoice</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ========================================================
         MODAL: MANUAL COLLECT (UPI / CASH)
         ======================================================== */}
      {collectModal && (
        <div className="clean-modal-backdrop">
          <div className="clean-modal-dialog">
            <div className="clean-modal-header">
              <div className="modal-title-wrap">
                <CreditCard size={18} color="#0284c7" />
                <h3>Collect Payment · {collectModal.invoiceNumber}</h3>
              </div>
              <button className="modal-close-btn" onClick={() => setCollectModal(null)}>✕</button>
            </div>

            <form onSubmit={handleDirectPayment} className="clean-modal-body">
              <div className="revert-summary-box">
                <div className="summary-row">
                  <span>Customer:</span>
                  <strong>{collectModal.customerName}</strong>
                </div>
                <div className="summary-row">
                  <span>Vehicle:</span>
                  <strong>{collectModal.vehicleRegistration}</strong>
                </div>
                <div className="summary-row">
                  <span>Outstanding Invoice Balance:</span>
                  <strong style={{ color: '#ea580c' }}>₹{collectModal.balanceDue?.toLocaleString('en-IN')}</strong>
                </div>
              </div>

              <div className="form-field-group">
                <label className="input-label">Payment Channel *</label>
                <select
                  className="styled-input-select"
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                >
                  <option value="UPI">UPI (Google Pay / PhonePe / Paytm)</option>
                  <option value="Cash">Cash Handover at Yard</option>
                  <option value="Bank Transfer">Bank Transfer / NEFT / IMPS</option>
                  <option value="POS Card Terminal">Card Swiped on POS Terminal</option>
                </select>
              </div>

              <div className="form-field-group">
                <label className="input-label">Payment Transaction Reference (UTR / Receipt ID) *</label>
                <input
                  type="text"
                  className="styled-input-text font-mono"
                  placeholder="e.g. UTR-98218731"
                  value={paymentRef}
                  onChange={(e) => setPaymentRef(e.target.value)}
                  required
                />
              </div>

              <div className="clean-modal-footer" style={{ padding: '16px 0 0 0', border: 'none', background: 'transparent' }}>
                <button
                  type="button"
                  className="btn secondary"
                  onClick={() => setCollectModal(null)}
                  disabled={isPaying}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn primary"
                  disabled={isPaying}
                >
                  {isPaying ? 'Recording...' : `Confirm Receipt of ₹${collectModal.balanceDue?.toLocaleString('en-IN')}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
