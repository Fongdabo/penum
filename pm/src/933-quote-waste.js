/* ---------- 4.47 เผื่อ % on a quotation line (user: "ส่วนจำนวนก็เพิ่มช่องเผื่อปริมาณไว้ น่าจะดูดีทำงานง่ายขึ้น") ----------
   i.wp = a line's allowance %, i.wq = its net quantity (what the drawing counts). The quoted quantity i.q = i.wq × (1 + %) rounded up,
   so the print, the totals, the purchasing and everything else that reads i.q follow it without change. Q.wp is the default, set in the
   markup row (932): it only applies to lines measured by length, area or weight (cable, pipe), as 5 cameras + 10% should not become 6
   unless that line asks for it. A line with no % keeps i.q as its only quantity, as before.
   4.48 two boxes (user: "ช่องเผื่อ ควรมี 2 ช่อง %และจำนวน ดีไหม"): i.wa = an allowance in units (+2 ตัว spare); i.q = net + i.wa.
   The box typed last wins: a % clears i.wa, an amount clears i.wp, and each box shows the other's value in grey. */
const QW_MEAS=/เมตร|^ม\.?$|^m\.?$|^ตร|^ลบ|ตารางเมตร|กก|กิโล|^kg|ลิตร|ฟุต|^ft|^lm$/i;
const qwMeas=i=>QW_MEAS.test(String(i.unit||'').trim());
const qwHas=i=>i.wq!==''&&i.wq!=null;
const qwNet=i=>qwHas(i)?n(i.wq):n(i.q);
const qwOwn=i=>i.wp!==''&&i.wp!=null;
const qwHasA=i=>i.wa!==''&&i.wa!=null;
const qwP=(Q,i)=>i.hs||qwNet(i)<=0||qwHasA(i)?0:qwOwn(i)?n(i.wp):qwMeas(i)?n(Q.wp):0;
// the allowance in units: typed, or net × %
const qwAdd=(Q,i)=>i.hs||qwNet(i)<=0?0:qwHasA(i)?Math.max(0,n(i.wa)):qwNet(i)*qwP(Q,i)/100;
// up to a whole unit; a short length (under 10) to 0.1
const qwRnd=(i,v)=>qwMeas(i)&&v<10?Math.ceil(v*10-1e-6)/10:Math.ceil(v-1e-6);
function qwApply(Q,i){const a=qwAdd(Q,i),old=n(i.q);
  if(a>0){if(!qwHas(i))i.wq=old;i.q=qwRnd(i,n(i.wq)+a)}else if(qwHas(i)){i.q=n(i.wq);delete i.wq}
  if(n(i.q)===old)return false;if(n(i.m)+n(i.l)){if(typeof qlCost==='function')qlCost(i)}else if(old&&n(i.t))i.t=Math.round(n(i.t)/old*n(i.q)*100)/100;return true}
const qwAll=Q=>{let ch=false;(Q.items||[]).forEach(i=>{if(qwApply(Q,i))ch=true});return ch};
HOOK.push((p,v)=>{let m=p.match(/^co\.quotes\.([^.]+)\.items\.([^.]+)\.(wq|wp|wa|unit)$/);if(m){const Q=CO().quotes.find(q=>q.id===m[1]),i=Q&&Q.items.find(x=>x.id===m[2]);if(!i)return;
    if(v!==''&&m[3]==='wp')delete i.wa;if(v!==''&&m[3]==='wa')delete i.wp;qwApply(Q,i);return}
  m=p.match(/^co\.quotes\.([^.]+)\.wp$/);if(m){const Q=CO().quotes.find(q=>q.id===m[1]);if(Q)qwAll(Q)}});
// lines added later (picked, imported, from PENUM MEP) take the default too
{const r=render;render=function(){try{const C=CO(),Q=S.sel.quote&&C.quotes&&C.quotes.find(q=>q.id===S.sel.quote);if(Q&&(n(Q.wp)||(Q.items||[]).some(i=>qwOwn(i)||qwHasA(i)||qwHas(i)))&&qwAll(Q))save()}catch(e){}return r.apply(this,arguments)}}
// the จำนวน and เผื่อ cells of the lines table (982). 4.54 (user: "อยากให้ %ไว้ด้านซ้าย +ไว้ด้านขวา เอาไว้ใต้คำว่าเผื่อ (เพิ่มชื่อ เผื่อปริมาณ)"):
// two cells side by side under เผื่อปริมาณ, % on the left and + (amount) on the right, the quoted quantity under the + box
const qwCells=(Q,i,b)=>{const a=qwAdd(Q,i),on=a>0,net=qwNet(i),u=esc(i.unit||''),ph=v=>fmtq(Math.round(v*100)/100),
    pp=qwHasA(i)?(net?n(i.wa)*100/net:0):qwMeas(i)&&n(Q.wp)&&!qwOwn(i)?n(Q.wp):0;
  return `<td class="qq" style="width:72px;min-width:56px"><input class="r" data-t="num" data-p="${b}.items.${i.id}.${on?'wq':'q'}" value="${on?net:n(i.q)}" aria-label="จำนวน"${on?' title="จำนวนสุทธิ ก่อนเผื่อ"':''}></td>
    <td class="qw qwp">${i.hs?'':`<input class="r${qwOwn(i)?' own':''}" data-t="num" data-p="${b}.items.${i.id}.wp" value="${qwOwn(i)?n(i.wp):''}" placeholder="${ph(pp)}" aria-label="เผื่อปริมาณ (%)" title="เผื่อเป็นเปอร์เซ็นต์">`}</td>
    <td class="qw qwa">${i.hs?'':`<input class="r${qwHasA(i)?' own':''}" data-t="num" data-p="${b}.items.${i.id}.wa" value="${qwHasA(i)?n(i.wa):''}" placeholder="${ph(on?n(i.q)-net:0)}" aria-label="เผื่อปริมาณ (จำนวน)" title="เผื่อเป็นจำนวน${u?' ('+u+')':''} เช่น สำรอง 2 ตัว">
      ${on?`<small class="qw-f" title="จำนวนที่เสนอ (พิมพ์ในใบเสนอราคา)">= ${fmtq(i.q)} ${u}</small>`:''}`}</td>`};
// the default in the markup row (932)
const qwStrip=(Q,b)=>!n(Q.wp)&&!(Q.items||[]).some(i=>!i.hs&&qwMeas(i))?'<th class="qw"></th>':`<th class="qw"><label class="qms-f qms-v" title="เผื่อปริมาณให้ทุกบรรทัดที่เป็นหน่วยความยาว พื้นที่ หรือน้ำหนัก (สายไฟ ท่อ) ที่ไม่ได้ใส่เผื่อเอง">เผื่อ %<input class="r" data-t="num" data-p="${b}.wp" value="${n(Q.wp)||''}" placeholder="0" aria-label="เผื่อปริมาณ (%)"></label></th>`;
// the internal cost sheet (915): net, %, quoted
const qwNote=(Q,i)=>{if(!qwHas(i)||!(qwAdd(Q,i)>0))return '';const a=n(i.q)-n(i.wq),p=qwHasA(i)?'':` (${fmtq(qwP(Q,i))}%)`;return `<br><small style="color:#666">สุทธิ ${fmtq(i.wq)} + เผื่อ ${fmtq(Math.round(a*100)/100)}${p}</small>`};
document.head.insertAdjacentHTML('beforeend',`<style>.ql-t th.qw,.ql-t td.qw{background:rgba(110,90,200,.06)}.ql-t td.qw{width:54px;min-width:48px;padding-left:3px;padding-right:3px}.ql-t td.qw input{width:100%;min-width:0;padding:4px 5px}.ql-t td.qw input.own{font-weight:700;color:var(--accent,#1C8F9B)}.ql-t th.qw.qp,.ql-t th.qw.qa{text-align:center}.ql-t .qw-f{display:block;text-align:right;font-size:11.5px;color:var(--accent,#1C8F9B);font-weight:600;margin-top:2px}</style>`);
if(typeof I18N==='object'&&I18N.en&&I18N.en.x)Object.assign(I18N.en.x,{'เผื่อ %':'Allow. %','เผื่อ':'Allowance','เผื่อปริมาณ':'Qty allowance'});
