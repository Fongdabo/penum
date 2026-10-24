/* ================= company level ================= */
const CO=()=>DB.co;
function withP(p,f){const k=P;P=p;try{return f()}finally{P=k}}
const projects=()=>Object.values(DB.projects).sort((a,b)=>(a.info.start||'').localeCompare(b.info.start||''));
const custName=id=>(CO().customers.find(c=>c.id===id)||{}).name||'';
const ym=d=>String(d).slice(0,7);
const thM=k=>pd(k+'-01').toLocaleDateString('th-TH',{month:'short',year:'2-digit'});
function cphead(title,sub){const c=CO();return `<div class="co"><div><b>${esc(c.name||'')}</b><br>${esc(c.addr||'')}${c.tax?'<br>เลขประจำตัวผู้เสียภาษี '+esc(c.tax):''}${c.phone?' · โทร '+esc(c.phone):''}</div><div style="text-align:right">${sub||''}<br>พิมพ์ ${thDL(today())}</div></div><h1>${title}</h1>`}

/* ---------- company settings ---------- */
CVIEWS.coset=()=>{const c=CO(),f=(k,l,cls='')=>`<label class="${cls}">${l}<input data-p="co.${k}" value="${esc(c[k]||'')}"></label>`;
  return `<section class="card"><h2>ข้อมูลบริษัท (หัวเอกสาร ใบเสนอราคา ใบแจ้งหนี้)</h2><div class="form">${f('name','ชื่อบริษัท','w2')}${f('nameEn','ชื่อภาษาอังกฤษ','w2')}${f('tax','เลขประจำตัวผู้เสียภาษี')}${f('branch','สาขา (เช่น สำนักงานใหญ่)')}${f('phone','โทรศัพท์')}${f('email','อีเมล')}${f('addr','ที่อยู่','full')}
  <label class="full">เงื่อนไขมาตรฐานในใบเสนอราคา<textarea data-p="co.terms" rows="3">${esc(c.terms||'')}</textarea></label></div></section>
  <section class="card"><h2>ข้อมูลทั้งหมดในเครื่องนี้</h2><p class="hint">${Object.keys(DB.projects).length} โครงการ · ลูกค้า ${c.customers.length} · ใบเสนอราคา ${c.quotes.length} · พนักงาน ${c.staff.length} ${typeof cloudOn==="function"&&cloudOn()?"ซิงค์กับข้อมูลกลางบน OneDrive และสำรองอัตโนมัติวันละครั้ง":"ข้อมูลเก็บในเบราว์เซอร์ของเครื่องนี้ กด “สำรองข้อมูล” เป็นระยะ หรือเชื่อมโฟลเดอร์ PENUM-PM ด้านล่าง (OneDrive, Google Drive, Dropbox หรือโฟลเดอร์ในบริษัท)"}</p></section>`};

/* ---------- sales: customers, leads/tenders, quotations ---------- */
const LST=[['lead','ได้รับข้อมูล'],['survey','สำรวจหน้างาน'],['quote','ทำราคา'],['sent','ส่งราคาแล้ว'],['nego','ต่อรอง'],['won','ได้งาน'],['lost','ไม่ได้งาน']];
const LPROB={lead:10,survey:20,quote:30,sent:40,nego:60,won:100,lost:0};
NEW.customers=()=>({name:'',contact:'',phone:'',email:'',tax:'',addr:'',credit:30});
NEW.leads=()=>({name:'',cust:'',value:0,stage:'lead',prob:'',close:addD(today(),30),owner:'',note:''});
const QST=[['draft','ร่าง'],['sent','ส่งลูกค้าแล้ว'],['won','ได้งาน'],['lost','ไม่ได้งาน']];
NEW.quotes=arr=>({no:nextNo('QT-',arr),date:today(),cust:'',title:'',site:'',valid:30,items:[],mk:0,disc:0,status:'draft',pj:'',note:'',terms:CO().terms||'',by:''});
const qUnit=(Q,i)=>i.sp!==''&&i.sp!=null&&n(i.sp)>0?n(i.sp):n(i.t)/Math.max(1e-9,n(i.q))*(1+n(Q.mk)/100);
// rows added under the total (SAFETY & CLEANING, OVERHEAD & PROFIT…): each a % of the printed total or a fixed amount
const qAddV=(a,base)=>n(a.pct)?base*n(a.pct)/100:n(a.amt);
function qCalc(Q){const lines=sum(Q.items,i=>n(i.q)*qUnit(Q,i)),base=qSep(Q)?sum(Q.items,i=>qLine(Q,i).t):lines,adds=(Q.adds||[]).map(a=>Object.assign({},a,{v:qAddV(a,base)})),
  sub=lines+sum(adds,a=>a.v),disc=n(Q.disc),net=sub-disc,vat=net*7/100;return {sub,disc,net,vat,grand:net+vat,cost:sum(Q.items,boqCost),lines,base,adds}}
function qFill(Q,items,meta){Q.items=items.map(i=>({id:uid(),g:i.g,head:i.head||'',type:i.type||'',desc:i.desc,unit:i.unit,q:n(i.q),m:n(i.m),l:n(i.l),t:n(i.t),sp:''}));Q.src=meta.src||'';if(meta.sub&&meta.ohp&&!n(Q.mk))Q.mk=Math.round(n(meta.ohp)*1000/n(meta.sub))/10}
ACT.qMep=b=>{const Q=CO().quotes.find(q=>q.id===b.dataset.id),L=mepLink();if(!Q||!L)return;if(Q.items.length&&!confirm('แทนที่รายการเดิม?'))return;
  qFill(Q,L.boq.items.map(i=>({g:i.g,head:i.head,type:i.type,desc:i.desc,unit:i.unit,q:i.q,m:i.m,l:i.l,t:i.total})),{src:'PENUM MEP · '+(L.project||''),sub:L.boq.sub,ohp:L.boq.ohp});if(!Q.title)Q.title=L.project||'';save();render()};
ACT.qPaste=b=>{dialog('วาง BOQ จาก PENUM MEP',`<ol class="steps"><li>เปิด PENUM MEP ไปที่หน้า BOQ</li><li>กดปุ่ม <b>คัดลอก BOQ (วางใน Excel)</b></li><li>คลิกในช่องด้านล่าง แล้วกด Ctrl+V</li></ol><textarea id="boqTxt" rows="8"></textarea>`,`<button type="button" class="btn pri" data-a="qPasteGo" data-id="${b.dataset.id}">นำเข้า</button>`)};
// a tender title ("ประกวดราคาจ้างก่อสร้าง…") makes a poor project name: keep what is being built
const pjName=t=>String(t||'').trim().replace(/^โครงการ\s*/,'').replace(/^(ประกวดราคา|สอบราคา|ประกาศ)\s*(จ้าง)?\s*(ก่อสร้าง)?\s*/,'').replace(/^(จ้าง)?ก่อสร้าง\s*/,'').replace(/^โครงการ\s*/,'').trim()||String(t||'').trim();
ACT.qPasteGo=b=>{const Q=CO().quotes.find(q=>q.id===b.dataset.id),r=parseBoqTSV($('#boqTxt').value);if(!Q||!r.items.length){toast('ไม่พบรายการ BOQ');return}qFill(Q,r.items,{src:'วางจาก PENUM MEP',sub:r.sub,ohp:r.ohp});$('#dlg').close();save();render()};
ACT.qWon=b=>{const Q=CO().quotes.find(q=>q.id===b.dataset.id);if(!Q)return;if(Q.pj&&DB.projects[Q.pj]){ACT.go({dataset:{m:'pj',k:'dash',p:Q.pj}});return}
  if(!Q.items.length){toast('ใบเสนอราคายังไม่มีรายการ');return}const nm=pjName(Q.pname)||pjName(Q.title)||Q.no;if(!confirm(`บันทึกว่าได้งาน และสร้างโครงการ “${nm}” จากใบเสนอราคานี้?`))return;
  const C=qCalc(Q),p=blankProject(nm),c=CO().customers.find(x=>x.id===Q.cust)||{};
  Object.assign(p.info,{client:c.name||'',cust:Q.cust||'',site:Q.site||'',cv:Math.round(C.net*100)/100,cvAuto:0});
  const k=C.lines?C.net/C.lines:1;
  withP(p,()=>setBoq(Q.items.map(i=>({g:i.g,head:i.head,type:i.type,desc:i.desc,unit:i.unit,q:n(i.q),m:n(i.m),l:n(i.l),t:n(i.q)*qUnit(Q,i)*k})),{src:'ใบเสนอราคา '+Q.no,sub:C.net,ohp:0,vat:C.vat,grand:C.grand}));
  p.info.cvAuto=0;p.info.cv=Math.round(C.net*100)/100;
  DB.projects[p.id]=p;Q.pj=p.id;Q.status='won';CO().leads.filter(l=>l.quote===Q.id).forEach(l=>l.stage='won');
  DB.cur=p.id;P=p;S.mode='pj';S.tab='dash';S.sel={};save();render();toast('สร้างโครงการแล้ว ต่อไปกด “สร้างแผนตั้งต้นจาก BOQ” ในแท็บแผนงาน')};
CVIEWS.sales=()=>{const {cur,html}=subTabs('sales',[['quote','ใบเสนอราคา'],['lead','งานที่กำลังติดตาม'],['cust','ลูกค้า']]);return html+({quote:salesQuote,lead:salesLead,cust:salesCust}[cur])()};
function salesCust(){const C=CO(),cols=[{k:'name',h:'ชื่อลูกค้า',w:200},{k:'nameEn',h:'ชื่อลูกค้า (อังกฤษ)',w:180},{k:'contact',h:'ผู้ติดต่อ',w:120},{k:'phone',h:'โทร',w:110},{k:'email',h:'อีเมล',w:150},{k:'tax',h:'เลขผู้เสียภาษี',w:130},{k:'addr',h:'ที่อยู่',t:'area',w:220},{k:'addrEn',h:'ที่อยู่ (อังกฤษ)',t:'area',w:200},{k:'credit',h:'เครดิต (วัน)',t:'num',w:70},
  {h:'โครงการ',t:'calc',r:1,f:c=>Object.values(DB.projects).filter(p=>p.info.cust===c.id).length||''}];TABLES.cust={rows:()=>C.customers,cols};
  return `<section class="card"><h2><span>ทะเบียนลูกค้า</span><span class="sp"></span>${copyBtn('cust')}</h2>${gtable('co.customers',C.customers,cols)}<div class="row" style="margin-top:8px"><button type="button" class="btn sm pri" data-a="add" data-c="co.customers">+ เพิ่มลูกค้า</button></div></section>`}
function salesLead(){const C=CO(),prob=l=>l.prob===''||l.prob==null?LPROB[l.stage]:n(l.prob);
  const cols=[{k:'name',h:'ชื่องาน',w:200},{k:'cust',h:'ลูกค้า',t:'sel',w:160,o:()=>[['','–'],...C.customers.map(c=>[c.id,c.name])]},{k:'value',h:'มูลค่าประมาณ',t:'num',w:110,sum:l=>l.stage==='lost'?0:l.value},{k:'stage',h:'ขั้นตอน',t:'sel',o:LST},{k:'prob',h:'โอกาส %',t:'num',w:60},{h:'มูลค่าถ่วงน้ำหนัก',t:'calc',r:1,f:l=>fmt(n(l.value)*prob(l)/100),sum:l=>n(l.value)*prob(l)/100},{k:'close',h:'คาดว่าจะปิด',t:'date'},{k:'owner',h:'ผู้ดูแล',w:100},{k:'quote',h:'ใบเสนอราคา',t:'sel',o:()=>[['','–'],...C.quotes.map(q=>[q.id,q.no])]},{k:'note',h:'หมายเหตุ',w:160}];
  TABLES.lead={rows:()=>C.leads,cols};const open=C.leads.filter(l=>!['won','lost'].includes(l.stage));
  return `<dl class="stats"><div><dt>งานที่กำลังติดตาม</dt><dd>${open.length}</dd></div><div><dt>มูลค่ารวม</dt><dd>${fmt(sum(open,l=>l.value))}</dd></div><div><dt>มูลค่าถ่วงน้ำหนักโอกาส</dt><dd>${fmt(sum(open,l=>n(l.value)*prob(l)/100))}</dd></div><div><dt>อัตราได้งาน</dt><dd>${(()=>{const w=C.leads.filter(l=>l.stage==='won').length,d=w+C.leads.filter(l=>l.stage==='lost').length;return d?fmt(w*100/d,0)+'%':'–'})()}</dd></div></dl>
  <section class="card"><h2><span>งานที่กำลังติดตามและงานประมูล</span><small>โอกาส % เว้นว่าง = ใช้ค่าตามขั้นตอน</small><span class="sp"></span>${copyBtn('lead')}</h2>${gtable('co.leads',C.leads,cols)}<div class="row" style="margin-top:8px"><button type="button" class="btn sm pri" data-a="add" data-c="co.leads">+ เพิ่มงาน</button></div></section>`}
function salesQuote(){
  const C=CO(),L=C.quotes.slice().reverse(),sel=C.quotes.find(q=>q.id===S.sel.quote)||L[0];
  const list=`<section class="card"><h2><span>ใบเสนอราคา</span><span class="sp"></span><button type="button" class="btn sm pri" data-a="add" data-c="co.quotes" data-sel="quote">+ ใบเสนอราคาใหม่</button></h2>
  <div class="tw"><table><thead><tr><th>เลขที่</th><th>วันที่</th><th>ลูกค้า</th><th>งาน</th><th class="r">ราคาไม่รวม VAT</th><th class="r">กำไรขั้นต้น</th><th>สถานะ</th><th>ยืนราคาถึง</th><th></th></tr></thead><tbody>
  ${L.length?L.map(q=>{const c=qCalc(q),st=QST.find(s=>s[0]===q.status)||QST[0],exp=addD(q.date,n(q.valid));return `<tr class="${sel&&sel.id===q.id?'sel':''}"><td><button type="button" class="btn ghost sm" data-a="sel" data-k="quote" data-id="${q.id}"><b>${esc(q.no)}</b></button></td><td>${thD(q.date)}</td><td>${esc(custName(q.cust))}</td><td>${esc(q.title)}</td><td class="r">${fmt(c.net)}</td><td class="r">${c.net?fmt((c.net-c.cost)*100/c.net,1)+'%':''}</td><td><span class="pill ${q.status==='won'?'ok':q.status==='lost'?'bad':q.status==='sent'?'info':''}">${st[1]}</span></td><td>${q.status==='sent'&&exp<today()?'<span class="pill warn">หมดอายุ</span>':thD(exp)}</td><td><button type="button" class="x" data-a="delRow" data-c="co.quotes" data-id="${q.id}" aria-label="ลบ">✕</button></td></tr>`}).join(''):'<tr><td colspan="9" class="empty">ยังไม่มีใบเสนอราคา</td></tr>'}</tbody></table></div></section>`;
  if(!sel)return list;
  const b=`co.quotes.${sel.id}`,c=qCalc(sel),ml=mepLink();let lg='';
  return list+`<section class="card"><h2><span>${esc(sel.no)} ${esc(sel.title)}</span><span class="sp"></span><button type="button" class="btn sm" data-a="print" data-k="quote" data-id="${sel.id}">พิมพ์ใบเสนอราคา</button><button type="button" class="btn sm pri" data-a="qWon" data-id="${sel.id}">${sel.pj&&DB.projects[sel.pj]?'เปิดโครงการ':'ได้งาน → สร้างโครงการ'}</button></h2>
  <div class="form" style="margin-bottom:12px"><label>เลขที่<input data-p="${b}.no" value="${esc(sel.no)}"></label><label>วันที่<input type="date" data-p="${b}.date" value="${esc(sel.date)}"></label>
    <label>ลูกค้า<select data-p="${b}.cust">${[['','–'],...C.customers.map(x=>[x.id,x.name])].map(([k,l])=>`<option value="${k}"${k===sel.cust?' selected':''}>${esc(l)}</option>`).join('')}</select></label>
    <label class="w2">ชื่อโครงการ<input data-p="${b}.pname" list="qPjNames" value="${esc(sel.pname||'')}" placeholder="เช่น อาคารสำนักงาน ABC"><datalist id="qPjNames">${[...new Set([...projects().map(p=>p.name),...(C.leads||[]).map(l=>l.name),...C.quotes.map(q=>q.pname)].filter(Boolean))].map(x=>`<option value="${esc(x)}">`).join('')}</datalist></label><label class="w2">ชื่องาน<input data-p="${b}.title" value="${esc(sel.title)}" placeholder="เช่น ติดตั้งระบบปรับอากาศ VRF"></label><label>สถานที่<input data-p="${b}.site" value="${esc(sel.site||'')}"></label><label>Ref / ครั้งที่แก้ไข<input data-p="${b}.ref" value="${esc(sel.ref||'')}" placeholder="เช่น R3"></label><label>ยืนราคา (วัน)<input data-t="num" data-p="${b}.valid" value="${n(sel.valid)}"></label>
    <label>เรียน<input data-p="${b}.attn" value="${esc(sel.attn||'')}" placeholder="ว่าง = ผู้ติดต่อของลูกค้า"></label><label class="w2">กำหนดแล้วเสร็จ<input data-p="${b}.dlv" value="${esc(sel.dlv||'')}" placeholder="เช่น ภายใน 210 วันหลังทำสัญญา"></label>
    <label>ผู้ลงนาม<input data-p="${b}.signName" value="${esc(sel.signName||'')}" placeholder="เช่น นายอาทิตย์ บับภาสิทธิ์"></label><label>ตำแหน่งผู้ลงนาม<input data-p="${b}.signPos" value="${esc(sel.signPos||'')}" placeholder="เช่น กรรมการผู้จัดการ"></label>
    <label>หน้าแรกที่พิมพ์<select data-p="${b}.cover"><option value=""${sel.cover!=='letter'?' selected':''}>แบบตาราง (QUOTATION)</option><option value="letter"${sel.cover==='letter'?' selected':''}>แบบจดหมาย (เรียน … ขอแสดงความนับถือ)</option></select></label>
    <label>บวกค่าดำเนินการ/กำไร (%)<input data-t="num" data-p="${b}.mk" value="${n(sel.mk)}"></label><label>ส่วนลด (บาท)<input data-t="num" data-p="${b}.disc" value="${n(sel.disc)}"></label>
    <label>แบบฟอร์ม BOQ ที่พิมพ์<select data-p="${b}.lay">${QFORMS.map(([v,c,t])=>`<option value="${v}"${(sel.lay||'')===v?' selected':''}>${c?c+' ':''}${t}</option>`).join('')}</select></label>
    <label class="chk" style="flex-direction:row;align-items:center;gap:6px"><input type="checkbox" data-t="chk" data-p="${b}.mkSep"${sel.mkSep?' checked':''}> แสดงค่าดำเนินการ/กำไรเป็นบรรทัดท้าย (ราคาในรายการเป็นราคาทุน)</label>
    <div style="flex-basis:100%"><b style="font-size:13.5px">รายการบวกท้ายใต้ยอดรวม</b> <small class="muted">เช่น SAFETY &amp; CLEANING, OVERHEAD &amp; PROFIT ใส่เป็น % ของยอดรวม หรือเป็นจำนวนเงิน</small>
      ${(sel.adds||[]).map(a=>`<div class="row" style="gap:6px;margin-top:6px;flex-wrap:wrap"><input data-p="${b}.adds.${a.id}.name" value="${esc(a.name||'')}" placeholder="ชื่อรายการ" aria-label="ชื่อรายการบวกท้าย" style="flex:1;min-width:160px"><input data-t="num" data-p="${b}.adds.${a.id}.pct" value="${n(a.pct)||''}" placeholder="%" aria-label="เปอร์เซ็นต์" style="width:80px"><input data-t="num" data-p="${b}.adds.${a.id}.amt" value="${n(a.amt)||''}" placeholder="หรือจำนวนเงิน" aria-label="จำนวนเงิน" style="width:130px"><span class="muted" style="align-self:center">= ${fmt(qAddV(a,c.base),2)}</span><button type="button" class="x" data-a="qAddDel" data-id="${sel.id}" data-k="${a.id}" aria-label="ลบ">✕</button></div>`).join('')}
      <button type="button" class="btn sm" data-a="qAddRow" data-id="${sel.id}" style="margin-top:6px">+ เพิ่มรายการบวกท้าย</button></div>
    <label>สถานะ<select data-p="${b}.status">${QST.map(([k,l])=>`<option value="${k}"${k===sel.status?' selected':''}>${l}</option>`).join('')}</select></label><label>ผู้เสนอราคา<input data-p="${b}.by" value="${esc(sel.by||'')}"></label>
    <label class="full">เงื่อนไข<textarea data-p="${b}.terms" rows="2">${esc(sel.terms||'')}</textarea></label></div>
  <div class="row" style="margin-bottom:10px">${ml?`<button type="button" class="btn sm" data-a="qMep" data-id="${sel.id}">ดึงรายการจาก PENUM MEP (${esc(ml.project||'')})</button>`:''}<button type="button" class="btn sm" data-a="qPaste" data-id="${sel.id}">วาง BOQ จาก PENUM MEP</button>
    ${sel.src?`<span class="hint" style="margin:0">ที่มา: ${esc(sel.src)}</span>`:''}</div>
  <dl class="stats" style="margin-bottom:12px"><div><dt>ต้นทุน (ของ+แรง)</dt><dd>${fmt(c.cost)}</dd></div><div><dt>ราคาเสนอ ไม่รวม VAT</dt><dd>${fmt(c.net)}</dd></div><div><dt>กำไรขั้นต้น</dt><dd style="color:${c.net-c.cost>=0?'var(--good)':'var(--danger)'}">${fmt(c.net-c.cost)} <small>${c.net?fmt((c.net-c.cost)*100/c.net,1)+'%':''}</small></dd></div><div><dt>รวม VAT 7%</dt><dd>${fmt(c.grand)}</dd></div></dl>
  ${sel.items.length?`<div class="tw" style="max-height:520px;overflow:auto"><table><thead><tr><th>รายการ</th><th>หน่วย</th><th class="r">จำนวน</th><th class="r">ต้นทุน/หน่วย</th><th class="r" style="min-width:110px">ราคาเสนอ/หน่วย</th><th class="r">รวม</th><th></th></tr></thead><tbody>
  ${sel.items.map(i=>{const h=i.g!==lg?`<tr class="grp"><td colspan="7">${gName(i.g)}</td></tr>`:'';lg=i.g;const u=qUnit(sel,i);return h+`<tr><td>${esc(itemName(i))}</td><td>${esc(i.unit)}</td><td style="width:90px"><input class="r" data-t="num" data-p="${b}.items.${i.id}.q" value="${n(i.q)}" aria-label="จำนวน"></td><td class="r muted">${fmt(n(i.m)+n(i.l),2)}</td><td><input class="r" data-t="num" data-p="${b}.items.${i.id}.sp" value="${i.sp||''}" placeholder="${fmt(u,2)}" aria-label="ราคาเสนอ"></td><td class="r">${fmt(n(i.q)*u)}</td><td><button type="button" class="x" data-a="delRow" data-c="${b}.items" data-id="${i.id}" aria-label="ลบ">✕</button></td></tr>`}).join('')}</tbody></table></div>`:'<p class="empty">ยังไม่มีรายการ ดึงจาก PENUM MEP หรือนำเข้าจากไฟล์</p>'}</section>`;
}
// quotation lines as printed: unit prices include the markup, split into material and labour in proportion; with
// "markup on its own line" the lines show cost and the markup is one row in the summary (as many contractors' BOQs do)
const qSep=Q=>!!Q.mkSep&&!Q.items.some(i=>i.sp!==''&&i.sp!=null&&n(i.sp)>0);
// BOQ forms: value stored in Q.lay, code printed on the page
const QFORMS=[['','','อัตโนมัติ (A เมื่อมีค่าแรง ไม่มีใช้ B)'],['split','BOQ-A','แยกค่าวัสดุ / ค่าแรง'],['one','BOQ-B','ราคารวมต่อหน่วย'],['sum','BOQ-S','สรุปตามหมวด (ไม่แสดงราคารายบรรทัด)'],['gov','BOQ-G','แบบราชการ ปร.4 / ปร.5'],['empty','BOQ-E','ใบปริมาณงานเปล่า (ให้ผู้รับเหมาช่วง/ร้านค้ากรอกราคา)']];
const qHasL=Q=>Q.items.some(i=>n(i.l)>0);
const qForm=Q=>({split:'A',one:'B',sum:'S',gov:'G',empty:'E'})[Q.lay]||(qHasL(Q)?'A':'B');
const qSplit=Q=>{const f=qForm(Q);return f==='A'||f==='G'||(f!=='B'&&qHasL(Q))};
function qLine(Q,i){const q=n(i.q),base=n(i.m)+n(i.l),sep=qSep(Q),u=sep?(base||n(i.t)/Math.max(1e-9,q)):qUnit(Q,i),k=base?u/base:1;
  const mu=base?n(i.m)*k:u,lu=base?n(i.l)*k:0;return {q,mu,lu,u,mt:q*mu,lt:q*lu,t:q*u}}
PRINT.quote=id=>{const Q=CO().quotes.find(q=>q.id===id);if(!Q)return '';const c=qCalc(Q),cu=CO().customers.find(x=>x.id===Q.cust)||{},sp=qSplit(Q),sep=qSep(Q),G={},R='style="text-align:right"';
  Q.items.forEach(i=>{const L=qLine(Q,i),g=G[i.g]=G[i.g]||{m:0,l:0,t:0};g.m+=L.mt;g.l+=L.lt;g.t+=L.t});
  const T=Object.values(G).reduce((a,g)=>({m:a.m+g.m,l:a.l+g.l,t:a.t+g.t}),{m:0,l:0,t:0});
  const sumRow=(lab,v,b)=>`<tr><td></td><td>${b?`<b>${lab}</b>`:lab}</td>${sp?'<td></td><td></td>':''}<td ${R}>${b?`<b>${v}</b>`:v}</td></tr>`;
  const cover=`<table><thead><tr><th>#</th><th>หมวดงาน</th>${sp?'<th>ค่าวัสดุ</th><th>ค่าแรง</th>':''}<th>จำนวนเงิน (บาท)</th></tr></thead><tbody>${Object.entries(G).map(([g,v],i)=>`<tr><td>${i+1}</td><td>${gName(g)}</td>${sp?`<td ${R}>${fmt(v.m,2)}</td><td ${R}>${fmt(v.l,2)}</td>`:''}<td ${R}>${fmt(v.t,2)}</td></tr>`).join('')}
  ${(()=>{const mkRow=sep&&Math.abs(c.lines-T.t)>0.005,A=c.adds.filter(a=>a.v||a.name);if(!mkRow&&!A.length)return sumRow('รวม',fmt(c.sub,2));
    return `<tr><td></td><td><b>รวม${sp?'ค่าวัสดุและค่าแรง':''}</b></td>${sp?`<td ${R}>${fmt(T.m,2)}</td><td ${R}>${fmt(T.l,2)}</td>`:''}<td ${R}><b>${fmt(T.t,2)}</b></td></tr>`+
      (mkRow?sumRow(`ค่าดำเนินการและกำไร ${fmt(n(Q.mk),2)}%`,fmt(c.lines-T.t,2)):'')+A.map(a=>sumRow(esc(a.name||'')+(n(a.pct)?` ${fmt(n(a.pct),2)}%`:''),fmt(a.v,2))).join('')+sumRow('รวม',fmt(c.sub,2))})()}${c.disc?sumRow('ส่วนลด','-'+fmt(c.disc,2))+sumRow('รวมหลังหักส่วนลด',fmt(c.net,2)):''}${sumRow('ภาษีมูลค่าเพิ่ม 7%',fmt(c.vat,2))}${sumRow('รวมทั้งสิ้น',fmt(c.grand,2),1)}</tbody></table>`;
  // detail table: G numbers the lines and adds a remarks column (ปร.4); E leaves every price cell blank for the other side to fill
  const f=qForm(Q),G4=f==='G',E0=f==='E',B=v=>E0?'':v,nc=(sp?8:5)+(G4?2:0),body=[];let lg=null,lh=null,gi=0,li=0;
  const cells=(a,b)=>`${G4?`<td>${a}</td>`:''}`,rm=G4?'<td></td>':'';
  Q.items.forEach(i=>{if(i.g!==lg){if(lg!==null)body.push(sub(lg));gi++;li=0;body.push(`<tr>${G4?`<td><b>${gi}</b></td>`:''}<td colspan="${nc-(G4?1:0)}"><b>${gName(i.g)}</b></td></tr>`);lg=i.g;lh=null}
    if((i.head||'')!==lh){lh=i.head||'';if(lh)body.push(`<tr>${G4?'<td></td>':''}<td colspan="${nc-(G4?1:0)}" style="padding-left:14px"><i>${esc(lh)}</i></td></tr>`)}
    const L=qLine(Q,i),d=esc([i.type,i.desc].filter(Boolean).join(' · '));li++;
    body.push(`<tr>${cells(gi+'.'+li)}<td style="padding-left:${lh?24:8}px">${d}</td><td ${R}>${fmtq(i.q)}</td><td>${esc(i.unit)}</td>${sp?`<td ${R}>${B(L.mu?fmt(L.mu,2):'-')}</td><td ${R}>${B(L.mt?fmt(L.mt,2):'-')}</td><td ${R}>${B(L.lu?fmt(L.lu,2):'-')}</td><td ${R}>${B(L.lt?fmt(L.lt,2):'-')}</td>`:`<td ${R}>${B(fmt(L.u,2))}</td>`}<td ${R}>${B(fmt(L.t,2))}</td>${rm}</tr>`)});
  function sub(g){const v=G[g];return `<tr style="background:#f3f5f5">${G4?'<td></td>':''}<td colspan="3" ${R}><b>รวม ${gName(g)}</b></td>${sp?`<td></td><td ${R}><b>${B(fmt(v.m,2))}</b></td><td></td><td ${R}><b>${B(fmt(v.l,2))}</b></td>`:'<td></td>'}<td ${R}><b>${B(fmt(v.t,2))}</b></td>${rm}</tr>`}
  if(lg!==null)body.push(sub(lg));
  const tot=(lab,v)=>`<tr>${G4?'<td></td>':''}<td colspan="3" ${R}><b>${lab}</b></td>${sp?`<td></td><td ${R}><b>${B(fmt(v.m,2))}</b></td><td></td><td ${R}><b>${B(fmt(v.l,2))}</b></td>`:'<td></td>'}<td ${R}><b>${B(fmt(v.t,2))}</b></td>${rm}</tr>`;
  body.push(tot(`รวม${sep||E0?'ค่าวัสดุและค่าแรง':'ทั้งหมด'}`,T));
  if(E0)['ค่าดำเนินการและกำไร','ส่วนลด (ถ้ามี)','ภาษีมูลค่าเพิ่ม 7%','รวมทั้งสิ้น'].forEach(x=>body.push(`<tr><td colspan="3" ${R}>${x}</td>${sp?'<td></td><td></td><td></td><td></td>':'<td></td>'}<td></td></tr>`));
  const no0=G4?'<th rowspan="2">ลำดับ</th>':'',no1=G4?'<th>ลำดับ</th>':'',rh=G4?'<th rowspan="2">หมายเหตุ</th>':'',rh1=G4?'<th>หมายเหตุ</th>':'';
  const head=sp?`<tr>${no0}<th rowspan="2">รายการ</th><th rowspan="2">จำนวน</th><th rowspan="2">หน่วย</th><th colspan="2">ค่าวัสดุ</th><th colspan="2">ค่าแรง${G4?'งาน':''}</th><th rowspan="2">${G4?'รวมค่าวัสดุและค่าแรงงาน':'รวม'}</th>${rh}</tr><tr><th>ราคา/หน่วย</th><th>จำนวนเงิน</th><th>ราคา/หน่วย</th><th>จำนวนเงิน</th></tr>`:`<tr>${no1}<th>รายการ</th><th>จำนวน</th><th>หน่วย</th><th>ราคา/หน่วย</th><th>จำนวนเงิน</th>${rh1}</tr>`;
  const code=`<div style="text-align:right;font-size:10px;color:#667;margin:-2px 0 2px">แบบฟอร์ม BOQ-${f}</div>`;
  const meta=`<div class="meta"><div><b>เรียน</b> ${esc(cu.name||'')}<br>${esc(cu.contact||'')}<br>${esc(cu.addr||'')}</div><div>${Q.pname?`โครงการ: <b>${esc(Q.pname)}</b><br>`:''}งาน: <b>${esc(Q.title)}</b><br>สถานที่: ${esc(Q.site||'')}<br>${E0?'กรุณาเสนอราคาภายใน ......................':`ยืนราคา ${n(Q.valid)} วัน (ถึง ${thDL(addD(Q.date,n(Q.valid)))})`}</div></div>`;
  const detail=`<table class="${sp?'qsplit':''}${G4?' pr4':''}"${sp?' style="font-size:10.5px"':''}><thead>${head}</thead><tbody>${body.join('')}</tbody></table>`;
  if(E0)return cphead(`ใบแจ้งปริมาณงาน (BOQ) ${esc(Q.no)}`,`วันที่ ${thDL(Q.date)}`)+code+meta.replace(/<div><b>เรียน<\/b>[\s\S]*?<\/div>/,'<div><b>เรียน</b> ผู้เสนอราคา ...................................................<br>บริษัท / ร้าน ...................................................<br>โทร ...................................</div>')+
    `<p>ขอให้เสนอราคาตามรายการและปริมาณงานด้านล่าง โดยกรอกราคาต่อหน่วยและจำนวนเงินทุกช่อง</p>${detail}
    <h3 style="margin-top:12px">หมายเหตุ</h3><div class="box">${esc(Q.terms||'')}</div><div class="sign"><div>ผู้เสนอราคา (ลงชื่อ / ประทับตรา)</div><div>วันที่เสนอราคา / ยืนราคา ...... วัน</div><div>ผู้รับใบเสนอราคา ${esc(CO().name||'')}</div></div>`;
  const tail=f==='S'?'':`<div style="page-break-before:always"></div>${G4?`<style>@page{size:A4 landscape}</style><h1 style="text-align:center">แบบแสดงรายการ ปริมาณงาน และราคา (ปร.4)</h1>`:'<h1>รายละเอียดราคา</h1>'}${detail}`;
  return cphead(`ใบเสนอราคา (Quotation) ${esc(Q.no)}`,`วันที่ ${thDL(Q.date)}`)+code+meta+`
  ${G4?'<h3 style="margin:8px 0 4px">สรุปค่าก่อสร้าง (แบบ ปร.5)</h3>':''}${cover}
  <h3 style="margin-top:12px">เงื่อนไข</h3><div class="box">${esc(Q.terms||'')}</div><div class="sign"><div>ผู้เสนอราคา ${esc(Q.by||'')}</div><div>ผู้อนุมัติ</div><div>ลูกค้า (ตกลงสั่งจ้าง)</div></div>
  ${tail}`};

