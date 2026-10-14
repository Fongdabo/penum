/* ---------- 3.90 แถบบน + แท็บชื่องาน: the same AutoCAD-style bar and project tabs as PENUM MEP and BIM (shared/titlebar.js) ----------
   The bar runs across the top of the window: the PM logo with the program menu, quick buttons (ใหม่ เปิด บันทึก บันทึกเป็น พิมพ์
   ย้อนกลับ ทำซ้ำ แชร์), the open project's name in the middle, the search (the sidebar's page search moves here; / or Ctrl+K),
   the user, the cart kept for ORIEN's form shop (coming soon), then the header's own buttons (cloud, colour mode, bell, คู่มือ, เมนู,
   language). Under it one tab per open project; เริ่มต้น is the home page. A tab is any project opened on a project page; closing
   it deletes nothing. * = changed since this project was last saved as a file (.penpm, 925); only people who may save files see it.
   The header band keeps the house button and the page name. Only when the build put shared/titlebar.js in <head> (app.json "titlebar"). */
const TB={on:false,last:''};
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
function tbMount(){if(TB.on||!window.penumBar||!$('#userSel'))return;TB.on=true;TB.box=$('#userSel').parentNode;const I=k=>penumBar.icon(k),go=a=>()=>{if(typeof ACT[a]==='function')ACT[a]({dataset:{}})};
  const logo=document.createElement('span');logo.innerHTML='<svg viewBox="0 0 26 26" aria-hidden="true"><defs><linearGradient id="ptbPm" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#22B8CF"/><stop offset="1" stop-color="#0E6E7E"/></linearGradient></defs><rect width="26" height="26" rx="7" fill="url(#ptbPm)"/><path d="M9 19V7h5.2a3.9 3.9 0 0 1 0 7.8H9" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  const link=id=>{const a=$('#'+id);return ()=>{if(a)a.click()}};
  const bar=penumBar.mount({app:'pm',appName:'PENUM PM',key:'penum.pm.tabs'+DSFX,tag:'PM',ver:'PENUM PM '+((window.PENUM_SITE||{}).name||''),accent:'#0891B2',logo:logo.firstChild,
    dark:()=>document.documentElement.dataset.theme==='dark',note:m=>toast(m),
    menu:()=>[{t:'โครงการใหม่',ic:I('new'),run:go('newProj')},{t:'เปิดไฟล์โครงการ…',ic:I('open'),run:go('pfOpen')},
      {t:'บันทึกโครงการนี้ลงเครื่อง',ic:I('save'),kbd:'Ctrl+S',run:go('pfSave')},{t:'บันทึกเป็น…',ic:I('saveas'),kbd:'Ctrl+Shift+S',run:tbSaveAs},{t:'บันทึกทุกโครงการลงเครื่อง',ic:I('save'),run:go('pfSaveAll')},
      {t:'พิมพ์เอกสารในหน้านี้',ic:I('print'),run:tbPrint},{t:'แชร์ไฟล์โครงการ',ic:I('share'),run:tbShare},'-',
      {t:'หน้าแรก',run:go('goHome')},{t:'ทุกโครงการ',run:tbAll},'-',
      {t:'PENUM MEP ↗',run:link('lnkMep')},{t:'PENUM BIM ↗',run:link('lnkBim')},'-',
      {t:'คู่มือการใช้งาน',run:go('helpAll')},{t:'แจ้งปัญหา / ความคิดเห็น',run:go('fb')}],
    quick:[{k:'new',t:'โครงการใหม่',run:go('newProj')},{k:'open',t:'เปิดไฟล์โครงการ',run:go('pfOpen')},{k:'save',t:'บันทึกโครงการนี้ลงเครื่อง (Ctrl+S)',run:go('pfSave')},
      {k:'saveas',t:'บันทึกเป็น… (Ctrl+Shift+S)',run:tbSaveAs},{k:'print',t:'พิมพ์เอกสารในหน้านี้',run:tbPrint},
      ...($('#undoBtn')?[{k:'undo',node:$('#undoBtn')},{k:'redo',node:$('#redoBtn')}]:[{k:'undo',t:'ย้อนกลับ (Ctrl+Z)',run:go('undo')},{k:'redo',t:'ทำซ้ำ (Ctrl+Y)',run:go('redo')}]),
      {k:'share',t:'แชร์ไฟล์โครงการ',run:tbShare}],
    title:()=>tbCur()?P.name:((CO()||{}).name||'PENUM PM'),titleTip:()=>(tbCur()?P.name:'')+' · ทุกโครงการ',titleClick:tbAll,
    search:{index:()=>projects().map(p=>({id:p.id,ic:'▣',t:p.name,sub:'โครงการ'+(p.info&&p.info.client?' · '+p.info.client:''),k:[p.name,p.info&&p.info.client,p.info&&p.info.contractNo].filter(Boolean).join(' '),go:()=>tbOpen(p.id)})),
      first:ix=>{const L=penumBar.ids();return ix.filter(o=>L.includes(o.id))},
      find:(q,ix)=>{const ws=q.toLowerCase().split(/\s+/).filter(Boolean),pj=ix.filter(o=>ws.every(w=>o.k.toLowerCase().includes(w)));
        return [...pj.slice(0,4),...sbFind(q).map(x=>({ic:'›',t:x.label,sub:x.path.join(' › '),go:()=>{const d=NAVD.find(z=>z[0]===x.d),i=sbPages(d).indexOf(x.pg);
          S.dept=d[0];S.dpage=S.dpage||{};S.dpage[d[0]]=i;pgGo(x.pg);if(x.sub)S.sub[x.pg[1]]=x.sub;ACT.sbClose();render();scrollTo({top:0})}}))]}},
    user:$('#userSel'),right:[$('#cloudBtn'),$('#themeSw'),$('#cmBell'),$('#helpBtn'),$('#moreMenu'),$('#langSw')],
    tabs:{cur:tbCur,start:()=>S.dept==='home',has:id=>!!DB.projects[id],name:id=>(DB.projects[id]||{}).name||'',
      open:id=>tbOpen(id),
      close:id=>{if(id===tbCur()){const L=penumBar.ids(),i=L.indexOf(id),nx=L[i+1]||L[i-1];if(nx)tbOpen(nx);else ACT.goHome()}penumBar.forget(id)},          // the last tab: หน้าแรก
      save:async id=>{const p=DB.projects[id];if(!p||pfNo())return false;const r=await pfSaveOne(p),m=pfSaid(r);if(m)toast(m);return !!r&&!r.err},
      add:go('newProj'),home:go('goHome'),
      lost:()=>'ถ้าไม่บันทึก ข้อมูลโครงการยังอยู่ในโปรแกรมครบ เปิดต่อได้ทุกเมื่อ เพียงแต่ไฟล์ .penpm ในเครื่องยังเป็นรุ่นเก่า'}});
  for(const o of penumBar.ids())if(!DB.projects[o])penumBar.forget(o);
  document.body.prepend(bar);tbPlace();addEventListener('resize',tbPlace);TB.last='';tbSync()}
// phones: the user and the cloud button stay in the header band, where they were; the bar has no room for them
function tbPlace(){const u=$('#userSel'),c=$('#cloudBtn'),ph=innerWidth<=720,bar=$('#ptbw');if(!u||!bar||!TB.box)return;
  if(ph&&u.parentNode!==TB.box){if(c)TB.box.prepend(c);TB.box.insertBefore(u,c?c.nextSibling:TB.box.firstChild)}
  else if(!ph&&u.parentNode===TB.box){bar.querySelector('.ptb-u').appendChild(u);if(c)bar.querySelector('.ptb-a').prepend(c)}}
function tbSync(){if(!TB.on)return;const c=tbCur();if(c&&c!==TB.last){penumBar.use(c);penumBar.check(c,JSON.stringify(P))}TB.last=c;penumBar.refresh()}
{const r=render;render=function(){const x=r.apply(this,arguments);try{tbSync()}catch(e){console.error(e)}return x}}
{const s=save;save=function(){const x=s.apply(this,arguments);if(TB.on&&tbCur()&&tbFile()){const id=P.id;penumBar.soon(id,()=>JSON.stringify(DB.projects[id]))}return x}}
{const f=pfSaveOne;pfSaveOne=async function(p){const s0=JSON.stringify(p),r=await f.apply(this,arguments);if(TB.on&&r&&!r.err&&p&&p.id)penumBar.clean(p.id,s0);return r}}          // saved as a file: no *
document.addEventListener('keydown',e=>{if(!TB.on||!(e.ctrlKey||e.metaKey)||e.altKey||document.querySelector('dialog[open]'))return;const k=String(e.key).toLowerCase();
  if(k==='k'){if(penumBar.focusSearch()){e.preventDefault();e.stopImmediatePropagation()}return}
  if(k!=='s'||document.body.classList.contains('pin-lock'))return;e.preventDefault();if(e.shiftKey)tbSaveAs();else ACT.pfSave()},true);
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
#ptbw #userSel{height:30px;min-height:30px;max-width:220px;padding:0 26px 0 9px;border-radius:8px;border:1px solid var(--tb-line);background-color:var(--tb-inp);color:var(--tb-ink);font-size:13px;box-shadow:none}
#ptbw #themeSw{display:inline-flex;gap:2px;padding:2px;border:1px solid var(--tb-line);border-radius:9px;background:transparent;height:30px;box-sizing:border-box}
#ptbw #themeSw button{width:28px;height:24px;min-height:0;padding:0;border:0;border-radius:6px;display:grid;place-items:center;background:transparent;color:var(--tb-mut)}
#ptbw #themeSw button[aria-pressed=true]{background:var(--tb-acc);color:#fff}
#ptbw .help-btn b{width:18px;height:18px;font-size:11px;border-color:currentColor}
#ptbw .cm-bell{padding:0 7px}
#ptbw details.more{position:relative}#ptbw details.more .menu{z-index:50}
#ptbw .lang-dd summary{padding:0 7px}#ptbw .lang-dd .lg-t small{display:none}#ptbw .lang-dd .lg-t{font-size:12.5px}
body.pin-lock #ptbw .ptb-qs,body.pin-lock #ptbw .ptb-x,body.pin-lock #ptbw .ptb-c,body.pin-lock #ptbw .ptb-s,body.pin-lock #ptbw .ptb-cart,body.pin-lock #ptbw .pdt,body.pin-lock #ptbw .ptb-logo>svg{display:none!important}
body.pin-lock #ptbw .ptb-logo{pointer-events:none}
html.ptb-on body.sb .band{padding-top:10px;padding-bottom:10px}
@media (max-width:1700px){#ptbw .lang-dd .lg-t,#ptbw .help-btn>:not(b){display:none}#ptbw .help-btn{font-size:0;gap:0;padding:0 6px}#ptbw #userSel{max-width:170px}#ptbw #cloudBtn{max-width:150px;overflow:hidden;text-overflow:ellipsis}}
@media (max-width:1280px){#ptbw #cloudBtn{max-width:120px;overflow:hidden;text-overflow:ellipsis}#ptbw #userSel{max-width:150px}}
@media (max-width:980px){#ptbw #themeSw,#ptbw #helpBtn{display:none}#ptbw #userSel{max-width:120px}#ptbw #cloudBtn{position:relative;width:32px;padding:0;color:transparent;overflow:hidden}#ptbw #cloudBtn::before{content:'☁';position:absolute;inset:0;display:grid;place-items:center;color:var(--tb-ink)}}
@media (max-width:720px){#ptbw #moreMenu summary{padding:0 7px;font-size:0;gap:0}#ptbw #moreMenu summary svg{width:16px;height:16px}}
@media print{html.ptb-on body{padding-top:0}}
</style>`);
