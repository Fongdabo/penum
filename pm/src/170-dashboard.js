/* ---------- dashboard ---------- */
// the overview's headline numbers for one project; the all-projects page (3.64) uses the same function so both always agree
function pjKpi(p){return withP(p,()=>{
  const s=sched(),td=today(),C=contract(),{T}=costTable(),act=s.act(),plan=s.planAt(td);
  const bl=P.bills.map(b=>[b,billCalc(b)]),work=sum(bl.filter(([b])=>b.status!=='draft'&&(b.kind||'prog')==='prog'),x=>x[1].amt),billed=sum(bl.filter(([b])=>b.status!=='draft'),x=>x[1].net),recv=sum(bl.filter(([b])=>b.status!=='draft'),([b])=>billRecv(b));
  return {s,td,C,T,act,plan,work,billed,recv}})}
VIEWS.dash=()=>{
  const {s,td,C,T,act,plan,work,billed,recv}=pjKpi(P);
  const lateDl=P.pos.filter(p=>poState(p).k==='bad'),openRfi=(P.rfis||[]).filter(r=>r.status!=='closed'&&r.status!=='ans'),pendSub=(P.subm||[]).filter(r=>okD(r.date)&&r.status==='pending'),openPunch=(P.punch||[]).filter(r=>r.status!=='done');
  const up=[];
  P.tasks.forEach(t=>{const r=s.R[t.id];if(n(t.pct)<100&&r.es>=td&&r.es<=addD(td,14))up.push([r.es,'เริ่มงาน',t.name]);if(n(t.pct)<100&&r.ef<td)up.push([r.ef,'<span class="pill bad">งานล่าช้า</span>',t.name])});
  P.pos.forEach(p=>{const st=poState(p);if(st.k!=='ok'&&okD(p.due)&&p.due<=addD(td,14))up.push([p.due,st.k==='bad'?'<span class="pill bad">ของส่งช้า</span>':'ของเข้าหน้างาน',`${p.no} ${vName(p.vid)}`])});
  P.prs.forEach(r=>{if(!r.po&&okD(r.need)&&r.need<=addD(td,14))up.push([r.need,'<span class="pill warn">ต้องสั่งซื้อ</span>',`${r.no} (${r.items.length} รายการ)`])});
  (P.inst||[]).forEach(x=>{if(!x.task||P.bills.some(b=>b.inst===x.id))return;const r=s.R[x.task];if(r&&r.es<=addD(td,14))up.push([r.es,'ถึงงวดเบิก',`งวด ${x.no} ${x.desc}`])});
  up.sort((a,b)=>a[0].localeCompare(b[0]));
  const I=P.info,el=okD(I.start)&&okD(I.finish)?Math.max(0,Math.min(100,diffD(I.start,td)*100/Math.max(1,diffD(I.start,I.finish)))):null;
  return `<section class="card" style="padding:14px 16px"><div class="row" style="justify-content:space-between"><div><h2 style="font-size:20px">${esc(P.name)}</h2><div class="muted">${[I.client,I.site,I.contractNo&&'สัญญา '+I.contractNo].filter(Boolean).map(esc).join(' · ')||'ยังไม่ได้ใส่ข้อมูลโครงการ'}</div></div>
    <div class="muted" style="text-align:right">${okD(I.start)?`${thD(I.start)} – ${thD(I.finish)}`:''}${el!=null?`<br>เวลาผ่านไป ${fmt(el,0)}%`:''}</div></div>
    ${!P.boq.items.length?`<div class="row" style="margin-top:12px"><span class="hint" style="margin:0">เริ่มต้นโดยดึง BOQ จาก PENUM MEP หรือเปิดโครงการตัวอย่างเพื่อลองใช้</span><button type="button" class="btn pri" data-a="tab" data-k="setup">ดึง BOQ</button><button type="button" class="btn" data-a="loadDemo">เปิดโครงการตัวอย่าง</button></div>`:''}</section>
  <dl class="stats">
    <div><dt>มูลค่าสัญญา</dt><dd>${fmt(C.total)} <small>บาท</small></dd>${C.vo?`<small class="muted">งานเพิ่มลด ${C.vo>0?'+':''}${fmt(C.vo)}</small>`:''}</div>
    <div><dt>ความคืบหน้า จริง / แผน</dt><dd>${pct(act)} <small>/ ${pct(plan)}</small></dd><div class="bar"><i style="width:${Math.min(100,act)}%;${act<plan-0.5?'background:var(--danger)':''}"></i></div></div>
    <div><dt>ต้นทุนผูกพัน / งบ</dt><dd>${T.bud?fmt(T.com*100/T.bud,0):0}% <small>${fmt(T.com)}</small></dd><div class="bar"><i style="width:${T.bud?Math.min(100,T.com*100/T.bud):0}%"></i></div><small class="muted">งบ ${fmt(T.bud)} = ค่าของ+ค่าแรงใน BOQ</small></div>
    <div><dt>เบิกแล้ว / รับเงินแล้ว</dt><dd style="font-size:18px">${fmt(billed)} <small>/ ${fmt(recv)}</small></dd><div class="bar"><i style="width:${billed?Math.min(100,recv*100/billed):0}%"></i></div><small class="muted">ยอดสุทธิรวม VAT · เบิกผลงานแล้ว ${C.total?fmt(work*100/C.total,0):0}% ของสัญญา</small></div>
    <div><dt>กำไรขั้นต้นคาดการณ์</dt><dd style="color:${C.total-T.fc>=0?'var(--good)':'var(--danger)'}">${C.total?fmt((C.total-T.fc)*100/C.total,1):'0'}% <small>${fmt(C.total-T.fc)}</small></dd><small class="muted" title="ต้นทุนคาดการณ์ = แต่ละหมวดใช้ค่าที่มากกว่าระหว่างงบ BOQ กับต้นทุนผูกพัน">สัญญา − ต้นทุนคาดการณ์ ${fmt(T.fc)}${C.total&&T.bud>C.total?' · งบ BOQ สูงกว่าสัญญา':''}</small></div></dl>
  <div class="grid2">
    <section class="card"><h2><span>S-Curve งานเทียบเงิน</span><span class="sp"></span><button type="button" class="btn sm" data-a="tab" data-k="sched">เปิดแผนงาน</button></h2>${scurve(640,240)}</section>
    <section class="card"><h2><span>ต้องติดตามใน 14 วัน</span></h2>
      ${up.length?`<div class="tw"><table><tbody>${up.slice(0,14).map(([d,k,t])=>`<tr><td style="white-space:nowrap">${thD(d)}</td><td>${k}</td><td>${esc(t)}</td></tr>`).join('')}</tbody></table></div>`:'<p class="empty">ไม่มีรายการ</p>'}
      <dl class="stats" style="margin-top:12px;grid-template-columns:repeat(auto-fit,minmax(110px,1fr))"><div><dt>ของส่งช้า</dt><dd>${lateDl.length}</dd></div><div><dt>RFI ค้างตอบ</dt><dd>${openRfi.length}</dd></div><div><dt>เอกสารรออนุมัติ</dt><dd>${pendSub.length}</dd></div><div><dt>งานค้าง Punch</dt><dd>${openPunch.length}</dd></div></dl></section></div>`;
};

/* not built yet */
['site','docs','hand'].forEach(k=>{VIEWS[k]=VIEWS[k]||(()=>`<section class="card"><h2>${TABS.find(t=>t[0]===k)[1]}</h2><p class="hint">ส่วนนี้กำลังทำ จะมาในรุ่นถัดไป</p></section>`)});
HOOK.push((p,v)=>{if(p==='info.cust'&&v){const c=DB.co.customers.find(x=>x.id===v);if(c)P.info.client=c.name}});

