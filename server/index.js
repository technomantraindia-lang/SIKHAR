import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import fleetRoutes from './routes/fleetRoutes.js';
import driverRoutes from './routes/driverRoutes.js';
import { getDbPool, isDbLive, dbConfig } from './config/db.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Enable Cross-Origin Resource Sharing and JSON Body Parsing
app.use(cors());
app.use(express.json());

// API Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ONLINE',
    service: 'Sikhar Fleet Backend Server',
    environment: process.env.NODE_ENV || 'development',
    database: {
      connected: isDbLive(),
      host: dbConfig.host,
      name: dbConfig.database,
      mode: isDbLive() ? 'Remote MySQL Live' : 'Local JSON Fallback'
    },
    timestamp: new Date().toISOString()
  });
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/fleet', fleetRoutes);
app.use('/api/drivers', driverRoutes);

// Start Server & Connect Database
app.listen(PORT, async () => {
  console.log(`=======================================================`);
  console.log(`🚀 SIKHAR FLEET NODE.JS BACKEND RUNNING ON PORT ${PORT}`);
  console.log(`🗄️ Database Target: ${dbConfig.database} @ ${dbConfig.host}`);
  console.log(`🔒 Authentication: /api/auth/login`);
  console.log(`📊 Dashboard API:  /api/dashboard`);
  console.log(`=======================================================`);
  
  // Try connecting to database asynchronously without blocking server start
  await getDbPool();
});
