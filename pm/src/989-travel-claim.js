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
  const add=`<button type="button" class="tv-cd tv-new" data-a="add" data-c="co.trv" data-sel="trv"><span class="tv-plus">+</span><b>เบิกค่าเดินทาง</b><small>ทำใบใหม่ของรอบนี้</small></button>`;
  return `<div class="tv-cards">${add}${L.map(e=>{const t=tvTot(e),st=TVST[e.status]||TVST.draft,on=S.sel.trv===e.id,s=stf(e.staff);
    return `<button type="button" class="tv-cd${on?' on':''}" data-a="sel" data-k="trv" data-id="${e.id}"><span class="tv-cd-t"><b>${esc(e.no)}</b>${pl5(st[0],st[1])}</span>
    <span class="tv-cd-n">${esc(s.name||'ยังไม่เลือกผู้เบิก')}</span><small>รอบ ${(TVR.find(r=>r[0]===e.round)||['',''])[1]} · ${esc(tvMonTh(e.month))}</small>
    <span class="tv-cd-a">${fmt(t.all,2)} <small>บาท</small></span><small>${(e.trips||[]).length} เที่ยว · ${fmtq(t.km)} กม.</small></button>`}).join('')}</div>`}

const TVSTEP=[['send','ส่งเบิก'],['pend','Admin แผนก'],['mgr','ผู้จัดการ'],['acc','ผู้ตรวจสอบ'],['ok','จ่ายเงิน']];
function tvSteps(e){const at={draft:0,no:0,pend:1,mgr:2,acc:3,ok:4,paid:5}[e.status]??0;
  return `<ol class="tv-st">${TVSTEP.map(([k,l],i)=>{const done=i<at,cur=i===at&&e.status!=='no',L=done?(k==='send'?{by:stf(e.staff).name,at:e.sentAt}:tvBy(e,k)):{};
    return `<li class="${done?'ok':cur?'cur':''}"><i>${done?'✓':i+1}</i><span><b>${l}</b><small>${done?esc(L.by||'')+(L.at?' · '+thD(L.at):''):cur?(i?'กำลังรอ':'ยังไม่ได้ส่ง'):'&nbsp;'}</small></span></li>`}).join('')}</ol>`}

function tvEditor(e){const ed=tvEdit(e),base=`co.trv.${e.id}`,u=me(),t=tvTot(e),R=tvRange(e),T=e.trips||[],out=T.filter(x=>tvOut(e,x)).length,st=TVST[e.status]||TVST.draft,s=stf(e.staff);
  const fld=(lbl,html,cls)=>`<label class="tv-fl${cls?' '+cls:''}"><span>${lbl}</span>${html}</label>`;
  const txt=(k,ph,o)=>ed?`<input data-p="${o||base}.${k}" value="${esc((o?getPath(o+'.'+k):e[k])??'')}"${ph?` placeholder="${esc(ph)}"`:''}>`:`<div class="tv-ro">${esc((o?getPath(o+'.'+k):e[k])||'–')}</div>`;
  const seg=(k,O)=>`<div class="tv-seg" role="group">${O.map(([v,l])=>`<button type="button"${ed?` data-a="tvSet" data-id="${e.id}" data-k="${k}" data-v="${v}"`:' disabled'} aria-pressed="${String(e[k])===v}">${l}</button>`).join('')}</div>`;
  const who=tvMineOnly()?[[u.id,u.name||u.code]]:staffOpts();
  const staffSel=ed?`<select data-p="${base}.staff">${who.map(([v,l])=>`<option value="${esc(v)}"${v===e.staff?' selected':''}>${esc(l)}</option>`).join('')}</select>`:`<div class="tv-ro">${esc(s.name||'–')}</div>`;
  const rateEd=ed&&(canAcc()||!u);
  const info=`<div class="tv-pn"><div class="tv-pnh"><span class="tv-ic">👤</span><b>ผู้เบิก</b></div><div class="tv-g2">
      ${fld('ชื่อ-สกุลผู้เบิก',staffSel,'w')}${fld('ตำแหน่ง',txt('pos'))}${fld('รหัสพนักงาน',txt('emp'))}${fld('แผนก/ฝ่าย',`<div class="tv-ro">${esc(tvDept(s)||'–')}</div>`)}${fld('ทะเบียนรถ',txt('plate','เช่น 8 กง 7432'))}</div></div>
    <div class="tv-pn"><div class="tv-pnh"><span class="tv-ic">🗓</span><b>รอบที่เบิกและอัตรา</b></div><div class="tv-g2">
      ${fld('เบิกรอบวันที่',seg('round',TVR),'w')}${fld('ของเดือน',ed?`<input type="month" data-p="${base}.month" value="${esc(e.month||'')}">`:`<div class="tv-ro">${esc(tvMonTh(e.month))}</div>`)}
      ${fld('ช่วงวันที่',`<div class="tv-ro">${R?`${thD(R[0])} – ${thD(R[1])}`:'–'}</div>`)}
      ${fld('น้ำมันที่ใช้',seg('fuel',TVF))}${fld('เบิกกิโลเมตรละ (รวมค่าสึกหรอ)',rateEd?`<div class="tv-u"><input class="r" inputmode="decimal" data-t="num" data-p="${base}.rate" value="${esc(e.rate??'')}"><em>บาท/กม.</em></div>`:`<div class="tv-ro">${fmt(e.rate,2)} บาท/กม.</div>`)}</div></div>`;
  const pjO=[['','– ไม่ระบุ / งานอื่น –'],...projects().map(p=>[p.id,p.name])];
  const trip=(x,i)=>{const o=`${base}.trips.${x.id}`,bad=tvOut(e,x),v=k=>esc(x[k]??'');
    const I=(k,ph,ty)=>ed?`<input${ty?` type="${ty}"`:''} data-p="${o}.${k}" value="${v(k)}"${ph?` placeholder="${esc(ph)}"`:''}>`:`<div class="tv-ro">${ty==='date'?tvDS(x[k])||'–':v(k)||'–'}</div>`;
    const N=(k)=>ed?`<input class="r" inputmode="decimal" data-t="num" data-p="${o}.${k}" value="${x[k]===''||x[k]==null?'':v(k)}" placeholder="0">`:`<div class="tv-ro r">${fmtq(x[k])}</div>`;
    const pj=ed?`<select data-p="${o}.proj">${pjO.map(([a,l])=>`<option value="${esc(a)}"${a===(x.proj||'')?' selected':''}>${esc(l)}</option>`).join('')}</select>`:`<div class="tv-ro">${esc((DB.projects[x.proj]||{}).name||'–')}</div>`;
    return `<div class="tv-trip${bad?' bad':''}"><div class="tv-tn"><b>${i+1}</b><span>${tvDow(x.date)||'–'}</span></div>
      <div class="tv-tb"><div class="tv-g4">${fld('วันเดินทางไป',I('date','','date'))}${fld('วันเดินทางกลับ',I('back','','date'))}${fld('เวลาติดต่องาน',I('tGo','09.00 น.'))}${fld('เวลากลับ',I('tBack','17.00 น.'))}</div>
      <div class="tv-g5">${fld('โครงการ',pj)}${fld('ชื่องาน (ถ้ามี)',I('pname','เช่น ลูกค้าใหม่'))}<div class="tv-g3">${fld('ต้นทาง',I('from','สำนักงาน'))}<span class="tv-ar" aria-hidden="true">→</span>${fld('ปลายทาง / จังหวัด',I('to','สถานที่ จังหวัด'))}</div></div>
      ${fld('รายละเอียดการติดต่อ (ระบุตามความจริง)',I('det','ไปทำอะไร พบใคร'),'w')}${bad?'<p class="tv-bad">วันที่อยู่นอกรอบที่เบิก</p>':''}</div>
      <div class="tv-tm">${fld('ระยะทาง (กม.)',N('km'))}${fld('ค่าทางด่วน',N('toll'))}<div class="tv-calc"><small>${fmtq(x.km)} กม. × ${fmt(e.rate,2)} = ${fmt(tvAmt(e,x),2)}</small><b>${fmt(tvRow(e,x),2)}</b><small>บาท</small></div></div>
      ${ed?`<button type="button" class="tv-x" data-a="delRow" data-c="${base}.trips" data-id="${x.id}" title="ลบเที่ยวนี้" aria-label="ลบเที่ยวที่ ${i+1}">✕</button>`:''}</div>`};
  const btn=[];
  if(ed)btn.push(`<button type="button" class="btn pri" data-a="tvSend" data-id="${e.id}">ส่งขออนุมัติ ›</button>`);
  if(tvCan(e)&&e.status!=='ok')btn.push(`<button type="button" class="btn pri" data-a="tvOk" data-id="${e.id}">✓ อนุมัติ (${esc(st[1].replace(/^รอ/,'').trim())})</button><button type="button" class="btn del" data-a="tvNo" data-id="${e.id}">ไม่อนุมัติ</button>`);
  if(tvCan(e)&&e.status==='ok')btn.push(`<button type="button" class="btn pri" data-a="tvOk" data-id="${e.id}">฿ จ่ายเงินแล้ว</button>`);
  if(e.status==='pend'&&u&&u.id===e.staff)btn.push(`<button type="button" class="btn" data-a="tvBack" data-id="${e.id}">ดึงกลับไปแก้</button>`);
  btn.push(`<button type="button" class="btn" data-a="print" data-k="trv" data-id="${e.id}">🖨 พิมพ์ / PDF</button>`);
  if(ed)btn.push(`<span class="sp"></span><button type="button" class="btn ghost del" data-a="tvDel" data-id="${e.id}">ลบใบนี้</button>`);
  return `<section class="card tv-doc">
  <header class="tv-hd"><div><small>แบบฟอร์มเบิกค่าเดินทาง</small><h2>${esc(e.no)} ${pl5(st[0],st[1])}</h2><p>${esc(s.name||'ยังไม่เลือกผู้เบิก')} · รอบ ${(TVR.find(r=>r[0]===e.round)||['',''])[1]} ${esc(tvMonTh(e.month))}</p></div>
    <div class="tv-big"><small>ยอดเบิกรวม</small><b>${fmt(t.all,2)}</b><span>บาท</span></div><button type="button" class="tv-cl" data-a="sel" data-k="trv" data-id="" title="ปิด" aria-label="ปิดใบนี้">✕</button></header>
  ${tvSteps(e)}
  ${e.status==='no'&&e.why?`<p class="tv-warn">❌ ไม่อนุมัติ: ${esc(e.why)} · แก้แล้วกดส่งขออนุมัติใหม่ได้</p>`:''}
  <div class="tv-g2 tv-top">${info}</div>
  <div class="tv-sh"><b>รายการเดินทาง</b><small>${T.length} เที่ยว</small><span class="sp"></span><small class="tv-fx">ยอดรวม = กม. × ${fmt(e.rate,2)} บาท + ค่าทางด่วน</small></div>
  ${out?`<p class="tv-warn">⚠ มี ${out} เที่ยวที่วันที่อยู่นอกรอบที่เบิก การเบิกต้องเป็นเดือนต่อเดือน ไม่มีการเบิกย้อนหลัง</p>`:''}
  <div class="tv-trips">${T.map(trip).join('')||(ed?'':'<p class="hint">ไม่มีเที่ยว</p>')}</div>
  ${ed?`<button type="button" class="tv-add" data-a="add" data-c="${base}.trips">+ เพิ่มเที่ยวเดินทาง</button>`:''}
  <div class="tv-sum"><div><small>ระยะทางรวม</small><b>${fmtq(t.km)}</b><span>กม.</span></div><div><small>ค่าระยะทาง</small><b>${fmt(t.amt,2)}</b><span>บาท</span></div><div><small>ค่าทางด่วน</small><b>${fmt(t.toll,2)}</b><span>บาท</span></div><div class="tot"><small>ยอดเบิกรวม</small><b>${fmt(t.all,2)}</b><span>${t.all?esc(bahtText(t.all)):'บาท'}</span></div></div>
  <div class="tv-act">${btn.join('')}</div></section>`}

function tvPage(){tvEnsure();const C=CO(),acc=canAcc(),u=me(),L=C.trv.filter(tvSees);let e=C.trv.find(x=>x.id===S.sel.trv&&tvSees(x));
  const wait=L.filter(tvCan).filter(x=>x.status!=='ok').length,unpaid=L.filter(x=>x.status==='ok');
  return `${acc||isMgt()||canHR()?`<dl class="stats"><div><dt>รอคุณอนุมัติ</dt><dd${wait?' style="color:var(--warn-c)"':''}>${wait} <small>ใบ</small></dd></div><div><dt>อนุมัติแล้ว รอจ่าย</dt><dd>${fmt(sum(unpaid,x=>tvTot(x).all))} <small>บาท · ${unpaid.length} ใบ</small></dd></div><div><dt>จ่ายแล้วเดือนนี้</dt><dd>${fmt(sum(L.filter(x=>x.status==='paid'&&String(x.paidAt||'').slice(0,7)===today().slice(0,7)),x=>tvTot(x).all))} <small>บาท</small></dd></div></dl>`:''}
  ${e?tvEditor(e):''}
  <section class="card"><h2><span>${tvMineOnly()?'ใบเบิกค่าเดินทางของฉัน':'ใบเบิกค่าเดินทาง'}</span><small>ใช้รถส่วนตัวไปติดต่องาน เบิกตามระยะทาง × อัตราต่อกิโลเมตร + ค่าทางด่วน · เบิกเดือนละ 2 รอบ · ผ่าน Admin แผนก › ผู้จัดการ › ผู้ตรวจสอบ</small></h2>
  ${tvList()}</section>
  ${acc||!u?`<section class="card"><h2><span>ตั้งค่าอัตราค่าเดินทาง</span><small>อัตราต่อกิโลเมตรรวมค่าสึกหรอ ปรับตามราคาน้ำมันที่ประกาศ ใบที่ทำใหม่จะใช้อัตรานี้ ใบเก่าไม่เปลี่ยน</small></h2>
    <div class="tv-g2" style="max-width:520px"><label class="tv-fl"><span>⛽ ดีเซล B7</span><div class="tv-u"><input class="r" inputmode="decimal" data-t="num" data-p="co.trvf.d" value="${esc(C.trvf.d)}"><em>บาท/กม.</em></div></label><label class="tv-fl"><span>⛽ เบนซิน 91</span><div class="tv-u"><input class="r" inputmode="decimal" data-t="num" data-p="co.trvf.b" value="${esc(C.trvf.b)}"><em>บาท/กม.</em></div></label></div>
    <label class="tv-fl" style="margin-top:10px"><span>หมายเหตุท้ายฟอร์ม (บรรทัดละข้อ)</span><textarea data-p="co.trvf.notes" rows="4">${esc(C.trvf.notes)}</textarea></label></section>`:''}`}
ACT.tvSet=b=>{const e=CO().trv.find(x=>x.id===b.dataset.id);if(!e||!tvEdit(e))return;const k=b.dataset.k;e[k]=b.dataset.v;HOOK.forEach(f=>f(`co.trv.${e.id}.${k}`,e[k]));save();render()};
// a new claim opens at the top of the page
{const f=ACT.add;ACT.add=b=>{const r=f(b);if(b&&b.dataset&&b.dataset.c==='co.trv')setTimeout(()=>{const d=document.querySelector('.tv-doc');if(d)d.scrollIntoView({behavior:'smooth',block:'start'})},30);return r}}
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
.tv-cards{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:12px}
.tv-cd{all:unset;box-sizing:border-box;cursor:pointer;display:flex;flex-direction:column;gap:3px;padding:14px 16px;border:1px solid var(--line);border-radius:16px;background:var(--surface);transition:border-color .15s,box-shadow .15s,transform .15s}
.tv-cd:hover,.tv-cd:focus-visible{border-color:var(--accent);box-shadow:0 6px 18px rgba(16,42,58,.08);transform:translateY(-1px)}
.tv-cd.on{border-color:var(--accent);box-shadow:0 0 0 2px var(--accent-soft)}
.tv-cd small{color:var(--muted);font-size:12.5px}
.tv-cd-t{display:flex;align-items:center;justify-content:space-between;gap:8px}.tv-cd-t b{font-family:var(--f-display);font-size:15px}.tv-cd-t .pill{margin:0;font-size:11.5px}
.tv-cd-n{font-weight:600;color:var(--ink);margin-top:4px}
.tv-cd-a{font-family:var(--f-display);font-size:22px;font-weight:700;color:var(--ink);margin-top:6px}.tv-cd-a small{font-size:12px;font-weight:400}
.tv-new{border-style:dashed;align-items:center;justify-content:center;text-align:center;color:var(--accent);background:var(--sunk);min-height:128px}
.tv-new b{color:var(--accent)}.tv-plus{display:grid;place-items:center;width:38px;height:38px;border-radius:50%;background:var(--accent);color:var(--accent-ink);font-size:24px;line-height:1;margin-bottom:4px}
.tv-doc{position:relative;scroll-margin-top:90px}
.tv-hd{display:flex;align-items:flex-start;gap:16px;margin:-4px 0 14px;padding:16px 18px;border-radius:14px;background:linear-gradient(120deg,var(--accent-soft),transparent 70%);border:1px solid var(--line)}
.tv-hd>div:first-child{flex:1;min-width:0}
.tv-hd small{color:var(--muted);font-size:12px;letter-spacing:.04em}
.tv-hd h2{margin:2px 0;font-size:22px;display:flex;align-items:center;gap:10px;flex-wrap:wrap}.tv-hd h2 .pill{font-size:12px}
.tv-hd p{margin:0;color:var(--muted);font-size:14px}
.tv-big{text-align:right}.tv-big b{display:block;font-family:var(--f-display);font-size:30px;line-height:1.1;color:var(--accent)}.tv-big span{font-size:12px;color:var(--muted)}
.tv-cl{all:unset;cursor:pointer;width:30px;height:30px;display:grid;place-items:center;border-radius:50%;color:var(--muted)}.tv-cl:hover{background:var(--sunk);color:var(--ink)}
.tv-st{list-style:none;display:flex;gap:0;margin:0 0 16px;padding:0;overflow-x:auto}
.tv-st li{flex:1;min-width:120px;display:flex;align-items:flex-start;gap:8px;position:relative;padding-right:10px}
.tv-st li:not(:last-child)::after{content:"";position:absolute;left:34px;right:8px;top:14px;height:2px;background:var(--line)}
.tv-st li.ok:not(:last-child)::after{background:var(--accent)}
.tv-st i{font-style:normal;flex:none;width:28px;height:28px;border-radius:50%;display:grid;place-items:center;font-size:13px;font-weight:700;background:var(--sunk);color:var(--muted);border:2px solid var(--line);position:relative;z-index:1}
.tv-st li.ok i{background:var(--accent);border-color:var(--accent);color:var(--accent-ink)}
.tv-st li.cur i{border-color:var(--accent);color:var(--accent);background:var(--surface);box-shadow:0 0 0 4px var(--accent-soft)}
.tv-st span{display:flex;flex-direction:column;padding-top:30px;margin-left:-36px;min-width:0}
.tv-st b{font-size:13px}.tv-st small{font-size:11.5px;color:var(--muted);line-height:1.35}
.tv-g2{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px 12px}
.tv-g4{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px 12px}
.tv-g3{display:grid;grid-template-columns:minmax(0,1fr) auto minmax(0,1fr);gap:10px 8px;align-items:end}
.tv-g5{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,.8fr) minmax(0,1.6fr);gap:10px 12px}
.tv-g2>.w,.tv-g4>.w{grid-column:1/-1}
.tv-top{gap:14px;margin-bottom:18px}
.tv-pn{border:1px solid var(--line);border-radius:14px;padding:14px 16px;background:var(--surface)}
.tv-pnh{display:flex;align-items:center;gap:8px;margin-bottom:10px}.tv-pnh b{font-size:15px}
.tv-ic{display:grid;place-items:center;width:28px;height:28px;border-radius:8px;background:var(--accent-soft);font-size:14px}
.tv-fl{display:flex;flex-direction:column;gap:4px;min-width:0;margin:0}
.tv-fl>span{font-size:12.5px;color:var(--muted);font-weight:500}
.tv-doc input,.tv-doc select,.tv-doc textarea,.card .tv-fl input,.card .tv-fl textarea{width:100%;box-sizing:border-box;border:1px solid var(--line);border-radius:10px;padding:8px 10px;background:var(--surface);color:var(--ink);font:inherit;font-size:14px;min-height:38px}
.tv-doc input:focus,.tv-doc select:focus,.card .tv-fl input:focus,.card .tv-fl textarea:focus{outline:none;border-color:var(--accent);box-shadow:0 0 0 3px var(--accent-soft)}
.tv-ro{min-height:38px;display:flex;align-items:center;padding:0 2px;font-size:14px;color:var(--ink);font-weight:500;border-bottom:1px dashed var(--line)}.tv-ro.r{justify-content:flex-end}
.tv-u{display:flex;align-items:center;gap:6px}.tv-u em{font-style:normal;font-size:12.5px;color:var(--muted);white-space:nowrap}
.tv-seg{display:inline-flex;flex-wrap:wrap;gap:4px;padding:3px;border-radius:12px;background:var(--sunk);border:1px solid var(--line);width:max-content;max-width:100%}
.tv-seg button{all:unset;cursor:pointer;padding:6px 14px;border-radius:9px;font-size:14px;color:var(--muted);font-weight:500}
.tv-seg button[aria-pressed="true"]{background:var(--surface);color:var(--accent);box-shadow:0 1px 4px rgba(16,42,58,.12);font-weight:700}
.tv-seg button[disabled]{cursor:default}
.tv-sh{display:flex;align-items:baseline;gap:10px;margin:4px 0 10px;flex-wrap:wrap}.tv-sh b{font-size:17px;font-family:var(--f-display)}.tv-sh small{color:var(--muted)}
.tv-fx{font-size:12.5px}
.tv-trips{display:flex;flex-direction:column;gap:10px}
.tv-trip{position:relative;display:grid;grid-template-columns:52px minmax(0,1fr) 220px;gap:14px;padding:14px 16px;border:1px solid var(--line);border-left:4px solid var(--accent);border-radius:14px;background:var(--surface)}
.tv-trip.bad{border-left-color:var(--warn-c,#d97706);background:var(--warn-soft,#fff8ec)}
.tv-tn{display:flex;flex-direction:column;align-items:center;gap:2px}
.tv-tn b{display:grid;place-items:center;width:36px;height:36px;border-radius:50%;background:var(--accent-soft);color:var(--accent);font-size:16px}
.tv-tn span{font-size:12.5px;color:var(--muted);font-weight:600}
.tv-tb{display:flex;flex-direction:column;gap:10px;min-width:0}
.tv-ar{padding-bottom:9px;color:var(--muted);font-size:18px}
.tv-tm{display:flex;flex-direction:column;gap:8px;padding-left:14px;border-left:1px dashed var(--line)}
.tv-calc{margin-top:auto;text-align:right;display:flex;flex-direction:column}
.tv-calc small{font-size:11.5px;color:var(--muted)}.tv-calc b{font-family:var(--f-display);font-size:22px;color:var(--ink);line-height:1.2}
.tv-bad{margin:0;font-size:12.5px;color:var(--warn-c,#b45309);font-weight:600}
.tv-x{all:unset;cursor:pointer;position:absolute;top:8px;right:10px;width:26px;height:26px;display:grid;place-items:center;border-radius:50%;color:var(--muted);font-size:13px;opacity:.6}
.tv-x:hover,.tv-x:focus-visible{opacity:1;background:var(--danger-soft,#fde8e8);color:var(--danger,#c0392b)}
.tv-trip .tv-tm{padding-top:18px}
.tv-add{all:unset;box-sizing:border-box;cursor:pointer;display:block;width:100%;text-align:center;margin-top:10px;padding:12px;border:1.5px dashed var(--accent);border-radius:14px;color:var(--accent);font-weight:600;background:var(--sunk)}
.tv-add:hover,.tv-add:focus-visible{background:var(--accent-soft)}
.tv-sum{display:grid;grid-template-columns:repeat(3,minmax(0,1fr)) minmax(0,1.6fr);margin:16px 0 14px;border:1px solid var(--line);border-radius:14px;overflow:hidden}
.tv-sum>div{padding:12px 16px;display:flex;flex-direction:column;gap:1px;border-right:1px solid var(--line)}.tv-sum>div:last-child{border-right:0}
.tv-sum small{font-size:12px;color:var(--muted)}.tv-sum b{font-family:var(--f-display);font-size:22px;line-height:1.2}.tv-sum span{font-size:12px;color:var(--muted)}
.tv-sum .tot{background:var(--accent);color:var(--accent-ink)}.tv-sum .tot small,.tv-sum .tot span{color:var(--accent-ink);opacity:.85}.tv-sum .tot b{font-size:26px}
.tv-act{display:flex;flex-wrap:wrap;gap:8px;align-items:center}
.tv-warn{margin:0 0 10px;padding:10px 14px;border-radius:12px;background:var(--warn-soft,#fff4e0);color:var(--ink);font-size:14px;border:1px solid var(--line)}
@media (max-width:1100px){.tv-g5{grid-template-columns:1fr 1fr}.tv-g5>.tv-g3{grid-column:1/-1}}
@media (max-width:900px){.tv-trip{grid-template-columns:40px minmax(0,1fr)}.tv-tm{grid-column:1/-1;border-left:0;padding-left:0;border-top:1px dashed var(--line);padding-top:10px!important;display:grid;grid-template-columns:1fr 1fr 1.3fr;align-items:end}.tv-tn b{width:30px;height:30px;font-size:14px}}
@media (max-width:700px){.tv-g5{grid-template-columns:minmax(0,1fr)}.tv-g2,.tv-top{grid-template-columns:minmax(0,1fr)}.tv-g4{grid-template-columns:1fr 1fr}.tv-hd{flex-wrap:wrap}.tv-big{text-align:left}.tv-sum{grid-template-columns:1fr 1fr}.tv-sum>div{border-bottom:1px solid var(--line)}.tv-sum .tot{grid-column:1/-1}
  .tv-tm{grid-template-columns:1fr 1fr}.tv-calc{grid-column:1/-1}.tv-st li{min-width:92px}}
</style>`);
