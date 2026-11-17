import { Client } from 'ssh2';

const config = {
  host: '145.79.212.232',
  port: 65002,
  username: 'u212890862',
  password: 'Rashmi@saha1988',
  readyTimeout: 30000
};

const cmd = process.argv.slice(2).join(' ') || 'pwd; ls -la; pm2 status';

const conn = new Client();
conn.on('ready', () => {
  conn.exec(cmd, (err, stream) => {
    if (err) {
      console.error(err);
      conn.end();
      return;
    }
    stream.on('data', d => process.stdout.write(d.toString()));
    stream.stderr.on('data', d => process.stderr.write(d.toString()));
    stream.on('close', () => conn.end());
  });
}).connect(config);
