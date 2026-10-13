/* ---------- 3.21.1: page frame for every printout ----------
   The company footer is position:fixed at the bottom of each page, and long tables ran underneath it. Every printout is
   now wrapped in a table whose header and footer rows repeat on each printed page and keep the top and bottom of the
   page free: the footer sits in that space and rows never reach it. @page margin 0 also stops the browser printing
   its own date / URL / page-number lines. Table headers repeat on each page and rows are not split. */
document.head.insertAdjacentHTML('beforeend',`<style>
@page{size:A4;margin:0!important}
@media print{
#print table.pgw{width:100%;border-collapse:collapse;border:0;margin:0;font-size:inherit}
#print table.pgw>thead>tr>td,#print table.pgw>tfoot>tr>td,#print table.pgw>tbody>tr>td{border:0;padding:0;background:none}
#print table.pgw>thead>tr>td>div{height:10mm}#print table.pgw>tfoot>tr>td>div{height:15mm}
#print table.pgw>tbody>tr>td.pgc{padding:0 10mm}
html body #print .ofoot{bottom:6mm;left:10mm;right:10mm;background:#fff}
html body #print table:not(.pgw) thead{display:table-header-group}
html body #print table:not(.pgw) tr{break-inside:avoid;page-break-inside:avoid}
#print h1,#print h2,#print h3{break-after:avoid;page-break-after:avoid}
}</style>`);
function pgWrap(){const el=$('#print');if(!el||!el.firstChild||el.querySelector(':scope>table.pgw')||el.querySelector('.env'))return;
  const t=document.createElement('table');t.className='pgw';t.innerHTML='<thead><tr><td><div></div></td></tr></thead><tfoot><tr><td><div></div></td></tr></tfoot><tbody><tr><td class="pgc"></td></tr></tbody>';
  const c=t.querySelector('.pgc');while(el.firstChild)c.appendChild(el.firstChild);el.appendChild(t);
  // a fixed footer inside a table cell is not repeated on later pages: keep it beside the frame
  c.querySelectorAll('.ofoot').forEach((f,i)=>{if(i)f.remove();else el.appendChild(f)})}
{const el=$('#print');if(el)new MutationObserver(()=>pgWrap()).observe(el,{childList:true})}
window.addEventListener('beforeprint',pgWrap);
// the browser prints document.title in its header and offers it as the PDF file name: name the document, not the program
let pgTitle0=null;
function pgTitle(){const el=$('#print');if(!el||!el.textContent.trim())return;const q=s=>el.querySelector(s),cl=x=>String(x||'').replace(/\s+/g,' ').trim();
  // labelled lines from the header box and the customer/job block: "โครงการ: X", "งาน: Y", "เรียน Z"
  const kv=[...el.querySelectorAll('.ot-m div')].map(d=>{const k=d.querySelector('span');return [cl(k&&k.textContent),cl(k?d.textContent.slice(k.textContent.length):d.textContent)]});
  el.querySelectorAll('.meta>div').forEach(d=>d.innerHTML.split(/<br\s*\/?>/i).forEach(h=>{const t=document.createElement('div');t.innerHTML=h;const x=cl(t.textContent),m=x.match(/^(เรียน|ลูกค้า|(?:ชื่อ)?โครงการ|(?:ชื่อ)?งาน)\s*:?\s*(.*)$/);if(m)kv.push([m[1],m[2]])}));
  const get=re=>((kv.find(([k,v])=>re.test(k)&&v)||[])[1]||''),no=get(/^เลขที่/),h=cl((q('.ot-t h1')||q('h1')||{}).textContent),
    pj=get(/^(ชื่อ)?โครงการ/),job=get(/^(ชื่อ)?งาน$/),to=get(/^(เรียน|ลูกค้า)/);
  // saved PDF file name = document number + job; Windows-forbidden characters removed
  let t=job?[no,/ใบเสนอราคา/.test(h)?'':h,[pj,job].filter(Boolean).join(' - ')]:[no,h,pj||to];
  t=t.map(cl).filter(Boolean).join(' ').replace(/[\\/:*?"<>|“”]/g,'').replace(/\s+/g,' ').trim().slice(0,120).trim();
  const dn=q('[data-doc-name]');if(dn)t=cl(dn.getAttribute('data-doc-name')).replace(/[\\/:*?"<>|“”]/g,'').replace(/\s+/g,' ').trim().slice(0,120).trim();
  if(!t)return;if(pgTitle0==null)pgTitle0=document.title;document.title=t}
{const el=$('#print');if(el)new MutationObserver(()=>pgTitle()).observe(el,{childList:true})}
window.addEventListener('afterprint',()=>{if(pgTitle0!=null){document.title=pgTitle0;pgTitle0=null}});

