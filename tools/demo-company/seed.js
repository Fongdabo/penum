// Runs inside pm/index.html (fresh, empty storage). Builds the PENUM company demo using the app's own helpers.
async function seed(LOGO){
  localStorage.clear();load();
  const C=DB.co,td=today();
  Object.assign(C,{name:'บริษัท โอเรียน จำกัด',tax:'0105569012345',
    addr:'88/8 อาคารโอเรียน ถนนวิภาวดีรังสิต แขวงจอมพล เขตจตุจักร กรุงเทพฯ 10900',phone:'02-555-0100',email:'info@orion-air.co.th',
    terms:'ยืนราคา 30 วัน · มัดจำ 15% · เบิกงวดตามผลงานรายเดือน หักประกันผลงาน 5% · รับประกันผลงาน 1 ปี อุปกรณ์ตามผู้ผลิต'});
  // logo: SVG -> PNG data URL, the same format the app's own logo upload stores
  C.logo=await new Promise(ok=>{const im=new Image();im.onload=()=>{const c=document.createElement('canvas');c.width=1440;c.height=400;c.getContext('2d').drawImage(im,0,0,1440,400);ok(c.toDataURL('image/png'))};im.src='data:image/svg+xml;base64,'+btoa(unescape(encodeURIComponent(LOGO)))});
  payCfg();
  const A=payCfg().allow;

  // customers
  const CU=[['บริษัท ศรีนคร พร็อพเพอร์ตี้ จำกัด','คุณอรุณ ศรีนคร','0105560001111','ถนนพระราม 9 ห้วยขวาง กรุงเทพฯ',30],
    ['บริษัท สยามฟู้ด โปรดักส์ จำกัด','คุณมาลี ทองคำ','0105560002222','นิคมอุตสาหกรรมบางปู สมุทรปราการ',45],
    ['โรงพยาบาลรักษ์สุขภาพ','คุณธนา (ฝ่ายอาคาร)','0994000333333','ถนนงามวงศ์วาน นนทบุรี',60],
    ['บริษัท ไทยอิเล็กทรอนิกส์ พาร์ท จำกัด','คุณเกียรติ วงศ์ดี','0105560004444','นิคมอุตสาหกรรมอมตะซิตี้ ชลบุรี',30],
    ['โรงเรียนดวงดาววิทยา','คุณครูสุนีย์','0994000555555','ถนนบางนา-ตราด กม.8 สมุทรปราการ',30],
    ['บริษัท เดอะ กรีน เรสซิเดนซ์ จำกัด','คุณพิมพ์ชนก','0105560006666','ถนนรัชดาภิเษก ดินแดง กรุงเทพฯ',30],
    ['บริษัท บางกอก ดาต้า เซ็นเตอร์ จำกัด','คุณภานุ','0105560007777','ถนนสุขุมวิท 101 กรุงเทพฯ',30]];
  C.customers=CU.map(([name,contact,tax,addr,credit],i)=>({id:uid(),name,contact,phone:'02-555-02'+i+'0',email:'',tax,addr,credit}));
  const c=C.customers;

  // staff: one roster across all 10 departments (salary inside the grade band of the role)
  const ST=[
    ['ธนพล วงศ์ใหญ่','MGT','กรรมการผู้จัดการ','month',150000,'thanaphon','ใบ กว. สามัญวิศวกร เครื่องกล',''],
    ['สุภาพร วงศ์ใหญ่','MGT','ผู้อำนวยการฝ่ายบริหาร','month',95000,'supaporn','',''],
    ['ณัฐวุฒิ เจริญกิจ','MGT','ผู้อำนวยการฝ่ายธุรกิจ','month',100000,'nattawut','',''],
    ['กิตติศักดิ์ ภูมิใจ','MGT','ผู้อำนวยการฝ่ายปฏิบัติการ','month',105000,'kittisak','ใบ กว. สามัญวิศวกร เครื่องกล',''],
    ['วรรณา สายใจ','SAL','ผู้จัดการฝ่ายขาย','month',65000,'wanna','',''],
    ['ปิยะพงษ์ ดีงาม','SAL','พนักงานขาย','month',28000,'piyapong','',''],
    ['ชนิดา แสงทอง','SAL','ธุรการขาย','month',18000,'chanida','',''],
    ['ดร.อภิชาติ ศรีวิศว','DES','ผู้จัดการฝ่ายออกแบบ (วิศวกรลงนาม)','month',80000,'apichat','ใบ กว. วุฒิวิศวกร เครื่องกล',''],
    ['พงศกร มีสุข','DES','วิศวกรเครื่องกล','month',38000,'pongsakorn','ใบ กว. ภาคีวิศวกร เครื่องกล',''],
    ['ศุภชัย ไฟฟ้างาม','DES','วิศวกรไฟฟ้า','month',36000,'supachai','ใบ กว. ภาคีวิศวกร ไฟฟ้า',''],
    ['จิราพร เขียนสวย','DES','ช่างเขียนแบบ / BIM Modeler','month',26000,'jiraporn','',''],
    ['ธีรวัฒน์ คำนวณดี','EST','หัวหน้าประมาณราคา','month',48000,'teerawat','',''],
    ['มณีรัตน์ นับถี่','EST','เจ้าหน้าที่ถอดแบบ (QS)','month',24000,'maneerat','',''],
    ['สมชาย ใจดี','PRJ','ผู้จัดการโครงการ (PM)','month',70000,'somchai','ใบ กว. สามัญวิศวกร เครื่องกล',''],
    ['อรวรรณ ตั้งมั่น','PRJ','ผู้จัดการโครงการ (PM)','month',62000,'orawan','ใบ กว. ภาคีวิศวกร เครื่องกล',''],
    ['วิทยา แก้วกล้า','PRJ','วิศวกรโครงการ','month',35000,'wittaya','ใบ กว. ภาคีวิศวกร เครื่องกล',''],
    ['ปกรณ์ สุขสันต์','PRJ','วิศวกรโครงการ','month',32000,'pakorn','ใบ กว. ภาคีวิศวกร ไฟฟ้า',''],
    ['ประยุทธ มั่นคง','PRJ','โฟร์แมน','month',30000,'prayut','บัตรอบรมทำงานบนที่สูง',300],
    ['สุรชัย ทองแท้','PRJ','โฟร์แมน','month',27000,'surachai','บัตรอบรมทำงานบนที่สูง',25],
    ['บุญมี ศรีสุข','PRJ','ช่างติดตั้ง (แอร์ ท่อ ไฟฟ้า)','day',750,'','บัตรอบรมทำงานบนที่สูง',40],
    ['สมศักดิ์ พรมมา','PRJ','ช่างติดตั้ง (แอร์ ท่อ ไฟฟ้า)','day',650,'','บัตรอบรมทำงานบนที่สูง',200],
    ['อนุชา ทองดี','PRJ','ช่างติดตั้ง (แอร์ ท่อ ไฟฟ้า)','day',600,'','มาตรฐานฝีมือแรงงาน ช่างเครื่องปรับอากาศ ระดับ 1',''],
    ['ไพโรจน์ คงเจริญ','PRJ','ช่างติดตั้ง (แอร์ ท่อ ไฟฟ้า)','day',600,'','',''],
    ['เอกชัย บุญรอด','PRJ','ช่างติดตั้ง (แอร์ ท่อ ไฟฟ้า)','day',550,'','',''],
    ['นันทนา ใจเย็น','PRJ','ธุรการเอกสารโครงการ','month',17000,'nantana','',''],
    ['นภา รุ่งเรือง','PUR','หัวหน้าจัดซื้อ','month',45000,'napa','',''],
    ['กัญญา ซื่อตรง','PUR','เจ้าหน้าที่จัดซื้อ','month',21000,'kanya','',''],
    ['สมพงษ์ เก็บดี','PUR','พนักงานคลัง','month',15000,'','ใบขับขี่รถยก',150],
    ['ศิริพร ดวงดี','ACC','ผู้จัดการบัญชี','month',60000,'siriporn','',''],
    ['รัชนี บวกเลข','ACC','พนักงานบัญชี','month',20000,'ratchanee','',''],
    ['ธนากร เงินดี','ACC','เจ้าหน้าที่การเงิน','month',19000,'thanakorn','',''],
    ['ปริศนา คนดี','HR','หัวหน้าฝ่ายบุคคล','month',45000,'prissana','',''],
    ['วิไลวรรณ ใส่ใจ','HR','เจ้าหน้าที่บุคคล','month',19000,'wilaiwan','',''],
    ['สุดา ยิ้มแย้ม','HR','ธุรการ','month',14000,'suda','',''],
    ['ชาญณรงค์ ซ่อมเก่ง','SVC','หัวหน้างานบริการ','month',42000,'channarong','มาตรฐานฝีมือแรงงาน ช่างเครื่องปรับอากาศ ระดับ 2',''],
    ['วีระ ล้างแอร์','SVC','ช่างบริการ','month',20000,'','บัตรอบรมทำงานบนที่สูง',90],
    ['ธีระ เย็นใจ','SVC','ช่างบริการ','month',18000,'','',''],
    ['ปาริชาติ รับเรื่อง','SVC','ผู้รับแจ้งซ่อม','month',14000,'parichat','',''],
    ['เกรียงไกร ปลอดภัย','SHE','จป.วิชาชีพ','month',35000,'kriangkrai','ใบอนุญาต จป.วิชาชีพ',500],
  ];
  C.staff=ST.map(([name,dept,role,wtype,wage,mail,lic,exp],i)=>({id:uid(),code:'E'+pad(i+1),name,dept,role,email:mail?mail+'@orion-air.co.th':'',phone:'08-'+(1000+i*37)+'-'+(2000+i*11),
    start:addD(td,-(i<4?280:250-i*5)),wtype,wage,proj:'',lic,licExp:exp?addD(td,exp):'',sk:{},active:true}));
  const by=nm=>C.staff.find(s=>s.name===nm);
  C.adminMails='thanaphon@orion-air.co.th, supaporn@orion-air.co.th';

  // skills: everyone gets an assessment close to their role's required level; a few gaps on purpose
  C.staff.forEach((s,k)=>{reqSkills(s).forEach((x,i)=>s.sk[x.k]=Math.max(1,Math.min(4,x.req-((i+k)%6===2?1:0)+((i+k)%11===5?1:0))));s.kpi=70+((k*7)%25);s.beh=75+((k*5)%20)});
  const al=(nm,i)=>{const s=by(nm);if(s&&A[i])s['a_'+A[i].id]=true};
  ['ธนพล วงศ์ใหญ่','กิตติศักดิ์ ภูมิใจ','สมชาย ใจดี'].forEach(n=>al(n,1));al('ดร.อภิชาติ ศรีวิศว',2);
  ['พงศกร มีสุข','ศุภชัย ไฟฟ้างาม','อรวรรณ ตั้งมั่น','วิทยา แก้วกล้า','ปกรณ์ สุขสันต์'].forEach(n=>al(n,0));al('ประยุทธ มั่นคง',3);al('สุรชัย ทองแท้',3);al('อนุชา ทองดี',4);al('ชาญณรงค์ ซ่อมเก่ง',4);

  // projects: same sample building BOQ, scaled per job
  const base=DEMO.items.map(x=>x.slice()),bs={sub:DEMO.sub,ohp:DEMO.ohp,vat:DEMO.vat,grand:DEMO.grand,name:DEMO.name};
  const mkP=(o,f)=>{DEMO.items=base.map(x=>{const y=x.slice();y[5]=Math.max(1,Math.round(x[5]*f));y[8]=Math.round(y[5]*(x[6]+x[7]));return y});
    DEMO.sub=Math.round(sum(DEMO.items,x=>x[8]));DEMO.ohp=Math.round(DEMO.sub*0.1);DEMO.vat=Math.round((DEMO.sub+DEMO.ohp)*0.07);DEMO.grand=DEMO.sub+DEMO.ohp+DEMO.vat;DEMO.name=o.name;
    const p=demoProject(o);p.info.company=C.name;return p};
  const fix=(p,pm,eng,fore)=>{p.info.pm=pm;const sw=x=>{for(const k of ['by','who','wit'])if(x&&typeof x[k]==='string')x[k]=x[k].replace('คุณสมชาย','คุณ'+pm.split(' ')[0]).replace('คุณวิทยา','คุณ'+eng.split(' ')[0])};
    ['prs','daily','tc','safe'].forEach(k=>(p[k]||[]).forEach(sw))};
  const P1=mkP({name:'อาคารสำนักงานศรีนคร ทาวเวอร์',client:c[0].name,cust:c[0].id,age:52,no:'OR-CT-2026-004',site:'ถนนพระราม 9 ห้วยขวาง กรุงเทพฯ'},1);fix(P1,'สมชาย ใจดี','วิทยา แก้วกล้า');
  const P2=mkP({name:'โรงงานสยามฟู้ด อาคารผลิต 1',client:c[1].name,cust:c[1].id,age:150,no:'OR-CT-2026-002',site:'นิคมฯ บางปู สมุทรปราการ'},1.6);fix(P2,'อรวรรณ ตั้งมั่น','ปกรณ์ สุขสันต์');
  const P3=mkP({name:'โรงพยาบาลรักษ์สุขภาพ ปรับปรุงหอผู้ป่วยชั้น 4',client:c[2].name,cust:c[2].id,age:235,no:'OR-CT-2026-001',site:'ถนนงามวงศ์วาน นนทบุรี'},0.6);fix(P3,'สมชาย ใจดี','วิทยา แก้วกล้า');
  const P4=mkP({name:'โรงเรียนดวงดาววิทยา อาคารเรียนใหม่',client:c[4].name,cust:c[4].id,age:10,no:'OR-CT-2026-006',site:'ถนนบางนา-ตราด กม.8 สมุทรปราการ'},0.85);fix(P4,'อรวรรณ ตั้งมั่น','ปกรณ์ สุขสันต์');
  Object.assign(DEMO,bs,{items:base});
  // P3 is finished and handed over: everything done, paid, closed
  P3.tasks.forEach(t=>t.pct=100);P3.info.handover=P3.info.finish;P3.bills.forEach(b=>{b.status='paid';b.paid=b.paid||addD(b.date,30)});
  P3.punch.forEach(r=>{r.status='done';r.done=addD(r.due,-1)});P3.om.forEach(r=>r.status='done');P3.rfis.forEach(r=>{r.status='closed';r.ans=r.ans||'อนุมัติตามที่เสนอ';r.ansDate=r.ansDate||addD(r.date,5)});
  P3.vos.forEach(v=>v.status='ok');P3.pos.forEach(po=>{po.paid=true;po.paidDate=po.paidDate||addD(po.due,30);po.dl=po.items.map(l=>({id:uid(),date:po.due,ref:'DO-'+po.no.slice(-3),line:l.id,q:l.q}))});
  P3.tc.forEach(r=>{r.res='pass';r.date=r.date||addD(P3.info.finish,-10)});P3.tabA.forEach(r=>{r.meas=r.meas||Math.round(r.design*1.02);r.date=r.date||addD(P3.info.finish,-8)});
  P3.subm.forEach(r=>{if(r.status==='pending'||r.status==='C'){r.status='A';r.ret=r.ret||addD(r.date,10)}});
  P3.war.forEach(w=>w.start=P3.info.handover);
  // P4 just started: nothing billed yet beyond the advance
  P4.bills=P4.bills.filter(b=>b.kind==='adv');P4.bills.forEach(b=>{b.status='sent';b.paid=''});P4.daily=P4.daily.slice(-1);P4.punch=[];P4.tc.forEach(r=>{r.res='';r.date=''});P4.tabA.forEach(r=>{r.meas=0;r.date=''});P4.tabW.forEach(r=>{r.meas=0;r.date=''});P4.rfis=P4.rfis.slice(-1);P4.vos=[];
  [P3,P2,P1,P4].forEach(p=>DB.projects[p.id]=p);delete DB.projects[Object.keys(DB.projects).find(k=>![P1,P2,P3,P4].some(p=>p.id===k))];
  DB.cur=P1.id;P=P1;

  // who works where + 3 weeks of timesheets for the site crew
  const crew={[P1.id]:['สมชาย ใจดี','วิทยา แก้วกล้า','ประยุทธ มั่นคง','บุญมี ศรีสุข','สมศักดิ์ พรมมา','นันทนา ใจเย็น'],[P2.id]:['อรวรรณ ตั้งมั่น','ปกรณ์ สุขสันต์','สุรชัย ทองแท้','อนุชา ทองดี','ไพโรจน์ คงเจริญ'],[P4.id]:['เอกชัย บุญรอด']};
  Object.entries(crew).forEach(([pid,names])=>names.forEach(nm=>by(nm).proj=pid));
  C.ts=[];Object.entries(crew).forEach(([pid,names])=>names.forEach((nm,i)=>{const s=by(nm);if(s.wtype!=='day'&&!/โฟร์แมน/.test(s.role))return;
    for(let k=-21;k<0;k++){const d=addD(td,k);if(pd(d).getDay()===0)continue;C.ts.push({id:uid(),date:d,staff:s.id,proj:pid,h:8+((k+i)%4===0?2:0)+((k+i)%9===0?1:0)})}}));

  // sales pipeline
  const L=[['ระบบปรับอากาศโรงงานอาหาร เฟส 2',1,18500000,'nego',20,'วรรณา','ลูกค้าขอลด 3% รอผู้บริหารอนุมัติ'],
    ['ห้องผ่าตัดความดันบวก 2 ห้อง',2,6400000,'sent',35,'วรรณา','ส่งใบเสนอราคาแล้ว นัดนำเสนอสัปดาห์หน้า'],
    ['ห้องคลีนรูม Class 10,000 สายการผลิต PCB',3,24000000,'survey',75,'ปิยะพงษ์','สำรวจหน้างานแล้ว รอแบบสถาปัตย์'],
    ['ระบบปรับอากาศอาคารเรียนใหม่',4,11650000,'won',-40,'ปิยะพงษ์','เซ็นสัญญาแล้ว = โครงการโรงเรียนดวงดาว'],
    ['เปลี่ยนเครื่อง VRF สำนักงานใหญ่',0,3200000,'lost',-10,'วรรณา','แพ้ราคา คู่แข่งต่ำกว่า 8%'],
    ['ระบบระบายอากาศที่จอดรถคอนโด 32 ชั้น',5,7600000,'quote',28,'ปิยะพงษ์','ถอดแบบอยู่ (ฝ่ายประมาณราคา)'],
    ['ห้อง Data Center 200 kW ระบบ CRAC + ดับเพลิง FM-200',6,15200000,'lead',90,'วรรณา','ได้รายชื่อจากงานสัมมนา']];
  C.leads=L.map(([name,ci,value,stage,d,owner,note])=>({id:uid(),name,cust:c[ci].id,value,stage,prob:'',close:addD(td,d),owner:'คุณ'+owner,note}));
  const q=(ci,title,site,st,d,byN,pick,lead,pj)=>{const Q=Object.assign({id:uid()},NEW.quotes(C.quotes),{cust:c[ci].id,title,site,status:st,by:byN,date:addD(td,d),pj:pj||''});
    qFill(Q,DEMO.items.filter(x=>pick.includes(x[0])).slice(0,24).map(([g,head,type,desc,unit,qq,m,l,t])=>({g,head,type,desc,unit,q:qq,m,l,t})),{src:'PENUM MEP',sub:10,ohp:1.2});C.quotes.push(Q);if(lead!=null)C.leads[lead].quote=Q.id;return Q};
  C.quotes=[];
  q(4,'ระบบปรับอากาศอาคารเรียนใหม่','อาคารเรียน 3 ชั้น','won',-55,'คุณปิยะพงษ์',['eq','pipe','el'],3,P4.id);
  q(2,'ห้องผ่าตัดความดันบวก 2 ห้อง','อาคาร B ชั้น 3','sent',-12,'คุณวรรณา',['eq','duct','el','oth'],1);
  q(1,'ระบบปรับอากาศโรงงานอาหาร เฟส 2','อาคารผลิต 2','sent',-25,'คุณวรรณา',['eq','chw','duct','pipe'],0);
  q(5,'ระบบระบายอากาศที่จอดรถ','อาคารจอดรถ ชั้น B1-B3','draft',-2,'คุณปิยะพงษ์',['duct','el'],5);
  q(0,'เปลี่ยนเครื่อง VRF สำนักงานใหญ่','ชั้น 2-6','lost',-40,'คุณวรรณา',['eq','pipe'],4);

  // after-sales: the hospital job is now under a PM contract with its own equipment list and jobs
  C.svc=[{id:uid(),no:'SV-001',cust:c[2].id,title:'สัญญาบำรุงรักษาระบบปรับอากาศ หอผู้ป่วยชั้น 4',start:P3.info.handover,months:12,visits:4,value:96000,status:'active',note:'ปีแรกหลังส่งมอบ'},
    {id:uid(),no:'SV-002',cust:c[0].id,title:'ล้างแอร์และตรวจเช็ก สำนักงานขายโครงการ',start:addD(td,-120),months:12,visits:6,value:54000,status:'active',note:''},
    {id:uid(),no:'SV-003',cust:c[5].id,title:'ดูแลพัดลมระบายอากาศที่จอดรถ',start:addD(td,-400),months:12,visits:4,value:38000,status:'active',note:'ครบสัญญาแล้ว รอต่อสัญญา'}];
  C.equip=[];P3.boq.items.filter(i=>i.g==='eq'&&/BTU|AHU|Chiller|TR/.test(i.desc+i.head)).slice(0,6).forEach((i,k)=>{for(let j=0;j<Math.min(2,n(i.q));j++)C.equip.push({id:uid(),cust:c[2].id,proj:P3.id,name:(i.type?i.type+' ':'')+i.desc,model:['Daikin','Carrier','Trane','Mitsubishi'][k%4]+' '+['FTKM','42QHF','CVHE','PEAD'][k%4]+'-'+(24+k*12),serial:'SN26'+(10000+k*97+j),loc:['หอผู้ป่วยชั้น 4 โซน A','หอผู้ป่วยชั้น 4 โซน B','ห้องพยาบาล','ห้องเครื่องดาดฟ้า'][(k+j)%4],inst:addD(P3.info.handover,-12),wend:addD(P3.info.handover,365)})});
  const tech=['ชาญณรงค์ ซ่อมเก่ง','วีระ ล้างแอร์','ธีระ เย็นใจ'];
  const TK=[[-20,'pm',2,0,'บำรุงรักษาตามสัญญา ครั้งที่ 1','done',0],[-6,'repair',2,1,'แอร์ห้องพยาบาลไม่เย็น มีน้ำแข็งเกาะคอยล์','done',0],[-2,'repair',0,0,'น้ำหยดจากหัวจ่ายลมห้องประชุมขาย','plan',0],[-1,'install',5,null,'ติดตั้งพัดลมระบายอากาศเพิ่ม 2 ตัว','open',12000],[0,'repair',2,2,'เสียงดังผิดปกติที่ AHU','open',0]];
  C.tickets=TK.map(([d,kind,ci,eq,problem,status,charge],k)=>({id:uid(),no:'JOB-'+pad(k+1,3),date:addD(td,d),kind,cust:c[ci].id,svc:ci===2?C.svc[0].id:ci===0?C.svc[1].id:'',equip:eq!=null&&ci===2&&C.equip[eq]?C.equip[eq].id:'',problem,tech:'คุณ'+tech[k%3].split(' ')[0],due:addD(td,d+2),status,done:status==='done'?addD(td,d+1):'',cost:status==='done'?[1200,850][k%2]:0,charge,note:''}));
  save(true);
  const out=JSON.parse(JSON.stringify(DB));out.photos={};return out;
}
