/* ---------- 3.68 แชท: a chat that pops up over the page (company room, project rooms, direct chat) ----------
   The round headset button in the corner opens it; the page underneath stays as it is.
   Messages do not go into the company data file (it would grow and be re-sent on every change). Each person on each
   device writes only their own file, chat/<YYYY-MM>/<person>_<device>.json, next to penum-pm.json in the shared place
   (คลาวด์ PENUM or the OneDrive folder, through the same folder handle as the data), and reads everyone else's. Nobody
   ever writes someone else's file, so nothing is lost when two people send at once. Photos go to chat/ph/<id>.txt.
   A company that keeps its data on this device only can still use it, but the messages stay on this device until a
   shared place is set up (they are sent then). A message: {id, r: room, by, at, t, men, ph:[photo ids], doc:{p,ref}, del}.
   Rooms: 'co' (everyone), 'p:<project id>', 'd:<id>|<id>' (two people, ids sorted). */
const CHK='penum.pm.chat'+DSFX,CHDK='penum.pm.chatDev'+DSFX;
let CHDEV='';try{CHDEV=localStorage.getItem(CHDK)||''}catch(e){}
if(!CHDEV){CHDEV=Math.random().toString(36).slice(2,8);try{localStorage.setItem(CHDK,CHDEV)}catch(e){}}
const CH={F:{},mt:{},dirty:new Set(),phq:new Set(),open:false,view:'list',room:'',q:'',att:null,last:0,busy:false,err:'',months:new Set(),oldM:0,oldAt:0,allAt:0,pend:false,stl:{}};
{try{const J=JSON.parse(localStorage.getItem(CHK)||'{}');Object.assign(CH.F,J.own||{});(J.dirty||[]).forEach(p=>CH.dirty.add(p));(J.phq||[]).forEach(p=>CH.phq.add(p))}catch(e){}}
const chMonth=at=>String(at).slice(0,7);
// the file name is <person>_<device>.json: PENUM cloud (Supabase storage) refuses "~" in a name, which 3.68–3.69.1 used,
// so messages written then stayed on the phone or computer. Those are moved to the new name here and sent again.
const chMine=path=>path.endsWith('_'+CHDEV+'.json');
{let mv=false;for(const p of Object.keys(CH.F))if(p.endsWith('~'+CHDEV+'.json')){const q=p.slice(0,-('~'+CHDEV+'.json').length)+'_'+CHDEV+'.json';CH.F[q]=CH.F[p];delete CH.F[p];CH.dirty.delete(p);CH.dirty.add(q);mv=true}
  if(mv)setTimeout(()=>chKeep(),0)}
function chKeep(){const own={};for(const [p,f] of Object.entries(CH.F))if(chMine(p))own[p]=f;
  try{localStorage.setItem(CHK,JSON.stringify({own,dirty:[...CH.dirty],phq:[...CH.phq]}))}catch(e){toast('พื้นที่ในเครื่องเต็ม บันทึกแชทไม่ได้')}}
function chOwn(m,u){const p=`${m}/${u}_${CHDEV}.json`;if(!CH.F[p])CH.F[p]={v:1,user:u,dev:CHDEV,m,msgs:[],rd:{}};return {p,f:CH.F[p]}}
const chShared=()=>folderOn()&&!DEMOPG;
async function chDir(){if(!chShared())return null;CH.dirErr='';try{if(!await fPerm(false)){CH.dirErr='ยังไม่ได้รับอนุญาตให้เปิดที่เก็บข้อมูล';return null}const h=await dirH();if(!h)CH.dirErr='ไม่พบที่เก็บข้อมูลกลาง';return h?await h.getDirectoryHandle('chat',{create:true}):null}catch(e){CH.dirErr=e&&e.message||'เปิดที่เก็บข้อมูลไม่ได้';return null}}

/* what is in the loaded files */
function chMsgs(room){const M=new Map();for(const [p,f] of Object.entries(CH.F))for(const x of f.msgs||[])if(x.r===room&&(!M.has(x.id)||chMine(p)))M.set(x.id,x);
  return [...M.values()].filter(x=>!x.del).sort((a,b)=>String(a.at).localeCompare(String(b.at)))}
function chRd(room,u){let r='';for(const f of Object.values(CH.F))if(f.user===u){const v=(f.rd||{})[room];if(v&&v>r)r=v}return r}
const CHNEW=14;// a room never opened counts messages of the last two weeks as new
function chUnread(room,u,L){if(!u)return 0;L=L||chMsgs(room);let r=chRd(room,u);if(!r)r=new Date(Date.now()-CHNEW*864e5).toISOString();return L.filter(x=>x.by!==u&&x.at>r).length}
const chDm=(a,b)=>'d:'+[a,b].sort().join('|');// 3.70.12 the admin (id 'admin') has private rooms too, and staff find ผู้ดูแลระบบ at the top of คุยส่วนตัว
const chOther=(room,u)=>room.slice(2).split('|').find(x=>x!==u)||'';
// a project room shows to people who may open projects and to the project's own staff, and also to anyone called (@) or writing
// in it, so an HR or accounts person who is mentioned there still gets the message
function chPjOk(p,u){if(u==='admin'||!me())return true;const s=me();return allowed('pj','dash')||s.proj===p.id||chMsgs('p:'+p.id).some(x=>x.by===u||(x.men||[]).includes(u))}
function chRooms(u){const R=[{id:'co',k:'co',name:'ห้องบริษัท',sub:(CO().name||'').trim()}];
  Object.values(DB.projects).filter(p=>!p.closed&&chPjOk(p,u)).sort((a,b)=>a.name.localeCompare(b.name,'th')).forEach(p=>R.push({id:'p:'+p.id,k:'p',name:p.name,pid:p.id,sub:'ห้องโครงการ'}));
  if(u){const seen=new Set();for(const f of Object.values(CH.F))for(const x of f.msgs||[])if(x.r.startsWith('d:')&&x.r.slice(2).split('|').includes(u))seen.add(x.r);
    if(CH.room.startsWith('d:'))seen.add(CH.room);
    seen.forEach(r=>{const o=chOther(r,u),s=CO().staff.find(z=>z.id===o);R.push({id:r,k:'d',name:cmName(o),who:o,sub:s?s.role||'':''})})}
  R.forEach(r=>{const L=chMsgs(r.id);r.lastM=L[L.length-1]||null;r.n=chUnread(r.id,u,L);r.at=r.lastM?r.lastM.at:'';r.atMe=r.n&&L.slice(-r.n).some(x=>(x.men||[]).includes(u))});return R}
const chTotal=()=>{const u=cmMe();return u?chRooms(u).reduce((a,r)=>a+r.n,0):0};
const chApN=()=>{try{return chQueue().length}catch(e){return 0}};
function chRoomInfo(id,u){if(id==='co')return {name:'ห้องบริษัท',sub:chAll(),pid:'',av:['บ',200]};
  if(id.startsWith('p:')){const p=DB.projects[id.slice(2)],n=CO().staff.filter(s=>s.active!==false&&s.proj===(p&&p.id)).length;return {name:p?p.name:'(โครงการถูกลบแล้ว)',sub:LANG==='en'?'Project room'+(n?` · ${n} on site`:''):`ห้องโครงการ${n?' · '+n+' คนประจำโครงการ':''}`,pid:p?p.id:'',av:[(p?p.name:'?').replace(/^[เแโใไ]/,'')[0],chHue(id)]}}
  const o=chOther(id,u),s=CO().staff.find(z=>z.id===o);return {name:cmName(o),sub:'คุยส่วนตัว'+(s&&s.role?' · '+s.role:''),pid:s&&s.proj||'',who:o}}
const chAll=()=>{const n=CO().staff.filter(s=>s.active!==false).length;return LANG==='en'?`Everyone · ${n}`:`ทุกคน ${n} คน`};
function chHue(id){let h=0;for(const x of String(id))h=(h*31+x.charCodeAt(0))%360;return h}
// the company room shows the company's logo: a wide logo (mark + name) is cut down to its mark on the left, so it reads in a small circle
const CHLG={src:'',url:''};
function chLogo(){const src=CO().logo||'';if(!src)return '';if(CHLG.src===src)return CHLG.url||src;CHLG.src=src;CHLG.url='';
  const im=new Image();im.onload=()=>{try{const W=Math.min(720,im.naturalWidth),H=Math.round(im.naturalHeight*W/im.naturalWidth),c=document.createElement('canvas');c.width=W;c.height=H;const x=c.getContext('2d');x.drawImage(im,0,0,W,H);
    const d=x.getImageData(0,0,W,H).data;let x0=W,y0=H,x1=-1,y1=-1;for(let y=0;y<H;y++)for(let i=0;i<W;i++){const k=(y*W+i)*4;if(d[k+3]>24&&!(d[k]>238&&d[k+1]>238&&d[k+2]>238)){if(i<x0)x0=i;if(i>x1)x1=i;if(y<y0)y0=y;if(y>y1)y1=y}}
    if(x1<0)return;let w=x1-x0+1,h=y1-y0+1;if(w>h*1.5)w=h;const sz=Math.max(w,h),o=document.createElement('canvas');o.width=o.height=128;const ox=o.getContext('2d');ox.fillStyle='#fff';ox.fillRect(0,0,128,128);
    const f=92/sz;ox.drawImage(c,x0,y0,w,h,(128-w*f)/2,(128-h*f)/2,w*f,h*f);CHLG.url=o.toDataURL('image/png');if(CH.open)chDraw()}catch(e){}};im.src=src;return src}
const chAv=(r,u)=>r.k==='co'&&CO().logo?`<span class="cm-av ch-logo" aria-hidden="true"><img src="${esc(chLogo())}" alt=""></span>`:r.k==='d'||r.who?cmAv(r.who||chOther(r.id,u)):`<span class="cm-av" style="--h:${r.k==='co'?200:chHue(r.id)}" aria-hidden="true">${esc(r.k==='co'?'บ':String(r.name||'?').replace(/^[เแโใไ]/,'')[0]||'?')}</span>`;
const chTime=at=>{const d=new Date(at);if(isNaN(d))return '';const D=iso(d);return D===today()?d.toLocaleTimeString('th-TH',{hour:'2-digit',minute:'2-digit'}):D===addD(today(),-1)?'เมื่อวาน':thD(D)};
const chHM=at=>{const d=new Date(at);return isNaN(d)?'':d.toLocaleTimeString('th-TH',{hour:'2-digit',minute:'2-digit'})};
const chDay=D=>D===today()?'วันนี้':D===addD(today(),-1)?'เมื่อวาน':thDL(D);
const chFirst=u=>{const n=cmName(u).replace(/^(ดร\.|นาย|นางสาว|นาง|น\.ส\.|คุณ)\s*/,'');return u==='admin'?'ผู้ดูแลระบบ':n.split(/\s+/)[0]};
const chSnip=x=>x?(x.ph&&x.ph.length&&!x.t?'📷 รูปภาพ':x.doc&&!x.t?'📎 '+cmTitle(cmDoc(x.doc.p,x.doc.ref)):String(x.t||'').replace(/\s+/g,' ')).slice(0,60):'';

/* the button and the window */
const CHI={chat:'<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20.5l1.4-4.6A8 8 0 1 1 21 12z"/>',
  head:'<path d="M4 14v-2a8 8 0 0 1 16 0v2"/><rect x="2.5" y="13" width="4" height="6" rx="1.5"/><rect x="17.5" y="13" width="4" height="6" rx="1.5"/><path d="M20 19a3 3 0 0 1-3 3h-3"/>',
  co:'<path d="M3 21h18M5 21V7l7-4 7 4v14"/><path d="M9 21v-4h6v4M9 10h6M9 14h6"/>',pj:'<path d="M2 20h20M5 20V8l7-5 7 5v12"/><path d="M9 20v-5h6v5"/>',
  dm:'<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',cam:'<rect x="3" y="6" width="18" height="14" rx="2"/><circle cx="12" cy="13" r="3.5"/><path d="M8 6l2-3h4l2 3"/>',
  clip:'<path d="m21 12-9 9a5 5 0 0 1-7-7l9-9a3.5 3.5 0 0 1 5 5l-9 9a2 2 0 0 1-3-3l8-8"/>',send:'<path d="M22 2 11 13M22 2l-7 20-4-9-9-4z"/>'};
const chSv=(p,s=22)=>`<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
document.body.insertAdjacentHTML('beforeend',`<button type="button" id="chFab" class="ch-fab" data-a="chToggle" aria-label="แชท" aria-expanded="false" aria-controls="chPop" title="แชท">${chSv(CHI.head,28)}<b class="ch-n" hidden>0</b></button><section id="chPop" class="ch-pop" role="dialog" aria-label="แชท" hidden></section>`);
function chBadge(){const b=$('#chFab');if(!b)return;const m=chTotal(),a=chApN(),k=m+a,n=b.querySelector('.ch-n');n.textContent=k>99?'99+':k;n.hidden=!k;
  b.title=['แชท',m?`ข้อความใหม่ ${m}`:'',a?`รออนุมัติ ${a}`:''].filter(Boolean).join(' · ');b.setAttribute('aria-label',b.title)}
ACT.chToggle=()=>{CH.open=!CH.open;const p=$('#chPop');p.hidden=!CH.open;$('#chFab').setAttribute('aria-expanded',CH.open);if(CH.open){chDraw();chSync(true)}};
ACT.chClose=()=>{if(CH.open)ACT.chToggle()};
ACT.chBack=()=>{CH.view=CH.view==='att'?'room':'list';CH.rej='';if(CH.view==='list'){CH.room='';CH.att=null}chDraw()};
ACT.chGo=b=>{CH.room=b.dataset.r;CH.view='room';CH.att=null;chDraw()};
ACT.chView=b=>{CH.view=b.dataset.k;CH.q='';chDraw();const q=$('#chPop .ch-q input');if(q&&!matchMedia('(pointer:coarse)').matches)q.focus()};
ACT.chDm=b=>{const u=cmMe();if(!u||b.dataset.id===u)return;CH.room=chDm(u,b.dataset.id);CH.view='room';CH.att=null;chDraw()};
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&CH.open&&!e.defaultPrevented&&!document.querySelector('dialog[open]')&&e.target.closest&&e.target.closest('#chPop')){e.preventDefault();CH.view==='list'?ACT.chClose():ACT.chBack()}});

function chDraw(){const el=$('#chPop');if(!el||!CH.open)return;
  if(CMP&&CMP.ta&&el.contains(CMP.ta)){CH.pend=true;return}CH.pend=false;
  const u=cmMe(),a=document.activeElement,keep=a&&el.contains(a)&&a.tagName==='TEXTAREA'?{s:a.selectionStart,e:a.selectionEnd}:null,
    qf=a&&el.contains(a)&&a.matches('.ch-q input')?{s:a.selectionStart}:null,body=el.querySelector('.ch-msgs'),
    stick=!body||body.scrollHeight-body.scrollTop-body.clientHeight<60,top=body?body.scrollTop:0,same=el.dataset.r===CH.room&&el.dataset.v===CH.view;
  el.dataset.r=CH.room;el.dataset.v=CH.view;
  el.innerHTML=!u?chHello(u)+'<div class="ch-bd"><p class="hint">เข้าระบบด้วยชื่อของคุณก่อน จึงจะใช้แชทได้</p></div>':
    CH.view==='room'&&CH.room?chRoomHtml(u):CH.view==='att'?chAttHtml(u):CH.view==='appr'?chApHtml(u):CH.view==='net'?chNetHtml(u):chListHtml(u);
  const b2=el.querySelector('.ch-msgs');if(b2)b2.scrollTop=same&&!stick?top:b2.scrollHeight;
  const ta=el.querySelector('textarea');if(ta&&keep){ta.focus();try{ta.setSelectionRange(keep.s,keep.e)}catch(e){}}
  const q=el.querySelector('.ch-q input');if(q&&qf){q.focus();try{q.setSelectionRange(qf.s,qf.s)}catch(e){}}
  chFillPh(el);if(CH.view==='room'&&CH.room)chSeen()}
function chNote(){if(DEMOPG)return '<p class="ch-warn">หน้าตัวอย่าง ข้อความอยู่ในเครื่องนี้เท่านั้น</p>';
  if(!chShared())return `<p class="ch-warn">บริษัทนี้ยังเก็บข้อมูลไว้ในเครื่องนี้เท่านั้น ข้อความจะยังไม่ถึงคนอื่น <button type="button" class="btn sm" data-a="chSetup">ตั้งที่เก็บข้อมูลกลาง</button></p>`;
  if(FS.state==='perm')return `<p class="ch-warn">ต้องเปิดโฟลเดอร์ข้อมูลอีกครั้งจึงจะรับส่งข้อความได้ <button type="button" class="btn sm" data-a="fGo">เปิดโฟลเดอร์</button></p>`;
  return CH.err?`<p class="ch-warn">${esc(CH.err)} <button type="button" class="btn sm" data-a="chView" data-k="net">ตรวจการเชื่อมต่อ</button></p>`:''}
ACT.chSetup=()=>{ACT.chClose();S.mode='co';S.ctab='coset';render();setTimeout(()=>{const c=$('#folderCard');if(c)c.scrollIntoView({behavior:'smooth'})},60)};
const chHello=u=>`<header class="ch-hd"><button type="button" class="ch-x" data-a="chClose" aria-label="ปิดแชท">✕</button><small>${LANG==='en'?'Hello':'สวัสดี คุณ'}${LANG==='en'?' ':''}${esc(u?chFirst(u):'')} 👋</small><h3>คุยกับทีมงานในบริษัท</h3></header>`;
function chListHtml(u){const R=chRooms(u),q=CH.q.trim().toLowerCase(),v=CH.view,dmOk=!!u;
  const row=r=>`<button type="button" class="ch-r${r.n?' new':''}" data-a="chGo" data-r="${esc(r.id)}">${chAv(r,u)}<span class="ch-rt"><b>${esc(r.name)}</b><small>${r.lastM?esc((r.k==='d'?'':chFirst(r.lastM.by)+': ')+chSnip(r.lastM)):esc(r.sub||'ยังไม่มีข้อความ')}</small></span><span class="ch-rm">${r.at?esc(chTime(r.at)):''}${r.n?`<i${r.atMe?' class="at"':''}>${r.atMe?'@':''}${r.n}</i>`:''}</span></button>`;
  const pjN=R.filter(r=>r.k==='p').reduce((a,r)=>a+r.n,0),dmN=R.filter(r=>r.k==='d').reduce((a,r)=>a+r.n,0),coR=R[0];
  const tile=(k,ic,l,s,n,a)=>`<button type="button" class="ch-t${CH.view===k?' on':''}" ${a}>${chSv(ic,24)}<b>${l}</b><small>${s}</small>${n?`<i>${n}</i>`:''}</button>`;
  let list;
  if(v==='pj')list=`<p class="ch-h">ห้องโครงการ</p>${R.filter(r=>r.k==='p'&&(!q||r.name.toLowerCase().includes(q))).map(row).join('')||'<p class="hint">ไม่มีโครงการที่เปิดอยู่</p>'}`;
  else if(v==='dm'){const P=[...(u!=='admin'?[{id:'admin',name:'ผู้ดูแลระบบ',role:trS('เจ้าของหรือผู้ดูแลโปรแกรม')}]:[]),...cmPeople()].filter(s=>s.id!==u&&(!q||[s.name,s.role,s.code].some(x=>String(x||'').toLowerCase().includes(q))));
    list=`<p class="ch-h">คุยส่วนตัวกับ</p>${P.map(s=>{const r=R.find(x=>x.id===chDm(u,s.id));return `<button type="button" class="ch-r${r&&r.n?' new':''}" data-a="chDm" data-id="${s.id}">${cmAv(s.id)}<span class="ch-rt"><b>${esc(s.name)}</b><small>${esc([s.role,s.dept].filter(Boolean).join(' · '))}</small></span><span class="ch-rm">${r&&r.at?esc(chTime(r.at)):''}${r&&r.n?`<i>${r.n}</i>`:''}</span></button>`}).join('')||'<p class="hint">ไม่พบชื่อนี้</p>'}
      <p class="hint ch-priv">ข้อความส่วนตัวแสดงเฉพาะสองคนในแอป แต่ยังเก็บอยู่ในที่เก็บข้อมูลของบริษัท อย่าส่งรหัสผ่านหรือข้อมูลลับทางนี้</p>`}
  else{const L=R.filter(r=>!q||r.name.toLowerCase().includes(q)||(r.lastM&&String(r.lastM.t||'').toLowerCase().includes(q))),act=L.filter(r=>r.at).sort((a,b)=>b.at.localeCompare(a.at)),rest=L.filter(r=>!r.at);
    list=`${act.length?`<p class="ch-h">ล่าสุด</p>${act.map(row).join('')}`:''}${rest.length?`<p class="ch-h">${act.length?'ห้องอื่น':'ห้องแชท'}</p>${rest.map(row).join('')}`:''}${!L.length?'<p class="hint">ไม่พบห้องที่ค้นหา</p>':''}`}
  const apN=chApN();
  return chHello(u)+`<div class="ch-bd">${chNote()}${chNotiAsk()?`<p class="ch-ok ch-nask">🔔 ให้เด้งแจ้งเตือนบนหน้าจอเมื่อมีข้อความใหม่ไหม <button type="button" class="btn sm" data-a="chNoti">เปิด</button> <button type="button" class="btn sm ghost" data-a="chNotiNo">ไม่ตอนนี้</button></p>`:''}${apN?`<button type="button" class="ch-apbar" data-a="chView" data-k="appr"><span class="ch-di ch-apic" aria-hidden="true">✓</span><span class="ch-rt"><b>รอคุณอนุมัติ</b><small>กดอนุมัติได้ในแชทเลย ไม่ต้องเปิดหน้าเอกสาร</small></span><i>${apN}</i><span aria-hidden="true">›</span></button>`:''}<div class="ch-tiles">${tile('co',CHI.co,'ห้องบริษัท',chAll(),coR.n,'data-a="chGo" data-r="co"')}${tile('pj',CHI.pj,'ห้องโครงการ',(n=>LANG==='en'?n+(n===1?' project':' projects'):n+' โครงการ')(R.filter(r=>r.k==='p').length),pjN,'data-a="chView" data-k="pj"')}${dmOk?tile('dm',CHI.dm,'คุยส่วนตัว','เลือกคน',dmN,'data-a="chView" data-k="dm"'):''}</div>
    <label class="ch-q"><input type="search" placeholder="${esc(trS(v==='dm'?'ค้นหาชื่อคน':'ค้นหาห้องหรือข้อความ'))}" value="${esc(CH.q)}" aria-label="ค้นหา"><span aria-hidden="true">🔍</span></label>
    ${v!=='list'?'<button type="button" class="btn sm ghost ch-all" data-a="chView" data-k="list">‹ ห้องทั้งหมด</button>':''}${list}
    <div class="ch-foot"><button type="button" class="ch-netb" data-a="chNoti">${chNotiOn()?'🔔 แจ้งเตือนบนหน้าจอ: เปิดอยู่':'🔕 เปิดแจ้งเตือนบนหน้าจอ'}</button><button type="button" class="ch-netb" data-a="chView" data-k="net">ⓘ ตรวจการเชื่อมต่อแชท</button></div></div>`}
document.addEventListener('input',e=>{if(e.target.matches&&e.target.matches('#chPop .ch-q input')){CH.q=e.target.value;chDraw()}});

/* one room */
const CHDOC={bills:['฿','#3F8C96'],pos:['PO','#d08a2b'],prs:['PR','#8a6db8'],rfis:['RFI','#c0564b'],vos:['VO','#4a7fb5'],subm:['SUB','#5d8f4f'],quotes:['QT','#7a6a4f'],proj:['P','#3F8C96']};
function chRoomHtml(u){CH.apQ=chQueue();const id=CH.room,I=chRoomInfo(id,u),L=chMsgs(id),pid=I.pid||'',dk=cmKey(pid,'chat:'+id);let h='',day='',prev=null;
  const pend=new Set(),RD={};for(const p of CH.dirty)for(const y of (CH.F[p]||{}).msgs||[])pend.add(y.id);
  for(const f of Object.values(CH.F)){if(!f.user||f.user===u)continue;const v=(f.rd||{})[id];if(v&&(!RD[f.user]||RD[f.user]<v))RD[f.user]=v}
  // under the last of my messages in a row: waiting to go, sent, or read (by whom, from the others' read marks)
  const st=x=>{if(pend.has(x.id))return chShared()?'<small class="ch-st wait">🕓 กำลังส่ง…</small>':'<small class="ch-st wait">ยังอยู่ในเครื่องนี้</small>';
    const R=Object.keys(RD).filter(v=>RD[v]>=x.at);return R.length?`<small class="ch-st rd" title="${esc(R.map(cmName).join(', '))}">✓✓ อ่านแล้ว${id[0]==='d'?'':' '+R.length}</small>`:'<small class="ch-st">✓ ส่งแล้ว</small>'};
  L.forEach((x,k)=>{const D=iso(new Date(x.at)),nx=L[k+1],end=x.by===u&&(!nx||nx.by!==u||iso(new Date(nx.at))!==D);if(D!==day){day=D;h+=`<div class="ch-day"><span>${esc(chDay(D))}</span></div>`;prev=null}
    const mine=x.by===u,cont=prev&&prev.by===x.by&&new Date(x.at)-new Date(prev.at)<5*60e3,own=mine&&Object.entries(CH.F).some(([p,f])=>chMine(p)&&(f.msgs||[]).some(y=>y.id===x.id));
    const doc=x.doc?(()=>{const D2=cmDoc(x.doc.p,x.doc.ref),k=String(x.doc.ref).split(':')[0],c=CHDOC[k]||['•','#888'],pj=cmPj(x.doc.p);
      const ap=D2.ok&&(CH.apQ||[]).find(q=>q.ref===x.doc.ref&&(q.pid||'')===(x.doc.p||''));
      return D2.ok?(ap?'<div class="ch-dwrap">':'')+`<button type="button" class="ch-doc" data-a="cmGo" data-cmp="${esc(x.doc.p||'')}" data-cmr="${esc(x.doc.ref)}"><span class="ch-di" style="background:${c[1]}">${c[0]}</span><span><b>${esc(cmTitle(D2))}</b><small>${esc([D2.sub,pj&&x.doc.ref!=='proj'&&!id.endsWith(pj.id)?pj.name:''].filter(Boolean).join(' · '))||'กดเพื่อเปิดเอกสาร'}</small></span></button>`+(ap?`<small class="ch-apw">รอคุณอนุมัติ · ${esc(APPR[ap.k][ap.i][0])}</small>${chApBtns(ap,1)}</div>`:''):'<span class="ch-doc gone">เอกสารนี้ถูกลบแล้ว</span>'})():'';
    h+=`<div class="ch-m${mine?' me':''}${cont?' cont':''}${!mine&&(x.men||[]).includes(u)?' atme':''}">${mine?'':cont?'<span class="cm-av ph"></span>':cmAv(x.by)}<div class="ch-mb">${cont?'':`<div class="ch-mh">${mine?'':`<b>${esc(cmName(x.by))}</b> `}<small>${esc(chHM(x.at))}</small></div>`}
      ${x.t?`<div class="ch-bb">${cmText(x)}</div>`:''}${(x.ph||[]).length?`<div class="ch-ph">${x.ph.map(k=>`<button type="button" data-a="chPh" data-id="${esc(k)}" aria-label="ดูรูป"><img data-chph="${esc(k)}" alt=""></button>`).join('')}</div>`:''}${doc}
      ${end?st(x):''}${own?`<button type="button" class="ch-del" data-a="chDel" data-id="${x.id}" title="ลบข้อความนี้" aria-label="ลบข้อความนี้">✕</button>`:''}</div></div>`;prev=x});
  const att=CH.att?(()=>{const D2=cmDoc(CH.att.p,CH.att.ref);return D2.ok?`<div class="ch-chip">📎 ${esc(cmTitle(D2))}<button type="button" class="x" data-a="chAttX" aria-label="เอาเอกสารออก">✕</button></div>`:''})():'';
  return `<header class="ch-rh"><button type="button" class="ch-bk" data-a="chBack" aria-label="กลับไปรายการห้อง">‹</button>${chAv(Object.assign({id,k:id[0]==='d'?'d':id==='co'?'co':'p'},I),u)}<div><b>${esc(I.name)}</b><small>${esc(I.sub)}</small></div><button type="button" class="ch-x" data-a="chClose" aria-label="ปิดแชท">✕</button></header>
  ${chNote()}<div class="ch-msgs" aria-live="polite">${CH.oldM>0&&L.length?`<button type="button" class="btn sm ghost ch-old" data-a="chOlder">ดูข้อความเก่ากว่า</button>`:''}${h||`<p class="ch-empty">ยังไม่มีข้อความในห้องนี้ เริ่มคุยได้เลย พิมพ์ @ชื่อ เพื่อเรียกคน ส่งรูปหน้างาน หรือแนบใบเบิกงวด PO และ RFI ให้คนอื่นกดเปิดได้</p>`}</div>
  <footer class="ch-ft">${att}<div class="ch-row"><label class="ch-ib" title="ส่งรูป" aria-label="ส่งรูป">${chSv(CHI.cam,19)}<input type="file" accept="image/*" multiple hidden data-chfile="1"></label><button type="button" class="ch-ib" data-a="chAtt" title="แนบเอกสารจากระบบ" aria-label="แนบเอกสารจากระบบ">${chSv(CHI.clip,19)}</button>
    <div class="cm-box ch-box"><textarea class="cm-in ch-ta" rows="1" data-cmr="chat:${esc(id)}" data-cmp="${esc(pid)}" aria-label="พิมพ์ข้อความ" placeholder="${esc(trS('พิมพ์ข้อความ… @ เรียกคน'))}">${esc(CMD[dk]||'')}</textarea><div class="cm-pick" role="listbox" hidden></div></div>
    <button type="button" class="ch-ib send" data-a="chSend" title="ส่ง" aria-label="ส่ง">${chSv(CHI.send,18)}</button></div></footer>`}
// the room you look at is read (only while the page is on screen)
let chST=0;function chSeen(){clearTimeout(chST);chST=setTimeout(()=>{const u=cmMe();if(!u||!CH.open||CH.view!=='room'||document.hidden)return;const L=chMsgs(CH.room),x=L[L.length-1];if(!x||chRd(CH.room,u)>=x.at)return;
  const o=chOwn(chMonth(new Date().toISOString()),u);o.f.rd[CH.room]=x.at;CH.dirty.add(o.p);chKeep();chBadge();chPushSoon()},700)}

/* sending */
function chPost(room,t,doc,ph){const u=cmMe(),at=new Date().toISOString(),x={id:uid(),r:room,by:u,at,t,men:cmMen(t).filter(i=>i!==u)};if(doc)x.doc=doc;if(ph)x.ph=ph;
  const o=chOwn(chMonth(at),u);o.f.msgs.push(x);if(room===CH.room||!o.f.rd[room]||o.f.rd[room]<at)o.f.rd[room]=at;CH.dirty.add(o.p);chKeep();chBadge();chPushSoon();return x}
async function chSendNow(){const el=$('#chPop'),ta=el&&el.querySelector('.ch-ta'),u=cmMe();if(!ta||!u)return;const t=ta.value.trim();
  if(!t&&!CH.att&&!CH.phSel)return;if(t.length>4000){toast('ข้อความยาวเกินไป (ไม่เกิน 4,000 ตัวอักษร)');return}
  chPost(CH.room,t,CH.att,CH.phSel);delete CMD[cmKey(ta.dataset.cmp,ta.dataset.cmr)];ta.value='';CH.att=null;CH.phSel=null;
  chDraw();const t2=$('#chPop .ch-ta');if(t2&&!matchMedia('(pointer:coarse)').matches)t2.focus()}
ACT.chSend=()=>chSendNow();
document.addEventListener('keydown',e=>{const ta=e.target;if(!(ta.matches&&ta.matches('.ch-ta'))||e.defaultPrevented||e.isComposing)return;
  if(e.key==='Enter'&&!e.shiftKey&&(e.ctrlKey||e.metaKey||!matchMedia('(pointer:coarse)').matches)){e.preventDefault();chSendNow()}});
document.addEventListener('input',e=>{const ta=e.target;if(ta.matches&&ta.matches('.ch-ta')){ta.style.height='auto';ta.style.height=Math.min(120,ta.scrollHeight)+'px';ta.style.overflowY=ta.scrollHeight>120?'auto':'hidden'}});
ACT.chDel=b=>{const u=cmMe();for(const [p,f] of Object.entries(CH.F)){if(!chMine(p))continue;const x=(f.msgs||[]).find(y=>y.id===b.dataset.id&&y.by===u);
  if(x){if(!confirm('ลบข้อความนี้?'))return;x.del=1;x.t='';delete x.ph;delete x.doc;CH.dirty.add(p);chKeep();chDraw();chPushSoon();return}}};
// photos: made smaller here, kept in this browser, and sent as their own small files
document.addEventListener('change',async e=>{const f=e.target;if(!(f.dataset&&f.dataset.chfile))return;const L=[...f.files].slice(0,6);f.value='';if(!L.length)return;
  const ids=[];for(const file of L){try{const d=await shrink(file,1600,.75),k='chph-'+uid();await IDB.put(k,d);phCache[k]=d;CH.phq.add(k);ids.push(k)}catch(e){toast('เปิดรูปนี้ไม่ได้')}}
  if(!ids.length)return;CH.phSel=ids;await chSendNow();CH.phSel=null});
async function chPhGet(k){if(phCache[k])return phCache[k];let v=await IDB.get(k).catch(()=>null);
  if(!v){const d=await chDir();if(d){try{const r=await fRead(await d.getDirectoryHandle('ph',{create:true}),k+'.txt');if(r&&r.txt.startsWith('data:image')){v=r.txt;IDB.put(k,v).catch(()=>{})}}catch(e){}}}
  if(v)phCache[k]=v;return v||''}
function chFillPh(root){root.querySelectorAll('img[data-chph]').forEach(async im=>{const v=await chPhGet(im.dataset.chph);if(v)im.src=v;else im.closest('button').classList.add('wait')})}
ACT.chPh=async b=>{const v=await chPhGet(b.dataset.id);if(!v){toast('รูปนี้ยังมาไม่ถึง ลองใหม่อีกครั้ง');return}dialog('รูปภาพ',`<img src="${v}" alt="" style="max-width:100%;border-radius:10px;display:block;margin:auto">`)};
// attach a document of the system: the room's project first, any project can be picked
ACT.chAtt=()=>{const I=chRoomInfo(CH.room,cmMe());CH.attP=I.pid||CH.attP||P.id;CH.view='att';chDraw()};
ACT.chAttX=()=>{CH.att=null;chDraw()};
ACT.chAttPick=b=>{CH.att={p:b.dataset.p,ref:b.dataset.ref};CH.view='room';chDraw()};
document.addEventListener('change',e=>{if(e.target.id==='chAttP'){CH.attP=e.target.value;chDraw()}});
function chAttHtml(u){const p=DB.projects[CH.attP]||P,G=[['bills','ใบเบิกงวด'],['pos','ใบสั่งซื้อ (PO)'],['prs','ใบขอซื้อ (PR)'],['rfis','RFI'],['vos','งานเพิ่มลด (VO)'],['subm','เอกสารส่งอนุมัติ']];
  const it=(pid,ref,D)=>`<button type="button" class="ch-r" data-a="chAttPick" data-p="${esc(pid)}" data-ref="${esc(ref)}"><span class="ch-di" style="background:${(CHDOC[ref.split(':')[0]]||['','#888'])[1]}">${(CHDOC[ref.split(':')[0]]||['•'])[0]}</span><span class="ch-rt"><b>${esc(cmTitle(D))}</b><small>${esc(D.sub||'')}</small></span></button>`;
  const sec=G.map(([k,l])=>{const L=(p[k]||[]).slice().reverse().map(r=>({ref:k+':'+r.id,D:cmDoc(p.id,k+':'+r.id)})).filter(x=>x.D.ok);return L.length?`<p class="ch-h">${l}</p>${L.slice(0,12).map(x=>it(p.id,x.ref,x.D)).join('')}`:''}).join('');
  const Q=(CO().quotes||[]).slice().reverse().slice(0,8).map(q=>({ref:'quotes:'+q.id,D:cmDoc('','quotes:'+q.id)})).filter(x=>x.D.ok);
  return `<header class="ch-rh"><button type="button" class="ch-bk" data-a="chBack" aria-label="กลับ">‹</button><div><b>แนบเอกสารจากระบบ</b><small>เลือกเอกสาร คนในห้องกดเปิดได้ทันที</small></div><button type="button" class="ch-x" data-a="chClose" aria-label="ปิดแชท">✕</button></header>
  <div class="ch-bd"><label class="ch-ps">โครงการ<select id="chAttP">${Object.values(DB.projects).sort((a,b)=>a.name.localeCompare(b.name,'th')).map(x=>`<option value="${x.id}"${x.id===p.id?' selected':''}>${esc(x.name)}</option>`).join('')}</select></label>
  ${it(p.id,'proj',cmDoc(p.id,'proj'))}${sec||'<p class="hint">โครงการนี้ยังไม่มีเอกสาร</p>'}${Q.length?`<p class="ch-h">ใบเสนอราคา</p>${Q.map(x=>it('',x.ref,x.D)).join('')}`:''}</div>`}

/* moving messages: write my own files, read everyone's. 3.70.5: every 2 s while the window is open, every 15 s while it
   is closed (was 4 s / 45 s). The quick rounds read only this month's folder (one listing); earlier months once a minute. */
async function chPush(){if(!CH.dirty.size&&!CH.phq.size)return;const d=await chDir();if(!d)return;const sent=CH.dirty.size;
  if(sent)await chBcSend([...CH.dirty]).catch(e=>console.warn('chat live',e));// the text goes first over ส่งถึงทันที, the file follows
  for(const p of [...CH.dirty]){const f=CH.F[p];if(!f){CH.dirty.delete(p);continue}const [m,nm]=p.split('/');f.w=Math.max(Date.now(),(f.w||0)+1);
    const md=await d.getDirectoryHandle(m,{create:true});CH.mt[p]=await fWrite(md,nm,JSON.stringify(f));CH.dirty.delete(p)}
  if(CH.phq.size){const pd=await d.getDirectoryHandle('ph',{create:true});for(const k of [...CH.phq]){const v=await IDB.get(k).catch(()=>null);if(v)await fWrite(pd,k+'.txt',v);CH.phq.delete(k)}}
  chKeep();if(sent)rtSend('broadcast',{type:'broadcast',event:'chat',payload:{u:cmMe(),dev:CHDEV}})}
async function chPull(){const d=await chDir();if(!d)return false;let ch=false;
  const now=new Date(),cur=chMonth(now.toISOString()),prev=chMonth(new Date(now.getFullYear(),now.getMonth()-1,15).toISOString());[cur,prev].forEach(m=>CH.months.add(m));
  const all=Date.now()-CH.allAt>6e4;if(all)CH.allAt=Date.now();
  for(const m of CH.months){if(!all&&m!==cur)continue;let md;try{md=await d.getDirectoryHandle(m)}catch(e){continue}
    for await(const [nm,eh] of md.entries()){if(eh.kind!=='file'||!nm.endsWith('.json'))continue;const p=m+'/'+nm;
      try{const f=await eh.getFile();if(CH.mt[p]===f.lastModified)continue;const J=JSON.parse(await f.text()),o=CH.F[p];
        // each write stamps w; a file under a newer time that is not newer inside is an old copy (a cache on the way): read it again past the cache
        if(o&&o.w&&!(J.w>o.w)&&!chMine(p)){const k=p+'@'+f.lastModified;CH.stl[k]=(CH.stl[k]||0)+1;if(CH.stl[k]<4){if(eh.path){SBSTALE.add(eh.path);SBC.delete(eh.path)}continue}}CH.mt[p]=f.lastModified;
        if(chMine(p)){const o=CH.F[p];if(o){const have=new Set(o.msgs.map(x=>x.id));(J.msgs||[]).forEach(x=>{if(!have.has(x.id)){o.msgs.push(x);ch=true}});
            for(const [r,v] of Object.entries(J.rd||{}))if(!o.rd[r]||o.rd[r]<v)o.rd[r]=v}else{CH.F[p]=J;ch=true}}
        else{const o2=CH.F[p];if(o2){const have=new Set((J.msgs||[]).map(x=>x.id));for(const x of o2.msgs||[])if(x._lv&&!have.has(x.id))(J.msgs=J.msgs||[]).push(x);
            J.rd=J.rd||{};for(const [r,v] of Object.entries(o2.rd||{}))if(!J.rd[r]||J.rd[r]<v)J.rd[r]=v}
          if(JSON.stringify(CH.F[p])!==JSON.stringify(J)){CH.F[p]=J;ch=true}}}catch(e){}}}
  if(Date.now()-CH.oldAt>3e5){CH.oldAt=Date.now();const M=[];try{for await(const [nm,eh] of d.entries())if(eh.kind==='directory'&&/^\d{4}-\d\d$/.test(nm))M.push(nm)}catch(e){}
    const n=M.filter(m=>!CH.months.has(m)).length;if(n!==CH.oldM){CH.oldM=n;ch=true}}
  return ch}
let chPT=0;const chPushSoon=()=>{clearTimeout(chPT);chPT=setTimeout(()=>chSync(true),100)};
async function chSync(force){if(CH.busy){if(force)CH.again=true;return}if(document.hidden&&!force)return;const due=CH.open?2000:15000;if(!force&&Date.now()-CH.last<due)return;
  CH.busy=true;CH.last=Date.now();let ch=false;const had=CH.dirty.size;
  try{if(chShared()&&FS.state!=='perm'&&!await chDir())throw new Error(CH.dirErr||'เปิดที่เก็บข้อมูลไม่ได้');
    let wd;const stuck=new Promise((_,no)=>{wd=setTimeout(()=>no(new Error('คลาวด์ตอบช้า')),25000)});
    try{ch=await Promise.race([(async()=>{await chPush();return await chPull()})(),stuck])||had>0&&!CH.dirty.size}finally{clearTimeout(wd)}
    CH.err='';if(chShared())CH.okAt=Date.now()}catch(e){console.warn('chat sync',e);CH.err=navigator.onLine?'รับส่งข้อความไม่ได้ จะลองใหม่อัตโนมัติ'+(e&&e.message?` (${String(e.message).slice(0,80)})`:''):'ออฟไลน์ ข้อความจะส่งเมื่อมีอินเทอร์เน็ต'}
  finally{CH.busy=false}
  if(ch||CH.pend){chBadge();chDraw()}else if(CH.open&&CH.err)chDraw();
  if(ch||!CHNS)chNotify();
  // a send or a signal that came in while this round ran gets its own round right away (it used to wait for the next one)
  if(CH.again){CH.again=false;setTimeout(()=>chSync(true),0)}}
/* 3.70.8 แจ้งเตือนบนหน้าจอ: a new message for you (in a room you can see, not yours, not read) pops up as a notification
   while PENUM PM is open but you are not looking at it (another window, minimised, another app), or as a toast when you are
   in the app with the chat closed. Off until the person turns it on (the browser asks once). It does not reach a phone
   whose app is closed or locked; that needs a push server. Messages already there when the page opened never pop up. */
const CHNK='penum.pm.chatNoti'+DSFX;let CHNS=null;// ids already known
const chNotiPref=()=>{try{return localStorage.getItem(CHNK)||''}catch(e){return ''}};
const chNotiOk=()=>typeof Notification==='function';
function chNotiOn(){return chNotiPref()==='1'&&chNotiOk()&&Notification.permission==='granted'}
function chNotiAsk(){return !chNotiPref()&&chNotiOk()&&Notification.permission!=='denied'&&chShared()}
async function chSW(){if(!('serviceWorker' in navigator))return null;try{return await navigator.serviceWorker.getRegistration('./')||await navigator.serviceWorker.register('chat-sw.js',{scope:'./'})}catch(e){return null}}
async function chShow(title,body,room){const o={body,tag:'pm-chat-'+room,renotify:true,icon:'../icons/icon-192.png',badge:'../icons/icon-192.png',data:{room},vibrate:[80,40,80]};
  const reg=await chSW();if(reg){try{await (reg.active?reg:await navigator.serviceWorker.ready).showNotification(title,o);return}catch(e){}}
  try{const n=new Notification(title,o);n.onclick=()=>{window.focus();chOpenRoom(room);n.close()}}catch(e){}}
function chOpenRoom(room){if(!room)return;if(!CH.open)ACT.chToggle();CH.room=room;CH.view='room';CH.att=null;chDraw()}
function chNotify(){const u=cmMe();if(!u)return;const R=chRooms(u),fresh=[];const old=Date.now()-30*60e3;
  const first=!CHNS;if(first)CHNS=new Set();
  for(const r of R){const rd=chRd(r.id,u);for(const x of chMsgs(r.id)){if(CHNS.has(x.id))continue;CHNS.add(x.id);if(first||x.by===u||x.at<=rd||Date.parse(x.at)<old)continue;fresh.push([r,x])}}
  if(!fresh.length)return;const look=!document.hidden&&document.hasFocus();
  const by=new Map();for(const [r,x] of fresh){if(look&&CH.open&&CH.view==='room'&&CH.room===r.id)continue;const o=by.get(r.id)||{r,L:[]};o.L.push(x);by.set(r.id,o)}
  for(const {r,L} of by.values()){const x=L[L.length-1],at=L.some(y=>(y.men||[]).includes(u)),name=r.k==='d'?cmName(r.who):r.name;
    const body=(r.k==='d'?'':chFirst(x.by)+': ')+chSnip(x)+(L.length>1?` (+${L.length-1})`:'');
    if(look){if(!CH.open)toast((at?'@ ':'')+'💬 '+name+' · '+body);continue}
    if(chNotiOn())chShow((at?'@ เรียกคุณ · ':'')+name,body,r.id)}}
ACT.chNoti=async()=>{if(chNotiOn()){try{localStorage.setItem(CHNK,'0')}catch(e){}toast('ปิดแจ้งเตือนบนหน้าจอแล้ว');chDraw();return}
  if(!chNotiOk()){toast(/iPhone|iPad/.test(navigator.userAgent)?'iPhone/iPad ต้องเพิ่ม PENUM PM ลงหน้าจอโฮมก่อน จึงจะแจ้งเตือนได้':'เบราว์เซอร์นี้แจ้งเตือนบนหน้าจอไม่ได้');return}
  let p=Notification.permission;if(p==='default')p=await Notification.requestPermission().catch(()=>'denied');
  if(p!=='granted'){try{localStorage.setItem(CHNK,'0')}catch(e){}toast('เบราว์เซอร์ไม่อนุญาตให้แจ้งเตือน เปิดได้ที่การตั้งค่าเว็บไซต์ของเบราว์เซอร์ (รูปแม่กุญแจข้างที่อยู่เว็บ)');chDraw();return}
  try{localStorage.setItem(CHNK,'1')}catch(e){}await chShow('PENUM PM','เปิดแจ้งเตือนแล้ว ข้อความใหม่จะเด้งที่นี่','');toast('เปิดแจ้งเตือนบนหน้าจอแล้ว');chDraw()};
ACT.chNotiNo=()=>{try{localStorage.setItem(CHNK,'0')}catch(e){}chDraw()};
if('serviceWorker' in navigator){navigator.serviceWorker.addEventListener('message',e=>{if(e.data&&'chRoom' in e.data)chOpenRoom(e.data.chRoom)});if(chNotiOn())chSW()}
{const m=location.hash.match(/(?:^#|&)chat=([^&]*)/);if(m){const r=decodeURIComponent(m[1]);history.replaceState(null,'',location.pathname+location.search);setTimeout(()=>chOpenRoom(r),1200)}}
/* 3.70.7 ส่งถึงทันที: on PENUM cloud each device also keeps one Supabase Realtime connection, a broadcast channel for the
   company. After writing my chat file I send a short signal without the message text ("someone wrote"); the others read
   the cloud right away instead of waiting for their next round (2 s with the window open, 15 s closed, longer on a phone
   that throttles). No connection (OneDrive folder, offline, blocked) = the rounds go on exactly as before. */
const RT={ws:null,ok:false,ref:0,jr:'',hb:0,try:0,t:0,got:0,n:0,lv:0};
/* 3.70.11 the message itself over ส่งถึงทันที: the last few messages and read marks of each file I am about to write go out
   on the channel first, so the others show them at once without waiting for the cloud file (which a cache on the way
   held back 30–60 s for some users). They are encrypted (AES-GCM) with the company's chat key, chat/key.txt in the
   company's cloud folder, which only members can read; someone who only knows the channel name sees nothing. The
   files stay the record: a message that came live is kept until the file has it. */
const CHKK='penum.pm.chatKey'+DSFX;let CHKEY=null,CHKT=0;
const chB64e=u=>{let s='';for(let i=0;i<u.length;i+=8192)s+=String.fromCharCode.apply(null,u.subarray(i,i+8192));return btoa(s)};
const chB64d=t=>Uint8Array.from(atob(t),c=>c.charCodeAt(0));
async function chKey(make,fresh){if(CHKEY&&!fresh)return CHKEY;if(!sbOn()||!(window.crypto&&crypto.subtle))return null;const ck=CHKK+':'+SB.cid;let raw='';
  if(!fresh)try{raw=localStorage.getItem(ck)||''}catch(e){}
  if(!raw){if(fresh&&Date.now()-CHKT<3e4)return CHKEY;CHKT=Date.now();const d=await chDir();if(!d)return null;
    try{raw=(await (await (await d.getFileHandle('key.txt')).getFile()).text()).trim()}catch(e){}
    if(!raw&&make){raw=chB64e(crypto.getRandomValues(new Uint8Array(32)));await fWrite(d,'key.txt',raw)}
    if(!raw)return null;try{localStorage.setItem(ck,raw)}catch(e){}}
  try{CHKEY=await crypto.subtle.importKey('raw',chB64d(raw),'AES-GCM',false,['encrypt','decrypt'])}catch(e){CHKEY=null}return CHKEY}
async function chBcSend(paths){if(!RT.ok)return;const k=await chKey(true);if(!k)return;
  const items=paths.map(p=>{const f=CH.F[p];return f&&{p,user:f.user,dev:f.dev,m:f.m,msgs:(f.msgs||[]).slice(-5),rd:f.rd||{}}}).filter(Boolean);if(!items.length)return;
  const iv=crypto.getRandomValues(new Uint8Array(12)),e=new Uint8Array(await crypto.subtle.encrypt({name:'AES-GCM',iv},k,new TextEncoder().encode(JSON.stringify(items))));
  rtSend('broadcast',{type:'broadcast',event:'chat',payload:{u:cmMe(),dev:CHDEV,iv:chB64e(iv),e:chB64e(e)}})}
async function chBcGot(p){let L=null;for(const fresh of [false,true]){const k=await chKey(false,fresh);if(!k)break;
    try{L=JSON.parse(new TextDecoder().decode(await crypto.subtle.decrypt({name:'AES-GCM',iv:chB64d(p.iv)},k,chB64d(p.e))));break}catch(e){CHKEY=null}}
  if(!Array.isArray(L)){setTimeout(()=>chSync(true),1500);return}// no key or another key: the file brings it
  let ch=false;for(const it of L){if(!it||typeof it.p!=='string'||!/^\d{4}-\d\d\/[^/]+\.json$/.test(it.p)||chMine(it.p))continue;
    const o=CH.F[it.p]||(CH.F[it.p]={v:1,user:it.user,dev:it.dev,m:it.m,msgs:[],rd:{}});o.msgs=o.msgs||[];o.rd=o.rd||{};
    for(const x of it.msgs||[]){if(!x||!x.id||x.by!==o.user)continue;const y=Object.assign({},x,{_lv:1}),i=o.msgs.findIndex(z=>z.id===x.id);
      if(i<0){o.msgs.push(y);ch=true}else if(JSON.stringify(Object.assign({},o.msgs[i],{_lv:1}))!==JSON.stringify(y)){o.msgs[i]=y;ch=true}}
    for(const [r,v] of Object.entries(it.rd||{}))if(typeof v==='string'&&(!o.rd[r]||o.rd[r]<v)){o.rd[r]=v;ch=true}}
  if(ch){RT.lv=Date.now();chBadge();chDraw();chNotify()}}
// a key kept from an earlier visit is checked against the cloud once per visit (two devices could have made one each)
setTimeout(()=>{if(sbOn())chKey(false,true).catch(()=>{})},4000);
const rtTopic=()=>'realtime:pmchat-'+SB.cid;
function rtSend(ev,pl){const w=RT.ws;if(!w||w.readyState!==1||!RT.ok)return false;try{w.send(JSON.stringify({topic:rtTopic(),event:ev,payload:pl,ref:String(++RT.ref),join_ref:RT.jr}));return true}catch(e){return false}}
async function rtOpen(){RT.t=0;if(RT.ws||!sbOn()||document.hidden||typeof WebSocket!=='function')return;let tok='';try{tok=await sbTok()}catch(e){rtRetry();return}
  if(RT.ws||!sbOn())return;let w;try{w=new WebSocket(SBCFG.url.replace(/^http/,'ws')+'/realtime/v1/websocket?apikey='+encodeURIComponent(SBCFG.key)+'&vsn=1.0.0')}catch(e){rtRetry();return}
  RT.ws=w;RT.ok=false;const topic=rtTopic();
  w.onopen=()=>{RT.jr=String(++RT.ref);w.send(JSON.stringify({topic,event:'phx_join',payload:{config:{broadcast:{self:false,ack:false},presence:{key:'',enabled:false},postgres_changes:[],private:false},access_token:tok},ref:RT.jr,join_ref:RT.jr}));
    clearInterval(RT.hb);RT.hb=setInterval(()=>{if(w.readyState===1)w.send(JSON.stringify({topic:'phoenix',event:'heartbeat',payload:{},ref:String(++RT.ref)}))},25000)};
  w.onmessage=e=>{let m;try{m=JSON.parse(e.data)}catch(x){return}if(!m||m.topic!==topic)return;
    if(m.event==='phx_reply'&&m.ref===RT.jr){if(m.payload&&m.payload.status==='ok'){RT.ok=true;RT.try=0;RT.why='';chSync(true)}else{RT.why='คลาวด์ไม่รับ: '+String((m.payload&&m.payload.response&&(m.payload.response.reason||JSON.stringify(m.payload.response)))||'').slice(0,80);w.close()}return}
    if(m.event==='broadcast'&&m.payload&&m.payload.event==='chat'){const p=m.payload.payload||{};if(p.dev===CHDEV)return;RT.got=Date.now();RT.n=(RT.n||0)+1;
      if(p.e)chBcGot(p);else chSync(true);return}
    if(m.event==='phx_error'||m.event==='phx_close')w.close()};
  w.onclose=w.onerror=e=>{if(RT.ws!==w)return;if(!RT.ok&&!RT.why)RT.why='ต่อไม่ได้'+(e&&e.code?' ('+e.code+')':'');RT.ws=null;RT.ok=false;clearInterval(RT.hb);try{w.close()}catch(x){}rtRetry()}}
function rtRetry(){clearTimeout(RT.t);RT.t=setTimeout(rtOpen,Math.min(60000,2000*2**RT.try++))}
setInterval(()=>{if(!RT.ws&&!RT.t&&sbOn()&&!document.hidden)rtOpen()},5000);
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&!RT.ws&&sbOn()){clearTimeout(RT.t);RT.try=0;rtOpen()}});
setTimeout(rtOpen,2500);
/* 3.69.4 ตรวจการเชื่อมต่อแชท: where the messages go, who this device is in the chat, and who else the shared place
   has messages from. Do it on both phones: someone missing from the list has not opened the chat yet, or is in
   another company or another shared place. "ตรวจตอนนี้" writes this device's file, reads the folder back and pulls. */
function chNetHtml(u){const where=sbOn()?'คลาวด์ PENUM':folderOn()?'โฟลเดอร์ '+(CL.dirName||'OneDrive'):'เครื่องนี้เท่านั้น (ยังไม่มีที่เก็บข้อมูลกลาง)',m=chMonth(new Date().toISOString()),N=CH.net||{};
  const P={};for(const [p,f] of Object.entries(CH.F)){if(!p.startsWith(m+'/')||!f.user)continue;const o=P[f.user]||(P[f.user]={d:new Set(),n:0,at:''});o.d.add(f.dev||p);o.n+=(f.msgs||[]).length;
    for(const v of [f.ping,...Object.values(f.rd||{}),...(f.msgs||[]).map(x=>x.at)])if(v&&v>o.at)o.at=v;if(chMine(p))o.here=1}
  const rows=Object.entries(P).sort((a,b)=>b[1].at.localeCompare(a[1].at)).map(([v,o])=>`<div class="ch-r">${cmAv(v)}<span class="ch-rt"><b>${esc(cmName(v))}${v===u?' (คุณ)':''}</b><small>${o.d.size} เครื่อง${o.here?' รวมเครื่องนี้':''} · ${o.n} ข้อความเดือนนี้</small></span><span class="ch-rm">${o.at?esc(chTime(o.at)+(iso(new Date(o.at))===today()?'':' '+chHM(o.at))):''}</span></div>`).join('');
  const row=(k,v)=>`<div class="ch-nr"><span>${k}</span><b>${v}</b></div>`;
  return `<header class="ch-rh"><button type="button" class="ch-bk" data-a="chBack" aria-label="กลับไปรายการห้อง">‹</button><span class="ch-di ch-apic" aria-hidden="true">ⓘ</span><div><b>การเชื่อมต่อแชท</b><small>ให้ทุกเครื่องตรวจหน้านี้แล้วเทียบกัน</small></div><button type="button" class="ch-x" data-a="chClose" aria-label="ปิดแชท">✕</button></header>
  <div class="ch-bd">${chNote()}<div class="ch-net">${row('บริษัท',esc(CO().name||''))}${row('ที่เก็บข้อความ',esc(where))}${row('คุณคือ',esc(cmName(u)))}${row('รหัสเครื่องนี้',esc(CHDEV))}
    ${row('รับส่งได้ล่าสุด',CH.okAt?esc(chHM(new Date(CH.okAt).toISOString())):'ยังไม่เคย')}${sbOn()?row('ส่งถึงทันที',RT.ok?'เชื่อมต่อแล้ว ✓'+(RT.n?` <small>· ได้รับ ${RT.n} ครั้ง ล่าสุด ${esc(new Date(RT.got).toLocaleTimeString('th-TH'))}</small>`:''):'ยังไม่เชื่อมต่อ <small>(เช็คเป็นรอบแทน'+(RT.why?' · '+esc(RT.why):'')+')</small>'):''}</div>
    ${u==='admin'&&P.admin&&P.admin.d.size>1?'<p class="ch-warn">มีมากกว่า 1 เครื่องที่เข้าเป็นผู้ดูแลระบบ ในแชททุกเครื่องนี้คือคนเดียวกัน ถ้าอีกเครื่องเป็นของคนอื่น ข้อความจะขึ้นเป็นของตัวเองและไม่มีแจ้งเตือน ให้คนอื่นเข้าระบบด้วยชื่อของตัวเอง</p>':''}
    <button type="button" class="btn" data-a="chNetRun"${N.run?' disabled':''}>${N.run?'กำลังตรวจ…':'ตรวจตอนนี้'}</button>
    ${N.at&&!N.run?`<p class="${N.ok?'ch-ok':'ch-warn'}">${N.ok?`✓ ส่งขึ้นและอ่านกลับได้ (${esc(chHM(N.at))}) พบไฟล์แชท ${N.n} ไฟล์ในเดือนนี้`:'✕ '+esc(N.msg||'ตรวจไม่ผ่าน')}</p>`:''}
    <p class="ch-h">คนที่มีข้อความในที่เก็บนี้ (เดือนนี้)</p>${rows||'<p class="hint">ยังไม่พบใคร</p>'}
    <p class="hint ch-priv">ถ้าไม่เห็นชื่อของอีกคนในรายการนี้ แปลว่าเครื่องของเขายังไม่ได้เปิดแชท หรือเข้าบริษัทอื่น/ที่เก็บข้อมูลอื่นอยู่ ให้เขาเปิดแชทแล้วกด “ตรวจตอนนี้” เหมือนกัน ทั้งสองเครื่องต้องขึ้นชื่อบริษัทและที่เก็บข้อความตรงกัน</p></div>`}
ACT.chNetRun=async()=>{const u=cmMe();if(!u)return;CH.net={run:1};chDraw();const at=new Date().toISOString();
  for(let i=0;CH.busy&&i<50;i++)await new Promise(r=>setTimeout(r,200));CH.busy=true;
  try{if(!chShared())throw new Error('บริษัทนี้ยังเก็บข้อมูลไว้ในเครื่องนี้เท่านั้น ข้อความจะไม่ถึงคนอื่น');
    const d=await chDir();if(!d)throw new Error(CH.dirErr||'เปิดที่เก็บข้อมูลไม่ได้');
    const o=chOwn(chMonth(at),u);o.f.ping=at;CH.dirty.add(o.p);chKeep();await chPush();
    const [m,nm]=o.p.split('/'),md=await d.getDirectoryHandle(m);let n=0,seen=false;
    for await(const [x,eh] of md.entries())if(eh.kind==='file'&&x.endsWith('.json')){n++;if(x===nm)seen=true}
    if(!seen)throw new Error('ส่งขึ้นไปแล้ว แต่อ่านกลับไม่เจอไฟล์ของเครื่องนี้');
    const J=JSON.parse(await (await (await md.getFileHandle(nm)).getFile()).text());if(J.ping!==at)throw new Error('อ่านกลับได้ข้อมูลเก่า ที่เก็บข้อมูลยังไม่อัปเดต');
    await chPull();CH.err='';CH.okAt=Date.now();CH.net={at,ok:1,n}}
  catch(e){console.warn('chat check',e);CH.net={at,ok:0,msg:e&&e.message}}
  finally{CH.busy=false}chBadge();chDraw()};
ACT.chOlder=async()=>{const d=await chDir();if(d){const M=[];try{for await(const [nm,eh] of d.entries())if(eh.kind==='directory'&&/^\d{4}-\d\d$/.test(nm))M.push(nm)}catch(e){}
    const O=M.filter(m=>!CH.months.has(m)).sort().reverse();if(O.length){CH.months.add(O[0]);CH.oldM=O.length-1;CH.allAt=0;await chPull()}else{CH.oldM=0;toast('ไม่มีข้อความเก่ากว่านี้')}}else CH.oldM=0;chDraw()};
setInterval(()=>chSync(false),1000);
document.addEventListener('visibilitychange',()=>{if(!document.hidden){chSync(true);if(CH.open&&CH.view==='room')chSeen()}});
{const r=render;render=function(){const x=r.apply(this,arguments);chBadge();if(CH.open&&!$('#chPop').contains(document.activeElement))chDraw();return x}}
// after the first sync of the data (folder or cloud), fetch the messages too
setTimeout(()=>chSync(true),1500);

