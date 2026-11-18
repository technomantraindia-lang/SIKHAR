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
        (normalizedStatus === 'onroad' && (v.status === 'On Road' || v.status === 'Allocated')) ||
        (normalizedStatus === 'allocated' && (v.status === 'Allocated' || v.allocatedUntil)) ||
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
    const vehicleId = req.params.id.toUpperCase().replace(/\s+/g, '');
    let vehicle = data.vehicles.find(v => 
      (v.id || '').toUpperCase().replace(/\s+/g, '') === vehicleId || 
      (v.registration || '').toUpperCase().replace(/\s+/g, '') === vehicleId
    );

    if (!vehicle) {
      // Auto-fallback: check if this vehicle is assigned to a driver or active assignment
      let driverName = 'Unassigned';
      let driverPhone = '—';
      let model = 'TATA TIAGO EV';
      let type = 'EV';
      let status = 'On Road';

      try {
        const driversPath = path.join(__dirname, '../data/drivers.json');
        if (fs.existsSync(driversPath)) {
          const dData = JSON.parse(fs.readFileSync(driversPath, 'utf8'));
          const matchedDriver = (dData.drivers || []).find(d => 
            (d.vehicle?.registration || '').toUpperCase().replace(/\s+/g, '') === vehicleId
          );
          if (matchedDriver) {
            driverName = matchedDriver.name || 'Assigned Driver';
            driverPhone = matchedDriver.phone || '—';
            model = matchedDriver.vehicle?.model || model;
            type = matchedDriver.vehicle?.type || type;
            status = 'On Road';
          }
        }
      } catch (e) {}

      // Create fallback vehicle record and persist to fleet master
      const fallbackVehicle = {
        id: vehicleId,
        registration: vehicleId,
        model,
        type,
        connectorType: type === 'EV' ? 'CCS2 Fast Charge / Type 2' : 'Standard CNG Valve',
        driver: driverName,
        driverPhone,
        driverStatus: driverName !== 'Unassigned' ? `Assigned (${driverName})` : 'Available in Yard',
        status,
        location: 'Vadodara Hub',
        hub: 'Vadodara Hub',
        since: 'Active Assignment',
        duration: 'Dedicated Fleet',
        nextAction: 'Monitor Telemetry',
        actionType: 'VIEW_TELEMETRY',
        odometer: '100 km',
        battery: type === 'EV' ? '88%' : 'Full',
        health: 'Healthy',
        healthStatus: 'good',
        service: 'Next service · 30 Dec 2026',
        permit: 'Valid · 31 Dec 2026',
        insurance: 'Valid · 31 Dec 2026',
        fitness: 'Valid · 31 Dec 2027',
        puc: type === 'EV' ? 'Exempt (EV)' : 'Valid · 30 Jun 2027',
        chassis: 'MAT612034NJB99123',
        lender: 'Commercial Fleet Finance',
        monthlyEmi: '₹15000',
        challansCount: 0,
        challansAmount: '₹0',
        dailyRentRate: '₹500',
        notes: `Auto-registered fleet asset ${vehicleId} from active driver assignment.`,
        assignmentHistory: driverName !== 'Unassigned' ? [{
          driver: driverName,
          shiftType: 'Dedicated Lease',
          fromDate: '05/11/2026',
          toDate: 'Present',
          handoverKm: '100 km',
          status: 'Active',
          reason: 'Active driver assignment'
        }] : []
      };

      data.vehicles.push(fallbackVehicle);
      if (data.summary?.metrics?.totalFleet) {
        data.summary.metrics.totalFleet.value = data.vehicles.length;
      }
      try { saveFleetData(data); } catch (e) {}
      vehicle = fallbackVehicle;
    }

    return res.json({ success: true, vehicle });
  } catch (err) {
    console.error('Vehicle detail error:', err);
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

// PUT /api/fleet/vehicles/:id - Edit an existing vehicle master record
router.put('/vehicles/:id', (req, res) => {
  try {
    const data = getFleetData();
    const vehicleId = String(req.params.id || '').toUpperCase();
    const index = data.vehicles.findIndex(v =>
      String(v.id || '').toUpperCase() === vehicleId || String(v.registration || '').toUpperCase() === vehicleId
    );

    if (index === -1) {
      return res.status(404).json({ success: false, message: 'Vehicle not found.' });
    }

    const input = req.body || {};
    const vehicle = data.vehicles[index];
    const editableFields = [
      'model', 'type', 'connectorType', 'chassis', 'hub', 'location', 'status', 'odometer',
      'battery', 'lender', 'monthlyEmi', 'dailyRentRate', 'permitExpiry', 'insuranceExpiry',
      'fitnessExpiry', 'pucExpiry', 'driver', 'driverPhone', 'notes'
    ];

    editableFields.forEach((field) => {
      if (Object.prototype.hasOwnProperty.call(input, field) && input[field] !== undefined) {
        vehicle[field] = input[field];
      }
    });

    // The registration is the master-record key. It is intentionally immutable here;
    // a plate change should be handled as a controlled asset transfer, not a silent rename.
    vehicle.id = vehicle.id || vehicle.registration;
    vehicle.registration = vehicle.registration || vehicle.id;
    vehicle.location = input.hub || input.location || vehicle.location || 'Sikhar Hub Central Yard';
    vehicle.hub = input.hub || vehicle.hub || vehicle.location;
    vehicle.driver = vehicle.driver || 'Unassigned';
    vehicle.driverStatus = vehicle.driver !== 'Unassigned' ? 'Assigned' : 'Available in Yard';
    vehicle.odometer = input.odometer !== undefined
      ? `${Number(input.odometer) || 0} km`
      : vehicle.odometer;

    const moneyValue = (value, fallback) => {
      if (value === undefined || value === null || value === '') return fallback;
      const clean = String(value).replace(/[^0-9.]/g, '');
      return clean ? `â‚¹${Number(clean).toLocaleString('en-IN')}` : fallback;
    };
    vehicle.monthlyEmi = moneyValue(input.monthlyEmi, vehicle.monthlyEmi || 'â‚¹21,000');
    vehicle.dailyRentRate = moneyValue(input.dailyRentRate, vehicle.dailyRentRate || 'â‚¹1,150');

    const expiryLabel = (value, fallback) => value ? `Valid Â· ${value}` : fallback;
    if (Object.prototype.hasOwnProperty.call(input, 'permitExpiry')) vehicle.permit = expiryLabel(input.permitExpiry, vehicle.permit);
    if (Object.prototype.hasOwnProperty.call(input, 'insuranceExpiry')) vehicle.insurance = expiryLabel(input.insuranceExpiry, vehicle.insurance);
    if (Object.prototype.hasOwnProperty.call(input, 'fitnessExpiry')) vehicle.fitness = expiryLabel(input.fitnessExpiry, vehicle.fitness);
    if (Object.prototype.hasOwnProperty.call(input, 'pucExpiry')) vehicle.puc = expiryLabel(input.pucExpiry, vehicle.puc);
    vehicle.since = 'Updated just now';
    vehicle.nextAction = vehicle.status === 'Ready to Deploy' ? 'Put on Road' : (vehicle.nextAction || 'Commissioning Review');

    data.summary = data.summary || { metrics: {} };
    data.summary.metrics = data.summary.metrics || {};
    const metric = (key, label, value) => {
      data.summary.metrics[key] = { ...(data.summary.metrics[key] || {}), label, value };
    };
    metric('totalFleet', 'Total Fleet', data.vehicles.length);
    metric('onRoad', 'On Road', data.vehicles.filter(v => v.status === 'On Road').length);
    metric('atWorkshop', 'At Workshop', data.vehicles.filter(v => v.status === 'At Workshop').length);
    metric('readyToDeploy', 'Ready to Deploy', data.vehicles.filter(v => v.status === 'Ready to Deploy').length);
    metric('breakdown', 'Breakdown', data.vehicles.filter(v => v.status === 'Breakdown').length);

    saveFleetData(data);
    return res.json({ success: true, message: `Vehicle ${vehicle.registration} updated successfully.`, vehicle });
  } catch (error) {
    console.error('Error updating vehicle asset:', error);
    return res.status(500).json({ success: false, message: 'Failed to update vehicle asset.' });
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

// Helper to unassign driver when a vehicle is deleted
function unassignDriverInDriversData(driverName, regPlate) {
  try {
    const driversPath = path.join(__dirname, '../data/drivers.json');
    if (!fs.existsSync(driversPath)) return null;
    const raw = fs.readFileSync(driversPath, 'utf8');
    const driversData = JSON.parse(raw);
    let changed = false;
    let affectedDriverName = null;

    if (Array.isArray(driversData.drivers)) {
      driversData.drivers.forEach(d => {
        const matchesReg = d.vehicle && d.vehicle.registration && 
          d.vehicle.registration.trim().toUpperCase() === regPlate.trim().toUpperCase();
        const matchesName = driverName && d.name && 
          d.name.trim().toLowerCase() === driverName.trim().toLowerCase();

        if (matchesReg || matchesName) {
          affectedDriverName = d.name;
          d.vehicle = null;
          if (d.status === 'On Duty') {
            d.status = 'Ready';
          }
          if (d.deal) {
            d.deal.lastAmendment = new Date().toISOString();
            d.deal.notes = `${d.deal.notes || ''} [Vehicle ${regPlate} deleted on ${new Date().toLocaleDateString('en-IN')}; Driver moved to Standby Pool]`;
          }
          changed = true;
        }
      });
    }

    if (changed) {
      if (driversData.summary) {
        driversData.summary.totalDrivers = driversData.drivers.length;
        driversData.summary.onDuty = driversData.drivers.filter(d => d.status === 'On Duty').length;
        driversData.summary.unassigned = driversData.drivers.filter(d => !d.vehicle || !d.vehicle.registration || d.vehicle.registration === 'Unassigned').length;
      }
      fs.writeFileSync(driversPath, JSON.stringify(driversData, null, 2), 'utf8');
    }
    return affectedDriverName;
  } catch (err) {
    console.warn('Could not unassign driver in drivers data:', err.message);
    return null;
  }
}

// DELETE /api/fleet/vehicles/:id - Admin permanently deletes a vehicle from Vehicle Master (unassigns driver)
router.delete('/vehicles/:id', (req, res) => {
  try {
    const data = getFleetData();
    const vehicleId = String(req.params.id || '').trim().toUpperCase();
    const index = data.vehicles.findIndex(v =>
      String(v.id || '').trim().toUpperCase() === vehicleId || 
      String(v.registration || '').trim().toUpperCase() === vehicleId
    );

    if (index === -1) {
      return res.status(404).json({ success: false, message: 'Vehicle not found.' });
    }

    const [deletedVehicle] = data.vehicles.splice(index, 1);
    const regPlate = deletedVehicle.registration || vehicleId;
    const assignedDriver = deletedVehicle.driver && deletedVehicle.driver !== 'Unassigned' && deletedVehicle.driver !== 'Yard Inventory'
      ? deletedVehicle.driver
      : null;

    // Vice Versa: If vehicle was assigned to a driver, unassign that driver and set them to Standby
    const affectedDriver = unassignDriverInDriversData(assignedDriver, regPlate);

    // Also close any active temporary assignment in assignments.json if present
    try {
      const asgPath = path.join(__dirname, '../data/assignments.json');
      if (fs.existsSync(asgPath)) {
        const asgData = JSON.parse(fs.readFileSync(asgPath, 'utf8'));
        let asgChanged = false;
        if (Array.isArray(asgData.activeAssignments)) {
          for (let i = asgData.activeAssignments.length - 1; i >= 0; i--) {
            const asg = asgData.activeAssignments[i];
            const asgReg = asg.assignedVehicle?.registration || asg.vehicleReg;
            if (asgReg && asgReg.trim().toUpperCase() === regPlate.trim().toUpperCase()) {
              asg.status = 'Terminated';
              asg.returnedAt = new Date().toISOString();
              asg.returnNotes = `Vehicle ${regPlate} deleted by admin.`;
              asgData.activeAssignments.splice(i, 1);
              if (!asgData.history) asgData.history = [];
              asgData.history.unshift(asg);
              asgChanged = true;
            }
          }
        }
        if (Array.isArray(asgData.assignments)) {
          asgData.assignments.forEach(asg => {
            if (asg.assignedVehicle?.registration?.toUpperCase() === regPlate.toUpperCase() && asg.status === 'active') {
              asg.status = 'terminated';
              asg.completedDate = new Date().toISOString();
              asg.notes = `Vehicle ${regPlate} deleted by admin.`;
              asgChanged = true;
            }
          });
        }
        if (asgChanged) {
          fs.writeFileSync(asgPath, JSON.stringify(asgData, null, 2), 'utf8');
        }
      }
    } catch (e) {
      console.warn('Assignments clean up error:', e);
    }

    // Recalculate fleet summary metrics
    const totalCount = data.vehicles.length;
    const onRoadCount = data.vehicles.filter(v => v.status === 'On Road' || v.status === 'Allocated').length;
    const workshopCount = data.vehicles.filter(v => v.status === 'At Workshop').length;
    const readyCount = data.vehicles.filter(v => v.status === 'Ready to Deploy').length;
    const breakdownCount = data.vehicles.filter(v => v.status === 'Breakdown').length;

    if (data.summary?.metrics) {
      data.summary.totalFleet = totalCount;
      if (data.summary.metrics.totalFleet) data.summary.metrics.totalFleet.value = totalCount;
      if (data.summary.metrics.onRoad) data.summary.metrics.onRoad.value = onRoadCount;
      if (data.summary.metrics.atWorkshop) data.summary.metrics.atWorkshop.value = workshopCount;
      if (data.summary.metrics.readyToDeploy) data.summary.metrics.readyToDeploy.value = readyCount;
      if (data.summary.metrics.breakdown) data.summary.metrics.breakdown.value = breakdownCount;
    }

    saveFleetData(data);

    return res.json({
      success: true,
      message: `Vehicle "${regPlate}" successfully deleted.${affectedDriver ? ` Assigned driver "${affectedDriver}" has been unassigned and moved to Standby.` : ''}`,
      deletedRegistration: regPlate,
      unassignedDriver: affectedDriver
    });
  } catch (error) {
    console.error('Vehicle deletion error:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete vehicle.' });
  }
});

export default router;
