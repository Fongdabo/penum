/* ---------- งาน PM ทุกระบบ: each piece of equipment has a building system, each system its own PM checklist and interval (PM 3.78) ----------
   Before this the PM job sheet printed the air-con checklist for every machine. CO().pmSys = [{id,n,every,list}] (list = one check per
   line) starts from PMSYS_DEF below; the company edits it under บริการ › รายการตรวจ PM ตามระบบ. equip.sys picks the system (blank =
   guessed from the name), equip.svc ties a machine to a contract. A contract with machines gets PM visits at each system's interval,
   one job per system per visit. A job keeps its results in t.chk {line: 'ok'|'bad'} and t.val {line: text}.
   The default checklists are drafted from common practice and assumed; ORIEN's engineers should check them before real use. */
const PMSYS_DEF=[
 ['ac','แอร์ / FCU / แพ็กเกจ',3,['ล้างแผ่นกรองอากาศ','ล้างคอยล์เย็น/คอยล์ร้อน','ตรวจน้ำทิ้ง','วัดกระแสไฟฟ้า','วัดแรงดันน้ำยา','วัดอุณหภูมิลมจ่าย','ตรวจเสียงและการสั่น','ขันขั้วสายไฟ']],
 ['chw','ชิลเลอร์ / AHU / ระบบน้ำเย็น',1,['วัดอุณหภูมิน้ำเย็นเข้า-ออก','วัดแรงดันน้ำยาด้านสูง-ด้านต่ำ','วัดกระแสคอมเพรสเซอร์และมอเตอร์','ตรวจระดับและสีน้ำมันคอมเพรสเซอร์','ล้างแผ่นกรองอากาศ AHU','ตรวจสายพานและลูกปืนพัดลม','ตรวจปั๊มน้ำเย็นและวาล์ว','ตรวจคุณภาพน้ำและสารเคมีหอผึ่งเย็น','ตรวจถาดและท่อน้ำทิ้ง']],
 ['elec','ตู้ไฟ MDB / DB / หม้อแปลง',6,['ถ่ายภาพความร้อนจุดต่อ (Thermoscan)','ขันขั้วต่อและบัสบาร์','วัดแรงดันและกระแสแต่ละเฟส','ตรวจความสมดุลของโหลด','ทดสอบเบรกเกอร์และ RCD','วัดค่าความต้านทานดิน','ทำความสะอาดตู้และอุดช่องกันสัตว์','หม้อแปลง: อุณหภูมิ ระดับน้ำมัน ซิลิกาเจล']],
 ['gen','เครื่องกำเนิดไฟฟ้า / ATS',1,['เดินเครื่องทดสอบแบบมีโหลด','ตรวจระดับน้ำมันเชื้อเพลิงและน้ำมันเครื่อง','ตรวจน้ำหล่อเย็นและหม้อน้ำ','ตรวจแบตเตอรี่และแรงดันชาร์จ','ทดสอบการสลับของ ATS','ตรวจไส้กรองอากาศและไส้กรองน้ำมัน','ตรวจท่อไอเสียและการรั่วซึม','บันทึกชั่วโมงการทำงาน']],
 ['plumb','ปั๊มน้ำ / สุขาภิบาล',3,['ตรวจแรงดันระบบและสวิตช์แรงดัน','วัดกระแสมอเตอร์ปั๊ม','ตรวจเสียงและการสั่นของปั๊ม','ตรวจซีลและการรั่วซึม','ตรวจลูกลอยและระดับน้ำในถัง','ล้างตะแกรงและไส้กรอง','ทดสอบสลับปั๊มหลัก-ปั๊มสำรอง','ตรวจถังแรงดัน']],
 ['fire','ปั๊มและระบบดับเพลิง',1,['เดินปั๊มดับเพลิงทดสอบ (Churn test)','ตรวจแรงดันระบบที่เกจ','ตรวจปั๊ม Jockey และน้ำมันเครื่องยนต์ปั๊ม','ตรวจวาล์วอยู่ในตำแหน่งเปิดตามปกติ','ตรวจหัวสปริงเกอร์ไม่มีสิ่งกีดขวาง','ตรวจตู้สายฉีดน้ำดับเพลิง','ตรวจถังดับเพลิง: แรงดัน วันหมดอายุ','ตรวจหัวรับน้ำดับเพลิง']],
 ['alarm','ระบบแจ้งเหตุเพลิงไหม้',6,['ทดสอบอุปกรณ์ตรวจจับควันและความร้อน','ทดสอบอุปกรณ์แจ้งเหตุด้วยมือ','ทดสอบเสียงและไฟสัญญาณ','ตรวจแผงควบคุมไม่มีสัญญาณขัดข้อง','ตรวจแบตเตอรี่สำรอง','ตรวจไฟฉุกเฉินและป้ายทางหนีไฟ']],
 ['vent','พัดลมระบายอากาศ / อัดอากาศ',3,['ทำความสะอาดใบพัดและตะแกรง','ตรวจสายพานและลูกปืน','วัดกระแสมอเตอร์','ตรวจเสียงและการสั่น','ทดสอบทำงานร่วมกับระบบแจ้งเหตุ (พัดลมอัดอากาศ)']],
 ['lift','ลิฟต์ / บันไดเลื่อน',1,['ตรวจการจอดตรงชั้น','ทดสอบประตูและเซนเซอร์กันหนีบ','ทดสอบอินเตอร์คอมและกริ่งฉุกเฉิน','ตรวจห้องเครื่องและน้ำมันเกียร์','ตรวจลวดสลิงและเบรก','ทดสอบกลับชั้นเมื่อไฟดับ (ARD)']],
 ['comm','CCTV / LAN / สื่อสาร',6,['ตรวจภาพทุกกล้องและเช็ดเลนส์','ตรวจการบันทึกและพื้นที่ฮาร์ดดิสก์','ตั้งเวลาเครื่องบันทึกให้ตรง','ตรวจสวิตช์ เราเตอร์ และ UPS','ทดสอบระบบควบคุมการเข้าออก']],
 ['wwt','บ่อบำบัดน้ำเสีย',1,['ตรวจเครื่องเติมอากาศ / โบลเวอร์','ตรวจปั๊มสูบตะกอนและปั๊มน้ำทิ้ง','วัดค่า pH และ DO','ตรวจกลิ่นและสีน้ำทิ้ง','ตรวจการเติมคลอรีน','ตรวจระดับตะกอน']],
 ['other','อื่น ๆ',6,['ทำความสะอาด','ตรวจสภาพทั่วไป','ตรวจเสียงและการสั่น','ขันขั้วสายไฟ','ทดสอบการทำงาน']]
].map(([id,n,every,L])=>({id,n,every,list:L.join('\n')}));
// the company's list, with any default it has not got yet (a later release can add systems)
const pmSysAll=()=>{const C=CO(),L=Array.isArray(C.pmSys)?C.pmSys:[];return [...L,...PMSYS_DEF.filter(d=>!L.some(x=>x.id===d.id)).map(d=>({...d}))]};
const pmSysGet=id=>pmSysAll().find(s=>s.id===id)||pmSysAll().find(s=>s.id==='other');
const pmChecks=s=>String((s&&s.list)||'').split('\n').map(x=>x.trim()).filter(Boolean);
// a line may carry the accepted value after a bar: "วัดแรงดันน้ำยา | 110–140 psi" (the paper form OE-SV-01 has that column too)
const pmLine=x=>{const [t,...r]=x.split('|');return {t:t.trim(),std:r.join('|').trim()}};
const PMGUESS=[['alarm',/แจ้งเหตุ|smoke|detector|fire ?alarm|FACP/i],['fire',/ดับเพลิง|fire|sprinkler|สปริงเกอร์|FHC|jockey/i],
 ['chw',/chiller|ชิลเลอร์|AHU|cooling ?tower|หอผึ่ง|น้ำเย็น/i],['ac',/แอร์|FCU|fan ?coil|split|ปรับอากาศ|package|CDU|VRF|VRV|BTU/i],
 ['gen',/generator|เครื่องกำเนิด|genset|\bATS\b/i],['elec',/MDB|\bDB\b|\bSDB\b|ตู้ไฟ|ตู้ควบคุมไฟ|หม้อแปลง|transformer|switchboard|UPS/i],
 ['lift',/ลิฟต์|lift|elevator|บันไดเลื่อน|escalator/i],['wwt',/บำบัด|\bSTP\b|WWTP|septic/i],['vent',/พัดลม|\bfan\b|ระบายอากาศ|อัดอากาศ|exhaust/i],
 ['plumb',/ปั๊ม|pump|ถังน้ำ|booster|สุขาภิบาล|ถังแรงดัน/i],['comm',/CCTV|กล้อง|LAN|network|access ?control|MATV|wi-?fi/i]];
const pmGuess=name=>(PMGUESS.find(([,re])=>re.test(name||''))||['other'])[0];
const eqSys=e=>(e&&e.sys)||pmGuess(e&&e.name);
// old PM jobs with no system and no machine were air-con visits
const jobSys=t=>t.sys||(t.equip?eqSys(CO().equip.find(e=>e.id===t.equip)):'ac');
const addMon=(s,k)=>{const d=pd(s);d.setMonth(d.getMonth()+k);return iso(d)};

// ทะเบียนเครื่อง: system and contract columns; งานซ่อม: system column and a "ตรวจ PM" button on PM jobs
{const g=gtable;gtable=function(base,rows,cols,o={}){
  if(base==='co.equip'&&!cols.some(c=>c.k==='sys')){const i=cols.findIndex(c=>c.k==='name')+1;
    cols.splice(i,0,{k:'sys',h:'ระบบ',t:'sel',w:200,o:e=>[['',`อัตโนมัติ · ${pmSysGet(pmGuess(e.name)).n}`],...pmSysAll().map(s=>[s.id,s.n])]},
      {k:'svc',h:'สัญญา PM',t:'sel',w:110,o:e=>[['','–'],...CO().svc.filter(s=>!e.cust||!s.cust||s.cust===e.cust).map(s=>[s.id,s.no])]})}
  if(base==='co.tickets'&&!cols.some(c=>c.k==='sys')){const i=cols.findIndex(c=>c.k==='equip')+1;
    cols.splice(i,0,{k:'sys',h:'ระบบ',t:'sel',w:150,o:t=>[['',t.equip?`ตามเครื่อง · ${pmSysGet(jobSys(t)).n}`:'–'],...pmSysAll().map(s=>[s.id,s.n])]});
    const x=o.extra;o={...o,extra:t=>(t.kind==='pm'?`<button type="button" class="btn sm${S.sel.jobck===t.id?' pri':''}" data-a="sel" data-k="jobck" data-id="${t.id}">ตรวจ PM</button> `:'')+(x?x(t):'')}}
  return g.call(this,base,rows,cols,o)}}

// a contract with registered machines: one PM job per system at that system's interval, for the length of the contract
{const f=ACT.genPM;ACT.genPM=b=>{const C=CO(),s=C.svc.find(x=>x.id===b.dataset.id);if(!s)return f(b);
  let eq=C.equip.filter(e=>e.svc===s.id);if(!eq.length&&s.cust)eq=C.equip.filter(e=>e.cust===s.cust&&!e.svc);
  if(!eq.length)return f(b);
  const by={};eq.forEach(e=>(by[eqSys(e)]=by[eqSys(e)]||[]).push(e));let a=0;const mo=Math.max(1,n(s.months));
  for(const [id,L] of Object.entries(by)){const sy=pmSysGet(id),ev=Math.max(1,n(sy.every)||6),k=Math.max(1,Math.floor(mo/ev));
    for(let i=1;i<=k;i++){const due=addMon(s.start,Math.min(mo,ev*i));if(C.tickets.some(t=>t.svc===s.id&&t.kind==='pm'&&t.due===due&&jobSys(t)===sy.id))continue;
      C.tickets.push(Object.assign({id:uid()},NEW.tickets(C.tickets),{kind:'pm',cust:s.cust,svc:s.id,sys:sy.id,equip:L.length===1?L[0].id:'',
        problem:`PM ${sy.n} ${L.length} เครื่อง ตามสัญญา ${s.no} ครั้งที่ ${i}/${k}`,date:today(),due,status:'plan'}));a++}}
  save();render();toast(a?`สร้างนัด PM ${a} ครั้ง ตามรอบของแต่ละระบบ (${Object.keys(by).length} ระบบ)`:'มีนัด PM ครบแล้ว')}}

// machines a PM job covers: its own machine, else the contract's (or customer's) machines of that system
const jobEquip=t=>{const C=CO(),sy=jobSys(t);if(t.equip)return C.equip.filter(e=>e.id===t.equip);
  let L=C.equip.filter(e=>t.svc&&e.svc===t.svc);if(!L.length&&t.cust)L=C.equip.filter(e=>e.cust===t.cust);return L.filter(e=>eqSys(e)===sy)};
function pmCheckCard(t){const sy=pmSysGet(jobSys(t)),L=pmChecks(sy),ch=t.chk||{},va=t.val||{},eq=jobEquip(t);
  const bad=L.filter((_,i)=>ch[i]==='bad').length,done=L.filter((_,i)=>ch[i]).length,hs=L.some(x=>pmLine(x).std);
  return `<section class="card" id="pmChk"><h2><span>ตรวจ PM ${esc(t.no)} · ${esc(sy.n)}</span><small>ตรวจแล้ว ${done}/${L.length}${bad?` · <b style="color:var(--danger)">ผิดปกติ ${bad}</b>`:''}</small><span class="sp"></span>
    <button type="button" class="btn sm" data-a="print" data-k="job" data-id="${t.id}">พิมพ์ใบงาน</button><button type="button" class="x" data-a="sel" data-k="jobck" data-id="" title="ปิด" aria-label="ปิด">✕</button></h2>
  ${eq.length?`<p class="hint">เครื่องในงานนี้: ${eq.map(e=>esc(e.name+(e.loc?` (${e.loc})`:''))).join(', ')}</p>`:''}
  ${L.length?`<div class="tw"><table><thead><tr><th>รายการตรวจ</th>${hs?'<th>ค่ามาตรฐาน</th>':''}<th>ผล</th><th>ค่าที่วัดได้ / หมายเหตุ</th></tr></thead><tbody>${L.map((x,i)=>`<tr><td>${esc(pmLine(x).t)}</td>${hs?`<td class="pmstd">${esc(pmLine(x).std)}</td>`:''}
    <td><select data-p="co.tickets.${t.id}.chk.${i}" aria-label="ผล ${esc(pmLine(x).t)}">${[['','–'],['ok','ปกติ'],['bad','ผิดปกติ']].map(([k,l])=>`<option value="${k}"${ch[i]===k?' selected':''}>${l}</option>`).join('')}</select></td>
    <td><input data-p="co.tickets.${t.id}.val.${i}" value="${esc(va[i]||'')}" aria-label="ค่าที่วัดได้ ${esc(pmLine(x).t)}" placeholder="ค่าที่วัดได้ / หมายเหตุ" style="min-width:160px"></td></tr>`).join('')}</tbody></table></div>`
  :'<p class="empty">ระบบนี้ยังไม่มีรายการตรวจ เพิ่มได้ที่แท็บ รายการตรวจ PM ตามระบบ</p>'}
  <p class="hint">รายการตรวจของแต่ละระบบแก้ได้ที่แท็บ <b>รายการตรวจ PM ตามระบบ</b></p></section>`}
{const f=svcJob;svcJob=function(){const h=f(),t=CO().tickets.find(x=>x.id===S.sel.jobck&&x.kind==='pm');if(!t)return h;t.chk=t.chk||{};t.val=t.val||{};return h+pmCheckCard(t)}}

// the job sheet: the checklist of the job's system with what was found, instead of the air-con list for every machine
{const f=PRINT.job;PRINT.job=id=>{const h=f(id),t=CO().tickets.find(x=>x.id===id);if(!t||t.kind!=='pm')return h;
  const sy=pmSysGet(jobSys(t)),L=pmChecks(sy),ch=t.chk||{},va=t.val||{},eq=jobEquip(t),box=k=>k?'☑':'☐';
  const tb=`<h3>รายการตรวจ PM · ${esc(sy.n)}</h3>${eq.length>1?`<p>เครื่องในงานนี้: ${eq.map(e=>esc(e.name+(e.loc?` (${e.loc})`:''))).join(', ')}</p>`:''}
  <table><thead><tr><th>รายการตรวจ PM</th><th>ค่ามาตรฐาน</th><th>ปกติ</th><th>ผิดปกติ</th><th>ค่าที่วัดได้ / หมายเหตุ</th></tr></thead><tbody>${L.map((x,i)=>`<tr><td>${esc(pmLine(x).t)}</td><td>${esc(pmLine(x).std)}</td><td style="text-align:center">${box(ch[i]==='ok')}</td><td style="text-align:center">${box(ch[i]==='bad')}</td><td>${esc(va[i]||'')}</td></tr>`).join('')}</tbody></table>`;
  return h.replace(/<table><thead><tr><th>รายการตรวจ PM<\/th>[\s\S]*?<\/table>/,()=>tb)}}

// บริการ › รายการตรวจ PM ตามระบบ
function pmSysView(){const C=CO();if(!Array.isArray(C.pmSys)||PMSYS_DEF.some(d=>!C.pmSys.some(x=>x.id===d.id)))C.pmSys=pmSysAll();
  const used=id=>C.equip.filter(e=>eqSys(e)===id).length;
  return `<section class="card"><h2><span>รายการตรวจ PM ตามระบบ</span><small>เครื่องแต่ละเครื่องเลือกระบบได้ในแท็บทะเบียนเครื่อง ใบงาน PM จะดึงรายการตรวจของระบบนั้นมาให้</small></h2>
  <p class="hint">รายการเริ่มต้นร่างจากงานบำรุงรักษาทั่วไป ควรให้วิศวกรของบริษัทตรวจและปรับก่อนใช้จริง · เขียนหนึ่งรายการต่อหนึ่งบรรทัด ใส่ค่ามาตรฐานหลังเครื่องหมาย | ได้ เช่น <code>วัดแรงดันน้ำยา | 110–140 psi</code> · ทุก (เดือน) = รอบที่ใช้สร้างนัดจากสัญญา</p>
  <div class="pmsys">${C.pmSys.map(s=>{const d=PMSYS_DEF.find(x=>x.id===s.id);return `<div class="pms"><div class="row"><input data-p="co.pmSys.${s.id}.n" value="${esc(s.n)}" aria-label="ชื่อระบบ" style="flex:1;font-weight:600">
    <label class="hint" style="white-space:nowrap">ทุก <input data-p="co.pmSys.${s.id}.every" data-t="num" value="${esc(s.every)}" style="width:52px" aria-label="รอบตรวจ (เดือน) ${esc(s.n)}"> เดือน</label></div>
    <textarea data-p="co.pmSys.${s.id}.list" rows="${Math.min(10,Math.max(4,pmChecks(s).length+1))}" aria-label="รายการตรวจ ${esc(s.n)}">${esc(s.list||'')}</textarea>
    <div class="row"><small class="hint">${pmChecks(s).length} รายการ · เครื่องในทะเบียน ${used(s.id)}</small><span class="sp"></span>
    ${d?(d.list!==s.list||d.n!==s.n||+d.every!==+s.every?`<button type="button" class="btn sm" data-a="pmSysReset" data-id="${s.id}">คืนค่าเริ่มต้น</button>`:''):`<button type="button" class="x" data-a="pmSysDel" data-id="${s.id}" title="ลบระบบ" aria-label="ลบระบบ ${esc(s.n)}">✕</button>`}</div></div>`}).join('')}</div>
  <div class="row" style="margin-top:10px"><button type="button" class="btn sm pri" data-a="pmSysAdd">+ เพิ่มระบบ</button></div></section>`}
ACT.pmSysAdd=()=>{const C=CO();C.pmSys=pmSysAll();C.pmSys.splice(C.pmSys.length-1,0,{id:uid(),n:'ระบบใหม่',every:6,list:''});save();render()};
ACT.pmSysReset=b=>{const C=CO(),d=PMSYS_DEF.find(x=>x.id===b.dataset.id);if(!d)return;C.pmSys=pmSysAll().map(s=>s.id===d.id?{...d}:s);save();render();toast('คืนค่าเริ่มต้นแล้ว')};
ACT.pmSysDel=b=>{const C=CO(),id=b.dataset.id,k=C.equip.filter(e=>e.sys===id).length;if(k&&!confirm(`มีเครื่อง ${k} เครื่องใช้ระบบนี้ ลบแล้วจะกลับไปเดาระบบจากชื่อเครื่อง ลบไหม?`))return;
  C.pmSys=pmSysAll().filter(s=>s.id!==id);C.equip.forEach(e=>{if(e.sys===id)e.sys=''});save();render()};
CVIEWS.svc=()=>{const {cur,html}=subTabs('svc',[['job','งานซ่อมและนัด PM'],['con','สัญญาบำรุงรักษา'],['eqp','ทะเบียนเครื่องและประวัติ'],['chk','รายการตรวจ PM ตามระบบ']]);
  return html+({job:svcJob,con:svcCon,eqp:svcEq,chk:pmSysView}[cur])()};
{const f=svcCon;svcCon=function(){return f().replace(/<\/section>$/,`<p class="hint" style="margin-top:8px">ถ้าผูกเครื่องกับสัญญาไว้ในทะเบียนเครื่อง (หรือลูกค้ามีเครื่องในทะเบียน) ปุ่ม <b>สร้างนัด PM</b> จะสร้างนัดตามรอบของแต่ละระบบ แทนจำนวนครั้งในสัญญา</p></section>`)}}
document.head.insertAdjacentHTML('beforeend',`<style>
.pmsys{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:10px}
.pms{display:flex;flex-direction:column;gap:6px;border:1px solid var(--line);border-radius:12px;padding:10px;background:var(--surface)}
.pms textarea{width:100%;font:inherit;font-size:13px;line-height:1.55;resize:vertical}
@media(max-width:700px){#pmChk thead{display:none}#pmChk table,#pmChk tbody,#pmChk tr,#pmChk td{display:block;width:100%}
#pmChk tr{border-bottom:1px solid var(--line);padding:8px 10px}#pmChk td{border:none;padding:3px 0}#pmChk td:first-child{font-weight:600}
#pmChk .pmstd:empty{display:none}#pmChk .pmstd::before{content:'ค่ามาตรฐาน: ';color:var(--muted)}#pmChk select,#pmChk input{width:100%;min-height:40px}#pmChk input{border:1px solid var(--line);border-radius:8px;padding:6px 10px}}
</style>`);
if(typeof I18N==='object'&&I18N.en&&I18N.en.x)Object.assign(I18N.en.x,{'รายการตรวจ PM ตามระบบ':'PM checklists by system','ระบบ':'System','สัญญา PM':'PM contract',
  'ตรวจ PM':'PM check','พิมพ์ใบงาน':'Print job sheet','รายการตรวจ':'Check','ผล':'Result','ค่ามาตรฐาน':'Standard','ค่าที่วัดได้ / หมายเหตุ':'Reading / note','ปกติ':'OK','ผิดปกติ':'Fault',
  '+ เพิ่มระบบ':'+ Add system','คืนค่าเริ่มต้น':'Restore default','ระบบใหม่':'New system','อื่น ๆ':'Other',
  'แอร์ / FCU / แพ็กเกจ':'Air-con / FCU / package','ชิลเลอร์ / AHU / ระบบน้ำเย็น':'Chiller / AHU / chilled water','ตู้ไฟ MDB / DB / หม้อแปลง':'MDB / DB / transformer',
  'เครื่องกำเนิดไฟฟ้า / ATS':'Generator / ATS','ปั๊มน้ำ / สุขาภิบาล':'Water pumps / plumbing','ปั๊มและระบบดับเพลิง':'Fire pumps and sprinklers',
  'ระบบแจ้งเหตุเพลิงไหม้':'Fire alarm','พัดลมระบายอากาศ / อัดอากาศ':'Ventilation / pressurisation fans','ลิฟต์ / บันไดเลื่อน':'Lifts / escalators',
  'CCTV / LAN / สื่อสาร':'CCTV / LAN / communication','บ่อบำบัดน้ำเสีย':'Wastewater treatment'});
