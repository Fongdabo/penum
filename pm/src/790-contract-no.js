/* ---------- 3.41 เลขที่สัญญาจากไฟล์ PO ----------
   Next to every "เลขที่สัญญา" box: pick the customer's PO / contract file (PDF or Excel) and the number and its date
   are read from the text. The user confirms in a dialog before anything is written. Scanned PDFs and photos carry no
   text, so they are typed by hand. */
document.head.insertAdjacentHTML('beforeend',`<style>
.po-pick{display:inline-flex;margin-top:4px;font-size:12.5px;padding:3px 9px;border-radius:8px;border:1px dashed var(--line);background:none;color:var(--pri,#0891B2);cursor:pointer;width:max-content}
.po-pick:hover{border-style:solid}
.po-view{border-style:solid;font-weight:600;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.po-ln{font-size:12px;color:var(--muted);margin:2px 0 8px;max-height:3.2em;overflow:hidden}
</style>`);
// the text of the file as lines (cells on one line joined by two spaces so "P.O. No." and its value stay apart)
async function poLines(file){const nm=file.name.toLowerCase();
  if(/\.(xlsx|xls|xlsm|csv)$/.test(nm)){await libLoad('xlsx.full.min.js');const wb=XLSX.read(await file.arrayBuffer(),{type:'array',cellDates:true}),L=[];
    wb.SheetNames.forEach(s=>XLSX.utils.sheet_to_json(wb.Sheets[s],{header:1,raw:false,defval:''}).forEach(r=>{const t=r.map(c=>String(c).trim()).filter(Boolean).join('  ');if(t)L.push(t)}));return L}
  if(!/\.pdf$/.test(nm)&&file.type!=='application/pdf')return null;
  await libLoad('pdf.min.js');pdfjsLib.GlobalWorkerOptions.workerSrc='files/lib/pdf.worker.min.js';
  const pdf=await pdfjsLib.getDocument({data:new Uint8Array(await file.arrayBuffer())}).promise,out=[];
  for(let pg=1;pg<=Math.min(pdf.numPages,4);pg++){const tc=await(await pdf.getPage(pg)).getTextContent(),L=[];
    tc.items.forEach(it=>{if(!it.str||!it.str.trim())return;const x=it.transform[4],y=it.transform[5];let l=L.find(l=>Math.abs(l.y-y)<3.5);if(!l){l={y,it:[]};L.push(l)}l.it.push({x,e:x+(it.width||it.str.length*4),s:it.str})});
    L.sort((a,b)=>b.y-a.y).forEach(l=>{l.it.sort((a,b)=>a.x-b.x);let s='',e=null;l.it.forEach(t=>{s+=e==null?t.s:(t.x-e>12?'  ':t.x-e>1.5&&!/^[ัิ-ฺ็-๎]/.test(t.s)?' ':'')+t.s;e=t.e});out.push(s.replace(/[\uE000-\uF8FF]/g,'').replace(/\s+$/,''))})}
  return out}
const PO_LAB=/(?:P\s*\.?\s*O\s*\.?\s*(?:No|Number|#)\b\.?|Purchase\s*Order\s*(?:No|Number|#)?\.?|Order\s*No\.?|Contract\s*(?:No|Number)\.?|เลขที่\s*(?:ใบสั่งซื้อ|ใบสั่งจ้าง|สัญญา(?:จ้าง)?|PO|P\.O\.)|(?:ใบสั่งซื้อ|ใบสั่งจ้าง|สัญญา(?:จ้าง)?)\s*เลขที่)/i;
const PO_DLAB=/(?:P\s*\.?\s*O\s*\.?\s*Date|Order\s*Date|Date|วันที่(?:สั่งซื้อ|สั่งจ้าง|ทำสัญญา|ลงนาม)?|ลงวันที่)/i;
const poTok=s=>{const m=String(s||'').replace(/^[\s:：.#-]+/,'').match(/^([A-Za-z0-9ก-ฮ][A-Za-z0-9ก-ฮ\-\/_.]*\d[A-Za-z0-9\-\/_.]*)/);return m?m[1].replace(/[.\-\/]+$/,''):''};
const THMS=['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'],THML=['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน','กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'],ENM=['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'];
function poDate(s){s=String(s||'');const Y=y=>{y=+y;if(y<100)y+=y>60?2500:2000;return y>2400?y-543:y},iso=(y,m,d)=>{const r=`${Y(y)}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`;return okD(r)?r:''};
  let m=s.match(/\b(\d{4})-(\d{1,2})-(\d{1,2})\b/);if(m)return iso(m[1],m[2],m[3]);
  m=s.match(/\b(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{2,4})\b/);if(m)return iso(m[3],m[2],m[1]);
  m=s.match(/(\d{1,2})\s*([ก-๙.]+)\s*(\d{2,4})/);if(m){const k=THMS.indexOf(m[2].replace(/\s/g,''))+1||THML.indexOf(m[2])+1;if(k)return iso(m[3],k,m[1])}
  m=s.match(/(\d{1,2})[\s\-]*([A-Za-z]{3})[a-z]*[\s\-,]*(\d{2,4})/);if(m){const k=ENM.indexOf(m[2].toLowerCase())+1;if(k)return iso(m[3],k,m[1])}
  m=s.match(/([A-Za-z]{3})[a-z]*\.?\s+(\d{1,2}),?\s+(\d{4})/);if(m){const k=ENM.indexOf(m[1].toLowerCase())+1;if(k)return iso(m[3],k,m[2])}return ''}
// candidates in the order they are most likely right: a labelled number, then a bare "PO…" code anywhere
function poFind(L){const nos=[],add=v=>{v=poTok(v);if(v&&v.length>=3&&!/^\d{1,2}[\/.]\d{1,2}[\/.]\d{2,4}$/.test(v)&&!nos.includes(v))nos.push(v)};let date='';
  L.forEach((l,i)=>{const m=l.match(PO_LAB);if(m){const rest=l.slice(m.index+m[0].length);add(rest)||0;if(!poTok(rest)&&L[i+1])add(L[i+1].split(/\s{2,}/)[0])}
    if(!date){const d=l.match(PO_DLAB);if(d){const v=poDate(l.slice(d.index+d[0].length));if(v)date=v}}});
  L.forEach(l=>(l.match(/\bP\.?O\.?[-\s]?\d[\w\-\/]*/gi)||[]).forEach(x=>add(x.replace(/\s/g,''))));
  return {nos,date}}
// 3.41.1: the number comes from the file name (e.g. "PO0869-NET-52.pdf"); the file's text only adds the date and other candidates
function poFromName(nm){let b=String(nm||'').replace(/\.[A-Za-z0-9]{1,5}$/,'').replace(/\s*\(\d+\)$/,'').replace(/[_\s]+/g,' ').trim();
  const m=b.match(/\bP\.?O\.?[-\s]?\d[\w\-\/.]*/i);if(m)return m[0].replace(/\s/g,'').replace(/[.\-]+$/,'');
  // otherwise the longest word that carries a digit ("สัญญาจ้าง เลขที่ 123-2569" → 123-2569); a name with no digit gives nothing
  const t=b.split(' ').filter(w=>/\d/.test(w)).sort((x,y)=>y.length-x.length)[0];return t?t.replace(/^[:#.]+|[.\-]+$/g,''):''}
ACT.poPick=b=>{const path=b.dataset.p||'info.contractNo';pickFile(async file=>{let L=null;
  if(/\.(pdf|xlsx|xls|xlsm|csv)$/i.test(file.name)){toast('กำลังอ่าน '+file.name+' …');try{L=await poLines(file)}catch(e){L=null}}
  const R=L?poFind(L):{nos:[],date:''},fn=poFromName(file.name);if(fn)R.nos=[fn,...R.nos.filter(x=>x!==fn)];L=L||[];
  PO_F=file.size<=25e6?file:null;if(!R.nos.length)R.nos=[I0()];
  const I=P.info,show=l=>L.find(x=>x.includes(l))||'';
  dialog('ดึงเลขที่สัญญาจากเอกสาร',`<p>จากไฟล์ <b>${esc(file.name)}</b></p>
    <label style="display:block;margin:8px 0 2px">เลขที่สัญญา / PO<input id="poNo" list="poNoL" value="${esc(R.nos[0])}" style="display:block;min-width:260px;margin-top:4px"><datalist id="poNoL">${R.nos.filter(Boolean).map(x=>`<option value="${esc(x)}">`).join('')}</datalist></label>
    ${R.nos.length>1?`<p class="hint">พบ ${R.nos.length} เลข: ${R.nos.map(esc).join(' · ')} กดที่ช่องเพื่อเลือก หรือแก้เองได้</p>`:'<p class="hint">แก้ตัวเลขในช่องได้ ถ้าอ่านผิด</p>'}
    <div class="po-ln" id="poLn">${!R.nos[0]?'ชื่อไฟล์ไม่มีเลขที่ พิมพ์เลขที่เองในช่องนี้':R.nos[0]===fn?'จากชื่อไฟล์':esc(show(R.nos[0]))}</div>
    ${R.date?`<label style="display:flex;gap:8px;align-items:center;margin:8px 0"><input type="checkbox" id="poDt" checked> ใส่วันที่ลงนามสัญญาเป็น <b>${esc(thDL(R.date))}</b> ด้วย${I.signed&&I.signed!==R.date?` <small class="muted">(เดิม ${esc(thDL(I.signed))})</small>`:''}</label>`:''}
    ${I.contractNo&&I.contractNo!==R.nos[0]?`<p class="hint">เลขที่เดิม “${esc(I.contractNo)}” จะถูกแทนที่</p>`:''}
    ${PO_F?`<label style="display:flex;gap:8px;align-items:center;margin:8px 0"><input type="checkbox" id="poKeep" checked> เก็บไฟล์นี้ไว้กับงาน เปิดดูภายหลังด้วยปุ่ม <b>📄 ดู PO</b>${I.poFile?` <small class="muted">(แทนไฟล์เดิม ${esc(I.poFile.name)})</small>`:''}</label>`:'<p class="hint">ไฟล์ใหญ่เกิน 25 MB จึงเก็บไว้ไม่ได้</p>'}`,
    `<button type="button" class="btn pri" data-a="poGo" data-p="${esc(path)}" data-d="${esc(R.date)}">ใช้เลขที่นี้</button>`);
  const s=$('#poNo');if(s)s.oninput=()=>{$('#poLn').textContent=s.value===fn?'จากชื่อไฟล์':show(s.value)}})};
ACT.poGo=b=>{const v=$('#poNo')&&$('#poNo').value.trim(),kp=$('#poKeep'),keep=PO_F&&kp&&kp.checked;if(!v&&!keep){toast('พิมพ์เลขที่สัญญาก่อน');return}
  if(v)setPath(b.dataset.p,v);const dt=$('#poDt');if(b.dataset.d&&dt&&dt.checked)P.info.signed=b.dataset.d;
  $('#dlg').close();if(keep)poKeep(P,PO_F);PO_F=null;save();render();toast(v?'ใส่เลขที่สัญญา '+v+' แล้ว'+(keep?' และเก็บไฟล์ไว้':''):'เก็บไฟล์ PO ไว้แล้ว')};
// 4.99.19: the PO / contract file itself is kept with the job (IndexedDB like photos, and the company folder / cloud when one is set)
let PO_F=null;const I0=()=>(P&&P.info&&P.info.contractNo)||'';
function poKeep(p,file){const fr=new FileReader();fr.onload=async()=>{const k='po:'+uid(),v=fr.result;try{await IDB.put(k,v)}catch(e){toast('เก็บไฟล์ PO ไม่ได้');return}phCache[k]=v;
    const I=p.info,old=I.poFile;I.poFile={k,name:file.name,size:file.size,type:file.type||'',date:today()};save();render();
    if(old&&old.k&&old.k!==k)IDB.del(old.k).catch(()=>{});
    try{if(typeof folderOn==='function'&&folderOn())fWrite(await fSub('photos'),k+'.txt',v).catch(()=>{})}catch(e){}};fr.readAsDataURL(file)}
ACT.poView=async()=>{const f=P&&P.info.poFile;if(!f)return;const w=window.open('','_blank');const v=await phSrc(f.k);
  if(!v){if(w)w.close();toast('ไม่พบไฟล์ PO ในเครื่องนี้ เปิดจากเครื่องที่แนบไฟล์ หรือแนบใหม่อีกครั้ง');return}
  let u;try{const b=await (await fetch(v)).blob();u=URL.createObjectURL(new Blob([b],{type:f.type||b.type}))}catch(e){u=v}
  const view=/pdf|image/.test(f.type||'')||/\.(pdf|png|jpe?g|webp|gif)$/i.test(f.name);
  if(view&&w){w.location.href=u}else{if(w)w.close();const a=document.createElement('a');a.href=u;a.download=f.name;document.body.appendChild(a);a.click();a.remove()}
  setTimeout(()=>{try{URL.revokeObjectURL(u)}catch(e){}},60000)};
function poBtns(){document.querySelectorAll('#view input[data-p="info.contractNo"]').forEach(i=>{const lb=i.closest('label');if(!lb||lb.querySelector('.po-pick'))return;
  lb.style.display=lb.style.display||'flex';lb.style.flexDirection='column';
  lb.insertAdjacentHTML('beforeend','<button type="button" class="po-pick" data-a="poPick" data-p="info.contractNo" title="เลือกไฟล์ PO หรือสัญญา ระบบใช้ชื่อไฟล์เป็นเลขที่สัญญา เช่น PO0869-NET-52.pdf">📄 ดึงจากชื่อไฟล์ PO / สัญญา</button>');
  const f=P.info.poFile;if(f)lb.insertAdjacentHTML('beforeend',`<button type="button" class="po-pick po-view" data-a="poView" title="แนบเมื่อ ${esc(thDL(f.date))} · กด 📄 ดึงจากชื่อไฟล์ เพื่อแนบไฟล์ใหม่แทน">📄 ดู PO: ${esc(f.name)}</button>`)})}
{const r=render;render=function(){const x=r.apply(this,arguments);try{if(S.mode==='pj')poBtns()}catch(e){}return x}}
Object.assign(SBKW,{'pj.setup':(SBKW['pj.setup']||'')+' PO ใบสั่งซื้อ ใบสั่งจ้าง เลขที่สัญญา ดึงจากไฟล์'});

