/* PENUM โครงการของบริษัท (company projects): every PENUM MEP / PENUM BIM project of one customer company in one list that all of
   its staff see, wherever each one works, with who saved it last and who has it open now, so two people do not overwrite each other.
   tools/build-pages.mjs puts this file in the <head> of every app whose app.json has "team": true (MEP, BIM; see docs/apps.md).
   - The company is the licence code (shared/licence.js, one code per customer company). The list lives in ORIEN's Supabase
     (tools/team-setup.sql, run once): a company key kept there encrypted with the code, and one row per project encrypted with
     that key, so only devices holding the company's code can find or read it; ORIEN cannot. A renewed code gets the same key.
   - Each project is shared by itself: the open project goes up a few seconds after a change; MEP also shares the other projects
     in its list once. Taking a project off the list (เอาออกจากรายการ) deletes nothing and stops it going up again.
   - Edit lock: the device that has a project open holds it (every 50 s; it lapses 150 s after the last word, or after 15 minutes
     without use). Another device opens it to look: its own changes stay on that device until the lock is free, and it can make
     its own copy or take over. A save is refused when the company's copy changed since this device's version (the server checks
     the version), so the device asks: use the newest (its own version kept as a copy) or send its own over it.
   - Who: the person signed in with the company's PENUM PM staff accounts (name + PIN, or PM's fingerprint / face passkey; or PENUM PM
     signed in on this browser). A company whose staff have PINs asks everyone to sign in first, like PM. No sign-in: "ไม่ระบุชื่อ"
     and 4 letters of the device id. localStorage 'penum.team' (shared by MEP and BIM) keeps the device id, company keys, the
     sign-in (auth) and the staff list (dir).
   - Whose work: a project belongs to the person signed in when it first went up (its owner, with the job they hold in PM). Once the
     company signs in, only the owner (or the administrator) saves it; everyone else opens it to look, and asks the owner to edit
     (what and why, until when). The owner, or the administrator when the owner is away, approves or declines; until then the
     project is view-only there: nothing is saved on that device and nothing goes up. A request is a row of its own (k:'req').
   - Updates: each project keeps its last 20 saves (who, when, its figures), so the list shows งานของฉัน, งานของเพื่อนร่วมงาน,
     คำขอแก้ไข and อัปเดตของบริษัท (every save of MEP and BIM, newest first, with what changed), like AutoCAD's Recent page.
   - PENUM PM ("team": true too, cfg.app 'pm') shows อัปเดตของบริษัท and คำขอแก้ไข only: a PM project changed there goes into the updates
     (pmPut, a row k:'pm' with no data), and PM's chat lists the edit requests with อนุมัติ / ไม่อนุมัติ (reqs, decide). It fires 'penumteam'.
   window.penumTeam: attach(cfg) · soon() after a change · tick() · render(el, {compact}) the list · state() · name() · me() · chip(cls) · signIn() · signOut()
   · ro() the open project is someone else's and not approved: the app does not save it · roNote() says so
   cfg (the app): app 'mep'|'bim' · cur() → null (nothing to share: a sample, read-only) or {id, name, client, code, sum, text()}
   · apply(text, meta) the company's newer version replaces the open one · has(id) · openLocal(id) · open(text, meta) → bool
   · copy(text, meta) a project of its own with a new id · keep(text) keep this device's version as a copy · sumTxt(sum) · locals()
   · PM: lic() → {code, st, cid, co} · openPm(id) */
(()=>{if(window.penumTeam)return;
const SB={url:'https://uejnlxwjqsadbnzdncvb.supabase.co',key:'sb_publishable_0GTUfFnwBuWxjMw7yYULtQ_mhVVhcez'};
const K='penum.team',TTL=150e3,BEAT=50e3,IDLE=15*60e3,MAX=3e6,SOON=6e3;
const EN=()=>!/^th/i.test(document.documentElement.lang||'th');
const T={
  title:['โครงการของบริษัท','Company projects'],
  sub:['ทุกคนในบริษัทเดียวกันเห็นรายการนี้ เปิดต่อจากเพื่อนร่วมงานได้ และเห็นว่าใครกำลังแก้อยู่','Everyone in your company sees this list: carry on from a colleague and see who is editing what.'],
  you:['ผู้ใช้งาน','Signed in as'],chg:['เปลี่ยนผู้ใช้','Change user'],uT:['ผู้ใช้งาน','User'],uTip:['ผู้ใช้งาน','User'],uSet:['เข้าสู่ระบบ','Sign in'],
  admin:['ผู้ดูแลระบบ','Administrator'],hi:['สวัสดีครับ {0}','Hello {0}'],
  inT:['เข้าใช้งาน {0}','Sign in to {0}'],inP:['{0} · ใช้ชื่อและ PIN เดียวกับ PENUM PM','{0} · use the same name and PIN as in PENUM PM'],inWho:['ชื่อผู้ใช้','Name'],
  inForgot:['ลืม PIN ให้ผู้ดูแลระบบตั้งใหม่ใน PENUM PM › ตั้งค่าบริษัท › เข้าระบบด้วย PIN','Forgot your PIN? The administrator sets a new one in PENUM PM › Company settings › PIN sign-in'],
  inGo:['เข้าใช้งาน','Sign in'],inBio:['สแกนนิ้ว / ใบหน้า','Fingerprint / face'],inBad:['PIN ไม่ถูกต้อง','Wrong PIN'],inWait:['ใส่ PIN ผิดหลายครั้ง รอ 30 วินาทีแล้วลองใหม่','Too many wrong PINs. Wait 30 seconds and try again'],
  inBioBad:['สแกนไม่สำเร็จ ลองใหม่หรือใช้ PIN','The scan did not work. Try again or use your PIN'],
  uIs:['เข้าใช้งานในชื่อ {0}','Signed in as {0}'],viaPm:['เข้าระบบผ่าน PENUM PM ในเครื่องนี้','Signed in through PENUM PM on this computer'],viaPin:['เข้าระบบด้วย PIN','Signed in with a PIN'],viaBio:['เข้าระบบด้วยการสแกน','Signed in with a scan'],
  uSwitch:['เปลี่ยนผู้ใช้','Change user'],uOut:['ออกจากระบบ','Sign out'],outDone:['ออกจากระบบแล้ว','Signed out'],
  uNoDir:['บริษัทยังไม่ได้ตั้ง PIN ให้พนักงาน จึงยังไม่มีชื่อผู้ใช้ ผู้ดูแลระบบตั้งได้ที่ PENUM PM › ตั้งค่าบริษัท › เข้าระบบด้วย PIN แล้วเปิด PENUM MEP หรือ BIM บนเครื่องนั้นหนึ่งครั้ง รายชื่อจะไปถึงทุกเครื่องของบริษัทเอง','Your company has not given staff PINs yet, so there is no user name. The administrator sets them in PENUM PM › Company settings › PIN sign-in, then opens PENUM MEP or BIM once on that computer; the list reaches every computer of the company by itself.'],
  anon:['ไม่ระบุชื่อ ({0})','No name ({0})'],needName:['เข้าสู่ระบบ เพื่อนร่วมงานจะได้เห็นว่าใครแก้','Sign in so colleagues see who edited'],
  load:['กำลังโหลดรายการของบริษัท…','Loading your company list…'],
  nolic:['ใช้ได้เมื่อเครื่องนี้มีรหัสเปิดใช้งานของบริษัท (รหัสเดียวกับที่เพื่อนร่วมงานใช้) เมนู › สิทธิ์การใช้งาน','Works when this device has your company\'s activation code (the one your colleagues use): Menu › Licence.'],
  offline:['ต่ออินเทอร์เน็ตไม่ได้ จึงยังไม่เห็นรายการของบริษัท โครงการในเครื่องนี้ใช้ได้ตามปกติ','No internet connection, so the company list is not shown. Projects on this device work as usual.'],
  nosql:['ORIEN ยังไม่ได้เปิดระบบโครงการของบริษัท (tools/team-setup.sql) ติดต่อ ORIEN','ORIEN has not switched company projects on yet (tools/team-setup.sql). Contact ORIEN.'],
  bad:['โหลดรายการของบริษัทไม่สำเร็จ','The company list could not be loaded'],retry:['ลองอีกครั้ง','Try again'],
  none:['ยังไม่มีโครงการในรายการของบริษัท โครงการที่เปิดในเครื่องนี้จะขึ้นที่นี่เอง','No company projects yet. The projects you open here show up by themselves.'],
  q:['ค้นหาชื่อโครงการ ลูกค้า หรือคนแก้','Search project, client or person'],
  by:['บันทึกล่าสุดโดย {0}','Last saved by {0}'],editing:['{0} กำลังแก้อยู่','{0} is editing'],editMe:['คุณกำลังแก้อยู่','You are editing'],
  here:['มีในเครื่องนี้','On this device'],open:['เปิด','Open'],look:['เปิดดู','Look'],copy:['ทำสำเนาเป็นงานของฉัน','Make my own copy'],
  hide:['เอาออกจากรายการ','Take off the list'],show:['แสดงอีกครั้ง','Put back'],hidden:['ที่เอาออกจากรายการแล้ว ({0})','Taken off the list ({0})'],
  sharing:['กำลังแชร์โครงการในเครื่องนี้ให้บริษัท {0} รายการ…','Sharing {0} projects of this device with your company…'],
  now:['เมื่อสักครู่','just now'],min:['{0} นาทีที่แล้ว','{0} min ago'],today:['วันนี้ {0}','today {0}'],yday:['เมื่อวาน {0}','yesterday {0}'],
  lockT:['{0} กำลังแก้โครงการนี้อยู่','{0} is editing this project'],
  lockP:['{0} เปิดแก้ “{1}” อยู่ ถ้าแก้พร้อมกัน งานจะทับกัน เปิดดูได้ (การแก้ในเครื่องนี้ยังไม่ส่งเข้าบริษัท) ทำสำเนาเป็นงานของคุณ หรือรอให้ {0} ปิดก่อน','{0} has “{1}” open. Editing it together would overwrite each other. Look at it (changes made here are not sent to the company), make your own copy, or wait until {0} closes it.'],
  cancel:['ยกเลิก','Cancel'],close:['ปิด','Close'],
  bar:['{0} กำลังแก้โครงการนี้อยู่ · ที่นี่เปิดดูได้ การแก้ในเครื่องนี้จะยังไม่ส่งเข้าบริษัท','{0} is editing this project · you can look here; changes made here are not sent to the company'],
  take:['แก้แทน','Take over'],takeT:['แก้แทน {0}?','Take over from {0}?'],
  takeP:['{0} จะเห็นว่าคุณแก้ต่อ และงานที่ {0} ยังไม่ได้ส่ง จะไม่ทับงานของคุณ (เครื่องของ {0} จะถามก่อน) ใช้เมื่อ {0} ลืมปิดโครงการ หรือตกลงกันแล้ว','{0} sees that you carry on; whatever {0} has not sent yet will not overwrite yours ({0}\'s device asks first). Use it when {0} forgot to close the project, or you agreed.'],
  newT:['มีฉบับใหม่กว่าในบริษัท','A newer version is in the company list'],
  newP:['{0} บันทึก “{1}” ไว้ ({2}) หลังจากที่เครื่องนี้แก้ไขไปด้วย ถ้าส่งของคุณทับ งานของ {0} ในรายการของบริษัทจะถูกแทนที่','{0} saved “{1}” ({2}), after this device changed it too. Sending yours over it replaces {0}\'s work in the company list.'],
  useNew:['ใช้ฉบับของ {0} (ของฉันเก็บเป็นสำเนา)','Use {0}\'s version (keep mine as a copy)'],useMine:['ส่งของฉันทับ','Send mine over it'],later:['ไว้ทีหลัง','Later'],
  barNew:['มีฉบับใหม่กว่าในบริษัทจาก {0} · การแก้ในเครื่องนี้หยุดส่งไว้ก่อน','{0} saved a newer version in the company list · this device stopped sending for now'],pick:['เลือกฉบับ','Choose'],
  got:['อัปเดตเป็นฉบับล่าสุดที่ {0} บันทึกแล้ว','Updated to the latest version {0} saved'],
  big:['โครงการนี้ใหญ่เกินกว่าจะแชร์ให้บริษัท (เกิน 3 MB หลังบีบอัด) บันทึกลงเครื่องแล้วส่งไฟล์แทน','This project is too big to share with your company (over 3 MB compressed). Save it to a file and send that instead.'],
  full:['พื้นที่ของระบบโครงการของบริษัทเต็ม ติดต่อ ORIEN','Company projects storage is full. Contact ORIEN.'],
  hideT:['เอา “{0}” ออกจากรายการของบริษัท?','Take “{0}” off the company list?'],
  hideP:['ไม่มีอะไรถูกลบ เครื่องที่มีโครงการนี้อยู่ยังเก็บไว้ แต่จะไม่ส่งเข้ารายการอีก จนกว่าจะกด แสดงอีกครั้ง','Nothing is deleted: devices that have the project keep it, but stop sending it until someone presses Put back.'],
  fail:['เปิดจากรายการของบริษัทไม่สำเร็จ ลองอีกครั้ง','Could not open it from the company list. Try again.'],
  cnt:['{0} โครงการ','{0} projects'],co:['บริษัท {0}','{0}'],
  tMine:['งานของฉัน','My work'],tMates:['งานของเพื่อนร่วมงาน','Colleagues\' work'],tReq:['คำขอแก้ไข','Edit requests'],tFeed:['อัปเดตของบริษัท','Company updates'],tAll:['โครงการทั้งหมด','All projects'],
  cProj:['โครงการ','Project'],cApp:['โปรแกรม','Program'],cOwn:['เจ้าของงาน · งานที่รับผิดชอบ','Owner · responsibility'],cLast:['บันทึกล่าสุด','Last saved'],cMay:['สิทธิ์ของฉัน','My right'],
  pOwn:['งานของฉัน','Mine'],pAdm:['แก้ได้ (ผู้ดูแลระบบ)','Can edit (administrator)'],pTill:['แก้ได้ ถึง {0}','Can edit until {0}'],pEver:['แก้ได้','Can edit'],pWait:['ขอแล้ว รออนุมัติ','Asked · waiting'],
  pNo:['ไม่อนุมัติ','Declined'],pView:['เปิดดูได้','View only'],pFree:['แก้ได้ (ยังไม่มีเจ้าของงาน)','Can edit (no owner yet)'],
  openEd:['เปิดแก้ไข','Open to edit'],ask:['ขอแก้ไข','Ask to edit'],askAgain:['ขออีกครั้ง','Ask again'],unask:['ยกเลิกคำขอ','Cancel request'],
  mateNote:['งานของคนอื่นเปิดดูได้เสมอ แต่บันทึกไม่ได้ จนกว่าเจ้าของงานจะอนุมัติคำขอแก้ไข','You can always look at colleagues\' work, but you cannot save it until its owner approves your request.'],
  granted:['งานที่ได้รับอนุมัติให้แก้ (งานของคนอื่น)','Colleagues\' work you may edit'],ownBy:['เจ้าของงาน {0}','Owner {0}'],
  noMine:['ยังไม่มีงานของคุณในรายการของบริษัท โครงการที่คุณสร้างและบันทึกจะขึ้นที่นี่เอง','None of your work is on the company list yet. Projects you create and save show up here by themselves.'],
  noMates:['ยังไม่มีงานของเพื่อนร่วมงาน','No colleagues\' work yet.'],anyone:['ทุกคน','Everyone'],
  rqT:['ขอแก้ไขงานของเพื่อนร่วมงาน','Ask to edit a colleague\'s work'],rqWhat:['ต้องการทำอะไร','What do you want to do'],
  w0:['แก้ไขข้อมูล','edit the data'],w1:['ทำต่อ','carry on'],w2:['อัปเดตตามแบบแก้','update to a revised drawing'],w3:['แก้ BOQ / ราคา','change the BOQ / prices'],w4:['อื่น ๆ','something else'],
  rqNote:['รายละเอียด / ข้อความถึงเจ้าของงาน','Details / a message to the owner'],rqTill:['ขอสิทธิ์ถึงเมื่อไร','Until when'],
  d0:['วันนี้','Today'],d3:['3 วัน','3 days'],d7:['7 วัน','7 days'],dX:['จนกว่าเจ้าของงานจะยกเลิก','Until the owner cancels'],
  rqH:['ระหว่างรออนุมัติ เปิดดูได้แต่บันทึกไม่ได้ เจ้าของงานจะเห็นคำขอในโปรแกรม (ผู้ดูแลระบบอนุมัติแทนได้เมื่อเจ้าของงานไม่อยู่)','While you wait you can look but not save. The owner sees the request in the program (the administrator can approve when the owner is away).'],
  rqGo:['ส่งคำขอให้ {0}','Send to {0}'],rqNeed:['เขียนรายละเอียดสั้น ๆ ถึงเจ้าของงานก่อน','Write a short note to the owner first'],rqSent:['ส่งคำขอให้ {0} แล้ว','Request sent to {0}'],
  rqFail:['ส่งไม่สำเร็จ ลองอีกครั้ง','It could not be sent. Try again.'],
  rqMine:['คำขอแก้ไขงานของฉัน','Requests to edit my work'],rqAdm:['คำขอที่รออนุมัติทั้งบริษัท (ผู้ดูแลระบบอนุมัติแทนเจ้าของงานได้)','Waiting requests in the company (the administrator can approve for the owner)'],
  rqSent2:['คำขอของฉัน','My requests'],rqDone:['ที่อนุมัติไปแล้ว','Approved'],rqNone:['ไม่มีคำขอที่รออยู่','No requests waiting.'],
  rqLine:['{0} ขอ{1} งาน {2}','{0} asks to {1}: {2}'],rqAt:['ขอเมื่อ {0} · ขอถึง {1}','Asked {0} · until {1}'],rqTo:['ถึง {0}','to {0}'],
  ok:['อนุมัติ','Approve'],okToday:['อนุมัติถึงวันนี้','Approve for today'],no:['ไม่อนุมัติ','Decline'],revoke:['ยกเลิกสิทธิ์','Withdraw'],
  noT:['ไม่อนุมัติคำขอของ {0}?','Decline {0}\'s request?'],noWhy:['เหตุผล (ไม่ใส่ก็ได้)','Reason (optional)'],
  sWait:['รออนุมัติ','Waiting'],sOk:['อนุมัติแล้ว','Approved'],sNo:['ไม่อนุมัติ','Declined'],sCancel:['ยกเลิกแล้ว','Cancelled'],sRev:['ยกเลิกสิทธิ์แล้ว','Withdrawn'],sEnd:['หมดเวลาแล้ว','Ended'],
  decBy:['โดย {0}','by {0}'],
  nNew:['คำขอแก้ไขใหม่','New edit request'],nSee:['ดูคำขอ','See requests'],nOk:['{0} อนุมัติให้คุณแก้ “{1}” แล้ว','{0} approved your request to edit “{1}”'],
  nNo:['{0} ไม่อนุมัติคำขอแก้ “{1}”','{0} declined your request to edit “{1}”'],nRev:['{0} ยกเลิกสิทธิ์แก้ “{1}” แล้ว','{0} withdrew your right to edit “{1}”'],
  roBar:['ดูอย่างเดียว · งานของ {0} · แก้บนจอได้เพื่อลองดู แต่บันทึกไม่ได้','View only · {0}\'s work · you can try changes on screen, but nothing is saved'],
  roNo:['บันทึกไม่ได้ งานนี้เป็นของ {0} กด ขอแก้ไข หรือ ทำสำเนาเป็นงานของฉัน','Not saved: this is {0}\'s work. Press Ask to edit, or Make my own copy.'],
  roWait:['บันทึกไม่ได้ งานนี้เป็นของ {0} คำขอแก้ไขของคุณรออนุมัติอยู่ หรือกด ทำสำเนาเป็นงานของฉัน','Not saved: this is {0}\'s work and your request is waiting. Or press Make my own copy.'],
  roOpen:['เปิดดูงานของ {0} (ดูอย่างเดียว)','Opened {0}\'s work (view only)'],
  ev0:['โครงการใหม่','New project'],evS:['บันทึก','Saved'],evRq:['ขอแก้ไข · {0}','Asked to edit · {0}'],evOk:['อนุมัติให้ {0} แก้','Let {0} edit'],evNo:['ไม่อนุมัติคำขอของ {0}','Declined {0}\'s request'],
  fAll:['ทั้งหมด','All'],fMine:['ของฉัน','Mine'],fNew:['ใหม่','New'],fEdit:['กำลังแก้','Editing'],fNone:['ยังไม่มีอัปเดตใน 30 วันที่ผ่านมา','No updates in the last 30 days.'],
  vGrid:['แบบการ์ด','Cards'],vList:['แบบรายการ','List'],q2:['ค้นหาโครงการ ลูกค้า หรือชื่อคน','Search project, client or person'],
  inApp:['เปิดใน {0}','Open in {0}'],rooms:['ห้อง','rooms'],lv:['ชั้น','levels'],els:['ชิ้นส่วน','elements'],
  pct:['ผลงาน','progress'],val:['มูลค่างาน','contract'],bill:['เบิกแล้ว','billed'],evPm:['แก้ไขโครงการ','Updated the project'],
  nolicPm:['ใช้ได้เมื่อบริษัทใส่รหัสเปิดใช้งานแล้ว (ตั้งค่า › สิทธิ์การใช้งาน) ทุกเครื่องที่ใช้รหัสเดียวกันจะเห็นอัปเดตของกันและกัน','Works once the company has entered its licence code (Settings › Licence). Every device with the same code sees the others\' updates.']};
const t=(k,...a)=>(T[k]?T[k][EN()?1:0]:k).replace(/\{(\d)\}/g,(m,i)=>a[i]);
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const te=new TextEncoder(),td=new TextDecoder();
const sha=async s=>new Uint8Array(await crypto.subtle.digest('SHA-256',te.encode(s)));
const hex=u=>[...u].map(b=>b.toString(16).padStart(2,'0')).join('');
const b64u=u=>{let s='';for(let i=0;i<u.length;i+=0x8000)s+=String.fromCharCode.apply(null,u.subarray(i,i+0x8000));return btoa(s).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'')};
const ub64=s=>Uint8Array.from(atob(s.replace(/-/g,'+').replace(/_/g,'/')),c=>c.charCodeAt(0));
async function gzip(u){return new Uint8Array(await new Response(new Blob([u]).stream().pipeThrough(new CompressionStream('gzip'))).arrayBuffer())}
async function unzip(u){return new Uint8Array(await new Response(new Blob([u]).stream().pipeThrough(new DecompressionStream('gzip'))).arrayBuffer())}
const aes=async raw=>crypto.subtle.importKey('raw',raw,'AES-GCM',false,['encrypt','decrypt']);
// "iv.ct": AES-GCM of the JSON (or text), gzipped first when asked and the browser can (the first byte says which)
async function enc(key,x,z){const raw=te.encode(typeof x==='string'?x:JSON.stringify(x));let body=raw,f=0;if(z&&window.CompressionStream){body=await gzip(raw);f=1}
  const pt=new Uint8Array(body.length+1);pt[0]=f;pt.set(body,1);const iv=crypto.getRandomValues(new Uint8Array(12));
  return b64u(iv)+'.'+b64u(new Uint8Array(await crypto.subtle.encrypt({name:'AES-GCM',iv},key,pt)))}
async function dec(key,s,text){const [a,b]=String(s||'').split('.');const pt=new Uint8Array(await crypto.subtle.decrypt({name:'AES-GCM',iv:ub64(a)},key,ub64(b))),body=pt.subarray(1);
  const x=td.decode(pt[0]===1?await unzip(body):body);return text?x:JSON.parse(x)}
// a quick fingerprint of a project's text: has it changed since it was last sent or fetched
function hs(s){let h=0x811c9dc5,g=0x9e3779b9;for(let i=0;i<s.length;i++){const c=s.charCodeAt(i);h=Math.imul(h^c,16777619);g=Math.imul(g^c,2246822507)}return (h>>>0).toString(36)+(g>>>0).toString(36)+s.length.toString(36)}
async function rpc(fn,body,keep){let r;try{r=await fetch(SB.url+'/rest/v1/rpc/'+fn,{method:'POST',cache:'no-store',keepalive:!!keep,headers:{apikey:SB.key,'Content-Type':'application/json'},body:JSON.stringify(body)})}catch(e){return {err:'offline'}}
  if(r.ok){try{const x=await r.text();return {j:x?JSON.parse(x):null}}catch(e){return {err:'bad'}}}
  let s='';try{s=await r.text()}catch(e){}if(r.status===404||/PGRST202|does not exist|Could not find the function/i.test(s))return {err:'nosql'};
  return {err:/\bfull\b/.test(s)?'full':r.status===413||/too long|too large/i.test(s)?'big':r.status>=500?'offline':'bad'}}

// this device: its random id, the name its user typed, the company keys it knows and what it last sent or fetched of each project
function ld(){try{const o=JSON.parse(localStorage.getItem(K)||'{}');return o&&typeof o==='object'?o:{}}catch(e){return {}}}
function sv(o){try{localStorage.setItem(K,JSON.stringify(o))}catch(e){}}
let DEV='';function dev(){if(DEV)return DEV;const o=ld();if(!/^[0-9a-f]{24}$/.test(o.dev||'')){o.dev=hex(crypto.getRandomValues(new Uint8Array(12)));sv(o)}return DEV=o.dev}
const recK=p=>CFG.app+':'+p;
function rec(p){return (ld().s||{})[recK(p)]||null}
function recSet(p,r){const o=ld();o.s=o.s||{};if(r)o.s[recK(p)]=Object.assign({},r,{u:Date.now()});else delete o.s[recK(p)];
  const ks=Object.keys(o.s);if(ks.length>400)ks.sort((a,b)=>(o.s[a].u||0)-(o.s[b].u||0)).slice(0,ks.length-400).forEach(k=>delete o.s[k]);sv(o)}

// the company: from the licence code in use; its key is kept in Supabase encrypted with the code
let TM=null,TMC='';
function lic(){try{return CFG&&CFG.lic?CFG.lic():window.penumLic&&penumLic.state()||null}catch(e){return null}}          // PENUM PM checks its own code (cfg.lic)
const PMM=()=>!!CFG&&CFG.app==='pm';          // in PENUM PM: only the updates and the edit requests, no project list or lock
async function team(){const s=lic();if(!s||!s.code||s.st==='none'||s.st==='ro'||s.st==='wait')return {err:'nolic'};
  if(TM&&TMC===s.code)return TM;
  try{const c=s.code,cust=String(s.cid||licCid(s.code)||s.co||''),k=hex((await sha('penum-team-c:'+c)).slice(0,16)),ck=await aes(await sha('penum-team-ck:'+c));
    let r=await rpc('penum_team_key_get',{p_k:k});if(r.err)return r;let sec='';
    if(r.j){try{sec=await dec(ck,r.j,1)}catch(e){}}
    if(!sec){const known=(ld().co||{})[cust]||'';          // a renewed code: the company's key this device already knew
      r=await rpc('penum_team_key_add',{p_k:k,p_e:await enc(ck,known||hex(crypto.getRandomValues(new Uint8Array(16))))});if(r.err)return r;
      try{sec=await dec(ck,r.j,1)}catch(e){return {err:'bad'}}}
    const o=ld();o.co=o.co||{};o.co[cust]=sec;sv(o);
    ST.lw='';TM={t:hex((await sha('penum-team:'+sec)).slice(0,16)),key:await aes(await sha('penum-team-key:'+sec)),co:s.co||''};TMC=c;return TM}
  catch(e){return {err:'bad'}}}
const pk=async id=>hex((await sha('penum-team-p:'+CFG.app+':'+id)).slice(0,16));
async function who(T,lw){if(!lw)return '';try{return String((await dec(T.key,lw)).n||'')}catch(e){return ''}}
async function lockWho(T){if(!ST.lw||ST.lwN!==shown()){ST.lwN=shown();const m=me();ST.lw=await enc(T.key,m?{n:ST.lwN,u:m.id}:{n:ST.lwN})}return ST.lw}
// what the list shows of a project: its figures, who saved it, its owner (the first person signed in who sent it) and its last
// 20 saves (one person's saves within 30 minutes count as one), so the updates show who changed what
function metaOf(c,p){const M=me(),prev=(META.get(p)||{}).m||{},now=Date.now(),u=M?M.id:null,n=shown();
  const own=prev.own||(M?{u:M.id,n:M.n,r:roleOf(M.id)}:null);
  let h=Array.isArray(prev.h)?prev.h.slice(-20):[];if(!h.length&&prev.at)h=[{u:prev.uid==null?null:prev.uid,n:prev.by||'',at:prev.at,s:prev.sum||null}];
  const e={u,n,at:now,s:c.sum||null},last=h[h.length-1];if(!prev.at&&!h.length)e.f=1;
  if(last&&last.u===u&&last.n===n&&now-last.at<30*60e3){if(last.f)e.f=1;h[h.length-1]=e}else h.push(e);
  return {id:c.id,name:c.name||'',client:c.client||'',code:c.code||'',sum:c.sum||null,by:n,uid:u,dev:dev(),at:now,own,h:h.slice(-20)}}
async function put(T,p,c,txt,base){const d=await enc(T.key,txt,1);if(d.length>MAX)return {err:'big'};const m=metaOf(c,p);
  const r=await rpc('penum_team_put',{p_t:T.t,p_p:p,p_a:CFG.app,p_m:await enc(T.key,m),p_d:d,p_base:base||null,p_dev:dev()});if(r.err)return r;
  const o=r.j||{};if(o.at){const x=META.get(p);if(x){x.m=m;x.at=o.at}else META.set(p,{p,app:CFG.app,m,at:o.at,off:false,lk:null})}return o}
async function get(T,p){const r=await rpc('penum_team_get',{p_t:T.t,p_p:p});if(r.err||!r.j)return null;
  try{return {d:await dec(T.key,r.j.d,1),at:String(r.j.at||''),m:await dec(T.key,r.j.m)}}catch(e){return null}}

// who is working: signed in with the company's PENUM PM staff accounts (the same name and PIN, or the same fingerprint / face
// passkey made in PM on this browser), never a typed name. The staff list (names, roles, PIN hashes, passkey public keys) comes
// from PENUM PM in this browser when its licence is this company's, and goes into the company list encrypted (one row, see dirP)
// so computers without PM get it too. PENUM PM signed in here (PIN, or a cloud invite) signs MEP and BIM in as the same person.
// Like PM's PIN it puts a checked name on the work; it does not encrypt anything.
const b64j=s=>{try{return JSON.parse(td.decode(ub64(s)))}catch(e){return null}};
function licCid(code){const m=/^PNM1\.([A-Za-z0-9_-]+)\./.exec(String(code||'').replace(/\s+/g,''));const p=m&&b64j(m[1]);return p?String(p.id||'').replace(/-R\d+$/,'')||String(p.co||''):''}
const cust=()=>{const s=lic();return s&&s.code&&!['none','ro','wait'].includes(s.st)?String(s.cid||licCid(s.code)||s.co||''):''};
const jl=k=>{try{return JSON.parse(localStorage.getItem(k)||'null')}catch(e){return null}};
const keys=L=>(Array.isArray(L)?L:[]).filter(k=>k&&k.id&&k.pk).map(k=>({id:k.id,pk:k.pk,alg:k.alg||-7}));
let PMC=null,PMT=0;          // PM's data can be large: read again only after a minute or when another window changed it
function pm(){if(PMT&&Date.now()-PMT<(PMM()?3000:60000))return PMC;PMT=Date.now();try{return PMC=pm0()}catch(e){return PMC=null}}
function pm0(){const cid=cust();if(!cid)return null;let cur='';try{const l=localStorage.getItem('penum.pm.slot')||'';cur=l?'.c'+l:''}catch(e){}let best=null;
  for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i),m=/^penum\.pm\.v1((?:\.c\d+)?)$/.exec(k||'');if(!m)continue;const D=jl(k),c=D&&D.co;
    if(!c||!Array.isArray(c.staff)||licCid(c.lic)!==cid)continue;/* only this company's PM */if(!best||m[1]===cur)best={sfx:m[1],c}}
  if(!best)return null;const c=best.c,sfx=best.sfx;
  const staff=c.staff.filter(x=>x&&x.id&&x.active!==false&&String(x.name||'').trim()).map(x=>({id:String(x.id),name:String(x.name).trim().slice(0,60),role:String(x.role||'').slice(0,60),pin:x.pin||'',bio:keys(x.bio)}));
  const dir={co:String(c.name||''),admin:{pin:c.adminPin||'',bio:keys(c.adminBio)},staff};
  // who PM has signed in here: a cloud device joined by invite, else PIN sign-in while PM asks for PINs (PM's own rules)
  let who=null;const sb=jl('pmSB'+sfx)||{},nm=id=>id===''?t('admin'):(staff.find(x=>x.id===id)||{}).name||'';
  if(sb.on&&sb.cid&&sb.rt){if(sb.role==='admin')who={id:''};else if(sb.role==='staff'&&sb.who)who={id:String(sb.who)};if(who)who.k='sb:'+sfx+':'+(sb.uid||'')+':'+who.id}
  else if(c.pinOn&&c.adminPin){const a=jl('penum.pm.auth'+sfx);if(a&&typeof a.id==='string')who={id:a.id,k:'pin:'+sfx+':'+(a.at||'')+':'+a.id}}
  if(who){who.n=nm(who.id);if(!who.n)who=null}
  const bl=(jl('penum.pm.bio'+sfx)||[]).filter(x=>x&&x.c&&typeof x.w==='string');
  return {dir,who,bio:bl}}
// the staff list in use: PM's in this browser, else the company's copy this device last fetched
function dir(){const c=cust();if(!c)return null;const P=pm();if(P)return P.dir;const d=(ld().dir||{})[c];return d&&Array.isArray(d.staff)?d:null}
const creds=D=>!!D&&(!!D.admin.pin||D.admin.bio.length>0||D.staff.some(x=>x.pin||x.bio.length));
const dirP=async()=>hex((await sha('penum-team-p:dir:staff')).slice(0,16));
// the company's copy: a device with PM sends PM's list when it differs; others keep the newest. A row under 'mep' marked k:'dir'.
let DIRT=0;
async function syncDir(T,force){const c=cust();if(!c||(!force&&Date.now()-DIRT<5*60e3))return;DIRT=Date.now();PMT=0;
  const p=await dirP(),g=await get(T,p);let cloud=null;try{cloud=g&&JSON.parse(g.d)}catch(e){}const P=pm(),o=ld();
  if(P){const L=JSON.stringify(P.dir);if(!cloud||JSON.stringify(cloud)!==L){
      const r=await rpc('penum_team_put',{p_t:T.t,p_p:p,p_a:'mep',p_m:await enc(T.key,{k:'dir',name:'',by:shown(),at:Date.now()}),p_d:await enc(T.key,L,1),p_base:g?g.at:null,p_dev:dev()});
      if(r.err||!(r.j||{}).at)DIRT=Date.now()-4*60e3}          // someone else is sending it right now: again in a minute
    o.dir={[c]:P.dir}}
  else if(cloud&&Array.isArray(cloud.staff))o.dir={[c]:cloud};sv(o);chips();gate()}
// the person signed in on this device: own sign-in (PIN or scan) for this company, else PENUM PM's sign-in here
function me(){const c=cust();if(!c)return null;const D=dir(),P=pm(),o=ld(),a=o.auth;
  if(a&&a.c===c&&D){if(a.id===''&&(D.admin.pin||D.admin.bio.length))return {id:'',n:t('admin'),via:a.via};const s=D.staff.find(x=>x.id===a.id);if(s)return {id:s.id,n:s.name,via:a.via}}
  if(P&&P.who&&o.out!==P.who.k)return {id:P.who.id,n:P.who.n,via:'pm'};
  return null}
const name=()=>{const m=me();return m?m.n:''};
const shown=()=>name()||t('anon',dev().slice(0,4).toUpperCase());
const staffOf=id=>((dir()||{}).staff||[]).find(x=>x.id===id)||null;
const roleOf=id=>id===''?t('admin'):id==null?'':(staffOf(id)||{}).role||'';
const nameOf=(id,n)=>id===''?t('admin'):(staffOf(id)||{}).name||n||'?';          // today's name in PM, else the one saved
// a company with PINs set asks everyone to sign in before using the program, like PENUM PM
const gated=()=>{const D=dir();return creds(D)&&!me()};
function gate(){if(CFG&&!PMM()&&gated()&&!document.querySelector('dialog.ptm-in'))signIn(true)}
async function pinHash(salt,pin){return hex(await sha('penum-pm|'+salt+'|'+pin))}          // the same as PENUM PM (pm/src/290-folder-pin.js)
function signed(id,via){const o=ld();o.auth={c:cust(),id,via,at:Date.now()};delete o.out;sv(o);ST.lw='';chips();VIEWS.forEach(paint);if(CFG)soon();note(t('hi',name()))}
function signOut(){const o=ld(),m=me();o.auth=null;if(m&&m.via==='pm'){const P=pm();if(P&&P.who)o.out=P.who.k}sv(o);ST.lw='';chips();VIEWS.forEach(paint);gate()}
// scan: a passkey PENUM PM made on this browser (same site, so the browser offers it here too), checked against its public key
function bioRaw(d){let i=2;if(d[1]&0x80)i+=d[1]&0x7f;const o=new Uint8Array(64);
  for(let j=0;j<2;j++){i++;const n=d[i++];let v=d.slice(i,i+n);i+=n;while(v.length>32&&v[0]===0)v=v.slice(1);o.set(v,32*j+32-v.length)}return o}
const bioKey=(D,w,id)=>((w===''?D.admin.bio:((D.staff.find(x=>x.id===w)||{}).bio||[]))).find(k=>k.id===id);
function bioHere(){const D=dir(),P=pm();if(!D||!P||!window.PublicKeyCredential)return [];return P.bio.filter(x=>bioKey(D,x.w,x.c))}
async function bioCheck(k,a,ch){try{const r=a.response,cd=JSON.parse(td.decode(r.clientDataJSON)),ad=new Uint8Array(r.authenticatorData);
  if(cd.type!=='webauthn.get'||cd.challenge!==b64u(ch)||cd.origin!==location.origin)return false;
  const rp=await sha(location.hostname);if(ad.length<37||rp.some((v,i)=>v!==ad[i])||(ad[32]&5)!==5)return false;
  const h=new Uint8Array(await crypto.subtle.digest('SHA-256',r.clientDataJSON)),data=new Uint8Array(ad.length+32);data.set(ad);data.set(h,ad.length);
  const ec=k.alg!==-257,key=await crypto.subtle.importKey('spki',ub64(k.pk),ec?{name:'ECDSA',namedCurve:'P-256'}:{name:'RSASSA-PKCS1-v1_5',hash:'SHA-256'},false,['verify']),sig=new Uint8Array(r.signature);
  return await crypto.subtle.verify(ec?{name:'ECDSA',hash:'SHA-256'}:'RSASSA-PKCS1-v1_5',key,ec?bioRaw(sig):sig,data)}catch(e){return false}}
async function bioGo(L){const D=dir(),ch=crypto.getRandomValues(new Uint8Array(32));
  const a=await navigator.credentials.get({publicKey:{challenge:ch,allowCredentials:L.map(x=>({type:'public-key',id:ub64(x.c),transports:['internal','hybrid']})),userVerification:'required',timeout:60000}});
  const id=b64u(new Uint8Array(a.rawId)),hit=L.find(x=>x.c===id),k=hit&&bioKey(D,hit.w,id);return k&&await bioCheck(k,a,ch)?hit.w:null}
// the sign-in box: pick your name, type your PIN (or scan). Forced = the program waits behind it, as PENUM PM does.
let FAILS=0,WAIT=0;
function signIn(forced){const D=dir();if(!creds(D))return;const app=CFG&&CFG.app==='bim'?'PENUM BIM':'PENUM MEP',a=ld().auth||{},P=pm();
  const L=[...(D.admin.pin||D.admin.bio.length?[{id:'',name:t('admin'),role:''}]:[]),...D.staff.filter(x=>x.pin||x.bio.length)];
  const bl=bioHere(),last=a.id!=null?a.id:P&&P.who?P.who.id:ld().last!=null?ld().last:bl.length?bl[0].w:'';
  const d=document.createElement('dialog');d.className='ptm-dlg ptm-in';
  d.innerHTML=`<h3>${esc(t('inT',app))}</h3><div class="ptm-db"><p style="margin:0 0 10px">${esc(t('inP',D.co||''))}</p>
    <label class="ptm-f"><span>${esc(t('inWho'))}</span><select name="who">${L.map(x=>`<option value="${esc(x.id)}"${x.id===last?' selected':''}>${esc(x.name)}${x.role?' · '+esc(x.role):''}</option>`).join('')}</select></label>
    <label class="ptm-f"><span>PIN</span><input name="pin" type="password" inputmode="numeric" autocomplete="current-password" class="ptm-pin"></label>
    <p class="ptm-err" role="alert"></p><p class="ptm-h" style="margin:6px 0 0">${esc(t('inForgot'))}</p></div>
    <div class="ptm-df"><button type="button" class="ptm-b pri" data-in="go">${esc(t('inGo'))}</button>${bl.length?`<button type="button" class="ptm-b" data-in="bio">${esc(t('inBio'))}</button>`:''}${forced?'':`<button type="button" class="ptm-b" data-in="x">${esc(t('cancel'))}</button>`}</div>`;
  const err=m=>{d.querySelector('.ptm-err').textContent=m||''},pin=d.querySelector('[name=pin]'),sel=d.querySelector('[name=who]');
  const go=async()=>{if(Date.now()<WAIT){err(t('inWait'));return}const id=sel.value,v=pin.value.trim();if(!v){pin.focus();return}
    const want=id===''?D.admin.pin:(D.staff.find(x=>x.id===id)||{}).pin;
    if(want&&await pinHash(id||'admin',v)===want){FAILS=0;const o=ld();o.last=id;sv(o);d.close();signed(id,'pin')}
    else{FAILS++;if(FAILS>=5){FAILS=0;WAIT=Date.now()+30e3;err(t('inWait'))}else err(t('inBad'));pin.value='';pin.focus()}};
  d.addEventListener('click',async e=>{const b=e.target.closest('[data-in]');if(!b)return;const k=b.dataset.in;
    if(k==='x')d.close();else if(k==='go')go();
    else if(k==='bio'){const w0=sel.value,mine=bl.filter(x=>x.w===w0);try{const w=await bioGo(mine.length?mine:bl);if(w==null){err(t('inBioBad'));return}d.close();signed(w,'bio')}catch(e){err(t('inBioBad'))}}});
  pin.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();go()}});
  d.addEventListener('cancel',e=>{if(forced)e.preventDefault()});d.addEventListener('close',()=>{d.remove();if(forced&&gated())setTimeout(gate,0)});
  document.body.appendChild(d);d.showModal();setTimeout(()=>pin.focus(),30)}
// the header button: who is signed in, and sign out / change user; or how a company starts using sign-in
async function userBox(){PMT=0;const m=me(),D=dir();
  if(m){const k=await dlg(t('uT'),`<p>${esc(t('uIs',m.n))}</p><p class="ptm-h" style="margin:6px 0 0">${esc(t(m.via==='pm'?'viaPm':m.via==='bio'?'viaBio':'viaPin'))}</p>`,
      [...(reqsFor().length?[['rq',t('tReq')+' ('+reqsFor().length+')',1]]:[]),['sw',t('uSwitch'),!reqsFor().length],['out',t('uOut')],['',t('close')]]);
    if(k==='rq')reqBox();else if(k==='out'){signOut();if(!gated())note(t('outDone'))}else if(k==='sw'){signOut();if(!document.querySelector('dialog.ptm-in'))signIn(false)}return}
  if(creds(D)){signIn(false);return}
  await dlg(t('uT'),`<p>${esc(t(cust()?'uNoDir':'nolic'))}</p>`,[['',t('close'),1]])}
const CHIPS=[];
function chip(cls){const b=document.createElement('button');b.type='button';b.className=(cls||'')+' ptm-chip';b.dataset.noxl='';b.addEventListener('click',userBox);CHIPS.push(b);chips();return b}
function chips(){const nm=name(),n=nm&&CFG?reqsFor().length:0;for(const b of CHIPS){b.classList.toggle('none',!nm);b.innerHTML=`<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/></svg><span>${esc(nm||t('uSet'))}</span>${n?`<i class="ptm-n">${n}</i>`:''}`;
  b.title=t('uTip')+(nm?': '+nm:'')+(n?' · '+t('tReq')+' '+n:'');b.setAttribute('aria-label',b.title)}}

// the open project, every 50 s and a few seconds after a change: hold it, send it, or take the company's newer version
let CFG=null;const ST={st:'',p:'',id:'',held:'',other:null,conf:null,asked:{},busy:0,act:Date.now(),err:'',lw:'',lwN:'',shared:0,pend:0,hideBar:'',ro:0,roH:'',roSeen:{},row:null,inApply:0};
let soonT=0;function soon(){ST.act=Date.now();clearTimeout(soonT);soonT=setTimeout(tick,SOON)}
async function tick(){if(!CFG)return;if(ST.busy){ST.pend=1;return}ST.busy=1;try{await tick0()}catch(e){}finally{ST.busy=0;bar();if(ST.pend){ST.pend=0;soon()}}}
async function release(keep){const p=ST.held;ST.held='';if(!p||!TM)return;await rpc('penum_team_unlock',{p_t:TM.t,p_p:p,p_dev:dev()},keep)}
async function tick0(){
  {const T=await team();if(!T.err)await syncDir(T);gate()}          // the staff list, and sign-in when the company asks for it
  if(PMM()){await lists(1);VIEWS.forEach(paint);return}          // PM: the requests and the updates only
  const c=CFG.cur();if(!c||!c.id){await release();Object.assign(ST,{p:'',id:'',other:null,conf:null,err:'',ro:0,row:null});await lists();return}
  const T=await team();if(T.err){ST.st=T.err;return}ST.st='ok';
  const p=await pk(c.id);if(ST.p!==p){if(ST.held&&ST.held!==p)await release();ST.p=p;ST.id=c.id;ST.other=null;ST.conf=null;ST.err='';ST.ro=0;ST.row=null}
  // whose it is: someone else's that this person may not edit is only looked at here; it never holds the project or sends it
  const Lr=await lists();if(Lr.err){ST.st=Lr.err;return}const row=Lr.rows.find(x=>x.p===p)||null;ST.row=row;
  if(row&&right(row)==='view'){if(ST.held===p)await release();ST.ro=c.id;ST.conf=null;ST.other=row.lk&&!row.lk.me?{n:row.lk.n,at:row.lk.at}:null;
    const R=rec(p),txt=c.text();if(!ST.roSeen[p]){ST.roSeen[p]=1;if(R&&R.h!==hs(txt)&&CFG.keep){try{await CFG.keep(txt)}catch(e){}}}          // what this device changed before stays, as a copy of its own
    ST.roH=R?R.h:'';if(!R||Date.parse(row.at)>Date.parse(R.b))await pull(T,p,!R);return}
  ST.ro=0;
  if(Date.now()-ST.act>IDLE&&document.visibilityState!=='visible'){await release();return}          // not used for a while: others may take it
  const txt=c.text(),h=hs(txt),R=rec(p);
  const r=await rpc('penum_team_lock',{p_t:T.t,p_p:p,p_dev:dev(),p_lw:await lockWho(T),p_force:false});if(r.err){ST.st=r.err;return}const L=r.j||{};
  if(L.off){ST.held='';ST.other=null;ST.conf=null;return}
  if(L.none){const w=await put(T,p,c,txt,null);if(w.at){recSet(p,{b:w.at,h});ST.held=p;ST.err='';await rpc('penum_team_lock',{p_t:T.t,p_p:p,p_dev:dev(),p_lw:await lockWho(T),p_force:false})}else ST.err=w.err||'';return}
  if(!L.ok){ST.held='';ST.other={n:await who(T,L.lw),at:L.lat};
    if(R&&L.at!==R.b&&R.h===h&&!ST.conf)await pull(T,p,txt);          // nothing changed here: show the newest
    return}
  ST.held=p;ST.other=null;
  if(R&&L.at===R.b){ST.conf=null;if(R.h!==h){const w=await put(T,p,c,txt,R.b);if(w.at){recSet(p,{b:w.at,h});ST.err=''}else if(w.stale)soon();else ST.err=w.err||''}return}
  if(R&&R.h===h){await pull(T,p,txt);return}
  // changed here and in the company list (or never matched here): the same content needs nothing, otherwise ask once per version
  const g=await get(T,p);if(!g)return;if(hs(g.d)===h){recSet(p,{b:g.at,h});ST.conf=null;return}
  ST.conf={p,at:g.at,d:g.d,m:g.m||{},mine:txt};if(ST.asked[p]!==g.at){ST.asked[p]=g.at;ask()}}
async function pull(T,p,quiet){const g=await get(T,p);if(!g)return;ST.inApply=1;try{await CFG.apply(g.d,g.m||{})}finally{ST.inApply=0}
  const c=CFG.cur(),h=hs(c?c.text():g.d);recSet(p,{b:g.at,h});if(p===ST.p)ST.roH=h;ST.conf=null;if(!quiet)note(t('got',(g.m||{}).by||''))}
// the open project is someone else's and not approved: MEP and BIM do not save it (only what came from the company list)
function ro(){if(!ST.ro||ST.inApply||!CFG)return false;const c=CFG.cur();return !!c&&c.id===ST.ro&&hs(c.text())!==ST.roH}
function roNote(){if(Date.now()-(roNote.t||0)<15e3)return;roNote.t=Date.now();const x=ST.row,w=x&&waitOf(x),o=owner(x);
  note(t(w&&w.st==='wait'?'roWait':'roNo',o?nameOf(o.u,o.n):'?'))}
async function ask(){const C=ST.conf;if(!C)return;const by=C.m.by||'?';
  const k=await dlg(t('newT'),`<p>${esc(t('newP',by,C.m.name||'',when(C.at)))}</p>`,[['new',t('useNew',by),1],['mine',t('useMine')],['',t('later')]]);
  if(ST.conf!==C)return;
  if(k==='new'){try{if(CFG.keep)await CFG.keep(C.mine)}catch(e){}await CFG.apply(C.d,C.m);const c=CFG.cur();recSet(C.p,{b:C.at,h:hs(c?c.text():C.d)});ST.conf=null;note(t('got',by))}
  else if(k==='mine'){const T=await team(),c=CFG.cur();if(!T.err&&c){const txt=c.text(),w=await put(T,C.p,c,txt,C.at);if(w.at){recSet(C.p,{b:w.at,h:hs(txt)});ST.conf=null}else soon()}}
  bar()}

// the strip at the bottom while the open project is someone else's (view only), held by someone else, or waits for a choice
function bar(){if(PMM())return;let e=document.getElementById('ptmBar');const o=ST.other,C=ST.conf,big=ST.err==='big'||ST.err==='full',x=ST.ro&&ST.row,w=x&&waitOf(x);
  const key=x?'r'+ST.p+(w?w.st:'')+(o?o.n:''):o?'o'+o.n:C?'c'+C.at:big?ST.err:'';if(!key||ST.hideBar===key){if(e)e.hidden=true;return}
  if(!e){e=document.createElement('div');e.id='ptmBar';e.className='ptm-bar';e.setAttribute('role','status');document.body.appendChild(e)}
  const ow=x&&owner(x),on=ow?nameOf(ow.u,ow.n):'?',rl=ow?roleOf(ow.u)||ow.r||'':'';e.classList.toggle('ro',!!x);
  e.innerHTML=x?`<span>🔒 ${esc(t('roBar',on+(rl?' ('+rl+')':'')))}${w&&w.st==='wait'?` <i class="ptm-pill on">${esc(t('pWait'))} · ${esc(when(w.at))}</i>`:''}${o?' · '+esc(t('editing',o.n||'?')):''}</span>`
      +(w&&w.st==='wait'?`<button type="button" data-ptmr="unask" data-id="${esc(w.id)}">${esc(t('unask'))}</button>`:`<button type="button" class="pri" data-ptmr="ask" data-p="${x.p}">${esc(t(w&&w.st==='no'?'askAgain':'ask'))}</button>`)
      +`<button type="button" data-ptmb="copy">${esc(t('copy'))}</button><button type="button" class="x" data-ptmb="x" aria-label="${esc(t('close'))}">×</button>`
    :o?`<span>🔒 ${esc(t('bar',o.n||'?'))}</span><button type="button" data-ptmb="copy">${esc(t('copy'))}</button><button type="button" data-ptmb="take">${esc(t('take'))}</button><button type="button" class="x" data-ptmb="x" aria-label="${esc(t('close'))}">×</button>`
    :C?`<span>${esc(t('barNew',C.m.by||'?'))}</span><button type="button" data-ptmb="pick">${esc(t('pick'))}</button><button type="button" class="x" data-ptmb="x" aria-label="${esc(t('close'))}">×</button>`
    :`<span>${esc(t(ST.err))}</span><button type="button" class="x" data-ptmb="x" aria-label="${esc(t('close'))}">×</button>`;
  e.dataset.k=key;e.hidden=false}
document.addEventListener('click',async ev=>{const b=ev.target.closest&&ev.target.closest('[data-ptmb]');if(!b)return;const k=b.dataset.ptmb;
  if(k==='x'){ST.hideBar=(document.getElementById('ptmBar')||{dataset:{}}).dataset.k||'';bar();return}
  if(k==='pick'){ask();return}
  if(k==='copy'){const c=CFG.cur();if(c)await CFG.copy(c.text(),{name:c.name});soon();return}
  if(k==='take'){const o=ST.other;if(!o)return;if(await dlg(t('takeT',o.n||'?'),`<p>${esc(t('takeP',o.n||'?'))}</p>`,[['go',t('take'),1],['',t('cancel')]])!=='go')return;
    const T=await team();if(T.err)return;const r=await rpc('penum_team_lock',{p_t:T.t,p_p:ST.p,p_dev:dev(),p_lw:await lockWho(T),p_force:true});if(!r.err){ST.other=null;ST.held=ST.p}tick()}});

// the company list: in MEP's projects page and start page, and BIM's start page and menu. Once the company signs in: งานของฉัน ·
// งานของเพื่อนร่วมงาน · คำขอแก้ไข · อัปเดตของบริษัท; before that, every project in one list, and the updates.
const MEM={};          // the tab, filter and view picked last: the app draws its page again (a new element) after many changes
const VIEWS=new Set(),LS={},META=new Map(),APPS={mep:'PENUM MEP',bim:'PENUM BIM',pm:'PENUM PM'};let REQS=[];
const ping=()=>{try{dispatchEvent(new Event('penumteam'))}catch(e){}};          // the requests or the updates changed (PENUM PM's chat counts them)
const other=()=>CFG.app==='mep'?'bim':'mep';
function when(s){const d=new Date(s);if(isNaN(d))return '–';const ms=Date.now()-d,L=EN()?'en-GB':'th-TH',hm=d.toLocaleTimeString(L,{hour:'2-digit',minute:'2-digit'});
  if(ms<90e3)return t('now');if(ms<3600e3)return t('min',Math.round(ms/6e4));const a=new Date();a.setHours(0,0,0,0);if(d>=a)return t('today',hm);if(d>=a-864e5)return t('yday',hm);
  return d.toLocaleDateString(L,{day:'numeric',month:'short',year:'2-digit'})+' '+hm}
async function lwOf(T,lw){if(!lw)return '';try{return String((await dec(T.key,lw)).n||'')}catch(e){return ''}}
// one program's rows, read again after 25 s (or when asked): projects, and under 'mep' the edit requests (k:'req')
async function lst(app,force){const c=LS[app];if(!force&&c&&Date.now()-c.t<25e3)return c.r;
  const T=await team();if(T.err)return T;const r=await rpc('penum_team_list',{p_t:T.t,p_a:app});if(r.err)return r;
  const all=(await Promise.all((r.j||[]).map(async x=>{let m;try{m=await dec(T.key,x.m)}catch(e){return null}if(!m||typeof m!=='object')return null;
    return {p:x.p,app,m,at:x.at,off:!!x.off,lk:x.ld&&!m.k?{me:x.ld===dev(),n:await lwOf(T,x.lw),at:x.lat}:null}}))).filter(Boolean);
  const o={rows:all.filter(x=>!x.m.k),co:T.co};LS[app]={t:Date.now(),r:o};
  if(app===CFG.app){META.clear();o.rows.forEach(x=>META.set(x.p,x))}
  if(app==='mep'){REQS=all.filter(x=>x.m.k==='req'&&x.m.by&&x.m.p).sort((a,b)=>(b.m.at||0)-(a.m.at||0));reqSeen();
    LS.pm={t:Date.now(),r:{rows:all.filter(x=>x.m.k==='pm'&&x.m.id).map(x=>Object.assign(x,{app:'pm'})),co:T.co}};ping()}
  return o}
async function lists(force){if(PMM()){const r=await lst('mep',force);if(!r.err)await lst('bim',force);return r}const r=await lst(CFG.app,force);if(!r.err&&CFG.app!=='mep')await lst('mep',force);return r}
async function list(){return lists(1)}
const rowByP=p=>{for(const a of ['mep','bim']){const c=LS[a];const x=c&&!c.r.err&&c.r.rows.find(r=>r.p===p);if(x)return x}return null};

// whose work, and what this person may do with it: 'off' the company does not sign in (everyone edits, as before) · 'own' theirs
// · 'adm' the administrator · 'free' no owner yet (the next save makes it the saver's) · 'grant' approved · 'view' look only
const owner=x=>x&&x.m&&x.m.own&&typeof x.m.own==='object'?x.m.own:null;
const signedCo=()=>creds(dir())&&!!me();
function grantOf(x){const M=me(),o=owner(x);if(!M||!x)return null;let best=null;
  for(const r of REQS){const q=r.m;if(q.p!==x.p||q.st!=='ok'||q.by.u!==M.id||!q.dec)continue;if(q.dec.u!==''&&!(o&&q.dec.u===o.u))continue;          // only the owner or the administrator can let someone in
    if(q.dec.till&&q.dec.till<Date.now())continue;if(!best||(q.dec.at||0)>(best.dec.at||0))best=q}return best}
const waitOf=x=>{const M=me();if(!M||!x)return null;return (REQS.find(r=>r.m.p===x.p&&r.m.by.u===M.id)||{}).m||null};          // this person's latest request for it
function right(x){if(!creds(dir()))return 'off';const M=me();if(!M)return 'view';const o=owner(x);
  if(o&&o.u===M.id)return 'own';if(M.id==='')return 'adm';if(!o)return 'free';return grantOf(x)?'grant':'view'}
const mineRow=x=>{const M=me(),o=owner(x);return !!M&&(o?o.u===M.id:x.m.uid===M.id)};
const canDecide=q=>{const M=me();return !!M&&q.by.u!==M.id&&(M.id===''||!!(q.own&&q.own.u===M.id))};
const reqsFor=()=>REQS.filter(r=>r.m.st==='wait'&&canDecide(r.m));
const eod=n=>{const d=new Date();d.setDate(d.getDate()+n);d.setHours(23,59,59,999);return +d};
const day=ms=>new Date(ms).toLocaleDateString(EN()?'en-GB':'th-TH',{day:'numeric',month:'short'});
const full=s=>{const d=new Date(s);if(isNaN(d))return '–';const L=EN()?'en-GB':'th-TH';return d.toLocaleDateString(L,{day:'numeric',month:'short',year:'numeric'})+' '+d.toLocaleTimeString(L,{hour:'2-digit',minute:'2-digit'})};

// edit requests: one row each under 'mep' (penum_team_put with a placeholder project); a decision rewrites only what the list shows
async function reqNew(x){const M=me();if(!M){signIn(false);return}const o=owner(x)||{},on=nameOf(o.u,o.n),rl=roleOf(o.u)||o.r||'';
  const W=['w0','w1','w2','w3','w4'],DD=[['d0',0],['d3',3],['d7',7],['dX',-1]];
  const html=`<div class="ptm-rqh">${av(o.u,on)}<div><b>${esc(x.m.name||'–')} · ${esc(APPS[x.app]||'')}</b><small>${esc(t('ownBy',on))}${rl?' · '+esc(rl):''}</small></div></div>
    <p class="ptm-l1">${esc(t('rqWhat'))}</p><div class="ptm-chs">${W.map((k,i)=>`<label class="ptm-ch"><input type="radio" name="what" value="${k}"${i?'':' checked'}><span>${esc(t(k))}</span></label>`).join('')}</div>
    <label class="ptm-f"><span>${esc(t('rqNote'))}</span><textarea name="note" rows="3" maxlength="600"></textarea></label>
    <p class="ptm-l1">${esc(t('rqTill'))}</p><div class="ptm-chs">${DD.map(([k,n])=>`<label class="ptm-ch"><input type="radio" name="till" value="${n}"${n===3?' checked':''}><span>${esc(t(k))}</span></label>`).join('')}</div>
    <p class="ptm-h" style="margin:8px 0 0">${esc(t('rqH'))}</p>`;
  if(await dlg(t('rqT'),html,[['go',t('rqGo',on),1],['',t('cancel')]],(k,v)=>k==='go'&&!String(v.note||'').trim()?t('rqNeed'):'')!=='go')return;
  const V=dlg.v,n=+V.till,T=await team();if(T.err){note(t('rqFail'));return}
  const id=hex(crypto.getRandomValues(new Uint8Array(12))),rp=hex((await sha('penum-team-p:req:'+id)).slice(0,16));
  const m={k:'req',id,app:x.app,p:x.p,pn:x.m.name||'',own:o.u!==undefined?{u:o.u,n:o.n||''}:null,by:{u:M.id,n:M.n,r:roleOf(M.id)},what:W.includes(V.what)?V.what:'w4',
    note:String(V.note||'').trim().slice(0,600),till:n<0?0:eod(n),at:Date.now(),st:'wait'};
  const w=await rpc('penum_team_put',{p_t:T.t,p_p:rp,p_a:'mep',p_m:await enc(T.key,m),p_d:await enc(T.key,'-'),p_base:null,p_dev:dev()});
  if(w.err||!(w.j||{}).at){note(t('rqFail'));return}
  REQS.unshift({p:rp,app:'mep',m,at:w.j.at});const s=ld();s.rq=Object.assign(s.rq||{},{[id]:'wait'});sv(s);note(t('rqSent',on));after()}
async function reqSet(r,st,x){const T=await team();if(T.err){note(t('rqFail'));return}const M=me();
  const m=Object.assign({},r.m,{st});if(st==='cancel')m.end=Date.now();else m.dec=Object.assign({u:M?M.id:null,n:shown(),at:Date.now()},x||{});
  const w=await rpc('penum_team_put',{p_t:T.t,p_p:r.p,p_a:'mep',p_m:await enc(T.key,m),p_d:null,p_base:null,p_dev:dev()});if(w.err){note(t('rqFail'));return}
  r.m=m;const s=ld();s.rq=Object.assign(s.rq||{},{[m.id]:st});sv(s);after()}
function after(){ping();bar();rqCard();chips();VIEWS.forEach(paint);document.querySelectorAll('.ptm-rqbox').forEach(e=>{e.innerHTML=reqHTML(e.dataset.compact==='1')});if(CFG)soon()}
// news for this person since the last look: requests waiting for them, and answers to theirs
function reqSeen(){const M=me();if(!M)return;const o=ld(),S=o.rq||{},first=!o.rq,N={};
  for(const r of REQS){const q=r.m,was=S[q.id];N[q.id]=q.st;
    if(q.by.u===M.id&&was&&was!==q.st&&!first){const d=q.dec||{},k=q.st==='ok'?'nOk':q.st==='no'?'nNo':q.st==='revoked'?'nRev':'';if(k)note(t(k,d.n||'?',q.pn||''))}}
  o.rq=N;sv(o);rqCard();chips()}
function rqCard(){if(PMM())return;let e=document.getElementById('ptmRq');const hid=ld().rqh||{},L=reqsFor().filter(r=>!hid[r.m.id]);
  if(!L.length){if(e)e.hidden=true;return}
  if(!e){e=document.createElement('div');e.id='ptmRq';e.className='ptm-bar ptm-rq';e.setAttribute('role','status');document.body.appendChild(e)}
  const q=L[0].m;e.innerHTML=`<span><b>${esc(t('nNew'))}${L.length>1?' ('+L.length+')':''}</b><br>${esc(t('rqLine',q.by.n,t(q.what||'w4'),q.pn||''))}${q.note?`<br><i>“${esc(q.note)}”</i>`:''}</span>
    <button type="button" class="pri" data-ptmr="ok" data-id="${esc(q.id)}">${esc(t('ok'))}</button><button type="button" data-ptmr="see">${esc(t('nSee'))}</button><button type="button" class="x" data-ptmr="rqx" aria-label="${esc(t('close'))}">×</button>`;e.hidden=false}
function reqHTML(compact){const M=me();if(!M)return '';const L=reqsFor(),adm=M.id==='',now=Date.now();
  const card=q=>{const x=rowByP(q.p);return `<div class="ptm-rqc"><div class="ptm-th sm">${thumb(q.app,q.p)}<i class="ptm-app ${q.app}">${q.app.toUpperCase()}</i></div><div class="ptm-rqm">
    <p><b>${esc(nameOf(q.by.u,q.by.n))}</b> <small>${esc(roleOf(q.by.u)||q.by.r||'')}</small> ${esc(t('rqLine','',t(q.what||'w4'),'')).trim()} <b>${esc(q.pn||(x&&x.m.name)||'–')}</b>${adm&&q.own&&q.own.u!==''?` <small>(${esc(t('ownBy',nameOf(q.own.u,q.own.n)))})</small>`:''}</p>
    ${q.note?`<blockquote>“${esc(q.note)}”</blockquote>`:''}<small>${esc(t('rqAt',full(q.at),q.till?day(q.till):t('dX')))}</small></div>
    <div class="ptm-rqa"><button type="button" class="btn sm primary" data-ptmr="ok" data-id="${esc(q.id)}">✓ ${esc(t('ok'))}</button>${q.till&&q.till>eod(0)?`<button type="button" class="btn sm" data-ptmr="today" data-id="${esc(q.id)}">${esc(t('okToday'))}</button>`:''}<button type="button" class="btn sm ptm-bad" data-ptmr="no" data-id="${esc(q.id)}">✕ ${esc(t('no'))}</button></div></div>`};
  const okL=REQS.filter(r=>r.m.st==='ok'&&r.m.dec&&(!r.m.dec.till||r.m.dec.till>now)&&(adm||(r.m.own&&r.m.own.u===M.id))).map(r=>r.m);
  const mine=REQS.filter(r=>r.m.by.u===M.id).map(r=>r.m).slice(0,compact?3:10);
  const st=q=>q.st==='ok'&&q.dec&&q.dec.till&&q.dec.till<now?['sEnd','']:({wait:['sWait','on'],ok:['sOk','ok'],no:['sNo','no'],cancel:['sCancel',''],revoked:['sRev','']})[q.st]||['sWait','on'];
  return `<h4>${esc(t(adm?'rqAdm':'rqMine'))}</h4>`+(L.length?L.map(r=>card(r.m)).join(''):`<p class="ptm-h">${esc(t('rqNone'))}</p>`)
    +(okL.length&&!compact?`<h4>${esc(t('rqDone'))}</h4><div class="ptm-tb">${okL.map(q=>`<div class="ptm-tr"><b>${esc(q.pn||'–')}</b><i class="ptm-app ${q.app}">${q.app.toUpperCase()}</i><span>${av(q.by.u,nameOf(q.by.u,q.by.n))} ${esc(nameOf(q.by.u,q.by.n))}</span><small>${esc(q.dec.till?t('pTill',day(q.dec.till)):t('pEver'))}</small><span><button type="button" class="btn sm ptm-bad" data-ptmr="revoke" data-id="${esc(q.id)}">${esc(t('revoke'))}</button></span></div>`).join('')}</div>`:'')
    +(mine.length?`<h4>${esc(t('rqSent2'))}</h4><div class="ptm-tb">${mine.map(q=>{const [k,c]=st(q);return `<div class="ptm-tr"><b>${esc(q.pn||'–')}</b><i class="ptm-app ${q.app}">${q.app.toUpperCase()}</i><span>${esc(t(q.what||'w4'))} · ${esc(t('rqTo',q.own?nameOf(q.own.u,q.own.n):'?'))}</span><small>${esc(full(q.at))}${q.dec&&q.st!=='cancel'?' · '+esc(t('decBy',q.dec.n||'?')):''}${q.st==='no'&&q.dec&&q.dec.why?' · “'+esc(q.dec.why)+'”':''}</small><span><i class="ptm-pill ${c}">${esc(t(k))}</i>${q.st==='wait'?` <button type="button" class="btn sm" data-ptmr="unask" data-id="${esc(q.id)}">${esc(t('unask'))}</button>`:''}</span></div>`}).join('')}</div>`:'')}
function reqBox(){dlg(t('tReq'),`<div class="ptm ptm-rqbox" data-compact="0">${reqHTML(0)}</div>`,[['',t('close'),1]],null,'wide')}
document.addEventListener('click',async ev=>{const b=ev.target.closest&&ev.target.closest('[data-ptmr]');if(!b)return;const k=b.dataset.ptmr;
  if(k==='see'){reqBox();return}
  if(k==='rqx'){const o=ld();o.rqh=o.rqh||{};reqsFor().forEach(r=>{o.rqh[r.m.id]=1});sv(o);rqCard();return}
  if(k==='ask'){const x=rowByP(b.dataset.p)||(ST.row&&ST.row.p===b.dataset.p?ST.row:null);if(x)await reqNew(x);return}
  const r=REQS.find(r=>r.m.id===b.dataset.id);if(!r)return;b.disabled=true;
  try{if(k==='unask')await reqSet(r,'cancel');
    else if(k==='ok')await reqSet(r,'ok',{till:r.m.till||0});
    else if(k==='today')await reqSet(r,'ok',{till:eod(0)});
    else if(k==='revoke')await reqSet(r,'revoked');
    else if(k==='no'){if(await dlg(t('noT',nameOf(r.m.by.u,r.m.by.n)),`<label class="ptm-f"><span>${esc(t('noWhy'))}</span><textarea name="why" rows="3" maxlength="300"></textarea></label>`,[['go',t('no'),1],['',t('cancel')]])!=='go')return;
      await reqSet(r,'no',{why:String(dlg.v.why||'').trim()})}}finally{b.disabled=false}});

// pictures: no real thumbnails yet, so a drawing-like tile per program (the same one for the same project)
function thumb(app,p){let s=parseInt(String(p||'1').slice(0,8),16)||7;const R=()=>(s=(Math.imul(s,1103515245)+12345)>>>0)/4294967296,n=v=>Math.round(v);
  if(app==='pm'){let g='',x=14;for(let i=0;i<6;i++){const w=22+n(R()*40),d=n(R()*w);g+=`<rect x="${x}" y="${12+i*12}" width="${w}" height="7" rx="2" fill="#CDE7E3"/><rect x="${x}" y="${12+i*12}" width="${d}" height="7" rx="2" fill="#2F7F88"/>`;x=Math.min(118,x+n(R()*22)+6)}
    return `<svg viewBox="0 0 160 90" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><rect width="160" height="90" fill="#F1F6F5"/><path d="M40 4v82M80 4v82M120 4v82" stroke="#DCE6E4"/><path d="M${n(30+R()*90)} 4v82" stroke="#E5484D" stroke-dasharray="3 3"/>${g}</svg>`}
  if(app==='bim'){const h=28+n(R()*26),w=34+n(R()*18),x=80-w/2;return `<svg viewBox="0 0 160 90" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><rect width="160" height="90" fill="#D9E3EF"/><rect y="56" width="160" height="34" fill="#EEF2F7"/>
    <polygon points="${x},${66-h} ${80},${60-h} ${x+w},${66-h} ${80},${72-h}" fill="#C5CFDC"/><polygon points="${x},${66-h} ${80},${72-h} 80,72 ${x},66" fill="#9AA8BA"/><polygon points="${80},${72-h} ${x+w},${66-h} ${x+w},66 80,72" fill="#7E8DA2"/></svg>`}
  const C=['#22D3EE','#F472B6','#FACC15','#4ADE80','#F87171','#A78BFA','#FB923C','#E5E7EB'],c=()=>C[n(R()*7.99)];let g='';
  for(let i=0;i<6;i++)g+=`<rect x="${n(R()*120)}" y="${n(R()*62)}" width="${16+n(R()*40)}" height="${10+n(R()*24)}" fill="none" stroke="${c()}" stroke-width="1.2"/>`;
  for(let i=0;i<9;i++){const x=n(R()*160),y=n(R()*90);g+=`<line x1="${x}" y1="${y}" x2="${x+n(R()*40-20)}" y2="${y+n(R()*16-8)}" stroke="${c()}" stroke-width="1"/>`}
  for(let i=0;i<3;i++)g+=`<circle cx="${n(R()*160)}" cy="${n(R()*90)}" r="${3+n(R()*4)}" fill="none" stroke="${c()}" stroke-width="1"/>`;
  return `<svg viewBox="0 0 160 90" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><rect width="160" height="90" fill="#0E1621"/>${g}</svg>`}
const AVC=['#0E7490','#C2410C','#7C3AED','#1D4ED8','#BE185D','#15803D','#B45309'];
function av(u,n){const s=String(n||'?').trim(),i=(s.match(/^.[ัิ-ฺ็-๎]*/)||['?'])[0];let h=0;for(const ch of String(u==null?s:u))h=(h*31+ch.charCodeAt(0))>>>0;
  return `<i class="ptm-av" style="background:${AVC[h%AVC.length]}" aria-hidden="true">${esc(i)}</i>`}
// what changed between two saves, from the figures each one kept (MEP: rooms, TR, BOQ · BIM: levels, elements)
const FIG=[['rooms','rooms',0],['tr','TR',1],['boq','BOQ ฿',0],['lv','lv',0],['els','els',0],['pct','pct',1],['val','val',0],['bill','bill',0]];          // PM: progress %, contract and billed ฿
const fnum=(v,d)=>Number(v).toLocaleString(EN()?'en-US':'th-TH',{maximumFractionDigits:d,minimumFractionDigits:d});
function figs(s){s=s||{};return FIG.filter(([k])=>s[k]).map(([k,l,d])=>l==='TR'?fnum(s[k],1)+' TR':l==='BOQ ฿'?'BOQ ฿'+fnum(s[k],0):l==='pct'?t(l)+' '+fnum(s[k],1)+'%':l==='val'||l==='bill'?t(l)+' ฿'+fnum(s[k],0):fnum(s[k],0)+' '+t(l)).join(' · ')}
function diff(a,b){a=a||{};b=b||{};return FIG.filter(([k])=>(+b[k]||0)!==(+a[k]||0)).map(([k,l,d])=>{const v=(+b[k]||0)-(+a[k]||0),c=v>0?'up':'dn',x=(v>0?'+':'−')+fnum(Math.abs(v),d);
  return l==='TR'?`TR <b class="${c}">${x}</b>`:l==='pct'?`${esc(t(l))} <b class="${c}">${x}%</b>`:l==='val'||l==='bill'?`${esc(t(l))} <b class="${c}">${x.replace(/^([+−])/,'$1฿')}</b>`:l==='BOQ ฿'?`BOQ <b class="${c}">${x.replace(/^([+−])/,'$1฿')}</b>`:`${esc(t(l))} <b class="${c}">${x}</b>`}).join(' · ')}
// the updates: every save the projects kept (30 days), and edit requests and answers, newest first
function feedList(){const out=[],cut=Date.now()-30*864e5;
  for(const app of ['mep','bim','pm']){const c=LS[app];if(!c||c.r.err)continue;
    for(const x of c.r.rows){if(x.off)continue;const h=Array.isArray(x.m.h)&&x.m.h.length?x.m.h:[{u:x.m.uid,n:x.m.by,at:Date.parse(x.at)||x.m.at,s:x.m.sum}];
      h.forEach((e,i)=>{if(e&&e.at>=cut)out.push({k:'s',app,x,u:e.u,n:e.n,at:e.at,s:e.s,prev:i?h[i-1].s:null,first:!!e.f})})}}
  for(const r of REQS){const q=r.m,x=rowByP(q.p);if(!x)continue;
    if(q.at>=cut)out.push({k:'rq',app:q.app,x,u:q.by.u,n:q.by.n,at:q.at,q});
    if(q.dec&&q.dec.at>=cut&&(q.st==='ok'||q.st==='no'))out.push({k:q.st,app:q.app,x,u:q.dec.u,n:q.dec.n,at:q.dec.at,q})}
  return out.sort((a,b)=>b.at-a.at).slice(0,150)}
const fsK=()=>'fs:'+cust();
const feedSeen=()=>+(ld()[fsK()]||0);
function feedNew(){const M=me(),s=feedSeen();return feedList().filter(e=>e.at>s&&!(M&&e.u===M.id)).length}

// PM draws its page often: there the list is read again only after 25 s
async function render(el,opt){if(!el||!CFG)return;opt=opt||{};VIEWS.add(el);el.classList.add('ptm');el._ptm=opt;
  if(!el._ptmOn){el._ptmOn=1;Object.assign(el,MEM[opt.compact?'c':'f']||{});if(opt.tab){el._tab=opt.tab;keep(el)}el.addEventListener('click',ev=>click(el,ev));el.addEventListener('input',ev=>{if(ev.target.dataset.ptmq!=null){el._q=ev.target.value;el._qf=1;paint(el)}});
    el.addEventListener('change',ev=>{if(ev.target.dataset.ptmw!=null){el._w=ev.target.value;paint(el)}})}
  if(!el._d)el.innerHTML=`<p class="ptm-h">${esc(t('load'))}</p>`;
  const r=await (PMM()?lists():list());el._d=r;paint(el);if(!r.err){share(r.rows);lst(other()).then(()=>VIEWS.forEach(paint))}}
function paint(el){const r=el._d,opt=el._ptm||{};if(!r)return;
  const head=`<div class="ptm-me"><span>${esc(t('you'))}: <b>${esc(shown())}</b></span><button type="button" class="btn sm" data-ptm="name">${esc(t(name()?'chg':'uSet'))}</button>${name()?'':`<small class="ptm-warn">${esc(t(creds(dir())?'needName':'uNoDir'))}</small>`}</div>`;
  if(r.err){el.innerHTML=(opt.compact||PMM()?'':head)+`<p class="ptm-note">${esc(t(r.err==='nolic'&&PMM()?'nolicPm':r.err==='nolic'||r.err==='offline'||r.err==='nosql'?r.err:'bad'))}</p>${r.err==='nolic'?'':`<button type="button" class="btn sm" data-ptm="retry">${esc(t('retry'))}</button>`}`;return}
  const sc=signedCo(),nReq=sc?reqsFor().length:0,nNew=feedNew();
  const tabs=PMM()?(sc?['feed','req']:['feed']):sc?(opt.compact?['mine',...(nReq?['req']:[]),'feed']:['mine','mates','req','feed']):['all','feed'];
  const tab=tabs.includes(el._tab)?el._tab:el._tab=tabs[0];
  const tb=`<div class="ptm-tabs" role="tablist">${tabs.map(k=>`<button type="button" role="tab" aria-selected="${k===tab}" class="ptm-tab${k===tab?' on':''}" data-ptm="tab" data-k="${k}">${esc(t({mine:'tMine',mates:'tMates',req:'tReq',feed:'tFeed',all:'tAll'}[k]))}${k==='req'&&nReq?`<i class="ptm-n">${nReq}</i>`:''}${k==='feed'&&nNew&&tab!=='feed'?`<i class="ptm-n">${nNew}</i>`:''}</button>`).join('')}</div>`;
  const live=r.rows.filter(x=>!x.off);
  const body=tab==='all'?vAll(el,r,opt):tab==='mine'?vMine(el,live,opt):tab==='mates'?vMates(el,live,opt):tab==='req'?`<div class="ptm-rqbox" data-compact="${opt.compact?1:0}">${reqHTML(opt.compact)}</div>`:vFeed(el,opt);
  el.innerHTML=(opt.compact||PMM()?'':head)+tb+(ST.shared?`<p class="ptm-h">${esc(t('sharing',ST.shared))}</p>`:'')+body;
  const i=el.querySelector('[data-ptmq]');if(i&&el._qf){i.focus();i.setSelectionRange(i.value.length,i.value.length)}el._qf=0;
  if(opt.count){const n=document.getElementById(opt.count);if(n)n.textContent=t('cnt',live.length)}}
const qOk=(el,s)=>{const q=String(el._q||'').trim().toLowerCase().split(/\s+/).filter(Boolean),L=s.join(' ').toLowerCase();return q.every(w=>L.includes(w))};
const srch=(el,ph)=>`<input type="search" class="ptm-q" data-ptmq placeholder="${esc(t(ph||'q'))}" value="${esc(el._q||'')}">`;
// before the company signs in: every project, as before
function vAll(el,r,opt){const live=r.rows.filter(x=>!x.off),off=r.rows.filter(x=>x.off);
  let L=live.filter(x=>qOk(el,[x.m.name,x.m.client,x.m.code,x.m.by,x.lk&&x.lk.n]));
  L.sort((a,b)=>(b.lk&&!b.lk.me?1:0)-(a.lk&&!a.lk.me?1:0)||String(b.at).localeCompare(String(a.at)));if(opt.compact)L=L.slice(0,opt.max||6);
  const row=x=>{const m=x.m,here=CFG.has(m.id),lk=x.lk,s=CFG.sumTxt?CFG.sumTxt(m.sum||{}):'';
    return `<div class="ptm-r${lk&&!lk.me?' lk':''}"><div class="ptm-rn"><b>${esc(m.name||'–')}</b>${lk?`<span class="ptm-pill ${lk.me?'me':'on'}">● ${esc(lk.me?t('editMe'):t('editing',lk.n||'?'))}</span>`:''}${here?`<span class="ptm-pill">${esc(t('here'))}</span>`:''}</div>
      <small>${esc([m.client,m.code].filter(Boolean).join(' · '))}${m.client||m.code?' · ':''}${esc(t('by',m.by||'?'))} · ${esc(when(x.at))}${s?' · '+esc(s):''}</small>
      <div class="ptm-ra"><button type="button" class="btn sm primary" data-ptm="open" data-p="${x.p}">${esc(lk&&!lk.me?t('look'):t('open'))}</button>${opt.compact?'':`<button type="button" class="btn sm" data-ptm="copy" data-p="${x.p}">${esc(t('copy'))}</button><button type="button" class="btn sm ghost" data-ptm="hide" data-p="${x.p}">${esc(t('hide'))}</button>`}</div></div>`};
  return (opt.compact||live.length<6?'':srch(el))+(L.length?`<div class="ptm-l">${L.map(row).join('')}</div>`:`<p class="ptm-h">${esc(live.length?'–':t('none'))}</p>`)
    +(!opt.compact&&off.length?`<details class="ptm-off"><summary>${esc(t('hidden',off.length))}</summary>${off.map(x=>`<div class="ptm-r"><div class="ptm-rn"><b>${esc(x.m.name||'–')}</b></div><div class="ptm-ra"><button type="button" class="btn sm" data-ptm="show" data-p="${x.p}">${esc(t('show'))}</button></div></div>`).join('')}</details>`:'')}
// a project as a card, like AutoCAD's Recent page: a picture, the name, when, the figures
function card(x,o){o=o||{};const m=x.m,lk=x.lk,on=lk&&!lk.me;
  const pill=o.pill!=null?o.pill:(lk?`<i class="ptm-pill ${lk.me?'me':'on'}">● ${esc(lk.me?t('editMe'):t('editing',lk.n||'?'))}</i>`:'');
  const act=o.act!=null?o.act:`<button type="button" class="btn sm primary" data-ptm="open" data-p="${x.p}">${esc(on?t('look'):t('open'))}</button>`;
  return `<div class="ptm-c${on?' lk':''}${o.cls?' '+o.cls:''}"><button type="button" class="ptm-th" data-ptm="${o.go||'open'}" data-p="${x.p}" data-app="${x.app}" aria-label="${esc(m.name||'')}">${thumb(x.app,x.p)}<i class="ptm-app ${x.app}">${x.app.toUpperCase()}</i>${pill?`<span class="ptm-tp">${pill}</span>`:''}</button>
    <div class="ptm-cb"><b>${esc(o.title||m.name||'–')}</b><small>${esc(o.when||full(x.at))}</small>${o.who||''}<small class="ptm-fg">${o.line!=null?o.line:esc(figs(m.sum)||[m.client,m.code].filter(Boolean).join(' · '))}</small></div>${act?`<div class="ptm-ra">${act}</div>`:''}</div>`}
function vMine(el,live,opt){let L=live.filter(mineRow).filter(x=>qOk(el,[x.m.name,x.m.client,x.m.code]));L.sort((a,b)=>String(b.at).localeCompare(String(a.at)));const all=L.length;
  if(opt.compact)L=L.slice(0,opt.max||6);
  const G=live.filter(x=>right(x)==='grant');
  const extra=x=>opt.compact?'':`<button type="button" class="btn sm" data-ptm="copy" data-p="${x.p}">${esc(t('copy'))}</button><button type="button" class="btn sm ghost" data-ptm="hide" data-p="${x.p}">${esc(t('hide'))}</button>`;
  return (opt.compact||all<6?'':srch(el))+(L.length?`<div class="ptm-g">${L.map(x=>card(x,{who:x.m.by&&x.m.by!==shown()?`<small>${esc(t('by',x.m.by))}</small>`:'',act:`<button type="button" class="btn sm primary" data-ptm="open" data-p="${x.p}">${esc(x.lk&&!x.lk.me?t('look'):t('open'))}</button>`+extra(x)})).join('')}</div>`:`<p class="ptm-h">${esc(t('noMine'))}</p>`)
    +(G.length?`<h4>${esc(t('granted'))}</h4><div class="ptm-tb mates">${G.map(x=>mateRow(x)).join('')}</div>`:'')}
// colleagues' work: whose it is, the job they hold, when it was saved, and what this person may do
function mateRow(x){const m=x.m,o=owner(x),on=o?nameOf(o.u,o.n):(m.by||'?'),rl=o?roleOf(o.u)||o.r||'':'',rt=right(x),w=waitOf(x),g=rt==='grant'&&grantOf(x);
  const pill=rt==='adm'?['pAdm','ok']:rt==='free'?['pFree','ok']:g?[g.dec.till?'pTill':'pEver','ok']:w&&w.st==='wait'?['pWait','on']:w&&w.st==='no'?['pNo','no']:['pView',''];
  const look=`<button type="button" class="btn sm" data-ptm="open" data-p="${x.p}">${esc(t('look'))}</button>`;
  const act=rt==='view'?look+(w&&w.st==='wait'?`<button type="button" class="btn sm" data-ptmr="unask" data-id="${esc(w.id)}">${esc(t('unask'))}</button>`:`<button type="button" class="btn sm primary" data-ptmr="ask" data-p="${x.p}">${esc(t(w&&w.st==='no'?'askAgain':'ask'))}</button>`)
    :`<button type="button" class="btn sm primary" data-ptm="open" data-p="${x.p}">${esc(t('openEd'))}</button>`;
  const lk=x.lk&&!x.lk.me?`<br><small class="ptm-lk">● ${esc(t('editing',x.lk.n||'?'))}</small>`:'';
  return `<div class="ptm-tr"><button type="button" class="ptm-th sm" data-ptm="open" data-p="${x.p}" aria-label="${esc(m.name||'')}">${thumb(x.app,x.p)}</button><span><b>${esc(m.name||'–')}</b>${m.client?`<br><small>${esc(m.client)}</small>`:''}${lk}</span><i class="ptm-app ${x.app}">${x.app.toUpperCase()}</i>
    <span class="ptm-who">${av(o?o.u:m.uid,on)}<span>${esc(on)}${rl?`<br><small>${esc(rl)}</small>`:''}</span></span><small>${esc(full(x.at))}${m.by&&m.by!==on?`<br>${esc(t('by',m.by))}`:''}</small>
    <span><i class="ptm-pill ${pill[1]}">${esc(t(pill[0],g&&g.dec.till?day(g.dec.till):''))}</i></span><span class="ptm-ra">${act}</span></div>`}
function vMates(el,live,opt){const M=me();let L=live.filter(x=>!mineRow(x));const ppl=[...new Map(L.map(x=>{const o=owner(x);return o?[String(o.u),nameOf(o.u,o.n)]:null}).filter(Boolean)).entries()];
  const w=el._w||'';L=L.filter(x=>{const o=owner(x);return (!w||(o&&String(o.u)===w))&&qOk(el,[x.m.name,x.m.client,x.m.code,o&&nameOf(o.u,o.n),o&&(roleOf(o.u)||o.r),x.m.by])});
  L.sort((a,b)=>String(b.at).localeCompare(String(a.at)));
  return `<div class="ptm-fl"><select class="ptm-q ptm-sel" data-ptmw aria-label="${esc(t('cOwn'))}"><option value="">${esc(t('anyone'))}</option>${ppl.map(([u,n])=>`<option value="${esc(u)}"${u===w?' selected':''}>${esc(n)}</option>`).join('')}</select>${srch(el,'q2')}</div>`
    +(L.length?`<div class="ptm-tb mates"><div class="ptm-tr ptm-hd"><span></span><span>${esc(t('cProj'))}</span><span>${esc(t('cApp'))}</span><span>${esc(t('cOwn'))}</span><span>${esc(t('cLast'))}</span><span>${esc(t('cMay'))}</span><span></span></div>${L.map(mateRow).join('')}</div>`:`<p class="ptm-h">${esc(t('noMates'))}</p>`)
    +(M&&M.id!==''?`<p class="ptm-h">${esc(t('mateNote'))}</p>`:'')}
function vFeed(el,opt){const M=me(),f=el._ff||'all',grid=el._fv!=='list',mark=el._fm!=null?el._fm:feedSeen();
  let L=feedList().filter(e=>(f==='all'||(f==='mine'?M&&e.u===M.id:e.app===f))&&qOk(el,[e.x.m.name,e.x.m.client,e.n]));if(opt.compact)L=L.slice(0,opt.max||6);
  const line=e=>e.k==='rq'?esc(t('evRq',t(e.q.what||'w4'))):e.k==='ok'?esc(t('evOk',nameOf(e.q.by.u,e.q.by.n)))+(e.q.dec.till?' · '+esc(t('pTill',day(e.q.dec.till))):''):e.k==='no'?esc(t('evNo',nameOf(e.q.by.u,e.q.by.n)))
    :e.first?esc(t('ev0'))+(figs(e.s)?' · '+esc(figs(e.s)):''):(e.prev&&diff(e.prev,e.s)||esc(t(e.app==='pm'?'evPm':'evS'))+(figs(e.s)?' · '+esc(figs(e.s)):''));
  const isNew=e=>e.at>mark&&!(M&&e.u===M.id);
  const go=e=>e.app===CFG.app?'open':'app';
  const items=L.map(e=>{const nm=nameOf(e.u,e.n),who=`<span class="ptm-who">${av(e.u,nm)}<span>${esc(nm)}</span></span>`,lk=e.x.lk&&!e.x.lk.me&&e.k==='s'&&e===L.find(z=>z.x===e.x);
    const pill=isNew(e)?`<i class="ptm-pill nw">${esc(t('fNew'))}</i>`:lk?`<i class="ptm-pill on">● ${esc(t('fEdit'))}</i>`:'';
    return grid?card(e.x,{when:full(e.at),who,line:line(e),pill,act:'',go:go(e),cls:isNew(e)?'nw':''})
      :`<div class="ptm-tr feed${isNew(e)?' nw':''}"><button type="button" class="ptm-th sm" data-ptm="${go(e)}" data-p="${e.x.p}" data-app="${e.app}" aria-label="${esc(e.x.m.name||'')}">${thumb(e.app,e.x.p)}</button><span><b>${esc(e.x.m.name||'–')}</b> ${pill}</span><i class="ptm-app ${e.app}">${e.app.toUpperCase()}</i>${who}<small>${esc(full(e.at))}</small><small class="ptm-fg">${line(e)}</small></div>`});
  const chip=(k,l)=>`<button type="button" class="ptm-fc${f===k?' on':''}" data-ptm="ff" data-k="${k}">${esc(l)}</button>`;
  return `<div class="ptm-fl">${opt.compact?'':`<span class="ptm-vw"><button type="button" class="ptm-fc${grid?'':' on'}" data-ptm="fv" data-k="list" aria-label="${esc(t('vList'))}" title="${esc(t('vList'))}">☰</button><button type="button" class="ptm-fc${grid?' on':''}" data-ptm="fv" data-k="grid" aria-label="${esc(t('vGrid'))}" title="${esc(t('vGrid'))}">▦</button></span>`}
    ${chip('all',t('fAll'))}${chip('mep','MEP')}${chip('bim','BIM')}${chip('pm','PM')}${M?chip('mine',t('fMine')):''}${opt.compact?'':srch(el,'q2')}</div>`
    +(items.length?(grid?`<div class="ptm-g">${items.join('')}</div>`:`<div class="ptm-tb">${items.join('')}</div>`):`<p class="ptm-h">${esc(t('fNone'))}</p>`)}
function refresh(){for(const el of [...VIEWS]){if(!el.isConnected){VIEWS.delete(el);continue}render(el,el._ptm)}}
async function click(el,ev){const b=ev.target.closest('[data-ptm]');if(!b)return;const k=b.dataset.ptm;
  if(k==='tab'){el._tab=b.dataset.k;el._q='';keep(el);if(el._tab==='feed'){el._fm=feedSeen();const o=ld();o[fsK()]=Date.now();sv(o)}paint(el);VIEWS.forEach(v=>{if(v!==el)paint(v)});return}
  if(k==='ff'){el._ff=b.dataset.k;keep(el);paint(el);return}
  if(k==='fv'){el._fv=b.dataset.k;keep(el);paint(el);return}
  if(k==='retry'){TM=null;el._d=null;render(el,el._ptm);return}
  if(k==='name'){userBox();return}
  if(k==='app'){const a=['mep','bim','pm'].includes(b.dataset.app)?b.dataset.app:'mep';if(PMM())window.open('../'+a+'/','penum-'+a);else location.href='../'+a+'/';return}
  if(k==='open'&&b.dataset.app==='pm'){const x=((LS.pm||{}).r||{rows:[]}).rows.find(r=>r.p===b.dataset.p);if(x&&CFG.openPm)CFG.openPm(x.m.id);return}
  const x=((el._d||{}).rows||[]).find(r=>r.p===b.dataset.p);
  if(!x)return;const T=await team();if(T.err)return;const rt=right(x);
  if(k==='hide'){if(rt!=='off'&&rt!=='own'&&rt!=='adm'&&rt!=='free')return;if(await dlg(t('hideT',x.m.name||''),`<p>${esc(t('hideP'))}</p>`,[['go',t('hide'),1],['',t('cancel')]])!=='go')return;
    await rpc('penum_team_off',{p_t:T.t,p_p:x.p,p_off:true});if(x.p===ST.p){ST.held='';ST.other=null}refresh();return}
  if(k==='show'){await rpc('penum_team_off',{p_t:T.t,p_p:x.p,p_off:false});refresh();soon();return}
  if(k==='copy'){const g=await get(T,x.p);if(!g){note(t('fail'));return}await CFG.copy(g.d,x.m);soon();refresh();return}
  if(k==='open'){const view=rt==='view';
    if(!view&&x.lk&&!x.lk.me){const a=await dlg(t('lockT',x.lk.n||'?'),`<p>${esc(t('lockP',x.lk.n||'?',x.m.name||''))}</p>`,[['look',t('look'),1],['copy',t('copy')],['',t('cancel')]]);
      if(!a)return;if(a==='copy'){const g=await get(T,x.p);if(!g){note(t('fail'));return}await CFG.copy(g.d,x.m);soon();refresh();return}}
    if(opt0(el).close)opt0(el).close();
    const done=()=>{if(view){const o=owner(x);setTimeout(()=>note(t('roOpen',o?nameOf(o.u,o.n):'?')),300)}};
    if(CFG.has(x.m.id)){ST.inApply=1;try{await CFG.openLocal(x.m.id)}finally{ST.inApply=0}done();soon();return}
    const g=await get(T,x.p);if(!g){note(t('fail'));return}
    ST.inApply=1;let ok=false;try{ok=await CFG.open(g.d,x.m)}finally{ST.inApply=0}
    if(ok){const c=CFG.cur();recSet(x.p,{b:g.at,h:hs(c?c.text():g.d)});ST.act=Date.now();done();tick()}}}
// PENUM PM: a project changed here goes into the updates (a row under 'mep' marked k:'pm': who, when, its figures; PM's data
// itself stays in PM). c = {id, name, client, code, sum}. The row's last saves are read first, so two computers add to the same list.
async function pmPut(c){if(!PMM()||!c||!c.id)return {err:'bad'};const T=await team();if(T.err)return T;
  const p=await pk(c.id),g=await get(T,p);META.set(p,{p,app:'pm',m:g&&g.m||{},at:g?g.at:''});const m=Object.assign(metaOf(c,p),{k:'pm'});
  if(!c.fresh&&!(g&&g.m&&g.m.at)){const l=m.h[m.h.length-1];if(l)delete l.f}          // a project PM had before: its first update is not "new"
  const em=await enc(T.key,m);
  const go=async d=>rpc('penum_team_put',{p_t:T.t,p_p:p,p_a:'mep',p_m:em,p_d:d,p_base:null,p_dev:dev()});
  let r=await go(null);if(!r.err&&(r.j||{}).none)r=await go(await enc(T.key,'-'));if(r.err)return r;
  const L=LS.pm&&LS.pm.r.rows,at=new Date().toISOString();if(L){const x=L.find(z=>z.p===p);if(x){x.m=m;x.at=at}else L.unshift({p,app:'pm',m,at,off:false,lk:null})}
  VIEWS.forEach(paint);ping();return r.j||{}}
// PENUM PM's chat: the edit requests waiting for this person, and the answer given there
const reqs=()=>reqsFor().map(r=>r.m);
async function decide(id,ok,why){const r=REQS.find(z=>z.m.id===id);if(!r||r.m.st!=='wait'||!canDecide(r.m))return false;
  await reqSet(r,ok?'ok':'no',ok?{till:r.m.till||0}:{why:String(why||'').slice(0,300)});return r.m.st===(ok?'ok':'no')}
const opt0=el=>el._ptm||{};
const keep=el=>{MEM[opt0(el).compact?'c':'f']={_tab:el._tab,_ff:el._ff,_fv:el._fv,_fm:el._fm}};
// MEP: the other projects in this device's list go up once (each project goes up only when the company list does not have it yet)
let SHARED=0;
async function share(rows){if(SHARED||!CFG.locals)return;SHARED=1;const T=await team();if(T.err){SHARED=0;return}
  const have=new Set(rows.map(r=>r.p));let L=[];try{L=await CFG.locals()}catch(e){}const todo=[];
  for(const c of L){const p=await pk(c.id),R=rec(p);if(!have.has(p)&&!(R&&R.off))todo.push([p,c])}if(!todo.length)return;
  ST.shared=todo.length;VIEWS.forEach(paint);
  for(const [p,c] of todo){let txt='';try{txt=await c.text()}catch(e){}if(!txt)continue;const w=await put(T,p,c,txt,null);if(w.at)recSet(p,{b:w.at,h:hs(txt)});if(w.err==='offline'||w.err==='nosql'||w.err==='full')break}
  ST.shared=0;refresh()}

// small question boxes and a note, styled here so they look the same in MEP and BIM
// check(button, values) → a message keeps the box open (a field left empty); wide for the requests list
function dlg(title,html,btns,check,wide){return new Promise(res=>{const d=document.createElement('dialog');d.className='ptm-dlg'+(wide?' wide':'');
  d.innerHTML=`<h3>${esc(title)}</h3><div class="ptm-db">${html}${check?'<p class="ptm-err" role="alert"></p>':''}</div><div class="ptm-df">${btns.map(([k,l,p])=>`<button type="button" class="ptm-b${p?' pri':''}" value="${esc(k)}">${esc(l)}</button>`).join('')}</div>`;
  const vals=()=>{const v={};d.querySelectorAll('[name]').forEach(x=>{if(x.type==='radio'&&!x.checked)return;v[x.name]=x.value});return v};
  d.addEventListener('click',e=>{const b=e.target.closest('button[value]');if(!b)return;const m=check&&check(b.value,vals());if(m){d.querySelector('.ptm-err').textContent=m;return}d.close(b.value)});
  d.addEventListener('close',()=>{const v=d.returnValue||'';dlg.v=vals();d.remove();res(v)});
  document.body.appendChild(d);d.showModal()})}
function note(msg){let e=document.getElementById('ptmNote');if(!e){e=document.createElement('div');e.id='ptmNote';e.className='ptm-toast';e.setAttribute('role','status');document.body.appendChild(e)}
  e.textContent=msg;e.classList.add('on');clearTimeout(note.t);note.t=setTimeout(()=>e.classList.remove('on'),4500)}

const CSS=`.ptm-me{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin:0 0 10px;font-size:14px}
.ptm-f{display:flex;flex-direction:column;gap:3px;font-size:13.5px;margin:0 0 10px}.ptm-f select,.ptm-f input{font:inherit;font-size:15px;padding:8px 10px;border-radius:10px;border:1px solid #CBD5E1;background:#fff;color:#0F1E2E}
.ptm-in::backdrop{background:rgba(8,20,40,.78);-webkit-backdrop-filter:blur(14px);backdrop-filter:blur(14px)}.ptm-err{color:#B91C1C;font-size:13.5px;margin:0;min-height:1.2em}.ptm-pin{letter-spacing:6px;font-size:20px!important}
.ptm-chip{display:inline-flex;align-items:center;gap:6px;max-width:200px}.ptm-chip span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}@media(max-width:640px){.ptm-chip span{display:none}}.ptm-chip.none{color:#B45309!important;border-color:#F6D9A8!important;background:#FFF7EA!important}.ptm-me label{display:flex;flex-direction:column;gap:2px;font-size:13px;flex:1 1 200px;max-width:320px}
.ptm-me input,.ptm-q{font:inherit;font-size:14px;padding:7px 10px;border-radius:10px;border:1px solid rgba(127,140,160,.45);background:transparent;color:inherit;min-width:0}
.ptm-q{width:100%;box-sizing:border-box;margin:0 0 10px}.ptm-warn{color:#B45309;font-size:12.5px;flex-basis:100%}
.ptm-l{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:10px}
.ptm-r{display:flex;flex-direction:column;gap:6px;padding:10px 12px;border-radius:14px;border:1px solid rgba(127,140,160,.3);background:rgba(127,140,160,.06);min-width:0}
.ptm-r.lk{border-color:rgba(245,158,11,.6);background:rgba(245,158,11,.08)}.ptm-r small{opacity:.8;font-size:12.5px;line-height:1.45}
.ptm-rn{display:flex;flex-wrap:wrap;gap:6px;align-items:center}.ptm-rn b{overflow-wrap:anywhere}
.ptm-pill{font-style:normal;font-size:11.5px;font-weight:600;padding:1px 8px;border-radius:999px;background:rgba(127,140,160,.16);white-space:nowrap}
.ptm-pill.on{background:rgba(245,158,11,.18);color:#B45309}.ptm-pill.me{background:rgba(16,185,129,.16);color:#047857}
.ptm-ra{display:flex;flex-wrap:wrap;gap:6px}.ptm-h{opacity:.8;font-size:13.5px;margin:4px 0}
.ptm-note{margin:0 0 8px;padding:9px 12px;border-radius:12px;background:#FFF7EA;border:1px solid #F6D9A8;color:#7A4A0B;font-size:14px}
.ptm-off{margin-top:10px;font-size:13.5px}.ptm-off summary{cursor:pointer;opacity:.85}.ptm-off .ptm-r{margin-top:6px;flex-direction:row;justify-content:space-between;align-items:center}
.ptm-bar{position:fixed;right:12px;bottom:calc(12px + env(safe-area-inset-bottom,0px));z-index:2147482000;max-width:min(480px,calc(100% - 24px));display:flex;flex-wrap:wrap;gap:6px 10px;align-items:center;
  padding:9px 12px;border-radius:14px;background:#FFF7EA;border:1px solid #F6D9A8;border-left:4px solid #F59E0B;color:#7A4A0B;font:14px/1.45 system-ui,'Noto Sans Thai',sans-serif;box-shadow:0 12px 30px -12px rgba(0,0,0,.35)}
.ptm-bar span{flex:1 1 100%}.ptm-bar button{font:inherit;font-size:13px;padding:4px 10px;border-radius:10px;border:1px solid #E2C48F;background:#fff;color:#7A4A0B;cursor:pointer}
.ptm-bar button.x{border:none;background:none;font-size:18px;padding:0 4px}
.ptm-dlg{border:none;border-radius:18px;padding:0;width:min(480px,calc(100% - 24px));color:#0F1E2E;background:#fff;box-shadow:0 30px 80px -20px rgba(8,20,40,.45);font:15px/1.55 system-ui,'Noto Sans Thai',sans-serif}
.ptm-dlg::backdrop{background:rgba(8,20,40,.35)}.ptm-dlg h3{margin:0;padding:16px 18px 10px;font-size:17px;border-bottom:1px solid #E2E8F1}
.ptm-db{padding:12px 18px}.ptm-db p{margin:0}.ptm-df{display:flex;flex-wrap:wrap;gap:8px;padding:10px 18px 16px}
.ptm-b{font:inherit;font-size:14px;padding:8px 14px;border-radius:12px;border:1px solid #E2E8F1;background:#fff;color:#0F1E2E;cursor:pointer}.ptm-b.pri{background:#0B6E7A;border-color:#0B6E7A;color:#fff}
.ptm-toast{position:fixed;left:50%;bottom:calc(70px + env(safe-area-inset-bottom,0px));transform:translateX(-50%);z-index:2147483001;max-width:calc(100% - 24px);background:#0F1E2E;color:#fff;padding:9px 18px;border-radius:999px;font:14px/1.45 system-ui,'Noto Sans Thai',sans-serif;opacity:0;transition:opacity .2s;pointer-events:none;text-align:center}
.ptm-toast.on{opacity:1}
.ptm-tabs{display:flex;flex-wrap:wrap;gap:2px;margin:0 0 12px;border-bottom:1px solid rgba(127,140,160,.3)}
.ptm-tab{font:inherit;font-size:14px;padding:8px 12px;border:none;border-bottom:2px solid transparent;margin-bottom:-1px;background:none;color:inherit;opacity:.72;cursor:pointer;display:inline-flex;gap:6px;align-items:center}
.ptm-tab.on{opacity:1;font-weight:700;border-bottom-color:#0EA5B7}.ptm-tab:hover{opacity:1}
.ptm-n{font-style:normal;min-width:18px;height:18px;padding:0 5px;border-radius:9px;background:#E11D48;color:#fff;font-size:11px;font-weight:700;line-height:18px;display:inline-flex;align-items:center;justify-content:center;box-sizing:border-box}
.ptm-g{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:12px}
.ptm-c{display:flex;flex-direction:column;border-radius:12px;overflow:hidden;border:1px solid rgba(127,140,160,.3);background:rgba(127,140,160,.06);min-width:0}
.ptm-c.lk{border-color:rgba(245,158,11,.65)}.ptm-c.nw{border-color:#14B8A6;box-shadow:0 0 0 1px #14B8A6}
.ptm-th{position:relative;display:block;padding:0;border:none;background:#0E1621;aspect-ratio:16/9;width:100%;cursor:pointer;overflow:hidden;color:#fff}
.ptm-th svg{display:block;width:100%;height:100%}.ptm-th.sm{width:64px;aspect-ratio:16/10;border-radius:6px;flex:none}
.ptm-app{display:inline-block;font-style:normal;font-size:10.5px;font-weight:800;letter-spacing:.04em;padding:1px 6px;border-radius:4px;color:#fff;background:#0E7490;justify-self:start;align-self:center}
.ptm-app.bim{background:#7C3AED}.ptm-app.pm{background:#2F7F88}.ptm-th .ptm-app{position:absolute;left:6px;bottom:6px}.ptm-tp{position:absolute;right:6px;top:6px}.ptm-tp .ptm-pill{background:#FEF3C7;color:#92400E}.ptm-tp .ptm-pill.me{background:#D1FAE5;color:#065F46}.ptm-tp .ptm-pill.nw{background:#5EEAD4;color:#064E3B}
.ptm-cb{padding:8px 10px 6px;display:flex;flex-direction:column;gap:3px;min-width:0}
.ptm-cb b{font-size:14.5px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.ptm-cb small{opacity:.8;font-size:12.5px}
.ptm-c .ptm-ra{padding:2px 10px 10px}.ptm-fg b{font-weight:700}.ptm b.up{color:#059669}.ptm b.dn{color:#DC2626}
.ptm-who{display:inline-flex;gap:6px;align-items:center;font-size:13px;min-width:0}.ptm-who small{opacity:.75}
.ptm-av{font-style:normal;flex:none;width:22px;height:22px;border-radius:50%;color:#fff;font-size:11px;font-weight:700;display:inline-flex;align-items:center;justify-content:center}
.ptm-tb{display:flex;flex-direction:column;border:1px solid rgba(127,140,160,.3);border-radius:12px;overflow:hidden}
.ptm-tr{display:grid;grid-template-columns:minmax(140px,1.5fr) 56px minmax(140px,1.4fr) minmax(120px,1fr) auto;gap:10px;align-items:center;padding:8px 12px;border-top:1px solid rgba(127,140,160,.2);font-size:13.5px}
.ptm-tb.mates .ptm-tr{grid-template-columns:64px minmax(140px,1.5fr) 56px minmax(150px,1.3fr) minmax(110px,1fr) minmax(110px,.9fr) auto}
.ptm-tr.feed{grid-template-columns:64px minmax(140px,1.4fr) 56px minmax(120px,1fr) minmax(120px,.9fr) minmax(140px,1.3fr)}.ptm-tr.nw{background:rgba(20,184,166,.08)}
.ptm-tr:first-child{border-top:none}.ptm-tr small{opacity:.8;font-size:12.5px}.ptm-hd{font-size:12px;font-weight:600;opacity:.75;background:rgba(127,140,160,.08)}
.ptm-tr .ptm-ra{justify-content:flex-end}
@media(max-width:760px){.ptm-tr,.ptm-tb.mates .ptm-tr,.ptm-tr.feed{display:flex;flex-wrap:wrap;gap:6px 10px}.ptm-tr>span:first-of-type{flex:1 1 60%}.ptm-hd{display:none!important}}
.ptm-fl{display:flex;flex-wrap:wrap;gap:6px;align-items:center;margin:0 0 10px}.ptm-fl .ptm-q{width:auto;flex:1 1 200px;margin:0}.ptm-fl .ptm-sel{flex:0 0 auto;max-width:220px}
.ptm-fl .ptm-sel option{color:#0F1E2E}
.ptm-fc{font:inherit;font-size:13px;padding:4px 12px;border-radius:999px;border:1px solid rgba(127,140,160,.45);background:transparent;color:inherit;cursor:pointer}
.ptm-fc.on{background:#0EA5B7;border-color:#0EA5B7;color:#fff}.ptm-vw{display:inline-flex;gap:2px;margin-right:4px}.ptm-vw .ptm-fc{padding:4px 9px}
.ptm h4{margin:16px 0 8px;font-size:15px}
.ptm-pill.ok{background:rgba(20,184,166,.18);color:#0F766E}.ptm-pill.no{background:rgba(239,68,68,.16);color:#B91C1C}.ptm-pill.nw{background:#5EEAD4;color:#064E3B}
.ptm-lk{color:#B45309}
.ptm-rqc{display:flex;flex-wrap:wrap;gap:12px;padding:12px;margin:0 0 10px;border-radius:12px;border:1px solid rgba(127,140,160,.3);border-left:4px solid #F59E0B;background:rgba(127,140,160,.06)}
.ptm-rqc>.ptm-th{width:120px;flex:none;border-radius:8px}.ptm-rqm{flex:1 1 240px;min-width:0;font-size:14px}.ptm-rqm p{margin:0 0 6px}
.ptm-rqm blockquote{margin:0 0 6px;padding:6px 10px;border-radius:8px;background:rgba(127,140,160,.12)}.ptm-rqa{display:flex;flex-direction:column;gap:6px;flex:none}
.ptm .ptm-bad,.ptm-bad{color:#DC2626!important;border-color:rgba(220,38,38,.5)!important}
.ptm-rqh{display:flex;gap:10px;align-items:center;padding:10px 12px;margin:0 0 10px;border-radius:12px;background:#F1F5F9}.ptm-rqh small{display:block;color:#5B697C;font-size:13px}
.ptm-l1{margin:6px 0 5px!important;font-size:13.5px;color:#5B697C}.ptm-chs{display:flex;flex-wrap:wrap;gap:6px;margin:0 0 8px}
.ptm-ch{position:relative}.ptm-ch input{position:absolute;opacity:0;pointer-events:none}.ptm-ch span{display:inline-block;padding:4px 12px;border-radius:999px;border:1px solid #CBD5E1;font-size:13.5px;cursor:pointer}
.ptm-ch input:checked+span{background:#0B6E7A;border-color:#0B6E7A;color:#fff}.ptm-ch input:focus-visible+span{outline:2px solid #0EA5B7;outline-offset:1px}
.ptm-f textarea{font:inherit;font-size:14.5px;padding:8px 10px;border-radius:10px;border:1px solid #CBD5E1;background:#fff;color:#0F1E2E;resize:vertical}
.ptm-dlg.wide{width:min(880px,calc(100% - 24px))}.ptm-dlg .ptm-db{max-height:72vh;overflow:auto}
.ptm-dlg .ptm-rqbox .btn{font:inherit;font-size:13px;padding:5px 12px;border-radius:10px;border:1px solid #CBD5E1;background:#fff;color:#0F1E2E;cursor:pointer}.ptm-dlg .ptm-rqbox .btn.primary{background:#0B6E7A;border-color:#0B6E7A;color:#fff}
.ptm-bar.ro{left:12px;max-width:none;align-items:center}.ptm-bar.ro span{flex:1 1 320px}.ptm-bar button.pri{background:#0B6E7A;border-color:#0B6E7A;color:#fff}
.ptm-rq{right:auto;left:12px;background:#0F1E2E;border-color:#0F1E2E;border-left-color:#F59E0B;color:#E2E8F0}.ptm-rq i{opacity:.85}
.ptm-rq button{background:transparent;color:#E2E8F0;border-color:#475569}.ptm-rq button.pri{background:#38BDF8;border-color:#38BDF8;color:#062033}
@media(max-width:640px){.ptm-rq{right:12px;bottom:auto;top:calc(60px + env(safe-area-inset-top,0px))}}
.ptm-chip .ptm-n{margin-left:2px}`;
function attach(cfg){if(CFG)return;CFG=cfg;
  const s=document.createElement('style');s.textContent=CSS;document.head.appendChild(s);
  setInterval(tick,BEAT);setTimeout(tick,2500);setTimeout(gate,600);          // the staff list may already be here (PM in this browser, or fetched before)
  const act=()=>{ST.act=Date.now()};['pointerdown','keydown'].forEach(k=>addEventListener(k,act,{passive:true,capture:true}));
  addEventListener('focus',()=>{act();tick()});document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'){act();tick()}});
  addEventListener('pagehide',()=>{release(true)})}
new MutationObserver(chips).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});          // the app switched language
addEventListener('storage',e=>{if(e.key===K||/^(penum\.pm\.(auth|v1|slot|bio)|pmSB)/.test(e.key||'')){PMT=0;ST.lw='';chips();VIEWS.forEach(paint);gate();if(CFG){rqCard();bar()}}});          // signed in or out in another window, or in PENUM PM
window.penumTeam={attach,soon,tick,render,refresh,state:()=>ST,name,shown,me,chip,userBox,signIn,signOut,ro,roNote,pmPut,reqs,decide,hash:hs,apps:APPS};
})();
