import React, { useState } from 'react';
import {
  loginAdminApi,
  checkDriverEmailApi,
  registerDriverApi,
  loginDriverApi
} from '../../services/api';
import {
  Lock,
  Eye,
  EyeOff,
  AlertTriangle,
  ArrowRight,
  Shield,
  Car,
  Key,
  Phone,
  CheckCircle2,
  User,
  Sparkles
} from '../common/Icons';

export default function AdminLogin({ onLoginSuccess, onBackToHome }) {
  // Top-level portal selection: 'admin' | 'driver'
  const [portalMode, setPortalMode] = useState('admin');

  // Admin form state
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [adminRemember, setAdminRemember] = useState(true);

  // Driver form state
  // driverTab: 'signin' | 'register'
  const [driverTab, setDriverTab] = useState('signin');
  // driverAuthMethod: 'pin' | 'otp'
  const [driverAuthMethod, setDriverAuthMethod] = useState('pin');
  const [driverIdentifier, setDriverIdentifier] = useState('');
  const [driverPin, setDriverPin] = useState('');
  const [driverOtp, setDriverOtp] = useState('');
  const [otpSentNotice, setOtpSentNotice] = useState(false);
  const [driverRemember, setDriverRemember] = useState(true);

  // Driver registration activation state
  const [regEmail, setRegEmail] = useState('');
  const [verifiedDriver, setVerifiedDriver] = useState(null);
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');

  // Shared state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const clearMessages = () => {
    setError('');
    setSuccessMsg('');
  };

  // Switch top-level portal
  const handleSelectPortal = (mode) => {
    setPortalMode(mode);
    clearMessages();
  };

  // 1. Admin login handler
  const handleAdminSubmit = async (event) => {
    event.preventDefault();
    clearMessages();
    setLoading(true);

    try {
      const result = await loginAdminApi(adminEmail.trim(), adminPassword, adminRemember);
      onLoginSuccess(result.user);
    } catch (err) {
      setError(err.message || 'Invalid administrative credentials. Access restricted to authorized personnel.');
    } finally {
      setLoading(false);
    }
  };

  // 2. Driver sign in handler (Quick PIN or OTP)
  const handleDriverLoginSubmit = async (event) => {
    event.preventDefault();
    clearMessages();

    if (!driverIdentifier.trim()) {
      setError('Please enter your registered mobile number or driver email.');
      return;
    }

    if (driverAuthMethod === 'pin' && (!driverPin || driverPin.length < 4)) {
      setError('Please enter your 4-digit or 6-digit Quick PIN.');
      return;
    }

    if (driverAuthMethod === 'otp' && (!driverOtp || driverOtp.length < 6)) {
      setError('Please enter the 6-digit Mobile OTP sent to your phone.');
      return;
    }

    setLoading(true);
    try {
      const result = await loginDriverApi({
        identifier: driverIdentifier.trim(),
        pin: driverPin,
        otp: driverOtp,
        loginType: driverAuthMethod,
        rememberMe: driverRemember
      });
      onLoginSuccess(result.user);
    } catch (err) {
      if (err.needsRegistration) {
        setError(err.message);
        setTimeout(() => {
          setRegEmail(driverIdentifier.includes('@') ? driverIdentifier : '');
          setDriverTab('register');
        }, 1200);
      } else {
        setError(err.message || 'Driver authentication failed. Please verify credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Trigger simulated Mobile OTP
  const handleRequestOtp = () => {
    if (!driverIdentifier.trim()) {
      setError('Please enter your registered phone number or email first.');
      return;
    }
    setError('');
    setOtpSentNotice(true);
    setDriverOtp('123456');
    setSuccessMsg('Simulated OTP 123456 generated and auto-filled for quick login.');
  };

  // 3. Driver registration: Step 1 Verify Email Gate
  const handleCheckEmailGate = async (event) => {
    event.preventDefault();
    clearMessages();

    if (!regEmail.trim()) {
      setError('Please enter your driver email address.');
      return;
    }

    setLoading(true);
    try {
      const result = await checkDriverEmailApi(regEmail.trim());
      setVerifiedDriver(result.driver);
      setSuccessMsg(`Driver record confirmed for ${result.driver.name} (${result.driver.id}). Please create your Quick PIN below.`);
    } catch (err) {
      setVerifiedDriver(null);
      setError(
        err.message ||
        'This email is not registered in the Sikhar Fleet driver list. Fleet Administrator has not added this email. Please contact fleet management to get enrolled.'
      );
    } finally {
      setLoading(false);
    }
  };

  // 4. Driver registration: Step 2 Set Quick PIN & Activate
  const handleCompleteRegistration = async (event) => {
    event.preventDefault();
    clearMessages();

    if (!newPin || newPin.length < 4) {
      setError('Please create a Quick PIN of at least 4 digits.');
      return;
    }
    if (newPin !== confirmPin) {
      setError('PIN confirmation does not match. Please re-enter.');
      return;
    }

    setLoading(true);
    try {
      const result = await registerDriverApi(regEmail.trim(), newPin, driverRemember);
      setSuccessMsg('Driver profile activated! Launching Driver Hub...');
      setTimeout(() => {
        onLoginSuccess(result.user);
      }, 600);
    } catch (err) {
      setError(err.message || 'Driver account activation failed.');
    } finally {
      setLoading(false);
    }
  };

  // Quick test credential helpers
  const handlePrefillDriver = (email, pin) => {
    setPortalMode('driver');
    setDriverTab('signin');
    setDriverAuthMethod('pin');
    setDriverIdentifier(email);
    setDriverPin(pin);
    clearMessages();
  };

  const handlePrefillUnregistered = () => {
    setPortalMode('driver');
    setDriverTab('register');
    setRegEmail('unknown.driver@gmail.com');
    setVerifiedDriver(null);
    clearMessages();
  };

  return (
    <div className="corp-split-login-container">
      {/* Visual Brand Column */}
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
          <div className="caption-pill">COMMERCIAL MOBILITY GATEWAY</div>
          <p className="caption-text">
            Enterprise fleet telematics, driver rosters, and digital document locker across Delhi NCR.
          </p>
          <div style={{ marginTop: '14px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '11px', background: 'rgba(255,255,255,0.12)', padding: '3px 8px', borderRadius: '4px', color: '#e0f2fe' }}>
              ✓ KYC Document Locker
            </span>
            <span style={{ fontSize: '11px', background: 'rgba(255,255,255,0.12)', padding: '3px 8px', borderRadius: '4px', color: '#e0f2fe' }}>
              ✓ Quick PIN / Mobile OTP
            </span>
            <span style={{ fontSize: '11px', background: 'rgba(255,255,255,0.12)', padding: '3px 8px', borderRadius: '4px', color: '#e0f2fe' }}>
              ✓ Admin Onboarding Gate
            </span>
          </div>
        </div>
      </div>

      {/* Auth Interaction Column */}
      <div className="login-form-column">
        <div className="login-form-wrapper" style={{ maxWidth: '420px' }}>
          
          {/* Top Header */}
          <div className="login-form-header">
            <div className="mobile-only-logo">
              <span className="brand-txt-white">SIKHAR </span>
              <span className="brand-txt-cyan">FLEET</span>
            </div>

            {/* Seamless Dark Segmented Control */}
            <div className="login-portal-segmented">
              <button
                type="button"
                className={`login-portal-tab ${portalMode === 'admin' ? 'active' : ''}`}
                onClick={() => handleSelectPortal('admin')}
              >
                <Shield size={15} />
                <span>Sign In as Admin</span>
              </button>

              <button
                type="button"
                className={`login-portal-tab ${portalMode === 'driver' ? 'active driver-tab-active' : ''}`}
                onClick={() => handleSelectPortal('driver')}
              >
                <Car size={15} />
                <span>Sign In / Register Driver</span>
              </button>
            </div>

            {portalMode === 'admin' ? (
              <>
                <h1 className="login-heading">Admin Terminal</h1>
                <p className="login-subheading">Sign in with authorized staff credentials to manage fleet operations.</p>
                <div className="login-security-note">
                  <span className="login-security-dot" aria-hidden="true" />
                  <span>Authorized administrator access only</span>
                </div>
              </>
            ) : (
              <>
                <h1 className="login-heading">Driver Mobile Portal</h1>
                <p className="login-subheading">Access your KYC verification badges, digital DL card, and vehicle allocation.</p>

                {/* Driver Sub-Navigation */}
                <div className="driver-subnav-strip">
                  <button
                    type="button"
                    className={`driver-subnav-btn ${driverTab === 'signin' ? 'active' : ''}`}
                    onClick={() => { setDriverTab('signin'); clearMessages(); }}
                  >
                    <Key size={14} />
                    <span>Quick Sign In</span>
                  </button>

                  <button
                    type="button"
                    className={`driver-subnav-btn ${driverTab === 'register' ? 'active' : ''}`}
                    onClick={() => { setDriverTab('register'); clearMessages(); }}
                  >
                    <Sparkles size={14} />
                    <span>Register / Activate Account</span>
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Feedback Alerts */}
          {error && (
            <div className="login-error-alert" role="alert" aria-live="polite">
              <AlertTriangle size={16} style={{ flexShrink: 0 }} />
              <span style={{ fontSize: '12.5px', lineHeight: '1.4' }}>{error}</span>
            </div>
          )}

          {successMsg && (
            <div style={{
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.35)',
              color: '#6ee7b7',
              padding: '10px 14px',
              borderRadius: '8px',
              fontSize: '12.5px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <CheckCircle2 size={16} color="#34d399" style={{ flexShrink: 0 }} />
              <span>{successMsg}</span>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 1. ADMIN LOGIN FORM                                                       */}
          {/* ========================================================================= */}
          {portalMode === 'admin' && (
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
                    value={adminEmail}
                    onChange={(e) => { setAdminEmail(e.target.value); clearMessages(); }}
                    autoComplete="email"
                    className="auth-text-input"
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
                    type={showAdminPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    placeholder="Enter your administrative password"
                    value={adminPassword}
                    onChange={(e) => { setAdminPassword(e.target.value); clearMessages(); }}
                    autoComplete="current-password"
                    className="auth-text-input"
                  />
                  <button
                    type="button"
                    className="btn-password-visibility"
                    onClick={() => setShowAdminPassword((visible) => !visible)}
                    title={showAdminPassword ? 'Hide password' : 'Show password'}
                  >
                    {showAdminPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <label className="checkbox-custom-label">
                <input
                  type="checkbox"
                  checked={adminRemember}
                  onChange={(e) => setAdminRemember(e.target.checked)}
                />
                <span>Remember this workstation</span>
              </label>

              <button type="submit" className="btn-login-submit" disabled={loading}>
                {loading ? (
                  <span className="submit-loading-state">
                    <span className="loading-spinner-circle" />
                    <span>Authorizing Admin...</span>
                  </span>
                ) : (
                  <span className="submit-normal-state">
                    <span>Open Admin Panel</span>
                    <ArrowRight size={16} />
                  </span>
                )}
              </button>

              {/* Demo Helper Button */}
              <div style={{ marginTop: '10px', textAlign: 'center' }}>
                <button
                  type="button"
                  onClick={() => { setAdminEmail('admin@sikharfleet.com'); setAdminPassword('admin123'); }}
                  className="label-action-link"
                >
                  ⚡ Auto-fill Default Admin Credentials (admin@sikharfleet.com)
                </button>
              </div>
            </form>
          )}

          {/* ========================================================================= */}
          {/* 2. DRIVER SIGN IN FORM (QUICK PIN OR OTP)                                  */}
          {/* ========================================================================= */}
          {portalMode === 'driver' && driverTab === 'signin' && (
            <form onSubmit={handleDriverLoginSubmit} className="login-auth-form">
              {/* Method Switcher: PIN vs OTP */}
              <div className="driver-method-toggle">
                <button
                  type="button"
                  className={`driver-method-btn ${driverAuthMethod === 'pin' ? 'active' : ''}`}
                  onClick={() => { setDriverAuthMethod('pin'); clearMessages(); }}
                >
                  <Key size={13} />
                  <span>Quick PIN Login</span>
                </button>
                <button
                  type="button"
                  className={`driver-method-btn ${driverAuthMethod === 'otp' ? 'active' : ''}`}
                  onClick={() => { setDriverAuthMethod('otp'); clearMessages(); }}
                >
                  <Phone size={13} />
                  <span>Mobile OTP Login</span>
                </button>
              </div>

              <div className="form-input-group">
                <label htmlFor="driver-id-field">Registered Email or Mobile Phone</label>
                <div className="input-with-icon">
                  <User size={16} className="field-icon-svg" />
                  <input
                    id="driver-id-field"
                    type="text"
                    required
                    placeholder="e.g. 9628424115 or dhruv.tester@sikharfleet.com"
                    value={driverIdentifier}
                    onChange={(e) => { setDriverIdentifier(e.target.value); clearMessages(); }}
                    className="auth-text-input"
                    autoComplete="username"
                  />
                </div>
              </div>

              {driverAuthMethod === 'pin' ? (
                <div className="form-input-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label htmlFor="driver-pin-field">4 to 6 Digit Quick PIN</label>
                    <button
                      type="button"
                      className="label-action-link"
                      onClick={() => { setDriverTab('register'); clearMessages(); }}
                    >
                      Forgot / Set PIN?
                    </button>
                  </div>
                  <div className="input-with-icon">
                    <Key size={16} className="field-icon-svg" />
                    <input
                      id="driver-pin-field"
                      type="password"
                      maxLength={6}
                      required
                      placeholder="Enter 4-digit PIN (e.g. 1234)"
                      value={driverPin}
                      onChange={(e) => { setDriverPin(e.target.value.replace(/\D/g, '')); clearMessages(); }}
                      className="auth-text-input font-mono"
                      style={{ letterSpacing: driverPin ? '8px' : 'normal', fontSize: driverPin ? '16px' : '13.5px' }}
                      autoComplete="current-password"
                    />
                  </div>
                </div>
              ) : (
                <div className="form-input-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label htmlFor="driver-otp-field">6-Digit Mobile Verification OTP</label>
                    <button
                      type="button"
                      className="label-action-link"
                      onClick={handleRequestOtp}
                    >
                      {otpSentNotice ? 'Resend OTP' : 'Send Demo OTP'}
                    </button>
                  </div>
                  <div className="input-with-icon">
                    <Phone size={16} className="field-icon-svg" />
                    <input
                      id="driver-otp-field"
                      type="text"
                      maxLength={6}
                      required
                      placeholder="Enter 6-digit OTP (e.g. 123456)"
                      value={driverOtp}
                      onChange={(e) => { setDriverOtp(e.target.value.replace(/\D/g, '')); clearMessages(); }}
                      className="auth-text-input font-mono"
                      style={{ letterSpacing: driverOtp ? '8px' : 'normal', fontSize: driverOtp ? '16px' : '13.5px' }}
                    />
                  </div>
                </div>
              )}

              <label className="checkbox-custom-label">
                <input
                  type="checkbox"
                  checked={driverRemember}
                  onChange={(e) => setDriverRemember(e.target.checked)}
                />
                <span>Remember this mobile device</span>
              </label>

              <button type="submit" className="btn-driver-submit" disabled={loading}>
                {loading ? (
                  <span className="submit-loading-state">
                    <span className="loading-spinner-circle" />
                    <span>Verifying Driver...</span>
                  </span>
                ) : (
                  <span className="submit-normal-state">
                    <span>Access Driver Portal</span>
                    <ArrowRight size={16} />
                  </span>
                )}
              </button>

              {/* Demo test chips */}
              <div className="login-test-helper-card">
                <div className="helper-card-header">
                  <Sparkles size={13} color="#38bdf8" />
                  <span>Quick Demo Credential Shortcuts</span>
                </div>
                <div className="helper-chips-row">
                  <button
                    type="button"
                    className="helper-chip-btn"
                    onClick={() => handlePrefillDriver('dhruv.tester@sikharfleet.com', '1234')}
                  >
                    <Car size={13} color="#38bdf8" />
                    <span>Parekh Dhruv (PIN: 1234)</span>
                  </button>
                  <button
                    type="button"
                    className="helper-chip-btn"
                    onClick={() => handlePrefillDriver('sumit@sikharfleet.com', '4321')}
                  >
                    <Car size={13} color="#38bdf8" />
                    <span>Sumit (PIN: 4321)</span>
                  </button>
                  <button
                    type="button"
                    className="helper-chip-btn danger"
                    onClick={handlePrefillUnregistered}
                  >
                    <AlertTriangle size={13} color="#f87171" />
                    <span>Test Unregistered Email</span>
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* ========================================================================= */}
          {/* 3. DRIVER REGISTER GATE (ADMIN ONBOARDING VERIFICATION)                    */}
          {/* ========================================================================= */}
          {portalMode === 'driver' && driverTab === 'register' && (
            <div className="login-auth-form">
              {/* Notice Banner */}
              <div className="driver-gate-info-box">
                <div className="driver-gate-info-title">
                  <Shield size={14} />
                  <span>Admin-Controlled Onboarding Security Gate</span>
                </div>
                <div className="driver-gate-info-desc">
                  Drivers can only register if their email was already enrolled by the Fleet Administrator in the Admin Panel.
                </div>
              </div>

              {!verifiedDriver ? (
                /* Step 1: Check Driver Email */
                <form onSubmit={handleCheckEmailGate} className="login-auth-form">
                  <div className="form-input-group">
                    <label htmlFor="reg-email-field">Enter Your Registered Driver Email Address</label>
                    <div className="input-with-icon">
                      <svg className="field-icon-svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                        <rect width="20" height="16" x="2" y="4" rx="2" />
                        <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                      </svg>
                      <input
                        id="reg-email-field"
                        type="email"
                        required
                        placeholder="e.g. driver@sikharfleet.com or driver@gmail.com"
                        value={regEmail}
                        onChange={(e) => { setRegEmail(e.target.value); clearMessages(); }}
                        className="auth-text-input"
                        autoComplete="email"
                      />
                    </div>
                    <span style={{ fontSize: '11px', color: '#64748b', marginTop: '3px' }}>
                      We verify this email against the official registry created by your Fleet Admin.
                    </span>
                  </div>

                  <button type="submit" className="btn-driver-submit" disabled={loading}>
                    {loading ? (
                      <span className="submit-loading-state">
                        <span className="loading-spinner-circle" />
                        <span>Verifying with Admin Registry...</span>
                      </span>
                    ) : (
                      <span className="submit-normal-state">
                        <span>Verify Registration Eligibility</span>
                        <ArrowRight size={16} />
                      </span>
                    )}
                  </button>

                  <div style={{ marginTop: '8px', textAlign: 'center' }}>
                    <button
                      type="button"
                      className="label-action-link"
                      onClick={() => setDriverTab('signin')}
                    >
                      Already have a PIN? Sign In instead →
                    </button>
                  </div>
                </form>
              ) : (
                /* Step 2: Driver Record Found! Create Quick PIN */
                <form onSubmit={handleCompleteRegistration} className="login-auth-form">
                  <div className="driver-found-verified-card">
                    <div className="driver-found-header">
                      <CheckCircle2 size={16} color="#34d399" />
                      <span>Driver Found in Fleet Roster: {verifiedDriver.name}</span>
                    </div>
                    <div className="driver-found-details">
                      Driver ID: <strong style={{ color: '#ffffff' }}>{verifiedDriver.id}</strong> · Phone: <strong style={{ color: '#ffffff' }}>{verifiedDriver.phone}</strong>
                      {verifiedDriver.vehicle && (
                        <span> · Allocated: <strong style={{ color: '#38bdf8' }}>{verifiedDriver.vehicle.registration}</strong></span>
                      )}
                    </div>
                  </div>

                  <div className="form-input-group">
                    <label htmlFor="create-pin-field">Create Your 4-Digit Quick PIN</label>
                    <div className="input-with-icon">
                      <Key size={16} className="field-icon-svg" />
                      <input
                        id="create-pin-field"
                        type="password"
                        maxLength={6}
                        required
                        placeholder="e.g. 4321"
                        value={newPin}
                        onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                        className="auth-text-input font-mono"
                        style={{ letterSpacing: newPin ? '8px' : 'normal', fontSize: newPin ? '16px' : '13.5px' }}
                      />
                    </div>
                  </div>

                  <div className="form-input-group">
                    <label htmlFor="confirm-pin-field">Confirm Quick PIN</label>
                    <div className="input-with-icon">
                      <Key size={16} className="field-icon-svg" />
                      <input
                        id="confirm-pin-field"
                        type="password"
                        maxLength={6}
                        required
                        placeholder="Re-enter 4-digit PIN"
                        value={confirmPin}
                        onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                        className="auth-text-input font-mono"
                        style={{ letterSpacing: confirmPin ? '8px' : 'normal', fontSize: confirmPin ? '16px' : '13.5px' }}
                      />
                    </div>
                  </div>

                  <button type="submit" className="btn-driver-submit" disabled={loading}>
                    {loading ? (
                      <span className="submit-loading-state">
                        <span className="loading-spinner-circle" />
                        <span>Activating Account...</span>
                      </span>
                    ) : (
                      <span className="submit-normal-state">
                        <span>Activate & Open Driver Hub</span>
                        <ArrowRight size={16} />
                      </span>
                    )}
                  </button>

                  <div style={{ marginTop: '8px', textAlign: 'center' }}>
                    <button
                      type="button"
                      className="label-action-link"
                      onClick={() => { setVerifiedDriver(null); clearMessages(); }}
                    >
                      ← Use a different email
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* Footer Back Link */}
          <div className="login-form-footer">
            {onBackToHome && (
              <button type="button" className="login-back-home-btn" onClick={onBackToHome}>
                <span aria-hidden="true">←</span> Back to Sikhar Fleet
              </button>
            )}
            <div>© 2026 Sikhar Fleet Private Limited · Central Hub Terminal</div>
          </div>

        </div>
      </div>
    </div>
  );
}
