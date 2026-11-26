/* 4.99.73 งวดงาน ตามใบเสนอราคา (user, INSEE QT-001-1 / QT-001-2: "ทำไมไม่แยกตามใบเสนอราคา"). A project's งวดงาน were filled
   only once, when the quote was won, and nothing could fill them again: a schedule typed over by hand, or a quote whose งวด were
   changed after ได้งาน, stayed wrong (here ค่าเครื่อง 100% + 0%, ค่าติดตั้ง blank + 100%, รวม 200%). The งวดงาน card now has
   "ตั้งงวดตามใบเสนอราคา <no>" for a project made from a won quote: with แยกค่าเครื่อง each งวด of the equipment quote (-1) and of the
   installation quote (-2) becomes a % of the whole contract (its % × that quote's share of the price), so they add up to 100% and
   each amount is the quote's own amount before VAT. Rows with the same งวด number keep their id, milestone and claims.
   The card also shows each งวด with VAT, the figure printed on the quotation, and the warning about a total that is not 100%
   offers the same button. */
const iqP=v=>n(v).toLocaleString('th-TH',{maximumFractionDigits:4});
const iqNo=(Q,x)=>{const m=String(x.no||'').match(/^([ES])\d/);return m&&Q.no?Q.no+(m[1]==='E'?'-1':'-2'):''};
// 4.99.80 (user: "% ของสัญญา ไม่ต้องทำเฉลี่ย อยากให้แยกเงินแต่ละใบออกไปเลย"): with แยกค่าเครื่อง each งวด shows and takes its % of its own
// quotation (มัดจำ 50% of QT-001-1), as printed on it; the stored % of the contract (what claims use) is worked out from that quotation's
// share of the price.
const iqShare=(Q,k)=>{try{const T=Q&&Q.eqSep&&qmParts(Q);if(!T)return 0;const a=qCalc(T[0]).net,b=qCalc(T[1]).net;return a+b>0?100*(k==='E'?a:b)/(a+b):0}catch(e){return 0}};
const iqKind=x=>{const m=String(x.no||'').match(/^([ES])\d/);return m?m[1]:''};
const iqQuote=p=>p&&(CO().quotes||[]).find(q=>q.pj===p.id&&q.status==='won'&&(q.qpay||[]).length+(q.qpayE||[]).length>0)||null;
function iqBuild(Q){const r=v=>Math.round(v*1e6)/1e6,L=[];
  const two=Q.eqSep&&!(typeof qmMa==='function'&&qmMa(Q))&&(Q.qpayE||[]).length&&(Q.qpay||[]).length&&typeof qmParts==='function'&&qmParts(Q);
  if(two){const a=qCalc(two[0]).net,s=qCalc(two[1]).net,w=a+s>0?a/(a+s):0,ws=Q.whtB==='none'?0:Math.round(3*qmWhtShare(two[1])*1000)/1000;
    Q.qpayE.forEach(x=>L.push({no:'E'+x.no,desc:'ค่าเครื่อง: '+(x.desc||''),pct:r(n(x.pct)*w),wp:0}));
    Q.qpay.forEach(x=>L.push({no:'S'+x.no,desc:'ค่าติดตั้ง: '+(x.desc||''),pct:r(n(x.pct)*(1-w)),wp:ws}));
    // both schedules complete: the last งวด takes the rounding, so the whole adds up to exactly 100%
    // each quotation's last งวด takes its rounding, so each part is exactly its share and the whole exactly 100%
    const tE=r(100*w),fix=(G,t)=>{const z=G.filter(x=>n(x.pct)).pop(),d=t-sum(G,x=>n(x.pct));if(z&&Math.abs(d)<0.01)z.pct=r(n(z.pct)+d)};
    if(Math.abs(sum(Q.qpayE,x=>n(x.pct))-100)<0.01)fix(L.filter(x=>/^E/.test(x.no)),tE);
    if(Math.abs(sum(Q.qpay,x=>n(x.pct))-100)<0.01)fix(L.filter(x=>/^S/.test(x.no)),r(100-tE))}
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
  if(P.inst.some(x=>x.rp!==undefined||x.rx!==undefined))P.info.ret=0;save();if(!iqQuiet)render();
  toast(`ตั้งงวดตาม ${Q.no||'ใบเสนอราคา'} แล้ว ${P.inst.length} งวด รวม ${fmt(sum(P.inst,x=>n(x.pct)),1)}%`)};
// 4.99.74 (user: "ไม่แยกตามใบเสนอราคาเลย"): a schedule that came from a split quote, does not add up to 100% and has no claim yet
// is set again by itself when the page opens, so nobody has to find the button
let iqQuiet=0;
function iqAuto(){if(!P||P.info.billMode!=='pct'||P.info.iqAuto)return;const I=P.inst||[],Q=iqQuote(P);if(!Q||!Q.eqSep||!I.length)return;
  if(Math.abs(sum(I,x=>n(x.pct))-100)<0.01||!I.every(x=>/^[ES]\d/.test(String(x.no||'')))||(P.bills||[]).some(b=>b.inst&&I.some(x=>x.id===b.inst)))return;
  const L=iqBuild(Q);if(!L.length||Math.abs(sum(L,x=>n(x.pct))-100)>0.01)return;const cf=window.confirm;window.confirm=()=>true;
  iqQuiet=1;try{ACT.instFromQ()}finally{window.confirm=cf;iqQuiet=0}P.info.iqAuto=1;save()}
{const f=costBill;costBill=function(){try{iqAuto()}catch(e){}let h=f.apply(this,arguments);if(P.info.billMode!=='pct')return h;
  h=h.replace('<section class="card"><h2><span>งวดงาน</span><small>','<section class="card iq-card"><h2><span>งวดงาน</span><small><span class="muted">แก้เงื่อนไข % จำนวนเงิน หรือยอดรวม VAT ในตารางได้เลย</span> ');const Q=iqQuote(P);if(!Q)return h;
  const lab=`ตั้งงวดตามใบเสนอราคา ${esc(Q.no||'')}`;
  h=h.replace('<button type="button" class="btn sm" data-a="instGen">',`<button type="button" class="btn sm" data-a="instFromQ" title="แทนที่งวดงานด้วยงวดเงินในใบเสนอราคา${Q.eqSep?' (ค่าเครื่อง + ค่าติดตั้ง คิดเป็น % ของทั้งสัญญา)':''}">${lab}</button>$&`);
  if(Q.eqSep&&Q.no){const C=contract(),v=n(P.info.vat===undefined||P.info.vat===''?7:P.info.vat),G={};
    (P.inst||[]).forEach(x=>{const k=iqNo(Q,x)||'อื่น ๆ';(G[k]=G[k]||[]).push(x)});
    const lab={[Q.no+'-1']:'ค่าเครื่อง (สินค้า)',[Q.no+'-2']:'ค่าติดตั้ง วัสดุ และค่าแรง'},row=(k,L)=>{const k0=k,pc=sum(L,x=>n(x.pct)),a=C.total*pc/100;
      return `<tr><td><b>${esc(k)}</b></td><td>${esc(lab[k]||'')}</td><td class="r">${L.length}</td><td class="r">${(()=>{const k=/-1$/.test(k0)?'E':/-2$/.test(k0)?'S':'',h=k&&iqShare(Q,k);return h?iqP(Math.round(pc*1e6/h)/1e4)+'%':iqP(pc)})()}</td><td class="r">${fmt(a,2)}</td><td class="r">${fmt(a*(1+v/100),2)}</td></tr>`};
    const ks=Object.keys(G),tp=sum(P.inst||[],x=>n(x.pct)),ta=C.total*tp/100;
    const box=`<div class="tw iq-sum" style="margin-top:10px"><table><thead><tr><th>เลขที่ใบเสนอราคา</th><th>ส่วน</th><th class="r">จำนวนงวด</th><th class="r">% ของใบเสนอราคา</th><th class="r">ยอดเงิน (ไม่รวม VAT)</th><th class="r">รวม VAT</th></tr></thead><tbody>
      ${ks.map(k=>row(k,G[k])).join('')}<tr class="tot"><td>รวม</td><td></td><td class="r">${(P.inst||[]).length}</td><td class="r"></td><td class="r">${fmt(ta,2)}</td><td class="r">${fmt(ta*(1+v/100),2)}</td></tr></tbody></table></div>`;
    const m=h.indexOf('<section class="card iq-card">'),e=m<0?-1:h.indexOf('<div class="row" style="margin-top:8px">',m);if(e>0)h=h.slice(0,e)+box+h.slice(e)}
  return h.replace(/(<span class="pill warn">รวม [^<]*% ยังไม่เท่ากับ 100%<\/span>)/,`$1 <button type="button" class="btn sm pri" data-a="instFromQ">${lab}</button>`)}}
// 4.99.75 (user: "เพิ่มให้สามารถแก้ไขงวดงานได้"): the automatic fix above runs once per project and never after the schedule is
// edited by hand (it used to undo a % typed while the total was not yet 100%). The amount and with-VAT cells can be typed too: the
// % of the contract is worked back from them. The editable cells get a visible box.
HOOK.push(p=>{if(P&&P.info&&/^inst(\.|$)/.test(p))P.info.iqAuto=1});
{const f=ACT.add;if(f)ACT.add=function(b){if(P&&P.info&&b&&b.dataset&&b.dataset.c==='inst')P.info.iqAuto=1;return f.apply(this,arguments)}}
{const f=ACT.delRow;if(f)ACT.delRow=function(b){if(P&&P.info&&b&&b.dataset&&b.dataset.c==='inst')P.info.iqAuto=1;return f.apply(this,arguments)}}
document.addEventListener('change',e=>{const t=e.target;if(!t||!t.dataset||!t.dataset.iqamt||!P)return;e.stopImmediatePropagation();
  const it=(P.inst||[]).find(x=>x.id===t.dataset.iqamt),base=n(t.dataset.base);if(!it||!base)return;
  it.pct=Math.round(n(t.value)*1e8/base)/1e6;P.info.iqAuto=1;save();rerender()},true);
document.addEventListener('change',e=>{const t=e.target;if(!t||!t.dataset||!t.dataset.iqqp||!P)return;e.stopImmediatePropagation();
  const it=(P.inst||[]).find(x=>x.id===t.dataset.iqqp),sh=n(t.dataset.sh);if(!it||!sh)return;
  it.pct=Math.round(n(String(t.value).replace(/,/g,''))*sh*1e4)/1e6;P.info.iqAuto=1;save();rerender()},true);
// each งวด with VAT next to its amount, as the quotation prints it
{const g=gtable;gtable=function(base,rows,cols,o){if(base==='inst'&&Array.isArray(cols)&&cols.some(c=>c.h==='% ของสัญญา')&&!cols.some(c=>c.h==='รวม VAT')){
  const k=cols.findIndex(c=>c.h==='จำนวนเงิน');if(k>=0){const C=contract(),v=n(P.info.vat===undefined||P.info.vat===''?7:P.info.vat);
    const box=(x,m)=>`<input class="r iq-amt" inputmode="decimal" data-iqamt="${x.id}" data-base="${C.total*m}" value="${fmt(C.total*n(x.pct)/100*m)}" aria-label="จำนวนเงิน">`;
    cols=cols.slice();cols[k]=Object.assign({},cols[k],{f:x=>box(x,1)});cols.splice(k+1,0,{h:'รวม VAT',t:'calc',r:1,f:x=>box(x,1+v/100)});
    const Q=iqQuote(P);if(Q&&Q.eqSep&&Q.no){const j=cols.findIndex(c=>c.k==='desc');cols.splice(j+1,0,{h:'ใบเสนอราคา',t:'calc',f:x=>esc(iqNo(Q,x)||'')})}
    if(Q&&Q.eqSep&&(rows||[]).some(x=>iqKind(x))){const sh={E:iqShare(Q,'E'),S:iqShare(Q,'S')},kp=cols.findIndex(c=>c.k==='pct');
      if(kp>=0&&sh.E&&sh.S)cols[kp]={h:'% ของใบเสนอราคา',t:'calc',r:1,w:110,f:x=>{const k=iqKind(x);if(!k)return `<input class="r" inputmode="decimal" data-p="inst.${x.id}.pct" data-t="num" value="${esc(x.pct)}" aria-label="% ของสัญญา">`;
        return `<input class="r iq-qp" inputmode="decimal" data-iqqp="${x.id}" data-sh="${sh[k]}" value="${iqP(Math.round(n(x.pct)*1e6/sh[k])/1e4)}" aria-label="% ของใบเสนอราคา">`}}}}}
  return g.apply(this,[base,rows,cols,o].slice(0,arguments.length))}}
if(typeof I18N==='object'&&I18N.en&&I18N.en.x)Object.assign(I18N.en.x,{'รวม VAT':'Incl. VAT'});
document.head.insertAdjacentHTML('beforeend',`<style>.iq-amt{width:100%;min-width:96px;border:1px solid var(--line);border-radius:8px;padding:5px 8px;background:transparent;color:inherit;font:inherit}
.iq-amt:focus,.iq-amt:hover{border-color:var(--pri,#0ea5e9)}
.iq-card td input[data-p$=".pct"]{min-width:118px}
.iq-sum tr.tot td{font-weight:700;border-top:2px solid var(--line)}
.iq-card td input:not([type=checkbox]),.iq-card td select{border:1px solid var(--line);border-radius:8px;padding:5px 8px}</style>`);
