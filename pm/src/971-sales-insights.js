/* ---------- 4.99.6 ใบเสนอราคา › ดูแบบ วิเคราะห์ (user: "ทำทั้งหมดเลย", the four views offered beside the customer chart) ----------
   1. ราคาเสนอ / ได้งาน / ต้นทุน per customer: first offer (Rev.0 when the quote has revisions) and final price of won quotes, so the
      discount the customer pushed for shows; then their jobs' contract, BOQ budget, cost so far and forecast, forecast profit, and
      how far the forecast runs over the budget (บานปลาย).
   2. ลูกหนี้ per customer: outstanding on issued claims, overdue by age (1–30, 31–60, 61–90, over 90 days past due), the oldest,
      and how many days late paid claims were on average (last receipt date against the due date, customer credit days).
   3. ใบเสนอราคาค้าง: drafts and sent quotes, biggest first, with days left before the price expires (red when expired, amber ≤ 7).
   4. ประเภทงาน: each quote is sorted by words in its title (air conditioning, ducts, piping, fire, CCTV, electrical, PM/MA, other):
      quotes, won, won value and profit with its % so the most profitable kinds of work stand out.
   Profit of a won job is the same as the customer chart (969): the project's forecast once it exists, else the quote's own. */
const SI_WT=[['ma','บริการ PM / MA',/บำรุงรักษา|\bPM\b|\bMA\b|service|ล้างแอร์|ตรวจเช็ค/i],['duct','ท่อลม / ระบายอากาศ',/ท่อลม|duct|ระบายอากาศ|พัดลม|exhaust|fresh air/i],
  ['fire','ระบบดับเพลิง',/ดับเพลิง|fire|sprinkler|สปริงเกอร์|fm-?200/i],['cctv','กล้อง / สื่อสาร / LAN',/กล้อง|cctv|lan|network|access|matv|สื่อสาร/i],
  ['ac','ระบบปรับอากาศ',/ปรับอากาศ|แอร์|\bvrf\b|\bvrv\b|ahu|fcu|chiller|ชิลเลอร์|split|inverter|btu|คอยล์/i],
  ['pipe','ท่อ / ประปา / สุขาภิบาล',/ท่อ|ประปา|สุขาภิบาล|pipe|ppr|pump|ปั๊ม|บำบัด|อากาศอัด/i],['elec','ระบบไฟฟ้า',/ไฟฟ้า|electric|ตู้\s*mdb|สายไฟ|แสงสว่าง|โคม/i]];
const siWt=q=>{const t=`${q.title||''} ${q.pname||''}`;const w=SI_WT.find(([, ,re])=>re.test(t));return w?w[0]:'etc'};
const siWtL=k=>(SI_WT.find(x=>x[0]===k)||[k,'อื่น ๆ'])[1];
const siCust=id=>custName(id)||'(ไม่ระบุลูกค้า)';
const siPct=(a,b)=>b?fmt(a*100/b,1)+'%':'–';
const siTb=(h,rows,foot)=>`<div class="tw"><table class="si-t"><thead><tr>${h.map(x=>`<th${x[1]?' class="r"':''}>${x[0]}</th>`).join('')}</tr></thead><tbody>${rows||`<tr><td colspan="${h.length}" class="empty">ยังไม่มีข้อมูล</td></tr>`}</tbody>${foot?`<tfoot>${foot}</tfoot>`:''}</table></div>`;
const siNeg=v=>`<span${v<0?' class="qg-neg"':''}>${fmt(v,0)}</span>`;
// 1. price and cost per customer
function siPrice(Q){const M=new Map(),g=k=>M.get(k)||M.set(k,{nm:siCust(k),first:0,won:0,n:0,cv:0,bud:0,com:0,fc:0,pj:new Set()}).get(k);
  Q.filter(q=>q.status==='won').forEach(q=>{const c=qCalc(q),x=g(q.cust||''),r0=(q.revs||[])[0];x.n++;x.won+=c.net;x.first+=r0&&r0.sum&&r0.sum.net?n(r0.sum.net):c.net;
    const p=q.pj&&DB.projects[q.pj];if(p&&!x.pj.has(p.id)){x.pj.add(p.id);try{const k=pjKpi(p),T=k.T;x.cv+=k.C.total;x.bud+=T.bud;x.com+=T.com;x.fc+=T.fc}catch(e){}}});
  const L=[...M.values()].sort((a,b)=>b.won-a.won),T={first:sum(L,x=>x.first),won:sum(L,x=>x.won),cv:sum(L,x=>x.cv),bud:sum(L,x=>x.bud),com:sum(L,x=>x.com),fc:sum(L,x=>x.fc)};
  const row=(x,b)=>{const pf=x.cv-x.fc,ov=x.fc-x.bud;return `<tr${b?' class="tot"':''}><td>${b?'รวม':esc(x.nm)}</td><td class="r">${b?'':x.n}</td><td class="r">${fmt(x.first,0)}</td><td class="r">${fmt(x.won,0)}</td><td class="r">${x.first>x.won?siPct(x.first-x.won,x.first):'–'}</td>
    <td class="r">${x.cv?fmt(x.cv,0):'–'}</td><td class="r">${x.cv?fmt(x.bud,0):'–'}</td><td class="r">${x.cv?fmt(x.com,0):'–'}</td><td class="r">${x.cv?fmt(x.fc,0):'–'}</td><td class="r">${x.cv?siNeg(pf)+`<small class="muted si-sub">${siPct(pf,x.cv)}</small>`:'–'}</td><td class="r">${x.cv&&ov>0.5?`<span class="pill bad">+${fmt(ov,0)}</span>`:x.cv?'<span class="pill ok">ในงบ</span>':'–'}</td></tr>`};
  return `<section class="card"><h2><span>1. ราคาเสนอ · ราคาได้งาน · ต้นทุน ต่อลูกค้า</span><small>เฉพาะงานที่ได้ · ราคาเสนอครั้งแรก = Rev.0 ของใบเสนอราคา · ต้นทุนจากโครงการที่เปิดแล้ว</small></h2>
  ${siTb([['ลูกค้า'],['งาน',1],['เสนอครั้งแรก',1],['ราคาได้งาน',1],['ลดให้',1],['มูลค่าสัญญา',1],['งบต้นทุน (BOQ)',1],['ใช้ไปแล้ว',1],['ต้นทุนคาดการณ์',1],['กำไรคาดการณ์',1],['เกินงบ',1]],L.map(x=>row(x)).join(''),L.length>1?row(T,1):'')}</section>`}
// 2. receivables per customer
function siAR(){const td=today(),M=new Map(),g=k=>M.get(k)||M.set(k,{nm:siCust(k),out:0,b:[0,0,0,0],old:0,late:0,nl:0,np:0}).get(k);
  projects().forEach(p=>(p.bills||[]).forEach(b=>{if(b.status==='draft')return;const c=withP(p,()=>billCalc(b)),x=g(p.info.cust||''),due=billDue(p,b),rc=billRcList(b),got=sum(rc,r=>r.amt),left=c.net-got;
    if(left>0.5){x.out+=left;const d=diffD(due,td);if(d>0){x.b[d<=30?0:d<=60?1:d<=90?2:3]+=left;x.old=Math.max(x.old,d)}}
    else if(rc.length){const last=rc.map(r=>r.date).sort().pop(),d=diffD(due,last);x.np++;if(d>0){x.late+=d;x.nl++}}}));
  const L=[...M.values()].filter(x=>x.out>0.5||x.np).sort((a,b)=>sum(b.b,v=>v)-sum(a.b,v=>v)||b.out-a.out);
  const rows=L.map(x=>`<tr><td>${esc(x.nm)}</td><td class="r">${fmt(x.out,0)}</td>${x.b.map((v,i)=>`<td class="r">${v?`<span class="${i>1?'qg-neg':''}">${fmt(v,0)}</span>`:'–'}</td>`).join('')}<td class="r">${x.old?`<span class="pill ${x.old>60?'bad':'warn'}">${x.old} วัน</span>`:'–'}</td><td class="r">${x.np?(x.nl?`${fmt(x.late/x.np,0)} วัน <small class="muted">(ช้า ${x.nl}/${x.np} ใบ)</small>`:'<span class="pill ok">ตรงเวลา</span>'):'–'}</td></tr>`).join('');
  const T=L.reduce((a,x)=>{a.out+=x.out;x.b.forEach((v,i)=>a.b[i]+=v);return a},{out:0,b:[0,0,0,0]});
  return `<section class="card"><h2><span>2. ลูกหนี้ต่อลูกค้า</span><small>ใบเบิกที่ออกแล้ว · เกินกำหนดนับจากวันครบกำหนด (เครดิตของลูกค้า) · จ่ายช้าเฉลี่ยจากใบที่รับเงินครบแล้ว</small></h2>
  ${siTb([['ลูกค้า'],['ค้างรับ',1],['เกิน 1–30 วัน',1],['31–60',1],['61–90',1],['เกิน 90',1],['ค้างนานสุด',1],['จ่ายช้าเฉลี่ย',1]],rows,L.length>1?`<tr class="tot"><td>รวม</td><td class="r">${fmt(T.out,0)}</td>${T.b.map(v=>`<td class="r">${v?fmt(v,0):'–'}</td>`).join('')}<td></td><td></td></tr>`:'')}</section>`}
// 3. open quotes to follow up
function siOpen(Q){const td=today(),L=Q.filter(q=>q.status==='draft'||q.status==='sent').map(q=>({q,v:qCalc(q).net,exp:addD(q.date,n(q.valid))})).sort((a,b)=>b.v-a.v);
  const rows=L.map(({q,v,exp})=>{const d=diffD(td,exp);return `<tr><td><button type="button" class="btn ghost sm" data-a="sel" data-k="quote" data-id="${q.id}"><b>${esc(q.no)}</b></button></td><td>${esc(siCust(q.cust))}</td><td>${esc(q.title||'')}</td><td><span class="pill${q.status==='sent'?' info':''}">${q.status==='sent'?'ส่งลูกค้าแล้ว':'ร่าง'}</span></td><td class="r">${fmt(v,0)}</td><td>${thD(exp)}</td><td class="r">${d<0?`<span class="pill bad">หมดอายุ ${-d} วัน</span>`:d<=7?`<span class="pill warn">อีก ${d} วัน</span>`:`อีก ${d} วัน`}</td></tr>`}).join('');
  return `<section class="card"><h2><span>3. ใบเสนอราคาค้าง ตามปิดงาน</span><small>${L.length} ใบ · มูลค่ารวม ${fmt(sum(L,x=>x.v),0)} บาท · ร่าง ${L.filter(x=>x.q.status==='draft').length} · ส่งแล้ว ${L.filter(x=>x.q.status==='sent').length} · เรียงจากมูลค่ามากไปน้อย</small></h2>
  ${siTb([['เลขที่'],['ลูกค้า'],['งาน'],['สถานะ'],['ราคาไม่รวม VAT',1],['ยืนราคาถึง'],['เหลือ',1]],rows)}</section>`}
// 4. by kind of work
function siWork(Q){const M=new Map();Q.forEach(q=>{const k=siWt(q),c=qCalc(q),x=M.get(k)||M.set(k,{k,n:0,won:0,lost:0,val:0,wval:0,gp:0}).get(k);x.n++;x.val+=c.net;
    if(q.status==='won'){x.won++;x.wval+=c.net;x.gp+=qgProfit(q,c).v}else if(q.status==='lost')x.lost++});
  const L=[...M.values()].sort((a,b)=>(b.wval?b.gp/b.wval:-1e9)-(a.wval?a.gp/a.wval:-1e9)),best=L.find(x=>x.wval);
  const rows=L.map(x=>`<tr${x===best?' class="si-best"':''}><td>${esc(siWtL(x.k))}${x===best?' <span class="pill ok">กำไรดีสุด</span>':''}</td><td class="r">${x.n}</td><td class="r">${x.won}${x.won+x.lost?` <small class="muted">(${fmt(x.won*100/(x.won+x.lost),0)}% ของที่ตัดสินแล้ว)</small>`:''}</td><td class="r">${fmt(x.val,0)}</td><td class="r">${fmt(x.wval,0)}</td><td class="r">${x.won?siNeg(x.gp):'–'}</td><td class="r">${x.wval?`<b${x.gp<0?' class="qg-neg"':''}>${fmt(x.gp*100/x.wval,1)}%</b>`:'–'}</td></tr>`).join('');
  return `<section class="card"><h2><span>4. กำไรตามประเภทงาน</span><small>แยกจากคำในชื่องานของใบเสนอราคา · เรียงจาก % กำไรของงานที่ได้</small></h2>
  ${siTb([['ประเภทงาน'],['ใบเสนอราคา',1],['ได้งาน',1],['มูลค่าเสนอ',1],['มูลค่าได้งาน',1],['กำไร',1],['% กำไร',1]],rows)}</section>`}
{const f=salesQuote;salesQuote=function(){const h=f.apply(this,arguments);if(S.qView!=='a')return h;
  const C=CO(),Q=C.quotes.filter(q=>(!S.qPjF||pjKey(qPjOf(q)||'-')===S.qPjF)&&qByOk(q));let ins='';
  try{ins=`<div class="si">${siPrice(Q)}${siAR()}${siOpen(Q)}${siWork(Q)}</div>`}catch(e){ins=`<p class="hint">วิเคราะห์ไม่ได้: ${esc(e.message)}</p>`}
  return h.replace(/<section class="card"><h2><span>ใบเสนอราคา<\/span>/,ins+'$&')}}
document.head.insertAdjacentHTML('beforeend',`<style>.si-t{font-size:13px}.si-t td,.si-t th{padding:7px 7px}.si-t td{white-space:nowrap}.si-t th{white-space:normal;vertical-align:bottom}.si-t td:first-child,.si-t td:nth-child(3){white-space:normal;min-width:120px}.si-sub{display:block}.si-t tr.tot td,.si-t tfoot td{font-weight:700;border-top:2px solid var(--line)}
.si-t tr.si-best td{background:color-mix(in srgb,var(--ok-c,#16a34a) 8%,transparent)}.si h2 small{font-weight:400}</style>`);
Object.assign(SBKW,{'co.sales.quote':(SBKW['co.sales.quote']||'')+' วิเคราะห์ ลูกหนี้ลูกค้า จ่ายช้า ใบเสนอราคาค้าง ตามปิดงาน ประเภทงาน กำไรตามประเภท ต่อราคา บานปลาย'});
