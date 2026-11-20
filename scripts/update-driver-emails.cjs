const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../server/data/drivers.json');
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

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

data.drivers.forEach(d => {
  d.email = emailMap[d.id] || (d.name.toLowerCase().replace(/[^a-z0-9]/g, '.') + '@sikharfleet.com');
  if (d.id === 'drv-19') {
    d.pin = '1234';
    d.isRegistered = true;
  }
});

fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
console.log('Successfully wrote', data.drivers.length, 'driver emails to', filePath);
