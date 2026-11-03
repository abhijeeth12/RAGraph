const http = require('http');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

async function main() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const port = 9228;
  const chromeProc = spawn(chromePath, [
    '--headless=new',
    `--remote-debugging-port=${port}`,
    '--window-size=1440,900',
    'http://localhost:3000/'
  ]);

  await new Promise(r => setTimeout(r, 2500));

  http.get(`http://127.0.0.1:${port}/json`, (res) => {
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
          await send('DOM.enable');
          await new Promise(r => setTimeout(r, 2000));

          console.log('\n--- VERIFYING AUDIT REQUIREMENTS ---');

          // 1. Verify "Try Interactive Demo" button proportions
          const btnEval = await send('Runtime.evaluate', {
            expression: `
              (() => {
                const btn = document.querySelector('button[type="button"] span.bg-\\[\\#2F4CFF\\]')?.parentElement;
                if (!btn) return { found: false };
                const blueBox = btn.children[0]?.getBoundingClientRect();
                const blackBox = btn.children[1]?.getBoundingClientRect();
                const btnRect = btn.getBoundingClientRect();
                return {
                  found: true,
                  btnHeight: btnRect.height,
                  blueWidth: blueBox?.width,
                  blueHeight: blueBox?.height,
                  blackHeight: blackBox?.height,
                  blackText: btn.children[1]?.innerText?.trim(),
                  equalHeight: Math.abs((blueBox?.height || 0) - (blackBox?.height || 0)) < 1
                };
              })()
            `,
            returnByValue: true
          });
          console.log('1. Button Evaluation:', JSON.stringify(btnEval.result.value, null, 2));

          // 2. Verify Hero Viewport Fit
          const heroEval = await send('Runtime.evaluate', {
            expression: `
              (() => {
                const hero = document.getElementById('specification');
                const header = document.querySelector('header');
                const metrics = document.getElementById('metrics');
                return {
                  viewportHeight: window.innerHeight,
                  headerHeight: header?.getBoundingClientRect().height,
                  heroHeight: hero?.getBoundingClientRect().height,
                  metricsTop: metrics?.getBoundingClientRect().top
                };
              })()
            `,
            returnByValue: true
          });
          console.log('2. Hero Fit Evaluation:', JSON.stringify(heroEval.result.value, null, 2));

          // 3. Verify Metric Card Pastel Fills and Text Colors
          const metricsEval = await send('Runtime.evaluate', {
            expression: `
              (() => {
                const cards = Array.from(document.querySelectorAll('#metrics .grid > div'));
                return cards.map(c => {
                  const style = window.getComputedStyle(c);
                  const val = c.querySelector('.font-display');
                  const valStyle = val ? window.getComputedStyle(val) : null;
                  return {
                    label: c.querySelector('.font-mono')?.innerText?.trim(),
                    value: val?.innerText?.trim(),
                    bg: style.backgroundColor,
                    textColor: valStyle ? valStyle.color : null
                  };
                });
              })()
            `,
            returnByValue: true
          });
          console.log('3. Metric Cards Evaluation:', JSON.stringify(metricsEval.result.value, null, 2));

          // 4. Verify /start Table Door Wash
          const startEval = await send('Runtime.evaluate', {
            expression: `
              (() => {
                const table = document.querySelector('.door-table');
                const rows = Array.from(document.querySelectorAll('.door-row'));
                const washes = Array.from(document.querySelectorAll('.door-wash'));
                return {
                  tableExists: !!table,
                  rowCount: rows.length,
                  doorWashCellCount: washes.length,
                  firstRowWash: rows[0]?.style.getPropertyValue('--wash')
                };
              })()
            `,
            returnByValue: true
          });
          console.log('4. /start Door Wash Evaluation:', JSON.stringify(startEval.result.value, null, 2));

          // 5. Verify Repository Rebrand to "Study Space"
          const brandEval = await send('Runtime.evaluate', {
            expression: `
              (() => {
                const title = document.title;
                const headerBrand = document.querySelector('header span')?.innerText;
                const footerBrand = document.querySelector('footer span')?.innerText;
                const hasRAGraph = document.body.innerText.includes('RA-GRAPH');
                return {
                  docTitle: title,
                  headerBrand,
                  footerBrand,
                  hasRAGraphText: hasRAGraph
                };
              })()
            `,
            returnByValue: true
          });
          console.log('5. Brand Evaluation:', JSON.stringify(brandEval.result.value, null, 2));

          // 6. Verify Review Section Horizontal Slide
          const reviewsEval = await send('Runtime.evaluate', {
            expression: `
              (() => {
                const track = document.querySelector('.review-slide .flex');
                const slides = Array.from(document.querySelectorAll('.review-slide .shrink-0'));
                return {
                  trackExists: !!track,
                  slideCount: slides.length,
                  trackTransform: track?.style.transform,
                  initialOpacity: slides[0] ? window.getComputedStyle(slides[0]).opacity : null
                };
              })()
            `,
            returnByValue: true
          });
          console.log('6. Reviews Slide Evaluation (Initial):', JSON.stringify(reviewsEval.result.value, null, 2));

          // Click Next Review Button
          await send('Runtime.evaluate', {
            expression: `
              (() => {
                const nextBtn = document.querySelector('button[title*="Next Review"]');
                if (nextBtn) nextBtn.click();
              })()
            `
          });
          await new Promise(r => setTimeout(r, 600));

          const reviewsSlideEval = await send('Runtime.evaluate', {
            expression: `
              (() => {
                const track = document.querySelector('.review-slide .flex');
                const slides = Array.from(document.querySelectorAll('.review-slide .shrink-0'));
                return {
                  trackTransformAfterNext: track?.style.transform,
                  slide1Opacity: slides[1] ? window.getComputedStyle(slides[1]).opacity : null
                };
              })()
            `,
            returnByValue: true
          });
          console.log('6b. Reviews Slide Evaluation (After Next):', JSON.stringify(reviewsSlideEval.result.value, null, 2));

          // Capture Screenshots at Key Viewports
          const viewports = [
            { name: 'desktop_1440x900', width: 1440, height: 900 },
            { name: 'laptop_1366x768', width: 1366, height: 768 },
            { name: 'tablet_768x1024', width: 768, height: 1024 },
            { name: 'mobile_390x844', width: 390, height: 844 }
          ];

          for (const vp of viewports) {
            await send('Emulation.setDeviceMetricsOverride', {
              width: vp.width,
              height: vp.height,
              deviceScaleFactor: 1,
              mobile: vp.width < 600
            });
            await new Promise(r => setTimeout(r, 500));

            // Viewport screenshot
            const ss = await send('Page.captureScreenshot', { format: 'png' });
            const filePath = path.join(__dirname, `../scratch/verified_${vp.name}.png`);
            fs.writeFileSync(filePath, Buffer.from(ss.data, 'base64'));
            console.log(`Saved screenshot: ${filePath}`);
          }

          // Reset to 1440x900 and capture focused sections
          await send('Emulation.setDeviceMetricsOverride', {
            width: 1440,
            height: 900,
            deviceScaleFactor: 1,
            mobile: false
          });
          await new Promise(r => setTimeout(r, 500));

          // Capture Hero & Button crop
          const heroRectRes = await send('Runtime.evaluate', {
            expression: `
              (() => {
                const hero = document.getElementById('specification');
                const r = hero.getBoundingClientRect();
                return { x: r.left, y: r.top + window.scrollY, width: r.width, height: r.height };
              })()
            `,
            returnByValue: true
          });
          if (heroRectRes.result.value) {
            const r = heroRectRes.result.value;
            const heroSS = await send('Page.captureScreenshot', {
              format: 'png',
              clip: { x: r.x, y: r.y, width: r.width, height: Math.min(r.height, 900), scale: 1 }
            });
            fs.writeFileSync(path.join(__dirname, '../scratch/verified_hero_button.png'), Buffer.from(heroSS.data, 'base64'));
          }

          // Capture Metrics crop
          const metricsRectRes = await send('Runtime.evaluate', {
            expression: `
              (() => {
                const m = document.getElementById('metrics');
                const r = m.getBoundingClientRect();
                return { x: r.left, y: r.top + window.scrollY, width: r.width, height: r.height };
              })()
            `,
            returnByValue: true
          });
          if (metricsRectRes.result.value) {
            const r = metricsRectRes.result.value;
            const metricsSS = await send('Page.captureScreenshot', {
              format: 'png',
              clip: { x: r.x, y: r.y, width: r.width, height: r.height, scale: 1 }
            });
            fs.writeFileSync(path.join(__dirname, '../scratch/verified_metrics_colors.png'), Buffer.from(metricsSS.data, 'base64'));
          }

          console.log('\n--- VERIFICATION COMPLETE ---');
          ws.close();
          chromeProc.kill();
          process.exit(0);
        };
      } catch (err) {
        console.error('CDP Error:', err);
        chromeProc.kill();
        process.exit(1);
      }
    });
  });
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
