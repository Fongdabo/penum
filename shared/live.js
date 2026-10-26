/* PENUM รับงานสด (live inbox): someone working for the customer elsewhere (ORIEN staff, or Claude) sends projects
   straight into the customer's program while they watch, without files.
   tools/build-pages.mjs puts this file right after shared/link.js in every app whose app.json has "cloud": true.
   - The customer turns it on in the program; it makes a code (shared/link.js make()) and shows it. Whoever has the code sends with
     tools/live-send.mjs: the data goes to ORIEN's Supabase in the link slot 'hand' of that code, encrypted with the code (link.js),
     so no new SQL is needed and ORIEN cannot read it. The program asks every 20 s while the page is open and visible.
   - Safety: a project from the inbox goes in only after the customer says yes to it once (new, or replacing one already here).
     After that, later sends update that project by themselves. A project never accepted is never touched, nothing is ever
     deleted, and the program's company settings are never changed: only the projects in the send.
   - Payload: {fmt:'penum-live', v:1, app:'pm'|'mep'|'bim', at, projects:{[id]:{name, data}}, extra}.
   window.penumLive.init({app, get(), set(state), list() → [{id,name}], apply(id, data, extra, name, first) → true when taken (first: the customer just said yes),
     ok() → '' when the program may write now, else why not; busy() → true to wait for the next round (a form is open)})
   then penumLive.open() shows the box. state = {code, on, ids:{id:name}, no:{id:1}, at}. */
(()=>{if(window.penumLive)return;
const L=()=>window.penumLink,SLOT='hand',EVERY=20e3;
let A=null,T=0,busy=false,last={t:0,err:'',note:''},ask=[];
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const st=()=>{let s=null;try{s=A.get()}catch(e){}s=s&&typeof s==='object'?s:{};s.ids=s.ids||{};s.no=s.no||{};return s};
const put=s=>{try{A.set(s)}catch(e){}};
const when=t=>{const d=new Date(t);return isNaN(d)?'':d.toLocaleString('th-TH',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit',second:'2-digit'})};
const ERR={offline:'ต่ออินเทอร์เน็ตไม่ได้ จะลองใหม่เอง',nosql:'ระบบคลาวด์ของ ORIEN ยังไม่พร้อม',bad:'อ่านข้อมูลที่ส่งมาไม่ได้'};
// one round: ask when the slot last changed, fetch only when newer, then take what may be taken
async function tick(force){const s=st();if(!A||!s.on||!s.code||busy||!L())return;if(!force&&document.hidden)return;
  if((A.ok&&A.ok())||(L().locked&&L().locked()))return;if(!force&&A.busy&&A.busy())return;
  busy=true;try{const a=await L().at([s.code]);last.t=Date.now();if(a.err){last.err=a.err;return}last.err='';
    const at=a[L().norm(s.code)]&&a[L().norm(s.code)][SLOT];if(!at||at===s.at)return;
    const r=await L().get(s.code,SLOT);if(!r)return;if(r.err){last.err=r.err;return}take(r.data,r.at)}
  finally{busy=false;draw()}}
function take(o,at){const s=st();
  if(!o||o.fmt!=='penum-live'||o.app!==A.app||!o.projects||typeof o.projects!=='object'){s.at=at;put(s);last.note='ข้อมูลที่ส่งมาไม่ใช่ของโปรแกรมนี้ ข้ามไป';return}
  const here=new Set((A.list()||[]).map(p=>p.id)),done=[];let added=0;
  for(const [id,v] of Object.entries(o.projects)){if(!v||!v.data)continue;const nm=v.name||id;
    if(s.ids[id]){if(A.apply(id,v.data,o.extra||{},nm))done.push(nm);continue}
    if(s.no[id])continue;
    const q=ask.find(q=>q.id===id),n={id,nm,data:v.data,extra:o.extra||{},had:here.has(id),at};if(q)Object.assign(q,n);else{ask.push(n);added++}}
  // while a project waits for the customer's answer the send counts as unread, so a reload asks again
  if(!ask.length)s.at=at;put(s);last.note=done.length?`อัปเดตแล้ว: ${done.join(', ')}`:'';if(done.length)note(`รับงานสด: อัปเดต ${done.join(', ')} แล้ว`);
  if(added)open()}
// a small toast of its own, so it looks the same in every app
function note(m){let t=document.getElementById('pnlToast');if(!t){t=document.createElement('div');t.id='pnlToast';document.body.appendChild(t)}
  t.textContent=m;t.classList.add('on');clearTimeout(t._t);t._t=setTimeout(()=>t.classList.remove('on'),4000)}
function dlg(){let d=document.getElementById('pnlDlg');if(!d){d=document.createElement('dialog');d.id='pnlDlg';document.body.appendChild(d);
    d.addEventListener('click',e=>{const b=e.target.closest('[data-pl]');if(!b){if(e.target===d)d.close();return}act(b.dataset.pl,b)})}return d}
function body(){const s=st(),c=s.code?L().show(s.code):'',q=ask[0];
  if(q)return `<h2>รับงานสด</h2><p>มีโครงการ <b>${esc(q.nm)}</b> ส่งมาทางรับงานสด</p>${q.had?`<p class="pnl-w">โครงการนี้มีอยู่ในโปรแกรมแล้ว${(o=>o&&o.name!==q.nm?` (ในโปรแกรมชื่อ <b>${esc(o.name)}</b>)`:'')((A.list()||[]).find(p=>p.id===q.id))} ถ้ารับ ข้อมูลเดิมของโครงการนี้จะถูกแทนที่ด้วยที่ส่งมา และครั้งต่อไปจะอัปเดตเองทุกครั้ง</p>`:'<p>ถ้ารับ จะเพิ่มเป็นโครงการใหม่ และครั้งต่อไปจะอัปเดตเองทุกครั้ง</p>'}
    <p class="pnl-s">โครงการอื่นจะไม่ถูกแตะเลย</p><div class="pnl-f"><button type="button" data-pl="no">ไม่รับ</button><button type="button" class="pri" data-pl="yes">รับโครงการนี้</button></div>`;
  const ids=Object.entries(s.ids);
  return `<h2>รับงานสด</h2><p class="pnl-s">ให้คนที่ทำงานให้คุณจากที่อื่น ส่งโครงการเข้าโปรแกรมนี้ได้ทันที คุณเห็นงานขึ้นเองระหว่างที่เขาทำ</p>
    ${s.on&&c?`<p>รหัสรับงานสด ส่งรหัสนี้ให้คนที่ทำงานให้คุณ</p><p class="pnl-c">${esc(c)} <button type="button" data-pl="copy">คัดลอก</button></p>
      <p class="pnl-s">${last.err?esc(ERR[last.err]||ERR.bad):last.t?`เช็คล่าสุด ${when(last.t)} · เช็คทุก 20 วินาที`:'กำลังเริ่มเช็ค…'}${s.at?` · ได้รับล่าสุด ${when(s.at)}`:''}${last.note?` · ${esc(last.note)}`:''}</p>`
      :'<p>ยังปิดอยู่ กดเปิดแล้วโปรแกรมจะสร้างรหัสให้</p>'}
    ${ids.length?`<p>โครงการที่รับทางนี้ (อัปเดตเองได้): ${ids.map(([,n])=>`<b>${esc(n)}</b>`).join(', ')}</p>`:''}
    <p class="pnl-s">ปลอดภัย: รับเฉพาะโครงการที่คุณกดรับ ไม่ลบอะไร ไม่แตะโครงการอื่นและการตั้งค่าบริษัท ข้อมูลเข้ารหัสด้วยรหัสนี้ ORIEN อ่านไม่ได้</p>
    <div class="pnl-f">${s.on?`<button type="button" data-pl="new">เปลี่ยนรหัส</button><button type="button" data-pl="off">ปิดรับงานสด</button><button type="button" class="pri" data-pl="now">เช็คเดี๋ยวนี้</button>`
      :`<button type="button" class="pri" data-pl="on">เปิดรับงานสด</button>`}<button type="button" data-pl="close">ปิดหน้าต่าง</button></div>`}
function draw(){const d=document.getElementById('pnlDlg');if(d&&d.open)d.innerHTML=body()}
function open(){if(!A)return;const d=dlg();d.innerHTML=body();if(!d.open)try{d.showModal()}catch(e){d.setAttribute('open','')}}
async function act(k,b){const s=st();
  if(k==='close'){dlg().close();return}
  if(k==='yes'||k==='no'){const q=ask.shift();if(q){if(k==='yes'){const why=A.ok&&A.ok();if(why){ask.unshift(q);note(why);return}
        if(A.apply(q.id,q.data,q.extra,q.nm,true)){s.ids[q.id]=q.nm;delete s.no[q.id];note(`รับงานสด: รับ ${q.nm} แล้ว`)}}else s.no[q.id]=1;if(!ask.length)s.at=q.at;put(s)}
    if(ask.length)draw();else dlg().close();return}
  if(k==='on'||k==='new'){const why=A.ok&&A.ok();if(why){note(why);return}s.code=L().make();s.on=1;s.at='';put(s);draw();tick(true);return}
  if(k==='off'){s.on=0;put(s);draw();return}
  if(k==='now'){tick(true);return}
  if(k==='copy'){try{await navigator.clipboard.writeText(L().show(s.code));b.textContent='คัดลอกแล้ว'}catch(e){}}}
function init(o){A=o;if(!T){T=setInterval(()=>tick(false),EVERY);document.addEventListener('visibilitychange',()=>{if(!document.hidden)tick(false)});setTimeout(()=>tick(false),3000)}}
document.head.insertAdjacentHTML('beforeend',`<style>
#pnlDlg{max-width:min(520px,calc(100vw - 32px));border:0;border-radius:14px;padding:18px 20px;box-shadow:0 18px 50px rgba(0,0,0,.25);font-family:inherit;font-size:14px;line-height:1.55;color:#1c2a2e;background:#fff}
#pnlDlg::backdrop{background:rgba(10,30,35,.35)}#pnlDlg h2{margin:0 0 8px;font-size:18px;color:#123A42}#pnlDlg p{margin:6px 0}
#pnlDlg .pnl-s{color:#5b6b70;font-size:13px}#pnlDlg .pnl-w{background:#fff6e0;border-radius:8px;padding:8px 10px}
#pnlDlg .pnl-c{font:600 18px/1.4 ui-monospace,Menlo,Consolas,monospace;letter-spacing:.5px;background:#eef5f4;border-radius:8px;padding:8px 10px;display:flex;gap:10px;align-items:center;flex-wrap:wrap}
#pnlDlg .pnl-f{display:flex;gap:8px;justify-content:flex-end;flex-wrap:wrap;margin-top:14px}
#pnlDlg button{font:inherit;font-size:14px;padding:7px 14px;border-radius:8px;border:1px solid #c9d6d4;background:#fff;color:#123A42;cursor:pointer}
#pnlDlg button.pri{background:#1a7f7a;border-color:#1a7f7a;color:#fff}
#pnlToast{position:fixed;left:50%;bottom:24px;transform:translateX(-50%) translateY(20px);background:#123A42;color:#fff;padding:10px 16px;border-radius:10px;font-size:14px;opacity:0;pointer-events:none;transition:.25s;z-index:2147483000;max-width:calc(100vw - 32px)}
#pnlToast.on{opacity:1;transform:translateX(-50%) translateY(0)}
</style>`);
window.penumLive={init,open,tick:()=>tick(true),state:st};
})();
