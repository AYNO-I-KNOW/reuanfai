#!/usr/bin/env node
// usage: node drive.mjs <journey-name|path.mjs> [--headed]
// Journey module: `export const viewport = {width,height}` (optional, default 390x844)
//                 `export default async ({page, step, assert, url, base}) => {...}`
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createRequire} from 'node:module';
import {fileURLToPath, pathToFileURL} from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '../../../..');
const verifyDir = path.join(root, '.verify');
const cache = path.join(process.env.XDG_CACHE_HOME || path.join(os.homedir(), '.cache'), 'reuanfai-verify');
const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]', '::1']);

const args = process.argv.slice(2);
const headed = args.includes('--headed');
const target = args.find(a => !a.startsWith('--'));
if (!target) { console.error('usage: node drive.mjs <journey-name|path.mjs> [--headed]'); process.exit(2); }

const runId = fs.existsSync(path.join(verifyDir, 'current')) ? fs.readFileSync(path.join(verifyDir, 'current'), 'utf8').trim() : '';
if (!runId) { console.error('drive: no .verify/current; run scripts/launch.sh first'); process.exit(2); }
const webPort = fs.readFileSync(path.join(verifyDir, 'runs', runId, 'web_port'), 'utf8').trim();
const base = (process.env.BASE_URL || `http://localhost:${webPort}`).replace(/\/$/, '');
if (!LOCAL_HOSTS.has(new URL(base).hostname)) { console.error(`drive: REFUSE non-localhost BASE_URL ${base}`); process.exit(2); }

const journeyFile = target.endsWith('.mjs') ? path.resolve(target) : path.join(here, '..', 'journeys', `${target}.mjs`);
const journeyName = path.basename(journeyFile, '.mjs');
const journey = await import(pathToFileURL(journeyFile).href);

const {chromium} = createRequire(path.join(cache, 'package.json'))('playwright-core');
const outDir = path.join(verifyDir, 'evidence', runId, journeyName);
fs.rmSync(outDir, {recursive: true, force: true});
fs.mkdirSync(outDir, {recursive: true});

const browser = await chromium.launch({
  headless: !headed,
  ...(process.env.CHROME_PATH ? {executablePath: process.env.CHROME_PATH} : {channel: 'chrome'}),
});
const context = await browser.newContext({
  locale: 'th-TH',
  timezoneId: 'Asia/Bangkok',
  viewport: journey.viewport || {width: 390, height: 844},
});
context.setDefaultTimeout(30_000);
context.setDefaultNavigationTimeout(120_000);
const page = await context.newPage();

const meta = {consoleErrors: [], pageErrors: [], externalRequests: []};
page.on('console', m => { if (m.type() === 'error') meta.consoleErrors.push({text: m.text(), at: page.url()}); });
page.on('pageerror', e => meta.pageErrors.push({text: String(e), at: page.url()}));
// Never let the browser reach beyond localhost; record what it tried.
await context.route(/^https?:\/\//, route => {
  const {hostname} = new URL(route.request().url());
  if (LOCAL_HOSTS.has(hostname)) return route.continue();
  meta.externalRequests.push(route.request().url());
  return route.abort();
});

const steps = [];
const slug = s => s.replace(/[^\p{L}\p{M}\p{N}]+/gu, '-').replace(/^-|-$/g, '').slice(0, 60) || 'step';
async function capture(prefix) {
  const file = p => path.join(outDir, `${prefix}.${p}`);
  const tryDo = async fn => { try { await fn(); } catch (e) { meta.captureErrors = [...(meta.captureErrors || []), String(e)]; } };
  await tryDo(() => page.screenshot({path: file('png')}));
  await tryDo(async () => fs.writeFileSync(file('aria.txt'), await page.locator('body').ariaSnapshot()));
  await tryDo(async () => {
    const dump = await page.evaluate(() => {
      const read = st => Object.fromEntries(Object.keys(st).map(k => { const v = st.getItem(k); try { return [k, JSON.parse(v)]; } catch { return [k, v]; } }));
      return {url: location.href, localStorage: read(localStorage), sessionStorage: read(sessionStorage)};
    });
    fs.writeFileSync(file('storage.json'), JSON.stringify(dump, null, 2));
  });
}

async function step(name, fn) {
  const n = String(steps.length + 1).padStart(2, '0');
  const rec = {n, name, status: 'pass'};
  steps.push(rec);
  try { await fn(); } catch (e) { rec.status = 'fail'; rec.error = String(e?.message || e); throw e; }
  finally { await capture(`${n}-${slug(name)}`); console.log(`${rec.status === 'pass' ? 'PASS' : 'FAIL'} ${n} ${name}`); }
}
function assert(cond, message) { if (!cond) throw new Error(`assert: ${message}`); }

let error = null;
try {
  await journey.default({page, context, step, assert, base, url: p => base + p});
} catch (e) { error = String(e?.message || e); }
await browser.close();

const pass = !error && steps.every(s => s.status === 'pass');
fs.writeFileSync(path.join(outDir, 'meta.json'), JSON.stringify(meta, null, 2));
fs.writeFileSync(path.join(outDir, 'result.json'), JSON.stringify({journey: journeyName, base, runId, pass, steps, error}, null, 2));
console.log(`${pass ? 'RESULT PASS' : 'RESULT FAIL'} journey=${journeyName} run=${runId}`);
console.log(`consoleErrors=${meta.consoleErrors.length} pageErrors=${meta.pageErrors.length} externalRequests=${meta.externalRequests.length}`);
console.log(`evidence=${outDir}`);
if (error) console.error(error);
process.exit(pass ? 0 : 1);
