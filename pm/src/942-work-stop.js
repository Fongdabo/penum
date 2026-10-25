/* ---------- 4.62 หนังสือหยุดงาน: letters for stopping site work, kept on the project (user: "เพิ่มเอกสารการหยุดงาน ในกรณีต่างๆ เช่นเบิกงวดไม่ได้") ----------
   โครงการ › ออกเอกสาร › หนังสือหยุดงาน. Four kinds of letter in one numbered list P.stops (SW-, counted company-wide):
   แจ้งเตือนก่อนหยุดงาน (warn) → แจ้งหยุดงาน (stop) → แจ้งกลับเข้าทำงาน (resume), and ขอขยายระยะเวลาก่อสร้าง (eot).
   Each letter has a reason from SWR (ค้างชำระค่างวด, พื้นที่ไม่พร้อม, ผู้ว่าจ้างสั่งหยุด/แก้แบบ, รอแบบ/อนุมัติ, ความปลอดภัย,
   เหตุสุดวิสัย, อื่นๆ) that writes the Thai wording, a contract clause field, and its dates. A stop letter and the resume letter
   that points back to it (s.link) make one stoppage period; swPeriods() counts its days, and the summary card and the eot letter
   add them up (overlapping days once) for the extension of time. Unpaid claims are picked from the project's ใบเบิกงวด.
   Prints use the project letterhead (phead), the Thai letter layout of 620 (.lt2), a form code row in FM_LIST (938), the signer
   of 620 (subSigner) with the e-signature place .lt-sign .lt-ln (860), and ◫ แบ่งจอ (941) through the พิมพ์ button in the title. */
const SWK=[['warn','แจ้งเตือนก่อนหยุดงาน','หนังสือแจ้งเตือนก่อนหยุดงาน'],['stop','แจ้งหยุดงาน','หนังสือแจ้งหยุดงาน'],['resume','แจ้งกลับเข้าทำงาน','หนังสือแจ้งกลับเข้าทำงาน'],['eot','ขอขยายระยะเวลา','หนังสือขอขยายระยะเวลาก่อสร้าง']];
// l: menu name, c: clause example, why: the cause, ask: what the employer must do, till: stop until…, end: the cause is over, att: enclosures
const SWR={
  pay:{l:'ค้างชำระค่างวด / เบิกงวดไม่ได้',c:'เช่น ข้อ 4 การจ่ายเงิน',why:'ผู้ว่าจ้างยังมิได้ชำระเงินค่างานงวดที่ถึงกำหนดชำระแล้ว ตามรายการด้านล่าง ทำให้บริษัทขาดเงินทุนหมุนเวียนสำหรับค่าวัสดุและค่าแรงงาน',
    ask:'ชำระเงินค่างานที่ค้างชำระทั้งหมด',till:'จะได้รับชำระเงินค่างานที่ค้างชำระครบถ้วน',end:'บริษัทได้รับชำระเงินค่างานที่ค้างชำระแล้ว',att:'สำเนาใบเบิกเงินงวด / ใบแจ้งหนี้ที่ค้างชำระ'},
  site:{l:'พื้นที่ไม่พร้อม / เข้าพื้นที่ไม่ได้',c:'เช่น ข้อ 6 การส่งมอบพื้นที่',why:'พื้นที่ทำงานยังไม่พร้อมให้บริษัทเข้าทำงาน หรือบริษัทไม่สามารถเข้าพื้นที่ทำงานได้',
    ask:'ส่งมอบพื้นที่ทำงานที่พร้อม และให้บริษัทเข้าทำงานได้',till:'พื้นที่ทำงานจะพร้อมและบริษัทเข้าทำงานได้',end:'พื้นที่ทำงานพร้อมและบริษัทเข้าทำงานได้แล้ว',att:'รูปถ่ายสภาพพื้นที่ทำงาน'},
  order:{l:'ผู้ว่าจ้างสั่งหยุด / เปลี่ยนแปลงแบบ',c:'เช่น ข้อ 12 การแก้ไขเปลี่ยนแปลงงาน',why:'ผู้ว่าจ้างมีคำสั่งให้หยุดงาน หรือให้เปลี่ยนแปลงแบบและรายละเอียดของงาน',
    ask:'ยืนยันคำสั่งและรายละเอียดการเปลี่ยนแปลงเป็นลายลักษณ์อักษร พร้อมแบบที่แก้ไข',till:'จะได้รับคำสั่งให้ทำงานต่อ พร้อมแบบและรายละเอียดที่เปลี่ยนแปลง',end:'บริษัทได้รับคำสั่งให้ทำงานต่อ พร้อมแบบและรายละเอียดที่เปลี่ยนแปลงแล้ว',att:'สำเนาคำสั่งของผู้ว่าจ้าง'},
  dwg:{l:'รอแบบ / รอคำตอบหรือการอนุมัติ',c:'เช่น ข้อ 10 แบบรูปและรายการละเอียด',why:'บริษัทยังไม่ได้รับแบบ คำตอบข้อสงสัย หรือผลการพิจารณาอนุมัติ ที่จำเป็นต่อการทำงาน',
    ask:'ส่งแบบ คำตอบ หรือผลการพิจารณาอนุมัติ',till:'จะได้รับแบบ คำตอบ หรือผลการพิจารณาอนุมัติ',end:'บริษัทได้รับแบบ คำตอบ หรือผลการพิจารณาอนุมัติแล้ว',att:'สำเนา RFI / เอกสารส่งอนุมัติที่รอผล'},
  safe:{l:'เหตุด้านความปลอดภัย',c:'เช่น ข้อ 15 ความปลอดภัยในการทำงาน',why:'สภาพหน้างานมีความเสี่ยงต่อความปลอดภัยของผู้ปฏิบัติงานและบุคคลอื่น',
    ask:'แก้ไขสภาพหน้างานให้ปลอดภัยต่อการทำงาน',till:'สภาพหน้างานจะได้รับการแก้ไขให้ปลอดภัย',end:'สภาพหน้างานได้รับการแก้ไขและปลอดภัยต่อการทำงานแล้ว',att:'รูปถ่ายสภาพหน้างาน'},
  force:{l:'สภาพอากาศ / เหตุสุดวิสัย',c:'เช่น ข้อ 20 การงดหรือลดค่าปรับและการขยายเวลา',why:'เกิดเหตุสุดวิสัยหรือสภาพอากาศที่ไม่สามารถทำงานได้ ซึ่งมิใช่ความผิดของบริษัท',
    ask:'รับทราบเหตุดังกล่าว',till:'เหตุดังกล่าวจะสิ้นสุดลง',end:'เหตุดังกล่าวได้สิ้นสุดลงแล้ว',att:'รูปถ่าย / ประกาศของหน่วยงานที่เกี่ยวข้อง'},
  other:{l:'เหตุอื่น (เขียนเอง)',c:'',why:'',ask:'แก้ไขเหตุดังกล่าว',till:'เหตุดังกล่าวจะได้รับการแก้ไข',end:'เหตุดังกล่าวได้รับการแก้ไขแล้ว',att:''}};
const swR=s=>SWR[s.why]||SWR.other,swK=k=>SWK.find(x=>x[0]===k)||SWK[1];
NO_CO['SW-']=p=>p.stops;
if(typeof PFX!=='undefined')PFX.push(['SW-','หนังสือหยุดงาน / ขยายเวลา']);
const swArr=()=>{P.stops=P.stops||[];return P.stops};
const swParty=()=>P.info.client||custName(P.info.cust)||'ผู้ว่าจ้าง';
function swNew(kind,from){const L=swArr(),d=today(),s={id:uid(),no:nextNo('SW-',L),kind,why:'pay',date:d,to:swParty(),cc:'ผู้ควบคุมงาน / ที่ปรึกษาโครงการ',clause:'',detail:'',nd:7,eff:'',from:'',link:'',bills:[],paidOn:'',att:'',ids:null};
  if(from)Object.assign(s,{why:from.why,to:from.to,cc:from.cc,clause:from.clause,detail:from.detail,bills:(from.bills||[]).slice(),link:from.id});
  if(kind==='warn'){s.eff=addD(d,7);s.bills=swOverdue().map(r=>r.b.id)}
  if(kind==='stop'){s.eff=from&&okD(from.eff)&&from.eff>d?from.eff:d;if(!from)s.bills=swOverdue().map(r=>r.b.id)}
  if(kind==='resume'){s.eff=d;s.from=from?from.eff:''}
  if(kind==='eot'){s.why='';s.clause=(swArr().find(x=>x.kind!=='eot'&&x.clause)||{}).clause||''}
  s.att=kind==='eot'?'สำเนาหนังสือแจ้งหยุดงานและแจ้งกลับเข้าทำงานตามตาราง':swR(s).att;L.push(s);return s}
// claims sent but not paid and past their due date (the ones a pay letter is about)
function swOverdue(){const td=today();return billsSorted().filter(b=>b.status!=='draft'&&b.status!=='paid').map(b=>({b,c:billCalc(b),due:billDue(P,b)})).filter(r=>r.due<td)}
function swBills(s){return (s.bills||[]).map(id=>P.bills.find(b=>b.id===id)).filter(Boolean).map(b=>({b,c:billCalc(b),due:billDue(P,b)}))}
// every stop letter with the resume letter that ends it: {s, r, a: first stopped day, z: day work resumes (or today), d: days stopped, open}
function swPeriods(){const L=swArr(),td=today();return L.filter(s=>s.kind==='stop'&&okD(s.eff)).sort((a,b)=>a.eff<b.eff?-1:1).map(s=>{
  const r=L.find(x=>x.kind==='resume'&&x.link===s.id&&okD(x.eff)),z=r?r.eff:td;return {s,r,a:s.eff,z,d:Math.max(0,diffD(s.eff,z)),open:!r}})}
// days stopped across several periods, a day that two periods share counted once
function swUnion(R){const I=R.map(x=>[x.a,x.z]).filter(([a,z])=>z>a).sort((x,y)=>x[0]<y[0]?-1:1);let t=0,ca='',cz='';
  I.forEach(([a,z])=>{if(!ca){ca=a;cz=z;return}if(a<=cz){if(z>cz)cz=z}else{t+=diffD(ca,cz);ca=a;cz=z}});return ca?t+diffD(ca,cz):0}
const swFin=()=>okD(P.info.finish)?P.info.finish:'';
const swRef=id=>{const x=swArr().find(y=>y.id===id);return x?`หนังสือที่ ${x.no} ลงวันที่ ${thDL(x.date)}`:''};

/* --- the page --- */
function swPage(){const L=swArr(),sel=L.find(x=>x.id===S.sel.sw)||L[L.length-1],R=swPeriods(),tot=swUnion(R),fin=swFin(),op=R.filter(x=>x.open),od=swOverdue();
  const kn=k=>`<span class="pill sw-${k}">${swK(k)[1]}</span>`;
  const list=`<section class="card"><h2><span>หนังสือหยุดงาน</span><small>${L.length} ฉบับ · เลขที่รันทั้งบริษัท แก้ได้</small><span class="sp"></span>
    ${SWK.map(([k,l])=>`<button type="button" class="btn sm${k==='warn'?' pri':''}" data-a="swAdd" data-k="${k}">+ ${l}</button>`).join('')}</h2>
    ${od.length&&!L.length?`<p class="hint" style="margin:0 0 8px">โครงการนี้มีใบเบิกงวดเลยกำหนดชำระ ${od.length} ใบ รวม ${fmt(sum(od,r=>r.c.net),2)} บาท เริ่มจาก <b>แจ้งเตือนก่อนหยุดงาน</b> แล้วค่อยแจ้งหยุดงานเมื่อพ้นกำหนด</p>`:''}
    <div class="tw"><table><thead><tr><th>เลขที่</th><th>วันที่</th><th>ประเภท</th><th>เหตุ</th><th>มีผลวันที่</th><th></th></tr></thead><tbody>
    ${L.length?L.slice().reverse().map(s=>`<tr class="${sel&&sel.id===s.id?'sel':''}"><td><button type="button" class="btn ghost sm" data-a="sel" data-k="sw" data-id="${s.id}"><b>${esc(s.no)}</b></button></td><td>${thD(s.date)}</td><td>${kn(s.kind)}</td>
      <td>${s.kind==='eot'?'–':esc(swR(s).l)}</td><td>${okD(s.eff)&&s.kind!=='eot'?thD(s.eff):''}</td><td><button type="button" class="x" data-a="delRow" data-c="stops" data-id="${s.id}" aria-label="ลบ">✕</button></td></tr>`).join('')
      :'<tr><td colspan="6" class="empty">ยังไม่มีหนังสือหยุดงาน</td></tr>'}</tbody></table></div></section>`;
  const sum_=`<section class="card"><h2><span>สรุปวันหยุดงาน (ใช้ขอขยายระยะเวลา)</span><small>นับจากวันที่หยุดงานในหนังสือแจ้งหยุดงาน ถึงวันที่กลับเข้าทำงาน${op.length?' · ยังหยุดอยู่นับถึงวันนี้':''}</small><span class="sp"></span>
    ${R.length?`<button type="button" class="btn sm" data-a="swAdd" data-k="eot">+ หนังสือขอขยายระยะเวลา ${tot} วัน</button>`:''}</h2>
    ${R.length?`<div class="tw"><table><thead><tr><th>หนังสือแจ้งหยุด</th><th>เหตุ</th><th>หยุดตั้งแต่</th><th>กลับเข้าทำงาน</th><th class="r">วัน</th><th></th></tr></thead><tbody>
      ${R.map(x=>`<tr><td>${esc(x.s.no)}</td><td>${esc(swR(x.s).l)}</td><td>${thD(x.a)}</td><td>${x.open?'<span class="pill warn">ยังหยุดอยู่</span>':`${thD(x.z)} <small class="muted">(${esc(x.r.no)})</small>`}</td><td class="r"><b>${x.d}</b></td>
        <td>${x.open?`<button type="button" class="btn sm" data-a="swAdd" data-k="resume" data-from="${x.s.id}">+ แจ้งกลับเข้าทำงาน</button>`:''}</td></tr>`).join('')}
      <tr class="grp"><td colspan="4">รวม${tot!==sum(R,x=>x.d)?' (วันที่ซ้อนกันนับครั้งเดียว)':''}</td><td class="r"><b>${tot}</b></td><td></td></tr></tbody></table></div>
      <p class="hint">${fin?`กำหนดแล้วเสร็จตามสัญญา ${thDL(fin)} · ถ้าได้ขยายเวลาครบ ${tot} วัน เป็น <b>${thDL(addD(fin,tot))}</b>`:'ใส่วันสิ้นสุดสัญญาที่ ข้อมูลโครงการ เพื่อให้หนังสือคำนวณกำหนดแล้วเสร็จใหม่'}
      ${isGovP()?' · สัญญาภาครัฐ: แจ้งเหตุพร้อมหลักฐานเป็นหนังสือภายใน 15 วันนับแต่เหตุสิ้นสุด มิฉะนั้นอาจขอขยายเวลาไม่ได้':' · ยื่นขอขยายเวลาตามระยะเวลาที่สัญญากำหนด เก็บหนังสือและหลักฐานทุกฉบับไว้'}</p>`
    :'<p class="hint">ยังไม่มีหนังสือแจ้งหยุดงาน เมื่อออกหนังสือแจ้งหยุดงานและแจ้งกลับเข้าทำงาน จำนวนวันจะขึ้นที่นี่ให้อัตโนมัติ</p>'}</section>`;
  return list+(sel?swCard(sel):'')+sum_}
function swCard(s){const b=`stops.${s.id}`,R=swR(s),k=s.kind,L=swArr(),t=swK(k)[2];
  const inp=(f,l,a='',cl='')=>`<label${cl?` class="${cl}"`:''}>${l}<input data-p="${b}.${f}" value="${esc(s[f]??'')}"${a}></label>`,dt=(f,l)=>`<label>${l}<input type="date" data-p="${b}.${f}" value="${esc(s[f]||'')}"></label>`;
  const lk=k==='stop'?L.filter(x=>x.kind==='warn'):k==='resume'?L.filter(x=>x.kind==='stop'):[];
  const P_=swPeriods(),me=k==='stop'?P_.find(x=>x.s.id===s.id):k==='resume'?P_.find(x=>x.r&&x.r.id===s.id):null;
  let extra='';
  if(k!=='eot'&&s.why==='pay'){const od=swOverdue(),have=new Set(s.bills||[]),all=[...od.map(r=>r.b),...P.bills.filter(x=>have.has(x.id)&&!od.some(r=>r.b.id===x.id))];
    extra=`<h3 class="fm-g">ใบเบิกงวดที่ค้างชำระ (พิมพ์เป็นตารางในหนังสือ)</h3><div class="tw"><table><thead><tr><th></th><th>เลขที่</th><th>วันที่</th><th>ครบกำหนด</th><th class="r">เกินกำหนด (วัน)</th><th class="r">ยอดรับสุทธิ</th></tr></thead><tbody>
      ${all.length?all.map(x=>{const c=billCalc(x),du=billDue(P,x);return `<tr><td class="c"><input type="checkbox" data-a="swBill" data-id="${s.id}" data-k="${x.id}"${have.has(x.id)?' checked':''} aria-label="เลือก ${esc(x.no)}"></td><td>${esc(x.no)}</td><td>${thD(x.date)}</td><td>${thD(du)}</td><td class="r">${Math.max(0,diffD(du,s.date||today()))}</td><td class="r">${fmt(c.net,2)}</td></tr>`}).join('')
        :'<tr><td colspan="6" class="empty">ไม่มีใบเบิกงวดที่เลยกำหนดชำระ (ใบที่ส่งเบิกแล้วแต่ยังไม่ได้รับเงิน)</td></tr>'}</tbody></table></div>`}
  if(k==='eot'){const ids=s.ids,R2=P_;extra=`<h3 class="fm-g">ช่วงที่หยุดงานที่ขอขยายเวลา</h3><div class="tw"><table><thead><tr><th></th><th>หนังสือแจ้งหยุด</th><th>เหตุ</th><th>หยุดตั้งแต่</th><th>กลับเข้าทำงาน</th><th class="r">วัน</th></tr></thead><tbody>
    ${R2.length?R2.map(x=>`<tr><td class="c"><input type="checkbox" data-a="swEotTog" data-id="${s.id}" data-k="${x.s.id}"${!ids||ids.includes(x.s.id)?' checked':''} aria-label="เลือก ${esc(x.s.no)}"></td><td>${esc(x.s.no)}</td><td>${esc(swR(x.s).l)}</td><td>${thD(x.a)}</td><td>${x.open?'<span class="pill warn">ยังหยุดอยู่</span>':thD(x.z)}</td><td class="r">${x.d}</td></tr>`).join('')
      :'<tr><td colspan="6" class="empty">ยังไม่มีหนังสือแจ้งหยุดงาน</td></tr>'}</tbody></table></div>`}
  const nextB=k==='warn'?`<button type="button" class="btn sm" data-a="swAdd" data-k="stop" data-from="${s.id}">ต่อ: แจ้งหยุดงาน →</button>`:k==='stop'&&me&&me.open?`<button type="button" class="btn sm" data-a="swAdd" data-k="resume" data-from="${s.id}">ต่อ: แจ้งกลับเข้าทำงาน →</button>`:'';
  return `<section class="card" id="swCard"><h2><span>${esc(s.no)} · ${t}</span>${me?`<small>หยุดงาน ${me.d} วัน${me.open?' (ยังหยุดอยู่)':''}</small>`:''}<span class="sp"></span>
    <button type="button" class="btn sm pri" data-a="print" data-k="swl" data-id="${s.id}">พิมพ์หนังสือ</button>${nextB}</h2>
  <div class="form">${inp('no','เลขที่')}${dt('date','ลงวันที่')}
    <label>ประเภท<select data-p="${b}.kind">${SWK.map(([kk,l])=>`<option value="${kk}"${kk===k?' selected':''}>${l}</option>`).join('')}</select></label>
    ${k==='eot'?'':`<label class="w2">เหตุที่หยุดงาน<select data-p="${b}.why">${Object.entries(SWR).map(([kk,x])=>`<option value="${kk}"${kk===s.why?' selected':''}>${x.l}</option>`).join('')}</select></label>`}
    ${inp('to','เรียน','','w2')}${inp('cc','สำเนาเรียน','','w2')}
    ${inp('clause','อ้างข้อสัญญา',` placeholder="${esc(k==='eot'?'เช่น ข้อ 20 การงดหรือลดค่าปรับและการขยายเวลา':R.c)}"`)}
    ${k==='warn'?`<label>ให้แก้ไขภายใน (วัน)<input data-p="${b}.nd" data-t="num" inputmode="numeric" value="${esc(s.nd??7)}"></label>${dt('eff','จะหยุดงานตั้งแต่วันที่')}`:''}
    ${k==='stop'?dt('eff','หยุดงานตั้งแต่วันที่'):''}
    ${k==='resume'?dt('from','หยุดงานตั้งแต่วันที่')+dt('eff','กลับเข้าทำงานวันที่')+(s.why==='pay'?dt('paidOn','ได้รับชำระเงินวันที่'):''):''}
    ${lk.length?`<label class="w2">อ้างหนังสือก่อนหน้า<select data-p="${b}.link"><option value="">–</option>${lk.map(x=>`<option value="${x.id}"${x.id===s.link?' selected':''}>${esc(x.no)} · ${swK(x.kind)[1]} ${thD(x.date)}</option>`).join('')}</select></label>`:''}
    <label class="full">${k==='eot'?'รายละเอียดเพิ่มเติม':s.why==='other'?'เหตุที่หยุดงาน (เขียนเอง)':'รายละเอียดเพิ่มเติม (ต่อท้ายเหตุ)'}<textarea data-p="${b}.detail" rows="3" placeholder="${esc(k==='eot'?'เช่น ผลกระทบต่อแผนงาน งานที่ต้องเลื่อน':R.why?'เช่น '+(s.why==='dwg'?'RFI-004 ตำแหน่งท่อน้ำยาชั้น 3 ส่งเมื่อ 2 ต.ค. ยังไม่ได้คำตอบ':s.why==='site'?'พื้นที่ชั้น 5 ยังมีผู้รับเหมางานโครงสร้างทำงานอยู่':'ระบุเหตุการณ์ วันที่ และผลกระทบต่องาน'):'เขียนเหตุที่หยุดงาน')}">${esc(s.detail||'')}</textarea></label>
    <label class="full">สิ่งที่ส่งมาด้วย (บรรทัดละรายการ)<textarea data-p="${b}.att" rows="2">${esc(s.att||'')}</textarea></label></div>
  ${extra}
  <p class="hint">${k==='warn'?'ส่งหนังสือเตือนก่อน ให้เวลาผู้ว่าจ้างแก้ไขตามที่สัญญากำหนด แล้วกด <b>ต่อ: แจ้งหยุดงาน</b> เมื่อพ้นกำหนด':k==='stop'?'วันที่หยุดงานคือวันแรกที่ไม่ได้ทำงาน · เมื่อกลับเข้าทำงานกด <b>ต่อ: แจ้งกลับเข้าทำงาน</b> โปรแกรมนับวันหยุดให้':k==='resume'?'จำนวนวันหยุด = ตั้งแต่วันที่หยุดงาน ถึงวันก่อนกลับเข้าทำงาน':'เลือกช่วงที่หยุดงาน โปรแกรมรวมวันและคำนวณกำหนดแล้วเสร็จใหม่ให้'} · ถ้อยคำเป็นแบบทั่วไป ตรวจกับข้อสัญญาจริงก่อนส่ง และส่งแบบมีหลักฐานการรับ</p></section>`}
ACT.swAdd=b=>{const from=b.dataset.from&&swArr().find(x=>x.id===b.dataset.from),s=swNew(b.dataset.k||'warn',from);S.sel.sw=s.id;save();render();
  const c=$('#swCard');if(c)c.scrollIntoView({block:'start'});toast(`${s.no} · ${swK(s.kind)[2]}`)};
ACT.swBill=b=>{const s=swArr().find(x=>x.id===b.dataset.id);if(!s)return;s.bills=s.bills||[];const i=s.bills.indexOf(b.dataset.k);i<0?s.bills.push(b.dataset.k):s.bills.splice(i,1);save();render()};
ACT.swEotTog=b=>{const s=swArr().find(x=>x.id===b.dataset.id);if(!s)return;const all=swPeriods().map(x=>x.s.id);let ids=s.ids||all.slice();const i=ids.indexOf(b.dataset.k);i<0?ids.push(b.dataset.k):ids.splice(i,1);
  s.ids=ids.length===all.length&&all.every(x=>ids.includes(x))?null:ids;save();render()};
// a new reason brings its own enclosure line, unless one was typed
HOOK.push((p,v)=>{const m=String(p).match(/^stops\.([^.]+)\.why$/);if(!m)return;const s=swArr().find(x=>x.id===m[1]);if(!s)return;
  if(!s.att||Object.values(SWR).some(r=>r.att===s.att))s.att=(SWR[v]||SWR.other).att;if(v==='pay'&&!(s.bills||[]).length)s.bills=swOverdue().map(r=>r.b.id)});
HOOK.push((p,v)=>{const m=String(p).match(/^stops\.([^.]+)\.(nd|date)$/);if(!m)return;const s=swArr().find(x=>x.id===m[1]);if(s&&s.kind==='warn'&&okD(s.date))s.eff=addD(s.date,n(s.nd)||7)});

// the ออกเอกสาร tab gets หนังสือหยุดงาน after its four forms (fdView knows only FD's kinds, so this tab is drawn here)
{const sb=subTabs;subTabs=function(k,list){if(k==='forms'&&!list.some(x=>x[0]==='stop'))list=[...list,['stop','หนังสือหยุดงาน']];return sb(k,list)}}
{const f=VIEWS.forms;VIEWS.forms=()=>{if(S.sub.forms!=='stop')return f();const {cur,html}=subTabs('forms',[['dn','ใบส่งของ'],['wo','ใบสั่งงาน'],['sc','สัญญาผู้รับเหมาช่วง'],['ho','ใบส่งมอบงาน']]);
  return cur==='stop'?html+swPage():f()}}
// a project that is stopped says so on its overview
{const f=VIEWS.dash;VIEWS.dash=function(){const h=f.apply(this,arguments);if(!P||!P.stops||!P.stops.length)return h;const op=swPeriods().filter(x=>x.open&&x.a<=today());if(!op.length)return h;const x=op[op.length-1];
  return `<section class="card" style="border-color:var(--warn-c)"><h2><span>หยุดงานอยู่ ${x.d} วัน</span><small>ตั้งแต่ ${thDL(x.a)} · ${esc(swR(x.s).l)} · ${esc(x.s.no)}</small><span class="sp"></span>
    <button type="button" class="btn sm" data-a="go" data-m="pj" data-k="forms" data-s="stop">หนังสือหยุดงาน</button></h2></section>`+h}}

/* --- the letter --- */
function swLetter(s){const I=P.info,C=contract(),CO_=CO(),[sn,sr]=subSigner(),R=swR(s),k=s.kind,t=swK(k)[2],fin=swFin(),gov=isGovP(),party=esc(s.to||swParty());
  const nm=String(P.name||'').trim(),cut=nm.indexOf(' - '),pjN=cut>0?nm.slice(0,cut).trim():'',job=cut>0?nm.slice(cut+3).trim():nm,what=pjN?`${esc(job)} โครงการ ${esc(pjN)}`:esc(nm);
  const row=(a,v)=>`<div class="lt-r"><b>${a}</b><div>${v}</div></div>`,p=x=>x?`<p class="lt-p">${x}</p>`:'';
  let why=(R.why||'')+(s.detail&&s.detail.trim()?`${R.why?' ':''}${s.why==='other'?'':'กล่าวคือ '}${esc(s.detail.trim()).replace(/\n/g,' ')}`:''),cl=String(s.clause||'').trim();
  const refs=[I.contractNo?`สัญญาจ้างเลขที่ ${esc(I.contractNo)}${okD(I.signed)?` ลงวันที่ ${thDL(I.signed)}`:''}${cl?` ${esc(cl)}`:''}`:cl?`สัญญาจ้าง ${esc(cl)}`:''];
  const per=swPeriods(),me=k==='resume'?(per.find(x=>x.r&&x.r.id===s.id)||null):null,lnk=s.link&&swArr().find(x=>x.id===s.link);
  if(lnk)refs.push(swRef(lnk.id));
  const att=String(s.att||'').split('\n').map(x=>x.trim()).filter(Boolean);
  // the overdue claims, as a small table
  let tb='';if((k==='warn'||k==='stop')&&s.why==='pay'){const B=swBills(s);if(B.length)tb=`<table class="sw-t"><thead><tr><th>ใบเบิกงวด</th><th>ลงวันที่</th><th>ครบกำหนดชำระ</th><th>เกินกำหนด (วัน)</th><th>จำนวนเงิน (บาท)</th></tr></thead><tbody>
    ${B.map(r=>`<tr><td>${esc(r.b.no)}</td><td>${thD(r.b.date)}</td><td>${thD(r.due)}</td><td class="r">${Math.max(0,diffD(r.due,s.date||today()))}</td><td class="r">${fmt(r.c.net,2)}</td></tr>`).join('')}
    <tr><td colspan="4" class="r"><b>รวมค้างชำระ</b></td><td class="r"><b>${fmt(sum(B,r=>r.c.net),2)}</b></td></tr></tbody></table>`}
  if(!tb)why=why.replace(' ตามรายการด้านล่าง','');
  const law=k!=='eot'&&s.why==='pay'?' ซึ่งเป็นสิทธิของคู่สัญญาในสัญญาต่างตอบแทนที่จะไม่ชำระหนี้ตอบแทนจนกว่าอีกฝ่ายจะชำระหนี้ ตามประมวลกฎหมายแพ่งและพาณิชย์ มาตรา 369':'';
  const intro=`ตามที่ ${esc(CO_.name||'บริษัท')} ได้รับจ้าง${pjN?'':'งาน'} ${what}${I.site?` ณ ${esc(I.site)}`:''} จาก ${party}${refs[0]?' ตามสัญญาที่อ้างถึง':''}${fin?` กำหนดแล้วเสร็จวันที่ ${thDL(fin)}`:''} นั้น`;
  let subj='',body='';
  if(k==='warn'){const eff=okD(s.eff)?s.eff:addD(s.date,n(s.nd)||7);subj=`แจ้งเตือนให้แก้ไขเหตุขัดข้อง ก่อนหยุดงาน ${what}`;
    body=p(intro)+p(`บัดนี้ ${why||'มีเหตุขัดข้องที่ทำให้บริษัทไม่สามารถทำงานต่อไปได้ตามปกติ'}`)+tb+
      p(`บริษัทจึงขอให้${party}${R.ask} ภายใน ${n(s.nd)||7} วัน นับแต่วันที่ได้รับหนังสือฉบับนี้ หากพ้นกำหนดดังกล่าวแล้วยังไม่ได้รับการแก้ไข บริษัทมีความจำเป็นต้องหยุดงานตั้งแต่วันที่ ${thDL(eff)} เป็นต้นไป จนกว่า${R.till}${law} ทั้งนี้ บริษัทขอสงวนสิทธิ์ในการขอขยายระยะเวลาก่อสร้างตามจำนวนวันที่ต้องหยุดงาน และเรียกร้องค่าใช้จ่ายที่เกิดขึ้นจากการหยุดงาน`)+
      p('จึงเรียนมาเพื่อโปรดพิจารณาดำเนินการ และขอขอบคุณมา ณ โอกาสนี้')}
  else if(k==='stop'){const eff=okD(s.eff)?s.eff:s.date;subj=`แจ้งหยุดงาน ${what}`;
    body=p(intro)+p(`${s.why==='order'?'บริษัทได้รับแจ้งว่า':'บัดนี้'} ${why||'มีเหตุขัดข้องที่ทำให้บริษัทไม่สามารถทำงานต่อไปได้'}`)+tb+
      (lnk?p(`บริษัทได้มี${swRef(lnk.id)} แจ้งเตือนและขอให้แก้ไขเหตุดังกล่าวแล้ว แต่จนถึงวันที่ออกหนังสือฉบับนี้ ยังไม่ได้รับการแก้ไข`):'')+
      p(`${s.why==='order'?'บริษัทจึงหยุดงานตามคำสั่งดังกล่าว':'บริษัทจึงขอแจ้งหยุดงาน'} ตั้งแต่วันที่ ${thDL(eff)} เป็นต้นไป จนกว่า${R.till}${law} ระหว่างหยุดงาน บริษัทจะดูแลป้องกันงานที่ทำแล้ว วัสดุ และอุปกรณ์ในหน้างานตามสมควร`)+
      p('ทั้งนี้ บริษัทขอสงวนสิทธิ์ในการขอขยายระยะเวลาก่อสร้างตามจำนวนวันที่หยุดงาน และเรียกร้องค่าใช้จ่ายที่เพิ่มขึ้นจากการหยุดงาน เช่น ค่าดูแลรักษาหน้างาน ค่าเช่าเครื่องมือและนั่งร้าน และค่าใช้จ่ายในการกลับเข้าทำงาน')+
      p(`จึงเรียนมาเพื่อโปรดทราบ${['force','order'].includes(s.why)?'':' และโปรดดำเนินการแก้ไขโดยเร็ว เพื่อให้บริษัทกลับเข้าทำงานได้'}`)}
  else if(k==='resume'){const a=okD(s.from)?s.from:me?me.a:'',z=okD(s.eff)?s.eff:s.date,d=a?Math.max(0,diffD(a,z)):0;subj=`แจ้งกลับเข้าทำงาน ${what}`;
    body=p(intro)+p(`บริษัทได้หยุดงาน${a?`ตั้งแต่วันที่ ${thDL(a)}`:''}${lnk?` ตาม${swRef(lnk.id)}`:''} เนื่องจาก${why||'เหตุขัดข้องที่ทำให้ไม่สามารถทำงานได้'}`)+
      p(`บัดนี้ ${R.end}${s.why==='pay'&&okD(s.paidOn)?` เมื่อวันที่ ${thDL(s.paidOn)}`:''} บริษัทจึงขอแจ้งกลับเข้าทำงานตั้งแต่วันที่ ${thDL(z)} เป็นต้นไป${d?` รวมระยะเวลาที่หยุดงาน ${d} วัน (ตั้งแต่วันที่ ${thDL(a)} ถึงวันที่ ${thDL(addD(z,-1))})`:''}`)+
      (d?p(`บริษัทขอใช้สิทธิ์ขอขยายระยะเวลาก่อสร้างออกไป ${d} วัน ตามระยะเวลาที่หยุดงาน${fin?` จากกำหนดแล้วเสร็จเดิมวันที่ ${thDL(fin)} เป็นวันที่ ${thDL(addD(fin,d))}`:''} โดยจะยื่นหนังสือขอขยายระยะเวลาพร้อมหลักฐานต่อไป`):'')+
      p('จึงเรียนมาเพื่อโปรดทราบ และขอขอบคุณมา ณ โอกาสนี้')}
  else{const X=per.filter(x=>!s.ids||s.ids.includes(x.s.id)),d=swUnion(X);subj=`ขอขยายระยะเวลาก่อสร้าง ${what}`;
    const t2=`<table class="sw-t"><thead><tr><th>#</th><th>เหตุที่หยุดงาน</th><th>หนังสือแจ้ง</th><th>หยุดตั้งแต่</th><th>กลับเข้าทำงาน</th><th>จำนวนวัน</th></tr></thead><tbody>
      ${X.map((x,i)=>`<tr><td>${i+1}</td><td>${esc(swR(x.s).l)}</td><td>${esc(x.s.no)}${x.r?` / ${esc(x.r.no)}`:''}</td><td>${thD(x.a)}</td><td>${x.open?'ยังหยุดอยู่ (นับถึง '+thD(x.z)+')':thD(x.z)}</td><td class="r">${x.d}</td></tr>`).join('')}
      <tr><td colspan="5" class="r"><b>รวม${X.length>1&&d!==sum(X,x=>x.d)?' (วันที่ซ้อนกันนับครั้งเดียว)':''}</b></td><td class="r"><b>${d}</b></td></tr></tbody></table>`;
    body=p(intro)+p(`ระหว่างการดำเนินงาน บริษัทต้องหยุดงานด้วยเหตุที่มิใช่ความผิดของบริษัท ${X.length} ครั้ง ซึ่งบริษัทได้มีหนังสือแจ้งไว้แล้วทุกครั้ง ดังนี้`)+t2+
      (s.detail&&s.detail.trim()?p(esc(s.detail.trim()).replace(/\n/g,' ')):'')+
      p(`บริษัทจึงขอขยายระยะเวลาก่อสร้างออกไป ${d} วัน${fin?` จากกำหนดแล้วเสร็จเดิมวันที่ ${thDL(fin)} เป็นวันที่ ${thDL(addD(fin,d))}`:''} และขอให้งดหรือลดค่าปรับสำหรับระยะเวลาดังกล่าว${cl?` ตามสัญญา${esc(cl)}`:' ตามเงื่อนไขของสัญญา'}${gov?' ประกอบพระราชบัญญัติการจัดซื้อจัดจ้างและการบริหารพัสดุภาครัฐ พ.ศ. 2560 มาตรา 102':''}`)+
      p('จึงเรียนมาเพื่อโปรดพิจารณาอนุมัติ จะขอบคุณยิ่ง')}
  return phead(`${t} ${s.no}`,`วันที่ ${thDL(s.date)}`)+`<div class="let lt2 sw">
  <div class="lt-top"><span>ที่ ${esc(s.no)}</span></div><div class="lt-date">${thDL(s.date)}</div>
  ${row('เรื่อง',subj)}${row('เรียน',party)}
  ${refs.filter(Boolean).length?row('อ้างถึง',refs.filter(Boolean).length>1?`<ol>${refs.filter(Boolean).map(x=>`<li>${x}</li>`).join('')}</ol>`:refs.filter(Boolean)[0]):''}
  ${att.length?row('สิ่งที่ส่งมาด้วย',att.length>1?`<ol>${att.map(x=>`<li>${esc(x)}</li>`).join('')}</ol>`:esc(att[0])):''}
  ${body}
  <div class="lt-sign"><div>ขอแสดงความนับถือ</div><div class="lt-ln"></div><div>(${esc(sn||'.................................................')})</div><div>${esc(sr)}</div><div>${esc(CO_.name||'')}</div></div>
  ${s.cc&&s.cc.trim()?`<div class="sw-cc">สำเนาเรียน ${esc(s.cc.trim())}</div>`:''}
  ${I.pm?`<div class="lt-ct">ผู้ประสานงาน: ${esc(I.pm)}${CO_.phone?` โทร ${esc(CO_.phone)}`:''}${CO_.email?` · ${esc(CO_.email)}`:''}</div>`:''}
  <div class="sw-rcv"><b>สำหรับผู้รับหนังสือ</b> ได้รับหนังสือฉบับนี้แล้ว &nbsp; ลงชื่อ ................................................ &nbsp; วันที่ ........./........./......... &nbsp; เวลา ...........</div></div>`}
PRINT.swl=id=>{const s=swArr().find(x=>x.id===id);return s?`<div data-doc-name="${esc([swK(s.kind)[2],s.no,P.name].join(' '))}">${swLetter(s)}</div>`:''};
document.head.insertAdjacentHTML('beforeend',`<style>
#print .sw .sw-t{width:100%;margin:10px 0 0;font-size:13px;line-height:1.5;border-collapse:collapse}
#print .sw .sw-t th,#print .sw .sw-t td{border:1px solid #9aa;padding:3px 6px}#print .sw .sw-t .r{text-align:right}
#print .sw .sw-cc{margin-top:18px;font-size:14px}
#print .sw .sw-rcv{margin-top:22px;padding-top:6px;border-top:1px dashed #999;font-size:12px;color:#333}
.pill.sw-warn{background:#FFF1D6;color:#8a5a00}.pill.sw-stop{background:#FBE1DE;color:#a3322a}.pill.sw-resume{background:#DDF3E4;color:#1f6b3a}.pill.sw-eot{background:#E2ECF8;color:#2d5b8f}
</style>`);

/* --- form codes, English titles, search --- */
{const i=FM_LIST.findIndex(e=>e[0]==='sc')+1;FM_LIST.splice(i,0,
  ['swwarn','LG',2,'หนังสือแจ้งเตือนก่อนหยุดงาน',/^หนังสือแจ้งเตือนก่อนหยุดงาน/],
  ['swstop','LG',3,'หนังสือแจ้งหยุดงาน',/^หนังสือแจ้งหยุดงาน/],
  ['swres','LG',4,'หนังสือแจ้งกลับเข้าทำงาน',/^หนังสือแจ้งกลับเข้าทำงาน/],
  ['sweot','LG',5,'หนังสือขอขยายระยะเวลาก่อสร้าง',/^หนังสือขอขยายระยะเวลา/])}
DOC_EN.unshift([/เตือนก่อนหยุดงาน/,'NOTICE OF INTENT TO SUSPEND WORK'],[/แจ้งหยุดงาน/,'NOTICE OF WORK SUSPENSION'],[/กลับเข้าทำงาน/,'NOTICE OF RESUMPTION OF WORK'],[/ขยายระยะเวลาก่อสร้าง/,'REQUEST FOR EXTENSION OF TIME']);
if(typeof SBSUB==='object')SBSUB['pj.forms']=(SBSUB['pj.forms']||'')+'|stop=หนังสือหยุดงาน';
if(typeof SBKW==='object')SBKW['pj.forms.stop']=(SBKW['pj.forms.stop']||'')+' หยุดงาน ระงับงาน หยุดทำงาน suspend suspension ค้างชำระ เบิกงวดไม่ได้ ไม่จ่ายเงิน ทวงเงิน กลับเข้าทำงาน ขยายเวลา ขยายระยะเวลา eot extension of time งดค่าปรับ เหตุสุดวิสัย พื้นที่ไม่พร้อม รอแบบ';
if(typeof I18N==='object'&&I18N.en&&I18N.en.x)Object.assign(I18N.en.x,{'หนังสือหยุดงาน':'Work stoppage letters','แจ้งเตือนก่อนหยุดงาน':'Notice before stopping','แจ้งหยุดงาน':'Stop work notice',
  'แจ้งกลับเข้าทำงาน':'Resume work notice','ขอขยายระยะเวลา':'Extension of time','พิมพ์หนังสือ':'Print letter','สรุปวันหยุดงาน (ใช้ขอขยายระยะเวลา)':'Days stopped (for extension of time)',
  'เหตุที่หยุดงาน':'Reason','อ้างข้อสัญญา':'Contract clause','สำเนาเรียน':'Copy to','ยังหยุดอยู่':'Still stopped'});
