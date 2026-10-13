/* ---------- 3.82 หน้างาน: one big-button page for site technicians and foremen ----------
   A staff member set to ช่างหน้างาน or โฟร์แมน (ทะเบียนพนักงาน › column หน้างาน) sees only this page after signing in
   (invite link + PIN or scan): check in/out with GPS and a photo (hours go into ลงเวลาทำงาน), a short daily report,
   material requests (foreman approves › store issues from site stock or opens a PR), problem photos (punch list),
   the daily safety check and leave. The office sees ใครเข้างานวันนี้ above รายงานประจำวัน, requests in คลังวัสดุหน้างาน,
   and sets the site position in ข้อมูลโครงการ. New project data: P.att, P.mreq, P.info.geo (created on first write). */
const FROLE=[['','– เมนูเต็ม –'],['tech','ช่างหน้างาน'],['lead','โฟร์แมน / หัวหน้าหน้างาน']];
const fdRole=u=>(FROLE.find(x=>x[0]===(u&&u.field||''))||FROLE[0])[1];
// the person using the field page: the signed-in staff member, or the one an admin is previewing
function fu(){const u=me();if(u)return u.field?u:null;return S.fprev&&CO().staff.find(s=>s.id===S.fprev&&s.field)||null}
const fdAuth=()=>!(typeof pinOn==='function'&&pinOn()&&!authOK());
const fdLead=u=>!!u&&u.field==='lead';
const fdMode=()=>{const u=fu();return !!u&&fdAuth()&&!(S.fld==='full'&&(fdLead(u)||!me()))};
const mrBoss=()=>{const u=me();return !u||u.field==='lead'||u.dept==='MGT'||(u.dept==='PRJ'&&isHead(u))};
const hm=()=>{const d=new Date();return pad(d.getHours(),2)+':'+pad(d.getMinutes(),2)};
const hmMin=s=>{const [h,m]=String(s||'').split(':').map(Number);return (h||0)*60+(m||0)};
const fdName=u=>String(u&&u.name||'').trim().split(/\s+/)[0]||'';

/* ---------- position ---------- */
function fdDist(a,b){const R=6371e3,t=x=>x*Math.PI/180,dLa=t(b.lat-a.lat),dLo=t(b.lng-a.lng),h=Math.sin(dLa/2)**2+Math.cos(t(a.lat))*Math.cos(t(b.lat))*Math.sin(dLo/2)**2;return Math.round(2*R*Math.asin(Math.min(1,Math.sqrt(h))))}
const siteGeo=p=>{const g=(p||P).info.geo;return g&&g.lat!==''&&g.lng!==''&&g.lat!=null&&isFinite(+g.lat)&&isFinite(+g.lng)&&(+g.lat||+g.lng)?{lat:+g.lat,lng:+g.lng,r:n(g.r)||300}:null};
const fdKm=m=>m>=1000?fmt(m/1000,1)+' กม.':fmt(m)+' ม.';
function fdGeo(){return new Promise(ok=>{if(!navigator.geolocation)return ok(null);let done=0;const end=v=>{if(done)return;done=1;clearTimeout(t);ok(v)},t=setTimeout(()=>end(null),20000);
  try{navigator.geolocation.getCurrentPosition(p=>end({lat:+p.coords.latitude.toFixed(6),lng:+p.coords.longitude.toFixed(6),acc:Math.round(p.coords.accuracy||0)}),()=>end(null),{enableHighAccuracy:true,timeout:15000,maximumAge:0})}catch(e){end(null)}})}
function fdTag(g){if(!g)return null;const s=siteGeo(),o={lat:g.lat,lng:g.lng,acc:g.acc};if(s){o.d=fdDist(g,s);o.far=o.d>s.r?1:0}return o}
function geoPill(g){if(!g)return '<span class="pill warn">ไม่มี GPS</span>';if(g.d==null)return '<span class="pill">มีพิกัด</span>';return g.far?`<span class="pill bad">ห่างไซต์ ${fdKm(g.d)}</span>`:`<span class="pill ok">ในไซต์ ${fdKm(g.d)}</span>`}
function geoMsg(g,what,t){if(!g)return `${what}แล้ว ${t} · ไม่ได้ตำแหน่ง GPS (เปิด GPS และอนุญาตให้ใช้ตำแหน่ง)`;if(g.d==null)return `${what}แล้ว ${t}`;
  return g.far?`${what}แล้ว ${t} · แต่อยู่ห่างไซต์ ${fdKm(g.d)} (เกิน ${fmt(siteGeo().r)} ม.) หัวหน้าจะเห็นรายการนี้`:`${what}แล้ว ${t} · ห่างไซต์ ${fdKm(g.d)}`}

/* ---------- check in / out ---------- */
const attOf=(u,d=today())=>(P.att||[]).find(x=>x.staff===u.id&&x.date===d);
function fdHours(a){let h=(hmMin(a.out)-hmMin(a.in))/60;if(h<=0)return 0;if(h>=6)h-=1;return Math.round(h*2)/2}// 1 h lunch on a day of 6 h or more
function fdTs(a){const C=CO();let t=C.ts.find(x=>x.staff===a.staff&&x.date===a.date);if(!t){t={id:uid(),date:a.date,staff:a.staff,proj:P.id,h:0};C.ts.push(t)}t.proj=P.id;t.h=a.h;t.src='att'}
// camera picker: front camera for check-in, back camera for problem photos
function fdSnap(face,cb){const f=$('#fileIn');f.accept='image/*';f.multiple=false;f.setAttribute('capture',face);
  const h=async()=>{f.oncancel=null;f.removeAttribute('capture');const file=f.files[0];f.value='';if(!file)return cb(null);let key=null;try{const d=await shrink(file,1000,.72);key='ph-'+uid();await IDB.put(key,d);phCache[key]=d}catch(e){key=null}cb(key)};
  f.onchange=h;f.oncancel=()=>{f.oncancel=null;f.removeAttribute('capture');if(f.onchange===h)cb(null,true)};f.click()}
ACT.fIn=()=>{const u=fu();if(!u)return;if(attOf(u)){toast('เช็กชื่อเข้างานวันนี้แล้ว');return}const g=fdGeo();
  fdSnap('user',async(key,cancel)=>{if(!key){toast(cancel?'ยังไม่ได้เช็กชื่อ ต้องถ่ายรูปตัวเองที่หน้างานก่อน':'ถ่ายรูปไม่สำเร็จ ลองใหม่อีกครั้ง');return}
    const geo=fdTag(await g),t=hm();if(attOf(u))return;if(!P.att)P.att=[];
    P.att.push({id:uid(),date:today(),staff:u.id,in:t,out:'',inGeo:geo,outGeo:null,photos:[key],h:0});save();render();toast(geoMsg(geo,'เช็กชื่อเข้างาน',t))})};
ACT.fOut=async b=>{const u=fu(),a=u&&attOf(u);if(!a||a.out)return;if(!confirm('เช็กชื่อออกงานตอนนี้?'))return;b.disabled=true;b.textContent='กำลังอ่านตำแหน่ง…';
  const geo=fdTag(await fdGeo()),t=hm();a.out=t;a.outGeo=geo;a.h=fdHours(a);fdTs(a);save();render();toast(geoMsg(geo,'เช็กชื่อออกงาน',t)+` · ลงเวลา ${fmtq(a.h)} ชม.`)};

/* ---------- page ---------- */
const fdB=(a,k,ic,t,s,cls)=>`<button type="button" class="fdb${cls?' '+cls:''}" data-a="${a}"${k?` data-k="${k}"`:''}><span class="fdi" aria-hidden="true">${ic}</span><b>${t}</b><small>${s}</small></button>`;
function fdTop(u){const pjs=projects().filter(p=>!p.closed),fixed=u.proj&&DB.projects[u.proj];
  return `${S.fprev&&!me()?`<div class="fdprev"><span>ตัวอย่างหน้าจอของ <b>${esc(u.name)}</b> (${esc(fdRole(u))})</span><button type="button" class="btn sm" data-a="fPrevOff">ปิดตัวอย่าง</button></div>`:''}
  <div class="fdtop"><div><small>${esc(CO().name||'')}</small><b>สวัสดีคุณ ${esc(fdName(u))}</b><small>${esc(fdRole(u))} · ${new Date().toLocaleDateString('th-TH',{weekday:'long',day:'numeric',month:'long'})}</small></div>
  ${typeof pinOn==='function'&&pinOn()&&me()?'<button type="button" class="btn sm" data-a="pinOut">ออกจากระบบ</button>':''}</div>
  <div class="fdpj"><span aria-hidden="true">📍</span>${fixed?`<b>${esc(P.name)}</b>`:`<select data-fd="pj" aria-label="โครงการ">${pjs.map(p=>`<option value="${p.id}"${p.id===P.id?' selected':''}>${esc(p.name)}</option>`).join('')}</select>`}</div>`}
function fdCheck(u){const a=attOf(u),s=siteGeo(),wk=addD(today(),-6),hrs=sum(Object.values(DB.projects).flatMap(p=>(p.att||[]).filter(x=>x.staff===u.id&&x.date>=wk)),x=>x.h);
  const body=!a?`<button type="button" class="fdin" data-a="fIn"><span aria-hidden="true">📸</span><b>เช็กชื่อเข้างาน</b><small>ถ่ายรูปตัวเองที่หน้างาน ระบบอ่านตำแหน่ง GPS ให้</small></button>`
    :!a.out?`<div class="fdst1"><img data-ph="${a.photos[0]||''}" alt="รูปตอนเข้างาน"><div><b>เข้างาน ${esc(a.in)}</b> ${geoPill(a.inGeo)}<small>ทำงานมาแล้ว ${fmtq(Math.max(0,Math.round((hmMin(hm())-hmMin(a.in))/30)/2))} ชม.</small></div></div><button type="button" class="fdout" data-a="fOut"><b>เช็กชื่อออกงาน</b></button>`
    :`<div class="fdst1"><img data-ph="${a.photos[0]||''}" alt="รูปตอนเข้างาน"><div><b>เข้า ${esc(a.in)} · ออก ${esc(a.out)}</b> ${geoPill(a.outGeo||a.inGeo)}<small>วันนี้ ${fmtq(a.h)} ชม. ลงเวลาทำงานให้แล้ว</small></div></div>`;
  return `<section class="card fdc">${body}<p class="fdsm">${s?`ต้องอยู่ในรัศมี ${fmt(s.r)} ม. จากไซต์`:'สำนักงานยังไม่ได้บันทึกตำแหน่งไซต์ ระบบจึงยังไม่ตรวจระยะ'} · 7 วันล่าสุด ${fmtq(hrs)} ชม.</p></section>`}
function fdHome(u){const P1=P.mreq||[],mine=P1.filter(r=>r.by===u.id&&['req','ok'].includes(r.status)).length,wait=P1.filter(r=>r.status==='req').length,lv=(CO().leave||[]).filter(l=>l.staff===u.id&&l.status==='pend').length;
  const td=today(),here=(P.att||[]).filter(a=>a.date===td).length,team=fdTeam().length,dl=P.daily.find(d=>d.date===td),sf=(P.safe||[]).find(r=>r.date===td);
  return fdCheck(u)+`<div class="fdg">${fdB('fGo','daily','📝','รายงานประจำวัน',dl?`วันนี้มีแล้ว · ${sum(dl.men||[],m=>m.n)} คน`:'คน งานที่ทำ รูปถ่าย')+fdB('fGo','mreq','📦','ขอเบิกของ',mine?`รอดำเนินการ ${mine} ใบ`:'เลือกจากคลังหรือ BOQ')
    +fdB('fGo','issue','📷','ถ่ายรูปแจ้งปัญหา','จุดที่ต้องแก้ไข')+fdB('fGo','safe','🦺','ตรวจความปลอดภัย',sf?'วันนี้ตรวจแล้ว':'เช็กลิสต์ 8 ข้อ')+fdB('fGo','leave','🗓','ยื่นใบลา',lv?`รออนุมัติ ${lv} ใบ`:'ป่วย กิจ พักร้อน')
    +(fdLead(u)||(!me()&&S.fprev)?fdB('fGo','appr','✅','อนุมัติขอเบิก',wait?`รอคุณ ${wait} ใบ`:'ไม่มีรายการรอ',wait?'hot':'')+fdB('fGo','who','👷','ใครเข้างานวันนี้',`มาแล้ว ${here} / ${team} คน`)+fdB('fFull','','🖥','เปิดโปรแกรมเต็ม','เมนูทั้งหมดของ PENUM PM'):'')}</div>
  ${typeof mobileMode==='function'&&mobileMode()?`<section class="card">${mobSync()}</section>`:''}`}
const FDT={daily:'รายงานประจำวัน',mreq:'ขอเบิกของ',issue:'ถ่ายรูปแจ้งปัญหา',safe:'ตรวจความปลอดภัย',leave:'ยื่นใบลา',appr:'อนุมัติขอเบิก',who:'ใครเข้างานวันนี้'};
CVIEWS.field=()=>{const u=fu();if(!u)return '<section class="card"><p class="hint">หน้านี้สำหรับพนักงานที่ตั้งเป็นช่างหน้างานหรือโฟร์แมน</p></section>';
  const V={daily:fdDaily,mreq:fdMreq,issue:fdIssue,safe:fdSafe,leave:fdLeave,appr:fdAppr,who:fdWho}[S.fld];
  return `<div class="fd">${fdTop(u)}${V?`<div class="fdbar"><button type="button" class="btn" data-a="fHome">‹ กลับ</button><b>${FDT[S.fld]}</b></div>${V(u)}`:fdHome(u)}</div>`};
ACT.fHome=()=>{S.fld='';S.sel.fdIss='';render();scrollTo({top:0})};
ACT.fGo=b=>{const u=fu(),k=b.dataset.k;if(!u)return;S.fld=k;
  if(k==='daily'&&!P.daily.some(d=>d.date===today())){P.daily.push(Object.assign({id:uid()},NEW.daily(P.daily),{by:u.name||''}));save()}
  if(k==='safe'){if(!P.safe)P.safe=[];if(!P.safe.some(r=>r.date===today()&&r.byId===u.id)){P.safe.push(Object.assign({id:uid()},NEW.safe(),{by:u.name||'',byId:u.id}));save()}}
  render();scrollTo({top:0})};
ACT.fFull=()=>{S.fld='full';S.mode='pj';S.tab='site';S.sub.site='daily';render();scrollTo({top:0})};
ACT.fPrev=b=>{S.fprev=b.dataset.id;S.fld='';render();scrollTo({top:0})};
ACT.fPrevOff=()=>{S.fprev='';S.fld='';S.mode='pj';S.tab='site';render();scrollTo({top:0})};
ACT.fStep=b=>{const o=resolve(b.dataset.c);if(!o)return;o[b.dataset.k]=Math.max(0,n(o[b.dataset.k])+n(b.dataset.d));save();render()};
const fdStep=(c,k,v,lbl)=>`<span class="fdsp"><button type="button" data-a="fStep" data-c="${c}" data-k="${k}" data-d="-1" aria-label="ลด">−</button><input class="r" inputmode="decimal" data-t="num" data-p="${c}.${k}" value="${fmtq(v)}" aria-label="${esc(lbl)}"><button type="button" data-a="fStep" data-c="${c}" data-k="${k}" data-d="1" aria-label="เพิ่ม">+</button></span>`;

/* ---------- daily report (short form on today's report) ---------- */
function fdDaily(u){const d=P.daily.find(x=>x.date===today());if(!d)return '';const b=`daily.${d.id}`;
  const ws=k=>`<select data-p="${b}.${k}">${WEA.map(([v,l])=>`<option value="${v}"${v===d[k]?' selected':''}>${l}</option>`).join('')}</select>`;
  return `<section class="card fdf"><h2><span>${thDL(d.date)}</span><small>ผู้รายงาน ${esc(d.by||u.name||'')}</small></h2>
  <div class="fd2"><label>อากาศเช้า${ws('wam')}</label><label>อากาศบ่าย${ws('wpm')}</label></div>
  <h3>คนงานวันนี้ <small class="muted">รวม ${fmtq(sum(d.men||[],m=>m.n))} คน</small></h3>
  <div class="fdl">${(d.men||[]).map(m=>`<div class="fdrow"><span class="fdtx">${esc(m.trade||'–')}</span>${fdStep(`${b}.men.${m.id}`,'n',m.n,m.trade)}</div>`).join('')}</div>
  <label class="fdt">งานที่ทำวันนี้<textarea data-p="${b}.work" rows="4" placeholder="เช่น ติดตั้งท่อลมชั้น 2 โซน B">${esc(d.work||'')}</textarea></label>
  <label class="fdt">ปัญหา / อุปสรรค<textarea data-p="${b}.issue" rows="2">${esc(d.issue||'')}</textarea></label>
  <h3>รูปถ่ายหน้างาน</h3>${photoBlock(b,d)}<p class="fdsm">บันทึกให้ทุกครั้งที่แก้ ไม่ต้องกดส่ง</p></section>`}

/* ---------- material requests ---------- */
const MRST={draft:['ร่าง',''],req:['รอหัวหน้าอนุมัติ','warn'],ok:['อนุมัติ รอจ่ายของ',''],no:['ไม่อนุมัติ','bad'],done:['จ่ายของแล้ว','ok'],pr:['เปิดใบขอซื้อแล้ว','']};
const mrPill=r=>{const s=MRST[r.status]||MRST.draft;return `<span class="pill ${s[1]}">${s[0]}${r.status==='pr'&&r.pr?' '+esc(r.pr):''}</span>`};
const mrKey=i=>i.k||skKey(i.desc,i.unit);
function mrBal(){const M={};stockCard().forEach(r=>M[r.k]=r.inq-r.out);return M}
function mrCard(r,acts){const B=mrBal();
  return `<div class="mr"><div class="mrh"><b>${esc(r.no||'ร่าง')}</b>${mrPill(r)}<small>${thD(r.date)} · ${esc(staffName(r.by)||'')}${r.where?' · ใช้ที่ '+esc(r.where):''}</small></div>
  <ul>${(r.items||[]).map(i=>{const bal=B[mrKey(i)];return `<li><span>${esc(i.desc)}</span><b>${fmtq(i.q)} ${esc(i.unit||'')}</b>${n(i.iss)?` <small class="muted">จ่ายแล้ว ${fmtq(i.iss)}</small>`:''}${['req','ok'].includes(r.status)?` <small class="${bal>=n(i.q)-n(i.iss)?'muted':'bad-t'}">คงคลัง ${fmtq(bal||0)}</small>`:''}</li>`}).join('')}</ul>
  ${r.note?`<p class="fdsm">${esc(r.note)}</p>`:''}${r.apBy?`<p class="fdsm">${r.status==='no'?'ไม่อนุมัติ':'อนุมัติ'}โดย ${esc(r.apBy)} ${thD(r.apAt)}</p>`:''}${acts||''}</div>`}
function mrOpts(){const C=stockCard().filter(r=>r.inq-r.out>0),B=P.boq.items.filter(i=>String(i.unit||'').trim()&&n(i.q)>0&&itemName(i).trim());
  return `<option value="">– เลือกของที่ต้องการ –</option>${C.length?`<optgroup label="มีในคลังหน้างาน">${C.map(r=>`<option value="s:${esc(r.k)}">${esc(r.desc)} (${esc(r.unit)}) · คงเหลือ ${fmtq(r.inq-r.out)}</option>`).join('')}</optgroup>`:''}
  ${B.length?`<optgroup label="ตาม BOQ ของโครงการ">${B.map(i=>`<option value="b:${i.id}">${esc(itemName(i).slice(0,90))} (${esc(i.unit)})</option>`).join('')}</optgroup>`:''}<option value="__">อื่นๆ พิมพ์ชื่อเอง</option>`}
function fdMreq(u){const L=(P.mreq||[]).filter(r=>r.by===u.id&&r.status!=='draft').slice().reverse().slice(0,12),dr=(P.mreq||[]).find(r=>r.by===u.id&&r.status==='draft');
  const form=dr?`<section class="card fdf"><h2><span>ใบขอเบิกใหม่</span></h2>
    <div class="fdpick"><select data-fd="pick" aria-label="เลือกของ">${mrOpts()}</select><button type="button" class="btn pri" data-a="fMrAdd">+ เพิ่ม</button></div>
    <div class="fdl">${dr.items.length?dr.items.map(i=>{const c=`mreq.${dr.id}.items.${i.id}`;return `<div class="fdrow">${i.free?`<span class="fdfree"><input data-p="${c}.desc" value="${esc(i.desc)}" placeholder="ชื่อของ"><input data-p="${c}.unit" value="${esc(i.unit)}" placeholder="หน่วย"></span>`:`<span class="fdtx">${esc(i.desc)} <small class="muted">${esc(i.unit)}</small></span>`}${fdStep(c,'q',i.q,'จำนวน')}<button type="button" class="x" data-a="delRow" data-c="mreq.${dr.id}.items" data-id="${i.id}" aria-label="ลบ">✕</button></div>`}).join(''):'<p class="fdsm">ยังไม่มีรายการ เลือกของด้านบนแล้วกด + เพิ่ม</p>'}</div>
    <div class="fd2"><label>ใช้ที่ / งาน<input data-p="mreq.${dr.id}.where" value="${esc(dr.where||'')}" placeholder="เช่น ชั้น 2 โซน B"></label><label>หมายเหตุ<input data-p="mreq.${dr.id}.note" value="${esc(dr.note||'')}"></label></div>
    <div class="row" style="margin-top:12px"><button type="button" class="btn pri fdgo" data-a="fMrSend">ส่งขอเบิก</button><button type="button" class="btn del" data-a="fMrDrop">ยกเลิก</button></div></section>`
    :`<button type="button" class="fdin sm" data-a="fMrNew"><span aria-hidden="true">📦</span><b>ขอเบิกของใหม่</b><small>${fdLead(u)?'หัวหน้าขอเอง อนุมัติให้อัตโนมัติ':'หัวหน้าหน้างานอนุมัติ แล้วสโตร์จ่ายของหรือสั่งซื้อ'}</small></button>`;
  return form+`<section class="card"><h2><span>ใบขอเบิกของฉัน</span></h2>${L.length?L.map(r=>mrCard(r)).join(''):'<p class="fdsm">ยังไม่มีใบขอเบิก</p>'}</section>`}
ACT.fMrNew=()=>{const u=fu();if(!u)return;if(!P.mreq)P.mreq=[];P.mreq.push({id:uid(),no:'',date:today(),by:u.id,where:'',note:'',items:[],status:'draft'});save();render()};
ACT.fMrDrop=()=>{const u=fu(),i=(P.mreq||[]).findIndex(r=>r.by===u.id&&r.status==='draft');if(i<0||!confirm('ยกเลิกใบขอเบิกนี้?'))return;P.mreq.splice(i,1);save();render()};
ACT.fMrAdd=()=>{const u=fu(),dr=(P.mreq||[]).find(r=>r.by===u.id&&r.status==='draft'),v=(S.fdf||{}).pick||'';if(!dr)return;if(!v){toast('เลือกของก่อน');return}let it=null;
  if(v==='__')it={desc:'',unit:'',q:1,free:1};
  else if(v.startsWith('s:')){const r=stockCard().find(x=>x.k===v.slice(2));if(r)it={desc:r.desc,unit:r.unit,q:1,k:r.k}}
  else if(v.startsWith('b:')){const i=P.boq.items.find(x=>x.id===v.slice(2));if(i)it={desc:itemName(i),unit:i.unit||'',q:1,bid:i.id,g:i.g||'',bud:n(i.m)}}
  if(!it)return;const same=!it.free&&dr.items.find(x=>x.desc===it.desc&&x.unit===it.unit);if(same)same.q=n(same.q)+1;else dr.items.push(Object.assign({id:uid()},it));S.fdf.pick='';save();render()};
ACT.fMrSend=()=>{const u=fu(),dr=(P.mreq||[]).find(r=>r.by===u.id&&r.status==='draft');if(!dr)return;const its=dr.items.filter(i=>n(i.q)>0&&String(i.desc||'').trim());
  if(!its.length){toast('ใส่ของและจำนวนอย่างน้อย 1 รายการ');return}dr.items=its;dr.no=nextNo('MR-',P.mreq);dr.date=today();
  if(fdLead(u)){dr.status='ok';dr.apBy=u.name||'';dr.apAt=today()}else dr.status='req';save();render();toast(`ส่งใบขอเบิก ${dr.no} แล้ว${dr.status==='req'?' รอหัวหน้าอนุมัติ':' รอสโตร์จ่ายของ'}`)};
ACT.fMrAp=b=>{const r=(P.mreq||[]).find(x=>x.id===b.dataset.id);if(!r||r.status!=='req')return;r.status=b.dataset.ok?'ok':'no';r.apBy=(me()||{}).name||'ผู้ดูแลระบบ';r.apAt=today();save();render();toast(b.dataset.ok?`อนุมัติ ${r.no} แล้ว`:`ไม่อนุมัติ ${r.no}`)};
// store: issue what the site stock has; the rest can go to a PR
ACT.fMrIssue=b=>{const r=(P.mreq||[]).find(x=>x.id===b.dataset.id);if(!r||r.status!=='ok')return;const B=mrBal();let k=0,short=0;if(!P.stock)P.stock=[];
  r.items.forEach(i=>{const rem=n(i.q)-n(i.iss);if(rem<=0)return;const key=mrKey(i),give=Math.min(rem,Math.max(0,B[key]||0));if(give>0){P.stock.push({id:uid(),date:today(),item:key,q:give,where:r.where||'',by:r.by,note:r.no});i.iss=n(i.iss)+give;B[key]-=give;k++}if(n(i.q)-n(i.iss)>0)short++});
  if(!short){r.status='done';r.doneAt=today()}save();render();toast(k?`จ่ายของ ${k} รายการ ตัดสต็อกแล้ว${short?` · ของไม่พอ ${short} รายการ กด เปิดใบขอซื้อ`:''}`:'ไม่มีของในคลังพอจ่าย กด เปิดใบขอซื้อ')};
ACT.fMrPR=b=>{const r=(P.mreq||[]).find(x=>x.id===b.dataset.id);if(!r||r.status!=='ok')return;const its=r.items.filter(i=>n(i.q)-n(i.iss)>0);if(!its.length)return;
  const pr=Object.assign({id:uid()},NEW.prs(P.prs));pr.need=addD(today(),3);pr.note=`จากใบขอเบิก ${r.no}${r.where?' ใช้ที่ '+r.where:''}`;
  pr.items=its.map(i=>({id:uid(),bid:i.bid||'',g:i.g||'',desc:i.desc,unit:i.unit,q:n(i.q)-n(i.iss),bud:n(i.bud)}));P.prs.push(pr);r.status='pr';r.pr=pr.no;save();render();toast(`เปิดใบขอซื้อ ${pr.no} แล้ว ดูได้ที่ จัดซื้อ › ใบขอซื้อและเทียบราคา`)};
const mrApBtns=r=>`<div class="row"><button type="button" class="btn pri" data-a="fMrAp" data-id="${r.id}" data-ok="1">อนุมัติ</button><button type="button" class="btn del" data-a="fMrAp" data-id="${r.id}" data-ok="">ไม่อนุมัติ</button></div>`;
function fdAppr(){const L=(P.mreq||[]).filter(r=>r.status==='req'),R=(P.mreq||[]).filter(r=>!['req','draft'].includes(r.status)).slice(-6).reverse();
  return `<section class="card"><h2><span>รอคุณอนุมัติ</span><small>${L.length} ใบ</small></h2>${L.length?L.map(r=>mrCard(r,mrApBtns(r))).join(''):'<p class="fdsm">ไม่มีใบขอเบิกรออนุมัติ</p>'}</section>
  ${R.length?`<section class="card"><h2><span>ล่าสุด</span></h2>${R.map(r=>mrCard(r)).join('')}</section>`:''}`}
// office side: requests at the top of คลังวัสดุหน้างาน
function mrOffice(){const L=(P.mreq||[]).filter(r=>['req','ok'].includes(r.status));if(!L.length&&!(P.mreq||[]).some(r=>r.status!=='draft'))return '';
  const R=(P.mreq||[]).filter(r=>['done','pr','no'].includes(r.status)).slice(-3).reverse();
  return `<section class="card" id="mrOff"><h2><span>ใบขอเบิกจากหน้างาน</span><small>ช่างขอผ่านหน้าจอหน้างาน › หัวหน้าอนุมัติ › จ่ายของ (ตัดสต็อกให้เอง) หรือเปิดใบขอซื้อส่วนที่ขาด</small></h2>
  <div class="mrs">${L.length?L.map(r=>mrCard(r,r.status==='req'?(mrBoss()?mrApBtns(r):''):`<div class="row"><button type="button" class="btn pri" data-a="fMrIssue" data-id="${r.id}">จ่ายของจากคลัง</button><button type="button" class="btn" data-a="fMrPR" data-id="${r.id}">เปิดใบขอซื้อ${r.items.some(i=>n(i.iss))?'ส่วนที่ขาด':''}</button></div>`)).join(''):'<p class="hint">ไม่มีใบขอเบิกค้าง</p>'}</div>
  ${R.length?`<details class="mrold"><summary>ล่าสุด ${R.length} ใบ</summary><div class="mrs">${R.map(r=>mrCard(r)).join('')}</div></details>`:''}</section>`}
{const f=buyStock;buyStock=function(){return mrOffice()+f()}}

/* ---------- problem photos (punch list) ---------- */
function fdIssue(u){const L=(P.punch||[]).filter(r=>r.byId===u.id).slice().reverse().slice(0,10),sel=(P.punch||[]).find(r=>r.id===S.sel.fdIss&&r.byId===u.id);
  if(sel){const b=`punch.${sel.id}`;return `<section class="card fdf"><h2><span>${esc(sel.no)}</span><small>${thD(sel.found)}</small></h2>${photoBlock(b,sel)}
    <label class="fdt">ปัญหาที่พบ<textarea data-p="${b}.item" rows="3" placeholder="เช่น ท่อน้ำทิ้งรั่วที่ FCU ห้อง 205">${esc(sel.item||'')}</textarea></label>
    <label class="fdt">ตำแหน่ง / ชั้น / ห้อง<input data-p="${b}.loc" value="${esc(sel.loc||'')}"></label>
    <div class="row" style="margin-top:12px"><button type="button" class="btn pri fdgo" data-a="fIssDone">เสร็จ</button></div><p class="fdsm">ส่งเข้า Punch list ของโครงการให้แล้ว ทีมสำนักงานเห็นทันที</p></section>`}
  const PS={open:['รอแก้','warn'],fix:['แก้แล้ว รอตรวจ',''],done:['ปิดแล้ว','ok']};
  return `<button type="button" class="fdin sm" data-a="fIssNew"><span aria-hidden="true">📷</span><b>ถ่ายรูปแจ้งปัญหาใหม่</b><small>ถ่ายรูป แล้วพิมพ์สั้นๆ ว่าเป็นอะไร อยู่ตรงไหน</small></button>
  <section class="card"><h2><span>ที่ฉันแจ้งไว้</span></h2>${L.length?`<div class="fdl">${L.map(r=>`<button type="button" class="fdrow fdlink" data-a="sel" data-k="fdIss" data-id="${r.id}">${(r.photos||[])[0]?`<img data-ph="${r.photos[0]}" alt="">`:'<span class="fdnoimg">📷</span>'}<span class="fdtx"><b>${esc(r.item||'(ยังไม่ได้พิมพ์)')}</b><small class="muted">${esc(r.no)} · ${thD(r.found)}${r.loc?' · '+esc(r.loc):''}</small></span><span class="pill ${(PS[r.status]||PS.open)[1]}">${(PS[r.status]||PS.open)[0]}</span></button>`).join('')}</div>`:'<p class="fdsm">ยังไม่มีรายการ</p>'}</section>`}
ACT.fIssNew=()=>{const u=fu();if(!u)return;const r=Object.assign({id:uid()},NEW.punch(P.punch),{who:'',byId:u.id,by:u.name||'',src:'field'});P.punch.push(r);S.sel.fdIss=r.id;save();render();
  fdSnap('environment',key=>{if(!key)return;(r.photos=r.photos||[]).push(key);save();render()})};
ACT.fIssDone=()=>{const r=(P.punch||[]).find(x=>x.id===S.sel.fdIss);if(r&&!String(r.item||'').trim()&&!(r.photos||[]).length){P.punch.splice(P.punch.indexOf(r),1);save()}S.sel.fdIss='';render();scrollTo({top:0})};

/* ---------- safety check ---------- */
function fdSafe(u){const r=(P.safe||[]).find(x=>x.date===today()&&x.byId===u.id);if(!r)return '';const b=`safe.${r.id}`,v=SCHK.map((_,i)=>r.chk[i]).filter(x=>x==='ok'||x==='ng'),sc=v.length?Math.round(v.filter(x=>x==='ok').length*100/v.length):null;
  return `<section class="card fdf"><h2><span>${thDL(r.date)}</span>${sc==null?'':`<span class="pill ${sc>=90?'ok':sc>=75?'warn':'bad'}">${sc}%</span>`}</h2>
  <label class="fdt">พื้นที่ที่ตรวจ<input data-p="${b}.area" value="${esc(r.area||'')}" placeholder="เช่น ชั้น 2 ทั้งชั้น"></label>
  <div class="fdl">${SCHK.map((c,i)=>`<div class="fdck"><span>${i+1}. ${esc(c)}</span><span class="fdtg" role="group" aria-label="${esc(c)}">${[['ok','✓ ผ่าน'],['ng','✗ ไม่ผ่าน'],['na','– ไม่เกี่ยว']].map(([k,l])=>`<button type="button" class="t-${k}" data-a="fSk" data-id="${r.id}" data-i="${i}" data-v="${k}" aria-pressed="${r.chk[i]===k}">${l}</button>`).join('')}</span></div>`).join('')}</div>
  <label class="fdt">ข้อสังเกต<textarea data-p="${b}.note" rows="2">${esc(r.note||'')}</textarea></label><h3>รูปถ่าย</h3>${photoBlock(b,r)}<p class="fdsm">บันทึกให้ทุกครั้งที่กด ทีมความปลอดภัยเห็นในหน้า ตรวจความปลอดภัย</p></section>`}
ACT.fSk=b=>{const r=(P.safe||[]).find(x=>x.id===b.dataset.id);if(!r)return;r.chk=r.chk||{};r.chk[b.dataset.i]=r.chk[b.dataset.i]===b.dataset.v?'':b.dataset.v;save();render()};

/* ---------- leave ---------- */
function fdLeave(u){const f=S.fdf||{},L=(CO().leave||[]).filter(l=>l.staff===u.id).slice().sort((a,b)=>String(b.from).localeCompare(String(a.from))).slice(0,8),LS={pend:['รออนุมัติ','warn'],ok:['อนุมัติ','ok'],no:['ไม่อนุมัติ','bad']};
  return `<section class="card fdf"><h2><span>ใบลาใหม่</span></h2>
  <label class="fdt">ประเภท<select data-fd="lvType">${LTYPE.map(([k,l])=>`<option value="${k}"${(f.lvType||'sick')===k?' selected':''}>${l}</option>`).join('')}</select></label>
  <div class="fd2"><label>ตั้งแต่<input type="date" data-fd="lvFrom" value="${esc(f.lvFrom||today())}"></label><label>ถึง<input type="date" data-fd="lvTo" value="${esc(f.lvTo||f.lvFrom||today())}"></label></div>
  <label class="fdchk"><input type="checkbox" data-fd="lvHalf"${f.lvHalf?' checked':''}> ลาครึ่งวัน</label>
  <label class="fdt">เหตุผล<input data-fd="lvWhy" value="${esc(f.lvWhy||'')}" placeholder="เช่น ไม่สบาย ไปหาหมอ"></label>
  <div class="row" style="margin-top:12px"><button type="button" class="btn pri fdgo" data-a="fLvSend">ยื่นใบลา</button></div></section>
  <section class="card"><h2><span>ใบลาของฉัน</span></h2>${L.length?`<div class="fdl">${L.map(l=>`<div class="fdrow"><span class="fdtx"><b>${esc((LTYPE.find(x=>x[0]===l.type)||['',''])[1])}</b> <small class="muted">${thD(l.from)}${l.to&&l.to!==l.from?' – '+thD(l.to):''}${l.half?' (ครึ่งวัน)':''}</small></span><span class="pill ${(LS[l.status]||LS.pend)[1]}">${(LS[l.status]||LS.pend)[0]}</span></div>`).join('')}</div>`:'<p class="fdsm">ยังไม่มีใบลา</p>'}</section>`}
ACT.fLvSend=()=>{const u=fu(),f=S.fdf||{};if(!u)return;const from=f.lvFrom||today(),to=f.lvTo&&f.lvTo>=from?f.lvTo:from;const C=CO();if(!C.leave)C.leave=[];
  C.leave.push(Object.assign({id:uid()},NEW.leave(),{staff:u.id,type:f.lvType||'sick',from,to,half:!!f.lvHalf,reason:f.lvWhy||'',status:'pend'}));
  S.fdf=Object.assign(f,{lvFrom:'',lvTo:'',lvHalf:false,lvWhy:''});save();render();toast('ยื่นใบลาแล้ว รอหัวหน้าอนุมัติ')};

/* ---------- who is on site today ---------- */
const fdTeam=(p=P)=>CO().staff.filter(s=>s.active!==false&&s.proj===p.id);
function attCard(lead){const td=today(),A=(P.att||[]).filter(a=>a.date===td),T=fdTeam(),ids=new Set(T.map(s=>s.id));
  CO().staff.forEach(s=>{if(!ids.has(s.id)&&A.some(a=>a.staff===s.id)){T.push(s);ids.add(s.id)}});if(!T.length&&!lead)return '';
  const s=siteGeo(),far=A.filter(a=>(a.inGeo&&a.inGeo.far)||(a.outGeo&&a.outGeo.far)).length,prev=!me()&&!lead;
  return `<section class="card" id="attCard"><h2><span>ใครเข้างานวันนี้</span><small>มาแล้ว ${A.length} / ${T.length} คน${far?` · <span class="bad-t">ห่างไซต์ ${far} คน</span>`:''}</small></h2>
  ${s?'':`<p class="sp-n sp-w" style="margin:0 0 8px">ยังไม่ได้บันทึกตำแหน่งไซต์ ระบบจึงยังไม่ตรวจระยะ${lead?' ยืนที่ไซต์แล้วกดปุ่มนี้':' (ตั้งได้ที่ ข้อมูลโครงการและ BOQ หรือให้โฟร์แมนกดจากหน้างาน)'}</p>${lead?'<button type="button" class="btn pri" data-a="fGeoSet" style="margin-bottom:8px">📍 บันทึกตำแหน่งไซต์ตรงนี้</button>':''}`}
  <div class="fdl att">${T.map(x=>{const a=A.find(y=>y.staff===x.id);return `<div class="fdrow">${a&&a.photos&&a.photos[0]?`<img data-ph="${a.photos[0]}" alt="">`:'<span class="fdnoimg">👤</span>'}<span class="fdtx"><b>${esc(x.name||x.code)}</b><small class="muted">${esc(x.role||'')}</small></span>
    <span class="atr">${a?`<small>เข้า ${esc(a.in)}${a.out?` · ออก ${esc(a.out)} · ${fmtq(a.h)} ชม.`:''}</small>${geoPill(a.inGeo)}${a.outGeo&&a.outGeo.far?geoPill(a.outGeo):''}`:'<span class="pill">ยังไม่เข้างาน</span>'}${prev&&x.field?` <button type="button" class="btn sm" data-a="fPrev" data-id="${x.id}">ดูหน้าจอ</button>`:''}</span></div>`}).join('')||'<p class="fdsm">ยังไม่มีพนักงานประจำโครงการนี้</p>'}</div></section>`}
const fdWho=()=>attCard(true);
{const f=siteDaily;siteDaily=function(){return attCard(false)+f()}}
ACT.fGeoSet=async b=>{const t=b.textContent;b.disabled=true;b.textContent='กำลังอ่านตำแหน่ง…';const g=await fdGeo();b.disabled=false;b.textContent=t;
  if(!g){toast('อ่านตำแหน่งไม่ได้ เปิด GPS และอนุญาตให้เว็บนี้ใช้ตำแหน่ง');return}const o=P.info.geo||{};
  P.info.geo={lat:g.lat,lng:g.lng,r:n(o.r)||300,acc:g.acc,at:today(),by:(me()||{}).name||'ผู้ดูแลระบบ'};save();render();toast(`บันทึกตำแหน่งไซต์แล้ว (แม่นยำประมาณ ±${fmt(g.acc)} ม.)`)};

/* ---------- office: site position, staff column ---------- */
{const f=VIEWS.setup;VIEWS.setup=()=>{const g=P.info.geo||{},s=siteGeo();
  return f()+`<section class="card" id="fdGeoCard"><h2><span>ตำแหน่งไซต์ (เช็กชื่อเข้างาน)</span><small>ช่างเช็กชื่อด้วย GPS ระบบเทียบกับจุดนี้ ถ้าห่างเกินรัศมีจะขึ้นเตือนให้หัวหน้าเห็น</small></h2>
  <div class="form"><label>ละติจูด<input data-fg="lat" inputmode="decimal" value="${esc(g.lat??'')}" placeholder="13.7563"></label><label>ลองจิจูด<input data-fg="lng" inputmode="decimal" value="${esc(g.lng??'')}" placeholder="100.5018"></label><label>รัศมี (เมตร)<input data-fg="r" inputmode="numeric" value="${esc(g.r||300)}"></label></div>
  <div class="row" style="margin-top:8px"><button type="button" class="btn pri" data-a="fGeoSet">📍 ใช้ตำแหน่งปัจจุบันของเครื่องนี้</button>${s?`<a class="btn" href="https://www.google.com/maps?q=${s.lat},${s.lng}" target="_blank" rel="noopener">ดูบนแผนที่</a>`:''}</div>
  <p class="hint" style="margin-top:8px">กดปุ่มตอนยืนอยู่ที่ไซต์ หรือเปิด Google Maps กดค้างที่ไซต์ แล้วคัดลอกตัวเลข (เช่น 13.7563, 100.5018) มาวางในช่องละติจูด${g.at?` · บันทึกล่าสุด ${thD(g.at)} โดย ${esc(g.by||'')}`:''}</p></section>`}}
document.addEventListener('change',e=>{const el=e.target;
  if(el.dataset.fd){const k=el.dataset.fd,v=el.type==='checkbox'?el.checked:el.value;
    if(k==='pj'){if(DB.projects[v]){DB.cur=v;P=DB.projects[v];S.sel={};save();render()}return}S.fdf=S.fdf||{};S.fdf[k]=v;saveUI();return}
  if(el.dataset.fg){const k=el.dataset.fg,g=P.info.geo=Object.assign({lat:'',lng:'',r:300},P.info.geo||{}),v=el.value.trim();
    if(k==='lat'&&/,/.test(v)){const [a,b]=v.split(',').map(x=>parseFloat(x));if(isFinite(a)&&isFinite(b)){g.lat=a;g.lng=b}}
    else if(k==='r')g.r=Math.max(50,n(v)||300);else g[k]=v===''?'':isFinite(parseFloat(v))?parseFloat(v):g[k];
    g.at=today();g.by=(me()||{}).name||'ผู้ดูแลระบบ';save();render()}});
{const g=gtable;gtable=function(base,rows,cols,o={}){
  if(base==='co.staff'&&cols.some(c=>c.k==='proj')&&!cols.some(c=>c.k==='field')){const i=cols.findIndex(c=>c.k==='proj')+1;
    cols=cols.slice();cols.splice(i,0,{k:'field',h:'หน้าจอหน้างาน',t:'sel',w:170,o:FROLE})}
  return g(base,rows,cols,o)}}

/* ---------- field mode: only the field page, no menus ---------- */
{const a=allowed;allowed=function(m,t){return m==='co'&&t==='field'?true:a(m,t)}}
{const r=render;render=function(){let on=false;
  try{if(typeof DB!=='undefined'&&DB&&DB.co){if(typeof pinOn==='function'&&pinOn()&&authOK()&&PINAUTH)S.me=PINAUTH.id;if(typeof sbStaffLock==='function'&&sbStaffLock())S.me=SB.who||'__none';
    on=fdMode();if(on){const u=fu();if(u.proj&&DB.projects[u.proj]&&DB.cur!==u.proj){DB.cur=u.proj;P=DB.projects[DB.cur]}S.mode='co';S.ctab='field'}else if(S.mode==='co'&&S.ctab==='field'){S.ctab='exec';S.fld=S.fld==='full'?'full':''}}}catch(e){console.error(e)}
  const x=r.apply(this,arguments);
  try{document.body.classList.toggle('fld',on&&!!$('#view .fd'));let fb=$('#fdFab');const show=!on&&S.fld==='full'&&!!fu()&&fdAuth();
    if(show&&!fb){fb=document.createElement('button');fb.type='button';fb.id='fdFab';fb.dataset.a='fHome';fb.textContent='📱 หน้าจอหน้างาน';document.body.appendChild(fb)}if(fb)fb.hidden=!show}catch(e){}
  return x}}

document.head.insertAdjacentHTML('beforeend',`<style>
body.fld{padding-left:0!important}body.fld header.band,body.fld #side,body.fld #sideBg,body.fld #homeFab,body.fld #view>:not(.fd){display:none!important}
body.fld main#view{max-width:640px;margin:0 auto;padding:12px 12px 96px}
.fd .card{border-radius:16px}.fdtop{display:flex;align-items:center;gap:10px;justify-content:space-between;margin:4px 2px 10px}.fdtop>div{display:flex;flex-direction:column}.fdtop b{font-size:20px;line-height:1.3}.fdtop small{color:var(--muted);font-size:13px}
.fdpj{display:flex;align-items:center;gap:8px;padding:10px 14px;border:1px solid var(--line);border-radius:14px;background:var(--surface);margin-bottom:12px;font-size:15px}.fdpj select{flex:1;min-height:40px;font-size:15px}
.fdprev{display:flex;align-items:center;gap:8px;justify-content:space-between;flex-wrap:wrap;padding:8px 12px;border-radius:12px;background:#fff4dc;color:#7a4b00;margin-bottom:10px;font-size:14px}
.fdin{display:flex;flex-direction:column;align-items:center;gap:4px;width:100%;padding:22px 14px;border:0;border-radius:16px;background:linear-gradient(135deg,#17a974,#0e8a5f);color:#fff;font:inherit;cursor:pointer;box-shadow:0 6px 18px rgba(14,138,95,.28)}
.fdin span{font-size:34px;line-height:1}.fdin b{font-size:21px}.fdin small{opacity:.9;font-size:13px;text-align:center}.fdin.sm{padding:16px 14px;margin-bottom:12px}.fdin.sm span{font-size:26px}.fdin.sm b{font-size:18px}
.fdout{width:100%;margin-top:12px;padding:16px;border:0;border-radius:14px;background:#e0663d;color:#fff;font:inherit;font-size:18px;cursor:pointer}
.fdout:disabled{opacity:.6}.fdst1{display:flex;gap:12px;align-items:center}.fdst1 img{width:64px;height:64px;border-radius:50%;object-fit:cover;background:var(--line);flex:none}.fdst1>div{display:flex;flex-direction:column;gap:4px;align-items:flex-start}.fdst1 b{font-size:17px}.fdst1 small{color:var(--muted)}
.fdsm{color:var(--muted);font-size:13px;margin:10px 0 0}.fdc{padding:14px}
.fdg{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:12px 0}
.fdb{display:flex;flex-direction:column;align-items:flex-start;gap:3px;text-align:left;min-height:112px;padding:14px;border:1px solid var(--line);border-radius:16px;background:var(--surface);color:var(--ink);font:inherit;cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,.04)}
.fdb:hover,.fdb:focus-visible{border-color:var(--accent)}.fdb b{font-size:16px}.fdb small{color:var(--muted);font-size:12.5px}.fdi{font-size:30px;line-height:1.15}.fdb.hot{border-color:#e5b26a;background:#fff8ea}
.fdbar{display:flex;align-items:center;gap:10px;margin:0 0 10px}.fdbar b{font-size:18px}.fdbar .btn{min-height:40px}
.fdf h3{font-size:15px;margin:14px 0 6px}.fd2{display:grid;grid-template-columns:1fr 1fr;gap:10px}.fd2 label,.fdt{display:flex;flex-direction:column;gap:4px;font-size:13px;color:var(--muted);margin-top:10px}
.fd2>label{min-width:0}.fd2 input,.fd2 select,.fdt input,.fdt select,.fdt textarea,.fdpick select{min-height:44px;font-size:16px;color:var(--ink);width:100%;min-width:0;box-sizing:border-box}.fdt textarea{min-height:0}
.fdl{display:flex;flex-direction:column;gap:6px}.fdrow{display:flex;align-items:center;gap:10px;padding:8px 10px;border:1px solid var(--line);border-radius:12px;background:var(--surface);color:var(--ink);font:inherit;text-align:left}.fdrow>.fdtx{flex:1;min-width:0}
.fdtx small{display:block}.fdrow img,.fdnoimg{width:44px;height:44px;border-radius:10px;object-fit:cover;flex:none;background:var(--line);display:grid;place-items:center;font-size:20px}.fdlink{cursor:pointer;width:100%}
.fdl.att{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(100%,360px),1fr))}.att .fdrow img,.att .fdnoimg{border-radius:50%}.atr{display:flex;flex-direction:column;align-items:flex-end;gap:3px;text-align:right;flex:none}
.fdsp{display:inline-flex;align-items:center;gap:4px;flex:none}.fdsp button{width:38px;height:40px;border-radius:10px;border:1px solid var(--line);background:var(--surface);color:var(--ink);font-size:20px;cursor:pointer}.fdsp input{width:48px;min-height:40px;text-align:center;font-size:16px}
.fdfree{display:flex;gap:6px;flex:1;min-width:0}.fdfree input{min-height:40px;font-size:15px;min-width:0}.fdfree input:first-child{flex:2}.fdfree input:last-child{flex:1}
.fdpick{display:flex;gap:8px;margin-bottom:10px}.fdpick select{flex:1;min-width:0}.fdgo{min-height:48px;font-size:17px;padding-inline:26px}
.fdck{display:flex;flex-direction:column;gap:6px;padding:10px;border:1px solid var(--line);border-radius:12px}.fdtg{display:grid;grid-template-columns:repeat(3,1fr);gap:6px}
.fdtg button{min-height:42px;border-radius:10px;border:1px solid var(--line);background:var(--surface);color:var(--ink);font:inherit;font-size:14px;cursor:pointer}
.fdtg .t-ok[aria-pressed=true]{background:#17a974;border-color:#17a974;color:#fff}.fdtg .t-ng[aria-pressed=true]{background:#d9483b;border-color:#d9483b;color:#fff}.fdtg .t-na[aria-pressed=true]{background:#8a94a3;border-color:#8a94a3;color:#fff}
.fdchk{display:flex;align-items:center;gap:8px;margin-top:10px;font-size:15px}.fdchk input{width:22px;height:22px}
.mr{border:1px solid var(--line);border-radius:12px;padding:10px 12px;margin-bottom:8px;background:var(--surface)}.mrh{display:flex;flex-wrap:wrap;align-items:center;gap:6px 8px}.mrh small{color:var(--muted);flex-basis:100%}
.mr ul{margin:6px 0;padding-left:18px}.mr li{margin:3px 0}.mr li span{margin-right:6px}.mr .row{margin-top:8px}.bad-t{color:var(--danger)}
.mrs{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:8px}.mrold{margin-top:8px}.mrold summary{cursor:pointer;color:var(--accent);font-weight:600;margin-bottom:8px}
#fdFab{position:fixed;left:50%;transform:translateX(-50%);bottom:14px;white-space:nowrap;z-index:870;padding:12px 16px;border:0;border-radius:24px;background:#17a974;color:#fff;font:inherit;font-weight:600;box-shadow:0 6px 18px rgba(0,0,0,.25);cursor:pointer}
html[data-theme=dark] .fdprev{background:#4a3a14;color:#ffe2a6}html[data-theme=dark] .fdb.hot{background:#3a2f18}
@media(max-width:380px){.fdg{grid-template-columns:1fr 1fr;gap:8px}.fdb{min-height:104px;padding:12px}.fd2{grid-template-columns:1fr}}
</style>`);

if(typeof I18N==='object'&&I18N.en&&I18N.en.x)Object.assign(I18N.en.x,{'หน้าจอหน้างาน':'Site screen','ช่างหน้างาน':'Site technician','โฟร์แมน / หัวหน้าหน้างาน':'Foreman / site lead','– เมนูเต็ม –':'– Full menus –',
  'เช็กชื่อเข้างาน':'Check in','เช็กชื่อออกงาน':'Check out','รายงานประจำวัน':'Daily report','ขอเบิกของ':'Material request','ถ่ายรูปแจ้งปัญหา':'Report a problem','ตรวจความปลอดภัย':'Safety check','ยื่นใบลา':'Request leave',
  'อนุมัติขอเบิก':'Approve requests','ใครเข้างานวันนี้':'Who is on site today','เปิดโปรแกรมเต็ม':'Open full program','‹ กลับ':'‹ Back','📱 หน้าจอหน้างาน':'📱 Site screen','ส่งขอเบิก':'Send request','ขอเบิกของใหม่':'New material request',
  'ใบขอเบิกของฉัน':'My requests','ใบขอเบิกจากหน้างาน':'Material requests from site','จ่ายของจากคลัง':'Issue from stock','เปิดใบขอซื้อ':'Open purchase request','รอคุณอนุมัติ':'Waiting for you','อนุมัติ':'Approve','ไม่อนุมัติ':'Reject',
  'ตำแหน่งไซต์ (เช็กชื่อเข้างาน)':'Site position (check-in)','📍 ใช้ตำแหน่งปัจจุบันของเครื่องนี้':'📍 Use this device\'s position','📍 บันทึกตำแหน่งไซต์ตรงนี้':'📍 Save site position here','ดูบนแผนที่':'View on map',
  'ละติจูด':'Latitude','ลองจิจูด':'Longitude','รัศมี (เมตร)':'Radius (m)','ถ่ายรูปแจ้งปัญหาใหม่':'Report a new problem','ที่ฉันแจ้งไว้':'My reports','ปัญหาที่พบ':'Problem','ตำแหน่ง / ชั้น / ห้อง':'Location / floor / room','เสร็จ':'Done',
  'ใบลาใหม่':'New leave request','ใบลาของฉัน':'My leave','ลาครึ่งวัน':'Half day','ประเภท':'Type','ตั้งแต่':'From','ถึง':'To','เหตุผล':'Reason','ยังไม่เข้างาน':'Not in yet','ไม่มี GPS':'No GPS','ปิดตัวอย่าง':'Close preview','ดูหน้าจอ':'Preview',
  'คนงานวันนี้':'Workers today','งานที่ทำวันนี้':'Work done today','ปัญหา / อุปสรรค':'Problems / obstacles','รูปถ่ายหน้างาน':'Site photos','อากาศเช้า':'Morning weather','อากาศบ่าย':'Afternoon weather','พื้นที่ที่ตรวจ':'Area checked','ข้อสังเกต':'Remarks'});
