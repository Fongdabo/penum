/* ---------- รายงานผลการบำรุงรักษาส่งลูกค้า: the PM check becomes a report the customer receives (PM 3.89) ----------
   Before this the ตรวจ PM card (945) kept one set of results per job and printed only the job sheet. Now a job that covers several
   machines keeps results per machine in t.mr[equipId] = {chk,val} (a one-machine job keeps t.chk / t.val as before; results typed
   before 3.89 on a several-machine job become the first machine's). The card also takes the time on site (t.tIn, t.tOut), what was
   found and fixed (t.note, the job sheet's box), advice to the customer (t.rec), photos (t.photos, t.caps) and two on-screen
   signatures: the technician (t.sigT) and the customer (t.sigCu, name t.cuName). The customer signing closes an open job.
   "รายงานส่งลูกค้า" prints PRINT.pmrep: logo, customer, contract, a summary, each machine with every check, standard, reading and
   result, the faults, photos and signatures; the browser saves it as PDF. A reading outside the standard written after "|" in the
   checklist (110–140, 220 ±10%, ≤ 5, ไม่น้อยกว่า 1) is flagged นอกเกณฑ์. Staff e-signatures (860) still fill empty places at print. */
const pmNum=s=>{const m=String(s||'').replace(/,/g,'').match(/-?\d+(?:\.\d+)?/);return m?+m[0]:null};
// the numbers a standard allows, or null when it has none
function pmRange(std){const s=String(std||'').replace(/,/g,''),N='(-?\\d+(?:\\.\\d+)?)',x=re=>s.match(new RegExp(re,'i'));let m;
  if((m=x(N+'\\s*[^\\d\\s±]{0,5}\\s*(?:±|\\+/-)\\s*'+N+'\\s*(%)?'))){const c=+m[1],d=m[3]?Math.abs(c)*m[2]/100:+m[2];return [c-d,c+d]}
  if((m=x(N+'\\s*(?:–|—|-|~|ถึง|to)\\s*'+N)))return [Math.min(+m[1],+m[2]),Math.max(+m[1],+m[2])];
  if((m=x('(?:≤|<=|<|ไม่เกิน|ไม่มากกว่า|สูงสุด|max\\.?)\\s*'+N)))return [-Infinity,+m[1]];
  if((m=x('(?:≥|>=|>|ไม่น้อยกว่า|ไม่ต่ำกว่า|อย่างน้อย|ต่ำสุด|min\\.?)\\s*'+N)))return [+m[1],Infinity];
  return null}
const pmOut=(std,val)=>{const r=pmRange(std),v=pmNum(val);return !!r&&v!=null&&(v<r[0]||v>r[1])};

const pmMulti=t=>jobEquip(t).length>1;
function pmMig(t){if(!pmMulti(t)||(t.mr&&Object.keys(t.mr).length))return;const has=o=>o&&Object.values(o).some(Boolean);
  if(has(t.chk)||has(t.val)){t.mr={[jobEquip(t)[0].id]:{chk:{...(t.chk||{})},val:{...(t.val||{})}}}}}
// where one machine's results live, and the data-p path to them
function pmRes(t,e){if(e&&pmMulti(t)){t.mr=t.mr||{};const r=t.mr[e.id]=t.mr[e.id]||{};r.chk=r.chk||{};r.val=r.val||{};return {r,p:`co.tickets.${t.id}.mr.${e.id}`}}
  t.chk=t.chk||{};t.val=t.val||{};return {r:t,p:`co.tickets.${t.id}`}}
function pmTally(t){const L=pmChecks(pmSysGet(jobSys(t))),EQ=jobEquip(t),eq=EQ.length>1?EQ:[EQ[0]||null];let done=0,bad=0,out=0;
  eq.forEach(e=>{const {r}=pmRes(t,e);L.forEach((x,i)=>{if(r.chk[i])done++;if(r.chk[i]==='bad')bad++;if(pmOut(pmLine(x).std,r.val[i]))out++})});
  return {L,done,bad,out,all:L.length*eq.length}}

// the ตรวจ PM card: machine tabs, the checklist, then what the customer report needs
pmCheckCard=function(t){pmMig(t);t.caps=t.caps||{};const sy=pmSysGet(jobSys(t)),T=pmTally(t),L=T.L,EQ=jobEquip(t),multi=EQ.length>1,base=`co.tickets.${t.id}`;
  const cur=multi?(EQ.find(e=>e.id===S.sel.jobeq)||EQ[0]):EQ[0]||null,{r,p}=pmRes(t,cur),hs=L.some(x=>pmLine(x).std);
  const st=e=>{const {r}=pmRes(t,e);return {d:L.filter((_,i)=>r.chk[i]).length,b:L.filter((_,i)=>r.chk[i]==='bad').length}};
  return `<section class="card" id="pmChk"><h2><span>ตรวจ PM ${esc(t.no)} · ${esc(sy.n)}</span><small>ตรวจแล้ว ${T.done}/${T.all}${T.bad?` · <b style="color:var(--danger)">ผิดปกติ ${T.bad}</b>`:''}${T.out?` · <b style="color:var(--warn-c)">นอกเกณฑ์ ${T.out}</b>`:''}</small><span class="sp"></span>
    <button type="button" class="btn sm pri" data-a="print" data-k="pmrep" data-id="${t.id}">รายงานส่งลูกค้า</button><button type="button" class="btn sm" data-a="print" data-k="job" data-id="${t.id}">พิมพ์ใบงาน</button><button type="button" class="x" data-a="sel" data-k="jobck" data-id="" title="ปิด" aria-label="ปิด">✕</button></h2>
  ${multi?`<p class="hint" style="margin-bottom:6px">งานนี้มี ${EQ.length} เครื่อง เลือกเครื่องแล้วกรอกผลทีละเครื่อง</p><div class="pmeq">${EQ.map((e,k)=>{const s=st(e);
      return `<button type="button" class="btn sm${e===cur?' pri':''}" data-a="sel" data-k="jobeq" data-id="${e.id}" aria-pressed="${e===cur}">${k+1}. ${esc(e.name)}${e.loc?` · ${esc(e.loc)}`:''} <span class="pill${s.b?' bad':L.length&&s.d===L.length?' ok':''}">${s.d}/${L.length}</span></button>`}).join('')}</div>`
    :cur?`<p class="hint">เครื่อง: ${esc(cur.name+(cur.loc?` (${cur.loc})`:''))}</p>`:''}
  ${L.length?`<div class="tw"><table><thead><tr><th>รายการตรวจ</th>${hs?'<th>ค่ามาตรฐาน</th>':''}<th>ผล</th><th>ค่าที่วัดได้ / หมายเหตุ</th></tr></thead><tbody>${L.map((x,i)=>{const o=pmOut(pmLine(x).std,r.val[i]);return `<tr><td>${esc(pmLine(x).t)}</td>${hs?`<td class="pmstd">${esc(pmLine(x).std)}</td>`:''}
    <td><select data-p="${p}.chk.${i}" aria-label="ผล ${esc(pmLine(x).t)}"${r.chk[i]==='bad'?' class="pmbad"':''}>${[['','–'],['ok','ปกติ'],['bad','ผิดปกติ']].map(([k,l])=>`<option value="${k}"${(r.chk[i]||'')===k?' selected':''}>${l}</option>`).join('')}</select></td>
    <td><input data-p="${p}.val.${i}" value="${esc(r.val[i]||'')}" aria-label="ค่าที่วัดได้ ${esc(pmLine(x).t)}" placeholder="ค่าที่วัดได้ / หมายเหตุ" style="min-width:160px"${o?' class="pmout"':''}>${o?'<small class="pmoutt">นอกเกณฑ์</small>':''}</td></tr>`}).join('')}</tbody></table></div>
    <div class="row" style="margin-top:8px"><button type="button" class="btn sm" data-a="pmAllOk" data-id="${t.id}" data-e="${cur?cur.id:''}">ข้อที่ยังว่าง = ปกติ</button><span class="hint" style="margin:0">ใส่ค่ามาตรฐานไว้ในรายการตรวจ (เช่น <code>วัดแรงดันน้ำยา | 110–140 psi</code>) ระบบจะเตือนเมื่อค่าที่วัดได้อยู่นอกเกณฑ์</span></div>`
  :'<p class="empty">ระบบนี้ยังไม่มีรายการตรวจ เพิ่มได้ที่แท็บ รายการตรวจ PM ตามระบบ</p>'}
  <h3 class="pmh">สำหรับรายงานส่งลูกค้า</h3>
  <div class="pmrf"><label>เวลาเข้า<input type="time" data-p="${base}.tIn" value="${esc(t.tIn||'')}"></label><label>เวลาออก<input type="time" data-p="${base}.tOut" value="${esc(t.tOut||'')}"></label>
    <label class="w">สิ่งที่ตรวจพบและแก้ไข<textarea data-p="${base}.note" rows="3" placeholder="เช่น ล้างคอยล์ เติมน้ำยา 0.5 kg เปลี่ยนสายพานพัดลม">${esc(t.note||'')}</textarea></label>
    <label class="w">ข้อเสนอแนะถึงลูกค้า<textarea data-p="${base}.rec" rows="2" placeholder="เช่น ควรเปลี่ยนคาปาซิเตอร์คอมเพรสเซอร์ภายใน 1 เดือน">${esc(t.rec||'')}</textarea></label></div>
  <h3 class="pmh">รูปถ่าย</h3>${photoBlock(base,t)}
  <div class="sigs">${sigBox(base,t,'sigT','ช่างผู้ปฏิบัติงาน','')}${sigBox(base,t,'sigCu','ลูกค้าผู้รับบริการ','cuName')}</div>
  <p class="hint">ให้ลูกค้าเซ็นบนจอมือถือหรือแท็บเล็ตได้ทันที (เซ็นแล้วงานเปลี่ยนเป็น <b>เสร็จ</b>) จากนั้นกด <b>รายงานส่งลูกค้า</b> แล้วเลือก <b>บันทึกเป็น PDF</b> เพื่อส่งไฟล์ให้ลูกค้าทางอีเมลหรือ LINE</p></section>`};

ACT.pmAllOk=b=>{const C=CO(),t=C.tickets.find(x=>x.id===b.dataset.id);if(!t)return;const e=C.equip.find(x=>x.id===b.dataset.e)||jobEquip(t)[0]||null,{r}=pmRes(t,e);
  let k=0,o=0;pmChecks(pmSysGet(jobSys(t))).forEach((x,i)=>{if(r.chk[i])return;if(pmOut(pmLine(x).std,r.val[i])){o++;return}r.chk[i]='ok';k++});
  save();render();toast(k?`ตั้ง ${k} รายการเป็นปกติ${o?` · เว้น ${o} รายการที่ค่านอกเกณฑ์ไว้ให้ตรวจเอง`:''}`:o?`เหลือ ${o} รายการที่ค่านอกเกณฑ์ ให้เลือกผลเอง`:'ทุกข้อมีผลแล้ว')};

// the customer signing on screen accepts the work: an open job becomes done today
{const f=ACT.sigOk;ACT.sigOk=b=>{const s=SIG&&{path:SIG.path,f:SIG.f};f(b);const m=s&&s.f==='sigCu'&&String(s.path).match(/^co\.tickets\.([^.]+)$/),t=m&&CO().tickets.find(x=>x.id===m[1]);
  if(t&&t.sigCu&&['open','plan'].includes(t.status)){t.status='done';if(!okD(t.done))t.done=today();save();render();toast('ลูกค้าเซ็นรับงานแล้ว งานนี้เปลี่ยนเป็นเสร็จ')}}}

// PM jobs get a "รายงาน" button in the job list too
{const g=gtable;gtable=function(base,rows,cols,o={}){if(base==='co.tickets'){const x=o.extra;
  o={...o,extra:t=>(x?x(t):'')+(t.kind==='pm'?` <button type="button" class="btn sm" data-a="print" data-k="pmrep" data-id="${t.id}" title="รายงานผลการบำรุงรักษาส่งลูกค้า">รายงาน</button>`:'')}}
  return g.call(this,base,rows,cols,o)}}

// the checklist tab says where the report is made
{const f=pmSysView;pmSysView=function(){return f().replace('<div class="pmsys">',`<div class="pmgo"><b>ทำรายงานส่งลูกค้า:</b> แท็บ <b>งานซ่อมและนัด PM</b> › กด <b>ตรวจ PM</b> ที่งาน › กรอกผลทีละเครื่อง ใส่รูป ให้ลูกค้าเซ็น › กด <b>รายงานส่งลูกค้า</b>
  <button type="button" class="btn sm pri" data-a="sub" data-k="job">ไปที่งาน PM</button></div><div class="pmsys">`)}}

if(typeof DOC_EN==='object')DOC_EN.unshift([/รายงานผลการบำรุงรักษา/,'PREVENTIVE MAINTENANCE REPORT']);
PRINT.pmrep=id=>{const C=CO(),t=C.tickets.find(x=>x.id===id);if(!t)return '';pmMig(t);
  const sy=pmSysGet(jobSys(t)),T=pmTally(t),L=T.L,EQ=jobEquip(t),multi=EQ.length>1,c=C.customers.find(x=>x.id===t.cust)||{},s=C.svc.find(x=>x.id===t.svc),
    day=okD(t.done)?t.done:okD(t.due)?t.due:t.date,hs=L.some(x=>pmLine(x).std),tech=t.tech?staffName(t.tech):'',
    nx=t.svc&&C.tickets.filter(x=>x.id!==t.id&&x.kind==='pm'&&x.svc===t.svc&&jobSys(x)===jobSys(t)&&['open','plan'].includes(x.status)&&okD(x.due)&&x.due>day).sort((a,b)=>a.due.localeCompare(b.due))[0];
  const res=k=>k==='ok'?'<b class="pr-ok">✔ ปกติ</b>':k==='bad'?'<b class="pr-bad">✘ ผิดปกติ</b>':'<span class="pr-na">–</span>',F=[];
  const mach=(e,k)=>{const {r}=pmRes(t,e);
    const rows=L.map((x,i)=>{const o=pmOut(pmLine(x).std,r.val[i]);if(r.chk[i]==='bad'||o)F.push({e,t:pmLine(x).t,v:r.val[i]||'',o,std:pmLine(x).std});
      return `<tr><td style="text-align:center">${i+1}</td><td>${esc(pmLine(x).t)}</td>${hs?`<td>${esc(pmLine(x).std)}</td>`:''}<td>${esc(r.val[i]||'')}${o?' <b class="pr-bad">(นอกเกณฑ์)</b>':''}</td><td style="text-align:center;white-space:nowrap">${res(r.chk[i])}</td></tr>`}).join('');
    return `<div class="pr-m">${e?`<h3>${multi?`เครื่องที่ ${k+1}: `:'เครื่อง: '}${esc(e.name)}</h3>${[e.model&&'รุ่น '+esc(e.model),e.serial&&'S/N '+esc(e.serial),e.loc&&'ตำแหน่ง '+esc(e.loc)].filter(Boolean).length?`<p class="pr-eq">${[e.model&&'รุ่น '+esc(e.model),e.serial&&'S/N '+esc(e.serial),e.loc&&'ตำแหน่ง '+esc(e.loc)].filter(Boolean).join(' · ')}</p>`:''}`:''}
    ${L.length?`<table><thead><tr><th style="width:24px">#</th><th>รายการตรวจ</th>${hs?'<th style="width:18%">ค่ามาตรฐาน</th>':''}<th style="width:28%">ค่าที่วัดได้ / หมายเหตุ</th><th style="width:72px">ผล</th></tr></thead><tbody>${rows}</tbody></table>`:''}</div>`};
  const body=(multi?EQ:[EQ[0]||null]).map(mach).join(''),ok=T.done-T.bad,left=T.all-T.done;
  const verdict=!T.all?'':F.length?`<b class="pr-bad">พบรายการที่ต้องแก้ไข ${F.length} รายการ</b> ดูรายละเอียดด้านล่าง`:left?`ตรวจแล้ว ${T.done} จาก ${T.all} รายการ ไม่พบสิ่งผิดปกติ`:'<b class="pr-ok">✔ อุปกรณ์ทำงานปกติทุกรายการ</b>';
  const ph=(t.photos||[]).length?`<h3>รูปถ่าย</h3><div class="pr-ph">${t.photos.map(k=>`<figure><img data-ph="${k}" alt="">${(t.caps||{})[k]?`<figcaption>${esc(t.caps[k])}</figcaption>`:''}</figure>`).join('')}</div>`:'';
  return `<div data-doc-name="${esc(`${t.no} รายงาน PM ${c.name||''} ${thD(day)}`)}"></div>`+cphead(`รายงานผลการบำรุงรักษาเชิงป้องกัน ${esc(t.no)}`,`วันที่เข้าบริการ ${thDL(day)}`)+
  `<div class="meta"><div>ลูกค้า: <b>${esc(c.name||'')}</b>${c.addr?`<br>${esc(c.addr)}`:''}${c.contact||c.phone?`<br>ผู้ติดต่อ ${esc(c.contact||'')}${c.phone?` โทร ${esc(c.phone)}`:''}`:''}</div>
    <div>ระบบ: <b>${esc(sy.n)}</b> · ${multi?EQ.length:EQ.length?1:'–'} เครื่อง${s?`<br>สัญญาบำรุงรักษา ${esc(s.no)}${s.title?` ${esc(s.title)}`:''}`:''}<br>ช่าง: ${esc(tech||'–')}${t.tIn||t.tOut?` · เวลา ${esc(t.tIn||'')}–${esc(t.tOut||'')} น.`:''}</div>
    ${t.problem?`<div style="grid-column:1/-1">งาน: ${esc(t.problem)}</div>`:''}</div>
  <div class="pr-sum"><div><span>ตรวจ</span><b>${T.all}</b> รายการ</div><div><span>ปกติ</span><b class="pr-ok">${ok}</b></div><div><span>ผิดปกติ</span><b class="${T.bad?'pr-bad':''}">${T.bad}</b></div><div><span>ค่านอกเกณฑ์</span><b class="${T.out?'pr-bad':''}">${T.out}</b></div>${left?`<div><span>ยังไม่ได้ตรวจ</span><b>${left}</b></div>`:''}<p>ผลสรุป: ${verdict||'–'}</p></div>
  ${body}
  ${F.length?`<h3>รายการที่ต้องแก้ไข / ติดตาม</h3><table><thead><tr><th style="width:24px">#</th>${multi?'<th>เครื่อง</th>':''}<th>รายการ</th><th>ค่าที่วัดได้ / หมายเหตุ</th></tr></thead><tbody>${F.map((f,i)=>`<tr><td style="text-align:center">${i+1}</td>${multi?`<td>${esc(f.e?f.e.name+(f.e.loc?` (${f.e.loc})`:''):'')}</td>`:''}<td>${esc(f.t)}</td><td>${esc(f.v)}${f.o&&f.std?` <span class="pr-na">(เกณฑ์ ${esc(f.std)})</span>`:''}</td></tr>`).join('')}</tbody></table>`:''}
  <h3>สิ่งที่ตรวจพบและแก้ไข</h3><div class="box">${esc(t.note||'–')}</div>
  <h3>ข้อเสนอแนะ</h3><div class="box">${esc(t.rec||'–')}</div>
  ${nx?`<p>นัดบำรุงรักษาครั้งถัดไป: <b>${thDL(nx.due)}</b></p>`:''}
  ${ph}
  <div class="sign pr-sign">${sigPrint(t,'sigT','ช่างผู้ปฏิบัติงาน',tech)}${sigPrint(null,'','หัวหน้างานบริการ','')}${sigPrint(t,'sigCu','ลูกค้าผู้รับบริการ',t.cuName)}</div>`};

if(typeof SBKW==='object')SBKW['co.svc.job']=(SBKW['co.svc.job']||'')+' รายงาน PM รายงานส่งลูกค้า รายงานบำรุงรักษา service report ลายเซ็นลูกค้า รูปถ่าย PM';
document.head.insertAdjacentHTML('beforeend',`<style>
.pmeq{display:flex;flex-wrap:wrap;gap:6px;margin:0 0 10px}.pmeq .pill{margin-left:4px}
#pmChk select.pmbad{color:var(--danger);font-weight:600}#pmChk input.pmout{border-color:var(--warn-c);background:color-mix(in srgb,var(--warn-c) 10%,transparent)}
.pmoutt{display:block;color:var(--warn-c);font-size:11px;font-weight:600}
.pmh{font-size:15px;margin:16px 0 6px}
.pmrf{display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:8px 12px}.pmrf label{display:flex;flex-direction:column;gap:4px;font-size:13px;color:var(--muted)}
.pmrf .w{grid-column:1/-1}.pmrf textarea{width:100%;font:inherit;resize:vertical}
.pmgo{display:flex;flex-wrap:wrap;align-items:center;gap:8px 12px;border:1px solid var(--line);border-left:4px solid var(--accent,#0891B2);border-radius:10px;padding:10px 12px;margin:0 0 12px;font-size:13.5px}
#print .pr-sum{display:flex;flex-wrap:wrap;gap:6px 18px;align-items:baseline;border:1px solid #C9D4D6;border-radius:6px;padding:8px 12px;margin:0 0 10px;font-size:12px}
#print .pr-sum span{color:#7A8A90;margin-right:4px}#print .pr-sum b{font-size:15px}#print .pr-sum p{flex-basis:100%;margin:2px 0 0}
#print .pr-ok{color:#15803D;-webkit-print-color-adjust:exact;print-color-adjust:exact}#print .pr-bad{color:#B91C1C;-webkit-print-color-adjust:exact;print-color-adjust:exact}#print .pr-na{color:#7A8A90}
#print .pr-m{page-break-inside:auto;margin-bottom:10px}#print .pr-m h3{font-size:13px;margin:10px 0 2px;color:#24343A}#print .pr-eq{font-size:11px;color:#55666C;margin:0 0 4px}
#print h3{font-size:13px;margin:12px 0 4px}
#print .pr-ph{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}#print .pr-ph figure{margin:0;page-break-inside:avoid}
#print .pr-ph img{width:100%;height:150px;object-fit:cover;margin:0}#print .pr-ph figcaption{font-size:10px;color:#55666C;text-align:center}
#print .pr-sign{page-break-inside:avoid;margin-top:28px}
</style>`);
if(typeof I18N==='object'&&I18N.en&&I18N.en.x)Object.assign(I18N.en.x,{'รายงานส่งลูกค้า':'Customer report','รายงาน':'Report','สำหรับรายงานส่งลูกค้า':'For the customer report',
  'เวลาเข้า':'Time in','เวลาออก':'Time out','สิ่งที่ตรวจพบและแก้ไข':'Findings and work done','ข้อเสนอแนะถึงลูกค้า':'Advice to the customer','รูปถ่าย':'Photos',
  'ช่างผู้ปฏิบัติงาน':'Technician','ลูกค้าผู้รับบริการ':'Customer','ข้อที่ยังว่าง = ปกติ':'Blank lines = OK','นอกเกณฑ์':'Out of range','ไปที่งาน PM':'Go to PM jobs',
  'รายงานผลการบำรุงรักษาเชิงป้องกัน':'Preventive maintenance report','ผลสรุป':'Summary','รายการที่ต้องแก้ไข / ติดตาม':'Items to fix / follow up','ข้อเสนอแนะ':'Advice'});
