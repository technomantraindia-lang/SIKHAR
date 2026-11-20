import React from 'react';
import {
  Clock,
  CheckCircle2,
  Calendar,
  Activity,
  Award,
  TrendingUp,
  MapPin
} from '../common/Icons';

export default function DriverShiftsView({ driverUser }) {
  const driver = driverUser || {};
  const attendance = driver.attendance || {};

  const trips = [
    { id: 'TRP-8821', time: 'Today, 03:15 PM', route: 'DLF Phase 2 → IGI Airport T3, New Delhi', km: 16.8, fare: 420.0, status: 'Completed' },
    { id: 'TRP-8820', time: 'Today, 01:40 PM', route: 'Cyber Hub → Golf Course Ext Road, Gurgaon', km: 11.4, fare: 280.0, status: 'Completed' },
    { id: 'TRP-8818', time: 'Today, 10:20 AM', route: 'Huda City Centre → Aerocity Terminal', km: 14.2, fare: 350.0, status: 'Completed' },
    { id: 'TRP-8815', time: 'Today, 07:45 AM', route: 'Gurgaon Operations Hub → Ambience Mall', km: 8.5, fare: 210.0, status: 'Completed' }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Attendance Stats Cards */}
      <div className="driver-kpis-grid" style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '14px'
      }}>
        <div style={{ background: '#ffffff', borderRadius: '14px', padding: '18px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 750, textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
            Shift Punctuality Score
          </span>
          <div style={{ fontSize: '28px', fontWeight: 900, color: '#16a34a', marginBottom: '4px' }}>
            {attendance.punctuality || '100%'}
          </div>
          <span style={{ fontSize: '12px', color: '#15803d', fontWeight: 650 }}>
            ★ Grade A Tier-1 Driver Rating
          </span>
        </div>

        <div style={{ background: '#ffffff', borderRadius: '14px', padding: '18px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 750, textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
            Days Present This Month
          </span>
          <div style={{ fontSize: '28px', fontWeight: 900, color: '#0f172a', marginBottom: '4px' }}>
            {attendance.presentDays || 1} Days
          </div>
          <span style={{ fontSize: '12px', color: '#64748b' }}>
            Logged In On-Time at Yard Terminal
          </span>
        </div>

        <div style={{ background: '#ffffff', borderRadius: '14px', padding: '18px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 750, textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
            Allocated Shift Schedule
          </span>
          <div style={{ fontSize: '18px', fontWeight: 850, color: '#0284c7', marginBottom: '4px' }}>
            07:00 AM - 07:00 PM
          </div>
          <span style={{ fontSize: '12px', color: '#64748b' }}>
            Dedicated 24-Hour Fleet Access
          </span>
        </div>
      </div>

      {/* Completed Shift Trips Table */}
      <div style={{
        background: '#ffffff',
        borderRadius: '14px',
        border: '1px solid #e2e8f0',
        padding: '22px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid #f1f5f9' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#eff6ff', color: '#0284c7', display: 'grid', placeItems: 'center' }}>
              <Activity size={18} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>
                Shift Completed Passenger Trips
              </h3>
              <span style={{ fontSize: '12px', color: '#64748b' }}>
                Real-time fare log synced with vehicle GPS telematics
              </span>
            </div>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left', color: '#64748b', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                <th style={{ padding: '10px 12px' }}>Trip ID</th>
                <th style={{ padding: '10px 12px' }}>Time</th>
                <th style={{ padding: '10px 12px' }}>Route (Pickup → Destination)</th>
                <th style={{ padding: '10px 12px' }}>Distance</th>
                <th style={{ padding: '10px 12px' }}>Gross Fare</th>
                <th style={{ padding: '10px 12px', textAlign: 'right' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {trips.map((t) => (
                <tr key={t.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '12px' }}>
                    <strong style={{ color: '#0f172a', fontFamily: 'monospace' }}>#{t.id}</strong>
                  </td>
                  <td style={{ padding: '12px', color: '#64748b' }}>{t.time}</td>
                  <td style={{ padding: '12px' }}>
                    <strong style={{ color: '#334155' }}>{t.route}</strong>
                  </td>
                  <td style={{ padding: '12px', color: '#64748b' }}>{t.km} km</td>
                  <td style={{ padding: '12px' }}>
                    <strong style={{ color: '#16a34a', fontSize: '13.5px' }}>₹{t.fare.toFixed(2)}</strong>
                  </td>
                  <td style={{ padding: '12px', textAlign: 'right' }}>
                    <span style={{
                      background: '#dcfce7',
                      color: '#15803d',
                      padding: '3px 8px',
                      borderRadius: '5px',
                      fontSize: '11px',
                      fontWeight: 750
                    }}>
                      {t.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
