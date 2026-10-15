/* PENUM แถบบน + แท็บชื่องาน (title bar and document tabs), laid out like AutoCAD's, the same in every app that has it:
   the app's logo with its menu, quick buttons (ใหม่ เปิด บันทึก บันทึกเป็น พิมพ์ ย้อนกลับ ทำซ้ำ แชร์), the open project's name in the
   middle, a search box, the user, a cart kept for ORIEN's form shop (coming soon), then the app's own buttons; under it one tab per
   open project (เริ่มต้น = the start page, * = changes not yet saved to a file, × closes, + new project).
   tools/build-pages.mjs puts this file in the <head> of every app whose app.json has "titlebar": true (MEP, BIM, PM; see docs/apps.md).
   - The tabs are remembered per device (localStorage cfg.key): which projects are open, their names, and for each one a fingerprint
     of the project as it was last saved to a file (or first opened here), so * shows only while it differs.
   - The app owns its projects: it tells the bar which one is open (use), when it changed (soon / check), when it was saved to a
     file (clean), and does the opening and closing the bar asks for (cfg.tabs).
   window.penumBar: mount(cfg) → the bar's element (the app puts it in its header) · refresh() · use(id) · forget(id) · ids() · dirty(id)
   · title() · soon(id, text(), opt()) a moment after a change · flush() · check(id, text, {unsaved}) · clean(id, text or null) · ask(title, html, [[value, label, primary]])
   · saveAs({name, ext, text, type}) → {file} | {file, dl: true} | null · pop(anchor, items) a small menu · note(msg)
   · lang({cur() → 'th', list: [[code, name]], pick(code)}) → a language button (flag, name, ▾) for the right side; b.draw() redraws it
   cfg: app · key · logo (an element to copy) · tag ('MEP') · ver · accent · dark() → bool · menu() → [{t, run, kbd} | '-'] the logo's menu
   · quick: [{k: new|open|save|saveas|print|undo|redo|share, t, run} or {k, node} (the app's own button, kept with its handlers)]
   · extra: [elements] after the quick buttons (wide screens only) · title() → text · titleTip · titleClick() · titleNode (an element shown
   after the name) · search: {ph, index() → [{t, sub, ic, k, go}], first(index) → the hits before anything is typed,
   find(text, index) → the hits for what was typed, when the app ranks them itself}
   · company() → the customer company's name, shown beside the user (default: 'penum.company' from PENUM PM, else the licence's) · user (element) · right: [elements] in this order in
   every app: the app's extras, colour mode (class ptb-ib ptb-thm), คู่มือ (ptb-ib ptb-hlp), language (ptb-bx), เมนู (ptb-bx) · tabs: {cur() → id, start() → bool (the start page is showing), has(id), name(id), open(id),
   close(id) after the bar asked about unsaved changes (every tab has ×; closing the last one shows the start page), save(id) → bool, add(), home(), lost(id, cloud): the question's note for closing unsaved,
   cloud(id) → true when the project's main copy is in the cloud (PM's company cloud, MEP/BIM company projects): * then means
   not in the cloud yet, and the question's บันทึก says บันทึกขึ้นคลาวด์} */
(()=>{if(window.penumBar)return;
const EN=()=>!/^th/i.test(document.documentElement.lang||'th');
const T={start:['เริ่มต้น','Start'],add:['โครงการใหม่','New project'],all:['แท็บที่เปิดอยู่','Open tabs'],others:['ปิดแท็บอื่นทั้งหมด','Close the other tabs'],
  close:['ปิด','Close'],dirty:['มีการแก้ไขที่ยังไม่ได้บันทึกลงไฟล์','Changes not saved to a file yet'],
  closeT:['ปิด “{0}”','Close “{0}”'],closeQ:['มีการแก้ไขที่ยังไม่ได้บันทึกลงไฟล์ บันทึกก่อนปิดไหม','It has changes not saved to a file. Save before closing?'],
  dirtyC:['มีการแก้ไขที่ยังไม่ได้บันทึกขึ้นคลาวด์','Changes not saved to the cloud yet'],closeQC:['มีการแก้ไขที่ยังไม่ได้บันทึกขึ้นคลาวด์ บันทึกขึ้นคลาวด์ก่อนปิดไหม','It has changes not saved to the cloud yet. Save to the cloud before closing?'],
  saveC:['บันทึกขึ้นคลาวด์','Save to the cloud'],
  save:['บันทึก','Save'],nosave:['ไม่บันทึก','Don’t save'],cancel:['ยกเลิก','Cancel'],
  new:['ใหม่','New'],open:['เปิด','Open'],saveas:['บันทึกเป็น','Save as'],print:['พิมพ์','Print'],undo:['ย้อนกลับ','Undo'],redo:['ทำซ้ำ','Redo'],share:['แชร์','Share'],
  ph:['พิมพ์คำค้นหา','Type a keyword'],none:['ไม่พบ ลองคำอื่น','Nothing found, try another word'],srch:['ค้นหา','Search'],
  cart:['ร้านฟอร์มเอกสาร ORIEN','ORIEN form shop'],cartP:['เลือกซื้อแบบฟอร์มเอกสารพร้อมโลโก้บริษัทของคุณ ใช้ได้ทันทีในโปรแกรม','Document forms with your company logo, ready to use in the program'],
  soon:['เร็ว ๆ นี้','Coming soon'],co:['บริษัท','Company'],menu:['เมนูโปรแกรม','Program menu'],tabs:['แท็บชื่องาน','Project tabs']};
const t=(k,...a)=>(T[k]?T[k][EN()?1:0]:k).replace(/\{(\d)\}/g,(m,i)=>a[i]);
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const hash=s=>{let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return (h>>>0).toString(36)+'.'+s.length.toString(36)};
const sv=(d,p)=>`<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
const IC={
  new:sv(0,'<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/><path d="M12 11v6M9 14h6"/>'),
  open:sv(0,'<path d="M3 8V6a2 2 0 0 1 2-2h4l2 2h7a2 2 0 0 1 2 2v1"/><path d="M3 8h17.5a1 1 0 0 1 1 1.2l-1.6 8.2A2 2 0 0 1 17.9 19H5a2 2 0 0 1-2-2z"/>'),
  save:sv(0,'<path d="M5 3h11l4 4v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a1 1 0 0 1 1-1z"/><path d="M8 3v5h7V3"/><rect x="7.5" y="13" width="9" height="6" rx="1"/>'),
  saveas:sv(0,'<path d="M12 21H6a2 2 0 0 1-2-2V4a1 1 0 0 1 1-1h11l4 4v4"/><path d="M8 3v5h7V3"/><path d="M7.5 18v-4.5a.5.5 0 0 1 .5-.5h4"/><path d="m19.5 13.5 2 2-5.5 5.5H14v-2z"/>'),
  print:sv(0,'<path d="M7 9V3h10v6"/><rect x="3" y="9" width="18" height="8" rx="2"/><path d="M7 14h10v7H7z"/><path d="M17.5 12h.01"/>'),
  undo:sv(0,'<path d="M9 14 4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/>'),
  redo:sv(0,'<path d="m15 14 5-5-5-5"/><path d="M20 9H9.5a5.5 5.5 0 0 0 0 11H13"/>'),
  share:sv(0,'<path d="M21.5 3 10 14.5"/><path d="M21.5 3 15 21l-5-6.5L3 10.5z"/>'),
  srch:sv(0,'<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>'),
  cart:sv(0,'<path d="M3 4h2.5l2.2 10.5a1.5 1.5 0 0 0 1.5 1.2h8.3a1.5 1.5 0 0 0 1.5-1.1L21 8H6.3"/><circle cx="10" cy="20" r="1.4"/><circle cx="17" cy="20" r="1.4"/>'),
  burger:sv(0,'<path d="M4 6h16M4 12h16M4 18h16"/>'),
  plus:sv(0,'<path d="M12 5v14M5 12h14"/>'),
  x:'<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>',
  help:sv(0,'<circle cx="12" cy="12" r="9"/><path d="M9.6 9.3a2.5 2.5 0 0 1 4.8.9c0 1.7-2.4 2.2-2.4 3.6"/><path d="M12 17h.01"/>'),
  co:sv(0,'<path d="M3 21h18M5 21V5a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v16M15 9h3a1 1 0 0 1 1 1v11"/><path d="M8 8h1M11 8h1M8 12h1M11 12h1M8 16h1M11 16h1"/>'),
  chev:'<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>'};

let C=null,W=null,S={o:[],b:{},d:{},n:{}},soonT=0,soonF=null;
function load(){try{const o=JSON.parse(localStorage.getItem(C.key)||'null');if(o&&Array.isArray(o.o))S={o:o.o.filter(x=>typeof x==='string'),b:o.b||{},d:o.d||{},n:o.n||{}}}catch(e){}}
function store(){try{localStorage.setItem(C.key,JSON.stringify(S))}catch(e){}}
const cur=()=>{try{return C.tabs.cur()||''}catch(e){return ''}};
function ids(){const c=cur();let L=S.o.filter(id=>{try{return id===c||C.tabs.has(id)}catch(e){return true}});if(c&&!L.includes(c))L.push(c);
  if(L.length!==S.o.length||L.some((x,i)=>x!==S.o[i])){const gone=S.o.filter(x=>!L.includes(x));for(const x of gone){delete S.b[x];delete S.d[x];delete S.n[x]}S.o=L;store()}return L.slice()}
function nameOf(id){let n='';try{n=String(C.tabs.name(id)||'').trim()}catch(e){}if(n&&S.n[id]!==n){S.n[id]=n;store()}return n||S.n[id]||'—'}
function use(id){if(!id)return;if(!S.o.includes(id)){S.o.push(id);store()}refresh()}
function forget(id){const i=S.o.indexOf(id);if(i>=0)S.o.splice(i,1);delete S.b[id];delete S.d[id];delete S.n[id];store();refresh()}
// o.unsaved: a project never saved to a file counts as changed (its first fingerprint then waits for a save or an open from a file)
function check(id,text,o){if(!id||text==null)return;const h=hash(String(text)),was=S.d[id]?1:0;let d,nb=0;
  if(S.b[id]==null){if(o&&o.unsaved)d=1;else{S.b[id]=h;d=0;nb=1}}else d=h!==S.b[id]?1:0;
  if(d!==was||nb){S.d[id]=d;store()}if(d!==was)refresh();else if(id===cur())title()}
function clean(id,text){if(!id)return;if(text!=null)S.b[id]=hash(String(text));else delete S.b[id];S.d[id]=0;store();refresh()}
function soon(id,fn,of){clearTimeout(soonT);soonF=()=>{soonF=null;if(id===cur())try{check(id,fn(),of&&of())}catch(e){}};soonT=setTimeout(()=>{if(soonF)soonF()},700)}
function flush(){clearTimeout(soonT);if(soonF)soonF()}
const dirty=id=>!!S.d[id];

/* small pieces: a menu under a button, a question box, a note */
let POP=null;
function popClose(){if(POP){POP.remove();POP=null;document.removeEventListener('mousedown',popOut,true);document.removeEventListener('keydown',popKey,true)}}
function popOut(e){if(POP&&!POP.contains(e.target)&&!(POP._a&&POP._a.contains(e.target)))popClose()}
function popKey(e){if(e.key==='Escape'){e.stopPropagation();popClose()}}
function pop(anchor,items,cls){const was=POP&&POP._a===anchor;popClose();if(was)return null;
  const m=document.createElement('div');m.className='ptb-pop'+(cls?' '+cls:'');m.setAttribute('role','menu');m.dataset.noxl='';m._a=anchor;
  for(const it of items){if(it==='-'){m.appendChild(document.createElement('hr'));continue}
    if(it.html){const d=document.createElement('div');d.className='ptb-pi';d.innerHTML=it.html;m.appendChild(d);continue}
    const b=document.createElement('button');b.type='button';b.setAttribute('role','menuitem');if(it.on)b.className='on';if(it.dis)b.disabled=true;
    b.innerHTML=`${it.ic?`<i>${it.ic}</i>`:''}<span>${esc(it.t)}</span>${it.kbd?`<kbd>${esc(it.kbd)}</kbd>`:''}`;b.addEventListener('click',()=>{popClose();try{it.run&&it.run()}catch(e){console.error(e)}});m.appendChild(b)}
  document.body.appendChild(m);const r=anchor.getBoundingClientRect(),w=m.offsetWidth;m.style.top=Math.round(r.bottom+4)+'px';
  m.style.left=Math.round(Math.max(8,Math.min(r.left,innerWidth-w-8)))+'px';POP=m;
  document.addEventListener('mousedown',popOut,true);document.addEventListener('keydown',popKey,true);const f=m.querySelector('button');if(f)f.focus({preventScroll:true});return m}
function ask(title,html,btns){return new Promise(res=>{const d=document.createElement('dialog');d.className='ptb-dlg';d.dataset.noxl='';
  d.innerHTML=`<h3>${esc(title)}</h3><div class="ptb-db">${html}</div><div class="ptb-df">${btns.map(([k,l,p])=>`<button type="button" class="${p?'pri':''}" value="${esc(k)}">${esc(l)}</button>`).join('')}</div>`;
  d.addEventListener('click',e=>{const b=e.target.closest('button[value]');if(b)d.close(b.value)});d.addEventListener('close',()=>{const v=d.returnValue||'',i=d.querySelector('[name=fn]');ask.v=i?i.value:'';d.remove();res(v)});
  document.body.appendChild(d);d.showModal();const p=d.querySelector('input,.pri');if(p)p.focus()})}
function note(msg){if(C&&C.note){C.note(msg);return}let e=document.getElementById('ptbNote');if(!e){e=document.createElement('div');e.id='ptbNote';e.className='ptb-note';e.setAttribute('role','status');document.body.appendChild(e)}
  e.textContent=msg;e.classList.add('on');clearTimeout(note.t);note.t=setTimeout(()=>e.classList.remove('on'),4000)}
// บันทึกเป็น: the computer's own save box (Chrome, Edge) to pick the name and the place; elsewhere a download under the name asked for
async function saveAs(o){const fn=String(o.name||'project').replace(/[\\/:*?"<>|\u0000-\u001f]+/g,' ').trim().slice(0,80)||'project',blob=new Blob([o.text],{type:'application/json'});
  if(typeof window.showSaveFilePicker==='function'&&(()=>{try{return window.self===window.top}catch(e){return false}})()){
    let h;try{h=await window.showSaveFilePicker({suggestedName:fn+o.ext,types:[{description:C?C.tag||'PENUM':'PENUM',accept:{[o.type||'application/json']:[o.ext]}}]})}catch(e){return null}
    try{const w=await h.createWritable();await w.write(blob);await w.close();return {file:h.name}}catch(e){return null}}
  const nm=await ask(t('saveas'),`<label class="ptb-f"><input name="fn" type="text" maxlength="80" value="${esc(fn)}"></label>`,[['ok',t('save'),1],['',t('cancel')]]);if(nm!=='ok')return null;
  const v=(ask.v||fn).trim()||fn,file=v+o.ext;
  try{if(window.claude&&window.claude.use){const d=await window.claude.use('downloads');await d.save({filename:file,data:blob})}
    else{const u=URL.createObjectURL(blob),a=document.createElement('a');a.href=u;a.download=file;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),4000)}}catch(e){return null}
  return {file,dl:true}}

/* the bar */
function qb(it){let b=it.node;if(!b){b=document.createElement('button');b.type='button';b.addEventListener('click',()=>{popClose();it.run()})}
  b.classList.add('ptb-q');b.classList.add('ptb-'+it.k);b.removeAttribute('style');b.innerHTML=IC[it.k]+(it.k==='share'?`<span>${esc(t('share'))}</span>`:'');
  if(!b.title||!it.node)b.title=it.t||t(it.k);b.setAttribute('aria-label',it.t||t(it.k));return b}
function build(){const w=document.createElement('div');w.className='ptbw';w.id='ptbw';w.dataset.noxl='';
  w.innerHTML=`<div class="ptb" role="toolbar"><div class="ptb-l"><button type="button" class="ptb-logo" aria-haspopup="menu"><span class="ptb-lg"></span><b>${esc(C.tag||'')}</b>${IC.chev}</button><span class="ptb-qs"></span><span class="ptb-x"></span></div>
    <div class="ptb-c"><button type="button" class="ptb-tt"><span class="ptb-tn"></span><span class="ptb-st" hidden>*</span></button></div>
    <div class="ptb-r"><div class="ptb-s"><button type="button" class="ptb-sb">${IC.srch}</button><input type="search" class="ptb-si" autocomplete="off" spellcheck="false"></div><span class="ptb-co" hidden>${IC.co}<span class="ptb-cn"></span></span><span class="ptb-u"></span>
      <button type="button" class="ptb-cart">${IC.cart}</button><span class="ptb-a"></span></div></div>
    <div class="pdt" role="tablist"><button type="button" class="pdt-m">${IC.burger}</button><div class="pdt-s"></div><button type="button" class="pdt-add">${IC.plus}</button></div>`;
  const lg=w.querySelector('.ptb-lg');if(C.logo){const c=C.logo.cloneNode(true);c.removeAttribute('width');c.removeAttribute('height');c.removeAttribute('style');lg.appendChild(c)}
  const qs=w.querySelector('.ptb-qs');for(const it of C.quick||[])qs.appendChild(qb(it));
  const x=w.querySelector('.ptb-x');for(const n of C.extra||[])if(n)x.appendChild(n);
  if(C.user)w.querySelector('.ptb-u').appendChild(C.user);
  const a=w.querySelector('.ptb-a');for(const n of C.right||[])if(n)a.appendChild(n);
  if(C.titleNode)w.querySelector('.ptb-tt').appendChild(C.titleNode);
  w.querySelector('.ptb-logo').addEventListener('click',e=>{const L=(C.menu?C.menu():[]).slice();if(C.ver)L.push('-',{html:`<small>${esc(C.ver)}</small>`});pop(e.currentTarget,L,'ptb-lm')});
  w.querySelector('.ptb-tt').addEventListener('click',()=>{if(C.titleClick)C.titleClick()});
  w.querySelector('.ptb-cart').addEventListener('click',e=>pop(e.currentTarget,[{html:`<b>${esc(t('cart'))}</b><span class="ptb-soon">${esc(t('soon'))}</span><p>${esc(t('cartP'))}</p>`}],'ptb-cp'));
  w.querySelector('.pdt-add').addEventListener('click',()=>{popClose();C.tabs.add()});
  w.querySelector('.pdt-m').addEventListener('click',e=>{const c=cur(),st=C.tabs.start(),L=ids();
    pop(e.currentTarget,[{t:t('start'),on:st,run:()=>C.tabs.home()},...L.map(id=>({t:nameOf(id)+(dirty(id)?' *':''),on:!st&&id===c,run:()=>openTab(id)})),'-',{t:t('others'),dis:L.length<2,run:closeOthers}])});
  const s=w.querySelector('.pdt-s');
  s.addEventListener('click',e=>{const x=e.target.closest('.pdt-x');if(x){e.stopPropagation();closeTab(x.closest('[data-id]').dataset.id);return}
    const b=e.target.closest('[data-id]');if(b){openTab(b.dataset.id);return}if(e.target.closest('.pdt-st'))C.tabs.home()});
  s.addEventListener('auxclick',e=>{const b=e.button===1&&e.target.closest('[data-id]');if(b&&b.querySelector('.pdt-x')){e.preventDefault();closeTab(b.dataset.id)}});
  s.addEventListener('keydown',e=>{if(e.key!=='Enter'&&e.key!==' ')return;const b=e.target.closest('[data-id]');if(b){e.preventDefault();openTab(b.dataset.id)}});
  srch(w);return w}
function openTab(id){popClose();if(id===cur()&&!C.tabs.start())return;C.tabs.open(id)}
const cl=id=>{try{return !!(C.tabs.cloud&&C.tabs.cloud(id))}catch(e){return false}},dirtyT=id=>t(cl(id)?'dirtyC':'dirty');          // the main copy is in the cloud: บันทึก sends it there
async function closeTab(id){popClose();flush();if(dirty(id)){if(id!==cur()||C.tabs.start()){await C.tabs.open(id);if(id!==cur())return}          // as AutoCAD does: the drawing comes forward before it asks
  const c=cl(id),k=await ask(t('closeT',nameOf(id)),`<p>${esc(t(c?'closeQC':'closeQ'))}</p>${C.tabs.lost?`<p class="ptb-h">${esc(C.tabs.lost(id,c))}</p>`:''}`,[['save',t(c?'saveC':'save'),1],['drop',t('nosave')],['',t('cancel')]]);
  if(!k)return;if(k==='save'&&!await C.tabs.save(id))return}
  await C.tabs.close(id);refresh()}
async function closeOthers(){const c=cur();for(const id of ids())if(id!==c){await closeTab(id);if(cur()!==c&&C.tabs.has(c))await C.tabs.open(c)}}

/* ค้นหา: the app's own index (pages, rooms, commands, views), in a list under the box */
function srch(w){const box=w.querySelector('.ptb-s'),inp=box.querySelector('input'),sb=box.querySelector('.ptb-sb');let ix=null,hits=[],k=0,L=null;
  if(!C.search){box.hidden=true;return}
  const close=()=>{if(L){L.remove();L=null}ix=null;box.classList.remove('open')};
  const draw=()=>{if(!ix)ix=C.search.index()||[];const q=inp.value.trim().toLowerCase(),ws=q.split(/\s+/).filter(Boolean);
    hits=(ws.length?(C.search.find?C.search.find(inp.value.trim(),ix):ix.filter(o=>ws.every(x=>(o.k||'').toLowerCase().includes(x)||String(o.t).toLowerCase().includes(x)))):(C.search.first?C.search.first(ix):ix)).slice(0,12);k=Math.min(k,Math.max(0,hits.length-1));
    if(!L){L=document.createElement('ul');L.className='ptb-pop ptb-sl';L.dataset.noxl='';L.setAttribute('role','listbox');document.body.appendChild(L);
      L.addEventListener('mousedown',e=>{const b=e.target.closest('[data-i]');e.preventDefault();if(b)go(+b.dataset.i)})}
    const r=box.getBoundingClientRect(),wd=Math.max(r.width,320);L.style.top=Math.round(r.bottom+4)+'px';L.style.left=Math.round(Math.max(8,Math.min(r.right-wd,innerWidth-wd-8)))+'px';L.style.width=wd+'px';
    L.innerHTML=hits.length?hits.map((o,i)=>`<li data-i="${i}" role="option"${i===k?' class="on" aria-selected="true"':''}><i>${esc(o.ic||'›')}</i><span>${esc(o.t)}</span><small>${esc(o.sub||'')}</small></li>`).join(''):`<li class="none">${esc(t('none'))}</li>`;
    const on=L.querySelector('.on');if(on)on.scrollIntoView({block:'nearest'})};
  const go=i=>{const o=hits[i];inp.value='';inp.blur();close();if(o)try{o.go()}catch(e){console.error(e)}};
  inp.placeholder=t('ph');inp.setAttribute('aria-label',t('srch'));sb.title=t('srch');sb.setAttribute('aria-label',t('srch'));
  inp.addEventListener('focus',()=>{popClose();k=0;draw()});inp.addEventListener('input',()=>{k=0;draw()});inp.addEventListener('blur',()=>setTimeout(()=>{if(document.activeElement!==inp)close()},150));
  inp.addEventListener('keydown',e=>{if(e.key==='ArrowDown'){k=Math.min(hits.length-1,k+1);draw();e.preventDefault()}else if(e.key==='ArrowUp'){k=Math.max(0,k-1);draw();e.preventDefault()}
    else if(e.key==='Enter'){e.preventDefault();if(hits.length)go(k)}else if(e.key==='Escape'){e.preventDefault();e.stopPropagation();inp.value='';inp.blur();close()}});
  sb.addEventListener('click',()=>{box.classList.add('open');inp.focus()})}
function focusSearch(){const i=W&&W.querySelector('.ptb-si');if(!i||!i.offsetParent&&!W.querySelector('.ptb-sb').offsetParent)return false;
  if(i.offsetParent)i.focus();else W.querySelector('.ptb-sb').click();return true}

// บริษัท: the same spot in every app, beside the user; the app's own answer (PM: the company open), else the one PENUM PM keeps on
// this device ('penum.company'), else the company on the licence code
function coName(){let n='';try{if(C.company)n=String(C.company()||'').trim()}catch(e){}
  if(!n)try{const o=JSON.parse(localStorage.getItem('penum.company')||'null');n=o&&o.name?String(o.name).trim():''}catch(e){}
  if(!n)try{n=String((window.penumLic&&window.penumLic.state().co)||'').trim()}catch(e){}return n}
function title(){if(!W)return;const c=cur(),tn=W.querySelector('.ptb-tn'),st=W.querySelector('.ptb-st'),tt=W.querySelector('.ptb-tt');
  let s='';try{s=C.title?C.title():nameOf(c)}catch(e){}tn.textContent=s;st.hidden=!dirty(c);tt.title=(C.titleTip?C.titleTip():s)+(dirty(c)?' · '+dirtyT(c):'');
  const co=coName(),ce=W.querySelector('.ptb-co');ce.hidden=!co;ce.querySelector('.ptb-cn').textContent=co;ce.title=t('co')+': '+co;
  try{if(C.appName)document.title=(s?s+(dirty(c)?'*':'')+' – ':'')+(C.appName||'PENUM')}catch(e){}}
function refresh(){if(!W)return;const L=ids(),c=cur(),st=C.tabs.start(),s=W.querySelector('.pdt-s'),sl=s.scrollLeft;
  s.innerHTML=`<button type="button" class="pdt-t pdt-st${st?' on':''}" role="tab" aria-selected="${st}">${esc(t('start'))}</button>`+L.map(id=>{const on=!st&&id===c,d=dirty(id),n=nameOf(id);
    return `<div class="pdt-t${on?' on':''}${d?' dt':''}" role="tab" tabindex="0" aria-selected="${on}" data-id="${esc(id)}" title="${esc(n+(d?' · '+dirtyT(id):''))}"><span class="pdt-n">${esc(n)}</span>${d?'<span class="pdt-d" aria-hidden="true">*</span>':''}<button type="button" class="pdt-x" title="${esc(t('close'))}" aria-label="${esc(t('close')+' '+n)}">${IC.x}</button></div>`}).join('');
  s.scrollLeft=sl;const on=s.querySelector('.on');if(on&&refresh.on!==(on.dataset.id||'start')){refresh.on=on.dataset.id||'start';on.scrollIntoView({block:'nearest',inline:'nearest'})}
  W.querySelector('.pdt-m').title=t('all');W.querySelector('.pdt-add').title=t('add');W.querySelector('.ptb-logo').title=t('menu');W.querySelector('.ptb-cart').title=t('cart')+' · '+t('soon');
  W.querySelector('.ptb-si').placeholder=t('ph');
  for(const it of C.quick||[])if(!it.node){const b=W.querySelector('.ptb-'+it.k);if(b){b.title=it.t||t(it.k);if(it.k==='share')b.querySelector('span').textContent=t('share')}}
  dark();title()}
function dark(){let d=false;try{d=!!(C.dark&&C.dark())}catch(e){}document.documentElement.classList.toggle('ptb-dk',d)}
function height(){if(W)document.documentElement.style.setProperty('--ptb-h',W.offsetHeight+'px')}

function mount(cfg){if(W)return W;C=cfg;load();W=build();document.documentElement.classList.add('ptb-on');if(C.accent)document.documentElement.style.setProperty('--ptb-acc',C.accent);
  const st=document.createElement('style');st.id='ptbCss';st.textContent=CSS;document.head.appendChild(st);
  new MutationObserver(()=>refresh()).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme','data-ui','lang']});
  if(window.ResizeObserver)new ResizeObserver(height).observe(W);addEventListener('resize',()=>{height();popClose()});
  document.addEventListener('keydown',e=>{if(e.key!=='/'||e.ctrlKey||e.metaKey||e.altKey)return;const x=e.target;if(x&&(x.isContentEditable||/^(INPUT|TEXTAREA|SELECT)$/.test(x.tagName)))return;
    if(document.querySelector('dialog[open]'))return;if(focusSearch()){e.preventDefault();e.stopImmediatePropagation()}},true);
  addEventListener('storage',e=>{if(e.key==='penum.company')title()});          // PENUM PM changed the company in another window
  setTimeout(()=>{refresh();height()},0);return W}

const CSS=`
.ptbw{--tb-bg:#fff;--tb-bg2:#eef2f6;--tb-ink:#1e293b;--tb-mut:#64748b;--tb-line:#dde3eb;--tb-hov:rgba(15,23,42,.07);--tb-tab:#fff;--tb-inp:#f1f4f8;--tb-acc:var(--ptb-acc,#0d9488);
  color:var(--tb-ink);font:13px/1.3 system-ui,-apple-system,'Segoe UI','Noto Sans Thai',sans-serif;position:relative;z-index:31;min-width:0}
.ptb-dk .ptbw,.ptb-dk .ptb-pop,.ptb-dk .ptb-dlg{--tb-bg:#1e242d;--tb-bg2:#151a21;--tb-ink:#e6e9ef;--tb-mut:#97a3b6;--tb-line:#2d3541;--tb-hov:rgba(255,255,255,.08);--tb-tab:#272e39;--tb-inp:#2a313c}
.ptb-dk .ptbw,.ptb-dk .ptb-pop,.ptb-dk .ptb-dlg{--tb-acc:#2dd4bf}.ptb-dk .ptb-df button.pri{color:#03231f}
.ptb{display:grid;grid-template-columns:minmax(max-content,1fr) minmax(0,auto) minmax(max-content,1fr);align-items:center;gap:10px;height:40px;padding:0 8px;background:var(--tb-bg);border-bottom:1px solid var(--tb-line)}
.ptb-l,.ptb-r{display:flex;align-items:center;gap:2px;min-width:0}.ptb-r{justify-content:flex-end;gap:6px}.ptb-qs,.ptb-x,.ptb-a,.ptb-u{display:flex;align-items:center;gap:2px;min-width:0}.ptb-a{gap:6px}
.ptb-x:not(:empty){margin-left:6px;padding-left:8px;border-left:1px solid var(--tb-line)}
.ptb button{font:inherit;color:inherit;cursor:pointer}
.ptb-logo{display:flex;align-items:center;gap:6px;height:32px;padding:0 6px 0 4px;margin-right:6px;border:none;border-radius:8px;background:none}
.ptb-logo:hover,.ptb-logo:focus-visible{background:var(--tb-hov)}.ptb-lg{display:grid;place-items:center;width:26px;height:26px}.ptb-lg svg,.ptb-lg img{width:26px;height:26px;display:block}.ptb-lg img{border-radius:7px}
.ptb-logo b{font-size:11px;font-weight:800;letter-spacing:.14em;color:var(--tb-acc)}.ptb-logo>svg{opacity:.7}
.ptb-q{display:inline-flex;align-items:center;justify-content:center;gap:5px;height:30px;min-width:30px;padding:0 5px;border:1px solid transparent!important;border-radius:7px;background:none!important;color:var(--tb-ink)!important;box-shadow:none!important;flex:none}
.ptb-q:hover:not(:disabled){background:var(--tb-hov)!important}.ptb-q:disabled{opacity:.35;cursor:default}.ptb-q svg{display:block}
.ptb-q.ptb-new svg,.ptb-q.ptb-open svg{color:#d97706}.ptb-q.ptb-save svg,.ptb-q.ptb-saveas svg{color:#2563eb}.ptb-dk .ptb-q.ptb-save svg,.ptb-dk .ptb-q.ptb-saveas svg{color:#60a5fa}.ptb-dk .ptb-q.ptb-new svg,.ptb-dk .ptb-q.ptb-open svg{color:#fbbf24}
.ptb-q.ptb-share{padding:0 9px 0 6px;margin-left:4px;color:var(--tb-acc)!important;font-weight:600}.ptb-q.ptb-share svg{color:var(--tb-acc)}
.ptb-q.ptb-undo{margin-left:6px}
.ptb-c{min-width:0;display:flex;justify-content:center}
.ptb-tt{display:flex;align-items:baseline;gap:1px;max-width:min(46vw,620px);min-width:0;padding:4px 10px;border:none;border-radius:8px;background:none;font-size:13.5px;font-weight:600}
.ptb-tt:hover{background:var(--tb-hov)}.ptb-tn{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;min-width:0}.ptb-st{color:var(--tb-acc);font-weight:800}
.ptb-tt>:not(.ptb-tn):not(.ptb-st){margin-left:6px;font-weight:400;color:var(--tb-mut);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;flex:0 1 auto;min-width:0;text-align:left}
.ptb-s{position:relative;display:flex;align-items:center;width:230px;min-width:0}
.ptb-si{width:100%;height:28px;box-sizing:border-box;padding:0 10px 0 30px;border:1px solid var(--tb-line);border-radius:8px;background:var(--tb-inp);color:var(--tb-ink);font:inherit;font-size:12.5px;outline:none}
.ptb-si:focus{border-color:var(--tb-acc);box-shadow:0 0 0 3px color-mix(in srgb,var(--tb-acc) 22%,transparent)}.ptb-si::placeholder{color:var(--tb-mut);font-style:italic}
.ptb-sb{position:absolute;left:2px;top:50%;transform:translateY(-50%);display:grid;place-items:center;width:26px;height:26px;border:none;background:none;color:var(--tb-mut);pointer-events:none}.ptb-sb svg{width:15px;height:15px}
.ptb-u .ptm-chip{height:30px;border-radius:8px!important}
/* the app's own buttons on the right, the same order and look in every app: [app extras] colour mode · คู่มือ · language · เมนู
   ptb-ib = an icon button, ptb-bx = a boxed button (language, เมนู) */
.ptb-a .ptb-ib{width:32px!important;min-width:32px;height:30px!important;min-height:0!important;padding:0!important;margin:0!important;border:1px solid transparent!important;border-radius:8px!important;background:none!important;box-shadow:none!important;color:var(--tb-ink)!important;display:inline-grid!important;place-items:center;font-size:0!important;line-height:1;flex:none}
.ptb-a .ptb-ib:hover{background:var(--tb-hov)!important}.ptb-a .ptb-ib svg{width:18px;height:18px}
.ptb-a .ptb-bx{height:30px!important;min-height:0!important;padding:0 8px!important;margin:0!important;border:1px solid var(--tb-line)!important;border-radius:8px!important;background:none!important;box-shadow:none!important;color:var(--tb-ink)!important;display:inline-flex!important;align-items:center;gap:6px;font-size:12.5px!important;font-weight:600;line-height:1;white-space:nowrap;flex:none;cursor:pointer;list-style:none}
.ptb-a .ptb-bx::-webkit-details-marker{display:none}.ptb-a .ptb-bx:hover{background:var(--tb-hov)!important}.ptb-a .ptb-bx>svg:last-child{width:13px;height:13px;opacity:.7}
.ptb-a .ptb-bx .flag{width:18px!important;height:18px!important;flex:none}
.ptb-pop>button i .flag{width:18px;height:18px}
.ptb-co{display:flex;align-items:center;gap:5px;max-width:240px;min-width:0;padding:0 4px 0 2px;color:var(--tb-mut);font-size:12.5px;white-space:nowrap;cursor:default}.ptb-co[hidden]{display:none}
.ptb-co svg{flex:none;width:16px;height:16px}.ptb-cn{overflow:hidden;text-overflow:ellipsis}
.ptb-cart{position:relative;display:grid;place-items:center;width:32px;height:30px;border:none;border-radius:8px;background:none;color:var(--tb-ink)}.ptb-cart:hover{background:var(--tb-hov)}
.pdt{display:flex;align-items:flex-end;gap:2px;height:34px;padding:0 6px;background:var(--tb-bg2);border-bottom:1px solid var(--tb-line)}
.pdt button{font:inherit;color:inherit;cursor:pointer}
.pdt-m,.pdt-add{flex:none;display:grid;place-items:center;width:32px;height:30px;margin-bottom:2px;border:none;border-radius:7px;background:none;color:var(--tb-ink)}.pdt-m:hover,.pdt-add:hover{background:var(--tb-hov)}
.pdt-s{display:flex;align-items:flex-end;gap:2px;min-width:0;overflow-x:auto;overflow-y:hidden;scrollbar-width:none}.pdt-s::-webkit-scrollbar{display:none}
.pdt-t{position:relative;display:flex;align-items:center;gap:2px;flex:none;max-width:260px;height:30px;padding:0 6px 0 12px;border:1px solid transparent;border-bottom:none;border-radius:8px 8px 0 0;background:none;color:var(--tb-mut);font-size:12.5px;cursor:pointer;user-select:none;outline:none}
.pdt-t:hover{background:var(--tb-hov);color:var(--tb-ink)}.pdt-t:focus-visible{box-shadow:inset 0 0 0 2px var(--tb-acc)}
.pdt-t.on{background:var(--tb-tab);color:var(--tb-ink);font-weight:600;border-color:var(--tb-line);box-shadow:inset 0 2px 0 var(--tb-acc);margin-bottom:-1px;height:31px}
.pdt-st{padding:0 14px}.pdt-n{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;min-width:0}.pdt-d{color:var(--tb-acc);font-weight:800;margin-left:1px}
.pdt-x{display:grid;place-items:center;width:20px;height:20px;margin-left:4px;border:none;border-radius:5px;background:none;color:inherit;opacity:.75}.pdt-x:hover{opacity:1;background:var(--tb-hov)}
.pdt-t:not(.on):not(:hover) .pdt-x{opacity:.5}
.ptb-pop{position:fixed;z-index:2147482500;min-width:220px;max-width:min(360px,calc(100vw - 16px));max-height:calc(100vh - 70px);overflow:auto;margin:0;padding:5px;list-style:none;box-sizing:border-box;
  background:var(--tb-bg,#fff);color:var(--tb-ink,#1e293b);border:1px solid var(--tb-line,#dde3eb);border-radius:12px;box-shadow:0 18px 44px -14px rgba(8,20,40,.4);font:13.5px/1.35 system-ui,-apple-system,'Segoe UI','Noto Sans Thai',sans-serif}
.ptb-pop{--tb-bg:#fff;--tb-ink:#1e293b;--tb-mut:#64748b;--tb-line:#dde3eb;--tb-hov:rgba(15,23,42,.07);--tb-acc:var(--ptb-acc,#0d9488)}
.ptb-pop>button,.ptb-pop li{display:flex;align-items:center;gap:10px;width:100%;padding:7px 10px;border:none;border-radius:8px;background:none;color:inherit;font:inherit;text-align:left;cursor:pointer;box-sizing:border-box}
.ptb-pop>button:hover,.ptb-pop>button:focus-visible,.ptb-pop li:hover,.ptb-pop li.on{background:var(--tb-hov);outline:none}.ptb-pop>button.on{font-weight:700;color:var(--tb-acc)}.ptb-pop>button:disabled{opacity:.4;cursor:default}
.ptb-pop>button i{display:grid;place-items:center;width:20px;color:var(--tb-mut);font-style:normal}.ptb-pop>button span{flex:1;min-width:0}.ptb-pop kbd{font:11.5px system-ui;color:var(--tb-mut)}
.ptb-pop hr{border:none;border-top:1px solid var(--tb-line);margin:4px 2px}.ptb-pi{padding:6px 10px;color:var(--tb-mut)}.ptb-pi small{font-size:11.5px}
.ptb-cp{width:290px}.ptb-cp .ptb-pi{color:var(--tb-ink)}.ptb-cp b{font-size:14px}.ptb-cp p{margin:6px 0 2px;color:var(--tb-mut);font-size:13px;line-height:1.5}
.ptb-soon{display:inline-block;margin-left:8px;padding:1px 8px;border-radius:999px;background:color-mix(in srgb,var(--tb-acc) 16%,transparent);color:var(--tb-acc);font-size:11.5px;font-weight:700;vertical-align:1px}
.ptb-sl li i{width:16px;font-style:normal;color:var(--tb-acc);text-align:center;flex:none}.ptb-sl li span{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.ptb-sl li small{color:var(--tb-mut);font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:45%}
.ptb-sl li.none{color:var(--tb-mut);cursor:default}.ptb-sl li.none:hover{background:none}
.ptb-dlg{border:none;border-radius:16px;padding:0;width:min(440px,calc(100% - 24px));color:var(--tb-ink,#1e293b);background:var(--tb-bg,#fff);box-shadow:0 30px 80px -20px rgba(8,20,40,.45);font:15px/1.55 system-ui,-apple-system,'Segoe UI','Noto Sans Thai',sans-serif}
.ptb-dlg{--tb-bg:#fff;--tb-ink:#1e293b;--tb-mut:#64748b;--tb-line:#dde3eb;--tb-acc:var(--ptb-acc,#0d9488)}
.ptb-dlg::backdrop{background:rgba(8,20,40,.35)}.ptb-dlg h3{margin:0;padding:16px 18px 10px;font-size:16.5px;border-bottom:1px solid var(--tb-line)}.ptb-db{padding:12px 18px}.ptb-db p{margin:0 0 6px}.ptb-h{color:var(--tb-mut);font-size:13.5px}
.ptb-df{display:flex;flex-wrap:wrap;justify-content:flex-end;gap:8px;padding:8px 18px 16px}.ptb-df button{font:inherit;font-size:14px;padding:7px 14px;border-radius:10px;border:1px solid var(--tb-line);background:none;color:inherit;cursor:pointer}
.ptb-df button.pri{background:var(--tb-acc);border-color:var(--tb-acc);color:#fff;font-weight:600}
.ptb-f input{width:100%;box-sizing:border-box;font:inherit;padding:8px 10px;border-radius:10px;border:1px solid var(--tb-line);background:none;color:inherit}
.ptb-note{position:fixed;left:50%;bottom:24px;transform:translate(-50%,20px);opacity:0;pointer-events:none;z-index:2147482600;padding:9px 16px;border-radius:12px;background:#1e293b;color:#fff;font:14px system-ui,'Noto Sans Thai',sans-serif;transition:.2s}.ptb-note.on{opacity:1;transform:translate(-50%,0)}
@media (max-width:1440px){.ptb-x{display:none!important}.ptb-s{width:190px}}
@media (max-width:1440px){.ptb-co{max-width:180px}}
@media (max-width:1180px){.ptb-co{display:none!important}}
@media (max-width:1280px){.ptb-a .ptb-lt{display:none}}
@media (max-width:980px){.ptb-a .ptb-hlp{display:none!important}}
@media (max-width:720px){.ptb-a .ptb-thm{display:none!important}.ptb-a .ptb-bx{padding:0 7px!important}.ptb-a .ptb-bx>span{display:none!important}}
@media (max-width:1280px){.ptb-q.ptb-share span{display:none}.ptb-u .ptm-chip{max-width:120px}.ptb-q.ptb-share{padding:0 5px;margin-left:0}.ptb-s{width:150px}}
@media (max-width:980px){.ptb-q.ptb-saveas,.ptb-q.ptb-print,.ptb-q.ptb-share{display:none}.ptb-s{width:130px}.ptb-u .ptm-chip span{display:none}}
@media (max-width:860px){.ptb-q.ptb-new,.ptb-q.ptb-open{display:none}.ptb-q.ptb-undo{margin-left:0}}
@media (max-width:720px){
  .ptb{gap:4px;padding:0 4px;grid-template-columns:auto minmax(0,1fr) auto}.ptb-logo{margin-right:0;padding:0 2px}.ptb-logo b{display:none}
  .ptb-q.ptb-new,.ptb-q.ptb-open{display:none}.ptb-q.ptb-undo{margin-left:0}.ptb-c{visibility:hidden}
  .ptb-r{gap:2px}.ptb-a{gap:2px}.ptb-s{flex:none;min-width:0;width:30px}.ptb-si{display:none}.ptb-sb{position:static;transform:none;pointer-events:auto;width:30px;height:30px;color:var(--tb-ink)}.ptb-sb svg{width:18px;height:18px}
  .ptb-s.open{position:absolute;left:4px;right:4px;top:5px;width:auto;z-index:3;background:var(--tb-bg)}.ptb-s.open .ptb-si{display:block}.ptb-s.open .ptb-sb{position:absolute;left:2px;top:50%;transform:translateY(-50%);pointer-events:none}
  .ptb-cart{width:28px}.pdt{height:32px}.pdt-t{max-width:170px;padding-left:9px}.pdt-st{padding:0 10px}}
@media print{.ptbw{display:none!important}}
`;
// a language button for an app with its own switch (BIM): flag, the language's name and ▾, the same look as MEP's and PM's;
// o = {cur:()=>'th', list:[['th','ภาษาไทย'],['en','English']], pick:k=>…}; call b.draw() after the language changes elsewhere
const FL={th:'<rect width="24" height="24" fill="#A51931"/><rect y="4" width="24" height="16" fill="#F4F5F8"/><rect y="8" width="24" height="8" fill="#2D2A4A"/>',
  en:'<rect width="24" height="24" fill="#012169"/><path d="M0 0L24 24M24 0L0 24" stroke="#fff" stroke-width="5"/><path d="M0 0L24 24M24 0L0 24" stroke="#C8102E" stroke-width="2"/><path d="M12 0V24M0 12H24" stroke="#fff" stroke-width="7"/><path d="M12 0V24M0 12H24" stroke="#C8102E" stroke-width="4"/>'};
const flag=k=>`<svg class="flag" width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><defs><clipPath id="ptbf-${k}"><circle cx="12" cy="12" r="12"/></clipPath></defs><g clip-path="url(#ptbf-${k})">${FL[k]||''}</g><circle cx="12" cy="12" r="11.5" fill="none" stroke="rgba(0,0,0,.18)"/></svg>`;
function lang(o){const b=document.createElement('button');b.type='button';b.className='ptb-bx ptb-lang';b.setAttribute('aria-haspopup','menu');
  const nm=k=>(o.list.find(x=>x[0]===k)||o.list[0]);
  b.draw=()=>{const k=o.cur(),n=nm(k);b.innerHTML=flag(n[0])+`<span class="ptb-lt">${esc(n[1])}</span>`+IC.chev;b.title='ภาษา / Language: '+n[1];b.setAttribute('aria-label',b.title)};
  b.addEventListener('click',()=>pop(b,o.list.map(x=>({t:x[1],ic:flag(x[0]),on:x[0]===o.cur(),run:()=>{if(x[0]!==o.cur())o.pick(x[0]);b.draw()}}))));b.draw();return b}
window.penumBar={icon:k=>IC[k]||'',lang,mount,refresh,title,use,forget,ids,dirty,soon,flush,check,clean,ask,saveAs,pop,popClose,note,focusSearch,get el(){return W}};
})();
