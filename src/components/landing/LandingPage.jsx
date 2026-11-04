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
import bannerImage from '../../assets/image copy 3.png';
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

const coreServices = [
  { title: 'Employee Transport', description: 'Safe, reliable, and on-time commute solutions for your workforce.', icon: 'people' },
  { title: 'Electric Mobility (EV)', description: 'Sustainable and low-emission fleet solutions for a cleaner, greener Delhi NCR.', icon: 'bolt', featured: true },
  { title: 'Corporate & Executive Fleet', description: 'Premium and comfortable mobility for business travel, client meetings, and leadership.', icon: 'calendar' },
  { title: 'Commercial & Logistics', description: 'Efficient fleet support for cargo movement, supply chain, and operational logistics.', icon: 'box' },
  { title: 'Last-Mile & Shuttle Services', description: 'Flexible and reliable transport for campuses, offices, and multi-location operations.', icon: 'pin' },
];

const serviceAssurances = [
  { label: 'Compliant & Secure', icon: 'shield' },
  { label: 'Real-time Operations', icon: 'chart' },
  { label: 'Multi-Platform Ready', icon: 'layers' },
  { label: 'Sustainable Mobility', icon: 'leaf' },
];

const platformCapabilities = [
  { title: <>Real-Time<br />Tracking</>, description: 'Live location, trip visibility, and route insights.', icon: MapPin },
  { title: <>Operational<br />Analytics</>, description: 'Performance, utilization, and revenue insights.', icon: Gauge },
  { title: <>Compliance &amp;<br />Governance</>, description: 'Automated KYC, permits, fitness, and regulatory checks.', icon: Shield },
  { title: <>Partner<br />Integration</>, description: 'Seamless data sync with Rapido, Uber, Ola, etc.', icon: Compass },
  { title: <>Fleet<br />Management</>, description: 'Vehicles, allocation, maintenance, and usage.', icon: Car },
  { title: <>Revenue &amp;<br />Reconciliation</>, description: 'Trip earnings import, revenue share, and settlement.', icon: IndianRupee },
];

function SocialIcon({ type }) {
  if (type === 'linkedin') return <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="4" width="16" height="16" rx="2" /><path d="M8 10v6M8 8v.01M12 16v-3.2a2.8 2.8 0 0 1 5.6 0V16M12 10v6" /></svg>;
  if (type === 'youtube') return <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="6" width="18" height="12" rx="3" /><path d="m10 9 5 3-5 3V9Z" fill="currentColor" stroke="none" /></svg>;
  if (type === 'x') return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 4h3.8l3.6 5.1L16.7 4H19l-5.5 6.4L19.5 20h-3.8l-4-5.7L6.9 20H4.5l5.7-6.7L5 4Z" fill="currentColor" stroke="none" /></svg>;
  return <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="4" width="16" height="16" rx="5" /><circle cx="12" cy="12" r="3.5" /><circle cx="17.2" cy="6.9" r="1" fill="currentColor" stroke="none" /></svg>;
}

function PlatformCapabilitiesSection({ onOpenLogin }) {
  return (
    <section className="platform-capabilities-section" id="platform-capabilities">
      <div className="platform-capabilities-backdrop" aria-hidden="true" />
      <div className="platform-capabilities-main">
        <div className="platform-capabilities-copy">
          <div className="platform-capabilities-badge"><span className="platform-layers-mark">▱</span><span>Platform Capabilities</span></div>
          <h2>A Unified Platform for<br />End-to-End Fleet<br /><span>Operations</span></h2>
          <p>Monitor, manage, and optimize your commercial fleet with real-time visibility, automation, and actionable insights.</p>
          <ul className="platform-check-list">
            <li><span>✓</span>Operational Control</li>
            <li><span>✓</span>Regulatory Compliance</li>
            <li><span>✓</span>Partner Integrations</li>
            <li><span>✓</span>Revenue Intelligence</li>
          </ul>
          <div className="platform-action-row">
            <button type="button" className="platform-primary-btn" onClick={onOpenLogin}>Explore Platform <ArrowRight size={18} /></button>
            <button type="button" className="platform-demo-btn" onClick={() => document.getElementById('core-services')?.scrollIntoView({ behavior: 'smooth' })}><span>▶</span>Watch Demo</button>
          </div>
        </div>
        <div className="platform-capabilities-visual">
          <img src="/images/platform-devices.png" alt="Sikhar Fleet dashboard on laptop and mobile" />
        </div>
      </div>
      <div className="platform-capability-strip">
        {platformCapabilities.map(({ title, description, icon: Icon }) => (
          <div className="platform-capability-card" key={description}>
            <div className="platform-capability-icon"><Icon size={29} strokeWidth={1.9} /></div>
            <div><h3>{title}</h3><p>{description}</p></div>
          </div>
        ))}
      </div>
    </section>
  );
}

function ServiceDots() {
  return <span className="core-services-dots" aria-hidden="true">{Array.from({ length: 9 }).map((_, i) => <i key={i} />)}</span>;
}

function CoreServiceIcon({ type, featured = false }) {
  return (
    <div className={`core-service-visual ${featured ? 'is-featured' : ''}`}>
      <svg viewBox="0 0 72 72" className="core-service-platform" aria-hidden="true">
        <defs>
          <linearGradient id={`core-platform-${type}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor={featured ? '#0795ff' : '#ecf7ff'} />
            <stop offset="1" stopColor={featured ? '#0b5ec9' : '#8fc5fa'} />
          </linearGradient>
        </defs>
        <path d="M36 9 67 26 36 43 5 26 36 9Z" fill={`url(#core-platform-${type})`} opacity=".74" />
        <path d="m5 26 31 18 31-18v9L36 53 5 35v-9Z" fill={`url(#core-platform-${type})`} opacity=".9" />
        <path d="m5 35 31 18 31-18M5 27l31 18 31-18" stroke={featured ? '#00bfff' : '#8ac8ff'} strokeWidth="1.4" />
      </svg>
      <svg viewBox="0 0 72 72" className="core-service-line-icon" aria-hidden="true">
        {type === 'people' && <><circle cx="36" cy="20" r="8" /><path d="M22 40c0-7 6-12 14-12s14 5 14 12v3H22v-3Z" /><path d="M21 27c-5 0-9 3-9 8v3h8M51 27c5 0 9 3 9 8v3h-8M28 11c-4-1-8 2-8 7 0 2 1 4 3 5M44 11c4-1 8 2 8 7 0 2-1 4-3 5" /></>}
        {type === 'bolt' && <path d="M42 8 25 34h12l-5 28 18-34H38l4-20Z" fill="currentColor" stroke="none" />}
        {type === 'calendar' && <><rect x="18" y="16" width="36" height="38" rx="5" /><path d="M26 12v9M46 12v9M18 27h36M28 40l6 6 11-13" /></>}
        {type === 'box' && <><path d="m36 11 18 10v23L36 54 18 44V21l18-10Z" /><path d="m18 21 18 11 18-11M36 32v22M28 16l18 10" /></>}
        {type === 'pin' && <><path d="M53 29c0 14-17 29-17 29S19 43 19 29a17 17 0 1 1 34 0Z" /><circle cx="36" cy="29" r="5" /></>}
      </svg>
    </div>
  );
}

function ServiceAssuranceIcon({ type }) {
  if (type === 'shield') return <Shield size={40} strokeWidth={1.8} />;
  if (type === 'chart') return <span className="core-assurance-chart"><span /><span /><span /></span>;
  if (type === 'leaf') return <svg viewBox="0 0 44 44" aria-hidden="true"><path d="M35 8C20 8 11 15 11 27c0 5 3 9 8 9 12 0 16-11 16-28Z" /><path d="M7 38c6-10 12-16 22-22" /></svg>;
  return <svg viewBox="0 0 44 44" aria-hidden="true"><path d="m22 6 16 8-16 8-16-8 16-8Z" /><path d="m6 22 16 8 16-8M6 30l16 8 16-8" /></svg>;
}

function CoreServicesSection({ onOpenLogin }) {
  return (
    <section className="core-services-section" id="core-services">
      <div className="core-services-orb core-services-orb-left" />
      <div className="core-services-orb core-services-orb-right" />
      <div className="core-services-curve core-services-curve-top" />
      <div className="core-services-curve core-services-curve-bottom" />
      <div className="core-services-inner">
        <div className="core-services-heading">
          <div className="core-services-eyebrow"><ServiceDots /><span>OUR CORE SERVICES</span></div>
          <h2>Comprehensive <span>Fleet Solutions</span></h2>
          <p>End-to-end mobility and operational solutions for businesses, enterprises, and institutions across Delhi NCR.</p>
        </div>
        <div className="core-services-grid">
          {coreServices.map((service) => (
            <button key={service.icon} type="button" className="core-service-card" onClick={onOpenLogin}>
              <span className="core-service-glow" />
              <CoreServiceIcon type={service.icon} />
              <span className="core-service-copy"><strong>{service.title}</strong><span>{service.description}</span></span>
              <span className="core-service-arrow"><ArrowRight size={25} strokeWidth={2.6} /></span>
            </button>
          ))}
        </div>
        <div className="core-assurance-bar" aria-label="Sikhar Fleet benefits">
          {serviceAssurances.map((assurance, index) => <React.Fragment key={assurance.label}>{index > 0 && <span className="core-assurance-divider" />}<div className="core-assurance-item"><span className="core-assurance-icon"><ServiceAssuranceIcon type={assurance.icon} /></span><strong>{assurance.label}</strong></div></React.Fragment>)}
        </div>
      </div>
    </section>
  );
}

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
            <button type="button" onClick={() => scrollTo('core-services')}>
              Core Services
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
              src={bannerImage}
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
              Reliable, compliant, and technology-led fleet solutions for every journey in Delhi NCR.
            </p>

            <div className="clean-hero-cta">
              <button
                type="button"
                className="clean-btn-primary"
                onClick={onOpenLogin}
              >
                <span>Get Started</span>
                <ArrowRight size={15} />
              </button>

              <button
                type="button"
                className="clean-btn-secondary"
                onClick={() => scrollTo('core-services')}
              >
                <span>Explore Fleet Architecture</span>
                <ChevronRight size={15} />
              </button>
            </div>

          </div>
        </section>

        {/* ========================================================================= */}
        {/* 3. SCREENSHOT-MATCHED CORE SERVICES */}
        {/* ========================================================================= */}
        <CoreServicesSection onOpenLogin={onOpenLogin} />

        {/* ========================================================================= */}
        {/* 4. PLATFORM CAPABILITIES SECTION */}
        {/* ========================================================================= */}
        <PlatformCapabilitiesSection onOpenLogin={onOpenLogin} />

        {/* ========================================================================= */}
        {/* 4. MULTI-CATEGORY FLEET ARCHITECTURE */}
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
      <footer className="sikhar-footer">
        <div className="sikhar-footer-content">
          <div className="footer-brand-column">
            <BrandMark compact />
            <p>A commercial fleet operations platform for Indian businesses — from driver KYC to revenue and compliance.</p>
            <div className="footer-socials" aria-label="Social links">
              <a href="https://www.linkedin.com" target="_blank" rel="noreferrer" aria-label="LinkedIn"><SocialIcon type="linkedin" /></a>
              <a href="https://www.youtube.com" target="_blank" rel="noreferrer" aria-label="YouTube"><SocialIcon type="youtube" /></a>
              <a href="https://x.com" target="_blank" rel="noreferrer" aria-label="X"><SocialIcon type="x" /></a>
              <a href="https://www.instagram.com" target="_blank" rel="noreferrer" aria-label="Instagram"><SocialIcon type="instagram" /></a>
            </div>
          </div>
          <div className="footer-link-column">
            <h3>Platform</h3>
            <a href="#fleet-segments">Fleet Management</a>
            <a href="#operations">Trips &amp; Revenue</a>
            <a href="#operations">Fuel &amp; Telematics</a>
            <a href="#operations">Compliance</a>
            <a href="#hubs">Reports &amp; Analytics</a>
          </div>
          <div className="footer-link-column">
            <h3>Company</h3>
            <a href="#hero">About Us</a>
            <a href="#operations">Our Approach</a>
            <a href="#hero">Careers</a>
            <a href="#hubs">Contact Us</a>
          </div>
          <div className="footer-link-column">
            <h3>Resources</h3>
            <a href="#core-services">Blogs &amp; Insights</a>
            <a href="#operations">Product Docs</a>
            <a href="#hubs">Help Center</a>
            <a href="#core-services">What’s New</a>
          </div>
        </div>
        <div className="footer-bottom-row">
          <span>© 2026 Sikhar Fleet. All rights reserved.</span>
          <nav aria-label="Legal links">
            <a href="#hero">Privacy Policy</a><i />
            <a href="#hero">Terms of Use</a><i />
            <a href="#hero">Cookie Policy</a>
          </nav>
        </div>
      </footer>
    </div>
  );
}

