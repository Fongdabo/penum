/* ---------- 4.39 ซื้อจริง: what purchasing actually paid, beside the quotation's cost (user: "ต้องมีช่องข้อมูลซื้อจริง จากจัดซื้อด้วย") ----------
   Only once the quote is won and sent to a project (Q.pj). The project's BOQ lines carry the quote lines' keys (160 setBoq keeps
   g|head|type|desc), and a PO line carries the BOQ line it was bought for (l.bid, 120 award). So each quote line finds its POs:
   purchased qty, average price paid, total, and the difference from the estimated material cost of the qty bought. A PO line
   typed by hand (no bid) is matched by its name; anything still unmatched can be matched by hand on the quote page, which writes
   l.bid so the purchasing page counts it as ordered too, or marked as not part of this quote (l.qbx). Prices are before VAT.
   The quote page gets a card under the lines; the internal cost print (915) gets the same table for the lines bought. */
const qbNorm=s=>String(s||'').toLowerCase().replace(/\s+/g,' ').trim();
const qbProj=Q=>Q&&Q.pj&&DB.projects&&DB.projects[Q.pj]||null;
const qbMc=i=>{const q=n(i.q),base=n(i.m)+n(i.l);return base?n(i.m):(q?n(i.t)/q:0)};
function qbData(Q){const p=qbProj(Q);if(!p||!(p.pos||[]).length)return null;
  const B=(p.boq&&p.boq.items)||[],used=new Set(),map={},byB={},byName={};
  // the k-th quote line with a key takes the k-th BOQ line with that key, so two lines with one name stay apart
  Q.items.forEach(i=>{if(i.hs)return;const k=bKey(i),b=B.find(x=>!used.has(x.id)&&bKey(x)===k);if(b){used.add(b.id);map[i.id]=b.id;byB[b.id]=i.id}});
  Q.items.forEach(i=>{if(!map[i.id])return;[i.desc,itemName(i),[i.type,i.desc].filter(Boolean).join(' ')].forEach(s=>{const k=qbNorm(s);if(k&&!byName[k])byName[k]=i.id})});
  const R={},un=[];
  p.pos.forEach(po=>(po.items||[]).forEach(l=>{if(l.qbx||!(n(l.q)*n(l.p)))return;let qi=l.bid&&byB[l.bid];if(!qi&&!l.bid)qi=byName[qbNorm(l.desc)];
    if(!qi){un.push({po,l});return}const r=R[qi]=R[qi]||{q:0,t:0,no:[]};r.q+=n(l.q);r.t+=n(l.q)*n(l.p);if(!r.no.includes(po.no))r.no.push(po.no)}));
  let est=0,bt=0,df=0;Q.items.forEach(i=>{if(i.hs)return;const mc=qbMc(i);est+=n(i.q)*mc;const r=R[i.id];if(r){bt+=r.t;df+=r.t-r.q*mc}});
  return {p,map,R,un,est,bt,df}}
const qbDf=v=>`<span class="qb-d ${v>0.005?'up':v<-0.005?'dn':''}">${v>0.005?'+':''}${fmt(v,2)}</span>`;
// rows of the table: every line with a material cost, or only the ones bought (print)
function qbRows(Q,D,only){const L=[];let gi=0,lg=null;Q.items.forEach(i=>{if(i.g!==lg){gi++;lg=i.g}if(i.hs||!D.map[i.id])return;const r=D.R[i.id],mc=qbMc(i);if(only&&!r)return;if(!r&&!mc)return;
  const ap=r&&r.q?r.t/r.q:0,over=r&&r.q>n(i.q)+1e-9;
  L.push(`<tr${r?'':' class="qb-no"'}><td>${esc([i.type,i.desc].filter(Boolean).join(' '))}</td><td>${esc(i.unit||'')}</td><td class="r">${fmtq(n(i.q))}</td><td class="r">${r?fmtq(r.q)+(over?' <small class="qb-ov" title="ซื้อมากกว่าจำนวนในใบเสนอราคา">เกิน</small>':''):'<small class="muted">ยังไม่ซื้อ</small>'}</td>
    <td class="r">${fmt(mc,2)}</td><td class="r">${r?fmt(ap,2):''}</td><td class="r">${r?fmt(r.t,2):''}</td><td class="r">${r?qbDf(r.t-r.q*mc):''}</td><td class="qb-po">${r?esc(r.no.join(', ')):''}</td></tr>`)});return L.join('')}
const qbHead=`<thead><tr><th>รายการ</th><th>หน่วย</th><th class="r">จำนวนในใบ</th><th class="r">ซื้อแล้ว</th><th class="r" title="ทุนค่าของต่อหน่วยที่ประมาณไว้ในใบเสนอราคา">ทุนของ/หน่วย</th><th class="r" title="ราคาซื้อเฉลี่ยจากใบสั่งซื้อ ไม่รวม VAT">ซื้อจริง/หน่วย</th><th class="r">ซื้อจริงรวม</th><th class="r" title="ซื้อจริงรวม − (ซื้อแล้ว × ทุนของ/หน่วย) บวก = แพงกว่าที่ประมาณ">ต่างจากทุน</th><th>PO</th></tr></thead>`;
function qbSum(Q,D){const c=qCalc(Q),gp=c.net-c.cost,ga=gp-D.df,pc=v=>c.net?` (${fmt(v*100/c.net,1)}%)`:'';
  return `<div class="qb-s"><div><span>ทุนค่าของที่ประมาณ (ทุกรายการ)</span><b>${fmt(D.est,2)}</b></div><div><span>สั่งซื้อแล้วตาม PO</span><b>${fmt(D.bt,2)}</b></div>
  <div><span>ต่างจากทุน (เฉพาะที่สั่งแล้ว)</span><b>${qbDf(D.df)}</b></div><div><span>กำไรขั้นต้นคาดการณ์</span><b>${fmt(gp,2)}${pc(gp)}</b></div>
  <div class="qb-g ${ga<gp-0.005?'up':''}"><span>กำไรขั้นต้นหลังคิดราคาซื้อจริง</span><b>${fmt(ga,2)}${pc(ga)}</b></div></div>`}
// the card on the quote page
function qbCard(Q){if(!qbProj(Q))return '';const p=qbProj(Q),D=qbData(Q);
  if(!D)return `<section class="card qb"><h2><span>ซื้อจริงจากจัดซื้อ</span></h2><p class="hint">ยังไม่มีใบสั่งซื้อ (PO) ในโครงการ “${esc(p.name)}” เมื่อจัดซื้อออก PO ราคาที่ซื้อจริงจะขึ้นที่นี่ เทียบกับทุนที่ประมาณไว้</p></section>`;
  const opts=Q.items.filter(i=>D.map[i.id]).map(i=>`<option value="${i.id}">${esc([i.type,i.desc].filter(Boolean).join(' ').slice(0,70))}</option>`).join('');
  const un=D.un.length?`<h3 class="qb-h">รายการใน PO ที่ยังจับคู่ไม่ได้ (${D.un.length})</h3><p class="hint">เลือกว่าเป็นของรายการไหนในใบเสนอราคา หรือเลือก “ไม่นับ” ถ้าไม่ใช่ของในใบนี้</p><div class="tw"><table class="qb-t"><thead><tr><th>PO</th><th>รายการใน PO</th><th class="r">จำนวน</th><th class="r">ราคา/หน่วย</th><th>เป็นของรายการ</th></tr></thead><tbody>
    ${D.un.map(({po,l})=>`<tr><td>${esc(po.no)}</td><td>${esc(l.desc||'')}</td><td class="r">${fmtq(n(l.q))} ${esc(l.unit||'')}</td><td class="r">${fmt(n(l.p),2)}</td><td><select class="qbMatch" data-id="${Q.id}" data-po="${po.id}" data-l="${l.id}" aria-label="จับคู่กับรายการในใบเสนอราคา"><option value="">— เลือกรายการ —</option>${opts}<option value="__x">ไม่นับ (ไม่ใช่ของในใบนี้)</option></select></td></tr>`).join('')}</tbody></table></div>`:'';
  return `<section class="card qb"><h2><span>ซื้อจริงจากจัดซื้อ</span><small>จากใบสั่งซื้อ (PO) ของโครงการ “${esc(p.name)}” ราคาไม่รวม VAT</small><span class="sp"></span><button type="button" class="btn sm" data-a="qbOpen" data-id="${Q.id}">ไปหน้าใบสั่งซื้อ</button></h2>
  ${qbSum(Q,D)}<div class="tw" style="max-height:480px;overflow:auto"><table class="qb-t">${qbHead}<tbody>${qbRows(Q,D,0)}</tbody></table></div>${un}</section>`}
ACT.qbOpen=b=>{const Q=CO().quotes.find(q=>q.id===b.dataset.id);if(!Q||!qbProj(Q))return;ACT.go({dataset:{m:'pj',k:'buy',p:Q.pj}});S.sub.buy='po';render()};
document.addEventListener('change',e=>{const t=e.target;if(!t||!t.classList||!t.classList.contains('qbMatch')||!t.value)return;
  const Q=CO().quotes.find(q=>q.id===t.dataset.id),D=Q&&qbData(Q),po=D&&D.p.pos.find(x=>x.id===t.dataset.po),l=po&&po.items.find(x=>x.id===t.dataset.l);if(!l)return;
  if(t.value==='__x'){l.qbx=1;toast('ไม่นับรายการนี้แล้ว')}else{const bid=D.map[t.value];if(!bid)return;l.bid=bid;const b=D.p.boq.items.find(x=>x.id===bid);if(b&&!l.g)l.g=b.g;toast('จับคู่แล้ว หน้าจัดซื้อจะนับว่าสั่งแล้วด้วย')}
  save();render()});
{const f=salesQuote;salesQuote=function(){const h=f.apply(this,arguments),C=CO(),Q=C.quotes.find(q=>q.id===S.sel.quote)||C.quotes.slice().reverse()[0];return Q?h+qbCard(Q):h}}
// the internal cost print: the lines bought, before the totals
{const f=PRINT.quoteCost;PRINT.quoteCost=function(id){let h=f.apply(this,arguments);const Q=CO().quotes.find(q=>q.id===id),D=Q&&qbData(Q);if(!h||!D||!Object.keys(D.R).length)return h;
  const left=Q.items.filter(i=>!i.hs&&D.map[i.id]&&!D.R[i.id]&&qbMc(i)>0),lv=sum(left,i=>n(i.q)*qbMc(i));
  const T=`<h2>ซื้อจริงจากใบสั่งซื้อ (PO) เทียบทุนที่ประมาณ <small style="font-weight:400">โครงการ ${esc(D.p.name)} · ราคาไม่รวม VAT</small></h2><table class="qb-t">${qbHead}<tbody>${qbRows(Q,D,1)}
    <tr class="obt"><td colspan="6">รวมที่สั่งซื้อแล้ว${left.length?` · ยังไม่ได้สั่ง ${left.length} รายการ (ทุนของประมาณ ${fmt(lv,2)})`:''}${D.un.length?` · PO ที่ยังจับคู่ไม่ได้ ${D.un.length} รายการ`:''}</td><td class="r">${fmt(D.bt,2)}</td><td class="r">${qbDf(D.df)}</td><td></td></tr></tbody></table>${qbSum(Q,D)}`;
  return h.replace('<div class="obi-b">',T+'<div class="obi-b">')}}
document.head.insertAdjacentHTML('beforeend',`<style>.qb-t td.qb-po{font-size:11.5px;color:var(--muted,#567080)}.qb-t tr.qb-no td{color:var(--muted,#567080)}.qb-d.up{color:var(--danger,#c0392b);font-weight:700}.qb-d.dn{color:var(--good,#1e8e5a)}
.qb-ov{border:1px solid var(--danger,#c0392b);color:var(--danger,#c0392b);border-radius:6px;padding:0 4px;font-size:10px}.qb-h{font-size:14px;margin:14px 0 2px}.qb select.qbMatch{max-width:320px}
.qb-s{display:flex;flex-wrap:wrap;gap:8px;margin:4px 0 10px}.qb-s>div{flex:1 1 170px;border:1px solid var(--line,#d5dee5);border-radius:8px;padding:6px 10px;display:flex;flex-direction:column;gap:2px}.qb-s span{font-size:12px;color:var(--muted,#567080)}.qb-s b{font-size:15px}
.qb-s .qb-g{background:rgba(30,142,90,.08)}.qb-s .qb-g.up{background:rgba(192,57,43,.1)}
#print .obi .qb-s>div{border-color:#999;-webkit-print-color-adjust:exact;print-color-adjust:exact}#print .obi .qb-d.up{color:#9b1c12}#print .obi .qb-d.dn{color:#0d4f2f}#print .obi .qb-t td.qb-po{font-size:9.5px}#print .obi table.qb-t th:first-child{width:30%}</style>`);
if(typeof I18N==='object'&&I18N.en&&I18N.en.x)Object.assign(I18N.en.x,{'ซื้อจริงจากจัดซื้อ':'Actual purchases','ไปหน้าใบสั่งซื้อ':'Go to purchase orders','จำนวนในใบ':'Quoted qty','ซื้อแล้ว':'Bought','ทุนของ/หน่วย':'Est. material/unit',
  'ซื้อจริง/หน่วย':'Paid/unit','ซื้อจริงรวม':'Paid total','ต่างจากทุน':'Vs estimate','ยังไม่ซื้อ':'Not bought','ทุนค่าของที่ประมาณ (ทุกรายการ)':'Estimated material (all lines)','สั่งซื้อแล้วตาม PO':'Ordered on POs',
  'ต่างจากทุน (เฉพาะที่สั่งแล้ว)':'Vs estimate (ordered lines)','กำไรขั้นต้นคาดการณ์':'Expected gross profit','กำไรขั้นต้นหลังคิดราคาซื้อจริง':'Gross profit at actual prices','— เลือกรายการ —':'— Pick a line —','ไม่นับ (ไม่ใช่ของในใบนี้)':'Ignore (not in this quote)'});
