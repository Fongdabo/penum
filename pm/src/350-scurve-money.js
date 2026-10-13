/* ---------- round 2.3: S-curve also shows money: instalment plan, billed and received ---------- */
function scurve(wd=760,ht=260){
  const s=sched();if(!P.tasks.length)return '<p class="empty">ยังไม่มีแผนงาน</p>';
  const C=contract(),tot=C.total||0,td=today(),bl=billsSorted().filter(x=>(x.kind||'prog')==='prog'&&x.status!=='draft').map(x=>({b:x,amt:billCalc(x).amt})),R=(P.inst||[]).length?instPlan().filter(r=>r.d):[];
  const a0=P.tasks.reduce((m,t)=>{const x=okD(t.bs)&&t.bs<m?t.bs:m;return s.R[t.id].es<x?s.R[t.id].es:x},s.st),a=[a0,...bl.map(x=>x.b.date)].filter(okD).sort()[0];
  const b=[P.tasks.reduce((m,t)=>okD(t.bf)&&t.bf>m?t.bf:m,s.fin),...bl.map(x=>x.b.paid||x.b.date),...R.map(r=>r.d)].filter(okD).sort().pop(),span=Math.max(1,diffD(a,b));
  const L=44,Rr=14,T=14,B=30,X=d=>L+(wd-L-Rr)*Math.max(0,Math.min(1,diffD(a,d)/span)),Y=v=>T+(ht-T-B)*(1-Math.min(100,v)/100);
  const step=Math.max(1,Math.round(span/40)),pts=[];for(let k=0;k<=span;k+=step)pts.push(addD(a,k));pts.push(b);
  const plan=pts.map((d,i)=>`${i?'L':'M'}${X(d).toFixed(1)},${Y(s.planAt(d)).toFixed(1)}`).join('');
  const hk=Object.keys(P.hist).filter(okD).sort(),cur=s.act();
  const ah=[...hk.filter(d=>d<td).map(d=>[d,P.hist[d]]),[td,cur]].filter(x=>x[0]>=a);
  const act=ah.map(([d,v],i)=>`${i?'L':'M'}${X(d).toFixed(1)},${Y(v).toFixed(1)}`).join('');
  // cumulative money as % of contract, as steps up to an end date
  const P_=v=>tot?v*100/tot:0,steps=(E,end)=>{let v=0;const o=[[a,0]];E.slice().sort((x,y)=>x[0].localeCompare(y[0])).forEach(([d,m])=>{if(d>end)return;o.push([d,v]);v+=P_(m);o.push([d,v])});o.push([end,v]);return {o,v}};
  const end=td<b?td:b,BI=steps(bl.map(x=>[x.b.date,x.amt]),end),RC=steps(bl.flatMap(x=>{const c=billCalc(x.b);return c.net?billRcList(x.b).map(y=>[y.date,x.amt*y.amt/c.net]):[]}).sort((a,b)=>a[0].localeCompare(b[0])),end),PL=R.length?steps(R.map(r=>[r.d,r.amt]),b):null;
  const path=o=>o.map(([d,v],i)=>`${i?'L':'M'}${X(d).toFixed(1)},${Y(v).toFixed(1)}`).join('');
  const area=bl.length?`<path d="${path(BI.o)}${RC.o.slice().reverse().map(([d,v])=>`L${X(d).toFixed(1)},${Y(v).toFixed(1)}`).join('')}Z" fill="var(--warn-c)" opacity=".16"/>`:'';
  const grid=[0,25,50,75,100].map(v=>`<line x1="${L}" x2="${wd-Rr}" y1="${Y(v)}" y2="${Y(v)}" stroke="var(--line)"/><text x="${L-6}" y="${Y(v)+4}" text-anchor="end" font-size="11" fill="var(--muted)">${v}%</text>`).join('');
  const months=[];let m=pd(a);m.setDate(1);m.setMonth(m.getMonth()+1);while(iso(m)<=b){months.push(iso(m));m.setMonth(m.getMonth()+1)}
  const ev=Math.ceil(months.length/8)||1;
  const mx=months.filter((_,i)=>i%ev===0).map(d=>`<line x1="${X(d)}" x2="${X(d)}" y1="${T}" y2="${ht-B}" stroke="var(--line)" stroke-dasharray="2 3"/><text x="${X(d)}" y="${ht-B+16}" text-anchor="middle" font-size="11" fill="var(--muted)">${pd(d).toLocaleDateString('th-TH',{month:'short',year:'2-digit'})}</text>`).join('');
  const tx=td>=a&&td<=b?`<line x1="${X(td)}" x2="${X(td)}" y1="${T}" y2="${ht-B}" stroke="var(--danger)" stroke-dasharray="4 3"/><text x="${X(td)+4}" y="${T+10}" font-size="11" fill="var(--danger)">วันนี้</text>`:'';
  const dots=R.map(r=>`<circle cx="${X(r.d)}" cy="${Y(P_(r.cumAmt))}" r="3.5" fill="var(--surface)" stroke="var(--muted)" stroke-width="1.5"><title>งวด ${esc(r.x.no)} · ${thD(r.d)} · ${fmt(P_(r.cumAmt),1)}%</title></circle>`).join('');
  const wait=BI.v-RC.v;
  // labels on the chart itself, nudged up or down so none overlap; a thin leader line when moved away from its point
  const LB=[],box=[],tw=(t,fs)=>t.length*fs*0.56+6;
  const lab=(x,y,t,col,o={})=>LB.push(Object.assign({x,y,t,col,fs:11,w:600},o));
  if(ah.length&&td>=a&&td<=b){lab(X(td),Y(s.planAt(td)),`แผน ${pct(s.planAt(td))}`,'var(--plan)',{pri:1});lab(X(td),Y(cur),`ทำจริง ${pct(cur)}`,'var(--act)',{pri:1})}
  lab(X(s.fin),Y(100),`แผนเสร็จ ${thD(s.fin)}`,'var(--plan)',{fs:10,w:500,side:'l',dn:1});
  if(bl.length){const same=Math.abs(BI.v-RC.v)<0.05;lab(X(end),Y(BI.v),same?`ตั้งเบิก/รับเงิน ${fmt(BI.v,1)}%`:`ตั้งเบิก ${fmt(BI.v,1)}%`,'var(--warn-c)',{fs:10.5});if(!same)lab(X(end),Y(RC.v),`รับเงิน ${fmt(RC.v,1)}%`,'var(--good)',{fs:10.5})}
  R.forEach(r=>lab(X(r.d),Y(P_(r.cumAmt)),`งวด ${r.x.no} · ${fmt(P_(r.cumAmt),0)}% · ${thD(r.d).replace(/ \d+$/,'')}`,'var(--muted)',{fs:9.5,w:500,side:'l'}));
  // 3.62: labels also keep clear of the chart lines
  const SG=[],xy=o=>o.map(([d,v])=>[X(d),Y(v)]);chartSeg(SG,pts.map(d=>[X(d),Y(s.planAt(d))]));chartSeg(SG,xy(ah));if(bl.length){chartSeg(SG,xy(BI.o));chartSeg(SG,xy(RC.o))}if(PL)chartSeg(SG,xy(PL.o));
  if(tx)box.push([X(td)+2,T-2,tw('วันนี้',11),15]);
  const labels=chartLabels(LB,SG,box,{wd,ht,L,T,B});
  return `<svg class="chart" viewBox="0 0 ${wd} ${ht}" role="img" aria-label="กราฟ S-Curve ความคืบหน้างานเทียบเงินที่เบิกและรับ">${grid}${mx}${tx}${area}
    ${PL?`<path d="${path(PL.o)}" fill="none" stroke="var(--muted)" stroke-width="1.5" stroke-dasharray="6 4"/>${dots}`:''}
    <path d="${plan}" fill="none" stroke="var(--plan)" stroke-width="2.5"/><path d="${act}" fill="none" stroke="var(--act)" stroke-width="3"/>
    ${bl.length?`<path d="${path(BI.o)}" fill="none" stroke="var(--warn-c)" stroke-width="2.2"/><path d="${path(RC.o)}" fill="none" stroke="var(--good)" stroke-width="2.6"/>`:''}
    ${ah.length?`<circle cx="${X(td)}" cy="${Y(cur)}" r="4.5" fill="var(--act)"/>`:''}${labels}</svg>
    <div class="legend"><span><i style="background:var(--plan)"></i>งานตามแผน ${pct(s.planAt(td))}</span><span><i style="background:var(--act)"></i>งานทำได้จริง ${pct(cur)}</span>
    ${PL?`<span><i style="background:var(--muted)"></i>แผนงวดเงิน (เส้นประ)</span>`:''}<span><i style="background:var(--warn-c)"></i>ตั้งเบิกแล้ว ${fmt(BI.v,1)}%</span><span><i style="background:var(--good)"></i>รับเงินแล้ว ${fmt(RC.v,1)}%</span>
    ${wait>0.05?`<span><i style="background:var(--warn-c);opacity:.35"></i>ตั้งเบิกแล้วรอรับเงิน ${fmt(wait*tot/100)} บาท</span>`:''}<span class="muted">เงินคิดเป็น % ของมูลค่าสัญญา ไม่รวม VAT</span></div>`;
}

/* 3.62: printed charts always use light-theme colours, so a PDF made from the dark theme
   doesn't get dark halos behind chart labels (S-Curve) or dark grid lines on white paper */
document.head.insertAdjacentHTML('beforeend',`<style>@media print{#print,#print *{--surface:#FFFFFF;--sunk:#F5F9FC;--ink:#102A3A;--muted:#567080;--line:#D5DEE5;--line-2:#EBF2F7;
 --plan:#64748B;--act:#0891B2;--crit:#EA580C;--base:#CBD8E1;--good:#059669;--warn-c:#B45309;--danger:#DC2626;color-scheme:light}
 #print svg.chart{-webkit-print-color-adjust:exact;print-color-adjust:exact}}</style>`);

