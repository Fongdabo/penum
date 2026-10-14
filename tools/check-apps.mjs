// Quick checks that every PENUM app still opens and still links to the others. Runs on every pull request (.github/workflows/check.yml)
// and before every deploy (pages.yml).
// Usage: node tools/check-apps.mjs [app …]   (default: every app)
// For each app (a folder with app.json, see docs/apps.md):
//  - every inline <script> in the page parses (a syntax error stops the whole app from opening)
//  - the version name the update button shows is found in the source (app.json "ver")
//  - the shared browser-storage keys it writes and reads (app.json "links") are still in the source, and every key read is written by some app
//  - the apps its header buttons open in their own window (app.json "opens") still have those buttons
//  - the feedback box copy matches shared/feedback.js (run node tools/sync-feedback.mjs after editing it)
//  - for an app with "licence" (MEP, BIM): the storage keys it names are still in the source, so the check still guards the work
// And once: shared/licence.js, shared/link.js, shared/files.js, shared/team.js, shared/titlebar.js and shared/prices.js parse, and licence.js, PENUM PM and ORIEN ฝ่ายขาย hold the same public key for the licence codes.
// For an app split into files (<app>/src, PENUM PM) also:
//  - every file is named NNN-what.html|css|js, is not empty and ends with a line break
//  - every .js file parses on its own, so an error names the file and line
//  - the joined page cuts back into the same files (tools/src.mjs split relies on each file's first line)
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { Script } from 'node:vm';
import { APPS, root, isSplit, parts, source, resplit, locate, srcDir, PART_NAME } from './apps.mjs';

const only = process.argv.slice(2);
const fb = readFileSync(join(root, 'shared', 'feedback.js'), 'utf8').trim();
const errors = [];
const fail = (app, msg) => errors.push(`${app}: ${msg}`);
// a SyntaxError's stack starts with "<filename>:<line>"
const errLine = e => +((e.stack || '').match(/:(\d+)\r?\n/) || [])[1] || 0;

for (const a of APPS) {
  if (only.length && !only.includes(a.dir)) continue;
  if (isSplit(a)) {
    for (const f of readdirSync(srcDir(a))) if (!PART_NAME.test(f)) fail(a.dir, `${a.dir}/src/${f}: not part of the page; name it NNN-what.html, .css or .js (lower case)`);
    for (const p of parts(a)) {
      if (!p.text) { fail(a.dir, `${p.path} is empty`); continue; }
      if (!p.text.endsWith('\n')) fail(a.dir, `${p.path} must end with a line break`);
      if (p.file.endsWith('.js')) try { new Script(p.text, { filename: p.path }); }
        catch (e) { fail(a.dir, `${p.path}:${errLine(e)} does not parse on its own: ${e.message}`); }
    }
    if (existsSync(join(root, a.dir, 'index.html'))) console.warn(`${a.dir}: ${a.dir}/index.html is not used; the source is ${a.dir}/src`);
    try {
      const back = resplit(a, source(a)), now = parts(a), k = back.findIndex((p, i) => p.text !== now[i].text);
      // a file that comes back shorter has the next file's first line inside it
      if (k >= 0 && now[k + 1]) fail(a.dir, `${now[k + 1].path}: its first line also appears inside ${now[k].path}, so tools/src.mjs split would cut there; make the first line unique`);
    } catch (e) { fail(a.dir, e.message); }
  }
  const src = source(a);
  let n = 0;
  for (const m of src.matchAll(/<script(\s[^>]*)?>([\s\S]*?)<\/script>/g)) {
    const attrs = m[1] || '', type = (attrs.match(/type=["']?([^"'\s>]+)/) || [])[1];
    n++;
    if (/\ssrc=/.test(attrs) || (type && !/^(text|application)\/javascript$/.test(type))) continue;
    const top = src.slice(0, m.index + m[0].length - m[2].length - '</script>'.length).split('\n').length - 1;
    try { new Script(m[2], { filename: a.dir, lineOffset: top }); }
    catch (e) { fail(a.dir, `script #${n} does not parse, at ${locate(a, errLine(e))}: ${e.message}`); }
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
  if (a.licence) {
    for (const k of new Set([...(a.licence.keys || []), ...(a.licence.work ? [a.licence.work] : [])]))
      if (!src.includes(`'${k}'`) && !src.includes(`"${k}"`)) fail(a.dir, `licence key '${k}' (app.json licence) is no longer in the source`);
    if (a.licence.skip) try { new RegExp(a.licence.skip); } catch (e) { fail(a.dir, `app.json licence.skip is not a regex: ${e.message}`); }
  }
  console.log(`${a.dir}: ${n} scripts checked${isSplit(a) ? `, ${parts(a).length} files in ${a.dir}/src` : ''}`);
}

const LICJS = readFileSync(join(root, 'shared', 'licence.js'), 'utf8');
try { new Script(LICJS, { filename: 'shared/licence.js' }); } catch (e) { errors.push(`shared/licence.js:${errLine(e)} does not parse: ${e.message}`); }
try { new Script(readFileSync(join(root, 'shared', 'link.js'), 'utf8'), { filename: 'shared/link.js' }); } catch (e) { errors.push(`shared/link.js:${errLine(e)} does not parse: ${e.message}`); }
try { new Script(readFileSync(join(root, 'shared', 'files.js'), 'utf8'), { filename: 'shared/files.js' }); } catch (e) { errors.push(`shared/files.js:${errLine(e)} does not parse: ${e.message}`); }
try { new Script(readFileSync(join(root, 'shared', 'team.js'), 'utf8'), { filename: 'shared/team.js' }); } catch (e) { errors.push(`shared/team.js:${errLine(e)} does not parse: ${e.message}`); }
try { new Script(readFileSync(join(root, 'shared', 'titlebar.js'), 'utf8'), { filename: 'shared/titlebar.js' }); } catch (e) { errors.push(`shared/titlebar.js:${errLine(e)} does not parse: ${e.message}`); }
try { new Script(readFileSync(join(root, 'shared', 'prices.js'), 'utf8'), { filename: 'shared/prices.js' }); } catch (e) { errors.push(`shared/prices.js:${errLine(e)} does not parse: ${e.message}`); }
const KX = (LICJS.match(/x:'([A-Za-z0-9_-]{43})'/) || [])[1], KY = (LICJS.match(/y:'([A-Za-z0-9_-]{43})'/) || [])[1];
if (!KX || !KY) errors.push('shared/licence.js: public key (x:\'…\', y:\'…\') not found');
else for (const d of ['pm', 'sales']) { const b = APPS.find(x => x.dir === d), s = b && source(b); if (s && (!s.includes(KX) || (d === 'pm' && !s.includes(KY)))) errors.push(`${d}: its licence public key differs from shared/licence.js`); }

if (errors.length) { console.error('\n' + errors.join('\n')); process.exit(1); }
console.log('all apps OK');
