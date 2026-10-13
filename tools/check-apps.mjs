// Quick checks that every PENUM app still opens and still links to the others. Runs on every pull request (.github/workflows/check.yml).
// Usage: node tools/check-apps.mjs [app …]   (default: every app)
// For each app (a folder with app.json, see docs/apps.md):
//  - every inline <script> in index.html parses (a syntax error stops the whole app from opening)
//  - the version name the update button shows is found in the source (app.json "ver")
//  - the shared browser-storage keys it writes and reads (app.json "links") are still in the source, and every key read is written by some app
//  - the apps its header buttons open in their own window (app.json "opens") still have those buttons
//  - the feedback box copy matches shared/feedback.js (run node tools/sync-feedback.mjs after editing it)
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { Script } from 'node:vm';
import { APPS, root } from './apps.mjs';

const only = process.argv.slice(2);
const fb = readFileSync(join(root, 'shared', 'feedback.js'), 'utf8').trim();
const errors = [];
const fail = (app, msg) => errors.push(`${app}: ${msg}`);

for (const a of APPS) {
  if (only.length && !only.includes(a.dir)) continue;
  const src = readFileSync(join(root, a.dir, 'index.html'), 'utf8');
  let n = 0;
  for (const m of src.matchAll(/<script(\s[^>]*)?>([\s\S]*?)<\/script>/g)) {
    const attrs = m[1] || '', type = (attrs.match(/type=["']?([^"'\s>]+)/) || [])[1];
    n++;
    if (/\ssrc=/.test(attrs) || (type && !/^(text|application)\/javascript$/.test(type))) continue;
    try { new Script(m[2], { filename: `${a.dir}/index.html <script> #${n}` }); }
    catch (e) { fail(a.dir, `script #${n} (line ${src.slice(0, m.index).split('\n').length}) does not parse: ${e.message}`); }
  }
  if (!n) fail(a.dir, 'no <script> found');
  if (a.ver && !new RegExp(a.ver).test(src)) fail(a.dir, `version name not found (app.json ver ${a.ver})`);
  for (const k of [...(a.links?.writes || []), ...(a.links?.reads || [])])
    if (!src.includes(`'${k}'`) && !src.includes(`"${k}"`)) fail(a.dir, `link key '${k}' (app.json links) is no longer in the source`);
  for (const k of a.links?.reads || [])
    if (!APPS.some(b => (b.links?.writes || []).includes(k))) fail(a.dir, `reads '${k}' but no app writes it`);
  for (const o of a.opens || [])
    if (!src.includes(`goApp('${o}')`) && !src.includes(`target="penum-${o}"`)) fail(a.dir, `no button opens ${o} in its own window (app.json opens)`);
  const block = src.match(/<!-- PENUM-FB:start[^>]*-->\n<script>\n([\s\S]*?)\n<\/script>\n<!-- PENUM-FB:end -->/);
  if (block && block[1] !== fb) fail(a.dir, 'feedback box differs from shared/feedback.js: run node tools/sync-feedback.mjs');
  console.log(`${a.dir}: ${n} scripts checked`);
}

if (errors.length) { console.error('\n' + errors.join('\n')); process.exit(1); }
console.log('all apps OK');
