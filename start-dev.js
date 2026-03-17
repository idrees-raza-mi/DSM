/**
 * FleetFlow Dev Setup Script
 * Run with: node start-dev.js
 *
 * Automatically detects your current LAN IP, updates app.json,
 * kills any process on port 4000, and prints start instructions.
 */

const os = require('os');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// ── 1. Detect best LAN IP ────────────────────────────────────────────────────
function getLanIp() {
  const ifaces = os.networkInterfaces();
  const candidates = [];

  for (const [name, addrs] of Object.entries(ifaces)) {
    for (const addr of addrs) {
      if (addr.family !== 'IPv4' || addr.internal) continue;
      // Skip common virtual/hotspot adapters
      const skip = ['loopback', 'vmware', 'vethernet', 'virtualbox', 'hyper-v'];
      if (skip.some((s) => name.toLowerCase().includes(s))) continue;
      // Prefer 192.168.x.x WiFi ranges, deprioritise hotspot (192.168.137.x)
      const priority = addr.address.startsWith('192.168.137.') ? 1 : 0;
      candidates.push({ ip: addr.address, name, priority });
    }
  }

  if (candidates.length === 0) return 'localhost';
  candidates.sort((a, b) => a.priority - b.priority);
  return candidates[0].ip;
}

const ip = getLanIp();
console.log(`\n✔  Detected LAN IP : ${ip}`);

// ── 2. Update driver-mobile-app/app.json ────────────────────────────────────
const appJsonPath = path.join(__dirname, 'driver-mobile-app', 'app.json');
const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf-8'));
const oldUrl = appJson.expo.extra.apiUrl;
appJson.expo.extra.apiUrl = `http://${ip}:4000`;
fs.writeFileSync(appJsonPath, JSON.stringify(appJson, null, 2) + '\n');
console.log(`✔  app.json updated : ${oldUrl} → http://${ip}:4000`);

// ── 3. Kill any process already on port 4000 ────────────────────────────────
try {
  const result = execSync('netstat -ano | findstr :4000', { encoding: 'utf-8', shell: 'cmd.exe' });
  const pids = [...new Set(
    result.trim().split('\n')
      .map((line) => line.trim().split(/\s+/).pop())
      .filter((pid) => pid && pid !== '0')
  )];
  for (const pid of pids) {
    try {
      execSync(`taskkill /F /PID ${pid}`, { shell: 'cmd.exe', stdio: 'ignore' });
      console.log(`✔  Killed PID ${pid} on port 4000`);
    } catch (_) {}
  }
} catch (_) {
  console.log('✔  Port 4000 is free');
}

// ── 4. Print instructions ────────────────────────────────────────────────────
console.log(`
─────────────────────────────────────────────
  Setup complete! Now run in two terminals:

  Terminal 1 — Backend:
    cd backend
    npm run dev

  Terminal 2 — Mobile app:
    cd driver-mobile-app
    npx expo start --clear

  Make sure your phone is on the same WiFi
  as this machine (${ip}).
─────────────────────────────────────────────
`);
