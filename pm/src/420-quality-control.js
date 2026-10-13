/* ---------- round 3.0: quality control — ITP, inspection requests (WIR) and non-conformance reports (NCR) ----------
   ITP says what gets checked and who must witness it; a WIR asks the consultant to inspect one piece of work
   and records the result with a signature drawn on screen; a rejected WIR or a site finding becomes an NCR
   that stays open until the consultant signs it closed. */
TABS.splice(TABS.findIndex(t=>t[0]==='docs')+1,0,['qa','คุณภาพ QA/QC']);
NAVD.find(d=>d[0]==='pj')[2].splice(NAVD.find(d=>d[0]==='pj')[2].findIndex(pg=>pg[1]==='docs')+1,0,['pj','qa','','คุณภาพ QA/QC']);
ICO.qa='<path d="M9 11l3 3 8-8"/><path d="M20 12v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h9"/>';
for(const k of ['DES','SHE'])if(ACCESS[k]&&ACCESS[k].pj&&ACCESS[k].pj!=='*')ACCESS[k].pj.push('qa');
DOC_EN.push([/คำขอตรวจงาน/,'WORK INSPECTION REQUEST'],[/รายงานงานไม่เป็นไปตามข้อกำหนด/,'NON-CONFORMANCE REPORT'],[/แผนการตรวจสอบและทดสอบ/,'INSPECTION & TEST PLAN']);
const ensureQA=p=>{p.itp=p.itp||[];p.wir=p.wir||[];p.ncr=p.ncr||[]};
{const r=render;render=function(){if(typeof DB!=='undefined'&&DB&&DB.projects)Object.values(DB.projects).forEach(ensureQA);return r.apply(this,arguments)}}

const PT=[['','–'],['H','H จุดหยุดรอตรวจ'],['W','W ตรวจพร้อมกัน'],['R','R ตรวจเอกสาร'],['S','S สุ่มตรวจ']];
const WST=[['draft','ยังไม่ส่ง'],['req','ขอตรวจแล้ว'],['ok','อนุมัติ'],['okc','อนุมัติตามความเห็น'],['rej','ไม่อนุมัติ แก้ไขแล้วขอใหม่']];
const NST=[['open','เปิด รอแก้ไข'],['act','แก้ไขแล้ว รอตรวจปิด'],['closed','ปิดแล้ว']];
const NSRC=[['cons','ที่ปรึกษา/ผู้ควบคุมงาน'],['own','ผู้ว่าจ้าง'],['int','ตรวจพบเอง (QC)']];
const NSEV=[['minor','เล็กน้อย'],['major','ร้ายแรง']];
const pill=(L,v,cls)=>`<span class="pill ${cls||''}">${esc((L.find(x=>x[0]===v)||L[0])[1])}</span>`;
const wCls=s=>s==='ok'||s==='okc'?'ok':s==='rej'?'bad':s==='req'?'warn':'';
const nCls=s=>s==='closed'?'ok':s==='act'?'warn':'bad';
// standard ITP lines per system: [activity, acceptance criteria / reference, record, contractor point, consultant point]
const ITPT={eq:[['ตรวจรับเครื่องและอุปกรณ์เข้าหน้างาน','ตรงตามเอกสารอนุมัติ ไม่ชำรุด','ใบตรวจรับวัสดุ','H','W'],['ติดตั้งฐานและแขวนเครื่อง','ระดับได้ ยึดแน่น มียางกันสั่น','WIR','W','W'],['ทดสอบเดินเครื่อง','กระแสไม่เกินพิกัด ΔT 8–12 °C','ใบทดสอบ T&C','H','H']],
  pipe:[['เดินท่อน้ำยาและยึดแขวน','ระยะแขวนตามแบบ ฉนวนครบ','WIR','W','S'],['ทดสอบแรงดันไนโตรเจน','600 psi คงที่ 24 ชม.','ใบบันทึกแรงดัน','H','W'],['ทำสุญญากาศ','ต่ำกว่า 500 micron','ใบบันทึก','W','R']],
  duct:[['ตรวจรับท่อลมสำเร็จรูป','ความหนาแผ่นตามมาตรฐาน SMACNA','ใบตรวจรับวัสดุ','H','R'],['ติดตั้งท่อลม แขวน และฉนวน','ไม่รั่ว ฉนวนไม่ขาด','WIR','W','W'],['ทดสอบรอยรั่วท่อลม','รั่วไม่เกินเกณฑ์ที่กำหนด','ใบทดสอบ','H','W']],
  chw:[['เดินท่อน้ำเย็นและเชื่อม','แนวตรง รอยเชื่อมเต็ม','WIR','W','S'],['ทดสอบแรงดันน้ำ','1.5 เท่าความดันใช้งาน 2 ชม.','ใบบันทึกแรงดัน','H','H'],['ล้างท่อ','น้ำใส ไม่มีตะกอน','ใบบันทึก','W','W']],
  el:[['เดินท่อร้อยสายและรางสาย','ยึดตามระยะ ต่อลงดิน','WIR','W','S'],['ร้อยสายและเข้าสาย','ขนาดสายตามแบบ ขันแน่น','WIR','W','W'],['วัดค่าความเป็นฉนวน','ไม่น้อยกว่า 1 MΩ','ใบทดสอบ','H','W']],
  smk:[['ติดตั้งพัดลมและแดมเปอร์','ตามแบบ ทิศทางถูกต้อง','WIR','W','W'],['ทดสอบแรงดันบันไดหนีไฟ','25–50 Pa','ใบทดสอบ','H','H']],
  fp:[['เดินท่อดับเพลิงและแขวน','ตามมาตรฐาน NFPA 13','WIR','W','S'],['ทดสอบแรงดันท่อ','200 psi 2 ชม.','ใบบันทึกแรงดัน','H','H'],['ทดสอบปั๊มดับเพลิง','ได้อัตราไหลตามพิกัด','ใบทดสอบ','H','H']],
  elb:[['ติดตั้งตู้และเดินสาย','ตามแบบ มาตรฐาน วสท.','WIR','W','S'],['วัดความต้านทานดิน','ไม่เกิน 5 Ω','ใบทดสอบ','H','W'],['ทดสอบไฟฉุกเฉิน','ติดสว่าง 2 ชม.','ใบทดสอบ','H','W']],
  plb:[['เดินท่อน้ำดีและท่อระบาย','ความลาดตามแบบ','WIR','W','S'],['ทดสอบแรงดันท่อน้ำดี','1.5 เท่า 2 ชม.','ใบบันทึกแรงดัน','H','W'],['ทดสอบขังน้ำท่อระบาย','ไม่รั่วซึม','ใบบันทึก','W','W']]};
NEW.itp=()=>({g:'',act:'',crit:'',rec:'WIR',pc:'W',pk:'W'});
NEW.wir=arr=>({no:nextNo('WIR-',arr),date:today(),insp:addD(today(),1),time:'09:00',loc:'',g:'',itp:'',desc:'',by:P.info.pm||'',status:'draft',chk:{},kName:'',kDate:'',note:''});
NEW.ncr=arr=>({no:nextNo('NCR-',arr),date:today(),src:'cons',sev:'minor',loc:'',g:'',wir:'',desc:'',cause:'',corr:'',prev:'',who:'',due:addD(today(),7),status:'open',iName:'',cName:'',cDate:'',photos:[]});
ACT.itpStd=()=>{ensureQA(P);const G=groupsInBoq(),have=new Set(P.itp.map(i=>i.g+'|'+i.act));let k=0;
  (G.length?G:Object.keys(ITPT)).forEach(g=>(ITPT[g]||[]).forEach(([act,crit,rec,pc,pk])=>{if(have.has(g+'|'+act))return;P.itp.push(Object.assign({id:uid()},{g,act,crit,rec,pc,pk}));k++}));
  save();render();toast(k?`เพิ่ม ITP ${k} รายการ ตามระบบใน BOQ`:'มี ITP มาตรฐานครบแล้ว')};
ACT.wirNcr=b=>{const w=P.wir.find(x=>x.id===b.dataset.id);if(!w)return;const r=Object.assign({id:uid()},NEW.ncr(P.ncr),{src:'cons',loc:w.loc,g:w.g,wir:w.id,desc:w.note||`งานตาม ${w.no} ไม่ผ่านการตรวจ`});
  P.ncr.push(r);S.sub.qa='ncr';S.sel.ncr=r.id;save();render();scrollTo({top:0})};
ACT.wirAgain=b=>{const w=P.wir.find(x=>x.id===b.dataset.id);if(!w)return;const r=Object.assign({id:uid()},NEW.wir(P.wir),{loc:w.loc,g:w.g,itp:w.itp,desc:`${w.desc} (ขอตรวจใหม่ อ้างอิง ${w.no})`,status:'draft'});
  P.wir.push(r);S.sel.wir=r.id;save();render()};

/* signature drawn with a finger or mouse; stored as a small PNG on the record */
let SIG=null;
ACT.sign=b=>{SIG={path:b.dataset.c,f:b.dataset.f};dialog(esc(b.dataset.t||'ลงชื่อ'),`<p class="hint" style="margin:0 0 8px">เซ็นชื่อในกรอบด้วยนิ้วหรือเมาส์</p><canvas id="sigPad" width="560" height="200" style="width:100%;max-width:560px;height:auto;aspect-ratio:560/200;border:1px dashed var(--line);border-radius:10px;background:#fff;touch-action:none;display:block"></canvas>`,
    '<button type="button" class="btn" data-a="sigClr">ล้าง</button><button type="button" class="btn pri" data-a="sigOk">บันทึกลายเซ็น</button>');
  const c=$('#sigPad'),x=c.getContext('2d');x.lineWidth=2.6;x.lineCap='round';x.lineJoin='round';x.strokeStyle='#1d2b46';let on=false,any=false;
  const pt=e=>{const r=c.getBoundingClientRect();return [(e.clientX-r.left)*c.width/r.width,(e.clientY-r.top)*c.height/r.height]};
  c.onpointerdown=e=>{on=true;any=true;c.setPointerCapture(e.pointerId);const [a,b2]=pt(e);x.beginPath();x.moveTo(a,b2)};
  c.onpointermove=e=>{if(!on)return;const [a,b2]=pt(e);x.lineTo(a,b2);x.stroke()};c.onpointerup=c.onpointercancel=()=>{on=false};SIG.any=()=>any};
ACT.sigClr=()=>{const c=$('#sigPad');if(c)c.getContext('2d').clearRect(0,0,c.width,c.height);if(SIG)SIG.any=()=>false};
ACT.sigOk=()=>{if(!SIG)return;const c=$('#sigPad'),o=resolve(SIG.path);if(!o||!c)return;if(!SIG.any()){toast('ยังไม่ได้เซ็น');return}
  o[SIG.f]=c.toDataURL('image/png');o[SIG.f+'At']=new Date().toISOString();SIG=null;$('#dlg').close();save();render();toast('บันทึกลายเซ็นแล้ว')};
ACT.sigDel=b=>{const o=resolve(b.dataset.c);if(o&&confirm('ลบลายเซ็นนี้?')){delete o[b.dataset.f];delete o[b.dataset.f+'At'];save();render()}};
const sigBox=(path,o,f,title,nameK)=>`<div class="sigb"><b>${title}</b>${nameK?`<input data-p="${path}.${nameK}" value="${esc(o[nameK]||'')}" placeholder="ชื่อ-สกุล" aria-label="ชื่อ ${title}">`:''}
  ${o[f]?`<img src="${o[f]}" alt="ลายเซ็น ${title}"><small class="muted">${new Date(o[f+'At']).toLocaleString('th-TH',{dateStyle:'medium',timeStyle:'short'})}</small><button type="button" class="btn sm del" data-a="sigDel" data-c="${path}" data-f="${f}">ลบลายเซ็น</button>`
  :`<button type="button" class="btn sm" data-a="sign" data-c="${path}" data-f="${f}" data-t="${esc(title)}">✍ เซ็นบนจอ</button>`}</div>`;
const sigPrint=(o,f,title,name)=>`<div class="sgp">${o&&o[f]?`<img src="${o[f]}" alt="">`:'<i></i>'}<p>${title}${name?`<br><small>(${esc(name)})</small>`:''}<br><small>วันที่ ${o&&o[f+'At']?thD(o[f+'At'].slice(0,10)):'........./........./.........'}</small></p></div>`;

function qaItp(){const rows=P.itp,cols=[{k:'g',h:'ระบบ',t:'sel',o:G_OPTS(),w:150},{k:'act',h:'กิจกรรมที่ตรวจ',w:220},{k:'crit',h:'เกณฑ์ยอมรับ / อ้างอิง',w:200},{k:'rec',h:'บันทึก',w:110},{k:'pc',h:'ผู้รับเหมา',t:'sel',o:PT,w:120},{k:'pk',h:'ที่ปรึกษา',t:'sel',o:PT,w:120},
    {h:'WIR',t:'calc',r:1,f:i=>{const L=P.wir.filter(w=>w.itp===i.id);return L.length?`${L.filter(w=>w.status==='ok'||w.status==='okc').length}/${L.length}`:''}}];
  TABLES.itp={rows:()=>P.itp,cols};
  return `<section class="card"><h2><span>แผนการตรวจสอบและทดสอบ (ITP)</span><small>H = ต้องหยุดรอให้ตรวจก่อนทำงานต่อ · W = แจ้งให้มาตรวจพร้อมกัน · R = ตรวจจากเอกสาร · S = สุ่มตรวจ</small><span class="sp"></span>${copyBtn('itp')}<button type="button" class="btn sm" data-a="print" data-k="itp" data-id="">พิมพ์ ITP</button></h2>
  ${gtable('itp',rows,cols,{empty:'ยังไม่มี ITP กด “สร้าง ITP มาตรฐาน” เพื่อเริ่มจากระบบที่มีใน BOQ'})}
  <div class="row" style="margin-top:8px"><button type="button" class="btn sm pri" data-a="add" data-c="itp">+ เพิ่มรายการ</button><button type="button" class="btn sm" data-a="itpStd">สร้าง ITP มาตรฐาน</button></div></section>`}
function qaWir(){const L=P.wir.slice().sort((a,b)=>(b.date||'').localeCompare(a.date||'')),sel=P.wir.find(x=>x.id===S.sel.wir)||L[0];
  const list=`<section class="card"><h2><span>คำขอตรวจงาน (WIR)</span><small>ส่งให้ที่ปรึกษาหรือผู้ควบคุมงานมาตรวจก่อนปิดงานหรือเทคอนกรีตทับ</small><span class="sp"></span><button type="button" class="btn sm pri" data-a="add" data-c="wir" data-sel="wir">+ ขอตรวจงาน</button></h2>
  <div class="tw"><table><thead><tr><th>เลขที่</th><th>วันที่ตรวจ</th><th>ตำแหน่ง</th><th>ระบบ</th><th>งานที่ขอตรวจ</th><th>ผล</th><th></th></tr></thead><tbody>
  ${L.length?L.map(w=>`<tr class="${sel&&sel.id===w.id?'sel':''}"><td><button type="button" class="btn ghost sm" data-a="sel" data-k="wir" data-id="${w.id}"><b>${esc(w.no)}</b></button></td><td>${thD(w.insp)} ${esc(w.time||'')}</td><td>${esc(w.loc)}</td><td>${esc(gName(w.g)||'')}</td><td>${esc(w.desc)}</td><td>${pill(WST,w.status,wCls(w.status))}</td><td><button type="button" class="x" data-a="delRow" data-c="wir" data-id="${w.id}" aria-label="ลบ">✕</button></td></tr>`).join(''):'<tr><td colspan="7" class="empty">ยังไม่มีคำขอตรวจงาน</td></tr>'}</tbody></table></div></section>`;
  if(!sel)return list;const b=`wir.${sel.id}`,I=P.itp.filter(i=>!sel.g||i.g===sel.g),chk=sel.chk||{};
  return list+`<section class="card"><h2><span>${esc(sel.no)}</span>${pill(WST,sel.status,wCls(sel.status))}<span class="sp"></span>
    ${sel.status==='rej'?`<button type="button" class="btn sm" data-a="wirNcr" data-id="${sel.id}">ออก NCR</button><button type="button" class="btn sm" data-a="wirAgain" data-id="${sel.id}">ขอตรวจใหม่</button>`:''}<button type="button" class="btn sm pri" data-a="print" data-k="wir" data-id="${sel.id}">พิมพ์ WIR</button></h2>
  <div class="form"><label>เลขที่<input data-p="${b}.no" value="${esc(sel.no)}"></label><label>วันที่ขอ<input type="date" data-p="${b}.date" value="${esc(sel.date)}"></label><label>วันที่นัดตรวจ<input type="date" data-p="${b}.insp" value="${esc(sel.insp||'')}"></label><label>เวลา<input data-p="${b}.time" value="${esc(sel.time||'')}"></label>
    <label>ระบบ<select data-p="${b}.g">${G_OPTS().map(([k,l])=>`<option value="${k}"${k===sel.g?' selected':''}>${esc(l)}</option>`).join('')}</select></label>
    <label>ตาม ITP<select data-p="${b}.itp"><option value="">–</option>${I.map(i=>`<option value="${i.id}"${i.id===sel.itp?' selected':''}>${esc(i.act)}</option>`).join('')}</select></label>
    <label class="w2">ตำแหน่ง / ชั้น / โซน<input data-p="${b}.loc" value="${esc(sel.loc)}"></label><label class="full">งานที่ขอตรวจ<input data-p="${b}.desc" value="${esc(sel.desc)}"></label>
    <label>ผู้ขอตรวจ (QC)<input data-p="${b}.by" value="${esc(sel.by||'')}"></label><label>สถานะ<select data-p="${b}.status">${WST.map(([k,l])=>`<option value="${k}"${k===sel.status?' selected':''}>${l}</option>`).join('')}</select></label></div>
  ${I.length?`<h3 class="fm-g">รายการตรวจตาม ITP</h3><div class="tw"><table><thead><tr><th>รายการ</th><th>เกณฑ์</th><th>ผล</th></tr></thead><tbody>${I.map(i=>`<tr><td>${esc(i.act)}</td><td><small>${esc(i.crit)}</small></td><td><select data-p="${b}.chk.${i.id}" aria-label="ผล">${RES.map(([k,l])=>`<option value="${k}"${chk[i.id]===k?' selected':''}>${l}</option>`).join('')}</select></td></tr>`).join('')}</tbody></table></div>`:''}
  <h3 class="fm-g">ผลการตรวจจากที่ปรึกษา</h3><div class="form"><label>ชื่อผู้ตรวจ (ที่ปรึกษา)<input data-p="${b}.kName" value="${esc(sel.kName||'')}"></label><label>วันที่ตรวจจริง<input type="date" data-p="${b}.kDate" value="${esc(sel.kDate||'')}"></label><label class="full">ความเห็น<input data-p="${b}.note" value="${esc(sel.note||'')}"></label></div>
  <div class="sigs">${sigBox(b,sel,'sigC','ผู้ขอตรวจ (ผู้รับเหมา)','')}${sigBox(b,sel,'sigK','ผู้ตรวจ (ที่ปรึกษา)','')}</div></section>`}
function qaNcr(){const L=P.ncr.slice().sort((a,b)=>(b.date||'').localeCompare(a.date||'')),sel=P.ncr.find(x=>x.id===S.sel.ncr)||L[0],td=today();
  const list=`<section class="card"><h2><span>รายงานงานไม่เป็นไปตามข้อกำหนด (NCR)</span><small>เปิดเมื่อพบงานไม่ตรงแบบหรือไม่ผ่านการตรวจ ปิดได้เมื่อที่ปรึกษาตรวจและเซ็นรับการแก้ไข</small><span class="sp"></span><button type="button" class="btn sm pri" data-a="add" data-c="ncr" data-sel="ncr">+ เปิด NCR</button></h2>
  <div class="tw"><table><thead><tr><th>เลขที่</th><th>วันที่</th><th>ผู้ออก</th><th>ตำแหน่ง</th><th>ปัญหา</th><th>กำหนดแก้</th><th>สถานะ</th><th></th></tr></thead><tbody>
  ${L.length?L.map(r=>`<tr class="${sel&&sel.id===r.id?'sel':''}"><td><button type="button" class="btn ghost sm" data-a="sel" data-k="ncr" data-id="${r.id}"><b>${esc(r.no)}</b></button></td><td>${thD(r.date)}</td><td>${esc((NSRC.find(x=>x[0]===r.src)||NSRC[0])[1])}</td><td>${esc(r.loc)}</td><td>${esc(r.desc)}</td><td${r.status!=='closed'&&okD(r.due)&&r.due<td?' style="color:var(--danger)"':''}>${thD(r.due)}</td><td>${pill(NST,r.status,nCls(r.status))}</td><td><button type="button" class="x" data-a="delRow" data-c="ncr" data-id="${r.id}" aria-label="ลบ">✕</button></td></tr>`).join(''):'<tr><td colspan="8" class="empty">ยังไม่มี NCR</td></tr>'}</tbody></table></div></section>`;
  if(!sel)return list;const b=`ncr.${sel.id}`,w=P.wir.find(x=>x.id===sel.wir),o=(L2,k)=>L2.map(([a,l])=>`<option value="${a}"${a===sel[k]?' selected':''}>${l}</option>`).join('');
  return list+`<section class="card"><h2><span>${esc(sel.no)}</span>${pill(NST,sel.status,nCls(sel.status))}<span class="sp"></span><button type="button" class="btn sm pri" data-a="print" data-k="ncr" data-id="${sel.id}">พิมพ์ NCR</button></h2>
  <div class="form"><label>เลขที่<input data-p="${b}.no" value="${esc(sel.no)}"></label><label>วันที่<input type="date" data-p="${b}.date" value="${esc(sel.date)}"></label><label>ผู้ออก NCR<select data-p="${b}.src">${o(NSRC,'src')}</select></label><label>ระดับ<select data-p="${b}.sev">${o(NSEV,'sev')}</select></label>
    <label>ระบบ<select data-p="${b}.g">${o(G_OPTS(),'g')}</select></label><label class="w2">ตำแหน่ง<input data-p="${b}.loc" value="${esc(sel.loc)}"></label><label>อ้างอิง WIR<input value="${esc(w?w.no:'–')}" disabled></label>
    <label class="full">สิ่งที่ไม่เป็นไปตามข้อกำหนด<textarea data-p="${b}.desc" rows="2">${esc(sel.desc)}</textarea></label>
    <label class="full">สาเหตุ<textarea data-p="${b}.cause" rows="2">${esc(sel.cause||'')}</textarea></label>
    <label class="full">วิธีแก้ไข<textarea data-p="${b}.corr" rows="2">${esc(sel.corr||'')}</textarea></label>
    <label class="full">การป้องกันไม่ให้เกิดซ้ำ<textarea data-p="${b}.prev" rows="2">${esc(sel.prev||'')}</textarea></label>
    <label>ผู้รับผิดชอบ<input data-p="${b}.who" value="${esc(sel.who||'')}"></label><label>กำหนดแก้เสร็จ<input type="date" data-p="${b}.due" value="${esc(sel.due||'')}"></label><label>สถานะ<select data-p="${b}.status">${o(NST,'status')}</select></label>
    <label>ผู้ออก NCR (ชื่อ)<input data-p="${b}.iName" value="${esc(sel.iName||'')}"></label><label>ผู้ตรวจปิด (ชื่อ)<input data-p="${b}.cName" value="${esc(sel.cName||'')}"></label><label>วันที่ปิด<input type="date" data-p="${b}.cDate" value="${esc(sel.cDate||'')}"></label></div>
  <h3 class="fm-g">รูปถ่าย</h3>${photoBlock(b,sel)}
  <div class="sigs">${sigBox(b,sel,'sigI','ผู้ออก NCR','')}${sigBox(b,sel,'sigA','ผู้รับเหมารับทราบ','')}${sigBox(b,sel,'sigX','ที่ปรึกษาตรวจปิด','')}</div></section>`}
// closing signature or a closing date closes the NCR; signing the WIR with a result settles it
HOOK.push(path=>{const m=path.match(/^ncr\.([^.]+)\.(cDate|status)$/);if(m){const r=P.ncr.find(x=>x.id===m[1]);if(r&&m[2]==='cDate'&&okD(r.cDate)&&r.status!=='closed')r.status='closed'}});
VIEWS.qa=()=>{ensureQA(P);const {cur,html}=subTabs('qa',[['wir','ขอตรวจงาน (WIR)'],['ncr','NCR'],['itp','แผนตรวจสอบ (ITP)']]),td=today();
  const W=P.wir,N=P.ncr,ok=W.filter(w=>w.status==='ok'||w.status==='okc').length,done=W.filter(w=>w.status!=='draft'&&w.status!=='req').length,openN=N.filter(r=>r.status!=='closed');
  return html+`<dl class="stats"><div><dt>WIR ทั้งหมด</dt><dd>${W.length}</dd></div><div><dt>รอผลตรวจ</dt><dd${W.some(w=>w.status==='req')?' style="color:var(--warn-c)"':''}>${W.filter(w=>w.status==='req').length}</dd></div><div><dt>ผ่านครั้งแรก</dt><dd style="color:var(--good)">${done?Math.round(ok/done*100):0}%</dd></div>
    <div><dt>NCR ค้าง</dt><dd${openN.length?' style="color:var(--danger)"':''}>${openN.length}</dd></div><div><dt>NCR เลยกำหนด</dt><dd>${openN.filter(r=>okD(r.due)&&r.due<td).length}</dd></div><div><dt>รายการ ITP</dt><dd>${P.itp.length}</dd></div></dl>`+({wir:qaWir,ncr:qaNcr,itp:qaItp}[cur]||qaWir)()};

PRINT.itp=()=>phead('แผนการตรวจสอบและทดสอบ (ITP)','H จุดหยุดรอตรวจ · W ตรวจพร้อมกัน · R ตรวจเอกสาร · S สุ่มตรวจ')+`<table><thead><tr><th>#</th><th>ระบบ</th><th>กิจกรรม</th><th>เกณฑ์ยอมรับ / อ้างอิง</th><th>บันทึก</th><th>ผู้รับเหมา</th><th>ที่ปรึกษา</th></tr></thead><tbody>${P.itp.map((i,k)=>`<tr><td>${k+1}</td><td>${esc(gName(i.g)||'')}</td><td>${esc(i.act)}</td><td>${esc(i.crit)}</td><td>${esc(i.rec)}</td><td style="text-align:center">${esc(i.pc||'')}</td><td style="text-align:center">${esc(i.pk||'')}</td></tr>`).join('')}</tbody></table>
  <div class="sign"><div>จัดทำโดย (QC ผู้รับเหมา)</div><div>ตรวจสอบโดย</div><div>อนุมัติโดย (ที่ปรึกษา)</div></div>`;
PRINT.wir=id=>{const w=P.wir.find(x=>x.id===id);if(!w)return '';const I=P.itp.filter(i=>!w.g||i.g===w.g),chk=w.chk||{};
  return phead(`คำขอตรวจงาน ${esc(w.no)}`,`วันที่ขอ ${thDL(w.date)}<br>นัดตรวจ ${thDL(w.insp)} ${esc(w.time||'')}`)+`<div class="meta"><div><b>ตำแหน่ง:</b> ${esc(w.loc)}</div><div><b>ระบบ:</b> ${esc(gName(w.g)||'')}</div><div style="grid-column:1/-1"><b>งานที่ขอตรวจ:</b> ${esc(w.desc)}</div></div>
  ${I.length?`<table><thead><tr><th>#</th><th>รายการตรวจ</th><th>เกณฑ์ยอมรับ</th><th>ผ่าน</th><th>ไม่ผ่าน</th></tr></thead><tbody>${I.map((i,k)=>`<tr><td>${k+1}</td><td>${esc(i.act)}</td><td>${esc(i.crit)}</td><td style="text-align:center">${chk[i.id]==='pass'?'✔':'☐'}</td><td style="text-align:center">${chk[i.id]==='fail'?'✘':'☐'}</td></tr>`).join('')}</tbody></table>`:''}
  <h3>ผลการตรวจ</h3><div class="box">${WST.slice(2).map(([k,l])=>`${w.status===k?'☑':'☐'} ${l}`).join('&nbsp;&nbsp;&nbsp;')}<br><br>ความเห็น: ${esc(w.note||'')}</div>
  <div class="sign" style="grid-template-columns:1fr 1fr">${sigPrint(w,'sigC','ผู้ขอตรวจ (ผู้รับเหมา)',w.by)}${sigPrint(w,'sigK','ผู้ตรวจ (ที่ปรึกษา / ผู้ควบคุมงาน)',w.kName)}</div>`};
PRINT.ncr=id=>{const r=P.ncr.find(x=>x.id===id);if(!r)return '';const w=P.wir.find(x=>x.id===r.wir);
  return phead(`รายงานงานไม่เป็นไปตามข้อกำหนด ${esc(r.no)}`,`วันที่ ${thDL(r.date)}<br>กำหนดแก้ ${thDL(r.due)}`)+`<div class="meta"><div><b>ผู้ออก:</b> ${esc((NSRC.find(x=>x[0]===r.src)||NSRC[0])[1])}</div><div><b>ระดับ:</b> ${esc((NSEV.find(x=>x[0]===r.sev)||NSEV[0])[1])}</div><div><b>ตำแหน่ง:</b> ${esc(r.loc)}</div><div><b>ระบบ:</b> ${esc(gName(r.g)||'')}${w?` · อ้างอิง ${esc(w.no)}`:''}</div></div>
  <h3>สิ่งที่ไม่เป็นไปตามข้อกำหนด</h3><div class="box">${esc(r.desc)}</div><h3>สาเหตุ</h3><div class="box">${esc(r.cause||'')}</div><h3>วิธีแก้ไข</h3><div class="box">${esc(r.corr||'')}</div><h3>การป้องกันไม่ให้เกิดซ้ำ</h3><div class="box">${esc(r.prev||'')}</div>
  ${(r.photos||[]).length?`<div class="ph">${r.photos.map(k=>`<figure><img data-ph="${k}" alt=""></figure>`).join('')}</div>`:''}
  <div class="sign">${sigPrint(r,'sigI','ผู้ออก NCR',r.iName)}${sigPrint(r,'sigA','ผู้รับเหมารับทราบ',r.who)}${sigPrint(r,'sigX','ที่ปรึกษาตรวจปิด',r.cName)}</div>`};
// open quality items reach the "ต้องดูวันนี้" list
{const f=alerts;alerts=function(){const A=f(),td=today();projects().forEach(p=>{ensureQA(p);
  p.wir.forEach(w=>{if(w.status==='req'&&okD(w.insp)&&w.insp<=td)A.push({lv:w.insp<td?'bad':'warn',kind:'WIR รอผลตรวจ',p,txt:`${w.no} ${w.desc||''} ${w.loc||''}`,due:w.insp,go:{m:'pj',k:'qa',s:'wir'}})});
  p.ncr.forEach(r=>{if(r.status!=='closed'&&okD(r.due)&&r.due<=addD(td,2))A.push({lv:r.due<td?'bad':'warn',kind:r.due<td?'NCR เลยกำหนดแก้':'NCR ใกล้กำหนดแก้',p,txt:`${r.no} ${r.desc||''}`,due:r.due,go:{m:'pj',k:'qa',s:'ncr'}})})});return A}}
document.head.insertAdjacentHTML('beforeend',`<style>
.sigs{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:10px;margin-top:14px}.sigb{border:1px solid var(--line);border-radius:10px;padding:10px;display:flex;flex-direction:column;gap:6px;align-items:flex-start}
#print .sign .sgp{border-top:0;padding-top:0}#print .sign .sgp img,#print .sign .sgp i{display:block;height:46px;width:auto;max-width:100%;margin:0 auto;border:0}#print .sign .sgp p{border-top:1px solid #000;padding-top:4px;margin:0}
.sigb img{max-width:100%;height:70px;object-fit:contain;background:#fff;border-radius:6px;border:1px solid var(--line-2)}
</style>`);

