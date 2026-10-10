import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dbConfig, initializeTables } from '../config/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '../data');

async function seedDatabase() {
  console.log(`[SEED] Connecting to ${dbConfig.database} @ ${dbConfig.host}...`);
  let connection;

  try {
    connection = await mysql.createConnection(dbConfig);
    console.log(`[SEED] ✅ Connected to MySQL database.`);

    // Initialize Schema
    const schemaSql = fs.readFileSync(path.resolve(__dirname, 'schema.sql'), 'utf8');
    const statements = schemaSql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    for (const statement of statements) {
      await connection.query(statement);
    }
    console.log(`[SEED] ✅ Database schema verified.`);

    // 1. Seed Admin
    const adminData = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'admin.json'), 'utf8')).admin;
    if (adminData) {
      await connection.query(`
        INSERT INTO admins (id, name, email, password, role, designation, initials, branch, tenant, permissions, last_login, session_token)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          name=VALUES(name),
          email=VALUES(email),
          password=VALUES(password),
          role=VALUES(role),
          designation=VALUES(designation),
          initials=VALUES(initials);
      `, [
        adminData.id,
        adminData.name,
        adminData.email,
        adminData.password,
        adminData.role,
        adminData.designation,
        adminData.initials,
        adminData.branch,
        adminData.tenant,
        JSON.stringify(adminData.permissions || []),
        adminData.lastLogin || '',
        adminData.sessionToken || ''
      ]);
      console.log(`[SEED] ✅ Seeded Admin: ${adminData.email}`);
    }

    // 2. Seed Drivers
    const driversData = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'drivers.json'), 'utf8')).drivers || [];
    for (const d of driversData) {
      await connection.query(`
        INSERT INTO drivers (
          id, name, phone, alt_phone, city, photo, mobile_verified, status, rating,
          shift, shift_type, co_driver, location, vehicle_reg, vehicle_model, vehicle_type,
          vehicle_status, today_gross, today_trips, wallet, kyc, deal, attendance
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          name=VALUES(name),
          phone=VALUES(phone),
          status=VALUES(status),
          vehicle_reg=VALUES(vehicle_reg),
          wallet=VALUES(wallet),
          kyc=VALUES(kyc);
      `, [
        d.id,
        d.name,
        d.phone,
        d.altPhone || '',
        d.city || 'Gurgaon Operations Hub',
        d.photo || '',
        d.mobileVerified ? 1 : 0,
        d.status || 'Ready',
        d.rating || 5.0,
        d.shift || '',
        d.shiftType || '24-Hour Dedicated',
        d.coDriver || null,
        d.location || '',
        d.vehicle?.registration || null,
        d.vehicle?.model || null,
        d.vehicle?.type || null,
        d.vehicle?.status || null,
        d.todayGross || '₹0',
        d.todayTrips || 0,
        JSON.stringify(d.wallet || {}),
        JSON.stringify(d.kyc || {}),
        JSON.stringify(d.deal || {}),
        JSON.stringify(d.attendance || {})
      ]);
    }
    console.log(`[SEED] ✅ Seeded ${driversData.length} drivers.`);

    // 3. Seed Vehicles
    const fleetData = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'fleet.json'), 'utf8')).fleet || [];
    for (const v of fleetData) {
      await connection.query(`
        INSERT INTO vehicles (
          registration, model, type, status, fuel_level, battery_percentage, range_km,
          odometer_km, assigned_driver_id, assigned_driver_name, hub_location, telematics, compliance
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          model=VALUES(model),
          status=VALUES(status),
          fuel_level=VALUES(fuel_level),
          assigned_driver_id=VALUES(assigned_driver_id),
          assigned_driver_name=VALUES(assigned_driver_name);
      `, [
        v.registration,
        v.model,
        v.type || 'EV',
        v.status || 'Available',
        v.fuelLevel || '80%',
        v.batteryPercentage || 80,
        v.rangeKm || 150,
        v.odometerKm || 45000,
        v.assignedDriver?.id || null,
        v.assignedDriver?.name || null,
        v.hubLocation || 'Gurgaon Hub',
        JSON.stringify(v.telematics || {}),
        JSON.stringify(v.compliance || {})
      ]);
    }
    console.log(`[SEED] ✅ Seeded ${fleetData.length} fleet vehicles.`);

    console.log(`[SEED] 🎉 All tables successfully created and seeded into ${dbConfig.database}!`);
  } catch (err) {
    console.error(`[SEED] ❌ Seeding error:`, err.message);
  } finally {
    if (connection) await connection.end();
  }
}

seedDatabase();
