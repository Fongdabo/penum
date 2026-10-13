/* ---------- 3.18: "คู่มือ ?" at the top right of every page ----------
   Opens this page's section of the manual in a new tab. Pages are named mode.tab.sub, the same names as the sidebar
   (e.g. co.sales.quote = ขายและใบเสนอราคา › ใบเสนอราคา, pj.cost.bill). help/index.json lists the sections that exist:
   {"co.sales.quote":"co.sales.quote.html", ...} (a value can also be {"url":..,"video":..}). A page without its own
   section falls back to its tab (co.sales), then to the manual's front page; with no manual yet it says so. */
const helpKey=()=>{const t=curTab(),s=S.sub&&S.sub[t];return S.mode+'.'+t+(s?'.'+s:'')};
let HELPIX;
async function helpIndex(){if(HELPIX!==undefined)return HELPIX;try{const r=await fetch('help/index.json',{cache:'no-cache'});HELPIX=r.ok?await r.json():null}catch(e){HELPIX=null}return HELPIX}
ACT.help=async()=>{const k=helpKey(),I=await helpIndex();
  const pick=I&&[k,k.split('.').slice(0,2).join('.'),'index'].map(x=>I[x]).find(Boolean);
  if(!pick){toast('คู่มือของหน้านี้กำลังจัดทำ');return}
  const u=typeof pick==='string'?pick:pick.url;window.open('help/'+u+(u.includes('#')?'':'#'+k),'penum-pm-help')};
{const put=()=>{if(document.getElementById('helpBtn'))return;const a=document.getElementById('moreMenu');
  if(a)a.insertAdjacentHTML('beforebegin',`<button type="button" id="helpBtn" class="bbtn help-btn" data-a="help" title="คู่มือการใช้งานหน้านี้">คู่มือ <b aria-hidden="true">?</b></button>`)};
  put();const r=render;render=function(){const x=r.apply(this,arguments);put();return x}}
document.head.insertAdjacentHTML('beforeend',`<style>
.help-btn b{display:inline-grid;place-items:center;width:18px;height:18px;border-radius:50%;border:1.5px solid currentColor;font-size:11px;font-weight:700;margin-left:4px}
@media (max-width:640px){.help-btn{padding-inline:10px}}
</style>`);
/* ---------- 3.19 privacy: ฝ่ายโครงการ assigns crew but never sees pay ---------- */
// Before this, any dept with co:['hr'] (PRJ) counted as full HR and saw wages, salary bands and reviews.
hrFull=function(){const u=me();if(!u)return true;const a=ACCESS[u.dept];return !a||a==='*'||u.dept==='HR'};
const hrCrew=()=>{const u=me(),a=u&&ACCESS[u.dept];return !!u&&!hrFull()&&!!a&&a!=='*'&&(a.co||[]).includes('hr')};
const CREW_TABS=[['staff','จัดคนลงหน้างาน'],['ts','ลงเวลาทำงาน'],['tool','เครื่องมือ']];
function hrSubOk(k){return hrFull()||['leave','eval','test','ot','quit'].includes(k)||(hrCrew()&&CREW_TABS.some(x=>x[0]===k))}
function hrCrewStaff(){const C=CO(),td=today(),act=C.staff.filter(s=>s.active!==false),by={};act.forEach(s=>by[s.proj||'']=(by[s.proj||'']||0)+1);
  const cols=[{k:'code',h:'รหัส',t:'calc',f:s=>esc(s.code||''),tv:s=>s.code||''},{k:'name',h:'ชื่อ-สกุล',t:'calc',f:s=>esc(s.name||''),tv:s=>s.name||''},{h:'ฝ่าย',t:'calc',f:s=>esc(crewDept(s.dept)),tv:s=>crewDept(s.dept)},{h:'ตำแหน่ง',t:'calc',f:s=>esc(s.role||''),tv:s=>s.role||''},
    {k:'proj',h:'ประจำโครงการ',t:'sel',w:170,o:()=>[['','– สำนักงาน –'],...projects().map(p=>[p.id,p.name])]},{h:'โทร',t:'calc',f:s=>esc(s.phone||''),tv:s=>s.phone||''},{h:'ใบอนุญาต/บัตรอบรม',t:'calc',f:s=>esc(s.lic||''),tv:s=>s.lic||''},
    {h:'',t:'calc',f:s=>okD(s.licExp)&&s.licExp<addD(td,60)?`<span class="pill ${s.licExp<td?'bad':'warn'}">${s.licExp<td?'บัตรหมดอายุ':'ใกล้หมดอายุ'}</span>`:''}];
  TABLES.crew={rows:()=>act,cols};
  return `<dl class="stats"><div><dt>พนักงานทั้งหมด</dt><dd>${act.length}</dd></div>${projects().filter(p=>by[p.id]).map(p=>`<div><dt>${esc(p.name)}</dt><dd>${by[p.id]} <small>คน</small></dd></div>`).join('')}<div><dt>สำนักงาน</dt><dd>${by['']||0} <small>คน</small></dd></div></dl>
  <section class="card"><h2><span>จัดคนลงหน้างาน</span><small>เลือก “ประจำโครงการ” ให้แต่ละคน ข้อมูลค่าจ้าง การเพิ่มหรือลบพนักงานเป็นงานของฝ่ายบุคคล</small><span class="sp"></span>${copyBtn('crew')}</h2>${gtable('co.staff',act,cols,{del:false})}</section>`}
const crewDept=c=>((SKILLS.depts||[]).find(d=>d.c===c)||{}).n||c||'';
function hrCrewTs(){return hrTs().replace('<th class="r">ค่าแรง</th>','').replace(/<td class="r">[^<]*<\/td><\/tr>/g,'</tr>').replace(' ค่าแรงลงโครงการที่พนักงานประจำอยู่ในวันนั้น','')}
{const sb=subTabs;subTabs=function(k,list){if(k==='hr'&&hrCrew()&&!list.some(x=>x[0]==='staff'))list=[...CREW_TABS,...list];return sb(k,list)}}
{const f=CVIEWS.hr;CVIEWS.hr=()=>{if(!hrCrew())return f();const c=S.sub.hr,V={staff:hrCrewStaff,ts:hrCrewTs,tool:hrTool};
  if(!c||V[c]){const h=hrTabs();return h+V[S.sub.hr||'staff']()}
  if(!hrSubOk(c)&&!['myslip','pcme'].includes(c))S.sub.hr='staff';
  return S.sub.hr==='staff'?hrTabs()+hrCrewStaff():f()}}
/* ---------- 3.19 phones: header scrolls away and fits in three short rows; daily list scrolls sideways ---------- */
{const f=siteDaily;siteDaily=function(){return f().replace('<table><thead><tr><th>วันที่</th><th>อากาศ</th>','<table class="dl-list"><thead><tr><th>วันที่</th><th>อากาศ</th>')}}
document.head.insertAdjacentHTML('beforeend',`<style>
@media (max-width:600px){
.band{position:relative!important;top:auto!important;padding:10px 12px 10px!important}
.band .brand{row-gap:8px!important}
.band .proj{gap:6px!important;flex-wrap:wrap;align-items:center}
.band #cloudBtn{font-size:13px;padding:6px 10px;min-height:34px}
.band #userSel{flex:1 1 170px;max-width:none;min-width:0;padding:6px 8px;min-height:34px}
.band .theme button{width:28px!important;height:26px;padding:0!important;display:inline-grid;place-items:center}
.band #helpBtn{font-size:0;padding:6px 8px;min-height:34px}.band #helpBtn b{font-size:13px}
.band #moreMenu>summary{min-height:34px;padding:6px 10px}
#langSw .lg-t{display:none}#langSw>summary{min-height:34px;padding:4px 8px}
.dl-list{min-width:560px}.dl-list td:nth-child(4){min-width:210px}.dl-list td:first-child,.dl-list td:nth-child(2){white-space:nowrap}
}</style>`);
/* ---------- 3.19 หน้าแรก for staff: people without the company dashboard get their own start page ---------- */
const mineOk=()=>{const u=me();if(!u)return false;const a=ACCESS[u.dept];return !!a&&a!=='*'&&!((a.co||[]).includes('exec'))};
{const f=allowed;allowed=function(mode,tab){if(mode==='co'&&tab==='mine')return mineOk();return f(mode,tab)}}
COTABS.unshift(['mine','หน้าแรกของฉัน']);
{const h=NAVD.find(d=>d[0]==='home');if(h)h[2].push(['co','mine','','หน้าแรกของฉัน'])}
CVIEWS.mine=()=>{const u=me();if(!u)return '';const Q=typeof myQueue==='function'?myQueue():[],
    A=alerts().filter(a=>a.go&&allowed(a.go.m,a.go.k)),pj=u.proj&&DB.projects[u.proj],
    btn=(l,m,k,s,p)=>`<button type="button" class="btn" data-a="go" data-m="${m}" data-k="${k}"${s?` data-s="${s}"`:''}${p?` data-p="${p}"`:''}>${l}</button>`;
  return `<section class="card"><h2><span>สวัสดี ${esc(u.name||'')}</span><small>${esc(u.role||'')}${pj?' · ประจำ '+esc(pj.name):''}</small></h2>
  <div class="row" style="flex-wrap:wrap;gap:8px">${pj?btn('งานของโครงการ','pj','dash','',pj.id)+btn('รายงานประจำวัน','pj','site','daily',pj.id):''}${btn('ยื่นใบลา','co','hr','leave')}${btn('สลิปและสวัสดิการของฉัน','co','hr','myslip')}${btn('สอบวัดระดับของฉัน','co','hr','test')}<button type="button" class="btn" data-a="helpAll">คู่มือการใช้งาน</button></div></section>`
  +(alertCard(A,'ต้องดูวันนี้')||'<section class="card"><p class="hint" style="margin:0">วันนี้ยังไม่มีเรื่องที่ต้องตามในส่วนงานของคุณ</p></section>')};
/* ---------- 3.19 the whole manual: เมนู › คู่มือการใช้งาน opens the manual's front page ---------- */
ACT.helpAll=async()=>{const I=await helpIndex(),pick=I&&I.index;if(!pick){toast('คู่มือกำลังจัดทำ');return}const u=typeof pick==='string'?pick:pick.url;window.open('help/'+u,'penum-pm-help')};
{const put=()=>{const m=document.querySelector('#moreMenu .menu');if(!m||m.querySelector('[data-a="helpAll"]'))return;m.insertAdjacentHTML('afterbegin','<button type="button" data-a="helpAll">คู่มือการใช้งาน (ทั้งเล่ม)</button><hr>')};
  put();const r=render;render=function(){const x=r.apply(this,arguments);put();return x}}
// a drop-down menu near the screen edge (เมนู, ภาษา on a phone) is nudged back inside the screen
document.addEventListener('toggle',e=>{const d=e.target;if(!d.open||!d.classList||!d.classList.contains('more'))return;const m=d.querySelector(':scope>.menu');if(!m)return;
  m.style.left='';m.style.right='';m.style.maxWidth='calc(100vw - 16px)';const r=m.getBoundingClientRect(),dr=d.getBoundingClientRect(),W=document.documentElement.clientWidth;
  if(r.right>W-8||r.left<8){const x=Math.max(8,Math.min(W-8-r.width,r.left));m.style.left=(x-dr.left)+'px';m.style.right='auto'}},true);
