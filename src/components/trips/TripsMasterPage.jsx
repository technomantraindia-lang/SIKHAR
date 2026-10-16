import React, { useState, useEffect, useCallback } from 'react';
import {
  Activity,
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
  Wrench,
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
  List
} from '../common/Icons';
import {
  fetchTripsApi,
  createTripApi,
  importTripsApi,
  updateTripStatusApi,
  escalateTripApi,
  fetchFleetTowerApi
} from '../../services/api';

export default function TripsMasterPage({ onNavigate, onBackToDashboard }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [allTrips, setAllTrips] = useState([]);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'
  const [kpis, setKpis] = useState({
    totalTrips: 0,
    liveTrips: 0,
    completedTrips: 0,
    cancelledTrips: 0,
    disputedTrips: 0,
    totalDistanceKm: 0,
    grossRevenue: 0,
    driverEarnings: 0,
    sikharShare: 0
  });

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [vehicleFilter, setVehicleFilter] = useState('all');

  // Modals
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isEscalateModalOpen, setIsEscalateModalOpen] = useState(false);
  const [escalateTripTarget, setEscalateTripTarget] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  // Fleet list for vehicle auto-fill
  const [fleetVehicles, setFleetVehicles] = useState([]);

  // Create Trip Form
  const [tripForm, setTripForm] = useState({
    vehicle: '',
    vehicleModel: 'TATA TIGOR EV XPRESS T',
    driver: '',
    driverPhone: '',
    source: 'Rapido',
    pickupLocation: '',
    dropLocation: '',
    distanceKm: '12.0',
    grossFare: '320',
    tollTax: '0',
    partnerFee: '40',
    splitType: 'Revenue Share (75/25)',
    status: 'Live',
    notes: ''
  });

  // Escalate Form
  const [escForm, setEscForm] = useState({
    category: 'Payment / Earnings',
    priority: 'P2',
    problem: ''
  });

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Load All Trips from Backend Once & Keep in Sync
  const loadTrips = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetchTripsApi({});
      if (res && res.trips) {
        setAllTrips(res.trips);
        if (res.kpis) setKpis(res.kpis);
      }
    } catch (err) {
      console.error('Failed to load trips:', err);
      setError(err.message || 'Failed to load trips data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTrips();
  }, [loadTrips]);

  // Derived Dynamic Counts from allTrips (Always 100% synchronized with tab badges)
  const counts = {
    all: allTrips.length,
    live: allTrips.filter(t => (t.status || '').toLowerCase() === 'live').length,
    completed: allTrips.filter(t => (t.status || '').toLowerCase() === 'completed').length,
    cancelled: allTrips.filter(t => (t.status || '').toLowerCase().includes('cancel')).length,
    disputed: allTrips.filter(t => (t.status || '').toLowerCase().includes('disput')).length
  };

  // Distinct vehicle plates for dropdown (Always from allTrips so dropdown never shrinks)
  const availableVehicles = Array.from(new Set(allTrips.map(t => t.vehicle))).filter(Boolean).sort();

  // Smart Tab Change: resets sub-filters if they would produce 0 items under the newly selected tab
  const handleTabChange = (newStatus) => {
    setStatusFilter(newStatus);
    if (newStatus !== 'all') {
      const matchingCount = allTrips.filter(trip => {
        const s = (trip.status || '').toLowerCase();
        let statusOk = false;
        if (newStatus === 'live') statusOk = s === 'live';
        else if (newStatus === 'completed') statusOk = s === 'completed';
        else if (newStatus === 'cancelled') statusOk = s.includes('cancel');
        else if (newStatus === 'disputed') statusOk = s.includes('disput');
        if (!statusOk) return false;

        if (sourceFilter !== 'all' && (trip.source || '').toLowerCase() !== sourceFilter.toLowerCase()) return false;
        if (vehicleFilter !== 'all' && (trip.vehicle || '').toUpperCase() !== vehicleFilter.toUpperCase()) return false;
        if (searchQuery.trim() !== '') {
          const q = searchQuery.toLowerCase().trim();
          const m =
            (trip.id && trip.id.toLowerCase().includes(q)) ||
            (trip.partnerTripId && trip.partnerTripId.toLowerCase().includes(q)) ||
            (trip.driver && trip.driver.toLowerCase().includes(q)) ||
            (trip.vehicle && trip.vehicle.toLowerCase().includes(q)) ||
            (trip.pickupLocation && trip.pickupLocation.toLowerCase().includes(q)) ||
            (trip.dropLocation && trip.dropLocation.toLowerCase().includes(q));
          if (!m) return false;
        }
        return true;
      }).length;

      // If existing vehicle/source filter causes 0 items in this tab, auto-reset them
      if (matchingCount === 0) {
        setVehicleFilter('all');
        setSourceFilter('all');
        setSearchQuery('');
      }
    }
  };

  // Synchronized Filtered Trips
  const filteredTrips = allTrips.filter(trip => {
    // 1. Status Filter
    if (statusFilter !== 'all') {
      const s = (trip.status || '').toLowerCase();
      if (statusFilter === 'live' && s !== 'live') return false;
      if (statusFilter === 'completed' && s !== 'completed') return false;
      if (statusFilter === 'cancelled' && !s.includes('cancel')) return false;
      if (statusFilter === 'disputed' && !s.includes('disput')) return false;
    }

    // 2. Source / Platform Filter
    if (sourceFilter !== 'all') {
      if ((trip.source || '').toLowerCase() !== sourceFilter.toLowerCase()) return false;
    }

    // 3. Vehicle Plate Filter
    if (vehicleFilter !== 'all') {
      if ((trip.vehicle || '').toUpperCase() !== vehicleFilter.toUpperCase()) return false;
    }

    // 4. Search Filter
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase().trim();
      const match =
        (trip.id && trip.id.toLowerCase().includes(q)) ||
        (trip.partnerTripId && trip.partnerTripId.toLowerCase().includes(q)) ||
        (trip.driver && trip.driver.toLowerCase().includes(q)) ||
        (trip.vehicle && trip.vehicle.toLowerCase().includes(q)) ||
        (trip.pickupLocation && trip.pickupLocation.toLowerCase().includes(q)) ||
        (trip.dropLocation && trip.dropLocation.toLowerCase().includes(q));
      if (!match) return false;
    }

    return true;
  });

  // Load Fleet Vehicles for auto-population
  useEffect(() => {
    async function loadFleet() {
      try {
        const fleetData = await fetchFleetTowerApi('all');
        if (fleetData && fleetData.vehicles) {
          setFleetVehicles(fleetData.vehicles);
        }
      } catch (e) {
        console.warn('Could not load fleet registry for vehicle auto-fill:', e);
      }
    }
    loadFleet();
  }, []);

  // Handle vehicle selection in Log Trip modal
  const handleVehicleSelect = (val) => {
    const matched = fleetVehicles.find(
      v => (v.registration || v.id || '').toUpperCase().replace(/\s+/g, '') === val.toUpperCase().replace(/\s+/g, '')
    );
    if (matched) {
      setTripForm(prev => ({
        ...prev,
        vehicle: matched.registration || matched.id,
        vehicleModel: matched.model || prev.vehicleModel,
        driver: matched.driver && matched.driver !== 'Unassigned' ? matched.driver : prev.driver,
        driverPhone: matched.driverPhone && matched.driverPhone !== '—' ? matched.driverPhone : prev.driverPhone
      }));
    } else {
      setTripForm(prev => ({ ...prev, vehicle: val }));
    }
  };

  // Handle Create Trip Submit
  const handleLogTripSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await createTripApi(tripForm);
      if (res && res.trip) {
        showToast(`Trip ${res.trip.id} logged successfully!`);
        setIsLogModalOpen(false);
        setTripForm({
          vehicle: '',
          vehicleModel: 'TATA TIGOR EV XPRESS T',
          driver: '',
          driverPhone: '',
          source: 'Rapido',
          pickupLocation: '',
          dropLocation: '',
          distanceKm: '12.0',
          grossFare: '320',
          tollTax: '0',
          partnerFee: '40',
          splitType: 'Revenue Share (75/25)',
          status: 'Live',
          notes: ''
        });
        loadTrips();
      }
    } catch (err) {
      alert(`Error logging trip: ${err.message}`);
    }
  };

  // Handle Status Update
  const handleUpdateStatus = async (tripId, newStatus) => {
    try {
      await updateTripStatusApi(tripId, {
        status: newStatus,
        notes: `Operational status manually marked as ${newStatus}`
      });
      showToast(`Trip ${tripId} marked as ${newStatus}`);
      if (selectedTrip && selectedTrip.id === tripId) {
        setSelectedTrip(prev => ({ ...prev, status: newStatus }));
      }
      loadTrips();
    } catch (err) {
      alert(`Failed to update status: ${err.message}`);
    }
  };

  // Handle Open Escalate Modal
  const openEscalateModal = (trip) => {
    setEscalateTripTarget(trip);
    setEscForm({
      category: 'Payment / Earnings',
      priority: 'P2',
      problem: `Trip ${trip.id} (${trip.partnerTripId || 'No ID'}) dispute: Driver ${trip.driver} reported fare difference. Route: ${trip.pickupLocation} to ${trip.dropLocation}.`
    });
    setIsEscalateModalOpen(true);
  };

  // Submit Escalation
  const handleEscalateSubmit = async (e) => {
    e.preventDefault();
    if (!escalateTripTarget) return;
    try {
      const res = await escalateTripApi(escalateTripTarget.id, escForm);
      showToast(`Escalation ${res.escalationId} raised successfully!`);
      setIsEscalateModalOpen(false);
      setEscalateTripTarget(null);
      if (selectedTrip && selectedTrip.id === escalateTripTarget.id) {
        setSelectedTrip(prev => ({ ...prev, status: 'Disputed' }));
      }
      loadTrips();
    } catch (err) {
      alert(`Failed to create escalation: ${err.message}`);
    }
  };

  // Simulate Partner Batch Statement Import
  const handleSimulateImport = async () => {
    try {
      const mockImported = [
        {
          partnerTripId: `RPD-${Math.floor(200000 + Math.random() * 800000)}`,
          source: 'Rapido',
          vehicle: 'DL01EV9988',
          vehicleModel: 'TATA TIGOR EV XPRESS T',
          driver: 'Raj Kumar',
          driverPhone: '+91 98101 23456',
          pickupLocation: 'Galleria Market, DLF Phase 4, Gurgaon',
          dropLocation: 'DLF Cyber Park, Sector 20, Gurgaon',
          distanceKm: 8.4,
          grossFare: 210,
          tollTax: 0,
          partnerFee: 30,
          splitType: 'Revenue Share (75/25)',
          status: 'Completed'
        },
        {
          partnerTripId: `RPD-${Math.floor(200000 + Math.random() * 800000)}`,
          source: 'Rapido',
          vehicle: 'HR55BC2211',
          vehicleModel: 'TATA TIGOR EV XPRESS T',
          driver: 'Rohit Yadav',
          driverPhone: '+91 98103 45678',
          pickupLocation: 'Sikanderpur Metro, MG Road, Gurgaon',
          dropLocation: 'Ardee City, Sector 52, Gurgaon',
          distanceKm: 7.6,
          grossFare: 190,
          tollTax: 0,
          partnerFee: 25,
          splitType: 'Revenue Share (75/25)',
          status: 'Completed'
        },
        {
          partnerTripId: `UBR-${Math.floor(200000 + Math.random() * 800000)}`,
          source: 'Uber',
          vehicle: 'UP16HT7788',
          vehicleModel: 'TATA TIGOR EV XPRESS T',
          driver: 'Vikram Singh',
          driverPhone: '+91 98105 67890',
          pickupLocation: 'Sector 18 Atta Market, Noida',
          dropLocation: 'Akshardham Temple, New Delhi',
          distanceKm: 9.8,
          grossFare: 260,
          tollTax: 0,
          partnerFee: 45,
          splitType: 'Revenue Share (75/25)',
          status: 'Completed'
        }
      ];

      const res = await importTripsApi(mockImported);
      showToast(res.message || 'Statement batch reconciled and imported!');
      setIsImportModalOpen(false);
      loadTrips();
    } catch (err) {
      alert(`Import error: ${err.message}`);
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
    <div className="terminal-content trips-master-stage">
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
          1. TOP EXECUTIVE COMMAND HEADER (MATCHING SIKHAR DESIGN)
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
            <span className="breadcrumb-active">Trips Control Tower</span>
          </div>
          <h1 className="executive-greeting" style={{ marginTop: '4px' }}>
            Trips Control Tower
          </h1>
          <div className="executive-subline">
            Real-time commercial trip telemetry · Automated 75/25 revenue share reconciliation · Partner dispatch feeds
          </div>
        </div>

        <div className="command-actions-row">
          <button
            type="button"
            className="btn secondary"
            onClick={() => {
              loadTrips();
              showToast('Trips telemetry synchronized with live IoT gateway.');
            }}
            title="Synchronize real-time telemetry"
          >
            <RefreshCw size={14} className={loading ? 'spinning' : ''} />
            <span>Sync Telemetry</span>
          </button>

          <button
            type="button"
            className="btn secondary"
            onClick={() => setIsImportModalOpen(true)}
            title="Reconcile Rapido / Uber CSV Statement"
          >
            <Download size={14} />
            <span>Import Statement</span>
          </button>

          <button
            type="button"
            className="btn primary"
            onClick={() => setIsLogModalOpen(true)}
          >
            <Plus size={15} />
            <span>+ Log Manual Trip</span>
          </button>
        </div>
      </div>

      {/* ========================================================
          2. SCENIC STATS STRIP (MATCHING VEHICLE MASTER DESIGN)
          ======================================================== */}
      <div className="vm-summary-strip" style={{ marginBottom: '16px' }}>
        <div className="vm-stat-pill" onClick={() => setStatusFilter('all')} style={{ cursor: 'pointer' }}>
          <span className="vm-stat-label">Total Commercial Trips:</span>
          <strong className="vm-stat-value">{kpis.totalTrips || 0}</strong>
          <span className="vm-stat-sub">({kpis.completedTrips || 0} Done)</span>
        </div>

        <div className="vm-stat-divider" />

        <div className="vm-stat-pill" onClick={() => setStatusFilter('live')} style={{ cursor: 'pointer' }}>
          <span className="pulse-dot green" />
          <span className="vm-stat-label">Live on Road:</span>
          <strong className="vm-stat-value green">{kpis.liveTrips || 0}</strong>
          <span className="vm-stat-sub">(Active GPS)</span>
        </div>

        <div className="vm-stat-divider" />

        <div className="vm-stat-pill">
          <span className="vm-stat-label">Total Distance:</span>
          <strong className="vm-stat-value">{kpis.totalDistanceKm || 0}</strong>
          <span className="vm-stat-sub">KM</span>
        </div>

        <div className="vm-stat-divider" />

        <div className="vm-stat-pill">
          <span className="vm-stat-label">Gross Trip Revenue:</span>
          <strong className="vm-stat-value" style={{ color: '#0d2140' }}>{formatInr(kpis.grossRevenue)}</strong>
        </div>

        <div className="vm-stat-divider" />

        <div className="vm-stat-pill">
          <span className="pulse-dot cyan" />
          <span className="vm-stat-label">Sikhar Retained (25%):</span>
          <strong className="vm-stat-value cyan">{formatInr(kpis.sikharShare)}</strong>
          <span className="vm-stat-sub">(Driver 75%: {formatInr(kpis.driverEarnings)})</span>
        </div>
      </div>

      {/* ========================================================
          3. MODERN SEGMENTED TOOLBAR (MATCHING VEHICLE MASTER)
          ======================================================== */}
      <div className="vm-toolbar-container">
        {/* Status Segmented Tabs */}
        <div className="vm-status-segmented-bar">
          {[
            { id: 'all', label: 'All Trips', count: counts.all },
            { id: 'live', label: 'Live On Road', count: counts.live, isLive: true },
            { id: 'completed', label: 'Completed', count: counts.completed },
            { id: 'cancelled', label: 'Cancelled', count: counts.cancelled },
            { id: 'disputed', label: 'Disputed', count: counts.disputed, isWarn: true }
          ].map(tab => (
            <button
              key={tab.id}
              type="button"
              className={`vm-status-tab ${statusFilter === tab.id ? 'active' : ''}`}
              onClick={() => handleTabChange(tab.id)}
            >
              {tab.isLive && <span className="pulse-dot green" />}
              {tab.isWarn && tab.count > 0 && <span className="pulse-dot red" />}
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
              placeholder="Search by Trip ID, Partner Ref, Driver, Vehicle Plate, or Location..."
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
            {/* Platform Filter */}
            <select
              className="search"
              style={{ height: '36px', fontSize: '12px', padding: '0 10px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#ffffff', fontWeight: 600, color: '#334155' }}
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
            >
              <option value="all">All Platforms</option>
              <option value="Rapido">Rapido</option>
              <option value="Uber">Uber</option>
              <option value="Direct / Sikhar">Direct / Sikhar</option>
              <option value="Manual">Manual</option>
            </select>

            {/* Vehicle Filter */}
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
          4. MAIN VIEW CONTENT (GRID OR TABLE)
          ======================================================== */}
      {loading ? (
        <div className="vm-empty-state-box">
          <RefreshCw size={24} className="spinning" style={{ margin: '0 auto 10px', color: '#1769ff' }} />
          <h4>Synchronizing Live Trip Telemetry...</h4>
          <p>Connecting to Sikhar IoT telemetry hub and partner settlement feeds.</p>
        </div>
      ) : filteredTrips.length === 0 ? (
        <div className="vm-empty-state-box">
          <div style={{ fontSize: '32px', marginBottom: '8px' }}>🚗</div>
          <h4>No Commercial Trips Found</h4>
          <p>
            No trip records matched your active filter
            {statusFilter !== 'all' ? ` for "${statusFilter.toUpperCase()}"` : ''}
            {vehicleFilter !== 'all' ? ` and vehicle "${vehicleFilter}"` : ''}
            {searchQuery ? ` matching "${searchQuery}"` : ''}.
          </p>
          <button
            type="button"
            className="btn primary small"
            style={{ marginTop: '12px' }}
            onClick={() => { setStatusFilter('all'); setSourceFilter('all'); setVehicleFilter('all'); setSearchQuery(''); }}
          >
            Reset All Filters (Show All {allTrips.length} Trips)
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        /* ================= 4A. CARD GRID VIEW ================= */
        <div className="clean-vehicle-grid" style={{ marginBottom: '24px' }}>
          {filteredTrips.map(trip => {
            const isLive = trip.status === 'Live';
            const isDisputed = trip.status === 'Disputed';
            const isCancelled = (trip.status || '').toLowerCase().includes('cancel');

            const statusTheme = isLive ? 'green' : isDisputed ? 'red' : isCancelled ? 'amber' : 'cyan';
            const partnerBadge = trip.source === 'Rapido' ? 'amber' : trip.source === 'Uber' ? 'cyan' : 'purple';

            return (
              <div
                key={trip.id}
                className="clean-vehicle-card"
                onClick={() => setSelectedTrip(trip)}
                style={{ cursor: 'pointer', borderTop: isLive ? '3px solid #16a34a' : isDisputed ? '3px solid #ef3340' : '1px solid #e2e8f0' }}
              >
                {/* 1. Top Card Bar: HSRP Plate & Status Badges */}
                <div className="cvc-top-bar">
                  <div className="cvc-plate-pill">
                    <span className="cvc-plate-ind">IND</span>
                    <span className="cvc-plate-num">{trip.vehicle}</span>
                  </div>

                  <div className="cvc-badge-group">
                    <span className={`cvc-type-tag ${partnerBadge}`}>
                      {trip.source}
                    </span>
                    <span className={`cvc-status-pill ${statusTheme}`}>
                      <span className={`pulse-dot ${statusTheme}`} />
                      {trip.status}
                    </span>
                  </div>
                </div>

                {/* 2. Route & Location Details */}
                <div className="cvc-title-block">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ fontSize: '11px', fontWeight: 800, color: '#1769ff', letterSpacing: '0.4px' }}>
                      {trip.id}
                    </div>
                    <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>
                      Ref: {trip.partnerTripId}
                    </div>
                  </div>

                  <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', fontSize: '12px' }}>
                      <span style={{ color: '#16a34a', fontSize: '10px', marginTop: '2px' }}>●</span>
                      <span style={{ fontWeight: 650, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {trip.pickupLocation}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', fontSize: '12px' }}>
                      <span style={{ color: '#ef3340', fontSize: '10px', marginTop: '2px' }}>●</span>
                      <span style={{ color: '#475569', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {trip.dropLocation}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 3. Fare & Revenue Share Split Box */}
                <div className="cvc-energy-box" style={{ background: '#f8fafc', padding: '10px 12px' }}>
                  <div className="cvc-energy-row">
                    <div className="cvc-energy-label">
                      <Receipt size={13} color="#0f172a" />
                      <span>Gross Fare (Net: ₹{trip.netFare})</span>
                    </div>
                    <strong className="cvc-energy-pct" style={{ color: '#0f172a', fontSize: '14px' }}>
                      ₹{trip.grossFare}
                    </strong>
                  </div>

                  {/* Revenue Share Visual Split Progress Bar */}
                  <div className="cvc-meter-track" style={{ height: '6px', display: 'flex', background: '#e2e8f0', borderRadius: '999px', overflow: 'hidden', margin: '4px 0' }}>
                    <div
                      title="Driver Entitlement: 75%"
                      style={{
                        width: trip.splitType?.includes('Fixed') ? '100%' : '75%',
                        background: '#16a34a',
                        height: '100%'
                      }}
                    />
                    {!trip.splitType?.includes('Fixed') && (
                      <div
                        title="Sikhar Share: 25%"
                        style={{
                          width: '25%',
                          background: '#1769ff',
                          height: '100%'
                        }}
                      />
                    )}
                  </div>

                  <div className="cvc-range-sub" style={{ fontSize: '11px', fontWeight: 650 }}>
                    <span style={{ color: '#16a34a' }}>
                      Driver: ₹{trip.driverShare}
                    </span>
                    <span style={{ color: '#1769ff' }}>
                      Sikhar: ₹{trip.sikharShare}
                    </span>
                  </div>
                </div>

                {/* 4. Driver & Telematics Strip */}
                <div className="cvc-driver-box">
                  <div className="cvc-driver-left">
                    <div className="cvc-driver-icon">
                      <Users size={14} color="#64748b" />
                    </div>
                    <div className="cvc-driver-meta">
                      <span className="cvc-driver-name">{trip.driver}</span>
                      <span className="cvc-driver-sub">{trip.driverPhone}</span>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 750, color: '#0f172a' }}>
                      {trip.distanceKm} km · {trip.duration}
                    </span>
                    <span style={{ fontSize: '10.5px', color: '#64748b' }}>
                      ⚡ {trip.telematics?.batteryConsumed || '—'}
                    </span>
                  </div>
                </div>

                {/* 5. Clean Card Footer */}
                <div className="cvc-card-footer">
                  <div className="cvc-next-info">
                    <span className="cvc-next-title">Shift:</span>
                    <span className="cvc-next-desc" title={trip.startTime}>
                      {trip.startTime}
                    </span>
                  </div>

                  <div className="cvc-link-arrow">
                    <span>View 360° Audit</span>
                    <ChevronRight size={14} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* ================= 4B. EXECUTIVE TABLE VIEW ================= */
        <div className="terminal-panel fleet-table-panel" style={{ marginTop: '0', marginBottom: '24px' }}>
          <div className="table-responsive">
            <table className="terminal-data-table vehicle-master-table">
              <thead>
                <tr>
                  <th>Trip ID &amp; Source</th>
                  <th>Vehicle Asset</th>
                  <th>Assigned Driver</th>
                  <th>Route (Pickup → Drop)</th>
                  <th>Distance &amp; Time</th>
                  <th>Fare &amp; Split</th>
                  <th>Telematics</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTrips.map(trip => {
                  const isLive = trip.status === 'Live';
                  const isDisputed = trip.status === 'Disputed';
                  const statusTheme = isLive ? 'green' : isDisputed ? 'red' : 'cyan';

                  return (
                    <tr
                      key={trip.id}
                      style={{ cursor: 'pointer' }}
                      onClick={() => setSelectedTrip(trip)}
                    >
                      {/* Trip ID */}
                      <td>
                        <div style={{ fontWeight: 800, color: '#1769ff', fontSize: '12px' }}>
                          {trip.id}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '3px' }}>
                          <span className={`pill ${trip.source === 'Rapido' ? 'orange' : trip.source === 'Uber' ? 'blue' : 'purple'}`} style={{ fontSize: '9px', padding: '1px 6px' }}>
                            {trip.source}
                          </span>
                          <span style={{ fontSize: '10.5px', color: '#64748b' }}>{trip.partnerTripId}</span>
                        </div>
                      </td>

                      {/* Vehicle */}
                      <td>
                        <div className="cvc-plate-pill" style={{ display: 'inline-flex', marginBottom: '2px' }}>
                          <span className="cvc-plate-ind" style={{ fontSize: '8px', padding: '1px 3px' }}>IND</span>
                          <span className="cvc-plate-num" style={{ fontSize: '11px' }}>{trip.vehicle}</span>
                        </div>
                        <div style={{ fontSize: '10.5px', color: '#64748b' }}>{trip.vehicleModel}</div>
                      </td>

                      {/* Driver */}
                      <td>
                        <div style={{ fontWeight: 700, color: '#0f172a' }}>{trip.driver}</div>
                        <div style={{ fontSize: '10.5px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '3px' }}>
                          <Phone size={10} /> {trip.driverPhone}
                        </div>
                      </td>

                      {/* Route */}
                      <td style={{ maxWidth: '280px' }}>
                        <div style={{ fontSize: '11.5px', fontWeight: 650, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          <span style={{ color: '#16a34a', marginRight: '4px' }}>●</span>
                          {trip.pickupLocation}
                        </div>
                        <div style={{ fontSize: '11px', color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: '2px' }}>
                          <span style={{ color: '#ef3340', marginRight: '4px' }}>●</span>
                          {trip.dropLocation}
                        </div>
                      </td>

                      {/* Distance & Time */}
                      <td>
                        <div style={{ fontWeight: 750, color: '#0f172a' }}>{trip.distanceKm} km</div>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>{trip.duration}</div>
                      </td>

                      {/* Fare & Split */}
                      <td>
                        <div style={{ fontWeight: 800, color: '#0f172a' }}>
                          ₹{trip.grossFare} <small style={{ color: '#64748b', fontWeight: 600 }}>(Net: ₹{trip.netFare})</small>
                        </div>
                        <div style={{ fontSize: '10.5px', color: '#16a34a', fontWeight: 700 }}>
                          D: ₹{trip.driverShare} · S: ₹{trip.sikharShare}
                        </div>
                      </td>

                      {/* Telematics */}
                      <td>
                        <div style={{ fontSize: '11px', fontWeight: 650, color: '#0f172a' }}>
                          ⚡ {trip.telematics?.batteryConsumed || '—'}
                        </div>
                        <div style={{ fontSize: '10.5px', color: '#64748b' }}>
                          {trip.telematics?.avgSpeed || '—'}
                        </div>
                      </td>

                      {/* Status */}
                      <td>
                        <span className={`cvc-status-pill ${statusTheme}`}>
                          <span className={`pulse-dot ${statusTheme}`} />
                          {trip.status}
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
                              setSelectedTrip(trip);
                            }}
                          >
                            Audit
                          </button>
                          {isLive ? (
                            <button
                              type="button"
                              className="btn small green"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleUpdateStatus(trip.id, 'Completed');
                              }}
                            >
                              Complete
                            </button>
                          ) : (
                            <button
                              type="button"
                              className="btn small secondary"
                              style={{ color: '#ef3340' }}
                              onClick={(e) => {
                                e.stopPropagation();
                                openEscalateModal(trip);
                              }}
                            >
                              Dispute
                            </button>
                          )}
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
          5. TRIP DETAIL 360° AUDIT MODAL
          ======================================================== */}
      {selectedTrip && (
        <div className="modalback" onClick={() => setSelectedTrip(null)}>
          <div
            className="modal"
            style={{ width: 'min(760px, 94vw)', borderRadius: '14px', padding: '24px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <button className="close" onClick={() => setSelectedTrip(null)}>×</button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
              <div className="cvc-plate-pill">
                <span className="cvc-plate-ind">IND</span>
                <span className="cvc-plate-num">{selectedTrip.vehicle}</span>
              </div>
              <h2 style={{ margin: 0, fontSize: '19px', fontWeight: 850 }}>
                {selectedTrip.id} · {selectedTrip.source}
              </h2>
              <span className={`cvc-status-pill ${selectedTrip.status === 'Live' ? 'green' : selectedTrip.status === 'Disputed' ? 'red' : 'cyan'}`}>
                {selectedTrip.status}
              </span>
            </div>
            <div className="sub" style={{ marginBottom: '16px' }}>
              Partner Booking ID: <strong>{selectedTrip.partnerTripId}</strong> · Logged: {selectedTrip.startTime}
            </div>

            {/* Top 3 Metric Cards */}
            <div className="grid3" style={{ marginTop: '0', marginBottom: '14px' }}>
              <div className="summary">
                <div className="metric-label">VEHICLE ASSET</div>
                <div className="metric" style={{ fontSize: '17px' }}>{selectedTrip.vehicle}</div>
                <div className="muted">{selectedTrip.vehicleModel}</div>
              </div>

              <div className="summary">
                <div className="metric-label">ASSIGNED DRIVER</div>
                <div className="metric" style={{ fontSize: '17px' }}>{selectedTrip.driver}</div>
                <div className="muted">{selectedTrip.driverPhone}</div>
              </div>

              <div className="summary">
                <div className="metric-label">GROSS PASSENGER FARE</div>
                <div className="metric good" style={{ fontSize: '17px' }}>₹{selectedTrip.grossFare}</div>
                <div className="muted">Net Settlement: ₹{selectedTrip.netFare}</div>
              </div>
            </div>

            {/* Split & Route Details */}
            <div className="grid2">
              {/* Route Card */}
              <div className="panel" style={{ padding: '16px' }}>
                <h3 style={{ fontSize: '12px', marginBottom: '12px', fontWeight: 800 }}>COMMERCIAL ROUTE TIMELINE</h3>
                <div style={{ display: 'flex', gap: '10px', marginBottom: '14px' }}>
                  <MapPin size={16} color="#16a34a" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <div style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Pickup Location</div>
                    <div style={{ fontWeight: 650, fontSize: '12.5px', color: '#0f172a' }}>{selectedTrip.pickupLocation}</div>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>Start: {selectedTrip.startTime}</div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <MapPin size={16} color="#ef3340" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <div style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Drop Location</div>
                    <div style={{ fontWeight: 650, fontSize: '12.5px', color: '#0f172a' }}>{selectedTrip.dropLocation}</div>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>End: {selectedTrip.endTime}</div>
                  </div>
                </div>

                <div className="row" style={{ marginTop: '14px', borderTop: '1px solid #edf1f6', paddingTop: '8px' }}>
                  <span>Distance Recorded</span>
                  <b>{selectedTrip.distanceKm} km</b>
                </div>
                <div className="row">
                  <span>Trip Duration</span>
                  <b>{selectedTrip.duration}</b>
                </div>
                <div className="row">
                  <span>Odometer Log</span>
                  <b>{selectedTrip.telematics?.startOdo || '—'} → {selectedTrip.telematics?.endOdo || '—'}</b>
                </div>
              </div>

              {/* Financial Split Card */}
              <div className="panel" style={{ padding: '16px' }}>
                <h3 style={{ fontSize: '12px', marginBottom: '12px', fontWeight: 800 }}>REVENUE SHARE RECONCILIATION</h3>
                <div className="row">
                  <span>Split Formula</span>
                  <span className="pill purple">{selectedTrip.splitType}</span>
                </div>
                <div className="row">
                  <span>Gross Passenger Fare</span>
                  <b>₹{selectedTrip.grossFare}</b>
                </div>
                <div className="row">
                  <span>(-) Toll &amp; State Taxes</span>
                  <span style={{ color: '#ef3340' }}>- ₹{selectedTrip.tollTax}</span>
                </div>
                <div className="row">
                  <span>(-) Platform Commission</span>
                  <span style={{ color: '#ef3340' }}>- ₹{selectedTrip.partnerFee}</span>
                </div>
                <div className="row" style={{ fontWeight: 700, borderTop: '1px solid #e2e8f0', paddingTop: '8px' }}>
                  <span>Net Commercial Revenue</span>
                  <b>₹{selectedTrip.netFare}</b>
                </div>
                <div className="row" style={{ background: '#f0fdf4', padding: '6px 10px', borderRadius: '6px', marginTop: '6px' }}>
                  <span style={{ color: '#16a34a', fontWeight: 700 }}>Driver Entitlement (75%)</span>
                  <b style={{ color: '#16a34a', fontSize: '14px' }}>₹{selectedTrip.driverShare}</b>
                </div>
                <div className="row" style={{ background: '#eff6ff', padding: '6px 10px', borderRadius: '6px', marginTop: '4px' }}>
                  <span style={{ color: '#1769ff', fontWeight: 700 }}>Sikhar Retained Share (25%)</span>
                  <b style={{ color: '#1769ff', fontSize: '14px' }}>₹{selectedTrip.sikharShare}</b>
                </div>
              </div>
            </div>

            {/* Telematics Strip */}
            <div className="panel" style={{ marginTop: '12px', padding: '16px' }}>
              <div className="panel-head">
                <h3 style={{ fontSize: '12px', fontWeight: 800, margin: 0 }}>VEHICLE TELEMATICS &amp; ENERGY METRICS</h3>
                <span style={{ fontSize: '11px', color: '#16a34a', fontWeight: 650 }}>● Live IoT Stream</span>
              </div>
              <div className="grid3" style={{ marginTop: '10px' }}>
                <div className="summary">
                  <div className="metric-label">BATTERY CONSUMED</div>
                  <strong className="good">{selectedTrip.telematics?.batteryConsumed || '—'}</strong>
                  <div className="muted">{selectedTrip.telematics?.startBattery} → {selectedTrip.telematics?.endBattery}</div>
                </div>
                <div className="summary">
                  <div className="metric-label">SPEED PROFILE</div>
                  <strong>{selectedTrip.telematics?.avgSpeed || '—'}</strong>
                  <div className="muted">Peak Speed: {selectedTrip.telematics?.maxSpeed || '—'}</div>
                </div>
                <div className="summary">
                  <div className="metric-label">OPERATIONAL AUDIT</div>
                  <strong>Verified</strong>
                  <div className="muted">{selectedTrip.notes || 'Normal commercial trip'}</div>
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="modal-foot" style={{ marginTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: '8px' }}>
                {onNavigate && (
                  <button
                    type="button"
                    className="btn small secondary"
                    onClick={() => {
                      setSelectedTrip(null);
                      onNavigate('wallet');
                    }}
                  >
                    <Wallet size={13} style={{ marginRight: '5px' }} /> View Driver Wallet
                  </button>
                )}
                {selectedTrip.status !== 'Disputed' && (
                  <button
                    type="button"
                    className="btn small secondary"
                    style={{ color: '#ef3340', borderColor: '#fca5a5' }}
                    onClick={() => {
                      const t = selectedTrip;
                      setSelectedTrip(null);
                      openEscalateModal(t);
                    }}
                  >
                    <AlertTriangle size={13} style={{ marginRight: '5px' }} /> Raise Dispute Escalation
                  </button>
                )}
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button type="button" className="btn secondary" onClick={() => setSelectedTrip(null)}>
                  Close
                </button>
                {selectedTrip.status === 'Live' && (
                  <button
                    type="button"
                    className="btn primary"
                    onClick={() => handleUpdateStatus(selectedTrip.id, 'Completed')}
                  >
                    Mark Trip Completed ✓
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          6. LOG MANUAL TRIP MODAL (CLEAN FIELD ALIGNMENT)
          ======================================================== */}
      {isLogModalOpen && (
        <div className="modalback" onClick={() => setIsLogModalOpen(false)}>
          <div
            className="modal"
            style={{ width: 'min(720px, 92vw)', borderRadius: '14px', padding: '24px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <button className="close" onClick={() => setIsLogModalOpen(false)}>×</button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span style={{ color: '#1769ff', display: 'flex' }}><Activity size={20} /></span>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 850 }}>
                Log Commercial Trip Record
              </h2>
            </div>
            <div className="sub" style={{ marginBottom: '16px' }}>
              Record passenger trip, corporate shuttle, or direct client dispatch with automated revenue share calculations.
            </div>

            <form onSubmit={handleLogTripSubmit}>
              <div className="grid2">
                <div className="field">
                  <label>Vehicle Registration Number *</label>
                  <input
                    type="text"
                    required
                    list="fleet-vehicles-list"
                    placeholder="e.g. DL01EV9988, DL52GD6605..."
                    value={tripForm.vehicle}
                    onChange={(e) => handleVehicleSelect(e.target.value)}
                    style={{ textTransform: 'uppercase', fontWeight: 700 }}
                  />
                  <datalist id="fleet-vehicles-list">
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
                    value={tripForm.vehicleModel}
                    onChange={(e) => setTripForm({ ...tripForm, vehicleModel: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid2">
                <div className="field">
                  <label>Assigned Driver Name *</label>
                  <input
                    type="text"
                    required
                    value={tripForm.driver}
                    onChange={(e) => setTripForm({ ...tripForm, driver: e.target.value })}
                  />
                </div>

                <div className="field">
                  <label>Driver Phone Number</label>
                  <input
                    type="text"
                    value={tripForm.driverPhone}
                    onChange={(e) => setTripForm({ ...tripForm, driverPhone: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid2">
                <div className="field">
                  <label>Booking Platform / Source *</label>
                  <select
                    value={tripForm.source}
                    onChange={(e) => setTripForm({ ...tripForm, source: e.target.value })}
                  >
                    <option value="Rapido">Rapido</option>
                    <option value="Uber">Uber</option>
                    <option value="Direct / Sikhar">Direct / Sikhar</option>
                    <option value="Manual">Manual Fleet Run</option>
                  </select>
                </div>

                <div className="field">
                  <label>Initial Status *</label>
                  <select
                    value={tripForm.status}
                    onChange={(e) => setTripForm({ ...tripForm, status: e.target.value })}
                  >
                    <option value="Live">Live (In Progress)</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
              </div>

              <div className="grid2">
                <div className="field">
                  <label>Pickup Location *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Cyber Hub, Gurgaon"
                    value={tripForm.pickupLocation}
                    onChange={(e) => setTripForm({ ...tripForm, pickupLocation: e.target.value })}
                  />
                </div>

                <div className="field">
                  <label>Drop Location *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. IGI Airport Terminal 3, New Delhi"
                    value={tripForm.dropLocation}
                    onChange={(e) => setTripForm({ ...tripForm, dropLocation: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid3">
                <div className="field">
                  <label>Distance (KM) *</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={tripForm.distanceKm}
                    onChange={(e) => setTripForm({ ...tripForm, distanceKm: e.target.value })}
                  />
                </div>

                <div className="field">
                  <label>Gross Fare (₹) *</label>
                  <input
                    type="number"
                    required
                    value={tripForm.grossFare}
                    onChange={(e) => setTripForm({ ...tripForm, grossFare: e.target.value })}
                  />
                </div>

                <div className="field">
                  <label>Platform Commission (₹)</label>
                  <input
                    type="number"
                    value={tripForm.partnerFee}
                    onChange={(e) => setTripForm({ ...tripForm, partnerFee: e.target.value })}
                  />
                </div>
              </div>

              <div className="field">
                <label>Commercial Deal Split Type *</label>
                <select
                  value={tripForm.splitType}
                  onChange={(e) => setTripForm({ ...tripForm, splitType: e.target.value })}
                >
                  <option value="Revenue Share (75/25)">Revenue Share: 75% Driver Entitlement / 25% Sikhar Retained</option>
                  <option value="Fixed Lease (100% Driver)">Fixed Lease: 100% Driver Entitlement (Subscription Deal)</option>
                </select>
              </div>

              {/* Calculated Split Preview Box */}
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px', marginTop: '10px' }}>
                <div style={{ fontSize: '11px', textTransform: 'uppercase', color: '#64748b', fontWeight: 750 }}>
                  Calculated Settlement Preview
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
                  <span>Net Fare: <strong>₹{Math.max(0, (Number(tripForm.grossFare) || 0) - (Number(tripForm.partnerFee) || 0))}</strong></span>
                  <span style={{ color: '#16a34a', fontWeight: 700 }}>
                    Driver Share: ₹{(Math.max(0, (Number(tripForm.grossFare) || 0) - (Number(tripForm.partnerFee) || 0)) * (tripForm.splitType?.includes('Fixed') ? 1 : 0.75)).toFixed(1)}
                  </span>
                  <span style={{ color: '#1769ff', fontWeight: 700 }}>
                    Sikhar Share: ₹{(Math.max(0, (Number(tripForm.grossFare) || 0) - (Number(tripForm.partnerFee) || 0)) * (tripForm.splitType?.includes('Fixed') ? 0 : 0.25)).toFixed(1)}
                  </span>
                </div>
              </div>

              <div className="modal-foot" style={{ marginTop: '20px' }}>
                <button type="button" className="btn secondary" onClick={() => setIsLogModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn primary">
                  Log Trip &amp; Update Telematics
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          7. IMPORT PARTNER STATEMENT MODAL
          ======================================================== */}
      {isImportModalOpen && (
        <div className="modalback" onClick={() => setIsImportModalOpen(false)}>
          <div
            className="modal"
            style={{ width: 'min(640px, 92vw)', borderRadius: '14px', padding: '24px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <button className="close" onClick={() => setIsImportModalOpen(false)}>×</button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span style={{ color: '#1769ff', display: 'flex' }}><Download size={20} /></span>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 850 }}>
                Import Partner Settlement Statement
              </h2>
            </div>
            <div className="sub" style={{ marginBottom: '16px' }}>
              Reconcile platform trips from Rapido, Uber, or aggregators into Sikhar's revenue ledger.
            </div>

            <div className="panel" style={{ textAlign: 'center', padding: '36px 20px', border: '2px dashed #cbd5e1', background: '#f8fafc', borderRadius: '10px' }}>
              <div style={{ fontSize: '38px', marginBottom: '8px' }}>📊</div>
              <div style={{ fontWeight: 750, color: '#0f172a', fontSize: '14px' }}>
                Rapido &amp; Uber Settlement Statement Feed
              </div>
              <div style={{ fontSize: '12px', color: '#64748b', maxWidth: '400px', margin: '4px auto 18px', lineHeight: 1.5 }}>
                Parses partner driver IDs, trip distance, gross revenue, deductions, and calculates 75/25 entitlements automatically.
              </div>
              <button
                type="button"
                className="btn primary"
                onClick={handleSimulateImport}
              >
                Load Sample Rapido Statement &amp; Reconcile (3 Trips)
              </button>
            </div>

            <div className="modal-foot" style={{ marginTop: '20px' }}>
              <button type="button" className="btn secondary" onClick={() => setIsImportModalOpen(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          8. ESCALATE TRIP DISPUTE MODAL
          ======================================================== */}
      {isEscalateModalOpen && escalateTripTarget && (
        <div className="modalback" onClick={() => setIsEscalateModalOpen(false)}>
          <div
            className="modal"
            style={{ width: 'min(640px, 92vw)', borderRadius: '14px', padding: '24px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <button className="close" onClick={() => setIsEscalateModalOpen(false)}>×</button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span style={{ color: '#ef3340', display: 'flex' }}><AlertTriangle size={20} /></span>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 850 }}>
                Escalate Trip Dispute · {escalateTripTarget.id}
              </h2>
            </div>
            <div className="sub" style={{ marginBottom: '14px' }}>
              Directly routes this trip issue to <strong>Escalation Master</strong> with active SLA tracking.
            </div>

            <form onSubmit={handleEscalateSubmit}>
              <div className="summary" style={{ marginBottom: '14px' }}>
                <div className="row">
                  <span>Vehicle &amp; Driver</span>
                  <b>{escalateTripTarget.vehicle} · {escalateTripTarget.driver}</b>
                </div>
                <div className="row">
                  <span>Gross Fare</span>
                  <b>₹{escalateTripTarget.grossFare}</b>
                </div>
              </div>

              <div className="grid2">
                <div className="field">
                  <label>Escalation Category *</label>
                  <select
                    value={escForm.category}
                    onChange={(e) => setEscForm({ ...escForm, category: e.target.value })}
                  >
                    <option value="Payment / Earnings">Payment / Earnings (Fare Dispute)</option>
                    <option value="Vehicle Breakdown">Vehicle Breakdown</option>
                    <option value="Driver Safety">Driver Safety / Incident</option>
                    <option value="Other">Other Operational Issue</option>
                  </select>
                </div>

                <div className="field">
                  <label>Priority SLA *</label>
                  <select
                    value={escForm.priority}
                    onChange={(e) => setEscForm({ ...escForm, priority: e.target.value })}
                  >
                    <option value="P1">P1 — Critical (1 Hour SLA)</option>
                    <option value="P2">P2 — High (4 Hours SLA)</option>
                    <option value="P3">P3 — Normal (24 Hours SLA)</option>
                  </select>
                </div>
              </div>

              <div className="field">
                <label>Dispute Description &amp; Reason *</label>
                <textarea
                  required
                  style={{ width: '100%', minHeight: '88px', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', font: 'inherit', fontSize: '12px' }}
                  value={escForm.problem}
                  onChange={(e) => setEscForm({ ...escForm, problem: e.target.value })}
                />
              </div>

              <div className="modal-foot" style={{ marginTop: '20px' }}>
                <button type="button" className="btn secondary" onClick={() => setIsEscalateModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn primary" style={{ background: '#ef3340', borderColor: '#ef3340' }}>
                  Create Escalation &amp; Flag Trip
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
