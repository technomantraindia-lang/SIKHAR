import React, { useState } from 'react';
import VehicleMasterPage from './VehicleMasterPage';
import VehicleDetailPage from './VehicleDetailPage';
import AddVehiclePage from './AddVehiclePage';

export default function VehicleManager({ initialVehicleId = null, onNavigate, onBackToDashboard }) {
  const getInitialView = () => {
    if (initialVehicleId) return 'detail';
    try {
      const savedMode = localStorage.getItem('sikhar_vehicle_view_mode');
      const savedId = localStorage.getItem('sikhar_vehicle_selected_id');
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

  const handleBackToMaster = () => {
    setViewMode('master');
    setSelectedVehicleId(null);
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

  return (
    <VehicleMasterPage
      onSelectVehicle={handleSelectVehicle}
      onOpenAddVehicle={handleOpenAddVehicle}
      onBackToDashboard={onBackToDashboard}
    />
  );
}
