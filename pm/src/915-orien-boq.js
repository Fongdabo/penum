/* ---------- 3.80 ORIEN standard BOQ form, round 1: quotation → Excel file in the ORIEN form (summary page, BOQ with material
   and labour apart, and for the company only a cost / sell / profit sheet), the same file read back line for line by
   นำเข้าจากไฟล์ (PENUM MEP writes it too), and an internal print with cost and profit. The writer is files/lib/orien-boq.js. ---------- */
const OB_ID='ORIEN-BOQ/1',OB_LIB='files/lib/';
async function obLib(){if(!window.orienBoq)await new Promise((ok,no)=>{const s=document.createElement('script');s.src=OB_LIB+'orien-boq.js';s.onload=ok;s.onerror=()=>no(new Error('โหลดตัวเขียนไฟล์ Excel ไม่สำเร็จ ต้องต่ออินเทอร์เน็ตครั้งแรก'));document.head.appendChild(s)});return orienBoq.load(OB_LIB)}
// a quotation as the form's data: prices per unit exactly as the printed BOQ shows them (cost when the markup is its own
// line), and for the internal sheet the real selling price of each line with its markup
function obQuoteDoc(Q){const C=CO(),c=qCalc(Q),cu=C.customers.find(x=>x.id===Q.cust)||{},{lines}=xbCo();let T=0;
  const QS=qSep(Q)?Object.assign({},Q,{mkSep:false}):Q,items=Q.items.map(i=>{const L=qLine(Q,i),IS=qLine(QS,i),q=n(i.q),base=n(i.m)+n(i.l),u=qUnit(Q,i),mc=base?n(i.m):(q?n(i.t)/q:0),lc=base?n(i.l):0;T+=L.t;
    return {g:i.g||'',gname:gName(i.g),head:i.head||'',type:i.type||'',desc:i.desc||'',unit:i.unit||'',q,mc,lc,ms:L.mu,ls:L.lu,ims:IS.mu,ils:IS.lu}});
  const rows=[];if(qSep(Q)&&Math.abs(c.lines-T)>0.005)rows.push({name:`ค่าดำเนินการและกำไร ${qMkTxt(Q)}`,v:c.lines-T,mk:1});
  c.adds.filter(a=>a.v).forEach(a=>rows.push({name:a.name||'',v:a.v,pct:n(a.pct)||''}));
  return {co:{name:C.name||'',lines},meta:{src:'PENUM PM',title:Q.title||'',pname:Q.pname||'',cust:cu.name||'',no:Q.no||'',date:Q.date||'',site:Q.site||'',ref:Q.ref||'',mk:n(Q.mk),mkSep:!!Q.mkSep,vat:7},items,sum:{rows,disc:c.disc}}}
ACT.qXl=async b=>{const Q=CO().quotes.find(q=>q.id===b.dataset.id),I=b.dataset.v==='1';if(!Q)return;if(!Q.items.length){toast('ใบเสนอราคายังไม่มีรายการ');return}
  try{const X=await obLib(),wb=orienBoq.build(X,obQuoteDoc(Q),I),nm=`PENUM-BOQ-${String(Q.no||'quote').replace(/[^\w.-]+/g,'-')}${I?'-internal':''}.xlsx`;
    toast(await download(nm,orienBoq.bytes(X,wb),'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')?(I?'ดาวน์โหลด Excel ฉบับภายในแล้ว มีราคาทุน อย่าส่งให้ลูกค้า':'ดาวน์โหลด Excel แบบ ORIEN แล้ว ส่งให้ลูกค้าได้เลย'):'ดาวน์โหลดไม่สำเร็จ')}
  catch(e){toast(e.message||'ทำไฟล์ Excel ไม่สำเร็จ')}};

/* ---- print: ฉบับภายใน (cost, price and profit of every line) ----
   Printed on a landscape A4. 4.33 it follows the quotation (user: "แยกตามใบเสนอราคาดีกว่าไหม"): sections numbered 1, 2,
   sub-headings 1.1, 1.2 with a subtotal each when a section has more than one block, the selling price split into material and
   labour like the lines table, and when the equipment is split out, a table of cost / price / profit for ค่าเครื่อง, ค่าวัสดุ
   and ค่าแรง. */
PRINT.quoteCost=id=>{const Q=CO().quotes.find(q=>q.id===id);if(!Q)return '';const C=CO(),c=qCalc(Q),cu=C.customers.find(x=>x.id===Q.cust)||{},R='class="r"',NC=12;
  const QS=qSep(Q)?Object.assign({},Q,{mkSep:false}):Q,isEq=i=>typeof qmIsEq==='function'&&qmIsEq(i),hd=i=>String(i.head||'').split(' · ')[0].trim();
  const P={e:{c:0,s:0},m:{c:0,s:0},l:{c:0,s:0}},body=[],z=()=>({c:0,s:0,cm:0,cl:0,sm:0,sl:0});let lg=null,lh=null,gi=0,hi=0,G=null,H=null,hn='';
  const multi=g=>{const I=Q.items.filter(i=>i.g===g),S=new Set(I.map(hd).filter(Boolean));return S.size>1||(S.size===1&&I.some(i=>!hd(i)))};
  const pc=(a,b)=>b?fmt((b-a)*100/b,1)+'%':'';
  // 4.37 a totals row also shows total material and total labour (qty × unit) under the per-unit columns, cost and sell (user: "คิดรวม แยกค่าแรงค่าของด้วย")
  const sumRow=(cl,l,x)=>`<tr class="${cl}"><td></td><td colspan="3">${l}</td><td ${R}>${fmt(x.cm,2)}</td><td ${R}>${fmt(x.cl,2)}</td><td ${R}>${fmt(x.c,2)}</td><td ${R}>${fmt(x.sm,2)}</td><td ${R}>${fmt(x.sl,2)}</td><td ${R}>${fmt(x.s,2)}</td><td ${R}>${fmt(x.s-x.c,2)}</td><td ${R}>${pc(x.c,x.s)}</td></tr>`;
  const endH=()=>{if(H&&lh&&multi(lg))body.push(sumRow('obh','รวม '+esc(hn),H));H=null};
  Q.items.forEach(i=>{const q=n(i.q),base=n(i.m)+n(i.l),mc=base?n(i.m):(q?n(i.t)/q:0),lc=base?n(i.l):0,L=qLine(QS,i),u=qUnit(Q,i),ct=q*(mc+lc),st=q*u,E=isEq(i);
    if(i.g!==lg){endH();if(G)body.push(sumRow('obs','รวม'+esc(gName(lg)),G));lg=i.g;lh=null;gi++;hi=0;G=z();body.push(`<tr class="obg"><td class="n">${gi}</td><td colspan="${NC-1}">${esc(gName(i.g))}</td></tr>`)}
    const h=hd(i);if(h!==lh){endH();lh=h;if(h){hi++;const m=h.match(/^(\d+(?:\.\d+)*)\s+(.*)$/);hn=(m?m[1]:gi+'.'+hi)+' '+(m?m[2]:h);H=z();body.push(`<tr class="obhh"><td class="n">${m?m[1]:gi+'.'+hi}</td><td colspan="${NC-1}">${esc(m?m[2]:h)}</td></tr>`)}}
    let num='';if(!lh){hi++;num=gi+'.'+hi}
    [G,H].forEach(x=>{if(!x)return;x.c+=ct;x.s+=st;x.cm+=q*mc;x.cl+=q*lc;x.sm+=q*L.mu;x.sl+=q*L.lu});
    P[E?'e':'m'].c+=q*mc;P[E?'e':'m'].s+=q*L.mu;P.l.c+=q*lc;P.l.s+=q*L.lu;
    body.push(`<tr><td class="n">${num}</td><td>${lh?'– ':''}${esc([i.type,i.desc].filter(Boolean).join(' '))}${E?' <small class="obe">เครื่อง</small>':''}</td><td>${esc(i.unit||'')}</td><td ${R}>${fmtq(q)}</td><td ${R}>${fmt(mc,2)}</td><td ${R}>${fmt(lc,2)}</td><td ${R}>${fmt(ct,2)}</td><td ${R}>${fmt(L.mu,2)}</td><td ${R}>${fmt(L.lu,2)}</td><td ${R}>${fmt(st,2)}</td><td ${R}>${fmt(st-ct,2)}</td><td ${R}>${pc(ct,st)}</td></tr>`)});
  endH();if(G)body.push(sumRow('obs','รวม'+esc(gName(lg)),G));
  const T={c:P.e.c+P.m.c+P.l.c,s:P.e.s+P.m.s+P.l.s,cm:P.e.c+P.m.c,cl:P.l.c,sm:P.e.s+P.m.s,sl:P.l.s};body.push(sumRow('obt','รวมทุกรายการ',T));
  const parts=Q.eqSep&&!(typeof qmMa==='function'&&qmMa(Q))&&Q.items.some(isEq)?`<div class="obi-pw"><h2>แยกส่วนตามใบเสนอราคา (ค่าเครื่องไม่โดนหัก ณ ที่จ่าย 3%)</h2><table class="obi-p"><thead><tr><th>ส่วน</th><th ${R}>ทุน</th><th ${R}>ราคาขาย</th><th ${R}>กำไร</th><th ${R}>% ของราคาขาย</th></tr></thead><tbody>
    ${[['e','ค่าเครื่อง (ค่าของของรายการที่ติ๊ก “เครื่อง”)'],['m','ค่าวัสดุ'],['l','ค่าแรง']].map(([k,l])=>`<tr><td>${l}</td><td ${R}>${fmt(P[k].c,2)}</td><td ${R}>${fmt(P[k].s,2)}</td><td ${R}>${fmt(P[k].s-P[k].c,2)}</td><td ${R}>${pc(P[k].c,P[k].s)}</td></tr>`).join('')}
    <tr class="tot"><td>รวม</td><td ${R}>${fmt(T.c,2)}</td><td ${R}>${fmt(T.s,2)}</td><td ${R}>${fmt(T.s-T.c,2)}</td><td ${R}>${pc(T.c,T.s)}</td></tr></tbody></table></div>`:'';
  const A=c.adds.filter(a=>a.v),gp=c.net-c.cost,row=(l,v,b)=>`<tr${b?' class="tot"':''}><td>${l}</td><td ${R}>${v}</td></tr>`;
  return `<div class="obi" data-doc-name="${esc((Q.no||'')+' ฉบับภายใน')}"><p class="obi-w">เอกสารภายใน ห้ามส่งลูกค้า</p>
  <h1>ราคาทุนและกำไร ${esc(Q.no||'')}</h1><p class="muted">${esc(C.name||'')} · ${esc([Q.pname,Q.title].filter(Boolean).join(' - '))}${cu.name?' · ลูกค้า '+esc(cu.name):''} · ${thD(Q.date)}${n(Q.mk)||(typeof qMkOn==='function'&&qMkOn(Q))?` · บวกค่าดำเนินการ/กำไร ${qMkTxt(Q)}`:''}</p>
  <table class="obi-t"><thead><tr><th rowspan="2">ลำดับ</th><th rowspan="2">รายการ</th><th rowspan="2">หน่วย</th><th rowspan="2" ${R}>จำนวน</th><th colspan="3" class="c">ต้นทุน</th><th colspan="3" class="c obsell">ราคาขาย</th><th rowspan="2" ${R}>กำไร</th><th rowspan="2" ${R}>% ของ<br>ราคาขาย</th></tr>
    <tr><th ${R}>ของ/หน่วย</th><th ${R}>แรง/หน่วย</th><th ${R}>รวมทุน</th><th ${R} class="obsell">ของ/หน่วย</th><th ${R} class="obsell">แรง/หน่วย</th><th ${R} class="obsell">รวมราคาขาย</th></tr></thead><tbody>${body.join('')}</tbody></table>
  <div class="obi-b">${parts}<table class="obi-s"><tbody>${row('ต้นทุนรวม (วัสดุ + ค่าแรง)',fmt(c.cost,2))}${row('ราคาขายตามรายการ',fmt(c.lines,2))}${A.map(a=>row(esc(a.name||'')+(n(a.pct)?` ${fmt(n(a.pct),2)}%`:''),fmt(a.v,2))).join('')}
    ${c.disc?row('ส่วนลด','-'+fmt(c.disc,2)):''}${row('ราคาเสนอ ไม่รวม VAT',fmt(c.net,2),1)}${row('กำไรขั้นต้น',`${fmt(gp,2)} (${c.net?fmt(gp*100/c.net,1):0}%)`,1)}${row('ภาษีมูลค่าเพิ่ม 7%',fmt(c.vat,2))}${row('รวมทั้งสิ้น',fmt(c.grand,2))}</tbody></table></div>
  <style>@page{size:A4 landscape;margin:10mm}#print .obi{font-size:10.5px}#print .obi table.obi-t thead tr:first-child th:nth-child(2){width:30%}#print .obi table.obi-t td:nth-child(2){word-break:normal;overflow-wrap:anywhere}#print .obi h1{font-size:17px;margin:4px 0}#print .obi h2{font-size:12.5px;margin:10px 0 0}#print .obi-w{border:2px solid #b42318;color:#b42318;font-weight:700;text-align:center;padding:3px;margin:0 0 6px;font-size:12.5px}
  #print .obi table{width:100%;border-collapse:collapse;margin-top:8px}#print .obi th,#print .obi td{border:1px solid #999;padding:2px 5px}#print .obi td.r,#print .obi th.r{text-align:right;white-space:nowrap}#print .obi th.c{text-align:center}#print .obi td.n{text-align:center;white-space:nowrap;width:34px}
  #print .obi tr.obg td{background:#eef2f1;font-weight:700;-webkit-print-color-adjust:exact;print-color-adjust:exact}#print .obi tr.obhh td{font-weight:600;color:#2C4A5A}#print .obi tr.obh td{font-weight:600;font-style:italic;border-top:1px dashed #777}#print .obi tr.obs td{font-weight:700;background:#fafafa}
  #print .obi tr.obt td{font-weight:700;background:#e8eef0;-webkit-print-color-adjust:exact;print-color-adjust:exact}#print .obi .obsell{background:#eef7f8;-webkit-print-color-adjust:exact;print-color-adjust:exact}#print .obi small.obe{border:1px solid #888;border-radius:6px;padding:0 4px;font-size:9px}
  #print .obi-b{display:flex;gap:16px;align-items:flex-start;justify-content:flex-end;break-inside:avoid}#print .obi-pw{width:52%}#print .obi table.obi-p{margin-top:4px}#print .obi table.obi-s{width:42%;margin-left:auto}#print .obi tr.tot td{font-weight:700}</style></div>`};
// buttons beside พิมพ์ใบเสนอราคา
{const f=salesQuote;salesQuote=function(){const h=f.apply(this,arguments);return h.replace(/(<button type="button" class="btn sm" data-a="print" data-k="quote" data-id="([^"]+)">พิมพ์ใบเสนอราคา<\/button>)/,
  (m,b,id)=>`${b}<button type="button" class="btn sm" data-a="print" data-k="quoteCost" data-id="${id}" title="ราคาทุน ราคาขาย และกำไรทุกรายการ สำหรับใช้ในบริษัท">พิมพ์ฉบับภายใน</button><button type="button" class="btn sm" data-a="qXl" data-id="${id}" data-v="0" title="ไฟล์ Excel ตามแบบฟอร์ม BOQ มาตรฐาน ORIEN: หน้าสรุป และ BOQ แยกค่าวัสดุ/ค่าแรง">Excel แบบ ORIEN</button><button type="button" class="btn sm" data-a="qXl" data-id="${id}" data-v="1" title="เพิ่มชีตราคาทุน ราคาขาย และกำไรต่อรายการ อย่าส่งให้ลูกค้า">Excel ฉบับภายใน</button>`)}}

/* ---- reading the form back: the hidden PENUM sheet names it, the hidden last column says what every row is ---- */
function obRead(S){const m=S&&S.PENUM;if(!m||impTxt((m[0]||[])[0])!==OB_ID)return null;let meta={};try{meta=JSON.parse((m[1]||[])[0]||'{}')}catch(e){}
  const I=meta.kind==='internal'&&S['ภายใน-ราคาทุน'],R=I||S.BOQ;if(!R)return null;
  const hr=R.findIndex(r=>r&&impTxt(r[0])==='ลำดับ'&&impTxt(r[1])==='รายการ');if(hr<0)return null;const mc=R[hr].map(impTxt).indexOf('PENUM');if(mc<0)return null;
  const v=(r,c)=>{const x=impNum(r[c]);return isNaN(x)?0:x};let g='',head='',type='',tot=0;const items=[];
  R.slice(hr+1).forEach(r=>{if(!r)return;const k=String(r[mc]??'').trim(),t=k.charAt(0),val=k.slice(2),d=impTxt(r[1]);
    if(t==='S'){g=val||d;head='';type='';return}if(t==='H'){head=val;type='';return}if(t==='Y'){type=val;return}
    if(t==='T'){if(/^รวมทุกหมวด/.test(d))tot=v(r,I?6:8);return}
    if(!d)return;const q=v(r,2),unit=impTxt(r[3]);if(!t&&!q&&!unit)return;// a note typed into the sheet
    const o={on:true,g,head,type,desc:d.replace(/^-\s*/,''),unit,q,m:v(r,4),l:v(r,I?5:6)};if(I)o.sell=v(r,7)+v(r,8);items.push(o)});
  return {meta,internal:!!I,items,tot}}
{const o=impOpen;impOpen=function(S){const r=obRead(S);delete IMP.ob;if(!r||!r.items.length)return o.apply(this,arguments);
  const lab=['ลำดับ','รายการ','จำนวน','หน่วย','ค่าวัสดุ/หน่วย','ค่าแรง/หน่วย'],rows=[lab];rows.ob=r;IMP.ob=r;
  Object.assign(IMP,{sheets:{'BOQ แบบ ORIEN':rows},sheet:'BOQ แบบ ORIEN',hr:0,two:false,lab,map:['no','desc','q','unit','m','l'],meta:{},ex:{tot:r.tot?[r.tot]:[],extra:0,disc:0,labs:[],rows:[],pay:[]}});impShow()}}
{const o=impItems;impItems=function(rows){return rows&&rows.ob?rows.ob.items.map(x=>Object.assign({},x)):o.apply(this,arguments)}}
{const o=impShow;impShow=function(){const x=o.apply(this,arguments);if(!IMP.ob)return x;const B=$('#impBody');if(!B)return x;
  const t=B.querySelector('.imp-map'),w=t&&t.closest('.tw');if(w){const h=w.previousElementSibling;if(h&&h.tagName==='H3')h.remove();const nx=w.nextElementSibling;if(nx&&nx.classList.contains('hint')&&!nx.id)nx.remove();w.remove()}
  const hr=$('#impHr');if(hr&&hr.closest('label'))hr.closest('label').remove();const M=IMP.ob.meta||{};
  B.insertAdjacentHTML('afterbegin',`<p class="hint" style="color:var(--ok-c,#1a7f37);margin-top:12px">✓ ไฟล์ BOQ แบบฟอร์มมาตรฐาน ORIEN${IMP.ob.internal?' ฉบับภายใน (อ่านราคาทุนและราคาขาย)':''} จาก ${esc(M.src||'PENUM')}${M.no?' · '+esc(M.no):''} อ่านครบทุกบรรทัด ไม่ต้องเลือกคอลัมน์${(M.rows||[]).length||M.disc?` · ใส่ ${(M.rows||[]).map(x=>esc(x.name)).concat(M.disc?['ส่วนลด']:[]).join(', ')} ตามไฟล์ให้ด้วย`:''}</p>`);return x}}
{const o=ACT.impGo;ACT.impGo=b=>{if(!IMP.ob)return o(b);const tg=impTarget();if(!tg)return;const add=($('#impMode')||{}).value==='add',M=IMP.ob.meta||{},I=IMP.ob.internal,src='นำเข้าจาก '+(IMP.name||'ไฟล์')+' (BOQ แบบ ORIEN)';
  const L=IMP.rows.filter(r=>r.on&&impTxt(r.desc)).map(r=>({g:impTxt(r.g),head:impTxt(r.head),type:r.type||'',desc:impTxt(r.desc),unit:impTxt(r.unit),q:n(r.q),m:n(r.m),l:n(r.l),t:n(r.q)*(n(r.m)+n(r.l)),sell:n(r.sell)}));
  if(!L.length){toast('ไม่มีรายการที่เลือกไว้');return}
  // the lines under the total: with the internal copy the markup comes back as the quotation's own %, the rest as they were
  const XR=(M.rows||[]).filter(x=>!(I&&x.mk)),disc=n(M.disc);
  if(IMP.t==='q'){const Q=tg.o,old=add?Q.items.slice():[];qFill(Q,[...old,...L],{src});if(add)Q.items.splice(0,old.length,...old);
    if(!add){Q.mk=I?n(M.mk):0;Q.mkSep=I&&!!M.mkSep;Q.adds=XR.map(x=>I&&n(x.pct)?{id:uid(),name:x.name,pct:n(x.pct),amt:''}:{id:uid(),name:x.name,pct:'',amt:n(x.v)});Q.disc=disc;
      ['title','pname','site','ref'].forEach(k=>{if(M[k]&&!Q[k])Q[k]=M[k]})}
    // a line sold at its own price (not cost + the quotation's %) keeps that price
    if(I)Q.items.slice(old.length).forEach((it,k)=>{const s=L[k].sell,base=n(it.m)+n(it.l);if(s>0&&Math.abs(s-base*(1+n(Q.mk)/100))>0.005)it.sp=Math.round(s*100)/100})}
  else if(IMP.t==='td'){const T=tg.o,old=add?(T.items||[]):[];tdFill(T,L,src);if(add)T.items=[...old,...T.items]}
  else{const items=[...(add?P.boq.items:[]),...L.map(({t,sell,...x})=>x)],sub=sum(items,boqCost),sell=I?sum(L,i=>i.q*i.sell)-sum(L,i=>i.t):0,
      ohp=add?n(P.boq.ohp):Math.round((sell+sum(XR,x=>n(x.v))-disc)*100)/100;setBoq(items,{src,sub,ohp,vat:(sub+ohp)*0.07,grand:(sub+ohp)*1.07})}
  delete IMP.ob;dlgWide(false);$('#dlg').close();save();render();toast(`นำเข้า ${L.length} รายการแล้ว`)}}
