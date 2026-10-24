/* ---------- 4.0 ใบเสนอราคาแบบ ORIEN Modern: a cleaner, brighter quotation, a one-page short quote, English, and PM/MA service quotes ----------
   The quotation printed like the contractor's own Excel BOQ (730-quote-print.js, black grid on green). The user asked for a beautiful
   form (2026-10-24) and approved all five parts:
   1. Q.look '' = ORIEN Modern (default), 'xl' = the Excel layout as before. Modern covers BOQ-A/B/S and the letter cover; BOQ-G (ปร.4) and
      BOQ-E (blank quantities sheet) always print the Excel layout, because their shape is fixed by the government / by habit.
   2. Q.one: every line on the first page with the totals and signatures, no separate BOQ sheet (small jobs, repairs, services).
   3. Q.lang '' = follow the program's language (Thai screens print Thai + English labels, other languages print English), 'bi', 'th', 'en'.
      Typed data (names, items, notes) prints as typed.
   4. Q.kind 'ma' = a maintenance (PM/MA) service quotation: lines are machines or systems, each with visits a year (i.vis) and a price per
      unit per visit; the line's selling price (i.sp) is that price × visits over the contract. Prints the visit plan and each system's
      PM checklist (945-pm-systems.js). ได้งาน makes a service contract (co.svc) instead of a project.
   Signature lines are empty div.ln, so the e-signature step (860) places signatures on them. */
const QM_LOOK=[['','ORIEN Modern (สวย อ่านง่าย)'],['xl','แบบ Excel เดิม (เส้นดำ แถบเขียว)']];
const QM_LANG=[['','ตามภาษาของโปรแกรม'],['bi','ไทย + English'],['th','ไทย'],['en','English']];
const QM_KIND=[['','งานติดตั้ง / BOQ'],['ma','สัญญาบริการบำรุงรักษา (PM/MA)']];
const QM_PARTS=[['','ไม่รวมค่าอะไหล่ (เสนอราคาแยกเมื่อต้องเปลี่ยน)','Spare parts not included (quoted separately when needed)'],
  ['cons','รวมวัสดุสิ้นเปลือง เช่น น้ำยาล้าง สารเคมีทำความสะอาด','Consumables included (cleaning agents and chemicals)'],['all','รวมค่าอะไหล่ทั้งหมด','All spare parts included']];
const QM_G='งานบำรุงรักษา';
const qmLang=Q=>Q.lang||(typeof LANG!=='undefined'&&LANG&&LANG!=='th'?'en':'bi');
const qmMa=Q=>Q.kind==='ma';
const qmMonths=Q=>Math.max(1,n(Q.maMonths)||12);
const qmVis=(Q,i)=>Math.max(0,n(i.vis)||n(Q.maVisits)||4);
// visits of one line over the whole contract, and its price per unit per visit
const qmVisits=(Q,i)=>qmVis(Q,i)*qmMonths(Q)/12;
const qmPerVisit=(Q,i)=>{const v=qmVisits(Q,i);return v?qUnit(Q,i)/v:0};

// amount in English words, for the English and bilingual forms
function qmWords(v){v=Math.round(n(v)*100)/100;const O=['','One','Two','Three','Four','Five','Six','Seven','Eight','Nine','Ten','Eleven','Twelve','Thirteen','Fourteen','Fifteen','Sixteen','Seventeen','Eighteen','Nineteen'],
  T=['','','Twenty','Thirty','Forty','Fifty','Sixty','Seventy','Eighty','Ninety'],S=['','Thousand','Million','Billion','Trillion'];
  const h=x=>{let s='';if(x>=100){s=O[Math.floor(x/100)]+' Hundred';x%=100;if(x)s+=' '}if(x>=20){s+=T[Math.floor(x/10)];if(x%10)s+='-'+O[x%10]}else if(x)s+=O[x];return s};
  const w=x=>{if(!x)return 'Zero';const p=[];let k=0;while(x>0){const c=x%1000;if(c)p.unshift(h(c)+(S[k]?' '+S[k]:''));x=Math.floor(x/1000);k++}return p.join(' ')};
  const b=Math.floor(v),st=Math.round((v-b)*100);return `${w(b)} Baht${st?' and '+w(st)+' Satang':''} Only`}

const QM_CSS=`<style>
#print .qm{--qn:#16324F;--qt:#1C8F9B;--qs:#EAF5F6;--qz:#F6FAFB;--ql:#D3E2E5;--qg:#6B7F87;--qo:#F59E0B;font-family:"IBM Plex Sans Thai",Anuphan,"Leelawadee UI",Tahoma,sans-serif;color:#1F2E36;font-size:11px;line-height:1.5;-webkit-print-color-adjust:exact;print-color-adjust:exact}
#print .qm *{box-sizing:border-box}
#print .qm .en{display:block;font-style:normal;font-size:.78em;color:var(--qg);font-weight:400;line-height:1.25;letter-spacing:.01em}
#print .qm .en.il{display:inline;margin-left:4px}
#print .qm-bar{height:6px;border-radius:3px;background:linear-gradient(90deg,var(--qn) 0%,var(--qt) 55%,#5CC6C9 82%,var(--qo) 100%);margin:0 0 10px}
#print .qm-h{display:flex;justify-content:space-between;align-items:center;gap:18px;margin:0 0 10px}
#print .qm-h img{height:62px;width:auto;max-width:300px;margin:0;border:0;object-fit:contain}
#print .qm-h .nm{font-size:20px;font-weight:700;color:var(--qn)}
#print .qm-co{text-align:right;font-size:10px;color:#4A5D66;line-height:1.55}
#print .qm-co b{display:block;font-size:13.5px;color:var(--qn)}
#print .qm-tt{display:grid;grid-template-columns:1fr 250px;gap:12px;margin:0 0 10px}
#print .qm-ti{position:relative;border-radius:12px;padding:12px 16px 12px 20px;background:linear-gradient(120deg,var(--qn) 0%,#1F5A73 58%,var(--qt) 100%);color:#fff;overflow:hidden;display:flex;flex-direction:column;justify-content:center}
#print .qm-ti:after{content:"";position:absolute;right:-30px;top:-40px;width:150px;height:150px;border-radius:50%;background:rgba(255,255,255,.08)}
#print .qm-ti:before{content:"";position:absolute;right:50px;bottom:-60px;width:110px;height:110px;border-radius:50%;background:rgba(245,158,11,.22)}
#print .qm-ti small{font-size:10px;letter-spacing:.24em;font-weight:600;color:#BFE7EA}
#print .qm-ti h1{font-size:25px;line-height:1.2;margin:2px 0 3px;color:#fff;font-weight:700}
#print .qm-ti p{margin:0;font-size:11.5px;color:#E3F1F3;position:relative;z-index:1}
#print .qm-m{border:1px solid var(--ql);border-radius:12px;overflow:hidden;font-size:10.5px}
#print .qm-m div{display:grid;grid-template-columns:92px 1fr;gap:6px;padding:4px 10px;border-top:1px solid #EDF3F4}
#print .qm-m div:first-child{border:0;background:var(--qs)}
#print .qm-m div:first-child b{color:var(--qn);font-size:13px}
#print .qm-m span{color:var(--qg)}
#print .qm-m b{font-weight:600;word-break:break-word}
#print .qm-2{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:0 0 10px}
#print .qm-c{border:1px solid var(--ql);border-radius:12px;padding:8px 12px;font-size:10.5px;break-inside:avoid}
#print .qm-c h3,#print .qm-tm h3,#print .qm-sc h3{display:flex;align-items:center;gap:6px;margin:0 0 4px;font-size:11px;color:var(--qt);font-weight:700;letter-spacing:.02em}
#print .qm-c h3:before,#print .qm-tm h3:before,#print .qm-sc h3:before{content:"";width:8px;height:8px;border-radius:2px;background:var(--qt);transform:rotate(45deg)}
#print .qm-c h3 .en,#print .qm-tm h3 .en,#print .qm-sc h3 .en{display:inline;margin-left:2px}
#print .qm-c div{display:grid;grid-template-columns:118px 1fr;gap:6px;padding:1px 0}
#print .qm-c span{color:var(--qg)}
#print .qm-c .big{font-size:12.5px;font-weight:700;color:var(--qn)}
#print .qm-in{margin:2px 0 8px;font-size:11.5px}
#print .qm table.qm-t{width:100%;border-collapse:separate;border-spacing:0;table-layout:fixed;font-size:10px;margin:0 0 10px}
#print .qm table.qm-t th,#print .qm table.qm-t td{border:0;background:none;padding:4px 6px;vertical-align:top;line-height:1.4}
#print .qm table.qm-t thead tr.ch th{background:var(--qn);color:#fff;font-weight:600;text-align:center;vertical-align:middle;padding:5px 6px;border-right:1px solid rgba(255,255,255,.18);font-size:10px}
#print .qm table.qm-t thead tr.ch th:first-child{border-radius:8px 0 0 0}
#print .qm table.qm-t thead tr.ch th:last-child{border-radius:0 8px 0 0;border-right:0}
#print .qm table.qm-t thead tr.ch2 th{background:#24506A;color:#DDEFF1;font-weight:500;font-size:9px;padding:2px 6px;text-align:center;border-radius:0!important}
#print .qm table.qm-t thead th .en{color:#A9D6DB}
#print .qm table.qm-t tbody td{border-bottom:1px solid #E6EEF0}
#print .qm table.qm-t tbody tr:nth-child(even) td{background:var(--qz)}
#print .qm table.qm-t td.r{text-align:right;white-space:nowrap;font-variant-numeric:tabular-nums}
#print .qm table.qm-t td.c{text-align:center}
#print .qm table.qm-t td.n{text-align:center;color:var(--qg)}
#print .qm table.qm-t tr.g td{background:var(--qs)!important;color:var(--qn);font-weight:700;border-bottom:1px solid #C8DFE3}
#print .qm table.qm-t tr.g td.n{color:var(--qt)}
#print .qm table.qm-t tr.h td{font-weight:600;color:#2C4A5A}
#print .qm table.qm-t tr.s td{background:#fff!important;font-weight:700;color:var(--qn);border-top:1.5px solid var(--qt);border-bottom:1.5px solid var(--qt)}
#print .qm table.qm-t tr.tt td{background:var(--qn)!important;color:#fff;font-weight:700;border:0}
#print .qm table.qm-t tr.tt td:first-child{border-radius:0 0 0 8px}#print .qm table.qm-t tr.tt td:last-child{border-radius:0 0 8px 0}
#print .qm table.qm-t tr.tt td .en{color:#A9D6DB;display:inline;margin-left:4px}
#print .qm table.qm-t tbody tr:last-child:not(.tt) td{border-bottom:2px solid var(--qn)}
#print .qm table.qm-t td .dash{color:#B8C5CA}
#print .qm table.qm-t thead tr.rh th{background:none;padding:0 0 6px;text-align:left;font-weight:400;color:#1F2E36}
#print .qm-mini{display:flex;align-items:center;gap:12px;border-bottom:2px solid var(--qt);padding:0 0 5px}
#print .qm-mini img{height:30px;width:auto;margin:0;border:0}
#print .qm-mini b{font-size:13px;color:var(--qn)}#print .qm-mini b .en{color:var(--qt)}
#print .qm-mini .sp{flex:1}
#print .qm-mini .no{font-size:10px;color:var(--qg);text-align:right;line-height:1.35}
#print .qm-ft{display:grid;grid-template-columns:1fr 265px;gap:14px;align-items:start;margin:0 0 10px;break-inside:avoid}
#print .qm-tot{border:1px solid var(--ql);border-radius:12px;overflow:hidden;font-size:10.5px}
#print .qm-tot div{display:flex;justify-content:space-between;gap:8px;padding:4px 12px;border-top:1px solid #EDF3F4}
#print .qm-tot div:first-child{border:0}
#print .qm-tot div b{font-weight:600;font-variant-numeric:tabular-nums;white-space:nowrap}
#print .qm-tot div.d b{color:#C2410C}
#print .qm-tot div.gt{background:linear-gradient(110deg,var(--qn),var(--qt));color:#fff;padding:8px 12px;align-items:center}
#print .qm-tot div.gt span{font-weight:600}#print .qm-tot div.gt .en{color:#CFEDEF}
#print .qm-tot div.gt b{font-size:15px;font-weight:700}
#print .qm-wh{margin-top:6px;font-size:10px}#print .qm-wh div.nt{background:var(--qs);font-weight:600}#print .qm-wh div.nt b{color:var(--qn)}
#print .qm-tot div.pm{background:var(--qs);color:var(--qn)}
#print .qm-wd{margin-top:8px;border-radius:10px;background:var(--qs);border-left:4px solid var(--qo);padding:6px 10px;font-size:10.5px}
#print .qm-wd span{color:var(--qg);font-size:9.5px;display:block}
#print .qm-wd b{color:var(--qn);font-weight:600}
#print .qm-tm{font-size:10.5px}
#print .qm-tm>div{margin:0 0 7px;break-inside:avoid}
#print .qm-tm .row2{display:grid;grid-template-columns:110px 1fr;gap:6px}
#print .qm-tm .row2>span{color:var(--qg)}
#print .qm-tm ol{margin:0;padding-left:16px}
#print .qm-tm table.pay{width:100%;border-collapse:collapse;font-size:10px}
#print .qm-tm table.pay td,#print .qm-tm table.pay th{border:0;border-bottom:1px solid #E6EEF0;padding:2px 4px;background:none;font-weight:400;text-align:left}
#print .qm-tm table.pay th{color:var(--qg);font-size:9px}
#print .qm-tm table.pay td.r,#print .qm-tm table.pay th.r{text-align:right;white-space:nowrap}
#print .qm-sg{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-top:14px;break-inside:avoid;text-align:center;font-size:10px}
#print .qm-sg>div{border:1px solid var(--ql);border-radius:12px;padding:8px 10px 8px;display:flex;flex-direction:column}
#print .qm-sg>div.ok{border:1.5px solid var(--qt);background:linear-gradient(180deg,var(--qs),#fff 60%)}
#print .qm-sg h4{margin:0;font-size:10.5px;color:var(--qn)}
#print .qm-sg h4 .en{display:inline;margin-left:3px}
#print .qm-sg .q{font-size:9px;color:#4A5D66;margin-top:2px;line-height:1.35}
#print .qm-sg .ln{border-top:1px solid #8FA3AA;margin:auto 6px 4px;padding-top:0;min-height:0}
#print .qm-sg .sp{height:44px;flex:none}
#print .qm-sg .who{font-weight:600;min-height:15px}
#print .qm-sg .dt{color:var(--qg);font-size:9.5px;margin-top:2px}
#print .qm-lt{font-size:12px;line-height:1.75}
#print .qm-lt .to{display:grid;grid-template-columns:70px 1fr;gap:4px 8px;margin:4px 0 10px}
#print .qm-lt .to span{color:var(--qg)}
#print .qm-lt p{margin:6px 0;text-indent:36px}
#print .qm-lt .sg1{margin:14px 0 0 auto;width:240px;text-align:center;break-inside:avoid}
#print .qm-lt .sg1 .ln{border-top:1px solid #8FA3AA;margin:50px 10px 4px}
#print .qm-pl{margin:0 0 10px;border:1px solid var(--ql);border-radius:12px;padding:8px 12px;break-inside:avoid}
#print .qm-pl table{width:100%;border-collapse:separate;border-spacing:2px;table-layout:fixed;font-size:9px}
#print .qm-pl th,#print .qm-pl td{border:0;background:none;padding:2px 0;text-align:center;font-weight:400}
#print .qm-pl th{color:var(--qg)}
#print .qm-pl td.l{text-align:left;color:#2C4A5A;font-size:9.5px;padding-right:4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#print .qm-pl td i{display:block;height:12px;border-radius:6px;background:#EDF3F4}
#print .qm-pl td i.on{background:linear-gradient(90deg,var(--qt),#5CC6C9)}
#print .qm-sc{columns:2;column-gap:16px;font-size:9.5px;margin:0 0 10px}
#print .qm-sc>div{break-inside:avoid;margin:0 0 8px;border:1px solid var(--ql);border-radius:10px;padding:6px 10px}
#print .qm-sc ul{margin:0;padding-left:14px}
#print .qm .sow-h{background:linear-gradient(120deg,var(--qn),var(--qt));color:#fff;border:0;border-radius:12px;padding:10px 16px}
#print .qm .sow-h small{color:#BFE7EA}
#print .qm .sow-s h3{color:var(--qn);border-bottom-color:var(--qt)}
#print .qm .sow-s h4{color:var(--qt)}
</style>`;

PRINT.quoteXl=PRINT.quote;
// a quote this short prints every line on page 1 by itself (a one-row summary would hide quantities and units)
const QM_ONE=12;
// 4.14 ค่าเครื่อง (user: "แยกค่าเครื่องออก ... เพราะค่าเครื่องไม่โดนหัก 3%"): a line is equipment when ticked in the lines table (i.eqp),
// otherwise when its name is a machine in the air-con section (units, chillers, AHU/FCU, pumps, cooling towers, fans), not an accessory.
// With Q.eqSep the BOQ prints ค่าเครื่อง / ค่าวัสดุ / ค่าแรง, and the totals show the part the customer withholds 3% on (Q.whtB:
// '' material + labour, 'l' labour only, 'none' not shown) and the net they pay.
const QM_EQ=/แอร์|split|vrf|vrv|package|rooftop|chiller|ชิลเลอร์|\bahu\b|\bfcu\b|fan coil|cooling tower|ปั๊ม|pump|พัดลม|\bfan\b|\berv\b|เครื่อง|\bcdu\b/i,
  QM_ACC=/support|ขาแขวน|bracket|ยางรอง|รางครอบ|duct cover|refnet|branch|รีโมท|remote|drain pump|กาลักน้ำ|controller|ชุดควบคุม|ท่อ|pipe|ฉนวน|สาย|ทดสอบ|ค่าแรง|ติดตั้ง/i;
const qmIsEq=i=>{if(i.eqp===true||i.eqp===false)return i.eqp;const t=[i.type,i.desc].filter(Boolean).join(' ');return i.g==='eq'&&QM_EQ.test(t)&&!QM_ACC.test(t)};
const QM_WHT=[['','ค่าวัสดุ + ค่าแรง (ไม่หักเฉพาะค่าเครื่อง)'],['l','ค่าแรงอย่างเดียว'],['none','ไม่แสดง']];
PRINT.quote=(id,bq)=>{const Q=CO().quotes.find(q=>q.id===id);if(!Q)return '';const f=qForm(Q);
  if(!qmMa(Q)&&(Q.look==='xl'||f==='G'||f==='E'))return PRINT.quoteXl(id,bq);
  try{return qmPrint(Q,bq)}catch(e){console.error(e);return PRINT.quoteXl(id,bq)}};

function qmPrint(Q,bq){const C=CO(),L=qmLang(Q),EN=L==='en',ma=qmMa(Q),f=qForm(Q),eqs=!ma&&!!Q.eqSep,sp=!ma&&(qSplit(Q)||eqs),sep=qSep(Q),S0=!ma&&f==='S',one=(!!Q.one||Q.items.length<=QM_ONE)&&!S0,lt=Q.cover==='letter'&&!ma;
  // a label in the chosen language; bilingual puts the English under (or beside) the Thai
  const t=(th,en,il)=>L==='en'?en:L==='th'?th:`${th}<i class="en${il?' il':''}">${en}</i>`,tx=(th,en)=>L==='en'?en:th;
  const gN=g=>{const s=gName(g);return EN&&typeof I18N==='object'&&I18N.en&&I18N.en.x&&I18N.en.x[s]||s};
  const dt=s=>{if(!okD(s))return '';const d=pd(s);return EN?d.toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'}):thDL(s)};
  const cu=C.customers.find(x=>x.id===Q.cust)||{},cuN=EN&&cu.nameEn||cu.name||'',cuA=EN&&cu.addrEn||cu.addr||'',biE=(th,en)=>L==='bi'&&en&&en!==th?`<i class="en">${esc(en)}</i>`:'',st=(C.staff||[]).find(s=>s.name&&Q.by&&s.name===Q.by)||{},c=qCalc(Q);
  const G={},order=[];Q.items.forEach(i=>{const x=qLine(Q,i);if(!G[i.g]){G[i.g]={e:0,m:0,l:0,t:0};order.push(i.g)}const g=G[i.g],e=eqs&&qmIsEq(i);g.e+=e?x.mt:0;g.m+=e?0:x.mt;g.l+=x.lt;g.t+=x.t});
  const T=order.reduce((a,k)=>({e:a.e+G[k].e,m:a.m+G[k].m,l:a.l+G[k].l,t:a.t+G[k].t}),{e:0,m:0,l:0,t:0}),mk=sep&&Math.abs(c.lines-T.t)>0.005?c.lines-T.t:0,A=c.adds.filter(a=>a.v||a.name);
  const M=v=>Math.abs(v)<0.005?'<span class="dash">–</span>':fmt(v,2);
  const ttl=ma?t('ใบเสนอราคาบริการบำรุงรักษา','Maintenance Service Quotation'):t('ใบเสนอราคา','Quotation');
  // ---- header: colour bar, logo, company; title band and the number box
  const co=`<div class="qm-bar"></div><div class="qm-h"><div>${C.logo?`<img src="${C.logo}" alt="">`:`<span class="nm">${esc(C.name||'')}</span>`}</div>
    <div class="qm-co"><b>${esc(EN&&C.nameEn||C.name||'')}</b>${!EN&&C.nameEn?esc(C.nameEn)+'<br>':''}${esc(EN&&C.addrEn||C.addr||'')}${C.addr||C.addrEn?'<br>':''}${[C.phone?tx('โทร ','Tel. ')+esc(C.phone):'',esc(C.email||'')].filter(Boolean).join(' · ')}
    ${C.tax?`<br>${tx('เลขประจำตัวผู้เสียภาษี ','Tax ID ')}${esc(C.tax)}${C.branch?' ('+esc(C.branch)+')':''}`:''}</div></div>`;
  const sub=ma?[Q.title,cuN].filter(Boolean).join(' · '):[Q.title,Q.pname].filter(Boolean).join(' · ');
  const valid=okD(Q.date)&&n(Q.valid)?addD(Q.date,n(Q.valid)):'';
  const meta=[[t('เลขที่','No.',1),`<b>${esc(Q.no||'')}</b>`],[t('วันที่','Date',1),dt(Q.date)],...(valid?[[t('ยืนราคาถึง','Valid until',1),dt(valid)]]:[]),...(Q.ref?[[t('อ้างอิง','Ref.',1),esc(Q.ref)]]:[]),
    ...(Q.by?[[t('ผู้เสนอราคา','Sales',1),esc(Q.by)]]:[]),...(st.phone||st.email?[[t('ติดต่อ','Contact',1),esc([st.phone,st.email].filter(Boolean).join(' · '))]]:[])];
  const head=co+`<div class="qm-tt"><div class="qm-ti">${EN?'':`<small>${ma?'MAINTENANCE SERVICE QUOTATION':'QUOTATION'}</small>`}<h1>${ma?(EN?'Service Quotation':'ใบเสนอราคาบริการ'):(EN?'Quotation':'ใบเสนอราคา')}</h1>${sub?`<p>${esc(sub)}</p>`:''}</div>
    <div class="qm-m">${meta.map(([k,v])=>`<div><span>${k}</span><b>${v||'&nbsp;'}</b></div>`).join('')}</div></div>`;
  const kv=(k,v,cl)=>v?`<div><span>${k}</span><b${cl?` class="${cl}"`:''}>${v}</b></div>`:'';
  const attn=Q.attn||cu.contact||'';
  const cards=`<div class="qm-2"><div class="qm-c"><h3>${t('ลูกค้า','Customer')}</h3>${kv(t('ชื่อ','Name',1),cuN?esc(cuN)+biE(cuN,cu.nameEn):'','big')}${kv(t('เรียน','Attn.',1),esc(attn))}${kv(t('ที่อยู่','Address',1),cuA?esc(cuA)+biE(cuA,cu.addrEn):'')}
      ${kv(t('เลขผู้เสียภาษี','Tax ID',1),esc(cu.tax||''))}${kv(t('โทร','Tel.',1),esc([cu.phone,cu.email].filter(Boolean).join(' · ')))}</div>
    ${ma?qmMaCard(Q,t,dt,kv):`<div class="qm-c"><h3>${t('โครงการ','Project')}</h3>${kv(t('โครงการ','Project',1),esc(Q.pname||''),'big')}${kv(t('งาน','Work',1),esc(Q.title||''))}${kv(t('สถานที่','Site',1),esc(Q.site||''))}${kv(t('แล้วเสร็จ','Completion',1),esc(Q.dlv||''))}</div>`}</div>`;
  const what=esc(Q.title||''),pj=esc(Q.pname||'');
  const intro=ma?`<p class="qm-in">${L!=='en'?`บริษัทฯ มีความยินดีขอเสนอราคา${/บำรุงรักษา|บริการ/.test(Q.title||'')?'':'บริการบำรุงรักษา'}${what}${cu.name?' ให้แก่ '+esc(cu.name):''} ตามรายละเอียดดังนี้`:''}${L!=='th'?`<i class="en"${L==='en'?' style="font-size:1em;color:inherit"':''}>We are pleased to offer our maintenance service${what?' for '+what:''} as detailed below.</i>`:''}</p>`
    :`<p class="qm-in">${L!=='en'?`บริษัทฯ มีความยินดีขอเสนอราคา${what}${pj?' สำหรับโครงการ '+pj:''} ตามรายละเอียดดังนี้`:''}${L!=='th'?`<i class="en"${L==='en'?' style="font-size:1em;color:inherit"':''}>We are pleased to submit our quotation${what?' for '+what:''}${pj?', '+pj:''}, as detailed below.</i>`:''}</p>`;
  // ---- tables
  const cols=w=>`<colgroup>${w.map(x=>`<col style="width:${x}%">`).join('')}</colgroup>`,fill=w=>{w[1]=100-w.reduce((a,b,i)=>i===1?a:a+b,0);return w};
  const MG=eqs?['e','m','l']:sp?['m','l']:[],lab={e:t('ค่าเครื่อง','Equipment',1),m:t('ค่าวัสดุ','Material',1),l:t('ค่าแรง','Labour',1)};
  const thD2=sp?`<tr class="ch"><th rowspan="2">${t('ลำดับ','No.')}</th><th rowspan="2">${t('รายการ','Description')}</th><th rowspan="2">${t('จำนวน','Qty')}</th><th rowspan="2">${t('หน่วย','Unit')}</th>${MG.map(k=>`<th colspan="2">${lab[k]}</th>`).join('')}<th rowspan="2">${t('รวมเงิน','Amount')}</th></tr>
      <tr class="ch2">${MG.map(()=>`<th>${tx('ราคา/หน่วย','Unit price')}</th><th>${tx('จำนวนเงิน','Total')}</th>`).join('')}</tr>`
    :`<tr class="ch"><th>${t('ลำดับ','No.')}</th><th>${t('รายการ','Description')}</th><th>${t('จำนวน','Qty')}</th><th>${t('หน่วย','Unit')}</th><th>${t('ราคา/หน่วย','Unit price')}</th><th>${t('จำนวนเงิน','Amount')}</th></tr>`;
  const nc=S0?5+MG.length:sp?5+2*MG.length:6,wD=S0?(eqs?fill([6,0,8,7,13,13,13,14]):sp?fill([7,0,9,8,15,15,16]):fill([7,0,10,9,18])):eqs?fill([5,0,6,5,8,9,8,9,7,8,10]):sp?fill([6,0,7,6,10,11,9,10,12]):fill([7,0,9,8,14,15]);
  // BOQ-S: every line with its quantity and unit, the money only on each section's row
  const thS=`<tr class="ch"><th>${t('ลำดับ','No.')}</th><th>${t('รายการ','Description')}</th><th>${t('จำนวน','Qty')}</th><th>${t('หน่วย','Unit')}</th>${MG.map(k=>`<th>${lab[k]}</th>`).join('')}<th>${t('จำนวนเงิน','Amount')}</th></tr>`;
  const emp=k=>'<td></td>'.repeat(k);
  // detail lines: a section row, sub-heads from "head" (two levels split by " · "), the lines, and a subtotal per section
  const det=()=>{const body=[];let lg=null,lh=null,ls=null,gi=0,hi=0,li=0;
    const sumG=(g)=>`<tr class="s"><td></td><td>${tx('รวม','Subtotal')} ${esc(gN(g))}${L==='bi'?'<i class="en il">Subtotal</i>':''}</td>${emp(2)}${MG.length?MG.map(k=>`<td></td><td class="r">${M(G[g][k])}</td>`).join(''):'<td></td>'}<td class="r">${fmt(G[g].t,2)}</td></tr>`;
    Q.items.forEach(i=>{if(i.g!==lg){if(lg!==null&&order.length>1&&!S0)body.push(sumG(lg));gi++;hi=0;li=0;lh=ls=null;lg=i.g;body.push(S0?`<tr class="g"><td class="n">${gi}</td><td colspan="3">${esc(gN(i.g))}</td>${MG.map(k=>`<td class="r">${M(G[i.g][k])}</td>`).join('')}<td class="r">${fmt(G[i.g].t,2)}</td></tr>`:`<tr class="g"><td class="n">${gi}</td><td colspan="${nc-1}">${esc(gN(i.g))}</td></tr>`)}
      const hd=String(i.head||''),k=hd.indexOf(' · '),h1=k>=0?hd.slice(0,k):hd,h2=k>=0?hd.slice(k+3):'';
      if(h1!==lh){lh=h1;ls=null;if(h1){hi++;const m=h1.match(/^(\d+(?:\.\d+)*)\s+(.*)$/);body.push(`<tr class="h"><td class="n">${m?m[1]:gi+'.'+hi}</td><td colspan="${nc-1}">${esc(m?m[2]:h1)}</td></tr>`)}}
      if(h2!==ls){ls=h2;const m=h2.match(/^(\d+(?:\.\d+)+)\s+(.*)$/);if(h2)body.push(`<tr class="h"><td class="n">${m?m[1]:''}</td><td colspan="${nc-1}">${esc(m?m[2]:h2)}</td></tr>`)}
      li++;const x=qLine(Q,i),E=eqs&&qmIsEq(i),V={e:[E?x.mu:0,E?x.mt:0],m:[E?0:x.mu,E?0:x.mt],l:[x.lu,x.lt]};let d=esc([i.type,i.desc].filter(Boolean).join(' ')),num='';const own=d.match(/^(\d+(?:\.\d+)+)\s+(.*)$/);
      if(own){num=own[1];d=own[2]}else if(!lh){hi++;num=gi+'.'+hi}
      body.push(`<tr><td class="n">${num}</td><td>${lh&&!own&&!/^[-–]/.test(d)?'– ':''}${d}</td><td class="c">${fmtq(i.q)}</td><td class="c">${esc(i.unit||'')}</td>${S0?emp(nc-4):MG.length?MG.map(k=>`<td class="r">${M(V[k][0])}</td><td class="r">${M(V[k][1])}</td>`).join(''):`<td class="r">${M(x.u)}</td>`}${S0?'':`<td class="r">${fmt(x.t,2)}</td>`}</tr>`)});
    if(lg!==null&&order.length>1&&!S0)body.push(sumG(lg));
    body.push(`<tr class="tt"><td></td><td>${t('รวมทั้งหมด','Total',1)}</td>${emp(2)}${S0?MG.map(k=>`<td class="r">${M(T[k])}</td>`).join(''):MG.length?MG.map(k=>`<td></td><td class="r">${M(T[k])}</td>`).join(''):'<td></td>'}<td class="r">${fmt(T.t,2)}</td></tr>`);
    return body.join('')};
  const mini=`<tr class="rh"><th colspan="${nc}"><div class="qm-mini">${C.logo?`<img src="${C.logo}" alt="">`:`<b>${esc(C.name||'')}</b>`}<div><b>${t('บัญชีแสดงปริมาณงานและราคา','Bill of Quantities',1)}</b></div><span class="sp"></span><div class="no">${esc(Q.no||'')}${Q.ref?' · '+esc(Q.ref):''}<br>${esc([Q.pname,Q.title].filter(Boolean).join(' · '))}</div></div></th></tr>`;
  const detail=(withMini)=>`<table class="qm-t">${cols(wD)}<thead>${withMini?mini:''}${S0?thS:thD2}</thead><tbody>${det()}</tbody></table>`;
  // page-one summary by section
  const summary=()=>{const w=eqs?fill([7,0,14,14,14,16]):sp?fill([7,0,17,17,18]):fill([7,0,20]);
    const rows=order.map((g,k)=>`<tr><td class="n">${k+1}</td><td>${esc(gN(g))}</td>${MG.map(k=>`<td class="r">${M(G[g][k])}</td>`).join('')}<td class="r">${fmt(G[g].t,2)}</td></tr>`).join('');
    return `<table class="qm-t">${cols(w)}<thead><tr class="ch"><th>${t('ลำดับ','No.')}</th><th>${t('รายการ','Description')}</th>${MG.map(k=>`<th>${lab[k]}</th>`).join('')}<th>${t('จำนวนเงิน','Amount')}</th></tr></thead>
      <tbody>${rows}<tr class="tt"><td></td><td>${t('รวม','Total',1)}</td>${MG.map(k=>`<td class="r">${M(T[k])}</td>`).join('')}<td class="r">${fmt(T.t,2)}</td></tr></tbody></table>`};
  // ---- totals, amount in words, terms
  const tr=(k,v,cl)=>`<div${cl?` class="${cl}"`:''}><span>${k}</span><b>${v}</b></div>`;
  const totals=`<div class="qm-tot">${tr(t('รวมเป็นเงิน','Subtotal',1),fmt(mk||A.length?T.t:c.sub,2))}${mk?tr(t(`ค่าดำเนินการและกำไร ${fmt(n(Q.mk),2)}%`,`Overhead &amp; profit ${fmt(n(Q.mk),2)}%`,1),fmt(mk,2)):''}
    ${A.map(a=>tr(esc(a.name||''),fmt(a.v,2))).join('')}${mk||A.length?tr(t('รวม','Total',1),fmt(c.sub,2)):''}
    ${c.disc?tr(t('ส่วนลด','Discount',1),'-'+fmt(c.disc,2),'d')+tr(t('ยอดหลังหักส่วนลด','After discount',1),fmt(c.net,2)):''}${tr(t('ภาษีมูลค่าเพิ่ม 7%','VAT 7%',1),fmt(c.vat,2))}
    ${tr(t('จำนวนเงินรวมทั้งสิ้น','Grand total'),fmt(c.grand,2),'gt')}${ma?tr(t('เฉลี่ยต่อเดือน (รวม VAT)','Per month (incl. VAT)',1),fmt(c.grand/qmMonths(Q),2),'pm'):''}</div>`;
  // the part the customer withholds 3% on, in proportion to the amount before VAT (after markup, extras and discount)
  const wb=eqs&&Q.whtB!=='none'&&T.t>0?(Q.whtB==='l'?T.l:T.m+T.l):null,wy=wb==null?0:c.net*wb/T.t,ww=wy*3/100;
  const wht=wb==null?'':`<div class="qm-tot qm-wh">${tr(Q.whtB==='l'?t('ค่าเครื่องและค่าวัสดุ (ไม่หัก ณ ที่จ่าย)','Equipment &amp; material (no withholding tax)',1):t('ค่าเครื่อง (ไม่หัก ณ ที่จ่าย)','Equipment (no withholding tax)',1),fmt(c.net-wy,2))}${tr(Q.whtB==='l'?t('ค่าแรง (หัก ณ ที่จ่าย 3%)','Labour (3% withholding)',1):t('ค่าวัสดุและค่าแรง (หัก ณ ที่จ่าย 3%)','Material &amp; labour (3% withholding)',1),fmt(wy,2))}
    ${tr(t('หักภาษี ณ ที่จ่าย 3% (โดยประมาณ)','Withholding tax 3% (approx.)',1),'-'+fmt(ww,2),'d')}${tr(t('ยอดรับสุทธิหลังหัก ณ ที่จ่าย','Net after withholding tax',1),fmt(c.grand-ww,2),'nt')}</div>`;
  const words=`<div class="qm-wd"><span>${t('จำนวนเงินตัวอักษร','Amount in words',1)}</span>${L!=='en'?`<b>(${esc(bahtText(c.grand))})</b>`:''}${L!=='th'?`<b style="display:block${L==='bi'?';font-weight:400;font-size:9.5px;color:#4A5D66':''}">${qmWords(c.grand)}</b>`:''}</div>`;
  const pay=qEnsure(Q).qpay||[],notes=String(Q.terms||'').split(/\n| · /).map(x=>x.trim()).filter(Boolean);
  const r2=(k,v)=>v?`<div class="row2"><span>${k}</span><div>${v}</div></div>`:'';
  const terms=`<div class="qm-tm"><h3>${t('เงื่อนไข','Terms &amp; conditions')}</h3>
    ${r2(t('ยืนราคา','Validity'),n(Q.valid)?(EN?`${n(Q.valid)} days from the quotation date`:`${n(Q.valid)} วันนับจากวันที่เสนอราคา`):'')}
    ${ma?'':r2(t('กำหนดแล้วเสร็จ','Completion'),esc(Q.dlv||''))}
    ${pay.length?`<div><span style="color:var(--qg)">${t('การชำระเงิน','Payment',1)}</span><table class="pay"><thead><tr><th>${tx('งวด','No.')}</th><th>${tx('เมื่อ','When')}</th><th class="r">%</th><th class="r">${tx('จำนวนเงิน (รวม VAT)','Amount (incl. VAT)')}</th></tr></thead><tbody>
      ${pay.map((x,k)=>`<tr><td>${esc(x.no||String(k+1))}</td><td>${esc(x.desc||'')}</td><td class="r">${fmt(x.pct,0)}%</td><td class="r">${fmt(c.grand*n(x.pct)/100,2)}</td></tr>`).join('')}</tbody></table></div>`:''}
    ${notes.length?`<div><span style="color:var(--qg)">${t('หมายเหตุ','Notes',1)}</span><ol>${notes.map(x=>`<li>${esc(x)}</li>`).join('')}</ol></div>`:''}</div>`;
  const foot=`<div class="qm-ft">${terms}<div>${totals}${wht}${words}</div></div>`;
  // ---- signatures: empty div.ln is where an e-signature goes
  const blank=EN?'Date ........ / ........ / ........':'วันที่ ........ / ........ / ........';
  const sgBox=(h,q,who,cl)=>`<div${cl?` class="${cl}"`:''}><h4>${h}</h4>${q?`<div class="q">${q}</div>`:''}<div class="sp"></div><div class="ln"></div><div class="who">${who}</div><div class="dt">${blank}</div></div>`;
  const signs=`<div class="qm-sg">${sgBox(t('ผู้เสนอราคา','Prepared by'),'',Q.by?`(${esc(Q.by)})`:'( ................................ )')}
    ${sgBox(t('ผู้อนุมัติ','Approved by'),'',Q.signName?`(${esc(Q.signName)})${Q.signPos?`<br><small>${esc(Q.signPos)}</small>`:''}`:'( ................................ )')}
    ${sgBox(t('ลูกค้ายืนยันการสั่งซื้อ','Customer acceptance'),tx('ขอยืนยันการสั่งซื้อตามรายการและเงื่อนไขในใบเสนอราคานี้','We accept this quotation and its terms'),`<small>${tx('ผู้มีอำนาจลงนามพร้อมประทับตรา','Authorised signature &amp; company seal')}</small>`,'ok')}</div>`;
  const ofoot=`<div class="ofoot"><span>${esc(C.name||'')}${C.email?' · '+esc(C.email):''}</span><span>${esc(Q.no||'')}${C.phone?' · '+tx('โทร ','Tel. ')+esc(C.phone):''}</span></div>`;
  const dn=` data-doc-name="${esc([Q.no,ma?(EN?'Service quotation':'ใบเสนอราคาบริการ'):bq?'BOQ':'',[Q.pname,Q.title].filter(Boolean).join(' - ')].filter(Boolean).join(' '))}"`;
  // ---- pages
  if(ma)return QM_CSS+`<div class="qm"${dn}>${head}${cards}${intro}${qmMaTable(Q,t,tx,M)}${qmPlan(Q,t,tx)}${foot}${qmScope(Q,t,tx)}${signs}</div>${ofoot}`;
  let p1;
  if(lt){const to=`<div class="to"><span>${t('เรื่อง','Subject',1)}</span><b>${tx('เสนอราคา','Quotation for ')}${what}</b>${pj?`<span>${t('โครงการ','Project',1)}</span><div>${pj}</div>`:''}<span>${t('เรียน','Attn.',1)}</span><div>${esc([attn,cuN].filter(Boolean).join(' · '))}</div>${one||S0?'':`<span>${t('สิ่งที่ส่งมาด้วย','Enclosure',1)}</span><div>${tx('บัญชีแสดงปริมาณงานและราคา (BOQ)','Bill of Quantities (BOQ)')}</div>`}</div>`;
    const close=L!=='en'?'จึงเรียนมาเพื่อโปรดพิจารณา บริษัทฯ หวังเป็นอย่างยิ่งว่าจะได้รับความไว้วางใจจากท่านในเร็ววันนี้':'We look forward to the opportunity of working with you.';
    p1=`${head}<div class="qm-lt">${to}${intro}${one||S0?detail(false):summary()}${foot}<p>${close}</p><div class="sg1">${t('ขอแสดงความนับถือ','Yours faithfully')}<div class="ln"></div>(${esc(Q.signName||Q.by||'')})<br>${esc(Q.signPos||st.role||'')}</div></div>`}
  else p1=`${head}${cards}${intro}${one||S0?detail(false):summary()}${foot}${signs}`;
  const p2=one||S0?'':`<div style="page-break-before:always"></div>${detail(true)}`;
  return QM_CSS+`<div class="qm"${dn}>${p1}${p2}${sowPrint(Q)}</div>${ofoot}`}

// ---- the service quotation's own parts
function qmMaCard(Q,t,dt,kv){const m=qmMonths(Q),s=okD(Q.maStart)?Q.maStart:'',e=s?addD(addMon(s,m),-1):'',EN=qmLang(Q)==='en',P=QM_PARTS.find(x=>x[0]===(Q.maParts||''))||QM_PARTS[0];
  return `<div class="qm-c"><h3>${t('สัญญาบริการ','Service contract')}</h3>${kv(t('ระยะสัญญา','Term',1),EN?`${m} months`:`${m} เดือน`,'big')}
    ${kv(t('ช่วงสัญญา','Period',1),s?`${dt(s)} – ${dt(e)}`:(EN?'From the contract date':'นับจากวันที่ลงนามสัญญา'))}
    ${kv(t('เข้าบำรุงรักษา','PM visits',1),EN?`${n(Q.maVisits)||4} times a year`:`ปีละ ${n(Q.maVisits)||4} ครั้ง`)}${kv(t('เมื่อแจ้งเสีย','Breakdown call',1),esc(Q.maResp||''))}
    ${kv(t('เวลาให้บริการ','Service hours',1),esc(Q.maHours||''))}${kv(t('อะไหล่','Spare parts',1),EN?P[2]:P[1])}</div>`}
function qmMaTable(Q,t,tx,M){const m=qmMonths(Q),w=[7,0,8,8,9,15,15];w[1]=100-w.reduce((a,b)=>a+b,0);
  const rows=Q.items.map((i,k)=>{const x=qLine(Q,i);return `<tr><td class="n">${k+1}</td><td>${esc([i.type,i.desc].filter(Boolean).join(' '))}</td><td class="c">${fmtq(i.q)}</td><td class="c">${esc(i.unit||'')}</td><td class="c">${fmtq(qmVis(Q,i))}</td><td class="r">${M(qmPerVisit(Q,i))}</td><td class="r">${fmt(x.t,2)}</td></tr>`}).join('');
  return `<table class="qm-t"><colgroup>${w.map(x=>`<col style="width:${x}%">`).join('')}</colgroup><thead><tr class="ch"><th>${t('ลำดับ','No.')}</th><th>${t('เครื่อง / ระบบ','Equipment / system')}</th><th>${t('จำนวน','Qty')}</th><th>${t('หน่วย','Unit')}</th><th>${t('ครั้ง/ปี','Visits/yr')}</th><th>${t('ราคา/หน่วย/ครั้ง','Per unit per visit')}</th><th>${m===12?t('ราคาต่อปี','Per year'):t(`รวม ${m} เดือน`,`${m} months`)}</th></tr></thead>
    <tbody>${rows||`<tr><td></td><td colspan="6">${tx('ยังไม่มีรายการ','No items')}</td></tr>`}<tr class="tt"><td></td><td>${t('รวม','Total',1)}</td><td colspan="4"></td><td class="r">${fmt(sum(Q.items,i=>qLine(Q,i).t),2)}</td></tr></tbody></table>`}
// the visit plan: one bar per visit frequency, a cell per month
function qmPlan(Q,t,tx){const m=Math.min(qmMonths(Q),24),EN=qmLang(Q)==='en',s=okD(Q.maStart)?Q.maStart:'',F={};
  Q.items.forEach(i=>{const v=qmVis(Q,i);if(!v)return;(F[v]=F[v]||[]).push([i.type,i.desc].filter(Boolean).join(' '))});const ks=Object.keys(F).map(Number).sort((a,b)=>b-a);if(!ks.length)return '';
  const mon=k=>{if(!s)return String(k+1);const d=pd(addMon(s,k));return d.toLocaleDateString(EN?'en-GB':'th-TH',{month:'short'})};
  const on=(v,k)=>{const step=12/v;return step>=1?Math.abs(((k+1)/step)-Math.round((k+1)/step))<1e-6:true};
  const lab=v=>{const step=12/v,x=F[v].slice(0,2).join(', ')+(F[v].length>2?(EN?` +${F[v].length-2} more`:` และอีก ${F[v].length-2} รายการ`):'');
    return `${step>=1&&Number.isInteger(step)?(EN?(step===1?'Monthly':`Every ${step} months`):(step===1?'ทุกเดือน':`ทุก ${step} เดือน`)):(EN?`${v} times a year`:`ปีละ ${v} ครั้ง`)} · ${esc(x)}`};
  return `<div class="qm-pl"><div class="qm-c" style="border:0;padding:0"><h3>${t('แผนการเข้าบำรุงรักษา','Visit plan')}</h3></div><table><colgroup><col style="width:30%">${'<col>'.repeat(m)}</colgroup>
    <thead><tr><th></th>${Array.from({length:m},(_,k)=>`<th>${s?mon(k):(EN?'M':'ด.')+(k+1)}</th>`).join('')}</tr></thead>
    <tbody>${ks.map(v=>`<tr><td class="l">${lab(v)}</td>${Array.from({length:m},(_,k)=>`<td><i${on(v,k)?' class="on"':''}></i></td>`).join('')}</tr>`).join('')}</tbody></table></div>`}
// what is checked at every visit, from the company's PM checklists by system
function qmScope(Q,t,tx){if(typeof pmGuess!=='function'||typeof pmSysGet!=='function')return '';const ids=[];
  Q.items.forEach(i=>{const s=i.sys||pmGuess([i.type,i.desc].filter(Boolean).join(' '));if(s&&!ids.includes(s))ids.push(s)});if(!ids.length)return '';
  return `<div class="qm-c" style="border:0;padding:0;margin:4px 0 4px"><h3>${t('ขอบเขตงานที่ตรวจทุกครั้งที่เข้าบำรุงรักษา','Checked at every visit')}</h3></div><div class="qm-sc">${ids.map(id=>{const s=pmSysGet(id);if(!s)return '';
    return `<div><b style="color:var(--qn)">${esc(s.n)}</b><ul>${pmChecks(s).map(x=>`<li>${esc(pmLine(x).t)}</li>`).join('')}</ul></div>`}).join('')}</div>`}

// ---- the quotation page: look, language, short form, kind; and the service-quote card
{const f=salesQuote;salesQuote=function(){let h=f.apply(this,arguments);h=h.replace(/(<button type="button" class="btn sm pri" data-a="add" data-c="co.quotes" data-sel="quote">[^<]*<\/button>)/,'<button type="button" class="btn sm" data-a="qmaNew">+ ใบเสนอราคาบริการ PM/MA</button>$1');
  const C=CO(),Q=C.quotes.find(q=>q.id===S.sel.quote)||C.quotes.slice().reverse()[0];if(!Q)return h;
  const b=`co.quotes.${Q.id}`,sel=(k,L,v)=>`<select data-p="${b}.${k}">${L.map(([x,l])=>`<option value="${x}"${(v||'')===x?' selected':''}>${l}</option>`).join('')}</select>`;
  const xl=Q.look==='xl',f0=qForm(Q),fixed=!qmMa(Q)&&(f0==='G'||f0==='E');
  const opts=`<label>ประเภทใบเสนอราคา${sel('kind',QM_KIND,Q.kind)}</label><label>หน้าตาเอกสาร${sel('look',QM_LOOK,Q.look)}</label><label>ภาษาในเอกสาร${sel('lang',QM_LANG,Q.lang)}</label>
    <label class="chk" style="flex-direction:row;align-items:center;gap:6px"><input type="checkbox" data-t="chk" data-p="${b}.one"${Q.one?' checked':''}${xl||qmMa(Q)?' disabled':''}> ใบสั้น: รายการทั้งหมดอยู่หน้าเดียวกับยอดรวมและลายเซ็น (ไม่แยกแผ่น BOQ)</label>
    ${fixed&&!xl?'<small class="hint" style="flex-basis:100%;margin:0">BOQ-G (ปร.4) และ BOQ-E พิมพ์แบบ Excel เดิมเสมอ เพราะรูปแบบกำหนดไว้แล้ว</small>':''}${xl?'<small class="hint" style="flex-basis:100%;margin:0">แบบ Excel เดิมพิมพ์ภาษาไทยตามต้นฉบับ ภาษาและใบสั้นใช้กับแบบ ORIEN Modern</small>':''}`;
  h=h.replace(`<label>แบบฟอร์ม BOQ ที่พิมพ์`,opts+`<label>แบบฟอร์ม BOQ ที่พิมพ์`);
  if(qmMa(Q)){h=h.replace(/(<button type="button" class="btn sm pri" data-a=")(?:qWonDlg|qWon)(" data-id="[^"]+">)[^<]*(<\/button>)/,(_,a,c,d)=>`${a}qmaWon${c}${Q.svc&&C.svc.some(s=>s.id===Q.svc)?'เปิดสัญญาบริการ':'ได้งาน → สร้างสัญญาบริการ'}${d}`);
    const card=qmaCard(Q,b),i=h.indexOf('<dl class="stats" style="margin-bottom:12px">');h=i<0?h+card:h.slice(0,i)+card+h.slice(i)}
  return h}}
function qmaCard(Q,b){const C=CO(),m=qmMonths(Q),eq=(C.equip||[]).filter(e=>Q.cust&&e.cust===Q.cust);
  const rows=Q.items.map(i=>{const v=qmVis(Q,i);return `<tr><td><input data-p="${b}.items.${i.id}.desc" value="${esc([i.type,i.desc].filter(Boolean).join(' '))}" aria-label="เครื่อง / ระบบ" style="min-width:220px"></td><td style="width:80px"><input class="r" data-t="num" data-p="${b}.items.${i.id}.q" value="${n(i.q)}" aria-label="จำนวน"></td>
    <td style="width:90px"><input data-p="${b}.items.${i.id}.unit" value="${esc(i.unit||'')}" aria-label="หน่วย"></td><td style="width:80px"><input class="r" data-qmv="${Q.id}" data-k="${i.id}" value="${i.vis||''}" placeholder="${n(Q.maVisits)||4}" aria-label="ครั้งต่อปี"></td>
    <td style="width:130px"><input class="r" data-qmp="${Q.id}" data-k="${i.id}" value="${n(i.sp)?Math.round(qmPerVisit(Q,i)*100)/100:''}" placeholder="0.00" aria-label="ราคาต่อหน่วยต่อครั้ง"></td><td class="r">${fmt(n(i.q)*qUnit(Q,i),2)}</td>
    <td><button type="button" class="x" data-a="delRow" data-c="${b}.items" data-id="${i.id}" aria-label="ลบ">✕</button></td></tr>`}).join('');
  return `<div class="qma" style="border:1px solid var(--line);border-radius:12px;padding:12px;margin:0 0 12px"><b style="font-size:14px">สัญญาบริการบำรุงรักษา (PM/MA)</b> <small class="muted">ราคาเสนอของแต่ละรายการ = ราคาต่อหน่วยต่อครั้ง × จำนวนครั้งตลอดสัญญา</small>
    <div class="form" style="margin:8px 0"><label>เริ่มสัญญา<input type="date" data-p="${b}.maStart" value="${esc(Q.maStart||'')}"></label><label>ระยะสัญญา (เดือน)<input data-t="num" data-p="${b}.maMonths" value="${m}"></label>
      <label>เข้าบำรุงรักษา (ครั้ง/ปี)<input data-t="num" data-p="${b}.maVisits" value="${n(Q.maVisits)||4}"></label><label>เมื่อแจ้งเสีย<input data-p="${b}.maResp" value="${esc(Q.maResp||'')}" placeholder="เช่น เข้าตรวจภายใน 24 ชั่วโมง"></label>
      <label>เวลาให้บริการ<input data-p="${b}.maHours" value="${esc(Q.maHours||'')}" placeholder="เช่น จันทร์–เสาร์ 08:00–17:00"></label><label class="w2">อะไหล่<select data-p="${b}.maParts">${QM_PARTS.map(([k,l])=>`<option value="${k}"${(Q.maParts||'')===k?' selected':''}>${l}</option>`).join('')}</select></label></div>
    <div class="tw"><table><thead><tr><th>เครื่อง / ระบบ</th><th class="r">จำนวน</th><th>หน่วย</th><th class="r">ครั้ง/ปี</th><th class="r">ราคา/หน่วย/ครั้ง</th><th class="r">${m===12?'ราคาต่อปี':`รวม ${m} เดือน`}</th><th></th></tr></thead><tbody>${rows||'<tr><td colspan="7" class="empty">ยังไม่มีรายการ เพิ่มเครื่องหรือระบบที่ดูแล</td></tr>'}</tbody></table></div>
    <div class="row" style="margin-top:8px;flex-wrap:wrap;gap:6px"><button type="button" class="btn sm pri" data-a="qmaAdd" data-id="${Q.id}">+ เพิ่มเครื่อง / ระบบ</button>
      ${typeof pmSysAll==='function'?`<select id="qmaSys" aria-label="ระบบงาน PM">${pmSysAll().map(s=>`<option value="${s.id}">${esc(s.n)} (ทุก ${n(s.every)||'-'} เดือน)</option>`).join('')}</select><button type="button" class="btn sm" data-a="qmaSys" data-id="${Q.id}">เพิ่มระบบนี้</button>`:''}
      <button type="button" class="btn sm" data-a="qmaEq" data-id="${Q.id}"${eq.length?'':' disabled title="เลือกลูกค้าที่มีเครื่องในทะเบียนเครื่องก่อน"'}>ดึงจากทะเบียนเครื่องของลูกค้า${eq.length?` (${eq.length})`:''}</button></div></div>`}
ACT.qmaNew=()=>{const C=CO(),Q=Object.assign({id:uid()},NEW.quotes(C.quotes),{kind:'ma',maMonths:12,maVisits:4,maStart:addD(today(),7)});C.quotes.push(Q);S.sel.quote=Q.id;save();render();
  toast('สร้างใบเสนอราคาบริการแล้ว เลือกลูกค้า แล้วเพิ่มเครื่องหรือระบบที่ดูแล')};
const qmaLine=o=>Object.assign({id:uid(),g:QM_G,head:'',type:'',desc:'',unit:'เครื่อง',q:1,m:0,l:0,t:0,sp:'',vis:''},o);
ACT.qmaAdd=b=>{const Q=CO().quotes.find(q=>q.id===b.dataset.id);if(!Q)return;Q.items.push(qmaLine({}));save();render()};
ACT.qmaSys=b=>{const Q=CO().quotes.find(q=>q.id===b.dataset.id),s=$('#qmaSys');if(!Q||!s)return;const y=pmSysGet(s.value);if(!y)return;
  Q.items.push(qmaLine({desc:y.n,unit:'ระบบ',sys:y.id,vis:n(y.every)?Math.round(12/n(y.every)*100)/100:''}));save();render()};
// machines of this customer, one line per name + model, with the visits of its system
ACT.qmaEq=b=>{const C=CO(),Q=C.quotes.find(q=>q.id===b.dataset.id);if(!Q)return;const E=(C.equip||[]).filter(e=>e.cust===Q.cust);if(!E.length){toast('ลูกค้ารายนี้ยังไม่มีเครื่องในทะเบียนเครื่อง');return}
  const M={};E.forEach(e=>{const k=[e.name,e.model].filter(Boolean).join(' ');(M[k]=M[k]||[]).push(e)});let a=0;
  Object.entries(M).forEach(([k,L])=>{if(Q.items.some(i=>i.desc===k))return;const sy=typeof eqSys==='function'?eqSys(L[0]):'',y=sy&&typeof pmSysGet==='function'?pmSysGet(sy):null;
    Q.items.push(qmaLine({desc:k,q:L.length,sys:sy,vis:y&&n(y.every)?Math.round(12/n(y.every)*100)/100:''}));a++});
  save();render();toast(a?`เพิ่ม ${a} รายการจากทะเบียนเครื่อง`:'รายการจากทะเบียนเครื่องมีครบแล้ว')};
// visits and the price per visit set the line's selling price; the price per visit stays when the visits change
document.addEventListener('change',e=>{const el=e.target,id=el.dataset&&(el.dataset.qmv||el.dataset.qmp);if(!id)return;e.stopImmediatePropagation();
  const Q=CO().quotes.find(q=>q.id===id),i=Q&&Q.items.find(x=>x.id===el.dataset.k);if(!i)return;
  if(el.dataset.qmv){const pv=n(i.sp)?qmPerVisit(Q,i):0;i.vis=el.value.trim()===''?'':n(el.value);if(pv)i.sp=Math.round(pv*qmVisits(Q,i)*100)/100}
  else{const v=el.value.trim();i.sp=v===''?'':Math.round(n(v)*qmVisits(Q,i)*100)/100}
  save();render()},true);
// the contract length changes the visits over the contract: keep each line's price per visit
HOOK.push((p,v)=>{const m=p.match(/^co\.quotes\.([^.]+)\.(maMonths|maVisits)$/);if(!m)return;const Q=CO().quotes.find(q=>q.id===m[1]);if(!Q||!qmMa(Q)||!Q._qmPV)return;
  Q.items.forEach(i=>{const pv=Q._qmPV[i.id];if(pv)i.sp=Math.round(pv*qmVisits(Q,i)*100)/100});delete Q._qmPV});
document.addEventListener('focusin',e=>{const p=e.target.dataset&&e.target.dataset.p,m=p&&p.match(/^co\.quotes\.([^.]+)\.(maMonths|maVisits)$/);if(!m)return;
  const Q=CO().quotes.find(q=>q.id===m[1]);if(Q){const o={};Q.items.forEach(i=>{if(n(i.sp))o[i.id]=qmPerVisit(Q,i)});Object.defineProperty(Q,'_qmPV',{value:o,configurable:true,enumerable:false,writable:true})}});
// ได้งาน on a service quotation: a maintenance contract under บริการ, not a project
ACT.qmaWon=b=>{const C=CO(),Q=C.quotes.find(q=>q.id===b.dataset.id);if(!Q)return;
  const s0=Q.svc&&C.svc.find(s=>s.id===Q.svc);if(s0){ACT.go({dataset:{m:'co',k:'svc',s:'con'}});return}
  if(typeof apprOn==='function'&&apprOn()&&typeof apprDone==='function'&&!apprDone('quote',Q)){toast('ใบเสนอราคาต้องผ่านการอนุมัติครบก่อน');return}
  if(!Q.items.length){toast('ใบเสนอราคายังไม่มีรายการ');return}
  const c=qCalc(Q),s=Object.assign({id:uid()},NEW.svc(C.svc),{cust:Q.cust,title:[Q.title||'บำรุงรักษา',Q.site].filter(Boolean).join(' · '),start:okD(Q.maStart)?Q.maStart:today(),months:qmMonths(Q),visits:n(Q.maVisits)||4,value:Math.round(c.net*100)/100,note:'จากใบเสนอราคา '+(Q.no||'')});
  C.svc.push(s);Q.svc=s.id;Q.status='won';(C.leads||[]).filter(l=>l.quote===Q.id).forEach(l=>l.stage='won');save();
  toast(`สร้างสัญญาบริการ ${s.no} แล้ว กด “สร้างนัด PM” เพื่อลงนัดทั้งปี`);ACT.go({dataset:{m:'co',k:'svc',s:'con'}})};
{const f=ACT.qWonDlg;if(f)ACT.qWonDlg=b=>{const Q=CO().quotes.find(q=>q.id===b.dataset.id);if(Q&&qmMa(Q)){if(!(Q.svc&&CO().svc.some(s=>s.id===Q.svc)))ACT.qmaWon(b);return}return f(b)}}
if(typeof SBKW==='object')SBKW['co.sales.quote']=(SBKW['co.sales.quote']||'')+' ใบเสนอราคาสวย ORIEN Modern ใบสั้น ภาษาอังกฤษ English quotation สัญญาบริการ PM MA บำรุงรักษา service quotation';
if(typeof I18N==='object'&&I18N.en&&I18N.en.x)Object.assign(I18N.en.x,{'ประเภทใบเสนอราคา':'Quotation type','หน้าตาเอกสาร':'Document look','ภาษาในเอกสาร':'Document language',
  'งานติดตั้ง / BOQ':'Installation / BOQ','สัญญาบริการบำรุงรักษา (PM/MA)':'Maintenance service contract (PM/MA)','ORIEN Modern (สวย อ่านง่าย)':'ORIEN Modern (clean, easy to read)',
  'แบบ Excel เดิม (เส้นดำ แถบเขียว)':'Original Excel layout (black grid, green bands)','ตามภาษาของโปรแกรม':'Same as the program','ไทย + English':'Thai + English','ไทย':'Thai',
  'ใบสั้น: รายการทั้งหมดอยู่หน้าเดียวกับยอดรวมและลายเซ็น (ไม่แยกแผ่น BOQ)':'Short quote: every line on the page with the totals and signatures (no separate BOQ sheet)',
  'สัญญาบริการบำรุงรักษา (PM/MA)':'Maintenance service contract (PM/MA)','เริ่มสัญญา':'Contract start','ระยะสัญญา (เดือน)':'Term (months)','เข้าบำรุงรักษา (ครั้ง/ปี)':'PM visits a year',
  'เมื่อแจ้งเสีย':'Breakdown call','เวลาให้บริการ':'Service hours','อะไหล่':'Spare parts','เครื่อง / ระบบ':'Equipment / system','ครั้ง/ปี':'Visits/yr','ราคา/หน่วย/ครั้ง':'Per unit per visit',
  'ราคาต่อปี':'Per year','+ เพิ่มเครื่อง / ระบบ':'+ Add equipment / system','เพิ่มระบบนี้':'Add this system','ได้งาน → สร้างสัญญาบริการ':'Won → make a service contract','+ ใบเสนอราคาบริการ PM/MA':'+ PM/MA service quotation','เปิดสัญญาบริการ':'Open the service contract'});

// 4.14 a won quote with ค่าเครื่อง split: the new project's withholding rate covers only the withheld part (3% × its share of the
// price), so its claims and invoices deduct the right amount
const qmWhtShare=Q=>{let a=0,w=0;Q.items.forEach(i=>{const x=qLine(Q,i);a+=x.t;w+=Q.whtB==='l'?x.lt:(qmIsEq(i)?0:x.mt)+x.lt});return a>0?w/a:1};
{const f=ACT.qWon;ACT.qWon=b=>{const Q=CO().quotes.find(q=>q.id===b.dataset.id),had=Q&&Q.pj&&DB.projects[Q.pj];f(b);
  if(!Q||had||!Q.eqSep||Q.whtB==='none'||qmMa(Q))return;const p=Q.pj&&DB.projects[Q.pj];if(!p)return;
  p.info.wht=Math.round(3*qmWhtShare(Q)*1000)/1000;save();toast(`หัก ณ ที่จ่ายของโครงการ ${fmt(p.info.wht,3)}% (3% เฉพาะส่วนที่ไม่ใช่ค่าเครื่อง)`)}}
