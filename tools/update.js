/* PENUM update check (ปุ่มอัปเดตโปรแกรม), for the apps served from GitHub Pages (fongdabo.github.io/penum).
   tools/build-pages.mjs puts this file into each app's page, after the app, with window.PENUM_SITE = {app, hash, name}:
   hash is a fingerprint of the app's source and name its version (3.70.8, v95, V1.61); the same build writes
   version.json beside the page with the newest {hash, name}. A different hash there means this window runs an older page.
   - เมนู gets "อัปเดตโปรแกรม · <version>" (or an element the app marks data-penum-upd), which opens a box showing
     the version this window runs and the newest one, with อัปเดตเลย when they differ.
   - When an older page is found a notice appears at the bottom of the screen and a red dot on เมนู.
   อัปเดตเลย saves the work (PENUM_SITE.save), fetches the new page past the browser cache, then reloads. */
(()=>{const S=window.PENUM_SITE;if(!S||window.penumUpd)return;
const EN=()=>/^en/i.test(document.documentElement.lang||'');
const T={title:['อัปเดตโปรแกรม','Update the program'],menu:['อัปเดตโปรแกรม','Update program'],cur:['รุ่นที่เครื่องนี้ใช้อยู่','This window runs'],
  last:['รุ่นล่าสุด','Newest version'],checking:['กำลังตรวจ…','Checking…'],na:['ตรวจไม่ได้ (ไม่ได้ต่ออินเทอร์เน็ต?)','Could not check (offline?)'],
  ok:['✓ เป็นรุ่นล่าสุดแล้ว','✓ You have the newest version'],newer:['มีรุ่นใหม่ กด “อัปเดตเลย” งานที่ทำอยู่จะบันทึกไว้ในเครื่องก่อน','A newer version is out. Press “Update now”; your work is saved on this device first.'],
  go:['อัปเดตเลย','Update now'],again:['ตรวจอีกครั้ง','Check again'],close:['ปิด','Close'],later:['ไว้ทีหลัง','Later'],
  bar:['มีโปรแกรมรุ่นใหม่','A newer version is available'],barUse:['เครื่องนี้ยังใช้','this window runs'],loading:['กำลังโหลดรุ่นใหม่…','Loading the new version…'],
  fix:['ปรับปรุงย่อย','minor update']};
const t=k=>T[k][EN()?1:0];
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const CSS=`.pu-dot{display:inline-block;width:9px;height:9px;border-radius:50%;background:#E5484D;box-shadow:0 0 0 2px #fff;margin-left:6px;vertical-align:middle;flex:none}
.pu-v{opacity:.7;font-weight:400}
.pu-bar{position:fixed;left:50%;bottom:calc(14px + env(safe-area-inset-bottom,0px));transform:translateX(-50%);z-index:2147483000;display:flex;align-items:center;gap:10px;flex-wrap:wrap;justify-content:center;
  width:max-content;max-width:calc(100% - 24px);padding:10px 12px 10px 16px;border-radius:14px;background:#123A42;color:#fff;box-shadow:0 12px 36px rgba(8,20,40,.35);
  font:14.5px/1.45 "IBM Plex Sans Thai","Noto Sans Thai","Leelawadee UI",Tahoma,sans-serif;animation:pu-in .25s ease-out}
.pu-bar b{color:#FFD66B}.pu-bar small{opacity:.8;font-size:13px}
@keyframes pu-in{from{opacity:0;transform:translate(-50%,16px)}}
.pu-b{position:static;font:inherit;font-size:14px;padding:7px 14px;border-radius:10px;border:1px solid #CBD5E1;background:#fff;color:#1F2A30;cursor:pointer;white-space:nowrap}
.pu-b.pu-pri{background:#0B7F99;border-color:#0B7F99;color:#fff;font-weight:600}.pu-b:disabled{opacity:.55;cursor:default}
.pu-bar .pu-b.pu-pri{background:#FFD66B;border-color:#FFD66B;color:#123A42}.pu-bar .pu-b.pu-gh{background:none;border-color:rgba(255,255,255,.45);color:#fff}
.pu-dlg{border:none;border-radius:16px;padding:0;width:min(420px,calc(100% - 24px));color:#1F2A30;background:#fff;box-shadow:0 24px 70px rgba(8,20,40,.35);font:15px/1.55 "IBM Plex Sans Thai","Noto Sans Thai","Leelawadee UI",Tahoma,sans-serif}
.pu-dlg::backdrop{background:rgba(10,20,30,.45)}.pu-dlg *{box-sizing:border-box}
.pu-hd{padding:16px 18px 10px;border-bottom:1px solid #E3E9EE;background:linear-gradient(120deg,#EAF6F9,#F4F1FF)}.pu-hd b{font-size:17px;display:block}.pu-hd small{color:#5E6E75;font-size:13px}
.pu-bd{padding:14px 18px;display:grid;grid-template-columns:auto 1fr;gap:6px 14px;align-items:baseline}.pu-bd span{color:#5E6E75;font-size:13.5px}.pu-bd b{font-size:16px}
.pu-st{grid-column:1/-1;margin-top:6px;padding:8px 12px;border-radius:10px;font-size:14px;background:#F4F7F9}.pu-st.ok{background:#E7F6EC;color:#17663A}.pu-st.new{background:#FFF4E5;color:#7A4A0B}
.pu-ft{display:flex;gap:8px;flex-wrap:wrap;padding:12px 18px 16px;border-top:1px solid #E3E9EE}`;
let st={state:'idle',hash:'',name:''},dlg=null,bar=null,lastAt=0,hidBar='';
try{hidBar=sessionStorage.getItem('penum.upd.later.'+S.app)||''}catch(e){}
const newer=()=>st.state==='done'&&st.hash&&st.hash!==S.hash;
const newName=()=>st.name&&st.name!==S.name?st.name:(st.name||'')+' ('+t('fix')+')';

async function check(){st={...st,state:'checking'};paint();lastAt=Date.now();
  try{const r=await fetch('version.json?t='+Date.now(),{cache:'no-store'});if(!r.ok)throw new Error(r.status);const j=await r.json();
    st={state:'done',hash:String(j.hash||''),name:String(j.name||'')}}
  catch(e){st={state:'fail',hash:'',name:''}}
  paint();return newer()}

async function go(){const b=dlg&&dlg.querySelector('[data-pu=go]'),bb=bar&&bar.querySelector('[data-pu=go]');
  [b,bb].forEach(x=>{if(x){x.disabled=true;x.textContent=t('loading')}});
  try{S.save&&S.save()}catch(e){}
  // fetch the page past the browser's cache (the service worker keeps this copy too), so the reload opens the new one
  try{await fetch('./',{cache:'reload'});await fetch('index.html',{cache:'reload'})}catch(e){}
  try{const g=await navigator.serviceWorker?.getRegistration();g&&await g.update()}catch(e){}
  location.reload()}

function paint(){
  // menu entry: the version this window runs, and a red dot when a newer one is out
  document.querySelectorAll('[data-penum-upd]').forEach(el=>{let d=el.querySelector('.pu-dot');
    if(newer()&&!d){el.insertAdjacentHTML('beforeend','<span class="pu-dot" data-noxl aria-hidden="true"></span>')}else if(!newer()&&d)d.remove();
    const sm=el.closest('details')?.querySelector(':scope>summary');if(sm){const sd=sm.querySelector('.pu-dot');if(newer()&&!sd)sm.insertAdjacentHTML('beforeend','<span class="pu-dot" aria-hidden="true"></span>');else if(!newer()&&sd)sd.remove();
      sm.title=newer()?t('bar')+' '+st.name:''}});
  // the notice at the bottom of the screen
  if(newer()&&hidBar!==st.hash){if(!bar){bar=document.createElement('div');bar.className='pu-bar';bar.setAttribute('role','status');document.body.appendChild(bar)}
    bar.innerHTML=`<span>🔔 ${t('bar')} <b data-noxl>${esc(newName())}</b> <small>· ${t('barUse')} <span data-noxl>${esc(S.name)}</span></small></span><button type="button" class="pu-b pu-pri" data-pu="go">${t('go')}</button><button type="button" class="pu-b pu-gh" data-pu="later">${t('later')}</button>`}
  else if(bar){bar.remove();bar=null}
  if(!dlg||!dlg.open)return;
  const L=st.state==='checking'?t('checking'):st.state==='fail'?t('na'):newer()?newName():S.name;
  dlg.querySelector('.pu-l').textContent=L;
  const s=dlg.querySelector('.pu-st');s.className='pu-st'+(newer()?' new':st.state==='done'?' ok':'');s.textContent=st.state==='checking'?t('checking'):st.state==='fail'?t('na'):newer()?t('newer'):t('ok');
  dlg.querySelector('[data-pu=go]').hidden=!newer();dlg.querySelector('[data-pu=again]').disabled=st.state==='checking'}

function open(){if(!dlg){dlg=document.createElement('dialog');dlg.className='pu-dlg';dlg.setAttribute('data-noxl','');document.body.appendChild(dlg)}
  dlg.innerHTML=`<div class="pu-hd"><b>${t('title')}</b><small>${esc(S.title||'')}</small></div>
  <div class="pu-bd"><span>${t('cur')}</span><b>${esc(S.name)}</b><span>${t('last')}</span><b class="pu-l"></b><div class="pu-st"></div></div>
  <div class="pu-ft"><button type="button" class="pu-b pu-pri" data-pu="go" hidden>${t('go')}</button><button type="button" class="pu-b" data-pu="again">${t('again')}</button><button type="button" class="pu-b" data-pu="close" style="margin-left:auto">${t('close')}</button></div>`;
  if(!dlg.open){try{dlg.showModal()}catch(e){dlg.setAttribute('open','')}}
  paint();check()}

document.addEventListener('click',e=>{const b=e.target.closest&&e.target.closest('[data-pu],[data-penum-upd=own]');if(!b)return;
  const k=b.dataset.pu;
  if(!k){const d=b.closest('details');if(d)d.open=false;open();return}
  if(k==='go')go();else if(k==='again')check();else if(k==='close'){dlg.close?dlg.close():dlg.removeAttribute('open')}
  else if(k==='later'){hidBar=st.hash;try{sessionStorage.setItem('penum.upd.later.'+S.app,st.hash)}catch(x){}paint()}});

function put(){const ex=document.querySelector('[data-penum-upd]');
  if(ex){if(!ex.querySelector('.pu-v'))ex.insertAdjacentHTML('beforeend',`<span class="pu-v" data-noxl> · ${esc(S.name)}</span>`);return}
  const label=`${t('menu')} <span class="pu-v" data-noxl>· ${esc(S.name)}</span>`;
  const m=document.querySelector('#moreMenu .menu,#appMenu .amenu');
  if(m){m.insertAdjacentHTML('afterbegin',`<button type="button" data-penum-upd="own">${label}</button>`);return}
  const sp=document.querySelector('header .sp');
  if(sp)sp.insertAdjacentHTML('afterend',`<button type="button" class="pu-b" data-penum-upd="own" style="margin:0 8px">${label}</button>`)}

const css=document.createElement('style');css.textContent=CSS;document.head.appendChild(css);
put();
// apps that rebuild their menu keep the entry
new MutationObserver(()=>{if(!document.querySelector('[data-penum-upd]'))put();else if(newer()&&!document.querySelector('[data-penum-upd] .pu-dot'))paint()}).observe(document.body,{childList:true,subtree:true});
// check soon after opening, every 15 minutes, and when the window comes back after a while
setTimeout(check,4000);setInterval(()=>{if(!document.hidden)check()},15*60e3);
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&Date.now()-lastAt>5*60e3)check()});
window.penumUpd={open,check,go,state:()=>({...st,cur:S.name,newer:newer()})};
})();
