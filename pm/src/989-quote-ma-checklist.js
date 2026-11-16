/* ---------- 4.99.33 ใบตรวจเช็คแนบท้ายใบเสนอราคาบริการ (FM-SV-03): a per-machine PM checklist printed after a PM/MA quotation ----------
   User (2026-11-16, รพ.ค่ายสุรนารี 1-year AC maintenance + AHU filters): "ทำตารางตรวจเช็คแนบไปด้วย", "บางคนไม่เข้าใจ" (add
   the meaning of each code), "เอาไปแนบใบเสนอราคาด้วย", "หน้านี้ต่อจากใบเสนอราคา". A service quotation (Q.kind 'ma') can carry
   Q.chk = {on, t}: t is the machine list, one machine a line "UNIT NO. | พื้นที่ | ยี่ห้อ / รุ่น | Pre-Filter | Medium Filter"
   (tab or |), a line starting with # is a heading (building / floor). When on, the checklist prints right after the quotation
   on A4 landscape pages (class sub-pp → 745's named landscape page, 908 paints over the portrait footer, 941 fits the split
   preview): check boxes C1–C5, readings A / Ts / Tr / ΔP, Pre / Medium replaced, remarks, a legend on every page and three
   signatures. With no machines listed it prints as the blank form with empty rows. It is a form of its own in
   ทะเบียนแบบฟอร์ม (SV-03), and its code prints in the corner of its first page. */
const QCK_CHK=[['C1','สภาพ<br>เครื่อง','ตรวจสภาพทั่วไป ฟังเสียงและดูการสั่นของเครื่อง'],['C2','ล้าง<br>คอยล์','ล้างทำความสะอาดคอยล์เย็น'],
  ['C3','ถาด<br>น้ำทิ้ง','ล้างถาดน้ำทิ้งและท่อน้ำทิ้ง ดูว่าน้ำไหลดี'],['C4','มอเตอร์<br>สายพาน','ตรวจมอเตอร์ พัดลม สายพาน ลูกปืน ปรับความตึงสายพาน'],
  ['C5','ตู้ไฟ<br>ขั้วสาย','ตรวจตู้ไฟ ขันจุดต่อสายไฟให้แน่น']];
const QCK_MEAS=[['A','กระแส<br>(แอมป์)','กระแสไฟของมอเตอร์ หน่วยแอมป์'],['Ts','ลมจ่าย<br>(°C)','อุณหภูมิลมเย็นที่ออกจากเครื่อง หน่วย °C'],
  ['Tr','ลมกลับ<br>(°C)','อุณหภูมิลมที่กลับเข้าเครื่อง หน่วย °C'],['ΔP','ฟิลเตอร์<br>(Pa)','แรงดันตกคร่อมฟิลเตอร์ก่อนเปลี่ยน หน่วย Pa (ค่าสูง = ฟิลเตอร์ตัน)']];
const QCK_TITLE='ใบตรวจเช็คบำรุงรักษาเครื่องปรับอากาศและเปลี่ยนฟิลเตอร์';
const QCK_BLANK=24;
const QCK_FM=['qck','SV',3,QCK_TITLE,/^ใบตรวจเช็คบำรุงรักษา/];
if(typeof FM_LIST!=='undefined'&&!FM_LIST.some(e=>e[0]==='qck')){const i=FM_LIST.findIndex(e=>e[0]==='pmrep');FM_LIST.splice(i<0?FM_LIST.length:i+1,0,QCK_FM)}
const qckOn=Q=>!!(Q&&typeof qmMa==='function'&&qmMa(Q)&&Q.chk&&Q.chk.on);
// the machine list: [{g: heading}] or [{c: [unit, area, model, pre, medium]}]
function qckRows(Q){return String((Q&&Q.chk&&Q.chk.t)||'').split('\n').map(x=>x.replace(/\s+$/,'')).filter(x=>x.trim()).map(x=>{
  if(/^\s*#/.test(x))return {g:x.replace(/^\s*#+\s*/,'')};const c=x.split(x.includes('\t')?'\t':'|').map(s=>s.trim());while(c.length<5)c.push('');return {c:c.slice(0,5)}})}
const QCK_CSS=`<style>
#print .qck{font-family:"IBM Plex Sans Thai",Anuphan,"Leelawadee UI",Tahoma,sans-serif;font-size:8.4px;color:#1F2E36;line-height:1.35;-webkit-print-color-adjust:exact;print-color-adjust:exact}
#print .qck .fmq{text-align:right;font-size:7.5px;color:#6B7F87;margin:0 0 2px}
#print .qck .bar{height:4px;border-radius:2px;background:linear-gradient(90deg,#16324F,#1C8F9B 60%,#F59E0B)}
#print .qck .hd{display:flex;justify-content:space-between;align-items:flex-end;margin:5px 0 4px}
#print .qck .hd h1{font-size:14px;margin:0;color:#16324F;font-weight:700}#print .qck .hd small{display:block;color:#6B7F87;font-size:8.5px}
#print .qck .co{text-align:right;font-size:8.5px;color:#4A5D66}#print .qck .co b{display:block;color:#16324F;font-size:10.5px}
#print .qck .meta{display:grid;grid-template-columns:2.3fr 1.2fr 1fr 1fr;gap:6px;margin:0 0 4px}
#print .qck .meta div{border:1px solid #D3E2E5;border-radius:6px;padding:3px 7px;line-height:1.45}#print .qck .meta b{color:#16324F}
#print .qck .sq{display:inline-block;width:8px;height:8px;border:1px solid #16324F;border-radius:2px;margin:0 2px 0 6px;vertical-align:-1px}
#print .qck table{width:100%;border-collapse:collapse;table-layout:fixed;margin:0}
#print .qck th,#print .qck td{border:1px solid #C9D9DD;padding:1.5px 3px;vertical-align:middle;overflow:hidden;font-size:8.2px}
#print .qck thead th{background:#16324F;color:#fff;font-weight:600;font-size:7.8px;line-height:1.2;text-align:center}
#print .qck thead tr.s th{background:#1F5A73}
#print .qck thead th small{display:block;font-weight:400;font-size:6.6px;color:#CFE6EA;line-height:1.15;margin-top:1px}
#print .qck tr.g td{background:#EAF5F6;font-weight:700;color:#16324F}
#print .qck td.c,#print .qck td.b,#print .qck td.na{text-align:center}#print .qck td.na{color:#9AAAB0}#print .qck td.f,#print .qck td.l{font-size:7.6px}
#print .qck td.b i{display:inline-block;width:8px;height:8px;border:1px solid #6B7F87;border-radius:2px}
#print .qck tbody tr{height:15px;break-inside:avoid;page-break-inside:avoid}#print .qck tbody tr.e{height:19px}
#print .qck td.ft{border:0;padding:4px 2px 0;font-size:7.6px;color:#4A5D66;line-height:1.5;background:#fff}#print .qck td.ft b{color:#16324F}
#print .qck .sg{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-top:8px;break-inside:avoid;page-break-inside:avoid}
#print .qck .sg div{border:1px solid #D3E2E5;border-radius:8px;padding:6px 10px;text-align:center;height:58px;display:flex;flex-direction:column;justify-content:flex-end}
#print .qck .sg b{color:#16324F}
</style>`;
function qckPrint(Q){if(!qckOn(Q))return '';const C=CO()||{},R=qckRows(Q),e=esc,box='<td class="b"><i></i></td>',blank=!R.some(r=>r.c);
  const fe=typeof fmOn==='function'&&fmOn()&&typeof fmOf==='function'&&!fmOf(QCK_FM).off?fmText(QCK_FM):'';
  let k=0;const row=r=>{if(r.g)return `<tr class="g"><td colspan="18">${e(r.g)}</td></tr>`;const [u,a,m,p,d]=r.c,np=/^[-–—]?$/.test(p),nd=/^[-–—]?$/.test(d);k++;
    return `<tr><td class="c">${k}</td><td><b>${e(u)}</b></td><td class="l">${e(a)}</td><td class="l">${e(m)}</td><td class="f">${np?'—':e(p)}</td><td class="f">${nd?'—':e(d)}</td>${box.repeat(5)}${'<td></td>'.repeat(4)}${np?'<td class="na">—</td>':box}${nd?'<td class="na">—</td>':box}<td></td></tr>`};
  const body=blank?(R.filter(r=>r.g).slice(0,1).map(row).join('')||'<tr class="g"><td colspan="18">อาคาร ............................ ชั้น ........</td></tr>')
      +`<tr class="e"><td></td><td></td><td></td><td></td><td></td><td></td>${box.repeat(5)}${'<td></td>'.repeat(4)}${box.repeat(2)}<td></td></tr>`.repeat(QCK_BLANK)
    :R.map(row).join('');
  const nU=R.filter(r=>r.c).length,dots='..............................';
  const foot='<b>คำอธิบาย</b> '+[...QCK_CHK,...QCK_MEAS].map(x=>`<b>${x[0]}</b> = ${x[2]}`).join(' · ')
    +' · <b>✓</b> = ทำแล้ว ปกติ · <b>✗</b> = พบปัญหา เขียนรายละเอียดในช่องหมายเหตุ · <b>—</b> = เครื่องนี้ไม่มีฟิลเตอร์ชนิดนั้น · ฟิลเตอร์เขียนขนาด (นิ้ว) × จำนวนแผ่น';
  const sig=n=>`<div>( ${dots} )<br><b>${n}</b>วันที่ ...... / ...... / ......</div>`;
  return QCK_CSS+`<div class="sub-pp qck" data-qck="${e(Q.id)}" style="width:277mm">${fe?`<div class="fmq">${e(fe)}</div>`:''}<div class="bar"></div>
  <div class="hd"><div><h1>${QCK_TITLE}</h1><small>PM Checklist · แนบท้ายใบเสนอราคาเลขที่ ${e(Q.no||'')}${nU?` · ${nU} รายการ`:''}</small></div>
    <div class="co"><b>${e(C.name||'')}</b>${e(C.addr||'')}</div></div>
  <div class="meta"><div><b>โครงการ</b> ${e(Q.pname||Q.title||'')}<br><b>สถานที่</b> ${e(Q.site||'')}</div>
    <div><b>เข้าบำรุงรักษาครั้งที่</b><br>${[1,2,3,4].map(x=>`<span class="sq"></span>${x}`).join('')} <span class="sq"></span>อื่นๆ ......</div>
    <div><b>วันที่</b> ........ / ........ / ........<br><b>เวลา</b> .............. – ..............</div>
    <div><b>ทีมช่าง</b> ${dots}<br><b>เลขที่ใบเสนอราคา</b> ${e(Q.no||'')}</div></div>
  <table><colgroup><col style="width:2.4%"><col style="width:7.6%"><col style="width:14%"><col style="width:9.6%"><col style="width:9%"><col style="width:9%">${'<col style="width:2.9%">'.repeat(5)}<col style="width:3.6%"><col style="width:3.6%"><col style="width:3.6%"><col style="width:4%"><col style="width:4.3%"><col style="width:4.3%"><col></colgroup>
  <thead><tr><th rowspan="2">ลำดับ</th><th rowspan="2">UNIT NO.</th><th rowspan="2">พื้นที่ที่จ่ายลม</th><th rowspan="2">ยี่ห้อ / รุ่น</th><th colspan="2">ฟิลเตอร์ (ขนาดนิ้ว × จำนวนแผ่น)</th><th colspan="5">ตรวจเช็ค</th><th colspan="4">ค่าที่วัดได้</th><th colspan="2">เปลี่ยนฟิลเตอร์</th><th rowspan="2">หมายเหตุ</th></tr>
  <tr class="s"><th>Pre-Filter</th><th>Medium Filter</th>${[...QCK_CHK,...QCK_MEAS].map(x=>`<th>${x[0]}<small>${x[1]}</small></th>`).join('')}<th>Pre</th><th>Medium</th></tr></thead>
  <tfoot><tr><td colspan="18" class="ft">${foot}</td></tr></tfoot><tbody>${body}</tbody></table>
  <div class="sg">${sig('ช่างผู้ตรวจเช็ค')}${sig('หัวหน้างาน / วิศวกร')}${sig('ผู้แทนลูกค้า ผู้ตรวจรับ')}</div></div>`}
{const f=PRINT.quote;PRINT.quote=id=>{const h=f(id),Q=(CO().quotes||[]).find(q=>q.id===id);return qckOn(Q)?h+qckPrint(Q):h}}

// ---- the card on a service quotation's page, right under the service contract card
function qckCard(Q){const b=`co.quotes.${Q.id}`,R=qckRows(Q),nU=R.filter(r=>r.c).length,on=!!Q.chk.on;
  return `<section class="card qck-card" style="margin:0 0 12px"><h2><span>ใบตรวจเช็คแนบท้าย (FM-SV-03)</span><small>${on?(nU?`พิมพ์ต่อจากใบเสนอราคา ${nU} รายการ กระดาษแนวนอน`:'พิมพ์เป็นฟอร์มเปล่าต่อจากใบเสนอราคา'):'ไม่พิมพ์'}</small></h2>
  <label class="chk" style="flex-direction:row;align-items:center;gap:6px;display:flex"><input type="checkbox" data-t="chk" data-p="${b}.chk.on"${on?' checked':''}> พิมพ์ใบตรวจเช็ครายเครื่องต่อท้ายใบเสนอราคา (ตรวจเช็ค 5 ข้อ ค่าที่วัด 4 ค่า เปลี่ยนฟิลเตอร์ พร้อมคำอธิบายทุกหน้า)</label>
  ${on?`<p class="hint" style="margin:8px 0 4px">รายการเครื่อง บรรทัดละ 1 เครื่อง: UNIT NO. | พื้นที่ | ยี่ห้อ / รุ่น | Pre-Filter | Medium Filter (คั่นด้วย | หรือวางจาก Excel ได้เลย) · บรรทัดที่ขึ้นต้นด้วย # เป็นหัวข้อ เช่น # อาคาร A ชั้น 1 · ไม่มีฟิลเตอร์ใส่ - · เว้นว่างทั้งหมด = พิมพ์ฟอร์มเปล่า</p>
  <textarea data-p="${b}.chk.t" rows="${Math.min(14,Math.max(5,R.length+1))}" style="width:100%;font-family:ui-monospace,Consolas,monospace;font-size:12px" placeholder="# อาคาร A ชั้น 1&#10;AHU-01 | ห้องประชุม | DAIKIN FXMQ | 24x24×2 | 24x24×2" aria-label="รายการเครื่องในใบตรวจเช็ค">${esc(Q.chk.t||'')}</textarea>`:''}</section>`}
{const f=salesQuote;salesQuote=function(){let h=f.apply(this,arguments);const C=CO(),Q=C.quotes.find(q=>q.id===S.sel.quote)||C.quotes.slice().reverse()[0];
  if(!Q||typeof qmMa!=='function'||!qmMa(Q))return h;if(!Q.chk||typeof Q.chk!=='object')Q.chk={on:false,t:''};
  const m='<dl class="stats" style="margin-bottom:12px">',i=h.indexOf(m);return i<0?h+qckCard(Q):h.slice(0,i)+qckCard(Q)+h.slice(i)}}
