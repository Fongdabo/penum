/* ---------- 3.83 คลังราคากลาง (PENUM ราคากลาง, round 1): one price list for the company ----------
   co.prices = [{id, g (BOQ group, or 'mat' for general building materials), name, br (brand / model, 3.84), unit, m (material per unit), l (labour per unit),
   src (where the price came from, shown), sk (kind: demo | moc | po | mep | xls | file | hand), date (of the price), key (an
   PENUM MEP rate, 'mep:split'), h (earlier prices, newest first: [{m, l, d, s}])}], excluding VAT.
   It fills from MEP's sample rates, the BOQ open in PENUM MEP, the POs of every project, a Ministry of Commerce price book
   (530-moc-prices.js), an Excel paste or a library file. It lives in the company data, so the PM cloud carries it to other computers.
   PENUM MEP and BIM read it on this device from 'penum.prices' (round 3): {fmt:1, app, co, at, items:[{id, g, name, br, unit, m, l, src, date, key}]}.
   Never written from the sample company (?demo=1). Round 2 prices ปร.4 / ปร.5 / ปร.6 from it. */
const PL_SEED=[["split","eq","Split ติดผนัง/แขวน","TR",15000,1500],["ducted","eq","Ducted Split","TR",14000,2000],["package","eq","Package","TR",12000,1800],["vrf","eq","VRF เครื่องภายใน","TR",9000,1500],["vrfodu","eq","VRF เครื่องภายนอก","TR",22000,1500],["ahu","eq","AHU","CMH",25,2],["chAir","eq","Chiller ระบายความร้อนด้วยอากาศ","TR",18000,1200],["chWater","eq","Chiller ระบายความร้อนด้วยน้ำ","TR",13000,1200],["ct","eq","Cooling tower","TR",2500,400],["pump","eq","ปั๊มน้ำ","kW มอเตอร์",9000,2500],["supFcu","eq","Support FCU","ชุด",600,200],["supCdu","eq","Support CDU","ชุด",1500,500],["refPipe","pipe","Copper tube Type L","m ต่อนิ้ว",390,130],["refIns","pipe","Insulation for copper tube 3/4\"","m ต่อนิ้ว",60,20],["n2vac","pipe","Nitrogen And Vacuum","ชุด",300,500],["refGas","pipe","Extra Refrigerant","kg",450,0],["drain","pipe","ท่อน้ำทิ้ง PVC หุ้มฉนวน","m",90,60],["duct","duct","ท่อลมสังกะสี","m²",450,220],["ductPid","duct","ท่อลม PID (Pre-Insulated Duct)","m²",950,250],["ductIns","duct","ฉนวนท่อลม","m²",260,80],["diff","duct","หัวจ่ายลม","ชิ้น",1500,300],["grille","duct","หน้ากากลมกลับ","ชิ้น",1200,300],["hepa","duct","HEPA terminal box","ชิ้น",18000,1500],["vd","duct","Volume damper 300×300 mm","ชิ้น",1200,200],["fd","duct","Fire damper 300×300 mm","ชิ้น",4500,500],["chwPipe","chw","ท่อน้ำเย็นพร้อมฉนวนและวาล์ว (เหมา)","TR",2500,1200],["ahuValve","chw","ชุดวาล์วและอุปกรณ์ต่อ AHU","ชุด",25000,5000],["cable","el","สายไฟ THW","ของ: บาท/m ต่อ mm² · แรง: บาท/m",6,10],["iso","el","Waterproof Isolator Switch","ตัว",650,200],["sig","el","Signal cable 2C x 18 AWG shielded","m",25,10],["flex","el","Waterproof flexible conduit 1/2\"","m",80,30],["conduit","el","ท่อร้อยสาย EMT พร้อมอุปกรณ์","m",110,50],["cbS","el","เบรกเกอร์ไม่เกิน 63 A","ตัว",900,200],["cbL","el","เบรกเกอร์เกิน 63 A","ตัว",6000,800],["panel","el","ตู้ไฟระบบปรับอากาศ","ตู้",45000,8000],["smFanP","smk","พัดลมอัดอากาศบันไดหนีไฟ","1,000 CMH",5000,800],["smFanE","smk","พัดลมระบายควันชนิดทนไฟ","1,000 CMH",8000,1000],["smDuct","smk","ท่อลมระบบควันไฟ เหล็กหนา 1.2 mm","m²",1400,500],["smGrille","smk","หัวจ่ายลมอัดอากาศ","ชิ้น",2500,400],["smRelief","smk","Relief damper ระบายความดันเกิน","ชุด",15000,2000],["smDamper","smk","Motorized smoke damper","ชิ้น",12000,1500],["smPanel","smk","ตู้ควบคุมพัดลมฉุกเฉิน","ตู้",60000,8000],["fpPumpE","fp","ปั๊มดับเพลิงมอเตอร์ไฟฟ้า พร้อมตู้ควบคุม","gpm",2400,200],["fpPumpD","fp","ปั๊มดับเพลิงเครื่องยนต์ดีเซล พร้อมตู้ควบคุม","gpm",3400,250],["fpJockey","fp","ปั๊มรักษาความดัน พร้อมตู้ควบคุม","ชุด",60000,8000],["fpHead","fp","หัวสปริงเกลอร์","ชิ้น",180,250],["fpPipe","fp","ท่อเหล็กดำ Sch.40","m ต่อนิ้ว",230,110],["fpAlarm","fp","Alarm check valve พร้อมอุปกรณ์","ชุด",85000,8000],["fpZcv","fp","ชุดวาล์วควบคุมประจำชั้น","ชุด",28000,4000],["fpFhc","fp","ตู้สายฉีดน้ำดับเพลิง พร้อมอุปกรณ์","ตู้",22000,2500],["fpExt","fp","ถังดับเพลิงมือถือ","ชิ้น",1200,100],["fpFdc","fp","หัวรับน้ำดับเพลิง","ชุด",18000,3000],["smCable","smk","สายไฟทนไฟ (FRC)","ของ: บาท/m ต่อ mm² · แรง: บาท/m",14,15],["chwP","chw","ท่อน้ำเย็น เหล็กดำ Sch.40","m ต่อนิ้ว",260,140],["chwIns","chw","ฉนวนท่อน้ำเย็น","m ต่อนิ้ว",120,50],["chwExp","chw","ถังขยายตัวระบบน้ำเย็น","ชุด",35000,5000],["chwSep","chw","Air separator และถังเติมเคมี","ชุด",45000,6000],["elTx","elb","หม้อแปลงไฟฟ้า","kVA",900,80],["elMdb","elb","ตู้เมนไฟฟ้า (MDB)","A",450,40],["elCable","elb","สายป้อนหลัก","ของ: บาท/m ต่อ mm² · แรง: บาท/m",9,60],["elGen","elb","เครื่องกำเนิดไฟฟ้า","kVA",7500,400],["elRod","elb","หลักดินพร้อมบ่อตรวจ","ชุด",1800,900],["elBar","elb","บาร์ต่อลงดินหลัก","ชุด",4500,1500],["lpAir","elb","แท่งล่อฟ้า","ชุด",650,250],["lpCu","elb","สายทองแดงเปลือย 50 mm² ระบบป้องกันฟ้าผ่า","m",420,120],["lpTj","elb","กล่องจุดทดสอบ","ชุด",850,300],["lpSpd","elb","อุปกรณ์ป้องกันไฟกระชาก","ชุด",28000,3000],["elDb","elb","ตู้ย่อย (DB)","ชุด",18000,3500],["elLt","elb","โคมไฟ LED","ชุด",1200,250],["elSw","elb","สวิตช์","ชุด",180,120],["elRc","elb","เต้ารับมีขั้วดิน","ชุด",320,150],["elWire","elb","สายวงจรย่อยพร้อมท่อร้อยสาย","m",55,45],["faPanel","elb","ตู้ควบคุมแจ้งเหตุเพลิงไหม้","ชุด",85000,12000],["faSd","elb","อุปกรณ์ตรวจจับควัน","ชุด",1400,350],["faMs","elb","อุปกรณ์แจ้งเหตุด้วยมือ","ชุด",1800,350],["faBell","elb","กระดิ่งและไฟสัญญาณ","ชุด",2200,350],["faWire","elb","สายแจ้งเหตุเพลิงไหม้พร้อมท่อร้อยสาย","m",45,35],["coCam","com","กล้องวงจรปิด IP ภายใน","ชุด",3500,800],["coCamO","com","กล้องวงจรปิด IP ภายนอก","ชุด",4800,1000],["coNvr","com","เครื่องบันทึกภาพ (NVR)","ช่อง",900,100],["coHdd","com","ฮาร์ดดิสก์บันทึกภาพ","TB",950,50],["coDo","com","เต้ารับสัญญาณ LAN Cat6","จุด",450,250],["coAp","com","อุปกรณ์กระจายสัญญาณไวไฟ","ชุด",6500,800],["coSw","com","สวิตช์ PoE 24 พอร์ต","ชุด",18000,1500],["coCore","com","สวิตช์หลัก","ชุด",45000,4000],["coPp","com","แผงกระจายสาย 24 พอร์ต","ชุด",3500,800],["coRk","com","ตู้แร็คติดผนัง","ชุด",15000,2000],["coRkM","com","ตู้แร็คหลัก 42U","ชุด",38000,4000],["coUtp","com","สาย UTP Cat6 พร้อมท่อร้อยสาย","m",28,22],["coFo","com","สายใยแก้วนำแสงหลัก","m",85,45],["coRd","com","เครื่องอ่านบัตร","ชุด",4500,600],["coMl","com","กลอนแม่เหล็กไฟฟ้า","ชุด",2800,600],["coEx","com","ปุ่มกดออกและปุ่มฉุกเฉิน","ชุด",900,300],["coCtl","com","ตัวควบคุมประตู 4 บาน","ชุด",22000,2500],["coAcw","com","สายระบบควบคุมการเข้าออก","m",25,20],["coTv","com","เต้ารับทีวี","จุด",350,200],["coRg","com","สายนำสัญญาณ RG6","m",18,18],["coSp","com","ตัวแยกสัญญาณ 4 ทาง","ชุด",450,150],["coAmp","com","เครื่องขยายสัญญาณทีวี","ชุด",6500,800],["coHe","com","ชุดเสาอากาศและอุปกรณ์ต้นทาง","ชุด",45000,8000],["plWc","plb","โถส้วม","ชุด",6500,900],["plUr","plb","โถปัสสาวะ","ชุด",4500,800],["plLav","plb","อ่างล้างหน้า","ชุด",3500,700],["plSink","plb","อ่างล้างจาน/ซิงก์","ชุด",4200,700],["plSh","plb","ฝักบัว","ชุด",2500,500],["plHb","plb","ก๊อกสนาม","ชุด",450,200],["plFd","plb","ช่องระบายน้ำพื้น","ชุด",650,250],["plPipe","plb","ท่อประปา PVC","m ต่อนิ้ว",45,35],["plDr","plb","ท่อระบายน้ำ PVC","m ต่อนิ้ว",40,40],["plPump","plb","ชุดปั๊มน้ำประปา","ชุด",65000,8000],["plTank","plb","ถังเก็บน้ำประปา","m³",6500,800],["plWw","plb","ถังบำบัดน้ำเสีย","m³",28000,3000],["cvPad","civ","แท่นคอนกรีตวางคอยล์ร้อน","ชุด",1800,700],["cvBase","civ","ฐานคอนกรีตปั๊มและเครื่อง","ชุด",6500,2500],["cvTank","civ","ถังเก็บน้ำ คสล.","m³",9500,3500],["cvOpen","civ","เจาะช่องผนังพร้อมซ่อมแต่ง","จุด",600,900],["cvSleeve","civ","ปลอกท่อ","จุด",250,200],["cvStop","civ","วัสดุอุดกันไฟลาม","จุด",450,200],["cvAccess","civ","ช่องเปิดฝ้าเพดาน","ชุด",1400,400],["tab","oth","ทดสอบและปรับสมดุลระบบ (TAB)","TR",0,300]];
const PL_SK={demo:['ราคาสมมติ','warn'],moc:['พาณิชย์','info'],po:['ซื้อจริง','ok'],mep:['PENUM MEP',''],xls:['Excel',''],file:['ไฟล์',''],hand:['แก้เอง','']};
const PL_GS=()=>[...Object.keys(BOQ_G).filter(g=>g!=='ex'),'mat'];
const plGName=g=>g==='mat'?'วัสดุก่อสร้างทั่วไป':g==='oth'?'งานทดสอบและอื่นๆ':gName(g);
const PL_OLD=180;// days before a price counts as old
function plCfg(){const C=CO();if(!Array.isArray(C.prices))C.prices=[];return C.prices}
// the same thing spelt in Thai or in English letters (the ministry writes ท่อพีวีซี, a BOQ often ท่อ PVC)
const PL_SYN=[[/ยูพีวีซี/g,'upvc'],[/พีวีซี/g,'pvc'],[/พีพีอาร์/g,'ppr'],[/เอชดีพีอี/g,'hdpe'],[/พีอี/g,'pe'],[/สแตนเลส|สเตนเลส/g,'stainless'],[/ตร\.?\s*ม\.?|ตารางเมตร/g,'m²'],[/ม\.ม\.|มม\./g,'mm'],[/เมตร/g,'m']];
const plSyn=s=>PL_SYN.reduce((t,[re,to])=>t.replace(re,to),String(s||''));
// a decimal point stays (THW 2.5 is not THW 25)
const plKey=s=>pbNorm(plSyn(s)).replace(/(\d)\.(?=\d)/g,'$1d').replace(/[\s.,·\-–()\/:]+/g,'');
// a yearly government list (สำนักงบประมาณ, กรมบัญชีกลาง ว 480) stays current for a year after its date
const PL_OLD_SK={bb:365,cgd:365,offl:365};
const plOld=i=>!i.date||(Date.now()-pd(i.date).getTime())/864e5>(PL_OLD_SK[i.sk]||PL_OLD);
const plFz=()=>{const W={};return r=>{const b=plKey(r.br||''),w=W[b]||(W[b]={items:plCfg().filter(x=>plKey(x.br||'')===b).map(x=>({id:x.id,name:plSyn(x.name),unit:x.unit,x}))});
  const c=pbCands(w,{desc:plSyn(r.name),unit:r.unit})[0];return c&&c.s>=.8?c.x.x:null}};
function plHist(x){x.h=[{m:n(x.m),l:n(x.l),d:x.date||'',s:x.src||''},...(x.h||[])].slice(0,8)}

// 3.84 every source's price is kept beside the price in use (x.o = {sk|src: {s, src, m, l, d}}), to compare them (970-price-compare.js);
// x.pin = the offer the estimator chose: later imports only add offers to a pinned line
const plOK=(sk,src)=>(sk||'hand')+'|'+(src||'');
function plOffer(x,s,src,m,l,d){const o=x.o=x.o||{};o[plOK(s,src)]={s:s||'hand',src:src||'',m:n(m),l:n(l),d:d||today()};
  const K=Object.keys(o);if(K.length>12)K.sort((a,b)=>String(o[a].d).localeCompare(String(o[b].d))).slice(0,K.length-12).forEach(k=>delete o[k])}
const plOffSeed=x=>{if(!x.o||!Object.keys(x.o).length)plOffer(x,x.sk,x.src,x.m,x.l,x.date)};
// put rows into the library: the same item is the same MEP key, or the same name, unit and brand; returns what happened
// o: {src, sk, date, g, keep (never change a price already there), mOnly (material price only), noAdd, newer (skip a row older than ours),
//     offer (only keep the price to compare: supplier quotes), fuzzy(row) → item}
function plMerge(rows,o){const L=plCfg(),ix=new Map(),kx=new Map();let add=0,upd=0,same=0,skip=0,off=0;
  const put=i=>{const k=plKey(i.name);(ix.get(k)||ix.set(k,[]).get(k)).push(i);if(i.key)kx.set(i.key,i)};L.forEach(put);
  rows.forEach(r=>{const name=String(r.name||'').trim();if(!name||!(n(r.m)>0||n(r.l)>0)){skip++;return}
    let x=r.key&&kx.get(r.key);if(!x){const u=plKey(r.unit||'');const br=plKey(r.br||'');x=(ix.get(plKey(name))||[]).find(i=>(!u||!i.unit||plKey(i.unit)===u)&&plKey(i.br||'')===br)}
    if(!x&&o.fuzzy)x=o.fuzzy(r);
    if(!x){if(o.noAdd){skip++;return}
      const it={id:uid(),g:PL_GS().includes(r.g)?r.g:o.g||'oth',name,unit:String(r.unit||'').trim(),m:n(r.m),l:n(r.l),src:r.src||o.src,sk:o.sk,date:r.date||o.date||today()};
      if(r.key)it.key=r.key;if(String(r.br||'').trim())it.br=String(r.br).trim();plOffer(it,o.sk,it.src,it.m,it.l,it.date);L.push(it);put(it);add++;return}
    if(o.keep){same++;return}
    const src=r.src||o.src,d=r.date||o.date||today();plOffSeed(x);plOffer(x,o.sk,src,o.mOnly?r.m:r.m??0,o.mOnly?0:r.l??0,d);
    if(o.offer||x.pin&&x.pin!==plOK(o.sk,src)){off++;return}
    if(o.newer&&x.sk!=='demo'&&x.sk!=='est'&&x.sk!=='offl'&&x.sk!=='offm'&&x.date&&r.date&&r.date<x.date){same++;return}
    const m=r.m==null?n(x.m):n(r.m),l=o.mOnly||r.l==null?n(x.l):n(r.l);
    if(m===n(x.m)&&l===n(x.l)){same++;return}
    plHist(x);x.m=m;x.l=l;x.src=src;x.sk=o.sk;x.date=d;if(!x.unit&&r.unit)x.unit=String(r.unit).trim();upd++});
  return {add,upd,same,skip,off}}
const plSay=(r,what)=>{save();render();toast(r.add||r.upd||r.off?`${what}: เพิ่ม ${fmt(r.add)} · อัปเดตราคา ${fmt(r.upd)}${r.off?` · เก็บไว้เทียบ ${fmt(r.off)}`:''}${r.same?` · ราคาเท่าเดิม ${fmt(r.same)}`:''} รายการ`:`${what}: ไม่มีรายการใหม่หรือราคาที่เปลี่ยน`)};

// --- the sources ---
const plSeedRows=()=>PL_SEED.map(([k,g,name,unit,m,l])=>({key:'mep:'+k,g,name,unit,m,l}));
ACT.plSeed=()=>{const r=plMerge(plSeedRows(),{src:'ราคาสมมติจาก PENUM MEP',sk:'demo',keep:1});$('#dlg').open&&$('#dlg').close();plSay(r,'ราคาตัวอย่าง')};
ACT.plMep=()=>{const L=mepLink();if(!L){toast('ยังไม่มี BOQ จาก PENUM MEP ในเครื่องนี้');return}
  const r=plMerge(L.boq.items.map(i=>({g:i.g,name:itemName(i),unit:i.unit,m:i.m,l:i.l})),{src:'PENUM MEP · '+(L.project||''),sk:'mep',date:(L.date||'').slice(0,10)||today()});
  $('#dlg').open&&$('#dlg').close();plSay(r,'BOQ ของ PENUM MEP')};
// the last price paid for each item, over the POs of every project
function plPoRows(){const B=new Map();
  Object.values(DB.projects||{}).forEach(p=>(p.pos||[]).forEach(po=>{const v=((p.vendors||[]).find(x=>x.id===po.vid)||{}).name||'';
    (po.items||[]).forEach(l=>{if(!String(l.desc||'').trim()||!(n(l.p)>0))return;const k=plKey(l.desc)+'|'+plKey(l.unit||''),o=B.get(k);
      if(!o||String(po.date||'')>=String(o.date||''))B.set(k,{g:l.g,name:l.desc,unit:l.unit,m:n(l.p),date:po.date||today(),src:`${po.no||'PO'}${v?' · '+v:''} · ${p.name}`})})}));
  return [...B.values()]}
// supplier quotes on purchase requests (PR): every supplier's price is kept to compare, the price in use stays
function plSupRows(){const R=[];
  Object.values(DB.projects||{}).forEach(p=>(p.prs||[]).forEach(pr=>(pr.qs||[]).forEach(q=>{const v=((p.vendors||[]).find(x=>x.id===q.vid)||{}).name||'ผู้ขาย';
    (pr.items||[]).forEach(l=>{const x=n((q.p||{})[l.id]);if(x>0&&String(l.desc||'').trim())R.push({g:l.g,name:l.desc,unit:l.unit,m:x,date:pr.date||today(),src:`ใบเสนอราคา ${v} · ${pr.no||'PR'}`})})})));
  return R}
ACT.plPo=()=>{const R=plPoRows(),Q=plSupRows();if(!R.length&&!Q.length){toast('ยังไม่มีใบสั่งซื้อหรือใบเสนอราคาผู้ขายที่ใส่ราคา');return}
  const r=plMerge(R,{sk:'po',mOnly:1,newer:1,g:'mat'}),q=plMerge(Q,{sk:'sup',mOnly:1,offer:1,g:'mat'});
  $('#dlg').open&&$('#dlg').close();plSay({add:r.add+q.add,upd:r.upd,same:r.same,off:r.off+q.off},'ราคาซื้อจริงและใบเสนอราคาผู้ขาย')};
// a Ministry of Commerce price book: material prices; close names count only when every size matches (pbCands)
ACT.plMoc=()=>{const pb=pbCfg().find(x=>x.id===$('#plPb')?.value);if(!pb)return;const add=$('#plPbAdd')?.checked;
  const r=plMerge(pb.items.map(x=>({name:x.name,unit:x.unit,m:x.price})),{src:`พณ. ${pb.prov} ${thYM(pb.month)}`,sk:'moc',mOnly:1,g:'mat',date:pb.month?pb.month+'-01':today(),noAdd:!add,
    fuzzy:plFz()});
  $('#dlg').close();plSay(r,`บัญชีราคาพาณิชย์ ${pb.prov}`)};
// after a price book is pasted from this page, go straight on to taking its prices
{const f=ACT.pbPasteGo;ACT.pbPasteGo=b=>{const k=pbCfg().length;f(b);if(S.mode==='co'&&S.ctab==='tender'&&S.sub.tender==='plib'&&pbCfg().length>k)plFillDlg(pbCfg()[pbCfg().length-1].id)}}

// Excel: a header row names the columns when there is one; otherwise the name is the longest text column, the unit a short
// text column, and the number columns are material then labour
const PL_H=[['br',/ยี่ห้อ|แบรนด์|brand|รุ่น|model/i],['name',/รายการ|ชื่อ|รายละเอียด|description|item/i],['unit',/หน่วย|unit/i],['l',/แรง|labou?r/i],['m',/วัสดุ|ค่าของ|ราคา|material|price|cost/i],['g',/หมวด|group|category/i]];
function plParse(txt){const R=tsvRows(txt);if(!R.length)return [];let C={},body=R;
  const hi=R.slice(0,5).findIndex(r=>r.filter(c=>c&&numOf(c)==null).length>=2&&PL_H.filter(([,re])=>r.some(c=>re.test(c))).length>=2);
  if(hi>=0){R[hi].forEach((c,j)=>{const h=PL_H.find(([k,re])=>C[k]==null&&re.test(c)&&!/จำนวน|qty|รวม|total/i.test(c));if(h)C[h[0]]=j});body=R.slice(hi+1)}
  if(C.name==null){const W=Math.max(...body.map(r=>r.length)),tl=Array(W).fill(0),nu=Array(W).fill(0);
    body.forEach(r=>r.forEach((c,j)=>{if(numOf(c)!=null)nu[j]++;else tl[j]+=c.length}));
    C.name=[...tl.keys()].sort((a,b)=>tl[b]-tl[a])[0];
    if(C.unit==null)C.unit=[...tl.keys()].find(j=>j!==C.name&&body.filter(r=>r[j]&&r[j].length<=12&&numOf(r[j])==null).length>=body.length*.4);
    const N=[...nu.keys()].filter(j=>j!==C.name&&nu[j]>=body.length*.4);if(C.m==null)C.m=N[0];if(C.l==null&&N.length>1)C.l=N[1]}
  if(C.name==null||C.m==null&&C.l==null)return [];
  const gOf=s=>{s=String(s||'').trim();if(!s)return '';const k=PL_GS().find(g=>g===s||plGName(g)===s);return k||''};
  return body.map(r=>({name:r[C.name],unit:C.unit!=null?r[C.unit]||'':'',m:C.m!=null?numOf(r[C.m]):null,l:C.l!=null?numOf(r[C.l]):null,g:C.g!=null?gOf(r[C.g]):'',br:C.br!=null?r[C.br]||'':''}))
    .filter(x=>x.name&&numOf(x.name)==null&&(n(x.m)>0||n(x.l)>0))}
// a price table from any source: the source decides how its prices are read (VAT included, labour only) and shows in the comparison
const PL_SRC=[['xls','ตาราง Excel ทั่วไป',''],['dealer','Price list ผู้แทนจำหน่าย / ผู้ผลิต',''],['sup','ใบเสนอราคาผู้ขาย',''],
  ['bb','บัญชีราคามาตรฐานครุภัณฑ์ (สำนักงบประมาณ)','https://www.bb.go.th',1],['cgd','บัญชีค่าแรงงาน (กรมบัญชีกลาง)','https://www.cgd.go.th',0,1],
  ['egp','ราคากลาง / ราคาที่ชนะประมูล (e-GP)','https://www.gprocurement.go.th'],['shop','ร้านค้าออนไลน์ (HomePro ไทวัสดุ Global House)','',1]];
ACT.plXls=()=>{let R=plParse($('#plTxt')?.value);if(!R.length){toast('ไม่พบรายการที่มีราคา ตรวจว่าคัดลอกมาทั้งตารางรวมหัวตาราง');return}
  const sk=$('#plXs')?.value||'xls',S0=PL_SRC.find(x=>x[0]===sk)||PL_SRC[0],nm=($('#plXn')?.value||'').trim(),d=$('#plXd')?.value||today(),vat=$('#plXv')?.checked,lab=$('#plXl')?.checked;
  const k=vat?1/1.07:1,r2=v=>v==null?null:Math.round(n(v)*k*100)/100;
  R=R.map(r=>lab&&r.l==null?Object.assign(r,{l:r2(r.m),m:null}):Object.assign(r,{m:r2(r.m),l:r2(r.l)}));
  const src=(nm||S0[1].replace(/ \(.*\)$/,''))+' '+thD(d)+(vat?' (หัก VAT)':'');
  const r=plMerge(R,{src,sk,date:d,g:$('#plXg')?.value||'oth',noAdd:!$('#plXa')?.checked,newer:1,
    fuzzy:sk==='xls'?null:plFz()});
  $('#dlg').close();plSay(r,S0[1])};
document.addEventListener('change',e=>{if(e.target.id!=='plXs')return;const S0=PL_SRC.find(x=>x[0]===e.target.value)||PL_SRC[0];
  const v=$('#plXv'),l=$('#plXl'),h=$('#plXh');if(v)v.checked=!!S0[3];if(l)l.checked=!!S0[4];if(h)h.innerHTML=S0[2]?`ดาวน์โหลดตารางจาก <a href="${S0[2]}" target="_blank" rel="noopener">${S0[2].replace('https://','')}</a> แล้วคัดลอกมาวาง`:''});

// a library file: to keep, to send to another company of ours, or for PENUM MEP / BIM on a computer without PM
const plOut=()=>plCfg().map(({id,g,name,br,unit,m,l,src,date,key})=>({id,g,name,br:br||'',unit,m:n(m),l:n(l),src,date,key}));
ACT.plSave=async()=>{const C=CO();
  toast(await download(`PENUM-prices-${today()}.json`,JSON.stringify({app:'PENUM PM',kind:'penum.prices',fmt:1,co:C.name||'',at:Date.now(),items:plOut()}))?'บันทึกไฟล์คลังราคาแล้ว':'บันทึกไฟล์ไม่ได้')};
ACT.plOpen=()=>{const f=$('#fileIn');f.accept='.json,application/json';f.onchange=async()=>{const file=f.files[0];f.value='';if(!file)return;
  try{const J=JSON.parse(await file.text()),L=Array.isArray(J)?J:J&&Array.isArray(J.items)?J.items:null;if(!L)throw new Error('ไม่ใช่ไฟล์คลังราคาของ PENUM');
    const r=plMerge(L.map(x=>({g:x.g,name:x.name,br:x.br,unit:x.unit,m:x.m,l:x.l,date:x.date,key:x.key,src:x.src})),{sk:'file',src:'ไฟล์ '+file.name,newer:1});$('#dlg').open&&$('#dlg').close();plSay(r,'เปิดไฟล์คลังราคา')}
  catch(e){alert('เปิดไฟล์ไม่ได้: '+e.message)}};f.click()};

// --- the fill dialog ---
ACT.plFill=()=>plFillDlg();
function plFillDlg(pbId){const B=pbCfg(),ml=mepLink(),po=plPoRows().length,sq=plSupRows().length,sel=pbId||(B.slice(-1)[0]||{}).id;
  const opt=(t,d,btn)=>`<div class="card" style="margin:0 0 8px;padding:10px 12px"><div class="row" style="justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap"><div style="flex:1;min-width:220px"><b>${t}</b><br><small class="muted">${d}</small></div>${btn}</div></div>`;
  dialog('เติมราคาเข้าคลังราคากลาง',
    opt('บัญชีราคากระทรวงพาณิชย์',B.length?`ใช้เป็นค่าวัสดุ จับคู่จากชื่อและขนาด <div class="row" style="margin-top:6px;gap:8px;flex-wrap:wrap"><select id="plPb" aria-label="บัญชีราคา">${B.map(x=>`<option value="${x.id}"${x.id===sel?' selected':''}>${esc(x.prov)} · ${thYM(x.month)} · ${x.items.length} รายการ</option>`).join('')}</select><label style="display:flex;gap:6px;align-items:center"><input type="checkbox" id="plPbAdd" checked> เพิ่มรายการที่ยังไม่มีในคลังด้วย</label></div>`:'ราคาวัสดุก่อสร้างรายจังหวัดจาก price.moc.go.th วางจากไฟล์ Excel ที่ดาวน์โหลดมา',
      (B.length?`<button type="button" class="btn sm pri" data-a="plMoc">ใช้บัญชีนี้</button>`:'')+`<button type="button" class="btn sm" data-a="pbPaste">วางบัญชีใหม่จาก Excel</button>`)+
    opt('ราคาซื้อจริงจาก PO และใบเสนอราคาผู้ขาย',po||sq?`ราคาล่าสุดที่ซื้อ ${fmt(po)} รายการ ใช้เป็นค่าวัสดุ · ราคาจากใบเสนอราคาผู้ขาย ${fmt(sq)} ราคา เก็บไว้เทียบ`:'ยังไม่มีใบสั่งซื้อหรือใบเสนอราคาผู้ขายที่ใส่ราคา',po||sq?`<button type="button" class="btn sm" data-a="plPo">ดึงราคา</button>`:'')+
    opt('BOQ ของ PENUM MEP',ml?`โครงการ ${esc(ml.project||'')} · ${fmt(ml.boq.items.length)} รายการ ทั้งค่าวัสดุและค่าแรง`:'ยังไม่มี BOQ จาก PENUM MEP ในเครื่องนี้',ml?`<button type="button" class="btn sm" data-a="plMep">ดึงจาก MEP</button>`:'')+
    opt('ราคาตัวอย่าง 120 รายการ','อัตราสมมติชุดเดียวกับ PENUM MEP เช่น Split บาท/TR ท่อลม บาท/ตร.ม. ไม่ทับราคาที่มีอยู่แล้ว',`<button type="button" class="btn sm" data-a="plSeed">เพิ่มราคาตัวอย่าง</button>`)+
    opt('วางตารางราคาจาก Excel หรือแหล่งอื่น','คอลัมน์ รายการ · หน่วย · ค่าวัสดุ · ค่าแรง (ใส่คอลัมน์ ยี่ห้อ ได้ถ้ามีหัวตาราง) ราคาจากแต่ละแหล่งเก็บไว้เทียบกันในหน้า เทียบราคา'+
      `<div class="row" style="gap:8px;flex-wrap:wrap;margin-top:6px"><select id="plXs" aria-label="แหล่งราคา">${PL_SRC.map(([k,l])=>`<option value="${k}">${esc(l)}</option>`).join('')}</select>
      <input id="plXn" placeholder="ชื่อแหล่ง เช่น Daikin ม.ค. 2570" aria-label="ชื่อแหล่ง" style="min-width:200px"><input id="plXd" type="date" value="${today()}" aria-label="วันที่ของราคา"></div>
      <small id="plXh" class="muted"></small>
      <textarea id="plTxt" rows="5" style="margin-top:6px;width:100%" placeholder="รายการ	ยี่ห้อ	หน่วย	ค่าวัสดุ	ค่าแรง"></textarea>
      <div class="row" style="gap:12px;flex-wrap:wrap;margin-top:4px"><label style="display:flex;gap:6px;align-items:center"><input type="checkbox" id="plXv"> ราคารวม VAT แล้ว (หัก 7% ออก)</label><label style="display:flex;gap:6px;align-items:center"><input type="checkbox" id="plXl"> ตัวเลขในตารางเป็นค่าแรง</label><label style="display:flex;gap:6px;align-items:center"><input type="checkbox" id="plXa" checked> เพิ่มรายการที่ยังไม่มีในคลัง</label>
      <label style="display:flex;gap:6px;align-items:center">หมวดของรายการใหม่ <select id="plXg" aria-label="หมวด">${PL_GS().map(g=>`<option value="${g}"${g==='oth'?' selected':''}>${esc(plGName(g))}</option>`).join('')}</select></label></div>`,
      `<button type="button" class="btn sm" data-a="plXls">นำเข้า</button>`)+
    opt('ไฟล์คลังราคา','ไฟล์ .json ที่บันทึกจากหน้านี้ ราคาที่ใหม่กว่าจะแทนราคาเดิม',`<button type="button" class="btn sm" data-a="plOpen">เปิดไฟล์</button>`),
    plCfg().length?`<button type="button" class="btn sm ghost" data-a="plClear">ลบทั้งคลัง</button>`:'')}
ACT.plClear=()=>{const L=plCfg();if(!L.length||!confirm(`ลบทั้ง ${fmt(L.length)} รายการในคลังราคา? (กด ย้อนกลับ ได้)`))return;CO().prices=[];$('#dlg').close();save();render()};

// --- editing: a price typed here keeps the old one in the history ---
document.addEventListener('change',e=>{const p=e.target.dataset&&e.target.dataset.p,m=p&&/^co\.prices\.([^.]+)\.(m|l)$/.exec(p);if(!m)return;
  const x=plCfg().find(i=>i.id===m[1]);if(!x)return;const v=e.target.value.trim()===''?0:n(e.target.value);if(v===n(x[m[2]]))return;
  plHist(x);x.src='แก้เอง';x.sk='hand';x.date=today();plOffSeed(x);setTimeout(()=>{plOffer(x,'hand','แก้เอง',x.m,x.l,today());x.pin=plOK('hand','แก้เอง');save()},0)},true);
ACT.plAdd=()=>{const x={id:uid(),g:S.sel.plG&&S.sel.plG!=='old'?S.sel.plG:'oth',name:'',unit:'',m:0,l:0,src:'แก้เอง',sk:'hand',date:today()};plCfg().unshift(x);S.sel.plQ='';S.sel.plS='';S.sel.plNew=x.id;save();render();
  const el=$(`[data-p="co.prices.${x.id}.name"]`);if(el)el.focus()};
ACT.plHis=b=>{const x=plCfg().find(i=>i.id===b.dataset.id);if(!x)return;
  dialog('ประวัติราคา',`<p><b>${esc(x.name)}</b>${x.br?' · '+esc(x.br):''} <small class="muted">${esc(x.unit)}</small></p><div class="tw"><table><thead><tr><th>วันที่ราคา</th><th class="r">ค่าวัสดุ</th><th class="r">ค่าแรง</th><th>ที่มา</th></tr></thead><tbody>
    <tr class="grp"><td>${thD(x.date)} (ปัจจุบัน)</td><td class="r">${fmt(x.m,2)}</td><td class="r">${fmt(x.l,2)}</td><td>${esc(x.src||'')}</td></tr>
    ${(x.h||[]).map(h=>`<tr><td>${thD(h.d)}</td><td class="r">${fmt(h.m,2)}</td><td class="r">${fmt(h.l,2)}</td><td>${esc(h.s||'')}</td></tr>`).join('')}</tbody></table></div>`,
    (x.h||[]).length?`<button type="button" class="btn sm" data-a="plBack" data-id="${x.id}">กลับไปใช้ราคาก่อนหน้า</button>`:'')};
ACT.plBack=b=>{const x=plCfg().find(i=>i.id===b.dataset.id);if(!x||!(x.h||[]).length)return;const [p,...rest]=x.h;Object.assign(x,{m:p.m,l:p.l,date:p.d,src:p.s,sk:'hand',h:rest});delete x.pin;$('#dlg').close();save();render()};

// --- the page: บริษัท › ประมาณราคา › คลังราคากลาง ---
NAVD.find(d=>d[0]==='est')[2].splice(1,0,['co','tender','plib','คลังราคากลาง']);
{const f=CVIEWS.tender;CVIEWS.tender=function(){if(S.sub.tender==='plib'){tdCfg();return plView()}return f.apply(this,arguments)}}
const plSrcK=i=>PL_SK[i.sk]?i.sk:'hand';
function plList(){const L=plCfg(),q=plKey(S.sel.plQ||''),g=S.sel.plG||'',s=S.sel.plS||'',o=PL_GS();
  return L.filter(i=>i.id===S.sel.plNew||(!q||plKey(i.name+' '+(i.br||'')+' '+i.unit+' '+(i.src||'')).includes(q))&&(!g||(g==='old'?plOld(i):i.g===g))&&(!s||plSrcK(i)===s))
    .sort((a,b)=>(a.id===S.sel.plNew?-1:b.id===S.sel.plNew?1:0)||o.indexOf(a.g)-o.indexOf(b.g)||String(a.name).localeCompare(String(b.name),'th'))}
function plView(){const L=plCfg(),R=plList(),N=Math.max(100,+S.sel.plN||200),G=PL_GS(),by=k=>L.filter(i=>plSrcK(i)===k).length,old=L.filter(plOld).length;
  const last=L.reduce((a,i)=>String(i.date||'')>a?String(i.date):a,'');
  TABLES.plib={rows:()=>plList(),cols:[{k:'name',h:'รายการ'},{k:'br',h:'ยี่ห้อ / รุ่น'},{k:'unit',h:'หน่วย'},{k:'m',h:'ค่าวัสดุ/หน่วย'},{k:'l',h:'ค่าแรง/หน่วย'},{h:'รวม/หน่วย',t:'calc',f:i=>n(i.m)+n(i.l)},{h:'หมวด',t:'calc',f:i=>plGName(i.g)},{k:'src',h:'ที่มา'},{k:'date',h:'วันที่ราคา'}]};
  const head=`<dl class="stats"><div><dt>รายการในคลัง</dt><dd>${fmt(L.length)}</dd></div><div><dt>ราคาพาณิชย์ / ซื้อจริง</dt><dd>${fmt(by('moc')+by('gov')+by('offm'))} / ${fmt(by('po'))}</dd></div>
    <div><dt>ยังเป็นราคาสมมติ / ประมาณการ</dt><dd style="color:${by('demo')+by('est')+by('offl')+by('offm')?'var(--crit)':''}">${fmt(by('demo')+by('est')+by('offl')+by('offm'))}</dd></div><div><dt>ราคาเก่ากว่า 6 เดือน</dt><dd style="color:${old?'var(--danger)':''}">${fmt(old)}</dd></div><div><dt>อัปเดตล่าสุด</dt><dd>${last?thD(last):'–'}</dd></div></dl>`;
  if(!L.length)return head+`<section class="card"><h2><span>คลังราคากลาง</span><small>ราคาเดียวที่ PENUM PM, MEP และ BIM ใช้ร่วมกัน</small></h2>
    <p>คลังยังว่าง เริ่มได้ 3 ทาง</p><div class="row" style="gap:8px;flex-wrap:wrap"><button type="button" class="btn pri" data-a="plSeed">เริ่มจากราคาตัวอย่าง 120 รายการ</button><button type="button" class="btn" data-a="plFill">วางจาก Excel หรือบัญชีพาณิชย์</button><button type="button" class="btn" data-a="plOpen">เปิดไฟล์คลังราคา</button></div>
    <p class="hint">ราคาทุกรายการไม่รวม VAT แยกค่าวัสดุและค่าแรง และจำว่ามาจากไหน วันที่เท่าไร เมื่อเติมราคาใหม่ ราคาเดิมจะเก็บไว้ในประวัติ</p></section>`;
  const sel=(id,cur,opts,lab)=>`<select id="${id}" aria-label="${lab}">${opts.map(([k,l])=>`<option value="${k}"${k===cur?' selected':''}>${esc(l)}</option>`).join('')}</select>`;
  const cols=[{k:'name',h:'รายการ',w:220},{k:'br',h:'ยี่ห้อ / รุ่น',w:120},{k:'unit',h:'หน่วย',w:90},{k:'m',h:'ค่าวัสดุ/หน่วย',t:'num',w:100},{k:'l',h:'ค่าแรง/หน่วย',t:'num',w:100}],gcol={k:'g',h:'หมวด',t:'sel',o:G.map(g=>[g,plGName(g)]),w:170};
  const rows=R.slice(0,N).map(i=>{const k=plSrcK(i),od=plOld(i);return `<tr${i.id===S.sel.plNew?' class="sel"':''}>${cols.map(c=>cell('co.prices',i,c)).join('')}<td class="r">${fmt(n(i.m)+n(i.l),2)}</td>${cell('co.prices',i,gcol)}
    <td style="min-width:170px"><span class="pill ${PL_SK[k][1]}">${PL_SK[k][0]}</span>${i.pin?' <span title="เลือกราคานี้เอง ราคาที่เติมใหม่จะเก็บไว้เทียบ ไม่แทนราคานี้">📌</span>':''}${i.src&&k!=='demo'&&i.src!==PL_SK[k][0]?`<br><small class="muted">${esc(i.src)}</small>`:''}</td>
    <td style="white-space:nowrap${od?';color:var(--danger)':''}" title="${od?'ราคาเก่ากว่า 6 เดือน':''}">${thD(i.date)}</td>
    <td style="white-space:nowrap">${plOffs(i).length>1?`<button type="button" class="btn ghost sm" data-a="plOff" data-id="${i.id}" title="ราคาจากทุกแหล่ง">เทียบ ${plOffs(i).length}</button>`:''}${(i.h||[]).length?`<button type="button" class="btn ghost sm" data-a="plHis" data-id="${i.id}" title="ประวัติราคา">ประวัติ ${i.h.length}</button>`:''}<button type="button" class="x" data-a="delRow" data-c="co.prices" data-id="${i.id}" aria-label="ลบแถว">✕</button></td></tr>`}).join('');
  return head+`<section class="card"><h2><span>คลังราคากลาง</span><small>ราคาเดียวที่ PENUM PM, MEP และ BIM ใช้ร่วมกัน · ไม่รวม VAT</small><span class="sp"></span>
    <button type="button" class="btn sm pri" data-a="plFill">เติมราคา</button><button type="button" class="btn sm" data-a="plAdd">+ เพิ่มรายการ</button>${copyBtn('plib')}<button type="button" class="btn sm" data-a="plSave">บันทึกไฟล์คลังราคา</button></h2>
  <div class="row" style="gap:8px;flex-wrap:wrap;margin-bottom:10px"><input id="plQ" type="search" placeholder="ค้นหารายการ ขนาด หรือที่มา" value="${esc(S.sel.plQ||'')}" aria-label="ค้นหาในคลังราคา" style="flex:1;min-width:200px">
    ${sel('plG',S.sel.plG||'',[['','ทุกหมวด'],...G.filter(g=>L.some(i=>i.g===g)).map(g=>[g,plGName(g)]),['old','เฉพาะราคาเก่ากว่า 6 เดือน']],'หมวด')}
    ${sel('plS',S.sel.plS||'',[['','ทุกที่มา'],...Object.entries(PL_SK).filter(([k])=>by(k)).map(([k,v])=>[k,v[0]])],'ที่มา')}</div>
  <div class="sub" role="tablist" style="margin-bottom:8px">${[['','ตารางราคา'],['cmp','เทียบราคาทุกแหล่ง']].map(([k,l])=>`<button type="button" role="tab" data-a="plV" data-k="${k}" aria-selected="${(S.sel.plV||'')===k}">${l}</button>`).join('')}</div>
  ${S.sel.plV==='cmp'?plCmpTable(R):`<div class="tw" style="max-height:600px;overflow:auto"><table><thead><tr><th>รายการ</th><th>ยี่ห้อ / รุ่น</th><th>หน่วย</th><th class="r">ค่าวัสดุ/หน่วย</th><th class="r">ค่าแรง/หน่วย</th><th class="r">รวม/หน่วย</th><th>หมวด</th><th>ที่มา</th><th>วันที่ราคา</th><th></th></tr></thead>
  <tbody>${rows||'<tr><td colspan="10" class="empty">ไม่มีรายการที่ตรงกับการค้นหา</td></tr>'}</tbody></table></div>
  ${R.length>N?`<div class="row" style="margin-top:8px"><span class="muted">แสดง ${fmt(N)} จาก ${fmt(R.length)} รายการ</span><button type="button" class="btn sm" data-a="plMore">แสดงเพิ่ม</button></div>`:`<p class="muted" style="margin:8px 0 0">${fmt(R.length)} รายการ</p>`}`}
  <p class="hint">ราคาที่แก้ในตารางจะเก็บราคาเดิมไว้ในประวัติ · แก้จาก PENUM MEP และ BIM ได้ด้วย ราคาที่แก้ล่าสุดเป็นราคาที่ใช้ และทุกเครื่องของบริษัทได้ราคาชุดเดียวกันเอง · ใช้คลังนี้ทำ ปร.4 ปร.5 ปร.6 ได้ที่หน้า ทำราคาประมูล</p></section>`}
ACT.plMore=()=>{S.sel.plN=(Math.max(100,+S.sel.plN||200))+500;render()};
let plQT=0;
document.addEventListener('input',e=>{if(e.target.id!=='plQ')return;clearTimeout(plQT);const v=e.target.value;plQT=setTimeout(()=>{S.sel.plQ=v;S.sel.plN=200;S.sel.plNew='';render();
  const el=$('#plQ');if(el){el.focus();try{el.setSelectionRange(v.length,v.length)}catch(_){}}},250)});
document.addEventListener('change',e=>{const id=e.target.id;if(id==='plG'||id==='plS'){S.sel[id]=e.target.value;S.sel.plN=200;S.sel.plNew='';render()}});

// --- shared with PENUM MEP and BIM on this device ---
let plShared=null,plST=0;
function plShare(){try{const C=DB&&DB.co;if(DEMOPG||!C||!Array.isArray(C.prices))return;const body=JSON.stringify({fmt:1,app:'PENUM PM',co:String(C.name||'').trim(),items:plOut()});
  if(body===plShared)return;plShared=body;let cur=null;try{cur=JSON.parse(localStorage.getItem('penum.prices')||'null')}catch(e){}
  if(cur){delete cur.at;if(JSON.stringify(cur)===body)return}
  localStorage.setItem('penum.prices',body.slice(0,-1)+',"at":'+Date.now()+'}')}catch(e){}}
{const r=render;render=function(){const x=r.apply(this,arguments);clearTimeout(plST);plST=setTimeout(plShare,600);return x}}

if(typeof I18N==='object'&&I18N.en&&I18N.en.x)Object.assign(I18N.en.x,{'คลังราคากลาง':'Price library','ราคาเดียวที่ PENUM PM, MEP และ BIM ใช้ร่วมกัน · ไม่รวม VAT':'One price list for PENUM PM, MEP and BIM · excluding VAT',
  'ราคาเดียวที่ PENUM PM, MEP และ BIM ใช้ร่วมกัน':'One price list for PENUM PM, MEP and BIM','เติมราคา':'Add prices','+ เพิ่มรายการ':'+ Add item','บันทึกไฟล์คลังราคา':'Save library file','รายการในคลัง':'Items in library',
  'ราคาพาณิชย์ / ซื้อจริง':'Ministry / purchase prices','ยังเป็นราคาสมมติ':'Still assumed prices','ราคาเก่ากว่า 6 เดือน':'Prices over 6 months old','อัปเดตล่าสุด':'Last updated','ทุกหมวด':'All groups','ทุกที่มา':'All sources',
  'เฉพาะราคาเก่ากว่า 6 เดือน':'Only prices over 6 months old','ค่าวัสดุ/หน่วย':'Material/unit','ค่าแรง/หน่วย':'Labour/unit','รวม/หน่วย':'Total/unit','ที่มา':'Source','วันที่ราคา':'Price date','ราคาสมมติ':'Assumed','พาณิชย์':'Ministry',
  'ซื้อจริง':'Purchased','แก้เอง':'Typed','แสดงเพิ่ม':'Show more','ประวัติราคา':'Price history','เติมราคาเข้าคลังราคากลาง':'Add prices to the library','บัญชีราคากระทรวงพาณิชย์':'Ministry of Commerce price book',
  'ราคาซื้อจริงจากใบสั่งซื้อ (PO)':'Prices paid on purchase orders','BOQ ของ PENUM MEP':'PENUM MEP BOQ','ราคาตัวอย่าง 120 รายการ':'120 sample prices','วางจาก Excel':'Paste from Excel','ไฟล์คลังราคา':'Library file',
  'เริ่มจากราคาตัวอย่าง 120 รายการ':'Start from 120 sample prices','วางจาก Excel หรือบัญชีพาณิชย์':'Paste from Excel or a Ministry price book','เปิดไฟล์คลังราคา':'Open a library file','วัสดุก่อสร้างทั่วไป':'General building materials',
  'กลับไปใช้ราคาก่อนหน้า':'Go back to the previous price','ลบทั้งคลัง':'Delete the whole library','ใช้บัญชีนี้':'Use this book','ดึงราคา PO':'Take PO prices','ดึงจาก MEP':'Take from MEP','เพิ่มราคาตัวอย่าง':'Add sample prices','นำเข้า':'Import','เปิดไฟล์':'Open file'});
