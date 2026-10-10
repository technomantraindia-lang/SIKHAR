import express from 'express';
import cors from 'cors';
import authRoutes from './routes/authRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import fleetRoutes from './routes/fleetRoutes.js';
import driverRoutes from './routes/driverRoutes.js';

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
    environment: 'Local Offline Mode',
    storageMode: 'Local Filesystem JSON (server/data/)',
    timestamp: new Date().toISOString()
  });
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/fleet', fleetRoutes);
app.use('/api/drivers', driverRoutes);

// Start Server
app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`🚀 SIKHAR FLEET NODE.JS BACKEND RUNNING ON PORT ${PORT}`);
  console.log(`📂 Data Storage: server/data/*.json (Local File Store)`);
  console.log(`🔒 Authentication: /api/auth/login (Admin Only)`);
  console.log(`📊 Dashboard API:  /api/dashboard`);
  console.log(`=======================================================`);
});
