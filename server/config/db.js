import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from project root
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export function getDbConfig() {
  dotenv.config({ path: path.resolve(__dirname, '../../.env') });
  return {
    host: process.env.DB_HOST || '145.79.212.232',
    user: process.env.DB_USER || 'u212890862_sikhar',
    password: process.env.DB_PASSWORD || 'Rashmi@saha1988',
    database: process.env.DB_NAME || 'u212890862_sikhar',
    port: Number(process.env.DB_PORT) || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    connectTimeout: 8000
  };
}

let pool = null;
let isConnected = false;

function initPool() {
  const cfg = getDbConfig();
  try {
    pool = mysql.createPool(cfg);
  } catch (err) {
    console.error('⚠️ Could not initialize MySQL pool:', err.message);
  }
  return pool;
}

initPool();

/**
 * Test MySQL connection
 */
export async function testDbConnection() {
  const cfg = getDbConfig();
  // Ensure pool is using latest config
  initPool();

  if (!pool) return { success: false, message: 'Pool not initialized' };
  try {
    const connection = await pool.getConnection();
    console.log(`=======================================================`);
    console.log(`✅ MYSQL DATABASE CONNECTED SUCCESSFULLY!`);
    console.log(`📦 Database: ${cfg.database}`);
    console.log(`👤 User:     ${cfg.user}`);
    console.log(`🌐 Host:     ${cfg.host}:${cfg.port}`);
    console.log(`=======================================================`);
    connection.release();
    isConnected = true;
    return {
      success: true,
      database: cfg.database,
      user: cfg.user,
      host: cfg.host,
      status: 'CONNECTED'
    };
  } catch (err) {
    isConnected = false;
    console.warn(`=======================================================`);
    console.warn(`⚠️ MYSQL CONNECTION ATTEMPT:`);
    console.warn(`Database: ${cfg.database} @ ${cfg.host}`);
    console.warn(`Status: Offline / Host unreachable (${err.code || err.message})`);
    console.warn(`ℹ️ Node.js server will continue in resilient hybrid mode`);
    console.warn(`   (Local data fallback active in server/data/*.json)`);
    console.warn(`=======================================================`);
    return {
      success: false,
      database: cfg.database,
      host: cfg.host,
      error: err.code || err.message,
      status: 'OFFLINE_FALLBACK'
    };
  }
}

/**
 * Safe query runner with fallback
 */
export async function query(sql, params = []) {
  if (!pool) throw new Error('Database pool not ready');
  const [results] = await pool.execute(sql, params);
  return results;
}

export function getDbStatus() {
  const cfg = getDbConfig();
  return {
    isConnected,
    database: cfg.database,
    user: cfg.user,
    host: cfg.host
  };
}

export default pool;
