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
  RotateCcw,
  Edit,
  Lock,
  Unlock,
  Info,
  X
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

  // Driver Selection, Autocomplete & Data Locking State
  const [driverSearchQuery, setDriverSearchQuery] = useState('');
  const [selectedDriverId, setSelectedDriverId] = useState('');
  const [isDriverDropdownOpen, setIsDriverDropdownOpen] = useState(false);
  const [isEditingDetails, setIsEditingDetails] = useState(false);
  const [assignedVehicleSource, setAssignedVehicleSource] = useState('');

  // Form Fields
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [aadhaar, setAadhaar] = useState('');
  const [isAadhaarVerified, setIsAadhaarVerified] = useState(true);
  const [drivingLicence, setDrivingLicence] = useState('');
  const [referenceName, setReferenceName] = useState('');
  const [referencePhone, setReferencePhone] = useState('');
  const [address, setAddress] = useState('');
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

  // Driver Selection Handler
  const handleSelectDriver = useCallback((drv, fleetList = vehicles) => {
    if (!drv) return;
    setSelectedDriverId(drv.id || drv.name);
    setDriverSearchQuery(drv.name || '');
    setIsDriverDropdownOpen(false);

    // Populate Driver KYC fields
    setCustomerName(drv.name || '');
    setCustomerPhone(drv.phone || '');

    const kyc = drv.kyc || {};
    setAadhaar(kyc.aadhaar || '5421-9847-6712');
    setIsAadhaarVerified(kyc.aadhaarVerified !== false);
    setDrivingLicence(kyc.drivingLicence || 'HR-2620210044551');
    setAddress(kyc.address || drv.location || drv.city || 'Sector 31, Gurgaon, Haryana');

    if (kyc.reference && kyc.reference.name) {
      setReferenceName(kyc.reference.name);
      setReferencePhone(kyc.reference.phone || '');
    } else if (drv.altPhone) {
      setReferenceName('Emergency Contact / Alt');
      setReferencePhone(drv.altPhone);
    } else {
      setReferenceName('Suresh Verma');
      setReferencePhone('+91 98101 88990');
    }

    // Auto-fetch assigned vehicle details (Add Driver / Add Car / Vehicle Assignment)
    let assignedReg = '';
    let matchedVehObj = null;
    let source = '';

    if (drv.vehicle && drv.vehicle.registration && drv.vehicle.registration !== 'Unassigned') {
      assignedReg = drv.vehicle.registration;
      const foundInFleet = fleetList.find(
        (v) => v.registration?.toUpperCase() === assignedReg.toUpperCase()
      );
      matchedVehObj = foundInFleet || {
        registration: assignedReg,
        model: drv.vehicle.model || 'Commercial Vehicle',
        type: drv.vehicle.type || 'CNG',
        status: drv.vehicle.status || 'Assigned 1:1',
        location: drv.location || 'Gurgaon Hub',
        odometer: '18,400 km'
      };
      source = 'Assigned via Driver Profile (1:1 Vehicle Mapping)';
    } else {
      // Check fleet for any vehicle assigned to this driver
      const fleetVeh = fleetList.find(
        (v) =>
          (v.assignedDriver &&
            (v.assignedDriver.name?.toLowerCase() === drv.name?.toLowerCase() ||
              v.assignedDriver.id === drv.id)) ||
          (v.currentDriver &&
            (v.currentDriver.name?.toLowerCase() === drv.name?.toLowerCase() ||
              v.currentDriver.id === drv.id))
      );
      if (fleetVeh) {
        assignedReg = fleetVeh.registration;
        matchedVehObj = fleetVeh;
        source = 'Assigned via Vehicle Assignment Tower';
      }
    }

    if (assignedReg && matchedVehObj) {
      setSelectedVehicleReg(assignedReg);
      setSelectedVehicleObj(matchedVehObj);
      setAssignedVehicleSource(source);
    } else {
      setSelectedVehicleReg('');
      setSelectedVehicleObj(null);
      setAssignedVehicleSource('');
    }

    // Locked by default as requested
    setIsEditingDetails(false);
  }, [vehicles]);

  const handleClearDriverSelection = () => {
    setSelectedDriverId('');
    setDriverSearchQuery('');
    setCustomerName('');
    setCustomerPhone('');
    setAadhaar('');
    setDrivingLicence('');
    setReferenceName('');
    setReferencePhone('');
    setAddress('');
    setSelectedVehicleReg('');
    setSelectedVehicleObj(null);
    setAssignedVehicleSource('');
    setIsEditingDetails(true);
  };

  // Load backend data
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [leasesRes, driversRes, fleetRes] = await Promise.all([
        fetchLeasesApi('all', 'all', ''),
        fetchDriversApi('all', 'all'),
        fetchFleetTowerApi('all')
      ]);

      if (leasesRes) {
        setLeases(leasesRes.leases || (Array.isArray(leasesRes) ? leasesRes : []));
        setSummary(leasesRes.summary || {});
      }
      if (fleetRes && fleetRes.vehicles) {
        setVehicles(fleetRes.vehicles);
      }
      if (driversRes && driversRes.drivers) {
        setDrivers(driversRes.drivers);
      }
    } catch (err) {
      console.error('Failed to load rentals data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // When switching to new lease wizard, ensure first driver is populated if none selected
  useEffect(() => {
    if (activeTab === 'new' && !selectedDriverId && drivers.length > 0) {
      handleSelectDriver(drivers[0], vehicles);
    }
  }, [activeTab, selectedDriverId, drivers, vehicles, handleSelectDriver]);

  // Direct lease activation handler for Pending Activation leases
  const handleDirectActivateLease = async (leaseId) => {
    try {
      setLoading(true);
      const res = await activateLeaseApi(leaseId);
      showToast(`✅ ${res.message || 'Lease agreement activated successfully!'}`);
      await loadData();
    } catch (err) {
      console.error('Activation error:', err);
      alert(err.message || 'Failed to activate lease.');
    } finally {
      setLoading(false);
    }
  };

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

  // Filtered drivers for typeahead autocomplete
  const filteredDrivers = drivers.filter((d) => {
    if (!driverSearchQuery.trim()) return true;
    const q = driverSearchQuery.toLowerCase();
    const nameMatch = d.name && d.name.toLowerCase().includes(q);
    const phoneMatch = d.phone && d.phone.includes(q);
    const regMatch =
      d.vehicle &&
      d.vehicle.registration &&
      d.vehicle.registration.toLowerCase().includes(q);
    return nameMatch || phoneMatch || regMatch;
  });

  // Filtered leases for instant, zero-flicker search and status filtering
  const filteredLeases = leases.filter((l) => {
    if (statusFilter === 'active' && l.status !== 'Active') return false;
    if (statusFilter === 'pending' && !l.status?.toLowerCase().includes('pending')) return false;

    if (dealFilter === 'fixed' && !l.dealType?.toLowerCase().includes('fixed')) return false;
    if (dealFilter === 'revenue' && !l.dealType?.toLowerCase().includes('revenue')) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      return (
        (l.customerName && l.customerName.toLowerCase().includes(q)) ||
        (l.customerPhone && l.customerPhone.includes(q)) ||
        (l.driverName && l.driverName.toLowerCase().includes(q)) ||
        (l.vehicleRegistration && l.vehicleRegistration.toLowerCase().includes(q)) ||
        (l.vehicleModel && l.vehicleModel.toLowerCase().includes(q)) ||
        (l.id && l.id.toLowerCase().includes(q)) ||
        (l.leaseNumber && l.leaseNumber.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="terminal-content rentals-stage-container">
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
                  Pending ({leases.filter(l => l.status?.toLowerCase().includes('pending')).length})
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
          ) : filteredLeases.length === 0 ? (
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
                  {filteredLeases.map((l) => (
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
                          <span className={`fuel-type-pill ${(l.vehicleType || 'cng').toLowerCase()}`}>
                            {l.vehicleType || 'CNG'}
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
                        <strong style={{ color: '#0f172a', fontSize: '13px' }}>
                          {l.rateDisplay || (l.rateAmount ? `₹${l.rateAmount} / day` : 'Custom')}
                        </strong>
                        <div className="sub-cell-text">GST {l.taxPercent || 5}% Applicable</div>
                      </td>
                      <td>
                        <strong style={{ color: '#047857' }}>
                          ₹{Number(l.securityDeposit || 0).toLocaleString('en-IN')}
                        </strong>
                        <div className="sub-cell-text" style={{ color: '#059669' }}>
                          ✓ {l.depositStatus || 'Held in Escrow'}
                        </div>
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
                          {l.status?.toLowerCase().includes('pending') && (
                            <button
                              className="btn-action-pill primary-wallet"
                              style={{ background: '#059669', borderColor: '#059669' }}
                              onClick={() => handleDirectActivateLease(l.id)}
                              title="Activate this pending lease"
                            >
                              <CheckCircle2 size={12} />
                              <span>Activate</span>
                            </button>
                          )}
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
              {/* Driver Registry Search & Typeahead Picker */}
              <div className="driver-picker-container">
                <div className="driver-picker-header">
                  <div className="driver-picker-title-group">
                    <div className="driver-picker-icon-badge">
                      <Users size={18} color="#2563eb" />
                    </div>
                    <div>
                      <h3 className="driver-picker-title">Select Registered Driver</h3>
                      <p className="driver-picker-subtitle">
                        Type driver name to automatically fetch verified KYC documents &amp; assigned vehicle. Details are locked by default to eliminate manual re-typing.
                      </p>
                    </div>
                  </div>

                  {selectedDriverId && (
                    <div className="driver-picker-actions">
                      <button
                        type="button"
                        className="btn-text-action"
                        onClick={handleClearDriverSelection}
                      >
                        <RotateCcw size={13} />
                        <span>Clear / Select Another</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Search Input & Live Autocomplete Dropdown */}
                <div className="driver-search-typeahead-wrapper">
                  <div className="driver-search-input-box">
                    <Search size={16} color="#64748b" className="search-box-icon" />
                    <input
                      type="text"
                      className="driver-search-input"
                      value={driverSearchQuery}
                      onChange={(e) => {
                        setDriverSearchQuery(e.target.value);
                        setIsDriverDropdownOpen(true);
                      }}
                      onFocus={() => setIsDriverDropdownOpen(true)}
                      placeholder="Type driver name (e.g. Sumit, Raj Kumar, Amit, Vikas) or mobile number..."
                    />
                    {driverSearchQuery && (
                      <button
                        type="button"
                        className="search-clear-btn"
                        onClick={() => {
                          setDriverSearchQuery('');
                          setIsDriverDropdownOpen(true);
                        }}
                      >
                        ×
                      </button>
                    )}
                  </div>

                  {/* Autocomplete Suggestions Dropdown */}
                  {isDriverDropdownOpen && (
                    <div className="driver-typeahead-dropdown">
                      <div className="dropdown-header-label">
                        <span>Matching Registered Drivers ({filteredDrivers.length})</span>
                        <button
                          type="button"
                          className="dropdown-close-btn"
                          onClick={() => setIsDriverDropdownOpen(false)}
                        >
                          Close ✕
                        </button>
                      </div>
                      {filteredDrivers.length === 0 ? (
                        <div className="dropdown-empty-state">
                          <span>No registered drivers found matching "{driverSearchQuery}".</span>
                        </div>
                      ) : (
                        <div className="dropdown-items-scroll">
                          {filteredDrivers.map((d) => {
                            const isSelected = selectedDriverId === d.id || selectedDriverId === d.name;
                            const hasAssignedCar = d.vehicle && d.vehicle.registration && d.vehicle.registration !== 'Unassigned';
                            return (
                              <div
                                key={d.id || d.name}
                                className={`driver-typeahead-item ${isSelected ? 'is-active' : ''}`}
                                onClick={() => handleSelectDriver(d)}
                              >
                                <div className="driver-avatar-initial">
                                  {d.name?.charAt(0) || 'D'}
                                </div>
                                <div className="driver-item-info">
                                  <div className="driver-item-row-top">
                                    <span className="driver-name-text">{d.name}</span>
                                    <span className={`driver-status-badge ${d.status === 'On Duty' ? 'good' : 'neutral'}`}>
                                      {d.status || 'Active'}
                                    </span>
                                  </div>
                                  <div className="driver-item-row-bottom">
                                    <span className="driver-phone-text">📱 {d.phone}</span>
                                    {hasAssignedCar ? (
                                      <span className="driver-veh-assigned-pill">
                                        🚗 {d.vehicle.registration} ({d.vehicle.model || 'Car'})
                                      </span>
                                    ) : (
                                      <span className="driver-veh-unassigned-pill">
                                        ⚠️ No Vehicle Assigned
                                      </span>
                                    )}
                                  </div>
                                </div>
                                {isSelected && (
                                  <div className="driver-selected-check">
                                    <CheckCircle2 size={16} color="#059669" />
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Quick Driver Chips for 1-Click Fast Selection */}
                  <div className="driver-quick-chips-row">
                    <span className="chips-label">Quick Select:</span>
                    {drivers.slice(0, 6).map((d) => (
                      <button
                        key={d.id || d.name}
                        type="button"
                        className={`driver-chip-btn ${selectedDriverId === d.id ? 'active' : ''}`}
                        onClick={() => handleSelectDriver(d)}
                      >
                        <span>{d.name}</span>
                        {d.vehicle?.registration && d.vehicle.registration !== 'Unassigned' && (
                          <span className="chip-plate-sub">({d.vehicle.registration})</span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Admin Data Mode Banner: Locked (Read-Only) vs. Edit Mode */}
              <div className={`lease-data-lock-banner ${isEditingDetails ? 'editing-mode' : 'locked-mode'}`}>
                <div className="lock-banner-left">
                  <div className="lock-banner-icon">
                    {isEditingDetails ? <Unlock size={18} color="#d97706" /> : <Lock size={18} color="#059669" />}
                  </div>
                  <div>
                    <h4 className="lock-banner-title">
                      {isEditingDetails
                        ? 'Administrative Edit Mode Active'
                        : 'Auto-Fetched Details Locked (Direct from Registry)'}
                    </h4>
                    <p className="lock-banner-desc">
                      {isEditingDetails
                        ? 'You can now modify driver KYC or assigned vehicle details below if an error was made during initial registration.'
                        : 'Driver KYC and assigned vehicle details are populated and locked by default so no manual typing is required.'}
                    </p>
                  </div>
                </div>
                <div className="lock-banner-right">
                  {isEditingDetails ? (
                    <button
                      type="button"
                      className="btn btn-lock-save"
                      onClick={() => {
                        setIsEditingDetails(false);
                        showToast('🔒 Edits saved and locked for lease activation.');
                      }}
                    >
                      <Lock size={14} />
                      <span>Lock &amp; Save Edits</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="btn btn-unlock-edit"
                      onClick={() => setIsEditingDetails(true)}
                    >
                      <Edit size={14} />
                      <span>✏️ Edit Details</span>
                    </button>
                  )}
                </div>
              </div>

              {/* TWO COLUMN GRID: DRIVER KYC & ASSIGNED VEHICLE */}
              <div className="assignment-grid-columns">
                {/* COLUMN 1: DRIVER PROFILE & KYC */}
                <div className="assignment-section-box">
                  <div className="section-box-title">
                    <span className="step-number">1</span>
                    <h3>Customer &amp; Driver KYC Profile</h3>
                    {isEditingDetails ? (
                      <span className="badge-edit-mode">Editable</span>
                    ) : (
                      <span className="badge-locked-mode">🔒 Auto-Fetched</span>
                    )}
                  </div>

                  {isEditingDetails ? (
                    /* EDITABLE FORM */
                    <div className="editable-fields-form">
                      <div className="form-field-group">
                        <label className="input-label">Customer / Primary Lessee Full Name *</label>
                        <input
                          type="text"
                          className="styled-input-text"
                          value={customerName}
                          onChange={(e) => setCustomerName(e.target.value)}
                          placeholder="e.g. Sumit / Raj Kumar"
                          required
                        />
                      </div>

                      <div className="form-field-group">
                        <label className="input-label">Mobile Number (Primary OTP Contact) *</label>
                        <input
                          type="text"
                          className="styled-input-text font-mono"
                          value={customerPhone}
                          onChange={(e) => setCustomerPhone(e.target.value)}
                          placeholder="+91 98112 34567"
                          required
                        />
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
                  ) : (
                    /* LOCKED READ-ONLY SNAPSHOT (NO TYPING FORCED) */
                    <div className="locked-profile-snapshot">
                      <div className="locked-profile-hero">
                        <div className="locked-avatar-badge">
                          {customerName?.charAt(0) || 'D'}
                        </div>
                        <div className="locked-hero-meta">
                          <div className="locked-hero-name-row">
                            <h4 className="locked-hero-name">{customerName || 'No Driver Selected'}</h4>
                            <span className="verified-check-tag">✓ Verified Driver</span>
                          </div>
                          <div className="locked-hero-contact-row">
                            <span className="locked-phone-tag">📱 {customerPhone || 'N/A'}</span>
                            {selectedDriverId && (
                              <span className="locked-id-tag">ID: {selectedDriverId}</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="locked-fields-grid">
                        <div className="locked-field-card">
                          <span className="locked-field-label">Aadhaar Card KYC</span>
                          <div className="locked-field-val-row">
                            <span className="font-mono font-semibold">{aadhaar || 'Not on file'}</span>
                            <span className="kyc-badge-pill good">✓ UIDAI Cleared</span>
                          </div>
                        </div>

                        <div className="locked-field-card">
                          <span className="locked-field-label">Driving Licence (Commercial LMV)</span>
                          <div className="locked-field-val-row">
                            <span className="font-mono font-semibold">{drivingLicence || 'Not on file'}</span>
                            <span className="kyc-badge-pill good">✓ RTO Sarathi Valid</span>
                          </div>
                        </div>

                        <div className="locked-field-card full-span">
                          <span className="locked-field-label">Guarantor / Reference Contact</span>
                          <div className="locked-field-val-row">
                            <span className="font-semibold">{referenceName || 'Guarantor on file'}</span>
                            <span className="font-mono text-muted">{referencePhone}</span>
                          </div>
                        </div>

                        <div className="locked-field-card full-span">
                          <span className="locked-field-label">Registered Residential Address</span>
                          <p className="locked-address-text">{address || 'Registered Address in Hub Registry'}</p>
                        </div>
                      </div>

                      {/* Verification Status Badges */}
                      <div className="kyc-checklist-grid" style={{ marginTop: '12px' }}>
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
                    </div>
                  )}
                </div>

                {/* COLUMN 2: AUTO-FETCHED VEHICLE ASSIGNMENT */}
                <div className="assignment-section-box">
                  <div className="section-box-title">
                    <span className="step-number">🚗</span>
                    <h3>Assigned Vehicle Details</h3>
                    {selectedVehicleReg ? (
                      <span className="badge-assigned-source">
                        {assignedVehicleSource || 'Auto-Linked'}
                      </span>
                    ) : (
                      <span className="badge-unassigned-source">Unassigned</span>
                    )}
                  </div>

                  {isEditingDetails ? (
                    /* VEHICLE EDIT MODE */
                    <div className="editable-fields-form">
                      <div className="callout-notice-info" style={{ marginBottom: '12px' }}>
                        <Info size={16} color="#0284c7" />
                        <span>
                          You can pick a ready fleet car or correct the registration plate and model assigned to this driver.
                        </span>
                      </div>

                      <div className="form-field-group">
                        <label className="input-label">Select from Ready Fleet Vehicles</label>
                        <select
                          className="styled-input-text"
                          value={selectedVehicleReg}
                          onChange={(e) => {
                            const reg = e.target.value;
                            setSelectedVehicleReg(reg);
                            const matched = vehicles.find((v) => v.registration === reg);
                            if (matched) {
                              setSelectedVehicleObj(matched);
                            }
                            setAssignedVehicleSource('Manual Selection / Edited');
                          }}
                        >
                          <option value="">-- Choose Vehicle Plate --</option>
                          {vehicles.map((v) => (
                            <option key={v.id || v.registration} value={v.registration}>
                              {v.registration} • {v.model} ({v.type || 'CNG'}) - {v.status}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="form-field-group">
                        <label className="input-label">Vehicle Registration Number</label>
                        <input
                          type="text"
                          className="styled-input-text font-mono"
                          value={selectedVehicleReg}
                          onChange={(e) => setSelectedVehicleReg(e.target.value.toUpperCase())}
                          placeholder="e.g. HR26WG4411"
                        />
                      </div>

                      <div className="form-field-group">
                        <label className="input-label">Vehicle Model Name</label>
                        <input
                          type="text"
                          className="styled-input-text"
                          value={selectedVehicleObj?.model || ''}
                          onChange={(e) => {
                            setSelectedVehicleObj((prev) => ({
                              ...(prev || {}),
                              model: e.target.value
                            }));
                          }}
                          placeholder="e.g. Maruti WagonR Tour H3 CNG"
                        />
                      </div>
                    </div>
                  ) : (
                    /* LOCKED VEHICLE READ-ONLY SNAPSHOT */
                    <div className="locked-vehicle-snapshot">
                      {selectedVehicleReg ? (
                        <div className="locked-vehicle-card-active">
                          <div className="locked-veh-top-bar">
                            <div className="locked-veh-reg-plate">
                              {selectedVehicleReg}
                            </div>
                            <span className={`fuel-type-pill ${(selectedVehicleObj?.type || 'cng').toLowerCase()}`}>
                              {selectedVehicleObj?.type || 'CNG'}
                            </span>
                          </div>

                          <h4 className="locked-veh-model-name">
                            {selectedVehicleObj?.model || 'Commercial Vehicle'}
                          </h4>

                          <div className="locked-veh-meta-grid">
                            <div className="locked-veh-meta-item">
                              <span className="meta-item-lbl">Odometer</span>
                              <span className="meta-item-val">{selectedVehicleObj?.odometer || '18,400 km'}</span>
                            </div>
                            <div className="locked-veh-meta-item">
                              <span className="meta-item-lbl">Assigned Hub / Yard</span>
                              <span className="meta-item-val">{selectedVehicleObj?.location || 'Gurgaon Central Yard'}</span>
                            </div>
                            <div className="locked-veh-meta-item">
                              <span className="meta-item-lbl">Assignment Status</span>
                              <span className="meta-item-val text-emerald">
                                ✓ {selectedVehicleObj?.status || 'Assigned 1:1'}
                              </span>
                            </div>
                            <div className="locked-veh-meta-item">
                              <span className="meta-item-lbl">Linking Channel</span>
                              <span className="meta-item-val text-indigo">
                                Add Driver / Assignment Tower
                              </span>
                            </div>
                          </div>

                          <div className="locked-veh-guarantee-note">
                            <Car size={15} color="#059669" />
                            <span>
                              Auto-fetched from Driver Assignment. This car is automatically locked &amp; reserved for this commercial lease contract.
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="locked-veh-unassigned-card">
                          <Car size={32} color="#94a3b8" />
                          <h4 className="unassigned-title">No Car Currently Assigned to Driver</h4>
                          <p className="unassigned-desc">
                            This driver does not have a linked car in the Driver Profile or Vehicle Assignment tower yet.
                          </p>
                          <div className="unassigned-options-row">
                            <button
                              type="button"
                              className="btn secondary btn-sm"
                              onClick={() => setIsEditingDetails(true)}
                            >
                              ✏️ Assign Car Here
                            </button>
                            <span className="unassigned-or">or</span>
                            <span className="unassigned-hint">Select from Ready Inventory in Step 3</span>
                          </div>
                        </div>
                      )}

                      <div className="callout-notice-info" style={{ marginTop: '16px' }}>
                        <Shield size={16} color="#0284c7" />
                        <span>
                          All driver documents and assigned vehicle data verified against Sikhar Fleet Registry. Ready to proceed to commercial lease contracting.
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="assignment-submit-bar">
                <span className="dispatch-summary-text">
                  Step 1 of 5: Customer identity &amp; assigned vehicle verified. Ready to configure commercial deal terms.
                </span>
                <button
                  type="button"
                  className="btn primary"
                  onClick={() => {
                    if (!customerName.trim()) {
                      alert('Please select or enter a Customer / Driver name.');
                      return;
                    }
                    setWizardStep(2);
                  }}
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

                {selectedVehicleReg && (
                  <div
                    className="callout-notice-success"
                    style={{
                      marginBottom: '14px',
                      background: '#ecfdf5',
                      border: '1px solid #a7f3d0',
                      borderRadius: '8px',
                      padding: '10px 14px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      color: '#065f46',
                      fontSize: '12.5px'
                    }}
                  >
                    <CheckCircle2 size={16} color="#059669" />
                    <span>
                      <strong>Pre-Selected Vehicle:</strong> Plate <code>{selectedVehicleReg}</code> ({selectedVehicleObj?.model || 'Commercial Vehicle'}) was auto-fetched from driver assignment in Step 1. It is pre-reserved for this contract. You can keep it or select another vehicle below.
                    </span>
                  </div>
                )}

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
                          {isSelected && (
                            <span className="selected-tag-badge">
                              ✓ Reserved {assignedVehicleSource ? '(Auto-Linked)' : ''}
                            </span>
                          )}
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
                    <strong style={{ color: '#047857' }}>
                      ₹{Number(inspectLease.securityDeposit || 0).toLocaleString('en-IN')} (Held in Escrow)
                    </strong>
                  </div>
                  <div className="summary-row">
                    <span>Agreement Version:</span>
                    <strong>{inspectLease.agreementVersion || 'v1.0 (Draft)'}</strong>
                  </div>
                  <div className="summary-row">
                    <span>Operational Status:</span>
                    <span className={`status-pill ${inspectLease.status === 'Active' ? 'good' : 'warn'}`}>
                      {inspectLease.status}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="clean-modal-footer">
              <button className="btn secondary" onClick={() => setInspectLease(null)}>Close</button>
              {inspectLease.status?.toLowerCase().includes('pending') && (
                <button
                  className="btn primary"
                  style={{ background: '#059669', borderColor: '#059669' }}
                  onClick={() => {
                    const id = inspectLease.id;
                    setInspectLease(null);
                    handleDirectActivateLease(id);
                  }}
                >
                  <CheckCircle2 size={14} />
                  <span>Activate Lease Now</span>
                </button>
              )}
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
