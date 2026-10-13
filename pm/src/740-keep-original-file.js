/* ---------- 3.26 imported BOQ: keep the original file with the quotation / tender / project so it can be sent again as-is ---------- */
// only the data and numbers are taken into PENUM PM; the outside file itself is stored untouched (IndexedDB, like photos)
const srcHolder=(t,id)=>t==='q'?CO().quotes.find(x=>x.id===id):t==='td'?(typeof tdById==='function'&&tdById(id)):t==='pj'?P.boq:null;
{const f=ACT.impGo;ACT.impGo=b=>{const t=IMP.t,id=IMP.id,file=IMP.file;f(b);const d=$('#dlg');if(!file||(d&&d.open))return;
  if(file.size>25e6){toast('ไฟล์ต้นฉบับใหญ่เกิน 25 MB จึงไม่ได้เก็บไว้ (รายการนำเข้าแล้ว)');return}
  const fr=new FileReader();fr.onload=async()=>{const k='src:'+uid();try{await IDB.put(k,fr.result)}catch(e){toast('เก็บไฟล์ต้นฉบับไม่ได้');return}
    const h=srcHolder(t,id);if(!h)return;if(h.srcFile&&h.srcFile.k)IDB.del(h.srcFile.k).catch(()=>{});
    h.srcFile={k,name:file.name,size:file.size,type:file.type||'',date:today()};save();render()};fr.readAsDataURL(file)}}
ACT.srcOpen=async b=>{const h=srcHolder(b.dataset.t,b.dataset.id),s=h&&h.srcFile;if(!s)return;const v=await IDB.get(s.k);
  if(!v){toast('ไม่พบไฟล์ต้นฉบับในเครื่องนี้ (เก็บไว้ในเครื่องที่นำเข้า)');return}
  const a=document.createElement('a');a.href=v;a.download=s.name;document.body.appendChild(a);a.click();a.remove()};
// a won quotation hands its original file on to the new project's BOQ
{const f=ACT.qWon;ACT.qWon=b=>{const Q=CO().quotes.find(q=>q.id===b.dataset.id),had=Q&&Q.pj&&DB.projects[Q.pj];f(b);
  if(Q&&!had&&Q.srcFile&&Q.pj&&DB.projects[Q.pj]){DB.projects[Q.pj].boq.srcFile=Object.assign({},Q.srcFile);save()}}}
// "ไฟล์ต้นฉบับ" link beside the import button
{const put=()=>document.querySelectorAll('#view [data-a="impFile"]').forEach(x=>{const n2=x.nextElementSibling;if(n2&&n2.dataset.a==='srcOpen')n2.remove();
    const h=srcHolder(x.dataset.t,x.dataset.id),s=h&&h.srcFile;if(!s)return;
    x.insertAdjacentHTML('afterend',`<button type="button" class="btn sm ghost" data-a="srcOpen" data-t="${x.dataset.t}" data-id="${esc(x.dataset.id||'')}" title="นำเข้าเมื่อ ${thDL(s.date)}">📎 ไฟล์ต้นฉบับ: ${esc(s.name)} ↓</button>`)});
  const r=render;render=function(){const x=r.apply(this,arguments);try{put()}catch(e){}return x}}

