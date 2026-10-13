/* ---------- round 2.6: one row of department tabs instead of the company / project switch ---------- */
// each department lists its pages as [mode, tab, sub, label]; a page with a sub opens that sub-tab
const NAVD=[
  ['home','หน้าแรก',[['co','exec','','แดชบอร์ดบริษัท']]],
  ['sales','ขาย',[['co','sales','','ขายและใบเสนอราคา']]],
  ['est','ประมาณราคา',[['pj','setup','','BOQ และข้อมูลโครงการ'],['co','sales','quote','ใบเสนอราคา']]],
  ['des','ออกแบบ',[['co','des','','PENUM MEP และ BIM'],['pj','docs','','เอกสารส่งอนุมัติ']]],
  ['pj','โครงการ',TABS.filter(t=>t[0]!=='buy').map(([k,l])=>['pj',k,'',l])],
  ['pur','จัดซื้อ',[['pj','buy','','จัดซื้อและวัสดุ']]],
  ['store','สโตร์',[['pj','buy','stock','วัสดุหน้างาน'],['pj','buy','dl','รับของเข้า'],['co','hr','tool','เครื่องมือ']]],
  ['acct','บัญชี',[['co','acct','','บัญชีการเงิน']]],
  ['hr','บุคคล',[['co','hr','','บุคคลและแรงงาน']]],
  ['svc','บริการ',[['co','svc','','บริการหลังการขาย']]],
  ['she','ความปลอดภัย',[['pj','site','safe','ตรวจความปลอดภัย'],['pj','site','wp','ใบอนุญาตทำงาน']]],
  ['org','องค์กร/เอกสาร',[['co','org','','องค์กรและเอกสาร']]],
  ['set','ตั้งค่า',[['co','coset','','ตั้งค่าบริษัท']]]];
Object.assign(ICO,{home:'<path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/><path d="M10 20v-6h4v6"/>',
  est:'<rect x="4" y="2" width="16" height="20" rx="2"/><path d="M8 6h8M8 10h2M14 10h2M8 14h2M14 14h2M8 18h2M14 18h2"/>',
  des:'<path d="M12 19l7-7 3 3-7 7-3-3z"/><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/><path d="M2 2l7.6 7.6"/><circle cx="11" cy="11" r="2"/>',
  pj:'<path d="M2 20h20M5 20V8l7-5 7 5v12"/><path d="M9 20v-5h6v5M9 10h6"/>',
  pur:ICO.buy,store:'<path d="M21 8l-9-5-9 5v8l9 5 9-5z"/><path d="M3 8l9 5 9-5M12 13v8"/>',
  she:'<path d="M12 2l8 3v6c0 5-3.5 9-8 11-4.5-2-8-6-8-11V5z"/><path d="M9 12l2 2 4-4"/>',set:ICO.coset});
{const f=allowed;allowed=function(mode,tab){return mode==='co'&&tab==='des'?true:f(mode,tab)}}
const pgOk=pg=>allowed(pg[0],pg[1])&&(pg[1]!=='hr'||pg[2]!=='tool'||hrFull());
const deptOk=d=>d[2].some(pgOk);
const pgOn=(pg,strict)=>S.mode===pg[0]&&(pg[0]==='co'?S.ctab:S.tab)===pg[1]&&(!strict||!pg[2]||S.sub[pg[1]]===pg[2]);
function deptSync(){const cur=NAVD.find(d=>d[0]===S.dept);if(cur&&deptOk(cur)&&cur[2].some(pg=>pgOn(pg)&&pgOk(pg)))return;
  const C=NAVD.filter(d=>deptOk(d)&&d[2].some(pg=>pgOn(pg,true)&&pgOk(pg)));const L=C.length?C:NAVD.filter(d=>deptOk(d)&&d[2].some(pg=>pgOn(pg)&&pgOk(pg)));
  const d=(S.mode==='pj'&&L.find(x=>x[0]==='pj'))||L[0];if(d)S.dept=d[0]}
function pgGo(pg){S.mode=pg[0];if(pg[0]==='co')S.ctab=pg[1];else S.tab=pg[1];if(pg[2])S.sub[pg[1]]=pg[2]}
ACT.dept=b=>{const d=NAVD.find(x=>x[0]===b.dataset.k);if(!d)return;S.dept=d[0];S.dpage=S.dpage||{};const L=d[2].filter(pgOk),pg=L[S.dpage[d[0]]|0]||L[0];if(pg)pgGo(pg);render();scrollTo({top:0})};
ACT.page=b=>{const d=NAVD.find(x=>x[0]===S.dept);if(!d)return;const L=d[2].filter(pgOk),i=+b.dataset.i,pg=L[i];if(!pg)return;S.dpage=S.dpage||{};S.dpage[d[0]]=i;pgGo(pg);render();scrollTo({top:0})};
// first visit, or a device that still remembers the old switch: start on the company dashboard
if(!S.dept){S.dept='home';S.mode='co';S.ctab='exec'}
CVIEWS.des=()=>`<section class="card"><h2><span>งานออกแบบ</span><small>คำนวณโหลด ออกแบบระบบ ทำแบบ BIM และถอด BOQ ทำในโปรแกรม PENUM MEP และ PENUM BIM ผลที่ได้ส่งต่อเข้ามาที่นี่เป็น BOQ ของโครงการและใบเสนอราคา</small></h2>
  <div class="dgo"><a class="dgo-c" href="../mep/" target="penum-mep"><b>PENUM MEP</b><span>คำนวณโหลดความร้อน ขนาดท่อลม ท่อน้ำ ระบบไฟฟ้า และ BOQ พร้อมราคา</span></a><a class="dgo-c" href="../bim/" target="penum-bim"><b>PENUM BIM</b><span>แบบสามมิติ ผนัง พื้น หลังคา ระบบ MEP ในอาคาร และแบบพิมพ์</span></a>
  <button type="button" class="dgo-c" data-a="go" data-m="pj" data-k="docs"><b>เอกสารส่งอนุมัติ</b><span>Shop Drawing, Method Statement, รายการคำนวณ และผลอนุมัติจากที่ปรึกษา</span></button>
  <button type="button" class="dgo-c" data-a="go" data-m="pj" data-k="setup"><b>BOQ ของโครงการ</b><span>ดึง BOQ จาก PENUM MEP เข้าโครงการ เพื่อทำแผนงาน จัดซื้อ และเบิกงวด</span></button></div></section>`;
{const r=render;render=function(){r.apply(this,arguments);deptSync();
  const sv=a=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${a||''}</svg>`;
  $('#tabs').innerHTML=NAVD.filter(deptOk).map(([k,l])=>`<button type="button" role="tab" data-a="dept" data-k="${k}" aria-selected="${k===S.dept}">${sv(ICO[k])}${l}</button>`).join('');
  {const T=$('#tabs'),a=T.querySelector('[aria-selected="true"]');if(a&&T.scrollWidth>T.clientWidth)T.scrollLeft=Math.max(0,a.offsetLeft-T.clientWidth/2+a.offsetWidth/2)}
  const d=NAVD.find(x=>x[0]===S.dept),L=d?d[2].filter(pgOk):[];
  let on=L.findIndex(pg=>pgOn(pg,true));if(on<0)on=L.findIndex(pg=>pgOn(pg));
  if(L.length>1)$('#view').insertAdjacentHTML('afterbegin',`<nav class="pages" role="tablist" aria-label="${esc(d[1])}">${L.map((pg,i)=>`<button type="button" role="tab" data-a="page" data-i="${i}" aria-selected="${i===on}">${d[0]==='pj'?sv(ICO[pg[1]]):''}${esc(pg[3])}</button>`).join('')}</nav>`);
  document.body.dataset.dept=S.dept||'';saveUI()}}
// an empty company starts on the dashboard, so the first steps live here too
{const f=CVIEWS.exec;CVIEWS.exec=()=>{const empty=!CO().customers.length&&!projects().some(p=>p.boq.items.length||p.tasks.length);
  return (empty?`<section class="card"><h2><span>เริ่มต้นใช้งาน</span><small>${projects().length?'ยังไม่มีลูกค้า BOQ หรือแผนงานในโครงการ เริ่มจากใส่ข้อมูลโครงการแรก หรือดูตัวอย่างก่อน':'ยังไม่มีโครงการในเครื่องนี้'}</small></h2><div class="row">${projects().length?`<button type="button" class="btn pri" data-a="go" data-m="pj" data-k="setup" data-p="${projects()[0].id}">ใส่ข้อมูลโครงการ ${esc(projects()[0].name)}</button>`:`<button type="button" class="btn pri" data-a="newProj">+ สร้างโครงการแรก</button>`}<button type="button" class="btn" data-a="loadDemo">เปิดโครงการตัวอย่าง</button><button type="button" class="btn" data-a="go" data-m="co" data-k="coset">ตั้งค่าบริษัท</button></div></section>`:'')+f()}}

