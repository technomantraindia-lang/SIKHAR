import React, { useState } from 'react';
import {
  Car,
  Shield,
  CreditCard,
  FileText,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Zap,
  Phone,
  MapPin,
  Award,
  ChevronRight,
  TrendingUp,
  Receipt,
  Download,
  Eye,
  RefreshCw
} from '../common/Icons';

export default function DriverDashboardOverview({
  driverUser,
  onNavigate,
  onToggleDuty,
  dutyStatus,
  onRefresh,
  refreshing
}) {
  const driver = driverUser || {};
  const kyc = driver.kyc || {};
  const todayVehicle = driver.todayVehicle;
  const isTodaySwapped = Boolean(todayVehicle && todayVehicle.registration);
  const vehicle = isTodaySwapped ? todayVehicle : (driver.vehicle || {});
  const deal = driver.deal || {};
  const wallet = driver.wallet || {};
  const attendance = driver.attendance || {};

  const [checklistOpen, setChecklistOpen] = useState(false);
  const [checklist, setChecklist] = useState({
    tyres: true,
    brakes: true,
    lights: true,
    battery: true,
    cleanliness: true
  });

  const toggleCheck = (item) => {
    setChecklist((prev) => ({ ...prev, [item]: !prev[item] }));
  };

  const allChecksPassed = Object.values(checklist).every(Boolean);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* 1. Hero Cockpit Greeting Banner */}
      <div
        className="driver-hero-card"
        style={{
          background: 'linear-gradient(135deg, #07132e 0%, #0c204c 60%, #061129 100%)',
          borderRadius: '16px',
          padding: '24px 28px',
          color: '#ffffff',
          position: 'relative',
          overflow: 'hidden',
          border: '1px solid rgba(56, 189, 248, 0.25)',
          boxShadow: '0 10px 25px -5px rgba(2, 6, 23, 0.4)'
        }}
      >
        {/* Subtle decorative background glow */}
        <div style={{
          position: 'absolute',
          top: '-40px',
          right: '-40px',
          width: '220px',
          height: '220px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(56, 189, 248, 0.2) 0%, transparent 70%)',
          pointerEvents: 'none'
        }} />

        <div style={{
          position: 'relative',
          zIndex: 2,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span style={{
                fontSize: '11px',
                fontWeight: 800,
                color: '#38bdf8',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                background: 'rgba(56, 189, 248, 0.15)',
                padding: '3px 9px',
                borderRadius: '6px'
              }}>
                Driver Cockpit
              </span>
              <span style={{ color: '#64748b' }}>•</span>
              <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                ID: <strong style={{ color: '#f8fafc' }}>{driver.id || 'DRV-14'}</strong>
              </span>
              <span style={{ color: '#64748b' }}>•</span>
              <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                Hub: <strong style={{ color: '#f8fafc' }}>{driver.city || 'Gurgaon Operations Hub'}</strong>
              </span>
            </div>

            <h1 style={{
              fontSize: '24px',
              fontWeight: 850,
              margin: '0 0 6px',
              letterSpacing: '-0.3px',
              color: '#ffffff'
            }}>
              Welcome to Your Shift, {driver.name || 'Driver'}! 👋
            </h1>

            <p style={{
              fontSize: '13px',
              color: '#cbd5e1',
              margin: 0,
              maxWidth: '620px',
              lineHeight: 1.5
            }}>
              {isTodaySwapped ? (
                <>
                  ⚡ Operating Today's Allocated Car: <strong style={{ color: '#fef08a' }}>{vehicle.registration}</strong> ({vehicle.model || 'TATA TIGOR EV'}).
                  <span style={{ display: 'block', fontSize: '11.5px', color: '#94a3b8', marginTop: '2px' }}>
                    Reason: {todayVehicle.reason || 'Admin shift allocation'} · Regular Contract Car: {driver.vehicle?.registration || '—'}
                  </span>
                </>
              ) : (
                <>
                  Assigned to <strong>{vehicle.registration || 'DL52GD6605'}</strong> ({vehicle.model || 'Tata Tigor EV Xpress-T'}).
                  Your statutory KYC is verified, and your 3-pocket wallet is active and healthy.
                </>
              )}
            </p>
          </div>

          {/* Quick Action Badges */}
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={onToggleDuty}
              style={{
                background: dutyStatus === 'On Duty' ? '#16a34a' : '#d97706',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                padding: '10px 16px',
                fontSize: '13px',
                fontWeight: 750,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.25)'
              }}
            >
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ffffff' }} />
              <span>Status: {dutyStatus}</span>
            </button>

            <button
              type="button"
              onClick={() => onNavigate('wallet')}
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                color: '#ffffff',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '8px',
                padding: '10px 16px',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                backdropFilter: 'blur(5px)'
              }}
            >
              <CreditCard size={15} />
              <span>Wallet: ₹{(wallet.spendableBalance || 0).toLocaleString('en-IN')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Top 5 Key Metric KPI Cards */}
      <div className="driver-kpis-grid" style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
        gap: '14px'
      }}>
        {/* KPI 1: Gross Shift Earnings */}
        <div style={{
          background: '#ffffff',
          borderRadius: '12px',
          padding: '16px 18px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          position: 'relative'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 750, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Today's Gross Fares
            </span>
            <div style={{ width: '28px', height: '28px', borderRadius: '7px', background: '#ecfdf5', color: '#059669', display: 'grid', placeItems: 'center' }}>
              <TrendingUp size={15} />
            </div>
          </div>
          <div style={{ fontSize: '24px', fontWeight: 850, color: '#0f172a', marginBottom: '4px' }}>
            {driver.todayGross || '₹0'}
          </div>
          <div style={{ fontSize: '11.5px', color: '#10b981', fontWeight: 650 }}>
            {driver.todayTrips || 0} Trips Completed · Shift Target: 12
          </div>
        </div>

        {/* KPI 2: Spendable Wallet */}
        <div style={{
          background: '#ffffff',
          borderRadius: '12px',
          padding: '16px 18px',
          border: '1.5px solid #bfdbfe',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          cursor: 'pointer'
        }}
        onClick={() => onNavigate('wallet')}
        title="Click to view wallet breakdown"
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '11px', color: '#1e40af', fontWeight: 750, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Spendable Wallet
            </span>
            <div style={{ width: '28px', height: '28px', borderRadius: '7px', background: '#eff6ff', color: '#2563eb', display: 'grid', placeItems: 'center' }}>
              <CreditCard size={15} />
            </div>
          </div>
          <div style={{ fontSize: '24px', fontWeight: 850, color: '#1d4ed8', marginBottom: '4px' }}>
            ₹{(wallet.spendableBalance || 0).toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '11.5px', color: '#16a34a', fontWeight: 650 }}>
            ✓ Healthy · Dues Cleared (₹0)
          </div>
        </div>

        {/* KPI 3: Allocated Vehicle Asset */}
        <div style={{
          background: '#ffffff',
          borderRadius: '12px',
          padding: '16px 18px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          cursor: 'pointer'
        }}
        onClick={() => onNavigate('vehicle')}
        title="Click to view vehicle telemetry"
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 750, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Allocated Car
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              {isTodaySwapped && (
                <span style={{
                  fontSize: '9px',
                  background: '#fef3c7',
                  color: '#b45309',
                  padding: '2px 5px',
                  borderRadius: '4px',
                  fontWeight: 800,
                  border: '1px solid #fde68a'
                }}>
                  TODAY
                </span>
              )}
              <div style={{ width: '28px', height: '28px', borderRadius: '7px', background: '#f0fdf4', color: '#16a34a', display: 'grid', placeItems: 'center' }}>
                <Car size={15} />
              </div>
            </div>
          </div>
          <div style={{ fontSize: '20px', fontWeight: 850, color: '#0f172a', marginBottom: '4px', letterSpacing: '0.5px' }}>
            {vehicle.registration || 'DL52GD6605'}
          </div>
          <div style={{ fontSize: '11.5px', color: '#0284c7', fontWeight: 650 }}>
            {vehicle.type || 'EV'} Fleet · {deal.rate || '₹1,000 / day'}
          </div>
        </div>

        {/* KPI 4: Statutory KYC Badges */}
        <div style={{
          background: '#ffffff',
          borderRadius: '12px',
          padding: '16px 18px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          cursor: 'pointer'
        }}
        onClick={() => onNavigate('kyc')}
        title="Click to open KYC badge hub"
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 750, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Statutory KYC
            </span>
            <div style={{ width: '28px', height: '28px', borderRadius: '7px', background: '#ecfdf5', color: '#059669', display: 'grid', placeItems: 'center' }}>
              <Shield size={15} />
            </div>
          </div>
          <div style={{ fontSize: '24px', fontWeight: 850, color: '#16a34a', marginBottom: '4px' }}>
            3 of 3 Badges
          </div>
          <div style={{ fontSize: '11.5px', color: '#64748b', fontWeight: 650 }}>
            UIDAI · Commercial DL · PAN
          </div>
        </div>

        {/* KPI 5: Shift Punctuality */}
        <div style={{
          background: '#ffffff',
          borderRadius: '12px',
          padding: '16px 18px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 750, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Punctuality Score
            </span>
            <div style={{ width: '28px', height: '28px', borderRadius: '7px', background: '#eff6ff', color: '#0284c7', display: 'grid', placeItems: 'center' }}>
              <Clock size={15} />
            </div>
          </div>
          <div style={{ fontSize: '24px', fontWeight: 850, color: '#0f172a', marginBottom: '4px' }}>
            {attendance.punctuality || '100%'}
          </div>
          <div style={{ fontSize: '11.5px', color: '#0284c7', fontWeight: 650 }}>
            Grade A Fleet · {attendance.presentDays || 1} Present Day
          </div>
        </div>
      </div>

      {/* 3. Main 2-Column Responsive Operational Grid */}
      <div className="driver-ops-grid" style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))',
        gap: '20px'
      }}>
        {/* ================= LEFT COLUMN ================= */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Card A: Active Vehicle & Telematics */}
          <div style={{
            background: '#ffffff',
            borderRadius: '14px',
            border: '1px solid #e2e8f0',
            padding: '20px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '16px',
              paddingBottom: '12px',
              borderBottom: '1px solid #f1f5f9'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '34px', height: '34px', borderRadius: '8px', background: '#eff6ff', color: '#0284c7', display: 'grid', placeItems: 'center' }}>
                  <Car size={18} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: '#0f172a' }}>
                    Active Vehicle Telematics & Asset
                  </h3>
                  <span style={{ fontSize: '11.5px', color: '#64748b' }}>
                    Handover status and onboard system telemetry
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {isTodaySwapped && (
                  <span style={{
                    background: '#fef3c7',
                    color: '#92400e',
                    padding: '4px 9px',
                    borderRadius: '6px',
                    fontSize: '11px',
                    fontWeight: 750,
                    border: '1px solid #fde68a'
                  }}>
                    ⚡ Today's Shift Swap
                  </span>
                )}
                <span style={{
                  background: '#dcfce7',
                  color: '#15803d',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: 750
                }}>
                  ✓ Handover Active
                </span>
              </div>
            </div>

            {/* Vehicle Card Body */}
            <div style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '10px',
              padding: '16px',
              marginBottom: '14px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <div>
                  <span style={{
                    fontSize: '17px',
                    fontWeight: 900,
                    letterSpacing: '1px',
                    color: '#0f172a',
                    background: '#ffffff',
                    padding: '4px 10px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    display: 'inline-block'
                  }}>
                    {vehicle.registration || 'DL52GD6605'}
                  </span>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#334155', marginTop: '6px' }}>
                    {vehicle.model || 'TATA TIGOR EV XPRESS T'}
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <span style={{
                    background: '#e0f2fe',
                    color: '#0369a1',
                    padding: '3px 8px',
                    borderRadius: '5px',
                    fontSize: '11px',
                    fontWeight: 750
                  }}>
                    {vehicle.type || 'EV Commercial'}
                  </span>
                  <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
                    Dedicated 24-Hour
                  </div>
                </div>
              </div>

              {/* EV Battery / Fuel Bar */}
              <div style={{ marginBottom: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', fontWeight: 700, marginBottom: '4px' }}>
                  <span style={{ color: '#475569' }}>Traction Battery State of Charge (SoC)</span>
                  <span style={{ color: '#059669' }}>84% • ~168 km Range</span>
                </div>
                <div style={{ width: '100%', height: '8px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: '84%', height: '100%', background: 'linear-gradient(90deg, #10b981, #059669)', borderRadius: '4px' }} />
                </div>
              </div>

              {/* Sub-specs */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', paddingTop: '8px', borderTop: '1px solid #e2e8f0' }}>
                <div>
                  <span style={{ fontSize: '10px', color: '#64748b', display: 'block', textTransform: 'uppercase', fontWeight: 700 }}>GPS Telematics</span>
                  <strong style={{ fontSize: '12px', color: '#16a34a' }}>● Online & Live</strong>
                </div>
                <div>
                  <span style={{ fontSize: '10px', color: '#64748b', display: 'block', textTransform: 'uppercase', fontWeight: 700 }}>Odometer</span>
                  <strong style={{ fontSize: '12px', color: '#0f172a' }}>24,850 km</strong>
                </div>
                <div>
                  <span style={{ fontSize: '10px', color: '#64748b', display: 'block', textTransform: 'uppercase', fontWeight: 700 }}>Operating Hub</span>
                  <strong style={{ fontSize: '12px', color: '#0284c7' }}>Gurgaon Terminal</strong>
                </div>
              </div>
            </div>

            {/* Pre-Trip Inspection Accordion */}
            <div style={{ border: '1px solid #e2e8f0', borderRadius: '9px', padding: '12px', marginBottom: '12px' }}>
              <div
                onClick={() => setChecklistOpen(!checklistOpen)}
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CheckCircle2 size={16} className={allChecksPassed ? 'text-green' : 'text-amber'} />
                  <strong style={{ fontSize: '12.5px', color: '#0f172a' }}>
                    Pre-Shift Safety Inspection Checklist
                  </strong>
                </div>
                <span style={{ fontSize: '11px', color: '#0284c7', fontWeight: 700 }}>
                  {checklistOpen ? 'Hide ▲' : 'Inspect (5/5 OK) ▼'}
                </span>
              </div>

              {checklistOpen && (
                <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid #f1f5f9', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {[
                    { key: 'tyres', label: 'Tyre Pressure & Tread Condition' },
                    { key: 'brakes', label: 'Brake Pedal & Handbrake Engagement' },
                    { key: 'lights', label: 'Headlights, Indicators & Brake Lamps' },
                    { key: 'battery', label: 'High Voltage Battery & Charging Port Lock' },
                    { key: 'cleanliness', label: 'Interior Passenger Sanitization & AC' }
                  ].map((chk) => (
                    <label key={chk.key} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#334155', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={checklist[chk.key]}
                        onChange={() => toggleCheck(chk.key)}
                        style={{ accentColor: '#16a34a', width: '15px', height: '15px' }}
                      />
                      <span>{chk.label}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                onClick={() => onNavigate('vehicle')}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  background: '#f1f5f9',
                  border: '1px solid #cbd5e1',
                  borderRadius: '7px',
                  color: '#0f172a',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Full Vehicle Specs & Documents
              </button>
            </div>
          </div>

          {/* Card B: 3-Pocket Smart Wallet */}
          <div style={{
            background: '#ffffff',
            borderRadius: '14px',
            border: '1px solid #e2e8f0',
            padding: '20px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '16px',
              paddingBottom: '12px',
              borderBottom: '1px solid #f1f5f9'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '34px', height: '34px', borderRadius: '8px', background: '#eff6ff', color: '#2563eb', display: 'grid', placeItems: 'center' }}>
                  <CreditCard size={18} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: '#0f172a' }}>
                    Smart 3-Pocket Driver Wallet
                  </h3>
                  <span style={{ fontSize: '11.5px', color: '#64748b' }}>
                    Spendable balance, holds & automated rental settlements
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => onNavigate('wallet')}
                style={{
                  background: '#f1f5f9',
                  color: '#1d4ed8',
                  border: '1px solid #bfdbfe',
                  borderRadius: '6px',
                  padding: '5px 12px',
                  fontSize: '11.5px',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                View Smart Wallet →
              </button>
            </div>

            {/* 3-Pocket Triplet Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '14px' }}>
              <div style={{ background: '#eff6ff', border: '1.5px solid #bfdbfe', borderRadius: '9px', padding: '12px 10px' }}>
                <span style={{ fontSize: '10px', color: '#1e40af', fontWeight: 750, textTransform: 'uppercase', display: 'block', marginBottom: '2px' }}>
                  Spendable
                </span>
                <strong style={{ fontSize: '18px', color: '#1d4ed8' }}>
                  ₹{(wallet.spendableBalance || 0).toLocaleString('en-IN')}
                </strong>
                <span style={{ fontSize: '10px', color: '#2563eb', display: 'block', marginTop: '2px' }}>
                  Ready to withdraw
                </span>
              </div>

              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '9px', padding: '12px 10px' }}>
                <span style={{ fontSize: '10px', color: '#64748b', fontWeight: 750, textTransform: 'uppercase', display: 'block', marginBottom: '2px' }}>
                  Posted Balance
                </span>
                <strong style={{ fontSize: '18px', color: '#0f172a' }}>
                  ₹{(wallet.postedBalance || 0).toLocaleString('en-IN')}
                </strong>
                <span style={{ fontSize: '10px', color: '#64748b', display: 'block', marginTop: '2px' }}>
                  Total on deposit
                </span>
              </div>

              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '9px', padding: '12px 10px' }}>
                <span style={{ fontSize: '10px', color: '#64748b', fontWeight: 750, textTransform: 'uppercase', display: 'block', marginBottom: '2px' }}>
                  Active Holds
                </span>
                <strong style={{ fontSize: '18px', color: wallet.activeHolds > 0 ? '#ea580c' : '#16a34a' }}>
                  ₹{(wallet.activeHolds || 0).toLocaleString('en-IN')}
                </strong>
                <span style={{ fontSize: '10px', color: '#64748b', display: 'block', marginTop: '2px' }}>
                  {wallet.activeHolds > 0 ? 'Pending toll/fine' : 'No active holds'}
                </span>
              </div>
            </div>

            {/* Recent Transactions List */}
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '9px', padding: '10px 12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '11px', fontWeight: 750, color: '#475569', textTransform: 'uppercase' }}>
                  Recent Transactions
                </span>
                <span style={{ fontSize: '11px', color: '#0284c7', fontWeight: 700, cursor: 'pointer' }} onClick={() => onNavigate('wallet')}>
                  Full Ledger →
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {(wallet.recentTransactions || [
                  { id: 'WTX-5767', date: '18 Nov, 06:36 AM', type: 'Wallet Top-up', amount: '+₹2,000', method: 'UPI' },
                  { id: 'WTX-INV-0083', date: '18 Nov, 06:34 AM', type: 'Invoice Auto-Debit', amount: '-₹1,000', method: 'Daily Rent' }
                ]).slice(0, 3).map((tx, idx) => (
                  <div key={tx.id || idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', padding: '4px 0', borderBottom: idx < 2 ? '1px solid #f1f5f9' : 'none' }}>
                    <div>
                      <strong style={{ color: '#0f172a', display: 'block' }}>{tx.type}</strong>
                      <span style={{ fontSize: '10px', color: '#64748b' }}>{tx.date} • {tx.method}</span>
                    </div>
                    <span style={{ fontWeight: 800, color: tx.amount?.startsWith('+') ? '#16a34a' : '#b91c1c' }}>
                      {tx.amount}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ================= RIGHT COLUMN ================= */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Card C: Statutory KYC Badges */}
          <div style={{
            background: '#ffffff',
            borderRadius: '14px',
            border: '1px solid #e2e8f0',
            padding: '20px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '16px',
              paddingBottom: '12px',
              borderBottom: '1px solid #f1f5f9'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '34px', height: '34px', borderRadius: '8px', background: '#ecfdf5', color: '#059669', display: 'grid', placeItems: 'center' }}>
                  <Shield size={18} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: '#0f172a' }}>
                    My Statutory KYC Verification Badges
                  </h3>
                  <span style={{ fontSize: '11.5px', color: '#64748b' }}>
                    Government verified identity credentials
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => onNavigate('kyc')}
                style={{
                  background: '#f1f5f9',
                  color: '#0f172a',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  padding: '5px 10px',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                View KYC Hub →
              </button>
            </div>

            {/* Badges List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '14px' }}>
              {/* Badge 1: Commercial DL */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '10px 12px',
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '8px'
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <strong style={{ fontSize: '12.5px', color: '#0f172a' }}>Commercial Driving Licence</strong>
                    <span style={{ background: '#dcfce7', color: '#15803d', fontSize: '9.5px', padding: '1px 5px', borderRadius: '4px', fontWeight: 700 }}>
                      ✓ Verified
                    </span>
                  </div>
                  <span style={{ fontSize: '11px', color: '#64748b', display: 'block', marginTop: '2px' }}>
                    Number: <strong className="font-mono">{kyc.drivingLicence || 'DFGH76214+675'}</strong> · Valid until {kyc.dlExpiry || '2030-11-14'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => onNavigate('kyc')}
                  style={{ background: 'none', border: 'none', color: '#0284c7', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}
                >
                  Download DL
                </button>
              </div>

              {/* Badge 2: UIDAI Aadhaar */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '10px 12px',
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '8px'
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <strong style={{ fontSize: '12.5px', color: '#0f172a' }}>UIDAI Aadhaar Card</strong>
                    <span style={{ background: '#dcfce7', color: '#15803d', fontSize: '9.5px', padding: '1px 5px', borderRadius: '4px', fontWeight: 700 }}>
                      ✓ Biometric Verified
                    </span>
                  </div>
                  <span style={{ fontSize: '11px', color: '#64748b', display: 'block', marginTop: '2px' }}>
                    Number: <strong className="font-mono">{kyc.aadhaar || 'XXXX-XXXX-9821'}</strong> · UIDAI Central Auth
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => onNavigate('kyc')}
                  style={{ background: 'none', border: 'none', color: '#0284c7', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}
                >
                  Download Card
                </button>
              </div>

              {/* Badge 3: Income Tax PAN */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '10px 12px',
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '8px'
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <strong style={{ fontSize: '12.5px', color: '#0f172a' }}>Income Tax PAN Card</strong>
                    <span style={{ background: '#dcfce7', color: '#15803d', fontSize: '9.5px', padding: '1px 5px', borderRadius: '4px', fontWeight: 700 }}>
                      ✓ NSDL Active
                    </span>
                  </div>
                  <span style={{ fontSize: '11px', color: '#64748b', display: 'block', marginTop: '2px' }}>
                    Number: <strong className="font-mono">{kyc.panCard || 'ABCV1234R'}</strong> · Tax Compliance Clear
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => onNavigate('kyc')}
                  style={{ background: 'none', border: 'none', color: '#0284c7', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}
                >
                  Download PAN
                </button>
              </div>

              {/* Badge 4: Police Verification */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '10px 12px',
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '8px'
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <strong style={{ fontSize: '12.5px', color: '#0f172a' }}>Police Verification</strong>
                    <span style={{ background: '#fef3c7', color: '#b45309', fontSize: '9.5px', padding: '1px 5px', borderRadius: '4px', fontWeight: 700 }}>
                      {kyc.policeVerification || 'In Verification'}
                    </span>
                  </div>
                  <span style={{ fontSize: '11px', color: '#64748b', display: 'block', marginTop: '2px' }}>
                    Jurisdiction: District Police Commissionerate · No Adverse Incident
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => onNavigate('kyc')}
                  style={{ background: 'none', border: 'none', color: '#0284c7', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}
                >
                  View Report
                </button>
              </div>
            </div>
          </div>

          {/* Card E: Emergency Hub Escalation Box */}
          <div style={{
            background: '#ffffff',
            borderRadius: '14px',
            border: '1px solid #fecaca',
            padding: '18px 20px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#fee2e2', color: '#dc2626', display: 'grid', placeItems: 'center' }}>
                <Phone size={16} />
              </div>
              <div>
                <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 800, color: '#991b1b' }}>
                  24/7 Operations Hub & Emergency Reference
                </h4>
                <span style={{ fontSize: '11px', color: '#64748b' }}>
                  Gurgaon Terminal Dispatch Supervisor on Duty
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f1f5f9' }}>
                <span style={{ color: '#64748b' }}>Hub Central Desk:</span>
                <strong style={{ color: '#0284c7' }}>+91 98187 78654</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f1f5f9' }}>
                <span style={{ color: '#64748b' }}>Emergency Contact:</span>
                <strong style={{ color: '#dc2626' }}>{kyc.emergencyContact || '7986451320 (Brother)'}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0' }}>
                <span style={{ color: '#64748b' }}>Guarantor Reference:</span>
                <strong style={{ color: '#0f172a' }}>{kyc.reference?.name || 'Suresh Verma'} ({kyc.reference?.phone || '98101 88990'})</strong>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
