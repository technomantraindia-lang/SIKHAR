import React, { useState, useEffect } from 'react';
import {
  Truck,
  Bus,
  Wrench,
  IndianRupee,
  ChevronRight,
  Plus,
  AlertTriangle,
  Info,
  Calendar
} from '../common/Icons';
import { fetchDashboardApi } from '../../services/api';

export default function ExecutiveDashboard({ onNavigate }) {
  const [_data, setData] = useState(null);
  const [_loading, setLoading] = useState(true);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [orderStep, setOrderStep] = useState(1);

  useEffect(() => {
    async function loadDashboard() {
      try {
        const result = await fetchDashboardApi();
        setData(result);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadDashboard();
  }, []);

  // Utilization Chart Data
  const utilizationDays = [
    { day: '12 Aug', pct: 78, isToday: false },
    { day: '13 Aug', pct: 71, isToday: false },
    { day: '14 Aug', pct: 87, isToday: false },
    { day: '15 Aug', pct: 75, isToday: false },
    { day: '16 Aug', pct: 83, isToday: false },
    { day: '17 Aug', pct: 77, isToday: false },
    { day: '18 Aug', pct: 88, isToday: true }
  ];

  // Financial Bars Data
  const revenueBars = [
    { day: '12 Aug', val: 42 },
    { day: '13 Aug', val: 65 },
    { day: '14 Aug', val: 78 },
    { day: '15 Aug', val: 54 },
    { day: '16 Aug', val: 92 },
    { day: '17 Aug', val: 62 },
    { day: '18 Aug', val: 58 }
  ];

  const collectionBars = [
    { day: '12 Aug', val: 32 },
    { day: '13 Aug', val: 58 },
    { day: '14 Aug', val: 82 },
    { day: '15 Aug', val: 72 },
    { day: '16 Aug', val: 52 },
    { day: '17 Aug', val: 68 },
    { day: '18 Aug', val: 48 }
  ];

  const outstandingBars = [
    { day: '12 Aug', val: 30 },
    { day: '13 Aug', val: 48 },
    { day: '14 Aug', val: 75 },
    { day: '15 Aug', val: 88 },
    { day: '16 Aug', val: 46 },
    { day: '17 Aug', val: 38 },
    { day: '18 Aug', val: 54 }
  ];

  // Donut SVG constants
  // Circumference = 2 * PI * 54 = 339.29
  // Proportions: Green (64/78), Orange (4/78), Red (3/78), Purple (7/78)
  const donutC = 339.29;
  const totalItems = 78;
  const greenLen = (64 / totalItems) * donutC; // ~278.4
  const orangeLen = (4 / totalItems) * donutC; // ~17.4
  const redLen = (3 / totalItems) * donutC;    // ~13.0
  const purpleLen = (7 / totalItems) * donutC; // ~30.4

  const greenOffset = 0;
  const orangeOffset = -greenLen;
  const redOffset = -(greenLen + orangeLen);
  const purpleOffset = -(greenLen + orangeLen + redLen);

  return (
    <div className="sikhar-dashboard-view">
      {/* 1. Header Row */}
      <div className="dash-hero-banner">
        <div className="dash-hero-title-group">
          <h1 className="dash-greeting-text">Good morning, Sanjay 👋</h1>
          <p className="dash-date-subtext">Tuesday, 18 August 2026 • Executive Control Centre</p>
        </div>

        <button 
          className="dash-primary-btn"
          onClick={() => { setShowOrderModal(true); setOrderStep(1); }}
        >
          <Plus size={16} strokeWidth={2.5} />
          <span>New Rental Order</span>
        </button>
      </div>

      {/* 2. Top Row: 4 KPI Cards */}
      <div className="dash-kpi-cards-grid">
        {/* Total Fleet */}
        <div className="kpi-card-item" onClick={() => onNavigate && onNavigate('fleet')}>
          <div className="kpi-card-left-icon icon-bg-blue">
            <Truck size={20} className="kpi-icon-blue" />
          </div>
          <div className="kpi-card-body">
            <div className="kpi-card-head">
              <span className="kpi-card-label">Total Fleet</span>
              <div className="kpi-chevron-circle">
                <ChevronRight size={14} />
              </div>
            </div>
            <div className="kpi-card-metric">72</div>
            <div className="kpi-card-subline">100% of fleet</div>
          </div>
        </div>

        {/* On Road */}
        <div className="kpi-card-item" onClick={() => onNavigate && onNavigate('fleet')}>
          <div className="kpi-card-left-icon icon-bg-green">
            <Bus size={20} className="kpi-icon-green" />
          </div>
          <div className="kpi-card-body">
            <div className="kpi-card-head">
              <span className="kpi-card-label">On Road</span>
              <div className="kpi-chevron-circle">
                <ChevronRight size={14} />
              </div>
            </div>
            <div className="kpi-card-metric">64</div>
            <div className="kpi-card-subline">88.89% utilization</div>
          </div>
        </div>

        {/* In Maintenance */}
        <div className="kpi-card-item" onClick={() => onNavigate && onNavigate('maintenance')}>
          <div className="kpi-card-left-icon icon-bg-amber">
            <Wrench size={20} className="kpi-icon-amber" />
          </div>
          <div className="kpi-card-body">
            <div className="kpi-card-head">
              <span className="kpi-card-label">In Maintenance</span>
              <div className="kpi-chevron-circle">
                <ChevronRight size={14} />
              </div>
            </div>
            <div className="kpi-card-metric">3</div>
            <div className="kpi-card-subline">4.17% of fleet</div>
          </div>
        </div>

        {/* Revenue Today */}
        <div className="kpi-card-item" onClick={() => onNavigate && onNavigate('finance-overview')}>
          <div className="kpi-card-left-icon icon-bg-cyan">
            <IndianRupee size={20} className="kpi-icon-cyan" />
          </div>
          <div className="kpi-card-body">
            <div className="kpi-card-head">
              <span className="kpi-card-label">Revenue Today</span>
              <div className="kpi-chevron-circle">
                <ChevronRight size={14} />
              </div>
            </div>
            <div className="kpi-card-metric">₹29,050</div>
            <div className="kpi-card-subline growth-green">
              <span>↑ 8.3%</span> vs yesterday
            </div>
          </div>
        </div>
      </div>

      {/* 3. Middle Row: Fleet Utilization & Fleet Status */}
      <div className="dash-charts-split-grid">
        {/* Fleet Utilization Card */}
        <div className="chart-panel-card fleet-utilization-panel">
          <div className="chart-panel-header">
            <h2 className="chart-panel-title">Fleet Utilization</h2>
            <div className="util-rate-indicator">
              <span className="rate-num">88.9%</span>
              <span className="rate-lbl">Today</span>
            </div>
          </div>

          <div className="utilization-chart-canvas">
            {/* Y-Axis markers & Horizontal Grid Lines */}
            <div className="chart-y-axis">
              <div className="y-marker"><span>100%</span><div className="y-grid-line"></div></div>
              <div className="y-marker"><span>75%</span><div className="y-grid-line"></div></div>
              <div className="y-marker"><span>50%</span><div className="y-grid-line"></div></div>
              <div className="y-marker"><span>25%</span><div className="y-grid-line"></div></div>
              <div className="y-marker"><span>0%</span><div className="y-grid-line"></div></div>
            </div>

            {/* 7 Daily Bar Columns */}
            <div className="chart-bars-container">
              {utilizationDays.map((col, idx) => (
                <div key={idx} className="util-bar-column">
                  <div className={`bar-pct-label ${col.isToday ? 'is-today' : ''}`}>
                    {col.pct}%
                  </div>
                  <div className="bar-track-housing">
                    <div
                      className={`bar-fill-cylinder ${col.isToday ? 'fill-today-green' : 'fill-blue'}`}
                      style={{ height: `${col.pct}%` }}
                    />
                  </div>
                  <div className="bar-day-name">{col.day}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Fleet Status Card */}
        <div className="chart-panel-card fleet-status-panel">
          <div className="chart-panel-header">
            <h2 className="chart-panel-title">Fleet Status</h2>
            <div className="kpi-chevron-circle">
              <ChevronRight size={14} />
            </div>
          </div>

          <div className="donut-chart-flex-container">
            {/* SVG Donut */}
            <div className="donut-svg-wrapper">
              <svg className="donut-svg-canvas" viewBox="0 0 140 140">
                <g transform="rotate(-65 70 70)">
                  {/* Green: On Road (64) */}
                  <circle
                    cx="70"
                    cy="70"
                    r="54"
                    fill="transparent"
                    stroke="#10b981"
                    strokeWidth="18"
                    strokeDasharray={`${greenLen} ${donutC - greenLen}`}
                    strokeDashoffset={greenOffset}
                  />
                  {/* Orange: Non-ops (4) */}
                  <circle
                    cx="70"
                    cy="70"
                    r="54"
                    fill="transparent"
                    stroke="#f59e0b"
                    strokeWidth="18"
                    strokeDasharray={`${orangeLen} ${donutC - orangeLen}`}
                    strokeDashoffset={orangeOffset}
                  />
                  {/* Red: Maintenance (3) */}
                  <circle
                    cx="70"
                    cy="70"
                    r="54"
                    fill="transparent"
                    stroke="#ef4444"
                    strokeWidth="18"
                    strokeDasharray={`${redLen} ${donutC - redLen}`}
                    strokeDashoffset={redOffset}
                  />
                  {/* Purple: Driver Leave (7) */}
                  <circle
                    cx="70"
                    cy="70"
                    r="54"
                    fill="transparent"
                    stroke="#8b5cf6"
                    strokeWidth="18"
                    strokeDasharray={`${purpleLen} ${donutC - purpleLen}`}
                    strokeDashoffset={purpleOffset}
                  />
                </g>
              </svg>
              <div className="donut-center-badge">
                <div className="donut-center-num">72</div>
                <div className="donut-center-sub">Total Fleet</div>
              </div>
            </div>

            {/* Legend Column */}
            <div className="donut-legend-list">
              <div className="donut-legend-item">
                <div className="legend-label-group">
                  <span className="legend-color-dot dot-green"></span>
                  <span className="legend-text">On Road</span>
                </div>
                <strong className="legend-count-num">64</strong>
              </div>

              <div className="donut-legend-item">
                <div className="legend-label-group">
                  <span className="legend-color-dot dot-orange"></span>
                  <span className="legend-text">Non-ops</span>
                </div>
                <strong className="legend-count-num">4</strong>
              </div>

              <div className="donut-legend-item">
                <div className="legend-label-group">
                  <span className="legend-color-dot dot-red"></span>
                  <span className="legend-text">Maintenance</span>
                </div>
                <strong className="legend-count-num">3</strong>
              </div>

              <div className="donut-legend-item">
                <div className="legend-label-group">
                  <span className="legend-color-dot dot-purple"></span>
                  <span className="legend-text">Driver Leave</span>
                </div>
                <strong className="legend-count-num">7</strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Financial Mini Cards Row (3 Cards) */}
      <div className="dash-finance-cards-grid">
        {/* Revenue (7 days) */}
        <div className="finance-mini-card">
          <div className="chart-panel-header">
            <h3 className="finance-card-title">Revenue (7 days)</h3>
            <div className="kpi-chevron-circle">
              <ChevronRight size={14} />
            </div>
          </div>
          <div className="finance-metric-line">
            <span className="finance-big-amount">₹2,29,050</span>
            <span className="finance-change-pill growth-green">↑ 12.4%</span>
          </div>
          <div className="mini-bars-housing">
            {revenueBars.map((b, i) => (
              <div key={i} className="mini-bar-unit">
                <div className="mini-bar-track">
                  <div className="mini-bar-fill fill-blue" style={{ height: `${b.val}%` }}></div>
                </div>
                <span className="mini-bar-day">{b.day}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Collections (7 days) */}
        <div className="finance-mini-card">
          <div className="chart-panel-header">
            <h3 className="finance-card-title">Collections (7 days)</h3>
            <div className="kpi-chevron-circle">
              <ChevronRight size={14} />
            </div>
          </div>
          <div className="finance-metric-line">
            <span className="finance-big-amount">₹1,98,450</span>
            <span className="finance-change-pill growth-green">↑ 9.7%</span>
          </div>
          <div className="mini-bars-housing">
            {collectionBars.map((b, i) => (
              <div key={i} className="mini-bar-unit">
                <div className="mini-bar-track">
                  <div className="mini-bar-fill fill-green" style={{ height: `${b.val}%` }}></div>
                </div>
                <span className="mini-bar-day">{b.day}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Outstanding */}
        <div className="finance-mini-card">
          <div className="chart-panel-header">
            <h3 className="finance-card-title">Outstanding</h3>
            <div className="kpi-chevron-circle">
              <ChevronRight size={14} />
            </div>
          </div>
          <div className="finance-metric-line">
            <span className="finance-big-amount amount-danger">₹1,64,286.99</span>
          </div>
          <div className="finance-overdue-subtext">159 overdue invoices</div>
          <div className="mini-bars-housing">
            {outstandingBars.map((b, i) => (
              <div key={i} className="mini-bar-unit">
                <div className="mini-bar-track">
                  <div className="mini-bar-fill fill-coral" style={{ height: `${b.val}%` }}></div>
                </div>
                <span className="mini-bar-day">{b.day}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 5. Bottom Row: Recent Alerts & Upcoming Reminders */}
      <div className="dash-bottom-cards-grid">
        {/* Recent Alerts */}
        <div className="chart-panel-card bottom-panel-card">
          <div className="bottom-panel-header">
            <div className="header-title-with-badge">
              <h3 className="bottom-card-title">Recent Alerts</h3>
              <span className="alerts-count-badge">3</span>
            </div>
            <button className="link-view-all-btn">
              <span>View All</span>
              <ChevronRight size={14} />
            </button>
          </div>

          <div className="feed-items-list">
            <div className="alert-row-item">
              <div className="feed-icon-circle icon-bg-red">
                <Wrench size={16} className="text-red" />
              </div>
              <div className="feed-text-details">
                <div className="feed-primary-title">3 vehicles in maintenance</div>
                <div className="feed-secondary-sub">Require attention</div>
              </div>
              <div className="feed-timestamp-text">2 hours ago</div>
            </div>

            <div className="alert-row-item">
              <div className="feed-icon-circle icon-bg-amber">
                <AlertTriangle size={16} className="text-amber" />
              </div>
              <div className="feed-text-details">
                <div className="feed-primary-title">5 challans pending</div>
                <div className="feed-secondary-sub">Action required</div>
              </div>
              <div className="feed-timestamp-text">4 hours ago</div>
            </div>

            <div className="alert-row-item">
              <div className="feed-icon-circle icon-bg-blue">
                <Info size={16} className="text-blue" />
              </div>
              <div className="feed-text-details">
                <div className="feed-primary-title">Insurance due next 7 days</div>
                <div className="feed-secondary-sub">3 vehicles</div>
              </div>
              <div className="feed-timestamp-text">6 hours ago</div>
            </div>
          </div>
        </div>

        {/* Upcoming Reminders */}
        <div className="chart-panel-card bottom-panel-card">
          <div className="bottom-panel-header">
            <h3 className="bottom-card-title">Upcoming Reminders</h3>
            <button className="link-view-all-btn">
              <span>View All</span>
              <ChevronRight size={14} />
            </button>
          </div>

          <div className="feed-items-list">
            <div className="reminder-row-item">
              <div className="feed-icon-circle icon-bg-blue-light">
                <Calendar size={16} className="text-blue" />
              </div>
              <div className="reminder-date-col">24 Aug 2026</div>
              <div className="feed-text-details">
                <div className="feed-primary-title">Insurance renewal</div>
                <div className="feed-secondary-sub">DL01AB1234, HR26CD5678</div>
              </div>
              <div className="reminder-action-arrow">
                <ChevronRight size={16} />
              </div>
            </div>

            <div className="reminder-row-item">
              <div className="feed-icon-circle icon-bg-blue-light">
                <Calendar size={16} className="text-blue" />
              </div>
              <div className="reminder-date-col">25 Aug 2026</div>
              <div className="feed-text-details">
                <div className="feed-primary-title">Permit renewal</div>
                <div className="feed-secondary-sub">UP16EF9012</div>
              </div>
              <div className="reminder-action-arrow">
                <ChevronRight size={16} />
              </div>
            </div>

            <div className="reminder-row-item">
              <div className="feed-icon-circle icon-bg-blue-light">
                <Calendar size={16} className="text-blue" />
              </div>
              <div className="reminder-date-col">21 Aug 2026</div>
              <div className="feed-text-details">
                <div className="feed-primary-title">Service due</div>
                <div className="feed-secondary-sub">GJ05KL3344</div>
              </div>
              <div className="reminder-action-arrow">
                <ChevronRight size={16} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive New Rental Order Wizard Modal */}
      {showOrderModal && (
        <div className="modal-overlay-backdrop" onClick={() => setShowOrderModal(false)}>
          <div className="order-wizard-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="wizard-head">
              <div>
                <h2>Create New Rental Order</h2>
                <p>Zero-bypass onboarding, vehicle allocation, digital agreement and deposit receipt.</p>
              </div>
              <button className="wizard-close-btn" onClick={() => setShowOrderModal(false)}>×</button>
            </div>

            {/* Stepper */}
            <div className="wizard-steps-bar">
              {['1 · Customer & KYC', '2 · Deal Model', '3 · Vehicle Master', '4 · Agreement & Deposit', '5 · Deploy'].map((stepName, idx) => (
                <div key={idx} className={`wizard-step-pill ${orderStep === idx + 1 ? 'is-active' : orderStep > idx + 1 ? 'is-done' : ''}`}>
                  {stepName}
                </div>
              ))}
            </div>

            {/* Step Body */}
            <div className="wizard-step-content">
              {orderStep === 1 && (
                <div className="wizard-form-fields">
                  <div className="input-group">
                    <label>Customer Full Name *</label>
                    <input type="text" defaultValue="Raj Kumar" />
                  </div>
                  <div className="input-group">
                    <label>Mobile Number (OTP Verified) *</label>
                    <input type="text" defaultValue="+91 98110 44291" />
                  </div>
                  <div className="kyc-badge-notice">
                    <span>✓</span> Aadhaar and Driving Licence verified via UIDAI offline gateway.
                  </div>
                </div>
              )}

              {orderStep === 2 && (
                <div className="wizard-form-fields">
                  <div className="input-group">
                    <label>Commercial Deal Model *</label>
                    <select defaultValue="fixed">
                      <option value="fixed">Fixed Daily Rental (₹1,000 / day)</option>
                      <option value="revenue_share">Rapido Revenue Share (75% Driver / 25% Sikhar)</option>
                    </select>
                  </div>
                  <div className="input-group">
                    <label>Billing Cycle Trigger *</label>
                    <select defaultValue="daily">
                      <option value="daily">Daily Auto-Deduction at 00:00</option>
                      <option value="weekly">Weekly on Monday</option>
                    </select>
                  </div>
                </div>
              )}

              {orderStep === 3 && (
                <div className="wizard-form-fields">
                  <div className="input-group">
                    <label>Select Ready Vehicle from Fleet Inventory *</label>
                    <select defaultValue="DL52GD6534">
                      <option value="DL52GD6534">DL52GD6534 — TATA TIGOR EV (Sikhar Hub · Battery 96%)</option>
                      <option value="HR38AK1234">HR38AK1234 — Maruti WagonR CNG (Gurgaon Yard)</option>
                      <option value="HR55BD6737">HR55BD6737 — TATA TIGOR EV (Ready to Deploy)</option>
                    </select>
                  </div>
                  <div className="kyc-badge-notice">
                    <span>🔒</span> Selecting a vehicle triggers an atomic lock in the master registry.
                  </div>
                </div>
              )}

              {orderStep === 4 && (
                <div className="wizard-form-fields">
                  <div className="summary-confirm-row">
                    <span>Digital Lease Agreement</span>
                    <span className="status-pill-green">Signed via Aadhaar e-Sign</span>
                  </div>
                  <div className="summary-confirm-row">
                    <span>Security Deposit Confirmation</span>
                    <span className="status-pill-green">₹75,000 Received (Bank UTR Verified)</span>
                  </div>
                </div>
              )}

              {orderStep === 5 && (
                <div className="wizard-success-pane">
                  <div className="success-icon-large">🚙</div>
                  <h3>Ready for Vehicle Dispatch</h3>
                  <p>Vehicle DL52GD6534 is tagged to Raj Kumar. Fleet Live telemetry updated.</p>
                </div>
              )}
            </div>

            {/* Wizard Controls */}
            <div className="wizard-foot-actions">
              {orderStep > 1 && (
                <button className="btn-secondary" onClick={() => setOrderStep(orderStep - 1)}>
                  ← Back
                </button>
              )}
              {orderStep < 5 ? (
                <button className="btn-primary" onClick={() => setOrderStep(orderStep + 1)}>
                  Continue →
                </button>
              ) : (
                <button 
                  className="btn-primary"
                  onClick={() => {
                    alert('Lease order activated successfully!');
                    setShowOrderModal(false);
                  }}
                >
                  Activate Lease Order
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
