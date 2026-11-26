/* 4.99.73 งวดงาน ตามใบเสนอราคา (user, INSEE QT-001-1 / QT-001-2: "ทำไมไม่แยกตามใบเสนอราคา"). A project's งวดงาน were filled
   only once, when the quote was won, and nothing could fill them again: a schedule typed over by hand, or a quote whose งวด were
   changed after ได้งาน, stayed wrong (here ค่าเครื่อง 100% + 0%, ค่าติดตั้ง blank + 100%, รวม 200%). The งวดงาน card now has
   "ตั้งงวดตามใบเสนอราคา <no>" for a project made from a won quote: with แยกค่าเครื่อง each งวด of the equipment quote (-1) and of the
   installation quote (-2) becomes a % of the whole contract (its % × that quote's share of the price), so they add up to 100% and
   each amount is the quote's own amount before VAT. Rows with the same งวด number keep their id, milestone and claims.
   The card also shows each งวด with VAT, the figure printed on the quotation, and the warning about a total that is not 100%
   offers the same button. */
const iqQuote=p=>p&&(CO().quotes||[]).find(q=>q.pj===p.id&&q.status==='won'&&(q.qpay||[]).length+(q.qpayE||[]).length>0)||null;
function iqBuild(Q){const r=v=>Math.round(v*1e4)/1e4,L=[];
  const two=Q.eqSep&&!(typeof qmMa==='function'&&qmMa(Q))&&(Q.qpayE||[]).length&&(Q.qpay||[]).length&&typeof qmParts==='function'&&qmParts(Q);
  if(two){const a=qCalc(two[0]).net,s=qCalc(two[1]).net,w=a+s>0?a/(a+s):0,ws=Q.whtB==='none'?0:Math.round(3*qmWhtShare(two[1])*1000)/1000;
    Q.qpayE.forEach(x=>L.push({no:'E'+x.no,desc:'ค่าเครื่อง: '+(x.desc||''),pct:r(n(x.pct)*w),wp:0}));
    Q.qpay.forEach(x=>L.push({no:'S'+x.no,desc:'ค่าติดตั้ง: '+(x.desc||''),pct:r(n(x.pct)*(1-w)),wp:ws}));
    // both schedules complete: the last งวด takes the rounding, so the whole adds up to exactly 100%
    const t=sum(L,x=>n(x.pct)),z=L.filter(x=>n(x.pct)).pop();if(z&&Math.abs(t-100)<0.01)z.pct=r(n(z.pct)+100-t)}
  else (Q.qpay||[]).forEach(x=>L.push({no:x.no,desc:x.desc,pct:n(x.pct)}));
  // retention as 4.22 sets it when the quote is won
  const W=typeof qWr==='function'&&qWr(Q),ret=W&&W.m?n(W.ret):0,sub=L.filter(x=>!(Q.eqSep&&W&&!W.e&&/^E/.test(String(x.no||''))));
  if(W){L.forEach(x=>x.rp=0);if(ret&&sub.length){if(W.m==='last')sub[sub.length-1].rx=r(ret*sum(sub,x=>n(x.pct))/100);else sub.forEach(x=>x.rp=ret)}}
  return L}
ACT.instFromQ=()=>{const Q=iqQuote(P);if(!Q)return;const L=iqBuild(Q);if(!L.length){toast('ใบเสนอราคายังไม่มีงวดเงิน');return}
  const old=P.inst||[];if(old.length&&!confirm(`ตั้งงวดงานใหม่ตามใบเสนอราคา ${Q.no||''}?\nงวดเดิม ${old.length} งวดจะถูกแทนที่ (งวดที่เลขตรงกันเก็บหมุดหมายและใบเบิกไว้)`))return;
  const used=new Set();
  P.inst=L.map(x=>{const o=old.find(y=>!used.has(y)&&String(y.no)===String(x.no));if(o)used.add(o);
    const it=Object.assign({id:o?o.id:uid(),task:o?o.task||'':'',date:o?o.date||'':''},x);return it});
  const gone=new Set(old.filter(y=>!used.has(y)).map(y=>y.id));(P.bills||[]).forEach(b=>{if(b.inst&&gone.has(b.inst))b.inst=''});
  P.info.billMode='pct';if(Q.eqSep&&Q.whtB!=='none'&&P.inst.some(x=>x.wp!==undefined))P.info.wht=Math.round(3*qmWhtShare(Q)*1000)/1000;
  if(P.inst.some(x=>x.rp!==undefined||x.rx!==undefined))P.info.ret=0;save();render();
  toast(`ตั้งงวดตาม ${Q.no||'ใบเสนอราคา'} แล้ว ${P.inst.length} งวด รวม ${fmt(sum(P.inst,x=>n(x.pct)),1)}%`)};
{const f=costBill;costBill=function(){let h=f.apply(this,arguments);if(P.info.billMode!=='pct')return h;const Q=iqQuote(P);if(!Q)return h;
  const lab=`ตั้งงวดตามใบเสนอราคา ${esc(Q.no||'')}`;
  h=h.replace('<button type="button" class="btn sm" data-a="instGen">',`<button type="button" class="btn sm" data-a="instFromQ" title="แทนที่งวดงานด้วยงวดเงินในใบเสนอราคา${Q.eqSep?' (ค่าเครื่อง + ค่าติดตั้ง คิดเป็น % ของทั้งสัญญา)':''}">${lab}</button>$&`);
  return h.replace(/(<span class="pill warn">รวม [^<]*% ยังไม่เท่ากับ 100%<\/span>)/,`$1 <button type="button" class="btn sm pri" data-a="instFromQ">${lab}</button>`)}}
// each งวด with VAT next to its amount, as the quotation prints it
{const g=gtable;gtable=function(base,rows,cols,o){if(base==='inst'&&Array.isArray(cols)&&cols.some(c=>c.h==='% ของสัญญา')&&!cols.some(c=>c.h==='รวม VAT')){
  const k=cols.findIndex(c=>c.h==='จำนวนเงิน');if(k>=0){const C=contract(),v=n(P.info.vat===undefined||P.info.vat===''?7:P.info.vat);
    cols=cols.slice();cols.splice(k+1,0,{h:'รวม VAT',t:'calc',r:1,f:x=>fmt(C.total*n(x.pct)/100*(1+v/100))})}}
  return g.apply(this,[base,rows,cols,o].slice(0,arguments.length))}}
if(typeof I18N==='object'&&I18N.en&&I18N.en.x)Object.assign(I18N.en.x,{'รวม VAT':'Incl. VAT'});
