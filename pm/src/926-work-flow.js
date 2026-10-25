/* ---------- 4.42 ผังขั้นตอนงาน: which department does what in PENUM PM, and where the work goes next ----------
   User: customers renting PM "ไม่เข้าใจในขั้นตอนเชื่อมโยงของแต่ละฝ่าย เช่น ฝ่ายขายอยู่ในโปรแกรมทำอะไรได้บ้าง แล้วทำเสร็จต้องไปฝ่ายไหนต่อ".
   The swimlane in องค์กรและเอกสาร › ขั้นตอนงาน is a big table few people find, so the work is now shown four more ways:
   1 หน้าแรก › ผังขั้นตอนงาน (co.flow): nine boxes in the order a job moves (WF). A box opens what that department does in
     PM (each line opens the page), what marks its part done, who gets it next, and the items waiting for it right now.
   2 a thin bar on top of every page that belongs to a step: "ขั้นที่ 4/9 จัดซื้อ · รับงานจาก … · ส่งต่อ …" (× hides it,
     kept per device in penum.pm.wfbar).
   3 after the actions that hand work over (ได้งาน, ส่งใบเสนอราคา, สร้างแผนจาก BOQ, เปิดใบขอซื้อ, ออก PO, รับของครบ,
     ส่งเบิกงวด, รับเงิน, วันส่งมอบ) a "ขั้นต่อไป" box names the next department with a button to its page.
   4 the dashboard shows how many items wait at each step; หน้าแรกของฉัน lists the items waiting for the person's department.
   พิมพ์ผัง A4 prints the nine steps on one landscape page for customers and training. Nothing new is stored in the data. */
const WF=[
  {k:'sal',n:'ขาย',ic:'sales',d:['SAL','MGT'],t:'หาลูกค้า ติดตามงาน ปิดการขาย',
    do:[['บันทึกลูกค้าและผู้ติดต่อ','co','sales','cust'],['ติดตามงานที่กำลังเสนอ ขั้นการขาย โอกาสได้งาน','co','sales','lead'],['ส่งใบเสนอราคาให้ลูกค้า ต่อรอง แล้วกด “ได้งาน → สร้างโครงการ”','co','sales','quote']],
    done:'เปิดงานใน “งานที่กำลังติดตาม” แล้วส่งแบบและความต้องการลูกค้าให้ประมาณราคา',give:'ข้อมูลลูกค้า แบบ และขอบเขตงาน'},
  {k:'est',n:'ประมาณราคา',ic:'est',d:['EST','DES'],t:'ถอด BOQ ทำใบเสนอราคา',
    do:[['คำนวณและถอด BOQ ในโปรแกรม PENUM MEP','mep'],['ทำใบเสนอราคา ดึง BOQ จาก PENUM MEP หรือพิมพ์เอง','co','sales','quote'],['ผู้บริหารอนุมัติราคาที่กำไรต่ำกว่าเป้า','co','sales','quote',1]],
    done:'ขายส่งใบเสนอราคา ลูกค้าตกลง แล้วกด “ได้งาน → สร้างโครงการ” ในใบเสนอราคา',give:'โปรแกรมเปิดโครงการให้เอง พร้อม BOQ และมูลค่าสัญญา'},
  {k:'pj',n:'โครงการ',ic:'pj',d:['PRJ'],t:'วางแผน คุมงาน คุมงบ',
    do:[['ตรวจข้อมูลโครงการ BOQ และงวดเงิน','pj','setup'],['สร้างแผนงาน Gantt (ปุ่ม “สร้างแผนตั้งต้นจาก BOQ”)','pj','sched'],['ส่งเอกสารขออนุมัติ Shop Drawing วัสดุ','pj','docs'],['เปิดใบขอซื้อจากรายการ BOQ','pj','buy','boq']],
    done:'เลือกรายการวัสดุ BOQ แล้วกด “สร้างใบขอซื้อจากรายการที่เลือก” (หัวหน้าโครงการอนุมัติ)',give:'ใบขอซื้อ (PR) ที่อนุมัติแล้ว'},
  {k:'pur',n:'จัดซื้อ',ic:'buy',d:['PUR'],t:'เทียบราคา สั่งซื้อ',
    do:[['ใส่ราคาผู้ขายหลายเจ้าในใบขอซื้อ แล้วเทียบ','pj','buy','pr'],['กด “เลือกและออก PO” ที่ผู้ขายที่ต้องการ','pj','buy','pr',1],['ติดตามใบสั่งซื้อและวันส่งของ','pj','buy','po']],
    done:'ออก PO ส่งผู้ขาย',give:'PO และวันส่งของให้สโตร์รอรับ ยอดที่ต้องจ่ายไปที่บัญชี'},
  {k:'store',n:'สโตร์',ic:'store',d:['PUR','PRJ'],t:'รับของ จ่ายของ',
    do:[['บันทึกรับของเข้าตาม PO (ปุ่ม “รับครบทุกรายการวันนี้”)','pj','buy','dl'],['คลังวัสดุหน้างาน ยอดคงเหลือ','pj','buy','stock'],['จ่ายของตามใบขอเบิกของช่าง','pj','buy','stock']],
    done:'รับของครบตาม PO และจ่ายของให้หน้างาน',give:'วัสดุถึงมือช่างที่หน้างาน'},
  {k:'site',n:'หน้างาน',ic:'site',d:['PRJ','SHE'],t:'ติดตั้ง รายงานความคืบหน้า',
    do:[['รายงานประจำวัน คน งาน รูปถ่าย','pj','site','daily'],['RFI ถามผู้ออกแบบ และงานเพิ่มลด (VO)','pj','site','rfi'],['ใบอนุญาตทำงานและตรวจความปลอดภัย','pj','site','wp'],['อัปเดต % งานในแผนงาน','pj','sched']],
    done:'อัปเดต % งานจนถึงงวด แล้วทำใบเบิกงวด',give:'ผลงานที่ทำได้ ใช้วัดเงินงวด'},
  {k:'acct',n:'เบิกงวดและบัญชี',ic:'acct',d:['ACC','PRJ'],t:'วางบิล รับเงิน จ่ายเงิน',
    do:[['ทำใบเบิกงวดตามผลงาน (ผู้บริหารอนุมัติ)','pj','cost','bill'],['ใบวางบิลส่งลูกค้า','co','acct','bn'],['ติดตามเงินรับ (ลูกหนี้)','co','acct','ar'],['จ่ายผู้ขายตาม PO (เจ้าหนี้)','co','acct','ap']],
    done:'รับเงินแล้วเปลี่ยนใบเบิกงวดเป็น “รับเงินแล้ว” ทำทุกงวดจนครบ',give:'งวดสุดท้ายเมื่อส่งมอบ แล้วคืนเงินประกันผลงาน'},
  {k:'hand',n:'ส่งมอบ',ic:'hand',d:['PRJ'],t:'ทดสอบ แก้งาน ส่งมอบ',
    do:[['ทดสอบระบบ (T&C) และปรับสมดุลลม/น้ำ (TAB)','pj','hand','tc'],['Punch list งานที่ต้องแก้','pj','hand','punch'],['เอกสาร O&M และประกันผลงาน','pj','hand','war']],
    done:'ใส่วันส่งมอบในข้อมูลโครงการ แล้วเบิกงวดสุดท้าย',give:'ทะเบียนเครื่องและประกันให้บริการหลังการขาย'},
  {k:'svc',n:'บริการหลังการขาย',ic:'svc',d:['SVC'],t:'สัญญา PM/MA งานซ่อม',
    do:[['ทำสัญญาบำรุงรักษา (PM/MA)','co','svc','con'],['งานซ่อมและนัด PM','co','svc','job'],['ทะเบียนเครื่องและประวัติซ่อม','co','svc','eqp']],
    done:'ลูกค้าอยากได้งานเพิ่ม ส่งเรื่องกลับให้ขาย',give:'งานใหม่จากลูกค้าเดิม (วนกลับไปที่ขาย)'}];
// the step a page belongs to; the first match wins
const WF_PG=[['co.sales.quote','est'],['co.sales','sal'],['co.tender','est'],['pj.setup','pj'],['pj.sched','pj'],['pj.docs','pj'],['pj.dash','pj'],
  ['pj.buy.dl','store'],['pj.buy.stock','store'],['pj.buy','pur'],['pj.site','site'],['pj.qa','site'],['pj.cost','acct'],['co.acct','acct'],['pj.hand','hand'],['co.svc','svc']];
const wfI=k=>WF.findIndex(s=>s.k===k);
const wfNo=i=>'①②③④⑤⑥⑦⑧⑨'[i]||String(i+1);
const wfNext=s=>WF[(wfI(s.k)+1)%WF.length],wfPrev=s=>WF[(wfI(s.k)+WF.length-1)%WF.length];
const wfLive=()=>projects().filter(p=>!p.closed&&!p.cxl);
const wfMine=()=>{const u=me();return u&&u.dept!=='MGT'?WF.filter(s=>s.d.includes(u.dept)).map(s=>s.k):[]};
// what waits for each step now: {txt, p, go:{m,k,s}, sel:[key,id], due, lv}
function wfWait(k){const C=CO(),L=[],td=today(),add=(txt,p,go,o)=>L.push(Object.assign({txt,p,go},o||{}));
  const each=f=>wfLive().forEach(p=>withP(p,()=>f(p)));
  if(k==='sal'){(C.quotes||[]).filter(q=>q.status==='sent').forEach(q=>add(`${q.no} ${q.title||''} · ส่งแล้ว รอลูกค้าตอบ`,null,{m:'co',k:'sales',s:'quote'},{sel:['quote',q.id],due:okD(q.date)?addD(q.date,n(q.valid)||30):''}));
    (C.leads||[]).filter(l=>!l.auto&&l.stage==='nego').forEach(l=>add(`${l.name||''} · กำลังต่อรอง`,null,{m:'co',k:'sales',s:'lead'},{due:l.close}))}
  if(k==='est'){(C.leads||[]).filter(l=>!l.auto&&!l.quote&&['lead','survey','quote'].includes(l.stage)).forEach(l=>add(`${l.name||''} · ยังไม่มีใบเสนอราคา`,null,{m:'co',k:'sales',s:'lead'},{due:l.close}));
    (C.quotes||[]).filter(q=>(q.status||'draft')==='draft').forEach(q=>add(`${q.no} ${q.title||''} · ร่าง ยังไม่ได้ส่ง`,null,{m:'co',k:'sales',s:'quote'},{sel:['quote',q.id]}))}
  if(k==='pj'){(C.quotes||[]).filter(q=>q.status==='won'&&!(q.pj&&DB.projects[q.pj])).forEach(q=>add(`${q.no} ${q.title||''} · ได้งานแล้ว ยังไม่เปิดโครงการ`,null,{m:'co',k:'sales',s:'quote'},{sel:['quote',q.id],lv:'warn'}));
    each(p=>{if(p.boq.items.length&&!p.tasks.length)add('มี BOQ แล้ว ยังไม่มีแผนงาน',p,{m:'pj',k:'sched'});
      else if(p.tasks.length&&p.boq.items.length&&!p.prs.length&&!p.pos.length)add('มีแผนงานแล้ว ยังไม่ได้เปิดใบขอซื้อ',p,{m:'pj',k:'buy',s:'boq'})})}
  if(k==='pur')each(p=>p.prs.filter(r=>!r.po&&r.items.length).forEach(r=>add(`${r.no} · รอเทียบราคาและออก PO`,p,{m:'pj',k:'buy',s:'pr'},{sel:['pr',r.id],due:r.need})));
  if(k==='store')each(p=>{p.pos.filter(po=>po.items.length).forEach(po=>{const st=poState(po);if(st.k!=='ok')add(`${po.no} ${vName(po.vid)} · ${st.l}`,p,{m:'pj',k:'buy',s:'dl'},{sel:['po',po.id],due:po.due,lv:st.k==='bad'?'bad':''})});
    (p.mreq||[]).filter(r=>r.status==='ok'&&(r.items||[]).some(i=>n(i.q)-n(i.iss)>0)).forEach(r=>add(`${r.no||'ใบขอเบิก'} · อนุมัติแล้ว รอจ่ายของ`,p,{m:'pj',k:'buy',s:'stock'}))});
  if(k==='site')each(p=>{(p.rfis||[]).filter(r=>r.status==='open').forEach(r=>add(`${r.no} ${r.subject||''} · RFI รอคำตอบ`,p,{m:'pj',k:'site',s:'rfi'},{due:r.due,lv:okD(r.due)&&r.due<td?'bad':''}));
    (p.mreq||[]).filter(r=>r.status==='req').forEach(r=>add(`${r.no||'ใบขอเบิก'} · ช่างขอเบิกของ รออนุมัติ`,p,{m:'pj',k:'buy',s:'stock'}))});
  if(k==='acct'){each(p=>p.bills.filter(b=>b.status==='draft').forEach(b=>add(`${b.no} · ใบเบิกงวดร่าง รอส่งเบิก`,p,{m:'pj',k:'cost',s:'bill'},{sel:['bill',b.id]})));
    const live=new Set(wfLive().map(p=>p.id));
    arRows().filter(r=>live.has(r.p.id)&&r.b.status!=='paid').forEach(r=>add(`${r.b.no} ${fmt(r.c.net)} บาท · รอรับเงิน`,r.p,{m:'co',k:'acct',s:'ar'},{due:r.due,lv:r.due<td?'bad':''}));
    apRows().filter(r=>live.has(r.p.id)&&!r.po.paid&&okD(r.due)&&r.due<=addD(td,7)).forEach(r=>add(`${r.po.no} ${fmt(r.t)} บาท · ครบกำหนดจ่ายผู้ขาย`,r.p,{m:'co',k:'acct',s:'ap'},{due:r.due,lv:r.due<td?'bad':'warn'}))}
  if(k==='hand')each(p=>{(p.punch||[]).filter(r=>r.status!=='done').forEach(r=>add(`${r.no} ${r.item||''} · Punch รอแก้`,p,{m:'pj',k:'hand',s:'punch'},{due:r.due,lv:okD(r.due)&&r.due<td?'warn':''}));
    if(p.tasks.length&&!p.info.handover&&p.tasks.every(t=>n(t.pct)>=100))add('งานเสร็จครบแล้ว ยังไม่ใส่วันส่งมอบ',p,{m:'pj',k:'hand',s:'tc'},{lv:'warn'})});
  if(k==='svc'){(C.tickets||[]).filter(t=>t.status==='open'||t.status==='plan').forEach(t=>add(`${t.no} ${t.problem||''} · ${t.kind==='pm'?'นัด PM':'งานซ่อม'}`,null,{m:'co',k:'svc',s:'job'},{due:t.due,lv:okD(t.due)&&t.due<td?'bad':''}));
    each(p=>{if(okD(p.info.handover)&&p.info.cust&&!(C.svc||[]).some(s=>s.cust===p.info.cust))add('ส่งมอบแล้ว ยังไม่มีสัญญาบำรุงรักษา เสนอ PM/MA ได้',p,{m:'co',k:'svc',s:'con'})})}
  return L.sort((a,b)=>(a.lv==='bad'?0:a.lv==='warn'?1:2)-(b.lv==='bad'?0:b.lv==='warn'?1:2)||String(a.due||'9').localeCompare(String(b.due||'9')))}
// "ref · what waits": the second part on its own so the language switch finds it
const wfTxt=t=>{const i=t.lastIndexOf(' · ');return i<0?`<span>${esc(t)}</span>`:`${esc(t.slice(0,i))} · <span>${esc(t.slice(i+3))}</span>`};
const wfOk=g=>g[0]==='mep'||allowed(g[0],g[1]);
const wfGoAttr=(go,p,sel)=>`data-a="wfGo" data-m="${go.m}" data-k="${go.k}"${go.s?` data-s="${go.s}"`:''}${p?` data-p="${p.id}"`:''}${sel?` data-sk="${sel[0]}" data-sid="${sel[1]}"`:''}`;
// open a page; a project page with no project chosen opens the first live project
ACT.wfGo=b=>{const d=b.dataset;if(d.m==='pj'&&!d.p&&!(typeof P!=='undefined'&&P&&DB.projects[P.id])){const f=wfLive()[0]||projects()[0];if(!f){toast('ยังไม่มีโครงการ เริ่มจากใบเสนอราคา แล้วกด “ได้งาน”');return}d.p=f.id}
  wfHintOff();ACT.go(b);if(d.sk){S.sel[d.sk]=d.sid;render()}};
ACT.wfSel=b=>{S.wf=b.dataset.k;if(S.mode!=='co'||S.ctab!=='flow'){S.dept='home';S.mode='co';S.ctab='flow'}render();
  const e=$('#wfDet');if(e&&b.dataset.scroll)e.scrollIntoView({block:'start',behavior:'smooth'})};
const wfSv=a=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${a||''}</svg>`;
function wfChain(cnt,mine,cur,small){return `<div class="wfc${small?' sm':''}">${WF.map((s,i)=>{const c=cnt?cnt[s.k]:0;
  return `${i?'<span class="wfa" aria-hidden="true">→</span>':''}<button type="button" class="wfb${s.k===cur?' on':''}${mine.includes(s.k)?' me':''}" data-a="wfSel" data-k="${s.k}"${small?' data-scroll="1"':''}>
    <span class="wfn">${i+1}</span>${wfSv(ICO[s.ic])}<b>${s.n}</b>${small?'':`<small>${s.t}</small>`}${c?`<em class="wfq" title="งานที่รออยู่">${c}</em>`:''}${mine.includes(s.k)&&!small?'<i class="wfme">ฝ่ายของคุณ</i>':''}</button>`}).join('')}
  <span class="wfa wfloop" aria-hidden="true">↺</span></div>`}
function wfTable(L,max){if(!L.length)return '<p class="hint" style="margin:0">ตอนนี้ไม่มีงานค้างที่ขั้นนี้</p>';
  return `<div class="tw"><table><thead><tr><th>รายการ</th><th>โครงการ</th><th>กำหนด</th><th></th></tr></thead><tbody>${L.slice(0,max).map(a=>`<tr><td>${a.lv?`<span class="pill ${a.lv}">${a.lv==='bad'?'เลยกำหนด':'ต้องดู'}</span> `:''}${wfTxt(a.txt)}</td><td>${a.p?esc(a.p.name):'<span class="muted">บริษัท</span>'}</td><td style="white-space:nowrap">${okD(a.due)?thD(a.due):''}</td>
    <td>${allowed(a.go.m,a.go.k)?`<button type="button" class="btn sm" ${wfGoAttr(a.go,a.p,a.sel)}>เปิด</button>`:''}</td></tr>`).join('')}${L.length>max?`<tr><td colspan="4" class="muted">และอีก ${L.length-max} รายการ</td></tr>`:''}</tbody></table></div>`}
function wfDoBtn(g){const [l,m,k,s,ap]=g,tag=ap?' <span class="wfap">อนุมัติ</span>':'';
  if(m==='mep')return `<a class="wfdo" href="../mep/" target="penum-mep">${l} ↗</a>`;
  return wfOk(g)?`<button type="button" class="wfdo" ${wfGoAttr({m,k,s})}>${l}${tag}<span>›</span></button>`:`<span class="wfdo off" title="ฝ่ายของคุณไม่ได้เปิดหน้านี้">${l}${tag}</span>`}
CVIEWS.flow=()=>{const mine=wfMine(),cnt={};WF.forEach(s=>cnt[s.k]=wfWait(s.k).length);
  const cur=WF.find(s=>s.k===S.wf)||WF.find(s=>mine.includes(s.k))||WF[0],i=wfI(cur.k),nx=wfNext(cur),pv=wfPrev(cur),L=wfWait(cur.k);
  return `<section class="card"><h2><span>ผังขั้นตอนงาน</span><small>งานหนึ่งงานเดินจากซ้ายไปขวา กดกล่องเพื่อดูว่าฝ่ายนั้นทำอะไรในโปรแกรม ทำเสร็จแล้วส่งต่อให้ใคร · ตัวเลขสีแดง = งานที่รอฝ่ายนั้นอยู่ตอนนี้</small>
    <span class="sp"></span><button type="button" class="btn sm" data-a="wfPrint">พิมพ์ผัง A4</button>${allowed('co','org')?'<button type="button" class="btn sm ghost" data-a="go" data-m="co" data-k="org" data-s="flow">ดูแบบตารางทุกฝ่าย</button>':''}</h2>
    ${wfChain(cnt,mine,cur.k)}</section>
  <section class="card wfdet" id="wfDet"><h2><span><span class="wfn big">${i+1}</span> ${cur.n}</span><small>${cur.t}${mine.includes(cur.k)?' · ฝ่ายของคุณ':''}</small></h2>
    <div class="wfg"><div><h3>ทำอะไรในโปรแกรม <small>กดเพื่อไปที่หน้านั้น</small></h3><div class="wfdos">${cur.do.map(wfDoBtn).join('')}</div></div>
    <div class="wfho"><div class="wfin"><small>รับงานมาจาก</small><button type="button" class="wfmini" data-a="wfSel" data-k="${pv.k}">${wfNo(wfI(pv.k))} <span>${pv.n}</span></button><span>${pv.give}</span></div>
      <div class="wfdone"><small>ทำเสร็จเมื่อ</small><span>${cur.done}</span></div>
      <div class="wfout"><small>ส่งต่อให้</small><button type="button" class="wfmini pri" data-a="wfSel" data-k="${nx.k}">${wfNo(wfI(nx.k))} <span>${nx.n}</span> →</button><span>${cur.give}</span></div></div></div>
    <h3 style="margin-top:14px">งานที่รออยู่ตอนนี้ <small>${L.length} รายการ</small></h3>${wfTable(L,15)}</section>
  <section class="card"><label class="chk"><input type="checkbox" data-a="wfBarSw"${wfBarOn()?' checked':''}> แสดงแถบ “ขั้นที่ … ส่งต่อ …” บนหน้าของแต่ละฝ่าย และกล่อง “ขั้นต่อไป” หลังทำงานเสร็จ</label></section>`};
COTABS.push(['flow','ผังขั้นตอนงาน']);ICO.flow='<rect x="2" y="9" width="6" height="6" rx="1"/><rect x="16" y="3" width="6" height="6" rx="1"/><rect x="16" y="15" width="6" height="6" rx="1"/><path d="M8 12h4M12 6v12M12 6h4M12 18h4"/>';
{const f=allowed;allowed=function(mode,tab){return mode==='co'&&tab==='flow'?true:f(mode,tab)}}
{const h=NAVD.find(d=>d[0]==='home');if(h)h[2].push(['co','flow','','ผังขั้นตอนงาน'])}

/* --- 2: the bar on top of a department's page --- */
const wfBarOn=()=>{try{return localStorage.getItem('penum.pm.wfbar')!=='0'}catch(e){return true}};
ACT.wfBarSw=b=>{try{localStorage.setItem('penum.pm.wfbar',b.checked?'1':'0')}catch(e){}render()};
ACT.wfBarOff=()=>{try{localStorage.setItem('penum.pm.wfbar','0')}catch(e){}render();toast('ซ่อนแถบขั้นตอนแล้ว เปิดอีกครั้งได้ที่ หน้าแรก › ผังขั้นตอนงาน')};
function wfHere(){const t=curTab(),s=S.sub&&S.sub[t],key=S.mode+'.'+t+(s?'.'+s:''),m=WF_PG.find(([p])=>key===p||key.startsWith(p+'.'));return m?WF.find(x=>x.k===m[1]):null}
{const r=render;render=function(){const x=r.apply(this,arguments);if($('#wfHint')&&wfKey()!==WFK)wfHintOff();try{const v=$('#view'),s=wfBarOn()&&v&&!v.querySelector('.fd')&&wfHere();
  if(s){const i=wfI(s.k),nx=wfNext(s),pv=wfPrev(s),h=`<div class="wfbar" role="note"><button type="button" class="wfbar-n" data-a="wfSel" data-k="${s.k}" title="ดูผังขั้นตอนงาน"><span class="wfn">${i+1}</span><span>ขั้นที่</span> ${i+1}/${WF.length} <b>${s.n}</b></button>
    <span class="wfbar-t"><small>รับงานจาก</small> <button type="button" class="wfbar-l" data-a="wfSel" data-k="${pv.k}">${pv.n}</button> <small>· ทำเสร็จเมื่อ</small> ${s.done} <small>· ส่งต่อ</small> <button type="button" class="wfbar-l" data-a="wfSel" data-k="${nx.k}">${nx.n} →</button></span>
    <button type="button" class="x" data-a="wfBarOff" title="ซ่อนแถบนี้" aria-label="ซ่อนแถบนี้">✕</button></div>`,pg=v.querySelector(':scope>nav.pages');
    if(pg)pg.insertAdjacentHTML('afterend',h);else v.insertAdjacentHTML('afterbegin',h)}}catch(e){console.error(e)}return x}}

/* --- 3: "ขั้นต่อไป" after an action that hands work over --- */
let WFH=null,WFK='';
const wfKey=()=>{const t=curTab();return S.mode+'.'+t+'.'+((S.sub||{})[t]||'')+'.'+(S.mode==='pj'&&typeof P!=='undefined'&&P?P.id:'')};
function wfHintOff(){clearTimeout(WFH);const e=$('#wfHint');if(e)e.remove()}
function wfHint(done,k,txt,go,p){if(!wfBarOn())return;const s=WF.find(x=>x.k===k);if(!s)return;wfHintOff();
  document.body.insertAdjacentHTML('beforeend',`<div id="wfHint" class="wfhint" role="status"><div><small>✓ ${esc(done)}</small><b><span>ขั้นต่อไป:</span> ${wfNo(wfI(k))} <span>${s.n}</span></b><span>${txt}</span></div>
    <div class="wfhint-b">${go&&allowed(go.m,go.k)?`<button type="button" class="btn sm pri" ${wfGoAttr(go,p)}>ไปหน้านั้น</button>`:''}<button type="button" class="btn sm" data-a="wfSel" data-k="${k}">ดูผัง</button><button type="button" class="x" data-a="wfHintX" aria-label="ปิด">✕</button></div></div>`);
  WFK=wfKey();WFH=setTimeout(wfHintOff,25000)}
ACT.wfHintX=()=>wfHintOff();
{const f=ACT.qWon;ACT.qWon=b=>{const Q=CO().quotes.find(q=>q.id===b.dataset.id),had=Q&&Q.pj&&DB.projects[Q.pj];f(b);
  if(Q&&!had&&Q.pj&&DB.projects[Q.pj])wfHint('ได้งานแล้ว เปิดโครงการให้แล้ว','pj','ฝ่ายโครงการ: ตรวจ BOQ และงวดเงิน แล้วสร้างแผนงานจาก BOQ',{m:'pj',k:'sched'},DB.projects[Q.pj])}}
{const f=ACT.genTasks;if(f)ACT.genTasks=function(b){const n0=P.tasks.length,x=f.apply(this,arguments);if(P.tasks.length>n0&&!P.prs.length&&!P.pos.length)wfHint('สร้างแผนงานแล้ว','pj','เปิดใบขอซื้อจากรายการวัสดุ BOQ ส่งให้จัดซื้อ',{m:'pj',k:'buy',s:'boq'},P);return x}}
{const f=ACT.mkPR;if(f)ACT.mkPR=function(b){const n0=P.prs.length,x=f.apply(this,arguments);if(P.prs.length>n0)wfHint('เปิดใบขอซื้อแล้ว','pur','ฝ่ายจัดซื้อ: ใส่ราคาผู้ขายหลายเจ้า เทียบ แล้วกด “เลือกและออก PO”',{m:'pj',k:'buy',s:'pr'},P);return x}}
{const f=ACT.award;if(f)ACT.award=function(b){const n0=P.pos.length,x=f.apply(this,arguments);const po=P.pos[P.pos.length-1];
  if(P.pos.length>n0&&po)wfHint(`ออก ${po.no} แล้ว`,'store',`สโตร์: รอรับของ${okD(po.due)?' ภายใน '+thD(po.due):''} แล้วบันทึกรับของ · บัญชีเห็นยอดที่ต้องจ่ายในเจ้าหนี้`,{m:'pj',k:'buy',s:'dl'},P);return x}}
{const f=ACT.recvAll;if(f)ACT.recvAll=function(b){const x=f.apply(this,arguments),po=P.pos.find(p=>p.id===b.dataset.id);
  if(po&&poState(po).k==='ok')wfHint(`รับของ ${po.no} ครบแล้ว`,'site','หน้างาน: ช่างขอเบิกของจากคลังวัสดุหน้างาน แล้วติดตั้ง รายงานประจำวัน',{m:'pj',k:'site',s:'daily'},P);return x}}
HOOK.push((p,v)=>{let m;
  if((m=p.match(/^co\.quotes\.([^.]+)\.status$/))&&v==='sent')setTimeout(()=>wfHint('ส่งใบเสนอราคาแล้ว','sal','ฝ่ายขาย: ติดตามลูกค้า เมื่อตกลงกด “ได้งาน → สร้างโครงการ” โปรแกรมจะเปิดโครงการให้',{m:'co',k:'sales',s:'lead'}),0);
  else if((m=p.match(/^bills\.([^.]+)\.status$/))&&(v==='sent'||v==='paid')){const pj=P;setTimeout(()=>v==='sent'?wfHint('ส่งเบิกงวดแล้ว','acct','บัญชี: ทำใบวางบิลส่งลูกค้า แล้วติดตามเงินรับในลูกหนี้',{m:'co',k:'acct',s:'ar'},pj)
    :wfHint('รับเงินงวดแล้ว','site','ทำงานงวดต่อไปที่หน้างาน ถ้าเป็นงวดสุดท้ายไปที่ส่งมอบ',{m:'pj',k:'site',s:'daily'},pj),0)}
  else if(p==='info.handover'&&okD(v)){const pj=P;setTimeout(()=>wfHint('ใส่วันส่งมอบแล้ว','svc','บริการหลังการขาย: เสนอสัญญาบำรุงรักษา (PM/MA) ให้ลูกค้า และลงทะเบียนเครื่อง',{m:'co',k:'svc',s:'con'},pj),0)}});

/* --- 4: how much waits at each step, on the dashboard and on หน้าแรกของฉัน --- */
function wfCard(){const cnt={};WF.forEach(s=>cnt[s.k]=wfWait(s.k).length);
  return `<section class="card"><h2><span>ขั้นตอนงานของบริษัท</span><small>ตัวเลขสีแดง = งานที่รอฝ่ายนั้นอยู่ กดกล่องเพื่อดูว่าฝ่ายนั้นทำอะไร และส่งต่อให้ใคร</small><span class="sp"></span><button type="button" class="btn sm ghost" data-a="go" data-m="co" data-k="flow">ผังขั้นตอนงาน</button></h2>${wfChain(cnt,wfMine(),'',1)}</section>`}
{const f=CVIEWS.exec;CVIEWS.exec=()=>wfCard()+f()}
{const f=CVIEWS.mine;if(f)CVIEWS.mine=()=>{const h=f(),K=wfMine();if(!K.length)return h;const L=[].concat(...K.map(wfWait));
  const c=`<section class="card"><h2><span>งานที่รอฝ่ายของคุณ</span><small>${K.map(k=>WF[wfI(k)].n).join(' · ')} · ${L.length} รายการ</small><span class="sp"></span><button type="button" class="btn sm ghost" data-a="wfSel" data-k="${K[0]}">ผังขั้นตอนงาน</button></h2>${wfTable(L,12)}</section>`;
  const i=h.indexOf('</section>');return i<0?h+c:h.slice(0,i+10)+c+h.slice(i+10)}}

/* --- the one-page A4 print --- */
ACT.wfPrint=()=>{const C=CO();
  $('#print').innerHTML=`<style>@page{size:A4 landscape;margin:8mm}</style><div class="wfp">${cphead('ผังขั้นตอนงานใน PENUM PM','ใครทำอะไร ทำเสร็จแล้วส่งต่อให้ใคร')}
  <div class="wfp-g">${WF.map((s,i)=>`<div class="wfp-b"><div class="wfp-h"><span class="wfn">${i+1}</span><b>${s.n}</b><small>${s.t}</small></div>
    <ul>${s.do.map(([l,m,k,sb,ap])=>`<li>${l}${ap?' <span class="wfap">อนุมัติ</span>':''}${m==='mep'?'<i>PENUM MEP</i>':`<i>${esc(wfPath(m,k,sb))}</i>`}</li>`).join('')}</ul>
    <div class="wfp-d"><b>ทำเสร็จเมื่อ</b> ${s.done}</div><div class="wfp-o"><b>→ ส่งต่อ ${wfNo(wfI(wfNext(s).k))} ${wfNext(s).n}</b> ${s.give}</div></div>`).join('')}</div>
  <p class="wfp-f">หาเมนูไม่เจอ กด / แล้วพิมพ์ชื่อหน้า · ผังนี้ดูในโปรแกรมได้ที่ หน้าแรก › ผังขั้นตอนงาน (กดกล่องเพื่อไปหน้านั้น และดูงานที่รออยู่) · กล่อง “อนุมัติ” = ต้องมีผู้มีสิทธิ์อนุมัติก่อนส่งต่อ</p></div>`;
  setTimeout(()=>print(),300)};
// the menu path a page sits at: department › page › sub-tab
function wfPath(m,k,s){const D=NAVD.filter(d=>d[0]!=='home'),d=D.find(d=>d[2].some(pg=>pg[0]===m&&pg[1]===k&&s&&pg[2]===s))||D.find(d=>d[2].some(pg=>pg[0]===m&&pg[1]===k));
  const pg=d&&(d[2].find(pg=>pg[0]===m&&pg[1]===k&&pg[2]===s)||d[2].find(pg=>pg[0]===m&&pg[1]===k));
  const subs={quote:'ใบเสนอราคา',lead:'งานที่กำลังติดตาม',cust:'ลูกค้า',boq:'รายการวัสดุจาก BOQ',pr:'ใบขอซื้อและเทียบราคา',po:'ใบสั่งซื้อ (PO)',dl:'รับของเข้า',stock:'คลังวัสดุหน้างาน',
    daily:'รายงานประจำวัน',rfi:'RFI',wp:'ใบอนุญาตทำงาน',bill:'เบิกงวด',bn:'ใบวางบิล',ar:'ลูกหนี้',ap:'เจ้าหนี้',tc:'ทดสอบระบบ',punch:'Punch list',war:'ประกันผลงาน',con:'สัญญาบำรุงรักษา',job:'งานซ่อมและนัด PM',eqp:'ทะเบียนเครื่อง'};
  const L=[d?d[1]:'',pg?pg[3]:'',s&&(!pg||pg[2]!==s)?subs[s]||'':''].filter(Boolean);return L.filter((x,i)=>x!==L[i-1]).join(' › ')}

// เมนู in the title bar opens it too
if(window.penumBar){const m=penumBar.mount;penumBar.mount=cfg=>{const f=cfg.menu;if(typeof f==='function')cfg.menu=()=>{const L=f(),i=L.findIndex(x=>x&&x.t==='คู่มือการใช้งาน');
  L.splice(i<0?L.length:i,0,{t:'ผังขั้นตอนงาน',run:()=>ACT.wfSel({dataset:{k:S.wf||''}})});return L};return m(cfg)}}

document.head.insertAdjacentHTML('beforeend',`<style>
.wfc{display:flex;flex-wrap:wrap;align-items:stretch;gap:6px 4px}
.wfb{position:relative;display:flex;flex-direction:column;align-items:flex-start;gap:3px;width:128px;min-height:96px;padding:10px 10px 8px;border:1px solid var(--line);border-radius:14px;background:var(--surface);color:var(--ink);text-align:left;cursor:pointer;font:inherit;transition:border-color .15s,box-shadow .15s}
.wfb:hover{border-color:var(--accent);box-shadow:0 0 0 3px var(--accent-soft)}
.wfb.on{border-color:var(--accent);background:var(--accent-soft);box-shadow:0 0 0 2px var(--accent)}
.wfb svg{width:20px;height:20px;color:var(--accent);position:absolute;right:10px;top:10px}
.wfb b{font-size:14px;line-height:1.25}.wfb small{font-size:11.5px;color:var(--muted);line-height:1.3}
.wfb.me{border-style:dashed;border-color:var(--accent-2)}
.wfme{font-style:normal;font-size:10.5px;color:var(--accent-2);font-weight:600}
.wfn{display:inline-grid;place-items:center;min-width:22px;height:22px;border-radius:11px;background:var(--accent);color:var(--accent-ink);font-size:12px;font-weight:700;padding:0 4px}
.wfn.big{min-width:28px;height:28px;border-radius:14px;font-size:15px;vertical-align:middle}
.wfq{position:absolute;right:-6px;top:-8px;min-width:22px;height:22px;border-radius:11px;background:var(--danger);color:#fff;font-style:normal;font-size:12px;font-weight:700;display:grid;place-items:center;padding:0 5px;box-shadow:0 0 0 2px var(--surface)}
.wfa{align-self:center;color:var(--muted);font-size:18px;padding:0 1px}.wfloop{font-size:20px;color:var(--accent)}
.wfc.sm .wfb{width:auto;min-height:0;flex-direction:row;align-items:center;gap:6px;padding:7px 10px 7px 8px}
.wfc.sm .wfb svg{position:static;width:16px;height:16px}.wfc.sm .wfb b{font-size:13px;white-space:nowrap}
.wfdet h3{font-size:14px;margin:0 0 8px}.wfdet h3 small{font-weight:400;color:var(--muted);font-size:12px}
.wfg{display:grid;grid-template-columns:minmax(0,1.2fr) minmax(0,1fr);gap:16px}
.wfdos{display:flex;flex-direction:column;gap:6px}
.wfdo{display:flex;align-items:center;gap:8px;width:100%;text-align:left;padding:9px 12px;border:1px solid var(--line);border-radius:10px;background:var(--sunk);color:var(--ink);font:inherit;font-size:13.5px;cursor:pointer;text-decoration:none}
.wfdo:hover{border-color:var(--accent);background:var(--accent-soft)}.wfdo>span:last-child{margin-left:auto;color:var(--accent);font-size:18px;line-height:1}
.wfdo.off{cursor:default;opacity:.6}.wfdo.off:hover{border-color:var(--line);background:var(--sunk)}
.wfap{display:inline-block;font-size:10.5px;font-weight:600;padding:1px 6px;border-radius:6px;background:#FFEDD5;color:#9A3412;border:1px solid #FDBA74;margin-left:4px}
:root[data-theme="dark"] .wfap{background:rgba(251,146,60,.16);color:#FDBA74;border-color:rgba(251,146,60,.5)}
.wfho{display:flex;flex-direction:column;gap:8px}
.wfho>div{display:flex;flex-direction:column;gap:3px;padding:9px 12px;border-radius:10px;border:1px solid var(--line);font-size:13px}
.wfho small{color:var(--muted);font-size:11.5px;font-weight:600}
.wfdone{background:var(--good-soft);border-color:transparent!important}.wfout{background:var(--accent-soft);border-color:transparent!important}
.wfmini{align-self:flex-start;border:1px solid var(--line);background:var(--surface);color:var(--ink);border-radius:8px;padding:3px 10px;font:inherit;font-size:13px;font-weight:600;cursor:pointer}
.wfmini.pri{background:var(--accent);color:var(--accent-ink);border-color:var(--accent)}
.wfbar{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin:0 0 10px;padding:6px 8px 6px 6px;border-radius:12px;background:var(--accent-soft);font-size:12.5px;color:var(--ink)}
.wfbar-n{display:flex;align-items:center;gap:6px;border:0;background:var(--surface);border-radius:9px;padding:3px 10px 3px 4px;font:inherit;font-size:12.5px;color:var(--ink);cursor:pointer}
.wfbar-t{flex:1;min-width:200px}.wfbar>.x{margin-left:auto}.wfbar-t small{color:var(--muted)}
.wfbar-l{border:0;background:none;padding:0;font:inherit;font-weight:600;color:var(--accent);cursor:pointer;text-decoration:underline;text-underline-offset:2px}
.wfhint{position:fixed;z-index:60;left:50%;bottom:20px;transform:translateX(-50%);width:min(560px,calc(100vw - 24px));display:flex;gap:12px;align-items:center;padding:12px 12px 12px 16px;border-radius:14px;background:var(--surface);color:var(--ink);border:1px solid var(--accent);box-shadow:0 12px 32px rgba(0,0,0,.18)}
.wfhint>div:first-child{flex:1;display:flex;flex-direction:column;gap:2px;font-size:13px}.wfhint small{color:var(--good);font-weight:600}.wfhint b{font-size:14.5px}
.wfhint-b{display:flex;gap:6px;align-items:center;flex-wrap:wrap;justify-content:flex-end}
@media (max-width:720px){.wfg{grid-template-columns:1fr}.wfc:not(.sm){flex-direction:column}.wfc:not(.sm) .wfb{width:100%;min-height:0}.wfc:not(.sm) .wfa{transform:rotate(90deg)}
  .wfhint{flex-direction:column;align-items:stretch;bottom:84px}}
@media print{.wfbar,.wfhint{display:none!important}}
#print .wfp-g{display:grid;grid-template-columns:repeat(5,1fr);gap:3mm;margin-top:3mm}
#print .wfp-b{border:1px solid #9FC5CF;border-radius:3mm;padding:2.5mm;font-size:8.6pt;line-height:1.35;break-inside:avoid;display:flex;flex-direction:column;gap:1.5mm}
#print .wfp-h{display:flex;flex-wrap:wrap;align-items:center;gap:1.5mm}#print .wfp-h b{font-size:11pt}#print .wfp-h small{width:100%;color:#567080}
#print .wfn{background:#0891B2;color:#fff;-webkit-print-color-adjust:exact;print-color-adjust:exact}
#print .wfp-b ul{margin:0;padding-left:4mm}#print .wfp-b li{margin:0 0 .8mm}#print .wfp-b li i{display:block;font-style:normal;color:#0E7490;font-size:7.6pt}
#print .wfp-d{background:#E7F7EF;border-radius:2mm;padding:1.5mm;-webkit-print-color-adjust:exact;print-color-adjust:exact}
#print .wfp-o{background:#DDF4FA;border-radius:2mm;padding:1.5mm;margin-top:auto;-webkit-print-color-adjust:exact;print-color-adjust:exact}
#print .wfap{-webkit-print-color-adjust:exact;print-color-adjust:exact}
#print .wfp-f{font-size:8pt;color:#567080;margin-top:3mm}
</style>`);

// English (exact strings; printed documents keep Thai)
// words the dictionary already has (ขาย, โครงการ …) keep their translation
if(typeof I18N==='object'&&I18N.en&&I18N.en.x){const X=I18N.en.x,W={
  'ผังขั้นตอนงาน':'Workflow map','ขาย':'Sales','ประมาณราคา':'Estimating','โครงการ':'Projects','จัดซื้อ':'Purchasing','สโตร์':'Store','หน้างาน':'Site','เบิกงวดและบัญชี':'Billing and accounts','ส่งมอบ':'Handover','บริการหลังการขาย':'After-sales service',
  'หาลูกค้า ติดตามงาน ปิดการขาย':'Find customers, follow leads, close the sale','ถอด BOQ ทำใบเสนอราคา':'Take off the BOQ, make the quotation','วางแผน คุมงาน คุมงบ':'Plan, run the job, control the budget','เทียบราคา สั่งซื้อ':'Compare prices, order',
  'รับของ จ่ายของ':'Receive and issue materials','ติดตั้ง รายงานความคืบหน้า':'Install, report progress','วางบิล รับเงิน จ่ายเงิน':'Bill, collect, pay','ทดสอบ แก้งาน ส่งมอบ':'Test, fix, hand over','สัญญา PM/MA งานซ่อม':'PM/MA contracts, repairs',
  'บันทึกลูกค้าและผู้ติดต่อ':'Record customers and contacts','ติดตามงานที่กำลังเสนอ ขั้นการขาย โอกาสได้งาน':'Follow open deals, sales stage, win chance','ส่งใบเสนอราคาให้ลูกค้า ต่อรอง แล้วกด “ได้งาน → สร้างโครงการ”':'Send the quotation, negotiate, then press “Won → create project”',
  'คำนวณและถอด BOQ ในโปรแกรม PENUM MEP':'Calculate and take off the BOQ in PENUM MEP','ทำใบเสนอราคา ดึง BOQ จาก PENUM MEP หรือพิมพ์เอง':'Make the quotation from the PENUM MEP BOQ or type it','ผู้บริหารอนุมัติราคาที่กำไรต่ำกว่าเป้า':'Management approves prices below the profit target',
  'ตรวจข้อมูลโครงการ BOQ และงวดเงิน':'Check project details, BOQ and payment plan','สร้างแผนงาน Gantt (ปุ่ม “สร้างแผนตั้งต้นจาก BOQ”)':'Build the Gantt plan (button “Starting plan from BOQ”)','ส่งเอกสารขออนุมัติ Shop Drawing วัสดุ':'Submit shop drawings and materials for approval','เปิดใบขอซื้อจากรายการ BOQ':'Raise purchase requests from the BOQ',
  'ใส่ราคาผู้ขายหลายเจ้าในใบขอซื้อ แล้วเทียบ':'Enter several suppliers’ prices on the request and compare','กด “เลือกและออก PO” ที่ผู้ขายที่ต้องการ':'Press “Choose and issue PO” for the chosen supplier','ติดตามใบสั่งซื้อและวันส่งของ':'Follow purchase orders and delivery dates',
  'บันทึกรับของเข้าตาม PO (ปุ่ม “รับครบทุกรายการวันนี้”)':'Record goods received against the PO (button “Receive all today”)','คลังวัสดุหน้างาน ยอดคงเหลือ':'Site store and balances','จ่ายของตามใบขอเบิกของช่าง':'Issue materials on technicians’ requests',
  'รายงานประจำวัน คน งาน รูปถ่าย':'Daily report: crew, work, photos','RFI ถามผู้ออกแบบ และงานเพิ่มลด (VO)':'RFIs to the designer and variations (VO)','ใบอนุญาตทำงานและตรวจความปลอดภัย':'Work permits and safety checks','อัปเดต % งานในแผนงาน':'Update task % in the plan',
  'ทำใบเบิกงวดตามผลงาน (ผู้บริหารอนุมัติ)':'Make the progress claim (management approves)','ใบวางบิลส่งลูกค้า':'Billing note to the customer','ติดตามเงินรับ (ลูกหนี้)':'Follow money due in (receivables)','จ่ายผู้ขายตาม PO (เจ้าหนี้)':'Pay suppliers by PO (payables)',
  'ทดสอบระบบ (T&C) และปรับสมดุลลม/น้ำ (TAB)':'Testing (T&C) and air/water balancing (TAB)','Punch list งานที่ต้องแก้':'Punch list of items to fix','เอกสาร O&M และประกันผลงาน':'O&M documents and warranty',
  'ทำสัญญาบำรุงรักษา (PM/MA)':'Make a maintenance contract (PM/MA)','งานซ่อมและนัด PM':'Repairs and PM visits','ทะเบียนเครื่องและประวัติซ่อม':'Equipment register and repair history',
  'เปิดงานใน “งานที่กำลังติดตาม” แล้วส่งแบบและความต้องการลูกค้าให้ประมาณราคา':'Open the deal in “Sales pipeline”, then pass the drawings and the customer’s needs to Estimating','ข้อมูลลูกค้า แบบ และขอบเขตงาน':'Customer details, drawings and scope',
  'ขายส่งใบเสนอราคา ลูกค้าตกลง แล้วกด “ได้งาน → สร้างโครงการ” ในใบเสนอราคา':'Sales sends the quotation; when the customer agrees press “Won → create project” on it','โปรแกรมเปิดโครงการให้เอง พร้อม BOQ และมูลค่าสัญญา':'PM opens the project by itself, with the BOQ and contract value',
  'เลือกรายการวัสดุ BOQ แล้วกด “สร้างใบขอซื้อจากรายการที่เลือก” (หัวหน้าโครงการอนุมัติ)':'Tick BOQ materials and press “Create PR from selected” (project head approves)','ใบขอซื้อ (PR) ที่อนุมัติแล้ว':'Approved purchase requests (PR)',
  'ออก PO ส่งผู้ขาย':'Issue the PO to the supplier','PO และวันส่งของให้สโตร์รอรับ ยอดที่ต้องจ่ายไปที่บัญชี':'POs and delivery dates for the store; amounts to pay go to Accounts',
  'รับของครบตาม PO และจ่ายของให้หน้างาน':'All goods received and issued to site','วัสดุถึงมือช่างที่หน้างาน':'Materials in the technicians’ hands on site',
  'อัปเดต % งานจนถึงงวด แล้วทำใบเบิกงวด':'Update work % up to the milestone, then make the progress claim','ผลงานที่ทำได้ ใช้วัดเงินงวด':'Work done, measured for the claim',
  'รับเงินแล้วเปลี่ยนใบเบิกงวดเป็น “รับเงินแล้ว” ทำทุกงวดจนครบ':'When paid, set the claim to “Paid”; repeat every milestone','งวดสุดท้ายเมื่อส่งมอบ แล้วคืนเงินประกันผลงาน':'The last claim at handover, then retention is released',
  'ใส่วันส่งมอบในข้อมูลโครงการ แล้วเบิกงวดสุดท้าย':'Enter the handover date in project details, then claim the last milestone','ทะเบียนเครื่องและประกันให้บริการหลังการขาย':'Equipment register and warranty for After-sales',
  'ลูกค้าอยากได้งานเพิ่ม ส่งเรื่องกลับให้ขาย':'The customer wants more work: pass it back to Sales','งานใหม่จากลูกค้าเดิม (วนกลับไปที่ขาย)':'New work from an existing customer (back to Sales)',
  'พิมพ์ผัง A4':'Print A4 map','ดูแบบตารางทุกฝ่าย':'Table of all departments','ทำอะไรในโปรแกรม':'What to do in PM','กดเพื่อไปที่หน้านั้น':'press to open the page','รับงานมาจาก':'Receives work from','ทำเสร็จเมื่อ':'Done when','ส่งต่อให้':'Hands over to',
  'ฝ่ายของคุณ':'Your department','ตอนนี้ไม่มีงานค้างที่ขั้นนี้':'Nothing waits at this step now','ขั้นตอนงานของบริษัท':'Company workflow','งานที่รอฝ่ายของคุณ':'Waiting for your department','ไปหน้านั้น':'Go to page','ดูผัง':'See map','เลยกำหนด':'Overdue','ต้องดู':'Check',
  'งานหนึ่งงานเดินจากซ้ายไปขวา กดกล่องเพื่อดูว่าฝ่ายนั้นทำอะไรในโปรแกรม ทำเสร็จแล้วส่งต่อให้ใคร · ตัวเลขสีแดง = งานที่รอฝ่ายนั้นอยู่ตอนนี้':'A job moves from left to right. Press a box to see what that department does in PM and who it hands over to · red number = items waiting there now',
  'ตัวเลขสีแดง = งานที่รอฝ่ายนั้นอยู่ กดกล่องเพื่อดูว่าฝ่ายนั้นทำอะไร และส่งต่อให้ใคร':'Red number = items waiting at that department. Press a box to see what it does and who it hands over to',
  'แสดงแถบ “ขั้นที่ … ส่งต่อ …” บนหน้าของแต่ละฝ่าย และกล่อง “ขั้นต่อไป” หลังทำงานเสร็จ':'Show the “Step … hands over to …” bar on each department’s pages and the “Next step” box after a hand-over','ซ่อนแถบนี้':'Hide this bar','งานที่รออยู่ตอนนี้':'Waiting now','ขั้นที่':'Step','ขั้นต่อไป:':'Next step:',
  'ส่งแล้ว รอลูกค้าตอบ':'sent, waiting for the customer','กำลังต่อรอง':'negotiating','ยังไม่มีใบเสนอราคา':'no quotation yet','ร่าง ยังไม่ได้ส่ง':'draft, not sent','ได้งานแล้ว ยังไม่เปิดโครงการ':'won, project not opened',
  'มี BOQ แล้ว ยังไม่มีแผนงาน':'BOQ in, no plan yet','มีแผนงานแล้ว ยังไม่ได้เปิดใบขอซื้อ':'planned, no purchase request yet','รอเทียบราคาและออก PO':'compare prices and issue a PO','อนุมัติแล้ว รอจ่ายของ':'approved, to issue','RFI รอคำตอบ':'RFI awaiting answer',
  'ช่างขอเบิกของ รออนุมัติ':'material request awaiting approval','ใบเบิกงวดร่าง รอส่งเบิก':'draft claim, not sent','รอรับเงิน':'awaiting payment','ครบกำหนดจ่ายผู้ขาย':'supplier payment due','Punch รอแก้':'punch item to fix',
  'งานเสร็จครบแล้ว ยังไม่ใส่วันส่งมอบ':'all work done, no handover date','นัด PM':'PM visit','งานซ่อม':'repair','ส่งมอบแล้ว ยังไม่มีสัญญาบำรุงรักษา เสนอ PM/MA ได้':'handed over, no maintenance contract: offer PM/MA','รับงานจาก':'From','· ทำเสร็จเมื่อ':'· done when','· ส่งต่อ':'· hands over to'};
  for(const k in W)if(!(k in X))X[k]=W[k];WF.forEach(s=>{if(!((s.n+' →') in X))X[s.n+' →']=(X[s.n]||s.n)+' →'})}
