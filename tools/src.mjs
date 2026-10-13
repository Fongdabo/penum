// Work with an app that is split into small files (PENUM PM: pm/src). See docs/apps.md.
//   node tools/src.mjs join <app> [-o file]   the whole page source (stdout, or a file)
//   node tools/src.mjs split <app> <file>     cut a whole page back into <app>/src, e.g. after applying an old patch to a joined copy
//   node tools/src.mjs where <app> <line>     which file holds line <line> of the page a browser shows (an error's index.html:<line>)
//   node tools/src.mjs where <app> <line> --src   the same for a line of the joined source (join's output)
import { writeFileSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { app, isSplit, source, resplit, locate, parts, srcDir } from './apps.mjs';

// build-pages.mjs puts 4 lines (doctype, manifest, icons, styles) above the app's source in the page it publishes
const PAGE_TOP = 4;
const [cmd, dir, ...rest] = process.argv.slice(2);
const a = dir && app(dir);
const die = msg => { console.error(msg); process.exit(1); };
if (!a) die('usage: node tools/src.mjs join|split|where <app> …  (see the top of tools/src.mjs)');
if (!isSplit(a)) die(`${dir} is not split into files (no ${dir}/src); its source is ${dir}/index.html`);

if (cmd === 'join') {
  const o = rest.indexOf('-o');
  if (o >= 0 && rest[o + 1]) { writeFileSync(rest[o + 1], source(a)); console.error('wrote', rest[o + 1]); }
  else process.stdout.write(source(a));
} else if (cmd === 'split') {
  if (!rest[0]) die('usage: node tools/src.mjs split <app> <file>');
  let out;
  try { out = resplit(a, readFileSync(rest[0], 'utf8')); } catch (e) { die(e.message); }
  const before = new Map(parts(a).map(p => [p.file, p.text]));
  let n = 0;
  for (const p of out) if (before.get(p.file) !== p.text) { writeFileSync(join(srcDir(a), p.file), p.text); console.log('updated', p.path); n++; }
  console.log(n ? `${n} file(s) updated` : 'no change');
} else if (cmd === 'where') {
  const n = parseInt(rest[0], 10);
  if (!(n > 0)) die('usage: node tools/src.mjs where <app> <line> [--src]');
  const line = rest.includes('--src') ? n : n - PAGE_TOP;
  console.log(line > 0 ? locate(a, line) : `line ${n} is the page wrapper from tools/build-pages.mjs, not app source`);
} else die('usage: node tools/src.mjs join|split|where <app> …');
