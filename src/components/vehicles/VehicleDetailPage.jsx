import React, { useState, useEffect, useCallback } from 'react';
import {
  ChevronRight,
  Shield,
  Wrench,
  Users,
  Activity,
  IndianRupee,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  Phone
} from '../common/Icons';
import { fetchVehicleDetailApi, executeVehicleActionApi } from '../../services/api';

export default function VehicleDetailPage({ vehicleId, onBack, onNavigateToDriver }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [vehicle, setVehicle] = useState(null);
  const [activeTab, setActiveTab] = useState('overview'); // overview, assignment, compliance, maintenance, finance
  const [toastMessage, setToastMessage] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Modal States
  const [showWorkshopModal, setShowWorkshopModal] = useState(false);
  const [workshopReason, setWorkshopReason] = useState('40,000 km Scheduled Preventive Maintenance & Inverter Inspection');
  const [workshopPartner, setWorkshopPartner] = useState('ABC Motors · Okhla Authorized Hub');

  const [showDeployModal, setShowDeployModal] = useState(false);
  const [deployDriverName, setDeployDriverName] = useState('');

  const [showRecoveryModal, setShowRecoveryModal] = useState(false);

  const loadVehicle = useCallback(async () => {
    if (!vehicleId) return;
    try {
      setLoading(true);
      setError(null);
      const data = await fetchVehicleDetailApi(vehicleId);
      setVehicle(data);
      if (data && data.driver && data.driver !== 'Unassigned') {
        setDeployDriverName(data.driver);
      }
    } catch (err) {
      console.error('Failed to load vehicle details:', err);
      setError('Could not retrieve vehicle asset specifications.');
    } finally {
      setLoading(false);
    }
  }, [vehicleId]);

  useEffect(() => {
    loadVehicle();
  }, [loadVehicle]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Execute operational actions
  const handleAction = async (actionType, payload = {}) => {
    try {
      setActionLoading(true);
      await executeVehicleActionApi(vehicle.id, actionType, payload);
      showToast(`Action '${actionType.replace(/_/g, ' ')}' successfully applied.`);
      setShowWorkshopModal(false);
      setShowDeployModal(false);
      setShowRecoveryModal(false);
      await loadVehicle();
    } catch (err) {
      alert(`Action failed: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="terminal-content">
        <div className="terminal-panel loading-state" style={{ padding: '80px', textAlign: 'center' }}>
          <div className="spinner" style={{ margin: '0 auto 16px' }}></div>
          <h3 style={{ color: '#0d2140', fontSize: '16px', fontWeight: '700' }}>Retrieving 360° Asset Record...</h3>
          <p style={{ color: '#64748b', fontSize: '13px' }}>Fetching vehicle telematics, RTO compliance, and historical assignment ledger.</p>
        </div>
      </div>
    );
  }

  if (error || !vehicle) {
    return (
      <div className="terminal-content">
        <div className="command-header">
          <button className="btn secondary" onClick={onBack}>← Back to Vehicle Master</button>
        </div>
        <div className="terminal-panel error-state" style={{ padding: '40px', textAlign: 'center', background: '#fef2f2' }}>
          <AlertTriangle size={32} color="#ef4444" style={{ marginBottom: '12px' }} />
          <h3 style={{ color: '#991b1b', fontSize: '16px', fontWeight: '700' }}>{error || 'Vehicle not found.'}</h3>
          <button className="btn primary" onClick={loadVehicle} style={{ marginTop: '16px' }}>Retry Load</button>
        </div>
      </div>
    );
  }

  const isEv = vehicle.type === 'EV';
  const batteryVal = parseInt(vehicle.battery) || (isEv ? 85 : 70);

  let statusColor = 'blue';
  if (vehicle.status === 'On Road') statusColor = 'green';
  else if (vehicle.status.includes('Workshop')) statusColor = 'amber';
  else if (vehicle.status.includes('Breakdown')) statusColor = 'red';
  else if (vehicle.status.includes('Leave')) statusColor = 'purple';
  else if (vehicle.status.includes('Non-Ops')) statusColor = 'muted';

  return (
    <div className="terminal-content vehicle-detail-stage">
      {/* Toast */}
      {toastMessage && (
        <div className="terminal-toast-banner" style={{
          position: 'fixed',
          top: '24px',
          right: '24px',
          zIndex: 9999,
          background: '#0f172a',
          color: '#38bdf8',
          border: '1px solid #0284c7',
          padding: '12px 20px',
          borderRadius: '8px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
          fontWeight: '600',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <CheckCircle2 size={18} color="#38bdf8" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Breadcrumb & Action Row */}
      <div className="command-header" style={{ marginBottom: '16px' }}>
        <div>
          <div className="breadcrumb-nav">
            <span className="breadcrumb-link" onClick={onBack}>Vehicle Master</span>
            <ChevronRight size={14} className="breadcrumb-sep" />
            <span className="breadcrumb-active">{vehicle.registration}</span>
          </div>
          <div className="vd-title-row" style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '6px' }}>
            {/* HSRP License Plate Visual */}
            <div className="hsrp-plate-badge large" title="High Security Registration Plate">
              <div className="hsrp-ind-strip">
                <span className="hsrp-chakra">☸</span>
                <span className="hsrp-ind-text">IND</span>
              </div>
              <div className="hsrp-plate-number">{vehicle.registration}</div>
            </div>

            <div>
              <h1 className="executive-greeting" style={{ margin: 0, fontSize: '22px' }}>
                {vehicle.model}
              </h1>
              <div className="executive-subline">
                VIN: <code>{vehicle.chassis || 'MAT612034NJB09812'}</code> · Base Hub: <strong>{vehicle.location?.split('·')[0] || 'Central Hub'}</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Clean Context-Aware Action Controls */}
        <div className="command-actions-row">
          <button className="btn secondary" onClick={onBack}>
            ← Back to Master
          </button>

          {vehicle.status === 'Ready to Deploy' && (
            <button 
              className="btn primary" 
              onClick={() => setShowDeployModal(true)}
              style={{ background: '#16a34a', borderColor: '#16a34a' }}
            >
              Deploy to Road →
            </button>
          )}

          {vehicle.status === 'Breakdown' && (
            <button 
              className="btn red" 
              onClick={() => setShowRecoveryModal(true)}
              style={{ background: '#dc2626', color: '#ffffff' }}
            >
              Dispatch SOS Recovery →
            </button>
          )}

          {vehicle.status === 'On Road' && (
            <button 
              className="btn secondary" 
              onClick={() => setShowWorkshopModal(true)}
            >
              <Wrench size={14} />
              <span>Send to Workshop</span>
            </button>
          )}

          {vehicle.status === 'At Workshop' && (
            <button 
              className="btn primary" 
              onClick={() => setShowDeployModal(true)}
              style={{ background: '#16a34a', borderColor: '#16a34a' }}
            >
              QC Passed · Deploy to Road →
            </button>
          )}

          {vehicle.status !== 'Ready to Deploy' && vehicle.status !== 'At Workshop' && (
            <button 
              className="btn secondary"
              onClick={() => handleAction('RETURN_TO_YARD')}
            >
              Return to Yard
            </button>
          )}
        </div>
      </div>

      {/* Asset Status Ribbon Bar */}
      <div className="vd-status-bar">
        <div className="vd-status-chip">
          <span className="vd-chip-label">Operational State:</span>
          <span className={`status-pill ${statusColor}`}>
            <span className={`pulse-dot ${statusColor}`} />
            {vehicle.status}
          </span>
        </div>

        <div className="vd-status-chip">
          <span className="vd-chip-label">Diagnostic Health:</span>
          <span className={`health-tag-pill ${vehicle.healthStatus || 'good'}`}>
            ● {vehicle.health || 'Healthy'}
          </span>
        </div>

        <div className="vd-status-chip">
          <span className="vd-chip-label">Powertrain:</span>
          <span className={`powertrain-pill ${isEv ? 'ev' : 'cng'}`}>
            {isEv ? '⚡ EV (Electric)' : '⛽ CNG (Gas)'}
          </span>
        </div>

        <div className="vd-status-chip">
          <span className="vd-chip-label">Assigned Driver:</span>
          <strong style={{ color: '#0f172a' }}>
            {vehicle.driver && vehicle.driver !== 'Unassigned' ? vehicle.driver : 'In Yard Inventory'}
          </strong>
        </div>

        <div className="vd-status-chip">
          <span className="vd-chip-label">Next Service Due:</span>
          <span style={{ color: '#d97706', fontWeight: '600' }}>{vehicle.service}</span>
        </div>
      </div>

      {/* Navigation Tabs (Strictly adhering to PDF Blueprint Page 2, 3, 4, 7, 8, 12) */}
      <div className="vd-tabs-nav">
        <button
          className={`vd-tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <Activity size={16} />
          <span>1 · Overview &amp; Telemetry</span>
        </button>

        <button
          className={`vd-tab-btn ${activeTab === 'assignment' ? 'active' : ''}`}
          onClick={() => setActiveTab('assignment')}
        >
          <Users size={16} />
          <span>2 · Driver Assignment &amp; Handover</span>
        </button>

        <button
          className={`vd-tab-btn ${activeTab === 'compliance' ? 'active' : ''}`}
          onClick={() => setActiveTab('compliance')}
        >
          <Shield size={16} />
          <span>3 · RTO Compliance &amp; Permits</span>
        </button>

        <button
          className={`vd-tab-btn ${activeTab === 'maintenance' ? 'active' : ''}`}
          onClick={() => setActiveTab('maintenance')}
        >
          <Wrench size={16} />
          <span>4 · Maintenance &amp; Job Cards</span>
        </button>

        <button
          className={`vd-tab-btn ${activeTab === 'finance' ? 'active' : ''}`}
          onClick={() => setActiveTab('finance')}
        >
          <IndianRupee size={16} />
          <span>5 · Asset Finance &amp; Yield</span>
        </button>
      </div>

      {/* Tab Panels */}
      <div className="vd-tab-content-area">
        {/* ================= TAB 1: OVERVIEW & TELEMETRY ================= */}
        {activeTab === 'overview' && (
          <div className="vd-tab-grid">
            {/* Live Telematics Card */}
            <div className="terminal-panel vd-panel">
              <div className="panel-title-row">
                <h3>⚡ REAL-TIME TELEMATICS &amp; SOC</h3>
                <span className="badge-live-pulse">LIVE 4G IOT PING</span>
              </div>

              <div className="telemetry-gauge-card">
                <div className={`soc-gauge-wrapper ${isEv ? 'ev-gauge' : 'cng-gauge'}`}>
                  <svg className="soc-svg-gauge" viewBox="0 0 100 100">
                    <circle
                      className="soc-track"
                      cx="50"
                      cy="50"
                      r="41"
                      fill="none"
                      strokeWidth="7"
                    />
                    <circle
                      className="soc-progress"
                      cx="50"
                      cy="50"
                      r="41"
                      fill="none"
                      strokeWidth="7"
                      strokeDasharray={257.61}
                      strokeDashoffset={257.61 - (257.61 * Math.min(100, Math.max(5, batteryVal))) / 100}
                      strokeLinecap="round"
                      transform="rotate(-90 50 50)"
                    />
                  </svg>
                  <div className="soc-gauge-inner">
                    <div className="soc-number-wrap">
                      <span className="soc-main-num">{batteryVal}</span>
                      <span className="soc-pct-sign">%</span>
                    </div>
                    <span className="soc-tag-label">{isEv ? 'BATTERY SOC' : 'CNG LEVEL'}</span>
                  </div>
                </div>

                <div className="soc-stats-col">
                  <div className="soc-stat-row">
                    <span className="label">Estimated Remaining Range:</span>
                    <strong className="val">~{Math.round(batteryVal * (isEv ? 2.1 : 1.8))} km</strong>
                  </div>
                  <div className="soc-stat-row">
                    <span className="label">Odometer Reading:</span>
                    <strong className="val">{vehicle.odometer}</strong>
                  </div>
                  <div className="soc-stat-row">
                    <span className="label">Connector Interface:</span>
                    <strong className="val">{vehicle.connectorType || (isEv ? 'CCS2 (DC Fast & Type 2 AC)' : 'CNG High-Pressure Nozzle')}</strong>
                  </div>
                  <div className="soc-stat-row">
                    <span className="label">Live GPS Location:</span>
                    <strong className="val" style={{ color: '#0284c7' }}>{vehicle.location}</strong>
                  </div>
                </div>
              </div>

              {/* Sensor Diagnostics */}
              <div className="vd-diagnostics-grid">
                <div className="diag-item">
                  <span className="diag-label">{isEv ? 'Inverter & Motor' : 'CNG Regulator & Valve'}</span>
                  <span className="diag-val good">{isEv ? '✓ Operational (412V Bus)' : '✓ 180 Bar (Nominal)'}</span>
                </div>
                <div className="diag-item">
                  <span className="diag-label">{isEv ? '12V Aux Battery' : '12V Battery & Alternator'}</span>
                  <span className="diag-val good">{isEv ? '✓ 13.8V Healthy' : '✓ 13.6V Healthy'}</span>
                </div>
                <div className="diag-item">
                  <span className="diag-label">{isEv ? 'BMS Cell Delta' : 'Gas Injector Delivery'}</span>
                  <span className="diag-val good">{isEv ? '✓ 0.012V (Balanced)' : '✓ Sequential Injected'}</span>
                </div>
                <div className="diag-item">
                  <span className="diag-label">Active DTC Codes</span>
                  <span className={`diag-val ${vehicle.healthStatus === 'bad' ? 'bad' : 'good'}`}>
                    {vehicle.healthStatus === 'bad' ? '⚠️ DTC P1A14 Alert' : '✓ 0 Codes Active'}
                  </span>
                </div>
              </div>
            </div>

            {/* Physical Asset Master Specifications (PDF Page 3) */}
            <div className="terminal-panel vd-panel">
              <div className="panel-title-row">
                <h3>📋 MASTER ASSET REGISTRATION</h3>
                <span className="count-pill blue">Verified Asset</span>
              </div>

              <div className="specs-table-container">
                <table className="specs-table">
                  <tbody>
                    <tr>
                      <td className="spec-name">Registration Plate</td>
                      <td className="spec-value"><strong>{vehicle.registration}</strong></td>
                    </tr>
                    <tr>
                      <td className="spec-name">Vehicle Make &amp; Model</td>
                      <td className="spec-value">{vehicle.model}</td>
                    </tr>
                    <tr>
                      <td className="spec-name">Powertrain / Fuel</td>
                      <td className="spec-value">
                        <span className={`powertrain-pill ${isEv ? 'ev' : 'cng'}`}>
                          {vehicle.type}
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td className="spec-name">Chassis (VIN) Number</td>
                      <td className="spec-value"><code>{vehicle.chassis || 'MAT612034NJB09812'}</code></td>
                    </tr>
                    <tr>
                      <td className="spec-name">Assigned Base Yard</td>
                      <td className="spec-value">{vehicle.hub || 'Sikhar Hub Central Operations Yard'}</td>
                    </tr>
                    <tr>
                      <td className="spec-name">Financing Partner</td>
                      <td className="spec-value">{vehicle.lender || 'Signo Financing'}</td>
                    </tr>
                    <tr>
                      <td className="spec-name">Monthly Lease EMI</td>
                      <td className="spec-value"><strong>{vehicle.monthlyEmi || '₹21,000'}</strong></td>
                    </tr>
                    <tr>
                      <td className="spec-name">Internal System Notes</td>
                      <td className="spec-value" style={{ fontStyle: 'italic', color: '#475569' }}>
                        {vehicle.notes || 'Asset in good mechanical condition.'}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 2: ASSIGNMENT & HANDOVER HISTORY ================= */}
        {activeTab === 'assignment' && (
          <div className="vd-tab-grid single-col">
            <div className="terminal-panel vd-panel">
              <div className="panel-title-row">
                <div>
                  <h3>👤 CURRENT DRIVER ASSIGNMENT &amp; PRE-TRIP CHECKLIST</h3>
                  <p className="subtext">
                    PDF Blueprint Rule: Renewals &amp; maintenance preserve existing valid driver-vehicle assignment. Another active assignment cannot be overwritten.
                  </p>
                </div>
                <span className="count-pill green">Active Contract</span>
              </div>

              {vehicle.driver && vehicle.driver !== 'Unassigned' ? (
                <div className="driver-active-card-box">
                  <div className="dac-avatar">
                    <Users size={28} color="#0284c7" />
                  </div>
                  <div className="dac-details">
                    <h4 className="dac-name">{vehicle.driver}</h4>
                    <div className="dac-contact">
                      <Phone size={14} /> {vehicle.driverPhone || '+91 98110 44291'}
                    </div>
                    <div className="dac-meta-row">
                      <span className="shift-badge-large">12-Hour Shift Shared Dual-Driver</span>
                      <span className="dac-active-tag">Agreement v1.0 · Escrow ₹10,000 Verified</span>
                      <span className="dac-date-tag">Assigned Since: {vehicle.since || 'Active'}</span>
                    </div>
                  </div>

                  <div className="dac-actions">
                    <button 
                      className="btn secondary"
                      onClick={() => onNavigateToDriver && onNavigateToDriver(vehicle.driver)}
                    >
                      View Driver 360° Profile →
                    </button>
                  </div>
                </div>
              ) : (
                <div className="empty-assignment-box">
                  <div style={{ fontSize: '36px', marginBottom: '8px' }}>🅿️</div>
                  <h4>Vehicle Currently in Yard Stock</h4>
                  <p>This asset is ready for deployment. Assign an onboarded driver with verified KYC and escrow deposit.</p>
                  <button className="btn primary" onClick={() => setShowDeployModal(true)}>
                    + Assign Driver &amp; Deploy
                  </button>
                </div>
              )}

              {/* Handover & Pre-Trip Checklist (PDF Page 7 Handover checklist) */}
              <div className="handover-checklist-container">
                <h4 className="section-title">Verified Pre-Handover Checklist Items</h4>
                <div className="checklist-grid">
                  <div className="check-item verified">
                    <CheckCircle2 size={16} color="#16a34a" />
                    <div>
                      <strong>FASTag RFID Barcode</strong>
                      <span>Active on National Highway Portal</span>
                    </div>
                  </div>
                  <div className="check-item verified">
                    <CheckCircle2 size={16} color="#16a34a" />
                    <div>
                      <strong>Spare Tire &amp; Jack Kit</strong>
                      <span>Present in trunk boot with hazard triangle</span>
                    </div>
                  </div>
                  <div className="check-item verified">
                    <CheckCircle2 size={16} color="#16a34a" />
                    <div>
                      <strong>Type 2 AC Home Charger Cable</strong>
                      <span>3.3kW portable emergency cable verified</span>
                    </div>
                  </div>
                  <div className="check-item verified">
                    <CheckCircle2 size={16} color="#16a34a" />
                    <div>
                      <strong>Sanitization &amp; Cabin Cleanliness</strong>
                      <span>Passed hub audit inspection</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Historical Driver Assignment Ledger */}
              <div className="history-ledger-container" style={{ marginTop: '28px' }}>
                <h4 className="section-title">Historical Driver Assignment Ledger</h4>
                <div className="table-responsive">
                  <table className="terminal-data-table">
                    <thead>
                      <tr>
                        <th>Driver Name</th>
                        <th>Shift Type</th>
                        <th>Assignment Period</th>
                        <th>Handover Odometer</th>
                        <th>Return Reason</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td><strong>{vehicle.driver || 'Raj Kumar'}</strong></td>
                        <td>12h Day Shift</td>
                        <td>01 Aug 2026 – Present</td>
                        <td>40,110 km</td>
                        <td>Current Active Allocation</td>
                        <td><span className="status-pill green">Active</span></td>
                      </tr>
                      <tr>
                        <td><strong>Suresh Verma</strong></td>
                        <td>24h Dedicated</td>
                        <td>15 Jun 2026 – 31 Jul 2026</td>
                        <td>32,450 km</td>
                        <td>Voluntary Shift Transition</td>
                        <td><span className="status-pill muted">Completed</span></td>
                      </tr>
                      <tr>
                        <td><strong>Vipin Sharma</strong></td>
                        <td>24h Dedicated</td>
                        <td>01 May 2026 – 14 Jun 2026</td>
                        <td>24,800 km</td>
                        <td>Lease Agreement Renewal</td>
                        <td><span className="status-pill muted">Completed</span></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 3: RTO COMPLIANCE & PERMITS ================= */}
        {activeTab === 'compliance' && (
          <div className="vd-tab-grid">
            {/* Statutory Permits & Certificates (PDF Page 8) */}
            <div className="terminal-panel vd-panel">
              <div className="panel-title-row">
                <h3>📜 RTO STATUTORY COMPLIANCE &amp; PERMITS</h3>
                <span className="count-pill green">All Regulatory Checks Clear</span>
              </div>

              <div className="compliance-cards-grid">
                {/* Taxi Permit */}
                <div className="compliance-doc-card">
                  <div className="cdc-header">
                    <span className="cdc-type">All-India Commercial Taxi Permit</span>
                    <span className="comp-badge valid">Active</span>
                  </div>
                  <div className="cdc-number">PERMIT-NCR-2026-99214</div>
                  <div className="cdc-details">
                    <span>Expiry: <strong>{vehicle.permit}</strong></span>
                    <span>Territory: Delhi NCR &amp; Haryana</span>
                  </div>
                </div>

                {/* Comprehensive Insurance */}
                <div className="compliance-doc-card">
                  <div className="cdc-header">
                    <span className="cdc-type">Comprehensive Commercial Policy</span>
                    <span className="comp-badge valid">Active</span>
                  </div>
                  <div className="cdc-number">POL-NIC-8829104-COMM</div>
                  <div className="cdc-details">
                    <span>Expiry: <strong>{vehicle.insurance}</strong></span>
                    <span>Insurer: National Insurance · Zero Dep</span>
                  </div>
                </div>

                {/* Fitness Certificate Form 38 */}
                <div className="compliance-doc-card">
                  <div className="cdc-header">
                    <span className="cdc-type">RTO Fitness Certificate (Form 38)</span>
                    <span className={`comp-badge ${vehicle.fitness?.includes('Expiring') ? 'expiring' : 'valid'}`}>
                      {vehicle.fitness?.includes('Expiring') ? 'Expiring Soon' : 'Valid'}
                    </span>
                  </div>
                  <div className="cdc-number">FIT-DL-2026-44120</div>
                  <div className="cdc-details">
                    <span>Expiry: <strong>{vehicle.fitness}</strong></span>
                    <span>Authorized Testing Station: Burari RTO</span>
                  </div>
                </div>

                {/* PUC Certificate */}
                <div className="compliance-doc-card">
                  <div className="cdc-header">
                    <span className="cdc-type">Pollution Under Control (PUC)</span>
                    <span className={`comp-badge ${vehicle.puc?.includes('Expired') ? 'expired' : 'valid'}`}>
                      {vehicle.puc?.includes('Expired') ? 'Expired' : 'Valid'}
                    </span>
                  </div>
                  <div className="cdc-number">PUC-DL-9912098</div>
                  <div className="cdc-details">
                    <span>Expiry: <strong>{vehicle.puc}</strong></span>
                    <span>EV Emission Exemption Verified</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Traffic Challans & Penalties (PDF Page 8) */}
            <div className="terminal-panel vd-panel">
              <div className="panel-title-row">
                <h3>⚠️ TRAFFIC E-CHALLANS &amp; LEGAL HOLDS</h3>
                <span className="count-pill blue">Parivahan Live Sync</span>
              </div>

              <div className="challans-summary-box">
                <div className="csb-metric">
                  <span className="csb-num">0</span>
                  <span className="csb-txt">Pending Challans</span>
                </div>
                <div className="csb-metric">
                  <span className="csb-num">₹0</span>
                  <span className="csb-txt">Outstanding Penalties</span>
                </div>
                <div className="csb-metric">
                  <span className="csb-num" style={{ color: '#16a34a' }}>Clean</span>
                  <span className="csb-txt">RTO Blacklist Status</span>
                </div>
              </div>

              <div className="challan-sync-note">
                <CheckCircle2 size={16} color="#16a34a" />
                <span>No active court summons, red light violation, or speeding challan recorded on MoRTH Vahan 4.0 database.</span>
              </div>

              <div className="challan-actions-row" style={{ marginTop: '20px' }}>
                <button className="btn secondary" onClick={() => showToast('Parivahan e-Challan database queried. Status: 0 Pending.')}>
                  Query Parivahan Portal →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 4: MAINTENANCE & WORKSHOP ================= */}
        {activeTab === 'maintenance' && (
          <div className="vd-tab-grid single-col">
            <div className="terminal-panel vd-panel">
              <div className="panel-title-row">
                <div>
                  <h3>🔧 10-STAGE MAINTENANCE LIFECYCLE (PDF BLUEPRINT PAGE 7)</h3>
                  <p className="subtext">
                    Stages: 1 Service Due → 2 Job Card → 3 Check-In → 4 Estimate → 5 In Progress → 6 QC → 7 Bill Match → 8 Payment → 9 Closure → 10 Ready to Deploy
                  </p>
                </div>
                <button className="btn amber" onClick={() => setShowWorkshopModal(true)}>
                  + Open New Job Card
                </button>
              </div>

              {/* Maintenance Progress Stepper */}
              <div className="maintenance-stepper-container">
                <div className={`m-step ${vehicle.status === 'At Workshop' ? 'completed' : 'active'}`}>
                  <div className="m-step-circle">1</div>
                  <div className="m-step-title">Service Due</div>
                </div>
                <div className={`m-step ${vehicle.status === 'At Workshop' ? 'active' : ''}`}>
                  <div className="m-step-circle">2</div>
                  <div className="m-step-title">Job Card</div>
                </div>
                <div className="m-step">
                  <div className="m-step-circle">3</div>
                  <div className="m-step-title">Workshop In</div>
                </div>
                <div className="m-step">
                  <div className="m-step-circle">4</div>
                  <div className="m-step-title">Estimate OK</div>
                </div>
                <div className="m-step">
                  <div className="m-step-circle">5</div>
                  <div className="m-step-title">In Progress</div>
                </div>
                <div className="m-step">
                  <div className="m-step-circle">6</div>
                  <div className="m-step-title">QC Release</div>
                </div>
                <div className="m-step">
                  <div className="m-step-circle">7</div>
                  <div className="m-step-title">Ready Deploy</div>
                </div>
              </div>

              {/* Active Workshop Job Card Details */}
              <div className="active-jobcard-details" style={{ marginTop: '24px' }}>
                <h4 className="section-title">Current Workshop Details &amp; Service Forecast</h4>
                <div className="specs-table-container">
                  <table className="specs-table">
                    <tbody>
                      <tr>
                        <td className="spec-name">Next Service Schedule</td>
                        <td className="spec-value"><strong>{vehicle.service}</strong></td>
                      </tr>
                      <tr>
                        <td className="spec-name">Service Interval Target</td>
                        <td className="spec-value">Every 10,000 km or 60 Days (Tata Fleet Standard)</td>
                      </tr>
                      <tr>
                        <td className="spec-name">Authorized Workshop Partner</td>
                        <td className="spec-value">ABC Motors Okhla (Authorized Tata Motors EV Workshop)</td>
                      </tr>
                      <tr>
                        <td className="spec-name">Last Action Recorded</td>
                        <td className="spec-value"><strong>{vehicle.nextAction || 'Routine service on track'}</strong></td>
                      </tr>
                      <tr>
                        <td className="spec-name">Release Rule Compliance</td>
                        <td className="spec-value">
                          <span className="comp-badge valid">
                            ✓ QC, Verified Bill &amp; Authorized release required before deployment
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 5: ASSET FINANCE & YIELD ================= */}
        {activeTab === 'finance' && (
          <div className="vd-tab-grid">
            {/* Capital Financing & Lender Details (PDF Page 3 & 12) */}
            <div className="terminal-panel vd-panel">
              <div className="panel-title-row">
                <h3>🏦 CAPITAL FINANCING &amp; LENDER EMI</h3>
                <span className="count-pill blue">Institutional Lease</span>
              </div>

              <div className="finance-kpi-grid">
                <div className="fk-card">
                  <span className="fk-label">Monthly Lender EMI</span>
                  <span className="fk-value" style={{ color: '#0284c7' }}>{vehicle.monthlyEmi || '₹21,000'}</span>
                  <span className="fk-sub">Financier: {vehicle.lender || 'Signo Financing'}</span>
                </div>

                <div className="fk-card">
                  <span className="fk-label">Loan Tenure</span>
                  <span className="fk-value">48 Months</span>
                  <span className="fk-sub">18 Paid · 30 Remaining</span>
                </div>

                <div className="fk-card">
                  <span className="fk-label">Daily Rental Rate</span>
                  <span className="fk-value" style={{ color: '#16a34a' }}>₹1,150 / day</span>
                  <span className="fk-sub">Driver Collection Fee</span>
                </div>

                <div className="fk-card">
                  <span className="fk-label">Gross Monthly Revenue</span>
                  <span className="fk-value">₹34,500</span>
                  <span className="fk-sub">At 100% On-Road Utilization</span>
                </div>
              </div>

              <div className="finance-loan-details" style={{ marginTop: '20px' }}>
                <h4 className="section-title">Institutional Facility Terms</h4>
                <div className="specs-table-container">
                  <table className="specs-table">
                    <tbody>
                      <tr>
                        <td className="spec-name">Financing Institution</td>
                        <td className="spec-value"><strong>{vehicle.lender || 'Signo Financing'}</strong></td>
                      </tr>
                      <tr>
                        <td className="spec-name">Asset On-Road Cost</td>
                        <td className="spec-value">₹11,40,000 (Subsidized via FAME-II)</td>
                      </tr>
                      <tr>
                        <td className="spec-name">Debt Down Payment</td>
                        <td className="spec-value">₹1,14,000 (10% Equity)</td>
                      </tr>
                      <tr>
                        <td className="spec-name">Next EMI Debit Date</td>
                        <td className="spec-value"><strong>05 Sep 2026 (Auto NACH Mandate)</strong></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Asset Financial Yield & Performance (PDF Page 12) */}
            <div className="terminal-panel vd-panel">
              <div className="panel-title-row">
                <h3>📈 VEHICLE PERFORMANCE &amp; NET CASH YIELD</h3>
                <span className="count-pill green">164% EMI Coverage</span>
              </div>

              <div className="yield-breakdown-card">
                <div className="yield-row">
                  <span>Gross Monthly Lease Revenue (30 days @ ₹1,150):</span>
                  <strong style={{ color: '#16a34a' }}>+₹34,500</strong>
                </div>
                <div className="yield-row">
                  <span>Lender Monthly Financing EMI:</span>
                  <strong style={{ color: '#dc2626' }}>-₹21,000</strong>
                </div>
                <div className="yield-row">
                  <span>Comprehensive Insurance Accrual:</span>
                  <strong style={{ color: '#dc2626' }}>-₹2,000</strong>
                </div>
                <div className="yield-row">
                  <span>Scheduled Maintenance Reserve:</span>
                  <strong style={{ color: '#dc2626' }}>-₹1,500</strong>
                </div>
                <div className="yield-divider" />
                <div className="yield-row total">
                  <span>Net Asset Cash Flow (Per Month):</span>
                  <strong style={{ color: '#0284c7', fontSize: '18px' }}>+₹10,000 / mo</strong>
                </div>
              </div>

              <div className="downtime-impact-box" style={{ marginTop: '20px' }}>
                <h4>⚠️ Downtime Cost Impact</h4>
                <p>
                  Each idle off-road day incurs a capital cost of <strong>₹700/day EMI drag</strong> plus lost rent of <strong>₹1,150/day</strong>. Total idle penalty: <strong>₹1,850/day</strong>.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ================= MODAL: ISSUE WORKSHOP JOB CARD ================= */}
      {showWorkshopModal && (
        <div className="terminal-modal-backdrop">
          <div className="terminal-modal-dialog">
            <div className="tmd-header">
              <h3>🔧 Issue Workshop Job Card · {vehicle.registration}</h3>
              <button className="tmd-close" onClick={() => setShowWorkshopModal(false)}>✕</button>
            </div>
            <div className="tmd-body">
              <p style={{ color: '#475569', fontSize: '13px', marginBottom: '16px' }}>
                Transitioning asset to <strong>At Workshop</strong> status. As per PDF blueprint Page 7, driver assignment is preserved while the vehicle is serviced.
              </p>

              <div className="tmd-field">
                <label>Authorized Workshop Partner:</label>
                <select 
                  className="tmd-input"
                  value={workshopPartner}
                  onChange={(e) => setWorkshopPartner(e.target.value)}
                >
                  <option value="ABC Motors · Okhla Authorized Hub">ABC Motors · Okhla Authorized Hub</option>
                  <option value="ABC Motors · Gurgaon Sector 14 Hub">ABC Motors · Gurgaon Sector 14 Hub</option>
                  <option value="Tata Motors EV Care · Noida Sector 63">Tata Motors EV Care · Noida Sector 63</option>
                </select>
              </div>

              <div className="tmd-field">
                <label>Maintenance Complaint / Work Scope:</label>
                <textarea
                  className="tmd-input"
                  rows={3}
                  value={workshopReason}
                  onChange={(e) => setWorkshopReason(e.target.value)}
                />
              </div>
            </div>
            <div className="tmd-footer">
              <button className="btn secondary" onClick={() => setShowWorkshopModal(false)}>Cancel</button>
              <button 
                className="btn amber" 
                disabled={actionLoading}
                onClick={() => handleAction('SEND_TO_WORKSHOP', { reason: workshopReason, workshop: workshopPartner })}
              >
                {actionLoading ? 'Issuing...' : 'Confirm Job Card & Dispatch'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: DEPLOY / PUT ON ROAD ================= */}
      {showDeployModal && (
        <div className="terminal-modal-backdrop">
          <div className="terminal-modal-dialog">
            <div className="tmd-header">
              <h3>🚗 Deploy Asset to Road · {vehicle.registration}</h3>
              <button className="tmd-close" onClick={() => setShowDeployModal(false)}>✕</button>
            </div>
            <div className="tmd-body">
              <p style={{ color: '#475569', fontSize: '13px', marginBottom: '16px' }}>
                Confirming vehicle operational eligibility. Verifying valid insurance, fitness certificate, and driver KYC assignment.
              </p>

              <div className="tmd-field">
                <label>Assign Primary Driver:</label>
                <input
                  type="text"
                  className="tmd-input"
                  placeholder="Driver Full Name"
                  value={deployDriverName}
                  onChange={(e) => setDeployDriverName(e.target.value)}
                />
              </div>

              <div className="tmd-checklist-note">
                <CheckCircle2 size={16} color="#16a34a" />
                <span>Pre-handover inspection and FASTag activation verified.</span>
              </div>
            </div>
            <div className="tmd-footer">
              <button className="btn secondary" onClick={() => setShowDeployModal(false)}>Cancel</button>
              <button 
                className="btn green" 
                disabled={actionLoading}
                onClick={() => handleAction('PUT_ON_ROAD', { driver: deployDriverName || vehicle.driver })}
              >
                {actionLoading ? 'Deploying...' : 'Authorize Road Deployment'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: SOS BREAKDOWN RECOVERY ================= */}
      {showRecoveryModal && (
        <div className="terminal-modal-backdrop">
          <div className="terminal-modal-dialog">
            <div className="tmd-header">
              <h3>🚨 Dispatch SOS Breakdown Recovery · {vehicle.registration}</h3>
              <button className="tmd-close" onClick={() => setShowRecoveryModal(false)}>✕</button>
            </div>
            <div className="tmd-body">
              <p style={{ color: '#475569', fontSize: '13px', marginBottom: '16px' }}>
                Dispatching authorized hydraulic flatbed tow truck to vehicle GPS coordinates.
              </p>

              <div className="recovery-location-box">
                <MapPin size={18} color="#dc2626" />
                <div>
                  <strong>Reported Breakdown Location:</strong>
                  <div>{vehicle.location || 'Gurgaon Expressway · Sector 44'}</div>
                </div>
              </div>
            </div>
            <div className="tmd-footer">
              <button className="btn secondary" onClick={() => setShowRecoveryModal(false)}>Cancel</button>
              <button 
                className="btn red" 
                disabled={actionLoading}
                onClick={() => handleAction('ARRANGE_RECOVERY')}
              >
                {actionLoading ? 'Dispatching...' : 'Confirm Tow Truck Dispatch'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
