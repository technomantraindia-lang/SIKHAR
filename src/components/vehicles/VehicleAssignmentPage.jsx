import React, { useState, useEffect, useCallback } from 'react';
import {
  Car,
  Users,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Search,
  Plus,
  RefreshCw,
  ArrowRight,
  ArrowLeftRight,
  RotateCcw,
  Shield,
  ChevronRight,
  Info,
  X
} from '../common/Icons';
import {
  fetchDriversApi,
  fetchFleetTowerApi,
  fetchAssignmentsApi,
  createAssignmentApi,
  revertAssignmentApi,
  extendAssignmentApi
} from '../../services/api';

export default function VehicleAssignmentPage({ onNavigateToAllVehicles, onNavigateToAddVehicle, onBackToDashboard }) {
  const [loading, setLoading] = useState(true);
  const [drivers, setDrivers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [activeAssignments, setActiveAssignments] = useState([]);
  const [assignmentHistory, setAssignmentHistory] = useState([]);
  const [toastMessage, setToastMessage] = useState(null);

  // Tab View: 'active' | 'new' | 'history'
  const [activeTab, setActiveTab] = useState('active');

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all'); // 'all' | 'temporary' | 'permanent'

  // Form State for New Assignment / Swap
  const [selectedDriverId, setSelectedDriverId] = useState('');
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [assignmentType, setAssignmentType] = useState('temporary'); // 'temporary' | 'permanent'
  const [durationDays, setDurationDays] = useState(2); // default 2 days as in user example!
  const [customEndDate, setCustomEndDate] = useState('');
  const [oldVehicleAction, setOldVehicleAction] = useState('yard_reserve'); // 'yard_reserve' | 'workshop'
  const [reason, setReason] = useState('VIP Corporate 7-Seater Duty');
  const [customReason, setCustomReason] = useState('');
  const [notes, setNotes] = useState('');
  const [startOdometer, setStartOdometer] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Revert / Return Modal State
  const [revertTarget, setRevertTarget] = useState(null);
  const [returnKm, setReturnKm] = useState('');
  const [returnNotes, setReturnNotes] = useState('Duty concluded successfully. Handover verified.');
  const [isReverting, setIsReverting] = useState(false);

  // Extend Modal State
  const [extendTarget, setExtendTarget] = useState(null);
  const [extendDays, setExtendDays] = useState(1);
  const [isExtending, setIsExtending] = useState(false);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3800);
  };

  // Load all necessary fleet & driver data
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [driversRes, fleetRes, asgRes] = await Promise.all([
        fetchDriversApi('all', 'all'),
        fetchFleetTowerApi('all'),
        fetchAssignmentsApi()
      ]);

      if (driversRes && driversRes.drivers) {
        setDrivers(driversRes.drivers);
      }
      if (fleetRes && fleetRes.vehicles) {
        setVehicles(fleetRes.vehicles);
      }
      if (asgRes) {
        setActiveAssignments(asgRes.activeAssignments || []);
        setAssignmentHistory(asgRes.history || []);
      }
    } catch (err) {
      console.error('Failed to load assignment center data:', err);
      showToast('⚠️ Notice: Could not sync some records with local server.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // When driver is selected, prefill current vehicle details
  const selectedDriver = drivers.find(d => d.id === selectedDriverId);
  const selectedVehicle = vehicles.find(v => v.id === selectedVehicleId || v.registration === selectedVehicleId);

  // Auto-fill odometer when target vehicle changes
  useEffect(() => {
    if (selectedVehicle && selectedVehicle.odometer) {
      setStartOdometer(selectedVehicle.odometer);
    }
  }, [selectedVehicle]);

  // Calculate return date preview
  const getCalculatedEndDate = () => {
    if (customEndDate) return customEndDate;
    const now = new Date();
    const end = new Date(now.getTime() + (Number(durationDays) || 2) * 24 * 60 * 60 * 1000);
    return end.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) + ' · 06:00 PM';
  };

  // Submit New Assignment
  const handleCreateAssignment = async (e) => {
    e.preventDefault();
    if (!selectedDriverId) {
      alert('Please select a driver.');
      return;
    }
    if (!selectedVehicleId) {
      alert('Please select a target vehicle to assign.');
      return;
    }

    try {
      setIsSubmitting(true);
      const finalReason = reason === 'Other' && customReason.trim() ? customReason : reason;
      const payload = {
        driverId: selectedDriverId,
        newVehicleId: selectedVehicleId,
        assignmentType,
        durationDays: assignmentType === 'temporary' ? Number(durationDays) || 2 : 0,
        startDate: new Date().toISOString(),
        endDate: customEndDate ? new Date(customEndDate).toISOString() : undefined,
        oldVehicleAction,
        reason: finalReason,
        notes: notes || `Assigned ${selectedVehicle?.model || selectedVehicleId} to ${selectedDriver?.name || 'driver'} for ${durationDays} days.`,
        startOdometer: startOdometer || selectedVehicle?.odometer || '0 km'
      };

      const res = await createAssignmentApi(payload);
      showToast(`✅ ${res.message || 'Vehicle successfully assigned!'}`);

      // Reset form
      setSelectedDriverId('');
      setSelectedVehicleId('');
      setNotes('');
      setCustomReason('');
      setActiveTab('active');
      loadData();
    } catch (err) {
      console.error('Assignment submission error:', err);
      alert(err.message || 'Failed to process vehicle assignment.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Revert / Return
  const handleExecuteRevert = async () => {
    if (!revertTarget) return;
    try {
      setIsReverting(true);
      const res = await revertAssignmentApi(revertTarget.id, returnKm, returnNotes);
      showToast(`✅ ${res.message || 'Vehicle assignment reverted.'}`);
      setRevertTarget(null);
      setReturnKm('');
      loadData();
    } catch (err) {
      console.error('Revert error:', err);
      alert(err.message || 'Failed to revert vehicle assignment.');
    } finally {
      setIsReverting(false);
    }
  };

  // Handle Extend
  const handleExecuteExtend = async () => {
    if (!extendTarget) return;
    try {
      setIsExtending(true);
      const res = await extendAssignmentApi(extendTarget.id, Number(extendDays) || 1, '', 'Administrative duty extension');
      showToast(`✅ ${res.message || 'Duration extended.'}`);
      setExtendTarget(null);
      loadData();
    } catch (err) {
      console.error('Extend error:', err);
      alert(err.message || 'Failed to extend duration.');
    } finally {
      setIsExtending(false);
    }
  };

  // Filtered active assignments
  const filteredActive = activeAssignments.filter(a => {
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      const match =
        a.driverName?.toLowerCase().includes(q) ||
        a.driverPhone?.toLowerCase().includes(q) ||
        a.assignedVehicle?.registration?.toLowerCase().includes(q) ||
        a.assignedVehicle?.model?.toLowerCase().includes(q) ||
        a.originalVehicle?.registration?.toLowerCase().includes(q) ||
        a.reason?.toLowerCase().includes(q);
      if (!match) return false;
    }
    if (filterType !== 'all') {
      if (a.assignmentType !== filterType) return false;
    }
    return true;
  });

  // Calculate quick stats
  const tempCount = activeAssignments.filter(a => a.assignmentType === 'temporary').length;
  const yardAvailableCount = vehicles.filter(v => v.status === 'Ready to Deploy' || v.driver === 'Unassigned').length;

  return (
    <div className="terminal-content vehicle-assignment-stage">
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
            <span className="breadcrumb-link" onClick={() => onNavigateToAllVehicles && onNavigateToAllVehicles()}>Vehicles</span>
            <ChevronRight size={13} className="breadcrumb-sep" />
            <span className="breadcrumb-active">Vehicle Assignment &amp; Allocation</span>
          </div>
          <h1 className="executive-greeting" style={{ marginTop: '4px' }}>
            Driver-Vehicle Allocation &amp; Duty Swaps
          </h1>
          <div className="executive-subline">
            Assign vehicles to drivers · Temporary duty reallocations (e.g. 2-Day Ertiga Duty) · Auto-restore original cars · Gate pass logs
          </div>
        </div>

        <div className="command-actions-row">
          <button
            className={`btn ${activeTab === 'new' ? 'secondary' : 'primary'}`}
            onClick={() => setActiveTab(activeTab === 'new' ? 'active' : 'new')}
          >
            {activeTab === 'new' ? <ArrowLeftRight size={15} /> : <Plus size={15} />}
            <span>{activeTab === 'new' ? 'View Active Allocations' : 'New Assignment / Swap'}</span>
          </button>
          <button
            className="btn secondary"
            onClick={loadData}
            title="Refresh assignments & fleet telemetry"
          >
            <RefreshCw size={15} />
            <span>Sync Records</span>
          </button>
        </div>
      </div>

      {/* Vehicles Section Sub-Navigation Tabs */}
      <div className="sikhar-vehicle-subnav-bar">
        <button
          className="vehicle-subnav-pill"
          onClick={() => onNavigateToAllVehicles && onNavigateToAllVehicles()}
        >
          <Car size={16} />
          <span>All Vehicles (Directory)</span>
          <span className="subnav-pill-count">{vehicles.length}</span>
        </button>

        <button
          className="vehicle-subnav-pill is-active"
          onClick={() => setActiveTab('active')}
        >
          <ArrowLeftRight size={16} />
          <span>Driver Vehicle Allocation</span>
          <span className="subnav-pill-badge-active">{activeAssignments.length} Active</span>
        </button>

        <button
          className="vehicle-subnav-pill"
          onClick={() => onNavigateToAddVehicle && onNavigateToAddVehicle()}
        >
          <Plus size={15} />
          <span>Onboard Vehicle</span>
        </button>
      </div>

      {/* Metric Highlight Cards */}
      <div className="assignment-stats-strip">
        <div className="assignment-stat-card">
          <div className="stat-card-top">
            <span className="stat-card-label">ACTIVE DUTY ALLOCATIONS</span>
            <div className="stat-icon-bubble blue">
              <ArrowLeftRight size={16} />
            </div>
          </div>
          <div className="stat-card-val">{activeAssignments.length}</div>
          <div className="stat-card-subline">
            <span className="subline-highlight">{tempCount} Temporary</span> · {activeAssignments.length - tempCount} Permanent
          </div>
        </div>

        <div className="assignment-stat-card">
          <div className="stat-card-top">
            <span className="stat-card-label">READY IN YARD FOR ALLOCATION</span>
            <div className="stat-icon-bubble green">
              <Car size={16} />
            </div>
          </div>
          <div className="stat-card-val">{yardAvailableCount}</div>
          <div className="stat-card-subline">
            Available spares ready to dispatch instantly
          </div>
        </div>

        <div className="assignment-stat-card">
          <div className="stat-card-top">
            <span className="stat-card-label">TOTAL REGISTERED DRIVERS</span>
            <div className="stat-icon-bubble purple">
              <Users size={16} />
            </div>
          </div>
          <div className="stat-card-val">{drivers.length}</div>
          <div className="stat-card-subline">
            {drivers.filter(d => d.vehicle).length} Currently assigned · {drivers.filter(d => !d.vehicle).length} Yard standby
          </div>
        </div>

        <div className="assignment-stat-card">
          <div className="stat-card-top">
            <span className="stat-card-label">COMPLETED DUTY SWAPS</span>
            <div className="stat-icon-bubble amber">
              <Clock size={16} />
            </div>
          </div>
          <div className="stat-card-val">{assignmentHistory.length}</div>
          <div className="stat-card-subline">
            Full audit history with return km &amp; sign-off
          </div>
        </div>
      </div>

      {/* Main Mode View */}
      {activeTab === 'new' ? (
        /* ========================================================
           NEW ASSIGNMENT / DUTY SWAP FORM
           ======================================================== */
        <div className="assignment-wizard-container">
          <div className="wizard-header-banner">
            <div className="wizard-header-left">
              <div className="wizard-badge">EXECUTIVE DISPATCH WORKFLOW</div>
              <h2 className="wizard-title">Assign or Temporarily Swap Vehicle</h2>
              <p className="wizard-desc">
                Select a driver (e.g. <strong>Sumit</strong>), review their current vehicle (<strong>WagonR</strong>), choose the new vehicle (<strong>Ertiga</strong>), and specify the allocation duration (<strong>2 Days</strong>). The system automatically tracks the temporary period and restores the original car upon completion.
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

          <form onSubmit={handleCreateAssignment} className="assignment-form-body">
            {/* Step 1 & 2 Dual Column: Driver & Target Car */}
            <div className="assignment-grid-columns">
              {/* Left Column: Driver Selection & Current State */}
              <div className="assignment-section-box">
                <div className="section-box-title">
                  <span className="step-number">1</span>
                  <h3>Select Driver</h3>
                </div>

                <div className="form-field-group">
                  <label className="input-label">Select Driver to Reassign / Dispatch *</label>
                  <select
                    className="styled-input-select"
                    value={selectedDriverId}
                    onChange={(e) => setSelectedDriverId(e.target.value)}
                    required
                  >
                    <option value="">-- Choose Driver from Registry --</option>
                    {drivers.map(d => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.phone}) — {d.vehicle ? `Current: ${d.vehicle.model} [${d.vehicle.registration}]` : 'No vehicle assigned'}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Driver Snapshot Card */}
                {selectedDriver ? (
                  <div className="driver-live-snapshot-card">
                    <div className="snapshot-header">
                      <div className="driver-avatar-circle">
                        {selectedDriver.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="driver-header-meta">
                        <div className="snapshot-name">{selectedDriver.name}</div>
                        <div className="snapshot-phone">📱 {selectedDriver.phone} · ⭐ {selectedDriver.rating} Rating</div>
                      </div>
                      <span className={`status-pill ${selectedDriver.status === 'On Duty' ? 'good' : 'blue'}`}>
                        {selectedDriver.status}
                      </span>
                    </div>

                    <div className="snapshot-vehicle-details">
                      <div className="snapshot-field-label">CURRENT ASSIGNED VEHICLE</div>
                      {selectedDriver.vehicle ? (
                        <div className="current-veh-box">
                          <div className="veh-box-top">
                            <span className="veh-reg-plate">{selectedDriver.vehicle.registration}</span>
                            <span className="veh-type-tag">{selectedDriver.vehicle.type || 'CNG'}</span>
                          </div>
                          <div className="veh-model-name">{selectedDriver.vehicle.model}</div>
                          <div className="veh-sub-stats">
                            <span>Status: {selectedDriver.vehicle.status || 'Assigned'}</span>
                            <span>Daily Rent: {selectedDriver.deal?.rate || '₹1,000 / day'}</span>
                          </div>
                        </div>
                      ) : (
                        <div className="no-veh-alert">
                          <Info size={15} />
                          <span>No vehicle currently attached. This will be an initial assignment.</span>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="select-placeholder-box">
                    <Users size={32} color="#64748b" />
                    <p>Select a driver from the dropdown to preview their current vehicle and profile details.</p>
                  </div>
                )}
              </div>

              {/* Right Column: Target Vehicle Selection */}
              <div className="assignment-section-box">
                <div className="section-box-title">
                  <span className="step-number">2</span>
                  <h3>Select Target Vehicle</h3>
                </div>

                <div className="form-field-group">
                  <label className="input-label">Select Vehicle to Assign *</label>
                  <select
                    className="styled-input-select"
                    value={selectedVehicleId}
                    onChange={(e) => setSelectedVehicleId(e.target.value)}
                    required
                  >
                    <option value="">-- Choose Vehicle from Fleet --</option>
                    <optgroup label="Ready in Yard / Available Fleet">
                      {vehicles
                        .filter(v => v.status === 'Ready to Deploy' || v.driver === 'Unassigned')
                        .map(v => (
                          <option key={v.id} value={v.id}>
                            {v.registration} — {v.model} ({v.type}) [{v.location || 'Central Yard'}]
                          </option>
                        ))}
                    </optgroup>
                    <optgroup label="Other Vehicles in Fleet">
                      {vehicles
                        .filter(v => v.status !== 'Ready to Deploy' && v.driver !== 'Unassigned')
                        .map(v => (
                          <option key={v.id} value={v.id}>
                            {v.registration} — {v.model} (Currently with: {v.driver})
                          </option>
                        ))}
                    </optgroup>
                  </select>
                </div>

                {/* Target Vehicle Snapshot Card */}
                {selectedVehicle ? (
                  <div className="vehicle-live-snapshot-card">
                    <div className="snapshot-header">
                      <div className="veh-icon-circle">
                        <Car size={20} color="#0284c7" />
                      </div>
                      <div className="driver-header-meta">
                        <div className="snapshot-name">{selectedVehicle.model}</div>
                        <div className="veh-reg-badge">{selectedVehicle.registration}</div>
                      </div>
                      <span className={`status-pill ${selectedVehicle.status === 'Ready to Deploy' ? 'good' : 'warn'}`}>
                        {selectedVehicle.status}
                      </span>
                    </div>

                    <div className="veh-specs-grid">
                      <div className="spec-tile">
                        <span className="spec-label">POWERTRAIN</span>
                        <span className="spec-val">{selectedVehicle.type}</span>
                      </div>
                      <div className="spec-tile">
                        <span className="spec-label">ODOMETER</span>
                        <span className="spec-val">{selectedVehicle.odometer || '18,400 km'}</span>
                      </div>
                      <div className="spec-tile">
                        <span className="spec-label">BATTERY / FUEL</span>
                        <span className="spec-val">{selectedVehicle.battery || '100%'}</span>
                      </div>
                      <div className="spec-tile">
                        <span className="spec-label">CURRENT LOCATION</span>
                        <span className="spec-val">{selectedVehicle.location || 'Sikhar Central Yard'}</span>
                      </div>
                    </div>

                    {selectedVehicle.driver && selectedVehicle.driver !== 'Unassigned' && (
                      <div className="warning-callout">
                        <AlertTriangle size={15} color="#eab308" />
                        <span>Warning: Vehicle currently attached to {selectedVehicle.driver}. Reassigning will swap their vehicle.</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="select-placeholder-box">
                    <Car size={32} color="#64748b" />
                    <p>Select a vehicle (e.g. <strong>Ertiga DL01ER2026</strong>) to inspect odometer, battery/fuel, and yard location.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Step 3: Assignment Mode & Duration Configuration (The core requested logic!) */}
            <div className="assignment-section-box full-width">
              <div className="section-box-title">
                <span className="step-number">3</span>
                <h3>Assignment Duration &amp; Operational Mode</h3>
              </div>

              {/* Mode Toggle: Temporary Duty vs Permanent */}
              <div className="assignment-type-toggle-row">
                <button
                  type="button"
                  className={`type-toggle-btn ${assignmentType === 'temporary' ? 'is-selected' : ''}`}
                  onClick={() => setAssignmentType('temporary')}
                >
                  <div className="toggle-btn-left">
                    <Clock size={18} />
                    <div className="toggle-btn-text">
                      <strong>Temporary Allocation / Duty Swap</strong>
                      <span>Assign for specific days (e.g. 2 Days Ertiga for VIP duty). Reverts back to original car when done.</span>
                    </div>
                  </div>
                  {assignmentType === 'temporary' && <span className="selected-checkmark">✓ Recommended</span>}
                </button>

                <button
                  type="button"
                  className={`type-toggle-btn ${assignmentType === 'permanent' ? 'is-selected' : ''}`}
                  onClick={() => setAssignmentType('permanent')}
                >
                  <div className="toggle-btn-left">
                    <Shield size={18} />
                    <div className="toggle-btn-text">
                      <strong>Permanent Contract Reassignment</strong>
                      <span>Permanently updates primary contract car. Will not schedule automatic return to previous vehicle.</span>
                    </div>
                  </div>
                  {assignmentType === 'permanent' && <span className="selected-checkmark">✓ Selected</span>}
                </button>
              </div>

              {/* Duration Presets (Visible when Temporary) */}
              {assignmentType === 'temporary' && (
                <div className="duration-picker-subpanel">
                  <label className="input-label">Select Allocation Duration *</label>
                  <div className="duration-chips-grid">
                    {[
                      { days: 1, label: '1 Day', sub: '24-Hour Duty' },
                      { days: 2, label: '2 Days (User Request)', sub: '48-Hour Duty' },
                      { days: 3, label: '3 Days', sub: 'Extended Duty' },
                      { days: 7, label: '7 Days', sub: 'Weekly Contract' }
                    ].map(item => (
                      <button
                        key={item.days}
                        type="button"
                        className={`duration-chip-card ${durationDays === item.days && !customEndDate ? 'is-active' : ''}`}
                        onClick={() => {
                          setDurationDays(item.days);
                          setCustomEndDate('');
                        }}
                      >
                        <span className="chip-days">{item.label}</span>
                        <span className="chip-sub">{item.sub}</span>
                      </button>
                    ))}
                  </div>

                  {/* Calculated Schedule Preview */}
                  <div className="schedule-preview-strip">
                    <div className="schedule-meta-col">
                      <span className="sched-label">EFFECTIVE START</span>
                      <span className="sched-val">Today (Immediate Dispatch)</span>
                    </div>
                    <ArrowRight size={18} color="#64748b" />
                    <div className="schedule-meta-col">
                      <span className="sched-label">SCHEDULED RETURN TO YARD</span>
                      <span className="sched-val highlight-blue">{getCalculatedEndDate()}</span>
                    </div>
                    <div className="schedule-meta-col">
                      <span className="sched-label">TOTAL DURATION</span>
                      <span className="sched-val">{durationDays} Days</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Step 4: Old Vehicle Handling & Reason */}
            <div className="assignment-grid-columns">
              {/* Old Vehicle Action */}
              <div className="assignment-section-box">
                <div className="section-box-title">
                  <span className="step-number">4</span>
                  <h3>Original Vehicle Handling</h3>
                </div>
                <div className="form-field-group">
                  <label className="input-label">What should happen to {selectedDriver?.name || 'Driver'}'s current vehicle?</label>
                  <div className="old-car-action-radios">
                    <label className={`radio-card ${oldVehicleAction === 'yard_reserve' ? 'is-selected' : ''}`}>
                      <input
                        type="radio"
                        name="oldCarAction"
                        value="yard_reserve"
                        checked={oldVehicleAction === 'yard_reserve'}
                        onChange={() => setOldVehicleAction('yard_reserve')}
                      />
                      <div>
                        <strong>Keep in Yard Inventory (Reserve)</strong>
                        <span>Vehicle stays in Central Yard ready as relief spare or for driver's return.</span>
                      </div>
                    </label>

                    <label className={`radio-card ${oldVehicleAction === 'workshop' ? 'is-selected' : ''}`}>
                      <input
                        type="radio"
                        name="oldCarAction"
                        value="workshop"
                        checked={oldVehicleAction === 'workshop'}
                        onChange={() => setOldVehicleAction('workshop')}
                      />
                      <div>
                        <strong>Send to Workshop for Maintenance</strong>
                        <span>Moves previous car to "At Workshop" for periodic maintenance or repair.</span>
                      </div>
                    </label>
                  </div>
                </div>
              </div>

              {/* Reason & Meter Reading */}
              <div className="assignment-section-box">
                <div className="section-box-title">
                  <span className="step-number">5</span>
                  <h3>Duty Reason &amp; Dispatch Reading</h3>
                </div>

                <div className="form-field-group">
                  <label className="input-label">Operational Assignment Reason *</label>
                  <select
                    className="styled-input-select"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                  >
                    <option value="VIP Corporate 7-Seater Duty">VIP Corporate 7-Seater Duty (e.g. Ertiga MPV)</option>
                    <option value="WagonR Under Routine Service">WagonR Under Routine Service / Inspection</option>
                    <option value="Outstation Highway Long-Trip">Outstation Highway Long-Trip Duty</option>
                    <option value="Airport Multi-Luggage Duty">Airport Multi-Luggage Duty</option>
                    <option value="Temporary Relief Driver Assignment">Temporary Relief Driver Assignment</option>
                    <option value="Other">Other Custom Reason</option>
                  </select>
                </div>

                {reason === 'Other' && (
                  <div className="form-field-group">
                    <label className="input-label">Specify Reason</label>
                    <input
                      type="text"
                      className="styled-input-text"
                      placeholder="e.g. Special festival weekend booking"
                      value={customReason}
                      onChange={(e) => setCustomReason(e.target.value)}
                      required
                    />
                  </div>
                )}

                <div className="form-field-group">
                  <label className="input-label">Dispatch Odometer Reading (KM)</label>
                  <input
                    type="text"
                    className="styled-input-text"
                    placeholder="e.g. 18,400 km"
                    value={startOdometer}
                    onChange={(e) => setStartOdometer(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Step 5: Remarks & Action Buttons */}
            <div className="assignment-submit-bar">
              <div className="dispatch-summary-text">
                {selectedDriver && selectedVehicle ? (
                  <span>
                    Ready to assign <strong>{selectedVehicle.model} ({selectedVehicle.registration})</strong> to <strong>{selectedDriver.name}</strong> for <strong>{durationDays} Days</strong>.
                  </span>
                ) : (
                  <span>Please select both driver and target vehicle to proceed.</span>
                )}
              </div>

              <div className="submit-btn-row">
                <button
                  type="button"
                  className="btn secondary"
                  onClick={() => setActiveTab('active')}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn primary"
                  disabled={!selectedDriverId || !selectedVehicleId || isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw size={15} className="spin-icon" />
                      <span>Dispatching Vehicle...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={15} />
                      <span>Confirm &amp; Dispatch Vehicle</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      ) : activeTab === 'history' ? (
        /* ========================================================
           HISTORY AUDIT LOGS
           ======================================================== */
        <div className="assignment-history-panel">
          <div className="panel-sub-header">
            <div>
              <h3>Completed Assignment &amp; Duty Swap Logs</h3>
              <p>Full historical record of vehicle handovers, durations, return odometers, and restore timestamps.</p>
            </div>
            <button className="btn secondary" onClick={() => setActiveTab('active')}>
              <ArrowLeftRight size={14} />
              <span>Back to Active Allocations</span>
            </button>
          </div>

          {assignmentHistory.length === 0 ? (
            <div className="empty-state-box">
              <Clock size={36} color="#64748b" />
              <p>No past completed assignments found yet.</p>
            </div>
          ) : (
            <div className="table-wrapper">
              <table className="enterprise-table">
                <thead>
                  <tr>
                    <th>Ref ID</th>
                    <th>Driver</th>
                    <th>Assigned Vehicle</th>
                    <th>Original Vehicle</th>
                    <th>Duration</th>
                    <th>Reason</th>
                    <th>Returned At</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {assignmentHistory.map(h => (
                    <tr key={h.id}>
                      <td className="mono-text">{h.id}</td>
                      <td>
                        <strong>{h.driverName}</strong>
                        <div className="sub-cell-text">{h.driverPhone}</div>
                      </td>
                      <td>
                        <span className="veh-reg-badge">{h.assignedVehicle?.registration}</span>
                        <div className="sub-cell-text">{h.assignedVehicle?.model}</div>
                      </td>
                      <td>
                        {h.originalVehicle ? (
                          <>
                            <span className="mono-text">{h.originalVehicle.registration}</span>
                            <div className="sub-cell-text">{h.originalVehicle.model}</div>
                          </>
                        ) : '—'}
                      </td>
                      <td>{h.durationDays ? `${h.durationDays} Days` : 'Permanent'}</td>
                      <td>{h.reason || 'Duty Swap'}</td>
                      <td>{h.returnedAt ? new Date(h.returnedAt).toLocaleDateString('en-GB') : 'Completed'}</td>
                      <td>
                        <span className="status-pill good">Completed</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        /* ========================================================
           ACTIVE ASSIGNMENTS LIST (DEFAULT VIEW)
           ======================================================== */
        <div className="active-assignments-container">
          {/* Action Filter Bar */}
          <div className="assignment-controls-bar">
            <div className="controls-search-wrap">
              <Search size={15} color="#64748b" />
              <input
                type="text"
                placeholder="Search driver name, phone, plate number (e.g. Sumit, Ertiga, WagonR)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="clean-search-input"
              />
            </div>

            <div className="controls-right-filters">
              <div className="pill-filter-group">
                <button
                  className={`pill-filter-btn ${filterType === 'all' ? 'active' : ''}`}
                  onClick={() => setFilterType('all')}
                >
                  All ({activeAssignments.length})
                </button>
                <button
                  className={`pill-filter-btn ${filterType === 'temporary' ? 'active' : ''}`}
                  onClick={() => setFilterType('temporary')}
                >
                  Temporary Duty ({tempCount})
                </button>
                <button
                  className={`pill-filter-btn ${filterType === 'permanent' ? 'active' : ''}`}
                  onClick={() => setFilterType('permanent')}
                >
                  Permanent ({activeAssignments.length - tempCount})
                </button>
              </div>

              <button
                className="btn secondary"
                onClick={() => setActiveTab('history')}
                title="View completed swap history"
              >
                <Clock size={14} />
                <span>History ({assignmentHistory.length})</span>
              </button>

              <button
                className="btn primary"
                onClick={() => setActiveTab('new')}
              >
                <Plus size={14} />
                <span>New Assignment</span>
              </button>
            </div>
          </div>

          {/* Active Allocations Grid / Cards */}
          {loading ? (
            <div className="loading-state-box">
              <RefreshCw size={24} className="spin-icon" color="#1868f0" />
              <p>Loading vehicle allocations...</p>
            </div>
          ) : filteredActive.length === 0 ? (
            <div className="no-active-state-box">
              <div className="empty-graphic-circle">
                <Car size={36} color="#0284c7" />
              </div>
              <h3>No Active Temporary Allocations</h3>
              <p>
                All drivers are currently operating their default assigned vehicles. You can assign or temporarily swap a vehicle (such as giving <strong>Ertiga</strong> to driver <strong>Sumit</strong> for <strong>2 days</strong>) anytime.
              </p>
              <button
                className="btn primary"
                onClick={() => {
                  setActiveTab('new');
                  // Quick prefill for Sumit if available
                  const sumit = drivers.find(d => d.name.toLowerCase().includes('sumit'));
                  if (sumit) setSelectedDriverId(sumit.id);
                  const ertiga = vehicles.find(v => v.model.toLowerCase().includes('ertiga'));
                  if (ertiga) setSelectedVehicleId(ertiga.id);
                }}
              >
                <Plus size={15} />
                <span>Create Vehicle Assignment (e.g. Ertiga to Sumit for 2 Days)</span>
              </button>
            </div>
          ) : (
            <div className="assignment-cards-grid">
              {filteredActive.map(item => {
                const isTemp = item.assignmentType === 'temporary';
                const startDateStr = new Date(item.startDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
                const endDateStr = item.endDate ? new Date(item.endDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Ongoing';

                // Calculate remaining days
                let remainingLabel = `${item.durationDays || 2} Days Total`;
                if (item.endDate) {
                  const msDiff = new Date(item.endDate).getTime() - Date.now();
                  const daysLeft = Math.ceil(msDiff / (1000 * 60 * 60 * 24));
                  if (daysLeft > 0) {
                    remainingLabel = `⏱️ ${daysLeft} Day${daysLeft > 1 ? 's' : ''} Remaining`;
                  } else if (daysLeft === 0) {
                    remainingLabel = '⚠️ Due for Return Today';
                  } else {
                    remainingLabel = '🚨 Return Overdue';
                  }
                }

                return (
                  <div key={item.id} className="active-assignment-card">
                    {/* Card Header */}
                    <div className="card-top-bar">
                      <div className="card-header-left">
                        <span className="live-pulse-dot"></span>
                        <span className="card-id-badge">{item.id}</span>
                        {isTemp ? (
                          <span className="card-type-badge temp">Temporary Duty ({item.durationDays}d)</span>
                        ) : (
                          <span className="card-type-badge perm">Permanent Allocation</span>
                        )}
                      </div>
                      <span className="remaining-countdown-badge">{remainingLabel}</span>
                    </div>

                    {/* Driver & Assignment Flow Visualization */}
                    <div className="assignment-visual-flow">
                      {/* Driver Column */}
                      <div className="flow-driver-col">
                        <div className="flow-driver-avatar">
                          {item.driverName.charAt(0).toUpperCase()}
                        </div>
                        <div className="flow-driver-info">
                          <h4 className="flow-name">{item.driverName}</h4>
                          <span className="flow-phone">📱 {item.driverPhone}</span>
                        </div>
                      </div>

                      {/* Swap Directional Arrow */}
                      <div className="flow-arrow-wrap">
                        <ArrowRight size={20} color="#0284c7" />
                        <span className="flow-arrow-tag">Allocated</span>
                      </div>

                      {/* Assigned Car Column */}
                      <div className="flow-vehicle-col">
                        <div className="flow-car-badge-row">
                          <span className="veh-reg-plate primary">{item.assignedVehicle?.registration}</span>
                          <span className="veh-type-tag">{item.assignedVehicle?.type || 'CNG'}</span>
                        </div>
                        <div className="flow-car-name">{item.assignedVehicle?.model}</div>
                        <div className="flow-car-sub">Meter: {item.assignedVehicle?.startOdometer || '18,400 km'}</div>
                      </div>
                    </div>

                    {/* Original Car Backup Banner (When Temporary) */}
                    {isTemp && item.originalVehicle && (
                      <div className="original-car-reserve-banner">
                        <div className="banner-left">
                          <RotateCcw size={14} color="#64748b" />
                          <span>Original Vehicle: <strong>{item.originalVehicle.model}</strong> ({item.originalVehicle.registration})</span>
                        </div>
                        <span className="reserve-tag">Reserved in Yard</span>
                      </div>
                    )}

                    {/* Duty Details & Reason */}
                    <div className="assignment-details-meta">
                      <div className="meta-line">
                        <span className="meta-label">DUTY PURPOSE:</span>
                        <span className="meta-value font-medium">{item.reason || 'VIP Passenger Transport'}</span>
                      </div>
                      <div className="meta-line">
                        <span className="meta-label">SCHEDULE:</span>
                        <span className="meta-value">{startDateStr} → {endDateStr}</span>
                      </div>
                      {item.notes && (
                        <div className="meta-line">
                          <span className="meta-label">NOTES:</span>
                          <span className="meta-value text-muted">{item.notes}</span>
                        </div>
                      )}
                    </div>

                    {/* Card Actions: Check-in / Revert, Extend, Print Slip */}
                    <div className="card-action-footer">
                      {isTemp ? (
                        <>
                          <button
                            className="btn primary small"
                            onClick={() => {
                              setRevertTarget(item);
                              setReturnKm(item.assignedVehicle?.startOdometer || '');
                            }}
                            title="Complete temporary duty and restore driver's original car"
                          >
                            <RotateCcw size={14} />
                            <span>Check-in &amp; Return Car</span>
                          </button>

                          <button
                            className="btn secondary small"
                            onClick={() => {
                              setExtendTarget(item);
                              setExtendDays(1);
                            }}
                            title="Extend duty duration by +1 or +2 days"
                          >
                            <Clock size={14} />
                            <span>Extend (+Days)</span>
                          </button>
                        </>
                      ) : (
                        <button
                          className="btn secondary small"
                          onClick={() => {
                            setRevertTarget(item);
                          }}
                        >
                          <ArrowLeftRight size={14} />
                          <span>Reassign Driver</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================
         CHECK-IN & REVERT MODAL
         ======================================================== */}
      {revertTarget && (
        <div className="clean-modal-backdrop">
          <div className="clean-modal-dialog">
            <div className="clean-modal-header">
              <div className="modal-title-wrap">
                <RotateCcw size={18} color="#0284c7" />
                <h3>Check-in Vehicle &amp; Restore Driver</h3>
              </div>
              <button className="modal-close-btn" onClick={() => setRevertTarget(null)}>✕</button>
            </div>

            <div className="clean-modal-body">
              <p className="modal-lead-desc">
                Completing duty for <strong>{revertTarget.driverName}</strong>. The temporary vehicle <strong>{revertTarget.assignedVehicle?.model} ({revertTarget.assignedVehicle?.registration})</strong> will be checked back into Yard Inventory, and {revertTarget.driverName} will be automatically restored to their original <strong>{revertTarget.originalVehicle?.model || 'Primary Vehicle'} ({revertTarget.originalVehicle?.registration || '—'})</strong>.
              </p>

              <div className="revert-summary-box">
                <div className="summary-row">
                  <span>Driver:</span>
                  <strong>{revertTarget.driverName} ({revertTarget.driverPhone})</strong>
                </div>
                <div className="summary-row">
                  <span>Car Returning to Yard:</span>
                  <strong>{revertTarget.assignedVehicle?.registration} — {revertTarget.assignedVehicle?.model}</strong>
                </div>
                <div className="summary-row">
                  <span>Driver Restored to:</span>
                  <strong>{revertTarget.originalVehicle?.registration || 'Yard Standby'} ({revertTarget.originalVehicle?.model || '—'})</strong>
                </div>
              </div>

              <div className="form-field-group">
                <label className="input-label">Return Odometer Meter Reading (KM)</label>
                <input
                  type="text"
                  className="styled-input-text"
                  placeholder="e.g. 18,620 km"
                  value={returnKm}
                  onChange={(e) => setReturnKm(e.target.value)}
                />
              </div>

              <div className="form-field-group">
                <label className="input-label">Inspection &amp; Handover Notes</label>
                <textarea
                  className="styled-input-textarea"
                  rows={2}
                  value={returnNotes}
                  onChange={(e) => setReturnNotes(e.target.value)}
                  placeholder="Vehicle inspected, clean, fuel topped up..."
                />
              </div>
            </div>

            <div className="clean-modal-footer">
              <button
                className="btn secondary"
                onClick={() => setRevertTarget(null)}
                disabled={isReverting}
              >
                Cancel
              </button>
              <button
                className="btn primary"
                onClick={handleExecuteRevert}
                disabled={isReverting}
              >
                {isReverting ? (
                  <>
                    <RefreshCw size={14} className="spin-icon" />
                    <span>Processing Check-in...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={14} />
                    <span>Confirm Return &amp; Restore Car</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
         EXTEND DURATION MODAL
         ======================================================== */}
      {extendTarget && (
        <div className="clean-modal-backdrop">
          <div className="clean-modal-dialog">
            <div className="clean-modal-header">
              <div className="modal-title-wrap">
                <Clock size={18} color="#0284c7" />
                <h3>Extend Temporary Allocation Duration</h3>
              </div>
              <button className="modal-close-btn" onClick={() => setExtendTarget(null)}>✕</button>
            </div>

            <div className="clean-modal-body">
              <p className="modal-lead-desc">
                Extend allocation of <strong>{extendTarget.assignedVehicle?.model} ({extendTarget.assignedVehicle?.registration})</strong> for driver <strong>{extendTarget.driverName}</strong>.
              </p>

              <div className="form-field-group">
                <label className="input-label">Additional Days to Add</label>
                <div className="duration-chips-grid">
                  {[1, 2, 3, 5].map(d => (
                    <button
                      key={d}
                      type="button"
                      className={`duration-chip-card ${extendDays === d ? 'is-active' : ''}`}
                      onClick={() => setExtendDays(d)}
                    >
                      <span className="chip-days">+{d} Day{d > 1 ? 's' : ''}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="clean-modal-footer">
              <button
                className="btn secondary"
                onClick={() => setExtendTarget(null)}
                disabled={isExtending}
              >
                Cancel
              </button>
              <button
                className="btn primary"
                onClick={handleExecuteExtend}
                disabled={isExtending}
              >
                {isExtending ? 'Updating...' : `Confirm +${extendDays} Day Extension`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
