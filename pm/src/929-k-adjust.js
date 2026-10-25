/* ---------- 4.43: ค่า K round 2: more formulas, 3 decimals at every step, late delivery, and the letter to the agency ----------
   - KF gains formulas beyond งานอาคาร (road surface coats, pipe laying, GIP); others of the 35 go in "ตามสูตรในสัญญา".
   - Every ratio It/Io and every b × ratio is cut to 3 decimals, then K is cut to 3 decimals (no rounding), as the rule says.
   - kv.due[bill id]: the month the งวด was due by the contract. Delivered after it, K is the lower of the two months' K.
   - PRINT.kval shows each งวด worked out; PRINT.klet is the letter asking for the money (K > 1.04) or agreeing to the
     deduction (K < 0.96), for one งวด ("<project id>~<bill id>") or every งวด with an adjustment ("<project id>~all"). */
KIX.push(['A','ดัชนีราคาแอสฟัลต์'],['AC','ดัชนีราคาท่อซีเมนต์ใยหิน'],['PVC','ดัชนีราคาท่อ PVC'],['GIP','ดัชนีราคาท่อเหล็กอาบสังกะสี']);
KNAME.unshift(['GIP',/อาบสังกะสี|^gip$/i],['AC',/ใยหิน|^ac$/i],['PVC',/pvc/i],['A',/แอสฟัลต์|asphalt|^a$/i]);
{const o=KF.own;delete KF.own;KF.bld.n='งานอาคาร';Object.assign(KF,{
  road1:{n:'งานผิวทาง Prime / Tack / Seal coat',a:.30,b:{A:.40,E:.20,F:.10}},
  pipe1:{n:'งานวางท่อ AC / PVC (ผู้ว่าจ้างจัดหาท่อ)',a:.50,b:{I:.25,M:.25}},
  pipe2:{n:'งานวางท่อ AC (ผู้รับจ้างจัดหาท่อ)',a:.40,b:{I:.10,M:.10,AC:.40}},
  pipe3:{n:'งานวางท่อ PVC (ผู้รับจ้างจัดหาท่อ)',a:.40,b:{I:.10,M:.10,PVC:.40}},
  pipe4:{n:'งานวางท่อ PVC หุ้มคอนกรีต',a:.30,b:{I:.10,C:.20,M:.05,S:.05,PVC:.30}},
  gip:{n:'งานวางท่อเหล็กอาบสังกะสี (GIP)',a:.25,b:{I:.25,GIP:.50}}});KF.own=o;Object.assign(o.b,{A:0,AC:0,PVC:0,GIP:0})}
const k3=v=>Math.floor(v*1000+1e-9)/1000;
// K worked out: each term with its ratio and product, both cut to 3 decimals
function kDet(kv,m){const o=kIdx(kv.open),t=kIdx(m),F=kCo(kv);if(!o||!t)return null;const T=[];
  for(const [c,w] of Object.entries(F.b)){if(!n(w))continue;if(!n(o[c])||!n(t[c]))return null;const r=k3(n(t[c])/n(o[c]));T.push({c,w:n(w),o:n(o[c]),t:n(t[c]),r,v:k3(n(w)*r)})}
  return {a:n(F.a),T,K:k3(n(F.a)+sum(T,x=>x.v))}}
kOf=(kv,m)=>{const d=kDet(kv,m);return d?d.K:null};
kRows=function(p){const kv=kCfg(p);kv.due=kv.due||{};return withP(p,()=>billsSorted().filter(b=>(b.kind||'prog')==='prog').map(b=>{
  const m=kv.mon[b.id]||(b.date||'').slice(0,7),d=kv.due[b.id]||'',amt=billCalc(b).amt,Ka=kOf(kv,m),late=!!d&&/^\d{4}-\d{2}$/.test(m)&&m>d,Kd=late?kOf(kv,d):null;
  const K=late?(Ka==null||Kd==null?null:Math.min(Ka,Kd)):Ka,use=late&&Kd!=null&&Ka!=null&&Kd<Ka?d:m;return {b,m,d,late,Ka,Kd,use,amt,K,adj:kAdj(K,amt)}}))};
// months the late rows need too
{const f=ACT.kMonths;ACT.kMonths=b=>{const p=DB.projects[b.dataset.p];if(p){const C=tdCfg();kRows(p).filter(r=>r.late&&!kIdx(r.d)).forEach(r=>{if(!kIdx(r.d))C.kidx.push({id:uid(),m:r.d,I:0,C:0,M:0,S:0,E:0,F:0})})}f(b)}}
function kLetCard(p,R){const kv=kCfg(p),b=`projects.${p.id}.kv`,L=R.filter(r=>r.K!=null&&r.adj);
  return `<section class="card"><h2><span>หนังสือขอรับเงิน / แจ้งหักเงินค่า K</span><small>ส่งหน่วยงานพร้อมตารางคำนวณค่า K และสำเนาดัชนีราคา</small><span class="sp"></span>
    ${L.length?`<button type="button" class="btn sm pri" data-a="print" data-k="klet" data-id="${p.id}~all">หนังสือรวม ${L.length} งวด</button>`:''}</h2>
  <div class="form"><label>เลขที่หนังสือ<input data-p="${b}.letNo" value="${esc(kv.letNo||'')}" placeholder="เช่น ORN 015/2569"></label><label class="w2">เรียน<input data-p="${b}.to" value="${esc(kv.to||'')}" placeholder="เช่น อธิการบดีมหาวิทยาลัย... (ว่าง = หัวหน้าหน่วยงานผู้ว่าจ้าง)"></label>
    <label>วันที่สัญญา<input type="date" data-p="${b}.cdate" value="${esc(kv.cdate||p.info.signed||'')}"></label></div>
  ${L.length?`<div class="tw"><table><thead><tr><th>งวด</th><th class="r">K</th><th class="r">เงินเพิ่ม (ลด)</th><th></th></tr></thead><tbody>${L.map(r=>`<tr><td>${esc(r.b.no||'')}</td><td class="r">${fmt(r.K,3)}</td><td class="r" style="color:${r.adj>0?'var(--good)':'var(--danger)'}">${fmt(r.adj,2)}</td>
    <td><button type="button" class="btn sm" data-a="print" data-k="klet" data-id="${p.id}~${r.b.id}">${r.adj>0?'หนังสือขอรับเงิน':'หนังสือยินยอมให้หักเงิน'}</button></td></tr>`).join('')}</tbody></table></div>`
  :'<p class="hint">ยังไม่มีงวดที่ K เกิน 1.04 หรือต่ำกว่า 0.96</p>'}
  <p class="hint">ยื่นขอรับเงินเพิ่มภายใน 90 วัน นับแต่วันที่ผู้ว่าจ้างจ่ายเงินงวดสุดท้าย ถ้าเกินกำหนดจะหมดสิทธิ์ · กรณี K ต่ำกว่า 0.96 ผู้ว่าจ้างหักเงินจากค่างาน</p></section>`}
{const f=kView;kView=function(){let h=f();const C=tdCfg(),L=projects(),p=DB.projects[S.sel.kvp];if(!p||!p.kv)return h;const R=kRows(p),pb=`projects.${p.id}.kv`;
  h=h.replace('<th>เดือนส่งงาน</th>','<th>เดือนส่งงาน</th><th title="กรอกถ้าส่งงานช้ากว่ากำหนด">ครบกำหนดตามสัญญา</th>')
   .replace(/(<input type="month" data-p="projects\.[^"]+\.kv\.mon\.([^"]+)" value="[^"]*" aria-label="เดือนส่งงาน"><\/td>)/g,(s0,s1,id)=>{const r=R.find(x=>x.b.id===id)||{};
     return s1+`<td style="width:150px"><input type="month" data-p="${pb}.due.${id}" value="${esc(r.d||'')}" aria-label="ครบกำหนดตามสัญญา">${r.late?`<small class="muted">ส่งช้า · ใช้ K เดือน ${thYM(r.use)}</small>`:''}</td>`})
   .replace('<tr class="grp"><td colspan="2">รวม','<tr class="grp"><td colspan="3">รวม')
   .replace('ถ้าส่งงานช้ากว่าสัญญา ให้ใช้ดัชนีเดือนตามสัญญาหรือเดือนที่ส่งจริง แล้วแต่ค่า K ตัวไหนต่ำกว่า','ส่งงานช้ากว่าสัญญา กรอกเดือนครบกำหนดตามสัญญา โปรแกรมใช้ค่า K ของเดือนที่ต่ำกว่าให้ · ทุกอัตราส่วน ทุกผลคูณ และค่า K ใช้ทศนิยม 3 ตำแหน่ง ตัดทิ้งไม่ปัดเศษ');
  if(!kTender(p))h=h.replace('<label>เดือนที่เปิดซอง (Io)','<label title="ใช้เดือนที่เปิดซองประกวดราคา / ยื่นข้อเสนอ ไม่ใช่เดือนเซ็นสัญญา">เดือนที่เปิดซอง (Io) ⚠ ตรวจให้ตรงวันเปิดซอง');
  h=h.replace('<p style="margin:10px 0 4px">','<p class="hint" style="margin:8px 0 0">สูตรอื่นตามมติคณะรัฐมนตรี (รวม 35 สูตร) เลือก “ตามสูตรในสัญญา” แล้วกรอกค่าคงที่และน้ำหนักตามสัญญา</p><p style="margin:10px 0 4px">');
  const k=h.indexOf('<section class="card"><h2><span>ตารางดัชนีราคารายเดือน');return k<0?h+kLetCard(p,R):h.slice(0,k)+kLetCard(p,R)+h.slice(k)}}

// --- prints ---
const kFx=F=>`K = ${fmt(F.a,2)}${Object.keys(F.b).filter(c=>n(F.b[c])).map(c=>` + ${fmt(F.b[c],2)} (${c}t/${c}o)`).join('')}`;
const kWork=(kv,r)=>{const d=kDet(kv,r.use||r.m);if(!d)return '<span>ขาดดัชนี</span>';
  return `K = ${fmt(d.a,2)}${d.T.map(x=>` + ${fmt(x.w,2)}(${fmtq(x.t)}/${fmtq(x.o)})`).join('')}<br>&nbsp;&nbsp;&nbsp;= ${fmt(d.a,2)}${d.T.map(x=>` + ${fmt(x.w,2)}(${fmt(x.r,3)})`).join('')}<br>&nbsp;&nbsp;&nbsp;= ${fmt(d.a,2)}${d.T.map(x=>` + ${fmt(x.v,3)}`).join('')} = <b>${fmt(d.K,3)}</b>`};
PRINT.kval=id=>{const p=DB.projects[id];if(!p)return '';const kv=kCfg(p),F=kCo(kv),R=kRows(p),used=Object.keys(F.b).filter(c=>n(F.b[c])),o=kIdx(kv.open)||{},th='style="text-align:right"';
  return cphead('การคำนวณค่า K',`โครงการ ${esc(p.name)}`)+`<p>สัญญาเลขที่ ${esc(p.info.contractNo||'....................')} · ผู้ว่าจ้าง ${esc(p.info.client||'')} · สูตร${esc(F.n||'ตามสัญญา')}: <b>${kFx(F)}</b></p>
  <p>ดัชนีเดือนเปิดซอง ${thYM(kv.open)}: ${used.map(c=>`${c}o = ${fmtq(o[c])}`).join(' · ')}</p>
  <table><thead><tr><th>งวด</th><th>เดือนส่งงาน</th><th>ดัชนีเดือน</th>${used.map(c=>`<th>${c}t</th>`).join('')}<th>K</th><th>ค่างาน (บาท)</th><th>เงินเพิ่ม (ลด) (บาท)</th></tr></thead><tbody>
  ${R.map(r=>{const t=kIdx(r.use||r.m)||{};return `<tr><td>${esc(r.b.no||'')}</td><td>${thYM(r.m)}${r.late?`<br><small>ครบกำหนด ${thYM(r.d)}</small>`:''}</td><td>${thYM(r.use||r.m)}</td>${used.map(c=>`<td ${th}>${fmtq(t[c])}</td>`).join('')}<td ${th}>${r.K==null?'–':fmt(r.K,3)}</td><td ${th}>${fmt(r.amt,2)}</td><td ${th}>${fmt(r.adj,2)}</td></tr>`}).join('')}
  <tr><td colspan="${used.length+4}" ${th}><b>รวม</b></td><td ${th}><b>${fmt(sum(R,r=>r.amt),2)}</b></td><td ${th}><b>${fmt(sum(R,r=>r.adj),2)}</b></td></tr></tbody></table>
  <h3 style="margin:12px 0 4px;font-size:13px">รายละเอียดการคำนวณแต่ละงวด</h3>
  ${R.map(r=>`<div style="break-inside:avoid;font-size:11.5px;margin:0 0 8px;padding:6px 8px;border:1px solid #ccc;border-radius:4px"><b>งวด ${esc(r.b.no||'')}</b> · ส่งงาน ${thYM(r.m)}${r.late?` (ครบกำหนด ${thYM(r.d)} ส่งช้า: K เดือนส่ง ${r.Ka==null?'–':fmt(r.Ka,3)} K เดือนครบกำหนด ${r.Kd==null?'–':fmt(r.Kd,3)} ใช้ค่าที่ต่ำกว่า)`:''}<br>${kWork(kv,r)}<br>
    ${r.K==null?'':r.K>1.04?`K เกิน 1.04 → เงินเพิ่ม = ${fmt(r.amt,2)} × (${fmt(r.K,3)} − 1.04) = <b>${fmt(r.adj,2)}</b> บาท`:r.K<.96?`K ต่ำกว่า 0.96 → เงินลด = ${fmt(r.amt,2)} × (0.96 − ${fmt(r.K,3)}) = <b>${fmt(-r.adj,2)}</b> บาท`:'K อยู่ระหว่าง 0.96 ถึง 1.04 → ไม่มีเงินเพิ่มหรือลด'}</div>`).join('')}
  <p style="font-size:11px">คิดเงินเพิ่มหรือลดเฉพาะส่วนที่ K เกิน 1.04 หรือต่ำกว่า 0.96 · อัตราส่วนดัชนี ผลคูณ และค่า K ใช้ทศนิยม 3 ตำแหน่ง ตัดทิ้งไม่ปัดเศษ · ค่างานไม่รวมภาษีมูลค่าเพิ่ม</p>`+signs(['ผู้คำนวณ (บริษัท)','ผู้ตรวจสอบ','คณะกรรมการตรวจรับ'])};
PRINT.klet=id=>{const [pid,bid]=String(id).split('~'),p=DB.projects[pid];if(!p)return '';const C=CO(),kv=kCfg(p),F=kCo(kv),all=bid==='all',R=kRows(p).filter(r=>r.K!=null&&r.adj&&(all||r.b.id===bid));
  if(!R.length)return cphead('หนังสือค่า K','')+'<p>ไม่มีงวดที่มีเงินเพิ่มหรือลด</p>';
  const tot=sum(R,r=>r.adj),up=tot>0,vr=n(p.info.vat)||7,vat=Math.abs(tot)*vr/100,ng=R.map(r=>esc(r.b.no||'')).join(', ');
  const to=kv.to||'หัวหน้าหน่วยงานผู้ว่าจ้าง',cd=kv.cdate||p.info.signed;
  const subj=up?`ขอรับเงินชดเชยค่างานก่อสร้าง (ค่า K) งวดที่ ${ng}`:`แจ้งผลการคำนวณค่า K และยินยอมให้หักเงินค่างาน งวดที่ ${ng}`;
  const tb=`<table style="margin:6px 0"><thead><tr><th>งวด</th><th>เดือนส่งงาน</th><th>ค่า K</th><th>ค่างาน (บาท)</th><th>${up?'เงินเพิ่ม':'เงินเพิ่ม (ลด)'} (บาท)</th></tr></thead><tbody>
    ${R.map(r=>`<tr><td>${esc(r.b.no||'')}</td><td>${thYM(r.m)}</td><td style="text-align:right">${fmt(r.K,3)}</td><td style="text-align:right">${fmt(r.amt,2)}</td><td style="text-align:right">${fmt(r.adj,2)}</td></tr>`).join('')}
    <tr><td colspan="4" style="text-align:right">รวม (ไม่รวมภาษีมูลค่าเพิ่ม)</td><td style="text-align:right">${fmt(tot,2)}</td></tr>
    <tr><td colspan="4" style="text-align:right">ภาษีมูลค่าเพิ่ม ${fmtq(vr)}%</td><td style="text-align:right">${fmt(up?vat:-vat,2)}</td></tr>
    <tr><td colspan="4" style="text-align:right"><b>รวมทั้งสิ้น</b></td><td style="text-align:right"><b>${fmt(up?tot+vat:tot-vat,2)}</b></td></tr></tbody></table>`;
  return `<div data-doc-name="${esc(['หนังสือค่า K',p.name,'งวด '+ng].join(' '))}" style="font-size:14px;line-height:1.75">${cphead(up?'หนังสือขอรับเงินค่า K':'หนังสือแจ้งผลการคำนวณค่า K',`โครงการ ${esc(p.name)}`)}
  <div style="display:flex;justify-content:space-between"><span>ที่ ${esc(kv.letNo||'.........................')}</span><span>วันที่ ${thDL(today())}</span></div>
  <p style="margin:10px 0 2px"><b>เรื่อง</b> ${subj}</p><p style="margin:2px 0"><b>เรียน</b> ${esc(to)}</p>
  <p style="margin:2px 0"><b>อ้างถึง</b> สัญญาจ้างเลขที่ ${esc(p.info.contractNo||'....................')}${okD(cd)?' ลงวันที่ '+thDL(cd):''}</p>
  <p style="margin:2px 0 8px"><b>สิ่งที่ส่งมาด้วย</b> 1. ตารางการคำนวณค่า K &nbsp; 2. สำเนาดัชนีราคาของสำนักงานนโยบายและยุทธศาสตร์การค้า กระทรวงพาณิชย์ เดือน ${thYM(kv.open)} และเดือนที่ส่งงาน</p>
  <p style="text-indent:2.5em">ตามที่${esc(C.name||'บริษัท')} ได้ทำสัญญาจ้าง${esc(p.name)} กับ${esc(p.info.client||'ผู้ว่าจ้าง')} ตามสัญญาที่อ้างถึง ซึ่งเป็นสัญญาแบบปรับราคาได้ (ค่า K) ใช้สูตร${esc(F.n||'ตามสัญญา')} ${kFx(F)} โดยใช้ดัชนีราคาเดือนเปิดซอง ${thYM(kv.open)} เป็นฐาน นั้น</p>
  <p style="text-indent:2.5em">บริษัทได้ส่งมอบงานงวดที่ ${ng} และคำนวณค่า K ตามเงื่อนไขของสัญญาแล้ว ${up?'ค่า K สูงกว่า 1.04 บริษัทจึงขอรับเงินชดเชยค่างานก่อสร้างเฉพาะส่วนที่เกินร้อยละ 4':'ค่า K ต่ำกว่า 0.96 บริษัทจึงแจ้งผลการคำนวณและยินยอมให้หักเงินค่างานเฉพาะส่วนที่ลดลงเกินร้อยละ 4'} ดังนี้</p>${tb}
  <p style="text-indent:2.5em">${up?`จึงเรียนมาเพื่อโปรดพิจารณาอนุมัติจ่ายเงินชดเชยค่างานก่อสร้าง (ค่า K) จำนวน ${fmt(tot+vat,2)} บาท (${bahtText(tot+vat)}) รวมภาษีมูลค่าเพิ่มแล้ว ให้แก่บริษัทด้วย จะขอบคุณยิ่ง`
    :`จึงเรียนมาเพื่อโปรดทราบ และบริษัทยินยอมให้หักเงินจำนวน ${fmt(-tot+vat,2)} บาท (${bahtText(-tot+vat)}) รวมภาษีมูลค่าเพิ่มแล้ว จากเงินค่างานที่บริษัทจะได้รับ`}</p>
  <div style="margin:28px 0 0 52%;text-align:center">ขอแสดงความนับถือ<div style="height:46px"></div>(..........................................)<br>ผู้มีอำนาจลงนาม ${esc(C.name||'')}<br><small>ประทับตราบริษัท (ถ้ามี)</small></div>
  <div style="break-before:page"></div></div>`+PRINT.kval(pid)};
DOC_EN.push([/หนังสือขอรับเงินค่า K/,'REQUEST FOR PRICE ADJUSTMENT (K) PAYMENT'],[/หนังสือแจ้งผลการคำนวณค่า K/,'PRICE ADJUSTMENT (K) NOTICE']);
SBKW['co.tender.k']=(SBKW['co.tender.k']||'')+' หนังสือขอรับเงินค่า k หักเงินค่า k ส่งงานช้า ทศนิยม 3 ตำแหน่ง ท่อ pvc gip ผิวทาง';
