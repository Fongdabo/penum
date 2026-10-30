/* ---------- 3.15: instalment submission set (ชุดเอกสารส่งงวด) ----------
   The billing page already printed the claim (ใบเบิกเงิน), tax invoice, receipt and billing note. A contractor submitting
   an instalment also sends a covering letter, a progress statement, a certificate for the consultant (private work) or a
   draft acceptance record for the inspection committee (government work), and site photos. This prints them as one set,
   from the bill, the BOQ or instalment plan, the schedule and the daily-report photos, under the company's own letterhead.
   Choices are kept on the project (sector, addressee, consultant, signer) and on the bill (work done, pages to include). */
PFX.push(['LT-','หนังสือส่งงวดงาน']);
const SUBPG=[['let','หนังสือนำส่งงวดงาน'],['sum','ใบสรุปผลงานประจำงวด'],['bill','ใบเบิกเงินงวด'],['pp','แผนเบิกงวดงาน (Progress Payment)'],['cert','ใบรับรองผลงาน / ใบตรวจรับ'],['ph','รูปถ่ายผลงาน'],['ti','ใบแจ้งหนี้ / ใบกำกับภาษี']];
const isGovP=()=>P.info.sector==='gov';
const subTo=()=>(P.info.subTo||'').trim()||(isGovP()?'ประธานกรรมการตรวจรับพัสดุ':(P.info.client||custName(P.info.cust)||'ผู้ว่าจ้าง'));
// who may sign: project managers and above (department managers, directors, the managing director)
const signerOk=s=>s&&s.active!==false&&(s.dept==='MGT'||/ผู้จัดการ|ผู้อำนวยการ|\(PM\)/.test(s.role||''));
const signerList=()=>(CO().staff||[]).filter(signerOk).sort((a,b)=>(a.dept==='MGT'?0:1)-(b.dept==='MGT'?0:1)||(/กรรมการผู้จัดการ/.test(b.role||'')?1:0)-(/กรรมการผู้จัดการ/.test(a.role||'')?1:0)||String(a.name).localeCompare(String(b.name),'th'));
function subSigner(){const I=P.info,st=I.signerId&&(CO().staff||[]).find(x=>x.id===I.signerId);if(st)return [st.name,I.signerRole||st.role||''];if(I.signer)return [I.signer,I.signerRole||'กรรมการผู้จัดการ'];
  const s=(CO().staff||[]).find(x=>x.active!==false&&/กรรมการผู้จัดการ|ผู้จัดการทั่วไป/.test(x.role||''));return [s?s.name:'',I.signerRole||(s?s.role:'กรรมการผู้จัดการ')]}
function subInfo(b){const prog=billsSorted().filter(x=>(x.kind||'prog')==='prog'),i=prog.indexOf(b),prev=i>0?prog[i-1]:null,it=(P.inst||[]).find(x=>x.id===b.inst);
  const no=it?it.no:String(i+1),s=P.tasks.length?sched():null;
  const actAt=d=>{const H=P.hist||{},k=Object.keys(H).filter(x=>x<=d).sort().pop();return k!=null?n(H[k]):s?s.act():0};
  return {prog,i,prev,it,no,plan:s?s.planAt(b.date):0,act:actAt(b.date),from:prev?addD(prev.date,1):(P.info.start||'')}}
function subPk(b){const d={let:1,sum:1,bill:1,pp:1,cert:1,ph:1,ti:0};return Object.assign(d,b.pk||{})}
function subWork(b,x){if((b.work||'').trim())return b.work.trim();if(x.it&&x.it.desc)return x.it.desc;
  const done=P.tasks.filter(t=>n(t.pct)>=100&&durOf(t)>0).map(t=>t.name);return done.slice(-6).join(', ')}
// photos taken on site between the previous instalment and this one
function subPhotos(b,x){const L=[];(P.daily||[]).filter(d=>d.date<=b.date&&(!x.from||d.date>=x.from)).sort((a,c)=>a.date<c.date?-1:1).forEach(d=>(d.photos||[]).forEach(k=>L.push({k,d:d.date,cap:(d.caps||{})[k]||''})));
  return L.slice(-12)}
const subBr='<div style="page-break-before:always"></div>';
function subLetter(b,x,pk){const I=P.info,C=contract(),c=billCalc(b),CO_=CO(),[sn,sr]=subSigner(),gov=isGovP();
  if(!b.letNo){b.letNo=nextNo('LT-',projects().flatMap(q=>q.bills.filter(y=>y.letNo).map(y=>({no:y.letNo}))));save()}
  const nph=subPhotos(b,x).length,att=SUBPG.filter(([k])=>k!=='let'&&pk[k]&&(k!=='ph'||nph)).map(([k,l],i)=>`${i+1}. ${l}${k==='ph'?` (${nph} รูป)`:''}`);
  const oh=ohead('-','',[]),lh=oh.split('<div class="ot">')[0]+(oh.match(/<div class="ofoot">[\s\S]*$/)||[''])[0];
  // "โครงการ - งาน" names read better as "งาน … โครงการ …"
  const pjN=pjJob().pj,what=pjWhat();
  const row=(k,v)=>`<div class="lt-r"><b>${k}</b><div>${v}</div></div>`,party=esc(I.client||custName(I.cust)||'ผู้ว่าจ้าง');
  return lh+`<div class="let lt2">
  <div class="lt-top"><span>ที่ ${esc(b.letNo)}</span></div>
  <div class="lt-date">${thDL(b.date)}</div>
  ${row('เรื่อง',`${gov?`ขอส่งมอบงานงวดที่ ${esc(x.no)}`:`ขอส่งงานงวดที่ ${esc(x.no)} และขอเบิกเงินค่างาน`} ${gov?what:pjWhat(P,1)}`)}
  ${row('เรียน',esc(subTo()))}
  ${I.contractNo?row('อ้างถึง',`สัญญาจ้างเลขที่ ${esc(I.contractNo)}${okD(I.signed)?` ลงวันที่ ${thDL(I.signed)}`:''}`):''}
  ${att.length?row('สิ่งที่ส่งมาด้วย',`<ol>${att.map(t=>`<li>${esc(t.replace(/^\d+\.\s*/,''))}</li>`).join('')}</ol>`):''}
  <p class="lt-p">ตามที่ ${esc(CO_.name||'')} ได้รับจ้าง${pjN?'':'งาน'} ${what}${siteOnly(I.site)?` ณ ${esc(siteOnly(I.site))}`:''} จาก ${party}${I.contractNo?` ตามสัญญาที่อ้างถึง`:''} มูลค่างานตามสัญญา ${fmt(C.total,2)} บาท (ไม่รวมภาษีมูลค่าเพิ่ม) นั้น</p>
  <p class="lt-p">บัดนี้ ${esc(CO_.name||'ผู้รับจ้าง')} ได้ดำเนินงานงวดที่ ${esc(x.no)}${x.it?` (${fmt(x.it.pct,1)}% ของค่างาน)`:''} แล้วเสร็จ ${subWork(b,x)?`ได้แก่ ${esc(subWork(b,x))} `:''}ผลงานสะสมถึงงวดนี้คิดเป็นร้อยละ ${fmt(c.cum,2)}${x.plan?` (ตามแผนร้อยละ ${fmt(x.plan,2)})`:''} มูลค่างานงวดนี้ ${fmt(c.amt,2)} บาท (${bahtText(c.amt)}) ไม่รวมภาษีมูลค่าเพิ่ม</p>
  <p class="lt-p">${gov?`จึงเรียนมาเพื่อโปรดนำเสนอคณะกรรมการตรวจรับพัสดุตรวจรับงานงวดที่ ${esc(x.no)} และเบิกจ่ายเงินค่าจ้างตามเงื่อนไขของสัญญาต่อไป`:`จึงเรียนมาเพื่อโปรดตรวจสอบผลงานและอนุมัติเบิกจ่ายเงินค่างานงวดที่ ${esc(x.no)} ต่อไป`}</p>
  <div class="lt-sign"><div>ขอแสดงความนับถือ</div><div class="lt-ln"></div><div>(${esc(sn||'.................................................')})</div><div>${esc(sr)}</div><div>${esc(CO_.name||'')}</div></div>
  ${I.pm?`<div class="lt-ct">ผู้ประสานงาน: ${esc(I.pm)}${CO_.phone?` โทร ${esc(CO_.phone)}`:''}${CO_.email?` · ${esc(CO_.email)}`:''}</div>`:''}</div>`}
// Thai external-letter layout: 3 cm left / 2 cm right, labels in a column with the text hanging beside them,
// date from the middle, justified paragraphs, signature block centred on the right half
document.head.insertAdjacentHTML('beforeend',`<style>
#print .lt2{font-size:15.5px;line-height:1.8;padding:0 6mm 0 16mm;color:#111}
#print .lt2 .lt-top{display:flex;justify-content:space-between;align-items:flex-start;margin:10px 0 2px}
#print .lt2 .lt-co{text-align:right;font-size:12.5px;line-height:1.5;color:#333;max-width:55%}
#print .lt2 .lt-date{margin:4px 0 16px 50%}
#print .lt2 .lt-r{display:grid;grid-template-columns:7.2em 1fr;gap:0 .5em;margin:0 0 8px}
#print .lt2 .lt-r ol{margin:0;padding-left:1.3em}#print .lt2 .lt-r li{margin:0}
#print .lt2 .lt-p{text-indent:2cm;text-align:justify;margin:14px 0 0}
#print .lt2 .lt-sign{margin:30px 0 0 45%;text-align:center;line-height:1.7}
#print .lt2 .lt-ln{height:52px}
#print .lt2 .lt-ct{margin-top:34px;font-size:13px;color:#333;border-top:1px solid #ddd;padding-top:6px;display:inline-block}
</style>`);
function subSummary(b,x){const I=P.info,C=contract(),c=billCalc(b),mode=I.billMode==='pct'?'pct':'qty';let t='';
  if(mode==='pct'){const used=new Map(x.prog.map(y=>[y.inst,y]));
    t=`<table><thead><tr><th>งวดที่</th><th>รายละเอียดงาน</th><th>%</th><th>จำนวนเงิน</th><th>สถานะ</th></tr></thead><tbody>${(P.inst||[]).map(it=>{const y=used.get(it.id),st=y===b?'<b>งวดนี้</b>':y&&x.prog.indexOf(y)<x.i?'เบิกแล้ว':'ยังไม่ถึง';
      return `<tr${y===b?' style="background:#eef6f6"':''}><td>${esc(it.no)}</td><td>${esc(it.desc||'')}</td><td style="text-align:right">${fmt(it.pct,2)}</td><td style="text-align:right">${fmt(C.total*n(it.pct)/100,2)}</td><td>${st}</td></tr>`}).join('')}</tbody></table>`}
  else{const uv=unitVal(),G={},pq=i=>x.prev?Math.min(n(i.q),n((x.prev.qty||{})[i.id])):0,cq=i=>Math.min(n(i.q),n((b.qty||{})[i.id]));
    P.boq.items.forEach(i=>{const g=G[i.g]=G[i.g]||{v:0,p:0,c:0};const u=uv(i);g.v+=n(i.q)*u;g.p+=pq(i)*u;g.c+=cq(i)*u});
    const V=P.vos.filter(v=>v.status==='ok').map(v=>{const sg=(v.type==='omit'?-1:1)*n(v.amt);return {nm:`งานเพิ่มลด ${v.no} ${v.desc||''}`,v:sg,p:sg*n(((x.prev||{}).vo||{})[v.id])/100,c:sg*n((b.vo||{})[v.id])/100}});
    const R=[...Object.entries(G).map(([g,o])=>({nm:gName(g),...o})),...V],T={v:sum(R,r=>r.v),p:sum(R,r=>r.p),c:sum(R,r=>r.c)};
    const row=(r,bold)=>`<tr${bold?' style="font-weight:700"':''}><td>${esc(r.nm)}</td><td style="text-align:right">${fmt(r.v,2)}</td><td style="text-align:right">${fmt(r.p,2)}</td><td style="text-align:right">${fmt(r.c-r.p,2)}</td><td style="text-align:right">${fmt(r.c,2)}</td><td style="text-align:right">${r.v?fmt(r.c*100/r.v,1):'0'}%</td></tr>`;
    t=`<table><thead><tr><th>หมวดงาน</th><th>มูลค่าตามสัญญา</th><th>ผลงานสะสมงวดก่อน</th><th>ผลงานงวดนี้</th><th>ผลงานสะสม</th><th>% สะสม</th></tr></thead><tbody>${R.map(r=>row(r)).join('')}${row({nm:'รวม',...T},1)}</tbody></table>`}
  return phead(`ใบสรุปผลงานประจำงวดที่ ${esc(x.no)}`,`ถึงวันที่ ${thDL(b.date)}`)+`<div class="meta"><div>ผู้ว่าจ้าง: ${esc(I.client||custName(I.cust)||'')}</div><div>เลขที่สัญญา: ${esc(I.contractNo||'-')}</div><div>มูลค่าสัญญา (ไม่รวม VAT): ${fmt(C.total,2)} บาท</div><div>ระยะเวลา: ${thD(I.start)} – ${thD(I.finish)}</div></div>
  <table style="margin-bottom:10px"><tbody><tr><td>ผลงานสะสมตามแผน</td><td style="text-align:right">${fmt(x.plan,2)}%</td><td>ผลงานสะสมที่ขอเบิก</td><td style="text-align:right"><b>${fmt(c.cum,2)}%</b></td><td>ความคืบหน้าในแผนงาน ${fmt(x.act,2)}%</td><td>${c.cum>=x.plan-0.5?'เป็นไปตามแผน':'ช้ากว่าแผน '+fmt(x.plan-c.cum,2)+'%'}</td></tr></tbody></table>
  ${t}<h3 style="margin-top:12px">สรุปเงินงวดนี้</h3><table><tbody><tr><td>มูลค่างานงวดนี้</td><td style="text-align:right">${fmt(c.amt,2)}</td></tr>${c.adv?`<tr><td>หักคืนเงินล่วงหน้า ${n(I.adv)}%</td><td style="text-align:right">-${fmt(c.adv,2)}</td></tr>`:''}<tr><td>ภาษีมูลค่าเพิ่ม ${n(I.vat)}%</td><td style="text-align:right">${fmt(c.vat,2)}</td></tr>${c.ret?`<tr><td>หักเงินประกันผลงาน ${n(I.ret)}%</td><td style="text-align:right">-${fmt(c.ret,2)}</td></tr>`:''}${c.wht?`<tr><td>หักภาษี ณ ที่จ่าย ${n(I.wht)}%</td><td style="text-align:right">-${fmt(c.wht,2)}</td></tr>`:''}<tr><td><b>ยอดรับสุทธิ</b></td><td style="text-align:right"><b>${fmt(c.net,2)}</b></td></tr></tbody></table>
  <div class="sign"><div>ผู้รับจ้าง</div><div>${isGovP()?'ผู้ควบคุมงาน':'ผู้ควบคุมงาน / ที่ปรึกษา'}</div></div>`}
function subCert(b,x){const I=P.info,c=billCalc(b),C=contract(),cn=CO().name||'ผู้รับจ้าง';
  if(isGovP())return `<div style="text-align:right;font-size:12px;color:#888">ร่างสำหรับคณะกรรมการตรวจรับพัสดุ (ใช้แบบฟอร์มของหน่วยงานได้)</div><h1 style="text-align:center">ใบตรวจรับพัสดุ (งานจ้าง)</h1>
  <div class="let" style="font-size:15px;line-height:1.8"><p style="text-align:right">เขียนที่ ${esc(I.client||'............................................')}<br>วันที่ ........ เดือน .................... พ.ศ. ..........</p>
  <p style="text-indent:2.5em">ตามที่${esc(I.client||'หน่วยงาน')} ได้ทำสัญญาจ้าง${esc(cn)} ให้ดำเนินการ${pjWhat()} ตามสัญญาเลขที่ ${esc(I.contractNo||'............')}${okD(I.signed)?` ลงวันที่ ${thDL(I.signed)}`:''} เป็นจำนวนเงิน ${fmt(C.total*(1+n(I.vat)/100),2)} บาท (รวมภาษีมูลค่าเพิ่ม) นั้น</p>
  <p style="text-indent:2.5em">ผู้รับจ้างได้ส่งมอบงานงวดที่ ${esc(x.no)} ตามหนังสือที่ ${esc(b.letNo||'............')} ลงวันที่ ${thDL(b.date)} คณะกรรมการตรวจรับพัสดุได้ตรวจรับงานเมื่อวันที่ ........................ ปรากฏว่า</p>
  <p style="margin-left:2.5em">☐ ผลงานถูกต้องครบถ้วนตามสัญญา เห็นควรรับงานงวดที่ ${esc(x.no)} และเบิกจ่ายเงินจำนวน ${fmt(c.amt*(1+n(I.vat)/100),2)} บาท (รวมภาษีมูลค่าเพิ่ม)<br>☐ ผลงานยังไม่ถูกต้องครบถ้วน ให้ผู้รับจ้างแก้ไขดังนี้ ...................................................................</p>
  <p style="text-indent:2.5em">จึงลงลายมือชื่อไว้เป็นหลักฐาน</p></div>
  <div class="sign" style="grid-template-columns:1fr 1fr 1fr"><div>ประธานกรรมการ</div><div>กรรมการ</div><div>กรรมการ</div></div><div class="sign" style="grid-template-columns:1fr 1fr"><div>ผู้ควบคุมงาน</div><div>ผู้รับจ้าง</div></div>`;
  return phead(`ใบรับรองผลงาน (Payment Certificate) งวดที่ ${esc(x.no)}`,`เลขที่ใบเบิก ${esc(b.no)}`)+`<div class="meta"><div>ผู้ว่าจ้าง: ${esc(I.client||custName(I.cust)||'')}</div><div>ผู้รับจ้าง: ${esc(cn)}</div><div>ที่ปรึกษา / ผู้ควบคุมงาน: ${esc(I.consult||'')}</div><div>เลขที่สัญญา: ${esc(I.contractNo||'-')}</div></div>
  <table><tbody><tr><td>มูลค่าสัญญา (รวมงานเพิ่มลด) ไม่รวม VAT</td><td style="text-align:right">${fmt(C.total,2)}</td></tr><tr><td>ผลงานสะสมถึงงวดนี้ (${fmt(c.cum,2)}%)</td><td style="text-align:right">${fmt(C.total*c.cum/100,2)}</td></tr>
  <tr><td>มูลค่างานที่รับรองงวดนี้</td><td style="text-align:right"><b>${fmt(c.amt,2)}</b></td></tr>${c.adv?`<tr><td>หักคืนเงินล่วงหน้า</td><td style="text-align:right">-${fmt(c.adv,2)}</td></tr>`:''}${c.ret?`<tr><td>หักเงินประกันผลงาน</td><td style="text-align:right">-${fmt(c.ret,2)}</td></tr>`:''}
  <tr><td>ภาษีมูลค่าเพิ่ม</td><td style="text-align:right">${fmt(c.vat,2)}</td></tr><tr><td><b>ยอดที่รับรองให้จ่าย (ก่อนหักภาษี ณ ที่จ่าย)</b></td><td style="text-align:right"><b>${fmt(c.base+c.vat-c.ret,2)}</b></td></tr></tbody></table>
  <p style="margin-top:12px">ได้ตรวจสอบผลงานที่หน้างานแล้ว ☐ รับรองตามจำนวนที่ขอ ☐ รับรองบางส่วน จำนวน ........................ บาท เนื่องจาก ......................................................</p>
  <div class="sign"><div>ผู้รับจ้าง</div><div>ที่ปรึกษา / ผู้ควบคุมงาน</div><div>ผู้ว่าจ้าง (อนุมัติ)</div></div>`}
function subPh(b,x){const L=subPhotos(b,x);if(!L.length)return '';
  return phead(`รูปถ่ายผลงานงวดที่ ${esc(x.no)}`,`ช่วงงาน ${x.from?thD(x.from)+' – ':''}${thD(b.date)}`)+`<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">${L.map(p=>`<figure style="margin:0;page-break-inside:avoid"><img data-ph="${p.k}" alt="" style="width:100%;height:62mm;object-fit:cover;border:1px solid #ccd"><figcaption style="font-size:12px">${thD(p.d)}${p.cap?' · '+esc(p.cap):''}</figcaption></figure>`).join('')}</div>`}
const submReg=PRINT.subm;// the submittal register (พิมพ์ทะเบียน) uses the same key with a type instead of a bill id
PRINT.subm=id=>{const b=P.bills.find(y=>y.id===id);if(!b)return submReg(id);const x=subInfo(b),pk=subPk(b),out=[];
  if(pk.let)out.push(subLetter(b,x,pk));if(pk.sum)out.push(subSummary(b,x));if(pk.bill)out.push(PRINT.bill(id));if(pk.pp&&typeof subPP==='function')out.push(subPP(b));if(pk.cert)out.push(subCert(b,x));
  if(pk.ph){const h=subPh(b,x);if(h)out.push(h)}if(pk.ti)out.push(taxInv(id));
  // the landscape sheet starts its own page already; a page break before it as well would leave a blank page
  return out.join(subBr).split(subBr+'<div class="sub-pp"').join('<div class="sub-pp"')};
function subCard(b){const I=P.info,x=subInfo(b),pk=subPk(b),bp=`bills.${b.id}`,ph=subPhotos(b,x).length,[sn]=subSigner();if(!b.pk)b.pk=pk;
  const ck=(k,l)=>`<label style="display:flex;gap:6px;align-items:center;font-weight:400"><input type="checkbox" data-t="chk" data-p="${bp}.pk.${k}"${pk[k]?' checked':''}>${l}${k==='ph'?` <small class="muted">(${ph} รูปจากรายงานประจำวัน)</small>`:''}${k==='cert'?` <small class="muted">(${isGovP()?'ร่างใบตรวจรับสำหรับกรรมการ':'ให้ที่ปรึกษาลงนาม'})</small>`:''}</label>`;
  return `<section class="card" id="subCard"><h2><span>ชุดเอกสารส่งงวด งวดที่ ${esc(x.no)}</span><small>หนังสือนำส่ง สรุปผลงาน ใบเบิก Progress Payment ใบรับรอง และรูปถ่าย พิมพ์รวมเป็นชุดเดียว</small><span class="sp"></span><button type="button" class="btn sm pri" data-a="print" data-k="subm" data-id="${b.id}">พิมพ์ชุดเอกสารส่งงวด</button></h2>
  <div class="form"><label>ประเภทงาน<select data-p="info.sector"><option value="pvt"${!isGovP()?' selected':''}>งานเอกชน</option><option value="gov"${isGovP()?' selected':''}>งานราชการ / รัฐวิสาหกิจ</option></select></label>
  <label class="w2">เรียน<input data-p="info.subTo" value="${esc(I.subTo||'')}" placeholder="${esc(subTo())}"></label>
  <label>${isGovP()?'ผู้ควบคุมงาน':'ที่ปรึกษา / ผู้ควบคุมงาน'}<input data-p="info.consult" value="${esc(I.consult||'')}"></label>
  <label>เลขที่สัญญา<input data-p="info.contractNo" value="${esc(I.contractNo||'')}"></label><label>วันที่ลงนามสัญญา<input type="date" data-p="info.signed" value="${esc(I.signed||'')}"></label>
  ${(()=>{const L=signerList(),cur=I.signerId&&L.find(x=>x.id===I.signerId),man=I.signerId==='_m'||(!cur&&!!I.signer);
    return `<label>ผู้ลงนามหนังสือ<select data-p="info.signerId"><option value=""${!cur&&!man?' selected':''}>อัตโนมัติ${sn&&!cur&&!man?` (${esc(sn)})`:''}</option>${L.map(x=>`<option value="${x.id}"${cur&&cur.id===x.id?' selected':''}>${esc(x.name)} · ${esc(x.role||'')}</option>`).join('')}<option value="_m"${man?' selected':''}>พิมพ์ชื่อเอง…</option></select></label>
    ${man?`<label>ชื่อผู้ลงนาม<input data-p="info.signer" value="${esc(I.signer||'')}" placeholder="ชื่อผู้มีอำนาจลงนาม"></label>`:''}<label>ตำแหน่ง<input data-p="info.signerRole" value="${esc(I.signerRole||'')}" placeholder="${esc(cur?cur.role||'':'กรรมการผู้จัดการ')}"></label>`})()}
  <label class="full">งานที่ทำแล้วเสร็จในงวดนี้ (ใส่ในหนังสือนำส่ง)<textarea data-p="${bp}.work" rows="2" placeholder="${esc(subWork(Object.assign({},b,{work:''}),x)||'เช่น ติดตั้งท่อลมชั้น 1–2 และเครื่องปรับอากาศชั้น 1 แล้วเสร็จ')}">${esc(b.work||'')}</textarea></label></div>
  <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:4px 16px;margin-top:10px">${SUBPG.map(([k,l])=>ck(k,l)).join('')}</div>
  <p class="hint">ผลงานสะสมที่ขอเบิก ${fmt(billCalc(b).cum,1)}% · ความคืบหน้าในแผนงาน ${fmt(x.act,1)}% · ตามแผน ${fmt(x.plan,1)}% ณ วันที่ใบเบิก ${b.letNo?`· หนังสือเลขที่ ${esc(b.letNo)}`:'· เลขที่หนังสือออกให้อัตโนมัติเมื่อพิมพ์'} · หัวเอกสารและโลโก้มาจาก ตั้งค่าบริษัท</p></section>`}
// under the selected progress bill on the billing page
{const f=VIEWS.cost;VIEWS.cost=()=>{const h=f(),m=h.match(/data-a="print" data-k="bill" data-id="([^"]+)"/);if(!m)return h;const b=P.bills.find(y=>y.id===m[1]);if(!b||(b.kind||'prog')!=='prog')return h;
  return h.replace(m[0]+'>',m[0]+'>').replace(/(<button type="button" class="btn sm" data-a="print" data-k="bill" data-id="[^"]+">[^<]*<\/button>)/,'$1<button type="button" class="btn sm pri" data-a="subGo">ชุดเอกสารส่งงวด ↓</button>')+subCard(b)}}
ACT.subGo=()=>{const e=$('#subCard');if(e)e.scrollIntoView({behavior:'smooth',block:'start'})};
Object.assign(SBKW,{'pj.cost.bill':(SBKW['pj.cost.bill']||'')+' ส่งงวด เอกสารส่งงวด หนังสือนำส่ง ส่งมอบงาน ใบรับรองผลงาน payment certificate ใบตรวจรับ'});

// picking a person: their own title is used unless one is typed after; picking "อัตโนมัติ" drops a typed name
HOOK.push((p,v)=>{if(p!=='info.signerId')return;P.info.signerRole='';if(v!=='_m')P.info.signer=''});
