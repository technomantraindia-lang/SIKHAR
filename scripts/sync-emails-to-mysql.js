import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { query } from '../server/config/db.js';
import { persistOperationalDomains } from '../server/config/operationalStore.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_FILE = path.join(__dirname, '../server/data/drivers.json');

const emailMap = {
  'drv-19': 'dhruv.tester@sikharfleet.com',
  'drv-17': 'dhruv17@sikharfleet.com',
  'drv-16': 'driver16@sikharfleet.com',
  'drv-15': 'dhruv.parekh@sikharfleet.com',
  'drv-14': 'vivek@sikharfleet.com',
  'drv-13': 'sumit@sikharfleet.com',
  'drv-12': 'dhruv9687@sikharfleet.com',
  'drv-11': 'chetan@sikharfleet.com',
  'drv-01': 'raj.kumar@sikharfleet.com',
  'drv-02': 'amit.singh@sikharfleet.com',
  'drv-03': 'manoj.yadav@sikharfleet.com',
  'drv-04': 'rohit.yadav@sikharfleet.com',
  'drv-05': 'sandeep.kumar@sikharfleet.com',
  'drv-06': 'vikram.singh@sikharfleet.com',
  'drv-08': 'anoop@sikharfleet.com',
  'drv-10': 'jitendra.pal@sikharfleet.com'
};

async function main() {
  const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));

  data.drivers.forEach(d => {
    d.email = emailMap[d.id] || (d.name.toLowerCase().replace(/[^a-z0-9]/g, '.') + '@sikharfleet.com');
    if (d.id === 'drv-19') {
      d.pin = '1234';
      d.isRegistered = true;
    }
    if (d.id === 'drv-13') {
      d.pin = '4321';
      d.isRegistered = true;
    }
  });

  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
  console.log('✓ Updated server/data/drivers.json');

  try {
    await persistOperationalDomains(['drivers']);
    console.log('✓ Successfully persisted drivers snapshot to MySQL database!');
  } catch (err) {
    console.error('MySQL persistence error:', err.message);
  }

  process.exit(0);
}

main();
