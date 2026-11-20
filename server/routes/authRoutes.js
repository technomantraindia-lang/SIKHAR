import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const adminDataPath = path.join(__dirname, '../data/admin.json');
const driversDataPath = path.join(__dirname, '../data/drivers.json');
const leasesDataPath = path.join(__dirname, '../data/leases.json');

// Read Admin data from local disk JSON
function getAdminData() {
  const raw = fs.readFileSync(adminDataPath, 'utf-8');
  return JSON.parse(raw).admin;
}

// Read and write Drivers data
function getDriversData() {
  try {
    const raw = fs.readFileSync(driversDataPath, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed reading drivers data:', err);
    return { drivers: [] };
  }
}

function saveDriversData(data) {
  try {
    fs.writeFileSync(driversDataPath, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('Failed writing drivers data:', err);
    return false;
  }
}

// Helper to look up active lease agreement for a driver
function getDriverLease(driver) {
  try {
    if (fs.existsSync(leasesDataPath)) {
      const leaseData = JSON.parse(fs.readFileSync(leasesDataPath, 'utf8'));
      const activeLease = (leaseData.leases || []).find(l => 
        (l.driverId && l.driverId === driver.id) || 
        (l.driverPhone && driver.phone && l.driverPhone.replace(/\D/g, '') === driver.phone.replace(/\D/g, '')) ||
        (driver.vehicle?.registration && l.vehicleRegistration === driver.vehicle.registration)
      );
      return activeLease || null;
    }
  } catch (e) {
    console.warn('Lease lookup warning:', e.message);
  }
  return null;
}

// Helper to look up live invoices for a driver from invoices.json
function getDriverInvoices(driver) {
  try {
    const invPath = path.join(__dirname, '../data/invoices.json');
    if (fs.existsSync(invPath)) {
      const invData = JSON.parse(fs.readFileSync(invPath, 'utf8'));
      const list = invData.invoices || [];
      const cleanId = (driver.id || '').toLowerCase();
      const cleanPhone = (driver.phone || '').replace(/\D/g, '').slice(-10);
      const cleanName = (driver.name || '').trim().toLowerCase();
      return list.filter(i => {
        const matchId = cleanId && (i.driverId?.toLowerCase() === cleanId || i.customerId?.toLowerCase() === cleanId);
        const matchPhone = cleanPhone && (i.driverPhone?.replace(/\D/g, '').includes(cleanPhone) || i.customerPhone?.replace(/\D/g, '').includes(cleanPhone));
        const matchName = cleanName && (i.driverName?.trim().toLowerCase() === cleanName || i.customerName?.trim().toLowerCase() === cleanName);
        return matchId || matchPhone || matchName;
      });
    }
  } catch (e) {
    console.warn('Invoices lookup warning:', e.message);
  }
  return [];
}

// Build the complete driver-facing wallet ledger from every persisted source.
// Older profiles store wallet entries in recentTransactions, while invoices
// are kept in their own collection. Merge both sources and de-duplicate by
// receipt/invoice reference so the portal never hides historical activity.
function getDriverWalletTransactions(driver, invoices = getDriverInvoices(driver)) {
  const wallet = driver?.wallet || {};
  const walletSources = [wallet.transactionHistory, wallet.transactions, wallet.recentTransactions]
    .filter(Array.isArray)
    .flat();
  const transactions = [];
  const walletIds = new Set();
  walletSources.forEach(transaction => {
    const key = transaction?.id || transaction?.reference || transaction?.receiptReference;
    if (key && walletIds.has(String(key))) return;
    if (key) walletIds.add(String(key));
    transactions.push(transaction);
  });
  const knownReferences = new Set(
    transactions.flatMap(tx => [tx?.id, tx?.reference, tx?.receiptReference].filter(Boolean).map(String))
  );

  invoices.forEach(invoice => {
    const invoiceId = invoice.invoiceNumber || invoice.id;
    const receiptReference = invoice.receiptReference || invoiceId;
    if (!invoiceId || knownReferences.has(String(receiptReference)) || knownReferences.has(String(invoiceId))) return;

    const amount = Number(invoice.amountPaid || invoice.totalAmount || invoice.balanceDue || 0);
    if (!amount) return;

    const paid = String(invoice.status || '').toLowerCase() === 'paid' || Number(invoice.amountPaid || 0) > 0;
    transactions.push({
      id: String(receiptReference),
      date: invoice.paidDate || invoice.invoiceDate || invoice.dueDate || invoice.period || 'Unknown date',
      type: paid ? 'Invoice Auto-Debit' : 'Invoice Due',
      amount: `-₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
      method: `${paid ? 'Invoice Paid' : 'Invoice Pending'}: ${invoiceId}${invoice.vehicleRegistration ? ` [${invoice.vehicleRegistration}]` : ''}`,
      status: paid ? 'Settled' : (invoice.status || 'Pending'),
      source: 'invoice'
    });
    knownReferences.add(String(receiptReference));
    knownReferences.add(String(invoiceId));
  });

  return transactions
    .map((transaction, index) => ({ ...transaction, _ledgerIndex: index }))
    .sort((a, b) => {
      const aTime = Date.parse(String(a.date || '').replace('·', ''));
      const bTime = Date.parse(String(b.date || '').replace('·', ''));
      if (Number.isNaN(aTime) && Number.isNaN(bTime)) return a._ledgerIndex - b._ledgerIndex;
      if (Number.isNaN(aTime)) return 1;
      if (Number.isNaN(bTime)) return -1;
      return bTime - aTime;
    })
    .map(({ _ledgerIndex, ...transaction }) => transaction);
}

function getSafeDriverProfile(driver, invoices = getDriverInvoices(driver)) {
  const { pin: _, password: __, ...safeProfile } = driver;
  const transactionHistory = getDriverWalletTransactions(driver, invoices);
  return {
    ...safeProfile,
    wallet: {
      ...(safeProfile.wallet || {}),
      recentTransactions: transactionHistory,
      transactionHistory
    }
  };
}

// Helper to look up today's replacement / swapped vehicle for driver
function getDriverTodayVehicle(driver) {
  if (!driver) return null;
  if (driver.todayVehicle && driver.todayVehicle.registration) {
    return driver.todayVehicle;
  }
  if (driver.temporaryAssignment && driver.temporaryAssignment.status === 'Active') {
    return {
      registration: driver.temporaryAssignment.assignedVehicle?.registration || driver.vehicle?.registration,
      model: driver.temporaryAssignment.assignedVehicle?.model || driver.vehicle?.model,
      type: driver.temporaryAssignment.assignedVehicle?.type || driver.vehicle?.type || 'EV',
      isTemporary: true,
      startDate: driver.temporaryAssignment.startDate,
      endDate: driver.temporaryAssignment.endDate,
      durationDays: driver.temporaryAssignment.durationDays,
      reason: driver.temporaryAssignment.reason || 'Temporary replacement / Duty swap',
      assignedBy: 'Fleet Admin Operations',
      originalVehicle: driver.temporaryAssignment.originalVehicle || driver.vehicle
    };
  }
  return null;
}

// =========================================================================
// ADMIN AUTHENTICATION
// =========================================================================

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
      user: {
        ...adminProfile,
        role: 'admin'
      },
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
    return res.json({
      success: true,
      user: {
        ...adminProfile,
        role: 'admin'
      }
    });
  } catch {
    return res.status(500).json({ success: false, message: 'Failed to retrieve admin session.' });
  }
});

// =========================================================================
// DRIVER AUTHENTICATION & ONBOARDING GATE
// =========================================================================

// POST /api/auth/driver/check-email
// Validates whether the driver's email was entered by the Admin in the driver registry
router.post('/driver/check-email', (req, res) => {
  try {
    const { email } = req.body;
    if (!email || !email.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Email address is required to verify driver enrollment.'
      });
    }

    const cleanEmail = email.trim().toLowerCase();
    const data = getDriversData();
    const driver = (data.drivers || []).find(d => 
      (d.email && d.email.trim().toLowerCase() === cleanEmail)
    );

    if (!driver) {
      return res.status(404).json({
        success: false,
        notFound: true,
        message: 'This email is not registered in the Sikhar Fleet driver list. Fleet Administrator has not added this email. Please contact fleet management to get enrolled.'
      });
    }

    return res.json({
      success: true,
      message: 'Driver profile verified in fleet records.',
      driver: {
        id: driver.id,
        name: driver.name,
        email: driver.email,
        phone: driver.phone,
        status: driver.status,
        isRegistered: Boolean(driver.pin || driver.password),
        vehicle: driver.vehicle ? {
          registration: driver.vehicle.registration,
          model: driver.vehicle.model
        } : null
      }
    });
  } catch (error) {
    console.error('Driver check-email error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error verifying driver email.' });
  }
});

// POST /api/auth/driver/register
// Sets Quick PIN for an existing driver added by Admin
router.post('/driver/register', (req, res) => {
  try {
    const { email, pin, password } = req.body;
    const cleanEmail = (email || '').trim().toLowerCase();
    const userPin = (pin || password || '').trim();

    if (!cleanEmail) {
      return res.status(400).json({ success: false, message: 'Driver email is required.' });
    }
    if (!userPin || userPin.length < 4) {
      return res.status(400).json({ success: false, message: 'Please set a secure 4 to 6 digit Quick PIN.' });
    }

    const data = getDriversData();
    const driver = (data.drivers || []).find(d => 
      (d.email && d.email.trim().toLowerCase() === cleanEmail)
    );

    if (!driver) {
      return res.status(404).json({
        success: false,
        message: 'This email is not registered in the Sikhar Fleet driver list. Fleet Administrator has not added this email. Please contact fleet management to get enrolled.'
      });
    }

    // Set PIN and mark registered
    driver.pin = userPin;
    driver.password = userPin;
    driver.isRegistered = true;
    driver.registeredAt = new Date().toISOString();
    const sessionToken = `drv_token_${driver.id}_${Date.now()}`;
    driver.sessionToken = sessionToken;
    driver.lastLogin = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

    saveDriversData(data);

    const activeLease = getDriverLease(driver);
    const invoices = getDriverInvoices(driver);
    const todayVehicle = getDriverTodayVehicle(driver);
    const safeProfile = getSafeDriverProfile(driver, invoices);

    return res.json({
      success: true,
      message: 'Driver account activated and Quick PIN created successfully!',
      user: {
        ...safeProfile,
        role: 'driver',
        activeLease,
        invoices,
        todayVehicle
      },
      token: sessionToken
    });
  } catch (error) {
    console.error('Driver register error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error registering driver.' });
  }
});

// POST /api/auth/driver/login
// Supports Quick PIN and Mobile OTP
router.post('/driver/login', (req, res) => {
  try {
    const { identifier, pin, otp, loginType = 'pin' } = req.body;
    const cleanId = (identifier || '').trim().toLowerCase();

    if (!cleanId) {
      return res.status(400).json({ success: false, message: 'Registered email or mobile phone is required.' });
    }

    const data = getDriversData();
    const cleanDigits = cleanId.replace(/\D/g, '');
    const driver = (data.drivers || []).find(d => {
      const emailMatch = d.email && d.email.trim().toLowerCase() === cleanId;
      const phoneClean = (d.phone || '').replace(/\D/g, '');
      const phoneMatch = cleanDigits.length >= 10 && phoneClean.includes(cleanDigits.slice(-10));
      return emailMatch || phoneMatch;
    });

    if (!driver) {
      return res.status(404).json({
        success: false,
        message: 'This account was not found in the Sikhar Fleet driver registry. Please verify your registered email or phone with your fleet administrator.'
      });
    }

    if (loginType === 'pin') {
      if (!driver.pin && !driver.password) {
        return res.status(400).json({
          success: false,
          needsRegistration: true,
          message: 'Quick PIN is not yet set for this driver account. Please switch to the "Register / Set PIN" tab to activate your portal access.'
        });
      }

      if (String(driver.pin) !== String(pin).trim() && String(driver.password) !== String(pin).trim()) {
        return res.status(401).json({
          success: false,
          message: 'Invalid Quick PIN. Please check your PIN and try again.'
        });
      }
    } else if (loginType === 'otp') {
      // Validate OTP: accept standard demo test OTP 123456 or 000000
      if (!otp || (String(otp).trim() !== '123456' && String(otp).trim() !== '000000')) {
        return res.status(401).json({
          success: false,
          message: 'Invalid Mobile OTP. Enter demo verification OTP 123456 to continue.'
        });
      }
    }

    const sessionToken = `drv_token_${driver.id}_${Date.now()}`;
    driver.sessionToken = sessionToken;
    driver.lastLogin = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
    saveDriversData(data);

    const activeLease = getDriverLease(driver);
    const invoices = getDriverInvoices(driver);
    const todayVehicle = getDriverTodayVehicle(driver);
    const safeProfile = getSafeDriverProfile(driver, invoices);

    return res.json({
      success: true,
      message: 'Driver logged in successfully.',
      user: {
        ...safeProfile,
        role: 'driver',
        activeLease,
        invoices,
        todayVehicle
      },
      token: sessionToken
    });
  } catch (error) {
    console.error('Driver login error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error during driver login.' });
  }
});

// GET /api/auth/driver/me
router.get('/driver/me', (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : req.query.token;
    const driverId = req.query.id;

    const data = getDriversData();
    let driver = null;
    if (token) {
      driver = (data.drivers || []).find(d => d.sessionToken === token);
    }
    if (!driver && driverId) {
      driver = (data.drivers || []).find(d => d.id === driverId);
    }

    if (!driver) {
      return res.status(401).json({ success: false, message: 'Driver session expired or invalid.' });
    }

    const activeLease = getDriverLease(driver);
    const invoices = getDriverInvoices(driver);
    const todayVehicle = getDriverTodayVehicle(driver);
    const safeProfile = getSafeDriverProfile(driver, invoices);
    return res.json({
      success: true,
      user: {
        ...safeProfile,
        role: 'driver',
        activeLease,
        invoices,
        todayVehicle
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to retrieve driver profile.' });
  }
});

export default router;
