/* ---------- 3.72 สแกนนิ้ว / ใบหน้า: sign in with the device's own Face ID, Touch ID, fingerprint or Windows Hello ----------
   A passkey (WebAuthn) made on this device for one person, while signed in as that person. Its public key sits on the
   person (s.bio, the administrator: co.adminBio) and which people have one on this device is kept on the device (BIOK),
   so the sign-in card shows one button and the browser asks for the finger or face. The scan never leaves the phone or
   computer: the browser only hands back "the owner unlocked this key", and the answer is checked here against the public
   key (challenge, origin, user-verified flag, signature). It proves the owner of the device unlocked it, not whose face it
   was. Like the PIN it puts a name on the work and does not encrypt the data file; the PIN stays as the way back in. */
const BIOK='penum.pm.bio'+DSFX,BIOASK='penum.pm.bioAsk'+DSFX;
const ub64=s=>Uint8Array.from(atob(String(s).replace(/-/g,'+').replace(/_/g,'/')+'='.repeat((4-String(s).length%4)%4)),c=>c.charCodeAt(0));
let BIOAV=false;
(async()=>{try{BIOAV=!!(window.isSecureContext&&window.PublicKeyCredential&&await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable())}catch(e){BIOAV=false}
  const v=$('#view');if(BIOAV&&v&&v.childElementCount)try{render()}catch(e){}})();
const bioWho=w=>w?staffName(w)||'':'ผู้ดูแลระบบ';
const bioKeys=w=>{const C=CO();if(!w)return C.adminBio||(C.adminBio=[]);const s=C.staff.find(x=>x.id===w);return s?(s.bio||(s.bio=[])):[]};
const bioKeysR=w=>{const C=CO();if(!w)return C.adminBio||[];return ((C.staff.find(x=>x.id===w)||{}).bio)||[]};// read only, adds nothing
const bioLoc=()=>{try{const L=JSON.parse(localStorage.getItem(BIOK)||'[]');return Array.isArray(L)?L:[]}catch(e){return []}};
const bioLocSet=L=>{try{localStorage.setItem(BIOK,JSON.stringify(L))}catch(e){}};
// the passkeys on this device that still belong to someone who may sign in
const bioHere=()=>bioLoc().filter(x=>bioKeysR(x.w).some(k=>k.id===x.c)&&(x.w===''||CO().staff.some(s=>s.id===x.w&&s.active!==false)));
const bioHas=w=>BIOAV&&bioHere().some(x=>x.w===w);
const bioDev=()=>{const u=navigator.userAgent;return /iPhone/.test(u)?'iPhone':/iPad/.test(u)?'iPad':/Android/.test(u)?'Android':/Macintosh/.test(u)&&navigator.maxTouchPoints>1?'iPad':/Mac/.test(u)?'Mac':/Windows/.test(u)?'Windows':'อุปกรณ์อื่น'};
const bioName=()=>{const d=bioDev();return d==='iPhone'||d==='iPad'?'Face ID / Touch ID':d==='Mac'?'Touch ID':d==='Windows'?'Windows Hello':'สแกนนิ้ว / ใบหน้า'};
const bioW=()=>{const n=bioName();return /^[A-Z]/.test(n)?' '+n+' ':n};// Thai runs on without a space, an English name gets one
// may this device sign up a passkey for w: only the person, signed in as themselves (the administrator: signed in with the admin PIN)
const bioMay=w=>w?esVerified(w):pinOn()&&authOK()&&PINAUTH&&PINAUTH.id==='';
const bioErr=e=>{const n=e&&e.name;toast(n==='NotAllowedError'||n==='AbortError'?'ยกเลิกการสแกน หรือหมดเวลา ลองใหม่หรือใช้ PIN':n==='InvalidStateError'?'เครื่องนี้ตั้งสแกนไว้แล้ว':
  n==='SecurityError'?'ใช้สแกนได้เฉพาะเมื่อเปิดจากเว็บ https (เช่น fongdabo.github.io) ไม่ใช่ไฟล์ในเครื่อง':'สแกนไม่ได้บนเครื่องนี้ ใช้ PIN แทน')};

// ECDSA signatures come DER encoded; WebCrypto wants r||s, 32 bytes each
function bioRaw(d){let i=2;if(d[1]&0x80)i+=d[1]&0x7f;const o=new Uint8Array(64);
  for(let j=0;j<2;j++){i++;const n=d[i++];let v=d.slice(i,i+n);i+=n;while(v.length>32&&v[0]===0)v=v.slice(1);o.set(v,32*j+32-v.length)}return o}
async function bioCheck(k,a,ch){try{const r=a.response,cd=JSON.parse(new TextDecoder().decode(r.clientDataJSON)),ad=new Uint8Array(r.authenticatorData);
  if(cd.type!=='webauthn.get'||cd.challenge!==b64u(ch)||cd.origin!==location.origin)return false;
  const rp=new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(location.hostname)));
  if(ad.length<37||rp.some((v,i)=>v!==ad[i])||(ad[32]&5)!==5)return false;// same site, user present and verified (finger / face / device PIN)
  const h=new Uint8Array(await crypto.subtle.digest('SHA-256',r.clientDataJSON)),data=new Uint8Array(ad.length+32);data.set(ad);data.set(h,ad.length);
  const ec=k.alg!==-257,key=await crypto.subtle.importKey('spki',ub64(k.pk),ec?{name:'ECDSA',namedCurve:'P-256'}:{name:'RSASSA-PKCS1-v1_5',hash:'SHA-256'},false,['verify']),sig=new Uint8Array(r.signature);
  return await crypto.subtle.verify(ec?{name:'ECDSA',hash:'SHA-256'}:'RSASSA-PKCS1-v1_5',key,ec?bioRaw(sig):sig,data)}catch(e){return false}}
// ask for a scan with the passkeys in L ({c,w}); the person it proves, or null
async function bioGet(L){const ch=crypto.getRandomValues(new Uint8Array(32));
  const a=await navigator.credentials.get({publicKey:{challenge:ch,allowCredentials:L.map(x=>({type:'public-key',id:ub64(x.c),transports:['internal','hybrid']})),userVerification:'required',timeout:60000}});
  const id=b64u(a.rawId),hit=L.find(x=>x.c===id),k=hit&&bioKeysR(hit.w).find(k=>k.id===id);
  return k&&await bioCheck(k,a,ch)?hit:null}
async function bioAdd(w){if(!BIOAV){toast('เครื่องนี้ไม่มีสแกนนิ้วหรือใบหน้าที่เบราว์เซอร์ใช้ได้');return false}
  if(!bioMay(w)){toast('ตั้งได้เฉพาะตอนเข้าระบบด้วยชื่อของคนนั้นเองบนเครื่องนี้');return false}
  const nm=bioWho(w),uid=new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode('penum-pm|'+DSFX+'|'+(CO().name||'')+'|'+(w||'admin')))).slice(0,16);
  try{const cr=await navigator.credentials.create({publicKey:{challenge:crypto.getRandomValues(new Uint8Array(32)),rp:{name:'PENUM PM'},
      user:{id:uid,name:`${nm} · ${CO().name||'PENUM PM'}`,displayName:nm},pubKeyCredParams:[{type:'public-key',alg:-7},{type:'public-key',alg:-257}],
      authenticatorSelection:{authenticatorAttachment:'platform',userVerification:'required',residentKey:'preferred'},
      excludeCredentials:bioKeysR(w).map(k=>({type:'public-key',id:ub64(k.id)})),timeout:90000,attestation:'none'}});
    const r=cr.response,pk=r.getPublicKey&&r.getPublicKey(),alg=r.getPublicKeyAlgorithm?r.getPublicKeyAlgorithm():-7;
    if(!pk||(alg!==-7&&alg!==-257)){toast('เบราว์เซอร์นี้เก่าเกินไปสำหรับการสแกน อัปเดตเบราว์เซอร์ หรือใช้ PIN ต่อไป');return false}
    const k={id:b64u(cr.rawId),pk:b64u(pk),alg,dev:bioDev(),at:new Date().toISOString()};
    bioKeys(w).push(k);bioLocSet([...bioLoc().filter(x=>!(x.w===w&&x.c===k.id)),{c:k.id,w}]);save();render();
    toast(`ตั้งแล้ว ครั้งต่อไป ${nm} เข้าระบบบนเครื่องนี้ด้วย${bioW()}ได้เลย`);return true}
  catch(e){// already on this device (the list on the device was cleared): remember this person's keys again
    if(e&&e.name==='InvalidStateError'){const L=bioLoc();bioKeysR(w).forEach(k=>{if(!L.some(x=>x.c===k.id))L.push({c:k.id,w})});bioLocSet(L);render();toast(`เครื่องนี้ตั้งไว้แล้ว ใช้${bioW()}เข้าระบบได้เลย`);return true}
    bioErr(e);return false}}
function bioDel(w,id){const K=bioKeys(w),i=K.findIndex(k=>k.id===id);if(i<0)return;K.splice(i,1);bioLocSet(bioLoc().filter(x=>x.c!==id));save();render()}

/* sign-in card: one button above the PIN */
{const f=loginScreen;loginScreen=function(){const r=f.apply(this,arguments),H=bioHere();if(!BIOAV||!H.length)return r;
  const c=$('#view section.card');if(!c||c.querySelector('[data-a="bioIn"]'))return r;
  const who=[...new Set(H.map(x=>bioWho(x.w)))].join(', ');
  const at=c.querySelector('.lg-co')||c.querySelector('h2');(at||c).insertAdjacentHTML(at?'afterend':'afterbegin',`<div class="bio-in"><button type="button" class="btn pri" data-a="bioIn"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 11v3M8.5 8.6A5 5 0 0 1 17 12v1.5M7 12a5 5 0 0 1 .4-2M7 15c.6 2 1.3 3.2 2.2 4.4M17 16.5c-.3 1.3-.8 2.4-1.4 3.4M10 13c0 2.6.8 4.6 2 6.6M14 13.5c0 1.7-.3 3.3-.9 4.8M4.5 9.5A8 8 0 0 1 19.6 9M4 14v-1"/></svg>เข้าใช้งานด้วย${bioW()}</button>
    <small class="muted">${esc(who)}</small><p class="bio-or"><span>หรือใส่ PIN</span></p></div>`);return r}}
ACT.bioIn=async()=>{const H=bioHere();if(!H.length)return;
  try{const hit=await bioGet(H);if(!hit){toast('สแกนไม่ผ่าน ใช้ PIN แทน');return}
    const id=hit.w;if(id&&!CO().staff.some(s=>s.id===id&&s.active!==false&&s.pin)){toast('ชื่อนี้ยังไม่มี PIN ให้ผู้ดูแลระบบตั้ง PIN ก่อน');return}
    PINAUTH={id,last:id,at:Date.now(),by:'bio'};authSave();S.me=id;toast(id?`สวัสดีครับ ${staffName(id)}`:'เข้าใช้งานในฐานะผู้ดูแลระบบ');render()}
  catch(e){bioErr(e)}};

/* after a PIN sign-in on a device that can scan: offer it once per person on this device */
{const f=ACT.pinIn;ACT.pinIn=async()=>{await f();const w=PINAUTH&&PINAUTH.id;if(!BIOAV||!pinOn()||!authOK()||w==null||bioHas(w))return;
  let no={};try{no=JSON.parse(localStorage.getItem(BIOASK)||'{}')||{}}catch(e){}if(no[w||'admin'])return;
  dialog(`ครั้งหน้าเข้าด้วย${bioW().trimEnd()}?`,`<p style="margin:0">ไม่ต้องพิมพ์ PIN ทุกครั้ง แตะปุ่มแล้วสแกนนิ้วหรือใบหน้าบนเครื่องนี้ก็เข้าได้เลย</p>
    <p class="hint" style="margin:8px 0 0">ลายนิ้วมือและใบหน้าอยู่ในเครื่องเท่านั้น ไม่ได้ส่งเข้า PENUM ใครที่ตั้งนิ้วหรือใบหน้าไว้ในเครื่องนี้ก็ปลดล็อกได้ จึงควรใช้กับเครื่องส่วนตัว PIN ยังใช้ได้เหมือนเดิม</p>`,
    `<button type="button" class="btn" data-a="bioNo">ไม่ใช้บนเครื่องนี้</button><button type="button" class="btn pri" data-a="bioAdd" data-id="${w}">ตั้งสแกนเลย</button>`)}}
ACT.bioNo=()=>{const w=(PINAUTH&&PINAUTH.id)||'admin';try{const no=JSON.parse(localStorage.getItem(BIOASK)||'{}')||{};no[w]=1;localStorage.setItem(BIOASK,JSON.stringify(no))}catch(e){}$('#dlg').close()};
ACT.bioAdd=async b=>{const w=b&&b.dataset?b.dataset.id||'':S.me||'';if(await bioAdd(w)){const d=$('#dlg');if(d&&d.open)d.close()}};
ACT.bioDel=b=>{const w=b.dataset.id||'',id=b.dataset.k;if(!(bioMay(w)||(esAdmin()&&(!pinOn()||(PINAUTH&&PINAUTH.id==='')))))return;
  const k=bioKeysR(w).find(k=>k.id===id);if(k&&confirm(`เลิกใช้สแกนของ ${bioWho(w)} บน ${k.dev||'เครื่องนั้น'}? เครื่องนั้นจะต้องใช้ PIN แทน`))bioDel(w,id)};

/* ตั้งค่าบริษัท: who has a scan on which device; the person (or administrator for themselves) turns it on for this device */
{const f=CVIEWS.coset;CVIEWS.coset=()=>{const h=f();if(cloudOn()||!CO().adminPin)return h;const C=CO(),adm=esAdmin()&&(!pinOn()||(PINAUTH&&PINAUTH.id===''));
  const R=[...(adm||!S.me?[{w:'',n:'ผู้ดูแลระบบ',r:''}]:[]),...C.staff.filter(s=>s.active!==false&&(adm||s.id===S.me)).map(s=>({w:s.id,n:s.name||s.code||'',r:s.role||''}))]
    .filter(x=>bioKeysR(x.w).length||bioMay(x.w));
  const mine=BIOAV&&bioMay(S.me||'')&&!bioHas(S.me||'');
  return h+`<section class="card" id="bioCard"><h2><span>เข้าระบบด้วยสแกนนิ้ว / ใบหน้า</span><small>ใช้ Face ID, Touch ID, สแกนนิ้วบนมือถือ หรือ Windows Hello ของเครื่องแทนการพิมพ์ PIN และยืนยันลายเซ็นตอนพิมพ์เอกสาร</small></h2>
  ${mine?`<div class="row" style="margin-bottom:10px"><button type="button" class="btn pri" data-a="bioAdd" data-id="${S.me||''}">ตั้ง${bioW()}บนเครื่องนี้ (${esc(bioWho(S.me||''))})</button></div>`:''}
  ${R.length?`<div class="tw"><table><thead><tr><th>ชื่อ</th><th>เครื่องที่ตั้งไว้</th></tr></thead><tbody>${R.map(x=>{const K=bioKeysR(x.w);return `<tr><td>${esc(x.n)}${x.r?`<br><small class="muted">${esc(x.r)}</small>`:''}</td>
    <td>${K.length?K.map(k=>`<span class="bio-k">${esc(k.dev||'')}${bioLoc().some(l=>l.c===k.id)?' <b>(เครื่องนี้)</b>':''} <small class="muted">${k.at?new Date(k.at).toLocaleDateString('th-TH',{dateStyle:'medium'}):''}</small> <button type="button" class="btn sm del" data-a="bioDel" data-id="${x.w}" data-k="${k.id}">เลิกใช้</button></span>`).join(''):'<span class="muted">ยังไม่ได้ตั้ง</span>'}</td></tr>`}).join('')}</tbody></table></div>`:''}
  ${BIOAV?'':'<p class="hint">เครื่องหรือเบราว์เซอร์นี้ไม่มีสแกนนิ้วหรือใบหน้าที่ใช้ได้ ตั้งได้จากมือถือหรือคอมพิวเตอร์ที่มีสแกนนิ้ว / Windows Hello</p>'}
  <p class="hint">แต่ละคนตั้งเองบนเครื่องของตัวเอง หลังเข้าระบบด้วย PIN · ลายนิ้วมือและใบหน้าอยู่ในเครื่องเท่านั้น PENUM เก็บแค่กุญแจสาธารณะไว้ตรวจผล · ใครที่ตั้งนิ้วหรือใบหน้าไว้ในเครื่องนั้นก็ปลดล็อกได้ ระบบยืนยันว่าเป็นเจ้าของเครื่อง ไม่ได้เทียบหน้ากับรูปพนักงาน · PIN ยังใช้ได้เสมอ ${pinOn()?'':'· ใช้ได้เมื่อเปิดการเข้าระบบด้วย PIN'}</p></section>`}}
{const f=CVIEWS.mine;CVIEWS.mine=()=>{const h=f(),u=me();if(!u||!BIOAV||!pinOn()||!bioMay(u.id)||bioHas(u.id))return h;
  return h.replace('<button type="button" class="btn" data-a="helpAll">',`<button type="button" class="btn" data-a="bioAdd" data-id="${u.id}">ตั้ง${bioW()}</button><button type="button" class="btn" data-a="helpAll">`)}}
{const put=()=>{const m=document.querySelector('#moreMenu .menu');if(!m)return;let b=m.querySelector('[data-a="bioAdd"]');
  if(!b){const a=m.querySelector('[data-a="esigEdit"]')||m.querySelector('[data-a="helpAll"]');const html='<button type="button" data-a="bioAdd">ตั้งสแกนนิ้ว / ใบหน้า</button>';if(a)a.insertAdjacentHTML('afterend',html);else m.insertAdjacentHTML('afterbegin',html);b=m.querySelector('[data-a="bioAdd"]')}
  b.dataset.id=S.me||'';b.hidden=!(BIOAV&&pinOn()&&bioMay(S.me||'')&&!bioHas(S.me||''))};
  const r=render;render=function(){const x=r.apply(this,arguments);put();return x}}
if(typeof SBKW==='object')SBKW['co.coset']=(SBKW['co.coset']||'')+' สแกนนิ้ว สแกนหน้า ใบหน้า ลายนิ้วมือ face id touch id fingerprint windows hello passkey';

/* e-signature: a person who has a scan on this device confirms with it instead of typing their PIN */
ACT.bioSig=async b=>{const w=b.dataset.id,L=bioHere().filter(x=>x.w===w);if(!L.length||!ESQ)return;
  try{const hit=await bioGet(L);if(!hit||hit.w!==w){toast('สแกนไม่ผ่าน ใส่ PIN แทน');return}(ESQ.bio||(ESQ.bio={}))[w]=1;esPins()}catch(e){bioErr(e)}};
document.head.insertAdjacentHTML('beforeend',`<style>
.bio-in{display:flex;flex-direction:column;align-items:stretch;gap:6px;margin:4px 0 6px}.bio-in .btn{display:flex;align-items:center;justify-content:center;gap:10px;font-size:16px;padding:12px}
.bio-in svg{width:24px;height:24px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round}.bio-in small{text-align:center}
.bio-or{display:flex;align-items:center;gap:10px;margin:8px 0 2px;color:var(--muted);font-size:13px}.bio-or:before,.bio-or:after{content:"";flex:1;border-top:1px solid var(--line)}
.bio-k{display:inline-flex;align-items:center;gap:6px;margin:2px 10px 2px 0;flex-wrap:wrap}.es-pin .ok{color:var(--ok,#1a7f37);font-weight:600}
</style>`);
if(typeof I18N==='object'&&I18N.en&&I18N.en.x)Object.assign(I18N.en.x,{'เข้าระบบด้วยสแกนนิ้ว / ใบหน้า':'Sign in with fingerprint / face','หรือใส่ PIN':'or enter your PIN',
  'ไม่ใช้บนเครื่องนี้':'Not on this device','ตั้งสแกนเลย':'Set it up','เครื่องที่ตั้งไว้':'Devices','เลิกใช้':'Remove','ยังไม่ได้ตั้ง':'Not set up','ตั้งสแกนนิ้ว / ใบหน้า':'Set up fingerprint / face',
  'สแกนแทน PIN':'Scan instead of PIN','สแกนแล้ว':'Scanned'});

