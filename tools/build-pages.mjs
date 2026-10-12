// Build the GitHub Pages site: wrap each app's Artifact source in a full HTML page,
// add a web app manifest and a service worker so Edge/Chrome can install it as a desktop app.
// Usage: node tools/build-pages.mjs [outDir]   (default: site)
import { readFileSync, writeFileSync, mkdirSync, rmSync, copyFileSync, readdirSync, existsSync, cpSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { join, resolve } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const out = resolve(root, process.argv[2] || 'site');
rmSync(out, { recursive: true, force: true });
mkdirSync(join(out, 'icons'), { recursive: true });
for (const f of readdirSync(join(root, 'icons'))) copyFileSync(join(root, 'icons', f), join(out, 'icons', f));

const APPS = [
  // ver: where the app's own version name is in its source; save: what the update button runs before reloading
  { dir: 'mep', name: 'PENUM MEP', short: 'PENUM MEP', desc: 'งานระบบอาคาร คำนวณ แบบ และ BOQ', theme: '#123A42', bg: '#F2F5F4', shim: true, ver: /MEP_NAME='([^']+)'/, save: 'save()' },
  { dir: 'bim', name: 'PENUM BIM', short: 'PENUM BIM', desc: 'โปรแกรมเขียนแบบ BIM ในเบราว์เซอร์', theme: '#1b2028', bg: '#eef1f5', ver: /V1_NAME='([^']+)'/, save: 'saveNow()' },
  { dir: 'pm', name: 'PENUM PM', short: 'PENUM PM', desc: 'บริหารโครงการ แผนงาน จัดซื้อ งบ เบิกงวด หน้างาน และส่งมอบ', theme: '#123A42', bg: '#F2F5F4', ver: /penumFB\.init\(\{app:'PM'[^}]*?ver:'([^']+)'/, save: 'save(true)' },
  { dir: 'sales', name: 'ORIEN ฝ่ายขาย', short: 'ORIEN ขาย', desc: 'บริษัท โอเรียน จำกัด: ลงทะเบียนลูกค้า ออกรหัสใช้งาน และบันทึกงานช่วยเหลือ PENUM PM', theme: '#1B2440', bg: '#F3F5F8', ownIcons: true },
];

// ปุ่มอัปเดตโปรแกรม: every app page carries tools/update.js and its own {hash, name}; version.json beside it holds the newest
const UPD = readFileSync(join(root, 'tools', 'update.js'), 'utf8').replaceAll('</script', '<\\/script');
// an app without a version name in its source shows the date of its last change instead
const lastChange = dir => { try { return execFileSync('git', ['log', '-1', '--format=%cs', '--', dir], { cwd: root, encoding: 'utf8' }).trim(); } catch { return ''; } };

// PENUM MEP saves files only through the Artifact host's downloads service and otherwise shows the text to copy.
// Outside the host, stand in for that one service with an ordinary browser download; every other service stays unavailable.
// (PENUM BIM already falls back to a browser download by itself.)
const SHIM = `<script>if(!window.claude)window.claude={use:n=>n==='downloads'?Promise.resolve({save:async({filename,data})=>{const b=data instanceof Blob?data:new Blob([data]),u=URL.createObjectURL(b),a=document.createElement('a');a.href=u;a.download=filename;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),4000)}}):Promise.reject(Object.assign(new Error('unavailable'),{code:'unavailable'}))};</script>`;

// Same base styles the Artifact host puts around the page, so the app looks identical.
const BASE = ':root{color-scheme:light;box-sizing:border-box;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}html{scroll-padding-top:env(safe-area-inset-top,0px)}body{margin:0;padding:0;font:14px -apple-system,BlinkMacSystemFont,sans-serif;background:#faf9f5;color:#141413}img{max-width:100%}[hidden]:not([hidden=until-found i]){display:none!important}';

for (const a of APPS) {
  // an app with its own icons/ folder (the ORIEN sales app) uses those instead of the shared PENUM icons
  const ic = a.ownIcons ? 'icons/' : '../icons/';
  const src = readFileSync(join(root, a.dir, 'index.html'), 'utf8');
  const ver = createHash('sha256').update(src).update(UPD).digest('hex').slice(0, 12);
  const vname = (a.ver && (src.match(a.ver) || [])[1]) || lastChange(a.dir) || ver.slice(0, 7);
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
  // ORIEN ฝ่ายขาย › กล่องรับเรื่อง copies the feedback SQL for the Supabase SQL Editor
  if (a.dir === 'sales') { mkdirSync(join(dir, 'files'), { recursive: true }); copyFileSync(join(root, 'tools', 'feedback-setup.sql'), join(dir, 'files', 'feedback-setup.sql')); }
  writeFileSync(join(dir, 'sw.js'), readFileSync(join(root, 'tools', 'sw.js'), 'utf8').replace('__VERSION__', `${a.dir}-${ver}`).replaceAll('../icons/', ic));
}

writeFileSync(join(out, 'index.html'), readFileSync(join(root, 'tools', 'landing.html'), 'utf8'));
writeFileSync(join(out, '.nojekyll'), '');
console.log('built', out);
