/* ---------- 3.20.1 polish from the manual recordings ---------- */
// approvals waiting on you are listed in ต้องดูวันนี้ with everything else, so the home page has one list to work from
{const f=alerts;alerts=function(){const A=f();if(typeof myQueue!=='function')return A;
  myQueue().forEach(q=>{const real=q.p&&q.p.id;A.push({lv:'warn',kind:'รอคุณอนุมัติ',p:real?q.p:null,txt:`${q.t} ${q.no} · ${q.step}${real?'':' · '+(q.p&&q.p.name||'')}`,due:today(),go:q.go})});return A}}
// company dashboard: the numbers come first, the to-do cards after them
{const f=CVIEWS.exec;CVIEWS.exec=()=>{const h=f(),i=h.indexOf('<dl class="stats">');if(i<=0)return h;const j=h.indexOf('</dl>',i)+5;return h.slice(i,j)+h.slice(0,i)+h.slice(j)}}
// document numbers (JOB-0001, RFI-001, E001…) fit in editable tables
{const c0=cell;cell=function(base,r,c){if(['no','code','rcNo','lgNo'].includes(c.k)&&c.t!=='calc'&&(!c.w||c.w<100))c=Object.assign({},c,{w:100});return c0(base,r,c)}}
// signed out: only the sign-in card, the language and the colour mode; no menu, sidebar, backup or restore
{const r=render;render=function(){const x=r.apply(this,arguments);const lock=typeof pinOn==='function'&&pinOn()&&!authOK();document.body.classList.toggle('pin-lock',!!lock);if(lock&&typeof ACT.sbClose==='function'&&document.body.classList.contains('sb-open'))ACT.sbClose();return x}}
// phone quick actions say which project they open and let you switch
{const f=mobCard;mobCard=function(){const h=f(),L=projects().filter(p=>!p.closed);if(L.length<2)return h;
  const sel=`<label class="mob-pj">โครงการ<select id="sbProj" aria-label="โครงการ">${L.map(p=>`<option value="${p.id}"${p.id===P.id?' selected':''}>${esc(p.name)}</option>`).join('')}</select></label>`;
  return h.replace('<div class="mqs">',sel+'<div class="mqs">')}}
// a browser not set to Thai shows date boxes as mm/dd/yyyy; show the Thai date beside them
const dtHintOn=()=>!/^th/i.test(navigator.language||'')&&(typeof LANG==='undefined'||LANG==='th');
function dtHints(root){if(!dtHintOn())return;(root||document).querySelectorAll('label input[type=date],label input[type=month],td input[type=month]').forEach(el=>{
  let h=el.nextElementSibling;if(!h||!h.classList.contains('dt-hint')){h=document.createElement('small');h.className='dt-hint';el.after(h)}
  const v=el.value;h.textContent=!v?'':el.type==='month'?thM(v):pd(v).toLocaleDateString('th-TH',{day:'numeric',month:'long',year:'numeric'})})}
{const r=render;render=function(){const x=r.apply(this,arguments);try{dtHints()}catch(e){}return x}}
document.addEventListener('input',e=>{const t=e.target;if(t&&(t.type==='date'||t.type==='month'))try{dtHints(t.parentNode)}catch(x){}});
document.head.insertAdjacentHTML('beforeend',`<style>
.bl-list td:nth-child(-n+3),.bl-list th{white-space:nowrap}
@media print{#print{padding-inline:2mm;box-sizing:border-box}}
.pin-lock #side,.pin-lock .sb-burger,.pin-lock #helpBtn,.pin-lock #moreMenu,.pin-lock #userSel,.pin-lock #cloudBtn,.pin-lock .crumb,.pin-lock #tabs,.pin-lock #modeSw,.pin-lock #projBox{display:none!important}
@media screen and (min-width:1001px){body.pin-lock.sb{padding-left:16px!important}}
.mob-pj{display:flex;align-items:center;gap:8px;margin:0 0 10px;font-size:13px;color:var(--muted)}.mob-pj select{flex:1;min-width:0}
.dt-hint{display:block;font-size:12px;color:var(--muted);margin-top:2px}
@media (max-width:640px){.demo-band{position:relative!important;padding:6px 12px!important}.demo-band span:not(.sp){display:none}.demo-band span:first-of-type{display:inline}}
</style>`);
