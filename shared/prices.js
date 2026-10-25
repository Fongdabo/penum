/* PENUM คลังราคากลาง (price library): one list of unit prices for a customer company, used and edited from PENUM PM, MEP and BIM.
   tools/build-pages.mjs puts this file in the <head> of every app whose app.json has "prices": true (PM, MEP, BIM; see docs/apps.md).
   - On this device the list is localStorage 'penum.prices' = {fmt:2, c:{[company]: {co, items, del, at}}}, one entry per customer
     company (the licence's customer id, '' without a code). items = [{id, g (BOQ group), name, br (brand / model), unit, m (material
     per unit), l (labour per unit), src, sk (kind of source), date (of the price), key ('mep:split' a PENUM MEP rate, 'bim:…' a PENUM BIM
     row), u (when the line last changed, ms), by (who · which program), h (earlier prices, newest first, up to 8)}], excluding VAT.
     del = {id: when it was deleted}. Every program on the device reads and writes the same entry, so an edit shows everywhere at once.
   - Across computers the list is one row of the company list in ORIEN's Supabase (tools/team-setup.sql, the same company key and
     encryption as shared/team.js; a row under 'mep' marked k:'prices', which the project list leaves out). A few seconds after a
     change, on start, when the window comes back and every 3 minutes the device merges its list with the company's and sends the
     result: per line the newest edit wins (u), a deletion wins over older edits, and the price it replaced goes into the history.
   window.penumPrices: attach(cfg) · items() · put(rows, opt) · set(id, field, value) · remove(id) · on(fn) · sync() · gov() load the starter reference prices (shared/gov-prices.js) · open() the
   library window · render(el) · find(row) · state() · rowSync(name, o) another company list kept the same way. cfg: app 'pm'|'mep'|'bim' · code() the licence code or '' · cid() the customer
   id · co() company name · who() the user's name · off() true while nothing may be written (a sample, read-only) · seed() rows to
   start an empty list from. PM keeps its own fuller page (pm/src/960–985); MEP and BIM open this window from their menus. */
(()=>{if(window.penumPrices)return;
const K='penum.prices',SB={url:'https://uejnlxwjqsadbnzdncvb.supabase.co',key:'sb_publishable_0GTUfFnwBuWxjMw7yYULtQ_mhVVhcez'};
const SOON=6e3,EVERY=180e3,HMAX=8,DEL_KEEP=180*864e5,PAGE=200;
const EN=()=>!/^th/i.test(document.documentElement.lang||'th');
const T={
  title:['คลังราคากลาง','Price library'],sub:['ราคาเดียวที่ PENUM PM, MEP และ BIM ของบริษัทใช้ร่วมกัน · ไม่รวม VAT','One price list for your company\'s PENUM PM, MEP and BIM · excluding VAT'],
  close:['ปิด','Close'],n:['รายการในคลัง','Items'],demo:['ยังเป็นราคาสมมติ / ประมาณการ','Assumed / estimated prices'],old:['ราคาเก่ากว่า 6 เดือน','Over 6 months old'],last:['แก้ล่าสุด','Last change'],
  q:['ค้นหารายการ ยี่ห้อ หรือที่มา','Search item, brand or source'],allG:['ทุกหมวด','All groups'],add:['+ เพิ่มรายการ','+ Add item'],paste:['วางจาก Excel','Paste from Excel'],
  fOpen:['เปิดไฟล์คลังราคา','Open library file'],fSave:['บันทึกไฟล์คลังราคา','Save library file'],seed:['เริ่มจากราคาตัวอย่าง','Start from sample prices'],
  cName:['รายการ','Item'],cBr:['ยี่ห้อ / รุ่น','Brand / model'],cUnit:['หน่วย','Unit'],cM:['ค่าวัสดุ/หน่วย','Material/unit'],cL:['ค่าแรง/หน่วย','Labour/unit'],cT:['รวม/หน่วย','Total/unit'],
  cG:['หมวด','Group'],cSrc:['ที่มา','Source'],cD:['วันที่ราคา','Price date'],his:['ประวัติ','History'],del:['ลบ','Delete'],
  empty:['คลังยังว่าง เพิ่มรายการ วางตารางจาก Excel หรือเปิดไฟล์คลังราคา ราคาที่ใส่ที่นี่ PENUM PM, MEP และ BIM ของบริษัทเห็นเหมือนกัน','The library is empty. Add items, paste a table from Excel or open a library file. PENUM PM, MEP and BIM of your company all see what you put here.'],
  none:['ไม่มีรายการที่ตรงกับการค้นหา','Nothing matches the search'],more:['แสดงเพิ่ม','Show more'],shown:['แสดง {0} จาก {1} รายการ','Showing {0} of {1}'],cnt:['{0} รายการ','{0} items'],
  hint:['แก้ราคาในตารางได้เลย ราคาเดิมเก็บไว้ในประวัติ · แก้จากโปรแกรมไหนก็ได้ ราคาที่แก้ล่าสุดเป็นราคาที่ใช้ · เครื่องที่ใช้รหัสเปิดใช้งานเดียวกันได้ราคาชุดเดียวกันเอง','Edit prices right in the table; the old price goes to the history · Edit from any program: the latest edit is the one used · Computers with the same activation code get the same prices by themselves'],
  sOk:['เชื่อมกับทุกเครื่องของบริษัทแล้ว · อัปเดต {0}','Shared with every computer of your company · updated {0}'],sRun:['กำลังอัปเดตกับเครื่องอื่นของบริษัท…','Updating with your company\'s other computers…'],
  sNolic:['ใช้ในเครื่องนี้และโปรแกรม PENUM อื่นในเครื่องนี้ (ส่งให้เครื่องอื่นได้เมื่อมีรหัสเปิดใช้งานของบริษัท)','Shared with the other PENUM programs on this computer (other computers get it once your company\'s activation code is in use)'],
  sOff:['ต่ออินเทอร์เน็ตไม่ได้ ใช้คลังในเครื่องนี้ไปก่อน จะอัปเดตเองเมื่อต่อได้','No internet: using this computer\'s library for now; it updates by itself when connected'],
  sNosql:['ORIEN ยังไม่ได้เปิดระบบรายการของบริษัท (tools/team-setup.sql) ตอนนี้ใช้ร่วมกันได้เฉพาะในเครื่องนี้','ORIEN has not switched the company list on yet (tools/team-setup.sql): shared on this computer only'],
  sBad:['อัปเดตกับเครื่องอื่นไม่สำเร็จ จะลองใหม่เอง','Could not update with other computers; it will try again'],sNow:['อัปเดตตอนนี้','Update now'],
  just:['เมื่อสักครู่','just now'],min:['{0} นาทีที่แล้ว','{0} min ago'],
  pT:['วางตารางราคาจาก Excel','Paste a price table from Excel'],pP:['คัดลอกตารางที่มีคอลัมน์ รายการ · หน่วย · ค่าวัสดุ · ค่าแรง (ใส่คอลัมน์ ยี่ห้อ ได้ถ้ามีหัวตาราง) แล้ววางในช่องนี้ รายการที่ชื่อ หน่วย และยี่ห้อตรงกับในคลังจะอัปเดตราคา ที่เหลือเพิ่มเป็นรายการใหม่','Copy a table with Item · Unit · Material · Labour columns (a Brand column works with a header row) and paste it here. Items whose name, unit and brand match the library get the new price; the rest are added.'],
  pSrc:['ชื่อแหล่งราคา','Source name'],pSrcP:['เช่น ใบเสนอราคา ร้าน ก. ต.ค. 2569','e.g. supplier quote Oct 2026'],pDate:['วันที่ราคา','Price date'],pVat:['ราคารวม VAT แล้ว (หักออก 7%)','Prices include VAT (take 7% off)'],
  pGo:['นำเข้า','Import'],cancel:['ยกเลิก','Cancel'],pNone:['ไม่พบรายการที่มีราคา ตรวจว่าคัดลอกมาทั้งตาราง','No priced rows found: copy the whole table'],
  done:['เพิ่ม {0} · อัปเดตราคา {1} รายการ','{0} added · {1} updated'],hT:['ประวัติราคา','Price history'],hNone:['ยังไม่มีราคาเดิม','No earlier price yet'],
  dT:['ลบ “{0}” ออกจากคลัง?','Delete “{0}” from the library?'],dP:['รายการนี้จะหายจากคลังของทุกโปรแกรมและทุกเครื่องของบริษัท','It goes from the library in every program and on every computer of your company.'],
  fBad:['เปิดไฟล์ไม่ได้: ไม่ใช่ไฟล์คลังราคาของ PENUM','Could not open: not a PENUM price library file'],
  hand:['แก้เอง','Typed'],newItem:['รายการใหม่','New item'],by:['แก้โดย {0}','Edited by {0}'],ro:['ดูได้อย่างเดียว','Read only'],
  sk_demo:['ราคาสมมติ','Assumed'],sk_moc:['พาณิชย์','Commerce Ministry'],sk_po:['ซื้อจริง','Purchase'],sk_mep:['PENUM MEP','PENUM MEP'],sk_bim:['PENUM BIM','PENUM BIM'],sk_xls:['Excel','Excel'],
  sk_file:['ไฟล์','File'],sk_hand:['แก้เอง','Typed'],sk_sup:['ใบเสนอราคาผู้ขาย','Supplier quote'],sk_dealer:['ผู้แทนจำหน่าย','Dealer'],sk_bb:['สำนักงบประมาณ','Budget Bureau'],
  sk_cgd:['กรมบัญชีกลาง','Comptroller General'],sk_est:['ประมาณการ','Estimate'],sk_offl:['ค่าแรง ว 480 · วัสดุประมาณการ','CGD labour · est. material'],
  sk_gov:['ราคาทางการ สนค. + ว 480','Official: TPSO + CGD ว 480'],sk_offm:['ค่าวัสดุ สนค. · ค่าแรงประมาณการ','TPSO material · est. labour'],sk_bbc:['สำนักงบฯ (คำนวณต่อ TR/kVA)','Budget Bureau (per TR/kVA)'],
  gov:['ราคากลางชุดเริ่มต้น','Starter reference prices'],govDone:['ราคากลางชุดเริ่มต้น: เพิ่ม {0} · อัปเดต {1} · ราคาที่มีอยู่แล้วไม่ทับ {2} รายการ','Starter prices: {0} added · {1} updated · {2} prices you already had kept'],
  govTip:['ราคางานระบบ: ค่าวัสดุ 51 รายการจาก สนค. ส่วนกลาง ก.ย. 2569 ค่าแรง 120 รายการจากกรมบัญชีกลาง ว 480 (26 มิ.ย. 2569) แอร์ เครื่องกำเนิดไฟฟ้า และโซลาร์เซลล์ 51 รายการจากบัญชีราคามาตรฐานครุภัณฑ์ สำนักงบประมาณ ค่าวัสดุรายการอื่นยังเป็นประมาณการ ไม่ทับราคาที่มีอยู่แล้ว','MEP prices: material on 51 lines from TPSO Bangkok Sep 2026, labour on 120 lines from CGD ว 480 (26 Jun 2026); 51 air conditioners, generators and solar systems from the Budget Bureau standard prices; other material prices are estimates; never replaces a price you already have'],sk_egp:['e-GP','e-GP'],sk_shop:['ร้านออนไลน์','Online shop'],sk_td:['งานประมูล','Bid'],sk_qt:['ใบเสนอราคาของเรา','Our quotation']};
const t=(k,...a)=>(T[k]?T[k][EN()?1:0]:k).replace(/\{(\d)\}/g,(m,i)=>a[i]);
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const G={eq:['งานเครื่องปรับอากาศ','Air conditioning'],pipe:['งานท่อน้ำยาและท่อน้ำทิ้ง','Refrigerant & drain pipes'],duct:['งานท่อลมและอุปกรณ์','Ductwork'],chw:['งานระบบน้ำเย็น','Chilled water'],
  el:['งานไฟฟ้าระบบปรับอากาศ','A/C electrical'],smk:['งานระบบควบคุมควันไฟ','Smoke control'],fp:['งานระบบดับเพลิง','Fire protection'],elb:['งานระบบไฟฟ้าอาคาร','Building electrical'],
  fa:['งานระบบแจ้งเหตุเพลิงไหม้','Fire alarm'],com:['งานระบบสื่อสาร','Communication'],cctv:['งานระบบกล้องวงจรปิด (CCTV)','CCTV'],acc:['งานระบบควบคุมการเข้า-ออก','Access control'],pa:['งานระบบเสียงประกาศ','Public address'],bms:['งานระบบควบคุมอาคารอัตโนมัติ (BMS)','BMS'],lp:['งานระบบป้องกันฟ้าผ่าและสายดิน','Lightning protection & earthing'],genr:['งานเครื่องกำเนิดไฟฟ้าและ UPS','Generator & UPS'],sol:['งานระบบโซลาร์เซลล์','Solar PV'],wwt:['งานระบบบำบัดน้ำเสีย','Wastewater treatment'],mg:['งานระบบก๊าซทางการแพทย์','Medical gas'],plb:['งานระบบสุขาภิบาล','Plumbing'],civ:['งานโยธาที่เกี่ยวข้อง','Civil & building'],oth:['งานทดสอบและอื่นๆ','Testing & others'],mat:['วัสดุก่อสร้างทั่วไป','General materials']};
const gName=g=>(G[g]||G.oth)[EN()?1:0];
const SKC={demo:'warn',est:'warn',offl:'info',offm:'info',gov:'ok',bbc:'info',moc:'info',po:'ok',sup:'ok',dealer:'ok',bb:'info',cgd:'info',egp:'info'};

// --- crypto and the company key: the same as shared/team.js (MEP and BIM load both; PM loads only this file) ---
const te=new TextEncoder(),td=new TextDecoder();
const sha=async s=>new Uint8Array(await crypto.subtle.digest('SHA-256',te.encode(s)));
const hex=u=>[...u].map(b=>b.toString(16).padStart(2,'0')).join('');
const b64u=u=>{let s='';for(let i=0;i<u.length;i+=0x8000)s+=String.fromCharCode.apply(null,u.subarray(i,i+0x8000));return btoa(s).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'')};
const ub64=s=>Uint8Array.from(atob(s.replace(/-/g,'+').replace(/_/g,'/')),c=>c.charCodeAt(0));
async function gzip(u){return new Uint8Array(await new Response(new Blob([u]).stream().pipeThrough(new CompressionStream('gzip'))).arrayBuffer())}
async function unzip(u){return new Uint8Array(await new Response(new Blob([u]).stream().pipeThrough(new DecompressionStream('gzip'))).arrayBuffer())}
const aes=async raw=>crypto.subtle.importKey('raw',raw,'AES-GCM',false,['encrypt','decrypt']);
async function enc(key,x,z){const raw=te.encode(typeof x==='string'?x:JSON.stringify(x));let body=raw,f=0;if(z&&window.CompressionStream){body=await gzip(raw);f=1}
  const pt=new Uint8Array(body.length+1);pt[0]=f;pt.set(body,1);const iv=crypto.getRandomValues(new Uint8Array(12));
  return b64u(iv)+'.'+b64u(new Uint8Array(await crypto.subtle.encrypt({name:'AES-GCM',iv},key,pt)))}
async function dec(key,s){const [a,b]=String(s||'').split('.');const pt=new Uint8Array(await crypto.subtle.decrypt({name:'AES-GCM',iv:ub64(a)},key,ub64(b))),body=pt.subarray(1);
  return JSON.parse(td.decode(pt[0]===1?await unzip(body):body))}
async function rpc(fn,body){let r;try{r=await fetch(SB.url+'/rest/v1/rpc/'+fn,{method:'POST',cache:'no-store',headers:{apikey:SB.key,'Content-Type':'application/json'},body:JSON.stringify(body)})}catch(e){return {err:'offline'}}
  if(r.ok){try{const x=await r.text();return {j:x?JSON.parse(x):null}}catch(e){return {err:'bad'}}}
  let s='';try{s=await r.text()}catch(e){}if(r.status===404||/PGRST202|does not exist|Could not find the function/i.test(s))return {err:'nosql'};
  return {err:r.status>=500?'offline':'bad'}}
// this device's random id and the company keys it knows live in shared/team.js's 'penum.team'
function tm(){try{const o=JSON.parse(localStorage.getItem('penum.team')||'{}');return o&&typeof o==='object'?o:{}}catch(e){return {}}}
function tmSv(o){try{localStorage.setItem('penum.team',JSON.stringify(o))}catch(e){}}
function dev(){const o=tm();if(!/^[0-9a-f]{24}$/.test(o.dev||'')){o.dev=hex(crypto.getRandomValues(new Uint8Array(12)));tmSv(o)}return o.dev}
let TM=null,TMC='';
async function team(code,cust){if(TM&&TMC===code)return TM;
  try{const k=hex((await sha('penum-team-c:'+code)).slice(0,16)),ck=await aes(await sha('penum-team-ck:'+code));
    let r=await rpc('penum_team_key_get',{p_k:k});if(r.err)return r;let sec='';
    const open=async s=>{try{const [a,b]=String(s||'').split('.');const pt=new Uint8Array(await crypto.subtle.decrypt({name:'AES-GCM',iv:ub64(a)},ck,ub64(b)));const body=pt.subarray(1);return td.decode(pt[0]===1?await unzip(body):body)}catch(e){return ''}};
    if(r.j)sec=await open(r.j);
    if(!sec){const known=(tm().co||{})[cust]||'';
      r=await rpc('penum_team_key_add',{p_k:k,p_e:await enc(ck,known||hex(crypto.getRandomValues(new Uint8Array(16))))});if(r.err)return r;sec=await open(r.j);if(!sec)return {err:'bad'}}
    const o=tm();o.co=o.co||{};o.co[cust]=sec;tmSv(o);
    TM={t:hex((await sha('penum-team:'+sec)).slice(0,16)),key:await aes(await sha('penum-team-key:'+sec))};TMC=code;return TM}
  catch(e){return {err:'bad'}}}
const rowP=async()=>hex((await sha('penum-team-p:prices:lib')).slice(0,16));

// --- the list on this device ---
const num=v=>{if(typeof v==='number')return isFinite(v)?v:0;const x=parseFloat(String(v??'').replace(/[,\s฿]|บาท/g,''));return isFinite(x)?x:0};
const r2=v=>Math.round(num(v)*100)/100;
const day=d=>{d=d||new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')};
const nid=()=>'k'+Math.random().toString(36).slice(2,9)+Date.now().toString(36).slice(-3);
const SYN=[[/ยูพีวีซี/g,'upvc'],[/พีวีซี/g,'pvc'],[/พีพีอาร์/g,'ppr'],[/เอชดีพีอี/g,'hdpe'],[/สแตนเลส|สเตนเลส/g,'stainless'],[/ตร\.?\s*ม\.?|ตารางเมตร/g,'m²'],[/เมตร|ม\./g,'m'],[/ตัน/g,'tr']];
const nk=s=>SYN.reduce((x,[re,to])=>x.replace(re,to),String(s||'').normalize('NFC').toLowerCase()).replace(/(\d)\.(?=\d)/g,'$1d').replace(/[\s.,·\-–()\/:'"]+/g,'');// a decimal point stays (THW 2.5 is not THW 25)
const ident=r=>nk(r.name)+'|'+nk(r.unit)+'|'+nk(r.br);
const F=['g','name','br','unit','m','l','src','sk','date','key'];
// read once per change: the programs ask for prices for every row they draw
let RS=null,RC=null,IX=null;
function rd(){let raw='null';try{raw=localStorage.getItem(K)||'null'}catch(e){}if(raw===RS&&RC)return RC;let o=null;try{o=JSON.parse(raw)}catch(e){}if(!o||typeof o!=='object')o={};RS=raw;IX=null;
  if(o.fmt!==2){const c={};if(Array.isArray(o.items))c['']={co:o.co||'',items:o.items.map(x=>Object.assign({},x,{u:x.u||o.at||1,by:x.by||'PENUM PM'})),del:{},at:o.at||0};o={fmt:2,c}}
  if(!o.c||typeof o.c!=='object')o.c={};return RC=o}
function wr(o){const raw=JSON.stringify(o);RC=o;RS=raw;IX=null;try{localStorage.setItem(K,raw);return true}catch(e){return false}}
let CFG=null;
const cid=()=>{try{return CFG&&CFG.cid?String(CFG.cid()||''):''}catch(e){return ''}};
const off=()=>{try{return !CFG||!!(CFG.off&&CFG.off())}catch(e){return true}};
const who=()=>{let n='';try{n=CFG&&CFG.who?String(CFG.who()||''):''}catch(e){}return (n?n+' · ':'')+APPN()};
const APPN=()=>({pm:'PENUM PM',mep:'PENUM MEP',bim:'PENUM BIM'})[CFG&&CFG.app]||'PENUM';
// the company's entry; a list PENUM PM shared before it knew the company (or without a code) becomes the company's
function lib(o){const id=cid();let L=o.c[id];if(!L&&id&&o.c['']){L=o.c[id]=o.c[''];delete o.c['']}
  if(!L)L=o.c[id]={co:'',items:[],del:{},at:0};if(!Array.isArray(L.items))L.items=[];if(!L.del||typeof L.del!=='object')L.del={};
  try{const c=CFG&&CFG.co&&CFG.co();if(c)L.co=String(c)}catch(e){}return L}
const items=()=>lib(rd()).items.slice();
function clean(r){const x={};F.forEach(f=>{if(r[f]==null)return;x[f]=f==='m'||f==='l'?r2(r[f]):String(r[f]).trim()});if(r.id)x.id=String(r.id);return x}
function hpush(x,by,u){x.h=[{m:num(x.m),l:num(x.l),src:x.src||'',date:x.date||'',by:x.by||'',u:x.u||0},...(x.h||[])].slice(0,HMAX)}
// put rows in: the same line is the same id, else the same key, else the same name, unit and brand. opt: {src, sk, date, g, by, noAdd,
// keepNewer (an older-dated price leaves a line as it is), exact (the same id only: PENUM PM sending its own lines)}
function upsert(L,r0,opt,u,ix){const r=clean(r0);opt=opt||{};let x=r.id&&L.items.find(i=>i.id===r.id);
  if(!x&&opt.exact&&r.id&&L.del[r.id]>=(r0.u||0))return 'skip';
  if(!x&&!opt.exact&&r.key)x=L.items.find(i=>i.key===r.key);if(!x&&!opt.exact&&r.name)x=(ix||new Map()).get(ident(r))||L.items.find(i=>ident(i)===ident(r));
  if(!x){if(opt.noAdd||!r.name||!(num(r.m)>0||num(r.l)>0))return 'skip';
    const it=Object.assign({id:r.id||nid(),g:opt.g||'oth',br:'',unit:'',m:0,l:0,src:opt.src||'',sk:opt.sk||'hand',date:opt.date||day()},r,{u,by:opt.by||who()});
    if(!G[it.g])it.g='oth';if(!it.key)delete it.key;L.items.push(it);delete L.del[it.id];if(ix)ix.set(ident(it),it);return 'add'}
  if(opt.keepNewer&&!SOFT(x)&&r.date&&x.date&&r.date<x.date)return 'same';
  const nx=Object.assign({},x,r,{id:x.id});if(!r.src&&opt.src)nx.src=opt.src;if(!r.sk&&opt.sk)nx.sk=opt.sk;if(!r.date&&opt.date)nx.date=opt.date;
  if(F.every(f=>String(nx[f]??'')===String(x[f]??'')))return 'same';
  if(num(nx.m)!==num(x.m)||num(nx.l)!==num(x.l))hpush(x);
  Object.assign(x,nx,{u,by:opt.by||who()});return 'upd'}
// sample and starter-set lines are only placeholders: any other price replaces them (a 'gov' line is official on both halves, so it is not)
const SOFT=x=>x.sk==='demo'||x.sk==='est'||x.sk==='offl'||x.sk==='offm';
// ราคากลางชุดเริ่มต้น (shared/gov-prices.js): fills new, sample and starter lines; a line with a price of the company's own stays as it is
function govRows(){const S=window.PENUM_GOV_PRICES;if(!S||!Array.isArray(S.rows))return [];const L=EN()?1:0;
  // r an item of ว 480: the labour is the official rate (sk 'offl'), the material still an estimate; r 'bb:<list>:<item>' a Budget Bureau price (sk 'bb');
  // mo [code, note]: the material is the สนค. price (sk 'gov' with ว 480 labour, 'offm' with estimated labour)
  return S.rows.map(([k,g,name,unit,m,l,r,mo])=>{const w=/^\d/.test(r)&&S.ref.w,b=/^bb:/.test(r)&&S.bb&&S.bb[r.split(':')[1]],c=mo&&S.moc;
    if(b)return {key:'gov:'+k,g,name,unit,m,l,date:b.date,sk:'bb',src:b.name[L].replace('{0}',r.split(':')[2])};
    const bc=/^bbc:/.test(r)&&S.bbc&&S.bbc[r.slice(4)];if(bc)return {key:'gov:'+k,g,name,unit,m,l,date:S.bbc.date,sk:'bbc',src:bc[L]};
    if(c)return {key:'gov:'+k,g,name,unit,m,l,date:c.date,sk:w?'gov':'offm',src:c.name[L].replace('{0}',mo[0]).replace('{1}',mo[1])+' · '+(w?c.wl[L].replace('{0}',r):c.el[L])};
    return {key:'gov:'+k,g,name,unit,m,l,date:S.date,sk:w?'offl':'est',src:S.name[L]+' · '+(w?w[L].replace('{0}',r).replace('{1}',S.ref[g==='eq'?'wb':'wm'][L]):(S.ref[r]||S.ref.m)[L])}})}
function gov(){const R=govRows();if(!R.length||off())return null;const go=[],kept=[];R.forEach(r=>{const x=find(r);(!x||SOFT(x)||x.sk===r.sk&&x.src===r.src?go:kept).push(r)});
  const r=put(go,{sk:'est'});r.kept=kept.length;return r}
function put(rows,opt){if(off())return {add:0,upd:0,same:0,skip:0};const o=rd(),L=lib(o),u=Date.now(),ix=new Map(L.items.map(i=>[ident(i),i])),R={add:0,upd:0,same:0,skip:0};
  (rows||[]).forEach(r=>{R[upsert(L,r,opt,u,ix)]++});if(R.add||R.upd){L.at=u;wr(o);changed('here')}R.u=u;return R}
function set(id,f,v){if(off()||!F.includes(f))return;const o=rd(),L=lib(o),x=L.items.find(i=>i.id===id);if(!x)return;const nv=f==='m'||f==='l'?r2(v):String(v??'').trim();
  if(String(x[f]??'')===String(nv))return;if(f==='m'||f==='l'){hpush(x);x.src=t('hand');x.sk='hand';x.date=day()}x[f]=nv;x.u=Date.now();x.by=who();L.at=x.u;wr(o);changed('here')}
function remove(id){if(off())return;const o=rd(),L=lib(o);const n0=L.items.length;L.items=L.items.filter(i=>i.id!==id);if(L.items.length===n0)return;L.del[id]=Date.now();L.at=L.del[id];wr(o);changed('here')}
function find(r){const o=rd(),id=cid();if(!IX||IX.o!==o||IX.id!==id){const k=new Map(),d=new Map(),nm=new Map();lib(o).items.forEach(i=>{if(i.key&&!k.has(i.key))k.set(i.key,i);const a=ident(i);if(!d.has(a))d.set(a,i);
    const b=nk(i.name);(nm.get(b)||nm.set(b,[]).get(b)).push(i)});IX={o,id,k,d,nm}}
  return (r.key&&IX.k.get(r.key))||IX.d.get(ident(r))||(!nk(r.br)&&(IX.nm.get(nk(r.name))||[]).find(i=>!nk(r.unit)||nk(i.unit)===nk(r.unit)))||null}
// two lists made one: per line the newest edit wins; a deletion wins over edits made before it
// the line edited last wins; the price it beat stays in the line's history (edited on two computers before they met)
const lose=(w,o)=>{if(num(w.m)===num(o.m)&&num(w.l)===num(o.l)||(w.h||[]).some(h=>(h.u||0)===(o.u||0)&&num(h.m)===num(o.m)&&num(h.l)===num(o.l)))return w;
  return Object.assign({},w,{h:[...(w.h||[]),{m:num(o.m),l:num(o.l),src:o.src||'',date:o.date||'',by:o.by||'',u:o.u||0}].sort((a,b)=>(b.u||0)-(a.u||0)).slice(0,HMAX)})};
function merge(A,B){const M=new Map();(A.items||[]).forEach(x=>M.set(x.id,x));(B.items||[]).forEach(y=>{const x=M.get(y.id);M.set(y.id,!x?y:(y.u||0)>(x.u||0)?lose(y,x):lose(x,y))});
  const del=Object.assign({},A.del||{}),lim=Date.now()-DEL_KEEP;Object.entries(B.del||{}).forEach(([id,u])=>{if(!(del[id]>=u))del[id]=u});
  Object.entries(del).forEach(([id,u])=>{if(u<lim){delete del[id];return}const x=M.get(id);if(x&&(x.u||0)<=u)M.delete(id)});
  return {items:[...M.values()].sort((a,b)=>String(a.id).localeCompare(String(b.id))),del}}
const sig=L=>JSON.stringify([(L.items||[]).map(x=>x.id+':'+(x.u||0)).sort(),Object.keys(L.del||{}).sort()]);

// --- what changed: this program's screens, the window, the company copy ---
const FN=new Set();function on(fn){FN.add(fn);return ()=>FN.delete(fn)}
function changed(why){FN.forEach(fn=>{try{fn(why)}catch(e){}});paintAll();if(why==='here')soon()}
addEventListener('storage',e=>{if(e.key===K)changed('device')});

// --- with the company's other computers ---
const ST={st:'',at:'',busy:0,pend:0,t:0};
let soonT=0;function soon(ms){clearTimeout(soonT);soonT=setTimeout(sync,ms==null?SOON:ms)}
const stChg=()=>{paintAll();FN.forEach(fn=>{try{fn('state')}catch(e){}})};          // the programs show whether the list is shared
async function sync(){if(!CFG||off())return;if(ST.busy){ST.pend=1;return}ST.busy=1;const was=ST.st;ST.st='run';stChg();
  try{await sync0()}catch(e){ST.st='bad'}finally{ST.busy=0;ST.t=Date.now();if(ST.st==='run')ST.st=was||'ok';stChg();if(ST.pend){ST.pend=0;soon()}}}
async function sync0(){let code='';try{code=String(CFG.code&&CFG.code()||'')}catch(e){}if(!code){ST.st='nolic';return}
  const T=await team(code,cid());if(T.err){ST.st=T.err;return}const p=await rowP();
  for(let i=0;i<4;i++){const g=await rpc('penum_team_get',{p_t:T.t,p_p:p});if(g.err){ST.st=g.err;return}
    let R={items:[],del:{}};const at=g.j&&g.j.at||null;if(g.j){try{R=await dec(T.key,g.j.d)}catch(e){ST.st='bad';return}}
    const o=rd(),L=lib(o),M=merge(L,R);
    if(sig(M)!==sig(L)){L.items=M.items;L.del=M.del;L.at=Date.now();wr(o);changed('cloud')}
    if(g.j&&sig(M)===sig(R)){ST.st='ok';ST.at=at;return}
    if(!g.j&&!M.items.length&&!Object.keys(M.del).length){ST.st='ok';ST.at='';return}          // the company has no library yet
    const w=await rpc('penum_team_put',{p_t:T.t,p_p:p,p_a:'mep',p_m:await enc(T.key,{k:'prices',name:'',by:who(),n:M.items.length,at:Date.now()}),
      p_d:await enc(T.key,{items:M.items,del:M.del},1),p_base:at,p_dev:dev()});
    if(w.err){ST.st=w.err==='big'||w.err==='full'?'bad':w.err;return}const j=w.j||{};
    if(j.at){await rpc('penum_team_unlock',{p_t:T.t,p_p:p,p_dev:dev()});ST.st='ok';ST.at=j.at;return}          // nobody holds the price list open
    if(j.lock){ST.st='ok';soon(20e3);return}if(j.off){ST.st='ok';return}}}          // stale: someone sent theirs first, so merge again
// --- another list of the company kept the same way (PENUM BIM's family library, V1.169): rowSync(name, o) merges this device's list with the
// company's row 'name' (as above: per line the newest u wins, a deletion wins over older edits) and sends the result. o: get() this device's
// {items, del} · set(M) keep the merged one · app 'mep'|'bim' · k the row's kind (a row with a kind is left out of the project lists). → 'ok' or a state
async function rowSync(name,o){if(!CFG||off())return 'nolic';let code='';try{code=String(CFG.code&&CFG.code()||'')}catch(e){}if(!code)return 'nolic';
  const T=await team(code,cid());if(T.err)return T.err;const p=hex((await sha('penum-team-p:'+name)).slice(0,16));
  for(let i=0;i<4;i++){const g=await rpc('penum_team_get',{p_t:T.t,p_p:p});if(g.err)return g.err;
    let R={items:[],del:{}};const at=g.j&&g.j.at||null;if(g.j){try{R=await dec(T.key,g.j.d)}catch(e){return 'bad'}}
    const L=o.get(),M=merge(L,R);if(sig(M)!==sig(L))o.set(M);
    if(g.j&&sig(M)===sig(R))return 'ok';if(!g.j&&!M.items.length&&!Object.keys(M.del).length)return 'ok';
    const w=await rpc('penum_team_put',{p_t:T.t,p_p:p,p_a:o.app||'mep',p_m:await enc(T.key,{k:o.k||'list',name:'',by:who(),n:M.items.length,at:Date.now()}),
      p_d:await enc(T.key,{items:M.items,del:M.del},1),p_base:at,p_dev:dev()});
    if(w.err)return w.err==='full'?'big':w.err;const j=w.j||{};
    if(j.at){await rpc('penum_team_unlock',{p_t:T.t,p_p:p,p_dev:dev()});return 'ok'}if(j.lock)return 'lock';if(j.off)return 'ok'}
  return 'bad'}
addEventListener('focus',()=>{if(CFG&&Date.now()-ST.t>30e3)soon(500)});
setInterval(()=>{if(CFG&&document.visibilityState==='visible')sync()},EVERY);

// --- the library window (MEP and BIM; PM has its own page) ---
const VIEWS=new Set();
function paintAll(){VIEWS.forEach(el=>{if(!el.isConnected){VIEWS.delete(el);return}paint(el)})}
function when(s){const d=new Date(s);if(!s||isNaN(d))return '–';const ms=Date.now()-d;if(ms<90e3)return t('just');if(ms<3600e3)return t('min',Math.round(ms/6e4));
  return d.toLocaleString(EN()?'en-GB':'th-TH',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})}
const thD=s=>{const d=new Date(s);return !s||isNaN(d)?'–':d.toLocaleDateString(EN()?'en-GB':'th-TH',{day:'numeric',month:'short',year:'2-digit'})};
const fmt=v=>num(v).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});
const isOld=x=>!x.date||(Date.now()-new Date(x.date))/864e5>180;
function stLine(){const s=ST.st;if(s==='run')return t('sRun');if(s==='ok')return ST.at?t('sOk',when(ST.at)):t('sOk',t('just'));if(s==='nolic')return t('sNolic');if(s==='offline')return t('sOff');if(s==='nosql')return t('sNosql');if(s==='bad')return t('sBad');return ''}
function render(el){if(!el)return;VIEWS.add(el);el.classList.add('ppl');if(!el._pplOn){el._pplOn=1;
    el.addEventListener('click',ev=>click(el,ev));el.addEventListener('change',ev=>change(el,ev));
    el.addEventListener('input',ev=>{if(ev.target.dataset.pplq!=null){el._q=ev.target.value;clearTimeout(el._qt);el._qt=setTimeout(()=>{el._n=PAGE;paint(el);const q=el.querySelector('[data-pplq]');if(q){q.focus();q.setSelectionRange(q.value.length,q.value.length)}},250)}})}
  paint(el);if(Date.now()-ST.t>20e3)sync()}
function paint(el){const L=items(),ro=off(),q=String(el._q||'').trim().toLowerCase().split(/\s+/).filter(Boolean),g=el._g||'',N=el._n||PAGE;
  const R=L.filter(x=>(!g||x.g===g)&&q.every(w=>[x.name,x.br,x.unit,x.src,x.by].join(' ').toLowerCase().includes(w)))
    .sort((a,b)=>(a.g||'').localeCompare(b.g||'')||String(a.name).localeCompare(String(b.name),'th'));
  const last=L.reduce((m,x)=>Math.max(m,x.u||0),0),gs=Object.keys(G).filter(k=>L.some(x=>x.g===k));
  const inp=(x,f,w,numb)=>ro?`<span>${esc(numb?fmt(x[f]):x[f]||'')}</span>`:`<input data-ppl="${esc(x.id)}" data-f="${f}" value="${esc(numb?num(x[f]):x[f]||'')}"${numb?' inputmode="decimal" class="r"':''} aria-label="${esc(t({name:'cName',br:'cBr',unit:'cUnit',m:'cM',l:'cL'}[f]))}" style="width:${w}px">`;
  const st=stLine();
  el.innerHTML=`<div class="ppl-st"><span>${esc(st)}</span>${CFG&&ST.st!=='nolic'&&ST.st!=='run'?`<button type="button" class="ppl-b sm" data-ppla="sync">${esc(t('sNow'))}</button>`:''}${ro?`<b>${esc(t('ro'))}</b>`:''}</div>
  <div class="ppl-stats"><div><small>${esc(t('n'))}</small><b>${L.length}</b></div><div><small>${esc(t('demo'))}</small><b class="${L.some(SOFT)?'warn':''}">${L.filter(SOFT).length}</b></div>
    <div><small>${esc(t('old'))}</small><b>${L.filter(isOld).length}</b></div><div><small>${esc(t('last'))}</small><b>${last?esc(when(last)):'–'}</b></div></div>
  <div class="ppl-bar"><input type="search" data-pplq placeholder="${esc(t('q'))}" value="${esc(el._q||'')}" aria-label="${esc(t('q'))}">
    <select data-pplg aria-label="${esc(t('cG'))}"><option value="">${esc(t('allG'))}</option>${gs.map(k=>`<option value="${k}"${k===g?' selected':''}>${esc(gName(k))}</option>`).join('')}</select>
    ${ro?'':`<button type="button" class="ppl-b pri" data-ppla="add">${esc(t('add'))}</button><button type="button" class="ppl-b" data-ppla="paste">${esc(t('paste'))}</button><button type="button" class="ppl-b" data-ppla="open">${esc(t('fOpen'))}</button>`}
    <button type="button" class="ppl-b" data-ppla="save">${esc(t('fSave'))}</button>${!ro&&window.PENUM_GOV_PRICES?`<button type="button" class="ppl-b" data-ppla="gov" title="${esc(t('govTip'))}">${esc(t('gov'))}</button>`:''}${!ro&&!L.length&&CFG&&CFG.seed?`<button type="button" class="ppl-b" data-ppla="seed">${esc(t('seed'))}</button>`:''}</div>
  ${L.length?`<div class="ppl-tw"><table><thead><tr><th>${esc(t('cName'))}</th><th>${esc(t('cBr'))}</th><th>${esc(t('cUnit'))}</th><th class="r">${esc(t('cM'))}</th><th class="r">${esc(t('cL'))}</th><th class="r">${esc(t('cT'))}</th><th>${esc(t('cG'))}</th><th>${esc(t('cSrc'))}</th><th>${esc(t('cD'))}</th><th></th></tr></thead><tbody>
  ${R.slice(0,N).map(x=>`<tr${x.id===el._new?' class="new"':''}><td>${inp(x,'name',230)}</td><td>${inp(x,'br',110)}</td><td>${inp(x,'unit',80)}</td><td class="r">${inp(x,'m',100,1)}</td><td class="r">${inp(x,'l',90,1)}</td>
    <td class="r">${fmt(num(x.m)+num(x.l))}</td><td>${ro?esc(gName(x.g)):`<select data-ppl="${esc(x.id)}" data-f="g" aria-label="${esc(t('cG'))}">${Object.keys(G).map(k=>`<option value="${k}"${k===x.g?' selected':''}>${esc(gName(k))}</option>`).join('')}</select>`}</td>
    <td class="ppl-src"><span class="ppl-pill ${SKC[x.sk]||''}">${esc(T['sk_'+x.sk]?t('sk_'+x.sk):x.sk||t('hand'))}</span>${x.src&&x.src!==t('sk_'+x.sk)?`<br><small>${esc(x.src)}</small>`:''}${x.by?`<br><small>${esc(t('by',x.by))}</small>`:''}</td>
    <td style="white-space:nowrap${isOld(x)?';color:#B42318':''}">${esc(thD(x.date))}</td>
    <td style="white-space:nowrap">${(x.h||[]).length?`<button type="button" class="ppl-b sm ghost" data-ppla="his" data-id="${esc(x.id)}">${esc(t('his'))} ${x.h.length}</button>`:''}${ro?'':`<button type="button" class="ppl-x" data-ppla="del" data-id="${esc(x.id)}" aria-label="${esc(t('del'))}" title="${esc(t('del'))}">✕</button>`}</td></tr>`).join('')||`<tr><td colspan="10" class="ppl-e">${esc(t('none'))}</td></tr>`}
  </tbody></table></div>${R.length>N?`<p class="ppl-h">${esc(t('shown',N,R.length))} <button type="button" class="ppl-b sm" data-ppla="more">${esc(t('more'))}</button></p>`:`<p class="ppl-h">${esc(t('cnt',R.length))}</p>`}`
  :`<p class="ppl-e">${esc(t('empty'))}</p>`}
  <p class="ppl-h">${esc(t('hint'))}</p>`}
function change(el,ev){const x=ev.target;if(x.dataset.pplg!=null){el._g=x.value;el._n=PAGE;paint(el);return}if(x.dataset.ppl){set(x.dataset.ppl,x.dataset.f,x.value)}}
async function click(el,ev){const b=ev.target.closest&&ev.target.closest('[data-ppla]');if(!b)return;const a=b.dataset.ppla,id=b.dataset.id;
  if(a==='sync')sync();
  else if(a==='more'){el._n=(el._n||PAGE)+500;paint(el)}
  else if(a==='add'){const o=rd(),L=lib(o),it={id:nid(),g:el._g||'oth',name:t('newItem'),br:'',unit:'',m:0,l:0,src:t('hand'),sk:'hand',date:day(),u:Date.now(),by:who()};
    L.items.push(it);L.at=it.u;wr(o);el._new=it.id;el._q='';changed('here');const i=el.querySelector(`[data-ppl="${it.id}"][data-f="name"]`);if(i){i.scrollIntoView({block:'center'});i.select()}}
  else if(a==='del'){const x=items().find(i=>i.id===id);if(!x)return;if(await dlg(t('dT',x.name),`<p>${esc(t('dP'))}</p>`,[['go',t('del'),1],['',t('cancel')]])==='go')remove(id)}
  else if(a==='his'){const x=items().find(i=>i.id===id);if(!x)return;
    dlg(t('hT')+' · '+x.name,(x.h||[]).length?`<div class="ppl-tw"><table><thead><tr><th>${esc(t('cD'))}</th><th class="r">${esc(t('cM'))}</th><th class="r">${esc(t('cL'))}</th><th>${esc(t('cSrc'))}</th></tr></thead><tbody>
      <tr class="new"><td>${esc(thD(x.date))}</td><td class="r">${fmt(x.m)}</td><td class="r">${fmt(x.l)}</td><td>${esc(x.src||'')}${x.by?' · '+esc(x.by):''}</td></tr>
      ${x.h.map(h=>`<tr><td>${esc(thD(h.date))}</td><td class="r">${fmt(h.m)}</td><td class="r">${fmt(h.l)}</td><td>${esc(h.src||'')}${h.by?' · '+esc(h.by):''}</td></tr>`).join('')}</tbody></table></div>`:`<p>${esc(t('hNone'))}</p>`,[['',t('close'),1]])}
  else if(a==='paste')pasteBox();
  else if(a==='save')saveFile();
  else if(a==='open')openFile();
  else if(a==='gov'){const R=gov();if(R)toast(t('govDone',R.add,R.upd,R.kept))}
  else if(a==='seed'&&CFG.seed){const R=put(CFG.seed(),{sk:'demo',src:t('sk_demo'),date:day()});toast(t('done',R.add,R.upd))}}
function dlg(title,html,btns){return new Promise(res=>{const d=document.createElement('dialog');d.className='ppl-dlg';
  d.innerHTML=`<h3>${esc(title)}</h3><div class="ppl-db">${html}</div><div class="ppl-df">${btns.map(([k,l,p])=>`<button type="button" class="ppl-b${p?' pri':''}" value="${esc(k)}">${esc(l)}</button>`).join('')}</div>`;
  d.addEventListener('click',e=>{const b=e.target.closest('button[value]');if(b)d.close(b.value)});d.addEventListener('close',()=>{const v={};d.querySelectorAll('[name]').forEach(x=>{v[x.name]=x.type==='checkbox'?x.checked:x.value});dlg.v=v;d.remove();res(d.returnValue||'')});
  document.body.appendChild(d);d.showModal()})}
function toast(s){let e=document.getElementById('pplToast');if(!e){e=document.createElement('div');e.id='pplToast';e.className='ppl-toast';e.setAttribute('role','status');(document.querySelector('dialog.ppl-win[open]')||document.body).appendChild(e)}
  e.textContent=s;e.hidden=false;clearTimeout(e._t);e._t=setTimeout(()=>{e.hidden=true},3500)}
// a table copied from Excel: columns found from the header row, or guessed (the longest text is the item, a short one the unit, numbers the prices)
const H=[['br',/ยี่ห้อ|แบรนด์|brand|รุ่น|model/i],['name',/รายการ|ชื่อ|รายละเอียด|description|item/i],['unit',/หน่วย|unit/i],['l',/แรง|labou?r/i],['m',/วัสดุ|ค่าของ|ราคา|material|price|cost/i]];
const isNum=c=>/^[\s฿]*-?[\d,]+(\.\d+)?\s*(บาท)?$/.test(String(c||''));
function rows(txt){return String(txt||'').replace(/\r/g,'').split('\n').map(l=>l.split('\t').map(c=>c.trim().replace(/^"|"$/g,''))).filter(r=>r.some(c=>c))}
function parse(txt){const R=rows(txt);if(!R.length)return [];let C={},body=R;
  const hi=R.slice(0,5).findIndex(r=>r.filter(c=>c&&!isNum(c)).length>=2&&H.filter(([,re])=>r.some(c=>re.test(c))).length>=2);
  if(hi>=0){R[hi].forEach((c,j)=>{const h=H.find(([k,re])=>C[k]==null&&re.test(c)&&!/จำนวน|qty|รวม|total/i.test(c));if(h)C[h[0]]=j});body=R.slice(hi+1)}
  if(C.name==null){const W=Math.max(...body.map(r=>r.length)),tl=Array(W).fill(0);body.forEach(r=>r.forEach((c,j)=>{if(!isNum(c))tl[j]+=c.length}));C.name=[...tl.keys()].sort((a,b)=>tl[b]-tl[a])[0];
    if(C.unit==null)C.unit=[...tl.keys()].find(j=>j!==C.name&&body.filter(r=>r[j]&&r[j].length<=12&&!isNum(r[j])).length>=body.length*.4)}
  if(C.m==null){const nums=[...Array(Math.max(...body.map(r=>r.length))).keys()].filter(j=>j!==C.name&&j!==C.unit&&body.filter(r=>isNum(r[j])).length>=body.length*.5);C.m=nums[0];if(C.l==null&&nums.length>1)C.l=nums[1]}
  return body.map(r=>({name:r[C.name]||'',br:C.br!=null?r[C.br]||'':'',unit:C.unit!=null?r[C.unit]||'':'',m:C.m!=null?num(r[C.m]):0,l:C.l!=null?num(r[C.l]):0})).filter(r=>r.name&&(r.m>0||r.l>0))}
async function pasteBox(){const k=await dlg(t('pT'),`<p class="ppl-h">${esc(t('pP'))}</p><textarea name="txt" rows="8" style="width:100%"></textarea>
  <div class="ppl-bar"><label>${esc(t('pSrc'))}<input name="src" placeholder="${esc(t('pSrcP'))}"></label><label>${esc(t('pDate'))}<input name="date" type="date" value="${day()}"></label><label class="ppl-chk"><input name="vat" type="checkbox"> ${esc(t('pVat'))}</label></div>`,[['go',t('pGo'),1],['',t('cancel')]]);
  if(k!=='go')return;const v=dlg.v||{},R=parse(v.txt);if(!R.length){toast(t('pNone'));return}const f=v.vat?1/1.07:1,d=v.date||day();
  const r=put(R.map(x=>Object.assign(x,{m:x.m*f,l:x.l*f,date:d})),{src:(v.src||'').trim()||'Excel '+thD(d),sk:'xls',date:d});toast(t('done',r.add,r.upd))}
function saveFile(){const L=items(),c=lib(rd()).co||'';const b=new Blob([JSON.stringify({app:APPN(),kind:'penum.prices',fmt:1,co:c,at:Date.now(),items:L.map(({id,g,name,br,unit,m,l,src,date,key})=>({id,g,name,br,unit,m,l,src,date,key}))})],{type:'application/json'});
  const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download=`PENUM-prices-${day()}.json`;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},1000)}
function openFile(){const f=document.createElement('input');f.type='file';f.accept='.json,application/json';f.onchange=async()=>{const file=f.files[0];if(!file)return;
  try{const J=JSON.parse(await file.text()),L=Array.isArray(J)?J:J&&Array.isArray(J.items)?J.items:null;if(!L)throw 0;
    const r=put(L.map(x=>({g:x.g,name:x.name,br:x.br,unit:x.unit,m:x.m,l:x.l,date:x.date,key:x.key,src:x.src})),{sk:'file',src:file.name,keepNewer:1});toast(t('done',r.add,r.upd))}catch(e){toast(t('fBad'))}};f.click()}
// the window: the whole program window, over the program
function open(){let d=document.getElementById('pplWin');if(!d){d=document.createElement('dialog');d.id='pplWin';d.className='ppl-win';
    d.innerHTML=`<div class="ppl-top"><div><h2>${esc(t('title'))}</h2><small>${esc(t('sub'))}</small></div><button type="button" class="ppl-b" data-pplc>${esc(t('close'))}</button></div><div class="ppl-body"></div>`;
    d.addEventListener('click',e=>{if(e.target.closest('[data-pplc]'))d.close()});document.body.appendChild(d)}
  render(d.querySelector('.ppl-body'));if(!d.open)d.showModal()}
function state(){return {st:ST.st,at:ST.at,n:items().length}}
function attach(cfg){CFG=cfg;setTimeout(()=>{if(!off())sync()},2500)}
const CSS=`.ppl-win{width:min(1500px,calc(100vw - 16px));max-width:none;height:calc(100vh - 16px);max-height:none;padding:0;border:0;border-radius:14px;background:#F6F8F8;color:#1C2B30;box-shadow:0 20px 60px rgba(0,0,0,.35);font:14px/1.45 system-ui,-apple-system,'Segoe UI','Noto Sans Thai',sans-serif}
.ppl-win::backdrop{background:rgba(10,20,25,.45)}.ppl-top{display:flex;align-items:center;gap:12px;justify-content:space-between;padding:14px 18px;background:#123A42;color:#fff;position:sticky;top:0;z-index:2}
.ppl-top h2{margin:0;font-size:18px}.ppl-top small{opacity:.85}.ppl-top .ppl-b{background:rgba(255,255,255,.14);color:#fff;border-color:rgba(255,255,255,.35)}.ppl-body{padding:14px 18px 24px}
.ppl{color:#1C2B30}.ppl-st{display:flex;flex-wrap:wrap;align-items:center;gap:8px;margin:0 0 10px;font-size:13px;color:#46606A}
.ppl-stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px;margin:0 0 12px}.ppl-stats div{background:#fff;border:1px solid #DCE4E6;border-radius:12px;padding:10px 12px}
.ppl-stats small{display:block;color:#5B7178;font-size:12.5px}.ppl-stats b{font-size:22px}.ppl-stats b.warn{color:#B45309}
.ppl-bar{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin:0 0 10px}.ppl-bar input[type=search]{flex:1;min-width:200px;width:auto}.ppl-bar select{width:auto;flex:0 0 auto}
.ppl input,.ppl select,.ppl-dlg input,.ppl-dlg select,.ppl-dlg textarea{font:inherit;font-size:14px;padding:6px 8px;border:1px solid #C9D4D7;border-radius:8px;background:#fff;color:#1C2B30;box-sizing:border-box;max-width:100%}
.ppl input.r{text-align:right}.ppl-b{font:inherit;font-size:13.5px;padding:7px 12px;border-radius:9px;border:1px solid #C9D4D7;background:#fff;color:#1C2B30;cursor:pointer}
.ppl-b.pri{background:#1E6A75;border-color:#1E6A75;color:#fff}.ppl-b.sm{padding:4px 9px;font-size:12.5px}.ppl-b.ghost{background:transparent}
.ppl-x{border:0;background:transparent;color:#8A9AA0;font-size:15px;cursor:pointer;padding:4px 6px}.ppl-x:hover{color:#B42318}
.ppl-tw{overflow:auto;max-height:calc(100vh - 330px);border:1px solid #DCE4E6;border-radius:12px;background:#fff}
.ppl table,.ppl-dlg table{border-collapse:collapse;width:100%;font-size:13.5px}.ppl th,.ppl-dlg th{position:sticky;top:0;background:#EEF3F4;text-align:left;font-weight:600;font-size:12.5px;color:#46606A;padding:7px 8px;z-index:1}
.ppl td,.ppl-dlg td{border-top:1px solid #EDF1F2;padding:5px 8px;vertical-align:middle}.ppl .r,.ppl-dlg .r{text-align:right}.ppl tr.new td,.ppl-dlg tr.new td{background:#EAF6F1}
.ppl-src{min-width:170px}.ppl-src small{color:#5B7178}.ppl-pill{display:inline-block;padding:1px 8px;border-radius:999px;background:#EEF1F2;font-size:12px}
.ppl-pill.warn{background:#FEF3C7;color:#92400E}.ppl-pill.info{background:#E0F0FF;color:#1D4E89}.ppl-pill.ok{background:#DCF5E7;color:#166534}
.ppl-h{color:#5B7178;font-size:12.5px;margin:8px 0 0}.ppl-e{color:#5B7178;padding:14px 4px}
.ppl-dlg{border:0;border-radius:14px;padding:18px 20px;max-width:min(760px,calc(100vw - 24px));width:100%;background:#fff;color:#1C2B30;font:14px/1.45 system-ui,-apple-system,'Segoe UI','Noto Sans Thai',sans-serif;box-shadow:0 20px 60px rgba(0,0,0,.35)}
.ppl-dlg h3{margin:0 0 10px;font-size:17px}.ppl-df{display:flex;gap:8px;justify-content:flex-end;margin-top:14px}.ppl-dlg label{display:flex;flex-direction:column;gap:3px;font-size:13px}
.ppl-dlg label.ppl-chk{flex-direction:row;align-items:center}.ppl-dlg .ppl-bar{margin-top:10px}
.ppl-toast{position:fixed;left:50%;bottom:24px;transform:translateX(-50%);background:#1C2B30;color:#fff;padding:10px 16px;border-radius:999px;font-size:14px;z-index:99999}
@media(max-width:640px){.ppl-body{padding:10px}.ppl-top{padding:10px 12px}.ppl-tw{max-height:none}}`;
const st=document.createElement('style');st.textContent=CSS;(document.head||document.documentElement).appendChild(st);
const deleted=()=>Object.assign({},lib(rd()).del);
window.penumPrices={attach,items,deleted,put,gov,govRows,set,remove,on,sync,open,render,find,state,merge,parse,rowSync,_rd:rd};
})();
