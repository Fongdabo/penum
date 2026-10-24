/* ---------- 4.10 ร้านฟอร์ม ORIEN: the forms sold in the shop (983-form-shop.js lists them, opens them by licence, shows the shop) ----------
   Each form prints the quotation's own data. Forms built on the ORIEN Modern print (981) add their parts to it; the others have their
   own layout here but keep its classes (QM_CSS), so they read as one family and take a colour from fsVars().
   Service (PM/MA) quotations: สัญญารายปี ผ่อนรายเดือน, อัตราค่าบริการต่อครั้ง, เหมารวมอะไหล่.
   Installation quotations: งานต่อเติม / รีโนเวท, Design & Build, งานเพิ่ม-ลด (VO); government ปร.4, ปร.5 (ก), ปร.5 (ข), ปร.6;
   building systems: แอร์, ไฟฟ้า, ประปา-สุขาภิบาล, ดับเพลิง, รวมทุกระบบแยกหมวด. */

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
  const custCard=()=>`<div class="qm-c"><h3>${t('ลูกค้า','Customer')}</h3>${kv(t('ชื่อ','Name',1),esc(EN&&cu.nameEn||cu.name||''),'big')}${kv(t('เรียน','Attn.',1),esc(attn))}${kv(t('ที่อยู่','Address',1),esc(EN&&cu.addrEn||cu.addr||''))}
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
#print .qm .fs-kpi small{display:block;font-size:9px;color:var(--qg)}#print .qm .fs-kpi>div.hi small{color:var(--qe,#E3F1F3)}
#print .qm .fs-sec b.fs-lh{display:block;margin:4px 0 1px;color:var(--qn)}
#print .qm table.fs-sys{width:100%;border-collapse:collapse;font-size:10.5px;-webkit-print-color-adjust:exact;print-color-adjust:exact}
#print .qm table.fs-sys th{text-align:left;color:var(--qg);font-weight:600;border:none;border-bottom:1px solid var(--ql);padding:3px 4px;background:none}
#print .qm table.fs-sys td{padding:4px;border:none;border-bottom:1px solid #EDF3F4;background:none}
#print .qm table.fs-sys .r{text-align:right;font-variant-numeric:tabular-nums}
#print .qm table.fs-sys td i{display:inline-block;width:9px;height:9px;border-radius:2px;margin-right:6px;vertical-align:middle}
#print .qm table.fs-sys .bar{display:inline-block;width:80px;height:7px;border-radius:4px;background:#EDF2F4;vertical-align:middle;overflow:hidden;margin-right:4px}
#print .qm table.fs-sys .bar span{display:block;height:100%;border-radius:4px}
#print .qm table.fs-sys tr.tt td{font-weight:700;border-top:1.5px solid var(--qn);border-bottom:none}
#print .qm .fs-row{display:grid;grid-template-columns:150px 1fr;gap:10px;padding:4px 0;border-bottom:1px solid #EDF3F4;break-inside:avoid}
#print .qm .fs-row:last-child{border-bottom:none}
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

// ===== government forms: ปร.4, ปร.5 (ก), ปร.5 (ข), ปร.6. Thai only, black on white, laid out as the agencies ask; the company's logo and name sit small on top.
// ค่างานต้นทุน is a line before the mark-up; Factor F turns it into the price. With no Factor F typed, the form uses the one that gives this quotation's own total.
// ครุภัณฑ์จัดซื้อ (equipment bought in) takes VAT only (ปร.5 (ข)): the sections whose name says ครุภัณฑ์, or the section numbers typed in govEq.
const FS_GOV=`<style>
#print .fsg{font-size:11px;color:#000;line-height:1.45;font-family:"Sarabun","TH Sarabun New","IBM Plex Sans Thai",Tahoma,sans-serif}
#print .fsg .gtop{display:flex;justify-content:space-between;align-items:flex-end;gap:10px;font-size:10.5px;margin-bottom:2px}
#print .fsg .gtop .gco{display:flex;align-items:center;gap:6px;color:#333}#print .fsg .gtop img{max-height:26px;max-width:110px}
#print .fsg .gtop .gfm{text-align:right;white-space:nowrap}#print .fsg .gtop .gfm b{font-size:12px;border:1.2px solid #000;padding:1px 8px;margin-left:8px}
#print .fsg h1{text-align:center;font-size:15px;margin:4px 0 6px;font-weight:700;color:#000}
#print .fsg table{width:100%;border-collapse:collapse}
#print .fsg table.gk{margin:0 0 6px}#print .fsg table.gk td{border:none;padding:1px 4px;vertical-align:bottom;background:none}
#print .fsg table.gk td.k{width:1%;white-space:nowrap;padding-left:0}#print .fsg table.gk td.v{border-bottom:1px dotted #000}
#print .fsg table.gt th,#print .fsg table.gt td{border:1px solid #000;padding:3px 5px;background:#fff;color:#000;vertical-align:top}
#print .fsg table.gt th{font-weight:700;text-align:center;vertical-align:middle}
#print .fsg table.gt td.r{text-align:right;font-variant-numeric:tabular-nums;white-space:nowrap}#print .fsg table.gt td.c{text-align:center}
#print .fsg table.gt tr.g td{font-weight:700}#print .fsg table.gt tr.s td{font-weight:700;background:#F2F2F2}
#print .fsg table.gt tr.t td{font-weight:700;border-top:2px solid #000}#print .fsg table.gt tr.w td{text-align:center;font-weight:700}
#print .fsg .gn{margin:6px 0;font-size:10.5px}
#print .fsg .gs{display:grid;gap:14px;margin-top:22px;break-inside:avoid}
#print .fsg .gs>div{text-align:center;font-size:10.5px}#print .fsg .gs .ln{margin-top:26px}#print .fsg .gs small{display:block;color:#444}
</style>`;
const fsGovEq=(Q,g,k)=>{const L=String(Q.govEq||'').split(/[\s,]+/).filter(Boolean);return L.length?L.includes(String(k+1)):/ครุภัณฑ์|equipment/i.test(gName(g))};
// a line's cost before the mark-up, split into material and labour when the line has them
function fsCost(Q,i){const q=n(i.q),m=n(i.m),l=n(i.l),b=q*(m+l),t=n(i.t)||b||qLine(Q,i).t,k=b?t/b:0;return {t,sp:!!b,mu:m*k,lu:l*k,mt:q*m*k,lt:q*l*k}}
// sections with their cost and price (the quotation's discount and added rows spread over them), split into building work and equipment
function fsGov(Q){const c=qCalc(Q),G=fsGroups(Q),all=sum(G,g=>g.t),s=all?c.net/all:1;
  G.forEach((g,k)=>{g.k=k;g.eq=fsGovEq(Q,g.g,k);g.cost=sum(g.items,i=>fsCost(Q,i).t);g.price=g.t*s});
  let A=G.filter(g=>!g.eq),B=G.filter(g=>g.eq);if(!A.length){A=B;B=[]}
  const cA=sum(A,g=>g.cost),pA=sum(A,g=>g.price),pB=sum(B,g=>g.price),own=n(Q.govF)>0,F=own?n(Q.govF):cA?Math.round(pA*1.07/cA*10000)/10000:1;
  return {s,G,A,B,cA,F,own,tA:cA*F,pB,vB:pB*0.07,tB:pB*1.07,tot:cA*F+pB*1.07}}
const fsGv=v=>v===''||v==null?'......':fmtq(v);
function fsGovHead(Q,form,title,rows){const C=CO(),cu=C.customers.find(x=>x.id===Q.cust)||{};
  const R=[['ชื่อโครงการ / งานก่อสร้าง',Q.pname||Q.title],['สถานที่ก่อสร้าง',Q.site],['หน่วยงานเจ้าของโครงการ',Q.govOrg||cu.name],...(rows||[])];
  return `<div class="gtop"><div class="gco">${C.logo?`<img src="${C.logo}" alt="">`:''}<span>${esc(C.name||'')}</span></div><div class="gfm">แผ่นที่ ...... / ......<b>แบบ ${form}</b></div></div>
    <h1>${title}</h1><table class="gk"><tbody>${R.map(([k,v])=>`<tr><td class="k">${k}</td><td class="v">${esc(v==null?'':String(v))||'&nbsp;'}</td></tr>`).join('')}</tbody></table>`}
// who signs: the names typed in govCom ("name | role" a line), else the company's estimator, checker and bidder
function fsGovSigns(Q){const L=String(Q.govCom||'').split('\n').map(x=>x.trim()).filter(Boolean).map(x=>{const [a,b]=x.split('|').map(y=>y.trim());return [a,b||'กรรมการ']});
  const B=L.length?L:[[Q.by||'','ผู้ประมาณราคา'],['','ผู้ตรวจสอบ'],[Q.signName||'','ผู้เสนอราคา'+(Q.signPos?' · '+Q.signPos:''),'ประทับตราบริษัท (ถ้ามี)']];
  return `<div class="gs" style="grid-template-columns:repeat(${Math.min(B.length,4)},1fr)">${B.map(([nm,ro,x])=>`<div><div class="ln">(ลงชื่อ) ......................................</div><div>( ${esc(nm||'')||'......................................'} )</div><div>${esc(ro)}</div>${x?`<small>${x}</small>`:''}</div>`).join('')}</div>`}
const fsGovDoc=(Q,name,land,body)=>FS_GOV+(land?'<style>@page{size:A4 landscape;margin:10mm}</style>':'')+`<div class="fsg" data-doc-name="${esc([Q.no,name,Q.pname||Q.title].filter(Boolean).join(' '))}">${body}</div>`;
const fsGovBy=Q=>['ประมาณราคาโดย',[CO().name,Q.by].filter(Boolean).join(' · ')],fsGovDt=Q=>['ประมาณราคาเมื่อวันที่',okD(Q.date)?thDL(Q.date):''];
const FS_GI={govOrg:['govOrg','หน่วยงานเจ้าของโครงการ (ว่าง = ชื่อลูกค้า)'],govDrw:['govDrw','แบบเลขที่'],govF:['govF','Factor F (ว่าง = คิดจากราคาในใบเสนอราคา)','num'],
  govAdv:['govAdv','เงินล่วงหน้าจ่าย (%)','num'],govRet:['govRet','เงินประกันผลงานหัก (%)','num'],govInt:['govInt','ดอกเบี้ยเงินกู้ (% ต่อปี)','num'],govDays:['govDays','ระยะเวลาดำเนินการ (วัน)','num'],
  govEq:['govEq','หมวดครุภัณฑ์จัดซื้อ (ลำดับหมวด เช่น 4)','','ว่าง = หมวดที่ชื่อมีคำว่า ครุภัณฑ์'],
  govCom:['govCom','ผู้ลงนาม (ว่าง = ผู้ประมาณราคา ผู้ตรวจสอบ ผู้เสนอราคา)','area','หรือคณะกรรมการ บรรทัดละคน ชื่อ | ตำแหน่ง เช่น\nนายสมชาย ใจดี | ประธานกรรมการ']};
const fsGI=a=>a.map(k=>FS_GI[k]);
const fsGovSmp=it=>({title:'ปรับปรุงระบบไฟฟ้าและปรับอากาศ อาคารเรียน 2',pname:'ปรับปรุงระบบไฟฟ้าและปรับอากาศ อาคารเรียน 2',site:'โรงเรียนตัวอย่าง จ.นครปฐม',govOrg:'สำนักงานเขตพื้นที่การศึกษาตัวอย่าง',
  govDrw:'ฟฟ.01–ฟฟ.12, ปอ.01–ปอ.08',govDays:120,govAdv:0,govRet:0,govInt:7,mk:25,qpay:[],terms:'',
  items:[it('งานระบบไฟฟ้า','ตู้ไฟฟ้าย่อย LP 24 ช่อง พร้อมเบรกเกอร์','ตู้',4,14500,2500),it('งานระบบไฟฟ้า','สายไฟฟ้า THW 2.5 ตร.มม. ร้อยท่อ EMT','ม.',1800,28,22),it('งานระบบไฟฟ้า','โคมไฟ LED แบบตะแกรง 2x18W','ชุด',96,850,150),
    it('งานระบบปรับอากาศ','เครื่องปรับอากาศแบบแยกส่วน 36,000 BTU/hr','ชุด',8,36500,4500),it('งานระบบปรับอากาศ','ท่อน้ำยาทองแดงพร้อมฉนวน','ม.',160,380,160),
    it('ครุภัณฑ์จัดซื้อ','เครื่องฟอกอากาศ ขนาดห้อง 40 ตร.ม.','เครื่อง',8,6900,0),it('ครุภัณฑ์จัดซื้อ','พัดลมติดผนัง 16 นิ้ว','ตัว',24,1150,0)]});
const fsGovM=v=>Math.abs(v)<0.005?'–':fmt(v,2);
FS_FORMS.push(
  {id:'gov-pr4',g:'gov',k:'boq',n:'ปร.4 รายการปริมาณงานและราคา',d:'แบบแสดงรายการ ปริมาณงาน และราคา แยกค่าวัสดุ ค่าแรงงาน รวมทุกหมวด กระดาษแนวนอน',p:990,col:'#1F2937',th:'mono',smp:fsGovSmp,
    inp:fsGI(['govOrg','govDrw','govF','govEq','govCom']),
    pr:Q=>{const V=fsGov(Q),M=fsGovM;let tm=0,tl=0,tt=0;
      const rows=V.G.map((g,k)=>{let m=0,l=0,t=0;const b=g.items.map((i,j)=>{const x=fsCost(Q,i);m+=x.mt;l+=x.lt;t+=x.t;
          return `<tr><td class="c">${k+1}.${j+1}</td><td>${fsDesc(i)}</td><td class="r">${fmtq(i.q)}</td><td class="c">${esc(i.unit||'')}</td><td class="r">${x.sp?M(x.mu):''}</td><td class="r">${x.sp?M(x.mt):''}</td><td class="r">${x.sp?M(x.lu):''}</td><td class="r">${x.sp?M(x.lt):''}</td><td class="r">${M(x.t)}</td><td></td></tr>`}).join('');
        tm+=m;tl+=l;tt+=t;
        return `<tr class="g"><td class="c">${k+1}</td><td colspan="8">${esc(gName(g.g))}</td><td>${g.eq&&V.B.length?'ครุภัณฑ์ ปร.5 (ข)':''}</td></tr>${b}<tr class="s"><td></td><td style="text-align:right">รวม${esc(gName(g.g))}</td><td colspan="3"></td><td class="r">${M(m)}</td><td></td><td class="r">${M(l)}</td><td class="r">${M(t)}</td><td></td></tr>`}).join('');
      const tb=`<table class="gt"><colgroup>${[5,26,7,6,9,10,9,10,11,7].map(w=>`<col style="width:${w}%">`).join('')}</colgroup><thead><tr><th rowspan="2">ลำดับ</th><th rowspan="2">รายการ</th><th rowspan="2">จำนวน</th><th rowspan="2">หน่วย</th><th colspan="2">ราคาค่าวัสดุ</th><th colspan="2">ราคาค่าแรงงาน</th><th rowspan="2">รวมค่าวัสดุและค่าแรงงาน</th><th rowspan="2">หมายเหตุ</th></tr>
        <tr><th>ราคาต่อหน่วย</th><th>จำนวนเงิน</th><th>ราคาต่อหน่วย</th><th>จำนวนเงิน</th></tr></thead><tbody>${rows}
        <tr class="t"><td></td><td style="text-align:right">รวมค่างานต้นทุนทั้งหมด</td><td colspan="3"></td><td class="r">${M(tm)}</td><td></td><td class="r">${M(tl)}</td><td class="r">${M(tt)}</td><td></td></tr></tbody></table>`;
      const note=`<div class="gn">ราคาในแบบนี้เป็นค่างานต้นทุน ยังไม่รวมค่าอำนวยการ กำไร ดอกเบี้ย และภาษี · แบบ ปร.5 (ก) คูณ Factor F ${fmt(V.F,4)}${V.own?'':' (คิดจากราคาในใบเสนอราคานี้)'}${V.B.length?' · หมวดครุภัณฑ์คิดภาษีมูลค่าเพิ่มอย่างเดียวในแบบ ปร.5 (ข)':''}</div>`;
      return fsGovDoc(Q,'ปร.4',1,fsGovHead(Q,'ปร.4','แบบแสดงรายการ ปริมาณงาน และราคา',[['แบบเลขที่',Q.govDrw],fsGovBy(Q),fsGovDt(Q)])+tb+note+fsGovSigns(Q))}},
  {id:'gov-pr5a',g:'gov',k:'boq',n:'ปร.5 (ก) สรุปค่าก่อสร้าง',d:'สรุปค่างานต้นทุนทีละหมวด คูณ Factor F เป็นค่าก่อสร้าง พร้อมเงื่อนไขเงินล่วงหน้า ประกันผลงาน ดอกเบี้ย',p:990,col:'#1F2937',th:'mono',smp:fsGovSmp,
    inp:fsGI(['govOrg','govDrw','govF','govAdv','govRet','govInt','govDays','govEq','govCom']),
    pr:Q=>{const V=fsGov(Q);
      const rows=V.A.map((g,k)=>`<tr><td class="c">${k+1}</td><td>${esc(gName(g.g))}</td><td class="r">${fmt(g.cost,2)}</td><td class="c">${fmt(V.F,4)}</td><td class="r">${fmt(g.cost*V.F,2)}</td><td></td></tr>`).join('');
      const tb=`<table class="gt"><colgroup>${[7,39,16,10,16,12].map(w=>`<col style="width:${w}%">`).join('')}</colgroup><thead><tr><th>ลำดับ</th><th>รายการ</th><th>ค่างานต้นทุน<br>(บาท)</th><th>Factor F</th><th>ค่าก่อสร้าง<br>(บาท)</th><th>หมายเหตุ</th></tr></thead><tbody>${rows}
        <tr class="t"><td></td><td style="text-align:right">รวมค่าก่อสร้างทั้งหมด</td><td class="r">${fmt(V.cA,2)}</td><td></td><td class="r">${fmt(V.tA,2)}</td><td></td></tr>
        <tr class="w"><td colspan="6">(${esc(bahtText(V.tA))})</td></tr></tbody></table>`;
      const cond=`<div class="gn"><b>เงื่อนไขที่ใช้คำนวณ Factor F</b> เงินล่วงหน้าจ่าย ${fsGv(Q.govAdv)} % · เงินประกันผลงานหัก ${fsGv(Q.govRet)} % · ดอกเบี้ยเงินกู้ ${fsGv(Q.govInt)} % ต่อปี · ภาษีมูลค่าเพิ่ม 7 %
        ${V.own?'':'<br>Factor F นี้คิดจากราคาในใบเสนอราคา (ราคารวมภาษีมูลค่าเพิ่ม ÷ ค่างานต้นทุน) พิมพ์ค่าจากตาราง Factor F ของกรมบัญชีกลางในช่อง Factor F แทนได้'}
        ${V.B.length?`<br>ค่าครุภัณฑ์จัดซื้อ ${fmt(V.tB,2)} บาท (รวมภาษีมูลค่าเพิ่ม) อยู่ในแบบ ปร.5 (ข) และรวมไว้ในแบบ ปร.6`:''}</div>`;
      return fsGovDoc(Q,'ปร.5 (ก)',0,fsGovHead(Q,'ปร.5 (ก)','แบบสรุปค่าก่อสร้าง',[['แบบเลขที่',Q.govDrw],['ประมาณราคาตามแบบ ปร.4',`${V.A.length} หมวด`],['ระยะเวลาดำเนินการ',n(Q.govDays)?`${fmtq(Q.govDays)} วัน`:''],fsGovBy(Q),fsGovDt(Q)])+tb+cond+fsGovSigns(Q))}},
  {id:'gov-pr5b',g:'gov',k:'boq',n:'ปร.5 (ข) สรุปค่าครุภัณฑ์จัดซื้อ',d:'ครุภัณฑ์และของที่ซื้อมาติดตั้ง ไม่คูณ Factor F คิดภาษีมูลค่าเพิ่ม 7% อย่างเดียว แยกตามหมวด',p:990,col:'#1F2937',th:'mono',smp:fsGovSmp,
    inp:fsGI(['govOrg','govEq','govCom']),
    pr:Q=>{const V=fsGov(Q),B=V.B.length?V.B:V.G,pB=sum(B,g=>g.price);
      const rows=B.map((g,k)=>`<tr class="g"><td class="c">${k+1}</td><td colspan="5">${esc(gName(g.g))}</td></tr>`+g.items.map((i,j)=>{const L=qLine(Q,i);
          return `<tr><td class="c">${k+1}.${j+1}</td><td>${fsDesc(i)}</td><td class="r">${fmtq(i.q)}</td><td class="c">${esc(i.unit||'')}</td><td class="r">${fmt(L.u*V.s,2)}</td><td class="r">${fmt(L.t*V.s,2)}</td></tr>`}).join('')
        +`<tr class="s"><td></td><td style="text-align:right">รวม${esc(gName(g.g))}</td><td colspan="3"></td><td class="r">${fmt(g.price,2)}</td></tr>`).join('');
      const tb=`<table class="gt"><colgroup>${[8,44,10,9,14,15].map(w=>`<col style="width:${w}%">`).join('')}</colgroup><thead><tr><th>ลำดับ</th><th>รายการ</th><th>จำนวน</th><th>หน่วย</th><th>ราคาต่อหน่วย<br>(บาท)</th><th>จำนวนเงิน<br>(บาท)</th></tr></thead><tbody>${rows}
        <tr class="t"><td></td><td style="text-align:right">รวมค่าครุภัณฑ์ ไม่รวมภาษีมูลค่าเพิ่ม</td><td colspan="3"></td><td class="r">${fmt(pB,2)}</td></tr>
        <tr><td></td><td style="text-align:right">ภาษีมูลค่าเพิ่ม 7 %</td><td colspan="3"></td><td class="r">${fmt(pB*0.07,2)}</td></tr>
        <tr class="t"><td></td><td style="text-align:right">รวมค่าครุภัณฑ์จัดซื้อทั้งสิ้น</td><td colspan="3"></td><td class="r">${fmt(pB*1.07,2)}</td></tr>
        <tr class="w"><td colspan="6">(${esc(bahtText(pB*1.07))})</td></tr></tbody></table>`;
      return fsGovDoc(Q,'ปร.5 (ข)',0,fsGovHead(Q,'ปร.5 (ข)','แบบสรุปค่าครุภัณฑ์จัดซื้อ',[fsGovBy(Q),fsGovDt(Q)])+tb+`<div class="gn">ค่าครุภัณฑ์จัดซื้อไม่คูณ Factor F คิดภาษีมูลค่าเพิ่มอย่างเดียว</div>`+fsGovSigns(Q))}},
  {id:'gov-pr6',g:'gov',k:'boq',n:'ปร.6 สรุปราคากลาง',d:'หน้าสรุปรวมค่าก่อสร้างจาก ปร.5 (ก) กับค่าครุภัณฑ์จาก ปร.5 (ข) เป็นราคาเดียว พร้อมช่องลงนามคณะกรรมการ',p:990,col:'#1F2937',th:'mono',smp:fsGovSmp,
    inp:fsGI(['govOrg','govF','govDays','govEq','govCom']),
    pr:Q=>{const V=fsGov(Q),R=[[`ค่าก่อสร้าง${Q.title?' '+Q.title:''} (ตามแบบ ปร.5 (ก))`,V.tA,`Factor F ${fmt(V.F,4)}`],...(V.B.length?[['ค่าครุภัณฑ์จัดซื้อ (ตามแบบ ปร.5 (ข))',V.tB,'รวมภาษีมูลค่าเพิ่ม 7 %']]:[])];
      const tb=`<table class="gt"><colgroup>${[8,56,18,18].map(w=>`<col style="width:${w}%">`).join('')}</colgroup><thead><tr><th>ลำดับ</th><th>รายการ</th><th>ค่าก่อสร้าง<br>(บาท)</th><th>หมายเหตุ</th></tr></thead><tbody>
        ${R.map(([k,v,x],j)=>`<tr><td class="c">${j+1}</td><td>${esc(k)}</td><td class="r">${fmt(v,2)}</td><td>${esc(x)}</td></tr>`).join('')}
        <tr class="t"><td></td><td style="text-align:right">สรุปราคาค่าก่อสร้างเป็นเงินทั้งสิ้น</td><td class="r">${fmt(V.tot,2)}</td><td></td></tr>
        <tr class="w"><td colspan="4">(${esc(bahtText(V.tot))})</td></tr></tbody></table>`;
      const att=`ปร.4 ${V.G.length} หมวด · ปร.5 (ก)${V.B.length?' · ปร.5 (ข)':''}`;
      return fsGovDoc(Q,'ปร.6',0,fsGovHead(Q,'ปร.6','แบบสรุปราคากลางงานก่อสร้าง',[['แบบที่แนบ',att],['ระยะเวลาดำเนินการ',n(Q.govDays)?`${fmtq(Q.govDays)} วัน`:''],fsGovBy(Q),fsGovDt(Q)])+tb+fsGovSigns(Q))}});

// ===== building-systems forms: the ORIEN Modern print in the system's colour, its key numbers on top, its standards, tests, exclusions and warranty before the signatures.
// The lists are ORIEN's defaults; a quotation can type its own (std_<system>, ex_<system>).
const fsCnt=(Q,re,u)=>sum(Q.items.filter(i=>n(i.q)>0&&re.test([i.type,i.desc].join(' '))&&(!u||u.test(String(i.unit||'').trim()))),i=>n(i.q));
const fsNum=(v,th,en,EN)=>v?`${fmtq(v)} ${EN?en:th}`:'–';
const FS_SYS={
  hvac:{n:'ระบบปรับอากาศและระบายอากาศ',en:'Air conditioning and ventilation',col:'#0284C7',re:/ปรับอากาศ|แอร์|ระบายอากาศ|hvac|air.?con|ventil|chiller|ท่อลม|duct|fcu|ahu|vrf|split|น้ำยา|btu/i,
    std:['มาตรฐานระบบปรับอากาศและระบายอากาศ วสท. 3003','ASHRAE 62.1 การระบายอากาศเพื่อคุณภาพอากาศภายในอาคาร','ASHRAE 90.1 และเกณฑ์อาคารประหยัดพลังงาน (BEC)','SMACNA งานท่อลม'],
    stdEn:['EIT 3003 air conditioning and ventilation standard','ASHRAE 62.1 ventilation for indoor air quality','ASHRAE 90.1 and the Building Energy Code (BEC)','SMACNA ductwork'],
    test:['ทดสอบรอยรั่วท่อน้ำยาด้วยไนโตรเจน และทำสุญญากาศก่อนเติมน้ำยา','วัดอุณหภูมิลมจ่าย ลมกลับ แรงดันน้ำยา และกระแสไฟของทุกเครื่อง','ปรับสมดุลลม (TAB) และทดสอบการระบายน้ำทิ้ง'],
    testEn:['Nitrogen leak test and vacuum before charging refrigerant','Supply and return air temperature, refrigerant pressure and current of every unit','Air balancing (TAB) and condensate drain test'],
    ex:['งานรื้อถอนและซ่อมแซมฝ้า ผนัง ที่ไม่ได้ระบุในรายการ','งานไฟฟ้าก่อนถึงสวิตช์ตัดตอนของเครื่อง','งานโครงสร้างรองรับเครื่องขนาดใหญ่'],
    exEn:['Ceiling and wall removal or repair not listed','Power supply up to each unit\'s isolator','Structural supports for large equipment'],
    warr:'งานติดตั้ง 1 ปี · เครื่องและคอมเพรสเซอร์ตามเงื่อนไขผู้ผลิต',warrEn:'Installation 1 year · units and compressors as the maker\'s warranty',
    kpi:(Q,EN)=>{let b=0,u=0;Q.items.forEach(i=>{const m=String([i.type,i.desc].join(' ')).match(/([\d,]+(?:\.\d+)?)\s*btu/i);if(m&&n(i.q)>0){b+=n(i.q)*n(m[1].replace(/,/g,''));u+=n(i.q)}});
      return [['ขนาดทำความเย็นรวม','Total cooling',b?fmt(b/12000,1)+' TR':'–',b?fmt(b,0)+' BTU/h':''],['เครื่องปรับอากาศ','Units',fsNum(u,'เครื่อง','units',EN)]]}},
  elec:{n:'ระบบไฟฟ้าและแสงสว่าง',en:'Electrical and lighting',col:'#CA8A04',re:/ไฟฟ้า|elec|แสงสว่าง|light|ตู้ไฟ|สายไฟ|cable|panel|mdb|โคม|ปลั๊ก|เต้ารับ|เบรกเกอร์|breaker|หม้อแปลง|transformer|ups|generator|สายดิน/i,
    std:['มาตรฐานการติดตั้งทางไฟฟ้าสำหรับประเทศไทย วสท. 2001','ข้อกำหนดของการไฟฟ้านครหลวง / การไฟฟ้าส่วนภูมิภาค','สายไฟฟ้าตาม มอก. 11 · ตู้สวิตช์บอร์ดตาม IEC 61439','ค่าความส่องสว่างตามมาตรฐานสมาคมไฟฟ้าแสงสว่างแห่งประเทศไทย (TIEA)'],
    stdEn:['EIT 2001 Thai electrical installation code','MEA / PEA requirements','Cables to TIS 11 · switchboards to IEC 61439','Lighting levels to TIEA'],
    test:['วัดค่าความเป็นฉนวนของสายไฟ (Megger) ทุกวงจร','วัดค่าความต้านทานหลักดิน ไม่เกิน 5 โอห์ม','ทดสอบเบรกเกอร์ เครื่องตัดไฟรั่ว และวัดค่าความส่องสว่าง'],
    testEn:['Insulation resistance (Megger) of every circuit','Earth electrode resistance not over 5 ohms','Breakers, RCDs and lighting levels'],
    ex:['ค่าธรรมเนียมขอขยายเขตและติดตั้งมิเตอร์ของการไฟฟ้า','หม้อแปลงและงานไฟฟ้าแรงสูงที่ไม่ได้ระบุในรายการ','ดวงโคมตกแต่งที่เจ้าของจัดหาเอง'],
    exEn:['Utility fees for supply extension and meters','Transformers and high-voltage work not listed','Decorative fittings supplied by the owner'],
    warr:'งานติดตั้ง 1 ปี · อุปกรณ์ตามเงื่อนไขผู้ผลิต',warrEn:'Installation 1 year · equipment as the maker\'s warranty',
    kpi:(Q,EN)=>[['ดวงโคม','Light fittings',fsNum(fsCnt(Q,/โคม|หลอด|lamp|light|led|luminaire/i),'ชุด','sets',EN)],['เต้ารับ','Outlets',fsNum(fsCnt(Q,/เต้ารับ|ปลั๊ก|socket|outlet|receptacle/i),'จุด','points',EN)],
      ['ตู้ไฟฟ้า','Panels',fsNum(fsCnt(Q,/ตู้|mdb|\blp\b|\bdb\b|switchboard|consumer unit/i),'ตู้','panels',EN)]]},
  plumb:{n:'ระบบประปาและสุขาภิบาล',en:'Plumbing and sanitary',col:'#2563EB',re:/ประปา|สุขาภิบาล|plumb|sanit|น้ำดี|น้ำเสีย|น้ำทิ้ง|สุขภัณฑ์|โถ|อ่าง|ก๊อก|drain|ท่อน้ำ|pp-?r|pvc|บำบัด|ปั๊มน้ำ|ถังเก็บน้ำ|water/i,
    std:['มาตรฐานระบบประปาและสุขาภิบาลในอาคาร วสท.','ท่อ PVC ตาม มอก. 17 · ท่อ PP-R ตาม DIN 8077/8078','กฎหมายควบคุมอาคารเรื่องระบบระบายน้ำและบำบัดน้ำเสีย'],
    stdEn:['EIT plumbing and sanitary standard','PVC pipe to TIS 17 · PP-R pipe to DIN 8077/8078','Building control law on drainage and waste-water treatment'],
    test:['ทดสอบแรงดันท่อน้ำดี 1.5 เท่าของแรงดันใช้งาน ไม่น้อยกว่า 2 ชั่วโมง','ทดสอบการไหลและการรั่วซึมของท่อน้ำทิ้ง ท่อน้ำเสีย ท่อระบายอากาศ','ล้างท่อก่อนใช้งาน ทดสอบเครื่องสูบน้ำและสวิตช์ลูกลอย'],
    testEn:['Water pipes pressure-tested at 1.5 times working pressure for at least 2 hours','Flow and leak test of waste, soil and vent pipes','Pipe flushing, pump and float switch tests'],
    ex:['ค่าธรรมเนียมขอใช้น้ำประปาและค่ามาตรวัดน้ำ','งานขุดเจาะถนนหรือพื้นที่นอกเขตอาคาร','สุขภัณฑ์และอุปกรณ์ที่เจ้าของจัดหาเอง'],
    exEn:['Water authority fees and meters','Road or site digging outside the building','Sanitary ware supplied by the owner'],
    warr:'งานติดตั้ง 1 ปี · เครื่องสูบน้ำและสุขภัณฑ์ตามเงื่อนไขผู้ผลิต',warrEn:'Installation 1 year · pumps and sanitary ware as the maker\'s warranty',
    kpi:(Q,EN)=>[['สุขภัณฑ์','Fixtures',fsNum(fsCnt(Q,/โถ|อ่าง|ก๊อก|ฝักบัว|สุขภัณฑ์|\bwc\b|lavatory|sink|urinal|faucet|shower/i),'ชุด','sets',EN)],['เครื่องสูบน้ำ','Pumps',fsNum(fsCnt(Q,/ปั๊ม|pump/i),'ชุด','sets',EN)],
      ['ท่อรวม','Pipe length',fsNum(fsCnt(Q,/ท่อ|pipe/i,/^(ม|ม\.|เมตร|m)$/i),'ม.','m',EN)]]},
  fire:{n:'ระบบป้องกันอัคคีภัย',en:'Fire protection',col:'#DC2626',re:/ดับเพลิง|อัคคีภัย|fire|sprinkler|สปริงเกอร์|หัวกระจาย|alarm|แจ้งเหตุ|smoke|detector|ตรวจจับ|fhc|standpipe|hose/i,
    std:['มาตรฐานการป้องกันอัคคีภัย วสท. 3002','NFPA 13 ระบบหัวกระจายน้ำดับเพลิง · NFPA 14 ระบบท่อยืน','NFPA 20 เครื่องสูบน้ำดับเพลิง · NFPA 72 ระบบแจ้งเหตุเพลิงไหม้','กฎกระทรวงฉบับที่ 33 (อาคารสูงและอาคารขนาดใหญ่พิเศษ)'],
    stdEn:['EIT 3002 fire protection standard','NFPA 13 sprinklers · NFPA 14 standpipes','NFPA 20 fire pumps · NFPA 72 fire alarm','Ministerial Regulation No. 33 (high-rise and large buildings)'],
    test:['ทดสอบแรงดันท่อ 200 psi นาน 2 ชั่วโมง (NFPA 13)','ทดสอบเครื่องสูบน้ำดับเพลิงที่อัตราไหลและแรงดันที่กำหนด (NFPA 20)','ทดสอบอุปกรณ์ตรวจจับ อุปกรณ์แจ้งเหตุ และเสียงเตือนทุกจุด (NFPA 72)'],
    testEn:['Hydrostatic test at 200 psi for 2 hours (NFPA 13)','Fire pump test at rated flow and pressure (NFPA 20)','Every detector, call point and sounder tested (NFPA 72)'],
    ex:['ค่าธรรมเนียมขออนุญาตและค่าตรวจรับจากหน่วยงานราชการ','ถังเก็บน้ำสำรองดับเพลิงที่เป็นงานโครงสร้าง','งานอุดช่องเปิดทนไฟ (Fire stop) ที่ไม่ได้ระบุในรายการ'],
    exEn:['Permit and inspection fees','Fire water tanks built as structure','Fire stopping not listed'],
    warr:'งานติดตั้ง 1 ปี · เครื่องสูบน้ำและตู้ควบคุมตามเงื่อนไขผู้ผลิต',warrEn:'Installation 1 year · pumps and panels as the maker\'s warranty',
    kpi:(Q,EN)=>[['หัวกระจายน้ำดับเพลิง','Sprinkler heads',fsNum(fsCnt(Q,/sprinkler|สปริงเกอร์|หัวกระจาย/i),'หัว','heads',EN)],['อุปกรณ์ตรวจจับ','Detectors',fsNum(fsCnt(Q,/detector|ตรวจจับ|smoke|heat|ควัน/i),'ตัว','pcs',EN)],
      ['ตู้และถังดับเพลิง','Hose cabinets and extinguishers',fsNum(fsCnt(Q,/ถังดับเพลิง|extinguisher|fhc|ตู้ดับเพลิง|hose/i),'ชุด','sets',EN)]]},
  com:{n:'ระบบสื่อสารและความปลอดภัย',en:'Communication and security',col:'#7C3AED',re:/สื่อสาร|cctv|กล้อง|\blan\b|network|โทรศัพท์|matv|ทีวี|access|comm/i,
    std:['TIA-568 ระบบสายสัญญาณสื่อสาร'],stdEn:['TIA-568 structured cabling'],test:['ทดสอบสายสัญญาณทุกจุด และการทำงานของกล้องและอุปกรณ์'],testEn:['Every cable link and device tested']}};
// a line's system: from its section's name first, then from its own text
const FS_SK=['fire','hvac','com','elec','plumb'];
const fsSysOf=i=>{const a=gName(i.g)+' '+(i.head||''),b=[i.type,i.desc].join(' ');return FS_SK.find(k=>FS_SYS[k].re.test(a))||FS_SK.find(k=>FS_SYS[k].re.test(b))||'oth'};
const fsKpi=(X,R)=>`<div class="fs-kpi" style="grid-template-columns:repeat(${R.length},1fr)">${R.map(([th,en,v,sub,hi])=>`<div${hi?' class="hi"':''}><span>${X.t(th,en,1)}</span><b>${v}</b>${sub?`<small>${sub}</small>`:''}</div>`).join('')}</div>`;
const fsOwnList=(Q,k)=>String(Q[k]||'').split('\n').map(x=>x.trim()).filter(Boolean);
const fsUl=a=>`<ul>${a.map(x=>`<li>${esc(x)}</li>`).join('')}</ul>`;
function fsMep(Q,key){const X=fsCtx(Q),{t,EN}=X,S=FS_SYS[key],std=fsOwnList(Q,'std_'+key),ex=fsOwnList(Q,'ex_'+key);
  const kpi=fsKpi(X,[...S.kpi(Q,EN),['ราคารวมทั้งสิ้น (รวม VAT)','Grand total (incl. VAT)',fmt(X.c.grand,2),'',1]]);
  const sec=`<div class="fs-sec"><h3>${t('มาตรฐาน การทดสอบ และการรับประกัน','Standards, tests and warranty')}</h3><div class="fs-2c"><div><b class="fs-lh">${t('มาตรฐานที่ใช้','Standards')}</b>${fsUl(std.length?std:EN?S.stdEn:S.std)}
      <b class="fs-lh">${t('การทดสอบก่อนส่งมอบ','Tests before handover')}</b>${fsUl(EN?S.testEn:S.test)}</div>
    <div class="no"><b class="fs-lh">${t('ไม่รวมในราคานี้','Not included')}</b>${fsUl(ex.length?ex:EN?S.exEn:S.ex)}<b class="fs-lh">${t('การรับประกัน','Warranty')}</b><div>${esc(Q.warr||(EN?S.warrEn:S.warr))}</div></div></div></div>`;
  return fsTint(fsTop(fsBefore(qmPrint(Q),fsSigns,sec),kpi),S.col)}
const fsMepInp=k=>[['std_'+k,'มาตรฐานที่ใช้ (บรรทัดละข้อ, ว่าง = ตามแบบ)','area',FS_SYS[k].std.join('\n')],['ex_'+k,'ไม่รวมในราคานี้ (บรรทัดละข้อ, ว่าง = ตามแบบ)','area',FS_SYS[k].ex.join('\n')],['warr','การรับประกัน','',FS_SYS[k].warr]];
const FS_MEP_SMP={
  elec:it=>({title:'งานระบบไฟฟ้าและแสงสว่าง',items:[it('งานตู้ไฟฟ้า','ตู้ MDB 400A พร้อมเบรกเกอร์ป้องกัน','ตู้',1,185000,15000),it('งานตู้ไฟฟ้า','ตู้ไฟฟ้าย่อย LP 24 ช่อง','ตู้',6,12500,2500),
    it('งานสายไฟฟ้าและท่อร้อยสาย','สาย NYY 4x50 ตร.มม.','ม.',180,820,120),it('งานสายไฟฟ้าและท่อร้อยสาย','สาย THW 2.5 ตร.มม. ร้อยท่อ EMT','ม.',2400,28,22),
    it('งานดวงโคมและเต้ารับ','โคมไฟ LED Panel 36W','ชุด',240,950,180),it('งานดวงโคมและเต้ารับ','เต้ารับคู่ มีขั้วสายดิน','จุด',160,180,220),it('งานระบบสายดิน','หลักดินทองแดง 5/8" ยาว 3 ม. พร้อมบ่อตรวจ','ชุด',3,2800,1200)]}),
  plumb:it=>({title:'งานระบบประปาและสุขาภิบาล',items:[it('งานท่อน้ำดี','ท่อ PP-R PN20 ขนาด 1"','ม.',240,160,90),it('งานท่อน้ำดี','ท่อ PP-R PN20 ขนาด 3/4"','ม.',320,95,70),
    it('งานท่อน้ำทิ้งและท่อน้ำเสีย','ท่อ PVC ชั้น 8.5 ขนาด 4"','ม.',120,210,110),it('งานท่อน้ำทิ้งและท่อน้ำเสีย','ท่อ PVC ชั้น 8.5 ขนาด 2"','ม.',180,75,60),
    it('งานสุขภัณฑ์','โถสุขภัณฑ์ชักโครก พร้อมฝารองนั่ง','ชุด',24,5200,800),it('งานสุขภัณฑ์','อ่างล้างหน้า พร้อมก๊อกน้ำ','ชุด',20,2800,600),
    it('งานเครื่องสูบน้ำและถังบำบัด','ปั๊มน้ำแรงดันคงที่ (Booster pump) 2 ตัว','ชุด',1,68000,8000),it('งานเครื่องสูบน้ำและถังบำบัด','ถังบำบัดน้ำเสียสำเร็จรูป 5,000 ลิตร','ถัง',1,42000,9000)]}),
  fire:it=>({title:'งานระบบป้องกันอัคคีภัย',items:[it('งานระบบหัวกระจายน้ำดับเพลิง','หัวกระจายน้ำดับเพลิง (Sprinkler) 68°C','หัว',420,380,220),it('งานระบบหัวกระจายน้ำดับเพลิง','ท่อเหล็กดำ SCH40 ขนาด 4"','ม.',160,1250,450),
    it('งานเครื่องสูบน้ำดับเพลิง','เครื่องสูบน้ำดับเพลิง 750 GPM พร้อม Jockey pump และตู้ควบคุม','ชุด',1,1450000,120000),
    it('งานตู้ดับเพลิงและถังดับเพลิง','ตู้ดับเพลิง (FHC) พร้อมสายฉีด','ตู้',12,18500,3500),it('งานตู้ดับเพลิงและถังดับเพลิง','ถังดับเพลิงเคมีแห้ง 15 ปอนด์','ถัง',30,2200,0),
    it('งานระบบแจ้งเหตุเพลิงไหม้','ตู้ควบคุมแจ้งเหตุเพลิงไหม้ (FACP) 8 โซน','ตู้',1,85000,12000),it('งานระบบแจ้งเหตุเพลิงไหม้','อุปกรณ์ตรวจจับควัน (Smoke detector)','ตัว',180,1450,350)]}),
  all:it=>({title:'งานระบบอาคารสำนักงาน 5 ชั้น',items:[it('งานระบบปรับอากาศ','เครื่องปรับอากาศแบบแยกส่วน 36,000 BTU/hr','ชุด',6,38000,4500),it('งานระบบปรับอากาศ','ท่อน้ำยาทองแดงพร้อมฉนวน','ม.',120,420,180),
    it('งานระบบไฟฟ้า','ตู้ไฟฟ้าย่อย LP 24 ช่อง','ตู้',6,12500,2500),it('งานระบบไฟฟ้า','โคมไฟ LED Panel 36W','ชุด',240,950,180),
    it('งานระบบประปาสุขาภิบาล','ท่อ PP-R PN20 ขนาด 1"','ม.',240,160,90),it('งานระบบประปาสุขาภิบาล','โถสุขภัณฑ์ชักโครก พร้อมฝารองนั่ง','ชุด',24,5200,800),
    it('งานระบบดับเพลิง','หัวกระจายน้ำดับเพลิง (Sprinkler) 68°C','หัว',120,380,220),it('งานระบบดับเพลิง','อุปกรณ์ตรวจจับควัน (Smoke detector)','ตัว',60,1450,350),
    it('งานระบบกล้องวงจรปิด','กล้อง CCTV IP 4MP พร้อมสาย','ตัว',24,3200,800)]})};
FS_FORMS.push(
  {id:'mep-hvac',g:'mep',k:'boq',n:'งานระบบปรับอากาศ',d:'ขนาดทำความเย็นรวม (TR) จำนวนเครื่อง มาตรฐาน วสท./ASHRAE การทดสอบ และสิ่งที่ไม่รวมในราคา',p:690,col:FS_SYS.hvac.col,inp:fsMepInp('hvac'),pr:Q=>fsMep(Q,'hvac')},
  {id:'mep-elec',g:'mep',k:'boq',n:'งานระบบไฟฟ้า',d:'จำนวนดวงโคม เต้ารับ ตู้ไฟฟ้า มาตรฐาน วสท. 2001 การวัดฉนวนและหลักดินก่อนส่งมอบ',p:690,col:FS_SYS.elec.col,inp:fsMepInp('elec'),smp:FS_MEP_SMP.elec,pr:Q=>fsMep(Q,'elec')},
  {id:'mep-plumb',g:'mep',k:'boq',n:'งานระบบประปา-สุขาภิบาล',d:'จำนวนสุขภัณฑ์ เครื่องสูบน้ำ ความยาวท่อ มาตรฐานท่อ การทดสอบแรงดันและการรั่วซึม',p:690,col:FS_SYS.plumb.col,inp:fsMepInp('plumb'),smp:FS_MEP_SMP.plumb,pr:Q=>fsMep(Q,'plumb')},
  {id:'mep-fire',g:'mep',k:'boq',n:'งานระบบดับเพลิง',d:'จำนวนหัวกระจายน้ำ อุปกรณ์ตรวจจับ ตู้และถังดับเพลิง มาตรฐาน NFPA และการทดสอบตามข้อกำหนด',p:690,col:FS_SYS.fire.col,inp:fsMepInp('fire'),smp:FS_MEP_SMP.fire,pr:Q=>fsMep(Q,'fire')},
  {id:'mep-all',g:'mep',k:'boq',n:'รวมทุกระบบ แยกหมวด',d:'สรุปราคาแยกตามระบบพร้อมสัดส่วน แล้วรายการทั้งหมด และมาตรฐานการทดสอบของแต่ละระบบที่มีในงาน',p:690,col:'#334155',smp:FS_MEP_SMP.all,
    pr:Q=>{const X=fsCtx(Q),{t,tx,EN}=X,B={};Q.items.forEach(i=>{const k=fsSysOf(i),L=qLine(Q,i),b=B[k]=B[k]||{k,m:0,l:0,t:0};b.m+=L.mt;b.l+=L.lt;b.t+=L.t});
      const R=Object.values(B).sort((a,b)=>(a.k==='oth')-(b.k==='oth')),T=sum(R,r=>r.t),sp=qSplit(Q),col=k=>k==='oth'?'#94A3B8':FS_SYS[k].col;
      const nm=k=>k==='oth'?tx('งานอื่น ๆ','Other work'):EN?FS_SYS[k].en:FS_SYS[k].n;
      const tb=`<div class="fs-sec"><h3>${t('สรุปราคาแยกตามระบบ','Price by system')}</h3><table class="fs-sys"><thead><tr><th>${t('ระบบ','System',1)}</th>${sp?`<th class="r">${t('ค่าวัสดุ','Material',1)}</th><th class="r">${t('ค่าแรง','Labour',1)}</th>`:''}<th class="r">${t('จำนวนเงิน','Amount',1)}</th><th>${t('สัดส่วน','Share',1)}</th></tr></thead><tbody>
        ${R.map(r=>{const p=T?r.t*100/T:0;return `<tr><td><i style="background:${col(r.k)}"></i>${esc(nm(r.k))}</td>${sp?`<td class="r">${fmt(r.m,2)}</td><td class="r">${fmt(r.l,2)}</td>`:''}<td class="r"><b>${fmt(r.t,2)}</b></td><td><span class="bar"><span style="width:${Math.max(0,p).toFixed(1)}%;background:${col(r.k)}"></span></span>${fmt(p,1)}%</td></tr>`}).join('')}
        <tr class="tt"><td>${t('รวมทุกระบบ','All systems',1)}</td>${sp?`<td class="r">${fmt(sum(R,r=>r.m),2)}</td><td class="r">${fmt(sum(R,r=>r.l),2)}</td>`:''}<td class="r">${fmt(T,2)}</td><td>100%</td></tr></tbody></table></div>`;
      const S=R.filter(r=>r.k!=='oth'),std=S.length?`<div class="fs-sec"><h3>${t('มาตรฐานและการทดสอบของแต่ละระบบ','Standards and tests by system')}</h3>${S.map(r=>{const Y=FS_SYS[r.k];
        return `<div class="fs-row"><b style="color:${Y.col}">${esc(nm(r.k))}</b><div>${esc((EN?Y.stdEn:Y.std).join(' · '))}<br><span style="color:var(--qg)">${tx('ทดสอบ: ','Tests: ')}${esc((EN?Y.testEn:Y.test).join(' · '))}</span></div></div>`}).join('')}</div>`:'';
      return fsTint(fsTop(fsBefore(qmPrint(Q),fsSigns,std),tb),'#334155')}});
