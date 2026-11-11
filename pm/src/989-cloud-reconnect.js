/* ---------- 4.99.27 a device that fell off the cloud can really get back on with a link (user's tablet, 11 พ.ย.) ----------
   The red message says "open the admin link or an invite link on this device", but a device that still holds its dead sign-in
   counts as "already using this company": the link only showed "เครื่องนี้ใช้ … อยู่แล้ว ไม่ต้องเข้าร่วมอีก" and nothing joined.
   Now such a link (or the same link pasted into ตั้งค่า › ที่เก็บข้อมูล › ต่อคลาวด์อีกครั้ง) signs the device in afresh and joins.
   The last synced copy stays the base of the merge, so work done on this device while it was off is merged with the cloud
   instead of being dropped (the first-join path takes the cloud as it is), and a backup file of this device is saved first. */
const sbLostMsg=()=>FS.state==='err'&&/หลุดจากคลาวด์/.test(FS.msg||'');
const sbLinkP=t=>{try{const m=String(t||'').match(/join=([A-Za-z0-9_-]+)/);const o=m&&JSON.parse(jDec(m[1]));return o&&o.sp==='sb'&&o.sc&&o.k?o:null}catch(e){return null}};
let SBRJ=null;
async function sbRejoin(o,b){if(!o||o.sc!==SB.cid){alert('ลิงก์นี้เป็นของบริษัทอื่น ใช้ลิงก์ผู้ดูแลหรือลิงก์เชิญของ '+(DB.co.name||'บริษัทนี้'));return false}
  const t0=b&&b.textContent;if(b){b.disabled=true;b.textContent='กำลังต่อคลาวด์…'}
  const old={at:SB.at,rt:SB.rt,exp:SB.exp,dead:SB.dead,uid:SB.uid};let joined=false;
  try{try{await ACT.backup()}catch(e){}
    delete SB.at;delete SB.rt;delete SB.dead;SB.exp=0;await sbAuth('signup',{data:{}});
    const r=await sbRpc('pm_join',{p_company:SB.cid,p_code:o.k,p_label:o.wn||''});
    joined=true;SB.role=r.role||SB.role;SB.k=o.k;SB.kl=o.wn||'';SB.on=true;sbSave();
    FS.h=SBD(SB.cid);CL.dirMtime=0;clSave();
    if(!await baseGet())await baseSet(payload());// no last-synced copy on this device: take the cloud as it is, as a first join does
    for(let i=0;FS.busy&&i<100;i++)await new Promise(r=>setTimeout(r,100));await folderSync(true);if(FS.state==='err')throw new Error(FS.msg);
    joinClear();SBRJ=null;try{ACT.dlgClose()}catch(e){}toast('ต่อคลาวด์ PENUM แล้ว ข้อมูลในเครื่องนี้รวมกับข้อมูลบนคลาวด์เรียบร้อย');render();return true}
  catch(e){if(!joined){Object.assign(SB,old);if(!old.dead)delete SB.dead;sbSave()}
    const m=String(e&&e.message||e);alert(/bad code|no such/i.test(m)?'ลิงก์นี้ถูกยกเลิกแล้ว ใช้ลิงก์ผู้ดูแล หรือขอลิงก์เชิญใหม่':'ต่อคลาวด์ไม่ได้\n'+m+'\nข้อมูลในเครื่องนี้ยังอยู่ครบ');
    if(b){b.disabled=false;b.textContent=t0}render();return false}}
const sbRejoinTxt='<p>ข้อมูลในเครื่องนี้ยังอยู่ครบ กดปุ่มด้านล่างแล้วโปรแกรมจะ</p><ol style="padding-left:20px;line-height:1.8"><li>บันทึกไฟล์สำรองของเครื่องนี้ลงเครื่องก่อน</li><li>ต่อเครื่องนี้เข้าคลาวด์ใหม่</li><li>รวมงานที่ทำในเครื่องนี้ช่วงที่หลุด เข้ากับข้อมูลล่าสุดบนคลาวด์</li></ol>';
ACT.sbRejoinGo=b=>{let o=SBRJ;const ta=$('#sbRjLink');if(ta){o=sbLinkP(ta.value);if(!o){alert('ยังไม่ได้วางลิงก์ หรือลิงก์ไม่ครบ คัดลอกลิงก์ผู้ดูแลหรือลิงก์เชิญทั้งบรรทัดแล้ววางอีกครั้ง');return}}return sbRejoin(o,b)};
ACT.sbRejoinAsk=()=>{SBRJ=null;dialog('ต่อคลาวด์อีกครั้ง',`<p>วาง<b>ลิงก์ผู้ดูแล</b>หรือ<b>ลิงก์เชิญ</b>ของบริษัทนี้ในช่องด้านล่าง</p>
  <p class="hint">หาลิงก์ผู้ดูแล: ในเครื่องที่ยังต่อคลาวด์อยู่ (เช่น คอมพิวเตอร์) ไปที่ ตั้งค่า › ที่เก็บข้อมูล: คลาวด์ PENUM › กด <b>ลิงก์ผู้ดูแล</b> › คัดลอก แล้วส่งมาเครื่องนี้ทาง LINE</p>
  <textarea id="sbRjLink" rows="4" style="width:100%" placeholder="วางลิงก์ที่นี่"></textarea>${sbRejoinTxt}`,'<button type="button" class="btn pri" data-a="sbRejoinGo">ต่อคลาวด์อีกครั้ง</button>')};
// ตั้งค่า › ที่เก็บข้อมูล: the red message gets a button that does what it says
{const f=spCard;spCard=function(){const h=f.apply(this,arguments);if(!(sbOn()&&sbLostMsg()))return h;
  return h.replace('<button type="button" class="btn pri" data-a="fSync">','<button type="button" class="btn pri" data-a="sbRejoinAsk">ต่อคลาวด์อีกครั้ง (วางลิงก์)</button><button type="button" class="btn" data-a="fSync">')}}
// a link of this same company opened on a device that fell off: offer to join again in place of "ใช้อยู่แล้ว"
{const o=joinP();if(o&&o.sp==='sb'&&SB.on&&SB.cid&&o.sc===SB.cid&&sbReady())setTimeout(async()=>{
  try{await sbTok();return}catch(e){if(!(e&&e.pass)||!navigator.onLine)return}
  SBRJ=o;dialog('เครื่องนี้หลุดจากคลาวด์ PENUM',`<p>ลิงก์นี้ใช้ต่อเครื่องนี้กลับเข้า <b>${esc(o.co||DB.co.name||'')}</b> ได้</p>${sbRejoinTxt}`,'<button type="button" class="btn pri" data-a="sbRejoinGo">ต่อคลาวด์อีกครั้ง</button>')},400)}
