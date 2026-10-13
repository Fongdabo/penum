/* ---------- 3.8.2: search box at the top of the menu ----------
   Type a page, a form or a word people use for it ("ปร.4", "สลิป", "WIR", "LG") and jump straight there.
   The index is every menu page and its sub-tabs, plus the everyday words for each. Only pages the person may open are listed. */
const SBSUB={'co.sales':'quote=ใบเสนอราคา|lead=งานที่กำลังติดตาม|cust=ลูกค้า','co.tender':'bid=ทำราคาประมูล|k=ค่า K (ปรับราคา)|tf=ตาราง Factor F',
  'pj.docs':'mat=วัสดุ/อุปกรณ์|shop=Shop Drawing|ms=Method Statement|calc=รายการคำนวณ|asb=As-built','pj.cost':'sum=สรุปงบประมาณ|plan=แผนงวดเงิน|bill=เบิกงวด|sub=ผู้รับเหมาช่วง|exp=ค่าใช้จ่ายอื่น',
  'pj.site':'daily=รายงานประจำวัน|rfi=RFI ปัญหาหน้างาน|vo=งานเพิ่มลด (VO)|safe=ตรวจความปลอดภัย|wp=ใบอนุญาตทำงาน|inc=อุบัติเหตุ','pj.qa':'wir=ขอตรวจงาน (WIR)|ncr=NCR|itp=แผนตรวจสอบ (ITP)',
  'pj.forms':'dn=ใบส่งของ|wo=ใบสั่งงาน|sc=สัญญาผู้รับเหมาช่วง|ho=ใบส่งมอบงาน','pj.hand':'tc=ทดสอบระบบ (T&C)|tab=ปรับสมดุลลม/น้ำ (TAB)|punch=Punch list|om=เอกสาร O&M|war=ประกันผลงาน',
  'pj.buy':'boq=รายการวัสดุจาก BOQ|pr=ใบขอซื้อและเทียบราคา|po=ใบสั่งซื้อ (PO)|dl=ติดตามของเข้าหน้างาน|stock=คลังวัสดุหน้างาน|ven=ผู้ขาย',
  'co.hr':'staff=พนักงานและจัดคนลงหน้างาน|ts=ลงเวลาทำงาน|leave=การลา|pay=เงินเดือนและสลิป|ben=สวัสดิการ|skill=สกิลชีต|eval=แบบประเมินทักษะ|prof=ค่าชำนาญวิชาชีพ|gap=แผนอบรม|rev=ประเมินและขึ้นเงินเดือน|band=โครงสร้างเงินเดือน|tool=เครื่องมือ',
  'co.acct':'ar=ลูกหนี้ (เงินรับ)|bn=ใบวางบิล|ap=เจ้าหนี้ (เงินจ่าย)|cf=กระแสเงินสด|vat=ภาษีซื้อ-ภาษีขาย|wht=ภาษีหัก ณ ที่จ่าย|lg=หนังสือค้ำประกัน',
  'co.svc':'job=งานซ่อมและนัด PM|con=สัญญาบำรุงรักษา|eqp=ทะเบียนเครื่องและประวัติ','co.org':'chart=ผังองค์กร|flow=ขั้นตอนงาน|forms=แบบฟอร์มและเอกสาร|env=ซองจดหมาย'};
// the words people actually type
const SBKW={'co.tender.bid':'ปร.4 ปร.5 ปร4 ปร5 factor f แฟกเตอร์ ประมูล ราคากลาง tender ประกวดราคา e-bidding','co.tender.k':'ค่า k ดัชนี escalation ปรับราคา เงินเพิ่ม','co.tender.tf':'factor f ค่าอำนวยการ กำไร',
  'co.hr.pay':'สลิป เงินเดือน payroll ประกันสังคม sso ภงด1 ภ.ง.ด.1 โอนเงิน ทวิ50','co.hr.ben':'สวัสดิการ เบิก เบี้ยเลี้ยง ค่าที่พัก ค่าโทรศัพท์ กองทุนสำรองเลี้ยงชีพ','co.hr.prof':'ค่าชำนาญ ข้อสอบ สอบวัดระดับ ใบประกอบ','co.hr.eval':'ska ประเมินทักษะ',
  'co.hr.rev':'ประเมินผลงาน kpi ขึ้นเงินเดือน โบนัส','co.hr.leave':'ลาป่วย ลากิจ พักร้อน','co.hr.ts':'ลงเวลา เข้างาน โอที ot','co.hr.tool':'เครื่องมือ ยืม คืน',
  'co.acct.lg':'lg ค้ำประกัน bank guarantee แบงก์การันตี bond','co.acct.vat':'vat ภาษีมูลค่าเพิ่ม ภพ30 ภ.พ.30','co.acct.wht':'50ทวิ ภงด3 ภงด53 หัก ณ ที่จ่าย','co.acct.ar':'ใบกำกับภาษี ใบเสร็จ invoice ลูกหนี้','co.acct.ap':'เจ้าหนี้ จ่ายเงิน','co.acct.cf':'cash flow เงินสด',
  'co.sales.quote':'quotation qt เสนอราคา','co.sales.lead':'ลูกค้าเป้าหมาย pipeline','pj.qa.wir':'wir ขอตรวจ inspection request','pj.qa.ncr':'ncr ข้อบกพร่อง non conformance','pj.qa.itp':'itp inspection test plan',
  'pj.sched':'gantt แกนต์ แผนงาน s-curve สเคิร์ฟ ไทม์ไลน์','pj.cost.bill':'เบิกงวด progress งวดงาน invoice','pj.cost.plan':'งวดเงิน','pj.site.daily':'daily report รายงานประจำวัน','pj.site.vo':'vo งานเพิ่ม งานลด variation','pj.site.rfi':'rfi',
  'pj.site.safe':'safety ความปลอดภัย จป','pj.site.wp':'work permit ใบอนุญาต','pj.buy.po':'po purchase order ใบสั่งซื้อ','pj.buy.pr':'pr ใบขอซื้อ เทียบราคา','pj.hand.tc':'t&c commissioning ทดสอบ','pj.hand.punch':'punch ข้อแก้ไข',
  'pj.forms.dn':'delivery note ใบส่งของ','pj.forms.ho':'ส่งมอบ handover','pj.docs':'shop drawing submittal เอกสารส่งอนุมัติ','pj.setup':'boq ข้อมูลโครงการ สัญญา','co.des':'mep bim ออกแบบ',
  'co.org.chart':'ผังองค์กร org chart','co.org.flow':'workflow ขั้นตอน flow','co.org.forms':'แบบฟอร์ม form เอกสารบริษัท','co.coset':'ตั้งค่า โลโก้ logo onedrive pin รหัสผ่าน สิทธิ์','co.exec':'แดชบอร์ด dashboard ภาพรวม'};
const sbNorm=s=>String(s||'').toLowerCase().replace(/[\s.\-_()/]+/g,'');
// a page listed under several departments opens under the one that owns it
const SBOWN={tender:'est',hr:'hr',buy:'pur',site:'pj',acct:'acct',sales:'sales'},SBOWN2={'pj.site.safe':'she','pj.site.wp':'she','pj.buy.stock':'store','pj.buy.dl':'store','co.hr.tool':'store'};
function sbIndex(){const out=[],seen=new Map();
  for(const v of DIVS)for(const d of divDepts(v))sbPages(d).forEach(pg=>{const key=pg[0]+'.'+pg[1],b0=[v[2].length>1?v[1]:'',d[1]].filter(Boolean),base=pg[2]?b0:[...b0,pg[3]];
    const add=(sub,label,path)=>{const id=key+'.'+(sub||''),own=SBOWN2[id]||SBOWN[pg[1]];if(seen.has(id)&&(d[0]!==own||seen.get(id).d===own))return;if(seen.has(id))out.splice(out.indexOf(seen.get(id)),1);const e={d:d[0],pg,sub,label,path,kw:sbNorm(label+' '+path.join(' ')+' '+(SBKW[key+'.'+sub]||'')+' '+(sub?'':SBKW[key]||''))};seen.set(id,e);out.push(e)};
    if(pg[2])add(pg[2],pg[3],[...b0,pg[3]]);else add('',pg[3],base);
    (SBSUB[key]||'').split('|').filter(Boolean).forEach(x=>{const [k,l]=x.split('=');if(key==='co.hr'&&!hrSubOk(k))return;add(k,l,[...base,l])})});
  return out}
let SBQ='',SBI=0;
function sbFind(q){const n=sbNorm(q);if(!n)return [];const L=sbIndex(),sc=x=>{const l=sbNorm(x.label);return l===n?0:l.startsWith(n)?1:l.includes(n)?2:3};
  return L.filter(x=>x.kw.includes(n)).sort((a,b)=>sc(a)-sc(b)).slice(0,9)}
function sbResHtml(){const R=sbFind(SBQ);if(!SBQ.trim())return '';SBI=Math.min(SBI,Math.max(0,R.length-1));
  return R.length?R.map((x,i)=>`<button type="button" class="sb-r${i===SBI?' hi':''}" data-a="sbGo" data-i="${i}"><b>${esc(x.label)}</b><small>${esc(x.path.join(' › '))}</small></button>`).join(''):'<p class="sb-none">ไม่พบ ลองพิมพ์คำอื่น เช่น ใบเสนอราคา, สลิป, WIR</p>'}
ACT.sbGo=b=>{const x=sbFind(SBQ)[+b.dataset.i||0];if(!x)return;const d=NAVD.find(z=>z[0]===x.d),L=sbPages(d),i=L.indexOf(x.pg);
  S.dept=d[0];S.dpage=S.dpage||{};S.dpage[d[0]]=i;pgGo(x.pg);if(x.sub)S.sub[x.pg[1]]=x.sub;SBQ='';SBI=0;ACT.sbClose();render();scrollTo({top:0})};
{const f=sbDraw;sbDraw=function(){const el=$('#side'),a=document.activeElement,foc=a&&a.id==='sbQ',pos=foc?a.selectionStart:null;f();if(!el||S.sbMini&&sbWide())return;
  const hd=el.querySelector('.sb-hd');hd.insertAdjacentHTML('afterend',`<div class="sb-s"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg><input id="sbQ" type="search" placeholder="ค้นหาหน้า เช่น ปร.4, สลิป, WIR" aria-label="ค้นหาหน้า" autocomplete="off" value="${esc(SBQ)}"><kbd>/</kbd></div><div class="sb-res" id="sbRes" role="listbox">${sbResHtml()}</div>`);
  el.classList.toggle('q',!!SBQ.trim());if(foc){const q=$('#sbQ');q.focus();try{q.setSelectionRange(pos,pos)}catch(e){}}}}
document.addEventListener('input',e=>{if(e.target.id!=='sbQ')return;SBQ=e.target.value;SBI=0;$('#sbRes').innerHTML=sbResHtml();$('#side').classList.toggle('q',!!SBQ.trim())});
document.addEventListener('keydown',e=>{const t=e.target;
  if(t.id==='sbQ'){const n=sbFind(SBQ).length;if(e.key==='Enter'){e.preventDefault();ACT.sbGo({dataset:{i:SBI}})}else if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();SBI=(SBI+(e.key==='ArrowDown'?1:n-1))%Math.max(1,n);$('#sbRes').innerHTML=sbResHtml()}
    else if(e.key==='Escape'){SBQ='';t.value='';$('#sbRes').innerHTML='';$('#side').classList.remove('q');t.blur()}return}
  // "/" or Ctrl+K from anywhere outside a text box jumps to the search
  if((e.key==='/'&&!/INPUT|TEXTAREA|SELECT/.test(t.tagName)&&!t.isContentEditable)||(e.key.toLowerCase()==='k'&&(e.ctrlKey||e.metaKey))){e.preventDefault();if(S.sbMini&&sbWide()){S.sbMini=false;render()}if(!sbWide())ACT.sbOpen();const q=$('#sbQ');if(q){q.focus();q.select()}}});
document.head.insertAdjacentHTML('beforeend',`<style>
.sb-s{position:relative;margin:2px 12px 8px}
.sb-s svg{position:absolute;left:11px;top:50%;width:16px;height:16px;transform:translateY(-50%);color:var(--muted);pointer-events:none}
.sb-s input{width:100%;box-sizing:border-box;padding:9px 34px 9px 34px;border-radius:12px;border:1px solid var(--line);background:var(--sunk);color:var(--ink);font:inherit;font-size:14px}
.sb-s input:focus{outline:2px solid color-mix(in srgb,var(--accent) 45%,transparent);background:var(--surface)}
.sb-s kbd{position:absolute;right:9px;top:50%;transform:translateY(-50%);font-size:11px;color:var(--muted);border:1px solid var(--line);border-radius:5px;padding:0 5px;line-height:17px}
.sb-res{display:none;padding:0 8px 8px;overflow:auto}
.side.q .sb-res{display:block;flex:1}.side.q .sb-tree,.side.q .sb-pj{display:none}
.sb-r{display:grid;width:100%;text-align:left;border:0;background:none;color:var(--ink);border-radius:11px;padding:8px 10px;cursor:pointer;font:inherit;gap:1px}
.sb-r b{font-size:14px}.sb-r small{font-size:12px;color:var(--muted)}
.sb-r:hover,.sb-r.hi{background:color-mix(in srgb,var(--accent) 13%,transparent)}.sb-r.hi b{color:var(--accent)}
.sb-none{margin:6px 10px;color:var(--muted);font-size:13px}
@media (max-width:${SBW-1}px){.sb-s kbd{display:none}}
</style>`);

