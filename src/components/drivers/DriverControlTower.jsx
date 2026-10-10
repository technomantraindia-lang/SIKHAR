import React, { useState, useEffect, useCallback } from 'react';
import {
  Search,
  Users,
  UserCheck,
  Clock,
  Car,
  Phone,
  CreditCard,
  AlertTriangle,
  ChevronRight,
  Plus,
  RefreshCw,
  Award
} from '../common/Icons';
import { fetchDriversApi } from '../../services/api';
import DriverDetailPage from './DriverDetailPage';
import FleetLiveLocationMap from './FleetLiveLocationMap';
import AddDriverPage from './AddDriverPage';
import AllDriversListPage from './AllDriversListPage';

export default function DriverControlTower() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    summary: {},
    actionQueue: [],
    drivers: []
  });
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Persisted view states across browser refreshes
  const [selectedDriverId, setSelectedDriverId] = useState(() => {
    try {
      return localStorage.getItem('sikhar_driver_selected_id') || null;
    } catch {
      return null;
    }
  });

  const [showAddPage, setShowAddPage] = useState(() => {
    try {
      return localStorage.getItem('sikhar_driver_view_mode') === 'add';
    } catch {
      return false;
    }
  });

  const [showAllDriversPage, setShowAllDriversPage] = useState(() => {
    try {
      return localStorage.getItem('sikhar_driver_view_mode') === 'all';
    } catch {
      return false;
    }
  });

  const [actionToast, setActionToast] = useState(null);

  // Load Driver Data
  const loadDrivers = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetchDriversApi(activeFilter, 'all', searchQuery);
      setData(res);
    } catch (err) {
      console.error('Failed to load drivers:', err);
    } finally {
      setLoading(false);
    }
  }, [activeFilter, searchQuery]);

  useEffect(() => {
    loadDrivers();
  }, [loadDrivers]);

  // Show temporary action toast
  const triggerToast = (msg) => {
    setActionToast(msg);
    setTimeout(() => setActionToast(null), 3000);
  };

  const handleSelectDriver = (id) => {
    setSelectedDriverId(id);
    try {
      localStorage.setItem('sikhar_driver_selected_id', id);
    } catch {
      // ignore
    }
  };

  const handleBackToTower = () => {
    setSelectedDriverId(null);
    setShowAllDriversPage(false);
    setShowAddPage(false);
    try {
      localStorage.removeItem('sikhar_driver_selected_id');
      localStorage.removeItem('sikhar_driver_view_mode');
    } catch {
      // ignore
    }
  };

  const handleOpenAllDrivers = () => {
    setShowAllDriversPage(true);
    try {
      localStorage.setItem('sikhar_driver_view_mode', 'all');
    } catch {
      // ignore
    }
  };

  const handleOpenAddDriver = () => {
    setShowAllDriversPage(false);
    setShowAddPage(true);
    try {
      localStorage.setItem('sikhar_driver_view_mode', 'add');
    } catch {
      // ignore
    }
  };

  const { summary = {}, actionQueue = [], drivers = [] } = data;

  // Dedicated Full Driver Page View
  if (selectedDriverId) {
    return (
      <DriverDetailPage
        driverId={selectedDriverId}
        onBack={handleBackToTower}
        onStatusUpdated={loadDrivers}
      />
    );
  }

  // Dedicated Full Driver Directory Page View
  if (showAllDriversPage) {
    return (
      <AllDriversListPage
        onBack={handleBackToTower}
        onSelectDriver={handleSelectDriver}
        onAddDriver={handleOpenAddDriver}
      />
    );
  }

  // Dedicated Onboard Driver Page View
  if (showAddPage) {
    return (
      <AddDriverPage
        onBack={handleBackToTower}
        onDriverCreated={(newDriver) => {
          setShowAddPage(false);
          handleSelectDriver(newDriver.id);
          triggerToast(`Driver ${newDriver.name} successfully onboarded!`);
          loadDrivers();
        }}
      />
    );
  }

  return (
    <div className="driver-control-tower-viewport">
      {/* Toast Notification */}
      {actionToast && (
        <div className="driver-action-toast">
          <span>✓</span> {actionToast}
        </div>
      )}

      {/* 1. Header Banner & Actions */}
      <div className="driver-scenic-banner">
        <div className="driver-banner-left">
          <div className="driver-banner-badge">
            <span className="live-pulsing-dot"></span>
            <span>DRIVER CONTROL TOWER • REAL-TIME FLEET CREW</span>
          </div>
          <h1 className="driver-banner-title">Driver Operations & Performance Centre</h1>
          <p className="driver-banner-sub">
            Monitor 63 commercial drivers, shift attendance, 3-pocket wallet health, and RTO licence compliance.
          </p>
        </div>

        <div className="driver-banner-actions">
          <button className="btn-driver-secondary" onClick={loadDrivers} title="Refresh Live Data">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span>Sync</span>
          </button>
          <button className="btn-driver-primary" onClick={() => setShowAddPage(true)}>
            <Plus size={16} />
            <span>+ Add Driver</span>
          </button>
        </div>
      </div>

      {/* 2. Top 6 Precision KPI Cards */}
      <div className="driver-kpi-grid">
        <div 
          className={`driver-kpi-card ${activeFilter === 'all' ? 'is-selected' : ''}`}
          onClick={() => setActiveFilter('all')}
        >
          <div className="driver-kpi-top">
            <span className="driver-kpi-label">TOTAL DRIVERS</span>
            <div className="driver-kpi-icon-box dark">
              <Users size={16} />
            </div>
          </div>
          <div className="driver-kpi-num">{summary.totalDrivers || 63}</div>
          <div className="driver-kpi-foot">
            <span className="text-muted">57 active contracts</span>
          </div>
        </div>

        <div 
          className={`driver-kpi-card ${activeFilter === 'duty' ? 'is-selected' : ''}`}
          onClick={() => setActiveFilter('duty')}
        >
          <div className="driver-kpi-top">
            <span className="driver-kpi-label">ON DUTY</span>
            <div className="driver-kpi-icon-box green">
              <UserCheck size={16} />
            </div>
          </div>
          <div className="driver-kpi-num text-green">{summary.onDuty || 56}</div>
          <div className="driver-kpi-foot text-green">
            <span>88.9% on-road shift active</span>
          </div>
        </div>

        <div 
          className={`driver-kpi-card ${activeFilter === 'leave' ? 'is-selected' : ''}`}
          onClick={() => setActiveFilter('leave')}
        >
          <div className="driver-kpi-top">
            <span className="driver-kpi-label">ON LEAVE</span>
            <div className="driver-kpi-icon-box orange">
              <Clock size={16} />
            </div>
          </div>
          <div className="driver-kpi-num text-orange">{summary.onLeave || 3}</div>
          <div className="driver-kpi-foot text-muted">
            <span>Approved family leave</span>
          </div>
        </div>

        <div 
          className={`driver-kpi-card ${activeFilter === 'suspended' ? 'is-selected' : ''}`}
          onClick={() => setActiveFilter('suspended')}
        >
          <div className="driver-kpi-top">
            <span className="driver-kpi-label">SUSPENDED</span>
            <div className="driver-kpi-icon-box red">
              <AlertTriangle size={16} />
            </div>
          </div>
          <div className="driver-kpi-num text-red">{summary.suspended || 1}</div>
          <div className="driver-kpi-foot text-red">
            <span>Incident / breach block</span>
          </div>
        </div>

        <div 
          className={`driver-kpi-card ${activeFilter === 'unassigned' ? 'is-selected' : ''}`}
          onClick={() => setActiveFilter('unassigned')}
        >
          <div className="driver-kpi-top">
            <span className="driver-kpi-label">STANDBY CREW</span>
            <div className="driver-kpi-icon-box purple">
              <Car size={16} />
            </div>
          </div>
          <div className="driver-kpi-num text-purple">{summary.unassigned || 1}</div>
          <div className="driver-kpi-foot text-muted">
            <span>Ready for car handover</span>
          </div>
        </div>

        <div 
          className={`driver-kpi-card ${activeFilter === 'wallet' ? 'is-selected' : ''}`}
          onClick={() => setActiveFilter('wallet')}
        >
          <div className="driver-kpi-top">
            <span className="driver-kpi-label">WALLET BREACHED</span>
            <div className="driver-kpi-icon-box red">
              <CreditCard size={16} />
            </div>
          </div>
          <div className="driver-kpi-num text-red">{summary.walletBreached || 14}</div>
          <div className="driver-kpi-foot text-red">
            <span>Negative balance dues</span>
          </div>
        </div>
      </div>

      {/* 3. Main Split Architecture */}
      <div className="driver-main-split">
        
        {/* Left Column (65%): Driver Operational Registry Table */}
        <div className="driver-registry-card">
          <div className="driver-table-header-row">
            <div className="driver-header-title-box">
              <div className="driver-title-badge-row">
                <h2 className="driver-section-heading">Live Driver Directory & Shifts</h2>
                <span className="live-pulsing-green-dot ml-2"></span>
              </div>
              <p className="driver-section-sub">
                Click any driver row to inspect their 360° profile, 3-pocket wallet, and agreement.
              </p>
            </div>

            <div className="driver-header-actions-group">
              <button
                type="button"
                className="btn-see-all-drivers-main"
                onClick={handleOpenAllDrivers}
                title="Open dedicated page with all commercial drivers list"
              >
                <Users size={15} />
                <span>See All Drivers List ({summary.totalDrivers || 63})</span>
                <ChevronRight size={15} className="btn-arrow" />
              </button>

              {/* Filter Tabs */}
              <div className="driver-filter-pills">
                {[
                  { id: 'all', label: `All (${summary.totalDrivers || 63})` },
                  { id: 'duty', label: `On Duty (${summary.onDuty || 56})` },
                  { id: 'leave', label: `On Leave (${summary.onLeave || 3})` },
                  { id: 'suspended', label: `Suspended (${summary.suspended || 1})` },
                  { id: 'unassigned', label: `Standby (${summary.unassigned || 1})` }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    className={`driver-filter-pill-btn ${activeFilter === tab.id ? 'is-active' : ''}`}
                    onClick={() => setActiveFilter(tab.id)}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Search Bar */}
          <div className="driver-search-bar-wrap">
            <Search size={16} className="driver-search-icon" />
            <input
              type="text"
              placeholder="Search driver by name, phone, driving licence, or assigned vehicle..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="driver-search-input"
            />
            {searchQuery && (
              <button className="driver-clear-search-btn" onClick={() => setSearchQuery('')}>
                Clear
              </button>
            )}
          </div>

          {/* Driver Directory Table */}
          <div className="driver-table-wrapper">
            <table className="driver-table">
              <thead>
                <tr>
                  <th>Driver Profile</th>
                  <th>Assigned Car</th>
                  <th>Duty Status</th>
                  <th>Today Gross</th>
                  <th>Trips</th>
                  <th>3-Pocket Wallet</th>
                  <th>DL Expiry</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {drivers.map((drv) => {
                  const initials = drv.name
                    ? drv.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
                    : 'DR';

                  return (
                    <tr
                      key={drv.id}
                      className="driver-table-row"
                      onClick={() => handleSelectDriver(drv.id)}
                    >
                      {/* Driver Column */}
                      <td>
                        <div className="driver-cell-profile">
                          <div className="driver-round-avatar">
                            {initials}
                          </div>
                          <div className="driver-profile-text">
                            <strong className="driver-name">{drv.name}</strong>
                            <span className="driver-phone">
                              <Phone size={11} className="inline mr-1" />
                              {drv.phone}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Vehicle Column */}
                      <td>
                        {drv.vehicle ? (
                          <div className="driver-vehicle-cell">
                            <span className="driver-car-plate">{drv.vehicle.registration}</span>
                            <span className="driver-car-sub">{drv.vehicle.model}</span>
                          </div>
                        ) : (
                          <span className="badge-unassigned">No Car Assigned</span>
                        )}
                      </td>

                      {/* Duty Status */}
                      <td>
                        <span
                          className={`driver-status-badge ${
                            drv.status === 'On Duty'
                              ? 'status-green'
                              : drv.status === 'On Leave'
                              ? 'status-orange'
                              : drv.status === 'Suspended'
                              ? 'status-red'
                              : 'status-blue'
                          }`}
                        >
                          <span className="status-bullet"></span>
                          <span>{drv.status}</span>
                        </span>
                      </td>

                      {/* Today Gross */}
                      <td>
                        <strong className="text-navy">{drv.todayGross}</strong>
                      </td>

                      {/* Trips */}
                      <td>
                        <span className="driver-trips-badge">{drv.todayTrips} trips</span>
                      </td>

                      {/* Wallet Balance */}
                      <td>
                        <div className="driver-wallet-cell">
                          <strong
                            className={
                              drv.wallet?.status === 'Breached'
                                ? 'text-red'
                                : drv.wallet?.status === 'Low Balance'
                                ? 'text-orange'
                                : 'text-green'
                            }
                          >
                            ₹{drv.wallet?.spendableBalance?.toLocaleString('en-IN') || 0}
                          </strong>
                          <span
                            className={`wallet-mini-tag ${
                              drv.wallet?.status === 'Breached'
                                ? 'bad'
                                : drv.wallet?.status === 'Low Balance'
                                ? 'warn'
                                : 'good'
                            }`}
                          >
                            {drv.wallet?.status}
                          </span>
                        </div>
                      </td>

                      {/* DL Expiry */}
                      <td>
                        <span className="driver-dl-expiry">{drv.kyc?.dlExpiry}</span>
                      </td>

                      {/* Action Chevron */}
                      <td>
                        <button
                          className="driver-row-open-btn"
                          title="Open Full Driver Profile Page"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectDriver(drv.id);
                          }}
                        >
                          <ChevronRight size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })}

                {drivers.length === 0 && !loading && (
                  <tr>
                    <td colSpan="8" className="driver-empty-state">
                      <div className="empty-wrap">
                        <Users size={32} className="text-muted mb-2" />
                        <p>No drivers matched the active filters.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="driver-table-footer">
            <span className="driver-footer-muted">
              Showing <strong>{drivers.length}</strong> of <strong>{summary.totalDrivers || 63}</strong> commercial drivers
            </span>
          </div>
        </div>

        {/* Right Column (35%): Action Queue, Shift Chart, & Top Performers */}
        <div className="driver-right-column">
          
          {/* Card 1: Action Required Queue */}
          <div className="driver-side-panel">
            <div className="driver-side-panel-header">
              <h3 className="driver-side-title">DRIVER ACTION REQUIRED</h3>
              <span className="badge-tag red">12 Pending</span>
            </div>

            <div className="driver-action-queue-list">
              {actionQueue.map((act) => (
                <div key={act.id} className="driver-action-item">
                  <div className="action-item-left">
                    <span className={`action-indicator ${act.severity}`}></span>
                    <div className="action-text-wrap">
                      <strong className="action-item-title">{act.title}</strong>
                      <span className="action-item-sub">{act.desc}</span>
                    </div>
                  </div>
                  <span className={`action-count-pill ${act.severity}`}>
                    {act.count} ›
                  </span>
                </div>
              ))}
            </div>

            <div className="driver-side-notice-box">
              <span>ⓘ Drivers remain permanently linked to active lease agreements; actions resolve specific operational and wallet hold alerts.</span>
            </div>
          </div>

          {/* Card 2: Shift & Attendance Breakdown */}
          <div className="driver-side-panel">
            <div className="driver-side-panel-header">
              <h3 className="driver-side-title">SHIFT & ATTENDANCE STATUS</h3>
              <span className="badge-tag blue">Today</span>
            </div>

            <div className="attendance-metric-grid">
              <div className="att-box good">
                <span className="att-label">ON DUTY</span>
                <strong className="att-val">{summary.onDuty || 56}</strong>
              </div>
              <div className="att-box warn">
                <span className="att-label">ON LEAVE</span>
                <strong className="att-val">{summary.onLeave || 3}</strong>
              </div>
              <div className="att-box bad">
                <span className="att-label">SUSPENDED</span>
                <strong className="att-val">{summary.suspended || 1}</strong>
              </div>
              <div className="att-box purple">
                <span className="att-label">STANDBY</span>
                <strong className="att-val">{summary.unassigned || 1}</strong>
              </div>
            </div>

            <div className="attendance-progress-bar-wrap">
              <div className="att-progress-bar">
                <div className="att-seg bg-green" style={{ width: '88.9%' }} title="On Duty: 88.9%"></div>
                <div className="att-seg bg-orange" style={{ width: '4.8%' }} title="On Leave: 4.8%"></div>
                <div className="att-seg bg-red" style={{ width: '1.6%' }} title="Suspended: 1.6%"></div>
                <div className="att-seg bg-purple" style={{ width: '4.7%' }} title="Standby: 4.7%"></div>
              </div>
              <div className="att-progress-legend">
                <span>🟢 56 On Duty</span>
                <span>🟠 3 Leave</span>
                <span>🔴 1 Blocked</span>
              </div>
            </div>
          </div>

          {/* Card 3: Top Fleet Earners of the Day */}
          <div className="driver-side-panel">
            <div className="driver-side-panel-header">
              <h3 className="driver-side-title">TOP EARNERS · TODAY</h3>
              <span className="badge-tag green">★ High Fleet Stars</span>
            </div>

            <div className="top-performers-list">
              {[
                { rank: '1', name: 'Vicky', car: 'DL52GD6534', fare: '₹1,900', trips: '14 trips', color: 'gold' },
                { rank: '2', name: 'Suraj Mishra', car: 'DL1Z08899', fare: '₹1,780', trips: '13 trips', color: 'silver' },
                { rank: '3', name: 'Raj Kumar', car: 'DL52GD6605', fare: '₹1,650', trips: '12 trips', color: 'bronze' }
              ].map((p) => (
                <div
                  key={p.rank}
                  className="top-performer-row"
                  onClick={() => {
                    const match = drivers.find((d) => d.name.toLowerCase() === p.name.toLowerCase());
                    if (match) handleSelectDriver(match.id);
                    else if (drivers.length > 0) handleSelectDriver(drivers[0].id);
                  }}
                  title={`View ${p.name}'s Profile`}
                >
                  <div className={`performer-medal ${p.color}`}>
                    <Award size={14} />
                  </div>
                  <div className="performer-info">
                    <strong className="performer-name">{p.name}</strong>
                    <span className="performer-car">{p.car} • {p.trips}</span>
                  </div>
                  <strong className="performer-fare">{p.fare}</strong>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

      {/* 4. Real-time Fleet Live Location Interactive Leaflet Map Section (matching user reference) */}
      <div className="driver-map-section-wrapper">
        <FleetLiveLocationMap
          onSelectVehicle={(veh) => {
            const matched = drivers.find(
              (d) =>
                d.name?.toLowerCase() === veh.driver?.toLowerCase() ||
                (d.vehicle && d.vehicle.registration === veh.reg)
            );
            if (matched) {
              handleSelectDriver(matched.id);
            } else if (drivers.length > 0) {
              handleSelectDriver(drivers[0].id);
            }
          }}
        />
      </div>
    </div>
  );
}
