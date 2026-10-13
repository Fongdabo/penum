/* ---------- round 1.9: leave, VAT report and receipts, site stock, tools ---------- */
function ensure19(){const c=DB.co;c.leave=c.leave||[];c.tools=c.tools||[];c.toolLog=c.toolLog||[];c.leaveQ=Object.assign({sick:30,personal:3,vac:6},c.leaveQ||{});
  Object.values(DB.projects).forEach(p=>{p.stock=p.stock||[];p.stockIn=p.stockIn||[]})}
{const r=render;render=function(){ensure19();return r.apply(this,arguments)}}
const isBoss=()=>{const u=me();return !u||u.dept==='MGT'||u.dept==='HR'};
const staffOpts=()=>[['','–'],...CO().staff.filter(s=>s.active!==false).map(s=>[s.id,s.name||s.code])];

/* Thai baht in words, for receipts */
function bahtText(v){v=Math.round(n(v)*100)/100;if(!v)return 'ศูนย์บาทถ้วน';const D=['','หนึ่ง','สอง','สาม','สี่','ห้า','หก','เจ็ด','แปด','เก้า'],U=['','สิบ','ร้อย','พัน','หมื่น','แสน'];
  const rd=s=>{s=String(s).replace(/^0+/,'');if(!s)return '';if(s.length>6)return rd(s.slice(0,-6))+'ล้าน'+rd(s.slice(-6));let o='';const L=s.length;
    for(let i=0;i<L;i++){const d=+s[i],p=L-i-1;if(!d)continue;if(p===1&&d===1)o+='สิบ';else if(p===1&&d===2)o+='ยี่สิบ';else if(p===0&&d===1&&L>1)o+='เอ็ด';else o+=D[d]+U[p]}return o};
  const neg=v<0;v=Math.abs(v);const b=Math.floor(v),s=Math.round((v-b)*100);return (neg?'ลบ':'')+(b?rd(b)+'บาท':'')+(s?rd(s)+'สตางค์':'ถ้วน')}

/* ===== HR: leave ===== */
const LTYPE=[['sick','ลาป่วย'],['personal','ลากิจ'],['vac','ลาพักร้อน'],['other','ลาอื่นๆ (ไม่นับโควตา)']];
const LSTAT={pend:['warn','รออนุมัติ'],ok:['ok','อนุมัติแล้ว'],no:['bad','ไม่อนุมัติ']};
const leaveDays=l=>{if(!okD(l.from))return 0;const to=okD(l.to)&&l.to>=l.from?l.to:l.from;let k=0;for(let d=l.from;d<=to;d=addD(d,1))if(pd(d).getDay()!==0)k++;return l.half&&k===1?0.5:k};
NEW.leave=()=>({staff:(me()||{}).id||'',type:'sick',from:today(),to:today(),half:false,reason:'',status:'pend'});
function leaveUsed(sid,type,yr){return sum(CO().leave.filter(l=>l.staff===sid&&l.type===type&&l.status==='ok'&&String(l.from).slice(0,4)===yr),leaveDays)}
function hrLeave(){const C=CO(),yr=String(S.sel.lyr||today().slice(0,4)),Q=C.leaveQ,boss=isBoss(),u=me(),mine=u&&!boss;
  const L=C.leave.filter(l=>!mine||l.staff===u.id).slice().sort((a,b)=>String(b.from).localeCompare(String(a.from)));
  const cols=[{k:'staff',h:'พนักงาน',t:'sel',o:()=>mine?[[u.id,u.name||u.code]]:staffOpts(),w:160},{k:'type',h:'ประเภท',t:'sel',o:LTYPE,w:120},{k:'from',h:'ตั้งแต่',t:'date'},{k:'to',h:'ถึง',t:'date'},{k:'half',h:'ครึ่งวัน',t:'chk'},
    {k:'days',h:'วันลา',t:'calc',r:1,f:l=>fmtq(leaveDays(l)),tv:l=>leaveDays(l)},{k:'reason',h:'เหตุผล',w:180},
    {k:'status',h:'สถานะ',t:'calc',f:l=>{const s=LSTAT[l.status]||LSTAT.pend;return `<span class="pill ${s[0]}">${s[1]}</span>`},tv:l=>(LSTAT[l.status]||LSTAT.pend)[1]}];
  TABLES.leave={rows:()=>L,cols};
  const pend=L.filter(l=>l.status==='pend').length,act=C.staff.filter(s=>s.active!==false&&(!mine||s.id===u.id));
  const qcell=(s,t)=>{const u=leaveUsed(s.id,t,yr),q=n(Q[t]),left=q-u;return `<td class="r">${fmtq(u)} / ${fmtq(q)}${left<0?` <span class="pill bad">เกิน ${fmtq(-left)}</span>`:''}</td>`};
  return `<dl class="stats"><div><dt>ใบลารออนุมัติ</dt><dd${pend?' style="color:var(--warn-c)"':''}>${pend}</dd></div><div><dt>ลาวันนี้</dt><dd>${L.filter(l=>l.status==='ok'&&l.from<=today()&&(l.to||l.from)>=today()).length} <small>คน</small></dd></div><div><dt>วันลาที่อนุมัติปี ${+yr+543}</dt><dd>${fmtq(sum(L.filter(l=>l.status==='ok'&&String(l.from).slice(0,4)===yr),leaveDays))} <small>วัน</small></dd></div></dl>
  <section class="card"><h2><span>ใบลา</span><small>นับวันลาจันทร์ถึงเสาร์ (ไม่นับวันอาทิตย์) ${boss?'กดอนุมัติหรือไม่อนุมัติท้ายแถว':'ผู้จัดการหรือฝ่ายบุคคลเป็นผู้อนุมัติ'}</small><span class="sp"></span>${copyBtn('leave')}</h2>
  ${gtable('co.leave',L,cols,{empty:'ยังไม่มีใบลา',extra:l=>boss&&l.status==='pend'?`<button type="button" class="btn sm" data-a="lvOk" data-id="${l.id}">อนุมัติ</button> <button type="button" class="btn sm del" data-a="lvNo" data-id="${l.id}">ไม่อนุมัติ</button>`:boss&&l.status!=='pend'?`<button type="button" class="btn sm ghost" data-a="lvRe" data-id="${l.id}" title="กลับไปรออนุมัติ">แก้สถานะ</button>`:''})}
  <div class="row" style="margin-top:8px"><button type="button" class="btn sm pri" data-a="add" data-c="co.leave">+ ยื่นใบลา</button></div></section>
  <section class="card"><h2><span>วันลาคงเหลือปี ${+yr+543}</span><small>ใช้ไป / สิทธิ์ต่อปี นับเฉพาะใบลาที่อนุมัติแล้ว</small><span class="sp"></span>
    <button type="button" class="btn sm" data-a="lvYr" data-d="-1">‹ ปีก่อน</button><button type="button" class="btn sm" data-a="lvYr" data-d="1">ปีถัดไป ›</button></h2>
  ${mine?'':`<div class="form" style="margin-bottom:12px">${LTYPE.slice(0,3).map(([k,l])=>`<label>สิทธิ์${l} (วัน/ปี)<input data-p="co.leaveQ.${k}" data-t="num" value="${n(Q[k])}"></label>`).join('')}</div>`}
  <div class="tw"><table><thead><tr><th>พนักงาน</th><th>ฝ่าย</th>${LTYPE.slice(0,3).map(x=>`<th class="r">${x[1]}</th>`).join('')}<th class="r">ลาอื่นๆ</th></tr></thead><tbody>
  ${act.length?act.map(s=>`<tr><td>${esc(s.name||s.code)}</td><td><small>${esc((DEPTS().find(d=>d[0]===s.dept)||['',s.dept||''])[1])}</small></td>${qcell(s,'sick')}${qcell(s,'personal')}${qcell(s,'vac')}<td class="r">${fmtq(leaveUsed(s.id,'other',yr))}</td></tr>`).join(''):'<tr><td colspan="6" class="empty">ยังไม่มีพนักงาน</td></tr>'}</tbody></table></div>
  <p class="hint" style="margin-top:8px">ตามกฎหมายคุ้มครองแรงงาน ลาป่วยได้รับค่าจ้างไม่เกิน 30 วันต่อปี ลากิจอย่างน้อย 3 วันต่อปี และพักร้อนอย่างน้อย 6 วันต่อปีเมื่อทำงานครบ 1 ปี</p></section>`}
const lvSet=(id,st)=>{const l=CO().leave.find(x=>x.id===id);if(!l)return;l.status=st;l.by=(me()||{}).id||'';l.at=today();save();render()};
ACT.lvOk=b=>{lvSet(b.dataset.id,'ok');toast('อนุมัติใบลาแล้ว')};ACT.lvNo=b=>lvSet(b.dataset.id,'no');ACT.lvRe=b=>lvSet(b.dataset.id,'pend');
ACT.lvYr=b=>{S.sel.lyr=String(+(S.sel.lyr||today().slice(0,4))+n(b.dataset.d));render()};

/* ===== HR: tools and equipment ===== */
const TSTAT={store:['ok','อยู่ในคลัง'],out:['info','ยืมออก'],repair:['warn','ส่งซ่อม'],lost:['bad','สูญหาย/จำหน่าย']};
NEW.tools=arr=>({code:'T'+pad(arr.length+1),name:'',serial:'',value:0,status:'store',proj:'',holder:'',out:'',back:'',cal:''});
function hrTool(){const C=CO(),td=today(),T=C.tools,projO=()=>[['','–'],...projects().map(p=>[p.id,p.name])];
  const cols=[{k:'code',h:'รหัส',w:60},{k:'name',h:'เครื่องมือ',w:170},{k:'serial',h:'S/N',w:90},{k:'value',h:'มูลค่า',t:'num',w:90,sum:x=>x.value},
    {k:'status',h:'สถานะ',t:'calc',f:t=>{const s=TSTAT[t.status]||TSTAT.store;return `<span class="pill ${s[0]}">${s[1]}</span>`},tv:t=>(TSTAT[t.status]||TSTAT.store)[1]},
    {k:'proj',h:'อยู่ที่โครงการ',t:'sel',o:projO,w:150},{k:'holder',h:'ผู้ยืม',t:'sel',o:staffOpts,w:130},{k:'back',h:'กำหนดคืน',t:'date'},{k:'cal',h:'สอบเทียบครั้งถัดไป',t:'date'}];
  TABLES.tools={rows:()=>T,cols};
  const late=T.filter(t=>t.status==='out'&&okD(t.back)&&t.back<td),cal=T.filter(t=>t.status!=='lost'&&okD(t.cal)&&t.cal<=addD(td,30));
  const log=C.toolLog.slice(-30).reverse();
  return `<dl class="stats"><div><dt>เครื่องมือทั้งหมด</dt><dd>${T.filter(t=>t.status!=='lost').length} <small>ชิ้น · ${fmt(sum(T.filter(t=>t.status!=='lost'),t=>t.value))} บาท</small></dd></div><div><dt>ยืมออกหน้างาน</dt><dd>${T.filter(t=>t.status==='out').length}</dd></div><div><dt>เกินกำหนดคืน</dt><dd${late.length?' style="color:var(--danger)"':''}>${late.length}</dd></div><div><dt>ต้องสอบเทียบใน 30 วัน</dt><dd${cal.length?' style="color:var(--warn-c)"':''}>${cal.length}</dd></div></dl>
  <section class="card"><h2><span>ทะเบียนเครื่องมือและอุปกรณ์</span><small>เลือกโครงการและผู้ยืม แล้วกด “จ่ายออก” · กด “รับคืน” เมื่อของกลับเข้าคลัง ทุกครั้งจะลงประวัติให้เอง</small><span class="sp"></span>${copyBtn('tools')}</h2>
  ${gtable('co.tools',T,cols,{empty:'ยังไม่มีเครื่องมือ',extra:t=>t.status==='store'?`<button type="button" class="btn sm" data-a="tlOut" data-id="${t.id}">จ่ายออก</button> <button type="button" class="btn sm ghost" data-a="tlRep" data-id="${t.id}">ส่งซ่อม</button>`:t.status==='lost'?'':`<button type="button" class="btn sm" data-a="tlIn" data-id="${t.id}">รับคืน</button>${t.status==='out'?` <button type="button" class="btn sm ghost del" data-a="tlLost" data-id="${t.id}">สูญหาย</button>`:''}`})}
  <div class="row" style="margin-top:8px"><button type="button" class="btn sm pri" data-a="add" data-c="co.tools">+ เพิ่มเครื่องมือ</button></div></section>
  <section class="card"><h2><span>ประวัติยืมคืนล่าสุด</span></h2><div class="tw"><table><thead><tr><th>วันที่</th><th>เครื่องมือ</th><th>รายการ</th><th>โครงการ</th><th>ผู้ยืม</th></tr></thead><tbody>
  ${log.length?log.map(x=>{const t=T.find(y=>y.id===x.tool)||{};return `<tr><td>${thD(x.date)}</td><td>${esc(t.code||'')} ${esc(t.name||'')}</td><td>${{out:'จ่ายออก',in:'รับคืน',repair:'ส่งซ่อม',lost:'สูญหาย'}[x.act]||''}</td><td>${esc((DB.projects[x.proj]||{}).name||'–')}</td><td>${esc(staffName(x.staff)||'–')}</td></tr>`}).join(''):'<tr><td colspan="5" class="empty">ยังไม่มีประวัติ</td></tr>'}</tbody></table></div></section>`}
function tlAct(id,act){const C=CO(),t=C.tools.find(x=>x.id===id);if(!t)return;
  if(act==='out'&&!t.proj&&!t.holder){toast('เลือกโครงการหรือผู้ยืมในแถวนี้ก่อน');return}
  C.toolLog.push({id:uid(),date:today(),tool:t.id,act,proj:t.proj,staff:t.holder});
  if(act==='out'){t.status='out';t.out=today();if(!okD(t.back))t.back=addD(today(),30)}else if(act==='in'){t.status='store';t.proj='';t.holder='';t.back=''}else t.status=act;
  save();render()}
ACT.tlOut=b=>tlAct(b.dataset.id,'out');ACT.tlIn=b=>tlAct(b.dataset.id,'in');ACT.tlRep=b=>tlAct(b.dataset.id,'repair');ACT.tlLost=b=>{if(confirm('บันทึกว่าเครื่องมือนี้สูญหายหรือจำหน่ายออก?'))tlAct(b.dataset.id,'lost')};

CVIEWS.hr=()=>{if(!hrFull()){S.sub.hr='leave';return `<div class="hint" style="margin:0">ยื่นใบลาและดูวันลาคงเหลือของคุณ ผู้จัดการหรือฝ่ายบุคคลเป็นผู้อนุมัติ</div>`+hrLeave()}
  const {cur,html}=subTabs('hr',[['staff','พนักงานและจัดคนลงหน้างาน'],['ts','ลงเวลาทำงาน'],['leave','การลา'],['pay','สรุปค่าแรง'],['skill','สกิลชีต'],['gap','แผนอบรม'],['rev','ประเมินและขึ้นเงินเดือน'],['band','โครงสร้างเงินเดือน'],['tool','เครื่องมือ']]);
  return html+({staff:hrStaff,ts:hrTs,leave:hrLeave,pay:hrPay,skill:hrSkill,gap:hrGap,rev:hrRev,band:hrBand,tool:hrTool}[cur])()};

/* ===== accounting: VAT report and receipts ===== */
const poTaxDate=po=>okD(po.taxDate)?po.taxDate:((po.dl||[]).map(d=>d.date).filter(okD).sort().pop()||po.date);
function acctVat(){const m=S.sel.vatm||ym(today());
  const out=arRows().filter(x=>ym(x.b.date)===m).map(x=>({id:x.b.id,p:x.p,no:x.b.no,date:x.b.date,who:custName(x.p.info.cust)||x.p.info.client||'',tax:(CO().customers.find(c=>c.id===x.p.info.cust)||{}).tax||'',base:x.c.base,vat:x.c.vat}));
  const inn=projects().flatMap(p=>withP(p,()=>p.pos.filter(po=>!po.novat&&(po.dl||[]).length+(okD(po.taxDate)?1:0)&&ym(poTaxDate(po))===m).map(po=>{const T=poTotal(po),v=p.vendors.find(x=>x.id===po.vid)||{};return {id:po.id,p,po,no:po.taxNo||'',ref:po.no,date:poTaxDate(po),who:v.name||'',tax:v.tax||'',base:T.s,vat:T.v}})));
  inn.push(...vatExtra(m));inn.sort((a,b)=>String(a.date).localeCompare(String(b.date)));
  const cO=[{k:'date',h:'วันที่',t:'calc',f:r=>thD(r.date),tv:r=>r.date},{k:'no',h:'เลขที่ใบกำกับ',t:'calc',f:r=>`<b>${esc(r.no)}</b>`,tv:r=>r.no},{k:'who',h:'ผู้ซื้อ',t:'calc',f:r=>esc(r.who),tv:r=>r.who},{k:'tax',h:'เลขผู้เสียภาษี',t:'calc',f:r=>esc(r.tax),tv:r=>r.tax},{k:'pj',h:'โครงการ',t:'calc',f:r=>`<small>${esc(r.p.name)}</small>`,tv:r=>r.p.name},{k:'base',h:'มูลค่าสินค้า/บริการ',t:'calc',r:1,f:r=>fmt(r.base,2),tv:r=>r.base.toFixed(2)},{k:'vat',h:'ภาษีมูลค่าเพิ่ม',t:'calc',r:1,f:r=>fmt(r.vat,2),tv:r=>r.vat.toFixed(2)}];
  const cI=[{k:'date',h:'วันที่',t:'calc',f:r=>!r.po?thD(r.date):`<input type="date" data-p="pos.${r.id}.taxDate" data-pj="${r.p.id}" value="${esc(r.po.taxDate||'')}" aria-label="วันที่ใบกำกับ" title="ว่าง = ใช้วันรับของล่าสุด ${thD(r.date)}">`,tv:r=>r.date},{k:'no',h:'เลขที่ใบกำกับของผู้ขาย',t:'calc',f:r=>!r.po?`<input data-p="${r.path}.taxNo" data-pj="${r.p.id}" value="${esc(r.no)}" placeholder="ใส่เลขที่" aria-label="เลขที่ใบกำกับ">`:`<input data-p="pos.${r.id}.taxNo" data-pj="${r.p.id}" value="${esc(r.no)}" placeholder="ใส่เลขที่" aria-label="เลขที่ใบกำกับ">`,tv:r=>r.no},{k:'ref',h:'PO',t:'calc',f:r=>esc(r.ref),tv:r=>r.ref},{k:'who',h:'ผู้ขาย',t:'calc',f:r=>esc(r.who),tv:r=>r.who},{k:'pj',h:'โครงการ',t:'calc',f:r=>`<small>${esc(r.p.name)}</small>`,tv:r=>r.p.name},{k:'base',h:'มูลค่า',t:'calc',r:1,f:r=>fmt(r.base,2),tv:r=>r.base.toFixed(2)},{k:'vat',h:'ภาษีซื้อ',t:'calc',r:1,f:r=>fmt(r.vat,2),tv:r=>r.vat.toFixed(2)}];
  TABLES.vatOut={rows:()=>out,cols:cO};TABLES.vatIn={rows:()=>inn,cols:cI};
  const vo=sum(out,r=>r.vat),vi=sum(inn,r=>r.vat),due=vo-vi,mo=pd(m+'-01').toLocaleDateString('th-TH',{month:'long',year:'numeric'});
  const tb=(rows,cols,empty)=>`<div class="tw"><table><thead><tr>${cols.map(c=>`<th class="${c.r?'r':''}">${c.h}</th>`).join('')}</tr></thead><tbody>${rows.length?rows.map(r=>`<tr>${cols.map(c=>`<td class="${c.r?'r':''}">${c.f(r)}</td>`).join('')}</tr>`).join('')+`<tr class="tot"><td colspan="${cols.length-2}">รวม ${rows.length} ใบ</td><td class="r">${fmt(sum(rows,r=>r.base),2)}</td><td class="r">${fmt(sum(rows,r=>r.vat),2)}</td></tr>`:`<tr><td colspan="${cols.length}" class="empty">${empty}</td></tr>`}</tbody></table></div>`;
  return `<div class="row" style="margin-bottom:-4px"><button type="button" class="btn sm" data-a="vatM" data-d="-1">‹ เดือนก่อน</button><b style="font-family:var(--f-display);font-size:16px">${mo}</b><button type="button" class="btn sm" data-a="vatM" data-d="1">เดือนถัดไป ›</button><span class="sp" style="flex:1"></span><button type="button" class="btn sm" data-a="vatPrint">พิมพ์รายงาน</button></div>
  <dl class="stats"><div><dt>ภาษีขาย</dt><dd>${fmt(vo,2)}</dd></div><div><dt>ภาษีซื้อ</dt><dd>${fmt(vi,2)}</dd></div><div><dt>${due>=0?'ภาษีที่ต้องชำระ (ภ.พ.30)':'ภาษีชำระเกิน (ยกไป/ขอคืน)'}</dt><dd style="color:${due>=0?'var(--danger)':'var(--good)'}">${fmt(Math.abs(due),2)}</dd></div><div><dt>ยื่นแบบภายใน</dt><dd style="font-size:18px">${thD(iso(new Date(pd(m+'-01').getFullYear(),pd(m+'-01').getMonth()+1,15)))} <small>(ยื่นออนไลน์ +8 วัน)</small></dd></div></dl>
  <section class="card"><h2><span>รายงานภาษีขาย</span><small>จากใบแจ้งหนี้/ใบกำกับภาษีที่ออกในเดือนนี้ (ไม่รวมใบร่าง)</small><span class="sp"></span>${copyBtn('vatOut')}</h2>${tb(out,cO,'ไม่มีใบกำกับภาษีขายในเดือนนี้')}</section>
  <section class="card"><h2><span>รายงานภาษีซื้อ</span><small>จากใบสั่งซื้อที่มี VAT และรับของแล้ว ใส่เลขที่และวันที่ตามใบกำกับภาษีของผู้ขายได้ในตาราง (วันที่ว่าง = ใช้วันรับของล่าสุด)</small><span class="sp"></span>${copyBtn('vatIn')}</h2>${tb(inn,cI,'ไม่มีภาษีซื้อในเดือนนี้')}
  <p class="hint" style="margin-top:8px">รวมการจ่ายผู้รับเหมาช่วงและค่าใช้จ่ายอื่นที่ติ๊ก “มี VAT” ไว้ในแท็บงบและเบิกงวด ตรวจกับเอกสารจริงก่อนยื่นแบบทุกครั้ง</p></section>`}
ACT.vatM=b=>{const m=pd((S.sel.vatm||ym(today()))+'-01');m.setMonth(m.getMonth()+n(b.dataset.d));S.sel.vatm=ym(iso(m));render()};
ACT.vatPrint=()=>{const m=S.sel.vatm||ym(today()),mo=pd(m+'-01').toLocaleDateString('th-TH',{month:'long',year:'numeric'}),h=t=>{const T=TABLES[t];const R=T.rows();return `<table><thead><tr>${T.cols.map(c=>`<th>${c.h}</th>`).join('')}</tr></thead><tbody>${R.map(r=>`<tr>${T.cols.map(c=>`<td${c.r?' style="text-align:right"':''}>${c.r?esc(fmt(c.tv(r),2)):esc(c.tv(r))}</td>`).join('')}</tr>`).join('')}<tr><td colspan="${T.cols.length-2}"><b>รวม</b></td><td style="text-align:right"><b>${fmt(sum(R,r=>r.base),2)}</b></td><td style="text-align:right"><b>${fmt(sum(R,r=>r.vat),2)}</b></td></tr></tbody></table>`};
  $('#print').innerHTML=cphead(`รายงานภาษีขาย และ รายงานภาษีซื้อ`,`เดือนภาษี ${mo}`)+`<h2 style="font-size:14px;margin:10px 0 4px">รายงานภาษีขาย</h2>${h('vatOut')}<h2 style="font-size:14px;margin:14px 0 4px">รายงานภาษีซื้อ</h2>${h('vatIn')}`;setTimeout(()=>print(),300)};
// the purchase-tax inputs edit a PO in another project: point P at it for the edit
document.addEventListener('change',e=>{const t=e.target;if(!t.dataset||!t.dataset.pj||!t.dataset.p)return;const p=DB.projects[t.dataset.pj];if(!p)return;e.stopImmediatePropagation();withP(p,()=>setPath(t.dataset.p,t.value));save();render()},true);

CVIEWS.acct=()=>{const {cur,html}=subTabs('acct',[['ar','ลูกหนี้ (เงินรับ)'],['ap','เจ้าหนี้ (เงินจ่าย)'],['cf','กระแสเงินสด'],['vat','ภาษีซื้อ-ภาษีขาย'],['wht','ภาษีหัก ณ ที่จ่าย']]);
  if(cur!=='ar')return html+({ap:acctAP,cf:acctCF,vat:acctVat,wht:acctWht}[cur])();
  // receivables: a receipt button next to the tax invoice once the money is in
  return html+acctAR().replace(/<button type="button" class="btn sm" data-a="printTax" data-p="([^"]+)" data-id="([^"]+)">ใบกำกับภาษี<\/button>/g,(all,pid,id)=>{const p=DB.projects[pid],b=p&&p.bills.find(x=>x.id===id);return b&&b.status==='paid'?all+` <button type="button" class="btn sm" data-a="printRc" data-p="${pid}" data-id="${id}">ใบเสร็จ</button>`:all})};
ACT.printRc=b=>{const p=DB.projects[b.dataset.p],x=p&&p.bills.find(y=>y.id===b.dataset.id);if(!x)return;
  if(!x.rcNo){x.rcNo=nextNo('RC-',projects().flatMap(q=>q.bills.filter(y=>y.rcNo).map(y=>({no:y.rcNo}))));save()}
  $('#print').innerHTML=withP(p,()=>{const c=billCalc(x),cu=CO().customers.find(y=>y.id===P.info.cust)||{},I=P.info;
    return cphead(`ใบเสร็จรับเงิน ${esc(x.rcNo)}`,`วันที่ ${thDL(x.paid||today())}`)+`<div class="meta"><div><b>ได้รับเงินจาก</b> ${esc(cu.name||I.client||'')}<br>${esc(cu.addr||'')}<br>${cu.tax?'เลขประจำตัวผู้เสียภาษี '+esc(cu.tax):''}</div><div>โครงการ ${esc(P.name)}<br>อ้างอิงใบกำกับภาษี ${esc(x.no)} ลงวันที่ ${thDL(x.date)}</div></div>
    <table><thead><tr><th>รายการ</th><th>จำนวนเงิน</th></tr></thead><tbody><tr><td>ชำระค่างานตามใบกำกับภาษี ${esc(x.no)} (รวมภาษีมูลค่าเพิ่ม)</td><td style="text-align:right">${fmt(c.base+c.vat,2)}</td></tr>
    <tr><td>หักภาษี ณ ที่จ่าย ${n(I.wht)}% (ลูกค้าหักและออกหนังสือรับรอง)</td><td style="text-align:right">-${fmt(c.wht,2)}</td></tr>${c.ret?`<tr><td>หักเงินประกันผลงาน ${n(I.ret)}%</td><td style="text-align:right">-${fmt(c.ret,2)}</td></tr>`:''}
    <tr><td><b>รับเงินสุทธิ</b><br><small>(${bahtText(c.net)})</small></td><td style="text-align:right"><b>${fmt(c.net,2)}</b></td></tr></tbody></table>
    <p style="margin:10px 0">ชำระโดย ☐ เงินสด ☐ โอนเงิน ☐ เช็คธนาคาร ................ เลขที่ ................ ลงวันที่ ................</p>
    <div class="sign"><div>ผู้รับเงิน</div><div>ผู้มีอำนาจลงนาม</div></div>`});setTimeout(()=>print(),300)};

/* ===== project: site stock ===== */
NEW.stock=()=>({date:today(),item:'',q:0,where:'',by:(me()||{}).id||'',note:''});
NEW.stockIn=()=>({date:today(),item:'',unit:'',q:0,ref:''});
const skKey=(d,u)=>`${String(d||'').trim()}|${String(u||'').trim()}`;
function stockCard(){const M=new Map(),get=(d,u)=>{const k=skKey(d,u);if(!M.has(k))M.set(k,{k,desc:String(d||'').trim(),unit:String(u||'').trim(),inq:0,out:0,last:''});return M.get(k)};
  P.pos.forEach(po=>(po.dl||[]).forEach(dl=>{const l=po.items.find(x=>x.id===dl.line);if(!l||!String(l.desc||'').trim())return;const r=get(l.desc,l.unit);r.inq+=n(dl.q);if(dl.date>r.last)r.last=dl.date}));
  P.stockIn.forEach(x=>{if(!String(x.item||'').trim())return;const r=get(x.item,x.unit);r.inq+=n(x.q);if(x.date>r.last)r.last=x.date});
  P.stock.forEach(x=>{if(!x.item)return;const [d,u]=String(x.item).split('|');const r=get(d,u);r.out+=n(x.q);if(x.date>r.last)r.last=x.date});
  return [...M.values()].sort((a,b)=>a.desc.localeCompare(b.desc,'th'))}
function buyStock(){const C=stockCard(),neg=C.filter(r=>r.inq-r.out<0);
  const itemO=()=>[['','– เลือกวัสดุ –'],...C.map(r=>[r.k,`${r.desc}${r.unit?' ('+r.unit+')':''} · คงเหลือ ${fmtq(r.inq-r.out)}`])];
  const cols=[{k:'date',h:'วันที่เบิก',t:'date'},{k:'item',h:'วัสดุ',t:'sel',o:itemO,w:260},{k:'q',h:'จำนวน',t:'num',w:80},{k:'where',h:'ใช้ที่ / งาน',w:160},{k:'by',h:'ผู้เบิก',t:'sel',o:staffOpts,w:130},{k:'note',h:'หมายเหตุ',w:140}];
  const ci=[{k:'date',h:'วันที่รับ',t:'date'},{k:'item',h:'วัสดุ',w:220},{k:'unit',h:'หน่วย',w:70},{k:'q',h:'จำนวน',t:'num',w:80},{k:'ref',h:'ที่มา (เช่น โอนจากโครงการอื่น)',w:200}];
  const sc=[{k:'desc',h:'วัสดุ',t:'calc',f:r=>esc(r.desc),tv:r=>r.desc},{k:'unit',h:'หน่วย',t:'calc',f:r=>esc(r.unit),tv:r=>r.unit},{k:'inq',h:'รับเข้า',t:'calc',r:1,f:r=>fmtq(r.inq),tv:r=>r.inq},{k:'out',h:'เบิกใช้',t:'calc',r:1,f:r=>fmtq(r.out),tv:r=>r.out},{k:'bal',h:'คงเหลือ',t:'calc',r:1,f:r=>{const b=r.inq-r.out;return b<0?`<span class="pill bad">${fmtq(b)}</span>`:`<b>${fmtq(b)}</b>`},tv:r=>r.inq-r.out},{k:'last',h:'เคลื่อนไหวล่าสุด',t:'calc',f:r=>thD(r.last),tv:r=>r.last}];
  TABLES.stockCard={rows:()=>C,cols:sc};TABLES.stock={rows:()=>P.stock,cols};TABLES.stockIn={rows:()=>P.stockIn,cols:ci};
  return `<dl class="stats"><div><dt>รายการวัสดุในคลัง</dt><dd>${C.filter(r=>r.inq-r.out>0).length}</dd></div><div><dt>เบิกใช้เดือนนี้</dt><dd>${P.stock.filter(x=>ym(x.date)===ym(today())).length} <small>ครั้ง</small></dd></div><div><dt>เบิกเกินรับ</dt><dd${neg.length?' style="color:var(--danger)"':''}>${neg.length} <small>รายการ</small></dd></div></dl>
  <section class="card"><h2><span>ยอดคงเหลือหน้างาน</span><small>รับเข้า = ของที่บันทึกรับจากใบสั่งซื้อ + รับเข้าอื่นๆ ด้านล่าง</small><span class="sp"></span>${copyBtn('stockCard')}</h2>
  <div class="tw"><table><thead><tr>${sc.map(c=>`<th class="${c.r?'r':''}">${c.h}</th>`).join('')}</tr></thead><tbody>${C.length?C.map(r=>`<tr>${sc.map(c=>`<td class="${c.r?'r':''}">${c.f(r)}</td>`).join('')}</tr>`).join(''):`<tr><td colspan="${sc.length}" class="empty">ยังไม่มีของเข้าหน้างาน บันทึกรับของได้ที่ “ใบสั่งซื้อ (PO)”</td></tr>`}</tbody></table></div></section>
  <section class="card"><h2><span>ใบเบิกวัสดุ</span><small>เลือกวัสดุจากรายการที่มีในคลัง</small><span class="sp"></span>${copyBtn('stock')}</h2>${gtable('stock',P.stock.slice().sort((a,b)=>String(b.date).localeCompare(String(a.date))),cols,{empty:'ยังไม่มีการเบิกวัสดุ'})}
  <div class="row" style="margin-top:8px"><button type="button" class="btn sm pri" data-a="add" data-c="stock">+ เบิกวัสดุ</button></div></section>
  <section class="card"><h2><span>รับเข้าอื่นๆ</span><small>ของที่ไม่ได้มาจาก PO ของโครงการนี้ เช่น โอนมาจากโครงการอื่นหรือคลังบริษัท</small><span class="sp"></span>${copyBtn('stockIn')}</h2>${gtable('stockIn',P.stockIn,ci,{empty:'ยังไม่มีรายการ'})}
  <div class="row" style="margin-top:8px"><button type="button" class="btn sm" data-a="add" data-c="stockIn">+ รับเข้า</button></div></section>`}
VIEWS.buy=()=>{const {cur,html}=subTabs('buy',[['boq','รายการวัสดุจาก BOQ'],['pr','ใบขอซื้อและเทียบราคา'],['po','ใบสั่งซื้อ (PO)'],['dl','ติดตามของเข้าหน้างาน'],['stock','คลังวัสดุหน้างาน'],['ven','ผู้ขาย']]);
  return html+({boq:buyBoq,pr:buyPR,po:buyPO,dl:buyDL,stock:buyStock,ven:buyVen}[cur])()};

/* ===== alerts ===== */
{const f=alerts;alerts=function(){const A=f(),td=today(),C=CO(),add=(lv,kind,p,txt,due,go)=>A.push({lv,kind,p,txt,due,go});
  (C.leave||[]).forEach(l=>{if(l.status==='pend'&&isBoss())add('warn','ใบลารออนุมัติ',null,`${staffName(l.staff)} · ${(LTYPE.find(x=>x[0]===l.type)||['',''])[1]} ${fmtq(leaveDays(l))} วัน`,l.from,{m:'co',k:'hr',s:'leave'})});
  (hrFull()?C.tools||[]:[]).forEach(t=>{if(t.status==='out'&&okD(t.back)&&t.back<td)add('bad','เครื่องมือเกินกำหนดคืน',DB.projects[t.proj]||null,`${t.code} ${t.name} · ${staffName(t.holder)}`,t.back,{m:'co',k:'hr',s:'tool'});
    if(t.status!=='lost'&&okD(t.cal)&&t.cal<=addD(td,30))add(t.cal<td?'bad':'warn','เครื่องมือต้องสอบเทียบ',null,`${t.code} ${t.name}`,t.cal,{m:'co',k:'hr',s:'tool'})});
  return A.filter(a=>allowed(a.go.m,a.go.k)).sort((a,b)=>(a.lv==='bad'?0:1)-(b.lv==='bad'?0:1)||String(a.due).localeCompare(String(b.due)))}}

/* ===== demo data for the new parts ===== */
{const f=ACT.loadDemo;ACT.loadDemo=b=>{const r=f(b);ensure19();const C=CO(),td=today(),st=C.staff;
  if(!C.leave.length&&st.length>4){C.leave.push({id:uid(),staff:st[3].id,type:'sick',from:addD(td,-9),to:addD(td,-8),half:false,reason:'ไข้หวัด',status:'ok',at:addD(td,-9)},{id:uid(),staff:st[2].id,type:'vac',from:addD(td,6),to:addD(td,8),half:false,reason:'กลับบ้านต่างจังหวัด',status:'pend'},{id:uid(),staff:st[4].id,type:'personal',from:addD(td,2),to:addD(td,2),half:true,reason:'ติดต่อราชการ',status:'pend'})}
  if(!C.tools.length){const pid=P.id,T=[['สว่านโรตารี่ Bosch','GBH 2-26',4500],['เครื่องวัดความดันน้ำยา (Manifold) ดิจิทัล','TESTO 550',12800],['ปั๊มสุญญากาศ 2 stage','VP-215',7900],['เครื่องวัดฉนวนไฟฟ้า (Megger)','KYORITSU 3005A',15500],['เครื่องวัดลม (Anemometer)','TESTO 417',9800],['ชุดเชื่อมท่อทองแดง','',6200]];
    T.forEach(([nm,sn,v],i)=>C.tools.push(Object.assign({id:uid()},NEW.tools(C.tools),{name:nm,serial:sn,value:v,cal:i===1?addD(td,12):i===3?addD(td,-3):i===4?addD(td,140):''},i<3?{status:'out',proj:pid,holder:(st[3+i%2]||{}).id||'',out:addD(td,-20),back:i===2?addD(td,-2):addD(td,25)}:{})));
    C.tools.filter(t=>t.status==='out').forEach(t=>C.toolLog.push({id:uid(),date:t.out,tool:t.id,act:'out',proj:t.proj,staff:t.holder}))}
  if(!P.stock.length){const L=stockCard().filter(r=>r.inq>0);L.slice(0,5).forEach((r,i)=>P.stock.push({id:uid(),date:addD(td,-6+i),item:r.k,q:Math.max(1,Math.round(r.inq*(i===2?0.9:0.4))),where:['ชั้น 1 โซน A','ชั้น 1 โซน B','ห้องเครื่อง','ชั้น 2','ดาดฟ้า'][i],by:(st[3]||{}).id||'',note:''}))}
  save();render();return r}}

