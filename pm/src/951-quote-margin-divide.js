/* ---------- 4.78 กำไรแบบหาร: the markup % can be the profit on the selling price, price = cost ÷ (1 − %) ----------
   User (2026-10-26, TOYOTA CANTEEN): "โปรแกรมใหม่เราก็คิดแบบหารเลย". Their Excel prices material = cost ÷ 0.72 and labour = cost ÷ 0.75,
   rounded up to whole baht; with Q.mkDiv the same quote takes ของ 28 % / แรง 25 % (200 qMkA) and gives the same prices.
   Two buttons ×คูณ / ÷หาร sit in the ทั้งใบ row of the lines table (932). Switching re-states every % of the quote (whole quote and
   each line), so the prices stay as they were; the company's last choice (co.qMkDiv) is the default of new quotes. */
const qdvTo=(v,div)=>{if(v===''||v==null)return v;const p=n(v);if(div)return +(p*100/(100+p)).toFixed(10);return p<100?+(p*100/(100-p)).toFixed(10):p};
const qdvBtns=Q=>{const d=!!Q.mkDiv,b=(v,on,txt,tip)=>`<button type="button" class="qdv-b${on?' on':''}" data-a="qdvSet" data-id="${Q.id}" data-v="${v}" title="${tip}" aria-pressed="${on}">${txt}</button>`;
  return `<span class="qdv" role="group" aria-label="วิธีคิดกำไร">${b(0,!d,'× คูณ','แบบคูณ: ราคาขาย = ทุน × (1 + %)')}${b(1,d,'÷ หาร','แบบหาร: ราคาขาย = ทุน ÷ (1 − %) · % คือกำไรจากราคาขาย')}</span>`};
// drawn into the page after render rather than by wrapping qlTable: 932 and others wrap it at render time keyed on their own flags
const qdvDraw=()=>{document.querySelectorAll('#view .ql-t').forEach(T=>{const th=T.querySelector('tr.qh3 th.qh3-l'),inp=T.querySelector('tr.qh3 input[data-p$=".mkM"]');
  if(!th||!inp||th.querySelector('.qdv'))return;const Q=(CO().quotes||[]).find(q=>inp.dataset.p===`co.quotes.${q.id}.mkM`);if(!Q)return;
  th.querySelector('b').insertAdjacentHTML('afterend',' '+qdvBtns(Q));if(!Q.mkDiv)return;
  const g=T.querySelector('th.qmk.qg');if(g&&g.firstChild&&g.firstChild.nodeType===3)g.firstChild.textContent=g.firstChild.textContent.replace('บวกกำไร %','กำไร % (แบบหาร)');
  const h=[...(T.closest('.card')||document).querySelectorAll('.hint')].find(x=>x.textContent.includes('ราคาขาย = ทุน บวก'));
  if(h&&h.firstChild&&h.firstChild.nodeType===3)h.firstChild.textContent=h.firstChild.textContent.replace('ราคาขาย = ทุน บวก ','ราคาขาย = ทุน ÷ (1 − กำไร %) · กำไร ')})};
{const r=render;render=function(){const x=r.apply(this,arguments);try{qdvDraw()}catch(e){}return x}}
ACT.qdvSet=b=>{const C=CO(),Q=(C.quotes||[]).find(q=>q.id===b.dataset.id),d=b.dataset.v==='1';if(!Q||!!Q.mkDiv===d)return;
  if(d&&[Q.mk,Q.mkM,Q.mkL,Q.mkE,...Q.items.flatMap(i=>[i.mkM,i.mkL])].some(v=>v!==''&&v!=null&&n(v)<0)){toast('มี % ติดลบ คิดแบบหารไม่ได้');return}
  ['mk','mkM','mkL','mkE'].forEach(k=>{if(k in Q)Q[k]=qdvTo(Q[k],d)});
  Q.items.forEach(i=>['mkM','mkL'].forEach(k=>{if(i[k]!==''&&i[k]!=null)i[k]=qdvTo(i[k],d)}));
  Q.mkDiv=d?1:0;C.qMkDiv=Q.mkDiv;save();render();
  toast(d?'คิดกำไรแบบหารแล้ว % คือกำไรจากราคาขาย ราคาเท่าเดิม':'คิดกำไรแบบคูณแล้ว ราคาเท่าเดิม')};
{const f=NEW.quotes;NEW.quotes=function(){const q=f.apply(this,arguments);if(CO().qMkDiv)q.mkDiv=1;return q}}
document.head.insertAdjacentHTML('beforeend','<style>.ql-t .qdv{display:inline-flex;margin-left:6px;border:1px solid var(--line,#cfd8dc);border-radius:7px;overflow:hidden;vertical-align:middle}.ql-t .qdv-b{font:inherit;font-size:11.5px;padding:2px 7px;border:0;background:var(--surface,#fff);color:var(--muted);cursor:pointer;white-space:nowrap}.ql-t .qdv-b+.qdv-b{border-left:1px solid var(--line,#cfd8dc)}.ql-t .qdv-b.on{background:var(--accent,#1C8F9B);color:#fff;font-weight:700}</style>');
if(typeof I18N==='object'&&I18N.en&&I18N.en.x)Object.assign(I18N.en.x,{'× คูณ':'× Markup','÷ หาร':'÷ Margin','กำไร % (แบบหาร)':'Margin %','วิธีคิดกำไร':'Profit method',
  'คิดกำไรแบบหารแล้ว % คือกำไรจากราคาขาย ราคาเท่าเดิม':'Now margin on the selling price; prices unchanged','คิดกำไรแบบคูณแล้ว ราคาเท่าเดิม':'Now markup on cost; prices unchanged','มี % ติดลบ คิดแบบหารไม่ได้':'A negative % cannot be a margin'});
