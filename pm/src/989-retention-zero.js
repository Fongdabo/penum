// 4.99.68 "ประกันผลงาน ตั้งไว้ 0% แต่ทำไม ในใบเบิกงวด โดนหัก": a project made from a won quote keeps the quote's retention on each
// งวด (it.rp = % of that claim, it.rx = % of the contract held from the last claim, see 981) and sets info.ret to 0, so the
// เบิกเป็นเปอร์เซ็นต์ตามงวด page showed 0 while every claim still held 5%. The box now shows the rate the งวด really use, and
// typing a rate there (0 included) or changing หักเงินประกันผลงานเมื่อไร makes that one rate apply to every งวด: the per-งวด rates
// are dropped, so claims recompute (drafts at once; issued claims too, as they are computed on the fly like before).
const retInst=()=>(P.inst||[]).filter(x=>x.rp!==undefined||x.rx!==undefined);
const retFromInst=()=>{const L=retInst();if(!L.length)return null;const rp=Math.max(0,...L.map(x=>n(x.rp))),rx=Math.max(0,...L.map(x=>n(x.rx)));
  return rp||rx?{r:rp||rx,last:!rp&&rx>0}:null};
HOOK.push(p=>{if(p!=='info.ret'&&p!=='info.retMode'||!P||!retInst().length)return;
  const e=retFromInst();if(p==='info.retMode'&&e&&!n(P.info.ret))P.info.ret=e.r;
  (P.inst||[]).forEach(x=>{delete x.rp;delete x.rx})});
{const f=VIEWS.cost;VIEWS.cost=()=>{let h=f();if((S.sub.cost||'sum')!=='bill'||P.info.billMode!=='pct')return h;const e=retFromInst();if(!e)return h;
  h=h.replace(/(<input data-t="num" data-p="info\.ret") value="[^"]*">/,`$1 value="${e.r}"><small class="muted">ตามใบเสนอราคา: ${e.last?`หักครั้งเดียวในงวดสุดท้าย ${fmtq(e.r)}% ของมูลค่าสัญญา`:`หัก ${fmtq(e.r)}% ทุกงวด`} · พิมพ์ตัวเลขใหม่ (เช่น 0) เพื่อเปลี่ยน</small>`);
  if(e.last)h=h.replace(/(<select data-p="info\.retMode">)<option value="" selected>/,'$1<option value="">').replace('<option value="last">','<option value="last" selected>');
  return h}}
