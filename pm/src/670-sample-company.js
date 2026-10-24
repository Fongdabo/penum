/* ---------- 3.17: the sample company opens on its own page ----------
   "ลองด้วยข้อมูลตัวอย่าง" / "เปิดโครงการตัวอย่าง" open a new tab at ?demo=1. That page keeps its data under separate keys
   (DSFX in 1core) and its own photo store, never links a OneDrive folder, and shows a band saying it is the sample.
   The real company starts clean, with no sample project to delete. ACT.loadDemo() called from code still loads in place. */
const demoUrl=()=>location.pathname+'?demo=1';
function demoOpen(){const w=window.open(demoUrl(),'penum-pm-demo');if(!w)location.href=demoUrl()}
const loadDemoIn=ACT.loadDemo;
{const f=ACT.loadDemo;ACT.loadDemo=b=>{if(b&&b.nodeType&&!DEMOPG){demoOpen();return}return f(b)}}
ACT.demoOpen=()=>demoOpen();
// first visit to the sample page: fill it, and drop the empty starter project
function demoBoot(){if(DB.co&&(DB.co.customers||[]).length)return;
  const blank=Object.values(DB.projects).filter(p=>!p.boq.items.length&&!p.tasks.length).map(p=>p.id);ACT.loadDemo();
  blank.forEach(id=>{if(Object.keys(DB.projects).length>1)delete DB.projects[id]});if(!DB.projects[DB.cur]){DB.cur=Object.keys(DB.projects)[0];P=DB.projects[DB.cur]}S.mode='pj';S.tab='dash';save(true)}
ACT.demoReset=()=>{if(!confirm('ล้างข้อมูลในหน้าตัวอย่าง แล้วโหลดบริษัทตัวอย่างใหม่? (ข้อมูลบริษัทจริงไม่ถูกแตะ)'))return;
  clearTimeout(saveT);save=()=>{};try{localStorage.removeItem(KEY);localStorage.removeItem(AKEY)}catch(e){}location.reload()};
ACT.demoClose=()=>{window.close();setTimeout(()=>{location.href=location.pathname},300)};
if(DEMOPG){
  // the sample page never connects to OneDrive or a shared folder
  const no=()=>toast('หน้านี้เป็นข้อมูลตัวอย่าง ไม่เชื่อม OneDrive · เชื่อมได้ที่หน้าบริษัทจริง');
  ['fGo','fPick','fSync','cGo','cLogin','cCreate','cFind','cLinkGo','cSync','coNew','wizStart'].forEach(k=>{if(ACT[k])ACT[k]=no});
  document.title='ตัวอย่าง · '+document.title;
  const band=()=>{if(document.getElementById('demoBand'))return;document.body.insertAdjacentHTML('afterbegin',`<div id="demoBand" class="demo-band" role="status"><b>หน้าตัวอย่าง</b><span>ข้อมูลในหน้านี้เป็นบริษัทสมมติ แยกจากข้อมูลบริษัทจริง ลองกดแก้ได้ตามสบาย ไม่บันทึกลง OneDrive</span><span class="sp"></span><button type="button" class="btn sm" data-a="demoReset">เริ่มตัวอย่างใหม่</button><button type="button" class="btn sm pri" data-a="demoClose">ปิดหน้าตัวอย่าง</button></div>`)};
  band();const r=render;render=function(){const x=r.apply(this,arguments);band();return x}}
else{
  // the welcome card and the project page now say the sample opens on its own page
  const fix=()=>{document.querySelectorAll('#view [data-a="loadDemo"]').forEach(b=>{if(b.dataset.dm)return;b.dataset.dm=1;
    if(b.classList.contains('wl-c')){const s=b.querySelector('span');if(s)s.textContent='เปิดบริษัทตัวอย่างในแท็บใหม่ ไว้ลองกดดูก่อน แยกจากข้อมูลจริง ไม่ต้องลบทิ้งทีหลัง'}
    else b.textContent='ดูโครงการตัวอย่าง (แท็บใหม่) ↗'})};
  const r=render;render=function(){const x=r.apply(this,arguments);fix();return x}}
document.head.insertAdjacentHTML('beforeend',`<style>
.demo-band{position:sticky;top:0;z-index:60;display:flex;flex-wrap:wrap;align-items:center;gap:6px 12px;padding:8px 16px;background:var(--warn-soft,#fff1c7);color:var(--ink);border-bottom:1px solid var(--line);font-size:14px}
.demo-band b{font-weight:700}.demo-band .sp{flex:1}
@media (max-width:640px){.demo-band span:not(.sp){font-size:12.5px}}
@media print{.demo-band{display:none!important}}
</style>`);

/* Clearing sample data that was loaded into a real company before 3.17 (or by pressing the demo button more than once).
   The sample is rebuilt off to the side to learn what it contains (project names, customers, staff, quotes, ...);
   records matching it by name, and records that point at removed projects or people, are removed. The company's own
   setup (name, logo, tax ID, PINs, settings) stays. */
const DSIG=x=>x&&typeof x==='object'?String(x.name||x.title||x.no||x.subject||x.desc||'').trim():'';
function demoShape(){const keep={DB,P,S:JSON.stringify(S),save,render,toast};
  try{save=()=>{};render=()=>{};toast=()=>{};const p=blankProject('x');DB={v:1,cur:p.id,projects:{[p.id]:p},co:blankCo()};P=p;loadDemoIn();
    const d=DB;delete d.projects[p.id];return d}
  catch(e){console.warn(e);return null}
  finally{DB=keep.DB;P=keep.P;S=JSON.parse(keep.S);save=keep.save;render=keep.render;toast=keep.toast}}
function demoFind(){const d=demoShape();if(!d)return null;const names=new Set(Object.values(d.projects).map(p=>p.name));
  const pj=Object.values(DB.projects).filter(p=>p.demo||names.has(p.name)),gone=new Set(pj.map(p=>p.id)),co={};let n=0;
  // pass 1: records named like the sample's; pass 2: records that point at something removed
  for(const k of Object.keys(d.co||{})){if(['ai','tf'].includes(k))continue;const A=DB.co[k],D=d.co[k];if(!Array.isArray(A)||!Array.isArray(D))continue;const sig=new Set(D.map(DSIG).filter(Boolean));
    const out=A.filter(x=>{const g=DSIG(x);return g&&sig.has(g)});if(out.length){co[k]=new Set(out);out.forEach(x=>x&&x.id&&gone.add(x.id))}}
  for(const k of Object.keys(DB.co)){const A=DB.co[k];if(!Array.isArray(A))continue;const S0=co[k]||new Set();
    A.forEach(x=>{if(x&&typeof x==='object'&&!S0.has(x)&&['proj','p','pid','staff','sid','cust','vid','who'].some(f=>typeof x[f]==='string'&&gone.has(x[f])))S0.add(x)});if(S0.size)co[k]=S0}
  for(const k in co)n+=co[k].size;return {pj,co,n}}
ACT.demoClear=async()=>{const f=demoFind();if(!f||(!f.pj.length&&!f.n)){toast('ไม่พบข้อมูลตัวอย่างในบริษัทนี้');return}
  if(!confirm(`พบข้อมูลตัวอย่าง: โครงการ ${f.pj.length} โครงการ และรายการอื่น ${f.n} รายการ (ลูกค้า พนักงาน ใบเสนอราคา ฯลฯ ที่มาจากตัวอย่าง)\n\nข้อมูลบริษัทที่ตั้งไว้ (ชื่อ โลโก้ เลขผู้เสียภาษี PIN การตั้งค่า) ยังอยู่ครบ\n\nดาวน์โหลดไฟล์สำรองก่อนแล้วล้างเลยไหม`))return;
  await ACT.backup();
  f.pj.forEach(p=>delete DB.projects[p.id]);for(const k in f.co)DB.co[k]=DB.co[k].filter(x=>!f.co[k].has(x));
  if(!Object.keys(DB.projects).length){const p=blankProject('โครงการแรก');DB.projects[p.id]=p}
  if(!DB.projects[DB.cur])DB.cur=Object.keys(DB.projects)[0];P=DB.projects[DB.cur];S.sel={};save(true);render();toast(`ล้างข้อมูลตัวอย่างแล้ว ${f.pj.length} โครงการ ${f.n} รายการ`)};
if(!DEMOPG){
  {const m=document.querySelector('#moreMenu .menu [data-a="coNew"]');if(m)m.insertAdjacentHTML('beforebegin','<button type="button" data-a="demoClear">ล้างข้อมูลตัวอย่างออก</button>')}
  // a card on the home page while sample projects are still in the real company
  const hasDemo=()=>{const N=['อาคารสำนักงานจำลอง 2 ชั้น','โรงงานสยามฟู้ด อาคารผลิต 1'];return Object.values(DB.projects).some(p=>p.demo||N.includes(p.name))};
  const card=()=>{const v=document.getElementById('view');if(!v||v.querySelector('.demo-left')||!hasDemo())return;if(!(S.mode==='co'&&S.ctab==='exec')&&!(S.mode==='pj'&&S.tab==='dash'))return;
    const h=v.querySelector('.ohead,.phead,header');const html=`<section class="card demo-left"><h2><span>ยังมีข้อมูลตัวอย่างอยู่ในบริษัทนี้</span></h2><p class="hint" style="margin:0 0 10px">โครงการตัวอย่างและรายการที่มากับตัวอย่างทำให้มีแจ้งเตือนที่ไม่ใช่งานจริง กดปุ่มด้านล่างเพื่อล้างออกทีเดียว ข้อมูลบริษัทที่ตั้งไว้ยังอยู่ครบ ต่อไปถ้าอยากดูตัวอย่าง ระบบจะเปิดในแท็บแยก</p><button type="button" class="btn pri" data-a="demoClear">ล้างข้อมูลตัวอย่างออก</button></section>`;
    if(h)h.insertAdjacentHTML('afterend',html);else v.insertAdjacentHTML('afterbegin',html)};
  const r=render;render=function(){const x=r.apply(this,arguments);card();return x}}
