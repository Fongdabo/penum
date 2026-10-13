/* ---------- salary structure: skills drive pay (same rules as HR-SK-03/05 in mep-skill-forms.xlsx) ---------- */
const PAY0={note:'ตัวเลขสมมติ อิงตลาดงาน MEP กรุงเทพฯ ปี 2569 ต่อเดือน (บาท) ปรับได้',
  bands:[['G1','พนักงานปฏิบัติการ',12000,18000],['G2','เจ้าหน้าที่ / ช่าง',15000,26000],['G3','เจ้าหน้าที่อาวุโส / โฟร์แมน',20000,35000],['G4','วิศวกร / ผู้เชี่ยวชาญ',25000,45000],['G5','หัวหน้าฝ่าย',35000,60000],['G6','ผู้จัดการ',50000,90000],['G7','ผู้อำนวยการ',80000,140000],['G8','กรรมการผู้จัดการ',120000,220000]],
  map:{'กรรมการผู้จัดการ':'G8','ผู้อำนวยการฝ่ายธุรกิจ':'G7','ผู้อำนวยการฝ่ายปฏิบัติการ':'G7','ผู้อำนวยการฝ่ายบริหาร':'G7','ผู้จัดการฝ่ายขาย':'G6','ผู้จัดการฝ่ายออกแบบ (วิศวกรลงนาม)':'G6','ผู้จัดการโครงการ (PM)':'G6','ผู้จัดการบัญชี':'G6','หัวหน้าประมาณราคา':'G5','หัวหน้าจัดซื้อ':'G5','หัวหน้างานบริการ':'G5','หัวหน้าฝ่ายบุคคล':'G5','วิศวกรเครื่องกล':'G4','วิศวกรไฟฟ้า':'G4','วิศวกรโครงการ':'G4','จป.วิชาชีพ':'G4','พนักงานขาย':'G3','ช่างเขียนแบบ / BIM Modeler':'G3','เจ้าหน้าที่ถอดแบบ (QS)':'G3','โฟร์แมน':'G3','ธุรการขาย':'G2','ช่างติดตั้ง (แอร์ ท่อ ไฟฟ้า)':'G2','ธุรการเอกสารโครงการ':'G2','เจ้าหน้าที่จัดซื้อ':'G2','พนักงานบัญชี':'G2','เจ้าหน้าที่การเงิน':'G2','เจ้าหน้าที่บุคคล':'G2','ช่างบริการ':'G2','พนักงานคลัง':'G1','ธุรการ':'G1','ผู้รับแจ้งซ่อม':'G1'},
  merit:[['A',0.08,0.06,0.04],['B',0.05,0.04,0.025],['C',0.02,0.015,0],['D',0,0,0]],
  allow:[['ใบ กว. ระดับภาคีวิศวกร',3000],['ใบ กว. ระดับสามัญวิศวกร',6000],['ใบ กว. ระดับวุฒิวิศวกร',10000],['ได้รับแต่งตั้งเป็น จป.หัวหน้างาน',1000],['มาตรฐานฝีมือแรงงานแห่งชาติ ตรงสาขา',1000]]};
const DAYS_M=26;// a daily-paid person's month = 26 working days, the same base rateH() uses
function payCfg(){const C=CO();if(!C.pay)C.pay={bands:PAY0.bands.map(([g,nm,min,max])=>({id:uid(),g,n:nm,min,max})),merit:PAY0.merit.map(([g,lo,mid,hi])=>({id:uid(),g,lo,mid,hi})),allow:PAY0.allow.map(([nm,amt])=>({id:uid(),n:nm,amt}))};return C.pay}
const r100=v=>Math.round(v/100)*100,r10=v=>Math.round(v/10)*10;
function band(g){const b=payCfg().bands.find(x=>x.g===g);if(!b)return null;const lo=n(b.min),hi=n(b.max);return {g:b.g,n:b.n,min:lo,max:hi,mid:r100((lo+hi)/2),p25:r100(lo+(hi-lo)*0.25),p75:r100(lo+(hi-lo)*0.75)}}
const gradeOf=s=>s.grade||PAY0.map[s.role]||'';
const monthly=s=>s.wtype==='month'?n(s.wage):n(s.wage)*DAYS_M;
const fromMonthly=(s,m)=>s.wtype==='month'?m:Math.round(m/DAYS_M);
// % of the role's required skills the person meets; null until at least one is assessed
function skillPct(s){const R=reqSkills(s),sk=s.sk||{};if(!R.length||!R.some(x=>sk[x.k]!=null&&sk[x.k]!==''))return null;return Math.round(R.filter(x=>n(sk[x.k])>=x.req).length*100/R.length)}
// starting pay range from skill %: <70 min–p25 · 70–89 p25–mid · ≥90 mid–p75 (p75–max kept for proven people)
function startRange(s){const b=band(gradeOf(s)),p=skillPct(s);if(!b||p==null)return null;return p<70?[b.min,b.p25,'ต่ำกว่า 70%']:p<90?[b.p25,b.mid,'70–89%']:[b.mid,b.p75,'90% ขึ้นไป']}
function review(s){const sp=skillPct(s),ok=sp!=null&&s.kpi!==''&&s.kpi!=null&&s.beh!==''&&s.beh!=null;
  const tot=ok?Math.round((sp*0.4+n(s.kpi)*0.4+n(s.beh)*0.2)*10)/10:null,gr=tot==null?'':tot>=90?'A':tot>=75?'B':tot>=60?'C':'D';
  const b=band(gradeOf(s)),cur=monthly(s),compa=b&&cur?Math.round(cur/b.mid*100)/100:null;
  const m=payCfg().merit.find(x=>x.g===gr),pct=m&&compa!=null?n(compa<0.9?m.lo:compa<=1.1?m.mid:m.hi):null;
  const raw=pct!=null?r10(cur*(1+pct)):null,nw=raw!=null?Math.min(raw,Math.max(b.max,cur)):null,lump=raw!=null?Math.max(0,raw-nw):0;
  return {sp,tot,gr,b,cur,compa,pct,nw,lump}}
function alwOf(s){return sum(payCfg().allow.filter(a=>s['a_'+a.id]),a=>a.amt)}
const bandPill=s=>{const b=band(gradeOf(s));if(!b)return '<span class="muted">–</span>';const m=monthly(s);return `${b.g} <span class="pill ${!m?'':m<b.min?'bad':m>b.max?'warn':'ok'}">${!m?'':m<b.min?'ต่ำกว่ากระบอก':m>b.max?'เกินเพดาน':'อยู่ในกระบอก'}</span>`};

function hrBand(){const C=CO(),PC=payCfg();
  const bc=[{k:'g',h:'กระบอก',w:60},{k:'n',h:'ชื่อระดับ',w:200},{k:'min',h:'ต่ำสุด',t:'num',w:90},{h:'จุด 25%',t:'calc',r:1,f:b=>fmt(band(b.g).p25)},{h:'กึ่งกลาง',t:'calc',r:1,f:b=>fmt(band(b.g).mid)},{h:'จุด 75%',t:'calc',r:1,f:b=>fmt(band(b.g).p75)},{k:'max',h:'สูงสุด',t:'num',w:90},
    {h:'ตำแหน่งในกระบอกนี้',t:'calc',f:b=>`<small>${esc(Object.keys(PAY0.map).filter(r=>PAY0.map[r]===b.g).join(', '))}</small>`},{h:'คนในกระบอก',t:'calc',r:1,f:b=>C.staff.filter(s=>s.active!==false&&gradeOf(s)===b.g).length||''}];
  const mc=[{k:'g',h:'เกรดผลประเมิน',w:70},{k:'lo',h:'ต่ำกว่ากึ่งกลาง (Compa < 0.90)',t:'num',w:110},{k:'mid',h:'ใกล้กึ่งกลาง (0.90–1.10)',t:'num',w:110},{k:'hi',h:'สูงกว่ากึ่งกลาง (> 1.10)',t:'num',w:110}];
  const ac=[{k:'n',h:'ค่าตำแหน่ง / ใบอนุญาต',w:280},{k:'amt',h:'บาท/เดือน',t:'num',w:90},{h:'คนที่ได้',t:'calc',r:1,f:a=>C.staff.filter(s=>s.active!==false&&s['a_'+a.id]).length||''}];
  TABLES.band={rows:()=>PC.bands,cols:bc};
  return `<section class="card"><h2><span>กระบอกเงินเดือน G1–G8</span><small>${esc(PAY0.note)} แก้ตัวเลขในช่องได้เลย</small><span class="sp"></span>${copyBtn('band')}</h2>${gtable('co.pay.bands',PC.bands,bc,{del:false})}</section>
  <div class="grid2"><section class="card"><h2><span>ตารางขึ้นเงินเดือนประจำปี</span><small>ใส่เป็นทศนิยม เช่น 0.06 = 6%</small></h2>${gtable('co.pay.merit',PC.merit,mc,{del:false})}</section>
  <section class="card"><h2><span>ค่าตำแหน่งและค่าใบอนุญาต</span><small>จ่ายแยกจากเงินเดือน ติ๊กให้แต่ละคนที่แท็บ “ประเมินและขึ้นเงินเดือน”</small></h2>${gtable('co.pay.allow',PC.allow,ac)}<div class="row" style="margin-top:8px"><button type="button" class="btn sm" data-a="add" data-c="co.pay.allow">+ เพิ่มรายการ</button></div></section></div>
  <section class="card"><h2>กติกา</h2><ul class="hint" style="line-height:1.8;padding-left:18px">
  <li><b>พนักงานใหม่</b> ใช้ % ทักษะที่ผ่านเกณฑ์กำหนดเงินเริ่ม: ต่ำกว่า 70% = ต่ำสุดถึงจุด 25% · 70–89% = จุด 25% ถึงกึ่งกลาง · 90% ขึ้นไป = กึ่งกลางถึงจุด 75% · ช่วงบนสุดเก็บไว้ให้คนที่พิสูจน์ผลงานแล้ว</li>
  <li><b>คะแนนประจำปี</b> = ทักษะ % ผ่าน × 40% + ผลงาน KPI × 40% + พฤติกรรม × 20% · เกรด A ≥ 90 · B ≥ 75 · C ≥ 60 · D ต่ำกว่านั้น</li>
  <li><b>Compa-ratio</b> = เงินเดือนปัจจุบัน ÷ กึ่งกลางกระบอก คนที่ยังต่ำกว่ากึ่งกลางได้ % ขึ้นมากกว่า</li>
  <li><b>เพดานกระบอก</b> เงินเดือนใหม่ไม่เกินค่าสูงสุด ส่วนที่เกินจ่ายเป็นเงินก้อนครั้งเดียว ไม่บวกเข้าเงินเดือน</li>
  <li><b>เลื่อนตำแหน่ง</b> ขึ้นอย่างน้อย 10% หรือถึงค่าต่ำสุดของกระบอกใหม่ แล้วแต่ค่าไหนสูงกว่า</li>
  <li><b>พนักงานรายวัน</b> เทียบเป็นเดือนละ ${DAYS_M} วัน และต้องไม่ต่ำกว่าค่าจ้างขั้นต่ำของจังหวัดหรืออัตรามาตรฐานฝีมือแรงงานที่ประกาศ</li></ul></section>`}

function hrRev(){const C=CO(),PC=payCfg(),L=C.staff.filter(s=>s.active!==false),R=new Map(L.map(s=>[s.id,review(s)]));
  const cols=[{h:'พนักงาน',t:'calc',f:s=>`<b style="white-space:nowrap">${esc(s.name||s.code)}</b><br><small class="muted">${esc(s.role||'')}</small>`,tv:s=>s.name},
    {k:'grade',h:'กระบอก',t:'sel',w:155,o:s=>[['',`${PAY0.map[s.role]||'–'} ตามตำแหน่ง`],...PC.bands.map(b=>[b.g,b.g])]},
    {h:'เงินเดือนปัจจุบัน',t:'calc',r:1,f:s=>`${fmt(monthly(s))}${s.wtype==='day'?`<br><small class="muted">${fmt(n(s.wage))}/วัน</small>`:''}`,tv:s=>monthly(s)},
    {h:'ทักษะ % ผ่าน',t:'calc',r:1,f:s=>{const p=R.get(s.id).sp;return p==null?`<button type="button" class="btn sm" data-a="go" data-m="co" data-k="hr" data-s="skill" data-sks="${s.id}">ประเมิน</button>`:`<span class="pill ${p>=90?'ok':p>=70?'warn':'bad'}">${p}%</span>`},tv:s=>R.get(s.id).sp??''},
    {k:'kpi',h:'ผลงาน KPI',t:'num',w:60},{k:'beh',h:'พฤติกรรม',t:'num',w:60},
    {h:'คะแนนรวม',t:'calc',r:1,f:s=>{const x=R.get(s.id);return x.tot==null?'':`${x.tot} <b>${x.gr}</b>`},tv:s=>R.get(s.id).tot??''},
    {h:'Compa',t:'calc',r:1,f:s=>{const c=R.get(s.id).compa;return c==null?'':c.toFixed(2)},tv:s=>R.get(s.id).compa??''},
    {h:'% ขึ้น',t:'calc',r:1,f:s=>{const p=R.get(s.id).pct;return p==null?'':fmt(p*100,1)+'%'},tv:s=>R.get(s.id).pct??''},
    {h:'เงินเดือนใหม่',t:'calc',r:1,f:s=>{const x=R.get(s.id);return x.nw==null?'':`<b>${fmt(x.nw)}</b>${s.wtype==='day'?`<br><small class="muted">${fmt(fromMonthly(s,x.nw))}/วัน</small>`:''}`},tv:s=>R.get(s.id).nw??''},
    {h:'เงินก้อน',t:'calc',r:1,f:s=>{const l=R.get(s.id).lump;return l?fmt(l):''},tv:s=>R.get(s.id).lump||''},
    ...PC.allow.map(a=>({k:'a_'+a.id,h:`<small title="${esc(a.n)}">${esc(a.n.replace(/^ใบ กว\. ระดับ|^ได้รับแต่งตั้งเป็น |ตรงสาขา$/g,''))}</small>`,t:'chk'})),
    {h:'ค่าใบอนุญาต/เดือน',t:'calc',r:1,f:s=>{const v=alwOf(s);return v?fmt(v):''},tv:s=>alwOf(s)||''}];
  TABLES.rev={rows:()=>L,cols};
  const ready=L.filter(s=>R.get(s.id).nw!=null),inc=sum(ready,s=>(R.get(s.id).nw-R.get(s.id).cur)*12),lump=sum(ready,s=>R.get(s.id).lump);
  return `<dl class="stats"><div><dt>ประเมินครบแล้ว</dt><dd>${ready.length} <small>/ ${L.length} คน</small></dd></div><div><dt>เงินเดือนเพิ่มทั้งปี</dt><dd>${fmt(inc)}</dd></div><div><dt>เงินก้อนส่วนเกินเพดาน</dt><dd>${fmt(lump)}</dd></div><div><dt>ค่าใบอนุญาตต่อเดือน</dt><dd>${fmt(sum(L,alwOf))}</dd></div></dl>
  <section class="card"><h2><span>ประเมินประจำปีและขึ้นเงินเดือน</span><small>ทักษะ % ผ่านดึงจากสกิลชีตอัตโนมัติ กรอก KPI และพฤติกรรม (0–100) ระบบคิด % ขึ้นตามตาราง</small><span class="sp"></span>${copyBtn('rev')}</h2>
  ${gtable('co.staff',L,cols,{del:false,extra:s=>{const x=R.get(s.id);return x.nw!=null&&x.nw!==x.cur?`<button type="button" class="btn sm pri" data-a="applyRaise" data-id="${s.id}">ใช้เงินเดือนใหม่</button>`:''}})}
  <p class="hint" style="margin-top:6px">พนักงานรายวันเทียบเป็นเดือนละ ${DAYS_M} วัน · กด “ใช้เงินเดือนใหม่” เพื่อเปลี่ยนอัตราในทะเบียนพนักงาน ระบบเก็บประวัติไว้</p></section>
  ${(()=>{const H=L.flatMap(s=>(s.raises||[]).map(r=>({s,...r}))).sort((a,b)=>b.date.localeCompare(a.date));return H.length?`<section class="card"><h2>ประวัติการปรับเงินเดือน</h2><div class="tw"><table><thead><tr><th>วันที่</th><th>พนักงาน</th><th>เกรด</th><th class="r">เดิม</th><th class="r">ใหม่</th><th class="r">เงินก้อน</th></tr></thead><tbody>${H.map(h=>`<tr><td>${thD(h.date)}</td><td>${esc(h.s.name)}</td><td>${h.gr}</td><td class="r">${fmt(h.from)}</td><td class="r">${fmt(h.to)}</td><td class="r">${h.lump?fmt(h.lump):''}</td></tr>`).join('')}</tbody></table></div></section>`:''})()}`}
ACT.applyRaise=b=>{const s=CO().staff.find(x=>x.id===b.dataset.id);if(!s)return;const x=review(s);if(x.nw==null)return;const to=fromMonthly(s,x.nw);
  if(!confirm(`ปรับอัตราของ ${s.name} จาก ${fmt(n(s.wage))} เป็น ${fmt(to)} บาท${s.wtype==='day'?'/วัน':'/เดือน'}${x.lump?`\nและจ่ายเงินก้อน ${fmt(x.lump)} บาท`:''}?`))return;
  (s.raises=s.raises||[]).push({date:today(),gr:x.gr,from:n(s.wage),to,lump:x.lump});s.wage=to;save();render();toast('ปรับเงินเดือนแล้ว')};
// a link from the review table opens that person's skill sheet
{const g=ACT.go;ACT.go=b=>{if(b.dataset.sks)S.sel.sks=b.dataset.sks;g(b)}}

CVIEWS.hr=()=>{const {cur,html}=subTabs('hr',[['staff','พนักงานและจัดคนลงหน้างาน'],['ts','ลงเวลาทำงาน'],['pay','สรุปค่าแรง'],['skill','สกิลชีต'],['gap','แผนอบรม'],['rev','ประเมินและขึ้นเงินเดือน'],['band','โครงสร้างเงินเดือน']]);return html+({staff:hrStaff,ts:hrTs,pay:hrPay,skill:hrSkill,gap:hrGap,rev:hrRev,band:hrBand}[cur])()};

