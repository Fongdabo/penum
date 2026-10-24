/* ---------- 4.28: "ยังไม่มีรหัส?" under the activation-code screen ----------
   A new company (PC or phone) sees the code screen first (830-cloud.js). Like MEP and BIM (shared/licence.js), it now says how to get
   a code: the packages from plans.json and buttons that send ORIEN a request by LINE or e-mail with the text written in. */
const licAskTxt=()=>['เรียน ORIEN','','ขอรหัสเปิดใช้งาน PENUM PM (ทดลองใช้ฟรี หรือเช่าใช้)','','ชื่อบริษัท: ','ผู้ติดต่อ: ','เบอร์โทร: ','จำนวนผู้ใช้โดยประมาณ: '].join('\n');
const licAskTo=()=>Object.assign({email:'fong101dt@gmail.com',lineOA:'@xhg5783r'},(PLANS&&PLANS.contact)||{});
{const f=licGateView;licGateView=function(){const h=f.apply(this,arguments),c=licAskTo(),P=(PLANS.plans||[]).filter(x=>x&&x.name);
  const box=`<div class="lic-ask"><b>ยังไม่มีรหัส?</b><span class="hint">ขอรหัสทดลองใช้ฟรี หรือเช่าใช้ ติดต่อ ORIEN</span>
    ${P.length?`<p class="lic-pl">${P.map(x=>`<span>${esc(x.name)}</span> <span>${esc(planPrice(x))}</span>`).join(' · ')}${PLANS.bundle&&PLANS.bundle.txt?`<br>${esc(PLANS.bundle.txt)}`:''}</p>`:''}
    <div class="row">${c.lineOA?'<button type="button" class="btn pri sm" data-a="licAskLine">ติดต่อทาง LINE</button>':''}${c.email?'<button type="button" class="btn sm" data-a="licAskMail">ส่งอีเมล</button>':''}</div></div>`;
  return h.replace(/<\/section>$/,box+'</section>')}}
ACT.licAskMail=()=>{const c=licAskTo();location.href=`mailto:${c.email}?subject=${encodeURIComponent('ขอรหัสเปิดใช้งาน PENUM PM')}&body=${encodeURIComponent(licAskTxt())}`};
// same as ขอเปลี่ยนแพ็กเกจ: the phone opens the LINE chat with the text; a PC copies the text and opens the OA's QR page
ACT.licAskLine=async()=>{let id=String(licAskTo().lineOA||'').trim();if(!id)return;id=id.startsWith('@')?id:'@'+id;const t=licAskTxt();
  if(/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)){open(`https://line.me/R/oaMessage/${encodeURIComponent(id)}/?${encodeURIComponent(t)}`,'_blank');return}
  const ok=await copyText(t);open(`https://line.me/R/ti/p/${encodeURIComponent(id)}`,'_blank');
  toast(ok?`คัดลอกข้อความแล้ว เปิด LINE ค้นหาไอดี ${id} แล้ววางข้อความ`:`เปิด LINE ค้นหาไอดี ${id} แล้วพิมพ์ขอรหัสเปิดใช้งาน`)};
document.head.insertAdjacentHTML('beforeend',`<style>
#licGate .lic-ask{margin-top:16px;padding:12px 14px;border:1px solid var(--line);border-radius:12px;background:var(--soft,rgba(0,0,0,.02));display:flex;flex-direction:column;gap:6px}
#licGate .lic-ask .hint{margin:0}#licGate .lic-pl{margin:0;font-size:13px;color:var(--ink)}#licGate .lic-ask .row{display:flex;gap:8px;flex-wrap:wrap}
</style>`);
if(typeof I18N==='object'&&I18N.en&&I18N.en.x)Object.assign(I18N.en.x,{'ยังไม่มีรหัส?':'No code yet?','ขอรหัสทดลองใช้ฟรี หรือเช่าใช้ ติดต่อ ORIEN':'Ask ORIEN for a free trial code or a rental.',
  'ติดต่อทาง LINE':'Contact via LINE','ส่งอีเมล':'Send e-mail',
  'ทดลองใช้ (Pilot)':'Trial (Pilot)','ฟรีช่วงทดลอง':'Free during the trial','ติดต่อฝ่ายขาย':'Contact sales'});
