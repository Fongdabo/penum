/* ---------- 3.75 ORIEN standard BOQ form, round 1: quotation → Excel file in the ORIEN form (summary page, BOQ with material
   and labour apart, and for the company only a cost / sell / profit sheet), the same file read back line for line by
   นำเข้าจากไฟล์ (PENUM MEP writes it too), and an internal print with cost and profit. The writer is files/lib/orien-boq.js. ---------- */
const OB_ID='ORIEN-BOQ/1',OB_LIB='files/lib/';
async function obLib(){if(!window.orienBoq)await new Promise((ok,no)=>{const s=document.createElement('script');s.src=OB_LIB+'orien-boq.js';s.onload=ok;s.onerror=()=>no(new Error('โหลดตัวเขียนไฟล์ Excel ไม่สำเร็จ ต้องต่ออินเทอร์เน็ตครั้งแรก'));document.head.appendChild(s)});return orienBoq.load(OB_LIB)}
// a quotation as the form's data: prices per unit exactly as the printed BOQ shows them (cost when the markup is its own
// line), and for the internal sheet the real selling price of each line with its markup
function obQuoteDoc(Q){const C=CO(),c=qCalc(Q),cu=C.customers.find(x=>x.id===Q.cust)||{},{lines}=xbCo();let T=0;
  const items=Q.items.map(i=>{const L=qLine(Q,i),q=n(i.q),base=n(i.m)+n(i.l),u=qUnit(Q,i),mc=base?n(i.m):(q?n(i.t)/q:0),lc=base?n(i.l):0;T+=L.t;
    return {g:i.g||'',gname:gName(i.g),head:i.head||'',type:i.type||'',desc:i.desc||'',unit:i.unit||'',q,mc,lc,ms:L.mu,ls:L.lu,ims:base?n(i.m)*u/base:u,ils:base?n(i.l)*u/base:0}});
  const rows=[];if(qSep(Q)&&Math.abs(c.lines-T)>0.005)rows.push({name:`ค่าดำเนินการและกำไร ${fmt(n(Q.mk),2)}%`,v:c.lines-T,mk:1});
  c.adds.filter(a=>a.v||a.name).forEach(a=>rows.push({name:a.name||'',v:a.v,pct:n(a.pct)||''}));
  return {co:{name:C.name||'',lines},meta:{src:'PENUM PM',title:Q.title||'',pname:Q.pname||'',cust:cu.name||'',no:Q.no||'',date:Q.date||'',site:Q.site||'',ref:Q.ref||'',mk:n(Q.mk),mkSep:!!Q.mkSep,vat:7},items,sum:{rows,disc:c.disc}}}
ACT.qXl=async b=>{const Q=CO().quotes.find(q=>q.id===b.dataset.id),I=b.dataset.v==='1';if(!Q)return;if(!Q.items.length){toast('ใบเสนอราคายังไม่มีรายการ');return}
  try{const X=await obLib(),wb=orienBoq.build(X,obQuoteDoc(Q),I),nm=`PENUM-BOQ-${String(Q.no||'quote').replace(/[^\w.-]+/g,'-')}${I?'-internal':''}.xlsx`;
    toast(await download(nm,orienBoq.bytes(X,wb),'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')?(I?'ดาวน์โหลด Excel ฉบับภายในแล้ว มีราคาทุน อย่าส่งให้ลูกค้า':'ดาวน์โหลด Excel แบบ ORIEN แล้ว ส่งให้ลูกค้าได้เลย'):'ดาวน์โหลดไม่สำเร็จ')}
  catch(e){toast(e.message||'ทำไฟล์ Excel ไม่สำเร็จ')}};

/* ---- print: ฉบับภายใน (cost, price and profit of every line) ---- */
PRINT.quoteCost=id=>{const Q=CO().quotes.find(q=>q.id===id);if(!Q)return '';const C=CO(),c=qCalc(Q),cu=C.customers.find(x=>x.id===Q.cust)||{},R='class="r"';
  const G={},order=[];let lg=null;const body=[];
  Q.items.forEach(i=>{const q=n(i.q),base=n(i.m)+n(i.l),cu_=base||(q?n(i.t)/q:0),u=qUnit(Q,i),ct=q*cu_,st=q*u,g=G[i.g]=G[i.g]||{c:0,s:0};g.c+=ct;g.s+=st;
    if(i.g!==lg){if(lg!==null)body.push(obIntSum(G[lg],lg));lg=i.g;order.push(i.g);body.push(`<tr class="obg"><td colspan="10">${esc(gName(i.g))}</td></tr>`)}
    body.push(`<tr><td>${esc(itemName(i))}</td><td>${esc(i.unit||'')}</td><td ${R}>${fmtq(q)}</td><td ${R}>${fmt(n(i.m),2)}</td><td ${R}>${fmt(n(i.l),2)}</td><td ${R}>${fmt(ct,2)}</td><td ${R}>${fmt(u,2)}</td><td ${R}>${fmt(st,2)}</td><td ${R}>${fmt(st-ct,2)}</td><td ${R}>${st?fmt((st-ct)*100/st,1)+'%':''}</td></tr>`)});
  if(lg!==null)body.push(obIntSum(G[lg],lg));
  const A=c.adds.filter(a=>a.v||a.name),gp=c.net-c.cost,row=(l,v,b)=>`<tr${b?' class="tot"':''}><td>${l}</td><td ${R}>${v}</td></tr>`;
  return `<div class="obi" data-doc-name="${esc((Q.no||'')+' ฉบับภายใน')}"><p class="obi-w">เอกสารภายใน ห้ามส่งลูกค้า</p>
  <h1>ราคาทุนและกำไร ${esc(Q.no||'')}</h1><p class="muted">${esc(C.name||'')} · ${esc([Q.pname,Q.title].filter(Boolean).join(' - '))}${cu.name?' · ลูกค้า '+esc(cu.name):''} · ${thD(Q.date)}${n(Q.mk)?` · บวกค่าดำเนินการ/กำไร ${fmt(n(Q.mk),2)}%`:''}</p>
  <table><thead><tr><th>รายการ</th><th>หน่วย</th><th ${R}>จำนวน</th><th ${R}>ทุนวัสดุ/หน่วย</th><th ${R}>ทุนค่าแรง/หน่วย</th><th ${R}>รวมทุน</th><th ${R}>ราคาขาย/หน่วย</th><th ${R}>รวมราคาขาย</th><th ${R}>กำไร</th><th ${R}>% ของราคาขาย</th></tr></thead><tbody>${body.join('')}</tbody></table>
  <table class="obi-s"><tbody>${row('ต้นทุนรวม (วัสดุ + ค่าแรง)',fmt(c.cost,2))}${row('ราคาขายตามรายการ',fmt(c.lines,2))}${A.map(a=>row(esc(a.name||'')+(n(a.pct)?` ${fmt(n(a.pct),2)}%`:''),fmt(a.v,2))).join('')}
    ${c.disc?row('ส่วนลด','-'+fmt(c.disc,2)):''}${row('ราคาเสนอ ไม่รวม VAT',fmt(c.net,2),1)}${row('กำไรขั้นต้น',`${fmt(gp,2)} (${c.net?fmt(gp*100/c.net,1):0}%)`,1)}${row('ภาษีมูลค่าเพิ่ม 7%',fmt(c.vat,2))}${row('รวมทั้งสิ้น',fmt(c.grand,2))}</tbody></table>
  <style>#print .obi{font-size:11px}#print .obi h1{font-size:17px;margin:4px 0}#print .obi-w{border:2px solid #b42318;color:#b42318;font-weight:700;text-align:center;padding:3px;margin:0 0 6px;font-size:12.5px}
  #print .obi table{width:100%;border-collapse:collapse;margin-top:8px}#print .obi th,#print .obi td{border:1px solid #999;padding:2px 5px}#print .obi td.r,#print .obi th.r{text-align:right;white-space:nowrap}
  #print .obi tr.obg td{background:#eef2f1;font-weight:700;-webkit-print-color-adjust:exact;print-color-adjust:exact}#print .obi tr.obs td{font-weight:700;background:#fafafa}
  #print .obi table.obi-s{width:55%;margin-left:auto}#print .obi tr.tot td{font-weight:700}</style></div>`};
const obIntSum=(g,k)=>`<tr class="obs"><td colspan="5">รวม${esc(gName(k))}</td><td class="r">${fmt(g.c,2)}</td><td></td><td class="r">${fmt(g.s,2)}</td><td class="r">${fmt(g.s-g.c,2)}</td><td class="r">${g.s?fmt((g.s-g.c)*100/g.s,1)+'%':''}</td></tr>`;

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
