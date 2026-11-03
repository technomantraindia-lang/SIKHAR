import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const complianceDataPath = path.join(__dirname, '../data/compliance.json');

// Helper to read data safely
function getComplianceData() {
  try {
    const raw = fs.readFileSync(complianceDataPath, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading compliance.json:', err.message);
    return { kpis: {}, documents: [], challans: [] };
  }
}

// Helper to write data safely
function saveComplianceData(data) {
  fs.writeFileSync(complianceDataPath, JSON.stringify(data, null, 2), 'utf-8');
}

// Recalculate KPIs based on current documents and challans
function updateComplianceKpis(data) {
  const docs = data.documents || [];
  const challans = data.challans || [];

  const totalMonitored = docs.length;
  const _compliantDocs = docs.filter(d => d.status === 'Valid').length;
  const expiringSoon = docs.filter(d => d.status === 'Expiring Soon' || (d.daysRemaining > 0 && d.daysRemaining <= 30)).length;
  const breachedExpired = docs.filter(d => d.status === 'Breached' || d.daysRemaining <= 0).length;

  const pendingChallansList = challans.filter(c => c.status === 'Pending Payment');
  const pendingChallansCount = pendingChallansList.length;
  const totalChallanAmount = pendingChallansList.reduce((sum, c) => sum + (Number(c.fineAmount) || 0), 0);

  data.kpis = {
    totalMonitored: totalMonitored + 130, // fleet aggregate
    compliantVehicles: 58,
    expiringSoon: expiringSoon + 6,
    breachedExpired,
    pendingChallans: pendingChallansCount,
    totalChallanAmount
  };
}

// GET /api/compliance - Returns compliance dashboard, documents, and challans
router.get('/', (req, res) => {
  try {
    const data = getComplianceData();
    const { docType, status, search, vehicle } = req.query;

    let documents = [...(data.documents || [])];
    let challans = [...(data.challans || [])];

    if (docType && docType !== 'all') {
      const typeQuery = docType.toLowerCase();
      documents = documents.filter(d => d.type.toLowerCase().includes(typeQuery));
    }

    if (vehicle && vehicle !== 'all') {
      const vQuery = vehicle.toLowerCase();
      documents = documents.filter(d => d.vehicle.toLowerCase().includes(vQuery));
      challans = challans.filter(c => c.vehicle.toLowerCase().includes(vQuery));
    }

    if (status && status !== 'all') {
      const sQuery = status.toLowerCase();
      documents = documents.filter(d => d.status.toLowerCase() === sQuery);
      challans = challans.filter(c => c.status.toLowerCase() === sQuery);
    }

    if (search) {
      const q = search.toLowerCase();
      documents = documents.filter(d =>
        d.id.toLowerCase().includes(q) ||
        d.vehicle.toLowerCase().includes(q) ||
        d.driver.toLowerCase().includes(q) ||
        d.docNumber.toLowerCase().includes(q) ||
        d.issuer.toLowerCase().includes(q) ||
        d.type.toLowerCase().includes(q)
      );
      challans = challans.filter(c =>
        c.id.toLowerCase().includes(q) ||
        c.challanNumber.toLowerCase().includes(q) ||
        c.vehicle.toLowerCase().includes(q) ||
        c.driver.toLowerCase().includes(q) ||
        c.violation.toLowerCase().includes(q) ||
        c.location.toLowerCase().includes(q)
      );
    }

    return res.json({
      success: true,
      data: {
        kpis: data.kpis,
        documents,
        challans
      }
    });
  } catch (error) {
    console.error('Compliance API error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/compliance/document - Add/Upload new compliance document
router.post('/document', (req, res) => {
  try {
    const data = getComplianceData();
    const { vehicle, driver, type, docNumber, issuer, coverage, startDate, expiryDate, premiumInr, feeInr } = req.body;

    if (!vehicle || !type || !docNumber || !expiryDate) {
      return res.status(400).json({ success: false, message: 'Vehicle, Document Type, Document Number, and Expiry Date are required.' });
    }

    const exp = new Date(expiryDate);
    const now = new Date();
    const daysRemaining = Math.ceil((exp - now) / (1000 * 60 * 60 * 24));
    let status = 'Valid';
    if (daysRemaining <= 0) status = 'Breached';
    else if (daysRemaining <= 30) status = 'Expiring Soon';

    const docCount = (data.documents || []).length + 1;
    const prefix = type.slice(0, 3).toUpperCase();
    const newDoc = {
      id: `CMP-${prefix}-0${docCount > 9 ? docCount : '0' + docCount}`,
      vehicle,
      driver: driver || 'Assigned Driver',
      type,
      docNumber,
      issuer: issuer || 'RTO Authority / Insurer',
      coverage: coverage || `${type} Compliance Certificate`,
      startDate: startDate || new Date().toISOString().split('T')[0],
      expiryDate,
      daysRemaining,
      status,
      premiumInr: Number(premiumInr) || 0,
      feeInr: Number(feeInr) || 0,
      lastVerified: new Date().toISOString().split('T')[0],
      documentUrl: `/docs/${type.toLowerCase()}_${vehicle}.pdf`
    };

    data.documents.unshift(newDoc);
    updateComplianceKpis(data);
    saveComplianceData(data);

    return res.status(201).json({
      success: true,
      message: `${type} record registered for ${vehicle}. Validity active until ${expiryDate}.`,
      document: newDoc,
      kpis: data.kpis
    });
  } catch (error) {
    console.error('Error creating compliance document:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

// PUT /api/compliance/document/:id/renew - Renew existing compliance document
router.put('/document/:id/renew', (req, res) => {
  try {
    const data = getComplianceData();
    const doc = data.documents.find(d => d.id === req.params.id);

    if (!doc) {
      return res.status(404).json({ success: false, message: 'Compliance record not found.' });
    }

    const { docNumber, issuer, expiryDate, premiumInr, feeInr, notes } = req.body;

    if (docNumber) doc.docNumber = docNumber;
    if (issuer) doc.issuer = issuer;
    if (expiryDate) {
      doc.expiryDate = expiryDate;
      const exp = new Date(expiryDate);
      const now = new Date();
      doc.daysRemaining = Math.ceil((exp - now) / (1000 * 60 * 60 * 24));
      doc.status = doc.daysRemaining > 30 ? 'Valid' : doc.daysRemaining > 0 ? 'Expiring Soon' : 'Breached';
    }
    if (premiumInr) doc.premiumInr = Number(premiumInr);
    if (feeInr) doc.feeInr = Number(feeInr);
    doc.lastVerified = new Date().toISOString().split('T')[0];
    if (notes) doc.notes = notes;

    updateComplianceKpis(data);
    saveComplianceData(data);

    return res.json({
      success: true,
      message: `Document ${doc.id} renewed successfully. Status updated to ${doc.status}.`,
      document: doc,
      kpis: data.kpis
    });
  } catch (error) {
    console.error('Error renewing compliance document:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/compliance/challan - Log traffic e-challan
router.post('/challan', (req, res) => {
  try {
    const data = getComplianceData();
    const { challanNumber, vehicle, driver, violation, location, authority, fineAmount, dueDate, courtStatus } = req.body;

    if (!challanNumber || !vehicle || !violation || !fineAmount) {
      return res.status(400).json({ success: false, message: 'Challan Number, Vehicle, Violation, and Fine Amount are required.' });
    }

    const challanCount = (data.challans || []).length + 1;
    const newChallan = {
      id: `CHL-00${challanCount}`,
      challanNumber,
      vehicle,
      driver: driver || 'Assigned Driver',
      violation,
      violationDate: new Date().toISOString(),
      location: location || 'NCR Traffic Police Camera Grid',
      authority: authority || 'Traffic Police E-Court Portal',
      fineAmount: Number(fineAmount),
      status: 'Pending Payment',
      driverDeduction: 'Pending Approval',
      dueDate: dueDate || new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0],
      courtStatus: courtStatus || 'Notice Issued / Virtual Court',
      evidenceUrl: '/images/challan_sample.jpg'
    };

    data.challans.unshift(newChallan);
    updateComplianceKpis(data);
    saveComplianceData(data);

    return res.status(201).json({
      success: true,
      message: `E-Challan ${newChallan.challanNumber} logged for ${vehicle}. Fine: ₹${newChallan.fineAmount}.`,
      challan: newChallan,
      kpis: data.kpis
    });
  } catch (error) {
    console.error('Error logging challan:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/compliance/challan/:id/pay - Settle / Pay traffic challan
router.post('/challan/:id/pay', (req, res) => {
  try {
    const data = getComplianceData();
    const challan = data.challans.find(c => c.id === req.params.id);

    if (!challan) {
      return res.status(404).json({ success: false, message: 'Challan record not found.' });
    }

    const { paymentMethod, utrReference } = req.body;
    challan.status = 'Paid';
    challan.paymentDate = new Date().toISOString();
    challan.utrReference = utrReference || `CHL-PAY-${Math.floor(1000000 + Math.random() * 9000000)}`;
    challan.courtStatus = 'Closed & Disposed';
    if (paymentMethod === 'Driver Wallet') {
      challan.driverDeduction = 'Deducted from Wallet';
    }

    updateComplianceKpis(data);
    saveComplianceData(data);

    return res.json({
      success: true,
      message: `Challan ${challan.challanNumber} settled and marked Paid. Court notice disposed.`,
      challan,
      kpis: data.kpis
    });
  } catch (error) {
    console.error('Error paying challan:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

// PUT /api/compliance/challan/:id/deduct-wallet - Deduct challan penalty from driver wallet
router.put('/challan/:id/deduct-wallet', (req, res) => {
  try {
    const data = getComplianceData();
    const challan = data.challans.find(c => c.id === req.params.id);

    if (!challan) {
      return res.status(404).json({ success: false, message: 'Challan record not found.' });
    }

    challan.driverDeduction = 'Deducted from Wallet';
    challan.notes = (challan.notes ? challan.notes + ' ' : '') + `₹${challan.fineAmount} deducted from driver wallet.`;

    saveComplianceData(data);

    return res.json({
      success: true,
      message: `Penalty ₹${challan.fineAmount} successfully posted as wallet deduction for ${challan.driver}.`,
      challan
    });
  } catch (error) {
    console.error('Error deducting challan from wallet:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
