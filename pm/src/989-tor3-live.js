/* ---------- 4.99.56 รับงานสดส่ง TOR ได้ ----------
   User (2026-11-19, รพ.ค่ายสุรนารี): "ส่งเข้า PM ได้เลย" for the TOR and its PM/MA quotation. 947 sent projects, quotes and bids only,
   so a TOR (ขาย › TOR, CO().tors) of a sent project (t.pj) now comes in the same way: a new one takes the next TOR- number here, one already
   here is replaced only if it came in this way (DB.co.live.tor), keeping its number, ticks and answers typed here. Its files ride in the
   photos of the send (947 puts them in IDB), and a quote it is picked onto keeps pointing back (Q.tor). */
function liveTors(pid,L){const C=DB.co,T=C.tors=C.tors||[],lv=C.live=C.live||{},got=lv.tor=lv.tor||{};
  for(const src of L){if(!src||!src.id||src.pj!==pid)continue;const t=JSON.parse(JSON.stringify(src)),i=T.findIndex(x=>x.id===t.id);
    if(!Array.isArray(t.req))t.req=[];if(!Array.isArray(t.files))t.files=[];
    if(i>=0){if(!got[t.id])continue;const old=T[i];t.no=old.no;
      // what was ticked or answered here on a clause the send still has stays
      const M={};(old.req||[]).forEach(r=>{if(r&&r.id)M[r.id]=r});t.req.forEach(r=>{const o=M[r.id];if(!o)return;if(o.ok&&!r.ok)r.ok=o.ok;if(String(o.ans||'').trim()&&!String(r.ans||'').trim())r.ans=o.ans});
      ['dept','by','status'].forEach(k=>{if(old[k]&&!t[k])t[k]=old[k]});T[i]=t}
    else{if(!t.no||T.some(x=>x.no===t.no))t.no=nextNo('TOR-',T);T.push(t);got[t.id]=1}
    const Q=t.q&&(C.quotes||[]).find(q=>q.id===t.q);if(Q)Q.tor=t.id}}
