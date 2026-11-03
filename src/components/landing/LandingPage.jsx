import React, { useState } from 'react';
import {
  ArrowRight,
  IndianRupee,
  MapPin,
  Shield,
  Truck,
  Users,
  Car,
  ChevronRight,
  Zap,
  Check,
  Compass,
  Gauge
} from '../common/Icons';
import './LandingPage.css';

function BrandMark({ compact = false }) {
  return (
    <div className={`landing-brand ${compact ? 'landing-brand-compact' : ''}`}>
      <span className="landing-brand-mark" aria-hidden="true">
        <svg viewBox="0 0 32 32" fill="none">
          <path d="M16 3L3 27H29L16 3Z" fill="url(#brand-grad-clean)" />
          <path d="M16 9L7.6 24H24.4L16 9Z" fill="#040d1e" />
          <path d="M16 3V9" stroke="#38bdf8" strokeWidth="1.5" strokeLinecap="round" />
          <defs>
            <linearGradient id="brand-grad-clean" x1="3" y1="3" x2="29" y2="27" gradientUnits="userSpaceOnUse">
              <stop stopColor="#38bdf8" />
              <stop offset="0.6" stopColor="#1d68f2" />
              <stop offset="1" stopColor="#0b3899" />
            </linearGradient>
          </defs>
        </svg>
      </span>
      <span className="landing-brand-wordmark">
        <strong>SIKHAR</strong>
        <em>FLEET</em>
        <small>TO PEAK TO SIKHAR · DELHI NCR</small>
      </span>
    </div>
  );
}

// Simple, versatile fleet categories without hardcoded car photos
const fleetSegments = [
  {
    icon: Car,
    title: 'Sedans & Hatchbacks',
    subtitle: 'CNG & Petrol Fleet',
    desc: 'High-mileage daily city duty, employee transit, and on-demand corporate rides across Delhi NCR.',
    tags: ['S-CNG / Petrol', 'Delhi Commercial Permit', 'FASTag Integrated'],
    color: 'blue'
  },
  {
    icon: Zap,
    title: 'Electric Vehicles (EV)',
    subtitle: 'Zero-Emission Fleet',
    desc: 'Quiet, premium electric sedans and compacts for executive airport transfers and green corporate transit.',
    tags: ['Zero Emission', 'CCS2 Fast Charging', 'Aerocity & Cyber City'],
    color: 'green'
  },
  {
    icon: Shield,
    title: 'SUVs & Executive Fleet',
    subtitle: 'VIP & Intercity Transit',
    desc: 'Spacious high-comfort vehicles deployed for executive delegations, highway corridors, and client visits.',
    tags: ['Chauffeur Driven', 'AIS-140 GPS Tracked', 'Intercity Permits'],
    color: 'amber'
  },
  {
    icon: Truck,
    title: 'Commercial & Logistics',
    subtitle: 'Last-Mile Transport',
    desc: 'Dedicated commercial logistics vehicles for corporate cargo, scheduled routes, and supply chain transport.',
    tags: ['High Uptime', '24/7 Dispatch', 'MoRTH Validated'],
    color: 'purple'
  }
];

// Rich Animated Institutional Governance Pillars Data
const governancePillars = [
  {
    num: '01',
    code: 'GOV-01 · VERIFICATION GATEWAY',
    icon: Users,
    title: 'Driver 6-Gate KYC',
    desc: 'Aadhaar UIDAI OCR auto-fetch, Sarathi Commercial Driving License verification, and Police Commissioner clearance.',
    accent: 'cyan',
    hudTitle: 'INSTITUTIONAL KYC AUDIT',
    hudItems: [
      { label: 'UIDAI Aadhaar OCR & Address Parsing', state: 'Verified & Encrypted' },
      { label: 'Sarathi Commercial DL Authentication', state: 'Active Transport Badge' },
      { label: 'Police Clearance Certificate (PCC)', state: 'Commissioner Record Clear' }
    ],
    statusTag: '6 OF 6 GATES CLEARED (100%)',
    metrics: { label: 'Verification SLA', val: '< 3 Minutes' }
  },
  {
    num: '02',
    code: 'GOV-02 · FINANCIAL ENGINEERING',
    icon: IndianRupee,
    title: 'Automated Lease & Fastag',
    desc: 'Transparent daily lease debits, driver wallet balance management, automated FASTag toll settlements, and GST invoicing.',
    accent: 'emerald',
    hudTitle: 'DAILY SETTLEMENT LEDGER',
    hudItems: [
      { label: 'Daily Lease Standard Tariff', state: '₹1,000 / Day Auto-Debit' },
      { label: 'FASTag Expressway Pass-Through', state: 'Live Plaza Auto-Reconciled' },
      { label: 'Corporate GST Tax Invoice (SAC 9966)', state: 'Instant PDF & ITC Input' }
    ],
    statusTag: 'REAL-TIME WALLET SETTLEMENT',
    metrics: { label: 'Dispute Rate', val: '0.0%' }
  },
  {
    num: '03',
    code: 'GOV-03 · STATUTORY TELEMATICS',
    icon: Compass,
    title: 'MoRTH AIS-140 Telemetry',
    desc: 'Certified GPS telematics, 80 km/h speed governor lock, emergency panic button mapping, and municipal geo-fencing.',
    accent: 'amber',
    hudTitle: 'SAFETY & SPEED GOVERNANCE',
    hudItems: [
      { label: 'RTO Speed Governor Threshold', state: '80 km/h Commercial Lock' },
      { label: 'Dual e-SIM Dual-Network Antenna', state: 'Zero GPS Signal Blindspot' },
      { label: 'Emergency SOS Panic Trigger', state: 'Direct Control Tower Link' }
    ],
    statusTag: 'MoRTH AIS-140 CERTIFIED',
    metrics: { label: 'Signal Uptime', val: '99.98%' }
  },
  {
    num: '04',
    code: 'GOV-04 · TECHNICAL COMPLIANCE',
    icon: Gauge,
    title: 'Depot Health & RTO Fitness',
    desc: 'Periodic preventive overhaul scheduling, EV battery diagnostics, tyre audits, and commercial RTO permit renewals.',
    accent: 'purple',
    hudTitle: 'PREVENTIVE OVERHAUL LOG',
    hudItems: [
      { label: 'Scheduled Maintenance Interval', state: 'Every 10,000 KM Depot Check' },
      { label: 'EV Battery State-of-Health (SoH)', state: 'Diagnostic Index: 99.2%' },
      { label: 'Commercial Fitness & Insurance', state: 'Delhi RTO Permit Validated' }
    ],
    statusTag: '100% REGULATORY AUDIT PASS',
    metrics: { label: 'Depot Turnaround', val: '45 Minutes' }
  }
];

export default function LandingPage({ onOpenLogin }) {
  const [activePillar, setActivePillar] = useState(0);

  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="landing-clean-page">
      {/* ========================================================================= */}
      {/* 1. CLEAN TOP NAVIGATION */}
      {/* ========================================================================= */}
      <header className="clean-nav-header">
        <div className="clean-nav-inner">
          <button
            type="button"
            className="clean-logo-btn"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            <BrandMark compact />
          </button>

          <nav className="clean-nav-menu" aria-label="Main Navigation">
            <button type="button" onClick={() => scrollTo('fleet-segments')}>
              Fleet Architecture
            </button>
            <button type="button" onClick={() => scrollTo('operations')}>
              Governance
            </button>
            <button type="button" onClick={() => scrollTo('hubs')}>
              NCR Hubs
            </button>
          </nav>

          <div className="clean-nav-actions">
            <span className="clean-live-status">
              <span className="live-dot-green" />
              <span>Delhi NCR · Operational</span>
            </span>

            <button
              type="button"
              className="clean-signin-btn"
              onClick={onOpenLogin}
            >
              <span>Sign In</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </header>

      <main>
        {/* ========================================================================= */}
        {/* 2. PROPER HERO BANNER */}
        {/* ========================================================================= */}
        <section className="clean-hero-banner" id="hero">
          <div className="clean-hero-bg">
            <img
              src="/images/hero_banner_real.png"
              alt="Sikhar Fleet commercial vehicles on highway network"
              className="clean-hero-img"
            />
            <div className="clean-hero-scrim" />
          </div>

          <div className="clean-hero-content">
            <div className="clean-hero-badge">
              <span className="hero-badge-dot" />
              <span>SMART FLEET MOBILITY SOLUTIONS</span>
            </div>

            <h1 className="clean-hero-title">
              Moving People.
              <br />
              <span className="hero-title-gradient">Connecting Businesses.</span>
            </h1>

            <p className="clean-hero-desc">
              Reliable Fleet Solutions for Every Journey.
            </p>

            <div className="clean-hero-cta">
              <button
                type="button"
                className="clean-btn-primary"
                onClick={onOpenLogin}
              >
                <span>Sign In</span>
                <ArrowRight size={15} />
              </button>

              <button
                type="button"
                className="clean-btn-secondary"
                onClick={() => scrollTo('fleet-segments')}
              >
                <span>Explore Fleet Architecture</span>
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 3. MULTI-CATEGORY FLEET ARCHITECTURE */}
        {/* ========================================================================= */}
        <section className="clean-section clean-fleet-section" id="fleet-segments">
          <div className="clean-section-header">
            <div>
              <span className="clean-eyebrow">MULTI-CATEGORY CAPABILITY</span>
              <h2>Built for Diverse Commercial Fleet Operations.</h2>
            </div>
            <p className="clean-section-sub">
              Our operating system seamlessly manages multi-make commercial fleets across EV, CNG, and petrol vehicles under standard institutional compliance.
            </p>
          </div>

          <div className="clean-segments-grid">
            {fleetSegments.map((seg) => {
              const Icon = seg.icon;
              return (
                <div className={`clean-segment-card segment-${seg.color}`} key={seg.title}>
                  <div className="segment-card-top">
                    <div className="segment-icon-box">
                      <Icon size={22} />
                    </div>
                    <span className="segment-subtitle">{seg.subtitle}</span>
                  </div>

                  <h3 className="segment-title">{seg.title}</h3>
                  <p className="segment-desc">{seg.desc}</p>

                  <div className="segment-tags">
                    {seg.tags.map((tag) => (
                      <span className="tag-pill" key={tag}>{tag}</span>
                    ))}
                  </div>

                  <button
                    type="button"
                    className="segment-card-link"
                    onClick={onOpenLogin}
                  >
                    <span>Manage segment</span>
                    <ArrowRight size={13} />
                  </button>
                </div>
              );
            })}
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 4. ANIMATED HIGH-TECH INSTITUTIONAL GOVERNANCE PILLARS */}
        {/* ========================================================================= */}
        <section className="clean-section clean-governance-section" id="operations">
          <div className="clean-section-header">
            <div>
              <div className="gov-eyebrow-pill">
                <span className="gov-pulse-dot" />
                <span>INSTITUTIONAL GOVERNANCE</span>
              </div>
              <h2>The 4 Operational Pillars of Sikhar Fleet.</h2>
            </div>
            <p className="clean-section-sub">
              Engineered specifically to solve the regulatory, driver, and financial complexities of commercial fleet operations in India.
            </p>
          </div>

          {/* Interactive Modern 4-Pillar Command Deck */}
          <div className="gov-interactive-container">
            {/* Top Interactive Selector Tabs */}
            <div className="gov-tabs-row" role="tablist">
              {governancePillars.map((p, idx) => (
                <button
                  key={p.num}
                  type="button"
                  role="tab"
                  aria-selected={activePillar === idx}
                  className={`gov-tab-btn ${activePillar === idx ? 'is-active' : ''}`}
                  onClick={() => setActivePillar(idx)}
                >
                  <span className="tab-num-badge">{p.num}</span>
                  <div className="tab-title-wrap">
                    <strong>{p.title}</strong>
                    <small>{p.code.split('·')[1]?.trim() || 'GOVERNANCE'}</small>
                  </div>
                </button>
              ))}
            </div>

            {/* Main Animated Deck Display (Active Pillar Full Breakdown) */}
            <div className={`gov-feature-display card-accent-${governancePillars[activePillar].accent}`}>
              <div className="gov-display-left">
                <div className="gov-display-top-code">
                  <span className="pillar-large-num">{governancePillars[activePillar].num}</span>
                  <span className="pillar-code-pill">{governancePillars[activePillar].code}</span>
                </div>

                <h3 className="gov-display-title">
                  {governancePillars[activePillar].title}
                </h3>

                <p className="gov-display-desc">
                  {governancePillars[activePillar].desc}
                </p>

                <div className="gov-display-metrics-badge">
                  <div className="metric-col">
                    <span className="metric-label">{governancePillars[activePillar].metrics.label}</span>
                    <strong className="metric-value">{governancePillars[activePillar].metrics.val}</strong>
                  </div>
                  <div className="metric-col">
                    <span className="metric-label">Compliance Status</span>
                    <strong className="metric-value text-green">100% Certified</strong>
                  </div>
                </div>

                <button
                  type="button"
                  className="gov-explore-btn"
                  onClick={onOpenLogin}
                >
                  <span>Sign in to verify records</span>
                  <ArrowRight size={14} />
                </button>
              </div>

              {/* Right: Live Interactive Telemetry Micro-HUD */}
              <div className="gov-display-right-hud">
                <div className="hud-console-header">
                  <div className="hud-title-wrap">
                    <div className="hud-pulse-light" />
                    <strong>{governancePillars[activePillar].hudTitle}</strong>
                  </div>
                  <span className="hud-status-badge">
                    {governancePillars[activePillar].statusTag}
                  </span>
                </div>

                <div className="hud-items-stack">
                  {governancePillars[activePillar].hudItems.map((item) => (
                    <div className="hud-check-row" key={item.label}>
                      <div className="hud-check-icon">
                        <Check size={14} />
                      </div>
                      <div className="hud-row-text">
                        <strong>{item.label}</strong>
                        <small>{item.state}</small>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="hud-console-footer">
                  <span className="hud-footer-tag">SIKHAR-OS v2.4 PROTOCOL</span>
                  <span className="hud-audit-stamp">INSTITUTIONAL ENCRYPTED</span>
                </div>
              </div>
            </div>

            {/* Bottom 4-Card Overview Grid */}
            <div className="gov-cards-grid">
              {governancePillars.map((p, idx) => {
                const Icon = p.icon;
                const isSelected = activePillar === idx;
                return (
                  <div
                    key={p.num}
                    className={`gov-micro-card ${isSelected ? 'selected' : ''}`}
                    onClick={() => setActivePillar(idx)}
                  >
                    <div className="micro-card-top">
                      <div className={`micro-icon-bubble accent-${p.accent}`}>
                        <Icon size={18} />
                      </div>
                      <span className="micro-num">{p.num}</span>
                    </div>
                    <h4>{p.title}</h4>
                    <p>{p.desc}</p>
                    <span className="micro-inspect-link">
                      <span>{isSelected ? 'Currently Viewing' : 'Inspect Details'}</span>
                      <ChevronRight size={13} />
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 5. STRATEGIC NCR REGIONAL COVERAGE */}
        {/* ========================================================================= */}
        <section className="clean-section clean-hubs-section" id="hubs">
          <div className="clean-hubs-card">
            <div className="hubs-card-left">
              <span className="clean-eyebrow">REGIONAL NETWORK</span>
              <h2>Integrated Across Key Delhi NCR Corridors.</h2>
              <p>
                Continuous fleet visibility and dispatch across strategic commercial and corporate centers in the National Capital Region.
              </p>

              <div className="hubs-pills-row">
                <div className="hub-chip">
                  <MapPin size={15} className="chip-icon" />
                  <div>
                    <strong>Aerocity &amp; IGI Airport T3</strong>
                    <small>Executive Transfers</small>
                  </div>
                </div>

                <div className="hub-chip">
                  <MapPin size={15} className="chip-icon" />
                  <div>
                    <strong>Cyber City &amp; DLF Phase 2/3</strong>
                    <small>Gurugram Tech Corridor</small>
                  </div>
                </div>

                <div className="hub-chip">
                  <MapPin size={15} className="chip-icon" />
                  <div>
                    <strong>Noida Sector 62 &amp; Expressway</strong>
                    <small>Commuter &amp; IT Hubs</small>
                  </div>
                </div>

                <div className="hub-chip">
                  <MapPin size={15} className="chip-icon" />
                  <div>
                    <strong>Okhla Industrial Area</strong>
                    <small>Central Service Depot</small>
                  </div>
                </div>
              </div>
            </div>

            <div className="hubs-card-right">
              <div className="hubs-stat-box">
                <span className="stat-label">RTO PERMITS</span>
                <strong>DL · HR · UP</strong>
                <small>100% Validated &amp; Commercial</small>
              </div>
              <div className="hubs-stat-box">
                <span className="stat-label">DISPATCH STATUS</span>
                <strong className="text-emerald">24/7 Active</strong>
                <small>Central Telemetry Tower</small>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 6. CLEAN CALL TO ACTION */}
        {/* ========================================================================= */}
        <section className="clean-cta-section">
          <div className="clean-cta-box">
            <div className="cta-copy">
              <h2>Ready to streamline your fleet operations?</h2>
              <p>
                Sign in to the Sikhar Fleet Administrative Command Portal to access live fleet telemetry, driver verification vaults, and automated billing.
              </p>
            </div>
            <button
              type="button"
              className="clean-cta-btn"
              onClick={onOpenLogin}
            >
              <span>Sign In</span>
              <ArrowRight size={15} />
            </button>
          </div>
        </section>
      </main>

      {/* ========================================================================= */}
      {/* 7. CLEAN & MINIMAL FOOTER */}
      {/* ========================================================================= */}
      <footer className="clean-minimal-footer">
        <div className="footer-content-row">
          <BrandMark compact />
          <div className="footer-center-copy">
            <span>© 2026 Sikhar Fleet Private Limited. All rights reserved.</span>
            <small>Central Hub: Aerocity Commercial District · Delhi NCR, India</small>
          </div>
          <button
            type="button"
            className="footer-tower-link"
            onClick={onOpenLogin}
          >
            <span>Sign In</span>
            <ArrowRight size={13} />
          </button>
        </div>
      </footer>
    </div>
  );
}
