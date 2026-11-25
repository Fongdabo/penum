/* ---------- 4.99.70 เบิกค่าเดินทาง: the company's travel expense claim form (แบบฟอร์มเบิกค่าเดินทาง) inside PM ----------
   Same fields and sums as the company's Excel form: one claim per person per round (1-15, 16-30/31 or the whole month),
   each trip on its own row (day, dates out/back, times, job/project, from/to, details, km, tolls).
   km × rate per km (diesel B7 or benzine 91, wear included; the rates are set in the page and copied into each claim when it
   is made, so a later price change does not alter old claims) + tolls = row total; totals at the bottom.
   The Excel's rows 17-43 multiplied km by BF13…BF39 (empty cells) instead of the rate in BF9: here every row uses the rate.
   Flow, like the four signature boxes: พนักงานผู้เบิก sends → Admin แผนก (head of the department, HR or management) →
   ผู้จัดการ (management) → ผู้ตรวจสอบ (accounting) → accounting pays. Approvals are also in the chat's รอคุณอนุมัติ.
   Paid trips charged to a project land in that project's other costs (rebuilt from the claims, like petty cash).
   Data: DB.co.trv (claims, trips inside), DB.co.trvf (rates and notes). Pages: บุคคล › เบิกค่าเดินทาง, บัญชี › เบิกค่าเดินทาง. */
const TVR=[['a','1-15'],['b','16-30, 31'],['m','1-30, 31']];
const TVF=[['d','ดีเซล B7'],['b','เบนซิน 91']];
const TVST={draft:['','ร่าง ยังไม่ส่ง'],pend:['warn','รอ Admin แผนก'],mgr:['warn','รอผู้จัดการ'],acc:['warn','รอผู้ตรวจสอบ'],ok:['warn','อนุมัติ รอจ่าย'],paid:['ok','จ่ายแล้ว'],no:['bad','ไม่อนุมัติ']};
const TVNOTE=['การเบิกส่งเดือนละ 2 ครั้ง (รอบวันที่ 1-15 และ วันที่ 1-30,31 หรือ 1-31 ) ระยะวันเวลาตามที่กำหนดไว้','การเบิกค่าเดินทางทุกครั้งขอให้ยึดหลักตามความเป็นจริง หากไม่ซื่อสัตย์ ทางบริษัทฯ ของดการจ่ายทันที',
  'ค่าเบิกกิโลเมตรขึ้นอยู่กับการเปลี่ยนแปลงค่า ขึ้น-ลง ของน้ำมัน ตามประกาศ','เอกสารที่นำมาเบิกจะต้องเป็นเดือนต่อเดือนเท่านั้น ไม่มีการเบิกย้อนหลัง'];
const TVDOW=['อา.','จ.','อ.','พ.','พฤ.','ศ.','ส.'];
const TVMON=['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน','กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'];
function tvEnsure(){const C=DB.co;C.trv=C.trv||[];C.trvf=Object.assign({d:0,b:4.49,notes:TVNOTE.join('\n')},C.trvf||{})}
{const r=render;render=function(){if(typeof DB!=='undefined'&&DB&&DB.co){tvEnsure();tvSync()}return r.apply(this,arguments)}}
PFX.push(['TV-','ใบเบิกค่าเดินทาง']);
const tvMonTh=ym=>{const [y,m]=String(ym||'').split('-').map(Number);return y&&m?`${TVMON[m-1]} ${y+543}`:''};
const tvDow=d=>okD(d)?TVDOW[pd(d).getDay()]:'';
const tvDS=d=>okD(d)?`${pd(d).getDate()}/${pd(d).getMonth()+1}/${String(pd(d).getFullYear()+543).slice(-2)}`:'';
function tvRange(e){const [y,m]=String(e.month||'').split('-').map(Number);if(!y||!m)return null;const last=new Date(y,m,0).getDate(),ym=`${y}-${String(m).padStart(2,'0')}`;
  return [`${ym}-${e.round==='b'?'16':'01'}`,`${ym}-${e.round==='a'?'15':String(last)}`]}
const tvOut=(e,t)=>{const R=tvRange(e);return !!R&&okD(t.date)&&(t.date<R[0]||t.date>R[1])};
const tvAmt=(e,t)=>Math.round(n(t.km)*n(e.rate)*100)/100;
const tvRow=(e,t)=>tvAmt(e,t)+n(t.toll);
const tvTot=e=>{const T=e.trips||[];return {km:sum(T,t=>n(t.km)),amt:sum(T,t=>tvAmt(e,t)),toll:sum(T,t=>n(t.toll)),all:sum(T,t=>tvRow(e,t))}};
const tvPj=t=>{const p=t.proj&&DB.projects[t.proj];return [p?p.name:'',t.pname].filter(Boolean).join(' · ')};
const tvDept=s=>(DEPTS().find(d=>d[0]===s.dept)||['',s.dept||''])[1];
const tvBy=(e,st)=>((e.log||[]).filter(l=>l.st===st).pop()||{});
// who may do what
const tvMineOnly=()=>{const u=me();return !!u&&!canAcc()&&!canHR()&&!isMgt()&&!isHead(u)};
const tvSees=e=>{const u=me();return !u||canAcc()||canHR()||isMgt()||e.staff===u.id||(isHead(u)&&stf(e.staff).dept===u.dept)};
const tvEdit=e=>{const u=me();return ['draft','no'].includes(e.status)&&(!u||u.id===e.staff||canAcc()||canHR())};
const tvCan=e=>{if(!e)return false;const st=e.status;return st==='pend'?headOk(e.staff):st==='mgr'?isMgt():st==='acc'||st==='ok'?canAcc():false};
const tvNext={pend:'mgr',mgr:'acc',acc:'ok',ok:'paid'};

NEW.trv=arr=>{const u=me(),C=CO(),td=today(),d=pd(td).getDate(),s=u||{},prev=arr.filter(x=>x.staff===s.id&&x.plate).pop()||{},fuel=prev.fuel||'b';
  return {no:nextNo('TV-',arr),date:td,staff:s.id||'',pos:s.role||'',emp:s.code||'',plate:prev.plate||'',round:d<=15?'a':'b',month:td.slice(0,7),fuel,rate:n(C.trvf[fuel]),trips:[],status:'draft',log:[]}};
NEW.trips=arr=>{const L=arr[arr.length-1]||{};return {date:L.date||today(),back:L.back||L.date||today(),tGo:'',tBack:'',proj:L.proj||'',pname:'',from:L.from||'',to:'',det:'',km:'',toll:''}};
// picking the person fills position, employee code and the car plate they used last; changing fuel takes the current rate
HOOK.push(p=>{const m=/^co\.trv\.([^.]+)\.(staff|fuel)$/.exec(p);if(!m)return;const e=CO().trv.find(x=>x.id===m[1]);if(!e)return;
  if(m[2]==='fuel')e.rate=n(CO().trvf[e.fuel]);
  else{const s=stf(e.staff),prev=CO().trv.filter(x=>x!==e&&x.staff===e.staff&&x.plate).pop();e.pos=s.role||'';e.emp=s.code||'';if(prev&&!e.plate)e.plate=prev.plate}});

// paid trips charged to a project are that project's other costs
function tvSync(){const L=DB.co.trv||[];Object.values(DB.projects).forEach(p=>{if(!p.costs)return;const keep=p.costs.filter(c=>!c.trv);
  L.filter(e=>e.status==='paid').forEach(e=>{const T=(e.trips||[]).filter(t=>t.proj===p.id);if(!T.length)return;
    keep.push({id:'tv-'+e.id,trv:e.id,date:e.paidAt||e.date,g:'',desc:`ค่าเดินทาง ${stf(e.staff).name||''} ${T.length} เที่ยว ${fmtq(sum(T,t=>n(t.km)))} กม.`.replace(/\s+/g,' '),amt:sum(T,t=>tvRow(e,t)),ref:e.no})});
  if(keep.length!==p.costs.length||keep.some((c,i)=>c!==p.costs[i]))p.costs=keep})}

function tvList(){const C=CO(),L=C.trv.filter(tvSees).slice().sort((a,b)=>String(b.month+b.round+b.date).localeCompare(String(a.month+a.round+a.date)));
  if(!L.length)return '<p class="hint">ยังไม่มีใบเบิกค่าเดินทาง กด “+ เบิกค่าเดินทาง” เพื่อเริ่ม</p>';
  return `<div class="tw"><table class="tv-l"><thead><tr><th>เลขที่</th><th>ผู้เบิก</th><th>รอบ</th><th class="r">เที่ยว</th><th class="r">ระยะทาง (กม.)</th><th class="r">ยอดรวม (บาท)</th><th>สถานะ</th><th></th></tr></thead><tbody>
  ${L.map(e=>{const t=tvTot(e),st=TVST[e.status]||TVST.draft,on=S.sel.trv===e.id;
    return `<tr${on?' class="tv-on"':''}><td><button type="button" class="lnk" data-a="sel" data-k="trv" data-id="${e.id}">${esc(e.no)}</button></td><td>${esc(stf(e.staff).name||'–')}</td><td>${(TVR.find(r=>r[0]===e.round)||['',''])[1]} ${esc(tvMonTh(e.month))}</td>
    <td class="r">${(e.trips||[]).length}</td><td class="r">${fmtq(t.km)}</td><td class="r">${fmt(t.all,2)}</td><td>${pl5(st[0],st[1])}</td>
    <td style="white-space:nowrap"><button type="button" class="btn sm${on?' pri':''}" data-a="sel" data-k="trv" data-id="${e.id}">${tvEdit(e)?'แก้ไข':'เปิดดู'}</button> <button type="button" class="btn sm ghost" data-a="print" data-k="trv" data-id="${e.id}">พิมพ์</button></td></tr>`}).join('')}</tbody></table></div>`}

function tvEditor(e){const C=CO(),ed=tvEdit(e),base=`co.trv.${e.id}`,u=me(),t=tvTot(e),R=tvRange(e),out=(e.trips||[]).filter(x=>tvOut(e,x)).length,st=TVST[e.status]||TVST.draft;
  const sel=(k,O,dis)=>`<select data-p="${base}.${k}"${dis?' disabled':''}>${O.map(([v,l])=>`<option value="${esc(v)}"${String(v)===String(e[k]??'')?' selected':''}>${esc(l)}</option>`).join('')}</select>`;
  const inp=(k,dis,x)=>`<input data-p="${base}.${k}" value="${esc(e[k]??'')}"${dis?' disabled':''}${x||''}>`;
  const who=tvMineOnly()?[[u.id,u.name||u.code]]:staffOpts();
  const head=`<div class="form tv-f">
    <label>ชื่อ-สกุลผู้เบิก${sel('staff',who,!ed)}</label><label>ตำแหน่ง${inp('pos',!ed)}</label><label>รหัสพนักงาน${inp('emp',!ed)}</label>
    <label>แผนก/ฝ่าย<input value="${esc(tvDept(stf(e.staff)))}" disabled></label><label>ทะเบียนรถ${inp('plate',!ed,' placeholder="เช่น 8 กง 7432"')}</label>
    <label>เบิกรอบวันที่${sel('round',TVR,!ed)}</label><label>ของเดือน<input type="month" data-p="${base}.month" value="${esc(e.month||'')}"${ed?'':' disabled'}></label>
    <label>น้ำมันที่ใช้${sel('fuel',TVF,!ed)}</label><label>เบิกกิโลเมตรละ (บาท รวมค่าสึกหรอ)<input class="r" inputmode="decimal" data-t="num" data-p="${base}.rate" value="${esc(e.rate??'')}"${ed&&(canAcc()||!u)?'':' disabled'} title="อัตราตามประกาศ เปลี่ยนได้ที่ ตั้งค่าอัตราค่าเดินทาง (ฝ่ายบัญชี)"></label></div>`;
  const pjO=()=>[['','– ไม่ระบุ / งานอื่น –'],...projects().map(p=>[p.id,p.name])];
  const cols=[{k:'i',h:'ลำดับ',t:'calc',f:x=>(e.trips.indexOf(x)+1)},{k:'dw',h:'วัน',t:'calc',f:x=>tvDow(x.date)},{k:'date',h:'วันเดินทางไป<br><small>ขาไป</small>',t:'date'},{k:'back',h:'วันเดินทาง<br><small>ขากลับ</small>',t:'date'},
    {k:'tGo',h:'เวลาติดต่องาน<br><small>ตามจริง</small>',w:70},{k:'tBack',h:'เวลากลับ<br><small>ตามจริง</small>',w:70},{k:'proj',h:'โครงการ',t:'sel',o:pjO,w:150},{k:'pname',h:'ชื่องาน (ถ้ามี)',w:150},
    {k:'from',h:'ต้นทาง',w:100},{k:'to',h:'ปลายทาง / จังหวัด',w:110},{k:'det',h:'รายละเอียดการติดต่อ<br><small>ระบุตามความจริง</small>',w:170},
    {k:'km',h:'ระยะทาง<br><small>จำนวน กม.</small>',t:'num',w:70,sum:x=>n(x.km)},{k:'amt',h:'ระยะทาง<br><small>จำนวนเงิน</small>',t:'calc',r:1,f:x=>fmt(tvAmt(e,x),2),sum:x=>tvAmt(e,x)},
    {k:'toll',h:'ค่าทางด่วน',t:'num',w:70,sum:x=>n(x.toll)},{k:'all',h:'ยอดรวม',t:'calc',r:1,f:x=>`<b>${fmt(tvRow(e,x),2)}</b>`,sum:x=>tvRow(e,x)}];
  const roCols=cols.map(c=>c.t==='calc'?c:Object.assign({},c,{t:'calc',r:c.t==='num',f:x=>c.k==='proj'?esc((DB.projects[x.proj]||{}).name||''):c.t==='date'?tvDS(x[c.k]):c.t==='num'?fmtq(x[c.k]):esc(x[c.k]||'')}));
  TABLES.trv={rows:()=>e.trips,cols:roCols};
  const tb=gtable(`${base}.trips`,e.trips,ed?cols:roCols,{del:ed,empty:ed?'ยังไม่มีเที่ยว กด “+ เพิ่มเที่ยว”':'ไม่มีเที่ยว',rowCls:x=>tvOut(e,x)?'tv-out':'',cls:'tv-t'});
  const LB={send:'ส่งเบิก',pend:'Admin แผนก',mgr:'ผู้จัดการ',acc:'ผู้ตรวจสอบ',ok:'จ่ายเงิน',no:'ไม่อนุมัติ'},L=(e.log||[]).map(l=>`${LB[l.st]||l.st}: ${esc(l.by)} ${thD(l.at)}`);
  const btn=[];
  if(ed)btn.push(`<button type="button" class="btn pri" data-a="tvSend" data-id="${e.id}">ส่งขออนุมัติ</button>`);
  if(tvCan(e)&&e.status!=='ok')btn.push(`<button type="button" class="btn pri" data-a="tvOk" data-id="${e.id}">อนุมัติ (${esc(st[1].replace(/^รอ/,'').trim())})</button><button type="button" class="btn del" data-a="tvNo" data-id="${e.id}">ไม่อนุมัติ</button>`);
  if(tvCan(e)&&e.status==='ok')btn.push(`<button type="button" class="btn pri" data-a="tvOk" data-id="${e.id}">จ่ายเงินแล้ว</button>`);
  if(e.status==='pend'&&u&&u.id===e.staff)btn.push(`<button type="button" class="btn" data-a="tvBack" data-id="${e.id}">ดึงกลับไปแก้</button>`);
  btn.push(`<button type="button" class="btn" data-a="print" data-k="trv" data-id="${e.id}">พิมพ์ / PDF</button>`);
  if(ed)btn.push(`<button type="button" class="btn ghost del" data-a="tvDel" data-id="${e.id}">ลบใบนี้</button>`);
  return `<section class="card tv-ed"><h2><span>ใบเบิกค่าเดินทาง ${esc(e.no)}</span><small>${pl5(st[0],st[1])}${R?` · รอบ ${thD(R[0])} – ${thD(R[1])}`:''}${e.why?` · เหตุผลที่ไม่อนุมัติ: ${esc(e.why)}`:''}</small></h2>
  ${head}
  ${out?`<p class="tv-warn">มี ${out} เที่ยวที่วันที่อยู่นอกรอบที่เบิก (แถวสีส้ม) การเบิกต้องเป็นเดือนต่อเดือน ไม่มีการเบิกย้อนหลัง</p>`:''}
  ${tb}
  ${ed?`<div class="row" style="margin-top:8px"><button type="button" class="btn sm pri" data-a="add" data-c="${base}.trips">+ เพิ่มเที่ยว</button><span class="hint">จำนวนเงิน = กม. × ${fmt(e.rate,2)} บาท · ยอดรวม = จำนวนเงิน + ค่าทางด่วน</span></div>`:''}
  <dl class="stats tv-s"><div><dt>ระยะทางรวม</dt><dd>${fmtq(t.km)} <small>กม.</small></dd></div><div><dt>ค่าระยะทาง</dt><dd>${fmt(t.amt,2)}</dd></div><div><dt>ค่าทางด่วน</dt><dd>${fmt(t.toll,2)}</dd></div><div><dt>ยอดเบิกรวม</dt><dd>${fmt(t.all,2)}</dd></div></dl>
  ${L.length?`<p class="hint">${L.join(' · ')}</p>`:''}
  <div class="row" style="flex-wrap:wrap;gap:8px">${btn.join('')}</div></section>`}

function tvPage(){tvEnsure();const C=CO(),acc=canAcc(),u=me(),L=C.trv.filter(tvSees);let e=C.trv.find(x=>x.id===S.sel.trv&&tvSees(x));
  const wait=L.filter(tvCan).filter(x=>x.status!=='ok').length,unpaid=L.filter(x=>x.status==='ok');
  return `${acc||isMgt()||canHR()?`<dl class="stats"><div><dt>รอคุณอนุมัติ</dt><dd${wait?' style="color:var(--warn-c)"':''}>${wait}</dd></div><div><dt>อนุมัติแล้ว รอจ่าย</dt><dd>${unpaid.length} <small>ใบ · ${fmt(sum(unpaid,x=>tvTot(x).all))} บาท</small></dd></div><div><dt>จ่ายแล้วเดือนนี้</dt><dd>${fmt(sum(L.filter(x=>x.status==='paid'&&String(x.paidAt||'').slice(0,7)===today().slice(0,7)),x=>tvTot(x).all))}</dd></div></dl>`:''}
  <section class="card"><h2><span>เบิกค่าเดินทาง</span><small>ใช้รถส่วนตัวไปติดต่องาน เบิกตามระยะทาง × อัตราต่อกิโลเมตร (รวมค่าสึกหรอ) + ค่าทางด่วน · เบิกเดือนละ 2 รอบ · ผ่าน Admin แผนก › ผู้จัดการ › ผู้ตรวจสอบ · เที่ยวที่เลือกโครงการจะลงเป็นค่าใช้จ่ายของโครงการนั้นเมื่อจ่ายเงินแล้ว</small></h2>
  <div class="row" style="margin-bottom:10px"><span class="sp"></span><button type="button" class="btn sm pri" data-a="add" data-c="co.trv" data-sel="trv">+ เบิกค่าเดินทาง</button></div>
  ${tvList()}</section>
  ${e?tvEditor(e):''}
  ${acc||!u?`<section class="card"><h2><span>ตั้งค่าอัตราค่าเดินทาง</span><small>อัตราต่อกิโลเมตรรวมค่าสึกหรอ ปรับตามราคาน้ำมันที่ประกาศ ใบที่ทำใหม่จะใช้อัตรานี้ ใบเก่าไม่เปลี่ยน</small></h2>
    <div class="form"><label>ดีเซล B7 (บาท/กม.)<input class="r" inputmode="decimal" data-t="num" data-p="co.trvf.d" value="${esc(C.trvf.d)}"></label><label>เบนซิน 91 (บาท/กม.)<input class="r" inputmode="decimal" data-t="num" data-p="co.trvf.b" value="${esc(C.trvf.b)}"></label>
    <label style="grid-column:1/-1">หมายเหตุท้ายฟอร์ม (บรรทัดละข้อ)<textarea data-p="co.trvf.notes" rows="4">${esc(C.trvf.notes)}</textarea></label></div></section>`:''}`}

const tvGet=b=>CO().trv.find(x=>x.id===b.dataset.id);
const tvLog=(e,st)=>{(e.log=e.log||[]).push({st,by:whoName(),at:today()})};
ACT.tvSend=b=>{const e=tvGet(b);if(!e||!tvEdit(e))return;const T=e.trips||[];
  if(!e.staff){toast('เลือกชื่อผู้เบิกก่อน');return}if(!T.length){toast('ยังไม่มีเที่ยว กด “+ เพิ่มเที่ยว” ก่อน');return}
  const bad=T.filter(t=>!okD(t.date)||!n(t.km)&&!n(t.toll));if(bad.length){toast(`เที่ยวที่ ${bad.map(t=>T.indexOf(t)+1).join(', ')} ยังไม่มีวันที่ หรือระยะทาง/ค่าทางด่วน`);return}
  const out=T.filter(t=>tvOut(e,t)).length;if(out&&!confirm(`มี ${out} เที่ยวที่อยู่นอกรอบที่เบิก (${tvMonTh(e.month)}) ส่งต่อไหม`))return;
  tvLog(e,'send');e.status='pend';delete e.why;e.sentAt=today();save();render();toast(`ส่ง ${e.no} ขออนุมัติแล้ว ยอด ${fmt(tvTot(e).all,2)} บาท`)};
ACT.tvOk=b=>{const e=tvGet(b);if(!e||!tvCan(e))return;const nx=tvNext[e.status];if(!nx)return;tvLog(e,e.status);e.status=nx;if(nx==='paid'){e.paidAt=today();e.payBy=whoName()}
  save();render();toast(nx==='paid'?`บันทึกจ่ายเงิน ${e.no} แล้ว`:`อนุมัติ ${e.no} แล้ว · ต่อไป${TVST[nx][1]}`)};
ACT.tvNo=b=>{const e=tvGet(b);if(!e||!tvCan(e))return;const why=prompt('เหตุผลที่ไม่อนุมัติ (ผู้เบิกจะแก้แล้วส่งใหม่ได้)','');if(why==null)return;tvLog(e,'no');e.status='no';e.why=why.trim();save();render()};
ACT.tvBack=b=>{const e=tvGet(b);if(!e||e.status!=='pend')return;e.status='draft';save();render()};
ACT.tvDel=b=>{const e=tvGet(b);if(!e||!tvEdit(e)||!confirm(`ลบใบเบิกค่าเดินทาง ${e.no}?`))return;CO().trv.splice(CO().trv.indexOf(e),1);S.sel.trv='';save();render()};

/* the printout: laid out like the company's Excel form (A4 portrait, letterhead, two-row headings, four signatures) */
PRINT.trv=id=>{const C=CO(),e=(C.trv||[]).find(x=>x.id===id);if(!e)return '';const s=stf(e.staff),t=tvTot(e),T=e.trips||[],rows=Math.max(T.length,25);
  const box=on=>`<span class="tvp-c">${on?'✓':''}</span>`,dot=(v,w)=>`<span class="tvp-d" style="min-width:${w}mm">${esc(v||'')}</span>`;
  const sg=(lbl,st)=>{const l=st==='send'?{by:s.name,at:e.sentAt}:tvBy(e,st);return `<div><p>ลงชื่อ ${dot(l.by?l.by:'',38)}</p><p>วันที่ ${dot(l.at?thD(l.at):'',36)}</p><b>${lbl}</b></div>`};
  const swoosh=up=>`<svg class="tvp-sw${up?'':' dn'}" viewBox="0 0 1000 40" preserveAspectRatio="none" aria-hidden="true">${up?'<path d="M0 0H1000V44C700 34 300 22 0 4Z" fill="#cfd3d6"/><path d="M0 0H1000V38C700 28 300 16 0 0Z" fill="#1580c4"/>':'<path d="M0 40H1000V0C700 4 300 12 0 22Z" fill="#cfd3d6"/><path d="M0 40H1000V6C700 10 300 18 0 28Z" fill="#1a6fb8"/>'}</svg>`;
  const tr=(x,i)=>x?`<tr><td>${i+1}</td><td>${tvDow(x.date)}</td><td class="n">${tvDS(x.date)}</td><td class="n">${tvDS(x.back)}</td><td class="n">${esc(x.tGo||'')}</td><td class="n">${esc(x.tBack||'')}</td><td class="l">${esc(tvPj(x))}</td><td>${esc(x.from||'')}</td><td>${esc(x.to||'')}</td><td class="l">${esc(x.det||'')}</td>
    <td class="r">${fmtq(x.km)}</td><td class="r">${fmt(tvAmt(e,x),2)}</td><td class="r">${n(x.toll)?fmt(x.toll,2):'-'}</td><td class="r">${fmt(tvRow(e,x),2)}</td></tr>`:'<tr class="e"><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr>';
  const notes=String(C.trvf.notes||'').split('\n').map(x=>x.trim()).filter(Boolean);
  return `<style>@page{size:A4 portrait}
  #print .tvp{font-size:10.5px;color:#000}
  #print .tvp-sw{display:block;width:100%;height:9mm}#print .tvp-sw.dn{height:7mm;margin-top:5mm}
  #print .tvp-lh{display:flex;align-items:center;gap:8mm;padding:2mm 4mm 3mm;border-bottom:1.2px solid #1580c4}
  #print .tvp-lh img{height:17mm;width:auto;margin:0;border:0}
  #print .tvp-lh div{flex:1;font-size:11px;line-height:1.55}#print .tvp-lh b{font-size:17px;letter-spacing:.06em}
  #print .tvp h1{text-align:center;font-size:15px;text-decoration:underline;margin:3mm 0 2mm}
  #print .tvp-no{float:right;font-size:10px;color:#444;margin-top:-6mm}
  #print .tvp-i{display:flex;flex-wrap:wrap;align-items:baseline;gap:1mm 2.5mm;margin:1.2mm 0;line-height:1.6}
  #print .tvp-d{display:inline-block;border-bottom:1px dotted #000;text-align:center;padding:0 1.5mm;font-weight:600;color:#0b3c78}
  #print .tvp-c{display:inline-grid;place-items:center;width:3.4mm;height:3.4mm;border:1px solid #000;margin-right:1mm;font-size:9px;line-height:1;vertical-align:-.4mm;font-weight:700}
  #print .tvp table{width:100%;border-collapse:collapse;table-layout:fixed;font-size:9.5px;margin-top:2mm}
  #print .tvp th,#print .tvp td{border:1px solid #000;padding:.6mm 1mm;text-align:center;vertical-align:middle;overflow:hidden;word-break:break-word}
  #print .tvp th{background:#fff;font-weight:600;line-height:1.2;font-size:8px;padding:.6mm .3mm;word-break:normal;overflow-wrap:normal}
  #print .tvp td.n{white-space:nowrap;font-size:8.5px;padding:.6mm .3mm}
  #print .tvp td.l{text-align:left}#print .tvp td.r{text-align:right;white-space:nowrap;font-size:9px;padding:.6mm .5mm}
  #print .tvp tr.e td{height:4.4mm}
  #print .tvp tr.t td{font-weight:700}
  #print .tvp-n{display:grid;grid-template-columns:auto 1fr 1fr;gap:.5mm 3mm;margin-top:2mm;font-size:9.5px;color:#c00000}
  #print .tvp-n u{font-weight:600}
  #print .tvp-sg{display:grid;grid-template-columns:repeat(4,1fr);border:1px solid #000;margin-top:3mm;page-break-inside:avoid}
  #print .tvp-sg>div{border-right:1px solid #000;padding:2mm 2mm 1.5mm;text-align:center;border-top:0}#print .tvp-sg>div:last-child{border-right:0}
  #print .tvp-sg p{margin:0 0 1.5mm;text-align:left;white-space:nowrap}#print .tvp-sg b{font-weight:500}
  #print .tvp-sg .tvp-d{min-width:0!important;width:72%}
  </style><div class="tvp" data-doc-name="${esc(['ใบเบิกค่าเดินทาง',e.no,s.name,tvMonTh(e.month)].filter(Boolean).join(' '))}">
  ${swoosh(1)}<div class="tvp-lh">${C.logo?`<img src="${C.logo}" alt="">`:''}<div><b>${esc(C.name||'')}</b><br>${esc(C.addr||'')}${C.phone?`<br><span style="color:#1580c4">โทร.</span> ${esc(C.phone)}`:''}${C.tax?` · เลขประจำตัวผู้เสียภาษี ${esc(C.tax)}`:''}</div></div>
  <h1>แบบฟอร์มเบิกค่าเดินทาง</h1><div class="tvp-no">เลขที่ ${esc(e.no)}</div>
  <div class="tvp-i">ชื่อ-สกุลผู้เบิก ${dot(s.name,42)} ตำแหน่ง ${dot(e.pos||s.role,32)} รหัสพนักงาน ${dot(e.emp||s.code,14)} แผนก/ฝ่าย ${dot(tvDept(s),30)} ทะเบียนรถ ${dot(e.plate,20)}</div>
  <div class="tvp-i">เบิกรอบวันที่ ${TVR.map(([k,l])=>`${box(e.round===k)}${l}`).join(' &nbsp;')} &nbsp;ของเดือน ${dot(tvMonTh(e.month),34)}</div>
  <div class="tvp-i">${box(e.fuel==='d')}ใช้ดีเซล B7 รวมค่าสึกหรอเบิกกิโลเมตรละ ${dot(e.fuel==='d'?fmt(e.rate,2):'',12)} บาท &nbsp; ${box(e.fuel==='b')}ใช้เบนซิน 91 รวมค่าสึกหรอเบิกกิโลเมตรละ ${dot(e.fuel==='b'?fmt(e.rate,2):'',12)} บาท</div>
  <table><colgroup><col style="width:4.2%"><col style="width:4.6%"><col style="width:7.4%"><col style="width:7.4%"><col style="width:6.6%"><col style="width:6.2%"><col style="width:13%"><col style="width:7%"><col style="width:7.2%"><col style="width:12.4%"><col style="width:5.6%"><col style="width:6.8%"><col style="width:5.4%"><col style="width:6.2%"></colgroup>
  <thead><tr><th rowspan="2">ลำดับ</th><th>ระบุวัน</th><th>วันเดินทางไป</th><th>วันเดินทาง</th><th>เวลา ติดต่องาน</th><th>เวลา กลับ</th><th rowspan="2">ชื่องาน/โครงการ</th><th colspan="2">สถานที่ติดต่อ/จังหวัด</th><th>รายละเอียดการติดต่อ</th><th colspan="2">ระยะทาง</th><th rowspan="2">ค่าทางด่วน</th><th rowspan="2">ยอดรวม</th></tr>
  <tr><th>จ-อา</th><th>ขาไป</th><th>ขากลับ</th><th>ตามจริง</th><th>ตามจริง</th><th>ต้นทาง</th><th>ปลายทาง</th><th>(ระบุตามความจริง)</th><th>จำนวน กม.</th><th>จำนวน เงิน</th></tr></thead>
  <tbody>${Array.from({length:rows},(_,i)=>tr(T[i],i)).join('')}
  <tr class="t"><td colspan="10">รวมจำนวนระยะทาง / ค่าเดินทาง${t.all?` (${bahtText(t.all)})`:''}</td><td class="r">${fmtq(t.km)}</td><td class="r">${fmt(t.amt,2)}</td><td class="r">${t.toll?fmt(t.toll,2):'-'}</td><td class="r">${fmt(t.all,2)}</td></tr></tbody></table>
  ${notes.length?`<div class="tvp-n"><u>หมายเหตุ :</u><div>${notes.filter((_,i)=>i%2===0).map(x=>' - '+esc(x)).join('<br>')}</div><div>${notes.filter((_,i)=>i%2===1).map(x=>' - '+esc(x)).join('<br>')}</div></div>`:''}
  <div class="tvp-sg">${sg('พนักงานผู้เบิก','send')}${sg('Admin แผนก','pend')}${sg('ผู้จัดการ','mgr')}${sg('ผู้ตรวจสอบ','acc')}</div>
  ${swoosh(0)}</div>`};

/* ===== wiring: บุคคล › เบิกค่าเดินทาง (everyone), บัญชี › เบิกค่าเดินทาง, menu search, หน้าแรกของฉัน, alerts, chat ===== */
{const sb=subTabs;subTabs=function(k,list){if(k==='hr'&&!list.some(x=>x[0]==='trv')){const i=list.findIndex(x=>x[0]==='pcme'||x[0]==='ot');list=i<0?[...list,['trv','เบิกค่าเดินทาง']]:[...list.slice(0,i+1),['trv','เบิกค่าเดินทาง'],...list.slice(i+1)]}
  if(k==='acct'&&!list.some(x=>x[0]==='trv')){const i=list.findIndex(x=>x[0]==='cf');list=i<0?[...list,['trv','เบิกค่าเดินทาง']]:[...list.slice(0,i),['trv','เบิกค่าเดินทาง'],...list.slice(i)]}return sb(k,list)}}
{const f=hrSubOk;hrSubOk=k=>k==='trv'||f(k)}
{const f=CVIEWS.hr;CVIEWS.hr=()=>{if(S.sub.hr!=='trv')return f();const h=hrTabs();return h+tvPage()}}
{const f=CVIEWS.acct;CVIEWS.acct=()=>{if(S.sub.acct!=='trv')return f();const {html}=subTabs('acct',[['ar','ลูกหนี้ (เงินรับ)'],['bn','ใบวางบิล'],['ap','เจ้าหนี้ (เงินจ่าย)'],['pc','เงินสดย่อย/เงินทดรอง'],['cf','กระแสเงินสด'],['vat','ภาษีซื้อ-ภาษีขาย'],['wht','ภาษีหัก ณ ที่จ่าย']]);return html+tvPage()}}
if(typeof SBSUB!=='undefined'){if(SBSUB['co.hr']&&!/\btrv=/.test(SBSUB['co.hr']))SBSUB['co.hr']+='|trv=เบิกค่าเดินทาง';if(SBSUB['co.acct']&&!/\btrv=/.test(SBSUB['co.acct']))SBSUB['co.acct']+='|trv=เบิกค่าเดินทาง'}
if(typeof SBKW!=='undefined')Object.assign(SBKW,{'co.hr.trv':'เบิกค่าเดินทาง ค่าน้ำมัน ค่ารถ กิโลเมตร ทางด่วน ทะเบียนรถ travel mileage','co.acct.trv':'เบิกค่าเดินทาง ค่าน้ำมัน กิโลเมตร ทางด่วน จ่ายค่าเดินทาง travel mileage'});
{const f=CVIEWS.mine;if(f)CVIEWS.mine=()=>f().replace(/(data-s="leave">[^<]*<\/button>)/,'$1<button type="button" class="btn" data-a="go" data-m="co" data-k="hr" data-s="trv">เบิกค่าเดินทาง</button>')}
{const f=alerts;alerts=function(){const A=f();try{const L=(CO().trv||[]).filter(e=>tvCan(e)&&e.status!=='ok');if(L.length)A.push({lv:'warn',kind:'ใบเบิกค่าเดินทางรออนุมัติ',p:null,txt:`${L.length} ใบ`,due:L[0].sentAt||L[0].date,go:{m:'co',k:'hr',s:'trv'}});
  const P2=(CO().trv||[]).filter(e=>e.status==='ok'&&canAcc());if(P2.length)A.push({lv:'warn',kind:'ค่าเดินทางอนุมัติแล้ว รอจ่าย',p:null,txt:`${P2.length} ใบ · ${fmt(sum(P2,e=>tvTot(e).all))} บาท`,due:today(),go:{m:'co',k:'acct',s:'trv'}})}catch(x){}return A}}
if(typeof CHAP==='object'){CHAP.trv=['เบิกค่าเดินทาง','รถ','#1580c4'];
  {const f=chQueue;chQueue=function(){const Q=f();if(!cmMe())return Q;(CO().trv||[]).filter(e=>tvCan(e)&&e.status!=='ok').forEach(e=>{const t=tvTot(e);
    Q.push({k:'trv',id:e.id,no:e.no,who:e.staff,amt:t.all,sub:(stf(e.staff).name||'')+' · '+TVST[e.status][1],det:[`รอบ ${(TVR.find(r=>r[0]===e.round)||['',''])[1]} ${tvMonTh(e.month)}`,`${(e.trips||[]).length} เที่ยว`,`${fmtq(t.km)} กม.`].join(' · ')})});return Q}}
  {const f=ACT.chAp;ACT.chAp=b=>{if(b.dataset.k!=='trv')return f(b);const e=CO().trv.find(x=>x.id===b.dataset.id);
    if(!e||!tvCan(e)||e.status==='ok'){toast('รายการนี้ไม่ต้องอนุมัติแล้ว');CH.rej='';chDraw();return}
    const ok=!!b.dataset.ok,wi=$('#chPop [data-chwhy]'),why=!ok&&wi?wi.value.trim().slice(0,300):'';
    if(ok){tvLog(e,e.status);e.status=tvNext[e.status]}else{tvLog(e,'no');e.status='no';e.why=why}save();render();CH.rej='';
    let m='';if(CH.apN!==false&&e.staff&&e.staff!==cmMe()){chPost(chDm(cmMe(),e.staff),`${ok?'✅ อนุมัติ':'❌ ไม่อนุมัติ'} ใบเบิกค่าเดินทาง ${e.no} · ${fmt(tvTot(e).all,2)} บาท${why?'\nเหตุผล: '+why:''}`);m=' · แจ้ง '+chFirst(e.staff)+' ทางแชทแล้ว'}
    toast((ok?'อนุมัติแล้ว':'บันทึกไม่อนุมัติแล้ว')+m);chBadge();chDraw()}}
  {const f=ACT.chApGo;ACT.chApGo=b=>{if(b.dataset.k!=='trv')return f(b);if(me()&&!allowed('co','hr')){toast('หน้านี้ไม่ได้เปิดให้ชื่อผู้ใช้งานนี้');return}
    S.sel.trv=b.dataset.id;S.mode='co';S.ctab='hr';S.sub.hr='trv';render();window.scrollTo(0,0)}}}
document.head.insertAdjacentHTML('beforeend',`<style>
.tv-f{grid-template-columns:repeat(auto-fill,minmax(180px,1fr))}
.tv-t td input,.tv-t td select{min-width:0}
.tv-t td:nth-child(-n+6){white-space:nowrap}
.tv-t tr.tv-out td{background:var(--warn-soft,#fff4e0)}
.tv-warn{margin:6px 0;padding:8px 12px;border-radius:10px;background:var(--warn-soft,#fff4e0);color:var(--ink);font-size:14px}
.tv-l tr.tv-on td{background:var(--sunk)}
.tv-l .lnk{all:unset;cursor:pointer;color:var(--accent);font-weight:600}
.tv-s{margin:12px 0}
</style>`);
