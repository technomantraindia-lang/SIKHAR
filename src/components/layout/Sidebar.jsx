import React from 'react';
import {
  Home,
  Truck,
  Users,
  Car,
  Activity,
  Wrench,
  Fuel,
  FileText,
  Shield,
  BarChart3,
  Settings,
  ChevronRight,
  LogOut
} from '../common/Icons';

// Menu items matching user reference image order & style
const MENU_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: Home, hasSubmenu: false },
  { id: 'fleet', label: 'Fleet', icon: Truck, hasSubmenu: true },
  { id: 'drivers', label: 'Drivers', icon: Users, hasSubmenu: true },
  { id: 'vehicles', label: 'Vehicles', icon: Car, hasSubmenu: true },
  { id: 'trips', label: 'Trips', icon: Activity, hasSubmenu: true },
  { id: 'maintenance', label: 'Maintenance', icon: Wrench, hasSubmenu: false },
  { id: 'fuel', label: 'Fuel', icon: Fuel, hasSubmenu: false },
  { id: 'compliance', label: 'RTO & Compliance', icon: Shield, hasSubmenu: true },
  { id: 'bookings', label: 'Rentals & Billing', icon: FileText, hasSubmenu: true },
  { id: 'finance-overview', label: 'Finance', icon: BarChart3, hasSubmenu: false },
  { id: 'reports', label: 'Reports', icon: BarChart3, hasSubmenu: true },
  { id: 'settings', label: 'Settings', icon: Settings, hasSubmenu: false }
];

export default function Sidebar({ activeRoute, onSelectRoute, onLogout }) {
  return (
    <aside className="sikhar-dark-sidebar-v2">
      {/* Top Brand Logo matching reference */}
      <div className="sidebar-brand-box">
        <div className="sidebar-brand-logo-row">
          <div className="brand-delta-logo">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M12 3L2 21H22L12 3Z" fill="url(#brand-delta-blue)" />
              <path d="M12 7.5L5.5 19H18.5L12 7.5Z" fill="#081026" />
              <defs>
                <linearGradient id="brand-delta-blue" x1="2" y1="3" x2="22" y2="21" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#38bdf8" />
                  <stop offset="1" stopColor="#1d68f0" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <div className="brand-text-col">
            <div className="brand-title-main">
              <span className="brand-white">SIKHAR </span>
              <span className="brand-cyan">FLEET</span>
            </div>
            <div className="brand-tagline-sub">TO PEAK TO SIKHAR</div>
          </div>
        </div>
      </div>

      {/* Navigation Menu List */}
      <nav className="sidebar-nav-container">
        {MENU_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeRoute === item.id;
          return (
            <button
              key={item.id}
              className={`sidebar-nav-pill ${isActive ? 'is-active' : ''}`}
              onClick={() => onSelectRoute(item.id)}
            >
              <div className="nav-pill-left">
                <Icon size={17} className="nav-pill-icon" />
                <span className="nav-pill-label">{item.label}</span>
              </div>
              {item.hasSubmenu && (
                <ChevronRight size={14} className="nav-pill-chevron" />
              )}
            </button>
          );
        })}

        {/* Menu Divider */}
        <div className="sidebar-nav-divider"></div>

        {/* Dedicated Menu Log Out Button */}
        <button
          className="sidebar-nav-pill sidebar-logout-pill"
          onClick={onLogout}
          title="Sign out of administrative terminal"
        >
          <div className="nav-pill-left">
            <LogOut size={17} className="nav-pill-icon logout-icon" />
            <span className="nav-pill-label">Log Out</span>
          </div>
          <span className="sidebar-logout-tag">Exit</span>
        </button>
      </nav>

      {/* Atmospheric Twilight Highway Car Graphic (Replacing truck as requested) */}
      <div className="sidebar-bottom-car-banner">
        <div className="car-banner-img-wrap">
          <img 
            src="/images/sidebar_car_twilight.jpg" 
            alt="Sikhar Fleet Vehicle on Mountain Highway"
            className="car-banner-photo"
          />
          <div className="car-banner-vignette"></div>
        </div>
      </div>
    </aside>
  );
}
