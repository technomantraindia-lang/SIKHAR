import React, { useState } from 'react';
import { loginAdminApi } from '../../services/api';
import { Lock, Eye, EyeOff, AlertTriangle, ArrowRight } from '../common/Icons';

export default function AdminLogin({ onLoginSuccess, onBackToHome }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAdminSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await loginAdminApi(email.trim(), password, rememberMe);
      onLoginSuccess(result.user);
    } catch (err) {
      setError(err.message || 'Invalid administrative credentials. Please verify your email and password.');
    } finally {
      setLoading(false);
    }
  };

  const handleFieldChange = (setter) => (event) => {
    setter(event.target.value);
    if (error) setError('');
  };

  return (
    <div className="corp-split-login-container">
      <div className="login-image-column">
        <div className="login-image-overlay" />
        <img
          src="/images/sidebar_car_twilight.jpg"
          alt="Sikhar Fleet vehicle on a highway"
          className="login-backdrop-photo"
        />

        <div className="login-image-top-brand">
          <div className="brand-delta-emblem">
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" aria-hidden="true">
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

        <div className="login-image-bottom-caption">
          <div className="caption-pill">COMMERCIAL MOBILITY TERMINAL</div>
          <p className="caption-text">
            Enterprise fleet telematics, driver rosters, and asset intelligence across Delhi NCR.
          </p>
        </div>
      </div>

      <div className="login-form-column">
        <div className="login-form-wrapper">
          <div className="login-form-header">
            <div className="mobile-only-logo">
              <span className="brand-txt-white">SIKHAR </span>
              <span className="brand-txt-cyan">FLEET</span>
            </div>
            <h1 className="login-heading">Sign In</h1>
            <p className="login-subheading">Sign in to open the Sikhar Fleet Admin Panel.</p>
            <div className="login-security-note">
              <span className="login-security-dot" aria-hidden="true" />
              <span>Authorized administrator access only</span>
            </div>
          </div>

          {error && (
            <div className="login-error-alert" role="alert" aria-live="polite">
              <AlertTriangle size={15} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleAdminSubmit} className="login-auth-form">
            <div className="form-input-group">
              <label htmlFor="admin-email-field">Workplace Email</label>
              <div className="input-with-icon">
                <svg className="field-icon-svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <rect width="20" height="16" x="2" y="4" rx="2" />
                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                </svg>
                <input
                  id="admin-email-field"
                  name="email"
                  type="email"
                  required
                  placeholder="name@sikharfleet.com"
                  value={email}
                  onChange={handleFieldChange(setEmail)}
                  autoComplete="email"
                  className="auth-text-input"
                  aria-invalid={Boolean(error)}
                />
              </div>
            </div>

            <div className="form-input-group">
              <label htmlFor="admin-pass-field">Password</label>
              <div className="input-with-icon">
                <Lock size={16} className="field-icon-svg" />
                <input
                  id="admin-pass-field"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  placeholder="Enter your password"
                  value={password}
                  onChange={handleFieldChange(setPassword)}
                  autoComplete="current-password"
                  className="auth-text-input"
                  aria-invalid={Boolean(error)}
                />
                <button
                  type="button"
                  className="btn-password-visibility"
                  onClick={() => setShowPassword((visible) => !visible)}
                  title={showPassword ? 'Hide password' : 'Show password'}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <label className="checkbox-custom-label">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(event) => setRememberMe(event.target.checked)}
              />
              <span>Remember this workstation</span>
            </label>

            <button type="submit" className="btn-login-submit" disabled={loading}>
              {loading ? (
                <span className="submit-loading-state">
                  <span className="loading-spinner-circle" />
                  <span>Authorizing...</span>
                </span>
              ) : (
                <span className="submit-normal-state">
                  <span>Open Admin Panel</span>
                  <ArrowRight size={16} />
                </span>
              )}
            </button>
          </form>

          <div className="login-form-footer">
            {onBackToHome && (
              <button type="button" className="login-back-home-btn" onClick={onBackToHome}>
                <span aria-hidden="true">←</span> Back to Sikhar Fleet
              </button>
            )}
            <span>© 2026 Sikhar Fleet Private Limited · Central Hub Terminal</span>
          </div>
        </div>
      </div>
    </div>
  );
}
