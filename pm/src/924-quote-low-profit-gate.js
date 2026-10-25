/* ---------- 4.41 a quotation under the profit target needs a head's approval before the customer copy (user: "ทำทั้งหมดเลย", item 5) ----------
   When the net profit (922 qrNow: after hidden costs) is under the company target (co.qTgt), printing the customer copy, its Excel,
   or setting the status to ส่งแล้ว first asks for approval. The head of sales or management (or the administrator when nobody is
   signed in) approves on the spot; anyone else sends a request (Q.lowReq) that shows in the chat's approvals and the dashboard's
   รอคุณอนุมัติ, and the answer is told back in the chat. An approval (Q.lowOk) holds for that profit % or better: lowering the
   price further asks again. The internal copy is never blocked. */
const qlCan=()=>{const u=typeof me==='function'&&me();return !u||u.dept==='MGT'||(u.dept==='SAL'&&isHead(u))};
const qlNeed=Q=>{if(!Q||!(Q.items||[]).length)return null;const R=qrNow(Q);if(!R.low)return null;const ok=Q.lowOk;return ok&&R.npc>=n(ok.npc)-0.05?null:R};
const qlWho=()=>{const u=typeof me==='function'&&me();return u?u.name:'ผู้ดูแลระบบ'};
function qlApprove(Q,ok,why){const R=qrNow(Q),r=Q.lowReq;if(ok)Q.lowOk={by:qlWho(),at:today(),npc:Math.round(R.npc*10)/10,net:R.net};else Q.lowNo={by:qlWho(),at:today(),why:why||''};delete Q.lowReq;return r}
const qlMsg=(Q,R)=>`<p>กำไรสุทธิของ <b>${esc(Q.no||'')}</b> อยู่ที่ <b style="color:var(--danger,#c0392b)">${fmt(R.npc,1)}%</b> (${fmt(R.np,2)} บาท) ต่ำกว่าเป้า ${fmt(R.t,1)}% ของบริษัท</p>
  <p class="hint">ต้องให้ผู้จัดการฝ่ายขายหรือผู้บริหารอนุมัติก่อนพิมพ์หรือส่งให้ลูกค้า ราคาต่ำสุดที่ได้ตามเป้าคือ ${R.fl===Infinity?'–':fmt(Math.ceil(R.fl),2)} บาท (ก่อน VAT) ฉบับภายในพิมพ์ได้ตามปกติ</p>
  ${Q.lowReq?`<p class="hint">ส่งคำขออนุมัติไปแล้วเมื่อ ${thD(Q.lowReq.at)} โดย ${esc(Q.lowReq.by||'')}</p>`:''}${Q.lowNo?`<p class="hint" style="color:var(--danger,#c0392b)">ครั้งก่อนไม่อนุมัติ โดย ${esc(Q.lowNo.by)} ${thD(Q.lowNo.at)}${Q.lowNo.why?' · '+esc(Q.lowNo.why):''}</p>`:''}`;
// the gate: true = go on; else it shows what to do, and "then" runs after an approval on the spot
let QL_THEN=null;
function qlGate(Q,then){const R=qlNeed(Q);if(!R)return true;QL_THEN=then;
  dialog('กำไรต่ำกว่าเป้า ต้องอนุมัติก่อน',qlMsg(Q,R),qlCan()?`<button type="button" class="btn pri" data-a="qlOkNow" data-id="${Q.id}">อนุมัติราคานี้และทำต่อ</button>`
    :`<button type="button" class="btn pri" data-a="qlAsk" data-id="${Q.id}"${Q.lowReq?' disabled':''}>${Q.lowReq?'รออนุมัติอยู่':'ส่งขออนุมัติ'}</button>`);return false}
ACT.qlOkNow=b=>{const Q=CO().quotes.find(q=>q.id===b.dataset.id);if(!Q||!qlCan())return;qlApprove(Q,true);save();$('#dlg').close();const t=QL_THEN;QL_THEN=null;toast('อนุมัติราคานี้แล้ว');if(t)t();else render()};
ACT.qlAsk=b=>{const Q=CO().quotes.find(q=>q.id===b.dataset.id);if(!Q)return;const R=qrNow(Q);Q.lowReq={by:qlWho(),u:S.me||'',at:today(),npc:Math.round(R.npc*10)/10,net:R.net};delete Q.lowNo;save();
  $('#dlg').close();QL_THEN=null;render();toast('ส่งขออนุมัติแล้ว ผู้จัดการฝ่ายขายและผู้บริหารจะเห็นในแชท › รอคุณอนุมัติ')};
// where the customer copy leaves: print, the ORIEN Excel, the status ส่งแล้ว
{const f=ACT.print;ACT.print=function(b){if(b&&b.dataset&&b.dataset.k==='quote'){const Q=CO().quotes.find(q=>q.id===b.dataset.id),self=this,a=arguments;if(Q&&!qlGate(Q,()=>f.apply(self,a)))return}return f.apply(this,arguments)}}
// ACT.qXl comes from 981, after this file: wrap it at render time
const qlWrapXl=()=>{if(!ACT.qXl||ACT.qXl.__ql)return;const f=ACT.qXl;ACT.qXl=function(b){if(b&&b.dataset&&b.dataset.v==='0'){const Q=CO().quotes.find(q=>q.id===b.dataset.id),self=this,a=arguments;if(Q&&!qlGate(Q,()=>f.apply(self,a)))return}return f.apply(this,arguments)};ACT.qXl.__ql=1};
{const r=render;render=function(){try{qlWrapXl()}catch(e){}return r.apply(this,arguments)}}
HOOK.push((p,v)=>{const m=p.match(/^co\.quotes\.([^.]+)\.status$/);if(!m||v!=='sent')return;const Q=CO().quotes.find(x=>x.id===m[1]);if(!Q||Q.status!=='sent'||!qlNeed(Q))return;
  Q.status='draft';setTimeout(()=>qlGate(Q,()=>{Q.status='sent';if(typeof qrvSave==='function')qrvSave(Q,'sent');save();render()}),60)});
// the status on the internal card (922)
{const f=qrCard;qrCard=function(Q){const h=f.apply(this,arguments);if(!h||!Q)return h;const R=qrNow(Q);if(!R.low&&!Q.lowReq)return h;const need=qlNeed(Q);
  const s=!need?`<div class="ql-s ok">อนุมัติราคานี้แล้ว โดย ${esc(Q.lowOk.by)} ${thD(Q.lowOk.at)} (ที่กำไรสุทธิ ${fmt(n(Q.lowOk.npc),1)}%)</div>`
    :`<div class="ql-s">ต้องให้ผู้จัดการฝ่ายขายหรือผู้บริหารอนุมัติก่อนพิมพ์หรือส่งให้ลูกค้า${Q.lowReq?` · ส่งคำขอแล้วเมื่อ ${thD(Q.lowReq.at)} โดย ${esc(Q.lowReq.by)}`:''}
      ${qlCan()?`<button type="button" class="btn sm pri" data-a="qlOkNow" data-id="${Q.id}">อนุมัติราคานี้</button>`:Q.lowReq?'':`<button type="button" class="btn sm pri" data-a="qlAsk" data-id="${Q.id}">ส่งขออนุมัติ</button>`}</div>`;
  return h.replace(/<\/section>$/,s+'</section>')}}
// requests in the chat (910/987) and the dashboards' รอคุณอนุมัติ (240 myQueue)
const qlReqs=()=>qlCan()?(CO().quotes||[]).filter(q=>q.lowReq&&qlNeed(q)):[];
if(typeof myQueue==='function'){const f=myQueue;myQueue=function(){const Q=f();qlReqs().forEach(q=>Q.push({t:'ใบเสนอราคากำไรต่ำกว่าเป้า',no:q.no,p:{name:q.title||q.pname||''},step:`กำไรสุทธิ ${fmt(n(q.lowReq.npc),1)}%`,go:{m:'co',k:'sales',s:'quote'}}));return Q}}
if(typeof CHAP==='object'){CHAP.qlow=['ราคาต่ำกว่าเป้ากำไร','฿↓','#b45309'];
  {const f=chQueue;chQueue=function(){const Q=f();if(!cmMe())return Q;qlReqs().forEach(q=>{let amt=0;try{amt=qCalc(q).net}catch(e){}
    Q.push({k:'qlow',id:q.id,no:q.no,amt,who:q.lowReq.u||'',sub:`${q.title||q.pname||''} · กำไรสุทธิ ${fmt(n(q.lowReq.npc),1)}% (เป้า ${fmt(qTgt(),1)}%)`,det:`ขอโดย ${q.lowReq.by||''} ${thD(q.lowReq.at)} · ราคาเสนอก่อน VAT`})});return Q}}
  {const f=ACT.chAp;ACT.chAp=b=>{if(b.dataset.k!=='qlow')return f(b);const Q=CO().quotes.find(q=>q.id===b.dataset.id);if(!Q||!Q.lowReq||!qlCan()){toast('รายการนี้ไม่ต้องอนุมัติแล้ว');CH.rej='';chDraw();return}
    const ok=!!b.dataset.ok,wi=$('#chPop [data-chwhy]'),why=!ok&&wi?wi.value.trim().slice(0,300):'',it={k:'qlow',id:Q.id,no:Q.no,who:Q.lowReq.u||'',sub:Q.title||Q.pname||''};
    qlApprove(Q,ok,why);save();render();const m=typeof chApTell==='function'&&it.who?chApTell(it,ok,why):'';toast((ok?'อนุมัติแล้ว':'บันทึกไม่อนุมัติแล้ว')+(m||''));CH.rej='';chBadge();chDraw()}}
  {const f=ACT.chApGo;ACT.chApGo=b=>{if(b.dataset.k!=='qlow')return f(b);S.sel.quote=b.dataset.id;ACT.go({dataset:{m:'co',k:'sales',s:'quote'}})}}}
document.head.insertAdjacentHTML('beforeend',`<style>.ql-s{margin:10px 0 0;padding:8px 12px;border-radius:10px;background:rgba(237,137,24,.12);font-size:14px;display:flex;gap:10px;align-items:center;flex-wrap:wrap}.ql-s.ok{background:rgba(30,142,90,.08)}</style>`);
if(typeof I18N==='object'&&I18N.en&&I18N.en.x)Object.assign(I18N.en.x,{'กำไรต่ำกว่าเป้า ต้องอนุมัติก่อน':'Profit under target: approval needed','อนุมัติราคานี้และทำต่อ':'Approve this price and continue','ส่งขออนุมัติ':'Ask for approval',
  'รออนุมัติอยู่':'Waiting for approval','อนุมัติราคานี้':'Approve this price','ราคาต่ำกว่าเป้ากำไร':'Price under profit target'});
