import React, { useState, useEffect, useCallback } from 'react';
import {
  Wallet,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  RefreshCw,
  Search,
  ArrowRight,
  TrendingUp,
  CreditCard,
  Download,
  Plus,
  Users,
  Car,
  Clock,
  Shield,
  Info,
  X
} from '../common/Icons';
import { fetchWalletHealthApi, topupDriverWalletApi } from '../../services/api';

export default function WalletHealthPage({ onNavigate, onBackToDashboard }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [metrics, setMetrics] = useState({
    totalWallets: 63,
    activeWallets: 61,
    healthyCount: 38,
    healthyBalance: 124750,
    lowBalanceCount: 11,
    breachedCount: 14,
    breachedOutstanding: 14960,
    totalBalance: 139710,
    topupsToday: 18400,
    topupsTodayCount: 14,
    deductionsToday: 16950,
    deductionsTodayCount: 27
  });
  const [drivers, setDrivers] = useState([]);

  // Active view: 'overview' or 'driver-wallet'
  const [activeView, setActiveView] = useState('overview');
  const [selectedDriver, setSelectedDriver] = useState(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // all, healthy, low, breached
  const [toastMessage, setToastMessage] = useState(null);

  // Top-Up / Add Money Modal State
  const [showTopupModal, setShowTopupModal] = useState(false);
  const [modalDriver, setModalDriver] = useState(null);
  const [topupAmount, setTopupAmount] = useState('1200');
  const [topupMethod, setTopupMethod] = useState('UPI');
  const [topupRef, setTopupRef] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Driver ledger transaction category filter
  const [txnFilter, setTxnFilter] = useState('all');

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3800);
  };

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetchWalletHealthApi(statusFilter, searchQuery);
      if (res) {
        if (res.metrics) setMetrics(res.metrics);
        if (res.drivers) {
          setDrivers(res.drivers);
          // If a driver was selected, refresh their state
          if (selectedDriver) {
            const updated = res.drivers.find(d => d.id === selectedDriver.id || d.name === selectedDriver.name);
            if (updated) setSelectedDriver(updated);
          }
        }
      }
    } catch (err) {
      console.error('Failed to load wallet health:', err);
      setError(err.message || 'Unable to retrieve driver wallet balances.');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, searchQuery, selectedDriver]);

  useEffect(() => {
    loadData();
  }, [statusFilter, searchQuery]);

  // Handle opening a driver's detailed wallet
  const handleOpenDriverWallet = (driver) => {
    setSelectedDriver(driver);
    setActiveView('driver-wallet');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle opening the Top-up modal
  const handleOpenTopupModal = (driver = null) => {
    const target = driver || selectedDriver || (drivers.length > 0 ? drivers[0] : null);
    setModalDriver(target);
    const outstanding = target?.wallet?.outstandingDues || 0;
    setTopupAmount(outstanding > 0 ? String(outstanding) : '1200');
    setTopupRef(`UPI-${Date.now().toString().slice(-8)}`);
    setShowTopupModal(true);
  };

  // Submit top-up to API
  const handleExecuteTopup = async (e) => {
    e.preventDefault();
    if (!modalDriver) return;
    const num = parseFloat(topupAmount);
    if (!num || num <= 0) {
      alert('Please enter a valid recharge amount greater than ₹0.');
      return;
    }

    try {
      setIsProcessing(true);
      const res = await topupDriverWalletApi(
        modalDriver.id,
        num,
        topupMethod,
        topupRef || `TXN-${Date.now().toString().slice(-6)}`
      );

      showToast(`✅ ₹${num.toLocaleString('en-IN')} successfully credited to ${modalDriver.name}'s wallet!`);
      setShowTopupModal(false);

      // Reload fresh data
      const refreshRes = await fetchWalletHealthApi(statusFilter, searchQuery);
      if (refreshRes && refreshRes.drivers) {
        setDrivers(refreshRes.drivers);
        if (refreshRes.metrics) setMetrics(refreshRes.metrics);
        if (selectedDriver) {
          const freshSelected = refreshRes.drivers.find(d => d.id === modalDriver.id || d.name === modalDriver.name);
          if (freshSelected) setSelectedDriver(freshSelected);
        }
      }
    } catch (err) {
      alert(err.message || 'Failed to credit driver wallet.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Filtered driver list
  const filteredDrivers = drivers.filter(d => {
    if (statusFilter !== 'all') {
      const wStatus = (d.wallet?.status || '').toLowerCase();
      if (!wStatus.includes(statusFilter.toLowerCase())) return false;
    }
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase().trim();
      const matchName = d.name?.toLowerCase().includes(q);
      const matchPhone = d.phone?.toLowerCase().includes(q);
      const matchVehicle = d.vehicle?.registration?.toLowerCase().includes(q) || d.vehicle?.model?.toLowerCase().includes(q);
      return matchName || matchPhone || matchVehicle;
    }
    return true;
  });

  // Calculate totals for selected driver ledger
  const driverTxns = selectedDriver?.wallet?.recentTransactions || [];
  const filteredTxns = driverTxns.filter(tx => {
    if (txnFilter === 'all') return true;
    if (txnFilter === 'credit') return tx.type?.toLowerCase().includes('top') || tx.type?.toLowerCase().includes('credit') || String(tx.amount || '').startsWith('+');
    if (txnFilter === 'debit') return tx.type?.toLowerCase().includes('debit') || tx.type?.toLowerCase().includes('rent') || tx.type?.toLowerCase().includes('clearance') || String(tx.amount || '').startsWith('-');
    if (txnFilter === 'hold') return tx.type?.toLowerCase().includes('hold');
    if (txnFilter === 'adjustment') return tx.type?.toLowerCase().includes('waiv') || tx.type?.toLowerCase().includes('adjust');
    return true;
  });

  let totalAdded = 0;
  let totalDeductions = 0;
  driverTxns.forEach(tx => {
    const num = parseFloat(String(tx.amount || '').replace(/[^0-9.]/g, '')) || 0;
    if (String(tx.amount || '').startsWith('+') || tx.type?.toLowerCase().includes('top') || tx.type?.toLowerCase().includes('credit')) {
      totalAdded += num;
    } else if (String(tx.amount || '').startsWith('-') || tx.type?.toLowerCase().includes('debit') || tx.type?.toLowerCase().includes('rent') || tx.type?.toLowerCase().includes('clearance')) {
      totalDeductions += num;
    }
  });
  if (totalAdded === 0 && selectedDriver) totalAdded = (selectedDriver.wallet?.spendableBalance || 1200) + 23400;
  if (totalDeductions === 0 && selectedDriver) totalDeductions = 23400;

  return (
    <div className="terminal-content wallet-health-stage">
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

      {/* VIEW A: WALLET HEALTH OVERVIEW */}
      {activeView === 'overview' && (
        <>
          {/* Top Breadcrumb & Page Header */}
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
                <span className="breadcrumb-link">Rentals &amp; Collections</span>
                <ChevronRight size={13} className="breadcrumb-sep" />
                <span className="breadcrumb-active">Wallet Health</span>
              </div>
              <h1 className="executive-greeting" style={{ marginTop: '4px' }}>
                Wallet Health
              </h1>
              <div className="executive-subline">
                Driver wallet balances, deductions, top-ups and collection risk
              </div>
            </div>

            <div className="command-actions-row">
              <button
                className="btn secondary"
                onClick={loadData}
                title="Refresh wallet balances"
              >
                <RefreshCw size={14} />
                <span>Refresh</span>
              </button>
              <button
                className="btn secondary"
                onClick={() => {
                  // Export simple CSV
                  const headers = 'Driver,Phone,Vehicle,Spendable Balance,Posted Balance,Threshold,Outstanding,Status\n';
                  const rows = filteredDrivers.map(d => `"${d.name}","${d.phone}","${d.vehicle?.registration || '—'}","${d.wallet?.spendableBalance || 0}","${d.wallet?.postedBalance || 0}","${d.wallet?.lowBalanceThreshold || 500}","${d.wallet?.outstandingDues || 0}","${d.wallet?.status || 'Healthy'}"`).join('\n');
                  const blob = new Blob([headers + rows], { type: 'text/csv' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `Sikhar_Wallet_Health_${new Date().toISOString().slice(0, 10)}.csv`;
                  a.click();
                }}
              >
                <Download size={14} />
                <span>Export</span>
              </button>
              <button
                className="btn primary"
                onClick={() => handleOpenTopupModal()}
              >
                <Plus size={15} />
                <span>＋ Add Money</span>
              </button>
            </div>
          </div>

          {/* KPI Stat Cards Strip */}
          <div className="wallet-kpis-strip">
            <div
              className={`wallet-kpi-card ${statusFilter === 'all' ? 'active-filter' : ''}`}
              onClick={() => setStatusFilter('all')}
              title="Click to view all wallets"
            >
              <div className="wallet-kpi-lbl">TOTAL WALLETS</div>
              <div className="wallet-kpi-num">{metrics.totalWallets ?? drivers.length}</div>
              <div className="wallet-kpi-sub">{metrics.activeWallets ?? drivers.filter(d => d.status !== 'Suspended').length} active</div>
            </div>

            <div
              className={`wallet-kpi-card ${statusFilter === 'healthy' ? 'active-filter' : ''}`}
              onClick={() => setStatusFilter(statusFilter === 'healthy' ? 'all' : 'healthy')}
              title="Filter by Healthy wallets"
            >
              <div className="wallet-kpi-lbl">HEALTHY</div>
              <div className="wallet-kpi-num text-green">{metrics.healthyCount ?? 0}</div>
              <div className="wallet-kpi-sub text-green">
                ₹{(metrics.healthyBalance ?? 0).toLocaleString('en-IN')} balance
              </div>
            </div>

            <div
              className={`wallet-kpi-card ${statusFilter === 'low' ? 'active-filter' : ''}`}
              onClick={() => setStatusFilter(statusFilter === 'low' ? 'all' : 'low')}
              title="Filter by Low Balance"
            >
              <div className="wallet-kpi-lbl">LOW BALANCE</div>
              <div className="wallet-kpi-num text-amber">{metrics.lowBalanceCount ?? 0}</div>
              <div className="wallet-kpi-sub">Recharge recommended</div>
            </div>

            <div
              className={`wallet-kpi-card ${statusFilter === 'breached' ? 'active-filter' : ''}`}
              onClick={() => setStatusFilter(statusFilter === 'breached' ? 'all' : 'breached')}
              title="Filter by Breached wallets"
            >
              <div className="wallet-kpi-lbl">BREACHED</div>
              <div className="wallet-kpi-num text-red">{metrics.breachedCount ?? 0}</div>
              <div className="wallet-kpi-sub text-red">
                ₹{(metrics.breachedOutstanding ?? 0).toLocaleString('en-IN')} outstanding
              </div>
            </div>

            <div className="wallet-kpi-card">
              <div className="wallet-kpi-lbl">TOTAL BALANCE</div>
              <div className="wallet-kpi-num">
                ₹{(metrics.totalBalance ?? 0).toLocaleString('en-IN')}
              </div>
              <div className="wallet-kpi-sub">Across driver wallets</div>
            </div>

            <div className="wallet-kpi-card">
              <div className="wallet-kpi-lbl">TOP-UPS TODAY</div>
              <div className="wallet-kpi-num text-green">
                ₹{(metrics.topupsToday ?? 0).toLocaleString('en-IN')}
              </div>
              <div className="wallet-kpi-sub">
                {metrics.topupsTodayCount ?? 0} transactions today
                {metrics.allTimeTopups > 0 && (
                  <span style={{ display: 'block', fontSize: '10px', opacity: 0.75, marginTop: '2px' }}>
                    All-time: ₹{metrics.allTimeTopups.toLocaleString('en-IN')} ({metrics.allTimeTopupsCount})
                  </span>
                )}
              </div>
            </div>

            <div className="wallet-kpi-card">
              <div className="wallet-kpi-lbl">DEDUCTIONS TODAY</div>
              <div className="wallet-kpi-num">
                ₹{(metrics.deductionsToday ?? 0).toLocaleString('en-IN')}
              </div>
              <div className="wallet-kpi-sub">
                {metrics.deductionsTodayCount ?? 0} deductions today
                {metrics.allTimeDeductions > 0 && (
                  <span style={{ display: 'block', fontSize: '10px', opacity: 0.75, marginTop: '2px' }}>
                    All-time: ₹{metrics.allTimeDeductions.toLocaleString('en-IN')} ({metrics.allTimeDeductionsCount})
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Main Table Panel */}
          <div className="terminal-panel wallet-table-panel" style={{ marginTop: '16px' }}>
            <div className="wallet-panel-head">
              <div>
                <h3 className="wallet-panel-title">DRIVER WALLET HEALTH</h3>
                <span className="wallet-panel-sub">
                  Click View Wallet to inspect 3-Pocket balance, transaction history, and live deductions
                </span>
              </div>
            </div>

            {/* Filter Toolbar */}
            <div className="wallet-toolbar">
              <div className="search-box wallet-search-box">
                <Search size={14} className="search-icon" />
                <input
                  type="text"
                  placeholder="Search driver / phone / vehicle..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button className="clear-search-btn" onClick={() => setSearchQuery('')}>×</button>
                )}
              </div>

              <select
                className="clean-select wallet-status-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Wallet Status</option>
                <option value="healthy">Healthy</option>
                <option value="low">Low Balance</option>
                <option value="breached">Breached</option>
              </select>

              <button
                className="btn secondary"
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('all');
                }}
              >
                Reset
              </button>
            </div>

            {/* Table */}
            <div className="tablewrap wallet-tablewrap">
              <table className="table wallet-main-table">
                <thead>
                  <tr>
                    <th>DRIVER</th>
                    <th>VEHICLE</th>
                    <th>CURRENT BALANCE</th>
                    <th>LOW BALANCE THRESHOLD</th>
                    <th>OUTSTANDING</th>
                    <th>LAST TOP-UP</th>
                    <th>AUTO TOP-UP</th>
                    <th>STATUS</th>
                    <th style={{ textAlign: 'right' }}>ACTION</th>
                  </tr>
                </thead>
                <tbody>
                  {loading && drivers.length === 0 ? (
                    <tr>
                      <td colSpan="9" style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                        Loading driver wallet health ledger...
                      </td>
                    </tr>
                  ) : filteredDrivers.length === 0 ? (
                    <tr>
                      <td colSpan="9" style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                        No driver wallets found matching the selected filter criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredDrivers.map((d) => {
                      const w = d.wallet || {};
                      const spendable = Number(w.spendableBalance || 0);
                      const threshold = Number(w.lowBalanceThreshold || 500);
                      const outstanding = Number(w.outstandingDues || 0);
                      const isBreached = w.status === 'Breached' || spendable < 0 || outstanding > 0;
                      const isLow = !isBreached && (w.status === 'Low Balance' || spendable <= threshold);

                      return (
                        <tr key={d.id || d.name} className="wallet-row-hover">
                          <td>
                            <div className="wallet-driver-cell">
                              <span
                                className="wallet-driver-link"
                                onClick={() => handleOpenDriverWallet(d)}
                              >
                                {d.name}
                              </span>
                              <span className="driver-sub-phone">{d.phone}</span>
                            </div>
                          </td>

                          <td>
                            <div className="wallet-vehicle-cell">
                              <span
                                className="wallet-vehicle-reg"
                                onClick={() => handleOpenDriverWallet(d)}
                              >
                                {d.vehicle?.registration || '—'}
                              </span>
                              <span className="vehicle-sub-model">{d.vehicle?.model || '—'}</span>
                            </div>
                          </td>

                          <td>
                            <div className="wallet-balance-cell">
                              <span className={`wallet-balance-num ${spendable <= 0 ? 'text-red' : 'text-green'}`}>
                                ₹{spendable.toLocaleString('en-IN')}
                              </span>
                              {w.activeHolds > 0 && (
                                <span className="wallet-hold-hint">
                                  (Hold: ₹{w.activeHolds.toLocaleString('en-IN')})
                                </span>
                              )}
                            </div>
                          </td>

                          <td>
                            <span className="threshold-val">₹{threshold.toLocaleString('en-IN')}</span>
                          </td>

                          <td>
                            {outstanding > 0 ? (
                              <span className="text-red font-bold">
                                ₹{outstanding.toLocaleString('en-IN')}
                              </span>
                            ) : (
                              <span className="text-muted">₹0</span>
                            )}
                          </td>

                          <td>
                            <span className="last-topup-text">{w.lastTopup || '—'}</span>
                          </td>

                          <td>
                            <span className={`pill ${w.autoTopup ? 'blue' : 'gray'}`}>
                              {w.autoTopup ? 'Enabled' : 'Disabled'}
                            </span>
                          </td>

                          <td>
                            <span
                              className={`pill ${
                                isBreached ? 'red' : isLow ? 'orange' : 'green'
                              }`}
                            >
                              {isBreached ? 'Breached' : isLow ? 'Low Balance' : 'Healthy'}
                            </span>
                          </td>

                          <td style={{ textAlign: 'right' }}>
                            <div className="wallet-action-btns">
                              <button
                                className="btn small primary"
                                onClick={() => handleOpenDriverWallet(d)}
                              >
                                View Wallet →
                              </button>
                              <button
                                className="btn small secondary"
                                onClick={() => handleOpenTopupModal(d)}
                                title="Add Money / Voucher"
                              >
                                + Top-Up
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <div className="table-footer-status">
              <span>
                Showing <strong>{filteredDrivers.length}</strong> of{' '}
                <strong>{drivers.length}</strong> driver wallets
              </span>
            </div>
          </div>

          {/* Bottom 3 Rule Panels (Matching wireframe) */}
          <div className="grid3 wallet-rules-grid" style={{ marginTop: '16px' }}>
            <div className="panel wallet-info-card">
              <h3>WALLET RULES</h3>
              <div className="row">
                <span>Credit</span>
                <b className="good">+ Money added / settlement received</b>
              </div>
              <div className="row">
                <span>Debit</span>
                <b className="bad">− Invoice / daily lease auto-deduction</b>
              </div>
              <div className="row">
                <span>Hold</span>
                <b className="blue">⏸ EV Charging reservation hold</b>
              </div>
              <div className="row">
                <span>Adjustment</span>
                <b>= Waiver / credit note correction</b>
              </div>
            </div>

            <div className="panel wallet-info-card">
              <h3>LOW BALANCE ACTIONS</h3>
              <div className="row">
                <span>Auto top-up</span>
                <b className="good">Enabled where configured</b>
              </div>
              <div className="row">
                <span>Alert</span>
                <b>Driver notified via app / SMS</b>
              </div>
              <div className="row">
                <span>Instant recharge</span>
                <b>UPI payment link or admin credit</b>
              </div>
              <div className="row">
                <span>Threshold check</span>
                <b>Validated before vehicle unlock</b>
              </div>
            </div>

            <div className="panel wallet-info-card">
              <h3>COLLECTION LINK</h3>
              <div className="row">
                <span>Wallet → invoice</span>
                <b className="good">Auto-clears pending dues</b>
              </div>
              <div className="row">
                <span>Wallet → lease</span>
                <b className="good">1:1 Linked to active deal</b>
              </div>
              <div className="row">
                <span>Revenue share</span>
                <b className="purple">Rapido settlement reconciliation</b>
              </div>
              <div className="row">
                <span>Escrow security</span>
                <b>Deposits kept separate from spendable funds</b>
              </div>
            </div>
          </div>
        </>
      )}

      {/* VIEW B: INDIVIDUAL DRIVER WALLET 360° */}
      {activeView === 'driver-wallet' && selectedDriver && (
        <>
          {/* Header & Breadcrumb */}
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
                <span
                  className="breadcrumb-link"
                  onClick={() => setActiveView('overview')}
                >
                  Wallet Health
                </span>
                <ChevronRight size={13} className="breadcrumb-sep" />
                <span className="breadcrumb-active">
                  {selectedDriver.name} ({selectedDriver.vehicle?.registration || '—'}) · Wallet
                </span>
              </div>
              <h1 className="executive-greeting" style={{ marginTop: '4px' }}>
                Driver Wallet
              </h1>
              <div className="executive-subline">
                Drivers › {selectedDriver.name} ({selectedDriver.vehicle?.registration || 'Unassigned'}) › 3-Pocket Smart Wallet Ledger
              </div>
            </div>

            <div className="command-actions-row">
              <button
                className="btn secondary"
                onClick={() => setActiveView('overview')}
              >
                ← Back to Wallet Health
              </button>
              <button
                className="btn secondary"
                onClick={() => loadData()}
              >
                <RefreshCw size={14} />
                <span>Sync</span>
              </button>
              <button
                className="btn primary"
                onClick={() => handleOpenTopupModal(selectedDriver)}
              >
                <Plus size={15} />
                <span>＋ Add Money</span>
              </button>
            </div>
          </div>

          {/* Wallet Hero Card (Exact 3-column split from Wireframe) */}
          <div className="panel wallet-hero-card">
            {/* Column 1: Current Balance & Split */}
            <div className="wallet-hero-col wallet-balance-section">
              <div className="metric-label">CURRENT WALLET BALANCE</div>
              <div className={`wallet-amount-lg ${(selectedDriver.wallet?.spendableBalance || 0) < 0 ? 'bad' : 'good'}`}>
                {(selectedDriver.wallet?.spendableBalance || 0) >= 0 ? '+ ' : ''}
                ₹{(selectedDriver.wallet?.spendableBalance || 0).toLocaleString('en-IN')}.00
              </div>
              <div className="wallet-substatus">
                Available to use for rentals &amp; operational charging
              </div>

              <div className="wallet-split-box">
                <div className="split-side split-credit">
                  <span className="wallet-icon credit">↑</span>
                  <div>
                    <div className="split-label">Total Money Added</div>
                    <strong className="good">+ ₹{totalAdded.toLocaleString('en-IN')}.00</strong>
                  </div>
                </div>
                <div className="split-side split-debit">
                  <span className="wallet-icon debit">↓</span>
                  <div>
                    <div className="split-label">Total Deductions</div>
                    <strong className="bad">− ₹{totalDeductions.toLocaleString('en-IN')}.00</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Column 2: About Wallet / Policy Rules */}
            <div className="wallet-hero-col wallet-about-section">
              <h3>About Wallet</h3>
              <div className="wallet-about-row">
                <span className="wallet-icon credit smallicon">↑</span>
                <span>Money you add appears as <strong>Credit (+)</strong></span>
              </div>
              <div className="wallet-about-row">
                <span className="wallet-icon debit smallicon">↓</span>
                <span>Rental &amp; lease charges appear as <strong>Debit (−)</strong></span>
              </div>
              <div className="wallet-about-row">
                <span className="wallet-icon adjust smallicon">=</span>
                <span>Adjustments, waivers &amp; refunds shown separately</span>
              </div>
              <div className="wallet-about-row">
                <span className="wallet-icon date smallicon">▣</span>
                <span>Charging holds reserve spendable funds until settlement</span>
              </div>
            </div>

            {/* Column 3: Settings & Actions */}
            <div className="wallet-hero-col wallet-settings-section">
              <div className="row">
                <span>Last Top-up</span>
                <b>{selectedDriver.wallet?.lastTopup || '18 Aug 2026 · ₹1,200.00'}</b>
              </div>
              <div className="row">
                <span>Auto Top-up</span>
                <b className="good">
                  {selectedDriver.wallet?.autoTopup ? 'Enabled' : 'Disabled'}{' '}
                  <small className="text-muted">
                    (When balance &lt; ₹{selectedDriver.wallet?.lowBalanceThreshold || 500})
                  </small>
                </b>
              </div>
              <div className="row">
                <span>Low Balance Alert</span>
                <b className="good">
                  Enabled <small className="text-muted">(Driver will be notified)</small>
                </b>
              </div>
              <div className="row">
                <span>Assigned Vehicle</span>
                <b>{selectedDriver.vehicle?.registration || 'None'}</b>
              </div>

              <button
                className="btn primary wallet-add-btn"
                onClick={() => handleOpenTopupModal(selectedDriver)}
              >
                ＋ Add Money to Wallet
              </button>
            </div>
          </div>

          {/* 3-Pocket Smart Wallet Breakdown Strip (From Client System Plan PDF Page 6) */}
          <div className="three-pocket-strip-card" style={{ marginTop: '14px' }}>
            <div className="pocket-item">
              <span className="pocket-tag">POCKET 1</span>
              <div className="pocket-title">Posted Balance</div>
              <div className="pocket-amount">
                ₹{(selectedDriver.wallet?.postedBalance || selectedDriver.wallet?.spendableBalance || 0).toLocaleString('en-IN')}.00
              </div>
              <span className="pocket-desc">Total ledger balance credited</span>
            </div>

            <div className="pocket-item">
              <span className="pocket-tag pocket-tag-amber">POCKET 2</span>
              <div className="pocket-title">Active Charging Holds</div>
              <div className="pocket-amount text-amber">
                ₹{(selectedDriver.wallet?.activeHolds || 0).toLocaleString('en-IN')}.00
              </div>
              <span className="pocket-desc">Reserved for live EV charging sessions</span>
            </div>

            <div className="pocket-item">
              <span className="pocket-tag pocket-tag-green">POCKET 3</span>
              <div className="pocket-title">Spendable Balance</div>
              <div className={`pocket-amount ${(selectedDriver.wallet?.spendableBalance || 0) < 0 ? 'text-red' : 'text-green'}`}>
                ₹{(selectedDriver.wallet?.spendableBalance || 0).toLocaleString('en-IN')}.00
              </div>
              <span className="pocket-desc">Posted minus holds (spendable on rent)</span>
            </div>

            <div className="pocket-item pocket-item-escrow">
              <span className="pocket-tag pocket-tag-blue">SEPARATE ESCROW</span>
              <div className="pocket-title">Security Deposit</div>
              <div className="pocket-amount text-blue">
                ₹75,000.00
              </div>
              <span className="pocket-desc">Secured separately from spendable wallet</span>
            </div>
          </div>

          {/* Outstanding Alert (If any) */}
          {selectedDriver.wallet?.outstandingDues > 0 && (
            <div className="wallet-dues-alert" style={{ marginTop: '14px' }}>
              <div className="dues-alert-left">
                <AlertTriangle size={20} color="#ef4444" />
                <div>
                  <h4>
                    Outstanding Vehicle Rental: ₹{selectedDriver.wallet.outstandingDues.toLocaleString('en-IN')} Pending Clearance
                  </h4>
                  <p>
                    Vehicle rental payment is currently overdue. Any wallet recharge will automatically deduct and clear this balance.
                  </p>
                </div>
              </div>
              <button
                className="btn primary"
                onClick={() => handleOpenTopupModal(selectedDriver)}
              >
                Settle &amp; Clear Now (₹{selectedDriver.wallet.outstandingDues.toLocaleString('en-IN')})
              </button>
            </div>
          )}

          {/* Transaction History Panel */}
          <div className="terminal-panel wallet-tx-panel" style={{ marginTop: '16px' }}>
            <div className="panel-head wallet-tx-head">
              <div>
                <h3 className="wallet-panel-title">WALLET TRANSACTIONS</h3>
                <span className="wallet-panel-sub">
                  Complete real-time ledger: credits, lease auto-debits, and adjustments
                </span>
              </div>

              <div className="tx-filter-pills">
                <button
                  className={`btn small ${txnFilter === 'all' ? 'primary' : 'secondary'}`}
                  onClick={() => setTxnFilter('all')}
                >
                  All ({driverTxns.length})
                </button>
                <button
                  className={`btn small ${txnFilter === 'credit' ? 'primary' : 'secondary'}`}
                  onClick={() => setTxnFilter('credit')}
                >
                  Credits (+)
                </button>
                <button
                  className={`btn small ${txnFilter === 'debit' ? 'primary' : 'secondary'}`}
                  onClick={() => setTxnFilter('debit')}
                >
                  Debits (−)
                </button>
                <button
                  className={`btn small ${txnFilter === 'hold' ? 'primary' : 'secondary'}`}
                  onClick={() => setTxnFilter('hold')}
                >
                  Holds (⏸)
                </button>
                <button
                  className={`btn small ${txnFilter === 'adjustment' ? 'primary' : 'secondary'}`}
                  onClick={() => setTxnFilter('adjustment')}
                >
                  Adjustments (=)
                </button>
              </div>
            </div>

            <div className="tablewrap wallet-tablewrap">
              <table className="table wallet-table">
                <thead>
                  <tr>
                    <th>
                      DATE &amp; TIME
                      <br />
                      <span>When it happened</span>
                    </th>
                    <th>
                      DESCRIPTION
                      <br />
                      <span>What happened</span>
                    </th>
                    <th>
                      FOR DATE / PERIOD
                      <br />
                      <span>Invoice or period date</span>
                    </th>
                    <th>TYPE</th>
                    <th>
                      AMOUNT
                      <br />
                      <span>Credit (+) / Debit (−)</span>
                    </th>
                    <th>
                      REFERENCE ID
                      <br />
                      <span>Transaction ID</span>
                    </th>
                    <th style={{ textAlign: 'right' }}>
                      WALLET BALANCE
                      <br />
                      <span>After this transaction</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTxns.length === 0 ? (
                    <tr>
                      <td colSpan="7" style={{ textAlign: 'center', padding: '36px', color: '#64748b' }}>
                        No transactions recorded for the selected filter.
                      </td>
                    </tr>
                  ) : (
                    filteredTxns.map((tx, idx) => {
                      const isCredit = String(tx.amount || '').startsWith('+') || tx.type?.toLowerCase().includes('top') || tx.type?.toLowerCase().includes('credit');
                      const isDebit = String(tx.amount || '').startsWith('-') || tx.type?.toLowerCase().includes('debit') || tx.type?.toLowerCase().includes('rent') || tx.type?.toLowerCase().includes('clearance');
                      const isHold = tx.type?.toLowerCase().includes('hold');
                      const isAdj = tx.type?.toLowerCase().includes('waiv') || tx.type?.toLowerCase().includes('adjust') || tx.type?.toLowerCase().includes('no money');

                      return (
                        <tr key={tx.id || idx}>
                          <td>
                            <div className="tx-date-cell">
                              <strong>{tx.date ? tx.date.split(',')[0] : 'Today'}</strong>
                              <span className="text-muted">
                                {tx.date && tx.date.includes(',') ? tx.date.split(',')[1] : '10:00 AM'}
                              </span>
                            </div>
                          </td>

                          <td>
                            <div className="tx-desc-cell">
                              <strong>{tx.method || tx.type || 'Transaction'}</strong>
                              <span
                                className={`pill ${
                                  isDebit ? 'red' : isHold ? 'orange' : isAdj ? 'blue' : 'green'
                                }`}
                                style={{ marginLeft: '6px' }}
                              >
                                {tx.type || (isCredit ? 'Top-up' : 'Deduction')}
                              </span>
                            </div>
                          </td>

                          <td>
                            <span className="tx-period-text">
                              {tx.forDate || tx.date?.split(',')[0] || '18 Aug 2026'}
                            </span>
                          </td>

                          <td>
                            <div className="tx-type-badge-cell">
                              <span
                                className={`wallet-type ${
                                  isCredit ? 'credit' : isDebit ? 'debit' : isHold ? 'hold' : 'adjustment'
                                }`}
                              >
                                {isCredit ? '↓' : isDebit ? '↑' : isHold ? '⏸' : '='}
                              </span>
                              <span>{isCredit ? 'Credit' : isDebit ? 'Debit' : isHold ? 'Hold' : 'Adjustment'}</span>
                            </div>
                          </td>

                          <td>
                            <strong
                              className={`tx-amount-val ${
                                isCredit ? 'good' : isDebit ? 'bad' : isHold ? 'text-amber' : 'blue'
                              }`}
                            >
                              {tx.amount}
                            </strong>
                          </td>

                          <td>
                            <span className="tx-ref-code">{tx.id || 'WTX-AUTO-01'}</span>
                          </td>

                          <td style={{ textAlign: 'right' }}>
                            <strong className="tx-balance-val">
                              {tx.balanceAfter || (idx === 0 ? `+ ₹${(selectedDriver.wallet?.spendableBalance || 1200).toLocaleString('en-IN')}.00` : '₹0.00')}
                            </strong>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <div className="footer-note" style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Showing 1 to {filteredTxns.length} of {driverTxns.length} transactions</span>
              <div className="pagination">
                <button className="btn small" disabled>‹</button>
                <button className="btn small primary">1</button>
                <button className="btn small" disabled>›</button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* TOP-UP / ADD MONEY MODAL */}
      {showTopupModal && modalDriver && (
        <div className="clean-modal-backdrop" onClick={() => !isProcessing && setShowTopupModal(false)}>
          <div className="clean-modal-dialog topup-modal-dialog" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="clean-modal-header topup-modal-header">
              <div className="modal-title-wrap">
                <div className="topup-header-icon-box">
                  <CreditCard size={18} color="#0284c7" />
                </div>
                <div>
                  <h3 className="topup-modal-heading">Add Money to Driver Wallet</h3>
                  <p className="topup-modal-subheading">
                    Instant balance credit &amp; automated rental dues settlement
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => !isProcessing && setShowTopupModal(false)}
                title="Close dialog"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleExecuteTopup} className="topup-modal-form">
              <div className="clean-modal-body topup-modal-body">
                {/* 1. Driver Profile & Wallet Snapshot Card */}
                <div className="topup-driver-profile-card">
                  <div className="topup-driver-info-row">
                    <div className="topup-avatar-circle">
                      {modalDriver.name ? modalDriver.name.slice(0, 2).toUpperCase() : 'DR'}
                    </div>
                    <div className="topup-driver-meta">
                      <div className="topup-driver-name">{modalDriver.name}</div>
                      <div className="topup-driver-phone">{modalDriver.phone || 'No phone recorded'}</div>
                    </div>
                    <div className="topup-vehicle-badge">
                      <Car size={13} />
                      <span>{modalDriver.vehicle?.registration || 'No Vehicle'}</span>
                    </div>
                  </div>

                  <div className="topup-driver-balance-strip">
                    <div className="topup-strip-stat">
                      <span className="strip-stat-lbl">Current Spendable</span>
                      <strong className={`strip-stat-val ${(modalDriver.wallet?.spendableBalance || 0) < 0 ? 'text-red' : 'text-green'}`}>
                        ₹{(modalDriver.wallet?.spendableBalance || 0).toLocaleString('en-IN')}.00
                      </strong>
                    </div>

                    <div className="topup-strip-stat">
                      <span className="strip-stat-lbl">Wallet Status</span>
                      <span className={`pill small ${
                        modalDriver.wallet?.status === 'Breached' ? 'red' :
                        modalDriver.wallet?.status === 'Low Balance' ? 'orange' : 'green'
                      }`}>
                        {modalDriver.wallet?.status || 'Healthy'}
                      </span>
                    </div>

                    {modalDriver.wallet?.outstandingDues > 0 && (
                      <div className="topup-strip-stat dues-alert-strip">
                        <span className="strip-stat-lbl text-red">Overdue Dues</span>
                        <strong className="strip-stat-val text-red">
                          ₹{modalDriver.wallet.outstandingDues.toLocaleString('en-IN')}
                        </strong>
                      </div>
                    )}
                  </div>

                  {modalDriver.wallet?.outstandingDues > 0 && (
                    <div className="topup-auto-clearance-notice">
                      <AlertTriangle size={13} color="#dc2626" />
                      <span>
                        ₹{modalDriver.wallet.outstandingDues.toLocaleString('en-IN')} pending rental dues will be automatically settled from this recharge.
                      </span>
                    </div>
                  )}
                </div>

                {/* 2. Quick Amount Selector Pills */}
                <div className="clean-form-group">
                  <div className="form-label-row">
                    <label className="clean-form-label">Select Recharge Amount</label>
                    <span className="clean-form-optional">Quick preset</span>
                  </div>

                  <div className="topup-amount-chips-grid">
                    {[500, 1000, 1200, 2000, 5000].map((amt) => {
                      const isSelected = topupAmount === String(amt);
                      return (
                        <button
                          key={amt}
                          type="button"
                          className={`topup-amount-chip ${isSelected ? 'is-selected' : ''}`}
                          onClick={() => setTopupAmount(String(amt))}
                        >
                          <span className="chip-symbol">₹</span>
                          <span className="chip-num">{amt.toLocaleString('en-IN')}</span>
                          {isSelected && <span className="chip-check">✓</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 3. Custom Amount Input with Currency Adornment */}
                <div className="clean-form-group">
                  <label className="clean-form-label">Credit Amount (₹) *</label>
                  <div className="topup-input-currency-wrap">
                    <span className="currency-adornment">₹</span>
                    <input
                      type="number"
                      className="clean-form-input input-with-currency"
                      placeholder="0.00"
                      value={topupAmount}
                      onChange={(e) => setTopupAmount(e.target.value)}
                      required
                      min="1"
                      step="any"
                    />
                  </div>
                  <span className="clean-form-helper">
                    Funds reflect immediately in driver's spendable balance pocket.
                  </span>
                </div>

                {/* 4. Payment Mode Selection */}
                <div className="clean-form-group">
                  <label className="clean-form-label">Payment Mode *</label>
                  <div className="clean-select-wrap">
                    <select
                      className="clean-form-input clean-form-select"
                      value={topupMethod}
                      onChange={(e) => setTopupMethod(e.target.value)}
                    >
                      <option value="UPI">UPI Auto-Collect / QR Payment</option>
                      <option value="Cash at Hub">Cash Deposited at Operations Hub Terminal</option>
                      <option value="Bank Transfer (NEFT)">Bank Transfer / Direct NEFT</option>
                      <option value="Admin Credit Voucher">Admin Concession / Credit Voucher</option>
                    </select>
                  </div>
                </div>

                {/* 5. Reference ID / UTR Input */}
                <div className="clean-form-group">
                  <div className="form-label-row">
                    <label className="clean-form-label">Reference ID / Bank UTR *</label>
                    <span
                      className="clean-form-action-link"
                      onClick={() => setTopupRef(`UPI-${Date.now().toString().slice(-8)}`)}
                      title="Generate new unique reference"
                    >
                      Generate New
                    </span>
                  </div>
                  <input
                    type="text"
                    className="clean-form-input"
                    placeholder="e.g. UTR-3399448821"
                    value={topupRef}
                    onChange={(e) => setTopupRef(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Modal Footer */}
              <div className="clean-modal-footer topup-modal-footer">
                <button
                  type="button"
                  className="btn-modal-cancel"
                  onClick={() => setShowTopupModal(false)}
                  disabled={isProcessing}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-modal-submit"
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <span>Processing Credit...</span>
                  ) : (
                    <span>Credit ₹{parseFloat(topupAmount || 0).toLocaleString('en-IN')} to Wallet →</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
