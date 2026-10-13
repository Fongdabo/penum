/* ---------- round 3.2: professional skill allowance (ค่าชำนาญวิชาชีพ) with level tests L1–L4 ----------
   A level is granted when three things hold: the latest approved skill assessment reaches the level's
   pass rate, the written test for that level is passed, and every practical item is passed in front of
   an assessor. The level pays a monthly allowance until it expires and is re-tested. */
const addMo=(s,k)=>{const d=pd(s);d.setMonth(d.getMonth()+k);return iso(d)};
DOC_EN.push([/ผลสอบวัดระดับ/,'PROFESSIONAL LEVEL TEST']);
// assumed figures until the company table arrives; every number is editable in the app
// levels follow the company policy HR-SK-06 (ALWPOL); [level, meaning, unused, skill %, written %, months at the level below, practical items needed (0 = all)]
const PROF0=[['L1','พื้นฐาน · รู้หลักการ ทำงานประจำได้โดยมีคนดูแล',0,60,70,0,1],['L2','ชำนาญ · ทำงานของตำแหน่งได้เองครบถ้วนถูกต้อง',0,80,75,12,0],['L3','ชำนาญพิเศษ · แก้งานซับซ้อนได้ และตรวจงานคนอื่นได้',0,100,80,12,0],['L4','เชี่ยวชาญ · กำหนดวิธีทำงาน ตัดสินกรณียาก และสอนคนอื่นได้',0,100,80,24,0]];
const RATE0={G1:[500,1000,1500,2000],G2:[800,1500,2500,3500],G3:[1000,2000,3000,4500],G4:[1500,3000,4500,6000],G5:[2000,3500,5000,7000],G6:[2500,4000,6000,8000],G7:[0,0,0,0],G8:[0,0,0,0]};
// [dept or 'all', level, question, [choices], index of the right one]
const TB0=[['all','L1','ก่อนเริ่มงานบนที่สูงเกิน 2 เมตร ต้องทำสิ่งใดก่อน',['สวมเข็มขัดนิรภัยแบบเต็มตัวและยึดกับจุดที่มั่นคง','ทำงานให้เสร็จเร็วที่สุด','ให้เพื่อนจับบันไดไว้อย่างเดียว','ไม่ต้องทำอะไรถ้าทำงานไม่นาน'],0],
 ['all','L1','เมื่อพบสายไฟชำรุดหน้างาน ควรทำอย่างไร',['พันเทปแล้วใช้ต่อ','แจ้งหัวหน้า ตัดไฟ และติดป้ายห้ามใช้','ไม่ต้องสนใจถ้ายังใช้ได้','ย้ายไปไว้ที่อื่น'],1],
 ['all','L1','ใบอนุญาตทำงาน (Work Permit) ใช้กับงานประเภทใด',['งานเอกสาร','งานเสี่ยง เช่น งานร้อน งานที่สูง งานในที่อับอากาศ','งานประชุม','งานทำความสะอาดทั่วไป'],1],
 ['all','L1','ส่งงานต่อให้ฝ่ายถัดไปตามผังขั้นตอน ควรทำอย่างไร',['บอกด้วยปากอย่างเดียว','บันทึกในระบบหรือเอกสาร พร้อมสิ่งที่ค้างให้ชัด','รอให้เขามาถามเอง','ส่งเมื่อมีเวลาว่าง'],1],
 ['PRJ','L1','ก่อนเชื่อมท่อน้ำยาทองแดง ควรพ่นก๊าซใดในท่อเพื่อกันเขม่า',['ออกซิเจน','ไนโตรเจน','อะเซทิลีน','อากาศอัด'],1],
 ['PRJ','L1','การทำสุญญากาศระบบแอร์ ควรลดความดันให้ต่ำกว่าประมาณเท่าใด',['5,000 micron','500 micron','50 psi','1 bar'],1],
 ['PRJ','L2','ทดสอบแรงดันท่อน้ำยาด้วยไนโตรเจนตามแนวปฏิบัติทั่วไป ใช้แรงดันและเวลาเท่าใด',['100 psi 10 นาที','600 psi คงที่ 24 ชั่วโมง','50 psi 1 ชั่วโมง','ไม่ต้องทดสอบ'],1],
 ['PRJ','L2','ค่าความเป็นฉนวนของสายไฟฟ้าที่ยอมรับได้ทั่วไปคือ',['ไม่น้อยกว่า 1 MΩ','ไม่เกิน 1 Ω','ไม่น้อยกว่า 1 kΩ','ไม่ต้องวัด'],0],
 ['PRJ','L2','ความต่างอุณหภูมิลมจ่ายกับลมกลับของแอร์ที่ทำงานปกติ อยู่ในช่วงใด',['1–3 °C','8–12 °C','20–25 °C','30 °C ขึ้นไป'],1],
 ['PRJ','L2','ท่อน้ำทิ้งแอร์ควรมีความลาดเอียงอย่างน้อยเท่าใด',['ไม่ต้องลาด','ประมาณ 1:100','10:1','เอียงขึ้นทางเครื่อง'],1],
 ['PRJ','L3','ทดสอบแรงดันท่อน้ำเย็น (Hydrostatic) ทั่วไปใช้แรงดันเท่าใด',['เท่ากับแรงดันใช้งาน','1.5 เท่าของแรงดันใช้งาน ค้าง 2 ชั่วโมง','0.5 เท่า','10 เท่า'],1],
 ['PRJ','L3','เมื่อ WIR ไม่ผ่าน ขั้นตอนที่ถูกต้องคือ',['ทำงานต่อไปก่อน','เปิด NCR หาสาเหตุ แก้ไข แล้วขอตรวจใหม่','ลบ WIR ทิ้ง','รอให้ที่ปรึกษาลืม'],1],
 ['PRJ','L3','ลำดับงานที่ถูกต้องก่อนปิดฝ้า',['ปิดฝ้าแล้วค่อยทดสอบ','ทดสอบแรงดัน ตรวจฉนวน ขอ WIR ผ่าน แล้วจึงปิดฝ้า','ไม่ต้องตรวจ','ให้ช่างฝ้าตัดสินใจ'],1],
 ['SVC','L1','ล้างแอร์ตามรอบ PM ต้องตรวจสิ่งใดก่อนเปิดเครื่องกลับ',['ท่อน้ำทิ้งไหลสะดวกและไม่มีน้ำรั่ว','สีของตัวเครื่อง','ยี่ห้อรีโมท','ไม่ต้องตรวจ'],0],
 ['SVC','L2','แอร์ไม่เย็น คอมเพรสเซอร์ทำงาน แต่แรงดันด้านดูดต่ำมาก สาเหตุที่เป็นไปได้มากคือ',['น้ำยารั่วหรือน้ำยาขาด','ไฟเกิน','รีโมทเสีย','ฝ้าเพดานต่ำ'],0],
 ['SVC','L3','ก่อนเติมน้ำยาเพิ่มให้ลูกค้า ควรทำอะไรก่อน',['เติมไปก่อน','หาจุดรั่วและซ่อมก่อน แล้วชั่งน้ำหนักเติม','ไม่ต้องบอกลูกค้า','เปลี่ยนเครื่องใหม่ทันที'],1]];
// practical items: [dept or 'all', level, item]
const PR0=[['all','L1','แต่งกายและใช้อุปกรณ์ป้องกันส่วนบุคคลถูกต้อง'],['PRJ','L1','บานและต่อท่อทองแดงโดยไม่รั่ว'],['PRJ','L2','อัดแรงดัน ทำสุญญากาศ และเติมน้ำยาตามน้ำหนักได้ครบขั้นตอน'],['PRJ','L2','วัดกระแสและค่าความเป็นฉนวนพร้อมบันทึกผล'],
  ['PRJ','L3','วางแผนงานประจำวันของทีมและตรวจงานก่อนขอ WIR'],['PRJ','L4','สอนช่างใหม่จนผ่านงานปฏิบัติ L1'],['SVC','L1','ล้างแอร์ครบขั้นตอนและทดสอบเดินเครื่อง'],['SVC','L2','หาสาเหตุอาการแอร์ไม่เย็นและอธิบายลูกค้าได้'],['SVC','L3','ซ่อมรอยรั่ว ทดสอบ และส่งรายงานบริการ']];
function profCfg(){const C=CO();if(!C.prof)C.prof={ver:2,rates:JSON.parse(JSON.stringify(typeof ALWPOL!=='undefined'?ALWPOL.rates:RATE0)),lv:PROF0.map(([lv,n_,amt,ska,test,mon,prn])=>({id:uid(),lv,n:n_,ska,test,mon,prn,valid:0})),
  tb:TB0.map(([d,lv,q,ch,a])=>({id:uid(),d,lv,q,c1:ch[0],c2:ch[1],c3:ch[2],c4:ch[3],a:String(a+1)})),pr:PR0.map(([d,lv,t])=>({id:uid(),d,lv,t})),qn:10};
  const P_=C.prof;
  // data saved before the company policy: move to its levels and grade rates, keep any questions already written
  if(P_.ver!==2){P_.ver=2;P_.rates=P_.rates||JSON.parse(JSON.stringify(typeof ALWPOL!=='undefined'?ALWPOL.rates:RATE0));PROF0.forEach(([lv,n_,,ska,test,mon,prn])=>{const r=P_.lv.find(x=>x.lv===lv);if(r)Object.assign(r,{n:n_,ska,test,mon,prn,valid:0})})}
  C.ptest=C.ptest||[];return P_}
const LVS=()=>profCfg().lv.map(x=>x.lv);
const lvRow=lv=>profCfg().lv.find(x=>x.lv===lv);
// the level a person holds now (expired levels do not pay)
const profNow=s=>{const p=s.prof;if(!p||!p.lv)return null;return okD(p.exp)&&p.exp<today()?Object.assign({expired:true},p):p};
// monthly rate for a level at the person's salary grade (G7–G8 are paid inside their package)
const lvRate=(s,lv)=>{const R=(profCfg().rates||RATE0)[gradeOf(s)]||[],i=LVS().indexOf(lv);return i<0?0:n(R[i])};
const profSusp=(s,m)=>{const p=s.prof||{};if(!okD(p.susp))return false;const d=m?m+'-15':today();return d<=p.susp};
// pay starts the month after approval; m is the payroll month (yyyy-mm)
const profAmt=(s,m)=>{const p=profNow(s);if(!p||p.expired||profSusp(s,m))return 0;if(m&&okD(p.since)&&ym(p.since)>=m)return 0;return lvRate(s,p.lv)};
const nextLv=s=>{const L=LVS(),p=profNow(s);if(!p||p.expired)return p&&p.expired?p.lv:L[0];const i=L.indexOf(p.lv);return L[i+1]||null};
const lastSka=s=>(CO().ska||[]).filter(e=>e.staff===s.id&&e.status==='ok').sort((a,b)=>(b.okDate||b.date).localeCompare(a.okDate||a.date))[0]||null;
const inDept=(x,s)=>(x.d==='all'||x.d===s.dept)&&(!x.role||x.role===s.role);
function ptCalc(t){const P_=profCfg(),qs=(t.qs||[]).map(id=>P_.tb.find(q=>q.id===id)).filter(Boolean),ans=t.ans||{},right=qs.filter(q=>String(ans[q.id]||'')===String(q.a)).length;
  const mc=qs.length?Math.round(right*100/qs.length):0,pr=(t.prs||[]).map(id=>P_.pr.find(x=>x.id===id)).filter(Boolean),pv=t.prv||{};
  const r=lvRow(t.lv)||{},mcOk=t.sub&&mc>=n(r.test),prOk=pr.length?pr.filter(x=>pv[x.id]==='pass').length>=(n(r.prn)?Math.min(n(r.prn),pr.length):pr.length):true,prDone=pr.every(x=>pv[x.id]==='pass'||pv[x.id]==='fail');
  return {qs,right,mc,pr,mcOk,prOk,prDone,pass:mcOk&&prOk&&prDone}}
// why a person can or cannot get the level yet
function profCheck(s,lv){const r=lvRow(lv);if(!r)return {ok:false,why:['ไม่มีระดับนี้ในตาราง']};const why=[],e=lastSka(s),pct=e?skaCalc(e).pct:null;
  if(pct==null)why.push('ยังไม่มีแบบประเมินทักษะที่อนุมัติ');else if(pct<n(r.ska))why.push(`ผลประเมินทักษะ ${pct}% ต้องได้ ${r.ska}%`);
  const t=(CO().ptest||[]).filter(x=>x.staff===s.id&&x.lv===lv&&x.done).sort((a,b)=>(b.date||'').localeCompare(a.date||''))[0];
  if(!t)why.push(`ยังไม่ได้สอบ ${lv}`);else if(!ptCalc(t).pass)why.push(`สอบ ${lv} ยังไม่ผ่าน`);
  const p=profNow(s);if(n(r.mon)&&p&&!p.expired&&p.lv!==lv&&okD(p.since)&&addMo(p.since,n(r.mon))>today())why.push(`ต้องอยู่ระดับเดิมครบ ${r.mon} เดือน (ถึง ${thD(addMo(p.since,n(r.mon)))})`);
  return {ok:!why.length,why,pct,t}}
NEW.ptest=arr=>{const y=thYear(),k=arr.filter(x=>(x.no||'').startsWith(`PT-${y}-`)).length+1;return {no:`PT-${y}-${pad(k,3)}`,date:today(),staff:'',lv:'',qs:[],ans:{},prs:[],prv:{},sub:false,done:false}};
ACT.ptNew=b=>{const P_=profCfg(),s=CO().staff.find(x=>x.id===b.dataset.id),lv=b.dataset.lv||nextLv(s);if(!s||!lv)return;
  const all=P_.tb.filter(q=>q.lv===lv&&inDept(q,s)),own=all.filter(q=>q.role===s.role),pool=(own.length?own:all).slice().sort(()=>Math.random()-.5).slice(0,Math.max(1,n(P_.qn)||10));
  if(pool.length<3&&!confirm(`คลังข้อสอบ ${lv} ของฝ่ายนี้มีแค่ ${pool.length} ข้อ จัดสอบเลยไหม? (เพิ่มข้อสอบได้ที่ “คลังข้อสอบ”)`))return;
  const t=Object.assign({id:uid()},NEW.ptest(CO().ptest),{staff:s.id,lv,qs:pool.map(q=>q.id),prs:(()=>{const a=P_.pr.filter(x=>x.lv===lv&&inDept(x,s)),o=a.filter(x=>x.role===s.role);return (o.length?o:a).map(x=>x.id)})(),by:whoName()});
  CO().ptest.push(t);S.sub.hr='prof';S.sel.pt=t.id;save();render();scrollTo({top:0});toast(`จัดสอบ ${lv} ให้ ${s.name} แล้ว เขาเปิดสอบได้จากมือถือหรือคอมของตัวเอง`)};
ACT.ptSubmit=b=>{const t=CO().ptest.find(x=>x.id===b.dataset.id);if(!t)return;const c=ptCalc(t),miss=c.qs.filter(q=>!(t.ans||{})[q.id]).length;
  if(miss&&!confirm(`ยังไม่ได้ตอบ ${miss} ข้อ ส่งคำตอบเลยไหม?`))return;t.sub=true;t.subAt=new Date().toISOString();save();render();toast(`ส่งคำตอบแล้ว ได้ ${ptCalc(t).mc}%`)};
ACT.ptDone=b=>{const t=CO().ptest.find(x=>x.id===b.dataset.id);if(!t)return;const c=ptCalc(t);if(!t.sub){toast('ผู้สอบยังไม่ได้ส่งคำตอบ');return}if(!c.prDone){toast('ให้ผลงานปฏิบัติให้ครบทุกข้อก่อน');return}
  t.done=true;t.doneBy=whoName();t.doneAt=new Date().toISOString();const s=CO().staff.find(x=>x.id===t.staff);let msg=c.pass?`สอบ ${t.lv} ผ่าน`:`สอบ ${t.lv} ไม่ผ่าน สอบใหม่ได้`;
  if(s&&c.pass){const k=profCheck(s,t.lv);if(k.ok&&canHR()){grantLv(s,t.lv,t.no);msg+=` และได้ระดับ ${t.lv} แล้ว`}else if(!k.ok)msg+=` · ยังขาด: ${k.why.join(', ')}`}
  save();render();toast(msg)};
function grantLv(s,lv,ref){const r=lvRow(lv);s.profLog=s.profLog||[];if(s.prof&&s.prof.lv)s.profLog.push(Object.assign({end:today()},s.prof));
  s.prof={lv,since:today(),exp:n(r.valid)?addMo(today(),n(r.valid)):'',ref,by:whoName()}}
ACT.profGrant=b=>{if(!canHR()){toast('ฝ่ายบุคคลหรือผู้บริหารเป็นผู้ให้ระดับ');return}const s=CO().staff.find(x=>x.id===b.dataset.id),lv=b.dataset.lv;if(!s)return;const k=profCheck(s,lv);
  if(!k.ok&&!confirm(`ยังไม่ครบเงื่อนไข: ${k.why.join(', ')}\nให้ระดับ ${lv} เลยไหม?`))return;grantLv(s,lv,k.t?k.t.no:'');save();render();toast(`${s.name} ได้ระดับ ${lv} ค่าชำนาญ ${fmt(lvRate(s,lv))} บาท/เดือน เริ่มจ่ายเดือนถัดไป`)};

function profTestView(t,mine){const s=CO().staff.find(x=>x.id===t.staff)||{},c=ptCalc(t),b=`co.ptest.${t.id}`,r=lvRow(t.lv)||{},ans=t.ans||{},assessor=canHR()||(me()&&isHead(me())&&me().dept===s.dept&&me().id!==s.id)||!me();
  const qhtml=c.qs.map((q,i)=>`<div class="ptq"><p><b>${i+1}.</b> ${esc(q.q)}</p>${[1,2,3,4].map(k=>q['c'+k]?`<label class="ptc${t.sub&&!mine?String(q.a)===String(k)?' ok':String(ans[q.id])===String(k)?' bad':'':''}"><input type="radio" name="q_${t.id}_${q.id}" value="${k}" data-p="${b}.ans.${q.id}"${String(ans[q.id])===String(k)?' checked':''}${t.sub?' disabled':''}> ${esc(q['c'+k])}</label>`:'').join('')}</div>`).join('');
  return `<section class="card"><h2><span>${esc(t.no)} สอบวัดระดับ ${esc(t.lv)}</span><small>${esc(s.name||'')} · ${esc(s.role||'')} · ผ่านเมื่อได้ ${r.test||'–'}% และงานปฏิบัติผ่าน${n(r.prn)?` ${r.prn} งาน`:'ทุกงาน'}</small><span class="sp"></span>${t.done?pill([['p','ผ่าน'],['f','ไม่ผ่าน']],c.pass?'p':'f',c.pass?'ok':'bad'):t.sub?'<span class="pill warn">ส่งคำตอบแล้ว รอผลงานปฏิบัติ</span>':'<span class="pill">กำลังสอบ</span>'}${!mine?`<button type="button" class="btn sm" data-a="print" data-k="ptest" data-id="${t.id}">พิมพ์ผลสอบ</button>`:''}</h2>
  ${c.qs.length?`<h3 class="fm-g">ข้อเขียน ${c.qs.length} ข้อ${t.sub?` · ได้ ${c.right}/${c.qs.length} = <b>${c.mc}%</b>`:''}</h3>${t.sub||mine||!me()||me().id===s.id?qhtml:'<p class="hint">ผู้สอบทำข้อเขียนจากเครื่องของตัวเอง (บุคคล › สอบวัดระดับ)</p>'}
    ${!t.sub&&(mine||!me())?`<button type="button" class="btn pri" data-a="ptSubmit" data-id="${t.id}">ส่งคำตอบ</button>`:''}`:'<p class="hint">ไม่มีข้อเขียนสำหรับระดับนี้</p>'}
  ${c.pr.length&&!mine?`<h3 class="fm-g">งานปฏิบัติ (ผู้ประเมินให้ผล)</h3><div class="tw"><table><thead><tr><th>งานที่ต้องทำให้ดู</th><th style="width:160px">ผล</th></tr></thead><tbody>${c.pr.map(x=>`<tr><td>${esc(x.t)}</td><td><select data-p="${b}.prv.${x.id}"${t.done||!assessor?' disabled':''} aria-label="ผล"><option value="">–</option><option value="pass"${(t.prv||{})[x.id]==='pass'?' selected':''}>ผ่าน</option><option value="fail"${(t.prv||{})[x.id]==='fail'?' selected':''}>ไม่ผ่าน</option></select></td></tr>`).join('')}</tbody></table></div>`:''}
  ${!mine?`<div class="sigs">${sigBox(b,t,'sigE','ผู้สอบ','')}${sigBox(b,t,'sigA','ผู้ประเมิน','')}</div>${!t.done&&assessor?`<div class="row" style="margin-top:10px"><button type="button" class="btn pri" data-a="ptDone" data-id="${t.id}">สรุปผลสอบ</button></div>`:''}`:''}</section>`}
function hrProf(){const C=CO(),P_=profCfg(),sub=S.sel.profv||'ppl',td=today();
  const tabs=`<div class="row" style="margin-bottom:10px">${[['ppl','พนักงานและระดับ'],['tests','การสอบ'],['bank','คลังข้อสอบ'],['set','ตารางค่าชำนาญ']].map(([k,l])=>`<button type="button" class="btn sm${k===sub?' pri':''}" data-a="profV" data-k="${k}">${l}</button>`).join('')}</div>`;
  const sel=C.ptest.find(x=>x.id===S.sel.pt);
  if(sub==='set'){const cols=[{k:'lv',h:'ระดับ',w:50},{k:'n',h:'ความหมาย',w:300},{k:'ska',h:'ทักษะผ่านเกณฑ์ขั้นต่ำ %',t:'num',w:80},{k:'test',h:'ข้อเขียนผ่าน %',t:'num',w:70},{k:'prn',h:'งานปฏิบัติที่ต้องผ่าน (0 = ทุกงาน)',t:'num',w:90},{k:'mon',h:'ถือระดับก่อนหน้าอย่างน้อย (เดือน)',t:'num',w:90}];
    const R=P_.rates=P_.rates||JSON.parse(JSON.stringify(RATE0)),L=LVS(),A=typeof ALWPOL!=='undefined'?ALWPOL:null;
    return tabs+`<section class="card"><h2><span>อัตราค่าชำนาญวิชาชีพตามกระบอกเงินเดือน</span><small>บาท/เดือน จ่ายเพิ่มจากค่าใบอนุญาตและค่าตำแหน่ง ${A?esc(A.note):''}</small></h2><div class="tw"><table class="grt"><thead><tr><th>กระบอก</th>${L.map(l=>`<th>${esc(l)}</th>`).join('')}</tr></thead><tbody>
    ${Object.keys(R).sort().map(g=>`<tr><th style="text-align:left">${esc(g)}</th>${L.map((l,i)=>`<td><input class="r" data-t="num" inputmode="decimal" data-p="co.prof.rates.${g}.${i}" value="${esc(R[g][i]??'')}" style="width:80px" aria-label="${g} ${l}"></td>`).join('')}</tr>`).join('')}</tbody></table></div></section>
    <section class="card"><h2><span>เกณฑ์แต่ละระดับ</span></h2>${gtable('co.prof.lv',P_.lv,cols)}<div class="row" style="margin-top:8px"><label style="display:flex;gap:6px;align-items:center">ข้อสอบต่อครั้ง<input data-p="co.prof.qn" data-t="num" value="${esc(P_.qn)}" style="width:60px"> ข้อ</label></div>
    ${A?`<div class="tw" style="margin-top:10px"><table><thead><tr><th>ระดับ</th><th>เกณฑ์ผลประเมินทักษะ</th><th>ภาคปฏิบัติ</th><th>ระยะเวลา</th></tr></thead><tbody>${A.levels.map(l=>`<tr><td><b>${esc(l.code)}</b> ${esc(l.name)}</td><td>${esc(l.assess)}</td><td>${esc(l.practical)}</td><td>${esc(l.wait)}</td></tr>`).join('')}</tbody></table></div>
    <ul class="hint" style="line-height:1.8;padding-left:18px;margin-top:10px">${A.rules.map(([h,t])=>`<li><b>${esc(h)}</b> ${esc(t)}</li>`).join('')}</ul>`:''}</section>`}
  if(sub==='bank'){const lvo=[['','–'],...LVS().map(l=>[l,l])],dpo=[['all','ทุกฝ่าย'],...SKILLS.depts.map(d=>[d.c,d.n])];
    const roles=[...new Set(P_.tb.map(q=>q.role||''))].sort(),rf=S.sel.tbr??(roles.find(r=>r)||''),TB=P_.tb.filter(q=>(q.role||'')===rf),PR=P_.pr.filter(q=>(q.role||'')===rf);
    const qc=[{k:'d',h:'ฝ่าย',t:'sel',o:dpo,w:130},{k:'lv',h:'ระดับ',t:'sel',o:lvo,w:60},{k:'q',h:'คำถาม',t:'area',w:260},{k:'c1',h:'ก',w:150},{k:'c2',h:'ข',w:150},{k:'c3',h:'ค',w:150},{k:'c4',h:'ง',w:150},{k:'a',h:'ข้อถูก',t:'sel',o:[['1','ก'],['2','ข'],['3','ค'],['4','ง']],w:60}];
    const pc=[{k:'d',h:'ฝ่าย',t:'sel',o:dpo,w:130},{k:'lv',h:'ระดับ',t:'sel',o:lvo,w:60},{k:'t',h:'งานที่ต้องทำให้ดู',w:320},{k:'pass',h:'เกณฑ์ผ่าน',w:260},{k:'time',h:'เวลา',w:80},{k:'by',h:'ผู้ประเมิน',w:150}];TABLES.tb={rows:()=>TB,cols:qc};
    return tabs+`<section class="card"><h2><span>คลังข้อสอบ</span><small>${P_.tb.length} ข้อเขียน · ${P_.pr.length} งานปฏิบัติ · ${roles.filter(r=>r).length} ตำแหน่ง · เฉลยเห็นเฉพาะฝ่ายบุคคล ผู้สอบไม่เห็นเฉลย</small><span class="sp"></span><label class="btn sm pri" style="cursor:pointer">นำเข้าคลังข้อสอบ (skill-tests.json)<input type="file" accept=".json,application/json" id="tbImp" hidden></label></h2>
    <div class="row"><select id="tbR" aria-label="ตำแหน่ง">${roles.map(r=>`<option value="${esc(r)}"${r===rf?' selected':''}>${r?esc(r):'ข้อสอบที่เขียนเอง (ทั้งฝ่าย)'} · ${P_.tb.filter(q=>(q.role||'')===r).length} ข้อ</option>`).join('')}</select></div></section>
    <section class="card"><h2><span>ข้อเขียน${rf?' · '+esc(rf):''}</span><span class="sp"></span>${copyBtn('tb')}</h2>${gtable('co.prof.tb',TB,qc)}<div class="row" style="margin-top:8px"><button type="button" class="btn sm pri" data-a="tbAdd" data-c="tb">+ เพิ่มข้อสอบ</button></div></section>
    <section class="card"><h2><span>งานปฏิบัติ${rf?' · '+esc(rf):''}</span></h2>${gtable('co.prof.pr',PR,pc)}<div class="row" style="margin-top:8px"><button type="button" class="btn sm" data-a="tbAdd" data-c="pr">+ เพิ่มงานปฏิบัติ</button></div></section>`}
  if(sub==='tests'){const L=C.ptest.slice().sort((a,b)=>(b.date||'').localeCompare(a.date||''));
    return tabs+`<section class="card"><h2><span>การสอบวัดระดับ</span></h2><div class="tw"><table><thead><tr><th>เลขที่</th><th>วันที่</th><th>ผู้สอบ</th><th>ระดับ</th><th class="r">ข้อเขียน</th><th>ผล</th><th></th></tr></thead><tbody>
    ${L.length?L.map(t=>{const c=ptCalc(t);return `<tr class="${sel&&sel.id===t.id?'sel':''}"><td><button type="button" class="btn ghost sm" data-a="ptSel" data-id="${t.id}"><b>${esc(t.no)}</b></button></td><td>${thD(t.date)}</td><td>${esc(staffName(t.staff))}</td><td>${esc(t.lv)}</td><td class="r">${t.sub?c.mc+'%':'–'}</td><td>${t.done?pill([['p','ผ่าน'],['f','ไม่ผ่าน']],c.pass?'p':'f',c.pass?'ok':'bad'):t.sub?'<span class="pill warn">รอผลปฏิบัติ</span>':'<span class="pill">ยังไม่ส่ง</span>'}</td><td>${t.done?'':`<button type="button" class="x" data-a="delRow" data-c="co.ptest" data-id="${t.id}" aria-label="ลบ">✕</button>`}</td></tr>`}).join(''):'<tr><td colspan="7" class="empty">ยังไม่มีการสอบ จัดสอบได้จากแท็บ “พนักงานและระดับ”</td></tr>'}</tbody></table></div></section>`+(sel?profTestView(sel,false):'')}
  const L=C.staff.filter(s=>s.active!==false),tot=sum(L,profAmt);
  return tabs+`<dl class="stats"><div><dt>คนที่ได้ค่าชำนาญ</dt><dd>${L.filter(s=>profAmt(s)).length} <small>/ ${L.length}</small></dd></div><div><dt>ค่าชำนาญรวมต่อเดือน</dt><dd>${fmt(tot)}</dd></div><div><dt>ระดับหมดอายุใน 60 วัน</dt><dd>${L.filter(s=>{const p=profNow(s);return p&&!p.expired&&okD(p.exp)&&p.exp<=addD(td,60)}).length}</dd></div><div><dt>สอบค้างผล</dt><dd>${C.ptest.filter(t=>!t.done).length}</dd></div></dl>
  <section class="card"><h2><span>ค่าชำนาญวิชาชีพ</span><small>ผลประเมินทักษะถึงเกณฑ์ + สอบผ่าน = ได้ระดับและค่าชำนาญทุกเดือน</small></h2><div class="tw"><table><thead><tr><th>พนักงาน</th><th>ระดับปัจจุบัน</th><th class="r">ค่าชำนาญ/เดือน</th><th>ได้ระดับเมื่อ</th><th class="r">ประเมินทักษะล่าสุด</th><th>ระดับถัดไป</th><th></th></tr></thead><tbody>
  ${L.map(s=>{const p=profNow(s),nx=nextLv(s),k=nx?profCheck(s,nx):null,e=lastSka(s),pct=e?skaCalc(e).pct:null;
    return `<tr><td><b>${esc(s.name)}</b><br><small class="muted">${esc(s.role||'')}</small></td><td>${p?`<span class="pill ${p.expired||profSusp(s)?'bad':'ok'}">${esc(p.lv)}${p.expired?' หมดอายุ':''}</span>${profSusp(s)?`<br><small class="muted">ระงับถึง ${thD(p.susp)}</small>`:''}`:'<span class="muted">–</span>'}</td><td class="r">${p?fmt(lvRate(s,p.lv)):''}</td><td>${p?`<small>${thD(p.since)}</small>`:''}</td><td class="r">${pct==null?'<span class="muted">ยังไม่มี</span>':pct+'%'}</td>
    <td>${nx?`<b>${esc(nx)}</b>${k&&!k.ok?`<br><small class="muted">${esc(k.why.join(' · '))}</small>`:'<br><small style="color:var(--good)">ครบเงื่อนไขแล้ว</small>'}`:'<span class="muted">สูงสุดแล้ว</span>'}</td>
    <td style="white-space:nowrap">${nx?`<button type="button" class="btn sm" data-a="ptNew" data-id="${s.id}" data-lv="${nx}">จัดสอบ ${esc(nx)}</button>${k&&k.ok?` <button type="button" class="btn sm pri" data-a="profGrant" data-id="${s.id}" data-lv="${nx}">ให้ระดับ ${esc(nx)}</button>`:''}`:''}${p&&!p.expired?` <button type="button" class="btn sm" data-a="profSusp" data-id="${s.id}" title="ฝ่าฝืนกฎความปลอดภัยร้ายแรงหรือทุจริต">ระงับ 3 เดือน</button> <button type="button" class="btn sm" data-a="profDrop" data-id="${s.id}" title="ผลประเมินต่ำกว่าเกณฑ์ 2 ปีติดกัน">ลดระดับ</button>`:''}</td></tr>`}).join('')}</tbody></table></div></section>`}
ACT.profV=b=>{S.sel.profv=b.dataset.k;render()};ACT.ptSel=b=>{S.sel.pt=b.dataset.id;render()};
// staff side: tests waiting for me
function myTests(){const u=me(),L=(CO().ptest||[]).filter(t=>u?t.staff===u.id:true).sort((a,b)=>(b.date||'').localeCompare(a.date||'')),sel=L.find(t=>t.id===S.sel.pt)||L.find(t=>!t.sub)||L[0];
  const p=u?profNow(u):null;
  return `<section class="card"><h2><span>สอบวัดระดับของฉัน</span><small>${p?`ระดับปัจจุบัน ${esc(p.lv)} ค่าชำนาญ ${fmt(profAmt(u))} บาท/เดือน หมดอายุ ${thD(p.exp)}`:'ยังไม่มีระดับ'}</small></h2>
  ${L.length?`<div class="row">${L.map(t=>`<button type="button" class="btn sm${sel&&sel.id===t.id?' pri':''}" data-a="ptSel" data-id="${t.id}">${esc(t.no)} ${esc(t.lv)} ${t.done?(ptCalc(t).pass?'✓':'✗'):t.sub?'(ส่งแล้ว)':'(ยังไม่สอบ)'}</button>`).join('')}</div>`:'<p class="hint">ยังไม่มีการสอบที่จัดให้คุณ</p>'}</section>`+(sel?profTestView(sel,true):'')}
PRINT.ptest=id=>{const t=(CO().ptest||[]).find(x=>x.id===id);if(!t)return '';const s=CO().staff.find(x=>x.id===t.staff)||{},c=ptCalc(t),r=lvRow(t.lv)||{};
  return cphead(`ผลสอบวัดระดับ ${esc(t.lv)} ${esc(t.no)}`,`วันที่ ${thDL(t.date)}`)+`<div class="meta"><div><b>ผู้สอบ:</b> ${esc(s.name||'')} (${esc(s.code||'')})</div><div><b>ตำแหน่ง:</b> ${esc(s.role||'')}</div><div><b>ข้อเขียน:</b> ${c.right}/${c.qs.length} = ${c.mc}% (เกณฑ์ ${r.test||'–'}%)</div><div><b>ผลรวม:</b> ${t.done?(c.pass?'ผ่าน':'ไม่ผ่าน'):'ยังไม่สรุป'}</div></div>
  ${c.pr.length?`<h3>งานปฏิบัติ</h3><table><thead><tr><th>#</th><th>งาน</th><th>ผล</th></tr></thead><tbody>${c.pr.map((x,i)=>`<tr><td>${i+1}</td><td>${esc(x.t)}</td><td>${(t.prv||{})[x.id]==='pass'?'ผ่าน':(t.prv||{})[x.id]==='fail'?'ไม่ผ่าน':''}</td></tr>`).join('')}</tbody></table>`:''}
  <h3>ข้อเขียน</h3><table><thead><tr><th>#</th><th>คำถาม</th><th>ตอบ</th><th>ผล</th></tr></thead><tbody>${c.qs.map((q,i)=>{const a=(t.ans||{})[q.id];return `<tr><td>${i+1}</td><td>${esc(q.q)}</td><td>${a?esc(q['c'+a]||''):''}</td><td>${String(a)===String(q.a)?'✔':'✘'}</td></tr>`}).join('')}</tbody></table>
  <div class="sign" style="grid-template-columns:1fr 1fr">${sigPrint(t,'sigE','ผู้สอบ',s.name)}${sigPrint(t,'sigA','ผู้ประเมิน',t.doneBy)}</div>`};
// HR page wiring
{const sb=subTabs;subTabs=function(k,list){if(k==='hr'&&list.some(x=>x[0]==='eval'||x[0]==='skill')&&!list.some(x=>x[0]==='prof'||x[0]==='test')){const i=Math.max(list.findIndex(x=>x[0]==='eval'),list.findIndex(x=>x[0]==='skill'));list=[...list.slice(0,i+1),...(canHR()?[['prof','ค่าชำนาญวิชาชีพ']]:[]),...(me()?[['test','สอบวัดระดับของฉัน']]:[]),...list.slice(i+1)]}return sb(k,list)}}
const HR_TABS=[['staff','พนักงานและจัดคนลงหน้างาน'],['ts','ลงเวลาทำงาน'],['leave','การลา'],['pay','สรุปค่าแรง'],['skill','สกิลชีต'],['gap','แผนอบรม'],['rev','ประเมินและขึ้นเงินเดือน'],['band','โครงสร้างเงินเดือน'],['tool','เครื่องมือ']];
const hrTabs=()=>{const u=me();return subTabs('hr',hrFull()?HR_TABS:[['leave','การลา'],['eval',u&&isHead(u)?'ประเมินทักษะลูกทีม':'ผลประเมินของฉัน']]).html};
{const f=CVIEWS.hr;CVIEWS.hr=()=>{profCfg();const c=S.sub.hr;
  if(c==='prof'&&canHR())return hrTabs()+hrProf();
  if(c==='test'&&me())return hrTabs()+myTests();
  if(c==='test'||c==='prof')S.sub.hr=hrFull()?'staff':'leave';
  return f()}}
// the review table and payroll pick up the allowance
{const f=alwOf;alwOf=s=>f(s)+profAmt(s)}
{const f=alerts;alerts=function(){const A=f(),td=today(),u=me();(CO().staff||[]).forEach(s=>{const p=profNow(s);if(p&&!p.expired&&okD(p.exp)&&p.exp<=addD(td,60)&&(!u||canHR()))A.push({lv:'warn',kind:'ระดับวิชาชีพใกล้หมดอายุ',p:null,txt:`${s.name} ${p.lv} หมดอายุ ${thD(p.exp)} จัดสอบใหม่`,due:p.exp,go:{m:'co',k:'hr',s:'prof'}})});
  (CO().ptest||[]).forEach(t=>{if(!t.sub&&u&&t.staff===u.id)A.push({lv:'warn',kind:'มีการสอบวัดระดับรอคุณ',p:null,txt:`${t.no} ระดับ ${t.lv}`,due:t.date,go:{m:'co',k:'hr',s:'test'}})});return A}}
document.head.insertAdjacentHTML('beforeend',`<style>
.ptq{border-bottom:1px solid var(--line-2);padding:8px 0}.ptq p{margin:0 0 6px}.ptc{display:flex;gap:8px;align-items:flex-start;padding:6px 8px;border-radius:8px;cursor:pointer}.ptc:hover{background:var(--sunk)}
.ptc.ok{background:color-mix(in srgb,var(--good) 16%,transparent)}.ptc.bad{background:color-mix(in srgb,var(--danger) 14%,transparent)}.ptc input{margin-top:4px}
</style>`);

