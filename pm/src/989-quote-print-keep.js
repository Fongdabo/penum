/* ---------- 4.99.65 no lone total row, no blank last page (user, 2026-11-22, QT-021 printed: the Bill of Quantities' รวมทั้งหมด row
   alone at the top of a new page, and a blank page after the pictures: "ตอนปริ้นทำไมมีกระดาษเปล่าติดมาด้วย")
   1. The last line of each detail table, its section subtotal and the รวมทั้งหมด row go into one tbody that is not split, so the
      total always has the lines above it on its page.
   2. The pictures printed after the quotation no longer use their own named page (changed in 989-quote-pictures2-attach): a named
      page inside the page frame (720) can make the browser start one more page for the frame's footer row, which prints blank.
      The sheet now sits in the quotation's page frame and takes its margins from it. */
function qpkKeep(h){if(!h||h.indexOf('class="tt"')<0)return h;
  try{const t=document.createElement('template');t.innerHTML=h;let ch=false;
    t.content.querySelectorAll('table.qm-t').forEach(tb=>{const tt=[...tb.querySelectorAll(':scope>tbody>tr.tt')].pop();if(!tt)return;
      const b=document.createElement('tbody');b.className='qpk';const rows=[tt];let p=tt.previousElementSibling;
      for(let i=0;p&&i<2;i++){rows.unshift(p);p=p.previousElementSibling}
      const src=tt.parentElement;rows.forEach(r=>b.appendChild(r));src.after(b);ch=true});
    return ch?t.innerHTML:h}catch(e){return h}}
{const f=PRINT.quote;PRINT.quote=function(){const h=f.apply(this,arguments);return qpkKeep(h)}}
document.head.insertAdjacentHTML('beforeend',`<style>@media print{#print table.qm-t>tbody.qpk{break-inside:avoid;page-break-inside:avoid}
#print .qpa-att>:last-child,#print .qpa-att .qpx>:last-child{margin-bottom:0!important}}</style>`);
