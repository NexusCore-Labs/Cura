const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const candidates = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe'
];
const browserPath = candidates.find((p) => fs.existsSync(p)) || candidates[0];

const outDir = path.join(__dirname, '..', 'screenshots');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

const screens = [
  { name: '01-today-mobile.png', url: 'http://127.0.0.1:5173/#/app', width: 390, height: 844 },
  { name: '02-medicine-detail-mobile.png', url: 'http://127.0.0.1:5173/#/app/med/med-3', width: 390, height: 844 },
  { name: '03-review-schedule-mobile.png', url: 'http://127.0.0.1:5173/#/review', width: 390, height: 844 },
  { name: '04-camera-scanner-mobile.png', url: 'http://127.0.0.1:5173/#/scan', width: 390, height: 844 },
  { name: '05-confirmed-mobile.png', url: 'http://127.0.0.1:5173/#/confirmed?slot=dawn', width: 390, height: 844 },
  { name: '06-landing-desktop.png', url: 'http://127.0.0.1:5173/#/', width: 1440, height: 900 },
  { name: '07-two-pane-app-desktop.png', url: 'http://127.0.0.1:5173/#/app', width: 1440, height: 900 },
  { name: '08-contacts-mobile.png', url: 'http://127.0.0.1:5173/#/contacts', width: 390, height: 844 },
  { name: '09-settings-mobile.png', url: 'http://127.0.0.1:5173/#/settings', width: 390, height: 844 },
  { name: '10-history-mobile.png', url: 'http://127.0.0.1:5173/#/history', width: 390, height: 844 },
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function run() {
  const port = 9339;
  const tempProfile = path.join(os.tmpdir(), `cura_cdp_${Date.now()}`);

  const proc = spawn(browserPath, [
    '--headless=new',
    '--disable-gpu',
    '--no-sandbox',
    '--hide-scrollbars',
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${tempProfile}`,
    'about:blank'
  ]);

  let targets = null;
  for (let i = 0; i < 30; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/json/list`);
      const list = await res.json();
      targets = list.find((t) => t.type === 'page');
      if (targets && targets.webSocketDebuggerUrl) break;
    } catch (_) {}
    await sleep(200);
  }

  if (!targets || !targets.webSocketDebuggerUrl) {
    console.error('Failed to connect to headless browser CDP');
    try { proc.kill('SIGKILL'); } catch (_) {}
    process.exit(1);
  }

  const ws = new WebSocket(targets.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    ws.addEventListener('open', resolve);
    ws.addEventListener('error', reject);
  });

  let msgId = 1;
  const pending = new Map();
  ws.addEventListener('message', (event) => {
    const data = JSON.parse(event.data);
    if (data.id && pending.has(data.id)) {
      const { resolve, reject } = pending.get(data.id);
      pending.delete(data.id);
      if (data.error) reject(new Error(data.error.message));
      else resolve(data.result);
    }
  });

  const send = (method, params = {}) => {
    const id = msgId++;
    return new Promise((resolve, reject) => {
      pending.set(id, { resolve, reject });
      ws.send(JSON.stringify({ id, method, params }));
    });
  };

  await send('Page.enable');
  await send('Runtime.enable');

  for (const s of screens) {
    console.log(`Capturing ${s.name} (${s.width}x${s.height})...`);
    await send('Emulation.setDeviceMetricsOverride', {
      width: s.width,
      height: s.height,
      deviceScaleFactor: 1,
      mobile: s.width < 1024,
    });
    await send('Page.navigate', { url: s.url });
    await sleep(600);
    await send('Runtime.evaluate', {
      expression: 'document.fonts.ready.then(() => true)',
      awaitPromise: true,
    });
    await sleep(300);
    const shot = await send('Page.captureScreenshot', {
      format: 'png',
      fromSurface: true,
      clip: { x: 0, y: 0, width: s.width, height: s.height, scale: 1 },
    });
    const outFile = path.join(outDir, s.name);
    fs.writeFileSync(outFile, Buffer.from(shot.data, 'base64'));
    console.log(`Saved ${s.name}`);
  }

  ws.close();
  try { proc.kill('SIGKILL'); } catch (_) {}
  console.log('ALL_CAPTURES_DONE');
}

run();
