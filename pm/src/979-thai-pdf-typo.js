/* ---------- 4.99.11 "จากัด" → "จำกัด" (user's quote list showed "บริษัท โนเบิ้ล … (ประเทศไทย) จากัด" next to "… จำกัด") ----------
   Text read from some PDFs loses the ำ of จำกัด (the PDF stores it as two glyphs), so one company shows up twice in lists and
   filters. "จากัด" is not a Thai word: every name saved with it is corrected once when the program opens it (quotes, customers,
   tenders, projects and their jobs), and anything imported later is corrected the same way. A project is renamed only when the
   corrected name is not already another job's. */
const thFix=s=>typeof s==='string'&&s.includes('จากัด')?s.replace(/จากัด/g,'จำกัด'):s;
function thFixAll(){let ch=0;const fx=(o,k)=>{if(o&&typeof o[k]==='string'){const v=thFix(o[k]);if(v!==o[k]){o[k]=v;ch=1}}},C=DB.co||{};
  (C.quotes||[]).forEach(q=>['pname','title','attn','site'].forEach(k=>fx(q,k)));(C.customers||[]).forEach(c=>['name','contact','addr'].forEach(k=>fx(c,k)));
  (C.tenders||[]).forEach(t=>['name','owner','site'].forEach(k=>fx(t,k)));(C.vendors||[]).forEach(v=>fx(v,'name'));
  Object.values(DB.projects||{}).forEach(p=>{fx(p.info,'client');if(!String(p.name||'').includes('จากัด'))return;
    const J=pjSplit(p),a=thFix(J.base),b=thFix(J.job||''),k=pjKey(pjCombine(a,b));
    if(Object.values(DB.projects).some(x=>x!==p&&pjKey(x.name)===k))return;pjSetNames(p,a,b);ch=1});return ch}
{const r=render;render=function(){try{if(thFixAll())save()}catch(e){}return r.apply(this,arguments)}}
{const f=impMeta;impMeta=function(){const M=f.apply(this,arguments);if(M&&typeof M==='object')Object.keys(M).forEach(k=>{M[k]=thFix(M[k])});return M}}
