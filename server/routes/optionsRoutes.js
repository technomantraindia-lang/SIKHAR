import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { query, getDbStatus } from '../config/db.js';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const optionsPath = path.join(__dirname, '../data/options.json');

const DEFAULT_OPTIONS = {
  vehicle_model: ['TATA TIGOR EV XPRESS T', 'TATA TIAGO EV', 'Maruti Suzuki CNG'],
  vehicle_type: ['EV', 'CNG', 'Petrol', 'Diesel'],
  connector_type: ['CCS2', 'Type 2 AC', 'Standard CNG Valve'],
  fleet_hub: ['Sikhar Central Yard', 'Sikhar East Hub', 'Sikhar West Hub'],
  vehicle_status: ['Ready to Deploy', 'On Road', 'At Workshop', 'Breakdown', 'Allocated'],
  financing_lender: ['Signo Financing', 'Astronova Capital', 'HDFC Bank Commercial Assets', 'Tata Capital Fleet Finance'],
  assignment_reason: ['New allocation', 'Driver replacement', 'Workshop return', 'Temporary assignment'],
  charging_station: ['Sikhar Central Charging Bay', 'Tata Power Charging Station', 'Public DC Fast Charger'],
  fuel_payment_method: ['Fleet card', 'Cash', 'UPI', 'Company account'],
  compliance_document_type: ['Insurance', 'Permit', 'Fitness', 'PUC'],
  challan_payment_method: ['Online banking', 'UPI', 'Cash', 'Wallet deduction'],
  escalation_category: ['Vehicle breakdown', 'Driver conduct', 'Wallet breach', 'Compliance', 'Customer complaint'],
  escalation_priority: ['Low', 'Medium', 'High', 'Critical'],
  escalation_team: ['Fleet Operations', 'Finance', 'Compliance', 'Customer Support'],
  trip_source: ['Rapido', 'Uber', 'Manual entry', 'Partner upload'],
  trip_deal_type: ['Revenue share', 'Fixed rental', 'Lease', 'Corporate contract'],
  payment_method: ['UPI', 'Bank transfer', 'Cash', 'Card', 'Wallet adjustment'],
  billing_frequency: ['Daily', 'Weekly', 'Monthly'],
  maintenance_service_type: ['Periodic service', 'Breakdown repair', 'Tyre replacement', 'Body work', 'Electrical repair'],
  maintenance_payment_method: ['Bank transfer', 'UPI', 'Cash', 'Credit terms'],
  wallet_topup_method: ['UPI', 'Bank transfer', 'Cash', 'Adjustment'],
  driver_gender: ['Male', 'Female', 'Other'],
  driver_relation: ['Father', 'Mother', 'Spouse', 'Brother', 'Sister', 'Other']
};

function readLocalOptions() {
  try {
    const parsed = JSON.parse(fs.readFileSync(optionsPath, 'utf8'));
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function writeLocalOptions(options) {
  fs.writeFileSync(optionsPath, JSON.stringify(options, null, 2), 'utf8');
}

function normalizeGroup(value) {
  return String(value || '').trim().toLowerCase().replace(/[^a-z0-9_-]/g, '_').slice(0, 120);
}

function normalizeOption(value) {
  return String(value || '').trim().replace(/\s+/g, ' ').slice(0, 191);
}

function localOptionsFor(group) {
  const local = readLocalOptions();
  const values = [...(DEFAULT_OPTIONS[group] || []), ...(local[group] || [])]
    .map(normalizeOption)
    .filter(Boolean);
  return [...new Set(values)].map(value => ({ value, label: value, source: 'local-fallback' }));
}

async function ensureOptionsSchema() {
  await query(`
    CREATE TABLE IF NOT EXISTS admin_dropdown_options (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      option_group VARCHAR(120) NOT NULL,
      option_value VARCHAR(191) NOT NULL,
      option_label VARCHAR(191) NOT NULL,
      is_active TINYINT(1) NOT NULL DEFAULT 1,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY uq_admin_dropdown_option (option_group, option_value),
      KEY idx_admin_dropdown_group (option_group, is_active)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
}

async function seedGroup(group) {
  const defaults = DEFAULT_OPTIONS[group] || [];
  for (const value of defaults) {
    await query(
      `INSERT INTO admin_dropdown_options (option_group, option_value, option_label)
       VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE is_active = 1, option_label = VALUES(option_label)`,
      [group, value, value]
    );
  }
}

router.get('/', async (req, res) => {
  const group = normalizeGroup(req.query.group);
  if (!group) return res.status(400).json({ success: false, message: 'Option group is required.' });

  try {
    await ensureOptionsSchema();
    await seedGroup(group);
    const rows = await query(
      `SELECT option_value AS value, option_label AS label, 'database' AS source
       FROM admin_dropdown_options WHERE option_group = ? AND is_active = 1
       ORDER BY option_label ASC`,
      [group]
    );
    return res.json({ success: true, data: rows, storage: 'mysql' });
  } catch (error) {
    console.warn(`Dropdown option group ${group} using local fallback:`, error.code || error.message);
    return res.json({ success: true, data: localOptionsFor(group), storage: 'local-fallback' });
  }
});

router.post('/', async (req, res) => {
  const group = normalizeGroup(req.body?.group);
  const value = normalizeOption(req.body?.value || req.body?.label);
  const label = normalizeOption(req.body?.label || value);
  if (!group || !value) return res.status(400).json({ success: false, message: 'Option group and value are required.' });

  try {
    await ensureOptionsSchema();
    await query(
      `INSERT INTO admin_dropdown_options (option_group, option_value, option_label)
       VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE is_active = 1, option_label = VALUES(option_label)`,
      [group, value, label]
    );
    return res.status(201).json({
      success: true,
      data: { value, label, source: 'database' },
      storage: 'mysql',
      databaseConnected: getDbStatus().isConnected
    });
  } catch (error) {
    console.warn(`Dropdown option ${group}/${value} using local fallback:`, error.code || error.message);
    const local = readLocalOptions();
    local[group] = [...new Set([...(local[group] || []), value])];
    writeLocalOptions(local);
    return res.status(201).json({
      success: true,
      data: { value, label, source: 'local-fallback' },
      storage: 'local-fallback',
      databaseConnected: false,
      warning: 'MySQL is unavailable; the option was saved in server/data/options.json.'
    });
  }
});

export default router;
