import React, { useState, useEffect } from 'react';
import TopHeader from './components/layout/TopHeader';
import Sidebar from './components/layout/Sidebar';
import ExecutiveDashboard from './components/dashboard/ExecutiveDashboard';
import FleetControlTower from './components/fleet/FleetControlTower';
import DriverControlTower from './components/drivers/DriverControlTower';
import VehicleManager from './components/vehicles/VehicleManager';
import ModuleViewer from './components/dashboard/ModuleViewer';
import AdminLogin from './components/auth/AdminLogin';
import { getCachedAdminUser, logoutAdminApi } from './services/api';
import './App.css';

// Read initial route from URL hash or localStorage so refreshing stays on the active view
const getInitialRoute = () => {
  try {
    const hash = window.location.hash.replace(/^#\/?/, '').trim();
    if (hash) return hash;
    const stored = localStorage.getItem('sikhar_active_route');
    if (stored) return stored;
  } catch {
    // fallback
  }
  return 'dashboard';
};

export default function App() {
  const [adminUser, setAdminUser] = useState(() => getCachedAdminUser());
  const [activeRoute, setActiveRoute] = useState(getInitialRoute);

  // Centralized navigation function syncing state, localStorage, and URL hash
  const navigateTo = (target) => {
    if (!target) return;
    setActiveRoute(target);
    try {
      localStorage.setItem('sikhar_active_route', target);
      if (window.location.hash !== `#/${target}`) {
        window.location.hash = `#/${target}`;
      }
    } catch {
      // ignore
    }
  };

  // Sync hash changes (Browser Back / Forward / Direct URL anchor)
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace(/^#\/?/, '').trim();
      if (hash && hash !== activeRoute) {
        setActiveRoute(hash);
        try {
          localStorage.setItem('sikhar_active_route', hash);
        } catch {
          // ignore
        }
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [activeRoute]);

  // Ensure URL hash matches current route on initial load
  useEffect(() => {
    const initial = getInitialRoute();
    if (window.location.hash !== `#/${initial}`) {
      window.location.hash = `#/${initial}`;
    }
  }, []);

  const handleLoginSuccess = (user) => {
    setAdminUser(user);
    const lastRoute = getInitialRoute();
    navigateTo(lastRoute);
  };

  const handleLogout = () => {
    logoutAdminApi();
    setAdminUser(null);
  };

  // Phase 1: If Admin is not authenticated, strictly show dedicated Admin Security Gateway
  if (!adminUser) {
    return <AdminLogin onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="terminal-app-shell">
      {/* Precision Top Header */}
      <TopHeader
        user={adminUser}
        onLogout={handleLogout}
      />

      {/* Main Split Layout */}
      <div className="terminal-body-layout">
        {/* Institutional Left Sidebar */}
        <Sidebar
          activeRoute={activeRoute}
          onSelectRoute={(id) => navigateTo(id)}
          onLogout={handleLogout}
        />

        {/* Executive Screen Body */}
        <main className="terminal-main-stage">
          {activeRoute === 'dashboard' ? (
            <ExecutiveDashboard
              user={adminUser}
              onNavigate={(target) => navigateTo(target)}
            />
          ) : activeRoute === 'fleet' ? (
            <FleetControlTower
              onNavigate={(target) => navigateTo(target)}
            />
          ) : activeRoute === 'drivers' ? (
            <DriverControlTower
              onNavigate={(target) => navigateTo(target)}
            />
          ) : activeRoute === 'vehicles' ? (
            <VehicleManager
              onNavigate={(target) => navigateTo(target)}
              onBackToDashboard={() => navigateTo('dashboard')}
            />
          ) : (
            <ModuleViewer
              routeId={activeRoute}
              onBackToDashboard={() => navigateTo('dashboard')}
            />
          )}
        </main>
      </div>
    </div>
  );
}
