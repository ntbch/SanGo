/**
 * QA viewport smoke — chạy Chrome headless qua CDP (WebSocket native của Node 22).
 * Với mỗi cặp (viewport, theme):
 *   - set localStorage sango-theme TRƯỚC khi load (chống FOUC path thật)
 *   - đợi app render + API trả dữ liệu
 *   - thu thập console messages (error/warning)
 *   - đo horizontal overflow (scrollWidth > clientWidth)
 *   - chụp screenshot
 * Usage: node qa/viewport-smoke.mjs [baseUrl] [outDir]
 */
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const BASE = process.argv[2] ?? 'http://localhost:5173/';
const OUT = resolve(process.argv[3] ?? 'qa/screenshots');
mkdirSync(OUT, { recursive: true });

const VIEWPORTS = [
  { name: 'mobile-375', width: 375, height: 812, dpr: 3 },
  { name: 'tablet-768', width: 768, height: 1024, dpr: 2 },
  { name: 'desktop-1280', width: 1280, height: 800, dpr: 1 },
];
const THEMES = ['light', 'dark'];

const chrome = spawn(
  'google-chrome',
  [
    '--headless=new',
    '--remote-debugging-port=9222',
    '--user-data-dir=/tmp/chrome-qa-profile',
    '--no-sandbox',
    '--disable-gpu',
    '--disable-dev-shm-usage',
    '--hide-scrollbars',
    'about:blank',
  ],
  { stdio: 'ignore' },
);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function connect() {
  for (let i = 0; i < 60; i++) {
    try {
      const res = await fetch('http://127.0.0.1:9222/json/version');
      if (res.ok) break;
    } catch {}
    await sleep(250);
  }
  const list = await (await fetch('http://127.0.0.1:9222/json/list')).json();
  const page = list.find((t) => t.type === 'page');
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((res, rej) => {
    ws.onopen = res;
    ws.onerror = rej;
  });
  let id = 0;
  const pending = new Map();
  ws.onmessage = (ev) => {
    const msg = JSON.parse(ev.data);
    if (msg.id && pending.has(msg.id)) {
      pending.get(msg.id)(msg);
      pending.delete(msg.id);
    }
  };
  const send = (method, params = {}) =>
    new Promise((res) => {
      const mid = ++id;
      pending.set(mid, res);
      ws.send(JSON.stringify({ id: mid, method, params }));
    });
  return { ws, send };
}

const { ws, send } = await connect();
await send('Page.enable');
await send('Runtime.enable');
await send('Log.enable');
await send('Network.enable');

const results = [];
for (const vp of VIEWPORTS) {
  for (const theme of THEMES) {
    const tag = vp.name + '-' + theme;
    const consoleMsgs = [];
    const onConsole = (ev) => {
      const { type, args } = ev.params;
      const text = (args || []).map((a) => a.value ?? a.description ?? '').join(' ');
      if (text) consoleMsgs.push(type + ': ' + text);
    };
    const onLog = (ev) => {
      const { entry } = ev.params;
      if (entry.level === 'error' || entry.level === 'warning') {
        consoleMsgs.push(entry.level + ': ' + entry.text);
      }
    };
    ws.addEventListener('message', (ev) => {
      const msg = JSON.parse(ev.data);
      if (msg.method === 'Runtime.consoleAPICalled') onConsole(msg);
      if (msg.method === 'Log.entryAdded') onLog(msg);
    });

    await send('Emulation.setDeviceMetricsOverride', {
      width: vp.width,
      height: vp.height,
      deviceScaleFactor: vp.dpr,
      mobile: vp.width < 500,
    });
    await send('Emulation.setEmulatedMedia', {
      features: [{ name: 'prefers-color-scheme', value: theme }],
    });
    await send('Page.addScriptToEvaluateOnNewDocument', {
      source: "try { localStorage.setItem('sango-theme', '" + theme + "'); } catch (e) {}",
    });
    await send('Page.navigate', { url: BASE });
    await sleep(7000);

    const evalRes = await send('Runtime.evaluate', {
      expression:
        "JSON.stringify({ title: document.title, htmlClass: document.documentElement.className, innerWidth: window.innerWidth, scrollWidth: document.documentElement.scrollWidth, overflowX: document.documentElement.scrollWidth > window.innerWidth, rootChildren: (document.getElementById('root')?.children.length) ?? -1, hasNav: !!document.querySelector('nav, header') })",
      returnByValue: true,
    });
    let metrics = {};
    try {
      metrics = JSON.parse(evalRes.result?.result?.value ?? '{}');
    } catch {}

    const shot = resolve(OUT, tag + '.png');
    try {
      await send('Page.captureScreenshot', { format: 'png' }).then((r) => {
        writeFileSync(shot, Buffer.from(r.result.data, 'base64'));
      });
    } catch (err) {
      console.log('!! screenshot failed: ' + err.message);
    }

    results.push({ tag, ...metrics, consoleCount: consoleMsgs.length, consoleMsgs });
    const line = '✓ ' + tag + ': overflowX=' + metrics.overflowX + ' htmlClass=' + metrics.htmlClass + ' consoles=' + consoleMsgs.length + ' -> ' + shot;
    console.log(line);
    consoleMsgs.slice(0, 8).forEach((m) => console.log('    ' + m));
  }
}

try { writeFileSync(resolve(OUT, 'summary.json'), JSON.stringify(results, null, 2)); } catch (err) { console.log('!! summary write failed: ' + err.message); }
console.log('\n=== SUMMARY (JSON) ===');
console.log(JSON.stringify(results, null, 2));
ws.close();
chrome.kill();
