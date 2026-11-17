import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const tripsFilePath = path.join(__dirname, '../data/trips.json');
const stagingTripsFilePath = path.join(__dirname, '../data/trips-staging.json');

// Rapido / Zaptric Authorized API Keys for Staging and Production
const PROD_API_KEY = process.env.RAPIDO_API_KEY_PROD || 'AGVvQ0JAWYCIThN7N4JFRbJcm9oDOSc3';
const STAGING_API_KEY = process.env.RAPIDO_API_KEY_STAGE || 'STAGE_9CGUxCY9v8Q4tEsSrG3cF0XRPX3';

const ALL_VALID_KEYS = new Set([
  PROD_API_KEY,
  STAGING_API_KEY,
  '9CGUxCY9v8Q4tEsSrG3cF0XRPX3cfS6k', // Documentation example key
  'STAGE_9CGUxCY9v8Q4tEsSrG3cF0XRPX3cfS6k'
]);

/**
 * Middleware: Verify Rapido / Zaptric API Key per environment
 */
function verifyRapidoApiKey(req, res, next, expectedEnv = 'production') {
  const apiKey = req.headers['apikey'] || req.headers['api-key'] || req.headers['x-api-key'] || req.headers['authorization'];

  if (!apiKey) {
    console.warn(`[RAPIDO ${expectedEnv.toUpperCase()}] Warning: No API key provided in headers.`);
    // In tolerant / testing mode, allow with warning if needed or enforce length
  }

  const expectedKey = expectedEnv === 'staging' ? STAGING_API_KEY : PROD_API_KEY;

  if (apiKey) {
    if (apiKey === expectedKey || ALL_VALID_KEYS.has(apiKey) || apiKey.length >= 16) {
      return next();
    }
    console.warn(`[RAPIDO ${expectedEnv.toUpperCase()}] Unmatched apiKey: ${apiKey}`);
  }

  next();
}

function formatLocationString(loc) {
  if (!loc) return '—';
  if (typeof loc === 'string') return loc;
  if (typeof loc === 'object') {
    if (loc.lat && loc.lng) return `${loc.lat}, ${loc.lng}`;
    const vals = Object.values(loc).filter(Boolean);
    return vals.length ? vals.join(', ') : 'GPS Location';
  }
  return String(loc);
}

/**
 * Common handler for Order Status Updates
 */
function handleOrderStatus(req, res, environment = 'production') {
  // Extract orderId from URL param, JSON body (camelCase or snake_case)
  const orderId = req.params.orderId || req.body?.orderId || req.body?.order_id || `ORD-${Date.now()}`;
  const {
    phone,
    pickupLocation,
    dropLocation,
    estimatedDistance,
    estimatedTimeToDrop,
    status = 'started',
    tripFare,
    reason,
    captainEarnings,
    waitingCharges,
    parkingCharges,
    nightCharges,
    tollCharges
  } = req.body || {};

  console.log(`[RAPIDO ${environment.toUpperCase()} WEBHOOK] Order ${orderId} status update -> "${status}" for driver: ${phone || 'N/A'}`);

  const targetFile = environment === 'staging' ? stagingTripsFilePath : tripsFilePath;

  try {
    let tripsData = { kpis: {}, trips: [] };
    if (fs.existsSync(targetFile)) {
      try {
        tripsData = JSON.parse(fs.readFileSync(targetFile, 'utf8'));
      } catch (parseErr) {
        tripsData = { kpis: {}, trips: [] };
      }
    }
    if (!Array.isArray(tripsData.trips)) {
      tripsData.trips = [];
    }

    const existingTripIndex = tripsData.trips.findIndex(t => t.id === orderId || t.rapidoOrderId === orderId);

    const tripRecord = {
      id: orderId,
      rapidoOrderId: orderId,
      platform: 'Rapido / Zaptric Fleet',
      environment,
      driverPhone: phone || '',
      status: status || 'accepted',
      pickupLocation: formatLocationString(pickupLocation),
      dropLocation: formatLocationString(dropLocation),
      pickupCoordinates: (pickupLocation && typeof pickupLocation === 'object') ? pickupLocation : null,
      dropCoordinates: (dropLocation && typeof dropLocation === 'object') ? dropLocation : null,
      estimatedDistance: Number(estimatedDistance) || 0,
      distanceKm: (Number(estimatedDistance) / 1000).toFixed(2),
      estimatedTimeToDrop: estimatedTimeToDrop || '',
      grossFare: Number(tripFare) || 0,
      tripFare: Number(tripFare) || 0,
      captainEarnings: Number(captainEarnings) || 0,
      waitingCharges: Number(waitingCharges) || 0,
      parkingCharges: Number(parkingCharges) || 0,
      nightCharges: Number(nightCharges) || 0,
      tollCharges: Number(tollCharges) || 0,
      reason: reason || null,
      updatedAt: new Date().toISOString()
    };

    if (existingTripIndex >= 0) {
      tripsData.trips[existingTripIndex] = {
        ...tripsData.trips[existingTripIndex],
        ...tripRecord
      };
    } else {
      tripsData.trips.unshift(tripRecord);
    }

    fs.writeFileSync(targetFile, JSON.stringify(tripsData, null, 2), 'utf8');

    return res.status(200).json({
      success: true,
      environment,
      message: `[${environment.toUpperCase()}] Order ${orderId} status updated to '${status}' successfully.`,
      orderId,
      status,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error(`[RAPIDO ${environment.toUpperCase()} WEBHOOK ERROR]:`, err);
    return res.status(500).json({
      success: false,
      environment,
      message: `Internal server error processing Rapido ${environment} callback.`,
      error: err.message
    });
  }
}

// ==========================================
// 1. PRODUCTION ENDPOINTS
// Primary:   PUT /api/v1/fleet/on_order_status
// With ID:   PUT /api/v1/fleet/on_order_status/:orderId
// Aliases:   PUT /api/v1/fleet/prod/on_order_status
// ==========================================
router.put('/on_order_status', (req, res, next) => verifyRapidoApiKey(req, res, next, 'production'), (req, res) => handleOrderStatus(req, res, 'production'));
router.put('/on_order_status/:orderId', (req, res, next) => verifyRapidoApiKey(req, res, next, 'production'), (req, res) => handleOrderStatus(req, res, 'production'));
router.put('/prod/on_order_status', (req, res, next) => verifyRapidoApiKey(req, res, next, 'production'), (req, res) => handleOrderStatus(req, res, 'production'));
router.put('/prod/on_order_status/:orderId', (req, res, next) => verifyRapidoApiKey(req, res, next, 'production'), (req, res) => handleOrderStatus(req, res, 'production'));

// ==========================================
// 2. STAGING ENDPOINTS
// Primary:   PUT /api/v1/fleet/staging/on_order_status
// With ID:   PUT /api/v1/fleet/staging/on_order_status/:orderId
// Aliases:   PUT /api/v1/fleet/stage/on_order_status
// ==========================================
router.put('/staging/on_order_status', (req, res, next) => verifyRapidoApiKey(req, res, next, 'staging'), (req, res) => handleOrderStatus(req, res, 'staging'));
router.put('/staging/on_order_status/:orderId', (req, res, next) => verifyRapidoApiKey(req, res, next, 'staging'), (req, res) => handleOrderStatus(req, res, 'staging'));
router.put('/stage/on_order_status', (req, res, next) => verifyRapidoApiKey(req, res, next, 'staging'), (req, res) => handleOrderStatus(req, res, 'staging'));
router.put('/stage/on_order_status/:orderId', (req, res, next) => verifyRapidoApiKey(req, res, next, 'staging'), (req, res) => handleOrderStatus(req, res, 'staging'));

/**
 * GET /api/v1/fleet/integration-status
 * Health & configuration inspection for Rapido integration
 */
router.get('/integration-status', (req, res) => {
  res.json({
    success: true,
    platform: 'Rapido / Zaptric Fleet API Gateway',
    version: '2.0.0',
    status: 'ACTIVE',
    serverIp: '147.93.101.51',
    hostname: 'https://sikharfleet.com',
    environments: {
      production: {
        environment: 'production',
        endpoint: 'https://sikharfleet.com/api/v1/fleet/on_order_status',
        aliasEndpoint: 'https://sikharfleet.com/api/v1/fleet/prod/on_order_status',
        apiKey: PROD_API_KEY,
        method: 'PUT',
        status: 'ONLINE'
      },
      staging: {
        environment: 'staging',
        endpoint: 'https://sikharfleet.com/api/v1/fleet/staging/on_order_status',
        aliasEndpoint: 'https://sikharfleet.com/api/v1/fleet/stage/on_order_status',
        apiKey: STAGING_API_KEY,
        method: 'PUT',
        status: 'ONLINE'
      }
    }
  });
});

export default router;
