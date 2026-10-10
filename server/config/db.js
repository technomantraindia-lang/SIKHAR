import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '../data');

// Configuration from environment
export const dbConfig = {
  host: process.env.DB_HOST || '82.25.123.33',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USER || 'u253609925_T5Cexn3e2_sikhar',
  password: process.env.DB_PASSWORD || '1>A;3!+bi',
  database: process.env.DB_NAME || 'u253609925_T5Cexn3e2_sikhar',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  connectTimeout: 8000
};

let pool = null;
let isConnected = false;

export async function getDbPool() {
  if (pool) return pool;

  try {
    pool = mysql.createPool(dbConfig);
    // Test connectivity
    const connection = await pool.getConnection();
    await connection.ping();
    connection.release();
    isConnected = true;
    console.log(`[MYSQL] ✅ Successfully connected to remote database: ${dbConfig.database} @ ${dbConfig.host}`);
    await initializeTables();
    return pool;
  } catch (err) {
    isConnected = false;
    console.warn(`[MYSQL] ⚠️ Remote MySQL connection unavailable (${err.code || err.message}).`);
    console.warn(`[MYSQL] 🔄 Operating in resilient fallback mode (server/data/*.json file store).`);
    return null;
  }
}

export function isDbLive() {
  return isConnected;
}

// Ensure database tables exist
export async function initializeTables() {
  if (!pool || !isConnected) return;

  try {
    const conn = await pool.getConnection();

    // 1. Admins Table
    await conn.query(`
      CREATE TABLE IF NOT EXISTS admins (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(150) NOT NULL,
        email VARCHAR(150) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(100) DEFAULT 'Administrator',
        designation VARCHAR(150),
        initials VARCHAR(10),
        branch VARCHAR(150),
        tenant VARCHAR(150),
        permissions JSON,
        last_login VARCHAR(100),
        session_token VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 2. Drivers Table
    await conn.query(`
      CREATE TABLE IF NOT EXISTS drivers (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(150) NOT NULL,
        phone VARCHAR(50) NOT NULL,
        alt_phone VARCHAR(50),
        city VARCHAR(150),
        photo VARCHAR(255),
        mobile_verified BOOLEAN DEFAULT TRUE,
        status VARCHAR(50) DEFAULT 'Ready',
        rating DECIMAL(3, 1) DEFAULT 5.0,
        shift VARCHAR(150),
        shift_type VARCHAR(100),
        co_driver VARCHAR(150),
        location VARCHAR(150),
        vehicle_reg VARCHAR(50),
        vehicle_model VARCHAR(100),
        vehicle_type VARCHAR(50),
        vehicle_status VARCHAR(50),
        today_gross VARCHAR(50) DEFAULT '₹0',
        today_trips INT DEFAULT 0,
        wallet JSON,
        kyc JSON,
        deal JSON,
        attendance JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 3. Vehicles Table
    await conn.query(`
      CREATE TABLE IF NOT EXISTS vehicles (
        registration VARCHAR(50) PRIMARY KEY,
        model VARCHAR(150) NOT NULL,
        type VARCHAR(50) DEFAULT 'EV',
        status VARCHAR(50) DEFAULT 'Available',
        fuel_level VARCHAR(50),
        battery_percentage INT,
        range_km INT,
        odometer_km INT,
        assigned_driver_id VARCHAR(50),
        assigned_driver_name VARCHAR(150),
        hub_location VARCHAR(150),
        telematics JSON,
        compliance JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    console.log(`[MYSQL] 📋 Core database tables verified (admins, drivers, vehicles).`);
    conn.release();
  } catch (err) {
    console.error(`[MYSQL] ❌ Error initializing database tables:`, err.message);
  }
}
