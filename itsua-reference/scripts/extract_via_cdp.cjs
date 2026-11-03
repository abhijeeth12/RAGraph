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

async function getPageSession(targetWsUrl) {
  const ws = new WebSocket(targetWsUrl);
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

  await new Promise((resolve, reject) => {
    ws.onopen = resolve;
    ws.onerror = reject;
  });

  function send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const msgId = id++;
      pending.set(msgId, { resolve, reject });
      ws.send(JSON.stringify({ id: msgId, method, params }));
    });
  }

  return { ws, send };
}

async function run() {
  console.log("Launching Chrome headless with remote debugging on port " + PORT + "...");
  const chrome = spawn(CHROME_PATH, [
    '--headless=new',
    `--remote-debugging-port=${PORT}`,
    '--window-size=1440,900',
    '--disable-gpu',
    '--no-sandbox',
    'https://itsua.com/'
  ]);

  let browserWsUrl = null;
  for (let i = 0; i < 30; i++) {
    await new Promise(r => setTimeout(r, 500));
    try {
      browserWsUrl = await getDebuggerUrl();
      if (browserWsUrl) break;
    } catch (e) {}
  }

  if (!browserWsUrl) {
    console.error("Failed to connect to Chrome CDP");
    chrome.kill();
    process.exit(1);
  }
  console.log("Chrome connected! Browser WS:", browserWsUrl);

  // Get pages from /json/list
  await new Promise(r => setTimeout(r, 4000));
  const pagesList = await new Promise((resolve, reject) => {
    http.get(`http://127.0.0.1:${PORT}/json/list`, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(JSON.parse(data)));
    }).on('error', reject);
  });

  const page = pagesList.find(p => p.type === 'page');
  if (!page) {
    console.error("No page target found");
    chrome.kill();
    process.exit(1);
  }
  console.log("Found page target:", page.title, page.url, page.webSocketDebuggerUrl);

  const { ws, send } = await getPageSession(page.webSocketDebuggerUrl);

  // Enable necessary domains
  await send('Page.enable');
  await send('DOM.enable');
  await send('CSS.enable');
  await send('Runtime.enable');

  console.log("Waiting for page load and font hydration...");
  await new Promise(r => setTimeout(r, 4000));

  // Helper to evaluate in page
  async function evaluate(fnStr) {
    const res = await send('Runtime.evaluate', {
      expression: `(${fnStr})()`,
      returnByValue: true,
      awaitPromise: true
    });
    if (res.exceptionDetails) {
      throw new Error(JSON.stringify(res.exceptionDetails));
    }
    return res.result.value;
  }

  console.log("Extracting Desktop measurements (1440x900)...");
  const desktopData = await evaluate(`function() {
    function getCleanStyles(el) {
      const cs = window.getComputedStyle(el);
      const r = el.getBoundingClientRect();
      return {
        rect: {
          x: Math.round(r.x),
          y: Math.round(r.y),
          width: Math.round(r.width * 10) / 10,
          height: Math.round(r.height * 10) / 10,
          top: Math.round(r.top),
          bottom: Math.round(r.bottom),
          left: Math.round(r.left),
          right: Math.round(r.right)
        },
        display: cs.display,
        position: cs.position,
        zIndex: cs.zIndex,
        flexDirection: cs.flexDirection,
        gridTemplateColumns: cs.gridTemplateColumns,
        gap: cs.gap,
        padding: \`\${cs.paddingTop} \${cs.paddingRight} \${cs.paddingBottom} \${cs.paddingLeft}\`,
        margin: \`\${cs.marginTop} \${cs.marginRight} \${cs.marginBottom} \${cs.marginLeft}\`,
        backgroundColor: cs.backgroundColor,
        color: cs.color,
        fontFamily: cs.fontFamily,
        fontSize: cs.fontSize,
        fontWeight: cs.fontWeight,
        lineHeight: cs.lineHeight,
        letterSpacing: cs.letterSpacing,
        textTransform: cs.textTransform,
        borderRadius: cs.borderRadius,
        borderWidth: \`\${cs.borderTopWidth} \${cs.borderRightWidth} \${cs.borderBottomWidth} \${cs.borderLeftWidth}\`,
        borderColor: cs.borderTopColor,
        borderStyle: cs.borderTopStyle,
        boxShadow: cs.boxShadow,
        backdropFilter: cs.backdropFilter,
        opacity: cs.opacity,
        transform: cs.transform
      };
    }

    // 1. Sections Inventory
    const sections = [];
    const containerCandidates = document.querySelectorAll('header, footer, main > div, main > section, [id="hero-root"], [id="featured-section"], [id="reviews"], [id="services"], [id="stack"], [id="popup-side"]');
    containerCandidates.forEach((el, idx) => {
      sections.push({
        index: idx,
        tag: el.tagName.toLowerCase(),
        id: el.id || null,
        className: el.className || null,
        dataAttributes: Object.fromEntries(Object.entries(el.dataset)),
        styles: getCleanStyles(el)
      });
    });

    // 2. Specific Key Components
    const components = {};

    // Header & Nav
    const header = document.querySelector('header');
    if (header) {
      const navLinks = Array.from(header.querySelectorAll('a, button')).map(a => ({
        tag: a.tagName.toLowerCase(),
        text: a.innerText.trim(),
        href: a.getAttribute('href') || null,
        className: a.className,
        styles: getCleanStyles(a)
      }));
      components.header = {
        styles: getCleanStyles(header),
        navScroll: document.getElementById('nav-scroll') ? getCleanStyles(document.getElementById('nav-scroll')) : null,
        navScrollbar: document.getElementById('nav-scrollbar') ? getCleanStyles(document.getElementById('nav-scrollbar')) : null,
        navScrollbarThumb: document.getElementById('nav-scrollbar-thumb') ? getCleanStyles(document.getElementById('nav-scrollbar-thumb')) : null,
        links: navLinks
      };
    }

    // Hero Section
    const hero = document.getElementById('hero-root');
    if (hero) {
      const heroLines = Array.from(hero.querySelectorAll('.hero-line')).map((l, i) => ({
        index: i,
        text: l.innerText.trim(),
        className: l.className,
        styles: getCleanStyles(l)
      }));
      const subheadings = Array.from(hero.querySelectorAll('p, span, h1, h2')).map(el => ({
        tag: el.tagName.toLowerCase(),
        text: el.innerText.trim(),
        className: el.className,
        styles: getCleanStyles(el)
      })).filter(x => x.text && x.text.length < 200);
      components.hero = {
        container: getCleanStyles(hero),
        linesContainer: document.getElementById('hero-lines') ? getCleanStyles(document.getElementById('hero-lines')) : null,
        heroLines,
        subheadings
      };
    }

    // Featured Deck
    const featuredSec = document.getElementById('featured-section');
    if (featuredSec) {
      const cards = Array.from(featuredSec.querySelectorAll('.deck-card')).map((card, i) => {
        const titleEl = card.querySelector('h3, h2, h4, .card-title, strong');
        const descEl = card.querySelector('p');
        const badgeEls = Array.from(card.querySelectorAll('[class*="badge"], [class*="tag"], span')).map(b => b.innerText.trim()).filter(Boolean);
        const img = card.querySelector('img');
        const cta = card.querySelector('.deck-cta, a, button');
        return {
          index: i,
          className: card.className,
          title: titleEl ? titleEl.innerText.trim() : null,
          description: descEl ? descEl.innerText.trim() : null,
          badges: badgeEls,
          image: img ? { src: img.src, alt: img.alt, styles: getCleanStyles(img) } : null,
          cta: cta ? { text: cta.innerText.trim(), href: cta.getAttribute('href') } : null,
          styles: getCleanStyles(card)
        };
      });
      components.featuredDeck = {
        container: getCleanStyles(featuredSec),
        deck: document.getElementById('featured-deck') ? getCleanStyles(document.getElementById('featured-deck')) : null,
        cards
      };
    }

    // Reviews Carousel
    const reviewsSec = document.getElementById('reviews');
    if (reviewsSec) {
      const reviewCards = Array.from(reviewsSec.querySelectorAll('.review-deck, [class*="review"]')).filter(el => el.classList.contains('review-deck') || el.closest('#review-track') === el.parentElement).map((rc, i) => {
        return {
          index: i,
          className: rc.className,
          text: rc.innerText.trim(),
          styles: getCleanStyles(rc)
        };
      });
      components.reviews = {
        container: getCleanStyles(reviewsSec),
        track: document.getElementById('review-track') ? getCleanStyles(document.getElementById('review-track')) : null,
        prevBtn: document.getElementById('review-prev') ? getCleanStyles(document.getElementById('review-prev')) : null,
        nextBtn: document.getElementById('review-next') ? getCleanStyles(document.getElementById('review-next')) : null,
        indexIndicator: document.getElementById('review-index') ? getCleanStyles(document.getElementById('review-index')) : null,
        cards: reviewCards
      };
    }

    // Services (Door Table)
    const servicesSec = document.getElementById('services');
    if (servicesSec) {
      const table = servicesSec.querySelector('.door-table');
      const rows = Array.from(servicesSec.querySelectorAll('.door-row')).map((row, i) => {
        const cells = Array.from(row.children).map((cell, ci) => ({
          colIndex: ci,
          className: cell.className,
          text: cell.innerText.trim(),
          styles: getCleanStyles(cell)
        }));
        return {
          rowIndex: i,
          className: row.className,
          styles: getCleanStyles(row),
          cells
        };
      });
      components.services = {
        container: getCleanStyles(servicesSec),
        table: table ? getCleanStyles(table) : null,
        rows
      };
    }

    // Tech Stack
    const stackSec = document.getElementById('stack');
    if (stackSec) {
      const cells = Array.from(stackSec.querySelectorAll('.stack-cell')).map((sc, i) => {
        const dots = Array.from(sc.querySelectorAll('.stack-dot')).map(d => getCleanStyles(d));
        return {
          index: i,
          className: sc.className,
          text: sc.innerText.trim(),
          styles: getCleanStyles(sc),
          dots
        };
      });
      components.stack = {
        container: getCleanStyles(stackSec),
        cells
      };
    }

    // Popups
    const popupSide = document.getElementById('popup-side');
    const popupRoot = document.getElementById('popup-root');
    components.popups = {
      popupSide: popupSide ? {
        styles: getCleanStyles(popupSide),
        tabs: Array.from(popupSide.querySelectorAll('.popup-tab')).map(t => ({
          text: t.innerText.trim(),
          trigger: t.getAttribute('data-popup-trigger'),
          styles: getCleanStyles(t)
        }))
      } : null,
      panels: Array.from(document.querySelectorAll('.popup-panel')).map(p => ({
        id: p.id,
        className: p.className,
        title: p.querySelector('h1, h2, h3, [id*="title"]')?.innerText.trim() || null,
        text: p.innerText.trim().slice(0, 300)
      }))
    };

    // Footer
    const footer = document.querySelector('footer');
    if (footer) {
      components.footer = {
        styles: getCleanStyles(footer),
        links: Array.from(footer.querySelectorAll('a')).map(a => ({
          text: a.innerText.trim(),
          href: a.getAttribute('href'),
          styles: getCleanStyles(a)
        }))
      };
    }

    // 3. Design Tokens Aggregation
    const colors = new Set();
    const bgColors = new Set();
    const fontFamilies = new Set();
    const fontSizes = new Set();
    const fontWeights = new Set();
    const borderRadii = new Set();
    const gaps = new Set();

    document.querySelectorAll('*').forEach(el => {
      const cs = window.getComputedStyle(el);
      if (cs.color) colors.add(cs.color);
      if (cs.backgroundColor && cs.backgroundColor !== 'rgba(0, 0, 0, 0)') bgColors.add(cs.backgroundColor);
      if (cs.fontFamily) fontFamilies.add(cs.fontFamily);
      if (cs.fontSize) fontSizes.add(cs.fontSize);
      if (cs.fontWeight) fontWeights.add(cs.fontWeight);
      if (cs.borderRadius && cs.borderRadius !== '0px') borderRadii.add(cs.borderRadius);
      if (cs.gap && cs.gap !== 'normal') gaps.add(cs.gap);
    });

    // 4. Asset Manifest
    const images = Array.from(document.querySelectorAll('img')).map(img => ({
      src: img.src,
      currentSrc: img.currentSrc,
      alt: img.alt,
      width: img.width,
      height: img.height,
      naturalWidth: img.naturalWidth,
      naturalHeight: img.naturalHeight,
      loading: img.loading,
      className: img.className
    }));

    const svgs = Array.from(document.querySelectorAll('svg')).map(svg => ({
      width: svg.getAttribute('width') || svg.getBoundingClientRect().width,
      height: svg.getAttribute('height') || svg.getBoundingClientRect().height,
      viewBox: svg.getAttribute('viewBox'),
      className: svg.getAttribute('class'),
      pathsCount: svg.querySelectorAll('path').length
    }));

    return {
      viewport: { width: 1440, height: 900 },
      sections,
      components,
      tokens: {
        colors: Array.from(colors),
        bgColors: Array.from(bgColors),
        fontFamilies: Array.from(fontFamilies),
        fontSizes: Array.from(fontSizes).sort((a,b) => parseFloat(a) - parseFloat(b)),
        fontWeights: Array.from(fontWeights).sort((a,b) => parseInt(a) - parseInt(b)),
        borderRadii: Array.from(borderRadii),
        gaps: Array.from(gaps)
      },
      assets: {
        images,
        svgs
      }
    };
  }`);

  // Now resize to mobile viewport (390x844)
  console.log("Emulating Mobile Viewport (390x844)...");
  await send('Emulation.setDeviceMetricsOverride', {
    width: 390,
    height: 844,
    deviceScaleFactor: 3,
    mobile: true
  });
  await send('Emulation.setTouchEmulationEnabled', { enabled: true });
  await new Promise(r => setTimeout(r, 2000));

  console.log("Extracting Mobile measurements (390x844)...");
  const mobileData = await evaluate(`function() {
    function getCleanStyles(el) {
      const cs = window.getComputedStyle(el);
      const r = el.getBoundingClientRect();
      return {
        rect: {
          x: Math.round(r.x),
          y: Math.round(r.y),
          width: Math.round(r.width * 10) / 10,
          height: Math.round(r.height * 10) / 10,
          top: Math.round(r.top),
          bottom: Math.round(r.bottom)
        },
        display: cs.display,
        position: cs.position,
        gridTemplateColumns: cs.gridTemplateColumns,
        gap: cs.gap,
        padding: \`\${cs.paddingTop} \${cs.paddingRight} \${cs.paddingBottom} \${cs.paddingLeft}\`,
        fontSize: cs.fontSize,
        lineHeight: cs.lineHeight
      };
    }

    const sections = [];
    const containerCandidates = document.querySelectorAll('header, footer, [id="hero-root"], [id="featured-section"], [id="reviews"], [id="services"], [id="stack"], [id="popup-side"]');
    containerCandidates.forEach((el, idx) => {
      sections.push({
        index: idx,
        tag: el.tagName.toLowerCase(),
        id: el.id || null,
        className: el.className || null,
        styles: getCleanStyles(el)
      });
    });

    return {
      viewport: { width: 390, height: 844 },
      sections,
      header: document.querySelector('header') ? getCleanStyles(document.querySelector('header')) : null,
      hero: document.getElementById('hero-root') ? getCleanStyles(document.getElementById('hero-root')) : null,
      featuredSection: document.getElementById('featured-section') ? getCleanStyles(document.getElementById('featured-section')) : null,
      featuredDeck: document.getElementById('featured-deck') ? getCleanStyles(document.getElementById('featured-deck')) : null,
      reviews: document.getElementById('reviews') ? getCleanStyles(document.getElementById('reviews')) : null,
      services: document.getElementById('services') ? getCleanStyles(document.getElementById('services')) : null,
      stack: document.getElementById('stack') ? getCleanStyles(document.getElementById('stack')) : null,
      popupSide: document.getElementById('popup-side') ? getCleanStyles(document.getElementById('popup-side')) : null,
      footer: document.querySelector('footer') ? getCleanStyles(document.querySelector('footer')) : null
    };
  }`);

  fs.mkdirSync('itsua-reference/evidence/inspection-results', { recursive: true });
  fs.mkdirSync('itsua-reference/measurements', { recursive: true });

  fs.writeFileSync('itsua-reference/evidence/inspection-results/desktop-dna.json', JSON.stringify(desktopData, null, 2));
  fs.writeFileSync('itsua-reference/evidence/inspection-results/mobile-dna.json', JSON.stringify(mobileData, null, 2));

  console.log("SUCCESS! Saved desktop-dna.json and mobile-dna.json");
  chrome.kill();
  process.exit(0);
}

run().catch(err => {
  console.error("Fatal error:", err);
  process.exit(1);
});

