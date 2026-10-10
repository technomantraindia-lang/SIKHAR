import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  Search,
  MapPin,
  Car,
  Cpu,
  Calendar,
  Tag,
  Gauge,
  Fuel,
  Shield,
  Phone,
  CreditCard,
  CheckCircle2,
  FileText,
  Layout,
  User,
  Wrench,
  AlertTriangle,
  IndianRupee,
  TrendingUp
} from '../common/Icons';
import { fetchFleetTowerApi, executeVehicleActionApi } from '../../services/api';

export default function FleetControlTower({ onNavigate }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [activeModalTab, setActiveModalTab] = useState('overview');
  const [actionNotice, setActionNotice] = useState(null);

  // Load live data from Node.js Express backend (/api/fleet)
  const loadFleetData = useCallback(async (filter = activeFilter, query = searchTerm) => {
    try {
      setLoading(true);
      const result = await fetchFleetTowerApi(filter, query);
      setData(result);
    } catch (err) {
      console.error('Failed to load fleet data:', err);
    } finally {
      setLoading(false);
    }
  }, [activeFilter, searchTerm]);

  // Lock background scroll when modal is open so only the modal scrolls cleanly
  useEffect(() => {
    if (selectedVehicle) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [selectedVehicle]);

  useEffect(() => {
    loadFleetData();
  }, [loadFleetData]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadFleetData(activeFilter, searchTerm);
  };

  const handleExecuteAction = async (vehicleId, actionType, payload = {}) => {
    try {
      await executeVehicleActionApi(vehicleId, actionType, payload);
      setActionNotice(`Action executed successfully: ${actionType} on ${vehicleId}`);
      setTimeout(() => setActionNotice(null), 4000);
      loadFleetData(activeFilter, searchTerm);
      if (selectedVehicle && selectedVehicle.id === vehicleId) {
        setSelectedVehicle(null);
      }
    } catch (err) {
      alert(`Action failed: ${err.message}`);
    }
  };

  if (loading && !data) {
    return (
      <div className="fleet-loading-container">
        <div className="terminal-spinner"></div>
        <p>Loading live fleet records from Node.js backend...</p>
      </div>
    );
  }

  const { summary, vehicles, actionRequired, driverStatus, compliance, healthSnapshot } = data || {};
  const metrics = summary?.metrics || {};

  return (
    <div className="fleet-control-tower-viewport">
      {/* 1. Panoramic Scenic Greeting Banner (Matching Image 2 with Car instead of Truck) */}
      <div className="fleet-scenic-greeting-banner">
        <div className="banner-left-greeting">
          <h1 className="banner-greeting-title">Good Morning, Sanjay! 👋</h1>
          <p className="banner-greeting-sub">Here's your fleet performance overview for today.</p>
        </div>

        <div className="banner-actions-right">
          <div className="banner-date-pill">
            <Calendar size={15} className="banner-calendar-icon" />
            <span>19 Aug 2026</span>
          </div>
          <button 
            className="banner-export-button" 
            onClick={() => alert('Exporting live operational fleet report (CSV)...')}
          >
            <span>Export Report ▾</span>
          </button>
        </div>
      </div>

      {/* Action Notification Toast */}
      {actionNotice && (
        <div className="fleet-action-toast">
          <span>✓</span> {actionNotice}
        </div>
      )}

      {/* 2. Executive 5-Card Operational Hero Strip (Clean & Uncluttered) */}
      <div className="fleet-kpi-strip-v2">
        {/* Card 1: Total Fleet */}
        <div 
          className={`fleet-hero-card ${activeFilter === 'all' ? 'is-selected' : ''}`}
          onClick={() => setActiveFilter('all')}
        >
          <div className="hero-card-top">
            <span className="hero-card-label">TOTAL FLEET</span>
            <div className="hero-card-icon-circle blue">
              <Car size={16} />
            </div>
          </div>
          <div className="hero-card-val">{metrics.totalFleet?.value || 67}</div>
          <div className="hero-card-foot">
            <span className="hero-card-sub">100% Registered Assets</span>
          </div>
        </div>

        {/* Card 2: On Road */}
        <div 
          className={`fleet-hero-card ${activeFilter === 'onroad' ? 'is-selected' : ''}`}
          onClick={() => setActiveFilter('onroad')}
        >
          <div className="hero-card-top">
            <span className="hero-card-label">ACTIVE ON ROAD</span>
            <div className="hero-card-icon-circle green">
              <CheckCircle2 size={16} />
            </div>
          </div>
          <div className="hero-card-val text-green">{metrics.onRoad?.value || 56}</div>
          <div className="hero-card-foot">
            <span className="hero-badge-tag green">● Active Earning</span>
            <span className="hero-card-sub text-green">83.6%</span>
          </div>
        </div>

        {/* Card 3: Breakdown */}
        <div 
          className={`fleet-hero-card ${activeFilter === 'breakdown' ? 'is-selected' : ''}`}
          onClick={() => setActiveFilter('breakdown')}
        >
          <div className="hero-card-top">
            <span className="hero-card-label">BREAKDOWN</span>
            <div className="hero-card-icon-circle red">
              <AlertTriangle size={16} />
            </div>
          </div>
          <div className="hero-card-val text-red">{metrics.breakdown?.value || 1}</div>
          <div className="hero-card-foot">
            <span className="hero-badge-tag red">Urgent Recovery</span>
            <span className="hero-card-sub text-red">1.5%</span>
          </div>
        </div>

        {/* Card 4: Driver On Leave */}
        <div 
          className={`fleet-hero-card ${activeFilter === 'leave' ? 'is-selected' : ''}`}
          onClick={() => setActiveFilter('leave')}
        >
          <div className="hero-card-top">
            <span className="hero-card-label">DRIVER ON LEAVE</span>
            <div className="hero-card-icon-circle purple">
              <User size={16} />
            </div>
          </div>
          <div className="hero-card-val text-purple">{metrics.driverOnLeave?.value || 1}</div>
          <div className="hero-card-foot">
            <span className="hero-badge-tag purple">Substitute Assigned</span>
          </div>
        </div>

        {/* Card 5: Fleet Utilization */}
        <div 
          className="fleet-hero-card utilization-hero-card"
          onClick={() => setActiveFilter('all')}
        >
          <div className="hero-card-top">
            <span className="hero-card-label">FLEET UTILIZATION</span>
            <div className="hero-card-icon-circle green">
              <TrendingUp size={16} />
            </div>
          </div>
          <div className="hero-card-val text-green">{metrics.utilization?.value || '83.6%'}</div>
          <div className="hero-card-foot">
            <span className="hero-card-sub">Target 85% • Week Avg 87.2%</span>
            <div className="hero-spark-bars">
              {[45, 60, 68, 75, 84, 82, 84].map((v, i) => (
                <span key={i} style={{ height: `${v}%` }}></span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Section 1: Fleet Operations Command */}
      <div className="fleet-section-header">
        <div>
          <h2 className="fleet-section-title">Live Fleet Registry & Dispatch</h2>
          <p className="fleet-section-desc">Click any vehicle row to view full profile, telematics, and maintenance cards</p>
        </div>
      </div>

      {/* 3. Main Operational Split */}
      <div className="fleet-main-split-grid">
        {/* Left Section: Live Fleet Table */}
        <div className="fleet-card-container table-card-flex">
          <div className="table-card-top-bar">
            <div className="table-card-title-wrap">
              <h3 className="table-card-title">Monitored Vehicles</h3>
              <span className="table-card-count-tag">{vehicles?.length || 0} Assets</span>
            </div>

            <form className="fleet-search-form" onSubmit={handleSearchSubmit}>
              <Search size={14} className="search-icon-muted" />
              <input
                type="text"
                placeholder="Search vehicle number, driver, location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </form>
          </div>

          <div className="table-card-toolbar">
            <div className="quick-filter-pills">
              {[
                { id: 'all', label: 'All Fleet', count: summary?.metrics?.totalFleet?.value || 67 },
                { id: 'onroad', label: 'On Road', count: summary?.metrics?.onRoad?.value || 56 },
                { id: 'workshop', label: 'At Workshop', count: summary?.metrics?.atWorkshop?.value || 5 },
                { id: 'ready', label: 'Ready to Deploy', count: summary?.metrics?.readyToDeploy?.value || 3 },
                { id: 'breakdown', label: 'Breakdown', count: summary?.metrics?.breakdown?.value || 1 },
                { id: 'leave', label: 'Driver Leave / Non-Ops', count: 2 }
              ].map(f => (
                <button
                  key={f.id}
                  className={`filter-pill-btn ${activeFilter === f.id ? 'is-active' : ''}`}
                  onClick={() => setActiveFilter(f.id)}
                >
                  {f.label} ({f.count})
                </button>
              ))}
            </div>
          </div>

          {/* Vehicles Table */}
          <div className="fleet-table-wrapper">
            <table className="fleet-table">
              <thead>
                <tr>
                  <th>Vehicle No.</th>
                  <th>Assigned Driver</th>
                  <th>Status</th>
                  <th>Location</th>
                  <th>Since</th>
                  <th>Next Action</th>
                  <th style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {vehicles && vehicles.length > 0 ? (
                  vehicles.map(v => (
                    <tr 
                      key={v.id} 
                      className="fleet-table-row"
                      onClick={() => { setSelectedVehicle(v); setActiveModalTab('overview'); }}
                      title="Click to view detailed vehicle profile"
                    >
                      <td>
                        <div className="veh-reg-cell">
                          <strong>{v.registration}</strong>
                          <span className={`veh-type-tag ${v.type === 'EV' ? 'tag-ev' : 'tag-cng'}`}>{v.type}</span>
                        </div>
                      </td>
                      <td>
                        <div className="veh-driver-cell">
                          <span className="driver-name-text">{v.driver}</span>
                          <small className="muted-phone">{v.driverPhone}</small>
                        </div>
                      </td>
                      <td>
                        <span className={`status-badge-pill ${
                          v.status === 'On Road' ? 'status-green' :
                          v.status === 'At Workshop' ? 'status-amber' :
                          v.status === 'Ready to Deploy' ? 'status-blue' :
                          v.status === 'Breakdown' ? 'status-red' :
                          v.status === 'Driver On Leave' ? 'status-purple' : 'status-slate'
                        }`}>
                          {v.status}
                        </span>
                      </td>
                      <td>
                        <div className="location-text-cell">
                          <MapPin size={12} className="loc-pin-icon" />
                          <span>{v.location}</span>
                        </div>
                      </td>
                      <td>
                        <div className="duration-cell">
                          <span>{v.since}</span>
                          {v.duration && <small className="muted-duration">{v.duration}</small>}
                        </div>
                      </td>
                      <td>
                        <span className="next-action-text">{v.nextAction}</span>
                      </td>
                      <td>
                        <div className="row-action-btn-cell" onClick={(e) => e.stopPropagation()}>
                          {v.status === 'Ready to Deploy' && (
                            <button 
                              className="btn-action-pill primary"
                              onClick={() => handleExecuteAction(v.id, 'PUT_ON_ROAD')}
                            >
                              Put on Road
                            </button>
                          )}
                          {v.status === 'Breakdown' && (
                            <button 
                              className="btn-action-pill danger"
                              onClick={() => handleExecuteAction(v.id, 'ARRANGE_RECOVERY')}
                            >
                              Dispatch Tow
                            </button>
                          )}
                          {v.status === 'At Workshop' && (
                            <button 
                              className="btn-action-pill outline"
                              onClick={() => { setSelectedVehicle(v); setActiveModalTab('overview'); }}
                            >
                              Job Card
                            </button>
                          )}
                          {v.status === 'On Road' && (
                            <button 
                              className="btn-action-pill text-only"
                              onClick={() => { setSelectedVehicle(v); setActiveModalTab('overview'); }}
                            >
                              View Profile →
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '36px', color: '#64748b' }}>
                      No vehicles found matching filter "{activeFilter}".
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="fleet-table-footer">
            <span>Showing <strong>{vehicles?.length || 0}</strong> vehicles in {activeFilter.toUpperCase()} view</span>
            <button className="btn-view-all-link" onClick={() => onNavigate && onNavigate('vehicles')}>
              Open Full Vehicle Master Registry →
            </button>
          </div>
        </div>

        {/* Right Section: Action Queue & Driver Status */}
        <div className="fleet-side-col">
          {/* Action Required Queue */}
          <div className="fleet-card-container action-queue-card">
            <div className="panel-title-row">
              <div className="panel-title-with-badge">
                <h3>URGENT ACTIONS</h3>
                <span className="count-pill red">{actionRequired?.length || 8} Active</span>
              </div>
            </div>

            <div className="action-items-list">
              {actionRequired?.map(item => (
                <div 
                  key={item.id} 
                  className="action-queue-item"
                  onClick={() => {
                    if (item.type === 'ready-deploy') setActiveFilter('ready');
                    else if (item.type === 'service-due' || item.type === 'service-breached') setActiveFilter('workshop');
                    else if (item.type === 'offroad') setActiveFilter('workshop');
                  }}
                >
                  <div className="action-item-left">
                    <span className="action-item-icon">{item.icon}</span>
                    <span className="action-item-label">{item.label}</span>
                  </div>
                  <span className={`action-item-count ${item.status || ''}`}>
                    {item.count} ›
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Driver Status Card */}
          <div className="fleet-card-container driver-status-card">
            <div className="panel-title-row">
              <div className="panel-title-with-badge">
                <h3>DRIVER AVAILABILITY</h3>
                <span className="sub-text">{driverStatus?.total || 63} Drivers</span>
              </div>
            </div>

            {/* Visual Multi-Segment Duty Bar */}
            <div className="driver-duty-segmented-bar">
              <div className="bar-segment seg-green" style={{ width: '88%' }} title="On Duty: 56"></div>
              <div className="bar-segment seg-orange" style={{ width: '5%' }} title="On Leave: 3"></div>
              <div className="bar-segment seg-red" style={{ width: '2%' }} title="Suspended: 1"></div>
              <div className="bar-segment seg-purple" style={{ width: '5%' }} title="Standby: 3"></div>
            </div>

            <div className="driver-status-rows">
              <div className="driver-stat-row">
                <span className="driver-stat-left">
                  <span className="dot-indicator dot-green"></span>
                  <span>On Duty</span>
                </span>
                <strong>{driverStatus?.onDuty || 56} <span className="stat-pct">(88.9%)</span></strong>
              </div>
              <div className="driver-stat-row">
                <span className="driver-stat-left">
                  <span className="dot-indicator dot-orange"></span>
                  <span>On Leave</span>
                </span>
                <strong>{driverStatus?.onLeave || 3} <span className="stat-pct">(4.8%)</span></strong>
              </div>
              <div className="driver-stat-row">
                <span className="driver-stat-left">
                  <span className="dot-indicator dot-red"></span>
                  <span>Suspended</span>
                </span>
                <strong>{driverStatus?.suspended || 1} <span className="stat-pct">(1.6%)</span></strong>
              </div>
              <div className="driver-stat-row">
                <span className="driver-stat-left">
                  <span className="dot-indicator dot-purple"></span>
                  <span>Standby / Unassigned</span>
                </span>
                <strong>{driverStatus?.unassigned || 1} <span className="stat-pct">(1.6%)</span></strong>
              </div>
            </div>

            <button 
              className="btn-view-drivers"
              onClick={() => onNavigate && onNavigate('drivers')}
            >
              Open Driver Control Tower →
            </button>
          </div>
        </div>
      </div>

      {/* Section 2: Workshop Diagnostics & Compliance Matrix */}
      <div className="fleet-section-header" style={{ marginTop: '24px' }}>
        <div>
          <h2 className="fleet-section-title">Workshop Diagnostics & Hub Compliance</h2>
          <p className="fleet-section-desc">Live telemetry, workshop 6-gate maintenance progression, and RTO statutory compliance</p>
        </div>
      </div>

      {/* 4. Bottom Row: 3 Operational Matrices */}
      <div className="fleet-bottom-three-grid">
        {/* Maintenance 6-Stage Gate-Controlled Pipeline (Matching User Reference Image) */}
        <div className="fleet-card-container maint-pipeline-card">
          <div className="panel-title-row">
            <div className="pipeline-title-group">
              <h3 className="pipeline-title-heading">MAINTENANCE PIPELINE</h3>
              <span className="pipeline-gate-badge">Gate Controlled</span>
            </div>
            <span className="pipeline-turnaround-pill">
              <strong>23</strong> Active Assets • 18.4h Turnaround
            </span>
          </div>

          {/* 6 Clean Gate Pipeline Cards (Matching User Reference Image) */}
          <div className="pipeline-six-gate-cards">
            {[
              {
                step: '1',
                stage: 'Service Due',
                count: 7,
                colorClass: 'color-amber',
                filterTarget: 'workshop'
              },
              {
                step: '2',
                stage: 'Job Card Created',
                count: 4,
                colorClass: 'color-dark',
                filterTarget: 'workshop'
              },
              {
                step: '3',
                stage: 'At Workshop',
                count: 5,
                colorClass: 'color-orange',
                filterTarget: 'workshop'
              },
              {
                step: '4',
                stage: 'Work Completed',
                count: 2,
                colorClass: 'color-green',
                filterTarget: 'workshop'
              },
              {
                step: '5',
                stage: 'Closure Pending',
                count: 2,
                colorClass: 'color-red',
                filterTarget: 'workshop'
              },
              {
                step: '6',
                stage: 'Ready to Deploy',
                count: 3,
                colorClass: 'color-blue',
                filterTarget: 'ready'
              }
            ].map((g) => (
              <div 
                key={g.step}
                className={`pipeline-gate-box ${activeFilter === g.filterTarget ? 'is-active-gate' : ''}`}
                onClick={() => g.filterTarget && setActiveFilter(g.filterTarget)}
                title={`Filter by ${g.stage}: ${g.count} vehicles`}
              >
                <div className="pipeline-gate-step-circle">{g.step}</div>
                <div className="pipeline-gate-stage-name">{g.stage}</div>
                <div className={`pipeline-gate-count-num ${g.colorClass}`}>{g.count}</div>
              </div>
            ))}
          </div>

          {/* Bottom Notice Line */}
          <div className="pipeline-notice-bar">
            <span className="pipeline-notice-text">
              ⓘ Vehicles progress automatically as mechanics pass inspection checklist and QC.
            </span>
            <button className="pipeline-open-flow-btn" onClick={() => onNavigate && onNavigate('maintenance')}>
              Open Workshop Flow →
            </button>
          </div>
        </div>

        {/* Vehicle Compliance Matrix */}
        <div className="fleet-card-container">
          <div className="panel-title-row">
            <h3>VEHICLE COMPLIANCE</h3>
            <span className="badge-tag">RTO & Police</span>
          </div>

          <table className="compliance-mini-table">
            <thead>
              <tr>
                <th>Compliance Obligation</th>
                <th>Due</th>
                <th>Breached</th>
              </tr>
            </thead>
            <tbody>
              {compliance?.map((c, i) => (
                <tr key={i}>
                  <td>{c.type}</td>
                  <td className="text-amber"><strong>{c.due}</strong></td>
                  <td className={c.breached > 0 ? 'text-red font-bold' : 'text-muted'}>
                    {c.breached > 0 ? c.breached : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Vehicle Health & EV Telematics */}
        <div className="fleet-card-container">
          <div className="panel-title-row">
            <h3>VEHICLE HEALTH & TELEMATICS</h3>
            <span className="badge-tag green">IoT Live</span>
          </div>

          <div className="health-rows-list">
            {healthSnapshot?.map((h, i) => (
              <div key={i} className="health-stat-line">
                <span className="health-label">{h.label}</span>
                <span className={`health-count-badge ${h.status}`}>
                  {h.count}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 5. PERFECT PIXEL-ACCURATE VEHICLE DETAIL MODAL (Portaled directly to document.body for true center) */}
      {selectedVehicle && typeof document !== 'undefined' && createPortal(
        <div className="modal-overlay-backdrop" onClick={() => setSelectedVehicle(null)}>
          <div className="vehicle-profile-modal-window" onClick={(e) => e.stopPropagation()}>
            
            {/* Modal Header */}
            <div className="veh-modal-top-header">
              <div className="veh-modal-title-left">
                <div className="veh-modal-reg-row">
                  <h2 className="veh-modal-reg-num">{selectedVehicle.registration}</h2>
                  <span className={`veh-modal-fuel-badge ${selectedVehicle.type === 'EV' ? 'badge-ev' : 'badge-cng'}`}>
                    {selectedVehicle.type}
                  </span>
                  <span className={`veh-modal-status-badge ${
                    selectedVehicle.status === 'On Road' ? 'status-green' :
                    selectedVehicle.status === 'At Workshop' ? 'status-blue' :
                    selectedVehicle.status === 'Ready to Deploy' ? 'status-blue' :
                    selectedVehicle.status === 'Breakdown' ? 'status-red' : 'status-amber'
                  }`}>
                    {selectedVehicle.status === 'At Workshop' && <Wrench size={12} className="mr-1" />}
                    <span>{selectedVehicle.status}</span>
                  </span>
                </div>
                <div className="veh-modal-subline">
                  {selectedVehicle.model} • Chassis: {selectedVehicle.chassis}
                </div>
              </div>

              <button className="veh-modal-round-close" onClick={() => setSelectedVehicle(null)}>
                ×
              </button>
            </div>

            {/* Modal Body: 2-Column Balanced Grid */}
            <div className="veh-modal-split-body">
              
              {/* Left Column: Car Photo Card & Quick Specs */}
              <div className="veh-modal-left-col">
                <div className="veh-photo-card">
                  <img 
                    src={selectedVehicle.model?.includes('WAGONR') || selectedVehicle.type === 'CNG' ? '/images/wagonr.jpg' : '/images/tigor.jpg'} 
                    alt={selectedVehicle.model}
                    className="veh-photo-img"
                  />
                  <div className="veh-card-caption">
                    <h3 className="veh-caption-title">
                      {selectedVehicle.model?.includes('WAGONR') ? 'WAGONR H3' : 'TIGOR EV'}
                    </h3>
                    <span className="veh-caption-sub">
                      {selectedVehicle.type}
                    </span>
                  </div>
                </div>

                {/* Specs List */}
                <div className="veh-specs-vertical-list">
                  <div className="veh-spec-item">
                    <Car size={16} className="spec-icon" />
                    <div className="spec-text">
                      <label>Vehicle Number</label>
                      <strong>{selectedVehicle.registration}</strong>
                    </div>
                  </div>

                  <div className="veh-spec-item">
                    <Cpu size={16} className="spec-icon" />
                    <div className="spec-text">
                      <label>Chassis Number</label>
                      <strong>{selectedVehicle.chassis}</strong>
                    </div>
                  </div>

                  <div className="veh-spec-item">
                    <Calendar size={16} className="spec-icon" />
                    <div className="spec-text">
                      <label>Make & Model</label>
                      <strong>{selectedVehicle.model}</strong>
                    </div>
                  </div>

                  <div className="veh-spec-item">
                    <Tag size={16} className="spec-icon" />
                    <div className="spec-text">
                      <label>Fuel Type</label>
                      <strong className="text-green">
                        {selectedVehicle.type === 'EV' ? 'EV Battery' : 'CNG System'}
                      </strong>
                    </div>
                  </div>

                  <div className="veh-spec-item">
                    <Gauge size={16} className="spec-icon" />
                    <div className="spec-text">
                      <label>Odometer</label>
                      <strong>{selectedVehicle.odometer}</strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Tab Bar & Tab Content */}
              <div className="veh-modal-right-col">
                {/* Horizontal Tab Bar */}
                <div className="veh-tab-nav-bar">
                  <button 
                    className={`veh-tab-btn ${activeModalTab === 'overview' ? 'is-active' : ''}`}
                    onClick={() => setActiveModalTab('overview')}
                  >
                    <Layout size={15} />
                    <span>Overview</span>
                  </button>
                  <span className="veh-tab-pipe">|</span>

                  <button 
                    className={`veh-tab-btn ${activeModalTab === 'driver' ? 'is-active' : ''}`}
                    onClick={() => setActiveModalTab('driver')}
                  >
                    <User size={15} />
                    <span>Driver & Assignment</span>
                  </button>
                  <span className="veh-tab-pipe">|</span>

                  <button 
                    className={`veh-tab-btn ${activeModalTab === 'compliance' ? 'is-active' : ''}`}
                    onClick={() => setActiveModalTab('compliance')}
                  >
                    <Shield size={15} />
                    <span>Compliance</span>
                  </button>
                  <span className="veh-tab-pipe">|</span>

                  <button 
                    className={`veh-tab-btn ${activeModalTab === 'finance' ? 'is-active' : ''}`}
                    onClick={() => setActiveModalTab('finance')}
                  >
                    <CreditCard size={15} />
                    <span>Finance</span>
                  </button>
                  <span className="veh-tab-pipe">|</span>

                  <button 
                    className={`veh-tab-btn ${activeModalTab === 'notes' ? 'is-active' : ''}`}
                    onClick={() => setActiveModalTab('notes')}
                  >
                    <FileText size={15} />
                    <span>Notes</span>
                  </button>
                </div>

                {/* Tab 1: OVERVIEW (Matching Screenshot Exactly) */}
                {activeModalTab === 'overview' && (
                  <div className="veh-tab-pane-content">
                    {/* Section 1: Key Information (3 Cards) */}
                    <div className="veh-section-block">
                      <h4 className="veh-section-heading">Key Information</h4>
                      <div className="key-info-triplet-grid">
                        <div className="key-info-card">
                          <div className="key-info-circle-icon bg-green-light text-green">
                            <Fuel size={18} />
                          </div>
                          <div className="key-info-text">
                            <span className="key-info-lbl">Fuel System</span>
                            <strong className="key-info-val text-green">
                              {selectedVehicle.type === 'EV' ? selectedVehicle.battery : 'CNG System'}
                            </strong>
                          </div>
                        </div>

                        <div className="key-info-card">
                          <div className="key-info-circle-icon bg-blue-light text-blue">
                            <Gauge size={18} />
                          </div>
                          <div className="key-info-text">
                            <span className="key-info-lbl">Odometer</span>
                            <strong className="key-info-val">{selectedVehicle.odometer}</strong>
                          </div>
                        </div>

                        <div className="key-info-card">
                          <div className="key-info-circle-icon bg-blue-light text-blue">
                            <Shield size={18} />
                          </div>
                          <div className="key-info-text">
                            <span className="key-info-lbl">Health Status</span>
                            <div className="key-info-health-badge">
                              {selectedVehicle.healthStatus === 'good' ? (
                                <span className="health-badge-pill green">✓ Healthy</span>
                              ) : (
                                <span className="health-badge-pill amber">⚠️ Attention Required</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Section 2: Driver & Assignment */}
                    <div className="veh-section-block">
                      <div className="veh-section-head-row">
                        <h4 className="veh-section-heading">Driver & Assignment</h4>
                        <button className="link-arrow-btn" onClick={() => setActiveModalTab('driver')}>
                          View Details →
                        </button>
                      </div>

                      <div className="driver-location-split-card">
                        <div className="split-half-col">
                          <div className="round-avatar-blue">
                            <User size={18} />
                          </div>
                          <div className="split-col-text">
                            <span className="col-sublabel">Assigned Driver</span>
                            <strong className="col-main-val">{selectedVehicle.driver}</strong>
                            <div className="col-subval-phone">
                              <Phone size={12} className="inline mr-1" />
                              <span>{selectedVehicle.driverPhone}</span>
                            </div>
                          </div>
                        </div>

                        <div className="split-col-divider"></div>

                        <div className="split-half-col">
                          <div className="round-avatar-blue">
                            <MapPin size={18} />
                          </div>
                          <div className="split-col-text">
                            <span className="col-sublabel">Current Location</span>
                            <strong className="col-main-val">{selectedVehicle.location}</strong>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Section 3: Compliance & Financing (4 Cards) */}
                    <div className="veh-section-block">
                      <div className="veh-section-head-row">
                        <h4 className="veh-section-heading">Compliance & Financing</h4>
                        <button className="link-arrow-btn" onClick={() => setActiveModalTab('compliance')}>
                          View Details →
                        </button>
                      </div>

                      <div className="compliance-finance-quartet-grid">
                        <div className="mini-comp-card">
                          <div className="mini-comp-icon-circle bg-blue-light text-blue">
                            <Shield size={16} />
                          </div>
                          <div className="mini-comp-body">
                            <span className="mini-comp-label">Insurance Policy</span>
                            <span className="mini-comp-sub">Valid till</span>
                            <strong className="mini-comp-date text-green">{selectedVehicle.insurance.replace('Valid · ', '')}</strong>
                          </div>
                        </div>

                        <div className="mini-comp-card">
                          <div className="mini-comp-icon-circle bg-blue-light text-blue">
                            <FileText size={16} />
                          </div>
                          <div className="mini-comp-body">
                            <span className="mini-comp-label">State Permit</span>
                            <span className="mini-comp-sub">Valid till</span>
                            <strong className="mini-comp-date text-green">{selectedVehicle.permit.replace('Valid · ', '')}</strong>
                          </div>
                        </div>

                        <div className="mini-comp-card">
                          <div className="mini-comp-icon-circle bg-green-light text-green">
                            <CheckCircle2 size={16} />
                          </div>
                          <div className="mini-comp-body">
                            <span className="mini-comp-label">Fitness Certificate</span>
                            <span className="mini-comp-sub">Valid till</span>
                            <strong className="mini-comp-date text-green">{selectedVehicle.fitness.replace('Valid · ', '')}</strong>
                          </div>
                        </div>

                        <div className="mini-comp-card">
                          <div className="mini-comp-icon-circle bg-blue-light text-blue">
                            <IndianRupee size={16} />
                          </div>
                          <div className="mini-comp-body">
                            <span className="mini-comp-label">Financing Lender</span>
                            <strong className="mini-comp-val">{selectedVehicle.lender}</strong>
                            <span className="mini-comp-sub">{selectedVehicle.monthlyEmi} / month</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Section 4: Operational Notes */}
                    <div className="veh-section-block">
                      <h4 className="veh-section-heading">Operational Notes</h4>
                      <div className="notes-blue-banner-card">
                        <FileText size={18} className="notes-icon text-blue flex-shrink-0" />
                        <span className="notes-message-text">{selectedVehicle.notes}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Tab 2: DRIVER & ASSIGNMENT DETAILS */}
                {activeModalTab === 'driver' && (
                  <div className="veh-tab-pane-content">
                    <div className="veh-section-block">
                      <h4 className="veh-section-heading">Full Driver Profile & Assignment</h4>
                      <div className="driver-location-split-card" style={{ marginBottom: '14px' }}>
                        <div className="split-half-col">
                          <div className="round-avatar-blue">
                            <User size={20} />
                          </div>
                          <div className="split-col-text">
                            <span className="col-sublabel">Primary Assigned Driver</span>
                            <strong className="col-main-val" style={{ fontSize: '16px' }}>{selectedVehicle.driver}</strong>
                            <div className="col-subval-phone">{selectedVehicle.driverPhone}</div>
                          </div>
                        </div>
                        <div className="split-col-divider"></div>
                        <div className="split-half-col">
                          <div className="split-col-text">
                            <span className="col-sublabel">KYC Verification State</span>
                            <strong className="text-green">✓ Aadhaar & Driving Licence Approved</strong>
                            <span className="text-muted text-xs">Background check cleared via UIDAI gateway</span>
                          </div>
                        </div>
                      </div>

                      <div className="key-info-triplet-grid">
                        <div className="key-info-card">
                          <span className="key-info-lbl">Assignment Rule</span>
                          <strong className="text-blue">1:1 Primary Vehicle Link</strong>
                        </div>
                        <div className="key-info-card">
                          <span className="key-info-lbl">Driver Wallet Health</span>
                          <strong className="text-green">₹2,100 (Healthy)</strong>
                        </div>
                        <div className="key-info-card">
                          <span className="key-info-lbl">Current Shift State</span>
                          <strong>{selectedVehicle.driverStatus}</strong>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Tab 3: COMPLIANCE CERTIFICATES */}
                {activeModalTab === 'compliance' && (
                  <div className="veh-tab-pane-content">
                    <div className="veh-section-block">
                      <h4 className="veh-section-heading">Vehicle Compliance & Transport Documents</h4>
                      <div className="compliance-finance-quartet-grid">
                        <div className="mini-comp-card">
                          <span className="mini-comp-label">Insurance Policy</span>
                          <strong className="text-green">{selectedVehicle.insurance}</strong>
                          <button className="btn-tower-secondary text-xs mt-2" style={{ height: '26px' }}>View Policy PDF</button>
                        </div>
                        <div className="mini-comp-card">
                          <span className="mini-comp-label">State Tourist Permit</span>
                          <strong className="text-green">{selectedVehicle.permit}</strong>
                          <button className="btn-tower-secondary text-xs mt-2" style={{ height: '26px' }}>View Permit</button>
                        </div>
                        <div className="mini-comp-card">
                          <span className="mini-comp-label">RTO Fitness Cert</span>
                          <strong className="text-green">{selectedVehicle.fitness}</strong>
                          <button className="btn-tower-secondary text-xs mt-2" style={{ height: '26px' }}>Fitness Report</button>
                        </div>
                        <div className="mini-comp-card">
                          <span className="mini-comp-label">Pollution (PUC)</span>
                          <strong className="text-green">{selectedVehicle.puc}</strong>
                          <button className="btn-tower-secondary text-xs mt-2" style={{ height: '26px' }}>PUC Certificate</button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Tab 4: FINANCE & EMI */}
                {activeModalTab === 'finance' && (
                  <div className="veh-tab-pane-content">
                    <div className="veh-section-block">
                      <h4 className="veh-section-heading">Asset Financing & Revenue Coverage</h4>
                      <div className="key-info-triplet-grid">
                        <div className="key-info-card">
                          <span className="key-info-lbl">Financing Lender</span>
                          <strong className="text-blue">{selectedVehicle.lender}</strong>
                        </div>
                        <div className="key-info-card">
                          <span className="key-info-lbl">Monthly Loan EMI</span>
                          <strong className="text-slate">{selectedVehicle.monthlyEmi}</strong>
                        </div>
                        <div className="key-info-card">
                          <span className="key-info-lbl">EMI Coverage Ratio</span>
                          <strong className="text-green">148% (Collections Cover EMI)</strong>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Tab 5: NOTES & WORKSHOP TIMELINE */}
                {activeModalTab === 'notes' && (
                  <div className="veh-tab-pane-content">
                    <div className="veh-section-block">
                      <h4 className="veh-section-heading">Operational Notes & Maintenance History</h4>
                      <div className="notes-blue-banner-card" style={{ marginBottom: '14px' }}>
                        <FileText size={18} className="notes-icon text-blue flex-shrink-0" />
                        <span className="notes-message-text">{selectedVehicle.notes}</span>
                      </div>
                      <div className="key-info-card">
                        <span className="key-info-lbl">Recent Service History</span>
                        <p className="text-xs text-muted mt-1">
                          Previous 30,000 km periodic inspection completed at ABC Motors on 12 June 2026. Brake fluid and coolant replaced.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
