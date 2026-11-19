/* ---------- 4.99.52 ask before a new Rev. (user, 2026-11-19, QT-021: Rev.3 printed at 15:05 with the same 5,249,884.09 as Rev.2 a minute
   before, only the scope text changed: "เป็นอีกแล้ว", "ขึ้นเตือนถามดีกว่าไหม")
   Printing the customer copy or setting the status to ส่งแล้ว after the quote was edited since the last Rev. no longer keeps a new Rev. by
   itself. A box shows what was edited (989-quote-rev-reasons) and whether the price moved, and asks: use the last Rev. (its copy is
   brought up to date, the number stays) or keep a new one. The suggested choice is the last Rev. when the price is the same, a new
   one when it changed. A first Rev. (Rev.0), บันทึกเป็น Rev. ใหม่ and รับงานสด (989-quote-rev-live-merge) are as before.
   The newest Rev. in the history gets "รวมเข้า Rev.N" when its price is the same as the Rev. before it, to join Revs. kept before.
   4.99.53 such Revs. join by themselves when the history is shown, unless the user picked เก็บเป็น Rev. ใหม่ for it (r.keep). */
const qraNet=r=>Number(r&&r.sum&&r.sum.net)||0;
const qraSame=(Q,L)=>Math.abs(n(qrvSum(Q).net)-qraNet(L))<0.005;
let QRA=null,QRA_GO=false;
// the last Rev. takes the quote as it is now: same number, new copy
const qraTake=Q=>{const L=qrvLast(Q);if(!L)return;const u=typeof me==='function'&&me();
  const r={at:new Date().toISOString(),sig:qrvSig(Q),snap:qrvSnap(Q),sum:qrvSum(Q),note:''};if(u)r.by=u.name;
  if(typeof qlmTake==='function')qlmTake(L,r);else Object.assign(L,r)};
function qraAsk(Q,go){const L=qrvLast(Q);if(!L)return go('new');QRA={id:Q.id,go};const same=qraSame(Q,L),nx=L.n+1;
  let ch='';try{ch=typeof qrr==='object'?qrr.sinceLast(Q):''}catch(e){}
  const pr=same?`ราคาเท่ากับ Rev.${L.n} (${fmt(qraNet(L),2)} บาท) แก้เฉพาะข้อความหรือรายละเอียด`:`ราคาเปลี่ยนจาก ${fmt(qraNet(L),2)} เป็น <b>${fmt(n(qrvSum(Q).net),2)}</b> บาท`;
  const b1=`<button type="button" class="btn${same?' pri':''}" data-a="qraUse">ใช้ Rev.${L.n} เดิม</button>`,b2=`<button type="button" class="btn${same?'':' pri'}" data-a="qraNew">เก็บเป็น Rev.${nx} ใหม่</button>`;
  dialog(`${esc(Q.no||'ใบเสนอราคา')} แก้หลัง Rev.${L.n}`,`<p>${pr}</p>${ch?`<div class="qra-ch"><b>สิ่งที่แก้:</b>\n${esc(ch)}</div>`:''}
    <p class="hint">ใช้ Rev.${L.n} เดิม: ฉบับที่เก็บไว้จะเป็นข้อความล่าสุด เลข Rev. ไม่เปลี่ยน · เก็บเป็น Rev.${nx} ใหม่: Rev.${L.n} เดิมยังอยู่ในประวัติ</p>`,b1+b2)}
ACT.qraUse=()=>{const a=QRA;QRA=null;$('#dlg').close();const Q=a&&CO().quotes.find(q=>q.id===a.id);if(!Q)return;qraTake(Q);a.go('use')};
ACT.qraNew=()=>{const a=QRA;QRA=null;$('#dlg').close();if(a)a.go('new')};
// ส่งแล้ว: the Rev. is kept once the user answers
{const f=qrvSave;qrvSave=function(Q,why){const L=qrvLast(Q);
  if(why==='sent'&&!QRA_GO&&L&&L.sig!==qrvSig(Q)){const a=arguments,self=this;
    setTimeout(()=>qraAsk(Q,c=>{if(c==='new'){QRA_GO=true;let r=null;try{r=f.apply(self,a)}finally{QRA_GO=false}if(r)r.keep=1}save();render()}),0);return null}
  return f.apply(this,arguments)}}
// printing the customer copy: ask first, then print
{const f=ACT.print;ACT.print=function(b){const d=b&&b.dataset;
  if(d&&d.k==='quote'&&!QRA_GO){const Q=CO().quotes.find(q=>q.id===d.id),L=Q&&qrvLast(Q);
    if(Q&&L&&(Q.items||[]).length&&qrvSent(Q)&&L.sig!==qrvSig(Q)){const bb={dataset:{k:d.k,id:d.id}},self=this;
      qraAsk(Q,c=>{if(c==='use')save();const k=(Q.revs||[]).length;QRA_GO=true;try{f.call(self,bb)}finally{QRA_GO=false}if(c==='new'&&(Q.revs||[]).length>k){qrvLast(Q).keep=1;save()}});return}}
  return f.apply(this,arguments)}}
// join the newest Rev. into the one before it when the price is the same
ACT.qraJoin=b=>{const Q=CO().quotes.find(q=>q.id===b.dataset.id),R=Q&&Q.revs;if(!R||R.length<2)return;
  if(typeof sfCan==='function'&&!sfCan(Q.id)){toast('แก้ได้เฉพาะฝ่ายขาย ผู้บริหาร หรือผู้ที่ได้รับอนุญาต');return}
  const r=R[R.length-1],p=R[R.length-2];if(Math.abs(qraNet(r)-qraNet(p))>=0.005)return;
  if(!confirm(`รวม Rev.${r.n} เข้า Rev.${p.n}? ราคาเท่ากัน Rev.${p.n} จะเก็บฉบับล่าสุดของ Rev.${r.n} และ Rev.${r.n} จะหายจากประวัติ`))return;
  qraJoin1(Q);save();render();toast(`รวมเป็น Rev.${p.n} แล้ว`)};
// the newest Rev. joins the one before it: number of the earlier, copy of the later
function qraJoin1(Q){const R=Q.revs,r=R[R.length-1],p=R[R.length-2],w=r.why;
  if(typeof qlmTake==='function')qlmTake(p,r);else Object.assign(p,{snap:r.snap,sig:r.sig,sum:r.sum,at:r.at});if(w==='print'||w==='sent')p.why=w;R.pop()}
// 4.99.53 (user, on QT-021's Rev.3 at the same price as Rev.2: "รวมกันสิ") Revs. at the end of the history with the price of the Rev. before
// them join by themselves; one the user chose to keep as new (r.keep) or kept by hand stays
function qraAuto(Q){const R=Q&&Q.revs;let ch=false;
  while(R&&R.length>1){const r=R[R.length-1],p=R[R.length-2];if(r.keep||r.why==='hand'||!r.snap||!p.snap||Math.abs(qraNet(r)-qraNet(p))>=0.005)break;qraJoin1(Q);ch=true}
  return ch}
if(typeof qrvCard==='function'){const f=qrvCard;qrvCard=function(Q){if(qraAuto(Q))setTimeout(()=>save(),0);let h=f.apply(this,arguments);if(!h||!Q)return h;const R=Q.revs||[],L=R[R.length-1],P=R[R.length-2];
  if(L)h=h.replace(/ครั้งหน้าจะเก็บเป็น <b>Rev\.(\d+)<\/b>/,`ครั้งหน้าจะถามก่อนว่าใช้ <b>Rev.${L.n}</b> เดิม หรือเก็บเป็น Rev.$1 ใหม่`);
  if(L&&P&&Math.abs(qraNet(L)-qraNet(P))<0.005&&(typeof sfCan!=='function'||sfCan(Q.id))){const k=h.indexOf(`data-a="qrvPrint" data-id="${Q.id}" data-r="${L.id}"`),s=k<0?-1:h.lastIndexOf('<button',k);
    if(s>=0)h=h.slice(0,s)+`<button type="button" class="btn sm" data-a="qraJoin" data-id="${Q.id}" title="ราคาเท่ากับ Rev.${P.n}">รวมเข้า Rev.${P.n}</button> `+h.slice(s)}
  return h}}
document.head.insertAdjacentHTML('beforeend',`<style>.qra-ch{font-size:13px;line-height:1.5;white-space:pre-line;max-height:40vh;overflow:auto;padding:8px 10px;border-radius:8px;background:color-mix(in srgb,#0EA5E9 9%,transparent);margin:8px 0}</style>`);
