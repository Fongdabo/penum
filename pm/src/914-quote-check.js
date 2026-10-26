/* ---------- 4.31 fewer typing mistakes on a quotation (user: "ปัญหาที่ผมเจอบ่อยเลยคือพิมพ์ผิดพิมพ์ถูก", asked for all 4 checks) ----------
   1. A name that matches nothing in the price library offers the closest names ("หมายถึง…"), and a line whose name is one or two
      letters off a known name or word is flagged, with a button that puts the right spelling in.
   2. Odd numbers: a cost far from the price library's, a quantity that looks held down (9999) or far too big, a fraction of a
      countable unit, a line sold below cost, a line with no price.
   3. The same line twice in one section (merge them with one press), and a unit that does not fit the item (cable in ตัว, a machine
      in เมตร, or not the unit the price library uses).
   4. "ตรวจใบก่อนส่ง" next to พิมพ์ใบเสนอราคา lists everything to look at on the whole quotation; each line item jumps to its row.
   All of them only warn: nothing stops a save, a status change or a print. The lines table (982 qlTable) calls qcRow / qcBar. */
const qcNorm=s=>String(s||'').toLowerCase().replace(/[\s"'`.,:;()\[\]\/\\\-–—_+×*#]+/g,' ').trim();
const qcNums=s=>(String(s||'').match(/\d+(?:[.,]\d+)*/g)||[]).map(x=>x.replace(/,/g,'')).join('|');
const qcGrams=s=>{const t=qcNorm(s).replace(/ /g,''),m=new Map();for(let k=0;k<t.length-1;k++){const g=t.substr(k,2);m.set(g,(m.get(g)||0)+1)}return m};
const qcDice=(a,b)=>{let c=0,na=0,nb=0;a.forEach(v=>na+=v);b.forEach(v=>nb+=v);if(!na||!nb)return 0;a.forEach((v,g)=>{const w=b.get(g);if(w)c+=Math.min(v,w)});return 2*c/(na+nb)};
const qcLev=(a,b,mx)=>{if(Math.abs(a.length-b.length)>mx)return mx+1;let p=Array.from({length:b.length+1},(_,j)=>j);
  for(let i=1;i<=a.length;i++){const c=[i];let lo=i;for(let j=1;j<=b.length;j++){c[j]=Math.min(p[j]+1,c[j-1]+1,p[j-1]+(a[i-1]===b[j-1]?0:1));if(c[j]<lo)lo=c[j]}if(lo>mx)return mx+1;p=c}return p[b.length]};
const QC_CNT=/^(ตัว|เครื่อง|ตู้|ลูก|จุด|แผง|ใบ|หลอด|โคม|ชิ้น|อัน|ต้น|ถัง|หัว|ห้อง|คัน|set|pcs?|ea|unit|nos?\.?)$/i;
const QC_CAB=/สาย\s*(ไฟ|lan|ลำโพง|นำสัญญาณ|ทนไฟ|ตัวนำ|ใยแก้ว|ดิน|สัญญาณ|เคเบิล)|cable(?! tray)|\bwire\b/i,QC_PIPE=/ท่อ(?!.*(ม้วน|coil|(?<!(ไป|เข้า|จาก|ถึง|ที่|ของ)\s*)(ตู้|ปั๊ม)))|รางครอบ|รางเดินสาย|wireway|cable tray|duct cover/i,
  QC_ACC=/ข้อต่อ|ข้องอ|ข้อลด|สามทาง|วาล์ว|valve|elbow|\btee\b|fitting|ฝาครอบ|\bcap\b|แคล้ม|clamp|ขาแขวน|ขายึด|hanger|support|กล่อง|\bbox\b|เทป|tape|กาว|หัวต่อ|ปลายสาย|หางปลา|lug|connector|gland|เข้าหัว|ติดตั้ง/i;
// 4.76: a pipe that runs to a cabinet or from a pump ("ท่อ FHC ไปตู้ดับเพลิง", "ท่อส่งน้ำจากปั๊ม") is still a pipe, so metres are right (TOYOTA CANTEEN)
const QC_LENI={test:s=>(QC_CAB.test(s)||QC_PIPE.test(s))&&!QC_ACC.test(s)};
const QC_MACH=/แอร์|เครื่อง(ปรับ|ทำ|กำเนิด|บันทึก|ขยาย|สแกน|อ่าน|เติม)|ปั๊ม|pump|พัดลม|\bfan\b|chiller|\bfcu\b|\bahu\b|กล้อง|camera|ตู้(?!.*ท่อ)|ups|inverter|อินเวอร์เตอร์/i;
// 4.47 one name per unit, so ม. and เมตร are not told apart
const qcUn=u=>{const k=qcNorm(u).replace(/ /g,'');return /^(ม|เมตร|m|meter|metre|lm)$/.test(k)?'m':/^(ตรม|ตารางเมตร|sqm|m2|m²)$/.test(k)?'m2':/^(ลบม|ลูกบาศก์เมตร|cum|m3|m³)$/.test(k)?'m3':/^(กก|กิโลกรัม|kg)$/.test(k)?'kg':/^(ชิ้น|pcs?|ea)$/.test(k)?'pc':k};
const QC_AREA=/^(ตร\.?ม\.?|ตารางเมตร|sq\.?\s?m|m2|m²)$/i;
// what the names are checked against: the price library and sample products, plus lines on the company's OTHER quotations
let qcLibC=null;
const qcLib=Q=>{const C=CO(),sig=(C.prices||[]).length+'|'+(C.prices||[]).reduce((s,x)=>s+n(x.m)+n(x.l),0)+'|'+C.quotes.length+'|'+C.quotes.reduce((s,q)=>s+(q.items||[]).length,0)+'|'+Q.id;if(qcLibC&&qcLibC.sig===sig)return qcLibC;
  let L=[];try{L=qlLib().filter(x=>!x.past)}catch(e){L=[]}const seen=new Set(L.map(x=>qcNorm(qlLab(x)))),past={};
  C.quotes.forEach(q=>{if(q.id===Q.id)return;(q.items||[]).forEach(i=>{const k=qcNorm(i.desc);if(!k)return;past[k]=(past[k]||0)+1;
    if(!seen.has(k)&&n(i.m)+n(i.l)){seen.add(k);L.push({name:String(i.desc).trim(),g:i.g,unit:i.unit||'',m:n(i.m),l:n(i.l),past:1})}})});
  const R=L.map(x=>({x,lab:qlLab(x),k:qcNorm(qlLab(x)),kn:qcNorm(x.name),num:qcNums(x.name),gr:qcGrams(x.name)})),by=new Map();R.forEach(r=>{if(!by.has(r.k))by.set(r.k,r);if(!by.has(r.kn))by.set(r.kn,r)});
  const W=new Map(),U=new Set();R.forEach(r=>{const own=!(r.x.past&&past[r.kn]<2);r.kn.split(' ').forEach(w=>{if(w.length<5||/\d/.test(w))return;U.add(w);if(own)W.set(w,(W.get(w)||0)+1)})});
  qcLibC={sig,R,by,W,U,memo:new Map()};return qcLibC};
const qcBest=(lib,s,min)=>{const g=qcGrams(s),num=qcNums(s);let b=null,bs=min;lib.R.forEach(r=>{const d=qcDice(g,r.gr);if(d>bs&&r.num===num){bs=d;b=r}});return b?{r:b,d:bs}:null};
const qcNear=(lib,s,k)=>{const g=qcGrams(s);return lib.R.map(r=>({r,d:qcDice(g,r.gr)})).filter(o=>o.d>=.38).sort((a,b)=>b.d-a.d).slice(0,k||6)};
// the spelling of one name: [kind,library row or word fix], remembered per name
const qcSpell=(lib,desc)=>{const k=qcNorm(desc);if(!k||k.length<4||lib.by.has(k))return null;if(lib.memo.has(k))return lib.memo.get(k);let res=null;
  const b=qcBest(lib,desc,.8);if(b)res={t:'name',r:b.r};
  else{for(const w of k.split(' ')){if(w.length<5||/\d/.test(w)||lib.W.has(w)||lib.U.has(w))continue;const lim=w.length>=8?2:1;let bw=null,bd=lim+1,bc=0;
      lib.W.forEach((c,x)=>{if(Math.abs(x.length-w.length)>lim)return;const d=qcLev(w,x,lim);if(d<=lim&&(d<bd||(d===bd&&c>bc))){bd=d;bw=x;bc=c}});
      if(bw&&bd>0){const m=String(desc).match(new RegExp(w.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),'i'));res={t:'word',w:m?m[0]:w,fix:bw};break}}}
  lib.memo.set(k,res);return res};
// every warning on one line: {lv:'e'|'w', t:text, fx:button html}
function qcLine(Q,i,k){const W=[],lib=qcLib(Q),b=`co.quotes.${Q.id}.items.${i.id}`,u=String(i.unit||'').trim(),q=n(i.q),cu=n(i.m)+n(i.l)||n(i.t)/(q||1e-9),sp=qUnit(Q,i),
    fx=(p,v,l)=>`<button type="button" class="qc-fx" data-a="qcFix" data-p="${p}" data-v="${esc(v)}">${l}</button>`,d=String(i.desc||'').trim();
  if(i.hs)return W;
  if(!d)W.push({lv:'e',t:'ยังไม่มีชื่อรายการ'});
  const sl=d&&qcSpell(lib,d);
  if(sl&&sl.t==='name')W.push({lv:'w',t:`ชื่อคล้าย “${sl.r.lab}” พิมพ์ผิดหรือเปล่า`,fx:fx(b+'.desc',sl.r.lab,'ใช้ชื่อนี้')});
  if(sl&&sl.t==='word')W.push({lv:'w',t:`“${sl.w}” อาจสะกดผิด หมายถึง “${sl.fix}”`,fx:fx(b+'.desc',d.replace(sl.w,sl.fix),'แก้คำนี้')});
  // 4.47 a unit the user chose for this item (934 qcuGet) is the reference instead of the library or older quotations
  const mem=typeof qcuGet==='function'&&qcuGet(d),lx=mem?{x:{unit:mem.u,m:n(mem.m),l:n(mem.l),mem:1}}:d&&(lib.by.get(qcNorm(d))||null),src=x=>x.mem?'ที่บันทึกไว้':x.past?'ที่เคยเสนอ':'คลังราคา';
  if(!q)W.push({lv:'e',t:'จำนวนเป็น 0'});
  else if(QC_CNT.test(u)&&Math.abs(q-Math.round(q))>1e-9)W.push({lv:'w',t:`จำนวน ${fmtq(q)} มีทศนิยม แต่หน่วยเป็น “${u}”`});
  else if(QC_CNT.test(u)&&q>=1000)W.push({lv:'w',t:`จำนวน ${fmt(q)} ${u} เยอะผิดปกติ`});
  const held=[['จำนวน',i.q],['ทุนของ',i.m],['ทุนแรง',i.l],['ราคาขาย',i.sp]].find(([,v])=>/^(\d)\1{3,}$/.test(String(v==null?'':v).replace(/\.0+$/,'')));
  if(held)W.push({lv:'w',t:`${held[0]} ${fmt(n(held[1]))} ดูเหมือนกดตัวเลขค้าง`});
  if(!cu&&!(n(i.sp)>0))W.push({lv:'e',t:'ยังไม่มีราคา'});
  else if(q&&sp<cu-1e-6)W.push({lv:'e',t:`ราคาขาย ${fmt(sp,2)} ต่ำกว่าทุน ${fmt(cu,2)} (ขาดทุน)`});
  const lc=lx&&n(lx.x.m)+n(lx.x.l),own=n(i.m)+n(i.l);
  // prices are compared only in the same unit: a Lot price says nothing about a price per ตัว
  if(lc&&own&&(!lx.x.unit||!u||qcUn(lx.x.unit)===qcUn(u))&&(own/lc>=2||own/lc<=.5))W.push({lv:'w',t:`ทุน/หน่วย ${fmt(own,2)} ห่างจาก${src(lx.x)} ${fmt(lc,2)} มาก (${own>lc?'สูงกว่า':'ต่ำกว่า'} ${fmt(own>lc?own/lc:lc/own,1)} เท่า)`,fx:typeof qcuBtns==='function'?qcuBtns(Q,i,0):''});
  if(!u)W.push({lv:'w',t:'ยังไม่ได้ใส่หน่วย'});
  else if(lx&&lx.x.unit&&qcUn(lx.x.unit)!==qcUn(u))W.push({lv:'w',t:`${src(lx.x)}ใช้หน่วย “${lx.x.unit}” ไม่ใช่ “${u}”`,fx:fx(b+'.unit',lx.x.unit,'ใช้ '+esc(lx.x.unit))+(typeof qcuBtns==='function'?qcuBtns(Q,i,1,lx.x.unit):'')});
  else if(QC_LENI.test(d)&&(QC_CNT.test(u)||(QC_AREA.test(u)&&QC_CAB.test(d))))W.push({lv:'w',t:`หน่วย “${u}” ไม่น่าเข้ากับสาย/ท่อ ปกติคิดเป็นเมตร`,fx:fx(b+'.unit','ม.','ใช้ ม.')});
  else if(!QC_LENI.test(d)&&QC_MACH.test(d)&&(/^(ม\.?|เมตร|m\.?)$/i.test(u)||QC_AREA.test(u)))W.push({lv:'w',t:`หน่วย “${u}” ไม่น่าเข้ากับเครื่อง/อุปกรณ์ ปกติคิดเป็นชุดหรือเครื่อง`,fx:fx(b+'.unit','ชุด','ใช้ ชุด')});
  const kd=qcNorm(d);if(kd){const j=Q.items.findIndex((x,m)=>m<k&&!x.hs&&x.g===i.g&&(x.head||'')===(i.head||'')&&qcNorm(x.desc)===kd);
    if(j>=0){const x=Q.items[j],same=qcNorm(x.unit)===qcNorm(u)&&n(x.m)===n(i.m)&&n(x.l)===n(i.l)&&!(n(x.sp)>0)&&!(n(i.sp)>0);
      W.push({lv:'w',t:'รายการนี้ซ้ำกับด้านบนในหมวดเดียวกัน',fx:same?`<button type="button" class="qc-fx" data-a="qcMerge" data-id="${Q.id}" data-i="${i.id}" data-j="${x.id}">รวมเป็นแถวเดียว</button>`:''})}}
  return W}
const qcRow=(Q,i,k)=>{const W=qcLine(Q,i,k);return W.length?`<div class="qc-ws">${W.map(w=>`<span class="qc-${w.lv}">${w.lv==='e'?'⛔':'⚠'} ${esc(w.t)}${w.fx||''}</span>`).join('')}</div>`:''};
// the whole quotation
function qcQuote(Q){const C=CO(),A=[],add=(lv,t,go)=>A.push({lv,t,go}),c=qCalc(Q),ma=typeof qmMa==='function'&&qmMa(Q);
  if(!Q.cust||!C.customers.some(x=>x.id===Q.cust))add('e','ยังไม่ได้เลือกลูกค้า','cust');
  if(!String(Q.title||'').trim())add('w','ยังไม่มีชื่องาน','title');
  if(!String(Q.no||'').trim())add('w','ยังไม่มีเลขที่ใบเสนอราคา','no');
  if(!Q.date)add('w','ยังไม่ได้ใส่วันที่','date');else if(n(Q.valid)&&addD(Q.date,n(Q.valid))<today())add('w',`ยืนราคาหมดแล้วตั้งแต่ ${thD(addD(Q.date,n(Q.valid)))} ควรเปลี่ยนวันที่หรือจำนวนวัน`,'date');
  if(!String(Q.signName||'').trim())add('w','ยังไม่ได้ใส่ชื่อผู้ลงนาม','signName');
  if(!(Q.items||[]).length)add('e','ยังไม่มีรายการ');
  if(n(Q.disc)>c.sub&&c.sub>0)add('e',`ส่วนลด ${fmt(n(Q.disc))} มากกว่ายอดรวม`,'disc');else if(c.sub&&n(Q.disc)/c.sub>.15)add('w',`ส่วนลด ${fmt(n(Q.disc)*100/c.sub,1)}% ของยอดรวม ตรวจว่าใส่ถูกไหม`,'disc');
  if(!ma&&(Q.items||[]).length&&!n(Q.mk)&&!(typeof qMkOn==='function'&&qMkOn(Q))&&!Q.items.some(i=>n(i.sp)>0||(typeof qLnMk==='function'&&qLnMk(i))))add('w','ยังไม่ได้ตั้ง % บวกกำไร ราคาขายจึงเท่ากับทุน','mkM');
  if(c.net&&c.cost){const g=(c.net-c.cost)*100/c.net;if(g<0)add('e',`กำไรรวมติดลบ ${fmt(g,1)}%`);else if(g<5)add('w',`กำไรรวมแค่ ${fmt(g,1)}%`)}
  [['qpay',''],['qpayE',' (ค่าเครื่อง)']].forEach(([k,l])=>{const P=Q[k]||[];if(!P.length||(k==='qpayE'&&!Q.eqSep))return;const s=P.reduce((a,x)=>a+n(x.pct),0);if(Math.abs(s-100)>.01)add('w',`งวดชำระเงิน${l}รวม ${fmtq(s)}% ไม่ครบ 100%`)});
  if(Q.eqSep&&!ma&&!(Q.items||[]).some(i=>typeof qmIsEq==='function'&&qmIsEq(i)))add('w','เลือกแยกค่าเครื่องไว้ แต่ยังไม่มีรายการไหนติ๊ก “เครื่อง”');
  const L=[];if(!ma)(Q.items||[]).forEach((i,k)=>{const W=qcLine(Q,i,k);if(W.length)L.push({i,W})});return {A,L,e:A.filter(x=>x.lv==='e').length+L.reduce((s,x)=>s+x.W.filter(w=>w.lv==='e').length,0),w:A.filter(x=>x.lv==='w').length+L.reduce((s,x)=>s+x.W.filter(w=>w.lv==='w').length,0)}}
const qcBtn=Q=>{let r;try{r=qcQuote(Q)}catch(e){return ''}const k=r.e+r.w;
  return `<button type="button" class="btn sm qc-btn${r.e?' bad':k?' warn':' ok'}" data-a="qcOpen" data-id="${Q.id}" title="ตรวจหาจุดที่น่าจะพิมพ์ผิดก่อนส่งให้ลูกค้า">${k?`ตรวจใบก่อนส่ง <b>${k}</b>`:'ตรวจใบก่อนส่ง ✓'}</button>`};
const qcBar=Q=>{let r;try{r=qcQuote(Q)}catch(e){return ''}const m=r.L.reduce((s,x)=>s+x.W.length,0);
  return m?`<div class="qc-bar">⚠ มี ${m} จุดในตารางที่น่าจะพิมพ์ผิด (ดูข้อความสีส้ม/แดงใต้ชื่อรายการ) <button type="button" class="btn sm" data-a="qcOpen" data-id="${Q.id}">ดูทั้งหมด</button></div>`:''};
ACT.qcOpen=b=>{const Q=CO().quotes.find(q=>q.id===b.dataset.id);if(!Q)return;const r=qcQuote(Q),ic=lv=>lv==='e'?'<span class="qc-e">⛔</span>':'<span class="qc-w2">⚠</span>';
  const head=r.A.map(x=>`<li>${ic(x.lv)} ${esc(x.t)}${x.go?` <button type="button" class="btn ghost sm" data-a="qcGo" data-f="${x.go}" data-id="${Q.id}">ไปแก้</button>`:''}</li>`).join(''),
    lines=r.L.map(({i,W})=>`<li><b>${esc(i.desc||'(ไม่มีชื่อ)')}</b> <button type="button" class="btn ghost sm" data-a="qcGo" data-i="${i.id}" data-id="${Q.id}">ไปที่รายการ</button><ul>${W.map(w=>`<li>${ic(w.lv)} ${esc(w.t)}</li>`).join('')}</ul></li>`).join('');
  dialog('ตรวจใบก่อนส่ง',`<p style="margin-top:0">${r.e+r.w?`พบ <b class="qc-e">${r.e}</b> จุดที่ควรแก้ และ <b class="qc-w2">${r.w}</b> จุดที่ควรดูอีกครั้ง (ส่งหรือพิมพ์ได้เลยถ้าตั้งใจไว้แบบนั้น)`:'<b style="color:var(--good)">✓ ไม่พบจุดผิดปกติ พร้อมส่งให้ลูกค้า</b>'}</p>
    ${head?`<h3 class="qc-h">หัวใบเสนอราคา</h3><ul class="qc-l">${head}</ul>`:''}${lines?`<h3 class="qc-h">รายการ (${r.L.length})</h3><ul class="qc-l">${lines}</ul>`:''}`,
    `<button type="button" class="btn pri" data-a="qcPrint" data-id="${Q.id}">พิมพ์ใบเสนอราคา</button>`)};
ACT.qcGo=b=>{$('#dlg').close();const Q=CO().quotes.find(q=>q.id===b.dataset.id);if(!Q)return;const p=`co.quotes.${Q.id}.`+(b.dataset.i?`items.${b.dataset.i}.desc`:b.dataset.f);
  setTimeout(()=>{const e=document.querySelector(`[data-p="${p}"]`);if(!e){toast('ไม่พบช่องนี้บนหน้า');return}e.scrollIntoView({block:'center'});e.focus();e.classList.add('qc-flash');setTimeout(()=>e.classList.remove('qc-flash'),1600)},60)};
ACT.qcPrint=b=>{$('#dlg').close();ACT.print({dataset:{k:'quote',id:b.dataset.id}})};
ACT.qcFix=b=>{const p=b.dataset.p,v=b.dataset.v;setPath(p,v);HOOK.forEach(f=>f(p,v));save();render();toast('แก้แล้ว กด ↶ ย้อนกลับได้ถ้าไม่ใช่')};
ACT.qcMerge=b=>{const Q=CO().quotes.find(q=>q.id===b.dataset.id);if(!Q)return;const i=Q.items.find(x=>x.id===b.dataset.i),x=Q.items.find(y=>y.id===b.dataset.j);if(!i||!x)return;
  x.q=Math.round((n(x.q)+n(i.q))*1e4)/1e4;if(n(x.m)+n(x.l))qlCost(x);else x.t=n(x.t)+n(i.t);Q.items=Q.items.filter(y=>y!==i);save();render();toast(`รวมแล้ว จำนวน ${fmtq(x.q)} ${x.unit||''}`)};
// the check button next to พิมพ์ใบเสนอราคา
{const f=salesQuote;salesQuote=function(){let h=f.apply(this,arguments);const C=CO(),Q=C.quotes.find(q=>q.id===S.sel.quote)||C.quotes.slice().reverse()[0];if(!Q)return h;
  const k=`<button type="button" class="btn sm" data-a="print" data-k="quote" data-id="${Q.id}">`,a=h.indexOf(k);return a<0?h:h.slice(0,a)+qcBtn(Q)+h.slice(a)}}
// a reminder (never a stop) when a quotation with mistakes is printed or marked as sent
const qcNudge=Q=>{try{const r=qcQuote(Q);if(r.e)setTimeout(()=>toast(`ใบนี้ยังมี ${r.e} จุดที่ควรแก้ กด “ตรวจใบก่อนส่ง” เพื่อดู`),400)}catch(e){}};
{const f=ACT.print;ACT.print=function(b){const r=f.apply(this,arguments);if(b&&b.dataset&&b.dataset.k==='quote'){const Q=CO().quotes.find(q=>q.id===b.dataset.id);if(Q)qcNudge(Q)}return r}}
HOOK.push((p,v)=>{const m=p.match(/^co\.quotes\.([^.]+)\.status$/);if(!m||v!=='sent')return;const Q=CO().quotes.find(q=>q.id===m[1]);if(Q)qcNudge(Q)});
// 1. "หมายถึง…": names close to what is typed, when the price library has no name containing it (the browser's own list is empty then)
const qcSug=document.createElement('div');qcSug.className='qc-sug';qcSug.hidden=true;document.addEventListener('DOMContentLoaded',()=>document.body.appendChild(qcSug));
if(document.body)document.body.appendChild(qcSug);
let qcSugEl=null;const qcSugHide=()=>{qcSug.hidden=true;qcSugEl=null};
document.addEventListener('input',e=>{const t=e.target;if(!t||!(t.id==='qlName'||(t.matches&&t.matches('.ql-t input[data-p$=".desc"]'))))return;
  const v=t.value.trim(),C=CO(),Q=C.quotes.find(q=>q.id===S.sel.quote)||C.quotes.slice().reverse()[0];if(v.length<3||!Q){qcSugHide();return}
  const lib=qcLib(Q),lv=v.toLowerCase();if(lib.R.some(r=>r.lab.toLowerCase().includes(lv))){qcSugHide();return}
  const N=qcNear(lib,v,6);if(!N.length){qcSugHide();return}
  qcSug.innerHTML=`<div class="qc-sh">ไม่พบชื่อที่ตรง หมายถึง…</div>`+N.map((o,k)=>`<button type="button" data-k="${k}">${esc(o.r.lab)}<small>${esc([o.r.x.unit,n(o.r.x.m)+n(o.r.x.l)?fmt(n(o.r.x.m)+n(o.r.x.l),2):'',o.r.x.past?'เคยเสนอ':''].filter(Boolean).join(' · '))}</small></button>`).join('');
  qcSug._n=N;qcSugEl=t;const R=t.getBoundingClientRect();Object.assign(qcSug.style,{left:Math.max(8,R.left)+'px',top:(R.bottom+2)+'px',minWidth:Math.max(260,R.width)+'px'});qcSug.hidden=false});
qcSug.addEventListener('mousedown',e=>{const b=e.target.closest('button[data-k]');if(!b||!qcSugEl)return;e.preventDefault();const o=qcSug._n[+b.dataset.k],t=qcSugEl;qcSugHide();
  t.value=o.r.lab;if(t.dataset.p)t.dispatchEvent(new Event('change',{bubbles:true}));else t.focus()});
document.addEventListener('focusout',e=>{if(e.target===qcSugEl)setTimeout(qcSugHide,150)});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!qcSug.hidden)qcSugHide()});
window.addEventListener('scroll',()=>{if(!qcSug.hidden)qcSugHide()},true);
document.head.insertAdjacentHTML('beforeend',`<style>.qc-ws{display:flex;flex-direction:column;gap:2px;margin-top:3px;font-size:11.5px;line-height:1.35}.qc-ws>span{display:flex;flex-wrap:wrap;gap:6px;align-items:center}
.qc-ws>.qc-w,.qc-w2{color:var(--warn-c,#b7791f)}.qc-e{color:var(--danger,#c0392b)}
.qc-fx{font:inherit;font-size:11px;padding:1px 8px;border-radius:10px;border:1px solid currentColor;background:transparent;color:inherit;cursor:pointer}.qc-fx:hover{background:rgba(183,121,31,.12)}
.qc-bar{margin:6px 0;padding:6px 10px;border-radius:8px;background:var(--warn-soft,#fff6e0);color:var(--warn-c,#8a5a00);font-size:13px;display:flex;gap:8px;align-items:center;flex-wrap:wrap}
.qc-btn.bad b{background:var(--danger,#c0392b);color:#fff;border-radius:9px;padding:0 6px;margin-left:4px}.qc-btn.warn b{background:var(--warn-c,#b7791f);color:#fff;border-radius:9px;padding:0 6px;margin-left:4px}.qc-btn.ok{color:var(--good,#1e8e5a)}
.qc-h{font-size:14px;margin:12px 0 4px}.qc-l{margin:0;padding-left:18px;font-size:13.5px;line-height:1.6}.qc-l ul{padding-left:16px;margin:0 0 6px}.qc-l .btn{padding:0 8px;font-size:12px}
.qc-flash{outline:3px solid var(--warn-c,#b7791f)!important;outline-offset:1px}
.qc-sug{position:fixed;z-index:9999;max-width:min(560px,92vw);background:var(--card,#fff);color:var(--text,#222);border:1px solid var(--line,#ccd);border-radius:8px;box-shadow:0 8px 24px rgba(0,0,0,.18);padding:4px;font-size:13px}
.qc-sug .qc-sh{padding:4px 8px;font-size:11.5px;color:var(--warn-c,#b7791f)}.qc-sug button{display:block;width:100%;text-align:left;padding:6px 8px;border:0;background:none;color:inherit;font:inherit;cursor:pointer;border-radius:6px}
.qc-sug button:hover{background:rgba(28,143,155,.12)}.qc-sug small{display:block;opacity:.65;font-size:11px}</style>`);
if(typeof I18N==='object'&&I18N.en&&I18N.en.x)Object.assign(I18N.en.x,{'ตรวจใบก่อนส่ง':'Check before sending','ตรวจใบก่อนส่ง ✓':'Check before sending ✓','ใช้ชื่อนี้':'Use this name','แก้คำนี้':'Fix this word',
  'รวมเป็นแถวเดียว':'Merge into one line','ยังไม่มีชื่อรายการ':'No item name yet','จำนวนเป็น 0':'Quantity is 0','ยังไม่มีราคา':'No price yet','ยังไม่ได้ใส่หน่วย':'No unit yet',
  'รายการนี้ซ้ำกับด้านบนในหมวดเดียวกัน':'Same line as one above in this section','ไม่พบชื่อที่ตรง หมายถึง…':'No exact name. Did you mean…','ดูทั้งหมด':'See all','ไปแก้':'Fix','ไปที่รายการ':'Go to line',
  'หัวใบเสนอราคา':'Quotation header','ยังไม่ได้เลือกลูกค้า':'No customer chosen','ยังไม่มีชื่องาน':'No job name','ยังไม่มีเลขที่ใบเสนอราคา':'No quotation number','ยังไม่ได้ใส่วันที่':'No date',
  'ยังไม่ได้ใส่ชื่อผู้ลงนาม':'No signer name','ยังไม่มีรายการ':'No lines yet','ยังไม่ได้ตั้ง % บวกกำไร ราคาขายจึงเท่ากับทุน':'No markup set, so the selling price equals cost',
  'เลือกแยกค่าเครื่องไว้ แต่ยังไม่มีรายการไหนติ๊ก “เครื่อง”':'Equipment is split out, but no line is ticked as equipment','✓ ไม่พบจุดผิดปกติ พร้อมส่งให้ลูกค้า':'✓ Nothing odd found, ready to send'});
