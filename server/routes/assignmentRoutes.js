import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ASSIGNMENTS_FILE = path.join(__dirname, '../data/assignments.json');
const FLEET_FILE = path.join(__dirname, '../data/fleet.json');
const DRIVERS_FILE = path.join(__dirname, '../data/drivers.json');

// Helper to read JSON safely
function readJson(filePath, defaultVal = {}) {
  try {
    if (!fs.existsSync(filePath)) return defaultVal;
    const raw = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error(`Failed reading ${filePath}:`, err);
    return defaultVal;
  }
}

// Helper to write JSON safely
function writeJson(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error(`Failed writing ${filePath}:`, err);
    return false;
  }
}

// Auto-check and expire any temporary assignments whose time is over
function syncAndExpireAssignments() {
  const asgData = readJson(ASSIGNMENTS_FILE, { activeAssignments: [], history: [] });
  const driversData = readJson(DRIVERS_FILE, { summary: {}, drivers: [] });
  const fleetData = readJson(FLEET_FILE, { summary: {}, vehicles: [] });
  const now = new Date();
  let changed = false;

  const remainingActive = [];
  for (const asg of asgData.activeAssignments || []) {
    const isExpired = asg.assignmentType === 'temporary' && asg.endDate && new Date(asg.endDate) <= now;
    if (isExpired) {
      changed = true;
      asg.status = 'Completed';
      asg.completedAt = now.toISOString();
      asg.completionReason = `Time expired: Scheduled ${asg.durationDays || 1}-day temporary allocation concluded automatically.`;
      if (!asgData.history) asgData.history = [];
      asgData.history.unshift(asg);

      // 1. Restore driver's original vehicle
      const drv = driversData.drivers.find(d => d.id === asg.driverId);
      if (drv) {
        delete drv.temporaryAssignment;
        if (asg.originalVehicle && asg.originalVehicle.registration && asg.originalVehicle.registration !== 'Unassigned') {
          drv.vehicle = {
            registration: asg.originalVehicle.registration,
            model: asg.originalVehicle.model,
            type: asg.originalVehicle.type,
            status: 'Assigned 1:1'
          };
          drv.status = 'On Duty';
        } else {
          drv.vehicle = null;
          drv.status = 'Ready';
        }
      }

      // 2. Free temporary vehicle back to Ready to Deploy
      if (asg.assignedVehicle?.registration) {
        const tempPlate = asg.assignedVehicle.registration.trim().toUpperCase().replace(/\s+/g, '');
        const tempVeh = fleetData.vehicles.find(v => 
          v.registration?.toUpperCase().replace(/\s+/g, '') === tempPlate || 
          v.id?.toUpperCase().replace(/\s+/g, '') === tempPlate
        );
        if (tempVeh) {
          tempVeh.status = 'Ready to Deploy';
          tempVeh.driver = 'Unassigned';
          tempVeh.driverPhone = '—';
          tempVeh.driverStatus = 'Available in Yard (Temporary Allocation Completed)';
          tempVeh.allocatedTo = null;
          tempVeh.allocatedUntil = null;
          tempVeh.nextAction = 'Put on Road';
          tempVeh.actionType = 'PUT_ON_ROAD';
        }
      }

      // 3. Restore original vehicle in fleet.json
      if (asg.originalVehicle?.registration) {
        const origPlate = asg.originalVehicle.registration.trim().toUpperCase().replace(/\s+/g, '');
        const origVeh = fleetData.vehicles.find(v => 
          v.registration?.toUpperCase().replace(/\s+/g, '') === origPlate || 
          v.id?.toUpperCase().replace(/\s+/g, '') === origPlate
        );
        if (origVeh) {
          origVeh.status = 'Allocated';
          origVeh.driver = drv ? drv.name : asg.driverName;
          origVeh.driverStatus = 'On Duty (Restored from Temporary Duty)';
        }
      }
    } else {
      remainingActive.push(asg);
    }
  }

  if (changed) {
    asgData.activeAssignments = remainingActive;
    writeJson(ASSIGNMENTS_FILE, asgData);
    writeJson(DRIVERS_FILE, driversData);
    writeJson(FLEET_FILE, fleetData);
  }

  return asgData;
}

// GET /api/assignments - Fetch all assignments & history
router.get('/', (req, res) => {
  try {
    const data = syncAndExpireAssignments();
    return res.json({
      success: true,
      activeAssignments: data.activeAssignments || [],
      history: data.history || []
    });
  } catch (error) {
    console.error('Failed to get assignments:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve assignment data.' });
  }
});

// POST /api/assignments - Assign/Reassign vehicle to driver (Temporary or Permanent)
router.post('/', (req, res) => {
  try {
    syncAndExpireAssignments();

    const {
      driverId,
      newVehicleId,
      assignmentType = 'temporary', // 'temporary' | 'permanent'
      durationDays = 2,
      startDate = new Date().toISOString(),
      endDate,
      oldVehicleAction = 'yard_reserve', // 'yard_reserve' | 'workshop' | 'none'
      reason = 'Operational Duty Swap',
      notes = '',
      startOdometer,
      adminName = 'Fleet Administrator'
    } = req.body;

    if (!driverId || !newVehicleId) {
      return res.status(400).json({ success: false, message: 'Driver and Target Vehicle are both required.' });
    }

    const assignmentsData = readJson(ASSIGNMENTS_FILE, { activeAssignments: [], history: [] });
    const driversData = readJson(DRIVERS_FILE, { summary: {}, drivers: [] });
    const fleetData = readJson(FLEET_FILE, { summary: {}, vehicles: [] });

    // 1. Locate Driver
    const driverIndex = driversData.drivers.findIndex(d => d.id === driverId || d.name.toLowerCase() === driverId.toLowerCase());
    if (driverIndex === -1) {
      return res.status(404).json({ success: false, message: `Driver "${driverId}" not found in system.` });
    }
    const driver = driversData.drivers[driverIndex];

    // 2. Locate New Vehicle
    const normNewVehicleId = newVehicleId.trim().toUpperCase().replace(/\s+/g, '');
    const newVehIndex = fleetData.vehicles.findIndex(v => 
      v.id.toUpperCase().replace(/\s+/g, '') === normNewVehicleId || 
      v.registration.toUpperCase().replace(/\s+/g, '') === normNewVehicleId
    );
    if (newVehIndex === -1) {
      return res.status(404).json({ success: false, message: `Vehicle "${newVehicleId}" not found in fleet master.` });
    }
    const newVehicle = fleetData.vehicles[newVehIndex];

    // Enforce business rule: Vehicles in Maintenance / At Workshop CANNOT be assigned
    const newVehStatus = (newVehicle.status || '').toLowerCase();
    if (newVehStatus.includes('workshop') || newVehStatus.includes('maintenance')) {
      return res.status(400).json({
        success: false,
        message: `Vehicle ${newVehicle.registration} is currently In Maintenance / At Workshop (${newVehicle.location || 'Workshop'}). It cannot be assigned to any driver until maintenance is completed, QC is approved, and vehicle is released to 'Ready to Deploy'.`
      });
    }

    // STRICT BUSINESS RULE: An allocated car CANNOT be allocated to anyone else until the allocation time is over
    const isAlreadyAllocated = (newVehicle.status === 'Allocated' || newVehicle.status === 'On Road') &&
      newVehicle.driver &&
      newVehicle.driver !== 'Unassigned' &&
      newVehicle.driver.toLowerCase() !== driver.name.toLowerCase();

    if (isAlreadyAllocated) {
      return res.status(400).json({
        success: false,
        message: `⛔ Allocation Blocked: Vehicle ${newVehicle.registration} is currently ALLOCATED to ${newVehicle.driver}. Under Sikhar allocation policy, an allocated vehicle cannot be allocated to another driver until the allocation time is over or released.`
      });
    }

    // STRICT BUSINESS RULE: If driver already has an active vehicle, admin cannot assign another car unless it's a Temporary Reallocation (e.g. for 1 or 2 days)
    const hasCurrentCar = driver.vehicle && driver.vehicle.registration && driver.vehicle.registration !== 'Unassigned';
    if (hasCurrentCar && assignmentType === 'permanent') {
      return res.status(400).json({
        success: false,
        message: `⛔ Driver ${driver.name} is already operating vehicle ${driver.vehicle.model || driver.vehicle.registration}. You cannot assign another permanent car while an assignment is active. You can choose 'Temporary Reallocation' to temporarily give a replacement car (e.g. for 1 or 2 days), or end/return the current vehicle first.`
      });
    }

    const prevVehicleOfDriver = driver.vehicle ? { ...driver.vehicle } : null;

    // Calculate dates
    const startObj = new Date(startDate);
    let calculatedEndDate = endDate;
    if (!calculatedEndDate) {
      const endObj = new Date(startObj.getTime() + (Number(durationDays) || 1) * 24 * 60 * 60 * 1000);
      calculatedEndDate = endObj.toISOString();
    }

    const assignmentId = `ASG-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const newAssignment = {
      id: assignmentId,
      driverId: driver.id,
      driverName: driver.name,
      driverPhone: driver.phone,
      originalVehicle: prevVehicleOfDriver,
      assignedVehicle: {
        registration: newVehicle.registration,
        model: newVehicle.model,
        type: newVehicle.type,
        startOdometer: startOdometer || newVehicle.odometer || '0 km'
      },
      assignmentType,
      durationDays: Number(durationDays) || 1,
      startDate: startObj.toISOString(),
      endDate: calculatedEndDate,
      reason,
      notes,
      oldVehicleAction,
      status: 'Active',
      assignedBy: adminName,
      createdAt: new Date().toISOString()
    };

    // 3. Update Driver Record in drivers.json
    driver.vehicle = {
      registration: newVehicle.registration,
      model: newVehicle.model,
      type: newVehicle.type,
      status: assignmentType === 'temporary' ? `Temporary Duty (${durationDays} Days)` : 'Assigned 1:1'
    };
    driver.status = 'On Duty';

    if (assignmentType === 'temporary') {
      driver.temporaryAssignment = {
        assignmentId,
        isTemporary: true,
        originalVehicle: prevVehicleOfDriver,
        assignedVehicle: {
          registration: newVehicle.registration,
          model: newVehicle.model,
          type: newVehicle.type
        },
        durationDays: Number(durationDays) || 2,
        startDate: startObj.toISOString(),
        endDate: calculatedEndDate,
        reason,
        status: 'Active'
      };
    } else {
      delete driver.temporaryAssignment;
    }

    // 4. Update New Vehicle in fleet.json
    newVehicle.driver = driver.name;
    newVehicle.driverPhone = driver.phone;
    newVehicle.driverStatus = assignmentType === 'temporary' 
      ? `On Duty (Temporary Swap · ${durationDays}d)`
      : 'On Duty';
    newVehicle.status = 'Allocated';
    newVehicle.allocatedTo = driver.name;
    newVehicle.allocatedUntil = calculatedEndDate;
    newVehicle.allocationType = assignmentType;
    newVehicle.since = 'Allocated just now';
    newVehicle.duration = `${durationDays}d Allocation`;
    newVehicle.nextAction = 'Operating normally';
    newVehicle.actionType = 'NORMAL';

    if (!newVehicle.assignmentHistory) newVehicle.assignmentHistory = [];
    newVehicle.assignmentHistory.unshift({
      driver: driver.name,
      shiftType: assignmentType === 'temporary' ? `Temporary Duty (${durationDays} Days)` : '24-Hour Dedicated',
      fromDate: new Date().toLocaleDateString('en-GB'),
      toDate: assignmentType === 'temporary' ? `Scheduled ${durationDays}d` : 'Present',
      handoverKm: startOdometer || newVehicle.odometer || '0 km',
      status: 'Active',
      reason
    });

    // 5. Update Old Vehicle in fleet.json (if driver had one)
    if (prevVehicleOfDriver && prevVehicleOfDriver.registration) {
      const prevNormPlate = prevVehicleOfDriver.registration.trim().toUpperCase().replace(/\s+/g, '');
      const prevVehIndex = fleetData.vehicles.findIndex(v => 
        v.registration.toUpperCase().replace(/\s+/g, '') === prevNormPlate ||
        v.id.toUpperCase().replace(/\s+/g, '') === prevNormPlate
      );

      if (prevVehIndex !== -1) {
        const oldVeh = fleetData.vehicles[prevVehIndex];
        if (oldVehicleAction === 'workshop') {
          oldVeh.status = 'At Workshop';
          oldVeh.driver = 'Unassigned';
          oldVeh.driverStatus = 'Scheduled for Service';
          oldVeh.nextAction = 'Job Card Service Check';
          oldVeh.actionType = 'JOB_CARD';
          oldVeh.notes = `${oldVeh.notes || ''} [Temp swap for driver ${driver.name}: Old car moved to workshop - ${new Date().toLocaleDateString('en-IN')}]`;
        } else {
          // Default: Yard reserve / available pool
          oldVeh.status = 'Ready to Deploy';
          oldVeh.driver = 'Unassigned';
          oldVeh.driverPhone = '—';
          oldVeh.driverStatus = 'Available in Yard (Temporary Reserve)';
          oldVeh.location = 'Sikhar Hub Central Yard';
          oldVeh.nextAction = 'Put on Road';
          oldVeh.actionType = 'PUT_ON_ROAD';
          oldVeh.notes = `${oldVeh.notes || ''} [Duty swap: ${driver.name} temporarily allocated ${newVehicle.registration} for ${durationDays} days. WagonR reserved in yard.]`;
        }
      }
    }

    // 6. Save in assignments.json
    if (!assignmentsData.activeAssignments) assignmentsData.activeAssignments = [];
    // If driver already had an active assignment, move it to history
    assignmentsData.activeAssignments = assignmentsData.activeAssignments.filter(a => {
      if (a.driverId === driver.id && a.status === 'Active') {
        a.status = 'Superseded';
        a.supersededAt = new Date().toISOString();
        if (!assignmentsData.history) assignmentsData.history = [];
        assignmentsData.history.unshift(a);
        return false;
      }
      return true;
    });

    assignmentsData.activeAssignments.unshift(newAssignment);

    // Save all stores
    writeJson(ASSIGNMENTS_FILE, assignmentsData);
    writeJson(DRIVERS_FILE, driversData);
    writeJson(FLEET_FILE, fleetData);

    return res.status(201).json({
      success: true,
      message: `Successfully assigned ${newVehicle.model} (${newVehicle.registration}) to ${driver.name} for ${durationDays} day(s).`,
      assignment: newAssignment
    });
  } catch (error) {
    console.error('Assignment creation failed:', error);
    return res.status(500).json({ success: false, message: 'Failed to process vehicle assignment.' });
  }
});

// POST /api/assignments/:id/revert - Check-in temporary car and restore driver's original vehicle
router.post('/:id/revert', (req, res) => {
  try {
    const { id } = req.params;
    const { returnOdometer, returnNotes = 'Temporary duty finished, car returned to yard in good condition.' } = req.body;

    const assignmentsData = readJson(ASSIGNMENTS_FILE, { activeAssignments: [], history: [] });
    const driversData = readJson(DRIVERS_FILE, { summary: {}, drivers: [] });
    const fleetData = readJson(FLEET_FILE, { summary: {}, vehicles: [] });

    const asgIndex = (assignmentsData.activeAssignments || []).findIndex(a => a.id === id);
    if (asgIndex === -1) {
      return res.status(404).json({ success: false, message: 'Active assignment record not found.' });
    }

    const assignment = assignmentsData.activeAssignments[asgIndex];
    assignment.status = 'Completed';
    assignment.returnedAt = new Date().toISOString();
    assignment.returnNotes = returnNotes;
    if (returnOdometer) assignment.assignedVehicle.endOdometer = returnOdometer;

    // Remove from activeAssignments, move to history
    assignmentsData.activeAssignments.splice(asgIndex, 1);
    if (!assignmentsData.history) assignmentsData.history = [];
    assignmentsData.history.unshift(assignment);

    // 1. Restore Driver
    const driverIndex = driversData.drivers.findIndex(d => d.id === assignment.driverId);
    if (driverIndex !== -1) {
      const driver = driversData.drivers[driverIndex];
      delete driver.temporaryAssignment;
      if (assignment.originalVehicle) {
        driver.vehicle = {
          registration: assignment.originalVehicle.registration,
          model: assignment.originalVehicle.model,
          type: assignment.originalVehicle.type,
          status: 'Assigned 1:1'
        };
        driver.status = 'On Duty';
      } else {
        driver.vehicle = null;
        driver.status = 'Ready';
      }
    }

    // 2. Release Temporary Assigned Vehicle back to Yard in fleet.json
    const tempPlate = assignment.assignedVehicle.registration.trim().toUpperCase().replace(/\s+/g, '');
    const tempVeh = fleetData.vehicles.find(v => 
      v.registration.toUpperCase().replace(/\s+/g, '') === tempPlate || 
      v.id.toUpperCase().replace(/\s+/g, '') === tempPlate
    );
    if (tempVeh) {
      tempVeh.driver = 'Unassigned';
      tempVeh.driverPhone = '—';
      tempVeh.driverStatus = 'Available in Yard';
      tempVeh.status = 'Ready to Deploy';
      tempVeh.location = 'Sikhar Hub Central Operations Yard';
      tempVeh.since = 'Returned just now';
      tempVeh.duration = '0d 0h';
      tempVeh.nextAction = 'Put on Road';
      tempVeh.actionType = 'PUT_ON_ROAD';
      if (returnOdometer) tempVeh.odometer = returnOdometer.includes('km') ? returnOdometer : `${returnOdometer} km`;
      tempVeh.notes = `${tempVeh.notes || ''} [Returned from temporary assignment with ${assignment.driverName} on ${new Date().toLocaleDateString('en-IN')}]`;
    }

    // 3. Restore Original Vehicle back to Driver in fleet.json
    if (assignment.originalVehicle && assignment.originalVehicle.registration) {
      const origPlate = assignment.originalVehicle.registration.trim().toUpperCase().replace(/\s+/g, '');
      const origVeh = fleetData.vehicles.find(v => 
        v.registration.toUpperCase().replace(/\s+/g, '') === origPlate || 
        v.id.toUpperCase().replace(/\s+/g, '') === origPlate
      );
      if (origVeh) {
        origVeh.driver = assignment.driverName;
        origVeh.driverPhone = assignment.driverPhone;
        origVeh.driverStatus = 'On Duty';
        origVeh.status = 'On Road';
        origVeh.since = 'Restored today';
        origVeh.nextAction = 'Operating normally';
        origVeh.actionType = 'NORMAL';
        origVeh.notes = `${origVeh.notes || ''} [Driver ${assignment.driverName} restored to primary vehicle after temporary assignment completed]`;
      }
    }

    writeJson(ASSIGNMENTS_FILE, assignmentsData);
    writeJson(DRIVERS_FILE, driversData);
    writeJson(FLEET_FILE, fleetData);

    return res.json({
      success: true,
      message: `Assignment successfully completed. ${assignment.driverName} restored to original vehicle (${assignment.originalVehicle?.registration || 'None'}).`,
      assignment
    });
  } catch (error) {
    console.error('Failed to revert assignment:', error);
    return res.status(500).json({ success: false, message: 'Failed to revert vehicle assignment.' });
  }
});

// POST /api/assignments/:id/extend - Extend temporary allocation duration
router.post('/:id/extend', (req, res) => {
  try {
    const { id } = req.params;
    const { additionalDays = 1, newEndDate, extendReason = 'Duty extended upon client request' } = req.body;

    const assignmentsData = readJson(ASSIGNMENTS_FILE, { activeAssignments: [], history: [] });
    const driversData = readJson(DRIVERS_FILE, { summary: {}, drivers: [] });

    const assignment = (assignmentsData.activeAssignments || []).find(a => a.id === id);
    if (!assignment) {
      return res.status(404).json({ success: false, message: 'Active assignment not found.' });
    }

    const currentEnd = new Date(assignment.endDate);
    let nextEnd;
    if (newEndDate) {
      nextEnd = new Date(newEndDate);
    } else {
      nextEnd = new Date(currentEnd.getTime() + (Number(additionalDays) || 1) * 24 * 60 * 60 * 1000);
    }

    const addedDays = Number(additionalDays) || 1;
    assignment.durationDays = (Number(assignment.durationDays) || 0) + addedDays;
    assignment.endDate = nextEnd.toISOString();
    assignment.notes = `${assignment.notes || ''} [Extended by +${addedDays}d on ${new Date().toLocaleDateString('en-IN')}: ${extendReason}]`;

    // Also update driver's temporaryAssignment if present
    const driver = driversData.drivers.find(d => d.id === assignment.driverId);
    if (driver && driver.temporaryAssignment) {
      driver.temporaryAssignment.durationDays = assignment.durationDays;
      driver.temporaryAssignment.endDate = assignment.endDate;
    }

    writeJson(ASSIGNMENTS_FILE, assignmentsData);
    writeJson(DRIVERS_FILE, driversData);

    return res.json({
      success: true,
      message: `Assignment duration extended by +${addedDays} day(s). New expiry: ${nextEnd.toLocaleDateString('en-GB')}.`,
      assignment
    });
  } catch (error) {
    console.error('Failed to extend assignment:', error);
    return res.status(500).json({ success: false, message: 'Failed to extend assignment.' });
  }
});

export default router;
