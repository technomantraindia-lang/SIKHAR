import React, { useState, useEffect, useCallback } from 'react';
import {
  Fuel,
  Zap,
  Activity,
  Search,
  Plus,
  Clock,
  CheckCircle2,
  Users,
  Car,
  MapPin,
  FileText,
  Filter,
  X,
  ArrowLeft,
  ChevronRight,
  TrendingUp,
  RefreshCw,
  AlertTriangle,
  Gauge,
  Wallet,
  Receipt,
  Download,
  Check,
  Truck,
  BatteryCharging,
  Scan
} from '../common/Icons';
import DocumentOcrScannerModal from '../common/DocumentOcrScannerModal';
import {
  fetchFuelDataApi,
  startChargingSessionApi,
  stopChargingSessionApi,
  settleChargingSessionApi,
  logFuelRecordApi,
  verifyFuelRecordApi,
  fetchFleetTowerApi
} from '../../services/api';
import AdminOptionSelect from '../common/AdminOptionSelect';

export default function FuelMasterPage({ onNavigate, onBackToDashboard }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [fuelData, setFuelData] = useState({
    kpis: {},
    chargingSessions: [],
    fuelLogs: [],
    partnerStations: []
  });

  // Active View Tab: 'charging' | 'cng' | 'stations' | 'reconciliation'
  const [activeTab, setActiveTab] = useState('charging');

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [vehicleFilter, setVehicleFilter] = useState('all');

  // Fleet list for auto-fill in modals
  const [fleetVehicles, setFleetVehicles] = useState([]);

  // Modals state
  const [isStartChargingModalOpen, setIsStartChargingModalOpen] = useState(false);
  const [isLogFuelModalOpen, setIsLogFuelModalOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);
  const [selectedFuelLog, setSelectedFuelLog] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);
  const [showFuelOcrModal, setShowFuelOcrModal] = useState(false);

  // Start Charging Form
  const [chargingForm, setChargingForm] = useState({
    vehicle: 'DL52GD6605',
    driver: 'Raj Kumar',
    stationName: 'Tata Power EZ Charge - Cyber Hub Gurugram',
    connectorType: 'CCS2 Fast (60kW)',
    tariffPerKwh: '18.50',
    targetSoC: '85',
    walletHold: '800',
    notes: 'Fast charge boost prior to peak evening shift'
  });

  // Log Fuel Form
  const [fuelForm, setFuelForm] = useState({
    vehicle: 'HR38AK1234',
    driver: 'Amit Singh',
    fuelType: 'CNG',
    stationName: 'Indraprastha Gas Limited (IGL) - Sector 29 Gurugram',
    quantityKg: '8.5',
    ratePerKg: '89.50',
    odometer: '54400',
    previousOdometer: '54180',
    paymentMethod: 'Driver Wallet',
    slipNumber: 'IGL-GUR-99120',
    notes: 'Full tank refuel at 215 bar pressure'
  });

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleFuelOcrExtracted = (extracted) => {
    if (!extracted) return;
    setFuelForm(prev => ({
      ...prev,
      stationName: extracted.stationName || prev.stationName,
      slipNumber: extracted.slipNumber || prev.slipNumber,
      quantityKg: extracted.quantity || prev.quantityKg,
      ratePerKg: extracted.rate || prev.ratePerKg,
      fuelType: extracted.fuelType || prev.fuelType,
      vehicle: extracted.registration || prev.vehicle,
      driver: extracted.name || prev.driver
    }));
    showToast(`✓ Fuel Slip Scanned: Auto-filled ${extracted.stationName || 'Dispense'} details.`);
  };

  // Load fuel data from API
  const loadFuelData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetchFuelDataApi({
        status: statusFilter,
        search: searchQuery,
        vehicle: vehicleFilter
      });
      if (res) {
        setFuelData(res);
      }
    } catch (err) {
      console.error('Failed to load fuel data:', err);
      setError(err.message || 'Failed to retrieve fuel records.');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, searchQuery, vehicleFilter]);

  // Load fleet list on mount
  useEffect(() => {
    loadFuelData();
    fetchFleetTowerApi()
      .then(res => {
        if (res && res.vehicles) setFleetVehicles(res.vehicles);
      })
      .catch(err => console.warn('Could not prefill fleet vehicles:', err));
  }, [loadFuelData]);

  // Handle vehicle select change in start charging modal
  const handleChargingVehicleChange = (reg) => {
    const v = fleetVehicles.find(item => item.registration === reg);
    setChargingForm(prev => ({
      ...prev,
      vehicle: reg,
      driver: v?.driver || prev.driver
    }));
  };

  // Handle vehicle select change in log fuel modal
  const handleFuelVehicleChange = (reg) => {
    const v = fleetVehicles.find(item => item.registration === reg);
    setFuelForm(prev => ({
      ...prev,
      vehicle: reg,
      driver: v?.driver || prev.driver,
      fuelType: reg.includes('HR38') || v?.fuel?.includes('CNG') ? 'CNG' : 'Petrol'
    }));
  };

  // Start Charging Submit
  const handleStartChargingSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await startChargingSessionApi(chargingForm);
      showToast(res.message || 'EV Charging Session initiated successfully!');
      setIsStartChargingModalOpen(false);
      loadFuelData();
    } catch (err) {
      alert(err.message || 'Could not start charging session.');
    }
  };

  // Stop Charging Session
  const handleStopCharging = async (sessionId) => {
    if (!window.confirm('Send remote stop signal to charger and finalize energy delivery?')) return;
    try {
      const res = await stopChargingSessionApi(sessionId);
      showToast(res.message || 'Charging session stopped. Ready for settlement.');
      loadFuelData();
      if (selectedSession && selectedSession.id === sessionId) {
        setSelectedSession(res.session);
      }
    } catch (err) {
      alert(err.message || 'Failed to stop session.');
    }
  };

  // Settle Charging Session
  const handleSettleCharging = async (sessionId) => {
    try {
      const res = await settleChargingSessionApi(sessionId);
      showToast(res.message || 'Session settled! Unused reservation released.');
      loadFuelData();
      if (selectedSession && selectedSession.id === sessionId) {
        setSelectedSession(res.session);
      }
    } catch (err) {
      alert(err.message || 'Failed to settle session.');
    }
  };

  // Log Fuel Submit
  const handleLogFuelSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await logFuelRecordApi(fuelForm);
      showToast(res.message || 'Fuel dispense logged successfully.');
      setIsLogFuelModalOpen(false);
      loadFuelData();
    } catch (err) {
      alert(err.message || 'Could not log fuel dispense.');
    }
  };

  // Verify Fuel Log
  const handleVerifyFuelLog = async (logId, status) => {
    try {
      const res = await verifyFuelRecordApi(logId, { status });
      showToast(res.message || `Fuel log marked as ${status}.`);
      loadFuelData();
      if (selectedFuelLog && selectedFuelLog.id === logId) {
        setSelectedFuelLog(res.log);
      }
    } catch (err) {
      alert(err.message || 'Verification failed.');
    }
  };

  const kpis = fuelData.kpis || {};
  const chargingSessions = fuelData.chargingSessions || [];
  const fuelLogs = fuelData.fuelLogs || [];
  const partnerStations = fuelData.partnerStations || [];

  return (
    <div className="escalation-master-stage">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="sikhar-toast-notification">
          <span>{toastMessage}</span>
          <button onClick={() => setToastMessage(null)}>×</button>
        </div>
      )}

      {/* 1. Standard Header Row */}
      <div className="esc-header-row">
        <div className="esc-title-group">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            {onBackToDashboard && (
              <button
                className="btn small"
                onClick={onBackToDashboard}
                title="Back to Dashboard"
                style={{ padding: '4px 9px', borderRadius: '7px' }}
              >
                <ArrowLeft size={13} style={{ marginRight: '4px' }} />
                <span>Dashboard</span>
              </button>
            )}
            <div className="breadcrumb-nav" style={{ margin: 0 }}>
              <span className="breadcrumb-link" onClick={onBackToDashboard}>Operations</span>
              <ChevronRight size={12} className="breadcrumb-sep" />
              <span className="breadcrumb-active">Fuel &amp; EV Energy Infrastructure</span>
            </div>
          </div>

          <h1 style={{ margin: '4px 0 2px' }}>
            <Fuel size={22} color="#1d68f0" />
            <span>Fuel &amp; EV Energy Infrastructure</span>
          </h1>
          <div className="sub">
            Fleet Telemetry · Fast Charging Station Directory · CNG Dispense Receipts &amp; Wallet Reservation Holds
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn small"
            onClick={loadFuelData}
            title="Synchronize Energy Telemetry"
          >
            <RefreshCw size={13} className={loading ? 'spinning' : ''} />
            <span>Sync</span>
          </button>

          <button
            type="button"
            className="btn small primary"
            onClick={() => setIsStartChargingModalOpen(true)}
          >
            <Zap size={14} />
            <span>+ Remote EV Charge</span>
          </button>

          <button
            type="button"
            className="btn small primary"
            style={{ background: '#0f172a', borderColor: '#0f172a' }}
            onClick={() => setIsLogFuelModalOpen(true)}
          >
            <Fuel size={14} />
            <span>+ Log CNG / Fuel</span>
          </button>
        </div>
      </div>

      {/* 2. Executive 6-Card KPI Grid */}
      <div className="esc-kpis-grid" style={{ gridTemplateColumns: 'repeat(6, 1fr)', gap: '12px', marginBottom: '16px' }}>
        {/* Card 1: Total Energy Consumed */}
        <div className="esc-kpi-card" onClick={() => setActiveTab('charging')}>
          <div className="esc-kpi-top">
            <span className="esc-kpi-label">TOTAL ENERGY</span>
            <div className="esc-kpi-icon-wrap" style={{ background: '#eff6ff', color: '#1d68f0' }}>
              <Zap size={15} />
            </div>
          </div>
          <div className="esc-kpi-num">
            {(kpis.totalEnergyKwh || 42850).toLocaleString()} <span style={{ fontSize: '13px', fontWeight: 600, color: '#64748b' }}>kWh</span>
          </div>
          <div className="esc-kpi-sub">
            {(kpis.totalCngKg || 14280).toLocaleString()} kg CNG delivered
          </div>
        </div>

        {/* Card 2: Total Spend */}
        <div className="esc-kpi-card">
          <div className="esc-kpi-top">
            <span className="esc-kpi-label">TOTAL SPEND</span>
            <div className="esc-kpi-icon-wrap" style={{ background: '#f5f3ff', color: '#7c3aed' }}>
              <Receipt size={15} />
            </div>
          </div>
          <div className="esc-kpi-num" style={{ color: '#7c3aed' }}>
            ₹{(kpis.totalCostInr || 486320).toLocaleString()}
          </div>
          <div className="esc-kpi-sub">
            <span style={{ color: '#16a34a', fontWeight: 700 }}>₹{kpis.avgCostPerKm || '2.14'} / km</span> fleet cost
          </div>
        </div>

        {/* Card 3: EV Fleet Efficiency */}
        <div className="esc-kpi-card">
          <div className="esc-kpi-top">
            <span className="esc-kpi-label">EV EFFICIENCY</span>
            <div className="esc-kpi-icon-wrap" style={{ background: '#ecfdf5', color: '#059669' }}>
              <Gauge size={15} />
            </div>
          </div>
          <div className="esc-kpi-num" style={{ color: '#059669' }}>
            {kpis.evEfficiencyKmPerKwh || '7.8'} <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }}>km/kWh</span>
          </div>
          <div className="esc-kpi-sub">
            Tata Tigor EV Xpress-T fleet
          </div>
        </div>

        {/* Card 4: CNG Fleet Efficiency */}
        <div className="esc-kpi-card">
          <div className="esc-kpi-top">
            <span className="esc-kpi-label">CNG EFFICIENCY</span>
            <div className="esc-kpi-icon-wrap" style={{ background: '#fffbeb', color: '#d97706' }}>
              <Fuel size={15} />
            </div>
          </div>
          <div className="esc-kpi-num" style={{ color: '#d97706' }}>
            {kpis.cngEfficiencyKmPerKg || '26.4'} <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }}>km/kg</span>
          </div>
          <div className="esc-kpi-sub">
            WagonR H3 CNG fleet
          </div>
        </div>

        {/* Card 5: Live Charging */}
        <div className="esc-kpi-card" onClick={() => setActiveTab('charging')}>
          <div className="esc-kpi-top">
            <span className="esc-kpi-label">LIVE CHARGING</span>
            <div className="esc-kpi-icon-wrap" style={{ background: '#f0f9ff', color: '#0284c7' }}>
              <Activity size={15} />
            </div>
          </div>
          <div className="esc-kpi-num" style={{ color: '#0284c7' }}>
            {kpis.activeSessionsCount || 3} <span style={{ fontSize: '13px', fontWeight: 600, color: '#64748b' }}>Active</span>
          </div>
          <div className="esc-kpi-sub">
            <span className="pulse-dot green" style={{ marginRight: '4px' }} />
            IoT Telematics Streaming
          </div>
        </div>

        {/* Card 6: Wallet Holds */}
        <div className="esc-kpi-card" onClick={() => setActiveTab('reconciliation')}>
          <div className="esc-kpi-top">
            <span className="esc-kpi-label">WALLET ESCROW</span>
            <div className="esc-kpi-icon-wrap" style={{ background: '#fef3c7', color: '#b45309' }}>
              <Wallet size={15} />
            </div>
          </div>
          <div className="esc-kpi-num" style={{ color: '#b45309' }}>
            ₹{(kpis.heldReservationsInr || 2400).toLocaleString()}
          </div>
          <div className="esc-kpi-sub">
            Pre-Auth Hold Protected
          </div>
        </div>
      </div>

      {/* 3. Scenic Quick Status Strip */}
      <div className="vm-summary-strip" style={{ marginBottom: '16px' }}>
        <div className="vm-stat-pill" onClick={() => setActiveTab('charging')} style={{ cursor: 'pointer' }}>
          <span className="pulse-dot green" />
          <span className="vm-stat-label">Live Active EV Plugs:</span>
          <strong className="vm-stat-value green">{kpis.activeSessionsCount || 3}</strong>
          <span className="vm-stat-sub">(Hub &amp; Roaming)</span>
        </div>

        <div className="vm-stat-divider" />

        <div className="vm-stat-pill" onClick={() => setActiveTab('cng')} style={{ cursor: 'pointer' }}>
          <span className="pulse-dot amber" />
          <span className="vm-stat-label">CNG Fuel Dispenses:</span>
          <strong className="vm-stat-value amber">{fuelLogs.length}</strong>
          <span className="vm-stat-sub">(Verified Slips)</span>
        </div>

        <div className="vm-stat-divider" />

        <div className="vm-stat-pill" onClick={() => setActiveTab('stations')} style={{ cursor: 'pointer' }}>
          <span className="pulse-dot cyan" />
          <span className="vm-stat-label">Connected Charging Hubs:</span>
          <strong className="vm-stat-value cyan">{partnerStations.length} Stations</strong>
        </div>

        <div className="vm-stat-divider" />

        <div className="vm-stat-pill" onClick={() => setActiveTab('reconciliation')} style={{ cursor: 'pointer' }}>
          <span className="pulse-dot purple" />
          <span className="vm-stat-label">Blueprint Settlement:</span>
          <span className="vm-stat-sub">OCPI CDR 1-Click Hold Release</span>
        </div>
      </div>

      {/* 4. Filter & Segmented Navigation Bar */}
      <div className="esc-filter-hub">
        <div className="esc-search-tabs-row">
          {/* Segmented Status Tabs */}
          <div className="esc-status-tabs">
            <button
              className={`esc-status-tab-btn ${activeTab === 'charging' ? 'active' : ''}`}
              onClick={() => setActiveTab('charging')}
            >
              <Zap size={14} />
              <span>EV Charging Sessions</span>
              <span className="badge">{chargingSessions.length}</span>
            </button>

            <button
              className={`esc-status-tab-btn ${activeTab === 'cng' ? 'active' : ''}`}
              onClick={() => setActiveTab('cng')}
            >
              <Fuel size={14} />
              <span>CNG &amp; Fuel Dispenses</span>
              <span className="badge">{fuelLogs.length}</span>
            </button>

            <button
              className={`esc-status-tab-btn ${activeTab === 'stations' ? 'active' : ''}`}
              onClick={() => setActiveTab('stations')}
            >
              <MapPin size={14} />
              <span>Partner Chargers &amp; Depots</span>
              <span className="badge">{partnerStations.length}</span>
            </button>

            <button
              className={`esc-status-tab-btn ${activeTab === 'reconciliation' ? 'active' : ''}`}
              onClick={() => setActiveTab('reconciliation')}
            >
              <Wallet size={14} />
              <span>CDR &amp; Wallet Reconciliation</span>
            </button>
          </div>

          {/* Search Box */}
          <div className="esc-search-input-wrap">
            <Search size={15} className="esc-search-icon" />
            <input
              type="text"
              placeholder="Search vehicle, driver, station, slip..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="esc-search-input"
            />
            {searchQuery && (
              <button className="esc-search-clear" onClick={() => setSearchQuery('')}>×</button>
            )}
          </div>

          {/* Dropdown Filters */}
          <div className="esc-select-wrap">
            <select
              className="esc-select-custom"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Statuses</option>
              <option value="active">Active Sessions</option>
              <option value="settled">Settled</option>
              <option value="verified">Verified</option>
              <option value="pending approval">Pending Approval</option>
            </select>
          </div>
        </div>
      </div>

      {/* ========================================================
          TAB 1: EV CHARGING SESSIONS TABLE
          ======================================================== */}
      {activeTab === 'charging' && (
        <div className="esc-table-card">
          <table className="esc-data-table">
            <thead>
              <tr>
                <th>SESSION ID</th>
                <th>VEHICLE PLATE</th>
                <th>ASSIGNED DRIVER</th>
                <th>CHARGER STATION &amp; TYPE</th>
                <th style={{ width: '180px' }}>BATTERY SOC %</th>
                <th>DELIVERED ENERGY</th>
                <th>WALLET HOLD / COST</th>
                <th>STATUS</th>
                <th style={{ textAlign: 'right' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {chargingSessions.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
                    No EV charging sessions match the current filter.
                  </td>
                </tr>
              ) : (
                chargingSessions.map((session) => (
                  <tr
                    key={session.id}
                    onClick={() => setSelectedSession(session)}
                    style={{ cursor: 'pointer' }}
                  >
                    <td>
                      <div className="esc-ticket-pill">{session.id}</div>
                      <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                        {new Date(session.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>
                    <td>
                      <div className="esc-hsrp-badge">
                        <span className="ind">IND</span>
                        <span className="plate">{session.vehicle}</span>
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 700, color: '#0f172a' }}>{session.driver}</div>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>Assigned Leasee</div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 700, color: '#0f172a' }}>{session.stationName}</div>
                      <div style={{ fontSize: '11px', color: '#64748b', display: 'flex', gap: '6px', alignItems: 'center', marginTop: '2px' }}>
                        <span style={{ background: '#f1f5f9', padding: '1px 5px', borderRadius: '4px', fontWeight: 600 }}>
                          {session.connectorType}
                        </span>
                        <span>@ ₹{session.tariffPerKwh}/kWh</span>
                      </div>
                    </td>
                    <td>
                      {/* Visual SoC Bar */}
                      <div style={{ width: '100%', maxWidth: '160px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '3px' }}>
                          <strong style={{ color: '#0f172a' }}>{session.currentSoC}%</strong>
                          <span style={{ color: '#64748b' }}>Target: {session.targetSoC}%</span>
                        </div>
                        <div style={{ height: '7px', background: '#e2e8f0', borderRadius: '999px', overflow: 'hidden' }}>
                          <div
                            style={{
                              height: '100%',
                              width: `${Math.min(100, session.currentSoC)}%`,
                              background: session.status === 'Active'
                                ? 'linear-gradient(90deg, #38bdf8 0%, #1d68f0 100%)'
                                : 'linear-gradient(90deg, #10b981 0%, #059669 100%)',
                              borderRadius: '999px',
                              transition: 'width 0.4s ease'
                            }}
                          />
                        </div>
                        {session.status === 'Active' && (
                          <div style={{ fontSize: '10px', color: '#0284c7', fontWeight: 700, marginTop: '3px' }}>
                            ⚡ {session.chargingRateKw} kW Delivering
                          </div>
                        )}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 700, fontFamily: 'monospace', fontSize: '13px' }}>
                        {session.energyDeliveredKwh ? `${session.energyDeliveredKwh} kWh` : 'In progress...'}
                      </div>
                      {session.energyDeliveredKwh && (
                        <div style={{ fontSize: '11px', color: '#64748b' }}>
                          ~{(session.energyDeliveredKwh * 7.8).toFixed(0)} km added
                        </div>
                      )}
                    </td>
                    <td>
                      <div style={{ fontWeight: 800, color: '#7c3aed', fontSize: '13px' }}>
                        ₹{session.settledAmount || session.currentCost || (session.energyDeliveredKwh * session.tariffPerKwh).toFixed(2)}
                      </div>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>
                        Hold: <strong style={{ color: '#b45309' }}>₹{session.walletHold}</strong>
                      </div>
                    </td>
                    <td>
                      <span className={`pill ${session.status === 'Active' ? 'blue' : session.status === 'Settled' ? 'green' : 'orange'}`}>
                        {session.status === 'Active' ? '⚡ Charging' : session.status}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }} onClick={(e) => e.stopPropagation()}>
                      <div style={{ display: 'inline-flex', gap: '6px' }}>
                        {session.status === 'Active' && (
                          <button
                            className="btn small danger"
                            onClick={() => handleStopCharging(session.id)}
                            title="Remote stop charging session"
                          >
                            Stop
                          </button>
                        )}
                        {session.status === 'Completed' && (
                          <button
                            className="btn small primary"
                            onClick={() => handleSettleCharging(session.id)}
                            title="Reconcile CDR and release wallet hold"
                          >
                            Settle CDR
                          </button>
                        )}
                        <button
                          className="btn small"
                          onClick={() => setSelectedSession(session)}
                        >
                          Details
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ========================================================
          TAB 2: CNG & FUEL DISPENSES TABLE
          ======================================================== */}
      {activeTab === 'cng' && (
        <div className="esc-table-card">
          <table className="esc-data-table">
            <thead>
              <tr>
                <th>DISPENSE ID</th>
                <th>VEHICLE PLATE</th>
                <th>DRIVER</th>
                <th>STATION / PUMP</th>
                <th>QUANTITY &amp; RATE</th>
                <th>TOTAL AMOUNT</th>
                <th>ODOMETER &amp; EFFICIENCY</th>
                <th>PAYMENT MODE</th>
                <th>STATUS</th>
                <th style={{ textAlign: 'right' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {fuelLogs.length === 0 ? (
                <tr>
                  <td colSpan={10} style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
                    No CNG or fuel dispense logs found.
                  </td>
                </tr>
              ) : (
                fuelLogs.map((log) => (
                  <tr
                    key={log.id}
                    onClick={() => setSelectedFuelLog(log)}
                    style={{ cursor: 'pointer' }}
                  >
                    <td>
                      <div className="esc-ticket-pill">{log.id}</div>
                      <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                        {new Date(log.loggedAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td>
                      <div className="esc-hsrp-badge">
                        <span className="ind">IND</span>
                        <span className="plate">{log.vehicle}</span>
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 700, color: '#0f172a' }}>{log.driver}</div>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>{log.fuelType} Dedicated</div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 700, color: '#0f172a' }}>{log.stationName}</div>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>Slip #{log.slipNumber}</div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 700, fontFamily: 'monospace' }}>{log.quantityKg} kg</div>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>@ ₹{log.ratePerKg}/kg</div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 800, color: '#0f172a' }}>₹{log.totalAmount}</div>
                    </td>
                    <td>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', background: '#ecfdf5', color: '#15803d', padding: '2px 7px', borderRadius: '5px', fontSize: '11px', fontWeight: 700 }}>
                        <Gauge size={12} />
                        <span>{log.efficiency} km/kg</span>
                      </div>
                      <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                        {log.odometer} km (+{log.distanceKm} km)
                      </div>
                    </td>
                    <td>
                      <span style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '3px 8px', borderRadius: '5px', fontSize: '11px', fontWeight: 600 }}>
                        {log.paymentMethod}
                      </span>
                    </td>
                    <td>
                      <span className={`pill ${log.status === 'Verified' ? 'green' : 'orange'}`}>
                        {log.status}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }} onClick={(e) => e.stopPropagation()}>
                      <div style={{ display: 'inline-flex', gap: '6px' }}>
                        {log.status === 'Pending Approval' && (
                          <button
                            className="btn small green"
                            onClick={() => handleVerifyFuelLog(log.id, 'Verified')}
                          >
                            Approve
                          </button>
                        )}
                        <button
                          className="btn small"
                          onClick={() => setSelectedFuelLog(log)}
                        >
                          Review
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ========================================================
          TAB 3: PARTNER CHARGERS & DEPOTS DIRECTORY
          ======================================================== */}
      {activeTab === 'stations' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
          {partnerStations.map((station) => (
            <div
              key={station.id}
              style={{
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                padding: '18px',
                boxShadow: '0 1px 3px rgba(15,23,42,0.04)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <div>
                    <span style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', color: '#1d68f0', letterSpacing: '0.04em' }}>
                      {station.network}
                    </span>
                    <h3 style={{ margin: '2px 0 4px', fontSize: '15px', fontWeight: 800, color: '#0f172a' }}>
                      {station.name}
                    </h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11.5px', color: '#64748b' }}>
                      <MapPin size={12} color="#64748b" />
                      <span>{station.location}</span>
                    </div>
                  </div>
                  <span className={`pill ${station.status === 'Available' ? 'green' : 'orange'}`}>
                    {station.status}
                  </span>
                </div>

                <div style={{ margin: '14px 0', padding: '12px 0', borderTop: '1px solid #f1f5f9', borderBottom: '1px solid #f1f5f9' }}>
                  <div style={{ fontSize: '10.5px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '6px' }}>
                    Connectors:
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {station.connectors.map((c, idx) => (
                      <span
                        key={idx}
                        style={{
                          background: '#f8fafc',
                          border: '1px solid #e2e8f0',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          fontSize: '11px',
                          fontWeight: 600,
                          color: '#334155'
                        }}
                      >
                        ⚡ {c}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <div>
                    <span style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase' }}>Approved Tariff</span>
                    <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '13px' }}>{station.tariff}</div>
                  </div>
                  <div style={{ fontSize: '11px', color: '#15803d', fontWeight: 700 }}>
                    <span className="pulse-dot green" style={{ marginRight: '5px' }} />
                    Plugs: {station.activePlugs}
                  </div>
                </div>

                <button
                  className="btn primary small"
                  style={{ width: '100%' }}
                  onClick={() => {
                    setChargingForm(prev => ({ ...prev, stationName: station.name }));
                    setIsStartChargingModalOpen(true);
                  }}
                >
                  <Zap size={13} />
                  <span>Authorize &amp; Start Charge</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ========================================================
          TAB 4: CDR & WALLET RECONCILIATION
          ======================================================== */}
      {activeTab === 'reconciliation' && (
        <div>
          {/* Blueprint Explainer Banner */}
          <div
            style={{
              background: '#f0f9ff',
              border: '1px solid #bae6fd',
              borderRadius: '12px',
              padding: '16px 20px',
              marginBottom: '16px',
              display: 'flex',
              gap: '14px',
              alignItems: 'flex-start'
            }}
          >
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: '#e0f2fe',
                display: 'grid',
                placeItems: 'center',
                flexShrink: 0
              }}
            >
              <Wallet size={20} color="#0284c7" />
            </div>
            <div>
              <h4 style={{ margin: '0 0 4px', fontSize: '13.5px', fontWeight: 800, color: '#0369a1' }}>
                System Plan 05 &amp; 08: Wallet Hold &amp; Final Settlement Architecture
              </h4>
              <p style={{ margin: 0, fontSize: '12px', color: '#475569', lineHeight: 1.5 }}>
                When an authorized driver initiates EV charging, an initial spending reservation (e.g. <strong>₹800</strong>)
                is held in the driver’s spendable wallet balance to prevent concurrent rental deductions.
                Upon receipt of the final Charge Detail Record (CDR) from the charging partner, the actual energy cost
                (e.g. <strong>₹310.80</strong>) is deducted once and the remaining reservation (e.g. <strong>₹489.20</strong>) is released immediately.
              </p>
            </div>
          </div>

          <div className="esc-table-card">
            <table className="esc-data-table">
              <thead>
                <tr>
                  <th>EVENT / CDR REF</th>
                  <th>VEHICLE PLATE</th>
                  <th>ASSIGNED DRIVER</th>
                  <th>CHARGER STATION</th>
                  <th>INITIAL HOLD</th>
                  <th>FINAL ENERGY COST</th>
                  <th>RELEASED FUNDS</th>
                  <th>LEDGER STATUS</th>
                </tr>
              </thead>
              <tbody>
                {chargingSessions.map((s) => (
                  <tr key={s.id}>
                    <td>
                      <div className="esc-ticket-pill">{s.cdrReference || 'In Progress'}</div>
                      <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>Linked to {s.id}</div>
                    </td>
                    <td>
                      <div className="esc-hsrp-badge">
                        <span className="ind">IND</span>
                        <span className="plate">{s.vehicle}</span>
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 700, color: '#0f172a' }}>{s.driver}</div>
                    </td>
                    <td>{s.stationName}</td>
                    <td>
                      <span style={{ background: '#fef3c7', color: '#b45309', padding: '3px 8px', borderRadius: '5px', fontWeight: 800, fontFamily: 'monospace' }}>
                        ₹{s.walletHold}
                      </span>
                    </td>
                    <td>
                      <strong style={{ color: '#0f172a' }}>
                        ₹{s.settledAmount || s.currentCost || '—'}
                      </strong>
                    </td>
                    <td>
                      <span style={{ color: '#15803d', fontWeight: 700 }}>
                        {s.releasedReservation ? `+ ₹${s.releasedReservation}` : 'Hold Active in Escrow'}
                      </span>
                    </td>
                    <td>
                      <span className={`pill ${s.status === 'Settled' ? 'green' : 'orange'}`}>
                        {s.status === 'Settled' ? 'Reconciled & Posted' : 'Held in Escrow'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL 1: START REMOTE EV CHARGE
          ======================================================== */}
      {isStartChargingModalOpen && (
        <div className="modalback" onClick={() => setIsStartChargingModalOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <button className="close" onClick={() => setIsStartChargingModalOpen(false)}>×</button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span style={{ color: '#1d68f0', display: 'flex' }}><Zap size={22} /></span>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 850 }}>
                Authorize &amp; Start EV Charge
              </h2>
            </div>
            <div className="sub" style={{ marginBottom: '16px' }}>
              Send remote OCPP roaming start command and place wallet hold reservation.
            </div>

            <form onSubmit={handleStartChargingSubmit}>
              <div className="grid2">
                <div className="field">
                  <label>Select Fleet Vehicle *</label>
                  <select
                    value={chargingForm.vehicle}
                    onChange={(e) => handleChargingVehicleChange(e.target.value)}
                    required
                  >
                    {fleetVehicles
                      .filter(v => v.model?.includes('EV') || v.fuel?.includes('EV') || v.registration.startsWith('DL52'))
                      .map(v => (
                        <option key={v.registration} value={v.registration}>
                          {v.registration} — {v.model} ({v.driver || 'No Driver'})
                        </option>
                      ))}
                    <option value="DL52GD6605">DL52GD6605 — TATA TIGOR EV (Raj Kumar)</option>
                    <option value="HR55BC2211">HR55BC2211 — TATA TIGOR EV (Rohit Yadav)</option>
                    <option value="DL52GD7393">DL52GD7393 — TATA TIGOR EV (Sandeep Kumar)</option>
                    <option value="UP16HT7788">UP16HT7788 — TATA TIGOR EV (Vikram Singh)</option>
                  </select>
                </div>

                <div className="field">
                  <label>Driver In-Charge *</label>
                  <input
                    type="text"
                    value={chargingForm.driver}
                    onChange={(e) => setChargingForm(prev => ({ ...prev, driver: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <div className="grid2">
                <div className="field">
                  <label>Charging Station *</label>
                  <AdminOptionSelect
                    group="charging_station"
                    value={chargingForm.stationName}
                    onChange={(e) => setChargingForm(prev => ({ ...prev, stationName: e.target.value }))}
                    required
                  >
                    {partnerStations.map(s => (
                      <option key={s.id} value={s.name}>
                        {s.name} ({s.network})
                      </option>
                    ))}
                  </AdminOptionSelect>
                </div>

                <div className="field">
                  <label>Connector Type *</label>
                  <AdminOptionSelect
                    group="connector_type"
                    value={chargingForm.connectorType}
                    onChange={(e) => setChargingForm(prev => ({ ...prev, connectorType: e.target.value }))}
                  >
                    <option value="CCS2 Fast (60kW)">CCS2 Fast (60kW)</option>
                    <option value="CCS2 Fast (50kW)">CCS2 Fast (50kW)</option>
                    <option value="Type 2 AC (7.4kW)">Type 2 AC (7.4kW Depot Plug)</option>
                    <option value="GB/T DC (15kW)">GB/T DC (15kW)</option>
                  </AdminOptionSelect>
                </div>
              </div>

              <div className="grid3">
                <div className="field">
                  <label>Tariff (₹ / kWh)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={chargingForm.tariffPerKwh}
                    onChange={(e) => setChargingForm(prev => ({ ...prev, tariffPerKwh: e.target.value }))}
                  />
                </div>

                <div className="field">
                  <label>Target Battery SoC %</label>
                  <input
                    type="number"
                    min="50"
                    max="100"
                    value={chargingForm.targetSoC}
                    onChange={(e) => setChargingForm(prev => ({ ...prev, targetSoC: e.target.value }))}
                  />
                </div>

                <div className="field">
                  <label>Wallet Hold (₹) *</label>
                  <input
                    type="number"
                    value={chargingForm.walletHold}
                    onChange={(e) => setChargingForm(prev => ({ ...prev, walletHold: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '8px', padding: '10px 14px', fontSize: '11.5px', color: '#0369a1', margin: '10px 0' }}>
                ℹ️ <strong>Pre-Auth Guarantee:</strong> ₹{chargingForm.walletHold} will be held in the driver’s spendable wallet. Rental collection cannot spend this reservation while charging is underway.
              </div>

              <div className="modal-foot">
                <button
                  type="button"
                  className="btn"
                  onClick={() => setIsStartChargingModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn primary">
                  <Zap size={14} />
                  <span>Start Remote Charge &amp; Hold Funds</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL 2: LOG FUEL / CNG SLIP
          ======================================================== */}
      {isLogFuelModalOpen && (
        <div className="modalback" onClick={() => setIsLogFuelModalOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <button className="close" onClick={() => setIsLogFuelModalOpen(false)}>×</button>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: '#f59a23', display: 'flex' }}><Fuel size={22} /></span>
                <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 850 }}>
                  Log CNG / Fuel Dispense Slip
                </h2>
              </div>
              <button
                type="button"
                className="btn small secondary"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#f0fdf4', color: '#15803d', borderColor: '#bbf7d0', fontWeight: 700 }}
                onClick={() => setShowFuelOcrModal(true)}
                title="Scan Fuel / CNG Dispense Slip with AI OCR"
              >
                <Scan size={14} color="#15803d" />
                <span>📷 Scan Fuel Slip / Bill (AI OCR)</span>
              </button>
            </div>
            <div className="sub" style={{ marginBottom: '16px' }}>
              Record manual refuel slip, calculate efficiency &amp; submit for operational audit.
            </div>

            <form onSubmit={handleLogFuelSubmit}>
              <div className="grid2">
                <div className="field">
                  <label>Select Vehicle *</label>
                  <select
                    value={fuelForm.vehicle}
                    onChange={(e) => handleFuelVehicleChange(e.target.value)}
                    required
                  >
                    {fleetVehicles
                      .filter(v => v.model?.includes('WagonR') || v.fuel?.includes('CNG') || v.registration.startsWith('HR38') || v.registration.startsWith('DL8C'))
                      .map(v => (
                        <option key={v.registration} value={v.registration}>
                          {v.registration} — {v.model} ({v.driver || 'No Driver'})
                        </option>
                      ))}
                    <option value="HR38AK1234">HR38AK1234 — WagonR H3 CNG (Amit Singh)</option>
                    <option value="HR38AK5678">HR38AK5678 — WagonR H3 CNG (Manoj Yadav)</option>
                    <option value="DL8CAZ7788">DL8CAZ7788 — WagonR CNG (Sanjay Verma)</option>
                  </select>
                </div>

                <div className="field">
                  <label>Driver In-Charge *</label>
                  <input
                    type="text"
                    value={fuelForm.driver}
                    onChange={(e) => setFuelForm(prev => ({ ...prev, driver: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <div className="grid2">
                <div className="field">
                  <label>Fuel Station Name *</label>
                  <input
                    type="text"
                    value={fuelForm.stationName}
                    onChange={(e) => setFuelForm(prev => ({ ...prev, stationName: e.target.value }))}
                    required
                  />
                </div>

                <div className="field">
                  <label>Dispense Slip / Receipt No. *</label>
                  <input
                    type="text"
                    value={fuelForm.slipNumber}
                    onChange={(e) => setFuelForm(prev => ({ ...prev, slipNumber: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <div className="grid3">
                <div className="field">
                  <label>Quantity (kg / L) *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={fuelForm.quantityKg}
                    onChange={(e) => setFuelForm(prev => ({ ...prev, quantityKg: e.target.value }))}
                    required
                  />
                </div>

                <div className="field">
                  <label>Rate (₹ / kg) *</label>
                  <input
                    type="number"
                    step="0.1"
                    value={fuelForm.ratePerKg}
                    onChange={(e) => setFuelForm(prev => ({ ...prev, ratePerKg: e.target.value }))}
                    required
                  />
                </div>

                <div className="field">
                  <label>Total Calculated</label>
                  <input
                    type="text"
                    value={`₹${(Number(fuelForm.quantityKg || 0) * Number(fuelForm.ratePerKg || 0)).toFixed(2)}`}
                    disabled
                  />
                </div>
              </div>

              <div className="grid2">
                <div className="field">
                  <label>Current Odometer (km) *</label>
                  <input
                    type="number"
                    value={fuelForm.odometer}
                    onChange={(e) => setFuelForm(prev => ({ ...prev, odometer: e.target.value }))}
                    required
                  />
                </div>

                <div className="field">
                  <label>Payment Mode *</label>
                  <AdminOptionSelect
                    group="fuel_payment_method"
                    value={fuelForm.paymentMethod}
                    onChange={(e) => setFuelForm(prev => ({ ...prev, paymentMethod: e.target.value }))}
                  >
                    <option value="Driver Wallet">Driver Wallet Deduction</option>
                    <option value="Fleet Card (HDFC)">Fleet Card (HDFC / IndianOil)</option>
                    <option value="Driver Cash Receipt">Driver Cash (Reimbursement)</option>
                  </AdminOptionSelect>
                </div>
              </div>

              <div className="modal-foot">
                <button
                  type="button"
                  className="btn"
                  onClick={() => setIsLogFuelModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn primary">
                  <Fuel size={14} />
                  <span>Submit Fuel Slip for Audit</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL 3: SESSION DETAIL & CDR INSPECTOR
          ======================================================== */}
      {selectedSession && (
        <div className="modalback" onClick={() => setSelectedSession(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <button className="close" onClick={() => setSelectedSession(null)}>×</button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span style={{ color: '#1d68f0', display: 'flex' }}><Zap size={22} /></span>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 850 }}>
                Charge Detail Record · {selectedSession.id}
              </h2>
            </div>
            <div className="sub" style={{ marginBottom: '16px' }}>
              OCPI compliant charging telemetry and ledger settlement audit trail.
            </div>

            <div className="grid2" style={{ background: '#f8fafc', padding: '14px', borderRadius: '10px', marginBottom: '14px' }}>
              <div>
                <span style={{ fontSize: '10.5px', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Vehicle Plate</span>
                <div style={{ marginTop: '3px' }}>
                  <div className="esc-hsrp-badge">
                    <span className="ind">IND</span>
                    <span className="plate">{selectedSession.vehicle}</span>
                  </div>
                </div>
              </div>

              <div>
                <span style={{ fontSize: '10.5px', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Driver</span>
                <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '14px', marginTop: '3px' }}>{selectedSession.driver}</div>
              </div>

              <div>
                <span style={{ fontSize: '10.5px', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Station &amp; Connector</span>
                <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '13px', marginTop: '3px' }}>
                  {selectedSession.stationName} ({selectedSession.connectorType})
                </div>
              </div>

              <div>
                <span style={{ fontSize: '10.5px', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Delivered Energy</span>
                <div style={{ fontWeight: 800, color: '#15803d', fontSize: '14px', marginTop: '3px' }}>
                  {selectedSession.energyDeliveredKwh ? `${selectedSession.energyDeliveredKwh} kWh` : 'In progress...'}
                </div>
              </div>
            </div>

            <div className="grid3" style={{ marginBottom: '16px' }}>
              <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '10px 12px' }}>
                <span style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Start SoC</span>
                <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '14px' }}>{selectedSession.startSoC}%</div>
              </div>

              <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '10px 12px' }}>
                <span style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Current SoC</span>
                <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '14px' }}>{selectedSession.currentSoC}%</div>
              </div>

              <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '10px 12px' }}>
                <span style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Pre-Auth Hold</span>
                <div style={{ fontWeight: 800, color: '#b45309', fontSize: '14px' }}>₹{selectedSession.walletHold}</div>
              </div>
            </div>

            {selectedSession.cdrReference && (
              <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', padding: '10px 14px', borderRadius: '8px', fontSize: '12px', color: '#065f46', marginBottom: '14px' }}>
                ✓ <strong>CDR Verified &amp; Reconciled:</strong> {selectedSession.cdrReference} (Ledger sync confirmed)
              </div>
            )}

            <div className="modal-foot">
              {selectedSession.status === 'Active' && (
                <button
                  className="btn danger"
                  onClick={() => handleStopCharging(selectedSession.id)}
                >
                  Remote Stop Session
                </button>
              )}
              {selectedSession.status === 'Completed' && (
                <button
                  className="btn primary"
                  onClick={() => handleSettleCharging(selectedSession.id)}
                >
                  Reconcile &amp; Release Wallet Hold
                </button>
              )}
              <button className="btn" onClick={() => setSelectedSession(null)}>
                Close Window
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL 4: FUEL LOG AUDIT & SLIP PREVIEW
          ======================================================== */}
      {selectedFuelLog && (
        <div className="modalback" onClick={() => setSelectedFuelLog(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <button className="close" onClick={() => setSelectedFuelLog(null)}>×</button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span style={{ color: '#f59a23', display: 'flex' }}><Fuel size={22} /></span>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 850 }}>
                Fuel Dispense Slip Audit · {selectedFuelLog.id}
              </h2>
            </div>
            <div className="sub" style={{ marginBottom: '16px' }}>
              Slip number verification, calculated efficiency &amp; driver ledger audit.
            </div>

            <div className="grid2" style={{ background: '#f8fafc', padding: '14px', borderRadius: '10px', marginBottom: '14px' }}>
              <div>
                <span style={{ fontSize: '10.5px', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Vehicle Plate</span>
                <div style={{ marginTop: '3px' }}>
                  <div className="esc-hsrp-badge">
                    <span className="ind">IND</span>
                    <span className="plate">{selectedFuelLog.vehicle}</span>
                  </div>
                </div>
              </div>

              <div>
                <span style={{ fontSize: '10.5px', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Driver</span>
                <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '14px', marginTop: '3px' }}>{selectedFuelLog.driver}</div>
              </div>

              <div>
                <span style={{ fontSize: '10.5px', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Quantity &amp; Rate</span>
                <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '13px', marginTop: '3px' }}>
                  {selectedFuelLog.quantityKg} kg @ ₹{selectedFuelLog.ratePerKg}/kg
                </div>
              </div>

              <div>
                <span style={{ fontSize: '10.5px', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Calculated Efficiency</span>
                <div style={{ fontWeight: 800, color: '#15803d', fontSize: '14px', marginTop: '3px' }}>
                  {selectedFuelLog.efficiency} km/kg
                </div>
              </div>
            </div>

            <div className="grid2" style={{ marginBottom: '16px' }}>
              <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '10px 12px' }}>
                <span style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Odometer Reading</span>
                <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '14px' }}>
                  {selectedFuelLog.odometer} km <span style={{ fontSize: '11px', color: '#64748b' }}>(+{selectedFuelLog.distanceKm} km)</span>
                </div>
              </div>

              <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '10px 12px' }}>
                <span style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Slip / Invoice No.</span>
                <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '14px', fontFamily: 'monospace' }}>
                  {selectedFuelLog.slipNumber}
                </div>
              </div>
            </div>

            <div className="modal-foot">
              {selectedFuelLog.status === 'Pending Approval' ? (
                <>
                  <button
                    className="btn green"
                    onClick={() => handleVerifyFuelLog(selectedFuelLog.id, 'Verified')}
                  >
                    ✓ Approve &amp; Post to Ledger
                  </button>
                  <button
                    className="btn danger"
                    onClick={() => handleVerifyFuelLog(selectedFuelLog.id, 'Rejected')}
                  >
                    Reject Slip
                  </button>
                </>
              ) : (
                <div style={{ fontSize: '12px', color: '#64748b', marginRight: 'auto' }}>
                  Verified by: <strong>{selectedFuelLog.verifiedBy || 'Audit Team'}</strong>
                </div>
              )}
              <button className="btn" onClick={() => setSelectedFuelLog(null)}>
                Close Window
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI Fuel Dispense Slip OCR Scanner Modal */}
      <DocumentOcrScannerModal
        isOpen={showFuelOcrModal}
        onClose={() => setShowFuelOcrModal(false)}
        targetDocType="fuel"
        title="Fuel & Energy Dispense Slip AI OCR Scanner"
        onDataExtracted={handleFuelOcrExtracted}
      />
    </div>
  );
}
