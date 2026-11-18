/* ---------- 4.99.39 งานที่ N in the งาน list only (user: "คำว่างานที่ เอาออกเลยดีไหม" … "ให้เหลือไว้แค่ตรงนี้เพื่อให้ดูง่ายดีไหม") ----------
   Job names stay as the customer writes them (no "งานที่ 1 :" in the name, quotes or prints). The งาน list under a project
   (911 pjJobs, .pj-job) shows "งานที่ N : name" instead, N fixed per job in P.jn: a name that still starts with "งานที่ N" keeps
   that N, the others get the next free number in creation order. Once given, N stays when the name is changed. */
const jnRx=/^งานที่\s*(\d+)\s*[:：.\-–]?\s*/;
function jnSet(L){let ch=0;const used=new Set(L.map(p=>p.jn).filter(Boolean));
  L.forEach(p=>{if(p.jn)return;const m=String(pjSplit(p).job||'').match(jnRx),n=m&&+m[1];if(n&&!used.has(n)){p.jn=n;used.add(n);ch=1}});
  L.filter(p=>!p.jn).sort((a,b)=>String(a.created||'').localeCompare(String(b.created||''))).forEach(p=>{let n=1;while(used.has(n))n++;p.jn=n;used.add(n);ch=1});
  return ch}
let jnSave=0;
{const f=pjJobs;pjJobs=function(sel){const x=f.apply(this,arguments);try{
  const host=sel&&(sel.closest('label')||sel),lb=host&&host.nextElementSibling,s=lb&&lb.classList.contains('pj-jobl')&&lb.querySelector('select.pj-job');if(!s)return x;
  const L=[...s.options].map(o=>DB.projects[o.value]).filter(Boolean);if(L.length<2)return x;
  if(jnSet(L)&&!jnSave){jnSave=1;setTimeout(()=>{jnSave=0;save()},0)}
  const O=[...s.options].sort((a,b)=>{const p=DB.projects[a.value],q=DB.projects[b.value];return (!!p.closed-!!q.closed)||p.jn-q.jn});
  O.forEach(o=>{const p=DB.projects[o.value];o.textContent=`งานที่ ${p.jn} : ${pjJobName(p).replace(jnRx,'')}`;s.appendChild(o)});
  }catch(e){}return x}}
