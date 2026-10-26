/* ---------- 4.77 ▲▼ on a section row of the quote lines table moves the whole section, its lines with it ----------
   User (2026-10-26, TOYOTA CANTEEN, งานเตรียมการ had to become item 1): "ทำเป็นลูกศรเลื่อนขึ้นลงเลย ดีไหม รายละเอียดก็ขยับด้วยเลย".
   Sections are numbered and printed in the order their lines come in Q.items (982 qlTable, 981), so a move swaps this
   section's run of lines (sub-headings, Hanger Support line and all) with the run above or below it. */
const qsmRuns=Q=>{const R=[];(Q.items||[]).forEach((i,k)=>{const r=R[R.length-1];if(r&&r.g===i.g)r.e=k;else R.push({g:i.g,s:k,e:k})});return R};
const qsmBtns=(Q,gi,n)=>[-1,1].map(d=>{const t=d<0?'เลื่อนหมวดนี้ขึ้น':'เลื่อนหมวดนี้ลง';
  return `<button type="button" class="x qlmv" data-a="qsmMv" data-id="${Q.id}" data-gi="${gi}" data-d="${d}" title="${t}" aria-label="${t}"${(d<0?gi<=1:gi>=n)?' disabled':''}>${d<0?'▲':'▼'}</button>`}).join('');
{const f=qlTable;qlTable=function(Q){const h=f.apply(this,arguments);if(!Q||!Array.isArray(Q.items))return h;const n=qsmRuns(Q).length;if(n<2)return h;
  return h.replace(/(<tr class="grp"><td colspan="16"><b class="qh-n">(\d+)<\/b>[\s\S]*?)(<\/td><\/tr>)/g,(m,a,gi,c)=>`${a}<span class="qsm">${qsmBtns(Q,+gi,n)}</span>${c}`)}}
ACT.qsmMv=b=>{const Q=CO().quotes.find(q=>q.id===b.dataset.id);if(!Q)return;const R=qsmRuns(Q),k=+b.dataset.gi-1,d=+b.dataset.d,j=k+d;if(!R[k]||!R[j])return;
  const [A,B]=d<0?[R[j],R[k]]:[R[k],R[j]],part=r=>Q.items.slice(r.s,r.e+1);
  Q.items.splice(A.s,B.e-A.s+1,...part(B),...part(A));save();render();
  toast(`เลื่อน “${gName(R[k].g)}” ${d<0?'ขึ้น':'ลง'}แล้ว เป็นข้อ ${j+1} (กด ↶ ย้อนกลับได้)`)};
document.head.insertAdjacentHTML('beforeend','<style>.ql-t .qsm{display:inline-flex;gap:3px;margin-left:10px;vertical-align:middle;white-space:nowrap}.ql-t .qsm .qlmv{font-size:13px;padding:2px 7px;border:1px solid var(--line,#cfd8dc);border-radius:6px}</style>');
if(typeof I18N==='object'&&I18N.en&&I18N.en.x)Object.assign(I18N.en.x,{'เลื่อนหมวดนี้ขึ้น':'Move this section up','เลื่อนหมวดนี้ลง':'Move this section down'});
