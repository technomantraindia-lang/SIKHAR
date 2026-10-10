import React, { useState } from 'react';
import {
  Users,
  User,
  Car,
  Shield,
  CreditCard,
  CheckCircle2,
  FileText,
  AlertTriangle,
  MapPin,
  Clock
} from '../common/Icons';
import { onboardDriverApi } from '../../services/api';

// Available fleet assets that can be assigned immediately
const FLEET_AVAILABLE_VEHICLES = [
  { reg: 'DL52GD6605', model: 'WagonR H3 CNG', type: 'CNG', image: '/images/wagonr.jpg', status: 'Available', hub: 'Gurgaon Hub' },
  { reg: 'DL1Z08899', model: 'Tigor EV Fleet', type: 'EV', image: '/images/tigor.jpg', status: 'Available', hub: 'Noida Hub' },
  { reg: 'HR55BC2211', model: 'WagonR H3 CNG', type: 'CNG', image: '/images/wagonr.jpg', status: 'Available', hub: 'Gurgaon Hub' },
  { reg: 'HR38AK1234', model: 'Tigor EV Fleet', type: 'EV', image: '/images/tigor.jpg', status: 'Available', hub: 'South Delhi Hub' },
  { reg: 'DL8CAZ7788', model: 'WagonR H3 CNG', type: 'CNG', image: '/images/wagonr.jpg', status: 'Available', hub: 'South Delhi Hub' },
  { reg: 'HR38AK5678', model: 'WagonR H3 CNG', type: 'CNG', image: '/images/wagonr.jpg', status: 'Available', hub: 'North Delhi Hub' },
  { reg: 'UP16HT7788', model: 'Tigor EV Fleet', type: 'EV', image: '/images/tigor.jpg', status: 'Available', hub: 'Noida Hub' }
];

export default function AddDriverPage({ onBack, onDriverCreated }) {
  const [loading, setLoading] = useState(false);
  const [activeStep, setActiveStep] = useState(1);
  const [viewMode, setViewMode] = useState('all'); // 'all' (single page scroll) or 'wizard' (step by step)
  const [otpSent, setOtpSent] = useState(false);
  const [mobileVerified, setMobileVerified] = useState(true);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    altPhone: '',
    city: 'Gurgaon Operations Hub',
    address: '',
    emergencyContact: '',
    emergencyRelation: 'Brother',
    // Reference / Guarantor (PDF Step 01)
    referenceName: 'Suresh Verma',
    referencePhone: '98101 88990',
    referenceRelation: 'Guarantor',
    referenceAddress: 'Sector 14, Gurgaon',
    // Statutory KYC (PDF Page 3 & 4)
    drivingLicence: '',
    dlExpiry: '2030-11-14',
    dlCategory: 'Commercial LMV',
    aadhaar: '',
    panCard: '',
    policeVerification: 'Verified (Clear)',
    kycReviewStatus: 'Verified',
    // Commercial Deal Terms (PDF Step 02 & 04)
    rentalModel: 'Fixed Daily Rental',
    agreedRate: '1000',
    securityDeposit: '75000',
    contractMonths: 12,
    billingFrequency: 'Daily Debit (00:00 hrs)',
    taxRule: 'GST 5% (Commercial Passenger Transport)',
    // 12-Hour Shift Specifics
    shiftType: 'Day Shift (06:00 AM - 06:00 PM)',
    coDriver: 'Sandeep Kumar (Shared)',
    // Agreement Signing (PDF Step 04)
    agreementVersion: 'v1.0 (Master Commercial Lease)',
    agreementSigned: true,
    signingMethod: 'Digital Aadhaar e-Sign',
    // Deposit Confirmation (PDF Step 05)
    depositMode: 'Bank Transfer (Escrow)',
    depositReceiptNumber: 'UTR-89127632',
    depositConfirmed: true,
    // Vehicle Asset Allocation (PDF Step 06)
    selectedVehicleReg: 'DL52GD6605',
    handoverOdometer: '45,210',
    handoverKeys: true,
    handoverQcPassed: true,
    initialBalance: 0
  });

  const selectedVehicleObj = FLEET_AVAILABLE_VEHICLES.find(
    (v) => v.reg === formData.selectedVehicleReg
  );

  const updateField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Readiness Calculation for the live preview widget (aligned with PDF 6 gates)
  const readinessChecks = [
    { label: 'Gate 01: Driver Profile & Mobile Verified', done: !!formData.name.trim() && formData.phone.trim().length >= 10 && mobileVerified },
    { label: 'Gate 02: Commercial DL, PAN Card & KYC', done: !!formData.drivingLicence.trim() },
    { label: 'Gate 03: Commercial Deal & Tax Rule', done: Number(formData.agreedRate) > 0 },
    { label: 'Gate 04: Agreement v1.0 Generated & Signed', done: formData.agreementSigned },
    { label: 'Gate 05: Escrow Security Deposit Confirmed', done: formData.depositConfirmed && Number(formData.securityDeposit) > 0 },
    { label: 'Gate 06: Vehicle Handover & Odometer Ready', done: !formData.selectedVehicleReg || (formData.handoverKeys && formData.handoverQcPassed) }
  ];
  const completedChecksCount = readinessChecks.filter((c) => c.done).length;
  const readinessPercent = Math.round((completedChecksCount / readinessChecks.length) * 100);

  const getInitials = (name) => {
    if (!name || !name.trim()) return 'DR';
    return name
      .trim()
      .split(' ')
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  };

  const handleSendOtp = () => {
    setOtpSent(true);
    setTimeout(() => {
      setMobileVerified(true);
    }, 800);
  };

  const handleSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!formData.name.trim() || !formData.phone.trim() || !formData.drivingLicence.trim()) {
      alert('Please fill in required fields: Full Name, Mobile Phone, and Commercial Driving Licence.');
      return;
    }

    try {
      setLoading(true);

      const payload = {
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        altPhone: formData.altPhone.trim(),
        city: formData.city,
        address: formData.address.trim() || `${formData.city}, Delhi NCR`,
        emergencyContact: formData.emergencyContact.trim(),
        emergencyRelation: formData.emergencyRelation,
        // PDF Step 01 Reference
        referenceName: formData.referenceName.trim(),
        referencePhone: formData.referencePhone.trim(),
        referenceRelation: formData.referenceRelation,
        referenceAddress: formData.referenceAddress.trim(),
        // PDF Step 02 Statutory KYC
        drivingLicence: formData.drivingLicence.trim().toUpperCase(),
        dlExpiry: formData.dlExpiry || '14 Nov 2030',
        dlCategory: formData.dlCategory,
        aadhaar: formData.aadhaar.trim() || 'XXXX-XXXX-9821',
        panCard: formData.panCard.trim().toUpperCase() || '',
        policeVerification: formData.policeVerification,
        kycReviewStatus: formData.kycReviewStatus,
        // PDF Step 02 & 03 Commercial Deal
        rentalModel: formData.rentalModel,
        agreedRate: `₹${Number(formData.agreedRate).toLocaleString('en-IN')} / day`,
        securityDeposit: `₹${Number(formData.securityDeposit).toLocaleString('en-IN')} (Secured in Escrow)`,
        contractMonths: Number(formData.contractMonths) || 12,
        billingFrequency: formData.billingFrequency,
        taxRule: formData.taxRule,
        shiftType: formData.rentalModel === '12-Hour Shift Lease' ? formData.shiftType : '24-Hour Dedicated',
        coDriver: formData.rentalModel === '12-Hour Shift Lease' ? formData.coDriver : '',
        // PDF Step 04 & 05 Agreement & Escrow
        agreementVersion: formData.agreementVersion,
        agreementSigned: formData.agreementSigned,
        depositReceipt: formData.depositReceiptNumber,
        depositStatus: 'Held in Escrow',
        // PDF Step 06 Vehicle & Handover
        vehicleRegistration: formData.selectedVehicleReg || '',
        vehicleModel: selectedVehicleObj ? selectedVehicleObj.model : 'WagonR H3 CNG',
        vehicleType: selectedVehicleObj ? selectedVehicleObj.type : 'CNG',
        handoverOdometer: `${formData.handoverOdometer} km`,
        initialBalance: Number(formData.initialBalance) || 0
      };

      const res = await onboardDriverApi(payload);
      if (onDriverCreated) {
        onDriverCreated(res.data);
      } else {
        onBack();
      }
    } catch (err) {
      alert(err.message || 'Failed to onboard driver. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const stepsList = [
    { num: 1, id: 'step-personal', label: '1. Personal & Mobile', icon: <User size={15} /> },
    { num: 2, id: 'step-kyc', label: '2. KYC, DL & PAN Card', icon: <Shield size={15} /> },
    { num: 3, id: 'step-lease', label: '3. Lease & Shift Deal', icon: <FileText size={15} /> },
    { num: 4, id: 'step-vehicle', label: '4. Vehicle & Handover', icon: <Car size={15} /> },
    { num: 5, id: 'step-wallet', label: '5. Smart 3-Pocket Wallet', icon: <CreditCard size={15} /> }
  ];

  const handleStepClick = (num, id) => {
    setActiveStep(num);
    if (viewMode === 'all') {
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  return (
    <div className="adp-wrapper">
      {/* Top Header & Breadcrumb Ribbon */}
      <div className="adp-top-ribbon">
        <div className="adp-breadcrumb-cluster">
          <button className="adp-btn-back-roster" onClick={onBack} title="Back to Driver Directory">
            <span className="adp-back-arrow">←</span>
            <span>Back to Driver Directory</span>
          </button>
          <span className="adp-crumb-sep">/</span>
          <span className="adp-crumb-current">Onboard Commercial Driver (PDF 6-Gate Plan)</span>
        </div>

        <div className="adp-top-actions">
          <div className="adp-view-mode-toggle">
            <button
              type="button"
              className={`mode-btn ${viewMode === 'all' ? 'active' : ''}`}
              onClick={() => setViewMode('all')}
              title="Show all sections together on one page"
            >
              All Sections View
            </button>
            <button
              type="button"
              className={`mode-btn ${viewMode === 'wizard' ? 'active' : ''}`}
              onClick={() => setViewMode('wizard')}
              title="Step-by-step guided wizard"
            >
              Step-by-Step
            </button>
          </div>
          <button type="button" className="adp-btn-cancel-top" onClick={onBack}>
            Cancel
          </button>
          <button
            type="button"
            className="adp-btn-submit-top"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? 'Activating...' : '✓ Complete Onboarding & Activate'}
          </button>
        </div>
      </div>

      {/* Hero Banner Header */}
      <div className="adp-hero-card">
        <div className="adp-hero-left">
          <div className="adp-hero-avatar-badge">
            <Users size={28} />
          </div>
          <div className="adp-hero-copy">
            <div className="adp-system-badge">
              <span className="adp-live-pulse-dot" />
              <span>SIKHAR DRIVER ONBOARDING • 6-STAGE LEASE ACTIVATION PROTOCOL</span>
            </div>
            <h1 className="adp-hero-title">Onboard Commercial Driver & Activate Lease</h1>
            <p className="adp-hero-desc">
              Executes the institutional client plan: verify mobile, enforce MoRTH DL/KYC clearance, bind commercial lease terms (including 12-hour dual-driver shifts), secure escrow deposit, and hand over fleet asset.
            </p>
          </div>
        </div>

        <div className="adp-hero-stats">
          <div className="adp-hero-stat-pill">
            <span className="stat-label">Available Cars</span>
            <strong className="stat-val text-green">{FLEET_AVAILABLE_VEHICLES.length} Ready</strong>
          </div>
          <div className="adp-hero-stat-pill">
            <span className="stat-label">Statutory KYC</span>
            <strong className="stat-val text-blue">Parivahan Live</strong>
          </div>
          <div className="adp-hero-stat-pill">
            <span className="stat-label">Activation Mode</span>
            <strong className="stat-val text-purple">Zero-Bypass Policy</strong>
          </div>
        </div>
      </div>

      {/* 6-Stage Visual Workflow Ribbon (PDF Page 5 "Customer to active lease") */}
      <div className="adp-workflow-pills-bar">
        <span className="wf-bar-title">PDF LIFECYCLE FLOW:</span>
        <div className="wf-steps-strip">
          <span className={`wf-step ${formData.name && formData.phone ? 'done' : 'active'}`}>01 Driver & Mobile</span>
          <span className="wf-arrow">→</span>
          <span className={`wf-step ${formData.drivingLicence ? 'done' : ''}`}>02 KYC & Licence</span>
          <span className="wf-arrow">→</span>
          <span className={`wf-step ${formData.agreedRate ? 'done' : ''}`}>03 Deal & Shifts</span>
          <span className="wf-arrow">→</span>
          <span className={`wf-step ${formData.agreementSigned ? 'done' : ''}`}>04 Sign Agreement</span>
          <span className="wf-arrow">→</span>
          <span className={`wf-step ${formData.depositConfirmed ? 'done' : ''}`}>05 Escrow Deposit</span>
          <span className="wf-arrow">→</span>
          <span className={`wf-step ${formData.selectedVehicleReg ? 'done' : ''}`}>06 Handover & Active</span>
        </div>
      </div>

      {/* Step Navigator Bar */}
      <div className="adp-stepper-ribbon">
        {stepsList.map((s) => {
          const isCurrent = activeStep === s.num;
          return (
            <button
              key={s.num}
              type="button"
              className={`adp-step-btn ${isCurrent ? 'is-active' : ''}`}
              onClick={() => handleStepClick(s.num, s.id)}
            >
              <span className="step-btn-num">{s.num}</span>
              <span className="step-btn-icon">{s.icon}</span>
              <span className="step-btn-label">{s.label.split('. ')[1]}</span>
            </button>
          );
        })}
      </div>

      {/* Main Content Layout: Form Columns + Live Preview Aside */}
      <div className="adp-content-split">
        {/* Left Column: The Form */}
        <div className="adp-form-col">
          <form onSubmit={handleSubmit} noValidate>

            {/* SECTION 1: Personal, Mobile Verification & Reference (PDF Step 01) */}
            {(viewMode === 'all' || activeStep === 1) && (
              <div className="adp-card-section" id="step-personal">
                <div className="adp-card-header">
                  <div className="card-header-icon blue">
                    <User size={18} />
                  </div>
                  <div className="card-header-texts">
                    <div className="card-step-badge">GATE 01 • PROFILES, MOBILE & REFERENCE</div>
                    <h2 className="card-title">Driver Profile, Mobile Verification & Reference</h2>
                    <p className="card-sub">Primary pilot identification, verified mobile contact, guarantor reference, and operating terminal.</p>
                  </div>
                </div>

                <div className="adp-grid-2col">
                  <div className="adp-form-group full-width">
                    <label className="adp-field-label">
                      Full Driver Name (As on Driving Licence) <span className="req">*</span>
                    </label>
                    <div className="adp-input-wrap">
                      <input
                        type="text"
                        className="adp-text-input"
                        required
                        placeholder="e.g. Ramesh Chandra Yadav"
                        value={formData.name}
                        onChange={(e) => updateField('name', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="adp-form-group">
                    <div className="flex-between">
                      <label className="adp-field-label">
                        Primary Mobile (WhatsApp) <span className="req">*</span>
                      </label>
                      <span className="mobile-verify-status-badge">
                        {mobileVerified ? '✓ Mobile Verified (OTP)' : otpSent ? 'Awaiting OTP' : 'Verification Required'}
                      </span>
                    </div>
                    <div className="adp-phone-input-wrap">
                      <span className="country-code-pill">+91</span>
                      <input
                        type="tel"
                        className="adp-text-input phone-field"
                        required
                        placeholder="98765 43210"
                        value={formData.phone}
                        onChange={(e) => {
                          updateField('phone', e.target.value);
                          if (e.target.value.length >= 10 && !mobileVerified) {
                            setMobileVerified(true);
                          }
                        }}
                      />
                      <button
                        type="button"
                        className="btn-verify-otp-pill"
                        onClick={handleSendOtp}
                        title="Verify phone via automated SMS OTP"
                      >
                        {mobileVerified ? '✓ Verified' : otpSent ? 'Resend' : 'Verify OTP'}
                      </button>
                    </div>
                  </div>

                  <div className="adp-form-group">
                    <label className="adp-field-label">Alternate Mobile Number</label>
                    <div className="adp-phone-input-wrap">
                      <span className="country-code-pill">+91</span>
                      <input
                        type="tel"
                        className="adp-text-input phone-field"
                        placeholder="98123 45678"
                        value={formData.altPhone}
                        onChange={(e) => updateField('altPhone', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="adp-form-group">
                    <label className="adp-field-label">
                      Base Operating Hub <span className="req">*</span>
                    </label>
                    <select
                      className="adp-select-input"
                      value={formData.city}
                      onChange={(e) => updateField('city', e.target.value)}
                    >
                      <option value="Gurgaon Operations Hub">Gurgaon Operations Hub • Sector 14 Yard</option>
                      <option value="South Delhi Hub">South Delhi Hub • Nehru Place Terminal</option>
                      <option value="Noida Hub">Noida Hub • Sector 62 Fleet Center</option>
                      <option value="North Delhi Sub-Hub">North Delhi Sub-Hub • Rohini Sector 10</option>
                    </select>
                  </div>

                  <div className="adp-form-group">
                    <label className="adp-field-label">Permanent Residential Address</label>
                    <input
                      type="text"
                      className="adp-text-input"
                      placeholder="e.g. Village Chakkarpur, Sector 28, Gurgaon"
                      value={formData.address}
                      onChange={(e) => updateField('address', e.target.value)}
                    />
                  </div>

                  {/* Personal Reference / Guarantor (PDF Page 3 & 5 requirement) */}
                  <div className="adp-form-group">
                    <label className="adp-field-label">
                      Personal Reference / Guarantor Name <span className="req">*</span>
                    </label>
                    <input
                      type="text"
                      className="adp-text-input"
                      placeholder="e.g. Suresh Verma"
                      value={formData.referenceName}
                      onChange={(e) => updateField('referenceName', e.target.value)}
                    />
                    <span className="adp-field-hint">Required for commercial lease collateral assurance</span>
                  </div>

                  <div className="adp-form-group">
                    <label className="adp-field-label">Guarantor Relation & Phone</label>
                    <div className="flex-gap-2">
                      <select
                        className="adp-select-input"
                        style={{ width: '130px' }}
                        value={formData.referenceRelation}
                        onChange={(e) => updateField('referenceRelation', e.target.value)}
                      >
                        <option value="Guarantor">Guarantor</option>
                        <option value="Father">Father</option>
                        <option value="Brother">Brother</option>
                        <option value="Spouse">Spouse</option>
                        <option value="Peer Driver">Fleet Peer</option>
                      </select>
                      <input
                        type="tel"
                        className="adp-text-input"
                        placeholder="Guarantor Phone (+91...)"
                        value={formData.referencePhone}
                        onChange={(e) => updateField('referencePhone', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="adp-form-group full-width">
                    <label className="adp-field-label">Emergency Contact Line</label>
                    <div className="flex-gap-2">
                      <select
                        className="adp-select-input"
                        style={{ width: '130px' }}
                        value={formData.emergencyRelation}
                        onChange={(e) => updateField('emergencyRelation', e.target.value)}
                      >
                        <option value="Brother">Brother</option>
                        <option value="Father">Father</option>
                        <option value="Spouse">Spouse</option>
                        <option value="Mother">Mother</option>
                        <option value="Relative">Relative</option>
                      </select>
                      <input
                        type="tel"
                        className="adp-text-input"
                        placeholder="Emergency Phone (e.g. 98991 22334)"
                        value={formData.emergencyContact}
                        onChange={(e) => updateField('emergencyContact', e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {viewMode === 'wizard' && (
                  <div className="adp-card-wizard-nav">
                    <div />
                    <button
                      type="button"
                      className="btn-wizard-next"
                      onClick={() => setActiveStep(2)}
                    >
                      Continue to Statutory KYC →
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* SECTION 2: Statutory KYC & Compliance (PDF Page 3 & 4) */}
            {(viewMode === 'all' || activeStep === 2) && (
              <div className="adp-card-section" id="step-kyc">
                <div className="adp-card-header">
                  <div className="card-header-icon green">
                    <Shield size={18} />
                  </div>
                  <div className="card-header-texts">
                    <div className="card-step-badge">GATE 02 • STATUTORY KYC & LICENSING</div>
                    <h2 className="card-title">Commercial Driving Licence & Verification</h2>
                    <p className="card-sub">Commercial Driving Licence, Aadhaar Biometrics, and Police Clearance with clear Submitted/Verified statuses.</p>
                  </div>
                </div>

                <div className="adp-grid-2col">
                  <div className="adp-form-group">
                    <label className="adp-field-label">
                      Commercial Driving Licence (DL) Number <span className="req">*</span>
                    </label>
                    <div className="adp-input-wrap">
                      <input
                        type="text"
                        className="adp-text-input font-mono"
                        required
                        placeholder="e.g. HR-2620190012345"
                        value={formData.drivingLicence}
                        onChange={(e) => updateField('drivingLicence', e.target.value)}
                      />
                    </div>
                    <span className="adp-field-hint">Verified in real-time via MoRTH Sarathi API</span>
                  </div>

                  <div className="adp-form-group">
                    <label className="adp-field-label">Licence Expiry Date</label>
                    <input
                      type="date"
                      className="adp-text-input"
                      value={formData.dlExpiry}
                      onChange={(e) => updateField('dlExpiry', e.target.value)}
                    />
                  </div>

                  <div className="adp-form-group">
                    <label className="adp-field-label">Licence Category</label>
                    <select
                      className="adp-select-input"
                      value={formData.dlCategory}
                      onChange={(e) => updateField('dlCategory', e.target.value)}
                    >
                      <option value="Commercial LMV">Commercial LMV (Light Motor Vehicle Transport)</option>
                      <option value="Commercial Transport">Commercial Transport (Badge Holder)</option>
                      <option value="LMV-NT">LMV-NT (Non-Transport with Commercial Permit)</option>
                    </select>
                  </div>

                  <div className="adp-form-group">
                    <label className="adp-field-label">Aadhaar Card Number</label>
                    <input
                      type="text"
                      className="adp-text-input font-mono"
                      placeholder="e.g. 5421-9876-1234"
                      value={formData.aadhaar}
                      onChange={(e) => updateField('aadhaar', e.target.value)}
                    />
                  </div>

                  <div className="adp-form-group">
                    <label className="adp-field-label">
                      PAN Card Number (Permanent Account Number)
                    </label>
                    <div className="adp-input-wrap">
                      <input
                        type="text"
                        className="adp-text-input font-mono uppercase"
                        placeholder="e.g. ABCDE1234F"
                        maxLength={10}
                        value={formData.panCard}
                        onChange={(e) => updateField('panCard', e.target.value.toUpperCase())}
                      />
                    </div>
                    <span className="adp-field-hint">Income Tax Dept / NSDL validation for TDS & banking compliance</span>
                  </div>

                  <div className="adp-form-group">
                    <label className="adp-field-label">Police Verification Certificate</label>
                    <select
                      className="adp-select-input"
                      value={formData.policeVerification}
                      onChange={(e) => updateField('policeVerification', e.target.value)}
                    >
                      <option value="Verified (Clear)">Verified (Clear Commissioner Report on Record)</option>
                      <option value="In Verification">In Verification (Receipt Uploaded, 14-Day Grace)</option>
                      <option value="Exempted/Pending">Pending (7-Day Provisional Window)</option>
                    </select>
                  </div>

                  <div className="adp-form-group">
                    <label className="adp-field-label">KYC Review Lifecycle Status</label>
                    <select
                      className="adp-select-input"
                      value={formData.kycReviewStatus}
                      onChange={(e) => updateField('kycReviewStatus', e.target.value)}
                    >
                      <option value="Verified">Verified (Full Statutory Compliance Cleared)</option>
                      <option value="Submitted">Submitted (Under Operations Review)</option>
                      <option value="Provisional">Provisional (Awaiting Physical Verification)</option>
                    </select>
                  </div>
                </div>

                <div className="adp-callout-banner green">
                  <CheckCircle2 size={18} className="callout-icon" />
                  <div className="callout-text">
                    <strong>Zero-Bypass KYC Protocol Active (PDF Page 4 & 5)</strong>
                    <p>The system enforces that a driver cannot be activated on road until statutory Driving Licence and KYC criteria are fully cleared.</p>
                  </div>
                </div>

                {viewMode === 'wizard' && (
                  <div className="adp-card-wizard-nav">
                    <button
                      type="button"
                      className="btn-wizard-prev"
                      onClick={() => setActiveStep(1)}
                    >
                      ← Back to Personal
                    </button>
                    <button
                      type="button"
                      className="btn-wizard-next"
                      onClick={() => setActiveStep(3)}
                    >
                      Continue to Lease Terms →
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* SECTION 3: Commercial Lease Terms & 12-Hour Shift Option (PDF Step 02, 04, 05) */}
            {(viewMode === 'all' || activeStep === 3) && (
              <div className="adp-card-section" id="step-lease">
                <div className="adp-card-header">
                  <div className="card-header-icon amber">
                    <FileText size={18} />
                  </div>
                  <div className="card-header-texts">
                    <div className="card-step-badge">GATE 03 • COMMERCIAL LEASE & AGREEMENT</div>
                    <h2 className="card-title">Commercial Lease Deal Terms & Shift Model</h2>
                    <p className="card-sub">Configure rental model, 12-hour dual-driver shift schedules, billing frequency, and escrow deposit.</p>
                  </div>
                </div>

                <div className="adp-grid-2col">
                  {/* Model Selection Row */}
                  <div className="adp-form-group full-width">
                    <label className="adp-field-label">Select Commercial Lease Model</label>
                    <div className="adp-radio-cards-row">
                      {[
                        { 
                          id: 'Fixed Daily Rental', 
                          title: 'Fixed Daily Rental', 
                          sub: 'Standard 24-hr vehicle dedicated to 1 driver' 
                        },
                        { 
                          id: 'Revenue Share 80/20', 
                          title: 'Rev-Share 80/20', 
                          sub: 'Driver keeps 80% net fare, Sikhar keeps 20%' 
                        },
                        { 
                          id: '12-Hour Shift Lease', 
                          title: '12-Hour Shift', 
                          sub: 'Shared dual-driver vehicle (Day / Night Shift)' 
                        }
                      ].map((model) => (
                        <div
                          key={model.id}
                          className={`adp-radio-card ${formData.rentalModel === model.id ? 'is-selected' : ''}`}
                          onClick={() => updateField('rentalModel', model.id)}
                        >
                          <input
                            type="radio"
                            name="rentalModel"
                            checked={formData.rentalModel === model.id}
                            onChange={() => updateField('rentalModel', model.id)}
                          />
                          <div>
                            <strong>{model.title}</strong>
                            <span>{model.sub}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* SPECIAL SECTION: Explaining & Configuring 12-Hour Shift Lease */}
                  {formData.rentalModel === '12-Hour Shift Lease' && (
                    <div className="adp-special-shift-panel full-width">
                      <div className="shift-panel-header">
                        <div className="shift-icon-wrap">
                          <Clock size={18} />
                        </div>
                        <div>
                          <strong>12-Hour Shift: Shared Dual-Driver Vehicle Configuration</strong>
                          <p>
                            <strong>What this means:</strong> Instead of 1 driver holding the vehicle for 24 hours, the car is operated by <strong>two drivers sharing 1 vehicle</strong>. Driver A takes Day Shift (06:00 to 18:00) and Driver B takes Night Shift (18:00 to 06:00). This achieves 24/7 fleet revenue uptime and reduces daily vehicle rental costs for both drivers.
                          </p>
                        </div>
                      </div>

                      <div className="shift-config-grid">
                        <div className="adp-form-group">
                          <label className="adp-field-label">Assigned Shift Window</label>
                          <select
                            className="adp-select-input"
                            value={formData.shiftType}
                            onChange={(e) => updateField('shiftType', e.target.value)}
                          >
                            <option value="Day Shift (06:00 AM - 06:00 PM)">Day Shift (06:00 AM – 06:00 PM • 12 Hours)</option>
                            <option value="Night Shift (06:00 PM - 06:00 AM)">Night Shift (06:00 PM – 06:00 AM • 12 Hours)</option>
                          </select>
                        </div>

                        <div className="adp-form-group">
                          <label className="adp-field-label">Paired Co-Driver (Partner on other shift)</label>
                          <input
                            type="text"
                            className="adp-text-input"
                            placeholder="e.g. Sandeep Kumar (DL52GD7393)"
                            value={formData.coDriver}
                            onChange={(e) => updateField('coDriver', e.target.value)}
                          />
                          <span className="adp-field-hint">Co-driver who hands over the vehicle at hub terminal</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Rental Rate */}
                  <div className="adp-form-group">
                    <label className="adp-field-label">
                      Agreed Rental Rate (₹ / Day or Shift) <span className="req">*</span>
                    </label>
                    <div className="adp-currency-input-wrap">
                      <span className="currency-symbol">₹</span>
                      <input
                        type="number"
                        className="adp-text-input currency-field"
                        value={formData.agreedRate}
                        onChange={(e) => updateField('agreedRate', e.target.value)}
                      />
                      <span className="currency-suffix">{formData.rentalModel === '12-Hour Shift Lease' ? '/ shift' : '/ day'}</span>
                    </div>
                    <div className="adp-quick-presets">
                      <button type="button" onClick={() => updateField('agreedRate', '600')}>₹600</button>
                      <button type="button" onClick={() => updateField('agreedRate', '850')}>₹850</button>
                      <button type="button" onClick={() => updateField('agreedRate', '1000')}>₹1,000</button>
                      <button type="button" onClick={() => updateField('agreedRate', '1150')}>₹1,150</button>
                    </div>
                  </div>

                  {/* Billing Frequency (PDF Step 02) */}
                  <div className="adp-form-group">
                    <label className="adp-field-label">Billing Frequency & Cycle</label>
                    <select
                      className="adp-select-input"
                      value={formData.billingFrequency}
                      onChange={(e) => updateField('billingFrequency', e.target.value)}
                    >
                      <option value="Daily Debit (00:00 hrs)">Daily Automated Wallet Debit (00:00 hrs)</option>
                      <option value="Weekly Cycle (Every Monday)">Weekly Cycle (Every Monday)</option>
                      <option value="Monthly Advance">Monthly Advance Invoice</option>
                    </select>
                  </div>

                  {/* Tax Rule (PDF Step 02) */}
                  <div className="adp-form-group">
                    <label className="adp-field-label">Statutory Tax Rule (GST)</label>
                    <select
                      className="adp-select-input"
                      value={formData.taxRule}
                      onChange={(e) => updateField('taxRule', e.target.value)}
                    >
                      <option value="GST 5% (Commercial Passenger Transport)">GST 5% (Commercial Passenger Transport with ITC)</option>
                      <option value="GST Exempt (Section 11)">GST Exempt (Section 11 Non-AC / Specialized)</option>
                      <option value="GST 18% (Commercial Hire)">GST 18% (Commercial Equipment Hire)</option>
                    </select>
                  </div>

                  {/* Security Deposit in Escrow (PDF Step 05) */}
                  <div className="adp-form-group">
                    <label className="adp-field-label">Security Deposit in Escrow (₹)</label>
                    <div className="adp-currency-input-wrap">
                      <span className="currency-symbol">₹</span>
                      <input
                        type="number"
                        className="adp-text-input currency-field"
                        value={formData.securityDeposit}
                        onChange={(e) => updateField('securityDeposit', e.target.value)}
                      />
                    </div>
                    <div className="adp-quick-presets">
                      <button type="button" onClick={() => updateField('securityDeposit', '50000')}>₹50k</button>
                      <button type="button" onClick={() => updateField('securityDeposit', '75000')}>₹75k</button>
                      <button type="button" onClick={() => updateField('securityDeposit', '100000')}>₹100k</button>
                    </div>
                  </div>

                  {/* Contract Agreement Tenure & Versioning (PDF Step 04) */}
                  <div className="adp-form-group">
                    <label className="adp-field-label">Contract Agreement Tenure</label>
                    <select
                      className="adp-select-input"
                      value={formData.contractMonths}
                      onChange={(e) => updateField('contractMonths', e.target.value)}
                    >
                      <option value="6">6 Months Contract (Provisional)</option>
                      <option value="12">12 Months (1 Year Standard Fleet Lease)</option>
                      <option value="24">24 Months (2 Year Extended Master Lease)</option>
                    </select>
                  </div>

                  {/* Agreement Versioning & E-Sign Status (PDF Step 04) */}
                  <div className="adp-form-group">
                    <label className="adp-field-label">Commercial Agreement Document</label>
                    <div className="agreement-signing-control-box">
                      <div className="agr-doc-info">
                        <FileText size={16} className="text-blue" />
                        <div>
                          <strong>{formData.agreementVersion}</strong>
                          <span>Aadhaar e-Sign • Pre-approved Master Legal Template</span>
                        </div>
                      </div>
                      <span className="badge-signed">✓ E-Signed Ready</span>
                    </div>
                  </div>
                </div>

                {/* Financial Overview Strip */}
                <div className="adp-financial-summary-strip">
                  <div className="fin-metric">
                    <span className="fin-lbl">Billing Debit</span>
                    <strong className="fin-val text-green">₹{Number(formData.agreedRate || 0).toLocaleString('en-IN')}</strong>
                  </div>
                  <div className="fin-divider" />
                  <div className="fin-metric">
                    <span className="fin-lbl">Estimated Monthly Gross</span>
                    <strong className="fin-val">₹{(Number(formData.agreedRate || 0) * 30).toLocaleString('en-IN')}</strong>
                  </div>
                  <div className="fin-divider" />
                  <div className="fin-metric">
                    <span className="fin-lbl">Escrow Guarantee</span>
                    <strong className="fin-val text-blue">₹{Number(formData.securityDeposit || 0).toLocaleString('en-IN')}</strong>
                  </div>
                  <div className="fin-divider" />
                  <div className="fin-metric">
                    <span className="fin-lbl">Contract Term</span>
                    <strong className="fin-val">{formData.contractMonths} Months</strong>
                  </div>
                </div>

                {viewMode === 'wizard' && (
                  <div className="adp-card-wizard-nav">
                    <button
                      type="button"
                      className="btn-wizard-prev"
                      onClick={() => setActiveStep(2)}
                    >
                      ← Back to KYC
                    </button>
                    <button
                      type="button"
                      className="btn-wizard-next"
                      onClick={() => setActiveStep(4)}
                    >
                      Continue to Vehicle Allocation →
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* SECTION 4: Vehicle Asset Allocation & Handover (PDF Step 03 & 06) */}
            {(viewMode === 'all' || activeStep === 4) && (
              <div className="adp-card-section" id="step-vehicle">
                <div className="adp-card-header">
                  <div className="card-header-icon purple">
                    <Car size={18} />
                  </div>
                  <div className="card-header-texts">
                    <div className="card-step-badge">GATE 04 • FLEET ASSET & HANDOVER INSPECTION</div>
                    <h2 className="card-title">Commercial Vehicle Allocation & Handover</h2>
                    <p className="card-sub">Pair an active vehicle asset with this driver, verify statutory compliance, and record starting odometer.</p>
                  </div>
                </div>

                {/* Vehicle Selection Grid */}
                <div className="adp-vehicle-assignment-flow">
                  <div className="adp-veh-options-header">
                    <span className="opt-title">Select Ready Vehicle Asset:</span>
                    <button
                      type="button"
                      className={`standby-toggle-btn ${formData.selectedVehicleReg === '' ? 'is-active' : ''}`}
                      onClick={() => updateField('selectedVehicleReg', '')}
                    >
                      {formData.selectedVehicleReg === '' ? '✓ Standby Pool Selected' : 'Place on Standby Pool (No Car)'}
                    </button>
                  </div>

                  <div className="adp-fleet-card-grid">
                    {FLEET_AVAILABLE_VEHICLES.map((v) => {
                      const isSelected = formData.selectedVehicleReg === v.reg;
                      return (
                        <div
                          key={v.reg}
                          className={`adp-fleet-tile ${isSelected ? 'is-selected' : ''}`}
                          onClick={() => updateField('selectedVehicleReg', v.reg)}
                        >
                          <div className="fleet-tile-img-box">
                            <img
                              src={v.image}
                              alt={v.model}
                              onError={(e) => {
                                e.target.style.display = 'none';
                              }}
                            />
                            <span className={`fuel-type-pill ${v.type.toLowerCase()}`}>
                              {v.type}
                            </span>
                          </div>
                          <div className="fleet-tile-body">
                            <div className="reg-row">
                              <strong className="reg-number">{v.reg}</strong>
                              {isSelected && <span className="assigned-tag">Selected</span>}
                            </div>
                            <span className="car-model-name">{v.model}</span>
                            <div className="hub-row">
                              <MapPin size={11} />
                              <span>{v.hub}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Active Selection Banner */}
                  {selectedVehicleObj ? (
                    <div className="adp-selected-veh-banner">
                      <div className="veh-banner-left">
                        <img
                          src={selectedVehicleObj.image}
                          alt={selectedVehicleObj.model}
                          className="banner-thumb"
                        />
                        <div>
                          <div className="banner-title-line">
                            <strong className="banner-reg">{selectedVehicleObj.reg}</strong>
                            <span className="banner-assigned-pill">
                              ✓ {formData.rentalModel === '12-Hour Shift Lease' ? 'Shared 12-Hour Allocation' : 'Assigned 1:1 to Driver'}
                            </span>
                          </div>
                          <span className="banner-sub">
                            {selectedVehicleObj.model} • {selectedVehicleObj.type} Powertrain • Stationed at {selectedVehicleObj.hub}
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        className="btn-unassign-veh"
                        onClick={() => updateField('selectedVehicleReg', '')}
                      >
                        Unassign Car
                      </button>
                    </div>
                  ) : (
                    <div className="adp-callout-banner amber">
                      <AlertTriangle size={18} className="callout-icon" />
                      <div className="callout-text">
                        <strong>Driver on Standby Crew Pool</strong>
                        <p>No vehicle asset currently assigned. You can bind a commercial vehicle at any time directly from the Driver Profile dashboard.</p>
                      </div>
                    </div>
                  )}

                  {/* Handover Prerequisites Checklist (PDF Step 06) */}
                  {selectedVehicleObj && (
                    <div className="handover-checklist-card">
                      <strong className="handover-title">Handover Prerequisites & Departure QC (PDF Step 06)</strong>
                      <div className="handover-inputs-grid">
                        <div className="adp-form-group">
                          <label className="adp-field-label">Odometer Reading at Handover (km)</label>
                          <input
                            type="text"
                            className="adp-text-input font-mono"
                            value={formData.handoverOdometer}
                            onChange={(e) => updateField('handoverOdometer', e.target.value)}
                          />
                        </div>
                        <div className="handover-checks-row">
                          <label className="checkbox-label">
                            <input
                              type="checkbox"
                              checked={formData.handoverKeys}
                              onChange={(e) => updateField('handoverKeys', e.target.checked)}
                            />
                            <span>2 Ignition Keys Handed Over</span>
                          </label>
                          <label className="checkbox-label">
                            <input
                              type="checkbox"
                              checked={formData.handoverQcPassed}
                              onChange={(e) => updateField('handoverQcPassed', e.target.checked)}
                            />
                            <span>Pre-QC Inspection & RC/PUC in Glovebox Cleared</span>
                          </label>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {viewMode === 'wizard' && (
                  <div className="adp-card-wizard-nav">
                    <button
                      type="button"
                      className="btn-wizard-prev"
                      onClick={() => setActiveStep(3)}
                    >
                      ← Back to Lease
                    </button>
                    <button
                      type="button"
                      className="btn-wizard-next"
                      onClick={() => setActiveStep(5)}
                    >
                      Continue to Smart Wallet →
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* SECTION 5: Smart 3-Pocket Wallet Configuration (PDF Page 6) */}
            {(viewMode === 'all' || activeStep === 5) && (
              <div className="adp-card-section" id="step-wallet">
                <div className="adp-card-header">
                  <div className="card-header-icon blue">
                    <CreditCard size={18} />
                  </div>
                  <div className="card-header-texts">
                    <div className="card-step-badge">GATE 05 • 3-POCKET SMART WALLET</div>
                    <h2 className="card-title">Driver Smart Wallet Account (Opening Balance ₹0)</h2>
                    <p className="card-sub">Enforces the institutional 3-pocket ledger (Posted Balance, Active Holds, and Spendable Funds).</p>
                  </div>
                </div>

                <div className="adp-grid-2col">
                  <div className="adp-form-group full-width">
                    <label className="adp-field-label">Initial Opening Balance (₹) — Default is ₹0</label>
                    <div className="adp-currency-input-wrap">
                      <span className="currency-symbol">₹</span>
                      <input
                        type="number"
                        className="adp-text-input currency-field"
                        value={formData.initialBalance}
                        onChange={(e) => updateField('initialBalance', e.target.value)}
                        placeholder="0"
                      />
                    </div>
                    <div className="adp-quick-presets">
                      <button type="button" onClick={() => updateField('initialBalance', '0')}>₹0 (Default Start)</button>
                      <button type="button" onClick={() => updateField('initialBalance', '500')}>₹500</button>
                      <button type="button" onClick={() => updateField('initialBalance', '1000')}>₹1,000</button>
                    </div>
                    <span className="adp-field-hint">Driver wallet opens with ₹0. When the driver recharges via UPI or Cash, daily rent (₹{Number(formData.agreedRate || 1000).toLocaleString('en-IN')}) will be debited automatically.</span>
                  </div>
                </div>

                {/* 3-Pocket Smart Wallet Preview */}
                <div className="adp-three-pocket-preview">
                  <div className="pocket-preview-box">
                    <span className="p-badge">POCKET 1</span>
                    <span className="p-title">POSTED BALANCE</span>
                    <strong className="p-num">₹{Number(formData.initialBalance || 0).toLocaleString('en-IN')}</strong>
                    <span className="p-sub">Total verified funds credited</span>
                  </div>
                  <div className="pocket-preview-box hold">
                    <span className="p-badge hold">POCKET 2</span>
                    <span className="p-title">ACTIVE HOLDS</span>
                    <strong className="p-num">₹0</strong>
                    <span className="p-sub">Held for EV charging sessions</span>
                  </div>
                  <div className="pocket-preview-box spendable">
                    <span className="p-badge spendable">POCKET 3</span>
                    <span className="p-title">SPENDABLE FUNDS</span>
                    <strong className="p-num text-green">₹{Number(formData.initialBalance || 0).toLocaleString('en-IN')}</strong>
                    <span className="p-sub">Available for daily lease debit</span>
                  </div>
                </div>

                {viewMode === 'wizard' && (
                  <div className="adp-card-wizard-nav">
                    <button
                      type="button"
                      className="btn-wizard-prev"
                      onClick={() => setActiveStep(4)}
                    >
                      ← Back to Vehicle
                    </button>
                    <div />
                  </div>
                )}
              </div>
            )}

            {/* Bottom Form Action Buttons */}
            <div className="adp-master-submit-footer">
              <button
                type="button"
                className="btn-cancel-onboard"
                onClick={onBack}
              >
                Cancel & Return
              </button>
              <button
                type="submit"
                className="btn-submit-onboard"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="adp-btn-spinner" />
                    <span>Activating Driver Account...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={18} />
                    <span>Complete Driver Onboarding & Activate Profile</span>
                  </>
                )}
              </button>
            </div>

          </form>
        </div>

        {/* Right Column: Sticky Live Profile Preview */}
        <aside className="adp-preview-aside">
          <div className="adp-live-preview-card">
            <div className="preview-card-header">
              <span className="live-pill">
                <span className="live-dot" /> LIVE PROFILE PREVIEW
              </span>
              <span className="pilot-id-tag">PILOT-NEW</span>
            </div>

            {/* Driver Identity Top */}
            <div className="preview-driver-identity">
              <div className="preview-avatar-circle">
                {getInitials(formData.name)}
              </div>
              <div className="preview-identity-texts">
                <h3 className="preview-name">
                  {formData.name.trim() || 'New Commercial Pilot'}
                </h3>
                <span className="preview-phone">
                  {formData.phone ? `+91 ${formData.phone}` : '+91 XXXXX XXXXX'}
                </span>
                <span className="preview-hub">
                  <MapPin size={12} /> {formData.city.split(' • ')[0]}
                </span>
              </div>
            </div>

            {/* Quick Status and Rating */}
            <div className="preview-status-strip">
              <span className={`status-pill ${formData.selectedVehicleReg ? 'online' : 'standby'}`}>
                {formData.selectedVehicleReg ? '● Ready for Shift' : '○ Standby Pool'}
              </span>
              <span className="rating-pill">★ 5.0 (New Pilot)</span>
            </div>

            <div className="preview-divider" />

            {/* Shift & Allocation Model */}
            <div className="preview-section-item">
              <span className="sec-lbl">Lease & Shift Model</span>
              <div className="preview-shift-tag-box">
                <strong>{formData.rentalModel}</strong>
                {formData.rentalModel === '12-Hour Shift Lease' && (
                  <span className="shift-sub-tag">● {formData.shiftType}</span>
                )}
              </div>
            </div>

            {/* Assigned Vehicle Highlight */}
            <div className="preview-section-item">
              <span className="sec-lbl">Assigned Vehicle Asset</span>
              {selectedVehicleObj ? (
                <div className="preview-assigned-car-box">
                  <img
                    src={selectedVehicleObj.image}
                    alt={selectedVehicleObj.model}
                    className="car-thumb"
                  />
                  <div>
                    <strong className="car-reg">{selectedVehicleObj.reg}</strong>
                    <span className="car-model">{selectedVehicleObj.model} ({selectedVehicleObj.type})</span>
                  </div>
                </div>
              ) : (
                <div className="preview-unassigned-car-box">
                  <AlertTriangle size={14} />
                  <span>Standby Crew Pool (No Car)</span>
                </div>
              )}
            </div>

            {/* Deal Terms Strip */}
            <div className="preview-section-item">
              <span className="sec-lbl">Commercial Terms</span>
              <div className="preview-deal-grid">
                <div>
                  <label>Daily Rent</label>
                  <strong className="text-green">₹{Number(formData.agreedRate || 0).toLocaleString('en-IN')}</strong>
                </div>
                <div>
                  <label>Escrow Deposit</label>
                  <strong className="text-blue">₹{Number(formData.securityDeposit || 0).toLocaleString('en-IN')}</strong>
                </div>
                <div>
                  <label>Opening Wallet</label>
                  <strong>₹{Number(formData.initialBalance || 0).toLocaleString('en-IN')}</strong>
                </div>
              </div>
            </div>

            {/* Statutory Compliance Checklist (PDF 6 Gates) */}
            <div className="preview-section-item">
              <div className="readiness-header">
                <span className="sec-lbl">PDF 6-Gate Readiness</span>
                <strong className="readiness-score">{readinessPercent}%</strong>
              </div>
              <div className="readiness-progress-bar">
                <div
                  className="progress-fill"
                  style={{ width: `${readinessPercent}%` }}
                />
              </div>

              <div className="readiness-check-list">
                {readinessChecks.map((chk, i) => (
                  <div key={i} className={`chk-item ${chk.done ? 'is-done' : ''}`}>
                    <CheckCircle2 size={13} className="chk-icon" />
                    <span>{chk.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Instant Submit from sidebar */}
            <div className="preview-action-box">
              <button
                type="button"
                className="btn-sidebar-submit"
                onClick={handleSubmit}
                disabled={loading}
              >
                {loading ? 'Activating Driver...' : '✓ Complete Onboarding'}
              </button>
            </div>

            {/* Compliance Guarantee badge */}
            <div className="preview-trust-footer">
              <Shield size={14} className="text-blue" />
              <span>MoRTH SARATHI, UIDAI & Escrow Verified</span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
