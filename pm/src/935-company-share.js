/* ---------- the company for PENUM MEP and BIM on this device (PM 3.77) ----------
   The company open here keeps its name, address, phone and logo under 'penum.company', so PENUM MEP fills "บริษัทผู้ออกแบบ / ผู้รับเหมา"
   of a project and PENUM BIM's stock title blocks show the firm, without the customer typing them a second and third time.
   Never from the sample company (?demo=1). The last company opened in PM on this device is the one MEP and BIM see. */
let coShared=null;
{const r=render;render=function(){const x=r.apply(this,arguments);try{const C=DB&&DB.co;if(!DEMOPG&&C&&String(C.name||'').trim()){
  const s=JSON.stringify({name:C.name.trim(),en:C.nameEn||'',tax:C.tax||'',branch:C.branch||'',addr:C.addr||'',phone:C.phone||'',email:C.email||'',logo:C.logo||''});
  if(s!==coShared){coShared=s;if(localStorage.getItem('penum.company')!==s)localStorage.setItem('penum.company',s)}}}catch(e){}return x}}
