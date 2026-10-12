import React, { useState, useEffect } from 'react';
import VehicleMasterPage from './VehicleMasterPage';
import VehicleDetailPage from './VehicleDetailPage';
import AddVehiclePage from './AddVehiclePage';
import VehicleAssignmentPage from './VehicleAssignmentPage';

export default function VehicleManager({ subRoute = null, initialVehicleId = null, onNavigate, onBackToDashboard }) {
  const getInitialView = () => {
    if (subRoute === 'assignment') return 'assignment';
    if (initialVehicleId) return 'detail';
    try {
      const savedMode = localStorage.getItem('sikhar_vehicle_view_mode');
      const savedId = localStorage.getItem('sikhar_vehicle_selected_id');
      if (savedMode === 'assignment') return 'assignment';
      if (savedMode === 'detail' && savedId) return 'detail';
      if (savedMode === 'add') return 'add';
    } catch {
      // fallback
    }
    return 'master';
  };

  const getInitialId = () => {
    if (initialVehicleId) return initialVehicleId;
    try {
      return localStorage.getItem('sikhar_vehicle_selected_id') || null;
    } catch {
      return null;
    }
  };

  const [viewMode, setViewMode] = useState(getInitialView);
  const [selectedVehicleId, setSelectedVehicleId] = useState(getInitialId);

  // Sync subRoute prop changes from sidebar navigation
  useEffect(() => {
    if (subRoute === 'assignment') {
      setViewMode('assignment');
      try {
        localStorage.setItem('sikhar_vehicle_view_mode', 'assignment');
      } catch {
        // ignore
      }
    } else if (subRoute === 'master' && viewMode === 'assignment') {
      setViewMode('master');
      try {
        localStorage.setItem('sikhar_vehicle_view_mode', 'master');
      } catch {
        // ignore
      }
    }
  }, [subRoute]);

  const handleSelectVehicle = (vehicleId) => {
    setSelectedVehicleId(vehicleId);
    setViewMode('detail');
    try {
      localStorage.setItem('sikhar_vehicle_view_mode', 'detail');
      localStorage.setItem('sikhar_vehicle_selected_id', vehicleId);
    } catch {
      // ignore
    }
  };

  const handleOpenAddVehicle = () => {
    setViewMode('add');
    try {
      localStorage.setItem('sikhar_vehicle_view_mode', 'add');
    } catch {
      // ignore
    }
  };

  const handleOpenAssignment = () => {
    setViewMode('assignment');
    if (onNavigate) {
      onNavigate('vehicle-assignments');
    }
    try {
      localStorage.setItem('sikhar_vehicle_view_mode', 'assignment');
    } catch {
      // ignore
    }
  };

  const handleBackToMaster = () => {
    setViewMode('master');
    setSelectedVehicleId(null);
    if (onNavigate) {
      onNavigate('vehicles');
    }
    try {
      localStorage.setItem('sikhar_vehicle_view_mode', 'master');
      localStorage.removeItem('sikhar_vehicle_selected_id');
    } catch {
      // ignore
    }
  };

  const handleAddSuccess = (newVehicle) => {
    if (newVehicle && newVehicle.id) {
      handleSelectVehicle(newVehicle.id);
    } else {
      handleBackToMaster();
    }
  };

  const handleNavigateToDriver = (_driverName) => {
    if (onNavigate) {
      onNavigate('drivers');
    }
  };

  if (viewMode === 'detail' && selectedVehicleId) {
    return (
      <VehicleDetailPage
        vehicleId={selectedVehicleId}
        onBack={handleBackToMaster}
        onNavigateToDriver={handleNavigateToDriver}
      />
    );
  }

  if (viewMode === 'add') {
    return (
      <AddVehiclePage
        onBack={handleBackToMaster}
        onSuccess={handleAddSuccess}
      />
    );
  }

  if (viewMode === 'assignment') {
    return (
      <VehicleAssignmentPage
        onNavigateToAllVehicles={handleBackToMaster}
        onNavigateToAddVehicle={handleOpenAddVehicle}
        onBackToDashboard={onBackToDashboard}
      />
    );
  }

  return (
    <VehicleMasterPage
      onSelectVehicle={handleSelectVehicle}
      onOpenAddVehicle={handleOpenAddVehicle}
      onOpenAssignment={handleOpenAssignment}
      onBackToDashboard={onBackToDashboard}
    />
  );
}
