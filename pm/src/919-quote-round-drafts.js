/* ---------- 4.36 drafts made before 4.34 round their selling prices too (user: "ยังไม่ปัดเศษเป็นจำนวนเต็มเลย") ----------
   qRndS (200) already rounds a draft with no Q.rnd to whole baht; here that choice is stored on every such draft the first time the
   company pages draw, so the quote keeps rounding after it is sent. Quotes already sent, won or lost keep their exact prices. */
{const f=render;render=function(){if(S.mode==='co'){let ch=0;try{(CO().quotes||[]).forEach(q=>{if(q.rnd==null&&(!q.status||q.status==='draft')){q.rnd='1';ch=1}})}catch(e){}if(ch)save()}return f.apply(this,arguments)}}
