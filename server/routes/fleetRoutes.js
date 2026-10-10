import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const fleetDataPath = path.join(__dirname, '../data/fleet.json');

// Helper to read fleet data
function getFleetData() {
  const raw = fs.readFileSync(fleetDataPath, 'utf-8');
  return JSON.parse(raw);
}

// Helper to write fleet data
function saveFleetData(data) {
  fs.writeFileSync(fleetDataPath, JSON.stringify(data, null, 2), 'utf-8');
}

// GET /api/fleet - Returns full Fleet Control Tower state
router.get('/', (req, res) => {
  try {
    const data = getFleetData();
    const { status, search } = req.query;

    let filteredVehicles = data.vehicles;

    if (status && status !== 'all') {
      const normalizedStatus = status.toLowerCase();
      filteredVehicles = filteredVehicles.filter(v => 
        v.status.toLowerCase().includes(normalizedStatus) ||
        (normalizedStatus === 'onroad' && v.status === 'On Road') ||
        (normalizedStatus === 'workshop' && v.status === 'At Workshop') ||
        (normalizedStatus === 'ready' && v.status === 'Ready to Deploy') ||
        (normalizedStatus === 'breakdown' && v.status === 'Breakdown') ||
        (normalizedStatus === 'nonops' && (v.status.includes('Non-Ops') || v.status.includes('Leave')))
      );
    }

    if (search) {
      const query = search.toLowerCase();
      filteredVehicles = filteredVehicles.filter(v => 
        v.registration.toLowerCase().includes(query) ||
        v.driver.toLowerCase().includes(query) ||
        v.location.toLowerCase().includes(query) ||
        v.model.toLowerCase().includes(query)
      );
    }

    return res.json({
      success: true,
      data: {
        ...data,
        vehicles: filteredVehicles
      }
    });
  } catch (error) {
    console.error('Fleet read error:', error);
    return res.status(500).json({ success: false, message: 'Failed to load fleet data.' });
  }
});

// GET /api/fleet/vehicles/:id - Returns single vehicle details
router.get('/vehicles/:id', (req, res) => {
  try {
    const data = getFleetData();
    const vehicleId = req.params.id.toUpperCase();
    const vehicle = data.vehicles.find(v => v.id.toUpperCase() === vehicleId || v.registration.toUpperCase() === vehicleId);

    if (!vehicle) {
      return res.status(404).json({ success: false, message: `Vehicle ${vehicleId} not found in master records.` });
    }

    return res.json({ success: true, vehicle });
  } catch {
    return res.status(500).json({ success: false, message: 'Failed to retrieve vehicle details.' });
  }
});

// POST /api/fleet/vehicles - Registers a new vehicle asset into Vehicle Master
router.post('/vehicles', (req, res) => {
  try {
    const data = getFleetData();
    const newVehicle = req.body;

    if (!newVehicle.registration) {
      return res.status(400).json({ success: false, message: 'Vehicle registration plate is required.' });
    }

    const regPlate = newVehicle.registration.trim().toUpperCase().replace(/\s+/g, '');
    const existing = data.vehicles.find(v => v.registration.toUpperCase() === regPlate);
    if (existing) {
      return res.status(409).json({ success: false, message: `Vehicle ${regPlate} is already registered in Vehicle Master.` });
    }

    const vehicleRecord = {
      id: regPlate,
      registration: regPlate,
      model: newVehicle.model || 'TATA TIGOR EV XPRESS T',
      type: newVehicle.type || (newVehicle.model?.toLowerCase().includes('cng') ? 'CNG' : 'EV'),
      connectorType: newVehicle.connectorType || (newVehicle.type === 'CNG' ? 'Standard CNG Valve' : 'CCS2 (Combined Charging System)'),
      driver: newVehicle.driver || 'Unassigned',
      driverPhone: newVehicle.driverPhone || '—',
      driverStatus: newVehicle.driver && newVehicle.driver !== 'Unassigned' ? 'Assigned' : 'Available in Yard',
      status: newVehicle.status || 'Ready to Deploy',
      location: newVehicle.hub || newVehicle.location || 'Sikhar Hub Central Yard',
      hub: newVehicle.hub || 'Sikhar Central Yard',
      since: 'Just registered',
      duration: '0d 0h',
      nextAction: newVehicle.status === 'Ready to Deploy' ? 'Put on Road' : 'Commissioning Review',
      actionType: newVehicle.status === 'Ready to Deploy' ? 'PUT_ON_ROAD' : 'NORMAL',
      odometer: newVehicle.odometer ? `${Number(newVehicle.odometer).toLocaleString('en-IN')} km` : '100 km',
      battery: newVehicle.battery || (newVehicle.type === 'CNG' ? '100% (CNG Full)' : '100%'),
      health: 'Healthy',
      healthStatus: 'good',
      service: `Next service · ${newVehicle.nextService || '30 Nov 2026'}`,
      permit: `Valid · ${newVehicle.permitExpiry || '31 Dec 2026'}`,
      insurance: `Valid · ${newVehicle.insuranceExpiry || '31 Dec 2026'}`,
      fitness: `Valid · ${newVehicle.fitnessExpiry || '31 Dec 2027'}`,
      puc: `Valid · ${newVehicle.pucExpiry || '30 Jun 2027'}`,
      chassis: newVehicle.chassis || `MAT612034NJB${Math.floor(10000 + Math.random() * 90000)}`,
      lender: newVehicle.lender || 'Signo Financing',
      monthlyEmi: newVehicle.monthlyEmi ? (newVehicle.monthlyEmi.startsWith('₹') ? newVehicle.monthlyEmi : `₹${newVehicle.monthlyEmi}`) : '₹21,000',
      challansCount: 0,
      challansAmount: '₹0',
      dailyRentRate: newVehicle.dailyRentRate ? (newVehicle.dailyRentRate.startsWith('₹') ? newVehicle.dailyRentRate : `₹${newVehicle.dailyRentRate}`) : '₹1,150',
      notes: newVehicle.notes || 'Vehicle newly inducted into Sikhar fleet asset registry.',
      assignmentHistory: [
        {
          driver: newVehicle.driver && newVehicle.driver !== 'Unassigned' ? newVehicle.driver : 'In Yard Inventory',
          shiftType: '24-Hour Dedicated',
          fromDate: '10 Oct 2026',
          toDate: 'Present',
          handoverKm: newVehicle.odometer ? `${newVehicle.odometer} km` : '100 km',
          status: 'Active'
        }
      ]
    };

    data.vehicles.unshift(vehicleRecord);

    // Update fleet metrics
    data.summary.metrics.totalFleet.value = data.vehicles.length;
    data.summary.metrics.onRoad.value = data.vehicles.filter(v => v.status === 'On Road').length;
    data.summary.metrics.atWorkshop.value = data.vehicles.filter(v => v.status === 'At Workshop').length;
    data.summary.metrics.readyToDeploy.value = data.vehicles.filter(v => v.status === 'Ready to Deploy').length;
    data.summary.metrics.breakdown.value = data.vehicles.filter(v => v.status === 'Breakdown').length;

    saveFleetData(data);

    return res.status(201).json({
      success: true,
      message: `Vehicle ${regPlate} successfully added to Vehicle Master.`,
      vehicle: vehicleRecord
    });
  } catch (error) {
    console.error('Error creating vehicle asset:', error);
    return res.status(500).json({ success: false, message: 'Failed to onboard vehicle asset.' });
  }
});

// PUT /api/fleet/vehicles/:id/status - Update operational status
router.put('/vehicles/:id/status', (req, res) => {
  try {
    const { status, reason, driver, nextAction } = req.body;
    const vehicleId = req.params.id.toUpperCase();
    const data = getFleetData();

    const vehicle = data.vehicles.find(v => v.id.toUpperCase() === vehicleId || v.registration.toUpperCase() === vehicleId);
    if (!vehicle) {
      return res.status(404).json({ success: false, message: 'Vehicle not found.' });
    }

    const previousStatus = vehicle.status;
    vehicle.status = status;
    vehicle.since = 'Updated just now';
    if (reason) {
      vehicle.notes = `${vehicle.notes || ''} [Status change: ${previousStatus} → ${status} (${reason}) - ${new Date().toLocaleTimeString('en-IN')}]`;
    }
    if (driver !== undefined) vehicle.driver = driver;
    if (nextAction) vehicle.nextAction = nextAction;

    // Recalculate summary metrics
    data.summary.metrics.onRoad.value = data.vehicles.filter(v => v.status === 'On Road').length;
    data.summary.metrics.atWorkshop.value = data.vehicles.filter(v => v.status === 'At Workshop').length;
    data.summary.metrics.readyToDeploy.value = data.vehicles.filter(v => v.status === 'Ready to Deploy').length;
    data.summary.metrics.breakdown.value = data.vehicles.filter(v => v.status === 'Breakdown').length;

    saveFleetData(data);

    return res.json({
      success: true,
      message: `Vehicle ${vehicleId} status updated to ${status}.`,
      vehicle
    });
  } catch (error) {
    console.error('Error updating vehicle status:', error);
    return res.status(500).json({ success: false, message: 'Failed to update vehicle status.' });
  }
});

// POST /api/fleet/vehicles/:id/action - Executes operational action
router.post('/vehicles/:id/action', (req, res) => {
  try {
    const { actionType, payload } = req.body;
    const vehicleId = req.params.id.toUpperCase();
    const data = getFleetData();

    const vehicleIndex = data.vehicles.findIndex(v => v.id.toUpperCase() === vehicleId || v.registration.toUpperCase() === vehicleId);
    if (vehicleIndex === -1) {
      return res.status(404).json({ success: false, message: 'Vehicle not found.' });
    }

    const vehicle = data.vehicles[vehicleIndex];

    if (actionType === 'PUT_ON_ROAD') {
      vehicle.status = 'On Road';
      vehicle.since = 'Active now';
      vehicle.duration = 'Ongoing Shift';
      vehicle.nextAction = 'Operating normally';
      vehicle.actionType = 'NORMAL';
      if (payload && payload.driver) {
        vehicle.driver = payload.driver;
        vehicle.driverStatus = 'On Duty';
      }
    } else if (actionType === 'ARRANGE_RECOVERY') {
      vehicle.status = 'Breakdown';
      vehicle.nextAction = 'Recovery dispatched';
      vehicle.actionType = 'ARRANGE_RECOVERY';
      vehicle.notes = `${vehicle.notes || ''} [Recovery tow-truck dispatched at ${new Date().toLocaleTimeString('en-IN')}]`;
    } else if (actionType === 'JOB_CARD' || actionType === 'SEND_TO_WORKSHOP') {
      vehicle.status = 'At Workshop';
      vehicle.nextAction = payload?.jobCardNo ? `Job Card #${payload.jobCardNo}` : 'Job Card #JC-2026-00128';
      vehicle.actionType = 'JOB_CARD';
      vehicle.notes = `${vehicle.notes || ''} [Workshop dispatch: ${payload?.reason || 'Service check'}]`;
    } else if (actionType === 'RETURN_TO_YARD') {
      vehicle.status = 'Ready to Deploy';
      vehicle.nextAction = 'Put on Road';
      vehicle.actionType = 'PUT_ON_ROAD';
      vehicle.location = 'Sikhar Hub Central Yard';
    } else if (actionType === 'RESERVE') {
      vehicle.nextAction = `Reserved for ${payload?.driverName || 'Applicant'} (Expires in 2h)`;
      vehicle.notes = `${vehicle.notes || ''} [Reserved: ${payload?.driverName || 'Driver'} on ${new Date().toLocaleDateString('en-IN')}]`;
    }

    // Recalculate summary metrics
    const onRoadCount = data.vehicles.filter(v => v.status === 'On Road').length;
    const workshopCount = data.vehicles.filter(v => v.status === 'At Workshop').length;
    const readyCount = data.vehicles.filter(v => v.status === 'Ready to Deploy').length;
    const breakdownCount = data.vehicles.filter(v => v.status === 'Breakdown').length;

    data.summary.metrics.onRoad.value = onRoadCount;
    data.summary.metrics.atWorkshop.value = workshopCount;
    data.summary.metrics.readyToDeploy.value = readyCount;
    data.summary.metrics.breakdown.value = breakdownCount;

    saveFleetData(data);

    return res.json({
      success: true,
      message: `Action ${actionType} executed for ${vehicleId}.`,
      vehicle
    });
  } catch (error) {
    console.error('Fleet action error:', error);
    return res.status(500).json({ success: false, message: 'Failed to execute vehicle action.' });
  }
});

export default router;
