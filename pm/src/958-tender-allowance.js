/* ---------- 4.90: ปริมาณวัดจากแบบ + เผื่อ % on a bid's lines (user: "เพิ่มช่องอีกก็ได้ ผมจะได้รู้ด้วยว่าบวกไปเท่าไหร่ ...
   Excel ไม่ต้องมีก็ได้") ----------
   Two columns before จำนวน in รายการ ปริมาณงาน และราคาต้นทุน: the length measured from the drawings (i.q0) and the allowance
   added on top (i.xp, %). With a measured quantity the จำนวน is worked out from them (rounded up to a whole unit when there
   is an allowance) and can only be changed through them. Screen only: ปร.4 print and its Excel keep the form's columns. */
const tdAllowQ=i=>{const q0=n(i.q0),x=n(i.xp);return x?Math.ceil(q0*(1+x/100)-1e-9):q0};
HOOK.push(p=>{const m=p.match(/\.items\.([^.]+)\.(q0|xp)$/);if(!m)return;const t=curTd(),i=t&&t.items.find(x=>x.id===m[1]);
  if(i&&n(i.q0)>0)i.q=tdAllowQ(i)});
{const f=tdView;tdView=function(){let h=f();const t=curTd();if(!t||!t.items.length)return h;
  const a=h.indexOf('<span>รายการ ปริมาณงาน และราคาต้นทุน</span>'),z=a<0?-1:h.indexOf('</section>',a);if(z<0)return h;
  const I={};t.items.forEach(i=>I[i.id]=i);
  const s=h.slice(a,z).replace('<th class="r">จำนวน</th>','<th class="r" title="ปริมาณที่วัดได้จากแบบ ก่อนบวกเผื่อ">วัดจากแบบ</th><th class="r" title="บวกเผื่อจากปริมาณที่วัดได้">เผื่อ %</th><th class="r">จำนวน</th>')
    .replace(/<td style="width:80px"><input class="r" data-t="num" inputmode="decimal" data-p="([^"]+)\.([^".]+)\.q" value="([^"]*)" aria-label="จำนวน"><\/td>/g,(m,pb,id,v)=>{const i=I[id]||{},on=n(i.q0)>0,
      add=on?tdAllowQ(i)-n(i.q0):0,cell=(k,w,lb,val)=>`<td style="width:${w}px"><input class="r" data-t="num" inputmode="decimal" data-p="${pb}.${id}.${k}" value="${val}" aria-label="${lb}"></td>`;
      return cell('q0',80,'ปริมาณวัดจากแบบ',on?n(i.q0):'')+cell('xp',60,'เผื่อ %',on||n(i.xp)?n(i.xp):'')+
        (on?`<td style="width:80px"><input class="r" value="${v}" readonly style="background:transparent;border-color:transparent;font-weight:600" aria-label="จำนวน" title="วัดจากแบบ ${fmtq(i.q0)} + เผื่อ ${fmtq(i.xp)}% = เพิ่ม ${fmtq(Math.round(add*100)/100)} ${esc(i.unit||'')} (แก้ที่ช่องวัดจากแบบหรือเผื่อ %)">${add>0?`<small class="muted" style="display:block;text-align:right;line-height:1;margin-top:-2px">+${fmtq(Math.round(add*100)/100)}</small>`:''}</td>`:m)})
    .replace(/<tr class="grp"><td colspan="8">/g,'<tr class="grp"><td colspan="10">').replace('<tr class="grp"><td colspan="5">รวมค่าวัสดุและค่าแรง','<tr class="grp"><td colspan="7">รวมค่าวัสดุและค่าแรง');
  return h.slice(0,a)+s+h.slice(z)}}
