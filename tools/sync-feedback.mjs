// Copy the shared feedback box (shared/feedback.js) into PENUM PM, MEP and BIM, between the PENUM-FB markers.
// Usage: node tools/sync-feedback.mjs   (each app keeps its own penumFB.init call outside the markers)
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
const root = new URL('..', import.meta.url).pathname;
const js = readFileSync(join(root, 'shared', 'feedback.js'), 'utf8').trim();
const block = `<!-- PENUM-FB:start (copied from shared/feedback.js by tools/sync-feedback.mjs; edit there) -->\n<script>\n${js}\n</script>\n<!-- PENUM-FB:end -->`;
const re = /<!-- PENUM-FB:start[^>]*-->[\s\S]*?<!-- PENUM-FB:end -->/;
for (const app of ['pm', 'mep', 'bim']) {
  const f = join(root, app, 'index.html'), src = readFileSync(f, 'utf8');
  const out = re.test(src) ? src.replace(re, () => block) : src.replace(/\s*$/, '') + '\n' + block + '\n';
  if (out !== src) { writeFileSync(f, out); console.log('updated', app); } else console.log('unchanged', app);
}
