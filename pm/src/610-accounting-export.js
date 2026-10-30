/* ---------- 3.14: export to the accounting program ----------
   บัญชี › ส่งออกบัญชี: one month at a time, CSV files that open in Excel:
   - ขาย: invoices / tax invoices issued (not drafts)        - ซื้อและค่าใช้จ่าย: POs received with their tax invoice, subcontractor and other payments
   - รับเงิน: invoices paid in the month                      - จ่ายเงิน: POs, subcontractors and other costs paid in the month
   - สมุดรายวัน: double-entry lines with the company's own account codes (works for Express, PEAK's journal import and any accountant)
   Column names follow the fields of the chosen program (PEAK, FlowAccount, Express or a plain layout). Their exact Excel templates
   are not published, so the files are made to be matched column by column in the program's import screen, or pasted into its template. */
const ACCP=[['std','ทั่วไป (ส่งนักบัญชี)'],['peak','PEAK'],['flow','FlowAccount'],['exp','Express']];
const ACCODE=[['bank','1112','เงินฝากธนาคาร'],['ar','1131','ลูกหนี้การค้า'],['arRet','1135','ลูกหนี้เงินประกันผลงาน'],['vatIn','1154','ภาษีซื้อ'],['whtRec','1157','ภาษีถูกหัก ณ ที่จ่าย'],
  ['ap','2121','เจ้าหนี้การค้า'],['adv','2141','เงินรับล่วงหน้าค่าก่อสร้าง'],['vatOut','2171','ภาษีขาย'],['whtPay','2172','ภาษีหัก ณ ที่จ่ายค้างจ่าย'],
  ['rev','4111','รายได้ค่าก่อสร้าง'],['mat','5111','ต้นทุนวัสดุและอุปกรณ์'],['sub','5112','ค่าจ้างผู้รับเหมาช่วง'],['oth','5119','ค่าใช้จ่ายโครงการอื่น']];
function accCfg(){const C=DB.co;if(!C.accX)C.accX={prog:'std',be:false,codes:{},log:[]};const X=C.accX;X.codes=X.codes||{};X.log=X.log||[];
  ACCODE.forEach(([k,c,nm])=>{if(!X.codes[k])X.codes[k]={c,nm}});return X}
const accA=k=>{const x=accCfg().codes[k]||{};return [x.c||'',x.nm||'']};
const accD=d=>{if(!okD(d))return '';const [y,m,dd]=d.split('-');return `${dd}/${m}/${accCfg().be?+y+543:y}`};
const r2=v=>Math.round(n(v)*100)/100;
const accM=()=>S.sel.vatm||ym(today());
const vendOf=(p,po)=>p.vendors.find(x=>x.id===po.vid)||{};
const custOf=p=>CO().customers.find(c=>c.id===p.info.cust)||{};
const bkLbl=b=>(BKIND.find(x=>x[0]===(b.kind||'prog'))||BKIND[0])[1];
// the month's documents, from every project
function accData(m){const S1=[],P1=[],R1=[],Y1=[];
  projects().forEach(p=>withP(p,()=>{const cu=custOf(p),cn=custName(p.info.cust)||p.info.client||'';
    p.bills.forEach(b=>{if(b.status==='draft')return;const c=billCalc(b),inst=((p.inst||[]).find(x=>x.id===b.inst)||{});
      const row={p,b,c,no:b.tiNo||b.no,ref:b.no,who:cn,tax:cu.tax||'',desc:`${bkLbl(b)}${inst.name?' '+inst.name:''} ${pjTxt(p)}`,vat:n(p.info.vat)};
      if(ym(b.date)===m)S1.push(Object.assign({date:b.date},row));
      if(b.status==='paid'&&okD(b.paid)&&ym(b.paid)===m)R1.push(Object.assign({date:b.paid,rc:b.rcNo||''},row))});
    p.pos.forEach(po=>{const T=poTotal(po),v=vendOf(p,po),rec=(po.dl||[]).length||okD(po.taxDate),row={p,kind:'po',no:po.taxNo||'',ref:po.no,who:v.name||'',tax:v.tax||'',
        desc:`ซื้อวัสดุตาม ${po.no} ${pjTxt(p)}`,base:T.s,vat:T.v,wht:0,whtp:0,tot:T.t,net:T.t,acc:'mat',items:po.items,vatp:po.novat?0:n(p.info.vat),cr:true};
      if(rec&&ym(poTaxDate(po))===m)P1.push(Object.assign({date:poTaxDate(po)},row));
      if(po.paid&&ym(po.paidDate||po.date)===m)Y1.push(Object.assign({date:po.paidDate||po.date},row))});
    p.spay.forEach(x=>{if(ym(x.date)!==m)return;const s=p.subs.find(y=>y.id===x.sub)||{},c=payCalc(x);
      const row={p,kind:'spay',date:x.date,no:x.taxNo||'',ref:x.whtNo||'',who:s.name||'',tax:s.tax||'',desc:`${x.desc||'ค่าจ้างผู้รับเหมาช่วง'} ${pjTxt(p)}`,base:c.a,vat:c.v,wht:c.w,whtp:n(x.whtp),tot:c.a+c.v,net:c.net,acc:'sub',vatp:x.vat?7:0,pnd:s.ent==='co'?'ภ.ง.ด.53':'ภ.ง.ด.3'};
      P1.push(row);Y1.push(row)});
    p.costs.forEach(x=>{if(ym(x.date)!==m)return;const c=payCalc(x);
      const row={p,kind:'cost',date:x.date,no:x.taxNo||x.ref||'',ref:x.ref||'',who:x.who||'',tax:x.tax||'',desc:`${x.desc||'ค่าใช้จ่าย'} ${pjTxt(p)}`,base:c.a,vat:c.v,wht:c.w,whtp:n(x.whtp),tot:c.a+c.v,net:c.net,acc:'oth',vatp:x.vat?7:0,pnd:(x.ent||'co')==='co'?'ภ.ง.ด.53':'ภ.ง.ด.3'};
      P1.push(row);Y1.push(row)})}));
  const by=(a,b)=>String(a.date).localeCompare(String(b.date))||String(a.ref).localeCompare(String(b.ref));
  return {sale:S1.sort(by),buy:P1.sort(by),rcv:R1.sort(by),pay:Y1.sort(by)}}
// double entry: every document balances
function accJournal(D){const J=[],L=(r,doc,type,k,dr,cr,desc)=>{dr=r2(dr);cr=r2(cr);if(!dr&&!cr)return;const [c,nm]=accA(k);
    J.push({date:r.date,doc,type,c,nm,desc,dr,cr,pj:r.p.name,who:r.who,tax:r.tax})};
  D.sale.forEach(r=>{const c=r.c,k=r.b.kind||'prog',d=r.no,t='ขาย',x=r.desc;
    L(r,d,t,'ar',c.base+c.vat-c.ret,0,x);L(r,d,t,'arRet',c.ret,0,x);L(r,d,t,'adv',c.adv,0,'หักคืนเงินรับล่วงหน้า');
    L(r,d,t,k==='adv'?'adv':k==='ret'?'arRet':'rev',0,c.amt,x);L(r,d,t,'vatOut',0,c.vat,x)});
  D.rcv.forEach(r=>{const c=r.c,d=r.rc||r.ref,t='รับเงิน',x=`รับชำระ ${r.no} ${r.who}`;L(r,d,t,'bank',c.net,0,x);L(r,d,t,'whtRec',c.wht,0,x);L(r,d,t,'ar',0,c.net+c.wht,x)});
  D.buy.forEach(r=>{const d=r.no||r.ref,t='ซื้อ',x=r.desc;L(r,d,t,r.acc,r.base,0,x);L(r,d,t,'vatIn',r.vat,0,x);
    if(r.kind==='po')L(r,d,t,'ap',0,r.tot,x);else{L(r,d,t,'bank',0,r.net,x);L(r,d,t,'whtPay',0,r.wht,x)}});
  D.pay.forEach(r=>{if(r.kind!=='po')return;const d=r.ref,t='จ่ายเงิน',x=`จ่ายชำระ ${r.ref} ${r.who}`;L(r,d,t,'ap',r.tot,0,x);L(r,d,t,'bank',0,r.tot,x)});
  return J}
// one table per file; the header row is named after the program's own fields
function accFile(kind,D){const X=accCfg(),pg=X.prog,F=[];
  if(kind==='sale'){
    if(pg==='peak')return [['วันที่เอกสาร','เลขที่เอกสาร','ผู้ติดต่อ/คู่ค้า','เลขประจำตัวผู้เสียภาษี','สินค้า/บริการสำหรับขาย','คำอธิบาย','จำนวน','ราคา','ประเภทราคา','ภาษี','หัก ณ ที่จ่าย','หมายเหตุ'],
      ...D.sale.map(r=>[accD(r.date),r.no,r.who,r.tax,'งานก่อสร้างและติดตั้ง',r.desc,1,r2(r.c.base),'แยกภาษี',r.vat?r.vat+'%':'ไม่มี',r.c.wht?n(r.p.info.wht)+'%':'',r.c.ret?`หักประกันผลงาน ${fmt(r.c.ret,2)}`:''])];
    if(pg==='flow')return [['วันที่เอกสาร','เลขที่เอกสาร','ชื่อลูกค้า','เลขประจำตัวผู้เสียภาษี','ชื่อสินค้า','จำนวน','หน่วย','ราคาต่อหน่วย','ภาษีมูลค่าเพิ่ม','หัก ณ ที่จ่าย','หมายเหตุ'],
      ...D.sale.map(r=>[accD(r.date),r.no,r.who,r.tax,r.desc,1,'งาน',r2(r.c.base),r.vat?r.vat+'%':'ไม่มี',r.c.wht?n(r.p.info.wht)+'%':'',r.c.ret?`หักประกันผลงาน ${fmt(r.c.ret,2)}`:''])];
    return [['วันที่','เลขที่ใบกำกับภาษี','อ้างอิงใบเบิก','ลูกค้า','เลขประจำตัวผู้เสียภาษี','โครงการ','รายการ','ยอดเบิก','หักเงินล่วงหน้า','มูลค่าก่อน VAT','VAT','รวม VAT','หักประกันผลงาน','หัก ณ ที่จ่าย','รับสุทธิ','สถานะ'],
      ...D.sale.map(r=>[accD(r.date),r.no,r.ref,r.who,r.tax,r.p.name,r.desc,r2(r.c.amt),r2(r.c.adv),r2(r.c.base),r2(r.c.vat),r2(r.c.base+r.c.vat),r2(r.c.ret),r2(r.c.wht),r2(r.c.net),r.b.status==='paid'?'รับเงินแล้ว':'ค้างรับ'])]}
  if(kind==='buy'){
    if(pg==='peak')return [['วันที่เอกสาร','อ้างอิงจาก','ผู้รับเงิน/คู่ค้า','เลขประจำตัวผู้เสียภาษี','เลขที่ใบกำกับฯ','วันที่ใบกำกับฯ','ประเภทราคา','ค่าใช้จ่าย/บัญชี','คำอธิบาย','จำนวน','ราคา','ภาษี','หัก ณ ที่จ่าย','ภ.ง.ด.','ชำระเงิน','หมายเหตุ'],
      ...D.buy.map(r=>[accD(r.date),r.ref,r.who,r.tax,r.no,r.no?accD(r.date):'',r.vatp?'แยกภาษี':'ไม่มี',accA(r.acc).join(' '),r.desc,1,r2(r.base),r.vatp?r.vatp+'%':'',r.whtp?r.whtp+'%':'',r.whtp?r.pnd:'',r.kind==='po'?0:r2(r.net),r.p.name])];
    if(pg==='flow')return [['วันที่เอกสาร','เลขที่อ้างอิง','ชื่อผู้จำหน่าย','เลขประจำตัวผู้เสียภาษี','เลขที่ใบกำกับภาษี','รายการ','หมวดค่าใช้จ่าย','จำนวน','ราคาต่อหน่วย','ภาษีมูลค่าเพิ่ม','หัก ณ ที่จ่าย','หมายเหตุ'],
      ...D.buy.map(r=>[accD(r.date),r.ref,r.who,r.tax,r.no,r.desc,accA(r.acc)[1],1,r2(r.base),r.vatp?r.vatp+'%':'ไม่มี',r.whtp?r.whtp+'%':'',r.p.name])];
    return [['วันที่','เลขที่ใบกำกับ/ใบเสร็จผู้ขาย','อ้างอิง','ผู้ขาย/ผู้รับจ้าง','เลขประจำตัวผู้เสียภาษี','โครงการ','รายการ','บัญชี','มูลค่าก่อน VAT','VAT','รวม','หัก ณ ที่จ่าย','แบบ','จ่ายสุทธิ','สถานะ'],
      ...D.buy.map(r=>[accD(r.date),r.no,r.ref,r.who,r.tax,r.p.name,r.desc,accA(r.acc).join(' '),r2(r.base),r2(r.vat),r2(r.tot),r2(r.wht),r.whtp?r.pnd:'',r2(r.net),r.kind==='po'?'ตั้งเจ้าหนี้':'จ่ายแล้ว'])]}
  if(kind==='rcv')return [['วันที่รับเงิน','เลขที่ใบเสร็จ','ชำระใบกำกับเลขที่','ลูกค้า','เลขประจำตัวผู้เสียภาษี','โครงการ','ยอดตามใบกำกับ (หลังหักประกัน)','ถูกหัก ณ ที่จ่าย','รับเงินสุทธิ','เข้าบัญชี'],
    ...D.rcv.map(r=>[accD(r.date),r.rc,r.no,r.who,r.tax,r.p.name,r2(r.c.net+r.c.wht),r2(r.c.wht),r2(r.c.net),accA('bank').join(' ')])];
  if(kind==='pay')return [['วันที่จ่าย','ประเภท','อ้างอิง','ผู้รับเงิน','เลขประจำตัวผู้เสียภาษี','โครงการ','รายการ','ยอดรวม VAT','หัก ณ ที่จ่าย','จ่ายสุทธิ','จ่ายจากบัญชี'],
    ...D.pay.map(r=>[accD(r.date),{po:'ใบสั่งซื้อ',spay:'ผู้รับเหมาช่วง',cost:'ค่าใช้จ่าย'}[r.kind],r.ref||r.no,r.who,r.tax,r.p.name,r.desc,r2(r.tot),r2(r.wht),r2(r.net),accA('bank').join(' ')])];
  if(kind==='jv'){const J=accJournal(D);return [['วันที่','เลขที่เอกสาร','สมุด','รหัสบัญชี','ชื่อบัญชี','คำอธิบาย','เดบิต','เครดิต','โครงการ','คู่ค้า','เลขประจำตัวผู้เสียภาษี'],
    ...J.map(j=>[accD(j.date),j.doc,j.type,j.c,j.nm,j.desc,j.dr||'',j.cr||'',j.pj,j.who,j.tax])]}
  return F}
const ACCF=[['sale','ขาย / ใบกำกับภาษีขาย','sale'],['buy','ซื้อและค่าใช้จ่าย','buy'],['rcv','รับชำระเงิน','rcv'],['pay','จ่ายชำระเงิน','pay'],['jv','สมุดรายวัน (รหัสบัญชี)',null]];
const accCsv=T=>'﻿'+T.map(r=>r.map(v=>typeof v==='number'?String(v):csvCell(v)).join(',')).join('\r\n');
ACT.accDl=async b=>{const k=b.dataset.k,m=accM(),X=accCfg(),D=accData(m),T=accFile(k,D);
  if(T.length<2){toast('เดือนนี้ไม่มีรายการ');return}
  const ok=await download(`PENUM-${X.prog}-${k}-${m}.csv`,accCsv(T),'text/csv;charset=utf-8');
  if(ok){X.log.push({m,k,prog:X.prog,at:new Date().toISOString(),n:T.length-1});if(X.log.length>200)X.log=X.log.slice(-200);save();render()}
  toast(ok?`ดาวน์โหลดแล้ว ${T.length-1} แถว`:'ดาวน์โหลดไม่ได้')};
ACT.accCodeReset=()=>{if(!confirm('คืนรหัสบัญชีทั้งหมดเป็นค่าตั้งต้น?'))return;accCfg().codes={};accCfg();save();render()};
function acctExp(){const X=accCfg(),m=accM(),D=accData(m),J=accJournal(D),mo=pd(m+'-01').toLocaleDateString('th-TH',{month:'long',year:'numeric'});
  const dr=sum(J,j=>j.dr),cr=sum(J,j=>j.cr),bal=Math.abs(dr-cr)<0.05,cnt={sale:D.sale.length,buy:D.buy.length,rcv:D.rcv.length,pay:D.pay.length,jv:J.length};
  const last=k=>{const l=X.log.filter(x=>x.m===m&&x.k===k).pop();return l?`<small class="muted">ส่งออกแล้ว ${thD(l.at.slice(0,10))} (${(ACCP.find(p=>p[0]===l.prog)||ACCP[0])[1]})</small>`:''};
  const tot={sale:fmt(sum(D.sale,r=>r.c.base+r.c.vat),2),buy:fmt(sum(D.buy,r=>r.tot),2),rcv:fmt(sum(D.rcv,r=>r.c.net),2),pay:fmt(sum(D.pay,r=>r.net),2),jv:fmt(dr,2)};
  const hintP={std:'ไฟล์แยกคอลัมน์ครบ ส่งให้นักบัญชีหรือสำนักงานบัญชีได้เลย',
    peak:'หัวคอลัมน์ตั้งตามชื่อช่องของ PEAK ในหน้านำเข้า (ใบแจ้งหนี้ / บันทึกค่าใช้จ่าย / สมุดบัญชีรายวัน) ดาวน์โหลดไฟล์ตัวอย่างจาก PEAK แล้วคัดลอกคอลัมน์ไปวางให้ตรงช่อง',
    flow:'FlowAccount ให้จับคู่คอลัมน์ตอนนำเข้า หัวคอลัมน์ในไฟล์ตั้งตามชื่อช่องของ FlowAccount เลือกรูปแบบวันที่ วว/ดด/ปปปป และราคาไม่รวมภาษี',
    exp:'Express ไม่มีหน้านำเข้าเอกสารขายซื้อจาก Excel โดยตรง ใช้ไฟล์สมุดรายวันที่มีรหัสบัญชีตามผังบัญชีใน Express (แก้รหัสด้านล่างให้ตรง) ให้ผู้ทำบัญชีบันทึกหรือนำเข้าด้วยเครื่องมือของตัวแทน Express'};
  return `<div class="row" style="margin-bottom:-4px"><button type="button" class="btn sm" data-a="vatM" data-d="-1">‹ เดือนก่อน</button><b style="font-family:var(--f-display);font-size:16px">${mo}</b><button type="button" class="btn sm" data-a="vatM" data-d="1">เดือนถัดไป ›</button></div>
  <section class="card"><h2><span>ส่งออกข้อมูลไปโปรแกรมบัญชี</span><small>ไฟล์ CSV เปิดด้วย Excel ได้ ทุกโครงการ รายเดือน</small></h2>
  <div class="form"><label>โปรแกรมบัญชี<select data-p="co.accX.prog">${ACCP.map(([k,l])=>`<option value="${k}"${k===X.prog?' selected':''}>${l}</option>`).join('')}</select></label>
  <label><span><input type="checkbox" data-t="chk" data-p="co.accX.be"${X.be?' checked':''}> วันที่แบบ พ.ศ. (${accD(today())})</span></label></div>
  <p class="hint">${hintP[X.prog]||hintP.std}</p>
  <div class="tw"><table><thead><tr><th>ไฟล์</th><th class="r">รายการ</th><th class="r">ยอดรวม</th><th></th></tr></thead><tbody>
  ${ACCF.map(([k,l])=>`<tr><td style="min-width:150px"><b>${l}</b>${last(k)?'<br>'+last(k):''}</td><td class="r">${cnt[k]}</td><td class="r">${tot[k]}</td><td><button type="button" class="btn sm${cnt[k]?' pri':''}" data-a="accDl" data-k="${k}"${cnt[k]?'':' disabled'}>ดาวน์โหลด</button></td></tr>`).join('')}
  </tbody></table></div>
  <p class="hint">สมุดรายวัน: เดบิต ${fmt(dr,2)} · เครดิต ${fmt(cr,2)} ${bal?'<span class="pill ok">สมดุล</span>':'<span class="pill bad">ไม่สมดุล ตรวจรายการ</span>'} · ภาษีขายลงตามวันที่ใบกำกับ ภาษีซื้อของใบสั่งซื้อลงตามวันที่รับของหรือวันที่ใบกำกับที่ใส่ไว้ ให้ผู้ทำบัญชีตรวจก่อนบันทึกทุกครั้ง</p></section>
  <section class="card"><h2><span>รหัสบัญชีสำหรับสมุดรายวัน</span><small>แก้ให้ตรงกับผังบัญชีในโปรแกรมของบริษัท</small><span class="sp"></span><button type="button" class="btn sm" data-a="accCodeReset">คืนค่าตั้งต้น</button></h2>
  <div class="tw"><table><thead><tr><th>ใช้สำหรับ</th><th>รหัสบัญชี</th><th>ชื่อบัญชี</th></tr></thead><tbody>
  ${ACCODE.map(([k,,d])=>`<tr><td>${d}</td><td style="width:120px"><input data-p="co.accX.codes.${k}.c" value="${esc(X.codes[k].c)}" aria-label="รหัส ${d}"></td><td><input data-p="co.accX.codes.${k}.nm" value="${esc(X.codes[k].nm)}" aria-label="ชื่อบัญชี ${d}"></td></tr>`).join('')}
  </tbody></table></div></section>`}
// wiring: a sub-tab under accounting, after the withholding-tax tab
{const sb=subTabs;subTabs=function(k,list){if(k==='acct'&&!list.some(x=>x[0]==='xp')){const i=list.findIndex(x=>x[0]==='wht');list=i<0?[...list,['xp','ส่งออกบัญชี']]:[...list.slice(0,i+1),['xp','ส่งออกบัญชี'],...list.slice(i+1)]}return sb(k,list)}}
{const f=CVIEWS.acct;CVIEWS.acct=()=>{if(S.sub.acct!=='xp')return f();
  const {html}=subTabs('acct',[['ar','ลูกหนี้ (เงินรับ)'],['bn','ใบวางบิล'],['ap','เจ้าหนี้ (เงินจ่าย)'],['cf','กระแสเงินสด'],['vat','ภาษีซื้อ-ภาษีขาย'],['wht','ภาษีหัก ณ ที่จ่าย']]);return html+acctExp()}}
if(typeof SBSUB!=='undefined'&&SBSUB['co.acct']&&!/\bxp=/.test(SBSUB['co.acct']))SBSUB['co.acct']=SBSUB['co.acct'].replace(/(wht=[^|]*)/,'$1|xp=ส่งออกบัญชี');
SBKW['co.acct.xp']='ส่งออก export express peak flowaccount โฟลว์แอคเคาท์ พีค เอ็กซ์เพรส สมุดรายวัน journal รหัสบัญชี ผังบัญชี csv';
