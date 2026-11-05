import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_FILE = path.join(__dirname, '../data/drivers.json');
const LEASES_FILE = path.join(__dirname, '../data/leases.json');

// Helper to read data safely
function readDriversData() {
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to read drivers data:', err);
    return { summary: {}, actionQueue: [], drivers: [] };
  }
}

// Helper to write data safely
function writeDriversData(data) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error('Failed to write drivers data:', err);
    return false;
  }
}

// Helper to release assigned vehicle back to available yard fleet when driver is deleted
const FLEET_DATA_FILE = path.join(__dirname, '../data/fleet.json');
function unassignVehicleInFleet(driverName, reg) {
  try {
    if (!fs.existsSync(FLEET_DATA_FILE)) return;
    const raw = fs.readFileSync(FLEET_DATA_FILE, 'utf8');
    const fleetData = JSON.parse(raw);
    let changed = false;
    if (Array.isArray(fleetData.vehicles)) {
      fleetData.vehicles.forEach(v => {
        if ((reg && v.registration === reg) || (driverName && v.driver === driverName)) {
          v.driver = 'Unassigned';
          v.driverPhone = '-';
          v.driverStatus = 'Available in Yard';
          v.status = 'Ready for Duty';
          changed = true;
        }
      });
    }
    if (changed) {
      fs.writeFileSync(FLEET_DATA_FILE, JSON.stringify(fleetData, null, 2), 'utf8');
    }
  } catch (err) {
    console.warn('Could not unassign vehicle in fleet data:', err.message);
  }
}

function syncVehicleAssignmentInFleet(driver, previousRegistration = '') {
  try {
    if (!fs.existsSync(FLEET_DATA_FILE)) return;
    const fleetData = JSON.parse(fs.readFileSync(FLEET_DATA_FILE, 'utf8'));
    const clean = value => String(value || '').toUpperCase().replace(/\s+/g, '');
    const previous = clean(previousRegistration);
    const current = clean(driver.vehicle?.registration);
    let changed = false;

    (fleetData.vehicles || []).forEach(vehicle => {
      const registration = clean(vehicle.registration || vehicle.id);
      if (previous && registration === previous && registration !== current) {
        vehicle.driver = 'Unassigned';
        vehicle.driverPhone = '-';
        vehicle.driverStatus = 'Available in Yard';
        vehicle.status = 'Ready to Deploy';
        changed = true;
      }
      if (current && registration === current) {
        vehicle.driver = driver.name;
        vehicle.driverPhone = driver.phone;
        vehicle.driverStatus = 'On Duty';
        vehicle.status = 'On Road';
        changed = true;
      }
    });

    if (changed) fs.writeFileSync(FLEET_DATA_FILE, JSON.stringify(fleetData, null, 2), 'utf8');
  } catch (err) {
    console.warn('Could not sync vehicle assignment in fleet data:', err.message);
  }
}

// GET /api/drivers - List all drivers with query filters
router.get('/', (req, res) => {
  const { status, wallet, search } = req.query;
  const data = readDriversData();
  let list = data.drivers || [];

  // Filter by status (onDuty, onLeave, suspended, ready, unassigned)
  if (status && status !== 'all') {
    const sLower = status.toLowerCase();
    list = list.filter(d => {
      if (sLower === 'duty' || sLower === 'onduty') return d.status === 'On Duty';
      if (sLower === 'leave' || sLower === 'onleave') return d.status === 'On Leave';
      if (sLower === 'suspended') return d.status === 'Suspended';
      if (sLower === 'ready') return d.status === 'Ready';
      if (sLower === 'unassigned') return d.status === 'Unassigned' || !d.vehicle;
      return d.status.toLowerCase() === sLower;
    });
  }

  // Filter by wallet status (healthy, low, breached)
  if (wallet && wallet !== 'all') {
    const wLower = wallet.toLowerCase();
    list = list.filter(d => d.wallet && d.wallet.status.toLowerCase().includes(wLower));
  }

  // Search by driver name, phone, driving licence, or vehicle registration
  if (search && search.trim() !== '') {
    const q = search.trim().toLowerCase();
    list = list.filter(d =>
      d.name.toLowerCase().includes(q) ||
      d.phone.toLowerCase().includes(q) ||
      (d.vehicle && d.vehicle.registration.toLowerCase().includes(q)) ||
      (d.kyc && d.kyc.drivingLicence && d.kyc.drivingLicence.toLowerCase().includes(q)) ||
      (d.kyc && d.kyc.panCard && d.kyc.panCard.toLowerCase().includes(q))
    );
  }

  res.json({
    success: true,
    data: {
      summary: data.summary,
      actionQueue: data.actionQueue,
      drivers: list,
      totalCount: (data.drivers || []).length,
      filteredCount: list.length
    }
  });
});

// GET /api/drivers/wallet-health - Complete Wallet Health Dashboard metrics & driver ledger list
router.get('/wallet-health', (req, res) => {
  const { status, search } = req.query;
  const data = readDriversData();
  const drivers = data.drivers || [];

  // Aggregate metrics
  const totalWallets = drivers.length;
  const activeWallets = drivers.filter(d => d.status !== 'Suspended').length;

  let totalBalance = 0;
  let healthyBalance = 0;
  let healthyCount = 0;
  let lowBalanceCount = 0;
  let breachedCount = 0;
  let breachedOutstanding = 0;

  let topupsToday = 0;
  let topupsTodayCount = 0;
  let deductionsToday = 0;
  let deductionsTodayCount = 0;
  let allTimeTopups = 0;
  let allTimeTopupsCount = 0;
  let allTimeDeductions = 0;
  let allTimeDeductionsCount = 0;

  function isTransactionToday(dateStr) {
    if (!dateStr) return false;
    const s = String(dateStr).trim().toLowerCase();
    if (s.startsWith('today')) return true;
    const today = new Date();
    const day = String(today.getDate()).padStart(2, '0');
    const monthNames = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
    const monthShort = monthNames[today.getMonth()];
    const year = today.getFullYear();
    if (s.includes(`${day} ${monthShort} ${year}`) || s.includes(`${today.getDate()} ${monthShort} ${year}`)) return true;
    if (s.includes(`${year}-${String(today.getMonth() + 1).padStart(2, '0')}-${day}`)) return true;
    return false;
  }

  const list = drivers.map(d => {
    const w = d.wallet || {
      postedBalance: 0,
      activeHolds: 0,
      spendableBalance: 0,
      status: 'Healthy',
      autoTopup: true,
      lastTopup: '18 Aug 2026 · ₹1,200',
      recentTransactions: []
    };

    const spendable = Number(w.spendableBalance !== undefined ? w.spendableBalance : (w.postedBalance || 0) - (w.activeHolds || 0));
    const outstanding = Number(w.outstandingDues || (spendable < 0 ? Math.abs(spendable) : 0));
    const threshold = Number(w.lowBalanceThreshold || (outstanding > 5000 ? 2000 : outstanding > 1000 ? 1000 : 500));
    
    let statusComputed = 'Healthy';
    if (w.status === 'Breached' || spendable < 0 || outstanding > 0) {
      statusComputed = 'Breached';
      breachedCount++;
      breachedOutstanding += outstanding;
    } else if (w.status === 'Low Balance' || spendable <= threshold) {
      statusComputed = 'Low Balance';
      lowBalanceCount++;
    } else {
      statusComputed = 'Healthy';
      healthyCount++;
      healthyBalance += Math.max(0, spendable);
    }

    totalBalance += Math.max(0, spendable);

    (w.recentTransactions || []).forEach(tx => {
      const amtStr = String(tx.amount || '').replace(/[^0-9.]/g, '');
      const num = parseFloat(amtStr) || 0;
      const isTopup = tx.type?.toLowerCase().includes('top') || tx.type?.toLowerCase().includes('credit') || tx.type?.toLowerCase().includes('deposit') || String(tx.amount || '').startsWith('+');
      const isDeduction = tx.type?.toLowerCase().includes('debit') || tx.type?.toLowerCase().includes('rent') || tx.type?.toLowerCase().includes('clearance') || tx.type?.toLowerCase().includes('invoice') || String(tx.amount || '').startsWith('-');

      if (isTopup) {
        allTimeTopups += num;
        allTimeTopupsCount++;
        if (isTransactionToday(tx.date)) {
          topupsToday += num;
          topupsTodayCount++;
        }
      } else if (isDeduction) {
        allTimeDeductions += num;
        allTimeDeductionsCount++;
        if (isTransactionToday(tx.date)) {
          deductionsToday += num;
          deductionsTodayCount++;
        }
      }
    });

    return {
      id: d.id,
      name: d.name,
      phone: d.phone,
      city: d.city,
      status: d.status,
      vehicle: d.vehicle || { registration: 'Unassigned', model: '—', type: '—' },
      deal: d.deal || {},
      wallet: {
        ...w,
        postedBalance: Number(w.postedBalance !== undefined ? w.postedBalance : spendable),
        activeHolds: Number(w.activeHolds || 0),
        spendableBalance: spendable,
        lowBalanceThreshold: threshold,
        outstandingDues: outstanding,
        autoTopup: w.autoTopup !== undefined ? w.autoTopup : true,
        status: statusComputed,
        lastTopup: w.lastTopup || '18 Aug 2026 · ₹1,200 (UPI)',
        recentTransactions: w.recentTransactions || []
      }
    };
  });

  let filtered = list;
  if (status && status !== 'all') {
    const sLower = status.toLowerCase();
    filtered = filtered.filter(d => d.wallet.status.toLowerCase().includes(sLower));
  }

  if (search && search.trim() !== '') {
    const q = search.trim().toLowerCase();
    filtered = filtered.filter(d =>
      d.name.toLowerCase().includes(q) ||
      d.phone.toLowerCase().includes(q) ||
      (d.vehicle?.registration && d.vehicle.registration.toLowerCase().includes(q)) ||
      (d.vehicle?.model && d.vehicle.model.toLowerCase().includes(q))
    );
  }

  res.json({
    success: true,
    data: {
      metrics: {
        totalWallets,
        activeWallets,
        healthyCount,
        healthyBalance,
        lowBalanceCount,
        breachedCount,
        breachedOutstanding,
        totalBalance,
        topupsToday,
        topupsTodayCount,
        deductionsToday,
        deductionsTodayCount,
        allTimeTopups,
        allTimeTopupsCount,
        allTimeDeductions,
        allTimeDeductionsCount
      },
      drivers: filtered
    }
  });
});

// GET /api/drivers/:id - Single Driver 360° Profile
router.get('/:id', (req, res) => {
  const { id } = req.params;
  const data = readDriversData();
  const driver = (data.drivers || []).find(d => d.id === id);

  if (!driver) {
    return res.status(404).json({ success: false, message: 'Driver not found.' });
  }

  res.json({
    success: true,
    data: driver
  });
});

// PUT /api/drivers/:id/status - Update driver duty status
router.put('/:id/status', (req, res) => {
  const { id } = req.params;
  const { status, reason } = req.body;

  const validStatuses = ['On Duty', 'On Leave', 'Suspended', 'Ready', 'Unassigned'];
  if (!status || !validStatuses.includes(status)) {
    return res.status(400).json({ success: false, message: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
  }

  const data = readDriversData();
  const index = (data.drivers || []).findIndex(d => d.id === id);
  if (index === -1) {
    return res.status(404).json({ success: false, message: 'Driver not found.' });
  }

  data.drivers[index].status = status;
  if (reason) {
    data.drivers[index].shift = reason;
  }

  // Recalculate summary metrics
  const activeCount = data.drivers.filter(d => d.status === 'On Duty').length;
  const leaveCount = data.drivers.filter(d => d.status === 'On Leave').length;
  const suspendedCount = data.drivers.filter(d => d.status === 'Suspended').length;
  data.summary.onDuty = activeCount;
  data.summary.onLeave = leaveCount;
  data.summary.suspended = suspendedCount;

  writeDriversData(data);

  res.json({
    success: true,
    message: `Driver status successfully updated to ${status}.`,
    data: data.drivers[index]
  });
});

// POST /api/drivers/:id/wallet/topup - Instant Wallet Credit / Top-Up & Outstanding Clearance
router.post('/:id/wallet/topup', (req, res) => {
  const { id } = req.params;
  const { amount, method = 'Admin Credit Voucher', reference = `ADM-${Date.now()}` } = req.body;

  const numAmount = parseFloat(amount);
  if (!numAmount || numAmount <= 0) {
    return res.status(400).json({ success: false, message: 'Amount must be greater than zero.' });
  }

  const data = readDriversData();
  const index = (data.drivers || []).findIndex(d => d.id === id);
  if (index === -1) {
    return res.status(404).json({ success: false, message: 'Driver not found.' });
  }

  const driver = data.drivers[index];
  if (!driver.wallet) {
    driver.wallet = { postedBalance: 0, activeHolds: 0, spendableBalance: 0, status: 'Healthy', recentTransactions: [] };
  }

  const dateStr = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) + ', ' + new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  const newTopupTxn = {
    id: `WTX-${Date.now().toString().slice(-4)}`,
    date: dateStr,
    type: 'Wallet Top-up',
    amount: `+₹${numAmount.toLocaleString('en-IN')}`,
    method: `${method} (${reference})`,
    status: 'Success'
  };

  const outstanding = Number(driver.wallet.outstandingDues) || 0;

  if (outstanding > 0) {
    if (numAmount >= outstanding) {
      const leftover = numAmount - outstanding;
      driver.wallet.outstandingDues = 0;
      driver.wallet.postedBalance = (driver.wallet.postedBalance || 0) + numAmount;
      driver.wallet.spendableBalance = leftover;
      driver.wallet.status = leftover > 500 ? 'Healthy' : 'Low Balance';

      const clearTxn = {
        id: `WTX-CLR-${Date.now().toString().slice(-4)}`,
        date: dateStr,
        type: 'Outstanding Rental Clearance',
        amount: `-₹${outstanding.toLocaleString('en-IN')}.00`,
        method: 'Auto-Settled & Cleared from Top-Up',
        status: 'Cleared & Settled'
      };

      driver.wallet.recentTransactions = [clearTxn, newTopupTxn, ...(driver.wallet.recentTransactions || [])];
      driver.wallet.lastTopup = `${dateStr} · ₹${numAmount.toLocaleString('en-IN')} (Cleared ₹${outstanding} Outstanding)`;
    } else {
      // Partial clearance
      driver.wallet.outstandingDues = outstanding - numAmount;
      driver.wallet.postedBalance = (driver.wallet.postedBalance || 0) + numAmount;
      driver.wallet.spendableBalance = 0;
      driver.wallet.status = 'Pending Payment';

      const partialTxn = {
        id: `WTX-PART-${Date.now().toString().slice(-4)}`,
        date: dateStr,
        type: 'Partial Outstanding Clearance',
        amount: `-₹${numAmount.toLocaleString('en-IN')}.00`,
        method: `Remaining Due: ₹${driver.wallet.outstandingDues.toLocaleString('en-IN')}`,
        status: 'Partial Clearance'
      };

      driver.wallet.recentTransactions = [partialTxn, newTopupTxn, ...(driver.wallet.recentTransactions || [])];
      driver.wallet.lastTopup = `${dateStr} · ₹${numAmount.toLocaleString('en-IN')} (Remaining Due: ₹${driver.wallet.outstandingDues})`;
    }
  } else {
    driver.wallet.postedBalance = (driver.wallet.postedBalance || 0) + numAmount;
    driver.wallet.spendableBalance = (driver.wallet.spendableBalance || 0) + numAmount;
    if (driver.wallet.spendableBalance > 500) {
      driver.wallet.status = 'Healthy';
    } else if (driver.wallet.spendableBalance >= 0) {
      driver.wallet.status = 'Low Balance';
    }
    driver.wallet.recentTransactions = [newTopupTxn, ...(driver.wallet.recentTransactions || [])];
    driver.wallet.lastTopup = `${dateStr} · ₹${numAmount.toLocaleString('en-IN')}`;
  }

  writeDriversData(data);

  res.json({
    success: true,
    message: outstanding > 0 
      ? `₹${numAmount.toLocaleString('en-IN')} credited. Outstanding vehicle rent of ₹${Math.min(numAmount, outstanding).toLocaleString('en-IN')} was settled.`
      : `₹${numAmount.toLocaleString('en-IN')} successfully credited to ${driver.name}'s wallet.`,
    data: driver
  });
});

// POST /api/drivers - Onboard new driver with full account details
router.post('/', (req, res) => {
  const {
    name,
    phone,
    altPhone = '',
    city = '',
    address = '',
    emergencyContact = '',
    emergencyRelation = '',
    referenceName = '',
    referencePhone = '',
    referenceRelation = '',
    referenceAddress = '',
    drivingLicence,
    dlExpiry = '',
    dlCategory = '',
    aadhaar = '',
    panCard = '',
    policeVerification = 'Pending Review',
    leaseAssigned = false,
    rentalModel = '',
    agreedRate = '',
    securityDeposit = '',
    contractMonths = 0,
    billingFrequency = '',
    taxRule = '',
    shiftType = '',
    coDriver = '',
    agreementVersion = '',
    agreementSigned = false,
    depositReceipt = '',
    depositStatus = 'Unassigned',
    handoverOdometer = '',
    vehicleRegistration = '',
    vehicleModel = 'WagonR H3 CNG',
    vehicleType = 'CNG',
    initialBalance = 0,
    photoUrl = '',
    dob = '',
    gender = '',
    fatherName = '',
    documents = []
  } = req.body;

  if (!name || !phone || !drivingLicence) {
    return res.status(400).json({ success: false, message: 'Name, mobile phone, and Driving Licence are required.' });
  }

  const data = readDriversData();
  const newId = `drv-${(data.drivers.length + 1).toString().padStart(2, '0')}`;
  const hasLease = leaseAssigned === true;

  const assignedVehicle = vehicleRegistration && vehicleRegistration.trim() !== '' ? {
    registration: vehicleRegistration.trim().toUpperCase(),
    model: vehicleModel || 'WagonR H3 CNG',
    type: vehicleType || 'CNG',
    status: shiftType.includes('12-Hour') ? 'Shared Dual-Driver' : 'Assigned 1:1'
  } : null;

  const numInitial = Number(initialBalance) || 0;

  const newDriver = {
    id: newId,
    name: name.trim(),
    phone: phone.trim(),
    altPhone: altPhone.trim(),
    city: city.trim(),
    photo: photoUrl || '',
    mobileVerified: true,
    status: assignedVehicle ? 'On Duty' : 'Ready',
    rating: 5.0,
    shift: hasLease && shiftType.includes('12-Hour') 
      ? (shiftType.includes('Night') ? 'Night Shift: 06:00 PM - 06:00 AM' : 'Day Shift: 06:00 AM - 06:00 PM')
      : (hasLease ? '07:00 AM - 07:00 PM (Active)' : ''),
    shiftType: shiftType,
    coDriver: coDriver ? coDriver.trim() : null,
    location: city,
    vehicle: assignedVehicle,
    todayGross: '₹0',
    todayTrips: 0,
    wallet: (() => {
      const parsedRate = parseInt((agreedRate || '1000').toString().replace(/[^0-9]/g, '')) || 1000;
      const isCarAssigned = !!assignedVehicle && hasLease;
      const isZeroWallet = numInitial <= 0;
      const outstandingAmt = (isCarAssigned && isZeroWallet) ? parsedRate : 0;

      return {
        postedBalance: numInitial - outstandingAmt,
        activeHolds: 0,
        spendableBalance: Math.max(0, numInitial - outstandingAmt),
        outstandingDues: outstandingAmt,
        status: outstandingAmt > 0 ? 'Pending Payment' : (numInitial > 0 ? 'Healthy' : 'Zero Balance'),
        autoTopup: false,
        lastTopup: outstandingAmt > 0 
          ? `Zero Balance · Pending Car Rent ₹${outstandingAmt.toLocaleString('en-IN')}` 
          : (numInitial > 0 ? `Opening Balance: ₹${numInitial}` : 'Awaiting First Recharge'),
        recentTransactions: outstandingAmt > 0 ? [
          {
            id: `WTX-DUE-${Date.now().toString().slice(-4)}`,
            date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) + ', 10:00 AM',
            type: 'Vehicle Rental Allocation Due',
            amount: `-₹${outstandingAmt.toLocaleString('en-IN')}.00`,
            method: `Allocated Car: ${assignedVehicle.model} [${assignedVehicle.registration}]`,
            status: 'Outstanding Pending Payment'
          },
          {
            id: `WTX-${Date.now().toString().slice(-4)}`,
            date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) + ', 10:00 AM',
            type: 'Account Created',
            amount: '₹0.00',
            method: 'Zero Balance Onboarding',
            status: 'Pending First Recharge'
          }
        ] : (numInitial > 0 ? [
          {
            id: `WTX-${Date.now().toString().slice(-4)}`,
            date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) + ', 10:00 AM',
            type: 'Initial Deposit',
            amount: `+₹${numInitial.toLocaleString('en-IN')}.00`,
            method: 'Initial Credit',
            status: 'Success'
          }
        ] : [
          {
            id: `WTX-${Date.now().toString().slice(-4)}`,
            date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) + ', 10:00 AM',
            type: 'Account Created',
            amount: '₹0.00',
            method: 'System Onboarding',
            status: 'Ready for Recharge'
          }
        ])
      };
    })(),
    kyc: {
      dob: dob.trim(),
      gender: gender.trim(),
      fatherName: fatherName.trim(),
      aadhaar: aadhaar.trim(),
      aadhaarVerified: true,
      panCard: panCard ? panCard.trim().toUpperCase() : '',
      panVerified: true,
      drivingLicence: drivingLicence.trim().toUpperCase(),
      dlExpiry: dlExpiry.trim(),
      dlCategory: dlCategory.trim(),
      dlStatus: 'Valid',
      policeVerification: policeVerification.trim(),
      emergencyContact: emergencyContact.trim() ? `${emergencyContact.trim()}${emergencyRelation ? ` (${emergencyRelation})` : ''}` : '',
      reference: referenceName.trim() ? {
        name: referenceName.trim(),
        phone: referencePhone.trim(),
        relation: referenceRelation,
        address: referenceAddress.trim() || city
      } : null,
      address: address.trim()
    },
    documents: (() => {
      let docList = Array.isArray(documents) ? [...documents] : [];
      const hasDl = docList.some(d => (d.category === 'dl' || d.type === 'dl' || String(d.type).toLowerCase().includes('licence')));
      if (!hasDl) {
        docList.unshift({
          id: `doc-dl-${newId}`,
          type: 'Driving Licence',
          category: 'dl',
          title: 'Commercial Motor Vehicle Driving Licence (LMV-TR)',
          docNumber: drivingLicence.trim().toUpperCase(),
          verified: true,
          issueDate: '2025-07-08',
          expiryDate: dlExpiry.trim() || '2047-04-08',
          uploadedAt: new Date().toISOString(),
          uploadedBy: 'Admin Authority',
          fileUrl: '',
          status: 'Verified'
        });
      }
      const hasAadhaar = docList.some(d => (d.category === 'aadhaar' || d.type === 'aadhaar' || String(d.type).toLowerCase().includes('aadhaar')));
      if (!hasAadhaar && aadhaar.trim()) {
        docList.unshift({
          id: `doc-adh-${newId}`,
          type: 'Aadhaar Card',
          category: 'aadhaar',
          title: 'UIDAI Aadhaar Biometric Card',
          docNumber: aadhaar.trim(),
          verified: true,
          issueDate: '2020-01-01',
          expiryDate: 'Lifetime / Valid',
          uploadedAt: new Date().toISOString(),
          uploadedBy: 'Admin Authority',
          fileUrl: '',
          status: 'Verified'
        });
      }
      if (panCard && !docList.some(d => (d.category === 'pan' || d.type === 'pan' || String(d.type).toLowerCase().includes('pan')))) {
        docList.push({
          id: `doc-pan-${newId}`,
          type: 'PAN Card',
          category: 'pan',
          title: 'Income Tax Permanent Account Number (PAN)',
          docNumber: panCard.trim().toUpperCase(),
          verified: true,
          issueDate: '2020-01-01',
          expiryDate: 'Lifetime / Valid',
          uploadedAt: new Date().toISOString(),
          uploadedBy: 'Admin Authority',
          fileUrl: '',
          status: 'Verified'
        });
      }
      return docList.map((d, idx) => ({
        id: d.id || `doc-${Date.now()}-${idx}`,
        type: d.type || (d.category === 'dl' ? 'Driving Licence' : d.category === 'aadhaar' ? 'Aadhaar Card' : d.category === 'pan' ? 'PAN Card' : 'KYC Document'),
        category: d.category || (String(d.type).toLowerCase().includes('dl') || String(d.type).toLowerCase().includes('licence') ? 'dl' : String(d.type).toLowerCase().includes('aadhaar') ? 'aadhaar' : String(d.type).toLowerCase().includes('pan') ? 'pan' : 'other'),
        title: d.title || `${d.type || 'KYC'} Document`,
        docNumber: d.docNumber || (d.category === 'dl' ? drivingLicence.trim().toUpperCase() : d.category === 'aadhaar' ? aadhaar.trim() : panCard ? panCard.trim().toUpperCase() : ''),
        issueDate: d.issueDate || '2020-01-01',
        expiryDate: d.expiryDate || (d.category === 'dl' ? (dlExpiry.trim() || '2047-04-08') : 'Lifetime / Valid'),
        verified: d.verified !== false,
        uploadedAt: d.uploadedAt || new Date().toISOString(),
        uploadedBy: d.uploadedBy || 'Admin Authority',
        fileUrl: d.fileUrl || '',
        fileSize: d.fileSize || '',
        status: d.status || 'Verified',
        notes: d.notes || '',
        source: d.source || 'Driver onboarding OCR upload',
        extractedData: d.extractedData || undefined
      }));
    })(),
    deal: hasLease ? {
      type: rentalModel,
      rate: agreedRate.startsWith('₹') ? agreedRate : `₹${agreedRate} / day`,
      deposit: securityDeposit.startsWith('₹') ? securityDeposit : `₹${securityDeposit} (Secured in Escrow)`,
      frequency: billingFrequency,
      taxRule: taxRule,
      startDate: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      contractMonths: Number(contractMonths) || 0,
      agreementVersion: agreementVersion,
      agreementSigned: agreementSigned,
      depositReceipt: depositReceipt,
      depositStatus: depositStatus,
      handoverOdometer: handoverOdometer,
      handoverStatus: 'Completed & QC Inspected'
    } : null,
    attendance: {
      presentDays: 1,
      leaveDays: 0,
      punctuality: '100%'
    }
  };

  data.drivers.unshift(newDriver);
  data.summary.totalDrivers = data.drivers.length;
  if (assignedVehicle) {
    data.summary.onDuty = (data.summary.onDuty || 0) + 1;
  }
  writeDriversData(data);
  syncVehicleAssignmentInFleet(newDriver);

  res.status(201).json({
    success: true,
    message: `Driver ${newDriver.name} successfully onboarded into platform registry.`,
    data: newDriver
  });
});

// PUT /api/drivers/:id/vehicle - Assign or Unassign Vehicle to Driver
router.put('/:id/vehicle', (req, res) => {
  const { id } = req.params;
  const { vehicleRegistration, vehicleModel = 'WagonR H3 CNG', vehicleType = 'CNG' } = req.body;

  const data = readDriversData();
  const index = (data.drivers || []).findIndex(d => d.id === id);
  if (index === -1) {
    return res.status(404).json({ success: false, message: 'Driver not found.' });
  }

  const previousRegistration = data.drivers[index].vehicle?.registration || '';

  if (vehicleRegistration && vehicleRegistration.trim() !== '') {
    data.drivers[index].vehicle = {
      registration: vehicleRegistration.trim().toUpperCase(),
      model: vehicleModel,
      type: vehicleType,
      status: 'Assigned 1:1'
    };
    data.drivers[index].status = 'On Duty';

    // If driver's wallet is zero/empty, the car rental amount stays as outstanding pending payment
    const driver = data.drivers[index];
    if (!driver.wallet) {
      driver.wallet = { postedBalance: 0, spendableBalance: 0, activeHolds: 0, status: 'Zero Balance', recentTransactions: [] };
    }
    const rentRate = parseInt((driver.deal?.rate || '').toString().replace(/[^0-9]/g, '')) || 0;
    if (driver.deal?.type && rentRate > 0 && (driver.wallet.spendableBalance || 0) <= 0) {
      driver.wallet.outstandingDues = (driver.wallet.outstandingDues || 0) + rentRate;
      driver.wallet.postedBalance = (driver.wallet.postedBalance || 0) - rentRate;
      driver.wallet.status = 'Pending Payment';
      const rentTxn = {
        id: `WTX-DUE-${Date.now().toString().slice(-4)}`,
        date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) + ', ' + new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        type: 'Vehicle Rental Allocation Due',
        amount: `-₹${rentRate.toLocaleString('en-IN')}.00`,
        method: `Assigned Car: ${vehicleModel} [${vehicleRegistration}]`,
        status: 'Outstanding Pending Payment'
      };
      driver.wallet.recentTransactions = [rentTxn, ...(driver.wallet.recentTransactions || [])];
    }
  } else {
    data.drivers[index].vehicle = null;
    data.drivers[index].status = 'Ready';
  }

  writeDriversData(data);
  syncVehicleAssignmentInFleet(data.drivers[index], previousRegistration);

  res.json({
    success: true,
    message: vehicleRegistration ? `Vehicle ${vehicleRegistration} assigned to ${data.drivers[index].name}` : `Vehicle unassigned for ${data.drivers[index].name}`,
    data: data.drivers[index]
  });
});

// PUT /api/drivers/:id/lease - Assign or unassign the driver's commercial lease
router.put('/:id/lease', (req, res) => {
  const { id } = req.params;
  const { assigned = false, deal = null } = req.body || {};
  const data = readDriversData();
  const index = (data.drivers || []).findIndex(d => d.id === id);

  if (index === -1) {
    return res.status(404).json({ success: false, message: 'Driver not found.' });
  }

  const driver = data.drivers[index];
  if (!assigned) {
    driver.deal = null;
    driver.shiftType = '';
    driver.coDriver = null;
    if (!driver.vehicle) driver.status = 'Ready';

    try {
      const leasesData = fs.existsSync(LEASES_FILE)
        ? JSON.parse(fs.readFileSync(LEASES_FILE, 'utf8'))
        : { summary: {}, leases: [] };
      let changed = false;
      (leasesData.leases || []).forEach(lease => {
        if (lease.driverId === id && !['Unassigned', 'Cancelled'].includes(lease.status)) {
          lease.status = 'Unassigned';
          lease.unassignedAt = new Date().toISOString();
          changed = true;
        }
      });
      if (changed) fs.writeFileSync(LEASES_FILE, JSON.stringify(leasesData, null, 2), 'utf8');
    } catch (err) {
      console.warn('Could not update linked lease records:', err.message);
    }
  } else {
    if (!deal || !deal.type || !deal.rate) {
      return res.status(400).json({ success: false, message: 'A lease model and rate are required when assigning a lease.' });
    }
    driver.deal = {
      ...(driver.deal || {}),
      ...deal,
      leaseStatus: deal.leaseStatus || 'Assigned',
      lastAmendment: new Date().toISOString()
    };
  }

  writeDriversData(data);
  res.json({
    success: true,
    message: assigned ? `Lease assigned to ${driver.name}.` : `Lease unassigned for ${driver.name}.`,
    data: driver
  });
});

// POST /api/drivers/:id/leave - Request Approved Leave (PDF Page 3 & 8)
router.post('/:id/leave', (req, res) => {
  const { id } = req.params;
  const { reason = 'Family Leave', days = 1 } = req.body;

  const data = readDriversData();
  const index = (data.drivers || []).findIndex(d => d.id === id);
  if (index === -1) {
    return res.status(404).json({ success: false, message: 'Driver not found.' });
  }

  const driver = data.drivers[index];
  driver.status = 'On Leave';
  if (!driver.attendance) {
    driver.attendance = { presentDays: 25, leaveDays: 0, punctuality: '98%' };
  }
  driver.attendance.leaveDays = (driver.attendance.leaveDays || 0) + Number(days);
  data.summary.onLeave = (data.summary.onLeave || 0) + 1;
  if (data.summary.onDuty > 0) data.summary.onDuty -= 1;

  writeDriversData(data);

  res.json({
    success: true,
    message: `Leave approved for ${driver.name} (${days} day(s) - Reason: ${reason}).`,
    data: driver
  });
});

// PUT /api/drivers/:id/deal - Amend Commercial Deal Terms (PDF Page 5)
router.put('/:id/deal', (req, res) => {
  const { id } = req.params;
  const { rate, frequency, taxRule, notes } = req.body;

  const data = readDriversData();
  const index = (data.drivers || []).findIndex(d => d.id === id);
  if (index === -1) {
    return res.status(404).json({ success: false, message: 'Driver not found.' });
  }

  const driver = data.drivers[index];
  if (!driver.deal) driver.deal = {};
  if (rate) driver.deal.rate = rate;
  if (frequency) driver.deal.frequency = frequency;
  if (taxRule) driver.deal.taxRule = taxRule;
  driver.deal.lastAmendment = new Date().toISOString();
  driver.deal.amendmentNotes = notes || 'Administrative rate adjustment';

  writeDriversData(data);

  // Keep the linked lease record aligned with driver-level deal edits.
  try {
    if (fs.existsSync(LEASES_FILE)) {
      const leasesData = JSON.parse(fs.readFileSync(LEASES_FILE, 'utf8'));
      const linkedLease = (leasesData.leases || []).find(lease => lease.driverId === id && lease.status !== 'Unassigned');
      if (linkedLease) {
        if (rate) {
          const amount = Number(String(rate).replace(/[^0-9.]/g, '')) || linkedLease.rateAmount || 0;
          linkedLease.rateAmount = amount;
          linkedLease.rateDisplay = `₹${amount.toLocaleString('en-IN')} / ${linkedLease.billingFrequency || 'day'}`;
        }
        if (frequency) linkedLease.billingFrequency = frequency;
        if (taxRule) linkedLease.taxPercent = Number(String(taxRule).replace(/[^0-9.]/g, '')) || linkedLease.taxPercent;
        linkedLease.updatedAt = new Date().toISOString();
        fs.writeFileSync(LEASES_FILE, JSON.stringify(leasesData, null, 2), 'utf8');
      }
    }
  } catch (err) {
    console.warn('Could not sync driver deal edit to lease record:', err.message);
  }

  res.json({
    success: true,
    message: `Commercial agreement terms updated for ${driver.name}.`,
    data: driver
  });
});

// =========================================================================
// DRIVER DOCUMENTS MANAGEMENT (Admin-Only Multi-Document Architecture)
// =========================================================================

// GET /api/drivers/:id/documents - List all documents for a driver
router.get('/:id/documents', (req, res) => {
  const { id } = req.params;
  const data = readDriversData();
  const driver = (data.drivers || []).find(d => d.id === id);

  if (!driver) {
    return res.status(404).json({ success: false, message: 'Driver not found.' });
  }

  const kyc = driver.kyc || {};
  if (!Array.isArray(driver.documents)) {
    driver.documents = [];
  }

  // Normalize existing documents
  driver.documents.forEach(doc => {
    const t = String(doc.type || '').toLowerCase();
    const tit = String(doc.title || '').toLowerCase();
    if (!doc.category) {
      if (t.includes('aadhaar') || tit.includes('aadhaar')) doc.category = 'aadhaar';
      else if (t.includes('dl') || t.includes('licence') || tit.includes('licence')) doc.category = 'dl';
      else if (t.includes('pan') || tit.includes('pan')) doc.category = 'pan';
      else if (t.includes('police') || tit.includes('police')) doc.category = 'police';
      else doc.category = 'other';
    }
    if (!doc.docNumber) {
      if (doc.category === 'aadhaar') doc.docNumber = kyc.aadhaar || '';
      else if (doc.category === 'dl') doc.docNumber = kyc.drivingLicence || '';
      else if (doc.category === 'pan') doc.docNumber = kyc.panCard || '';
    }
    if (!doc.type) {
      if (doc.category === 'aadhaar') doc.type = 'Aadhaar Card';
      else if (doc.category === 'dl') doc.type = 'Driving Licence';
      else if (doc.category === 'pan') doc.type = 'PAN Card';
    }
    if (!doc.expiryDate) {
      if (doc.category === 'dl') doc.expiryDate = kyc.dlExpiry || '2030-11-14';
      else if (doc.category === 'aadhaar' || doc.category === 'pan') doc.expiryDate = 'Lifetime / Valid';
      else doc.expiryDate = 'Lifetime / Valid';
    }
    if (!doc.issueDate) {
      if (doc.category === 'dl') doc.issueDate = '2020-01-15';
      else if (doc.category === 'aadhaar') doc.issueDate = '2018-05-12';
      else if (doc.category === 'pan') doc.issueDate = '2016-07-16';
      else doc.issueDate = '2025-01-01';
    }
    if (doc.verified === undefined) {
      doc.verified = true;
    }
    if (!doc.status) {
      doc.status = 'Verified';
    }
    if (!doc.uploadedAt) {
      doc.uploadedAt = '2026-10-28T04:00:00.000Z';
    }
    if (!doc.uploadedBy) {
      doc.uploadedBy = 'Admin Authority';
    }
  });

  // Ensure DL exists
  const hasDl = driver.documents.some(d => d.category === 'dl' || String(d.type).toLowerCase().includes('licence') || String(d.type).toLowerCase().includes('dl'));
  if (!hasDl && kyc.drivingLicence) {
    driver.documents.unshift({
      id: `doc-dl-${driver.id}`,
      type: 'Driving Licence',
      category: 'dl',
      title: 'Commercial Motor Vehicle Driving Licence (LMV-TR)',
      docNumber: kyc.drivingLicence,
      verified: kyc.dlStatus === 'Valid',
      issueDate: '2019-11-15',
      expiryDate: kyc.dlExpiry || '2032-11-14',
      uploadedAt: new Date().toISOString(),
      uploadedBy: 'Admin Authority',
      fileUrl: '',
      status: 'Verified'
    });
  }

  // Ensure Aadhaar exists
  const hasAadhaar = driver.documents.some(d => d.category === 'aadhaar' || String(d.type).toLowerCase().includes('aadhaar'));
  if (!hasAadhaar && kyc.aadhaar) {
    driver.documents.unshift({
      id: `doc-adh-${driver.id}`,
      type: 'Aadhaar Card',
      category: 'aadhaar',
      title: 'UIDAI Aadhaar Biometric Card',
      docNumber: kyc.aadhaar,
      verified: kyc.aadhaarVerified !== false,
      issueDate: '2018-05-12',
      expiryDate: 'Lifetime / Valid',
      uploadedAt: new Date().toISOString(),
      uploadedBy: 'Admin Authority',
      fileUrl: '',
      status: 'Verified'
    });
  }

  // Ensure PAN exists
  const hasPan = driver.documents.some(d => d.category === 'pan' || String(d.type).toLowerCase().includes('pan'));
  if (!hasPan && kyc.panCard) {
    driver.documents.push({
      id: `doc-pan-${driver.id}`,
      type: 'PAN Card',
      category: 'pan',
      title: 'Income Tax Permanent Account Number (PAN)',
      docNumber: kyc.panCard,
      verified: kyc.panVerified !== false,
      issueDate: '2016-07-16',
      expiryDate: 'Lifetime / Valid',
      uploadedAt: new Date().toISOString(),
      uploadedBy: 'Admin Authority',
      fileUrl: '',
      status: 'Verified'
    });
  }

  res.json({
    success: true,
    data: {
      driverId: driver.id,
      driverName: driver.name,
      phone: driver.phone,
      documents: driver.documents || []
    }
  });
});

// DELETE /api/drivers/:id - Admin permanently deletes a driver profile from the platform
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  const data = readDriversData();
  const driverIndex = (data.drivers || []).findIndex(d => d.id === id);

  if (driverIndex === -1) {
    return res.status(404).json({ success: false, message: 'Driver not found.' });
  }

  const [deletedDriver] = data.drivers.splice(driverIndex, 1);

  // If driver had a vehicle allocated, release vehicle back to available yard fleet
  if (deletedDriver.vehicle?.registration || deletedDriver.name) {
    unassignVehicleInFleet(deletedDriver.name, deletedDriver.vehicle?.registration);
  }

  // Recalculate summary metrics
  data.summary = data.summary || {};
  data.summary.totalDrivers = data.drivers.length;
  data.summary.onDuty = data.drivers.filter(d => d.status === 'On Duty').length;
  data.summary.onLeave = data.drivers.filter(d => d.status === 'On Leave').length;
  data.summary.suspended = data.drivers.filter(d => d.status === 'Suspended').length;
  data.summary.ready = data.drivers.filter(d => d.status === 'Ready').length;
  data.summary.unassigned = data.drivers.filter(d => !d.vehicle).length;

  writeDriversData(data);

  res.json({
    success: true,
    message: `Driver "${deletedDriver.name}" (${deletedDriver.id}) successfully deleted.`,
    deletedId: id,
    driver: deletedDriver
  });
});

// POST /api/drivers/:id/documents - Admin adds a new document to a driver
router.post('/:id/documents', (req, res) => {
  const { id } = req.params;
  const { type, title, docNumber, issueDate, expiryDate, fileUrl, notes, verified = true } = req.body;

  if (!type || !docNumber) {
    return res.status(400).json({ success: false, message: 'Document type and document number are required.' });
  }

  const data = readDriversData();
  const driver = (data.drivers || []).find(d => d.id === id);

  if (!driver) {
    return res.status(404).json({ success: false, message: 'Driver not found.' });
  }

  if (!driver.documents) {
    driver.documents = [];
  }

  const newDoc = {
    id: `doc-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    type,
    category: type.toLowerCase().includes('aadhaar') ? 'aadhaar' :
              type.toLowerCase().includes('licence') || type.toLowerCase().includes('dl') ? 'dl' :
              type.toLowerCase().includes('pan') ? 'pan' :
              type.toLowerCase().includes('police') ? 'police' :
              type.toLowerCase().includes('agreement') ? 'agreement' : 'other',
    title: title || `${type} Document`,
    docNumber: String(docNumber).trim(),
    issueDate: issueDate || new Date().toISOString().split('T')[0],
    expiryDate: expiryDate || '2032-12-31',
    verified: Boolean(verified),
    uploadedAt: new Date().toISOString(),
    uploadedBy: 'Admin Authority',
    fileUrl: fileUrl || '',
    notes: notes || '',
    status: verified ? 'Verified' : 'Pending Review'
  };

  driver.documents.unshift(newDoc);

  // Sync to driver.kyc if standard document
  if (!driver.kyc) driver.kyc = {};
  if (newDoc.category === 'aadhaar') {
    driver.kyc.aadhaar = newDoc.docNumber;
    driver.kyc.aadhaarVerified = true;
  } else if (newDoc.category === 'dl') {
    driver.kyc.drivingLicence = newDoc.docNumber;
    driver.kyc.dlExpiry = newDoc.expiryDate;
    driver.kyc.dlStatus = 'Valid';
  } else if (newDoc.category === 'pan') {
    driver.kyc.panCard = newDoc.docNumber;
    driver.kyc.panVerified = true;
  }

  writeDriversData(data);

  res.json({
    success: true,
    message: `Document "${newDoc.title}" successfully added for ${driver.name}.`,
    data: newDoc,
    allDocuments: driver.documents
  });
});

// PUT /api/drivers/:id/documents/:docId - Admin updates or attaches file to document
router.put('/:id/documents/:docId', (req, res) => {
  const { id, docId } = req.params;
  const updates = req.body || {};
  const data = readDriversData();
  const driver = (data.drivers || []).find(d => d.id === id);

  if (!driver) {
    return res.status(404).json({ success: false, message: 'Driver not found.' });
  }

  if (!Array.isArray(driver.documents)) {
    driver.documents = [];
  }

  let doc = driver.documents.find(d => d.id === docId);
  if (!doc) {
    // Match by category if docId is e.g. 'dl', 'aadhaar', 'pan', 'police'
    doc = driver.documents.find(d => d.category === docId || (d.type && d.type.toLowerCase().includes(docId)));
  }

  if (doc) {
    Object.assign(doc, updates, { updatedAt: new Date().toISOString() });
  } else {
    // Create new document entry
    const newDoc = {
      id: docId.startsWith('doc-') ? docId : `doc-${docId}-${Date.now()}`,
      category: updates.category || docId || 'other',
      type: updates.type || (docId === 'dl' ? 'Driving Licence' : docId === 'aadhaar' ? 'Aadhaar Card' : docId === 'pan' ? 'PAN Card' : 'Document'),
      title: updates.title || `${docId.toUpperCase()} Official Document`,
      docNumber: updates.docNumber || '',
      fileUrl: updates.fileUrl || '',
      issueDate: updates.issueDate || '2020-01-15',
      expiryDate: updates.expiryDate || '2030-11-14',
      verified: true,
      status: 'Verified',
      uploadedAt: new Date().toISOString(),
      uploadedBy: 'Admin Authority',
      ...updates
    };
    driver.documents.push(newDoc);
    doc = newDoc;
  }

  // Sync to driver.kyc if standard KYC document
  if (!driver.kyc) driver.kyc = {};
  if (doc.category === 'aadhaar' && doc.docNumber) {
    driver.kyc.aadhaar = doc.docNumber;
    driver.kyc.aadhaarVerified = true;
  } else if (doc.category === 'dl' && doc.docNumber) {
    driver.kyc.drivingLicence = doc.docNumber;
    if (doc.expiryDate) driver.kyc.dlExpiry = doc.expiryDate;
  } else if (doc.category === 'pan' && doc.docNumber) {
    driver.kyc.panCard = doc.docNumber;
    driver.kyc.panVerified = true;
  }

  writeDriversData(data);

  res.json({
    success: true,
    message: 'Document successfully updated.',
    document: doc,
    documents: driver.documents
  });
});

// DELETE /api/drivers/:id/documents/:docId - Admin removes a document
router.delete('/:id/documents/:docId', (req, res) => {
  const { id, docId } = req.params;
  const data = readDriversData();
  const driver = (data.drivers || []).find(d => d.id === id);

  if (!driver) {
    return res.status(404).json({ success: false, message: 'Driver not found.' });
  }

  driver.documents = (driver.documents || []).filter(d => d.id !== docId);
  writeDriversData(data);

  res.json({
    success: true,
    message: 'Document deleted successfully.',
    documents: driver.documents
  });
});

export default router;
