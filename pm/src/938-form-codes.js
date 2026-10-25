/* ---------- 4.59: a form code on every printed document (ISO style) ----------
   Each kind of printout gets a form code, a revision and the date that revision took effect, printed small in the top
   right corner of the document's header, like the company's own forms (HR-SK-0x, OE-SL-01…). The codes are
   <prefix>-<department>-<number>: FM-SL-01 ใบเสนอราคา, FM-PU-02 ใบสั่งซื้อ… The skill system keeps its HR-SK codes.
   องค์กรและเอกสาร → ทะเบียนแบบฟอร์ม lists every form: change the code, Rev and date there, or the prefix for all of them.
   The code is found from the document's title after it is printed into #print, so every way of printing gets it
   (one document, the claim set with several, a quotation in English). Government forms (ปร.4–6, 50 ทวิ, ภ.ง.ด.1),
   payslips, envelopes and charts are left without one. Placed absolutely in the blank band above the header, it never
   changes the page layout, so the one-page fits stay as they were. */
const FM_D0='2026-10-25';
const FM_DEP=[['SL','ฝ่ายขาย'],['ES','ฝ่ายประมาณราคา'],['PU','ฝ่ายจัดซื้อ'],['PJ','ฝ่ายโครงการ'],['QC','ควบคุมคุณภาพ (QA/QC)'],['SH','ความปลอดภัย'],
  ['AC','ฝ่ายบัญชีและการเงิน'],['SV','ฝ่ายบริการหลังการขาย'],['LG','สัญญา'],['HR','ฝ่ายบุคคล'],['DC','ควบคุมเอกสาร']];
// [id, department, number or a fixed code, name, title pattern]; the first pattern that matches the printed title wins
const FM_LIST=[
  ['qtma','SL',2,'ใบเสนอราคาบริการ (สัญญาบำรุงรักษา)',/^ใบเสนอราคาบริการ|^Service Quotation/i],
  ['qt','SL',1,'ใบเสนอราคา',/^ใบเสนอราคา|^Quotation/i],
  ['boq','SL',3,'ใบแจ้งปริมาณงาน (BOQ)',/ปริมาณงาน|^BOQ/],
  ['qcost','SL',4,'ราคาทุนและกำไร (ฉบับภายใน)',/^ราคาทุนและกำไร/],
  ['tdsum','ES',1,'สรุปการทำราคาประมูล',/ราคาประมูล/],
  ['pr','PU',1,'ใบขอซื้อ / ตารางเปรียบเทียบราคา',/^ใบขอซื้อ/],
  ['po','PU',2,'ใบสั่งซื้อ (PO)',/^ใบสั่งซื้อ/],
  ['dn','PU',3,'ใบส่งของ',/^ใบส่งของ/],
  ['wo','PJ',1,'ใบสั่งงาน',/^ใบสั่งงาน/],
  ['daily','PJ',2,'รายงานการปฏิบัติงานประจำวัน',/ประจำวัน/],
  ['vo','PJ',3,'ใบขออนุมัติงานเพิ่ม-ลด (VO)',/งานเพิ่ม-ลด/],
  ['ho','PJ',4,'ใบส่งมอบงาน',/^ใบส่งมอบงาน/],
  ['rfi','PJ',5,'แบบขอข้อมูลเพิ่มเติม (RFI)',/ขอข้อมูลเพิ่มเติม|RFI/],
  ['sched','PJ',6,'แผนงานโครงการ',/^แผนงานโครงการ/],
  ['la','PJ',7,'แผนงาน 3 สัปดาห์ล่วงหน้า',/3 สัปดาห์/],
  ['mp','PJ',8,'กราฟกำลังคน',/กำลังคน/],
  ['subm','PJ',9,'ทะเบียนเอกสารส่งอนุมัติ',/ทะเบียนเอกสารส่งอนุมัติ/],
  ['trans','PJ',10,'ใบนำส่งเอกสาร (Transmittal)',/^ใบนำส่งเอกสาร/],
  ['punch','PJ',11,'รายการงานค้างแก้ไข (Punch list)',/งานค้างแก้ไข/],
  ['tc','PJ',12,'รายงานการทดสอบและเดินระบบ',/ทดสอบและเดินระบบ/],
  ['tab','PJ',13,'รายงานการปรับสมดุลลมและน้ำ (TAB)',/ปรับสมดุล/],
  ['itp','QC',1,'แผนการตรวจสอบและทดสอบ (ITP)',/^แผนการตรวจสอบและทดสอบ/],
  ['wir','QC',2,'คำขอตรวจงาน (WIR)',/^คำขอตรวจงาน/],
  ['ncr','QC',3,'รายงานงานไม่เป็นไปตามข้อกำหนด (NCR)',/ไม่เป็นไปตามข้อกำหนด/],
  ['safe','SH',1,'แบบตรวจความปลอดภัยหน้างาน',/ตรวจความปลอดภัย/],
  ['wp','SH',2,'ใบอนุญาตทำงาน (Work permit)',/^ใบอนุญาตทำงาน/],
  ['bn','AC',1,'ใบวางบิล',/^ใบวางบิล/],
  ['iv','AC',2,'ใบแจ้งหนี้ / ใบกำกับภาษี',/ใบกำกับภาษี|^ใบแจ้งหนี้/],
  ['rc','AC',3,'ใบเสร็จรับเงิน',/^ใบเสร็จรับเงิน/],
  ['adv','AC',11,'ใบเบิกเงินทดรอง',/^ใบเบิกเงินทดรอง/],
  ['pc','AC',12,'ใบเบิกเงินสดย่อย',/^ใบเบิกเงินสดย่อย/],
  ['pcr','AC',13,'ใบเบิกชดเชยเงินสดย่อย',/ชดเชยเงินสดย่อย/],
  ['bill','AC',4,'ใบเบิกเงินงวดงาน / เงินล่วงหน้า / คืนเงินประกัน',/^ใบเบิกเงิน/],
  ['csum','AC',5,'ใบสรุปผลงานประจำงวด',/^ใบสรุปผลงาน/],
  ['cert','AC',6,'ใบรับรองผลงาน (Payment Certificate)',/^ใบรับรองผลงาน/],
  ['pp','AC',7,'Progress Payment (แผนเบิกงวดงาน)',/^PROGRESS PAYMENT/],
  ['cph','AC',8,'รูปถ่ายผลงานประจำงวด',/^รูปถ่ายผลงาน/],
  ['kval','AC',9,'การคำนวณค่า K',/^การคำนวณค่า K/],
  ['klet','AC',10,'หนังสือขอรับเงิน / แจ้งผลค่า K',/^หนังสือ.*ค่า K/],
  ['lgreg','AC',14,'ทะเบียนหนังสือค้ำประกัน',/^ทะเบียนหนังสือค้ำประกัน/],
  ['lgreq','AC',15,'หนังสือขอให้ออกหนังสือค้ำประกัน',/ขอให้ออกหนังสือค้ำประกัน/],
  ['vat','AC',16,'รายงานภาษีขาย และ รายงานภาษีซื้อ',/^รายงานภาษีขาย/],
  ['job','SV',1,'ใบงานบริการ',/^ใบงานบริการ/],
  ['pmrep','SV',2,'รายงานผลการบำรุงรักษาเชิงป้องกัน (PM)',/บำรุงรักษาเชิงป้องกัน/],
  ['sc','LG',1,'สัญญาจ้างผู้รับเหมาช่วง',/สัญญาจ้างผู้รับเหมาช่วง/],
  ['app','HR',1,'ใบสมัครงาน',/^ใบสมัครงาน/],
  ['offer','HR',2,'หนังสือเสนองาน',/^หนังสือเสนองาน/],
  ['rs','HR',3,'ใบลาออก / ใบแจ้งพ้นสภาพ',/^ใบ(ลาออก|แจ้งพ้นสภาพ)/],
  ['ot','HR',4,'ใบขอทำงานล่วงเวลา (OT)',/ทำงานล่วงเวลา/],
  ['leave','HR',5,'ใบลา',/^ใบลา/],
  ['hsal','HR',6,'หนังสือรับรองเงินเดือน',/รับรองเงินเดือน/],
  ['hwork','HR',7,'หนังสือรับรองการทำงาน',/รับรองการทำงาน/],
  ['hwarn','HR',8,'หนังสือเตือน',/^หนังสือเตือน/],
  ['sso','HR',9,'รายละเอียดการนำส่งเงินสมทบประกันสังคม',/ประกันสังคม/],
  ['rev','HR',10,'ทะเบียนผลประเมินประจำปี',/^ทะเบียนผลประเมิน/],
  ['skill','HR','HR-SK-01','แบบประเมินทักษะ',/^แบบประเมินทักษะ/],
  ['idp','HR','HR-SK-02','แผนพัฒนารายบุคคล (IDP)',/แผนพัฒนารายบุคคล/],
  ['perf','HR','HR-SK-03','แบบประเมินผลการปฏิบัติงานประจำปี',/^แบบประเมินผลการปฏิบัติงาน/],
  ['band','HR','HR-SK-05','โครงสร้างเงินเดือน',/^โครงสร้างเงินเดือน/],
  ['ptest','HR','HR-SK-08','ผลสอบวัดระดับ',/^ผลสอบวัดระดับ/],
  ['fmreg','DC',1,'ทะเบียนแบบฟอร์ม (Master list)',/^ทะเบียนแบบฟอร์ม/]];
// the company's settings: on/off, prefix, one effective date for every form, and per form {c:code, r:Rev, d:date, off}
function fmCfg(){const C=CO();if(!C.fm||typeof C.fm!=='object')C.fm={};const F=C.fm;if(F.on==null)F.on=true;if(F.pfx==null)F.pfx='';if(F.d0==null)F.d0='';
  if(!F.L||typeof F.L!=='object')F.L={};FM_LIST.forEach(([id])=>{if(!F.L[id]||typeof F.L[id]!=='object')F.L[id]={c:'',r:'',d:'',off:false}});return F}
const fmPfx=()=>{const p=String(((CO()||{}).fm||{}).pfx||'').trim().replace(/-+$/,'');return p||'FM'};
const fmDef=e=>typeof e[2]==='string'?e[2]:`${fmPfx()}-${e[1]}-${String(e[2]).padStart(2,'0')}`;
function fmOf(e){const F=(CO()||{}).fm||{},x=(F.L||{})[e[0]]||{};return {c:String(x.c||'').trim()||fmDef(e),r:String(x.r==null||x.r===''?'0':x.r).trim(),d:okD(x.d)?x.d:okD(F.d0)?F.d0:FM_D0,off:!!x.off}}
const fmOn=()=>{const F=(CO()||{}).fm;return !F||F.on!==false};
// dd/mm/yy: Buddhist year on Thai documents, Christian year on English ones
function fmDate(d,en){if(!okD(d))return '';const [y,m,dd]=d.split('-');return `${dd}/${m}/${String(en?+y:+y+543).slice(-2)}`}
const fmText=(e,en)=>{const v=fmOf(e),d=fmDate(v.d,en);return `${v.c} Rev.${v.r}${d?` (${d})`:''}`};
const fmFind=t=>{t=String(t||'').replace(/\s+/g,' ').trim();return t?FM_LIST.find(e=>e[4].test(t)):null};
// the title that goes with a header: ORIEN header → its title band; quotation → its own title; PP sheet; internal cost sheet
function fmTitle(a){const tx=el=>el?el.textContent.replace(/\s+/g,' ').trim():'';
  if(a.classList.contains('oh')){const o=a.nextElementSibling;return o&&o.classList.contains('ot')?tx(o.querySelector('.ot-t h1')):''}
  if(a.classList.contains('qm-h')){const q=a.closest('.qm');return q?tx(q.querySelector('.qm-tt h1')):''}
  if(a.classList.contains('pp-h'))return 'PROGRESS PAYMENT';
  return tx(a.querySelector('h1'))}
function fmStamp(root){if(!root||!fmOn())return;
  root.querySelectorAll('.oh,.qm-h,.pp-h,.obi').forEach(a=>{if(a.closest('.fs-paper')||a.querySelector(':scope>.fmc'))return;
    const t=fmTitle(a),e=fmFind(t);if(!e||fmOf(e).off)return;
    const s=document.createElement('span');s.className='fmc';s.textContent=fmText(e,/^[A-Za-z]/.test(t)&&!/^PROGRESS/.test(t));a.classList.add('fmh');a.insertBefore(s,a.firstChild)})}
document.head.insertAdjacentHTML('beforeend',`<style>
#print .fmh{position:relative}
#print .fmc{position:absolute;top:-5.2mm;right:0;font-size:8px;line-height:1.2;font-weight:400;color:#5F737B;letter-spacing:.02em;white-space:nowrap;font-family:inherit}
#print .obi>.fmc{top:-4mm}
#print .qm-h>.fmc{top:-8.6mm}
.fmr{width:100%;table-layout:fixed}.fmr td input{width:100%;min-width:0;box-sizing:border-box}.fmr td input[type=checkbox]{width:auto}.fmr .btn{white-space:nowrap}.fmr td small{display:block;margin-top:2px}.fmr td.c{text-align:center}.fmr .muted{font-size:12px}
</style>`);
{const el=$('#print');if(el){new MutationObserver(()=>{try{fmStamp(el)}catch(e){}}).observe(el,{childList:true});window.addEventListener('beforeprint',()=>{try{fmStamp(el)}catch(e){}})}}

/* --- องค์กรและเอกสาร → ทะเบียนแบบฟอร์ม: every form with its code, Rev and date --- */
const fmCan=()=>typeof esAdmin==='function'?esAdmin():true;
function fmPage(){const F=fmCfg(),ro=fmCan()?'':' disabled',b='co.fm';
  const row=e=>{const v=fmOf(e),x=F.L[e[0]],p=`${b}.L.${e[0]}`;
    return `<tr><td>${esc(e[3])}</td><td><input data-p="${p}.c" value="${esc(x.c||'')}" placeholder="${esc(fmDef(e))}" aria-label="รหัส ${esc(e[3])}"${ro}></td>
      <td><input data-p="${p}.r" value="${esc(x.r||'')}" placeholder="0" aria-label="Rev ${esc(e[3])}"${ro}></td>
      <td><input type="date" data-p="${p}.d" value="${esc(x.d||'')}" aria-label="วันที่ประกาศใช้ ${esc(e[3])}"${ro}><small class="muted">${x.d?'':thD(v.d)}</small></td>
      <td class="c"><input type="checkbox" data-t="chk" data-p="${p}.off"${x.off?' checked':''} aria-label="ไม่พิมพ์รหัส ${esc(e[3])}"${ro}></td>
      <td><code>${esc(fmText(e))}</code></td>
      <td>${ro?'':`<button type="button" class="btn sm ghost" data-a="fmRev" data-id="${e[0]}" title="แก้แบบฟอร์มแล้ว: Rev +1 และวันที่เป็นวันนี้">Rev +1</button>`}</td></tr>`};
  return `<section class="card"><h2><span>ทะเบียนแบบฟอร์ม (รหัสแบบฟอร์ม ISO)</span><small>รหัส Rev และวันที่ประกาศใช้ พิมพ์ตัวเล็กที่มุมขวาบนของเอกสารทุกใบที่ออกจากโปรแกรม ช่องว่าง = ใช้ค่าเริ่มต้น (ตัวจาง)</small><span class="sp"></span>
    <button type="button" class="btn sm" data-a="print" data-k="fmreg" data-id="">พิมพ์ทะเบียนแบบฟอร์ม</button></h2>
  <div class="form"><label><span><input type="checkbox" data-t="chk" data-p="${b}.on"${F.on!==false?' checked':''}${ro}> พิมพ์รหัสแบบฟอร์มบนเอกสาร</span></label>
    <label>คำนำหน้ารหัส<input data-p="${b}.pfx" value="${esc(F.pfx||'')}" placeholder="FM" style="max-width:120px"${ro}><small class="muted">เช่น FM → FM-SL-01, OE → OE-SL-01 (ชุดแบบฟอร์ม ORIEN)</small></label>
    <label>วันที่ประกาศใช้ (ทุกแบบที่ไม่ได้ใส่วันที่เอง)<input type="date" data-p="${b}.d0" value="${esc(F.d0||'')}"${ro}><small class="muted">${F.d0?'':'ค่าเริ่มต้น '+thD(FM_D0)}</small></label></div>
  ${FM_DEP.map(([d,dn])=>{const L=FM_LIST.filter(e=>e[1]===d);return L.length?`<h3 class="fm-g">${esc(dn)} (${d})</h3><div class="tw"><table class="fmr"><thead><tr><th>เอกสาร</th><th style="width:140px">รหัส</th><th style="width:64px">Rev</th><th style="width:160px">วันที่ประกาศใช้</th><th style="width:64px">ไม่พิมพ์</th><th style="width:230px">พิมพ์บนเอกสารว่า</th><th style="width:84px"></th></tr></thead><tbody>${L.map(row).join('')}</tbody></table></div>`:''}).join('')}
  <p class="hint" style="margin-top:10px">แก้ไขแบบฟอร์มเมื่อไร กด Rev +1 ให้เลขฉบับและวันที่ประกาศใช้เปลี่ยนตาม · แบบฟอร์มราชการ (ปร.4–ปร.6, 50 ทวิ, ภ.ง.ด.1) สลิปเงินเดือน ซองจดหมาย และผังต่าง ๆ ไม่ใส่รหัส${ro?' · แก้ได้เฉพาะผู้ดูแลระบบ':''}</p></section>`}
ACT.fmRev=b=>{if(!fmCan())return;const e=FM_LIST.find(x=>x[0]===b.dataset.id);if(!e)return;const F=fmCfg(),x=F.L[e[0]],r=parseInt(fmOf(e).r,10);
  x.r=String(isNaN(r)?1:r+1);x.d=today();save();render();toast(`${e[3]}: ${fmText(e)}`)};
PRINT.fmreg=()=>{fmCfg();return cphead('ทะเบียนแบบฟอร์ม (Master List of Forms)','')+`<table><thead><tr><th>#</th><th>รหัสแบบฟอร์ม</th><th>ชื่อแบบฟอร์ม</th><th>หน่วยงาน</th><th style="text-align:center">Rev.</th><th>วันที่ประกาศใช้</th></tr></thead><tbody>
  ${FM_LIST.filter(e=>!fmOf(e).off).map((e,i)=>{const v=fmOf(e);return `<tr><td>${i+1}</td><td>${esc(v.c)}</td><td>${esc(e[3])}</td><td>${esc((FM_DEP.find(d=>d[0]===e[1])||['',''])[1])}</td><td style="text-align:center">${esc(v.r)}</td><td>${thDL(v.d)}</td></tr>`}).join('')}</tbody></table>`+signs(['ผู้จัดทำ (ควบคุมเอกสาร)','ผู้ตรวจสอบ','ผู้อนุมัติ'])};
// the same four tabs as 360-company-documents.js plus this register (subTabs would send an unknown tab back to the first)
CVIEWS.org=()=>{const {cur,html}=subTabs('org',[['chart','ผังองค์กร'],['flow','ขั้นตอนงาน'],['forms','แบบฟอร์มและเอกสาร'],['env','ซองจดหมาย'],['fmreg','ทะเบียนแบบฟอร์ม']]);
  return html+({chart:orgChart,flow:orgFlow,forms:orgForms,env:orgEnv,fmreg:fmPage}[cur])()};
if(typeof SBSUB==='object')SBSUB['co.org']=(SBSUB['co.org']||'')+'|fmreg=ทะเบียนแบบฟอร์ม';
if(typeof SBKW==='object')SBKW['co.org.fmreg']=(SBKW['co.org.fmreg']||'')+' รหัสแบบฟอร์ม iso form code rev ฉบับที่ เลขแบบฟอร์ม fm- master list ทะเบียนเอกสาร ควบคุมเอกสาร';
if(typeof I18N==='object'&&I18N.en&&I18N.en.x)Object.assign(I18N.en.x,{'ทะเบียนแบบฟอร์ม':'Form register','ทะเบียนแบบฟอร์ม (รหัสแบบฟอร์ม ISO)':'Form register (ISO form codes)',
  'พิมพ์ทะเบียนแบบฟอร์ม':'Print form register','พิมพ์รหัสแบบฟอร์มบนเอกสาร':'Print form codes on documents','คำนำหน้ารหัส':'Code prefix','เอกสาร':'Document','รหัส':'Code',
  'วันที่ประกาศใช้':'Effective date','ไม่พิมพ์':'Hide','พิมพ์บนเอกสารว่า':'Printed as'});
