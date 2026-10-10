import React from 'react';

export default function ModuleViewer({ routeId, onBackToDashboard }) {
  const formattedTitle = routeId
    .replace(/-/g, ' ')
    .toUpperCase();

  return (
    <div className="terminal-content">
      <div className="command-header">
        <div>
          <h1 className="executive-greeting">
            {formattedTitle}
          </h1>
          <div className="executive-subline">
            Sikhar Fleet Enterprise Architecture · Phase-by-Phase Roadmap
          </div>
        </div>
        <button className="btn-create-order" onClick={onBackToDashboard}>
          ← Back to Executive Dashboard
        </button>
      </div>

      <div className="terminal-panel" style={{ padding: '60px 24px', textAlign: 'center', background: '#ffffff' }}>
        <div style={{ fontSize: '36px', marginBottom: '14px' }}>📋</div>
        <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0d2140', marginBottom: '8px' }}>
          Module Scheduled for Upcoming Development Phase
        </h3>
        <p style={{ color: '#64748b', fontSize: '13px', maxWidth: '520px', margin: '0 auto 24px', lineHeight: 1.6 }}>
          As per client specification, all operational modules are being developed phase-by-phase. 
          Currently active phase: <strong>Phase 1 · Executive Dashboard &amp; Admin Authentication</strong>.
        </p>
        <button className="btn primary" onClick={onBackToDashboard}>
          Return to Executive Dashboard
        </button>
      </div>
    </div>
  );
}
