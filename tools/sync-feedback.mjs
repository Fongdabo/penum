// Copy the shared feedback box (shared/feedback.js) into PENUM PM, MEP and BIM, between the PENUM-FB markers.
// Usage: node tools/sync-feedback.mjs   (each app keeps its own penumFB.init call outside the markers)
// In an app split into files (PENUM PM) the markers are in one of the files in <app>/src.
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { app, isSplit, parts, root } from './apps.mjs';
const js = readFileSync(join(root, 'shared', 'feedback.js'), 'utf8').trim();
const block = `<!-- PENUM-FB:start (copied from shared/feedback.js by tools/sync-feedback.mjs; edit there) -->\n<script>\n${js}\n</script>\n<!-- PENUM-FB:end -->`;
const re = /<!-- PENUM-FB:start[^>]*-->[\s\S]*?<!-- PENUM-FB:end -->/;
for (const dir of ['pm', 'mep', 'bim']) {
  const a = app(dir);
  const files = isSplit(a) ? parts(a).map(p => join(root, p.path)) : [join(root, dir, 'index.html')];
  const f = files.find(x => re.test(readFileSync(x, 'utf8'))) || files[files.length - 1], src = readFileSync(f, 'utf8');
  const out = re.test(src) ? src.replace(re, () => block) : src.replace(/\s*$/, '') + '\n' + block + '\n';
  if (out !== src) { writeFileSync(f, out); console.log('updated', dir); } else console.log('unchanged', dir);
}
