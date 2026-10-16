import React, { useState, useEffect, useCallback } from 'react';
import {
  AlertTriangle,
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
  Activity,
  Check,
  Truck
} from '../common/Icons';
import {
  fetchEscalationsApi,
  createEscalationApi,
  addEscalationNoteApi,
  resolveEscalationApi,
  updateEscalationApi,
  fetchFleetTowerApi
} from '../../services/api';

export default function EscalationMasterPage({ onNavigate, onBackToDashboard }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [kpis, setKpis] = useState({
    openTickets: 12,
    p1Critical: 2,
    slaBreached: 3,
    resolvedToday: 7,
    avgResolution: '2h 18m'
  });

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Modals & Drawers
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newNoteText, setNewNoteText] = useState('');
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // Resolution Dialog state inside Detail
  const [isResolving, setIsResolving] = useState(false);
  const [resolutionNote, setResolutionNote] = useState('');
  const [driverConfirmed, setDriverConfirmed] = useState(true);

  // Fleet Registry for Auto-filling Vehicle Models & Drivers
  const [fleetVehicles, setFleetVehicles] = useState([]);
  const [matchedVehicleInfo, setMatchedVehicleInfo] = useState(null);

  // New Ticket Form State
  const [createForm, setCreateForm] = useState({
    driver: '',
    driverPhone: '',
    vehicle: '',
    vehicleModel: '',
    category: 'Vehicle Breakdown',
    priority: 'P1',
    problem: '',
    impact: '',
    location: 'Sec 44, Gurgaon',
    team: 'Fleet Operations',
    owner: 'Auto Assign'
  });

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleVehicleChange = (val) => {
    const rawVal = val || '';
    const cleanInput = rawVal.trim().toUpperCase().replace(/\s+/g, '');

    const matched = fleetVehicles.find(v => {
      const reg = (v.registration || v.id || '').toUpperCase().replace(/\s+/g, '');
      return reg === cleanInput;
    });

    if (matched) {
      const modelFormatted = matched.model ? `${matched.model}${matched.type ? ` (${matched.type})` : ''}` : '';
      setCreateForm(prev => ({
        ...prev,
        vehicle: rawVal.toUpperCase(),
        vehicleModel: modelFormatted || prev.vehicleModel,
        driver: (matched.driver && matched.driver !== 'Unassigned') ? matched.driver : prev.driver,
        driverPhone: (matched.driverPhone && matched.driverPhone !== '—') ? matched.driverPhone : prev.driverPhone,
        location: matched.location || prev.location
      }));
      setMatchedVehicleInfo({
        found: true,
        model: matched.model,
        type: matched.type,
        driver: matched.driver,
        driverPhone: matched.driverPhone,
        status: matched.status,
        location: matched.location,
        isMaintenance: matched.status === 'At Workshop' || matched.status === 'In Maintenance'
      });
    } else {
      setCreateForm(prev => ({
        ...prev,
        vehicle: rawVal.toUpperCase()
      }));
      setMatchedVehicleInfo(null);
    }
  };

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [res, fleetRes] = await Promise.all([
        fetchEscalationsApi({
          status: statusFilter,
          priority: priorityFilter,
          category: categoryFilter,
          search: searchQuery
        }),
        fetchFleetTowerApi('all').catch(err => {
          console.warn('Fleet Tower fetch skipped:', err);
          return null;
        })
      ]);

      if (res && res.success) {
        setTickets(res.tickets || []);
        if (res.kpis) setKpis(res.kpis);
        if (res.categories) setCategories(res.categories);
      }
      if (fleetRes && fleetRes.vehicles) {
        setFleetVehicles(fleetRes.vehicles);
      }
    } catch (err) {
      console.error('Failed to load escalations:', err);
      setError('Unable to load escalations. Please verify server connectivity.');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, priorityFilter, categoryFilter, searchQuery]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Keep selected ticket fresh if list updates
  useEffect(() => {
    if (selectedTicket) {
      const updated = tickets.find(t => t.id === selectedTicket.id);
      if (updated) setSelectedTicket(updated);
    }
  }, [tickets, selectedTicket]);

  const handleOpenCreateModal = (cat = 'Vehicle Breakdown') => {
    // If fleet vehicles available, pre-populate with first vehicle or keep ready for plate input
    const initialVeh = fleetVehicles.find(v => v.status === 'Breakdown') || fleetVehicles[0];
    if (initialVeh) {
      const modelFormatted = initialVeh.model ? `${initialVeh.model}${initialVeh.type ? ` (${initialVeh.type})` : ''}` : '';
      setCreateForm({
        driver: initialVeh.driver && initialVeh.driver !== 'Unassigned' ? initialVeh.driver : '',
        driverPhone: initialVeh.driverPhone && initialVeh.driverPhone !== '—' ? initialVeh.driverPhone : '',
        vehicle: initialVeh.registration || '',
        vehicleModel: modelFormatted,
        category: cat,
        priority: cat === 'Vehicle Breakdown' || cat === 'Driver Safety' ? 'P1' : 'P2',
        problem: '',
        impact: '',
        location: initialVeh.location || 'Sec 44, Gurgaon',
        team: cat === 'Wallet / Deduction' ? 'Finance' : cat === 'Payment / Earnings' || cat === 'Lease / Agreement' ? 'Driver Support' : 'Fleet Operations',
        owner: 'Auto Assign'
      });
      setMatchedVehicleInfo({
        found: true,
        model: initialVeh.model,
        type: initialVeh.type,
        driver: initialVeh.driver,
        status: initialVeh.status,
        location: initialVeh.location,
        isMaintenance: initialVeh.status === 'At Workshop' || initialVeh.status === 'In Maintenance'
      });
    } else {
      setCreateForm({
        driver: '',
        driverPhone: '',
        vehicle: '',
        vehicleModel: '',
        category: cat,
        priority: cat === 'Vehicle Breakdown' || cat === 'Driver Safety' ? 'P1' : 'P2',
        problem: '',
        impact: '',
        location: 'Sec 44, Gurgaon',
        team: cat === 'Wallet / Deduction' ? 'Finance' : cat === 'Payment / Earnings' || cat === 'Lease / Agreement' ? 'Driver Support' : 'Fleet Operations',
        owner: 'Auto Assign'
      });
      setMatchedVehicleInfo(null);
    }
    setIsCreateModalOpen(true);
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!createForm.problem.trim()) {
      showToast('⚠️ Please write the problem details.');
      return;
    }
    try {
      const res = await createEscalationApi(createForm);
      if (res && res.success) {
        showToast(`✓ Ticket ${res.ticket.id} created successfully!`);
        setIsCreateModalOpen(false);
        await loadData();
        setSelectedTicket(res.ticket);
      }
    } catch (err) {
      showToast(`Error: ${err.message}`);
    }
  };

  const handleAddNote = async () => {
    if (!selectedTicket || !newNoteText.trim()) return;
    try {
      setIsSubmittingNote(true);
      const res = await addEscalationNoteApi(selectedTicket.id, newNoteText, 'Admin');
      if (res && res.success) {
        setNewNoteText('');
        showToast('✓ Investigation note recorded.');
        await loadData();
      }
    } catch (err) {
      showToast(`Error: ${err.message}`);
    } finally {
      setIsSubmittingNote(false);
    }
  };

  const handleResolveTicket = async () => {
    if (!selectedTicket) return;
    try {
      const res = await resolveEscalationApi(
        selectedTicket.id,
        resolutionNote || 'Issue addressed, operational verify completed.',
        driverConfirmed
      );
      if (res && res.success) {
        showToast(`✓ Ticket ${selectedTicket.id} marked as Resolved.`);
        setIsResolving(false);
        setResolutionNote('');
        await loadData();
      }
    } catch (err) {
      showToast(`Error: ${err.message}`);
    }
  };

  const handleStatusChange = async (newStatus) => {
    if (!selectedTicket) return;
    try {
      const res = await updateEscalationApi(selectedTicket.id, { status: newStatus });
      if (res && res.success) {
        showToast(`✓ Status updated to ${newStatus}.`);
        await loadData();
      }
    } catch (err) {
      showToast(`Error: ${err.message}`);
    }
  };

  const handleExport = () => {
    const csvContent = [
      ['Ticket ID', 'Driver', 'Vehicle', 'Category', 'Priority', 'Status', 'Owner', 'SLA', 'Problem', 'Location'],
      ...tickets.map(t => [
        t.id,
        t.driver,
        t.vehicle,
        t.category,
        t.priority,
        t.status,
        t.owner,
        t.sla,
        `"${(t.problem || '').replace(/"/g, '""')}"`,
        t.location
      ])
    ]
      .map(row => row.join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Sikhar_Escalations_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('✓ Escalation records exported to CSV.');
  };

  // Helper for priority badges
  const renderPriorityBadge = (p) => {
    if (p === 'P1') {
      return (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            background: '#fee2e2',
            color: '#b91c1c',
            border: '1px solid #fecaca',
            borderRadius: '999px',
            padding: '3px 9px',
            fontSize: '11px',
            fontWeight: '750'
          }}
        >
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#dc2626' }} />
          P1 Critical
        </span>
      );
    }
    if (p === 'P2') {
      return (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            background: '#fef3c7',
            color: '#b45309',
            border: '1px solid #fde68a',
            borderRadius: '999px',
            padding: '3px 9px',
            fontSize: '11px',
            fontWeight: '750'
          }}
        >
          P2 High
        </span>
      );
    }
    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '5px',
          background: '#e0f2fe',
          color: '#0369a1',
          border: '1px solid #bae6fd',
          borderRadius: '999px',
          padding: '3px 9px',
          fontSize: '11px',
          fontWeight: '750'
        }}
      >
        P3 Normal
      </span>
    );
  };

  // Helper for status badges
  const renderStatusBadge = (s) => {
    const norm = (s || '').toLowerCase();
    if (norm === 'open') {
      return (
        <span style={{ background: '#fff1f2', color: '#e11d48', border: '1px solid #ffe4e6', borderRadius: '999px', padding: '3px 9px', fontSize: '11px', fontWeight: '750', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#e11d48' }} />
          Open
        </span>
      );
    }
    if (norm === 'in review') {
      return (
        <span style={{ background: '#eff6ff', color: '#1d4ed8', border: '1px solid #dbeafe', borderRadius: '999px', padding: '3px 9px', fontSize: '11px', fontWeight: '750', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#2563eb' }} />
          In Review
        </span>
      );
    }
    if (norm === 'waiting for driver') {
      return (
        <span style={{ background: '#faf5ff', color: '#7e22ce', border: '1px solid #f3e8ff', borderRadius: '999px', padding: '3px 9px', fontSize: '11px', fontWeight: '750', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#9333ea' }} />
          Waiting for Driver
        </span>
      );
    }
    return (
      <span style={{ background: '#ecfdf5', color: '#047857', border: '1px solid #d1fae5', borderRadius: '999px', padding: '3px 9px', fontSize: '11px', fontWeight: '750', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
        <Check size={11} strokeWidth={3} />
        Resolved
      </span>
    );
  };

  // Status Counts for Tabs
  const statusCounts = {
    all: tickets.length,
    open: tickets.filter(t => t.status === 'Open').length,
    inReview: tickets.filter(t => t.status === 'In Review').length,
    waiting: tickets.filter(t => t.status === 'Waiting for Driver').length,
    resolved: tickets.filter(t => t.status === 'Resolved' || t.status === 'Closed').length
  };

  // Helper for cross-module integration badge in table
  const renderConnectedModulePill = (ticket) => {
    const cat = ticket.category;
    if (cat === 'Vehicle Breakdown') {
      return (
        <button
          type="button"
          className="esc-module-pill maint"
          title="Open Maintenance & Workshop Job Cards"
          onClick={(e) => {
            e.stopPropagation();
            if (onNavigate) onNavigate('maintenance');
          }}
        >
          <Wrench size={11} />
          <span>Maintenance</span>
        </button>
      );
    }
    if (cat === 'Wallet / Deduction') {
      return (
        <button
          type="button"
          className="esc-module-pill wallet"
          title="Inspect Driver Wallet Health"
          onClick={(e) => {
            e.stopPropagation();
            if (onNavigate) onNavigate('wallet');
          }}
        >
          <Wallet size={11} />
          <span>Wallet Health</span>
        </button>
      );
    }
    if (cat === 'Payment / Earnings') {
      return (
        <button
          type="button"
          className="esc-module-pill general"
          title="View Invoices & Billing"
          onClick={(e) => {
            e.stopPropagation();
            if (onNavigate) onNavigate('invoices');
          }}
        >
          <Receipt size={11} />
          <span>Invoices</span>
        </button>
      );
    }
    if (cat === 'Driver Safety') {
      return (
        <button
          type="button"
          className="esc-module-pill drivers"
          title="Open Driver Control Tower"
          onClick={(e) => {
            e.stopPropagation();
            if (onNavigate) onNavigate('drivers');
          }}
        >
          <Shield size={11} />
          <span>Driver Ops</span>
        </button>
      );
    }
    if (cat === 'Vehicle Assignment') {
      return (
        <button
          type="button"
          className="esc-module-pill fleet"
          title="Manage Vehicle Assignments"
          onClick={(e) => {
            e.stopPropagation();
            if (onNavigate) onNavigate('vehicle-assignments');
          }}
        >
          <Car size={11} />
          <span>Assignments</span>
        </button>
      );
    }
    if (cat === 'Maintenance') {     
      return (  
        <button
          type="button"
          className="esc-module-pill maint"
          title="Open Maintenance Center"  
          onClick={(e) => {
            e.stopPropagation();
            if (onNavigate) onNavigate('maintenance');  
          }}
        >
          <Wrench size={11} />
          <span>Maintenance</span>
        </button>
      );
    }
    if (cat === 'Lease / Agreement') {
      return (
        <button
          type="button"
          className="esc-module-pill general"
          title="View Bookings & Leases"
          onClick={(e) => {
            e.stopPropagation();
            if (onNavigate) onNavigate('bookings');
          }}
        >
          <FileText size={11} />
          <span>Bookings</span>
        </button>
      );
    }
    return (
      <button
        type="button"
        className="esc-module-pill fleet"
        title="View in Fleet Control Tower"
        onClick={(e) => {
          e.stopPropagation();
          if (onNavigate) onNavigate('fleet');
        }}
      >
        <Truck size={11} />
        <span>Control Tower</span>
      </button>
    );
  };

  return (
    <div className="escalation-master-stage">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="sikhar-toast-notification">
          <span>{toastMessage}</span>
          <button onClick={() => setToastMessage(null)}>×</button>
        </div>
      )}

      {/* 1. Header Section */}
      <div className="esc-header-row">
        <div className="esc-title-group">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            {onBackToDashboard && (
              <button
                className="btn small"
                onClick={onBackToDashboard}
                title="Back to Dashboard"
                style={{ padding: '6px 10px', borderRadius: '8px', display: 'inline-flex', alignItems: 'center' }}
              >
                <ArrowLeft size={13} style={{ marginRight: '4px' }} />
                <span>Dashboard</span>
              </button>
            )}
            <h1>
              <span style={{ color: '#ef3340', display: 'flex', alignItems: 'center' }}>
                <AlertTriangle size={24} />
              </span>
              Escalation Master
            </h1>
          </div>
          <div className="sub">
            Central incident command &amp; SLA resolution center for driver grievances, vehicle breakdowns, maintenance, and finance escalations.
          </div>
        </div>

        <div className="actions" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
          {onNavigate && (
            <>
              <button className="btn small" onClick={() => onNavigate('fleet')} title="Open Live Fleet Control Tower">
                <Truck size={13} style={{ marginRight: '4px' }} />
                Control Tower
              </button>
              <button className="btn small" onClick={() => onNavigate('maintenance')} title="Open Vehicle Maintenance Center">
                <Wrench size={13} style={{ marginRight: '4px' }} />
                Maintenance
              </button>
              <button className="btn small" onClick={() => onNavigate('drivers')} title="Open Driver Control Tower">
                <Users size={13} style={{ marginRight: '4px' }} />
                Drivers
              </button>
              <button className="btn small" onClick={() => onNavigate('wallet')} title="Open Driver Wallet Health">
                <Wallet size={13} style={{ marginRight: '4px' }} />
                Wallet Health
              </button>
              <button className="btn small" onClick={() => onNavigate('vehicles')} title="Open Vehicle Master Registry">
                <Car size={13} style={{ marginRight: '4px' }} />
                Vehicle Master
              </button>
            </>
          )}
          <button className="btn small" onClick={handleExport} title="Export Escalation Log to CSV">
            <Download size={13} style={{ marginRight: '4px' }} />
            Export
          </button>
          <button
            className="btn primary small"
            onClick={() => handleOpenCreateModal('Vehicle Breakdown')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}
          >
            <Plus size={14} />
            <span>+ Create Escalation</span>
          </button>
        </div>
      </div>

      {/* 2. Executive KPI Cards Grid */}
      <div className="esc-kpis-grid">
        <div
          className={`esc-kpi-card ${statusFilter === 'all' && priorityFilter === 'all' ? 'active-filter' : ''}`}
          onClick={() => { setStatusFilter('all'); setPriorityFilter('all'); }}
        >
          <div className="esc-kpi-top">
            <span className="esc-kpi-label">OPEN TICKETS</span>
            <div className="esc-kpi-icon-wrap" style={{ background: '#fee2e2', color: '#dc2626' }}>
              <AlertTriangle size={15} />
            </div>
          </div>
          <div className="esc-kpi-num" style={{ color: '#dc2626' }}>{kpis.openTickets}</div>
          <div className="esc-kpi-sub">Currently requiring action</div>
        </div>

        <div
          className={`esc-kpi-card ${priorityFilter === 'P1' ? 'active-filter' : ''}`}
          onClick={() => setPriorityFilter(priorityFilter === 'P1' ? 'all' : 'P1')}
        >
          <div className="esc-kpi-top">
            <span className="esc-kpi-label">P1 CRITICAL</span>
            <div className="esc-kpi-icon-wrap" style={{ background: '#fee2e2', color: '#b91c1c' }}>
              <Shield size={15} />
            </div>
          </div>
          <div className="esc-kpi-num" style={{ color: '#b91c1c' }}>{kpis.p1Critical}</div>
          <div className="esc-kpi-sub">Immediate attention (1h SLA)</div>
        </div>

        <div
          className="esc-kpi-card"
          onClick={() => { setStatusFilter('all'); setSearchQuery('breached'); }}
        >
          <div className="esc-kpi-top">
            <span className="esc-kpi-label">SLA BREACHED</span>
            <div className="esc-kpi-icon-wrap" style={{ background: '#fef3c7', color: '#d97706' }}>
              <Clock size={15} />
            </div>
          </div>
          <div className="esc-kpi-num" style={{ color: '#d97706' }}>{kpis.slaBreached}</div>
          <div className="esc-kpi-sub">Past resolution target</div>
        </div>

        <div
          className={`esc-kpi-card ${statusFilter === 'resolved' ? 'active-filter' : ''}`}
          onClick={() => setStatusFilter(statusFilter === 'resolved' ? 'all' : 'resolved')}
        >
          <div className="esc-kpi-top">
            <span className="esc-kpi-label">RESOLVED TODAY</span>
            <div className="esc-kpi-icon-wrap" style={{ background: '#ecfdf5', color: '#059669' }}>
              <CheckCircle2 size={15} />
            </div>
          </div>
          <div className="esc-kpi-num" style={{ color: '#059669' }}>{kpis.resolvedToday}</div>
          <div className="esc-kpi-sub">Closed successfully</div>
        </div>

        <div className="esc-kpi-card">
          <div className="esc-kpi-top">
            <span className="esc-kpi-label">AVG RESOLUTION</span>
            <div className="esc-kpi-icon-wrap" style={{ background: '#eff6ff', color: '#1d4ed8' }}>
              <Activity size={15} />
            </div>
          </div>
          <div className="esc-kpi-num" style={{ color: '#1e3a8a' }}>{kpis.avgResolution}</div>
          <div className="esc-kpi-sub">Current month average</div>
        </div>
      </div>

      {/* 2.5 Blueprint 4-Step Incident Resolution Journey */}
      <div className="esc-journey-strip">
        <div className="esc-journey-card">
          <div className="esc-journey-badge">1</div>
          <div>
            <div className="esc-journey-title">Raise &amp; Triage</div>
            <div className="esc-journey-desc">Driver app or telematics triggers issue; capture GPS, severity &amp; fault symptoms.</div>
          </div>
        </div>
        <div className="esc-journey-card">
          <div className="esc-journey-badge">2</div>
          <div>
            <div className="esc-journey-title">Assign &amp; SLA Clock</div>
            <div className="esc-journey-desc">Auto-routes to Fleet Ops, Maintenance, Finance or Support with active countdowns.</div>
          </div>
        </div>
        <div className="esc-journey-card">
          <div className="esc-journey-badge">3</div>
          <div>
            <div className="esc-journey-title">Investigate &amp; Cross-Link</div>
            <div className="esc-journey-desc">Directly link to Vehicle Master, Job Cards, Lease agreements &amp; Wallet deductions.</div>
          </div>
        </div>
        <div className="esc-journey-card">
          <div className="esc-journey-badge">4</div>
          <div>
            <div className="esc-journey-title">Resolve, Confirm &amp; Close</div>
            <div className="esc-journey-desc">Verify corrective repairs, obtain driver confirmation and preserve immutable audit trail.</div>
          </div>
        </div>
      </div>

      {/* 3. Sleek Dedicated Filter Hub */}
      <div className="esc-filter-hub">
        {/* Row 1: Search Input + Status Segmented Buttons */}
        <div className="esc-search-tabs-row">
          <div className="esc-search-input-wrap">
            <Search size={16} className="esc-search-icon" />
            <input
              type="text"
              className="esc-search-input"
              placeholder="Search by ticket ID (e.g. ESC-1024), driver, vehicle plate, or problem..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button className="esc-search-clear" onClick={() => setSearchQuery('')}>✕</button>
            )}
          </div>

          <div className="esc-status-tabs">
            {[
              { id: 'all', label: 'All Tickets', count: statusCounts.all },
              { id: 'open', label: 'Open', count: statusCounts.open },
              { id: 'in review', label: 'In Review', count: statusCounts.inReview },
              { id: 'waiting for driver', label: 'Waiting for Driver', count: statusCounts.waiting },
              { id: 'resolved', label: 'Resolved', count: statusCounts.resolved }
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                className={`esc-status-tab-btn ${statusFilter === tab.id ? 'active' : ''}`}
                onClick={() => setStatusFilter(tab.id)}
              >
                <span>{tab.label}</span>
                <span className="badge">{tab.count}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Row 2: Secondary Dropdown Filters + Category Filters */}
        <div className="esc-secondary-filters">
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748b', fontSize: '11.5px', fontWeight: 650 }}>
            <Filter size={13} />
            <span>Refine by:</span>
          </div>

          {/* Priority Select */}
          <div className="esc-select-wrap">
            <select
              className="esc-select-custom"
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
            >
              <option value="all">All Priorities</option>
              <option value="P1">P1 — Critical (1h SLA)</option>
              <option value="P2">P2 — High (4h SLA)</option>
              <option value="P3">P3 — Normal (24h SLA)</option>
            </select>
            <ChevronDown size={14} className="esc-select-arrow" />
          </div>

          {/* Category Select */}
          <div className="esc-select-wrap">
            <select
              className="esc-select-custom"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="all">All Categories</option>
              <option value="Vehicle Breakdown">Vehicle Breakdown</option>
              <option value="Wallet / Deduction">Wallet / Deduction</option>
              <option value="Payment / Earnings">Payment / Earnings</option>
              <option value="Driver Safety">Driver Safety</option>
              <option value="Vehicle Assignment">Vehicle Assignment</option>
              <option value="Lease / Agreement">Lease / Agreement</option>
              <option value="Maintenance">Maintenance</option>
              <option value="Compliance">Compliance</option>
              <option value="Other">Other</option>
            </select>
            <ChevronDown size={14} className="esc-select-arrow" />
          </div>

          {(searchQuery || statusFilter !== 'all' || priorityFilter !== 'all' || categoryFilter !== 'all') && (
            <button
              className="btn small"
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('all');
                setPriorityFilter('all');
                setCategoryFilter('all');
              }}
              style={{
                marginLeft: 'auto',
                fontSize: '11px',
                borderRadius: '7px',
                color: '#ef4444',
                borderColor: '#fca5a5',
                background: '#fff5f5'
              }}
            >
              ✕ Reset All Filters
            </button>
          )}
        </div>
      </div>

      {/* 4. Tickets Data Table Card */}
      <div className="esc-table-card">
        <div style={{ overflowX: 'auto' }}>
          <table className="esc-data-table">
            <thead>
              <tr>
                <th>TICKET</th>
                <th>DRIVER</th>
                <th>VEHICLE</th>
                <th>CATEGORY</th>
                <th>PRIORITY</th>
                <th>STATUS</th>
                <th>OWNER &amp; TEAM</th>
                <th>SLA TRACKER</th>
                <th>CONNECTED MODULE</th>
                <th>PROBLEM SUMMARY</th>
                <th style={{ textAlign: 'right' }}>ACTION</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="11" style={{ textAlign: 'center', padding: '42px', color: '#64748b' }}>
                    Syncing escalation records with central registry...
                  </td>
                </tr>
              ) : tickets.length === 0 ? (
                <tr>
                  <td colSpan="11" style={{ textAlign: 'center', padding: '48px', color: '#64748b' }}>
                    <div style={{ fontSize: '32px', marginBottom: '8px' }}>📂</div>
                    <strong style={{ fontSize: '14px', color: '#0f172a' }}>No escalation tickets match the active filters.</strong>
                    <div style={{ marginTop: '6px', fontSize: '12px' }}>
                      Try clearing filters or search query to view all records.
                    </div>
                  </td>
                </tr>
              ) : (
                tickets.map(ticket => (
                  <tr
                    key={ticket.id}
                    onClick={() => setSelectedTicket(ticket)}
                    style={{ cursor: 'pointer' }}
                  >
                    {/* Ticket Cell */}
                    <td>
                      <span className="esc-ticket-pill">{ticket.id}</span>
                      {ticket.source && (
                        <div style={{ fontSize: '9.5px', color: '#64748b', marginTop: '3px', fontWeight: 600 }}>
                          {ticket.source}
                        </div>
                      )}
                    </td>

                    {/* Driver Cell */}
                    <td>
                      <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '12.5px' }}>{ticket.driver}</div>
                      <div style={{ fontSize: '10.5px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '3px', marginTop: '1px' }}>
                        <Phone size={10} />
                        <span>{ticket.driverPhone || '—'}</span>
                      </div>
                    </td>

                    {/* Vehicle Cell */}
                    <td className="esc-veh-cell">
                      <div className="esc-hsrp-badge">
                        <span className="ind">IND</span>
                        <span className="plate">{ticket.vehicle || '—'}</span>
                      </div>
                      <div className="model-text" title={ticket.vehicleModel || 'TATA TIGOR EV'}>
                        {ticket.vehicleModel || 'TATA TIGOR EV'}
                      </div>
                    </td>

                    {/* Category Cell */}
                    <td>
                      <span
                        style={{
                          background: '#f1f5f9',
                          color: '#334155',
                          border: '1px solid #e2e8f0',
                          borderRadius: '6px',
                          padding: '3px 8px',
                          fontSize: '11px',
                          fontWeight: 650,
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {ticket.category}
                      </span>
                    </td>

                    {/* Priority Cell */}
                    <td>{renderPriorityBadge(ticket.priority)}</td>

                    {/* Status Cell */}
                    <td>{renderStatusBadge(ticket.status)}</td>

                    {/* Owner & Team */}
                    <td>
                      <div style={{ fontWeight: 700, color: '#0f172a' }}>{ticket.owner}</div>
                      <div style={{ fontSize: '10px', color: '#64748b' }}>{ticket.team}</div>
                    </td>

                    {/* SLA Tracker */}
                    <td>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '11px',
                          fontWeight: 750,
                          color: ticket.slaBreached ? '#dc2626' : ticket.priority === 'P1' ? '#d97706' : '#059669',
                          background: ticket.slaBreached ? '#fee2e2' : ticket.priority === 'P1' ? '#fef3c7' : '#ecfdf5',
                          padding: '3px 8px',
                          borderRadius: '6px'
                        }}
                      >
                        <Clock size={11} />
                        <span>{ticket.sla}</span>
                      </span>
                    </td>

                    {/* Connected Module Action Link */}
                    <td>
                      {renderConnectedModulePill(ticket)}
                    </td>

                    {/* Problem Summary (Max Clean 2-Line Clamping) */}
                    <td style={{ maxWidth: '300px' }}>
                      <div
                        style={{
                          fontSize: '11.5px',
                          color: '#334155',
                          lineHeight: '1.45',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}
                        title={ticket.problem}
                      >
                        {ticket.problem}
                      </div>
                      {ticket.location && (
                        <div style={{ fontSize: '10.5px', color: '#64748b', marginTop: '3px', display: 'flex', alignItems: 'center', gap: '3px' }}>
                          <MapPin size={10} style={{ color: '#94a3b8' }} />
                          <span>{ticket.location}</span>
                        </div>
                      )}
                    </td>

                    {/* Action Button */}
                    <td style={{ textAlign: 'right' }} onClick={(e) => e.stopPropagation()}>
                      <button
                        className="esc-action-btn"
                        onClick={() => setSelectedTicket(ticket)}
                      >
                        <span>View Details</span>
                        <span style={{ fontSize: '13px', lineHeight: 1 }}>→</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. Master Routing Categories Grid */}
      <div className="panel" style={{ marginTop: '20px', borderRadius: '12px', padding: '18px 20px' }}>
        <div className="panel-head" style={{ marginBottom: '14px' }}>
          <div>
            <h3 style={{ fontSize: '13px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', margin: 0, color: '#0f172a' }}>
              ESCALATION CATEGORIES &amp; SLA OWNERSHIP
            </h3>
            <span className="sub" style={{ fontSize: '11.5px', color: '#64748b' }}>
              Master routing categories, response targets, and responsible teams as per operational blueprint
            </span>
          </div>
          <button
            className="btn small"
            onClick={() => handleOpenCreateModal('Other')}
            style={{ borderRadius: '7px', fontSize: '11px' }}
          >
            + Custom Issue
          </button>
        </div>

        <div className="grid3" style={{ gap: '14px' }}>
          {[
            {
              name: 'Vehicle Breakdown',
              team: 'Fleet Operations',
              priority: 'P1 Critical',
              target: '1 Hour SLA',
              icon: '🚨',
              desc: 'Roadside halts, motor/battery faults, towing and emergency recovery',
              moduleRoute: 'maintenance',
              moduleLabel: 'Maintenance'
            },
            {
              name: 'Wallet / Deduction',
              team: 'Finance',
              priority: 'P2 High',
              target: '4 Hours SLA',
              icon: '💳',
              desc: 'Duplicate lease debits, charging holds, balance breaches and top-up disputes',
              moduleRoute: 'wallet',
              moduleLabel: 'Wallet Health'
            },
            {
              name: 'Payment / Earnings',
              team: 'Driver Support',
              priority: 'P2 High',
              target: '4 Hours SLA',
              icon: '₹',
              desc: 'Rapido revenue share splits, net entitlement calculations and incentive queries',
              moduleRoute: 'invoices',
              moduleLabel: 'Invoices'
            },
            {
              name: 'Driver Safety',
              team: 'Fleet Operations',
              priority: 'P1 Critical',
              target: '1 Hour SLA',
              icon: '🛡️',
              desc: 'Accidents, collisions, roadside assistance, SOS and driver welfare protocols',
              moduleRoute: 'drivers',
              moduleLabel: 'Driver Tower'
            },
            {
              name: 'Vehicle Assignment',
              team: 'Fleet Operations',
              priority: 'P3 Normal',
              target: '24 Hours SLA',
              icon: '🔄',
              desc: 'Primary driver swap, shift reassignment and EV inventory transfers',
              moduleRoute: 'vehicle-assignments',
              moduleLabel: 'Assignments'
            },
            {
              name: 'Lease / Agreement',
              team: 'Driver Support',
              priority: 'P3 Normal',
              target: '24 Hours SLA',
              icon: '📝',
              desc: 'Deal frequency changes, digital agreement addendums, deposit refunds',
              moduleRoute: 'bookings',
              moduleLabel: 'Bookings'
            },
            {
              name: 'Maintenance',
              team: 'Fleet Operations',
              priority: 'P2 High',
              target: '6 Hours SLA',
              icon: '🔧',
              desc: 'Workshop delays, parts stockouts, repeat defects and job card disputes',
              moduleRoute: 'maintenance',
              moduleLabel: 'Maintenance'
            },
            {
              name: 'Compliance',
              team: 'Fleet Operations',
              priority: 'P3 Normal',
              target: '24 Hours SLA',
              icon: '⚖️',
              desc: 'Traffic challans, insurance renewals, fitness certs and RTO compliance',
              moduleRoute: 'fleet',
              moduleLabel: 'Control Tower'
            },
            {
              name: 'Other',
              team: 'Driver Support',
              priority: 'P3 Normal',
              target: '24 Hours SLA',
              icon: '📋',
              desc: 'Mobile verification, telematics offline issues and general portal requests',
              moduleRoute: 'drivers',
              moduleLabel: 'Driver Ops'
            }
          ].map(cat => (
            <div
              key={cat.name}
              className="card"
              style={{
                padding: '16px 18px',
                cursor: 'pointer',
                borderRadius: '11px',
                transition: 'all 0.15s ease',
                border: categoryFilter === cat.name ? '1.5px solid #1769ff' : '1px solid #e2e8f0',
                background: categoryFilter === cat.name ? '#f8fbff' : '#ffffff'
              }}
              onClick={() => handleOpenCreateModal(cat.name)}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '22px' }}>{cat.icon}</span>
                <span className={`pill ${cat.priority.includes('P1') ? 'red' : cat.priority.includes('P2') ? 'orange' : 'blue'}`}>
                  {cat.priority}
                </span>
              </div>
              <strong style={{ fontSize: '13px', display: 'block', color: '#0d2140', fontWeight: 800 }}>{cat.name}</strong>
              <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px', lineHeight: 1.45 }}>
                {cat.desc}
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginTop: '12px',
                  paddingTop: '10px',
                  borderTop: '1px solid #f1f5f9',
                  fontSize: '11px'
                }}
              >
                <span style={{ color: '#475569', fontWeight: 650 }}>{cat.team} · <span style={{ color: '#1769ff', fontWeight: 750 }}>{cat.target}</span></span>
                {onNavigate && (
                  <button
                    type="button"
                    className="btn small"
                    style={{ fontSize: '10px', padding: '3px 8px', borderRadius: '6px' }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onNavigate(cat.moduleRoute);
                    }}
                    title={`Jump directly to ${cat.moduleLabel}`}
                  >
                    Open {cat.moduleLabel} ↗
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Blueprint Operational Rule Notice */}
      <div className="notice" style={{ marginTop: '16px', borderRadius: '10px', padding: '12px 16px' }}>
        <strong>ⓘ SIKHAR System Blueprint — Escalation Policy:</strong>
        <div style={{ marginTop: '4px', lineHeight: '1.5' }}>
          Repeated telemetry checks reuse existing open tickets. A vehicle breakdown does not automatically suspend its driver.
          Vehicles in maintenance remain locked and cannot be assigned.
          Every escalation remains strictly linked to driver, vehicle, category, priority, owner, evidence, and audit logs.
        </div>
      </div>

      {/* ========================================================
          6. DETAILED TICKET VIEW MODAL
          ======================================================== */}
      {selectedTicket && (
        <div className="modalback" onClick={() => setSelectedTicket(null)}>
          <div
            className="modal"
            style={{ width: 'min(900px, 94vw)', borderRadius: '14px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <button className="close" onClick={() => setSelectedTicket(null)}>×</button>

            {/* Ticket Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
              <span style={{ color: '#ef3340', display: 'flex' }}><AlertTriangle size={20} /></span>
              <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 850 }}>
                {selectedTicket.id} · {selectedTicket.category}
              </h2>
              {renderPriorityBadge(selectedTicket.priority)}
              {renderStatusBadge(selectedTicket.status)}
            </div>

            <div className="statusbar" style={{ marginTop: '10px', marginBottom: '16px' }}>
              <span className={`dot ${selectedTicket.status === 'Resolved' ? 'good' : ''}`}></span>
              <b>{selectedTicket.priority} Resolution Track · SLA: {selectedTicket.sla}</b>
              <span className="tagline">
                Owner: {selectedTicket.owner} ({selectedTicket.team}) · Reported: {new Date(selectedTicket.createdAt).toLocaleDateString('en-GB')}
              </span>
            </div>

            {/* Problem & Impact Details Box (Crucial User Requirement) */}
            <div
              style={{
                background: '#fff8f8',
                border: '1.5px solid #fed7d7',
                borderRadius: '10px',
                padding: '14px 16px',
                marginBottom: '16px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <span style={{ color: '#e53e3e', fontWeight: 800, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  PROBLEM STATEMENT &amp; OPERATIONAL ISSUE DETAILS
                </span>
                {selectedTicket.location && (
                  <span style={{ marginLeft: 'auto', fontSize: '11px', color: '#718096', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <MapPin size={12} /> {selectedTicket.location}
                  </span>
                )}
              </div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#1a202c', lineHeight: 1.5 }}>
                {selectedTicket.problem}
              </div>
              {selectedTicket.impact && (
                <div style={{ marginTop: '8px', fontSize: '12px', color: '#c53030' }}>
                  <strong>Operational Impact:</strong> {selectedTicket.impact}
                </div>
              )}
            </div>

            {/* Split Details: Escalation Journey (Left) vs Associated Records (Right) */}
            <div className="grid2" style={{ gap: '14px', marginTop: 0 }}>
              {/* Left Column: 4-Stage Escalation Journey */}
              <div className="panel" style={{ padding: '14px', borderRadius: '10px' }}>
                <h3 style={{ fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', margin: '0 0 12px' }}>
                  ESCALATION JOURNEY (BLUEPRINT STEPS)
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {(selectedTicket.journey || [
                    { step: 1, title: 'Raise and triage', desc: 'Driver or staff records category, description, priority, evidence and location.', status: 'completed' },
                    { step: 2, title: 'Assign and respond', desc: 'Route to operations, maintenance, finance or support; start response clocks.', status: 'completed' },
                    { step: 3, title: 'Investigate and act', desc: 'Add notes; link vehicle, lease, invoice, job card or charging session.', status: 'in_progress' },
                    { step: 4, title: 'Resolve, confirm and close', desc: 'Record outcome and required driver confirmation; retain audit history.', status: 'pending' }
                  ]).map((j) => (
                    <div
                      key={j.step}
                      style={{
                        padding: '10px 12px',
                        borderRadius: '8px',
                        border: '1px solid #e2e8f0',
                        background: j.status === 'completed' ? '#f0fdf4' : j.status === 'in_progress' ? '#eff6ff' : '#f8fafc'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontWeight: 750, fontSize: '11px', color: '#0f172a' }}>
                          Step {j.step} · {j.title}
                        </span>
                        <span
                          className={`pill ${
                            j.status === 'completed'
                              ? 'green'
                              : j.status === 'in_progress'
                              ? 'blue'
                              : 'orange'
                          }`}
                        >
                          {j.status === 'completed' ? '✓ Completed' : j.status === 'in_progress' ? 'In Progress' : 'Pending'}
                        </span>
                      </div>
                      <div style={{ fontSize: '10.5px', color: '#64748b', marginTop: '4px', lineHeight: 1.35 }}>
                        {j.desc}
                      </div>
                      {j.timestamp && j.timestamp !== 'Pending' && (
                        <div style={{ fontSize: '9.5px', color: '#94a3b8', marginTop: '4px' }}>
                          Recorded: {j.timestamp} {j.actor ? `by ${j.actor}` : ''}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Column: Ticket Info & Linked Records */}
              <div className="panel" style={{ padding: '14px', borderRadius: '10px' }}>
                <h3 style={{ fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', margin: '0 0 10px' }}>
                  ASSOCIATED RECORDS &amp; ACTORS
                </h3>

                <div className="row">
                  <span style={{ color: '#64748b' }}>Driver</span>
                  <div style={{ textAlign: 'right' }}>
                    <b>{selectedTicket.driver}</b>
                    <div style={{ fontSize: '10px', color: '#64748b' }}>{selectedTicket.driverPhone}</div>
                  </div>
                </div>

                <div className="row">
                  <span style={{ color: '#64748b' }}>Vehicle</span>
                  <div style={{ textAlign: 'right' }}>
                    <b>{selectedTicket.vehicle}</b>
                    <div style={{ fontSize: '10px', color: '#64748b' }}>{selectedTicket.vehicleModel}</div>
                  </div>
                </div>

                <div className="row">
                  <span style={{ color: '#64748b' }}>Assigned Owner</span>
                  <b>{selectedTicket.owner} ({selectedTicket.team})</b>
                </div>

                <div className="row">
                  <span style={{ color: '#64748b' }}>Ticket Source</span>
                  <span>{selectedTicket.source || 'Driver App'}</span>
                </div>

                {/* Linked Records & Platform Connections */}
                <div className="esc-cross-links-box">
                  <div style={{ fontSize: '10.5px', color: '#475569', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.05em', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <Activity size={13} style={{ color: '#1769ff' }} />
                    <span>CROSS-MODULE ACTIONS &amp; PLATFORM SHORTCUTS</span>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {(selectedTicket.category === 'Vehicle Breakdown' || selectedTicket.category === 'Maintenance') && (
                      <button
                        type="button"
                        className="esc-cross-btn primary"
                        onClick={() => onNavigate && onNavigate('maintenance')}
                        title="Open Maintenance & Job Cards"
                      >
                        <Wrench size={13} />
                        <span>Open Maintenance Job Cards →</span>
                      </button>
                    )}
                    {(selectedTicket.category === 'Wallet / Deduction' || selectedTicket.category === 'Payment / Earnings') && (
                      <button
                        type="button"
                        className="esc-cross-btn primary"
                        onClick={() => onNavigate && onNavigate('wallet')}
                        title="Open Driver Wallet Health"
                      >
                        <Wallet size={13} />
                        <span>Inspect Driver Wallet Health →</span>
                      </button>
                    )}
                    {selectedTicket.category === 'Vehicle Assignment' && (
                      <button
                        type="button"
                        className="esc-cross-btn primary"
                        onClick={() => onNavigate && onNavigate('vehicle-assignments')}
                        title="Open Vehicle Assignments"
                      >
                        <Car size={13} />
                        <span>Manage Vehicle Assignment →</span>
                      </button>
                    )}
                    {selectedTicket.category === 'Driver Safety' && (
                      <button
                        type="button"
                        className="esc-cross-btn primary"
                        onClick={() => onNavigate && onNavigate('drivers')}
                        title="Open Driver Control Tower"
                      >
                        <Shield size={13} />
                        <span>Open Driver Safety Profile →</span>
                      </button>
                    )}
                    <button
                      type="button"
                      className="esc-cross-btn"
                      onClick={() => onNavigate && onNavigate('fleet')}
                      title="Open Fleet Control Tower"
                    >
                      <Truck size={13} />
                      <span>Fleet Control Tower</span>
                    </button>
                    <button
                      type="button"
                      className="esc-cross-btn"
                      onClick={() => onNavigate && onNavigate('vehicles')}
                      title="Open Vehicle Master"
                    >
                      <Car size={13} />
                      <span>Vehicle Master ({selectedTicket.vehicle})</span>
                    </button>
                    <button
                      type="button"
                      className="esc-cross-btn"
                      onClick={() => onNavigate && onNavigate('drivers')}
                      title="Open Driver Profile"
                    >
                      <Users size={13} />
                      <span>Driver Profile ({selectedTicket.driver})</span>
                    </button>
                    <button
                      type="button"
                      className="esc-cross-btn"
                      onClick={() => onNavigate && onNavigate('invoices')}
                      title="View Rental Invoices"
                    >
                      <Receipt size={13} />
                      <span>Rental Invoices</span>
                    </button>
                    <button
                      type="button"
                      className="esc-cross-btn"
                      onClick={() => onNavigate && onNavigate('bookings')}
                      title="View Bookings & Leases"
                    >
                      <FileText size={13} />
                      <span>Bookings &amp; Leases</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Audit Trail & Investigation Timeline */}
            <div className="panel" style={{ marginTop: '14px', padding: '14px', borderRadius: '10px' }}>
              <h3 style={{ fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', margin: '0 0 10px' }}>
                AUDIT TRAIL &amp; INVESTIGATION NOTES
              </h3>

              <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
                <input
                  type="text"
                  className="search"
                  placeholder="Type an investigation update or action note..."
                  value={newNoteText}
                  onChange={(e) => setNewNoteText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddNote()}
                  style={{ flex: 1, borderRadius: '8px' }}
                />
                <button
                  className="btn primary small"
                  onClick={handleAddNote}
                  disabled={isSubmittingNote || !newNoteText.trim()}
                  style={{ borderRadius: '8px' }}
                >
                  {isSubmittingNote ? 'Saving...' : 'Add Note'}
                </button>
              </div>

              <div style={{ maxHeight: '180px', overflowY: 'auto' }}>
                {(selectedTicket.timeline || []).map((entry, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: '8px 10px',
                      borderBottom: '1px solid #f1f5f9',
                      fontSize: '11px',
                      display: 'flex',
                      gap: '12px',
                      alignItems: 'flex-start'
                    }}
                  >
                    <span style={{ color: '#94a3b8', minWidth: '110px', flexShrink: 0, fontSize: '10px' }}>
                      {entry.time}
                    </span>
                    <div>
                      <strong style={{ color: '#0f172a' }}>{entry.user}: </strong>
                      <span style={{ color: '#334155' }}>{entry.text}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Resolution Form (if resolving) */}
            {isResolving && (
              <div
                style={{
                  background: '#f0fdf4',
                  border: '1.5px solid #bbf7d0',
                  borderRadius: '10px',
                  padding: '14px',
                  marginTop: '14px'
                }}
              >
                <h4 style={{ margin: '0 0 8px', color: '#166534', fontSize: '13px', fontWeight: 800 }}>
                  Record Final Resolution &amp; Confirmation
                </h4>
                <div className="field">
                  <label>Resolution Outcome &amp; Actions Taken *</label>
                  <textarea
                    style={{ width: '100%', minHeight: '60px', padding: '8px', borderRadius: '6px', border: '1px solid #bbf7d0', font: 'inherit', fontSize: '12px' }}
                    placeholder="Describe how the problem was resolved (e.g. Tow truck delivered vehicle to workshop, replacement arranged, credit applied)..."
                    value={resolutionNote}
                    onChange={(e) => setResolutionNote(e.target.value)}
                  />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '8px 0' }}>
                  <input
                    type="checkbox"
                    id="driverConfirmCheck"
                    checked={driverConfirmed}
                    onChange={(e) => setDriverConfirmed(e.target.checked)}
                  />
                  <label htmlFor="driverConfirmCheck" style={{ fontSize: '11px', cursor: 'pointer', fontWeight: 600 }}>
                    Driver confirmation received and verified
                  </label>
                </div>
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '10px' }}>
                  <button className="btn small" onClick={() => setIsResolving(false)}>
                    Cancel
                  </button>
                  <button className="btn small green" onClick={handleResolveTicket}>
                    Confirm &amp; Close Ticket
                  </button>
                </div>
              </div>
            )}

            {/* Modal Actions Footer */}
            <div className="modal-foot" style={{ marginTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: '8px' }}>
                {selectedTicket.status !== 'In Review' && selectedTicket.status !== 'Resolved' && (
                  <button className="btn small" onClick={() => handleStatusChange('In Review')}>
                    Mark In Review
                  </button>
                )}
                {selectedTicket.status !== 'Waiting for Driver' && selectedTicket.status !== 'Resolved' && (
                  <button className="btn small" onClick={() => handleStatusChange('Waiting for Driver')}>
                    Wait for Driver
                  </button>
                )}
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="btn" onClick={() => setSelectedTicket(null)}>
                  Close Window
                </button>
                {selectedTicket.status !== 'Resolved' && selectedTicket.status !== 'Closed' && !isResolving && (
                  <button className="btn primary" onClick={() => setIsResolving(true)}>
                    Resolve Ticket →
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          7. CREATE ESCALATION MODAL
          ======================================================== */}
      {isCreateModalOpen && (
        <div className="modalback" onClick={() => setIsCreateModalOpen(false)}>
          <div
            className="modal"
            style={{ width: 'min(720px, 92vw)', borderRadius: '14px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <button className="close" onClick={() => setIsCreateModalOpen(false)}>×</button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span style={{ color: '#ef3340', display: 'flex' }}><AlertTriangle size={20} /></span>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 850 }}>
                Create Escalation Ticket
              </h2>
            </div>
            <div className="sub" style={{ marginBottom: '14px' }}>
              Log a problem, exception or operational issue with assigned SLA clock and routing.
            </div>

            <form onSubmit={handleCreateSubmit}>
              <div className="grid2">
                <div className="field">
                  <label>Driver Full Name *</label>
                  <input
                    type="text"
                    required
                    value={createForm.driver}
                    onChange={(e) => setCreateForm({ ...createForm, driver: e.target.value })}
                  />
                </div>
                <div className="field">
                  <label>Driver Phone Number</label>
                  <input
                    type="text"
                    value={createForm.driverPhone}
                    onChange={(e) => setCreateForm({ ...createForm, driverPhone: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid2">
                <div className="field">
                  <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>Vehicle Registration Number *</span>
                    {matchedVehicleInfo && (
                      <span style={{ fontSize: '10.5px', color: '#16a34a', fontWeight: 700 }}>
                        ✓ Plate Recognized
                      </span>
                    )}
                  </label>
                  <input
                    type="text"
                    required
                    list="fleet-registration-list"
                    placeholder="e.g. HR55BD6737, DL52GD6605..."
                    value={createForm.vehicle}
                    onChange={(e) => handleVehicleChange(e.target.value)}
                    style={{ textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.5px' }}
                  />
                  <datalist id="fleet-registration-list">
                    {fleetVehicles.map(v => (
                      <option key={v.registration || v.id} value={v.registration}>
                        {v.registration} · {v.model} ({v.driver || 'No Driver'}) — {v.status}
                      </option>
                    ))}
                  </datalist>

                  {/* Auto-fill indicator tag */}
                  {matchedVehicleInfo && (
                    <div className={`esc-auto-pill ${matchedVehicleInfo.isMaintenance ? 'warn' : ''}`}>
                      {matchedVehicleInfo.isMaintenance ? (
                        <span>⚠️ <strong>{matchedVehicleInfo.model}</strong> is At Workshop / Maintenance (Locked for Assignment).</span>
                      ) : (
                        <span>✓ Auto-populated: <strong>{matchedVehicleInfo.model}</strong> · Driver: {matchedVehicleInfo.driver || 'Unassigned'}</span>
                      )}
                    </div>
                  )}
                </div>

                <div className="field">
                  <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>Vehicle Model / Powertrain</span>
                    <span style={{ fontSize: '10px', color: matchedVehicleInfo ? '#16a34a' : '#64748b', fontWeight: 650 }}>
                      {matchedVehicleInfo ? '● Auto-filled from Registry' : 'Editable'}
                    </span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. TATA TIGOR EV XPRESS T"
                    value={createForm.vehicleModel}
                    onChange={(e) => setCreateForm({ ...createForm, vehicleModel: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid2">
                <div className="field">
                  <label>Escalation Category *</label>
                  <select
                    value={createForm.category}
                    onChange={(e) => {
                      const cat = e.target.value;
                      setCreateForm({
                        ...createForm,
                        category: cat,
                        priority: cat === 'Vehicle Breakdown' || cat === 'Driver Safety' ? 'P1' : 'P2',
                        team: cat === 'Wallet / Deduction' ? 'Finance' : cat === 'Payment / Earnings' || cat === 'Lease / Agreement' ? 'Driver Support' : 'Fleet Operations'
                      });
                    }}
                  >
                    <option value="Vehicle Breakdown">Vehicle Breakdown</option>
                    <option value="Wallet / Deduction">Wallet / Deduction</option>
                    <option value="Payment / Earnings">Payment / Earnings</option>
                    <option value="Driver Safety">Driver Safety</option>
                    <option value="Vehicle Assignment">Vehicle Assignment</option>
                    <option value="Lease / Agreement">Lease / Agreement</option>
                    <option value="Maintenance">Maintenance</option>
                    <option value="Compliance">Compliance</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="field">
                  <label>Priority Level *</label>
                  <select
                    value={createForm.priority}
                    onChange={(e) => setCreateForm({ ...createForm, priority: e.target.value })}
                  >
                    <option value="P1">P1 — Critical (1 Hour SLA)</option>
                    <option value="P2">P2 — High (4 Hours SLA)</option>
                    <option value="P3">P3 — Normal (24 Hours SLA)</option>
                  </select>
                </div>
              </div>

              {/* Problem Details Textarea (User Explicit Request) */}
              <div className="field">
                <label>Problem Statement &amp; Issue Details *</label>
                <textarea
                  required
                  style={{
                    width: '100%',
                    minHeight: '88px',
                    padding: '10px',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    font: 'inherit',
                    fontSize: '12px'
                  }}
                  placeholder="Write clear description of what happened, symptoms, error codes, driver complaints, or mechanical/financial faults..."
                  value={createForm.problem}
                  onChange={(e) => setCreateForm({ ...createForm, problem: e.target.value })}
                />
              </div>

              <div className="field">
                <label>Operational Impact</label>
                <input
                  type="text"
                  placeholder="e.g. Passenger trip canceled, vehicle stuck off-road, charging hold failed"
                  value={createForm.impact}
                  onChange={(e) => setCreateForm({ ...createForm, impact: e.target.value })}
                />
              </div>

              <div className="grid2">
                <div className="field">
                  <label>Current Location / Yard</label>
                  <input
                    type="text"
                    value={createForm.location}
                    onChange={(e) => setCreateForm({ ...createForm, location: e.target.value })}
                  />
                </div>
                <div className="field">
                  <label>Assign Team</label>
                  <select
                    value={createForm.team}
                    onChange={(e) => setCreateForm({ ...createForm, team: e.target.value })}
                  >
                    <option value="Fleet Operations">Fleet Operations</option>
                    <option value="Finance">Finance</option>
                    <option value="Maintenance">Maintenance</option>
                    <option value="Driver Support">Driver Support</option>
                  </select>
                </div>
              </div>

              <div className="notice" style={{ marginTop: '12px' }}>
                ⓘ Creating this ticket records the event, initiates the <strong>{createForm.priority}</strong> SLA timer, and links the incident to driver and vehicle records.
              </div>

              <div className="modal-foot" style={{ marginTop: '18px' }}>
                <button type="button" className="btn" onClick={() => setIsCreateModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn primary">
                  Create Escalation Ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
