import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import fs from 'fs';

import authRoutes from './server/routes/authRoutes.js';
import dashboardRoutes from './server/routes/dashboardRoutes.js';
import fleetRoutes from './server/routes/fleetRoutes.js';
import driverRoutes from './server/routes/driverRoutes.js';
import assignmentRoutes from './server/routes/assignmentRoutes.js';
import rentalRoutes from './server/routes/rentalRoutes.js';
import escalationRoutes from './server/routes/escalationRoutes.js';
import tripRoutes from './server/routes/tripRoutes.js';
import maintenanceRoutes from './server/routes/maintenanceRoutes.js';
import fuelRoutes from './server/routes/fuelRoutes.js';
import complianceRoutes from './server/routes/complianceRoutes.js';
import ocrRoutes from './server/routes/ocrRoutes.js';
import rapidoRoutes from './server/routes/rapidoRoutes.js';
import { testDbConnection, getDbStatus } from './server/config/db.js';

// Catch unhandled errors so they show in logs instead of silent death
process.on('uncaughtException', (err) => {
  console.error('🔥 UNCAUGHT EXCEPTION:', err);
});
process.on('unhandledRejection', (reason) => {
  console.error('🔥 UNHANDLED REJECTION:', reason);
});

// Load environment variables from .env
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Enable Cross-Origin Resource Sharing and JSON Body Parsing (25MB for document photos)
app.use(cors());
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// API Health Check
app.get('/api/health', (req, res) => {
  const dbInfo = getDbStatus();
  res.json({
    status: 'ONLINE',
    service: 'Sikhar Fleet Backend Server',
    database: {
      name: dbInfo.database,
      user: dbInfo.user,
      host: dbInfo.host,
      connected: dbInfo.isConnected
    },
    storageMode: dbInfo.isConnected ? 'MySQL Database Active' : 'Local Filesystem JSON Fallback',
    timestamp: new Date().toISOString()
  });
});

// Database Status & Diagnostics API
app.get('/api/db-status', async (req, res) => {
  const status = await testDbConnection();
  res.json(status);
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/fleet', fleetRoutes);
app.use('/api/drivers', driverRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/rentals', rentalRoutes);
app.use('/api/escalations', escalationRoutes);
app.use('/api/trips', tripRoutes);
app.use('/api/maintenance', maintenanceRoutes);
app.use('/api/fuel', fuelRoutes);
app.use('/api/compliance', complianceRoutes);
app.use('/api/ocr', ocrRoutes);
app.use('/api/v1/fleet', rapidoRoutes);

// Serve Frontend Vite Static Build (dist)
const distPath = path.join(__dirname, 'dist');
app.use(express.static(distPath));

// For SPA routing: serve index.html for any GET request that is not /api
// Using middleware instead of app.get('*') to prevent Express 5 / path-to-regexp crash
app.use((req, res, next) => {
  if (req.method === 'GET' && !req.path.startsWith('/api')) {
    const indexPath = path.join(distPath, 'index.html');
    if (fs.existsSync(indexPath)) {
      return res.sendFile(indexPath);
    }
  }
  next();
});

// Start Server on UNIX socket or 0.0.0.0:PORT
const SOCKET_PATH = process.env.SOCKET_PATH;
let server;

if (SOCKET_PATH) {
  if (fs.existsSync(SOCKET_PATH)) {
    try { fs.unlinkSync(SOCKET_PATH); } catch (e) {}
  }
  server = app.listen(SOCKET_PATH, async () => {
    try { fs.chmodSync(SOCKET_PATH, '0777'); } catch (e) {}
    console.log(`=======================================================`);
    console.log(`🚀 SIKHAR FLEET NODE.JS APP RUNNING ON UNIX SOCKET: ${SOCKET_PATH}`);
    console.log(`🔒 Authentication: /api/auth/login (Admin Only)`);
    console.log(`📊 Dashboard API:  /api/dashboard`);
    console.log(`=======================================================`);
    try {
      await testDbConnection();
    } catch (err) {
      console.error('DB test error on startup:', err);
    }
  });
} else {
  server = app.listen(PORT, '0.0.0.0', async () => {
    console.log(`=======================================================`);
    console.log(`🚀 SIKHAR FLEET NODE.JS APP RUNNING ON PORT ${PORT}`);
    console.log(`🌐 Serving Frontend Build from: ${distPath}`);
    console.log(`🔒 Authentication: /api/auth/login (Admin Only)`);
    console.log(`📊 Dashboard API:  /api/dashboard`);
    console.log(`=======================================================`);
    try {
      await testDbConnection();
    } catch (err) {
      console.error('DB test error on startup:', err);
    }
  });
}

server.on('error', (err) => {
  console.error('🔥 SERVER LISTEN ERROR:', err);
});

export default app;
