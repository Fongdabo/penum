/* ---------- 3.9: people + AI team (ORIEN-AI-01) ----------
   AI members are kept in their own list (co.ai), apart from the staff, so payroll, leave, benefits, time sheets and
   skill assessment never see them. Each has a human reviewer.
   Documents (quotation, PR, PO, VO, daily report, invoice, service job) can be marked "drafted by AI": they print
   only as a watermarked draft until a person marks them reviewed, and the final print carries the reviewer's name.
   "วางจาก AI" fills a document from text an AI wrote, and each project can export its facts as a file to load
   into that AI's Claude project. Nothing here calls an AI service from the page. */
const AI_PLAN=[['AI-ขาย','SAL','ธุรการขาย','ร่างใบเสนอราคา ตอบลูกค้าเบื้องต้น ติดตามงานที่เสนอราคา'],['AI-ออกแบบ','DES','ช่างเขียนแบบ / BIM Modeler','ร่างแบบและโมเดลใน PENUM BIM ให้วิศวกรตรวจและลงนาม'],
  ['AI-ประมาณราคา','EST','เจ้าหน้าที่ถอดแบบ (QS)','ถอดปริมาณ ทำ BOQ ใน PENUM MEP ร่างราคาประมูล'],['AI-โครงการ','PRJ','ธุรการเอกสารโครงการ','ร่างรายงานประจำวัน VO RFI และเอกสารส่งอนุมัติ'],
  ['AI-จัดซื้อ','PUR','เจ้าหน้าที่จัดซื้อ','ร่างใบขอซื้อ เทียบราคา ร่างใบสั่งซื้อ ติดตามของเข้า'],['AI-บัญชี','ACC','พนักงานบัญชี','ร่างใบแจ้งหนี้ ใบวางบิล ติดตามรับจ่าย'],
  ['AI-บุคคล','HR','เจ้าหน้าที่บุคคล','ร่างประกาศรับสมัคร สรุปลงเวลา เตรียมเอกสารบุคคล'],['AI-บริการ','SVC','ผู้รับแจ้งซ่อม','รับแจ้งซ่อม เปิดใบงาน นัด PM ร่างรายงานบริการ']];
// documents an AI may draft: where to find them, who usually drafts them, and how pasted text fills them
const AIDOC={quote:{n:'ใบเสนอราคา',get:id=>CO().quotes.find(x=>x.id===id),d:'SAL',lines:'q'},pr:{n:'ใบขอซื้อ',get:id=>P.prs.find(x=>x.id===id),d:'PUR',lines:'pr'},
  po:{n:'ใบสั่งซื้อ',get:id=>P.pos.find(x=>x.id===id),d:'PUR',lines:'po'},vo:{n:'งานเพิ่มลด',get:id=>P.vos.find(x=>x.id===id),d:'PRJ',text:'vo'},
  daily:{n:'รายงานประจำวัน',get:id=>P.daily.find(x=>x.id===id),d:'PRJ',text:'daily'},bill:{n:'ใบแจ้งหนี้งวดงาน',get:id=>P.bills.find(x=>x.id===id),d:'ACC'},
  job:{n:'ใบงานบริการ',get:id=>(CO().tickets||[]).find(x=>x.id===id),d:'SVC',text:'job'}};
const aiList=()=>{const C=CO();C.ai=C.ai||[];return C.ai};
const aiById=id=>aiList().find(a=>a.id===id);
const aiRevOf=a=>CO().staff.find(s=>s.id===a?.rev);
const humanStaff=()=>CO().staff.filter(s=>s.active!==false);
NEW.ai=arr=>({code:'AI-'+pad(arr.length+1,2),name:'AI-',dept:'PRJ',role:'',job:'',rev:'',tool:'Claude Project',since:today(),active:true});
// the reviewer for a department: its head, else management
const aiDefRev=dept=>{const S0=humanStaff();return (S0.find(s=>s.dept===dept&&isHead(s))||S0.find(s=>s.dept==='MGT')||S0[0]||{}).id||''};
ACT.aiSeed=()=>{const L=aiList();let k=0;AI_PLAN.forEach(([name,dept,role,job])=>{if(L.some(a=>a.name===name))return;L.push(Object.assign({id:uid()},NEW.ai(L),{name,dept,role,job,rev:aiDefRev(dept)}));k++});
  save();render();toast(k?`เพิ่มพนักงาน AI ${k} ตำแหน่งตามแผนทีม AI`:'มีครบทุกตำแหน่งแล้ว')};
HR_TABS.push(['ai','พนักงาน AI']);
if(typeof SBSUB!=='undefined')SBSUB['co.hr']+='|ai=พนักงาน AI';
const aiBadge=a=>`<span class="ai-b" title="พนักงาน AI">AI</span>`;
function aiView(){const L=aiList(),deptName=c=>(SKILLS.depts.find(d=>d.c===c)||{n:c}).n,hs=humanStaff();
  const cols=[{k:'code',h:'รหัส',w:70},{k:'name',h:'ชื่อ',w:130},{k:'dept',h:'ฝ่าย',t:'sel',o:SKILLS.depts.map(d=>[d.c,d.n]),w:130},{k:'role',h:'แทนตำแหน่ง',w:170},{k:'job',h:'งานที่ทำ',t:'area',w:260},
    {k:'rev',h:'คนตรวจ',t:'sel',o:()=>[['','– เลือก –'],...hs.map(s=>[s.id,`${s.name||s.code} · ${s.role||''}`])],w:180},{k:'tool',h:'เครื่องมือ',w:120},{k:'active',h:'ใช้งาน',t:'chk'}];
  const drafts=aiDocs(),wait=drafts.filter(x=>!x.d.ai.rev);
  return `<dl class="stats"><div><dt>พนักงาน AI</dt><dd>${L.filter(a=>a.active!==false).length}</dd></div><div><dt>พนักงาน (คน)</dt><dd>${hs.length}</dd></div><div><dt>เอกสารที่ AI ร่าง</dt><dd>${drafts.length}</dd></div><div><dt>รอคนตรวจ</dt><dd style="color:${wait.length?'var(--warn,#b7791f)':''}">${wait.length}</dd></div></dl>
  <section class="card"><h2><span>พนักงาน AI</span><small>ไม่นับในเงินเดือน การลา สวัสดิการ ลงเวลา และการประเมินทักษะ · งานที่ AI ทำต้องมีคนตรวจทุกชิ้น</small><span class="sp"></span>${L.length<AI_PLAN.length?`<button type="button" class="btn sm" data-a="aiSeed">เพิ่มตามแผนทีม AI</button>`:''}<button type="button" class="btn sm pri" data-a="add" data-c="co.ai">+ พนักงาน AI</button></h2>
  ${gtable('co.ai',L,cols,{empty:'ยังไม่มีพนักงาน AI กด “เพิ่มตามแผนทีม AI” เพื่อเพิ่ม 8 ตำแหน่ง'})}
  <p class="hint">ตำแหน่งที่ใช้ลายเซ็น ใบอนุญาต ความปลอดภัย และการเงิน เป็นคนเสมอ · ตั้งค่า AI แต่ละตัวเป็น Claude Project แล้วแชร์ให้คนตรวจ อัปโหลดไฟล์ “ข้อมูลโครงการสำหรับ AI” จากหน้าภาพรวมโครงการเป็นความรู้ของ Project นั้น</p>
  <label class="chk" style="display:flex;gap:6px;align-items:center;margin-top:8px"><input type="checkbox" data-t="chk" data-p="co.aiLine"${CO().aiLine?' checked':''}> แสดงผู้ร่าง/ผู้ตรวจในเอกสาร <small class="muted">(ปิดไว้: เอกสารที่ส่งลูกค้า ผู้ขาย หรือที่ปรึกษาจะไม่มีบรรทัด “ร่างโดย AI” ส่วนใบขอซื้อซึ่งใช้ภายในยังแสดง)</small></label></section>
  <section class="card"><h2><span>เอกสารที่ AI ร่าง</span><small>${wait.length} รอตรวจ</small></h2>${drafts.length?`<div class="tw"><table><thead><tr><th>เอกสาร</th><th>เลขที่</th><th>โครงการ</th><th>ร่างโดย</th><th>สถานะ</th></tr></thead><tbody>
    ${drafts.map(({k,d,p})=>`<tr><td>${AIDOC[k].n}</td><td>${esc(d.no||thD(d.date)||'')}</td><td>${esc(p?p.name:'บริษัท')}</td><td>${aiBadge()} ${esc(aiById(d.ai.by)?.name||'AI')}</td><td>${d.ai.rev?`<span class="pill ok">ตรวจแล้ว · ${esc(d.ai.rev.by)} ${thD(d.ai.rev.at)}</span>`:'<span class="pill warn">รอคนตรวจ</span>'}</td></tr>`).join('')}</tbody></table></div>`:'<p class="hint">ยังไม่มี</p>'}</section>`}
function aiDocs(){const out=[];for(const [k,T] of Object.entries(AIDOC)){
    if(k==='quote'||k==='job'){(k==='quote'?CO().quotes:(CO().tickets||[])).forEach(d=>{if(d.ai&&d.ai.by)out.push({k,d})});continue}
    const key={pr:'prs',po:'pos',vo:'vos',daily:'daily',bill:'bills'}[k];projects().forEach(p=>(p[key]||[]).forEach(d=>{if(d.ai&&d.ai.by)out.push({k,d,p})}))}
  return out.sort((a,b)=>(a.d.ai.rev?1:0)-(b.d.ai.rev?1:0))}
{const f=CVIEWS.hr;CVIEWS.hr=()=>{if(S.sub.hr==='ai'&&hrFull())return hrTabs()+aiView();return f()}}
// org chart: the AI members under the chart, by department
{const f=orgChart;orgChart=function(){const L=aiList().filter(a=>a.active!==false);if(!L.length)return f();const deptName=c=>(SKILLS.depts.find(d=>d.c===c)||{n:c}).n;
  return f()+`<section class="card" style="margin-top:12px"><h2><span>พนักงาน AI</span><small>${L.length} ตำแหน่ง · AI ทำ คนตรวจ</small></h2><div class="ai-org">${L.map(a=>`<div class="ai-c"><div>${aiBadge()} <b>${esc(a.name)}</b></div><small>${esc(deptName(a.dept))} · แทน${esc(a.role||'')}</small><small>คนตรวจ: ${esc(aiRevOf(a)?.name||'ยังไม่ได้กำหนด')}</small></div>`).join('')}</div></section>`}}

// --- AI draft → reviewed, on the documents ---
const aiCanReview=(d)=>{const u=me();if(!u)return true;const a=aiById(d.ai.by);return u.dept==='MGT'||u.id===a?.rev||isHead(u)};
function aiChip(k,d){const a=d.ai&&d.ai.by?aiById(d.ai.by)||{name:'AI'}:null;
  if(a)return d.ai.rev?`<span class="ai-chip ok" title="ร่างโดย ${esc(a.name)}">${aiBadge()} ตรวจแล้ว · ${esc(d.ai.rev.by)}</span><button type="button" class="btn ghost sm" data-a="aiUnrev" data-k="${k}" data-id="${d.id}" title="ยกเลิกการตรวจ">↺</button>`
    :`<span class="ai-chip wait">${aiBadge()} ${esc(a.name)} ร่าง · รอคนตรวจ</span>${aiCanReview(d)?`<button type="button" class="btn sm pri" data-a="aiRev" data-k="${k}" data-id="${d.id}">ตรวจแล้ว</button>`:''}`;
  return aiList().length?`<button type="button" class="btn ghost sm ai-mk" data-a="aiPaste" data-k="${k}" data-id="${d.id}" title="วางข้อความหรือตารางที่ AI ร่าง">วางจาก AI</button>`:''}
function aiDecorate(){if(!aiList().length&&!aiDocs().length)return;document.querySelectorAll('#view [data-a="print"][data-k][data-id]').forEach(b=>{const k=b.dataset.k,T=AIDOC[k];if(!T||b.previousElementSibling?.classList?.contains('ai-w'))return;
  const d=T.get(b.dataset.id);if(!d)return;b.insertAdjacentHTML('beforebegin',`<span class="ai-w">${aiChip(k,d)}</span>`)})}
{const r=render;render=function(){const x=r.apply(this,arguments);try{aiDecorate()}catch(e){console.error(e)}return x}}
ACT.aiRev=b=>{const d=AIDOC[b.dataset.k]?.get(b.dataset.id);if(!d||!d.ai)return;const u=me();let by=u?u.name||u.code:'';
  if(!by){by=prompt('ชื่อผู้ตรวจ',aiRevOf(aiById(d.ai.by))?.name||'');if(!by)return}d.ai.rev={by,at:today(),id:u?.id||''};save();render();toast('บันทึกว่าตรวจแล้ว พิมพ์ฉบับจริงได้')};
ACT.aiUnrev=b=>{const d=AIDOC[b.dataset.k]?.get(b.dataset.id);if(!d||!d.ai||!confirm('ยกเลิกการตรวจ? เอกสารจะกลับเป็นฉบับร่าง'))return;delete d.ai.rev;save();render()};
// a quotation drafted by AI is not sent until a person has checked it
HOOK.push((p,v)=>{const m=/^co\.quotes\.([^.]+)\.status$/.exec(p);if(!m||!['sent','won'].includes(v))return;const q=CO().quotes.find(x=>x.id===m[1]);
  if(q&&q.ai&&q.ai.by&&!q.ai.rev){q.status='draft';toast('ใบเสนอราคานี้ AI ร่าง ต้องมีคนกด “ตรวจแล้ว” ก่อนส่งลูกค้า')}});
// printing: an unchecked AI draft prints only as a draft; the final copy names who drafted and who checked it
let AI_DRAFT_OK=null;
{const f=ACT.print;ACT.print=b=>{const k=b.dataset.k,T=AIDOC[k],d=T&&T.get(b.dataset.id);
  if(d&&d.ai&&d.ai.by&&!d.ai.rev&&AI_DRAFT_OK!==b.dataset.id){AI_DRAFT_OK=null;
    dialog('AI ร่าง ยังไม่มีคนตรวจ',`<p>${T.n}นี้ร่างโดย <b>${esc(aiById(d.ai.by)?.name||'AI')}</b> ต้องให้คนตรวจและกด “ตรวจแล้ว” ก่อน จึงพิมพ์เป็นฉบับจริงได้</p><p class="hint">พิมพ์ตอนนี้ได้เป็นฉบับร่าง มีคำว่า “ฉบับร่าง” พาดกลางหน้า สำหรับให้คนตรวจอ่าน</p>`,
      `<button type="button" class="btn" data-a="aiDraftPrint" data-k="${k}" data-id="${b.dataset.id}">พิมพ์ฉบับร่าง</button>${aiCanReview(d)?`<button type="button" class="btn pri" data-a="aiRevPrint" data-k="${k}" data-id="${b.dataset.id}">ตรวจแล้ว และพิมพ์</button>`:''}`);return}
  AI_DRAFT_OK=null;return f(b)}}
ACT.aiDraftPrint=b=>{$('#dlg').close();AI_DRAFT_OK=b.dataset.id;ACT.print({dataset:{k:b.dataset.k,id:b.dataset.id}})};
ACT.aiRevPrint=b=>{$('#dlg').close();ACT.aiRev(b);const d=AIDOC[b.dataset.k]?.get(b.dataset.id);if(d&&d.ai&&d.ai.rev)ACT.print({dataset:{k:b.dataset.k,id:b.dataset.id}})};
const AIINT=['pr'];// printed for use inside the company only
Object.keys(AIDOC).forEach(k=>{const f=PRINT[k];if(!f)return;PRINT[k]=id=>{const h=f(id),d=AIDOC[k].get(id);if(!d||!d.ai||!d.ai.by)return h;const a=aiById(d.ai.by);
  const line=`<p class="ai-pl">ร่างโดย ${esc(a?.name||'AI')} (พนักงาน AI)${d.ai.rev?` · ตรวจโดย ${esc(d.ai.rev.by)} วันที่ ${thDL(d.ai.rev.at)}`:' · <b>ยังไม่ได้ตรวจ</b>'}</p>`;
  // documents that leave the company carry no "drafted by AI" line unless the company turns it on; internal ones keep it
  const show=AIINT.includes(k)||!!CO().aiLine;return (d.ai.rev?'':'<div class="ai-wm">ฉบับร่าง</div>')+h+(show?line:'')}});

// --- "วางจาก AI": text or a table an AI wrote fills the document and marks it as an AI draft ---
function aiRows(txt){const L=String(txt||'').replace(/\r/g,'').split('\n').map(l=>l.trim()).filter(l=>l&&!/^\|?\s*:?-{3,}/.test(l));
  return L.map(l=>(l.includes('\t')?l.split('\t'):l.includes('|')?l.replace(/^\||\|$/g,'').split('|'):[l]).map(c=>c.trim()))}
// lines: description, quantity, unit, price, in whatever order; numbers are told apart from text
function aiLines(txt){return aiRows(txt).map(r=>{const nums=r.map(numOf),txtc=r.filter((c,i)=>nums[i]==null&&c);const N=nums.filter(x=>x!=null);if(!txtc.length||!N.length)return null;
  const desc=txtc.sort((a,b)=>b.length-a.length)[0],unit=r.find((c,i)=>nums[i]==null&&c&&c!==desc&&c.length<=10)||'';
  return {desc,unit,q:N.length>1?N[N.length-2]:N[0],p:N.length>1?N[N.length-1]:0}}).filter(Boolean).filter(x=>!/^(รายการ|ลำดับ|description|item)$/i.test(x.desc))}
ACT.aiPaste=b=>{const k=b.dataset.k,T=AIDOC[k],d=T?.get(b.dataset.id);if(!d)return;const L=aiList().filter(a=>a.active!==false),def=(L.find(a=>a.dept===T.d)||L[0]||{}).id;
  dialog(`วางจาก AI · ${T.n}`,`<p class="hint" style="margin-top:0">คัดลอกสิ่งที่ AI ร่างใน Claude ${T.lines?'(ตารางรายการ: รายการ จำนวน หน่วย ราคา)':'(ข้อความ)'} มาวางด้านล่าง เอกสารจะถูกทำเครื่องหมายว่า AI ร่าง และต้องมีคนตรวจก่อนพิมพ์ฉบับจริง</p>
    <label>ร่างโดย<select id="aiBy">${L.map(a=>`<option value="${a.id}"${a.id===def?' selected':''}>${esc(a.name)}</option>`).join('')}</select></label>
    <textarea id="aiTxt" rows="9" style="margin-top:8px" placeholder="${T.lines?'รายการ\tจำนวน\tหน่วย\tราคา':'งานที่ทำ: ...\nแผนพรุ่งนี้: ...\nปัญหา: ...'}"></textarea>${T.lines?`<label style="display:flex;gap:6px;align-items:center;margin-top:6px"><input type="checkbox" id="aiRep"> แทนที่รายการเดิม</label>`:''}`,
    `<button type="button" class="btn pri" data-a="aiPasteGo" data-k="${k}" data-id="${d.id}">ใส่ในเอกสาร</button>${!T.lines&&!T.text?'':''}<button type="button" class="btn" data-a="aiMarkOnly" data-k="${k}" data-id="${d.id}">แค่ทำเครื่องหมายว่า AI ร่าง</button>`)};
ACT.aiMarkOnly=b=>{const d=AIDOC[b.dataset.k]?.get(b.dataset.id),by=$('#aiBy')?.value;if(!d||!by)return;d.ai={by,at:today()};$('#dlg').close();save();render()};
ACT.aiPasteGo=b=>{const k=b.dataset.k,T=AIDOC[k],d=T?.get(b.dataset.id),txt=$('#aiTxt').value,by=$('#aiBy')?.value;if(!d||!by)return;let k2=0;
  if(T.lines){const L=aiLines(txt);if(!L.length){toast('ไม่พบรายการที่มีจำนวน ลองวางเป็นตาราง');return}if($('#aiRep')?.checked)d.items=[];
    L.forEach(x=>{k2++;if(T.lines==='q')d.items.push({id:uid(),g:'oth',head:'',type:'',desc:x.desc,unit:x.unit,q:x.q,m:0,l:0,t:0,sp:x.p||''});
      else if(T.lines==='pr')d.items.push({id:uid(),desc:x.desc,unit:x.unit,q:x.q,bud:x.p,p:0});else d.items.push({id:uid(),desc:x.desc,unit:x.unit,q:x.q,p:x.p})})}
  else if(T.text==='daily'){const sec={work:/^(งานที่ทำ|งานวันนี้|ผลงาน)\s*[:：]/,plan:/^(แผนพรุ่งนี้|แผนงาน|พรุ่งนี้)\s*[:：]/,issue:/^(ปัญหา|อุปสรรค)\s*[:：]/,safety:/^(ความปลอดภัย)\s*[:：]/,visit:/^(ผู้เข้าตรวจ|ผู้มาเยี่ยม)\s*[:：]/};let cur='work';const out={};
    txt.replace(/\r/g,'').split('\n').forEach(l=>{const h=Object.entries(sec).find(([,r])=>r.test(l.trim()));if(h){cur=h[0];l=l.trim().replace(h[1],'')}if(l.trim())(out[cur]=out[cur]||[]).push(l.trim())});
    Object.entries(out).forEach(([f,v])=>{d[f]=v.join('\n');k2++})}
  else if(T.text==='vo'){d.desc=txt.trim();const m=txt.match(/(?:มูลค่า|ราคา|รวม)[^\d-]*(-?[\d,]+(?:\.\d+)?)/);if(m)d.amt=Math.abs(numOf(m[1]));if(/ลด|omit/i.test(txt)&&!/เพิ่ม/.test(txt))d.type='omit';k2=1}
  else if(T.text==='job'){const t=txt.trim();if(/^(ผลการซ่อม|สิ่งที่ทำ|แก้ไขโดย)\s*[:：]/m.test(t)){const [a,...r]=t.split(/^(?:ผลการซ่อม|สิ่งที่ทำ|แก้ไขโดย)\s*[:：]/m);d.problem=a.replace(/^(อาการ|ปัญหา)\s*[:：]/,'').trim();d.done=r.join('\n').trim()}else d.problem=t;k2=1}
  else{d.note=((d.note||'')+'\n'+txt.trim()).trim();k2=1}
  d.ai={by,at:today()};$('#dlg').close();save();render();toast(`ใส่ข้อมูลจาก AI แล้ว${T.lines?` ${k2} รายการ`:''} รอคนตรวจ`)};

// --- the project's facts as one file, to load into the AI's Claude project ---
function aiContext(p){return withP(p,()=>{const I=p.info,s=p.tasks.length?sched():null,C=contract(),td=today();
  const open={rfi:(p.rfis||[]).filter(r=>!/ปิด|closed|done/i.test(r.status||'')&&!r.ans),vo:(p.vos||[]).filter(v=>v.status==='pending'),ncr:(p.ncr||[]).filter(r=>r.status!=='closed'),
    punch:(p.punch||[]).filter(x=>!x.done&&x.status!=='closed'),po:(p.pos||[]).filter(po=>poState(po).k!=='ok')};
  const G={};p.boq.items.forEach(i=>{G[i.g]=(G[i.g]||0)+n(i.t)});
  const md=[`# ข้อมูลโครงการ ${p.name}`,`ส่งออกจาก PENUM PM วันที่ ${thDL(td)} · ใช้เป็นความรู้ของ AI ประจำโครงการ ห้ามใช้แทนเอกสารสัญญา`,'',
    '## สัญญา',`- ผู้ว่าจ้าง: ${I.client||''}`,`- เลขที่สัญญา: ${I.contractNo||''}`,`- สถานที่: ${I.site||''}`,`- ผู้จัดการโครงการ: ${I.pm||''}`,`- มูลค่าสัญญา (ไม่รวม VAT): ${fmt(C.total,2)} บาท`,`- วันเริ่ม ${thDL(I.start)} · วันสิ้นสุด ${thDL(I.finish)}`,`- เงินล่วงหน้า ${fmtq(I.adv)}% · หักประกันผลงาน ${fmtq(I.ret)}%`,'',
    '## ขอบเขตงาน (BOQ ตามหมวด)',...Object.entries(G).map(([g,v])=>`- ${gName(g)}: ${fmt(v)} บาท`),`- รวม ${p.boq.items.length} รายการ`,'',
    '## แผนงาน',...(s?[`- ความคืบหน้าจริง ${pct(s.act())} · ตามแผน ${pct(s.planAt(td))} · เสร็จตามแผน ${thDL(s.fin)}`,...p.tasks.map(t=>{const r=s.R[t.id];return `- ${t.name}: ${thD(r.es)} – ${thD(r.ef)} · ${n(t.pct)}%${r.crit?' · วิกฤต':''}`})]:['- ยังไม่มีแผนงาน']),'',
    '## เรื่องค้าง',`- RFI รอคำตอบ ${open.rfi.length}: ${open.rfi.map(r=>`${r.no||''} ${r.q||r.subj||''}`.trim()).join(' / ')}`,`- VO รออนุมัติ ${open.vo.length}: ${open.vo.map(v=>`${v.no} ${v.desc} ${fmt(v.amt)} บาท`).join(' / ')}`,
    `- NCR เปิดอยู่ ${open.ncr.length}`,`- Punch list ค้าง ${open.punch.length}`,`- PO ที่ของยังไม่ครบ ${open.po.length}: ${open.po.map(po=>po.no).join(', ')}`,'',
    '## รายงานประจำวันล่าสุด',...(p.daily||[]).slice().sort((a,b)=>String(b.date).localeCompare(String(a.date))).slice(0,5).map(d=>`- ${thD(d.date)}: ${String(d.work||'').replace(/\n/g,' ')}${d.issue?` · ปัญหา: ${String(d.issue).replace(/\n/g,' ')}`:''}`),''];
  const json={project:p.name,info:{client:I.client,contractNo:I.contractNo,site:I.site,start:I.start,finish:I.finish,value:C.total},boq:p.boq.items.map(i=>({group:gName(i.g),item:itemName(i),unit:i.unit,qty:n(i.q),total:n(i.t)})),
    tasks:p.tasks.map(t=>({name:t.name,start:s&&s.R[t.id].es,finish:s&&s.R[t.id].ef,pct:n(t.pct)}))};
  return md.join('\n')+'\n## ข้อมูลดิบ (JSON)\n```json\n'+JSON.stringify(json,null,1)+'\n```\n'})}
ACT.aiCtx=b=>{const p=DB.projects[b.dataset.p]||P;if(!p)return;download(`AI-${p.name.replace(/[\\/:*?"<>|]/g,'_')}-${today()}.md`,aiContext(p),'text/markdown');toast('ดาวน์โหลดแล้ว อัปโหลดไฟล์นี้เป็นความรู้ของ AI-โครงการ ใน Claude')};
{const f=VIEWS.dash;VIEWS.dash=()=>f()+`<section class="card"><h2><span>ข้อมูลโครงการสำหรับ AI</span><small>ไฟล์สรุปสัญญา ขอบเขตงาน แผนงาน และเรื่องค้าง สำหรับอัปโหลดเป็นความรู้ใน Claude Project ของ AI-โครงการ</small><span class="sp"></span><button type="button" class="btn sm" data-a="aiCtx" data-p="${P.id}">ดาวน์โหลดไฟล์สำหรับ AI</button></h2></section>`}

// demo: the eight AI members and a few documents in draft / checked states
{const f=ACT.loadDemo;ACT.loadDemo=b=>{const r=f(b);if(!aiList().length){ACT.aiSeed.call(null);const L=aiList(),by=d=>L.find(a=>a.dept===d)?.id;
  const q=CO().quotes[CO().quotes.length-1];if(q&&!q.ai){q.ai={by:by('SAL'),at:today()};if(q.status==='sent'||q.status==='won')q.status='draft'}
  projects().forEach(p=>{const pr=(p.prs||[])[(p.prs||[]).length-1];if(pr&&!pr.ai)pr.ai={by:by('PUR'),at:today(),rev:{by:'คุณสมชาย',at:today()}};
    const dl=(p.daily||[])[(p.daily||[]).length-1];if(dl&&!dl.ai)dl.ai={by:by('PRJ'),at:today()}});save();render()}return r}}
document.head.insertAdjacentHTML('beforeend',`<style>
.ai-b{display:inline-grid;place-items:center;min-width:22px;height:18px;padding:0 5px;border-radius:6px;font-size:10.5px;font-weight:800;letter-spacing:.04em;color:#fff;background:linear-gradient(135deg,#7C5CFF,#2A9DAB);vertical-align:middle}
.ai-w{display:inline-flex;gap:6px;align-items:center;margin-right:6px;flex-wrap:wrap}
.ai-chip{display:inline-flex;gap:6px;align-items:center;font-size:12.5px;border-radius:999px;padding:3px 10px 3px 4px;border:1px solid var(--line);background:var(--sunk);white-space:nowrap}
.ai-chip.wait{border-color:color-mix(in srgb,#E0A100 55%,var(--line));background:color-mix(in srgb,#E0A100 12%,var(--surface))}
.ai-chip.ok{border-color:color-mix(in srgb,var(--good) 45%,var(--line))}
.ai-mk{font-size:12px;opacity:.8}
.ai-org{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:10px}
.ai-c{display:grid;gap:2px;padding:10px 12px;border:1px solid var(--line);border-radius:14px;background:var(--sunk)}.ai-c small{color:var(--muted)}
@media print{.ai-wm{position:fixed;top:42%;left:0;right:0;text-align:center;font-size:110px;font-weight:800;color:rgba(200,40,40,.13);transform:rotate(-24deg);pointer-events:none;z-index:9}
 .ai-pl{margin-top:10px;font-size:11px;color:#555;border-top:1px dashed #bbb;padding-top:5px}}
@media screen{.ai-wm,.ai-pl{display:none}}
</style>`);
