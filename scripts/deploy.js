import { Client } from 'ssh2';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const DIST_DIR = path.resolve(ROOT_DIR, 'dist');

const SSH_CONFIG = {
  host: process.env.SSH_HOST || '82.25.123.33',
  port: parseInt(process.env.SSH_PORT || '65002', 10),
  username: process.env.SSH_USER || 'u253609925_T5Cexn3e2',
  password: process.env.SSH_PASSWORD || 'eTe]Op;x9Y|',
  readyTimeout: 30000
};

// Target directory on Hostinger server
const REMOTE_PATH = process.env.REMOTE_WEB_DIR || 'public_html';

async function deploy() {
  console.log('=======================================================');
  console.log('🚀 SIKHAR FLEET AUTOMATED DEPLOYMENT');
  console.log(`🌐 Target: ${process.env.LIVE_URL || 'http://sikhar.technomantra.in'}`);
  console.log(`📡 SSH Server: ${SSH_CONFIG.username}@${SSH_CONFIG.host}:${SSH_CONFIG.port}`);
  console.log('=======================================================');

  // Step 1: Build Production Assets
  console.log('\n[1/3] 🔨 Building production bundle with Vite...');
  try {
    execSync('npm run build', { cwd: ROOT_DIR, stdio: 'inherit' });
    console.log('✅ Build completed successfully.');
  } catch (err) {
    console.error('❌ Build failed. Aborting deployment.');
    process.exit(1);
  }

  // Step 2: Connect to SSH Server
  console.log('\n[2/3] 🔌 Connecting to Hostinger server via SSH (Port 65002)...');
  const conn = new Client();

  conn.on('ready', () => {
    console.log('✅ SSH authenticated successfully!');
    console.log(`\n[3/3] 📤 Uploading dist/ files to ${REMOTE_PATH}...`);

    conn.sftp((err, sftp) => {
      if (err) {
        console.error('❌ SFTP session error:', err.message);
        conn.end();
        return;
      }

      function uploadDir(localDir, remoteDir, callback) {
        fs.readdir(localDir, { withFileTypes: true }, async (err, files) => {
          if (err) return callback(err);

          sftp.mkdir(remoteDir, (err) => {
            // Ignore if directory already exists
            let remaining = files.length;
            if (remaining === 0) return callback(null);

            for (const file of files) {
              const localFilePath = path.join(localDir, file.name);
              const remoteFilePath = `${remoteDir}/${file.name}`;

              if (file.isDirectory()) {
                uploadDir(localFilePath, remoteFilePath, (err) => {
                  if (err) console.error(`Error uploading dir ${remoteFilePath}:`, err.message);
                  remaining--;
                  if (remaining === 0) callback(null);
                });
              } else {
                sftp.fastPut(localFilePath, remoteFilePath, (err) => {
                  if (err) {
                    console.error(`❌ Failed to upload ${file.name}:`, err.message);
                  } else {
                    console.log(`   ✓ Uploaded: ${file.name}`);
                  }
                  remaining--;
                  if (remaining === 0) callback(null);
                });
              }
            }
          });
        });
      }

      uploadDir(DIST_DIR, REMOTE_PATH, (err) => {
        if (err) {
          console.error('❌ Upload encountered errors:', err.message);
        } else {
          console.log('\n=======================================================');
          console.log('🎉 DEPLOYMENT COMPLETE!');
          console.log(`🌐 Live Website: ${process.env.LIVE_URL || 'http://sikhar.technomantra.in'}`);
          console.log('=======================================================');
        }
        conn.end();
      });
    });
  }).on('error', (err) => {
    console.error('\n❌ SSH Connection Error:', err.message);
    console.log('\n💡 HOSTINGER CONNECTION TIPS:');
    console.log('1. Ensure SSH is enabled: Hostinger hPanel -> Advanced -> SSH Access -> Click "Enable".');
    console.log('2. Ensure IP is allowed: In hPanel -> Security -> IP Manager / Remote MySQL, add your IP.');
    console.log('3. Verify password: Hostinger SSH password matches your hPanel main password.');
  }).connect(SSH_CONFIG);
}

deploy();
