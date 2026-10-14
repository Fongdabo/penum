/* ---------- 3.90 แถบบน + แท็บชื่องาน: the same AutoCAD-style bar and project tabs as PENUM MEP and BIM (shared/titlebar.js) ----------
   The bar runs across the top of the window: the PM logo with the program menu, quick buttons (ใหม่ เปิด บันทึก บันทึกเป็น พิมพ์
   ย้อนกลับ ทำซ้ำ แชร์), the open project's name in the middle, the search (the sidebar's page search moves here; / or Ctrl+K),
   the user (a button with a menu, as in MEP and BIM: switch user, ลายเซ็นของฉัน, สแกนนิ้ว, ออกจากระบบ), the cart kept for ORIEN's form
   shop (coming soon), then the header's own buttons as icons (cloud, bell, colour mode, คู่มือ), language and เมนู (3.92), placed and drawn as in MEP and BIM (3.96). Under it one tab per open project; เริ่มต้น is the home page. A tab is any project opened on a project page; closing
   it deletes nothing. * = changed since this project was last saved as a file (.penpm, 925); only people who may save files see it.
   A company on the cloud (3.96): * = not in the cloud yet, and บันทึก / Ctrl+S send it there now.
   The header band keeps the house button and the page name. Only when the build put shared/titlebar.js in <head> (app.json "titlebar"). */
const TB={on:false,last:'',sv:0};
const tbCur=()=>P&&S.mode==='pj'&&S.tab!=='pjall'&&!document.body.classList.contains('pin-lock')?P.id:'';
const tbFile=()=>pfAdmin()&&!(typeof licRO==='function'&&licRO());
// a page of the project department: ภาพรวม when a project is opened from elsewhere, ทุกโครงการ from the name in the bar
function tbPj(tab){const d=NAVD.find(x=>x[0]==='pj'),L=d?d[2].filter(pgOk):[];let i=L.findIndex(pg=>pg[1]===tab);if(i<0)i=0;const pg=L[i];if(!pg)return false;
  S.dept='pj';S.dpage=S.dpage||{};S.dpage.pj=i;pgGo(pg);return true}
function tbOpen(id){if(!DB.projects[id])return;if(id!==DB.cur||P.id!==id){DB.cur=id;P=DB.projects[id];S.sel={};save()}
  if(!(S.mode==='pj'&&S.tab!=='pjall'&&S.dept!=='home'))tbPj('dash');          // on a project page already: the same page of the other project
  ACT.sbClose();render();scrollTo({top:0})}
const tbAll=()=>{if(tbPj('pjall')){ACT.sbClose();render();scrollTo({top:0})}};
async function tbSaveAs(){if(pfNo()||!P)return;const s0=JSON.stringify(P),id=P.id;
  const r=await penumBar.saveAs({name:P.name||'project',ext:PF.ext,text:await pfText(P),type:'application/x-penum-pm'});if(!r)return;
  penumBar.clean(id,s0);toast(r.dl?`ดาวน์โหลดไฟล์ ${r.file} แล้ว`:`บันทึกลงเครื่องแล้ว: ${r.file}`)}
// แชร์: the project's file to an app on this device (LINE, e-mail, Drive) where the computer can; else it is saved as a file
async function tbShare(){if(pfNo()||!P)return;try{const f=new File([await pfText(P)],(P.name||'project').replace(/[\\/:*?"<>|]+/g,' ').trim()+PF.ext,{type:'application/json'});
  if(navigator.canShare&&navigator.canShare({files:[f]})){await navigator.share({files:[f],title:P.name});return}}catch(e){if(e&&e.name==='AbortError')return}
  ACT.pfSave()}
// พิมพ์: the print buttons of the page on screen; one is pressed at once, several are listed with what each prints
function tbPrint(){const B=[...document.querySelectorAll('#view button[data-a]')].filter(b=>b.offsetParent&&!b.disabled&&(/print/i.test(b.dataset.a)||/^\s*(🖨\s*)?พิมพ์/.test(b.textContent)));
  if(!B.length){toast('หน้านี้ไม่มีเอกสารให้พิมพ์ เปิดหน้าที่มีปุ่ม พิมพ์ เช่น ใบสั่งซื้อ เบิกงวด หรือรายงานประจำวัน');return}
  if(B.length===1){B[0].click();return}
  const at=b=>{const tr=b.closest('tr');if(tr){const c=[...tr.cells].map(x=>x.textContent.trim()).filter(Boolean);if(c.length)return c.slice(0,2).join(' · ')}
    const h=b.closest('section,.card');const t=h&&h.querySelector('h2,h3');return t?t.textContent.trim().split('\n')[0]:''};
  const a=document.querySelector('#ptbw .ptb-print');
  penumBar.pop(a&&a.offsetParent?a:document.querySelector('#ptbw .ptb-logo'),B.slice(0,14).map(b=>{const x=at(b),l=b.textContent.replace(/\s+/g,' ').trim()||'พิมพ์';return {t:(x?l+' · '+x:l).slice(0,90),run:()=>b.click()}}))}
// 3.96 the company's data in the cloud (คลาวด์ PENUM, 830, or OneDrive, 280): the main copy is there, so บันทึก (the quick button,
// Ctrl+S and the question when a tab closes) sends it now and * means not in the cloud yet; บันทึกโครงการนี้ลงเครื่อง still saves a .penpm file
const tbCl=()=>((typeof sbOn==='function'&&sbOn())||cloudOn())&&!(typeof licRO==='function'&&licRO());
const tbSt=()=>folderOn()?FS:CS;
async function tbCloud(){for(let i=0;i<80&&(FS.busy||CS.busy);i++)await new Promise(r=>setTimeout(r,250));
  if(folderOn())await folderSync();else if(cloudOn())await cloudSync();const st=tbSt(),ok=st.state==='ok';
  toast(ok?'บันทึกขึ้นคลาวด์แล้ว':`ยังบันทึกขึ้นคลาวด์ไม่ได้${st.msg?' ('+st.msg+')':''} ข้อมูลยังอยู่ในเครื่องนี้ครบ จะส่งขึ้นเองเมื่อต่ออินเทอร์เน็ตได้`);return ok}
const tbMain=()=>tbCl()?tbCloud():ACT.pfSave();
// a sync that went through: every open tab is in the cloud as it was (as it is now, when nothing was typed meanwhile)
{const w=f=>async function(){const go=TB.on&&tbCl()&&!(FS.busy||CS.busy),n0=TB.sv,S0={};if(go)for(const id of penumBar.ids())if(DB.projects[id])S0[id]=JSON.stringify(DB.projects[id]);
  const r=await f.apply(this,arguments);if(go&&tbSt().state==='ok')for(const id in S0)penumBar.clean(id,TB.sv===n0&&DB.projects[id]?JSON.stringify(DB.projects[id]):S0[id]);return r};
  folderSync=w(folderSync);cloudSync=w(cloudSync)}
// the user: one button with a menu, like MEP and BIM; #userSel and ออกจากระบบ (#outBtn, 290) stay in the page, hidden, and do the work
const tbSV=d=>`<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
function tbUserName(){const us=$('#userSel');if(S.me&&typeof staffName==='function')return staffName(S.me)||'';const o=us&&us.selectedOptions&&us.selectedOptions[0];return o?o.textContent.replace(/\s*\(.*\)\s*$/,'').trim():'ผู้ใช้งาน'}
function tbUserMenu(){const us=$('#userSel'),out=$('#outBtn'),mm=a=>{const b=$(`#moreMenu [data-a="${a}"]`);return b&&!b.hidden?b:null},L=[];
  L.push({html:`<b>${esc(tbUserName())}</b>${us&&us.disabled&&us.title?`<br><small>${esc(us.title)}</small>`:''}`});
  if(us&&!us.disabled&&!us.hidden&&us.options.length>1){L.push('-');for(const o of us.options)L.push({t:o.textContent,on:o.value===us.value,run:()=>{us.value=o.value;us.dispatchEvent(new Event('change',{bubbles:true}))}})}
  const sig=mm('esigEdit'),bio=mm('bioAdd');if(sig||bio)L.push('-');if(sig)L.push({t:sig.textContent.trim(),run:()=>sig.click()});if(bio)L.push({t:bio.textContent.trim(),run:()=>bio.click()});
  if(innerWidth<=720){const c=$('#cloudBtn');L.push('-');if(c)L.push({t:c.getAttribute('aria-label')||c.textContent.trim(),run:()=>c.click()});          // phones: the cloud and the colour mode live here
    for(const b of document.querySelectorAll('#themeSw [data-k]'))L.push({t:b.title||b.textContent.trim(),ic:(b.querySelector('svg')||{}).outerHTML||'',on:b.getAttribute('aria-pressed')==='true',run:()=>b.click()})}
  if(out&&!out.hidden)L.push('-',{t:'ออกจากระบบ',ic:tbSV('<path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><path d="m10 17-5-5 5-5"/><path d="M5 12h12"/>'),run:()=>out.click()});
  penumBar.pop($('#tbUser'),L)}
// colour mode: one button that shows the mode in use; the three modes of #themeSw in its menu
function tbThemeMenu(){penumBar.pop($('#tbTheme'),[...document.querySelectorAll('#themeSw [data-k]')].map(b=>({t:b.title||b.textContent.trim(),ic:(b.querySelector('svg')||{}).outerHTML||'',on:b.getAttribute('aria-pressed')==='true',run:()=>b.click()})))}
function tbChrome(){const u=$('#tbUser');if(u){const n=tbUserName(),us=$('#userSel');u.innerHTML=tbSV('<circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/>')+`<span>${esc(n)}</span>`;u.title=n;u.hidden=!!(us&&us.hidden)}
  const t=$('#tbTheme'),on=$('#themeSw [aria-pressed="true"]');if(t&&on){const g=on.querySelector('svg');t.innerHTML=g?g.outerHTML:'◐';t.title=t.ariaLabel=on.title||'โหมดสี'}
  tbLook();const qs=document.querySelector('#ptbw .ptb-save');if(qs)qs.title=tbCl()?'บันทึกขึ้นคลาวด์ (Ctrl+S)':'บันทึกโครงการนี้ลงเครื่อง (Ctrl+S)';
  const c=$('#cloudBtn');if(c){const x=c.textContent.trim();c.dataset.st=/ไม่ได้|ต้องล็อกอิน|ผิดพลาด/.test(x)?'bad':/ยังไม่/.test(x)?'off':/กำลัง|รอ/.test(x)?'busy':'ok';if(c.title!==x&&!/^☁?\s*$/.test(x))c.title=x;c.setAttribute('aria-label',x)}}
// the right side looks and sits as in MEP and BIM (3.96): cloud, bell, colour mode, คู่มือ as icons, then language and เมนู as boxes
function tbLook(){const k=(e,c)=>{if(e)for(const x of c.split(' '))e.classList.add(x)};
  k($('#cloudBtn'),'ptb-ib');k($('#cmBell'),'ptb-ib');k($('#tbTheme'),'ptb-ib ptb-thm');
  const h=$('#helpBtn');if(h){k(h,'ptb-ib ptb-hlp');if(!h.querySelector('svg'))h.insertAdjacentHTML('afterbegin',penumBar.icon('help'))}
  k($('#langSw>summary'),'ptb-bx');k($('#moreMenu>summary'),'ptb-bx')}
{const f=cloudBadge;cloudBadge=function(){const x=f.apply(this,arguments);try{tbChrome()}catch(e){}return x}}
function tbMount(){if(TB.on||!window.penumBar||!$('#userSel'))return;TB.on=true;const I=k=>penumBar.icon(k),go=a=>()=>{if(typeof ACT[a]==='function')ACT[a]({dataset:{}})};
  const logo=document.createElement('span');logo.innerHTML='<svg viewBox="0 0 26 26" aria-hidden="true"><defs><linearGradient id="ptbPm" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#22B8CF"/><stop offset="1" stop-color="#0E6E7E"/></linearGradient></defs><rect width="26" height="26" rx="7" fill="url(#ptbPm)"/><path d="M9 19V7h5.2a3.9 3.9 0 0 1 0 7.8H9" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  const link=id=>{const a=$('#'+id);return ()=>{if(a)a.click()}};
  const uc=document.createElement('button');uc.type='button';uc.id='tbUser';uc.className='bbtn tb-uc';uc.setAttribute('aria-haspopup','menu');uc.addEventListener('click',tbUserMenu);
  const tt=document.createElement('button');tt.type='button';tt.id='tbTheme';tt.className='bbtn tb-ic';tt.setAttribute('aria-haspopup','menu');tt.addEventListener('click',tbThemeMenu);
  const bar=penumBar.mount({app:'pm',appName:'PENUM PM',key:'penum.pm.tabs'+DSFX,tag:'PM',ver:'PENUM PM '+((window.PENUM_SITE||{}).name||''),accent:'#0891B2',logo:logo.firstChild,
    dark:()=>document.documentElement.dataset.theme==='dark',note:m=>toast(m),
    menu:()=>[{t:'โครงการใหม่',ic:I('new'),run:go('newProj')},{t:'เปิดไฟล์โครงการ…',ic:I('open'),run:go('pfOpen')},
      ...(tbCl()?[{t:'บันทึกขึ้นคลาวด์',ic:I('save'),kbd:'Ctrl+S',run:tbCloud},{t:'บันทึกโครงการนี้ลงเครื่อง',ic:I('save'),run:go('pfSave')}]:[{t:'บันทึกโครงการนี้ลงเครื่อง',ic:I('save'),kbd:'Ctrl+S',run:go('pfSave')}]),{t:'บันทึกเป็น…',ic:I('saveas'),kbd:'Ctrl+Shift+S',run:tbSaveAs},{t:'บันทึกทุกโครงการลงเครื่อง',ic:I('save'),run:go('pfSaveAll')},
      {t:'พิมพ์เอกสารในหน้านี้',ic:I('print'),run:tbPrint},{t:'แชร์ไฟล์โครงการ',ic:I('share'),run:tbShare},'-',
      {t:'หน้าแรก',run:go('goHome')},{t:'ทุกโครงการ',run:tbAll},'-',
      {t:'PENUM MEP ↗',run:link('lnkMep')},{t:'PENUM BIM ↗',run:link('lnkBim')},'-',
      {t:'คู่มือการใช้งาน',run:go('helpAll')},{t:'แจ้งปัญหา / ความคิดเห็น',run:go('fb')}],
    quick:[{k:'new',t:'โครงการใหม่',run:go('newProj')},{k:'open',t:'เปิดไฟล์โครงการ',run:go('pfOpen')},{k:'save',t:'บันทึก (Ctrl+S)',run:tbMain},
      {k:'saveas',t:'บันทึกเป็น… (Ctrl+Shift+S)',run:tbSaveAs},{k:'print',t:'พิมพ์เอกสารในหน้านี้',run:tbPrint},
      ...($('#undoBtn')?[{k:'undo',node:$('#undoBtn')},{k:'redo',node:$('#redoBtn')}]:[{k:'undo',t:'ย้อนกลับ (Ctrl+Z)',run:go('undo')},{k:'redo',t:'ทำซ้ำ (Ctrl+Y)',run:go('redo')}]),
      {k:'share',t:'แชร์ไฟล์โครงการ',run:tbShare}],
    title:()=>P?P.name:((CO()||{}).name||'PENUM PM'),titleTip:()=>(P?P.name+' · ':'')+'ทุกโครงการ',titleClick:tbAll,company:()=>(CO()||{}).name||'',
    search:{index:()=>projects().map(p=>({id:p.id,ic:'▣',t:p.name,sub:'โครงการ'+(p.info&&p.info.client?' · '+p.info.client:''),k:[p.name,p.info&&p.info.client,p.info&&p.info.contractNo].filter(Boolean).join(' '),go:()=>tbOpen(p.id)})),
      first:ix=>{const L=penumBar.ids();return ix.filter(o=>L.includes(o.id))},
      find:(q,ix)=>{const ws=q.toLowerCase().split(/\s+/).filter(Boolean),pj=ix.filter(o=>ws.every(w=>o.k.toLowerCase().includes(w)));
        return [...pj.slice(0,4),...sbFind(q).map(x=>({ic:'›',t:x.label,sub:x.path.join(' › '),go:()=>{const d=NAVD.find(z=>z[0]===x.d),i=sbPages(d).indexOf(x.pg);
          S.dept=d[0];S.dpage=S.dpage||{};S.dpage[d[0]]=i;pgGo(x.pg);if(x.sub)S.sub[x.pg[1]]=x.sub;ACT.sbClose();render();scrollTo({top:0})}}))]}},
    user:uc,right:[$('#cloudBtn'),$('#cmBell'),tt,$('#helpBtn'),$('#langSw'),$('#moreMenu')],
    tabs:{cur:tbCur,start:()=>S.dept==='home',has:id=>!!DB.projects[id],name:id=>(DB.projects[id]||{}).name||'',
      open:id=>tbOpen(id),
      close:id=>{if(id===tbCur()){const L=penumBar.ids(),i=L.indexOf(id),nx=L[i+1]||L[i-1];if(nx)tbOpen(nx);else ACT.goHome()}penumBar.forget(id)},          // the last tab: หน้าแรก
      save:async id=>{const p=DB.projects[id];if(p&&tbCl())return tbCloud();if(!p||pfNo())return false;const r=await pfSaveOne(p),m=pfSaid(r);if(m)toast(m);return !!r&&!r.err},
      cloud:()=>tbCl(),add:go('newProj'),home:go('goHome'),
      lost:(id,c)=>c?'ถ้าไม่บันทึก ข้อมูลโครงการยังอยู่ในโปรแกรมครบ และจะส่งขึ้นคลาวด์เองในการซิงค์ครั้งถัดไป':'ถ้าไม่บันทึก ข้อมูลโครงการยังอยู่ในโปรแกรมครบ เปิดต่อได้ทุกเมื่อ เพียงแต่ไฟล์ .penpm ในเครื่องยังเป็นรุ่นเก่า'}});
  for(const o of penumBar.ids())if(!DB.projects[o])penumBar.forget(o);
  document.body.prepend(bar);TB.last='';tbSync()}
function tbSync(){if(!TB.on)return;const c=tbCur();if(c&&c!==TB.last){penumBar.use(c);penumBar.check(c,JSON.stringify(P))}TB.last=c;tbChrome();penumBar.refresh()}
{const r=render;render=function(){const x=r.apply(this,arguments);try{tbSync()}catch(e){console.error(e)}return x}}
{const s=save;save=function(){const x=s.apply(this,arguments);TB.sv++;if(TB.on&&tbCur()&&(tbCl()||tbFile())){const id=P.id;penumBar.soon(id,()=>JSON.stringify(DB.projects[id]))}return x}}
{const f=pfSaveOne;pfSaveOne=async function(p){const s0=JSON.stringify(p),r=await f.apply(this,arguments);if(TB.on&&r&&!r.err&&p&&p.id)penumBar.clean(p.id,s0);return r}}          // saved as a file: no *
document.addEventListener('keydown',e=>{if(!TB.on||!(e.ctrlKey||e.metaKey)||e.altKey||document.querySelector('dialog[open]'))return;const k=String(e.key).toLowerCase();
  if(k==='k'){if(penumBar.focusSearch()){e.preventDefault();e.stopImmediatePropagation()}return}
  if(k!=='s'||document.body.classList.contains('pin-lock'))return;e.preventDefault();if(e.shiftKey)tbSaveAs();else tbMain()},true);
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',tbMount);else setTimeout(tbMount);
document.head.insertAdjacentHTML('beforeend',`<style>
html.ptb-on #ptbw{position:fixed;top:0;left:0;right:0;z-index:45}
html.ptb-on body{padding-top:var(--ptb-h,72px)}
html.ptb-on .band{position:relative!important;top:auto!important}
@media (min-width:641px){html.ptb-on .demo-band{top:var(--ptb-h,0px)}}
html.ptb-on .side{top:calc(var(--ptb-h,0px) + 8px)}
@media (min-width:1000px){html.ptb-on body.sb .side{top:calc(var(--ptb-h,0px) + 12px)}}
html.ptb-on .sb-s,html.ptb-on #sbRes,html.ptb-on #undoBox{display:none!important}
#ptbw .bbtn{height:30px;min-height:30px;padding:0 9px;border-radius:8px;border:1px solid var(--tb-line);background:transparent;color:var(--tb-ink);box-shadow:none;font-size:13px;gap:5px;white-space:nowrap}
#ptbw .bbtn:hover{background:var(--tb-hov)}
#ptbw .ptb-a{display:flex;align-items:center;gap:5px}
html.ptb-on #userSel,html.ptb-on #outBtn,html.ptb-on #themeSw{display:none!important}
#ptbw .tb-uc{max-width:200px}#ptbw .tb-uc span{overflow:hidden;text-overflow:ellipsis}#ptbw .tb-uc svg{flex:none}
#ptbw .tb-ic,#ptbw .cm-bell,#ptbw #helpBtn,#ptbw #cloudBtn{width:32px;padding:0;justify-content:center;border-color:transparent}
#ptbw #helpBtn b{display:none}
#ptbw #cloudBtn{position:relative;font-size:0;overflow:hidden}
#ptbw #cloudBtn::before{content:'';width:18px;height:18px;background:currentColor;-webkit-mask:var(--tb-cloud) center/contain no-repeat;mask:var(--tb-cloud) center/contain no-repeat}
#ptbw #cloudBtn::after{content:'';position:absolute;right:5px;bottom:6px;width:7px;height:7px;border-radius:50%;background:#16A34A;box-shadow:0 0 0 2px var(--tb-bg)}
#ptbw #cloudBtn[data-st=off]::after{background:#94A3B8}#ptbw #cloudBtn[data-st=busy]::after{background:#F59E0B}#ptbw #cloudBtn[data-st=bad]::after{background:#DC2626}
#ptbw{--tb-cloud:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M17.5 19H9a7 7 0 1 1 6.7-9h1.8a4.5 4.5 0 1 1 0 9z'/%3E%3C/svg%3E")}
body.pin-lock #tbUser{display:none!important}
#ptbw details.more{position:relative}#ptbw details.more .menu{z-index:50}
#ptbw .lang-dd summary{padding:0 7px}#ptbw .lang-dd .lg-t small{display:none}#ptbw .lang-dd .lg-t{font-size:12.5px}
body.pin-lock #ptbw .ptb-qs,body.pin-lock #ptbw .ptb-x,body.pin-lock #ptbw .ptb-c,body.pin-lock #ptbw .ptb-s,body.pin-lock #ptbw .ptb-cart,body.pin-lock #ptbw .pdt,body.pin-lock #ptbw .ptb-logo>svg{display:none!important}
body.pin-lock #ptbw .ptb-logo{pointer-events:none}
html.ptb-on body.sb .band{padding-top:10px;padding-bottom:10px}
@media (max-width:1280px){#ptbw .lang-dd .lg-t{display:none}}
@media (max-width:1280px){#ptbw .tb-uc{max-width:140px}}
@media (max-width:980px){#ptbw .tb-uc span{display:none}#ptbw .tb-uc{padding:0 7px}}
@media (max-width:720px){#ptbw #cloudBtn{display:none!important}#ptbw #moreMenu summary{font-size:0!important;gap:0}}
@media print{html.ptb-on body{padding-top:0}}
</style>`);
