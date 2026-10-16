const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
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
];

function capture(screen) {
  return new Promise((resolve) => {
    const outFile = path.join(outDir, screen.name);
    const tempProfile = path.join(os.tmpdir(), `ch_${Date.now()}_${Math.floor(Math.random() * 10000)}`);
    
    const args = [
      '--headless=new',
      '--disable-gpu',
      '--no-sandbox',
      '--hide-scrollbars',
      `--user-data-dir=${tempProfile}`,
      `--window-size=${screen.width},${screen.height}`,
      `--screenshot=${outFile}`,
      screen.url
    ];

    const proc = spawn(chromePath, args);
    
    // Safety timer to kill after 4 seconds
    const timer = setTimeout(() => {
      try { proc.kill('SIGKILL'); } catch (_) {}
      console.log(`Finished ${screen.name}: exists=${fs.existsSync(outFile)}`);
      resolve();
    }, 3500);

    proc.on('exit', () => {
      clearTimeout(timer);
      console.log(`Exited ${screen.name}: exists=${fs.existsSync(outFile)}`);
      resolve();
    });

    proc.on('error', (err) => {
      clearTimeout(timer);
      console.error(`Error on ${screen.name}:`, err);
      resolve();
    });
  });
}

async function run() {
  for (const s of screens) {
    console.log(`Starting ${s.name}...`);
    await capture(s);
  }
  console.log('ALL_CAPTURES_DONE');
}

run();
