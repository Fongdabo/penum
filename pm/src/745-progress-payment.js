/* ---------- 3.27 แผนเบิกงวดงาน / PROGRESS PAYMENT: one sheet with every instalment side by side (user's sample layout) ---------- */
// columns = planned instalments (% mode) or the progress bills made so far (quantity mode)
function ppCols(){const prog=billsSorted().filter(x=>(x.kind||'prog')==='prog');
  if(P.info.billMode==='pct'&&(P.inst||[]).length)return P.inst.map(it=>({it,b:prog.find(b=>b.inst===it.id)||null,no:it.no||''}));
  return prog.map((b,k)=>({it:null,b,no:String(k+1)}))}
// rows = BOQ sections valued at contract prices, plus approved variations
function ppRows(){const uv=unitVal(),G={},order=[];P.boq.items.forEach(i=>{if(!G[i.g]){G[i.g]={g:i.g,name:gName(i.g),items:[]};order.push(i.g)}G[i.g].items.push(i)});
  const R=order.map(g=>({name:G[g].name,items:G[g].items,bud:sum(G[g].items,i=>n(i.q)*uv(i))}));
  const vo=sum(P.vos.filter(v=>v.status==='ok'),v=>(v.type==='omit'?-1:1)*n(v.amt));if(vo)R.push({name:'งานเพิ่ม-ลด (VO)',vo:1,bud:vo});
  if(!R.length)R.push({name:P.name||'งานตามสัญญา',bud:contract().total,all:1});return R}
function ppAmt(row,col,cols){const b=col.b;if(!b)return null;const C=contract(),uv=unitVal();
  if(P.info.billMode==='pct'&&col.it)return row.bud*n(col.it.pct)/100;
  const prog=billsSorted().filter(x=>(x.kind||'prog')==='prog'),i=prog.indexOf(b),prev=i>0?prog[i-1]:null;
  if(row.all)return billCalc(b).amt;
  if(row.vo){const f=x=>x?sum(P.vos.filter(v=>v.status==='ok'),v=>(v.type==='omit'?-1:1)*n(v.amt)*Math.min(100,n((x.vo||{})[v.id]))/100):0;return f(b)-f(prev)}
  const cv=x=>x?sum(row.items,it=>Math.min(n(it.q),n((x.qty||{})[it.id]))*uv(it)):0;return cv(b)-cv(prev)}
const ppD=s=>okD(s)?(d=>`${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()+543}`)(pd(s)):'';
function ppTable(cur){const I=P.info,cols=ppCols(),rows=ppRows(),R='class="r"',pc=(v,x='')=>`<td class="p${x}">${v==null?'':fmt(v,0)+'%'}</td>`,m=(v,x='')=>`<td class="r${x}">${v==null||Math.abs(v)<0.005?'-':fmt(v,2)}</td>`;
  const A=rows.map(r=>cols.map(c=>ppAmt(r,c,cols))),tot=sum(rows,r=>r.bud);
  const calc=cols.map(c=>c.b?billCalc(c.b):null);
  const head=`<tr><th rowspan="2" style="width:4%">ลำดับ</th><th rowspan="2" style="width:22%">รายการ</th><th class="gap" rowspan="2"></th><th rowspan="2" style="width:9%">งบในสัญญา</th><th rowspan="2" class="p">เปอร์เซ็นต์<br>งาน</th>
    ${cols.map(c=>`<th${c.b&&cur&&c.b.id===cur.id?' class="cur"':''}>งวดที่ ${esc(c.no)}</th><th rowspan="2" class="p">เปอร์เซ็นต์<br>ที่ขอเบิก</th>`).join('')}<th rowspan="2" style="width:9%">ยอดคงเหลือเบิก</th><th rowspan="2" class="p">เปอร์เซ็นต์<br>งาน</th></tr>
    <tr>${cols.map(c=>`<th${c.b&&cur&&c.b.id===cur.id?' class="cur"':''}>${c.b?ppD(c.b.date):''}</th>`).join('')}</tr>`;
  const pad=Math.max(0,4-rows.length),cc=cols.map(c=>!!(c.b&&cur&&c.b.id===cur.id)),cu=j=>cc[j]?' cur':'';
  const body=rows.map((r,k)=>{const used=sum(A[k],v=>n(v)),rest=r.bud-used;const bp=r.bud?Math.max(0,Math.min(100,100*used/r.bud)):0;return `<tr class="it"><td class="c">${k+1}</td><td>${esc(r.name)}<div class="bar"><i style="width:${bp.toFixed(1)}%"></i></div></td><td class="gap"></td>${m(r.bud)}${pc(tot?100*r.bud/r.bud:0)}${A[k].map((v,j)=>m(v,cu(j))+pc(v==null||!r.bud?null:100*v/r.bud,cu(j))).join('')}${m(rest)}${pc(r.bud?100*rest/r.bud:0)}</tr>`}).join('')
    +Array.from({length:pad},()=>`<tr class="e"><td></td><td></td><td class="gap"></td><td></td><td></td>${cols.map((c,j)=>`<td class="${cu(j)}"></td><td class="${cu(j)}"></td>`).join('')}<td></td><td></td></tr>`).join('');
  const colSum=j=>A.reduce((t,a)=>t+n(a[j]),0),used=cols.reduce((t,c,j)=>t+colSum(j),0);
  const foot=(lab,cls,f,b)=>`<tr class="${cls}"><td colspan="2" class="l">${lab}</td><td class="gap"></td><td ${R}>${b||''}</td><td></td>${calc.map((c,j)=>`${m(c?f(c,j):null,cu(j))}<td class="${cu(j)}"></td>`).join('')}<td ${R}>${cls==='t'?(Math.abs(tot-used)<0.005?'-':fmt(tot-used,2)):''}</td><td></td></tr>`;
  return `<table class="pp"><thead>${head}</thead><tbody>${body}<tr class="sp"><td colspan="${7+cols.length*2}"></td></tr>
    ${foot('รวม','t',(c,j)=>colSum(j),fmt(tot,2))}
    ${n(I.adv)?foot(`หักคืนเงินล่วงหน้า ${fmtq(I.adv)}%`,'bl',c=>c.adv):''}
    ${n(I.ret)?foot(`ประกันผลงาน ${fmtq(I.ret)}%`,'bl',c=>c.ret):''}
    ${foot(`ภาษีมูลค่าเพิ่ม ${fmtq(I.vat)}%`,'',c=>c.vat)}
    ${n(I.wht)?foot(`หัก ณ ที่จ่าย ${fmtq(I.wht)}%`,'rd',c=>c.wht):''}
    ${foot('ยอดสุทธิ','n',c=>c.net)}${ppRcv(cols,calc,cu)}</tbody></table>`}
// what the client actually paid on each bill (dates from the receipts / slips) and what is still owed
function ppRcv(cols,calc,cu){const on=cols.map((c,j)=>c.b&&c.b.status!=='draft'&&calc[j]);if(!on.some(Boolean))return '';
  const L=cols.map((c,j)=>on[j]?billRcList(c.b):[]),got=L.map(l=>sum(l,x=>x.amt)),out=cols.map((c,j)=>on[j]?Math.max(0,calc[j].net-got[j]):0);
  const tg=sum(got,x=>x),to=sum(out,x=>x),m=(v,x)=>`<td class="r${x}">${Math.abs(v)<0.005?'-':fmt(v,2)}</td>`;
  return `<tr class="rv"><td colspan="2" class="l">รับเงินแล้ว (วันที่ตามสลิป)</td><td class="gap"></td><td></td><td></td>${cols.map((c,j)=>on[j]?`<td class="r${cu(j)}">${got[j]>0.005?fmt(got[j],2):'-'}${L[j].length?`<small>${L[j].map(x=>ppD(x.date)).join(', ')}</small>`:''}</td><td class="${cu(j)}"></td>`:`<td class="${cu(j)}"></td><td class="${cu(j)}"></td>`).join('')}<td class="r">${fmt(tg,2)}</td><td></td></tr>
  <tr class="od"><td colspan="2" class="l">ค้างรับ</td><td class="gap"></td><td></td><td></td>${cols.map((c,j)=>on[j]?m(out[j],cu(j)+(out[j]>0.005?' bad':''))+`<td class="${cu(j)}"></td>`:`<td class="${cu(j)}"></td><td class="${cu(j)}"></td>`).join('')}<td class="r${to>0.005?' bad':''}">${to>0.005?fmt(to,2):'-'}</td><td></td></tr>`}
const PP_CSS0=`.pp{border-collapse:separate;border-spacing:0;width:100%;font-size:11px;border:1px solid #c9d3df;border-radius:8px;overflow:hidden;font-variant-numeric:tabular-nums}
.pp th,.pp td{border:0;border-right:1px solid #e3e8ef;border-bottom:1px solid #e3e8ef;padding:4px 6px;line-height:1.35;background:none;color:#1e293b}
.pp tr>*:last-child{border-right:0}
.pp thead th{background:#1F3A5F;color:#fff;text-align:center;font-weight:600;vertical-align:middle;border-color:#2f4c73;font-size:11px}
.pp thead tr:nth-child(2) th{background:#2B4C77;font-weight:500;font-size:10px}
.pp thead th.cur,.pp thead tr:nth-child(2) th.cur{background:#F59E0B;color:#1f2937}
.pp th.p,.pp td.p{width:3.6%;font-size:9px;text-align:center;font-weight:500}
.pp thead th.p{font-size:8.5px;font-weight:400;color:#dbe4f0}
.pp td.p{color:#475569}
.pp td.cur{background:#FFF7E6}
.pp tbody tr.it:nth-child(even) td{background:#F6F8FB}
.pp tbody tr.it:nth-child(even) td.cur{background:#FDF0D5}
.pp .gap{width:0;padding:0;border-right:0}
.pp td.r{text-align:right;white-space:nowrap}.pp td.c{text-align:center;color:#64748b}
.pp td.l{text-align:right;font-weight:600;padding-right:12px;color:#334155}
.pp tr.e td{height:13px}
.pp tr.sp td{height:3px;padding:0;background:#1F3A5F;border:0}
.pp tr.t td{font-weight:700;background:#E8F3EC;color:#14532d}.pp tr.t td.l{text-align:center}
.pp tr.bl td.r{color:#1d4ed8}.pp tr.rd td.r,.pp tr.rd td.l{color:#c2410c}.pp tr.rd td.l{color:#b91c1c}.pp tr.rd td.r{color:#b91c1c}
.pp tr.n td{font-weight:700;background:#1F3A5F;color:#fff;border-color:#2f4c73;font-size:11.5px}
.pp tr.n td.cur{background:#C27803}
.pp tr.rv td{background:#ECFDF3;color:#166534;font-weight:600}.pp tr.rv td.cur{background:#FDF0D5}.pp tr.rv small{display:block;font-size:8.5px;font-weight:400;color:#4b7a5c}
.pp tr.od td{background:#FEF2F2;font-weight:600}.pp tr.od td.cur{background:#FDF0D5}.pp tr.od td.bad{color:#b91c1c}.pp tr.rv td.l,.pp tr.od td.l{color:inherit}
.pp .bar{height:3px;background:#e2e8f0;border-radius:2px;margin-top:2px;overflow:hidden}.pp .bar i{display:block;height:100%;background:#10b981}
.pp *,.pp-k *,.pp-h *,.pp-i *,.pp-s *{-webkit-print-color-adjust:exact;print-color-adjust:exact}
.pp-h{display:flex;gap:18px;align-items:center;padding-bottom:10px;border-bottom:3px solid #1F3A5F;position:relative}
.pp-h:after{content:"";position:absolute;left:0;bottom:-6px;width:160px;height:3px;background:#F59E0B}
.pp-h img{height:70px;width:auto;max-width:230px;margin:0;border:0;object-fit:contain}
.pp-h .pp-co{font-size:10px;line-height:1.65;color:#334155;flex:1}.pp-h .pp-co b{font-size:15px;color:#1F3A5F}
.pp-h .pp-tt{text-align:right}
.pp-h .pp-tt div{display:inline-block;background:#1F3A5F;color:#fff;border-radius:10px;padding:8px 18px;text-align:center}
.pp-h .pp-tt b{display:block;font-size:19px;letter-spacing:.06em;color:#fff}.pp-h .pp-tt span{font-size:11px;color:#FCD34D}
.pp-i{display:grid;grid-template-columns:1fr auto;gap:0 14px;font-size:11px;margin:14px 0 10px;align-items:stretch}
.pp-i .lf{background:#F6F8FB;border:1px solid #e3e8ef;border-left:4px solid #1F3A5F;border-radius:8px;padding:6px 12px}
.pp-i .lf>div{display:flex;line-height:1.75}.pp-i .lf span{flex:none;width:150px;color:#64748b}.pp-i b{font-weight:700;color:#0f172a}
.pp-k{display:grid;grid-template-columns:repeat(3,auto);gap:6px}
.pp-k>div{min-width:118px;border:1px solid #e3e8ef;border-radius:8px;padding:6px 10px;background:#fff;display:flex;flex-direction:column;justify-content:center}
.pp-k small{font-size:9.5px;color:#64748b}.pp-k b{font-size:14px;color:#1F3A5F;white-space:nowrap}
.pp-k .hl{background:#FFF7E6;border-color:#F59E0B}.pp-k .hl b{color:#B45309}
.pp-k .nt{background:#1F3A5F;border-color:#1F3A5F}.pp-k .nt small{color:#cbd5e1}.pp-k .nt b{color:#fff}
.pp-s{display:grid;grid-template-columns:repeat(3,1fr);gap:18px;margin-top:18px;text-align:center;font-size:11px;page-break-inside:avoid}
.pp-s>div{border:1px solid #e3e8ef;border-radius:8px;overflow:hidden}
.pp-s h4{margin:0;background:#F6F8FB;border-bottom:1px solid #e3e8ef;padding:4px;font-size:11px;color:#1F3A5F}
.pp-s .ln{border-top:1px dotted #64748b;margin:34px 24px 4px}.pp-s p{margin:0 0 3px;color:#334155}.pp-s small{color:#64748b}
`;
// same rules again under #print so the print frame's generic th/td styles don't win
const PP_CSS='<style>'+PP_CSS0+PP_CSS0.replace(/(^|\})\s*([^{}]+)\{/g,(m,a,sel)=>a+sel.split(',').map(x=>'#print '+x.trim()).join(',')+'{')+'</style>';
PRINT.ppay=id=>{const C=CO(),I=P.info,K=contract(),b=P.bills.find(x=>x.id===id)||null,cols=ppCols(),ci=b?cols.findIndex(c=>c.b&&c.b.id===b.id):-1;
  const row=(k,v)=>`<div><span>${k}</span><div>${v||'-'}</div></div>`,c=b?billCalc(b):null;
  const prog=billsSorted().filter(x=>(x.kind||'prog')==='prog'),upto=b?prog.slice(0,prog.indexOf(b)+1):prog,cum=sum(upto,x=>billCalc(x).amt);
  const kpi=(k,v,cl)=>`<div${cl?` class="${cl}"`:''}><small>${k}</small><b>${v}</b></div>`;
  return PP_CSS+`<style>@page{size:A4 landscape}</style><div data-doc-name="${esc(['PROGRESS PAYMENT',P.name,b?'งวดที่ '+(ci>=0?cols[ci].no:''):''].filter(Boolean).join(' '))}">
  <div class="pp-h">${C.logo?`<img src="${C.logo}" alt="">`:''}<div class="pp-co"><b>${esc(C.name||I.company||'')}</b>${C.nameEn?`<br>${esc(C.nameEn)}`:''}${C.addr?`<br>สำนักงานใหญ่ : ${esc(C.addr)}`:''}<br>${[C.phone?'โทร. '+esc(C.phone):'',C.email?'E-mail : '+esc(C.email):''].filter(Boolean).join('&nbsp;&nbsp; ')}${C.tax?`<br>เลขประจำตัวผู้เสียภาษีอากร : ${esc(C.tax)}`:''}</div>
  <div class="pp-tt"><div><b>PROGRESS PAYMENT</b><span>แผนเบิกงวดงาน</span></div></div></div>
  <div class="pp-i"><div class="lf">${(J=>J.pj?row('โครงการ',`<b>${esc(J.pj)}</b>`)+row('งาน',esc(J.job)):row('โครงการ',`<b>${esc(J.job)}</b>`))(pjJob(P))}${row('อ้างอิงสัญญาจ้างเลขที่',`<b>${esc(I.contractNo||'')}</b>`)}${row('ผู้ว่าจ้าง',esc(I.client||''))}${row('ผู้รับจ้าง',esc(C.name||I.company||''))}${row('มูลค่างานตามสัญญา',`<b>${fmt(K.total,2)}</b>&nbsp; บาท &nbsp;(ไม่รวมภาษีมูลค่าเพิ่ม ${fmtq(I.vat)}%)`)}</div>
  <div class="pp-k">${kpi('วันที่',b?ppD(b.date):ppD(today()))}${kpi('งวดที่เบิก',ci>=0?esc(cols[ci].no):'-','hl')}${kpi('เบิกสะสมถึงงวดนี้',fmt(cum,2)+`<span style="font-size:10px;font-weight:500;color:#64748b"> (${K.total?fmt(100*cum/K.total,0):0}%)</span>`)}${kpi('ยอดเบิกงวดนี้',c?fmt(c.amt,2):'-')}${kpi('คงเหลือตามสัญญา',fmt(K.total-cum,2))}${kpi('ยอดสุทธิงวดนี้',c?fmt(c.net,2):'-','nt')}</div></div>
  ${ppTable(b)}
  <div class="pp-s"><div><h4>ผู้จัดทำ</h4><div class="ln"></div><p>(${esc(I.pm||'..............................')})</p><small>Project Manager</small><br><small>วันที่ ......../......../........</small></div><div><h4>ผู้ตรวจสอบ</h4><div class="ln"></div><p>(..............................)</p><small>${esc(I.client||'')}</small><br><small>วันที่ ......../......../........</small></div><div><h4>ผู้อนุมัติ</h4><div class="ln"></div><p>(..............................)</p><small>${esc(I.client||'')}</small><br><small>วันที่ ......../......../........</small></div></div></div>`};
/* 3.65: the PROGRESS PAYMENT sheet also goes into the instalment set (ชุดเอกสารส่งงวด), right after the claim, so it is not
   printed separately. The rest of the set stays A4 portrait: this sheet alone is put on a landscape page (a named page), and
   its own whole-document @page rule and file name are left out so they don't change the set's. */
function subPP(b){const h=PRINT.ppay(b.id).replace('<style>@page{size:A4 landscape}</style>','').replace(/ data-doc-name="[^"]*"/,'');let z=1;
  // like a printout on its own, shrink the sheet (not below 66%) so it fits one landscape page: 297 mm less the side margins, 210 mm less header/footer space
  try{const d=fitFrame(),P0=d.getElementById('print');P0.style.width='297mm';P0.innerHTML=`<div style="padding:0 10mm"><div class="sub-pp">${h}</div></div>`;
    const w=P0.firstChild,x=w.firstChild,ht=q=>{x.style.zoom=q;x.style.width=(277/q)+'mm';return w.getBoundingClientRect().height/MMPX},lim=210-25-3;
    if(ht(1)>lim&&ht(.66)<=lim){let lo=.66,hi=1;for(let i=0;i<7;i++){const m=(lo+hi)/2;if(ht(m)<=lim)lo=m;else hi=m}z=lo}P0.innerHTML=''}catch(e){}
  return `<div class="sub-pp"${z<1?` style="zoom:${z.toFixed(3)};width:${(277/z).toFixed(1)}mm"`:''}>${h}</div>`}
document.head.insertAdjacentHTML('beforeend','<style>@page subland{size:A4 landscape;margin:0}@media print{#print .sub-pp{page:subland}}</style>');
/* 4.99.14 the sheet on the เบิกงวด page in the dark theme (user: "ช่องมืดแปลกๆ"): its cells are see-through with dark ink, so the
   odd rows and the ประกัน / VAT / หัก ณ ที่จ่าย rows showed dark text on the dark card while the even rows stayed white. On screen in
   the dark theme the sheet takes the theme's colours; the printout and the แบ่งจอ paper (a shadow root, where :root does not match)
   keep the paper colours. */
document.head.insertAdjacentHTML('beforeend',`<style>@media screen{
:root[data-theme="dark"] .tw>.pp{border-color:var(--line)}
:root[data-theme="dark"] .tw>.pp td{background:var(--surface);color:var(--ink);border-color:var(--line)}
:root[data-theme="dark"] .tw>.pp tbody tr.it:nth-child(even) td{background:#151C25}
:root[data-theme="dark"] .tw>.pp td.p,:root[data-theme="dark"] .tw>.pp td.c{color:var(--muted)}
:root[data-theme="dark"] .tw>.pp td.l{color:var(--muted)}
:root[data-theme="dark"] .tw>.pp td.cur,:root[data-theme="dark"] .tw>.pp tbody tr.it:nth-child(even) td.cur{background:rgba(245,158,11,.14)}
:root[data-theme="dark"] .tw>.pp tr.sp td{background:#1F3A5F}
:root[data-theme="dark"] .tw>.pp tr.t td{background:var(--good-soft);color:var(--good)}
:root[data-theme="dark"] .tw>.pp tr.bl td.r{color:#60A5FA}
:root[data-theme="dark"] .tw>.pp tr.rd td.r,:root[data-theme="dark"] .tw>.pp tr.rd td.l{color:var(--danger)}
:root[data-theme="dark"] .tw>.pp tr.n td{background:#1F3A5F;color:#fff;border-color:#2f4c73}
:root[data-theme="dark"] .tw>.pp tr.n td.cur{background:#C27803}
:root[data-theme="dark"] .tw>.pp tr.rv td{background:var(--good-soft);color:var(--good)}
:root[data-theme="dark"] .tw>.pp tr.rv small{color:var(--muted)}
:root[data-theme="dark"] .tw>.pp tr.od td{background:var(--danger-soft);color:var(--ink)}
:root[data-theme="dark"] .tw>.pp tr.od td.bad{color:var(--danger)}
:root[data-theme="dark"] .tw>.pp tr.rv td.cur,:root[data-theme="dark"] .tw>.pp tr.od td.cur{background:rgba(245,158,11,.14)}
:root[data-theme="dark"] .tw>.pp .bar{background:rgba(255,255,255,.12)}
}</style>`);
// on the เบิกงวด page: the same sheet as a card, with a print button
{const f=VIEWS.cost;VIEWS.cost=()=>{const h=f();if((S.sub.cost||'sum')!=='bill')return h;
  if(!(P.inst||[]).length&&!P.bills.length)return h+`<section class="card"><h2><span>แผนเบิกงวดงาน / PROGRESS PAYMENT</span></h2><p class="hint">ยังไม่มีงวดงานหรือใบเบิก สร้างงวดที่แท็บ “แผนงวดเงิน” หรือกด “+ ใบเบิก” ด้านบน แล้วแผ่น PROGRESS PAYMENT จะขึ้นที่นี่</p></section>`;
  const sel=P.bills.find(x=>x.id===S.sel.bill)||null;
  return h+`<section class="card"><h2><span>แผนเบิกงวดงาน / PROGRESS PAYMENT</span><span class="sp"></span><button type="button" class="btn sm" data-a="print" data-k="ppay" data-id="${sel?sel.id:''}">พิมพ์ Progress Payment</button></h2>
  <p class="hint">ทุกงวดอยู่ในแผ่นเดียว: งบตามสัญญา ยอดเบิกแต่ละงวดและ % ยอดคงเหลือ แล้วหักประกันผลงาน VAT และภาษี ณ ที่จ่าย จนเป็นยอดสุทธิ ท้ายตารางมียอดที่ลูกค้าจ่ายจริงและค้างรับ${sel?` · งวดที่เลือก (${esc(sel.no)}) เน้นสีเหลือง`:''}</p>
  <div class="tw">${PP_CSS}${ppTable(sel)}</div></section>`}}
Object.assign(SBKW,{'pj.cost.bill':(SBKW['pj.cost.bill']||'')+' progress payment แผนเบิกงวดงาน ใบสรุปเบิกงวด ประกันผลงาน หัก ณ ที่จ่าย'});

