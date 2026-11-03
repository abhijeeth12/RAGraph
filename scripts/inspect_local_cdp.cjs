const http = require('http');
const { spawn } = require('child_process');
const fs = require('fs');

async function main() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const chromeProc = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9226',
    '--window-size=1440,900',
    'http://localhost:3000/'
  ]);

  await new Promise(r => setTimeout(r, 2000));

  http.get('http://127.0.0.1:9226/json', (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', async () => {
      try {
        const pages = JSON.parse(data);
        const targetPage = pages.find(p => p.type === 'page' && p.url.includes('localhost')) || pages[0];
        console.log('Target URL:', targetPage.url);
        const wsUrl = targetPage.webSocketDebuggerUrl;

        const ws = new WebSocket(wsUrl);
        let id = 1;

        const send = (method, params = {}) => new Promise((resolve) => {
          const reqId = id++;
          const handler = (msg) => {
            const parsed = JSON.parse(msg.data);
            if (parsed.id === reqId) {
              ws.removeEventListener('message', handler);
              resolve(parsed.result);
            }
          };
          ws.addEventListener('message', handler);
          ws.send(JSON.stringify({ id: reqId, method, params }));
        });

        ws.onopen = async () => {
          await send('Page.enable');
          await send('Runtime.enable');

          await new Promise(r => setTimeout(r, 2500));

          const res = await send('Runtime.evaluate', {
            expression: `
              JSON.stringify(Array.from(document.querySelectorAll('header, section, footer')).map(el => {
                const r = el.getBoundingClientRect();
                return {
                  tag: el.tagName,
                  id: el.id,
                  top: Math.round(r.top + window.scrollY),
                  height: Math.round(r.height),
                  width: Math.round(r.width)
                };
              }))
            `
          });
          console.log('RENDERED SECTIONS:');
          const sections = JSON.parse(res.result.value);
          sections.forEach(s => console.log(`- ${s.tag}#${s.id || 'no-id'} (${s.width}x${s.height}) at Y=${s.top}`));

          // Capture a full page screenshot
          const layoutMetrics = await send('Page.getLayoutMetrics');
          const height = Math.ceil(layoutMetrics.contentSize.height);
          console.log('Total page content height:', height);

          // Take screenshots of each section
          await send('Emulation.setDeviceMetricsOverride', {
            width: 1440,
            height: height,
            deviceScaleFactor: 1,
            mobile: false
          });

          const ss = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true });
          fs.writeFileSync('scratch/local_fullpage_fixed.png', Buffer.from(ss.data, 'base64'));
          console.log('Saved scratch/local_fullpage_fixed.png, size:', fs.statSync('scratch/local_fullpage_fixed.png').size);

          ws.close();
          chromeProc.kill();
        };
      } catch (e) {
        console.error('Error:', e);
        chromeProc.kill();
      }
    });
  });
}

main();
