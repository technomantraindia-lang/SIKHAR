import { query } from '../server/config/db.js';

async function check() {
  const rows = await query("SELECT payload FROM admin_operational_snapshots WHERE domain = 'trips'");
  if (!rows || !rows.length) {
    console.log('No trips snapshot in DB');
    process.exit(0);
  }
  const t = JSON.parse(rows[0].payload);
  console.log('Total trips in DB:', t.trips.length);
  const badTrips = t.trips.filter(x => (x.pickupLocation && typeof x.pickupLocation === 'object') || (x.dropLocation && typeof x.dropLocation === 'object'));
  console.log('Bad trips with object locations count:', badTrips.length);
  badTrips.forEach(b => {
    console.log(`Trip ID: ${b.id}, pickup:`, b.pickupLocation, 'drop:', b.dropLocation);
  });

  const fleetRows = await query("SELECT payload FROM admin_operational_snapshots WHERE domain = 'fleet'");
  const f = JSON.parse(fleetRows[0].payload);
  console.log('Total vehicles in DB:', f.vehicles.length);
  const hasDl3 = f.vehicles.some(v => v.registration === 'DL3CAB1234');
  console.log('DB fleet has DL3CAB1234:', hasDl3);

  process.exit(0);
}

check();
