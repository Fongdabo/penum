/* ---------- 3.10.1: fixes from the five-project simulation ----------
   An advance or retention bill no longer takes an instalment, so instalment 1 is still billed in % mode;
   a bill set to "รับเงินแล้ว" gets today's date as its receipt date (editable), and a PO ticked as paid gets a pay date. */
{const f=NEW.bills;NEW.bills=arr=>{const r=f(arr.filter(b=>(b.kind||'prog')==='prog'));r.no=nextNo('INV-',arr);return r}}
HOOK.push((p,v)=>{const m=p.match(/^bills\.([^.]+)\.(kind|status)$/);if(!m)return;const b=P.bills.find(x=>x.id===m[1]);if(!b)return;
  if(m[2]==='kind'){if(v!=='prog')b.inst='';else if(!b.inst){const used=new Set(P.bills.filter(x=>x!==b&&(x.kind||'prog')==='prog').map(x=>x.inst));const ni=(P.inst||[]).find(x=>!used.has(x.id));if(ni)b.inst=ni.id}}
  else if(v==='paid'){if(!okD(b.paid))b.paid=today()}else b.paid=''});
HOOK.push((p,v)=>{const m=p.match(/^pos\.([^.]+)\.paid$/);if(!m)return;const o=P.pos.find(x=>x.id===m[1]);if(!o)return;if(v&&!okD(o.paidDate))o.paidDate=today();if(!v)o.paidDate=''});
// data saved before this fix: advance and retention bills holding an instalment give it back
function fix3101(){let k=0;projects().forEach(p=>(p.bills||[]).forEach(b=>{if((b.kind||'prog')!=='prog'&&b.inst){b.inst='';k++}}));if(k)save()}
{const r=render;render=function(){try{fix3101()}catch(e){console.error(e)}return r.apply(this,arguments)}}
