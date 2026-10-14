/* ---------- 3.93 ยกเลิก / ลบ a project straight from ทุกโครงการ ----------
   Close and delete lived only at the bottom of ข้อมูลโครงการและ BOQ, so a project made by mistake was hard to get rid of.
   Each row of ทุกโครงการ (and that page) now has "ยกเลิก / ลบ", which says what is in the project and offers:
   ลบทิ้ง (made by mistake): a project with no work in it goes at once and ↶ ย้อนกลับ brings it back; one with work in it
     goes through the old delete (backup file first, type ลบ) and only management (or the owner, not signed in) may do it.
   ยกเลิกโครงการ (the job will not go ahead): needs a reason, and in a company with staff it is a request (P.cxlReq) that the
     heads of ฝ่ายขาย ประมาณราคา โครงการ จัดซื้อ บัญชี (those the company has) and ผู้บริหาร each approve, on this box or in the
     chat's approvals; until then the project works as usual and shows รออนุมัติยกเลิก. Once all approve it is kept like a
     closed project, out of the totals and alerts, marked ยกเลิกแล้ว with the reason (P.cxl={d,why,by,st,appr}); one ไม่อนุมัติ
     stops it. เปิดโครงการอีกครั้ง brings a cancelled project back.
   ปิดโครงการ (the job is finished): the same close as before. */
const PJ_WK=[['boq.items','รายการ BOQ'],['tasks','งานในแผน'],['bills','งวดเบิก'],['prs','ใบขอซื้อ'],['pos','ใบสั่งซื้อ'],['costs','ค่าใช้จ่าย'],
  ['subs','ผู้รับเหมาช่วง'],['daily','รายงานประจำวัน'],['vos','งานเพิ่มลด'],['rfis','RFI'],['subm','เอกสารส่งอนุมัติ']];
// what is in a project, as [label, count]; the project's own details (name, client, dates, contract value) do not count
function pjWork(p){const L=[],seen=new Set(['rooms']);
  PJ_WK.forEach(([k,l])=>{seen.add(k.split('.')[0]);const a=k.split('.').reduce((o,x)=>o&&o[x],p);if(Array.isArray(a)&&a.length)L.push([l,a.length])});
  let o=0;Object.entries(p).forEach(([k,v])=>{if(!seen.has(k)&&Array.isArray(v))o+=v.length});if(o)L.push(['ข้อมูลอื่น',o]);
  const q=(CO().quotes||[]).filter(x=>x.pj===p.id).length;if(q)L.push(['ใบเสนอราคาที่ผูกไว้',q]);return L}
const pjAdmin=()=>{const u=me();return !u||ACCESS[u.dept]==='*'};
const pjCan=()=>allowed('pj','setup');
// open project p as the current one, run f, then go back to the page and project you were on unless p is gone
async function pjOn(p,f){const was=DB.cur,tab=S.tab,mode=S.mode;DB.cur=p.id;P=p;
  try{await f()}finally{S.mode=mode;S.tab=tab;if(DB.projects[was]){DB.cur=was;P=DB.projects[was]}save();render()}}
// the approval steps of a cancel request: the heads the company has, then management (who can also approve any step)
const CX_D=['SAL','EST','PRJ','PUR','ACC'];
const cxSteps=()=>CX_D.filter(d=>CO().staff.some(s=>s.dept===d&&isHead(s))).concat('MGT');
const cxNeed=()=>CO().staff.length>0;
const cxLbl=d=>d==='MGT'?'ผู้บริหาร':'หัวหน้า'+((DEPTS().find(x=>x[0]===d)||[])[1]||d);
const cxCan=d=>{const u=me();return !u||u.dept==='MGT'||(u.dept===d&&isHead(u))};
const cxWho=d=>CO().staff.filter(s=>s.dept===d&&(d==='MGT'||isHead(s)));
const cxBy=()=>{const u=me();return u?u.name:'ผู้ดูแลระบบ'};
const cxNo=R=>Object.values(R.appr||{}).find(a=>!a.ok);
const cxOpen=p=>!!(p&&p.cxlReq&&!p.closed&&!cxNo(p.cxlReq));// waiting for approval
const cxNext=R=>R.st.findIndex((d,i)=>!(R.appr||{})[i]&&cxCan(d));// the first step this user can still approve
function cxChat(p,t){if(typeof chPost!=='function')return;try{chPost('p:'+p.id,t)}catch(e){}}
ACT.pjMg=b=>{const p=DB.projects[b.dataset.id];if(!p)return;if(!pjCan()&&!(p.cxlReq&&p.cxlReq.st.some(cxCan))){toast('ต้องเป็นฝ่ายที่แก้ข้อมูลโครงการได้');return}
  const W=pjWork(p),bare=!W.length,del=bare||pjAdmin(),x=p.cxl,R=!p.closed&&p.cxlReq,opt=(a,t,d,cls='',dis='')=>`<button type="button" class="pjm-o ${cls}" data-a="${a}" data-id="${p.id}"${dis}><b>${t}</b><small>${d}</small></button>`,
    dl=opt('pjDel',bare?'ลบทิ้ง (สร้างผิด)':'ลบทิ้งถาวร',bare?'ลบออกจากรายการทันที ถ้ากดผิด กด ↶ ย้อนกลับ ที่แถบด้านบน (Ctrl+Z)':
      del?'ข้อมูลทั้งหมดของโครงการนี้จะหาย จะให้ดาวน์โหลดไฟล์สำรองก่อน แล้วพิมพ์คำว่า ลบ เพื่อยืนยัน':'โครงการที่มีข้อมูลแล้ว เฉพาะผู้บริหารลบได้ ใช้ “ยกเลิกโครงการ” แทน','del',del?'':' disabled');
  const what=`<p class="pjm-w">${bare?'โครงการนี้ยังไม่มีข้อมูลงาน (ไม่มี BOQ แผนงาน เบิกงวด จัดซื้อ หรือเอกสาร)':`ในโครงการนี้มี ${W.map(([l,c])=>`${l} ${fmt(c)}`).join(' · ')}`}</p>`;
  if(R){const no=cxNo(R),mine=pjAdmin()||(me()&&R.byId===S.me);
    dialog(`คำขอยกเลิก “${esc(p.name)}”`,`${what}<div class="pjm-req"><b>${no?'ไม่อนุมัติให้ยกเลิก':'รออนุมัติยกเลิก'}</b><small>ขอโดย ${esc(R.by)} · ${thD(R.at)}</small><p>เหตุผล: ${esc(R.why)}</p></div>
      <div class="pjm-st">${R.st.map((d,i)=>{const a=(R.appr||{})[i];return `<div class="pjm-s"><span class="pill ${a?a.ok?'ok':'bad':''}">${i+1}. ${cxLbl(d)}: ${a?`${a.ok?'อนุมัติ':'ไม่อนุมัติ'} ${esc(a.by)} ${thD(a.at)}${a.why?` · ${esc(a.why)}`:''}`:'รอ'}</span>${!a&&!no&&cxCan(d)?`<button type="button" class="btn sm pri" data-a="pjCxA" data-id="${p.id}" data-i="${i}" data-ok="1">อนุมัติ</button><button type="button" class="btn sm del" data-a="pjCxA" data-id="${p.id}" data-i="${i}" data-ok="">ไม่อนุมัติ</button>`:''}</div>`}).join('')}</div>
      ${!no&&R.st.some((d,i)=>!(R.appr||{})[i]&&cxCan(d))?`<label class="pjm-why">เหตุผลถ้าไม่อนุมัติ (ไม่บังคับ)<input id="pjmNo" maxlength="200"></label>`:''}
      <div class="pjm">${mine||no?opt('pjCxW',no?'ปิดคำขอนี้':'ถอนคำขอยกเลิก',no?'โครงการทำงานต่อตามปกติ ถ้ายังต้องการยกเลิก ส่งคำขอใหม่พร้อมเหตุผลได้':'โครงการกลับเป็นปกติ ไม่ต้องรออนุมัติ'):''}</div>`);return}
  const st=cxSteps(),ask=cxNeed();
  dialog(`ยกเลิก / ลบ “${esc(p.name)}”`,`${what}
    ${p.closed?`<p class="hint" style="margin:0 0 10px">${x?`ยกเลิกเมื่อ ${thD(x.d||p.closed)}${x.why?` · ${esc(x.why)}`:''}`:`ปิดโครงการเมื่อ ${thD(p.closed)}`}</p>`:''}
    <div class="pjm">${bare&&!p.closed?dl:''}${p.closed?opt('pjReopen','เปิดโครงการอีกครั้ง','กลับมาอยู่ในรายการโครงการที่กำลังทำ ยอดรวมและการแจ้งเตือน','pri'):
      `<label class="pjm-why">เหตุผลที่ยกเลิก (ต้องใส่)<input id="pjmWhy" maxlength="200" placeholder="เช่น ลูกค้ายกเลิกสัญญา · ไม่ได้งาน · สร้างซ้ำ"></label>
      ${opt('pjCxl',ask?'ส่งคำขอยกเลิกโครงการ':'ยกเลิกโครงการ (เก็บข้อมูลไว้)',ask?`ต้องให้ ${st.map(cxLbl).join(' · ')} อนุมัติก่อน ระหว่างรอโครงการยังทำงานได้ตามปกติ เมื่ออนุมัติครบ ข้อมูลยังอยู่ครบ ไม่นับในยอดรวม เปิดใหม่ได้`:'ใช้เมื่อจะไม่ทำงานนี้ต่อ ข้อมูลยังอยู่ครบ ไม่นับในยอดรวม ไม่ขึ้นแจ้งเตือน เปิดใหม่ได้ทุกเมื่อ')}
      ${opt('pjDone','ปิดโครงการ (งานจบแล้ว)','เก็บไว้ดูย้อนหลังและพิมพ์เอกสาร ย้ายไปกลุ่ม “ปิดแล้ว”')}`}
      ${bare&&!p.closed?'':dl}</div>`)};
const pjWhy=()=>(($('#pjmWhy')||{}).value||'').trim().slice(0,200);
function cxDone(p){const R=p.cxlReq;p.closed=today();p.cxl={d:today(),why:R.why,by:R.by,st:R.st,appr:R.appr};delete p.cxlReq;
  cxChat(p,`✅ อนุมัติครบ ยกเลิกโครงการ ${p.name} แล้ว\nเหตุผล: ${R.why}`)}
ACT.pjCxl=b=>{const p=DB.projects[b.dataset.id];if(!p)return;const why=pjWhy();
  if(!why){toast('ใส่เหตุผลที่ยกเลิกก่อน');const i=$('#pjmWhy');if(i){i.focus();i.classList.add('pjm-need')}return}$('#dlg').close();
  if(!cxNeed()){p.closed=today();p.cxl={d:today(),why,by:cxBy()};save();render();toast(`ยกเลิกโครงการ ${p.name} แล้ว · กดผิด กด ↶ ย้อนกลับ`);return}
  const u=me(),R=p.cxlReq={id:uid(),why,by:cxBy(),byId:S.me||'',at:today(),st:cxSteps(),appr:{}};
  // a head asking for their own department has already said yes to that step
  if(u)R.st.forEach((d,i)=>{if(d!=='MGT'&&u.dept===d&&isHead(u))R.appr[i]={ok:true,by:u.name,at:today()}});
  const wait=R.st.filter((d,i)=>!R.appr[i]);
  if(!wait.length)cxDone(p);
  else cxChat(p,`📝 ขอยกเลิกโครงการ ${p.name}\nเหตุผล: ${why}\nรออนุมัติ: ${wait.map(d=>cxLbl(d)+cxWho(d).map(s=>' @'+s.name).join('')).join(' · ')}`);
  save();render();toast(wait.length?`ส่งคำขอยกเลิกแล้ว รอ ${wait.map(cxLbl).join(' · ')} อนุมัติ`:`ยกเลิกโครงการ ${p.name} แล้ว`)};
// approve or turn down one step (from this box or from the chat)
function cxSet(p,i,ok,why){const R=p&&p.cxlReq;if(!R||p.closed||cxNo(R)||(R.appr||{})[i]||!cxCan(R.st[i]))return false;
  R.appr[i]={ok,by:cxBy(),at:today()};if(why)R.appr[i].why=why;
  if(!ok)cxChat(p,`❌ ไม่อนุมัติให้ยกเลิกโครงการ ${p.name} (${cxLbl(R.st[i])})${why?'\nเหตุผล: '+why:''}\nโครงการทำงานต่อตามปกติ`);
  else if(R.st.every((_,k)=>R.appr[k]&&R.appr[k].ok))cxDone(p);
  save();render();toast(!ok?'บันทึกไม่อนุมัติแล้ว':p.closed?`อนุมัติครบ ยกเลิกโครงการ ${p.name} แล้ว`:'อนุมัติแล้ว');return true}
ACT.pjCxA=b=>{const p=DB.projects[b.dataset.id],ok=!!b.dataset.ok,why=ok?'':(($('#pjmNo')||{}).value||'').trim().slice(0,200);
  if(cxSet(p,+b.dataset.i,ok,why)&&p.cxlReq&&!cxNo(p.cxlReq)&&cxNext(p.cxlReq)>=0)ACT.pjMg(b);else $('#dlg').close()};
ACT.pjCxW=b=>{const p=DB.projects[b.dataset.id];if(!p||!p.cxlReq)return;const no=cxNo(p.cxlReq);$('#dlg').close();delete p.cxlReq;
  if(!no)cxChat(p,`↩ ถอนคำขอยกเลิกโครงการ ${p.name} แล้ว`);save();render();toast(no?'ปิดคำขอแล้ว':'ถอนคำขอยกเลิกแล้ว')};
ACT.pjDone=b=>{const p=DB.projects[b.dataset.id];if(!p)return;$('#dlg').close();delete p.cxl;delete p.cxlReq;p.closed=today();save();render();toast(`ปิดโครงการ ${p.name} แล้ว`)};
ACT.pjReopen=b=>{const p=DB.projects[b.dataset.id];if(!p)return;$('#dlg').close();delete p.closed;delete p.cxl;delete p.cxlReq;save();render();toast(`เปิดโครงการ ${p.name} อีกครั้งแล้ว`)};
ACT.pjDel=async b=>{const p=DB.projects[b.dataset.id];if(!p)return;$('#dlg').close();
  if(pjWork(p).length){if(!pjAdmin()){toast('โครงการที่มีข้อมูลแล้ว เฉพาะผู้บริหารลบได้');return}await pjOn(p,()=>ACT.delProj());return}
  const nm=p.name;delete DB.projects[p.id];CO().quotes&&CO().quotes.forEach(q=>{if(q.pj===p.id)q.pj=''});
  if(!Object.keys(DB.projects).length){const q=blankProject('โครงการใหม่');DB.projects[q.id]=q}
  if(!DB.projects[DB.cur]){const nx=pjOpen()[0]||Object.values(DB.projects)[0];DB.cur=nx.id;P=nx;S.sel={}}
  save();render();toast(`ลบโครงการ ${nm} แล้ว · กดผิด กด ↶ ย้อนกลับ`)};
// deleting a project that has work in it is for management only, from ข้อมูลโครงการ too
{const f=ACT.delProj;ACT.delProj=(...a)=>{if(pjWork(P).length&&!pjAdmin()){toast('โครงการที่มีข้อมูลแล้ว เฉพาะผู้บริหารลบได้ ใช้ “ยกเลิกโครงการ” แทน');return}return f(...a)}}
{const f=ACT.projOpen;ACT.projOpen=(...a)=>{delete P.cxl;return f(...a)}}
{const f=ACT.projClose;ACT.projClose=(...a)=>{delete P.cxl;return f(...a)}}
// ทุกโครงการ: the row says ยกเลิกแล้ว, and each row gets its ยกเลิก / ลบ button
{const f=paRow;paRow=function(p,A){const r=f(p,A);if(p.closed&&p.cxl)r.st='ยกเลิกแล้ว'+(p.cxl.why?` · ${p.cxl.why}`:'');
  else if(cxOpen(p)){r.st='รออนุมัติยกเลิก';if(r.lv!=='bad')r.lv='warn'}return r}}
{const f=VIEWS.pjall;VIEWS.pjall=()=>{const h=f();
  return h.replace(/(<tr class="pa-r [^"]*" data-a="go" data-m="pj" data-k="dash" data-p="([^"]+)"[\s\S]*?)<\/td>/g,(m,a,id)=>{const p=DB.projects[id];
    return p&&(pjCan()||p.cxlReq&&cxOpen(p)&&cxNext(p.cxlReq)>=0)?`${a}<button type="button" class="btn sm pa-mg" data-a="pjMg" data-id="${id}" title="ยกเลิก ปิด หรือลบโครงการนี้">${p.closed?'เปิดใหม่ / ลบ':cxOpen(p)?'ดูคำขอยกเลิก':'ยกเลิก / ลบ'}</button></td>`:m})
    .replace('กดที่โครงการเพื่อเปิดภาพรวมของโครงการนั้น · ','กดที่โครงการเพื่อเปิดภาพรวมของโครงการนั้น · สร้างผิด กด “ยกเลิก / ลบ” · ')}}
// ข้อมูลโครงการ: the same choices next to ปิดโครงการ, and the banner says it was cancelled
{const f=VIEWS.setup;VIEWS.setup=()=>{let h=f();
  if(P.closed&&P.cxl)h=h.replace(/<div class="pj-closed">[^<]*<\/div>/,`<div class="pj-closed">โครงการนี้ยกเลิกเมื่อ ${thD(P.cxl.d||P.closed)}${P.cxl.why?` (${esc(P.cxl.why)})`:''} ข้อมูลยังดูและพิมพ์ได้ตามปกติ</div>`);
  if(!P.closed)h=h.replace('<button type="button" class="btn del" data-a="delProj">',`<button type="button" class="btn" data-a="pjMg" data-id="${P.id}">${cxOpen(P)?'ดูคำขอยกเลิก':'ยกเลิกโครงการ'}</button>$&`);
  if(cxOpen(P))h=`<div class="pj-cxw">โครงการนี้รออนุมัติยกเลิก (${esc(P.cxlReq.why)}) ระหว่างนี้ทำงานได้ตามปกติ <button type="button" class="btn sm" data-a="pjMg" data-id="${P.id}">ดูคำขอ</button></div>`+h;
  return h}}
// what waits for this user: the dashboards' รอคุณอนุมัติ list and the chat's approvals
{const f=myQueue;myQueue=function(){const Q=f();projects().filter(cxOpen).forEach(p=>{const i=cxNext(p.cxlReq);
  if(i>=0)Q.push({t:'คำขอยกเลิกโครงการ',no:'',p,step:cxLbl(p.cxlReq.st[i]),go:{m:'pj',k:'pjall',p:p.id}})});return Q}}
if(typeof CHAP==='object'){CHAP.cxl=['ขอยกเลิกโครงการ','ยก','#c0564b'];
  {const f=chQueue;chQueue=function(){const Q=f();if(!cmMe())return Q;projects().filter(cxOpen).forEach(p=>{const R=p.cxlReq,i=cxNext(R);
    if(i>=0)Q.push({k:'cxl',id:p.id,no:p.name,i,sub:`ขอโดย ${R.by} · ${cxLbl(R.st[i])}`,det:'เหตุผล: '+R.why})});return Q}}
  {const f=ACT.chAp;ACT.chAp=b=>{if(b.dataset.k!=='cxl')return f(b);const p=DB.projects[b.dataset.id],ok=!!b.dataset.ok,wi=$('#chPop [data-chwhy]'),why=!ok&&wi?wi.value.trim().slice(0,200):'';
    if(!cxSet(p,p&&p.cxlReq?cxNext(p.cxlReq):-1,ok,why))toast('รายการนี้ไม่ต้องอนุมัติแล้ว');CH.rej='';chBadge();chDraw()}}
  {const f=ACT.chApGo;ACT.chApGo=b=>{if(b.dataset.k!=='cxl')return f(b);S.mode='pj';S.tab='pjall';render();ACT.pjMg({dataset:{id:b.dataset.id}})}}}
document.head.insertAdjacentHTML('beforeend',`<style>
.pa-t td .pa-mg{display:inline-flex;margin:6px 0 0 6px;padding:2px 10px;font-size:12px;opacity:.75}
.pa-r:hover .pa-mg,.pa-mg:focus-visible{opacity:1}
.pjm-w{margin:0 0 10px;font-weight:600}
.pjm{display:grid;gap:8px;min-width:min(440px,80vw)}
.pjm-why{display:flex;flex-direction:column;gap:4px;font-size:13px;color:var(--muted)}
.pjm-o{all:unset;box-sizing:border-box;cursor:pointer;display:flex;flex-direction:column;gap:2px;padding:10px 14px;border:1px solid var(--line);border-radius:12px;background:var(--card,var(--bg))}
.pjm-o b{color:var(--ink);font-size:15px}.pjm-o small{color:var(--muted);font-size:12.5px;line-height:1.4}
.pjm-o:hover,.pjm-o:focus-visible{border-color:var(--accent);background:var(--sunk)}
.pjm-o.pri{border-color:var(--accent)}
.pjm-o.del b{color:var(--danger)}.pjm-o.del:hover{border-color:var(--danger)}
.pjm-o[disabled]{cursor:not-allowed;opacity:.55}
.pjm-why input.pjm-need{border-color:var(--danger);box-shadow:0 0 0 2px var(--danger-soft)}
.pjm-req{margin:0 0 10px;padding:10px 14px;border-radius:12px;background:var(--warn-soft,var(--sunk));border:1px solid var(--line)}
.pjm-req b{display:block;font-size:15px}.pjm-req small{color:var(--muted)}.pjm-req p{margin:6px 0 0}
.pjm-st{display:grid;gap:6px;margin:0 0 10px}
.pjm-s{display:flex;flex-wrap:wrap;align-items:center;gap:6px}.pjm-s .pill{margin:0}
.pj-cxw{margin:0 0 12px;padding:10px 14px;border-radius:12px;background:var(--warn-soft,var(--sunk));color:var(--ink);border:1px solid var(--line);font-size:14px}.pj-cxw .btn{margin-left:8px}
</style>`);
if(typeof I18N==='object'&&I18N.en&&I18N.en.x)Object.assign(I18N.en.x,{'ยกเลิก / ลบ':'Cancel / delete','เปิดใหม่ / ลบ':'Reopen / delete','ยกเลิก ปิด หรือลบโครงการนี้':'Cancel, close or delete this project',
  'ยกเลิกโครงการ':'Cancel project','ยกเลิกโครงการ (เก็บข้อมูลไว้)':'Cancel project (keep data)','ปิดโครงการ (งานจบแล้ว)':'Close project (work finished)','ลบทิ้ง (สร้างผิด)':'Delete (made by mistake)',
  'ลบทิ้งถาวร':'Delete permanently','เปิดโครงการอีกครั้ง':'Reopen project','เหตุผลที่ยกเลิก (ต้องใส่)':'Reason for cancelling (required)','ส่งคำขอยกเลิกโครงการ':'Request to cancel the project',
  'รออนุมัติยกเลิก':'Cancellation awaiting approval','ไม่อนุมัติให้ยกเลิก':'Cancellation turned down','ดูคำขอยกเลิก':'View cancel request','ถอนคำขอยกเลิก':'Withdraw cancel request',
  'ปิดคำขอนี้':'Close this request','เหตุผลถ้าไม่อนุมัติ (ไม่บังคับ)':'Reason if turned down (optional)','คำขอยกเลิกโครงการ':'Cancel request','ขอยกเลิกโครงการ':'Cancel project request','ยกเลิกแล้ว':'Cancelled',
  'โครงการนี้ยังไม่มีข้อมูลงาน (ไม่มี BOQ แผนงาน เบิกงวด จัดซื้อ หรือเอกสาร)':'This project has no work in it yet (no BOQ, schedule, claims, purchasing or documents)'});
