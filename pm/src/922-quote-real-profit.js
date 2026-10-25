/* ---------- 4.40 the real profit of a quotation (user: "ทำทั้งหมดเลย", items 1, 2 and 4 of the internal sheet) ----------
   - ต้นทุนแฝง (Q.hid): costs the customer never sees, such as transport, travel or a warranty reserve, each an amount or a % of the
     quoted price. Quoted price − cost − hidden costs = กำไรสุทธิ.
   - เป้ากำไรสุทธิขั้นต่ำ (co.qTgt, default 10%) and from it the lowest price that still meets it, i.e. how much discount is left
     before profit drops under the target: F = (cost + fixed hidden) / (1 − (hidden % + target %) / 100).
   - Once won (921's project): labour actually spent, from the timesheets (240 labCost, หน้างาน check-ins write them) plus the
     subcontracts, and the project's other costs, beside the estimate; the forecast takes the larger of estimate and actual so far
     for each part, like the project's cost page (150). The quote page gets an internal card; the internal print (915) gets the
     same figures. The approval gate (4.41) uses qrNow() and qTgt(). */
const qTgt=()=>{const v=CO().qTgt;return v==null||v===''?10:n(v)};
const qrHid=(Q,net)=>{const H=Q.hid||[],fx=sum(H,h=>n(h.v)),pc=sum(H,h=>n(h.pct));return {fx,pc,v:fx+net*pc/100}};
// the quote as it stands: net, cost, hidden, net profit and %, the floor price for the target and the discount left
function qrNow(Q){const c=qCalc(Q),net=c.net,H=qrHid(Q,net),np=net-c.cost-H.v,t=qTgt(),dn=1-(H.pc+t)/100,fl=dn>0?(c.cost+H.fx)/dn:Infinity;
  return {c,net,cost:c.cost,H,hid:H.v,np,npc:net?np*100/net:0,t,fl,left:net-fl,low:net>0&&(net?np*100/net:0)<t-1e-9}}
const qrLab=p=>{const C=CO(),ts=(C.ts||[]).filter(t=>t.proj===p.id);return {h:sum(ts,t=>n(t.h)),ts:typeof labCost==='function'?labCost(p.id):0,sub:sum(p.subs||[],s=>n(s.value)),paid:sum(p.spay||[],x=>n(x.amt)),oth:sum(p.costs||[],x=>n(x.amt))}};
// a profit difference: less is red, more is green (qbDf colours a cost the other way)
const qrDp=v=>`<span class="qb-d ${v<-0.005?'up':v>0.005?'dn':''}">${v>0.005?'+':''}${fmt(v,2)}</span>`;
const qrPc=(v,net)=>net?` <small>${fmt(v*100/net,1)}%</small>`:'';
// 921's summary becomes the whole project: material (POs), labour (timesheets + subcontracts), other costs
qbSum=(Q,D)=>{const R=qrNow(Q),L=qrLab(D.p),em=D.est,el=R.cost-em,al=L.ts+L.sub,fm=em+D.df,fl=Math.max(el,al),fh=Math.max(R.hid,L.oth),ft=fm+fl+fh,fp=R.net-ft;
  const row=(l,e,a,f,d)=>`<tr><td>${l}</td><td class="r">${fmt(e,2)}</td><td class="r">${a}</td><td class="r">${fmt(f,2)}</td><td class="r">${qbDf(f-e)}</td></tr>`;
  return `<div class="tw"><table class="qb-t qr-a"><thead><tr><th></th><th class="r">ประมาณในใบ</th><th class="r">จริงถึงวันนี้</th><th class="r" title="ส่วนที่ยังไม่มีของจริงใช้ค่าประมาณ ส่วนที่จริงเกินประมาณแล้วใช้ค่าจริง">คาดการณ์</th><th class="r">ต่าง</th></tr></thead><tbody>
    ${row('ค่าของ',em,`${fmt(D.bt,2)}<small class="qr-s">ตาม PO</small>`,fm)}
    ${row('ค่าแรง',el,`${fmt(al,2)}<small class="qr-s">ทีมเรา ${fmtq(L.h)} ชม. ${fmt(L.ts,0)} · ผู้รับเหมาช่วง ${fmt(L.sub,0)}${L.paid?` (จ่ายแล้ว ${fmt(L.paid,0)})`:''}</small>`,fl)}
    ${row('ต้นทุนแฝง / ค่าใช้จ่ายอื่น',R.hid,`${fmt(L.oth,2)}<small class="qr-s">ค่าใช้จ่ายของโครงการ</small>`,fh)}
    <tr class="qr-t"><td>รวมต้นทุน</td><td class="r">${fmt(R.cost+R.hid,2)}</td><td class="r">${fmt(D.bt+al+L.oth,2)}</td><td class="r">${fmt(ft,2)}</td><td class="r">${qbDf(ft-R.cost-R.hid)}</td></tr>
    <tr class="qr-t ${fp<R.np-0.005?'qr-dn':'qr-up'}"><td>กำไรสุทธิ (ราคาเสนอ ${fmt(R.net,2)})</td><td class="r">${fmt(R.np,2)}${qrPc(R.np,R.net)}</td><td></td><td class="r">${fmt(fp,2)}${qrPc(fp,R.net)}</td><td class="r">${qrDp(fp-R.np)}</td></tr></tbody></table></div>`};
// ---- the internal card: hidden costs, target, lowest price
const QR_SUG=[['ค่าขนส่ง',0],['ค่าเดินทาง / ที่พัก',0],['สำรองค่ารับประกัน',1]];
function qrCard(Q){if(!Q||(typeof qmMa==='function'&&qmMa(Q)&&!(Q.items||[]).length))return '';const b=`co.quotes.${Q.id}`,H=Q.hid||[],R=qrNow(Q);
  const sug=QR_SUG.filter(([l])=>!H.some(h=>h.name===l)).map(([l,p])=>`<button type="button" class="btn ghost sm" data-a="qrAdd" data-id="${Q.id}" data-n="${esc(l)}" data-pct="${p}">+ ${esc(l)}</button>`).join('');
  const rows=H.map(h=>`<tr><td><input data-p="${b}.hid.${h.id}.name" value="${esc(h.name||'')}" placeholder="เช่น ค่าขนส่ง" aria-label="ชื่อต้นทุนแฝง"></td><td style="width:130px"><input class="r" data-t="num" data-p="${b}.hid.${h.id}.v" value="${n(h.v)||''}" placeholder="0" aria-label="จำนวนเงิน"></td>
    <td style="width:110px"><input class="r" data-t="num" data-p="${b}.hid.${h.id}.pct" value="${n(h.pct)||''}" placeholder="0" aria-label="% ของราคาเสนอ"></td><td class="r" style="width:120px">${fmt(n(h.v)+R.net*n(h.pct)/100,2)}</td><td style="width:34px"><button type="button" class="x" data-a="delRow" data-c="${b}.hid" data-id="${h.id}" aria-label="ลบ">✕</button></td></tr>`).join('');
  const fl=R.fl===Infinity?'<b>–</b>':`<b>${fmt(Math.ceil(R.fl),2)}</b>`,
    neg=R.left<-0.005?`<div class="qr-f bad">กำไรสุทธิต่ำกว่าเป้า ${fmt(R.t,1)}% อยู่แล้ว ต้องขึ้นราคาอีก <b>${fmt(-R.left,2)}</b> บาท (ก่อน VAT)</div>`
      :`<div class="qr-f">ราคาต่ำสุดที่ยังได้กำไรสุทธิตามเป้า ${fl} บาท (ก่อน VAT) · ลดราคาได้อีกสูงสุด <b>${fmt(Math.max(0,Math.floor(R.left)),2)}</b> บาท${R.net?` (${fmt(Math.max(0,R.left)*100/R.net,1)}% ของราคาเสนอ)`:''}</div>`;
  return `<section class="card qr"><h2><span>กำไรสุทธิและราคาต่ำสุด</span><small>ข้อมูลภายใน ไม่แสดงในใบที่ส่งลูกค้า</small></h2>
  <div class="qb-s"><div><span>ราคาเสนอ ไม่รวม VAT</span><b>${fmt(R.net,2)}</b></div><div><span>ต้นทุน (ของ + แรง)</span><b>${fmt(R.cost,2)}</b></div><div><span>ต้นทุนแฝง</span><b>${fmt(R.hid,2)}</b></div>
    <div class="qb-g ${R.low?'up':''}"><span>กำไรสุทธิ</span><b>${fmt(R.np,2)} (${fmt(R.npc,1)}%)</b></div></div>
  <h3 class="qb-h">ต้นทุนแฝง</h3><p class="hint">ค่าใช้จ่ายที่ไม่ได้อยู่ในรายการ ใส่เป็นจำนวนเงิน หรือ % ของราคาเสนอ (เช่น สำรองค่ารับประกัน 1%) หรือทั้งสองอย่าง</p>
  ${H.length?`<div class="tw"><table class="qb-t"><thead><tr><th>รายการ</th><th class="r">บาท</th><th class="r">% ของราคาเสนอ</th><th class="r">รวม</th><th></th></tr></thead><tbody>${rows}</tbody></table></div>`:''}
  <div class="row" style="gap:6px;flex-wrap:wrap;margin:6px 0 12px">${sug}<button type="button" class="btn sm" data-a="qrAdd" data-id="${Q.id}">+ เพิ่มต้นทุนแฝง</button></div>
  <div class="row qr-tg" style="gap:8px;align-items:center;flex-wrap:wrap"><label class="row" style="gap:6px;align-items:center;margin:0">เป้ากำไรสุทธิขั้นต่ำ <input class="r" style="width:80px" data-t="num" data-p="co.qTgt" value="${fmt(R.t,1).replace(/,/g,'')}" aria-label="เป้ากำไรสุทธิขั้นต่ำ (%)"> %</label><small class="muted">ใช้กับทุกใบเสนอราคาของบริษัท</small></div>
  ${neg}</section>`}
ACT.qrAdd=b=>{const Q=CO().quotes.find(q=>q.id===b.dataset.id);if(!Q)return;Q.hid=Q.hid||[];Q.hid.push({id:uid(),name:b.dataset.n||'',v:0,pct:n(b.dataset.pct)});save();render()};
{const f=salesQuote;salesQuote=function(){const h=f.apply(this,arguments),C=CO(),Q=C.quotes.find(q=>q.id===S.sel.quote)||C.quotes.slice().reverse()[0];return Q?qbIns(h,qrCard(Q)):h}}
// ---- the internal print: hidden costs and net profit under gross profit, the floor price; the project's actuals once won
{const f=PRINT.quoteCost;PRINT.quoteCost=function(id){let h=f.apply(this,arguments);const Q=CO().quotes.find(q=>q.id===id);if(!h||!Q)return h;const R=qrNow(Q),r=(l,v,c)=>`<tr${c?` class="${c}"`:''}><td>${l}</td><td class="r">${v}</td></tr>`;
  const add=((Q.hid||[]).filter(x=>n(x.v)||n(x.pct)).map(x=>r('ต้นทุนแฝง: '+esc(x.name||'')+(n(x.pct)?` ${fmt(n(x.pct),2)}%`:''),fmt(n(x.v)+R.net*n(x.pct)/100,2))).join(''))
    +r('กำไรสุทธิ (หลังต้นทุนแฝง)',`${fmt(R.np,2)} (${fmt(R.npc,1)}%)`,'tot'+(R.low?' qr-lo':''))
    +r(`ราคาต่ำสุดตามเป้ากำไรสุทธิ ${fmt(R.t,1)}%`,R.fl===Infinity?'–':`${fmt(Math.ceil(R.fl),2)}${R.left>0?` (ลดได้อีก ${fmt(Math.floor(R.left),2)})`:` (ต้องขึ้นอีก ${fmt(-R.left,2)})`}`);
  h=h.replace('<tr><td>ภาษีมูลค่าเพิ่ม 7%</td>',add+'<tr><td>ภาษีมูลค่าเพิ่ม 7%</td>');
  // a won quote whose project has no POs yet still shows labour and other costs
  if(qbProj(Q)&&!h.includes('class="qb-t qr-a"')){const D=qbData(Q);h=h.replace('<div class="obi-b">',`<h2>ต้นทุนจริงของโครงการ ${esc(D.p.name)} เทียบที่ประมาณ</h2>${qbSum(Q,D)}<div class="obi-b">`)}
  return h}}
document.head.insertAdjacentHTML('beforeend',`<style>.qr input{width:100%}.qr-f{margin:10px 0 0;padding:8px 12px;border-radius:10px;background:rgba(30,142,90,.08);font-size:14px}.qr-f.bad{background:rgba(192,57,43,.1);color:var(--danger,#c0392b)}
.qr-a td small.qr-s{display:block;font-size:11px;color:var(--muted,#567080);font-weight:400}.qr-a tr.qr-t td{font-weight:700;border-top:2px solid var(--line,#c5d2db)}.qr-a tr.qr-dn td:last-child,.qr-a tr.qr-dn td:nth-child(4){color:var(--danger,#c0392b)}
#print .obi table.qr-a th:first-child{width:24%}#print .obi tr.qr-lo td{color:#9b1c12}</style>`);
if(typeof I18N==='object'&&I18N.en&&I18N.en.x)Object.assign(I18N.en.x,{'กำไรสุทธิและราคาต่ำสุด':'Net profit and lowest price','ข้อมูลภายใน ไม่แสดงในใบที่ส่งลูกค้า':'Internal, not on the customer copy','ต้นทุนแฝง':'Hidden costs',
  'กำไรสุทธิ':'Net profit','+ เพิ่มต้นทุนแฝง':'+ Add hidden cost','เป้ากำไรสุทธิขั้นต่ำ':'Minimum net profit','ใช้กับทุกใบเสนอราคาของบริษัท':'Applies to every quotation of the company','ประมาณในใบ':'Estimate',
  'จริงถึงวันนี้':'Actual to date','คาดการณ์':'Forecast','ต่าง':'Difference','ค่าของ':'Material','ค่าแรง':'Labour','ต้นทุนแฝง / ค่าใช้จ่ายอื่น':'Hidden / other costs','รวมต้นทุน':'Total cost',
  '+ ค่าขนส่ง':'+ Transport','+ ค่าเดินทาง / ที่พัก':'+ Travel / lodging','+ สำรองค่ารับประกัน':'+ Warranty reserve'});
