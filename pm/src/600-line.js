/* ---------- 3.13: LINE notifications ----------
   LINE Notify was shut down in 2025, and the LINE Messaging API needs a server, which this app does not have.
   So messages are written here and handed to LINE's own share page (line.me/R/share): LINE opens with the text
   ready and the user picks the group or person. The text is also copied, so it can be pasted if LINE does not open.
   - a daily summary: overdue and due-soon items (the same list as the home page) and tomorrow's work and deliveries
   - a reminder card on the home page once a day until the summary is sent or skipped (remembered on this device)
   - a "LINE" button beside the print button of a daily report, RFI, PO, WIR and NCR
   - settings under ตั้งค่าบริษัท, and a LINE group name per project to show who it is meant for */
const lnCfg=()=>Object.assign({daily:true,lvl:'all',tmr:true,grp:''},DB.co.line||{});
const lnLS=k=>{try{return localStorage.getItem(k)}catch(e){return null}};
const lnSet=(k,v)=>{try{localStorage.setItem(k,v)}catch(e){}};
const lnDone=()=>lnLS('pmLnDay')===today();
const lnClean=s=>String(s||'').replace(/\s+/g,' ').trim();
const lnDayT=d=>d===addD(today(),1)?`พรุ่งนี้ ${thDL(d)}`:`วัน${['อาทิตย์','จันทร์','อังคาร','พุธ','พฤหัสบดี','ศุกร์','เสาร์'][pd(d).getDay()]} ${thDL(d)}`;
function lnTmr(){let d=addD(today(),1);if(isSun(d))d=addD(d,1);return d}
function lnWork(p,d){return withP(p,()=>{const L=[];if(P.tasks.length){const s=sched();
    P.tasks.forEach(t=>{const r=s.R[t.id];if(!r||n(t.pct)>=100)return;if(durOf(t)>0?onD(r,d):r.es===d){const c=crewTxt(t);L.push(`• ${lnClean(t.name)}${c?' · '+c:''}${t.who?' · '+lnClean(t.who):''}`)}})}
  (P.pos||[]).forEach(po=>{if(po.due===d&&poState(po).k!=='ok')L.push(`• 🚚 ของเข้า ${po.no} ${vName(po.vid)}`)});return L})}
function lnDigest(p){const C=CO(),td=today(),cfg=lnCfg();
  const A=alerts().filter(a=>!p||a.p&&a.p.id===p.id).filter(a=>cfg.lvl!=='bad'||a.lv==='bad');
  const grp=p?(p.info.lineGrp||'').trim():(cfg.grp||'').trim();
  const L=[`📋 สรุปงาน${p?' โครงการ '+p.name:' '+(C.name||'บริษัท')}`,`ประจำวันที่ ${thDL(td)}`];
  const sec=(ic,t,arr,max=12)=>{if(!arr.length)return;L.push('',`${ic} ${t} ${arr.length} รายการ`);
    const X=arr.slice(0,max),G=[];X.forEach(a=>{const k=p?'':a.p?a.p.name:'บริษัท';let g=G.find(x=>x.k===k);if(!g)G.push(g={k,L:[]});g.L.push(a)});
    G.forEach(g=>{if(g.k)L.push(`[${g.k}]`);g.L.forEach(a=>L.push(`• ${a.kind}: ${lnClean(a.txt)}${a.due?` · ${thD(a.due)}`:''}`))});
    if(arr.length>max)L.push(`  และอีก ${arr.length-max} รายการ ดูใน PENUM PM`)};
  sec('🔴','เรื่องด่วน',A.filter(a=>a.lv==='bad'));sec('🟡','ใกล้ถึงกำหนด',A.filter(a=>a.lv!=='bad'));
  if(!A.length)L.push('','✅ ไม่มีเรื่องเกินกำหนดหรือใกล้ถึงกำหนด');
  if(cfg.tmr){const d=lnTmr(),W=[];(p?[p]:projects()).forEach(q=>{const x=lnWork(q,d);if(!x.length)return;if(!p)W.push(`[${q.name}]`);W.push(...x.slice(0,15));if(x.length>15)W.push(`  และอีก ${x.length-15} งาน`)});
    if(W.length)L.push('',`🛠 งาน${lnDayT(d)}`,...W)}
  return {txt:L.join('\n')+'\n\n— ส่งจาก PENUM PM',grp,day:1}}
// tomorrow's work for one project: for the foremen's group
function lnPlan(p){const d=lnTmr(),W=lnWork(p,d);
  return {txt:[`🛠 แผนงาน${lnDayT(d)}`,`โครงการ ${p.name}`,'',...(W.length?W:['ไม่มีงานในแผน'])].join('\n')+'\n\n— ส่งจาก PENUM PM',grp:(p.info.lineGrp||'').trim()}}
const WEAT=k=>(WEA.find(x=>x[0]===k)||WEA[0])[1];
const LDOC={
  daily:id=>{const d=P.daily.find(x=>x.id===id);if(!d)return '';const M=(d.men||[]).filter(m=>n(m.n));
    return [`📝 รายงานประจำวัน ${thDL(d.date)}`,`โครงการ ${P.name}`,`อากาศ เช้า ${WEAT(d.wam)} · บ่าย ${WEAT(d.wpm)}`,
      `👷 คนงาน ${sum(M,m=>m.n)} คน${M.length?': '+M.map(m=>`${m.trade} ${n(m.n)}`).join(', '):''}`,
      d.work?`\n✅ งานที่ทำ\n${d.work.trim()}`:'',d.plan?`\n📅 แผนพรุ่งนี้\n${d.plan.trim()}`:'',d.issue?`\n⚠️ ปัญหา/อุปสรรค\n${d.issue.trim()}`:'',
      `\n🦺 ${d.safety||'-'}`,(d.photos||[]).length?`📷 รูป ${d.photos.length} รูป (ส่งรูปแยกในกลุ่ม)`:'',d.by?`ผู้รายงาน ${d.by}`:''].filter(Boolean).join('\n')},
  rfi:id=>{const r=P.rfis.find(x=>x.id===id);if(!r)return '';
    return [`❓ RFI ${r.no} ${lnClean(r.subject)}`,`โครงการ ${P.name}`,`ถึง ${r.to||'-'}`,'',(r.q||'').trim(),'',`ขอคำตอบภายใน ${thDL(r.due)}`,r.ans?`\nคำตอบ (${thD(r.ansDate)}): ${r.ans.trim()}`:''].filter(x=>x!=='').join('\n')},
  po:id=>{const p=P.pos.find(x=>x.id===id);if(!p)return '';const v=P.vendors.find(x=>x.id===p.vid)||{},T=poTotal(p);
    return [`🧾 ใบสั่งซื้อ ${p.no} ลงวันที่ ${thD(p.date)}`,`ถึง ${v.name||'-'}`,`โครงการ ${P.name}`,'',...p.items.map((l,i)=>`${i+1}. ${lnClean(l.desc)} ${fmtq(l.q)} ${l.unit||''}`),'',
      `ยอดรวม ${fmt(T.t,2)} บาท${T.v?' (รวม VAT)':''}`,`กำหนดส่ง ${thDL(p.due)}`,`สถานที่ส่ง ${p.ship||P.info.site||'-'}`,P.info.pm?`ติดต่อ ${P.info.pm}`:'',`\n${CO().name||''}`].filter(x=>x!=='').join('\n')},
  wir:id=>{const w=(P.wir||[]).find(x=>x.id===id);if(!w)return '';
    return [`🔍 ขอตรวจงาน ${w.no}`,`โครงการ ${P.name}`,`วันที่ตรวจ ${thDL(w.insp)}${w.time?' เวลา '+w.time+' น.':''}`,w.loc?`ตำแหน่ง ${w.loc}`:'',w.desc?`งาน ${w.desc.trim()}`:'',w.by?`ผู้ขอตรวจ ${w.by}`:''].filter(Boolean).join('\n')},
  ncr:id=>{const r=(P.ncr||[]).find(x=>x.id===id);if(!r)return '';const st=(NST.find(x=>x[0]===r.status)||NST[0])[1],sv=(NSEV.find(x=>x[0]===r.sev)||NSEV[0])[1];
    return [`🚩 NCR ${r.no} (${sv})`,`โครงการ ${P.name}`,r.loc?`ตำแหน่ง ${r.loc}`:'',r.desc?`\n${r.desc.trim()}`:'',r.corr?`\nการแก้ไข: ${r.corr.trim()}`:'',r.who?`ผู้รับผิดชอบ ${r.who}`:'',`แก้ไขให้เสร็จภายใน ${thDL(r.due)}`,`สถานะ ${st}`].filter(Boolean).join('\n')}};
function lnBox(title,o){S.lnDay=!!o.day;
  dialog(title,`${o.grp?`<p class="hint" style="margin:0 0 6px">ส่งเข้ากลุ่ม LINE: <b>${esc(o.grp)}</b></p>`:''}
    <textarea id="lnTxt" rows="14" style="width:100%;font:inherit;font-size:14px">${esc(o.txt)}</textarea>
    <p class="hint">แก้ข้อความได้ก่อนส่ง กด <b>เปิด LINE</b> แล้วเลือกกลุ่มหรือคนที่จะส่ง (ข้อความถูกคัดลอกไว้ให้ด้วย ถ้า LINE ไม่เปิด ให้ไปวางในกลุ่มได้เลย) บนคอมต้องมีโปรแกรม LINE หรือเข้าสู่ระบบ LINE ในเบราว์เซอร์</p>`,
    `<button type="button" class="btn pri ln" data-a="lnGo">เปิด LINE</button><button type="button" class="btn" data-a="lnCopy">คัดลอกข้อความ</button>`)}
const lnTxt=()=>{const t=$('#lnTxt');return t?t.value:''};
const lnSent=()=>{if(S.lnDay){lnSet('pmLnDay',today());S.lnDay=false;rerender()}};
ACT.lnGo=async()=>{const t=lnTxt();if(!t.trim())return;await copyText(t);window.open('https://line.me/R/share?text='+encodeURIComponent(t),'_blank','noopener');lnSent()};
ACT.lnCopy=async()=>{const t=lnTxt();toast(await copyText(t)?'คัดลอกแล้ว ไปวางในกลุ่ม LINE ได้เลย':'คัดลอกไม่ได้ เลือกข้อความแล้วคัดลอกเอง');lnSent()};
ACT.lnDig=b=>{const p=b.dataset.s==='pj'?P:null;lnBox(p?'ส่งสรุปโครงการเข้า LINE':'ส่งสรุปงานวันนี้เข้า LINE',lnDigest(p))};
ACT.lnPlan=()=>lnBox('ส่งแผนงานพรุ่งนี้เข้า LINE',lnPlan(P));
ACT.lnDoc=b=>{const f=LDOC[b.dataset.k],t=f&&f(b.dataset.id);if(!t){toast('ไม่พบเอกสาร');return}lnBox('ส่งเข้า LINE',{txt:t,grp:(P.info.lineGrp||'').trim()})};
ACT.lnSkip=()=>{lnSet('pmLnDay',today());render()};
const lnBtn=(s,l='ส่งเข้า LINE')=>`<button type="button" class="btn sm ln" data-a="lnDig" data-s="${s}">${l}</button>`;
// alert cards get a send button
{const f=alertCard;alertCard=function(list,title){const h=f(list,title);if(!h)return h;const s=title==='ต้องดูในโครงการนี้'?'pj':'co';
  return h.replace('</small></h2>',`</small><span class="sp"></span>${lnBtn(s)}</h2>`)}}
// once a day on the home page, until it is sent or skipped
{const f=CVIEWS.exec;CVIEWS.exec=()=>{const h=f(),c=lnCfg();if(!c.daily||lnDone()||dbEmpty())return h;
  const A=alerts(),W=c.tmr?projects().reduce((k,q)=>k+lnWork(q,lnTmr()).length,0):0;if(!A.length&&!W)return h;
  const card=`<section class="card ln-c"><h2><span>💬 ส่งสรุปงานวันนี้เข้ากลุ่ม LINE</span><small>${A.filter(a=>a.lv==='bad').length} เรื่องด่วน · ${A.filter(a=>a.lv!=='bad').length} ใกล้ถึงกำหนด${W?` · งานพรุ่งนี้ ${W} งาน`:''}</small></h2>
    <div class="row">${lnBtn('co','ดูข้อความและส่ง')}<button type="button" class="btn sm" data-a="lnSkip">วันนี้ไม่ส่ง</button><span class="hint" style="margin:0">ปิดการเตือนนี้ได้ที่ ตั้งค่าบริษัท › แจ้งเตือนผ่าน LINE</span></div></section>`;
  const i=h.indexOf('<section');return i<0?card+h:h.slice(0,i)+card+h.slice(i)}}
// look-ahead: tomorrow's work for the site group
{const f=laView;laView=function(){const h=f.apply(this,arguments);return h.replace('</h2>',`<span class="sp"></span><button type="button" class="btn sm ln" data-a="lnPlan">ส่งงานพรุ่งนี้เข้า LINE</button></h2>`)}}
// a LINE button beside each print button for documents that read well as a message
{const r=render;render=function(){const x=r.apply(this,arguments);
  document.querySelectorAll('#view [data-a="print"][data-id]').forEach(b=>{const k=b.dataset.k;if(!LDOC[k]||S.mode==='co')return;const nx=b.nextElementSibling;if(nx&&nx.dataset.a==='lnDoc')return;
    b.insertAdjacentHTML('afterend',`<button type="button" class="btn sm ln" data-a="lnDoc" data-k="${k}" data-id="${esc(b.dataset.id)}" title="ส่งเข้า LINE">LINE</button>`)});return x}}
{const f=CVIEWS.coset;CVIEWS.coset=()=>{if(!DB.co.line)DB.co.line=lnCfg();const c=DB.co.line;
  return f()+`<section class="card"><h2><span>แจ้งเตือนผ่าน LINE</span><small>ส่งสรุปงานประจำวันและเอกสารเข้ากลุ่ม LINE</small></h2>
  <div class="form"><label class="full"><span><input type="checkbox" data-t="chk" data-p="co.line.daily"${c.daily?' checked':''}> เตือนที่หน้าแรกทุกวัน ให้ส่งสรุปงานเข้ากลุ่ม LINE</span></label>
  <label class="full"><span><input type="checkbox" data-t="chk" data-p="co.line.tmr"${c.tmr?' checked':''}> ใส่งานและของที่จะเข้าหน้างานพรุ่งนี้ในสรุปด้วย</span></label>
  <label>เรื่องที่จะส่ง<select data-p="co.line.lvl"><option value="all"${c.lvl!=='bad'?' selected':''}>เรื่องด่วนและใกล้ถึงกำหนด</option><option value="bad"${c.lvl==='bad'?' selected':''}>เฉพาะเรื่องด่วน (เกินกำหนด)</option></select></label>
  <label class="w2">ชื่อกลุ่ม LINE ของบริษัท<input data-p="co.line.grp" value="${esc(c.grp||'')}" placeholder="เช่น ผู้บริหาร ORIEN"></label></div>
  <p class="hint">LINE ไม่เปิดให้โปรแกรมส่งข้อความเข้ากลุ่มเองโดยไม่มีเซิร์ฟเวอร์ (LINE Notify ปิดไปแล้ว) PENUM PM จึงเตรียมข้อความให้ แล้วเปิด LINE ให้เลือกกลุ่มส่ง ใช้ได้ทั้งมือถือและคอม ปุ่ม LINE อยู่ที่การ์ด "ต้องดูวันนี้" แผน 3 สัปดาห์ และข้างปุ่มพิมพ์ของรายงานประจำวัน RFI ใบสั่งซื้อ WIR และ NCR ชื่อกลุ่มของแต่ละโครงการใส่ได้ที่ ข้อมูลโครงการ</p></section>`.replace('ORIEN',genericCo()?'บริษัท':'ORIEN')}}
{const f=VIEWS.setup;VIEWS.setup=()=>f()+`<section class="card"><h2><span>กลุ่ม LINE ของโครงการ</span><small>แสดงในหน้าส่งข้อความ ให้รู้ว่าควรส่งเข้ากลุ่มไหน</small></h2><div class="form"><label class="w2">ชื่อกลุ่ม LINE<input data-p="info.lineGrp" value="${esc(P.info.lineGrp||'')}" placeholder="เช่น หน้างาน ${esc(P.name)}"></label>
  <div class="row" style="align-self:end">${lnBtn('pj','ส่งสรุปโครงการเข้า LINE')}<button type="button" class="btn sm ln" data-a="lnPlan">ส่งงานพรุ่งนี้</button></div></div></section>`}
SBKW['co.coset']=(SBKW['co.coset']||'')+' line ไลน์ แจ้งเตือน ส่งสรุป';
document.head.insertAdjacentHTML('beforeend',`<style>
.btn.ln{color:#06a54a;border-color:#06c75566}.btn.ln:hover{background:#06c75514}.btn.pri.ln{background:#06c755;border-color:#06c755;color:#fff}
.ln-c{border-color:#06c75566}
</style>`);
