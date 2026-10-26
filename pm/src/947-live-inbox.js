/* ---------- 4.74 รับงานสด: projects sent into this PM while the customer watches (shared/live.js) ----------
   User (2026-10-26): "อยากให้คุณทำงานใน PM ของผมสดๆ". The admin turns it on (เมนู › รับงานสด…) and gives the code to whoever
   works for them; that person sends with tools/live-send.mjs. A project goes in only after the admin says yes to it once,
   then later sends replace that project by themselves. Other projects, deletions and the company settings are never touched.
   The state is DB.co.live {code, on, ids, no, at}, one per company slot, so a send never lands in another company. */
if(window.penumLive){
  const liveWhy=()=>!pfAdmin()?'รับงานสดได้เฉพาะผู้ดูแลระบบ':(typeof licRO==='function'&&licRO())?'สิทธิ์การใช้งานหมดอายุ รับงานสดไม่ได้':'';
  penumLive.init({app:'pm',
    get:()=>DB&&DB.co?DB.co.live:null,
    set:s=>{if(!DB||!DB.co)return;DB.co.live=s;save(true)},
    list:()=>Object.values(DB.projects||{}).map(p=>({id:p.id,name:p.name})),
    ok:liveWhy,
    // wait while a form is open or someone is typing, so a send never wipes what is on screen
    busy:()=>{const d=$('#dlg'),a=document.activeElement;return !!(d&&d.open)||!!(a&&a.matches&&a.matches('input,textarea,select,[contenteditable]'))},
    apply:(id,data,extra,nm,first)=>{if(liveWhy()||!data||!data.info)return false;
      const p=migrate(JSON.parse(JSON.stringify(data)));p.id=id;
      for(const [k,v] of Object.entries((extra&&extra.photos)||{}))IDB.put(k,v).catch(()=>{});
      DB.projects[id]=p;if(P&&P.id===id)P=p;liveQuotes(id,(extra&&extra.quotes)||[]);
      if(first){DB.cur=id;P=p;S.mode='pj';S.tab='dash';S.sel={}}          // just accepted: open it, so the customer watches it fill
      save(true);render();return true}});
  // quotes are the company's (DB.co.quotes): only ones for this project (q.pj), new ones get the next free number here,
  // and a quote already here is replaced only if it came in this way (DB.co.live.q), keeping its number
  function liveQuotes(pid,L){const Q=DB.co.quotes=DB.co.quotes||[],lv=DB.co.live=DB.co.live||{},got=lv.q=lv.q||{};
    for(const src of L){if(!src||!src.id||src.pj!==pid)continue;const q=JSON.parse(JSON.stringify(src)),i=Q.findIndex(x=>x.id===q.id);
      if(i>=0){if(!got[q.id])continue;q.no=Q[i].no;Q[i]=q}
      else{if(!q.no||Q.some(x=>x.no===q.no))q.no=nextNo('QT-',Q);Q.push(q);got[q.id]=1}}}
  ACT.liveOpen=()=>{const w=liveWhy();if(w){toast(w);return}penumLive.open()};
  {const m=document.querySelector('#moreMenu .menu [data-a="pfOpen"]');if(m)m.insertAdjacentHTML('afterend','<button type="button" data-a="liveOpen">รับงานสด…</button>')}
  {const r=render;render=function(){const x=r.apply(this,arguments);try{const bk=$('[data-a="backup"]'),e=$('#moreMenu [data-a="liveOpen"]');if(e&&bk)e.hidden=bk.hidden}catch(e){}return x}}
  SBKW['co.coset']=(SBKW['co.coset']||'')+' รับงานสด ส่งงาน live inbox';
  if(typeof I18N==='object'&&I18N.en&&I18N.en.x)Object.assign(I18N.en.x,{'รับงานสด…':'Live inbox…'});
}
