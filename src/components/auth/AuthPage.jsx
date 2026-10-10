import React, { useState } from 'react';
import { authenticateUser, registerUser } from '../../services/localStore';

export default function AuthPage({ onLoginSuccess, onCancel }) {
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  
  // Login State
  const [email, setEmail] = useState('admin@sikharfleet.com');
  const [password, setPassword] = useState('admin123');
  
  // Register State
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regRole, setRegRole] = useState('Fleet Operations');
  const [regBranch, setRegBranch] = useState('Delhi NCR Hub · Gurgaon Sector 44');
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      const user = authenticateUser(email, password);
      setSuccess(`Authenticated as ${user.name}`);
      setTimeout(() => {
        onLoginSuccess(user);
      }, 400);
    } catch (err) {
      setError(err.message || 'Authentication failed. Please verify credentials.');
    }
  };

  const handleRegisterSubmit = (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!regName.trim() || !regEmail.trim() || !regPassword.trim()) {
      setError('Please provide all mandatory corporate account details.');
      return;
    }
    try {
      const newUser = registerUser({
        name: regName,
        email: regEmail,
        password: regPassword,
        role: regRole,
        branch: regBranch
      });
      setSuccess(`Account created for ${newUser.name}. Redirecting...`);
      setTimeout(() => {
        onLoginSuccess(newUser);
      }, 500);
    } catch (err) {
      setError(err.message || 'Registration failed.');
    }
  };

  const setDemoAccount = (demoEmail, demoPass) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError('');
  };

  return (
    <div className="auth-wrapper">
      {/* Left Corporate Panel */}
      <div className="auth-brand-side">
        <div className="auth-brand-logo">
          <div className="logo">
            SIKH<span style={{ color: 'var(--blue)' }}>A</span>R
          </div>
          <div className="fleet">F L E E T &nbsp; P L A T F O R M</div>
          <div style={{ fontSize: '9px', color: '#60a5fa', fontWeight: '700', marginTop: '4px' }}>
            TO PEAK TO SIKHAR · ENTERPRISE ED.
          </div>
        </div>

        <div className="auth-hero-copy">
          <h2>
            Unified fleet operations, rentals, and charging ecosystem.
          </h2>
          <p>
            Zero-bypass onboarding, verified agreements, strict 10-stage maintenance governance, 
            and precision financial ledger across Delhi NCR hubs.
          </p>

          <div className="auth-features-list">
            <div className="auth-feature-row">
              <span className="auth-feature-icon">✓</span>
              <div>
                <strong>Single Vehicle Master &amp; Assignment History</strong>
                <div style={{ color: '#9bb8de', fontSize: '11.5px' }}>
                  Prevent conflicting driver-vehicle allocations with automated locks.
                </div>
              </div>
            </div>

            <div className="auth-feature-row">
              <span className="auth-feature-icon">✓</span>
              <div>
                <strong>3-Tier Multi-Pocket Driver Wallet</strong>
                <div style={{ color: '#9bb8de', fontSize: '11.5px' }}>
                  Posted Balance, Active Charging Holds, and Spendable Balance guarantees.
                </div>
              </div>
            </div>

            <div className="auth-feature-row">
              <span className="auth-feature-icon">✓</span>
              <div>
                <strong>10-Stage Maintenance Lifecycle</strong>
                <div style={{ color: '#9bb8de', fontSize: '11.5px' }}>
                  QC signoff, bill verification, and vendor payment before road release.
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="auth-compliance-footer">
          <span>Enterprise Tenant: <strong>SIKHAR-FLEET-NCR</strong></span>
          <span>Security: <strong>AES-256 / RBAC Gateways</strong></span>
        </div>
      </div>

      {/* Right Form Panel */}
      <div className="auth-form-side">
        <div className="auth-card">
          <div className="auth-card-head">
            <h2>{mode === 'login' ? 'Staff Portal Authentication' : 'Register Enterprise User'}</h2>
            <p>
              {mode === 'login'
                ? 'Sign in with your verified corporate credentials to access the Executive Control Centre.'
                : 'Configure a new operator profile with branch-specific role permissions.'}
            </p>
          </div>

          {/* Switcher Tab */}
          <div className="auth-tab-switch">
            <button
              type="button"
              className={`auth-tab-btn ${mode === 'login' ? 'active' : ''}`}
              onClick={() => { setMode('login'); setError(''); setSuccess(''); }}
            >
              Sign In
            </button>
            <button
              type="button"
              className={`auth-tab-btn ${mode === 'register' ? 'active' : ''}`}
              onClick={() => { setMode('register'); setError(''); setSuccess(''); }}
            >
              Register New Staff
            </button>
          </div>

          {error && (
            <div style={{
              padding: '10px 14px',
              backgroundColor: '#fff0f1',
              border: '1px solid #ffd1d4',
              borderRadius: '6px',
              color: '#c91e2a',
              fontSize: '12px',
              marginBottom: '16px',
              fontWeight: '500'
            }}>
              ⚠ {error}
            </div>
          )}

          {success && (
            <div style={{
              padding: '10px 14px',
              backgroundColor: '#eaf9f0',
              border: '1px solid #bbf0cf',
              borderRadius: '6px',
              color: '#118145',
              fontSize: '12px',
              marginBottom: '16px',
              fontWeight: '600'
            }}>
              ✓ {success}
            </div>
          )}

          {/* Form */}
          {mode === 'login' ? (
            <form onSubmit={handleLoginSubmit}>
              <div className="form-group">
                <label>Corporate Email ID</label>
                <input
                  type="email"
                  className="form-input"
                  required
                  placeholder="name@sikharfleet.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Access Password</label>
                <input
                  type="password"
                  className="form-input"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', fontSize: '11.5px', color: '#64748b' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', textTransform: 'none', fontWeight: '500' }}>
                  <input type="checkbox" defaultChecked /> Remember this workstation
                </label>
                <span style={{ color: 'var(--blue)', cursor: 'pointer', fontWeight: '600' }}>Reset Password</span>
              </div>

              <button type="submit" className="auth-btn-submit">
                Authorize &amp; Open Control Center →
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegisterSubmit}>
              <div className="form-group">
                <label>Full Legal Name *</label>
                <input
                  type="text"
                  className="form-input"
                  required
                  placeholder="e.g. Ramesh Chandra"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Corporate Email ID *</label>
                <input
                  type="email"
                  className="form-input"
                  required
                  placeholder="ramesh@sikharfleet.com"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                />
              </div>

              <div className="form-grid-2">
                <div className="form-group">
                  <label>Role Assignment *</label>
                  <select
                    className="form-input"
                    value={regRole}
                    onChange={(e) => setRegRole(e.target.value)}
                  >
                    <option value="Fleet Operations">Fleet Operations</option>
                    <option value="Onboarding & Rentals">Onboarding &amp; Rentals</option>
                    <option value="Maintenance Manager">Maintenance Manager</option>
                    <option value="Finance & Collections">Finance &amp; Collections</option>
                    <option value="Owner / Super Administrator">Owner / Super Admin</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Assigned Hub / Branch *</label>
                  <select
                    className="form-input"
                    value={regBranch}
                    onChange={(e) => setRegBranch(e.target.value)}
                  >
                    <option value="Delhi NCR Central Hub">Delhi NCR Central Hub</option>
                    <option value="Gurgaon Sector 44 Yard">Gurgaon Sector 44 Yard</option>
                    <option value="Noida Phase 2 Depot">Noida Phase 2 Depot</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Security Password *</label>
                <input
                  type="password"
                  className="form-input"
                  required
                  placeholder="At least 6 characters"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                />
              </div>

              <button type="submit" className="auth-btn-submit">
                Create Account &amp; Log In →
              </button>
            </form>
          )}

          {/* Quick Demo Pre-fills */}
          {mode === 'login' && (
            <div className="demo-account-box">
              <h5>1-Click Pre-configured Demo Accounts:</h5>
              <div className="demo-buttons-row">
                <button
                  type="button"
                  className="demo-badge-btn"
                  onClick={() => setDemoAccount('admin@sikharfleet.com', 'admin123')}
                >
                  👑 Super Admin (Sanjay)
                </button>
                <button
                  type="button"
                  className="demo-badge-btn"
                  onClick={() => setDemoAccount('operations@sikharfleet.com', 'ops123')}
                >
                  🚙 Fleet Ops (Rajesh)
                </button>
                <button
                  type="button"
                  className="demo-badge-btn"
                  onClick={() => setDemoAccount('finance@sikharfleet.com', 'fin123')}
                >
                  ₹ Finance Head (Pooja)
                </button>
              </div>
            </div>
          )}

          {onCancel && (
            <div style={{ textAlign: 'center', marginTop: '16px' }}>
              <button 
                type="button" 
                onClick={onCancel}
                style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '11.5px', textDecoration: 'underline' }}
              >
                ← Return to Platform
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
