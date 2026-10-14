// The list of PENUM apps: every top-level folder with an app.json. Used by build-pages.mjs, check-apps.mjs, src.mjs and sync-feedback.mjs.
// In app.json: name/short/desc/theme/bg → the installed app; ver: where the app's own version name is in its source (a regex);
// save: what the update button runs before reloading; shim: stand in for the Artifact downloads service; ownIcons: the app's own icons/ folder;
// copy: extra files served next to the app {published path: source path}; links: the shared browser-storage keys it writes and reads;
// opens: the apps its header buttons open in their own window; licence: put shared/licence.js (licence code check) in the page,
// with keys (work keys not saved without a licence), work (the key that shows the device already used the app), sample (BIM's
// untouched sample project) and skip (a location.hash regex left unchecked); cloud: put shared/link.js (project link code, data across
// computers) in the page; files: put shared/files.js (save each project as a file in a folder) in the page;
// fileTypes: {mime: [extensions]} the installed app opens by double-click (manifest file_handlers). See docs/apps.md.
//
// An app's page source is its index.html, or, for an app split into small files (PENUM PM), the files in <app>/src joined in
// name order. Each file there is a run of whole lines of the page, named NNN-what.ext (ext: html, css or js for what it holds).
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

export const root = new URL('..', import.meta.url).pathname;
export const APPS = readdirSync(root, { withFileTypes: true })
  .filter(d => d.isDirectory() && existsSync(join(root, d.name, 'app.json')))
  .map(d => ({ dir: d.name, ...JSON.parse(readFileSync(join(root, d.name, 'app.json'), 'utf8')) }))
  .sort((a, b) => (a.order || 99) - (b.order || 99));

export const app = dir => APPS.find(a => a.dir === dir);
export const PART_NAME = /^\d{3}-[a-z0-9][a-z0-9.-]*\.(html|css|js)$/;
export const srcDir = a => join(root, a.dir, 'src');
export const isSplit = a => existsSync(srcDir(a));
// the files in <app>/src in page order: {file, path, text}; anything not named like a part is left out (check-apps reports it)
export const parts = a => readdirSync(srcDir(a)).filter(f => PART_NAME.test(f)).sort()
  .map(file => ({ file, path: `${a.dir}/src/${file}`, text: readFileSync(join(srcDir(a), file), 'utf8') }));
// the app's whole page source, as build-pages.mjs wraps it
export const source = a => isSplit(a) ? parts(a).map(p => p.text).join('') : readFileSync(join(root, a.dir, 'index.html'), 'utf8');

const lines = s => s.match(/[^\n]*\n|[^\n]+$/g) || [];
// Cut a whole page back into the app's current files: each file starts at the first line, after the previous file's start,
// that equals its own first line now. Returns [{file, path, text}] or throws with the file whose first line is missing.
export function resplit(a, page) {
  const ps = parts(a), L = lines(page), at = [];
  ps.forEach((p, k) => {
    const first = lines(p.text)[0];
    let i = k ? at[k - 1] + 1 : 0;
    while (i < L.length && L[i] !== first) i++;
    if (i >= L.length || (k === 0 && i !== 0)) throw new Error(`${p.path}: its first line is not found in the page (${JSON.stringify(first.slice(0, 80))}); give the part its first line back or cut by hand`);
    at.push(i);
  });
  return ps.map((p, k) => ({ ...p, text: L.slice(at[k], k + 1 < at.length ? at[k + 1] : L.length).join('') }));
}

// line n (1-based) of the whole page source → "pm/src/650-language.js:12" (or "mep/index.html:n")
export function locate(a, n) {
  if (!isSplit(a)) return `${a.dir}/index.html:${n}`;
  let start = 1;
  for (const p of parts(a)) {
    const c = lines(p.text).length;
    if (n < start + c) return `${p.path}:${n - start + 1}`;
    start += c;
  }
  return `${a.dir} page line ${n} (past the last file)`;
}
