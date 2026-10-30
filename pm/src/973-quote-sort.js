/* ---------- 4.99.8 ใบเสนอราคา: sort the list by any heading (user: "อยากได้ลูกศรแบบนี้ เรียงตามหัวข้อ") ----------
   Each heading of the quotation list gets a ⌄ arrow: press it once to sort A→Z / smallest first (▲), again for the other way
   (▼), a third time to go back to newest first. Viewed by customer or by project (969), the groups stay where they are and
   the quotes inside each group are sorted. Sorting reads the quotation itself (real dates and amounts), not the shown text. */
const QSORT={no:'เลขที่',date:'วันที่',cust:'ลูกค้า',pj:'โครงการ',job:'งาน',val:'ราคาไม่รวม VAT',gp:'กำไรขั้นต้น',st:'สถานะ',exp:'ยืนราคาถึง'};
function qSortKey(q,k){const c=()=>qCalc(q);
  switch(k){case 'no':return String(q.no||'');case 'date':return q.date||'';case 'cust':return custName(q.cust)||'';case 'pj':return qPjOf(q)||'';
    case 'job':return String(q.title||'');case 'val':return c().net;case 'gp':{const x=c();return x.net?(x.net-x.cost)/x.net:-1e9}
    case 'st':{const i=QST.findIndex(s=>s[0]===q.status);return i<0?99:i}case 'exp':return addD(q.date,n(q.valid))||''}return ''}
const qSortCmp=(a,b)=>typeof a==='number'&&typeof b==='number'?a-b:String(a).localeCompare(String(b),'th',{numeric:true,sensitivity:'base'});
ACT.qSort=b=>{const k=b.dataset.k,s=S.qSort||{};S.qSort=s.k!==k?{k,d:1}:s.d===1?{k,d:-1}:null;render()};
{const f=salesQuote;salesQuote=function(){let h=f.apply(this,arguments);
  const m=h.match(/<div class="tw"><table><thead><tr><th>เลขที่<\/th>[\s\S]*?<\/thead><tbody>([\s\S]*?)<\/tbody><\/table><\/div>/);if(!m)return h;
  const s=S.qSort&&QSORT[S.qSort.k]?S.qSort:null;let t=m[0];
  // the arrows
  Object.entries(QSORT).forEach(([k,l])=>{const on=s&&s.k===k,ar=on?(s.d===1?'▲':'▼'):'⌄';
    t=t.replace(new RegExp(`<th( class="r")?>${l}</th>`),(all,r)=>`<th${r||''} aria-sort="${on?(s.d===1?'ascending':'descending'):'none'}"><button type="button" class="q-ths${on?' on':''}" data-a="qSort" data-k="${k}" title="เรียงตาม${l}">${l} <span aria-hidden="true">${ar}</span></button></th>`)});
  if(s){const Q={};CO().quotes.forEach(q=>Q[q.id]=q);
    const rows=m[1].match(/<tr[\s>][\s\S]*?<\/tr>/g)||[],out=[];let seg=[];
    const flush=()=>{seg.map(r=>{const id=(r.match(/data-a="sel" data-k="quote" data-id="([^"]+)"/)||[])[1];return {r,q:id&&Q[id]}})
      .sort((a,b)=>!a.q||!b.q?0:qSortCmp(qSortKey(a.q,s.k),qSortKey(b.q,s.k))*s.d).forEach(x=>out.push(x.r));seg=[]};
    rows.forEach(r=>{if(/^<tr class="qg-h"/.test(r)){flush();out.push(r)}else seg.push(r)});flush();
    if(out.length===rows.length){const i=t.indexOf(m[1]);if(i>=0)t=t.slice(0,i)+out.join('')+t.slice(i+m[1].length)}}
  return h.replace(m[0],()=>t)}}
document.head.insertAdjacentHTML('beforeend',`<style>
.q-ths{background:none;border:0;padding:0;font:inherit;color:inherit;cursor:pointer;display:inline-flex;gap:4px;align-items:center;white-space:nowrap}
.q-ths span{font-size:11px;opacity:.55}.q-ths.on span{opacity:1;color:var(--accent,#0e7490)}.q-ths:hover span{opacity:1}
th.r .q-ths{flex-direction:row}
</style>`);
Object.assign(SBKW,{'co.sales.quote':(SBKW['co.sales.quote']||'')+' เรียงลำดับ เรียงตามหัวข้อ ลูกศร'});
