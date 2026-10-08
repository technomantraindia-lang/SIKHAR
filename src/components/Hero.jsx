import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { 
  Sparkles, 
  Send, 
  CheckCircle2, 
  Users, 
  Gift, 
  Zap, 
  ShieldCheck, 
  Flame 
} from 'lucide-react';
import Countdown from './Countdown';

export default function Hero({ waitlistRef }) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('Developer / Engineer');
  const [status, setStatus] = useState('idle'); // 'idle' | 'loading' | 'success' | 'error'
  const [waitlistCount, setWaitlistCount] = useState(1487);
  const [errorMessage, setErrorMessage] = useState('');

  // Set launch target to ~38 days in the future
  const launchDate = new Date(Date.now() + 38 * 24 * 60 * 60 * 1000).toISOString();

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (!email || !email.includes('@') || !email.includes('.')) {
      setStatus('error');
      setErrorMessage('Please enter a valid work or personal email address.');
      return;
    }

    setStatus('loading');
    setErrorMessage('');

    // Simulate instant asynchronous registration
    setTimeout(() => {
      setStatus('success');
      setWaitlistCount((prev) => prev + 1);

      // Trigger vibrant confetti celebration
      try {
        confetti({
          particleCount: 100,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#00f2fe', '#4facfe', '#7928ca', '#ff0080', '#ffffff'],
        });
      } catch (err) {
        // Fallback gracefully if canvas context is unavailable
      }
    }, 850);
  };

  const avatars = [
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&h=120&q=80',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&h=120&q=80',
    'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=120&h=120&q=80',
    'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=120&h=120&q=80',
  ];

  return (
    <section className="hero-section">
      <div className="hero-badge-container">
        <div className="status-pill">
          <span className="flame-icon-wrap">
            <Flame size={14} className="flame-icon" />
          </span>
          <span className="status-text">SIKHAR 2.0 • INTRODUCING THE HYPER-ENGINE</span>
          <span className="badge-new">SOON</span>
        </div>
      </div>

      <h1 className="hero-headline">
        Redefining the Future of <br />
        <span className="gradient-text-accent">Intelligent Systems</span>
      </h1>

      <p className="hero-subtitle">
        SIKHAR combines autonomous agent orchestration, next-gen high-concurrency 
        backend infrastructure, and real-time reactive analytics into one seamless 
        ecosystem.
      </p>

      {/* Real Countdown */}
      <Countdown targetDate={launchDate} />

      {/* Waitlist Capture Card */}
      <div className="waitlist-card-wrapper" ref={waitlistRef} id="waitlist-section">
        <div className="waitlist-glow-aura" />
        
        <div className="waitlist-card glass-card">
          <div className="waitlist-header">
            <div className="waitlist-badge">
              <Gift size={15} className="gift-icon" />
              <span>Early Adopter Privilege</span>
            </div>
            <h2 className="waitlist-title">Be the first to step inside</h2>
            <p className="waitlist-desc">
              Join the whitelist today to unlock priority access, zero onboarding fees, 
              and exclusive lifetime developer credits upon release.
            </p>
          </div>

          {status === 'success' ? (
            <div className="success-state glass-card-nested">
              <div className="success-icon-wrap">
                <CheckCircle2 size={36} className="success-check-icon" />
              </div>
              <h3 className="success-title">You're on the VIP Waitlist!</h3>
              <p className="success-text">
                We've reserved spot <strong>#{waitlistCount}</strong> for <strong>{email}</strong>. 
                Keep an eye on your inbox for private beta invitation keys.
              </p>
              <div className="perks-unlocked-grid">
                <div className="perk-item">
                  <Zap size={16} className="perk-icon" />
                  <span>$500 Cloud Credits</span>
                </div>
                <div className="perk-item">
                  <ShieldCheck size={16} className="perk-icon" />
                  <span>Zero Day Access</span>
                </div>
                <div className="perk-item">
                  <Users size={16} className="perk-icon" />
                  <span>VIP Discord Council</span>
                </div>
              </div>
              <button 
                className="btn-reset"
                onClick={() => {
                  setStatus('idle');
                  setEmail('');
                }}
              >
                Register another team member →
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubscribe} className="waitlist-form">
              <div className="form-role-select">
                <span className="role-label">I am a:</span>
                <div className="role-pills">
                  {['Developer', 'Founder', 'Enterprise Architect', 'Product Lead'].map((r) => (
                    <button
                      type="button"
                      key={r}
                      className={`role-pill ${role === r ? 'active' : ''}`}
                      onClick={() => setRole(r)}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              <div className="input-group">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your work email (e.g. alex@company.com)"
                  className="waitlist-input"
                  required
                  id="waitlist-email-input"
                />
                <button
                  type="submit"
                  disabled={status === 'loading'}
                  className="btn-submit"
                  id="waitlist-submit-btn"
                >
                  {status === 'loading' ? (
                    <div className="spinner" />
                  ) : (
                    <>
                      <span>Claim Early Access</span>
                      <Send size={16} />
                    </>
                  )}
                </button>
              </div>

              {errorMessage && (
                <div className="form-error-msg">{errorMessage}</div>
              )}

              <div className="form-footer-guarantee">
                <span className="dot-green" />
                <span>No spam, guaranteed. One-click unsubscribe at any time.</span>
              </div>
            </form>
          )}

          {/* Social Proof Bar */}
          <div className="social-proof-bar">
            <div className="avatar-stack">
              {avatars.map((src, i) => (
                <img
                  key={i}
                  src={src}
                  alt={`Waitlist member ${i + 1}`}
                  className="avatar-img"
                />
              ))}
              <div className="avatar-more">+{waitlistCount - 4}</div>
            </div>
            <div className="proof-text">
              <strong>{waitlistCount.toLocaleString()} innovators</strong> already queued up for early access
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
