/* ---------- 4.43: the Comptroller General's Factor F tables, one per work type and conditions ----------
   co.fft = [{id, w, adv, ret, int, vat, ref, fr:[{id, m, f0, f}]}]: w is the work type (FFW), the conditions are the advance,
   retention, loan interest and VAT the table was made for, and each row is a direct cost (million baht) with its factor
   without VAT (f0, "รวมในรูป Factor") and with VAT (f). The tables come from the official PDF (ว 481 of 26 Jun 2569 has
   4 work types × 12 tables): import the PDF or paste its text, or type the rows.
   A bid with a work type (t.fw) reads F from the table that matches its conditions, by the cost of the building work only;
   between two rows F is found by proportion, the way the table's note says, to 4 decimals. Groups marked as equipment
   (ครุภัณฑ์, t.eqg) are not multiplied by F: they take VAT only, in form ปร.5 (ข), and ปร.6 adds both. */
const FFW=[['bld','งานอาคาร'],['road','งานทาง'],['brg','งานสะพานและท่อเหลี่ยม'],['irr','งานชลประทาน']];
const FF_REF='ว 481 ลงวันที่ 26 มิ.ย. 2569',FF_INT=6,FF_RAIN=['พื้นที่ทั่วไป','ฝนชุก 1','ฝนชุก 2'];
const ffW=w=>(FFW.find(x=>x[0]===w)||['',''])[1];
function ffCfg(){const C=CO();C.fft=C.fft||[];return C.fft}
NEW.fft=()=>({w:'bld',adv:0,ret:0,int:FF_INT,vat:7,ref:'',fr:[]});
NEW.fr=()=>({op:'',m:0,f0:0,f:0,f1:0,f2:0});
// the 48 tables of ว 481 come with the program (928-factor-f-data.js); a company's own or newer tables (co.fft) go first
let FFB=null;const ffBuilt=()=>FFB||(FFB=FF0.T.map(([w,adv,ret,int,vat,R])=>({id:`b-${w}-${adv}-${ret}-${int}`,w,adv,ret,int,vat,ref:FF0.ref,built:1,
  fr:R.map(([op,m,f0,f,f1,f2],k)=>({id:'r'+k,op,m,f0,f,f1:f1||0,f2:f2||0}))})));
const ffSame=(T,w,adv,ret,int,vat)=>T.w===w&&n(T.adv)===n(adv)&&n(T.ret)===n(ret)&&n(T.int)===n(int)&&n(T.vat)===n(vat);
const ffOk=T=>(T.fr||[]).some(r=>n(r.m)>0&&n(r.f)>0);
const ffAll=()=>{const C=ffCfg().filter(ffOk);return [...C,...ffBuilt().filter(B=>!C.some(T=>ffSame(T,B.w,B.adv,B.ret,B.int,B.vat)))]};
const ffFind=(w,adv,ret,int,vat)=>ffAll().find(T=>ffSame(T,w,adv,ret,int,vat));
const ffName=T=>`${ffW(T.w)} · เงินล่วงหน้า ${fmtq(T.adv)}% · ประกันผลงาน ${fmtq(T.ret)}% · ดอกเบี้ย ${fmtq(T.int)}% · VAT ${fmtq(T.vat)}%`;
const ffRainy=T=>(T.fr||[]).some(r=>n(r.f1)>0);
const r4=v=>Math.round(v*10000)/10000;
// F for a direct cost D (baht) in rain zone z: the first row below the table, the last row above it, by proportion in between;
// a row marked ">" (งานอาคาร "> 500") holds for every cost above its value
function ffAt(T,D,z){if(!T)return null;const A=(T.fr||[]).filter(r=>n(r.m)>0&&n(r.f)>0),R=A.filter(r=>r.op!=='>').sort((a,b)=>n(a.m)-n(b.m)),G=A.find(r=>r.op==='>');if(!R.length)return null;
  z=ffRainy(T)?n(z):0;const x=n(D)/1e6,fz=r=>n(z===2?r.f2:z===1?r.f1:r.f)||n(r.f),f0=r=>(n(r.f0)||n(r.f)/(1+n(T.vat)/100))*fz(r)/n(r.f);
  const one=r=>({T,x,z,lo:r,hi:r,F:fz(r),F0:r4(f0(r))});
  if(G&&x>n(G.m))return one(G);if(x<=n(R[0].m))return one(R[0]);const L=R[R.length-1];if(x>=n(L.m))return one(L);
  for(let i=1;i<R.length;i++)if(x<=n(R[i].m)){const a=R[i-1],b=R[i],k=(x-n(a.m))/(n(b.m)-n(a.m));
    return {T,x,z,lo:a,hi:b,F:r4(fz(a)-(fz(a)-fz(b))*k),F0:r4(f0(a)-(f0(a)-f0(b))*k)}}}
const ffHow=ft=>!ft?'':(ft.z?FF_RAIN[ft.z]+' · ':'')+(ft.lo===ft.hi?`ค่างานต้นทุน ${fmt(ft.x,3)} ล้านบาท ใช้แถว ${ft.lo.op==='>'?'มากกว่า ':''}${fmtq(ft.lo.m)} ล้านบาท`
  :`ค่างานต้นทุน ${fmt(ft.x,3)} ล้านบาท อยู่ระหว่างแถว ${fmtq(ft.lo.m)} ล้านกับ ${fmtq(ft.hi.m)} ล้าน เทียบอัตราส่วนได้ ${fmt(ft.F,4)}`);

// --- reading the official tables from text (pasted, or read out of the PDF) ---
const ffNum=s=>{const v=parseFloat(String(s).replace(/,/g,''));return isNaN(v)?null:v};
function ffParse(txt,w0){const out=[];let w=w0||'bld',cond={adv:null,ret:null,int:null,vat:null},cur=null;
  const pc=(l,re)=>{const m=l.match(re);return m?ffNum(m[1]):null};
  String(txt||'').split(/\r?\n/).forEach(raw=>{const l=raw.replace(/\s+/g,' ').trim();if(!l)return;
    if(/[ก-๙]/.test(l)){
      if(/สะพาน|ท่อเหลี่ยม/.test(l))w='brg';else if(/ชลประทาน/.test(l))w='irr';else if(/งาน\s*ก่อสร้าง\s*ทาง|งานทาง/.test(l))w='road';else if(/อาคาร/.test(l))w='bld';
      const a=pc(l,/ล่วงหน้า[^\d\n]{0,30}?(\d+(?:\.\d+)?)\s*%/),r=pc(l,/ประกันผลงาน[^\d\n]{0,30}?(\d+(?:\.\d+)?)\s*%/),i=pc(l,/ดอกเบี้ย[^\d\n]{0,30}?(\d+(?:\.\d+)?)\s*%/),v=pc(l,/มูลค่าเพิ่ม[^\d\n]{0,30}?(\d+(?:\.\d+)?)\s*%/);
      [['adv',a],['ret',r],['int',i],['vat',v]].forEach(([k,x])=>{if(x!=null){cond[k]=x;cur=null}});
      if(!/\d/.test(l.replace(/[^\d.]/g,'')))return}
    // a row: numbers only, maybe after ≤ / ≥ / > (a "> 500" row holds above 500); cost, รวมในรูป Factor, F, and F ฝนชุก 1 / 2 when there
    const op=/^(>|มากกว่า|เกิน)\s*\d/.test(l)?'>':'',s=l.replace(/^(ต่ำกว่า|น้อยกว่า|ไม่เกิน|ไม่ถึง|มากกว่า|เกิน|<|≤|>|≥)\s*/,'');if(!/^[\d.,\s%]+$/.test(s))return;
    const N=s.split(/\s+/).map(ffNum).filter(x=>x!=null);if(N.length<2)return;
    const m=N[0],F=N.slice(1);if(!(m>0)||!F.every(f=>f>0.9&&f<2.5))return;
    const [f0,f,f1,f2]=F.length>=4?F:F.length===3?[F[0],F[1],0,0]:F.length===2?[F[0],F[1],0,0]:[0,F[0],0,0];
    const last=cur&&cur.fr[cur.fr.length-1];
    if(!cur||cur.w!==w||(last&&(m<n(last.m)||(m===n(last.m)&&!op)))){cur={w,adv:cond.adv??0,ret:cond.ret??0,int:cond.int??FF_INT,vat:cond.vat??7,ref:'',fr:[]};out.push(cur)}
    cur.fr.push({op,m,f0:f0<f?f0:0,f:f0<f?f:f0,f1:f1||0,f2:f2||0})});
  return out.filter(T=>T.fr.length>=2)}
async function ffPdfText(file){await libLoad('pdf.min.js');pdfjsLib.GlobalWorkerOptions.workerSrc='files/lib/pdf.worker.min.js';
  const pdf=await pdfjsLib.getDocument({data:new Uint8Array(await file.arrayBuffer())}).promise,out=[];
  for(let pg=1;pg<=pdf.numPages;pg++){const tc=await(await pdf.getPage(pg)).getTextContent(),L=[];
    tc.items.forEach(it=>{if(!it.str||!it.str.trim())return;const x=it.transform[4],y=it.transform[5];let l=L.find(l=>Math.abs(l.y-y)<3.5);if(!l){l={y,it:[]};L.push(l)}l.it.push({x,e:x+(it.width||it.str.length*4),s:it.str})});
    L.sort((a,b)=>b.y-a.y).forEach(l=>{l.it.sort((a,b)=>a.x-b.x);let s='',e=null;l.it.forEach(t=>{s+=e==null?t.s:(t.x-e>4?'  ':t.x-e>1.5&&!/^[ัิ-ฺ็-๎]/.test(t.s)?' ':'')+t.s;e=t.e});out.push(s.replace(/[-]/g,''))})}
  return out.join('\n')}
function ffTake(L){const A=ffCfg();let add=0,rep=0;
  L.forEach(T=>{const o=A.find(x=>ffSame(x,T.w,T.adv,T.ret,T.int,T.vat)),fr=T.fr.map(r=>Object.assign({id:uid()},r));
    const ref=T.ref||`นำเข้าเมื่อ ${thDL(today())}`;if(o){o.fr=fr;o.ref=ref;rep++}else{A.push(Object.assign({id:uid()},T,{fr,ref}));add++}});
  save();render();toast(L.length?`นำเข้า ${L.length} ตาราง (ใหม่ ${add} · แทนที่ ${rep})`:'ไม่พบตาราง Factor F ในข้อความนี้')}
ACT.ffPaste=()=>dialog('นำเข้าตาราง Factor F',`<ol class="steps"><li>เปิดไฟล์ PDF ตาราง Factor F ของกรมบัญชีกลาง (${FF_REF})</li><li>ลากเลือกตั้งแต่ชื่อตารางและเงื่อนไข (เงินล่วงหน้า ประกันผลงาน ดอกเบี้ย VAT) จนถึงแถวสุดท้าย แล้วคัดลอก</li><li>วางในช่องด้านล่าง วางหลายตารางพร้อมกันได้</li></ol>
  <label>ถ้าข้อความไม่มีชื่อประเภทงาน ให้ถือเป็น<select id="ffW0">${FFW.map(([k,l])=>`<option value="${k}">${l}</option>`).join('')}</select></label>
  <textarea id="ffTxt" rows="10" placeholder="ค่างานต้นทุน (ล้านบาท)   ...   รวมในรูป Factor   Factor F"></textarea>`,
  `<button type="button" class="btn" data-a="ffPdf">เลือกไฟล์ PDF แทน</button><button type="button" class="btn pri" data-a="ffPasteGo">นำเข้า</button>`);
ACT.ffPasteGo=()=>{const L=ffParse($('#ffTxt').value,$('#ffW0').value);if(!L.length){toast('ไม่พบแถวตัวเลขของตาราง Factor F');return}$('#dlg').close();ffTake(L)};
ACT.ffPdf=()=>{const w0=($('#ffW0')||{}).value||'bld';pickFile(async file=>{toast('กำลังอ่าน '+file.name+' …');let txt='';
  try{txt=await ffPdfText(file)}catch(e){toast('อ่านไฟล์นี้ไม่ได้ ลองคัดลอกข้อความจาก PDF มาวางแทน');return}
  const L=ffParse(txt,w0);if($('#dlg').open)$('#dlg').close();if(!L.length){toast('ไม่พบตาราง Factor F ในไฟล์ (ไฟล์สแกนอ่านไม่ได้) ลองคัดลอกข้อความมาวาง');return}ffTake(L)})};
ACT.ffDel=b=>{const A=ffCfg(),T=A.find(x=>x.id===b.dataset.id);if(!T||!confirm(`ลบตาราง ${ffName(T)}?`))return;A.splice(A.indexOf(T),1);save();render()};
ACT.ffSel=b=>{S.sel.fft=b.dataset.id;render()};

// --- the tables tab ---
ACT.ffCopy=b=>{const T=ffAll().find(x=>x.id===b.dataset.id);if(!T)return;const x=Object.assign({},T,{id:uid(),built:0,ref:(T.ref||'')+' (แก้ไขโดยบริษัท)',fr:T.fr.map(r=>Object.assign({},r,{id:uid()}))});delete x.built;
  ffCfg().push(x);S.sel.fft=x.id;save();render();toast('คัดลอกเป็นตารางของบริษัทแล้ว แก้ตัวเลขได้ ตารางนี้จะใช้แทนตารางเดิม')};
function ffSection(){const A=[...ffCfg(),...ffAll().filter(T=>T.built)],cur=A.find(x=>x.id===S.sel.fft)||A[0],used=ffAll();
  const btn=T=>`<button type="button" class="btn sm${cur&&cur.id===T.id?' pri':''}" data-a="ffSel" data-id="${T.id}"${used.includes(T)?'':' style="opacity:.55" title="มีตารางของบริษัทใช้แทน"'}>${T.built?'':'★ '}ล่วงหน้า ${fmtq(T.adv)}% · ประกัน ${fmtq(T.ret)}%${n(T.int)!==FF_INT?` · ดอกเบี้ย ${fmtq(T.int)}%`:''}</button>`;
  const by=FFW.map(([w,l])=>{const L=A.filter(T=>T.w===w).sort((a,b)=>n(a.adv)-n(b.adv)||n(a.ret)-n(b.ret)||n(a.int)-n(b.int));
    return `<div><b>${l}</b> <small class="muted">${L.length} ตาราง</small><div class="row" style="flex-wrap:wrap;gap:4px;margin-top:4px">${L.map(btn).join('')||'<span class="hint" style="margin:0">ยังไม่มี</span>'}</div></div>`}).join('');
  const rain=cur&&ffRainy(cur),b=cur&&!cur.built?`co.fft.${cur.id}`:'';
  const cols=[{k:'op',h:'',t:'sel',o:[['',''],['>','มากกว่า']],w:70},{k:'m',h:'ค่างานต้นทุน (ล้านบาท)',t:'num',w:110},{k:'f0',h:'รวมในรูป Factor (ไม่รวม VAT)',t:'num',w:110},{k:'f',h:'Factor F (รวม VAT)',t:'num',w:110},
    ...(rain||(cur&&/road|irr/.test(cur.w))?[{k:'f1',h:'Factor F ฝนชุก 1',t:'num',w:110},{k:'f2',h:'Factor F ฝนชุก 2',t:'num',w:110}]:[])];
  const ro=cur&&cur.built?`<div class="tw"><table><thead><tr><th>ค่างานต้นทุน (ล้านบาท)</th><th class="r">รวมในรูป Factor</th><th class="r">Factor F</th>${rain?'<th class="r">Factor F ฝนชุก 1</th><th class="r">Factor F ฝนชุก 2</th>':''}</tr></thead><tbody>
    ${cur.fr.map((r,k)=>`<tr><td>${r.op==='>'?'&gt; ':k===0?'≤ ':k===cur.fr.length-1?'≥ ':''}${fmtq(r.m)}</td><td class="r">${fmt(r.f0,4)}</td><td class="r"><b>${fmt(r.f,4)}</b></td>${rain?`<td class="r">${fmt(r.f1,4)}</td><td class="r">${fmt(r.f2,4)}</td>`:''}</tr>`).join('')}</tbody></table></div>`:'';
  return `<section class="card"><h2><span>ตาราง Factor F ของกรมบัญชีกลาง</span><small>แยกตามประเภทงานและเงื่อนไข · ใช้กับงานราชการ</small><span class="sp"></span>
    <button type="button" class="btn sm" data-a="ffPaste">นำเข้าฉบับใหม่จาก PDF / วางข้อความ</button><button type="button" class="btn sm" data-a="add" data-c="co.fft" data-sel="fft">+ ตารางเปล่า</button></h2>
  <p class="hint">ในโปรแกรมมีตารางตามหนังสือกรมบัญชีกลาง ${FF0.ref} ครบ 4 ประเภทงาน ประเภทละ 12 ตาราง (เงินล่วงหน้า 0–15% × เงินประกันผลงาน 0–10% ดอกเบี้ยเงินกู้ ${FF_INT}% VAT 7%) · งานที่เลือกประเภทงานไว้จะเปิดตารางที่เงื่อนไขตรงกันเอง ค่างานอยู่ระหว่างแถวจะเทียบอัตราส่วน ทศนิยม 4 ตำแหน่ง · งานทางและงานชลประทานเลือกพื้นที่ฝนชุกได้ · งานเงินกู้หรืองานที่ไม่เสีย VAT ใช้ช่อง “รวมในรูป Factor” · เมื่อกรมบัญชีกลางออกตารางใหม่ กดนำเข้า ตาราง ★ ของบริษัทจะใช้แทนตารางเดิมที่เงื่อนไขเดียวกัน</p>
  <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:10px;margin:8px 0">${by}</div>
  ${cur?`<h3 style="margin:14px 0 6px">${esc(ffName(cur))} <small class="muted">${esc(cur.ref||'')}</small></h3>
  ${cur.built?ro+`<div class="row" style="margin-top:8px"><button type="button" class="btn sm" data-a="ffCopy" data-id="${cur.id}">คัดลอกเป็นตารางของบริษัทเพื่อแก้ไข</button></div>`
  :`<div class="form"><label>ประเภทงาน<select data-p="${b}.w">${FFW.map(([k,l])=>`<option value="${k}"${k===cur.w?' selected':''}>${l}</option>`).join('')}</select></label>
    <label>เงินล่วงหน้าจ่าย (%)<input data-t="num" inputmode="decimal" data-p="${b}.adv" value="${n(cur.adv)}"></label><label>เงินประกันผลงานหัก (%)<input data-t="num" inputmode="decimal" data-p="${b}.ret" value="${n(cur.ret)}"></label>
    <label>ดอกเบี้ยเงินกู้ (% ต่อปี)<input data-t="num" inputmode="decimal" data-p="${b}.int" value="${n(cur.int)}"></label><label>VAT (%)<input data-t="num" inputmode="decimal" data-p="${b}.vat" value="${n(cur.vat)}"></label>
    <label class="w2">ที่มา<input data-p="${b}.ref" value="${esc(cur.ref||'')}"></label></div>
  ${gtable(`${b}.fr`,(cur.fr||[]).slice().sort((x,y)=>n(x.m)-n(y.m)||(x.op==='>')-(y.op==='>')),cols,{empty:'ยังไม่มีแถว นำเข้าจาก PDF หรือเพิ่มแถวเอง'})}
  <div class="row" style="margin-top:8px"><button type="button" class="btn sm" data-a="add" data-c="${b}.fr">+ เพิ่มแถว</button><span class="sp"></span><button type="button" class="btn sm danger" data-a="ffDel" data-id="${cur.id}">ลบตารางนี้</button></div>`}`:''}</section>`}
{const f=tfView;tfView=function(){return ffSection()+f().replace('<span>ตารางค่าอำนวยการและกำไรตามขนาดงาน</span>','<span>ตารางค่าอำนวยการและกำไรของบริษัท</span><small>ใช้เมื่อไม่ได้เลือกประเภทงาน หรือยังไม่มีตารางทางราชการที่เงื่อนไขตรงกัน</small>')}}

// --- the bid: which groups are equipment, which table, and the price with them ---
const tdEqSet=t=>{const all=[...new Set(t.items.map(i=>i.g))];return new Set(t.eqg?all.filter(g=>t.eqg.includes(g)):all.filter(g=>/ครุภัณฑ์/.test(gName(g))))};
const tdEqCost=(t,E)=>sum(t.items.filter(i=>E.has(i.g)),i=>n(i.q)*(tdM(t,i)+tdL(t,i)));
ACT.tdInt=b=>{const t=tdById(b.dataset.id);if(!t)return;t.int=FF_INT;save();render()};
{const f=NEW.tenders;NEW.tenders=a=>Object.assign(f(a),{int:FF_INT,fw:'bld'})}
ACT.tdEq=b=>{const t=tdById(b.dataset.id);if(!t)return;const E=tdEqSet(t),g=b.dataset.g;if(E.has(g))E.delete(g);else E.add(g);t.eqg=[...E];save();render()};
{const f=tdCalc;tdCalc=t=>{const c=f(t);if(t.mode==='pvt')return c;
  const E=tdEqSet(t),DB=tdEqCost(t,E),DA=c.D-DB,vat=n(t.vat)/100,T=t.fw?ffFind(t.fw,t.adv,t.ret,t.int,t.vat):null,ft=T?ffAt(T,DA,t.rain):null;
  const fsrc=n(t.Fo)>0?'own':ft?'tab':'calc';Object.assign(c,{DA,DB,fsrc,ft});
  if(fsrc!=='tab'&&!DB)return c;
  const F=fsrc==='own'?n(t.Fo):fsrc==='tab'?(vat?ft.F:ft.F0):c.Fc,raw=DA*F+DB*(1+vat),rd=Math.max(1,n(t.round)),bid=Math.max(0,Math.floor(raw/rd)*rd-n(t.disc));
  const net=bid/(1+vat),bud=n(t.budget),gross=bid;
  return Object.assign(c,{F,raw,bid,net,vat:bid-net,gross,mk:c.D?net/c.D:1,margin:net-c.D,profitLeft:net-DA*(1+(c.oh+c.fin+c.risk)/100)-DB,diff:bud?(gross-bud)/bud*100:null})}}
function tdFCard(t){const c=tdCalc(t),E=tdEqSet(t),G=[...new Set(t.items.map(i=>i.g))],b=`co.tenders.${t.id}`,need=t.fw?ffName({w:t.fw,adv:t.adv,ret:t.ret,int:t.int,vat:t.vat}):'';
  return `<section class="card"><h2><span>Factor F ตามตารางกรมบัญชีกลาง</span><small>${FF_REF}</small></h2>
  <div class="form"><label>ประเภทงาน<select data-p="${b}.fw"><option value="">ไม่เลือก (คำนวณจากตารางของบริษัท)</option>${FFW.map(([k,l])=>`<option value="${k}"${k===t.fw?' selected':''}>${l}</option>`).join('')}</select></label>
    ${/road|irr/.test(t.fw||'')?`<label>พื้นที่<select data-p="${b}.rain" data-t="num">${FF_RAIN.map((l,k)=>`<option value="${k}"${k===n(t.rain)?' selected':''}>${l}</option>`).join('')}</select></label>`:''}</div>
  ${n(t.Fo)>0?`<p class="hint">ใช้ Factor F ${fmt(n(t.Fo),4)} ที่พิมพ์ไว้ในช่อง “Factor F ตามตารางทางราชการ” ลบค่านั้นออกเพื่อให้เปิดจากตาราง</p>`
   :c.ft?`<p><span class="pill good">ตาราง ${esc(ffName(c.ft.T))}</span></p><p style="margin:6px 0">${ffHow(c.ft)} → <b>Factor F ${fmt(n(t.vat)?c.ft.F:c.ft.F0,4)}</b>${n(t.vat)?'':' (ช่องรวมในรูป Factor เพราะงานนี้ไม่คิด VAT)'}</p>`
   :t.fw?`<p><span class="pill bad">ไม่มีตาราง ${esc(need)}</span> ตาราง ${FF0.ref} มีเงินล่วงหน้า 0 / 5 / 10 / 15% เงินประกันผลงาน 0 / 5 / 10% ดอกเบี้ย ${FF_INT}% VAT 7% ตอนนี้ใช้ Factor F ที่คำนวณ ${fmt(c.Fc,4)}
     ${n(t.int)!==FF_INT?`<button type="button" class="btn sm" data-a="tdInt" data-id="${t.id}">ใช้ดอกเบี้ย ${FF_INT}% ตาม ${FF0.ref}</button>`:''}</p>`
   :'<p class="hint">เลือกประเภทงานเพื่อเปิด Factor F จากตารางทางราชการตามเงินล่วงหน้า เงินประกันผลงาน และดอกเบี้ยที่กรอกด้านล่าง</p>'}
  ${G.length?`<h3 style="margin:12px 0 4px">หมวดครุภัณฑ์จัดซื้อ (ปร.5 ข) <small class="muted">ไม่คูณ Factor F คิด VAT อย่างเดียว</small></h3><div class="row" style="flex-wrap:wrap;gap:4px 14px">
    ${G.map(g=>`<label style="display:inline-flex;gap:6px;align-items:center"><input type="checkbox" data-a="tdEq" data-id="${t.id}" data-g="${esc(g)}"${E.has(g)?' checked':''}> ${esc(gName(g))}</label>`).join('')}</div>
    ${c.DB?`<p style="margin:8px 0 0">ค่าก่อสร้าง (ปร.5 ก) ${fmt(c.DA,2)} × ${fmt(c.F,4)} = ${fmt(c.DA*c.F,2)} · ค่าครุภัณฑ์ (ปร.5 ข) ${fmt(c.DB,2)} × ${fmt(1+n(t.vat)/100,2)} = ${fmt(c.DB*(1+n(t.vat)/100),2)} · รวม ${fmt(c.raw,2)} บาท</p><p class="hint">Factor F เปิดจากค่างานต้นทุนของงานก่อสร้างเท่านั้น ไม่รวมครุภัณฑ์</p>`:''}`:''}</section>`}
const tdFSrc=(t,c)=>c.fsrc==='own'?'ตามตารางทางราชการ':c.fsrc==='tab'?`ตามตาราง ${ffW(c.ft.T.w)} ${c.ft.T.ref||FF_REF}`:'คำนวณ';
{const f=tdView;tdView=function(){let h=f();const t=curTd();if(!t||t.mode==='pvt')return h;const c=tdCalc(t);
  h=h.replace(/<b>Factor F \((ตามตารางทางราชการ|คำนวณ)\)<\/b>/,`<b>Factor F (${tdFSrc(t,c)})</b>${c.DB?' + ครุภัณฑ์ × (1 + VAT)':''}`);
  h=h.replace('ก่อนยื่นงานราชการให้ใส่ Factor F จากตารางของกรมบัญชีกลางฉบับปัจจุบันในช่อง Factor F','งานราชการเลือกประเภทงานในการ์ด “Factor F ตามตารางกรมบัญชีกลาง” ด้านบน โปรแกรมเปิดค่าจากตารางให้เอง');
  const k=h.indexOf('<section class="card"><h2><span>คำนวณ Factor F');return k<0?h+tdFCard(t):h.slice(0,k)+tdFCard(t)+h.slice(k)}}

// --- ปร.5 (ก) per part, ปร.5 (ข) for equipment, ปร.6 adding both (government work; private work keeps the forms before) ---
const tdFNote=(t,c)=>`<b>เงื่อนไขที่ใช้คำนวณ</b> เงินล่วงหน้าจ่าย ${fmtq(t.adv)}% · เงินประกันผลงานหัก ${fmtq(t.ret)}% · ดอกเบี้ยเงินกู้ ${fmtq(t.int)}% ต่อปี · ภาษีมูลค่าเพิ่ม ${fmtq(t.vat)}%`+
  (c.fsrc==='own'?' · Factor F ตามตารางทางราชการ':c.fsrc==='tab'?` · Factor F ตามตาราง${esc(ffW(c.ft.T.w))} ${esc(c.ft.T.ref||FF_REF)} ${esc(ffHow(c.ft))}`
   :` · Factor F คำนวณจากค่าอำนวยการ ${fmt(c.oh,2)}% กำไร ${fmt(c.pr,2)}% ดอกเบี้ย ${fmt(c.fin,2)}% ของค่างานต้นทุนทั้งโครงการ`);
const tdPartsA=(t,E)=>tdParts(t).map(p=>Object.assign({},p,{G:p.G.filter(g=>g.pre||!E.has(g.g))})).filter(p=>p.G.length);
const tdGroupsB=(t,E)=>{const G=[];t.items.filter(i=>E.has(i.g)).forEach(i=>{let g=G.find(x=>x.g===i.g);if(!g)G.push(g={g:i.g,name:gName(i.g),items:[]});g.items.push(i)});return G};
const tdTitle6=t=>!t.fw||t.fw==='bld'?'แบบสรุปผลการคำนวณราคากลางงานก่อสร้างอาคาร':'แบบสรุปผลการคำนวณราคากลางงานก่อสร้าง';
// 965-reference-price.js sets PRINT.pr5 / pr6 after this file: the setters keep its versions for private work, the getters give these
{let o5=PRINT.pr5,o6=PRINT.pr6;const G={};
Object.defineProperty(PRINT,'pr5',{configurable:true,enumerable:true,get:()=>G.pr5,set:v=>{o5=v}});
Object.defineProperty(PRINT,'pr6',{configurable:true,enumerable:true,get:()=>G.pr6,set:v=>{o6=v}});
G.pr5=id=>{const t=tdById(id);if(!t||t.mode==='pvt')return o5(id);const c=tdCalc(t),E=tdEqSet(t),P=tdPartsA(t,E),B=tdGroupsB(t,E),F=c.F,ref=tdRef(t),r=v=>`<td style="text-align:right">${v}</td>`;
  const N=P.length+(B.length?1:0),one=N===1,vt=n(t.vat)/100;
  const A=P.map((p,k)=>{const D=sum(p.G,g=>tdGCost(t,g));
    return (k?tdBr:'')+prMetaP(t,B.length?'ปร.5 (ก)':'ปร.5',k+1,P.length)+`<h1 style="text-align:center">แบบสรุปค่าก่อสร้าง</h1>`+prHead(t)+
    `<p style="margin:4px 0">${P.length>1?`<b>อาคาร / ส่วนงาน</b> ${esc(p.name)} · `:''}ระยะเวลาก่อสร้าง ${fmtq(t.months)} เดือน · ราคาจากแบบ ปร.4 จำนวน ${p.G.length} หมวด</p>
    <table><thead><tr><th>ลำดับ</th><th>รายการ</th><th>ค่างานต้นทุน (บาท)</th><th>Factor F</th><th>ค่าก่อสร้าง (บาท)</th><th>หมายเหตุ</th></tr></thead><tbody>
    ${p.G.map((g,i)=>{const v=tdGCost(t,g);return `<tr><td>${i+1}</td><td>${esc(g.name)}</td>${r(fmt(v,2))}<td style="text-align:center">${fmt(F,4)}</td>${r(fmt(v*F,2))}<td></td></tr>`}).join('')}
    <tr><td></td><td style="text-align:right"><b>รวมค่าก่อสร้าง${P.length>1?esc(p.name):''}</b></td>${r('<b>'+fmt(D,2)+'</b>')}<td></td>${r('<b>'+fmt(D*F,2)+'</b>')}<td></td></tr>
    ${one?`<tr><td></td><td style="text-align:right">ปัดเศษ${n(t.disc)?' และลดราคา':''}</td><td></td><td></td>${r(fmt(c.bid-c.raw,2))}<td></td></tr>
    <tr><td></td><td style="text-align:right"><b>${ref?'ราคากลาง':'ราคาที่เสนอ'} (รวมภาษีมูลค่าเพิ่ม)</b></td><td></td><td></td>${r('<b>'+fmt(c.gross,2)+'</b>')}<td></td></tr>
    <tr><td colspan="6" style="text-align:center"><b>(${bahtText(c.gross)})</b></td></tr>`:`<tr><td colspan="6" style="text-align:center">รวม${B.length?'ค่าก่อสร้างกับค่าครุภัณฑ์ ':'ทุกอาคาร '}ปัดเศษ และ${ref?'ราคากลาง':'ราคาที่เสนอ'}อยู่ในแบบ ปร.6</td></tr>`}</tbody></table>
    <p style="margin-top:8px">${tdFNote(t,c)}</p>`+tdSigns(t)}).join('');
  if(!B.length)return A;
  const DB=sum(B,g=>sum(g.items,i=>n(i.q)*(tdM(t,i)+tdL(t,i))));
  return A+(A?tdBr:'')+prMeta(t,'ปร.5 (ข)')+`<h1 style="text-align:center">แบบสรุปค่าครุภัณฑ์จัดซื้อ</h1>`+prHead(t)+
    `<table><thead><tr><th>ลำดับ</th><th>รายการ</th><th>จำนวน</th><th>หน่วย</th><th>ราคาต่อหน่วย (บาท)</th><th>จำนวนเงิน (บาท)</th></tr></thead><tbody>
    ${B.map((g,k)=>`<tr><td><b>${k+1}</b></td><td colspan="5"><b>${esc(g.name)}</b></td></tr>`+g.items.map((i,j)=>{const u=tdM(t,i)+tdL(t,i);return `<tr><td>${k+1}.${j+1}</td><td>${esc(itemName(i))}</td>${r(fmtq(i.q))}<td>${esc(i.unit||'')}</td>${r(fmt(u,2))}${r(fmt(n(i.q)*u,2))}</tr>`}).join('')).join('')}
    <tr><td></td><td style="text-align:right"><b>รวมค่าครุภัณฑ์ ไม่รวมภาษีมูลค่าเพิ่ม</b></td><td></td><td></td><td></td>${r('<b>'+fmt(DB,2)+'</b>')}</tr>
    <tr><td></td><td style="text-align:right">ภาษีมูลค่าเพิ่ม ${fmtq(t.vat)}%</td><td></td><td></td><td></td>${r(fmt(DB*vt,2))}</tr>
    <tr><td></td><td style="text-align:right"><b>รวมค่าครุภัณฑ์จัดซื้อทั้งสิ้น</b></td><td></td><td></td><td></td>${r('<b>'+fmt(DB*(1+vt),2)+'</b>')}</tr></tbody></table>
    <p style="margin-top:8px">ค่าครุภัณฑ์จัดซื้อไม่คูณ Factor F คิดภาษีมูลค่าเพิ่มอย่างเดียว และรวมไว้ในแบบ ปร.6</p>`+tdSigns(t)};
G.pr6=id=>{const t=tdById(id);if(!t||t.mode==='pvt')return o6(id);const c=tdCalc(t),E=tdEqSet(t),P=tdPartsA(t,E),B=tdGroupsB(t,E),F=c.F,ref=tdRef(t),vt=n(t.vat)/100,r=v=>`<td style="text-align:right">${v}</td>`;
  const R=P.map((p,i)=>{const D=sum(p.G,g=>tdGCost(t,g));return `<tr><td>${i+1}</td><td>${esc(p.name||t.title||'งานก่อสร้าง')}</td>${r(fmt(D,2))}<td style="text-align:center">${fmt(F,4)}</td>${r(fmt(D*F,2))}<td>ตามแบบ ปร.5${B.length?' (ก)':''}${P.length>1?' ส่วนที่ '+(i+1):''}</td></tr>`}).join('')
    +(B.length?`<tr><td>${P.length+1}</td><td>ค่าครุภัณฑ์จัดซื้อ</td>${r(fmt(c.DB,2))}<td style="text-align:center">–</td>${r(fmt(c.DB*(1+vt),2))}<td>ตามแบบ ปร.5 (ข) รวมภาษีมูลค่าเพิ่ม</td></tr>`:'');
  return prMeta(t,'ปร.6')+`<h1 style="text-align:center">${tdTitle6(t)}</h1>`+prHead(t)+
  `<p style="margin:4px 0">${ref?'คำนวณราคากลาง':'ประมาณราคา'}ตามแบบ ปร.4 และ ปร.5 ที่แนบ · ระยะเวลาก่อสร้าง ${fmtq(t.months)} เดือน</p>
  <table><thead><tr><th>ลำดับ</th><th>รายการ</th><th>ค่างานต้นทุน (บาท)</th><th>Factor F</th><th>ค่าก่อสร้างเป็นเงิน (บาท)</th><th>หมายเหตุ</th></tr></thead><tbody>${R}
  <tr><td></td><td style="text-align:right"><b>รวมค่าก่อสร้างทั้งโครงการ</b></td>${r('<b>'+fmt(c.D,2)+'</b>')}<td></td>${r('<b>'+fmt(c.raw,2)+'</b>')}<td></td></tr>
  <tr><td></td><td style="text-align:right">ปัดเศษ${n(t.disc)?' และลดราคา':''}</td><td></td><td></td>${r(fmt(c.bid-c.raw,2))}<td></td></tr>
  <tr><td></td><td style="text-align:right"><b>${ref?'ราคากลาง':'ราคาที่เสนอ'} (รวมภาษีมูลค่าเพิ่ม)</b></td><td></td><td></td>${r('<b>'+fmt(c.gross,2)+'</b>')}<td></td></tr>
  <tr><td colspan="6" style="text-align:center"><b>(${bahtText(c.gross)})</b></td></tr></tbody></table>
  <p style="margin-top:8px">Factor F ${fmt(F,4)} ${tdFSrc(t,c)}${c.ft&&c.fsrc==='tab'?' · '+esc(ffHow(c.ft)):''} · ภาษีมูลค่าเพิ่ม ${fmtq(t.vat)}% · ${ref?'คำนวณราคากลาง':'ประมาณราคา'}เมื่อวันที่ ${thDL(t.date)}</p>`+tdSigns(t)}}

// the sold government forms (984): Q.govW picks the table, read by the building-work cost
const FF_GOVW=[['','คิดจากราคาในใบเสนอราคา'],...FFW.flatMap(([k,l])=>/road|irr/.test(k)?[[k,l],[k+':1',l+' ฝนชุก 1'],[k+':2',l+' ฝนชุก 2']]:[[k,l]])];
const ffGov=(Q,cA)=>{if(!Q||!Q.govW)return null;const [w,z]=String(Q.govW).split(':');return ffAt(ffFind(w,Q.govAdv,Q.govRet,Q.govInt===''||Q.govInt==null?FF_INT:Q.govInt,7),cA,n(z))};
SBKW['co.tender.tf']=(SBKW['co.tender.tf']||'')+' ตารางกรมบัญชีกลาง ว 481 งานอาคาร งานทาง สะพาน ชลประทาน เงินล่วงหน้า ประกันผลงาน ครุภัณฑ์ ปร.5 ข';
