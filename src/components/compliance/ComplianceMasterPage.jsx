import React, { useState, useEffect, useCallback } from 'react';
import {
  Shield,
  FileText,
  AlertTriangle,
  Search,
  Plus,
  Clock,
  CheckCircle2,
  Users,
  Car,
  MapPin,
  Filter,
  X,
  ArrowLeft,
  ChevronRight,
  TrendingUp,
  RefreshCw,
  Wallet,
  Receipt,
  Download,
  Check,
  Truck,
  CreditCard,
  FileUp,
  Eye
} from '../common/Icons';
import {
  fetchComplianceDataApi,
  createComplianceDocumentApi,
  renewComplianceDocumentApi,
  logChallanApi,
  payChallanApi,
  deductChallanWalletApi,
  fetchFleetTowerApi
} from '../../services/api';

export default function ComplianceMasterPage({ onNavigate, onBackToDashboard }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [complianceData, setComplianceData] = useState({
    kpis: {},
    documents: [],
    challans: []
  });

  // Active View Tab: 'documents' | 'challans' | 'timeline' | 'vehicles'
  const [activeTab, setActiveTab] = useState('documents');

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [docTypeFilter, setDocTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [vehicleFilter, setVehicleFilter] = useState('all');

  // Fleet list for prefill in forms
  const [fleetVehicles, setFleetVehicles] = useState([]);

  // Modals
  const [isAddDocModalOpen, setIsAddDocModalOpen] = useState(false);
  const [isLogChallanModalOpen, setIsLogChallanModalOpen] = useState(false);
  const [renewDocTarget, setRenewDocTarget] = useState(null);
  const [payChallanTarget, setPayChallanTarget] = useState(null);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  // Add Document Form
  const [docForm, setDocForm] = useState({
    vehicle: 'DL52GD6605',
    driver: 'Raj Kumar',
    type: 'Insurance',
    docNumber: 'POL-DIGIT-992019',
    issuer: 'Go Digit General Insurance',
    coverage: 'Commercial Comprehensive (1 OD + 3 TP)',
    startDate: '2026-08-20',
    expiryDate: '2027-08-19',
    premiumInr: '28500',
    feeInr: '0'
  });

  // Renew Form
  const [renewForm, setRenewForm] = useState({
    docNumber: '',
    issuer: '',
    expiryDate: '',
    premiumInr: '',
    notes: 'Renewed via Transport Dept / Insurer portal'
  });

  // Log Challan Form
  const [challanForm, setChallanForm] = useState({
    challanNumber: 'DL5288102941',
    vehicle: 'DL52GD7393',
    driver: 'Sandeep Kumar',
    violation: 'Over-speeding (Commercial zone speed radar)',
    location: 'Rajiv Chowk Flyover, Gurugram',
    authority: 'Haryana Traffic Police ITMS',
    fineAmount: '2000',
    dueDate: '2026-09-05'
  });

  // Pay Challan Form
  const [payForm, setPayForm] = useState({
    paymentMethod: 'Driver Wallet',
    utrReference: 'CHL-PAY-UPI-882104'
  });

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Load compliance records from backend
  const loadComplianceData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetchComplianceDataApi({
        docType: docTypeFilter,
        status: statusFilter,
        search: searchQuery,
        vehicle: vehicleFilter
      });
      if (res) {
        setComplianceData(res);
      }
    } catch (err) {
      console.error('Failed to load compliance data:', err);
      setError(err.message || 'Failed to retrieve compliance records.');
    } finally {
      setLoading(false);
    }
  }, [docTypeFilter, statusFilter, searchQuery, vehicleFilter]);

  useEffect(() => {
    loadComplianceData();
    fetchFleetTowerApi()
      .then(res => {
        if (res && res.vehicles) setFleetVehicles(res.vehicles);
      })
      .catch(err => console.warn('Could not load fleet vehicles:', err));
  }, [loadComplianceData]);

  // Handle vehicle change in add doc form
  const handleDocVehicleChange = (reg) => {
    const v = fleetVehicles.find(item => item.registration === reg);
    setDocForm(prev => ({
      ...prev,
      vehicle: reg,
      driver: v?.driver || prev.driver
    }));
  };

  // Handle vehicle change in challan form
  const handleChallanVehicleChange = (reg) => {
    const v = fleetVehicles.find(item => item.registration === reg);
    setChallanForm(prev => ({
      ...prev,
      vehicle: reg,
      driver: v?.driver || prev.driver
    }));
  };

  // Submit Add Document
  const handleAddDocSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await createComplianceDocumentApi(docForm);
      showToast(res.message || 'Compliance document added successfully!');
      setIsAddDocModalOpen(false);
      loadComplianceData();
    } catch (err) {
      alert(err.message || 'Failed to save document.');
    }
  };

  // Open Renew Modal
  const openRenewModal = (doc) => {
    setRenewDocTarget(doc);
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 1);
    setRenewForm({
      docNumber: doc.docNumber ? `${doc.docNumber}-REN` : '',
      issuer: doc.issuer || '',
      expiryDate: futureDate.toISOString().split('T')[0],
      premiumInr: doc.premiumInr || '',
      notes: `Renewed on ${new Date().toLocaleDateString()}`
    });
  };

  // Submit Renew Document
  const handleRenewSubmit = async (e) => {
    e.preventDefault();
    if (!renewDocTarget) return;
    try {
      const res = await renewComplianceDocumentApi(renewDocTarget.id, renewForm);
      showToast(res.message || 'Document renewed successfully!');
      setRenewDocTarget(null);
      loadComplianceData();
    } catch (err) {
      alert(err.message || 'Failed to renew document.');
    }
  };

  // Submit Log Challan
  const handleLogChallanSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await logChallanApi(challanForm);
      showToast(res.message || 'Traffic e-challan registered!');
      setIsLogChallanModalOpen(false);
      loadComplianceData();
    } catch (err) {
      alert(err.message || 'Failed to log challan.');
    }
  };

  // Submit Pay Challan
  const handlePayChallanSubmit = async (e) => {
    e.preventDefault();
    if (!payChallanTarget) return;
    try {
      const res = await payChallanApi(payChallanTarget.id, payForm);
      showToast(res.message || 'Challan marked as Paid!');
      setPayChallanTarget(null);
      loadComplianceData();
    } catch (err) {
      alert(err.message || 'Payment settlement failed.');
    }
  };

  // Deduct Challan From Wallet Directly
  const handleDeductWallet = async (challanId) => {
    try {
      const res = await deductChallanWalletApi(challanId);
      showToast(res.message || 'Penalty deducted from driver wallet.');
      loadComplianceData();
    } catch (err) {
      alert(err.message || 'Failed to deduct from wallet.');
    }
  };

  const kpis = complianceData.kpis || {};
  const documents = complianceData.documents || [];
  const challans = complianceData.challans || [];

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
                style={{ padding: '4px 9px', borderRadius: '7px' }}
              >
                <ArrowLeft size={13} style={{ marginRight: '4px' }} />
                <span>Dashboard</span>
              </button>
            )}
            <div className="breadcrumb-nav" style={{ margin: 0 }}>
              <span className="breadcrumb-link" onClick={onBackToDashboard}>Operations</span>
              <ChevronRight size={12} className="breadcrumb-sep" />
              <span className="breadcrumb-active">RTO &amp; Vehicle Compliance</span>
            </div>
          </div>

          <h1 style={{ margin: '4px 0 2px' }}>
            <Shield size={22} color="#1d68f0" />
            <span>RTO &amp; Regulatory Fleet Compliance</span>
          </h1>
          <div className="sub">
            Statutory Transport Governance · Insurance, Fitness, Permits, PUC, RC &amp; e-Challan Recovery Grid
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn small"
            onClick={loadComplianceData}
            title="Refresh Compliance Records"
          >
            <RefreshCw size={13} className={loading ? 'spinning' : ''} />
            <span>Sync</span>
          </button>

          <button
            type="button"
            className="btn small primary"
            onClick={() => setIsAddDocModalOpen(true)}
          >
            <FileUp size={14} />
            <span>+ Upload Certificate</span>
          </button>

          <button
            type="button"
            className="btn small primary"
            style={{ background: '#b91c1c', borderColor: '#b91c1c' }}
            onClick={() => setIsLogChallanModalOpen(true)}
          >
            <AlertTriangle size={14} />
            <span>+ Log e-Challan</span>
          </button>
        </div>
      </div>

      {/* 2. Executive 6-Card KPI Grid */}
      <div className="esc-kpis-grid" style={{ gridTemplateColumns: 'repeat(6, 1fr)', gap: '12px', marginBottom: '16px' }}>
        {/* Card 1: Monitored */}
        <div className="esc-kpi-card" onClick={() => { setActiveTab('documents'); setDocTypeFilter('all'); }}>
          <div className="esc-kpi-top">
            <span className="esc-kpi-label">TOTAL MONITORED</span>
            <div className="esc-kpi-icon-wrap" style={{ background: '#eff6ff', color: '#1d68f0' }}>
              <Shield size={15} />
            </div>
          </div>
          <div className="esc-kpi-num">
            {kpis.totalMonitored || 148} <span style={{ fontSize: '13px', fontWeight: 600, color: '#64748b' }}>Docs</span>
          </div>
          <div className="esc-kpi-sub">
            67 Active fleet vehicles
          </div>
        </div>

        {/* Card 2: Compliant */}
        <div className="esc-kpi-card" onClick={() => { setActiveTab('documents'); setStatusFilter('valid'); }}>
          <div className="esc-kpi-top">
            <span className="esc-kpi-label">ROADWORTHY</span>
            <div className="esc-kpi-icon-wrap" style={{ background: '#ecfdf5', color: '#059669' }}>
              <CheckCircle2 size={15} />
            </div>
          </div>
          <div className="esc-kpi-num" style={{ color: '#059669' }}>
            {kpis.compliantVehicles || 58} <span style={{ fontSize: '13px', fontWeight: 600, color: '#64748b' }}>Fleet</span>
          </div>
          <div className="esc-kpi-sub">
            <span style={{ color: '#16a34a', fontWeight: 700 }}>86.5%</span> fully compliant
          </div>
        </div>

        {/* Card 3: Expiring Soon */}
        <div className="esc-kpi-card" onClick={() => { setActiveTab('timeline'); }}>
          <div className="esc-kpi-top">
            <span className="esc-kpi-label">EXPIRING &lt; 30D</span>
            <div className="esc-kpi-icon-wrap" style={{ background: '#fffbeb', color: '#d97706' }}>
              <Clock size={15} />
            </div>
          </div>
          <div className="esc-kpi-num" style={{ color: '#d97706' }}>
            {kpis.expiringSoon || 9} <span style={{ fontSize: '13px', fontWeight: 600, color: '#64748b' }}>Due</span>
          </div>
          <div className="esc-kpi-sub">
            Renewal recommended
          </div>
        </div>

        {/* Card 4: Breached */}
        <div className="esc-kpi-card" onClick={() => { setActiveTab('timeline'); }}>
          <div className="esc-kpi-top">
            <span className="esc-kpi-label">BREACHED / EXPIRED</span>
            <div className="esc-kpi-icon-wrap" style={{ background: '#fee2e2', color: '#dc2626' }}>
              <AlertTriangle size={15} />
            </div>
          </div>
          <div className="esc-kpi-num" style={{ color: '#dc2626' }}>
            {kpis.breachedExpired || 3} <span style={{ fontSize: '13px', fontWeight: 600, color: '#64748b' }}>Overdue</span>
          </div>
          <div className="esc-kpi-sub">
            <strong style={{ color: '#dc2626' }}>Ground Fleet (P1)</strong>
          </div>
        </div>

        {/* Card 5: Challans */}
        <div className="esc-kpi-card" onClick={() => setActiveTab('challans')}>
          <div className="esc-kpi-top">
            <span className="esc-kpi-label">E-CHALLANS</span>
            <div className="esc-kpi-icon-wrap" style={{ background: '#fef2f2', color: '#b91c1c' }}>
              <Receipt size={15} />
            </div>
          </div>
          <div className="esc-kpi-num" style={{ color: '#b91c1c' }}>
            {kpis.pendingChallans || 6} <span style={{ fontSize: '13px', fontWeight: 600, color: '#64748b' }}>Pending</span>
          </div>
          <div className="esc-kpi-sub">
            Virtual court notices
          </div>
        </div>

        {/* Card 6: Fine Liability */}
        <div className="esc-kpi-card" onClick={() => setActiveTab('challans')}>
          <div className="esc-kpi-top">
            <span className="esc-kpi-label">FINE LIABILITY</span>
            <div className="esc-kpi-icon-wrap" style={{ background: '#f5f3ff', color: '#7c3aed' }}>
              <Wallet size={15} />
            </div>
          </div>
          <div className="esc-kpi-num" style={{ color: '#7c3aed' }}>
            ₹{(kpis.totalChallanAmount || 14500).toLocaleString()}
          </div>
          <div className="esc-kpi-sub">
            Driver wallet deductible
          </div>
        </div>
      </div>

      {/* 3. Scenic Quick Status Strip */}
      <div className="vm-summary-strip" style={{ marginBottom: '16px' }}>
        <div className="vm-stat-pill" onClick={() => { setActiveTab('documents'); setDocTypeFilter('insurance'); }} style={{ cursor: 'pointer' }}>
          <span className="pulse-dot green" />
          <span className="vm-stat-label">Insurance Policies:</span>
          <strong className="vm-stat-value green">67 Active</strong>
          <span className="vm-stat-sub">(Digit &amp; ICICI)</span>
        </div>

        <div className="vm-stat-divider" />

        <div className="vm-stat-pill" onClick={() => { setActiveTab('documents'); setDocTypeFilter('fitness'); }} style={{ cursor: 'pointer' }}>
          <span className="pulse-dot amber" />
          <span className="vm-stat-label">RTO Fitness Tests:</span>
          <strong className="vm-stat-value amber">2 Overdue</strong>
          <span className="vm-stat-sub">(Burari RTO)</span>
        </div>

        <div className="vm-stat-divider" />

        <div className="vm-stat-pill" onClick={() => { setActiveTab('documents'); setDocTypeFilter('permit'); }} style={{ cursor: 'pointer' }}>
          <span className="pulse-dot cyan" />
          <span className="vm-stat-label">NCR Reciprocal Permits:</span>
          <strong className="vm-stat-value cyan">64 Valid</strong>
        </div>

        <div className="vm-stat-divider" />

        <div className="vm-stat-pill" onClick={() => setActiveTab('challans')} style={{ cursor: 'pointer' }}>
          <span className="pulse-dot red" />
          <span className="vm-stat-label">Traffic Challan Desk:</span>
          <strong className="vm-stat-value red">6 Notices</strong>
          <span className="vm-stat-sub">(Deductible from Wallet)</span>
        </div>
      </div>

      {/* 4. Filter & Segmented Navigation Bar */}
      <div className="esc-filter-hub">
        <div className="esc-search-tabs-row">
          {/* Segmented Status Tabs */}
          <div className="esc-status-tabs">
            <button
              className={`esc-status-tab-btn ${activeTab === 'documents' ? 'active' : ''}`}
              onClick={() => setActiveTab('documents')}
            >
              <FileText size={14} />
              <span>All Compliance Documents</span>
              <span className="badge">{documents.length}</span>
            </button>

            <button
              className={`esc-status-tab-btn ${activeTab === 'challans' ? 'active' : ''}`}
              onClick={() => setActiveTab('challans')}
            >
              <AlertTriangle size={14} />
              <span>Traffic Police E-Challans</span>
              <span className="badge" style={{ background: '#fee2e2', color: '#b91c1c' }}>{challans.length}</span>
            </button>

            <button
              className={`esc-status-tab-btn ${activeTab === 'timeline' ? 'active' : ''}`}
              onClick={() => setActiveTab('timeline')}
            >
              <Clock size={14} />
              <span>Expiry Alerts &amp; Timeline</span>
            </button>

            <button
              className={`esc-status-tab-btn ${activeTab === 'vehicles' ? 'active' : ''}`}
              onClick={() => setActiveTab('vehicles')}
            >
              <Car size={14} />
              <span>Vehicle Roadworthiness Matrix</span>
            </button>
          </div>

          {/* Search Box */}
          <div className="esc-search-input-wrap">
            <Search size={15} className="esc-search-icon" />
            <input
              type="text"
              placeholder="Search certificate, vehicle, driver, issuer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="esc-search-input"
            />
            {searchQuery && (
              <button className="esc-search-clear" onClick={() => setSearchQuery('')}>×</button>
            )}
          </div>

          {/* Document Type Filter */}
          <div className="esc-select-wrap">
            <select
              className="esc-select-custom"
              value={docTypeFilter}
              onChange={(e) => setDocTypeFilter(e.target.value)}
            >
              <option value="all">All Document Types</option>
              <option value="insurance">Insurance Policies</option>
              <option value="fitness">Fitness Certificates</option>
              <option value="permit">Transport Permits</option>
              <option value="puc">PUC Certificates</option>
              <option value="rc">Registration (RC)</option>
              <option value="dl">Driver Driving Licences</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="esc-select-wrap">
            <select
              className="esc-select-custom"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Statuses</option>
              <option value="valid">Valid</option>
              <option value="expiring soon">Expiring Soon</option>
              <option value="breached">Breached / Expired</option>
            </select>
          </div>
        </div>
      </div>

      {/* ========================================================
          TAB 1: COMPLIANCE DOCUMENTS TABLE
          ======================================================== */}
      {activeTab === 'documents' && (
        <div className="esc-table-card">
          <table className="esc-data-table">
            <thead>
              <tr>
                <th>RECORD ID</th>
                <th>VEHICLE PLATE</th>
                <th>DRIVER</th>
                <th>DOCUMENT TYPE</th>
                <th>CERTIFICATE / POLICY NO.</th>
                <th>ISSUING AUTHORITY</th>
                <th>VALIDITY DATES</th>
                <th>DAYS REMAINING</th>
                <th>STATUS</th>
                <th style={{ textAlign: 'right' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {documents.length === 0 ? (
                <tr>
                  <td colSpan={10} style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
                    No compliance records found matching your filters.
                  </td>
                </tr>
              ) : (
                documents.map((doc) => (
                  <tr
                    key={doc.id}
                    onClick={() => setSelectedDoc(doc)}
                    style={{ cursor: 'pointer' }}
                  >
                    <td>
                      <div className="esc-ticket-pill">{doc.id}</div>
                    </td>
                    <td>
                      <div className="esc-hsrp-badge">
                        <span className="ind">IND</span>
                        <span className="plate">{doc.vehicle}</span>
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 700, color: '#0f172a' }}>{doc.driver}</div>
                    </td>
                    <td>
                      <span style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', padding: '3px 8px', borderRadius: '5px', fontSize: '11px', fontWeight: 750, color: '#1e293b' }}>
                        {doc.type}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 800, color: '#0f172a', fontFamily: 'monospace' }}>{doc.docNumber}</div>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>{doc.coverage}</div>
                    </td>
                    <td>
                      <div style={{ fontSize: '11.5px', fontWeight: 650, color: '#334155' }}>{doc.issuer}</div>
                    </td>
                    <td>
                      <div style={{ fontSize: '11.5px', color: '#0f172a', fontWeight: 600 }}>
                        {doc.startDate} → {doc.expiryDate}
                      </div>
                    </td>
                    <td>
                      <span
                        className={`pill ${
                          doc.daysRemaining <= 0 ? 'red' : doc.daysRemaining <= 30 ? 'orange' : 'green'
                        }`}
                      >
                        {doc.daysRemaining <= 0
                          ? `${Math.abs(doc.daysRemaining)}d OVERDUE`
                          : `${doc.daysRemaining} days left`}
                      </span>
                    </td>
                    <td>
                      <span className={`pill ${doc.status === 'Valid' ? 'green' : doc.status === 'Expiring Soon' ? 'orange' : 'red'}`}>
                        {doc.status}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }} onClick={(e) => e.stopPropagation()}>
                      <div style={{ display: 'inline-flex', gap: '6px' }}>
                        <button
                          className="btn small primary"
                          onClick={() => openRenewModal(doc)}
                        >
                          Renew
                        </button>
                        <button
                          className="btn small"
                          onClick={() => setSelectedDoc(doc)}
                        >
                          Inspect
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
          TAB 2: TRAFFIC POLICE E-CHALLANS
          ======================================================== */}
      {activeTab === 'challans' && (
        <div className="esc-table-card">
          <table className="esc-data-table">
            <thead>
              <tr>
                <th>CHALLAN NOTICE NO.</th>
                <th>VEHICLE PLATE</th>
                <th>DRIVER</th>
                <th>VIOLATION OFFENCE</th>
                <th>LOCATION &amp; POLICE AUTH</th>
                <th>FINE PENALTY</th>
                <th>DUE DATE</th>
                <th>DRIVER WALLET DEDUCTION</th>
                <th>STATUS</th>
                <th style={{ textAlign: 'right' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {challans.length === 0 ? (
                <tr>
                  <td colSpan={10} style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
                    No traffic police challans recorded.
                  </td>
                </tr>
              ) : (
                challans.map((ch) => (
                  <tr key={ch.id}>
                    <td>
                      <div className="esc-ticket-pill" style={{ color: '#b91c1c', background: '#fef2f2', borderColor: '#fecaca' }}>
                        {ch.challanNumber}
                      </div>
                      <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                        {new Date(ch.violationDate).toLocaleDateString()}
                      </div>
                    </td>
                    <td>
                      <div className="esc-hsrp-badge">
                        <span className="ind">IND</span>
                        <span className="plate">{ch.vehicle}</span>
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 700, color: '#0f172a' }}>{ch.driver}</div>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>At time of violation</div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 700, color: '#0f172a' }}>{ch.violation}</div>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>{ch.courtStatus}</div>
                    </td>
                    <td>
                      <div style={{ fontSize: '11.5px', fontWeight: 650, display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <MapPin size={11} color="#64748b" />
                        <span>{ch.location}</span>
                      </div>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>{ch.authority}</div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 800, color: '#b91c1c', fontSize: '14px' }}>₹{ch.fineAmount}</div>
                    </td>
                    <td>
                      <div style={{ fontSize: '11.5px', fontWeight: 700, color: '#b45309' }}>{ch.dueDate}</div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span
                          className={`pill ${
                            ch.driverDeduction === 'Deducted from Wallet' ? 'green' : 'red'
                          }`}
                        >
                          {ch.driverDeduction}
                        </span>
                        {ch.driverDeduction !== 'Deducted from Wallet' && (
                          <button
                            className="btn small"
                            style={{ padding: '2px 6px', fontSize: '10.5px' }}
                            onClick={() => handleDeductWallet(ch.id)}
                            title="Post direct wallet deduction to driver"
                          >
                            Deduct
                          </button>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className={`pill ${ch.status === 'Paid' ? 'green' : 'red'}`}>
                        {ch.status}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '6px' }}>
                        {ch.status === 'Pending Payment' && (
                          <button
                            className="btn small green"
                            onClick={() => {
                              setPayChallanTarget(ch);
                              setPayForm({
                                paymentMethod: 'Driver Wallet',
                                utrReference: `CHL-${Date.now().toString().slice(-6)}`
                              });
                            }}
                          >
                            Pay / Settle
                          </button>
                        )}
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
          TAB 3: EXPIRY ALERTS & TIMELINE
          ======================================================== */}
      {activeTab === 'timeline' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Breached Section */}
          <div style={{ background: '#ffffff', border: '1px solid #fecaca', borderRadius: '12px', overflow: 'hidden' }}>
            <div style={{ background: '#fef2f2', padding: '12px 18px', borderBottom: '1px solid #fecaca', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertTriangle size={18} color="#b91c1c" />
              <strong style={{ color: '#b91c1c', fontSize: '13px' }}>
                CRITICAL: EXPIRED / BREACHED COMPLIANCES ({documents.filter(d => d.daysRemaining <= 0).length})
              </strong>
              <span style={{ fontSize: '11px', color: '#64748b', marginLeft: 'auto' }}>Vehicles must be grounded immediately</span>
            </div>
            <div style={{ padding: '16px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
              {documents.filter(d => d.daysRemaining <= 0).map(d => (
                <div key={d.id} style={{ border: '1px solid #fecaca', borderLeft: '4px solid #ef4444', borderRadius: '8px', padding: '14px', background: '#ffffff' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px', fontSize: '10.5px', fontWeight: 700 }}>
                      {d.type}
                    </span>
                    <span className="pill red" style={{ fontSize: '10px' }}>
                      {Math.abs(d.daysRemaining)} Days Overdue
                    </span>
                  </div>
                  <div style={{ marginTop: '4px' }}>
                    <div className="esc-hsrp-badge">
                      <span className="ind">IND</span>
                      <span className="plate">{d.vehicle}</span>
                    </div>
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748b', margin: '4px 0 8px' }}>{d.coverage}</div>
                  <button className="btn small danger" style={{ width: '100%' }} onClick={() => openRenewModal(d)}>
                    Renew Certificate Immediately
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Expiring Soon Section */}
          <div style={{ background: '#ffffff', border: '1px solid #fde68a', borderRadius: '12px', overflow: 'hidden' }}>
            <div style={{ background: '#fffbeb', padding: '12px 18px', borderBottom: '1px solid #fde68a', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Clock size={18} color="#b45309" />
              <strong style={{ color: '#b45309', fontSize: '13px' }}>
                ATTENTION REQUIRED: EXPIRING IN &lt; 30 DAYS ({documents.filter(d => d.daysRemaining > 0 && d.daysRemaining <= 30).length})
              </strong>
              <span style={{ fontSize: '11px', color: '#64748b', marginLeft: 'auto' }}>Renew before expiration</span>
            </div>
            <div style={{ padding: '16px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
              {documents.filter(d => d.daysRemaining > 0 && d.daysRemaining <= 30).map(d => (
                <div key={d.id} style={{ border: '1px solid #fde68a', borderLeft: '4px solid #f59a23', borderRadius: '8px', padding: '14px', background: '#ffffff' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px', fontSize: '10.5px', fontWeight: 700 }}>
                      {d.type}
                    </span>
                    <span className="pill orange" style={{ fontSize: '10px' }}>
                      {d.daysRemaining} Days Left
                    </span>
                  </div>
                  <div style={{ marginTop: '4px' }}>
                    <div className="esc-hsrp-badge">
                      <span className="ind">IND</span>
                      <span className="plate">{d.vehicle}</span>
                    </div>
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748b', margin: '4px 0 8px' }}>Expires: {d.expiryDate}</div>
                  <button className="btn small primary" style={{ width: '100%' }} onClick={() => openRenewModal(d)}>
                    Renew Document
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          TAB 4: VEHICLE ROADWORTHINESS MATRIX
          ======================================================== */}
      {activeTab === 'vehicles' && (
        <div className="esc-table-card">
          <table className="esc-data-table">
            <thead>
              <tr>
                <th>VEHICLE PLATE</th>
                <th>DRIVER</th>
                <th style={{ textAlign: 'center' }}>INSURANCE</th>
                <th style={{ textAlign: 'center' }}>FITNESS</th>
                <th style={{ textAlign: 'center' }}>PERMIT</th>
                <th style={{ textAlign: 'center' }}>PUC</th>
                <th style={{ textAlign: 'center' }}>RC</th>
                <th style={{ textAlign: 'center' }}>OVERALL ROADWORTHINESS</th>
              </tr>
            </thead>
            <tbody>
              {['DL52GD6605', 'HR38AK1234', 'HR55BC2211', 'DL52GD7393', 'UP16HT7788', 'HR38AK5678'].map((reg) => {
                const vehicleDocs = documents.filter(d => d.vehicle === reg);
                const hasBreached = vehicleDocs.some(d => d.daysRemaining <= 0);
                const hasExpiring = vehicleDocs.some(d => d.daysRemaining > 0 && d.daysRemaining <= 30);
                const driver = vehicleDocs[0]?.driver || 'Assigned Driver';

                const getDocStatus = (type) => {
                  const match = vehicleDocs.find(d => d.type.toLowerCase() === type.toLowerCase());
                  if (!match) return <span style={{ color: '#94a3b8' }}>—</span>;
                  if (match.daysRemaining <= 0) return <span className="pill red" style={{ padding: '2px 6px' }}>Expired</span>;
                  if (match.daysRemaining <= 30) return <span className="pill orange" style={{ padding: '2px 6px' }}>Due Soon</span>;
                  return <span className="pill green" style={{ padding: '2px 6px' }}>Valid ✓</span>;
                };

                return (
                  <tr key={reg}>
                    <td>
                      <div className="esc-hsrp-badge">
                        <span className="ind">IND</span>
                        <span className="plate">{reg}</span>
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 700, color: '#0f172a' }}>{driver}</div>
                    </td>
                    <td style={{ textAlign: 'center' }}>{getDocStatus('Insurance')}</td>
                    <td style={{ textAlign: 'center' }}>{getDocStatus('Fitness')}</td>
                    <td style={{ textAlign: 'center' }}>{getDocStatus('Permit')}</td>
                    <td style={{ textAlign: 'center' }}>{getDocStatus('PUC')}</td>
                    <td style={{ textAlign: 'center' }}>{getDocStatus('RC')}</td>
                    <td style={{ textAlign: 'center' }}>
                      <span className={`pill ${hasBreached ? 'red' : hasExpiring ? 'orange' : 'green'}`}>
                        {hasBreached ? '⛔ Grounded' : hasExpiring ? '⚠️ Renewal Due' : '✅ Roadworthy'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ========================================================
          MODAL 1: ADD / UPLOAD COMPLIANCE CERTIFICATE
          ======================================================== */}
      {isAddDocModalOpen && (
        <div className="modalback" onClick={() => setIsAddDocModalOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <button className="close" onClick={() => setIsAddDocModalOpen(false)}>×</button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span style={{ color: '#1d68f0', display: 'flex' }}><Shield size={22} /></span>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 850 }}>
                Upload RTO / Statutory Certificate
              </h2>
            </div>
            <div className="sub" style={{ marginBottom: '16px' }}>
              Record insurance, fitness, permit, or commercial driving licence.
            </div>

            <form onSubmit={handleAddDocSubmit}>
              <div className="grid2">
                <div className="field">
                  <label>Select Fleet Vehicle *</label>
                  <select
                    value={docForm.vehicle}
                    onChange={(e) => handleDocVehicleChange(e.target.value)}
                    required
                  >
                    {fleetVehicles.map(v => (
                      <option key={v.registration} value={v.registration}>
                        {v.registration} — {v.model} ({v.driver || 'No Driver'})
                      </option>
                    ))}
                    <option value="DL52GD6605">DL52GD6605 — TATA TIGOR EV (Raj Kumar)</option>
                    <option value="HR38AK1234">HR38AK1234 — WagonR H3 CNG (Amit Singh)</option>
                    <option value="HR55BC2211">HR55BC2211 — TATA TIGOR EV (Rohit Yadav)</option>
                    <option value="DL52GD7393">DL52GD7393 — TATA TIGOR EV (Sandeep Kumar)</option>
                  </select>
                </div>

                <div className="field">
                  <label>Document / Compliance Type *</label>
                  <select
                    value={docForm.type}
                    onChange={(e) => setDocForm(prev => ({ ...prev, type: e.target.value }))}
                    required
                  >
                    <option value="Insurance">Comprehensive Insurance Policy</option>
                    <option value="Fitness">RTO Fitness Certificate</option>
                    <option value="Permit">State / NCR Transport Permit</option>
                    <option value="PUC">Pollution Under Control (PUC)</option>
                    <option value="RC">Vehicle Registration Certificate (RC)</option>
                    <option value="Driver DL">Driver Commercial Licence / PSV Badge</option>
                  </select>
                </div>
              </div>

              <div className="grid2">
                <div className="field">
                  <label>Certificate / Policy Number *</label>
                  <input
                    type="text"
                    value={docForm.docNumber}
                    onChange={(e) => setDocForm(prev => ({ ...prev, docNumber: e.target.value }))}
                    required
                  />
                </div>

                <div className="field">
                  <label>Issuing Authority / Insurer *</label>
                  <input
                    type="text"
                    value={docForm.issuer}
                    onChange={(e) => setDocForm(prev => ({ ...prev, issuer: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <div className="grid2">
                <div className="field">
                  <label>Coverage / Description</label>
                  <input
                    type="text"
                    value={docForm.coverage}
                    onChange={(e) => setDocForm(prev => ({ ...prev, coverage: e.target.value }))}
                  />
                </div>

                <div className="field">
                  <label>Premium / Government Fee (₹)</label>
                  <input
                    type="number"
                    value={docForm.premiumInr}
                    onChange={(e) => setDocForm(prev => ({ ...prev, premiumInr: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid2">
                <div className="field">
                  <label>Issue / Start Date *</label>
                  <input
                    type="date"
                    value={docForm.startDate}
                    onChange={(e) => setDocForm(prev => ({ ...prev, startDate: e.target.value }))}
                    required
                  />
                </div>

                <div className="field">
                  <label>Expiry Date *</label>
                  <input
                    type="date"
                    value={docForm.expiryDate}
                    onChange={(e) => setDocForm(prev => ({ ...prev, expiryDate: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <div className="modal-foot">
                <button
                  type="button"
                  className="btn"
                  onClick={() => setIsAddDocModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn primary">
                  <Shield size={14} />
                  <span>Register Compliance Certificate</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL 2: RENEW DOCUMENT
          ======================================================== */}
      {renewDocTarget && (
        <div className="modalback" onClick={() => setRenewDocTarget(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <button className="close" onClick={() => setRenewDocTarget(null)}>×</button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span style={{ color: '#16a34a', display: 'flex' }}><CheckCircle2 size={22} /></span>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 850 }}>
                Renew {renewDocTarget.type} · {renewDocTarget.vehicle}
              </h2>
            </div>
            <div className="sub" style={{ marginBottom: '16px' }}>
              Extend statutory validity and update policy/endorsement details.
            </div>

            <form onSubmit={handleRenewSubmit}>
              <div className="grid2">
                <div className="field">
                  <label>New Certificate / Policy Number *</label>
                  <input
                    type="text"
                    value={renewForm.docNumber}
                    onChange={(e) => setRenewForm(prev => ({ ...prev, docNumber: e.target.value }))}
                    required
                  />
                </div>

                <div className="field">
                  <label>New Expiry Date *</label>
                  <input
                    type="date"
                    value={renewForm.expiryDate}
                    onChange={(e) => setRenewForm(prev => ({ ...prev, expiryDate: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <div className="grid2">
                <div className="field">
                  <label>Renewal Premium / Fee (₹)</label>
                  <input
                    type="number"
                    value={renewForm.premiumInr}
                    onChange={(e) => setRenewForm(prev => ({ ...prev, premiumInr: e.target.value }))}
                  />
                </div>

                <div className="field">
                  <label>Issuing Authority / Agency</label>
                  <input
                    type="text"
                    value={renewForm.issuer}
                    onChange={(e) => setRenewForm(prev => ({ ...prev, issuer: e.target.value }))}
                  />
                </div>
              </div>

              <div className="modal-foot">
                <button
                  type="button"
                  className="btn"
                  onClick={() => setRenewDocTarget(null)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn green">
                  ✓ Confirm Renewal &amp; Clear Warnings
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL 3: LOG E-CHALLAN
          ======================================================== */}
      {isLogChallanModalOpen && (
        <div className="modalback" onClick={() => setIsLogChallanModalOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <button className="close" onClick={() => setIsLogChallanModalOpen(false)}>×</button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span style={{ color: '#dc2626', display: 'flex' }}><AlertTriangle size={22} /></span>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 850 }}>
                Log Traffic Police e-Challan
              </h2>
            </div>
            <div className="sub" style={{ marginBottom: '16px' }}>
              Record speed radar, RLVD, lane or parking violation notice.
            </div>

            <form onSubmit={handleLogChallanSubmit}>
              <div className="grid2">
                <div className="field">
                  <label>Challan Notice Number *</label>
                  <input
                    type="text"
                    value={challanForm.challanNumber}
                    onChange={(e) => setChallanForm(prev => ({ ...prev, challanNumber: e.target.value }))}
                    required
                  />
                </div>

                <div className="field">
                  <label>Select Vehicle *</label>
                  <select
                    value={challanForm.vehicle}
                    onChange={(e) => handleChallanVehicleChange(e.target.value)}
                    required
                  >
                    {fleetVehicles.map(v => (
                      <option key={v.registration} value={v.registration}>
                        {v.registration} — {v.model} ({v.driver || 'No Driver'})
                      </option>
                    ))}
                    <option value="DL52GD7393">DL52GD7393 — TATA TIGOR EV (Sandeep Kumar)</option>
                    <option value="HR55BC2211">HR55BC2211 — TATA TIGOR EV (Rohit Yadav)</option>
                    <option value="HR38AK1234">HR38AK1234 — WagonR H3 CNG (Amit Singh)</option>
                  </select>
                </div>
              </div>

              <div className="grid2">
                <div className="field">
                  <label>Driver In-Charge *</label>
                  <input
                    type="text"
                    value={challanForm.driver}
                    onChange={(e) => setChallanForm(prev => ({ ...prev, driver: e.target.value }))}
                    required
                  />
                </div>

                <div className="field">
                  <label>Fine Penalty Amount (₹) *</label>
                  <input
                    type="number"
                    value={challanForm.fineAmount}
                    onChange={(e) => setChallanForm(prev => ({ ...prev, fineAmount: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <div className="field">
                <label>Violation Offence *</label>
                <input
                  type="text"
                  value={challanForm.violation}
                  onChange={(e) => setChallanForm(prev => ({ ...prev, violation: e.target.value }))}
                  required
                />
              </div>

              <div className="grid2">
                <div className="field">
                  <label>Location of Violation *</label>
                  <input
                    type="text"
                    value={challanForm.location}
                    onChange={(e) => setChallanForm(prev => ({ ...prev, location: e.target.value }))}
                    required
                  />
                </div>

                <div className="field">
                  <label>Issuing Traffic Authority *</label>
                  <input
                    type="text"
                    value={challanForm.authority}
                    onChange={(e) => setChallanForm(prev => ({ ...prev, authority: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <div className="modal-foot">
                <button
                  type="button"
                  className="btn"
                  onClick={() => setIsLogChallanModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn danger">
                  <AlertTriangle size={14} />
                  <span>Log E-Challan Notice</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL 4: PAY & SETTLE CHALLAN
          ======================================================== */}
      {payChallanTarget && (
        <div className="modalback" onClick={() => setPayChallanTarget(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <button className="close" onClick={() => setPayChallanTarget(null)}>×</button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span style={{ color: '#16a34a', display: 'flex' }}><Receipt size={22} /></span>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 850 }}>
                Pay &amp; Dispose Challan · {payChallanTarget.challanNumber}
              </h2>
            </div>
            <div className="sub" style={{ marginBottom: '16px' }}>
              Record fine payment reference and post wallet deduction.
            </div>

            <form onSubmit={handlePayChallanSubmit}>
              <div className="grid2" style={{ background: '#f8fafc', padding: '14px', borderRadius: '10px', marginBottom: '14px' }}>
                <div>
                  <span style={{ fontSize: '10.5px', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Vehicle Plate</span>
                  <div style={{ marginTop: '3px' }}>
                    <div className="esc-hsrp-badge">
                      <span className="ind">IND</span>
                      <span className="plate">{payChallanTarget.vehicle}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: '10.5px', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Fine Penalty</span>
                  <div style={{ fontWeight: 800, color: '#dc2626', fontSize: '15px', marginTop: '3px' }}>₹{payChallanTarget.fineAmount}</div>
                </div>
              </div>

              <div className="grid2">
                <div className="field">
                  <label>Payment Method *</label>
                  <select
                    value={payForm.paymentMethod}
                    onChange={(e) => setPayForm(prev => ({ ...prev, paymentMethod: e.target.value }))}
                  >
                    <option value="Driver Wallet">Direct Driver Wallet Deduction</option>
                    <option value="Corporate NetBanking">Company NetBanking (Virtual Court)</option>
                    <option value="UPI / QR">Traffic Police POS / UPI QR</option>
                  </select>
                </div>

                <div className="field">
                  <label>Transaction / UTR Reference *</label>
                  <input
                    type="text"
                    value={payForm.utrReference}
                    onChange={(e) => setPayForm(prev => ({ ...prev, utrReference: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <div className="modal-foot">
                <button
                  type="button"
                  className="btn"
                  onClick={() => setPayChallanTarget(null)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn green">
                  ✓ Confirm Payment &amp; Dispose
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL 5: INSPECT DOCUMENT
          ======================================================== */}
      {selectedDoc && (
        <div className="modalback" onClick={() => setSelectedDoc(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <button className="close" onClick={() => setSelectedDoc(null)}>×</button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span style={{ color: '#1d68f0', display: 'flex' }}><Shield size={22} /></span>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 850 }}>
                {selectedDoc.type} Certificate · {selectedDoc.vehicle}
              </h2>
            </div>
            <div className="sub" style={{ marginBottom: '16px' }}>
              Statutory certificate inspection and validity record.
            </div>

            <div className="grid2" style={{ background: '#f8fafc', padding: '14px', borderRadius: '10px', marginBottom: '14px' }}>
              <div>
                <span style={{ fontSize: '10.5px', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Vehicle Plate</span>
                <div style={{ marginTop: '3px' }}>
                  <div className="esc-hsrp-badge">
                    <span className="ind">IND</span>
                    <span className="plate">{selectedDoc.vehicle}</span>
                  </div>
                </div>
              </div>

              <div>
                <span style={{ fontSize: '10.5px', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Certificate No.</span>
                <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '14px', fontFamily: 'monospace', marginTop: '3px' }}>
                  {selectedDoc.docNumber}
                </div>
              </div>

              <div>
                <span style={{ fontSize: '10.5px', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Issuer</span>
                <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '13px', marginTop: '3px' }}>{selectedDoc.issuer}</div>
              </div>

              <div>
                <span style={{ fontSize: '10.5px', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Validity</span>
                <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '13px', marginTop: '3px' }}>
                  {selectedDoc.startDate} → {selectedDoc.expiryDate}
                </div>
              </div>
            </div>

            <div className="modal-foot">
              <button
                className="btn primary"
                onClick={() => {
                  const d = selectedDoc;
                  setSelectedDoc(null);
                  openRenewModal(d);
                }}
              >
                Renew Certificate
              </button>
              <button className="btn" onClick={() => setSelectedDoc(null)}>
                Close Window
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
