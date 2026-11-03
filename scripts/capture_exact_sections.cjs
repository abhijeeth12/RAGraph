const http = require('http');
const { spawn } = require('child_process');
const fs = require('fs');

async function main() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const chromeProc = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9227',
    '--window-size=1440,900',
    'http://localhost:3000/'
  ]);

  await new Promise(r => setTimeout(r, 2000));

  http.get('http://127.0.0.1:9227/json', (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', async () => {
      try {
        const pages = JSON.parse(data);
        const targetPage = pages.find(p => p.type === 'page' && p.url.includes('localhost')) || pages[0];
        const ws = new WebSocket(targetPage.webSocketDebuggerUrl);
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
          await new Promise(r => setTimeout(r, 2000));

          const ids = ['specification', 'metrics', 'start', 'showcases', 'reviews', 'services', 'stack', 'closer'];
          for (const secId of ids) {
            const rectRes = await send('Runtime.evaluate', {
              expression: `
                (() => {
                  const el = document.getElementById('${secId}');
                  if (!el) return null;
                  const r = el.getBoundingClientRect();
                  return { x: r.left, y: r.top + window.scrollY, width: r.width, height: r.height };
                })()
              `,
              returnByValue: true
            });

            const rect = rectRes.result.value;
            if (rect && rect.height > 0) {
              const clip = {
                x: Math.round(rect.x),
                y: Math.round(rect.y),
                width: Math.round(rect.width),
                height: Math.round(rect.height),
                scale: 1
              };
              const ss = await send('Page.captureScreenshot', {
                format: 'png',
                clip,
                captureBeyondViewport: true
              });
              fs.writeFileSync(`scratch/sections_crops/${secId}.png`, Buffer.from(ss.data, 'base64'));
              console.log(`Captured ${secId}:`, clip);
            }
          }

          ws.close();
          chromeProc.kill();
        };
      } catch (e) {
        console.error(e);
        chromeProc.kill();
      }
    });
  });
}

main();

