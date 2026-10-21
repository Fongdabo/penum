/* ---------- 3.99 โครงการเดียว หลายงาน: pick the project first, then the job ----------
   Jobs at one project are named "โครงการ - งาน" (3.32's ตั้งชื่อแยก and a won quote already name them that way).
   When two or more projects share the part before " - ", the project lists show that project once ("ชื่อ · 2 งาน"),
   and a second list งาน right under it picks the job. Nothing in the data changes: every job is still its own project,
   so a name without " - " (or one alone with its prefix) shows exactly as before. "+ งานย่อย" adds a job to the open project. */
const pjSep=/\s+[-–—]\s+/;
function pjSplit(p){const nm=String(p&&p.name||'').trim(),m=nm.match(pjSep);if(!m||!m.index)return {base:nm,job:''};
  return {base:nm.slice(0,m.index).trim(),job:nm.slice(m.index+m[0].length).trim()}}
const pjGk=p=>pjKey(pjSplit(p).base),PJL={};// PJL: the job last opened in each project, so picking the project goes back to it
function pjJobName(p){let j=pjSplit(p).job||'งานหลัก';if(pjDup(p).length)j+=` (${pjTag(p)})`;return p.closed?j+' · ปิดแล้ว':j}
function pjJobs(sel){if(!sel||!P)return;
  // fold the jobs of one project into its first option; the list keeps its own order and its ปิดแล้ว group
  if(!sel.querySelector('option[data-g]')){const G={},seen={};[...sel.options].forEach(o=>{const p=DB.projects[o.value];if(p)(G[pjGk(p)]=G[pjGk(p)]||[]).push(p)});sel._pjG=G;
    [...sel.options].forEach(o=>{const p=DB.projects[o.value];if(!p)return;const k=pjGk(p),L=G[k];if(L.length<2)return;
      if(seen[k]){const g=o.parentNode;o.remove();if(g.tagName==='OPTGROUP'&&!g.children.length)g.remove();return}
      seen[k]=1;o.dataset.g=k;o.textContent=`${pjSplit(p).base} · ${L.length} งาน`})}
  const G=sel._pjG||{},k=pjGk(P),L=G[k];
  sel.querySelectorAll('option[data-g]').forEach(o=>{const M=G[o.dataset.g]||[],cur=M.some(p=>p.id===P.id);
    o.value=cur?P.id:(M.find(p=>p.id===PJL[o.dataset.g])||M.find(p=>!p.closed)||M[0]).id;if(cur)o.selected=true});
  const host=sel.closest('label')||sel,old=host.nextElementSibling;if(old&&old.classList.contains('pj-jobl'))old.remove();
  if(!L||L.length<2)return;
  const J=[...L].sort((a,b)=>(!!a.closed-!!b.closed)||pjJobName(a).localeCompare(pjJobName(b),'th'));
  host.insertAdjacentHTML('afterend',`<label class="pj-jobl${host.tagName==='LABEL'&&host.className?' '+host.className:''}"><span>งาน</span><select class="pj-job" aria-label="งานในโครงการ">${J.map(p=>`<option value="${p.id}"${p.id===P.id?' selected':''}>${esc(pjJobName(p))}</option>`).join('')}</select></label>`)}
function pjJobsAll(){if(P)PJL[pjGk(P)]=P.id;document.querySelectorAll('#sbProj,#projSel').forEach(pjJobs);
  const b=document.querySelector('#side .sb-pj>button[data-a="newProj"]');
  if(b)b.outerHTML=`<div class="pj-jobb"><button type="button" class="btn sm ghost" data-a="newProj">+ โครงการใหม่</button><button type="button" class="btn sm ghost" data-a="pjNewJob" title="เพิ่มงานอีกงานในโครงการที่เปิดอยู่ เช่น งานขายเครื่อง กับ งานติดตั้ง">+ งานย่อย</button></div>`}
{const r=render;render=function(){const x=r.apply(this,arguments);try{pjJobsAll()}catch(e){}return x}}
{const f=sbDraw;sbDraw=function(){const x=f.apply(this,arguments);try{pjJobsAll()}catch(e){}return x}}
document.addEventListener('change',e=>{const s=e.target;if(!s.classList||!s.classList.contains('pj-job')||!DB.projects[s.value])return;
  DB.cur=s.value;P=DB.projects[DB.cur];save();S.sel={};if(s.closest('#side'))ACT.sbClose();render()});
// a new job of the open project: same customer and place, its own contract, BOQ, purchasing and claims
ACT.pjNewJob=()=>{const s=pjSplit(P);
  dialog('เพิ่มงานในโครงการนี้',`<p class="hint">งานใหม่ใช้ลูกค้าและสถานที่เดียวกับโครงการนี้ แต่มีสัญญา BOQ จัดซื้อ และเบิกงวดของตัวเอง เลือกโครงการแล้วเลือกงานได้จากเมนูซ้าย</p>
    <label style="display:flex;flex-direction:column;gap:4px;margin:10px 0"><span>ชื่อโครงการ</span><input id="pjnB" value="${esc(s.base)}"></label>
    <label style="display:flex;flex-direction:column;gap:4px;margin:10px 0"><span>งานที่เปิดอยู่</span><input id="pjnC" value="${esc(s.job)}" placeholder="เช่น งานขายเครื่องปรับอากาศ"></label>
    <label style="display:flex;flex-direction:column;gap:4px;margin:10px 0"><span>งานใหม่</span><input id="pjnN" placeholder="เช่น งานติดตั้งระบบปรับอากาศ"></label>`,
    `<button type="button" class="btn pri" data-a="pjNewJobGo">เพิ่มงาน</button>`);setTimeout(()=>{const i=$('#pjnN');if(i)i.focus()},50)};
ACT.pjNewJobGo=()=>{const v=id=>(($('#'+id)||{}).value||'').trim(),B=v('pjnB'),C=v('pjnC'),N=v('pjnN');
  if(!B||!N){toast('ใส่ชื่อโครงการและชื่องานใหม่');return}if(C&&pjKey(C)===pjKey(N)){toast('ชื่องานซ้ำกับงานที่เปิดอยู่');return}
  P.name=C?`${B} - ${C}`:B;const p=blankProject(`${B} - ${N}`),s=p.info.start,f=p.info.finish;
  p.info=Object.assign(JSON.parse(JSON.stringify(P.info||{})),{contractNo:'',cv:0,cvAuto:1,start:s,finish:f,handover:''});
  DB.projects[p.id]=p;DB.cur=p.id;P=p;S.sel={};$('#dlg').close();save();S.mode='pj';S.tab='setup';render();toast('เพิ่มงานแล้ว ใส่รายละเอียดงานใหม่ได้เลย')};
if(typeof SBKW==='object')SBKW['pj.setup']=(SBKW['pj.setup']||'')+' งานย่อย หลายงาน เลือกงาน เพิ่มงาน งานติดตั้ง งานขาย';
document.head.insertAdjacentHTML('beforeend',`<style>.pj-jobl>span{font-size:12px}.sb-pj .pj-jobl{padding-left:10px;border-left:2px solid var(--accent)}
.pj-jobb{display:flex;gap:6px;flex-wrap:wrap}.pj-jobb .btn{flex:1}#projBox .pj-jobl{display:inline-flex;align-items:center;gap:6px;margin-left:6px;color:var(--muted)}</style>`);
