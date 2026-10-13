/* ---------- 3.28 ได้งาน: quote data always reaches the project ----------
   Setting the status box to "ได้งาน" used to change only the label, so nothing reached the project.
   Now it opens the same choice as the button: make a new project, or fill a project that already exists
   (e.g. the empty "โครงการแรก"). Add-on rows (SAFETY & CLEANING, OVERHEAD & PROFIT…) come over as their own BOQ lines. */
const QADD_G='ค่าดำเนินการ (ตามใบเสนอราคา)';
// spread add-on rows back out of the item prices into their own lines; totals stay the quote's net
function qAddLines(Q,p){const C=qCalc(Q),A=C.adds.filter(a=>a.v),tA=sum(A,a=>a.v);if(!A.length||!(C.lines+tA))return;
  const f=C.lines/(C.lines+tA),k=C.net/(C.lines+tA);
  withP(p,()=>{const it=P.boq.items.filter(i=>i.g!==QADD_G).map(i=>Object.assign({},i,{t:n(i.t)*f}));
    A.forEach(a=>it.push({id:uid(),g:QADD_G,head:'',type:'',desc:a.name||'ค่าดำเนินการ',unit:'LS',q:1,m:0,l:0,t:a.v*k}));P.boq.items=it})}
{const f=ACT.qWon;ACT.qWon=b=>{const Q=CO().quotes.find(q=>q.id===b.dataset.id),had=Q&&Q.pj&&DB.projects[Q.pj];f(b);
  if(Q&&!had&&Q.pj&&DB.projects[Q.pj]){qAddLines(Q,DB.projects[Q.pj]);save();render()}}}
// a project counts as empty when nothing has been entered into it yet
const pjEmpty=p=>!p.boq.items.length&&!p.bills.length&&!p.tasks.length&&!n(p.info.cv);
ACT.qWonDlg=b=>{const Q=CO().quotes.find(q=>q.id===b.dataset.id);if(!Q)return;
  if(!Q.items.length){toast('ใบเสนอราคายังไม่มีรายการ');return}
  const ps=projects().filter(p=>!p.closed&&!CO().quotes.some(q=>q.pj===p.id&&q.id!==Q.id)),em=ps.find(p=>p.id===DB.cur&&pjEmpty(p))||ps.find(pjEmpty),nm=pjName(Q.pname)||pjName(Q.title)||Q.no;
  dialog('ได้งาน: ส่งข้อมูลเข้าโครงการ',`<p>ส่ง <b>${esc(Q.no)}</b> ชื่อโครงการ “${esc(nm)}” ลูกค้า สถานที่ มูลค่าสัญญา ${fmt(qCalc(Q).net,2)} บาท และ BOQ (ค่าของ ค่าแรง และรายการบวกท้าย) ไปที่</p>
  <label class="row" style="gap:8px;margin:8px 0"><input type="radio" name="qwT" value="new"${em?'':' checked'}> สร้างโครงการใหม่</label>
  ${ps.length?`<label class="row" style="gap:8px;margin:8px 0;align-items:center"><input type="radio" name="qwT" value="old"${em?' checked':''}> ใส่ในโครงการที่มีอยู่
  <select id="qwPj" style="max-width:320px">${ps.map(p=>`<option value="${p.id}"${em&&p.id===em.id?' selected':''}>${esc(p.name)}${pjEmpty(p)?' (ยังว่าง)':''}</option>`).join('')}</select></label>
  <p class="hint">ถ้าโครงการนั้นมี BOQ อยู่แล้ว BOQ จะถูกแทนที่ ส่วนข้อมูลอื่นที่ใส่ไว้ เช่น ใบเบิก รายงานประจำวัน ยังอยู่ครบ</p>`:''}`,
  `<button type="button" class="btn pri" data-a="qWonGo" data-id="${Q.id}">ส่งข้อมูล</button>`)};
// fill an existing project: build the project the normal way, then move its data across and drop the temporary one
function qFillProject(Q,T){const cf=window.confirm;window.confirm=()=>true;let p2;
  try{const keep=Q.pj;Q.pj='';ACT.qWon({dataset:{id:Q.id}});p2=Q.pj&&Q.pj!==T.id&&DB.projects[Q.pj];if(!p2){Q.pj=keep;return false}}finally{window.confirm=cf}
  T.name=p2.name;['client','cust','site','cv','cvAuto'].forEach(k=>T.info[k]=p2.info[k]);
  const meta=Object.assign({},p2.boq);delete meta.items;delete meta.at;
  withP(T,()=>setBoq(p2.boq.items.map(i=>{const x=Object.assign({},i);delete x.id;return x}),meta));T.info.cv=p2.info.cv;
  if(p2.inst.length&&(!T.inst.length||!T.bills.length)){T.inst=p2.inst;T.info.billMode=p2.info.billMode}
  if((p2.sow||[]).length)T.sow=p2.sow;
  delete DB.projects[p2.id];Q.pj=T.id;Q.status='won';DB.cur=T.id;P=T;S.mode='pj';S.tab='dash';S.sel={};return true}
ACT.qWonGo=b=>{const Q=CO().quotes.find(q=>q.id===b.dataset.id),r=document.querySelector('input[name=qwT]:checked');if(!Q)return;
  if(Q.pj&&!DB.projects[Q.pj])Q.pj='';
  if(!r||r.value==='new'){$('#dlg').close();const cf=window.confirm;window.confirm=()=>true;try{ACT.qWon({dataset:{id:Q.id}})}finally{window.confirm=cf}return}
  const T=DB.projects[$('#qwPj').value];if(!T)return;$('#dlg').close();
  if(qFillProject(Q,T)){save();render();toast(`ส่งข้อมูล ${Q.no} เข้าโครงการ “${T.name}” แล้ว`)}};
// already linked: push the quote again (e.g. after editing it)
ACT.qRepush=b=>{const Q=CO().quotes.find(q=>q.id===b.dataset.id),T=Q&&DB.projects[Q.pj];if(!T)return;
  if(!confirm(`ส่งข้อมูลจาก ${Q.no} เข้าโครงการ “${T.name}” อีกครั้ง?\nชื่อ ลูกค้า สถานที่ มูลค่าสัญญา และ BOQ จะถูกแทนที่ด้วยข้อมูลในใบเสนอราคา`))return;
  if(qFillProject(Q,T)){save();render();toast('อัปเดตโครงการจากใบเสนอราคาแล้ว')}};
// the main button opens the choice; when linked, add "ส่งข้อมูลเข้าโครงการอีกครั้ง"
{const f=CVIEWS.sales;CVIEWS.sales=()=>{let h=f();
  h=h.replace(/data-a="qWon" data-id="([^"]+)">ได้งาน → สร้างโครงการ</,'data-a="qWonDlg" data-id="$1">ได้งาน → ส่งเข้าโครงการ<')
    .replace(/(<button type="button" class="btn sm pri" data-a="qWon" data-id="([^"]+)">เปิดโครงการ<\/button>)/,'$1<button type="button" class="btn sm" data-a="qRepush" data-id="$2" title="ใช้เมื่อแก้ใบเสนอราคาหลังได้งาน">ส่งข้อมูลเข้าโครงการอีกครั้ง</button>');
  return h}}
// choosing "ได้งาน" in the status box does the same as the button
HOOK.push((p,v)=>{const m=p.match(/^co\.quotes\.([^.]+)\.status$/);if(!m||v!=='won')return;const Q=CO().quotes.find(x=>x.id===m[1]);
  if(!Q||Q.pj&&DB.projects[Q.pj])return;setTimeout(()=>{if(Q.status==='won'&&!(Q.pj&&DB.projects[Q.pj]))ACT.qWonDlg({dataset:{id:Q.id}})},60)});
// project info page: a won quote that never reached any project can be pulled in from here
{const f=VIEWS.setup;if(f)VIEWS.setup=()=>{const h=f(),qs=CO().quotes.filter(q=>q.status==='won'&&!(q.pj&&DB.projects[q.pj])&&q.items.length);if(!qs.length||P.boq.items.length)return h;
  return `<section class="card" style="border-left:4px solid var(--pri,#0ea5e9)"><h2><span>มีใบเสนอราคาที่ได้งานแล้ว แต่ยังไม่ได้ส่งเข้าโครงการ</span></h2>
  ${qs.map(q=>`<div class="row" style="gap:10px;align-items:center;margin:6px 0"><b>${esc(q.no)}</b><span>${esc(q.pname||q.title||'')}</span><span class="sp"></span><span>${fmt(qCalc(q).net,2)}</span><button type="button" class="btn sm pri" data-a="qPull" data-id="${q.id}">ดึงเข้าโครงการนี้</button></div>`).join('')}</section>`+h}}
ACT.qPull=b=>{const Q=CO().quotes.find(q=>q.id===b.dataset.id);if(!Q)return;if(!confirm(`ดึงข้อมูลจาก ${Q.no} เข้าโครงการ “${P.name}”?\nชื่อโครงการจะเปลี่ยนเป็นชื่อในใบเสนอราคา`))return;
  if(qFillProject(Q,P)){save();render();toast(`ดึงข้อมูล ${Q.no} เข้าโครงการแล้ว`)}};

