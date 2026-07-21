const pty = require('node-pty');

const os = require('os');
const shell = os.platform() === 'win32' ? 'powershell.exe' : 'bash';

const ptyProcess = pty.spawn(shell, [], {
  name: 'xterm-color',
  cols: 80,
  rows: 30,
  cwd: __dirname + '/../',
  env: process.env
});

ptyProcess.onData((data) => {
  process.stdout.write(data);
  if (data.includes('We need to reset the database') || data.includes('Are you sure you want create this migration?')) {
     ptyProcess.write('y\r');
  }
  if (data.includes('still contains')) {
     ptyProcess.write('y\r');
  }
});

ptyProcess.write('npx prisma migrate dev --name enforce_multitenancy --schema=src/prisma/schema.prisma\r');
setTimeout(() => { ptyProcess.write('exit\r'); }, 30000);
