/* 4.99.76 the page stays where it was after an edit (user: "ทำไมตอนเราแก้ไขตัวเลขหรือทำอะไรสักอย่างจอชอบเด้งลงด้านล่าง"). Every edit
   redraws the page; putting the cursor back into the box that was being typed in (render's focus()) and the browser's scroll anchoring
   on the replaced content moved the page, by a little or a lot. A redraw of the same page now puts the scroll position back as it was,
   in the window and in any scrolled panel of the page. Moving to another page is not affected (those scroll to the top themselves). */
const ksKey=()=>{try{return JSON.stringify([S.mode,S.tab,S.ctab,S.sub,S.dept,DB.cur])}catch(e){return ''}};
{const f=render;render=function(){const ae=document.activeElement,fq=ae&&ae.dataset&&!ae.dataset.p&&(ae.dataset.qamt?['qamt',ae.dataset.qamt]:ae.dataset.iqamt?['iqamt',ae.dataset.iqamt]:null),k=ksKey(),x=window.scrollX,y=window.scrollY,
    inner=[...document.querySelectorAll('#view [data-ks], .fs-split, .qm-pane')].map(e=>[e.dataset.ks||e.className,e.scrollTop]);
  const r=f.apply(this,arguments);
  // the amount boxes (no data-p) keep the cursor too, so Tab into one is not lost by the redraw
  if(fq){const e=document.querySelector(`[data-${fq[0]}="${CSS.escape(fq[1])}"]`);if(e)e.focus({preventScroll:true})}
  if(ksKey()===k){if(Math.abs(window.scrollY-y)>1)window.scrollTo(x,y);
    inner.forEach(([c,t])=>{const e=[...document.querySelectorAll('#view [data-ks], .fs-split, .qm-pane')].find(z=>(z.dataset.ks||z.className)===c);if(e&&Math.abs(e.scrollTop-t)>1)e.scrollTop=t});
    // a late jump (fonts, pictures, the quotation preview filling in) within the next frame goes back too
    requestAnimationFrame(()=>{if(ksKey()===k&&Math.abs(window.scrollY-y)>1&&!document.activeElement.matches('body'))window.scrollTo(x,y)})}
  return r}}
document.head.insertAdjacentHTML('beforeend','<style>#view{overflow-anchor:none}</style>');
