import React from 'react';
import {
  Car,
  CheckCircle2,
  RefreshCw
} from '../common/Icons';

export default function DriverVehicleView({ driverUser, onRefresh, refreshing }) {
  const driver = driverUser || {};
  
  // Detect if Admin has assigned a replacement or temporary vehicle for today
  const todayVehicle = driver.todayVehicle || (driver.temporaryAssignment?.isTemporary ? {
    registration: driver.temporaryAssignment.assignedVehicle?.registration,
    model: driver.temporaryAssignment.assignedVehicle?.model,
    type: driver.temporaryAssignment.assignedVehicle?.type,
    reason: driver.temporaryAssignment.reason,
    durationDays: driver.temporaryAssignment.durationDays,
    assignedAt: driver.temporaryAssignment.startDate
  } : null);

  const isTodayChanged = Boolean(todayVehicle && todayVehicle.registration);

  const regularVehicle = driver.vehicle || {
    registration: 'DL52GD6605',
    model: 'TATA TIGOR EV XPRESS T',
    type: 'EV',
    status: 'Active'
  };

  // Active vehicle currently operated by the driver today
  const activeVehicle = isTodayChanged ? {
    registration: todayVehicle.registration,
    model: todayVehicle.model || 'TATA TIGOR EV XPRESS T',
    type: todayVehicle.type || 'EV',
    status: 'Active (Today\'s Shift Replacement)'
  } : regularVehicle;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      
      {/* 1. Only show banner IF Admin changed the car for today */}
      {isTodayChanged && (
        <div style={{
          background: '#fffbeb',
          border: '1px solid #fde68a',
          borderRadius: '10px',
          padding: '12px 16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '10px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '18px' }}>⚡</span>
            <div>
              <strong style={{ fontSize: '13.5px', color: '#92400e' }}>
                Admin Changed Vehicle for Today: {todayVehicle.registration} ({todayVehicle.model})
              </strong>
              <span style={{ display: 'block', fontSize: '12px', color: '#b45309', marginTop: '2px' }}>
                Reason: {todayVehicle.reason || 'Shift temporary replacement'} · Regular Contract Car: {regularVehicle.registration}
              </span>
            </div>
          </div>

          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              disabled={refreshing}
              style={{
                background: '#ffffff',
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                padding: '5px 10px',
                fontSize: '11.5px',
                fontWeight: 650,
                color: '#475569',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px'
              }}
            >
              <RefreshCw size={12} className={refreshing ? 'animate-spin' : ''} />
              {refreshing ? 'Syncing...' : 'Sync Status'}
            </button>
          )}
        </div>
      )}

      {/* 2. Clean Primary Vehicle Card */}
      <div style={{
        background: '#ffffff',
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
        padding: '20px 22px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <span style={{
              fontSize: '10.5px',
              fontWeight: 750,
              color: isTodayChanged ? '#b45309' : '#0284c7',
              background: isTodayChanged ? '#fef3c7' : '#eff6ff',
              padding: '2px 8px',
              borderRadius: '4px',
              textTransform: 'uppercase',
              letterSpacing: '0.04em'
            }}>
              {isTodayChanged ? "Today's Allocated Car" : "Allocated Fleet Asset"}
            </span>
            <span style={{
              fontSize: '11.5px',
              color: '#16a34a',
              fontWeight: 650,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px'
            }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#16a34a' }} />
              {activeVehicle.status || 'Active on Road'}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', flexWrap: 'wrap' }}>
            <h1 style={{
              fontSize: '26px',
              fontWeight: 900,
              margin: 0,
              color: '#0f172a',
              fontFamily: 'monospace',
              letterSpacing: '0.5px'
            }}>
              {activeVehicle.registration}
            </h1>
            <span style={{ fontSize: '15px', color: '#475569', fontWeight: 650 }}>
              {activeVehicle.model}
            </span>
            <span style={{
              fontSize: '11px',
              background: '#f1f5f9',
              color: '#334155',
              padding: '2px 7px',
              borderRadius: '4px',
              fontWeight: 650
            }}>
              {activeVehicle.type || 'EV'}
            </span>
          </div>

          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '6px' }}>
            Hub: <strong>{driver.city || 'Gurgaon Operations Hub'}</strong> · Shift: <strong>{driver.shift || '07:00 AM - 07:00 PM'}</strong>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <div style={{
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            padding: '10px 16px',
            textAlign: 'center'
          }}>
            <span style={{ fontSize: '10.5px', color: '#64748b', display: 'block', fontWeight: 650 }}>
              {activeVehicle.type === 'CNG' ? 'CNG Level' : 'Battery'}
            </span>
            <strong style={{ fontSize: '18px', color: '#16a34a' }}>84%</strong>
            <span style={{ fontSize: '10.5px', color: '#64748b', display: 'block' }}>~168 km</span>
          </div>
        </div>
      </div>

      {/* 3. Essential Vehicle Specs (Clean Minimal Grid) */}
      <div style={{
        background: '#ffffff',
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
        padding: '20px 22px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
      }}>
        <h3 style={{ margin: '0 0 14px', fontSize: '14px', fontWeight: 750, color: '#0f172a' }}>
          Vehicle Information & Certificates
        </h3>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '10px'
        }}>
          {[
            { label: 'Vehicle Number', val: activeVehicle.registration, badge: isTodayChanged ? "Today's Car" : 'Assigned' },
            { label: 'Model', val: activeVehicle.model, badge: activeVehicle.type || 'EV' },
            { label: 'Powertrain', val: activeVehicle.type === 'CNG' ? 'BS-VI CNG' : 'Electric Commercial', badge: 'Commercial' },
            { label: 'Assigned Shift', val: driver.shift || '07:00 AM - 07:00 PM', badge: 'Dedicated' },
            { label: 'Insurance Policy', val: 'Comprehensive Commercial · Valid', badge: 'Active' },
            { label: 'Fitness Certificate', val: 'State Transport RTO · Valid till 2028', badge: 'Clear' }
          ].map((item, idx) => (
            <div
              key={idx}
              style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '10px 12px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <div>
                <span style={{ fontSize: '10px', color: '#64748b', fontWeight: 650, textTransform: 'uppercase', display: 'block' }}>
                  {item.label}
                </span>
                <strong style={{ fontSize: '12.5px', color: '#0f172a' }}>{item.val}</strong>
              </div>
              <span style={{
                fontSize: '10px',
                fontWeight: 650,
                background: '#f1f5f9',
                color: '#475569',
                padding: '2px 6px',
                borderRadius: '4px'
              }}>
                {item.badge}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 4. If vehicle was swapped for today, show simple note */}
      {isTodayChanged && (
        <div style={{
          background: '#ffffff',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          padding: '14px 18px',
          fontSize: '12px',
          color: '#475569',
          lineHeight: 1.5
        }}>
          ℹ️ Your regular master contract car is <strong>{regularVehicle.registration}</strong> ({regularVehicle.model}).
          You are temporarily operating <strong>{todayVehicle.registration}</strong> for today's shift.
          Your daily lease rate and wallet balance remain unaffected.
        </div>
      )}
    </div>
  );
}
