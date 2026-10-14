/* ---------- 3.87 บันทึกลงเครื่อง: each project as its own file (.penpm) in a folder the customer picks once ----------
   Like an ordinary desktop program: เมนู › บันทึกโครงการนี้ลงเครื่อง / บันทึกทุกโครงการลงเครื่อง write <project name>.penpm
   (the project and its photos) into a new folder PENUM-PM-FILES (shared/files.js, app.json "files": true). Saving the same
   project again writes over its own file only; any other file in the folder is never touched. Phones, Safari and Firefox download it.
   The shared data folder PENUM-PM (OneDrive sync, 290/820) is refused here: it must hold only the company's data.
   A .penpm opens by double-click in the installed app (app.json fileTypes → launchQueue), by dropping it on the page, or
   เมนู › เปิดไฟล์โครงการ. A project that is already here asks first: replace it (↶ ย้อนกลับ puts it back) or keep both.
   A .penmep from PENUM MEP goes to pmMepFile (920). Admin only once PINs are on, as backup and restore are; not while read-only. */
const PF={ext:'.penpm',acc:'.penpm,.penmep,.json,application/json',F:window.penumFiles||null,imp:null,pend:[]};
if(PF.F)PF.F.init('pm',{sub:'PENUM-PM-FILES',avoid:async h=>{let sync=h.name==='PENUM-PM';
  if(!sync){try{await h.getFileHandle('penum-pm.json');sync=true}catch(e){}}
  return sync?'โฟลเดอร์นี้เป็นที่เก็บข้อมูลบริษัท (PENUM-PM) ที่ซิงค์ให้ทุกคน เลือกโฟลเดอร์อื่น เช่น เอกสาร (Documents)':''}});
const pfAdmin=()=>!(typeof pinOn==='function'&&pinOn()&&(!authOK()||S.me));
const pfNo=()=>{if(!pfAdmin()){toast('เฉพาะผู้ดูแลระบบ');return true}return false};
function pfPhotoKeys(p){const K=new Set();['daily','punch','safe','incid','wir','ncr','att'].forEach(c=>(p[c]||[]).forEach(r=>(r.photos||[]).forEach(k=>K.add(k))));
  (p.bills||[]).forEach(b=>(b.rcpts||[]).forEach(r=>(r.photos||[]).forEach(k=>K.add(k))));return [...K]}
async function pfText(p){const ph={};for(const k of pfPhotoKeys(p)){const v=await phSrc(k);if(v)ph[k]=v}
  return JSON.stringify({fmt:'penum-pm',v:1,app:'PENUM PM',at:Date.now(),co:{name:DB.co.name||''},projects:{[p.id]:p},photos:ph})}
const pfMine=id=>t=>{const o=JSON.parse(t);return o&&o.fmt==='penum-pm'&&o.projects&&Object.keys(o.projects).length===1&&!!o.projects[id]};
function pfSaid(r){if(!r||r.err==='cancel')return '';if(r.err==='avoid')return r.why;if(r.err)return r.err==='denied'?'ไม่ได้รับอนุญาตให้บันทึกในโฟลเดอร์ กดอีกครั้งแล้วกด อนุญาต':'บันทึกไม่ได้';
  return r.dl?`ดาวน์โหลดไฟล์ ${r.file} แล้ว`:`บันทึกลงเครื่องแล้ว: ${r.dir} › ${r.file}`}
async function pfSaveOne(p){const t=await pfText(p);
  if(!PF.F){const f=(p.name||'project').replace(/[\\/:*?"<>|]+/g,' ').trim()+PF.ext;return await download(f,t)?{file:f,dl:true}:{err:'bad'}}
  return PF.F.save({name:p.name||'project',ext:PF.ext,text:t,isMine:pfMine(p.id)})}
ACT.pfSave=async()=>{if(pfNo()||!P)return;const m=pfSaid(await pfSaveOne(P));if(m)toast(m)};
ACT.pfSaveAll=async()=>{if(pfNo())return;const L=projects();if(!L.length){toast('ยังไม่มีโครงการ');return}let n=0,last=null;
  for(const p of L){const r=await pfSaveOne(p);last=r;if(r&&r.err)break;n++}
  if(last&&last.err){const m=pfSaid(last);if(m)toast(n?`บันทึกแล้ว ${n} / ${L.length} โครงการ · ${m}`:m);return}
  toast(last&&last.dl?`ดาวน์โหลดแล้ว ${n} ไฟล์`:`บันทึกลงเครื่องแล้ว ${n} โครงการ ในโฟลเดอร์ ${PF.F?PF.F.name():''}`)};
ACT.pfDir=async()=>{if(pfNo()||!PF.F||!PF.F.ok)return;const h=await PF.F.pick();if(h)toast('บันทึกลงโฟลเดอร์ '+h.name);else if(PF.F.why())toast(PF.F.why());if($('#dlg').open&&h)ACT.pfOpen()};
// เปิดไฟล์โครงการ: the files in the folder when one was picked, else (or "เลือกไฟล์อื่น") one file from anywhere
ACT.pfOpen=async()=>{if(pfNo())return;if(typeof licRO==='function'&&licRO()){toast('สิทธิ์การใช้งานหมดอายุ เปิดไฟล์เข้ามาไม่ได้');return}
  let L=null;if(PF.F&&PF.F.ok){await PF.F.folder(false);if(PF.F.name())L=await PF.F.list(PF.ext)}
  if(!L){ACT.pfAny();return}
  const when=t=>new Date(t).toLocaleString(LANG==='en'?'en-GB':'th-TH',{dateStyle:'medium',timeStyle:'short'});
  dialog('เปิดไฟล์โครงการ',`<p class="hint">ไฟล์ในโฟลเดอร์ <b>${esc(PF.F.name())}</b></p>${L.length?`<div class="pf-l">${L.map(f=>`<button type="button" class="btn" data-a="pfPick" data-f="${esc(f.file)}"><span>${esc(f.file.replace(/\.penpm$/i,''))}</span><small>${when(f.at)}</small></button>`).join('')}</div>`:'<p>ยังไม่มีไฟล์ในโฟลเดอร์นี้</p>'}`,
    `<button type="button" class="btn" data-a="pfDir">เปลี่ยนโฟลเดอร์</button><button type="button" class="btn" data-a="pfAny">เลือกไฟล์อื่น…</button>`)};
ACT.pfPick=async b=>{const t=await PF.F.read(b.dataset.f);$('#dlg').close();if(t==null){toast('อ่านไฟล์ไม่ได้');return}pmFileIn(t,b.dataset.f)};
ACT.pfAny=async()=>{if($('#dlg').open)$('#dlg').close();const f=PF.F?await PF.F.openFile(PF.acc):await new Promise(res=>{const i=document.createElement('input');i.type='file';i.accept=PF.acc;i.hidden=true;
  i.onchange=async()=>{const x=i.files&&i.files[0];i.remove();res(x?{file:x.name,text:await x.text()}:null)};document.body.appendChild(i);i.click()});if(f)pmFileIn(f.text,f.file)};
// a file opened in any of the ways above
function pmFileIn(txt,name){let o=null;try{o=JSON.parse(txt)}catch(e){}
  if(o&&(o.mepLink||(o.boq&&o.loads)||(Array.isArray(o.rooms)&&o.design))){if(typeof pmMepFile==='function')pmMepFile(txt,name);return}          // PENUM MEP's file
  if(!o||!o.projects||typeof o.projects!=='object'||!Object.keys(o.projects).length){toast('ไฟล์นี้ไม่ใช่ไฟล์โครงการของ PENUM PM');return}
  if(!pfAdmin()){toast('เฉพาะผู้ดูแลระบบ');return}if(typeof licRO==='function'&&licRO()){toast('สิทธิ์การใช้งานหมดอายุ เปิดไฟล์เข้ามาไม่ได้');return}
  const ps=Object.values(o.projects).filter(p=>p&&p.id&&p.info),dup=ps.filter(p=>DB.projects[p.id]);if(!ps.length){toast('ไฟล์นี้ไม่มีโครงการ');return}
  PF.imp={o,ps,name:name||''};if(!dup.length){pfTake('');return}
  const one=dup.length===1,nm=one?dup[0].name:'';
  dialog('มีโครงการนี้อยู่แล้ว',`<p>${one?`โครงการ <b>${esc(nm)}</b> จากไฟล์ ${esc(name||'')} มีอยู่ในโปรแกรมแล้ว`:`${dup.length} โครงการในไฟล์ ${esc(name||'')} มีอยู่ในโปรแกรมแล้ว`}</p>
    <ul class="pf-u"><li><b>แทนที่ด้วยไฟล์</b> ใช้ข้อมูลในไฟล์แทน ถ้าเปลี่ยนใจกด ↶ ย้อนกลับ</li><li><b>เก็บไว้ทั้งสองอัน</b> เพิ่มเป็นโครงการใหม่ ของเดิมไม่เปลี่ยน</li></ul>`,
    `<button type="button" class="btn" data-a="pfDo" data-k="sep">เก็บไว้ทั้งสองอัน</button><button type="button" class="btn pri" data-a="pfDo" data-k="rep">แทนที่ด้วยไฟล์</button>`)}
ACT.pfDo=b=>{$('#dlg').close();pfTake(b.dataset.k)};
async function pfTake(how){const I=PF.imp;PF.imp=null;if(!I)return;let first='',n=0;
  for(const [k,v] of Object.entries(I.o.photos||{}))await IDB.put(k,v).catch(()=>{});
  const names=new Set(Object.values(DB.projects).map(p=>p.name));
  for(const src of I.ps){const p=migrate(JSON.parse(JSON.stringify(src)));
    if(DB.projects[p.id]&&how!=='rep'){p.id=uid();let nm=p.name+' (จากไฟล์)',i=2;while(names.has(nm))nm=`${p.name} (จากไฟล์ ${i++})`;p.name=nm}
    names.add(p.name);DB.projects[p.id]=p;if(!first)first=p.id;n++}
  if(I.o.co&&I.o.co.name&&!(DB.co.name||'').trim()&&!(DB.co.lic))DB.co.name=I.o.co.name;          // an empty company (a new install) takes the file's company name
  DB.cur=first;P=DB.projects[first];S.mode='pj';S.tab='dash';S.sel={};save(true);render();scrollTo({top:0});
  toast(n>1?`เปิดไฟล์แล้ว ${n} โครงการ`:`เปิดไฟล์แล้ว: ${P.name}`)}
window.pmFileIn=pmFileIn;
// double-click a .penpm (installed app): taken in once the data is ready and the admin is signed in
const pfRun=()=>{if(!PF.pend.length||typeof DB==='undefined'||!DB||!DB.co)return;if(!pfAdmin())return;const L=PF.pend.splice(0);L.forEach(f=>pmFileIn(f.text,f.file))};
if('launchQueue' in window)launchQueue.setConsumer(async q=>{for(const h of (q&&q.files)||[]){try{const f=await h.getFile();PF.pend.push({file:f.name,text:await f.text()})}catch(e){}}
  setTimeout(()=>{pfRun();if(PF.pend.length)toast('เข้าสู่ระบบในฐานะผู้ดูแลระบบ แล้วไฟล์จะเปิดเอง')},400)});
// drop a .penpm (or MEP's .penmep) anywhere a drop is not already taken
document.addEventListener('dragover',e=>{if(e.dataTransfer&&[...e.dataTransfer.types].includes('Files')&&!e.target.closest('input[type=file]'))e.preventDefault()});
document.addEventListener('drop',async e=>{if(e.defaultPrevented)return;const f=e.dataTransfer&&e.dataTransfer.files&&e.dataTransfer.files[0];if(!f||e.target.closest('input[type=file]'))return;e.preventDefault();
  if(!/\.(penpm|penmep)$/i.test(f.name)){toast('วางได้เฉพาะไฟล์โครงการ .penpm (หรือ .penmep จาก PENUM MEP)');return}pmFileIn(await f.text(),f.name)});
// the menu: next to backup and restore, hidden with them for staff
{const m=document.querySelector('#moreMenu .menu [data-a="restore"]');if(m)m.insertAdjacentHTML('afterend','<button type="button" data-a="pfSave">บันทึกโครงการนี้ลงเครื่อง</button><button type="button" data-a="pfSaveAll">บันทึกทุกโครงการลงเครื่อง</button><button type="button" data-a="pfOpen">เปิดไฟล์โครงการ (.penpm)</button>')}
{const r=render;render=function(){const x=r.apply(this,arguments);try{const bk=$('[data-a="backup"]');['pfSave','pfSaveAll','pfOpen'].forEach(a=>{const e=$(`#moreMenu [data-a="${a}"]`);if(e&&bk)e.hidden=bk.hidden});
  const s=$('#moreMenu [data-a="pfSave"]');if(s)s.disabled=!P;pfRun()}catch(e){}return x}}
SBKW['co.coset']=(SBKW['co.coset']||'')+' บันทึกลงเครื่อง ไฟล์โครงการ penpm เปิดไฟล์ สำรอง save file';
document.head.insertAdjacentHTML('beforeend',`<style>
.pf-l{display:flex;flex-direction:column;gap:6px;max-height:50vh;overflow:auto}.pf-l .btn{display:flex;justify-content:space-between;gap:10px;text-align:left}.pf-l small{color:var(--muted);white-space:nowrap}
.pf-u{margin:8px 0 0;padding-left:18px;font-size:14px}.pf-u li{margin:3px 0}
</style>`);
if(typeof I18N==='object'&&I18N.en&&I18N.en.x)Object.assign(I18N.en.x,{'บันทึกโครงการนี้ลงเครื่อง':'Save this project to this computer','บันทึกทุกโครงการลงเครื่อง':'Save all projects to this computer',
  'เปิดไฟล์โครงการ (.penpm)':'Open project file (.penpm)','เปิดไฟล์โครงการ':'Open project file','เปลี่ยนโฟลเดอร์':'Change folder','เลือกไฟล์อื่น…':'Choose another file…',
  'ยังไม่มีไฟล์ในโฟลเดอร์นี้':'No files in this folder yet','มีโครงการนี้อยู่แล้ว':'This project is already here','แทนที่ด้วยไฟล์':'Replace with the file',
  'เก็บไว้ทั้งสองอัน':'Keep both','ใช้ข้อมูลในไฟล์แทน ถ้าเปลี่ยนใจกด ↶ ย้อนกลับ':'use the file\'s data instead; press ↶ Undo to change your mind',
  'เพิ่มเป็นโครงการใหม่ ของเดิมไม่เปลี่ยน':'add it as a new project; the existing one stays as it is','ไฟล์ในโฟลเดอร์':'Files in the folder'});
