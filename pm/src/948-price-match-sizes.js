/* ---------- 4.75 price library matching for BOQ lines written the usual Thai way ----------
   TOYOTA CANTEEN test (2026-10-26): "-Dai 50 มม. (2")" under the heading "ท่อเหล็กดำ SCH 40 … 50 มม. … 65 มม." found no price, or the
   1" pipe: every number in the heading (1.1.1, SCH 40, 50, 65) counted as a size the library line had to carry, and so did the mm
   figure next to the inch size. Now the heading only lends its words; the sizes come from the line itself, and a line that gives
   an inch size is matched by it (its mm figure names the same pipe). A line with mm alone keeps its mm (PPR, PE are sold by mm). */
const pbLineNums=i=>{const raw=[i.type,i.desc].filter(Boolean).join(' ');let d=pbNorm(raw);
  if(/\d\s*(?:["”″]|นิ้ว|inch)/i.test(raw))d=d.replace(/\d+(?:\.\d+)?\s*(?:mm|มม)\.?/g,' ');return pbNums(d)};
pbCands=function(pb,i){const q=itemName(i),qb=pbBig(q),qn=pbLineNums(i);
  return pbIdx(pb).map(e=>{let s=pbSim(qb,e.b);
    const miss=[...qn].filter(x=>!e.num.has(x)).length,extra=[...e.num].filter(x=>!qn.has(x)).length;s-=miss?.5:0;s-=extra*.04;if(i.unit&&e.x.unit&&pbNorm(i.unit).replace(/\W/g,'')===pbNorm(e.x.unit).replace(/\W/g,''))s+=.05;return {x:e.x,s}}).sort((a,b)=>b.s-a.s).slice(0,6)};
