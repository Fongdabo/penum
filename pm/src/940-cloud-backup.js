/* ---------- 3.95 สำรองคลาวด์ลงเครื่อง: everything the company keeps in the cloud, as files on this computer ----------
   One button (เมนู, and ตั้งค่า › ที่เก็บข้อมูล) pulls it all down into a new dated folder, so it can be browsed without the internet:
     PENUM-PM/cloud-backup/<YYYY-MM-DD_HHMM>/
       อ่านก่อน.html            what is inside, each project, the photos as pictures; opens in any browser
       PENUM-PM-<date>.json     the PM data with its photos inside (PENUM PM › เปิดไฟล์สำรอง opens it, like ACT.backup's file)
       รูปภาพ/<project>/…       each photo as a picture file, named by date and what it belongs to
       PENUM MEP/*.penmep, PENUM BIM/*.penbim   the company's MEP / BIM projects (shared/team.js dump), they open as usual
       ไฟล์บนคลาวด์/…           the cloud folder as it is (penum-pm.json, backup/, …), photos/ aside (they are above)
   PM data comes from the cloud itself (830-cloud.js SBD) when the company is on คลาวด์ PENUM, else from this computer.
   Where: the File System Access folder picker; the folder picked is used as PENUM-PM when it has that name (or is
   PENUM-PM/cloud-backup), otherwise a PENUM-PM folder is made inside it. Only new folders and files are written, nothing else
   in the picked folder is read, changed or removed. Without the picker (phones, Firefox, Safari) or on request: one zip file.
   The cloud is only read. The folder picked is remembered (IndexedDB '__cbdir'), the last backup in localStorage pmCB. */
const CBK='pmCB'+DSFX,CB={busy:0,dir:null};
const cbLast=()=>{try{return JSON.parse(localStorage.getItem(CBK)||'null')}catch(e){return null}};
const cbName=s=>String(s||'').replace(/[\\/:*?"<>|\u0000-\u001f]+/g,' ').replace(/\s+/g,' ').trim().replace(/[. ]+$/,'').slice(0,80)||'ไม่มีชื่อ';
const cbStamp=(d=new Date())=>iso(d)+'_'+String(d.getHours()).padStart(2,'0')+String(d.getMinutes()).padStart(2,'0');
const CBT={daily:'รายงานประจำวัน',punch:'Punch list',safe:'ตรวจความปลอดภัย',incid:'อุบัติเหตุ',wir:'ขอตรวจงาน (WIR)',ncr:'NCR',att:'ลงเวลาเข้างาน',rcpt:'ใบเสร็จ',tk:'แจ้งซ่อม'};
const CBX={'image/jpeg':'jpg','image/jpg':'jpg','image/png':'png','image/webp':'webp','image/gif':'gif','image/heic':'heic','application/pdf':'pdf'};
// a photo's data URL → its bytes and file extension
function cbBytes(u){const m=/^data:([^;,]*)(;base64)?,/.exec(u||'');if(!m)return null;const s=u.slice(m[0].length);let b;
  try{if(m[2]){const t=atob(s);b=new Uint8Array(t.length);for(let i=0;i<t.length;i++)b[i]=t.charCodeAt(i)}else b=new TextEncoder().encode(decodeURIComponent(s))}catch(e){return null}
  return {b,x:CBX[(m[1]||'').toLowerCase()]||'bin'}}
// where each photo goes: รูปภาพ/<project>/<date> <what> <n>, from the records that hold it (photoKeys in 280-onedrive.js)
function cbPhotoPlaces(J){const M=new Map(),put=(k,pj,d,w)=>{if(!k||M.has(k))return;M.set(k,{pj,d:String(d||'').slice(0,10),w})};
  Object.values(J.projects||{}).forEach(p=>{const pj=cbName(p.name);
    Object.keys(CBT).forEach(c=>(Array.isArray(p[c])?p[c]:[]).forEach(r=>(r.photos||[]).forEach(k=>put(k,pj,r.date||r.d,CBT[c]))));
    (p.bills||[]).forEach(b=>(b.rcpts||[]).forEach(r=>(r.photos||[]).forEach(k=>put(k,pj,r.date||b.date,CBT.rcpt))))});
  ((J.co&&J.co.tickets)||[]).forEach(t=>(t.photos||[]).forEach(k=>put(k,'งานบริการ',t.date||t.d,CBT.tk)));return M}

/* where the files go: a folder on this computer, or one zip */
async function cbFolderSink(pick){let root=pick;const nm=String(pick.name||'');
  if(nm!=='PENUM-PM'&&nm!=='cloud-backup')root=await pick.getDirectoryHandle('PENUM-PM',{create:true});
  const cb=nm==='cloud-backup'?root:await root.getDirectoryHandle('cloud-backup',{create:true});
  let st=cbStamp(),i=1;for(;;){try{await cb.getDirectoryHandle(st+(i>1?'-'+i:''));i++}catch(e){break}}          // never into a folder that is already there
  st+=i>1?'-'+i:'';const top=await cb.getDirectoryHandle(st,{create:true}),D=new Map([['',top]]);
  const dirOf=async p=>{if(D.has(p))return D.get(p);const j=p.lastIndexOf('/'),h=await (await dirOf(j<0?'':p.slice(0,j))).getDirectoryHandle(p.slice(j+1),{create:true});D.set(p,h);return h};
  return {where:(nm==='cloud-backup'?'PENUM-PM › cloud-backup':nm==='PENUM-PM'?'PENUM-PM › cloud-backup':`${nm} › PENUM-PM › cloud-backup`)+' › '+st,
    async put(path,data){const j=path.lastIndexOf('/'),d=await dirOf(j<0?'':path.slice(0,j)),fh=await d.getFileHandle(path.slice(j+1),{create:true}),w=await fh.createWritable();await w.write(data);await w.close()},
    async end(){return true}}}
function cbZipSink(){const F=[],st=cbStamp(),top='PENUM-PM-cloud-backup-'+st;
  return {where:top+'.zip',put:async(path,data)=>{F.push({name:top+'/'+path,data})},
    async end(){return download(top+'.zip',cbZip(F),'application/zip')}}}
// a zip with the files stored as they are (photos are already compressed); names in UTF-8 (Thai names), like BIM's zipStore
let CBCRC=null;
function cbCrc(u){if(!CBCRC){CBCRC=new Uint32Array(256);for(let i=0;i<256;i++){let c=i;for(let k=0;k<8;k++)c=c&1?0xEDB88320^(c>>>1):c>>>1;CBCRC[i]=c>>>0}}
  let c=0xFFFFFFFF;for(let i=0;i<u.length;i++)c=CBCRC[(c^u[i])&255]^(c>>>8);return (c^0xFFFFFFFF)>>>0}
function cbZip(files){const te=new TextEncoder(),d=new Date(),time=(d.getHours()<<11)|(d.getMinutes()<<5)|(d.getSeconds()>>1),date=((d.getFullYear()-1980)<<9)|((d.getMonth()+1)<<5)|d.getDate();
  const parts=[],cen=[];let off=0;const u16=v=>[v&255,(v>>>8)&255],u32=v=>[v&255,(v>>>8)&255,(v>>>16)&255,(v>>>24)&255];
  for(const f of files){const name=te.encode(f.name),data=typeof f.data==='string'?te.encode(f.data):f.data,crc=cbCrc(data),
      common=[...u16(20),...u16(0x0800),...u16(0),...u16(time),...u16(date),...u32(crc),...u32(data.length),...u32(data.length),...u16(name.length),...u16(0)];
    const lh=new Uint8Array([0x50,0x4b,3,4,...common]);parts.push(lh,name,data);
    cen.push(new Uint8Array([0x50,0x4b,1,2,...u16(20),...common,...u16(0),...u16(0),...u16(0),...u32(0),...u32(off)]),name);off+=lh.length+name.length+data.length}
  let cl=0;for(const c of cen)cl+=c.length;
  return new Blob([...parts,...cen,new Uint8Array([0x50,0x4b,5,6,0,0,0,0,...u16(files.length),...u16(files.length),...u32(cl),...u32(off),0,0])],{type:'application/zip'})}

/* the work */
function cbProg(t,i,n){const m=$('#cbMsg'),b=$('#cbBar');if(m)m.textContent=t+(n?` ${i}/${n}`:'');if(b)b.style.width=(n?Math.round(i/n*100):0)+'%'}
const cbErr=e=>({nolic:'ยังไม่มีรหัสเปิดใช้งาน (ตั้งค่า › สิทธิ์การใช้งาน)',offline:'ต่อคลาวด์ไม่ได้ (ตรวจอินเทอร์เน็ต)',nosql:'บริษัทยังไม่ได้เปิดใช้โครงการของบริษัท',big:'ข้อมูลใหญ่เกิน',full:'ที่เก็บเต็ม'})[e]||'อ่านไม่ได้ ('+e+')';
async function cbRun(sink){const R={pm:0,ph:0,phNo:0,raw:0,mep:[],bim:[],team:'',src:sbOn()?'cloud':'here',J:null,places:null,files:{}},
    used=new Set(),uniq=p=>{let q=p,i=2;const j=p.lastIndexOf('.'),a=j>p.lastIndexOf('/')?p.slice(0,j):p,x=j>p.lastIndexOf('/')?p.slice(j):'';while(used.has(q.toLowerCase()))q=`${a} (${i++})${x}`;used.add(q.toLowerCase());return q};
  const photos={};let J=null;
  // 1) PENUM PM: the cloud folder (or this computer's data)
  if(R.src==='cloud'){cbProg('กำลังอ่านรายการไฟล์บนคลาวด์…');const L=[],walk=async(d,pre)=>{for await(const [nm,h] of d.entries()){if(h.kind==='directory')await walk(h,pre+nm+'/');else L.push([pre+nm,h])}};
    await walk(SBD(SB.cid),'');const main=L.find(x=>x[0]===FNAME);if(!main)throw new Error('ไม่พบข้อมูลบริษัทบนคลาวด์ ('+FNAME+')');
    cbProg('กำลังดาวน์โหลดข้อมูล PENUM PM…');const txt=await (await main[1].getFile()).text();J=JSON.parse(txt);R.places=cbPhotoPlaces(J);
    const ph=L.filter(x=>/^photos\/[^/]+\.txt$/.test(x[0])),rest=L.filter(x=>!ph.includes(x));
    let i=0;for(const [p,h] of rest){cbProg('กำลังดาวน์โหลดไฟล์บนคลาวด์',++i,rest.length);await sink.put(uniq('ไฟล์บนคลาวด์/'+p),p===FNAME?txt:await (await h.getFile()).text());R.raw++}
    i=0;for(const [p,h] of ph){cbProg('กำลังดาวน์โหลดรูปภาพ',++i,ph.length);const k=p.slice(7,-4);let t='';try{t=await (await h.getFile()).text()}catch(e){}
      if(!t.startsWith('data:')){R.phNo++;continue}photos[k]=t;await cbPhoto(sink,R,uniq,k,t)}}
  else{J={v:DB.v||1,projects:DB.projects,co:DB.co};R.places=cbPhotoPlaces(J);const K=photoKeys();let i=0;
    for(const k of K){cbProg('กำลังรวบรวมรูปภาพ',++i,K.length);const t=await phSrc(k);if(!t){R.phNo++;continue}photos[k]=t;await cbPhoto(sink,R,uniq,k,t)}}
  R.J=J;R.pm=Object.keys(J.projects||{}).length;
  cbProg('กำลังเขียนไฟล์ข้อมูล PENUM PM…');R.files.pm=`PENUM-PM-${today()}.json`;await sink.put(uniq(R.files.pm),JSON.stringify(Object.assign({},J,{photos})));
  // 2) PENUM MEP / PENUM BIM: the company's projects (shared/team.js)
  if(window.penumTeam&&penumTeam.dump&&!DEMOPG){cbProg('กำลังดึงโครงการ PENUM MEP / BIM…');const r=await penumTeam.dump((i,n)=>cbProg('กำลังดึงโครงการ PENUM MEP / BIM',i,n)).catch(()=>({err:'offline'}));
    if(r.err)R.team=cbErr(r.err);
    else for(const x of r.rows){const m=x.m||{},A=x.app==='bim'?'PENUM BIM':'PENUM MEP',it={n:m.name||'ไม่มีชื่อ',c:m.client||'',by:m.by||'',at:m.at||Date.parse(x.at)||0,off:x.off,f:''};
      if(x.d){it.f=uniq(`${A}/${cbName(it.n)}${x.off?' (เอาออกจากรายการแล้ว)':''}.${x.app==='bim'?'penbim':'penmep'}`);await sink.put(it.f,x.d)}(x.app==='bim'?R.bim:R.mep).push(it)}}
  else R.team=DEMOPG?'หน้านี้เป็นบริษัทตัวอย่าง':'โปรแกรมรุ่นนี้ยังไม่มีโครงการของบริษัท';
  // 3) the page that says what is inside
  cbProg('กำลังทำหน้าสรุป…');await sink.put('อ่านก่อน.html',cbIndex(R));
  return R}
async function cbPhoto(sink,R,uniq,k,t){const x=cbBytes(t);if(!x){R.phNo++;return}const pl=R.places.get(k)||{pj:'อื่นๆ',d:'',w:''};
  const f=uniq(`รูปภาพ/${pl.pj}/${cbName([pl.d,pl.w].filter(Boolean).join(' ')||'รูป')}.${x.x}`);await sink.put(f,x.b);R.ph++;(R.files.ph||(R.files.ph=[])).push({f,pj:pl.pj,d:pl.d,w:pl.w})}
// อ่านก่อน.html: plain, light, works offline; links are relative to the backup folder
function cbIndex(R){const J=R.J||{},co=(J.co||{}).name||DB.co.name||'',now=new Date(),u=p=>p.split('/').map(encodeURIComponent).join('/'),
    dt=x=>x?new Date(x).toLocaleString('th-TH',{dateStyle:'medium',timeStyle:'short'}):'–',PH=R.files.ph||[];
  const pj=Object.values(J.projects||{}).map(p=>{const I=p.info||{},n=PH.filter(x=>x.pj===cbName(p.name)).length;
    return `<tr><td>${esc(p.name||'')}</td><td>${esc(I.client||'')}</td><td>${esc(I.contractNo||'')}</td><td class="r">${(p.daily||[]).length}</td><td class="r">${n}</td></tr>`}).join('');
  const tm=(L,ap,bt)=>L.length?`<table><tr><th>โครงการ</th><th>ลูกค้า</th><th>บันทึกล่าสุด</th><th>ไฟล์</th></tr>${L.map(x=>`<tr><td>${esc(x.n)}${x.off?' <small>(เอาออกจากรายการแล้ว)</small>':''}</td><td>${esc(x.c)}</td><td>${esc(x.by)} · ${dt(x.at)}</td><td>${x.f?`<a href="${u(x.f)}">${esc(x.f.split('/').pop())}</a>`:'<small>ไม่มีข้อมูล</small>'}</td></tr>`).join('')}</table>
      <p class="h">เปิดใน ${ap}: กด <b>${bt}</b> แล้วเลือกไฟล์นี้</p>`:`<p class="h">${R.team?esc(R.team):'ไม่มีโครงการ'}</p>`;
  const groups=[...new Set(PH.map(x=>x.pj))].map(g=>`<h3>${esc(g)} <small>${PH.filter(x=>x.pj===g).length} รูป</small></h3><div class="g">${PH.filter(x=>x.pj===g).map(x=>
    `<a href="${u(x.f)}" title="${esc(x.f.split('/').pop())}">${/\.(jpg|png|webp|gif)$/.test(x.f)?`<img loading="lazy" src="${u(x.f)}" alt="">`:'<span>ไฟล์</span>'}<small>${esc([x.d,x.w].filter(Boolean).join(' · '))}</small></a>`).join('')}</div>`).join('');
  return `<!doctype html><html lang="th"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>สำรองคลาวด์ ${esc(co)} ${iso(now)}</title>
<style>body{font:15px/1.6 system-ui,'Noto Sans Thai',Tahoma,sans-serif;margin:0;padding:24px 28px;color:#16323A;background:#F2F5F4}h1{margin:0 0 4px;font-size:24px}h2{margin:28px 0 8px;font-size:18px;border-bottom:2px solid #0891B2;padding-bottom:4px}h3{margin:18px 0 6px;font-size:15px}
small,.h{color:#5B7077}table{border-collapse:collapse;width:100%;background:#fff;border-radius:8px;overflow:hidden}th,td{text-align:left;padding:6px 10px;border-bottom:1px solid #E1E8E7;vertical-align:top}th{background:#E6F4F6;font-weight:600}td.r{text-align:right}
a{color:#0E6E7E}.g{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:10px}.g a{display:flex;flex-direction:column;background:#fff;border-radius:8px;overflow:hidden;text-decoration:none;color:inherit}
.g img{width:100%;aspect-ratio:4/3;object-fit:cover;background:#E1E8E7}.g span{aspect-ratio:4/3;display:grid;place-items:center;background:#E1E8E7}.g small{padding:4px 8px}.box{background:#fff;border-radius:8px;padding:10px 14px}</style></head><body>
<h1>สำรองข้อมูลคลาวด์ ${esc(co)}</h1><p class="h">สำรองเมื่อ ${dt(now)} · PENUM PM ${esc(((window.PENUM_SITE||{}).name)||'')} · เปิดดูหน้านี้ได้โดยไม่ต้องใช้อินเทอร์เน็ต</p>
<h2>ข้อมูล PENUM PM <small>${R.pm} โครงการ${R.src==='cloud'?' จากคลาวด์ PENUM':' จากเครื่องที่สำรอง'}</small></h2>
<p class="box">ไฟล์ <a href="${u(R.files.pm)}">${esc(R.files.pm)}</a> มีข้อมูลบริษัทและทุกโครงการพร้อมรูปภาพ · เปิดกลับใน PENUM PM: เมนู › <b>เปิดไฟล์สำรอง</b></p>
${pj?`<table><tr><th>โครงการ</th><th>ลูกค้า</th><th>เลขที่สัญญา</th><th class="r">รายงานประจำวัน</th><th class="r">รูป</th></tr>${pj}</table>`:''}
<h2>PENUM MEP <small>${R.mep.length} โครงการ</small></h2>${tm(R.mep,'PENUM MEP','เปิดไฟล์โครงการ')}
<h2>PENUM BIM <small>${R.bim.length} โครงการ</small></h2>${tm(R.bim,'PENUM BIM','เปิดไฟล์งาน…')}
<h2>รูปภาพ <small>${R.ph} รูป ในโฟลเดอร์ รูปภาพ แยกตามโครงการ${R.phNo?` · ${R.phNo} รูปไม่มีข้อมูล`:''}</small></h2>${groups||'<p class="h">ไม่มีรูปภาพ</p>'}
${R.raw?`<h2>ไฟล์บนคลาวด์ <small>${R.raw} ไฟล์</small></h2><p class="h">โฟลเดอร์ ไฟล์บนคลาวด์ คือไฟล์ทั้งหมดในที่เก็บของบริษัทบนคลาวด์ตามที่เป็นอยู่ (penum-pm.json, ไฟล์สำรองรายวันใน backup และอื่นๆ) ยกเว้นรูปภาพที่อยู่ในโฟลเดอร์ รูปภาพ แล้ว</p>`:''}
</body></html>`}

/* the window */
async function cbSaved(){if(CB.dir)return CB.dir;try{const h=await IDB.get('__cbdir');if(h&&h.kind==='directory')CB.dir=h}catch(e){}return CB.dir}
const cbMay=()=>!(pinOn()&&(!authOK()||S.me))&&!sbStaffLock();          // all of the company's data, pay included: the administrator only, like สำรองข้อมูล (300)
ACT.cbStart=async()=>{if(CB.busy){toast('กำลังสำรองอยู่');return}if(DEMOPG){toast('หน้านี้เป็นบริษัทตัวอย่าง');return}if(!cbMay()){toast('เฉพาะผู้ดูแลระบบ');return}
  const h=await cbSaved(),l=cbLast(),cl=sbOn(),co=DB.co.name||'บริษัทนี้';
  dialog('สำรองคลาวด์ลงเครื่อง',`<p>ดึงข้อมูลของ <b>${esc(co)}</b> ${cl?'จากคลาวด์ PENUM ':''}ลงมาเป็นไฟล์ในเครื่องนี้ เปิดดูได้แม้ไม่มีอินเทอร์เน็ต ข้อมูลบนคลาวด์ไม่ถูกแก้ไข</p>
  <ul style="margin:6px 0 10px;padding-left:20px;line-height:1.8"><li>ข้อมูล PENUM PM ทุกโครงการ${cl?'':' (ข้อมูลในเครื่องนี้ บริษัทนี้ไม่ได้เก็บบนคลาวด์ PENUM)'} เปิดกลับได้ด้วย เมนู › <b>เปิดไฟล์สำรอง</b></li><li>รูปภาพหน้างาน เป็นไฟล์รูป แยกโฟลเดอร์ตามโครงการ</li>
  ${cl?'<li>ไฟล์บนคลาวด์ทั้งหมด รวมไฟล์สำรองรายวัน</li>':''}<li>โครงการ PENUM MEP และ PENUM BIM ของบริษัท (.penmep / .penbim เปิดในโปรแกรมได้ตามปกติ)</li><li>หน้าสรุป <b>อ่านก่อน.html</b> ดูรายการและรูปภาพได้ในเบราว์เซอร์</li></ul>
  <p class="sp-n">เก็บในโฟลเดอร์ใหม่ <b>PENUM-PM › cloud-backup › ${cbStamp()}</b> ไม่แตะไฟล์อื่นในเครื่อง${fsOK()?' · เลือกโฟลเดอร์ PENUM-PM หรือโฟลเดอร์ที่จะให้สร้าง PENUM-PM ไว้ข้างใน (เช่น Documents หรือ OneDrive)':''}</p>
  ${l?`<p class="hint">สำรองล่าสุด ${new Date(l.at).toLocaleString('th-TH')} · ${esc(l.where||'')}</p>`:''}
  <div id="cbRun" hidden><div style="height:8px;background:var(--line,#E1E8E7);border-radius:4px;overflow:hidden;margin:10px 0 6px"><i id="cbBar" style="display:block;height:100%;width:0;background:var(--pri,#0891B2);transition:width .2s"></i></div><p id="cbMsg" class="hint" style="margin:0"></p></div>`,
  (fsOK()?(h?`<button type="button" class="btn pri" data-a="cbGo" data-w="saved">บันทึกลงโฟลเดอร์ ${esc(h.name)}</button><button type="button" class="btn" data-a="cbGo" data-w="pick">เลือกโฟลเดอร์อื่น…</button>`
    :'<button type="button" class="btn pri" data-a="cbGo" data-w="pick">เลือกโฟลเดอร์แล้วเริ่มสำรอง…</button>'):'')+`<button type="button" class="btn${fsOK()?'':' pri'}" data-a="cbGo" data-w="zip">ดาวน์โหลดเป็นไฟล์ zip</button>`)};
ACT.cbGo=async b=>{if(CB.busy||!cbMay())return;const w=b&&b.dataset.w;let sink;
  try{if(w==='zip')sink=cbZipSink();
    else{let h=w==='saved'?await cbSaved():null;
      if(h){let p=await h.queryPermission({mode:'readwrite'});if(p!=='granted')p=await h.requestPermission({mode:'readwrite'});if(p!=='granted')h=null}
      if(!h){try{h=await showDirectoryPicker({id:'penum-cloud-backup',mode:'readwrite',startIn:'documents'})}catch(e){return}CB.dir=h;IDB.put('__cbdir',h).catch(()=>{})}
      sink=await cbFolderSink(h)}}
  catch(e){alert('เขียนลงโฟลเดอร์นี้ไม่ได้\n'+(e.message||e)+'\n\nลองเลือกโฟลเดอร์อื่น หรือดาวน์โหลดเป็นไฟล์ zip');return}
  CB.busy=1;const d=$('#dlg');d.querySelectorAll('.ft .btn').forEach(x=>{if(x.dataset.a!=='dlgClose')x.disabled=true});const run=$('#cbRun');if(run)run.hidden=false;
  try{const R=await cbRun(sink);cbProg('กำลังบันทึกไฟล์…');if(!await sink.end())throw new Error('บันทึกไฟล์ zip ไม่ได้');
    try{localStorage.setItem(CBK,JSON.stringify({at:Date.now(),where:sink.where}))}catch(e){}
    const li=(t,v)=>`<div><dt>${t}</dt><dd style="font-size:15px">${v}</dd></div>`;
    dialog('สำรองคลาวด์ลงเครื่องเสร็จแล้ว',`<p>✓ เก็บไว้ที่ <b>${esc(sink.where)}</b></p>
      <dl class="stats">${li('PENUM PM',R.pm+' โครงการ')}${li('รูปภาพ',R.ph+' รูป')}${li('PENUM MEP',R.mep.length+' โครงการ')}${li('PENUM BIM',R.bim.length+' โครงการ')}${R.raw?li('ไฟล์บนคลาวด์',R.raw+' ไฟล์'):''}</dl>
      ${R.team?`<p class="sp-n sp-w">โครงการ PENUM MEP / BIM: ${esc(R.team)}</p>`:''}${R.phNo?`<p class="hint">${R.phNo} รูปไม่มีข้อมูลบนคลาวด์ (ยังไม่ได้ส่งขึ้นจากเครื่องที่ถ่าย)</p>`:''}
      <p class="hint">${w==='zip'?'แตกไฟล์ zip ในโฟลเดอร์ ดาวน์โหลด แล้ว':''}เปิดไฟล์ <b>อ่านก่อน.html</b> ในโฟลเดอร์นั้นเพื่อดูรายการโครงการและรูปภาพ · เปิดข้อมูล PM กลับได้ที่ เมนู › เปิดไฟล์สำรอง</p>`,'');
    render()}
  catch(e){alert('สำรองไม่สำเร็จ\n'+(e.message||e)+'\n\nข้อมูลบนคลาวด์ยังอยู่ครบ ลองใหม่อีกครั้ง');d.querySelectorAll('.ft .btn').forEach(x=>x.disabled=false);if(run)run.hidden=true}
  finally{CB.busy=0}};
// ตั้งค่า › ที่เก็บข้อมูล: the button and when it last ran, on the cloud card and the folder card
{const f=spCard;spCard=function(){const h=f.apply(this,arguments),l=cbLast();if(DEMOPG||!/data-a="fSync"/.test(h))return h;
  return h.replace(/(<button type="button" class="btn pri" data-a="fSync">[^<]*<\/button>)/,`$1<button type="button" class="btn" data-a="cbStart" title="${l?'สำรองล่าสุด '+esc(new Date(l.at).toLocaleString('th-TH')):'ยังไม่เคยสำรอง'}">สำรองคลาวด์ลงเครื่อง</button>`)}}
// เมนู (the header's menu): next to สำรองข้อมูล; hidden where สำรองข้อมูล is (a staff member signed in)
{const r=render;render=function(){const x=r.apply(this,arguments);try{const m=$('#moreMenu [data-a="backup"]');let c=$('#moreMenu [data-a="cbStart"]');
  if(m&&!c&&!DEMOPG){m.insertAdjacentHTML('afterend','<button type="button" data-a="cbStart">สำรองคลาวด์ลงเครื่อง</button>');c=$('#moreMenu [data-a="cbStart"]')}if(c)c.hidden=!cbMay()||!!(m&&m.hidden)}catch(e){}return x}}
if(typeof SBKW==='object')SBKW['co.coset']=(SBKW['co.coset']||'')+' สำรองคลาวด์ลงเครื่อง ดาวน์โหลดคลาวด์ สำรองข้อมูล backup ดูไฟล์ออฟไลน์ zip';
if(typeof I18N==='object'&&I18N.en&&I18N.en.x)Object.assign(I18N.en.x,{'สำรองคลาวด์ลงเครื่อง':'Back up the cloud to this computer','สำรองคลาวด์ลงเครื่องเสร็จแล้ว':'Cloud backup done',
  'ดาวน์โหลดเป็นไฟล์ zip':'Download as a zip file','เลือกโฟลเดอร์แล้วเริ่มสำรอง…':'Pick a folder and back up…','เลือกโฟลเดอร์อื่น…':'Pick another folder…'});
