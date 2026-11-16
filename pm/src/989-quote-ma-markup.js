/* ---------- 4.99.33 ทุนและบวกกำไรในใบเสนอราคาบริการ PM/MA (user, 2026-11-16: "ไม่มีช่องบวกกำไร") ----------
   The service contract card (981 qmaCard) had only the selling price per unit per visit, so a service quotation could not be
   priced from its costs. The card's table now has ทุน/หน่วย/ครั้ง (cost per unit per visit) and กำไร % columns, and a row above
   it holds the quotation's markup: บวกกำไร % (Q.mk) and how it is taken (Q.mkDiv: on cost, or as a share of the selling price,
   951). A line priced from its cost (i.mka) gets its price per visit = cost per visit + markup, rounded up as the quotation's
   ปัดราคาขาย/หน่วย says, so prices per visit stay round (930, 1,470…); it is kept in i.sp (price over the contract) and
   refreshed whenever the card is drawn or the quotation printed. A typed price clears i.mka and stays, showing its own profit.
   "ใช้ % นี้กับทุกรายการ" prices every line that has a cost from it again. A line keeps its cost over the whole contract in i.m / i.l (as every quote line does), so a cost per visit is that
   ÷ the visits over the contract; changing the visits a year keeps the cost per visit, like 981 keeps the price per visit. */
const qmkCostU=i=>{const c=n(i.m)+n(i.l);return c>0?c:n(i.t)/(n(i.q)||1e-9)};
const qmkPerVisit=(Q,i)=>{const v=qmVisits(Q,i);return v?qmkCostU(i)/v:0};
// lines priced from cost: price per visit rounded, times the visits over the contract
function qmkAuto(Q){if(!Q||typeof qmMa!=='function'||!qmMa(Q))return;Q.items.forEach(i=>{if(!i.mka)return;const cv=qmkPerVisit(Q,i),v=qmVisits(Q,i);if(!(cv>0&&v))return;
  i.sp=Math.round(qRnd(Q,qMkA(Q,cv,qMkI(Q,i,'M')))*v*100)/100})}
const qmkPct=(Q,i)=>{const u=qUnit(Q,i),c=qmkCostU(i);return u>0&&c>0?(u-c)/u*100:null};
function qmkRows(Q,b){return Q.items.map(i=>{const pv=qmPerVisit(Q,i),cv=qmkPerVisit(Q,i),pc=qmkPct(Q,i),own=!i.mka&&n(i.sp)>0;
  return `<tr><td><input data-p="${b}.items.${i.id}.desc" value="${esc([i.type,i.desc].filter(Boolean).join(' '))}" aria-label="เครื่อง / ระบบ" style="min-width:220px"></td><td style="width:72px"><input class="r" data-t="num" data-p="${b}.items.${i.id}.q" value="${n(i.q)}" aria-label="จำนวน"></td>
    <td style="width:80px"><input data-p="${b}.items.${i.id}.unit" value="${esc(i.unit||'')}" aria-label="หน่วย"></td><td style="width:70px"><input class="r" data-qmv="${Q.id}" data-k="${i.id}" value="${i.vis||''}" placeholder="${n(Q.maVisits)||4}" aria-label="ครั้งต่อปี"></td>
    <td style="width:120px"><input class="r" data-qmc="${Q.id}" data-k="${i.id}" value="${cv?Math.round(cv*100)/100:''}" placeholder="0.00" aria-label="ทุนต่อหน่วยต่อครั้ง"></td>
    <td style="width:130px"><input class="r" data-qmp="${Q.id}" data-k="${i.id}" value="${pv?Math.round(pv*100)/100:''}" placeholder="0.00" aria-label="ราคาต่อหน่วยต่อครั้ง"${own?' title="ราคาที่พิมพ์เอง ไม่คิดจาก % กำไร"':''}></td>
    <td class="r" style="width:80px">${pc==null?'–':`<span class="${pc<0?'neg':''}">${fmt(pc,1)}%</span>`}${own?'<small class="muted" style="display:block">พิมพ์เอง</small>':''}</td>
    <td class="r">${fmt(n(i.q)*qUnit(Q,i),2)}</td><td><button type="button" class="x" data-a="delRow" data-c="${b}.items" data-id="${i.id}" aria-label="ลบ">✕</button></td></tr>`}).join('')}
function qmkBar(Q,b){const c=qCalc(Q),p=c.net>0&&c.cost>0?(c.net-c.cost)/c.net*100:null;
  return `<div class="qmk-bar row" style="flex-wrap:wrap;gap:8px;align-items:flex-end;margin:4px 0 8px">
    <label style="width:120px">บวกกำไร (%)<input class="r" data-t="num" data-p="${b}.mk" value="${n(Q.mk)||''}" placeholder="0"></label>
    <label style="width:260px">คิดกำไรแบบ<select data-p="${b}.mkDiv"><option value=""${Q.mkDiv?'':' selected'}>บวกบนทุน (ทุน × (1 + %))</option><option value="1"${Q.mkDiv?' selected':''}>กำไรจากราคาขาย (ทุน ÷ (1 − %))</option></select></label>
    <button type="button" class="btn sm" data-a="qmaMkAll" data-id="${Q.id}">ใช้ % นี้กับทุกรายการ</button>
    <small class="muted" style="flex:1;min-width:220px">ราคา/ครั้ง = ทุน/ครั้ง + % กำไร ปัดขึ้นตาม “ปัดราคาขาย/หน่วย” · ช่องที่พิมพ์ราคาเองใช้ราคานั้น${p==null?'':` · ทั้งใบ: ทุน ${fmt(c.cost,0)} ขาย ${fmt(c.net,0)} กำไร ${fmt(p,1)}%`}</small></div>`}
{const f=qmaCard;qmaCard=function(Q,b){qmkAuto(Q);let h=f.apply(this,arguments);const m=qmMonths(Q),a=h.indexOf('<div class="tw"><table><thead><tr><th>เครื่อง / ระบบ</th>'),z=a<0?-1:h.indexOf('</tbody></table></div>',a);if(z<0)return h;
  const t=`<div class="tw"><table><thead><tr><th>เครื่อง / ระบบ</th><th class="r">จำนวน</th><th>หน่วย</th><th class="r">ครั้ง/ปี</th><th class="r">ทุน/หน่วย/ครั้ง</th><th class="r">ราคา/หน่วย/ครั้ง</th><th class="r">กำไร</th><th class="r">${m===12?'ราคาต่อปี':`รวม ${m} เดือน`}</th><th></th></tr></thead><tbody>${qmkRows(Q,b)||'<tr><td colspan="9" class="empty">ยังไม่มีรายการ เพิ่มเครื่องหรือระบบที่ดูแล</td></tr>'}</tbody></table></div>`;
  return h.slice(0,a)+qmkBar(Q,b)+t+h.slice(z+'</tbody></table></div>'.length)}}
ACT.qmaMkAll=b=>{const Q=CO().quotes.find(q=>q.id===b.dataset.id);if(!Q)return;let k=0;Q.items.forEach(i=>{if(qmkCostU(i)>0&&!i.mka){i.mka=1;k++}});qmkAuto(Q);save();render();
  toast(k?`${k} รายการคิดราคาจากทุน + ${fmtq(n(Q.mk))}% แล้ว`:'ทุกรายการที่มีทุนคิดจาก % กำไรอยู่แล้ว')};
// a cost per unit per visit typed: the line's cost over the contract, material and labour keeping their split
// (window capture runs before 981's document listener, which stops the event for the visits and price boxes)
window.addEventListener('change',e=>{const el=e.target,d=el.dataset||{};
  if(d.qmp){const Q=CO().quotes.find(q=>q.id===d.qmp),i=Q&&Q.items.find(x=>x.id===d.k);if(i)i.mka=el.value.trim()===''&&qmkCostU(i)>0?1:0;if(i&&i.mka){e.stopImmediatePropagation();qmkAuto(Q);save();render()}return}
  if(d.qmc){e.stopImmediatePropagation();const Q=CO().quotes.find(q=>q.id===d.qmc),i=Q&&Q.items.find(x=>x.id===d.k);if(!i)return;
    const c=Math.max(0,n(el.value))*qmVisits(Q,i),m=n(i.m),l=n(i.l),s=m+l;if(s>0){i.m=Math.round(c*m/s*100)/100;i.l=Math.round(c*l/s*100)/100}else{i.m=c;i.l=0}
    i.t=Math.round(n(i.q)*(n(i.m)+n(i.l))*100)/100;if(!n(i.sp))i.mka=1;qmkAuto(Q);save();render();return}
  // the visits a year change: keep the cost per visit (981 then keeps the price per visit)
  if(d.qmv){const Q=CO().quotes.find(q=>q.id===d.qmv),i=Q&&Q.items.find(x=>x.id===d.k);if(!i)return;const cv=qmkPerVisit(Q,i),m=n(i.m),l=n(i.l),s=m+l;if(!(cv>0&&s>0))return;
    const v0=i.vis;i.vis=el.value.trim()===''?'':n(el.value);const c=cv*qmVisits(Q,i);i.vis=v0;i.m=Math.round(c*m/s*100)/100;i.l=Math.round(c*l/s*100)/100;i.t=Math.round(n(i.q)*(i.m+i.l)*100)/100}},true);
// the quantity changes the line's cost total too
HOOK.push((p)=>{const x=p.match(/^co\.quotes\.([^.]+)\.items\.([^.]+)\.q$/);if(!x)return;const Q=CO().quotes.find(q=>q.id===x[1]);if(!Q||!qmMa(Q))return;const i=Q.items.find(y=>y.id===x[2]);
  if(i&&n(i.m)+n(i.l)>0)i.t=Math.round(n(i.q)*(n(i.m)+n(i.l))*100)/100});
{const f=PRINT.quote;PRINT.quote=id=>{qmkAuto((CO().quotes||[]).find(q=>q.id===id));return f(id)}}
