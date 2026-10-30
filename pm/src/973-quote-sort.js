/* ---------- 4.99.8 ใบเสนอราคา: sort the list by any heading (user: "อยากได้ลูกศรแบบนี้ เรียงตามหัวข้อ") ----------
   Each heading of the quotation list gets a ⌄ arrow: press it once to sort A→Z / smallest first (▲), again for the other way
   (▼), a third time to go back to newest first. Viewed by customer or by project (969), the groups stay where they are and
   the quotes inside each group are sorted. Sorting reads the quotation itself (real dates and amounts), not the shown text.
   (user: "เพิ่มชื่อผู้เสนอราคาและผู้อนุมัติด้วยดีไหม") Two more columns: ผู้เสนอราคา (Q.by, 959) and ผู้อนุมัติ, the people who approved
   the quote in its approval steps (Q.appr, 240/910) or approved its low profit (Q.lowOk, 924); a refusal shows in red. Older quotes
   without them stay blank.
   4.99.9 (user: "อันนี้ไม่ใช่เรียง ให้เป็นเลือก"): the ⌄ opens a menu like Excel's filter: sort up or down, and for every column
   ("ปรับเหมือนกันเลย"; months for วันที่ / ยืนราคาถึง, the shown amount for ราคา and กำไร) tick the values to show, with a search box. Chosen values live in
   S.qColF {column: [values]} and narrow the list, the groups and the analysis (qByOk); a heading with a filter is marked ●, and
   the bar above the list says what is filtered with one press to clear it. The old ผู้เสนอราคา box became this menu. */
function qApprL(q){const R=[];Object.keys(q.appr||{}).sort((a,b)=>a-b).forEach(i=>{const a=q.appr[i],st=(APPR.quote[i]||[])[0]||'';if(a&&a.by)R.push({by:a.by,ok:a.ok!==false,st,at:a.at})});
  if(q.lowOk&&q.lowOk.by)R.push({by:q.lowOk.by,ok:true,st:'อนุมัติกำไรต่ำ',at:q.lowOk.at});if(q.lowNo&&q.lowNo.by)R.push({by:q.lowNo.by,ok:false,st:'กำไรต่ำ',at:q.lowNo.at});return R}
function qApprBy(q){const R=qApprL(q),seen=new Set();return R.filter(r=>{const k=r.by+'|'+r.ok;if(seen.has(k))return false;seen.add(k);return true})
  .map(r=>`<span title="${esc((r.ok?'อนุมัติ':'ไม่อนุมัติ')+(r.st?' · '+r.st:'')+(r.at?' · '+thD(r.at):''))}"${r.ok?'':' class="qg-neg"'}>${r.ok?'':'ไม่อนุมัติ · '}${esc(r.by)}</span>`).join('<br>')}
const QBLANK='(ว่าง)';
// the values a quote has in a column that can be filtered (ผู้อนุมัติ may have several)
const qGpTxt=q=>{const x=qCalc(q);return x.net?fmt((x.net-x.cost)*100/x.net,1)+'%':''};
const QCOLV={no:q=>[q.no],val:q=>[fmt(qCalc(q).net)],gp:q=>[qGpTxt(q)],cust:q=>[custName(q.cust)],pj:q=>[qPjOf(q)],job:q=>[q.title],st:q=>[(QST.find(s=>s[0]===q.status)||QST[0])[1]],by:q=>[q.by],
  ap:q=>{const L=qApprL(q).filter(r=>r.ok).map(r=>r.by);return L.length?L:['']},date:q=>[okD(q.date)?thM(ym(q.date)):''],exp:q=>{const e=addD(q.date,n(q.valid));return [okD(e)?thM(ym(e)):'']}};
const qColVals=(q,k)=>[...new Set(QCOLV[k](q).map(v=>String(v||'').trim()||QBLANK))];
function qColF(){const F=S.qColF=S.qColF&&typeof S.qColF==='object'?S.qColF:{};if(S.qByF){F.by=[S.qByF];S.qByF=''}return F}
const qByOk=q=>{const F=qColF();return Object.keys(F).every(k=>!QCOLV[k]||!Array.isArray(F[k])||qColVals(q,k).some(v=>F[k].includes(v)))};
const qByFilter=()=>{const F=qColF(),K=Object.keys(F).filter(k=>QCOLV[k]&&Array.isArray(F[k]));if(!K.length)return '';
  return `<span class="q-fchip">กรองอยู่: ${K.map(k=>`${QSORT[k]} (${F[k].length})`).join(', ')} <button type="button" class="btn sm ghost" data-a="qColClr">✕ ล้างตัวกรอง</button></span>`};
ACT.qColClr=()=>{S.qColF={};render()};
const QSORT={no:'เลขที่',date:'วันที่',cust:'ลูกค้า',pj:'โครงการ',job:'งาน',val:'ราคาไม่รวม VAT',gp:'กำไรขั้นต้น',st:'สถานะ',by:'ผู้เสนอราคา',ap:'ผู้อนุมัติ',exp:'ยืนราคาถึง'};
function qSortKey(q,k){const c=()=>qCalc(q);
  switch(k){case 'no':return String(q.no||'');case 'date':return q.date||'';case 'cust':return custName(q.cust)||'';case 'pj':return qPjOf(q)||'';
    case 'job':return String(q.title||'');case 'val':return c().net;case 'gp':{const x=c();return x.net?(x.net-x.cost)/x.net:-1e9}
    case 'st':{const i=QST.findIndex(s=>s[0]===q.status);return i<0?99:i}case 'exp':return addD(q.date,n(q.valid))||'';case 'by':return String(q.by||'').trim()||'\uffff';case 'ap':return qApprL(q).map(r=>r.by).join(', ')||'\uffff'}return ''}
const qSortCmp=(a,b)=>typeof a==='number'&&typeof b==='number'?a-b:String(a).localeCompare(String(b),'th',{numeric:true,sensitivity:'base'});
const qcmClose=()=>{const m=document.getElementById('qcm');if(m)m.remove()};
// the menu under a heading: sort, then (for columns with values) tick what to show
ACT.qSort=b=>{const k=b.dataset.k,was=document.getElementById('qcm');qcmClose();if(was&&was.dataset.k===k)return;
  const F=qColF(),s=S.qSort||{},cat=!!QCOLV[k],num=['val','gp'].includes(k);
  const L=cat?[...new Set(CO().quotes.filter(q=>!S.qPjF||pjKey(qPjOf(q)||'-')===S.qPjF).flatMap(q=>qColVals(q,k)))]:[];
  if(k==='date'||k==='exp'){const ord=v=>{const q=CO().quotes.find(x=>qColVals(x,k).includes(v));return q?(k==='date'?q.date:addD(q.date,n(q.valid)))||'':''};L.sort((a,b)=>ord(b).localeCompare(ord(a)))}
  else if(num){const v=x=>x===QBLANK?-1e15:parseFloat(x.replace(/[,%]/g,''))||0;L.sort((a,b)=>v(b)-v(a))}
  else L.sort((a,b)=>(a===QBLANK)-(b===QBLANK)||a.localeCompare(b,'th',{numeric:true}));
  const sel=Array.isArray(F[k])?F[k]:null,on=v=>!sel||sel.includes(v);
  const m=document.createElement('div');m.id='qcm';m.className='qcm';m.dataset.k=k;m.setAttribute('role','dialog');m.setAttribute('aria-label',QSORT[k]);
  m.innerHTML=`<button type="button" data-qcm="1"${s.k===k&&s.d===1?' class="on"':''}>▲ เรียง${num?'น้อยไปมาก':k==='date'||k==='exp'?'เก่าไปใหม่':' ก → ฮ'}</button>
    <button type="button" data-qcm="-1"${s.k===k&&s.d===-1?' class="on"':''}>▼ เรียง${num?'มากไปน้อย':k==='date'||k==='exp'?'ใหม่ไปเก่า':' ฮ → ก'}</button>${s.k===k?'<button type="button" data-qcm="0">ล้างการเรียง (ใบใหม่อยู่บน)</button>':''}
    ${cat?`<hr><input type="search" class="qcm-q" placeholder="ค้นหา${esc(QSORT[k])}" aria-label="ค้นหา"><label class="qcm-all"><input type="checkbox"${!sel?' checked':''}> (เลือกทั้งหมด)</label>
    <div class="qcm-l">${L.map(v=>`<label><input type="checkbox" value="${esc(v)}"${on(v)?' checked':''}> ${esc(v)}</label>`).join('')}</div>
    <div class="qcm-b"><button type="button" class="btn sm pri" data-qcm="ok">ตกลง</button>${sel?'<button type="button" class="btn sm" data-qcm="clr">ล้างตัวกรอง</button>':''}<button type="button" class="btn sm ghost" data-qcm="x">ยกเลิก</button></div>`:''}`;
  document.body.appendChild(m);const r=b.getBoundingClientRect(),w=m.offsetWidth;
  m.style.top=Math.min(r.bottom+4,innerHeight-m.offsetHeight-8)+'px';m.style.left=Math.max(8,Math.min(r.left,innerWidth-w-8))+'px';
  const boxes=()=>[...m.querySelectorAll('.qcm-l input')],all=m.querySelector('.qcm-all input'),sync=()=>{if(all){const B=boxes();all.checked=B.every(x=>x.checked);all.indeterminate=!all.checked&&B.some(x=>x.checked)}};sync();
  if(all)all.addEventListener('change',()=>{boxes().filter(x=>x.closest('label').style.display!=='none').forEach(x=>x.checked=all.checked)});
  m.querySelector('.qcm-l')&&m.querySelector('.qcm-l').addEventListener('change',sync);
  const qs=m.querySelector('.qcm-q');if(qs){qs.addEventListener('input',()=>{const t=qs.value.trim().toLowerCase();boxes().forEach(x=>{x.closest('label').style.display=!t||x.value.toLowerCase().includes(t)?'':'none'})});setTimeout(()=>qs.focus(),0)}
  m.addEventListener('click',e=>{const a=e.target.closest('[data-qcm]');if(!a)return;const v=a.dataset.qcm;
    if(v==='1'||v==='-1'){S.qSort={k,d:+v}}else if(v==='0'){S.qSort=null}
    else if(v==='ok'){const B=boxes(),C=B.filter(x=>x.checked).map(x=>x.value);if(!C.length){toast('เลือกอย่างน้อย 1 รายการ');return}if(C.length===B.length)delete F[k];else F[k]=C}
    else if(v==='clr'){delete F[k]}else if(v!=='x')return;qcmClose();if(v!=='x')render()})};
document.addEventListener('mousedown',e=>{const m=document.getElementById('qcm');if(m&&!m.contains(e.target)&&!e.target.closest('[data-a="qSort"]'))qcmClose()});
document.addEventListener('keydown',e=>{if(e.key==='Escape')qcmClose()});
{const r=render;render=function(){qcmClose();return r.apply(this,arguments)}}
{const f=salesQuote;salesQuote=function(){let h=f.apply(this,arguments);
  h=h.replace(/(<div class="qg-bar"><span class="qg-sw">[\s\S]*?)(<\/div>)/,(a,x,y)=>x+qByFilter()+y);
  const m=h.match(/<div class="tw"><table><thead><tr><th>เลขที่<\/th>[\s\S]*?<\/thead><tbody>([\s\S]*?)<\/tbody><\/table><\/div>/);if(!m)return h;
  const s=S.qSort&&QSORT[S.qSort.k]?S.qSort:null;let t=m[0];
  // the arrows
  const CF=qColF();Object.entries(QSORT).forEach(([k,l])=>{const on=s&&s.k===k,fl=Array.isArray(CF[k])&&QCOLV[k],ar=(fl?'● ':'')+(on?(s.d===1?'▲':'▼'):'⌄');
    t=t.replace(new RegExp(`<th( class="r")?>${l}</th>`),(all,r)=>`<th${r||''} aria-sort="${on?(s.d===1?'ascending':'descending'):'none'}"><button type="button" class="q-ths${on||fl?' on':''}" data-a="qSort" data-k="${k}" aria-haspopup="dialog" title="เลือก / เรียง ${l}">${l} <span aria-hidden="true">${ar}</span></button></th>`)});
  if(s){const Q={};CO().quotes.forEach(q=>Q[q.id]=q);
    const rows=m[1].match(/<tr[\s>][\s\S]*?<\/tr>/g)||[],out=[];let seg=[];
    const flush=()=>{seg.map(r=>{const id=(r.match(/data-a="sel" data-k="quote" data-id="([^"]+)"/)||[])[1];return {r,q:id&&Q[id]}})
      .sort((a,b)=>!a.q||!b.q?0:qSortCmp(qSortKey(a.q,s.k),qSortKey(b.q,s.k))*s.d).forEach(x=>out.push(x.r));seg=[]};
    rows.forEach(r=>{if(/^<tr class="qg-h"/.test(r)){flush();out.push(r)}else seg.push(r)});flush();
    if(out.length===rows.length){const i=t.indexOf(m[1]);if(i>=0)t=t.slice(0,i)+out.join('')+t.slice(i+m[1].length)}}
  return h.replace(m[0],()=>t)}}
document.head.insertAdjacentHTML('beforeend',`<style>
.q-ths{background:none;border:0;padding:0;font:inherit;color:inherit;cursor:pointer;display:inline-flex;gap:4px;align-items:center;white-space:nowrap}
.q-ths span{font-size:11px;opacity:.55}
.qcm{position:fixed;z-index:1000;background:var(--card,#fff);color:var(--text,inherit);border:1px solid var(--line);border-radius:10px;box-shadow:0 10px 30px rgba(0,0,0,.25);padding:6px;width:270px;max-width:calc(100vw - 16px);display:flex;flex-direction:column;gap:2px;font-size:14px}
.qcm>button{background:none;border:0;color:inherit;font:inherit;text-align:left;padding:7px 10px;border-radius:6px;cursor:pointer}.qcm>button:hover,.qcm>button.on{background:var(--surface-2,rgba(127,127,127,.12))}.qcm>button.on{font-weight:600}
.qcm hr{border:0;border-top:1px solid var(--line);margin:4px 0;width:100%}.qcm-q{margin:2px 4px 4px;width:auto!important}
.qcm label{display:flex;gap:8px;align-items:flex-start;padding:4px 8px;cursor:pointer;line-height:1.35}.qcm label input{margin-top:3px;flex:0 0 auto}
.qcm-l{max-height:240px;overflow:auto;border-top:1px solid var(--line);border-bottom:1px solid var(--line);margin:2px 0}
.qcm-b{display:flex;gap:6px;justify-content:flex-end;padding:6px 4px 2px;flex-wrap:wrap}
.q-fchip{display:inline-flex;gap:6px;align-items:center;font-size:13px;color:var(--accent,#0e7490);margin-left:6px}.q-ths.on span{opacity:1;color:var(--accent,#0e7490)}.q-ths:hover span{opacity:1}
th.r .q-ths{flex-direction:row}
</style>`);
Object.assign(SBKW,{'co.sales.quote':(SBKW['co.sales.quote']||'')+' เรียงลำดับ เรียงตามหัวข้อ ลูกศร ตัวกรอง เลือกตามหัวข้อ'});
