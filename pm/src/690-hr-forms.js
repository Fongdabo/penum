/* ---------- 3.20: HR and petty-cash forms linked to the system ----------
   HR › รับสมัครงาน: application → screening → interview → offer → hired (creates the staff record). Applicants can fill
     the form on their own phone (?apply=1); it comes back to HR as a link (?app=...) sent over LINE, no server needed.
   HR › ลาออก/พ้นสภาพ: notice → head → HR → management; clearance checklist, final pay estimate, severance for a
     termination, SSO notice. Approval sets the person inactive from the last working day.
   HR › ขอทำโอที: OT requests; once a company uses them, payroll pays only approved OT hours.
   HR › หนังสือรับรอง/เตือน: salary certificate, work certificate, warning letter (AI may draft the warning).
   บัญชี › เงินสดย่อย/เงินทดรอง: petty-cash vouchers and advances, clearing against receipts, fund balance and
     replenishment; spending on a project lands in that project's other costs. */
function ensure52(){const C=DB.co;['apps','quits','otReq','hrl','pc','pcRep'].forEach(k=>C[k]=C[k]||[]);C.pcf=Object.assign({float:10000,holder:'',limit:3000},C.pcf||{})}
{const r=render;render=function(){ensure52();pcSync();return r.apply(this,arguments)}}
PFX.push(['AP-','ใบสมัครงาน'],['RS-','ใบลาออก / พ้นสภาพ'],['OT-','ใบขอทำงานล่วงเวลา'],['HL-','หนังสือรับรอง / หนังสือเตือน'],['PC-','ใบเบิกเงินสดย่อย'],['AD-','ใบเบิกเงินทดรอง'],['RP-','ใบเบิกชดเชยเงินสดย่อย']);
const stf=id=>CO().staff.find(s=>s.id===id)||{};
const isMgt=()=>{const u=me();return !u||u.dept==='MGT'};
const canAcc=()=>{const u=me();return !u||['ACC','MGT'].includes(u.dept)};
const dRate=s=>s.wtype==='month'?n(s.wage)/30:n(s.wage);
const svcYears=(s,to)=>{if(!okD(s.start))return 0;return Math.max(0,(pd(to||today())-pd(s.start))/864e5/365.25)};
const svcText=(s,to)=>{if(!okD(s.start))return '–';const d=Math.max(0,Math.round((pd(to||today())-pd(s.start))/864e5)),y=Math.floor(d/365),m=Math.floor((d%365)/30.4);return (y?y+' ปี ':'')+(m?m+' เดือน':y?'':d+' วัน')};
const pl5=(c,t)=>`<span class="pill ${c}">${t}</span>`;
// head → HR → management, used by resignations
const QFLOW={pend:['warn','รอหัวหน้าฝ่าย'],hr:['warn','รอฝ่ายบุคคล'],mgt:['warn','รอผู้บริหาร'],ok:['ok','อนุมัติแล้ว'],no:['bad','ไม่อนุมัติ']};
const headOk=sid=>{const u=me(),s=stf(sid);return !u||u.dept==='MGT'||canHR()||(isHead(u)&&u.dept===s.dept&&u.id!==sid)};
const canStage=(st,sid)=>st==='pend'?headOk(sid):st==='hr'?canHR():st==='mgt'?isMgt():false;
const flowStep=o=>{const nx={pend:'hr',hr:'mgt',mgt:'ok'}[o.status];if(!nx)return false;(o.log=o.log||[]).push({st:o.status,by:whoName(),at:today()});o.status=nx;return true};
const flowBy=(o,st)=>((o.log||[]).find(l=>l.st===st)||{}).by||'';
const signer=()=>{const L=CO().staff.filter(s=>s.active!==false);return L.find(s=>s.dept==='MGT'&&isHead(s))||L.find(s=>s.dept==='MGT')||L.find(s=>s.dept==='HR'&&isHead(s))||{}};

/* ===== รับสมัครงาน ===== */
const APST=[['new','ใบสมัครใหม่','warn'],['screen','ผ่านคัดกรอง','warn'],['intv','นัดสัมภาษณ์','warn'],['offer','เสนองาน','warn'],['hired','รับเข้าทำงานแล้ว','ok'],['no','ไม่ผ่าน','bad'],['wd','ผู้สมัครถอนตัว','bad']];
const apPill=st=>{const a=APST.find(x=>x[0]===st)||APST[0];return pl5(a[2],a[1])};
NEW.apps=arr=>({no:nextNo('AP-',arr),date:today(),name:'',phone:'',email:'',birth:'',addr:'',pos:'',dept:'PRJ',expect:0,avail:'',edu:'',exp:'',skills:'',src:'',status:'new',intvAt:'',intvBy:'',score:'',note:'',wtype:'month',wage:0,start:''});
const APF=[['name','ชื่อ-สกุล','',2],['phone','โทรศัพท์'],['email','อีเมล'],['birth','วันเกิด','date'],['addr','ที่อยู่ปัจจุบัน','',2],['pos','ตำแหน่งที่สมัคร'],['expect','เงินเดือนที่ต้องการ','num'],['avail','เริ่มงานได้','date'],['src','รู้ข่าวจาก']];
const APT=[['edu','การศึกษา (วุฒิ สถาบัน ปีที่จบ)'],['exp','ประสบการณ์ทำงาน (บริษัท ตำแหน่ง ช่วงเวลา)'],['skills','ทักษะ ใบอนุญาต ใบรับรอง']];
function hrApps(){const C=CO(),L=C.apps.slice().sort((a,b)=>String(b.date).localeCompare(String(a.date))),sel=L.find(a=>a.id===S.sel.app)||L.find(a=>!['hired','no','wd'].includes(a.status))||L[0];
  const cnt=k=>L.filter(a=>a.status===k).length,p=sel?`co.apps.${sel.id}`:'';
  const f=([k,l,t,w])=>`<label${w===2?' class="w2"':''}>${l}<input${t==='date'?' type="date"':''}${t==='num'?' data-t="num" inputmode="decimal"':''} data-p="${p}.${k}" value="${esc(t==='num'?(sel[k]?n(sel[k]):''):sel[k]||'')}"></label>`;
  const nx={new:['screen','ผ่านคัดกรอง'],screen:['intv','นัดสัมภาษณ์'],intv:['offer','เสนองาน'],offer:['hire','รับเข้าทำงาน']}[sel?.status];
  return `<dl class="stats"><div><dt>ใบสมัครใหม่</dt><dd${cnt('new')?' style="color:var(--warn-c)"':''}>${cnt('new')}</dd></div><div><dt>รอสัมภาษณ์</dt><dd>${cnt('screen')+cnt('intv')}</dd></div><div><dt>เสนองาน</dt><dd>${cnt('offer')}</dd></div><div><dt>รับเข้าแล้วปีนี้</dt><dd>${L.filter(a=>a.status==='hired'&&String(a.date).slice(0,4)===today().slice(0,4)).length}</dd></div></dl>
  <section class="card"><h2><span>ใบสมัครงาน</span><small>ให้ผู้สมัครกรอกเองบนมือถือ แล้วส่งกลับมาทาง LINE หรือ HR กรอกแทน</small><span class="sp"></span>
    <button type="button" class="btn sm" data-a="apLink">ลิงก์ใบสมัครให้ผู้สมัคร</button><button type="button" class="btn sm" data-a="print" data-k="app" data-id="blank">พิมพ์ใบสมัครเปล่า</button><button type="button" class="btn sm pri" data-a="add" data-c="co.apps" data-sel="app">+ ใบสมัคร</button></h2>
  <div class="tw"><table><thead><tr><th>เลขที่</th><th>วันที่</th><th>ชื่อ-สกุล</th><th>ตำแหน่งที่สมัคร</th><th>โทร</th><th>สถานะ</th><th></th></tr></thead><tbody>
  ${L.length?L.map(a=>`<tr class="${sel&&a.id===sel.id?'sel':''}"><td>${esc(a.no)}</td><td>${thD(a.date)}</td><td>${esc(a.name||'–')}${a.web?' <small class="pill">กรอกเอง</small>':''}</td><td>${esc(a.pos)}</td><td>${esc(a.phone)}</td><td>${apPill(a.status)}</td><td><button type="button" class="btn sm" data-a="apSel" data-id="${a.id}">เปิด</button></td></tr>`).join(''):'<tr><td colspan="7" class="empty">ยังไม่มีใบสมัคร</td></tr>'}</tbody></table></div></section>
  ${sel?`<section class="card"><h2><span>${esc(sel.no)} ${esc(sel.name||'')}</span>${apPill(sel.status)}<span class="sp"></span><button type="button" class="btn sm" data-a="print" data-k="app" data-id="${sel.id}">พิมพ์ใบสมัคร</button>${sel.status==='offer'||sel.status==='hired'?`<button type="button" class="btn sm" data-a="print" data-k="offer" data-id="${sel.id}">พิมพ์หนังสือเสนองาน</button>`:''}</h2>
    <div class="form">${APF.map(f).join('')}<label>ฝ่าย<select data-p="${p}.dept">${DEPTS().map(([k,l])=>`<option value="${k}"${k===sel.dept?' selected':''}>${esc(l)}</option>`).join('')}</select></label></div>
    <div class="form" style="margin-top:10px">${APT.map(([k,l])=>`<label class="w2">${l}<textarea rows="2" data-p="${p}.${k}">${esc(sel[k]||'')}</textarea></label>`).join('')}</div>
    <h3 style="margin:14px 0 6px">สัมภาษณ์และข้อเสนอ</h3>
    <div class="form"><label>วันสัมภาษณ์<input type="date" data-p="${p}.intvAt" value="${esc(sel.intvAt||'')}"></label><label>ผู้สัมภาษณ์<input data-p="${p}.intvBy" value="${esc(sel.intvBy||'')}"></label><label>คะแนน (เต็ม 100)<input data-t="num" inputmode="decimal" data-p="${p}.score" value="${esc(sel.score||'')}"></label>
      <label>ประเภทค่าจ้าง<select data-p="${p}.wtype"><option value="month"${sel.wtype!=='day'?' selected':''}>รายเดือน</option><option value="day"${sel.wtype==='day'?' selected':''}>รายวัน</option></select></label><label>ค่าจ้างที่เสนอ (บาท)<input data-t="num" inputmode="decimal" data-p="${p}.wage" value="${sel.wage?n(sel.wage):''}"></label><label>วันเริ่มงาน<input type="date" data-p="${p}.start" value="${esc(sel.start||'')}"></label>
      <label class="w2">บันทึก<textarea rows="2" data-p="${p}.note">${esc(sel.note||'')}</textarea></label></div>
    <div class="row" style="margin-top:12px">${nx?`<button type="button" class="btn pri" data-a="apNext" data-id="${sel.id}">${nx[1]} ›</button>`:''}${!['hired','no','wd'].includes(sel.status)?`<button type="button" class="btn" data-a="apSet" data-k="no" data-id="${sel.id}">ไม่ผ่าน</button><button type="button" class="btn ghost" data-a="apSet" data-k="wd" data-id="${sel.id}">ผู้สมัครถอนตัว</button>`:''}
      ${sel.status==='hired'&&sel.staff?`<span class="hint" style="margin:0">สร้างข้อมูลพนักงาน ${esc(stf(sel.staff).code||'')} แล้ว ดูที่แท็บพนักงาน</span>`:''}${['no','wd'].includes(sel.status)?`<button type="button" class="btn ghost" data-a="apSet" data-k="new" data-id="${sel.id}">ดึงกลับมาพิจารณา</button>`:''}</div>
    <p class="hint" style="margin-top:8px">ข้อมูลผู้สมัครเป็นข้อมูลส่วนบุคคล เก็บไว้เพื่อพิจารณารับเข้าทำงานเท่านั้น ใบที่ไม่ผ่านควรลบเมื่อพ้นระยะที่บริษัทกำหนด</p></section>`:''}`}
ACT.apSel=b=>{S.sel.app=b.dataset.id;render()};
ACT.apSet=b=>{const a=CO().apps.find(x=>x.id===b.dataset.id);if(!a)return;a.status=b.dataset.k;save();render()};
ACT.apNext=b=>{const a=CO().apps.find(x=>x.id===b.dataset.id);if(!a)return;
  if(a.status!=='offer'){a.status={new:'screen',screen:'intv',intv:'offer'}[a.status]||a.status;if(a.status==='offer'&&!a.wage)a.wage=n(a.expect);save();render();return}
  if(!a.name.trim()){toast('ใส่ชื่อ-สกุลก่อน');return}if(!n(a.wage)){toast('ใส่ค่าจ้างที่เสนอก่อน');return}
  if(!confirm(`รับ ${a.name} เข้าทำงาน ตำแหน่ง ${a.pos||'–'} เริ่ม ${thD(a.start||today())}?\nระบบจะสร้างข้อมูลพนักงานให้`))return;
  const C=CO(),s={id:uid(),code:nextNo('E',C.staff).replace(/^E-?/,'E'),name:a.name.trim(),dept:a.dept||'PRJ',role:a.pos||'',phone:a.phone||'',email:a.email||'',start:a.start||today(),wtype:a.wtype||'month',wage:n(a.wage),proj:'',lic:'',licExp:'',sk:{},active:true,birth:a.birth||'',addr:a.addr||'',fromApp:a.no};
  if(C.staff.some(x=>x.code===s.code))s.code='E'+pad(C.staff.length+1);C.staff.push(s);a.status='hired';a.staff=s.id;save();render();toast(`สร้างพนักงาน ${s.code} ${s.name} แล้ว`)};
// the link applicants open on their phone, and the link they send back
const b64e=o=>btoa(unescape(encodeURIComponent(JSON.stringify(o)))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
const b64d=s=>JSON.parse(decodeURIComponent(escape(atob(s.replace(/-/g,'+').replace(/_/g,'/')))));
const appBase=()=>location.origin+location.pathname;
ACT.apLink=async()=>{const u=appBase()+'?apply=1&co='+encodeURIComponent(CO().name||'');
  dialog('ลิงก์ใบสมัครงาน',`<p class="hint" style="margin-top:0">ส่งลิงก์นี้ให้ผู้สมัคร (เช่น ทาง LINE หรือติดเป็น QR ที่หน้างาน) ผู้สมัครกรอกบนมือถือ แล้วกดส่งกลับมาหา HR ทาง LINE เมื่อ HR เปิดลิงก์ที่ได้รับบนเครื่องนี้ ใบสมัครจะเข้าระบบ</p><input readonly value="${esc(u)}" onclick="this.select()">`,
    `<button type="button" class="btn pri" data-a="apCopy" data-v="${esc(u)}">คัดลอกลิงก์</button><a class="btn" target="_blank" rel="noopener" href="https://line.me/R/share?text=${encodeURIComponent('ใบสมัครงาน '+(CO().name||'')+'\n'+u)}">ส่งทาง LINE</a>`)};
ACT.apCopy=async b=>toast(await copyText(b.dataset.v)?'คัดลอกแล้ว':'คัดลอกไม่ได้');
const APPLY=/[?&]apply=1\b/.test(location.search);
{const m=location.search.match(/[?&]app=([\w-]+)/);if(m){try{sessionStorage.setItem('pmAppIn',m[1])}catch(e){}history.replaceState(null,'',location.pathname+location.hash)}}
function apImport(){let s=null;try{s=sessionStorage.getItem('pmAppIn')}catch(e){}if(!s||document.querySelector('.lg-co')||!canHR())return;try{sessionStorage.removeItem('pmAppIn')}catch(e){}
  let o;try{o=b64d(s)}catch(e){toast('ลิงก์ใบสมัครไม่ถูกต้อง');return}const C=CO();
  if(C.apps.some(a=>a.web&&a.web===o.t)){toast('ใบสมัครนี้อยู่ในระบบแล้ว');return}
  if(!confirm(`นำใบสมัครของ ${o.name||'ผู้สมัคร'} ตำแหน่ง ${o.pos||'–'} เข้าระบบ?`))return;
  const a=Object.assign({id:uid()},NEW.apps(C.apps));APF.concat(APT).forEach(([k])=>{if(o[k]!=null)a[k]=String(o[k]).slice(0,2000)});a.expect=n(o.expect);a.web=o.t||String(Date.now());
  C.apps.push(a);S.mode='co';S.ctab='hr';S.sub.hr='rec';S.sel.app=a.id;save();render();toast('รับใบสมัครเข้าระบบแล้ว')}
function applyPage(){const co=decodeURIComponent((location.search.match(/[?&]co=([^&]*)/)||[])[1]||'');document.title='ใบสมัครงาน'+(co?' · '+co:'');
  [...document.body.children].forEach(e=>{if(!/^(STYLE|SCRIPT|DIALOG)$/.test(e.tagName)&&e.id!=='toast')e.style.display='none'});document.body.insertAdjacentHTML('afterbegin',`<main class="apply"><section class="card"><h1>ใบสมัครงาน</h1>${co?`<p class="hint" style="margin:0 0 12px">${esc(co)}</p>`:''}
  <form id="apF" class="form">${APF.map(([k,l,t,w])=>`<label${w===2?' class="w2"':''}>${l}${k==='name'||k==='phone'?' *':''}<input name="${k}"${t==='date'?' type="date"':''}${t==='num'?' inputmode="decimal"':''}${k==='phone'?' type="tel"':''}${k==='email'?' type="email"':''}${k==='name'||k==='phone'?' required':''}></label>`).join('')}
  ${APT.map(([k,l])=>`<label class="w2">${l}<textarea name="${k}" rows="3"></textarea></label>`).join('')}
  <label class="w2" style="flex-direction:row;gap:8px;align-items:flex-start"><input type="checkbox" name="ok" required style="width:auto;margin-top:4px"> ยินยอมให้บริษัทเก็บและใช้ข้อมูลนี้เพื่อพิจารณารับเข้าทำงาน</label>
  <div class="row w2"><button class="btn pri" type="submit">ส่งใบสมัคร</button></div></form><div id="apOut"></div></section></main>`);
  document.getElementById('apF').addEventListener('submit',e=>{e.preventDefault();const F=new FormData(e.target),o={t:String(Date.now())};APF.concat(APT).forEach(([k])=>{const v=String(F.get(k)||'').trim();if(v)o[k]=v});
    const u=appBase()+'?app='+b64e(o),t=`ใบสมัครงาน ${o.name||''} ตำแหน่ง ${o.pos||''}\n${u}`;
    document.getElementById('apOut').innerHTML=`<div class="box" style="margin-top:14px"><b>อีกขั้นเดียว</b><p>กดส่งลิงก์นี้ให้ฝ่ายบุคคลทาง LINE ใบสมัครจึงจะถึงบริษัท</p><div class="row"><a class="btn pri" href="https://line.me/R/share?text=${encodeURIComponent(t)}">ส่งทาง LINE</a><button type="button" class="btn" id="apCp">คัดลอกลิงก์</button></div></div>`;
    document.getElementById('apCp').onclick=async()=>{try{await navigator.clipboard.writeText(t);document.getElementById('apCp').textContent='คัดลอกแล้ว'}catch(err){}}})}
{const r=render;render=function(){if(APPLY){if(!document.getElementById('apF'))applyPage();return}const x=r.apply(this,arguments);apImport();return x}}
PRINT.app=id=>{const a=id==='blank'?{}:(CO().apps.find(x=>x.id===id)||{}),v=(k,t)=>a[k]?(t==='date'?thDL(a[k]):t==='num'?fmt(a[k]):esc(a[k])):'<span style="display:inline-block;min-width:160px;border-bottom:1px dotted #999">&nbsp;</span>';
  return cphead(`ใบสมัครงาน${a.no?' '+esc(a.no):''}`,a.date?`วันที่ ${thDL(a.date)}`:'')+`<div class="meta">${APF.map(([k,l,t])=>`<div><b>${l}:</b> ${v(k,t)}</div>`).join('')}<div><b>ฝ่าย:</b> ${a.dept?esc((DEPTS().find(d=>d[0]===a.dept)||['',a.dept])[1]):v('x')}</div></div>
  ${APT.map(([k,l])=>`<h3>${l}</h3><div class="box" style="min-height:70px;white-space:pre-line">${esc(a[k]||'')}</div>`).join('')}
  <p style="font-size:12px">ข้าพเจ้าขอรับรองว่าข้อความข้างต้นเป็นความจริง และยินยอมให้บริษัทเก็บและใช้ข้อมูลนี้เพื่อพิจารณารับเข้าทำงาน</p>
  <h3>สำหรับบริษัท</h3><div class="meta"><div><b>วันสัมภาษณ์:</b> ${v('intvAt','date')}</div><div><b>ผู้สัมภาษณ์:</b> ${v('intvBy')}</div><div><b>คะแนน:</b> ${v('score')}</div><div><b>ผล:</b> ${a.status?apPill(a.status):v('x')}</div></div>
  ${signs(['ผู้สมัคร','ผู้สัมภาษณ์','ฝ่ายบุคคล','ผู้อนุมัติ'])}`};
PRINT.offer=id=>{const a=CO().apps.find(x=>x.id===id)||{},C=CO(),sg=signer();
  return cphead(`หนังสือเสนองาน ${esc(a.no||'')}`,`วันที่ ${thDL(today())}`)+`<p>เรียน คุณ${esc(a.name||'')}</p>
  <p style="line-height:1.9">${esc(C.name||'บริษัท')} ยินดีเสนอให้ท่านเข้าทำงานในตำแหน่ง <b>${esc(a.pos||'')}</b> ฝ่าย${esc((DEPTS().find(d=>d[0]===a.dept)||['',''])[1])}
  ค่าจ้าง${a.wtype==='day'?'รายวัน วันละ':'รายเดือน เดือนละ'} <b>${fmt(a.wage)}</b> บาท (${bahtText(a.wage)}) เริ่มงานวันที่ <b>${thDL(a.start||today())}</b>
  ทดลองงาน 119 วัน สวัสดิการตามระเบียบของบริษัท หากท่านตกลงรับข้อเสนอนี้ โปรดลงนามและส่งคืนบริษัทภายใน 7 วัน</p>
  ${signs([`ผู้เสนอ ${esc(sg.name||'')}`,`ผู้รับข้อเสนอ ${esc(a.name||'')}`])}`};

/* ===== ลาออก / พ้นสภาพ ===== */
const QTYPE=[['resign','ลาออก'],['term','เลิกจ้าง'],['end','ครบสัญญาจ้าง'],['retire','เกษียณอายุ']];
NEW.quits=arr=>({no:nextNo('RS-',arr),date:today(),staff:(me()&&!canHR()?me().id:''),type:'resign',last:addD(today(),30),reason:'',status:'pend',chk:{}});
// severance by length of service (Labour Protection Act s.118), days of the last wage
const sevDays=y=>y<120/365?0:y<1?30:y<3?90:y<6?180:y<10?240:y<20?300:400;
const QCHK=[['tools','คืนเครื่องมือและอุปกรณ์ของบริษัท'],['card','คืนบัตรพนักงาน ชุดยูนิฟอร์ม กุญแจ'],['work','ส่งมอบงานและเอกสารให้ผู้รับช่วง'],['pay','จ่ายค่าจ้างงวดสุดท้ายและเงินอื่นที่ค้าง'],['sso','แจ้งประกันสังคมพ้นสภาพ (สปส.6-09) ภายในวันที่ 15 ของเดือนถัดไป'],['pvd','แจ้งกองทุนสำรองเลี้ยงชีพ (ถ้ามี)'],['acc','ปิดสิทธิ์เข้าระบบ / PIN และอีเมล'],['cert','ออกหนังสือรับรองการทำงาน']];
function quitCalc(q){const s=stf(q.staff),last=okD(q.last)?q.last:today(),y=svcYears(s,last),yr=last.slice(0,4),dr=dRate(s);
  const vacQ=n((CO().leaveQ||{}).vac),vacUsed=typeof leaveUsed==='function'?leaveUsed(s.id,'vac',yr):0,vacLeft=Math.max(0,y>=1?vacQ-vacUsed:0);
  const dIn=s.wtype==='month'?Math.min(30,Number(last.slice(8,10))):(CO().ts||[]).filter(t=>t.staff===s.id&&ym(t.date)===ym(last)).length;
  const wage=Math.round(dr*dIn*100)/100,vac=Math.round(dr*vacLeft*100)/100,sev=q.type==='term'?Math.round(dr*sevDays(y)*100)/100:0;
  const held=(CO().tools||[]).filter(t=>t.holder===s.id&&t.status!=='store');
  const short=q.type==='resign'&&okD(q.date)&&okD(q.last)&&(pd(q.last)-pd(q.date))/864e5<30;
  return {s,y,dIn,wage,vacLeft,vac,sev,sevD:q.type==='term'?sevDays(y):0,total:wage+vac+sev,held,short}}
function hrQuit(){const C=CO(),u=me(),mine=u&&!canHR()&&!isHead(u),L=C.quits.filter(q=>!mine||q.staff===u.id).slice().sort((a,b)=>String(b.date).localeCompare(String(a.date)));
  const sel=L.find(q=>q.id===S.sel.quit)||L.find(q=>!['ok','no'].includes(q.status))||L[0],p=sel?`co.quits.${sel.id}`:'',c=sel?quitCalc(sel):null;
  const sOpts=mine?[[u.id,u.name||u.code]]:[['','–'],...C.staff.filter(s=>s.active!==false||s.id===sel?.staff).map(s=>[s.id,(s.name||s.code)+(s.active===false?' (พ้นสภาพ)':'')])];
  return `<section class="card"><h2><span>ใบลาออก / พ้นสภาพ</span><small>หัวหน้าฝ่าย → ฝ่ายบุคคล → ผู้บริหาร อนุมัติแล้วพนักงานจะพ้นสภาพตั้งแต่วันทำงานวันสุดท้าย</small><span class="sp"></span><button type="button" class="btn sm pri" data-a="add" data-c="co.quits" data-sel="quit">${mine?'+ ยื่นใบลาออก':'+ ใบลาออก / พ้นสภาพ'}</button></h2>
  <div class="tw"><table><thead><tr><th>เลขที่</th><th>วันที่ยื่น</th><th>พนักงาน</th><th>ประเภท</th><th>ทำงานวันสุดท้าย</th><th>สถานะ</th><th></th></tr></thead><tbody>
  ${L.length?L.map(q=>`<tr class="${sel&&q.id===sel.id?'sel':''}"><td>${esc(q.no)}</td><td>${thD(q.date)}</td><td>${esc(stf(q.staff).name||'–')}</td><td>${(QTYPE.find(x=>x[0]===q.type)||['',''])[1]}</td><td>${thD(q.last)}</td><td>${pl5(...(QFLOW[q.status]||QFLOW.pend))}</td><td><button type="button" class="btn sm" data-a="qSel" data-id="${q.id}">เปิด</button></td></tr>`).join(''):'<tr><td colspan="7" class="empty">ยังไม่มีใบลาออก</td></tr>'}</tbody></table></div></section>
  ${sel?`<section class="card"><h2><span>${esc(sel.no)} ${esc(c.s.name||'')}</span>${pl5(...(QFLOW[sel.status]||QFLOW.pend))}<span class="sp"></span><button type="button" class="btn sm" data-a="print" data-k="rs" data-id="${sel.id}">พิมพ์ใบลาออกและใบเคลียร์งาน</button></h2>
    <div class="form"><label>พนักงาน<select data-p="${p}.staff"${sel.status==='ok'?' disabled':''}>${sOpts.map(([k,l])=>`<option value="${k}"${k===sel.staff?' selected':''}>${esc(l)}</option>`).join('')}</select></label>
      <label>ประเภท<select data-p="${p}.type">${QTYPE.map(([k,l])=>`<option value="${k}"${k===sel.type?' selected':''}>${l}</option>`).join('')}</select></label>
      <label>วันที่ยื่น / แจ้ง<input type="date" data-p="${p}.date" value="${esc(sel.date||'')}"></label><label>ทำงานวันสุดท้าย<input type="date" data-p="${p}.last" value="${esc(sel.last||'')}"></label>
      <label class="w2">เหตุผล<textarea rows="2" data-p="${p}.reason">${esc(sel.reason||'')}</textarea></label></div>
    ${c.short?`<p class="hint" style="color:var(--warn-c)">แจ้งลาออกล่วงหน้าไม่ถึง 30 วัน ตามปกติควรแจ้งล่วงหน้าอย่างน้อยหนึ่งงวดค่าจ้าง</p>`:''}
    ${canHR()?`<h3 style="margin:14px 0 6px">ประมาณการเงินที่ต้องจ่าย</h3><dl class="stats"><div><dt>อายุงาน</dt><dd style="font-size:18px">${svcText(c.s,sel.last)}</dd></div><div><dt>ค่าจ้างเดือนสุดท้าย (${c.dIn} วัน)</dt><dd>${fmt(c.wage)}</dd></div><div><dt>พักร้อนคงเหลือ ${fmtq(c.vacLeft)} วัน</dt><dd>${fmt(c.vac)}</dd></div><div><dt>ค่าชดเชย${c.sevD?` ${c.sevD} วัน`:''}</dt><dd>${fmt(c.sev)}</dd></div><div><dt>รวมประมาณ</dt><dd>${fmt(c.total)}</dd></div></dl>
    <p class="hint">ค่าชดเชยตามกฎหมายคุ้มครองแรงงานจ่ายเมื่อเลิกจ้างเท่านั้น (ลาออกเองไม่ได้รับ) ตัวเลขนี้เป็นประมาณการ ยอดจริงคิดในรอบเงินเดือน ตรวจกับผู้ทำบัญชีก่อนจ่าย</p>
    <h3 style="margin:14px 0 6px">รายการเคลียร์งานก่อนออก</h3>${c.held.length?`<p class="hint" style="color:var(--warn-c);margin:0 0 6px">ยังถือเครื่องมือ ${c.held.length} รายการ: ${c.held.map(t=>esc(t.code+' '+t.name)).join(', ')}</p>`:''}
    <div class="chk-l">${QCHK.map(([k,l])=>`<label style="display:flex;gap:8px;align-items:center"><input type="checkbox" data-t="chk" data-p="${p}.chk.${k}"${sel.chk&&sel.chk[k]?' checked':''} style="width:auto"> ${l}</label>`).join('')}</div>`:''}
    <div class="row" style="margin-top:12px">${canStage(sel.status,sel.staff)?`<button type="button" class="btn pri" data-a="qOk" data-id="${sel.id}">อนุมัติ (${QFLOW[sel.status][1].replace('รอ','')})</button><button type="button" class="btn del" data-a="qNo" data-id="${sel.id}">ไม่อนุมัติ</button>`:''}
      ${(sel.log||[]).map(l=>`<small class="hint" style="margin:0">${QFLOW[l.st][1].replace('รอ','')}: ${esc(l.by)} ${thD(l.at)}</small>`).join(' · ')}</div></section>`:''}`}
ACT.qSel=b=>{S.sel.quit=b.dataset.id;render()};
ACT.qOk=b=>{const q=CO().quits.find(x=>x.id===b.dataset.id);if(!q||!canStage(q.status,q.staff))return;if(!q.staff){toast('เลือกพนักงานก่อน');return}
  if(q.status==='mgt'&&!confirm(`อนุมัติ ${stf(q.staff).name} พ้นสภาพ ทำงานวันสุดท้าย ${thD(q.last)}?`))return;flowStep(q);
  if(q.status==='ok'){const s=stf(q.staff);s.active=false;s.end=q.last;s.endType=q.type;toast(`${s.name} พ้นสภาพตั้งแต่ ${thD(q.last)} อย่าลืมแจ้งประกันสังคม`)}save();render()};
ACT.qNo=b=>{const q=CO().quits.find(x=>x.id===b.dataset.id);if(!q||!canStage(q.status,q.staff))return;(q.log=q.log||[]).push({st:q.status,by:whoName(),at:today(),no:1});q.status='no';save();render()};
PRINT.rs=id=>{const q=CO().quits.find(x=>x.id===id);if(!q)return '';const c=quitCalc(q),s=c.s,T=(QTYPE.find(x=>x[0]===q.type)||['',''])[1];
  return cphead(`ใบ${T==='ลาออก'?'ลาออก':'แจ้งพ้นสภาพ'} ${esc(q.no)}`,`วันที่ ${thDL(q.date)}`)+`<div class="meta"><div><b>ชื่อ-สกุล:</b> ${esc(s.name||'')} (${esc(s.code||'')})</div><div><b>ตำแหน่ง:</b> ${esc(s.role||'')}</div><div><b>ฝ่าย:</b> ${esc((DEPTS().find(d=>d[0]===s.dept)||['',s.dept||''])[1])}</div><div><b>เริ่มงาน:</b> ${thDL(s.start)} · อายุงาน ${svcText(s,q.last)}</div><div><b>ประเภท:</b> ${T}</div><div><b>ทำงานวันสุดท้าย:</b> ${thDL(q.last)}</div></div>
  <h3>เหตุผล</h3><div class="box" style="min-height:60px;white-space:pre-line">${esc(q.reason||'')}</div>
  <h3>รายการเคลียร์งาน</h3><table><thead><tr><th>#</th><th>รายการ</th><th>เรียบร้อย</th></tr></thead><tbody>${QCHK.map(([k,l],i)=>`<tr><td>${i+1}</td><td>${l}${k==='tools'&&c.held.length?`<br><small>${c.held.map(t=>esc(t.code+' '+t.name)).join(', ')}</small>`:''}</td><td style="text-align:center">${q.chk&&q.chk[k]?'✓':''}</td></tr>`).join('')}</tbody></table>
  <h3>ประมาณการเงินที่ต้องจ่าย</h3><table><tbody><tr><td>ค่าจ้างเดือนสุดท้าย (${c.dIn} วัน)</td><td class="r">${fmt(c.wage)}</td></tr><tr><td>ค่าพักร้อนคงเหลือ ${fmtq(c.vacLeft)} วัน</td><td class="r">${fmt(c.vac)}</td></tr><tr><td>ค่าชดเชย${c.sevD?` ${c.sevD} วัน`:''}</td><td class="r">${fmt(c.sev)}</td></tr><tr class="tot"><td>รวม</td><td class="r">${fmt(c.total)}</td></tr></tbody></table>
  <div class="sign" style="grid-template-columns:repeat(4,1fr)">${[['พนักงาน',s.name],['หัวหน้าฝ่าย',flowBy(q,'pend')],['ฝ่ายบุคคล',flowBy(q,'hr')],['ผู้บริหารอนุมัติ',flowBy(q,'mgt')]].map(([t,nm])=>`<div>${t}<br><br>ลงชื่อ ................................<br>(${esc(nm||'................................')})<br><small>วันที่ ........./........./.........</small></div>`).join('')}</div>`};

/* ===== ขอทำโอที ===== */
const otHrs=o=>{if(!/^\d\d:\d\d$/.test(o.from||'')||!/^\d\d:\d\d$/.test(o.to||''))return n(o.hrs);const [a,b]=[o.from,o.to].map(t=>+t.slice(0,2)*60+ +t.slice(3));return Math.round(((b-a+1440)%1440)/60*100)/100};
NEW.otReq=arr=>({no:nextNo('OT-',arr),date:today(),staff:(me()||{}).id||'',proj:(typeof P!=='undefined'&&P?P.id:''),from:'17:00',to:'19:00',reason:'',status:'pend'});
const otOn=()=>CO().otRule!==false&&(CO().otReq||[]).length>0;
function hrOt(){const C=CO(),u=me(),boss=!u||canHR()||isHead(u),mine=u&&!boss,m=String(S.sel.otm||today().slice(0,7));
  const L=C.otReq.filter(o=>(!mine||o.staff===u.id)&&ym(o.date)===m).sort((a,b)=>String(b.date).localeCompare(String(a.date)));
  const cols=[{k:'no',h:'เลขที่',w:90},{k:'date',h:'วันที่ทำ',t:'date'},{k:'staff',h:'พนักงาน',t:'sel',o:()=>mine?[[u.id,u.name||u.code]]:staffOpts(),w:150},{k:'proj',h:'โครงการ',t:'sel',o:()=>[['','งานบริษัท'],...projects().map(p=>[p.id,p.name])],w:160},
    {k:'from',h:'ตั้งแต่',w:70},{k:'to',h:'ถึง',w:70},{k:'hrs',h:'ชั่วโมง',t:'calc',r:1,f:o=>fmtq(otHrs(o))},{k:'reason',h:'งานที่ทำ / เหตุผล',w:200},{k:'status',h:'สถานะ',t:'calc',f:o=>pl5(...(LSTAT[o.status]||LSTAT.pend).slice(0,2))}];
  const tsOt=s=>sum((C.ts||[]).filter(t=>t.staff===s.id&&ym(t.date)===m),t=>Math.max(0,n(t.h)-8)),okH=s=>sum(C.otReq.filter(o=>o.staff===s.id&&o.status==='ok'&&ym(o.date)===m),otHrs);
  const P0=C.staff.filter(s=>s.active!==false&&(!mine||s.id===u.id)&&(tsOt(s)||okH(s)));
  return `<section class="card"><h2><span>ใบขอทำงานล่วงเวลา (โอที) เดือน ${thMon(m)}</span><small>ขออนุมัติก่อนทำ หัวหน้าฝ่ายหรือฝ่ายบุคคลอนุมัติ</small><span class="sp"></span><button type="button" class="btn sm" data-a="otM" data-d="-1">‹</button><button type="button" class="btn sm" data-a="otM" data-d="1">›</button><button type="button" class="btn sm pri" data-a="add" data-c="co.otReq">+ ขอทำโอที</button></h2>
  ${gtable('co.otReq',L,cols,{empty:'ยังไม่มีใบขอโอทีเดือนนี้',extra:o=>(boss&&o.status==='pend'?`<button type="button" class="btn sm" data-a="otOk" data-id="${o.id}">อนุมัติ</button> <button type="button" class="btn sm del" data-a="otNo" data-id="${o.id}">ไม่อนุมัติ</button> `:'')+`<button type="button" class="btn sm ghost" data-a="print" data-k="ot" data-id="${o.id}">พิมพ์</button>`})}</section>
  ${canHR()?`<section class="card"><h2><span>โอทีที่ลงเวลา เทียบกับที่อนุมัติ</span><small>${otOn()?'รอบเงินเดือนจ่ายโอทีเฉพาะชั่วโมงที่อนุมัติแล้ว (ไม่เกินที่ลงเวลาจริงในวันนั้น)':'ยังไม่ได้ใช้ใบขอโอที รอบเงินเดือนจ่ายตามเวลาที่ลงไว้'}</small></h2>
    <div class="tw"><table><thead><tr><th>พนักงาน</th><th class="r">โอทีจากใบลงเวลา (ชม.)</th><th class="r">อนุมัติแล้ว (ชม.)</th><th class="r">จ่ายได้ (ชม.)</th></tr></thead><tbody>${P0.length?P0.map(s=>{const a=tsOt(s),b=okH(s),pay=sum((C.ts||[]).filter(t=>t.staff===s.id&&ym(t.date)===m),t=>otPayDay(s,t));return `<tr><td>${esc(s.name)}</td><td class="r">${fmtq(a)}</td><td class="r">${fmtq(b)}</td><td class="r">${fmtq(otOn()?pay:a)}${otOn()&&a>pay?` <span class="pill warn">ไม่มีใบอนุมัติ ${fmtq(a-pay)}</span>`:''}</td></tr>`}).join(''):'<tr><td colspan="4" class="empty">ไม่มีโอทีเดือนนี้</td></tr>'}</tbody></table></div>
    <label style="display:flex;gap:8px;align-items:center;margin-top:10px"><input type="checkbox" style="width:auto" data-a="otRule"${C.otRule!==false?' checked':''}> จ่ายโอทีเฉพาะที่มีใบขอโอทีอนุมัติแล้ว (เมื่อบริษัทเริ่มใช้ใบขอโอที)</label></section>`:''}`}
const thMon=m=>{const [y,mm]=m.split('-');return `${['','ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'][+mm]} ${+y+543}`};
// hours of OT payable for one timesheet day: the hours over 8, capped by approved requests for that day
const otPayDay=(s,t)=>{const over=Math.max(0,n(t.h)-8);if(!otOn())return over;return Math.min(over,sum(CO().otReq.filter(o=>o.staff===s.id&&o.date===t.date&&o.status==='ok'),otHrs))};
ACT.otM=b=>{const [y,m]=String(S.sel.otm||today().slice(0,7)).split('-').map(Number),d=new Date(y,m-1+n(b.dataset.d),1);S.sel.otm=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0');render()};
const otSet=(id,st)=>{const o=CO().otReq.find(x=>x.id===id);if(!o)return;o.status=st;o.by=whoName();o.at=today();save();render()};
ACT.otOk=b=>{otSet(b.dataset.id,'ok');toast('อนุมัติโอทีแล้ว')};ACT.otNo=b=>otSet(b.dataset.id,'no');
ACT.otRule=b=>{CO().otRule=b.checked;save();render()};
// payroll: count only payable OT by giving salCalc timesheet hours capped at 8 + approved OT
{const f=salCalc;salCalc=function(s,run){const C=CO();if(!otOn()||(run&&run.status==='locked'&&run.rows))return f(s,run);const T=C.ts;
  C.ts=T.map(t=>t.staff===s.id&&n(t.h)>8?Object.assign({},t,{h:8+otPayDay(s,t)}):t);try{return f(s,run)}finally{C.ts=T}}}
PRINT.ot=id=>{const o=CO().otReq.find(x=>x.id===id);if(!o)return '';const s=stf(o.staff),p=DB.projects[o.proj];
  return cphead(`ใบขอทำงานล่วงเวลา ${esc(o.no)}`,`วันที่ ${thDL(o.date)}`)+`<div class="meta"><div><b>ชื่อ-สกุล:</b> ${esc(s.name||'')} (${esc(s.code||'')})</div><div><b>ตำแหน่ง:</b> ${esc(s.role||'')}</div><div><b>โครงการ:</b> ${esc(p?p.name:'งานบริษัท')}</div><div><b>เวลา:</b> ${esc(o.from||'')} – ${esc(o.to||'')} น. รวม ${fmtq(otHrs(o))} ชั่วโมง</div><div><b>สถานะ:</b> ${(LSTAT[o.status]||LSTAT.pend)[1]}${o.by?' โดย '+esc(o.by):''}</div></div>
  <h3>งานที่ทำ / เหตุผล</h3><div class="box" style="min-height:60px;white-space:pre-line">${esc(o.reason||'')}</div>
  <p style="font-size:12px">ค่าล่วงเวลาวันทำงาน 1.5 เท่าของค่าจ้างต่อชั่วโมง วันหยุด 3 เท่า ตามกฎหมายคุ้มครองแรงงาน</p>${signs(['ผู้ขอ','หัวหน้าผู้อนุมัติ','ฝ่ายบุคคล'])}`};

/* ===== หนังสือรับรอง / หนังสือเตือน ===== */
const HLK=[['sal','หนังสือรับรองเงินเดือน'],['work','หนังสือรับรองการทำงาน'],['warn','หนังสือเตือน']];
NEW.hrl=arr=>({no:nextNo('HL-',arr),date:today(),kind:'sal',staff:'',purpose:'ใช้ประกอบการยื่นขอสินเชื่อกับธนาคาร',level:'1',rule:'',note:''});
function hrLetters(){const C=CO(),L=C.hrl.slice().sort((a,b)=>String(b.date).localeCompare(String(a.date)));
  const cols=[{k:'no',h:'เลขที่',w:90},{k:'date',h:'วันที่',t:'date'},{k:'kind',h:'ประเภท',t:'sel',o:HLK,w:170},{k:'staff',h:'พนักงาน',t:'sel',o:()=>[['','–'],...C.staff.map(s=>[s.id,s.name||s.code])],w:150},
    {k:'purpose',h:'วัตถุประสงค์ / เรื่อง',w:220},{k:'level',h:'เตือนครั้งที่',t:'sel',o:[['1','1'],['2','2'],['3','3 (ครั้งสุดท้าย)']],w:90}];
  return `<section class="card"><h2><span>หนังสือรับรองและหนังสือเตือน</span><small>ออกเลขที่ให้อัตโนมัติ พิมพ์บนหัวจดหมายบริษัท ลงนามโดย ${esc(signer().name||'ผู้มีอำนาจ')}</small><span class="sp"></span><button type="button" class="btn sm pri" data-a="add" data-c="co.hrl">+ ออกหนังสือ</button></h2>
  ${gtable('co.hrl',L,cols,{empty:'ยังไม่มีหนังสือ',extra:h=>`<button type="button" class="btn sm" data-a="print" data-k="hrl" data-id="${h.id}">พิมพ์</button>${h.kind==='warn'?` <button type="button" class="btn sm ghost" data-a="hlEd" data-id="${h.id}">รายละเอียดความผิด</button>`:''}`})}
  <p class="hint" style="margin-top:8px">หนังสือเตือนต้องระบุการกระทำผิด ข้อบังคับที่ฝ่าฝืน และให้พนักงานลงนามรับทราบ มีผล 1 ปีนับจากวันที่กระทำผิด (ตามกฎหมายคุ้มครองแรงงาน มาตรา 119)</p></section>`}
ACT.hlEd=b=>{const h=CO().hrl.find(x=>x.id===b.dataset.id);if(!h)return;const p=`co.hrl.${h.id}`;
  dialog(`หนังสือเตือน ${esc(h.no)}`,`<label>การกระทำที่ผิด (วัน เวลา สถานที่ รายละเอียด)<textarea rows="5" data-p="${p}.note">${esc(h.note||'')}</textarea></label><label style="margin-top:8px">ข้อบังคับ / ระเบียบที่ฝ่าฝืน<input data-p="${p}.rule" value="${esc(h.rule||'')}"></label>`,`<button type="button" class="btn pri" data-a="dlgClose">เสร็จ</button>`)};
AIDOC.hrl={n:'หนังสือเตือน',get:id=>(CO().hrl||[]).find(x=>x.id===id),d:'HR'};
PRINT.hrl=id=>{const h=CO().hrl.find(x=>x.id===id);if(!h)return '';const s=stf(h.staff),C=CO(),sg=signer(),K=(HLK.find(x=>x[0]===h.kind)||HLK[0])[1],dept=(DEPTS().find(d=>d[0]===s.dept)||['',s.dept||''])[1];
  const sign=`<div style="margin:36px 0 0 55%;text-align:center">ขอแสดงความนับถือ<br><br><br>ลงชื่อ ................................<br>(${esc(sg.name||'................................')})<br>${esc(sg.role||'ผู้มีอำนาจลงนาม')}</div>`;
  const head=cphead(`${K} ${esc(h.no)}`,`วันที่ ${thDL(h.date)}`);
  if(h.kind==='warn')return head+`<p><b>เรื่อง</b> ${esc(h.purpose||'ตักเตือนเป็นลายลักษณ์อักษร')} (ครั้งที่ ${esc(h.level||'1')})</p><p><b>เรียน</b> ${esc(s.name||'')} ตำแหน่ง ${esc(s.role||'')} ฝ่าย${esc(dept)}</p>
    <p style="line-height:1.9">ด้วยปรากฏว่าท่านได้กระทำการดังต่อไปนี้</p><div class="box" style="min-height:70px;white-space:pre-line">${esc(h.note||'')}</div>
    <p style="line-height:1.9">ซึ่งเป็นการฝ่าฝืน${esc(h.rule||'ข้อบังคับเกี่ยวกับการทำงานของบริษัท')} บริษัทจึงขอตักเตือนเป็นลายลักษณ์อักษร หากท่านกระทำผิดซ้ำในเรื่องเดียวกันภายใน 1 ปีนับจากวันที่กระทำผิด บริษัทอาจพิจารณาเลิกจ้างโดยไม่จ่ายค่าชดเชยตามกฎหมาย</p>${sign}
    <div class="sign" style="grid-template-columns:1fr 1fr;margin-top:30px"><div>พนักงานรับทราบ<br><br>ลงชื่อ ................................<br>(${esc(s.name||'')})<br><small>วันที่ ........./........./.........</small></div><div>พยาน<br><br>ลงชื่อ ................................<br>(................................)<br><small>วันที่ ........./........./.........</small></div></div>`;
  const end=s.active===false&&okD(s.end);
  return head+`<p style="margin-top:20px"><b>เรื่อง</b> ${K}</p><p><b>เรียน</b> ผู้ที่เกี่ยวข้อง</p>
  <p style="line-height:2;text-indent:2.5em">หนังสือฉบับนี้ให้ไว้เพื่อรับรองว่า <b>${esc(s.name||'')}</b>${s.idno?` เลขประจำตัวประชาชน ${esc(s.idno)}`:''} ${end?'เคยเป็น':'เป็น'}พนักงานของ${esc(C.name||'บริษัท')} ตำแหน่ง ${esc(s.role||'')} ฝ่าย${esc(dept)}
  ตั้งแต่วันที่ ${thDL(s.start)} ${end?`ถึงวันที่ ${thDL(s.end)}`:'จนถึงปัจจุบัน'}${h.kind==='sal'?` ได้รับค่าจ้าง${s.wtype==='day'?'รายวัน วันละ':'รายเดือน เดือนละ'} ${fmt(s.wage)} บาท (${bahtText(s.wage)})`:''}
  ${h.kind==='work'&&!end?'ปัจจุบันยังทำงานอยู่กับบริษัท':''}</p><p style="line-height:2;text-indent:2.5em">ออกให้ไว้${h.purpose?'เพื่อ'+esc(h.purpose.replace(/^เพื่อ/,'')):'ตามที่พนักงานร้องขอ'}</p>${sign}`};

/* ===== เงินสดย่อย / เงินทดรอง ===== */
const PCK=[['pay','เบิกเงินสดย่อย'],['adv','เงินทดรอง']];
const PCST={pend:['warn','รออนุมัติ'],ok:['warn','อนุมัติ รอจ่าย'],paid:['warn','จ่ายแล้ว'],clr:['ok','เคลียร์แล้ว'],no:['bad','ไม่อนุมัติ']};
NEW.pc=arr=>{const k=S.sel.pck||'pay';return {no:nextNo(k==='adv'?'AD-':'PC-',arr.filter(x=>x.kind===k)),date:today(),kind:k,staff:(me()||{}).id||'',proj:(typeof P!=='undefined'&&P?P.id:''),g:'',desc:'',amt:0,spent:'',rc:'',status:'pend'}};
const pcSpent=e=>e.kind==='adv'?(e.status==='clr'?n(e.spent):0):(['paid','clr'].includes(e.status)?(e.spent===''||e.spent==null?n(e.amt):n(e.spent)):0);
function pcBal(){const C=CO(),L=C.pc||[],open=L.filter(e=>!e.rep),used=sum(open,pcSpent),adv=sum(L.filter(e=>e.kind==='adv'&&e.status==='paid'),e=>n(e.amt));return {float:n(C.pcf.float),used,adv,cash:n(C.pcf.float)-used-adv}}
// spending charged to a project shows in that project's other costs (marked, rebuilt from the vouchers)
function pcSync(){if(!DB||!DB.co||!DB.co.pc)return;const L=DB.co.pc;Object.values(DB.projects).forEach(p=>{if(!p.costs)return;const keep=p.costs.filter(c=>!c.pc);
  L.filter(e=>e.proj===p.id&&pcSpent(e)>0).forEach(e=>keep.push({id:'pc-'+e.id,pc:e.id,date:e.clrAt||e.paidAt||e.date,g:e.g||'',desc:(e.kind==='adv'?'เงินทดรอง ':'เงินสดย่อย ')+(e.desc||''),amt:pcSpent(e),ref:e.no}));
  if(keep.length!==p.costs.length||keep.some((c,i)=>c!==p.costs[i]))p.costs=keep})}
function acctPc(){const C=CO(),acc=canAcc(),u=me(),mine=u&&!acc,b=pcBal(),k=S.sel.pck||'pay';
  const L=C.pc.filter(e=>e.kind===k&&(!mine||e.staff===u.id)).sort((a,b)=>String(b.date).localeCompare(String(a.date)));
  const cols=[{k:'no',h:'เลขที่',w:90},{k:'date',h:'วันที่',t:'date'},{k:'staff',h:'ผู้ขอเบิก',t:'sel',o:()=>mine?[[u.id,u.name||u.code]]:staffOpts(),w:140},{k:'proj',h:'โครงการ (ลงต้นทุน)',t:'sel',o:()=>[['','ค่าใช้จ่ายบริษัท'],...projects().map(p=>[p.id,p.name])],w:160},
    {k:'desc',h:'รายการ',w:200},{k:'amt',h:k==='adv'?'ขอเบิก':'จำนวนเงิน',t:'num',sum:e=>n(e.amt)},
    ...(k==='adv'?[{k:'spent',h:'ใช้จริง',t:'num',sum:e=>n(e.spent)},{k:'back',h:'คืน / จ่ายเพิ่ม',t:'calc',r:1,f:e=>e.status==='clr'?fmt(n(e.amt)-n(e.spent)):''}]:[]),{k:'rc',h:'เลขที่ใบเสร็จ',w:100},
    {k:'status',h:'สถานะ',t:'calc',f:e=>pl5(...(PCST[e.status]||PCST.pend))+(e.rep?' <small class="pill">'+esc((C.pcRep.find(r=>r.id===e.rep)||{}).no||'')+'</small>':'')}];
  const act=e=>[acc&&e.status==='pend'?`<button type="button" class="btn sm" data-a="pcSet" data-k="ok" data-id="${e.id}">อนุมัติ</button> <button type="button" class="btn sm del" data-a="pcSet" data-k="no" data-id="${e.id}">ไม่อนุมัติ</button>`:'',
    acc&&e.status==='ok'?`<button type="button" class="btn sm pri" data-a="pcSet" data-k="paid" data-id="${e.id}">จ่ายเงินแล้ว</button>`:'',acc&&e.kind==='adv'&&e.status==='paid'?`<button type="button" class="btn sm pri" data-a="pcClr" data-id="${e.id}">เคลียร์เงินทดรอง</button>`:'',
    `<button type="button" class="btn sm ghost" data-a="print" data-k="pc" data-id="${e.id}">พิมพ์</button>`].filter(Boolean).join(' ');
  const pend=C.pc.filter(e=>!e.rep&&pcSpent(e)>0);
  return `${acc?`<dl class="stats"><div><dt>เงินสดย่อยคงเหลือ</dt><dd${b.cash<b.float*0.2?' style="color:var(--warn-c)"':''}>${fmt(b.cash)}</dd></div><div><dt>ใช้ไปรอเบิกชดเชย</dt><dd>${fmt(b.used)}</dd></div><div><dt>เงินทดรองค้างเคลียร์</dt><dd>${fmt(b.adv)}</dd></div><div><dt>วงเงินสดย่อย</dt><dd>${fmt(b.float)}</dd></div></dl>`:''}
  <section class="card"><h2><span>${k==='adv'?'เงินทดรอง':'ใบเบิกเงินสดย่อย'}</span><small>${k==='adv'?'เบิกเงินล่วงหน้าไปจ่าย แล้วนำใบเสร็จมาเคลียร์ คืนเงินที่เหลือหรือรับส่วนที่จ่ายเกิน':'ค่าใช้จ่ายเล็กน้อยจ่ายจากเงินสดย่อย แนบใบเสร็จทุกครั้ง'} · ค่าใช้จ่ายที่เลือกโครงการจะไปอยู่ในค่าใช้จ่ายอื่นของโครงการนั้น</small></h2>
  <div class="row" style="margin-bottom:10px"><div class="mode" role="group">${PCK.map(([x,l])=>`<button type="button" data-a="pcK" data-k="${x}" aria-pressed="${x===k}">${l}</button>`).join('')}</div><span class="sp"></span><button type="button" class="btn sm pri" data-a="add" data-c="co.pc">+ ${k==='adv'?'ขอเบิกเงินทดรอง':'เบิกเงินสดย่อย'}</button></div>
  ${gtable('co.pc',L,cols,{empty:'ยังไม่มีรายการ',extra:act})}</section>
  ${acc?`<section class="card"><h2><span>ตั้งค่าและเบิกชดเชยเงินสดย่อย</span><small>เมื่อเงินสดย่อยใกล้หมด ทำใบเบิกชดเชยจากรายการที่จ่ายไปแล้ว เพื่อเติมเงินกลับเต็มวงเงิน</small><span class="sp"></span><button type="button" class="btn sm pri" data-a="pcRepGo"${pend.length?'':' disabled'}>ทำใบเบิกชดเชย (${pend.length} รายการ · ${fmt(sum(pend,pcSpent))})</button></h2>
    <div class="form"><label>วงเงินสดย่อย (บาท)<input data-t="num" data-p="co.pcf.float" value="${n(C.pcf.float)}"></label><label>ผู้ถือเงินสดย่อย<select data-p="co.pcf.holder">${staffOpts().map(([x,l])=>`<option value="${x}"${x===C.pcf.holder?' selected':''}>${esc(l)}</option>`).join('')}</select></label><label>วงเงินต่อใบไม่เกิน (บาท)<input data-t="num" data-p="co.pcf.limit" value="${n(C.pcf.limit)}"></label></div>
    ${C.pcRep.length?`<div class="tw" style="margin-top:12px"><table><thead><tr><th>เลขที่</th><th>วันที่</th><th class="r">รายการ</th><th class="r">จำนวนเงิน</th><th></th></tr></thead><tbody>${C.pcRep.slice().reverse().map(r=>`<tr><td>${esc(r.no)}</td><td>${thD(r.date)}</td><td class="r">${r.items.length}</td><td class="r">${fmt(r.amt)}</td><td><button type="button" class="btn sm" data-a="print" data-k="pcrep" data-id="${r.id}">พิมพ์</button></td></tr>`).join('')}</tbody></table></div>`:''}</section>`:''}`}
ACT.pcK=b=>{S.sel.pck=b.dataset.k;render()};
ACT.pcSet=b=>{const e=CO().pc.find(x=>x.id===b.dataset.id);if(!e||!canAcc())return;const k=b.dataset.k;
  if(k==='ok'&&n(e.amt)>n(CO().pcf.limit)&&e.kind==='pay'&&!confirm(`ยอด ${fmt(e.amt)} เกินวงเงินต่อใบ ${fmt(CO().pcf.limit)} บาท อนุมัติต่อไหม`))return;
  e.status=k;if(k==='ok'){e.okBy=whoName();e.okAt=today()}if(k==='paid'){e.paidAt=today();e.payBy=whoName()}save();render()};
ACT.pcClr=b=>{const e=CO().pc.find(x=>x.id===b.dataset.id);if(!e)return;const v=prompt(`ยอดใช้จริงตามใบเสร็จ (เบิกไป ${fmt(e.amt)} บาท)`,String(n(e.spent)||n(e.amt)));if(v==null)return;e.spent=n(numOf(v));e.status='clr';e.clrAt=today();save();render();
  const d=n(e.amt)-n(e.spent);toast(d>0?`ผู้เบิกคืนเงิน ${fmt(d)} บาท`:d<0?`บริษัทจ่ายเพิ่ม ${fmt(-d)} บาท`:'เคลียร์ครบพอดี')};
ACT.pcRepGo=()=>{const C=CO(),L=C.pc.filter(e=>!e.rep&&pcSpent(e)>0);if(!L.length)return;const r={id:uid(),no:nextNo('RP-',C.pcRep),date:today(),items:L.map(e=>e.id),amt:sum(L,pcSpent),by:whoName()};
  C.pcRep.push(r);L.forEach(e=>e.rep=r.id);save();render();toast(`ทำใบเบิกชดเชย ${r.no} ${fmt(r.amt)} บาทแล้ว`)};
PRINT.pc=id=>{const e=CO().pc.find(x=>x.id===id);if(!e)return '';const s=stf(e.staff),p=DB.projects[e.proj],adv=e.kind==='adv';
  return cphead(`${adv?'ใบเบิกเงินทดรอง':'ใบเบิกเงินสดย่อย'} ${esc(e.no)}`,`วันที่ ${thDL(e.date)}`)+`<div class="meta"><div><b>ผู้ขอเบิก:</b> ${esc(s.name||'')}</div><div><b>ฝ่าย:</b> ${esc((DEPTS().find(d=>d[0]===s.dept)||['',s.dept||''])[1])}</div><div><b>ลงต้นทุน:</b> ${esc(p?p.name:'ค่าใช้จ่ายบริษัท')}</div><div><b>เลขที่ใบเสร็จ:</b> ${esc(e.rc||'')}</div></div>
  <table><thead><tr><th>รายการ</th><th class="r">จำนวนเงิน</th></tr></thead><tbody><tr><td style="height:60px;vertical-align:top">${esc(e.desc||'')}</td><td class="r" style="vertical-align:top">${fmt(e.amt)}</td></tr><tr class="tot"><td>(${bahtText(e.amt)})</td><td class="r">${fmt(e.amt)}</td></tr></tbody></table>
  ${adv?`<h3>เคลียร์เงินทดรอง</h3><table><tbody><tr><td>ใช้จริงตามใบเสร็จ</td><td class="r">${e.status==='clr'?fmt(e.spent):''}</td></tr><tr><td>คืนบริษัท / บริษัทจ่ายเพิ่ม</td><td class="r">${e.status==='clr'?fmt(n(e.amt)-n(e.spent)):''}</td></tr><tr><td>วันที่เคลียร์</td><td class="r">${e.clrAt?thD(e.clrAt):''}</td></tr></tbody></table>`:''}
  ${signs([`ผู้ขอเบิก ${esc(s.name||'')}`,`ผู้อนุมัติ ${esc(e.okBy||'')}`,`ผู้จ่ายเงิน ${esc(e.payBy||'')}`,'ผู้รับเงิน'])}`};
PRINT.pcrep=id=>{const C=CO(),r=C.pcRep.find(x=>x.id===id);if(!r)return '';const L=r.items.map(i=>C.pc.find(e=>e.id===i)).filter(Boolean);
  return cphead(`ใบเบิกชดเชยเงินสดย่อย ${esc(r.no)}`,`วันที่ ${thDL(r.date)}<br>ผู้ถือเงินสดย่อย ${esc(stf(C.pcf.holder).name||'')}`)+`<table><thead><tr><th>#</th><th>เลขที่</th><th>วันที่</th><th>รายการ</th><th>โครงการ</th><th>ใบเสร็จ</th><th class="r">จำนวนเงิน</th></tr></thead><tbody>
  ${L.map((e,i)=>`<tr><td>${i+1}</td><td>${esc(e.no)}</td><td>${thD(e.date)}</td><td>${esc(e.desc||'')}</td><td>${esc((DB.projects[e.proj]||{}).name||'บริษัท')}</td><td>${esc(e.rc||'')}</td><td class="r">${fmt(pcSpent(e))}</td></tr>`).join('')}
  <tr class="tot"><td colspan="6">รวม (${bahtText(r.amt)})</td><td class="r">${fmt(r.amt)}</td></tr></tbody></table>${signs(['ผู้ถือเงินสดย่อย','ผู้ตรวจสอบ','ผู้อนุมัติ'])}`};

/* ===== wiring: tabs, sidebar, alerts ===== */
{const sb=subTabs;subTabs=function(k,list){if(k==='hr'){const has=x=>list.some(y=>y[0]===x);
    if(hrFull()){const add=[['rec','รับสมัครงาน'],['quit','ลาออก/พ้นสภาพ'],['ot','ขอทำโอที'],['hrl','หนังสือรับรอง/เตือน']].filter(x=>!has(x[0])),i=list.findIndex(x=>x[0]==='leave');list=[...list.slice(0,i+1),...add,...list.slice(i+1)]}
    else{['ot','quit','pcme'].forEach((x,j)=>{if(!has(x))list=[...list,[x,['ขอทำโอที','ลาออก','เบิกเงินสดย่อย'][j]]]})}}
  if(k==='acct'&&!list.some(x=>x[0]==='pc')){const i=list.findIndex(x=>x[0]==='ap');list=i<0?[...list,['pc','เงินสดย่อย/เงินทดรอง']]:[...list.slice(0,i+1),['pc','เงินสดย่อย/เงินทดรอง'],...list.slice(i+1)]}return sb(k,list)}}
{const f=CVIEWS.hr;CVIEWS.hr=()=>{const c=S.sub.hr,V={rec:hrFull()?hrApps:null,quit:hrQuit,ot:hrOt,hrl:hrFull()?hrLetters:null,pcme:acctPc}[c];if(V)return hrTabs()+V();return f()}}
{const f=CVIEWS.acct;CVIEWS.acct=()=>{if(S.sub.acct!=='pc')return f();const {html}=subTabs('acct',[['ar','ลูกหนี้ (เงินรับ)'],['bn','ใบวางบิล'],['ap','เจ้าหนี้ (เงินจ่าย)'],['cf','กระแสเงินสด'],['vat','ภาษีซื้อ-ภาษีขาย'],['wht','ภาษีหัก ณ ที่จ่าย']]);return html+acctPc()}}
if(typeof SBSUB!=='undefined'){if(SBSUB['co.hr']&&!/\brec=/.test(SBSUB['co.hr']))SBSUB['co.hr']=SBSUB['co.hr'].replace(/(leave=[^|]*)/,'$1|rec=รับสมัครงาน|quit=ลาออก/พ้นสภาพ|ot=ขอทำโอที|hrl=หนังสือรับรอง/เตือน');
  if(SBSUB['co.acct']&&!/\bpc=/.test(SBSUB['co.acct']))SBSUB['co.acct']=SBSUB['co.acct'].replace(/(ap=[^|]*)/,'$1|pc=เงินสดย่อย/เงินทดรอง')}
Object.assign(SBKW,{'co.hr.rec':'สมัครงาน ใบสมัคร ผู้สมัคร สัมภาษณ์ รับพนักงาน recruit applicant','co.hr.quit':'ลาออก พ้นสภาพ เลิกจ้าง ค่าชดเชย เคลียร์งาน สปส.6-09 resign',
  'co.hr.ot':'โอที ล่วงเวลา ทำงานล่วงเวลา overtime','co.hr.hrl':'หนังสือรับรองเงินเดือน รับรองการทำงาน หนังสือเตือน ใบเตือน certificate warning','co.acct.pc':'เงินสดย่อย เงินทดรอง เคลียร์เงิน ใบเสร็จ petty cash advance เบิกชดเชย'});
{const f=alerts;alerts=function(){const A=f(),C=CO(),td=today(),u=me();
  if(canHR()){const k=(C.apps||[]).filter(a=>a.status==='new').length;if(k)A.push({lv:'warn',kind:'ใบสมัครงานใหม่',p:null,txt:`${k} ใบ`,due:td,go:{m:'co',k:'hr',s:'rec'}})}
  (C.quits||[]).filter(q=>['pend','hr','mgt'].includes(q.status)&&canStage(q.status,q.staff)).forEach(q=>A.push({lv:'warn',kind:'ใบลาออกรออนุมัติ',p:null,txt:`${q.no} ${stf(q.staff).name||''}`,due:q.date,go:{m:'co',k:'hr',s:'quit'}}));
  const ot=(C.otReq||[]).filter(o=>o.status==='pend'&&(!u||canHR()||isHead(u)));if(ot.length)A.push({lv:'warn',kind:'ใบขอโอทีรออนุมัติ',p:null,txt:`${ot.length} ใบ`,due:ot[0].date,go:{m:'co',k:'hr',s:'ot'}});
  if(canAcc()&&C.pc){const p=C.pc.filter(e=>e.status==='pend');if(p.length)A.push({lv:'warn',kind:'ใบเบิกเงินสดย่อยรออนุมัติ',p:null,txt:`${p.length} ใบ`,due:p[0].date,go:{m:'co',k:'acct',s:'pc'}});
    C.pc.filter(e=>e.kind==='adv'&&e.status==='paid'&&okD(e.paidAt)&&e.paidAt<=addD(td,-7)).forEach(e=>A.push({lv:'bad',kind:'เงินทดรองค้างเคลียร์',p:DB.projects[e.proj]||null,txt:`${e.no} ${stf(e.staff).name||''} ${fmt(e.amt)} บาท`,due:addD(e.paidAt,7),go:{m:'co',k:'acct',s:'pc'}}));
    const b=pcBal();if(n(C.pcf.float)&&b.cash<n(C.pcf.float)*0.2)A.push({lv:'warn',kind:'เงินสดย่อยใกล้หมด',p:null,txt:`เหลือ ${fmt(b.cash)} บาท ทำใบเบิกชดเชย`,due:td,go:{m:'co',k:'acct',s:'pc'}})}
  return A}}
document.head.insertAdjacentHTML('beforeend',`<style>.apply{max-width:720px;margin:0 auto;padding:16px}.apply h1{margin:0 0 4px}.chk-l{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:6px 16px}</style>`);
