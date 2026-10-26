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
// 4.92 (user: "ไม่มีแบบกดที่ที่เดียว แล้วเผื่อหัวข้อที่เป็นเมตรเลยหรอ"): one box above the lines sets the allowance of every line
// measured in metres at once (digging and backfill left out unless unticked); each line can still be changed on its own after.
// A line with no measured quantity yet takes its current จำนวน as the measured one, so the user is warned that a quantity which
// already has an allowance in it would get it twice.
const tdIsM=i=>/^(m|m\.|ม|ม\.|เมตร)$/i.test(String(i.unit||'').trim()),tdIsDig=i=>/^(ขุด|กลบ|ถม)/.test(String(i.desc||'').trim());
const tdXpLines=(t,dig)=>t.items.filter(i=>tdIsM(i)&&!(dig&&tdIsDig(i)));
ACT.tdXpAll=b=>{const t=tdById(b.dataset.id);if(!t)return;const x=n(($('#tdXpAll')||{}).value),dig=!!($('#tdXpDig')||{}).checked,L=tdXpLines(t,dig);
  if(!L.length){toast('ไม่มีรายการที่หน่วยเป็นเมตร');return}
  const raw=L.filter(i=>!(n(i.q0)>0));
  if(raw.length&&!confirm(`มี ${raw.length} รายการที่ยังไม่มีตัวเลขวัดจากแบบ จะถือจำนวนตอนนี้เป็นปริมาณที่วัดได้ แล้วบวกเผื่อ ${fmtq(x)}%\nถ้าจำนวนตอนนี้บวกเผื่อไว้แล้ว จะถูกบวกซ้ำ ทำต่อไหม?`))return;
  L.forEach(i=>{if(!(n(i.q0)>0))i.q0=n(i.q);i.xp=x;i.q=tdAllowQ(i)});t.xpAll=x;t.xpDig=dig;save();render();
  toast(`เผื่อ ${fmtq(x)}% ให้ ${L.length} รายการที่เป็นเมตรแล้ว`)};
{const f=tdView;tdView=function(){let h=f();const t=curTd();if(!t||!t.items.length)return h;
  const a=h.indexOf('<span>รายการ ปริมาณงาน และราคาต้นทุน</span>'),k=a<0?-1:h.indexOf('<div class="tw"',a);if(k<0)return h;
  const dig=t.xpDig!==false,N=tdXpLines(t,dig).length,x=t.xpAll!=null?n(t.xpAll):10;
  const bar=`<div class="row" style="gap:8px;align-items:center;flex-wrap:wrap;margin:0 0 10px"><b>เผื่อทุกรายการที่เป็นเมตร</b>
    <input id="tdXpAll" class="r" type="number" inputmode="decimal" min="0" step="any" style="width:70px" value="${x}" aria-label="เผื่อ % ทุกรายการที่เป็นเมตร"> %
    <label style="display:inline-flex;gap:4px;align-items:center"><input type="checkbox" id="tdXpDig"${dig?' checked':''}> ไม่รวมงานขุดดิน / กลบ</label>
    <button type="button" class="btn sm" data-a="tdXpAll" data-id="${t.id}">ใช้กับ ${N} รายการ</button>
    <small class="muted">แก้ทีละบรรทัดได้ที่ช่อง “เผื่อ %” · ใส่ 0 เพื่อเอาเผื่อออก</small></div>`;
  return h.slice(0,k)+bar+h.slice(k)}}
