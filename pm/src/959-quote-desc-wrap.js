/* ---------- 4.94 the whole item name in a quote's lines table (user, 2026-10-28 Aster CT quote: "ชื่อไม่เต็ม") ----------
   The รายการ box was one line, so long names (Butterfly Valve "Tozen" ขนาด 6" (แบบพวงมาลัย)) showed cut off. After each render a line
   that has a name gets a box that wraps onto as many lines as the name needs, with the same data-p, so saving, undo and the
   typo check (914) work as before. An empty line keeps the one-line box with its list of names from the price library; once a
   name is in, it wraps too. Enter finishes the name (it stays one item name, not two lines of text). */
const qdwFit=t=>{t.style.height='auto';t.style.height=(t.scrollHeight+2)+'px'};
const qdwDraw=()=>{const ae=document.activeElement;
  document.querySelectorAll('#view .ql-t input[data-p$=".desc"]').forEach(i=>{if(!i.value.trim())return;
    const t=document.createElement('textarea');for(const a of i.attributes)if(a.name!=='value'&&a.name!=='list'&&a.name!=='type')t.setAttribute(a.name,a.value);
    t.rows=1;t.className=(i.className+' qdw').trim();t.value=i.value;i.replaceWith(t);qdwFit(t);
    if(ae===i){const s=i.selectionStart;t.focus();try{t.setSelectionRange(s,s)}catch(e){}}})};
{const r=render;render=function(){const x=r.apply(this,arguments);try{qdwDraw()}catch(e){}return x}}
document.addEventListener('input',e=>{const t=e.target;if(t&&t.classList&&t.classList.contains('qdw'))qdwFit(t)});
document.addEventListener('keydown',e=>{const t=e.target;if(e.key==='Enter'&&!e.isComposing&&t&&t.classList&&t.classList.contains('qdw')){e.preventDefault();t.blur()}});
addEventListener('resize',()=>document.querySelectorAll('#view .ql-t textarea.qdw').forEach(qdwFit));
document.head.insertAdjacentHTML('beforeend',`<style>.ql-t td.ql-dc{min-width:220px!important}
.ql-t tbody td textarea.qdw{display:block;width:100%;min-width:0;box-sizing:border-box;resize:none;overflow:hidden;min-height:32px;padding:6px 8px;border-radius:8px;font:inherit;font-size:13.5px;line-height:1.35;background:var(--sunk);border:1px solid transparent;color:var(--ink);box-shadow:none;white-space:pre-wrap;overflow-wrap:anywhere}
.ql-t tbody td textarea.qdw:hover{border-color:var(--line)}.ql-t tbody td textarea.qdw:focus{border-color:var(--accent,#1C8F9B);background:var(--surface);outline:none}
.ql-t .ql-di textarea.qdw{flex:1 1 auto}</style>`);
