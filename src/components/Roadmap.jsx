import React from 'react';
import { CheckCircle2, Clock, Rocket, ShieldAlert } from 'lucide-react';

export default function Roadmap() {
  const steps = [
    {
      phase: 'PHASE 01',
      title: 'Core Engine & Distributed Architecture',
      desc: 'High-throughput microservices foundation, zero-copy memory buffers, and distributed clustering protocol.',
      status: 'completed',
      date: 'Q1 COMPLETED',
    },
    {
      phase: 'PHASE 02',
      title: 'Closed Alpha & Chaos Engineering',
      desc: 'Tested with 250,000 req/sec simulated load with 0 dropped events across 10 global regions.',
      status: 'completed',
      date: 'Q2 COMPLETED',
    },
    {
      phase: 'PHASE 03',
      title: 'Developer SDKs & Studio Dashboard',
      desc: 'Polishing native SDK bindings, interactive analytics cockpit, and real-time observability telemetry.',
      status: 'in-progress',
      date: 'CURRENTLY 88% COMPLETE',
      progress: 88,
    },
    {
      phase: 'PHASE 04',
      title: 'Public Beta & Global Multi-Cloud Launch',
      desc: 'Unlocking waitlist invites in batches, publishing public documentation, and developer grants program.',
      status: 'upcoming',
      date: 'COMING VERY SOON',
    },
  ];

  return (
    <section className="roadmap-section">
      <div className="section-header">
        <div className="section-tag">
          <span>TRANSPARENT PROGRESS</span>
        </div>
        <h2 className="section-title">
          The Road to <span className="gradient-text-accent">Public Release</span>
        </h2>
        <p className="section-subtitle">
          We are engineering SIKHAR with meticulous care and unyielding reliability. Follow our journey.
        </p>
      </div>

      <div className="roadmap-timeline">
        <div className="timeline-connector-line" />

        <div className="roadmap-cards-grid">
          {steps.map((step, idx) => (
            <div 
              key={idx} 
              className={`roadmap-card glass-card ${step.status === 'in-progress' ? 'active-step' : ''}`}
            >
              <div className="roadmap-header">
                <span className="roadmap-phase">{step.phase}</span>
                {step.status === 'completed' && (
                  <span className="roadmap-badge badge-done">
                    <CheckCircle2 size={13} /> Completed
                  </span>
                )}
                {step.status === 'in-progress' && (
                  <span className="roadmap-badge badge-active">
                    <Clock size={13} className="spin-slow" /> In Progress
                  </span>
                )}
                {step.status === 'upcoming' && (
                  <span className="roadmap-badge badge-upcoming">
                    <Rocket size={13} /> Upcoming
                  </span>
                )}
              </div>

              <h3 className="roadmap-title">{step.title}</h3>
              <p className="roadmap-desc">{step.desc}</p>

              {step.progress && (
                <div className="roadmap-progress-wrap">
                  <div className="progress-info">
                    <span>Release Readiness</span>
                    <span className="progress-val">{step.progress}%</span>
                  </div>
                  <div className="progress-bar-bg">
                    <div 
                      className="progress-bar-fill" 
                      style={{ width: `${step.progress}%` }} 
                    />
                  </div>
                </div>
              )}

              <div className="roadmap-date-footer">
                <span>{step.date}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
