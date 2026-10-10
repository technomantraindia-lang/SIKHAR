import React, { useState, useEffect, useCallback } from 'react';
import {
  Search,
  Plus,
  Activity,
  AlertTriangle,
  CheckCircle2,
  MapPin,
  Users,
  Fuel,
  ChevronRight,
  Zap
} from '../common/Icons';
import { fetchFleetTowerApi } from '../../services/api';

export default function VehicleMasterPage({ onSelectVehicle, onOpenAddVehicle, onBackToDashboard }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [vehicles, setVehicles] = useState([]);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // all, onroad, workshop, ready, breakdown, leave, nonops
  const [powertrainFilter, setPowertrainFilter] = useState('all'); // all, EV, CNG
  const [healthFilter, setHealthFilter] = useState('all'); // all, Healthy, Attention Required, Critical
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadVehicleData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchFleetTowerApi('all', searchQuery);
      if (data && data.vehicles) {
        setVehicles(data.vehicles);
      }
    } catch (err) {
      console.error('Failed to load vehicle registry:', err);
      setError('Unable to load vehicle master records. Please verify backend connection.');
    } finally {
      setLoading(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    loadVehicleData();
  }, [loadVehicleData]);

  // Filter logic
  const filteredVehicles = vehicles.filter(v => {
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      const matchSearch =
        (v.registration && v.registration.toLowerCase().includes(q)) ||
        (v.model && v.model.toLowerCase().includes(q)) ||
        (v.driver && v.driver.toLowerCase().includes(q)) ||
        (v.location && v.location.toLowerCase().includes(q)) ||
        (v.chassis && v.chassis.toLowerCase().includes(q)) ||
        (v.lender && v.lender.toLowerCase().includes(q));
      if (!matchSearch) return false;
    }

    if (statusFilter !== 'all') {
      const s = (v.status || '').toLowerCase();
      if (statusFilter === 'onroad' && !s.includes('road')) return false;
      if (statusFilter === 'workshop' && !s.includes('workshop')) return false;
      if (statusFilter === 'ready' && !s.includes('ready')) return false;
      if (statusFilter === 'breakdown' && !s.includes('breakdown')) return false;
      if (statusFilter === 'leave' && !s.includes('leave')) return false;
      if (statusFilter === 'nonops' && !s.includes('non-ops') && !s.includes('hold')) return false;
    }

    if (powertrainFilter !== 'all') {
      if (v.type !== powertrainFilter) return false;
    }

    if (healthFilter !== 'all') {
      if (v.health !== healthFilter) return false;
    }

    return true;
  });

  // Dynamic counts for status tabs
  const counts = {
    all: vehicles.length,
    onroad: vehicles.filter(v => (v.status || '').toLowerCase().includes('road')).length,
    workshop: vehicles.filter(v => (v.status || '').toLowerCase().includes('workshop')).length,
    ready: vehicles.filter(v => (v.status || '').toLowerCase().includes('ready')).length,
    breakdown: vehicles.filter(v => (v.status || '').toLowerCase().includes('breakdown')).length,
    leave: vehicles.filter(v => (v.status || '').toLowerCase().includes('leave')).length,
    nonops: vehicles.filter(v => (v.status || '').toLowerCase().includes('non-ops') || (v.status || '').toLowerCase().includes('hold')).length,
    ev: vehicles.filter(v => v.type === 'EV').length,
    cng: vehicles.filter(v => v.type === 'CNG').length,
    attention: vehicles.filter(v => v.health === 'Attention Required' || v.health === 'Critical').length
  };

  return (
    <div className="terminal-content vehicle-master-stage">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="clean-toast-notification">
          <CheckCircle2 size={16} color="#0284c7" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header */}
      <div className="command-header">
        <div>
          <div className="breadcrumb-nav">
            <span className="breadcrumb-link" onClick={() => onBackToDashboard && onBackToDashboard()}>Dashboard</span>
            <ChevronRight size={13} className="breadcrumb-sep" />
            <span className="breadcrumb-active">Vehicles</span>
          </div>
          <h1 className="executive-greeting" style={{ marginTop: '4px' }}>
            Vehicle Master Registry
          </h1>
          <div className="executive-subline">
            Complete fleet inventory · Real-time battery &amp; telemetry · Driver assignment · Compliance &amp; EMI yield
          </div>
        </div>

        <div className="command-actions-row">
          <button 
            className="btn secondary"
            onClick={() => {
              loadVehicleData();
              showToast('Telematics synchronized with live IoT gateway.');
            }}
            title="Refresh telematics data"
          >
            <Activity size={15} />
            <span>Sync Telemetry</span>
          </button>
          <button 
            className="btn primary"
            onClick={() => onOpenAddVehicle && onOpenAddVehicle()}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Plus size={15} />
            <span>+ Onboard Vehicle</span>
          </button>
        </div>
      </div>

      {/* Top Quick Stats Strip */}
      <div className="vm-summary-strip">
        <div className="vm-stat-pill">
          <span className="vm-stat-label">Total Assets:</span>
          <strong className="vm-stat-value">{counts.all}</strong>
        </div>
        <div className="vm-stat-divider" />
        <div className="vm-stat-pill">
          <span className="pulse-dot green" />
          <span className="vm-stat-label">On Road:</span>
          <strong className="vm-stat-value green">{counts.onroad}</strong>
          <span className="vm-stat-sub">({counts.all > 0 ? Math.round((counts.onroad / counts.all) * 100) : 0}%)</span>
        </div>
        <div className="vm-stat-divider" />
        <div className="vm-stat-pill">
          <span className="pulse-dot amber" />
          <span className="vm-stat-label">At Workshop:</span>
          <strong className="vm-stat-value amber">{counts.workshop}</strong>
        </div>
        <div className="vm-stat-divider" />
        <div className="vm-stat-pill">
          <span className="pulse-dot cyan" />
          <span className="vm-stat-label">Ready Yard Stock:</span>
          <strong className="vm-stat-value cyan">{counts.ready}</strong>
        </div>
        <div className="vm-stat-divider" />
        <div className="vm-stat-pill">
          <span className="pulse-dot red" />
          <span className="vm-stat-label">Breakdown:</span>
          <strong className="vm-stat-value red">{counts.breakdown}</strong>
        </div>
        <div className="vm-stat-divider" />
        <div className="vm-stat-pill">
          <span className="vm-stat-label">Powertrain:</span>
          <span className="vm-stat-sub">{counts.ev} EV · {counts.cng} CNG</span>
        </div>
      </div>

      {/* Modern Filter & Search Bar */}
      <div className="vm-toolbar-container">
        {/* Status Tabs Navigation */}
        <div className="vm-status-segmented-bar">
          {[
            { id: 'all', label: 'All Fleet', count: counts.all },
            { id: 'onroad', label: 'On Road', count: counts.onroad },
            { id: 'workshop', label: 'Workshop', count: counts.workshop },
            { id: 'ready', label: 'Ready to Deploy', count: counts.ready },
            { id: 'breakdown', label: 'Breakdown', count: counts.breakdown },
            { id: 'leave', label: 'Driver Leave', count: counts.leave },
            { id: 'nonops', label: 'Non-Ops Hold', count: counts.nonops }
          ].map(tab => (
            <button
              key={tab.id}
              className={`vm-status-tab ${statusFilter === tab.id ? 'active' : ''}`}
              onClick={() => setStatusFilter(tab.id)}
            >
              <span>{tab.label}</span>
              <span className="vm-tab-count">{tab.count}</span>
            </button>
          ))}
        </div>

        {/* Secondary Filter Line: Search + Powertrain + Health + View Toggle */}
        <div className="vm-search-filter-row">
          <div className="vm-search-input-wrap">
            <Search size={15} color="#94a3b8" />
            <input
              type="text"
              placeholder="Search by plate (e.g. DL52GD), model, driver, hub..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button className="vm-clear-btn" onClick={() => setSearchQuery('')}>✕</button>
            )}
          </div>

          <div className="vm-filters-right">
            {/* Powertrain Filter */}
            <div className="vm-mini-segmented">
              <button
                className={`vm-mini-tab ${powertrainFilter === 'all' ? 'active' : ''}`}
                onClick={() => setPowertrainFilter('all')}
              >
                All Fuel
              </button>
              <button
                className={`vm-mini-tab ${powertrainFilter === 'EV' ? 'active' : ''}`}
                onClick={() => setPowertrainFilter('EV')}
              >
                ⚡ EV
              </button>
              <button
                className={`vm-mini-tab ${powertrainFilter === 'CNG' ? 'active' : ''}`}
                onClick={() => setPowertrainFilter('CNG')}
              >
                ⛽ CNG
              </button>
            </div>

            {/* Health Filter */}
            <div className="vm-mini-segmented">
              <button
                className={`vm-mini-tab ${healthFilter === 'all' ? 'active' : ''}`}
                onClick={() => setHealthFilter('all')}
              >
                All Health
              </button>
              <button
                className={`vm-mini-tab green ${healthFilter === 'Healthy' ? 'active' : ''}`}
                onClick={() => setHealthFilter('Healthy')}
              >
                Healthy
              </button>
              <button
                className={`vm-mini-tab amber ${healthFilter === 'Attention Required' ? 'active' : ''}`}
                onClick={() => setHealthFilter('Attention Required')}
              >
                Attention ({counts.attention})
              </button>
            </div>

            {/* View Mode Toggle */}
            <div className="vm-view-toggle">
              <button
                className={`vm-view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                onClick={() => setViewMode('grid')}
                title="Cards View"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M3 3h8v8H3zM13 3h8v8h-8zM3 13h8v8H3zM13 13h8v8h-8z"/>
                </svg>
                <span>Cards</span>
              </button>
              <button
                className={`vm-view-btn ${viewMode === 'table' ? 'active' : ''}`}
                onClick={() => setViewMode('table')}
                title="Table View"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M3 4h18v2H3zm0 7h18v2H3zm0 7h18v2H3z"/>
                </svg>
                <span>Table</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid or Table Stage */}
      {loading ? (
        <div className="vm-empty-state-box">
          <div className="spinner" style={{ margin: '0 auto 14px' }}></div>
          <h4>Synchronizing Vehicle Registry...</h4>
          <p>Connecting live telematics, assignment ledger, and RTO databases.</p>
        </div>
      ) : error ? (
        <div className="vm-empty-state-box error">
          <AlertTriangle size={32} color="#dc2626" style={{ margin: '0 auto 10px' }} />
          <h4>{error}</h4>
          <button className="btn primary" onClick={loadVehicleData} style={{ marginTop: '12px' }}>
            Retry
          </button>
        </div>
      ) : filteredVehicles.length === 0 ? (
        <div className="vm-empty-state-box">
          <div style={{ fontSize: '36px', marginBottom: '8px' }}>🚗</div>
          <h4>No Vehicles Found</h4>
          <p>No vehicles match the selected filter criteria. Try resetting filters.</p>
          <button 
            className="btn secondary"
            onClick={() => {
              setSearchQuery('');
              setStatusFilter('all');
              setPowertrainFilter('all');
              setHealthFilter('all');
            }}
            style={{ marginTop: '12px' }}
          >
            Reset Filters
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        /* ================= CLEAN VEHICLE CARD GRID ================= */
        <div className="clean-vehicle-grid">
          {filteredVehicles.map(vehicle => {
            const isEv = vehicle.type === 'EV';
            const batteryNum = parseInt(vehicle.battery) || (isEv ? 85 : 75);
            
            // Clean status theme
            let statusTheme = 'blue';
            let statusText = vehicle.status;
            if (vehicle.status === 'On Road') {
              statusTheme = 'green';
            } else if (vehicle.status.includes('Workshop')) {
              statusTheme = 'amber';
            } else if (vehicle.status.includes('Breakdown')) {
              statusTheme = 'red';
            } else if (vehicle.status.includes('Leave')) {
              statusTheme = 'purple';
            } else if (vehicle.status.includes('Non-Ops')) {
              statusTheme = 'muted';
            }

            const isAssigned = vehicle.driver && vehicle.driver !== 'Unassigned';

            return (
              <div
                key={vehicle.id}
                className="clean-vehicle-card"
                onClick={() => onSelectVehicle && onSelectVehicle(vehicle.id)}
              >
                {/* 1. Card Top Header: Clean HSRP Plate & Status Pill */}
                <div className="cvc-top-bar">
                  <div className="cvc-plate-pill">
                    <span className="cvc-plate-ind">IND</span>
                    <span className="cvc-plate-num">{vehicle.registration}</span>
                  </div>

                  <div className="cvc-badge-group">
                    <span className={`cvc-type-tag ${isEv ? 'ev' : 'cng'}`}>
                      {isEv ? '⚡ EV' : '⛽ CNG'}
                    </span>
                    <span className={`cvc-status-pill ${statusTheme}`}>
                      <span className={`pulse-dot ${statusTheme}`} />
                      {statusText}
                    </span>
                  </div>
                </div>

                {/* 2. Vehicle Title & Location Subline */}
                <div className="cvc-title-block">
                  <h3 className="cvc-model-name">{vehicle.model}</h3>
                  <div className="cvc-location-line">
                    <MapPin size={12} color="#94a3b8" />
                    <span title={vehicle.location}>{vehicle.location?.split('·')[0] || vehicle.location || 'Central Yard'}</span>
                    <span className="cvc-bullet">•</span>
                    <span>{vehicle.odometer}</span>
                  </div>
                </div>

                {/* 3. Clean Energy / Telemetry Metric */}
                <div className="cvc-energy-box">
                  <div className="cvc-energy-row">
                    <div className="cvc-energy-label">
                      {isEv ? <Zap size={13} color="#0284c7" /> : <Fuel size={13} color="#d97706" />}
                      <span>{isEv ? 'Battery Charge (SOC)' : 'CNG Level'}</span>
                    </div>
                    <strong className="cvc-energy-pct">{vehicle.battery}</strong>
                  </div>

                  <div className="cvc-meter-track">
                    <div 
                      className={`cvc-meter-bar ${isEv ? (batteryNum < 20 ? 'red' : batteryNum < 40 ? 'amber' : 'green') : 'cng'}`}
                      style={{ width: `${Math.min(100, Math.max(10, batteryNum))}%` }}
                    />
                  </div>

                  <div className="cvc-range-sub">
                    <span>Est. Range ~{Math.round(batteryNum * (isEv ? 2.1 : 1.8))} km</span>
                    <span className={`cvc-health-text ${vehicle.healthStatus || 'good'}`}>
                      ● {vehicle.health || 'Healthy'}
                    </span>
                  </div>
                </div>

                {/* 4. Driver Assignment Line */}
                <div className="cvc-driver-box">
                  <div className="cvc-driver-left">
                    <div className="cvc-driver-icon">
                      <Users size={14} color="#64748b" />
                    </div>
                    <div className="cvc-driver-meta">
                      <span className="cvc-driver-name">
                        {isAssigned ? vehicle.driver : 'Unassigned (Yard Stock)'}
                      </span>
                      {isAssigned && vehicle.driverPhone && (
                        <span className="cvc-driver-sub">{vehicle.driverPhone}</span>
                      )}
                    </div>
                  </div>

                  <span className={`cvc-assignment-badge ${isAssigned ? 'assigned' : 'idle'}`}>
                    {isAssigned ? '24h Shift' : 'Idle Yard'}
                  </span>
                </div>

                {/* 5. Minimal Clean Footer */}
                <div className="cvc-card-footer">
                  <div className="cvc-next-info">
                    <span className="cvc-next-title">Next:</span>
                    <span className="cvc-next-desc" title={vehicle.nextAction}>
                      {vehicle.nextAction || 'Operating normally'}
                    </span>
                  </div>

                  <div className="cvc-link-arrow">
                    <span>View 360° Profile</span>
                    <ChevronRight size={14} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* ================= EXECUTIVE TABLE VIEW ================= */
        <div className="terminal-panel fleet-table-panel" style={{ marginTop: '0' }}>
          <div className="table-responsive">
            <table className="terminal-data-table vehicle-master-table">
              <thead>
                <tr>
                  <th>Vehicle &amp; Registration</th>
                  <th>Powertrain &amp; Fuel</th>
                  <th>Operational Status</th>
                  <th>Health</th>
                  <th>Assigned Driver</th>
                  <th>Odometer &amp; Hub</th>
                  <th>Financing EMI</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredVehicles.map(vehicle => {
                  const isEv = vehicle.type === 'EV';
                  const batteryVal = parseInt(vehicle.battery) || 80;

                  let statusTheme = 'blue';
                  if (vehicle.status === 'On Road') statusTheme = 'green';
                  else if (vehicle.status.includes('Workshop')) statusTheme = 'amber';
                  else if (vehicle.status.includes('Breakdown')) statusTheme = 'red';
                  else if (vehicle.status.includes('Leave')) statusTheme = 'purple';
                  else if (vehicle.status.includes('Non-Ops')) statusTheme = 'muted';

                  return (
                    <tr
                      key={vehicle.id}
                      className="table-row-clickable"
                      onClick={() => onSelectVehicle && onSelectVehicle(vehicle.id)}
                    >
                      <td>
                        <div className="table-vehicle-cell">
                          <div className="table-hsrp-badge">
                            <div className="table-hsrp-ind">
                              <span>IND</span>
                            </div>
                            <span className="table-hsrp-number">{vehicle.registration}</span>
                          </div>
                          <span className="table-vehicle-model">{vehicle.model}</span>
                        </div>
                      </td>

                      <td>
                        <div className="table-powertrain-cell">
                          <span className={`table-fuel-badge ${isEv ? 'ev' : 'cng'}`}>
                            {isEv ? <Zap size={11} /> : <Fuel size={11} />}
                            <span>{isEv ? 'EV' : 'CNG'}</span>
                          </span>
                          <div className="table-energy-meter">
                            <span className="table-energy-pct">{vehicle.battery}</span>
                            <div className="table-energy-track">
                              <div
                                className={`table-energy-fill ${isEv ? (batteryVal < 25 ? 'critical' : batteryVal < 50 ? 'warning' : 'healthy') : 'cng'}`}
                                style={{ width: `${Math.min(100, Math.max(12, batteryVal))}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      </td>

                      <td>
                        <span className={`table-status-pill ${statusTheme}`}>
                          <span className={`table-status-dot ${statusTheme}`} />
                          <span>{vehicle.status}</span>
                        </span>
                      </td>

                      <td>
                        {(() => {
                          const healthText = vehicle.health || 'Healthy';
                          const isCritical = healthText.toLowerCase().includes('critical');
                          const isWarning = healthText.toLowerCase().includes('attention');
                          const healthClass = isCritical ? 'critical' : isWarning ? 'warning' : 'healthy';
                          return (
                            <span className={`table-health-pill ${healthClass}`}>
                              <span className="health-dot" />
                              <span>{healthText}</span>
                            </span>
                          );
                        })()}
                      </td>

                      <td>
                        {vehicle.driver && vehicle.driver !== 'Unassigned' && vehicle.driver !== 'Yard Inventory' ? (
                          <div className="table-driver-cell">
                            <div className="table-driver-avatar">
                              {vehicle.driver.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                            </div>
                            <div className="table-driver-info">
                              <span className="table-driver-name">{vehicle.driver}</span>
                              <span className="table-driver-phone">{vehicle.driverPhone || '—'}</span>
                            </div>
                          </div>
                        ) : (
                          <span className="table-yard-pill">
                            <span className="yard-dot" />
                            <span>Yard Inventory</span>
                          </span>
                        )}
                      </td>

                      <td>
                        <div className="table-hub-cell">
                          <span className="table-odo-val">{vehicle.odometer}</span>
                          <div className="table-hub-sub">
                            <MapPin size={11} className="table-hub-pin" />
                            <span className="table-hub-name">{vehicle.location?.split('·')[0]?.trim() || 'Central Yard'}</span>
                          </div>
                        </div>
                      </td>

                      <td>
                        <div className="table-finance-cell">
                          <span className="table-emi-val">{vehicle.monthlyEmi || '₹21,000'}</span>
                          <span className="table-lender-name">{vehicle.lender || 'Signo Financing'}</span>
                        </div>
                      </td>

                      <td style={{ textAlign: 'right' }}>
                        <button
                          type="button"
                          className="table-action-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onSelectVehicle) {
                              onSelectVehicle(vehicle.id);
                            }
                          }}
                        >
                          <span>View 360° Specs</span>
                          <ChevronRight size={13} className="action-arrow" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="fleet-table-footer">
            <span>Showing <strong>{filteredVehicles.length}</strong> of <strong>{vehicles.length}</strong> vehicles</span>
            <span style={{ color: '#64748b', fontSize: '12px' }}>Click any row to open full 360° Vehicle Profile</span>
          </div>
        </div>
      )}
    </div>
  );
}
