import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { query } from '../server/config/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, '../server/data');

const fleetPath = path.join(DATA_DIR, 'fleet.json');
const tripsPath = path.join(DATA_DIR, 'trips.json');

async function fix() {
  console.log('--- Fixing Fleet Data (Adding DL3CAB1234) ---');
  const fleetData = JSON.parse(fs.readFileSync(fleetPath, 'utf8'));

  const exists = fleetData.vehicles.some(v => (v.registration || '').toUpperCase() === 'DL3CAB1234');
  if (!exists) {
    const tiagoEv = {
      id: "DL3CAB1234",
      registration: "DL3CAB1234",
      model: "TATA TIAGO EV",
      type: "EV",
      connectorType: "CCS2 Fast Charge / Type 2",
      driver: "Parekh Dhruv  tester",
      driverPhone: "9628424115",
      driverStatus: "On Road (Assigned 1:1)",
      status: "On Road",
      location: "Vadodara Hub",
      hub: "Vadodara Hub",
      since: "05 Nov 2026",
      duration: "Active Lease",
      nextAction: "Monitor Telemetry",
      actionType: "VIEW_TELEMETRY",
      odometer: "100 km",
      battery: "85%",
      health: "Healthy",
      healthStatus: "good",
      service: "Next service · 15 Dec 2026",
      permit: "Valid · 31 Dec 2026",
      insurance: "Valid · 31 Dec 2026",
      fitness: "Valid · 31 Dec 2027",
      puc: "Exempt (EV)",
      chassis: "MAT612034NJB70999",
      lender: "Tata Motors Finance",
      monthlyEmi: "₹15000",
      challansCount: 0,
      challansAmount: "₹0",
      dailyRentRate: "₹500",
      notes: "Dedicated vehicle asset assigned to Parekh Dhruv tester.",
      assignmentHistory: [
        {
          driver: "Parekh Dhruv  tester",
          shiftType: "Permanent Dedicated",
          fromDate: "05/11/2026",
          toDate: "Present",
          handoverKm: "100 km",
          status: "Active",
          reason: "Dedicated vehicle assignment"
        }
      ],
      allocatedTo: "Parekh Dhruv  tester",
      allocatedUntil: null,
      allocationType: "permanent"
    };

    fleetData.vehicles.unshift(tiagoEv);
    if (fleetData.summary?.metrics?.totalFleet) {
      fleetData.summary.metrics.totalFleet.value = fleetData.vehicles.length;
    }
    fs.writeFileSync(fleetPath, JSON.stringify(fleetData, null, 2), 'utf8');
    console.log('✅ DL3CAB1234 added to fleet.json! Total vehicles:', fleetData.vehicles.length);
  } else {
    console.log('ℹ️ DL3CAB1234 already exists in fleet.json');
  }

  console.log('\n--- Fixing Trips Data (Normalizing Object Locations) ---');
  const tripsData = JSON.parse(fs.readFileSync(tripsPath, 'utf8'));

  // Clean or remove temporary test orders
  tripsData.trips = tripsData.trips.filter(t => !t.id.includes('RD123456'));

  // Format any object locations across all remaining trips
  tripsData.trips.forEach(t => {
    if (t.pickupLocation && typeof t.pickupLocation === 'object') {
      t.pickupCoordinates = t.pickupLocation;
      t.pickupLocation = t.pickupLocation.lat && t.pickupLocation.lng 
        ? `${t.pickupLocation.lat}, ${t.pickupLocation.lng}` 
        : 'GPS Location';
    }
    if (t.dropLocation && typeof t.dropLocation === 'object') {
      t.dropCoordinates = t.dropLocation;
      t.dropLocation = t.dropLocation.lat && t.dropLocation.lng 
        ? `${t.dropLocation.lat}, ${t.dropLocation.lng}` 
        : 'GPS Location';
    }
  });

  fs.writeFileSync(tripsPath, JSON.stringify(tripsData, null, 2), 'utf8');
  console.log('✅ trips.json normalized! Total trips:', tripsData.trips.length);

  console.log('\n--- Syncing to MySQL Database (admin_operational_snapshots) ---');
  try {
    await query(
      `INSERT INTO admin_operational_snapshots (domain, payload)
       VALUES (?, ?)
       ON DUPLICATE KEY UPDATE payload = VALUES(payload), updated_at = CURRENT_TIMESTAMP`,
      ['fleet', JSON.stringify(fleetData)]
    );
    console.log('✅ Updated fleet snapshot in MySQL!');

    await query(
      `INSERT INTO admin_operational_snapshots (domain, payload)
       VALUES (?, ?)
       ON DUPLICATE KEY UPDATE payload = VALUES(payload), updated_at = CURRENT_TIMESTAMP`,
      ['trips', JSON.stringify(tripsData)]
    );
    console.log('✅ Updated trips snapshot in MySQL!');
  } catch (dbErr) {
    console.error('Database update error:', dbErr.message);
  }

  console.log('\n✅ ALL DATA & DB FIXES COMPLETE!');
  process.exit(0);
}

fix();
