import http from 'http';
import app from '../server.js';

const PORT = 5599;

const server = app.listen(PORT, '127.0.0.1', async () => {
  console.log(`Test server running on port ${PORT}...`);

  const prodPayload = JSON.stringify({
    phone: "9999999999",
    orderId: "RD123456_PROD",
    status: "started",
    pickupLocation: { lat: "12.91195", lng: "77.64711" },
    dropLocation: { lat: "12.91195", lng: "77.64711" },
    estimatedDistance: 4000,
    estimatedTimeToDrop: "1732528675"
  });

  const stagingPayload = JSON.stringify({
    phone: "9999999999",
    orderId: "RD123456_STAGING",
    status: "started",
    pickupLocation: { lat: "12.91195", lng: "77.64711" },
    dropLocation: { lat: "12.91195", lng: "77.64711" },
    estimatedDistance: 4000,
    estimatedTimeToDrop: "1732528675"
  });

  function makeRequest(path, apiKey, data) {
    return new Promise((resolve, reject) => {
      const req = http.request({
        hostname: '127.0.0.1',
        port: PORT,
        path,
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'apiKey': apiKey,
          'Content-Length': Buffer.byteLength(data)
        }
      }, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => resolve({ statusCode: res.statusCode, body: JSON.parse(body) }));
      });
      req.on('error', reject);
      req.write(data);
      req.end();
    });
  }

  try {
    console.log('\n--- 1. Testing Production Endpoint: PUT /api/v1/fleet/on_order_status ---');
    const prodRes = await makeRequest('/api/v1/fleet/on_order_status', 'AGVvQ0JAWYCIThN7N4JFRbJcm9oDOSc3', prodPayload);
    console.log('Prod Status Code:', prodRes.statusCode);
    console.log('Prod Response:', prodRes.body);

    console.log('\n--- 2. Testing Staging Endpoint: PUT /api/v1/fleet/staging/on_order_status ---');
    const stageRes = await makeRequest('/api/v1/fleet/staging/on_order_status', 'STAGE_9CGUxCY9v8Q4tEsSrG3cF0XRPX3', stagingPayload);
    console.log('Staging Status Code:', stageRes.statusCode);
    console.log('Staging Response:', stageRes.body);

    console.log('\n--- 3. Testing Integration Status Endpoint: GET /api/v1/fleet/integration-status ---');
    const statusRes = await new Promise((resolve, reject) => {
      http.get(`http://127.0.0.1:${PORT}/api/v1/fleet/integration-status`, res => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => resolve(JSON.parse(body)));
      }).on('error', reject);
    });
    console.log('Integration Status:', JSON.stringify(statusRes, null, 2));

    console.log('\n✅ ALL LOCAL ENDPOINT TESTS PASSED!');
  } catch (err) {
    console.error('❌ Test failed:', err);
  } finally {
    server.close();
    process.exit(0);
  }
});
