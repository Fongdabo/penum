/* ---------- round 2.1: organisation (chart, workflow, forms library) and ORIEN-style printouts ---------- */
COTABS.splice(COTABS.findIndex(t=>t[0]==='coset'),0,['org','องค์กรและเอกสาร']);
ICO.org='<rect x="9" y="2" width="6" height="5" rx="1"/><rect x="2" y="17" width="6" height="5" rx="1"/><rect x="9" y="17" width="6" height="5" rx="1"/><rect x="16" y="17" width="6" height="5" rx="1"/><path d="M12 7v5M5 17v-5h14v5M12 12v5"/>';
{const f=allowed;allowed=function(mode,tab){return mode==='co'&&tab==='org'?true:f(mode,tab)}}

/* --- org chart, live from departments, roles and staff --- */
const ORG_GROUPS=[['ผู้อำนวยการฝ่ายธุรกิจ','หางาน ออกแบบ ตั้งราคา',['SAL','DES','EST']],['ผู้อำนวยการฝ่ายปฏิบัติการ','สร้าง ส่งมอบ ดูแลหลังขาย',['PRJ','PUR','SVC']],['ผู้อำนวยการฝ่ายบริหาร','เงิน คน เอกสารบริษัท',['ACC','HR']]];
function orgChart(){const st=CO().staff.filter(s=>s.active!==false),D=c=>SKILLS.depts.find(d=>d.c===c)||{c,n:c,roles:[]},who=(dept,role)=>st.filter(s=>s.dept===dept&&s.role===role);
  const names=L=>L.length?L.map(s=>esc(s.name||s.code)).join(', '):'<span class="og-vac">ว่าง</span>';
  const deptCard=c=>{const d=D(c),head=d.roles[0]||{n:''},hs=who(c,head.n),rest=st.filter(s=>s.dept===c&&s.role!==head.n),cnt=st.filter(s=>s.dept===c).length;
    return `<div class="og-dept"><div class="og-dn">${esc(d.n)} <small>${cnt} คน</small></div><div class="og-head">${esc(head.n)}: ${names(hs)}</div>
    ${d.roles.slice(1).map(r=>{const L=who(c,r.n);return `<div class="og-role"><span>${esc(r.n)}</span> ${L.length?`<b>${L.length}</b> <small>${L.slice(0,4).map(s=>esc(s.name||s.code)).join(', ')}${L.length>4?' …':''}</small>`:'<span class="og-vac">ว่าง</span>'}</div>`}).join('')}
    ${rest.filter(s=>!d.roles.some(r=>r.n===s.role)).length?`<div class="og-role"><span>อื่นๆ</span> <small>${rest.filter(s=>!d.roles.some(r=>r.n===s.role)).map(s=>esc(s.name||s.code)).join(', ')}</small></div>`:''}</div>`};
  const md=who('MGT','กรรมการผู้จัดการ'),she=D('SHE');
  return `<section class="card"><h2><span>โครงสร้างบริษัท</span><small>สร้างจากรายชื่อพนักงานในแท็บบุคคลและแรงงานโดยอัตโนมัติ เพิ่มหรือย้ายคนแล้วผังเปลี่ยนตาม · ${st.length} คน</small><span class="sp"></span><button type="button" class="btn sm" data-a="orgPrint">พิมพ์ผังองค์กร</button></h2>
  <div class="og" id="orgChart"><div class="og-top"><div class="og-md"><b>กรรมการผู้จัดการ</b><br><span>${names(md)}</span><br><small>ทิศทาง อนุมัติงาน กำไรของบริษัท</small></div>
    <div class="og-she"><b>${esc(she.n)} (ขึ้นตรง MD)</b><br><small>${she.roles.map(r=>{const L=who('SHE',r.n);return `${esc(r.n.replace(/\s*\(.*\)/,''))}: ${L.length?L.map(s=>esc(s.name)).join(', '):'ว่าง'}`}).join(' · ')}</small></div></div>
  <div class="og-cols">${ORG_GROUPS.map(([t,sub,ds])=>`<div class="og-col"><div class="og-dir"><b>${t}</b><br><span>${names(who('MGT',t))}</span><br><small>${sub}</small></div>${ds.map(deptCard).join('')}</div>`).join('')}</div></div></section>`}
ACT.orgPrint=()=>{$('#print').innerHTML=cphead('ผังองค์กร','')+`<div class="og og-p">${$('#orgChart').innerHTML}</div>`;setTimeout(()=>print(),300)};

/* --- who does what across one project, each step opens its page in PENUM --- */
const FLOW_PH=['หางาน','ออกแบบและตั้งราคา','ปิดการขาย','เตรียมงาน','ก่อสร้างและเบิกงวด','ส่งมอบ','หลังการขาย'];
const FLOW=[['ลูกค้า','',{0:['ขอราคา หรือเปิดประมูล'],2:['ตกลงและเซ็นสัญญา',1],4:['ตรวจผลงาน จ่ายเงินงวด'],5:['ตรวจรับงาน รับมอบระบบ',1]}],
  ['ขาย','SAL',{0:['รับความต้องการ เปิดงานในระบบ',0,'co','sales','lead'],2:['ส่งใบเสนอราคา เจรจา',0,'co','sales','quote']}],
  ['ผู้บริหาร','MGT',{2:['ตรวจและอนุมัติราคา',1,'co','exec']}],
  ['ออกแบบ','DES',{1:['คำนวณโหลด ออกแบบ แบบ BIM',0,'mep']}],
  ['ประมาณราคา','EST',{1:['ถอดปริมาณ ทำ BOQ',0,'mep']}],
  ['โครงการ','PRJ',{3:['Kick-off แผนงาน Gantt Shop Drawing',0,'pj','sched'],4:['ติดตั้ง รายงานประจำวัน วัดผลงานงวด',0,'pj','site'],5:['ทดสอบ T&C, TAB, Punch list, As-built, O&M',0,'pj','hand']}],
  ['ความปลอดภัย','SHE',{3:['อบรมก่อนเข้างาน ใบอนุญาตทำงาน',0,'pj','site']}],
  ['บุคคล','HR',{3:['จัดคนและช่างลงหน้างาน',0,'co','hr','staff']}],
  ['จัดซื้อ','PUR',{3:['ขอซื้อ สั่งซื้อจาก BOQ',0,'pj','buy','pr'],4:['ส่งของเข้าหน้างาน เบิกวัสดุ',0,'pj','buy','stock']}],
  ['บัญชี','ACC',{4:['ออกใบแจ้งหนี้ตามงวดงาน',0,'co','acct','ar'],6:['เบิกงวดสุดท้าย คืนเงินประกัน',0,'pj','cost']}],
  ['บริการหลังการขาย','SVC',{6:['สัญญา PM แจ้งซ่อม ประกัน ส่งงานใหม่ให้ขาย',0,'co','svc']}]];
function orgFlow(){const st=CO().staff.filter(s=>s.active!==false);
  const step=([t,ap,m,k,s],id)=>m==='mep'?`<a class="fl-s pen" data-fk="${id}" href="../mep/" target="penum-mep" title="เปิด PENUM MEP">${t}</a>`:m?`<button type="button" class="fl-s pen" data-fk="${id}" data-a="go" data-m="${m}" data-k="${k}"${s?` data-s="${s}"`:''} title="เปิดหน้านี้">${t}</button>`:`<div class="fl-s${ap?' ap':''}" data-fk="${id}">${t}</div>`;
  return `<section class="card"><h2><span>ใครทำขั้นไหน ตลอด 1 โครงการ</span><small>กล่องสีฟ้ากดเพื่อเปิดหน้าที่ใช้ทำขั้นนั้นใน PENUM · กล่องสีส้ม = จุดอนุมัติหรือตัดสินใจ</small></h2>
  <div class="tw"><div class="flw"><table class="fl"><thead><tr><th>ฝ่าย</th>${FLOW_PH.map(p=>`<th>${p}</th>`).join('')}</tr></thead><tbody>
  ${FLOW.map(([lane,d,S])=>`<tr><th class="fl-l">${lane}${d?`<br><small>${st.filter(s=>s.dept===d).length} คน</small>`:''}</th>${FLOW_PH.map((_,i)=>`<td>${S[i]?step(S[i],(d||'CUS')+i):''}</td>`).join('')}</tr>`).join('')}</tbody></table></div></div>${flowLegend()}</section>`}

/* --- forms and company documents (served from pm/files on the website) --- */
const FORMS=[['ขายและบัญชี',[['quotation','ใบเสนอราคา'],['tax-invoice','ใบแจ้งหนี้ / ใบกำกับภาษี'],['billing-note','ใบวางบิล'],['receipt','ใบเสร็จรับเงิน']]],
  ['จัดซื้อและผู้รับเหมา',[['purchase-request','ใบขอซื้อ'],['purchase-order','ใบสั่งซื้อ'],['delivery-note','ใบส่งของ'],['subcontract','สัญญาจ้างผู้รับเหมาช่วง']]],
  ['โครงการและบริการ',[['work-order','ใบสั่งงาน'],['variation-order','ใบขออนุมัติงานเพิ่ม-ลด'],['daily-report','รายงานประจำวัน'],['handover','ใบส่งมอบงาน'],['service-report','ใบรายงานบริการ']]],
  ['องค์กรและบุคคล',[['mep-org-and-workflow-charts','ผังองค์กรและขั้นตอนงาน'],['mep-departments-brochure','แนะนำฝ่ายต่างๆ'],['mep-skill-sheets','สกิลชีตทุกตำแหน่ง'],['envelope','ซองจดหมาย']]]];
function orgForms(){const card=([f,t])=>`<div class="fm"><a href="files/${f}.pdf" target="_blank" rel="noopener" class="fm-pv"><img src="files/pv/${f}.jpg" alt="" loading="lazy"></a><div class="fm-t">${t}</div><div class="row"><a class="btn sm" href="files/${f}.pdf" target="_blank" rel="noopener">เปิด</a><a class="btn sm" href="files/${f}.pdf" download>ดาวน์โหลด</a></div></div>`;
  return `<section class="card"><h2><span>แบบฟอร์มและเอกสารบริษัท</span><small>แบบฟอร์มเปล่าของบริษัท โอเรียน จำกัด สำหรับพิมพ์ไปกรอกด้วยมือ ส่วนเอกสารที่ออกจากโปรแกรม (ใบเสนอราคา PO ใบแจ้งหนี้ ฯลฯ) ใช้หัวกระดาษแบบเดียวกันแล้ว</small><span class="sp"></span>
    <a class="btn sm" href="files/ORIEN-document-set.pdf" target="_blank" rel="noopener">ชุดเอกสารทั้งหมด (PDF)</a><a class="btn sm" href="files/ORIEN-forms-fillable.xlsx" download>แบบฟอร์มกรอกใน Excel</a></h2>
  ${FORMS.map(([g,L])=>`<h3 class="fm-g">${g}</h3><div class="fms">${L.map(card).join('')}</div>`).join('')}
  <p class="hint" style="margin-top:12px">ไฟล์เหล่านี้อยู่บนเว็บของโปรแกรม ใครมีลิงก์ก็เปิดได้ จึงใส่ไว้เฉพาะแบบฟอร์มเปล่าและเอกสารแนะนำ ไม่มีข้อมูลเงินเดือนหรือข้อมูลพนักงาน</p></section>`}
CVIEWS.org=()=>{const {cur,html}=subTabs('org',[['chart','ผังองค์กร'],['flow','ขั้นตอนงาน'],['forms','แบบฟอร์มและเอกสาร']]);return html+({chart:orgChart,flow:orgFlow,forms:orgForms}[cur])()};

/* --- printouts in the ORIEN layout: logo and company at the top, a dark title band with the number and dates beside it --- */
const DOC_EN=[[/ใบเสนอราคา/,'QUOTATION'],[/ใบแจ้งหนี้|ใบกำกับภาษี/,'INVOICE / TAX INVOICE'],[/ใบเสร็จรับเงิน/,'RECEIPT'],[/ใบสั่งซื้อ/,'PURCHASE ORDER'],[/ใบขอซื้อ/,'PURCHASE REQUEST'],[/ใบเบิกเงิน/,'PROGRESS BILLING'],[/ประจำวัน/,'DAILY REPORT'],[/RFI|ขอข้อมูล/,'REQUEST FOR INFORMATION'],[/งานเพิ่ม-ลด/,'VARIATION ORDER'],[/Transmittal|นำส่งเอกสาร/,'TRANSMITTAL'],[/ส่งอนุมัติ/,'SUBMITTAL REGISTER'],[/Punch/,'PUNCH LIST'],[/Commissioning|ทดสอบ/,'TESTING & COMMISSIONING'],[/TAB/,'TEST, ADJUST & BALANCE'],[/แผนงาน/,'PROJECT SCHEDULE'],[/ใบงานบริการ/,'SERVICE REPORT'],[/ความปลอดภัย/,'SAFETY INSPECTION'],[/ใบอนุญาตทำงาน/,'WORK PERMIT'],[/ประเมินทักษะ/,'SKILL ASSESSMENT'],[/ภาษีขาย|ภาษีซื้อ/,'VAT REPORT'],[/ผังองค์กร/,'ORGANISATION CHART']];
function ohead(title,sub,extra){const C=CO(),t=String(title),en=(DOC_EN.find(([r])=>r.test(t))||[0,''])[1];
  let th=t.replace(/\s*\([A-Za-z&\s]+\)/,''),no='';const m=th.match(/\s([A-Z][A-Z0-9]*-[\w-]+(?:\s+Rev\.\S+)?)\s*$/);if(m){no=m[1];th=th.slice(0,m.index)}
  const rows=[...(no?[['เลขที่',no]]:[]),...extra,...String(sub||'').split(/<br\s*\/?>/i).map(x=>x.trim()).filter(Boolean).map(x=>{const k=x.indexOf(' ');return k>0&&k<22?[x.slice(0,k),x.slice(k+1)]:['',x]}),['พิมพ์',thDL(today())]];
  return `<div class="oh"><div>${C.logo?`<img src="${C.logo}" alt="">`:''}</div><div class="oh-c"><b>${esc(C.name||'')}</b>${C.nameEn?`<br><small>${esc(C.nameEn)}</small>`:''}${C.addr?`<br>${esc(C.addr)}`:''}<br>${[C.phone?'โทร '+esc(C.phone):'',esc(C.email||''),C.tax?'เลขประจำตัวผู้เสียภาษี '+esc(C.tax)+(C.branch?' ('+esc(C.branch)+')':''):''].filter(Boolean).join(' · ')}</div></div>
  <div class="ot"><div class="ot-t">${en?`<small>${en}</small>`:''}<h1>${th}</h1></div><div class="ot-m">${rows.map(([k,v])=>`<div><span>${k}</span>${v}</div>`).join('')}</div></div>
  <div class="ofoot"><span>${esc(C.name||'')}${C.email?' · '+esc(C.email):''}</span><span>${C.phone?'โทร '+esc(C.phone):''}</span></div>`}
cphead=(t,s)=>ohead(t,s,[]);
phead=(t,s)=>{const I=P.info;return ohead(t,s,[['โครงการ',esc(P.name)],...(I.client?[['ลูกค้า',esc(I.client)]]:[])])};

