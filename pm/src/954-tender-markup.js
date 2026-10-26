/* ---------- 4.87: กำไรในใบประมูล (mark-up on a bid, like a quotation's) ----------
   A bid's lines are costs. กำไรค่าของ % / กำไรค่าแรง % for the whole bid (t.mkM, t.mkL) and per หมวด (t.mkG[g] = {m, l},
   blank = the whole bid's) give the company's own price: cost + mark-up + site costs at cost, then VAT, rounding and the
   extra discount as before. Any box filled turns it on. ปร.4 / ปร.5 / ปร.6 still print the reference price (cost × Factor F);
   the bid list, the quotation made from the bid, the bid bond and the sales lead take the company's price. */
let TDSELL=0;
const tdMkSet=v=>v!==''&&v!=null;
const tdMkOn=t=>tdMkSet(t.mkM)||tdMkSet(t.mkL)||Object.values(t.mkG||{}).some(x=>x&&(tdMkSet(x.m)||tdMkSet(x.l)));
const tdMkP=(t,g,k)=>{const x=(t.mkG||{})[g],v=x&&x[k];return tdMkSet(v)?n(v):n(t[k==='m'?'mkM':'mkL'])};
// the company's price from the reference calculation c (tdCalc without the mark-up)
function tdSell(t,c){const vat=n(t.vat)/100,gov=t.mode!=='pvt';
  const sm=sum(t.items,i=>n(i.q)*tdM(t,i)*(1+tdMkP(t,i.g,'m')/100)),sl=sum(t.items,i=>n(i.q)*tdL(t,i)*(1+tdMkP(t,i.g,'l')/100)),net0=sm+sl+c.dp;
  const raw=gov?net0*(1+vat):net0,rd=Math.max(1,n(t.round)),bid=Math.max(0,Math.floor(raw/rd)*rd-n(t.disc));
  const net=gov?bid/(1+vat):bid,vt=gov?bid-net:bid*vat,gross=gov?bid:bid+vt,profit=net-c.D;
  return {sm,sl,net0,raw,bid,net,vat:vt,gross,profit,pct:c.D?profit/c.D*100:0,mk:c.D?net/c.D:1,ref:c.gross,vsRef:c.gross?(gross-c.gross)/c.gross*100:null}}
{const f=tdCalc;tdCalc=t=>{const c=f(t);if(!TDSELL||!tdMkOn(t))return c;const s=tdSell(t,c);
  return Object.assign({},c,{raw:s.raw,bid:s.bid,net:s.net,vat:s.vat,gross:s.gross,mk:s.mk,margin:s.profit,profitLeft:s.profit,diff:c.bud?(s.gross-c.bud)/c.bud*100:null,sell:s})}}
const tdWithSell=fn=>(...a)=>{TDSELL++;try{return fn(...a)}finally{TDSELL--}};
{const f=tdList;tdList=tdWithSell(f)}
['tdBond','tdLead'].forEach(k=>{ACT[k]=tdWithSell(ACT[k])});
// a quotation made from a marked-up bid: each line sells at its own mark-up, site costs spread over the lines like before
{const f=tdWithSell(ACT.tdQuote);ACT.tdQuote=b=>{const t=tdById(b.dataset.id),had=t&&t.quote&&CO().quotes.some(q=>q.id===t.quote);f(b);
  if(!t||had||!tdMkOn(t))return;const q=CO().quotes.find(x=>x.id===t.quote);if(!q)return;TDSELL++;const c=tdCalc(t);TDSELL--;
  const pre=c.dm+c.dl?1+c.dp/(c.dm+c.dl):1;
  q.items.forEach((x,k)=>{const i=t.items[k];if(!i)return;x.sp=Math.round((tdM(t,i)*(1+tdMkP(t,i.g,'m')/100)+tdL(t,i)*(1+tdMkP(t,i.g,'l')/100))*pre*100)/100});
  const sub=sum(q.items,i=>n(i.q)*n(i.sp));q.disc=Math.max(0,Math.round((sub-c.net)*100)/100);save();render()}}

function tdMkCard(t){const b=`co.tenders.${t.id}`,c=tdCalc(t),s=tdSell(t,c),on=tdMkOn(t),gov=t.mode!=='pvt';if(!t.mkG)t.mkG={};
  const box=(p,v,l)=>`<input class="r" data-t="num" inputmode="decimal" data-p="${p}" value="${tdMkSet(v)?esc(v):''}" placeholder="${l}" aria-label="${l}" style="max-width:90px">`;
  const G=[...new Set(t.items.map(i=>i.g))];
  const rows=G.map(g=>{if(!t.mkG[g])t.mkG[g]={m:'',l:''};const L=t.items.filter(i=>i.g===g),cm=sum(L,i=>n(i.q)*tdM(t,i)),cl=sum(L,i=>n(i.q)*tdL(t,i)),
      sm=sum(L,i=>n(i.q)*tdM(t,i)*(1+tdMkP(t,g,'m')/100)),sl=sum(L,i=>n(i.q)*tdL(t,i)*(1+tdMkP(t,g,'l')/100));
    return `<tr><td>${esc(gName(g))}</td><td class="r">${fmt(cm)}</td><td>${box(`${b}.mkG.${g}.m`,t.mkG[g].m,tdMkSet(t.mkM)?fmtq(t.mkM):'ทั้งใบ')}</td>
      <td class="r">${fmt(cl)}</td><td>${box(`${b}.mkG.${g}.l`,t.mkG[g].l,tdMkSet(t.mkL)?fmtq(t.mkL):'ทั้งใบ')}</td><td class="r">${fmt(sm+sl)}</td><td class="r">${fmt(sm+sl-cm-cl)}</td></tr>`}).join('');
  const lo=s.vsRef!=null&&s.vsRef>0;
  return `<section class="card"><h2><span>บวกกำไร (ราคาที่บริษัทยื่น)</span><small>${on?'เปิดใช้':'ยังไม่ได้ใส่ ราคาที่ยื่นตาม Factor F'}</small></h2>
  <div class="form" style="margin-bottom:10px"><label>กำไรค่าของ ทั้งใบ (%)${box(`${b}.mkM`,t.mkM,'0')}</label><label>กำไรค่าแรง ทั้งใบ (%)${box(`${b}.mkL`,t.mkL,'0')}</label></div>
  ${G.length?`<div class="tw"><table><thead><tr><th>หมวด</th><th class="r">ทุนค่าของ</th><th>กำไรของ %</th><th class="r">ทุนค่าแรง</th><th>กำไรแรง %</th><th class="r">ราคาขาย</th><th class="r">กำไร</th></tr></thead>
    <tbody>${rows}</tbody></table></div>`:''}
  ${on?`<dl class="stats" style="margin-top:12px"><div><dt>ราคาที่บริษัทยื่น${gov?' (รวม VAT)':''}</dt><dd>${fmt(s.gross)}</dd></div>
    <div><dt>กำไรจากต้นทุน</dt><dd style="color:${s.profit>=0?'var(--good)':'var(--danger)'}">${fmt(s.profit)} (${fmt(s.pct,1)}%)</dd></div>
    ${gov?`<div><dt>ราคากลาง (ต้นทุน × Factor F)</dt><dd>${fmt(s.ref)}</dd></div><div><dt>เทียบราคากลาง</dt><dd style="color:${lo?'var(--danger)':'var(--good)'}">${s.vsRef>0?'+':''}${fmt(s.vsRef,1)}%</dd></div>`:''}</dl>
    ${gov&&lo?`<p class="hint" style="color:var(--danger)">ราคาที่ยื่นสูงกว่าราคากลาง ${fmt(s.vsRef,1)}% ลดกำไรลงก่อนยื่น</p>`:''}`:''}
  <p class="hint">ช่องในตารางเว้นว่าง = ใช้ % ทั้งใบ · ค่าใช้จ่ายหน้างานคิดตามทุน · ใบ ปร.4 / ปร.5 ที่พิมพ์ยังเป็นราคากลางตาม Factor F ส่วนรายการงานประมูล ใบเสนอราคา หนังสือค้ำซอง และงานขาย ใช้ราคาที่บริษัทยื่น</p></section>`}
{const f=tdView;tdView=function(){const h=f(),t=curTd();if(!t)return h;const k=h.indexOf('<section class="card"><h2><span>รายการ ปริมาณงาน');return k<0?h+tdMkCard(t):h.slice(0,k)+tdMkCard(t)+h.slice(k)}}
