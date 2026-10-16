import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_FILE = path.join(__dirname, '../data/drivers.json');

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
    city = 'Gurgaon Operations Hub',
    address = 'Delhi NCR',
    emergencyContact = '',
    emergencyRelation = 'Family',
    referenceName = '',
    referencePhone = '',
    referenceRelation = 'Guarantor',
    referenceAddress = '',
    drivingLicence,
    dlExpiry = '14 Nov 2030',
    dlCategory = 'Commercial LMV',
    aadhaar = 'XXXX-XXXX-9999',
    panCard = '',
    policeVerification = 'Verified (Clear)',
    rentalModel = 'Fixed Daily Rental',
    agreedRate = '₹1,000 / day',
    securityDeposit = '₹75,000 (Secured in Escrow)',
    contractMonths = 12,
    billingFrequency = 'Daily Debit',
    taxRule = 'GST 5% (Commercial Passenger Transport)',
    shiftType = '24-Hour Primary Dedication',
    coDriver = '',
    agreementVersion = 'v1.0 (Executed)',
    agreementSigned = true,
    depositReceipt = 'UTR-98218731',
    depositStatus = 'Held in Escrow',
    handoverOdometer = '45,210 km',
    vehicleRegistration = '',
    vehicleModel = 'WagonR H3 CNG',
    vehicleType = 'CNG',
    initialBalance = 0,
    photoUrl = ''
  } = req.body;

  if (!name || !phone || !drivingLicence) {
    return res.status(400).json({ success: false, message: 'Name, mobile phone, and Driving Licence are required.' });
  }

  const data = readDriversData();
  const newId = `drv-${(data.drivers.length + 1).toString().padStart(2, '0')}`;

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
    shift: shiftType.includes('12-Hour') 
      ? (shiftType.includes('Night') ? 'Night Shift: 06:00 PM - 06:00 AM' : 'Day Shift: 06:00 AM - 06:00 PM')
      : '07:00 AM - 07:00 PM (Active)',
    shiftType: shiftType,
    coDriver: coDriver ? coDriver.trim() : null,
    location: city,
    vehicle: assignedVehicle,
    todayGross: '₹0',
    todayTrips: 0,
    wallet: (() => {
      const parsedRate = parseInt((agreedRate || '1000').toString().replace(/[^0-9]/g, '')) || 1000;
      const isCarAssigned = !!assignedVehicle;
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
      aadhaar: aadhaar.trim(),
      aadhaarVerified: true,
      panCard: panCard ? panCard.trim().toUpperCase() : 'ABCDE1234F',
      panVerified: true,
      drivingLicence: drivingLicence.trim().toUpperCase(),
      dlExpiry: dlExpiry.trim(),
      dlCategory: dlCategory.trim(),
      dlStatus: 'Valid',
      policeVerification: policeVerification.trim(),
      emergencyContact: emergencyContact.trim() ? `${emergencyContact.trim()} (${emergencyRelation})` : '+91 98112 34567 (Family)',
      reference: referenceName.trim() ? {
        name: referenceName.trim(),
        phone: referencePhone.trim(),
        relation: referenceRelation,
        address: referenceAddress.trim() || city
      } : {
        name: 'Suresh Verma',
        phone: '+91 98101 88990',
        relation: 'Fleet Guarantor',
        address: 'Sector 14, Gurgaon'
      },
      address: address.trim()
    },
    deal: {
      type: rentalModel,
      rate: agreedRate.startsWith('₹') ? agreedRate : `₹${agreedRate} / day`,
      deposit: securityDeposit.startsWith('₹') ? securityDeposit : `₹${securityDeposit} (Secured in Escrow)`,
      frequency: billingFrequency,
      taxRule: taxRule,
      startDate: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      contractMonths: Number(contractMonths) || 12,
      agreementVersion: agreementVersion,
      agreementSigned: agreementSigned,
      depositReceipt: depositReceipt,
      depositStatus: depositStatus,
      handoverOdometer: handoverOdometer,
      handoverStatus: 'Completed & QC Inspected'
    },
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
    const rentRate = parseInt((driver.deal?.rate || '1000').toString().replace(/[^0-9]/g, '')) || 1000;
    if ((driver.wallet.spendableBalance || 0) <= 0) {
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

  res.json({
    success: true,
    message: vehicleRegistration ? `Vehicle ${vehicleRegistration} assigned to ${data.drivers[index].name}` : `Vehicle unassigned for ${data.drivers[index].name}`,
    data: data.drivers[index]
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

  res.json({
    success: true,
    message: `Commercial agreement terms updated for ${driver.name}.`,
    data: driver
  });
});

export default router;
