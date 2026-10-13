/* ---------- 3.15.1: the company on the sign-in card ----------
   The PIN card shows whose data this is before anyone signs in: the company logo, Thai and English name,
   and PENUM PM small underneath. Data on a device belongs to one company (เริ่มบริษัทใหม่ replaces it), so there is
   nothing to pick between; the name tells staff on a shared computer which company they are entering. */
{const f=loginScreen;loginScreen=function(){const r=f.apply(this,arguments),C=CO(),h=document.querySelector('#view section.card > h2');
  if(h&&(C.name||C.logo)){const d=document.createElement('div');d.className='lg-co';
    d.innerHTML=`${C.logo?`<img src="${C.logo}" alt="">`:''}<div><b>${esc(C.name||'')}</b>${C.nameEn?`<small>${esc(C.nameEn)}</small>`:''}<span>เข้าใช้งาน PENUM PM</span></div>`;h.replaceWith(d)}
  return r}}
document.head.insertAdjacentHTML('beforeend',`<style>
.lg-co{display:flex;flex-direction:column;align-items:center;text-align:center;gap:10px;margin:2px 0 18px;padding-bottom:16px;border-bottom:1px solid var(--line,#8883)}
.lg-co img{max-width:180px;max-height:84px;object-fit:contain;background:#fff;border-radius:12px;padding:8px 12px}
.lg-co b{display:block;font-size:20px;line-height:1.35}.lg-co small{display:block;color:var(--muted);font-size:13px;margin-top:2px}
.lg-co span{display:block;margin-top:8px;font-size:13px;color:var(--muted);letter-spacing:.3px}
</style>`);
