import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const tripsDataPath = path.join(__dirname, '../data/trips.json');
const escalationsDataPath = path.join(__dirname, '../data/escalations.json');

// Helper to read data safely
function getTripsData() {
  try {
    const raw = fs.readFileSync(tripsDataPath, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading trips.json:', err.message);
    return { kpis: {}, trips: [] };
  }
}

// Helper to write data safely
function saveTripsData(data) {
  fs.writeFileSync(tripsDataPath, JSON.stringify(data, null, 2), 'utf-8');
}

// Helper to recalculate KPIs
function updateKpiCounts(data) {
  const trips = data.trips || [];
  const liveCount = trips.filter(t => t.status === 'Live').length;
  const completedCount = trips.filter(t => t.status === 'Completed').length;
  const cancelledCount = trips.filter(t => (t.status || '').toLowerCase().includes('cancelled')).length;
  const disputedCount = trips.filter(t => t.status === 'Disputed').length;

  const totalDist = trips.reduce((acc, t) => acc + (Number(t.distanceKm) || 0), 0);
  const grossRev = trips.reduce((acc, t) => acc + (Number(t.grossFare) || 0), 0);
  const driverEarn = trips.reduce((acc, t) => acc + (Number(t.driverShare) || 0), 0);
  const sikharRev = trips.reduce((acc, t) => acc + (Number(t.sikharShare) || 0), 0);

  data.kpis = {
    totalTrips: trips.length,
    liveTrips: liveCount,
    completedTrips: completedCount,
    cancelledTrips: cancelledCount,
    disputedTrips: disputedCount,
    totalDistanceKm: Number(totalDist.toFixed(1)),
    grossRevenue: Math.round(grossRev),
    driverEarnings: Math.round(driverEarn),
    sikharShare: Math.round(sikharRev)
  };
}

// GET /api/trips - List trips with filters & KPIs
router.get('/', (req, res) => {
  try {
    const data = getTripsData();
    const { status, source, search, vehicle, driver } = req.query;

    let filtered = [...data.trips];

    // Status filter
    if (status && status !== 'all') {
      const s = status.toLowerCase().trim();
      if (s === 'live') {
        filtered = filtered.filter(t => (t.status || '').toLowerCase() === 'live');
      } else if (s === 'completed') {
        filtered = filtered.filter(t => (t.status || '').toLowerCase() === 'completed');
      } else if (s.includes('cancel')) {
        filtered = filtered.filter(t => (t.status || '').toLowerCase().includes('cancel'));
      } else if (s.includes('disput')) {
        filtered = filtered.filter(t => (t.status || '').toLowerCase().includes('disput'));
      }
    }

    // Source filter (Platform)
    if (source && source !== 'all') {
      filtered = filtered.filter(t => (t.source || '').toLowerCase() === source.toLowerCase());
    }

    // Vehicle filter
    if (vehicle && vehicle !== 'all') {
      const v = vehicle.toUpperCase().replace(/\s+/g, '');
      filtered = filtered.filter(t => (t.vehicle || '').toUpperCase().replace(/\s+/g, '').includes(v));
    }

    // Driver filter
    if (driver && driver !== 'all') {
      const d = driver.toLowerCase();
      filtered = filtered.filter(t => (t.driver || '').toLowerCase().includes(d));
    }

    // Text search (Trip ID, Partner ID, Driver, Vehicle, Locations)
    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      filtered = filtered.filter(t =>
        (t.id && t.id.toLowerCase().includes(q)) ||
        (t.partnerTripId && t.partnerTripId.toLowerCase().includes(q)) ||
        (t.driver && t.driver.toLowerCase().includes(q)) ||
        (t.vehicle && t.vehicle.toLowerCase().includes(q)) ||
        (t.pickupLocation && t.pickupLocation.toLowerCase().includes(q)) ||
        (t.dropLocation && t.dropLocation.toLowerCase().includes(q))
      );
    }

    updateKpiCounts(data);

    res.json({
      success: true,
      kpis: data.kpis,
      total: filtered.length,
      trips: filtered
    });
  } catch (err) {
    console.error('Error fetching trips:', err);
    res.status(500).json({ success: false, message: 'Internal server error while fetching trips' });
  }
});

// GET /api/trips/:id - Single trip detail
router.get('/:id', (req, res) => {
  try {
    const data = getTripsData();
    const trip = data.trips.find(t => t.id === req.params.id);
    if (!trip) {
      return res.status(404).json({ success: false, message: 'Trip not found' });
    }
    res.json({ success: true, trip });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/trips - Log a manual or direct trip
router.post('/', (req, res) => {
  try {
    const data = getTripsData();
    const body = req.body;

    if (!body.vehicle || !body.driver) {
      return res.status(400).json({ success: false, message: 'Vehicle and Driver are required' });
    }

    const nextIdx = (data.trips.length + 1).toString().padStart(4, '0');
    const newId = `TRP-2026-08-${nextIdx}`;

    const grossFare = Number(body.grossFare) || 0;
    const tollTax = Number(body.tollTax) || 0;
    const partnerFee = Number(body.partnerFee) || 0;
    const netFare = Math.max(0, grossFare - tollTax - partnerFee);

    const splitType = body.splitType || 'Revenue Share (75/25)';
    let driverShare = 0;
    let sikharShare = 0;

    if (splitType === 'Revenue Share (75/25)') {
      driverShare = Number((netFare * 0.75).toFixed(2));
      sikharShare = Number((netFare * 0.25).toFixed(2));
    } else {
      driverShare = netFare;
      sikharShare = 0;
    }

    const newTrip = {
      id: newId,
      partnerTripId: body.partnerTripId || `DIR-${Math.floor(100000 + Math.random() * 900000)}`,
      source: body.source || 'Direct / Sikhar',
      vehicle: (body.vehicle || '').toUpperCase().trim(),
      vehicleModel: body.vehicleModel || 'TATA TIGOR EV XPRESS T',
      driver: body.driver.trim(),
      driverPhone: body.driverPhone || '+91 98101 00000',
      pickupLocation: body.pickupLocation || 'Sikhar Hub Central Yard, Gurgaon',
      dropLocation: body.dropLocation || 'Cyber Hub, DLF Phase 2, Gurgaon',
      startTime: body.startTime || new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }),
      endTime: body.status === 'Completed' ? (body.endTime || new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })) : '—',
      duration: body.duration || (body.status === 'Live' ? 'In Transit' : '30m'),
      distanceKm: Number(body.distanceKm) || 10.0,
      status: body.status || 'Live',
      grossFare: grossFare,
      tollTax: tollTax,
      partnerFee: partnerFee,
      netFare: netFare,
      splitType: splitType,
      driverShare: driverShare,
      sikharShare: sikharShare,
      settlementStatus: body.status === 'Completed' ? 'Credited to Wallet' : 'Pending',
      telematics: {
        avgSpeed: body.avgSpeed || '30 km/h',
        maxSpeed: body.maxSpeed || '55 km/h',
        startBattery: body.startBattery || '95%',
        endBattery: body.endBattery || '88%',
        batteryConsumed: body.batteryConsumed || '7%',
        startOdo: body.startOdo || '0 km',
        endOdo: body.endOdo || `${Number(body.distanceKm || 10)} km`
      },
      notes: body.notes || 'Manually logged by fleet operations team.'
    };

    data.trips.unshift(newTrip);
    updateKpiCounts(data);
    saveTripsData(data);

    res.status(201).json({
      success: true,
      message: 'Trip logged successfully',
      trip: newTrip,
      kpis: data.kpis
    });
  } catch (err) {
    console.error('Error logging trip:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/trips/import - Batch import from statement / CSV simulation
router.post('/import', (req, res) => {
  try {
    const data = getTripsData();
    const importedList = req.body.trips;

    if (!Array.isArray(importedList) || importedList.length === 0) {
      return res.status(400).json({ success: false, message: 'Valid array of trips is required for import' });
    }

    let addedCount = 0;
    const nowStr = new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });

    importedList.forEach((item, index) => {
      const nextIdx = (data.trips.length + index + 1).toString().padStart(4, '0');
      const grossFare = Number(item.grossFare) || 300;
      const tollTax = Number(item.tollTax) || 0;
      const partnerFee = Number(item.partnerFee) || 50;
      const netFare = Math.max(0, grossFare - tollTax - partnerFee);
      const splitType = item.splitType || 'Revenue Share (75/25)';
      const driverShare = splitType === 'Revenue Share (75/25)' ? Number((netFare * 0.75).toFixed(2)) : netFare;
      const sikharShare = splitType === 'Revenue Share (75/25)' ? Number((netFare * 0.25).toFixed(2)) : 0;

      const formatted = {
        id: `TRP-2026-08-${nextIdx}`,
        partnerTripId: item.partnerTripId || `RPD-${Math.floor(100000 + Math.random() * 900000)}`,
        source: item.source || 'Rapido',
        vehicle: (item.vehicle || 'DL01EV9988').toUpperCase(),
        vehicleModel: item.vehicleModel || 'TATA TIGOR EV XPRESS T',
        driver: item.driver || 'Raj Kumar',
        driverPhone: item.driverPhone || '+91 98101 23456',
        pickupLocation: item.pickupLocation || 'Cyber City, Gurgaon',
        dropLocation: item.dropLocation || 'Aerocity, New Delhi',
        startTime: item.startTime || nowStr,
        endTime: item.endTime || nowStr,
        duration: item.duration || '35m',
        distanceKm: Number(item.distanceKm) || 12.5,
        status: item.status || 'Completed',
        grossFare: grossFare,
        tollTax: tollTax,
        partnerFee: partnerFee,
        netFare: netFare,
        splitType: splitType,
        driverShare: driverShare,
        sikharShare: sikharShare,
        settlementStatus: 'Credited to Wallet',
        telematics: {
          avgSpeed: '32 km/h',
          maxSpeed: '58 km/h',
          startBattery: '90%',
          endBattery: '84%',
          batteryConsumed: '6%',
          startOdo: '—',
          endOdo: '—'
        },
        notes: item.notes || 'Imported via Partner Settlement Reconciliation Statement.'
      };

      data.trips.unshift(formatted);
      addedCount++;
    });

    updateKpiCounts(data);
    saveTripsData(data);

    res.json({
      success: true,
      message: `Successfully imported and reconciled ${addedCount} partner trips.`,
      kpis: data.kpis
    });
  } catch (err) {
    console.error('Error importing trips:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// PATCH /api/trips/:id/status - Update trip status (e.g. Complete, Cancel, Dispute)
router.patch('/:id/status', (req, res) => {
  try {
    const data = getTripsData();
    const trip = data.trips.find(t => t.id === req.params.id);

    if (!trip) {
      return res.status(404).json({ success: false, message: 'Trip not found' });
    }

    const { status, notes, settlementStatus } = req.body;

    if (status) {
      trip.status = status;
      if (status === 'Completed' && (trip.endTime === '—' || !trip.endTime)) {
        trip.endTime = new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
        trip.duration = trip.duration.replace('In Transit', '').replace(/[()]/g, '').trim() || '35m';
      }
    }

    if (settlementStatus) {
      trip.settlementStatus = settlementStatus;
    }

    if (notes) {
      trip.notes = `${trip.notes ? trip.notes + ' · ' : ''}${notes}`;
    }

    updateKpiCounts(data);
    saveTripsData(data);

    res.json({
      success: true,
      message: `Trip ${trip.id} status updated to ${trip.status}`,
      trip,
      kpis: data.kpis
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/trips/:id/escalate - Seamlessly link a trip issue to Escalation Master
router.post('/:id/escalate', (req, res) => {
  try {
    const data = getTripsData();
    const trip = data.trips.find(t => t.id === req.params.id);

    if (!trip) {
      return res.status(404).json({ success: false, message: 'Trip not found' });
    }

    const { category, problem, priority } = req.body;

    // Read escalations
    let escData = { tickets: [] };
    try {
      escData = JSON.parse(fs.readFileSync(escalationsDataPath, 'utf-8'));
    } catch (e) {
      // fallback
    }

    const newTicketId = `ESC-${1000 + escData.tickets.length + 1}`;
    const newEscalation = {
      id: newTicketId,
      driver: trip.driver,
      driverPhone: trip.driverPhone,
      vehicle: trip.vehicle,
      vehicleModel: trip.vehicleModel,
      category: category || 'Payment / Earnings',
      priority: priority || 'P2',
      status: 'Open',
      owner: 'Auto Assign',
      team: 'Driver Support',
      slaMinutesTotal: priority === 'P1' ? 60 : 240,
      slaRemaining: priority === 'P1' ? '58m remaining' : '3h 55m remaining',
      slaBreached: false,
      problem: problem || `Disputed fare and settlement for Trip ${trip.id} (${trip.partnerTripId}). Pickup: ${trip.pickupLocation} → Drop: ${trip.dropLocation}.`,
      impact: 'Driver wallet settlement on hold pending dispute resolution.',
      location: trip.pickupLocation,
      history: [
        {
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          author: 'System (Trips Control Tower)',
          text: `Escalation raised directly from Trip Record ${trip.id}. Status changed to Disputed.`
        }
      ]
    };

    escData.tickets.unshift(newEscalation);
    fs.writeFileSync(escalationsDataPath, JSON.stringify(escData, null, 2), 'utf-8');

    // Update trip status
    trip.status = 'Disputed';
    trip.settlementStatus = 'Disputed';
    trip.notes = `${trip.notes ? trip.notes + ' · ' : ''}Escalation ticket ${newTicketId} opened.`;

    updateKpiCounts(data);
    saveTripsData(data);

    res.json({
      success: true,
      message: `Escalation ${newTicketId} created successfully for Trip ${trip.id}`,
      escalationId: newTicketId,
      trip
    });
  } catch (err) {
    console.error('Error creating trip escalation:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
