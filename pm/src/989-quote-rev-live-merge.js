/* ---------- 4.99.50 รับงานสด that does not change the price is not a new Rev. (user, 2026-11-19, QT-021 with Rev.2, Rev.3 and Rev.4 all
   at 5,249,884.09, only wording changed between them: "เห็นไหมอยู่ใน Rev เดียวกัน", "เราจะแก้ปัญหายังไง")
   947 keeps the quote as it was as a Rev. before a live copy replaces it. When the last Rev. was also kept that way, the customer copy
   has not been printed or sent since (r.pr), and the price is the same, that Rev. is brought up to date instead of a new number being
   used. Revs. already kept like that are joined when the quote's history is shown: a run of such Revs. at the end of the list with one
   price becomes the first of them, holding the latest copy (the explanation in 989-quote-rev-reasons compares it with the Rev. before). */
const qlmNet=r=>Number(r&&r.sum&&r.sum.net)||0;
// one Rev. taken over by a later one with the same price: the number and id stay, the copy, time and notes follow the later one
const qlmTake=(p,r)=>{p.snap=r.snap;p.sig=r.sig;p.sum=r.sum;p.at=r.at;if(r.by)p.by=r.by;if(r.note&&r.note!==p.note)p.note=[p.note,r.note].filter(Boolean).join(' · ');if(r.pr)p.pr=r.pr};
{const f=qrvSave;qrvSave=function(Q,why,note){const L=qrvLast(Q);
  if(why==='live'&&L&&L.why==='live'&&!L.pr&&L.snap&&L.sig!==qrvSig(Q)&&Math.abs(qlmNet({sum:qrvSum(Q)})-qlmNet(L))<0.005){
    const r={at:new Date().toISOString(),sig:qrvSig(Q),snap:qrvSnap(Q),sum:qrvSum(Q),note:note||''};const u=typeof me==='function'&&me();if(u)r.by=u.name;qlmTake(L,r);return L}
  return f.apply(this,arguments)}}
// the customer copy printed or sent as the last Rev. stands: later live copies make a new number again
const qlmMark=Q=>{const L=qrvLast(Q);if(L&&L.sig===qrvSig(Q))L.pr=1};
{const f=ACT.print;ACT.print=function(b){const r=f.apply(this,arguments);try{if(b&&b.dataset&&b.dataset.k==='quote'){const Q=CO().quotes.find(q=>q.id===b.dataset.id);if(Q&&qrvSent(Q))qlmMark(Q)}}catch(e){}return r}}
HOOK.push((p,v)=>{const m=p.match(/^co\.quotes\.([^.]+)\.status$/);if(!m||v!=='sent')return;const Q=CO().quotes.find(x=>x.id===m[1]);if(Q)try{qlmMark(Q)}catch(e){}});
// Revs. kept before this version: join the run at the end
function qlmJoin(Q){const R=Q&&Q.revs;if(!R||R.length<2)return false;let k=R.length;while(k>0&&R[k-1].why==='live'&&!R[k-1].pr)k--;
  let ch=false;for(let i=Math.max(k,0)+1;i<R.length;){const p=R[i-1],r=R[i];if(p.snap&&r.snap&&Math.abs(qlmNet(p)-qlmNet(r))<0.005){qlmTake(p,r);R.splice(i,1);ch=true}else i++}
  return ch}
if(typeof qrvCard==='function'){const f=qrvCard;qrvCard=function(Q){if(qlmJoin(Q)&&typeof save==='function')setTimeout(()=>save(),0);return f.apply(this,arguments)}}
