import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { query } from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, '../data');

const SNAPSHOTS = {
  admin: 'admin.json',
  dashboard: 'dashboard.json',
  fleet: 'fleet.json',
  drivers: 'drivers.json',
  assignments: 'assignments.json',
  leases: 'leases.json',
  invoices: 'invoices.json',
  escalations: 'escalations.json',
  trips: 'trips.json',
  maintenance: 'maintenance.json',
  fuel: 'fuel.json',
  compliance: 'compliance.json'
};

const ROUTE_DOMAINS = {
  '/api/auth': ['admin'],
  '/api/dashboard': ['dashboard'],
  '/api/fleet': ['fleet'],
  '/api/drivers': ['drivers', 'fleet'],
  '/api/assignments': ['assignments', 'drivers', 'fleet'],
  '/api/rentals': ['leases', 'invoices', 'drivers', 'fleet'],
  '/api/escalations': ['escalations'],
  '/api/trips': ['trips', 'escalations'],
  '/api/maintenance': ['maintenance'],
  '/api/fuel': ['fuel'],
  '/api/compliance': ['compliance'],
  '/api/v1/fleet': ['trips']
};

let schemaPromise;

function fileForDomain(domain) {
  return path.join(DATA_DIR, SNAPSHOTS[domain]);
}

function readDomain(domain) {
  return fs.readFileSync(fileForDomain(domain), 'utf8');
}

function writeDomain(domain, payload) {
  fs.writeFileSync(fileForDomain(domain), payload, 'utf8');
}

export function requiresLiveDatabase() {
  return process.env.REQUIRE_LIVE_DB === 'true' || process.env.NODE_ENV === 'production' || Boolean(process.env.SOCKET_PATH);
}

export async function ensureOperationalStoreSchema() {
  if (!schemaPromise) {
    schemaPromise = query(`
      CREATE TABLE IF NOT EXISTS admin_operational_snapshots (
        domain VARCHAR(80) NOT NULL,
        payload LONGTEXT NOT NULL,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (domain)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `).catch(error => {
      schemaPromise = null;
      throw error;
    });
  }
  return schemaPromise;
}

export async function persistOperationalDomains(domains) {
  const uniqueDomains = [...new Set(domains)].filter(domain => SNAPSHOTS[domain]);
  if (!uniqueDomains.length) return { saved: [], storage: 'not-required' };

  await ensureOperationalStoreSchema();
  for (const domain of uniqueDomains) {
    await query(
      `INSERT INTO admin_operational_snapshots (domain, payload)
       VALUES (?, ?)
       ON DUPLICATE KEY UPDATE payload = VALUES(payload), updated_at = CURRENT_TIMESTAMP`,
      [domain, readDomain(domain)]
    );
  }
  return { saved: uniqueDomains, storage: 'mysql' };
}

export async function hydrateOperationalDomains() {
  await ensureOperationalStoreSchema();
  const rows = await query('SELECT domain, payload FROM admin_operational_snapshots');
  if (!rows.length) {
    if (process.env.MIGRATE_JSON_TO_SQL !== 'true') {
      return {
        hydrated: [],
        storage: 'mysql',
        migrationRequired: true,
        message: 'No operational snapshots exist yet. JSON-to-SQL migration is explicit.'
      };
    }
    return persistOperationalDomains(Object.keys(SNAPSHOTS));
  }

  for (const row of rows) {
    if (!SNAPSHOTS[row.domain] || typeof row.payload !== 'string') continue;
    JSON.parse(row.payload);
    writeDomain(row.domain, row.payload);
  }
  return { hydrated: rows.map(row => row.domain), storage: 'mysql' };
}

export function domainsForRequest(req) {
  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) return [];
  const routePrefix = Object.keys(ROUTE_DOMAINS)
    .sort((a, b) => b.length - a.length)
    .find(prefix => req.path === prefix || req.path.startsWith(`${prefix}/`));
  if (!routePrefix || routePrefix === '/api/options' || routePrefix === '/api/ocr') return [];
  return ROUTE_DOMAINS[routePrefix] || [];
}

export function operationalStorageMiddleware() {
  return (req, res, next) => {
    const domains = domainsForRequest(req);
    if (!domains.length) return next();

    const beforeMutation = Object.fromEntries(domains.map(domain => [domain, readDomain(domain)]));
    const originalJson = res.json.bind(res);
    let responseHandled = false;
    res.json = (body) => {
      if (responseHandled) return res;
      responseHandled = true;
      if (!body?.success) return originalJson(body);

      persistOperationalDomains(domains)
        .then(() => originalJson(body))
        .catch(error => {
          console.error(`Live SQL persistence failed for ${req.method} ${req.originalUrl}:`, error.code || error.message);
          if (requiresLiveDatabase()) {
            for (const [domain, payload] of Object.entries(beforeMutation)) writeDomain(domain, payload);
            res.status(503);
            return originalJson({
              success: false,
              message: 'This admin change was not saved because the live SQL database is unavailable.',
              code: 'LIVE_DATABASE_REQUIRED'
            });
          }
          res.setHeader('X-Storage-Mode', 'local-fallback');
          return originalJson(body);
        });
      return res;
    };
    next();
  };
}

export function operationalSnapshotStatus() {
  return {
    sourceOfTruth: 'mysql',
    localCache: 'server/data/*.json',
    liveWritesRequired: requiresLiveDatabase(),
    jsonToSqlMigration: 'explicit-only',
    migrationEnabled: process.env.MIGRATE_JSON_TO_SQL === 'true',
    domains: Object.keys(SNAPSHOTS)
  };
}
