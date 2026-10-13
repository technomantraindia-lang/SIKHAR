import React, { useState, useEffect } from 'react';
import {
  Receipt,
  ArrowLeft,
  CheckCircle2,
  Car,
  Users,
  Calendar,
  CreditCard,
  FileText,
  Shield,
  RefreshCw,
  Plus,
  ChevronRight,
  Info
} from '../common/Icons';
import {
  createInvoiceApi,
  fetchDriversApi,
  fetchLeasesApi,
  fetchFleetTowerApi
} from '../../services/api';

export default function GenerateInvoicePage({ onBackToInvoices, onBackToDashboard, onNavigate }) {
  const [loading, setLoading] = useState(true);
  const [drivers, setDrivers] = useState([]);
  const [leases, setLeases] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form Fields
  const [selectedDriverId, setSelectedDriverId] = useState('');
  const [selectedLeaseId, setSelectedLeaseId] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [driverName, setDriverName] = useState('');
  const [driverPhone, setDriverPhone] = useState('');
  const [vehicleRegistration, setVehicleRegistration] = useState('');
  const [vehicleModel, setVehicleModel] = useState('');
  const [vehicleType, setVehicleType] = useState('CNG');

  // Billing & Financial Fields
  const [billingPeriodType, setBillingPeriodType] = useState('Daily'); // 'Daily' | 'Weekly' | 'Custom'
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState(new Date().toISOString().split('T')[0]);
  const [periodLabel, setPeriodLabel] = useState(
    new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
  );
  const [totalAmount, setTotalAmount] = useState(1000);
  const [additionalCharges, setAdditionalCharges] = useState(0);
  const [additionalReason, setAdditionalReason] = useState('');
  const [notes, setNotes] = useState('Daily commercial vehicle rental invoice');

  // Preload drivers, leases and vehicles
  useEffect(() => {
    async function loadInitialData() {
      try {
        setLoading(true);
        const [drvRes, lseRes, fltRes] = await Promise.all([
          fetchDriversApi('all', 'all'),
          fetchLeasesApi('all', 'all'),
          fetchFleetTowerApi('all')
        ]);

        if (drvRes?.drivers) setDrivers(drvRes.drivers);
        if (lseRes?.leases) setLeases(lseRes.leases);
        if (fltRes?.vehicles) setVehicles(fltRes.vehicles);

        // Check if coming directly from a specific lease (e.g. from Active Leases table)
        let initialLease = null;
        try {
          const targetLeaseId = localStorage.getItem('sikhar_invoice_target_lease_id');
          if (targetLeaseId && lseRes?.leases) {
            initialLease = lseRes.leases.find(ls => ls.id === targetLeaseId);
            localStorage.removeItem('sikhar_invoice_target_lease_id');
          }
        } catch (e) {}

        if (!initialLease && lseRes?.leases && lseRes.leases.length > 0) {
          initialLease = lseRes.leases[0];
        }

        if (initialLease) {
          setSelectedLeaseId(initialLease.id);
          setCustomerName(initialLease.customerName);
          setDriverName(initialLease.driverName || initialLease.customerName);
          setDriverPhone(initialLease.driverPhone || initialLease.customerPhone);
          setVehicleRegistration(initialLease.vehicleRegistration);
          setVehicleModel(initialLease.vehicleModel);
          setVehicleType(initialLease.vehicleType || 'CNG');
          setTotalAmount(initialLease.rateAmount || 1000);
          setSelectedDriverId(initialLease.driverId || '');
        }
      } catch (err) {
        console.error('Failed to load invoice generation data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadInitialData();
  }, []);

  // When driver is selected manually
  const handleDriverChange = (driverId) => {
    setSelectedDriverId(driverId);
    const d = drivers.find(dr => dr.id === driverId);
    if (d) {
      setCustomerName(d.name);
      setDriverName(d.name);
      setDriverPhone(d.phone);
      if (d.vehicle) {
        setVehicleRegistration(d.vehicle.registration);
        setVehicleModel(d.vehicle.model);
        setVehicleType(d.vehicle.type || 'CNG');
      }
      // Check if driver has an agreed rental rate
      const rentRate = parseInt((d.deal?.rate || '1000').toString().replace(/[^0-9]/g, '')) || 1000;
      setTotalAmount(rentRate);
    }
  };

  // When lease is selected manually
  const handleLeaseChange = (leaseId) => {
    setSelectedLeaseId(leaseId);
    const l = leases.find(ls => ls.id === leaseId);
    if (l) {
      setCustomerName(l.customerName);
      setDriverName(l.driverName || l.customerName);
      setDriverPhone(l.driverPhone || l.customerPhone);
      setVehicleRegistration(l.vehicleRegistration);
      setVehicleModel(l.vehicleModel);
      setVehicleType(l.vehicleType || 'CNG');
      setTotalAmount(l.rateAmount || 1000);
      setSelectedDriverId(l.driverId || '');
    }
  };

  // Tax breakdown (GST 5% Passenger Transport)
  const finalTotal = (Number(totalAmount) || 0) + (Number(additionalCharges) || 0);
  const taxableBase = Math.round((finalTotal / 1.05) * 100) / 100;
  const gstTotal = Math.round((finalTotal - taxableBase) * 100) / 100;
  const cgstAmount = Math.round((gstTotal / 2) * 100) / 100;
  const sgstAmount = Math.round((gstTotal - cgstAmount) * 100) / 100;

  // Submit and issue invoice
  const handleSubmitInvoice = async (e) => {
    e.preventDefault();
    if (!customerName || finalTotal <= 0) {
      alert('Please provide valid customer details and an invoice amount.');
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = {
        leaseId: selectedLeaseId || undefined,
        leaseNumber: selectedLeaseId || undefined,
        customerName: customerName.trim(),
        customerId: `CUST-26-${Date.now().toString().slice(-5)}`,
        driverId: selectedDriverId || 'drv-01',
        driverName: driverName.trim() || customerName.trim(),
        driverPhone: driverPhone.trim() || '+91 98112 34567',
        vehicleRegistration: vehicleRegistration.trim().toUpperCase() || 'HR26DK8821',
        vehicleModel: vehicleModel || 'Maruti WagonR Tour H3',
        amount: finalTotal,
        dueDate,
        notes: notes || `${billingPeriodType} rental invoice for ${periodLabel}`
      };

      const res = await createInvoiceApi(payload);
      if (res.success || res.invoice) {
        const invId = res.invoice?.id || res.id;
        if (invId) {
          try {
            localStorage.setItem('sikhar_selected_invoice_id', invId);
          } catch (e) {}
        }
        alert(`✅ ${res.message || 'Invoice generated and posted to ledger!'}`);
        if (onNavigate) {
          onNavigate('invoice-detail');
        } else if (onBackToInvoices) {
          onBackToInvoices();
        }
      }
    } catch (err) {
      console.error('Invoice generation error:', err);
      alert(err.message || 'Failed to generate invoice.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="terminal-content generate-invoice-page-stage">
      {/* Header & Breadcrumb */}
      <div className="command-header">
        <div>
          <div className="breadcrumb-nav">
            <span className="breadcrumb-link" onClick={() => onBackToDashboard && onBackToDashboard()}>Dashboard</span>
            <ChevronRight size={13} className="breadcrumb-sep" />
            <span className="breadcrumb-link" onClick={() => onBackToInvoices && onBackToInvoices()}>Rentals &amp; Collections</span>
            <ChevronRight size={13} className="breadcrumb-sep" />
            <span className="breadcrumb-link" onClick={() => onBackToInvoices && onBackToInvoices()}>Invoices</span>
            <ChevronRight size={13} className="breadcrumb-sep" />
            <span className="breadcrumb-active">Generate Rental Invoice</span>
          </div>
          <h1 className="executive-greeting" style={{ marginTop: '4px' }}>
            Generate Commercial Rental Invoice
          </h1>
          <div className="executive-subline">
            Dedicated billing terminal · Auto-calculate 5% GST · Link active lease or driver · Live tax invoice sheet preview
          </div>
        </div>

        <div className="command-actions-row">
          <button
            type="button"
            className="btn secondary"
            onClick={() => onBackToInvoices ? onBackToInvoices() : (onNavigate && onNavigate('invoices'))}
          >
            <ArrowLeft size={15} />
            <span>Back to Invoices List</span>
          </button>
        </div>
      </div>

      {/* Main Split Layout: Form on Left, Live Paper Invoice on Right */}
      <div className="generate-invoice-split-layout">
        {/* ========================================================
            LEFT COLUMN: INVOICE CONFIGURATION FORM
            ======================================================== */}
        <form onSubmit={handleSubmitInvoice} className="invoice-form-column">
          {/* Section 1: Customer & Driver Binding */}
          <div className="invoice-form-card">
            <div className="form-card-header">
              <div className="card-header-icon blue">
                <Users size={18} />
              </div>
              <div>
                <h3 className="form-card-title">1. Customer &amp; Vehicle Association</h3>
                <p className="form-card-sub">Link an active commercial lease or select a driver directly from registry.</p>
              </div>
            </div>

            {/* Quick Prefill from Active Leases */}
            <div className="form-field-group">
              <label className="input-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Commercial Lease Agreement (Primary Flow)</span>
                <span style={{ color: '#059669', fontSize: '11px', fontWeight: 600 }}>Auto-pulls Lessee, Vehicle &amp; Rate</span>
              </label>
              <select
                className="styled-input-select"
                value={selectedLeaseId}
                onChange={(e) => handleLeaseChange(e.target.value)}
                style={{ borderColor: selectedLeaseId ? '#10b981' : undefined }}
              >
                <option value="">-- Choose Commercial Lease Agreement --</option>
                {leases.map(l => (
                  <option key={l.id} value={l.id}>
                    📄 {l.id} — {l.customerName} ({l.vehicleRegistration}) [{l.dealType} • ₹{l.rateAmount || 1000}/day]
                  </option>
                ))}
              </select>
            </div>

            {selectedLeaseId && (
              <div style={{
                background: '#f0fdf4',
                border: '1px solid #bbf7d0',
                borderRadius: '8px',
                padding: '10px 14px',
                marginBottom: '14px',
                fontSize: '12px',
                color: '#166534',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '8px'
              }}>
                <div>
                  <strong>✓ Active Commercial Lease Linked ({selectedLeaseId})</strong>
                  <div style={{ color: '#15803d', fontSize: '11.5px', marginTop: '2px' }}>
                    Lessee: {customerName} · Vehicle: {vehicleRegistration} ({vehicleModel}) · Agreed Rate: ₹{totalAmount}/day
                  </div>
                </div>
                <span style={{ background: '#dcfce7', color: '#15803d', padding: '2px 8px', borderRadius: '4px', fontWeight: 700, fontSize: '10.5px' }}>
                  LEASE ATTACHED
                </span>
              </div>
            )}

            {/* Select Driver from Registry */}
            <div className="form-field-group">
              <label className="input-label">Select Driver from Registry *</label>
              <select
                className="styled-input-select"
                value={selectedDriverId}
                onChange={(e) => handleDriverChange(e.target.value)}
              >
                <option value="">-- Choose Registered Driver --</option>
                {drivers.map(d => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.phone}) {d.vehicle ? `[${d.vehicle.registration}]` : '[No car]'}
                  </option>
                ))}
              </select>
            </div>

            {/* Customer Details Grid */}
            <div className="form-inputs-2col">
              <div className="form-field-group">
                <label className="input-label">Customer Legal Name (Billed To) *</label>
                <input
                  type="text"
                  className="styled-input-text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="e.g. Raj Kumar"
                  required
                />
              </div>

              <div className="form-field-group">
                <label className="input-label">Customer Mobile Phone *</label>
                <input
                  type="text"
                  className="styled-input-text"
                  value={driverPhone}
                  onChange={(e) => setDriverPhone(e.target.value)}
                  placeholder="+91 98112 34567"
                  required
                />
              </div>
            </div>

            {/* Vehicle Details Grid */}
            <div className="form-inputs-2col">
              <div className="form-field-group">
                <label className="input-label">Vehicle Registration Plate *</label>
                <input
                  type="text"
                  className="styled-input-text font-mono"
                  value={vehicleRegistration}
                  onChange={(e) => setVehicleRegistration(e.target.value)}
                  placeholder="HR26DK8821"
                  required
                />
              </div>

              <div className="form-field-group">
                <label className="input-label">Vehicle Model &amp; Type</label>
                <input
                  type="text"
                  className="styled-input-text"
                  value={vehicleModel}
                  onChange={(e) => setVehicleModel(e.target.value)}
                  placeholder="Maruti WagonR Tour H3"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Billing Dates & Period */}
          <div className="invoice-form-card">
            <div className="form-card-header">
              <div className="card-header-icon purple">
                <Calendar size={18} />
              </div>
              <div>
                <h3 className="form-card-title">2. Billing Period &amp; Dates</h3>
                <p className="form-card-sub">Specify the invoice date, payment due date, and period description.</p>
              </div>
            </div>

            <div className="form-inputs-3col">
              <div className="form-field-group">
                <label className="input-label">Billing Cycle</label>
                <select
                  className="styled-input-select"
                  value={billingPeriodType}
                  onChange={(e) => setBillingPeriodType(e.target.value)}
                >
                  <option value="Daily">Daily Lease Rental</option>
                  <option value="Weekly">Weekly Cycle</option>
                  <option value="Monthly">Monthly Cycle</option>
                  <option value="Custom">Custom Duty</option>
                </select>
              </div>

              <div className="form-field-group">
                <label className="input-label">Invoice Date *</label>
                <input
                  type="date"
                  className="styled-input-text"
                  value={invoiceDate}
                  onChange={(e) => setInvoiceDate(e.target.value)}
                  required
                />
              </div>

              <div className="form-field-group">
                <label className="input-label">Payment Due Date *</label>
                <input
                  type="date"
                  className="styled-input-text"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-field-group">
              <label className="input-label">Period Description Label</label>
              <input
                type="text"
                className="styled-input-text"
                value={periodLabel}
                onChange={(e) => setPeriodLabel(e.target.value)}
                placeholder="e.g. 19 Aug 2026 or 12 Oct - 18 Oct 2026"
              />
            </div>
          </div>

          {/* Section 3: Pricing & GST Calculation */}
          <div className="invoice-form-card">
            <div className="form-card-header">
              <div className="card-header-icon green">
                <Receipt size={18} />
              </div>
              <div>
                <h3 className="form-card-title">3. Rental Tariff &amp; GST Breakdown</h3>
                <p className="form-card-sub">GST 5% is automatically calculated per Indian Commercial Transport law (SAC 996601).</p>
              </div>
            </div>

            <div className="form-inputs-2col">
              <div className="form-field-group">
                <label className="input-label">Base Rental Amount (₹) *</label>
                <div className="adp-currency-input-wrap">
                  <span className="currency-symbol">₹</span>
                  <input
                    type="number"
                    className="styled-input-text currency-field font-mono"
                    style={{ paddingLeft: '38px' }}
                    value={totalAmount}
                    onChange={(e) => setTotalAmount(e.target.value)}
                    min="100"
                    required
                  />
                </div>
              </div>

              <div className="form-field-group">
                <label className="input-label">Additional Surcharges / Fine (₹)</label>
                <div className="adp-currency-input-wrap">
                  <span className="currency-symbol">₹</span>
                  <input
                    type="number"
                    className="styled-input-text currency-field font-mono"
                    style={{ paddingLeft: '38px' }}
                    value={additionalCharges}
                    onChange={(e) => setAdditionalCharges(e.target.value)}
                    min="0"
                  />
                </div>
              </div>
            </div>

            {additionalCharges > 0 && (
              <div className="form-field-group">
                <label className="input-label">Reason for Additional Surcharge</label>
                <input
                  type="text"
                  className="styled-input-text"
                  placeholder="e.g. Challan reimbursement, late yard return fee"
                  value={additionalReason}
                  onChange={(e) => setAdditionalReason(e.target.value)}
                />
              </div>
            )}

            <div className="form-field-group">
              <label className="input-label">Invoice Remarks / Notes</label>
              <input
                type="text"
                className="styled-input-text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            {/* Quick Pricing Presets */}
            <div className="invoice-presets-row">
              <span style={{ fontSize: '12px', color: '#64748b' }}>Quick Presets:</span>
              <button type="button" className="btn small secondary" onClick={() => setTotalAmount(900)}>₹900 (WagonR CNG)</button>
              <button type="button" className="btn small secondary" onClick={() => setTotalAmount(1000)}>₹1,000 (Daily Std)</button>
              <button type="button" className="btn small secondary" onClick={() => setTotalAmount(1100)}>₹1,100 (Tigor EV)</button>
              <button type="button" className="btn small secondary" onClick={() => setTotalAmount(1400)}>₹1,400 (Ertiga MPV)</button>
            </div>
          </div>

          {/* Action Submission Buttons */}
          <div className="invoice-submit-card">
            <div className="submit-card-left">
              <span className="total-due-caption">TOTAL INVOICE VALUE TO ISSUE:</span>
              <strong className="total-due-number">₹{finalTotal.toLocaleString('en-IN')}.00</strong>
            </div>

            <div className="submit-card-actions">
              <button
                type="button"
                className="btn secondary"
                onClick={() => onBackToInvoices ? onBackToInvoices() : (onNavigate && onNavigate('invoices'))}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="btn primary large-btn"
                disabled={isSubmitting || finalTotal <= 0}
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw size={16} className="spin-icon" />
                    <span>Generating &amp; Posting...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={16} />
                    <span>Issue &amp; Post Tax Invoice</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>

        {/* ========================================================
            RIGHT COLUMN: LIVE REAL-TIME TAX INVOICE PAPER PREVIEW
            ======================================================== */}
        <div className="invoice-live-preview-column">
          <div className="preview-top-badge-row">
            <span className="live-preview-pill">
              <span className="live-pulsing-green-dot"></span>
              <span>LIVE TAX INVOICE PAPER PREVIEW</span>
            </span>
            <span style={{ fontSize: '11.5px', color: '#64748b' }}>Updates automatically as you type</span>
          </div>

          {/* Authentic Tax Invoice Paper Sheet */}
          <div className="formal-tax-invoice-sheet preview-elevation-shadow">
            {/* Header */}
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
                <strong className="inv-badge-no">INV-26-{Date.now().toString().slice(-6)}</strong>
                <span className="inv-badge-date">Date: {invoiceDate}</span>
                <span className="inv-badge-date" style={{ color: '#ea580c', fontWeight: '700' }}>Due: {dueDate}</span>
              </div>
            </div>

            {/* Billed To / Asset Info */}
            <div className="invoice-parties-grid">
              <div className="party-box">
                <span className="party-label">BILLED TO (LESSEE):</span>
                <strong className="party-name">{customerName || 'Raj Kumar'}</strong>
                <div className="party-details">
                  Driver: {driverName || customerName || 'Raj Kumar'}<br />
                  Phone: {driverPhone || '+91 98112 34567'}<br />
                  Address: Gurgaon Operations Hub, Delhi NCR
                </div>
              </div>

              <div className="party-box">
                <span className="party-label">COMMERCIAL VEHICLE ASSET:</span>
                <strong className="party-name">{vehicleRegistration || 'HR26DK8821'}</strong>
                <div className="party-details">
                  Model: {vehicleModel || 'Maruti WagonR Tour H3'} ({vehicleType})<br />
                  Billing Period: {periodLabel}<br />
                  Terms: Immediate Wallet Auto-Debit / UPI
                </div>
              </div>
            </div>

            {/* Supply Line Items Table */}
            <table className="tax-invoice-items-table">
              <thead>
                <tr style={{ background: '#0f172a' }}>
                  <th style={{ color: '#ffffff', background: '#0f172a' }}>#</th>
                  <th style={{ color: '#ffffff', background: '#0f172a' }}>Description of Commercial Supply</th>
                  <th style={{ color: '#ffffff', background: '#0f172a' }}>HSN/SAC</th>
                  <th style={{ color: '#ffffff', background: '#0f172a' }}>Base (₹)</th>
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
                    <div style={{ fontSize: '11px', color: '#64748b' }}>
                      {billingPeriodType} lease fee for {vehicleModel || 'Fleet Vehicle'} [{vehicleRegistration || 'HR26DK8821'}]
                    </div>
                  </td>
                  <td>996601</td>
                  <td>₹{taxableBase.toFixed(2)}</td>
                  <td>₹{cgstAmount.toFixed(2)}</td>
                  <td>₹{sgstAmount.toFixed(2)}</td>
                  <td style={{ textAlign: 'right' }}>
                    <strong>₹{finalTotal.toLocaleString('en-IN')}.00</strong>
                  </td>
                </tr>
                {additionalCharges > 0 && (
                  <tr>
                    <td>2</td>
                    <td>
                      <strong>Additional Operational Surcharge</strong>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>
                        {additionalReason || 'Incidental fee'}
                      </div>
                    </td>
                    <td>996601</td>
                    <td colSpan={4} style={{ textAlign: 'right' }}>
                      <strong>₹{Number(additionalCharges).toLocaleString('en-IN')}.00</strong>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* Totals & Status Stamp */}
            <div className="invoice-totals-breakdown">
              <div className="invoice-payment-stamp">
                <div className="stamp-box unpaid">
                  <span>PAYMENT DUE</span>
                  <small>Auto-Debits from Driver Spendable Wallet</small>
                </div>
              </div>

              <div className="totals-calc-col">
                <div className="calc-row">
                  <span>Taxable Base Value:</span>
                  <strong>₹{taxableBase.toFixed(2)}</strong>
                </div>
                <div className="calc-row">
                  <span>CGST (2.5%):</span>
                  <strong>₹{cgstAmount.toFixed(2)}</strong>
                </div>
                <div className="calc-row">
                  <span>SGST (2.5%):</span>
                  <strong>₹{sgstAmount.toFixed(2)}</strong>
                </div>
                <div className="calc-row grand-total">
                  <span>Total Payable:</span>
                  <strong style={{ color: '#1868f0' }}>₹{finalTotal.toLocaleString('en-IN')}.00</strong>
                </div>
              </div>
            </div>

            <div className="invoice-footer-terms">
              <span>This is an authenticated computer-generated commercial tax invoice issued by Sikhar Fleet Private Limited.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
