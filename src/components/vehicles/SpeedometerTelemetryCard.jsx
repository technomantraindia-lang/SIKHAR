import React, { useState, useMemo } from 'react';
import {
  Activity,
  Clock,
  Calendar,
  AlertTriangle,
  ChevronRight,
  TrendingUp,
  Shield,
  Zap,
  MapPin,
  CheckCircle2
} from '../common/Icons';

export default function SpeedometerTelemetryCard({ vehicle = {} }) {
  const [telemetryMode, setTelemetryMode] = useState('day'); // 'day' | 'month'
  const [selectedDay, setSelectedDay] = useState('today'); // 'today' | 'yesterday' | '2daysago'
  const [selectedMonth, setSelectedMonth] = useState('current'); // 'current' | 'previous'
  const [hoveredHour, setHoveredHour] = useState(null);

  const isEv = vehicle.type === 'EV';
  const isOnRoad = (vehicle.status || '').toLowerCase().includes('road');
  
  // Simulated instantaneous speed based on status
  const currentSpeed = useMemo(() => {
    if (!isOnRoad) return 0;
    // Derive a consistent speed based on registration
    const hash = (vehicle.registration || 'DL01').split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
    return 48 + (hash % 26); // between 48 and 73 km/h
  }, [isOnRoad, vehicle.registration]);

  const speedLimit = 60; // Standard commercial fleet speed governor

  // Day-wise hourly profile data (24-hour cycle)
  const dayWiseData = useMemo(() => {
    const hours = [
      { hour: '06:00', avgSpeed: 32, maxSpeed: 45, distance: 18, status: 'City Transit', harshEvents: 0 },
      { hour: '07:00', avgSpeed: 41, maxSpeed: 58, distance: 26, status: 'Outer Arterial', harshEvents: 0 },
      { hour: '08:00', avgSpeed: 28, maxSpeed: 42, distance: 14, status: 'Peak Congestion', harshEvents: 1 },
      { hour: '09:00', avgSpeed: 38, maxSpeed: 52, distance: 22, status: 'Commercial Hub', harshEvents: 0 },
      { hour: '10:00', avgSpeed: 48, maxSpeed: 64, distance: 31, status: 'Highway Expressway', harshEvents: 1 },
      { hour: '11:00', avgSpeed: 44, maxSpeed: 59, distance: 28, status: 'Ring Corridor', harshEvents: 0 },
      { hour: '12:00', avgSpeed: 36, maxSpeed: 48, distance: 20, status: 'Urban Center', harshEvents: 0 },
      { hour: '13:00', avgSpeed: 12, maxSpeed: 24, distance: 6, status: 'Charging / Rest', harshEvents: 0 },
      { hour: '14:00', avgSpeed: 52, maxSpeed: 74, distance: 34, status: 'Airport Expressway', harshEvents: 0 },
      { hour: '15:00', avgSpeed: 46, maxSpeed: 62, distance: 29, status: 'Corridor Transit', harshEvents: 0 },
      { hour: '16:00', avgSpeed: 42, maxSpeed: 56, distance: 25, status: 'City Delivery', harshEvents: 0 },
      { hour: '17:00', avgSpeed: 30, maxSpeed: 44, distance: 16, status: 'Evening Traffic', harshEvents: 0 },
      { hour: '18:00', avgSpeed: 35, maxSpeed: 50, distance: 21, status: 'Sector Roads', harshEvents: 0 },
      { hour: '19:00', avgSpeed: 45, maxSpeed: 68, distance: 27, status: 'Suburban Highway', harshEvents: 1 },
      { hour: '20:00', avgSpeed: 39, maxSpeed: 54, distance: 23, status: 'Return Transit', harshEvents: 0 },
      { hour: '21:00', avgSpeed: 20, maxSpeed: 32, distance: 9, status: 'Yard Approach', harshEvents: 0 }
    ];

    if (selectedDay === 'yesterday') {
      return hours.map(h => ({
        ...h,
        avgSpeed: Math.max(15, h.avgSpeed - 4),
        maxSpeed: Math.max(25, h.maxSpeed - 5),
        distance: Math.max(5, Math.round(h.distance * 0.9))
      }));
    }
    return hours;
  }, [selectedDay]);

  // Month-wise daily profile data (30 days of the month)
  const monthWiseData = useMemo(() => {
    const days = [];
    const baseDist = 140;
    const baseAvg = 42;
    for (let d = 1; d <= 30; d++) {
      const isWeekend = d % 7 === 0 || d % 7 === 6;
      const speedSeed = ((d * 17 + 23) % 19) - 8;
      const maxSpeedSeed = ((d * 31 + 11) % 25) + 62;
      const dist = isWeekend ? Math.round(baseDist * 0.6) : Math.round(baseDist + speedSeed * 5);
      const avg = Math.round(baseAvg + (speedSeed * 0.8));
      const max = Math.min(92, maxSpeedSeed);
      days.push({
        day: `Day ${d}`,
        date: `${d < 10 ? '0' + d : d} Oct`,
        avgSpeed: avg,
        maxSpeed: max,
        distance: dist,
        overspeeds: max > 75 ? (max > 85 ? 2 : 1) : 0,
        score: max > 80 ? 92 : 98
      });
    }
    return days;
  }, []);

  // Compute summary stats
  const dayStats = useMemo(() => {
    const totalDist = dayWiseData.reduce((acc, cur) => acc + cur.distance, 0);
    const maxSpd = Math.max(...dayWiseData.map(d => d.maxSpeed));
    const avgSpd = Math.round(dayWiseData.reduce((acc, cur) => acc + cur.avgSpeed, 0) / dayWiseData.length);
    const harshCount = dayWiseData.reduce((acc, cur) => acc + cur.harshEvents, 0);
    return { totalDist, maxSpd, avgSpd, harshCount };
  }, [dayWiseData]);

  const monthStats = useMemo(() => {
    const totalDist = monthWiseData.reduce((acc, cur) => acc + cur.distance, 0);
    const maxSpd = Math.max(...monthWiseData.map(m => m.maxSpeed));
    const avgSpd = Math.round(monthWiseData.reduce((acc, cur) => acc + cur.avgSpeed, 0) / monthWiseData.length);
    const totalOverspeeds = monthWiseData.reduce((acc, cur) => acc + cur.overspeeds, 0);
    return { totalDist, maxSpd, avgSpd, totalOverspeeds };
  }, [monthWiseData]);

  // Speedometer Gauge Angle calculation (-120deg at 0 km/h to +120deg at 140 km/h)
  const gaugeAngle = useMemo(() => {
    const clamped = Math.min(140, Math.max(0, currentSpeed));
    return -120 + (clamped / 140) * 240;
  }, [currentSpeed]);

  return (
    <div className="terminal-panel vd-panel speedometer-telemetry-panel" style={{ marginTop: '16px' }}>
      {/* Header with Telemetry Controls */}
      <div className="panel-title-row" style={{ flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Activity size={18} color="#0284c7" />
            <span>SPEEDOMETER &amp; TELEMETRY INTELLIGENCE</span>
          </h3>
          <span className="badge-live-pulse" style={{ background: isOnRoad ? '#dcfce7' : '#f1f5f9', color: isOnRoad ? '#15803d' : '#64748b' }}>
            {isOnRoad ? `LIVE: ${currentSpeed} KM/H` : 'PARKED / 0 KM/H'}
          </span>
        </div>

        {/* View Mode Switcher: Day-Wise vs Month-Wise */}
        <div className="speedo-view-switcher" style={{ display: 'flex', background: '#f1f5f9', padding: '3px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <button
            type="button"
            className={`speedo-tab-btn ${telemetryMode === 'day' ? 'active' : ''}`}
            onClick={() => setTelemetryMode('day')}
            style={{
              padding: '6px 14px',
              fontSize: '12px',
              fontWeight: 700,
              border: 'none',
              background: telemetryMode === 'day' ? '#ffffff' : 'transparent',
              color: telemetryMode === 'day' ? '#0284c7' : '#64748b',
              borderRadius: '6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: telemetryMode === 'day' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none'
            }}
          >
            <Clock size={13} />
            <span>Day-Wise Telemetry</span>
          </button>

          <button
            type="button"
            className={`speedo-tab-btn ${telemetryMode === 'month' ? 'active' : ''}`}
            onClick={() => setTelemetryMode('month')}
            style={{
              padding: '6px 14px',
              fontSize: '12px',
              fontWeight: 700,
              border: 'none',
              background: telemetryMode === 'month' ? '#ffffff' : 'transparent',
              color: telemetryMode === 'month' ? '#0284c7' : '#64748b',
              borderRadius: '6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: telemetryMode === 'month' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none'
            }}
          >
            <Calendar size={13} />
            <span>Month-Wise Telemetry</span>
          </button>
        </div>
      </div>

      {/* Main Speedometer Grid Layout */}
      <div className="speedo-grid-layout" style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '20px', marginTop: '16px' }}>
        {/* Left Column: Live Analog & Digital Speedometer Gauge */}
        <div className="speedo-gauge-card" style={{ background: '#0b1329', borderRadius: '14px', padding: '18px', color: '#ffffff', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
          <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#94a3b8', fontWeight: 700, marginBottom: '8px' }}>
            Instantaneous Speedometer
          </div>

          {/* SVG Circular Dial Speedometer */}
          <div style={{ position: 'relative', width: '220px', height: '170px', margin: '0 auto' }}>
            <svg viewBox="0 0 200 160" style={{ width: '100%', height: '100%' }}>
              <defs>
                <linearGradient id="speedo-safe-grad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#10b981" />
                  <stop offset="60%" stopColor="#06b6d4" />
                  <stop offset="85%" stopColor="#f59e0b" />
                  <stop offset="100%" stopColor="#ef4444" />
                </linearGradient>
                <filter id="speedo-glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>

              {/* Background Arc Track (from -120deg to +120deg, radius 70) */}
              <path
                d="M 39.4 135 A 70 70 0 1 1 160.6 135"
                fill="none"
                stroke="#1e293b"
                strokeWidth="12"
                strokeLinecap="round"
              />

              {/* Colored Speed Arc Range */}
              <path
                d="M 39.4 135 A 70 70 0 1 1 160.6 135"
                fill="none"
                stroke="url(#speedo-safe-grad)"
                strokeWidth="10"
                strokeDasharray="293"
                strokeDashoffset={Math.max(0, 293 - (293 * Math.min(140, currentSpeed)) / 140)}
                strokeLinecap="round"
                filter="url(#speedo-glow)"
              />

              {/* Ticks and Markings */}
              {[0, 20, 40, 60, 80, 100, 120, 140].map((val) => {
                const angle = -120 + (val / 140) * 240;
                const rad = (angle - 90) * (Math.PI / 180);
                const x1 = 100 + 72 * Math.cos(rad);
                const y1 = 100 + 72 * Math.sin(rad);
                const x2 = 100 + 82 * Math.cos(rad);
                const y2 = 100 + 82 * Math.sin(rad);
                const tx = 100 + 60 * Math.cos(rad);
                const ty = 100 + 60 * Math.sin(rad) + 4;
                return (
                  <g key={val}>
                    <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#64748b" strokeWidth="1.5" />
                    <text x={tx} y={ty} fill="#94a3b8" fontSize="8" fontWeight="600" textAnchor="middle">
                      {val}
                    </text>
                  </g>
                );
              })}

              {/* Speed limit governor tick at 60 km/h */}
              {(() => {
                const angle = -120 + (speedLimit / 140) * 240;
                const rad = (angle - 90) * (Math.PI / 180);
                const x = 100 + 70 * Math.cos(rad);
                const y = 100 + 70 * Math.sin(rad);
                return (
                  <circle cx={x} cy={y} r="3" fill="#f59e0b" />
                );
              })()}

              {/* Animated Needle */}
              <g transform={`rotate(${gaugeAngle} 100 100)`} style={{ transition: 'transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)' }}>
                <polygon points="98,100 102,100 100.5,36" fill="#38bdf8" filter="url(#speedo-glow)" />
                <circle cx="100" cy="100" r="7" fill="#0f172a" stroke="#38bdf8" strokeWidth="2" />
              </g>
            </svg>
          </div>

          {/* Large Digital Speed Readout */}
          <div style={{ marginTop: '-15px' }}>
            <div style={{ display: 'inline-flex', alignItems: 'baseline', gap: '4px' }}>
              <span style={{ fontSize: '42px', fontWeight: 900, fontFamily: 'monospace', letterSpacing: '-0.03em', color: currentSpeed > speedLimit ? '#fbbf24' : '#38bdf8' }}>
                {currentSpeed}
              </span>
              <span style={{ fontSize: '13px', fontWeight: 800, color: '#94a3b8' }}>KM/H</span>
            </div>
            
            <div style={{ marginTop: '4px' }}>
              <span
                style={{
                  display: 'inline-block',
                  padding: '3px 10px',
                  borderRadius: '12px',
                  fontSize: '11px',
                  fontWeight: 700,
                  background: currentSpeed === 0 ? 'rgba(148,163,184,0.15)' : currentSpeed > speedLimit ? 'rgba(245,158,11,0.2)' : 'rgba(56,189,248,0.2)',
                  color: currentSpeed === 0 ? '#94a3b8' : currentSpeed > speedLimit ? '#fbbf24' : '#38bdf8'
                }}
              >
                {currentSpeed === 0 ? '🅿️ Zero Speed / Hub Parked' : currentSpeed > speedLimit ? '⚠️ Exceeding Fleet Limit (60)' : '✓ Safe Cruising Corridor'}
              </span>
            </div>
          </div>

          {/* Quick Speed Telemetry Specs */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '14px', paddingTop: '12px', borderTop: '1px solid #1e293b', textAlign: 'left', fontSize: '11px' }}>
            <div>
              <span style={{ color: '#64748b', display: 'block' }}>Speed Governor:</span>
              <strong style={{ color: '#f1f5f9' }}>60 km/h Calibrated</strong>
            </div>
            <div>
              <span style={{ color: '#64748b', display: 'block' }}>GPS Update Rate:</span>
              <strong style={{ color: '#38bdf8' }}>1 Hz (Every 1s)</strong>
            </div>
            <div>
              <span style={{ color: '#64748b', display: 'block' }}>Odometer Sync:</span>
              <strong style={{ color: '#f1f5f9' }}>{vehicle.odometer || '120 km'}</strong>
            </div>
            <div>
              <span style={{ color: '#64748b', display: 'block' }}>Driving Score:</span>
              <strong style={{ color: '#10b981' }}>98 / 100 (Optimal)</strong>
            </div>
          </div>
        </div>

        {/* Right Column: Day-Wise or Month-Wise Telemetry Graph & Analytics */}
        <div className="speedo-telemetry-body" style={{ background: '#ffffff', borderRadius: '14px', border: '1px solid #e2e8f0', padding: '16px', display: 'flex', flexDirection: 'column' }}>
          {/* Top Filter Bar inside view */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a' }}>
                {telemetryMode === 'day' ? 'Hourly Speed & Velocity Distribution (24-Hour Cycle)' : '30-Day Aggregated Speed & Mileage Trajectory'}
              </div>
              <div style={{ fontSize: '11.5px', color: '#64748b' }}>
                {telemetryMode === 'day' 
                  ? 'Showing hourly average speed vs max speed spikes, distance logged, and harsh deceleration events.'
                  : 'Historical fleet telematics tracking daily average velocity and high-speed expressway compliance.'}
              </div>
            </div>

            {/* Sub-selectors */}
            {telemetryMode === 'day' ? (
              <div style={{ display: 'flex', gap: '6px' }}>
                {['today', 'yesterday'].map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setSelectedDay(d)}
                    style={{
                      padding: '4px 10px',
                      fontSize: '11px',
                      fontWeight: 700,
                      borderRadius: '6px',
                      border: '1px solid #cbd5e1',
                      background: selectedDay === d ? '#0284c7' : '#ffffff',
                      color: selectedDay === d ? '#ffffff' : '#475569',
                      cursor: 'pointer'
                    }}
                  >
                    {d === 'today' ? 'Today (Live)' : 'Yesterday'}
                  </button>
                ))}
              </div>
            ) : (
              <div style={{ display: 'flex', gap: '6px' }}>
                {['current', 'previous'].map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setSelectedMonth(m)}
                    style={{
                      padding: '4px 10px',
                      fontSize: '11px',
                      fontWeight: 700,
                      borderRadius: '6px',
                      border: '1px solid #cbd5e1',
                      background: selectedMonth === m ? '#0284c7' : '#ffffff',
                      color: selectedMonth === m ? '#ffffff' : '#475569',
                      cursor: 'pointer'
                    }}
                  >
                    {m === 'current' ? 'October 2026' : 'September 2026'}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Quick Metrics Bar */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '16px' }}>
            {telemetryMode === 'day' ? (
              <>
                <div style={{ background: '#f8fafc', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <span style={{ fontSize: '11px', color: '#64748b', display: 'block' }}>Peak Speed Today</span>
                  <strong style={{ fontSize: '18px', color: '#0f172a' }}>{dayStats.maxSpd} <span style={{ fontSize: '11px', color: '#64748b' }}>km/h</span></strong>
                </div>
                <div style={{ background: '#f8fafc', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <span style={{ fontSize: '11px', color: '#64748b', display: 'block' }}>Average Moving Speed</span>
                  <strong style={{ fontSize: '18px', color: '#0284c7' }}>{dayStats.avgSpd} <span style={{ fontSize: '11px', color: '#64748b' }}>km/h</span></strong>
                </div>
                <div style={{ background: '#f8fafc', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <span style={{ fontSize: '11px', color: '#64748b', display: 'block' }}>Distance Driven Today</span>
                  <strong style={{ fontSize: '18px', color: '#16a34a' }}>{dayStats.totalDist} <span style={{ fontSize: '11px', color: '#64748b' }}>km</span></strong>
                </div>
                <div style={{ background: '#f8fafc', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <span style={{ fontSize: '11px', color: '#64748b', display: 'block' }}>Harsh Events (Brake/Accel)</span>
                  <strong style={{ fontSize: '18px', color: dayStats.harshCount > 0 ? '#d97706' : '#16a34a' }}>
                    {dayStats.harshCount} <span style={{ fontSize: '11px', color: '#64748b' }}>events</span>
                  </strong>
                </div>
              </>
            ) : (
              <>
                <div style={{ background: '#f8fafc', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <span style={{ fontSize: '11px', color: '#64748b', display: 'block' }}>Monthly Peak Speed</span>
                  <strong style={{ fontSize: '18px', color: '#0f172a' }}>{monthStats.maxSpd} <span style={{ fontSize: '11px', color: '#64748b' }}>km/h</span></strong>
                </div>
                <div style={{ background: '#f8fafc', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <span style={{ fontSize: '11px', color: '#64748b', display: 'block' }}>Monthly Average Velocity</span>
                  <strong style={{ fontSize: '18px', color: '#0284c7' }}>{monthStats.avgSpd} <span style={{ fontSize: '11px', color: '#64748b' }}>km/h</span></strong>
                </div>
                <div style={{ background: '#f8fafc', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <span style={{ fontSize: '11px', color: '#64748b', display: 'block' }}>Total Monthly Mileage</span>
                  <strong style={{ fontSize: '18px', color: '#16a34a' }}>{monthStats.totalDist} <span style={{ fontSize: '11px', color: '#64748b' }}>km</span></strong>
                </div>
                <div style={{ background: '#f8fafc', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <span style={{ fontSize: '11px', color: '#64748b', display: 'block' }}>Overspeed Violations</span>
                  <strong style={{ fontSize: '18px', color: monthStats.totalOverspeeds > 0 ? '#d97706' : '#16a34a' }}>
                    {monthStats.totalOverspeeds} <span style={{ fontSize: '11px', color: '#64748b' }}>logged</span>
                  </strong>
                </div>
              </>
            )}
          </div>

          {/* Interactive Chart Visualizer */}
          <div style={{ flex: 1, minHeight: '180px', background: '#fcfdfd', border: '1px solid #f1f5f9', borderRadius: '10px', padding: '14px', position: 'relative' }}>
            {telemetryMode === 'day' ? (
              /* DAY-WISE HOURLY BAR & LINE CHART */
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: '#475569' }}>
                    Hourly Speed Profile (km/h) · Hover on bar for telemetry details
                  </span>
                  <div style={{ display: 'flex', gap: '14px', fontSize: '10.5px' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <span style={{ width: '8px', height: '8px', background: '#38bdf8', borderRadius: '2px' }} />
                      <span>Avg Speed</span>
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <span style={{ width: '8px', height: '8px', background: '#f59e0b', borderRadius: '2px' }} />
                      <span>Peak Speed Spike</span>
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <span style={{ width: '12px', height: '2px', background: '#ef4444', borderTop: '1px dashed #ef4444' }} />
                      <span>Fleet Limit (60)</span>
                    </span>
                  </div>
                </div>

                {/* Bars Area */}
                <div style={{ display: 'flex', alignItems: 'flex-end', height: '120px', gap: '8px', paddingBottom: '20px', borderBottom: '1px solid #e2e8f0', position: 'relative' }}>
                  {/* Speed Limit guideline at 60 km/h (out of max 80 scale => 60/80 = 75% height) */}
                  <div
                    style={{
                      position: 'absolute',
                      left: 0,
                      right: 0,
                      bottom: `${(60 / 80) * 100}%`,
                      borderBottom: '1.5px dashed #ef4444',
                      pointerEvents: 'none',
                      zIndex: 1,
                      opacity: 0.6
                    }}
                  />

                  {dayWiseData.map((slot, sIdx) => {
                    const avgPct = Math.min(100, (slot.avgSpeed / 80) * 100);
                    const maxPct = Math.min(100, (slot.maxSpeed / 80) * 100);
                    const isHovered = hoveredHour === sIdx;

                    return (
                      <div
                        key={slot.hour}
                        style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end', cursor: 'pointer', position: 'relative' }}
                        onMouseEnter={() => setHoveredHour(sIdx)}
                        onMouseLeave={() => setHoveredHour(null)}
                      >
                        {/* Peak Spike Marker */}
                        <div
                          style={{
                            width: '4px',
                            height: `${maxPct}%`,
                            background: slot.maxSpeed > 60 ? '#f59e0b' : '#94a3b8',
                            borderRadius: '2px',
                            position: 'absolute',
                            bottom: 0,
                            zIndex: 2,
                            opacity: 0.6
                          }}
                        />

                        {/* Average Bar */}
                        <div
                          style={{
                            width: '80%',
                            maxWidth: '18px',
                            height: `${avgPct}%`,
                            background: isHovered ? '#0284c7' : '#38bdf8',
                            borderRadius: '4px 4px 0 0',
                            zIndex: 3,
                            transition: 'all 0.15s ease'
                          }}
                        />

                        {/* X-axis Label */}
                        <span style={{ position: 'absolute', bottom: '-18px', fontSize: '9px', color: isHovered ? '#0284c7' : '#64748b', fontWeight: isHovered ? 800 : 500 }}>
                          {slot.hour}
                        </span>

                        {/* Hover Tooltip */}
                        {isHovered && (
                          <div
                            style={{
                              position: 'absolute',
                              bottom: '105%',
                              background: '#0f172a',
                              color: '#ffffff',
                              padding: '6px 10px',
                              borderRadius: '6px',
                              fontSize: '10px',
                              whiteSpace: 'nowrap',
                              zIndex: 10,
                              boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                              pointerEvents: 'none'
                            }}
                          >
                            <div style={{ fontWeight: 800, color: '#38bdf8' }}>{slot.hour} · {slot.status}</div>
                            <div>Avg Speed: <strong>{slot.avgSpeed} km/h</strong></div>
                            <div>Peak Speed: <strong style={{ color: slot.maxSpeed > 60 ? '#fbbf24' : '#ffffff' }}>{slot.maxSpeed} km/h</strong></div>
                            <div>Distance: <strong>{slot.distance} km</strong></div>
                            {slot.harshEvents > 0 && <div style={{ color: '#f87171' }}>⚠️ {slot.harshEvents} Harsh Event</div>}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              /* MONTH-WISE 30-DAY PROGRESSION CHART */
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: '#475569' }}>
                    Daily Velocity Trend (October 2026) · Day 1 through Day 30
                  </span>
                  <div style={{ display: 'flex', gap: '14px', fontSize: '10.5px' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <span style={{ width: '8px', height: '8px', background: '#0284c7', borderRadius: '2px' }} />
                      <span>Daily Avg Speed</span>
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <span style={{ width: '8px', height: '8px', background: '#cbd5e1', borderRadius: '2px' }} />
                      <span>Distance (Scale 0-250 km)</span>
                    </span>
                  </div>
                </div>

                {/* 30-Day Bar / Column Sequence */}
                <div style={{ display: 'flex', alignItems: 'flex-end', height: '120px', gap: '3px', paddingBottom: '20px', borderBottom: '1px solid #e2e8f0', position: 'relative' }}>
                  {monthWiseData.map((dItem, dIdx) => {
                    const speedHeightPct = (dItem.avgSpeed / 70) * 100;
                    const isHovered = hoveredHour === dIdx;

                    return (
                      <div
                        key={dItem.day}
                        style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end', cursor: 'pointer', position: 'relative' }}
                        onMouseEnter={() => setHoveredHour(dIdx)}
                        onMouseLeave={() => setHoveredHour(null)}
                      >
                        {/* Daily Speed Bar */}
                        <div
                          style={{
                            width: '100%',
                            height: `${speedHeightPct}%`,
                            background: isHovered ? '#0284c7' : dItem.maxSpeed > 80 ? '#fbbf24' : '#38bdf8',
                            borderRadius: '2px 2px 0 0',
                            transition: 'all 0.15s ease'
                          }}
                        />

                        {/* X-axis Every 5th Day */}
                        {dIdx % 5 === 0 && (
                          <span style={{ position: 'absolute', bottom: '-18px', fontSize: '8.5px', color: '#64748b' }}>
                            {dIdx + 1}
                          </span>
                        )}

                        {/* Tooltip */}
                        {isHovered && (
                          <div
                            style={{
                              position: 'absolute',
                              bottom: '105%',
                              background: '#0f172a',
                              color: '#ffffff',
                              padding: '6px 10px',
                              borderRadius: '6px',
                              fontSize: '10px',
                              whiteSpace: 'nowrap',
                              zIndex: 10,
                              boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                              pointerEvents: 'none'
                            }}
                          >
                            <div style={{ fontWeight: 800, color: '#38bdf8' }}>{dItem.date} ({dItem.day})</div>
                            <div>Daily Avg: <strong>{dItem.avgSpeed} km/h</strong></div>
                            <div>Max Recorded: <strong style={{ color: dItem.maxSpeed > 75 ? '#fbbf24' : '#ffffff' }}>{dItem.maxSpeed} km/h</strong></div>
                            <div>Distance: <strong>{dItem.distance} km</strong></div>
                            <div>Safety Score: <strong style={{ color: '#4ade80' }}>{dItem.score}%</strong></div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
