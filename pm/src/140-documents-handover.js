/* ---------- documents: submittals, shop drawings, as-built ---------- */
const STY=[['mat','วัสดุ/อุปกรณ์'],['shop','Shop Drawing'],['ms','Method Statement'],['calc','รายการคำนวณ'],['asb','As-built'],['oth','อื่นๆ']];
const SST=[['pending','รอพิจารณา'],['A','A อนุมัติ'],['B','B อนุมัติตามแก้ไข'],['C','C แก้ไขส่งใหม่'],['D','D ไม่อนุมัติ']];
NEW.subm=arr=>({no:nextNo('SUB-',arr),type:S.sub.docs&&S.sub.docs!=='all'?S.sub.docs:'mat',title:'',g:'',rev:0,date:today(),need:addD(today(),14),ret:'',status:'pending',note:''});
ACT.genSubm=()=>{if(!P.boq.items.length){toast('ยังไม่มี BOQ');return}const have=new Set(P.subm.map(s=>s.type+'|'+s.title)),add=[];
  const heads=[...new Map(P.boq.items.filter(i=>n(i.m)>0).map(i=>[i.g+'|'+(i.head||i.desc),i])).values()];
  heads.forEach(i=>{const t=(i.head||i.desc).replace(/\s*\(.*\)\s*$/,'');if(!have.has('mat|'+t))add.push({type:'mat',title:t,g:i.g})});
  groupsInBoq().forEach(g=>{const t=`แบบ Shop Drawing ${gName(g)}`;if(!have.has('shop|'+t))add.push({type:'shop',title:t,g});const a=`แบบ As-built ${gName(g)}`;if(!have.has('asb|'+a))add.push({type:'asb',title:a,g})});
  add.forEach(x=>{const r=Object.assign({id:uid()},NEW.subm(P.subm),x,{date:'',need:'',status:'pending'});P.subm.push(r)});save();render();toast(`เพิ่ม ${add.length} รายการ`)};
VIEWS.docs=()=>{
  const {cur,html}=subTabs('docs',[['all','ทั้งหมด'],...STY]),td=today();
  const rows=P.subm.filter(r=>cur==='all'||r.type===cur);
  const cols=[{k:'no',h:'เลขที่',w:80},{k:'type',h:'ประเภท',t:'sel',o:STY},{k:'title',h:'รายการ',w:260},{k:'g',h:'หมวดงาน',t:'sel',o:G_OPTS(),w:140},{k:'rev',h:'Rev.',t:'num',w:50},{k:'date',h:'วันที่ส่ง',t:'date'},{k:'need',h:'ต้องการผล',t:'date'},{k:'ret',h:'วันที่ได้ผล',t:'date'},{k:'status',h:'ผลพิจารณา',t:'sel',o:SST},
    {h:'วันพิจารณา',t:'calc',r:1,f:r=>{if(!okD(r.date))return '';const d=diffD(r.date,okD(r.ret)?r.ret:td),late=r.status==='pending'&&okD(r.need)&&r.need<td;return `<span class="pill ${late?'bad':r.status==='A'||r.status==='B'?'ok':''}">${d}</span>`}},{k:'note',h:'หมายเหตุ',w:160}];
  TABLES.subm={rows:()=>rows,cols};
  const cnt=k=>P.subm.filter(r=>r.status===k).length,sent=P.subm.filter(r=>okD(r.date));
  return html+`<dl class="stats"><div><dt>ทั้งหมด</dt><dd>${P.subm.length}</dd></div><div><dt>ยังไม่ส่ง</dt><dd>${P.subm.filter(r=>!okD(r.date)).length}</dd></div><div><dt>รอพิจารณา</dt><dd>${sent.filter(r=>r.status==='pending').length}</dd></div><div><dt>อนุมัติ (A/B)</dt><dd style="color:var(--good)">${cnt('A')+cnt('B')}</dd></div><div><dt>ต้องแก้ส่งใหม่ (C/D)</dt><dd style="color:var(--danger)">${cnt('C')+cnt('D')}</dd></div></dl>
  <section class="card"><h2><span>ทะเบียนเอกสารส่งอนุมัติ</span><small>ช่องวันที่ส่งว่าง = ยังไม่ได้ส่ง</small><span class="sp"></span>${copyBtn('subm')}<button type="button" class="btn sm" data-a="print" data-k="subm" data-id="${cur}">พิมพ์ทะเบียน</button></h2>
  ${gtable('subm',rows,cols,{extra:r=>`<button type="button" class="btn sm" data-a="print" data-k="trans" data-id="${r.id}">ใบนำส่ง</button>`})}
  <div class="row" style="margin-top:8px"><button type="button" class="btn sm pri" data-a="add" data-c="subm">+ เพิ่มเอกสาร</button><button type="button" class="btn sm" data-a="genSubm">สร้างรายการจาก BOQ</button></div></section>`;
};
PRINT.subm=k=>{const rows=P.subm.filter(r=>k==='all'||r.type===k);return phead('ทะเบียนเอกสารส่งอนุมัติ',(STY.find(x=>x[0]===k)||['','ทุกประเภท'])[1])+`<table><thead><tr><th>เลขที่</th><th>ประเภท</th><th>รายการ</th><th>Rev.</th><th>วันที่ส่ง</th><th>วันที่ได้ผล</th><th>ผล</th></tr></thead><tbody>${rows.map(r=>`<tr><td>${esc(r.no)}</td><td>${(STY.find(x=>x[0]===r.type)||STY[5])[1]}</td><td>${esc(r.title)}</td><td>${n(r.rev)}</td><td>${thD(r.date)}</td><td>${thD(r.ret)}</td><td>${(SST.find(x=>x[0]===r.status)||SST[0])[1]}</td></tr>`).join('')}</tbody></table>`};
PRINT.trans=id=>{const r=P.subm.find(x=>x.id===id);if(!r)return '';return phead(`ใบนำส่งเอกสาร (Transmittal) ${esc(r.no)} Rev.${n(r.rev)}`,`วันที่ ${thDL(r.date||today())}`)+`<div class="meta"><div>ถึง: ผู้ควบคุมงาน / ที่ปรึกษา</div><div>ผู้ว่าจ้าง: ${esc(P.info.client||'')}</div><div>ประเภท: ${(STY.find(x=>x[0]===r.type)||STY[5])[1]}</div><div>หมวดงาน: ${gName(r.g)}</div></div><table><thead><tr><th>#</th><th>รายการเอกสาร</th><th>จำนวน</th></tr></thead><tbody><tr><td>1</td><td>${esc(r.title)}</td><td>1 ชุด</td></tr></tbody></table>
  <h3>ผลการพิจารณา</h3><div class="box">${SST.slice(1).map(s=>`☐ ${s[1]}`).join('&nbsp;&nbsp;&nbsp;')}\n\nความเห็น:\n\n\n</div><div class="sign"><div>ผู้ส่ง</div><div>ผู้รับ</div><div>ผู้พิจารณา</div></div>`};

/* ---------- handover: T&C, TAB, punch list, O&M, warranty ---------- */
const TCK={eq:[['ตรวจการติดตั้งเครื่อง ระดับ ฐานยาง','ติดตั้งแน่นหนา ไม่สั่น'],['วัดกระแสไฟฟ้าขณะเดินเครื่อง','ไม่เกินค่าพิกัดบนป้าย'],['วัดอุณหภูมิลมจ่าย/ลมกลับ','ΔT 8–12 °C'],['ตรวจน้ำทิ้งไหลสะดวก','ไม่รั่ว ไม่ขัง'],['ทดสอบรีโมท/เทอร์โมสตัท','สั่งงานได้ทุกโหมด']],
  pipe:[['ทดสอบแรงดันท่อน้ำยาด้วยไนโตรเจน','600 psi คงที่ 24 ชม.'],['ทำสุญญากาศ (Vacuum)','ต่ำกว่า 500 micron'],['ตรวจฉนวนท่อ','ไม่ขาด รอยต่อปิดเทป']],
  duct:[['ตรวจรอยรั่วท่อลม','ไม่มีลมรั่วที่รอยต่อ'],['ตรวจ Volume damper และ Fire damper','ปรับ/ปิดเปิดได้'],['ตรวจฉนวนท่อลม','ไม่ขาด ไม่มีหยดน้ำ']],
  chw:[['ทดสอบแรงดันน้ำ (Hydrostatic)','1.5 เท่าความดันใช้งาน 2 ชม.'],['ล้างท่อ (Flushing)','น้ำใส ไม่มีตะกอน'],['ตรวจปั๊มน้ำ ทิศหมุน กระแส','ถูกต้องตามพิกัด'],['ตรวจระบบเติมเคมี/ถังขยายตัว','ทำงานปกติ']],
  el:[['วัดค่าความเป็นฉนวนสายไฟ (Megger)','ไม่น้อยกว่า 1 MΩ'],['ตรวจขันแน่นขั้วสาย','ครบทุกจุด'],['ตรวจลำดับเฟส','ถูกต้อง'],['ทดสอบเบรกเกอร์และป้ายชื่อวงจร','ครบถ้วน']],
  smk:[['ทดสอบพัดลมอัดอากาศบันได','แรงดัน 25–50 Pa'],['ทดสอบสั่งงานจากระบบแจ้งเหตุ','พัดลมทำงานอัตโนมัติ'],['ตรวจ Relief damper','เปิดเมื่อแรงดันเกิน']],
  fp:[['ทดสอบแรงดันท่อดับเพลิง','200 psi 2 ชม.'],['ทดสอบปั๊มดับเพลิง (Flow test)','ได้อัตราไหลตามพิกัด'],['ทดสอบ Flow switch และสัญญาณเตือน','ส่งสัญญาณถึงตู้แจ้งเหตุ'],['ตรวจหัวสปริงเกลอร์และตู้ดับเพลิง','ครบตามแบบ']],
  elb:[['วัดค่าความเป็นฉนวนและค่าความต้านทานดิน','ดินไม่เกิน 5 Ω'],['ทดสอบไฟฉุกเฉินและป้ายทางออก','ติดสว่าง 2 ชม.'],['ทดสอบ RCD/เครื่องตัดไฟรั่ว','ตัดภายใน 0.04 วินาที']],
  plb:[['ทดสอบแรงดันท่อน้ำดี','1.5 เท่า 2 ชม.'],['ทดสอบท่อระบายน้ำ (ขังน้ำ)','ไม่รั่วซึม'],['ทดสอบปั๊มน้ำและสวิตช์ลูกลอย','ตัดต่ออัตโนมัติ']]};
const RES=[['','–'],['pass','ผ่าน'],['fail','ไม่ผ่าน'],['na','ไม่เกี่ยวข้อง']];
NEW.tc=()=>({g:'',item:'',crit:'',res:'',date:'',by:'',wit:'',note:''});
NEW.tabA=()=>({loc:'',term:'',design:0,meas:0,date:''});
NEW.tabW=()=>({loc:'',equip:'',unit:'L/s',design:0,meas:0,date:''});
NEW.punch=arr=>({no:nextNo('P-',arr),loc:'',item:'',g:'',who:'',found:today(),due:addD(today(),7),status:'open',done:'',photos:[]});
NEW.om=()=>({g:'',item:'',status:'none',note:''});
NEW.war=()=>({item:'',vendor:'',start:P.info.handover||today(),months:12,note:''});
ACT.genTC=()=>{const gs=groupsInBoq().filter(g=>TCK[g]);if(!gs.length){toast('ยังไม่มี BOQ');return}if(P.tc.length&&!confirm('เพิ่มรายการตรวจตั้งต้นต่อท้ายรายการเดิม?'))return;gs.forEach(g=>TCK[g].forEach(([item,crit])=>P.tc.push(Object.assign({id:uid()},NEW.tc(),{g,item,crit}))));save();render()};
ACT.genTabA=()=>{if(!P.rooms.length){toast('ไม่มีข้อมูลห้องจาก PENUM MEP ดึง BOQ จาก PENUM MEP ก่อน');return}P.rooms.filter(r=>n(r.cmh)>0).forEach(r=>P.tabA.push(Object.assign({id:uid()},NEW.tabA(),{loc:r.name,term:'ลมจ่ายรวม',design:Math.round(n(r.cmh)/Math.max(1,n(r.qty)))})));save();render()};
ACT.genOM=()=>{const gs=groupsInBoq();if(!gs.length){toast('ยังไม่มี BOQ');return}const L=['คู่มือการใช้งานและบำรุงรักษา (O&M Manual)','แบบ As-built','ใบรับประกันอุปกรณ์','รายการอะไหล่และผู้จำหน่าย','ผลการทดสอบ (T&C/TAB)','บันทึกการอบรมผู้ใช้งาน'];gs.forEach(g=>L.forEach(item=>P.om.push(Object.assign({id:uid()},NEW.om(),{g,item}))));save();render()};
ACT.genWar=()=>{const st=okD(P.info.handover)?P.info.handover:today(),L=P.boq.items.filter(i=>(i.g==='eq'||/pump|ปั๊ม|fan|พัดลม|chiller|panel|ตู้/i.test(i.desc+' '+i.head))&&n(i.m)>=10000);
  L.forEach(i=>P.war.push({id:uid(),item:itemName(i),vendor:(P.pos.find(p=>p.items.some(l=>l.bid===i.id))||{}).vid?vName(P.pos.find(p=>p.items.some(l=>l.bid===i.id)).vid):'',start:st,months:/compressor|chiller|CDU|Condensing/i.test(itemName(i))?36:12,note:''}));
  P.war.push({id:uid(),item:'รับประกันผลงานติดตั้งทั้งระบบ',vendor:P.info.company||'',start:st,months:24,note:''});save();render();toast(`เพิ่ม ${L.length+1} รายการ`)};
VIEWS.hand=()=>{const {cur,html}=subTabs('hand',[['tc','ทดสอบระบบ (T&C)'],['tab','ปรับสมดุลลม/น้ำ (TAB)'],['punch','Punch list'],['om','เอกสาร O&M'],['war','ประกันผลงาน']]);
  return html+({tc:handTC,tab:handTAB,punch:handPunch,om:handOM,war:handWar}[cur])()};
function handTC(){
  const cols=[{k:'g',h:'ระบบ',t:'sel',o:G_OPTS(),w:150},{k:'item',h:'รายการทดสอบ',w:240},{k:'crit',h:'เกณฑ์',w:180},{k:'res',h:'ผล',t:'sel',o:RES},{k:'date',h:'วันที่ทดสอบ',t:'date'},{k:'by',h:'ผู้ทดสอบ',w:100},{k:'wit',h:'ผู้ร่วมตรวจ',w:100},{k:'note',h:'หมายเหตุ',w:140}];
  TABLES.tc={rows:()=>P.tc,cols};const c=k=>P.tc.filter(r=>r.res===k).length,done=P.tc.filter(r=>r.res).length;
  return `<dl class="stats"><div><dt>ความคืบหน้าการทดสอบ</dt><dd>${P.tc.length?fmt(done*100/P.tc.length,0):0}% <small>${done}/${P.tc.length}</small></dd><div class="bar"><i style="width:${P.tc.length?done*100/P.tc.length:0}%"></i></div></div><div><dt>ผ่าน</dt><dd style="color:var(--good)">${c('pass')}</dd></div><div><dt>ไม่ผ่าน</dt><dd style="color:var(--danger)">${c('fail')}</dd></div></dl>
  <section class="card"><h2><span>รายการทดสอบและเดินระบบ</span><span class="sp"></span>${copyBtn('tc')}<button type="button" class="btn sm" data-a="print" data-k="tc">พิมพ์</button></h2>${gtable('tc',P.tc,cols,{rowCls:r=>r.res==='fail'?'sel':''})}
  <div class="row" style="margin-top:8px"><button type="button" class="btn sm pri" data-a="add" data-c="tc">+ เพิ่มรายการ</button><button type="button" class="btn sm" data-a="genTC">สร้างรายการตรวจตั้งต้นตามระบบใน BOQ</button></div></section>`;
}
PRINT.tc=()=>phead('รายงานการทดสอบและเดินระบบ (Testing & Commissioning)')+`<table><thead><tr><th>ระบบ</th><th>รายการ</th><th>เกณฑ์</th><th>ผล</th><th>วันที่</th><th>ผู้ทดสอบ</th><th>ผู้ร่วมตรวจ</th></tr></thead><tbody>${P.tc.map(r=>`<tr><td>${gName(r.g)}</td><td>${esc(r.item)}</td><td>${esc(r.crit)}</td><td>${(RES.find(x=>x[0]===r.res)||RES[0])[1]}</td><td>${thD(r.date)}</td><td>${esc(r.by)}</td><td>${esc(r.wit)}</td></tr>`).join('')}</tbody></table><div class="sign"><div>ผู้ทดสอบ</div><div>ผู้ควบคุมงาน</div><div>ผู้ว่าจ้าง</div></div>`;
const devOf=r=>n(r.design)?n(r.meas)*100/n(r.design):0;
const devPill=r=>{if(!n(r.meas))return '';const d=devOf(r),ok=d>=90&&d<=110;return `<span class="pill ${ok?'ok':'bad'}">${fmt(d,0)}% ${ok?'ผ่าน':'ปรับใหม่'}</span>`};
function handTAB(){
  const ca=[{k:'loc',h:'ห้อง / โซน',w:220},{k:'term',h:'หัวจ่าย / จุดวัด',w:140},{k:'design',h:'ลมออกแบบ (CMH)',t:'num',w:90,sum:r=>r.design},{k:'meas',h:'วัดได้ (CMH)',t:'num',w:90,sum:r=>r.meas},{h:'ผล (±10%)',t:'calc',f:devPill},{k:'date',h:'วันที่วัด',t:'date'}];
  const cw=[{k:'loc',h:'ระบบ / ตำแหน่ง',w:200},{k:'equip',h:'อุปกรณ์',w:160},{k:'unit',h:'หน่วย',w:60},{k:'design',h:'ค่าออกแบบ',t:'num',w:90},{k:'meas',h:'วัดได้',t:'num',w:90},{h:'ผล (±10%)',t:'calc',f:devPill},{k:'date',h:'วันที่วัด',t:'date'}];
  TABLES.taba={rows:()=>P.tabA,cols:ca};TABLES.tabw={rows:()=>P.tabW,cols:cw};
  return `<section class="card"><h2><span>ปรับสมดุลลม (Air balancing)</span><small>ผ่านเมื่ออยู่ในช่วง 90–110% ของค่าออกแบบ</small><span class="sp"></span>${copyBtn('taba')}<button type="button" class="btn sm" data-a="print" data-k="tab">พิมพ์</button></h2>${gtable('tabA',P.tabA,ca)}
  <div class="row" style="margin-top:8px"><button type="button" class="btn sm pri" data-a="add" data-c="tabA">+ เพิ่มจุดวัด</button><button type="button" class="btn sm" data-a="genTabA">ใส่ลมออกแบบจากห้องใน PENUM MEP</button></div></section>
  <section class="card"><h2><span>ปรับสมดุลน้ำ (Water balancing)</span><span class="sp"></span>${copyBtn('tabw')}</h2>${gtable('tabW',P.tabW,cw)}<div class="row" style="margin-top:8px"><button type="button" class="btn sm pri" data-a="add" data-c="tabW">+ เพิ่มจุดวัด</button></div></section>`;
}
PRINT.tab=()=>{const t=(L,h)=>`<h3>${h}</h3><table><thead><tr><th>ตำแหน่ง</th><th>จุดวัด</th><th>ออกแบบ</th><th>วัดได้</th><th>%</th><th>วันที่</th></tr></thead><tbody>${L.map(r=>`<tr><td>${esc(r.loc)}</td><td>${esc(r.term||r.equip||'')}</td><td style="text-align:right">${fmtq(r.design)} ${esc(r.unit||'CMH')}</td><td style="text-align:right">${fmtq(r.meas)}</td><td style="text-align:right">${n(r.meas)?fmt(devOf(r),0)+'%':''}</td><td>${thD(r.date)}</td></tr>`).join('')}</tbody></table>`;return phead('รายงานการปรับสมดุลลมและน้ำ (TAB)')+t(P.tabA,'ระบบลม')+(P.tabW.length?t(P.tabW,'ระบบน้ำ'):'')+`<div class="sign"><div>ผู้ทดสอบ</div><div>ผู้ควบคุมงาน</div><div>ผู้ว่าจ้าง</div></div>`};
function handPunch(){
  const td=today(),PS=[['open','ค้าง'],['fix','แก้แล้ว รอตรวจ'],['done','ปิดแล้ว']];
  const cols=[{k:'no',h:'เลขที่',w:70},{k:'loc',h:'ตำแหน่ง',w:150},{k:'item',h:'รายการที่ต้องแก้ไข',t:'area',w:260},{k:'g',h:'ระบบ',t:'sel',o:G_OPTS(),w:140},{k:'who',h:'ผู้รับผิดชอบ',w:110},{k:'found',h:'วันที่พบ',t:'date'},{k:'due',h:'กำหนดเสร็จ',t:'date'},{k:'status',h:'สถานะ',t:'sel',o:PS},{h:'',t:'calc',f:r=>r.status!=='done'&&okD(r.due)&&r.due<td?'<span class="pill bad">เลยกำหนด</span>':''},{h:'รูป',t:'calc',r:1,f:r=>(r.photos||[]).length||''}];
  TABLES.punch={rows:()=>P.punch,cols};const sel=P.punch.find(r=>r.id===S.sel.punch);
  return `<dl class="stats"><div><dt>ทั้งหมด</dt><dd>${P.punch.length}</dd></div><div><dt>ค้าง</dt><dd style="color:var(--danger)">${P.punch.filter(r=>r.status==='open').length}</dd></div><div><dt>รอตรวจ</dt><dd>${P.punch.filter(r=>r.status==='fix').length}</dd></div><div><dt>ปิดแล้ว</dt><dd style="color:var(--good)">${P.punch.filter(r=>r.status==='done').length}</dd></div></dl>
  <section class="card"><h2><span>รายการงานค้างแก้ไข (Punch list)</span><span class="sp"></span>${copyBtn('punch')}<button type="button" class="btn sm" data-a="print" data-k="punch">พิมพ์</button></h2>${gtable('punch',P.punch,cols,{extra:r=>`<button type="button" class="btn sm" data-a="sel" data-k="punch" data-id="${r.id}">รูป</button>`})}
  <div class="row" style="margin-top:8px"><button type="button" class="btn sm pri" data-a="add" data-c="punch">+ เพิ่มรายการ</button></div></section>
  ${sel?`<section class="card"><h2>รูปถ่าย ${esc(sel.no)} ${esc(sel.loc)}</h2>${photoBlock('punch.'+sel.id,sel)}</section>`:''}`;
}
PRINT.punch=()=>phead('รายการงานค้างแก้ไข (Punch list)')+`<table><thead><tr><th>เลขที่</th><th>ตำแหน่ง</th><th>รายการ</th><th>ผู้รับผิดชอบ</th><th>กำหนดเสร็จ</th><th>สถานะ</th></tr></thead><tbody>${P.punch.map(r=>`<tr><td>${esc(r.no)}</td><td>${esc(r.loc)}</td><td>${esc(r.item)}</td><td>${esc(r.who)}</td><td>${thD(r.due)}</td><td>${{open:'ค้าง',fix:'แก้แล้ว รอตรวจ',done:'ปิดแล้ว'}[r.status]||''}</td></tr>`).join('')}</tbody></table>`;
function handOM(){
  const cols=[{k:'g',h:'ระบบ',t:'sel',o:G_OPTS(),w:160},{k:'item',h:'เอกสาร',w:300},{k:'status',h:'สถานะ',t:'sel',o:[['none','ยังไม่มี'],['draft','กำลังจัดทำ'],['done','ส่งมอบแล้ว']]},{k:'note',h:'หมายเหตุ',w:200}];
  TABLES.om={rows:()=>P.om,cols};const d=P.om.filter(r=>r.status==='done').length;
  return `<section class="card"><h2><span>เอกสารส่งมอบ (O&M)</span><small>ส่งมอบแล้ว ${d}/${P.om.length}</small><span class="sp"></span>${copyBtn('om')}</h2>
  <div class="form" style="margin-bottom:12px"><label>วันที่ส่งมอบงาน<input type="date" data-p="info.handover" value="${esc(P.info.handover||'')}"></label></div>${gtable('om',P.om,cols)}
  <div class="row" style="margin-top:8px"><button type="button" class="btn sm pri" data-a="add" data-c="om">+ เพิ่มเอกสาร</button><button type="button" class="btn sm" data-a="genOM">สร้างรายการตามระบบใน BOQ</button></div></section>`;
}
function handWar(){
  const td=today(),end=r=>{if(!okD(r.start))return '';const d=pd(r.start);d.setMonth(d.getMonth()+n(r.months));return iso(d)};
  const cols=[{k:'item',h:'รายการ',w:300},{k:'vendor',h:'ผู้ขาย / ผู้รับประกัน',w:170},{k:'start',h:'เริ่มประกัน',t:'date'},{k:'months',h:'เดือน',t:'num',w:60},{h:'หมดประกัน',t:'calc',f:r=>thD(end(r))},{h:'สถานะ',t:'calc',f:r=>{const e=end(r);if(!e)return '';const k=diffD(td,e);return k<0?'<span class="pill">หมดแล้ว</span>':k<=60?`<span class="pill warn">เหลือ ${k} วัน</span>`:'<span class="pill ok">อยู่ในประกัน</span>'}},{k:'note',h:'หมายเหตุ',w:160}];
  TABLES.war={rows:()=>P.war,cols};
  return `<section class="card"><h2><span>ทะเบียนการรับประกัน</span><small>เตือนเมื่อเหลือไม่ถึง 60 วัน</small><span class="sp"></span>${copyBtn('war')}</h2>${gtable('war',P.war,cols)}
  <div class="row" style="margin-top:8px"><button type="button" class="btn sm pri" data-a="add" data-c="war">+ เพิ่มรายการ</button><button type="button" class="btn sm" data-a="genWar">สร้างจากอุปกรณ์หลักใน BOQ</button></div></section>`;
}
// money actually received on a bill: its receipts (part payments), or the whole net once it is marked paid
function billRcList(b){const r=(b.rcpts||[]).filter(x=>n(x.amt));if(r.length)return r.map(x=>({date:okD(x.date)?x.date:b.paid||b.date,amt:n(x.amt)}));return b.status==='paid'?[{date:b.paid||b.date,amt:billCalc(b).net}]:[]}
function billRecv(b){return sum(billRcList(b),x=>x.amt)}

