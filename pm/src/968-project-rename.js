/* ---------- 4.99.5 โครงการ กับ งาน are real fields, everywhere (user: "หน้าโครงงาน กับงานแก้ไม่ได้หรอ",
   "โครงการเดียวกัน มีหลายงานก็แยก แบบ INSEE", "ต้องแก้ทั้งโปรแกรม ไม่งั้นหน้างานก็จะมัว บัญชีก็จะมัว") ----------
   Each job stays its own record (its own contract, BOQ, claims, purchasing, accounting), as before. Until now its project
   was only guessed from the text before " - " in its name. Now every job carries p.proj (โครงการ) and p.job (งาน); p.name
   stays "โครงการ - งาน" so everything that shows a name keeps working. Code that still renames by name (another device on
   an older version, ตั้งชื่อแยก, + งานย่อย) is noticed through p._nm, the name as last written here, and the two fields are
   read again from the new name. The first time, a job named only after its project takes its งาน from the title of the
   quotation it was won from (as 4.99.4 printed it), and is renamed "โครงการ - งาน".
   - every project picker in the program lists a project once and its jobs under it (the side menu as in 3.99, other lists
     grouped by project);
   - "✎ แก้ชื่อ" beside the picker edits โครงการ / งาน of every job in one list (moving a job under another project), with
     ยกเลิก / ลบ… for entries no longer wanted;
   - ได้งาน → สร้างโครงการใหม่ asks which project the new job belongs to, the customer's project first. */
const pjCombine=(a,b)=>{a=String(a||'').trim();b=String(b||'').trim();return a&&b&&pjKey(a)!==pjKey(b)?`${a} - ${b}`:a||b};
// from the name alone (q: also the won quotation's title, for a job never read before)
function pjFromName(p,q){const nm=String(p&&p.name||'').trim(),m=nm.match(PJ_SEP);
  if(m&&m.index)return {pj:nm.slice(0,m.index).trim(),job:nm.slice(m.index+m[0].length).trim()};
  const Q=q&&p&&(CO().quotes||[]).find(x=>x.pj===p.id),t=Q?String(Q.title||'').trim():'';
  if(t&&!pjKey(nm).includes(pjKey(t))&&!pjKey(t).includes(pjKey(nm)))return {pj:nm,job:t};
  return {pj:nm,job:''}}
const pjInStep=p=>typeof p.proj==='string'&&p._nm===String(p.name||'').trim();
function pjSetNames(p,a,b){a=String(a||'').trim();b=String(b||'').trim();if(b&&pjKey(a)===pjKey(b))b='';if(!a){a=b;b=''}
  p.proj=a;p.job=b;p.name=p._nm=pjCombine(a,b)}
function pjSync(p){if(!p||pjInStep(p))return false;const F=pjFromName(p,p._nm===undefined);pjSetNames(p,F.pj,F.job);return true}
function pjSyncAll(){let ch=0;Object.values(DB.projects||{}).forEach(p=>{if(pjSync(p))ch=1});return ch}
{const r=render;render=function(){try{if(DB&&pjSyncAll())save()}catch(e){}return r.apply(this,arguments)}}
// the project and the job of a job record (4.99.4's pjJob, now from the fields)
pjJob=function(p){p=p||P;if(!p)return {pj:'',job:''};const F=pjInStep(p)?{pj:p.proj,job:p.job}:pjFromName(p,p._nm===undefined);
  return F.job?{pj:F.pj,job:F.job}:{pj:'',job:F.pj}};
// 3.99's grouping (side menu, ทุกโครงการ, the job list) reads the fields too
pjSplit=function(p){const J=pjJob(p);return J.pj?{base:J.pj,job:J.job}:{base:J.job,job:''}};
pjJobName=function(p){let j=pjSplit(p).job||'งานหลัก';if(pjDup(p).length)j+=` (${pjTag(p)})`;return p.closed?j+' · ปิดแล้ว':j};

/* --- every other project picker: one group per project with its jobs inside --- */
function pjGroupSel(s){if(s.dataset.pjg||s.id==='sbProj'||s.id==='projSel'||s.classList.contains('pj-job')||s.querySelector('optgroup'))return;
  const O=[...s.options],ids=O.filter(o=>o.value&&DB.projects[o.value]);if(ids.length<2||ids.length<O.filter(o=>o.value).length)return;
  const G=new Map();ids.forEach(o=>{const k=pjGk(DB.projects[o.value]);(G.get(k)||G.set(k,[]).get(k)).push(o)});
  if(![...G.values()].some(L=>L.length>1))return;const v=s.value;s.dataset.pjg='1';
  const top=O.filter(o=>!ids.includes(o)),frag=document.createDocumentFragment();top.forEach(o=>frag.appendChild(o));
  G.forEach(L=>{if(L.length<2){frag.appendChild(L[0]);return}const g=document.createElement('optgroup');g.label=pjSplit(DB.projects[L[0].value]).base;
    L.forEach(o=>{const p=DB.projects[o.value],x=o.textContent.replace(String(p.name),'').trim();o.textContent=(pjSplit(p).job||'งานหลัก')+(x?' '+x:'');g.appendChild(o)});frag.appendChild(g)});
  s.innerHTML='';s.appendChild(frag);s.value=v}
const pjGroupAll=()=>document.querySelectorAll('#view select,#dlg select,#side select').forEach(s=>{try{pjGroupSel(s)}catch(e){}});
{const r=render;render=function(){const x=r.apply(this,arguments);pjGroupAll();return x}}
{const f=dialog;dialog=function(){const x=f.apply(this,arguments);pjGroupAll();return x}}

/* --- ✎ แก้ชื่อ: every job's โครงการ and งาน in one list --- */
function pjRenRows(){const L=Object.values(DB.projects).map(p=>{const s=pjSplit(p);return {p,pj:s.base,job:s.job}});
  return L.sort((a,b)=>(!!a.p.closed-!!b.p.closed)||a.pj.localeCompare(b.pj,'th')||a.job.localeCompare(b.job,'th'))}
ACT.pjRenAll=()=>{if(typeof pjCan==='function'&&!pjCan()){toast('ต้องเป็นฝ่ายที่แก้ข้อมูลโครงการได้');return}
  const R=pjRenRows(),bases=[...new Set(R.map(r=>r.pj).filter(Boolean))];let last=null;
  dialog('แก้ชื่อโครงการและงาน',`<p class="hint" style="margin-top:0">งานที่ใส่ชื่อโครงการเดียวกันจะอยู่ใต้โครงการนั้น (เลือกโครงการแล้วเลือกงาน) · ย้ายงานไปอยู่ใต้โครงการอื่น: พิมพ์หรือเลือกชื่อโครงการนั้นในช่องโครงการ · หนังสือเบิกงวดเขียนว่า “ขอเบิกเงินค่างาน &lt;งาน&gt; โครงการ &lt;โครงการ&gt;”</p>
  <datalist id="pjRenL">${bases.map(b=>`<option value="${esc(b)}">`).join('')}</datalist>
  <div class="tw"><table class="pjren"><thead><tr><th>โครงการ</th><th>งาน</th><th></th></tr></thead><tbody>${R.map(r=>{const g=last!==null&&pjKey(last)!==pjKey(r.pj);last=r.pj;
    return `<tr${g?' class="pjren-g"':''}><td><input data-rn="${r.p.id}" data-k="pj" list="pjRenL" value="${esc(r.pj)}" data-o="${esc(r.pj)}" aria-label="ชื่อโครงการ"></td>
    <td><input data-rn="${r.p.id}" data-k="job" value="${esc(r.job)}" data-o="${esc(r.job)}" placeholder="(ไม่มีชื่องาน)" aria-label="ชื่องาน"></td>
    <td style="white-space:nowrap">${r.p.id===P.id?'<span class="pill">เปิดอยู่</span> ':''}${r.p.closed?'<span class="pill">ปิดแล้ว</span> ':''}<button type="button" class="btn sm ghost" data-a="pjMg" data-id="${r.p.id}">ยกเลิก / ลบ…</button></td></tr>`}).join('')}</tbody></table></div>`,
  `<button type="button" class="btn pri" data-a="pjRenAllGo">บันทึกชื่อ</button>`);dlgWide(true)};
ACT.pjRenAllGo=()=>{const C={};document.querySelectorAll('#dlg input[data-rn]').forEach(i=>{const o=C[i.dataset.rn]=C[i.dataset.rn]||{};o[i.dataset.k]=i.value.trim();if(i.value.trim()!==i.dataset.o)o.ch=1});
  const N={};for(const [id,o] of Object.entries(C)){if(!o.ch||!DB.projects[id])continue;if(!o.pj&&!o.job){toast('ใส่ชื่อโครงการให้ครบ');return}N[id]=[o.pj||o.job,o.pj?o.job:'']}
  if(!Object.keys(N).length){$('#dlg').close();return}
  const all=Object.values(DB.projects).map(p=>pjKey(N[p.id]?pjCombine(...N[p.id]):p.name)),dup=all.find((k,i)=>all.indexOf(k)!==i);
  if(dup){toast('มีโครงการและงานชื่อซ้ำกัน ใส่ชื่องานให้ต่างกัน');return}
  Object.entries(N).forEach(([id,[a,b]])=>pjSetNames(DB.projects[id],a,b));$('#dlg').close();save();render();toast(`แก้ชื่อแล้ว ${Object.keys(N).length} รายการ`)};
// the button beside the picker (side menu, the phone card) and on ทุกโครงการ
function pjRenBtn(){const b=document.querySelector('#side .pj-jobb');if(b&&!b.querySelector('[data-a="pjRenAll"]'))b.insertAdjacentHTML('beforeend','<button type="button" class="btn sm ghost" data-a="pjRenAll" title="แก้ชื่อโครงการและงาน ย้ายงาน หรือลบรายการ" aria-label="แก้ชื่อโครงการและงาน">✎</button>');
  document.querySelectorAll('#view label.mob-pj').forEach(l=>{const n=l.nextElementSibling&&l.nextElementSibling.classList.contains('pj-jobl')?l.nextElementSibling:l;
    if(!(n.nextElementSibling&&n.nextElementSibling.dataset.a==='pjRenAll'))n.insertAdjacentHTML('afterend','<button type="button" class="btn sm ghost" data-a="pjRenAll">✎ แก้ชื่อโครงการ / งาน</button>')})}
{const r=render;render=function(){const x=r.apply(this,arguments);try{pjRenBtn()}catch(e){}return x}}
{const f=sbDraw;sbDraw=function(){const x=f.apply(this,arguments);try{pjRenBtn();pjGroupAll()}catch(e){}return x}}
{const f=VIEWS.pjall;if(f)VIEWS.pjall=function(){const h=f.apply(this,arguments);return h.replace(/(<h2>[\s\S]*?)(<\/h2>)/,'$1<button type="button" class="btn sm" data-a="pjRenAll">✎ แก้ชื่อโครงการ / งาน</button>$2')}}

/* --- ได้งาน → สร้างโครงการใหม่: which project the new job belongs to --- */
{const f=ACT.qWonDlg;ACT.qWonDlg=b=>{f(b);const Q=CO().quotes.find(q=>q.id===b.dataset.id),r=document.querySelector('#dlg input[name=qwT][value="new"]');if(!Q||!r||Q.pj&&DB.projects[Q.pj])return;
  const L=pjOpen(),B=[...new Set(L.map(p=>pjSplit(p).base).filter(Boolean))].sort((a,c)=>a.localeCompare(c,'th'));if(!B.length)return;
  const mine=Q.cust&&L.find(p=>p.info.cust===Q.cust),pn=pjName(Q.pname),def=pn?B.find(x=>pjKey(x)===pjKey(pn))||'':mine?pjSplit(mine).base:'';
  const e=document.querySelector('#dlg p'),t=String(Q.title||'').trim();if(e&&t&&!pn)e.innerHTML=e.innerHTML.replace(/ชื่อโครงการ “[^”]*”/,`งาน “${esc(t)}”`);
  r.closest('label').insertAdjacentHTML('afterend',`<label class="row" style="gap:8px;margin:0 0 8px 26px;align-items:center;flex-wrap:wrap">เป็นงานในโครงการ <select id="qwBase" style="max-width:320px"><option value="">โครงการใหม่ (แยกต่างหาก)</option>${B.map(x=>`<option value="${esc(x)}"${x===def?' selected':''}>${esc(x)}</option>`).join('')}</select></label>`)}}
{const f=ACT.qWonGo;ACT.qWonGo=b=>{const Q=CO().quotes.find(q=>q.id===b.dataset.id),r=document.querySelector('input[name=qwT]:checked'),base=((!r||r.value==='new')&&($('#qwBase')||{}).value||'').trim(),had=Q&&Q.pj;f(b);
  const p=Q&&base&&Q.pj&&Q.pj!==had&&DB.projects[Q.pj];if(!p)return;const job=String(Q.title||'').trim()||pjName(Q.pname)||Q.no;
  pjSetNames(p,base,pjKey(job)===pjKey(base)?Q.no:job);if(pjDup(p).length)pjSetNames(p,base,`${p.job} (${Q.no})`);save();render();toast(`เพิ่มเป็นงานในโครงการ ${base} แล้ว`)}}

document.head.insertAdjacentHTML('beforeend',`<style>.pjren{width:100%}.pjren td{padding:3px 4px}.pjren input{width:100%;min-width:180px;border:1px solid var(--line);border-radius:8px;padding:6px 8px;background:var(--surface,#fff);color:inherit}.pjren tr.pjren-g td{border-top:2px solid var(--line)}
.pj-jobb .btn[data-a="pjRenAll"]{flex:0 0 auto}</style>`);
Object.assign(SBKW,{'pj.setup':(SBKW['pj.setup']||'')+' แก้ชื่อโครงการ เปลี่ยนชื่อโครงการ แก้ชื่องาน ย้ายงาน'});

/* --- ใบเสนอราคา: a โครงการ column and a project filter (user: "ตรงนี้เพิ่มช่องโครงการเข้าไปด้วยดีไหม") --- */
// the project of a quotation: the one it was won into, else its own โครงการ box
function qPjOf(q){const p=q&&q.pj&&DB.projects[q.pj];return p?pjSplit(p).base:pjName(q&&q.pname||'')}
function qPjFilter(L){const M=new Map();L.forEach(q=>{const v=qPjOf(q);if(v&&!M.has(pjKey(v)))M.set(pjKey(v),v)});if(!M.size)return '';
  const O=[...M.entries()].sort((a,b)=>a[1].localeCompare(b[1],'th')),cur=S.qPjF||'';
  return ` <select id="qPjF" aria-label="โครงการ" style="max-width:280px;margin-left:8px"><option value="">ทุกโครงการ</option>${O.map(([k,v])=>`<option value="${esc(k)}"${k===cur?' selected':''}>${esc(v)} (${L.filter(q=>pjKey(qPjOf(q))===k).length})</option>`).join('')}<option value="-"${cur==='-'?' selected':''}>ยังไม่ระบุโครงการ (${L.filter(q=>!qPjOf(q)).length})</option></select>`}
document.addEventListener('change',e=>{if(e.target.id!=='qPjF')return;S.qPjF=e.target.value;render()});
