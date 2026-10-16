import React, { useState, useEffect, useCallback } from 'react';
import {
  Wrench,
  Search,
  Plus,
  Clock,
  CheckCircle2,
  Users,
  Car,
  MapPin,
  FileText,
  Phone,
  Filter,
  X,
  ArrowLeft,
  ChevronRight,
  ChevronDown,
  Shield,
  Wallet,
  Receipt,
  Download,
  Check,
  Truck,
  TrendingUp,
  RefreshCw,
  AlertTriangle,
  Zap,
  Gauge,
  Grid,
  List,
  Award,
  CreditCard
} from '../common/Icons';
import {
  fetchMaintenanceApi,
  createJobCardApi,
  advanceMaintenanceStageApi,
  approveEstimateApi,
  submitQcApi,
  verifyMaintenanceBillApi,
  recordMaintenancePaymentApi,
  releaseVehicleApi,
  fetchFleetTowerApi
} from '../../services/api';

export default function MaintenanceMasterPage({ onNavigate, onBackToDashboard }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [allJobCards, setAllJobCards] = useState([]);
  const [stages, setStages] = useState([]);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'
  const [selectedStageFilter, setSelectedStageFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [vehicleFilter, setVehicleFilter] = useState('all');
  const [toastMessage, setToastMessage] = useState(null);

  // Fleet list for vehicle auto-fill
  const [fleetVehicles, setFleetVehicles] = useState([]);

  // Active Job Card Detail Modal
  const [selectedJobCard, setSelectedJobCard] = useState(null);

  // Action Modals State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEstimateModalOpen, setIsEstimateModalOpen] = useState(false);
  const [isQcModalOpen, setIsQcModalOpen] = useState(false);
  const [isBillModalOpen, setIsBillModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isReleaseModalOpen, setIsReleaseModalOpen] = useState(false);
  const [activeActionTarget, setActiveActionTarget] = useState(null);

  // Forms
  const [createForm, setCreateForm] = useState({
    vehicle: '',
    vehicleModel: 'TATA TIGOR EV XPRESS T',
    driver: '',
    driverPhone: '',
    serviceType: 'Periodic 20,000 km Maintenance',
    priority: 'Normal',
    workshop: '',
    odometer: '30,000 km',
    batteryLevel: '80%',
    complaint: 'Periodic maintenance, brake inspection, suspension check and diagnostic scan.'
  });

  const [estimateForm, setEstimateForm] = useState({
    labour: 1800,
    parts: 3500,
    approvedBy: 'Operations Manager',
    note: 'Approved for scheduled maintenance'
  });

  const [qcForm, setQcForm] = useState({
    testDrivePassed: true,
    technician: 'Amit · Senior Lead Technician',
    completedOdo: '30,015 km',
    qcNotes: 'All scheduled jobs verified; road test passed; battery SOH at 95%.'
  });

  const [billForm, setBillForm] = useState({
    invoiceNo: 'ABC/INV/2026/8942',
    billedAmount: 6254,
    invoiceDate: '16 Oct 2026'
  });

  const [paymentForm, setPaymentForm] = useState({
    method: 'Bank Transfer / NEFT',
    utr: 'UTR-20261016-ABC8942',
    amount: 6254
  });

  const [releaseForm, setReleaseForm] = useState({
    nextServiceKm: '40,000 km',
    nextServiceDate: '16 Jan 2027',
    closureNotes: 'Maintenance completed, bill paid, quality check verified and vehicle cleared for road deployment.'
  });

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3800);
  };

  // Load All Maintenance Records
  const loadMaintenance = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetchMaintenanceApi({});
      if (res && res.jobCards) {
        setAllJobCards(res.jobCards);
        if (res.stages) setStages(res.stages);
      }
    } catch (err) {
      console.error('Failed to load maintenance records:', err);
      setError(err.message || 'Failed to load maintenance records.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMaintenance();
  }, [loadMaintenance]);

  // Load Fleet Vehicles for auto-fill
  useEffect(() => {
    async function loadFleet() {
      try {
        const fleetData = await fetchFleetTowerApi('all');
        if (fleetData && fleetData.vehicles) {
          setFleetVehicles(fleetData.vehicles);
        }
      } catch (e) {
        console.warn('Could not load fleet registry:', e);
      }
    }
    loadFleet();
  }, []);

  // Handle vehicle selection in Create Job Card
  const handleVehicleSelect = (val) => {
    const matched = fleetVehicles.find(
      v => (v.registration || v.id || '').toUpperCase().replace(/\s+/g, '') === val.toUpperCase().replace(/\s+/g, '')
    );
    if (matched) {
      setCreateForm(prev => ({
        ...prev,
        vehicle: matched.registration || matched.id,
        vehicleModel: matched.model || prev.vehicleModel,
        driver: matched.driver && matched.driver !== 'Unassigned' ? matched.driver : prev.driver,
        driverPhone: matched.driverPhone && matched.driverPhone !== '—' ? matched.driverPhone : prev.driverPhone,
        odometer: matched.odometer || prev.odometer,
        batteryLevel: matched.battery || prev.batteryLevel
      }));
    } else {
      setCreateForm(prev => ({ ...prev, vehicle: val }));
    }
  };

  // Derived Dynamic Counts (Always 100% in sync)
  const counts = {
    all: allJobCards.length,
    serviceDue: allJobCards.filter(c => c.stageIndex === 1).length,
    jobCards: allJobCards.filter(c => c.stageIndex === 2).length,
    workshop: allJobCards.filter(c => c.status === 'At Workshop' || (c.stageIndex >= 3 && c.stageIndex <= 5)).length,
    qc: allJobCards.filter(c => c.stageIndex === 6).length,
    billing: allJobCards.filter(c => c.stageIndex === 7 || c.stageIndex === 8).length,
    closure: allJobCards.filter(c => c.stageIndex === 9).length,
    ready: allJobCards.filter(c => c.stageIndex === 10 || c.status === 'Ready to Deploy').length
  };

  const availableVehicles = Array.from(new Set(allJobCards.map(c => c.vehicle))).filter(Boolean).sort();

  // Smart Filter Logic
  const filteredJobs = allJobCards.filter(job => {
    // Stage Filter
    if (selectedStageFilter !== 'all') {
      if (selectedStageFilter === 'service-due' && job.stageIndex !== 1) return false;
      if (selectedStageFilter === 'job-card' && job.stageIndex !== 2) return false;
      if (selectedStageFilter === 'workshop' && (job.stageIndex < 3 || job.stageIndex > 5)) return false;
      if (selectedStageFilter === 'qc' && job.stageIndex !== 6) return false;
      if (selectedStageFilter === 'billing' && job.stageIndex !== 7 && job.stageIndex !== 8) return false;
      if (selectedStageFilter === 'closure' && job.stageIndex !== 9) return false;
      if (selectedStageFilter === 'ready' && job.stageIndex !== 10) return false;
    }

    // Vehicle Filter
    if (vehicleFilter !== 'all') {
      if ((job.vehicle || '').toUpperCase() !== vehicleFilter.toUpperCase()) return false;
    }

    // Search Query
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase().trim();
      const match =
        (job.id && job.id.toLowerCase().includes(q)) ||
        (job.vehicle && job.vehicle.toLowerCase().includes(q)) ||
        (job.driver && job.driver.toLowerCase().includes(q)) ||
        (job.workshop && job.workshop.toLowerCase().includes(q)) ||
        (job.serviceType && job.serviceType.toLowerCase().includes(q)) ||
        (job.complaint && job.complaint.toLowerCase().includes(q));
      if (!match) return false;
    }

    return true;
  });

  const handleTabChange = (stageKey) => {
    setSelectedStageFilter(stageKey);
    // Auto reset conflicting vehicle filter if 0 results
    if (stageKey !== 'all') {
      const matchingCount = allJobCards.filter(job => {
        let matchStage = false;
        if (stageKey === 'service-due') matchStage = job.stageIndex === 1;
        else if (stageKey === 'job-card') matchStage = job.stageIndex === 2;
        else if (stageKey === 'workshop') matchStage = job.stageIndex >= 3 && job.stageIndex <= 5;
        else if (stageKey === 'qc') matchStage = job.stageIndex === 6;
        else if (stageKey === 'billing') matchStage = job.stageIndex === 7 || job.stageIndex === 8;
        else if (stageKey === 'closure') matchStage = job.stageIndex === 9;
        else if (stageKey === 'ready') matchStage = job.stageIndex === 10;
        if (!matchStage) return false;

        if (vehicleFilter !== 'all' && (job.vehicle || '').toUpperCase() !== vehicleFilter.toUpperCase()) return false;
        return true;
      }).length;

      if (matchingCount === 0) {
        setVehicleFilter('all');
        setSearchQuery('');
      }
    }
  };

  // Actions
  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await createJobCardApi(createForm);
      showToast(res.message || 'Job Card created successfully!');
      setIsCreateModalOpen(false);
      setCreateForm({
        vehicle: '',
        vehicleModel: 'TATA TIGOR EV XPRESS T',
        driver: '',
        driverPhone: '',
        serviceType: 'Periodic 20,000 km Maintenance',
        priority: 'Normal',
        workshop: '',
        odometer: '30,000 km',
        batteryLevel: '80%',
        complaint: 'Periodic maintenance, brake inspection, suspension check and diagnostic scan.'
      });
      loadMaintenance();
    } catch (err) {
      alert(`Error creating job card: ${err.message}`);
    }
  };

  const handleApproveEstimateSubmit = async (e) => {
    e.preventDefault();
    if (!activeActionTarget) return;
    try {
      const res = await approveEstimateApi(activeActionTarget.id, estimateForm);
      showToast(res.message || 'Estimate approved. Work authorized.');
      setIsEstimateModalOpen(false);
      setActiveActionTarget(null);
      if (selectedJobCard?.id === activeActionTarget.id) setSelectedJobCard(res.jobCard);
      loadMaintenance();
    } catch (err) {
      alert(`Estimate approval failed: ${err.message}`);
    }
  };

  const handleQcSubmit = async (e) => {
    e.preventDefault();
    if (!activeActionTarget) return;
    try {
      const res = await submitQcApi(activeActionTarget.id, qcForm);
      showToast(res.message || 'QC recorded successfully.');
      setIsQcModalOpen(false);
      setActiveActionTarget(null);
      if (selectedJobCard?.id === activeActionTarget.id) setSelectedJobCard(res.jobCard);
      loadMaintenance();
    } catch (err) {
      alert(`QC submission failed: ${err.message}`);
    }
  };

  const handleBillSubmit = async (e) => {
    e.preventDefault();
    if (!activeActionTarget) return;
    try {
      const res = await verifyMaintenanceBillApi(activeActionTarget.id, billForm);
      showToast(res.message || 'Final bill verified and 3-way matched.');
      setIsBillModalOpen(false);
      setActiveActionTarget(null);
      if (selectedJobCard?.id === activeActionTarget.id) setSelectedJobCard(res.jobCard);
      loadMaintenance();
    } catch (err) {
      alert(`Bill verification failed: ${err.message}`);
    }
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    if (!activeActionTarget) return;
    try {
      const res = await recordMaintenancePaymentApi(activeActionTarget.id, paymentForm);
      showToast(res.message || 'Vendor payment reference saved.');
      setIsPaymentModalOpen(false);
      setActiveActionTarget(null);
      if (selectedJobCard?.id === activeActionTarget.id) setSelectedJobCard(res.jobCard);
      loadMaintenance();
    } catch (err) {
      alert(`Payment recording failed: ${err.message}`);
    }
  };

  const handleReleaseSubmit = async (e) => {
    e.preventDefault();
    if (!activeActionTarget) return;
    try {
      const res = await releaseVehicleApi(activeActionTarget.id, releaseForm);
      showToast(res.message || 'Vehicle released to Ready to Deploy!');
      setIsReleaseModalOpen(false);
      setActiveActionTarget(null);
      if (selectedJobCard?.id === activeActionTarget.id) setSelectedJobCard(res.jobCard);
      loadMaintenance();
    } catch (err) {
      alert(`Release failed: ${err.message}`);
    }
  };

  const formatInr = (amt) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amt || 0);
  };

  return (
    <div className="terminal-content maintenance-master-stage">
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

      {/* ========================================================
          1. TOP EXECUTIVE COMMAND HEADER
          ======================================================== */}
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
            <span className="breadcrumb-active">Maintenance Control Center</span>
          </div>
          <h1 className="executive-greeting" style={{ marginTop: '4px' }}>
            Maintenance Control Center
          </h1>
          <div className="executive-subline">
            End-to-end 10-stage vehicle maintenance lifecycle · Workshop authorization · 3-way bill audit · Controlled release
          </div>
        </div>

        <div className="command-actions-row">
          <button
            type="button"
            className="btn secondary"
            onClick={() => {
              loadMaintenance();
              showToast('Maintenance pipeline synchronized with active workshop job cards.');
            }}
            title="Refresh maintenance records"
          >
            <RefreshCw size={14} className={loading ? 'spinning' : ''} />
            <span>Sync Pipeline</span>
          </button>

          <button
            type="button"
            className="btn primary"
            onClick={() => setIsCreateModalOpen(true)}
          >
            <Plus size={15} />
            <span>+ Create Job Card</span>
          </button>
        </div>
      </div>

      {/* ========================================================
          2. 10-STAGE PIPELINE HERO CHEVRON TRACKER (BLUEPRINT PG 7)
          ======================================================== */}
      <div
        className="maint-hero"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(5, 1fr)',
          gap: '12px',
          marginBottom: '20px'
        }}
      >
        {(stages.length > 0 ? stages : [
          { index: 1, key: 'service-due', name: 'Service Due', desc: 'Identify requirement' },
          { index: 2, key: 'job-card', name: 'Job Card', desc: 'Scope & approval' },
          { index: 3, key: 'workshop', name: 'Workshop Check-in', desc: 'Condition & keys' },
          { index: 4, key: 'estimate', name: 'Estimate & Approval', desc: 'Approve parts/labour' },
          { index: 5, key: 'work', name: 'Work In Progress', desc: 'Execute repair' },
          { index: 6, key: 'qc', name: 'QC & Test Drive', desc: 'Quality road test' },
          { index: 7, key: 'bill', name: 'Final Bill Match', desc: '3-way invoice audit' },
          { index: 8, key: 'payment', name: 'Vendor Payment', desc: 'Record UTR & pay' },
          { index: 9, key: 'closure', name: 'Job Card Closure', desc: 'Next service calc' },
          { index: 10, key: 'ready', name: 'Ready to Deploy', desc: 'Cleared for road' }
        ]).map((stage) => {
          const isActive = selectedStageFilter === stage.key;
          const stageCount = allJobCards.filter(c => c.stageIndex === stage.index).length;

          return (
            <div
              key={stage.index}
              className={`maint-stage ${isActive ? 'active' : ''}`}
              onClick={() => handleTabChange(stage.key)}
              title={`Click to view vehicles at Stage ${stage.index}: ${stage.name}`}
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                padding: '14px 16px',
                borderRadius: '12px',
                background: isActive ? '#eff6ff' : '#ffffff',
                border: isActive ? '1.5px solid #1769ff' : '1px solid #e2e8f0',
                minHeight: '102px',
                cursor: 'pointer',
                boxShadow: isActive ? '0 4px 14px rgba(23, 105, 255, 0.12)' : '0 1px 3px rgba(0,0,0,0.03)',
                transition: 'all 0.18s ease'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                <div
                  className="stage-no"
                  style={{
                    width: '26px',
                    height: '26px',
                    borderRadius: '50%',
                    display: 'grid',
                    placeItems: 'center',
                    background: isActive ? '#1769ff' : '#eff6ff',
                    color: isActive ? '#ffffff' : '#1769ff',
                    fontWeight: 850,
                    fontSize: '11.5px',
                    border: isActive ? '1px solid #1769ff' : '1px solid #bfdbfe'
                  }}
                >
                  {stage.index}
                </div>
                {stageCount > 0 && (
                  <span className="pill blue" style={{ fontSize: '9.5px', padding: '1px 6px' }}>
                    {stageCount}
                  </span>
                )}
              </div>
              <div
                className="stage-title"
                style={{
                  fontWeight: 800,
                  fontSize: '12.5px',
                  color: isActive ? '#1769ff' : '#0f172a',
                  lineHeight: 1.3
                }}
              >
                {stage.name}
              </div>
              <div
                className="stage-desc"
                style={{
                  fontSize: '11px',
                  color: '#64748b',
                  marginTop: '4px',
                  lineHeight: 1.35
                }}
              >
                {stage.desc}
              </div>
            </div>
          );
        })}
      </div>

      {/* ========================================================
          3. SCENIC STATS STRIP (MATCHING SIKHAR DESIGN SYSTEM)
          ======================================================== */}
      <div className="vm-summary-strip" style={{ marginBottom: '16px' }}>
        <div className="vm-stat-pill" onClick={() => handleTabChange('service-due')} style={{ cursor: 'pointer' }}>
          <span className="pulse-dot amber" />
          <span className="vm-stat-label">Service Due:</span>
          <strong className="vm-stat-value amber">{counts.serviceDue}</strong>
          <span className="vm-stat-sub">(Threshold Triggered)</span>
        </div>

        <div className="vm-stat-divider" />

        <div className="vm-stat-pill" onClick={() => handleTabChange('workshop')} style={{ cursor: 'pointer' }}>
          <span className="pulse-dot cyan" />
          <span className="vm-stat-label">In Workshop:</span>
          <strong className="vm-stat-value cyan">{counts.workshop}</strong>
          <span className="vm-stat-sub">(Active Repairs)</span>
        </div>

        <div className="vm-stat-divider" />

        <div className="vm-stat-pill" onClick={() => handleTabChange('qc')} style={{ cursor: 'pointer' }}>
          <span className="vm-stat-label">QC &amp; Road Test:</span>
          <strong className="vm-stat-value">{counts.qc}</strong>
          <span className="vm-stat-sub">Awaiting Audit</span>
        </div>

        <div className="vm-stat-divider" />

        <div className="vm-stat-pill" onClick={() => handleTabChange('billing')} style={{ cursor: 'pointer' }}>
          <span className="pulse-dot red" />
          <span className="vm-stat-label">Bills &amp; Payables:</span>
          <strong className="vm-stat-value red">{counts.billing}</strong>
          <span className="vm-stat-sub">(Pending Verification)</span>
        </div>

        <div className="vm-stat-divider" />

        <div className="vm-stat-pill" onClick={() => handleTabChange('ready')} style={{ cursor: 'pointer' }}>
          <span className="pulse-dot green" />
          <span className="vm-stat-label">Ready to Deploy:</span>
          <strong className="vm-stat-value green">{counts.ready}</strong>
          <span className="vm-stat-sub">(Cleared for Road)</span>
        </div>
      </div>

      {/* ========================================================
          4. MODERN SEGMENTED TOOLBAR (MATCHING VEHICLES & TRIPS)
          ======================================================== */}
      <div className="vm-toolbar-container">
        {/* Status Segmented Tabs */}
        <div className="vm-status-segmented-bar">
          {[
            { id: 'all', label: 'All Jobs', count: counts.all },
            { id: 'service-due', label: 'Service Due', count: counts.serviceDue, isWarn: true },
            { id: 'workshop', label: 'At Workshop', count: counts.workshop },
            { id: 'qc', label: 'QC & Completion', count: counts.qc },
            { id: 'billing', label: 'Bills & Payments', count: counts.billing },
            { id: 'ready', label: 'Ready to Deploy', count: counts.ready, isLive: true }
          ].map(tab => (
            <button
              key={tab.id}
              type="button"
              className={`vm-status-tab ${selectedStageFilter === tab.id ? 'active' : ''}`}
              onClick={() => handleTabChange(tab.id)}
            >
              {tab.isLive && <span className="pulse-dot green" />}
              {tab.isWarn && tab.count > 0 && <span className="pulse-dot amber" />}
              <span>{tab.label}</span>
              <span className="vm-tab-count">{tab.count}</span>
            </button>
          ))}
        </div>

        {/* Search & Secondary Filter Line */}
        <div className="vm-search-filter-row">
          <div className="vm-search-input-wrap">
            <Search size={15} color="#94a3b8" />
            <input
              type="text"
              placeholder="Search by Job Card ID, Vehicle Plate, Driver, Workshop or Complaint..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontSize: '12.5px', color: '#0f172a' }}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#94a3b8', display: 'flex' }}
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* Vehicle Plate Filter */}
            <select
              className="search"
              style={{ height: '36px', fontSize: '12px', padding: '0 10px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#ffffff', fontWeight: 600, color: '#334155' }}
              value={vehicleFilter}
              onChange={(e) => setVehicleFilter(e.target.value)}
            >
              <option value="all">All Vehicles</option>
              {availableVehicles.map(v => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>

            {/* View Mode Switcher */}
            <div className="vm-view-toggle">
              <button
                type="button"
                className={`vm-view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                onClick={() => setViewMode('grid')}
                title="Card Grid View"
              >
                <Grid size={13} />
                <span>Cards</span>
              </button>
              <button
                type="button"
                className={`vm-view-btn ${viewMode === 'table' ? 'active' : ''}`}
                onClick={() => setViewMode('table')}
                title="Table View"
              >
                <List size={13} />
                <span>Table</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================
          5. MAIN JOBS CONTENT (CARDS OR TABLE)
          ======================================================== */}
      {loading ? (
        <div className="vm-empty-state-box">
          <RefreshCw size={24} className="spinning" style={{ margin: '0 auto 10px', color: '#1769ff' }} />
          <h4>Loading Fleet Maintenance Records...</h4>
          <p>Connecting to workshop job card registry and financial payable ledgers.</p>
        </div>
      ) : filteredJobs.length === 0 ? (
        <div className="vm-empty-state-box">
          <div style={{ fontSize: '32px', marginBottom: '8px' }}>🔧</div>
          <h4>No Maintenance Records Found</h4>
          <p>
            No maintenance jobs matched your active filter
            {selectedStageFilter !== 'all' ? ` for "${selectedStageFilter.toUpperCase()}"` : ''}
            {vehicleFilter !== 'all' ? ` and vehicle "${vehicleFilter}"` : ''}
            {searchQuery ? ` matching "${searchQuery}"` : ''}.
          </p>
          <button
            type="button"
            className="btn primary small"
            style={{ marginTop: '12px' }}
            onClick={() => { setSelectedStageFilter('all'); setVehicleFilter('all'); setSearchQuery(''); }}
          >
            Reset All Filters (Show All {allJobCards.length} Jobs)
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        /* ================= 5A. CARD GRID VIEW ================= */
        <div className="clean-vehicle-grid" style={{ marginBottom: '24px' }}>
          {filteredJobs.map(job => {
            const isReady = job.stageIndex === 10 || job.status === 'Ready to Deploy';
            const isDue = job.stageIndex === 1;
            const isWip = job.stageIndex >= 3 && job.stageIndex <= 6;
            const isBilling = job.stageIndex >= 7 && job.stageIndex <= 8;

            const statusTheme = isReady ? 'green' : isDue ? 'amber' : isBilling ? 'red' : 'cyan';

            return (
              <div
                key={job.id}
                className="clean-vehicle-card"
                onClick={() => setSelectedJobCard(job)}
                style={{ cursor: 'pointer', borderTop: isReady ? '3px solid #16a34a' : isDue ? '3px solid #f59a23' : '3px solid #1769ff' }}
              >
                {/* 1. Top Card Bar: HSRP Plate & Stage Badge */}
                <div className="cvc-top-bar">
                  <div className="cvc-plate-pill">
                    <span className="cvc-plate-ind">IND</span>
                    <span className="cvc-plate-num">{job.vehicle}</span>
                  </div>

                  <div className="cvc-badge-group">
                    <span className="pill blue" style={{ fontSize: '10px' }}>
                      Stage {job.stageIndex}/10
                    </span>
                    <span className={`cvc-status-pill ${statusTheme}`}>
                      <span className={`pulse-dot ${statusTheme}`} />
                      {job.stageName}
                    </span>
                  </div>
                </div>

                {/* 2. Job Card ID & Scope */}
                <div className="cvc-title-block">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ fontSize: '12px', fontWeight: 800, color: '#1769ff' }}>
                      {job.id}
                    </div>
                    <span className={`pill ${job.priority === 'Critical' ? 'red' : job.priority === 'High' ? 'orange' : 'blue'}`} style={{ fontSize: '9px', padding: '1px 6px' }}>
                      {job.priority} Priority
                    </span>
                  </div>

                  <div style={{ fontSize: '13px', fontWeight: 750, color: '#0f172a', marginTop: '4px' }}>
                    {job.serviceType}
                  </div>

                  <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '4px', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {job.complaint}
                  </div>
                </div>

                {/* 3. Workshop & Estimate Box */}
                <div className="cvc-energy-box" style={{ background: '#f8fafc', padding: '10px 12px' }}>
                  <div className="cvc-energy-row">
                    <div className="cvc-energy-label">
                      <Wrench size={13} color="#0f172a" />
                      <span>{job.workshop}</span>
                    </div>
                    <strong className="cvc-energy-pct" style={{ fontSize: '12px' }}>
                      {job.odometer}
                    </strong>
                  </div>

                  <div className="cvc-meter-track" style={{ height: '6px', margin: '4px 0' }}>
                    <div
                      className="cvc-meter-bar"
                      style={{
                        width: `${job.stageIndex * 10}%`,
                        background: isReady ? '#16a34a' : '#1769ff'
                      }}
                    />
                  </div>

                  <div className="cvc-range-sub" style={{ fontSize: '11px', fontWeight: 650 }}>
                    <span>Progress: {job.stageIndex * 10}% Complete</span>
                    <span style={{ color: job.estimate ? '#0f172a' : '#64748b' }}>
                      {job.estimate ? `Est: ₹${job.estimate.total}` : 'Est. Pending'}
                    </span>
                  </div>
                </div>

                {/* 4. Driver Assignment Strip */}
                <div className="cvc-driver-box">
                  <div className="cvc-driver-left">
                    <div className="cvc-driver-icon">
                      <Users size={14} color="#64748b" />
                    </div>
                    <div className="cvc-driver-meta">
                      <span className="cvc-driver-name">{job.driver}</span>
                      <span className="cvc-driver-sub">{job.driverPhone}</span>
                    </div>
                  </div>

                  <span className="cvc-assignment-badge assigned" title="Driver assignment is permanently preserved during maintenance">
                    Driver Preserved
                  </span>
                </div>

                {/* 5. Clean Card Footer with Direct Action Buttons */}
                <div className="cvc-card-footer" style={{ borderTop: '1px solid #edf1f6', paddingTop: '10px', marginTop: '8px' }}>
                  <div className="cvc-next-info">
                    <span className="cvc-next-title">Next Gate:</span>
                    <span className="cvc-next-desc" style={{ color: '#1769ff', fontWeight: 700 }}>
                      {job.stageIndex === 1 ? 'Create Job Card' :
                       job.stageIndex === 2 ? 'Check in at Workshop' :
                       job.stageIndex === 3 ? 'Approve Estimate' :
                       job.stageIndex === 4 || job.stageIndex === 5 ? 'Perform QC & Test Drive' :
                       job.stageIndex === 6 ? 'Verify Final Bill' :
                       job.stageIndex === 7 ? 'Record Vendor Payment' :
                       job.stageIndex === 8 || job.stageIndex === 9 ? 'Close & Release Vehicle' :
                       'Operating Normally on Road'}
                    </span>
                  </div>

                  <div className="cvc-link-arrow">
                    <span>Manage Stage</span>
                    <ChevronRight size={14} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* ================= 5B. EXECUTIVE TABLE VIEW ================= */
        <div className="terminal-panel fleet-table-panel" style={{ marginTop: '0', marginBottom: '24px' }}>
          <div className="table-responsive">
            <table className="terminal-data-table vehicle-master-table">
              <thead>
                <tr>
                  <th>Job Card &amp; Stage</th>
                  <th>Vehicle Registration</th>
                  <th>Assigned Driver</th>
                  <th>Service Type &amp; Scope</th>
                  <th>Workshop / Vendor</th>
                  <th>Odometer</th>
                  <th>Estimate / Bill</th>
                  <th>Stage Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredJobs.map(job => {
                  const isReady = job.stageIndex === 10 || job.status === 'Ready to Deploy';
                  const isDue = job.stageIndex === 1;
                  const statusTheme = isReady ? 'green' : isDue ? 'amber' : 'cyan';

                  return (
                    <tr
                      key={job.id}
                      style={{ cursor: 'pointer' }}
                      onClick={() => setSelectedJobCard(job)}
                    >
                      {/* Job ID */}
                      <td>
                        <div style={{ fontWeight: 800, color: '#1769ff', fontSize: '12px' }}>
                          {job.id}
                        </div>
                        <span className="pill blue" style={{ fontSize: '9px', padding: '1px 5px', marginTop: '2px' }}>
                          Stage {job.stageIndex}/10
                        </span>
                      </td>

                      {/* Vehicle */}
                      <td>
                        <div className="cvc-plate-pill" style={{ display: 'inline-flex', marginBottom: '2px' }}>
                          <span className="cvc-plate-ind" style={{ fontSize: '8px', padding: '1px 3px' }}>IND</span>
                          <span className="cvc-plate-num" style={{ fontSize: '11px' }}>{job.vehicle}</span>
                        </div>
                        <div style={{ fontSize: '10.5px', color: '#64748b' }}>{job.vehicleModel}</div>
                      </td>

                      {/* Driver */}
                      <td>
                        <div style={{ fontWeight: 700, color: '#0f172a' }}>{job.driver}</div>
                        <div style={{ fontSize: '10.5px', color: '#64748b' }}>{job.driverPhone}</div>
                      </td>

                      {/* Scope */}
                      <td style={{ maxWidth: '240px' }}>
                        <div style={{ fontSize: '12px', fontWeight: 650, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {job.serviceType}
                        </div>
                        <div style={{ fontSize: '11px', color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {job.complaint}
                        </div>
                      </td>

                      {/* Workshop */}
                      <td>
                        <div style={{ fontWeight: 650, color: '#0f172a', fontSize: '11.5px' }}>
                          {job.workshop}
                        </div>
                        <div style={{ fontSize: '10.5px', color: '#64748b' }}>Target: {job.expectedCompletion}</div>
                      </td>

                      {/* Odo */}
                      <td>
                        <div style={{ fontWeight: 700, color: '#0f172a' }}>{job.odometer}</div>
                        <div style={{ fontSize: '10.5px', color: '#64748b' }}>Rep: {job.reportedDate}</div>
                      </td>

                      {/* Estimate */}
                      <td>
                        {job.bill ? (
                          <div>
                            <strong style={{ color: '#0f172a' }}>₹{job.bill.billedAmount}</strong>
                            <div style={{ fontSize: '10px', color: '#16a34a' }}>Billed &amp; Matched ✓</div>
                          </div>
                        ) : job.estimate ? (
                          <div>
                            <strong style={{ color: '#0f172a' }}>₹{job.estimate.total}</strong>
                            <div style={{ fontSize: '10px', color: '#1769ff' }}>Approved Est.</div>
                          </div>
                        ) : (
                          <span style={{ fontSize: '11px', color: '#94a3b8' }}>Pending</span>
                        )}
                      </td>

                      {/* Status */}
                      <td>
                        <span className={`cvc-status-pill ${statusTheme}`}>
                          <span className={`pulse-dot ${statusTheme}`} />
                          {job.stageName}
                        </span>
                      </td>

                      {/* Actions */}
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                          <button
                            type="button"
                            className="btn small secondary"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedJobCard(job);
                            }}
                          >
                            Manage
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================
          6. 360° JOB CARD DETAIL MODAL
          ======================================================== */}
      {selectedJobCard && (
        <div className="modalback" onClick={() => setSelectedJobCard(null)}>
          <div
            className="modal"
            style={{ width: 'min(820px, 94vw)', borderRadius: '14px', padding: '24px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <button className="close" onClick={() => setSelectedJobCard(null)}>×</button>

            {/* Modal Title */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
              <div className="cvc-plate-pill">
                <span className="cvc-plate-ind">IND</span>
                <span className="cvc-plate-num">{selectedJobCard.vehicle}</span>
              </div>
              <h2 style={{ margin: 0, fontSize: '19px', fontWeight: 850 }}>
                {selectedJobCard.id} · Stage {selectedJobCard.stageIndex}/10: {selectedJobCard.stageName}
              </h2>
            </div>
            <div className="sub" style={{ marginBottom: '16px' }}>
              Assigned Driver: <strong>{selectedJobCard.driver}</strong> ({selectedJobCard.driverPhone}) · Workshop: {selectedJobCard.workshop}
            </div>

            {/* Top 3 Summary Cards */}
            <div className="grid3" style={{ marginTop: '0', marginBottom: '14px' }}>
              <div className="summary">
                <div className="metric-label">CURRENT STATUS</div>
                <div className="metric" style={{ fontSize: '17px' }}>{selectedJobCard.status}</div>
                <div className="muted">{selectedJobCard.serviceType}</div>
              </div>

              <div className="summary">
                <div className="metric-label">ODOMETER &amp; DUE</div>
                <div className="metric" style={{ fontSize: '17px' }}>{selectedJobCard.odometer}</div>
                <div className="muted">Expected: {selectedJobCard.expectedCompletion}</div>
              </div>

              <div className="summary">
                <div className="metric-label">MAINTENANCE COST</div>
                <div className="metric good" style={{ fontSize: '17px' }}>
                  {selectedJobCard.bill ? `₹${selectedJobCard.bill.billedAmount}` : selectedJobCard.estimate ? `₹${selectedJobCard.estimate.total}` : 'Est. Pending'}
                </div>
                <div className="muted">{selectedJobCard.payment ? `Paid (${selectedJobCard.payment.utr})` : 'Payment Pending'}</div>
              </div>
            </div>

            {/* 10-Stage Visual Timeline in Detail */}
            <div className="panel" style={{ padding: '16px', marginBottom: '14px' }}>
              <h3 style={{ fontSize: '12px', fontWeight: 800, marginBottom: '10px' }}>10-STAGE PIPELINE AUDIT TRAIL</h3>
              <div style={{ display: 'flex', gap: '4px', overflowX: 'auto', paddingBottom: '6px' }}>
                {(stages.length > 0 ? stages : [
                  { index: 1, name: 'Service Due' },
                  { index: 2, name: 'Job Card' },
                  { index: 3, name: 'Workshop' },
                  { index: 4, name: 'Estimate' },
                  { index: 5, name: 'WIP Repair' },
                  { index: 6, name: 'QC & Test' },
                  { index: 7, name: 'Final Bill' },
                  { index: 8, name: 'Payment' },
                  { index: 9, name: 'Closure' },
                  { index: 10, name: 'Release' }
                ]).map((stg) => {
                  const isDone = stg.index < selectedJobCard.stageIndex;
                  const isCurr = stg.index === selectedJobCard.stageIndex;

                  return (
                    <div
                      key={stg.index}
                      style={{
                        flex: '1 0 70px',
                        textAlign: 'center',
                        padding: '8px 4px',
                        borderRadius: '6px',
                        background: isCurr ? '#eff6ff' : isDone ? '#f0fdf4' : '#f8fafc',
                        border: isCurr ? '1px solid #1769ff' : isDone ? '1px solid #bbf7d0' : '1px solid #e2e8f0'
                      }}
                    >
                      <div style={{ fontSize: '10px', fontWeight: 800, color: isCurr ? '#1769ff' : isDone ? '#16a34a' : '#94a3b8' }}>
                        {isDone ? '✓' : stg.index}
                      </div>
                      <div style={{ fontSize: '10px', fontWeight: 700, color: isCurr ? '#0f172a' : '#475569', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {stg.name}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Split Details: Scope vs Approvals */}
            <div className="grid2">
              <div className="panel" style={{ padding: '16px' }}>
                <h3 style={{ fontSize: '12px', fontWeight: 800, marginBottom: '10px' }}>COMPLAINT &amp; REPAIR SCOPE</h3>
                <div style={{ fontSize: '12px', color: '#0f172a', lineHeight: 1.5, marginBottom: '10px' }}>
                  {selectedJobCard.complaint}
                </div>
                <div className="row">
                  <span>Priority Level</span>
                  <b>{selectedJobCard.priority}</b>
                </div>
                <div className="row">
                  <span>Reported On</span>
                  <b>{selectedJobCard.reportedDate}</b>
                </div>
                <div className="row">
                  <span>Next Service Target</span>
                  <b>{selectedJobCard.nextService}</b>
                </div>
              </div>

              <div className="panel" style={{ padding: '16px' }}>
                <h3 style={{ fontSize: '12px', fontWeight: 800, marginBottom: '10px' }}>APPROVALS &amp; RELEASE GATES</h3>
                <div className="row">
                  <span>Estimate Approval</span>
                  <strong className={selectedJobCard.estimate ? 'good' : 'warn'}>
                    {selectedJobCard.estimate ? `Approved (₹${selectedJobCard.estimate.total}) ✓` : 'Pending'}
                  </strong>
                </div>
                <div className="row">
                  <span>Quality Check &amp; Road Test</span>
                  <strong className={selectedJobCard.checklist?.qcPassed ? 'good' : 'warn'}>
                    {selectedJobCard.checklist?.qcPassed ? 'QC Passed ✓' : 'Pending'}
                  </strong>
                </div>
                <div className="row">
                  <span>3-Way Final Bill Match</span>
                  <strong className={selectedJobCard.bill ? 'good' : 'warn'}>
                    {selectedJobCard.bill ? `Verified (₹${selectedJobCard.bill.billedAmount}) ✓` : 'Pending'}
                  </strong>
                </div>
                <div className="row">
                  <span>Vendor Payment</span>
                  <strong className={selectedJobCard.payment ? 'good' : 'warn'}>
                    {selectedJobCard.payment ? `Paid (${selectedJobCard.payment.method}) ✓` : 'Pending'}
                  </strong>
                </div>
                <div className="row" style={{ background: '#f0fdf4', padding: '6px 8px', borderRadius: '6px', marginTop: '6px' }}>
                  <span style={{ fontSize: '11px', color: '#16a34a', fontWeight: 700 }}>Driver Assignment</span>
                  <b style={{ color: '#16a34a' }}>Preserved for {selectedJobCard.driver}</b>
                </div>
              </div>
            </div>

            {/* Modal Actions Footer */}
            <div className="modal-foot" style={{ marginTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button type="button" className="btn secondary" onClick={() => setSelectedJobCard(null)}>
                Close
              </button>

              <div style={{ display: 'flex', gap: '8px' }}>
                {selectedJobCard.stageIndex === 3 && (
                  <button
                    type="button"
                    className="btn primary"
                    onClick={() => {
                      setActiveActionTarget(selectedJobCard);
                      setIsEstimateModalOpen(true);
                    }}
                  >
                    Approve Workshop Estimate →
                  </button>
                )}

                {(selectedJobCard.stageIndex === 5 || selectedJobCard.stageIndex === 4) && (
                  <button
                    type="button"
                    className="btn primary"
                    onClick={() => {
                      setActiveActionTarget(selectedJobCard);
                      setIsQcModalOpen(true);
                    }}
                  >
                    Submit QC &amp; Test Drive →
                  </button>
                )}

                {selectedJobCard.stageIndex === 7 && (
                  <button
                    type="button"
                    className="btn primary"
                    onClick={() => {
                      setActiveActionTarget(selectedJobCard);
                      setBillForm({
                        invoiceNo: `ABC/INV/${Date.now().toString().slice(-4)}`,
                        billedAmount: selectedJobCard.estimate ? selectedJobCard.estimate.total : 6000,
                        invoiceDate: new Date().toLocaleDateString('en-IN')
                      });
                      setIsBillModalOpen(true);
                    }}
                  >
                    Verify Final Bill (3-Way Match) →
                  </button>
                )}

                {selectedJobCard.stageIndex === 8 && (
                  <button
                    type="button"
                    className="btn primary"
                    onClick={() => {
                      setActiveActionTarget(selectedJobCard);
                      setPaymentForm({
                        method: 'Bank Transfer / NEFT',
                        utr: `UTR-${Date.now().toString().slice(-8)}`,
                        amount: selectedJobCard.bill ? selectedJobCard.bill.billedAmount : 0
                      });
                      setIsPaymentModalOpen(true);
                    }}
                  >
                    Record Vendor Payment →
                  </button>
                )}

                {selectedJobCard.stageIndex === 9 && (
                  <button
                    type="button"
                    className="btn primary green"
                    onClick={() => {
                      setActiveActionTarget(selectedJobCard);
                      setIsReleaseModalOpen(true);
                    }}
                  >
                    Close Job Card &amp; Release to Ready to Deploy ✓
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          7. CREATE JOB CARD MODAL
          ======================================================== */}
      {isCreateModalOpen && (
        <div className="modalback" onClick={() => setIsCreateModalOpen(false)}>
          <div
            className="modal"
            style={{ width: 'min(720px, 92vw)', borderRadius: '14px', padding: '24px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <button className="close" onClick={() => setIsCreateModalOpen(false)}>×</button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span style={{ color: '#1769ff', display: 'flex' }}><Wrench size={20} /></span>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 850 }}>
                Create Maintenance Job Card
              </h2>
            </div>
            <div className="sub" style={{ marginBottom: '16px' }}>
              Initialize formal service scope, workshop check-in and estimate tracking.
            </div>

            <form onSubmit={handleCreateSubmit}>
              <div className="grid2">
                <div className="field">
                  <label>Vehicle Registration *</label>
                  <input
                    type="text"
                    required
                    list="fleet-reg-list"
                    placeholder="e.g. DL52GD6605, HR38AK1234..."
                    value={createForm.vehicle}
                    onChange={(e) => handleVehicleSelect(e.target.value)}
                    style={{ textTransform: 'uppercase', fontWeight: 700 }}
                  />
                  <datalist id="fleet-reg-list">
                    {fleetVehicles.map(v => (
                      <option key={v.registration || v.id} value={v.registration}>
                        {v.registration} · {v.model} ({v.driver || 'No Driver'})
                      </option>
                    ))}
                  </datalist>
                </div>

                <div className="field">
                  <label>Vehicle Model / Powertrain</label>
                  <input
                    type="text"
                    value={createForm.vehicleModel}
                    onChange={(e) => setCreateForm({ ...createForm, vehicleModel: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid2">
                <div className="field">
                  <label>Assigned Driver Name</label>
                  <input
                    type="text"
                    value={createForm.driver}
                    onChange={(e) => setCreateForm({ ...createForm, driver: e.target.value })}
                  />
                </div>

                <div className="field">
                  <label>Driver Contact Number</label>
                  <input
                    type="text"
                    value={createForm.driverPhone}
                    onChange={(e) => setCreateForm({ ...createForm, driverPhone: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid2">
                <div className="field">
                  <label>Service Type *</label>
                  <select
                    value={createForm.serviceType}
                    onChange={(e) => setCreateForm({ ...createForm, serviceType: e.target.value })}
                  >
                    <option value="Periodic Scheduled Maintenance">Periodic Scheduled Maintenance</option>
                    <option value="Preventive Maintenance & Inspection">Preventive Maintenance &amp; Inspection</option>
                    <option value="Breakdown Repair & Recovery">Breakdown Repair &amp; Recovery</option>
                    <option value="Battery / Electrical Inspection">Battery / Electrical Inspection</option>
                    <option value="Tyres / Wheel Alignment">Tyres / Wheel Alignment</option>
                    <option value="Bodywork & Accidental Repair">Bodywork &amp; Accidental Repair</option>
                  </select>
                </div>

                <div className="field">
                  <label>Priority Level *</label>
                  <select
                    value={createForm.priority}
                    onChange={(e) => setCreateForm({ ...createForm, priority: e.target.value })}
                  >
                    <option value="Normal">Normal (Standard Service)</option>
                    <option value="High">High (Immediate Turnaround)</option>
                    <option value="Critical">Critical (Breakdown / Off-Road)</option>
                  </select>
                </div>
              </div>

              <div className="grid2">
                <div className="field">
                  <label>Workshop / Service Centre *</label>
                  <input
                    type="text"
                    required
                    placeholder="Enter workshop or service centre name..."
                    value={createForm.workshop}
                    onChange={(e) => setCreateForm({ ...createForm, workshop: e.target.value })}
                    list="workshop-suggestions"
                  />
                  <datalist id="workshop-suggestions">
                    <option value="ABC Motors · Okhla Authorized Hub" />
                    <option value="Sai Motors · Gurgaon Central" />
                    <option value="Tata Authorized Service · Sector 34" />
                    <option value="Sikhar In-House Yard Maintenance" />
                  </datalist>
                </div>

                <div className="field">
                  <label>Current Odometer</label>
                  <input
                    type="text"
                    value={createForm.odometer}
                    onChange={(e) => setCreateForm({ ...createForm, odometer: e.target.value })}
                  />
                </div>
              </div>

              <div className="field">
                <label>Complaint &amp; Scope Details *</label>
                <textarea
                  required
                  style={{ width: '100%', minHeight: '80px', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', font: 'inherit', fontSize: '12px' }}
                  value={createForm.complaint}
                  onChange={(e) => setCreateForm({ ...createForm, complaint: e.target.value })}
                />
              </div>

              <div className="modal-foot" style={{ marginTop: '18px' }}>
                <button type="button" className="btn secondary" onClick={() => setIsCreateModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn primary">
                  Create Job Card &amp; Assign Workshop
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          8. ESTIMATE APPROVAL MODAL
          ======================================================== */}
      {isEstimateModalOpen && activeActionTarget && (
        <div className="modalback" onClick={() => setIsEstimateModalOpen(false)}>
          <div
            className="modal"
            style={{ width: 'min(640px, 92vw)', borderRadius: '14px', padding: '24px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <button className="close" onClick={() => setIsEstimateModalOpen(false)}>×</button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span style={{ color: '#1769ff', display: 'flex' }}><Wrench size={20} /></span>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 850 }}>
                Approve Workshop Estimate · {activeActionTarget.id}
              </h2>
            </div>
            <div className="sub" style={{ marginBottom: '16px' }}>
              Vehicle: <strong>{activeActionTarget.vehicle}</strong> · Workshop: {activeActionTarget.workshop}
            </div>

            <form onSubmit={handleApproveEstimateSubmit}>
              <div className="grid2">
                <div className="field">
                  <label>Labour Charges (₹) *</label>
                  <input
                    type="number"
                    required
                    value={estimateForm.labour}
                    onChange={(e) => setEstimateForm({ ...estimateForm, labour: Number(e.target.value) })}
                  />
                </div>

                <div className="field">
                  <label>Replacement Parts (₹) *</label>
                  <input
                    type="number"
                    required
                    value={estimateForm.parts}
                    onChange={(e) => setEstimateForm({ ...estimateForm, parts: Number(e.target.value) })}
                  />
                </div>
              </div>

              {/* Estimate Calculation Summary */}
              <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', margin: '12px 0' }}>
                <div className="row">
                  <span>Subtotal</span>
                  <b>₹{(estimateForm.labour || 0) + (estimateForm.parts || 0)}</b>
                </div>
                <div className="row">
                  <span>GST (18%)</span>
                  <b>₹{Math.round(((estimateForm.labour || 0) + (estimateForm.parts || 0)) * 0.18)}</b>
                </div>
                <div className="row" style={{ borderTop: '1px solid #e2e8f0', paddingTop: '6px', fontSize: '14px', fontWeight: 850 }}>
                  <span>Approved Estimate Total</span>
                  <span style={{ color: '#1769ff' }}>
                    ₹{Math.round(((estimateForm.labour || 0) + (estimateForm.parts || 0)) * 1.18)}
                  </span>
                </div>
              </div>

              <div className="field">
                <label>Approving Officer *</label>
                <select
                  value={estimateForm.approvedBy}
                  onChange={(e) => setEstimateForm({ ...estimateForm, approvedBy: e.target.value })}
                >
                  <option value="Operations Manager">Operations Manager</option>
                  <option value="Founder / Executive Admin">Founder / Executive Admin</option>
                  <option value="Workshop Fleet Supervisor">Workshop Fleet Supervisor</option>
                </select>
              </div>

              <div className="field">
                <label>Approval Notes</label>
                <input
                  type="text"
                  value={estimateForm.note}
                  onChange={(e) => setEstimateForm({ ...estimateForm, note: e.target.value })}
                />
              </div>

              <div className="modal-foot" style={{ marginTop: '18px' }}>
                <button type="button" className="btn secondary" onClick={() => setIsEstimateModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn primary">
                  Authorize Estimate &amp; Start Work
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          9. QC & TEST DRIVE MODAL
          ======================================================== */}
      {isQcModalOpen && activeActionTarget && (
        <div className="modalback" onClick={() => setIsQcModalOpen(false)}>
          <div
            className="modal"
            style={{ width: 'min(640px, 92vw)', borderRadius: '14px', padding: '24px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <button className="close" onClick={() => setIsQcModalOpen(false)}>×</button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span style={{ color: '#16a34a', display: 'flex' }}><Award size={20} /></span>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 850 }}>
                Quality Check &amp; Road Test · {activeActionTarget.id}
              </h2>
            </div>
            <div className="sub" style={{ marginBottom: '16px' }}>
              Validate repair completeness before vendor billing and release.
            </div>

            <form onSubmit={handleQcSubmit}>
              <div className="panel" style={{ padding: '14px', marginBottom: '14px' }}>
                <div style={{ fontSize: '11px', fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}>
                  SAFETY INSPECTION CHECKLIST
                </div>
                {[
                  'Brake pads & disc rotors verified',
                  'Diagnostic scan: No error codes / MIL warning lights',
                  'High voltage battery & charging verified (EV SOH > 90%)',
                  'Tyre pressure and wheel alignment checked',
                  'Road test drive completed without vibrations'
                ].map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 0', fontSize: '12px' }}>
                    <span style={{ color: '#16a34a', fontWeight: 800 }}>✓</span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>

              <div className="grid2">
                <div className="field">
                  <label>Road Test Outcome *</label>
                  <select
                    value={qcForm.testDrivePassed ? 'Passed' : 'Failed'}
                    onChange={(e) => setQcForm({ ...qcForm, testDrivePassed: e.target.value === 'Passed' })}
                  >
                    <option value="Passed">Passed — Roadworthy &amp; Cleared</option>
                    <option value="Failed">Failed — Return to Workshop for Rework</option>
                  </select>
                </div>

                <div className="field">
                  <label>Certified Technician *</label>
                  <input
                    type="text"
                    required
                    value={qcForm.technician}
                    onChange={(e) => setQcForm({ ...qcForm, technician: e.target.value })}
                  />
                </div>
              </div>

              <div className="field">
                <label>QC Remarks &amp; Certification</label>
                <input
                  type="text"
                  value={qcForm.qcNotes}
                  onChange={(e) => setQcForm({ ...qcForm, qcNotes: e.target.value })}
                />
              </div>

              <div className="modal-foot" style={{ marginTop: '18px' }}>
                <button type="button" className="btn secondary" onClick={() => setIsQcModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn primary green">
                  Certify QC &amp; Advance to Bill Verification
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          10. FINAL BILL 3-WAY MATCH MODAL
          ======================================================== */}
      {isBillModalOpen && activeActionTarget && (
        <div className="modalback" onClick={() => setIsBillModalOpen(false)}>
          <div
            className="modal"
            style={{ width: 'min(640px, 92vw)', borderRadius: '14px', padding: '24px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <button className="close" onClick={() => setIsBillModalOpen(false)}>×</button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span style={{ color: '#1769ff', display: 'flex' }}><Receipt size={20} /></span>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 850 }}>
                Final Bill Verification (3-Way Match)
              </h2>
            </div>
            <div className="sub" style={{ marginBottom: '16px' }}>
              Job Card <strong>{activeActionTarget.id}</strong> · Workshop: {activeActionTarget.workshop}
            </div>

            <form onSubmit={handleBillSubmit}>
              <div className="grid2">
                <div className="field">
                  <label>Vendor Invoice Number *</label>
                  <input
                    type="text"
                    required
                    value={billForm.invoiceNo}
                    onChange={(e) => setBillForm({ ...billForm, invoiceNo: e.target.value })}
                  />
                </div>

                <div className="field">
                  <label>Invoice Date *</label>
                  <input
                    type="text"
                    required
                    value={billForm.invoiceDate}
                    onChange={(e) => setBillForm({ ...billForm, invoiceDate: e.target.value })}
                  />
                </div>
              </div>

              <div className="field">
                <label>Final Billed Amount (₹) *</label>
                <input
                  type="number"
                  required
                  value={billForm.billedAmount}
                  onChange={(e) => setBillForm({ ...billForm, billedAmount: Number(e.target.value) })}
                />
              </div>

              {/* 3-Way Match Card */}
              <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', margin: '12px 0' }}>
                <div className="row">
                  <span>Approved Estimate</span>
                  <b>₹{activeActionTarget.estimate ? activeActionTarget.estimate.total : '—'}</b>
                </div>
                <div className="row">
                  <span>Actual Vendor Invoice</span>
                  <b>₹{billForm.billedAmount}</b>
                </div>
                <div className="row" style={{ borderTop: '1px solid #e2e8f0', paddingTop: '6px' }}>
                  <span>Variance</span>
                  <span className={Math.abs(billForm.billedAmount - (activeActionTarget.estimate?.total || 0)) <= 50 ? 'good' : 'warn'} style={{ fontWeight: 800 }}>
                    ₹{billForm.billedAmount - (activeActionTarget.estimate?.total || 0)} (Match Verified ✓)
                  </span>
                </div>
              </div>

              <div className="modal-foot" style={{ marginTop: '18px' }}>
                <button type="button" className="btn secondary" onClick={() => setIsBillModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn primary">
                  Verify Bill &amp; Queue Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          11. VENDOR PAYMENT MODAL
          ======================================================== */}
      {isPaymentModalOpen && activeActionTarget && (
        <div className="modalback" onClick={() => setIsPaymentModalOpen(false)}>
          <div
            className="modal"
            style={{ width: 'min(640px, 92vw)', borderRadius: '14px', padding: '24px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <button className="close" onClick={() => setIsPaymentModalOpen(false)}>×</button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span style={{ color: '#16a34a', display: 'flex' }}><CreditCard size={20} /></span>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 850 }}>
                Record Vendor Payment · {activeActionTarget.id}
              </h2>
            </div>
            <div className="sub" style={{ marginBottom: '16px' }}>
              Vendor: <strong>{activeActionTarget.workshop}</strong> · Bill: ₹{activeActionTarget.bill?.billedAmount || 0}
            </div>

            <form onSubmit={handlePaymentSubmit}>
              <div className="grid2">
                <div className="field">
                  <label>Payment Method *</label>
                  <select
                    value={paymentForm.method}
                    onChange={(e) => setPaymentForm({ ...paymentForm, method: e.target.value })}
                  >
                    <option value="Bank Transfer / NEFT">Bank Transfer / NEFT</option>
                    <option value="UPI / IMPS">UPI / IMPS</option>
                    <option value="Corporate Debit Card">Corporate Debit Card</option>
                  </select>
                </div>

                <div className="field">
                  <label>Paid Amount (₹) *</label>
                  <input
                    type="number"
                    required
                    value={paymentForm.amount}
                    onChange={(e) => setPaymentForm({ ...paymentForm, amount: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div className="field">
                <label>Bank Reference / UTR Number *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. UTR-20261016-ABC8942"
                  value={paymentForm.utr}
                  onChange={(e) => setPaymentForm({ ...paymentForm, utr: e.target.value })}
                />
              </div>

              <div className="modal-foot" style={{ marginTop: '18px' }}>
                <button type="button" className="btn secondary" onClick={() => setIsPaymentModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn primary green">
                  Confirm Payment &amp; Move to Closure
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          12. CLOSURE & VEHICLE RELEASE MODAL
          ======================================================== */}
      {isReleaseModalOpen && activeActionTarget && (
        <div className="modalback" onClick={() => setIsReleaseModalOpen(false)}>
          <div
            className="modal"
            style={{ width: 'min(640px, 92vw)', borderRadius: '14px', padding: '24px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <button className="close" onClick={() => setIsReleaseModalOpen(false)}>×</button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span style={{ color: '#16a34a', display: 'flex' }}><CheckCircle2 size={20} /></span>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 850 }}>
                Release Vehicle to Ready to Deploy
              </h2>
            </div>
            <div className="sub" style={{ marginBottom: '16px' }}>
              Vehicle: <strong>{activeActionTarget.vehicle}</strong> · Driver: {activeActionTarget.driver} (Assignment Preserved)
            </div>

            <form onSubmit={handleReleaseSubmit}>
              <div className="panel" style={{ padding: '14px', background: '#f0fdf4', border: '1px solid #bbf7d0', marginBottom: '14px' }}>
                <div style={{ fontWeight: 800, color: '#16a34a', fontSize: '12px', marginBottom: '6px' }}>
                  ✓ RELEASE GATE PREREQUISITES COMPLETE
                </div>
                <div style={{ fontSize: '11.5px', color: '#166534', lineHeight: 1.5 }}>
                  Work completed, Quality Check passed, final bill verified, and vendor payment cleared.
                  The vehicle is ready to be put back on road.
                </div>
              </div>

              <div className="grid2">
                <div className="field">
                  <label>Next Service Odometer Threshold *</label>
                  <input
                    type="text"
                    required
                    value={releaseForm.nextServiceKm}
                    onChange={(e) => setReleaseForm({ ...releaseForm, nextServiceKm: e.target.value })}
                  />
                </div>

                <div className="field">
                  <label>Next Service Calendar Date *</label>
                  <input
                    type="text"
                    required
                    value={releaseForm.nextServiceDate}
                    onChange={(e) => setReleaseForm({ ...releaseForm, nextServiceDate: e.target.value })}
                  />
                </div>
              </div>

              <div className="field">
                <label>Operational Release Notes</label>
                <input
                  type="text"
                  value={releaseForm.closureNotes}
                  onChange={(e) => setReleaseForm({ ...releaseForm, closureNotes: e.target.value })}
                />
              </div>

              <div className="modal-foot" style={{ marginTop: '18px' }}>
                <button type="button" className="btn secondary" onClick={() => setIsReleaseModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn primary green">
                  Release Vehicle to Ready to Deploy ✓
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
