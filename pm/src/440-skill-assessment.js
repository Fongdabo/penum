/* ---------- round 3.1: skill assessment form (แบบประเมินทักษะ) ----------
   Pick a person; the items of their position load from the skill sheets (common, department core,
   position groups) with the pass criteria. The department head scores each item 1–4 with evidence,
   HR checks it, management approves. Approved results feed skills-based pay and the annual review. */
DOC_EN.push([/แบบประเมินทักษะ/,'SKILL ASSESSMENT']);
const hk=s=>{let h=5381;for(const c of String(s))h=(h*33^c.codePointAt(0))>>>0;return 'k'+h.toString(36)};
const KST=[['draft','ร่าง'],['sub','หัวหน้าประเมินแล้ว รอฝ่ายบุคคล'],['hr','ฝ่ายบุคคลตรวจแล้ว รอผู้บริหาร'],['ok','อนุมัติแล้ว'],['back','ส่งกลับแก้ไข']];
const kCls=s=>s==='ok'?'ok':s==='back'?'bad':s==='draft'?'':'warn';
const GRADE=[[90,'A','ดีเยี่ยม'],[75,'B','ดี'],[60,'C','พอใช้'],[0,'D','ต้องพัฒนา']];
const gradeFor=p=>p==null?null:GRADE.find(g=>p>=g[0]);
const thYear=()=>String(new Date().getFullYear()+543);
// every item for this person: [{k, h, g, req, pass, top, how}]
function skaItems(s){if(!s)return [];const L=[],seen=new Set(),add=(g,k,req,pass,top,how)=>{if(seen.has(k))return;seen.add(k);L.push({k,h:hk(k),g,req,pass:pass||'',top:top||'',how:how||''})};
  const R=reqSkills(s);R.filter(x=>x.src==='ทุกตำแหน่ง').forEach(x=>add('ทักษะร่วมทุกตำแหน่ง',x.k,x.req));R.filter(x=>x.src==='ฝ่าย').forEach(x=>add('ทักษะหลักของฝ่าย',x.k,x.req));
  const G=((SKD[s.dept]||{})[s.role])||null;
  if(G&&G.length)G.forEach(([g,S_])=>S_.forEach(([k,lv,pass,top,how])=>add(g,k,lv,pass,top,how)));else R.filter(x=>x.src==='ตำแหน่ง').forEach(x=>add('ทักษะตามตำแหน่ง',x.k,x.req));
  return L}
function skaCalc(e){const s=CO().staff.find(x=>x.id===e.staff),I=skaItems(s),it=e.items||{},done=I.filter(x=>n((it[x.h]||{}).lv)>0);
  const pass=I.filter(x=>n((it[x.h]||{}).lv)>=x.req).length,pct=I.length&&done.length?Math.round(pass*100/I.length):null;
  const score=I.length?Math.round(sum(I,x=>Math.min(n((it[x.h]||{}).lv),x.req))*100/Math.max(1,sum(I,x=>x.req))):null;
  return {s,I,done:done.length,pass,pct,score,grade:gradeFor(pct),gaps:I.filter(x=>{const a=n((it[x.h]||{}).lv);return a>0&&a<x.req})}}
NEW.ska=arr=>{const y=thYear(),k=arr.filter(x=>(x.no||'').startsWith(`SKA-${y}-`)).length+1;return {no:`SKA-${y}-${pad(k,3)}`,period:y,date:today(),staff:'',by:'',items:{},status:'draft',plan:'',note:'',log:[]}};
const ensureSka=()=>{const C=CO();C.ska=C.ska||[];return C.ska};
// who may do which step
const canAssess=e=>{const u=me(),s=CO().staff.find(x=>x.id===e.staff);return !u||u.dept==='MGT'||u.dept==='HR'||(s&&isHead(u)&&u.dept===s.dept&&u.id!==s.id)};
const canHR=()=>{const u=me();return !u||u.dept==='HR'||u.dept==='MGT'};
const canApprove=()=>{const u=me();return !u||u.dept==='MGT'};
const whoName=()=>S.me?staffName(S.me):'ผู้ดูแลระบบ';
function skaSee(e){const u=me();if(!u||hrFull()||!e.staff)return true;const s=CO().staff.find(x=>x.id===e.staff);return s&&(s.id===u.id||(isHead(u)&&s.dept===u.dept))}
ACT.skaNew=()=>{const L=ensureSka(),r=Object.assign({id:uid()},NEW.ska(L));const u=me();if(u&&!hrFull()){const st=CO().staff.find(s=>s.dept===u.dept&&s.id!==u.id&&s.active!==false);if(st)r.staff=st.id}
  L.push(r);S.sel.ska=r.id;save();render()};
ACT.skaFrom=b=>{const L=ensureSka(),src=L.find(x=>x.id===b.dataset.id);if(!src)return;const r=Object.assign({id:uid()},NEW.ska(L),{staff:src.staff,items:JSON.parse(JSON.stringify(src.items||{})),note:`ประเมินต่อจาก ${src.no}`});
  L.push(r);S.sel.ska=r.id;save();render();toast('คัดลอกคะแนนครั้งก่อนมาเป็นจุดเริ่มต้นแล้ว')};
ACT.skaGapPlan=b=>{const e=ensureSka().find(x=>x.id===b.dataset.id);if(!e)return;const c=skaCalc(e);
  e.plan=c.gaps.map(x=>`- ${x.k}: จากระดับ ${n(e.items[x.h].lv)} เป็น ${x.req}${x.how?` (ประเมินโดย ${x.how})`:''}`).join('\n')||'ทุกทักษะผ่านระดับที่ต้องการ';save();render()};
function skaStep(e,to,label){e.status=to;(e.log=e.log||[]).push({at:new Date().toISOString(),by:whoName(),act:label});save();render();toast(label)}
ACT.skaNext=b=>{const e=ensureSka().find(x=>x.id===b.dataset.id);if(!e)return;const c=skaCalc(e);
  if(e.status==='draft'||e.status==='back'){if(!canAssess(e)){toast('หัวหน้าฝ่ายของพนักงานเป็นผู้ประเมิน');return}if(c.done<c.I.length&&!confirm(`ยังประเมินไม่ครบ (${c.done}/${c.I.length} ข้อ) ส่งต่อเลยไหม?`))return;e.by=e.by||whoName();skaStep(e,'sub','ส่งผลประเมินให้ฝ่ายบุคคล');return}
  if(e.status==='sub'){if(!canHR()){toast('ฝ่ายบุคคลเป็นผู้ตรวจขั้นนี้');return}e.hrBy=whoName();skaStep(e,'hr','ฝ่ายบุคคลตรวจแล้ว ส่งผู้บริหารอนุมัติ');return}
  if(e.status==='hr'){if(!canApprove()){toast('ผู้บริหารเป็นผู้อนุมัติ');return}e.okBy=whoName();e.okDate=today();
    const s=c.s;if(s){s.sk=s.sk||{};c.I.forEach(x=>{const a=n((e.items[x.h]||{}).lv);if(a>0)s.sk[x.k]=a});s.skaLast=e.id}skaStep(e,'ok','อนุมัติผลประเมินแล้ว ผลจะใช้คำนวณเงินเดือนตามทักษะ')}};
ACT.skaBack=b=>{const e=ensureSka().find(x=>x.id===b.dataset.id);if(!e)return;if(!(canHR()||canApprove())){toast('เฉพาะฝ่ายบุคคลหรือผู้บริหาร');return}
  const why=prompt('เหตุผลที่ส่งกลับแก้ไข','');if(why==null)return;e.note=(e.note?e.note+'\n':'')+`ส่งกลับ: ${why}`;skaStep(e,'back','ส่งกลับให้หัวหน้าแก้ไข')};
// pay and the annual review read the latest approved assessment when there is one
{const f=skillPct;skillPct=function(s){const L=(CO().ska||[]).filter(e=>e.staff===s.id&&e.status==='ok').sort((a,b)=>(b.okDate||b.date).localeCompare(a.okDate||a.date));
  if(L.length){const p=skaCalc(L[0]).pct;if(p!=null)return p}return f(s)}}

function hrEval(){const C=CO(),L=ensureSka().filter(skaSee).slice().sort((a,b)=>(b.date||'').localeCompare(a.date||'')),sel=L.find(x=>x.id===S.sel.ska)||null;
  const fs=S.sel.skaf||'',F=fs?L.filter(e=>e.staff===fs):L;
  const list=`<section class="card"><h2><span>แบบประเมินทักษะ</span><small>หัวหน้าฝ่ายประเมิน › ฝ่ายบุคคลตรวจ › ผู้บริหารอนุมัติ ผลที่อนุมัติใช้คำนวณเงินเดือนตามทักษะและประเมินประจำปี</small><span class="sp"></span><button type="button" class="btn sm pri" data-a="skaNew">+ ประเมินใหม่</button></h2>
  <div class="row" style="margin-bottom:8px"><label style="display:flex;gap:6px;align-items:center">พนักงาน<select id="skaF"><option value="">ทุกคน</option>${C.staff.filter(s=>s.active!==false&&L.some(e=>e.staff===s.id)).map(s=>`<option value="${s.id}"${s.id===fs?' selected':''}>${esc(s.name)}</option>`).join('')}</select></label></div>
  <div class="tw"><table><thead><tr><th>เลขที่</th><th>วันที่</th><th>พนักงาน</th><th>ตำแหน่ง</th><th class="r">ผ่านเกณฑ์</th><th class="c">เกรด</th><th>สถานะ</th><th></th></tr></thead><tbody>
  ${F.length?F.map(e=>{const c=skaCalc(e);return `<tr class="${sel&&sel.id===e.id?'sel':''}"><td><button type="button" class="btn ghost sm" data-a="sel" data-k="ska" data-id="${e.id}"><b>${esc(e.no)}</b></button></td><td>${thD(e.date)}</td><td>${esc(c.s?c.s.name:'–')}</td><td><small>${esc(c.s?c.s.role:'')}</small></td><td class="r">${c.pct==null?'–':c.pct+'%'}</td><td class="c">${c.grade?`<b>${c.grade[1]}</b>`:'–'}</td><td>${pill(KST,e.status,kCls(e.status))}</td><td>${e.status==='draft'?`<button type="button" class="x" data-a="delRow" data-c="co.ska" data-id="${e.id}" aria-label="ลบ">✕</button>`:''}</td></tr>`}).join(''):'<tr><td colspan="8" class="empty">ยังไม่มีแบบประเมิน กด “+ ประเมินใหม่”</td></tr>'}</tbody></table></div></section>`;
  if(!sel)return list;const e=sel,c=skaCalc(e),b=`co.ska.${e.id}`,lock=e.status==='ok'||e.status==='hr'||e.status==='sub',edit=!lock&&canAssess(e);e.items=e.items||{};
  c.I.forEach(x=>{if(!e.items[x.h])e.items[x.h]={lv:'',ev:''}});
  const hist=ensureSka().filter(x=>x.staff===e.staff&&x.id!==e.id&&x.status==='ok').sort((a,b2)=>(a.date||'').localeCompare(b2.date||''));
  const groups=[...new Set(c.I.map(x=>x.g))];
  const rows=groups.map(g=>`<tr class="grp"><td colspan="5"><b>${esc(g)}</b></td></tr>`+c.I.filter(x=>x.g===g).map(x=>{const it=e.items[x.h],a=n(it.lv),cl=a?gapCls(a,x.req):'';
    return `<tr><td>${esc(x.k)}${x.pass||x.how?`<details class="skc"><summary>เกณฑ์</summary>${x.pass?`<p><b>ผ่าน:</b> ${esc(x.pass)}</p>`:''}${x.top?`<p><b>ระดับสูง:</b> ${esc(x.top)}</p>`:''}${x.how?`<p><b>วิธีประเมิน:</b> ${esc(x.how)}</p>`:''}</details>`:''}</td><td>${dots(x.req)}</td>
    <td><select data-p="${b}.items.${x.h}.lv"${edit?'':' disabled'} aria-label="ระดับที่ประเมิน">${LV.map((l,i)=>`<option value="${i||''}"${String(it.lv??'')===String(i||'')?' selected':''}>${l||'–'}</option>`).join('')}</select></td>
    <td><input data-p="${b}.items.${x.h}.ev" value="${esc(it.ev||'')}" placeholder="หลักฐาน / งานที่ดู"${edit?'':' disabled'} aria-label="หลักฐาน"></td><td>${cl?`<span class="pill ${cl}">${cl==='ok'?'ผ่าน':cl==='warn'?'อบรม':'คุมใกล้ชิด'}</span>`:''}</td></tr>`}).join('')).join('');
  const nextL={draft:'ส่งให้ฝ่ายบุคคล',back:'ส่งให้ฝ่ายบุคคลอีกครั้ง',sub:'ฝ่ายบุคคลตรวจแล้ว ส่งผู้บริหาร',hr:'ผู้บริหารอนุมัติ'}[e.status];
  return list+`<section class="card"><h2><span>${esc(e.no)}</span>${pill(KST,e.status,kCls(e.status))}<span class="sp"></span>
    ${e.status==='ok'?`<button type="button" class="btn sm" data-a="skaFrom" data-id="${e.id}">ประเมินรอบถัดไป</button>`:''}<button type="button" class="btn sm pri" data-a="print" data-k="ska" data-id="${e.id}">พิมพ์แบบประเมิน</button></h2>
  <div class="form"><label class="w2">พนักงาน<select data-p="${b}.staff"${e.status==='draft'?'':' disabled'}><option value="">– เลือกพนักงาน –</option>${C.staff.filter(s=>s.active!==false&&(hrFull()||(me()&&s.dept===me().dept))).map(s=>`<option value="${s.id}"${s.id===e.staff?' selected':''}>${esc(s.name)} · ${esc(s.role||'')}</option>`).join('')}</select></label>
    <label>รอบประเมิน (ปี)<input data-p="${b}.period" value="${esc(e.period||'')}"${lock?' disabled':''}></label><label>วันที่ประเมิน<input type="date" data-p="${b}.date" value="${esc(e.date)}"${lock?' disabled':''}></label></div>
  ${c.s?`<dl class="stats" style="margin-top:12px"><div><dt>ประเมินแล้ว</dt><dd>${c.done}/${c.I.length}</dd></div><div><dt>ผ่านระดับที่ต้องการ</dt><dd>${c.pct==null?'–':c.pct+'%'}</dd></div><div><dt>คะแนนรวม</dt><dd>${c.score==null?'–':c.score+'%'}</dd></div><div><dt>เกรด</dt><dd>${c.grade?`${c.grade[1]} <small>${c.grade[2]}</small>`:'–'}</dd></div>${hist.length?`<div><dt>ครั้งก่อน</dt><dd>${hist.map(h=>{const p=skaCalc(h).pct;return `<small>${esc(h.period||thD(h.date))}</small> ${p==null?'–':p+'%'}`}).join(' · ')}</dd></div>`:''}</dl>
  <p class="hint">ระดับ 1 รู้หลักการ · 2 ทำได้มีคนดูแล · 3 ทำได้เอง · 4 เชี่ยวชาญ สอนได้ · กด “เกณฑ์” ใต้ชื่อทักษะเพื่อดูเกณฑ์ผ่านและวิธีประเมิน${edit?'':' · ล็อกแล้ว ขั้นนี้แก้คะแนนไม่ได้'}</p>
  <div class="tw"><table class="skat"><thead><tr><th>ทักษะ</th><th>ต้องการ</th><th style="width:170px">ประเมินได้</th><th>หลักฐาน / หมายเหตุ</th><th>ผล</th></tr></thead><tbody>${rows}</tbody></table></div>
  <h3 class="fm-g">แผนพัฒนารายบุคคล</h3><textarea data-p="${b}.plan" rows="4" style="width:100%"${lock&&e.status!=='sub'?' disabled':''}>${esc(e.plan||'')}</textarea>
  <div class="row" style="margin-top:6px"><button type="button" class="btn sm" data-a="skaGapPlan" data-id="${e.id}"${lock?' disabled':''}>สร้างแผนจากทักษะที่ยังไม่ผ่าน</button></div>
  ${e.note?`<p class="hint" style="white-space:pre-line;margin-top:8px">${esc(e.note)}</p>`:''}
  <div class="sigs">${sigBox(b,e,'sigE','ผู้ถูกประเมิน','')}${sigBox(b,e,'sigH','ผู้ประเมิน (หัวหน้าฝ่าย)','')}${sigBox(b,e,'sigR','ฝ่ายบุคคล','')}${sigBox(b,e,'sigM','ผู้บริหารอนุมัติ','')}</div>
  <div class="row" style="margin-top:12px">${nextL?`<button type="button" class="btn pri" data-a="skaNext" data-id="${e.id}">${nextL}</button>`:''}${e.status==='sub'||e.status==='hr'?`<button type="button" class="btn" data-a="skaBack" data-id="${e.id}">ส่งกลับแก้ไข</button>`:''}</div>
  ${(e.log||[]).length?`<ol class="hint" style="margin-top:10px;padding-left:18px">${e.log.map(l=>`<li>${new Date(l.at).toLocaleString('th-TH',{dateStyle:'medium',timeStyle:'short'})} · ${esc(l.by)} · ${esc(l.act)}</li>`).join('')}</ol>`:''}`
  :'<p class="hint" style="margin-top:10px">เลือกพนักงานเพื่อโหลดหัวข้อประเมินตามตำแหน่ง</p>'}</section>`}
document.addEventListener('change',e=>{if(e.target.id==='skaF'){S.sel.skaf=e.target.value;render()}});
PRINT.ska=id=>{const e=(CO().ska||[]).find(x=>x.id===id);if(!e)return '';const c=skaCalc(e),s=c.s||{},D=SKILLS.depts.find(d=>d.c===s.dept)||{},it=e.items||{};
  const groups=[...new Set(c.I.map(x=>x.g))];
  return cphead(`แบบประเมินทักษะ ${esc(e.no)}`,`รอบประเมิน ${esc(e.period||'')}<br>วันที่ ${thDL(e.date)}`)+`<div class="meta"><div><b>ชื่อ-สกุล:</b> ${esc(s.name||'')} (${esc(s.code||'')})</div><div><b>ตำแหน่ง:</b> ${esc(s.role||'')}</div><div><b>ฝ่าย:</b> ${esc(D.n||'')}</div><div><b>ผล:</b> ผ่านเกณฑ์ ${c.pct==null?'–':c.pct+'%'} · คะแนนรวม ${c.score==null?'–':c.score+'%'} · เกรด <b>${c.grade?c.grade[1]+' '+c.grade[2]:'–'}</b></div></div>
  <table><thead><tr><th>#</th><th>ทักษะ</th><th>ต้องการ</th><th>ได้</th><th>หลักฐาน / หมายเหตุ</th></tr></thead><tbody>${(()=>{let i=0;return groups.map(g=>`<tr><td colspan="5" style="background:#F3F7F7"><b>${esc(g)}</b></td></tr>`+c.I.filter(x=>x.g===g).map(x=>{const a=n((it[x.h]||{}).lv);return `<tr><td>${++i}</td><td>${esc(x.k)}</td><td style="text-align:center">${x.req}</td><td style="text-align:center${a&&a<x.req?';color:#B0524A;font-weight:700':''}">${a||''}</td><td>${esc((it[x.h]||{}).ev||'')}</td></tr>`}).join('')).join('')})()}</tbody></table>
  <p style="font-size:11px;color:#555">ระดับ 1 รู้หลักการ · 2 ทำได้มีคนดูแล · 3 ทำได้เอง · 4 เชี่ยวชาญ สอนได้ · เกรด A ≥90% B ≥75% C ≥60% D ต่ำกว่า 60%</p>
  ${e.plan?`<h3>แผนพัฒนารายบุคคล</h3><div class="box" style="white-space:pre-line">${esc(e.plan)}</div>`:''}
  <div class="sign" style="grid-template-columns:repeat(4,1fr)">${sigPrint(e,'sigE','ผู้ถูกประเมิน',s.name)}${sigPrint(e,'sigH','ผู้ประเมิน',e.by)}${sigPrint(e,'sigR','ฝ่ายบุคคล',e.hrBy)}${sigPrint(e,'sigM','ผู้บริหารอนุมัติ',e.okBy)}</div>`};
// HR page: a new sub-tab; heads outside HR see leave and assessments of their own department
{const f=CVIEWS.hr;CVIEWS.hr=()=>{ensureSka();if(!hrFull()){const u=me(),{cur,html}=subTabs('hr',[['leave','การลา'],['eval',u&&isHead(u)?'ประเมินทักษะลูกทีม':'ผลประเมินของฉัน']]);return html+(cur==='eval'?hrEval():hrLeave())}
  if(S.sub.hr==='eval'){const {html}=subTabs('hr',[['staff','พนักงานและจัดคนลงหน้างาน'],['ts','ลงเวลาทำงาน'],['leave','การลา'],['pay','สรุปค่าแรง'],['skill','สกิลชีต'],['gap','แผนอบรม'],['rev','ประเมินและขึ้นเงินเดือน'],['band','โครงสร้างเงินเดือน'],['tool','เครื่องมือ']]);return html+hrEval()}
  return f()}}
{const sb=subTabs;subTabs=function(k,list){if(k==='hr'&&hrFull()&&!list.some(x=>x[0]==='eval')){const i=list.findIndex(x=>x[0]==='skill');list=[...list.slice(0,i+1),['eval','แบบประเมินทักษะ'],...list.slice(i+1)]}return sb(k,list)}}
// forms page: the assessment opens from the forms library too
// alerts: assessments waiting on the person who can move them
{const f=alerts;alerts=function(){const A=f();(CO().ska||[]).forEach(e=>{const c=skaCalc(e),nm=c.s?c.s.name:'';
  if(e.status==='sub'&&canHR())A.push({lv:'warn',kind:'แบบประเมินทักษะรอฝ่ายบุคคล',p:null,txt:`${e.no} ${nm}`,due:e.date,go:{m:'co',k:'hr',s:'eval'}});
  if(e.status==='hr'&&canApprove())A.push({lv:'warn',kind:'แบบประเมินทักษะรออนุมัติ',p:null,txt:`${e.no} ${nm}`,due:e.date,go:{m:'co',k:'hr',s:'eval'}})});return A}}
document.head.insertAdjacentHTML('beforeend',`<style>
.skat tr.grp td{background:var(--sunk);font-size:13px}.skc{margin-top:2px;font-size:12px;color:var(--muted)}.skc summary{cursor:pointer;color:var(--accent);display:inline}.skc p{margin:2px 0}
</style>`);

