// Build the GitHub Pages site: wrap each app's Artifact source in a full HTML page,
// add a web app manifest and a service worker so Edge/Chrome can install it as a desktop app.
// Each app is a folder with its source (index.html, or src/ for an app split into files) and app.json (its name, colours, version pattern, links); see docs/apps.md.
// The parts every app shares (update box, service worker, icons, home page) live in shared/.
// Usage: node tools/build-pages.mjs [outDir] [app …]   (default: site, every app; naming apps builds only those, e.g. `site pm`)
import { readFileSync, writeFileSync, mkdirSync, rmSync, copyFileSync, readdirSync, existsSync, cpSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { join, resolve, dirname } from 'node:path';

import { APPS, root, source } from './apps.mjs';
const out = resolve(root, process.argv[2] || 'site');
const only = process.argv.slice(3);
const SHARED = join(root, 'shared');
rmSync(out, { recursive: true, force: true });
mkdirSync(join(out, 'icons'), { recursive: true });
for (const f of readdirSync(join(SHARED, 'icons'))) copyFileSync(join(SHARED, 'icons', f), join(out, 'icons', f));

const unknown = only.filter(x => !APPS.some(a => a.dir === x));
if (unknown.length) { console.error('no such app:', unknown.join(', '), '· apps:', APPS.map(a => a.dir).join(', ')); process.exit(1); }

// ปุ่มอัปเดตโปรแกรม: every app page carries shared/update.js and its own {hash, name}; version.json beside it holds the newest
const UPD = readFileSync(join(SHARED, 'update.js'), 'utf8').replaceAll('</script', '<\\/script');
// an app without a version name in its source shows the date of its last change instead
const lastChange = dir => { try { return execFileSync('git', ['log', '-1', '--format=%cs', '--', dir], { cwd: root, encoding: 'utf8' }).trim(); } catch { return ''; } };

// PENUM MEP saves files only through the Artifact host's downloads service and otherwise shows the text to copy.
// Outside the host, stand in for that one service with an ordinary browser download; every other service stays unavailable.
// (PENUM BIM already falls back to a browser download by itself.)
const SHIM = `<script>if(!window.claude)window.claude={use:n=>n==='downloads'?Promise.resolve({save:async({filename,data})=>{const b=data instanceof Blob?data:new Blob([data]),u=URL.createObjectURL(b),a=document.createElement('a');a.href=u;a.download=filename;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),4000)}}):Promise.reject(Object.assign(new Error('unavailable'),{code:'unavailable'}))};</script>`;

// Same base styles the Artifact host puts around the page, so the app looks identical.
const BASE = ':root{color-scheme:light;box-sizing:border-box;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}html{scroll-padding-top:env(safe-area-inset-top,0px)}body{margin:0;padding:0;font:14px -apple-system,BlinkMacSystemFont,sans-serif;background:#faf9f5;color:#141413}img{max-width:100%}[hidden]:not([hidden=until-found i]){display:none!important}';

for (const a of APPS) {
  if (only.length && !only.includes(a.dir)) continue;
  // an app with its own icons/ folder (the ORIEN sales app) uses those instead of the shared PENUM icons
  const ic = a.ownIcons ? 'icons/' : '../icons/';
  const src = source(a);
  const ver = createHash('sha256').update(src).update(UPD).digest('hex').slice(0, 12);
  const vname = (a.ver && (src.match(new RegExp(a.ver)) || [])[1]) || lastChange(a.dir) || ver.slice(0, 7);
  const site = `window.PENUM_SITE={app:${JSON.stringify(a.dir)},title:${JSON.stringify(a.name)},hash:${JSON.stringify(ver)},name:${JSON.stringify(vname)}${a.save ? `,save:()=>{${a.save}}` : ''}};`;
  const dir = join(out, a.dir);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'index.html'),
`<!doctype html><html lang="th"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<link rel="manifest" href="manifest.webmanifest"><meta name="theme-color" content="${a.theme}">
<link rel="icon" type="image/png" sizes="192x192" href="${ic}icon-192.png"><link rel="apple-touch-icon" href="${ic}icon-192.png">
<style>${BASE}</style>${a.shim ? SHIM : ''}</head><body>
${src}
<script>${site}
${UPD}</script>
<script>if('serviceWorker' in navigator)addEventListener('load',()=>navigator.serviceWorker.register('sw.js').catch(()=>{}));</script>
</body></html>
`);
  writeFileSync(join(dir, 'version.json'), JSON.stringify({ app: a.dir, hash: ver, name: vname }) + '\n');
  writeFileSync(join(dir, 'manifest.webmanifest'), JSON.stringify({
    // the id is resolved against the site's origin, so a relative './' gave all four apps the same identity and
    // an installed app could take over another app's start page; each app gets its own path
    id: `/penum/${a.dir}/`, name: a.name, short_name: a.short, description: a.desc, lang: 'th',
    start_url: './', scope: './', display: 'standalone', theme_color: a.theme, background_color: a.bg,
    icons: [
      { src: `${ic}icon-192.png`, sizes: '192x192', type: 'image/png' },
      { src: `${ic}icon-512.png`, sizes: '512x512', type: 'image/png' },
      { src: `${ic}icon-maskable-512.png`, sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  }, null, 2));
  // documents an app links to (PENUM PM's forms library) are served next to it
  for (const sub of ['files', 'help', 'icons']) if (existsSync(join(root, a.dir, sub))) cpSync(join(root, a.dir, sub), join(dir, sub), { recursive: true });
  // e.g. ORIEN ฝ่ายขาย › กล่องรับเรื่อง copies the feedback SQL for the Supabase SQL Editor
  for (const [to, from] of Object.entries(a.copy || {})) { mkdirSync(dirname(join(dir, to)), { recursive: true }); copyFileSync(join(root, from), join(dir, to)); }
  writeFileSync(join(dir, 'sw.js'), readFileSync(join(SHARED, 'sw.js'), 'utf8').replace('__VERSION__', `${a.dir}-${ver}`).replaceAll('../icons/', ic));
}

writeFileSync(join(out, 'index.html'), readFileSync(join(SHARED, 'landing.html'), 'utf8'));
writeFileSync(join(out, '.nojekyll'), '');
console.log('built', out);
