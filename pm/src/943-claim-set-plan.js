/* ---------- 4.64 ชุดเอกสารส่งงวด: แผนงานและความก้าวหน้า (S-Curve) (user: "เพิ่มแผนงานด้วยดีไหม") ----------
   A new page in the claim set (620), ticked by default: the project's Gantt chart with the S-Curve (480's ganttPrint, A4),
   with planned and actual progress at the claim's date above it. It prints on the set's landscape page like the Progress
   Payment sheet (class sub-pp → @page subland, 745), so the set does not put a page break before it, and ◫ แบ่งจอ (941) fits
   it to the paper. Being in SUBPG, it is listed in the cover letter's สิ่งที่ส่งมาด้วย by itself. */
SUBPG.splice(SUBPG.findIndex(x=>x[0]==='pp')+1,0,['plan','แผนงานและความก้าวหน้า (S-Curve)']);
{const f=subPk;subPk=b=>{const r=f(b);if(r.plan==null)r.plan=1;return r}}
function subPlan(b,x){if(!P.tasks.length||typeof ganttPrint!=='function')return '';const d=n(x.act)-n(x.plan);
  const h=ganttPrint('A4',true).replace(/<style>@page\{[^}]*\}<\/style>/,'').replace(/ data-doc-name="[^"]*"/,'');
  const box=`<div class="spl-sum"><b>ณ วันที่ใบเบิกงวดที่ ${esc(x.no)} (${thDL(b.date)})</b><span>ตามแผน <b>${fmt(x.plan,1)}%</b></span><span>ทำได้จริง <b>${fmt(x.act,1)}%</b></span>
    <span class="${d<0?'bad':'ok'}">${d<0?`ช้ากว่าแผน ${fmt(-d,1)}%`:d>0?`เร็วกว่าแผน ${fmt(d,1)}%`:'ตรงตามแผน'}</span><span>ผลงานที่ขอเบิกสะสม <b>${fmt(billCalc(b).cum,1)}%</b></span></div>`;
  const k=h.indexOf('<table class="gp-t"');return `<div class="sub-pp sub-plan">${k<0?box+h:h.slice(0,k)+box+h.slice(k)}</div>`}
// 620's set with the plan after the Progress Payment sheet (the rest is unchanged)
{const reg=submReg;PRINT.subm=id=>{const b=P.bills.find(y=>y.id===id);if(!b)return reg(id);const x=subInfo(b),pk=subPk(b),out=[];
  if(pk.let)out.push(subLetter(b,x,pk));if(pk.sum)out.push(subSummary(b,x));if(pk.bill)out.push(PRINT.bill(id));if(pk.pp&&typeof subPP==='function')out.push(subPP(b));
  if(pk.plan){const h=subPlan(b,x);if(h)out.push(h)}if(pk.cert)out.push(subCert(b,x));
  if(pk.ph){const h=subPh(b,x);if(h)out.push(h)}if(pk.ti)out.push(taxInv(id));
  // a landscape sheet starts its own page already; a page break before it as well would leave a blank page
  return out.join(subBr).split(subBr+'<div class="sub-pp').join('<div class="sub-pp')}}
// without a plan the page has nothing to print: say so next to its box
{const f=subCard;subCard=function(b){const h=f.apply(this,arguments);return P.tasks.length?h:h.replace(/(data-p="bills\.[^"]+\.pk\.plan"[^>]*>[^<]*)/,'$1 <small class="muted">(ยังไม่มีแผนงาน)</small>')}}
document.head.insertAdjacentHTML('beforeend',`<style>
#print .spl-sum{display:flex;flex-wrap:wrap;gap:6px 18px;align-items:center;margin:0 0 8px;padding:6px 10px;border:1px solid #D6E0E1;border-radius:6px;font-size:12px;color:#24343A}
#print .spl-sum .bad{color:#b3261e;font-weight:600}#print .spl-sum .ok{color:#1f6b3a;font-weight:600}
</style>`);
