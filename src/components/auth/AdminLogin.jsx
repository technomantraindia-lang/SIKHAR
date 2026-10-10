import React, { useState } from 'react';
import { loginAdminApi } from '../../services/api';
import { Lock, Eye, EyeOff, Zap, CheckCircle2, AlertTriangle, ArrowRight } from '../common/Icons';

export default function AdminLogin({ onLoginSuccess }) {
  const [email, setEmail] = useState('admin@sikharfleet.com');
  const [password, setPassword] = useState('admin123');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [autoFilled, setAutoFilled] = useState(false);

  const handleAdminSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await loginAdminApi(email, password);
      onLoginSuccess(result.user);
    } catch (err) {
      setError(err.message || 'Invalid administrative credentials. Please verify your email and password.');
    } finally {
      setLoading(false);
    }
  };

  const handleFillCredentials = () => {
    setEmail('admin@sikharfleet.com');
    setPassword('admin123');
    setError('');
    setAutoFilled(true);
    setTimeout(() => setAutoFilled(false), 2500);
  };

  return (
    <div className="corp-split-login-container">
      {/* Left Column: Authentic Photography Showcase */}
      <div className="login-image-column">
        <div className="login-image-overlay"></div>
        <img
          src="/images/sidebar_car_twilight.jpg"
          alt="Sikhar Fleet Vehicle on Mountain Highway"
          className="login-backdrop-photo"
        />

        {/* Brand Stamp on Image */}
        <div className="login-image-top-brand">
          <div className="brand-delta-emblem">
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none">
              <path d="M12 3L2 21H22L12 3Z" fill="url(#login-delta-grad)" />
              <path d="M12 7.5L5.5 19H18.5L12 7.5Z" fill="#060c1d" />
              <defs>
                <linearGradient id="login-delta-grad" x1="2" y1="3" x2="22" y2="21" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#38bdf8" />
                  <stop offset="1" stopColor="#1d68f0" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <div className="brand-name-block">
            <span className="brand-txt-white">SIKHAR </span>
            <span className="brand-txt-cyan">FLEET</span>
            <div className="brand-sub-motto">TO PEAK TO SIKHAR</div>
          </div>
        </div>

        {/* Minimal Bottom Caption */}
        <div className="login-image-bottom-caption">
          <div className="caption-pill">COMMERCIAL MOBILITY TERMINAL</div>
          <p className="caption-text">
            Enterprise fleet telematics, driver rosters, and asset intelligence across Delhi NCR.
          </p>
        </div>
      </div>

      {/* Right Column: Clean, Authentic Login Panel */}
      <div className="login-form-column">
        <div className="login-form-wrapper">
          {/* Header */}
          <div className="login-form-header">
            <div className="mobile-only-logo">
              <span className="brand-txt-white">SIKHAR </span>
              <span className="brand-txt-cyan">FLEET</span>
            </div>
            <h1 className="login-heading">Welcome Back</h1>
            <p className="login-subheading">Sign in to your administrative control workstation.</p>
          </div>

          {/* Quick Access Credentials Banner */}
          <div className="admin-creds-banner">
            <div className="creds-banner-info">
              <div className="creds-title-row">
                <span className="creds-key-label">Admin Login Credentials</span>
              </div>
              <div className="creds-data-row">
                <span className="creds-pair">
                  <span className="creds-dim">Email:</span>
                  <strong className="creds-val">admin@sikharfleet.com</strong>
                </span>
                <span className="creds-sep">•</span>
                <span className="creds-pair">
                  <span className="creds-dim">Password:</span>
                  <strong className="creds-val pass-badge">admin123</strong>
                </span>
              </div>
            </div>

            <button
              type="button"
              className="btn-creds-autofill"
              onClick={handleFillCredentials}
              title="Click to fill demo credentials"
            >
              {autoFilled ? (
                <>
                  <CheckCircle2 size={13} color="#4ade80" />
                  <span>Filled!</span>
                </>
              ) : (
                <>
                  <Zap size={13} color="#38bdf8" />
                  <span>Auto-Fill</span>
                </>
              )}
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="login-error-alert">
              <AlertTriangle size={15} />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleAdminSubmit} className="login-auth-form">
            <div className="form-input-group">
              <label htmlFor="admin-email-field">Workplace Email</label>
              <div className="input-with-icon">
                <svg className="field-icon-svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect width="20" height="16" x="2" y="4" rx="2" />
                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                </svg>
                <input
                  id="admin-email-field"
                  type="email"
                  required
                  placeholder="admin@sikharfleet.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  className="auth-text-input"
                />
              </div>
            </div>

            <div className="form-input-group">
              <div className="password-label-row">
                <label htmlFor="admin-pass-field">Password</label>
              </div>
              <div className="input-with-icon">
                <Lock size={16} className="field-icon-svg" />
                <input
                  id="admin-pass-field"
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  className="auth-text-input"
                />
                <button
                  type="button"
                  className="btn-password-visibility"
                  onClick={() => setShowPassword(!showPassword)}
                  title={showPassword ? 'Hide password' : 'Show password'}
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="form-options-row">
              <label className="checkbox-custom-label">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <span>Remember this workstation</span>
              </label>
            </div>

            <button
              type="submit"
              className="btn-login-submit"
              disabled={loading}
            >
              {loading ? (
                <span className="submit-loading-state">
                  <span className="loading-spinner-circle"></span>
                  <span>Signing In...</span>
                </span>
              ) : (
                <span className="submit-normal-state">
                  <span>Sign In</span>
                  <ArrowRight size={16} />
                </span>
              )}
            </button>
          </form>

          {/* Security & Copyright Footer */}
          <div className="login-form-footer">
            <span>© 2026 Sikhar Fleet Private Limited • Central Hub Terminal</span>
          </div>
        </div>
      </div>
    </div>
  );
}
