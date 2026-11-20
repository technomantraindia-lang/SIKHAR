import React, { useState, useEffect } from 'react';
import DriverSidebar from './DriverSidebar';
import DriverTopHeader from './DriverTopHeader';
import DriverDashboardOverview from './DriverDashboardOverview';
import DriverKycLockerView from './DriverKycLockerView';
import DriverWalletView from './DriverWalletView';
import DriverVehicleView from './DriverVehicleView';
import DriverInvoicesView from './DriverInvoicesView';
import DriverShiftsView from './DriverShiftsView';
import DriverSupportView from './DriverSupportView';
import {
  Home,
  Shield,
  CreditCard,
  Car,
  AlertTriangle,
  Receipt
} from '../common/Icons';
import { fetchDriverProfileApi } from '../../services/api';

const DRIVER_ROUTES = new Set([
  'overview',
  'kyc',
  'documents',
  'wallet',
  'invoices',
  'vehicle',
  'shifts',
  'support'
]);

function getDriverRouteStorageKey(driver) {
  return `sikhar_driver_active_route_${driver?.id || 'current'}`;
}

function getInitialDriverRoute(driver) {
  try {
    const savedRoute = localStorage.getItem(getDriverRouteStorageKey(driver));
    return DRIVER_ROUTES.has(savedRoute) ? savedRoute : 'overview';
  } catch {
    return 'overview';
  }
}

export default function DriverPortalShell({ user, onLogout }) {
  const [driverUser, setDriverUser] = useState(user);
  const [activeRoute, setActiveRoute] = useState(() => getInitialDriverRoute(user));
  const [dutyStatus, setDutyStatus] = useState(user?.status || 'On Duty');
  const [refreshing, setRefreshing] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const driverRouteStorageKey = getDriverRouteStorageKey(driverUser);

  // Sync profile from backend
  const refreshProfile = async () => {
    try {
      setRefreshing(true);
      const updated = await fetchDriverProfileApi();
      if (updated) {
        setDriverUser(updated);
        if (updated.status) setDutyStatus(updated.status);
      }
    } catch (err) {
      console.warn('Driver profile refresh warning:', err);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    refreshProfile();
  }, []);

  // Keep the driver portal section stable across browser refreshes. This is
  // intentionally separate from the admin route storage so the two consoles
  // never overwrite each other's last page.
  useEffect(() => {
    try {
      localStorage.setItem(driverRouteStorageKey, activeRoute);
    } catch {
      // Ignore storage restrictions; navigation still works in-session.
    }
  }, [activeRoute, driverRouteStorageKey]);

  const navigateDriverRoute = (route) => {
    if (!DRIVER_ROUTES.has(route)) return;
    setActiveRoute(route);
    setIsMobileOpen(false);
  };

  const handleToggleDuty = () => {
    const nextStatus = dutyStatus === 'On Duty' ? 'Off Duty' : 'On Duty';
    setDutyStatus(nextStatus);
    setDriverUser((prev) => ({ ...prev, status: nextStatus }));
  };

  const handleUpdateDuty = (status) => {
    setDutyStatus(status);
    setDriverUser((prev) => ({ ...prev, status }));
  };

  return (
    <div className="driver-portal-layout" style={{
      minHeight: '100vh',
      display: 'flex',
      background: '#f8fafc',
      fontFamily: 'Inter, system-ui, -apple-system, sans-serif'
    }}>
      {/* 1. Left Luxury Dark Sidebar */}
      <DriverSidebar
        activeRoute={activeRoute}
        onSelectRoute={navigateDriverRoute}
        driverUser={driverUser}
        onLogout={onLogout}
        onToggleDuty={handleToggleDuty}
        dutyStatus={dutyStatus}
        onRefresh={refreshProfile}
        refreshing={refreshing}
        isMobileOpen={isMobileOpen}
        onCloseMobile={() => setIsMobileOpen(false)}
      />

      {/* 2. Right Main Working Stage */}
      <div style={{
        flex: 1,
        minWidth: 0,
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Top Header */}
        <DriverTopHeader
          activeRoute={activeRoute}
          driverUser={driverUser}
          dutyStatus={dutyStatus}
          onToggleDuty={handleToggleDuty}
          onRefresh={refreshProfile}
          refreshing={refreshing}
          onOpenMobileMenu={() => setIsMobileOpen(true)}
          onSelectRoute={navigateDriverRoute}
          onLogout={onLogout}
        />

        {/* Main Content Area */}
        <main
          className="driver-main-stage"
          style={{
            flex: 1,
            padding: '24px 28px',
            maxWidth: '1500px',
            margin: '0 auto',
            width: '100%',
            boxSizing: 'border-box',
            paddingBottom: '80px'
          }}
        >
          {activeRoute === 'overview' && (
            <DriverDashboardOverview
              driverUser={driverUser}
              onNavigate={navigateDriverRoute}
              onToggleDuty={handleToggleDuty}
              dutyStatus={dutyStatus}
              onRefresh={refreshProfile}
              refreshing={refreshing}
            />
          )}

          {(activeRoute === 'kyc' || activeRoute === 'documents') && (
            <DriverKycLockerView
              driverUser={driverUser}
              onRefresh={refreshProfile}
              refreshing={refreshing}
            />
          )}

          {activeRoute === 'wallet' && (
            <DriverWalletView
              driverUser={driverUser}
              onRefresh={refreshProfile}
              refreshing={refreshing}
            />
          )}

          {activeRoute === 'invoices' && (
            <DriverInvoicesView
              driverUser={driverUser}
            />
          )}

          {activeRoute === 'vehicle' && (
            <DriverVehicleView
              driverUser={driverUser}
              onRefresh={refreshProfile}
              refreshing={refreshing}
            />
          )}

          {activeRoute === 'shifts' && (
            <DriverShiftsView
              driverUser={driverUser}
            />
          )}

          {activeRoute === 'support' && (
            <DriverSupportView
              driverUser={driverUser}
            />
          )}
        </main>

        {/* 3. Mobile Quick Bottom Navigation (Appears on touch/mobile screens) */}
        <nav className="driver-mobile-bottom-nav">
          {[
            { id: 'overview', label: 'Home', icon: Home },
            { id: 'kyc', label: 'KYC Hub', icon: Shield },
            { id: 'wallet', label: 'Wallet', icon: CreditCard },
            { id: 'vehicle', label: 'Vehicle', icon: Car },
            { id: 'invoices', label: 'Invoices', icon: Receipt }
          ].map((item) => {
            const Icon = item.icon;
            const isActive = activeRoute === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => navigateDriverRoute(item.id)}
                className={`driver-bottom-nav-item ${isActive ? 'is-active' : ''}`}
                title={item.label}
              >
                <Icon size={19} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
