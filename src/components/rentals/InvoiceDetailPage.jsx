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
import AdminOptionSelect from '../common/AdminOptionSelect';

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
  const [collectAmount, setCollectAmount] = useState('');
  const [selectedReceipt, setSelectedReceipt] = useState(null);

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

  // Action: Direct UPI / Cash Handover Collection (Supports Partial & Full)
  const handleDirectCollect = async (e) => {
    e.preventDefault();
    if (!invoice) return;
    const due = Number(invoice.balanceDue !== undefined ? invoice.balanceDue : (invoice.totalAmount - (invoice.amountPaid || 0)));
    const numericAmount = parseFloat(collectAmount) || due;
    if (!numericAmount || numericAmount <= 0) {
      alert('Please enter a valid collection amount greater than ₹0.');
      return;
    }
    if (numericAmount > due) {
      alert(`Collection amount (₹${numericAmount.toLocaleString('en-IN')}) cannot exceed outstanding balance due of ₹${due.toLocaleString('en-IN')}.`);
      return;
    }

    try {
      setIsProcessing(true);
      const ref = paymentRef || `${paymentMethod}-${Date.now().toString().slice(-6)}`;
      const res = await payInvoiceDirectApi(invoice.id, paymentMethod, ref, numericAmount);
      showToast(`✅ ${res.message || 'Payment successfully recorded!'}`);
      setShowCollectForm(false);
      setPaymentRef('');
      setCollectAmount('');
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

  const isPaid = invoice?.status === 'Paid' && (invoice?.balanceDue === 0 || invoice?.balanceDue === undefined);
  const isWaived = invoice?.status === 'Waived';
  const isPartial = !isPaid && !isWaived && (invoice?.status === 'Partially Paid' || (invoice?.amountPaid > 0 && invoice?.balanceDue > 0));
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
              <span
                className={`status-pill ${isPaid ? 'good' : isWaived ? 'blue' : 'warn'}`}
                style={isPartial ? { background: '#fef3c7', color: '#b45309', border: '1px solid #fde68a' } : {}}
              >
                {isPaid ? '✓ Paid & Settled' : isWaived ? '— Waived (Credit Note)' : isPartial ? `⚡ Partially Paid (Due: ₹${invoice.balanceDue?.toLocaleString('en-IN')})` : '⏳ Payment Due'}
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
                    {invoice.leaseNumber && (
                      <>
                        Lease Agreement:{' '}
                        <span
                          style={{ color: '#2563eb', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }}
                          onClick={() => onNavigate && onNavigate('bookings')}
                          title="View Lease Agreement"
                        >
                          {invoice.leaseNumber}
                        </span>
                        <br />
                      </>
                    )}
                    Billing Type: Commercial Fleet Lease<br />
                    Terms: Immediate Wallet Auto-Debit / Prepaid UPI
                  </div>
                </div>
              </div>

              {/* Line Items Table */}
              <table className="tax-invoice-items-table">
                <thead>
                  <tr style={{ background: '#0f172a' }}>
                    <th style={{ color: '#ffffff', background: '#0f172a' }}>#</th>
                    <th style={{ color: '#ffffff', background: '#0f172a' }}>Description of Commercial Supply</th>
                    <th style={{ color: '#ffffff', background: '#0f172a' }}>HSN / SAC</th>
                    <th style={{ color: '#ffffff', background: '#0f172a' }}>Taxable Base</th>
                    <th style={{ color: '#ffffff', background: '#0f172a' }}>CGST (2.5%)</th>
                    <th style={{ color: '#ffffff', background: '#0f172a' }}>SGST (2.5%)</th>
                    <th style={{ textAlign: 'right', color: '#ffffff', background: '#0f172a' }}>Total (₹)</th>
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
                  ) : isPartial ? (
                    <div className="stamp-box partial">
                      <span>PARTIALLY PAID</span>
                      <small>₹{invoice.amountPaid?.toLocaleString('en-IN')} Received</small>
                      <small style={{ fontSize: '9.5px', marginTop: '2px', fontWeight: 700, color: '#c2410c' }}>
                        Due: ₹{invoice.balanceDue?.toLocaleString('en-IN')}
                      </small>
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

              {/* Official Payment Receipts & Part Vouchers Table */}
              {invoice.paymentHistory && invoice.paymentHistory.length > 0 && (
                <div style={{ marginTop: '24px', borderTop: '2px dashed #cbd5e1', paddingTop: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <h4 style={{ margin: 0, fontSize: '13px', fontWeight: 800, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      🧾 Official Collection Receipts &amp; Vouchers ({invoice.paymentHistory.length})
                    </h4>
                    <span style={{ fontSize: '11px', color: '#64748b' }}>
                      Audit-verified payment credits
                    </span>
                  </div>

                  <table className="tax-invoice-items-table" style={{ marginTop: '4px', fontSize: '11.5px' }}>
                    <thead>
                      <tr style={{ background: '#f1f5f9' }}>
                        <th style={{ color: '#475569', background: '#f1f5f9' }}>Receipt #</th>
                        <th style={{ color: '#475569', background: '#f1f5f9' }}>Date &amp; Time</th>
                        <th style={{ color: '#475569', background: '#f1f5f9' }}>Payment Mode</th>
                        <th style={{ color: '#475569', background: '#f1f5f9' }}>Amount Collected</th>
                        <th style={{ color: '#475569', background: '#f1f5f9' }}>Remaining Due</th>
                        <th style={{ textAlign: 'right', color: '#475569', background: '#f1f5f9' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoice.paymentHistory.map((pmt, pIdx) => (
                        <tr key={pIdx}>
                          <td><strong className="font-mono" style={{ color: '#0284c7' }}>{pmt.receiptNumber}</strong></td>
                          <td>{new Date(pmt.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                          <td>{pmt.paymentMethod} {pmt.reference ? `(${pmt.reference})` : ''}</td>
                          <td><strong style={{ color: '#047857' }}>₹{Number(pmt.amount).toLocaleString('en-IN')}</strong></td>
                          <td><strong style={{ color: pmt.balanceRemaining > 0 ? '#ea580c' : '#047857' }}>₹{Number(pmt.balanceRemaining || 0).toLocaleString('en-IN')}</strong></td>
                          <td style={{ textAlign: 'right' }}>
                            <button
                              type="button"
                              className="receipt-print-btn"
                              onClick={() => setSelectedReceipt(pmt)}
                              title="View & Print official payment receipt voucher"
                            >
                              <Printer size={12} />
                              <span>Print Slip</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

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
                      onClick={() => {
                        const next = !showCollectForm;
                        setShowCollectForm(next);
                        if (next) {
                          const due = Number(invoice.balanceDue !== undefined ? invoice.balanceDue : (invoice.totalAmount - (invoice.amountPaid || 0)));
                          setCollectAmount(String(due));
                          setPaymentRef(`UTR-${Date.now().toString().slice(-6)}`);
                        }
                      }}
                    >
                      <span>Collect via UPI / Cash (Full / Partial)</span>
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

                  {/* Inline UPI/Cash Collect Form with Custom / Partial Amount */}
                  {showCollectForm && (() => {
                    const currentDue = Number(invoice.balanceDue !== undefined ? invoice.balanceDue : (invoice.totalAmount - (invoice.amountPaid || 0)));
                    const numericAmount = parseFloat(collectAmount) || 0;
                    const remainingAfter = Math.max(0, Math.round((currentDue - numericAmount) * 100) / 100);
                    const isInvalidAmount = !numericAmount || numericAmount <= 0 || numericAmount > currentDue;

                    return (
                      <form onSubmit={handleDirectCollect} className="inline-collect-form-box">
                        <div className="form-field-group">
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                            <label className="input-label" style={{ margin: 0, fontWeight: 700 }}>Amount to Collect (₹) *</label>
                            <span style={{ fontSize: '10.5px', color: '#64748b' }}>Due: ₹{currentDue.toLocaleString('en-IN')}</span>
                          </div>
                          <div className="collect-amount-input-wrap">
                            <span className="collect-amount-prefix">₹</span>
                            <input
                              type="number"
                              min="1"
                              max={currentDue}
                              step="1"
                              className="styled-input-text collect-amount-input"
                              placeholder={`e.g. ${Math.min(500, currentDue)}`}
                              value={collectAmount}
                              onChange={(e) => setCollectAmount(e.target.value)}
                              required
                            />
                          </div>

                          <div className="collect-quick-buttons">
                            <button
                              type="button"
                              className={`collect-chip-btn ${numericAmount === currentDue ? 'active' : ''}`}
                              onClick={() => setCollectAmount(String(currentDue))}
                            >
                              Full: ₹{currentDue.toLocaleString('en-IN')}
                            </button>
                            {currentDue >= 200 && (
                              <button
                                type="button"
                                className={`collect-chip-btn ${numericAmount === Math.round(currentDue / 2) ? 'active' : ''}`}
                                onClick={() => setCollectAmount(String(Math.round(currentDue / 2)))}
                              >
                                Half: ₹{Math.round(currentDue / 2).toLocaleString('en-IN')}
                              </button>
                            )}
                            {currentDue > 500 && numericAmount !== 500 && (
                              <button
                                type="button"
                                className={`collect-chip-btn ${numericAmount === 500 ? 'active' : ''}`}
                                onClick={() => setCollectAmount('500')}
                              >
                                ₹500 Part
                              </button>
                            )}
                          </div>

                          <div className="collect-calculation-card">
                            <div className="calc-stat-row">
                              <span>💵 Collecting:</span>
                              <strong style={{ color: '#047857' }}>₹{(numericAmount || 0).toLocaleString('en-IN')}</strong>
                            </div>
                            <div className="calc-stat-row">
                              <span>⏳ Remaining Due:</span>
                              <strong style={{ color: remainingAfter > 0 ? '#ea580c' : '#047857' }}>₹{remainingAfter.toLocaleString('en-IN')}</strong>
                            </div>
                          </div>
                        </div>

                        <div className="form-field-group">
                          <label className="input-label">Payment Channel</label>
                          <AdminOptionSelect
                            group="payment_method"
                            className="styled-input-select"
                            value={paymentMethod}
                            onChange={(e) => setPaymentMethod(e.target.value)}
                          >
                            <option value="UPI">UPI (Google Pay / PhonePe / Paytm)</option>
                            <option value="Cash">Cash Handover at Fleet Yard</option>
                            <option value="Bank Transfer">Bank Transfer (NEFT / IMPS)</option>
                            <option value="POS Card">POS Card Terminal</option>
                          </AdminOptionSelect>
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
                          disabled={isProcessing || isInvalidAmount}
                        >
                          {isProcessing ? 'Recording...' : `Confirm Collection of ₹${(numericAmount || 0).toLocaleString('en-IN')}`}
                        </button>
                      </form>
                    );
                  })()}
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

                  {/* Render all partial payments recorded in paymentHistory */}
                  {Array.isArray(invoice.paymentHistory) && invoice.paymentHistory.map((pmt, pIdx) => (
                    <div key={pIdx} className="timeline-node">
                      <div className="node-dot blue"></div>
                      <div className="node-content">
                        <div className="node-title">Payment Collected · ₹{Number(pmt.amount).toLocaleString('en-IN')}</div>
                        <div className="node-sub">Channel: {pmt.paymentMethod} {pmt.reference ? `(${pmt.reference})` : ''}</div>
                        <div className="node-sub font-mono" style={{ color: '#0284c7' }}>Receipt: {pmt.receiptNumber}</div>
                        <span className="node-time">
                          {new Date(pmt.date).toLocaleString('en-IN')} · Remaining Due: ₹{Number(pmt.balanceRemaining || 0).toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>
                  ))}

                  {isPaid ? (
                    <div className="timeline-node">
                      <div className="node-dot green"></div>
                      <div className="node-content">
                        <div className="node-title">Invoice Fully Paid &amp; Settled</div>
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
                        <div className="node-sub">Payment due by {invoice.dueDate} · Outstanding: ₹{invoice.balanceDue?.toLocaleString('en-IN')}</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Official Payment Receipt Slip Modal */}
      {selectedReceipt && invoice && (
        <div className="receipt-slip-modal-backdrop" onClick={() => setSelectedReceipt(null)}>
          <div className="receipt-slip-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="receipt-slip-paper" id="printable-receipt-slip">
              {/* Header */}
              <div className="receipt-slip-header">
                <div>
                  <div className="receipt-slip-title">Sikhar Fleet Private Limited</div>
                  <div className="receipt-slip-sub">Official Commercial Passenger Vehicle Rental Receipt · SAC 996601</div>
                  <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                    GSTIN: 07AAACS1234F1Z8 · Corporate Fleet Operations
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span className="font-mono" style={{ fontSize: '13px', fontWeight: 800, color: '#0284c7' }}>
                    {selectedReceipt.receiptNumber}
                  </span>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>
                    Date: {new Date(selectedReceipt.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </div>
                </div>
              </div>

              {/* Customer & Asset Details Grid */}
              <div className="receipt-slip-meta-grid">
                <div>
                  <span style={{ color: '#64748b', fontSize: '11px' }}>Received From (Driver / Customer):</span>
                  <div style={{ fontWeight: 700, marginTop: '2px' }}>{invoice.customerName}</div>
                  <div style={{ color: '#475569', fontSize: '11.5px' }}>📱 {invoice.driverPhone}</div>
                </div>
                <div>
                  <span style={{ color: '#64748b', fontSize: '11px' }}>Vehicle Asset Allocated:</span>
                  <div style={{ fontWeight: 700, marginTop: '2px' }}>{invoice.vehicleRegistration}</div>
                  <div style={{ color: '#475569', fontSize: '11.5px' }}>{invoice.vehicleModel}</div>
                </div>
                <div>
                  <span style={{ color: '#64748b', fontSize: '11px' }}>Parent Invoice Reference:</span>
                  <div className="font-mono" style={{ fontWeight: 700, marginTop: '2px' }}>{invoice.invoiceNumber}</div>
                  <div style={{ color: '#64748b', fontSize: '11px' }}>Billing Period: {invoice.period}</div>
                </div>
                <div>
                  <span style={{ color: '#64748b', fontSize: '11px' }}>Payment Mode &amp; UTR:</span>
                  <div style={{ fontWeight: 700, marginTop: '2px' }}>{selectedReceipt.paymentMethod}</div>
                  <div className="font-mono" style={{ color: '#0284c7', fontSize: '11px' }}>Ref: {selectedReceipt.reference || 'DIRECT-CASH'}</div>
                </div>
              </div>

              {/* Amount Received Hero */}
              <div className="receipt-slip-amount-hero">
                <span className="hero-label">Amount Collected &amp; Credited</span>
                <div className="hero-val">₹{Number(selectedReceipt.amount).toLocaleString('en-IN')}.00</div>
                <div style={{ fontSize: '11px', color: '#065f46', marginTop: '2px' }}>
                  Amount Credited towards Daily Commercial Vehicle Rent
                </div>
              </div>

              {/* Balance Status Strip */}
              <div className="receipt-slip-balance-strip">
                <div>
                  <span style={{ fontSize: '11px', display: 'block', color: '#7c2d12' }}>Total Invoice Amount:</span>
                  <strong>₹{invoice.totalAmount?.toLocaleString('en-IN')}</strong>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <span style={{ fontSize: '11px', display: 'block', color: '#7c2d12' }}>Total Paid to Date:</span>
                  <strong style={{ color: '#047857' }}>₹{invoice.amountPaid?.toLocaleString('en-IN')}</strong>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '11px', display: 'block', color: '#7c2d12' }}>Remaining Balance Due:</span>
                  <strong style={{ color: selectedReceipt.balanceRemaining > 0 ? '#ea580c' : '#047857', fontSize: '14px' }}>
                    ₹{Number(selectedReceipt.balanceRemaining || 0).toLocaleString('en-IN')}
                  </strong>
                </div>
              </div>

              {/* Signatures & Seal */}
              <div className="receipt-slip-signatures">
                <div>
                  <div>Payment Processed By: {selectedReceipt.collectedBy || 'Finance Desk'}</div>
                  <div style={{ fontSize: '10px', color: '#94a3b8' }}>System Generated Receipt Voucher · Valid without Physical Signature</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 700, color: '#0f172a' }}>For Sikhar Fleet Pvt Ltd</div>
                  <div style={{ fontSize: '10px', color: '#047857', fontWeight: 600 }}>✓ Verified Authorized Voucher</div>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="clean-modal-footer" style={{ padding: '14px 24px' }}>
              <button type="button" className="btn secondary" onClick={() => setSelectedReceipt(null)}>
                Close
              </button>
              <button
                type="button"
                className="btn primary"
                onClick={() => {
                  const printContent = document.getElementById('printable-receipt-slip');
                  if (printContent) {
                    const win = window.open('', '', 'height=650,width=800');
                    win.document.write('<html><head><title>Payment Receipt Voucher</title>');
                    win.document.write('<style>body{font-family:sans-serif;padding:30px;color:#0f172a;} .receipt-slip-header{display:flex;justify-content:space-between;border-bottom:2px solid #0f172a;padding-bottom:12px;margin-bottom:14px;} .receipt-slip-meta-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;padding:12px;background:#f8fafc;border:1px solid #e2e8f0;margin-bottom:14px;} .receipt-slip-amount-hero{border:2px solid #047857;background:#ecfdf5;padding:16px;text-align:center;margin-bottom:14px;} .hero-val{font-size:28px;font-weight:bold;color:#047857;} .receipt-slip-balance-strip{display:flex;justify-content:space-between;padding:12px;border:1px solid #fed7aa;background:#fff7ed;margin-bottom:14px;} .receipt-slip-signatures{display:flex;justify-content:space-between;margin-top:24px;border-top:1px dashed #cbd5e1;padding-top:16px;font-size:11px;}</style>');
                    win.document.write('</head><body>');
                    win.document.write(printContent.innerHTML);
                    win.document.write('</body></html>');
                    win.document.close();
                    win.focus();
                    win.print();
                    win.close();
                  }
                }}
              >
                <Printer size={14} />
                <span>Print Receipt Slip</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
