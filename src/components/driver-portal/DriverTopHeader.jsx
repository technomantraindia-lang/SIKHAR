import React, { useState, useEffect } from 'react';
import {
  Menu,
  Clock,
  RefreshCw,
  AlertTriangle,
  LogOut,
  Shield,
  Car,
  Bell,
  CheckCircle2,
  Phone
} from '../common/Icons';

export default function DriverTopHeader({
  activeRoute,
  driverUser,
  dutyStatus,
  onToggleDuty,
  onRefresh,
  refreshing,
  onOpenMobileMenu,
  onSelectRoute,
  onLogout
}) {
  const driver = driverUser || {};
  const [timeStr, setTimeStr] = useState('');
  const [showSosModal, setShowSosModal] = useState(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString('en-IN', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const routeTitles = {
    overview: 'Dashboard Overview',
    kyc: 'KYC & Document Locker',
    documents: 'KYC & Document Locker',
    wallet: '3-Pocket Smart Wallet',
    invoices: 'Rental Invoices',
    vehicle: 'Allocated Vehicle Asset',
    shifts: 'Attendance & Shift Logs',
    support: '24/7 Hub Help & SOS'
  };

  const currentTitle = routeTitles[activeRoute] || 'Driver Cockpit';

  return (
    <>
      <header
        style={{
          background: '#ffffff',
          borderBottom: '1px solid #e2e8f0',
          padding: '10px 20px',
          position: 'sticky',
          top: 0,
          zIndex: 100,
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)'
        }}
      >
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '14px'
        }}>
          {/* Left: Hamburger & Breadcrumbs */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              type="button"
              onClick={onOpenMobileMenu}
              className="driver-hamburger-btn"
              style={{
                background: '#f1f5f9',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '7px 9px',
                cursor: 'pointer',
                display: 'none',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#0f172a'
              }}
              title="Open Navigation Menu"
            >
              <Menu size={18} />
            </button>

            <div>
              <div style={{
                fontSize: '11px',
                color: '#64748b',
                fontWeight: 650,
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
              }}>
                <span>Driver Console</span>
                <span>/</span>
                <span style={{ color: '#0284c7', fontWeight: 700 }}>{currentTitle}</span>
              </div>
              <h1 style={{
                fontSize: '17px',
                fontWeight: 800,
                color: '#0f172a',
                margin: 0,
                letterSpacing: '-0.2px'
              }}>
                {currentTitle}
              </h1>
            </div>
          </div>

          {/* Center: Shift & Assigned Vehicle Pill (Desktop) */}
          <div className="driver-header-center-shift" style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            padding: '5px 12px',
            borderRadius: '20px'
          }}>
            <span style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: dutyStatus === 'On Duty' ? '#16a34a' : '#d97706',
              boxShadow: dutyStatus === 'On Duty' ? '0 0 6px #16a34a' : 'none'
            }} />
            <span style={{ fontSize: '11.5px', color: '#334155', fontWeight: 650 }}>
              Shift: <strong>07:00 AM - 07:00 PM</strong>
            </span>
            <span style={{ color: '#cbd5e1' }}>•</span>
            <span style={{ fontSize: '11.5px', color: '#0284c7', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
              {driver.todayVehicle?.registration ? (
                <>
                  <span>{driver.todayVehicle.registration}</span>
                  <span style={{
                    fontSize: '9.5px',
                    background: '#fef3c7',
                    color: '#b45309',
                    padding: '1px 6px',
                    borderRadius: '4px',
                    fontWeight: 800,
                    letterSpacing: '0.4px',
                    border: '1px solid #fde68a'
                  }}>
                    TODAY'S CAR
                  </span>
                </>
              ) : (
                <span>{driver.vehicle?.registration || 'DL52GD6605'}</span>
              )}
            </span>
          </div>

          {/* Right: Actions, Live Clock, Duty Status & SOS */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {/* Live IST Clock */}
            <div className="hide-on-mobile" style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              fontSize: '11.5px',
              fontWeight: 650,
              color: '#475569',
              background: '#f8fafc',
              padding: '6px 10px',
              borderRadius: '7px',
              border: '1px solid #e2e8f0'
            }}>
              <Clock size={13} className="text-muted" />
              <span className="font-mono">{timeStr || '12:00 PM'}</span>
            </div>

            {/* Quick Duty Status Toggle Button */}
            <button
              type="button"
              onClick={onToggleDuty}
              title="Toggle Duty Status"
              style={{
                background: dutyStatus === 'On Duty' ? '#dcfce7' : '#fef3c7',
                color: dutyStatus === 'On Duty' ? '#15803d' : '#b45309',
                border: `1px solid ${dutyStatus === 'On Duty' ? '#86efac' : '#fcd34d'}`,
                padding: '6px 12px',
                borderRadius: '7px',
                fontSize: '12px',
                fontWeight: 750,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.15s ease'
              }}
            >
              <span style={{
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                background: dutyStatus === 'On Duty' ? '#16a34a' : '#d97706',
                boxShadow: dutyStatus === 'On Duty' ? '0 0 6px #16a34a' : 'none'
              }} />
              <span>{dutyStatus}</span>
            </button>

            {/* Emergency SOS Button */}
            <button
              type="button"
              onClick={() => setShowSosModal(true)}
              style={{
                background: '#fee2e2',
                color: '#dc2626',
                border: '1px solid #fca5a5',
                padding: '6px 11px',
                borderRadius: '7px',
                fontSize: '12px',
                fontWeight: 750,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                boxShadow: '0 1px 3px rgba(220, 38, 38, 0.15)'
              }}
              title="Immediate Emergency / Roadside SOS"
            >
              <AlertTriangle size={13} />
              <span className="hide-on-mobile">SOS Help</span>
            </button>

            {/* Telemetry Sync Button */}
            <button
              type="button"
              onClick={onRefresh}
              style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '7px',
                padding: '7px',
                color: '#475569',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              title="Refresh telemetry"
            >
              <RefreshCw size={14} className={refreshing ? 'spinning-icon' : ''} />
            </button>

            {/* Profile Avatar Pill */}
            <div
              onClick={() => onSelectRoute('kyc')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '3px 8px 3px 4px',
                background: '#f1f5f9',
                borderRadius: '20px',
                border: '1px solid #e2e8f0',
                cursor: 'pointer'
              }}
              title="View Driver Profile"
            >
              <div style={{
                width: '26px',
                height: '26px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #1d4ed8, #2563eb)',
                color: '#ffffff',
                fontWeight: 800,
                fontSize: '11px',
                display: 'grid',
                placeItems: 'center'
              }}>
                {driver.name ? driver.name.charAt(0).toUpperCase() : 'D'}
              </div>
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#0f172a' }} className="hide-on-mobile">
                {driver.name || 'Driver'}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Emergency SOS Modal */}
      {showSosModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(4px)',
          display: 'grid',
          placeItems: 'center',
          zIndex: 2000,
          padding: '20px'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '14px',
            maxWidth: '460px',
            width: '100%',
            padding: '24px',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
            border: '2px solid #ef4444'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
              <div style={{
                width: '44px',
                height: '44px',
                borderRadius: '50%',
                background: '#fee2e2',
                color: '#dc2626',
                display: 'grid',
                placeItems: 'center'
              }}>
                <AlertTriangle size={24} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#991b1b' }}>
                  Emergency Roadside & Hub SOS
                </h3>
                <span style={{ fontSize: '12px', color: '#64748b' }}>
                  Dedicated 24/7 Sikhar Fleet Support
                </span>
              </div>
            </div>

            <p style={{ fontSize: '13px', color: '#334155', lineHeight: 1.5, marginBottom: '18px' }}>
              If you have experienced an accident, vehicle breakdown, or medical emergency, contact your operating terminal or fleet dispatch immediately:
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
              <a
                href="tel:9818778654"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 14px',
                  background: '#f8fafc',
                  border: '1.5px solid #cbd5e1',
                  borderRadius: '9px',
                  textDecoration: 'none',
                  color: '#0f172a'
                }}
              >
                <div>
                  <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 700 }}>
                    CENTRAL FLEET DISPATCH (HUB 1)
                  </div>
                  <strong style={{ fontSize: '15px', color: '#0284c7' }}>+91 98187 78654</strong>
                </div>
                <span style={{
                  background: '#0284c7',
                  color: '#ffffff',
                  padding: '5px 12px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 700
                }}>
                  Call Now
                </span>
              </a>

              <a
                href="tel:18001024444"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 14px',
                  background: '#fef2f2',
                  border: '1.5px solid #fca5a5',
                  borderRadius: '9px',
                  textDecoration: 'none',
                  color: '#0f172a'
                }}
              >
                <div>
                  <div style={{ fontSize: '11px', color: '#991b1b', fontWeight: 700 }}>
                    24/7 ROADSIDE BREAKDOWN / CRANE
                  </div>
                  <strong style={{ fontSize: '15px', color: '#dc2626' }}>1800-102-4444</strong>
                </div>
                <span style={{
                  background: '#dc2626',
                  color: '#ffffff',
                  padding: '5px 12px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 700
                }}>
                  Call Toll-Free
                </span>
              </a>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setShowSosModal(false)}
                style={{
                  padding: '8px 18px',
                  background: '#e2e8f0',
                  border: 'none',
                  borderRadius: '7px',
                  color: '#334155',
                  fontSize: '13px',
                  fontWeight: 650,
                  cursor: 'pointer'
                }}
              >
                Close Window
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
