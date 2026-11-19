/* ---------- 4.99.46 TOR: ขอบเขตงานของลูกค้า แยกงานโครงการ และงานบำรุงรักษา ----------
   User (2026-11-19): "TOR เราจะเอาที่ไหนดี" … "แต่จะแยกสำหรับโครงการ และงานบำรุงรักษา" … "อยากจะให้มีช่องให้เลือก".
   A TOR usually arrives before there is a quotation or a project, so it lives on its own company page (ขาย › TOR) with
   two tabs: TOR งานโครงการ and TOR งานบำรุงรักษา. Each TOR (CO().tors) is picked onto the work it belongs to: a quotation
   (only install quotes on the project tab, only PM/MA quotes on the maintenance tab), a tender, and once the job is won
   a project or a service contract (followed from the quotation by itself). It names the department and person who answer it,
   its dates (deadline in ต้องดูวันนี้), keeps the customer's files untouched (IndexedDB 'tor-…', in photoKeys in 280 so
   folder/cloud sync and backups carry them), and lists its key requirements with our answer (ทำได้ / ต้องถาม / ทำไม่ได้).
   The requirement headings to read differ between the two kinds (TORCAT). The project's เอกสาร page, the quotation and the
   service contract page show the TOR that belongs to them. */
const TORK=[['pj','TOR งานโครงการ'],['ma','TOR งานบำรุงรักษา']];
const TORST=[['read','กำลังอ่าน'],['ans','ตอบข้อกำหนดแล้ว'],['sent','ยื่นราคาแล้ว'],['won','ได้งาน'],['lost','ไม่ได้งาน'],['drop','ไม่ยื่น']];
const TORFT=[['tor','TOR / ขอบเขตงาน'],['con','สัญญา / ใบสั่งจ้าง'],['qt','ใบเสนอราคาที่ยื่น'],['ans','หนังสือชี้แจง / ถามตอบ'],['oth','อื่น ๆ']];
const torReadable=x=>/\.(pdf|docx)$/i.test(x.name||'')||/pdf|wordprocessingml/.test(x.type||'');
const TOROK=[['','–'],['y','ทำได้'],['q','ต้องถาม/ชี้แจง'],['n','ทำไม่ได้/ต่างจาก TOR']];
// headings every TOR of that kind should be read for; the second part is the question that starts the row
const TORCAT={
  pj:[['scope','ขอบเขตงาน','งานที่รวม / ไม่รวมในราคา'],['spec','ยี่ห้อ/สเปกที่กำหนด','ยี่ห้อ รุ่น หรือเทียบเท่าที่ยอมรับ'],['std','มาตรฐาน/การทดสอบ','มาตรฐานที่อ้างถึง การทดสอบและการทดลองเดินเครื่อง'],
    ['time','ระยะเวลา','ระยะเวลาทำงาน วันเริ่ม และวันส่งมอบ'],['fine','ค่าปรับ','ค่าปรับต่อวัน และเพดานค่าปรับ'],['bond','หลักประกัน','หลักประกันซอง / สัญญา / ผลงาน และเงินประกันผลงาน'],
    ['pay','งวดเงิน','จำนวนงวด เงินล่วงหน้า และเงื่อนไขการจ่าย'],['war','รับประกัน','ระยะรับประกันอุปกรณ์และงานติดตั้ง'],['doc','เอกสารส่งมอบ','Shop drawing, As-built, คู่มือ, อบรม'],
    ['acc','การตรวจรับงาน','ใครตรวจรับ ตรวจอย่างไร ส่งมอบที่ไหน'],['sub','การจ้างช่วง','จ้างช่วงได้หรือไม่ ต้องขออนุญาตก่อนไหม'],['safe','ความรับผิดชอบ/ความปลอดภัย','อุบัติเหตุ ความเสียหาย บุคคลภายนอก กฎความปลอดภัยของหน้างาน'],
    ['qual','คุณสมบัติผู้ยื่น','ผลงานที่ต้องมี ทุนจดทะเบียน ใบอนุญาต วิศวกร'],['oth','อื่น ๆ','']],
  ma:[['eq','เครื่อง/ระบบที่ดูแล','รายการเครื่อง จำนวน และสถานที่'],['freq','ความถี่ PM','เข้า PM กี่ครั้งต่อปี และรายการตรวจของแต่ละครั้ง'],['sla','เวลาเข้าซ่อม (SLA)','รับแจ้งแล้วต้องถึงหน้างานภายในกี่ชั่วโมง ตลอด 24 ชม. หรือไม่'],
    ['part','อะไหล่และน้ำยา','อะไหล่ / น้ำยา / ฟิลเตอร์ รวมหรือไม่รวมในราคา'],['rep','รายงาน','รายงานหลังเข้างาน รูปถ่าย ค่าที่ต้องวัด'],['fine','ค่าปรับ','ค่าปรับเมื่อเข้างานช้า หรือเครื่องหยุดนาน'],
    ['term','ระยะสัญญา','ระยะสัญญา วันเริ่ม และการต่อสัญญา'],['pay','การจ่ายเงิน','จ่ายรายเดือน / รายครั้ง / รายปี'],['staff','ช่างและเครื่องมือ','จำนวนช่าง คุณสมบัติ ใบอนุญาต เครื่องมือที่ต้องมี'],
    ['bond','หลักประกันสัญญา','หลักประกันกี่ % ชนิดไหน วางภายในกี่วัน คืนเมื่อไร'],['acc','การตรวจรับงาน','ส่งมอบงานทุกเดือน/ทุกงวด ภายในวันที่เท่าไร ใครตรวจรับ'],
    ['sub','การจ้างช่วง','จ้างช่วงได้หรือไม่ ต้องขออนุญาตก่อนไหม'],['safe','ความรับผิดชอบ/ความปลอดภัย','อุบัติเหตุ ความเสียหายต่อเครื่องและบุคคลภายนอก กฎความปลอดภัย'],
    ['qual','คุณสมบัติผู้ยื่น','ผลงานที่ต้องมี (วงเงิน / ไม่เกินกี่ปี) นิติบุคคล ไม่อยู่ในบัญชีทิ้งงาน'],['oth','อื่น ๆ','']]};
// a clause read out of a TOR file goes under the first heading whose words it has (the more specific ones first)
const TORKW=[['bond',/หลักประกัน/],['sub',/จ้างช่วง/],['fine',/ค่าปรับ|ปรับเป็นราย|ปรับวันละ/],['acc',/ตรวจรับ|ส่งมอบงาน|คณะกรรมการตรวจ/],['qual',/คุณสมบัติ|นิติบุคคล|ผลงาน.*(วงเงิน|ปี)|ทิ้งงาน|ทิงงาน|คุ้มกัน/],
  ['safe',/อุบัติเหตุ|ปลอดภัย|เสียหาย|บุคคลภายนอก/],['sla',/ชั่วโมง|ชม\.|ฉุกเฉิน|ภายใน\s*\d+\s*(วัน|ชั่วโมง).*(แจ้ง|ซ่อม)/],['part',/อะไหล่|น้ำยา|ชิ้นส่วน|ชินส่วน|วัสดุสิ้นเปลือง|ซ่อมเปลี่ยน/],
  ['rep',/รายงาน|บันทึก/],['pay',/งวด|จ่ายเงิน|ค่าจ้าง|วงเงิน|งบประมาณ/],['war',/รับประกัน/],['term',/ระยะเวลา|พ\.ศ\.|ระยะสัญญา/],['staff',/ช่าง|วิศวกร|เครื่องมือ|ใบประกอบ|ปวส|ปวช/],
  ['eq',/ยี่ห้อ|รุ่น|ขนาด.*ตัน|BTU|จำนวน\s*\d+\s*(เครื่อง|ชุด)|จานวน\s*\d+\s*(เครื่อง|ชุด)/i],['spec',/ยี่ห้อ|รุ่น|เทียบเท่า|สเปก|คุณลักษณะ/],['std',/มาตรฐาน|ทดสอบ|Test/i],['doc',/As.?built|Shop drawing|คู่มือ|อบรม/i],
  ['freq',/ครั้ง\s*\/\s*ปี|ทุก\s*\d+\s*เดือน|ทุกครั้ง|ตรวจเช็ค|ตรวจสอบ|ทำความสะอาด|ทาความสะอาด|ล้าง|เปลี่ยน|FILTER|บำรุงรักษา|บารุงรักษา/i],['scope',/ติดตั้ง|รื้อ|เดินท่อ|งาน/]];
const torCatOf=(kind,txt)=>{const ok=new Set(TORCAT[kind].map(x=>x[0]));const m=TORKW.find(([k,re])=>ok.has(k)&&re.test(txt));return m?m[0]:''};
NEW.tors=arr=>({no:nextNo('TOR-',arr),kind:S.sub.tor==='ma'?'ma':'pj',title:'',cust:'',owner:'',site:'',q:'',td:'',pj:'',svc:'',dept:S.sub.tor==='ma'?'SVC':'EST',by:'',
  recv:today(),visit:'',due:'',budget:'',months:'',visits:'',sla:'',status:'read',files:[],req:[],note:''});
const torCfg=()=>{const C=CO();if(!Array.isArray(C.tors))C.tors=[];return C.tors};
const torKind=t=>t&&t.kind==='ma'?'ma':'pj';
const torQ=t=>t&&t.q?CO().quotes.find(q=>q.id===t.q):null;
const torPj=t=>{if(!t)return '';if(t.pj&&DB.projects[t.pj])return t.pj;const Q=torQ(t);return Q&&Q.pj&&DB.projects[Q.pj]?Q.pj:''};
const torSvc=t=>{if(!t)return null;const C=CO(),L=C.svc||[];return L.find(s=>s.id===t.svc)||(()=>{const Q=torQ(t);return Q&&Q.svc?L.find(s=>s.id===Q.svc):null})()||null};
const torTd=t=>t&&t.td?(CO().tenders||[]).find(x=>x.id===t.td):null;
const torDays=d=>okD(d)?Math.round((pd(d)-pd(today()))/864e5):null;
const torOpenSt=t=>!['won','lost','drop','sent'].includes(t.status);
const torCnt=t=>{const R=(t.req||[]).filter(r=>String(r.t||'').trim()||r.ok);return {all:R.length,y:R.filter(r=>r.ok==='y').length,q:R.filter(r=>r.ok==='q').length,n:R.filter(r=>r.ok==='n').length,none:R.filter(r=>!r.ok).length}};
const torCur=k=>{const L=torCfg().filter(t=>torKind(t)===k);return L.find(t=>t.id===S.sel.tor)||null};
const torDue=t=>{const d=torDays(t.due);if(d==null)return '–';const c=!torOpenSt(t)?'':d<0?'bad':d<=3?'warn':'';
  return `${thD(t.due)}${torOpenSt(t)?` <span class="pill ${c}">${d<0?`เลย ${-d} วัน`:d===0?'วันนี้':`อีก ${d} วัน`}</span>`:''}`};
const torLinkTxt=t=>{const Q=torQ(t),pj=torPj(t),s=torSvc(t),td=torTd(t),L=[];
  if(Q)L.push(`ใบเสนอราคา ${esc(Q.no||'')}`);if(td)L.push(`ประมูล ${esc(td.no||'')}`);if(pj)L.push(`โครงการ ${esc(DB.projects[pj].name||'')}`);if(s)L.push(`สัญญา ${esc(s.no||'')}`);
  return L.join(' · ')||'<span class="muted">ยังไม่ผูก</span>'};
const torWho=t=>[(DEPTS().find(d=>d[0]===t.dept)||[,''])[1],staffName(t.by)].filter(Boolean).join(' · ');

COTABS.splice(COTABS.findIndex(t=>t[0]==='sales')+1,0,['tor','TOR']);
ICO.tor='<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M8 13l2.5 2.5L16 10"/>';
['SAL','EST','DES','SVC','PRJ'].forEach(k=>{if(ACCESS[k]&&Array.isArray(ACCESS[k].co))ACCESS[k].co.push('tor')});
{const d=NAVD.find(x=>x[0]==='sales');if(d)d[2].push(['co','tor','pj','TOR งานโครงการ'],['co','tor','ma','TOR งานบำรุงรักษา'])}
{const d=NAVD.find(x=>x[0]==='est');if(d)d[2].push(['co','tor','pj','TOR งานโครงการ'])}
{const d=NAVD.find(x=>x[0]==='svc');if(d)d[2].push(['co','tor','ma','TOR งานบำรุงรักษา'])}

CVIEWS.tor=()=>{torCfg();const {cur,html}=subTabs('tor',TORK);const t=torCur(cur);return html+torList(cur)+(t?torOne(t):'')};
function torList(k){const L=torCfg().filter(t=>torKind(t)===k).slice().reverse(),sel=S.sel.tor,open=L.filter(torOpenSt),soon=open.filter(t=>{const d=torDays(t.due);return d!=null&&d<=7});
  const ma=k==='ma';
  return `<dl class="stats"><div><dt>กำลังทำ</dt><dd>${open.length}</dd></div><div><dt>ยื่นภายใน 7 วัน</dt><dd>${soon.length}</dd></div><div><dt>ยื่นแล้วรอผล</dt><dd>${L.filter(t=>t.status==='sent').length}</dd></div><div><dt>ได้งาน</dt><dd>${L.filter(t=>t.status==='won').length}</dd></div></dl>
  <section class="card"><h2><span>${ma?'TOR งานบำรุงรักษา':'TOR งานโครงการ'}</span><small>${ma?'สัญญา PM / MA ล้างเครื่อง ซ่อมบำรุง':'งานติดตั้ง ก่อสร้าง ปรับปรุงระบบ'} · เก็บไฟล์ TOR ของลูกค้า และข้อกำหนดที่ต้องตอบ</small><span class="sp"></span>
    <button type="button" class="btn sm pri" data-a="add" data-c="co.tors" data-sel="tor">+ เพิ่ม TOR ${ma?'งานบำรุงรักษา':'งานโครงการ'}</button></h2>
  <div class="tw"><table><thead><tr><th>เลขที่</th><th>ชื่องาน</th><th>ลูกค้า</th><th>ผูกกับ</th><th>ผู้รับผิดชอบ</th><th>${ma?'วันส่งราคา':'วันยื่นซอง'}</th><th class="r">ข้อกำหนด</th><th class="r">ไฟล์</th><th>สถานะ</th></tr></thead><tbody>
  ${L.length?L.map(t=>{const c=torCnt(t),st=TORST.find(s=>s[0]===t.status)||TORST[0];return `<tr class="${sel===t.id?'sel':''}"><td><button type="button" class="btn ghost sm" data-a="sel" data-k="tor" data-id="${t.id}"><b>${esc(t.no)}</b></button></td>
    <td>${esc(t.title||'')}</td><td>${esc(custName(t.cust)||t.owner||'')}</td><td>${torLinkTxt(t)}</td><td>${esc(torWho(t))}</td><td>${torDue(t)}</td>
    <td class="r">${c.all?`${c.y}/${c.all}${c.n?` <span class="pill bad">ไม่ได้ ${c.n}</span>`:''}${c.q?` <span class="pill warn">ถาม ${c.q}</span>`:''}`:'–'}</td><td class="r">${(t.files||[]).length||''}</td>
    <td><span class="pill ${t.status==='won'?'ok':t.status==='lost'?'bad':t.status==='sent'?'info':''}">${st[1]}</span></td></tr>`}).join('')
    :`<tr><td colspan="9" class="empty">ยังไม่มี TOR กด “+ เพิ่ม TOR” แล้วแนบไฟล์ TOR ของลูกค้า</td></tr>`}</tbody></table></div></section>`}
function torOpts(L,v){return L.map(([k,l])=>`<option value="${esc(k)}"${String(k)===String(v||'')?' selected':''}>${esc(l)}</option>`).join('')}
function torOne(t){const C=CO(),b=`co.tors.${t.id}`,ma=torKind(t)==='ma',Q=torQ(t),pj=torPj(t),sv=torSvc(t);
  const f=(k,l,o={})=>`<label class="${o.cls||''}">${l}<input${o.num?' data-t="num" inputmode="decimal"':''}${o.type?` type="${o.type}"`:''} data-p="${b}.${k}" value="${esc(t[k]??'')}"${o.ph?` placeholder="${esc(o.ph)}"`:''}></label>`;
  const sel=(k,l,L,cls='')=>`<label class="${cls}">${l}<select data-p="${b}.${k}">${torOpts(L,t[k])}</select></label>`;
  const qs=C.quotes.filter(q=>(q.kind==='ma')===ma&&(!t.cust||!q.cust||q.cust===t.cust||q.id===t.q)).slice().reverse().map(q=>[q.id,`${q.no||''} ${q.title||''}${q.cust?' · '+custName(q.cust):''}`]);
  const pjs=projects().map(p=>[p.id,p.name||'']);
  const svs=(C.svc||[]).filter(s=>!t.cust||!s.cust||s.cust===t.cust||s.id===t.svc).map(s=>[s.id,`${s.no||''} ${s.title||''}`]);
  const tds=(C.tenders||[]).map(x=>[x.id,`${x.no||''} ${x.title||''}`]);
  const stf=(C.staff||[]).filter(s=>s.active!==false&&(!t.dept||s.dept===t.dept||s.id===t.by)).map(s=>[s.id,s.name||s.code||'']);
  const go=[Q?`<button type="button" class="btn sm" data-a="torGoQ" data-id="${t.id}">เปิดใบเสนอราคา ${esc(Q.no||'')}</button>`:'',
    pj?`<button type="button" class="btn sm" data-a="go" data-m="pj" data-k="docs" data-p="${pj}">เปิดโครงการ ${esc(DB.projects[pj].name||'')}</button>`:'',
    sv?`<button type="button" class="btn sm" data-a="go" data-m="co" data-k="svc" data-s="con">เปิดสัญญา ${esc(sv.no||'')}</button>`:''].join('');
  const head=`<section class="card" id="torOne"><h2><span>${esc(t.no)} ${esc(t.title||'')}</span><small>${ma?'TOR งานบำรุงรักษา':'TOR งานโครงการ'}</small><span class="sp"></span>
    <button type="button" class="btn sm" data-a="torKind" data-id="${t.id}" title="ย้ายไปอีกแท็บ">ย้ายไป${ma?'งานโครงการ':'งานบำรุงรักษา'}</button><button type="button" class="btn sm del" data-a="torDel" data-id="${t.id}">ลบ TOR</button></h2>
  <h3 style="margin:4px 0 6px">ข้อมูลงาน</h3>
  <div class="form">${f('no','เลขที่')}${f('title','ชื่องาน',{cls:'w2',ph:ma?'เช่น สัญญาบำรุงรักษาระบบปรับอากาศ ปี 2570':'เช่น งานติดตั้งระบบปรับอากาศ อาคาร A'})}
    ${sel('cust','ลูกค้า (จากทะเบียน)',[['','–'],...C.customers.map(c=>[c.id,c.name])])}${f('owner','หน่วยงาน / เจ้าของงาน',{ph:custName(t.cust)||''})}${f('site','สถานที่')}
    ${f('budget',ma?'งบประมาณต่อปี':'ราคากลาง / งบประมาณ',{num:1})}${sel('status','สถานะ',TORST)}
    ${t.status==='won'?f('conNo','เลขที่สัญญา / ใบสั่งจ้าง')+f('conVal','มูลค่าสัญญา (รวม VAT)',{num:1}):''}</div>
  <h3 style="margin:16px 0 6px">ผูกกับงาน <small class="hint">เลือกใบเสนอราคาที่ทำจาก TOR นี้ พอกดได้งาน ระบบจะผูก${ma?'สัญญาบำรุงรักษา':'โครงการ'}ให้เอง</small></h3>
  <div class="form">${sel('q',ma?'ใบเสนอราคา PM/MA':'ใบเสนอราคา',[['','– ยังไม่ทำ –'],...qs],'w2')}
    ${ma?'':sel('td','งานประมูล (ปร.4 / ปร.5)',[['','–'],...tds])}
    ${sel('pj',Q&&Q.pj&&!t.pj?'โครงการ (จากใบเสนอราคา)':'โครงการ',[['',Q&&Q.pj&&DB.projects[Q.pj]?`ตามใบเสนอราคา: ${DB.projects[Q.pj].name||''}`:'–'],...pjs])}
    ${ma?sel('svc','สัญญาบำรุงรักษา',[['',Q&&Q.svc&&sv?`ตามใบเสนอราคา: ${sv.no||''}`:'–'],...svs]):''}</div>
  ${go?`<div class="row" style="margin:6px 0 4px;gap:6px;flex-wrap:wrap">${go}</div>`:''}
  <h3 style="margin:16px 0 6px">ผู้รับผิดชอบและวันสำคัญ</h3>
  <div class="form">${sel('dept','ฝ่ายที่รับผิดชอบ',[['','–'],...DEPTS()])}${sel('by','ผู้รับผิดชอบ',[['','–'],...stf])}
    ${f('recv','วันที่รับ TOR',{type:'date'})}${ma?'':f('visit','วันชี้แจง / ดูสถานที่',{type:'date'})}${f('due',ma?'วันส่งราคา':'วันยื่นซอง',{type:'date'})}
    ${ma?f('months','ระยะสัญญา (เดือน)',{num:1})+f('visits','เข้า PM (ครั้ง/ปี)',{num:1})+f('sla','เข้าซ่อมภายใน (ชั่วโมง)',{num:1}):''}
    <label class="w2">หมายเหตุ<input data-p="${b}.note" value="${esc(t.note||'')}"></label></div></section>`;
  // files
  const F=t.files||[];
  const files=`<section class="card"><h2><span>ไฟล์ TOR</span><small>เก็บไฟล์ของลูกค้าไว้ตามเดิม (PDF, Word, Excel, รูป) ไม่เกินไฟล์ละ 20 MB · เครื่องอื่นของบริษัทเปิดได้เมื่อเชื่อมคลาวด์หรือโฟลเดอร์</small><span class="sp"></span>
    <button type="button" class="btn sm pri" data-a="torFile" data-id="${t.id}">+ แนบไฟล์ TOR</button></h2>
    ${F.length?`<div class="tw"><table><thead><tr><th>ไฟล์</th><th>ประเภท</th><th>ชนิด</th><th class="r">ขนาด</th><th>แนบเมื่อ</th><th></th></tr></thead><tbody>${F.map(x=>`<tr><td><button type="button" class="btn ghost sm" data-a="torFileOpen" data-id="${t.id}" data-f="${x.id}"><b>${esc(x.name||'ไฟล์')}</b></button></td>
      <td><select data-p="${b}.files.${x.id}.ft" aria-label="ประเภทไฟล์">${torOpts(TORFT,x.ft||'tor')}</select></td>
      <td>${esc((String(x.name||'').match(/\.([a-z0-9]+)$/i)||[,''])[1].toUpperCase())}</td><td class="r">${x.size?fmt(x.size/1048576,x.size<1048576?2:1)+' MB':''}</td><td>${thD(x.at)}</td>
      <td style="white-space:nowrap">${torReadable(x)?`<button type="button" class="btn sm pri" data-a="torPull" data-id="${t.id}" data-f="${x.id}" title="อ่านข้อ 1.1, 1.2, … จากไฟล์ แล้วใส่ในตารางข้อกำหนด">ดึงข้อจากไฟล์</button>`:''}<button type="button" class="btn sm" data-a="torFileOpen" data-id="${t.id}" data-f="${x.id}">เปิด</button><button type="button" class="btn sm" data-a="torFileOpen" data-id="${t.id}" data-f="${x.id}" data-dl="1">ดาวน์โหลด</button><button type="button" class="x" data-a="torFileDel" data-id="${t.id}" data-f="${x.id}" title="ลบไฟล์" aria-label="ลบไฟล์ ${esc(x.name||'')}">✕</button></td></tr>`).join('')}</tbody></table></div>`
    :'<p class="hint" style="margin:0">ยังไม่มีไฟล์ กด “+ แนบไฟล์ TOR” เลือกได้หลายไฟล์พร้อมกัน</p>'}</section>`;
  // requirements
  const cats=TORCAT[torKind(t)],c=torCnt(t),R=t.req||[];
  const cols=[{k:'ref',h:'ข้อใน TOR',w:60},{k:'cat',h:'หมวด',t:'sel',o:[['','–'],...cats.map(x=>[x[0],x[1]])],w:130},{k:'t',h:'ข้อกำหนด',t:'area',w:300},
    {k:'ok',h:'เราทำได้ไหม',t:'sel',o:TOROK,w:120},{k:'ans',h:'วิธีทำ / ที่ต้องถาม / ราคาที่เพิ่ม',t:'area',w:240}];
  TABLES['tor'+t.id]={rows:()=>t.req||[],cols};
  const req=`<section class="card"><h2><span>ข้อกำหนดสำคัญ</span><small>${c.all?`ตอบแล้ว ${c.all-c.none}/${c.all} · ทำได้ ${c.y} · ต้องถาม ${c.q} · ทำไม่ได้ ${c.n}`:'จดข้อที่มีผลกับราคาและการทำงาน แล้วตอบว่าเราทำได้ไหม'}</small><span class="sp"></span>
    ${R.length?'':`<button type="button" class="btn sm" data-a="torStart" data-id="${t.id}">ใส่หัวข้อที่ต้องอ่าน (${cats.length-1} หมวด)</button>`}
    <button type="button" class="btn sm pri" data-a="add" data-c="${b}.req">+ เพิ่มข้อกำหนด</button>${R.length?copyBtn('tor'+t.id):''}</h2>
    ${gtable(`${b}.req`,R,cols,{rowCls:r=>r.ok==='n'?'bad':r.ok==='q'?'warn':'',empty:`ยังไม่มีข้อกำหนด กด “ใส่หัวข้อที่ต้องอ่าน” หรือแนบไฟล์ TOR แล้วกด “ดึงข้อจากไฟล์”`})
      .replace(/<textarea data-p="([^"]+\.(t|ans))" rows="1"/g,(m,p,k)=>{const r=R.find(x=>p.endsWith(`.${x.id}.${k}`)),L=String(r&&r[k]||'').length;return `<textarea data-p="${p}" style="height:auto" rows="${Math.min(5,Math.max(1,Math.ceil(L/48)))}"`})}</section>`;
  return head+files+req}
NEW.req=()=>({ref:'',cat:'',t:'',ok:'',ans:''});
ACT.torStart=b=>{const t=torCfg().find(x=>x.id===b.dataset.id);if(!t)return;t.req=t.req||[];
  TORCAT[torKind(t)].filter(x=>x[0]!=='oth').forEach(([k,,q])=>t.req.push({id:uid(),ref:'',cat:k,t:q,ok:'',ans:''}));save();render();toast('ใส่หัวข้อแล้ว แก้ข้อความให้ตรงกับ TOR แล้วเลือก “เราทำได้ไหม”')};
ACT.torKind=b=>{const t=torCfg().find(x=>x.id===b.dataset.id);if(!t)return;t.kind=torKind(t)==='ma'?'pj':'ma';if(t.kind==='pj')t.svc='';else t.td='';
  const Q=torQ(t);if(Q&&(Q.kind==='ma')!==(t.kind==='ma'))t.q='';S.sub.tor=t.kind;save();render()};
ACT.torDel=b=>{const L=torCfg(),i=L.findIndex(x=>x.id===b.dataset.id);if(i<0)return;const t=L[i];if(!confirm(`ลบ ${t.no} ${t.title||''} และไฟล์ TOR ${(t.files||[]).length} ไฟล์?`))return;
  (t.files||[]).forEach(f=>f.k&&IDB.del(f.k).catch(()=>{}));L.splice(i,1);S.sel.tor='';save();render()};
ACT.torGoQ=b=>{const Q=torQ(torCfg().find(x=>x.id===b.dataset.id));if(!Q)return;S.sel.quote=Q.id;ACT.go({dataset:{m:'co',k:'sales',s:'quote'}})};
ACT.torOpen=b=>{const t=torCfg().find(x=>x.id===b.dataset.id);if(!t)return;S.sel.tor=t.id;ACT.go({dataset:{m:'co',k:'tor',s:torKind(t)}});setTimeout(()=>{const e=$('#torOne');if(e)e.scrollIntoView({block:'start'})},60)};
// new TOR straight from a project, a quotation or a service contract: picked onto it already
ACT.torNew=b=>{const L=torCfg(),C=CO(),d=b.dataset,kind=d.kind==='ma'?'ma':'pj';S.sub.tor=kind;const t=Object.assign({id:uid()},NEW.tors(L),{kind});
  if(d.q){const Q=C.quotes.find(q=>q.id===d.q);if(Q){t.q=Q.id;t.cust=Q.cust||'';t.title=Q.title||'';t.site=Q.site||''}}
  if(d.pj&&DB.projects[d.pj]){const p=DB.projects[d.pj];t.pj=p.id;t.title=t.title||p.name||'';t.cust=t.cust||(p.info&&p.info.cust)||'';t.site=t.site||(p.info&&p.info.site)||''}
  if(d.svc){const s=(C.svc||[]).find(x=>x.id===d.svc);if(s){t.svc=s.id;t.cust=t.cust||s.cust||'';t.title=t.title||s.title||''}}
  if(t.pj||t.svc)t.status='won';L.push(t);save();ACT.torOpen({dataset:{id:t.id}})};
ACT.torFile=b=>{const t=torCfg().find(x=>x.id===b.dataset.id);if(!t)return;const fi=$('#fileIn');fi.accept='.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.dwg,.dxf,image/*,application/pdf';fi.multiple=true;
  fi.onchange=async()=>{const fs=[...fi.files];fi.value='';fi.multiple=false;fi.accept='';if(!fs.length)return;let k0=0;
    for(const file of fs){if(file.size>20e6){toast(`${file.name} ใหญ่เกิน 20 MB ข้ามไฟล์นี้ (ลองบีบอัด PDF ก่อน)`);continue}
      try{const v=await new Promise((ok,no)=>{const fr=new FileReader();fr.onload=()=>ok(fr.result);fr.onerror=no;fr.readAsDataURL(file)}),k='tor-'+uid();
        await IDB.put(k,v);phCache[k]=v;(t.files=t.files||[]).push({id:uid(),k,name:file.name,size:file.size,type:file.type||'',at:today(),ft:/สัญญา|contract|ใบสั่งจ้าง|PO/i.test(file.name)?'con':/ใบเสนอราคา|quotation|QT/i.test(file.name)?'qt':'tor'});k0++}
      catch(e){console.warn('torFile',file.name,e);toast(`แนบ ${file.name} ไม่ได้`)}}
    if(k0){save();render();toast(`แนบไฟล์ TOR ${k0} ไฟล์แล้ว`)}};fi.click()};
ACT.torFileOpen=async b=>{const t=torCfg().find(x=>x.id===b.dataset.id),x=t&&(t.files||[]).find(f=>f.id===b.dataset.f);if(!x)return;
  const v=await phSrc(x.k);if(!v){toast('ไม่พบไฟล์ในเครื่องนี้ ให้เครื่องที่แนบไฟล์เชื่อมคลาวด์หรือโฟลเดอร์ก่อน');return}
  let blob;try{blob=await (await fetch(v)).blob()}catch(e){toast('เปิดไฟล์ไม่ได้');return}
  const view=!b.dataset.dl&&/^(application\/pdf|image\/|text\/plain)/.test(blob.type||x.type||'');
  if(view){const u=URL.createObjectURL(blob),w=window.open(u,'_blank');setTimeout(()=>URL.revokeObjectURL(u),60000);if(w)return}
  download(x.name||'TOR',blob,blob.type||x.type||'application/octet-stream')};
ACT.torFileDel=b=>{const t=torCfg().find(x=>x.id===b.dataset.id);if(!t)return;const i=(t.files||[]).findIndex(f=>f.id===b.dataset.f);if(i<0)return;
  if(!confirm(`ลบไฟล์ ${t.files[i].name||''}?`))return;const k=t.files[i].k;t.files.splice(i,1);if(k)IDB.del(k).catch(()=>{});save();render()};

/* ดึงข้อจากไฟล์: the numbered clauses (1., 1.1, 4.12 …) of a PDF with text or a Word .docx become requirement rows,
   with their number in ข้อใน TOR and a heading guessed from their words (TORKW). A scanned PDF has no text: say so. */
const torThaiNum=s=>String(s).replace(/[๐-๙]/g,d=>'๐๑๒๓๔๕๖๗๘๙'.indexOf(d));
// justified Thai in PDFs comes out letter by letter ("บ ารุ ง รั ก ษา"): join a line whose Thai runs are mostly single letters
const torUnspace=l=>{const w=l.trim().split(/ +/),th=w.filter(x=>/^[\u0E00-\u0E7F]{1,2}$/.test(x)).length;
  return w.length>5&&th/w.length>.45?l.replace(/([\u0E00-\u0E7F]) (?=[\u0E00-\u0E7F])/g,'$1'):l};
async function torPdfLines(blob){await libLoad('pdf.min.js');pdfjsLib.GlobalWorkerOptions.workerSrc='files/lib/pdf.worker.min.js';
  const pdf=await pdfjsLib.getDocument({data:new Uint8Array(await blob.arrayBuffer())}).promise,out=[];
  for(let i=1;i<=pdf.numPages;i++){const tc=await (await pdf.getPage(i)).getTextContent(),rows=[];
    tc.items.forEach(it=>{if(!it.str)return;const y=it.transform[5],x=it.transform[4];let r=rows.find(r=>Math.abs(r.y-y)<3);if(!r)rows.push(r={y,c:[]});r.c.push({x,s:it.str,w:it.width||0})});
    rows.sort((a,b)=>b.y-a.y).forEach(r=>{r.c.sort((a,b)=>a.x-b.x);let s='',end=null;r.c.forEach(c=>{if(end!=null&&c.x-end>2.5&&!/ $/.test(s))s+=' ';s+=c.s;end=c.x+c.w});out.push(s)})}
  return out}
// a .docx is a zip: read word/document.xml with the browser's own inflate, one line per paragraph
async function torDocxLines(blob){const b=new Uint8Array(await blob.arrayBuffer()),dv=new DataView(b.buffer);let e=b.length-22;while(e>0&&dv.getUint32(e,true)!==0x06054b50)e--;if(e<=0)throw new Error('not a zip');
  let p=dv.getUint32(e+16,true);const n=dv.getUint16(e+10,true);
  for(let i=0;i<n;i++){const m=dv.getUint16(p+10,true),cs=dv.getUint32(p+20,true),fl=dv.getUint16(p+28,true),xl=dv.getUint16(p+30,true),cl=dv.getUint16(p+32,true),off=dv.getUint32(p+42,true),
      nm=new TextDecoder().decode(b.subarray(p+46,p+46+fl));p+=46+fl+xl+cl;if(nm!=='word/document.xml')continue;
    const d0=off+30+dv.getUint16(off+26,true)+dv.getUint16(off+28,true),raw=b.subarray(d0,d0+cs);
    const xml=m===0?new TextDecoder().decode(raw):await new Response(new Blob([raw]).stream().pipeThrough(new DecompressionStream('deflate-raw'))).text();
    const dec=s=>s.replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&apos;/g,"'").replace(/&amp;/g,'&');
    return (xml.match(/<w:p[ >][\s\S]*?<\/w:p>/g)||[]).map(pp=>dec((pp.match(/<w:t[^>]*>[^<]*<\/w:t>|<w:tab\/>/g)||[]).map(x=>x==='<w:tab/>'?' ':x.replace(/<[^>]+>/g,'')).join('')))}
  throw new Error('no document.xml')}
function torClauses(lines){const L=[];let cur=null;
  lines.map(l=>torUnspace(torThaiNum(l)).replace(/\s+/g,' ').trim()).forEach(l=>{if(!l||/^หน้า\s*\d+\s*(จาก|\/)\s*\d+$/.test(l)||/^[-_=.\s()\d]{0,6}$/.test(l)&&!/^\d+\.?$/.test(l))return;
    // "4.1 …", "1. …", "2) …" start a clause; a bare "24 เดือน" is the end of the line above
    const m=l.match(/^(\d{1,2}(?:\.\d{1,2}){1,3}\.?|\d{1,2}[.)])\s*(?=[^\d.\s])(.*)$/);
    if(m&&m[2].trim().length>1){cur={ref:m[1].replace(/[.)]$/,''),t:m[2].trim(),k:0};L.push(cur);return}
    if(cur&&cur.t.length<600)cur.t+=(!cur.k++&&cur.t.length<45&&!/[,:]$/.test(cur.t)?': ':/[\u0E00-\u0E7F]$/.test(cur.t)&&/^[\u0E00-\u0E7F]/.test(l)?'':' ')+l});
  return L}
ACT.torPull=async b=>{const t=torCfg().find(x=>x.id===b.dataset.id),x=t&&(t.files||[]).find(f=>f.id===b.dataset.f);if(!x)return;
  const v=await phSrc(x.k);if(!v){toast('ไม่พบไฟล์ในเครื่องนี้');return}toast('กำลังอ่านไฟล์ '+(x.name||''));
  let lines=[];try{const blob=await (await fetch(v)).blob();lines=/\.docx$/i.test(x.name||'')||/wordprocessingml/.test(x.type||'')?await torDocxLines(blob):await torPdfLines(blob)}
  catch(e){console.warn('torPull',e);toast('อ่านไฟล์นี้ไม่ได้');return}
  const C=torClauses(lines).filter(c=>c.t.replace(/[:\s]/g,'').length>1);if(!C.length){alert(lines.join('').trim().length<40?'ไฟล์นี้เป็นภาพสแกน ไม่มีตัวหนังสือให้อ่าน\n\nพิมพ์ข้อที่สำคัญเองในตารางข้อกำหนด หรือขอไฟล์ PDF/Word ต้นฉบับจากลูกค้า':'ไม่พบข้อที่มีเลขข้อ (เช่น 1.1, 4.2) ในไฟล์นี้');return}
  const kind=torKind(t),have=new Set((t.req||[]).map(r=>r.ref+'|'+String(r.t||'').slice(0,30))),catOf={};
  // headings stay as rows, so the table reads in the TOR's own order; their words decide the heading of sub-clauses that have none of their own
  const rows=C;
  C.forEach(c=>catOf[c.ref]=catOf[c.ref]||torCatOf(kind,c.t));
  const par=ref=>{const s=ref.split('.');while(s.length>1){s.pop();const k=catOf[s.join('.')];if(k)return k}return ''};
  t.req=(t.req||[]).filter(r=>String(r.t||'').trim()||r.ok||r.ans||r.ref);
  // starter rows nobody filled in yet are dropped: the file's own clauses replace them
  const starters=new Set(TORCAT[kind].map(c=>c[2]));t.req=t.req.filter(r=>!(starters.has(r.t)&&!r.ok&&!r.ans&&!r.ref));
  let k=0;rows.forEach(c=>{const key=c.ref+'|'+c.t.slice(0,30);if(have.has(key))return;have.add(key);t.req.push({id:uid(),ref:c.ref,cat:torCatOf(kind,c.t)||par(c.ref)||'oth',t:c.t.slice(0,600),ok:'',ans:'',src:x.id});k++});
  save();render();toast(k?`ใส่ข้อกำหนด ${k} ข้อจาก ${x.name||'ไฟล์'} แล้ว ตรวจหมวดแล้วเลือก “เราทำได้ไหม” ทีละข้อ`:'ข้อในไฟล์นี้อยู่ในตารางครบแล้ว')};

/* the TOR on the work it belongs to: the project's เอกสาร page, the quotation, the service contracts */
const torBox=(L,title,newBtn)=>`<section class="card"><h2><span>${title}</span><small>${L.length?'กดเลขที่เพื่อเปิด TOR ไฟล์ และข้อกำหนด':'ยังไม่มี TOR ผูกกับงานนี้'}</small><span class="sp"></span>${newBtn}</h2>
  ${L.length?`<div class="tw"><table><thead><tr><th>เลขที่</th><th>ชื่องาน</th><th>ผู้รับผิดชอบ</th><th class="r">ไฟล์</th><th>ข้อที่ต้องระวัง</th></tr></thead><tbody>${L.map(t=>{const c=torCnt(t),W=(t.req||[]).filter(r=>r.ok==='n'||r.ok==='q');
    return `<tr><td><button type="button" class="btn ghost sm" data-a="torOpen" data-id="${t.id}"><b>${esc(t.no)}</b></button></td><td>${esc(t.title||'')}<br><small class="muted">${torKind(t)==='ma'?'งานบำรุงรักษา':'งานโครงการ'}</small></td><td>${esc(torWho(t))}</td><td class="r">${(t.files||[]).length||''}</td>
      <td>${W.length?W.slice(0,4).map(r=>`<div><span class="pill ${r.ok==='n'?'bad':'warn'}">${r.ok==='n'?'ทำไม่ได้':'ต้องถาม'}</span> ${esc(String(r.t||'').slice(0,90))}</div>`).join('')+(W.length>4?`<small class="muted">อีก ${W.length-4} ข้อ</small>`:''):c.all?'<span class="muted">ทำได้ทุกข้อ</span>':'<span class="muted">ยังไม่ได้จดข้อกำหนด</span>'}</td></tr>`}).join('')}</tbody></table></div>`:''}</section>`;
{const f=VIEWS.docs;VIEWS.docs=()=>{const h=f();if(!P||!allowed('co','tor'))return h;const L=torCfg().filter(t=>torPj(t)===P.id);
  return h+torBox(L,'TOR ของโครงการนี้',`<button type="button" class="btn sm" data-a="torNew" data-kind="pj" data-pj="${P.id}">+ เพิ่ม TOR ของโครงการนี้</button>`)}}
{const f=svcCon;svcCon=function(){const h=f();if(!allowed('co','tor'))return h;const C=CO(),L=torCfg().filter(t=>torSvc(t));
  if(!L.length&&!torCfg().some(t=>torKind(t)==='ma'))return h;
  return h+torBox(L,'TOR ของสัญญาบำรุงรักษา',`<button type="button" class="btn sm" data-a="go" data-m="co" data-k="tor" data-s="ma">ไปหน้า TOR งานบำรุงรักษา</button>`)}}
{const f=CVIEWS.sales;CVIEWS.sales=()=>{const h=f();if(S.sub.sales!=='quote'||!allowed('co','tor'))return h;const C=CO(),Q=C.quotes.find(q=>q.id===S.sel.quote);if(!Q)return h;
  const L=torCfg().filter(t=>t.q===Q.id),ma=Q.kind==='ma';
  const bar=`<div class="card torq" style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;padding:8px 12px"><b>TOR ของ ${esc(Q.no||'ใบนี้')}</b>
    ${L.length?L.map(t=>`<button type="button" class="btn sm" data-a="torOpen" data-id="${t.id}">${esc(t.no)} ${esc(String(t.title||'').slice(0,40))}${(t.files||[]).length?` · ${t.files.length} ไฟล์`:''}</button>`).join(''):'<span class="hint">ยังไม่ได้ผูก TOR</span>'}
    <span class="sp" style="flex:1"></span><button type="button" class="btn sm" data-a="torNew" data-kind="${ma?'ma':'pj'}" data-q="${Q.id}">+ TOR ของใบนี้</button></div>`;
  const i=h.indexOf('</div>');return i<0?h+bar:h.slice(0,i+6)+bar+h.slice(i+6)}}
// a deadline coming up goes into ต้องดูวันนี้
{const f=alerts;alerts=function(){const A=f();torCfg().forEach(t=>{if(!torOpenSt(t))return;const d=torDays(t.due);if(d==null||d>7)return;
  A.push({lv:d<=1?'bad':'warn',kind:torKind(t)==='ma'?'TOR บำรุงรักษา ใกล้วันส่งราคา':'TOR ใกล้วันยื่นซอง',p:null,txt:`${t.no} ${t.title||''}`,due:t.due,go:{m:'co',k:'tor',s:torKind(t)}})});
  return A.filter(a=>allowed(a.go.m,a.go.k)).sort((a,b)=>(a.lv==='bad'?0:1)-(b.lv==='bad'?0:1)||String(a.due).localeCompare(String(b.due)))}}
// cloud backup: TOR files go in their own folder, named as attached
{const f=cbPhotoPlaces;cbPhotoPlaces=function(J){const M=f(J);((J.co&&J.co.tors)||[]).forEach(t=>(t.files||[]).forEach(x=>{if(x&&x.k&&!M.has(x.k))M.set(x.k,{pj:'TOR',d:'',w:`${t.no||''} ${String(x.name||'').replace(/\.[a-z0-9]+$/i,'')}`.trim()})}));return M}}
if(typeof SBKW==='object'){SBKW['co.tor.pj']=(SBKW['co.tor.pj']||'')+' TOR ทีโออาร์ ขอบเขตงาน term of reference ข้อกำหนด สเปก ยื่นซอง ประกวดราคา เงื่อนไขลูกค้า แนบไฟล์ TOR';
  SBKW['co.tor.ma']=(SBKW['co.tor.ma']||'')+' TOR บำรุงรักษา สัญญา PM MA SLA ขอบเขตงานบริการ เข้าซ่อม อะไหล่'}
