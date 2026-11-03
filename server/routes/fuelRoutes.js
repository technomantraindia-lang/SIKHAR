import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const fuelDataPath = path.join(__dirname, '../data/fuel.json');

// Helper to read data safely
function getFuelData() {
  try {
    const raw = fs.readFileSync(fuelDataPath, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading fuel.json:', err.message);
    return { kpis: {}, chargingSessions: [], fuelLogs: [], partnerStations: [] };
  }
}

// Helper to save data safely
function saveFuelData(data) {
  fs.writeFileSync(fuelDataPath, JSON.stringify(data, null, 2), 'utf-8');
}

// Recalculate KPIs based on current charging and fuel logs
function updateFuelKpis(data) {
  const activeSessions = (data.chargingSessions || []).filter(s => s.status === 'Active');
  const _settledSessions = (data.chargingSessions || []).filter(s => s.status === 'Settled' || s.status === 'Completed');
  const fuelLogs = data.fuelLogs || [];

  const totalKwh = (data.chargingSessions || []).reduce((sum, s) => sum + (Number(s.energyDeliveredKwh) || 0), 0);
  const totalCng = fuelLogs.reduce((sum, l) => sum + (Number(l.quantityKg) || 0), 0);
  const totalChargingCost = (data.chargingSessions || []).reduce((sum, s) => sum + (Number(s.settledAmount || s.currentCost) || 0), 0);
  const totalFuelCost = fuelLogs.reduce((sum, l) => sum + (Number(l.totalAmount) || 0), 0);

  const heldReservations = activeSessions.reduce((sum, s) => sum + (Number(s.walletHold) || 0), 0);

  data.kpis = {
    totalEnergyKwh: Math.round(totalKwh + 42800),
    totalCngKg: Math.round(totalCng + 14250),
    totalCostInr: Math.round(totalChargingCost + totalFuelCost + 480000),
    evEfficiencyKmPerKwh: 7.8,
    cngEfficiencyKmPerKg: 26.4,
    activeSessionsCount: activeSessions.length,
    heldReservationsInr: heldReservations,
    avgCostPerKm: 2.14
  };
}

// GET /api/fuel - List sessions, fuel logs, and stations
router.get('/', (req, res) => {
  try {
    const data = getFuelData();
    const { type: _type, status, search, vehicle } = req.query;

    let chargingSessions = [...(data.chargingSessions || [])];
    let fuelLogs = [...(data.fuelLogs || [])];

    if (vehicle && vehicle !== 'all') {
      const vQuery = vehicle.toLowerCase();
      chargingSessions = chargingSessions.filter(s => s.vehicle.toLowerCase().includes(vQuery));
      fuelLogs = fuelLogs.filter(l => l.vehicle.toLowerCase().includes(vQuery));
    }

    if (status && status !== 'all') {
      const sQuery = status.toLowerCase();
      chargingSessions = chargingSessions.filter(s => s.status.toLowerCase() === sQuery);
      fuelLogs = fuelLogs.filter(l => l.status.toLowerCase() === sQuery);
    }

    if (search) {
      const q = search.toLowerCase();
      chargingSessions = chargingSessions.filter(s =>
        s.id.toLowerCase().includes(q) ||
        s.vehicle.toLowerCase().includes(q) ||
        s.driver.toLowerCase().includes(q) ||
        s.stationName.toLowerCase().includes(q)
      );
      fuelLogs = fuelLogs.filter(l =>
        l.id.toLowerCase().includes(q) ||
        l.vehicle.toLowerCase().includes(q) ||
        l.driver.toLowerCase().includes(q) ||
        l.stationName.toLowerCase().includes(q) ||
        (l.slipNumber && l.slipNumber.toLowerCase().includes(q))
      );
    }

    return res.json({
      success: true,
      data: {
        kpis: data.kpis,
        chargingSessions,
        fuelLogs,
        partnerStations: data.partnerStations || []
      }
    });
  } catch (error) {
    console.error('Fuel API error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/fuel/session/start - Start EV Charging Session
router.post('/session/start', (req, res) => {
  try {
    const data = getFuelData();
    const { vehicle, driver, stationName, connectorType, tariffPerKwh, targetSoC, walletHold, notes } = req.body;

    if (!vehicle || !driver) {
      return res.status(400).json({ success: false, message: 'Vehicle and Driver are required to initiate charging.' });
    }

    const sessionCount = (data.chargingSessions || []).length + 1;
    const newSession = {
      id: `CHG-2026-00${410 + sessionCount}`,
      vehicle,
      driver,
      stationName: stationName || 'Sikhar Fleet Central Depot',
      connectorType: connectorType || 'CCS2 Fast (60kW)',
      status: 'Active',
      startTime: new Date().toISOString(),
      endTime: null,
      startSoC: 25,
      currentSoC: 25,
      targetSoC: Number(targetSoC) || 85,
      chargingRateKw: 50.0,
      energyDeliveredKwh: 0,
      tariffPerKwh: Number(tariffPerKwh) || 18.5,
      walletHold: Number(walletHold) || 800,
      currentCost: 0,
      notes: notes || 'Remote start session command issued.'
    };

    data.chargingSessions.unshift(newSession);
    updateFuelKpis(data);
    saveFuelData(data);

    return res.status(201).json({
      success: true,
      message: `Charging session started for ${vehicle}. ₹${newSession.walletHold} reserved from wallet.`,
      session: newSession,
      kpis: data.kpis
    });
  } catch (error) {
    console.error('Error starting charging session:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/fuel/session/:id/stop - Stop EV Charging Session
router.post('/session/:id/stop', (req, res) => {
  try {
    const data = getFuelData();
    const session = data.chargingSessions.find(s => s.id === req.params.id);

    if (!session) {
      return res.status(404).json({ success: false, message: 'Charging session not found.' });
    }

    if (session.status !== 'Active') {
      return res.status(400).json({ success: false, message: `Session is already ${session.status}` });
    }

    session.status = 'Completed';
    session.endTime = new Date().toISOString();
    session.chargingRateKw = 0;
    if (!session.energyDeliveredKwh || session.energyDeliveredKwh === 0) {
      session.energyDeliveredKwh = 18.4;
      session.currentSoC = session.targetSoC || 85;
      session.currentCost = Number((session.energyDeliveredKwh * session.tariffPerKwh).toFixed(2));
    }

    updateFuelKpis(data);
    saveFuelData(data);

    return res.json({
      success: true,
      message: `Session ${session.id} stopped. Final CDR pending reconciliation.`,
      session,
      kpis: data.kpis
    });
  } catch (error) {
    console.error('Error stopping charging session:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/fuel/session/:id/settle - Settle Charging Record & Release Wallet Hold
router.post('/session/:id/settle', (req, res) => {
  try {
    const data = getFuelData();
    const session = data.chargingSessions.find(s => s.id === req.params.id);

    if (!session) {
      return res.status(404).json({ success: false, message: 'Charging session not found.' });
    }

    const actualCost = session.currentCost || 340.5;
    const holdAmount = session.walletHold || 800;
    const released = Math.max(0, holdAmount - actualCost);

    session.status = 'Settled';
    session.settledAmount = actualCost;
    session.releasedReservation = Number(released.toFixed(2));
    session.cdrReference = `CDR-${Math.floor(100000 + Math.random() * 900000)}`;
    session.notes = (session.notes ? session.notes + ' ' : '') + `Settled: ₹${actualCost} deducted, ₹${released.toFixed(2)} released.`;

    updateFuelKpis(data);
    saveFuelData(data);

    return res.json({
      success: true,
      message: `Session settled. ₹${actualCost} finalized in ledger; ₹${released.toFixed(2)} reservation released.`,
      session,
      kpis: data.kpis
    });
  } catch (error) {
    console.error('Error settling charging session:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/fuel/log - Log new CNG / Fuel dispense
router.post('/log', (req, res) => {
  try {
    const data = getFuelData();
    const { vehicle, driver, fuelType, stationName, quantityKg, ratePerKg, odometer, previousOdometer, paymentMethod, slipNumber, notes } = req.body;

    if (!vehicle || !driver || !quantityKg || !ratePerKg) {
      return res.status(400).json({ success: false, message: 'Vehicle, driver, quantity and rate are required.' });
    }

    const qty = Number(quantityKg);
    const rate = Number(ratePerKg);
    const total = Number((qty * rate).toFixed(2));
    const currOdo = Number(odometer) || 50000;
    const prevOdo = Number(previousOdometer) || currOdo - 220;
    const dist = Math.max(1, currOdo - prevOdo);
    const efficiency = Number((dist / qty).toFixed(2));

    const logCount = (data.fuelLogs || []).length + 1;
    const newLog = {
      id: `CNG-2026-00${890 + logCount}`,
      vehicle,
      driver,
      fuelType: fuelType || 'CNG',
      stationName: stationName || 'Indraprastha Gas Limited (IGL)',
      quantityKg: qty,
      ratePerKg: rate,
      totalAmount: total,
      odometer: currOdo,
      previousOdometer: prevOdo,
      distanceKm: dist,
      efficiency,
      paymentMethod: paymentMethod || 'Driver Wallet',
      status: 'Pending Approval',
      loggedAt: new Date().toISOString(),
      slipNumber: slipNumber || `SLIP-${Math.floor(10000 + Math.random() * 90000)}`,
      verifiedBy: null,
      notes: notes || 'Dispense slip submitted for operational audit.'
    };

    data.fuelLogs.unshift(newLog);
    updateFuelKpis(data);
    saveFuelData(data);

    return res.status(201).json({
      success: true,
      message: `Fuel dispense record ${newLog.id} logged successfully.`,
      log: newLog,
      kpis: data.kpis
    });
  } catch (error) {
    console.error('Error logging fuel record:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

// PUT /api/fuel/log/:id/verify - Approve or reject fuel log
router.put('/log/:id/verify', (req, res) => {
  try {
    const data = getFuelData();
    const log = data.fuelLogs.find(l => l.id === req.params.id);

    if (!log) {
      return res.status(404).json({ success: false, message: 'Fuel record not found.' });
    }

    const { status, verifiedBy, notes } = req.body;
    log.status = status || 'Verified';
    log.verifiedBy = verifiedBy || 'Operations Admin';
    if (notes) log.notes = notes;

    updateFuelKpis(data);
    saveFuelData(data);

    return res.json({
      success: true,
      message: `Fuel log ${log.id} updated to ${log.status}.`,
      log,
      kpis: data.kpis
    });
  } catch (error) {
    console.error('Error verifying fuel log:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
