/* ---------- 4.71 ราคา สนค. รายเดือน: the monthly สนค. Excel updates the starter set's material prices ----------
   Each month the estimator downloads the ส่วนกลาง (or a province's) construction-material prices from index.tpso.go.th as Excel and pastes
   them under เติมราคา › บัญชีราคากระทรวงพาณิชย์ › วางบัญชีใหม่จาก Excel. Before, that book was matched by name only, so it never reached
   the 51 starter lines priced from สนค. (976: their names are ours, priced per metre or per m² from a roll or a pipe) nor the lines put in from
   the whole list (977: key 'moc:<code>'). Now the pasted book keeps each item's สนค. code (pbParse), and a code that one of those lines
   came from updates that line's material price, turned per metre / per m² the same way, labour kept. A line the company priced itself
   (or pinned) keeps its price and gets the new one to compare. Items without a known code go on as before (names, sizes). */
const MOC_CODE=/^\d{10,16}$/;
// the pasted table's code column (the สนค. file: รหัสหมวด, ชื่อหมวดสินค้า, รหัส, รายการ, หน่วย, <เดือน>)
{const f=pbParse;pbParse=function(txt){const L=f.apply(this,arguments);if(!L.length)return L;const R=tsvRows(txt),W=Math.max(...R.map(r=>r.length));
  let cj=-1;for(let j=0;j<W&&cj<0;j++)if(R.filter(r=>MOC_CODE.test(r[j]||'')).length>=R.length*.4)cj=j;if(cj<0)return L;
  // the file also has a category name column, which the guess in 530 can take for the unit: a header หน่วย decides
  const H=R.find(r=>r.some(c=>c==='หน่วย')),uj=H?H.indexOf('หน่วย'):-1,by=new Map();
  R.forEach(r=>{const c=r[cj];if(!MOC_CODE.test(c||''))return;const N=r.map(numOf).filter(v=>v!=null),u=uj>=0?r[uj]||'':null;
    r.forEach(v=>{if(v&&numOf(v)==null)N.forEach(p=>{const k=v+'|'+p;if(!by.has(k))by.set(k,{c,u})})})});
  L.forEach(i=>{const x=by.get(i.name+'|'+i.price);if(x){i.code=x.c;if(x.u!=null)i.unit=x.u}});return L}}
// code → the starter line's key and how its unit comes from the สนค. unit (976: [k, g, name, unit, m, l, r, [code, note]])
function mocCodeMap(){const M=new Map(),S=window.PENUM_GOV_PRICES;
  if(S&&Array.isArray(S.rows))S.rows.forEach(r=>{const mo=r[7];if(!mo||!mo[0])return;const a=String(mo[1]||'').match(/ม้วน ([\d.,]+) ตร\.ม\./);
    M.set(String(mo[0]),{key:'gov:'+r[0],m2:a?numOf(a[1]):0})});
  plCfg().forEach(x=>{const m=/^moc:(\d+)$/.exec(x.key||'');if(m&&!M.has(m[1]))M.set(m[1],{key:x.key,m2:0})});return M}
// the price per library unit: per metre from a roll or a pipe of a stated length, per m² from a roll of stated area
function mocUnitPrice(x,it,t){const p=mocPer([it.code,String(it.name).replace(/\s+/g,' '),String(it.unit).trim(),it.price]);// the file spaces words twice: ยาว  4  เมตรif(t.m2>0)return {m:Math.round(it.price/t.m2*100)/100,note:` (${fmt(it.price,2)} บาท/${it.unit} ${fmt(t.m2)} ตร.ม.)`};
  if(/^(m|ม\.?|เมตร)$/i.test(String(x.unit||'').trim()))return p?{m:p.p,note:` (${fmt(it.price,2)} บาท/${it.unit} ${fmt(p.len)} ม.)`}:null;
  return {m:it.price,note:''}}
const MOC_SOFT=['gov','offm','moc','est','offl','demo'];
// the book's coded items onto their lines; returns the counts and the items it used
function mocMonthly(pb){const M=mocCodeMap(),L=plCfg(),kx=new Map(L.filter(x=>x.key).map(x=>[x.key,x])),used=new Set(),t={add:0,upd:0,same:0,off:0},G={};
  const d=pb.month?pb.month+'-01':today(),mon=`สนค. ${pb.prov} ${thYM(pb.month)}`;
  pb.items.forEach(it=>{const tg=it.code&&M.get(it.code),x=tg&&kx.get(tg.key);if(!x)return;const u=mocUnitPrice(x,it,tg);if(!u)return;used.add(it.id);
    const soft=MOC_SOFT.includes(x.sk||'hand')&&!x.pin,sk=soft?(x.sk==='gov'||x.sk==='offm'?x.sk:x.sk==='offl'?'gov':'moc'):'moc';
    const lab=soft&&sk!=='moc'?(x.src||'').split(' · ').filter(s=>/ค่าแรง|ว 480/.test(s)).join(' · '):'';
    (G[sk+(soft?'':'|o')]=G[sk+(soft?'':'|o')]||[]).push({key:x.key,name:x.name,unit:x.unit,br:x.br,m:u.m,date:d,src:`${mon} รหัส ${it.code}${u.note}${lab?' · '+lab:''}`})});
  Object.entries(G).forEach(([k,R])=>{const [sk,o]=k.split('|'),r=plMerge(R,{sk,mOnly:1,newer:1,noAdd:1,offer:o?1:0});Object.keys(t).forEach(z=>t[z]+=r[z]||0)});
  return {t,used}}
// เติมราคา › ใช้บัญชีนี้: coded items first, the rest by name and size as before (960)
ACT.plMoc=()=>{const pb=pbCfg().find(x=>x.id===$('#plPb')?.value);if(!pb)return;const add=$('#plPbAdd')?.checked,T=mocMonthly(pb);
  const rest=pb.items.filter(x=>!T.used.has(x.id)),r=rest.length?plMerge(rest.map(x=>({name:x.name,unit:x.unit,m:x.price})),{src:`พณ. ${pb.prov} ${thYM(pb.month)}`,sk:'moc',mOnly:1,g:'mat',
    date:pb.month?pb.month+'-01':today(),noAdd:!add,fuzzy:plFz()}):{add:0,upd:0,same:0,off:0};
  $('#dlg').close();plSay({add:r.add,upd:r.upd+T.t.upd,same:r.same+T.t.same,off:(r.off||0)+T.t.off},`บัญชีราคาพาณิชย์ ${pb.prov}`)};
// a whole สนค. list is thousands of lines: by default it only updates the lines already in the library
const MOC_BIG=500;
{const f=plFillDlg;plFillDlg=function(){const r=f.apply(this,arguments),bd=$('#dlg .bd');
  if(bd){const s=[...bd.querySelectorAll('small.muted')].find(e=>/จับคู่จากชื่อและขนาด|price\.moc\.go\.th/.test(e.innerHTML));
    if(s)s.innerHTML=s.innerHTML.replace('ใช้เป็นค่าวัสดุ จับคู่จากชื่อและขนาด','ใช้เป็นค่าวัสดุ · รายการจากชุดเริ่มต้นและที่ใส่จากบัญชี สนค. จับคู่จากรหัสสินค้า (ราคาม้วนหรือท่อนหารเป็นต่อเมตรให้) รายการอื่นจับคู่จากชื่อและขนาด')
      .replace('ราคาวัสดุก่อสร้างรายจังหวัดจาก price.moc.go.th วางจากไฟล์ Excel ที่ดาวน์โหลดมา','ราคาวัสดุก่อสร้างรายเดือนจาก index.tpso.go.th (สนค.) วางจากไฟล์ Excel ที่ดาวน์โหลดมา')}
  const sel=$('#plPb'),c=$('#plPbAdd');// after the text above is rewritten (it holds them)
  if(sel&&c){const big=()=>{const pb=pbCfg().find(x=>x.id===sel.value);c.checked=!(pb&&pb.items.length>MOC_BIG)};big();sel.addEventListener('change',big)}return r}}
// วางบัญชีใหม่จาก Excel: where the monthly file is now
{const f=ACT.pbPaste;ACT.pbPaste=function(b){const r=f.apply(this,arguments),li=$('#dlg .bd ol.steps li');
  if(li)li.innerHTML=`เปิด <a href="https://index.tpso.go.th/construction-material-prices" target="_blank" rel="noopener">index.tpso.go.th</a> › ราคาวัสดุก่อสร้างรายจังหวัด › เลือก <b>ส่วนกลาง</b> (กรุงเทพฯ นนทบุรี ปทุมธานี สมุทรปราการ) หรือจังหวัดที่ทำงาน › แท็บ ราคาวัสดุก่อสร้าง เลือกเดือนล่าสุด แล้วกด <b>ดาวน์โหลดข้อมูล › Excel</b>`;
  const p=$('#pbProv');if(p&&!(CO().pbs||[]).length)p.value='ส่วนกลาง';return r}}
PL_URL.moc='https://index.tpso.go.th/construction-material-prices';
