import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const adminDataPath = path.join(__dirname, '../data/admin.json');

// Read Admin data from local disk JSON
function getAdminData() {
  const raw = fs.readFileSync(adminDataPath, 'utf-8');
  return JSON.parse(raw).admin;
}

// POST /api/auth/login - Strict Admin Only Authentication
router.post('/login', (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    const admin = getAdminData();
    if (admin.email.toLowerCase() !== email.trim().toLowerCase() || admin.password !== password) {
      return res.status(401).json({
        success: false,
        message: 'Invalid administrative credentials. Access restricted to authorized personnel.'
      });
    }

    // Update last login timestamp in local disk file
    admin.lastLogin = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
    fs.writeFileSync(adminDataPath, JSON.stringify({ admin }, null, 2));

    // Return authenticated session (strip password)
    const { password: _, ...adminProfile } = admin;
    return res.json({
      success: true,
      message: 'Admin session authorized.',
      user: adminProfile,
      token: admin.sessionToken
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ success: false, message: 'Internal authentication server error.' });
  }
});

// GET /api/auth/me - Verify Current Session
router.get('/me', (req, res) => {
  try {
    const admin = getAdminData();
    const { password: _, ...adminProfile } = admin;
    return res.json({ success: true, user: adminProfile });
  } catch {
    return res.status(500).json({ success: false, message: 'Failed to retrieve admin session.' });
  }
});

export default router;
