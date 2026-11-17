import { Client } from 'ssh2';
import fs from 'fs';
import path from 'path';

const config = {
  host: '145.79.212.232',
  port: 65002,
  username: 'u212890862',
  password: 'Rashmi@saha1988',
  readyTimeout: 30000
};

const LOCAL_TAR = path.resolve('deploy-bundle.tar.gz');
const REMOTE_TAR = '/home/u212890862/deploy-bundle.tar.gz';
const APP_DIR = '/home/u212890862/domains/sikhar.technomantra.in/hbuilds/current/nodejs';

console.log('=======================================================');
console.log('🚀 SIKHAR TECHNOMANTRA LIVE DEPLOYMENT');
console.log(`🌐 Target: ${config.username}@${config.host}:${config.port}`);
console.log('=======================================================');

if (!fs.existsSync(LOCAL_TAR)) {
  console.error('❌ deploy-bundle.tar.gz not found!');
  process.exit(1);
}

const conn = new Client();

conn.on('ready', () => {
  console.log('✅ SSH Connection authenticated successfully!');
  console.log('📦 Uploading deploy-bundle.tar.gz via SFTP...');

  conn.sftp((err, sftp) => {
    if (err) {
      console.error('SFTP error:', err.message);
      conn.end();
      return;
    }

    sftp.fastPut(LOCAL_TAR, REMOTE_TAR, (uploadErr) => {
      if (uploadErr) {
        console.error('Upload failed:', uploadErr.message);
        conn.end();
        return;
      }

      console.log('✓ Upload complete! Extracting files to Passenger nodejs directory...');

      const deployCmd = `
        export PATH=/opt/alt/alt-nodejs22/root/bin:~/.npm-global/bin:$PATH

        echo "--- 1. Extracting archive ---"
        mkdir -p ${APP_DIR}
        tar -xzf ${REMOTE_TAR} -C ${APP_DIR}

        echo "--- 2. Installing production dependencies ---"
        cd ${APP_DIR}
        npm install --omit=dev

        echo "--- 3. Restarting Phusion Passenger Node.js app ---"
        mkdir -p ${APP_DIR}/tmp
        touch ${APP_DIR}/tmp/restart.txt

        echo "--- 4. Checking status ---"
        sleep 2
        echo "=== TECHNOMANTRA DEPLOYMENT COMPLETED SUCCESSFULLY ==="
      `;

      conn.exec(deployCmd, (cmdErr, stream) => {
        if (cmdErr) {
          console.error('Command execution error:', cmdErr.message);
          conn.end();
          return;
        }

        stream.on('data', (d) => process.stdout.write(d.toString()));
        stream.stderr.on('data', (d) => process.stderr.write(d.toString()));
        stream.on('close', (code) => {
          console.log(`Remote process exited with code: ${code}`);
          conn.end();
        });
      });
    });
  });
}).on('error', (err) => {
  console.error('Connection error:', err.message);
}).connect(config);
