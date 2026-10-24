/* ---------- 3.61 ลายเซ็นอิเล็กทรอนิกส์: each person keeps a signature, placed on printed documents at print time ----------
   staff.sig = trimmed PNG (white paper made transparent), staff.sigAt / staff.sigBy = when and by whom it was set.
   A person sets their own (เมนู › ลายเซ็นของฉัน, หน้าแรกของฉัน); the administrator can set anyone's (ตั้งค่าบริษัท).
   Printing a document that has signature places asks which signature goes where. A person's own signature goes on
   without a question once they signed in with their PIN (or their cloud account); anyone else's needs that person's PIN.
   Like the PIN itself this is not encryption: the picture sits in the company data file. */
const esStaff=id=>CO().staff.find(s=>s.id===id);
const esAdmin=()=>!S.me&&(!cloudOn()||isAdmin());
const esCanEdit=s=>!!s&&(esAdmin()||S.me===s.id);
// signed in as this person: PIN sign-in, a cloud staff account, or the Microsoft cloud account
const esVerified=id=>!!id&&S.me===id&&((pinOn()&&authOK()&&PINAUTH&&PINAUTH.id===id)||(typeof sbStaffLock==='function'&&sbStaffLock()&&SB.who===id)||(cloudOn()&&!isAdmin()));
// 'ok' = use straight away, 'pin' = needs this person's PIN, '' = cannot be used from here
const esUse=s=>!s||!s.sig?'':esVerified(s.id)?'ok':s.pin?'pin':S.me===s.id?'ok':'';
const ESASK='penum.pm.esigAsk'+DSFX;
const esAsk=()=>{try{return localStorage.getItem(ESASK)!=='0'}catch(e){return true}};

/* the pad: draw with a finger or mouse, or load a scanned / photographed signature */
function esTrim(c){const w=c.width,h=c.height,x=c.getContext('2d'),d=x.getImageData(0,0,w,h),p=d.data;let x0=w,y0=h,x1=-1,y1=-1;
  for(let i=0;i<p.length;i+=4){const r=p[i],g=p[i+1],b=p[i+2];
    // paper (light, low-colour pixels) becomes transparent so the signature sits on the document's own line
    if(p[i+3]<20||(r+g+b>600&&Math.max(r,g,b)-Math.min(r,g,b)<40)){p[i+3]=0;continue}
    const k=i>>2,X=k%w,Y=(k-X)/w;if(X<x0)x0=X;if(X>x1)x1=X;if(Y<y0)y0=Y;if(Y>y1)y1=Y}
  if(x1<0||(x1-x0<8&&y1-y0<8))return null;x.putImageData(d,0,0);
  const m=6,W=x1-x0+1+2*m,H=y1-y0+1+2*m,sc=Math.min(1,700/W,240/H),o=document.createElement('canvas');
  o.width=Math.max(1,Math.round(W*sc));o.height=Math.max(1,Math.round(H*sc));const ox=o.getContext('2d');ox.imageSmoothingQuality='high';
  ox.drawImage(c,x0-m,y0-m,W,H,0,0,o.width,o.height);return o.toDataURL('image/png')}
let ESP=null;
ACT.esigEdit=b=>{const id=(b&&b.dataset&&b.dataset.id)||S.me,s=esStaff(id);
  if(!s){toast('เลือกชื่อผู้ใช้งานที่มุมบนก่อน แล้วค่อยตั้งลายเซ็น');return}
  if(!esCanEdit(s)){toast('ตั้งได้เฉพาะลายเซ็นของตัวเอง หรือให้ผู้ดูแลระบบตั้งให้');return}
  ESP={id,dirty:false};
  dialog(`ลายเซ็นอิเล็กทรอนิกส์ · ${esc(s.name||'')}`,`<p class="hint" style="margin:0">เซ็นในกรอบด้วยนิ้วหรือเมาส์ หรือกด <b>เลือกรูปลายเซ็น</b> (สแกนหรือถ่ายรูปลายเซ็นบนกระดาษขาว ระบบตัดพื้นขาวออกให้) แล้วกดบันทึก ลายเซ็นจะใช้ได้ตอนพิมพ์เอกสาร</p>
  ${s.sig?`<div class="es-cur"><span>ลายเซ็นปัจจุบัน</span><img src="${s.sig}" alt="ลายเซ็นปัจจุบัน"><small class="muted">${s.sigAt?new Date(s.sigAt).toLocaleString('th-TH',{dateStyle:'medium',timeStyle:'short'}):''}</small></div>`:''}
  <canvas id="esPad" width="840" height="300" aria-label="กรอบเซ็นชื่อ"></canvas>
  <div class="row" style="gap:8px;flex-wrap:wrap"><label class="btn sm" style="cursor:pointer">เลือกรูปลายเซ็น (PNG / JPG)<input type="file" id="esFile" accept="image/*" hidden></label><button type="button" class="btn sm" data-a="esClr">ล้างกรอบ</button></div>
  <p class="hint" style="margin:0">${s.pin||pinOn()?'ลายเซ็นของคุณใช้ได้เฉพาะเมื่อเข้าระบบด้วยชื่อคุณ คนอื่นจะใช้ต้องใส่ PIN ของคุณ':'ยังไม่ได้ตั้ง PIN ให้คนนี้ ใครที่เลือกชื่อนี้ที่มุมบนก็ใช้ลายเซ็นได้ ให้ผู้ดูแลระบบตั้ง PIN ที่ ตั้งค่าบริษัท › เข้าระบบด้วย PIN เพื่อกันคนอื่นใช้'}</p>`,
  `${s.sig?'<button type="button" class="btn del" data-a="esDel">ลบลายเซ็น</button>':''}<button type="button" class="btn pri" data-a="esSave">บันทึกลายเซ็น</button>`);
  const c=$('#esPad'),x=c.getContext('2d');x.lineWidth=4.2;x.lineCap='round';x.lineJoin='round';x.strokeStyle='#14306b';let on=false;
  const pt=e=>{const r=c.getBoundingClientRect();return [(e.clientX-r.left)*c.width/r.width,(e.clientY-r.top)*c.height/r.height]};
  c.onpointerdown=e=>{on=true;ESP.dirty=true;try{c.setPointerCapture(e.pointerId)}catch(_){}const [a,b2]=pt(e);x.beginPath();x.moveTo(a,b2);x.lineTo(a+.1,b2+.1);x.stroke()};
  c.onpointermove=e=>{if(!on)return;const [a,b2]=pt(e);x.lineTo(a,b2);x.stroke()};c.onpointerup=c.onpointercancel=()=>{on=false};
  $('#esFile').onchange=e=>{const f=e.target.files&&e.target.files[0];if(!f)return;const u=URL.createObjectURL(f),im=new Image();
    im.onload=()=>{x.clearRect(0,0,c.width,c.height);const k=Math.min(c.width/im.width,c.height/im.height),w=im.width*k,h=im.height*k;
      x.drawImage(im,(c.width-w)/2,(c.height-h)/2,w,h);URL.revokeObjectURL(u);ESP.dirty=true};
    im.onerror=()=>{URL.revokeObjectURL(u);toast('เปิดรูปนี้ไม่ได้ ลองไฟล์ PNG หรือ JPG')};im.src=u}};
ACT.esClr=()=>{const c=$('#esPad');if(c)c.getContext('2d').clearRect(0,0,c.width,c.height);if(ESP)ESP.dirty=false};
ACT.esSave=()=>{const c=$('#esPad'),s=ESP&&esStaff(ESP.id);if(!c||!s)return;if(!esCanEdit(s))return;
  const u=ESP.dirty&&esTrim(c);if(!u){toast('ยังไม่มีลายเซ็นในกรอบ');return}
  s.sig=u;s.sigAt=new Date().toISOString();s.sigBy=S.me||'admin';ESP=null;$('#dlg').close();save();render();toast(`บันทึกลายเซ็นของ ${s.name||''} แล้ว`)};
ACT.esDel=b=>{const s=esStaff((b&&b.dataset.id)||(ESP&&ESP.id));if(!s||!esCanEdit(s))return;if(!confirm(`ลบลายเซ็นของ ${s.name||''}?`))return;
  delete s.sig;delete s.sigAt;delete s.sigBy;ESP=null;const d=$('#dlg');if(d.open)d.close();save();render();toast('ลบลายเซ็นแล้ว')};
ACT.esAsk=b=>{try{localStorage.setItem(ESASK,b.checked?'1':'0')}catch(e){}};
document.addEventListener('change',e=>{if(e.target.id==='esAskCk')ACT.esAsk(e.target)});

/* where people set it: ตั้งค่าบริษัท (administrator: everyone; others: themselves), เมนู, หน้าแรกของฉัน */
{const f=CVIEWS.coset;CVIEWS.coset=()=>{const L=CO().staff.filter(s=>s.active!==false&&(esAdmin()||s.id===S.me));
  return f()+`<section class="card" id="esigCard"><h2><span>ลายเซ็นอิเล็กทรอนิกส์</span><small>เก็บลายเซ็นของแต่ละคนไว้ แล้วเลือกใส่ตอนกดพิมพ์เอกสาร (หนังสือ ใบเบิกงวด ใบเสนอราคา ใบสั่งซื้อ ใบเสร็จ ฯลฯ)</small></h2>
  ${L.length?`<div class="tw"><table><thead><tr><th>ชื่อ</th><th>ตำแหน่ง</th><th>ลายเซ็น</th><th>PIN</th><th></th></tr></thead><tbody>${L.map(s=>`<tr><td>${esc(s.name||s.code||'')}</td><td>${esc(s.role||'')}</td>
    <td>${s.sig?`<img class="es-th" src="${s.sig}" alt="ลายเซ็น ${esc(s.name||'')}">`:'<span class="muted">ยังไม่มี</span>'}</td><td>${s.pin?'ตั้งแล้ว':'<span class="muted">ยังไม่ตั้ง</span>'}</td>
    <td style="white-space:nowrap"><button type="button" class="btn sm${s.sig?'':' pri'}" data-a="esigEdit" data-id="${s.id}">${s.sig?'เปลี่ยน':'ตั้งลายเซ็น'}</button>${s.sig?` <button type="button" class="btn sm del" data-a="esDel" data-id="${s.id}">ลบ</button>`:''}</td></tr>`).join('')}</tbody></table></div>`
    :'<p class="hint">ยังไม่มีรายชื่อพนักงาน เพิ่มที่ บุคคลและแรงงาน › พนักงาน</p>'}
  <p class="hint">ตอนพิมพ์ ระบบถามว่าจะใส่ลายเซ็นของใครในช่องไหน ลายเซ็นของตัวเองใส่ได้ทันทีเมื่อเข้าระบบด้วย PIN ของตัวเอง ลายเซ็นของคนอื่นต้องใส่ PIN ของคนนั้น คนที่ยังไม่มี PIN ใช้ลายเซ็นได้เฉพาะตอนเลือกชื่อตัวเองที่มุมบน</p>
  <label class="ck"><input type="checkbox" id="esAskCk"${esAsk()?' checked':''}> ถามเรื่องลายเซ็นทุกครั้งที่กดพิมพ์ (เครื่องนี้)</label></section>`}}
{const put=()=>{const m=document.querySelector('#moreMenu .menu');if(!m||m.querySelector('[data-a="esigEdit"]'))return;const h=m.querySelector('[data-a="helpAll"]');
  const html='<button type="button" data-a="esigEdit">ลายเซ็นของฉัน</button>';if(h)h.insertAdjacentHTML('afterend',html);else m.insertAdjacentHTML('afterbegin',html)};
  put();const r=render;render=function(){const x=r.apply(this,arguments);put();const b=document.querySelector('#moreMenu [data-a="esigEdit"]');if(b)b.hidden=!me();return x}}
{const f=CVIEWS.mine;CVIEWS.mine=()=>{const h=f(),u=me();if(!u)return h;
  return h.replace('<button type="button" class="btn" data-a="helpAll">',`<button type="button" class="btn" data-a="esigEdit">${u.sig?'ลายเซ็นของฉัน':'ตั้งลายเซ็นของฉัน'}</button><button type="button" class="btn" data-a="helpAll">`)}}
if(typeof SBKW==='object')SBKW['co.coset']=(SBKW['co.coset']||'')+' ลายเซ็น ลายเซ็นอิเล็กทรอนิกส์ ลายมือชื่อ signature e-signature';

/* the signature places on a printed page, in page order:
   "ลงชื่อ ......" written in the text, the letter's blank above (ชื่อ), the dotted .ln lines, the boxes of .sign
   (line on top, title under it) and the empty picture spot of a QA signature */
function esSlots(root){
  const tw=document.createTreeWalker(root,NodeFilter.SHOW_TEXT),hit=[];let n;
  while((n=tw.nextNode()))if(/ลงชื่อ\s*[._]{6,}/.test(n.nodeValue)&&!n.parentElement.closest('.esig-at'))hit.push(n);
  hit.forEach(t=>{const m=t.nodeValue.match(/(ลงชื่อ\s*)([._]{6,})/),a=t.splitText(m.index+m[1].length);a.splitText(m[2].length);
    const sp=document.createElement('span');sp.className='esig-at';a.replaceWith(sp);sp.appendChild(a)});
  const out=[];root.querySelectorAll('.esig-at,.lt-sign .lt-ln,div.ln,.sign>div,.sgp>i').forEach(el=>{
    let box,kind;
    if(el.classList.contains('esig-at')){box=el.closest('.sign>div')||el.parentElement.closest('div')||el.parentElement;kind='at'}
    else if(el.classList.contains('lt-ln')){box=el.closest('.lt-sign');kind='in'}
    else if(el.classList.contains('ln')){if(el.children.length||el.textContent.trim())return;box=el.parentElement;kind='ln'}
    else if(el.tagName==='I'){box=el.closest('.sgp');kind='i'}
    else{if(el.classList.contains('sgp')||el.querySelector('.esig-at'))return;box=el;kind='top'}
    out.push({el,box,kind,label:esLabel(box)})});
  const H=[...root.querySelectorAll('h1,h2')];
  out.forEach(sl=>{let h='';for(const x of H){if(x.compareDocumentPosition(sl.el)&Node.DOCUMENT_POSITION_FOLLOWING)h=x;else break}
    sl.head=h?String(h.textContent||'').replace(/\s+/g,' ').trim().slice(0,70):''});
  return out}
const esLabel=box=>{const P=[],tw=document.createTreeWalker(box,NodeFilter.SHOW_TEXT);let n;while((n=tw.nextNode()))P.push(n.nodeValue);const t=P.join(' ').replace(/วันที่\s*[._]{3,}\s*\/\s*[._]{3,}\s*\/\s*[._]{3,}/g,' ').replace(/\(\s*[._]{3,}\s*\)/g,' ').replace(/[._]{3,}/g,' ')
  .replace(/ลงชื่อ\s*/g,' ').replace(/\s+/g,' ').trim();return t.length>80?t.slice(0,78)+'…':t||'ช่องลงนาม'};
// put one signature in one place; fill a blank (......) with the name and a blank date with today
function esPut(sl,s){const im=document.createElement('img');im.src=s.sig;im.alt='';im.className='esig esig-'+sl.kind;
  if(sl.kind==='top'&&sl.el.parentElement)sl.el.parentElement.classList.add('esig-room');
  if(sl.kind==='i')sl.el.replaceWith(im);
  else{sl.el.classList.add('esig-h');if(sl.kind==='ln'&&sl.box.closest('.pp-s'))im.classList.add('esig-sm');sl.el.appendChild(im)}
  const name=String(s.name||'').trim(),tw=document.createTreeWalker(sl.box,NodeFilter.SHOW_TEXT),T=[];let n,named=!name||sl.box.textContent.includes(name);
  while((n=tw.nextNode()))T.push(n);
  T.forEach(t=>{let v=t.nodeValue;if(!named&&/\(\s*[._]{6,}\s*\)/.test(v)){v=v.replace(/\(\s*[._]{6,}\s*\)/,`(${name})`);named=true}
    v=v.replace(/(วันที่\s*)[._]{3,}\s*\/\s*[._]{3,}\s*\/\s*[._]{3,}/,(m,a)=>a+thD(today()));if(v!==t.nodeValue)t.nodeValue=v});
  const at=sl.kind==='i'?sl.box.querySelector('p')||sl.box:sl.box,oth=esOther(sl.box,name),fr=sl.for===undefined?!!oth&&!named:sl.for,
    role=s.role&&!sl.box.textContent.includes(s.role)?' '+s.role:'',line=(c,t)=>{const d=document.createElement('span');d.className=c;d.textContent=t;at.appendChild(d)};
  // 4.23 someone signs for the person named in the box (user: "ในกรณีคนเซ็นไม่อยู่ให้เขียนว่าแทน"): the box keeps that person's name and says who signed for them
  if(fr&&!named)line('esig-n esig-for',`ลงนามแทนโดย ${name}${s.role?' '+s.role:''}`);
  else{if(!named)line('esig-n',`(${name})${role}`);if(fr)line('esig-n esig-for',`ลงนามแทน${oth?' '+oth:''}`)}}
// the person a box is already made out to, other than the one signing: a staff name in it, or a titled name in brackets
function esOther(box,name){const t=String(box.textContent||'').replace(/\s+/g,' '),me=String(name||'').trim();
  const s=CO().staff.find(x=>{const k=String(x.name||'').trim();return k&&k!==me&&t.includes(k)});if(s)return String(s.name).trim()+(s.role&&t.includes(s.role)?' '+s.role:'');
  const m=t.match(/\(\s*((?:นาย|นางสาว|นาง|น\.ส\.|ดร\.|คุณ|Mr\.?|Mrs\.?|Ms\.?|Miss)\s*[^)]{2,60}?)\s*\)/);return m&&(!me||!m[1].includes(me))?m[1].trim():''}

/* print: when the page has signature places and someone has a signature, ask first */
const esNativePrint=window.print.bind(window);let ESQ=null;
window.print=function(){const root=$('#print');
  const people=CO().staff.filter(s=>s.active!==false&&s.sig);
  if(!root||!people.length||!esAsk())return esNativePrint();
  const slots=esSlots(root);if(!slots.length)return esNativePrint();
  ESQ={slots,people};
  const opt=s=>{const u=esUse(s);return `<option value="${s.id}"${u?'':' disabled'}>${esc(s.name||'')}${s.role?' · '+esc(s.role):''}${u==='pin'?' (ใส่ PIN)':u?'':' (ต้องตั้ง PIN ก่อน)'}</option>`};
  const pre=sl=>{const p=people.find(s=>s.name&&sl.label.includes(String(s.name).trim())&&esUse(s)==='ok');return p?p.id:''};
  let d=$('#esDlg');if(!d){d=document.createElement('dialog');d.id='esDlg';document.body.appendChild(d)}
  d.innerHTML=`<div class="hd"><h2>ใส่ลายเซ็นบนเอกสาร</h2><button type="button" class="x" data-a="esCancel" aria-label="ปิด">✕</button></div>
  <div class="bd"><p class="hint" style="margin:0">เลือกลายเซ็นสำหรับแต่ละช่อง ช่องที่ไม่เลือกจะพิมพ์เป็นช่องว่างให้เซ็นด้วยปากกาเหมือนเดิม</p>
  <div class="es-sl">${slots.map((sl,i)=>`${sl.head&&(!i||slots[i-1].head!==sl.head)?`<h3>${esc(sl.head)}</h3>`:''}<div class="es-r"><span>${esc(sl.label)}</span><span class="es-sel"><select data-es="${i}"><option value="">ไม่ใส่ลายเซ็น</option>${people.map(opt).join('').replace(`value="${pre(sl)}"`,`value="${pre(sl)}" selected`)}</select><label class="es-for" title="คนเซ็นไม่ใช่คนที่มีชื่อในช่องนี้: พิมพ์คำว่า ลงนามแทน ใต้ลายเซ็น"><input type="checkbox" data-esf="${i}"${esForAuto(sl,pre(sl))?' checked':''}> ลงนามแทน</label></span></div>`).join('')}</div>
  <div id="esPins"></div>
  <label class="ck"><input type="checkbox" id="esAskCk" checked> ถามเรื่องลายเซ็นทุกครั้งที่กดพิมพ์ (เครื่องนี้)</label></div>
  <div class="ft"><button type="button" class="btn" data-a="esNone">พิมพ์โดยไม่ใส่ลายเซ็น</button><button type="button" class="btn pri" data-a="esGo">พิมพ์</button></div>`;
  esPins();if(!d.open)d.showModal()};
// tick ลงนามแทน by itself when the box is made out to someone other than the person picked
const esForAuto=(sl,id)=>{const s=id&&esStaff(id);if(!s)return false;const nm=String(s.name||'').trim();return !!esOther(sl.box,nm)&&!(nm&&sl.box.textContent.includes(nm))};
// people picked who need their PIN get a PIN box
function esPins(){const d=$('#esDlg'),box=$('#esPins');if(!d||!box||!ESQ)return;
  const ids=[...new Set([...d.querySelectorAll('select[data-es]')].map(x=>x.value).filter(Boolean))].filter(id=>esUse(esStaff(id))==='pin');
  const keep={};box.querySelectorAll('input[data-pin]').forEach(i=>keep[i.dataset.pin]=i.value);
  // 3.72 a person with a scan on this device can confirm with it instead (bioSig)
  const bio=id=>typeof bioHas==='function'&&bioHas(id),done=id=>ESQ.bio&&ESQ.bio[id];
  box.innerHTML=ids.map(id=>done(id)?`<p class="es-pin">${esc(staffName(id))} <span class="ok">✓ สแกนแล้ว</span></p>`:`<label class="es-pin">PIN ของ ${esc(staffName(id))}<input type="password" inputmode="numeric" autocomplete="off" data-pin="${id}" value="${esc(keep[id]||'')}">${bio(id)?`<button type="button" class="btn sm" data-a="bioSig" data-id="${id}">สแกนแทน PIN</button>`:''}</label>`).join('')}
document.addEventListener('change',e=>{const t=e.target;if(!(t.matches&&t.matches('#esDlg select[data-es]')))return;
  if(t.value&&ESQ){const L=ESQ.slots[+t.dataset.es].label;$('#esDlg').querySelectorAll('select[data-es]').forEach(x=>{if(x!==t&&!x.value&&ESQ.slots[+x.dataset.es].label===L)x.value=t.value})}
  if(ESQ)$('#esDlg').querySelectorAll('select[data-es]').forEach(x=>{const f=$('#esDlg').querySelector(`input[data-esf="${x.dataset.es}"]`);if(f)f.checked=esForAuto(ESQ.slots[+x.dataset.es],x.value)});
  esPins()});
ACT.esCancel=()=>{ESQ=null;const d=$('#esDlg');if(d)d.close()};
ACT.esNone=()=>{ESQ=null;$('#esDlg').close();esNativePrint()};
ACT.esGo=async()=>{const d=$('#esDlg');if(!d||!ESQ)return;const Q=ESQ,pick=[...d.querySelectorAll('select[data-es]')].map(x=>x.value);
  for(const i of d.querySelectorAll('input[data-pin]')){const s=esStaff(i.dataset.pin);if(!s||!s.pin||await pinHash(s.id,(i.value||'').trim())!==s.pin){toast(`PIN ของ ${s?s.name:''} ไม่ถูกต้อง`);i.value='';i.focus();return}}
  pick.forEach((id,i)=>{const s=id&&esStaff(id),f=d.querySelector(`input[data-esf="${i}"]`);if(f)Q.slots[i].for=f.checked;if(s&&s.sig&&esUse(s))esPut(Q.slots[i],s)});
  ESQ=null;d.close();setTimeout(esNativePrint,60)};
document.addEventListener('keydown',e=>{if(e.key==='Enter'&&e.target.matches&&e.target.matches('#esDlg input[data-pin]')){e.preventDefault();ACT.esGo()}});
document.head.insertAdjacentHTML('beforeend',`<style>
#esPad{width:100%;max-width:640px;height:auto;aspect-ratio:840/300;border:1px dashed var(--line);border-radius:10px;background:#fff;touch-action:none;display:block}
.es-cur{display:flex;align-items:center;gap:10px;flex-wrap:wrap}.es-cur img,.es-th{height:44px;max-width:180px;object-fit:contain;background:#fff;border:1px solid var(--line-2,var(--line));border-radius:6px;padding:2px 6px}
.es-sl{display:flex;flex-direction:column;gap:8px}.es-sl .es-r{display:grid;grid-template-columns:1fr minmax(180px,240px);gap:10px;align-items:center;border-bottom:1px solid var(--line);padding-bottom:8px}
.es-sl .es-r>span:first-child{font-size:13px;line-height:1.4}.es-pin{display:flex;gap:10px;align-items:center;margin-top:6px}.es-pin input{width:140px;letter-spacing:4px}
@media (max-width:560px){.es-sl .es-r{grid-template-columns:1fr}}
#print .esig-h{position:relative}
#print img.esig{position:absolute;left:50%;transform:translateX(-50%);height:40px;max-width:92%;width:auto;object-fit:contain;pointer-events:none;border:0}
#print img.esig-top{bottom:calc(100% + 1px)}
#print img.esig-ln{bottom:calc(100% - 4px);height:44px}#print img.esig-ln.esig-sm{height:32px}
#print img.esig-in{bottom:-4px;height:54px}
#print .esig-at{display:inline-block}#print img.esig-at{bottom:0;height:40px;max-width:210px}
#print .sgp img.esig-i{position:static;transform:none}
#print .esig-n{display:block;font-size:.92em;margin-top:2px}#print .esig-for{font-weight:600}
.es-sel{display:flex;flex-direction:column;gap:4px}.es-sl label.es-for{display:flex;gap:6px;font-size:12.5px;color:var(--muted);align-items:center}.es-for input{width:auto}
#print .sign.esig-room{margin-top:48px}
.es-sl h3{font-size:13px;margin:6px 0 0;color:var(--muted)}
</style>`);
if(typeof I18N==='object'&&I18N.en&&I18N.en.x)Object.assign(I18N.en.x,{'ลายเซ็นของฉัน':'My signature','ตั้งลายเซ็นของฉัน':'Set my signature','ลายเซ็นอิเล็กทรอนิกส์':'Electronic signature',
  'ใส่ลายเซ็นบนเอกสาร':'Add signatures to the document','ไม่ใส่ลายเซ็น':'No signature','พิมพ์โดยไม่ใส่ลายเซ็น':'Print without signatures','พิมพ์':'Print','บันทึกลายเซ็น':'Save signature',
  'ลบลายเซ็น':'Delete signature','ล้างกรอบ':'Clear','เลือกรูปลายเซ็น (PNG / JPG)':'Choose a signature image (PNG / JPG)','ตั้งลายเซ็น':'Set signature','เปลี่ยน':'Change','ลายเซ็นปัจจุบัน':'Current signature',
  'ถามเรื่องลายเซ็นทุกครั้งที่กดพิมพ์ (เครื่องนี้)':'Ask about signatures every time I print (this device)','ตั้งแล้ว':'Set','ยังไม่ตั้ง':'Not set','ยังไม่มี':'None'});

