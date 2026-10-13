/* ---------- 3.48 safe "ล้างข้อมูลตัวอย่างออก" ----------
   The old clean-up matched records by name/number only (the sample has QT-001, so a real QT-001 matched) and then removed
   everything that pointed at a removed id, which took real bills and timesheets linked to sample staff or customers.
   Now:
   - records the sample loader creates are tagged (_dm on company records, demo on projects) and matched by that tag;
   - data loaded before the tag existed is matched only when the record is an exact copy of a sample record
     (ids and dates aside); a record that only shares a name is listed but left unticked;
   - nothing cascades: a record goes only if it is itself listed and ticked;
   - a sample record that real data still points at is listed unticked, with how many records use it;
   - the user sees the list with a checkbox per record before anything is removed, and a backup is downloaded first. */
document.head.insertAdjacentHTML('beforeend',`<style>
.dm-g{border:1px solid var(--line);border-radius:10px;margin:8px 0;padding:0}
.dm-g>summary{display:flex;gap:8px;align-items:center;padding:8px 10px;cursor:pointer;font-weight:600}
.dm-g>summary small{font-weight:400;color:var(--muted)}
.dm-l{max-height:240px;overflow:auto;padding:0 10px 8px}
.dm-r{display:flex;gap:8px;align-items:flex-start;padding:4px 0;border-top:1px dashed var(--line);font-size:13.5px}
.dm-r small{display:block;color:var(--muted)}.dm-r small.w{color:#B4533F}
#dmSum{font-weight:600;margin:8px 0 0}
</style>`);
// tag what the sample loader adds (only when it loads into this page's data; the button on a real company opens the sample tab instead)
{const f=ACT.loadDemo;ACT.loadDemo=function(b){if(b&&b.nodeType&&!DEMOPG)return f.apply(this,arguments);
  const seen=new Set(),pids=new Set(Object.keys(DB.projects));
  for(const k in DB.co){const A=DB.co[k];if(Array.isArray(A))A.forEach(x=>{if(x&&typeof x==='object')seen.add(x)})}
  const r=f.apply(this,arguments);
  for(const k in DB.co){const A=DB.co[k];if(Array.isArray(A))A.forEach(x=>{if(x&&typeof x==='object'&&!Array.isArray(x)&&!seen.has(x))x._dm=1})}
  Object.values(DB.projects).forEach(p=>{if(!pids.has(p.id))p.demo=1});DB.co.demoAt=new Date().toISOString();save();return r}}

// a record without its ids and dates, to tell an untouched copy of a sample record from a real one with the same name
const DM_ID=/^k[0-9a-z]{4,9}$/,DM_DT=/^\d{4}-\d\d-\d\d/;
function dmNorm(v){if(Array.isArray(v))return v.map(dmNorm);
  // maps keyed by record id (e.g. bill quantities per BOQ row) keep their values, sorted, without the keys
  if(v&&typeof v==='object'){const o={},byId=[];Object.keys(v).sort().forEach(k=>{if(k==='id'||k==='_dm'||k==='demo')return;const n=dmNorm(v[k]);if(n===undefined)return;const m=k.match(/^(.*?_?)k[0-9a-z]{4,9}$/);if(m&&(DM_ID.test(k)||m[1].endsWith('_')))byId.push(m[1]+JSON.stringify(n));else o[k]=n});
    if(byId.length)o['#']=byId.sort();return o}
  if(typeof v==='string'&&(DM_ID.test(v)||DM_DT.test(v)))return undefined;return v}
function dmSub(s,r){if(Array.isArray(s))return Array.isArray(r)&&s.length===r.length&&s.every((x,i)=>dmSub(x,r[i]));
  if(s&&typeof s==='object')return !!r&&typeof r==='object'&&!Array.isArray(r)&&Object.keys(s).every(k=>dmSub(s[k],r[k]));return s===r}
function dmRich(x){let n=0;const w=v=>{if(Array.isArray(v))v.forEach(w);else if(v&&typeof v==='object')Object.values(v).forEach(w);else if(typeof v==='string'&&v.trim().length>1)n++};w(dmNorm(x));return n}
const dmRefs=x=>{try{return (JSON.stringify(x).match(/"k[0-9a-z]{4,9}"/g)||[]).map(s=>s.slice(1,-1))}catch(e){return []}};
const DM_LBL={customers:'ลูกค้า',staff:'พนักงาน',quotes:'ใบเสนอราคา',leads:'งานขาย / ลูกค้าที่ติดตาม',tenders:'งานประมูล',ts:'ลงเวลาทำงาน',leave:'ใบลา',vendors:'ผู้ขาย / ผู้รับเหมาช่วง',
  pr:'ใบขอซื้อ',po:'ใบสั่งซื้อ',bills:'บิล',slips:'สลิป',inv:'ใบแจ้งหนี้',jobs:'ใบงานบริการ',assets:'เครื่องมือ / ทรัพย์สิน',lg:'หนังสือค้ำประกัน',lgLine:'วงเงินหนังสือค้ำประกัน',tools:'เครื่องมือ',toolLog:'ประวัติยืม-คืนเครื่องมือ',kidx:'ดัชนีค่า K',train:'การอบรม',docs:'เอกสาร'};

function demoScan(){const d=demoShape(),sFp={},sNm={},pFp={};
  if(d){for(const k in d.co){const A=d.co[k];if(!Array.isArray(A))continue;sFp[k]=A.filter(x=>x&&typeof x==='object').map(dmNorm);sNm[k]=new Set(A.map(DSIG).filter(Boolean))}
    Object.values(d.projects).forEach(p=>pFp[p.name]=dmNorm(p))}
  const copyOf=(S,x)=>{const n=dmNorm(x);return S.some(s=>dmSub(s,n))};
  const L=[];
  // lvl: tag (tagged at load) · fp (exact copy of a sample record) · weak (exact copy, but too little in it to be sure) · name (same name only)
  Object.values(DB.projects).forEach(p=>{let lvl='';if(p.demo||p._dm)lvl='tag';else if(pFp[p.name]!==undefined)lvl=dmSub(pFp[p.name],dmNorm(p))?'fp':'name';
    if(lvl)L.push({pj:1,k:'projects',x:p,id:p.id,lvl,lab:p.name||p.info&&p.info.name||'โครงการ'})});
  for(const k of Object.keys(DB.co)){if(['ai','tf'].includes(k))continue;const A=DB.co[k];if(!Array.isArray(A))continue;
    A.forEach(x=>{if(!x||typeof x!=='object'||Array.isArray(x))return;let lvl='';
      if(x._dm)lvl='tag';else if(sFp[k]&&copyOf(sFp[k],x))lvl=dmRich(x)>=3?'fp':'weak';else if(sNm[k]&&DSIG(x)&&sNm[k].has(DSIG(x)))lvl='name';
      if(lvl)L.push({k,x,id:x.id,lvl})})}
  const byId=new Map();L.forEach(r=>{if(r.id)byId.set(r.id,r);r.act=0});const inL=new Set(L.map(r=>r.x));
  // real use: a record that is not a sample copy (unlisted, or listed only by name) pointing at a listed record
  const use=x=>dmRefs(x).forEach(id=>{const r=byId.get(id);if(r&&r.x!==x)r.act++});
  Object.values(DB.projects).forEach(p=>{if(!inL.has(p))use(p)});
  for(const k of Object.keys(DB.co)){if(['ai','tf'].includes(k))continue;const A=DB.co[k];if(Array.isArray(A))A.forEach(x=>{if(x&&typeof x==='object'&&!inL.has(x))use(x)})}
  L.filter(r=>r.lvl==='name').forEach(r=>use(r.x));
  const nm=id=>{const C=DB.co;const s=(C.staff||[]).find(x=>x.id===id)||(C.customers||[]).find(x=>x.id===id)||DB.projects[id];return s?(s.name||''):''};
  L.forEach(r=>{if(!r.lab)r.lab=DSIG(r.x)||[r.x.date,nm(r.x.staff||r.x.sid||r.x.who||r.x.cust||r.x.proj)].filter(Boolean).join(' · ')||'(ไม่มีชื่อ)';
    r.on=(r.lvl==='tag'||r.lvl==='fp')&&!r.act;
    r.why=r.act?`มีข้อมูลจริงใช้อยู่ ${r.act} รายการ ไม่ติ๊กไว้ให้`:r.lvl==='name'?'ชื่อเหมือนตัวอย่าง แต่ข้อมูลต่างจากตัวอย่าง อาจเป็นข้อมูลจริง':r.lvl==='weak'?'คล้ายข้อมูลตัวอย่าง แต่ยืนยันไม่ได้ ตรวจก่อนติ๊ก':r.lvl==='tag'?'มากับข้อมูลตัวอย่าง':'ตรงกับข้อมูลตัวอย่างทุกช่อง'});
  return L}
let DMX=[];
const dmSum=()=>{const n=DMX.filter(r=>r.on).length,s=$('#dmSum');if(s)s.textContent=`เลือกไว้ ${n} จาก ${DMX.length} รายการ`;const b=$('#dlg [data-a="demoClearGo"]');if(b)b.disabled=!n};
ACT.demoClear=()=>{if(typeof licRO==='function'&&licRO()){toast('ข้อมูลเป็นแบบอ่านอย่างเดียว ต่ออายุสิทธิ์ก่อน');return}
  DMX=demoScan();if(!DMX.length){toast('ไม่พบข้อมูลตัวอย่างในบริษัทนี้');return}
  const G=[];DMX.forEach((r,i)=>{r.i=i;let g=G.find(g=>g.k===r.k);if(!g)G.push(g={k:r.k,r:[]});g.r.push(r)});
  G.sort((a,b)=>(a.k==='projects'?-1:0)-(b.k==='projects'?-1:0));
  dialog('ล้างข้อมูลตัวอย่าง: ตรวจรายการก่อนลบ',`<p class="hint" style="margin-top:0">ติ๊กเฉพาะรายการที่เป็นข้อมูลตัวอย่าง รายการที่มีข้อมูลจริงใช้อยู่ หรือชื่อซ้ำแต่ข้อมูลต่างไป จะไม่ถูกติ๊กไว้ให้ ระบบลบเฉพาะรายการที่ติ๊ก ไม่ลบรายการอื่นที่อ้างถึง และดาวน์โหลดไฟล์สำรองก่อนทุกครั้ง ข้อมูลบริษัท (ชื่อ โลโก้ PIN การตั้งค่า) ไม่ถูกแตะ</p>
    ${G.map(g=>{const on=g.r.filter(r=>r.on).length;return `<details class="dm-g"${on<g.r.length?' open':''}><summary><input type="checkbox" data-dmg="${esc(g.k)}"${on===g.r.length?' checked':''} aria-label="เลือกทั้งกลุ่ม"> ${esc(g.k==='projects'?'โครงการ':DM_LBL[g.k]||g.k)} <small>${g.r.length} รายการ</small></summary>
      <div class="dm-l">${g.r.map(r=>`<label class="dm-r"><input type="checkbox" data-dm="${r.i}"${r.on?' checked':''}><span>${esc(r.lab)}<small class="${r.on?'':'w'}">${esc(r.why)}</small></span></label>`).join('')}</div></details>`}).join('')}
    <p id="dmSum"></p>`,`<button type="button" class="btn pri" data-a="demoClearGo">ดาวน์โหลดไฟล์สำรอง แล้วลบที่เลือก</button>`);
  const d=$('#dlg');d.querySelectorAll('[data-dm]').forEach(c=>c.onchange=()=>{DMX[+c.dataset.dm].on=c.checked;const k=DMX[+c.dataset.dm].k,g=d.querySelector(`[data-dmg="${k}"]`);if(g)g.checked=DMX.filter(r=>r.k===k).every(r=>r.on);dmSum()});
  d.querySelectorAll('[data-dmg]').forEach(c=>{c.onclick=e=>e.stopPropagation();c.onchange=()=>{DMX.filter(r=>r.k===c.dataset.dmg).forEach(r=>{r.on=c.checked;const x=d.querySelector(`[data-dm="${r.i}"]`);if(x)x.checked=c.checked});dmSum()}});
  dmSum()};
ACT.demoClearGo=async()=>{const sel=DMX.filter(r=>r.on);if(!sel.length)return;
  if(!confirm(`ลบ ${sel.length} รายการที่เลือก? ระบบจะดาวน์โหลดไฟล์สำรองก่อน`))return;
  await ACT.backup();
  const gone=new Set(sel.filter(r=>!r.pj).map(r=>r.x));sel.filter(r=>r.pj).forEach(r=>delete DB.projects[r.id]);
  for(const k of Object.keys(DB.co)){const A=DB.co[k];if(Array.isArray(A)&&A.some(x=>gone.has(x)))DB.co[k]=A.filter(x=>!gone.has(x))}
  if(!Object.keys(DB.projects).length){const p=blankProject('โครงการแรก');DB.projects[p.id]=p}
  if(!DB.projects[DB.cur])DB.cur=Object.keys(DB.projects)[0];P=DB.projects[DB.cur];S.sel={};DMX=[];$('#dlg').close();save(true);render();
  toast(`ล้างข้อมูลตัวอย่างแล้ว ${sel.length} รายการ`)};

