import React from 'react';
import {
  Home,
  Shield,
  FileText,
  CreditCard,
  Receipt,
  Car,
  Clock,
  AlertTriangle,
  LogOut,
  RefreshCw,
  Award,
  ChevronRight,
  Phone,
  CheckCircle2,
  X
} from '../common/Icons';

export default function DriverSidebar({
  activeRoute,
  onSelectRoute,
  driverUser,
  onLogout,
  onToggleDuty,
  dutyStatus,
  onRefresh,
  refreshing,
  isMobileOpen,
  onCloseMobile
}) {
  const driver = driverUser || {};
  const vehicle = driver.vehicle || null;
  const initials = driver.name ? driver.name.charAt(0).toUpperCase() : 'D';

  const menuSections = [
    {
      title: 'MAIN COCKPIT',
      items: [
        { id: 'overview', label: 'Dashboard Overview', icon: Home, badge: null },
        { id: 'kyc', label: 'KYC & Document Locker', icon: Shield, badge: '5 Verified' }
      ]
    },
    {
      title: 'FINANCE & BILLING',
      items: [
        {
          id: 'wallet',
          label: '3-Pocket Smart Wallet',
          icon: CreditCard,
          badge: `₹${(driver.wallet?.spendableBalance || 0).toLocaleString('en-IN')}`
        },
        { id: 'invoices', label: 'Rental Invoices', icon: Receipt, badge: null }
      ]
    },
    {
      title: 'VEHICLE & FLEET',
      items: [
        {
          id: 'vehicle',
          label: 'Allocated Vehicle Asset',
          icon: Car,
          badge: vehicle?.registration || 'Assigned'
        },
        { id: 'shifts', label: 'Attendance & Shift Logs', icon: Clock, badge: '100%' }
      ]
    },
    {
      title: 'ASSISTANCE',
      items: [
        { id: 'support', label: '24/7 Hub Help & SOS', icon: AlertTriangle, badge: 'SOS' }
      ]
    }
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          onClick={onCloseMobile}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(5, 10, 24, 0.75)',
            backdropFilter: 'blur(3px)',
            zIndex: 1040
          }}
        />
      )}

      <aside
        className={`driver-luxury-sidebar ${isMobileOpen ? 'is-mobile-visible' : ''}`}
        style={{
          width: '260px',
          background: 'linear-gradient(180deg, #070e24 0%, #091330 45%, #050a1c 100%)',
          borderRight: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '16px 12px 14px',
          flexShrink: 0,
          position: 'sticky',
          top: 0,
          height: '100vh',
          overflowY: 'auto',
          overflowX: 'hidden',
          zIndex: 1050,
          transition: 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        <div>
          {/* Brand Header */}
          <div style={{
            padding: '4px 6px 14px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            marginBottom: '14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #38bdf8 0%, #1d68f0 100%)',
                display: 'grid',
                placeItems: 'center',
                color: '#060c1d',
                fontWeight: 900,
                fontSize: '15px',
                boxShadow: '0 0 15px rgba(56, 189, 248, 0.4)'
              }}>
                ▲
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span style={{ color: '#ffffff', fontWeight: 850, fontSize: '15px', letterSpacing: '-0.3px' }}>
                    SIKHAR
                  </span>
                  <span style={{ color: '#38bdf8', fontWeight: 800, fontSize: '15px' }}>
                    FLEET
                  </span>
                </div>
                <div style={{
                  fontSize: '9px',
                  fontWeight: 750,
                  color: '#38bdf8',
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  <span>DRIVER CONSOLE</span>
                  <span style={{ color: '#64748b' }}>• HUB #1</span>
                </div>
              </div>
            </div>

            {/* Mobile close button */}
            <button
              type="button"
              onClick={onCloseMobile}
              className="driver-mobile-close-btn"
              style={{
                background: 'rgba(255,255,255,0.08)',
                border: 'none',
                borderRadius: '6px',
                color: '#94a3b8',
                padding: '4px',
                cursor: 'pointer',
                display: 'none'
              }}
            >
              <X size={18} />
            </button>
          </div>

          {/* Driver Live Cockpit Identity Card */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(30, 58, 138, 0.45) 0%, rgba(15, 23, 42, 0.6) 100%)',
            border: '1px solid rgba(56, 189, 248, 0.25)',
            borderRadius: '11px',
            padding: '12px',
            marginBottom: '16px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.25)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
              <div style={{
                position: 'relative',
                width: '38px',
                height: '38px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #1d4ed8, #2563eb)',
                color: '#ffffff',
                display: 'grid',
                placeItems: 'center',
                fontWeight: 800,
                fontSize: '15px',
                border: '1.5px solid #38bdf8',
                boxShadow: '0 0 10px rgba(56, 189, 248, 0.3)'
              }}>
                {initials}
                <span style={{
                  position: 'absolute',
                  bottom: '-1px',
                  right: '-1px',
                  width: '11px',
                  height: '11px',
                  borderRadius: '50%',
                  background: dutyStatus === 'On Duty' ? '#22c55e' : '#f59e0b',
                  border: '2px solid #070e24',
                  boxShadow: dutyStatus === 'On Duty' ? '0 0 8px #22c55e' : 'none'
                }} />
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <strong style={{
                    color: '#ffffff',
                    fontSize: '14px',
                    fontWeight: 700,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    {driver.name || 'Driver'}
                  </strong>
                  <span style={{
                    fontSize: '9.5px',
                    fontWeight: 750,
                    background: 'rgba(56, 189, 248, 0.15)',
                    color: '#38bdf8',
                    padding: '1px 5px',
                    borderRadius: '4px',
                    letterSpacing: '0.04em'
                  }}>
                    {driver.id || 'DRV'}
                  </span>
                </div>
                <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '1px' }}>
                  +91 {driver.phone || '—'}
                </div>
              </div>
            </div>

            {/* Quick Interactive Duty Status Toggle */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '6px 8px',
              background: 'rgba(0, 0, 0, 0.35)',
              borderRadius: '7px',
              border: '1px solid rgba(255, 255, 255, 0.06)'
            }}>
              <span style={{ fontSize: '10.5px', color: '#94a3b8', fontWeight: 650 }}>
                Duty Status
              </span>
              <button
                type="button"
                onClick={onToggleDuty}
                title="Click to toggle On Duty / Off Duty"
                style={{
                  background: dutyStatus === 'On Duty' ? 'rgba(34, 197, 94, 0.18)' : 'rgba(245, 158, 11, 0.18)',
                  color: dutyStatus === 'On Duty' ? '#4ade80' : '#fbbf24',
                  border: `1px solid ${dutyStatus === 'On Duty' ? 'rgba(34, 197, 94, 0.4)' : 'rgba(245, 158, 11, 0.4)'}`,
                  borderRadius: '5px',
                  padding: '2px 8px',
                  fontSize: '10.5px',
                  fontWeight: 750,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  transition: 'all 0.15s ease'
                }}
              >
                <span style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: dutyStatus === 'On Duty' ? '#22c55e' : '#f59e0b',
                  boxShadow: dutyStatus === 'On Duty' ? '0 0 6px #22c55e' : 'none'
                }} />
                <span>{dutyStatus}</span>
              </button>
            </div>

            {/* Assigned Vehicle Quick Tag */}
            {vehicle?.registration && (
              <div style={{
                marginTop: '8px',
                fontSize: '10.5px',
                color: '#cbd5e1',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                padding: '4px 6px',
                background: 'rgba(56, 189, 248, 0.08)',
                borderRadius: '5px'
              }}>
                <Car size={12} className="text-cyan" />
                <span style={{ fontWeight: 700, color: '#38bdf8' }}>{vehicle.registration}</span>
                <span style={{ color: '#64748b' }}>•</span>
                <span style={{ color: '#94a3b8', fontSize: '10px' }}>{vehicle.type || 'EV'}</span>
              </div>
            )}
          </div>

          {/* Navigation Menu Sections */}
          <div className="sidebar-nav-container">
            {menuSections.map((sec) => (
              <div key={sec.title} style={{ marginBottom: '14px' }}>
                <div style={{
                  fontSize: '9.5px',
                  fontWeight: 800,
                  color: '#64748b',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  padding: '0 8px',
                  marginBottom: '5px'
                }}>
                  {sec.title}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                  {sec.items.map((item) => {
                    const IconComp = item.icon;
                    const isActive = activeRoute === item.id;

                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          onSelectRoute(item.id);
                          if (onCloseMobile) onCloseMobile();
                        }}
                        style={{
                          width: '100%',
                          height: '38px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '0 10px',
                          borderRadius: '8px',
                          border: 'none',
                          background: isActive
                            ? 'linear-gradient(90deg, #1d68f0 0%, #1e40af 100%)'
                            : 'transparent',
                          color: isActive ? '#ffffff' : '#94a3b8',
                          fontSize: '12.5px',
                          fontWeight: isActive ? 700 : 550,
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                          boxShadow: isActive ? '0 4px 12px rgba(29, 104, 240, 0.35)' : 'none'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
                          <IconComp
                            size={16}
                            style={{
                              color: isActive ? '#ffffff' : '#64748b',
                              flexShrink: 0
                            }}
                          />
                          <span style={{ textAlign: 'left' }}>{item.label}</span>
                        </div>

                        {item.badge && (
                          <span style={{
                            fontSize: '9.5px',
                            fontWeight: 750,
                            padding: '1px 6px',
                            borderRadius: '4px',
                            background: isActive
                              ? 'rgba(255, 255, 255, 0.25)'
                              : item.badge === 'Verified'
                              ? 'rgba(34, 197, 94, 0.15)'
                              : item.badge === 'SOS'
                              ? 'rgba(239, 68, 68, 0.2)'
                              : 'rgba(255, 255, 255, 0.08)',
                            color: isActive
                              ? '#ffffff'
                              : item.badge === 'Verified'
                              ? '#4ade80'
                              : item.badge === 'SOS'
                              ? '#f87171'
                              : '#94a3b8'
                          }}>
                            {item.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar Footer Controls */}
        <div style={{
          paddingTop: '12px',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}>
          {/* Telemetry live sync button */}
          <button
            type="button"
            onClick={onRefresh}
            style={{
              width: '100%',
              padding: '7px 10px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '7px',
              color: '#cbd5e1',
              fontSize: '11.5px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            <RefreshCw size={13} className={refreshing ? 'spinning-icon' : ''} />
            <span>{refreshing ? 'Syncing Fleet Telemetry...' : 'Sync Live Telemetry'}</span>
          </button>

          {/* Logout button */}
          <button
            type="button"
            onClick={onLogout}
            style={{
              width: '100%',
              padding: '7px 10px',
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              borderRadius: '7px',
              color: '#f87171',
              fontSize: '11.5px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              transition: 'all 0.15s ease'
            }}
          >
            <LogOut size={13} />
            <span>Sign Out Driver Console</span>
          </button>

          <div style={{
            fontSize: '9px',
            color: '#64748b',
            textAlign: 'center',
            marginTop: '2px'
          }}>
            Sikhar Fleet Ops Terminal v2.0
          </div>
        </div>
      </aside>
    </>
  );
}
