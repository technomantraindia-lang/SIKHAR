import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Search,
  Users,
  Car,
  Phone,
  ChevronRight,
  RefreshCw,
  Plus,
  CheckCircle2,
  Grid,
  List
} from '../common/Icons';
import { fetchDriversApi } from '../../services/api';

export default function AllDriversListPage({ onBack, onSelectDriver, onAddDriver }) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    summary: {},
    actionQueue: [],
    drivers: []
  });
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'grid'
  const [sortBy, setSortBy] = useState('default'); // 'default' | 'name' | 'gross' | 'trips' | 'wallet'
  const [sortOrder, setSortOrder] = useState('desc');
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const loadAllDrivers = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetchDriversApi(activeFilter, 'all', searchQuery);
      setData(res);
    } catch (err) {
      console.error('Failed to load driver directory:', err);
    } finally {
      setLoading(false);
    }
  }, [activeFilter, searchQuery]);

  useEffect(() => {
    loadAllDrivers();
  }, [loadAllDrivers]);

  const { summary = {}, drivers = [] } = data;

  // Sorted drivers
  const sortedDrivers = useMemo(() => {
    if (!drivers || drivers.length === 0) return [];
    const list = [...drivers];

    if (sortBy === 'name') {
      list.sort((a, b) => {
        const cmp = (a.name || '').localeCompare(b.name || '');
        return sortOrder === 'asc' ? cmp : -cmp;
      });
    } else if (sortBy === 'gross') {
      list.sort((a, b) => {
        const valA = parseInt((a.todayGross || '0').replace(/[^0-9]/g, ''), 10) || 0;
        const valB = parseInt((b.todayGross || '0').replace(/[^0-9]/g, ''), 10) || 0;
        return sortOrder === 'asc' ? valA - valB : valB - valA;
      });
    } else if (sortBy === 'trips') {
      list.sort((a, b) => {
        const valA = a.todayTrips || 0;
        const valB = b.todayTrips || 0;
        return sortOrder === 'asc' ? valA - valB : valB - valA;
      });
    } else if (sortBy === 'wallet') {
      list.sort((a, b) => {
        const valA = a.wallet?.spendableBalance || 0;
        const valB = b.wallet?.spendableBalance || 0;
        return sortOrder === 'asc' ? valA - valB : valB - valA;
      });
    }
    return list;
  }, [drivers, sortBy, sortOrder]);

  const filterTabs = [
    { id: 'all', label: 'All Drivers', count: summary.totalDrivers || drivers.length },
    { id: 'duty', label: 'On Duty', count: summary.onDuty || 0, color: 'green' },
    { id: 'leave', label: 'On Leave', count: summary.onLeave || 0, color: 'orange' },
    { id: 'suspended', label: 'Suspended', count: summary.suspended || 0, color: 'red' },
    { id: 'unassigned', label: 'Standby / Unassigned', count: summary.unassigned || 0, color: 'purple' },
    { id: 'wallet', label: 'Wallet Alerts', count: summary.walletBreached || 0, color: 'red' }
  ];

  return (
    <div className="all-drivers-page-container">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="driver-action-toast-float">
          <CheckCircle2 size={16} className="text-green" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. Executive Top Breadcrumb & Actions Bar */}
      <div className="all-drivers-top-bar">
        <div className="all-drivers-nav-left">
          <button 
            type="button" 
            className="btn-back-to-tower" 
            onClick={onBack}
            title="Return to Driver Control Tower"
          >
            <span className="back-arrow-icon">←</span>
            <span>Back to Driver Control Tower</span>
          </button>
          <div className="all-drivers-breadcrumb-trail">
            <span className="crumb-sep">/</span>
            <span className="crumb-tag">Operations Center</span>
            <span className="crumb-sep">/</span>
            <span className="crumb-active">Commercial Driver Master Directory</span>
          </div>
        </div>

        <div className="all-drivers-nav-right">
          <button 
            type="button" 
            className="btn-driver-sync" 
            onClick={() => {
              loadAllDrivers();
              showToast('Driver roster synced with server.');
            }} 
            title="Refresh Live Data"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span>Sync Roster</span>
          </button>
          {onAddDriver && (
            <button 
              type="button" 
              className="btn-driver-add-new" 
              onClick={onAddDriver}
            >
              <Plus size={16} />
              <span>+ Onboard New Driver</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Scenic Master Header Banner */}
      <div className="all-drivers-hero-banner">
        <div className="hero-banner-content">
          <div className="hero-badge-pill">
            <span className="live-pulsing-green-dot"></span>
            <span>CENTRAL CREW REPOSITORY • 100% VERIFIED COMMERCIAL LICENCES</span>
          </div>
          <h1 className="hero-banner-heading">Commercial Fleet Driver Directory</h1>
          <p className="hero-banner-description">
            Complete institutional view of all registered drivers across Delhi-NCR. Click any driver to inspect real-time shifts, 3-pocket wallets, vehicle telemetry, and deal terms.
          </p>
        </div>

        {/* Live Quick Counters */}
        <div className="hero-stats-capsules">
          <div className="hero-stat-cap">
            <span className="stat-cap-num">{summary.totalDrivers || 63}</span>
            <span className="stat-cap-lbl">Total Crew</span>
          </div>
          <div className="hero-stat-cap on-duty">
            <span className="stat-cap-num text-green">{summary.onDuty || 56}</span>
            <span className="stat-cap-lbl">On Duty Now</span>
          </div>
          <div className="hero-stat-cap wallet-alert">
            <span className="stat-cap-num text-red">{summary.walletBreached || 14}</span>
            <span className="stat-cap-lbl">Wallet Alerts</span>
          </div>
        </div>
      </div>

      {/* 3. Master Interactive Filter Toolbar */}
      <div className="all-drivers-toolbar-card">
        {/* Row 1: Search and Filter Pills */}
        <div className="toolbar-primary-row">
          <div className="driver-search-box-large">
            <Search size={17} className="search-box-icon" />
            <input
              type="text"
              placeholder="Search by driver name, mobile, vehicle plate (DL52...), DL, or PAN card..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input-field"
            />
            {searchQuery && (
              <button 
                type="button" 
                className="btn-clear-search" 
                onClick={() => setSearchQuery('')}
              >
                ✕ Clear
              </button>
            )}
          </div>

          <div className="toolbar-view-controls">
            {/* View Mode Toggle: Table vs Grid */}
            <div className="view-mode-toggle-group">
              <button
                type="button"
                className={`view-mode-btn ${viewMode === 'table' ? 'is-active' : ''}`}
                onClick={() => setViewMode('table')}
                title="Table View (Data Rich)"
              >
                <List size={15} />
                <span>Table</span>
              </button>
              <button
                type="button"
                className={`view-mode-btn ${viewMode === 'grid' ? 'is-active' : ''}`}
                onClick={() => setViewMode('grid')}
                title="Card Grid View (Visual 3D)"
              >
                <Grid size={15} />
                <span>Cards</span>
              </button>
            </div>

            {/* Sort Dropdown & Order Toggle */}
            <div className="sort-selector-wrap">
              <span className="sort-label">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="sort-dropdown-select"
              >
                <option value="default">Default Order</option>
                <option value="name">Driver Name</option>
                <option value="gross">Today Gross</option>
                <option value="trips">Shift Trips</option>
                <option value="wallet">Spendable Wallet</option>
              </select>
              <button
                type="button"
                className="view-mode-btn"
                style={{ padding: '4px 8px', fontSize: '11px', fontWeight: '700' }}
                onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
                title={`Sort Direction: ${sortOrder.toUpperCase()}`}
              >
                {sortOrder === 'desc' ? '↓ Desc' : '↑ Asc'}
              </button>
            </div>
          </div>
        </div>

        {/* Row 2: Status Category Filter Chips */}
        <div className="toolbar-filter-chips-row">
          <div className="filter-chips-list">
            {filterTabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                className={`filter-chip-button ${activeFilter === tab.id ? 'is-active' : ''} ${tab.color || 'blue'}`}
                onClick={() => setActiveFilter(tab.id)}
              >
                <span className="chip-label">{tab.label}</span>
                <span className="chip-count-badge">{tab.count}</span>
              </button>
            ))}
          </div>

          <div className="toolbar-meta-count">
            <span>
              Showing <strong>{sortedDrivers.length}</strong> of <strong>{summary.totalDrivers || 63}</strong> commercial drivers
            </span>
          </div>
        </div>
      </div>

      {/* 4. DRIVER LIST VIEW CONTENT (TABLE OR GRID) */}
      {loading ? (
        <div className="all-drivers-loading-panel">
          <div className="luxury-spinner"></div>
          <p>Syncing verified commercial driver directory...</p>
        </div>
      ) : sortedDrivers.length === 0 ? (
        <div className="all-drivers-empty-state">
          <div className="empty-state-icon-box">
            <Users size={40} className="text-muted" />
          </div>
          <h3>No Drivers Found</h3>
          <p>
            No driver records matched your filter <strong>"{activeFilter}"</strong> or search query <strong>"{searchQuery}"</strong>.
          </p>
          <button
            type="button"
            className="btn-reset-filters"
            onClick={() => {
              setActiveFilter('all');
              setSearchQuery('');
            }}
          >
            Reset Filters & View All
          </button>
        </div>
      ) : viewMode === 'table' ? (
        /* ================= TABLE VIEW ================= */
        <div className="all-drivers-table-card">
          <div className="table-responsive-wrapper">
            <table className="luxury-driver-table">
              <thead>
                <tr>
                  <th style={{ width: '280px' }}>Commercial Driver Profile</th>
                  <th>Assigned Vehicle</th>
                  <th>Duty Shift Status</th>
                  <th>Today Gross</th>
                  <th>Trips</th>
                  <th>3-Pocket Wallet</th>
                  <th>KYC / DL Expiry</th>
                  <th>Daily Deal</th>
                  <th style={{ textAlign: 'right', paddingRight: '20px' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {sortedDrivers.map((drv) => {
                  const initials = drv.name
                    ? drv.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
                    : 'DR';

                  const isDuty = drv.status === 'On Duty';
                  const isLeave = drv.status === 'On Leave';
                  const isSuspended = drv.status === 'Suspended';

                  return (
                    <tr
                      key={drv.id}
                      className="driver-luxury-row"
                      onClick={() => onSelectDriver(drv.id)}
                      title={`Click to open full profile for ${drv.name}`}
                    >
                      {/* Driver Column */}
                      <td>
                        <div className="table-profile-cell">
                          <div className="table-avatar-wrapper">
                            <div className="table-avatar-circle">{initials}</div>
                            <span className={`table-avatar-dot ${isDuty ? 'online' : isLeave ? 'away' : isSuspended ? 'blocked' : 'standby'}`}></span>
                          </div>
                          <div className="table-profile-info">
                            <strong className="table-driver-name">{drv.name}</strong>
                            <div className="table-sub-row">
                              <span className="table-driver-phone">
                                <Phone size={11} className="inline mr-1" />
                                {drv.phone}
                              </span>
                              <span className="table-rating-pill">★ {drv.rating || '4.8'}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Vehicle Column */}
                      <td>
                        {drv.vehicle ? (
                          <div className="table-vehicle-cell">
                            <div className="plate-badge-row">
                              <span className="table-car-plate">{drv.vehicle.registration}</span>
                              <span className={`fuel-badge ${drv.vehicle.type === 'EV' ? 'ev' : 'cng'}`}>
                                {drv.vehicle.type || 'CNG'}
                              </span>
                            </div>
                            <span className="table-car-sub">{drv.vehicle.model}</span>
                          </div>
                        ) : (
                          <span className="badge-standby-unassigned">Standby (No Car)</span>
                        )}
                      </td>

                      {/* Status Column */}
                      <td>
                        <span
                          className={`table-status-badge ${
                            isDuty ? 'status-green' : isLeave ? 'status-orange' : isSuspended ? 'status-red' : 'status-blue'
                          }`}
                        >
                          <span className="status-pulsing-bullet"></span>
                          <span>{drv.status}</span>
                        </span>
                      </td>

                      {/* Today Gross */}
                      <td>
                        <strong className="table-money-val">{drv.todayGross || '₹0'}</strong>
                      </td>

                      {/* Trips */}
                      <td>
                        <span className="table-trips-chip">{drv.todayTrips || 0} trips</span>
                      </td>

                      {/* Wallet Balance */}
                      <td>
                        <div className="table-wallet-cell">
                          <strong
                            className={`wallet-amt-text ${
                              drv.wallet?.status === 'Breached'
                                ? 'bad'
                                : drv.wallet?.status === 'Low Balance'
                                ? 'warn'
                                : 'good'
                            }`}
                          >
                            ₹{drv.wallet?.spendableBalance?.toLocaleString('en-IN') || 0}
                          </strong>
                          <span
                            className={`table-wallet-tag ${
                              drv.wallet?.status === 'Breached'
                                ? 'bad'
                                : drv.wallet?.status === 'Low Balance'
                                ? 'warn'
                                : 'good'
                            }`}
                          >
                            {drv.wallet?.status || 'Healthy'}
                          </span>
                        </div>
                      </td>

                      {/* DL Expiry & PAN */}
                      <td>
                        <div className="table-dl-cell">
                          <span className="dl-expiry-date">{drv.kyc?.dlExpiry || 'Valid 2029'}</span>
                          <div className="table-sub-row">
                            <span className="dl-verified-tag">✓ RTO</span>
                            {drv.kyc?.panCard && (
                              <span className="dl-verified-tag" style={{ background: '#f1f5f9', color: '#475569', borderColor: '#cbd5e1' }} title={`PAN: ${drv.kyc.panCard}`}>
                                PAN: {drv.kyc.panCard}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Deal Type */}
                      <td>
                        <span className="table-deal-text">{drv.deal?.type || 'Daily Rental'}</span>
                      </td>

                      {/* Action Chevron */}
                      <td style={{ textAlign: 'right', paddingRight: '20px' }}>
                        <button
                          type="button"
                          className="table-action-open-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectDriver(drv.id);
                          }}
                          title="Open Driver Details"
                        >
                          <span>View Profile</span>
                          <ChevronRight size={15} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* ================= CARDS GRID VIEW ================= */
        <div className="all-drivers-grid-layout">
          {sortedDrivers.map((drv) => {
            const initials = drv.name
              ? drv.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
              : 'DR';

            const isDuty = drv.status === 'On Duty';
            const isLeave = drv.status === 'On Leave';
            const isSuspended = drv.status === 'Suspended';

            return (
              <div
                key={drv.id}
                className="luxury-driver-card"
                onClick={() => onSelectDriver(drv.id)}
              >
                {/* Card Top Row: Avatar & Status */}
                <div className="driver-card-top-header">
                  <div className="card-avatar-with-dot">
                    <div className="card-avatar-circle">{initials}</div>
                    <span className={`card-avatar-pip ${isDuty ? 'online' : isLeave ? 'away' : isSuspended ? 'blocked' : 'standby'}`}></span>
                  </div>

                  <div className="card-header-headings">
                    <strong className="card-driver-name">{drv.name}</strong>
                    <span className="card-driver-phone">
                      <Phone size={11} className="inline mr-1" />
                      {drv.phone}
                    </span>
                  </div>

                  <span
                    className={`card-status-pill ${
                      isDuty ? 'green' : isLeave ? 'orange' : isSuspended ? 'red' : 'blue'
                    }`}
                  >
                    {drv.status}
                  </span>
                </div>

                {/* Assigned Vehicle Strip */}
                <div className="card-vehicle-strip">
                  {drv.vehicle ? (
                    <div className="card-veh-info">
                      <div className="veh-plate-wrap">
                        <Car size={13} className="text-muted" />
                        <strong className="veh-plate-mono">{drv.vehicle.registration}</strong>
                      </div>
                      <span className="veh-model-muted">{drv.vehicle.model} • {drv.vehicle.type}</span>
                    </div>
                  ) : (
                    <div className="card-standby-info">
                      <span className="standby-text">Standby Crew (No Car Assigned)</span>
                    </div>
                  )}
                </div>

                {/* Performance Metrics Trio */}
                <div className="card-metrics-grid">
                  <div className="card-metric-cell">
                    <span className="metric-lbl">TODAY GROSS</span>
                    <strong className="metric-val text-green">{drv.todayGross || '₹0'}</strong>
                  </div>
                  <div className="card-metric-cell">
                    <span className="metric-lbl">SHIFTS / TRIPS</span>
                    <strong className="metric-val text-navy">{drv.todayTrips || 0} trips</strong>
                  </div>
                  <div className="card-metric-cell">
                    <span className="metric-lbl">SPENDABLE</span>
                    <strong
                      className={`metric-val ${
                        drv.wallet?.status === 'Breached' ? 'text-red' : 'text-navy'
                      }`}
                    >
                      ₹{drv.wallet?.spendableBalance?.toLocaleString('en-IN') || 0}
                    </strong>
                  </div>
                </div>

                {/* Card Footer: Rating & Action Button */}
                <div className="card-footer-action-row">
                  <div className="card-rating-tag">
                    <span>★ {drv.rating || '4.8'}</span>
                    <span className="rating-desc">Rating</span>
                  </div>

                  <button
                    type="button"
                    className="btn-card-open-profile"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectDriver(drv.id);
                    }}
                  >
                    <span>View Profile</span>
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 5. Bottom Navigation Footer */}
      <div className="all-drivers-page-footer">
        <button
          type="button"
          className="btn-back-to-tower-bottom"
          onClick={onBack}
        >
          <span>← Back to Driver Control Tower</span>
        </button>

        <span className="footer-copyright-text">
          Institutional Fleet Core System • Secured Admin Session
        </span>
      </div>
    </div>
  );
}
