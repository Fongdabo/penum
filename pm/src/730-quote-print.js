/* ---------- 3.25 quotation + BOQ print laid out like the contractor's own Excel BOQ the user supplied (R3 BOQ VRF SCCC):
   logo + company lines, rounded QUOTATION box, label/value header, ITEM/DESCRIPTION/QTY/UNIT/MATERIAL/LABOR/GRAND TOTAL grid,
   light-green header and total rows, validity / payment / note block, confirmation box and two "Very truly yours" signatures ---------- */
const XB_CSS=`<style>
#print .xb,#print .xb table,#print .xb th,#print .xb td{font-family:Arial,"Liberation Sans","IBM Plex Sans Thai",Anuphan,sans-serif}
#print .xb{font-size:10.5px;color:#000}
#print .xb table{border-collapse:collapse;width:100%;table-layout:fixed;font-size:9.5px}
#print .xb th,#print .xb td{border:1px solid #000;padding:0 4px;line-height:1.25;background:none;font-size:9px}
#print .xb thead th{background:#DAF2D0;font-weight:400;text-align:center;vertical-align:middle;color:#000;-webkit-print-color-adjust:exact;print-color-adjust:exact}
#print .xb td.r{text-align:right;white-space:nowrap}
#print .xb td.c{text-align:center}
#print .xb tr.xgb td{background:#DAF2D0;-webkit-print-color-adjust:exact;print-color-adjust:exact}
#print .xb tr.xgb td.l{text-align:center}
#print .xb tr.rd td{color:#d00}
#print .xb tr.e td{height:11px}
#print .xb .sumt td{border-top:0;border-bottom:0}
#print .xb .sumt tr:first-child td,#print .xb .sumt tr.xgb td{border-top:1px solid #000;border-bottom:1px solid #000}
#print .xb .dash{color:#d00}
#print .xb-h{display:flex;align-items:center;justify-content:space-between;gap:20px;margin:0 0 4px}
#print .xb-h img{height:64px;width:auto;max-width:330px;margin:0;border:0;object-fit:contain}
#print .xb-a{font-size:10px;line-height:1.75}
#print .xb-t{margin:2px auto 4px;width:200px;border:1px solid #000;border-radius:8px;text-align:center;padding:3px 0;line-height:1.35}
#print .xb-t b{display:block;font-size:15px;font-weight:400}
#print .xb-t i{display:block;font-style:normal;font-size:15px;font-weight:700}
#print .xb-i{display:grid;grid-template-columns:1fr 280px;gap:0 20px;font-size:10px;margin:0 0 8px}
#print .xb-i div div{display:flex;gap:4px;line-height:1.75}
#print .xb-i span{flex:none;width:66px}
#print .xb-i .rt span{width:84px;text-align:right;padding-right:10px}
#print .xb-p{margin:8px 0 10px 60px;line-height:1.9;font-size:10.5px}
#print .xb-n{display:grid;grid-template-columns:152px 1fr;font-size:10px;line-height:1.55;margin-top:2px;page-break-inside:avoid}
#print .xb-n b{font-weight:700}
#print .xb-s{display:grid;grid-template-columns:1.45fr 1fr 1fr;gap:20px;margin-top:20px;align-items:start;page-break-inside:avoid;text-align:center;font-size:10px}
#print .xb-s .ok{border:1px solid #000;border-radius:16px;padding:10px 10px 8px;font-weight:700;line-height:1.45}
#print .xb-s .ok .ln{margin:44px 30px 2px}
#print .xb-s .ln{border-top:1px dotted #000;margin:52px 26px 4px}
#print .xb-bt{background:#DAF2D0;border:1px solid #000;border-bottom:0;text-align:center;font-size:13px;padding:3px;-webkit-print-color-adjust:exact;print-color-adjust:exact}
#print .xb thead tr.hd th{background:none;border:0;padding:0 0 6px;text-align:left;font-weight:400}
</style>`;
const xz=(v,blank,red)=>blank?'':(Math.abs(v)<0.005?(red?'<span class="dash">-</span>':'-'):fmt(v,2));
function xbCo(){const C=CO();return {C,lines:[C.addr,C.addrEn,[C.email?'E-Mail : '+C.email:'',C.phone?'Tel : '+C.phone:''].filter(Boolean).join('  ')].filter(Boolean)}}
function xbCols(sp,G4){const w=sp?[7,0,6,6,9,9,9,9,11]:[7,0,6,6,12,13];if(G4)w.push(8);w[1]=100-w.reduce((a,b)=>a+b,0);return `<colgroup>${w.map(x=>`<col style="width:${x}%">`).join('')}</colgroup>`}
function xbThead(sp,G4){return sp?`<tr><th rowspan="2">ITEM</th><th rowspan="2">DESCRIPTION</th><th rowspan="2">Q'TY</th><th rowspan="2">UNIT</th><th colspan="2">MATERIAL</th><th colspan="2">LABOR</th><th rowspan="2">GRAND TOTAL</th>${G4?'<th rowspan="2">REMARK</th>':''}</tr><tr><th></th><th>TOTAL</th><th></th><th>TOTAL</th></tr>`
  :`<tr><th>ITEM</th><th>DESCRIPTION</th><th>Q'TY</th><th>UNIT</th><th>UNIT PRICE</th><th>GRAND TOTAL</th>${G4?'<th>REMARK</th>':''}</tr>`}

// page 1 as a letter: เรียน … the amount per system, VAT, terms, remarks, ขอแสดงความนับถือ and who signs
function xbLetter(Q,c,G,order,mk,A,pay,notes,cu){const {C}=xbCo(),d=okD(Q.date)?pd(Q.date):null,TH=['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน','กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'];
  const row=(lab,v,b,ind)=>`<tr${b?' class="b"':''}><td style="padding-left:${ind?60:0}px">${lab}</td><td class="u">เป็นเงิน</td><td class="r">${fmt(v,2)}</td><td>บาท</td></tr>`,tot=(lab,v,b)=>`<tr${b?' class="b"':''}><td></td><td class="u">${lab}</td><td class="r">${fmt(v,2)}</td><td>บาท</td></tr>`;
  const kv=(k,v)=>v?`<div><span>${k}</span><b>${v}</b></div>`:'',st=(C.staff||[]).find(s=>s.name&&s.name===(Q.signName||Q.by))||{};
  return `<div class="xl">${C.logo?`<img class="lg" src="${C.logo}" alt="">`:`<b style="font-size:18px">${esc(C.name||'')}</b>`}<h1>ใบเสนอราคา</h1>
  <div class="kv">${kv('เลขที่ :',esc(Q.no||''))}${kv('Ref :',esc(Q.ref||''))}${kv('วันที่ :',d?`${d.getDate()} ${TH[d.getMonth()]} ${d.getFullYear()+543}`:'')}</div>
  <div class="kv">${kv('เรื่อง :','เสนอราคา'+esc(Q.title||''))}${kv('โครงการ :',esc(Q.pname||''))}${kv('เรียน :',esc(Q.attn||[cu.contact,cu.name].filter(Boolean).join(' ')))}</div>
  <p class="in">บริษัทฯ ขอเสนอราคา${esc(Q.title||'')}${Q.pname?` สำหรับโครงการ ${esc(Q.pname)}`:''} มีรายละเอียดดังต่อไปนี้</p>
  <table class="am">${order.map(g=>row('ค่า'+gName(g).replace(/^(ค่า|หมวด)/,''),G[g].t)).join('')}${mk?row(`ค่าดำเนินการและกำไร ${fmt(n(Q.mk),2)}%`,mk,0,1):''}${A.map(a=>row(esc(a.name||''),a.v,0,1)).join('')}
    ${tot('รวมเป็นเงิน',c.sub)}${c.disc?tot('ส่วนลด',-c.disc)+tot('รวมหลังหักส่วนลด',c.net):''}${tot('ภาษีมูลค่าเพิ่ม 7 %',c.vat)}${tot('รวมเป็นเงินทั้งสิ้น',c.grand,1)}</table>
  <p class="bt">(${esc(bahtText(c.grand))})</p>
  <div class="tm"><u>กำหนดยืนราคา</u><div>ภายใน ${n(Q.valid)} วันหลังเสนอราคา</div>${Q.dlv?`<u>กำหนดแล้วเสร็จ</u><div>${esc(Q.dlv)}</div>`:''}${pay.length?`<u>การชำระเงิน</u><div>${pay.map(x=>`${fmt(x.pct,0)}% ${esc(x.desc||'')}`).join('<br>')}</div>`:''}</div>
  <p class="in">จึงเรียนมาเพื่อโปรดพิจารณา บริษัทฯ หวังเป็นอย่างยิ่งว่าจะได้มีโอกาสรับการสั่งซื้อจากท่านในเร็ววันนี้</p>
  ${notes.length?`<div class="nt"><u>หมายเหตุ</u><div>${notes.map(esc).join('<br>')}</div></div>`:''}
  <div class="sg">ขอแสดงความนับถือ<div class="ln"></div>(${esc(Q.signName||Q.by||'')})<br>${esc(Q.signPos||st.role||'')}</div></div>
  <style>#print .xl{font-size:12.5px;line-height:1.7}#print .xl .lg{max-height:70px}#print .xl h1{text-align:center;font-size:20px;margin:14px 0 10px}
  #print .xl .kv{display:block;margin:8px 0 8px 40px}#print .xl .kv div{display:flex;gap:8px}#print .xl .kv span{width:70px;text-align:right}
  #print .xl .in{text-indent:40px;margin:10px 0}#print .xl table.am{width:86%;margin:6px 0 6px 6%;border:0}#print .xl table.am td{border:0;padding:3px 6px}
  #print .xl table.am td.u{text-align:right;width:28%}#print .xl table.am td.r{text-align:right;width:20%}#print .xl table.am tr.b td{font-weight:700}
  #print .xl .bt{text-align:right;margin:0 6% 8px 0;font-size:11.5px}
  #print .xl .tm,#print .xl .nt{display:grid;grid-template-columns:140px 1fr;margin:8px 0 8px 60px;row-gap:2px}#print .xl .nt{margin-left:0;font-size:11px}
  #print .xl .sg{margin:16px 0 0 auto;width:260px;text-align:center}#print .xl .sg .ln{height:50px}</style>`}
PRINT.quote=(id,bq)=>{const Q=CO().quotes.find(q=>q.id===id);if(!Q)return '';const {C,lines}=xbCo(),c=qCalc(Q),f=qForm(Q),sp=qSplit(Q),sep=qSep(Q),G4=f==='G',E0=f==='E',nc=(sp?9:6)+(G4?1:0);
  const cu=C.customers.find(x=>x.id===Q.cust)||{},st=(C.staff||[]).find(s=>s.name&&Q.by&&s.name===Q.by)||{};
  const G={},order=[];Q.items.forEach(i=>{const L=qLine(Q,i);if(!G[i.g]){G[i.g]={m:0,l:0,t:0};order.push(i.g)}const g=G[i.g];g.m+=L.mt;g.l+=L.lt;g.t+=L.t});
  const T=order.reduce((a,k)=>({m:a.m+G[k].m,l:a.l+G[k].l,t:a.t+G[k].t}),{m:0,l:0,t:0}),rm=G4?'<td></td>':'';
  const M=(v,red)=>`<td class="r">${xz(v,E0,red)}</td>`,empty=`<tr class="e">${'<td></td>'.repeat(nc)}</tr>`;
  const band=(lab,v,cls='',m,l)=>`<tr class="xgb ${cls}"><td></td><td class="l">${lab}</td><td></td><td></td>${sp?`<td></td>${m==null?'<td></td>':M(m)}<td></td>${l==null?'<td></td>':M(l)}`:'<td></td>'}<td class="r">${E0?'':v}</td>${rm}</tr>`;
  const no=E0?'ใบแจ้งปริมาณงาน':'ใบเสนอราคา',ttl=E0?'REQUEST FOR QUOTATION':'QUOTATION';
  // ---- page 1: header, summary by section, totals, terms, signatures
  const head=`<div class="xb-h"><div>${C.logo?`<img src="${C.logo}" alt="">`:`<b style="font-size:18px">${esc(C.name||'')}</b>`}</div><div class="xb-a">${esc(C.name||'')}<br>${lines.map(esc).join('<br>')}</div></div>
  <div class="xb-t"><b>${no}</b><i>${ttl}</i></div>
  <div class="xb-i"><div>${[['เรื่อง :',(E0?'ขอราคา':'เสนอราคา')+esc(Q.title||'')],['โครงการ :',esc(Q.pname||'')],['ที่อยู่ :',esc(Q.site||'')],['เรียน :',E0?'ผู้เสนอราคา ..........................................':esc(Q.attn||[cu.contact,cu.name?`(${cu.name})`:''].filter(Boolean).join(' '))],['โทรศัพท์ :',E0?'':esc(cu.phone||'')],['อีเมลล์ :',E0?'':esc(cu.email||'-')]].map(([k,v])=>`<div><span>${k}</span><div>${v}</div></div>`).join('')}</div>
  <div class="rt">${[['เลขที่เอกสาร :',esc(Q.no||'')],...(Q.ref?[['Ref :',esc(Q.ref)]]:[]),['วันที่ :',okD(Q.date)?(d=>`${d.getDate()}/${d.getMonth()+1}/${String((d.getFullYear()+543)%100).padStart(2,'0')}`)(pd(Q.date)):''],['',''],['พนักงานขาย :',esc(Q.by||'')],['โทรศัพท์ :',esc(st.phone||C.phone||'')],['อีเมลล์ :',esc(st.email||C.email||'')]].map(([k,v])=>`<div><span>${k}</span><div>${v||'&nbsp;'}</div></div>`).join('')}</div></div>
  <p class="xb-p">${E0?`${esc(C.name||'บริษัทฯ')} ขอให้เสนอราคา${esc(Q.title||'')}`:`บริษัทฯมีความยินดีขอเรียนเสนอราคา${esc(Q.title||'')}`}<br>${Q.pname?`สำหรับโครงการ&nbsp;&nbsp;&nbsp; ${esc(Q.pname)}&nbsp;&nbsp;&nbsp; `:''}มีรายละเอียดดังต่อไปนี้.</p>`;
  const sumRows=order.map((g,k)=>`<tr><td class="c">${k+1}</td><td>${gName(g)}</td><td class="c">1</td><td class="c">Lot</td>${sp?M(G[g].m)+M(G[g].m)+M(G[g].l)+M(G[g].l):M(G[g].t)}${M(G[g].t)}${rm}</tr>`).join('');
  const pad=Math.max(0,6-order.length),padRows=Array.from({length:pad},()=>`<tr class="e">${'<td></td>'.repeat(nc)}</tr>`).join('');
  const mkRow=sep&&Math.abs(c.lines-T.t)>0.005,A=c.adds.filter(a=>a.v);
  const bands=[band('TOTAL',fmt(T.t,2),'',sp?T.m:null,sp?T.l:null),...(mkRow?[band(`OVER HEAD &amp; PROFIT ${fmt(n(Q.mk),2)}%`,fmt(c.lines-T.t,2))]:[]),
    ...A.map(a=>band(esc(a.name||''),fmt(a.v,2))),...(mkRow||A.length?[band('TOTAL',fmt(c.sub,2))]:[]),
    ...(c.disc?[band('DISCOUNT',fmt(c.disc,2),'rd'),band('SUM TOTAL',fmt(c.net,2))]:[]),band('VAT&nbsp; 7%',fmt(c.vat,2)),band('GRAND TOTAL',fmt(c.grand,2))].join('');
  const summary=`<table class="sumt">${xbCols(sp,G4)}<thead>${xbThead(sp,G4)}</thead><tbody>${empty}${sumRows}${padRows}${E0?'':bands}</tbody></table>`;
  const pay=qEnsure(Q).qpay||[],notes=String(Q.terms||'').split(/\n| · /).map(x=>x.trim()).filter(Boolean);
  const terms=`<div class="xb-n">${E0?'':`<b>กำหนดยืนราคา /Validity</b><div>${n(Q.valid)} วันหลังเสนอราคา</div>`}${Q.dlv&&!E0?`<b>กำหนดแล้วเสร็จ /Delivery</b><div>${esc(Q.dlv)}</div>`:''}
    ${pay.length&&!E0?`<b>การชำระเงิน /Payment term</b><div>${pay.map(x=>`${fmt(x.pct,0)}% ${esc(x.desc||'')}`).join('<br>')}</div>`:''}
    ${notes.length?`<b style="margin-top:12px">หมายเหตุ /Note</b><div style="margin-top:12px">${notes.map(esc).join('<br>')}</div>`:''}</div>`;
  const signs=E0?`<div class="xb-s"><div class="ok">ผู้เสนอราคา / Bidder<div class="ln"></div>ลงชื่อพร้อมประทับตรา / Signature and Company's Seal</div><div>Very truly yours,<div class="ln"></div>${esc(Q.by||'')}<br>ผู้ออกเอกสาร /Issued by</div><div>Very truly yours,<div class="ln"></div><br>ผู้อนุมัติ /Approved BY</div></div>`
    :`<div class="xb-s"><div class="ok">We Confirmed On Terms and Conditions as Above QUOTATION<br>(ขอยืนยันการสั่งซื้อตามสินค้าและเงื่อนไขตามใบเสนอราคานี้)<div class="ln"></div>Authorized Signature and Company's Seal<br>(ลายเซ็นต์ผู้มีอำนาจสั่งซื้อพร้อมประทับตราบริษัท)</div>
    <div>Very truly yours,<div class="ln"></div>${esc(Q.by||'')}<br>ผู้ขาย /Seller</div><div>Very truly yours,<div class="ln"></div><br>ผู้อนุมัติ /Approved BY</div></div>`;
  // ---- BILL OF QUANTITIES: logo + address and the column heads repeat on every page (inside thead)
  const body=[];let lg=null,lh=null,ls=null,gi=0,hi=0,li=0;
  const sumG=(g,k)=>`<tr class="xgb"><td></td><td class="l">Sum ${k}</td><td></td><td></td>${sp?`<td></td>${M(G[g].m)}<td></td>${M(G[g].l)}`:'<td></td>'}${M(G[g].t)}${rm}</tr>`;
  Q.items.forEach(i=>{if(i.g!==lg){if(lg!==null)body.push(empty,sumG(lg,gi),empty);else body.push(empty);gi++;hi=0;li=0;lh=ls=null;lg=i.g;body.push(`<tr><td class="c">${gi}</td><td>${gName(i.g)}</td>${'<td></td>'.repeat(nc-2)}</tr>`)}
    const hd=String(i.head||''),k=hd.indexOf(' · '),h1=k>=0?hd.slice(0,k):hd,h2=k>=0?hd.slice(k+3):'';
    if(h1!==lh){if(lh&&h1)body.push(empty);lh=h1;ls=null;if(h1){hi++;const m=h1.match(/^(\d+(?:\.\d+)*)\s+(.*)$/);body.push(`<tr><td class="c">${m?m[1]:gi+'.'+hi}</td><td>${esc(m?m[2]:h1)}</td>${'<td></td>'.repeat(nc-2)}</tr>`)}}
    if(h2!==ls){ls=h2;const m=h2.match(/^(\d+(?:\.\d+)+)\s+(.*)$/);if(h2)body.push(`<tr><td class="c">${m?m[1]:''}</td><td>${esc(m?m[2]:h2)}</td>${'<td></td>'.repeat(nc-2)}</tr>`)}
    li++;const L=qLine(Q,i);let d=esc([i.type,i.desc].filter(Boolean).join(' ')),num='';const own=d.match(/^(\d+(?:\.\d+)+)\s+(.*)$/);
    if(G4)num=gi+'.'+li;else if(own){num=own[1];d=own[2]}else if(!lh){hi++;num=gi+'.'+hi;if(li>1)body.push(empty)}
    body.push(`<tr><td class="c">${num}</td><td>${lh&&!own&&!/^[-–]/.test(d)?'- ':''}${d}</td><td class="c">${fmtq(i.q)}</td><td class="c">${esc(i.unit||'')}</td>${sp?M(L.mu,1)+M(L.mt)+M(L.lu,1)+M(L.lt):M(L.u)}${M(L.t)}${rm}</tr>`)});
  if(lg!==null)body.push(empty,sumG(lg,gi),empty);
  body.push(`<tr class="xgb"><td></td><td class="l">มูลค่ารวม<br>Total</td><td></td><td></td>${sp?`<td></td>${M(T.m)}<td></td>${M(T.l)}`:'<td></td>'}${M(T.t)}${rm}</tr>`);
  const bhead=`<tr class="hd"><th colspan="${nc}"><div class="xb-h">${C.logo?`<img src="${C.logo}" alt="">`:`<b style="font-size:16px">${esc(C.name||'')}</b>`}<div></div></div><div class="xb-a" style="font-size:9.5px;line-height:1.6">${lines.map(esc).join('<br>')}</div></th></tr>
    <tr><th colspan="${nc}" style="font-size:13px;padding:3px">${G4?'แบบแสดงรายการ ปริมาณงาน และราคา (ปร.4) &nbsp;BILL OF QUANTITIES':E0?'BILL OF QUANTITIES (กรุณากรอกราคา)':'BILL OF QUANTITIES'}</th></tr>`;
  const detail=`<table>${xbCols(sp,G4)}<thead>${bhead}${xbThead(sp,G4)}</thead><tbody>${body.join('')}</tbody></table>`;
  const dn=` data-doc-name="${esc([Q.no,E0?'ใบแจ้งปริมาณงาน':bq?'BOQ':'',[Q.pname,Q.title].filter(Boolean).join(' - ')].filter(Boolean).join(' '))}"`;
  const land=G4?'<style>@page{size:A4 landscape}</style>':'';
  const p1=Q.cover==='letter'&&!E0?xbLetter(Q,c,G,order,mkRow?c.lines-T.t:0,A,pay,notes,cu):`<div class="xb">${head}${summary}${terms}${signs}</div>`,p2=`<div class="xb">${detail}</div>`;
  if(f==='S')return XB_CSS+land+`<div${dn}>`+p1+`</div>`+sowPrint(Q);
  return XB_CSS+land+`<div${dn}>`+p1+`<div style="page-break-before:always"></div>`+p2+`</div>`+sowPrint(Q)};

