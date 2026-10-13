/* ---------- start ---------- */
load();
if(DEMOPG)demoBoot();
// PENUM MEP and BIM open in their own window, so each app can sit on its own screen; a second press brings that window forward without reloading it
if(SUITE)document.addEventListener('click',e=>{const a=e.target.closest&&e.target.closest('a[target^="penum-"]');if(!a||e.ctrlKey||e.metaKey||e.shiftKey)return;e.preventDefault();
  let w=null;try{w=window.open('',a.target)}catch(x){}if(!w){location.href=a.href;return}try{if(w.location.href==='about:blank')w.location.href=a.href}catch(x){}w.focus()});
if(!SUITE){$('#lnkMep').href='https://claude.ai/artifact/89886eHGkANsq5qJL74P6u';$('#lnkBim').href='https://claude.ai/artifact/Vq6P1YQRkfUKiEjjDcPsha';$('#lnkMep').target=$('#lnkBim').target='_blank'}
render();
cloudInit();
folderInit();
