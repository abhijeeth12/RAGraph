const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const PORT = 9222;

async function getDebuggerUrl() {
  return new Promise((resolve, reject) => {
    const req = http.get(`http://127.0.0.1:${PORT}/json/version`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve(json.webSocketDebuggerUrl);
        } catch (e) {
          reject(e);
        }
      });
    });
    req.on('error', reject);
  });
}

async function run() {
  console.log("Launching Chrome...");
  const chrome = spawn(CHROME_PATH, [
    '--headless=new',
    `--remote-debugging-port=${PORT}`,
    '--window-size=1440,900',
    '--disable-gpu',
    '--no-sandbox',
    'about:blank'
  ]);

  // Wait for port to be ready
  let wsUrl = null;
  for (let i = 0; i < 20; i++) {
    await new Promise(r => setTimeout(r, 500));
    try {
      wsUrl = await getDebuggerUrl();
      if (wsUrl) break;
    } catch (e) {}
  }

  if (!wsUrl) {
    console.error("Failed to connect to Chrome CDP");
    chrome.kill();
    process.exit(1);
  }

  console.log("Connected to Chrome:", wsUrl);

  const ws = new WebSocket(wsUrl);
  let id = 1;
  const pending = new Map();

  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      if (msg.error) reject(msg.error);
      else resolve(msg.result);
    }
  };

  await new Promise(resolve => ws.onopen = resolve);

  function send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const msgId = id++;
      pending.set(msgId, { resolve, reject });
      ws.send(JSON.stringify({ id: msgId, method, params }));
    });
  }

  // Create new target / page
  const { targetId } = await send('Target.createTarget', { url: 'https://itsua.com/' });
  console.log("Target created:", targetId);

  // Attach to target
  const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true });
  console.log("Attached session:", sessionId);

  function sendSession(method, params = {}) {
    return send('Target.sendMessageToTarget', {
      sessionId,
      message: JSON.stringify({ id: id++, method, params })
    });
  }

  // Wait for page to load
  console.log("Waiting 6 seconds for page to settle and hydrate...");
  await new Promise(r => setTimeout(r, 6000));

  console.log("Chrome inspection test successful!");
  chrome.kill();
  process.exit(0);
}

run().catch(err => {
  console.error("Error:", err);
  process.exit(1);
});

