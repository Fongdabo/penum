/* ---------- 3.11: whole-building projects ----------
   Until now every project was an MEP job. A main contractor's job also has site preparation, piles, the structure,
   architecture, lifts and external works, so these get their own BOQ work groups, and the tools that start from the
   BOQ know them: the starting schedule, crews, quotation scope, ITP, warranties and daily-report trades.
   Also: vendors can be pulled in from the company's other projects, past progress can be typed in for the S-curve,
   and government contracts get monthly instalments (15–20 งวด) instead of the five MEP ones. */
const BLD_G={prep:'งานเตรียมพื้นที่และงานชั่วคราว',pile:'งานเสาเข็มและฐานราก',str:'งานโครงสร้าง',arc:'งานสถาปัตยกรรม',lift:'งานลิฟต์และบันไดเลื่อน',ext:'งานภายนอกและภูมิทัศน์'};
// building work first, then the systems, then the catch-all groups; BOQ_G is rebuilt in that order
{const old=Object.assign({},BOQ_G),tail=['civ','oth','ex'];Object.keys(BOQ_G).forEach(k=>delete BOQ_G[k]);
  Object.assign(BOQ_G,BLD_G);Object.keys(old).filter(k=>!tail.includes(k)).forEach(k=>BOQ_G[k]=old[k]);tail.forEach(k=>{if(old[k])BOQ_G[k]=old[k]})}
const isBld=G=>['prep','pile','str','arc'].some(g=>G.has?G.has(g):G.includes(g));
const pjBld=p=>isBld(new Set(((p||P).boq.items||[]).map(i=>i.g)));
// group headings written other ways in a pasted BOQ (หมวดงานโครงสร้าง, งานสถาปัตย์ …)
const G_ALIAS=[[/เตรียมพื้นที่|งานชั่วคราว|รั้วชั่วคราว/,'prep'],[/เสาเข็ม|ฐานราก/,'pile'],[/โครงสร้าง/,'str'],[/สถาปัตย/,'arc'],[/ลิฟต์|บันไดเลื่อน/,'lift'],[/ภายนอก|ภูมิทัศน์|ถนน|ลานจอด/,'ext']];
const gOfName=(bt,GL)=>{const s=String(bt||'').replace(/^หมวด\s*(ที่\s*\d+)?\s*/,'').trim();if(GL[s])return GL[s];if(GL[bt])return GL[bt];const a=G_ALIAS.find(([re])=>re.test(s));return a?a[1]:''};
{const f=parseBoqTSV;parseBoqTSV=function(txt){const GL={};Object.entries(BOQ_G).forEach(([k,v])=>GL[v]=k);
  // headings the original parser does not know are renamed to the group's own name before it runs
  const fixed=String(txt||'').split(/\r?\n/).map(line=>{const c=line.split('\t'),a=(c[0]||'').trim(),bt=(c[1]||'').trim();
    if(/^\d+$/.test(a)&&bt&&!GL[bt]&&!(c[2]||'').trim()){const g=gOfName(bt,GL);if(g){c[1]=BOQ_G[g];return c.join('\t')}}return line}).join('\n');
  return f(fixed)}}

/* --- starting schedule for a whole building --- */
const bldScale=()=>{const t=sum(P.boq.items,i=>n(i.t||boqCost(i)));return Math.max(.6,Math.min(2.4,Math.sqrt((t||1.5e8)/1.5e8)))};
function bldTasks(G){const st=okD(P.info.start)?P.info.start:today(),s=bldScale(),D=x=>Math.max(1,Math.round(x*s)),T=[];
  const add=(name,dur,dep,g,ms)=>{const t={id:uid(),name,dur,pct:0,g:G.has(g)?g:'',dep:(dep||[]).filter(x=>x&&x.id).map(x=>({id:x.id,lag:x.lag||0})),ms:!!ms};if(!T.length)t.start=st;T.push(t);return t};
  const after=(t,lag)=>t?{id:t.id,lag:lag||0}:null,ov=(t,f)=>t?{id:t.id,lag:-Math.round(durOf(t)*f)}:null;
  const k0=add('เริ่มงาน / ลงนามสัญญา',0,[],'',1);
  const sub=add('ส่งอนุมัติวัสดุและแบบขยาย (Submittal / Shop Drawing)',D(30),[after(k0)]);
  const buy=add('สั่งซื้อเครื่องจักร ลิฟต์ และรอส่งของ',D(75),[after(sub)]);
  const prep=add('งานเตรียมพื้นที่ รั้ว สำนักงานสนาม และงานชั่วคราว',D(20),[after(k0)],'prep');
  const pile=G.has('pile')?add('งานเสาเข็ม',D(40),[after(prep)],'pile'):null;
  const fdn=G.has('pile')?add('งานฐานราก คานคอดิน และพื้นชั้นล่าง',D(35),[after(pile)],'pile'):null;
  const str=add('งานโครงสร้างอาคาร (เสา คาน พื้น บันได)',D(150),[after(fdn||prep)],'str');
  const roof=add('งานหลังคาและกันซึม',D(30),[after(str)],'arc');
  const wall=add('งานก่ออิฐ ฉาบปูน',D(100),[ov(str,.55)],'arc');
  const fin=add('งานฝ้า พื้น บุผนัง และสี',D(110),[ov(wall,.5)],'arc');
  const door=add('งานประตู หน้าต่าง สุขภัณฑ์ และงานตกแต่ง',D(60),[ov(fin,.45)],'arc');
  // systems: pipes and conduits go in while the frame is built, equipment once rooms are closed
  const MEP=[['plb','งานระบบสุขาภิบาล',120],['fp','งานระบบดับเพลิงและแจ้งเหตุ',110],['elb','งานระบบไฟฟ้าอาคารและสื่อสาร',140],['duct','งานท่อลมและอุปกรณ์',90],['pipe','งานท่อน้ำยาและท่อน้ำทิ้ง',80],
    ['chw','งานระบบน้ำเย็น',90],['el','งานไฟฟ้าระบบปรับอากาศ',70],['smk','งานระบบควบคุมควันไฟ',50],['civ','งานโยธาที่เกี่ยวข้องกับงานระบบ',30]];
  const sys=MEP.filter(([g])=>G.has(g)).map(([g,nm,d])=>add(nm,D(d),[ov(str,.5)],g));
  const eq=G.has('eq')?add('ติดตั้งเครื่องปรับอากาศ FCU / CDU / AHU / Chiller',D(45),[after(buy),ov(fin,.6)],'eq'):null;
  const lift=G.has('lift')?add('ติดตั้งลิฟต์และบันไดเลื่อน',D(70),[after(buy),after(str)],'lift'):null;
  const ext=G.has('ext')?add('งานภายนอก ถนน ลานจอด ภูมิทัศน์',D(50),[ov(fin,.3)],'ext'):null;
  const tc=add('ทดสอบและเดินระบบ (T&C)',D(25),[...sys.map(t=>after(t)),after(eq),after(lift)],'oth');
  const pl=add('ตรวจรับงานและแก้ไขงานค้าง (Punch list)',D(20),[after(tc),after(door),after(roof),after(ext)],'ex');
  add('ส่งมอบงาน',0,[after(pl)],'',1);
  return T}
{const f=genTasks;genTasks=function(){const G=new Set(groupsInBoq());return isBld(G)?bldTasks(G):f()}}

/* --- crews, daily-report trades --- */
Object.assign(CREW_G,{prep:[['กรรมกร',6],['ช่างไม้',2]],pile:[['ช่างเสาเข็ม',6],['ช่างเหล็ก',4],['ช่างปูน',4],['กรรมกร',6]],
  str:[['ช่างเหล็ก',10],['ช่างไม้แบบ',10],['ช่างปูน',8],['กรรมกร',12]],arc:[['ช่างก่อฉาบ',10],['ช่างฝ้าและสี',6],['กรรมกร',8]],lift:[['ช่างลิฟต์',4]],ext:[['ช่างปูน',4],['กรรมกร',6]]});
CREW_N.unshift([/หลังคา|กันซึม/,[['ช่างหลังคา',6],['กรรมกร',4]]],[/ประตู|หน้าต่าง|สุขภัณฑ์|ตกแต่ง/,[['ช่างไม้',4],['ช่างกระจกอลูมิเนียม',4],['ช่างประปา',2]]],
  [/ฝ้า|บุผนัง|สี/,[['ช่างฝ้าและสี',8],['ช่างกระเบื้อง',6],['กรรมกร',6]]],[/ก่อ|ฉาบ/,[['ช่างก่อฉาบ',12],['กรรมกร',8]]]);
{const f=crewGuess;crewGuess=function(t){let c=f(t);if(c.length&&t.g==='arc'){const m=CREW_N.find(([re])=>re.test(t.name||''));if(m)c=m[1].map(([trade,k])=>({trade,n:k}))}const B=['prep','pile','str','arc','lift','ext'];
  if(c.length&&(B.includes(t.g)||/ก่อ|ฉาบ|ฝ้า|หลังคา|ประตู/.test(t.name||''))){const k=bldScale();return c.map(x=>({trade:x.trade,n:Math.max(1,Math.round(x.n*k))}))}return c}}
{const f=NEW.daily;NEW.daily=a=>{const r=f(a);if(pjBld())r.men=['ช่างปูน','ช่างเหล็ก','ช่างไม้แบบ','ช่างก่อฉาบ','ช่างระบบ','กรรมกร'].map(trade=>({id:uid(),trade,n:0}));return r}}

/* --- quotation scope --- */
SOWSYS.splice(1,0,['bld','งานโครงสร้างและสถาปัตยกรรม']);SOWSYS.push(['lift','ระบบลิฟต์และบันไดเลื่อน']);
SOWLIB.bld={inc:['งานเตรียมพื้นที่ รั้วชั่วคราว สำนักงานสนาม และสาธารณูปโภคชั่วคราว','งานเสาเข็ม ฐานราก และทดสอบเสาเข็มตามแบบ','งานโครงสร้างคอนกรีตเสริมเหล็ก (และโครงสร้างเหล็กถ้ามีในแบบ) พร้อมทดสอบกำลังคอนกรีต','งานสถาปัตยกรรม ผนัง ฝ้า พื้น สี ประตูหน้าต่าง หลังคา และกันซึมตามแบบ','งานภายนอกตามแบบ (ถนน ลานจอด ระบบระบายน้ำรอบอาคาร)'],
  exc:['ค่าธรรมเนียมขออนุญาตก่อสร้างและค่าตรวจสอบของหน่วยงานราชการ','ค่าขอใช้ไฟฟ้า ประปา และโทรศัพท์ถาวร','งานเฟอร์นิเจอร์ลอยตัว ป้ายโฆษณา และงานตกแต่งภายในที่ไม่อยู่ในแบบ','งานรื้อย้ายสาธารณูปโภคเดิมนอกเขตที่ดิน']};
SOWLIB.lift={inc:['ลิฟต์และบันไดเลื่อนตามยี่ห้อ ขนาด และจำนวนที่ระบุ','ทดสอบและขอใบรับรองการตรวจสอบก่อนใช้งาน','บำรุงรักษาฟรีตลอดระยะประกัน'],exc:['ค่าตรวจสอบประจำปีหลังหมดประกัน']};
Object.assign(SOW_G,{prep:'bld',pile:'bld',str:'bld',arc:'bld',ext:'bld',lift:'lift'});
// a whole-building job does its own civil work, so the MEP exclusions about it come out
const SOW_NOT_BLD=['งานโยธา เจาะ สกัด และซ่อมผนัง ฝ้า พื้น หลังติดตั้ง','งานสี ตกแต่ง และงานซ่อมผิวที่ไม่ได้ระบุ'];
{const f=sowFill;sowFill=function(Q,sys){const k=f(Q,sys);if(sys.includes('bld')||(Q.sow||[]).some(x=>x.sys==='bld'))Q.sow=Q.sow.filter(x=>!(x.sys==='gen'&&x.kind==='exc'&&SOW_NOT_BLD.includes(x.text)));return k}}

/* --- ITP --- */
Object.assign(ITPT,{prep:[['วางผังอาคารและหมุดอ้างอิง','ตรงตามแบบ ค่าคลาดเคลื่อนไม่เกิน ±10 มม.','ใบตรวจผัง','H','H']],
  pile:[['ตอกหรือเจาะเสาเข็ม','ตำแหน่งเยื้องไม่เกิน 75 มม. ค่าการทรุด (Blow count) ตามรายการคำนวณ','บันทึกการตอกเข็ม','W','W'],['ทดสอบเสาเข็ม (Seismic / Dynamic / Static load)','ผ่านเกณฑ์ของผู้ออกแบบ','รายงานทดสอบ','H','H'],['ตัดหัวเข็มและเทฐานราก','ระดับและเหล็กเสริมตามแบบ','WIR','W','H']],
  str:[['ตรวจไม้แบบและค้ำยัน','ขนาด แนว ดิ่ง ระดับ ความแข็งแรง','WIR','W','W'],['ตรวจเหล็กเสริม','ขนาด จำนวน ระยะห่าง ระยะทาบ และระยะหุ้ม','WIR','H','H'],['เทคอนกรีต','ค่ายุบตัว (Slump) ตามรายการ เก็บตัวอย่างลูกปูน','ใบบันทึกการเทคอนกรีต','H','W'],['ทดสอบกำลังอัดคอนกรีต 7 / 28 วัน','ไม่ต่ำกว่า fc′ ตามแบบ','รายงานทดสอบ','H','R'],['ถอดแบบและบ่มคอนกรีต','ตามระยะเวลาที่กำหนด ผิวไม่มีโพรง','WIR','W','S']],
  arc:[['ก่อผนังและเสาเอ็น ทับหลัง','แนวดิ่ง ระยะเสาเอ็นตามแบบ','WIR','W','S'],['ฉาบปูน','เรียบ ได้ดิ่ง ไม่แตกร้าว','WIR','W','S'],['งานกันซึม','ทดสอบขังน้ำ 48 ชม. ไม่รั่วซึม','ใบทดสอบ','H','W'],['ติดตั้งฝ้าเพดาน','ระดับเรียบ เปิดช่องตรวจตามแบบ (หลังงานระบบผ่าน)','WIR','W','W'],['งานสี','ความหนาและจำนวนเที่ยวตามรายการ','WIR','W','S']],
  lift:[['ติดตั้งรางและห้องเครื่องลิฟต์','ดิ่ง ระยะตามผู้ผลิต','WIR','W','R'],['ทดสอบลิฟต์และขอใบรับรอง','ผ่านการตรวจของวิศวกรผู้ตรวจสอบ','ใบรับรอง','H','H']],
  ext:[['งานถนนและลานจอด','ความหนา ความลาด และกำลังวัสดุตามแบบ','WIR','W','W'],['ท่อระบายน้ำรอบอาคาร','ความลาดตามแบบ ไม่มีน้ำขัง','WIR','W','S']]});

/* --- warranties --- */
{const f=ACT.genWar;ACT.genWar=()=>{f();if(!pjBld())return;const st=okD(P.info.handover)?P.info.handover:today(),G=new Set(groupsInBoq()),add=(item,months)=>{if(!P.war.some(w=>w.item===item))P.war.push({id:uid(),item,vendor:P.info.company||'',start:st,months,note:''})};
  add('รับประกันโครงสร้างอาคาร',60);add('รับประกันงานกันซึมและหลังคา',60);add('รับประกันงานสถาปัตยกรรม (ผนัง ฝ้า พื้น สี ประตูหน้าต่าง)',24);if(G.has('lift'))add('รับประกันลิฟต์และบันไดเลื่อน พร้อมบำรุงรักษา',24);save();render()}}

/* --- vendors: pull the company's vendors in from its other projects --- */
const venElse=()=>{const have=new Set(P.vendors.map(v=>(v.name||'').trim()).filter(Boolean)),out=new Map();
  projects().forEach(p=>{if(p===P)return;(p.vendors||[]).forEach(v=>{const k=(v.name||'').trim();if(k&&!have.has(k)&&!out.has(k))out.set(k,v)})});return [...out.values()]};
{const f=buyVen;buyVen=function(){const L=venElse(),h=f();if(!L.length)return h;
  return h.replace('<h2><span>ทะเบียนผู้ขาย</span><span class="sp"></span>',`<h2><span>ทะเบียนผู้ขาย</span><span class="sp"></span><button type="button" class="btn sm pri" data-a="venPull" title="${esc(L.slice(0,8).map(v=>v.name).join(', '))}">ดึงผู้ขายจากโครงการอื่น (${L.length} ราย)</button>`)}}
ACT.venPull=()=>{const L=venElse();L.forEach(v=>P.vendors.push(Object.assign({},v,{id:uid()})));save();render();toast(`เพิ่มผู้ขาย ${L.length} ราย จากโครงการอื่นของบริษัท`)};

/* --- past progress for the S-curve --- */
function histParse(txt){const out=[];String(txt||'').replace(/\r/g,'').split('\n').forEach(l=>{const c=l.split(/\t|,|;|\s{2,}|\s(?=\d+(?:\.\d+)?\s*%?\s*$)/).map(x=>x.trim()).filter(Boolean);if(c.length<2)return;
  let d='',s=c[0];let m=s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);if(m)d=`${m[1]}-${pad(+m[2],2)}-${pad(+m[3],2)}`;
  else if((m=s.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2,4})$/))){let y=+m[3];if(y<100)y+=y>40?2500:2000;if(y>2400)y-=543;d=`${y}-${pad(+m[2],2)}-${pad(+m[1],2)}`}
  else{const ym=parseYM(s);if(ym){const x=pd(ym+'-01');x.setMonth(x.getMonth()+1);x.setDate(0);d=iso(x)}}
  const v=numOf(c[c.length-1].replace('%',''));if(okD(d)&&v!=null&&v>=0&&v<=100)out.push([d,v])});return out}
ACT.histIn=()=>{const H=Object.keys(P.hist||{}).filter(okD).sort();dialog('ใส่ความคืบหน้าย้อนหลัง',`<p>ใช้กับโครงการที่เริ่มก่อนใช้โปรแกรม ใส่บรรทัดละ 1 จุด: วันที่ หรือเดือน ตามด้วยความคืบหน้าสะสม (%) วางจาก Excel ได้</p>
  <p class="hint">ตัวอย่าง: <code>31/01/2569 4.5</code> · <code>2026-02 11.2</code> · <code>มี.ค. 69 18</code></p><textarea id="histTxt" rows="9">${H.map(d=>`${d}\t${P.hist[d]}`).join('\n')}</textarea>`,
  `<button type="button" class="btn pri" data-a="histGo">บันทึก</button>`)};
ACT.histGo=()=>{const L=histParse($('#histTxt').value),td=today();if(!L.length){toast('ไม่พบวันที่และ % ที่อ่านได้');return}P.hist=P.hist||{};L.forEach(([d,v])=>{if(d<td)P.hist[d]=v});$('#dlg').close();save();render();toast(`บันทึก ${L.filter(x=>x[0]<td).length} จุด เส้นงานจริงใน S-Curve ย้อนหลังได้แล้ว`)};
{const f=VIEWS.sched;VIEWS.sched=()=>{const h=f();if((S.sub.sched||'g')!=='g'||!P.tasks.length)return h;const k=Object.keys(P.hist||{}).filter(d=>okD(d)&&d<today()).length;
  return h+`<section class="card"><h2><span>ความคืบหน้าย้อนหลัง</span><small>${k?`มี ${k} จุดก่อนวันนี้`:'ยังไม่มี เส้นงานจริงใน S-Curve จะเริ่มที่วันนี้'} · ระบบบันทึกเองทุกวันที่แก้ % ของงาน</small><span class="sp"></span><button type="button" class="btn sm" data-a="histIn">ใส่ความคืบหน้าย้อนหลัง</button></h2></section>`}}

/* --- instalments: MEP (5 stages) or government monthly by progress --- */
{const f=ACT.instGen;ACT.instGen=b=>{if(!b||!b.dataset)return f();const s=P.tasks.length?sched():null,mo=s?Math.max(3,Math.round(diffD(s.st,s.fin)/30.4)):12;
  dialog('สร้างงวดงานตั้งต้น',`<p>เลือกแบบงวดงาน แล้วแก้ % หรือเงื่อนไขในตารางได้</p><label>จำนวนงวด (แบบราชการ)<input id="instN" type="number" min="3" max="36" value="${Math.min(20,Math.max(6,mo))}"></label>
    <p class="hint">แบบราชการ: แบ่งตามผลงานเดือนละงวด งวดสุดท้าย 5% เมื่อส่งมอบงานทั้งหมด ตามแบบสัญญาจ้างก่อสร้างภาครัฐ</p>`,
    `<button type="button" class="btn pri" data-a="instGov">แบบราชการ รายเดือน</button><button type="button" class="btn" data-a="instMep">งานระบบ 5 งวด</button>`)};
  ACT.instMep=()=>{$('#dlg').close();f()};}
ACT.instGov=()=>{const N=Math.max(3,Math.min(36,Math.round(n($('#instN').value))||12));$('#dlg').close();if((P.inst||[]).length&&!confirm('แทนที่งวดเดิม?'))return;
  const st=okD(P.info.start)?P.info.start:today(),each=Math.floor(9500/(N-1))/100,L=[];let cum=0;
  for(let i=1;i<N;i++){const p=i<N-1?each:Math.round((95-cum)*100)/100;cum=Math.round((cum+p)*100)/100;const d=pd(st);d.setMonth(d.getMonth()+i);
    L.push({id:uid(),no:String(i),desc:`งวดที่ ${i} ผลงานแล้วเสร็จสะสมไม่น้อยกว่า ${fmt(cum,2)}% ตามแผนงาน`,pct:p,task:'',date:iso(d)})}
  const d=pd(st);d.setMonth(d.getMonth()+N);L.push({id:uid(),no:String(N),desc:`งวดที่ ${N} (งวดสุดท้าย) งานแล้วเสร็จทั้งหมดและส่งมอบงานถูกต้องครบถ้วน`,pct:5,task:'',date:iso(d)});
  P.inst=L;P.info.billMode='pct';save();render();toast(`สร้าง ${N} งวด ตามผลงานรายเดือนแล้ว`)};

/* --- BOQs entered before these groups existed: structure in "งานโยธา", architecture in "งานเพิ่มเติม" --- */
const G_RE=[['lift',/ลิฟต์|บันไดเลื่อน/],['ext',/ภายนอกอาคาร|ภูมิ|ถนน|ลานจอด/],['pile',/เสาเข็ม|ฐานราก/],['prep',/เตรียมพื้นที่|งานดิน|รื้อถอน|รั้วชั่วคราว|ถมบดอัด|สำนักงานสนาม/],
  ['str',/โครงสร้าง|คอนกรีต|เหล็กเสริม|ไม้แบบ|post.?tension|เหล็กรูปพรรณ/i],['arc',/สถาปัตย|ก่ออิฐ|ฉาบ|ทาสี|กระเบื้อง|ฝ้า|หลังคา|กันซึม|ประตู|หน้าต่าง|กระจก|curtain|ไวนิล|บุผนัง/i]];
const gGuess=i=>{const s=`${i.head||''} ${i.type||''} ${i.desc||''}`;if(/ฐานเครื่อง|แท่น|pad|ฐานคอนกรีตปั๊ม|ฐานรองเครื่อง/i.test(s))return '';const m=G_RE.find(([,re])=>re.test(s));return m?m[0]:''};
const gMoves=()=>P.boq.items.filter(i=>['civ','ex',''].includes(i.g||'')).map(i=>[i,gGuess(i)]).filter(x=>x[1]);
ACT.gReclass=()=>{const L=gMoves();L.forEach(([i,g])=>i.g=g);save();render();toast(`ย้าย ${L.length} รายการไปหมวดงานโครงสร้าง สถาปัตย์ และงานภายนอกแล้ว กด “สร้างแผนตั้งต้นจาก BOQ” ใหม่ถ้าต้องการแผนแบบงานทั้งอาคาร`)};
{const f=VIEWS.setup;VIEWS.setup=()=>{const h=f(),L=gMoves();if(L.length<3)return h;const by={};L.forEach(([,g])=>by[g]=(by[g]||0)+1);
  return `<section class="card" style="border-color:color-mix(in srgb,var(--plan) 45%,var(--line))"><h2><span>จัดหมวดงานทั้งอาคาร</span><small>BOQ นี้มีงาน${Object.entries(by).map(([g,k])=>`${BOQ_G[g].replace(/^งาน/,'')} ${k}`).join(' · ')} รายการ ที่อยู่ในหมวดงานโยธาหรืองานเพิ่มเติม</small><span class="sp"></span><button type="button" class="btn sm pri" data-a="gReclass">ย้ายไปหมวดที่ถูกต้อง</button></h2></section>`+h}}
// a whole building has many trades: the chart keeps the eight biggest and adds up the rest, so no two share a colour
{const f=mpChart;mpChart=function(D,wd,ht){if(D.trades.length<=9)return f(D,wd,ht);const top=D.trades.slice(0,8),o='ช่างอื่นๆ';
  const W=D.W.map(x=>{const by={};let r=0;Object.entries(x.by).forEach(([k,v])=>{if(top.includes(k))by[k]=v;else r+=v});if(r)by[o]=r;return Object.assign({},x,{by})});return f(Object.assign({},D,{W,trades:[...top,o]}),wd,ht)}}
