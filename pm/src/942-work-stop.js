/* ---------- 4.62–4.63 หนังสือหยุดงาน ทวงเงิน และสัญญา: letters to the employer, kept on the project (user: "เพิ่มเอกสารการหยุดงาน ในกรณีต่างๆ เช่นเบิกงวดไม่ได้") ----------
   โครงการ › ออกเอกสาร › หนังสือหยุดงาน. One numbered list P.stops (SW-, counted company-wide) holds every kind (SWK):
   ทวงถามค่างวด (remind) → แจ้งเตือนก่อนหยุดงาน (warn) → แจ้งหยุดงาน (stop) → แจ้งกลับเข้าทำงาน (resume) → เรียกร้องดอกเบี้ยและค่าใช้จ่าย
   (claim), ขอขยายระยะเวลาก่อสร้าง (eot), ขอคืนเงินประกันผลงาน (ret) and บอกเลิกสัญญา (term).
   A letter's reason (SWR: ค้างชำระค่างวด, เลื่อนเช็ค/เช็คเด้ง, พื้นที่ไม่พร้อม, ผู้ว่าจ้างสั่งหยุด/แก้แบบ, รอแบบ/อนุมัติ, ความปลอดภัย,
   เหตุสุดวิสัย, อื่นๆ) writes the Thai wording; each has a contract clause field and its dates. Money letters name the claims picked
   from the project's ใบเบิกงวด (งวด, เลขที่, ยอดค้าง, วันครบกำหนด) in the text and as a table; claims not yet due can be picked too.
   A stop letter and the resume letter that points back to it (s.link) make one stoppage period; swPeriods() counts its days, and
   the summary card and the eot letter add them up (overlapping days once). The claim letter adds late-payment interest per claim
   (rate s.rate, default 5% a year, ป.พ.พ. ม.224) and a costs table s.cost for the days stopped.
   Prints use the project letterhead (phead), the Thai letter layout of 620 (.lt2), form codes in FM_LIST (938), the signer of 620
   (subSigner) with the e-signature place .lt-sign .lt-ln (860), and ◫ แบ่งจอ (941) through the พิมพ์ button in the title. */
const SWK=[['remind','ทวงถามค่างวด','หนังสือทวงถามการชำระเงินค่างวด'],['warn','แจ้งเตือนก่อนหยุดงาน','หนังสือแจ้งเตือนก่อนหยุดงาน'],['stop','แจ้งหยุดงาน','หนังสือแจ้งหยุดงาน'],
  ['resume','แจ้งกลับเข้าทำงาน','หนังสือแจ้งกลับเข้าทำงาน'],['claim','เรียกร้องดอกเบี้ย / ค่าใช้จ่าย','หนังสือเรียกร้องดอกเบี้ยและค่าใช้จ่ายจากการหยุดงาน'],
  ['eot','ขอขยายระยะเวลา','หนังสือขอขยายระยะเวลาก่อสร้าง'],['ret','ขอคืนเงินประกันผลงาน','หนังสือขอคืนเงินประกันผลงาน'],['term','บอกเลิกสัญญา','หนังสือบอกเลิกสัญญา']];
// l: menu name, c: clause example, why: the cause, ask: what the employer must do, till: stop until…, end: the cause is over, att: enclosures
const SWR={
  pay:{l:'ค้างชำระค่างวด / เบิกงวดไม่ได้',c:'เช่น ข้อ 4 การจ่ายเงิน',why:'ผู้ว่าจ้างยังมิได้ชำระเงินค่างานงวดที่ถึงกำหนดชำระแล้ว',
    ask:'ชำระเงินค่างานที่ค้างชำระทั้งหมด',till:'จะได้รับชำระเงินค่างานที่ค้างชำระครบถ้วน',end:'บริษัทได้รับชำระเงินค่างานที่ค้างชำระแล้ว',att:'สำเนาใบเบิกเงินงวด / ใบแจ้งหนี้ที่ค้างชำระ'},
  chq:{l:'เลื่อนเช็ค / เช็คเด้ง',c:'เช่น ข้อ 4 การจ่ายเงิน',why:'',
    ask:'ชำระเงินค่างานตามเช็คดังกล่าวเป็นเงินสดหรือโอนเข้าบัญชีของบริษัท',till:'จะได้รับชำระเงินตามเช็คดังกล่าวครบถ้วน',end:'บริษัทได้รับชำระเงินตามเช็คดังกล่าวแล้ว',att:'สำเนาเช็ค / ใบแจ้งการคืนเช็คของธนาคาร'},
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
const swR=s=>SWR[s.why]||SWR.other,swK=k=>SWK.find(x=>x[0]===k)||SWK[2];
const swPay=s=>s.why==='pay'||s.why==='chq';
// kinds that name claims (always for remind and term, for warn/stop when the reason is money); kinds without a reason
const swMoney=s=>s.kind==='remind'||s.kind==='term'||((s.kind==='warn'||s.kind==='stop')&&swPay(s));
const SWNOWHY=['claim','eot','ret'];
NO_CO['SW-']=p=>p.stops;
if(typeof PFX!=='undefined')PFX.push(['SW-','หนังสือหยุดงาน / ทวงเงิน / สัญญา']);
NEW.cost=()=>({desc:'',q:0,unit:'วัน',rate:0});
const swArr=()=>{P.stops=P.stops||[];return P.stops};
const swParty=()=>P.info.client||custName(P.info.cust)||'ผู้ว่าจ้าง';
function swNew(kind,from){const L=swArr(),d=today(),s={id:uid(),no:nextNo('SW-',L),kind,why:'pay',date:d,to:swParty(),cc:'ผู้ควบคุมงาน / ที่ปรึกษาโครงการ',clause:'',detail:'',nd:7,eff:'',from:'',link:'',bills:[],paidOn:'',att:'',ids:null};
  if(from)Object.assign(s,{why:from.why||'pay',to:from.to,cc:from.cc,clause:from.clause,detail:from.detail,bills:(from.bills||[]).slice(),link:from.id},
    from.why==='chq'?{chqT:from.chqT,chqBank:from.chqBank,chqNo:from.chqNo,chqDate:from.chqDate,chqAmt:from.chqAmt,chqNew:from.chqNew,chqWhy:from.chqWhy}:{});
  const money=!from&&['remind','warn','stop','term'].includes(kind);if(money)s.bills=swDefBills();
  if(kind==='warn')s.eff=addD(d,7);
  if(kind==='stop')s.eff=from&&okD(from.eff)&&from.eff>d?from.eff:d;
  if(kind==='resume'){s.eff=d;s.from=from?from.eff:''}
  if(kind==='eot'){s.why='';s.clause=(swArr().find(x=>x.kind!=='eot'&&x.clause)||{}).clause||''}
  if(kind==='claim'){const st=from&&from.kind==='stop'?from:from&&from.kind==='resume'?swArr().find(x=>x.id===from.link):(swPeriods().filter(x=>!x.open).pop()||{}).s;
    s.link=st?st.id:'';s.why=st?st.why:'pay';s.rate=5;s.nd=15;s.ib=null;s.cost=[];s.clause='';if(st)s.cost=swCostStd(st)}
  if(kind==='ret'){s.why='';s.ho=okD(P.info.handover)?P.info.handover:'';const ho=(P.fdoc&&P.fdoc.ho||[]).slice(-1)[0];s.wm=ho&&n(ho.wmon)?n(ho.wmon):12;s.nd=15}
  if(kind==='term'){s.eff=d;s.mtg=addD(d,7);s.link=''}
  s.att={eot:'สำเนาหนังสือแจ้งหยุดงานและแจ้งกลับเข้าทำงานตามตาราง',claim:'หลักฐานค่าใช้จ่ายระหว่างหยุดงาน (ใบเสร็จ ค่าแรง ค่าเช่า)',ret:'สำเนาหนังสือส่งมอบงาน / ใบรับรองการแก้ไขข้อบกพร่อง',
    term:'สำเนาหนังสือทวงถามและแจ้งเตือนที่อ้างถึง'}[kind]||swR(s).att;L.push(s);return s}

/* --- the claims a money letter names --- */
function swRow(b){const c=billCalc(b),due=billDue(P,b),paid=b.status==='paid';return {b,c,due,paid,o:paid?0:Math.max(0,c.net-billRecv(b))}}
// every claim not yet paid (drafts too, so a letter can be written before the claim is past due)
function swUnpaid(){return billsSorted().filter(b=>b.status!=='paid').map(swRow).filter(r=>r.o>0)}
function swOverdue(){const td=today();return swUnpaid().filter(r=>r.b.status!=='draft'&&r.due<td)}
// ticked on a new letter: the claims past due, or else the sent ones still unpaid
function swDefBills(){const od=swOverdue();return (od.length?od:swUnpaid().filter(r=>r.b.status!=='draft')).map(r=>r.b.id)}
function swBills(s){return (s.bills||[]).map(id=>P.bills.find(b=>b.id===id)).filter(Boolean).sort((a,b)=>(a.date||'')<(b.date||'')?-1:1).map(swRow)}
const swInst=b=>{const k=b.kind||'prog';if(k==='adv')return 'เงินล่วงหน้า';if(k==='ret')return 'เงินประกันผลงาน';try{return `งวดที่ ${subInfo(b).no}`}catch(e){return ''}};
const swAmt=r=>r.paid?r.c.net:r.o;
// the claims in one sentence: งวดที่ 2 ใบเบิกเงินเลขที่ INV-002 จำนวน … บาท ครบกำหนดชำระวันที่ … รวม …
function swBillTxt(B,at){if(!B.length)return '';const tot=sum(B,swAmt);
  return `ได้แก่ ${B.map(r=>`${swInst(r.b)} ใบเบิกเงินเลขที่ ${esc(r.b.no)} จำนวนเงิน ${fmt(swAmt(r),2)} บาท ครบกำหนดชำระวันที่ ${thDL(r.due)}${r.due<at?` (เกินกำหนด ${diffD(r.due,at)} วัน)`:''}`).join(' และ')} รวมเป็นเงินค้างชำระทั้งสิ้น ${fmt(tot,2)} บาท (${bahtText(tot)})`}
function swBillTb(B,at){if(!B.length)return '';return `<table class="sw-t"><thead><tr><th>งวด</th><th>ใบเบิกเงิน</th><th>ลงวันที่</th><th>ครบกำหนดชำระ</th><th>เกินกำหนด (วัน)</th><th>ค้างชำระ (บาท)</th></tr></thead><tbody>
  ${B.map(r=>`<tr><td>${swInst(r.b)}</td><td>${esc(r.b.no)}</td><td>${thD(r.b.date)}</td><td>${thD(r.due)}</td><td class="r">${Math.max(0,diffD(r.due,at))}</td><td class="r">${fmt(swAmt(r),2)}</td></tr>`).join('')}
  <tr><td colspan="5" class="r"><b>รวมค้างชำระ</b></td><td class="r"><b>${fmt(sum(B,swAmt),2)}</b></td></tr></tbody></table>`}
// the cheque, in words
function swChq(s){const x=[s.chqBank?`ธนาคาร${esc(s.chqBank)}`:'',s.chqNo?`เลขที่ ${esc(s.chqNo)}`:'',okD(s.chqDate)?`ลงวันที่ ${thDL(s.chqDate)}`:'',n(s.chqAmt)?`จำนวนเงิน ${fmt(s.chqAmt,2)} บาท`:''].filter(Boolean).join(' ');
  return s.chqT==='postpone'?`ผู้ว่าจ้างได้ขอเลื่อนการจ่ายเช็คค่างวด${x?' '+x:''} ออกไป${okD(s.chqNew)?`เป็นวันที่ ${thDL(s.chqNew)}`:''} ทำให้บริษัทยังไม่ได้รับชำระเงินค่างานตามกำหนด`
    :`เช็คค่างวดที่ผู้ว่าจ้างจ่ายให้บริษัท${x?' '+x:''} ธนาคารได้ปฏิเสธการจ่ายเงิน${s.chqWhy?` ด้วยเหตุผล “${esc(s.chqWhy)}”`:''} ทำให้บริษัทยังไม่ได้รับชำระเงินค่างานงวดดังกล่าว`}
const swWhy=s=>s.why==='chq'?swChq(s):swR(s).why||'';
const swChqLaw=s=>s.why==='chq'&&s.chqT!=='postpone'?' นอกจากนี้ บริษัทขอสงวนสิทธิ์ดำเนินการตามกฎหมาย รวมถึงพระราชบัญญัติว่าด้วยความผิดอันเกิดจากการใช้เช็ค พ.ศ. 2534':'';

/* --- interest and costs (claim) --- */
// claims paid late, or still unpaid after their due date, by the letter's date
function swLate(s){const at=s.date||today();return billsSorted().filter(b=>b.status!=='draft').map(swRow).map(r=>{const end=r.paid?(okD(r.b.paid)?r.b.paid:''):at;return Object.assign(r,{end,days:end?Math.max(0,diffD(r.due,end)):0})}).filter(r=>r.days>0)}
function swInt(s){const rt=n(s.rate);return swLate(s).filter(r=>!s.ib||s.ib.includes(r.b.id)).map(r=>Object.assign(r,{amt:swAmt(r),int:Math.round(swAmt(r)*rt/100*r.days/365*100)/100}))}
function swCostStd(st){const pr=swPeriods().find(x=>x.s.id===st.id),d=pr?Math.max(1,pr.d):1,D=(P.daily||[]).slice().sort((a,b)=>a.date<b.date?-1:1).slice(-10).map(x=>sum(x.men||[],m=>n(m.n))).filter(Boolean);
  const men=D.length?Math.round(sum(D,x=>x)/D.length):5;
  return [[`ค่าแรงคนงานที่ต้องรอระหว่างหยุดงาน (${men} คน × ${d} วัน)`,men*d,'คน-วัน',500],['ค่าเช่าเครื่องมือ นั่งร้าน และเครื่องจักรที่ค้างอยู่ในหน้างาน',d,'วัน',1500],
    ['ค่าควบคุมงานและดูแลรักษาความปลอดภัยหน้างาน',d,'วัน',1000],['ค่าขนย้ายคนงานและเครื่องมือออกและกลับเข้าหน้างาน',1,'เที่ยว',5000]].map(([desc,q,unit,rate])=>({id:uid(),desc,q,unit,rate}))}
const swCostTot=s=>sum(s.cost||[],x=>n(x.q)*n(x.rate));

/* --- retention --- */
function swRet(){const R=billsSorted().filter(b=>(b.kind||'prog')==='prog'&&b.status!=='draft').map(b=>({b,ret:billCalc(b).ret})).filter(x=>x.ret>0);
  const back=sum(P.bills.filter(b=>b.kind==='ret'&&b.status==='paid'),b=>billCalc(b).amt);return {R,tot:sum(R,x=>x.ret),back,due:Math.max(0,sum(R,x=>x.ret)-back)}}
const swLG=()=>(CO().lg||[]).filter(x=>x.proj===P.id&&(x.kind==='warr'||x.kind==='ret')&&(typeof LGLIVE==='undefined'||LGLIVE.includes(x.status)));
const swRetEnd=s=>okD(s.ho)?addMo(s.ho,n(s.wm)||12):'';

// every stop letter with the resume letter that ends it: {s, r, a: first stopped day, z: day work resumes (or today), d: days stopped, open}
function swPeriods(){const L=swArr(),td=today();return L.filter(s=>s.kind==='stop'&&okD(s.eff)).sort((a,b)=>a.eff<b.eff?-1:1).map(s=>{
  const r=L.find(x=>x.kind==='resume'&&x.link===s.id&&okD(x.eff)),z=r?r.eff:td;return {s,r,a:s.eff,z,d:Math.max(0,diffD(s.eff,z)),open:!r}})}
// days stopped across several periods, a day that two periods share counted once
function swUnion(R){const I=R.map(x=>[x.a,x.z]).filter(([a,z])=>z>a).sort((x,y)=>x[0]<y[0]?-1:1);let t=0,ca='',cz='';
  I.forEach(([a,z])=>{if(!ca){ca=a;cz=z;return}if(a<=cz){if(z>cz)cz=z}else{t+=diffD(ca,cz);ca=a;cz=z}});return ca?t+diffD(ca,cz):0}
const swFin=()=>okD(P.info.finish)?P.info.finish:'';
const swRef=id=>{const x=swArr().find(y=>y.id===id);return x?`หนังสือที่ ${x.no} ลงวันที่ ${thDL(x.date)}`:''};
// the earlier letters a termination cites: reminders, warnings and stops up to its date
const swPrior=s=>swArr().filter(x=>x.id!==s.id&&['remind','warn','stop'].includes(x.kind)&&(x.date||'')<=(s.date||today())).sort((a,b)=>a.date<b.date?-1:1);

/* --- the page --- */
function swPage(){const L=swArr(),sel=L.find(x=>x.id===S.sel.sw)||L[L.length-1],R=swPeriods(),tot=swUnion(R),fin=swFin(),op=R.filter(x=>x.open),od=swOverdue();
  const kn=k=>`<span class="pill sw-${k}">${swK(k)[1]}</span>`,add=(k,pri)=>`<button type="button" class="btn sm${pri?' pri':''}" data-a="swAdd" data-k="${k}">+ ${swK(k)[1]}</button>`;
  const list=`<section class="card"><h2><span>หนังสือหยุดงาน ทวงเงิน และสัญญา</span><small>${L.length} ฉบับ · เลขที่รันทั้งบริษัท แก้ได้</small></h2>
    <div class="sw-add"><span class="muted">ทวงเงิน / หยุดงาน</span>${add('remind',1)}${add('warn')}${add('stop')}${add('resume')}<span class="muted">หลังหยุดงาน</span>${add('claim')}${add('eot')}<span class="muted">ปิดงาน</span>${add('ret')}${add('term')}</div>
    ${od.length&&!L.length?`<p class="hint" style="margin:0 0 8px">โครงการนี้มีใบเบิกงวดเลยกำหนดชำระ ${od.length} ใบ รวม ${fmt(sum(od,r=>r.o),2)} บาท เริ่มจาก <b>ทวงถามค่างวด</b> แล้วจึง <b>แจ้งเตือนก่อนหยุดงาน</b> และ <b>แจ้งหยุดงาน</b> เมื่อพ้นกำหนด</p>`:''}
    <div class="tw"><table><thead><tr><th>เลขที่</th><th>วันที่</th><th>ประเภท</th><th>เหตุ</th><th>มีผลวันที่</th><th></th></tr></thead><tbody>
    ${L.length?L.slice().reverse().map(s=>`<tr class="${sel&&sel.id===s.id?'sel':''}"><td><button type="button" class="btn ghost sm" data-a="sel" data-k="sw" data-id="${s.id}"><b>${esc(s.no)}</b></button></td><td>${thD(s.date)}</td><td>${kn(s.kind)}</td>
      <td>${SWNOWHY.includes(s.kind)?'–':esc(swR(s).l)}</td><td>${okD(s.eff)&&['warn','stop','resume','term'].includes(s.kind)?thD(s.eff):''}</td><td><button type="button" class="x" data-a="delRow" data-c="stops" data-id="${s.id}" aria-label="ลบ">✕</button></td></tr>`).join('')
      :'<tr><td colspan="6" class="empty">ยังไม่มีหนังสือ</td></tr>'}</tbody></table></div></section>`;
  const sum_=`<section class="card"><h2><span>สรุปวันหยุดงาน (ใช้ขอขยายระยะเวลา)</span><small>นับจากวันที่หยุดงานในหนังสือแจ้งหยุดงาน ถึงวันที่กลับเข้าทำงาน${op.length?' · ยังหยุดอยู่นับถึงวันนี้':''}</small><span class="sp"></span>
    ${R.length?`<button type="button" class="btn sm" data-a="swAdd" data-k="eot">+ หนังสือขอขยายระยะเวลา ${tot} วัน</button>`:''}</h2>
    ${R.length?`<div class="tw"><table><thead><tr><th>หนังสือแจ้งหยุด</th><th>เหตุ</th><th>หยุดตั้งแต่</th><th>กลับเข้าทำงาน</th><th class="r">วัน</th><th></th></tr></thead><tbody>
      ${R.map(x=>`<tr><td>${esc(x.s.no)}</td><td>${esc(swR(x.s).l)}</td><td>${thD(x.a)}</td><td>${x.open?'<span class="pill warn">ยังหยุดอยู่</span>':`${thD(x.z)} <small class="muted">(${esc(x.r.no)})</small>`}</td><td class="r"><b>${x.d}</b></td>
        <td>${x.open?`<button type="button" class="btn sm" data-a="swAdd" data-k="resume" data-from="${x.s.id}">+ แจ้งกลับเข้าทำงาน</button>`:`<button type="button" class="btn sm" data-a="swAdd" data-k="claim" data-from="${x.s.id}">+ เรียกร้องค่าใช้จ่าย</button>`}</td></tr>`).join('')}
      <tr class="grp"><td colspan="4">รวม${tot!==sum(R,x=>x.d)?' (วันที่ซ้อนกันนับครั้งเดียว)':''}</td><td class="r"><b>${tot}</b></td><td></td></tr></tbody></table></div>
      <p class="hint">${fin?`กำหนดแล้วเสร็จตามสัญญา ${thDL(fin)} · ถ้าได้ขยายเวลาครบ ${tot} วัน เป็น <b>${thDL(addD(fin,tot))}</b>`:'ใส่วันสิ้นสุดสัญญาที่ ข้อมูลโครงการ เพื่อให้หนังสือคำนวณกำหนดแล้วเสร็จใหม่'}
      ${isGovP()?' · สัญญาภาครัฐ: แจ้งเหตุพร้อมหลักฐานเป็นหนังสือภายใน 15 วันนับแต่เหตุสิ้นสุด มิฉะนั้นอาจขอขยายเวลาไม่ได้':' · ยื่นขอขยายเวลาตามระยะเวลาที่สัญญากำหนด เก็บหนังสือและหลักฐานทุกฉบับไว้'}</p>`
    :'<p class="hint">ยังไม่มีหนังสือแจ้งหยุดงาน เมื่อออกหนังสือแจ้งหยุดงานและแจ้งกลับเข้าทำงาน จำนวนวันจะขึ้นที่นี่ให้อัตโนมัติ</p>'}</section>`;
  return list+(sel?swCard(sel):'')+sum_}
// the claims to name: every unpaid claim (past due first), plus any already ticked
function swBillPick(s){const have=new Set(s.bills||[]),td=s.date||today(),U=swUnpaid(),R=[...U,...P.bills.filter(b=>have.has(b.id)&&!U.some(r=>r.b.id===b.id)).map(swRow)];
  const st=r=>r.paid?'<span class="pill ok">รับเงินแล้ว</span>':r.b.status==='draft'?'<span class="pill">ใบร่าง</span>':r.due<td?`<span class="pill bad">เกินกำหนด ${diffD(r.due,td)} วัน</span>`:`<span class="pill">ครบกำหนด ${thD(r.due)}</span>`;
  return `<h3 class="fm-g">งวดที่ค้างชำระ (ติ๊กใบที่จะใส่ในหนังสือ · พิมพ์ทั้งในเนื้อความและเป็นตาราง)</h3><div class="tw"><table><thead><tr><th></th><th>งวด</th><th>เลขที่</th><th>วันที่</th><th>ครบกำหนด</th><th>สถานะ</th><th class="r">ค้างชำระ</th></tr></thead><tbody>
    ${R.length?R.map(r=>`<tr><td class="c"><input type="checkbox" data-a="swBill" data-id="${s.id}" data-k="${r.b.id}"${have.has(r.b.id)?' checked':''} aria-label="เลือก ${esc(r.b.no)}"></td><td>${swInst(r.b)}</td><td>${esc(r.b.no)}</td><td>${thD(r.b.date)}</td><td>${thD(r.due)}</td><td>${st(r)}</td><td class="r">${fmt(swAmt(r),2)}</td></tr>`).join('')
      +`<tr class="grp"><td colspan="6">รวมที่เลือก</td><td class="r"><b>${fmt(sum(swBills(s),swAmt),2)}</b></td></tr>`
      :'<tr><td colspan="7" class="empty">ไม่มีใบเบิกงวดที่ยังไม่ได้รับเงิน (สร้างใบเบิกที่ งบและเบิกงวด › เบิกงวด)</td></tr>'}</tbody></table></div>`}
function swCard(s){const b=`stops.${s.id}`,R=swR(s),k=s.kind,L=swArr(),t=swK(k)[2];
  const inp=(f,l,a='',cl='')=>`<label${cl?` class="${cl}"`:''}>${l}<input data-p="${b}.${f}" value="${esc(s[f]??'')}"${a}></label>`,dt=(f,l)=>`<label>${l}<input type="date" data-p="${b}.${f}" value="${esc(s[f]||'')}"></label>`,
    num=(f,l,d)=>`<label>${l}<input data-p="${b}.${f}" data-t="num" inputmode="decimal" value="${esc(s[f]??d)}"></label>`;
  const lk=k==='stop'?L.filter(x=>x.kind==='warn'||x.kind==='remind'):k==='warn'?L.filter(x=>x.kind==='remind'):k==='resume'||k==='claim'?L.filter(x=>x.kind==='stop'):[];
  const P_=swPeriods(),me=k==='stop'?P_.find(x=>x.s.id===s.id):k==='resume'?P_.find(x=>x.r&&x.r.id===s.id):null;
  let extra='',info='';
  if(swMoney(s))extra=swBillPick(s);
  if(k==='claim'){const late=swLate(s),I=swInt(s),ib=s.ib,pr=P_.find(x=>x.s.id===s.link),cost=s.cost=s.cost||[];
    const cols=[{k:'desc',h:'รายการค่าใช้จ่าย',w:320},{k:'q',h:'จำนวน',t:'num',w:80},{k:'unit',h:'หน่วย',w:80},{k:'rate',h:'ราคาต่อหน่วย',t:'num',w:100},{h:'จำนวนเงิน',t:'calc',r:1,f:r=>fmt(n(r.q)*n(r.rate),2)}];
    extra=`<h3 class="fm-g">1. ดอกเบี้ยจากการชำระเงินล่าช้า (ร้อยละ ${fmtq(n(s.rate))} ต่อปี)</h3><div class="tw"><table><thead><tr><th></th><th>งวด</th><th>เลขที่</th><th>ครบกำหนด</th><th>ชำระเมื่อ</th><th class="r">ล่าช้า (วัน)</th><th class="r">ยอดเงิน</th><th class="r">ดอกเบี้ย</th></tr></thead><tbody>
      ${late.length?late.map(r=>{const on=!ib||ib.includes(r.b.id),x=I.find(y=>y.b.id===r.b.id);return `<tr><td class="c"><input type="checkbox" data-a="swIB" data-id="${s.id}" data-k="${r.b.id}"${on?' checked':''} aria-label="เลือก ${esc(r.b.no)}"></td><td>${swInst(r.b)}</td><td>${esc(r.b.no)}</td><td>${thD(r.due)}</td><td>${r.paid?thD(r.end):'<span class="pill bad">ยังไม่ชำระ</span>'}</td><td class="r">${r.days}</td><td class="r">${fmt(swAmt(r),2)}</td><td class="r">${x?fmt(x.int,2):''}</td></tr>`}).join('')
        +`<tr class="grp"><td colspan="7">รวมดอกเบี้ย</td><td class="r"><b>${fmt(sum(I,x=>x.int),2)}</b></td></tr>`
        :'<tr><td colspan="8" class="empty">ไม่มีงวดที่ชำระล่าช้า (นับจากวันครบกำหนดตามเครดิตลูกค้า ถึงวันที่รับเงินหรือวันที่ของหนังสือ)</td></tr>'}</tbody></table></div>
    <h3 class="fm-g">2. ค่าใช้จ่ายระหว่างหยุดงาน${pr?` (${esc(pr.s.no)} · ${pr.d} วัน)`:''}</h3>${gtable(`${b}.cost`,cost,cols,{empty:'ยังไม่มีรายการ'})}
    <div class="row" style="margin-top:8px"><button type="button" class="btn sm" data-a="add" data-c="${b}.cost">+ เพิ่มรายการ</button>${s.link?`<button type="button" class="btn sm" data-a="swCostStd" data-id="${s.id}">ใส่รายการตัวอย่างตามวันหยุดงาน</button>`:''}
      <span class="hint" style="margin:0">รวมค่าใช้จ่าย <b>${fmt(swCostTot(s),2)}</b> · รวมที่เรียกร้อง <b>${fmt(sum(I,x=>x.int)+swCostTot(s),2)}</b> บาท</span></div>`}
  if(k==='ret'){const r=swRet(),lg=swLG(),end=swRetEnd(s);
    info=`<div class="sw-info">เงินประกันผลงานที่ถูกหัก ${r.R.length} งวด รวม <b>${fmt(r.tot,2)}</b> บาท${r.back?` · คืนแล้ว ${fmt(r.back,2)}`:''} · ขอคืน <b>${fmt(r.due,2)}</b> บาท
      ${lg.length?` · หนังสือค้ำประกัน ${lg.map(x=>`${esc(x.bank)} ${esc(x.lgNo||x.no)} ${fmt(x.amt,0)} บาท`).join(', ')}`:''}
      ${end?(end>(s.date||today())?` · <b style="color:var(--danger)">ยังไม่ครบระยะรับประกัน (ครบ ${thDL(end)})</b>`:` · ครบระยะรับประกัน ${thDL(end)}`):' · ใส่วันที่ส่งมอบงาน'}
      ${(P.punch||[]).filter(x=>x.status!=='done'&&x.status!=='closed').length?` · <b style="color:var(--warn-c)">Punch list ค้าง ${(P.punch||[]).filter(x=>x.status!=='done'&&x.status!=='closed').length} รายการ</b>`:''}</div>`}
  if(k==='eot'){const ids=s.ids,R2=P_;extra=`<h3 class="fm-g">ช่วงที่หยุดงานที่ขอขยายเวลา</h3><div class="tw"><table><thead><tr><th></th><th>หนังสือแจ้งหยุด</th><th>เหตุ</th><th>หยุดตั้งแต่</th><th>กลับเข้าทำงาน</th><th class="r">วัน</th></tr></thead><tbody>
    ${R2.length?R2.map(x=>`<tr><td class="c"><input type="checkbox" data-a="swEotTog" data-id="${s.id}" data-k="${x.s.id}"${!ids||ids.includes(x.s.id)?' checked':''} aria-label="เลือก ${esc(x.s.no)}"></td><td>${esc(x.s.no)}</td><td>${esc(swR(x.s).l)}</td><td>${thD(x.a)}</td><td>${x.open?'<span class="pill warn">ยังหยุดอยู่</span>':thD(x.z)}</td><td class="r">${x.d}</td></tr>`).join('')
      :'<tr><td colspan="6" class="empty">ยังไม่มีหนังสือแจ้งหยุดงาน</td></tr>'}</tbody></table></div>`}
  if(k==='term'){const pr=swPrior(s);info=`<div class="sw-info">${pr.length?`อ้างถึงหนังสือก่อนหน้า ${pr.length} ฉบับ: ${pr.map(x=>`${esc(x.no)} (${swK(x.kind)[1]})`).join(', ')}`:'<b style="color:var(--warn-c)">ยังไม่มีหนังสือทวงถามหรือแจ้งเตือนก่อนหน้า</b> ควรส่งหนังสือทวงถามและกำหนดเวลาให้ปฏิบัติก่อนบอกเลิกสัญญา'}</div>`}
  const go=(kk,l)=>`<button type="button" class="btn sm" data-a="swAdd" data-k="${kk}" data-from="${s.id}">ต่อ: ${l} →</button>`;
  const nextB=k==='remind'?go('warn','แจ้งเตือนก่อนหยุดงาน'):k==='warn'?go('stop','แจ้งหยุดงาน'):k==='stop'&&me&&me.open?go('resume','แจ้งกลับเข้าทำงาน'):k==='stop'||k==='resume'&&s.link?go('claim','เรียกร้องค่าใช้จ่าย'):'';
  const chq=s.why==='chq'&&!SWNOWHY.includes(k)?`<label>เช็ค<select data-p="${b}.chqT"><option value="bounce"${s.chqT!=='postpone'?' selected':''}>ธนาคารคืนเช็ค (เช็คเด้ง)</option><option value="postpone"${s.chqT==='postpone'?' selected':''}>ผู้ว่าจ้างขอเลื่อนเช็ค</option></select></label>
    ${inp('chqBank','ธนาคาร',' placeholder="เช่น กสิกรไทย สาขาสระบุรี"')}${inp('chqNo','เลขที่เช็ค')}${dt('chqDate','ลงวันที่ในเช็ค')}${num('chqAmt','จำนวนเงินในเช็ค (บาท)','')}
    ${s.chqT==='postpone'?dt('chqNew','ขอเลื่อนเป็นวันที่'):inp('chqWhy','เหตุผลที่ธนาคารคืนเช็ค',' placeholder="เช่น โปรดติดต่อผู้สั่งจ่าย / เงินในบัญชีไม่พอจ่าย"','w2')}`:'';
  return `<section class="card" id="swCard"><h2><span>${esc(s.no)} · ${t}</span>${me?`<small>หยุดงาน ${me.d} วัน${me.open?' (ยังหยุดอยู่)':''}</small>`:''}<span class="sp"></span>
    <button type="button" class="btn sm pri" data-a="print" data-k="swl" data-id="${s.id}">พิมพ์หนังสือ</button>${nextB}</h2>
  ${info}
  <div class="form">${inp('no','เลขที่')}${dt('date','ลงวันที่')}
    <label>ประเภท<select data-p="${b}.kind">${SWK.map(([kk,l])=>`<option value="${kk}"${kk===k?' selected':''}>${l}</option>`).join('')}</select></label>
    ${SWNOWHY.includes(k)?'':`<label class="w2">${k==='remind'?'เรื่องที่ทวงถาม':k==='term'?'เหตุที่บอกเลิกสัญญา':'เหตุที่หยุดงาน'}<select data-p="${b}.why">${Object.entries(SWR).filter(([kk])=>k!=='remind'||kk==='pay'||kk==='chq').map(([kk,x])=>`<option value="${kk}"${kk===s.why?' selected':''}>${x.l}</option>`).join('')}</select></label>`}
    ${chq}
    ${inp('to','เรียน','','w2')}${inp('cc','สำเนาเรียน','','w2')}
    ${inp('clause','อ้างข้อสัญญา',` placeholder="${esc(k==='eot'?'เช่น ข้อ 20 การงดหรือลดค่าปรับและการขยายเวลา':k==='claim'?'เช่น ข้อ 4 การจ่ายเงิน (ดอกเบี้ยตามสัญญา)':k==='ret'?'เช่น ข้อ 8 เงินประกันผลงาน':k==='term'?'เช่น ข้อ 22 การบอกเลิกสัญญา':R.c)}"`)}
    ${k==='warn'?num('nd','ให้แก้ไขภายใน (วัน)',7)+dt('eff','จะหยุดงานตั้งแต่วันที่'):''}
    ${k==='remind'||k==='claim'||k==='ret'?num('nd','ให้ชำระภายใน (วัน)',k==='remind'?7:15):''}
    ${k==='claim'?num('rate','ดอกเบี้ย (% ต่อปี)',5):''}
    ${k==='ret'?dt('ho','วันที่ส่งมอบงาน')+num('wm','รับประกันผลงาน (เดือน)',12)+inp('lgNo','หนังสือค้ำประกันผลงานเลขที่ (ถ้ามี)'):''}
    ${k==='stop'?dt('eff','หยุดงานตั้งแต่วันที่'):''}
    ${k==='term'?dt('eff','เลิกสัญญามีผลวันที่')+dt('mtg','นัดตรวจวัดผลงานร่วมกันวันที่'):''}
    ${k==='resume'?dt('from','หยุดงานตั้งแต่วันที่')+dt('eff','กลับเข้าทำงานวันที่')+(swPay(s)?dt('paidOn','ได้รับชำระเงินวันที่'):''):''}
    ${lk.length?`<label class="w2">${k==='claim'?'ช่วงที่หยุดงาน (หนังสือแจ้งหยุด)':'อ้างหนังสือก่อนหน้า'}<select data-p="${b}.link"><option value="">–</option>${lk.map(x=>`<option value="${x.id}"${x.id===s.link?' selected':''}>${esc(x.no)} · ${swK(x.kind)[1]} ${thD(x.date)}</option>`).join('')}</select></label>`:''}
    <label class="full">${SWNOWHY.includes(k)||k==='remind'?'รายละเอียดเพิ่มเติม':s.why==='other'?'เหตุ (เขียนเอง)':'รายละเอียดเพิ่มเติม (ต่อท้ายเหตุ)'}<textarea data-p="${b}.detail" rows="3" placeholder="${esc(k==='eot'?'เช่น ผลกระทบต่อแผนงาน งานที่ต้องเลื่อน':SWNOWHY.includes(k)||k==='remind'||swPay(s)?'ถ้ามี':R.why?'เช่น '+(s.why==='dwg'?'RFI-004 ตำแหน่งท่อน้ำยาชั้น 3 ส่งเมื่อ 2 ต.ค. ยังไม่ได้คำตอบ':s.why==='site'?'พื้นที่ชั้น 5 ยังมีผู้รับเหมางานโครงสร้างทำงานอยู่':'ระบุเหตุการณ์ วันที่ และผลกระทบต่องาน'):'เขียนเหตุ')}">${esc(s.detail||'')}</textarea></label>
    <label class="full">สิ่งที่ส่งมาด้วย (บรรทัดละรายการ)<textarea data-p="${b}.att" rows="2">${esc(s.att||'')}</textarea></label></div>
  ${extra}
  <p class="hint">${{remind:'หนังสือทวงถามแบบสุภาพ ส่งก่อนแจ้งเตือน · ไม่ได้รับชำระภายในกำหนด กด <b>ต่อ: แจ้งเตือนก่อนหยุดงาน</b>',warn:'ส่งหนังสือเตือนก่อน ให้เวลาผู้ว่าจ้างแก้ไขตามที่สัญญากำหนด แล้วกด <b>ต่อ: แจ้งหยุดงาน</b> เมื่อพ้นกำหนด',
    stop:'วันที่หยุดงานคือวันแรกที่ไม่ได้ทำงาน · เมื่อกลับเข้าทำงานกด <b>ต่อ: แจ้งกลับเข้าทำงาน</b> โปรแกรมนับวันหยุดให้',resume:'จำนวนวันหยุด = ตั้งแต่วันที่หยุดงาน ถึงวันก่อนกลับเข้าทำงาน',
    claim:'ดอกเบี้ยผิดนัดตามกฎหมายร้อยละ 5 ต่อปี (ป.พ.พ. มาตรา 224) ถ้าสัญญากำหนดอัตราไว้ ให้ใช้อัตราตามสัญญา · ค่าใช้จ่ายใส่ตามจริงพร้อมหลักฐาน',eot:'เลือกช่วงที่หยุดงาน โปรแกรมรวมวันและคำนวณกำหนดแล้วเสร็จใหม่ให้',
    ret:'ยอดเงินประกันมาจากใบเบิกงวดที่ส่งแล้ว (ร้อยละตาม ข้อมูลโครงการ) หักใบเบิกคืนเงินประกันที่รับเงินแล้ว',term:'การบอกเลิกสัญญาย้อนกลับไม่ได้ ควรปรึกษาทนายความก่อนส่ง และส่งแบบมีหลักฐานการรับ (ไปรษณีย์ลงทะเบียนตอบรับ)'}[k]||''} · ถ้อยคำเป็นแบบทั่วไป ตรวจกับข้อสัญญาจริงก่อนส่ง</p></section>`}
ACT.swAdd=b=>{const from=b.dataset.from&&swArr().find(x=>x.id===b.dataset.from),s=swNew(b.dataset.k||'warn',from);S.sel.sw=s.id;save();render();
  const c=$('#swCard');if(c)c.scrollIntoView({block:'start'});toast(`${s.no} · ${swK(s.kind)[2]}`)};
ACT.swBill=b=>{const s=swArr().find(x=>x.id===b.dataset.id);if(!s)return;s.bills=s.bills||[];const i=s.bills.indexOf(b.dataset.k);i<0?s.bills.push(b.dataset.k):s.bills.splice(i,1);save();render()};
ACT.swIB=b=>{const s=swArr().find(x=>x.id===b.dataset.id);if(!s)return;const all=swLate(s).map(r=>r.b.id);let ids=s.ib||all.slice();const i=ids.indexOf(b.dataset.k);i<0?ids.push(b.dataset.k):ids.splice(i,1);
  s.ib=all.every(x=>ids.includes(x))?null:ids;save();render()};
ACT.swCostStd=b=>{const s=swArr().find(x=>x.id===b.dataset.id),st=s&&swArr().find(x=>x.id===s.link);if(!st)return;if((s.cost||[]).length&&!confirm('แทนที่รายการเดิม?'))return;s.cost=swCostStd(st);save();render();toast('ใส่รายการตัวอย่างแล้ว แก้จำนวนและราคาตามจริง')};
ACT.swEotTog=b=>{const s=swArr().find(x=>x.id===b.dataset.id);if(!s)return;const all=swPeriods().map(x=>x.s.id);let ids=s.ids||all.slice();const i=ids.indexOf(b.dataset.k);i<0?ids.push(b.dataset.k):ids.splice(i,1);
  s.ids=ids.length===all.length&&all.every(x=>ids.includes(x))?null:ids;save();render()};
// a new reason brings its own enclosure line, unless one was typed; a money reason ticks the unpaid claims
HOOK.push((p,v)=>{const m=String(p).match(/^stops\.([^.]+)\.why$/);if(!m)return;const s=swArr().find(x=>x.id===m[1]);if(!s)return;
  if(!s.att||Object.values(SWR).some(r=>r.att===s.att))s.att=(SWR[v]||SWR.other).att;if(swMoney(s)&&!(s.bills||[]).length)s.bills=swDefBills()});
HOOK.push((p,v)=>{const m=String(p).match(/^stops\.([^.]+)\.(nd|date)$/);if(!m)return;const s=swArr().find(x=>x.id===m[1]);if(s&&s.kind==='warn'&&okD(s.date))s.eff=addD(s.date,n(s.nd)||7)});
HOOK.push((p,v)=>{const m=String(p).match(/^stops\.([^.]+)\.kind$/);if(!m)return;const s=swArr().find(x=>x.id===m[1]);if(!s)return;
  if(swMoney(s)&&!(s.bills||[]).length)s.bills=swDefBills();if(s.kind==='remind'&&!swPay(s))s.why='pay';if(s.kind==='claim'){if(s.rate==null)s.rate=5;s.cost=s.cost||[]}});

// the ออกเอกสาร tab gets หนังสือหยุดงาน after its four forms (fdView knows only FD's kinds, so this tab is drawn here)
{const sb=subTabs;subTabs=function(k,list){if(k==='forms'&&!list.some(x=>x[0]==='stop'))list=[...list,['stop','หนังสือหยุดงาน']];return sb(k,list)}}
{const f=VIEWS.forms;VIEWS.forms=()=>{if(S.sub.forms!=='stop')return f();const {cur,html}=subTabs('forms',[['dn','ใบส่งของ'],['wo','ใบสั่งงาน'],['sc','สัญญาผู้รับเหมาช่วง'],['ho','ใบส่งมอบงาน']]);
  return cur==='stop'?html+swPage():f()}}
// a project that is stopped says so on its overview
{const f=VIEWS.dash;VIEWS.dash=function(){const h=f.apply(this,arguments);if(!P||!P.stops||!P.stops.length)return h;const op=swPeriods().filter(x=>x.open&&x.a<=today());if(!op.length)return h;const x=op[op.length-1];
  return `<section class="card" style="border-color:var(--warn-c)"><h2><span>หยุดงานอยู่ ${x.d} วัน</span><small>ตั้งแต่ ${thDL(x.a)} · ${esc(swR(x.s).l)} · ${esc(x.s.no)}</small><span class="sp"></span>
    <button type="button" class="btn sm" data-a="go" data-m="pj" data-k="forms" data-s="stop">หนังสือหยุดงาน</button></h2></section>`+h}}

/* --- the letter --- */
function swLetter(s){const I=P.info,CO_=CO(),[sn,sr]=subSigner(),R=swR(s),k=s.kind,t=swK(k)[2],fin=swFin(),gov=isGovP(),party=esc(s.to||swParty()),at=s.date||today();
  const nm=String(P.name||'').trim(),cut=nm.indexOf(' - '),pjN=cut>0?nm.slice(0,cut).trim():'',job=cut>0?nm.slice(cut+3).trim():nm,what=pjN?`${esc(job)} โครงการ ${esc(pjN)}`:esc(nm);
  const row=(a,v)=>`<div class="lt-r"><b>${a}</b><div>${v}</div></div>`,p=x=>x?`<p class="lt-p">${x}</p>`:'',nd=n(s.nd)||7;
  const dtl=s.detail&&s.detail.trim()?esc(s.detail.trim()).replace(/\n/g,' '):'',cl=String(s.clause||'').trim();
  const B=swMoney(s)?swBills(s):[],btx=swBillTxt(B,at),tb=swBillTb(B,at),owe=sum(B,swAmt);
  // the cause: the reason's words, the claims it is about, then what was typed
  let why=swWhy(s);if(swPay(s)&&btx)why+=` ${btx}`;if(dtl)why+=`${why?' ':''}${s.why==='other'||!why?'':'กล่าวคือ '}${dtl}`;
  const refs=[I.contractNo?`สัญญาจ้างเลขที่ ${esc(I.contractNo)}${okD(I.signed)?` ลงวันที่ ${thDL(I.signed)}`:''}${cl?` ${esc(cl)}`:''}`:cl?`สัญญาจ้าง ${esc(cl)}`:''];
  const per=swPeriods(),me=k==='resume'?(per.find(x=>x.r&&x.r.id===s.id)||null):null,lnk=s.link&&swArr().find(x=>x.id===s.link);
  if(k==='term')swPrior(s).forEach(x=>refs.push(swRef(x.id)));else if(lnk)refs.push(swRef(lnk.id));
  const att=String(s.att||'').split('\n').map(x=>x.trim()).filter(Boolean);
  const law=swPay(s)&&['warn','stop'].includes(k)?' ซึ่งเป็นสิทธิของคู่สัญญาในสัญญาต่างตอบแทนที่จะไม่ชำระหนี้ตอบแทนจนกว่าอีกฝ่ายจะชำระหนี้ ตามประมวลกฎหมายแพ่งและพาณิชย์ มาตรา 369':'';
  const intro=`ตามที่ ${esc(CO_.name||'บริษัท')} ได้รับจ้าง${pjN?'':'งาน'} ${what}${I.site?` ณ ${esc(I.site)}`:''} จาก ${party}${refs[0]?' ตามสัญญาที่อ้างถึง':''}${fin&&!['ret'].includes(k)?` กำหนดแล้วเสร็จวันที่ ${thDL(fin)}`:''} นั้น`;
  let subj='',body='';
  if(k==='remind'){subj=`ทวงถามการชำระเงินค่างวด ${what}`;
    body=p(intro)+p(s.why==='chq'?`บัดนี้ ${swChq(s)}${btx?` ${btx}`:''}${dtl?` ${dtl}`:''}`:`บริษัทได้ส่งงานและวางบิลเรียกเก็บเงินค่างานตามสัญญาแล้ว แต่จนถึงวันที่ออกหนังสือฉบับนี้ บริษัทยังไม่ได้รับชำระเงิน${btx?` ${btx}`:''}${dtl?` ${dtl}`:''}`)+tb+
      p(`บริษัทจึงขอความกรุณาให้${party}${s.why==='chq'?R.ask:'ชำระเงินค่างานดังกล่าว'}${owe?` จำนวน ${fmt(owe,2)} บาท`:''} ภายใน ${nd} วัน นับแต่วันที่ได้รับหนังสือฉบับนี้ เพื่อให้บริษัทสามารถดำเนินงานได้ต่อเนื่องตามแผนงาน หากท่านได้ชำระเงินแล้ว บริษัทขออภัยมา ณ ที่นี้ และโปรดแจ้งหลักฐานการชำระเงินให้บริษัททราบด้วย${swChqLaw(s)}`)+
      p('จึงเรียนมาเพื่อโปรดพิจารณาดำเนินการ และขอขอบคุณมา ณ โอกาสนี้')}
  else if(k==='warn'){const eff=okD(s.eff)?s.eff:addD(at,nd);subj=`แจ้งเตือนให้แก้ไขเหตุขัดข้อง ก่อนหยุดงาน ${what}`;
    body=p(intro)+p(`บัดนี้ ${why||'มีเหตุขัดข้องที่ทำให้บริษัทไม่สามารถทำงานต่อไปได้ตามปกติ'}${swPay(s)?' ทำให้บริษัทขาดเงินทุนหมุนเวียนสำหรับค่าวัสดุและค่าแรงงาน':''}`)+tb+
      (lnk?p(`บริษัทได้มี${swRef(lnk.id)} ทวงถามแล้ว แต่จนถึงวันที่ออกหนังสือฉบับนี้ ยังไม่ได้รับการแก้ไข`):'')+
      p(`บริษัทจึงขอให้${party}${R.ask}${swPay(s)&&owe?` จำนวน ${fmt(owe,2)} บาท`:''} ภายใน ${nd} วัน นับแต่วันที่ได้รับหนังสือฉบับนี้ หากพ้นกำหนดดังกล่าวแล้วยังไม่ได้รับการแก้ไข บริษัทมีความจำเป็นต้องหยุดงานตั้งแต่วันที่ ${thDL(eff)} เป็นต้นไป จนกว่า${R.till}${law} ทั้งนี้ บริษัทขอสงวนสิทธิ์ในการขอขยายระยะเวลาก่อสร้างตามจำนวนวันที่ต้องหยุดงาน และเรียกร้องค่าใช้จ่ายที่เกิดขึ้นจากการหยุดงาน${swChqLaw(s)}`)+
      p('จึงเรียนมาเพื่อโปรดพิจารณาดำเนินการ และขอขอบคุณมา ณ โอกาสนี้')}
  else if(k==='stop'){const eff=okD(s.eff)?s.eff:at;subj=`แจ้งหยุดงาน ${what}`;
    body=p(intro)+p(`${s.why==='order'?'บริษัทได้รับแจ้งว่า':'บัดนี้'} ${why||'มีเหตุขัดข้องที่ทำให้บริษัทไม่สามารถทำงานต่อไปได้'}${swPay(s)?' ทำให้บริษัทขาดเงินทุนหมุนเวียนสำหรับค่าวัสดุและค่าแรงงาน':''}`)+tb+
      (lnk?p(`บริษัทได้มี${swRef(lnk.id)} ${lnk.kind==='remind'?'ทวงถาม':'แจ้งเตือนและขอให้แก้ไขเหตุดังกล่าว'}แล้ว แต่จนถึงวันที่ออกหนังสือฉบับนี้ ยังไม่ได้รับการแก้ไข`):'')+
      p(`${s.why==='order'?'บริษัทจึงหยุดงานตามคำสั่งดังกล่าว':'บริษัทจึงขอแจ้งหยุดงาน'} ตั้งแต่วันที่ ${thDL(eff)} เป็นต้นไป จนกว่า${R.till}${law} ระหว่างหยุดงาน บริษัทจะดูแลป้องกันงานที่ทำแล้ว วัสดุ และอุปกรณ์ในหน้างานตามสมควร`)+
      p(`ทั้งนี้ บริษัทขอสงวนสิทธิ์ในการขอขยายระยะเวลาก่อสร้างตามจำนวนวันที่หยุดงาน และเรียกร้องค่าใช้จ่ายที่เพิ่มขึ้นจากการหยุดงาน เช่น ค่าดูแลรักษาหน้างาน ค่าเช่าเครื่องมือและนั่งร้าน และค่าใช้จ่ายในการกลับเข้าทำงาน${swPay(s)?' รวมทั้งดอกเบี้ยจากการชำระเงินล่าช้า':''}${swChqLaw(s)}`)+
      p(`จึงเรียนมาเพื่อโปรดทราบ${['force','order'].includes(s.why)?'':' และโปรดดำเนินการแก้ไขโดยเร็ว เพื่อให้บริษัทกลับเข้าทำงานได้'}`)}
  else if(k==='resume'){const a=okD(s.from)?s.from:me?me.a:'',z=okD(s.eff)?s.eff:at,d=a?Math.max(0,diffD(a,z)):0;subj=`แจ้งกลับเข้าทำงาน ${what}`;
    body=p(intro)+p(`บริษัทได้หยุดงาน${a?`ตั้งแต่วันที่ ${thDL(a)}`:''}${lnk?` ตาม${swRef(lnk.id)}`:''} เนื่องจาก${why||'เหตุขัดข้องที่ทำให้ไม่สามารถทำงานได้'}`)+
      p(`บัดนี้ ${R.end}${swPay(s)&&okD(s.paidOn)?` เมื่อวันที่ ${thDL(s.paidOn)}`:''} บริษัทจึงขอแจ้งกลับเข้าทำงานตั้งแต่วันที่ ${thDL(z)} เป็นต้นไป${d?` รวมระยะเวลาที่หยุดงาน ${d} วัน (ตั้งแต่วันที่ ${thDL(a)} ถึงวันที่ ${thDL(addD(z,-1))})`:''}`)+
      (d?p(`บริษัทขอใช้สิทธิ์ขอขยายระยะเวลาก่อสร้างออกไป ${d} วัน ตามระยะเวลาที่หยุดงาน${fin?` จากกำหนดแล้วเสร็จเดิมวันที่ ${thDL(fin)} เป็นวันที่ ${thDL(addD(fin,d))}`:''} โดยจะยื่นหนังสือขอขยายระยะเวลาพร้อมหลักฐานต่อไป`):'')+
      p('จึงเรียนมาเพื่อโปรดทราบ และขอขอบคุณมา ณ โอกาสนี้')}
  else if(k==='claim'){const Ii=swInt(s),ti=sum(Ii,x=>x.int),C=s.cost||[],tc=swCostTot(s),pr=lnk&&per.find(x=>x.s.id===lnk.id),rt=n(s.rate),tot=ti+tc;subj=`เรียกร้องดอกเบี้ยผิดนัดและค่าใช้จ่ายจากการหยุดงาน ${what}`;
    const it=Ii.length?`<table class="sw-t"><thead><tr><th>งวด</th><th>ใบเบิกเงิน</th><th>ครบกำหนด</th><th>ชำระเมื่อ</th><th>ล่าช้า (วัน)</th><th>ยอดเงิน (บาท)</th><th>ดอกเบี้ย (บาท)</th></tr></thead><tbody>
      ${Ii.map(r=>`<tr><td>${swInst(r.b)}</td><td>${esc(r.b.no)}</td><td>${thD(r.due)}</td><td>${r.paid?thD(r.end):'ยังไม่ชำระ (ถึง '+thD(r.end)+')'}</td><td class="r">${r.days}</td><td class="r">${fmt(r.amt,2)}</td><td class="r">${fmt(r.int,2)}</td></tr>`).join('')}
      <tr><td colspan="6" class="r"><b>รวมดอกเบี้ย</b></td><td class="r"><b>${fmt(ti,2)}</b></td></tr></tbody></table>`:'';
    const ct=C.length?`<table class="sw-t"><thead><tr><th>#</th><th>รายการค่าใช้จ่าย</th><th>จำนวน</th><th>หน่วย</th><th>ราคาต่อหน่วย (บาท)</th><th>จำนวนเงิน (บาท)</th></tr></thead><tbody>
      ${C.map((x,i)=>`<tr><td>${i+1}</td><td class="w">${esc(x.desc||'')}</td><td class="r">${fmtq(n(x.q))}</td><td>${esc(x.unit||'')}</td><td class="r">${fmt(n(x.rate),2)}</td><td class="r">${fmt(n(x.q)*n(x.rate),2)}</td></tr>`).join('')}
      <tr><td colspan="5" class="r"><b>รวมค่าใช้จ่าย</b></td><td class="r"><b>${fmt(tc,2)}</b></td></tr></tbody></table>`:'';
    let i=0;const h=x=>`<b>${++i}. ${x}</b>`;
    body=p(intro)+(Ii.length?p(`${h('ดอกเบี้ยจากการชำระเงินล่าช้า')} ผู้ว่าจ้างชำระเงินค่างานล่าช้ากว่ากำหนด ${Ii.length} งวด ${Ii.map(r=>`${swInst(r.b)} (${esc(r.b.no)}) จำนวนเงิน ${fmt(r.amt,2)} บาท ล่าช้า ${r.days} วัน`).join(' ')} บริษัทจึงขอเรียกดอกเบี้ยผิดนัดในอัตราร้อยละ ${fmtq(rt)} ต่อปี ${cl?`ตามสัญญา${esc(cl)}`:'ตามประมวลกฎหมายแพ่งและพาณิชย์ มาตรา 224'} คิดเป็นเงิน ${fmt(ti,2)} บาท ดังนี้`)+it:'')+
      (C.length?p(`${h('ค่าใช้จ่ายระหว่างหยุดงาน')} ${pr?`บริษัทต้องหยุดงานตั้งแต่วันที่ ${thDL(pr.a)}${pr.open?'':` ถึงวันที่ ${thDL(addD(pr.z,-1))}`} รวม ${pr.d} วัน ตาม${swRef(lnk.id)} เนื่องจาก${swWhy(lnk)||'เหตุที่มิใช่ความผิดของบริษัท'} `:''}ระหว่างหยุดงาน บริษัทมีค่าใช้จ่ายที่เกิดขึ้นจริงโดยไม่ได้ผลงาน ดังนี้`)+ct:'')+
      (dtl?p(dtl):'')+
      p(`รวมเป็นเงินที่บริษัทขอเรียกร้องทั้งสิ้น ${fmt(tot,2)} บาท (${bahtText(tot)}) ไม่รวมภาษีมูลค่าเพิ่ม บริษัทจึงขอให้${party}ชำระเงินจำนวนดังกล่าวภายใน ${nd} วัน นับแต่วันที่ได้รับหนังสือฉบับนี้ โดยบริษัทได้แนบหลักฐานค่าใช้จ่ายมาพร้อมนี้`)+
      p('จึงเรียนมาเพื่อโปรดพิจารณาอนุมัติ จะขอบคุณยิ่ง')}
  else if(k==='eot'){const X=per.filter(x=>!s.ids||s.ids.includes(x.s.id)),d=swUnion(X);subj=`ขอขยายระยะเวลาก่อสร้าง ${what}`;
    const t2=`<table class="sw-t"><thead><tr><th>#</th><th>เหตุที่หยุดงาน</th><th>หนังสือแจ้ง</th><th>หยุดตั้งแต่</th><th>กลับเข้าทำงาน</th><th>จำนวนวัน</th></tr></thead><tbody>
      ${X.map((x,i)=>`<tr><td>${i+1}</td><td class="w">${esc(swR(x.s).l)}</td><td>${esc(x.s.no)}${x.r?` / ${esc(x.r.no)}`:''}</td><td>${thD(x.a)}</td><td>${x.open?'ยังหยุดอยู่ (นับถึง '+thD(x.z)+')':thD(x.z)}</td><td class="r">${x.d}</td></tr>`).join('')}
      <tr><td colspan="5" class="r"><b>รวม${X.length>1&&d!==sum(X,x=>x.d)?' (วันที่ซ้อนกันนับครั้งเดียว)':''}</b></td><td class="r"><b>${d}</b></td></tr></tbody></table>`;
    body=p(intro)+p(`ระหว่างการดำเนินงาน บริษัทต้องหยุดงานด้วยเหตุที่มิใช่ความผิดของบริษัท ${X.length} ครั้ง ซึ่งบริษัทได้มีหนังสือแจ้งไว้แล้วทุกครั้ง ดังนี้`)+t2+(dtl?p(dtl):'')+
      p(`บริษัทจึงขอขยายระยะเวลาก่อสร้างออกไป ${d} วัน${fin?` จากกำหนดแล้วเสร็จเดิมวันที่ ${thDL(fin)} เป็นวันที่ ${thDL(addD(fin,d))}`:''} และขอให้งดหรือลดค่าปรับสำหรับระยะเวลาดังกล่าว${cl?` ตามสัญญา${esc(cl)}`:' ตามเงื่อนไขของสัญญา'}${gov?' ประกอบพระราชบัญญัติการจัดซื้อจัดจ้างและการบริหารพัสดุภาครัฐ พ.ศ. 2560 มาตรา 102':''}`)+
      p('จึงเรียนมาเพื่อโปรดพิจารณาอนุมัติ จะขอบคุณยิ่ง')}
  else if(k==='ret'){const r=swRet(),lg=swLG(),end=swRetEnd(s),wm=n(s.wm)||12;subj=`ขอคืนเงินประกันผลงาน ${what}`;
    const lgT=s.lgNo?`หนังสือค้ำประกันผลงานเลขที่ ${esc(s.lgNo)}`:lg.length?lg.map(x=>`หนังสือค้ำประกันธนาคาร${esc(x.bank)} เลขที่ ${esc(x.lgNo||x.no)} จำนวนเงิน ${fmt(x.amt,2)} บาท`).join(' และ'):'';
    const rt=r.R.length?`<table class="sw-t"><thead><tr><th>งวด</th><th>ใบเบิกเงิน</th><th>ลงวันที่</th><th>เงินประกันผลงานที่หัก (บาท)</th></tr></thead><tbody>
      ${r.R.map(x=>`<tr><td>${swInst(x.b)}</td><td>${esc(x.b.no)}</td><td>${thD(x.b.date)}</td><td class="r">${fmt(x.ret,2)}</td></tr>`).join('')}
      ${r.back?`<tr><td colspan="3" class="r">หัก คืนแล้ว</td><td class="r">(${fmt(r.back,2)})</td></tr>`:''}<tr><td colspan="3" class="r"><b>เงินประกันผลงานที่ขอคืน</b></td><td class="r"><b>${fmt(r.due,2)}</b></td></tr></tbody></table>`:'';
    body=p(intro)+p(`บริษัทได้ทำงานแล้วเสร็จและส่งมอบงานให้แก่${party}${okD(s.ho)?`เมื่อวันที่ ${thDL(s.ho)}`:'แล้ว'} โดยมีระยะเวลารับประกันผลงาน ${fmtq(wm)} เดือน${end?` ซึ่งได้สิ้นสุดลงเมื่อวันที่ ${thDL(end)}`:''} ระหว่างระยะเวลารับประกัน บริษัทได้เข้าแก้ไขข้อบกพร่องตามที่ได้รับแจ้งครบถ้วนแล้ว${dtl?` ${dtl}`:''}`)+
      (r.R.length?p(`ผู้ว่าจ้างได้หักเงินประกันผลงานไว้จากค่างานแต่ละงวดในอัตราร้อยละ ${fmtq(n(I.ret))} ดังนี้`)+rt:'')+
      p(`บริษัทจึงขอให้${party}คืนเงินประกันผลงาน${r.due?` จำนวน ${fmt(r.due,2)} บาท (${bahtText(r.due)})`:''}${lgT?`${r.due?' และ':''}คืน${lgT}`:''} ให้แก่บริษัท ภายใน ${n(s.nd)||15} วัน นับแต่วันที่ได้รับหนังสือฉบับนี้${cl?` ตามสัญญา${esc(cl)}`:''}`)+
      p('จึงเรียนมาเพื่อโปรดพิจารณาดำเนินการ จะขอบคุณยิ่ง')}
  else{const pr=swPrior(s),eff=okD(s.eff)?s.eff:at;subj=`บอกเลิกสัญญา ${what}`;
    body=p(intro)+p(`บัดนี้ ${why||'ผู้ว่าจ้างได้ปฏิบัติผิดสัญญา'}${!swPay(s)&&btx?` นอกจากนี้ ยังมีค่างานที่ค้างชำระ${btx.replace(/^ได้แก่/,' ได้แก่')}`:''}`)+tb+
      (pr.length?p(`บริษัทได้มีหนังสือทวงถามและแจ้งเตือนให้${party}${R.ask}ภายในเวลาที่กำหนด รวม ${pr.length} ฉบับ ตามหนังสือที่อ้างถึง แต่${party}มิได้ปฏิบัติตามภายในกำหนดเวลาดังกล่าว`):'')+
      p(`พฤติการณ์ดังกล่าวเป็นการผิดสัญญาในข้อสาระสำคัญ บริษัทจึงขอใช้สิทธิบอกเลิกสัญญา${cl?` ตามสัญญา${esc(cl)}`:''} และตามประมวลกฎหมายแพ่งและพาณิชย์ มาตรา 386 และมาตรา 387 โดยให้มีผลตั้งแต่วันที่ ${thDL(eff)} เป็นต้นไป`)+
      p(`ขอให้${party}ชำระค่างานที่บริษัททำไปแล้ว${owe?` ซึ่งค้างชำระอยู่จำนวน ${fmt(owe,2)} บาท`:''} พร้อมค่าวัสดุที่นำเข้าหน้างาน และค่าเสียหายที่เกิดขึ้น ตามมาตรา 391 และขอให้ส่งผู้แทนร่วมตรวจวัดผลงานและตรวจนับวัสดุในหน้างาน${okD(s.mtg)?` ในวันที่ ${thDL(s.mtg)}`:''} เพื่อคิดค่างานส่วนที่ทำแล้วและส่งมอบหน้างาน ทั้งนี้ บริษัทขอสงวนสิทธิ์เรียกร้องค่าเสียหายตามกฎหมาย${swChqLaw(s)}`)+
      p('จึงเรียนมาเพื่อโปรดทราบ')}
  return phead(`${t} ${s.no}`,`วันที่ ${thDL(at)}`)+`<div class="let lt2 sw">
  <div class="lt-top"><span>ที่ ${esc(s.no)}</span></div><div class="lt-date">${thDL(at)}</div>
  ${row('เรื่อง',subj)}${row('เรียน',party)}
  ${refs.filter(Boolean).length?row('อ้างถึง',refs.filter(Boolean).length>1?`<ol>${refs.filter(Boolean).map(x=>`<li>${x}</li>`).join('')}</ol>`:refs.filter(Boolean)[0]):''}
  ${att.length?row('สิ่งที่ส่งมาด้วย',att.length>1?`<ol>${att.map(x=>`<li>${esc(x)}</li>`).join('')}</ol>`:esc(att[0])):''}
  ${body}
  <div class="lt-sign"><div>ขอแสดงความนับถือ</div><div class="lt-ln"></div><div>(${esc(sn||'.................................................')})</div><div>${esc(sr)}</div><div>${esc(CO_.name||'')}</div></div>
  ${s.cc&&s.cc.trim()?`<div class="sw-cc">สำเนาเรียน ${esc(s.cc.trim())}</div>`:''}
  ${I.pm?`<div class="lt-ct">ผู้ประสานงาน: ${esc(I.pm)}${CO_.phone?` โทร ${esc(CO_.phone)}`:''}${CO_.email?` · ${esc(CO_.email)}`:''}</div>`:''}
  <div class="sw-rcv"><b>สำหรับผู้รับหนังสือ</b> ได้รับหนังสือฉบับนี้แล้ว &nbsp; ลงชื่อ ................................................ &nbsp; วันที่ ........./........./......... &nbsp; เวลา ...........</div></div>`}
PRINT.swl=id=>{const s=swArr().find(x=>x.id===id);return s?`<div class="swp" data-doc-name="${esc([swK(s.kind)[2],s.no,P.name].join(' '))}">${swLetter(s)}</div>`:''};
document.head.insertAdjacentHTML('beforeend',`<style>
#print .sw .sw-t{width:100%;margin:10px 0 0;font-size:13px;line-height:1.5;border-collapse:collapse;break-inside:avoid}
#print .sw .sw-t th,#print .sw .sw-t td{border:1px solid #9aa;padding:3px 6px}#print .sw .sw-t td{white-space:nowrap}#print .sw .sw-t td.w{white-space:normal}#print .sw .sw-t .r{text-align:right}
#print .sw .sw-cc{margin-top:18px;font-size:14px}
#print .sw .sw-rcv{margin-top:22px;padding-top:6px;border-top:1px dashed #999;font-size:12px;color:#333}
.sw-add{display:flex;flex-wrap:wrap;gap:6px;align-items:center;margin:0 0 10px}.sw-add .muted{font-size:12px;margin-left:6px}.sw-add .muted:first-child{margin-left:0}
.sw-info{margin:0 0 10px;padding:8px 12px;border-radius:8px;background:var(--bg2,#F3F7F7);font-size:13px;line-height:1.6}
.pill.sw-remind{background:#F1ECFA;color:#5b3f8f}.pill.sw-warn{background:#FFF1D6;color:#8a5a00}.pill.sw-stop{background:#FBE1DE;color:#a3322a}.pill.sw-resume{background:#DDF3E4;color:#1f6b3a}
.pill.sw-claim{background:#FDE8D4;color:#93500f}.pill.sw-eot{background:#E2ECF8;color:#2d5b8f}.pill.sw-ret{background:#DFF2F0;color:#1d6a63}.pill.sw-term{background:#3a2a2a;color:#fff}
</style>`);

/* --- form codes, English titles, search --- */
{const i=FM_LIST.findIndex(e=>e[0]==='sc')+1;FM_LIST.splice(i,0,
  ['swwarn','LG',2,'หนังสือแจ้งเตือนก่อนหยุดงาน',/^หนังสือแจ้งเตือนก่อนหยุดงาน/],
  ['swstop','LG',3,'หนังสือแจ้งหยุดงาน',/^หนังสือแจ้งหยุดงาน/],
  ['swres','LG',4,'หนังสือแจ้งกลับเข้าทำงาน',/^หนังสือแจ้งกลับเข้าทำงาน/],
  ['sweot','LG',5,'หนังสือขอขยายระยะเวลาก่อสร้าง',/^หนังสือขอขยายระยะเวลา/],
  ['swrem','LG',6,'หนังสือทวงถามการชำระเงินค่างวด',/^หนังสือทวงถาม/],
  ['swclaim','LG',7,'หนังสือเรียกร้องดอกเบี้ยและค่าใช้จ่ายจากการหยุดงาน',/^หนังสือเรียกร้อง/],
  ['swret','LG',8,'หนังสือขอคืนเงินประกันผลงาน',/^หนังสือขอคืนเงินประกันผลงาน/],
  ['swterm','LG',9,'หนังสือบอกเลิกสัญญา',/^หนังสือบอกเลิกสัญญา/])}
DOC_EN.unshift([/ทวงถามการชำระเงิน/,'PAYMENT REMINDER'],[/เรียกร้องดอกเบี้ย/,'CLAIM FOR INTEREST AND COSTS'],[/คืนเงินประกันผลงาน/,'REQUEST FOR RETENTION RELEASE'],[/บอกเลิกสัญญา/,'NOTICE OF CONTRACT TERMINATION'],
  [/เตือนก่อนหยุดงาน/,'NOTICE OF INTENT TO SUSPEND WORK'],[/แจ้งหยุดงาน/,'NOTICE OF WORK SUSPENSION'],[/กลับเข้าทำงาน/,'NOTICE OF RESUMPTION OF WORK'],[/ขยายระยะเวลาก่อสร้าง/,'REQUEST FOR EXTENSION OF TIME']);
if(typeof SBSUB==='object')SBSUB['pj.forms']=(SBSUB['pj.forms']||'')+'|stop=หนังสือหยุดงาน';
if(typeof SBKW==='object')SBKW['pj.forms.stop']=(SBKW['pj.forms.stop']||'')+' หยุดงาน ระงับงาน หยุดทำงาน suspend suspension ค้างชำระ เบิกงวดไม่ได้ ไม่จ่ายเงิน ทวงเงิน ทวงถาม ทวงหนี้ กลับเข้าทำงาน ขยายเวลา ขยายระยะเวลา eot extension of time งดค่าปรับ เหตุสุดวิสัย พื้นที่ไม่พร้อม รอแบบ เช็คเด้ง เลื่อนเช็ค เช็ค ดอกเบี้ย ค่าเสียหาย เงินประกันผลงาน retention คืนเงินประกัน บอกเลิกสัญญา เลิกสัญญา termination';
if(typeof I18N==='object'&&I18N.en&&I18N.en.x)Object.assign(I18N.en.x,{'หนังสือหยุดงาน':'Work stoppage letters','หนังสือหยุดงาน ทวงเงิน และสัญญา':'Stoppage, payment and contract letters','แจ้งเตือนก่อนหยุดงาน':'Notice before stopping','แจ้งหยุดงาน':'Stop work notice',
  'แจ้งกลับเข้าทำงาน':'Resume work notice','ขอขยายระยะเวลา':'Extension of time','ทวงถามค่างวด':'Payment reminder','เรียกร้องดอกเบี้ย / ค่าใช้จ่าย':'Interest / cost claim','ขอคืนเงินประกันผลงาน':'Retention release','บอกเลิกสัญญา':'Termination',
  'พิมพ์หนังสือ':'Print letter','สรุปวันหยุดงาน (ใช้ขอขยายระยะเวลา)':'Days stopped (for extension of time)','เหตุที่หยุดงาน':'Reason','อ้างข้อสัญญา':'Contract clause','สำเนาเรียน':'Copy to','ยังหยุดอยู่':'Still stopped'});
