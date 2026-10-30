/* ---------- 4.99.8 ใบเสนอราคา: sort the list by any heading (user: "อยากได้ลูกศรแบบนี้ เรียงตามหัวข้อ") ----------
   Each heading of the quotation list gets a ⌄ arrow: press it once to sort A→Z / smallest first (▲), again for the other way
   (▼), a third time to go back to newest first. Viewed by customer or by project (969), the groups stay where they are and
   the quotes inside each group are sorted. Sorting reads the quotation itself (real dates and amounts), not the shown text.
   (user: "เพิ่มชื่อผู้เสนอราคาและผู้อนุมัติด้วยดีไหม") Two more columns: ผู้เสนอราคา (Q.by, 959) and ผู้อนุมัติ, the people who approved
   the quote in its approval steps (Q.appr, 240/910) or approved its low profit (Q.lowOk, 924); a refusal shows in red. Older quotes
   without them stay blank. A ผู้เสนอราคา box next to the project filter shows one person's quotes (list, groups and analysis). */
function qApprL(q){const R=[];Object.keys(q.appr||{}).sort((a,b)=>a-b).forEach(i=>{const a=q.appr[i],st=(APPR.quote[i]||[])[0]||'';if(a&&a.by)R.push({by:a.by,ok:a.ok!==false,st,at:a.at})});
  if(q.lowOk&&q.lowOk.by)R.push({by:q.lowOk.by,ok:true,st:'อนุมัติกำไรต่ำ',at:q.lowOk.at});if(q.lowNo&&q.lowNo.by)R.push({by:q.lowNo.by,ok:false,st:'กำไรต่ำ',at:q.lowNo.at});return R}
function qApprBy(q){const R=qApprL(q),seen=new Set();return R.filter(r=>{const k=r.by+'|'+r.ok;if(seen.has(k))return false;seen.add(k);return true})
  .map(r=>`<span title="${esc((r.ok?'อนุมัติ':'ไม่อนุมัติ')+(r.st?' · '+r.st:'')+(r.at?' · '+thD(r.at):''))}"${r.ok?'':' class="qg-neg"'}>${r.ok?'':'ไม่อนุมัติ · '}${esc(r.by)}</span>`).join('<br>')}
const qByOk=q=>!S.qByF||String(q.by||'').trim()===S.qByF;
function qByFilter(){const N=[...new Set(CO().quotes.map(q=>String(q.by||'').trim()).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'th'));if(S.qByF&&!N.includes(S.qByF))S.qByF='';
  if(N.length<2&&!S.qByF)return '';return `<select id="qByF" aria-label="ผู้เสนอราคา" style="margin-left:6px"><option value="">ผู้เสนอราคาทุกคน</option>${N.map(x=>`<option value="${esc(x)}"${S.qByF===x?' selected':''}>${esc(x)}</option>`).join('')}</select>`}
document.addEventListener('change',e=>{if(e.target.id==='qByF'){S.qByF=e.target.value;render()}});
const QSORT={no:'เลขที่',date:'วันที่',cust:'ลูกค้า',pj:'โครงการ',job:'งาน',val:'ราคาไม่รวม VAT',gp:'กำไรขั้นต้น',st:'สถานะ',by:'ผู้เสนอราคา',ap:'ผู้อนุมัติ',exp:'ยืนราคาถึง'};
function qSortKey(q,k){const c=()=>qCalc(q);
  switch(k){case 'no':return String(q.no||'');case 'date':return q.date||'';case 'cust':return custName(q.cust)||'';case 'pj':return qPjOf(q)||'';
    case 'job':return String(q.title||'');case 'val':return c().net;case 'gp':{const x=c();return x.net?(x.net-x.cost)/x.net:-1e9}
    case 'st':{const i=QST.findIndex(s=>s[0]===q.status);return i<0?99:i}case 'exp':return addD(q.date,n(q.valid))||'';case 'by':return String(q.by||'').trim()||'\uffff';case 'ap':return qApprL(q).map(r=>r.by).join(', ')||'\uffff'}return ''}
const qSortCmp=(a,b)=>typeof a==='number'&&typeof b==='number'?a-b:String(a).localeCompare(String(b),'th',{numeric:true,sensitivity:'base'});
ACT.qSort=b=>{const k=b.dataset.k,s=S.qSort||{};S.qSort=s.k!==k?{k,d:1}:s.d===1?{k,d:-1}:null;render()};
{const f=salesQuote;salesQuote=function(){let h=f.apply(this,arguments);
  h=h.replace(/(<div class="qg-bar"><span class="qg-sw">[\s\S]*?)(<\/div>)/,(a,x,y)=>x+qByFilter()+y);
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
