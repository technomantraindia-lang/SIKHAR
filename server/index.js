import express from 'express';
import cors from 'cors';
import authRoutes from './routes/authRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import fleetRoutes from './routes/fleetRoutes.js';
import driverRoutes from './routes/driverRoutes.js';
import assignmentRoutes from './routes/assignmentRoutes.js';
import rentalRoutes from './routes/rentalRoutes.js';
import { testDbConnection, getDbStatus } from './config/db.js';

const app = express();
const PORT = process.env.PORT || process.env.HOSTINGER_PORT || 5000;

// Enable Cross-Origin Resource Sharing and JSON Body Parsing
app.use(cors());
app.use(express.json());

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
    storageMode: dbInfo.isConnected ? 'MySQL Database Active' : 'Local Filesystem JSON (server/data/) Fallback',
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

// Start Server
app.listen(PORT, async () => {
  console.log(`=======================================================`);
  console.log(`🚀 SIKHAR FLEET NODE.JS BACKEND RUNNING ON PORT ${PORT}`);
  console.log(`🔒 Authentication: /api/auth/login (Admin Only)`);
  console.log(`📊 Dashboard API:  /api/dashboard`);
  console.log(`=======================================================`);

  // Run database connection test
  await testDbConnection();
});
