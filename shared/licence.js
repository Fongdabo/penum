/* PENUM รหัสเปิดใช้งาน (licence) for PENUM MEP and PENUM BIM, which ORIEN rents out besides PENUM PM.
   tools/build-pages.mjs puts this file in the <head> of every app whose app.json has "licence", right after
   window.PENUM_LIC = {app, name, keys, work, sample, skip}, so it runs before the app itself (see docs/apps.md).
   - A code is ORIEN's "PNM1.<payload>.<signature>" (ECDSA P-256, made by ORIEN ฝ่ายขาย, checked here with the public key only).
     payload.ap lists the programs it opens, e.g. ["pm","mep","bim"]; a code without ap (issued before PM 3.73) opens PM only.
   - The codes this device has seen are kept in localStorage 'penum.licences' (PENUM PM adds its company's code there too),
     so a company's one code is entered once per device and opens every program it lists.
   - No code for this program: the program stays hidden behind a screen that asks for one. A device that already had work in
     the program when this check first ran there (ORIEN's own) stays free; that is decided once ('penum.licences.first').
   - A notice 30 days before the expiry date, then 7 days' grace, then read-only: the program opens, shows and prints, but
     saves nothing (the storage keys in PENUM_LIC.keys are not written) and typed fields are locked; work saved earlier is
     never touched. A code listed in pm/files/revoked.json (the list PENUM PM reads) turns read-only the same way.
   - A renewal ORIEN sends from ORIEN ฝ่ายขาย to its Supabase, or publishes in pm/files/licences.json (encrypted for the
     holder of the old code), arrives when the program opens online or comes back to the front, as in PENUM PM, so the
     customer does nothing. A link …/mep/#lic=<code> opens the program with the code filled in.
   - Pages matching PENUM_LIC.skip (MEP's 3D view links, #v3d=, which customers send to their own clients) never ask for a code.
   Client-side only, like PENUM PM's licence: it keeps honest customers honest; it cannot stop someone editing the page. */
(()=>{const C=window.PENUM_LIC;if(!C||window.penumLic)return;
if(C.skip&&new RegExp(C.skip).test(location.hash)){window.penumLic={state:()=>({st:'skip'})};return}
const JWK={kty:'EC',crv:'P-256',x:'wyXLWhvzv-0vF50q9rOZ8sMoh2QIg9Nsr_5IpR8f7jo',y:'BI9uqpJjjWVmVLaEgAfXkpOXtdU-Ec7I-zQRJyUeDp4',ext:true,key_ops:['verify']};
const GRACE=7,WARN=30,REG='penum.licences',FIRST='penum.licences.first',PEND='penum.lic.pend.'+C.app,FILES='../pm/files/';
// ORIEN's Supabase (the feedback box's project): renewals sent from ORIEN ฝ่ายขาย, read with the public key (tools/licence-setup.sql)
const SB={url:'https://uejnlxwjqsadbnzdncvb.supabase.co',key:'sb_publishable_0GTUfFnwBuWxjMw7yYULtQ_mhVVhcez'};
const APPN={pm:'PENUM PM',mep:'PENUM MEP',bim:'PENUM BIM'};
const EN=()=>!/^th/i.test(document.documentElement.lang||'th');
const T={menu:['สิทธิ์การใช้งาน','Licence'],sub:['รหัสเปิดใช้งาน','Activation code'],
  gateT:['ใส่รหัสเปิดใช้งานก่อนเริ่มใช้','Enter your activation code to start'],
  gateP:['{0} ต้องมีรหัสเปิดใช้งานจาก ORIEN ใส่ครั้งเดียวในเครื่องนี้ ถ้าได้รับเป็นลิงก์ ให้กดลิงก์นั้น รหัสจะใส่ไว้ให้เอง','{0} needs an activation code from ORIEN, entered once on this device. If you received a link, open it and the code is filled in for you.'],
  other:['รหัสของ <b>{0}</b> ในเครื่องนี้ใช้กับ {1} ยังไม่รวม {2} ติดต่อ ORIEN เพื่อเพิ่มโปรแกรมนี้ แล้วใส่รหัสใหม่ที่นี่','The code of <b>{0}</b> on this device covers {1}, not {2}. Ask ORIEN to add this program, then enter the new code here.'],
  badSt:['รหัสที่เก็บไว้ในเครื่องนี้ไม่ถูกต้อง ใส่รหัสจาก ORIEN อีกครั้ง','The code stored on this device is not valid. Enter the code from ORIEN again.'],
  checking:['กำลังตรวจรหัส…','Checking the code…'],
  bad:['รหัสไม่ถูกต้อง ตรวจว่าคัดลอกมาครบ หรือติดต่อ ORIEN','This code is not valid. Check that it was copied in full, or contact ORIEN.'],
  rev:['รหัสนี้ถูกยกเลิกแล้ว ติดต่อ ORIEN','This code has been cancelled. Contact ORIEN.'],
  expired:['รหัสนี้หมดอายุแล้ว ติดต่อ ORIEN เพื่อต่ออายุ','This code has expired. Contact ORIEN to renew it.'],
  notApp:['รหัสนี้ใช้กับ {0} ไม่รวม {1} (เก็บไว้ในเครื่องนี้ให้โปรแกรมนั้นแล้ว)','This code covers {0}, not {1} (kept on this device for those programs).'],
  okT:['เปิดใช้งาน {0} แล้ว ใช้ได้ถึง {1}','{0} is activated until {1}'],
  co:['บริษัท','Company'],apps:['โปรแกรม','Programs'],until:['ใช้ได้ถึง','Valid until'],cust:['รหัสลูกค้า','Customer code'],pilot:['ทดลองใช้ฟรี','Free trial'],
  expP:['หมดอายุแล้ว','Expired'],left:['อีก {0} วัน','{0} days left'],
  warn:['สิทธิ์ใช้งาน {0} หมดอายุ {1} (อีก {2} วัน) ติดต่อ ORIEN เพื่อต่ออายุ','{0} expires on {1} ({2} days left). Contact ORIEN to renew.'],
  grace:['สิทธิ์ใช้งาน {0} หมดอายุแล้วเมื่อ {1} ใช้ต่อได้อีก {2} วัน หลังจากนั้นเปิดดูและพิมพ์ได้อย่างเดียว','{0} expired on {1}. It works for {2} more days, then it can only show and print.'],
  roExp:['สิทธิ์ใช้งาน {0} หมดอายุแล้ว เปิดดูและพิมพ์ได้อย่างเดียว งานที่แก้จะไม่ถูกบันทึก งานเดิมอยู่ครบ','{0} has expired: it can show and print, but changes are not saved. Your saved work is kept.'],
  roRev:['รหัสเปิดใช้งาน {0} ถูกยกเลิก เปิดดูและพิมพ์ได้อย่างเดียว งานที่แก้จะไม่ถูกบันทึก งานเดิมอยู่ครบ','The {0} code was cancelled: it can show and print, but changes are not saved. Your saved work is kept.'],
  noSave:['ไม่ได้บันทึก: สิทธิ์ใช้งาน {0} หมดอายุ ต่ออายุได้ที่ เมนู › สิทธิ์การใช้งาน','Not saved: the {0} licence has expired. Renew it in Menu › Licence.'],
  noSaveR:['ไม่ได้บันทึก: รหัสเปิดใช้งาน {0} ถูกยกเลิก ดูที่ เมนู › สิทธิ์การใช้งาน','Not saved: the {0} licence code was cancelled. See Menu › Licence.'],
  free:['เครื่องนี้ใช้ {0} ได้ฟรี เพราะมีงานในเครื่องนี้ก่อนเริ่มใช้ระบบรหัส ไม่ต้องใส่รหัส','This device uses {0} free of charge, because it had work in it before activation codes started. No code is needed.'],
  none:['ยังไม่มีรหัสเปิดใช้งานในเครื่องนี้','No activation code on this device yet.'],
  newC:['ใส่รหัสใหม่ (ต่ออายุ หรือเพิ่มโปรแกรม)','Enter a new code (renewal or more programs)'],
  ask:['ยังไม่มีรหัส?','No code yet?'],askP:['ขอรหัสทดลองใช้ฟรี หรือเช่าใช้ ติดต่อ ORIEN','Ask ORIEN for a free trial code or a rental.'],
  month:['บาท/เดือน','THB/month'],line:['ติดต่อทาง LINE','LINE'],mail:['ส่งอีเมล','E-mail'],fb:['ฝากข้อความถึง ORIEN','Message ORIEN'],
  lineD:['คัดลอกข้อความไว้แล้ว เปิด LINE › เพิ่มเพื่อน › ค้นหาไอดี {0} › เปิดแชท › วาง (Ctrl+V) › ส่ง หรือสแกน QR ในหน้าที่เพิ่งเปิดด้วยมือถือ','The message is copied. Open LINE › Add friend › search the ID {0} › open the chat › paste (Ctrl+V) › send, or scan the QR code on the page that just opened.'],
  askH:['ขอรหัสเปิดใช้งาน {0}','Activation code for {0}'],
  askB:['บริษัท: \nผู้ติดต่อ: \nโทร: \nต้องการ: ทดลองใช้ฟรี / เช่าใช้','Company: \nContact person: \nPhone: \nWanted: free trial / rental'],
  renewT:['ORIEN อัปเดตสิทธิ์การใช้งานให้แล้ว ใช้ได้ถึง {0}','ORIEN updated your licence, valid until {0}'],close:['ปิด','Close']};
const t=(k,...a)=>T[k][EN()?1:0].replace(/\{(\d)\}/g,(m,i)=>a[i]);
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const pad=n=>String(n).padStart(2,'0'),today=()=>{const d=new Date();return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate())};
const okD=s=>/^\d{4}-\d\d-\d\d$/.test(s||''),pd=s=>new Date(s+'T00:00:00'),diffD=(a,b)=>Math.round((pd(b)-pd(a))/864e5);
const thD=s=>okD(s)?pd(s).toLocaleDateString(EN()?'en-GB':'th-TH',{day:'numeric',month:'long',year:'numeric'}):'–';

// storage: this script's own writes always go through; the program's are dropped while it is locked (no code, or read-only)
let LSO=null;try{LSO=window.localStorage}catch(e){}
const SET=Storage.prototype.setItem,DEL=Storage.prototype.removeItem;
const get=k=>{try{return LSO?LSO.getItem(k):null}catch(e){return null}};
const put=(k,v)=>{try{SET.call(LSO,k,v);return true}catch(e){return false}};
const ss=(k,v)=>{try{if(v===undefined)return sessionStorage.getItem(k)||'';v===null?sessionStorage.removeItem(k):sessionStorage.setItem(k,v)}catch(e){return ''}};
const BLOCK=new Set(C.keys||[]);let LOCK=false;
Storage.prototype.setItem=function(k){if(LOCK&&this===LSO&&BLOCK.has(String(k))){noSave();return}return SET.apply(this,arguments)};
Storage.prototype.removeItem=function(k){if(LOCK&&this===LSO&&BLOCK.has(String(k)))return;return DEL.apply(this,arguments)};

// codes
const b64=s=>{s=String(s).replace(/-/g,'+').replace(/_/g,'/');while(s.length%4)s+='=';const b=atob(s),u=new Uint8Array(b.length);for(let i=0;i<b.length;i++)u[i]=b.charCodeAt(i);return u};
const norm=c=>String(c||'').replace(/\s+/g,'').replace(/^.*[#&]lic=/,'');
const RE=/^PNM1\.([A-Za-z0-9_-]+)\.([A-Za-z0-9_-]+)$/;
// what a code says, before its signature is checked
const peek=c=>{const m=RE.exec(norm(c));if(!m)return null;try{const p=JSON.parse(new TextDecoder().decode(b64(m[1])));return p&&p.v===1&&p.co&&okD(p.exp)?p:null}catch(e){return null}};
const apOf=p=>Array.isArray(p.ap)&&p.ap.length?p.ap.map(String):['pm'],has=(p,a)=>apOf(p).includes(a);
const base=id=>String(id||'').replace(/-R\d+$/,''),who=p=>base(p.id)||p.co,rank=p=>String(p.iat||'')+'|'+String(p.exp||'');
let KEY=null;const VER={};
async function verify(code){code=norm(code);if(VER[code])return VER[code];let r={ok:false,code};
  try{const m=RE.exec(code),p=peek(code);if(m&&p){KEY=KEY||await crypto.subtle.importKey('jwk',JWK,{name:'ECDSA',namedCurve:'P-256'},false,['verify']);
    if(await crypto.subtle.verify({name:'ECDSA',hash:'SHA-256'},KEY,b64(m[2]),new TextEncoder().encode('PNM1.'+m[1])))r={ok:true,p,code}}}catch(e){}
  return VER[code]=r}
// revoked serials and customer codes (the same rule as PENUM PM's licRevHit)
let REV=[];try{REV=JSON.parse(get('penum.revoked')||'[]').map(String)}catch(e){}
const revHit=(x,p)=>{const id=String(p.id),m=/^(.+)<(\d{4}-\d\d-\d\d)$/.exec(x);if(m)return (m[1]===id||m[1]===base(id))&&String(p.iat||'')<m[2];return x===p.no||x===id||x===p.sn||x===base(id)};
const revoked=p=>REV.some(x=>revHit(x,p));
// the device's codes: one per customer, the newest, so a renewal or a code with more programs replaces the older one
const regGet=()=>{try{const a=JSON.parse(get(REG)||'[]');return Array.isArray(a)?a.filter(c=>typeof c==='string'&&peek(c)):[]}catch(e){return []}};
const MEM=new Set();// codes typed in this window, for a browser that cannot keep them (private window, storage blocked)
function regAdd(code){code=norm(code);const p=peek(code);if(!p)return false;MEM.add(code);const L=regGet();if(L.includes(code))return false;
  const same=L.filter(c=>who(peek(c))===who(p));if(same.some(c=>rank(peek(c))>rank(p)))return false;
  return put(REG,JSON.stringify(L.filter(c=>!same.includes(c)).concat(code)))}

// a device that had work in this program before codes came stays free (decided the first time this runs here)
function hadWork(){const s=C.work&&get(C.work);if(!s)return false;if(!C.sample)return true;
  try{const j=JSON.parse(s);return !Object.keys(C.sample).every(k=>k.split('.').reduce((o,x)=>o==null?o:o[x],j)===C.sample[k])}catch(e){return true}}
let FREE=false;{let F={};try{F=JSON.parse(get(FIRST)||'{}')||{}}catch(e){}
  if(!F[C.app]){F[C.app]={at:today(),free:hadWork()?1:0};put(FIRST,JSON.stringify(F))}FREE=!!F[C.app].free}

// the state: free | ok | warn | grace | ro (expired past the grace days, or revoked) | none (no code for this program)
let S={st:'wait',real:'',p:null,code:'',why:'',other:[]},UI=false;
function decide(R){const mine=R.filter(x=>has(x.p,C.app)&&x.sig!==false),live=mine.filter(x=>!revoked(x.p)).sort((a,b)=>a.p.exp<b.p.exp?1:a.p.exp>b.p.exp?-1:0);
  const x=live[0]||mine[0];let st='none',why=R.some(y=>y.sig===false&&has(y.p,C.app))?'bad':'';
  if(live[0]){const d=diffD(today(),x.p.exp);st=d<-GRACE?'ro':d<0?'grace':d<=WARN?'warn':'ok';why=st==='ro'?'exp':''}else if(x){st='ro';why='rev'}
  return {st:FREE?'free':st,real:st,p:x?x.p:null,code:x?x.code:'',why,other:R.filter(y=>!has(y.p,C.app)&&!revoked(y.p)).map(y=>y.p)}}
const all=()=>{const L=regGet();MEM.forEach(c=>{if(!L.includes(c))L.push(c)});return L.map(code=>({code,p:peek(code)}))};
function apply(n){const was=S.st;S=n;LOCK=n.st==='none'||n.st==='ro';document.documentElement.classList.toggle('plk-hide',n.st==='none');if(UI)paint(was)}
async function recheck(){const R=all();await Promise.all(R.map(async x=>{if(has(x.p,C.app))x.sig=(await verify(x.code)).ok}));apply(decide(R))}
// what the stored codes say decides at once whether the program shows; the signatures are checked right after
apply(decide(all()));

// a link with #lic=<code>: keep the code for this tab and take it out of the address
{const m=location.hash.match(/(?:^#|&)lic=([^&]+)/);if(m){ss(PEND,decodeURIComponent(m[1]));
  try{history.replaceState(null,'',location.pathname+location.search+location.hash.replace(/(^#|&)lic=[^&]*/,'$1').replace(/^#&/,'#').replace(/^#$/,''))}catch(e){}}}

const CSS=`html.plk-hide body{visibility:hidden!important}html.plk-hide #plk,html.plk-hide .pfb,html.plk-hide .pu-bar,html.plk-hide .pu-dlg,html.plk-hide .plk-toast{visibility:visible!important}
/* look shared with PENUM MEP v103: light page with soft colour glows, a raised white card, gradient accents; :root[data-theme="dark"] gets the dark variant */
#plk{--k-ink:#0F1E2E;--k-mut:#5B697C;--k-line:#E2E8F1;--k-sunk:#F5F7FB;--k-card:#fff;--k-acc:#0B7F8C;--k-g:linear-gradient(120deg,#14B8A6 0%,#0EA5E9 55%,#6366F1 100%);
  position:fixed;inset:0;z-index:2147482000;display:flex;padding:20px 16px calc(20px + env(safe-area-inset-bottom,0px));overflow:auto;color:var(--k-ink);font:15px/1.6 FONT;-webkit-font-smoothing:antialiased;
  background:radial-gradient(520px 420px at 0% 0%,rgba(20,184,166,.20),transparent 65%),radial-gradient(520px 460px at 100% 12%,rgba(99,102,241,.18),transparent 65%),radial-gradient(600px 420px at 50% 105%,rgba(14,165,233,.16),transparent 65%),#F4F6FB}
#plk *,.plk-dlg *{box-sizing:border-box}
.plk-c{position:relative;margin:auto;background:var(--k-card);border:1px solid rgba(226,232,241,.9);border-radius:24px;padding:26px 22px 22px;width:100%;max-width:460px;display:flex;flex-direction:column;gap:12px;overflow:hidden;
  box-shadow:0 1px 0 #fff inset,0 2px 4px rgba(15,30,46,.05),0 12px 24px -12px rgba(15,30,46,.12),0 40px 80px -30px rgba(15,30,46,.35)}
.plk-c::before{content:"";position:absolute;left:0;right:0;top:0;height:5px;background:var(--k-g)}
.plk-top{display:flex;gap:14px;align-items:center}.plk-top img{width:52px;height:52px;border-radius:14px;box-shadow:0 8px 18px -8px rgba(15,30,46,.5)}.plk-top b{display:block;font-size:18px;letter-spacing:.01em}
.plk-top small{display:inline-block;margin-top:2px;color:var(--k-acc);background:rgba(20,184,166,.12);font-size:12.5px;font-weight:600;padding:1px 10px;border-radius:999px}
#plk h1{margin:6px 0 0;font-size:23px;line-height:1.35;font-weight:700}#plk p{margin:0}#plk h1+p{color:var(--k-mut);font-size:14.5px}
.plk-c textarea,.plk-dlg textarea{font:14px/1.5 ui-monospace,Consolas,monospace;color:var(--k-ink,#0F1E2E);padding:12px 14px;border:1.5px solid var(--k-line,#E2E8F1);border-radius:14px;background:var(--k-sunk,#F5F7FB);width:100%;resize:vertical;min-height:84px;transition:border-color .15s,box-shadow .15s}
.plk-c textarea::placeholder{color:#94A3B8}
.plk-c textarea:focus,.plk-dlg textarea:focus{outline:none;border-color:#0EA5E9;background:var(--k-card,#fff);box-shadow:0 0 0 4px rgba(14,165,233,.16)}
.plk-note{background:#FFF7EA;border:1px solid #F6D9A8;border-left:4px solid #F59E0B;color:#7A4A0B;border-radius:12px;padding:10px 14px;font-size:14px}
.plk-bad{color:#B42318;font-weight:600;margin:6px 0 0!important}.plk-mut{color:#5B697C;font-size:13.5px}
.plk-i{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:6px 16px;margin:4px 0 0;padding:12px 14px;border:1px solid #E2E8F1;border-radius:14px;background:#F8FAFD}
.plk-i.ok{border-color:#9FD8B5;background:#EEF8F1}.plk-i dt{font-size:12px;color:#5B697C}.plk-i dd{margin:0;font-weight:600;font-size:14px;overflow-wrap:anywhere}
.plk-pill{display:inline-block;font-size:12px;font-weight:600;padding:0 8px;border-radius:999px}.plk-pill.warn{background:#FBEEDD;color:#A45A12}.plk-pill.bad{background:#F8E3E3;color:#B42318}
.plk-ask{margin-top:4px;padding:14px;border-radius:16px;background:var(--k-sunk,#F5F7FB);border:1px solid var(--k-line,#E2E8F1);display:flex;flex-direction:column;gap:8px;font-size:14px}
.plk-ask>b{font-size:15px}.plk-ask>span{color:var(--k-mut,#5B697C)}
.plk-pr{align-self:flex-start;color:#0B6E7A;font-weight:600;background:rgba(20,184,166,.12);border-radius:10px;padding:6px 10px;line-height:1.5}
.plk-row{display:flex;gap:8px;flex-wrap:wrap}.plk-row .plk-b{flex:1 1 130px}.plk-hint{color:#5B697C;font-size:13px}
.plk-b{font:inherit;font-size:14px;min-height:42px;padding:8px 14px;border-radius:12px;border:1px solid #E2E8F1;background:#fff;color:#0F1E2E;cursor:pointer;white-space:nowrap;box-shadow:0 1px 0 #fff inset,0 2px 6px -2px rgba(15,30,46,.14);transition:transform .15s,box-shadow .15s,border-color .15s}
.plk-b:hover{border-color:#0EA5E9}.plk-b:active{transform:translateY(1px)}
.plk-b.pri{background:linear-gradient(120deg,#14B8A6,#0EA5E9 55%,#6366F1);border-color:transparent;color:#fff;font-weight:600;box-shadow:0 8px 18px -8px rgba(14,165,233,.7)}
.plk-b.ln{background:linear-gradient(135deg,#22D36B,#06C755);border-color:transparent;color:#fff;font-weight:600;box-shadow:0 8px 18px -8px rgba(6,199,85,.7)}
.plk-ban{position:fixed;left:12px;bottom:calc(12px + env(safe-area-inset-bottom,0px));z-index:2147481000;display:flex;gap:8px;align-items:center;flex-wrap:wrap;max-width:min(560px,calc(100% - 24px));padding:8px 8px 8px 14px;border-radius:14px;
  font:13.5px/1.45 FONT;color:#0F1E2E;box-shadow:0 12px 30px -10px rgba(8,20,40,.35)}
.plk-ban span{flex:1 1 220px}.plk-ban.warn{background:#FFF7EA;border:1px solid #F6D9A8}.plk-ban.bad{background:#FDECEC;border:1px solid #E9B8AE}
.plk-ban .plk-b{min-height:0;padding:4px 10px;font-size:13px}.plk-x{border:none;background:none;font-size:20px;line-height:1;cursor:pointer;color:#5B697C;padding:0 6px}
.plk-dlg{border:none;border-radius:20px;padding:0;width:min(500px,calc(100% - 24px));max-height:calc(100% - 24px);color:#0F1E2E;background:#fff;box-shadow:0 30px 80px -20px rgba(8,20,40,.45);font:15px/1.55 FONT;overflow:hidden}
.plk-dlg::backdrop{background:rgba(15,30,46,.4);-webkit-backdrop-filter:blur(3px);backdrop-filter:blur(3px)}.plk-hd{padding:18px 18px 12px;border-bottom:1px solid #E2E8F1;background:linear-gradient(120deg,#E7F8F6,#EAF4FE 55%,#EEEEFE);border-top:5px solid transparent;border-image:linear-gradient(120deg,#14B8A6,#0EA5E9 55%,#6366F1) 1 0 0 0}.plk-hd b{font-size:17px;display:block}.plk-hd small{color:#5B697C;font-size:13px}
.plk-bd{padding:14px 18px;display:flex;flex-direction:column;gap:10px;overflow:auto;max-height:calc(100vh - 180px)}.plk-bd p{margin:0}.plk-bd details summary{cursor:pointer;color:#0B7F8C;font-weight:600;font-size:14px}.plk-bd details[open] summary{margin-bottom:6px}
.plk-ft{display:flex;gap:8px;flex-wrap:wrap;padding:12px 18px 16px;border-top:1px solid #E2E8F1}
.plk-toast{position:fixed;left:50%;bottom:calc(70px + env(safe-area-inset-bottom,0px));transform:translateX(-50%);z-index:2147483001;max-width:calc(100% - 24px);background:#0F1E2E;color:#fff;padding:9px 18px;border-radius:999px;font:14px/1.45 FONT;opacity:0;transition:opacity .2s;pointer-events:none;text-align:center;box-shadow:0 10px 24px -8px rgba(0,0,0,.4)}.plk-toast.on{opacity:1}
:root[data-theme="dark"] #plk{--k-ink:#EEF3F9;--k-mut:#95A5BA;--k-line:#1D2735;--k-sunk:#0B111A;--k-card:#0F1621;--k-acc:#22D3EE;
  background:radial-gradient(520px 420px at 0% 0%,rgba(34,211,238,.14),transparent 65%),radial-gradient(520px 460px at 100% 12%,rgba(129,140,248,.14),transparent 65%),#070B12}
:root[data-theme="dark"] .plk-c{border-color:#1D2735;box-shadow:0 1px 0 rgba(255,255,255,.05) inset,0 40px 80px -30px rgba(0,0,0,.9)}
:root[data-theme="dark"] .plk-top small,:root[data-theme="dark"] .plk-pr{color:#67E8F9;background:rgba(34,211,238,.12)}
:root[data-theme="dark"] .plk-ask .plk-b:not(.ln){background:#0F1621;color:#EEF3F9;border-color:#1D2735;box-shadow:none}
@media (max-width:420px){#plk{padding:12px 10px calc(12px + env(safe-area-inset-bottom,0px))}.plk-c{padding:24px 18px 18px;border-radius:22px}#plk h1{font-size:21px}}
@media print{#plk,.plk-ban,.plk-toast{display:none!important}}`.replace(/FONT/g,'"IBM Plex Sans Thai","Anuphan","Sarabun","Noto Sans Thai","Leelawadee UI",Tahoma,sans-serif');
{const st=document.createElement('style');st.textContent=CSS;(document.head||document.documentElement).appendChild(st)}

function toast(m){let el=document.querySelector('.plk-toast');if(!el){if(!document.body)return;el=document.createElement('div');el.className='plk-toast';el.setAttribute('data-noxl','');el.setAttribute('role','status');document.body.appendChild(el)}
  el.textContent=m;el.classList.add('on');clearTimeout(toast.t);toast.t=setTimeout(()=>el.classList.remove('on'),3200)}
function noSave(){if(S.st!=='ro'||Date.now()-(noSave.t||0)<60e3)return;noSave.t=Date.now();setTimeout(()=>toast(t(S.why==='rev'?'noSaveR':'noSave',C.name)),0)}
const fmt=n=>Number(n||0).toLocaleString(EN()?'en-US':'th-TH');
function info(p,cls=''){const d=diffD(today(),p.exp);
  return `<dl class="plk-i ${cls}"><div><dt>${t('co')}</dt><dd>${esc(p.co)}</dd></div><div><dt>${t('apps')}</dt><dd>${apOf(p).map(a=>esc(APPN[a]||a)).join(' · ')}${p.pl==='pilot'?` <span class="plk-pill warn">${t('pilot')}</span>`:''}</dd></div>
  <div><dt>${t('until')}</dt><dd>${thD(p.exp)}${d<0?` <span class="plk-pill bad">${t('expP')}</span>`:d<=WARN?` <span class="plk-pill warn">${t('left',d)}</span>`:''}</dd></div>${p.id?`<div><dt>${t('cust')}</dt><dd>${esc(p.sn||base(p.id))}</dd></div>`:''}${p.no?`<div><dt>Serial number</dt><dd>${esc(p.no)}</dd></div>`:''}</dl>`}

// prices and how to reach ORIEN, from pm/files/plans.json (the file PENUM PM reads; PM keeps the last copy in 'penum.plans')
let PL=null;try{PL=JSON.parse(get('penum.plans')||'null')}catch(e){}
const contact=()=>Object.assign({email:'fong101dt@gmail.com',lineOA:'@xhg5783r'},(PL&&PL.contact)||{});
function ask(){const P=PL||{},c=contact(),A=(Array.isArray(P.apps)?P.apps:[]).find(x=>x&&x.k===C.app),B=P.bundle,pr=[];
  if(A&&A.price!=null)pr.push(`${esc(A.name||C.name)} ${fmt(A.price)} ${t('month')}`);if(B&&B.txt)pr.push(esc(B.txt));
  return `<div class="plk-ask"><b>${t('ask')}</b><span>${t('askP')}</span>${pr.length?`<div class="plk-pr">${pr.join(' · ')}</div>`:''}
  <div class="plk-row">${c.lineOA?`<button type="button" class="plk-b ln" data-plk="line">${t('line')}</button>`:''}${c.email?`<button type="button" class="plk-b" data-plk="mail">${t('mail')}</button>`:''}${window.penumFB?`<button type="button" class="plk-b" data-plk="fb">${t('fb')}</button>`:''}</div><div class="plk-hint" data-plk-ask></div></div>`}
const askText=()=>t('askH',C.name)+'\n\n'+t('askB');
const mob=()=>/Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
async function copyT(s){try{await navigator.clipboard.writeText(s);return true}catch(e){const a=document.createElement('textarea');a.value=s;document.body.appendChild(a);a.select();let ok=false;try{ok=document.execCommand('copy')}catch(x){}a.remove();return ok}}

// checking a typed or linked code; a valid one is kept on the device even when it is for the other programs
async function tryCode(v,out){v=norm(v);if(!out)return;if(!v){out.innerHTML='';return}
  out.innerHTML=`<p class="plk-mut">${t('checking')}</p>`;const r=await verify(v);
  if(!r.ok){out.innerHTML=`<p class="plk-bad">${t('bad')}</p>`;return}
  const p=r.p;if(revoked(p)){out.innerHTML=info(p)+`<p class="plk-bad">${t('rev')}</p>`;return}
  if(diffD(today(),p.exp)<-GRACE){out.innerHTML=info(p)+`<p class="plk-bad">${t('expired')}</p>`;return}
  regAdd(r.code);ss(PEND,null);
  if(!has(p,C.app)){out.innerHTML=info(p)+`<p class="plk-bad">${t('notApp',apOf(p).map(a=>APPN[a]||a).join(', '),esc(C.name))}</p>`;return}
  out.innerHTML=info(p,'ok');await recheck();toast(t('okT',C.name,thD(p.exp)))}

// keys, paste and typing inside the code screens never reach the program underneath (its shortcuts, its paste)
const own=el=>{['keydown','keyup','keypress','input','change','paste','copy','cut','click'].forEach(k=>el.addEventListener(k,e=>{if(k==='input'&&/^plk(In|New)$/.test(e.target.id)){const x=e.target;clearTimeout(x._t);x._t=setTimeout(()=>tryCode(x.value,el.querySelector(x.id==='plkIn'?'#plkR':'#plkNewR')),250)}
  if(k==='click')act(e);e.stopPropagation()}))};
async function act(e){const b=e.target.closest&&e.target.closest('[data-plk]');if(!b)return;const k=b.dataset.plk,c=contact(),out=b.closest('.plk-ask')&&b.closest('.plk-ask').querySelector('[data-plk-ask]');
  if(k==='line'){const id=String(c.lineOA).startsWith('@')?c.lineOA:'@'+c.lineOA;if(mob()){open(`https://line.me/R/oaMessage/${encodeURIComponent(id)}/?${encodeURIComponent(askText())}`,'_blank');return}
    await copyT(askText());open(`https://line.me/R/ti/p/${encodeURIComponent(id)}`,'_blank');if(out)out.textContent=t('lineD',id)}
  if(k==='mail')location.href=`mailto:${c.email}?subject=${encodeURIComponent(t('askH',C.name))}&body=${encodeURIComponent(askText())}`;
  if(k==='fb'&&window.penumFB){try{if(!get('penum.fb.draft'))put('penum.fb.draft',askText())}catch(x){}penumFB.open('other')}
  if(k==='close'){const d=b.closest('dialog');d&&d.close()}
  if(k==='open')openDlg();
  if(k==='hide'){S.st==='warn'?put('penum.lic.ban.'+C.app,today()):ss('penum.lic.ban.'+C.app,S.st);paintBan()}}

function paintGate(){let g=document.getElementById('plk');if(S.st!=='none'){if(g)g.remove();return}
  const keep=g&&g.querySelector('#plkIn'),val=keep?keep.value:ss(PEND),o=S.other[0];
  const note=o?t('other',esc(o.co),apOf(o).map(a=>APPN[a]||a).join(', '),esc(C.name)):S.why==='bad'?t('badSt'):'';
  if(!g){g=document.createElement('div');g.id='plk';g.setAttribute('data-noxl','');g.setAttribute('role','dialog');g.setAttribute('aria-modal','true');g.setAttribute('aria-labelledby','plkT');document.body.appendChild(g);own(g)}
  const ic=(document.querySelector('link[rel="icon"]')||{}).href||'';
  g.innerHTML=`<div class="plk-c"><div class="plk-top">${ic?`<img src="${esc(ic)}" alt="">`:''}<div><b>${esc(C.name)}</b><small>${t('sub')}</small></div></div>
  <h1 id="plkT">${t('gateT')}</h1><p>${t('gateP',esc(C.name))}</p>${note?`<p class="plk-note">${note}</p>`:''}
  <textarea id="plkIn" rows="3" placeholder="PNM1.…" spellcheck="false" autocomplete="off" aria-label="${t('sub')}">${esc(val)}</textarea><div id="plkR"></div>${ask()}</div>`;
  if(val)tryCode(val,g.querySelector('#plkR'));else setTimeout(()=>{const i=g.querySelector('#plkIn');if(i)i.focus()},60)}

function paintBan(){let b=document.getElementById('plkBan');const p=S.p,d=p?diffD(today(),p.exp):0,k='penum.lic.ban.'+C.app;
  const x=S.st==='warn'?[t('warn',C.name,thD(p.exp),d),'warn']:S.st==='grace'?[t('grace',C.name,thD(p.exp),GRACE+d),'bad']:S.st==='ro'?[t(S.why==='rev'?'roRev':'roExp',C.name),'bad']:null;
  if(!x||(S.st==='warn'?get(k)===today():ss(k)===S.st)){if(b)b.remove();return}
  if(!b){b=document.createElement('div');b.id='plkBan';b.setAttribute('data-noxl','');b.setAttribute('role','status');document.body.appendChild(b);own(b)}
  b.className='plk-ban '+x[1];b.innerHTML=`<span>${esc(x[0])}</span><button type="button" class="plk-b" data-plk="open">${t('menu')}</button><button type="button" class="plk-x" data-plk="hide" aria-label="${t('close')}">×</button>`}

// read-only: typed fields (not buttons, lists or tick boxes, which move around the work) are locked
const FREEF=new Set(['button','submit','reset','checkbox','radio','file','range','color','search','hidden','image']);
function lockF(root){const L=root.matches&&root.matches('input,textarea')?[root]:root.querySelectorAll?root.querySelectorAll('input,textarea'):[];
  L.forEach(e=>{if(e.disabled||FREEF.has((e.type||'').toLowerCase())||e.closest('#plk,.plk-dlg,.plk-ban,.pfb,.pu-dlg'))return;e.disabled=true;e.setAttribute('data-plk-ro','')})}
const fObs=new MutationObserver(ms=>{if(S.st==='ro')ms.forEach(m=>m.addedNodes.forEach(n=>{if(n.nodeType===1)lockF(n)}))});

function putMenu(){if(document.querySelector('[data-penum-lic]'))return;const m=document.querySelector('#moreMenu .menu,#appMenu .amenu');if(!m)return;
  const u=m.querySelector('[data-penum-upd]'),h=`<button type="button" data-penum-lic data-noxl>${t('menu')}</button>`;u?u.insertAdjacentHTML('afterend',h):m.insertAdjacentHTML('afterbegin',h)}

let DLG=null;
function openDlg(){if(!DLG){DLG=document.createElement('dialog');DLG.className='plk-dlg';DLG.setAttribute('data-noxl','');document.body.appendChild(DLG);own(DLG)}
  const p=S.p,st=S.st,msg=st==='free'?`<p>${t('free',esc(C.name))}</p>`:st==='ro'?`<p class="plk-bad">${t(S.why==='rev'?'roRev':'roExp',esc(C.name))}</p>`:st==='grace'?`<p class="plk-bad">${t('grace',esc(C.name),thD(p.exp),GRACE+diffD(today(),p.exp))}</p>`:!p?`<p>${t('none')}</p>`:'';
  DLG.innerHTML=`<div class="plk-hd"><b>${t('menu')}</b><small>${esc(C.name)}</small></div>
  <div class="plk-bd">${msg}${p?info(p):''}<details${(!p&&st!=='free')||st==='ro'||st==='grace'||ss(PEND)?' open':''}><summary>${t('newC')}</summary><textarea id="plkNew" rows="3" placeholder="PNM1.…" spellcheck="false" autocomplete="off">${esc(ss(PEND))}</textarea><div id="plkNewR"></div></details>${st==='free'||st==='ok'?'':ask()}</div>
  <div class="plk-ft"><button type="button" class="plk-b" data-plk="close" style="margin-left:auto">${t('close')}</button></div>`;
  if(!DLG.open){try{DLG.showModal()}catch(e){DLG.setAttribute('open','')}}
  const v=ss(PEND);if(v)tryCode(v,DLG.querySelector('#plkNewR'))}

function paint(was){paintGate();paintBan();
  if(S.st==='ro'){lockF(document.body);fObs.observe(document.body,{childList:true,subtree:true})}else{fObs.disconnect();document.querySelectorAll('[data-plk-ro]').forEach(e=>{e.disabled=false;e.removeAttribute('data-plk-ro')})}
  if(DLG&&DLG.open&&was!==S.st)openDlg()}

// renewals ORIEN approved: ORIEN's Supabase and pm/files/licences.json hold each new code encrypted with a key made from the code it replaces
const sha=async s=>new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s)));
const hex=u=>[...u.slice(0,12)].map(b=>b.toString(16).padStart(2,'0')).join('');
// every code on this device is looked up, so an approval that adds this program to a PENUM PM code also arrives here
async function renewals(){renewals.t=Date.now();const L=regGet();if(!L.length)return;const ix=await Promise.all(L.map(async c=>hex(await sha('i'+c))));
  const [P,F]=await Promise.all([
    fetch(SB.url+'/rest/v1/rpc/penum_lic_get',{method:'POST',cache:'no-store',headers:{apikey:SB.key,'Content-Type':'application/json'},body:JSON.stringify({p_k:ix})}).then(r=>r.ok?r.json():null).catch(()=>null),
    fetch(FILES+'licences.json',{cache:'no-store'}).then(r=>r.ok?r.json():null).then(j=>j&&j.e).catch(()=>null)]);
  for(let i=0;i<L.length;i++)for(const e of [P&&P[ix[i]],F&&F[ix[i]]]){if(!e)continue;const cur=L[i];try{
    const k=await crypto.subtle.importKey('raw',await sha('k'+cur),'AES-GCM',false,['decrypt']);
    const code=new TextDecoder().decode(await crypto.subtle.decrypt({name:'AES-GCM',iv:b64(e.iv)},k,b64(e.ct)));
    const r=await verify(code),o=await verify(cur);if(!r.ok||!o.ok||r.p.co!==o.p.co||rank(r.p)<=rank(o.p))continue;
    if(regAdd(r.code)){await recheck();if(has(r.p,C.app))toast(t('renewT',thD(r.p.exp)))}}catch(e){}}}

function start(){UI=true;
  document.addEventListener('click',e=>{const b=e.target.closest&&e.target.closest('[data-penum-lic]');if(!b)return;const d=b.closest('details');if(d)d.open=false;openDlg()});
  putMenu();new MutationObserver(()=>{if(!document.querySelector('[data-penum-lic]'))putMenu()}).observe(document.body,{childList:true,subtree:true});
  paint('');recheck();
  // a renewal link opened in a program that already has a code
  if(S.st!=='none'&&ss(PEND))openDlg();
  fetch(FILES+'revoked.json',{cache:'no-store'}).then(r=>r.ok?r.json():null).then(j=>{if(!j||!Array.isArray(j.ids))return;const L=j.ids.map(String);
    if(JSON.stringify(L)===JSON.stringify(REV))return;REV=L;put('penum.revoked',JSON.stringify(L));recheck()}).catch(()=>{});
  fetch(FILES+'plans.json',{cache:'no-store'}).then(r=>r.ok?r.json():null).then(j=>{if(!j||!Array.isArray(j.plans))return;const s=JSON.stringify(j);if(s===JSON.stringify(PL))return;
    PL=j;put('penum.plans',s);if(S.st==='none')paintGate()}).catch(()=>{});
  setTimeout(renewals,1500);
  // a program left open for days still gets a renewal: look again when it comes back to the front, at most every 30 minutes
  document.addEventListener('visibilitychange',()=>{if(!document.hidden&&Date.now()-(renewals.t||0)>30*60e3)renewals()})}
// another window (PENUM PM, or this program on another screen) added a code or a newer revoked list
addEventListener('storage',e=>{if(e.key===REG)recheck();if(e.key==='penum.revoked'){try{REV=JSON.parse(e.newValue||'[]').map(String)}catch(x){}recheck()}});
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',start):start();

// a message sent from this program's แจ้งปัญหา box names the company and customer code on its licence
{let fb;const add=()=>S.p?{company:S.p.co,lic:S.p.sn||base(S.p.id)}:{};
  try{Object.defineProperty(window,'penumFB',{configurable:true,enumerable:true,get:()=>fb,set(v){if(v&&typeof v.init==='function'&&!v.__plk){const f=v.init;
    v.init=function(o){o=Object.assign({},o);const g=o.info;o.info=()=>{let x={};try{x=(g&&g())||{}}catch(e){}return Object.assign(add(),x)};return f.call(this,o)};v.__plk=1}fb=v}})}catch(e){}}
window.penumLic={state:()=>({st:S.st,real:S.real,why:S.why,free:FREE,co:S.p&&S.p.co,exp:S.p&&S.p.exp,ap:S.p?apOf(S.p):[]}),open:openDlg,check:recheck};
})();
