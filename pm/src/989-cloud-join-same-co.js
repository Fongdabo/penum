/* ---------- 4.99.69 a cloud link opened where the same company was set up on its own (user's tablet, 22 พ.ย.) ----------
   Typing the activation code on a second device makes a new, empty copy of the company in that browser: same name, same
   code, none of the computer's work. Opening the computer's ลิงก์ผู้ดูแล or a ลิงก์เชิญ there was the way to get the real data,
   but the link only said "เครื่องนี้ใช้ … อยู่แล้ว ไม่ต้องเข้าร่วมอีก" (810) because the names match, and nothing joined.
   Now a cloud link for a company of the same name, on a device that is not on that company's cloud, offers to connect:
   a backup file of this device is saved first when it holds any records, then the device joins and takes the cloud copy.
   A device already on that same cloud keeps the old message (and 989-cloud-reconnect for a device that fell off). */
// 810 answers such a link with its "ใช้อยู่แล้ว" dialog once the data is loaded; that dialog is swapped for the offer below
{const o=joinP(),t=(()=>{try{return sessionStorage.getItem(JOINK)||''}catch(e){return ''}})();
  if(o&&o.sp==='sb'&&o.sc&&o.k&&!DEMOPG&&sbReady()&&!(sbOn()&&SB.cid===o.sc)){const d0=dialog;
    dialog=function(title,body){if(!(title==='ลิงก์เชิญพนักงาน'&&/ไม่ต้องเข้าร่วมอีก/.test(body||'')))return d0.apply(this,arguments);
      dialog=d0;const recs=!noRecs(),other=sbOn();
      ACT.sbSameJoin=async b=>{if(b){b.disabled=true;b.textContent='กำลังเชื่อมข้อมูล…'}
        if(recs){try{await ACT.backup()}catch(e){}}
        try{sessionStorage.setItem(JOINK,t)}catch(e){}
        // on another cloud copy: step off it (it stays on the cloud) and join the link's one; the cloud copy wins, as on a first join
        if(other){SB.on=false;sbSave();FS.h=null}
        try{ACT.dlgClose()}catch(e){}
        await ACT.sbJoin();
        if(!sbOn()&&other){SB.on=true;sbSave()}};
      return d0('ต่อเครื่องนี้กับข้อมูลบริษัท',
        `<p>เครื่องนี้มี <b>${esc(o.co)}</b> ที่ตั้งไว้แยกต่างหาก${other?' (คนละที่เก็บบนคลาวด์)':' (เก็บในเครื่องนี้เครื่องเดียว)'} จึงไม่เห็นงานจากเครื่องอื่น</p>
        <p>ลิงก์นี้ต่อเครื่องนี้เข้ากับข้อมูลของบริษัทบน<b>คลาวด์ PENUM</b> ใบเสนอราคา โครงการ และงานอื่นจากเครื่องที่ส่งลิงก์มาจะขึ้นที่นี่ และบันทึกตรงกันทุกเครื่อง</p>
        ${recs?'<p class="hint">ข้อมูลที่ทำไว้ในเครื่องนี้จะถูกบันทึกเป็นไฟล์สำรองลงเครื่องก่อน (นำกลับได้ด้วย "นำเข้าข้อมูล")</p>':''}`,
        '<button type="button" class="btn pri" data-a="sbSameJoin">ต่อกับข้อมูลบริษัท</button>')};
    setTimeout(()=>{dialog=d0},3000)}}
