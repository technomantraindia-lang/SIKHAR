import React, { useState } from 'react';
import {
  Home,
  Truck,
  Users,
  Car,
  Activity,
  Wrench,
  Fuel,
  FileText,
  Receipt,
  Shield,
  BarChart3,
  Settings,
  ChevronRight,
  LogOut,
  ArrowLeftRight,
  Plus,
  Wallet
} from '../common/Icons';

// Grouped Menu Sections matching User Screenshot & Wireframe v8
const MENU_SECTIONS = [
  {
    title: 'OPERATIONS',
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: Home, hasSubmenu: false },
      { id: 'fleet', label: 'Fleet Control Tower', icon: Truck, hasSubmenu: false },
      { id: 'drivers', label: 'Drivers', icon: Users, hasSubmenu: false },
      {
        id: 'vehicles',
        label: 'Vehicles',
        icon: Car,
        hasSubmenu: true,
        subItems: [
          { id: 'vehicles', label: 'All Vehicles', icon: Car },
          { id: 'vehicle-assignments', label: 'Vehicle Assignment', icon: ArrowLeftRight }
        ]
      },
      { id: 'trips', label: 'Trips', icon: Activity, hasSubmenu: false },
      { id: 'maintenance', label: 'Maintenance', icon: Wrench, hasSubmenu: false },
      { id: 'fuel', label: 'Fuel', icon: Fuel, hasSubmenu: false },
      { id: 'compliance', label: 'RTO & Compliance', icon: Shield, hasSubmenu: false }
    ]
  },
  {
    title: 'RENTALS & COLLECTIONS',
    items: [
      { id: 'bookings', label: 'Bookings / Leases', icon: FileText, hasSubmenu: false },
      { id: 'invoices', label: 'Rental Invoices', icon: Receipt, hasSubmenu: false },
      { id: 'generate-invoice', label: 'Generate Invoice', icon: Plus, hasSubmenu: false },
      { id: 'wallet', label: 'Wallet Health', icon: Wallet, hasSubmenu: false }
    ]
  },
  {
    title: 'FINANCE & CONTROL',
    items: [
      { id: 'finance-overview', label: 'Finance Overview', icon: BarChart3, hasSubmenu: false },
      { id: 'reports', label: 'Reports', icon: BarChart3, hasSubmenu: false },
      { id: 'settings', label: 'Settings', icon: Settings, hasSubmenu: false }
    ]
  }
];

export default function Sidebar({ activeRoute, onSelectRoute, onLogout }) {
  // Only expand when admin clicks on Vehicles
  const [expandedMenus, setExpandedMenus] = useState(() => ({
    vehicles: activeRoute === 'vehicles' || activeRoute === 'vehicle-assignments'
  }));

  const handleItemClick = (item) => {
    if (item.subItems) {
      // Toggle expansion when admin clicks on Vehicles
      setExpandedMenus(prev => ({
        ...prev,
        [item.id]: !prev[item.id]
      }));
      // Navigate to current active or default to the clicked route
      if (activeRoute !== 'vehicles' && activeRoute !== 'vehicle-assignments') {
        onSelectRoute('vehicles');
      }
    } else {
      onSelectRoute(item.id);
    }
  };

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

      {/* Navigation Menu List Organized into Sections */}
      <nav className="sidebar-nav-container">
        {MENU_SECTIONS.map((section, sIdx) => (
          <div key={section.title || sIdx} className="sidebar-nav-section-group">
            <div className="sidebar-section-title">{section.title}</div>
            {section.items.map((item) => {
              const Icon = item.icon;
              const isItemActive = activeRoute === item.id || (item.id === 'invoices' && activeRoute === 'invoice-detail');
              const isChildActive = item.subItems?.some(s => s.id === activeRoute);
              const isParentActive = isItemActive || isChildActive;
              const isExpanded = !!expandedMenus[item.id];

              return (
                <div key={item.id} className="sidebar-nav-item-wrap">
                  <button
                    className={`sidebar-nav-pill ${isParentActive ? 'is-active' : ''} ${isChildActive && !isItemActive ? 'is-family-active' : ''}`}
                    onClick={() => handleItemClick(item)}
                  >
                    <div className="nav-pill-left">
                      <Icon size={17} className="nav-pill-icon" />
                      <span className="nav-pill-label">{item.label}</span>
                    </div>
                    {item.hasSubmenu && (
                      <ChevronRight
                        size={14}
                        className={`nav-pill-chevron ${isExpanded ? 'is-rotated-down' : ''}`}
                      />
                    )}
                  </button>

                  {/* Submenu List - Only shown when admin clicks to expand */}
                  {item.subItems && isExpanded && (
                    <div className="sidebar-submenu-block">
                      {item.subItems.map((sub) => {
                        const SubIcon = sub.icon;
                        const isSubActive = activeRoute === sub.id;
                        return (
                          <button
                            key={sub.id}
                            className={`sidebar-submenu-item ${isSubActive ? 'is-active' : ''}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectRoute(sub.id);
                            }}
                          >
                            <div className="sub-item-left">
                              <span className={`sub-bullet-dot ${isSubActive ? 'active' : ''}`} />
                              <SubIcon size={13} className="sub-item-icon" />
                              <span className="sub-item-label">{sub.label}</span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}

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

      {/* Atmospheric Twilight Highway Car Graphic */}
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
