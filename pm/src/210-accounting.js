/* ---------- accounting: receivables, payables, cash flow ---------- */
function billDue(p,b){const c=CO().customers.find(x=>x.id===p.info.cust);return addD(b.date,c?n(c.credit):30)}
function poPayDue(po){const ld=(po.dl||[]).map(d=>d.date).filter(okD).sort().pop();return addD(ld||po.due||po.date,n(po.credit))}
function arRows(){return projects().flatMap(p=>withP(p,()=>p.bills.filter(b=>b.status!=='draft').map(b=>({p,b,c:billCalc(b),due:billDue(p,b)}))))}
function apRows(){return projects().flatMap(p=>withP(p,()=>p.pos.map(po=>({p,po,t:poTotal(po).t,due:poPayDue(po)}))))}
ACT.arPaid=b=>{const p=DB.projects[b.dataset.p],x=p&&p.bills.find(y=>y.id===b.dataset.id);if(!x)return;x.status='paid';x.paid=today();save();render();toast('บันทึกรับเงินแล้ว')};
ACT.apPaid=b=>{const p=DB.projects[b.dataset.p],x=p&&p.pos.find(y=>y.id===b.dataset.id);if(!x)return;x.paid=true;x.paidDate=today();save();render();toast('บันทึกจ่ายเงินแล้ว')};
function cashflow(ps,months=12){
  const td=today(),M={},add=(d,k,v)=>{if(!okD(d)||!v)return;const m=ym(d);(M[m]=M[m]||{in:0,po:0,sub:0,exp:0,fin:0,fout:0})[k]+=v};
  ps.forEach(p=>withP(p,()=>{
    let billed=0;p.bills.forEach(b=>{const c=billCalc(b);if(b.status!=='draft'){const L=withP(p,()=>billRcList(b)),got=sum(L,x=>x.amt);L.forEach(x=>add(x.date,'in',x.amt));if(b.status!=='paid'&&c.net-got>0.005)add(maxD(billDue(p,b),td),'in',c.net-got)}if(b.status!=='draft'&&(b.kind||'prog')==='prog')billed+=c.amt});
    p.pos.forEach(po=>{const t=poTotal(po).t;if(po.paid)add(po.paidDate||po.date,'po',t);else add(maxD(poPayDue(po),td),'po',t)});
    p.spay.forEach(x=>add(x.date,'sub',n(x.amt)));p.costs.forEach(x=>add(x.date,'exp',n(x.amt)));labEntries(p.id).forEach(e=>add(e.date,'exp',e.cost));
    // forecast: unbilled contract and uncommitted budget follow the plan curve
    if(!p.tasks.length)return;const s=sched(),C=contract(),{T}=costTable(),k=1+n(p.info.vat)/100-n(p.info.wht)/100-n(p.info.ret)/100;
    const leftIn=Math.max(0,C.total-billed),leftOut=Math.max(0,T.bud-T.com)+Math.max(0,sum(p.subs,x=>x.value)-sum(p.spay,x=>x.amt)),now=s.planAt(td);
    if(now>=99.9)return;let prev=now;for(let i=0;i<36;i++){const d0=pd(td);d0.setDate(1);d0.setMonth(d0.getMonth()+i+1);const e=iso(new Date(d0-864e5)),v=s.planAt(e<td?td:e),f=(v-prev)/(100-now);prev=v;if(f<=0)continue;
      add(addD(e,30),'fin',leftIn*f*k);add(e,'fout',leftOut*f*1.07);if(v>=99.9)break}
  }));
  const keys=Object.keys(M).sort(),first=keys[0]||ym(td),L=[];let m=pd(first+'-01'),cum=0;const end=keys[keys.length-1]||ym(td);
  while(ym(iso(m))<=end&&L.length<60){const k=ym(iso(m)),r=M[k]||{in:0,po:0,sub:0,exp:0,fin:0,fout:0};const net=r.in+r.fin-r.po-r.sub-r.exp-r.fout;cum+=net;L.push(Object.assign({k,net,cum},r));m.setMonth(m.getMonth()+1)}
  return L;
}
const maxD=(a,b)=>a>b?a:b;
// drawn at about the width it is shown at, so it stays short and the text stays readable; axis in full baht on round steps
const cfNice=v=>{const p=10**Math.floor(Math.log10(v)),f=v/p;return (f<=1?1:f<=2?2:f<=2.5?2.5:f<=5?5:10)*p};
function cfChart(L){if(!L.length)return '';const wd=Math.round(Math.max(560,Math.min(1500,innerWidth>=1000?innerWidth-360:innerWidth-48))),ht=200,l=96,r=10,t=12,bt=28,mx=cfNice(Math.max(1,...L.map(x=>Math.max(Math.abs(x.net),Math.abs(x.cum))))),bw=(wd-l-r)/L.length,Y=v=>t+(ht-t-bt)/2*(1-v/mx),td=ym(today());
  return `<svg class="chart" viewBox="0 0 ${wd} ${ht}" role="img" aria-label="กระแสเงินสดรายเดือน"><line x1="${l}" x2="${wd-r}" y1="${Y(0)}" y2="${Y(0)}" stroke="var(--muted)"/>
  ${[mx,mx/2,-mx/2,-mx].map(v=>`<line x1="${l}" x2="${wd-r}" y1="${Y(v)}" y2="${Y(v)}" stroke="var(--line)"/><text x="${l-6}" y="${Y(v)+4}" text-anchor="end" font-size="10.5" fill="var(--muted)">${fmt(v)}</text>`).join('')}
  ${L.map((x,i)=>`<rect x="${l+i*bw+(bw-Math.min(bw*.64,64))/2}" width="${Math.min(bw*.64,64)}" y="${Math.min(Y(0),Y(x.net))}" height="${Math.max(1,Math.abs(Y(x.net)-Y(0)))}" fill="${x.net>=0?'var(--good)':'var(--danger)'}" opacity="${x.k>td?.45:.85}" rx="2"><title>${thM(x.k)} สุทธิ ${fmt(x.net)}</title></rect>${L.length<=18||i%2===0?`<text x="${l+i*bw+bw/2}" y="${ht-10}" text-anchor="middle" font-size="10.5" fill="var(--muted)">${thM(x.k)}</text>`:''}`).join('')}
  <path d="${L.map((x,i)=>`${i?'L':'M'}${(l+i*bw+bw/2).toFixed(1)},${Y(x.cum).toFixed(1)}`).join('')}" fill="none" stroke="var(--accent)" stroke-width="2.5"/></svg>
  <div class="legend"><span><i style="background:var(--good)"></i>เงินเข้าสุทธิ</span><span><i style="background:var(--danger)"></i>เงินออกสุทธิ</span><span><i style="background:var(--accent)"></i>สะสม</span><span>สีจาง = คาดการณ์</span></div>`}
CVIEWS.acct=()=>{const {cur,html}=subTabs('acct',[['ar','ลูกหนี้ (เงินรับ)'],['ap','เจ้าหนี้ (เงินจ่าย)'],['cf','กระแสเงินสด']]);return html+({ar:acctAR,ap:acctAP,cf:acctCF}[cur])()};
function acctAR(){const td=today(),R=arRows().sort((a,b)=>a.due.localeCompare(b.due)),open=R.filter(x=>x.b.status!=='paid');
  const age=d=>{const k=diffD(d,td);return k<=0?0:k<=30?1:k<=60?2:3},bk=[0,0,0,0];open.forEach(x=>bk[age(x.due)]+=x.c.net);
  return `<dl class="stats"><div><dt>ลูกหนี้ค้างรับทั้งหมด</dt><dd>${fmt(sum(open,x=>x.c.net))}</dd></div><div><dt>ยังไม่ถึงกำหนด</dt><dd>${fmt(bk[0])}</dd></div><div><dt>เกิน 1–30 วัน</dt><dd style="color:var(--warn-c)">${fmt(bk[1])}</dd></div><div><dt>เกิน 31–60 วัน</dt><dd style="color:var(--danger)">${fmt(bk[2])}</dd></div><div><dt>เกิน 60 วัน</dt><dd style="color:var(--danger)">${fmt(bk[3])}</dd></div></dl>
  <section class="card"><h2><span>ใบแจ้งหนี้ / ใบเบิกงวดทุกโครงการ</span><small>ใบที่ยังเป็น “ร่าง” ไม่แสดง ออกใบแจ้งหนี้จากแท็บเบิกงวดของแต่ละโครงการ</small></h2>
  <div class="tw"><table><thead><tr><th>โครงการ</th><th>เลขที่</th><th>วันที่</th><th>ครบกำหนด</th><th class="r">รับสุทธิ</th><th>สถานะ</th><th></th></tr></thead><tbody>
  ${R.length?R.map(({p,b,c,due})=>{const late=b.status!=='paid'&&due<td;return `<tr><td>${pjCell(p)}</td><td><b>${esc(b.no)}</b></td><td>${thD(b.date)}</td><td>${late?`<span class="pill bad">${thD(due)} · เกิน ${diffD(due,td)} วัน</span>`:thD(due)}</td><td class="r">${fmt(c.net)}${b.status!=='paid'&&billRecv(b)>0.005?`<br><small class="muted">รับแล้ว ${fmt(billRecv(b))} · ค้าง ${fmt(c.net-billRecv(b))}</small>`:''}</td><td>${b.status==='paid'?`<span class="pill ok">รับแล้ว ${thD(b.paid)}</span>`:`<span class="pill info">${BSTAT.find(s=>s[0]===b.status)[1]}</span>`}</td>
    <td style="white-space:nowrap">${b.status!=='paid'?`<button type="button" class="btn sm" data-a="arPaid" data-p="${p.id}" data-id="${b.id}">รับเงินแล้ว</button>`:''} <button type="button" class="btn sm" data-a="printTax" data-p="${p.id}" data-id="${b.id}">ใบกำกับภาษี</button></td></tr>`}).join(''):'<tr><td colspan="7" class="empty">ยังไม่มีใบแจ้งหนี้</td></tr>'}</tbody></table></div></section>`}
ACT.printTax=b=>{const p=DB.projects[b.dataset.p];if(!p)return;$('#print').innerHTML=withP(p,()=>taxInv(b.dataset.id));setTimeout(()=>print(),300)};
function taxInv(id){const b=P.bills.find(x=>x.id===id);if(!b)return '';if(!b.tiNo){b.tiNo=nextNo('IV-',projects().flatMap(q=>q.bills.filter(y=>y.tiNo).map(y=>({no:y.tiNo}))));save()}const c=billCalc(b),cu=CO().customers.find(x=>x.id===P.info.cust)||{},k=b.kind||'prog',I=P.info;
  const what=k==='adv'?'เงินล่วงหน้า':k==='ret'?'คืนเงินประกันผลงาน':I.billMode==='pct'?`ค่างานงวดที่ ${esc(((P.inst||[]).find(x=>x.id===b.inst)||{}).no||'')}`:`ค่างานตามผลงานสะสม ${fmt(c.cum,2)}%`;
  return cphead(`ใบแจ้งหนี้ / ใบกำกับภาษี ${esc(b.tiNo)}`,`วันที่ ${thDL(b.date)}<br>อ้างอิงใบเบิก ${esc(b.no)}<br>ครบกำหนดชำระ ${thDL(billDue(P,b))}`)+`<div class="meta"><div><b>ลูกค้า</b> ${esc(cu.name||I.client||'')}<br>${esc(cu.addr||'')}<br>${cu.tax?'เลขประจำตัวผู้เสียภาษี '+esc(cu.tax):''}</div><div>${(J=>J.pj?`โครงการ ${esc(J.pj)}<br>งาน ${esc(J.job)}`:`โครงการ ${esc(J.job)}`)(pjJob(P))}<br>สัญญาเลขที่ ${esc(I.contractNo||'')}</div></div>
  <table><thead><tr><th>รายการ</th><th>จำนวนเงิน</th></tr></thead><tbody><tr><td>${what} ${(J=>J.pj?`${/^งาน/.test(J.job)?'':'งาน '}${esc(J.job)} โครงการ ${esc(J.pj)}`:`โครงการ ${esc(J.job)}`)(pjJob(P))}</td><td style="text-align:right">${fmt(c.amt,2)}</td></tr>${c.adv?`<tr><td>หักคืนเงินล่วงหน้า</td><td style="text-align:right">-${fmt(c.adv,2)}</td></tr>`:''}
  <tr><td>มูลค่าก่อนภาษี</td><td style="text-align:right">${fmt(c.base,2)}</td></tr><tr><td>ภาษีมูลค่าเพิ่ม ${n(I.vat)}%</td><td style="text-align:right">${fmt(c.vat,2)}</td></tr><tr><td><b>รวมเงิน</b></td><td style="text-align:right"><b>${fmt(c.base+c.vat,2)}</b></td></tr>
  ${c.ret?`<tr><td>หักเงินประกันผลงาน ${n(I.ret)}%</td><td style="text-align:right">-${fmt(c.ret,2)}</td></tr>`:''}<tr><td>หักภาษี ณ ที่จ่าย ${n(I.wht)}% (ลูกค้าหัก)</td><td style="text-align:right">-${fmt(c.wht,2)}</td></tr><tr><td><b>ยอดชำระสุทธิ</b></td><td style="text-align:right"><b>${fmt(c.net,2)}</b></td></tr></tbody></table>
  <div class="sign"><div>ผู้รับเงิน</div><div>ผู้มีอำนาจลงนาม</div><div>ผู้รับวางบิล</div></div>`}
function acctAP(){const td=today(),R=apRows().sort((a,b)=>a.due.localeCompare(b.due)),open=R.filter(x=>!x.po.paid);
  return `<dl class="stats"><div><dt>เจ้าหนี้ค้างจ่าย</dt><dd>${fmt(sum(open,x=>x.t))}</dd></div><div><dt>ถึงกำหนดใน 7 วัน</dt><dd>${fmt(sum(open.filter(x=>x.due>=td&&x.due<=addD(td,7)),x=>x.t))}</dd></div><div><dt>เลยกำหนดจ่าย</dt><dd style="color:var(--danger)">${fmt(sum(open.filter(x=>x.due<td),x=>x.t))}</dd></div></dl>
  <section class="card"><h2><span>ใบสั่งซื้อที่ต้องจ่ายเงิน</span><small>ครบกำหนด = วันที่รับของล่าสุด + เครดิต</small></h2>
  <div class="tw"><table><thead><tr><th>โครงการ</th><th>PO</th><th>ผู้ขาย</th><th>ครบกำหนดจ่าย</th><th class="r">ยอดรวม VAT</th><th>สถานะ</th><th></th></tr></thead><tbody>
  ${R.length?R.map(({p,po,t,due})=>`<tr><td>${pjCell(p)}</td><td><b>${esc(po.no)}</b></td><td>${esc(withP(p,()=>vName(po.vid)))}</td><td>${!po.paid&&due<td?`<span class="pill bad">${thD(due)}</span>`:thD(due)}</td><td class="r">${fmt(t)}</td><td>${po.paid?`<span class="pill ok">จ่ายแล้ว ${thD(po.paidDate)}</span>`:'<span class="pill">ค้างจ่าย</span>'}</td><td>${po.paid?'':`<button type="button" class="btn sm" data-a="apPaid" data-p="${p.id}" data-id="${po.id}">จ่ายแล้ว</button>`}</td></tr>`).join(''):'<tr><td colspan="7" class="empty">ยังไม่มี PO</td></tr>'}</tbody></table></div></section>`}
function acctCF(){const sel=S.sel.cfp||'',ps=sel?[DB.projects[sel]].filter(Boolean):projects(),L=cashflow(ps),td=ym(today());
  const row=(h,k,sg)=>`<tr><td>${h}</td>${L.map(x=>`<td class="r${x.k>td?' muted':''}">${x[k]?fmt(sg*x[k]):''}</td>`).join('')}</tr>`;
  return `<section class="card"><h2><span>กระแสเงินสดรายเดือน</span><small>เดือนที่ผ่านมาใช้ยอดจริง เดือนข้างหน้าใช้ใบที่ออกแล้วและคาดการณ์ส่วนที่เหลือตามแผนงาน</small></h2>
  <div class="row" style="margin-bottom:10px"><select id="cfSel" aria-label="โครงการ"><option value="">ทุกโครงการ</option>${projects().map(p=>`<option value="${p.id}"${p.id===sel?' selected':''}>${esc(p.name)}</option>`).join('')}</select></div>
  ${cfChart(L)}<div class="tw" style="margin-top:12px"><table><thead><tr><th></th>${L.map(x=>`<th class="r">${thM(x.k)}</th>`).join('')}</tr></thead><tbody>
  ${row('รับจากลูกค้า','in',1)}${row('รับ (คาดการณ์)','fin',1)}${row('จ่ายผู้ขาย','po',-1)}${row('จ่ายผู้รับเหมาช่วง','sub',-1)}${row('ค่าใช้จ่ายอื่น','exp',-1)}${row('จ่าย (คาดการณ์)','fout',-1)}
  <tr class="tot"><td>สุทธิ</td>${L.map(x=>`<td class="r" style="color:${x.net<0?'var(--danger)':'inherit'}">${fmt(x.net)}</td>`).join('')}</tr><tr class="tot"><td>สะสม</td>${L.map(x=>`<td class="r" style="color:${x.cum<0?'var(--danger)':'inherit'}">${fmt(x.cum)}</td>`).join('')}</tr></tbody></table></div></section>`}
document.addEventListener('change',e=>{if(e.target.id==='cfSel'){S.sel.cfp=e.target.value;render()}});

