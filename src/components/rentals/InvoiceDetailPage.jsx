import React, { useState, useEffect, useCallback } from 'react';
import {
  Receipt,
  ArrowLeft,
  Printer,
  CreditCard,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  RefreshCw,
  FileText,
  Shield,
  Clock,
  Car,
  Users,
  Info,
  X
} from '../common/Icons';
import {
  fetchInvoicesApi,
  payInvoiceWalletApi,
  payInvoiceDirectApi,
  waiveInvoiceApi
} from '../../services/api';

export default function InvoiceDetailPage({
  invoiceId,
  onBackToInvoices,
  onBackToDashboard,
  onNavigate
}) {
  const [loading, setLoading] = useState(true);
  const [invoice, setInvoice] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Manual Direct Collect Modal/Form State
  const [showCollectForm, setShowCollectForm] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [paymentRef, setPaymentRef] = useState('');

  const activeId = invoiceId || localStorage.getItem('sikhar_selected_invoice_id');

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3800);
  };

  const loadInvoice = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetchInvoicesApi('all');
      if (res && res.invoices) {
        const found = res.invoices.find(inv => inv.id === activeId || inv.invoiceNumber === activeId);
        if (found) {
          setInvoice(found);
        } else if (res.invoices.length > 0) {
          // Fallback to first invoice if ID not found
          setInvoice(res.invoices[0]);
        }
      }
    } catch (err) {
      console.error('Failed to load invoice:', err);
    } finally {
      setLoading(false);
    }
  }, [activeId]);

  useEffect(() => {
    loadInvoice();
  }, [loadInvoice]);

  // Action: Pay from Driver Wallet
  const handlePayFromWallet = async () => {
    if (!invoice) return;
    try {
      setIsProcessing(true);
      const res = await payInvoiceWalletApi(invoice.id);
      showToast(`✅ ${res.message || 'Invoice paid from driver spendable wallet!'}`);
      loadInvoice();
    } catch (err) {
      alert(err.message || 'Failed to pay invoice from wallet.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Action: Direct UPI / Cash Handover Collection
  const handleDirectCollect = async (e) => {
    e.preventDefault();
    if (!invoice) return;
    try {
      setIsProcessing(true);
      const ref = paymentRef || `${paymentMethod}-${Date.now().toString().slice(-6)}`;
      const res = await payInvoiceDirectApi(invoice.id, paymentMethod, ref);
      showToast(`✅ ${res.message || 'Payment successfully recorded!'}`);
      setShowCollectForm(false);
      setPaymentRef('');
      loadInvoice();
    } catch (err) {
      alert(err.message || 'Failed to record payment.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Action: Waive Invoice (Issue Credit Note)
  const handleWaiveInvoice = async () => {
    if (!invoice) return;
    const reason = prompt(
      `Waive invoice ${invoice.invoiceNumber}? Enter official business reason for waiver:`,
      'Vehicle breakdown / workshop maintenance downtime waiver'
    );
    if (!reason) return;
    try {
      setIsProcessing(true);
      const res = await waiveInvoiceApi(invoice.id, reason);
      showToast(`✅ ${res.message || 'Invoice waived and credit note issued.'}`);
      loadInvoice();
    } catch (err) {
      alert(err.message || 'Failed to waive invoice.');
    } finally {
      setIsProcessing(false);
    }
  };

  const isPaid = invoice?.status === 'Paid';
  const isWaived = invoice?.status === 'Waived';
  const isPending = !isPaid && !isWaived;

  return (
    <div className="terminal-content invoice-detail-page-stage">
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

      {/* Top Header & Breadcrumb */}
      <div className="command-header">
        <div>
          <div className="breadcrumb-nav">
            <span
              className="breadcrumb-link"
              onClick={() => onBackToDashboard && onBackToDashboard()}
            >
              Dashboard
            </span>
            <ChevronRight size={13} className="breadcrumb-sep" />
            <span
              className="breadcrumb-link"
              onClick={() => onBackToInvoices && onBackToInvoices()}
            >
              Rentals &amp; Collections
            </span>
            <ChevronRight size={13} className="breadcrumb-sep" />
            <span
              className="breadcrumb-link"
              onClick={() => onBackToInvoices && onBackToInvoices()}
            >
              Invoices
            </span>
            <ChevronRight size={13} className="breadcrumb-sep" />
            <span className="breadcrumb-active">
              Tax Invoice {invoice?.invoiceNumber || activeId}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '6px' }}>
            <h1 className="executive-greeting" style={{ margin: 0 }}>
              Tax Invoice · {invoice?.invoiceNumber || 'INV-26-XXXX'}
            </h1>
            {invoice && (
              <span className={`status-pill ${isPaid ? 'good' : isWaived ? 'blue' : 'warn'}`}>
                {isPaid ? '✓ Paid & Settled' : isWaived ? '— Waived (Credit Note)' : '⏳ Payment Due'}
              </span>
            )}
          </div>
          <div className="executive-subline">
            Official GST Tax Invoice Document · SAC 996601 · Autonomous Fleet Ledger Entry
          </div>
        </div>

        <div className="command-actions-row">
          <button
            type="button"
            className="btn secondary"
            onClick={() => onBackToInvoices ? onBackToInvoices() : (onNavigate && onNavigate('invoices'))}
          >
            <ArrowLeft size={15} />
            <span>Back to Invoices</span>
          </button>

          <button
            type="button"
            className="btn secondary"
            onClick={() => window.print()}
          >
            <Printer size={15} />
            <span>Print Tax Invoice</span>
          </button>

          {isPending && (
            <button
              type="button"
              className="btn primary"
              onClick={handlePayFromWallet}
              disabled={isProcessing}
            >
              <CreditCard size={15} />
              <span>{isProcessing ? 'Processing...' : 'Pay from Spendable Wallet'}</span>
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="loading-state-box">
          <RefreshCw size={24} className="spin-icon" color="#1868f0" />
          <p>Loading tax invoice document...</p>
        </div>
      ) : !invoice ? (
        <div className="no-active-state-box">
          <AlertTriangle size={36} color="#ea580c" />
          <h3>Invoice Not Found</h3>
          <p>The requested invoice record could not be located in the fleet registry.</p>
          <button
            className="btn primary"
            onClick={() => onBackToInvoices ? onBackToInvoices() : (onNavigate && onNavigate('invoices'))}
          >
            Return to Invoices List
          </button>
        </div>
      ) : (
        /* Main Two-Column Layout */
        <div className="invoice-detail-split-stage">
          {/* LEFT COLUMN: Authentic Printable Tax Invoice Paper Sheet */}
          <div className="invoice-paper-sheet-container">
            <div className="formal-tax-invoice-sheet invoice-full-elevation">
              {/* Corporate Letterhead Header */}
              <div className="invoice-corp-header">
                <div>
                  <h2 className="corp-name">SIKHAR FLEET PRIVATE LIMITED</h2>
                  <div className="corp-meta">
                    CIN: U60200HR2026PTC099882 · GSTIN: 06AAACS8899F1ZU<br />
                    Central Operations Hub: Sector 44, Gurgaon, Haryana - 122003<br />
                    Email: billing@sikharfleet.com · Support: +91 124 498 7700
                  </div>
                </div>

                <div className="invoice-meta-badge-box">
                  <span className="inv-badge-title">TAX INVOICE</span>
                  <strong className="inv-badge-no">{invoice.invoiceNumber}</strong>
                  <span className="inv-badge-date">Invoice Date: {invoice.invoiceDate}</span>
                  <span
                    className="inv-badge-date"
                    style={{ color: isPaid ? '#16a34a' : '#ea580c', fontWeight: '700' }}
                  >
                    Due Date: {invoice.dueDate}
                  </span>
                </div>
              </div>

              {/* Billed To / Asset Information Grid */}
              <div className="invoice-parties-grid">
                <div className="party-box">
                  <span className="party-label">BILLED TO (LESSEE / DRIVER):</span>
                  <strong className="party-name">{invoice.customerName}</strong>
                  <div className="party-details">
                    Driver: {invoice.driverName || invoice.customerName}<br />
                    Mobile Phone: {invoice.driverPhone}<br />
                    Address: Gurgaon Operations Hub, Delhi NCR<br />
                    Customer ID: {invoice.customerId || 'CUST-26-CORP'}
                  </div>
                </div>

                <div className="party-box">
                  <span className="party-label">COMMERCIAL VEHICLE &amp; LEASE DETAILS:</span>
                  <strong className="party-name">{invoice.vehicleRegistration}</strong>
                  <div className="party-details">
                    Model: {invoice.vehicleModel}<br />
                    Period: {invoice.period}<br />
                    Billing Type: Commercial Fleet Lease<br />
                    Terms: Immediate Wallet Auto-Debit / Prepaid UPI
                  </div>
                </div>
              </div>

              {/* Line Items Table */}
              <table className="tax-invoice-items-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Description of Commercial Supply</th>
                    <th>HSN / SAC</th>
                    <th>Taxable Base</th>
                    <th>CGST (2.5%)</th>
                    <th>SGST (2.5%)</th>
                    <th style={{ textAlign: 'right' }}>Total (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>1</td>
                    <td>
                      <strong>Commercial Passenger Vehicle Rental Fee</strong>
                      <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                        Lease fee for {invoice.vehicleModel} [{invoice.vehicleRegistration}] · {invoice.period}
                      </div>
                    </td>
                    <td>996601</td>
                    <td>₹{invoice.baseAmount?.toLocaleString('en-IN')}</td>
                    <td>₹{(invoice.gstAmount / 2).toFixed(2)}</td>
                    <td>₹{(invoice.gstAmount / 2).toFixed(2)}</td>
                    <td style={{ textAlign: 'right' }}>
                      <strong style={{ fontSize: '14px', color: '#0f172a' }}>
                        ₹{invoice.totalAmount?.toLocaleString('en-IN')}
                      </strong>
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* Totals Breakdown & Official Stamp */}
              <div className="invoice-totals-breakdown">
                <div className="invoice-payment-stamp">
                  {isPaid ? (
                    <div className="stamp-box paid">
                      <span>PAID &amp; SETTLED</span>
                      <small>via {invoice.paymentMethod || 'Driver Spendable Wallet'}</small>
                      <small style={{ fontSize: '9px', opacity: 0.85, marginTop: '2px' }}>
                        Ref: {invoice.receiptReference || 'WTX-INV-AUTO'}
                      </small>
                    </div>
                  ) : isWaived ? (
                    <div className="stamp-box" style={{ border: '2px solid #7c3aed', color: '#7c3aed', background: '#faf5ff' }}>
                      <span>WAIVED &amp; CLOSED</span>
                      <small>CREDIT NOTE ISSUED</small>
                    </div>
                  ) : (
                    <div className="stamp-box unpaid">
                      <span>PAYMENT DUE</span>
                      <small>Due Date: {invoice.dueDate}</small>
                    </div>
                  )}
                </div>

                <div className="totals-calc-col">
                  <div className="calc-row">
                    <span>Total Taxable Base:</span>
                    <strong>₹{invoice.baseAmount?.toLocaleString('en-IN')}</strong>
                  </div>
                  <div className="calc-row">
                    <span>CGST (2.5%):</span>
                    <strong>₹{(invoice.gstAmount / 2).toFixed(2)}</strong>
                  </div>
                  <div className="calc-row">
                    <span>SGST (2.5%):</span>
                    <strong>₹{(invoice.gstAmount / 2).toFixed(2)}</strong>
                  </div>
                  <div className="calc-row">
                    <span>Total GST (5%):</span>
                    <strong>₹{invoice.gstAmount?.toLocaleString('en-IN')}</strong>
                  </div>
                  <div className="calc-row grand-total">
                    <span>Total Invoice Value:</span>
                    <strong style={{ color: '#1868f0' }}>₹{invoice.totalAmount?.toLocaleString('en-IN')}</strong>
                  </div>
                  <div className="calc-row">
                    <span>Amount Paid:</span>
                    <strong style={{ color: '#047857' }}>₹{invoice.amountPaid?.toLocaleString('en-IN')}</strong>
                  </div>
                  <div className="calc-row">
                    <span>Balance Outstanding Due:</span>
                    <strong style={{ color: invoice.balanceDue > 0 ? '#ea580c' : '#047857', fontSize: '14px' }}>
                      ₹{invoice.balanceDue?.toLocaleString('en-IN')}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Signatory Footer */}
              <div className="invoice-footer-terms">
                <p style={{ margin: '0 0 4px 0' }}>
                  <strong>SAC Code 996601:</strong> Rental services of passenger vehicles including motor cabs with operator.
                </p>
                <span>Authorized Signatory for Sikhar Fleet Private Limited · Computer Generated Tax Invoice</span>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Operational Management & Audit Cards */}
          <div className="invoice-audit-sidebar-column">
            {/* Quick Actions Card */}
            {isPending && (
              <div className="audit-panel-card">
                <div className="audit-card-header">
                  <CreditCard size={16} color="#1868f0" />
                  <h4>Settle / Collect Payment</h4>
                </div>

                <div className="audit-card-body">
                  <div className="outstanding-balance-hero">
                    <span className="balance-label">OUTSTANDING BALANCE DUE</span>
                    <div className="balance-val">₹{invoice.balanceDue?.toLocaleString('en-IN')}</div>
                  </div>

                  <div className="action-buttons-stack">
                    <button
                      className="btn primary"
                      style={{ width: '100%', justifyContent: 'center' }}
                      onClick={handlePayFromWallet}
                      disabled={isProcessing}
                    >
                      <CreditCard size={15} />
                      <span>Pay from Spendable Wallet</span>
                    </button>

                    <button
                      className="btn secondary"
                      style={{ width: '100%', justifyContent: 'center' }}
                      onClick={() => setShowCollectForm(!showCollectForm)}
                    >
                      <span>Collect via UPI / Cash</span>
                    </button>

                    <button
                      className="btn-action-pill ghost-waive"
                      style={{ width: '100%', justifyContent: 'center', padding: '10px' }}
                      onClick={handleWaiveInvoice}
                      disabled={isProcessing}
                    >
                      <span>Waive Invoice (Issue Credit Note)</span>
                    </button>
                  </div>

                  {/* Inline UPI/Cash Collect Form */}
                  {showCollectForm && (
                    <form onSubmit={handleDirectCollect} className="inline-collect-form-box">
                      <div className="form-field-group">
                        <label className="input-label">Payment Channel</label>
                        <select
                          className="styled-input-select"
                          value={paymentMethod}
                          onChange={(e) => setPaymentMethod(e.target.value)}
                        >
                          <option value="UPI">UPI (Google Pay / PhonePe / Paytm)</option>
                          <option value="Cash">Cash Handover at Fleet Yard</option>
                          <option value="Bank Transfer">Bank Transfer (NEFT / IMPS)</option>
                          <option value="POS Card">POS Card Terminal</option>
                        </select>
                      </div>

                      <div className="form-field-group">
                        <label className="input-label">Transaction Ref / UTR *</label>
                        <input
                          type="text"
                          className="styled-input-text font-mono"
                          placeholder="e.g. UTR-98218731"
                          value={paymentRef}
                          onChange={(e) => setPaymentRef(e.target.value)}
                          required
                        />
                      </div>

                      <button
                        type="submit"
                        className="btn primary"
                        style={{ width: '100%', marginTop: '6px' }}
                        disabled={isProcessing}
                      >
                        {isProcessing ? 'Recording...' : `Confirm Receipt of ₹${invoice.balanceDue}`}
                      </button>
                    </form>
                  )}
                </div>
              </div>
            )}

            {/* Audit & Transaction Trail Card */}
            <div className="audit-panel-card">
              <div className="audit-card-header">
                <FileText size={16} color="#047857" />
                <h4>Financial Audit &amp; Ledger Trail</h4>
              </div>

              <div className="audit-card-body">
                <div className="audit-trail-timeline">
                  <div className="timeline-node">
                    <div className="node-dot green"></div>
                    <div className="node-content">
                      <div className="node-title">Invoice Created &amp; Tax Calculated</div>
                      <div className="node-sub">SAC Code 996601 with 5% GST (2.5% CGST + 2.5% SGST)</div>
                      <span className="node-time">{invoice.invoiceDate}</span>
                    </div>
                  </div>

                  {isPaid ? (
                    <div className="timeline-node">
                      <div className="node-dot blue"></div>
                      <div className="node-content">
                        <div className="node-title">Payment Realized &amp; Settled</div>
                        <div className="node-sub">Channel: {invoice.paymentMethod || 'Driver Spendable Wallet'}</div>
                        <div className="node-sub font-mono">Ref: {invoice.receiptReference || 'WTX-INV-AUTO'}</div>
                        <span className="node-time">{invoice.paidDate || invoice.invoiceDate}</span>
                      </div>
                    </div>
                  ) : isWaived ? (
                    <div className="timeline-node">
                      <div className="node-dot purple"></div>
                      <div className="node-content">
                        <div className="node-title">Invoice Waived / Credit Note Posted</div>
                        <div className="node-sub">Reason: {invoice.waiverReason || 'Administrative Concession'}</div>
                        <span className="node-time">Balance reduced to ₹0</span>
                      </div>
                    </div>
                  ) : (
                    <div className="timeline-node">
                      <div className="node-dot orange"></div>
                      <div className="node-content">
                        <div className="node-title">Awaiting Payment Collection</div>
                        <div className="node-sub">Payment due by {invoice.dueDate}</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
