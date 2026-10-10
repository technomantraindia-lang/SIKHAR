import React, { useState, useEffect, useCallback } from 'react';
import {
  Car,
  Shield,
  Phone,
  CreditCard,
  CheckCircle2,
  FileText,
  AlertTriangle,
  MapPin,
  Clock,
  Activity,
  RefreshCw,
  User
} from '../common/Icons';
import {
  fetchDriverByIdApi,
  updateDriverStatusApi,
  topupDriverWalletApi,
  assignDriverVehicleApi,
  requestDriverLeaveApi
} from '../../services/api';

const AVAILABLE_CARS = [
  { reg: 'DL52GD6605', model: 'WagonR H3 CNG', type: 'CNG' },
  { reg: 'HR55BC2211', model: 'WagonR H3 CNG', type: 'CNG' },
  { reg: 'DL8CAZ7788', model: 'WagonR H3 CNG', type: 'CNG' },
  { reg: 'DL1Z08899', model: 'Tigor EV Fleet', type: 'EV' },
  { reg: 'HR38AK1234', model: 'Tigor EV Fleet', type: 'EV' },
  { reg: 'HR38AK5678', model: 'WagonR H3 CNG', type: 'CNG' },
  { reg: 'UP16HT7788', model: 'Tigor EV Fleet', type: 'EV' }
];

export default function DriverDetailPage({ driverId, onBack, onStatusUpdated }) {
  const [driver, setDriver] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [topupAmount, setTopupAmount] = useState('');
  const [isTopupLoading, setIsTopupLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // Leave Approval Modal State (PDF Page 3 & 8)
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [leaveReason, setLeaveReason] = useState('Family Leave');
  const [leaveDays, setLeaveDays] = useState(1);
  const [isLeaveLoading, setIsLeaveLoading] = useState(false);

  // Agreement Document Modal State (PDF Page 5)
  const [isAgreementModalOpen, setIsAgreementModalOpen] = useState(false);

  // Vehicle Assignment State
  const [isAssigningVehicle, setIsAssigningVehicle] = useState(false);
  const [selectedVehicleToAssign, setSelectedVehicleToAssign] = useState('');
  const [isVehicleAssignLoading, setIsVehicleAssignLoading] = useState(false);

  const handleApproveLeave = async () => {
    if (!driver) return;
    try {
      setIsLeaveLoading(true);
      const res = await requestDriverLeaveApi(driver.id, Number(leaveDays), leaveReason);
      setDriver(res.data);
      setIsLeaveModalOpen(false);
      showToast(`Leave approved for ${driver.name} (${leaveDays} days). Status set to "On Leave".`);
      if (onStatusUpdated) onStatusUpdated();
    } catch (err) {
      alert(err.message || 'Failed to approve leave request');
    } finally {
      setIsLeaveLoading(false);
    }
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3200);
  };

  const loadDriverData = useCallback(async () => {
    if (!driverId) return;
    try {
      setLoading(true);
      const res = await fetchDriverByIdApi(driverId);
      setDriver(res);
    } catch (err) {
      console.error('Failed to load driver details:', err);
    } finally {
      setLoading(false);
    }
  }, [driverId]);

  useEffect(() => {
    loadDriverData();
  }, [loadDriverData]);

  const handleStatusSwitch = async (newStatus) => {
    if (!driver) return;
    try {
      await updateDriverStatusApi(driver.id, newStatus);
      setDriver((prev) => ({ ...prev, status: newStatus }));
      showToast(`Driver status set to "${newStatus}"`);
      if (onStatusUpdated) onStatusUpdated();
    } catch (err) {
      alert(err.message || 'Failed to update status');
    }
  };

  const handleTopup = async (e) => {
    e.preventDefault();
    if (!driver || !topupAmount) return;
    try {
      setIsTopupLoading(true);
      const res = await topupDriverWalletApi(driver.id, topupAmount, 'Admin Top-Up Voucher');
      setDriver(res.data);
      setTopupAmount('');
      showToast(`₹${topupAmount} credited successfully to ${driver.name}'s wallet!`);
      if (onStatusUpdated) onStatusUpdated();
    } catch (err) {
      alert(err.message || 'Failed to credit wallet');
    } finally {
      setIsTopupLoading(false);
    }
  };

  const handleAssignVehicle = async (vehReg) => {
    if (!driver) return;
    try {
      setIsVehicleAssignLoading(true);
      const carObj = AVAILABLE_CARS.find((c) => c.reg === vehReg);
      const res = await assignDriverVehicleApi(
        driver.id,
        vehReg,
        carObj ? carObj.model : 'WagonR H3 CNG',
        carObj ? carObj.type : 'CNG'
      );
      setDriver(res.data);
      setIsAssigningVehicle(false);
      showToast(
        vehReg
          ? `Vehicle ${vehReg} successfully assigned to ${driver.name}!`
          : `Vehicle unassigned for ${driver.name} (Driver moved to Standby).`
      );
      if (onStatusUpdated) onStatusUpdated();
    } catch (err) {
      alert(err.message || 'Failed to update vehicle assignment');
    } finally {
      setIsVehicleAssignLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="driver-detail-page-container">
        <div className="driver-detail-loading-state">
          <div className="loading-spinner"></div>
          <p>Loading full driver profile & live telemetry...</p>
        </div>
      </div>
    );
  }

  if (!driver) {
    return (
      <div className="driver-detail-page-container">
        <div className="driver-detail-error-card">
          <AlertTriangle size={36} className="text-red" />
          <h3>Driver Profile Not Found</h3>
          <p>Could not load profile for driver ID: {driverId}</p>
          <button className="btn-secondary" onClick={onBack}>
            ← Back to Driver Roster
          </button>
        </div>
      </div>
    );
  }

  // Get Initials
  const initials = driver.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  // Status badge class
  const getStatusClass = (st) => {
    switch (st) {
      case 'On Duty': return 'status-badge-duty';
      case 'On Leave': return 'status-badge-leave';
      case 'Suspended': return 'status-badge-suspended';
      default: return 'status-badge-ready';
    }
  };

  return (
    <div className="driver-detail-page-container">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="driver-action-toast-float">
          <CheckCircle2 size={16} className="text-green" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Breadcrumb & Action Navigation */}
      <div className="driver-detail-top-nav-bar">
        <div className="nav-left-breadcrumb">
          <button className="btn-back-roster" onClick={onBack} title="Back to Driver Directory">
            <span className="back-arrow">←</span>
            <span>Back to Driver Directory</span>
          </button>
          <span className="breadcrumb-separator">/</span>
          <span className="breadcrumb-crumb current">
            {driver.name} <span className="crumb-id">({driver.id})</span>
          </span>
        </div>

        <div className="nav-right-actions">
          <button
            className="btn-refresh-telemetry"
            onClick={loadDriverData}
            title="Refresh Realtime Telemetry"
          >
            <RefreshCw size={14} />
            <span>Sync Live Data</span>
          </button>
          <a
            href={`tel:${driver.phone}`}
            className="btn-quick-call"
            title={`Call ${driver.phone}`}
          >
            <Phone size={14} />
            <span>Call Driver</span>
          </a>
        </div>
      </div>

      {/* Driver Master Hero Header Banner */}
      <div className="driver-detail-hero-banner">
        <div className="hero-profile-primary">
          <div className="driver-big-avatar-circle">
            <span className="avatar-initials-text">{initials}</span>
            <span className={`avatar-status-pip ${driver.status === 'On Duty' ? 'online' : 'away'}`} />
          </div>

          <div className="hero-driver-headings">
            <div className="hero-title-row">
              <h1 className="driver-hero-name">{driver.name}</h1>
              <span className={`driver-status-pill-lg ${getStatusClass(driver.status)}`}>
                <span className="duty-dot">●</span> {driver.status}
              </span>
              <span className="driver-rating-badge-lg">
                ★ {driver.rating || '4.8'} Rating
              </span>
              <span className="driver-contract-badge">
                {driver.deal?.type || 'Fixed Daily Rental'}
              </span>
            </div>

            <div className="hero-identity-meta-strip">
              <span className="meta-item">
                <Phone size={13} className="text-muted" />
                <strong>{driver.phone}</strong>
              </span>
              <span className="meta-item-dot">•</span>
              <span className="meta-item">
                <MapPin size={13} className="text-muted" />
                <span>{driver.city || 'Gurgaon Operations Hub'}</span>
              </span>
              <span className="meta-item-dot">•</span>
              <span className="meta-item">
                <Shield size={13} className="text-muted" />
                <span>DL: <strong>{driver.kyc?.drivingLicence || 'HR-2620170098765'}</strong></span>
              </span>
              <span className="meta-item-dot">•</span>
              <span className="meta-item">
                <FileText size={13} className="text-muted" />
                <span>PAN: <strong className="font-mono">{driver.kyc?.panCard || 'ABCDE1234F'}</strong></span>
              </span>
              <span className="meta-item-dot">•</span>
              <span className="meta-item">
                <Car size={13} className="text-muted" />
                <span>
                  Car:{' '}
                  <strong>{driver.vehicle ? driver.vehicle.registration : 'Unassigned'}</strong>
                </span>
              </span>
            </div>
          </div>
        </div>

        {/* Quick Status Control Bar */}
        <div className="hero-quick-status-control">
          <span className="quick-status-lbl">QUICK STATUS UPDATE:</span>
          <div className="status-toggle-pill-group">
            <button
              className={`status-btn-pill on-duty ${driver.status === 'On Duty' ? 'active' : ''}`}
              onClick={() => handleStatusSwitch('On Duty')}
            >
              On Duty
            </button>
            <button
              className={`status-btn-pill leave ${driver.status === 'On Leave' ? 'active' : ''}`}
              onClick={() => handleStatusSwitch('On Leave')}
            >
              Leave
            </button>
            <button
              className={`status-btn-pill block ${driver.status === 'Suspended' ? 'active' : ''}`}
              onClick={() => handleStatusSwitch('Suspended')}
            >
              Block
            </button>
          </div>
        </div>
      </div>

      {/* Main Tab Navigation Header */}
      <div className="driver-detail-tabs-header">
        <button
          className={`detail-tab-item ${activeTab === 'overview' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <Activity size={16} />
          <span>Overview & Telemetry</span>
        </button>

        <button
          className={`detail-tab-item ${activeTab === 'wallet' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('wallet')}
        >
          <CreditCard size={16} />
          <span>3-Pocket Smart Wallet</span>
          {driver.wallet?.postedBalance < 0 && (
            <span className="tab-pill-alert">Negative</span>
          )}
        </button>

        <button
          className={`detail-tab-item ${activeTab === 'attendance' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('attendance')}
        >
          <Clock size={16} />
          <span>Attendance & Trips</span>
        </button>

        <button
          className={`detail-tab-item ${activeTab === 'kyc' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('kyc')}
        >
          <Shield size={16} />
          <span>KYC & Commercial Deal</span>
        </button>
      </div>

      {/* Tab 1: OVERVIEW & TELEMETRY */}
      {activeTab === 'overview' && (
        <div className="driver-detail-tab-content">
          {/* Key Metric Tiles Row */}
          <div className="driver-overview-kpi-grid">
            <div className="detail-kpi-card green-accent">
              <span className="kpi-mini-lbl">TODAY'S GROSS EARNINGS</span>
              <div className="kpi-main-val-row">
                <strong className="kpi-num text-green">{driver.todayGross || '₹1,850'}</strong>
                <span className="kpi-badge-positive">+14% vs avg</span>
              </div>
              <span className="kpi-sub-desc">Total fares collected via digital meter</span>
            </div>

            <div className="detail-kpi-card blue-accent">
              <span className="kpi-mini-lbl">COMPLETED TRIPS</span>
              <div className="kpi-main-val-row">
                <strong className="kpi-num text-navy">{driver.todayTrips || 12} trips</strong>
                <span className="kpi-badge-neutral">Current Shift</span>
              </div>
              <span className="kpi-sub-desc">Zero cancellations recorded today</span>
            </div>

            <div className="detail-kpi-card purple-accent">
              <span className="kpi-mini-lbl">PUNCTUALITY SCORE</span>
              <div className="kpi-main-val-row">
                <strong className="kpi-num text-purple">{driver.attendance?.punctuality || '98%'}</strong>
                <span className="kpi-badge-positive">Grade A</span>
              </div>
              <span className="kpi-sub-desc">On-time yard check-in for past 30 shifts</span>
            </div>

            <div className="detail-kpi-card amber-accent">
              <span className="kpi-mini-lbl">SPENDABLE WALLET</span>
              <div className="kpi-main-val-row">
                <strong className={`kpi-num ${(driver.wallet?.spendableBalance || 0) < 500 ? 'text-red' : 'text-green'}`}>
                  ₹{(driver.wallet?.spendableBalance || 0).toLocaleString('en-IN')}
                </strong>
                <span className="kpi-badge-neutral">{driver.wallet?.status || 'Healthy'}</span>
              </div>
              <span className="kpi-sub-desc">Available for daily rental debit</span>
            </div>
          </div>

          {/* Split Two-Column Body */}
          <div className="overview-two-col-layout">
            {/* Left: Vehicle Assignment & Live GPS Telemetry */}
            <div className="overview-col-card">
              <div className="card-section-header flex-between">
                <div className="flex-header-left">
                  <Car size={18} className="text-blue" />
                  <h3>Assigned Commercial Asset</h3>
                </div>
                <button
                  type="button"
                  className="btn-assign-veh-pill"
                  onClick={() => {
                    setSelectedVehicleToAssign(driver.vehicle ? driver.vehicle.registration : '');
                    setIsAssigningVehicle(!isAssigningVehicle);
                  }}
                >
                  {isAssigningVehicle ? '✕ Close' : (driver.vehicle ? '⚙ Change Car' : '+ Assign Car')}
                </button>
              </div>

              {/* In-Place Vehicle Assignment Selector Drawer */}
              {isAssigningVehicle && (
                <div className="driver-assign-car-drawer">
                  <div className="drawer-title-row">
                    <strong>Select Fleet Car to Assign to {driver.name}</strong>
                    <span className="drawer-sub">Instant 1:1 asset pairing with live IoT tracking</span>
                  </div>

                  <div className="drawer-car-options-grid">
                    {AVAILABLE_CARS.map((c) => {
                      const isCurrent = driver.vehicle && driver.vehicle.registration === c.reg;
                      return (
                        <div
                          key={c.reg}
                          className={`drawer-car-option-card ${selectedVehicleToAssign === c.reg ? 'selected' : ''}`}
                          onClick={() => setSelectedVehicleToAssign(c.reg)}
                        >
                          <div className="opt-car-top">
                            <span className="opt-reg">{c.reg}</span>
                            <span className={`pill ${c.type === 'EV' ? 'blue' : 'green'}`}>{c.type}</span>
                          </div>
                          <span className="opt-model">{c.model}</span>
                          {isCurrent && <span className="opt-current-tag">● Currently Assigned</span>}
                        </div>
                      );
                    })}
                  </div>

                  <div className="drawer-actions-bar">
                    {driver.vehicle && (
                      <button
                        type="button"
                        disabled={isVehicleAssignLoading}
                        className="btn-unassign-car"
                        onClick={() => handleAssignVehicle('')}
                      >
                        Unassign (Standby)
                      </button>
                    )}
                    <button
                      type="button"
                      disabled={isVehicleAssignLoading || !selectedVehicleToAssign}
                      className="btn-confirm-assign-car"
                      onClick={() => handleAssignVehicle(selectedVehicleToAssign)}
                    >
                      {isVehicleAssignLoading ? 'Assigning...' : `✓ Pair Car: ${selectedVehicleToAssign || 'Select'}`}
                    </button>
                  </div>
                </div>
              )}

              {driver.vehicle ? (
                <div className="detail-vehicle-preview-box">
                  <div className="veh-header-badge-row">
                    <span className="veh-reg-big">{driver.vehicle.registration}</span>
                    <span className={`pill ${driver.vehicle.status === 'On Road' ? 'green' : 'orange'}`}>
                      {driver.vehicle.status || 'Active'}
                    </span>
                  </div>

                  <div className="veh-specs-details-grid">
                    <div className="spec-item">
                      <span className="spec-lbl">Make & Model</span>
                      <strong className="spec-val">{driver.vehicle.model}</strong>
                    </div>
                    <div className="spec-item">
                      <span className="spec-lbl">Fuel / Powertrain</span>
                      <strong className="spec-val">{driver.vehicle.type}</strong>
                    </div>
                    <div className="spec-item">
                      <span className="spec-lbl">Current Location</span>
                      <strong className="spec-val">{driver.location || 'Gurgaon Cyber City'}</strong>
                    </div>
                    <div className="spec-item">
                      <span className="spec-lbl">Current Shift</span>
                      <strong className="spec-val">{driver.shift}</strong>
                    </div>
                  </div>

                  <div className="veh-telemetry-status-strip">
                    <div className="telemetry-bar-row">
                      <span className="telemetry-lbl">Asset Readiness & Fuel/Battery</span>
                      <span className="telemetry-pct">85% Capacity</span>
                    </div>
                    <div className="telemetry-progress-track">
                      <div className="telemetry-progress-fill" style={{ width: '85%' }}></div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="detail-unassigned-notice">
                  <AlertTriangle size={24} className="text-orange" />
                  <p>No vehicle assigned to this driver currently. Driver is on standby list.</p>
                </div>
              )}

              {/* Emergency Contact & Address */}
              <div className="driver-contact-meta-card">
                <h4 className="meta-card-subheading">Personal & Emergency Details</h4>
                <div className="meta-detail-row">
                  <span className="meta-col-lbl">Home Address:</span>
                  <span className="meta-col-val">{driver.kyc?.address || 'Village Chakkarpur, Gurgaon'}</span>
                </div>
                <div className="meta-detail-row">
                  <span className="meta-col-lbl">Emergency Contact:</span>
                  <span className="meta-col-val text-blue font-bold">{driver.kyc?.emergencyContact || '+91 98112 34567'}</span>
                </div>
              </div>
            </div>

            {/* Right: Operational Notes & Active Shift */}
            <div className="overview-col-card">
              <div className="card-section-header">
                <FileText size={18} className="text-blue" />
                <h3>Operational Compliance & Audit Notes</h3>
              </div>

              <div className="operational-notices-container">
                <div className="notice-banner-item blue">
                  <div className="notice-icon-wrap">
                    <Shield size={18} className="text-blue" />
                  </div>
                  <div className="notice-text-wrap">
                    <strong>Zero-Bypass Escrow Active</strong>
                    <p>Security deposit of {driver.deal?.deposit} is held securely in the company escrow wallet.</p>
                  </div>
                </div>

                <div className="notice-banner-item green">
                  <div className="notice-icon-wrap">
                    <CheckCircle2 size={18} className="text-green" />
                  </div>
                  <div className="notice-text-wrap">
                    <strong>Statutory Documents Verified</strong>
                    <p>Driving Licence ({driver.kyc?.drivingLicence}) and Aadhaar biometrics are 100% authenticated.</p>
                  </div>
                </div>

                <div className="notice-banner-item amber">
                  <div className="notice-icon-wrap">
                    <Clock size={18} className="text-orange" />
                  </div>
                  <div className="notice-text-wrap">
                    <strong>Daily Shift Schedule</strong>
                    <p>{driver.shift}. Auto-debit for daily rental triggers every morning at 00:00 AM.</p>
                  </div>
                </div>
              </div>

              {/* Quick Actions Footer */}
              <div className="overview-quick-tools-footer">
                <button className="btn-driver-secondary" onClick={() => setActiveTab('wallet')}>
                  <CreditCard size={15} />
                  <span>View Full Wallet Ledger</span>
                </button>
                <button className="btn-driver-secondary" onClick={() => setActiveTab('kyc')}>
                  <Shield size={15} />
                  <span>View KYC Certificates</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: 3-POCKET SMART WALLET (Exact replica of user screenshot #2) */}
      {activeTab === 'wallet' && (
        <div className="driver-detail-tab-content">
          <div className="detail-section-white-card">
            <h3 className="section-block-title">3-Pocket Smart Wallet Balance</h3>

            {/* 3-Pocket Smart Balance Grid */}
            <div className="wallet-three-pocket-grid-lg">
              <div className="pocket-box-lg posted">
                <span className="pocket-lbl-lg">POSTED BALANCE</span>
                <strong className="pocket-val-lg">
                  ₹{(driver.wallet?.postedBalance || 0).toLocaleString('en-IN')}
                </strong>
                <span className="pocket-sub-lg">Total ledger funds</span>
              </div>

              <div className="pocket-box-lg hold">
                <span className="pocket-lbl-lg">ACTIVE HOLDS</span>
                <strong className="pocket-val-lg text-orange">
                  ₹{(driver.wallet?.activeHolds || 0).toLocaleString('en-IN')}
                </strong>
                <span className="pocket-sub-lg">EV Charging reserves</span>
              </div>

              <div className="pocket-box-lg spendable">
                <span className="pocket-lbl-lg">SPENDABLE BALANCE</span>
                <strong className="pocket-val-lg text-green">
                  ₹{(driver.wallet?.spendableBalance || 0).toLocaleString('en-IN')}
                </strong>
                <span className="pocket-sub-lg">Available for rent debit</span>
              </div>
            </div>

            {/* Credit Wallet / Issue Top-Up Voucher Form */}
            <div className="wallet-topup-container-lg">
              <h4 className="topup-form-heading">Credit Wallet / Issue Top-Up Voucher</h4>
              <form onSubmit={handleTopup} className="wallet-topup-form-lg">
                <div className="topup-input-wrapper-lg">
                  <span className="rupee-icon-box">₹</span>
                  <input
                    type="number"
                    placeholder="Enter amount (e.g. 1000)"
                    value={topupAmount}
                    onChange={(e) => setTopupAmount(e.target.value)}
                    min="50"
                    required
                    className="topup-input-field-lg"
                  />
                </div>

                <div className="preset-amount-chips">
                  {[500, 1000, 2000, 5000].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      className="preset-chip"
                      onClick={() => setTopupAmount(amt.toString())}
                    >
                      +₹{amt.toLocaleString('en-IN')}
                    </button>
                  ))}
                </div>

                <button
                  type="submit"
                  disabled={isTopupLoading || !topupAmount}
                  className="btn-add-balance-lg"
                >
                  {isTopupLoading ? 'Processing...' : 'Add Balance'}
                </button>
              </form>
            </div>

            {/* Recent Wallet Transactions Ledger */}
            <div className="wallet-ledger-container-lg">
              <div className="ledger-header-row">
                <h4 className="ledger-heading">Recent Wallet Transactions</h4>
                <span className="ledger-count-badge">
                  {driver.wallet?.recentTransactions?.length || 0} Transactions
                </span>
              </div>

              <div className="ledger-table-responsive-wrapper">
                <table className="ledger-table-lg">
                  <thead>
                    <tr>
                      <th>Date & Time</th>
                      <th>Transaction Type</th>
                      <th>Amount</th>
                      <th>Method / Reference</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {driver.wallet?.recentTransactions?.map((tx, idx) => {
                      const isCredit = tx.amount.startsWith('+');
                      return (
                        <tr key={idx} className="ledger-row">
                          <td className="tx-date-cell">{tx.date}</td>
                          <td className="tx-type-cell">
                            <strong>{tx.type}</strong>
                          </td>
                          <td className={`tx-amount-cell ${isCredit ? 'credit text-green' : 'debit text-red'}`}>
                            {tx.amount}
                          </td>
                          <td className="tx-method-cell">
                            <span className="method-pill">{tx.method}</span>
                          </td>
                          <td className="tx-status-cell">
                            <span className="pill green">{tx.status || 'Success'}</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: SHIFT ATTENDANCE & TRIPS */}
      {activeTab === 'attendance' && (
        <div className="driver-detail-tab-content">
          <div className="detail-section-white-card">
            <div className="flex-between mb-4">
              <div>
                <h3 className="section-block-title">Monthly Shift & Attendance Summary</h3>
                <p className="text-muted text-xs">Monitors daily shift sign-in, RTO rest periods, and approved leaves (PDF Page 3 & 8).</p>
              </div>
              <button
                type="button"
                className="btn-driver-secondary"
                onClick={() => setIsLeaveModalOpen(true)}
              >
                <Clock size={14} />
                <span>+ Approve Shift Leave</span>
              </button>
            </div>

            {/* Shift Assignment Tag */}
            <div className="shift-allocation-banner mb-4">
              <span className="shift-banner-label">Assigned Shift:</span>
              <strong className="shift-banner-val">{driver.shift || '07:00 AM - 07:00 PM (12-Hour Active Shift)'}</strong>
              {driver.shiftType && <span className="shift-model-pill">{driver.shiftType}</span>}
              {driver.coDriver && <span className="shift-co-driver-pill">Paired Co-Driver: {driver.coDriver}</span>}
            </div>

            <div className="attendance-stats-triplet">
              <div className="att-stat-box">
                <span className="att-stat-lbl">Present Days This Month</span>
                <strong className="att-stat-val text-green">{driver.attendance?.presentDays || 26} Days</strong>
                <span className="att-stat-sub">96.3% Duty Attendance</span>
              </div>
              <div className="att-stat-box">
                <span className="att-stat-lbl">Approved Leaves</span>
                <strong className="att-stat-val text-amber">{driver.attendance?.leaveDays || 1} Day</strong>
                <span className="att-stat-sub">Zero unexcused absences</span>
              </div>
              <div className="att-stat-box">
                <span className="att-stat-lbl">Shift Punctuality Score</span>
                <strong className="att-stat-val text-blue">{driver.attendance?.punctuality || '98%'}</strong>
                <span className="att-stat-sub">Logged in on time at yard terminal</span>
              </div>
            </div>

            <div className="trip-history-container">
              <h4 className="trips-subheading">Recent Shift Completed Trips</h4>
              <table className="ledger-table-lg">
                <thead>
                  <tr>
                    <th>Trip ID</th>
                    <th>Time</th>
                    <th>Pickup - Drop Route</th>
                    <th>Distance</th>
                    <th>Gross Fare</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><strong>#TRP-8821</strong></td>
                    <td>Today, 03:15 PM</td>
                    <td>DLF Phase 2 → IGI Airport T3, New Delhi</td>
                    <td>16.8 km</td>
                    <td className="text-green font-bold">₹420.00</td>
                    <td><span className="pill green">Completed</span></td>
                  </tr>
                  <tr>
                    <td><strong>#TRP-8820</strong></td>
                    <td>Today, 01:40 PM</td>
                    <td>Cyber Hub → Golf Course Ext Road, Gurgaon</td>
                    <td>11.4 km</td>
                    <td className="text-green font-bold">₹280.00</td>
                    <td><span className="pill green">Completed</span></td>
                  </tr>
                  <tr>
                    <td><strong>#TRP-8819</strong></td>
                    <td>Today, 11:20 AM</td>
                    <td>Sector 29 Market → MG Road Metro Station</td>
                    <td>5.2 km</td>
                    <td className="text-green font-bold">₹160.00</td>
                    <td><span className="pill green">Completed</span></td>
                  </tr>
                  <tr>
                    <td><strong>#TRP-8818</strong></td>
                    <td>Today, 09:10 AM</td>
                    <td>Udyog Vihar Phase 4 → Ambience Mall</td>
                    <td>4.7 km</td>
                    <td className="text-green font-bold">₹145.00</td>
                    <td><span className="pill green">Completed</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: KYC & COMMERCIAL DEAL (PDF Page 3, 4, 5) */}
      {activeTab === 'kyc' && (
        <div className="driver-detail-tab-content">
          <div className="detail-section-white-card">
            <div className="flex-between mb-4">
              <div>
                <h3 className="section-block-title">Commercial Lease Deal Terms & Legal Records</h3>
                <p className="text-muted text-xs">Agreement contracts, billing frequencies, escrow deposits and statutory KYC checklist.</p>
              </div>
              <button
                type="button"
                className="btn-driver-secondary"
                onClick={() => setIsAgreementModalOpen(true)}
              >
                <FileText size={14} />
                <span>View Executed Agreement (v1.0)</span>
              </button>
            </div>

            <div className="deal-terms-grid-lg">
              <div className="deal-card-lg">
                <span className="deal-card-lbl">Commercial Rental Model</span>
                <strong className="deal-card-val">{driver.deal?.type || 'Fixed Daily Rental'}</strong>
                <span className="deal-card-sub">{driver.deal?.frequency || 'Daily debit cycle at 00:00 hrs'}</span>
              </div>

              <div className="deal-card-lg">
                <span className="deal-card-lbl">Daily Rental Rate</span>
                <strong className="deal-card-val text-green">{driver.deal?.rate || '₹1,000 / day'}</strong>
                <span className="deal-card-sub">{driver.deal?.taxRule || 'GST 5% Passenger Transport'}</span>
              </div>

              <div className="deal-card-lg">
                <span className="deal-card-lbl">Security Deposit in Escrow</span>
                <strong className="deal-card-val text-blue">{driver.deal?.deposit || '₹75,000'}</strong>
                <span className="deal-card-sub">{driver.deal?.depositReceipt ? `Receipt: ${driver.deal.depositReceipt}` : 'Secured in IDFC First Escrow'}</span>
              </div>

              <div className="deal-card-lg">
                <span className="deal-card-lbl">Agreement Duration</span>
                <strong className="deal-card-val">{driver.deal?.contractMonths || 12} Months</strong>
                <span className="deal-card-sub">Started: {driver.deal?.startDate || '01 Jan 2026'}</span>
              </div>
            </div>

            <div className="statutory-kyc-container">
              <h4 className="kyc-subheading">Statutory KYC Compliance Checklist</h4>

              <div className="kyc-checklist-grid-lg">
                <div className="kyc-card-item">
                  <div className="kyc-item-header">
                    <CheckCircle2 size={18} className="text-green" />
                    <strong>Commercial Driving Licence (MoRTH Verified)</strong>
                  </div>
                  <div className="kyc-item-body">
                    <p className="kyc-val-text">{driver.kyc?.drivingLicence}</p>
                    <span className="kyc-status-badge valid">
                      Valid till {driver.kyc?.dlExpiry} • Status: {driver.kyc?.dlStatus || 'Valid'}
                    </span>
                  </div>
                </div>

                <div className="kyc-card-item">
                  <div className="kyc-item-header">
                    <CheckCircle2 size={18} className="text-green" />
                    <strong>Aadhaar Biometric Card</strong>
                  </div>
                  <div className="kyc-item-body">
                    <p className="kyc-val-text">{driver.kyc?.aadhaar}</p>
                    <span className="kyc-status-badge valid">
                      UIDAI OTP Authenticated
                    </span>
                  </div>
                </div>

                <div className="kyc-card-item">
                  <div className="kyc-item-header">
                    <CheckCircle2 size={18} className="text-green" />
                    <strong>Permanent Account Number (PAN Card)</strong>
                  </div>
                  <div className="kyc-item-body">
                    <p className="kyc-val-text font-mono">{driver.kyc?.panCard || 'ABCDE1234F'}</p>
                    <span className="kyc-status-badge valid">
                      Income Tax Dept / NSDL Verified
                    </span>
                  </div>
                </div>

                <div className="kyc-card-item">
                  <div className="kyc-item-header">
                    <CheckCircle2 size={18} className="text-green" />
                    <strong>Police Background Verification</strong>
                  </div>
                  <div className="kyc-item-body">
                    <p className="kyc-val-text">{driver.kyc?.policeVerification || 'Verified (Clear)'}</p>
                    <span className="kyc-status-badge valid">
                      Verified by Commissioner Office
                    </span>
                  </div>
                </div>

                {/* Personal Guarantor & Reference (PDF Page 3 & 5 requirement) */}
                <div className="kyc-card-item">
                  <div className="kyc-item-header">
                    <User size={18} className="text-blue" />
                    <strong>Personal Guarantor & Reference</strong>
                  </div>
                  <div className="kyc-item-body">
                    <p className="kyc-val-text">{driver.kyc?.reference?.name || 'Suresh Verma'}</p>
                    <span className="kyc-status-badge valid">
                      {driver.kyc?.reference?.relation || 'Guarantor'} • Phone: {driver.kyc?.reference?.phone || '+91 98101 88990'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: Approve Leave Dialog (PDF Page 3 & 8) */}
      {isLeaveModalOpen && (
        <div className="driver-modal-overlay-custom" onClick={() => setIsLeaveModalOpen(false)}>
          <div className="driver-modal-dialog-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-dialog-header">
              <h3>Approve Shift Leave for {driver.name}</h3>
              <button className="btn-modal-close" onClick={() => setIsLeaveModalOpen(false)}>✕</button>
            </div>
            <div className="modal-dialog-body">
              <p className="text-muted text-xs mb-3">
                Approving leave updates the attendance register, pauses daily vehicle rent debits for approved downtime (as per PDF Page 6 & 8 policy), and marks the driver status as "On Leave".
              </p>
              <div className="form-group mb-3">
                <label className="text-xs font-bold text-navy block mb-1">Leave Reason</label>
                <select
                  className="adp-select-input"
                  value={leaveReason}
                  onChange={(e) => setLeaveReason(e.target.value)}
                >
                  <option value="Family Leave">Family Leave</option>
                  <option value="Medical Rest">Medical Rest</option>
                  <option value="Festival Leave">Festival Leave</option>
                  <option value="Personal Emergency">Personal Emergency</option>
                </select>
              </div>
              <div className="form-group mb-3">
                <label className="text-xs font-bold text-navy block mb-1">Approved Leave Duration (Days)</label>
                <input
                  type="number"
                  min="1"
                  max="14"
                  className="adp-text-input"
                  value={leaveDays}
                  onChange={(e) => setLeaveDays(e.target.value)}
                />
              </div>
            </div>
            <div className="modal-dialog-footer">
              <button className="btn-driver-secondary" onClick={() => setIsLeaveModalOpen(false)}>
                Cancel
              </button>
              <button className="btn-driver-primary" onClick={handleApproveLeave} disabled={isLeaveLoading}>
                {isLeaveLoading ? 'Submitting...' : '✓ Approve Leave'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: View Executed Agreement Dialog (PDF Page 5) */}
      {isAgreementModalOpen && (
        <div className="driver-modal-overlay-custom" onClick={() => setIsAgreementModalOpen(false)}>
          <div className="driver-modal-dialog-box large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-dialog-header">
              <div>
                <h3>Master Commercial Vehicle Lease Agreement</h3>
                <span className="text-xs text-muted">Version: {driver.deal?.agreementVersion || 'v1.0 (Executed)'} • Sikhar Fleet Private Limited</span>
              </div>
              <button className="btn-modal-close" onClick={() => setIsAgreementModalOpen(false)}>✕</button>
            </div>
            <div className="modal-dialog-body agreement-preview-scroll">
              <div className="agreement-paper-box">
                <div className="agr-letterhead">
                  <strong>SIKHAR FLEET PRIVATE LIMITED</strong>
                  <span>COMMERCIAL FLEET PILOT MASTER AGREEMENT</span>
                </div>
                <div className="agr-clause">
                  <strong>1. PARTIES & ASSET ALLOCATION</strong>
                  <p>
                    This agreement is entered between <strong>Sikhar Fleet Private Limited</strong> (Lessor) and commercial pilot <strong>{driver.name}</strong> (Lessee, DL: {driver.kyc?.drivingLicence}). Asset Allocated: <strong>{driver.vehicle ? `${driver.vehicle.registration} (${driver.vehicle.model})` : 'Standby Pool Asset'}</strong>.
                  </p>
                </div>
                <div className="agr-clause">
                  <strong>2. COMMERCIAL TERMS & DEBIT CYCLE</strong>
                  <p>
                    Model: <strong>{driver.deal?.type || 'Fixed Daily Rental'}</strong>. Agreed Rate: <strong>{driver.deal?.rate || '₹1,000 / day'}</strong>. Debit frequency: {driver.deal?.frequency || 'Daily debit from Spendable Wallet at 00:00 hrs'}. Applicable GST: {driver.deal?.taxRule || '5% Commercial Passenger Transport'}.
                  </p>
                </div>
                <div className="agr-clause">
                  <strong>3. SECURITY DEPOSIT IN ESCROW</strong>
                  <p>
                    Security Deposit of <strong>{driver.deal?.deposit || '₹75,000'}</strong> is secured in the IDFC First Bank Escrow account. Receipt reference: {driver.deal?.depositReceipt || 'UTR-98218731'}.
                  </p>
                </div>
                <div className="agr-clause">
                  <strong>4. STATUTORY VERIFICATION & SIGNATURES</strong>
                  <p>
                    Execution Method: <strong>Aadhaar OTP e-Sign Authenticated</strong>. Status: <strong>Legally Binding & Active</strong>.
                  </p>
                </div>
              </div>
            </div>
            <div className="modal-dialog-footer">
              <button className="btn-driver-secondary" onClick={() => window.print()}>
                🖨 Print / Export PDF
              </button>
              <button className="btn-driver-primary" onClick={() => setIsAgreementModalOpen(false)}>
                ✓ Close Agreement View
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
