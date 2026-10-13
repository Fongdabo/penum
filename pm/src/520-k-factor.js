/* ---------- ค่า K: price adjustment for each billing ----------
   K = a + Σ b × (index at delivery ÷ index at bid opening). The contract pays (or deducts) only the part beyond 4%:
   K > 1.04 → + value × (K − 1.04), K < 0.96 → − value × (0.96 − K). K is cut to 3 decimals. */
const KIX=[['I','ดัชนีราคาผู้บริโภคทั่วไป'],['C','ดัชนีราคาซีเมนต์'],['M','ดัชนีราคาวัสดุก่อสร้าง (ไม่รวมเหล็กและซีเมนต์)'],['S','ดัชนีราคาเหล็ก'],['E','ดัชนีราคาเครื่องจักรกลและบริภัณฑ์'],['F','ดัชนีราคาน้ำมันดีเซล']];
const KF={bld:{n:'งานอาคาร',a:.25,b:{I:.15,C:.10,M:.40,S:.10}},own:{n:'ตามสูตรในสัญญา (กรอกเอง)',a:.25,b:{I:.15,C:0,M:.40,S:.10,E:.10,F:0}}};
const kTender=p=>{const C=CO();return (C.tenders||[]).find(t=>t.quote&&(C.quotes.find(q=>q.id===t.quote)||{}).pj===p.id)};
const kCfg=p=>{p.kv=p.kv||{f:'bld',open:(okD((kTender(p)||{}).open)?kTender(p).open:p.info.signed||p.info.start||today()).slice(0,7),a:KF.own.a,b:Object.assign({},KF.own.b),mon:{}};return p.kv};
const kCo=kv=>kv.f==='own'?{a:n(kv.a),b:kv.b}:KF[kv.f]||KF.bld;
const kIdx=m=>tdCfg().kidx.find(x=>x.m===m);
function kOf(kv,m){const o=kIdx(kv.open),t=kIdx(m),F=kCo(kv);if(!o||!t)return null;let K=F.a;
  for(const [c,w] of Object.entries(F.b)){if(!n(w))continue;if(!n(o[c])||!n(t[c]))return null;K+=n(w)*n(t[c])/n(o[c])}return Math.floor(K*1000+1e-9)/1000}
const kAdj=(K,amt)=>K==null?0:K>1.04?amt*(K-1.04):K<.96?-amt*(.96-K):0;
function kRows(p){const kv=kCfg(p);return withP(p,()=>billsSorted().filter(b=>(b.kind||'prog')==='prog').map(b=>{const m=kv.mon[b.id]||(b.date||'').slice(0,7),amt=billCalc(b).amt,K=kOf(kv,m);return {b,m,amt,K,adj:kAdj(K,amt)}}))}
ACT.kMonths=b=>{const p=DB.projects[b.dataset.p];if(!p)return;const kv=kCfg(p),C=tdCfg(),need=[kv.open,...kRows(p).map(r=>r.m)].filter(m=>/^\d{4}-\d{2}$/.test(m));let k=0;
  need.forEach(m=>{if(!kIdx(m)){C.kidx.push({id:uid(),m,I:0,C:0,M:0,S:0,E:0,F:0});k++}});C.kidx.sort((a,b)=>String(a.m).localeCompare(String(b.m)));save();render();toast(k?`เพิ่ม ${k} เดือน กรอกดัชนีจากสำนักงานนโยบายและยุทธศาสตร์การค้า`:'มีครบทุกเดือนแล้ว')};
function kView(){const C=tdCfg(),L=projects(),p=DB.projects[S.sel.kvp]||L.find(x=>x.kv)||L[0];
  if(!p)return '<section class="card"><p class="hint">ยังไม่มีโครงการ</p></section>';S.sel.kvp=p.id;const kv=kCfg(p),F=kCo(kv),R=kRows(p),b=`projects.${p.id}.kv`;
  const used=Object.keys(F.b).filter(c=>n(F.b[c])),fx=`K = ${fmt(F.a,2)}${used.map(c=>` + ${fmt(F.b[c],2)} ${c}t/${c}o`).join('')}`,tw=n(F.a)+sum(used,c=>n(F.b[c]));
  const miss=R.filter(r=>r.K==null).length;
  return `<section class="card"><h2><span>ค่า K ของโครงการ</span><small>เงินเพิ่มหรือลดค่างานตามดัชนีราคา สำหรับสัญญาที่มีเงื่อนไขปรับราคา</small><span class="sp"></span><button type="button" class="btn sm" data-a="print" data-k="kval" data-id="${p.id}">พิมพ์การคำนวณค่า K</button></h2>
  <div class="form"><label>โครงการ<select id="kvP">${L.map(x=>`<option value="${x.id}"${x.id===p.id?' selected':''}>${esc(x.name)}</option>`).join('')}</select></label>
    <label>สูตร<select data-p="${b}.f">${Object.entries(KF).map(([k,v])=>`<option value="${k}"${k===kv.f?' selected':''}>${v.n}</option>`).join('')}</select></label>
    <label>เดือนที่เปิดซอง (Io)<input type="month" data-p="${b}.open" value="${esc(kv.open||'')}"></label>
    ${kv.f==='own'?`<label>ค่าคงที่ a<input data-t="num" inputmode="decimal" data-p="${b}.a" value="${n(kv.a)}"></label>${KIX.map(([c,l])=>`<label title="${l}">น้ำหนัก ${c}<input data-t="num" inputmode="decimal" data-p="${b}.b.${c}" value="${n(kv.b[c])}"></label>`).join('')}`:''}</div>
  <p style="margin:10px 0 4px"><b>${fx}</b> ${Math.abs(tw-1)>.001?`<span class="pill bad">ผลรวมสัมประสิทธิ์ ${fmt(tw,2)} ต้องเท่ากับ 1</span>`:''}</p>
  <p class="hint">t = เดือนที่ส่งงานงวดนั้น o = เดือนที่เปิดซอง · จ่ายเพิ่มหรือเรียกคืนเฉพาะส่วนที่เกิน 4% · ถ้าส่งงานช้ากว่าสัญญา ให้ใช้ดัชนีเดือนตามสัญญาหรือเดือนที่ส่งจริง แล้วแต่ค่า K ตัวไหนต่ำกว่า</p>
  ${R.length?`<div class="tw"><table><thead><tr><th>งวด</th><th>เดือนส่งงาน</th><th class="r">ค่างาน</th>${used.map(c=>`<th class="r">${c}t/${c}o</th>`).join('')}<th class="r">K</th><th class="r">เงินเพิ่ม (ลด)</th></tr></thead><tbody>
  ${R.map(r=>{const o=kIdx(kv.open),t=kIdx(r.m);return `<tr><td>${esc(r.b.no||'')}</td><td style="width:150px"><input type="month" data-p="${b}.mon.${r.b.id}" value="${esc(r.m)}" aria-label="เดือนส่งงาน"></td><td class="r">${fmt(r.amt,2)}</td>
    ${used.map(c=>`<td class="r">${o&&t&&n(o[c])&&n(t[c])?fmt(n(t[c])/n(o[c]),4):'<span class="muted">–</span>'}</td>`).join('')}<td class="r"><b>${r.K==null?'<span class="muted">ขาดดัชนี</span>':fmt(r.K,3)}</b></td><td class="r" style="color:${r.adj>0?'var(--good)':r.adj<0?'var(--danger)':''}">${r.K==null?'':fmt(r.adj,2)}</td></tr>`}).join('')}
  <tr class="grp"><td colspan="2">รวม</td><td class="r">${fmt(sum(R,r=>r.amt),2)}</td>${used.map(()=>'<td></td>').join('')}<td></td><td class="r">${fmt(sum(R,r=>r.adj),2)}</td></tr></tbody></table></div>`:'<p class="hint">โครงการนี้ยังไม่มีใบแจ้งหนี้งวดงาน เพิ่มที่หน้า “งบและเบิกงวด” ของโครงการ</p>'}
  ${miss?`<p class="hint">${miss} งวดยังขาดดัชนี <button type="button" class="btn sm" data-a="kMonths" data-p="${p.id}">เพิ่มเดือนที่ต้องใช้ในตารางดัชนี</button></p>`:''}</section>
  <section class="card"><h2><span>ตารางดัชนีราคารายเดือน</span><small>ใช้ร่วมกันทุกโครงการ · ดัชนีจากสำนักงานนโยบายและยุทธศาสตร์การค้า กระทรวงพาณิชย์</small></h2>
  ${gtable('co.kidx',C.kidx,[{k:'m',h:'เดือน (ปปปป-ดด)',w:90},{h:'',t:'calc',f:x=>thYM(x.m)},...KIX.map(([c,l])=>({k:c,h:`<span title="${l}">${c}</span>`,t:'num',w:80}))],{empty:'ยังไม่มีดัชนี'})}
  <div class="row" style="margin-top:8px"><button type="button" class="btn sm" data-a="add" data-c="co.kidx">+ เพิ่มเดือน</button><span class="hint" style="margin:0">${KIX.map(([c,l])=>`${c} = ${l}`).join(' · ')}</span></div></section>`}
PRINT.kval=id=>{const p=DB.projects[id];if(!p)return '';const kv=kCfg(p),F=kCo(kv),R=kRows(p),used=Object.keys(F.b).filter(c=>n(F.b[c])),o=kIdx(kv.open)||{};
  return cphead('การคำนวณค่า K',`โครงการ ${esc(p.name)}`)+`<p>สัญญาเลขที่ ${esc(p.info.contractNo||'....................')} · ผู้ว่าจ้าง ${esc(p.info.client||'')} · สูตร${esc(F.n||'ตามสัญญา')}: <b>K = ${fmt(F.a,2)}${used.map(c=>` + ${fmt(F.b[c],2)} ${c}t/${c}o`).join('')}</b></p>
  <p>ดัชนีเดือนเปิดซอง ${thYM(kv.open)}: ${used.map(c=>`${c}o = ${fmtq(o[c])}`).join(' · ')}</p>
  <table><thead><tr><th>งวด</th><th>เดือนส่งงาน</th>${used.map(c=>`<th>${c}t</th>`).join('')}<th>K</th><th>ค่างาน (บาท)</th><th>เงินเพิ่ม (ลด) (บาท)</th></tr></thead><tbody>
  ${R.map(r=>{const t=kIdx(r.m)||{};return `<tr><td>${esc(r.b.no||'')}</td><td>${thYM(r.m)}</td>${used.map(c=>`<td style="text-align:right">${fmtq(t[c])}</td>`).join('')}<td style="text-align:right">${r.K==null?'–':fmt(r.K,3)}</td><td style="text-align:right">${fmt(r.amt,2)}</td><td style="text-align:right">${fmt(r.adj,2)}</td></tr>`}).join('')}
  <tr><td colspan="${used.length+3}" style="text-align:right"><b>รวม</b></td><td style="text-align:right"><b>${fmt(sum(R,r=>r.amt),2)}</b></td><td style="text-align:right"><b>${fmt(sum(R,r=>r.adj),2)}</b></td></tr></tbody></table>
  <p style="font-size:12px">คิดเงินเพิ่มหรือลดเฉพาะส่วนที่ K เกิน 1.04 หรือต่ำกว่า 0.96 · ค่า K ใช้ทศนิยม 3 ตำแหน่งไม่ปัดเศษ</p>`+signs(['ผู้คำนวณ (บริษัท)','ผู้ตรวจสอบ','คณะกรรมการตรวจรับ'])};
document.head.insertAdjacentHTML('beforeend',`<style>
@media print{#print table.pr4{font-size:10px}#print table.pr4 th{font-size:10px}#print table.pr4 tr.st td{background:#F2F6F6}#print table.kv td{border:none;padding:1px 4px}}
</style>`);

// demo: one government bid priced from the demo BOQ and one private bid, plus a few months of indices
{const f=ACT.loadDemo;ACT.loadDemo=b=>{const r=f(b);const C=tdCfg();if(!C.tenders.length){
  const t=Object.assign({id:uid()},NEW.tenders(C.tenders),{title:'งานระบบปรับอากาศ อาคารเรียน 4 ชั้น',owner:'มหาวิทยาลัยตัวอย่าง',site:'อ.เมือง จ.นครปฐม',drw:'ปอ.01-ปอ.24',budget:0,months:8,open:addD(today(),10),by:'ฝ่ายประมาณราคา',status:'draft'});
  tdFill(t,DEMO.items.map(([g,head,type,desc,unit,q,m,l,tt])=>({g,head,type,desc,unit,q,m,l,t:tt})),'ตัวอย่าง');C.tenders.push(t);S.sel.td=t.id;ACT.tdPre({quiet:1,dataset:{id:t.id}});t.budget=Math.round(tdCalc(t).raw*1.06/1e5)*1e5;
  const t2=Object.assign({id:uid()},NEW.tenders(C.tenders),{title:'ปรับปรุงระบบไฟฟ้าโรงงาน',owner:'บริษัทลูกค้าตัวอย่าง',mode:'pvt',months:3,date:addD(today(),-60),open:addD(today(),-45),status:'lost',winner:'คู่แข่ง ก'});
  tdFill(t2,DEMO.items.filter(x=>x[0]==='el').map(([g,head,type,desc,unit,q,m,l,tt])=>({g,head,type,desc,unit,q,m,l,t:tt})),'ตัวอย่าง');C.tenders.push(t2);t2.winPrice=Math.round(tdCalc(t2).gross*.94/1000)*1000;
  const base=today().slice(0,7);if(!C.kidx.length)for(let k=-6;k<=0;k++){const j=k+6,r=v=>Math.round(v*10)/10;C.kidx.push({id:uid(),m:ymAdd(base,k),I:r(108.2+j*.3),C:r(112.4+j*.8),M:r(118.7+j*2.1),S:r(131.5+j*3.6),E:r(105.1+j*.4),F:r(121+j*1.5)})}
  save();render()}return r}}

