import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dashboardDataPath = path.join(__dirname, '../data/dashboard.json');

// Read Dashboard metrics from local disk JSON
function getDashboardData() {
  const raw = fs.readFileSync(dashboardDataPath, 'utf-8');
  return JSON.parse(raw);
}

// GET /api/dashboard - Returns executive dashboard metrics
router.get('/', (req, res) => {
  try {
    const data = getDashboardData();
    return res.json({ success: true, data });
  } catch (error) {
    console.error('Dashboard read error:', error);
    return res.status(500).json({ success: false, message: 'Failed to load executive dashboard data.' });
  }
});

// POST /api/dashboard/quick-action - Simulates actions like day close or alert acknowledgement
router.post('/quick-action', (req, res) => {
  try {
    const { actionType, payload } = req.body;
    const data = getDashboardData();

    if (actionType === 'ACK_ALERT') {
      data.alerts = data.alerts.filter(a => a.id !== payload.alertId);
      fs.writeFileSync(dashboardDataPath, JSON.stringify(data, null, 2));
    }

    return res.json({ success: true, message: 'Action executed successfully.', data });
  } catch {
    return res.status(500).json({ success: false, message: 'Action failed.' });
  }
});

export default router;
