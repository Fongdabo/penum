/* ---------- 3.41 header on one row ----------
   On a computer the header band holds the breadcrumb, the project name and the buttons on a single line, like
   PENUM MEP / BIM. The project name shrinks with "…" (full name on hover); controls get a little narrower. */
document.head.insertAdjacentHTML('beforeend',`<style>
@media (min-width:1000px){
 body.sb .band .brand{flex-wrap:nowrap!important;column-gap:12px}
 body.sb .band .brand>.proj{flex:none;flex-wrap:nowrap}
 body.sb .brand>.sp{display:none}
 body.sb .crumb{flex:1 1 auto;min-width:0;flex-wrap:nowrap;white-space:nowrap;overflow:hidden}
 body.sb .crumb>span{flex:none}
 body.sb .crumb>span.last{flex:0 0 auto}
 body.sb .crumb>i{flex:none}
 body.sb .crumb small{flex:0 100 auto;flex-basis:auto;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;margin-left:5px;padding-left:12px;border-left:1px solid var(--band-line);font-size:13px}
 body.sb .band #userSel{max-width:230px}
 body.sb .band #cloudBtn{max-width:190px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;display:inline-block}
}
@media (min-width:1000px) and (max-width:1499px){
 body.sb .band #userSel{max-width:170px}
 body.sb .band #cloudBtn{max-width:130px}
 body.sb .band #langSw .lg-t small{display:none}
 body.sb .crumb.pjc>span:not(.last),body.sb .crumb.pjc>i{display:none}
}
@media (min-width:1000px) and (max-width:1299px){
 body.sb .band #userSel{max-width:140px}
 body.sb .band #cloudBtn{max-width:none;width:38px;padding-inline:0;font-size:0;text-align:center}
 body.sb .band #cloudBtn::before{content:'☁';font-size:16px;line-height:1}
 body.sb .band #langSw .lg-t{display:none}
 body.sb .crumb>span:first-child:not(.last),body.sb .crumb>span:first-child:not(.last)+i{display:none}
}
</style>`);
{const f=sbCrumb;sbCrumb=function(){const x=f.apply(this,arguments);const el=$('#crumb');if(el){el.classList.toggle('pjc',S.mode==='pj'&&!!el.querySelector('small'));const s=el.querySelector('small');if(s)s.title=s.textContent;el.querySelectorAll('span').forEach(t=>t.title=t.textContent)}return x}}
{const cb=cloudBadge;cloudBadge=function(){const x=cb.apply(this,arguments);const b=$('#cloudBtn');if(b&&!b.title)b.title=b.textContent.trim();return x}}
// the sticky header is tall on phones: jumps to a row (search, alerts) stop below it instead of under it
{const bh=()=>{const h=$('.band'),st=h&&getComputedStyle(h).position;document.documentElement.style.setProperty('--bandH',(h&&(st==='sticky'||st==='fixed')?h.offsetHeight:0)+'px')};
  const r=render;render=function(){const x=r.apply(this,arguments);try{bh()}catch(e){}return x};addEventListener('resize',bh);
  document.head.insertAdjacentHTML('beforeend','<style>html{scroll-padding-top:calc(var(--bandH,0px) + 12px)}</style>')}

/* ---------- 3.42 เส้นลูกศรในแผนงาน: ทั้งหมด / เฉพาะหัวข้อหลัก / ปิด ----------
   Next to วัน/สัปดาห์/เดือน: show every dependency arrow, only the arrows between main headings (outline level 0),
   or none. Remembered on this device. */
const GARR_K='pmGArr'+(typeof DSFX!=='undefined'?DSFX:'');
const gArrMode=()=>{let v='a';try{v=localStorage.getItem(GARR_K)||'a'}catch(e){}return v==='0'?'off':v==='m'?'m':v==='off'?'off':'a'};
{const f=gArrows;gArrows=function(){const m=gArrMode(),tb=document.querySelector('#view table.gt'),box=tb&&tb.closest('.tw');
  if(m==='a')return f.apply(this,arguments);
  if(m==='off'){if(box)box.querySelectorAll('svg.garr').forEach(x=>x.remove());try{if(tb&&box)gStick(tb,box)}catch(e){}return}
  // main headings only: draw with the links between level-0 rows, then put the plan back untouched
  // a link between rows under two different headings is drawn once, heading to heading
  const keep=P.tasks,head={};let h=null;keep.forEach(t=>{if(!lvOf(t))h=t.id;head[t.id]=h||t.id});
  const L={};keep.forEach(t=>(t.dep||[]).forEach(d=>{const a=head[d.id],b=head[t.id];if(!a||!b||a===b)return;
    const ty=lvOf(t)||lvOf(keep.find(x=>x.id===d.id)||{})?'FS':(d.ty||'FS');(L[b]=L[b]||{})[a]=L[b][a]||{id:a,ty}}));
  P.tasks=keep.map(t=>Object.assign({},t,{dep:L[t.id]?Object.values(L[t.id]):[]}));
  try{return f.apply(this,arguments)}finally{P.tasks=keep}}}
function gArrBtn(){const z=document.querySelector('#view [data-a=zoom]');if(!z||$('#gArrSw'))return;const m=gArrMode();
  z.parentElement.insertAdjacentHTML('afterend',`<span class="sub" id="gArrSw" title="เส้นลูกศรที่โยงงานก่อนหน้า">${[['a','เส้นทั้งหมด'],['m','เฉพาะหัวข้อหลัก'],['off','ปิดเส้น']].map(([k,l])=>`<button type="button" data-a="gArr" data-k="${k}" aria-selected="${m===k}">${l}</button>`).join('')}</span>`)}
ACT.gArr=b=>{try{localStorage.setItem(GARR_K,b.dataset.k)}catch(e){}const s=$('#gArrSw');if(s)s.remove();gArrBtn();gArrows()};
{const r=render;render=function(){const x=r.apply(this,arguments);try{if(S.mode==='pj'&&S.tab==='sched')gArrBtn()}catch(e){}return x}}

/* ---------- 3.43 แผนงาน: วันเริ่มแสดงแบบไทยเหมือนช่องอื่น ----------
   The start column mixed the browser's date box (07/09/2026) with Thai dates (7 ก.ย. 69) on heading rows and in
   the finish column. The date box stays (click opens the calendar) but shows the Thai date until it is being typed in. */
document.head.insertAdjacentHTML('beforeend',`<style>
.gt td.gdt{position:relative}
.gt td.gdt input[type=date]{color:transparent;cursor:pointer}
.gt td.gdt input[type=date]:focus{color:inherit}
.gt td.gdt>b.gdtx{position:absolute;left:14px;top:50%;transform:translateY(-50%);pointer-events:none;font-weight:400;white-space:nowrap}
.gt td.gdt input[type=date]:focus+b.gdtx{display:none}
</style>`);
function gDates(){document.querySelectorAll('#view table.gt input[type=date][data-p$=".start"]').forEach(i=>{const td=i.parentElement;if(!td||td.tagName!=='TD')return;
  td.classList.add('gdt');let b=td.querySelector('b.gdtx');if(!b){b=document.createElement('b');b.className='gdtx';i.after(b);
    i.addEventListener('click',()=>{try{i.showPicker()}catch(e){}});i.addEventListener('input',()=>{b.textContent=okD(i.value)?thD(i.value):''})}
  b.textContent=okD(i.value)?thD(i.value):''})}
{const r=render;render=function(){const x=r.apply(this,arguments);try{if(S.mode==='pj'&&S.tab==='sched')gDates()}catch(e){}return x}}
// row tools (＋ ⇤ ⇥ ↑ ↓ ✕) show on the row under the mouse only, and never on paper or screenshots of the plan
document.head.insertAdjacentHTML('beforeend',`<style>
@media (hover:hover){.gt tbody td:has(>button.t-ins) button{opacity:0;transition:opacity .12s}
 .gt tbody tr:hover td:has(>button.t-ins) button,.gt tbody td:has(>button.t-ins) button:focus-visible{opacity:1}}
@media print{.gt td:has(>button.t-ins) button{display:none!important}}
</style>`);

/* ---------- 3.45 phones: every signed-in person gets receive / send ----------
   Staff without the company dashboard land on หน้าแรกของฉัน, which had no "งานหน้างานวันนี้" card, so a phone had no
   ⬇ รับข้อมูลล่าสุด / ⬆ ส่งงานเข้าระบบ and the header badge pointed at a card that was not there. */
{const f=CVIEWS.mine;CVIEWS.mine=()=>{const h=f();if(!mobileMode())return h;return mobCard()+(isPhone()?instCard():'')+h}}
{const g=ACT.mGo;ACT.mGo=b=>{if(!mineOk())return g(b);S.dept='home';pgGo(['co','mine','']);render();setTimeout(()=>{const c=$('#mobCard');if(c)c.scrollIntoView({behavior:'smooth'})},50)}}
// a phone with nothing on it yet: the first thing on screen is getting the company's data, not a row of zeros
{const f=CVIEWS.exec;CVIEWS.exec=()=>{const h=f();if(!(mobileMode()&&dbEmpty()))return h;
  const m=h.match(/<section class="card" style="border-color:var\(--warn-c\)"><h2><span>เริ่มใช้งานบนมือถือ[\s\S]*?<\/section>/);
  return m?m[0]+mobCard()+(isPhone()?instCard():''):h}}

