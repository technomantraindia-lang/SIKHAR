import { Client } from 'ssh2';

const config = {
  host: '147.93.101.51',
  port: 65002,
  username: 'u312917867',
  password: 'Sikhar@123#',
  readyTimeout: 30000
};

const cmd = process.argv.slice(2).join(' ') || 'whoami';

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
