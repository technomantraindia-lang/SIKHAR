import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const escalationsDataPath = path.join(__dirname, '../data/escalations.json');

// Helper to read data safely
function getEscalationsData() {
  try {
    const raw = fs.readFileSync(escalationsDataPath, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading escalations.json:', err.message);
    return { kpis: {}, categories: [], tickets: [] };
  }
}

// Helper to write data safely
function saveEscalationsData(data) {
  fs.writeFileSync(escalationsDataPath, JSON.stringify(data, null, 2), 'utf-8');
}

// Helper to recalculate KPIs
function updateKpiCounts(data) {
  const tickets = data.tickets || [];
  const openCount = tickets.filter(t => ['Open', 'In Review', 'Waiting for Driver'].includes(t.status)).length;
  const p1Count = tickets.filter(t => t.priority === 'P1' && t.status !== 'Resolved' && t.status !== 'Closed').length;
  const breachedCount = tickets.filter(t => t.slaBreached && t.status !== 'Closed').length;
  const resolvedCount = tickets.filter(t => t.status === 'Resolved' || t.status === 'Closed').length;

  data.kpis = {
    openTickets: openCount,
    p1Critical: p1Count,
    slaBreached: breachedCount,
    resolvedToday: resolvedCount,
    avgResolution: data.kpis?.avgResolution || '2h 18m'
  };
}

// GET /api/escalations - Retrieve list of escalations + KPIs + categories
router.get('/', (req, res) => {
  try {
    const data = getEscalationsData();
    const { status, priority, category, search } = req.query;

    let filtered = [...data.tickets];

    if (status && status !== 'all') {
      const s = status.toLowerCase();
      filtered = filtered.filter(t => t.status.toLowerCase().replace(/\s+/g, '') === s.replace(/\s+/g, ''));
    }

    if (priority && priority !== 'all') {
      filtered = filtered.filter(t => t.priority.toUpperCase() === priority.toUpperCase());
    }

    if (category && category !== 'all') {
      filtered = filtered.filter(t => t.category.toLowerCase() === category.toLowerCase());
    }

    if (search && search.trim() !== '') {
      const q = search.toLowerCase();
      filtered = filtered.filter(t =>
        (t.id && t.id.toLowerCase().includes(q)) ||
        (t.driver && t.driver.toLowerCase().includes(q)) ||
        (t.vehicle && t.vehicle.toLowerCase().includes(q)) ||
        (t.category && t.category.toLowerCase().includes(q)) ||
        (t.problem && t.problem.toLowerCase().includes(q)) ||
        (t.location && t.location.toLowerCase().includes(q)) ||
        (t.owner && t.owner.toLowerCase().includes(q))
      );
    }

    return res.json({
      success: true,
      kpis: data.kpis,
      categories: data.categories,
      tickets: filtered,
      totalCount: data.tickets.length
    });
  } catch (error) {
    console.error('Failed to get escalations:', error);
    res.status(500).json({ success: false, message: 'Internal server error reading escalations' });
  }
});

// GET /api/escalations/:id - Retrieve specific escalation ticket
router.get('/:id', (req, res) => {
  try {
    const data = getEscalationsData();
    const ticket = data.tickets.find(t => t.id.toUpperCase() === req.params.id.toUpperCase());

    if (!ticket) {
      return res.status(404).json({ success: false, message: `Escalation ${req.params.id} not found.` });
    }

    return res.json({
      success: true,
      ticket
    });
  } catch (error) {
    console.error('Failed to get escalation by ID:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// POST /api/escalations - Create a new escalation ticket
router.post('/', (req, res) => {
  try {
    const data = getEscalationsData();
    const {
      driver,
      driverPhone,
      vehicle,
      vehicleModel,
      category = 'Vehicle Breakdown',
      priority = 'P2',
      problem,
      impact,
      location,
      team = 'Fleet Operations',
      owner = 'Auto Assign'
    } = req.body;

    if (!problem || !driver) {
      return res.status(400).json({
        success: false,
        message: 'Driver and Problem / Issue description are required.'
      });
    }

    // Auto-generate ticket ID (e.g. ESC-1026)
    const existingIds = data.tickets
      .map(t => parseInt(t.id.replace('ESC-', ''), 10))
      .filter(n => !isNaN(n));
    const nextNum = existingIds.length > 0 ? Math.max(...existingIds) + 1 : 1026;
    const newId = `ESC-${nextNum}`;

    const slaMap = {
      P1: '58m remaining',
      P2: '3h 50m remaining',
      P3: '23h 40m remaining'
    };

    const finalOwner = owner === 'Auto Assign' ? (team === 'Finance' ? 'Priya' : team === 'Driver Support' ? 'Rahul' : 'Mohit') : owner;

    const newTicket = {
      id: newId,
      driver,
      driverPhone: driverPhone || '+91 98000 00000',
      vehicle: vehicle || 'Not assigned',
      vehicleModel: vehicleModel || 'Tata Tigor EV',
      category,
      priority,
      status: 'Open',
      owner: finalOwner,
      team,
      sla: slaMap[priority] || '3h 50m remaining',
      slaBreached: false,
      createdAt: new Date().toISOString(),
      location: location || 'Gurgaon Yard',
      problem,
      impact: impact || 'Operational review initiated.',
      source: 'Admin Portal',
      evidence: [],
      journey: [
        {
          step: 1,
          title: 'Raise and triage',
          desc: `Ticket created in admin console. Auto-triaged to ${priority} for team ${team}.`,
          status: 'completed',
          timestamp: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) + ', ' + new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
          actor: 'Admin'
        },
        {
          step: 2,
          title: 'Assign and respond',
          desc: `Routed to ${team}; assigned to ${finalOwner}. SLA timer started.`,
          status: 'completed',
          timestamp: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) + ', ' + new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
          actor: finalOwner
        },
        {
          step: 3,
          title: 'Investigate and act',
          desc: 'Investigation and operational resolution pending.',
          status: 'in_progress',
          timestamp: 'In Progress',
          actor: finalOwner
        },
        {
          step: 4,
          title: 'Resolve, confirm and close',
          desc: 'Awaiting resolution actions and driver confirmation.',
          status: 'pending',
          timestamp: 'Pending',
          actor: finalOwner
        }
      ],
      linkedRecords: {
        vehicle: vehicle || undefined
      },
      timeline: [
        {
          time: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) + ', ' + new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
          user: 'Admin',
          text: `Ticket ${newId} created for ${driver} (${vehicle || 'No vehicle'}) under category "${category}".`
        }
      ]
    };

    data.tickets.unshift(newTicket);
    updateKpiCounts(data);
    saveEscalationsData(data);

    return res.status(201).json({
      success: true,
      message: `Escalation ${newId} created successfully.`,
      ticket: newTicket,
      kpis: data.kpis
    });
  } catch (error) {
    console.error('Failed to create escalation:', error);
    res.status(500).json({ success: false, message: 'Failed to create escalation ticket.' });
  }
});

// POST /api/escalations/:id/notes - Add note to timeline
router.post('/:id/notes', (req, res) => {
  try {
    const data = getEscalationsData();
    const ticket = data.tickets.find(t => t.id.toUpperCase() === req.params.id.toUpperCase());

    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }

    const { note, user = 'Admin' } = req.body;
    if (!note || note.trim() === '') {
      return res.status(400).json({ success: false, message: 'Note text is required' });
    }

    const timeStr = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) + ', ' + new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    ticket.timeline.unshift({
      time: timeStr,
      user,
      text: note.trim()
    });

    saveEscalationsData(data);
    return res.json({ success: true, message: 'Note added successfully', timeline: ticket.timeline });
  } catch (error) {
    console.error('Error adding note:', error);
    res.status(500).json({ success: false, message: 'Failed to add note' });
  }
});

// PUT /api/escalations/:id - Update ticket status, priority, or owner
router.put('/:id', (req, res) => {
  try {
    const data = getEscalationsData();
    const ticketIndex = data.tickets.findIndex(t => t.id.toUpperCase() === req.params.id.toUpperCase());

    if (ticketIndex === -1) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }

    const ticket = data.tickets[ticketIndex];
    const { status, owner, priority, team, linkedRecords } = req.body;

    const timeStr = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) + ', ' + new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    if (status && status !== ticket.status) {
      ticket.timeline.unshift({
        time: timeStr,
        user: 'Admin',
        text: `Status updated from "${ticket.status}" to "${status}".`
      });
      ticket.status = status;

      if (status === 'Resolved' || status === 'Closed') {
        ticket.sla = 'Closed (Within SLA)';
        ticket.journey[2].status = 'completed';
        ticket.journey[3].status = 'completed';
        ticket.journey[3].timestamp = timeStr;
      } else if (status === 'In Review') {
        ticket.journey[2].status = 'in_progress';
      }
    }

    if (owner && owner !== ticket.owner) {
      ticket.timeline.unshift({
        time: timeStr,
        user: 'Admin',
        text: `Owner reassigned from "${ticket.owner}" to "${owner}".`
      });
      ticket.owner = owner;
    }

    if (priority && priority !== ticket.priority) {
      ticket.timeline.unshift({
        time: timeStr,
        user: 'Admin',
        text: `Priority changed from ${ticket.priority} to ${priority}.`
      });
      ticket.priority = priority;
    }

    if (team) ticket.team = team;
    if (linkedRecords) ticket.linkedRecords = { ...ticket.linkedRecords, ...linkedRecords };

    data.tickets[ticketIndex] = ticket;
    updateKpiCounts(data);
    saveEscalationsData(data);

    return res.json({
      success: true,
      message: `Escalation ${ticket.id} updated.`,
      ticket,
      kpis: data.kpis
    });
  } catch (error) {
    console.error('Failed to update escalation:', error);
    res.status(500).json({ success: false, message: 'Failed to update ticket.' });
  }
});

// POST /api/escalations/:id/resolve - Mark ticket resolved
router.post('/:id/resolve', (req, res) => {
  try {
    const data = getEscalationsData();
    const ticket = data.tickets.find(t => t.id.toUpperCase() === req.params.id.toUpperCase());

    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }

    const { resolutionNote = 'Issue addressed and verified with driver.', driverConfirmed = true } = req.body;
    const timeStr = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) + ', ' + new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    ticket.status = 'Resolved';
    ticket.sla = 'Resolved (Closed)';
    ticket.resolution = {
      note: resolutionNote,
      resolvedAt: timeStr,
      driverConfirmed: Boolean(driverConfirmed)
    };

    ticket.journey[2].status = 'completed';
    ticket.journey[3].status = 'completed';
    ticket.journey[3].desc = `Resolution recorded: ${resolutionNote}. Driver confirmation: ${driverConfirmed ? 'Verified ✓' : 'Pending'}.`;
    ticket.journey[3].timestamp = timeStr;

    ticket.timeline.unshift({
      time: timeStr,
      user: 'Admin',
      text: `Ticket marked as Resolved: "${resolutionNote}". Driver confirmed: ${driverConfirmed ? 'Yes' : 'No'}.`
    });

    updateKpiCounts(data);
    saveEscalationsData(data);

    return res.json({
      success: true,
      message: `Escalation ${ticket.id} resolved successfully.`,
      ticket,
      kpis: data.kpis
    });
  } catch (error) {
    console.error('Failed to resolve escalation:', error);
    res.status(500).json({ success: false, message: 'Failed to resolve ticket' });
  }
});

export default router;
