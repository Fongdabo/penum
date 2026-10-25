/* ---------- 4.67 ทุกโครงการ: jobs of one project grouped under it ----------
   Jobs at one project are named "โครงการ - งาน" (3.99, 911-project-jobs.js). On ทุกโครงการ they now sit together under one
   project row: contract, claimed and received and expected profit added up, progress weighted by each job's contract value,
   and every job's attention items in one list. Click the project row to fold or open its jobs. A project with one job shows
   as before, and the grand total still adds every open job once, so it does not change. */
const PAG={};// the groups of the last paRows(): first job id -> {k, R}
function paGroup(R){const M=new Map();R.forEach(r=>{const k=pjGk(r.p);(M.get(k)||M.set(k,[]).get(k)).push(r)});
  Object.keys(PAG).forEach(k=>delete PAG[k]);
  // a project sits where its first job would sort, its jobs right under it in their own order
  return [...M.entries()].flatMap(([k,L])=>{if(L.length>1)PAG[L[0].p.id]={k,R:L};return L})}
{const f=paRows;paRows=function(){const o=f.apply(this,arguments);o.R=paGroup(o.R);return o}}
function paSum(L){const O=L.filter(r=>!r.p.closed),U=O.length?O:L,H=U.filter(r=>r.has),tot=f=>sum(U,f);
  const c=tot(r=>r.k.C.total),w=sum(H,r=>r.k.C.total),wt=r=>w?r.k.C.total/w:1/H.length;
  const act=sum(H,r=>r.k.act*wt(r)),plan=sum(H,r=>r.k.plan*wt(r)),late=H.length?plan-act:0;
  const st=U.map(r=>r.I.start).filter(okD).sort()[0],fi=U.map(r=>r.I.finish).filter(okD).sort().pop(),td=today();
  const el=st&&fi?Math.max(0,Math.min(100,diffD(st,td)*100/Math.max(1,diffD(st,fi)))):null;
  const G=new Map();U.forEach(r=>r.att.forEach(a=>{const g=G.get(a.kind);if(g){g.n+=a.n;if(a.lv==='bad')g.lv='bad'}else G.set(a.kind,Object.assign({},a,{pid:r.p.id}))}));
  const att=[...G.values()].sort((a,b)=>(a.lv==='bad'?0:1)-(b.lv==='bad'?0:1)||b.n-a.n);
  const m=tot(r=>r.margin),badN=U.filter(r=>r.lv==='bad').length;let lv=U.map(r=>r.lv).sort((a,b)=>PA_RANK[a]-PA_RANK[b])[0];
  const why=[];if(late>5)why.push(`ช้ากว่าแผน ${fmt(late,1)}%`);if(m<0)why.push('คาดว่าขาดทุน');
  if(why.length&&(lv==='warn'||lv==='ok'||lv==='none'))lv='bad';// the project as a whole is late or losing money, even when no single job is red
  const s=lv==='bad'?(why.length?why.join(' · '):`มี ${badN} งานช้าหรือขาดทุน`):lv==='warn'?(late>0.5?`ช้ากว่าแผน ${fmt(late,1)}%`:'มีเรื่องด่วน'):
    lv==='ok'?(late<-0.5?`เร็วกว่าแผน ${fmt(-late,1)}%`:'ตามแผน'):lv==='done'?'งานเสร็จแล้ว':lv==='closed'?'ปิดโครงการแล้ว':'ยังไม่มีแผนงาน';
  return {U,c,has:H.length>0,act,plan,el,st,fi,att,m,lv,s,vo:tot(r=>r.k.C.vo||0),b:tot(r=>r.k.billed),rv:tot(r=>r.k.recv),wk:tot(r=>r.k.work),
    cl:[...new Set(U.map(r=>r.I.client).filter(Boolean))]}}
function paGRow(id,g){const x=paSum(g.R),fold=!!(S.paFold||{})[g.k],red=x.has&&x.act<x.plan-0.5,k=esc(g.k);
  const pill=`<span class="pill ${x.lv==='closed'||x.lv==='none'?'':x.lv==='done'?'ok':x.lv}">${x.s}</span>`;
  return `<tr class="pa-g pa-${x.lv}${fold?' pa-shut':''}" data-a="paFold" data-g="${k}" title="${fold?'แสดงงานย่อย':'พับงานย่อย'}" aria-expanded="${!fold}">
    <td data-l="โครงการ"><button type="button" class="pa-nm" data-a="paFold" data-g="${k}"><span class="pa-car" aria-hidden="true">${fold?'▸':'▾'}</span>${esc(pjSplit(g.R[0].p).base)}</button>
      <small class="muted">${[x.cl.join(', '),x.st?`${thD(x.st)} – ${thD(x.fi)}`:''].filter(Boolean).map(esc).join(' · ')||'ยังไม่ได้ใส่ข้อมูลโครงการ'}</small><span class="pill pa-n">${g.R.length} งาน</span>${pill}</td>
    <td class="r" data-l="มูลค่าสัญญา"><b>${fmt(x.c)}</b>${x.vo?`<small class="muted">งานเพิ่มลด ${x.vo>0?'+':''}${fmt(x.vo)}</small>`:''}</td>
    <td data-l="ความคืบหน้า จริง / แผน">${x.has?`<div class="pa-v"><b style="${red?'color:var(--danger)':''}">${pct(x.act)}</b> <small>/ ${pct(x.plan)}</small></div><div class="bar pa-bar"><i style="width:${Math.min(100,x.act)}%;${red?'background:var(--danger)':''}"></i><u style="left:${Math.min(100,x.plan)}%" title="แผน ${pct(x.plan)}"></u></div><small class="muted">ถ่วงตามมูลค่าสัญญาของแต่ละงาน</small>`:'<span class="muted">ยังไม่มีแผนงาน</span>'}${x.el!=null?`<small class="muted">เวลาผ่านไป ${fmt(x.el,0)}%</small>`:''}</td>
    <td data-l="เบิกแล้ว / รับเงินแล้ว"><div class="pa-v"><b>${fmt(x.b)}</b> <small>/ ${fmt(x.rv)}</small></div><div class="bar pa-bar"><i style="width:${x.b?Math.min(100,x.rv*100/x.b):0}%"></i></div><small class="muted">เบิกผลงานแล้ว ${x.c?fmt(x.wk*100/x.c,0):0}% ของสัญญา${x.b-x.rv>0.5?` · ค้างรับ ${fmt(x.b-x.rv)}`:''}</small></td>
    <td class="r" data-l="กำไรขั้นต้นคาดการณ์"><b style="color:${x.m>=0?'var(--good)':'var(--danger)'}">${x.c?fmt(x.m*100/x.c,1):'0'}%</b><small class="muted">${fmt(x.m)}</small></td>
    <td data-l="เรื่องที่ต้องดูแล">${x.att.length?`<div class="pa-att">${x.att.slice(0,3).map(a=>`<button type="button" class="pill ${a.lv}" data-a="go" data-m="${a.go.m}" data-k="${a.go.k}"${a.go.s?` data-s="${a.go.s}"`:''} data-p="${a.pid}">${a.kind}${a.n>1?` ${a.n}`:''}</button>`).join('')}${x.att.length>3?`<small class="muted">และอีก ${x.att.length-3} เรื่อง</small>`:''}</div>`:'<span class="muted">ไม่มี</span>'}</td></tr>`}
{const f=VIEWS.pjall;VIEWS.pjall=function(){let h=f.apply(this,arguments);const kid={};
  Object.entries(PAG).forEach(([id,g])=>g.R.forEach(r=>kid[r.p.id]=g));
  h=h.replace(/<tr class="pa-r ([^"]*)"( data-a="go" data-m="pj" data-k="dash" data-p="([^"]+)"[^>]*>)([\s\S]*?<button type="button" class="pa-nm"[^>]*>)([^<]*)<\/button>/g,(m,c,a,id,b,nm)=>{
    const g=kid[id];if(!g)return m;const p=DB.projects[id];
    return `${PAG[id]?paGRow(id,g):''}<tr class="pa-r ${c} pa-kid${(S.paFold||{})[g.k]?' pa-hid':''}"${a}${b}${esc(pjSplit(p).job||p.name)}</button>`});
  // the grand total counts projects, and jobs when some project has more than one
  const n=Object.keys(PAG).length;if(n){const O=projects().filter(p=>!p.closed),G=new Set(O.map(pjGk));
    h=h.replace(`<td>รวม ${O.length} โครงการ`,`<td>รวม ${G.size} โครงการ · ${O.length} งาน`)}
  return h}}
ACT.paFold=b=>{const k=b.dataset.g;S.paFold=S.paFold||{};S.paFold[k]=!S.paFold[k];render()};
document.head.insertAdjacentHTML('beforeend',`<style>
.pa-g{cursor:pointer}
.pa-g td{background:var(--sunk)}
.pa-g.pa-bad td{background:var(--danger-soft)}
.pa-g:hover td{background:var(--line)}
.pa-g.pa-bad td:first-child{box-shadow:inset 4px 0 var(--danger)}
.pa-g.pa-warn td:first-child{box-shadow:inset 4px 0 var(--warn-c)}
.pa-g .pa-nm{font-size:16px}
.pa-car{display:inline-block;width:18px;color:var(--muted)}
.pa-t td .pa-n{margin-right:6px}
.pa-kid td:first-child{padding-left:34px}
.pa-kid .pa-nm{font-size:14px;font-weight:600}
.pa-kid .pa-nm::before{content:'└ ';color:var(--muted);font-weight:400}
.pa-hid{display:none}
@media (max-width:760px){
  .pa-g td{background:none}
  .pa-g{background:var(--sunk)}
  .pa-g.pa-bad{background:var(--danger-soft)}
  .pa-g.pa-bad{box-shadow:inset 4px 0 var(--danger)}
  .pa-g.pa-warn{box-shadow:inset 4px 0 var(--warn-c)}
  .pa-g td:first-child{box-shadow:none!important}
  .pa-kid td:first-child{padding-left:0}
  .pa-t tr.pa-kid{margin-left:16px;border-left:2px solid var(--line)}
  .pa-t tr.pa-hid{display:none}}
</style>`);
if(typeof I18N==='object'&&I18N.en&&I18N.en.x)Object.assign(I18N.en.x,{'แสดงงานย่อย':'Show jobs','พับงานย่อย':'Fold jobs','ถ่วงตามมูลค่าสัญญาของแต่ละงาน':'weighted by each job\'s contract value'});
if(typeof I18N==='object'&&I18N.en&&I18N.en.p)Object.assign(I18N.en.p,{'รวม {0} โครงการ · {1} งาน':'Total {0} projects · {1} jobs','มี {0} งานช้าหรือขาดทุน':'{0} jobs late or losing money'});
