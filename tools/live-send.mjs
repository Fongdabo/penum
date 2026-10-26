// รับงานสด: send projects into a customer's open program (shared/live.js), from a file of that program.
//   node tools/live-send.mjs <code> <file> [--app pm|mep|bim] [--only <project id>]
// A PM file may also carry quotes:[…] and tenders:[…] of those projects (q.pj / t.pj = the project id); they go into the
// company's quotes and bids (ทำราคาประมูล, ปร.4 / ปร.5).
// <code> is the รหัสรับงานสด the customer's program shows (เมนู › รับงานสด…). <file> is a .penpm (PM; its photos go too),
// or for MEP/BIM a JSON {projects:{id:{name,data}}}. The customer says yes to each project once in their program.
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2), opt = k => { const i = args.indexOf(k); return i < 0 ? '' : args.splice(i, 2)[1] || ''; };
const app = opt('--app') || 'pm', only = opt('--only'), [code, file] = args;
if (!code || !file) { console.error('usage: node tools/live-send.mjs <code> <file> [--app pm|mep|bim] [--only <project id>]'); process.exit(1); }

globalThis.window = globalThis;
new Function(readFileSync(join(root, 'shared', 'link.js'), 'utf8'))();
const L = globalThis.penumLink;
if (!L.norm(code)) { console.error('not a รหัสรับงานสด:', code); process.exit(1); }

const o = JSON.parse(readFileSync(file, 'utf8'));
const projects = {}, extra = {};
if (app === 'pm') {
  if (o.fmt !== 'penum-pm' || !o.projects) { console.error('not a PENUM PM file (.penpm)'); process.exit(1); }
  for (const [id, p] of Object.entries(o.projects)) if (!only || id === only) projects[id] = { name: p.name || id, data: p };
  if (o.photos) extra.photos = o.photos;
  // quotes of these projects (q.pj), from a file that carries them: {…, quotes:[…]}
  if (Array.isArray(o.quotes)) extra.quotes = o.quotes.filter(q => projects[q.pj]);
  // bids (ทำราคาประมูล: ปร.4 / ปร.5) of these projects (t.pj), from a file that carries them: {…, tenders:[…]}
  if (Array.isArray(o.tenders)) extra.tenders = o.tenders.filter(t => projects[t.pj]);
} else {
  for (const [id, v] of Object.entries(o.projects || {})) if (!only || id === only) projects[id] = v;
}
if (!Object.keys(projects).length) { console.error('no project to send'); process.exit(1); }

const r = await L.put(code, 'hand', { fmt: 'penum-live', v: 1, app, at: Date.now(), projects, extra });
if (r.err) { console.error('send failed:', r.err); process.exit(1); }
console.log('sent', Object.values(projects).map(p => p.name).join(', '), 'at', r.at);
