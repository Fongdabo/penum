/* ---------- 4.99.18 ตัวเลขยอดขายแก้ได้เฉพาะฝ่ายขาย (user: "ตัวเลขยอดขาย ให้แก้ไขได้แค่ฝ่ายขายดีไหม", "ฝ่ายอื่นต้องไม่สามารถแก้ไขได้", "เอา") ----------
   The quotations (ขาย › ใบเสนอราคา: prices, quantities, markups, discounts and the rest of the quote) and a job's contract value
   (ข้อมูลโครงการ / วิธีเบิกงวด: มูลค่าสัญญา, ใช้ยอดจาก BOQ) can be changed only by the sales department, management, or the
   administrator (nobody signed in). Everyone else sees them read-only: boxes are locked and the buttons that change a quote do
   nothing but say why. They can press ขอแก้ไข instead: the request goes to sales and management in the chat's รอคุณอนุมัติ
   and on the dashboards; an approval lets that person edit that one quote or contract value for 24 hours, and the answer is
   told back in the chat. Every change of a number is kept in co.sfLog (who, when, what, from → to) and shown under the quote
   or the project as ประวัติแก้ตัวเลขยอดขาย. The file sits before 910 (911–989 are taken): the chat parts are added at render time. */
const SF_TTL=24*3600e3;
const sfDeptOk=()=>{const u=typeof me==='function'&&me();return !u||u.dept==='SAL'||u.dept==='MGT'};
const sfWho=()=>{const u=typeof me==='function'&&me();return u?u.name:'ผู้ดูแลระบบ'};
// ref: a quote's id, or 'p:<project id>' for a contract value
function sfCan(ref){if(sfDeptOk())return true;const g=(CO().sfGrant||[]).find(x=>x.u===S.me&&x.ref===ref&&x.till>Date.now());return !!g}
const sfOnQuotes=()=>S.mode==='co'&&S.ctab==='sales'&&(S.sub.sales||'quote')==='quote';
const sfCurQ=()=>{const L=CO().quotes||[];return L.find(q=>q.id===S.sel.quote)||L[L.length-1]||null};
const sfRefOfPath=p=>{let m=p.match(/^co\.quotes\.([^.]+)/);if(m)return m[1];if(/^info\.(cv|cvAuto)$/.test(p)&&P)return 'p:'+P.id;return null};
const sfNoOf=ref=>{if(!ref)return '';if(ref.startsWith('p:')){const p=DB.projects[ref.slice(2)];return p?'มูลค่าสัญญา '+p.name:'มูลค่าสัญญา'}const q=(CO().quotes||[]).find(x=>x.id===ref);return q?q.no:''};
// the log
function sfLogAdd(ref,what,o,v,note){const C=CO(),L=C.sfLog=C.sfLog||[];L.push({id:uid(),at:new Date().toISOString(),by:sfWho(),u:S.me||'',ref,no:sfNoOf(ref),what,o,v,note:note||''});if(L.length>1000)L.splice(0,L.length-1000)}
const SF_K={q:'จำนวน',m:'ค่าของ/หน่วย',l:'ค่าแรง/หน่วย',mk:'กำไร %',mkM:'กำไรค่าของ %',mkL:'กำไรค่าแรง %',mkE:'กำไรค่าเครื่อง %',disc:'ส่วนลด',wp:'เผื่อ %',wa:'เผื่อ (จำนวนเงิน)',eqp:'ราคาเครื่อง',valid:'ยืนราคา (วัน)',cv:'มูลค่าสัญญา ไม่รวม VAT'};
function sfLabel(el,p){let t=SF_K[p.split('.').pop()]||'';if(t&&!/\.items\./.test(p))return t;const lb=el.closest('label');if(lb)t=[...lb.childNodes].filter(x=>x.nodeType===3).map(x=>x.textContent).join(' ').trim();
  const td=!t&&el.closest('td'),tb=td&&td.closest('table');if(tb&&tb.tHead){const r=tb.tHead.rows[tb.tHead.rows.length-1],c=r&&r.cells[td.cellIndex];t=c?c.textContent.replace(/[⌄▲▼●]/g,'').trim():''}
  const m=p.match(/^co\.quotes\.[^.]+\.items\.([^.]+)\./);if(m){const q=resolve(p.split('.items.')[0]),it=q&&(q.items||[]).find(x=>x.id===m[1]);if(it)t=(t||p.split('.').pop())+' · '+String(it.desc||'').slice(0,60)}
  return t||p.split('.').pop()}
// the guards: a change of a locked box is put back; a button that changes a quote does nothing for someone without the right
const SF_VIEW=new Set(['dept','page','wfSel','wfBarOff','sub','tab','mode','go','sel','qgView','qgFold','qgMet','qSort','qColClr','print','qsplit','qXl','qfsPv','qcOpen','cmAt','cmPost','dlgClose','qlAsk','sfReq','sfReqGo','sfLogMore','fsPick']);
const sfNo=ref=>toast(`ตัวเลขยอดขาย${ref&&ref.startsWith('p:')?' (มูลค่าสัญญา)':''} แก้ได้เฉพาะฝ่ายขายและผู้บริหาร · กด “ขอแก้ไข” เพื่อส่งคำขอ`);
document.addEventListener('change',e=>{const el=e.target;if(!el||!el.closest)return;const p=el.dataset&&el.dataset.p,ref=p?sfRefOfPath(p):null;
  if(ref){const cur=resolve(p);
    if(!sfCan(ref)){if(el.type==='checkbox')el.checked=!!cur;else el.value=cur==null?'':cur;e.stopImmediatePropagation();sfNo(ref);return}
    if(el.dataset.t==='num'){const v=el.value.trim()===''?'':n(el.value);if(n(cur)!==n(v))sfLogAdd(ref,sfLabel(el,p),cur,v,sfDeptOk()?'':'ตามคำขอที่อนุมัติแล้ว')}
    else if(p==='info.cvAuto')sfLogAdd(ref,'ใช้ยอดจาก BOQ',cur?'ใช่':'ไม่',el.checked?'ใช่':'ไม่');return}
  if(sfOnQuotes()&&el.closest('#view')&&!el.closest('.cm-in,.sf-ok')&&!sfCan((sfCurQ()||{}).id)){e.stopImmediatePropagation();e.preventDefault();sfNo();render()}},true);
document.addEventListener('click',e=>{const b=e.target.closest&&e.target.closest('[data-a]');if(!b)return;const a=b.dataset.a;
  if(a==='cvUseQ'&&P&&!sfCan('p:'+P.id)){e.stopImmediatePropagation();e.preventDefault();sfNo('p:');return}
  if(!sfOnQuotes()||SF_VIEW.has(a)||!b.closest('#view,#dlg'))return;const q=sfCurQ();if(sfCan(q&&q.id))return;
  e.stopImmediatePropagation();e.preventDefault();sfNo()},true);
{const f=ACT.cvUseQ;if(f)ACT.cvUseQ=function(){const o=P&&n(P.info.cv);f.apply(this,arguments);if(P&&n(P.info.cv)!==o)sfLogAdd('p:'+P.id,'มูลค่าสัญญา (ใช้ยอดใบเสนอราคา)',o,n(P.info.cv));save()}}
// asking: what to change, sent to sales and management
ACT.sfReq=b=>{const ref=b.dataset.ref,no=sfNoOf(ref),open=(CO().sfReq||[]).find(r=>r.ref===ref&&r.u===S.me&&r.st==='req');
  dialog(`ขอแก้ไข ${esc(no)}`,`<p class="hint" style="margin-top:0">ตัวเลขยอดขายแก้ได้เฉพาะฝ่ายขายและผู้บริหาร บอกว่าต้องการแก้อะไร จากเท่าไรเป็นเท่าไร คำขอจะไปที่แชท › รอคุณอนุมัติ ของฝ่ายขายและผู้บริหาร เมื่ออนุมัติแล้วคุณแก้รายการนี้ได้ 24 ชั่วโมง</p>
    ${open?`<p class="hint">ส่งคำขอไปแล้วเมื่อ ${thD(open.at)} รออนุมัติอยู่</p>`:''}<div class="form"><label class="full">ต้องการแก้อะไร<textarea id="sfReqT" rows="3" placeholder="เช่น ราคาค่าแรงรายการกล้อง 2MP จาก 1,200 เป็น 1,000 ตามที่ลูกค้าต่อรอง"></textarea></label></div>`,
    `<button type="button" class="btn pri" data-a="sfReqGo" data-ref="${esc(ref)}">ส่งคำขอ</button>`);setTimeout(()=>{const t=$('#sfReqT');if(t)t.focus()},0)};
ACT.sfReqGo=b=>{const t=String(($('#sfReqT')||{}).value||'').trim();if(!t){toast('บอกว่าต้องการแก้อะไร');return}const ref=b.dataset.ref,C=CO();C.sfReq=C.sfReq||[];
  C.sfReq.push({id:uid(),ref,no:sfNoOf(ref),u:S.me||'',by:sfWho(),at:today(),note:t.slice(0,500),st:'req'});save();$('#dlg').close();render();toast('ส่งคำขอแก้ไขแล้ว ฝ่ายขายและผู้บริหารจะเห็นในแชท › รอคุณอนุมัติ')};
const sfReqs=()=>sfDeptOk()?(CO().sfReq||[]).filter(r=>r.st==='req'):[];
function sfDecide(id,ok,why){const r=(CO().sfReq||[]).find(x=>x.id===id);if(!r||r.st!=='req'||!sfDeptOk())return null;r.st=ok?'ok':'no';r.apBy=sfWho();r.apAt=today();if(why)r.why=why;
  if(ok){const C=CO();C.sfGrant=(C.sfGrant||[]).filter(g=>g.till>Date.now());C.sfGrant.push({u:r.u,ref:r.ref,till:Date.now()+SF_TTL,by:r.apBy})}return r}
ACT.sfAp=b=>{const r=sfDecide(b.dataset.id,!!b.dataset.ok,'');if(!r)return;save();render();
  const m=typeof chApTell==='function'&&r.u?chApTell({k:'sfr',id:r.id,no:r.no,who:r.u,sub:r.no+' · '+r.note.slice(0,60)},r.st==='ok',''):'';toast((r.st==='ok'?'อนุมัติแล้ว ผู้ขอแก้ได้ 24 ชั่วโมง':'บันทึกไม่อนุมัติแล้ว')+(m||''))};
if(typeof myQueue==='function'){const f=myQueue;myQueue=function(){const Q=f();sfReqs().forEach(r=>Q.push({t:'ขอแก้ตัวเลขยอดขาย',no:r.no,p:{name:r.by||''},step:r.note.slice(0,60),go:r.ref.startsWith('p:')?{m:'pj',k:'setup',p:r.ref.slice(2)}:{m:'co',k:'sales',s:'quote'}}));return Q}}
// the chat (910/987 come after this file): its parts are added once, at the first drawing
const sfWrapChat=()=>{if(typeof CHAP!=='object'||typeof chQueue!=='function'||chQueue.__sf)return;CHAP.sfr=['ขอแก้ตัวเลขยอดขาย','✎฿','#7a6a4f'];
  const q=chQueue;chQueue=function(){const Q=q.apply(this,arguments);if(typeof cmMe==='function'&&!cmMe())return Q;
    sfReqs().forEach(r=>Q.push({k:'sfr',id:r.id,no:r.no,who:r.u||'',sub:`${r.no} · ${r.by||''}`,det:`${r.note} · ${thD(r.at)}`}));return Q};chQueue.__sf=1;
  const a=ACT.chAp;ACT.chAp=function(b){if(b.dataset.k!=='sfr')return a.apply(this,arguments);const wi=$('#chPop [data-chwhy]'),ok=!!b.dataset.ok,why=!ok&&wi?wi.value.trim().slice(0,300):'';
    const r=sfDecide(b.dataset.id,ok,why);if(!r){toast('รายการนี้ไม่ต้องอนุมัติแล้ว');CH.rej='';chDraw();return}save();render();
    const m=typeof chApTell==='function'&&r.u?chApTell({k:'sfr',id:r.id,no:r.no,who:r.u,sub:r.no+' · '+r.note.slice(0,60)},ok,why):'';toast((ok?'อนุมัติแล้ว ผู้ขอแก้ได้ 24 ชั่วโมง':'บันทึกไม่อนุมัติแล้ว')+(m||''));CH.rej='';chBadge();chDraw()};
  const g=ACT.chApGo;ACT.chApGo=function(b){if(b.dataset.k!=='sfr')return g.apply(this,arguments);const r=(CO().sfReq||[]).find(x=>x.id===b.dataset.id);if(!r)return;
    if(r.ref.startsWith('p:'))return ACT.go({dataset:{m:'pj',k:'setup',p:r.ref.slice(2)}});S.sel.quote=r.ref;ACT.go({dataset:{m:'co',k:'sales',s:'quote'}})}};
// on the page: locked boxes, the ขอแก้ไข bar, open requests for sales, and the history
const sfLogHtml=ref=>{const L=(CO().sfLog||[]).filter(x=>x.ref===ref).slice().reverse();if(!L.length)return '';const sh=S.sfAll===ref?L:L.slice(0,8);
  return `<details class="sf-log"><summary>ประวัติแก้ตัวเลขยอดขาย (${L.length})</summary><div class="tw"><table><thead><tr><th>เมื่อ</th><th>ผู้แก้</th><th>รายการ</th><th class="r">เดิม</th><th class="r">ใหม่</th></tr></thead><tbody>
    ${sh.map(x=>`<tr><td>${(D=>thD(`${D.getFullYear()}-${String(D.getMonth()+1).padStart(2,'0')}-${String(D.getDate()).padStart(2,'0')}`)+' '+D.toTimeString().slice(0,5))(new Date(x.at))}</td><td>${esc(x.by)}${x.note?` <small class="muted">${esc(x.note)}</small>`:''}</td><td>${esc(x.what)}</td><td class="r">${typeof x.o==='number'?fmt(x.o,2):esc(String(x.o??''))}</td><td class="r">${typeof x.v==='number'?fmt(x.v,2):esc(String(x.v??''))}</td></tr>`).join('')}</tbody></table></div>
    ${L.length>sh.length?`<button type="button" class="btn sm ghost sf-ok" data-a="sfLogMore" data-ref="${esc(ref)}">ดูทั้งหมด ${L.length} รายการ</button>`:''}</details>`};
ACT.sfLogMore=b=>{S.sfAll=b.dataset.ref;render()};
const sfBar=ref=>{if(sfDeptOk())return '';const g=(CO().sfGrant||[]).find(x=>x.u===S.me&&x.ref===ref&&x.till>Date.now());
  if(g)return `<div class="sf-bar ok">แก้ได้ถึง ${new Date(g.till).toLocaleString('th-TH',{dateStyle:'short',timeStyle:'short'})} ตามที่ ${esc(g.by||'')} อนุมัติ</div>`;
  const open=(CO().sfReq||[]).find(r=>r.ref===ref&&r.u===S.me&&r.st==='req');
  return `<div class="sf-bar">🔒 ตัวเลขยอดขายแก้ได้เฉพาะฝ่ายขายและผู้บริหาร${open?` · ส่งคำขอแก้แล้วเมื่อ ${thD(open.at)} รออนุมัติ`:''} <button type="button" class="btn sm" data-a="sfReq" data-ref="${esc(ref)}">ขอแก้ไข</button></div>`};
const sfReqCard=()=>{const L=sfReqs();if(!L.length)return '';
  return `<div class="sf-bar req"><b>คำขอแก้ตัวเลขยอดขาย ${L.length} รายการ</b>${L.map(r=>`<div class="sf-r"><span><b>${esc(r.no)}</b> · ${esc(r.by)} · ${esc(r.note)} <small class="muted">${thD(r.at)}</small></span><span><button type="button" class="btn sm pri" data-a="sfAp" data-id="${r.id}" data-ok="1">อนุมัติ</button> <button type="button" class="btn sm" data-a="sfAp" data-id="${r.id}">ไม่อนุมัติ</button></span></div>`).join('')}</div>`};
SF_VIEW.add('sfAp');
function sfMark(){const v=$('#view');if(!v)return;
  const lock=(sel,ok)=>v.querySelectorAll(sel).forEach(el=>{if(ok)return;if(el.type==='checkbox'||el.tagName==='SELECT')el.disabled=true;else el.readOnly=true;el.classList.add('sf-lk')});
  if(sfOnQuotes()){const q=sfCurQ(),ok=sfCan(q&&q.id);lock('[data-p^="co.quotes."]',ok);
    if(!ok)v.querySelectorAll('input:not([data-p]):not([type=search]),select:not([data-p]),textarea:not([data-p]):not(.cm-in)').forEach(el=>{if(el.closest('.sf-ok'))return;if(el.type==='checkbox'||el.tagName==='SELECT')el.disabled=true;else el.readOnly=true});
    const pb=q&&v.querySelector(`[data-a="print"][data-k="quote"][data-id="${q.id}"]`),sec=pb&&pb.closest('section'),h2=sec&&sec.querySelector('h2');
    if(h2&&!sec.querySelector('.sf-bar'))h2.insertAdjacentHTML('afterend',sfBar(q.id)+sfReqCard());
    if(sec&&!sec.querySelector('.sf-log'))sec.insertAdjacentHTML('beforeend',sfLogHtml(q.id))}
  if(S.mode==='pj'&&P){const ok=sfCan('p:'+P.id);lock('[data-p="info.cv"],[data-p="info.cvAuto"]',ok);const el=v.querySelector('[data-p="info.cv"]');
    if(el){const sec=el.closest('section'),h2=sec&&sec.querySelector('h2');if(h2&&!sec.querySelector('.sf-bar'))h2.insertAdjacentHTML('afterend',sfBar('p:'+P.id)+(S.tab==='setup'?sfReqCard():''));
      if(S.tab==='setup'&&sec&&!sec.querySelector('.sf-log'))sec.insertAdjacentHTML('beforeend',sfLogHtml('p:'+P.id))}}}
{const r=render;render=function(){try{sfWrapChat()}catch(e){}const x=r.apply(this,arguments);try{sfMark()}catch(e){console.error(e)}return x}}
document.head.insertAdjacentHTML('beforeend',`<style>
.sf-bar{margin:0 0 12px;padding:8px 12px;border-radius:10px;background:var(--warn-soft,#fef3c7);display:flex;gap:10px;align-items:center;flex-wrap:wrap;font-size:13.5px}
.sf-bar.ok{background:var(--good-soft,#dcfce7)}.sf-bar.req{display:block;background:var(--accent-soft,#e0f2fe)}.sf-r{display:flex;gap:10px;justify-content:space-between;align-items:center;flex-wrap:wrap;padding:6px 0;border-top:1px solid var(--line)}
.sf-lk{opacity:.75;cursor:not-allowed}
.sf-log{margin-top:12px;font-size:13px}.sf-log summary{cursor:pointer;color:var(--muted);font-weight:600}.sf-log table{margin-top:6px}
</style>`);
if(typeof SBKW==='object')Object.assign(SBKW,{'co.sales.quote':(SBKW['co.sales.quote']||'')+' ขอแก้ไข สิทธิ์แก้ราคา ประวัติแก้ตัวเลข ล็อกราคา'});
