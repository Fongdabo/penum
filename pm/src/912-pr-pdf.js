/* ---------- 3.98: จัดซื้อ › ใบขอซื้อและเทียบราคา › ดึงจาก PDF ----------
   A supplier's quotation (PDF, or Excel / CSV) fills that supplier's ราคา/หน่วย column in the PR's price comparison.
   The file is read with the BOQ import's readers (710-import-items.js), every PR line is matched to the file line with the
   closest name (pbBig / pbSim from 530-moc-prices.js), and lines the PR does not have yet can be added. A plain list of
   things to buy can also start a new PR, its prices taken as the budget. Delivery days, credit, a discount at the foot of
   the quotation and "prices include VAT" are read from the file too. The file itself stays with the supplier's column
   (IndexedDB, as 740-keep-original-file.js does) so it can be opened again. Nothing leaves the computer. */
const PRF={};// the open dialog: {id (PR, '' = a new PR), name, file, rows:[{desc,unit,q,p}], match:{lineId:rowIdx}, add:{rowIdx:bool}, mode, vid, ...}
const PRF_OK=.45,PRF_SURE=.75;
const prfClean=s=>impTxt(s).replace(/^[-–•*·\s]+/,'').replace(/\s+/g,' ');
// a company name without บริษัท / จำกัด / Co., Ltd. so "บจก. แสงไทย" finds "บริษัท แสงไทย จำกัด"
const prfCoKey=s=>impTxt(s).toLowerCase().replace(/บริษัท|บจก\.?|ห้างหุ้นส่วนจำกัด|ห้างหุ้นส่วนสามัญ|หจก\.?|จำกัด|\(?มหาชน\)?|ร้าน|co\.?,?|ltd\.?|limited|company|inc\.?|part\.?/g,'').replace(/[\s.,()\-]/g,'');
const prfDigits=s=>String(s||'').replace(/\D/g,'');
// words in any order: "APL 4K HDMI Cable 5M" is "สาย HDMI 4K APL ยาว 5 เมตร"
const prfTok=s=>new Set(impTxt(s).toLowerCase().replace(/เมตร|\bmeters?\b|\bmetres?\b/g,' m ').replace(/สาย(?=\s*[a-z0-9])|\bcables?\b/g,' cable ').replace(/([\u0E00-\u0E7F]+)/g,' $1 ')
  .replace(/(\d)\s+(m|mm|cm|a|v|w|kw|hp|ports?|ch|tb|gb|mp|inch|sq\.?mm)\b/g,'$1$2').split(/[\s,()\/+\-:;'"·*]+/).filter(t=>t&&!/^(ยาว|ขนาด|รุ่น|model|ea|set)$/.test(t)));
function prfScore(a,b){const x=prfClean(a.desc),y=prfClean(b.desc);if(!x||!y)return 0;if(x.toLowerCase()===y.toLowerCase())return 1;
  const A=prfTok(x),B=prfTok(y),tok=A.size?[...A].filter(t=>B.has(t)).length/Math.max(A.size,B.size*.8):0;
  let s=Math.max(pbSim(pbBig(x),pbBig(y)),tok*.9);// a size in the PR line that the supplier's line lacks is another item (CAT6 1 m is not CAT6 3 m)
  const an=pbNums(x),bn=pbNums(y),miss=[...an].filter(k=>!bn.has(k)).length,extra=[...bn].filter(k=>!an.has(k)).length;s-=miss?.3:0;s-=extra*.03;
  if(a.unit&&b.unit&&prfUnit(a.unit)===prfUnit(b.unit))s+=.05;return Math.max(0,Math.min(1,s))}
const prfUnit=u=>impTxt(u).toLowerCase().replace(/[.\s]/g,'').replace(/^(ea|each|pcs?|pieces?|units?|nos?|อัน|ชิ้น|ตัว|เส้น|เครื่อง|ใบ|ก้อน|ดวง|ลูก|หลอด|แผ่น|ท่อน)$/,'ea')
  .replace(/^(m|mt|meters?|metres?|เมตร|ม)$/,'m').replace(/^(set|sets|kit|ชุด)$/,'set').replace(/^(rolls?|ม้วน)$/,'roll').replace(/^(box|boxes|กล่อง)$/,'box').replace(/^(lot|ls|job|งาน|เหมา)$/,'lot');
// ---- reading the file ----
function prfSheetItems(sheets,nm){const R=sheets[nm],hr=impHeaderRow(R),{two,lab}=impLabels(R,hr),map=impMapFor(R,hr,two,lab),A=impItems(R,hr,two,map);
  // a discount column between ราคาต่อหน่วย and จำนวนเงิน: what the supplier charges is the amount ÷ quantity
  if(map.includes('up')&&map.includes('amt')&&map.includes('q')&&!map.includes('m')&&!map.includes('l')){
    const B=impItems(R,hr,two,map.map(f=>f==='up'?'':f));if(B.length===A.length&&B.every((b,i)=>b.desc===A[i].desc))A.forEach((a,i)=>{const net=B[i].m;if(net>0&&net<a.m-.005)a.m=net})}
  return A}
function prfItems(sheets){const names=Object.keys(sheets),T=names.map(nm=>{let it=[];try{it=prfSheetItems(sheets,nm)}catch(e){}return {it,s:sum(it,r=>r.q*(r.m+r.l))}}).filter(t=>t.it.length);
  if(!T.length)return [];const S=sum(T,t=>t.s),big=T.reduce((b,t)=>t.it.length>b.it.length?t:b,T[0]);
  // a table whose total is the sum of the others is the summary page (as impAll)
  return T.filter(t=>t===big||!(t.s>0&&Math.abs(2*t.s-S)<1)).flatMap(t=>t.it)
    .map(r=>({desc:prfClean(r.desc),unit:impTxt(r.unit)==='งาน'&&!r.q?'':impTxt(r.unit),q:n(r.q),p:Math.round((n(r.m)+n(r.l))*100)/100})).filter(r=>r.desc&&(r.p>0||r.q>0))}
// who sent it, delivery, credit, VAT: from the lines of text around the table
function prfFacts(lines){const L=(lines||[]).map(impTxt).filter(Boolean),F={},own=prfCoKey(CO().name||''),ownTax=prfDigits(CO().tax||'');
  const top=[];for(const l of L){if(/^(เรียน|to\b|ลูกค้า|customer|ผู้ซื้อ|bill to|sold to)/i.test(l)||/^(ลำดับ|รายการ|no\.?|item)\b/i.test(l))break;top.push(l)}
  const taxes=L.join(' ').match(/\d[\d\s-]{11,20}\d/g)||[];F.taxes=[...new Set(taxes.map(prfDigits).filter(t=>t.length===13&&t!==ownTax))];
  // the supplier: a vendor already in the list (by tax id, then by name), else the first company name at the top
  F.vid=(P.vendors.find(v=>prfDigits(v.tax).length===13&&F.taxes.includes(prfDigits(v.tax)))||{}).id||'';
  if(!F.vid){const all=prfCoKey(L.slice(0,60).join(' '));let at=1e9;P.vendors.forEach(v=>{const k=prfCoKey(v.name);if(k.length<3||k===own)return;const i=all.indexOf(k);if(i>=0&&i<at){at=i;F.vid=v.id}})}
  for(const l of top.concat(L.slice(0,25))){const m=l.match(/((?:บริษัท|บจก\.?|ห้างหุ้นส่วน(?:จำกัด|สามัญ)?|หจก\.?|ร้าน)\s*\S.*?(?:จำกัด(?:\s*\(มหาชน\))?|$)|[A-Z][\w&.\- ]+?\bco\.?,?\s*ltd\.?)/i);
    if(m&&prfCoKey(m[1]).length>=3&&(!own||!prfCoKey(m[1]).includes(own))){F.name=m[1].replace(/\s{2,}.*$/,'').trim();break}}
  const tj=top.join('  ');F.tax=F.taxes[0]||'';F.phone=((tj.match(/(?:โทร(?:ศัพท์)?|tel|phone|มือถือ)\.?\s*:?\s*([+\d][\d\s,\-]{7,})/i)||[])[1]||'').replace(/[\s,]+$/,'').trim();
  F.email=(tj.match(/[\w.+-]+@[\w-]+\.[\w.]+/)||[])[0]||'';
  const all=L.join('  ');
  F.credit=+((all.match(/เครดิต\D{0,12}?(\d{1,3})\s*วัน|credit(?:\s*term)?\D{0,8}?(\d{1,3})\s*days?/i)||[]).slice(1).find(Boolean)||0);
  F.days=+((all.match(/(?:กำหนดส่ง(?:ของ|สินค้า|มอบ)?|ส่งของภายใน|ส่งสินค้าภายใน|ระยะเวลาส่ง(?:ของ|มอบ|สินค้า)?|delivery)\D{0,20}?(\d{1,3})\s*(?:วัน|days?)/i)||[])[1]||0);
  F.vat=/รวม\s*(?:ภาษีมูลค่าเพิ่ม|vat)\s*(?:7\s*%\s*)?แล้ว|(?:prices?\s*(?:are\s*)?)incl(?:uding|uded|\.)?\s*vat|vat\s*included/i.test(all);
  return F}
// ---- the dialog ----
ACT.prPdf=b=>{Object.keys(PRF).forEach(k=>delete PRF[k]);Object.assign(PRF,{id:b.dataset.id||''});const pr=P.prs.find(r=>r.id===PRF.id);
  dialog(pr?`ดึงจาก PDF · ${esc(pr.no)}`:'ใบขอซื้อใหม่จาก PDF',`<p class="hint" style="margin-top:0">${pr?'เลือกใบเสนอราคาของผู้ขาย (PDF, Excel หรือ CSV) ระบบจะอ่านราคาต่อหน่วยแล้วใส่ในช่องของผู้ขายรายนั้น โดยจับคู่รายการตามชื่อ ตรวจและแก้คู่ได้ก่อนกดใส่ราคา':'เลือกไฟล์รายการของที่จะซื้อ หรือใบเสนอราคาของผู้ขาย (PDF, Excel หรือ CSV) ระบบจะสร้างใบขอซื้อใหม่จากรายการในไฟล์'} ไฟล์อ่านในเครื่องนี้ ไม่ส่งออกไปไหน</p>
  <div class="row" style="gap:8px;flex-wrap:wrap;align-items:center"><button type="button" class="btn pri" data-a="prfPick">เลือกไฟล์…</button><span class="muted" id="prfName"></span></div>
  <details style="margin-top:8px"><summary>ไฟล์อ่านไม่ได้? วางตารางที่คัดลอกมาแทน (จาก Excel หรือที่ AI อ่านจาก PDF ให้)</summary><textarea id="prfTxt" rows="5" placeholder="รายการ	จำนวน	หน่วย	ราคาต่อหน่วย"></textarea><button type="button" class="btn sm" data-a="prfPaste" style="margin-top:6px">อ่านตาราง</button></details>
  <div id="prfBody"></div>`,`<button type="button" class="btn pri" data-a="prfGo" id="prfGoBtn" disabled>${pr?'ใส่ราคา':'สร้างใบขอซื้อ'}</button>`);dlgWide(true)};
const prfAsk=()=>{const d=$('#dlg details');if(d)d.open=true};
const prfMsg=t=>{const e=$('#prfBody');if(e)e.innerHTML=`<p class="hint" style="color:var(--warn-c)">${t}</p>`};
ACT.prfPick=()=>pickFile(async file=>{const nm=file.name,el=$('#prfName');if(el)el.textContent='กำลังอ่าน '+nm+' …';
  try{let sheets,lines;
    if(/\.pdf$/i.test(nm)||file.type==='application/pdf'){const r=await impReadPdf(file);
      if(r.scan){prfMsg('ไฟล์ PDF นี้เป็นภาพสแกน ไม่มีตัวอักษรให้อ่าน ขอไฟล์ PDF ที่พิมพ์จากโปรแกรม (หรือ Excel) จากผู้ขาย หรือให้ AI (เช่น Claude) อ่านไฟล์ออกมาเป็นตาราง แล้ววางในช่อง <b>วางตารางที่คัดลอกมา</b> ด้านบน');prfAsk();if(el)el.textContent=nm;return}
      if(r.junk){prfMsg('ไฟล์ PDF นี้ใช้ฟอนต์ที่อ่านตัวอักษรออกมาไม่ได้ (มักเป็นไฟล์ที่พิมพ์ผ่าน Adobe PDF / Acrobat Distiller) ขอไฟล์ Excel ต้นฉบับจากผู้ขาย หรือให้ผู้ขายพิมพ์ใหม่ด้วย Microsoft Print to PDF หรือให้ AI (เช่น Claude) อ่านไฟล์ออกมาเป็นตาราง แล้ววางในช่อง <b>วางตารางที่คัดลอกมา</b> ด้านบน');prfAsk();if(el)el.textContent=nm;return}
      sheets=r.sheets;lines=r.lines}
    else if(/\.(csv|txt|tsv)$/i.test(nm))sheets=impReadText(await impDecode(file));else sheets=await impReadSheet(file);
    if(el)el.textContent=nm;prfOpen(sheets,lines,nm,file)}catch(e){prfMsg('อ่านไฟล์ไม่ได้: '+esc(e.message));if(el)el.textContent=nm}});
ACT.prfPaste=()=>{const t=($('#prfTxt')||{}).value||'';if(!t.trim())return;const sh=impReadText(t),R=sh['ตารางที่วาง']||[];
  // a table with no header row (as an AI often writes it): give it one from what the columns hold
  if(R.length&&impHits(R[0])<2){const w=Math.max(...R.map(r=>r.length)),num=c=>R.filter(r=>impIsNum(r[c])).length>R.length/2,txt=c=>R.reduce((a,r)=>a+impTxt(r[c]).length,0);
    const nc=[...Array(w).keys()].filter(num),tc=[...Array(w).keys()].filter(c=>!num(c)),d=tc.reduce((b,c)=>txt(c)>txt(b)?c:b,tc[0]),H=Array(w).fill('');
    if(d!=null)H[d]='รายการ';tc.filter(c=>c!==d).slice(0,1).forEach(c=>H[c]='หน่วย');if(nc.length)H[nc[0]]='จำนวน';if(nc.length>1)H[nc[1]]='ราคาต่อหน่วย';if(nc.length>2)H[nc[2]]='จำนวนเงิน';R.unshift(H)}
  const el=$('#prfName');if(el)el.textContent='ตารางที่วาง';prfOpen(sh,null,'ตารางที่วาง',null)};
function prfOpen(sheets,lines,nm,file){lines=lines||Object.values(sheets).flatMap(R=>R.map(r=>r.map(impTxt).filter(Boolean).join('  ')));
  const rows=prfItems(sheets);if(!rows.length){prfMsg('ไม่พบตารางรายการในไฟล์นี้ (ต้องมีหัวตาราง เช่น รายการ / จำนวน / ราคาต่อหน่วย)');return}
  const E=impExtras(sheets,lines),F=prfFacts(lines),pr=P.prs.find(r=>r.id===PRF.id),S=sum(rows,r=>r.q*r.p);
  Object.assign(PRF,{name:nm,file,rows,E,F,S,vat:F.vat,disc:n(E.disc)>0&&S>0,days:F.days||'',credit:F.credit||'',vid:F.vid||(F.name?'__new':''),vname:F.name||'',match:{},add:{}});
  // the file is a supplier's quotation when it names a supplier or the PR already has lines; a plain list otherwise
  PRF.mode=pr&&pr.items.length||F.vid||F.name?'q':'list';
  if(pr)pr.items.forEach(l=>{let bi=-1,bs=0;rows.forEach((r,i)=>{const s=prfScore(l,r);if(s>bs){bs=s;bi=i}});if(bs>=PRF_OK)PRF.match[l.id]=bi});
  const used=new Set(Object.values(PRF.match));rows.forEach((r,i)=>{PRF.add[i]=!used.has(i)&&!(pr&&pr.items.length&&PRF.mode==='q')});
  prfShow()}
// the price that goes into the comparison: before VAT, after the discount at the foot of the quotation
const prfFactor=()=>(PRF.disc&&PRF.S>0?Math.max(0,1-n(PRF.E.disc)/PRF.S):1)/(PRF.vat?1+(n(P.info.vat)||7)/100:1);
const prfPrice=r=>Math.round(n(r.p)*prfFactor()*100)/100;
// another unit for the same amount (500 M. in the PR, "1 ม้วน" in the quotation): the line's money over the PR's quantity
const prfConv=(l,r)=>!!(l&&r&&l.unit&&r.unit&&prfUnit(l.unit)!==prfUnit(r.unit)&&n(r.q)>0&&n(l.q)>0&&n(r.q)!==n(l.q));
const prfLinePrice=(l,r)=>prfConv(l,r)?Math.round(n(r.p)*n(r.q)/n(l.q)*prfFactor()*100)/100:prfPrice(r);
function prfShow(){const pr=P.prs.find(r=>r.id===PRF.id),R=PRF.rows,F=PRF.F,E=PRF.E,list=PRF.mode==='list',its=pr?pr.items:[];
  const ro=(i,sel)=>`<option value="-1">– ไม่ใส่ราคา –</option>`+R.map((r,k)=>`<option value="${k}"${k===sel?' selected':''}>${esc((r.desc.length>60?r.desc.slice(0,58)+'…':r.desc)+' · '+fmt(r.p,2)+(r.unit?' / '+r.unit:''))}</option>`).join('');
  const vo=[['','– เลือกผู้ขาย –'],...P.vendors.map(v=>[v.id,v.name||'(ไม่มีชื่อ)']),['__new','+ ผู้ขายรายใหม่']];
  const nAdd=R.filter((r,i)=>PRF.add[i]).length,nM=its.filter(l=>PRF.match[l.id]>=0).length,btn=$('#prfGoBtn');
  if(btn){btn.disabled=list?!nAdd:!(PRF.vid&&(PRF.vid!=='__new'||impTxt(PRF.vname))&&(nM||nAdd));btn.textContent=pr?(list?`เพิ่ม ${nAdd} รายการ`:`ใส่ราคา${nM?` ${nM} รายการ`:''}${nAdd?` + เพิ่ม ${nAdd} รายการ`:''}`):`สร้างใบขอซื้อ ${nAdd} รายการ`}
  const tot=E.tot&&E.tot.length?` · ยอดในไฟล์ ${E.tot.slice(0,3).map(v=>fmt(v,2)).join(' / ')}`:'';
  $('#prfBody').innerHTML=`<p class="hint" style="margin:10px 0 6px">อ่านได้ <b>${R.length}</b> รายการ รวม ${fmt(PRF.S,2)} บาท${tot}${E.disc?` · ส่วนลดท้ายใบ ${fmt(E.disc,2)}`:''}</p>
  <div class="form prf-f"><label class="w2">ไฟล์นี้คือ<select data-prf="mode"><option value="q"${list?'':' selected'}>ใบเสนอราคาของผู้ขาย (ราคาเข้าช่องผู้ขาย)</option><option value="list"${list?' selected':''}>รายการของที่จะขอซื้อ (ราคาในไฟล์ = งบ/หน่วย)</option></select></label>
    ${list?'':`<label class="w2">ผู้ขาย<select data-prf="vid">${vo.map(([k,l])=>`<option value="${k}"${k===PRF.vid?' selected':''}>${esc(l)}</option>`).join('')}</select></label>
    ${PRF.vid==='__new'?`<label>ชื่อผู้ขายรายใหม่<input data-prf="vname" value="${esc(PRF.vname)}" placeholder="ชื่อบริษัท / ร้าน"></label>`:''}
    <label>ส่งของภายใน (วัน)<input class="r" data-prf="days" value="${esc(PRF.days)}" style="width:90px"></label><label>เครดิต (วัน)<input class="r" data-prf="credit" value="${esc(PRF.credit)}" style="width:90px"></label>`}</div>
  ${!list&&PRF.vid==='__new'&&(F.tax||F.phone||F.email)?`<p class="hint" style="margin:4px 0">จะเพิ่มในรายชื่อผู้ขายพร้อม${F.tax?` เลขผู้เสียภาษี ${esc(F.tax)}`:''}${F.phone?` โทร ${esc(F.phone)}`:''}${F.email?` ${esc(F.email)}`:''}</p>`:''}
  <div class="row prf-chk"><label><input type="checkbox" data-prf="vat"${PRF.vat?' checked':''}> ราคาในไฟล์รวม VAT แล้ว (ถอด VAT ${n(P.info.vat)||7}% ออก เพื่อเทียบก่อน VAT)</label>
    ${E.disc&&PRF.S>0?`<label><input type="checkbox" data-prf="disc"${PRF.disc?' checked':''}> หักส่วนลดท้ายใบ ${fmt(E.disc,2)} บาท เฉลี่ยเข้าทุกรายการ (${fmt(n(E.disc)/PRF.S*100,2)}%)</label>`:''}</div>
  ${pr&&its.length&&!list?`<h3 class="prf-h">จับคู่กับรายการในใบขอซื้อ <small class="muted">${nM}/${its.length} รายการ · สีเขียว = ชื่อตรงกัน สีเหลือง = ใกล้เคียง ควรตรวจ</small></h3>
  <div class="tw" style="max-height:300px;overflow:auto"><table class="prf-t"><thead><tr><th>รายการในใบขอซื้อ</th><th>หน่วย</th><th class="r">จำนวน</th><th>รายการในไฟล์</th><th class="r">ราคา/หน่วย</th></tr></thead><tbody>
  ${its.map(l=>{const k=PRF.match[l.id]??-1,r=R[k],s=r?prfScore(l,r):0,uw=r&&r.unit&&l.unit&&prfUnit(r.unit)!==prfUnit(l.unit),cv=prfConv(l,r);
    return `<tr class="${r?s>=PRF_SURE?'prf-ok':'prf-near':''}"><td>${esc(l.desc)}</td><td>${esc(l.unit)}</td><td class="r">${fmtq(l.q)}</td><td><select data-prfm="${l.id}" aria-label="รายการในไฟล์">${ro(l,k)}</select>${cv?`<div class="prf-w">⚠ หน่วยต่างกัน: ในไฟล์ ${fmtq(r.q)} ${esc(r.unit)} × ${fmt(prfPrice(r),2)} ÷ ${fmtq(l.q)} ${esc(l.unit)} = ราคาต่อ ${esc(l.unit)}</div>`:uw?`<div class="prf-w">⚠ หน่วยในไฟล์คือ “${esc(r.unit)}” ตรวจว่าเป็นราคาต่อ ${esc(l.unit)} หรือไม่</div>`:''}</td><td class="r">${r?fmt(prfLinePrice(l,r),2):'–'}</td></tr>`}).join('')}</tbody></table></div>`:''}
  <h3 class="prf-h">${pr&&its.length&&!list?'รายการในไฟล์ที่ไม่มีในใบขอซื้อ':'รายการในไฟล์'} <small class="muted">ติ๊กรายการที่จะเพิ่มเข้าใบขอซื้อ${list?' ราคาในไฟล์จะเป็นงบ/หน่วย':''}</small></h3>
  <div class="tw" style="max-height:260px;overflow:auto"><table class="prf-t"><thead><tr><th><input type="checkbox" data-prf="all" aria-label="เลือกทั้งหมด"${R.every((r,i)=>PRF.add[i]||(!list&&Object.values(PRF.match).includes(i)))?' checked':''}></th><th>รายการ</th><th>หน่วย</th><th class="r">จำนวน</th><th class="r">ราคา/หน่วย</th></tr></thead><tbody>
  ${R.map((r,i)=>!list&&pr&&its.length&&Object.values(PRF.match).includes(i)?'':`<tr><td><input type="checkbox" data-prfa="${i}"${PRF.add[i]?' checked':''} aria-label="เพิ่ม"></td><td>${esc(r.desc)}</td><td>${esc(r.unit)}</td><td class="r">${fmtq(r.q)}</td><td class="r">${fmt(prfPrice(r),2)}</td></tr>`).join('')||'<tr><td colspan="5" class="empty">ทุกรายการในไฟล์จับคู่กับใบขอซื้อแล้ว</td></tr>'}</tbody></table></div>`}
document.addEventListener('change',e=>{const t=e.target;if(!t||!t.closest||!t.closest('#dlg')||!$('#prfBody')||!PRF.rows)return;
  if(t.dataset.prfm!=null){PRF.match[t.dataset.prfm]=+t.value;prfShow();return}
  if(t.dataset.prfa!=null){PRF.add[+t.dataset.prfa]=t.checked;prfShow();return}
  const f=t.dataset.prf;if(!f)return;
  if(f==='vat'||f==='disc')PRF[f]=t.checked;
  else if(f==='all'){const pr=P.prs.find(r=>r.id===PRF.id),used=new Set(PRF.mode==='q'&&pr&&pr.items.length?Object.values(PRF.match):[]);PRF.rows.forEach((r,i)=>{if(!used.has(i))PRF.add[i]=t.checked})}
  else if(f==='mode'){PRF.mode=t.value;const pr=P.prs.find(r=>r.id===PRF.id),used=new Set(Object.values(PRF.match));PRF.rows.forEach((r,i)=>{PRF.add[i]=t.value==='list'?!(pr&&pr.items.length&&used.has(i)):!used.has(i)&&!(pr&&pr.items.length)})}
  else PRF[f]=t.value;
  if(f!=='vname'&&f!=='days'&&f!=='credit')prfShow();else{const b=$('#prfGoBtn');if(b&&f==='vname')b.disabled=!impTxt(t.value)}});
ACT.prfGo=()=>{if(!PRF.rows)return;let pr=P.prs.find(r=>r.id===PRF.id);const list=PRF.mode==='list',R=PRF.rows,add=R.map((r,i)=>i).filter(i=>PRF.add[i]);
  if(!pr){pr=Object.assign({id:uid()},NEW.prs(P.prs));pr.note=(list?'จากไฟล์ ':'จากใบเสนอราคา ')+PRF.name;P.prs.push(pr);S.sel.pr=pr.id}
  const lines=add.map(i=>{const r=R[i],l={id:uid(),desc:r.desc,unit:r.unit,q:n(r.q)||1,bud:list?prfPrice(r):0,p:0};pr.items.push(l);return [l,r]});
  let q=null,vname='';
  if(!list){let vid=PRF.vid;
    if(vid==='__new'){const F=PRF.F,v=Object.assign({id:uid()},NEW.vendors(),{name:impTxt(PRF.vname),tax:F.tax||'',phone:F.phone||'',email:F.email||''});if(n(PRF.credit))v.credit=n(PRF.credit);P.vendors.push(v);vid=v.id}
    q=pr.qs.find(x=>x.vid===vid)||pr.qs.find(x=>!x.vid&&!Object.values(x.p||{}).some(v=>n(v)>0));
    if(!q){q={id:uid(),vid,p:{},days:7,credit:30,note:''};pr.qs.push(q)}q.vid=vid;q.p=q.p||{};vname=vName(vid);
    pr.items.forEach(l=>{const k=PRF.match[l.id];if(k>=0&&R[k])q.p[l.id]=prfLinePrice(l,R[k])});lines.forEach(([l,r])=>{q.p[l.id]=prfPrice(r)});
    if(n(PRF.days))q.days=n(PRF.days);if(n(PRF.credit))q.credit=n(PRF.credit);q.src={name:PRF.name,date:today()};prfKeep(pr.id,q.id,PRF.file)}
  const nP=q?Object.keys(q.p).filter(k=>pr.items.some(l=>l.id===k)&&n(q.p[k])>0).length:0;
  S.sub.buy='pr';S.sel.pr=pr.id;dlgWide(false);$('#dlg').close();save();render();
  toast(list?`เพิ่ม ${lines.length} รายการใน ${pr.no} แล้ว`:`ใส่ราคาของ ${vname} ${nP} รายการใน ${pr.no} แล้ว${lines.length?` (เพิ่มรายการใหม่ ${lines.length})`:''}`)};
// the supplier's file is kept with its column, to open again when checking or when the PO is questioned
function prfKeep(prId,qId,file){if(!file||file.size>25e6||typeof IDB!=='object')return;const fr=new FileReader();fr.onload=async()=>{const k='src:'+uid();try{await IDB.put(k,fr.result)}catch(e){return}
  const pr=P.prs.find(r=>r.id===prId),q=pr&&pr.qs.find(x=>x.id===qId);if(!q){IDB.del(k).catch(()=>{});return}if(q.srcFile&&q.srcFile.k)IDB.del(q.srcFile.k).catch(()=>{});
  q.srcFile={k,name:file.name,size:file.size,type:file.type||'',date:today()};save();render()};fr.readAsDataURL(file)}
ACT.prfSrc=async b=>{const pr=P.prs.find(r=>r.id===b.dataset.id),q=pr&&pr.qs.find(x=>x.id===b.dataset.q),s=q&&q.srcFile;if(!s)return;const v=await IDB.get(s.k);
  if(!v){toast('ไม่พบไฟล์ในเครื่องนี้ (เก็บไว้ในเครื่องที่ดึงข้อมูล)');return}const a=document.createElement('a');a.href=v;a.download=s.name;document.body.appendChild(a);a.click();a.remove()};
// the buttons: "ดึงจาก PDF" beside print in the comparison, "+ ใบขอซื้อจาก PDF" beside "+ ใบขอซื้อเปล่า", the file under each supplier
{const f=buyPR;buyPR=function(){let h=f.apply(this,arguments);const sel=P.prs.find(r=>r.id===S.sel.pr)||P.prs[P.prs.length-1];
  h=h.replace('<button type="button" class="btn sm" data-a="add" data-c="prs" data-sel="pr">','<button type="button" class="btn sm" data-a="prPdf" data-id="">+ ใบขอซื้อจาก PDF</button> $&');
  if(!sel)return h;
  h=h.replace(`<button type="button" class="btn sm" data-a="print" data-k="pr" data-id="${sel.id}">`,`<button type="button" class="btn sm pri" data-a="prPdf" data-id="${sel.id}" title="อ่านใบเสนอราคาของผู้ขาย (PDF / Excel) แล้วใส่ราคาต่อหน่วยให้อัตโนมัติ">ดึงจาก PDF</button> $&`);
  sel.qs.forEach(q=>{if(!q.srcFile&&!q.src)return;const s=q.srcFile||q.src;
    h=h.replace(new RegExp(`(<select data-p="prs\\.${sel.id}\\.qs\\.${q.id}\\.vid"[\\s\\S]*?</select>)`),`$1<div class="prf-src">${q.srcFile?`<button type="button" class="btn ghost sm" data-a="prfSrc" data-id="${sel.id}" data-q="${q.id}" title="เปิดไฟล์ใบเสนอราคา">📄 ${esc(s.name.length>22?s.name.slice(0,20)+'…':s.name)}</button>`:`<small class="muted">📄 ${esc(s.name)}</small>`}</div>`)});
  return h}}
document.head.insertAdjacentHTML('beforeend',`<style>
.prf-f{margin:4px 0 6px}.prf-chk{gap:6px 18px;flex-wrap:wrap;margin:4px 0 8px}.prf-chk label{display:flex;gap:6px;align-items:center;font-size:13.5px}
.prf-h{font-size:15px;margin:12px 0 6px}.prf-t{font-size:13.5px}.prf-t select{max-width:100%;min-width:260px}.prf-t td{vertical-align:middle}
.prf-t tr.prf-ok td:nth-child(4){box-shadow:inset 3px 0 0 #1a9a5a}.prf-t tr.prf-near td:nth-child(4){box-shadow:inset 3px 0 0 #e0a100}
.prf-w{font-size:12px;color:var(--warn-c);margin-top:3px}.prf-src{margin-top:4px}.prf-src .btn{font-size:12px;padding:2px 8px;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
</style>`);
if(typeof I18N==='object'&&I18N.en&&I18N.en.x)Object.assign(I18N.en.x,{'ดึงจาก PDF':'Read from PDF','+ ใบขอซื้อจาก PDF':'+ PR from PDF','ใบขอซื้อใหม่จาก PDF':'New PR from PDF',
  'เลือกไฟล์…':'Choose file…','ใส่ราคา':'Fill prices','ไฟล์นี้คือ':'This file is','ใบเสนอราคาของผู้ขาย (ราคาเข้าช่องผู้ขาย)':"A supplier's quotation (prices go in the supplier's column)",
  'รายการของที่จะขอซื้อ (ราคาในไฟล์ = งบ/หน่วย)':'A list of things to buy (prices = budget per unit)','ผู้ขาย':'Supplier','+ ผู้ขายรายใหม่':'+ New supplier','ชื่อผู้ขายรายใหม่':'New supplier name',
  'ส่งของภายใน (วัน)':'Delivery (days)','เครดิต (วัน)':'Credit (days)','– ไม่ใส่ราคา –':'– no price –','รายการในใบขอซื้อ':'PR line','รายการในไฟล์':'Line in the file',
  'รายการในไฟล์ที่ไม่มีในใบขอซื้อ':'Lines in the file that the PR does not have','ราคา/หน่วย':'Price/unit','หน่วย':'Unit','จำนวน':'Qty','ทุกรายการในไฟล์จับคู่กับใบขอซื้อแล้ว':'Every line in the file is matched to the PR'});
