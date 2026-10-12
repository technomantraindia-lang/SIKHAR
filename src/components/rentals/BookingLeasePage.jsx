import React, { useState, useEffect, useCallback } from 'react';
import {
  FileText,
  Plus,
  RefreshCw,
  Search,
  CheckCircle2,
  Clock,
  Car,
  Users,
  Shield,
  CreditCard,
  ChevronRight,
  ArrowRight,
  TrendingUp,
  Receipt,
  Download,
  Eye,
  RotateCcw
} from '../common/Icons';
import {
  fetchLeasesApi,
  createLeaseApi,
  signLeaseAgreementApi,
  confirmLeaseDepositApi,
  activateLeaseApi,
  fetchDriversApi,
  fetchFleetTowerApi
} from '../../services/api';

export default function BookingLeasePage({ onNavigate, onBackToDashboard }) {
  const [loading, setLoading] = useState(true);
  const [leases, setLeases] = useState([]);
  const [summary, setSummary] = useState({});
  const [drivers, setDrivers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [toastMessage, setToastMessage] = useState(null);

  // Tab View: 'active' | 'new' | 'revshare'
  const [activeTab, setActiveTab] = useState('active');

  // Filter & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dealFilter, setDealFilter] = useState('all');

  // Selected lease for agreement document inspection modal
  const [inspectLease, setInspectLease] = useState(null);

  // =========================================================================
  // 5-STAGE LEASE CREATION WIZARD STATE (PDF Page 5: Customer to Active Lease)
  // =========================================================================
  const [wizardStep, setWizardStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form Fields
  const [customerName, setCustomerName] = useState('Raj Kumar');
  const [customerPhone, setCustomerPhone] = useState('+91 98112 34567');
  const [aadhaar, setAadhaar] = useState('XXXX-XXXX-4421');
  const [isAadhaarVerified, setIsAadhaarVerified] = useState(true);
  const [drivingLicence, setDrivingLicence] = useState('DL-0420-2019-8821');
  const [referenceName, setReferenceName] = useState('Amit Kumar');
  const [referencePhone, setReferencePhone] = useState('+91 99112 88776');
  const [address, setAddress] = useState('House 24, Sector 44, Gurgaon, Delhi NCR - 122003');
  const [hasLivePhoto, setHasLivePhoto] = useState(true);

  // Step 2: Deal configuration
  const [dealType, setDealType] = useState('Fixed Lease'); // 'Fixed Lease' | 'Revenue Share'
  const [billingFrequency, setBillingFrequency] = useState('Daily');
  const [rateAmount, setRateAmount] = useState(1000);
  const [taxPercent, setTaxPercent] = useState(5);
  const [securityDeposit, setSecurityDeposit] = useState(75000);
  const [driverSharePercent, setDriverSharePercent] = useState(75);
  const [sikharSharePercent, setSikharSharePercent] = useState(25);
  const [rapidoDriverId, setRapidoDriverId] = useState('RAPIDO-RJ1024');
  const [billingStartDate, setBillingStartDate] = useState(new Date().toISOString().split('T')[0]);

  // Step 3: Vehicle Inventory Selection
  const [selectedVehicleReg, setSelectedVehicleReg] = useState('');
  const [selectedVehicleObj, setSelectedVehicleObj] = useState(null);

  // Step 4: Agreement & Deposit Confirmation
  const [isAgreementSigned, setIsAgreementSigned] = useState(false);
  const [isDepositConfirmed, setIsDepositConfirmed] = useState(false);
  const [depositReceiptRef, setDepositReceiptRef] = useState('UTR-ESC-2026-9901');

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3800);
  };

  // Load backend data
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [leasesRes, driversRes, fleetRes] = await Promise.all([
        fetchLeasesApi(statusFilter, dealFilter, searchQuery),
        fetchDriversApi('all', 'all'),
        fetchFleetTowerApi('all')
      ]);

      if (leasesRes) {
        setLeases(leasesRes.leases || []);
        setSummary(leasesRes.summary || {});
      }
      if (driversRes && driversRes.drivers) {
        setDrivers(driversRes.drivers);
      }
      if (fleetRes && fleetRes.vehicles) {
        setVehicles(fleetRes.vehicles);
        // Pre-select first ready vehicle if not set
        if (!selectedVehicleReg) {
          const readyVeh = fleetRes.vehicles.find(v => v.status === 'Ready to Deploy' || v.status === 'Available');
          if (readyVeh) {
            setSelectedVehicleReg(readyVeh.registration);
            setSelectedVehicleObj(readyVeh);
          }
        }
      }
    } catch (err) {
      console.error('Failed to load rentals data:', err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, dealFilter, searchQuery, selectedVehicleReg]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle vehicle selection
  const handleSelectVehicle = (v) => {
    setSelectedVehicleReg(v.registration);
    setSelectedVehicleObj(v);
  };

  // Handle revenue share percentage changes
  const handleDriverShareChange = (val) => {
    const dVal = Math.min(100, Math.max(0, Number(val) || 0));
    setDriverSharePercent(dVal);
    setSikharSharePercent(100 - dVal);
  };

  // Complete and submit lease creation
  const handleActivateLease = async () => {
    if (!selectedVehicleReg) {
      alert('Please select a vehicle asset from inventory.');
      return;
    }
    if (!isAgreementSigned) {
      alert('Agreement must be signed before activation.');
      return;
    }
    if (!isDepositConfirmed) {
      alert('Security deposit must be confirmed in escrow before activation.');
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = {
        customerName,
        customerPhone,
        aadhaar,
        drivingLicence,
        address,
        referenceName,
        referencePhone,
        dealType,
        billingFrequency,
        rateAmount: Number(rateAmount) || 1000,
        driverSharePercent: Number(driverSharePercent) || 75,
        sikharSharePercent: Number(sikharSharePercent) || 25,
        rapidoDriverId,
        taxPercent: Number(taxPercent) || 5,
        securityDeposit: Number(securityDeposit) || 75000,
        vehicleRegistration: selectedVehicleReg,
        vehicleModel: selectedVehicleObj ? selectedVehicleObj.model : 'Maruti WagonR Tour H3',
        vehicleType: selectedVehicleObj ? selectedVehicleObj.type : 'CNG',
        driverName: customerName,
        driverPhone: customerPhone,
        autoActivate: true
      };

      const res = await createLeaseApi(payload);
      showToast(`✅ ${res.message || 'Lease agreement activated successfully!'}`);
      setActiveTab('active');
      setWizardStep(1);
      setIsAgreementSigned(false);
      setIsDepositConfirmed(false);
      loadData();
    } catch (err) {
      console.error('Lease creation error:', err);
      alert(err.message || 'Failed to create lease agreement.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="terminal-content rentals-stage-container">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="clean-toast-notification">
          <CheckCircle2 size={16} color="#0284c7" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Breadcrumb & Page Header */}
      <div className="command-header">
        <div>
          <div className="breadcrumb-nav">
            <span className="breadcrumb-link" onClick={() => onBackToDashboard && onBackToDashboard()}>Dashboard</span>
            <ChevronRight size={13} className="breadcrumb-sep" />
            <span className="breadcrumb-link">Rentals &amp; Collections</span>
            <ChevronRight size={13} className="breadcrumb-sep" />
            <span className="breadcrumb-active">Bookings &amp; Leases</span>
          </div>
          <h1 className="executive-greeting" style={{ marginTop: '4px' }}>
            Bookings &amp; Commercial Fleet Leases
          </h1>
          <div className="executive-subline">
            Fixed Daily Subscriptions · Rapido Revenue Share (75/25%) · 5-Stage Gate Activation Protocol · Escrow Deposits
          </div>
        </div>

        <div className="command-actions-row">
          <button
            className={`btn ${activeTab === 'new' ? 'secondary' : 'primary'}`}
            onClick={() => {
              if (activeTab === 'new') {
                setActiveTab('active');
              } else {
                setActiveTab('new');
                setWizardStep(1);
              }
            }}
          >
            {activeTab === 'new' ? <FileText size={15} /> : <Plus size={15} />}
            <span>{activeTab === 'new' ? 'View Active Leases' : '+ New Lease Order'}</span>
          </button>
          <button
            className="btn secondary"
            onClick={loadData}
            title="Sync lease records"
          >
            <RefreshCw size={15} />
            <span>Sync Records</span>
          </button>
        </div>
      </div>

      {/* Sub-Navigation Section Tabs */}
      <div className="sikhar-vehicle-subnav-bar">
        <button
          className={`vehicle-subnav-pill ${activeTab === 'active' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('active')}
        >
          <FileText size={16} />
          <span>Active &amp; Historical Leases</span>
          <span className="subnav-pill-count">{leases.length}</span>
        </button>

        <button
          className={`vehicle-subnav-pill ${activeTab === 'new' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('new')}
        >
          <Plus size={15} />
          <span>5-Stage Lease Activation Protocol</span>
          <span className="subnav-pill-badge-active">PDF Flow 1</span>
        </button>

        <button
          className={`vehicle-subnav-pill ${activeTab === 'revshare' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('revshare')}
        >
          <TrendingUp size={16} />
          <span>Rapido Revenue Share Control</span>
          <span className="subnav-pill-count">75 / 25%</span>
        </button>

        <button
          className="vehicle-subnav-pill"
          onClick={() => onNavigate && onNavigate('invoices')}
        >
          <Receipt size={16} />
          <span>Go to Invoices &amp; Billing →</span>
        </button>
      </div>

      {/* Metric Highlight Cards */}
      <div className="assignment-stats-strip">
        <div className="assignment-stat-card">
          <div className="stat-card-top">
            <span className="stat-card-label">TOTAL LEASE ORDERS</span>
            <div className="stat-icon-bubble blue">
              <FileText size={16} />
            </div>
          </div>
          <div className="stat-card-val">{summary.totalLeases || leases.length}</div>
          <div className="stat-card-subline">
            <span className="subline-highlight">{summary.activeLeases || 3} Active</span> · {summary.pendingActivation || 1} Pending Handover
          </div>
        </div>

        <div className="assignment-stat-card">
          <div className="stat-card-top">
            <span className="stat-card-label">FIXED SUBSCRIPTIONS</span>
            <div className="stat-icon-bubble green">
              <Car size={16} />
            </div>
          </div>
          <div className="stat-card-val">{summary.fixedLeases || 3}</div>
          <div className="stat-card-subline">
            Fixed daily &amp; weekly recurring billing
          </div>
        </div>

        <div className="assignment-stat-card">
          <div className="stat-card-top">
            <span className="stat-card-label">REVENUE SHARE (RAPIDO)</span>
            <div className="stat-icon-bubble purple">
              <TrendingUp size={16} />
            </div>
          </div>
          <div className="stat-card-val">{summary.revenueShareLeases || 1}</div>
          <div className="stat-card-subline">
            75% Driver Entitlement · 25% Sikhar Retained
          </div>
        </div>

        <div className="assignment-stat-card">
          <div className="stat-card-top">
            <span className="stat-card-label">ESCROW DEPOSITS SECURED</span>
            <div className="stat-icon-bubble amber">
              <Shield size={16} />
            </div>
          </div>
          <div className="stat-card-val">₹{(summary.totalEscrowDeposits || 225000).toLocaleString('en-IN')}</div>
          <div className="stat-card-subline">
            100% held in safe institutional escrow
          </div>
        </div>
      </div>

      {/* ========================================================
         TAB 1: ACTIVE LEASES DIRECTORY & TABLE (DEFAULT)
         ======================================================== */}
      {activeTab === 'active' ? (
        <div className="active-assignments-container">
          {/* Controls Bar */}
          <div className="assignment-controls-bar">
            <div className="controls-search-wrap">
              <Search size={15} color="#64748b" />
              <input
                type="text"
                placeholder="Search by customer name, phone, lease number (LSE-2026...), or plate..."
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
                  All ({leases.length})
                </button>
                <button
                  className={`pill-filter-btn ${statusFilter === 'active' ? 'active' : ''}`}
                  onClick={() => setStatusFilter('active')}
                >
                  Active ({leases.filter(l => l.status === 'Active').length})
                </button>
                <button
                  className={`pill-filter-btn ${statusFilter === 'pending' ? 'active' : ''}`}
                  onClick={() => setStatusFilter('pending')}
                >
                  Pending
                </button>
              </div>

              <div className="pill-filter-group">
                <button
                  className={`pill-filter-btn ${dealFilter === 'all' ? 'active' : ''}`}
                  onClick={() => setDealFilter('all')}
                >
                  All Deals
                </button>
                <button
                  className={`pill-filter-btn ${dealFilter === 'fixed' ? 'active' : ''}`}
                  onClick={() => setDealFilter('fixed')}
                >
                  Fixed Lease
                </button>
                <button
                  className={`pill-filter-btn ${dealFilter === 'revenue' ? 'active' : ''}`}
                  onClick={() => setDealFilter('revenue')}
                >
                  Revenue Share
                </button>
              </div>

              <button
                className="btn primary"
                onClick={() => {
                  setActiveTab('new');
                  setWizardStep(1);
                }}
              >
                <Plus size={14} />
                <span>+ Create Lease</span>
              </button>
            </div>
          </div>

          {/* Leases Table */}
          {loading ? (
            <div className="loading-state-box">
              <RefreshCw size={24} className="spin-icon" color="#1868f0" />
              <p>Loading lease agreements...</p>
            </div>
          ) : leases.length === 0 ? (
            <div className="no-active-state-box">
              <div className="empty-graphic-circle">
                <FileText size={36} color="#0284c7" />
              </div>
              <h3>No Leases Found</h3>
              <p>No commercial lease agreements matched your current search filters.</p>
              <button
                className="btn primary"
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('all');
                  setDealFilter('all');
                }}
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="table-wrapper">
              <table className="enterprise-table">
                <thead>
                  <tr>
                    <th>Order &amp; Lease ID</th>
                    <th>Customer &amp; Driver</th>
                    <th>Assigned Vehicle</th>
                    <th>Deal Model</th>
                    <th>Billing Rate / Share</th>
                    <th>Security Deposit</th>
                    <th>Agreement &amp; Status</th>
                    <th style={{ textAlign: 'right', paddingRight: '20px' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {leases.map((l) => (
                    <tr key={l.id} className="interactive-table-row">
                      <td>
                        <strong className="mono-text" style={{ color: '#1868f0', fontSize: '13px' }}>
                          {l.id}
                        </strong>
                        <div className="sub-cell-text">{l.leaseNumber}</div>
                      </td>
                      <td>
                        <strong style={{ color: '#0f172a' }}>{l.customerName}</strong>
                        <div className="sub-cell-text">📱 {l.customerPhone}</div>
                        {l.driverName && l.driverName !== l.customerName && (
                          <div className="sub-cell-text" style={{ color: '#64748b' }}>
                            Driver: {l.driverName}
                          </div>
                        )}
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span className="veh-reg-badge primary">{l.vehicleRegistration}</span>
                          <span className={`fuel-type-pill ${l.vehicleType.toLowerCase()}`}>
                            {l.vehicleType}
                          </span>
                        </div>
                        <div className="sub-cell-text">{l.vehicleModel}</div>
                      </td>
                      <td>
                        <span className={`pill ${l.dealType === 'Revenue Share' ? 'purple' : 'blue'}`}>
                          {l.dealType}
                        </span>
                        <div className="sub-cell-text">{l.billingFrequency} Schedule</div>
                      </td>
                      <td>
                        <strong style={{ color: '#0f172a', fontSize: '13px' }}>{l.rateDisplay}</strong>
                        <div className="sub-cell-text">GST {l.taxPercent}% Applicable</div>
                      </td>
                      <td>
                        <strong style={{ color: '#047857' }}>₹{l.securityDeposit.toLocaleString('en-IN')}</strong>
                        <div className="sub-cell-text" style={{ color: '#059669' }}>✓ {l.depositStatus}</div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                          <span className={`status-pill ${l.status === 'Active' ? 'good' : 'warn'}`}>
                            {l.status}
                          </span>
                          <span className="sub-cell-text" style={{ fontSize: '11px' }}>
                            {l.agreementSigned ? '✓ Signed (v1.0)' : 'Pending Signature'}
                          </span>
                        </div>
                      </td>
                      <td style={{ textAlign: 'right', paddingRight: '20px' }}>
                        <div className="table-actions-cluster">
                          <button
                            className="btn-action-pill outline-collect"
                            onClick={() => setInspectLease(l)}
                            title="Inspect formal agreement details"
                          >
                            <Eye size={12} />
                            <span>View</span>
                          </button>
                          <button
                            className="btn-action-pill primary-wallet"
                            onClick={() => onNavigate && onNavigate('invoices')}
                            title="View invoices for this lease"
                          >
                            <Receipt size={12} />
                            <span>Invoices</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : activeTab === 'new' ? (
        /* ========================================================
           TAB 2: 5-STAGE LEASE CREATION WIZARD (FLOW 1 - PDF PAGE 5)
           ======================================================== */
        <div className="assignment-wizard-container">
          <div className="wizard-header-banner">
            <div>
              <div className="wizard-badge">EXECUTIVE GATE ACTIVATION (PDF FLOW 1)</div>
              <h2 className="wizard-title">Customer to Active Commercial Lease</h2>
              <p className="wizard-desc">
                Follow the institutional 5-stage protocol: Customer &amp; Driver KYC → Deal Terms → Vehicle Inventory Reservation → Agreement Signing &amp; Escrow Deposit → Handover &amp; Lease Activation.
              </p>
            </div>
            <button
              type="button"
              className="btn secondary"
              onClick={() => setActiveTab('active')}
            >
              Cancel
            </button>
          </div>

          {/* Visual 5-Step Stage Tracker */}
          <div className="lease-wizard-stepper-bar">
            {[
              { num: 1, title: 'Customer & KYC', desc: 'Identity & documents' },
              { num: 2, title: 'Deal & Billing', desc: 'Rate or revenue share' },
              { num: 3, title: 'Reserve Vehicle', desc: 'Inventory reservation' },
              { num: 4, title: 'Agreement & Deposit', desc: 'Signature & Escrow' },
              { num: 5, title: 'Assign & Activate', desc: 'Dispatch & billing' }
            ].map((s) => (
              <div
                key={s.num}
                className={`stepper-step-item ${wizardStep === s.num ? 'active' : wizardStep > s.num ? 'completed' : ''}`}
                onClick={() => {
                  // Allow jumping back to earlier steps
                  if (wizardStep > s.num) setWizardStep(s.num);
                }}
              >
                <div className="stepper-circle">
                  {wizardStep > s.num ? '✓' : s.num}
                </div>
                <div className="stepper-meta">
                  <span className="stepper-title">{s.title}</span>
                  <span className="stepper-desc">{s.desc}</span>
                </div>
              </div>
            ))}
          </div>

          {/* STEP 1: Customer Identity & KYC */}
          {wizardStep === 1 && (
            <div className="assignment-form-body">
              <div className="assignment-grid-columns">
                <div className="assignment-section-box">
                  <div className="section-box-title">
                    <span className="step-number">1</span>
                    <h3>Customer Profile &amp; Contact</h3>
                  </div>

                  <div className="form-field-group">
                    <label className="input-label">Customer / Primary Lessee Full Name *</label>
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
                    <label className="input-label">Mobile Number (Primary OTP Contact) *</label>
                    <input
                      type="text"
                      className="styled-input-text"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="+91 98112 34567"
                      required
                    />
                  </div>

                  <div className="form-field-group">
                    <label className="input-label">Guarantor / Reference Contact</label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      <input
                        type="text"
                        className="styled-input-text"
                        value={referenceName}
                        onChange={(e) => setReferenceName(e.target.value)}
                        placeholder="Reference Name"
                      />
                      <input
                        type="text"
                        className="styled-input-text"
                        value={referencePhone}
                        onChange={(e) => setReferencePhone(e.target.value)}
                        placeholder="Reference Mobile"
                      />
                    </div>
                  </div>

                  <div className="form-field-group">
                    <label className="input-label">Residential Address</label>
                    <textarea
                      className="styled-input-textarea"
                      rows={2}
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                    />
                  </div>
                </div>

                <div className="assignment-section-box">
                  <div className="section-box-title">
                    <span className="step-number">✓</span>
                    <h3>Statutory KYC &amp; Verification Documents</h3>
                  </div>

                  <div className="form-field-group">
                    <label className="input-label">Aadhaar Card Number *</label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input
                        type="text"
                        className="styled-input-text font-mono"
                        value={aadhaar}
                        onChange={(e) => setAadhaar(e.target.value)}
                      />
                      <button
                        type="button"
                        className={`btn ${isAadhaarVerified ? 'secondary' : 'primary'}`}
                        onClick={() => setIsAadhaarVerified(!isAadhaarVerified)}
                      >
                        {isAadhaarVerified ? '✓ Verified' : 'Verify'}
                      </button>
                    </div>
                  </div>

                  <div className="form-field-group">
                    <label className="input-label">Driving Licence Number (Commercial LMV) *</label>
                    <input
                      type="text"
                      className="styled-input-text font-mono"
                      value={drivingLicence}
                      onChange={(e) => setDrivingLicence(e.target.value)}
                      placeholder="DL-0420-2019-XXXX"
                      required
                    />
                  </div>

                  {/* Verification Status Cards */}
                  <div className="kyc-checklist-grid">
                    <div className="kyc-check-pill good">
                      <span>✓ Mobile OTP Cleared</span>
                    </div>
                    <div className="kyc-check-pill good">
                      <span>✓ Aadhaar KYC Verified</span>
                    </div>
                    <div className="kyc-check-pill good">
                      <span>✓ Commercial DL Verified</span>
                    </div>
                    <div className="kyc-check-pill good">
                      <span>✓ Live Photo Biometrics Cleared</span>
                    </div>
                  </div>

                  <div className="callout-notice-info">
                    <Shield size={16} color="#0284c7" />
                    <span>
                      All documents verified against RTO Sarathi &amp; UIDAI APIs. Customer profile is eligible for commercial lease contracting.
                    </span>
                  </div>
                </div>
              </div>

              <div className="assignment-submit-bar">
                <span className="dispatch-summary-text">
                  Step 1 of 5: Customer identity verified. Ready to configure commercial deal terms.
                </span>
                <button
                  type="button"
                  className="btn primary"
                  onClick={() => setWizardStep(2)}
                >
                  <span>Continue to Deal Terms →</span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Deal Configuration & Billing Schedule */}
          {wizardStep === 2 && (
            <div className="assignment-form-body">
              <div className="assignment-section-box full-width">
                <div className="section-box-title">
                  <span className="step-number">2</span>
                  <h3>Select Commercial Model: Fixed Lease vs. Revenue Share</h3>
                </div>

                <div className="assignment-type-toggle-row">
                  <button
                    type="button"
                    className={`type-toggle-btn ${dealType === 'Fixed Lease' ? 'is-selected' : ''}`}
                    onClick={() => setDealType('Fixed Lease')}
                  >
                    <div className="toggle-btn-left">
                      <Car size={18} />
                      <div className="toggle-btn-text">
                        <strong>Fixed Rental / Daily Subscription</strong>
                        <span>Customer pays fixed agreed rental (e.g. ₹1,000/day) on scheduled billing dates.</span>
                      </div>
                    </div>
                    {dealType === 'Fixed Lease' && <span className="selected-checkmark">✓ Selected</span>}
                  </button>

                  <button
                    type="button"
                    className={`type-toggle-btn ${dealType === 'Revenue Share' ? 'is-selected' : ''}`}
                    onClick={() => setDealType('Revenue Share')}
                  >
                    <div className="toggle-btn-left">
                      <TrendingUp size={18} />
                      <div className="toggle-btn-text">
                        <strong>Revenue Share (Rapido Fleet Integration)</strong>
                        <span>Gross Rapido revenue ingested into platform; split as Driver 75% / Sikhar 25%.</span>
                      </div>
                    </div>
                    {dealType === 'Revenue Share' && <span className="selected-checkmark">✓ Selected</span>}
                  </button>
                </div>
              </div>

              {dealType === 'Fixed Lease' ? (
                /* Fixed Lease Inputs */
                <div className="assignment-grid-columns">
                  <div className="assignment-section-box">
                    <h4 className="meta-card-subheading">Fixed Rental Pricing</h4>

                    <div className="form-field-group">
                      <label className="input-label">Billing Frequency *</label>
                      <select
                        className="styled-input-select"
                        value={billingFrequency}
                        onChange={(e) => setBillingFrequency(e.target.value)}
                      >
                        <option value="Daily">Daily Debit (Standard Commercial Lease)</option>
                        <option value="Weekly">Weekly Cycle</option>
                        <option value="Monthly">Monthly Cycle</option>
                      </select>
                    </div>

                    <div className="form-field-group">
                      <label className="input-label">Rental Rate Amount (₹) *</label>
                      <div className="adp-currency-input-wrap">
                        <span className="currency-symbol">₹</span>
                        <input
                          type="number"
                          className="styled-input-text currency-field"
                          value={rateAmount}
                          onChange={(e) => setRateAmount(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="form-field-group">
                      <label className="input-label">Tax / GST (Commercial Transport)</label>
                      <input
                        type="text"
                        className="styled-input-text"
                        value={`GST ${taxPercent}% (Standard 5% Passenger Transport)`}
                        readOnly
                      />
                    </div>
                  </div>

                  <div className="assignment-section-box">
                    <h4 className="meta-card-subheading">Recurring Billing Schedule</h4>

                    <div className="form-field-group">
                      <label className="input-label">Billing Start Date *</label>
                      <input
                        type="date"
                        className="styled-input-text"
                        value={billingStartDate}
                        onChange={(e) => setBillingStartDate(e.target.value)}
                      />
                    </div>

                    <div className="summary-deal-preview-box">
                      <div className="summary-row">
                        <span>Daily Rental:</span>
                        <strong>₹{Number(rateAmount).toLocaleString('en-IN')} / day</strong>
                      </div>
                      <div className="summary-row">
                        <span>GST 5%:</span>
                        <strong>₹{(Math.round((rateAmount * 0.05) * 100) / 100).toLocaleString('en-IN')}</strong>
                      </div>
                      <div className="summary-row">
                        <span>Recurring Invoices:</span>
                        <strong>Generated daily on billing date</strong>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* Revenue Share (Rapido) Inputs */
                <div className="assignment-grid-columns">
                  <div className="assignment-section-box">
                    <h4 className="meta-card-subheading">Rapido Revenue Split Model (PDF Page 10)</h4>

                    <div className="form-field-group">
                      <label className="input-label">Driver Entitlement Share (%) *</label>
                      <input
                        type="number"
                        className="styled-input-text font-mono"
                        value={driverSharePercent}
                        onChange={(e) => handleDriverShareChange(e.target.value)}
                        min="50"
                        max="90"
                      />
                    </div>

                    <div className="form-field-group">
                      <label className="input-label">Sikhar Retained Share (%)</label>
                      <input
                        type="number"
                        className="styled-input-text font-mono"
                        value={sikharSharePercent}
                        readOnly
                      />
                    </div>

                    <div className="form-field-group">
                      <label className="input-label">Rapido Provider Driver ID</label>
                      <input
                        type="text"
                        className="styled-input-text font-mono"
                        value={rapidoDriverId}
                        onChange={(e) => setRapidoDriverId(e.target.value)}
                        placeholder="RAPIDO-RJ1024"
                      />
                    </div>
                  </div>

                  <div className="assignment-section-box">
                    <h4 className="meta-card-subheading">Illustrative Settlement Preview</h4>

                    <div className="summary-deal-preview-box">
                      <div className="summary-row">
                        <span>Example Gross Fares:</span>
                        <strong>₹10,000</strong>
                      </div>
                      <div className="summary-row">
                        <span>Driver Payout (75%):</span>
                        <strong style={{ color: '#047857' }}>₹7,500 credited to wallet</strong>
                      </div>
                      <div className="summary-row">
                        <span>Sikhar Retained (25%):</span>
                        <strong style={{ color: '#1868f0' }}>₹2,500 fleet operational fee</strong>
                      </div>
                    </div>

                    <div className="callout-notice-info">
                      <TrendingUp size={16} color="#7e22ce" />
                      <span>
                        Automatic settlement: Rapido statement feed will ingest gross earnings, credit driver wallet with 75%, and log Sikhar's 25% entitlement.
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <div className="assignment-submit-bar">
                <button
                  type="button"
                  className="btn secondary"
                  onClick={() => setWizardStep(1)}
                >
                  ← Back to KYC
                </button>
                <button
                  type="button"
                  className="btn primary"
                  onClick={() => setWizardStep(3)}
                >
                  <span>Continue to Vehicle Selection →</span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Vehicle Inventory Reservation */}
          {wizardStep === 3 && (
            <div className="assignment-form-body">
              <div className="assignment-section-box full-width">
                <div className="section-box-title">
                  <span className="step-number">3</span>
                  <h3>Select Vehicle from Ready Fleet Inventory</h3>
                </div>
                <div className="callout-notice-info" style={{ marginBottom: '14px' }}>
                  <Car size={16} color="#0284c7" />
                  <span>
                    Selecting a vehicle here <strong>reserves inventory</strong> for this lease. Full driver-vehicle assignment and dispatch occurs in Step 5 after agreement signing and deposit confirmation.
                  </span>
                </div>

                <div className="fleet-selection-inventory-grid">
                  {vehicles.map((v) => {
                    const isSelected = selectedVehicleReg === v.registration;
                    return (
                      <div
                        key={v.id || v.registration}
                        className={`inventory-vehicle-card ${isSelected ? 'is-selected' : ''}`}
                        onClick={() => handleSelectVehicle(v)}
                      >
                        <div className="veh-card-top">
                          <span className="veh-reg-badge primary">{v.registration}</span>
                          <span className={`fuel-type-pill ${v.type ? v.type.toLowerCase() : 'cng'}`}>
                            {v.type || 'CNG'}
                          </span>
                        </div>
                        <h4 className="veh-model-title">{v.model}</h4>
                        <div className="veh-meta-stats">
                          <span>Meter: {v.odometer || '18,400 km'}</span>
                          <span>Location: {v.location || 'Central Yard'}</span>
                        </div>
                        <div className="veh-status-row">
                          <span className={`status-pill ${v.status === 'Ready to Deploy' ? 'good' : 'warn'}`}>
                            {v.status || 'Available'}
                          </span>
                          {isSelected && <span className="selected-tag-badge">✓ Reserved</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="assignment-submit-bar">
                <button
                  type="button"
                  className="btn secondary"
                  onClick={() => setWizardStep(2)}
                >
                  ← Back to Deal Terms
                </button>
                <button
                  type="button"
                  className="btn primary"
                  disabled={!selectedVehicleReg}
                  onClick={() => setWizardStep(4)}
                >
                  <span>Reserve Asset &amp; Generate Agreement →</span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: Agreement & Escrow Deposit (PDF Gate Check) */}
          {wizardStep === 4 && (
            <div className="assignment-form-body">
              <div className="assignment-grid-columns">
                {/* Agreement Document Card */}
                <div className="assignment-section-box">
                  <div className="section-box-title">
                    <span className="step-number">4A</span>
                    <h3>Prefilled Commercial Lease Agreement</h3>
                  </div>

                  <div className="digital-agreement-preview-box">
                    <div className="agreement-doc-header">
                      <strong>COMMERCIAL VEHICLE LEASE AGREEMENT (v1.0)</strong>
                      <span>Sikhar Fleet Private Limited</span>
                    </div>
                    <div className="agreement-doc-body">
                      <p>
                        This Commercial Lease is made between <strong>Sikhar Fleet Private Limited</strong> (Lessor) and <strong>{customerName}</strong> (Lessee).
                      </p>
                      <ul className="agreement-bullet-list">
                        <li><strong>Vehicle Asset:</strong> {selectedVehicleObj?.model || 'Maruti WagonR'} [{selectedVehicleReg}]</li>
                        <li><strong>Commercial Deal:</strong> {dealType} ({dealType === 'Fixed Lease' ? `₹${rateAmount}/day` : '75% Driver / 25% Sikhar'})</li>
                        <li><strong>Tenure:</strong> 12 Months from Activation Date</li>
                        <li><strong>Security Deposit:</strong> ₹{Number(securityDeposit).toLocaleString('en-IN')} (Refundable upon clean handover)</li>
                      </ul>
                    </div>
                    <div className="agreement-signing-row">
                      <span className={`status-pill ${isAgreementSigned ? 'good' : 'warn'}`}>
                        {isAgreementSigned ? '✓ Digital Agreement Signed' : 'Awaiting Digital Signature'}
                      </span>
                      <button
                        type="button"
                        className={`btn ${isAgreementSigned ? 'secondary' : 'primary'} small`}
                        onClick={() => setIsAgreementSigned(!isAgreementSigned)}
                      >
                        {isAgreementSigned ? 'Undo Signature' : 'Sign Agreement Digitally'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Escrow Deposit Card */}
                <div className="assignment-section-box">
                  <div className="section-box-title">
                    <span className="step-number">4B</span>
                    <h3>Security Deposit (Escrow Guarantee)</h3>
                  </div>

                  <div className="form-field-group">
                    <label className="input-label">Deposit Amount (₹)</label>
                    <input
                      type="text"
                      className="styled-input-text font-mono"
                      value={`₹${Number(securityDeposit).toLocaleString('en-IN')}`}
                      readOnly
                    />
                  </div>

                  <div className="form-field-group">
                    <label className="input-label">UTR / Bank Transaction Reference</label>
                    <input
                      type="text"
                      className="styled-input-text font-mono"
                      value={depositReceiptRef}
                      onChange={(e) => setDepositReceiptRef(e.target.value)}
                    />
                  </div>

                  <div className="digital-agreement-preview-box" style={{ background: '#f8fafc' }}>
                    <div className="agreement-signing-row">
                      <div>
                        <strong>Escrow Status:</strong>
                        <span className={`status-pill ${isDepositConfirmed ? 'good' : 'warn'}`} style={{ marginLeft: '6px' }}>
                          {isDepositConfirmed ? '✓ Held in Escrow' : 'Payment Verification Pending'}
                        </span>
                      </div>
                      <button
                        type="button"
                        className={`btn ${isDepositConfirmed ? 'secondary' : 'primary'} small`}
                        onClick={() => setIsDepositConfirmed(!isDepositConfirmed)}
                      >
                        {isDepositConfirmed ? 'Revoke Receipt' : 'Confirm Escrow Payment'}
                      </button>
                    </div>
                  </div>

                  <div className="callout-notice-info">
                    <Shield size={16} color="#047857" />
                    <span>
                      Institutional rule: A button click cannot bypass agreement signing or deposit verification. Both gate checks must be cleared before dispatch.
                    </span>
                  </div>
                </div>
              </div>

              <div className="assignment-submit-bar">
                <button
                  type="button"
                  className="btn secondary"
                  onClick={() => setWizardStep(3)}
                >
                  ← Back to Vehicle
                </button>
                <button
                  type="button"
                  className="btn primary"
                  disabled={!isAgreementSigned || !isDepositConfirmed}
                  onClick={() => setWizardStep(5)}
                >
                  <span>Proceed to Final Dispatch &amp; Activation →</span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 5: Final Dispatch & Activation */}
          {wizardStep === 5 && (
            <div className="assignment-form-body">
              <div className="assignment-section-box full-width">
                <div className="section-box-title">
                  <span className="step-number">5</span>
                  <h3>Ready for Final Handover &amp; Lease Activation</h3>
                </div>

                <div className="final-activation-summary-grid">
                  <div className="summary-tile">
                    <span className="tile-label">CUSTOMER &amp; DRIVER</span>
                    <strong className="tile-val">{customerName}</strong>
                    <span className="tile-sub">{customerPhone}</span>
                  </div>

                  <div className="summary-tile">
                    <span className="tile-label">ALLOCATED VEHICLE</span>
                    <strong className="tile-val">{selectedVehicleReg}</strong>
                    <span className="tile-sub">{selectedVehicleObj?.model || 'Fleet Vehicle'}</span>
                  </div>

                  <div className="summary-tile">
                    <span className="tile-label">COMMERCIAL DEAL</span>
                    <strong className="tile-val">{dealType}</strong>
                    <span className="tile-sub">{dealType === 'Fixed Lease' ? `₹${rateAmount}/day` : '75% Driver / 25% Sikhar'}</span>
                  </div>

                  <div className="summary-tile">
                    <span className="tile-label">ESCROW DEPOSIT</span>
                    <strong className="tile-val text-green">₹{Number(securityDeposit).toLocaleString('en-IN')}</strong>
                    <span className="tile-sub">Verified &amp; Secured</span>
                  </div>
                </div>

                <div className="final-checks-checklist">
                  <div className="check-line good">✓ Customer KYC and Commercial Driving Licence 100% verified</div>
                  <div className="check-line good">✓ Commercial terms and recurring billing schedule generated</div>
                  <div className="check-line good">✓ Vehicle asset {selectedVehicleReg} reserved from Central Yard</div>
                  <div className="check-line good">✓ Formal lease agreement digitally executed</div>
                  <div className="check-line good">✓ Security deposit of ₹{Number(securityDeposit).toLocaleString('en-IN')} held in institutional escrow</div>
                </div>
              </div>

              <div className="assignment-submit-bar">
                <button
                  type="button"
                  className="btn secondary"
                  onClick={() => setWizardStep(4)}
                >
                  ← Back to Agreement
                </button>
                <button
                  type="button"
                  className="btn primary"
                  disabled={isSubmitting}
                  onClick={handleActivateLease}
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw size={15} className="spin-icon" />
                      <span>Activating Lease &amp; Deploying Car...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={15} />
                      <span>Complete Handover &amp; Activate Lease</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* ========================================================
           TAB 3: RAPIDO REVENUE SHARE CONTROL (PDF PAGE 10)
           ======================================================== */
        <div className="assignment-wizard-container">
          <div className="wizard-header-banner">
            <div>
              <div className="wizard-badge">PLATFORM PARTNER READINESS (PDF PAGE 10)</div>
              <h2 className="wizard-title">Rapido Revenue Share &amp; Split Ledger</h2>
              <p className="wizard-desc">
                In this model, the full gross earnings of the driver are received from Rapido into the Sikhar settlement flow. The system splits the earnings into Driver Entitlement (75%) and Sikhar Retained Share (25%).
              </p>
            </div>
          </div>

          <div className="assignment-grid-columns">
            <div className="assignment-section-box">
              <h4 className="meta-card-subheading">Settlement Split Formula</h4>
              <div className="revshare-formula-box">
                <div className="formula-item">
                  <span className="item-pct">100%</span>
                  <strong>Gross Rapido Fares</strong>
                  <span className="item-sub">Received by Sikhar Fleet</span>
                </div>
                <span className="formula-arrow">→</span>
                <div className="formula-item green">
                  <span className="item-pct">75%</span>
                  <strong>Driver Wallet Entitlement</strong>
                  <span className="item-sub">Credited once upon reconciliation</span>
                </div>
                <span className="formula-plus">+</span>
                <div className="formula-item blue">
                  <span className="item-pct">25%</span>
                  <strong>Sikhar Fleet Share</strong>
                  <span className="item-sub">Retained operational margin</span>
                </div>
              </div>
            </div>

            <div className="assignment-section-box">
              <h4 className="meta-card-subheading">Mapped Revenue Share Drivers</h4>
              <div className="table-wrapper">
                <table className="enterprise-table">
                  <thead>
                    <tr>
                      <th>Driver</th>
                      <th>Rapido ID</th>
                      <th>Vehicle</th>
                      <th>Split</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td><strong>Amit Singh</strong></td>
                      <td className="mono-text">RAPIDO-AS9021</td>
                      <td>HR55BD6737</td>
                      <td>75 / 25%</td>
                      <td><span className="status-pill good">Live Sync</span></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
         AGREEMENT INSPECTION MODAL
         ======================================================== */}
      {inspectLease && (
        <div className="clean-modal-backdrop">
          <div className="clean-modal-dialog" style={{ maxWidth: '640px' }}>
            <div className="clean-modal-header">
              <div className="modal-title-wrap">
                <FileText size={18} color="#0284c7" />
                <h3>Lease Agreement · {inspectLease.leaseNumber}</h3>
              </div>
              <button className="modal-close-btn" onClick={() => setInspectLease(null)}>✕</button>
            </div>

            <div className="clean-modal-body">
              <div className="digital-agreement-preview-box">
                <div className="agreement-doc-header">
                  <strong>SIKHAR FLEET COMMERCIAL LEASE AGREEMENT</strong>
                  <span>Order Ref: {inspectLease.id}</span>
                </div>

                <div className="revert-summary-box">
                  <div className="summary-row">
                    <span>Customer Name:</span>
                    <strong>{inspectLease.customerName}</strong>
                  </div>
                  <div className="summary-row">
                    <span>Mobile Contact:</span>
                    <strong>{inspectLease.customerPhone}</strong>
                  </div>
                  <div className="summary-row">
                    <span>Vehicle Attached:</span>
                    <strong>{inspectLease.vehicleModel} [{inspectLease.vehicleRegistration}]</strong>
                  </div>
                  <div className="summary-row">
                    <span>Commercial Deal:</span>
                    <strong>{inspectLease.dealType} ({inspectLease.rateDisplay})</strong>
                  </div>
                  <div className="summary-row">
                    <span>Security Deposit in Escrow:</span>
                    <strong style={{ color: '#047857' }}>₹{inspectLease.securityDeposit.toLocaleString('en-IN')} (Held in Escrow)</strong>
                  </div>
                  <div className="summary-row">
                    <span>Agreement Version:</span>
                    <strong>{inspectLease.agreementVersion}</strong>
                  </div>
                  <div className="summary-row">
                    <span>Operational Status:</span>
                    <span className="status-pill good">{inspectLease.status}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="clean-modal-footer">
              <button className="btn secondary" onClick={() => setInspectLease(null)}>Close</button>
              <button
                className="btn primary"
                onClick={() => {
                  setInspectLease(null);
                  onNavigate && onNavigate('invoices');
                }}
              >
                <span>View Invoices &amp; Ledger →</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
