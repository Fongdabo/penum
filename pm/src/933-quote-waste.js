/* ---------- 4.47 เผื่อ % on a quotation line (user: "ส่วนจำนวนก็เพิ่มช่องเผื่อปริมาณไว้ น่าจะดูดีทำงานง่ายขึ้น") ----------
   i.wp = a line's allowance %, i.wq = its net quantity (what the drawing counts). The quoted quantity i.q = i.wq × (1 + %) rounded up,
   so the print, the totals, the purchasing and everything else that reads i.q follow it without change. Q.wp is the default, set in the
   markup row (932): it only applies to lines measured by length, area or weight (cable, pipe), as 5 cameras + 10% should not become 6
   unless that line asks for it. A line with no % keeps i.q as its only quantity, as before. */
const QW_MEAS=/เมตร|^ม\.?$|^m\.?$|^ตร|^ลบ|ตารางเมตร|กก|กิโล|^kg|ลิตร|ฟุต|^ft|^lm$/i;
const qwMeas=i=>QW_MEAS.test(String(i.unit||'').trim());
const qwHas=i=>i.wq!==''&&i.wq!=null;
const qwNet=i=>qwHas(i)?n(i.wq):n(i.q);
const qwOwn=i=>i.wp!==''&&i.wp!=null;
const qwP=(Q,i)=>i.hs||qwNet(i)<=0?0:qwOwn(i)?n(i.wp):qwMeas(i)?n(Q.wp):0;
// up to a whole unit; a short length (under 10) to 0.1
const qwRnd=(i,v)=>qwMeas(i)&&v<10?Math.ceil(v*10-1e-6)/10:Math.ceil(v-1e-6);
function qwApply(Q,i){const p=qwP(Q,i),old=n(i.q);
  if(p>0){if(!qwHas(i))i.wq=old;i.q=qwRnd(i,n(i.wq)*(1+p/100))}else if(qwHas(i)){i.q=n(i.wq);delete i.wq}
  if(n(i.q)===old)return false;if(n(i.m)+n(i.l)){if(typeof qlCost==='function')qlCost(i)}else if(old&&n(i.t))i.t=Math.round(n(i.t)/old*n(i.q)*100)/100;return true}
const qwAll=Q=>{let ch=false;(Q.items||[]).forEach(i=>{if(qwApply(Q,i))ch=true});return ch};
HOOK.push((p,v)=>{let m=p.match(/^co\.quotes\.([^.]+)\.items\.([^.]+)\.(wq|wp|unit)$/);if(m){const Q=CO().quotes.find(q=>q.id===m[1]),i=Q&&Q.items.find(x=>x.id===m[2]);if(i)qwApply(Q,i);return}
  m=p.match(/^co\.quotes\.([^.]+)\.wp$/);if(m){const Q=CO().quotes.find(q=>q.id===m[1]);if(Q)qwAll(Q)}});
// lines added later (picked, imported, from PENUM MEP) take the default too
{const r=render;render=function(){try{const C=CO(),Q=S.sel.quote&&C.quotes&&C.quotes.find(q=>q.id===S.sel.quote);if(Q&&(n(Q.wp)||(Q.items||[]).some(i=>qwOwn(i)||qwHas(i)))&&qwAll(Q))save()}catch(e){}return r.apply(this,arguments)}}
// the จำนวน and เผื่อ % cells of the lines table (982)
const qwCells=(Q,i,b)=>{const p=qwP(Q,i),on=p>0;
  return `<td style="width:86px;min-width:72px"><input class="r" data-t="num" data-p="${b}.items.${i.id}.${on?'wq':'q'}" value="${on?qwNet(i):n(i.q)}" aria-label="จำนวน"${on?' title="จำนวนสุทธิ ก่อนเผื่อ"':''}></td>
    <td class="qw" style="width:66px;min-width:60px">${i.hs?'':`<input class="r" data-t="num" data-p="${b}.items.${i.id}.wp" value="${qwOwn(i)?n(i.wp):''}" placeholder="${qwMeas(i)&&n(Q.wp)?fmtq(Q.wp):'0'}" aria-label="เผื่อปริมาณ (%)">${on?`<small class="qw-f" title="จำนวนที่เสนอ (พิมพ์ในใบเสนอราคา)">= ${fmtq(i.q)}</small>`:''}`}</td>`};
// the default in the markup row (932)
const qwStrip=(Q,b)=>`<th class="qw"><label class="qms-f qms-v" title="เผื่อปริมาณให้ทุกบรรทัดที่เป็นหน่วยความยาว พื้นที่ หรือน้ำหนัก (สายไฟ ท่อ) ที่ไม่ได้ใส่เผื่อเอง">เผื่อ %<input class="r" data-t="num" data-p="${b}.wp" value="${n(Q.wp)||''}" placeholder="0" aria-label="เผื่อปริมาณ (%)"></label></th>`;
// the internal cost sheet (915): net, %, quoted
const qwNote=(Q,i)=>{const p=qwP(Q,i);return p>0&&qwHas(i)?`<br><small style="color:#666">สุทธิ ${fmtq(i.wq)} + เผื่อ ${fmtq(p)}%</small>`:''};
document.head.insertAdjacentHTML('beforeend',`<style>.ql-t th.qw,.ql-t td.qw{background:rgba(110,90,200,.06)}.ql-t td.qw input{width:100%}.ql-t .qw-f{display:block;text-align:right;font-size:11.5px;color:var(--accent,#1C8F9B);font-weight:600;margin-top:2px}</style>`);
if(typeof I18N==='object'&&I18N.en&&I18N.en.x)Object.assign(I18N.en.x,{'เผื่อ %':'Allow. %'});
