/* ---------- 4.68 บัญชีราคา สนค. ทั้งชุด: the whole สนค. construction-material price list for ส่วนกลาง, September 2569 ----------
   pm/files/moc/tpso-central-2569-09.json holds the 5,470 items as the user downloaded them from index.tpso.go.th (code, name, unit,
   price; cash, without VAT or transport). It is read the first time someone searches it and kept in memory only, since it is too big
   for the company's data. The estimator searches it by words or code and puts a line into the คลังราคากลาง (sk 'moc', key 'moc:<code>'),
   per metre when the item is a roll or a pipe of a stated length. 51 of its prices are already in the starter set (976). */
const MOCL={url:'files/moc/tpso-central-2569-09.json',d:null,k:null,busy:null,err:'',q:'',c:''};
function mocLoad(){if(MOCL.d)return Promise.resolve(MOCL.d);if(MOCL.busy)return MOCL.busy;MOCL.err='';
  MOCL.busy=fetch(MOCL.url).then(r=>{if(!r.ok)throw new Error(r.status);return r.json()})
    .then(d=>{MOCL.d=d;MOCL.k=d.items.map(x=>pbNorm(x[0]+' '+x[1]).replace(/\s+/g,''));return d})
    .catch(()=>{MOCL.err='เปิดบัญชีราคาไม่ได้ ต้องต่ออินเทอร์เน็ตครั้งแรกที่เปิด'}).finally(()=>{MOCL.busy=null;mocPaint()});return MOCL.busy}
// a roll of cable or a pipe of a stated length is priced per metre too
function mocPer(x){const m=String(x[1]).match(/ยาว ?(\d+(?:\.\d+)?) ?(?:เมตร|ม\.)/);return m&&/^(ม้วน|ท่อน|เส้น)$/.test(x[2])&&+m[1]>0?{len:+m[1],p:Math.round(x[3]/+m[1]*100)/100}:null}
const mocCat=x=>String(x[0]).slice(0,2);
// every word of the search must be in the item (spaces do not count: "1x2.5" finds "1 x 2.5"); a category narrows it
function mocFind(){const d=MOCL.d;if(!d)return [];const W=pbNorm(MOCL.q).split(/\s+/).filter(Boolean),R=[];
  for(let i=0;i<d.items.length;i++){const x=d.items[i];if(MOCL.c&&mocCat(x)!==MOCL.c)continue;if(W.every(w=>MOCL.k[i].includes(w)))R.push(x)}return R}
const MOC_MAX=80;
function mocResHtml(){if(MOCL.err)return `<p class="hint">${esc(MOCL.err)}</p>`;if(!MOCL.d)return '<p class="hint">กำลังเปิดบัญชีราคา…</p>';
  if(!MOCL.q.trim()&&!MOCL.c)return `<p class="hint">พิมพ์ชื่อหรือรหัสรายการ เช่น <b>THW 2.5</b>, <b>ท่อ พีวีซี ชั้น 8.5 1/2</b>, <b>ประตูน้ำ 2"</b> หรือเลือกหมวด</p>`;
  const R=mocFind(),L=plCfg();if(!R.length)return '<p class="hint">ไม่พบรายการ ลองพิมพ์คำให้สั้นลง</p>';
  return `<p class="hint" style="margin:0 0 6px">พบ ${fmt(R.length)} รายการ${R.length>MOC_MAX?` แสดง ${MOC_MAX} รายการแรก พิมพ์เพิ่มเพื่อให้แคบลง`:''}</p><div class="tbl-wrap"><table class="tbl"><thead><tr><th>รายการ</th><th>หน่วย</th><th class="num">ราคา</th><th class="num">ต่อเมตร</th><th></th></tr></thead><tbody>`+
    R.slice(0,MOC_MAX).map(x=>{const p=mocPer(x),has=L.some(i=>i.key==='moc:'+x[0]);
      return `<tr><td><small class="muted">${esc(x[0])}</small><br>${esc(x[1])}</td><td>${esc(x[2])}</td><td class="num">${fmt(x[3],2)}</td><td class="num">${p?fmt(p.p,2):''}</td>
        <td><button type="button" class="btn sm${has?'':' pri'}" data-a="mocAdd" data-c="${esc(x[0])}">${has?'อยู่ในคลังแล้ว':'ใส่ในคลัง'}</button></td></tr>`}).join('')+'</tbody></table></div>'}
function mocPaint(){const el=$('#mocRes');if(el)el.innerHTML=mocResHtml()}
ACT.mocOpen=()=>{const d=MOCL.d;
  dialog('ค้นบัญชีราคา สนค. ส่วนกลาง ก.ย. 2569',`<p class="hint" style="margin-top:0">ราคาวัสดุก่อสร้างส่วนกลาง (กรุงเทพฯ นนทบุรี ปทุมธานี สมุทรปราการ) ${fmt(5470)} รายการ จากสำนักงานนโยบายและยุทธศาสตร์การค้า กระทรวงพาณิชย์ ราคาเงินสด ไม่รวม VAT และค่าขนส่ง
    · กด <b>ใส่ในคลัง</b> เพื่อใช้เป็นค่าวัสดุ (สายไฟเป็นม้วนและท่อเป็นท่อน จะใส่เป็นราคาต่อเมตรให้)</p>
    <div class="row" style="gap:8px;flex-wrap:wrap;margin-bottom:8px"><input id="mocQ" value="${esc(MOCL.q)}" placeholder="ค้นชื่อหรือรหัส" aria-label="ค้นชื่อหรือรหัส" style="flex:1;min-width:220px">
    <select id="mocC" aria-label="หมวด"><option value="">ทุกหมวด</option>${d?Object.entries(d.cats).map(([k,v])=>`<option value="${k}"${k===MOCL.c?' selected':''}>${esc(v)}</option>`).join(''):''}</select></div>
    <div id="mocRes">${mocResHtml()}</div>`);
  if(!d)mocLoad().then(()=>{if(MOCL.d&&$('#mocC')&&$('#mocC').options.length<2)$('#mocC').insertAdjacentHTML('beforeend',Object.entries(MOCL.d.cats).map(([k,v])=>`<option value="${k}">${esc(v)}</option>`).join(''))});
  setTimeout(()=>$('#mocQ')&&$('#mocQ').focus(),50)};
document.addEventListener('input',e=>{const id=e.target&&e.target.id;if(id!=='mocQ'&&id!=='mocC')return;MOCL[id==='mocQ'?'q':'c']=e.target.value;mocPaint()});
const MOC_G={'20':'elb','18':'plb','19':'plb'};
ACT.mocAdd=b=>{const d=MOCL.d,x=d&&d.items.find(i=>i[0]===b.dataset.c);if(!x)return;const p=mocPer(x);
  const r=plMerge([{key:'moc:'+x[0],name:x[1],unit:p?'m':x[2],m:p?p.p:x[3]}],{sk:'moc',mOnly:1,g:MOC_G[mocCat(x)]||'mat',date:d.date,
    src:`${d.short} รหัส ${x[0]}${p?` (${fmt(x[3],2)} บาท/${x[2]} ${fmt(p.len)} ม.)`:''}`});
  save();render();mocPaint();toast(r.add?'ใส่ในคลังราคากลางแล้ว':r.upd?'อัปเดตราคาในคลังแล้ว':'ราคาในคลังเท่าเดิม')};

// เติมราคา: the whole list next to the starter set
{const f=plFillDlg;plFillDlg=function(){const r=f.apply(this,arguments),bd=$('#dlg .bd');if(bd&&!bd.querySelector('[data-a="mocOpen"]')){const g=bd.querySelector('[data-a="plGov"]'),c=g&&g.closest('.card');
  const h=`<div class="card" style="margin:0 0 8px;padding:10px 12px"><div class="row" style="justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap"><div style="flex:1;min-width:220px"><b>บัญชีราคา สนค. ส่วนกลาง ก.ย. 2569 ทั้งชุด (มีในโปรแกรม)</b> <span class="pill ok">ราคาทางการ</span><br><small class="muted">ค้นได้ทุกรายการ ${fmt(5470)} รายการ (สายไฟ ท่อ วาล์ว ถังน้ำ โคมไฟ ฉนวน ปูน เหล็ก ฯลฯ) แล้วเลือกใส่ในคลังทีละรายการ ราคาเงินสด ไม่รวม VAT และค่าขนส่ง</small></div><button type="button" class="btn sm" data-a="mocOpen">ค้นบัญชีราคา</button></div></div>`;
  c?c.insertAdjacentHTML('afterend',h):bd.insertAdjacentHTML('afterbegin',h)}return r}}

if(typeof I18N==='object'&&I18N.en&&I18N.en.x)Object.assign(I18N.en.x,{
  'ค้นบัญชีราคา สนค. ส่วนกลาง ก.ย. 2569':'Search the TPSO Bangkok price list, Sep 2026','บัญชีราคา สนค. ส่วนกลาง ก.ย. 2569 ทั้งชุด (มีในโปรแกรม)':'Whole TPSO Bangkok price list, Sep 2026 (built in)',
  'ค้นบัญชีราคา':'Search the price list','ราคาทางการ':'Official','ใส่ในคลัง':'Add to library','อยู่ในคลังแล้ว':'In the library','ต่อเมตร':'Per metre','ค้นชื่อหรือรหัส':'Search name or code','ทุกหมวด':'All categories'});
