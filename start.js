const { spawn } = require('child_process');
const path = require('path');

console.log(`
==========================================================
🚀 Launching Unified HireHub AI & Resume Screener Platform
==========================================================
`);

const isWin = process.platform === 'win32';
const npmCmd = isWin ? 'npm.cmd' : 'npm';
const npxCmd = isWin ? 'npx.cmd' : 'npx';

// 1. Start Backend
const backendDir = path.join(__dirname, 'Backend');
console.log('📡 Starting Backend API Server (Port 8000)...');
const backend = spawn(npmCmd, ['run', 'start'], {
  cwd: backendDir,
  stdio: 'inherit',
  shell: true,
  env: { ...process.env }
});

backend.on('error', (err) => {
  console.error('[Backend Error]', err.message);
});

// 2. Start Frontend
const frontendDir = path.join(__dirname, 'Frontend');
console.log('🌐 Starting Frontend Vite Server (Port 5173)...');
const frontend = spawn(npxCmd, ['vite'], {
  cwd: frontendDir,
  stdio: 'inherit',
  shell: true,
  env: { ...process.env }
});

frontend.on('error', (err) => {
  console.error('[Frontend Error]', err.message);
});

// Clean termination handling
const cleanup = () => {
  console.log('\n🛑 Shutting down servers gracefully...');
  try { backend.kill(); } catch (e) {}
  try { frontend.kill(); } catch (e) {}
  process.exit(0);
};

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
