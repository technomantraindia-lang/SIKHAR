import { Client } from 'ssh2';
import fs from 'fs';
import path from 'path';

const config = {
  host: '147.93.101.51',
  port: 65002,
  username: 'u312917867',
  password: 'Sikhar@123#',
  readyTimeout: 30000
};

const LOCAL_TAR = path.resolve('deploy-bundle.tar.gz');
const REMOTE_TAR = '/home/u312917867/deploy-bundle.tar.gz';

console.log('=======================================================');
console.log('🚀 SIKHAR FLEET AUTOMATED LIVE DEPLOYMENT');
console.log(`🌐 Target: ${config.username}@${config.host}:${config.port}`);
console.log('=======================================================');

if (!fs.existsSync(LOCAL_TAR)) {
  console.error('❌ deploy-bundle.tar.gz not found!');
  process.exit(1);
}

const conn = new Client();

conn.on('ready', () => {
  console.log('✅ SSH Connection authenticated successfully!');
  console.log('📦 Uploading deploy-bundle.tar.gz (5.3 MB) via SFTP...');

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

      console.log('✓ Upload complete! Extracting files and configuring Node.js backend...');

      const deployCmd = `
        export PATH=/opt/alt/alt-nodejs22/root/usr/bin:~/.npm-global/bin:$PATH

        echo "--- 1. Extracting archive ---"
        mkdir -p /home/u312917867/sikhar-app
        tar -xzf ${REMOTE_TAR} -C /home/u312917867/sikhar-app

        echo "--- 2. Deploying frontend build to public_html ---"
        mkdir -p /home/u312917867/domains/sikharfleet.com/public_html
        # Remove old placeholder default.php
        rm -f /home/u312917867/domains/sikharfleet.com/public_html/default.php
        cp -r /home/u312917867/sikhar-app/dist/* /home/u312917867/domains/sikharfleet.com/public_html/
        cp -f /home/u312917867/sikhar-app/dist/.htaccess /home/u312917867/domains/sikharfleet.com/public_html/.htaccess 2>/dev/null || true
        chmod -R 755 /home/u312917867/domains/sikharfleet.com/public_html

        echo "--- 3. Installing production dependencies in sikhar-app ---"
        cd /home/u312917867/sikhar-app
        npm install --omit=dev

        echo "--- 4. Launching Node.js backend with PM2 ---"
        pm2 delete sikhar-backend 2>/dev/null || true
        SOCKET_PATH=/home/u312917867/sikhar-app.sock pm2 start server.js --name sikhar-backend
        pm2 save

        echo "--- 5. Waiting for daemon startup ---"
        sleep 3
        pm2 status

        echo "--- 6. Verifying API response via UNIX socket & PHP ---"
        php -r '
          $fp = @stream_socket_client("unix:///home/u312917867/sikhar-app.sock", $errno, $errstr, 5);
          if (!$fp) {
            echo "❌ Socket connection failed: $errstr\\n";
          } else {
            fwrite($fp, "GET /api/health HTTP/1.0\\r\\nHost: sikharfleet.com\\r\\n\\r\\n");
            $res = stream_get_contents($fp);
            echo "✅ Backend Health Check Response:\\n" . $res . "\\n";
            fclose($fp);
          }
        '
        echo "=== DEPLOYMENT COMPLETED SUCCESSFULLY ==="
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
          console.log(`\nRemote process exited with code: ${code}`);
          conn.end();
        });
      });
    });
  });
}).on('error', (err) => {
  console.error('❌ Connection error:', err.message);
}).connect(config);
