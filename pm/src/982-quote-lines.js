/* ---------- 4.1 ใบเสนอราคา: type the lines by hand, or pick what we sell from the price library ----------
   A quotation could only get its lines from PENUM MEP or an imported file (user, 2026-10-24: "ไม่มีช่องรายการสินค้าที่เราขาย").
   The lines table on ฝ่ายขาย › ใบเสนอราคา is now editable: name, unit, quantity, material and labour cost per unit and the selling
   price. Under it, "+ เพิ่มรายการ" adds a line to a chosen section; the name box offers the company's price library (co.prices,
   960-price-library.js), and picking one fills the unit and the costs. A line's cost is i.t (qUnit reads it), so a change to the
   quantity or the costs keeps i.t = quantity × cost per unit. Service (PM/MA) quotes keep their own card (981). */
const QL_G=()=>[...Object.entries(BOQ_G),['mat','วัสดุก่อสร้างทั่วไป']];
// 4.9 the air-con section by system (user: "ระบบปรับอากาศ ควรแยกไหม เช่น CHILLER, VRF"): a second box picks the system, the
// suggestions show only its products, and the line keeps the system in i.head, so the printout gets a sub-heading per system.
// A product's system comes from its name (checked in this order); a past quote line keeps the one it was added under.
const QL_SYS=[['vrf','ระบบ VRF / VRV',/vrf|vrv|refnet|branch joint/i],['package','ระบบแพ็คเกจ (Package / Rooftop)',/package|rooftop|แพ็คเกจ/i],
  ['split','ระบบแยกส่วน (Split Type)',/split|แอร์|เครื่องปรับอากาศ|cassette|floor standing|wall type|ceiling type|support (fcu|cdu)/i],
  ['chiller','ระบบชิลเลอร์ (Chiller)',/chiller|ชิลเลอร์|\bahu\b|\bfcu\b|fan coil|cooling tower|หอผึ่งเย็น|ปั๊มน้ำ|น้ำเย็น/i],
  ['vent','ระบบระบายอากาศ (Ventilation)',/พัดลม|\bfan\b|exhaust|ระบายอากาศ|\berv\b|fresh air|อากาศบริสุทธิ์/i]];
const qlSys=x=>{if(x.sys)return x.sys;const t=[x.name,x.br].filter(Boolean).join(' '),r=QL_SYS.find(y=>y[2].test(t));return r?r[0]:''};
const qlSysL=k=>(QL_SYS.find(y=>y[0]===k)||[])[1]||'';
const qlLab=x=>[x.name,x.br].filter(Boolean).join(' · ');
// 4.3 sample products with assumed prices (material, labour per unit, excl. VAT) for the sections MEP has no rates for; ORIEN
// should replace them with real prices. They also go into the price library with "ราคาตัวอย่าง".
const QL_SEED=[
 ['cctv','กล้อง IP Dome 2MP','ตัว',1800,350],['cctv','กล้อง IP Bullet 4MP','ตัว',2900,400],['cctv','กล้อง IP PTZ 4MP','ตัว',18500,1500],['cctv','เครื่องบันทึก NVR 8 ช่อง','เครื่อง',4800,800],
 ['cctv','เครื่องบันทึก NVR 16 ช่อง','เครื่อง',8500,1000],['cctv','เครื่องบันทึก NVR 32 ช่อง','เครื่อง',18000,1500],['cctv','ฮาร์ดดิสก์สำหรับกล้อง 4TB','ลูก',3600,100],['cctv','ฮาร์ดดิสก์สำหรับกล้อง 8TB','ลูก',7200,100],
 ['cctv','PoE Switch 8 พอร์ต','ตัว',2900,300],['cctv','PoE Switch 16 พอร์ต','ตัว',6500,400],['cctv','จอแสดงผล 32 นิ้ว','เครื่อง',5500,500],['cctv','สาย LAN CAT6 (กล้อง)','ม.',16,12],['cctv','ท่อ EMT / ท่อร้อยสายกล้อง','ม.',35,40],
 ['cctv','ตู้ Rack 9U','ตู้',3500,800],['cctv','UPS 1 kVA','เครื่อง',3200,300],['cctv','ตั้งค่าระบบและดูผ่านมือถือ','ระบบ',0,3500],
 ['fa','ตู้ควบคุมแจ้งเหตุเพลิงไหม้ Conventional 4 โซน','ตู้',18000,3000],['fa','ตู้ควบคุมแจ้งเหตุเพลิงไหม้ Addressable 1 Loop','ตู้',85000,8000],['fa','อุปกรณ์ตรวจจับควัน (Smoke Detector)','ตัว',650,250],
 ['fa','อุปกรณ์ตรวจจับความร้อน (Heat Detector)','ตัว',550,250],['fa','อุปกรณ์แจ้งเหตุด้วยมือ (Manual Station)','ตัว',900,250],['fa','กระดิ่งแจ้งเหตุ (Fire Bell)','ตัว',1100,300],['fa','เสียงและแสงแจ้งเหตุ (Horn/Strobe)','ตัว',1800,300],
 ['fa','สายทนไฟ FRC 2C × 1.5 sq.mm','ม.',38,25],['fa','แบตเตอรี่สำรองตู้แจ้งเหตุ 12V 7Ah','ลูก',650,50],
 ['com','จุดเต้ารับ LAN CAT6 (Outlet)','จุด',450,350],['com','สาย LAN CAT6','ม.',16,12],['com','Patch Panel 24 พอร์ต CAT6','ชุด',2800,800],['com','Switch 24 พอร์ต Gigabit','ตัว',5500,500],
 ['com','จุดกระจายสัญญาณ Wi-Fi (Access Point)','ตัว',3900,600],['com','ตู้ Rack 27U','ตู้',12000,1500],['com','สายใยแก้วนำแสง (Fiber Optic) 6 Core','ม.',28,20],['com','จุดเต้ารับโทรศัพท์','จุด',250,250],
 ['com','จุดเต้ารับทีวี (MATV Outlet)','จุด',300,300],['com','เครื่องขยายสัญญาณทีวี (MATV Amplifier)','ชุด',6500,1500],['com','สายนำสัญญาณ RG6','ม.',12,10],
 ['acc','เครื่องสแกนใบหน้า / ลายนิ้วมือ','เครื่อง',6500,800],['acc','เครื่องอ่านบัตร (Key Card Reader)','เครื่อง',2500,500],['acc','กลอนแม่เหล็กไฟฟ้า (Magnetic Lock) 600 lbs','ชุด',2200,800],
 ['acc','สวิตช์ออก (Exit Switch)','ตัว',350,200],['acc','ชุดควบคุมประตู (Door Controller)','ชุด',4500,800],['acc','บัตร Key Card','ใบ',25,0],['acc','ประตูหมุน (Turnstile)','ชุด',65000,8000],
 ['pa','เครื่องขยายเสียงพร้อมมิกเซอร์ 240W','เครื่อง',9500,1000],['pa','ลำโพงฝังฝ้า 6 นิ้ว','ตัว',650,250],['pa','ลำโพงฮอร์น 30W','ตัว',1200,350],['pa','ไมโครโฟนประกาศ (Paging Microphone)','ตัว',3500,300],['pa','สายลำโพง 2 × 1.5 sq.mm','ม.',15,12],
 ['bms','ชุดควบคุม DDC Controller','ชุด',35000,5000],['bms','เซนเซอร์อุณหภูมิและความชื้น','ตัว',3500,600],['bms','ซอฟต์แวร์และคอมพิวเตอร์ควบคุม BMS','ระบบ',150000,20000],['bms','ตั้งโปรแกรมและทดสอบระบบ BMS','จุด',0,800],
 ['lp','หัวล่อฟ้า ESE','ชุด',38000,6000],['lp','เสาล่อฟ้าพร้อมขาจับ','ชุด',6500,2500],['lp','สายตัวนำลงดิน ทองแดงเปลือย 50 sq.mm','ม.',320,80],['lp','หลักดินทองแดง 5/8" × 10 ฟุต','ต้น',650,350],
 ['lp','กล่องทดสอบค่าความต้านทานดิน (Test Box)','ชุด',1500,300],['lp','วัดค่าความต้านทานดินพร้อมรายงาน','ครั้ง',0,3500],
 ['genr','เครื่องกำเนิดไฟฟ้าดีเซล 100 kVA พร้อมตู้เก็บเสียง','ชุด',650000,35000],['genr','ตู้สลับไฟอัตโนมัติ (ATS) 200A','ตู้',85000,8000],['genr','UPS 10 kVA','เครื่อง',95000,5000],['genr','UPS 3 kVA','เครื่อง',22000,2000],
 ['sol','แผงโซลาร์เซลล์ 550W','แผง',3200,600],['sol','อินเวอร์เตอร์ On-Grid 10 kW','เครื่อง',48000,5000],['sol','โครงยึดแผงบนหลังคา','kWp',2500,1500],['sol','สายไฟ DC และอุปกรณ์ป้องกัน','kWp',1800,800],['sol','ขออนุญาตขนานไฟกับการไฟฟ้า','งาน',0,15000],
 ['wwt','ถังบำบัดน้ำเสียสำเร็จรูป 1,600 ลิตร','ถัง',12000,4000],['wwt','ถังบำบัดน้ำเสียสำเร็จรูป 3,000 ลิตร','ถัง',22000,6000],['wwt','ปั๊มจุ่มน้ำเสีย 0.75 kW','ตัว',9500,2000],['wwt','เครื่องเติมอากาศ (Air Blower)','เครื่อง',8500,1500],
 ['mg','จุดจ่ายก๊าซออกซิเจน (Outlet O2)','จุด',6500,1500],['mg','จุดสุญญากาศ (Vacuum Outlet)','จุด',6500,1500],['mg','จุดจ่ายอากาศอัด (Medical Air Outlet)','จุด',6500,1500],['mg','ตู้วาล์วควบคุมโซน (Zone Valve Box)','ชุด',28000,4000],
 ['mg','สัญญาณเตือนแรงดันก๊าซ (Area Alarm)','ชุด',35000,3000],['mg','ท่อทองแดงทางการแพทย์ 1/2"','ม.',380,250],
 // air conditioners by type and size (one set = indoor + outdoor unit, standard installation)
 ['eq','แอร์ติดผนัง (Wall Type) Inverter 9,000 BTU','ชุด',13500,2500],['eq','แอร์ติดผนัง (Wall Type) Inverter 12,000 BTU','ชุด',16500,2500],['eq','แอร์ติดผนัง (Wall Type) Inverter 18,000 BTU','ชุด',24000,3000],['eq','แอร์ติดผนัง (Wall Type) Inverter 24,000 BTU','ชุด',31000,3500],['eq','แอร์แขวนใต้ฝ้า (Ceiling Type) Inverter 18,000 BTU','ชุด',30000,3500],['eq','แอร์แขวนใต้ฝ้า (Ceiling Type) Inverter 24,000 BTU','ชุด',36000,4000],['eq','แอร์แขวนใต้ฝ้า (Ceiling Type) Inverter 36,000 BTU','ชุด',48000,4500],['eq','แอร์แขวนใต้ฝ้า (Ceiling Type) Inverter 48,000 BTU','ชุด',60000,5000],
 ['eq','แอร์ฝังฝ้า 4 ทิศทาง (Cassette Type) Inverter 18,000 BTU','ชุด',34000,4000],['eq','แอร์ฝังฝ้า 4 ทิศทาง (Cassette Type) Inverter 24,000 BTU','ชุด',40000,4500],['eq','แอร์ฝังฝ้า 4 ทิศทาง (Cassette Type) Inverter 36,000 BTU','ชุด',52000,5000],['eq','แอร์ฝังฝ้า 4 ทิศทาง (Cassette Type) Inverter 48,000 BTU','ชุด',64000,5500],['eq','แอร์ตั้งพื้น (Floor Standing) Inverter 36,000 BTU','ชุด',50000,4500],['eq','แอร์ตั้งพื้น (Floor Standing) Inverter 48,000 BTU','ชุด',62000,5000],['eq','แอร์ตั้งพื้น (Floor Standing) Inverter 60,000 BTU','ชุด',75000,5500],
 // 4.9 products for the VRF, chiller, package and ventilation systems
 ['eq','VRF เครื่องภายใน Cassette 4 ทิศทาง 2.8 kW','เครื่อง',38000,3500],['eq','VRF เครื่องภายใน Ceiling Concealed (Duct) 5.6 kW','เครื่อง',42000,4500],['eq','VRF เครื่องภายใน Wall Type 2.2 kW','เครื่อง',26000,3000],['eq','VRF ข้อต่อแยกน้ำยา (Refnet / Branch joint)','ชุด',2800,600],['eq','VRF รีโมทคอนโทรลแบบมีสาย','ชุด',3500,500],['eq','VRF ชุดควบคุมส่วนกลาง (Central Controller)','ชุด',45000,5000],
 ['eq','Fan Coil Unit (FCU) ระบบน้ำเย็น 400 CFM','เครื่อง',18000,3500],['eq','Fan Coil Unit (FCU) ระบบน้ำเย็น 800 CFM','เครื่อง',26000,4000],['eq','ปั๊มน้ำเย็น (CHW Pump) 15 kW','ชุด',185000,25000],['eq','ชุดควบคุมชิลเลอร์ (Chiller Plant Manager)','ชุด',350000,40000],['eq','Package Rooftop 10 TR','เครื่อง',220000,25000],['eq','Package Rooftop 20 TR','เครื่อง',410000,35000],
 ['eq','พัดลมระบายอากาศติดผนัง 10 นิ้ว','ตัว',1800,500],['eq','พัดลมดูดอากาศติดเพดาน (Ceiling Exhaust Fan)','ตัว',1500,600],['eq','พัดลมระบายอากาศ Inline Duct Fan 8 นิ้ว','ตัว',4500,1200],['eq','พัดลมระบายอากาศ Centrifugal 3,000 CMH','ชุด',28000,4500],['eq','เครื่องเติมอากาศบริสุทธิ์ (ERV) 500 CMH','ชุด',38000,5000],
 // 4.11 drain pumps (กาลักน้ำแอร์) and split-type accessories
 ['eq','Drain Pump (กาลักน้ำแอร์) แบบติดใต้เครื่อง สำหรับแอร์ไม่เกิน 24,000 BTU','ชุด',2200,800],['eq','Drain Pump (กาลักน้ำแอร์) แบบมินิซ่อนในราง สำหรับแอร์ติดผนัง','ชุด',2800,800],['eq','Drain Pump (กาลักน้ำแอร์) แบบถัง สำหรับแอร์ไม่เกิน 60,000 BTU','ชุด',4500,1000],
 ['eq','ขาแขวนคอยล์ร้อนแอร์ (Wall Bracket)','ชุด',650,350],['eq','ยางรองกันสั่นคอยล์ร้อนแอร์','ชุด',450,150],['eq','รางครอบท่อแอร์ (Duct Cover) พร้อมข้อต่อ','ม.',180,80],
 ['pipe','ชุดท่อน้ำยาแอร์ทองแดงพร้อมฉนวน 1/4"-3/8" (ไม่เกิน 12,000 BTU)','ม.',280,120],['pipe','ชุดท่อน้ำยาแอร์ทองแดงพร้อมฉนวน 1/4"-1/2" (18,000 BTU)','ม.',340,130],['pipe','ชุดท่อน้ำยาแอร์ทองแดงพร้อมฉนวน 3/8"-5/8" (24,000-36,000 BTU)','ม.',450,150],['pipe','ท่อน้ำทิ้งแอร์ PVC 3/4" หุ้มฉนวน','ม.',85,60],
 ['el','เบรกเกอร์แอร์ 20A พร้อมกล่อง','ชุด',450,200],['el','สายไฟแอร์ VCT 3×2.5 sq.mm','ม.',45,25],
 // 4.12 copper tube by size: coils (ท่อทองแดงแบบม้วน, per 15 m roll), Type L straight lengths and insulation per metre
 ['pipe','ท่อทองแดงแบบม้วน (Coil) 1/4" ยาว 15 ม.','ม้วน',900,600],['pipe','ท่อทองแดงแบบม้วน (Coil) 3/8" ยาว 15 ม.','ม้วน',1400,750],['pipe','ท่อทองแดงแบบม้วน (Coil) 1/2" ยาว 15 ม.','ม้วน',1900,900],['pipe','ท่อทองแดงแบบม้วน (Coil) 5/8" ยาว 15 ม.','ม้วน',2500,1050],['pipe','ท่อทองแดงแบบม้วน (Coil) 3/4" ยาว 15 ม.','ม้วน',3200,1200],['pipe','ท่อทองแดงแบบม้วน (Coil) 7/8" ยาว 15 ม.','ม้วน',4200,1350],
 ['pipe','ท่อทองแดง Type L แบบเส้นตรง 3/8"','ม.',120,50],['pipe','ท่อทองแดง Type L แบบเส้นตรง 1/2"','ม.',170,55],['pipe','ท่อทองแดง Type L แบบเส้นตรง 5/8"','ม.',230,60],['pipe','ท่อทองแดง Type L แบบเส้นตรง 3/4"','ม.',290,70],['pipe','ท่อทองแดง Type L แบบเส้นตรง 7/8"','ม.',360,80],['pipe','ท่อทองแดง Type L แบบเส้นตรง 1-1/8"','ม.',520,100],['pipe','ท่อทองแดง Type L แบบเส้นตรง 1-3/8"','ม.',720,120],['pipe','ท่อทองแดง Type L แบบเส้นตรง 1-5/8"','ม.',950,140],
 ['pipe','ฉนวนหุ้มท่อน้ำยา หนา 3/4" สำหรับท่อ 1/4"','ม.',35,15],['pipe','ฉนวนหุ้มท่อน้ำยา หนา 3/4" สำหรับท่อ 3/8"','ม.',40,15],['pipe','ฉนวนหุ้มท่อน้ำยา หนา 3/4" สำหรับท่อ 1/2"','ม.',45,15],['pipe','ฉนวนหุ้มท่อน้ำยา หนา 3/4" สำหรับท่อ 5/8"','ม.',55,18],['pipe','ฉนวนหุ้มท่อน้ำยา หนา 3/4" สำหรับท่อ 3/4"','ม.',60,18],['pipe','ฉนวนหุ้มท่อน้ำยา หนา 3/4" สำหรับท่อ 7/8"','ม.',70,20],['pipe','ฉนวนหุ้มท่อน้ำยา หนา 3/4" สำหรับท่อ 1-1/8"','ม.',85,22],
 // 4.13 sizes asked for later (appended, so the earlier keys stay)
 ['eq','แอร์ติดผนัง (Wall Type) Inverter 30,000 BTU','ชุด',38000,4000],['eq','Drain Pump (กาลักน้ำแอร์) แบบติดใต้เครื่อง สำหรับแอร์ไม่เกิน 36,000 BTU','ชุด',3200,900]];
const qlSeedRows=()=>QL_SEED.map(([g,name,unit,m,l],k)=>({key:'ql:'+g+k,g,name,unit,m,l}));
{const f=ACT.plSeed;if(f)ACT.plSeed=()=>{try{plMerge(qlSeedRows(),{src:'ราคาสมมติ (ตัวอย่าง ORIEN)',sk:'demo',keep:1})}catch(e){}return f()}}
// what can be picked: the price library (or MEP's sample rates while it is empty), sample products not in it yet, then lines sold on
// earlier quotations; each keeps its section (g) so the list follows the section chosen
const qlLib=()=>{let L=[];try{L=typeof plCfg==='function'?plCfg():[];if(!L.length&&typeof plSeedRows==='function')L=plSeedRows()}catch(e){L=[]}
  const seen=new Set(L.map(x=>qlLab(x))),R=L.slice();qlSeedRows().forEach(x=>{if(!seen.has(x.name)){seen.add(x.name);R.push(Object.assign(x,{seed:1}))}});
  CO().quotes.slice().reverse().forEach(q=>(q.items||[]).forEach(i=>{const k=String(i.desc||'').trim();if(!k||seen.has(k)||!(n(i.m)+n(i.l)))return;seen.add(k);R.push({name:k,g:i.g,unit:i.unit||'',m:n(i.m),l:n(i.l),past:1,sys:(QL_SYS.find(y=>y[1]===i.head)||[])[0]})}));return R};
// one datalist per section (and one with everything); ids by position, since a section key can be any text
const qlDl=(L,gs)=>{const ix={},o=x=>`<option value="${esc(qlLab(x))}">${esc([x.unit,n(x.m)+n(x.l)?fmt(n(x.m)+n(x.l),2):'',x.seed?'ราคาตัวอย่าง':x.past?'เคยเสนอ':'',/ต่อนิ้ว/.test(x.unit||'')?'(ราคาต่อเมตรต่อ 1 นิ้ว ใช้คำนวณใน MEP)':''].filter(Boolean).join(' · '))}</option>`;
  const ac=s=>L.filter(x=>(x.g||'')==='eq'&&qlSys(x)===s);
  gs.forEach((g,k)=>ix[g]='qlL'+k);return {id:(g,s)=>S.sel.qlAll?'qlLall':g==='eq'&&s?'qlLs_'+s:ix[g]||'qlLall',html:gs.map(g=>`<datalist id="${ix[g]}">${L.filter(x=>(x.g||'')===g).slice(0,1500).map(o).join('')}</datalist>`).join('')+QL_SYS.map(([s])=>`<datalist id="qlLs_${s}">${ac(s).map(o).join('')}</datalist>`).join('')+`<datalist id="qlLall">${L.slice(0,3000).map(o).join('')}</datalist>`,
    count:(g,s)=>S.sel.qlAll?L.length:g==='eq'&&s?ac(s).length:L.filter(x=>(x.g||'')===g).length}};
const qlPh=k=>k?`พิมพ์ชื่อสินค้า หรือเลือกจากรายการ${S.sel.qlAll?'ทุกหมวด':'ของหมวดนี้'} (${fmt(k)} รายการ)`:'หมวดนี้ยังไม่มีสินค้าในคลัง พิมพ์ชื่อเองได้ หรือติ๊ก “ค้นทุกหมวด”';
// the section picker switches the suggestions without redrawing the page
document.addEventListener('change',e=>{const t=e.target;if(!t||(t.id!=='qlG'&&t.id!=='qlAll'&&t.id!=='qlS'))return;
  if(t.id==='qlAll'){S.sel.qlAll=t.checked;render();return}
  let o=t.selectedOptions&&t.selectedOptions[0];const i=$('#qlName'),sy=$('#qlS');
  if(t.id==='qlS')S.sel.qlS=t.value;else{S.sel.qlG=t.value;if(sy){sy.style.display=t.value==='eq'?'':'none';if(t.value==='eq')o=sy.selectedOptions[0]}}if(i&&o&&o.dataset.dl){i.setAttribute('list',o.dataset.dl);i.placeholder=qlPh(+o.dataset.n)}});
// 4.16 the แยกค่าเครื่อง tick sits right above the lines table, next to the เครื่อง column it works with (user could not find it among
// the print options: "หาจุดติ๊กไม่เจอ")
const qlEqBar=(Q,b)=>{if(typeof QM_WHT==='undefined')return '';const f0=qForm(Q),off=Q.look==='xl'||f0==='G'||f0==='E';
  return `<div class="ql-eq"><label><input type="checkbox" data-t="chk" data-p="${b}.eqSep"${Q.eqSep?' checked':''}${off?' disabled':''}> <b>แยกค่าเครื่อง</b>ตอนพิมพ์: ค่าเครื่อง / ค่าวัสดุ / ค่าแรง (ค่าเครื่องไม่โดนหัก ณ ที่จ่าย 3%)</label>
    ${Q.eqSep&&!off&&typeof QM_DOC!=='undefined'?`<label>พิมพ์เป็น<select data-p="${b}.eqDoc">${QM_DOC.map(([x,l])=>`<option value="${x}"${(Q.eqDoc||'')===x?' selected':''}>${l}</option>`).join('')}</select></label>`:''}
    ${Q.eqSep&&!off?`<label>หัก ณ ที่จ่าย 3% คิดจาก<select data-p="${b}.whtB">${QM_WHT.map(([x,l])=>`<option value="${x}"${(Q.whtB||'')===x?' selected':''}>${l}</option>`).join('')}</select></label>`:''}
    <small>${off?'ใช้ได้กับหน้าตาเอกสาร ORIEN Modern ที่ไม่ใช่ BOQ-G (ปร.4) / BOQ-E':'รายการไหนเป็นเครื่อง ติ๊กในช่อง “เครื่อง” ด้านขวาของตาราง'}</small></div>`};
// 4.29 the selling price of every line, in plain view next to its cost (user: "ตอนนี้เราเห็นแต่ต้นทุน ไม่เห็นราคาแต่ละรายการ เห็นแค่ตอนปริ้น").
// A blank box shows the price worked out from the cost and the markup; a typed price overrides it, and ⟲ goes back to the worked-out one.
// กำไร = (selling − cost) of the line, before the extras rows, the discount and VAT.
const qlSpOn=i=>i.sp!==''&&i.sp!=null&&n(i.sp)>0;
const qlSell=(Q,i,b,u)=>{const q=n(i.q),cu=n(i.m)+n(i.l)||n(i.t)/(q||1e-9),pr=(u-cu)*q,pc=u?(u-cu)*100/u:0,own=qlSpOn(i),
    c=pr<0?'var(--danger,#c0392b)':pc<10?'var(--warn-c,#b7791f)':'var(--good,#1e8e5a)';
  return `<td class="qsell" style="width:130px"><input class="r qsp${own?' own':''}" data-t="num" data-p="${b}.items.${i.id}.sp" value="${own?i.sp:''}" placeholder="${fmt(u,2)}" aria-label="ราคาขายต่อหน่วย" title="${own?'ราคาที่พิมพ์เอง':'คิดจากต้นทุน + '+esc(qMkTxt(Q))+' (พิมพ์ราคาเองได้)'}">
    <small class="qsp-t">${own?`พิมพ์เอง <button type="button" class="x" data-a="qlSpClr" data-id="${Q.id}" data-i="${i.id}" title="กลับไปคิดอัตโนมัติจาก % บวกเพิ่ม" aria-label="กลับไปคิดราคาอัตโนมัติ">⟲</button>`:'อัตโนมัติ'}</small></td>
    <td class="r qsell" style="white-space:nowrap"><b>${fmt(q*u,2)}</b></td>
    <td class="r" style="white-space:nowrap;color:${c}">${q&&(cu||u)?`${fmt(pr,0)}<small style="display:block">${fmt(pc,1)}%</small>`:'–'}</td>`};
ACT.qlSpClr=b=>{const Q=CO().quotes.find(q=>q.id===b.dataset.id),i=Q&&Q.items.find(x=>x.id===b.dataset.i);if(!i)return;i.sp='';save();render()};
function qlTable(Q){const b=`co.quotes.${Q.id}`,L=qlLib(),G0=QL_G().map(x=>x[0]),GA=[...new Set([...G0,...Q.items.map(i=>i.g),...L.map(x=>x.g||'')])],D=qlDl(L,GA);let lg=null;
  let lh=null;const nb=(k,d)=>{const i=Q.items[k];if(i.hs)return -1;for(let j=k+d;j>=0&&j<Q.items.length;j+=d){const x=Q.items[j];if(x.hs||x.g!==i.g||(x.head||'')!==(i.head||''))return -1;return j}return -1},
    mv=(i,k,d)=>`<button type="button" class="x qlmv" data-a="qlMv" data-id="${Q.id}" data-i="${i.id}" data-d="${d}" aria-label="${d<0?'เลื่อนขึ้น':'เลื่อนลง'}" title="${d<0?'เลื่อนขึ้น':'เลื่อนลง'}"${nb(k,d)<0?' disabled':''}>${d<0?'▲':'▼'}</button>`;
  const rows=Q.items.map((i,k)=>{const ng=i.g!==lg,h=(ng?`<tr class="grp"><td colspan="10">${esc(gName(i.g))}${qlHsBox(Q,i.g)}</td></tr>`:'')+(i.head&&(ng||i.head!==lh)?`<tr class="grp"><td colspan="10" style="padding-left:24px;font-weight:600;opacity:.85">${esc(i.head)}</td></tr>`:'');lg=i.g;lh=i.head||'';const u=qUnit(Q,i),pre=i.hs?(i.hsm?'ราคาที่พิมพ์เอง (ลบราคาออก = คิดอัตโนมัติ)':`คิดอัตโนมัติ ${fmtq(qlHsP(Q,i.g))}% ของค่าวัสดุ + ค่าแรงในหมวด (ไม่รวมค่าเครื่อง)`):i.type||'';
    return h+`<tr><td style="min-width:240px">${pre?`<small class="muted" style="display:block">${esc(pre)}</small>`:''}<input data-p="${b}.items.${i.id}.desc" value="${esc(i.desc||'')}" list="${D.id(i.g)}" placeholder="ชื่อสินค้า / รายการ" aria-label="รายการ"></td>
    <td style="width:86px"><input data-p="${b}.items.${i.id}.unit" value="${esc(i.unit||'')}" aria-label="หน่วย"></td><td style="width:86px"><input class="r" data-t="num" data-p="${b}.items.${i.id}.q" value="${n(i.q)}" aria-label="จำนวน"></td>
    <td style="width:110px"><input class="r" data-t="num" data-p="${b}.items.${i.id}.m" value="${n(i.m)||''}" placeholder="0" aria-label="ค่าของต่อหน่วย"></td><td style="width:100px"><input class="r" data-t="num" data-p="${b}.items.${i.id}.l" value="${n(i.l)||''}" placeholder="0" aria-label="ค่าแรงต่อหน่วย"></td>
    ${qlSell(Q,i,b,u)}
    <td class="c"><input type="checkbox" data-t="chk" data-p="${b}.items.${i.id}.eqp"${typeof qmIsEq==='function'&&qmIsEq(i)?' checked':''} aria-label="ค่าเครื่อง"></td><td style="white-space:nowrap">${i.hs?'':mv(i,k,-1)+mv(i,k,1)}<button type="button" class="x" data-a="delRow" data-c="${b}.items" data-id="${i.id}" aria-label="ลบ">✕</button></td></tr>`}).join('');
  const gs=QL_G(),last=Q.items.length?Q.items[Q.items.length-1].g:(S.sel.qlG||'eq'),gsel=S.sel.qlG||last;
  return `${qlEqBar(Q,b)}<div class="tw" style="max-height:620px;overflow:auto"><table class="ql-t"><thead><tr><th>รายการ</th><th>หน่วย</th><th class="r">จำนวน</th><th class="r" title="ต้นทุนค่าของต่อหน่วย">ทุนของ/หน่วย</th><th class="r" title="ต้นทุนค่าแรงต่อหน่วย">ทุนแรง/หน่วย</th><th class="r qsell" title="ราคาที่ลูกค้าเห็นในใบเสนอราคา ต่อหน่วย พิมพ์เองได้ (ทับ % บวกเพิ่ม)">ราคาขาย/หน่วย</th><th class="r qsell" title="ราคาขาย × จำนวน">รวมราคาขาย</th><th class="r" title="ราคาขาย − ต้นทุน ของรายการนี้">กำไร</th><th class="c" title="ติ๊ก = ค่าเครื่อง (ไม่โดนหัก ณ ที่จ่าย 3% เมื่อเลือกแยกค่าเครื่องตอนพิมพ์)">เครื่อง</th><th></th></tr></thead>
    <tbody>${rows||'<tr><td colspan="10" class="empty">ยังไม่มีรายการ พิมพ์หรือเลือกสินค้าในช่องด้านล่าง แล้วกด “+ เพิ่มรายการ”</td></tr>'}</tbody></table></div>
  <div class="ql-add"><select id="qlG" aria-label="หมวด">${gs.map(([k,l])=>`<option value="${k}" data-dl="${D.id(k,k==='eq'?S.sel.qlS:'')}" data-n="${D.count(k,k==='eq'?S.sel.qlS:'')}"${k===gsel?' selected':''}>${esc(l)}</option>`).join('')}${Q.items.some(i=>!BOQ_G[i.g]&&i.g!=='mat')?[...new Set(Q.items.map(i=>i.g).filter(g=>!BOQ_G[g]&&g!=='mat'))].map(g=>`<option value="${esc(g)}" data-dl="${D.id(g)}" data-n="${D.count(g)}"${g===gsel?' selected':''}>${esc(gName(g))}</option>`).join(''):''}</select>
    <select id="qlS" aria-label="ระบบปรับอากาศ"${gsel==='eq'?'':' style="display:none"'}><option value="" data-dl="${D.id('eq')}" data-n="${D.count('eq')}">ทุกระบบ</option>${QL_SYS.map(([s,l])=>`<option value="${s}" data-dl="${D.id('eq',s)}" data-n="${D.count('eq',s)}"${S.sel.qlS===s?' selected':''}>${esc(l)}</option>`).join('')}</select>
    <input id="qlName" list="${D.id(gsel,gsel==='eq'?S.sel.qlS:'')}" placeholder="${qlPh(D.count(gsel,gsel==='eq'?S.sel.qlS:''))}" aria-label="ชื่อสินค้าหรือรายการ"><input id="qlQ" class="r" inputmode="decimal" value="1" aria-label="จำนวน" style="width:80px">
    <button type="button" class="btn sm pri" data-a="qlAdd" data-id="${Q.id}">+ เพิ่มรายการ</button><label class="chk" style="display:flex;gap:4px;align-items:center;font-size:13px"><input type="checkbox" id="qlAll"${S.sel.qlAll?' checked':''}> ค้นทุกหมวด</label>
    <span class="hint" style="margin:0">ราคาขายว่างไว้ = ต้นทุน (ของ+แรง) บวก ${qMkTxt(Q)} พิมพ์ราคาขายเองได้ในช่องราคาขาย/หน่วย · ราคาทุนมาจากคลังราคากลางและรายการที่เคยเสนอ (เพิ่มสินค้าในคลังได้ที่ ประมาณราคา › คลังราคากลาง)</span></div>
  ${D.html}<style>.ql-t .qlmv{font-size:11px;padding:3px 5px}.ql-t .qlmv:hover{color:var(--accent,#1C8F9B);background:rgba(28,143,155,.12)}.ql-t .qlmv:disabled{opacity:.2;cursor:default;background:none}</style>`}
const qlFind=s=>{const k=String(s||'').trim();if(!k)return null;const L=qlLib();return L.find(x=>qlLab(x)===k)||L.find(x=>x.name===k)||null};
// keep the line's cost (i.t) = quantity × cost per unit
const qlCost=i=>{const u=n(i.m)+n(i.l);if(u)i.t=Math.round(n(i.q)*u*100)/100};
ACT.qlAdd=b=>{const Q=CO().quotes.find(q=>q.id===b.dataset.id);if(!Q)return;const nm=($('#qlName')||{}).value||'',g=($('#qlG')||{}).value||'eq',q=n(($('#qlQ')||{}).value)||1,x=qlFind(nm);
  if(!nm.trim()){toast('พิมพ์ชื่อสินค้าหรือรายการก่อน');const e=$('#qlName');if(e)e.focus();return}
  const sy=g==='eq'?(S.sel.qlS||qlSys(x||{name:nm})):'';
  const it={id:uid(),g,head:qlSysL(sy),type:'',desc:x?qlLab(x):nm.trim(),unit:x?x.unit||'':'',q,m:x?n(x.m):0,l:x?n(x.l):0,t:0,sp:''};qlCost(it);
  // a new line goes after the last line of its section, so sections stay together on the printout
  let k=-1,kh=-1;Q.items.forEach((i,j)=>{if(i.g===g){k=j;if((i.head||'')===it.head)kh=j}});if(kh>=0)k=kh;if(k<0)Q.items.push(it);else Q.items.splice(k+1,0,it);
  S.sel.qlG=g;save();render();setTimeout(()=>{const e=$('#qlName');if(e)e.focus()},30);
  toast(x?`เพิ่ม “${it.desc}” ${x.seed?'ราคาตัวอย่าง แก้เป็นราคาจริงได้ในตาราง':x.past?'ราคาทุนตามที่เคยเสนอ':'ราคาทุนจากคลังราคา'}${it.m+it.l?'':' (ยังไม่มีราคา ใส่ได้ในตาราง)'}`:`เพิ่ม “${it.desc}” แล้ว ใส่หน่วยและราคาในตาราง`)};
// 4.13 ▲ ▼ move a line within its section (and system); the printout follows the order (user: "รายการเลื่อนขึ้นลงไม่ได้")
ACT.qlMv=b=>{const Q=CO().quotes.find(q=>q.id===b.dataset.id);if(!Q)return;const k=Q.items.findIndex(x=>x.id===b.dataset.i),d=+b.dataset.d,j=k+d,i=Q.items[k],x=Q.items[j];
  if(k<0||!x||x.g!==i.g||(x.head||'')!==(i.head||''))return;Q.items[k]=x;Q.items[j]=i;save();render();
  setTimeout(()=>{const e=document.querySelector(`[data-a="qlMv"][data-i="${i.id}"][data-d="${d}"]`)||document.querySelector(`[data-a="qlMv"][data-i="${i.id}"]`);if(e&&!e.disabled)e.focus()},30)};
document.addEventListener('keydown',e=>{if(e.key==='Enter'&&e.target&&(e.target.id==='qlName'||e.target.id==='qlQ')){e.preventDefault();const b=document.querySelector('[data-a="qlAdd"]');if(b)ACT.qlAdd(b)}});
// cost per unit of a line that has only a total (imported lump sums): remembered when its quantity box gets focus
document.addEventListener('focusin',e=>{const p=e.target.dataset&&e.target.dataset.p,m=p&&p.match(/^co\.quotes\.([^.]+)\.items\.([^.]+)\.q$/);if(!m)return;
  const Q=CO().quotes.find(q=>q.id===m[1]),i=Q&&Q.items.find(x=>x.id===m[2]);if(i&&!(n(i.m)+n(i.l))&&n(i.t)&&n(i.q))Object.defineProperty(i,'_uc',{value:n(i.t)/n(i.q),configurable:true,enumerable:false,writable:true})});
HOOK.push((p,v)=>{const m=p.match(/^co\.quotes\.([^.]+)\.items\.([^.]+)\.(q|m|l|desc)$/);if(!m)return;const Q=CO().quotes.find(q=>q.id===m[1]),i=Q&&Q.items.find(x=>x.id===m[2]);if(!i)return;
  if(m[3]==='desc'){const x=qlFind(v);if(x&&!(n(i.m)+n(i.l))&&!n(i.t)){i.unit=i.unit||x.unit||'';i.m=n(x.m);i.l=n(x.l);qlCost(i)}return}
  if(n(i.m)+n(i.l))qlCost(i);else if(m[3]==='q'&&i._uc){i.t=Math.round(i._uc*n(i.q)*100)/100;delete i._uc}});
{const f=salesQuote;salesQuote=function(){const C=CO(),Q=C.quotes.find(q=>q.id===S.sel.quote)||C.quotes.slice().reverse()[0];if(Q&&qlHs(Q))save();let h=f.apply(this,arguments);
  if(!Q||(typeof qmMa==='function'&&qmMa(Q)))return h;
  const t0='<div class="tw" style="max-height:520px;overflow:auto"><table><thead><tr><th>รายการ</th>',e0='<p class="empty">ยังไม่มีรายการ ดึงจาก PENUM MEP หรือนำเข้าจากไฟล์</p>';
  // 4.21 the extras, the discount and the totals follow the last line, under the add bar (user: "เอามาต่อหัวข้อสุดท้าย")
  const cut=k=>{const i=h.indexOf(`<!--${k}-->`),j=h.indexOf(`<!--/${k}-->`);if(i<0||j<i)return '';const x=h.slice(i,j+k.length+8);h=h.slice(0,i)+h.slice(j+k.length+8);return x};
  const ad=cut('qadds'),ds=cut('qdisc'),sm=cut('qsum'),end=`<div class="ql-end">${ad}${Q.eqSep?'':ds.replace('<label>','<label class="ql-disc">')}${sm}${typeof qWrBox==='function'?qWrBox(Q):''}</div>`;
  const a=h.indexOf(t0);if(a>=0){const z=h.indexOf('</tbody></table></div>',a);if(z>0)h=h.slice(0,a)+qlTable(Q)+end+h.slice(z+'</tbody></table></div>'.length)}
  else if(h.includes(e0))h=h.replace(e0,qlTable(Q)+end);
  return h}}
// 4.15 "Hanger Support and Accessory" at the end of every section of a draft quote (user: "อยากให้เพิ่มหัวข้อนี้ไว้ทุกงาน ถ้าไม่เอาให้ติ๊กออกได้").
// One Lot line per section (i.hs), priced at Q.hsp[g] % (default QL_HS_P) of the section's material and labour without the
// equipment, until a price is typed on it (i.hsm). The tick on the section row takes it out (Q.noHs[g]); deleting the line does too.
// Quotes no longer in draft keep their lines and prices as they are.
const QL_HS='Hanger Support and Accessory',QL_HS_P=5;
const qlHsOk=Q=>!!Q&&(!Q.status||Q.status==='draft')&&!(typeof qmMa==='function'&&qmMa(Q));
const qlHsP=(Q,g)=>{const v=(Q.hsp||{})[g];return v===''||v==null?QL_HS_P:n(v)};
const qlHs=Q=>{if(!qlHsOk(Q)||!Array.isArray(Q.items))return false;const was=JSON.stringify(Q.items),off=Q.noHs||{},hs={},R=[];
  Q.items.forEach(i=>{if(i.hs){if(!hs[i.g])hs[i.g]=i}else R.push(i)});
  const gs=[...new Set(R.map(i=>i.g))];
  gs.forEach(g=>{if(off[g])return;let x=hs[g];if(!x)x={id:uid(),g,head:'',type:'',desc:QL_HS,unit:'Lot',q:1,m:0,l:0,t:0,sp:'',hs:1};
    if(!x.hsm){let m=0,l=0;R.forEach(i=>{if(i.g!==g||(typeof qmIsEq==='function'&&qmIsEq(i)))return;const q=n(i.q),a=n(i.m)*q,b=n(i.l)*q;if(a+b){m+=a;l+=b}else m+=n(i.t)});
      const p=qlHsP(Q,g)/100;x.q=n(x.q)||1;x.m=Math.round(m*p/x.q*100)/100;x.l=Math.round(l*p/x.q*100)/100;x.t=Math.round(x.q*(x.m+x.l)*100)/100}
    let k=-1;R.forEach((i,j)=>{if(i.g===g)k=j});R.splice(k+1,0,x)});
  Q.items.splice(0,Q.items.length,...R);return JSON.stringify(Q.items)!==was};
const qlHsBox=(Q,g)=>qlHsOk(Q)?`<span class="qlhs"><label><input type="checkbox" class="qlHsT" data-id="${Q.id}" data-g="${esc(g)}"${(Q.noHs||{})[g]?'':' checked'}> ${QL_HS}</label>${(Q.noHs||{})[g]?'':`<input class="qlHsP r" inputmode="decimal" data-id="${Q.id}" data-g="${esc(g)}" value="${qlHsP(Q,g)}" aria-label="เปอร์เซ็นต์ ${QL_HS}"> %`}</span>`:'';
document.addEventListener('change',e=>{const t=e.target;if(!t||!t.classList||!(t.classList.contains('qlHsT')||t.classList.contains('qlHsP')))return;
  const Q=CO().quotes.find(q=>q.id===t.dataset.id),g=t.dataset.g;if(!Q)return;
  if(t.classList.contains('qlHsT')){Q.noHs=Q.noHs||{};if(t.checked)delete Q.noHs[g];else Q.noHs[g]=1}
  else{Q.hsp=Q.hsp||{};Q.hsp[g]=t.value.trim()===''?'':n(t.value);const x=Q.items.find(i=>i.hs&&i.g===g);if(x)delete x.hsm}
  qlHs(Q);save();render()});
// a price typed on the line keeps it; clearing the price goes back to the automatic one
HOOK.push(p=>{const m=p.match(/^co\.quotes\.([^.]+)\.items\.([^.]+)\.(q|m|l)$/);if(!m)return;const Q=CO().quotes.find(q=>q.id===m[1]),i=Q&&Q.items.find(x=>x.id===m[2]);
  if(!i||!i.hs||m[3]==='q')return;if(n(i.m)+n(i.l))i.hsm=1;else delete i.hsm});
// deleting the line (✕) takes it out of that section, so it does not come back by itself
{const f=ACT.delRow;ACT.delRow=(b,e)=>{const m=String(b.dataset.c||'').match(/^co\.quotes\.([^.]+)\.items$/),Q=m&&CO().quotes.find(q=>q.id===m[1]),x=Q&&Q.items.find(i=>i.id===b.dataset.id&&i.hs);
  f(b,e);if(x&&!Q.items.includes(x)){Q.noHs=Q.noHs||{};Q.noHs[x.g]=1;save();render()}}}
{const f=PRINT.quote;PRINT.quote=function(id){const Q=CO().quotes.find(q=>q.id===id);if(Q&&qlHs(Q))save();return f.apply(this,arguments)}}
document.head.insertAdjacentHTML('beforeend',`<style>.ql-t td input{width:100%;min-width:0}.ql-t .qsell{background:rgba(28,143,155,.07)}.ql-t th.qsell{color:var(--accent,#1C8F9B)}.ql-t input.qsp{font-weight:700}.ql-t input.qsp::placeholder{color:inherit;opacity:.9;font-weight:700}.ql-t input.qsp.own{border-color:var(--accent,#1C8F9B)}.ql-t .qsp-t{display:block;text-align:right;font-size:10.5px;opacity:.7;line-height:1.2}.ql-t .qsp-t .x{font-size:11px;padding:0 4px}.ql-t td{vertical-align:middle}
.ql-add{display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin:10px 0 4px;padding:10px;border:1px dashed var(--line);border-radius:12px;background:var(--sunk)}
.ql-t tr.grp .qlhs{float:right;display:flex;gap:6px;align-items:center;font-weight:400;font-size:12.5px}.ql-t tr.grp .qlhs label{display:flex;gap:4px;align-items:center;cursor:pointer}.ql-t tr.grp .qlhs input.qlHsP{width:56px;padding:2px 6px}
.ql-eq{display:flex;gap:10px 18px;flex-wrap:wrap;align-items:center;margin:0 0 10px;padding:10px 14px;border:1px solid rgba(28,143,155,.35);border-radius:12px;background:rgba(28,143,155,.07)}
.ql-eq label{display:flex;flex-direction:row;gap:8px;align-items:center;margin:0;cursor:pointer}.ql-eq input[type=checkbox]{appearance:auto;-webkit-appearance:checkbox;width:18px;height:18px;margin:0;accent-color:var(--accent,#1C8F9B)}
.ql-eq select{width:auto;max-width:280px}.ql-eq small{opacity:.75;flex-basis:100%}
.ql-end{margin-top:12px;display:flex;flex-direction:column;gap:12px}.ql-end .qadds{background:var(--surface)}.ql-end dl.stats{margin:0!important}.ql-end .qm-split{margin:0!important}
.qwr{border:1px solid var(--line);border-radius:12px;padding:10px 12px;background:var(--surface)}.qwr b{font-size:13.5px}.qwr-u{display:flex;align-items:center;gap:6px}.qwr-u input{flex:1;min-width:0}.qwr-u small{color:var(--muted)}
.ql-disc{display:flex;align-items:center;gap:10px;justify-content:flex-end;font-weight:600;font-size:13.5px}.ql-disc input{width:180px;text-align:right}
.ql-add select{max-width:230px}.ql-add #qlName{flex:1;min-width:240px}.ql-add .hint{flex-basis:100%}</style>`);
if(typeof SBKW==='object')SBKW['co.sales.quote']=(SBKW['co.sales.quote']||'')+' เพิ่มรายการ สินค้า พิมพ์รายการเอง คลังราคา';
if(typeof I18N==='object'&&I18N.en&&I18N.en.x)Object.assign(I18N.en.x,{'ทุกระบบ':'All systems','ชื่อลูกค้า (อังกฤษ)':'Customer name (English)','ที่อยู่ (อังกฤษ)':'Address (English)','+ เพิ่มรายการ':'+ Add line','เครื่อง':'Equip.','ค่าเครื่อง':'Equipment','เลื่อนขึ้น':'Move up','เลื่อนลง':'Move down','ค่าของ/หน่วย':'Material/unit','ค่าแรง/หน่วย':'Labour/unit','ราคาเสนอ/หน่วย':'Price/unit','วัสดุก่อสร้างทั่วไป':'General building materials','งานระบบแจ้งเหตุเพลิงไหม้':'Fire alarm system','งานระบบสื่อสาร':'Communication system','งานระบบกล้องวงจรปิด (CCTV)':'CCTV system','งานระบบควบคุมการเข้า-ออก':'Access control system','งานระบบเสียงประกาศ':'Public address system','งานระบบควบคุมอาคารอัตโนมัติ (BMS)':'Building management system (BMS)','งานระบบป้องกันฟ้าผ่าและสายดิน':'Lightning protection & earthing','งานเครื่องกำเนิดไฟฟ้าและ UPS':'Generator & UPS','งานระบบโซลาร์เซลล์':'Solar PV system','งานระบบบำบัดน้ำเสีย':'Wastewater treatment','งานระบบก๊าซทางการแพทย์':'Medical gas system'});
// 4.2 more systems (CCTV, fire alarm, communication, access control, PA, BMS, lightning, generator/UPS, solar, wastewater,
// medical gas): headings written other ways in a pasted or imported BOQ find their section too
if(typeof G_ALIAS==='object')G_ALIAS.unshift([/กล้องวงจรปิด|CCTV/i,'cctv'],[/แจ้งเหตุเพลิงไหม้|fire ?alarm/i,'fa'],[/ควบคุมการเข้า|access ?control|คีย์การ์ด/i,'acc'],
  [/เสียงประกาศ|เสียงตามสาย|public address/i,'pa'],[/BMS|ควบคุมอาคารอัตโนมัติ/i,'bms'],[/ฟ้าผ่า|สายดิน|lightning/i,'lp'],[/เครื่องกำเนิดไฟฟ้า|generator|\bUPS\b/i,'genr'],
  [/โซลาร์|solar/i,'sol'],[/บำบัดน้ำเสีย|wastewater|\bSTP\b/i,'wwt'],[/ก๊าซทางการแพทย์|medical gas/i,'mg'],[/สื่อสาร|\bLAN\b|โทรศัพท์|MATV|ทีวีรวม/i,'com']);
if(typeof I18N==='object'&&I18N.en&&I18N.en.x)Object.assign(I18N.en.x,{'ทุนของ/หน่วย':'Material cost/unit','ทุนแรง/หน่วย':'Labour cost/unit','ราคาขาย/หน่วย':'Selling price/unit','รวมราคาขาย':'Selling total','กำไร':'Profit','อัตโนมัติ':'auto','พิมพ์เอง':'typed'});
