import https from 'https';

const prodData = JSON.stringify({
  phone: "9999999999",
  orderId: "RD123456_LIVE_PROD",
  status: "started",
  pickupLocation: { lat: "12.91195", lng: "77.64711" },
  dropLocation: { lat: "12.91195", lng: "77.64711" },
  estimatedDistance: 4000,
  estimatedTimeToDrop: "1732528675"
});

const stagingData = JSON.stringify({
  phone: "9999999999",
  orderId: "RD123456_LIVE_STAGE",
  status: "started",
  pickupLocation: { lat: "12.91195", lng: "77.64711" },
  dropLocation: { lat: "12.91195", lng: "77.64711" },
  estimatedDistance: 4000,
  estimatedTimeToDrop: "1732528675"
});

function callLive(endpointPath, apiKey, data) {
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'sikharfleet.com',
      port: 443,
      path: endpointPath,
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'apiKey': apiKey,
        'Content-Length': Buffer.byteLength(data),
        'User-Agent': 'Rapido-Fleet-Tester/1.0'
      }
    }, res => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(body) });
        } catch (e) {
          resolve({ status: res.statusCode, body });
        }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function run() {
  console.log('Testing LIVE Production Endpoint on sikharfleet.com...');
  const prodRes = await callLive('/api/v1/fleet/on_order_status', 'AGVvQ0JAWYCIThN7N4JFRbJcm9oDOSc3', prodData);
  console.log('Live PROD Status Code:', prodRes.status);
  console.log('Live PROD Response:', prodRes.body);

  console.log('\nTesting LIVE Staging Endpoint on sikharfleet.com...');
  const stageRes = await callLive('/api/v1/fleet/staging/on_order_status', 'STAGE_9CGUxCY9v8Q4tEsSrG3cF0XRPX3', stagingData);
  console.log('Live STAGING Status Code:', stageRes.status);
  console.log('Live STAGING Response:', stageRes.body);

  console.log('\nTesting LIVE Integration Status on sikharfleet.com...');
  https.get('https://sikharfleet.com/api/v1/fleet/integration-status', res => {
    let body = '';
    res.on('data', chunk => body += chunk);
    res.on('end', () => {
      console.log('Live Integration Status Body:', JSON.parse(body));
    });
  });
}

run();
