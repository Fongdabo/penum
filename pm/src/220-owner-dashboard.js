/* ---------- owner dashboard across projects ---------- */
function pjSummary(p){return withP(p,()=>{const s=sched(),td=today(),C=contract(),{T}=costTable(),bl=p.bills.map(b=>[b,billCalc(b)]);
  const work=sum(bl.filter(([b])=>b.status!=='draft'&&(b.kind||'prog')==='prog'),x=>x[1].amt),billed=sum(bl.filter(([b])=>b.status!=='draft'),x=>x[1].net),recv=sum(bl.filter(([b])=>b.status!=='draft'),([b])=>billRecv(b)),ar=sum(bl.filter(([b])=>b.status!=='draft'),([b,c])=>Math.max(0,c.net-billRecv(b)));
  const act=p.tasks.length?s.act():0,plan=p.tasks.length?s.planAt(td):0;
  return {p,C,act,plan,T,margin:C.total-T.fc,billed,recv,ar,issues:p.rfis.filter(r=>r.status==='open').length+p.punch.filter(r=>r.status!=='done').length+p.pos.filter(x=>poState(x).k==='bad').length,done:act>=99.9&&p.tasks.length}})}
// 4.99.7 jobs of one project sit under a project row with the project's totals (fold it with the ▾); one job, one row as before
const exRow=(r,nm)=>`<tr${nm?' class="ex-job"':''}><td class="ex-nm"><button type="button" class="btn ghost sm" data-a="go" data-m="pj" data-k="dash" data-p="${r.p.id}"><b>${nm||pjCell(r.p)}</b></button></td><td>${esc(r.p.info.client||'')}</td><td class="r">${fmt(r.C.total)}</td>
    <td class="r"><span class="pill ${r.done?'ok':r.act<r.plan-5?'bad':r.act<r.plan-0.5?'warn':'ok'}">${fmt(r.act,0)}% / ${fmt(r.plan,0)}%</span></td><td class="r">${r.T.bud?fmt(r.T.com*100/r.T.bud,0)+'%':'–'}</td><td class="r" style="color:${r.margin<0?'var(--danger)':'inherit'}">${fmt(r.margin)} <small class="muted">${r.C.total?fmt(r.margin*100/r.C.total,1)+'%':''}</small></td>
    <td class="r">${fmt(r.billed)}</td><td class="r">${fmt(r.recv)}</td><td class="r">${r.ar?fmt(r.ar):''}</td><td class="r">${r.issues||''}</td></tr>`;
function exRows(R){const M=new Map();R.forEach(r=>{const k=pjGk(r.p);(M.get(k)||M.set(k,[]).get(k)).push(r)});
  return [...M.entries()].map(([k,L])=>{if(L.length<2)return exRow(L[0]);const fo=(S.exFold||{})[k],t=f=>sum(L,f),c=t(r=>r.C.total),m=t(r=>r.margin),w=r=>c?r.C.total/c:1/L.length;
    const act=sum(L,r=>r.act*w(r)),plan=sum(L,r=>r.plan*w(r)),bud=t(r=>r.T.bud),cs=[...new Set(L.map(r=>r.p.info.client).filter(Boolean))],cl=cs.length>1?`${cs[0]} +${cs.length-1}`:cs[0]||'',is=t(r=>r.issues);
    return `<tr class="ex-pj"><td class="ex-nm"><button type="button" class="qg-hb" data-a="exFold" data-k="${esc(k)}" aria-expanded="${!fo}"><span aria-hidden="true">${fo?'▸':'▾'}</span> <b>${esc(pjSplit(L[0].p).base)}</b> <small class="muted">· ${L.length} งาน</small></button></td><td>${esc(cl)}</td><td class="r"><b>${fmt(c)}</b></td>
      <td class="r"><span class="pill ${act<plan-5?'bad':act<plan-0.5?'warn':'ok'}">${fmt(act,0)}% / ${fmt(plan,0)}%</span></td><td class="r">${bud?fmt(t(r=>r.T.com)*100/bud,0)+'%':'–'}</td><td class="r" style="color:${m<0?'var(--danger)':'inherit'}"><b>${fmt(m)}</b> <small class="muted">${c?fmt(m*100/c,1)+'%':''}</small></td>
      <td class="r"><b>${fmt(t(r=>r.billed))}</b></td><td class="r"><b>${fmt(t(r=>r.recv))}</b></td><td class="r">${t(r=>r.ar)?`<b>${fmt(t(r=>r.ar))}</b>`:''}</td><td class="r">${is||''}</td></tr>${fo?'':L.map(r=>exRow(r,esc(pjJobLbl(r.p)))).join('')}`}).join('')}
ACT.exFold=b=>{const F=S.exFold=S.exFold||{};F[b.dataset.k]=!F[b.dataset.k];render()};
CVIEWS.exec=()=>{
  const R=projects().map(pjSummary),run=R.filter(r=>!r.done),td=today(),C=CO();
  const tot=k=>sum(R,r=>typeof k==='function'?k(r):r[k]),open=C.leads.filter(l=>!['won','lost'].includes(l.stage)),pipe=sum(open,l=>n(l.value)*(l.prob===''||l.prob==null?LPROB[l.stage]:n(l.prob))/100);
  const cf=cashflow(projects()),next=cf.filter(x=>x.k>ym(td)).slice(0,3),cash3=sum(next,x=>x.net);
  const behind=run.filter(r=>r.act<r.plan-5),loss=R.filter(r=>r.margin<0);
  return `<dl class="stats">
    <div><dt>โครงการที่กำลังทำ</dt><dd>${run.length} <small>/ ${R.length} โครงการ</small></dd></div>
    <div><dt>มูลค่างานในมือ (ยังไม่เบิก)</dt><dd>${fmt(sum(run,r=>Math.max(0,r.C.total-r.billed)))}</dd></div>
    <div><dt>กำไรขั้นต้นคาดการณ์รวม</dt><dd style="color:${tot('margin')>=0?'var(--good)':'var(--danger)'}">${fmt(tot('margin'))} <small>${tot(r=>r.C.total)?fmt(tot('margin')*100/tot(r=>r.C.total),1)+'%':''}</small></dd></div>
    <div><dt>ลูกหนี้ค้างรับ</dt><dd>${fmt(tot('ar'))}</dd></div>
    <div><dt>เงินสดสุทธิ 3 เดือนหน้า</dt><dd style="color:${cash3>=0?'var(--good)':'var(--danger)'}">${fmt(cash3)}</dd></div>
    <div><dt>งานขายถ่วงน้ำหนัก</dt><dd>${fmt(pipe)} <small>${open.length} งาน</small></dd></div></dl>
  ${behind.length||loss.length?`<section class="card" style="border-color:var(--danger)"><h2>ต้องดูแล</h2><ul style="margin:0;padding-left:20px">${behind.map(r=>`<li>${esc(r.p.name)} ช้ากว่าแผน ${fmt(r.plan-r.act,1)}%</li>`).join('')}${loss.map(r=>`<li>${esc(r.p.name)} คาดว่าขาดทุน ${fmt(-r.margin)} บาท</li>`).join('')}</ul></section>`:''}
  <section class="card"><h2><span>ทุกโครงการ</span><small>กดชื่อโครงการเพื่อเปิด</small></h2>
  <div class="tw"><table><thead><tr><th>โครงการ</th><th>ลูกค้า</th><th class="r">มูลค่าสัญญา</th><th class="r">คืบหน้า จริง/แผน</th><th class="r">ต้นทุนผูกพัน/งบ</th><th class="r">กำไรคาดการณ์</th><th class="r">เบิกแล้ว <small class="muted">(สุทธิรวม VAT)</small></th><th class="r">รับเงินแล้ว</th><th class="r">ค้างรับ</th><th class="r">เรื่องค้าง</th></tr></thead><tbody>
  ${R.length?exRows(R)
    +`<tr class="tot"><td colspan="2">รวม</td><td class="r">${fmt(tot(r=>r.C.total))}</td><td></td><td></td><td class="r">${fmt(tot('margin'))}</td><td class="r">${fmt(tot('billed'))}</td><td class="r">${fmt(tot('recv'))}</td><td class="r">${fmt(tot('ar'))}</td><td></td></tr>`:'<tr><td colspan="10" class="empty">ยังไม่มีโครงการ</td></tr>'}</tbody></table></div></section>
  <section class="card"><h2><span>กระแสเงินสดทั้งบริษัท</span><span class="sp"></span><button type="button" class="btn sm" data-a="go" data-m="co" data-k="acct" data-s="cf">ดูรายละเอียด</button></h2>${cfChart(cf)}</section>`;
};
['hr','svc'].forEach(k=>{CVIEWS[k]=CVIEWS[k]||(()=>`<section class="card"><h2>${COTABS.find(t=>t[0]===k)[1]}</h2><p class="hint">ส่วนนี้กำลังทำ จะมาในรุ่นถัดไป</p></section>`)});
ACT.qAddRow=b=>{const Q=CO().quotes.find(q=>q.id===b.dataset.id);if(!Q)return;(Q.adds=Q.adds||[]).push({id:uid(),name:'',pct:'',amt:''});save();render()};
ACT.qAddDel=b=>{const Q=CO().quotes.find(q=>q.id===b.dataset.id);if(!Q)return;Q.adds=(Q.adds||[]).filter(a=>a.id!==b.dataset.k);save();render()};

