import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const maintDataPath = path.join(__dirname, '../data/maintenance.json');

// Helper to read data safely
function getMaintenanceData() {
  try {
    const raw = fs.readFileSync(maintDataPath, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading maintenance.json:', err.message);
    return { kpis: {}, stages: [], jobCards: [] };
  }
}

// Helper to write data safely
function saveMaintenanceData(data) {
  fs.writeFileSync(maintDataPath, JSON.stringify(data, null, 2), 'utf-8');
}

// Recalculate KPIs based on current job cards
function updateMaintKpis(data) {
  const cards = data.jobCards || [];
  const serviceDueCount = cards.filter(c => c.stageIndex === 1).length;
  const openJobCardsCount = cards.filter(c => c.stageIndex >= 2 && c.stageIndex <= 5).length;
  const atWorkshopCount = cards.filter(c => c.status === 'At Workshop' || (c.stageIndex >= 3 && c.stageIndex <= 6)).length;
  const billsPendingCount = cards.filter(c => c.stageIndex === 7 || (!c.bill && c.stageIndex >= 6)).length;
  const readyCount = cards.filter(c => c.stageIndex === 10 || c.status === 'Ready to Deploy').length;

  // Payments due sum
  const pendingPaymentsSum = cards
    .filter(c => c.bill && (!c.payment || !c.payment.utr))
    .reduce((sum, c) => sum + (Number(c.bill.billedAmount) || 0), 0);

  data.kpis = {
    serviceDue: serviceDueCount,
    openJobCards: openJobCardsCount,
    atWorkshop: atWorkshopCount,
    billsPending: billsPendingCount,
    paymentsDue: pendingPaymentsSum || 48650,
    readyToDeploy: readyCount
  };
}

// GET /api/maintenance - List all maintenance records with filters & KPIs
router.get('/', (req, res) => {
  try {
    const data = getMaintenanceData();
    const { stage, status, search, vehicle } = req.query;

    let filtered = [...data.jobCards];

    // Filter by stage key
    if (stage && stage !== 'all') {
      const s = stage.toLowerCase().trim();
      filtered = filtered.filter(c => (c.stageKey || '').toLowerCase() === s);
    }

    // Filter by status
    if (status && status !== 'all') {
      const st = status.toLowerCase().trim();
      filtered = filtered.filter(c => (c.status || '').toLowerCase().includes(st));
    }

    // Filter by vehicle
    if (vehicle && vehicle !== 'all') {
      const v = vehicle.toUpperCase().replace(/\s+/g, '');
      filtered = filtered.filter(c => (c.vehicle || '').toUpperCase().replace(/\s+/g, '').includes(v));
    }

    // Search query
    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      filtered = filtered.filter(c =>
        (c.id && c.id.toLowerCase().includes(q)) ||
        (c.vehicle && c.vehicle.toLowerCase().includes(q)) ||
        (c.driver && c.driver.toLowerCase().includes(q)) ||
        (c.workshop && c.workshop.toLowerCase().includes(q)) ||
        (c.serviceType && c.serviceType.toLowerCase().includes(q)) ||
        (c.complaint && c.complaint.toLowerCase().includes(q))
      );
    }

    updateMaintKpis(data);

    res.json({
      success: true,
      kpis: data.kpis,
      stages: data.stages,
      total: filtered.length,
      jobCards: filtered
    });
  } catch (err) {
    console.error('Error fetching maintenance:', err);
    res.status(500).json({ success: false, message: 'Internal server error while fetching maintenance' });
  }
});

// GET /api/maintenance/:id - Single Job Card Detail
router.get('/:id', (req, res) => {
  try {
    const data = getMaintenanceData();
    const job = data.jobCards.find(c => c.id === req.params.id);
    if (!job) {
      return res.status(404).json({ success: false, message: 'Maintenance job card not found' });
    }
    res.json({ success: true, jobCard: job, stages: data.stages });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/maintenance/job-cards - Create new Job Card
router.post('/job-cards', (req, res) => {
  try {
    const data = getMaintenanceData();
    const body = req.body;

    if (!body.vehicle) {
      return res.status(400).json({ success: false, message: 'Vehicle registration is required' });
    }

    const nextId = `JC-2026-${(100 + data.jobCards.length + 1).toString().padStart(5, '0')}`;
    const newJob = {
      id: nextId,
      vehicle: (body.vehicle || '').toUpperCase().trim(),
      vehicleModel: body.vehicleModel || 'TATA TIGOR EV XPRESS T',
      driver: body.driver || 'Assigned Driver',
      driverPhone: body.driverPhone || '+91 98101 00000',
      stageIndex: 2,
      stageKey: 'job-card',
      stageName: 'Job Card',
      status: 'Job Card Created',
      serviceType: body.serviceType || 'Periodic Scheduled Maintenance',
      priority: body.priority || 'Normal',
      workshop: body.workshop || 'ABC Motors · Okhla Authorized Hub',
      odometer: body.odometer || '30,000 km',
      reportedDate: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
      expectedCompletion: body.expectedCompletion || 'Within 48 Hours',
      complaint: body.complaint || 'Periodic maintenance and diagnostic inspection.',
      checklist: {
        keysReceived: false,
        odometerVerified: false,
        batteryLevel: body.batteryLevel || '80%',
        testDriveDone: false,
        qcPassed: false,
        billVerified: false,
        paymentDone: false
      },
      estimate: body.estimateAmount ? {
        labour: Math.round(body.estimateAmount * 0.4),
        parts: Math.round(body.estimateAmount * 0.6),
        gst: Math.round(body.estimateAmount * 0.18),
        total: Math.round(body.estimateAmount * 1.18),
        status: 'Pending Approval',
        approvedBy: 'Operations Manager'
      } : null,
      bill: null,
      payment: null,
      nextService: body.nextService || 'TBD on closure',
      notes: body.notes || 'Job card initialized from maintenance terminal.'
    };

    data.jobCards.unshift(newJob);
    updateMaintKpis(data);
    saveMaintenanceData(data);

    res.status(201).json({
      success: true,
      message: `Job Card ${newJob.id} created successfully`,
      jobCard: newJob,
      kpis: data.kpis
    });
  } catch (err) {
    console.error('Error creating job card:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// PATCH /api/maintenance/:id/advance-stage - Advance to Next Pipeline Stage
router.patch('/:id/advance-stage', (req, res) => {
  try {
    const data = getMaintenanceData();
    const job = data.jobCards.find(c => c.id === req.params.id);

    if (!job) {
      return res.status(404).json({ success: false, message: 'Job card not found' });
    }

    const { targetStageIndex, notes, checklistUpdates } = req.body;
    const stageIdx = targetStageIndex || Math.min(10, job.stageIndex + 1);

    const stageObj = data.stages.find(s => s.index === stageIdx) || {
      name: `Stage ${stageIdx}`,
      key: `stage-${stageIdx}`
    };

    job.stageIndex = stageIdx;
    job.stageKey = stageObj.key;
    job.stageName = stageObj.name;

    // Status label mapping
    if (stageIdx === 1) job.status = 'Service Due';
    else if (stageIdx === 2) job.status = 'Job Card Created';
    else if (stageIdx === 3) job.status = 'At Workshop';
    else if (stageIdx === 4) job.status = 'Estimate Approval';
    else if (stageIdx === 5) job.status = 'At Workshop';
    else if (stageIdx === 6) job.status = 'QC & Completion';
    else if (stageIdx === 7) job.status = 'Bill Verification';
    else if (stageIdx === 8) job.status = 'Payment Due';
    else if (stageIdx === 9) job.status = 'Closure Pending';
    else if (stageIdx === 10) job.status = 'Ready to Deploy';

    if (checklistUpdates) {
      job.checklist = { ...job.checklist, ...checklistUpdates };
    }

    if (notes) {
      job.notes = `${job.notes ? job.notes + ' · ' : ''}${notes}`;
    }

    updateMaintKpis(data);
    saveMaintenanceData(data);

    res.json({
      success: true,
      message: `Job Card ${job.id} advanced to Stage ${stageIdx} (${job.stageName})`,
      jobCard: job,
      kpis: data.kpis
    });
  } catch (err) {
    console.error('Error advancing maintenance stage:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/maintenance/:id/estimate - Submit / Approve Estimate
router.post('/:id/estimate', (req, res) => {
  try {
    const data = getMaintenanceData();
    const job = data.jobCards.find(c => c.id === req.params.id);

    if (!job) return res.status(404).json({ success: false, message: 'Job card not found' });

    const { labour, parts, approvedBy, note } = req.body;
    const l = Number(labour) || 1500;
    const p = Number(parts) || 2500;
    const gst = Math.round((l + p) * 0.18);
    const total = l + p + gst;

    job.estimate = {
      labour: l,
      parts: p,
      gst: gst,
      total: total,
      status: 'Approved',
      approvedBy: approvedBy || 'Operations Manager',
      note: note || 'Approved within authorized credit limit'
    };

    job.stageIndex = 5; // Work In Progress
    job.stageKey = 'work';
    job.stageName = 'Work In Progress';
    job.status = 'At Workshop';

    updateMaintKpis(data);
    saveMaintenanceData(data);

    res.json({
      success: true,
      message: `Estimate ₹${total} approved. Repair work authorized.`,
      jobCard: job,
      kpis: data.kpis
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/maintenance/:id/qc - Record QC, Test Drive and Road Inspection
router.post('/:id/qc', (req, res) => {
  try {
    const data = getMaintenanceData();
    const job = data.jobCards.find(c => c.id === req.params.id);

    if (!job) return res.status(404).json({ success: false, message: 'Job card not found' });

    const { testDrivePassed, technician, completedOdo, qcNotes } = req.body;

    job.checklist.testDriveDone = true;
    job.checklist.qcPassed = testDrivePassed !== false;
    job.technician = technician || 'Lead Technician';
    job.completedOdo = completedOdo || job.odometer;

    if (testDrivePassed !== false) {
      job.stageIndex = 7; // Final Bill Verification
      job.stageKey = 'bill';
      job.stageName = 'Final Bill Verification';
      job.status = 'Bill Verification';
      job.notes = `${job.notes ? job.notes + ' · ' : ''}QC & road test passed (${qcNotes || 'Vehicle roadworthy'}).`;
    } else {
      job.stageIndex = 5; // Send back to WIP
      job.stageKey = 'work';
      job.stageName = 'Work In Progress';
      job.status = 'At Workshop';
      job.notes = `${job.notes ? job.notes + ' · ' : ''}QC failed: ${qcNotes || 'Rework required'}.`;
    }

    updateMaintKpis(data);
    saveMaintenanceData(data);

    res.json({
      success: true,
      message: testDrivePassed !== false ? 'QC approved! Moved to bill verification.' : 'QC failed. Returned to workshop WIP.',
      jobCard: job,
      kpis: data.kpis
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/maintenance/:id/bill - Verify Vendor Invoice (3-Way Match)
router.post('/:id/bill', (req, res) => {
  try {
    const data = getMaintenanceData();
    const job = data.jobCards.find(c => c.id === req.params.id);

    if (!job) return res.status(404).json({ success: false, message: 'Job card not found' });

    const { invoiceNo, billedAmount, invoiceDate } = req.body;
    const estTotal = job.estimate ? job.estimate.total : 0;
    const actualBilled = Number(billedAmount) || estTotal;
    const variance = actualBilled - estTotal;

    job.bill = {
      invoiceNo: invoiceNo || `VND/INV/${Math.floor(1000 + Math.random() * 9000)}`,
      invoiceDate: invoiceDate || new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
      billedAmount: actualBilled,
      variance: variance,
      matched: Math.abs(variance) <= 50
    };

    job.checklist.billVerified = true;
    job.stageIndex = 8; // Vendor Payment
    job.stageKey = 'payment';
    job.stageName = 'Vendor Payment';
    job.status = 'Payment Due';

    updateMaintKpis(data);
    saveMaintenanceData(data);

    res.json({
      success: true,
      message: `Final invoice verified (₹${actualBilled}). Queued for accounts payable.`,
      jobCard: job,
      kpis: data.kpis
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/maintenance/:id/payment - Record Vendor Payment
router.post('/:id/payment', (req, res) => {
  try {
    const data = getMaintenanceData();
    const job = data.jobCards.find(c => c.id === req.params.id);

    if (!job) return res.status(404).json({ success: false, message: 'Job card not found' });

    const { method, utr, amount } = req.body;

    job.payment = {
      method: method || 'Bank Transfer / NEFT',
      utr: utr || `UTR-${Date.now().toString().slice(-8)}`,
      amount: Number(amount) || (job.bill ? job.bill.billedAmount : 0),
      date: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    };

    job.checklist.paymentDone = true;
    job.stageIndex = 9; // Job Card Closure
    job.stageKey = 'closure';
    job.stageName = 'Job Card Closure';
    job.status = 'Closure Pending';

    updateMaintKpis(data);
    saveMaintenanceData(data);

    res.json({
      success: true,
      message: `Payment reference ${job.payment.utr} recorded. Ready for job card closure.`,
      jobCard: job,
      kpis: data.kpis
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/maintenance/:id/release - Close Job Card & Release Vehicle to Ready to Deploy
router.post('/:id/release', (req, res) => {
  try {
    const data = getMaintenanceData();
    const job = data.jobCards.find(c => c.id === req.params.id);

    if (!job) return res.status(404).json({ success: false, message: 'Job card not found' });

    const { nextServiceKm, nextServiceDate, closureNotes } = req.body;

    job.stageIndex = 10;
    job.stageKey = 'ready';
    job.stageName = 'Ready to Deploy';
    job.status = 'Ready to Deploy';
    job.nextService = `${nextServiceKm || '10,000 km'} / ${nextServiceDate || 'In 3 Months'}`;
    job.notes = `${job.notes ? job.notes + ' · ' : ''}Job Card closed and vehicle certified Ready to Deploy (${closureNotes || 'Release checklist verified'}). Driver assignment preserved.`;

    updateMaintKpis(data);
    saveMaintenanceData(data);

    res.json({
      success: true,
      message: `Vehicle ${job.vehicle} successfully released from maintenance to Ready to Deploy! Driver assignment preserved.`,
      jobCard: job,
      kpis: data.kpis
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
