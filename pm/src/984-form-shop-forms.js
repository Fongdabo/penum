/* ---------- 4.6 ร้านฟอร์ม ORIEN: the forms sold in the shop (983-form-shop.js lists them, opens them by licence, shows the shop) ----------
   Each form prints the quotation's own data. Forms built on the ORIEN Modern print (981) add their parts to it; the others have their
   own layout here but keep its classes (QM_CSS), so they read as one family and take a colour from fsVars().
   Service (PM/MA) quotations: สัญญารายปี ผ่อนรายเดือน, อัตราค่าบริการต่อครั้ง, เหมารวมอะไหล่.
   Installation quotations: งานต่อเติม / รีโนเวท, Design & Build, งานเพิ่ม-ลด (VO). */

// ---- the parts every form here uses: labels in the quotation's language, header, cards, totals, signatures
function fsCtx(Q){const C=CO(),L=qmLang(Q),EN=L==='en';
  const t=(th,en,il)=>L==='en'?en:L==='th'?th:`${th}<i class="en${il?' il':''}">${en}</i>`,tx=(th,en)=>L==='en'?en:th;
  const dt=s=>{if(!okD(s))return '';const d=pd(s);return EN?d.toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'}):thDL(s)};
  const cu=C.customers.find(x=>x.id===Q.cust)||{},st=(C.staff||[]).find(s=>s.name&&Q.by&&s.name===Q.by)||{},c=qCalc(Q);
  const M=v=>Math.abs(v)<0.005?'<span class="dash">–</span>':fmt(v,2);
  const kv=(k,v,cl)=>v?`<div><span>${k}</span><b${cl?` class="${cl}"`:''}>${v}</b></div>`:'';
  const gN=g=>{const s=gName(g);return EN&&typeof I18N==='object'&&I18N.en&&I18N.en.x&&I18N.en.x[s]||s};
  const valid=okD(Q.date)&&n(Q.valid)?addD(Q.date,n(Q.valid)):'';
  const co=`<div class="qm-bar"></div><div class="qm-h"><div>${C.logo?`<img src="${C.logo}" alt="">`:`<span class="nm">${esc(C.name||'')}</span>`}</div>
    <div class="qm-co"><b>${esc(EN&&C.nameEn||C.name||'')}</b>${!EN&&C.nameEn?esc(C.nameEn)+'<br>':''}${esc(EN&&C.addrEn||C.addr||'')}${C.addr||C.addrEn?'<br>':''}${[C.phone?tx('โทร ','Tel. ')+esc(C.phone):'',esc(C.email||'')].filter(Boolean).join(' · ')}
    ${C.tax?`<br>${tx('เลขประจำตัวผู้เสียภาษี ','Tax ID ')}${esc(C.tax)}${C.branch?' ('+esc(C.branch)+')':''}`:''}</div></div>`;
  // title band: small English caps, the title, a line under it; the box beside it holds the number, date and the form's own rows
  const head=(th,en,cap,sub,more)=>{const meta=[[t('เลขที่','No.',1),`<b>${esc(Q.no||'')}</b>`],[t('วันที่','Date',1),dt(Q.date)],...(valid?[[t('ยืนราคาถึง','Valid until',1),dt(valid)]]:[]),
      ...(more||[]),...(Q.ref?[[t('อ้างอิง','Ref.',1),esc(Q.ref)]]:[]),...(Q.by?[[t('ผู้เสนอราคา','Sales',1),esc(Q.by)]]:[]),...(st.phone||st.email?[[t('ติดต่อ','Contact',1),esc([st.phone,st.email].filter(Boolean).join(' · '))]]:[])];
    return co+`<div class="qm-tt"><div class="qm-ti">${EN?'':`<small>${cap}</small>`}<h1>${EN?en:th}</h1>${sub?`<p>${esc(sub)}</p>`:''}</div>
      <div class="qm-m">${meta.map(([k,v])=>`<div><span>${k}</span><b>${v||'&nbsp;'}</b></div>`).join('')}</div></div>`};
  const attn=Q.attn||cu.contact||'';
  const custCard=()=>`<div class="qm-c"><h3>${t('ลูกค้า','Customer')}</h3>${kv(t('ชื่อ','Name',1),esc(cu.name||''),'big')}${kv(t('เรียน','Attn.',1),esc(attn))}${kv(t('ที่อยู่','Address',1),esc(cu.addr||''))}
    ${kv(t('เลขผู้เสียภาษี','Tax ID',1),esc(cu.tax||''))}${kv(t('โทร','Tel.',1),esc([cu.phone,cu.email].filter(Boolean).join(' · ')))}</div>`;
  const card=(h,rows)=>`<div class="qm-c"><h3>${h}</h3>${rows}</div>`;
  const tot=rows=>`<div class="qm-tot">${rows.filter(Boolean).map(([k,v,cl])=>`<div${cl?` class="${cl}"`:''}><span>${k}</span><b>${v}</b></div>`).join('')}</div>`;
  const words=v=>`<div class="qm-wd"><span>${t('จำนวนเงินตัวอักษร','Amount in words',1)}</span>${L!=='en'?`<b>(${esc(bahtText(v))})</b>`:''}${L!=='th'?`<b style="display:block${L==='bi'?';font-weight:400;font-size:9.5px;color:#4A5D66':''}">${qmWords(v)}</b>`:''}</div>`;
  const notes=String(Q.terms||'').split(/\n| · /).map(x=>x.trim()).filter(Boolean);
  const terms=extra=>`<div class="qm-tm"><h3>${t('เงื่อนไข','Terms &amp; conditions')}</h3>${n(Q.valid)?`<div class="row2"><span>${t('ยืนราคา','Validity')}</span><div>${EN?`${n(Q.valid)} days from the quotation date`:`${n(Q.valid)} วันนับจากวันที่เสนอราคา`}</div></div>`:''}
    ${extra||''}${notes.length?`<div><span style="color:var(--qg)">${t('หมายเหตุ','Notes',1)}</span><ol>${notes.map(x=>`<li>${esc(x)}</li>`).join('')}</ol></div>`:''}</div>`;
  const pay=()=>{const P=qEnsure(Q).qpay||[];return P.length?`<div><span style="color:var(--qg)">${t('การชำระเงิน','Payment',1)}</span><table class="pay"><thead><tr><th>${tx('งวด','No.')}</th><th>${tx('เมื่อ','When')}</th><th class="r">%</th><th class="r">${tx('จำนวนเงิน (รวม VAT)','Amount (incl. VAT)')}</th></tr></thead><tbody>
      ${P.map((x,k)=>`<tr><td>${esc(x.no||String(k+1))}</td><td>${esc(x.desc||'')}</td><td class="r">${fmt(x.pct,0)}%</td><td class="r">${fmt(c.grand*n(x.pct)/100,2)}</td></tr>`).join('')}</tbody></table></div>`:''};
  const blank=EN?'Date ........ / ........ / ........':'วันที่ ........ / ........ / ........';
  const signs=B=>`<div class="qm-sg" style="grid-template-columns:repeat(${B.length},1fr)">${B.map(([h,q,who,ok])=>`<div${ok?' class="ok"':''}><h4>${h}</h4>${q?`<div class="q">${q}</div>`:''}<div class="sp"></div><div class="ln"></div><div class="who">${who||'( ................................ )'}</div><div class="dt">${blank}</div></div>`).join('')}</div>`;
  const by=Q.by?`(${esc(Q.by)})`:'',boss=Q.signName?`(${esc(Q.signName)})${Q.signPos?`<br><small>${esc(Q.signPos)}</small>`:''}`:'';
  const ofoot=`<div class="ofoot"><span>${esc(C.name||'')}${C.email?' · '+esc(C.email):''}</span><span>${esc(Q.no||'')}${C.phone?' · '+tx('โทร ','Tel. ')+esc(C.phone):''}</span></div>`;
  const doc=(name,body)=>QM_CSS+`<div class="qm" data-doc-name="${esc([Q.no,name,[Q.pname,Q.title].filter(Boolean).join(' - ')].filter(Boolean).join(' '))}">${body}</div>${ofoot}`;
  const cols=w=>`<colgroup>${w.map(x=>`<col style="width:${x}%">`).join('')}</colgroup>`;
  return {C,L,EN,t,tx,dt,cu,st,c,M,kv,gN,head,custCard,card,tot,words,terms,pay,signs,by,boss,doc,cols,attn,notes}}
// the line's text, its number from the text when it carries one
const fsDesc=i=>esc([i.type,i.desc].filter(Boolean).join(' '));
// sections in order, each with its lines
function fsGroups(Q,keep){const G=[],by={};Q.items.forEach(i=>{if(keep&&!keep(i))return;let g=by[i.g];if(!g){g=by[i.g]={g:i.g,items:[],t:0};G.push(g)}g.items.push(i);g.t+=qLine(Q,i).t});return G}

// ---- the extra parts the forms add to the ORIEN Modern print
const fsBefore=(h,mark,add)=>{const k=h.lastIndexOf(mark);return k<0?h:h.slice(0,k)+add+h.slice(k)};
const fsSigns='<div class="qm-sg">';
// before the first table: a strip of the form's key numbers right under the customer cards
const fsTop=(h,add)=>{const k=h.indexOf('<table class="qm-t">');return k<0?h:h.slice(0,k)+add+h.slice(k)};
const FS_X=`<style>
#print .qm .fs-sec{margin:0 0 10px;border:1px solid var(--ql);border-radius:12px;padding:8px 12px;break-inside:avoid;font-size:10.5px}
#print .qm .fs-sec h3{display:flex;align-items:center;gap:6px;margin:0 0 6px;font-size:11px;color:var(--qt);font-weight:700}
#print .qm .fs-sec h3:before{content:"";width:8px;height:8px;border-radius:2px;background:var(--qt);transform:rotate(45deg)}
#print .qm .fs-sec h3 .en{display:inline;margin-left:2px}
#print .qm .fs-sec ul{margin:0;padding-left:16px}#print .qm .fs-sec li{margin:1px 0}
#print .qm .fs-2c{display:grid;grid-template-columns:1fr 1fr;gap:12px}
#print .qm .fs-2c .no li::marker{color:#C2410C}
#print .qm .fs-bill{display:grid;grid-template-columns:repeat(3,1fr);gap:4px 14px}
#print .qm .fs-bill div{display:flex;justify-content:space-between;gap:6px;border-bottom:1px solid #EDF3F4;padding:2px 0;font-variant-numeric:tabular-nums}
#print .qm .fs-bill span{color:var(--qg)}
#print .qm .fs-kpi{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin:0 0 10px}
#print .qm .fs-kpi>div{border-radius:12px;background:var(--qs);padding:8px 12px;break-inside:avoid}
#print .qm .fs-kpi span{display:block;color:var(--qg);font-size:9.5px}#print .qm .fs-kpi b{font-size:15px;color:var(--qn);font-variant-numeric:tabular-nums}
#print .qm .fs-kpi .en{display:inline;margin-left:3px}
#print .qm .fs-kpi>div.hi{background:linear-gradient(110deg,var(--qn),var(--qt));color:#fff}#print .qm .fs-kpi>div.hi span{color:var(--qe,#E3F1F3)}#print .qm .fs-kpi>div.hi b{color:#fff}
#print .qm table.qm-t tr.add td.r.v{color:#15803D}#print .qm table.qm-t tr.omit td.r.v{color:#B91C1C}
#print .qm .fs-steps{display:flex;gap:6px;margin:0 0 10px}
#print .qm .fs-steps>div{flex:1;border-radius:10px;background:var(--qs);padding:6px 8px;font-size:10px;position:relative}
#print .qm .fs-steps>div b{display:block;color:var(--qn);font-size:11px}
#print .qm .fs-steps>div i{font-style:normal;color:var(--qt);font-weight:700;margin-right:4px}
#print .qm .fs-pay{display:grid;grid-template-columns:repeat(auto-fit,minmax(110px,1fr));gap:8px;margin:4px 0 0}
#print .qm .fs-pay>div{border:1px solid var(--ql);border-radius:10px;padding:6px 8px;break-inside:avoid}
#print .qm .fs-pay span{display:block;color:var(--qg);font-size:9.5px}#print .qm .fs-pay b{color:var(--qn);font-size:12.5px;font-variant-numeric:tabular-nums}
#print .qm .fs-sc{font-size:10.5px}#print .qm .fs-sc>div{break-inside:avoid;border-bottom:1px solid #E6EEF0;padding:6px 0}
#print .qm .fs-sc .fs-gh{display:flex;justify-content:space-between;gap:10px;font-weight:700;color:var(--qn);font-size:11.5px}
#print .qm .fs-sc ul{margin:3px 0 0;padding-left:18px}#print .qm .fs-sc li{display:flex;justify-content:space-between;gap:10px}
#print .qm .fs-sc li span{color:var(--qg);white-space:nowrap}
</style>`;
// a form's colour over a print made by another function
const fsTint=(h,hex)=>FS_CSS+FS_X+h.replace('<div class="qm"',`<div class="qm fs-brand" style="${Object.entries(fsVars(hex)).map(([k,v])=>`${k}:${v}`).join(';')}"`);

// ===== service (PM/MA) quotations
const FS_COVER_IN=['อะไหล่ที่เสื่อมตามการใช้งาน เช่น สายพาน ลูกปืน ฟิลเตอร์ คาปาซิเตอร์','แผงวงจรควบคุมและเซนเซอร์','มอเตอร์พัดลมและปั๊ม','น้ำยาทำความเย็นที่ต้องเติมจากการรั่วซึม','ค่าแรงเปลี่ยนอะไหล่และค่าเดินทาง'];
const FS_COVER_OUT=['ความเสียหายจากภัยธรรมชาติ น้ำท่วม ไฟไหม้','การใช้งานผิดวิธี หรือการดัดแปลงโดยผู้อื่น','ไฟตก ไฟเกิน หรือระบบไฟฟ้าของอาคารผิดปกติ','งานโครงสร้าง ท่อ หรือสายไฟที่อยู่นอกเครื่อง','เครื่องที่ไม่ได้อยู่ในรายการของสัญญานี้'];
FS_FORMS.push(
  {id:'ma-year',g:'ma',k:'ma',n:'สัญญารายปี ผ่อนรายเดือน',d:'ตารางผ่อนชำระรายเดือนครบทั้งสัญญา และข้อสัญญาต่ออายุ ยกเลิก ราคาคงที่',p:690,col:'#15803D',
    pr:Q=>{const X=fsCtx(Q),m=qmMonths(Q),per=X.c.grand/m,s=okD(Q.maStart)?Q.maStart:'';
      const mon=k=>s?(X.EN?pd(addMon(s,k)).toLocaleDateString('en-GB',{month:'short',year:'2-digit'}):pd(addMon(s,k)).toLocaleDateString('th-TH',{month:'short',year:'2-digit'})):(X.EN?'Month ':'เดือนที่ ')+(k+1);
      const bill=`<div class="fs-sec"><h3>${X.t('ตารางชำระค่าบริการรายเดือน','Monthly billing schedule')}</h3><div class="fs-bill">${Array.from({length:m},(_,k)=>`<div><span>${X.tx('งวด','No.')} ${k+1} · ${mon(k)}</span><b>${fmt(per,2)}</b></div>`).join('')}</div>
        <p style="margin:6px 0 0;color:var(--qg)">${X.tx(`ชำระเดือนละ ${fmt(per,2)} บาท (รวม VAT) ${m} งวด รวม ${fmt(X.c.grand,2)} บาท`,`${m} monthly payments of ${fmt(per,2)} (incl. VAT), ${fmt(X.c.grand,2)} in all`)}</p></div>`;
      const cl=X.EN?['Each monthly invoice is paid within 30 days of receipt.','The contract renews for another year unless either side gives 30 days notice in writing.','Prices stay fixed for the whole term.',Q.maParts==='all'?'Spare parts are included.':'Any part that must be replaced is quoted for your approval first.','Either side may end the contract with 30 days notice; months already serviced are paid in full.']
        :['ชำระค่าบริการแต่ละงวดภายใน 30 วันนับจากวันที่ได้รับใบแจ้งหนี้','สัญญาต่ออายุคราวละ 1 ปี เว้นแต่ฝ่ายใดแจ้งเลิกเป็นหนังสือล่วงหน้า 30 วัน','ราคาคงที่ตลอดอายุสัญญา',Q.maParts==='all'?'รวมค่าอะไหล่ตามรายการในสัญญานี้':'อะไหล่ที่ต้องเปลี่ยนจะเสนอราคาให้อนุมัติก่อนทุกครั้ง','ยกเลิกสัญญาได้โดยแจ้งล่วงหน้า 30 วัน เดือนที่ให้บริการแล้วชำระตามจริง'];
      const cls=`<div class="fs-sec"><h3>${X.t('ข้อสัญญา','Contract terms')}</h3><ol style="margin:0;padding-left:16px">${cl.map(x=>`<li>${esc(x)}</li>`).join('')}</ol></div>`;
      const kpi=`<div class="fs-kpi"><div><span>${X.t('ระยะสัญญา','Contract term',1)}</span><b>${X.EN?m+' months':m+' เดือน'}</b></div><div class="hi"><span>${X.t('ผ่อนเดือนละ (รวม VAT)','Monthly (incl. VAT)',1)}</span><b>${fmt(per,2)}</b></div><div><span>${X.t('รวมทั้งสัญญา (รวม VAT)','Whole contract (incl. VAT)',1)}</span><b>${fmt(X.c.grand,2)}</b></div></div>`;
      return fsTint(fsTop(fsBefore(qmPrint(Q),fsSigns,bill+cls),kpi),'#15803D')}},
  {id:'ma-visit',g:'ma',k:'ma',n:'อัตราค่าบริการต่อครั้ง',d:'ใบเสนออัตราค่าบริการต่อเครื่องต่อครั้ง สำหรับลูกค้าที่เรียกใช้เมื่อต้องการ ไม่ผูกสัญญา',p:690,col:'#4338CA',
    inp:[['maCall','ค่าเดินทางต่อครั้ง (บาท)','num'],['maHour','ค่าแรงซ่อมนอกรายการ ชั่วโมงละ (บาท)','num'],['maMin','ค่าบริการขั้นต่ำต่อครั้ง (บาท)','num']],
    pr:Q=>{const X=fsCtx(Q),{t,tx}=X,call=n(Q.maCall),rows=Q.items.map((i,k)=>{const u=qmPerVisit(Q,i);return {i,u,a:n(i.q)*u}}),sub=sum(rows,r=>r.a),base=Math.max(sub+call,n(Q.maMin)),vat=base*0.07;
      const tb=`<table class="qm-t">${X.cols([7,0,9,9,17,17].map((x,k,a)=>k===1?100-a.reduce((s,y,j)=>j===1?s:s+y,0):x))}<thead><tr class="ch"><th>${t('ลำดับ','No.')}</th><th>${t('เครื่อง / ระบบ','Equipment / system')}</th><th>${t('จำนวน','Qty')}</th><th>${t('หน่วย','Unit')}</th><th>${t('ราคาต่อหน่วยต่อครั้ง','Per unit per visit')}</th><th>${t('รวมต่อครั้ง','Per visit')}</th></tr></thead>
        <tbody>${rows.map((r,k)=>`<tr><td class="n">${k+1}</td><td>${fsDesc(r.i)}</td><td class="c">${fmtq(r.i.q)}</td><td class="c">${esc(r.i.unit||'')}</td><td class="r">${X.M(r.u)}</td><td class="r">${fmt(r.a,2)}</td></tr>`).join('')}
        <tr class="tt"><td></td><td>${t('ค่าบริการต่อครั้ง เมื่อเรียกใช้ทุกเครื่อง','Per visit, all units',1)}</td><td colspan="3"></td><td class="r">${fmt(sub,2)}</td></tr></tbody></table>`;
      const rate=X.card(t('อัตราค่าบริการ','Service rates'),`${X.kv(t('ค่าเดินทาง','Call-out fee',1),call?fmt(call,2)+tx(' บาท/ครั้ง',' per visit'):tx('ไม่คิด','None'),'big')}${X.kv(t('ค่าแรงนอกรายการ','Extra labour',1),n(Q.maHour)?fmt(Q.maHour,2)+tx(' บาท/ชั่วโมง',' per hour'):'')}
        ${X.kv(t('ขั้นต่ำต่อครั้ง','Minimum charge',1),n(Q.maMin)?fmt(Q.maMin,2)+tx(' บาท',''):'')}${X.kv(t('เมื่อแจ้งเสีย','Breakdown call',1),esc(Q.maResp||''))}${X.kv(t('เวลาให้บริการ','Service hours',1),esc(Q.maHours||''))}`);
      const tt=X.tot([[t('ค่าบริการทุกเครื่อง','All units',1),fmt(sub,2)],call?[t('ค่าเดินทาง','Call-out fee',1),fmt(call,2)]:null,base>sub+call?[t('ปรับเป็นค่าบริการขั้นต่ำ','Minimum charge',1),fmt(base,2)]:null,
        [t('ภาษีมูลค่าเพิ่ม 7%','VAT 7%',1),fmt(vat,2)],[t('รวมต่อครั้ง (รวม VAT)','Per visit (incl. VAT)'),fmt(base+vat,2),'gt']]);
      const ex=`<div class="row2"><span>${t('การชำระเงิน','Payment')}</span><div>${tx('ชำระหลังให้บริการแต่ละครั้ง ภายใน 30 วันนับจากวันที่ได้รับใบแจ้งหนี้','After each visit, within 30 days of the invoice')}</div></div>
        <div class="row2"><span>${t('อะไหล่','Spare parts')}</span><div>${tx('เสนอราคาให้อนุมัติก่อนเปลี่ยนทุกครั้ง','Quoted for approval before any replacement')}</div></div>`;
      const intro=`<p class="qm-in">${tx(`บริษัทฯ ขอเสนออัตราค่าบริการบำรุงรักษาต่อครั้ง${X.cu.name?' ให้แก่ '+esc(X.cu.name):''} เรียกใช้เมื่อต้องการ ไม่มีข้อผูกพันรายปี`,'We offer the following per-visit maintenance rates, on call, with no yearly commitment.')}</p>`;
      return fsTint(X.doc(tx('อัตราค่าบริการ','Service rates'),X.head('ใบเสนออัตราค่าบริการ','Service Rate Card','SERVICE RATE CARD',[Q.title,X.cu.name].filter(Boolean).join(' · '))+`<div class="qm-2">${X.custCard()}${rate}</div>${intro}${tb}
        <div class="qm-ft">${X.terms(ex)}<div>${tt}${X.words(base+vat)}</div></div>${qmScope(Q,t,tx)}${X.signs([[t('ผู้เสนอราคา','Prepared by'),'',X.by],[t('ผู้อนุมัติ','Approved by'),'',X.boss],[t('ลูกค้ายืนยัน','Customer acceptance'),tx('ยอมรับอัตราค่าบริการตามใบเสนอนี้','We accept these rates'),'',1]])}`),'#4338CA')}},
  {id:'ma-all',g:'ma',k:'ma',n:'เหมารวมอะไหล่',d:'สัญญาบริการรวมอะไหล่ บอกชัดว่าคุ้มครองอะไร ไม่คุ้มครองอะไร วงเงินอะไหล่ และเวลาซ่อมเสร็จ',p:690,col:'#7E22CE',set:{maParts:'all'},
    inp:[['maCap','วงเงินอะไหล่ต่อปี (บาท, ว่าง = ไม่จำกัด)','num'],['maFix','ซ่อมเสร็จภายใน','',"เช่น 48 ชั่วโมงหลังเข้าตรวจ"]],
    pr:Q=>{const X=fsCtx(Q),{t,tx}=X,EN=X.EN;
      const L=(a,cl)=>`<ul${cl?` class="${cl}"`:''}>${a.map(x=>`<li>${esc(x)}</li>`).join('')}</ul>`;
      const cov=`<div class="fs-sec"><h3>${t('ความคุ้มครองอะไหล่','Parts coverage')}</h3><div class="fs-2c"><div><b style="color:#15803D">✓ ${tx('คุ้มครอง','Covered')}</b>${L(EN?['Wear parts: belts, bearings, filters, capacitors','Control boards and sensors','Fan and pump motors','Refrigerant top-up after a leak','Labour and travel for replacements']:FS_COVER_IN)}</div>
        <div class="no"><b style="color:#B91C1C">✕ ${tx('ไม่คุ้มครอง','Not covered')}</b>${L(EN?['Natural disasters, flood, fire','Misuse or changes made by others','Power dips, surges or faults in the building supply','Structure, pipes or cables outside the unit','Units not listed in this contract']:FS_COVER_OUT)}</div></div>
</div>`;
      const kpi=`<div class="fs-kpi"><div><span>${t('วงเงินอะไหล่ต่อปี','Parts limit a year',1)}</span><b>${n(Q.maCap)?fmt(Q.maCap,0)+tx(' บาท',''):tx('ไม่จำกัด','No limit')}</b></div>
          <div><span>${t('เมื่อแจ้งเสีย','Breakdown call',1)}</span><b>${esc(Q.maResp||tx('ภายใน 24 ชั่วโมง','Within 24 hours'))}</b></div><div class="hi"><span>${t('ซ่อมเสร็จภายใน','Repaired within',1)}</span><b>${esc(Q.maFix||tx('48 ชั่วโมงหลังเข้าตรวจ','48 hours after inspection'))}</b></div></div>`;
      return fsTint(fsTop(fsBefore(qmPrint(Object.assign({},Q,{maParts:'all'})),fsSigns,cov),kpi),'#7E22CE')}});

// ===== installation quotations
// ต่อเติม / รีโนเวท: for home owners and small shops: what is done in each part, one price per line, the instalments in big boxes
FS_FORMS.push(
  {id:'sp-reno',g:'sp',k:'boq',n:'งานต่อเติม / รีโนเวท',d:'อ่านง่ายสำหรับเจ้าของบ้านและร้านค้า บอกงานแต่ละส่วน ราคาเดียวต่อรายการ งวดเงินเป็นกล่องใหญ่',p:490,col:'#C2410C',
    pr:Q=>{const X=fsCtx(Q),{t,tx,c}=X,G=fsGroups(Q),P=qEnsure(Q).qpay||[];
      const sc=`<div class="fs-sec"><h3>${t('ขอบเขตงานและราคา','Scope of work and price')}</h3><div class="fs-sc">${G.map((g,k)=>`<div><div class="fs-gh"><span>${k+1}. ${esc(X.gN(g.g))}</span><span>${fmt(g.t,2)}</span></div>
        <ul>${g.items.map(i=>{const x=qLine(Q,i);return `<li><div>${fsDesc(i)}</div><span>${fmtq(i.q)} ${esc(i.unit||'')} · ${fmt(x.t,2)}</span></li>`}).join('')}</ul></div>`).join('')}</div></div>`;
      const pay=P.length?`<div class="fs-sec"><h3>${t('งวดการชำระเงิน','Payment instalments')}</h3><div class="fs-pay">${P.map((x,k)=>`<div><span>${tx('งวดที่','No.')} ${esc(x.no||String(k+1))} · ${fmt(x.pct,0)}%</span><b>${fmt(c.grand*n(x.pct)/100,2)}</b><span>${esc(x.desc||'')}</span></div>`).join('')}</div></div>`:'';
      const wr=`<div class="row2"><span>${t('รับประกันผลงาน','Warranty')}</span><div>${esc(Q.warr||tx('1 ปี นับจากวันส่งมอบงาน','1 year from handover'))}</div></div>${Q.dlv?`<div class="row2"><span>${t('แล้วเสร็จ','Completion')}</span><div>${esc(Q.dlv)}</div></div>`:''}`;
      const tt=X.tot([[t('รวมค่างาน','Subtotal',1),fmt(c.sub,2)],c.disc?[t('ส่วนลด','Discount',1),'-'+fmt(c.disc,2),'d']:null,[t('ภาษีมูลค่าเพิ่ม 7%','VAT 7%',1),fmt(c.vat,2)],[t('ราคารวมทั้งสิ้น','Total price'),fmt(c.grand,2),'gt']]);
      const site=X.card(t('สถานที่ทำงาน','Work site'),`${X.kv(t('งาน','Work',1),esc(Q.title||''),'big')}${X.kv(t('สถานที่','Site',1),esc(Q.site||Q.pname||''))}${X.kv(t('แล้วเสร็จ','Completion',1),esc(Q.dlv||''))}`);
      return fsTint(X.doc(tx('ใบเสนอราคา','Quotation'),X.head('ใบเสนอราคางานปรับปรุง / ต่อเติม','Renovation Quotation','RENOVATION QUOTATION',[Q.title,Q.site].filter(Boolean).join(' · '))+`<div class="qm-2">${X.custCard()}${site}</div>${sc}${pay}
        <div class="qm-ft">${X.terms(wr)}<div>${tt}${X.words(c.grand)}</div></div>${X.signs([[t('ผู้รับเหมา','Contractor'),'',X.by||X.boss],[t('ผู้ว่าจ้าง / เจ้าของบ้าน','Owner'),tx('ตกลงจ้างตามรายการและราคานี้','We accept this quotation'),'',1]])}`),'#C2410C')}},
  {id:'sp-db',g:'sp',k:'boq',n:'Design & Build',d:'แยกค่าออกแบบกับค่าก่อสร้างชัดเจน บอกสิ่งที่ส่งมอบงานออกแบบ และขั้นตอนงานตั้งแต่ออกแบบถึงส่งมอบ',p:990,col:'#0F766E',
    inp:[['dbDel','สิ่งที่ส่งมอบงานออกแบบ (บรรทัดละรายการ)','area','แบบสถาปัตยกรรมและงานระบบ\nรายการคำนวณ\nBOQ และราคา\nยื่นขออนุญาต']],
    pr:Q=>{const X=fsCtx(Q),{t,tx,c}=X,isD=i=>/ออกแบบ|design|ที่ปรึกษา|consult|เขียนแบบ|drawing/i.test(gName(i.g)+' '+(i.head||'')),D=fsGroups(Q,isD),B=fsGroups(Q,i=>!isD(i));
      const tD=sum(D,g=>g.t),tB=sum(B,g=>g.t),k=c.lines&&(tD+tB)?c.sub/(tD+tB):1;// the overhead and adds go to both parts by their size
      const del=String(Q.dbDel||'').split('\n').map(x=>x.trim()).filter(Boolean);
      const DL=del.length?del:(X.EN?['Architectural and building-systems drawings','Calculations','BOQ and price','Building permit application']:['แบบสถาปัตยกรรมและงานระบบ','รายการคำนวณ','BOQ และราคา','ยื่นขออนุญาตก่อสร้าง']);
      const kpi=`<div class="fs-kpi"><div><span>${t('ส่วนที่ 1 งานออกแบบ','Part 1 Design',1)}</span><b>${fmt(tD*k,2)}</b></div><div><span>${t('ส่วนที่ 2 งานก่อสร้าง','Part 2 Construction',1)}</span><b>${fmt(tB*k,2)}</b></div><div class="hi"><span>${t('รวมทั้งโครงการ (รวม VAT)','Whole project (incl. VAT)',1)}</span><b>${fmt(c.grand,2)}</b></div></div>`;
      const steps=`<div class="fs-steps">${(X.EN?[['Design','Drawings and price'],['Approval','You approve the design'],['Build','Construction'],['Handover','Testing and handover']]:[['ออกแบบ','ทำแบบและราคา'],['อนุมัติแบบ','ผู้ว่าจ้างอนุมัติแบบ'],['ก่อสร้าง','ลงมือก่อสร้าง'],['ส่งมอบ','ทดสอบและส่งมอบงาน']]).map(([a,b],i)=>`<div><b><i>${i+1}</i>${a}</b>${b}</div>`).join('')}</div>`;
      const part=(h,G)=>G.length?`<table class="qm-t">${X.cols([8,0,22].map((x,j,a)=>j===1?100-a.reduce((s,y,q)=>q===1?s:s+y,0):x))}<thead><tr class="ch"><th>${t('ลำดับ','No.')}</th><th>${h}</th><th>${t('จำนวนเงิน','Amount')}</th></tr></thead>
        <tbody>${G.map((g,j)=>`<tr><td class="n">${j+1}</td><td>${esc(X.gN(g.g))}</td><td class="r">${fmt(g.t*k,2)}</td></tr>`).join('')}<tr class="tt"><td></td><td>${t('รวม','Total',1)}</td><td class="r">${fmt(sum(G,g=>g.t)*k,2)}</td></tr></tbody></table>`:'';
      const dsec=`<div class="fs-sec"><h3>${t('สิ่งที่ส่งมอบในงานออกแบบ','Design deliverables')}</h3><ul>${DL.map(x=>`<li>${esc(x)}</li>`).join('')}</ul></div>`;
      const tt=X.tot([[t('งานออกแบบ','Design',1),fmt(tD*k,2)],[t('งานก่อสร้าง','Construction',1),fmt(tB*k,2)],c.disc?[t('ส่วนลด','Discount',1),'-'+fmt(c.disc,2),'d']:null,[t('ภาษีมูลค่าเพิ่ม 7%','VAT 7%',1),fmt(c.vat,2)],[t('จำนวนเงินรวมทั้งสิ้น','Grand total'),fmt(c.grand,2),'gt']]);
      const pj=X.card(t('โครงการ','Project'),`${X.kv(t('โครงการ','Project',1),esc(Q.pname||Q.title||''),'big')}${X.kv(t('สถานที่','Site',1),esc(Q.site||''))}${X.kv(t('แล้วเสร็จ','Completion',1),esc(Q.dlv||''))}`);
      const body=X.head('ใบเสนอราคาออกแบบและก่อสร้าง','Design &amp; Build Proposal','DESIGN &amp; BUILD PROPOSAL',[Q.title,Q.pname].filter(Boolean).join(' · '))+`<div class="qm-2">${X.custCard()}${pj}</div>${kpi}${steps}
        ${part(t('ส่วนที่ 1 งานออกแบบ','Part 1 Design'),D)}${part(t('ส่วนที่ 2 งานก่อสร้าง','Part 2 Construction'),B)}${dsec}<div class="qm-ft">${X.terms(X.pay())}<div>${tt}${X.words(c.grand)}</div></div>
        ${X.signs([[t('ผู้เสนอราคา','Prepared by'),'',X.by],[t('ผู้อนุมัติ','Approved by'),'',X.boss],[t('ผู้ว่าจ้างยืนยัน','Client acceptance'),tx('ตกลงจ้างออกแบบและก่อสร้างตามใบเสนอนี้','We accept this proposal'),'',1]])}`;
      return fsTint(X.doc('Design &amp; Build',body),'#0F766E')}},
  // งานเพิ่ม-ลด: a line with a negative quantity is work taken out
  {id:'sp-vo',g:'sp',k:'boq',n:'งานเพิ่ม-ลด (VO)',d:'แยกงานเพิ่มกับงานลด (จำนวนติดลบ = งานลด) สรุปมูลค่าสัญญาเดิม ส่วนต่าง และมูลค่าสัญญาใหม่',p:990,col:'#1D4ED8',
    inp:[['voNo','เลขที่ VO','','เช่น VO-03'],['voBase','มูลค่าสัญญาเดิม ไม่รวม VAT (บาท)','num'],['voDays','ขยายเวลา (วัน)','num'],['voWhy','เหตุผลที่เปลี่ยนแปลง','area']],
    pr:Q=>{const X=fsCtx(Q),{t,tx,c}=X,G=fsGroups(Q);let A=0,O=0;
      const rows=G.map((g,k)=>`<tr class="g"><td class="n">${k+1}</td><td colspan="7">${esc(X.gN(g.g))}</td></tr>`+g.items.map((i,j)=>{const q=n(i.q),u=Math.abs(qUnit(Q,i)),v=q*u;if(v>=0)A+=v;else O-=v;
        return `<tr class="${v<0?'omit':'add'}"><td class="n">${k+1}.${j+1}</td><td>${fsDesc(i)}</td><td class="c">${esc(i.unit||'')}</td><td class="c">${q>0?fmtq(q):''}</td><td class="c">${q<0?fmtq(-q):''}</td><td class="r">${X.M(u)}</td><td class="r v">${v>0?fmt(v,2):''}</td><td class="r v">${v<0?fmt(-v,2):''}</td></tr>`}).join('')).join('');
      const net=A-O,base=n(Q.voBase),after=net-c.disc,vat=after*0.07;
      const tb=`<table class="qm-t">${X.cols([7,0,7,8,8,12,12,12].map((x,j,a)=>j===1?100-a.reduce((s,y,q)=>q===1?s:s+y,0):x))}<thead><tr class="ch"><th>${t('ลำดับ','No.')}</th><th>${t('รายการ','Description')}</th><th>${t('หน่วย','Unit')}</th><th>${t('จำนวนเพิ่ม','Qty added')}</th><th>${t('จำนวนลด','Qty omitted')}</th><th>${t('ราคา/หน่วย','Unit price')}</th><th>${t('เงินเพิ่ม','Added')}</th><th>${t('เงินลด','Omitted')}</th></tr></thead>
        <tbody>${rows}<tr class="tt"><td></td><td>${t('รวม','Total',1)}</td><td colspan="4"></td><td class="r">${fmt(A,2)}</td><td class="r">${fmt(O,2)}</td></tr></tbody></table>`;
      const kpi=`<div class="fs-kpi"><div><span>${t('งานเพิ่ม','Added work',1)}</span><b style="color:#15803D">+${fmt(A,2)}</b></div><div><span>${t('งานลด','Omitted work',1)}</span><b style="color:#B91C1C">-${fmt(O,2)}</b></div><div class="hi"><span>${t('ส่วนต่างสุทธิ ไม่รวม VAT','Net change excl. VAT',1)}</span><b>${after<0?'-':'+'}${fmt(Math.abs(after),2)}</b></div></div>`;
      const ctr=X.card(t('สัญญา','Contract'),`${X.kv(t('โครงการ','Project',1),esc(Q.pname||''),'big')}${X.kv(t('เลขที่สัญญา','Contract no.',1),esc(Q.ref||''))}${X.kv(t('เลขที่ VO','VO no.',1),esc(Q.voNo||''))}
        ${X.kv(t('มูลค่าสัญญาเดิม','Original contract',1),base?fmt(base,2):'')}${X.kv(t('มูลค่าสัญญาใหม่','Revised contract',1),base?`<span style="color:var(--qn)">${fmt(base+after,2)}</span>`:'')}${X.kv(t('ขยายเวลา','Time extension',1),n(Q.voDays)?(X.EN?`${n(Q.voDays)} days`:`${n(Q.voDays)} วัน`):tx('ไม่ขยาย','None'))}`);
      const why=Q.voWhy?`<div class="fs-sec"><h3>${t('เหตุผลที่เปลี่ยนแปลง','Reason for the change')}</h3>${esc(Q.voWhy).replace(/\n/g,'<br>')}</div>`:'';
      const tt=X.tot([[t('งานเพิ่ม','Added work',1),fmt(A,2)],[t('งานลด','Omitted work',1),'-'+fmt(O,2),'d'],c.disc?[t('ส่วนลด','Discount',1),'-'+fmt(c.disc,2),'d']:null,[t('ส่วนต่างสุทธิ','Net change',1),fmt(after,2)],[t('ภาษีมูลค่าเพิ่ม 7%','VAT 7%',1),fmt(vat,2)],
        [after<0?t('ยอดลดลงรวม VAT','Total decrease incl. VAT'):t('ยอดเพิ่มขึ้นรวม VAT','Total increase incl. VAT'),fmt(Math.abs(after+vat),2),'gt'],base?[t('มูลค่าสัญญาใหม่ (ไม่รวม VAT)','Revised contract (excl. VAT)',1),fmt(base+after,2),'pm']:null]);
      const body=X.head('ใบเสนอราคางานเพิ่ม-ลด','Variation Order Quotation','VARIATION ORDER',[Q.voNo,Q.title,Q.pname].filter(Boolean).join(' · '))+`<div class="qm-2">${X.custCard()}${ctr}</div>${kpi}${why}${tb}
        <div class="qm-ft">${X.terms()}<div>${tt}${X.words(Math.abs(after+vat))}</div></div>${X.signs([[t('ผู้เสนอราคา','Prepared by'),'',X.by],[t('ผู้ควบคุมงาน / ที่ปรึกษา','Supervisor / consultant'),tx('ตรวจสอบปริมาณงานและราคาแล้ว','Quantities and prices checked'),''],[t('ผู้ว่าจ้างอนุมัติ','Client approval'),tx('อนุมัติงานเพิ่ม-ลดตามรายการนี้','We approve this variation'),'',1]])}`;
      return fsTint(X.doc('VO',body),'#1D4ED8')}});
