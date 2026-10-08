import React from 'react';
import { Sparkles, ArrowRight, ShieldCheck } from 'lucide-react';

export default function Navbar({ onScrollToWaitlist }) {
  return (
    <header className="navbar-container">
      <nav className="navbar glass-card">
        <div className="logo-group">
          <div className="logo-icon-wrapper">
            <div className="logo-glow" />
            <span className="logo-symbol">▲</span>
          </div>
          <div className="logo-text-group">
            <span className="brand-name">SIKHAR</span>
            <span className="brand-tagline">AI & Cloud Ecosystem</span>
          </div>
        </div>

        <div className="nav-center-badge">
          <span className="pulse-indicator"></span>
          <span className="badge-text">Private Alpha Phase</span>
        </div>

        <div className="nav-actions">
          <button 
            className="btn-nav-primary"
            onClick={onScrollToWaitlist}
            id="nav-join-waitlist-btn"
          >
            <Sparkles size={15} className="sparkle-icon" />
            <span>Get VIP Access</span>
            <ArrowRight size={14} className="arrow-icon" />
          </button>
        </div>
      </nav>
    </header>
  );
}
