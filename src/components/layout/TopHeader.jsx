import React, { useState } from 'react';
import { Search, Clock, Bell, MapPin, ChevronDown, LogOut } from '../common/Icons';

export default function TopHeader({ user, onLogout }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  return (
    <header className="sikhar-top-header">
      {/* 1. Left: Brand & Entity Identification */}
      <div className="header-brand-block">
        <div className="brand-logo-text-group">
          <div className="brand-logo-sikhar">SIKHAR</div>
          <div className="brand-logo-fleet">FLEET</div>
          <div className="brand-logo-tagline">TO PEAK TO SIKHAR</div>
        </div>

        <div className="header-divider-v"></div>

        <div className="header-company-block">
          <div className="company-title">Sikhar Fleet Private Limited</div>
          <div className="company-subtitle">
            <MapPin size={12} className="company-pin-icon" />
            <span>Delhi NCR Central Hub • Operations Terminal</span>
          </div>
        </div>
      </div>

      {/* 2. Center: Global Search Bar */}
      <div className="header-search-container">
        <div className="search-pill-box">
          <Search size={15} className="search-icon" />
          <input
            type="text"
            placeholder="Search vehicle number (e.g. DL52GD6605), driver, job card..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <span className="search-shortcut-tag">Ctrl K</span>
        </div>
      </div>

      {/* 3. Right: Telemetry & Profile Controls */}
      <div className="header-telemetry-block">
        {/* Live Operational Status */}
        <div className="live-status-pill">
          <span className="status-live-dot"></span>
          <span>Fleet Live: <strong>64/72 On-Road</strong></span>
        </div>

        {/* Operational Clock */}
        <div className="time-status-pill">
          <Clock size={13} className="time-clock-icon" />
          <span>09:42 AM IST</span>
        </div>

        {/* Notifications */}
        <div className="notif-wrapper">
          <button
            className="notif-bell-btn"
            onClick={() => setShowNotifications(!showNotifications)}
            title="Operational Alerts"
            aria-label="Alerts"
          >
            <Bell size={16} />
            <span className="notif-counter-badge">3</span>
          </button>

          {showNotifications && (
            <div className="notif-dropdown-card">
              <div className="notif-dropdown-head">
                <h4>Operational Alerts (3 Active)</h4>
                <button onClick={() => setShowNotifications(false)}>×</button>
              </div>
              <div className="notif-dropdown-list">
                <div className="notif-item danger">
                  <div className="notif-item-title">3 vehicles in maintenance</div>
                  <div className="notif-item-sub">Require immediate attention</div>
                </div>
                <div className="notif-item warning">
                  <div className="notif-item-title">5 challans pending</div>
                  <div className="notif-item-sub">Action required with transport auth</div>
                </div>
                <div className="notif-item info">
                  <div className="notif-item-title">Insurance due next 7 days</div>
                  <div className="notif-item-sub">3 vehicles pending inspection</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* User Profile Pill */}
        <div className="profile-pill-container">
          <button 
            className="profile-pill-btn"
            onClick={() => setShowProfileMenu(!showProfileMenu)}
          >
            <div className="profile-avatar-circle">
              {user?.initials || 'FA'}
            </div>
            <div className="profile-details-col">
              <span className="profile-name-text">{user?.name || 'Fleet Administrator'}</span>
              <span className="profile-role-text">{user?.role || 'Administrator'}</span>
            </div>
            <ChevronDown size={14} className="profile-chevron" />
          </button>

          {showProfileMenu && (
            <div className="profile-dropdown-card">
              <div className="profile-dropdown-user">
                <div className="dropdown-user-name">{user?.name || 'Fleet Administrator'}</div>
                <div className="dropdown-user-email">{user?.email || 'admin@sikharfleet.com'}</div>
              </div>
              <button className="dropdown-signout-row" onClick={onLogout}>
                <LogOut size={14} />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>

        {/* Direct Quick Log Out Button */}
        <button
          className="header-direct-logout-btn"
          onClick={onLogout}
          title="Sign out of administrative terminal"
        >
          <LogOut size={14} />
          <span>Log Out</span>
        </button>
      </div>
    </header>
  );
}
