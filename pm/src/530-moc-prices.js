/* ---------- 3.8.3: Ministry of Commerce prices and K indices, pasted from Excel ----------
   Government sites do not let another website read their data, so the estimator downloads the province's monthly
   construction-material price table (price.moc.go.th) or the K index table and pastes it here.
   A price book is matched to the bid's BOQ by name and size; the estimator sees how far our material price is from
   the ministry's and can switch the chosen lines to it. */
const TH_MON=['ม.ค','ก.พ','มี.ค','เม.ย','พ.ค','มิ.ย','ก.ค','ส.ค','ก.ย','ต.ค','พ.ย','ธ.ค'],TH_MONL=['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน','กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'];
// "2026-05", "05/2569", "พ.ค. 69", "พฤษภาคม 2569", "May-26" → "2026-05"
function parseYM(s){s=String(s||'').trim();let m=s.match(/^(\d{4})[-/.](\d{1,2})$/);if(m)return ymFix(+m[1],+m[2]);
  m=s.match(/^(\d{1,2})[-/.](\d{2,4})$/);if(m)return ymFix(+m[2],+m[1]);
  let mo=TH_MONL.findIndex(x=>s.includes(x));if(mo<0)mo=TH_MON.findIndex(x=>s.replace(/\s/g,'').includes(x.replace(/\./g,''))||s.includes(x+'.'));
  if(mo<0){const en=['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'];mo=en.findIndex(x=>s.toLowerCase().includes(x))}
  const y=s.match(/(\d{4}|\d{2})(?!.*\d)/);if(mo<0||!y)return '';return ymFix(+y[1],mo+1)}
function ymFix(y,m){if(m<1||m>12)return '';if(y<100)y+=y>=40?2500:2000;if(y>2400)y-=543;return `${y}-${String(m).padStart(2,'0')}`}
const numOf=v=>{const t=String(v??'').replace(/[,\s฿]/g,'');return /^-?\d+(\.\d+)?$/.test(t)?+t:null};
function tsvRows(txt){return String(txt||'').replace(/\r/g,'').split('\n').map(l=>l.split('\t').map(c=>c.replace(/^"|"$/g,'').trim())).filter(r=>r.some(c=>c))}

// --- price books ---
function pbCfg(){const C=CO();C.pbs=C.pbs||[];return C.pbs}
// columns: the name is the longest text column, the price the last number column, the unit a short text column
function pbParse(txt){const R=tsvRows(txt);if(!R.length)return [];const W=Math.max(...R.map(r=>r.length)),txtLen=Array(W).fill(0),isNum=Array(W).fill(0);
  R.forEach(r=>r.forEach((c,i)=>{if(numOf(c)!=null)isNum[i]++;else txtLen[i]+=c.length}));
  const priceCol=[...isNum.keys()].filter(i=>isNum[i]>=R.length*.4).pop(),nameCol=[...txtLen.keys()].sort((a,b)=>txtLen[b]-txtLen[a])[0];
  const unitCol=[...txtLen.keys()].find(i=>i!==nameCol&&i!==priceCol&&R.filter(r=>r[i]&&r[i].length<=12&&numOf(r[i])==null).length>=R.length*.4);
  if(priceCol==null||nameCol==null)return [];
  return R.filter(r=>numOf(r[priceCol])>0&&r[nameCol]&&numOf(r[nameCol])==null).map(r=>({id:uid(),name:r[nameCol],unit:unitCol!=null?r[unitCol]||'':'',price:numOf(r[priceCol])}))}
// matching: character pairs for the words, and every size number in the BOQ line must appear in the book line
const pbNorm=s=>String(s||'').toLowerCase().replace(/(\d),(\d{3})/g,'$1$2').replace(/["'“”]/g,'').replace(/นิ้ว|inch|in\b/g,'"');
const pbNums=s=>new Set((pbNorm(s).match(/\d+(?:\.\d+)?(?:\/\d+)?/g)||[]).filter(x=>x!=='0'));
function pbBig(s){const t=pbNorm(s).replace(/[\s.,·\-–()\/:]+/g,''),B=new Map();for(let i=0;i<t.length-1;i++){const k=t.slice(i,i+2);B.set(k,(B.get(k)||0)+1)}return B}
function pbSim(A,B){let n=0,a=0,b=0;A.forEach(v=>a+=v);B.forEach(v=>b+=v);A.forEach((v,k)=>{if(B.has(k))n+=Math.min(v,B.get(k))});return a+b?2*n/(a+b):0}
const PBC=new WeakMap();
function pbIdx(pb){if(!PBC.has(pb)||PBC.get(pb).n!==pb.items.length)PBC.set(pb,{n:pb.items.length,L:pb.items.map(x=>({x,b:pbBig(x.name),num:pbNums(x.name)}))});return PBC.get(pb).L}
function pbCands(pb,i){const q=itemName(i),qb=pbBig(q),qn=pbNums(q);
  return pbIdx(pb).map(e=>{let s=pbSim(qb,e.b);// a size in the BOQ line that the book line lacks means a different item (3P 16 A is not 3P 50 A); extra numbers only cost a little
    const miss=[...qn].filter(x=>!e.num.has(x)).length,extra=[...e.num].filter(x=>!qn.has(x)).length;s-=miss?.5:0;s-=extra*.04;if(i.unit&&e.x.unit&&pbNorm(i.unit).replace(/\W/g,'')===pbNorm(e.x.unit).replace(/\W/g,''))s+=.05;return {x:e.x,s}}).sort((a,b)=>b.s-a.s).slice(0,6)}
const PB_MIN=.3;
function pbMatch(t,pb,i){const o=(t.pbx||{})[i.id];if(o==='none')return null;if(o){const x=pb.items.find(z=>z.id===o);if(x)return {x,s:1,manual:1}}const c=pbCands(pb,i)[0];return c&&c.s>=PB_MIN?c:null}

ACT.pbPaste=b=>{dialog('วางบัญชีราคาวัสดุจาก Excel',`<ol class="steps"><li>เปิด <a href="https://www.price.moc.go.th" target="_blank" rel="noopener">price.moc.go.th</a> เลือกราคาวัสดุก่อสร้าง จังหวัดที่ทำงาน และเดือนล่าสุด แล้วดาวน์โหลดเป็น Excel</li><li>ใน Excel เลือกตั้งแต่หัวตารางถึงแถวสุดท้าย กด Ctrl+C</li><li>คลิกในช่องด้านล่าง กด Ctrl+V</li></ol>
  <div class="form" style="margin:8px 0"><label>จังหวัด<input id="pbProv" value="${esc((CO().pbs||[]).slice(-1)[0]?.prov||'กรุงเทพมหานคร')}"></label><label>เดือนของราคา<input id="pbMon" type="month" value="${today().slice(0,7)}"></label></div>
  <textarea id="pbTxt" rows="9" placeholder="รายการ	หน่วย	ราคา"></textarea><p class="hint">โปรแกรมหาคอลัมน์ชื่อรายการ หน่วย และราคาให้เอง แถวหัวข้อหรือแถวที่ไม่มีราคาจะถูกข้าม</p>`,
  `<button type="button" class="btn pri" data-a="pbPasteGo" data-id="${b.dataset.id||''}">นำเข้า</button>`)};
ACT.pbPasteGo=b=>{const L=pbParse($('#pbTxt').value);if(!L.length){toast('ไม่พบรายการที่มีราคา ตรวจว่าคัดลอกมาทั้งตาราง');return}
  const pb={id:uid(),prov:$('#pbProv').value.trim(),month:$('#pbMon').value,src:'กระทรวงพาณิชย์',at:today(),items:L};pbCfg().push(pb);
  const t=tdById(b.dataset.id);if(t){t.pb=pb.id;t.pbx={}}$('#dlg').close();save();render();toast(`นำเข้าบัญชีราคา ${L.length} รายการแล้ว`)};
ACT.pbDel=b=>{const C=CO(),pb=(C.pbs||[]).find(x=>x.id===b.dataset.p);if(!pb||!confirm(`ลบบัญชีราคา ${pb.prov} ${thYM(pb.month)}?`))return;C.pbs=C.pbs.filter(x=>x!==pb);(C.tenders||[]).forEach(t=>{if(t.pb===pb.id)t.pb=''});save();render()};
ACT.pbUse=b=>{const t=tdById(b.dataset.id),pb=pbCfg().find(x=>x.id===t?.pb);if(!t||!pb)return;const only=b.dataset.i;let k=0;
  t.items.forEach(i=>{if(only&&i.id!==only)return;if(!only&&!$(`#pbc-${i.id}`)?.checked)return;const m=pbMatch(t,pb,i);if(!m)return;i.m=m.x.price;i.mSrc=`พณ. ${pb.prov} ${thYM(pb.month)}`;k++});
  save();render();toast(k?`ใช้ราคากระทรวงพาณิชย์ ${k} รายการ`:'ยังไม่ได้เลือกรายการ')};
document.addEventListener('change',e=>{const el=e.target;
  if(el.id==='tdPb'){const t=curTd();if(t){t.pb=el.value;t.pbx={};save();render()}}
  else if(el.dataset&&el.dataset.pbi){const t=curTd();if(t){(t.pbx=t.pbx||{})[el.dataset.pbi]=el.value;save();render()}}
  else if(el.id==='pbAll'){document.querySelectorAll('.pbc').forEach(c=>c.checked=el.checked)}});
document.addEventListener('change',e=>{if(e.target.id==='pbShow'){S.sel.pbShow=e.target.value;render()}});
function pbCard(t){const B=pbCfg(),pb=B.find(x=>x.id===t.pb);
  const head=`<section class="card"><h2><span>เทียบราคาวัสดุกับกระทรวงพาณิชย์</span><small>ราคาวัสดุก่อสร้างรายจังหวัดที่ใช้ทำราคากลางงานราชการ</small><span class="sp"></span><button type="button" class="btn sm" data-a="pbPaste" data-id="${t.id}">วางบัญชีราคาจาก Excel</button></h2>
    <div class="row" style="margin-bottom:8px"><label style="display:flex;gap:6px;align-items:center">บัญชีราคา <select id="tdPb" aria-label="บัญชีราคา"><option value="">– ไม่ใช้ –</option>${B.map(x=>`<option value="${x.id}"${x.id===t.pb?' selected':''}>${esc(x.prov)} · ${thYM(x.month)} · ${x.items.length} รายการ</option>`).join('')}</select></label>
    ${pb?`<button type="button" class="btn sm ghost" data-a="pbDel" data-p="${pb.id}">ลบบัญชีนี้</button>`:''}</div>`;
  if(!pb)return head+`<p class="hint">ยังไม่ได้เลือกบัญชีราคา กด “วางบัญชีราคาจาก Excel” แล้ววางตารางราคาวัสดุของจังหวัดที่ทำงานจาก price.moc.go.th</p></section>`;
  const R=t.items.map(i=>({i,m:pbMatch(t,pb,i)})),hit=R.filter(r=>r.m),show=S.sel.pbShow||'hit',L=show==='all'?R:show==='diff'?hit.filter(r=>Math.abs(r.m.x.price-n(r.i.m))/Math.max(1,r.m.x.price)>.05):hit;
  // the median, so one line priced with its fittings does not swing the figure
  const dl=hit.map(r=>(n(r.i.m)-r.m.x.price)/r.m.x.price*100).sort((a,b)=>a-b),dAvg=dl.length?(dl.length%2?dl[dl.length>>1]:(dl[dl.length/2-1]+dl[dl.length/2])/2):0;
  return head+`<dl class="stats" style="margin-bottom:10px"><div><dt>รายการที่จับคู่ได้</dt><dd>${hit.length} / ${t.items.length}</dd></div><div><dt>ราคาเราต่างจากพาณิชย์ (ค่ากลาง)</dt><dd style="color:${dAvg>0?'var(--danger)':'var(--good)'}">${dAvg>0?'+':''}${fmt(dAvg,1)}%</dd></div>
    <div><dt>ค่าวัสดุถ้าใช้ราคาพาณิชย์</dt><dd>${fmt(sum(R,r=>n(r.i.q)*(r.m?r.m.x.price:n(r.i.m))))}</dd></div></dl>
  <div class="row" style="margin-bottom:8px"><select id="pbShow" aria-label="แสดง"><option value="hit"${show==='hit'?' selected':''}>เฉพาะที่จับคู่ได้</option><option value="diff"${show==='diff'?' selected':''}>เฉพาะที่ต่างเกิน 5%</option><option value="all"${show==='all'?' selected':''}>ทุกรายการ</option></select>
    <button type="button" class="btn sm pri" data-a="pbUse" data-id="${t.id}">ใช้ราคาพาณิชย์กับรายการที่เลือก</button></div>
  <div class="tw" style="max-height:440px;overflow:auto"><table><thead><tr><th><input type="checkbox" id="pbAll" aria-label="เลือกทั้งหมด"></th><th>รายการใน BOQ</th><th class="r">วัสดุ/หน่วย (เรา)</th><th>รายการในบัญชีพาณิชย์</th><th class="r">ราคาพาณิชย์</th><th class="r">ต่าง</th><th></th></tr></thead><tbody>
  ${L.map(({i,m})=>{const C=pbCands(pb,i),d=m?(n(i.m)-m.x.price)/m.x.price*100:null;
    return `<tr><td>${m?`<input type="checkbox" class="pbc" id="pbc-${i.id}" aria-label="เลือก">`:''}</td><td style="min-width:220px">${esc(itemName(i))}<br><small class="muted">${esc(i.unit)}${i.mSrc?' · ราคาจาก '+esc(i.mSrc):''}</small></td><td class="r">${fmt(i.m,2)}</td>
      <td style="min-width:240px"><select data-pbi="${i.id}" aria-label="จับคู่กับ"><option value="none"${!m?' selected':''}>– ไม่มีในบัญชี –</option>${(m&&m.manual&&!C.some(c=>c.x.id===m.x.id)?[{x:m.x}]:[]).concat(C).map(c=>`<option value="${c.x.id}"${m&&m.x.id===c.x.id?' selected':''}>${esc(c.x.name)} (${esc(c.x.unit)}) ${fmt(c.x.price,2)}</option>`).join('')}</select></td>
      <td class="r">${m?fmt(m.x.price,2):''}</td><td class="r">${d==null?'':`<span style="color:${d>5?'var(--danger)':d<-5?'var(--good)':''}">${d>0?'+':''}${fmt(d,1)}%</span>`}</td><td>${m?`<button type="button" class="btn sm" data-a="pbUse" data-id="${t.id}" data-i="${i.id}">ใช้</button>`:''}</td></tr>`}).join('')||'<tr><td colspan="7" class="muted">ไม่มีรายการที่ตรงเงื่อนไข</td></tr>'}</tbody></table></div>
  <p class="hint">จับคู่จากชื่อและขนาดในชื่อรายการ ตรวจคู่ที่โปรแกรมเลือกก่อนกดใช้ เปลี่ยนคู่ได้จากช่องเลือก · ราคาพาณิชย์เป็นราคาวัสดุไม่รวมค่าแรงและไม่รวม VAT</p></section>`}
{const f=tdView;tdView=function(){const h=f(),t=curTd();if(!t||!t.items.length)return h;const k=h.lastIndexOf('<section class="card"><h2><span>ค่าใช้จ่ายหน้างาน');return k<0?h+pbCard(t):h.slice(0,k)+pbCard(t)+h.slice(k)}}

// --- K indices pasted from Excel: months down the side or across the top ---
const KNAME=[['I',/ผู้บริโภค|consumer|^i$/i],['C',/ซีเมนต์|cement|^c$/i],['S',/เหล็ก|steel|^s$/i],['E',/เครื่องจักร|บริภัณฑ์|machine|^e$/i],['F',/น้ำมัน|ดีเซล|diesel|fuel|^f$/i],['M',/วัสดุก่อสร้าง|material|^m$/i]];
const kCode=s=>{s=String(s||'').trim();const h=KNAME.find(([,r])=>r.test(s));return h?h[0]:''};
function kParse(txt){const R=tsvRows(txt),out={};if(R.length<2)return out;
  const hdrM=R[0].map(parseYM);
  if(hdrM.filter(Boolean).length>=1&&!parseYM(R[1][0])){// months across the top
    R.slice(1).forEach(r=>{const c=kCode(r[0]);if(!c)return;r.forEach((v,j)=>{const m=hdrM[j],x=numOf(v);if(m&&x!=null)(out[m]=out[m]||{})[c]=x})})}
  else{const hdrC=R[0].map(kCode);R.forEach(r=>{const m=parseYM(r[0]);if(!m)return;r.forEach((v,j)=>{const c=hdrC[j],x=numOf(v);if(c&&x!=null)(out[m]=out[m]||{})[c]=x})})}
  return out}
ACT.kPaste=()=>{dialog('วางดัชนีค่า K จาก Excel',`<ol class="steps"><li>ดาวน์โหลดตารางดัชนีราคาสำหรับค่า K จาก <a href="https://www.price.moc.go.th" target="_blank" rel="noopener">กระทรวงพาณิชย์</a></li><li>เลือกทั้งตารางรวมหัวตาราง กด Ctrl+C แล้ววางด้านล่าง</li></ol>
  <textarea id="kTxt" rows="9" placeholder="เดือน	I	C	M	S	E	F"></textarea><p class="hint">วางได้ทั้งแบบเดือนเรียงลงมา หรือเดือนเรียงไปทางขวา ชื่อดัชนีใช้ตัวย่อ (I C M S E F) หรือชื่อเต็ม เช่น ดัชนีราคาเหล็ก ก็ได้</p>`,
  `<button type="button" class="btn pri" data-a="kPasteGo">นำเข้า</button>`)};
ACT.kPasteGo=()=>{const o=kParse($('#kTxt').value),M=Object.keys(o);if(!M.length){toast('ไม่พบเดือนหรือชื่อดัชนีในตารางที่วาง');return}const C=tdCfg();
  M.forEach(m=>{let r=C.kidx.find(x=>x.m===m);if(!r){r={id:uid(),m,I:0,C:0,M:0,S:0,E:0,F:0};C.kidx.push(r)}Object.assign(r,o[m])});C.kidx.sort((a,b)=>String(a.m).localeCompare(String(b.m)));
  $('#dlg').close();save();render();toast(`นำเข้าดัชนี ${M.length} เดือนแล้ว`)};
{const f=kView;kView=function(){return f().replace('<button type="button" class="btn sm" data-a="add" data-c="co.kidx">+ เพิ่มเดือน</button>','<button type="button" class="btn sm pri" data-a="kPaste">วางจาก Excel</button><button type="button" class="btn sm" data-a="add" data-c="co.kidx">+ เพิ่มเดือน</button>')}}

