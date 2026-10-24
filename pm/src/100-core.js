/* ---------- basics ---------- */
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const n=v=>{const x=typeof v==='string'?parseFloat(v.replace(/,/g,'')):+v;return isFinite(x)?x:0};
const fmt=(v,d=0)=>n(v).toLocaleString('th-TH',{minimumFractionDigits:d,maximumFractionDigits:d});
const fmtq=v=>n(v).toLocaleString('th-TH',{maximumFractionDigits:2});
const pct=v=>`${fmt(v,1)}%`;
const uid=()=>'k'+Math.random().toString(36).slice(2,9);
const pad=(v,k=3)=>String(v).padStart(k,'0');
const iso=d=>`${d.getFullYear()}-${pad(d.getMonth()+1,2)}-${pad(d.getDate(),2)}`;
const pd=s=>{const [y,m,d]=String(s).split('-').map(Number);return new Date(y,(m||1)-1,d||1)};
const today=()=>iso(new Date());
const addD=(s,k)=>{const d=pd(s);d.setDate(d.getDate()+k);return iso(d)};
const diffD=(a,b)=>Math.round((pd(b)-pd(a))/864e5);
const okD=s=>/^\d{4}-\d\d-\d\d$/.test(s||'');
const thD=s=>okD(s)?pd(s).toLocaleDateString('th-TH',{day:'numeric',month:'short',year:'2-digit'}):'–';
const thDL=s=>okD(s)?pd(s).toLocaleDateString('th-TH',{day:'numeric',month:'long',year:'numeric'}):'–';
const sum=(a,f)=>a.reduce((s,x)=>s+n(f?f(x):x),0);
// a company can set its own prefix for each kind of document (DB.co.pfx); numbers already issued keep counting either way
// 3.63 documents that leave the company count across every project, so two projects never both issue INV-001 (RFI, VO, WIR, NCR … stay per project)
const NO_CO={'INV-':p=>p.bills,'PO-':p=>p.pos,'PR-':p=>p.prs,'DN-':p=>(p.fdoc||{}).dn,'WO-':p=>(p.fdoc||{}).wo,'SC-':p=>(p.fdoc||{}).sc,'HO-':p=>(p.fdoc||{}).ho};
const nextNo=(pre,list)=>{const px=String(typeof DB!=='undefined'&&DB&&DB.co&&DB.co.pfx&&DB.co.pfx[pre]||'').trim()||pre;
  if(NO_CO[pre]&&typeof DB!=='undefined'&&DB&&DB.projects)list=list.concat(...Object.values(DB.projects).map(p=>NO_CO[pre](p)||[]));
  return px+pad(list.reduce((m,x)=>{let s=String(x.no||'');s=s.startsWith(px)?s.slice(px.length):s.startsWith(pre)?s.slice(pre.length):s;const k=parseInt(s.replace(/\D+/g,''));return isFinite(k)&&k>m?k:m},0)+1)};
let toastT;function toast(m){const t=$('#toast');t.textContent=m;t.classList.add('on');clearTimeout(toastT);toastT=setTimeout(()=>t.classList.remove('on'),2600)}

/* BOQ groups as PENUM MEP names them */
const BOQ_G={eq:'งานเครื่องปรับอากาศ',pipe:'งานท่อน้ำยาและท่อน้ำทิ้ง',duct:'งานท่อลมและอุปกรณ์',chw:'งานระบบน้ำเย็น',el:'งานไฟฟ้าระบบปรับอากาศ',smk:'งานระบบควบคุมควันไฟ',fp:'งานระบบดับเพลิง',elb:'งานระบบไฟฟ้าอาคาร',fa:'งานระบบแจ้งเหตุเพลิงไหม้',com:'งานระบบสื่อสาร',cctv:'งานระบบกล้องวงจรปิด (CCTV)',acc:'งานระบบควบคุมการเข้า-ออก',pa:'งานระบบเสียงประกาศ',bms:'งานระบบควบคุมอาคารอัตโนมัติ (BMS)',lp:'งานระบบป้องกันฟ้าผ่าและสายดิน',genr:'งานเครื่องกำเนิดไฟฟ้าและ UPS',sol:'งานระบบโซลาร์เซลล์',wwt:'งานระบบบำบัดน้ำเสีย',mg:'งานระบบก๊าซทางการแพทย์',plb:'งานระบบสุขาภิบาล',civ:'งานโยธาที่เกี่ยวข้อง',oth:'งานทดสอบและอื่นๆ',ex:'งานเพิ่มเติม'};
const gName=g=>BOQ_G[g]||(g==='lab'?'ค่าแรงพนักงานบริษัท':g?g:'ไม่ระบุหมวด');
const G_OPTS=()=>[['','–'],...Object.entries(BOQ_G)];

/* ---------- storage ---------- */
// ?demo=1 opens the sample company in its own storage, apart from the real company (3.17)
// several companies on one device (3.49): each company has its own storage slot ('' = the first company, '2', '3'…).
// The tab remembers its slot (sessionStorage) so two windows can show two companies; new windows open the last one used.
// A new window never lands on a company that was added but not set up yet (it falls back to the first company).
const COSLOT=(()=>{try{const t=sessionStorage.getItem('pmSlot');if(t!=null)return t;const l=localStorage.getItem('penum.pm.slot')||'';if(!l)return '';
  const d=JSON.parse(localStorage.getItem('penum.pm.v1.c'+l)||'null'),c=d&&d.co||{};return c.setupAt||c.lic||(c.name||'').trim()?l:''}catch(e){return ''}})();
const DEMOPG=/[?&]demo=1\b/.test(location.search),DSFX=DEMOPG?'.demo':COSLOT?'.c'+COSLOT:'';
const KEY='penum.pm.v1'+DSFX,MEP_LINK='penum.mep.link';
const SUITE=/\.github\.io$/.test(location.hostname)||/^(localhost|127\.0\.0\.1)$/.test(location.hostname);
let DB,P,saveT;
function blankProject(name){
  const s=today();
  return {id:uid(),name:name||'โครงการใหม่',created:s,
    info:{client:'',site:'',contractNo:'',company:'',pm:'',start:s,finish:addD(s,120),cv:0,cvAuto:1,adv:15,ret:5,vat:7,wht:3,handover:''},
    boq:{items:[],src:'',at:'',sub:0,ohp:0,vat:0,grand:0},rooms:[],
    tasks:[],hist:{},inst:[],vendors:[],prs:[],pos:[],subs:[],spay:[],costs:[],bills:[],
    daily:[],safe:[],permits:[],incid:[],rfis:[],vos:[],subm:[],tc:[],tabA:[],tabW:[],punch:[],om:[],war:[]};
}
function blankCo(){return {name:'',tax:'',addr:'',phone:'',email:'',terms:'ยืนราคา 30 วัน · ชำระเงินตามงวดงาน · รับประกันผลงาน 1 ปี',customers:[],leads:[],quotes:[],staff:[],ts:[],skills:null,svc:[],tickets:[],equip:[],apprOn:false,roles:null}}
function migrate(p){const b=blankProject();for(const k in b)if(p[k]==null)p[k]=b[k];for(const k in b.info)if(p.info[k]==null)p.info[k]=b.info[k];return p}
function load(){
  try{DB=JSON.parse(localStorage.getItem(KEY)||'null')}catch(e){DB=null}
  if(!DB||!DB.projects||!Object.keys(DB.projects).length){const p=blankProject('โครงการแรก');DB={v:1,cur:p.id,projects:{[p.id]:p}};}
  Object.values(DB.projects).forEach(migrate);
  DB.co=Object.assign(blankCo(),DB.co||{});
  if(!DB.projects[DB.cur])DB.cur=Object.keys(DB.projects)[0];
  P=DB.projects[DB.cur];
}
function save(now){clearTimeout(saveT);const go=()=>{try{localStorage.setItem(KEY,JSON.stringify(DB))}catch(e){toast('บันทึกไม่ได้ พื้นที่เก็บข้อมูลเต็ม ลองลบรูปหรือสำรองข้อมูลแล้วลบโครงการเก่า')}};now?go():saveT=setTimeout(go,250)}
addEventListener('pagehide',()=>{if(!window.__coDrop)save(true)});

/* photos live in IndexedDB so the project data stays small */
const IDB={db:null,
  open(){return this.db||(this.db=new Promise((ok,no)=>{try{const r=indexedDB.open('penum-pm'+DSFX,1);r.onupgradeneeded=()=>r.result.createObjectStore('ph');r.onsuccess=()=>ok(r.result);r.onerror=()=>no(r.error)}catch(e){no(e)}}))},
  async put(k,v){const d=await this.open();return new Promise((ok,no)=>{const t=d.transaction('ph','readwrite');t.objectStore('ph').put(v,k);t.oncomplete=ok;t.onerror=()=>no(t.error)})},
  async get(k){const d=await this.open();return new Promise(ok=>{const r=d.transaction('ph').objectStore('ph').get(k);r.onsuccess=()=>ok(r.result);r.onerror=()=>ok(null)})},
  async del(k){const d=await this.open();return new Promise(ok=>{const t=d.transaction('ph','readwrite');t.objectStore('ph').delete(k);t.oncomplete=ok;t.onerror=ok})}};
const phCache={};
async function phSrc(k){if(phCache[k])return phCache[k];try{const v=await IDB.get(k);if(v)phCache[k]=v;return v||''}catch(e){return ''}}
function fillPhotos(root){(root||document).querySelectorAll('img[data-ph]').forEach(async im=>{const s=await phSrc(im.dataset.ph);if(s)im.src=s})}
function shrink(file,max=1280,q=.72){return new Promise((ok,no)=>{const fr=new FileReader();fr.onload=()=>{const im=new Image();im.onload=()=>{const k=Math.min(1,max/Math.max(im.width,im.height)),c=document.createElement('canvas');c.width=Math.round(im.width*k);c.height=Math.round(im.height*k);c.getContext('2d').drawImage(im,0,0,c.width,c.height);ok(c.toDataURL('image/jpeg',q))};im.onerror=no;im.src=fr.result};fr.onerror=no;fr.readAsDataURL(file)})}

/* file download: Artifact host downloads service when present, else a browser download */
async function download(name,data,type='application/json'){
  let svc=null;
  if(window.claude&&window.claude.use){try{svc=await Promise.race([window.claude.use('downloads'),new Promise(r=>setTimeout(()=>r(null),1500))])}catch(e){svc=null}}
  if(svc&&svc.save){try{await svc.save({filename:name,data:new Blob([data],{type})});return true}catch(e){}}
  try{const b=new Blob([data],{type}),u=URL.createObjectURL(b),a=document.createElement('a');a.href=u;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),4000);return true}catch(e){return false}
}
async function copyText(t){try{await navigator.clipboard.writeText(t);return true}catch(e){const a=document.createElement('textarea');a.value=t;document.body.appendChild(a);a.select();let ok=false;try{ok=document.execCommand('copy')}catch(_){}a.remove();return ok}}

/* ---------- path binding: data-p="tasks.k123.pct" ---------- */
function walk(path){const seg=path.split('.');let o=P,i0=0;if(seg[0]==='co'){o=DB.co;i0=1}for(let i=i0;i<seg.length-1;i++){const s=seg[i];o=Array.isArray(o)&&!/^\d+$/.test(s)?o.find(x=>x.id===s):o[s];if(o==null)return null}return {o,k:seg[seg.length-1]}}
function setPath(path,v){const w=walk(path);if(!w)return;w.o[w.k]=v}
function getPath(path){const w=walk(path);return w?w.o[w.k]:undefined}

/* ---------- generic editable table ----------
   cols: {k,h,t:'text'|'num'|'date'|'sel'|'area'|'chk'|'calc', o:[[v,label]], f:row=>html, w, r:right-align, sum} */
function cell(base,r,c){
  if(c.t==='calc')return `<td class="${c.r?'r':''}">${c.f(r)}</td>`;
  const p=`${base}.${r.id}.${c.k}`,v=r[c.k]??'',w=c.w?` style="min-width:${c.w}px"`:'';
  if(c.t==='sel')return `<td${w}><select data-p="${p}" aria-label="${esc(c.h)}">${(typeof c.o==='function'?c.o(r):c.o).map(([k,l])=>`<option value="${esc(k)}"${String(k)===String(v)?' selected':''}>${esc(l)}</option>`).join('')}</select></td>`;
  if(c.t==='area')return `<td${w}><textarea data-p="${p}" rows="1" aria-label="${esc(c.h)}">${esc(v)}</textarea></td>`;
  if(c.t==='chk')return `<td class="c"><input type="checkbox" data-p="${p}" data-t="chk"${v?' checked':''} aria-label="${esc(c.h)}"></td>`;
  if(c.t==='num')return `<td${w}><input class="r" inputmode="decimal" data-p="${p}" data-t="num" value="${v===''?'':esc(v)}" aria-label="${esc(c.h)}"></td>`;
  if(c.t==='date')return `<td${w}><input type="date" data-p="${p}" value="${esc(v)}" aria-label="${esc(c.h)}"></td>`;
  return `<td${w}><input data-p="${p}" value="${esc(v)}" aria-label="${esc(c.h)}"></td>`;
}
function gtable(base,rows,cols,o={}){
  const del=o.del!==false;
  const head=`<tr>${cols.map(c=>`<th class="${c.r||c.t==='num'?'r':''}">${c.h}</th>`).join('')}${o.extra?'<th></th>':''}${del?'<th></th>':''}</tr>`;
  const body=rows.length?rows.map(r=>`<tr${o.rowCls?` class="${o.rowCls(r)}"`:''}>${cols.map(c=>cell(base,r,c)).join('')}${o.extra?`<td style="white-space:nowrap">${o.extra(r)}</td>`:''}${del?`<td><button type="button" class="x" data-a="delRow" data-c="${base}" data-id="${r.id}" title="ลบแถว" aria-label="ลบแถว">✕</button></td>`:''}</tr>`).join('')
    :`<tr><td colspan="${cols.length+(del?1:0)+(o.extra?1:0)}" class="empty">${o.empty||'ยังไม่มีรายการ'}</td></tr>`;
  const tot=cols.some(c=>c.sum)&&rows.length?`<tr class="tot">${cols.map((c,i)=>`<td class="r">${c.sum?fmt(sum(rows,c.sum)):(i===0?'รวม':'')}</td>`).join('')}${o.extra?'<td></td>':''}${del?'<td></td>':''}</tr>`:'';
  return `<div class="tw"><table${o.cls?` class="${o.cls}"`:''}><thead>${head}</thead><tbody>${body}${tot}</tbody></table></div>`;
}
function tsvOf(rows,cols){return [cols.map(c=>c.h.replace(/<[^>]+>/g,'')).join('\t'),...rows.map(r=>cols.map(c=>{const v=c.t==='calc'?(c.tv?c.tv(r):String(c.f(r)).replace(/<[^>]+>/g,'')):c.t==='sel'?((typeof c.o==='function'?c.o(r):c.o).find(x=>String(x[0])===String(r[c.k]))||['',''])[1]:r[c.k]??'';return String(v).replace(/[\t\n]/g,' ')}).join('\t'))].join('\n')}
const TABLES={};// key -> {rows(),cols} for copy buttons
function copyBtn(key){return `<button type="button" class="btn sm" data-a="copyTbl" data-k="${key}">คัดลอกตาราง (วางใน Excel)</button>`}

/* ---------- shared lookups ---------- */
const itemName=it=>[it.head,it.type,it.desc].filter(Boolean).join(' · ');
const vName=id=>(P.vendors.find(v=>v.id===id)||{}).name||'–';
const subName=id=>(P.subs.find(v=>v.id===id)||{}).name||'–';
const boqCost=it=>n(it.q)*(n(it.m)+n(it.l));
const groupsInBoq=()=>[...new Set(P.boq.items.map(i=>i.g))].filter(Boolean);
function contract(){
  const I=P.info,base=I.cvAuto&&P.boq.items.length?(n(P.boq.sub)+n(P.boq.ohp)):n(I.cv);
  const vo=sum(P.vos.filter(v=>v.status==='ok'),v=>(v.type==='omit'?-1:1)*n(v.amt));
  return {base,vo,total:base+vo};
}

/* ---------- UI state ---------- */
const UIKEY='penum.pm.ui'+DSFX;
let S={mode:'pj',ctab:'exec',tab:'dash',sub:{},sel:{},zoom:'w',bg:'',pick:{}};
try{Object.assign(S,JSON.parse(localStorage.getItem(UIKEY)||'{}'));S.pick={}}catch(e){}
const saveUI=()=>{try{const {pick,...r}=S;localStorage.setItem(UIKEY,JSON.stringify(r))}catch(e){}};
const COTABS=[['exec','ภาพรวมบริษัท'],['sales','ขายและใบเสนอราคา'],['acct','บัญชีการเงิน'],['hr','บุคคลและแรงงาน'],['svc','บริการหลังการขาย'],['coset','ตั้งค่าบริษัท']];
const TABS=[['dash','ภาพรวม'],['sched','แผนงาน'],['buy','จัดซื้อและวัสดุ'],['cost','งบและเบิกงวด'],['site','หน้างาน'],['docs','เอกสาร'],['hand','ส่งมอบ'],['setup','ข้อมูลโครงการและ BOQ']];
const VIEWS={},CVIEWS={};const curTab=()=>S.mode==='co'?S.ctab:S.tab;
function subTabs(tab,list){tab=curTab();const cur=S.sub[tab]&&list.some(x=>x[0]===S.sub[tab])?S.sub[tab]:list[0][0];S.sub[tab]=cur;
  return {cur,html:`<div class="sub" role="tablist">${list.map(([k,l])=>`<button type="button" role="tab" data-a="sub" data-k="${k}" aria-selected="${k===cur}">${l}</button>`).join('')}</div>`}}

function resolve(path){let o=P,seg=path.split('.');if(seg[0]==='co'){o=DB.co;seg=seg.slice(1)}for(const s of seg){if(o==null)return null;o=Array.isArray(o)&&!/^\d+$/.test(s)?o.find(x=>x.id===s):o[s]}return o}

function render(){
  const ae=document.activeElement,fp=ae&&ae.dataset&&ae.dataset.p,ss=ae&&ae.selectionStart;
  $('#projSel').innerHTML=Object.values(DB.projects).sort((a,b)=>a.name.localeCompare(b.name,'th')).map(p=>`<option value="${p.id}"${p.id===P.id?' selected':''}>${esc(p.name)}</option>`).join('');
  const co=S.mode==='co',T=co?COTABS:TABS,cur=co?S.ctab:S.tab;
  $('#modeSw').innerHTML=[['co','บริษัท'],['pj','โครงการ']].map(([k,l])=>`<button type="button" data-a="mode" data-k="${k}" aria-pressed="${S.mode===k}">${l}</button>`).join('');
  $('#projBox').hidden=co;
  $('#tabs').innerHTML=T.map(([k,l])=>`<button type="button" role="tab" data-a="tab" data-k="${k}" aria-selected="${k===cur}">${l}</button>`).join('');
  const v=(co?CVIEWS[S.ctab]||CVIEWS.exec:VIEWS[S.tab]||VIEWS.dash)||(()=>'');
  try{$('#view').innerHTML=v()}catch(e){console.error(e);$('#view').innerHTML=`<section class="card"><h2>แสดงหน้านี้ไม่ได้</h2><p class="hint">${esc(e.message)}</p></section>`}
  fillPhotos($('#view'));
  if(fp){const el=$(`[data-p="${CSS.escape(fp)}"]`);if(el){el.focus();try{if(ss!=null&&el.setSelectionRange)el.setSelectionRange(ss,ss)}catch(e){}}}
  saveUI();
}
let rT;const rerender=()=>{clearTimeout(rT);rT=setTimeout(render,0)};

/* ---------- events ---------- */
const HOOK=[];// fns (path,value,obj) run after a field changes
document.addEventListener('change',e=>{
  const el=e.target;
  if(el.id==='projSel'){DB.cur=el.value;P=DB.projects[DB.cur];save();S.sel={};render();return}
  if(el.id==='fileIn')return;
  const p=el.dataset.p;if(!p)return;
  let v=el.dataset.t==='chk'?el.checked:el.dataset.t==='num'?(el.value.trim()===''?'':n(el.value)):el.value;
  setPath(p,v);HOOK.forEach(f=>f(p,v));save();rerender();
});
document.addEventListener('click',e=>{
  const b=e.target.closest('[data-a]');if(!b)return;
  const f=ACT[b.dataset.a];if(f){e.preventDefault();f(b,e)}
});
document.addEventListener('keydown',e=>{if(e.key==='Enter'&&e.target.matches('td input:not([type=checkbox])')){e.preventDefault();e.target.blur();e.target.focus()}});

const ACT={
  tab:b=>{if(S.mode==='co')S.ctab=b.dataset.k;else S.tab=b.dataset.k;render();scrollTo({top:0})},
  mode:b=>{S.mode=b.dataset.k;render();scrollTo({top:0})},
  go:b=>{S.mode=b.dataset.m||'pj';if(b.dataset.p&&DB.projects[b.dataset.p]){DB.cur=b.dataset.p;P=DB.projects[DB.cur];S.sel={}}if(S.mode==='co')S.ctab=b.dataset.k;else S.tab=b.dataset.k;if(b.dataset.s)S.sub[b.dataset.k]=b.dataset.s;save();render();scrollTo({top:0})},
  sub:b=>{S.sub[curTab()]=b.dataset.k;render()},
  sel:b=>{S.sel[b.dataset.k]=b.dataset.id;render()},
  delRow:b=>{const arr=resolve(b.dataset.c);if(!Array.isArray(arr))return;const i=arr.findIndex(x=>x.id===b.dataset.id);if(i<0)return;
    const r=arr[i];if(!confirm('ลบรายการนี้?'))return;arr.splice(i,1);(r.photos||[]).forEach(k=>IDB.del(k).catch(()=>{}));save();render()},
  add:b=>{const arr=resolve(b.dataset.c);if(!Array.isArray(arr))return;const r=Object.assign({id:uid()},NEW[b.dataset.c.split('.').pop()]?NEW[b.dataset.c.split('.').pop()](arr):{});arr.push(r);if(b.dataset.sel)S.sel[b.dataset.sel]=r.id;save();render()},
  copyTbl:async b=>{const t=TABLES[b.dataset.k];if(!t)return;toast(await copyText(tsvOf(t.rows(),t.cols))?'คัดลอกแล้ว วางใน Excel ได้เลย':'คัดลอกไม่ได้')},
  newProj:()=>{const nm=prompt('ชื่อโครงการใหม่','');if(!nm)return;const p=blankProject(nm.trim());DB.projects[p.id]=p;DB.cur=p.id;P=p;S.sel={};save();S.mode='pj';S.tab='setup';render()},
  backup:async()=>{const out=JSON.parse(JSON.stringify(DB));out.photos={};
    for(const k of photoKeys()){const v=await phSrc(k);if(v)out.photos[k]=v}
    toast(await download(`PENUM-PM-${today()}.json`,JSON.stringify(out))?'บันทึกไฟล์สำรองแล้ว':'บันทึกไฟล์ไม่ได้')},
  restore:()=>{const f=$('#fileIn');f.accept='.json,application/json';f.onchange=async()=>{const file=f.files[0];f.value='';if(!file)return;
    try{const J=JSON.parse(await file.text());if(!J.projects)throw new Error('ไม่ใช่ไฟล์สำรองของ PENUM PM');
      const keep=confirm('รวมโครงการจากไฟล์เข้ากับโครงการที่มีอยู่?\nกด ตกลง = รวม (โครงการชื่อซ้ำจะถูกแทนที่ด้วยไฟล์)\nกด ยกเลิก = ไม่ทำอะไร');if(!keep)return;
      for(const [k,v] of Object.entries(J.photos||{}))await IDB.put(k,v).catch(()=>{});
      Object.values(J.projects).forEach(p=>{migrate(p);DB.projects[p.id]=p});if(J.co)DB.co=Object.assign(DB.co||{},J.co);DB.cur=Object.keys(J.projects)[0];P=DB.projects[DB.cur];save(true);render();toast('เปิดไฟล์สำรองแล้ว')}
    catch(e){alert('เปิดไฟล์ไม่ได้: '+e.message)}};f.click()},
  print:b=>{const f=PRINT[b.dataset.k];if(!f)return;$('#print').innerHTML=f(b.dataset.id);fillPhotos($('#print'));setTimeout(()=>print(),300)},
};
const NEW={};// collection name -> fn(arr) giving defaults for a new row
const PRINT={};

/* ---------- dialog ---------- */
function dialog(title,body,buttons){const d=$('#dlg');d.innerHTML=`<div class="hd"><h2>${title}</h2><button type="button" class="x" data-a="dlgClose" aria-label="ปิด">✕</button></div><div class="bd">${body}</div><div class="ft">${buttons||''}<button type="button" class="btn" data-a="dlgClose">ปิด</button></div>`;if(!d.open)d.showModal();return d}
ACT.dlgClose=()=>$('#dlg').close();

/* print page head */
function phead(title,sub){const I=P.info,cn=I.company||DB.co.name;return `<div class="co"><div><b>${esc(cn||'')}</b>${cn?'<br>':''}โครงการ ${esc(P.name)}${I.client?' · '+esc(I.client):''}</div><div style="text-align:right">${sub||''}<br>พิมพ์ ${thDL(today())}</div></div><h1>${title}</h1>`}

