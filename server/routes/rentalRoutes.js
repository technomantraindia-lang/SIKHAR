import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const LEASES_FILE = path.join(__dirname, '../data/leases.json');
const INVOICES_FILE = path.join(__dirname, '../data/invoices.json');
const DRIVERS_FILE = path.join(__dirname, '../data/drivers.json');
const FLEET_FILE = path.join(__dirname, '../data/fleet.json');

// Helpers for safe file I/O
function readJson(file, fallback = {}) {
  try {
    if (!fs.existsSync(file)) return fallback;
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (err) {
    console.error(`Failed to read ${file}:`, err);
    return fallback;
  }
}

function writeJson(file, data) {
  try {
    fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error(`Failed to write ${file}:`, err);
    return false;
  }
}

// =========================================================================
// 1. LEASES / BOOKINGS ENDPOINTS
// =========================================================================

// GET /api/rentals/leases - List all leases with filters
router.get('/leases', (req, res) => {
  const { status, dealType, search } = req.query;
  const data = readJson(LEASES_FILE, { summary: {}, leases: [] });
  let list = data.leases || [];

  if (status && status !== 'all') {
    const sQuery = status.toLowerCase();
    list = list.filter(l =>
      l.status && (
        l.status.toLowerCase() === sQuery ||
        (sQuery === 'pending' && l.status.toLowerCase().includes('pending')) ||
        (sQuery === 'active' && l.status.toLowerCase() === 'active')
      )
    );
  }

  if (dealType && dealType !== 'all') {
    const dQuery = dealType.toLowerCase();
    list = list.filter(l =>
      l.dealType && (
        l.dealType.toLowerCase().includes(dQuery) ||
        (dQuery === 'fixed' && l.dealType.toLowerCase().includes('fixed')) ||
        (dQuery === 'revenue' && l.dealType.toLowerCase().includes('revenue'))
      )
    );
  }

  if (search && search.trim() !== '') {
    const q = search.trim().toLowerCase();
    list = list.filter(l =>
      l.customerName?.toLowerCase().includes(q) ||
      l.customerPhone?.toLowerCase().includes(q) ||
      l.driverName?.toLowerCase().includes(q) ||
      l.vehicleRegistration?.toLowerCase().includes(q) ||
      l.vehicleModel?.toLowerCase().includes(q) ||
      l.id?.toLowerCase().includes(q) ||
      l.leaseNumber?.toLowerCase().includes(q)
    );
  }

  res.json({
    success: true,
    data: {
      summary: data.summary,
      leases: list,
      totalCount: (data.leases || []).length,
      filteredCount: list.length
    }
  });
});

// GET /api/rentals/leases/:id - Single Lease Detail
router.get('/leases/:id', (req, res) => {
  const { id } = req.params;
  const data = readJson(LEASES_FILE, { summary: {}, leases: [] });
  const lease = (data.leases || []).find(l => l.id === id || l.leaseNumber === id);
  if (!lease) {
    return res.status(404).json({ success: false, message: 'Lease agreement not found.' });
  }
  res.json({ success: true, data: lease });
});

// POST /api/rentals/leases - Create New Lease (PDF Step 01 to 06)
router.post('/leases', (req, res) => {
  const {
    customerName,
    customerPhone,
    aadhaar = 'XXXX-XXXX-4421',
    drivingLicence,
    address = 'Sector 44, Gurgaon, Delhi NCR',
    referenceName = 'Reference Contact',
    referencePhone = '+91 99000 11223',
    dealType = 'Fixed Lease', // 'Fixed Lease' | 'Revenue Share'
    billingFrequency = 'Daily', // 'Daily' | 'Weekly' | 'Monthly'
    rateAmount = 1000,
    driverSharePercent = 75,
    sikharSharePercent = 25,
    rapidoDriverId = '',
    taxPercent = 5,
    securityDeposit = 75000,
    depositStatus = 'Held in Escrow',
    depositPaid,
    depositPending,
    depositReceiptRef = '',
    isDepositConfirmed = true,
    vehicleRegistration = '',
    vehicleModel = '',
    vehicleType = 'CNG',
    driverId = '',
    driverName = '',
    driverPhone = '',
    autoActivate = false
  } = req.body;

  if (!customerName || !customerPhone || !vehicleRegistration) {
    return res.status(400).json({
      success: false,
      message: 'Customer Name, Mobile Phone, and Vehicle Asset selection are required.'
    });
  }

  const data = readJson(LEASES_FILE, { summary: {}, leases: [] });
  const orderId = `ORD-26-${Date.now().toString().slice(-6)}`;
  const leaseNumber = `LSE-2026-${(data.leases.length + 1).toString().padStart(4, '0')}`;

  const isRevShare = dealType.toLowerCase().includes('revenue');

  const isConfirmed = isDepositConfirmed === true || depositStatus === 'Held in Escrow';
  const depStatus = isConfirmed ? 'Held in Escrow' : 'Pending';
  const numDeposit = Number(securityDeposit) || 75000;
  const paidAmt = isConfirmed ? numDeposit : (Number(depositPaid) || 0);
  const pendAmt = isConfirmed ? 0 : (depositPending !== undefined ? Number(depositPending) : numDeposit);

  const newLease = {
    id: orderId,
    leaseNumber,
    customerName: customerName.trim(),
    customerPhone: customerPhone.trim(),
    customerId: `CUST-26-${Date.now().toString().slice(-5)}`,
    driverId: driverId || `drv-${Date.now().toString().slice(-4)}`,
    driverName: (driverName || customerName).trim(),
    driverPhone: (driverPhone || customerPhone).trim(),
    vehicleRegistration: vehicleRegistration.trim().toUpperCase(),
    vehicleModel: vehicleModel || 'Maruti WagonR Tour H3',
    vehicleType: vehicleType || 'CNG',
    dealType: isRevShare ? 'Revenue Share' : 'Fixed Lease',
    billingFrequency,
    rateAmount: isRevShare ? 0 : Number(rateAmount) || 1000,
    rateDisplay: isRevShare ? `Driver ${driverSharePercent}% · Sikhar ${sikharSharePercent}%` : `₹${Number(rateAmount || 1000).toLocaleString('en-IN')} / ${billingFrequency.toLowerCase()}`,
    taxPercent: Number(taxPercent) || 5,
    driverSharePercent: isRevShare ? Number(driverSharePercent) || 75 : null,
    sikharSharePercent: isRevShare ? Number(sikharSharePercent) || 25 : null,
    rapidoDriverId: isRevShare ? (rapidoDriverId || `RAPIDO-${customerName.replace(/[^A-Za-z]/g, '').slice(0, 3).toUpperCase()}${Date.now().toString().slice(-4)}`) : null,
    securityDeposit: numDeposit,
    depositStatus: depStatus,
    depositPaid: paidAmt,
    depositPending: pendAmt,
    depositReceipt: isConfirmed ? (depositReceiptRef || `UTR-ESC-${Date.now().toString().slice(-4)}`) : null,
    agreementVersion: 'v1.0 (Executed)',
    agreementSigned: true,
    signedDate: new Date().toISOString(),
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
    status: autoActivate ? 'Active' : 'Active',
    invoiceSchedule: isRevShare ? 'Rapido API Settlement Feed Sync' : `${billingFrequency} Debit on Billing Date`,
    lastInvoiceId: null,
    notes: isRevShare ? 'Rapido revenue share agreement.' : 'Fixed commercial fleet lease agreement.'
  };

  data.leases.unshift(newLease);
  data.summary.totalLeases = data.leases.length;
  data.summary.activeLeases = data.leases.filter(l => l.status === 'Active').length;
  data.summary.fixedLeases = data.leases.filter(l => l.dealType === 'Fixed Lease').length;
  data.summary.revenueShareLeases = data.leases.filter(l => l.dealType === 'Revenue Share').length;
  data.summary.totalEscrowDeposits = data.leases.filter(l => l.depositStatus === 'Held in Escrow').reduce((sum, l) => sum + (Number(l.depositPaid || l.securityDeposit) || 0), 0);
  data.summary.pendingEscrowDeposits = data.leases.filter(l => l.depositStatus === 'Pending').reduce((sum, l) => sum + (Number(l.depositPending || l.securityDeposit) || 0), 0);

  writeJson(LEASES_FILE, data);

  // Sync with Drivers & Fleet data if needed
  const driversData = readJson(DRIVERS_FILE, { drivers: [] });
  const matchedDriver = (driversData.drivers || []).find(d => d.id === newLease.driverId || d.name.toLowerCase() === newLease.driverName.toLowerCase());
  if (matchedDriver) {
    matchedDriver.vehicle = {
      registration: newLease.vehicleRegistration,
      model: newLease.vehicleModel,
      type: newLease.vehicleType,
      status: 'Assigned 1:1'
    };
    matchedDriver.status = 'On Duty';
    writeJson(DRIVERS_FILE, driversData);
  }

  // Update Fleet vehicle status to On Road
  const fleetData = readJson(FLEET_FILE, { vehicles: [] });
  const matchedVehicle = (fleetData.vehicles || []).find(v => v.registration === newLease.vehicleRegistration);
  if (matchedVehicle) {
    matchedVehicle.status = 'On Road';
    matchedVehicle.driver = newLease.driverName;
    writeJson(FLEET_FILE, fleetData);
  }

  // Generate initial invoice if fixed lease
  if (!isRevShare) {
    const invoicesData = readJson(INVOICES_FILE, { summary: {}, invoices: [] });
    const invId = `INV-26-${Date.now().toString().slice(-6)}`;
    const base = Math.round((newLease.rateAmount / 1.05) * 100) / 100;
    const gst = Math.round((newLease.rateAmount - base) * 100) / 100;

    const initialInvoice = {
      id: invId,
      invoiceNumber: invId,
      customerName: newLease.customerName,
      customerId: newLease.customerId,
      driverId: newLease.driverId,
      driverName: newLease.driverName,
      driverPhone: newLease.driverPhone,
      vehicleRegistration: newLease.vehicleRegistration,
      vehicleModel: newLease.vehicleModel,
      invoiceDate: new Date().toISOString().split('T')[0],
      dueDate: new Date().toISOString().split('T')[0],
      period: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      baseAmount: base,
      gstPercent: 5,
      gstAmount: gst,
      totalAmount: newLease.rateAmount,
      amountPaid: 0,
      balanceDue: newLease.rateAmount,
      status: 'Pending',
      paymentMethod: null,
      paidDate: null,
      notes: `Opening ${newLease.billingFrequency} rental invoice.`
    };

    invoicesData.invoices.unshift(initialInvoice);
    invoicesData.summary.totalInvoices = invoicesData.invoices.length;
    invoicesData.summary.totalBilled = (invoicesData.summary.totalBilled || 0) + newLease.rateAmount;
    invoicesData.summary.totalPending = (invoicesData.summary.totalPending || 0) + newLease.rateAmount;
    invoicesData.summary.overdueCount = (invoicesData.summary.overdueCount || 0) + 1;
    writeJson(INVOICES_FILE, invoicesData);

    newLease.lastInvoiceId = invId;
    writeJson(LEASES_FILE, data);
  }

  res.status(201).json({
    success: true,
    message: `Lease ${newLease.leaseNumber} successfully executed and activated for ${newLease.customerName}.`,
    data: newLease
  });
});

// POST /api/rentals/leases/:id/sign - Sign Agreement Document (PDF Step 04)
router.post('/leases/:id/sign', (req, res) => {
  const { id } = req.params;
  const data = readJson(LEASES_FILE, { leases: [] });
  const index = (data.leases || []).findIndex(l => l.id === id || l.leaseNumber === id);
  if (index === -1) {
    return res.status(404).json({ success: false, message: 'Lease not found.' });
  }

  data.leases[index].agreementSigned = true;
  data.leases[index].signedDate = new Date().toISOString();
  data.leases[index].agreementVersion = 'v1.0 (Digitally Signed)';
  writeJson(LEASES_FILE, data);

  res.json({
    success: true,
    message: `Agreement for lease ${data.leases[index].leaseNumber} successfully signed.`,
    data: data.leases[index]
  });
});

// POST /api/rentals/leases/:id/deposit - Confirm Escrow Deposit (PDF Step 05)
router.post('/leases/:id/deposit', (req, res) => {
  const { id } = req.params;
  const { amount = 75000, reference = `DEP-${Date.now().toString().slice(-6)}` } = req.body;
  const data = readJson(LEASES_FILE, { leases: [] });
  const index = (data.leases || []).findIndex(l => l.id === id || l.leaseNumber === id);
  if (index === -1) {
    return res.status(404).json({ success: false, message: 'Lease not found.' });
  }

  data.leases[index].depositStatus = 'Held in Escrow';
  data.leases[index].securityDeposit = Number(amount) || 75000;
  data.leases[index].depositPaid = Number(amount) || 75000;
  data.leases[index].depositPending = 0;
  data.leases[index].depositReceipt = reference;

  if (data.summary) {
    data.summary.totalEscrowDeposits = data.leases.filter(l => l.depositStatus === 'Held in Escrow').reduce((sum, l) => sum + (Number(l.depositPaid || l.securityDeposit) || 0), 0);
    data.summary.pendingEscrowDeposits = data.leases.filter(l => l.depositStatus === 'Pending').reduce((sum, l) => sum + (Number(l.depositPending || l.securityDeposit) || 0), 0);
  }
  writeJson(LEASES_FILE, data);

  res.json({
    success: true,
    message: `Security deposit of ₹${Number(amount).toLocaleString('en-IN')} confirmed and locked in escrow.`,
    data: data.leases[index]
  });
});

// POST /api/rentals/leases/:id/activate - Final Activation Gate (PDF Step 06)
router.post('/leases/:id/activate', (req, res) => {
  const { id } = req.params;
  const data = readJson(LEASES_FILE, { leases: [] });
  const index = (data.leases || []).findIndex(l => l.id === id || l.leaseNumber === id);
  if (index === -1) {
    return res.status(404).json({ success: false, message: 'Lease not found.' });
  }

  const lease = data.leases[index];
  if (!lease.agreementSigned) {
    return res.status(400).json({ success: false, message: 'Activation blocked: Agreement must be signed first.' });
  }
  if (lease.depositStatus !== 'Held in Escrow') {
    return res.status(400).json({ success: false, message: 'Activation blocked: Security deposit must be verified in escrow.' });
  }

  lease.status = 'Active';
  lease.startDate = new Date().toISOString();
  writeJson(LEASES_FILE, data);

  res.json({
    success: true,
    message: `Lease ${lease.leaseNumber} is now Active. Vehicle dispatch cleared.`,
    data: lease
  });
});

// =========================================================================
// 2. INVOICES & RECURRING BILLING ENDPOINTS (FLOW 2)
// =========================================================================

// GET /api/rentals/invoices - List invoices with filters
router.get('/invoices', (req, res) => {
  const { status, search } = req.query;
  const data = readJson(INVOICES_FILE, { summary: {}, invoices: [] });
  let list = data.invoices || [];

  if (status && status !== 'all') {
    list = list.filter(i => i.status.toLowerCase() === status.toLowerCase());
  }

  if (search && search.trim() !== '') {
    const q = search.trim().toLowerCase();
    list = list.filter(i =>
      i.customerName?.toLowerCase().includes(q) ||
      i.driverName?.toLowerCase().includes(q) ||
      i.driverPhone?.toLowerCase().includes(q) ||
      i.vehicleRegistration?.toLowerCase().includes(q) ||
      i.invoiceNumber?.toLowerCase().includes(q) ||
      i.id?.toLowerCase().includes(q)
    );
  }

  res.json({
    success: true,
    data: {
      summary: data.summary,
      invoices: list,
      totalCount: (data.invoices || []).length,
      filteredCount: list.length
    }
  });
});

// POST /api/rentals/invoices - Generate New Invoice
router.post('/invoices', (req, res) => {
  const {
    customerName,
    driverName,
    driverPhone,
    driverId,
    vehicleRegistration,
    vehicleModel = 'Maruti WagonR Tour H3',
    leaseId = null,
    leaseNumber = null,
    amount = 1000,
    dueDate,
    notes = 'Daily lease rental fee'
  } = req.body;

  if (!customerName || !amount) {
    return res.status(400).json({ success: false, message: 'Customer name and amount are required.' });
  }

  const data = readJson(INVOICES_FILE, { summary: {}, invoices: [] });
  const invNumber = `INV-26-${Date.now().toString().slice(-6)}`;
  const totalAmt = Number(amount) || 1000;
  const base = Math.round((totalAmt / 1.05) * 100) / 100;
  const gst = Math.round((totalAmt - base) * 100) / 100;

  const newInvoice = {
    id: invNumber,
    invoiceNumber: invNumber,
    customerName: customerName.trim(),
    customerId: `CUST-26-${Date.now().toString().slice(-5)}`,
    driverId: driverId || 'drv-01',
    driverName: (driverName || customerName).trim(),
    driverPhone: driverPhone || '+91 98112 34567',
    vehicleRegistration: (vehicleRegistration || 'HR26DK8821').trim().toUpperCase(),
    vehicleModel,
    leaseId: leaseId || null,
    leaseNumber: leaseNumber || null,
    invoiceDate: new Date().toISOString().split('T')[0],
    dueDate: dueDate || new Date().toISOString().split('T')[0],
    period: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
    baseAmount: base,
    gstPercent: 5,
    gstAmount: gst,
    totalAmount: totalAmt,
    amountPaid: 0,
    balanceDue: totalAmt,
    status: 'Pending',
    paymentMethod: null,
    paidDate: null,
    notes
  };

  data.invoices.unshift(newInvoice);
  data.summary.totalInvoices = data.invoices.length;
  data.summary.totalBilled = (data.summary.totalBilled || 0) + totalAmt;
  data.summary.totalPending = (data.summary.totalPending || 0) + totalAmt;
  data.summary.overdueCount = (data.summary.overdueCount || 0) + 1;
  writeJson(INVOICES_FILE, data);

  res.status(201).json({
    success: true,
    message: `Invoice ${invNumber} generated for ${newInvoice.customerName}.`,
    data: newInvoice
  });
});

// POST /api/rentals/invoices/:id/pay-wallet - Pay Invoice from Driver Spendable Wallet
router.post('/invoices/:id/pay-wallet', (req, res) => {
  const { id } = req.params;
  const invoicesData = readJson(INVOICES_FILE, { summary: {}, invoices: [] });
  const index = (invoicesData.invoices || []).findIndex(i => i.id === id || i.invoiceNumber === id);
  if (index === -1) {
    return res.status(404).json({ success: false, message: 'Invoice not found.' });
  }

  const invoice = invoicesData.invoices[index];
  if (invoice.status === 'Paid') {
    return res.status(400).json({ success: false, message: 'Invoice is already paid.' });
  }

  // Load Driver Wallet to check and deduct spendable balance
  const driversData = readJson(DRIVERS_FILE, { drivers: [] });
  const driverIndex = (driversData.drivers || []).findIndex(d =>
    d.id === invoice.driverId ||
    d.name.toLowerCase() === invoice.driverName.toLowerCase() ||
    d.phone === invoice.driverPhone
  );

  const driver = driverIndex !== -1 ? driversData.drivers[driverIndex] : null;
  const spendable = driver?.wallet?.spendableBalance || 0;

  if (spendable < invoice.balanceDue) {
    return res.status(400).json({
      success: false,
      message: `Insufficient spendable wallet funds. Driver has ₹${spendable.toLocaleString('en-IN')}, but invoice requires ₹${invoice.balanceDue.toLocaleString('en-IN')}. Please top up wallet first.`
    });
  }

  // Deduct from driver wallet
  const dateStr = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) + ', ' + new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  const txnId = `WTX-INV-${Date.now().toString().slice(-4)}`;

  driver.wallet.spendableBalance -= invoice.balanceDue;
  driver.wallet.postedBalance -= invoice.balanceDue;
  if (driver.wallet.spendableBalance <= 500 && driver.wallet.spendableBalance > 0) {
    driver.wallet.status = 'Low Balance';
  }

  const debitTxn = {
    id: txnId,
    date: dateStr,
    type: 'Invoice Auto-Debit',
    amount: `-₹${invoice.balanceDue.toLocaleString('en-IN')}.00`,
    method: `Invoice Paid: ${invoice.invoiceNumber} [${invoice.vehicleRegistration}]`,
    status: 'Settled'
  };

  driver.wallet.recentTransactions = [debitTxn, ...(driver.wallet.recentTransactions || [])];
  writeJson(DRIVERS_FILE, driversData);

  // Update invoice status
  invoice.amountPaid = invoice.totalAmount;
  invoice.balanceDue = 0;
  invoice.status = 'Paid';
  invoice.paymentMethod = 'Driver Spendable Wallet';
  invoice.paidDate = new Date().toISOString();
  invoice.receiptReference = txnId;

  // Recalculate invoice summaries
  invoicesData.summary.totalCollected = (invoicesData.summary.totalCollected || 0) + invoice.totalAmount;
  invoicesData.summary.totalPending = Math.max(0, (invoicesData.summary.totalPending || 0) - invoice.totalAmount);
  invoicesData.summary.paidCount = invoicesData.invoices.filter(i => i.status === 'Paid').length;
  invoicesData.summary.overdueCount = invoicesData.invoices.filter(i => i.status !== 'Paid').length;

  writeJson(INVOICES_FILE, invoicesData);

  res.json({
    success: true,
    message: `Invoice ${invoice.invoiceNumber} of ₹${invoice.totalAmount.toLocaleString('en-IN')} paid directly from ${driver.name}'s wallet. Remaining spendable balance: ₹${driver.wallet.spendableBalance.toLocaleString('en-IN')}.`,
    data: invoice
  });
});

// POST /api/rentals/invoices/:id/pay-direct - Pay Invoice via External UPI / Cash
router.post('/invoices/:id/pay-direct', (req, res) => {
  const { id } = req.params;
  const { paymentMethod = 'UPI', reference = `UPI-${Date.now().toString().slice(-6)}` } = req.body;

  const invoicesData = readJson(INVOICES_FILE, { summary: {}, invoices: [] });
  const index = (invoicesData.invoices || []).findIndex(i => i.id === id || i.invoiceNumber === id);
  if (index === -1) {
    return res.status(404).json({ success: false, message: 'Invoice not found.' });
  }

  const invoice = invoicesData.invoices[index];
  if (invoice.status === 'Paid') {
    return res.status(400).json({ success: false, message: 'Invoice is already paid.' });
  }

  invoice.amountPaid = invoice.totalAmount;
  invoice.balanceDue = 0;
  invoice.status = 'Paid';
  invoice.paymentMethod = paymentMethod;
  invoice.paidDate = new Date().toISOString();
  invoice.receiptReference = reference;

  // Update summaries
  invoicesData.summary.totalCollected = (invoicesData.summary.totalCollected || 0) + invoice.totalAmount;
  invoicesData.summary.totalPending = Math.max(0, (invoicesData.summary.totalPending || 0) - invoice.totalAmount);
  invoicesData.summary.paidCount = invoicesData.invoices.filter(i => i.status === 'Paid').length;
  invoicesData.summary.overdueCount = invoicesData.invoices.filter(i => i.status !== 'Paid').length;

  writeJson(INVOICES_FILE, invoicesData);

  res.json({
    success: true,
    message: `Invoice ${invoice.invoiceNumber} marked Paid via ${paymentMethod} (${reference}).`,
    data: invoice
  });
});

// POST /api/rentals/invoices/:id/waive - Waive Off / Issue Credit Note
router.post('/invoices/:id/waive', (req, res) => {
  const { id } = req.params;
  const { reason = 'Service waiver / administrative adjustment' } = req.body;

  const invoicesData = readJson(INVOICES_FILE, { summary: {}, invoices: [] });
  const index = (invoicesData.invoices || []).findIndex(i => i.id === id || i.invoiceNumber === id);
  if (index === -1) {
    return res.status(404).json({ success: false, message: 'Invoice not found.' });
  }

  const invoice = invoicesData.invoices[index];
  const creditNoteId = `CN-26-${Date.now().toString().slice(-6)}`;

  invoice.status = 'Waived';
  invoice.paymentMethod = `Credit Note (${creditNoteId})`;
  invoice.paidDate = new Date().toISOString();
  invoice.notes = `Waived: ${reason}`;
  invoice.balanceDue = 0;

  invoicesData.summary.totalPending = Math.max(0, (invoicesData.summary.totalPending || 0) - invoice.totalAmount);
  writeJson(INVOICES_FILE, invoicesData);

  res.json({
    success: true,
    message: `Invoice ${invoice.invoiceNumber} waived. Credit note ${creditNoteId} issued.`,
    data: invoice
  });
});

export default router;
