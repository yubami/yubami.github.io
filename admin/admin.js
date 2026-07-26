import {initializeApp} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";
import {getAuth,signInWithEmailAndPassword,signOut,onAuthStateChanged} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";
import {getFirestore,collection,addDoc,updateDoc,deleteDoc,doc,getDoc,getDocs,setDoc,query,orderBy,onSnapshot,serverTimestamp} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";
import {firebaseConfig,ADMIN_EMAIL} from "../assets/config.js";

const app=initializeApp(firebaseConfig),auth=getAuth(app),db=getFirestore(app),$=s=>document.querySelector(s);
const esc=s=>String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));
const parseTags=value=>[...new Set(String(value||"").split(/[#\s,]+/).map(x=>x.trim()).filter(Boolean))];
const CLOUD_KEY='yubamiCloudinarySettings';
const DEFAULT_CLOUD={cloudName:'mofyhner',uploadPreset:'yubami_upload'};

$("#loginForm").addEventListener("submit",async e=>{e.preventDefault();$("#loginStatus").textContent="로그인 중...";try{const c=await signInWithEmailAndPassword(auth,$("#email").value.trim(),$("#password").value);if(c.user.email!==ADMIN_EMAIL){await signOut(auth);throw new Error()}$("#loginStatus").textContent=""}catch{$("#loginStatus").textContent="이메일 또는 비밀번호를 확인해 주세요."}});
$("#logout").addEventListener("click",()=>signOut(auth));
document.querySelectorAll("[data-panel]").forEach(b=>b.addEventListener("click",()=>{document.querySelectorAll("[data-panel]").forEach(x=>x.classList.remove("active"));document.querySelectorAll(".panel").forEach(x=>x.classList.remove("active"));b.classList.add("active");$("#panel-"+b.dataset.panel)?.classList.add("active")}));

function preview(form,url,fieldName='imageUrl'){
  const box=form.querySelector(`[data-preview-for="${fieldName}"]`) || (fieldName==='imageUrl'?form.querySelector('.image-preview'):null);
  if(box)box.innerHTML=url?`<img src="${esc(url)}" alt="미리보기"><p class="image-url">업로드 완료</p>`:'';
}
function previewAll(form){
  ['imageUrl','imageUrl2','imageUrl3','imageUrl4'].forEach(name=>{
    if(form.elements[name])preview(form,form.elements[name].value||'',name);
  });
}
function renderTagPreview(form){const box=form.querySelector('.tag-preview'),input=form.querySelector('.tag-input');if(box&&input)box.innerHTML=parseTags(input.value).map(t=>`<span class="tag">#${esc(t)}</span>`).join('')}
function reset(form){
  form.reset();
  if(form.elements._id)form.elements._id.value="";
  ['imageUrl','imageUrl2','imageUrl3','imageUrl4'].forEach(name=>{if(form.elements[name])form.elements[name].value=''});
  if(form.elements.category)form.elements.category.value='KPOP';
  syncChoiceButtons(form);
  form.querySelector("[data-submit]").textContent="저장";
  form.querySelector("[data-cancel]")?.classList.add("hidden");
  previewAll(form);
  renderTagPreview(form);
}
function formData(form){const out={};for(const[k,v]of new FormData(form)){if(k!=="_id")out[k]=typeof v==="string"?v.trim():v}if(form.dataset.document==="home/main"){const image=form.querySelector('input[name="imageUrl"]');out.imageUrl=image?.value?.trim()||"";delete out.imageUrl2;delete out.imageUrl3;delete out.imageUrl4;}if(form.dataset.collection==="schedules"){
    const pad=v=>String(v).padStart(2,'0');
    const sy=form.elements.startYear?.value,sm=form.elements.startMonth?.value,sd=form.elements.startDay?.value;
    const ey=form.elements.endYear?.value,em=form.elements.endMonth?.value,ed=form.elements.endDay?.value;
    if(sy&&sm&&sd)out.startDate=`${sy}-${pad(sm)}-${pad(sd)}`;
    if(ey&&em&&ed)out.endDate=`${ey}-${pad(em)}-${pad(ed)}`;
    delete out.date;delete out.time;delete out.content;
  }
  if(["instagram","notices"].includes(form.dataset.collection))out.downloadAllowed=!!form.elements.downloadAllowed?.checked;if(out.difficulty)out.difficulty=Number(out.difficulty);if(out.debtCount!==undefined&&out.debtCount!=="")out.debtCount=Number(out.debtCount);if(out.sortOrder!==undefined&&out.sortOrder!=="")out.sortOrder=Number(out.sortOrder);if("tags" in out)out.tags=parseTags(out.tags);out.updatedAt=serverTimestamp();return out}

function syncChoiceButtons(form){
  form.querySelectorAll('[data-choice-for]').forEach(group=>{
    const name=group.dataset.choiceFor,value=form.elements[name]?.value||'';
    group.querySelectorAll('[data-value]').forEach(button=>button.classList.toggle('active',button.dataset.value===value));
  });
}
document.querySelectorAll('[data-choice-for]').forEach(group=>{
  group.querySelectorAll('[data-value]').forEach(button=>button.addEventListener('click',()=>{
    const form=button.closest('form'),name=group.dataset.choiceFor;
    if(form?.elements[name])form.elements[name].value=button.dataset.value;
    syncChoiceButtons(form);
  }));
});

function cloudSettings(){try{return {...DEFAULT_CLOUD,...JSON.parse(localStorage.getItem(CLOUD_KEY)||'{}')}}catch{return {...DEFAULT_CLOUD}}}
function saveCloudSettings(v){localStorage.setItem(CLOUD_KEY,JSON.stringify(v))}

const cloudForm=$('#cloudinarySettings');
if(cloudForm){const saved=cloudSettings();cloudForm.elements.cloudName.value=saved.cloudName||'';cloudForm.elements.uploadPreset.value=saved.uploadPreset||'';cloudForm.addEventListener('submit',e=>{e.preventDefault();const v={cloudName:cloudForm.elements.cloudName.value.trim(),uploadPreset:cloudForm.elements.uploadPreset.value.trim()};saveCloudSettings(v);cloudForm.querySelector('.save-status').textContent='저장됐어요. 이제 다른 메뉴에서 사진 업로드 버튼을 눌러보세요.'})}

function openUpload(form,folder,target='imageUrl'){const cfg=cloudSettings();if(!cfg.cloudName||!cfg.uploadPreset){alert('먼저 왼쪽의 사진 업로드 설정에서 Cloud name과 Unsigned upload preset을 저장해 주세요.');document.querySelector('[data-panel="cloudinary"]')?.click();return}if(!window.cloudinary){alert('Cloudinary 업로드 도구를 불러오지 못했어요. 인터넷 연결 후 새로고침해 주세요.');return}
 const widget=window.cloudinary.createUploadWidget({cloudName:cfg.cloudName,uploadPreset:cfg.uploadPreset,sources:['local','camera','url'],multiple:false,resourceType:'image',clientAllowedFormats:['png','jpg','jpeg','webp','gif'],maxFileSize:8000000,folder:`yubami/${folder}`,cropping:false,showAdvancedOptions:false,styles:{palette:{window:'#0b102b',windowBorder:'#9b6cff',tabIcon:'#ffd36b',menuIcons:'#ffffff',textDark:'#ffffff',textLight:'#ffffff',link:'#ffd36b',action:'#ff6b9a',inactiveTabIcon:'#9da4c7',error:'#ff5b70',inProgress:'#ffd36b',complete:'#67e8a5',sourceBg:'#131a3a'}}},(error,result)=>{if(error){console.error(error);alert('사진 업로드에 실패했어요: '+(error.statusText||error.message||'설정을 확인해 주세요.'));return}if(result&&result.event==='success'){const url=result.info.secure_url;if(form.elements[target])form.elements[target].value=url;preview(form,url,target);widget.close();}});widget.open()}

document.querySelectorAll('.cloud-upload').forEach(b=>b.addEventListener('click',()=>openUpload(b.form,b.dataset.folder||'misc',b.dataset.target||'imageUrl')));
document.querySelectorAll('.clear-image').forEach(b=>b.addEventListener('click',()=>{const target=b.dataset.target||'imageUrl';if(b.form.elements[target])b.form.elements[target].value='';preview(b.form,'',target)}));
document.querySelectorAll('.tag-input').forEach(i=>i.addEventListener('input',()=>renderTagPreview(i.form)));

async function loadSingleton(form){const [collectionName,documentName]=form.dataset.document.split('/'),snap=await getDoc(doc(db,collectionName,documentName));if(snap.exists()){const x=snap.data();for(const e of form.elements)if(e.name&&x[e.name]!==undefined){if(e.type==="checkbox")e.checked=!!x[e.name];else e.value=x[e.name];}previewAll(form);syncChoiceButtons(form)}}
let started=false;onAuthStateChanged(auth,user=>{const ok=user&&user.email===ADMIN_EMAIL;$("#loginView").classList.toggle("hidden",ok);$("#adminView").classList.toggle("hidden",!ok);if(ok){$("#adminEmail").textContent=user.email;if(!started){started=true;start()}}});

function start(){onSnapshot(query(collection(db,'wardrobeCollections'),orderBy('createdAt','desc')),snap=>{const categories=snap.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>(Number(a.sortOrder)||0)-(Number(b.sortOrder)||0)||String(a.title||'').localeCompare(String(b.title||''),'ko'));document.querySelectorAll('[data-wardrobe-category-select]').forEach(select=>{const current=select.value;select.innerHTML='<option value="">카테고리 선택</option>'+categories.map(x=>`<option value="${esc(x.title||'')}">${esc(x.title||'이름 없음')}</option>`).join('');if(current)select.value=current})});document.querySelectorAll('.singleton-form').forEach(form=>{loadSingleton(form);form.addEventListener('submit',async e=>{e.preventDefault();const b=form.querySelector('[data-submit]'),status=form.querySelector('.save-status'),[collectionName,documentName]=form.dataset.document.split('/');b.disabled=true;if(status)status.textContent='저장 중...';try{await setDoc(doc(db,collectionName,documentName),formData(form),{merge:true});if(status)status.textContent='저장 완료! 일반 사이트에 실시간 반영돼요.'}catch(err){console.error(err);if(status)status.textContent='저장 실패: '+(err?.message||'알 수 없는 오류')}finally{b.disabled=false}})});
 document.querySelectorAll('.content-form').forEach(form=>{form.addEventListener('submit',async e=>{e.preventDefault();const b=form.querySelector('[data-submit]');b.disabled=true;try{const id=form.elements._id.value,data=formData(form);if(id)await updateDoc(doc(db,form.dataset.collection,id),data);else await addDoc(collection(db,form.dataset.collection),{...data,createdAt:serverTimestamp()});reset(form)}catch(err){console.error(err);alert('저장 중 오류: '+(err?.message||'알 수 없는 오류'))}finally{b.disabled=false}});form.querySelector('[data-cancel]')?.addEventListener('click',()=>reset(form))});
 ['songs','notices','schedules','wardrobeCollections','wardrobe','instagram','embers','profileGallery','siteRules'].forEach(name=>{const el=document.querySelector(`[data-list="${name}"]`);onSnapshot(query(collection(db,name),orderBy('createdAt','desc')),snap=>{el.innerHTML=snap.empty?'<div class="empty">등록된 내용이 없어요.</div>':snap.docs.map(d=>{const x=d.data(),heading=name==='rouletteDebts'?`${x.viewerName||'이름 없음'} · 업보 ${Number(x.debtCount)||0}개`:(x.title||'제목 없음')+(x.artist?' · '+x.artist:''),summary=name==='rouletteDebts'?`${x.viewerId||'아이디 미등록'} · ${x.content||''}`:(x.content||x.date||'');return `<div class="manage-row"><div class="manage-copy">${x.imageUrl?`<img src="${esc(x.imageUrl)}" alt="">`:''}<div><h3>${esc(heading)}</h3><p>${esc(summary)}</p>${(x.tags||[]).map(t=>`<span class="tag">#${esc(t)}</span>`).join('')}</div></div><div class="mini"><button class="soft" data-edit="${d.id}">수정</button><button class="danger" data-delete="${d.id}">삭제</button></div></div>`}).join('');el.querySelectorAll('[data-delete]').forEach(b=>b.addEventListener('click',async()=>{if(confirm('정말 삭제할까요?'))await deleteDoc(doc(db,name,b.dataset.delete))}));el.querySelectorAll('[data-edit]').forEach(b=>b.addEventListener('click',()=>{const item=snap.docs.find(d=>d.id===b.dataset.edit),x=item.data(),form=document.querySelector(`form[data-collection="${name}"]`);form.elements._id.value=item.id;for(const e of form.elements){if(!e.name||e.name==='_id')continue;e.type==='checkbox'?e.checked=!!x[e.name]:e.value=e.name==='tags'?(x.tags||[]).map(t=>'#'+t).join(' '):(x[e.name]??'')}if(form.elements.category&&!form.elements.category.value)form.elements.category.value='KPOP';previewAll(form);syncChoiceButtons(form);renderTagPreview(form);form.querySelector('[data-submit]').textContent='수정 저장';form.querySelector('[data-cancel]')?.classList.remove('hidden');form.scrollIntoView({behavior:'smooth',block:'start'})}))})})}


function debtItemsOf(x){
  if(Array.isArray(x.items))return x.items;
  if(x.content)return [{id:'legacy-'+Date.now(),content:x.content,completed:false,createdAt:Date.now()}];
  return [];
}
const debtViewerName=document.getElementById('debtViewerName');
const debtViewerId=document.getElementById('debtViewerId');
const debtContentInput=document.getElementById('debtContentInput');
const debtQuickAdd=document.getElementById('debtQuickAdd');
const debtQuickStatus=document.getElementById('debtQuickStatus');
const debtAdminList=document.querySelector('[data-list="rouletteDebts"]');

async function findDebtViewer(name,id){
  const snap=await getDocs(collection(db,'rouletteDebts'));
  return snap.docs.find(d=>{
    const x=d.data();
    return id ? String(x.viewerId||'').trim()===id : String(x.viewerName||'').trim()===name;
  });
}
debtQuickAdd?.addEventListener('click',async()=>{
  const viewerName=(debtViewerName.value||'').trim(),viewerId=(debtViewerId.value||'').trim(),content=(debtContentInput.value||'').trim();
  if(!viewerName||!content){debtQuickStatus.textContent='시청자 이름과 업보 내용을 입력해 주세요.';return}
  debtQuickAdd.disabled=true;debtQuickStatus.textContent='추가 중...';
  try{
    const found=await findDebtViewer(viewerName,viewerId);
    const item={id:(crypto.randomUUID?crypto.randomUUID():String(Date.now())),content,completed:false,createdAt:Date.now()};
    if(found){
      const items=debtItemsOf(found.data());
      await updateDoc(doc(db,'rouletteDebts',found.id),{viewerName,viewerId,items:[...items,item],updatedAt:serverTimestamp()});
    }else{
      await addDoc(collection(db,'rouletteDebts'),{viewerName,viewerId,items:[item],createdAt:serverTimestamp(),updatedAt:serverTimestamp()});
    }
    debtContentInput.value='';debtQuickStatus.textContent='업보가 추가됐어요.';
  }catch(err){console.error(err);debtQuickStatus.textContent='추가하지 못했어요: '+(err.message||'오류')}
  finally{debtQuickAdd.disabled=false}
});
debtContentInput?.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();debtQuickAdd.click()}});

if(debtAdminList)onSnapshot(query(collection(db,'rouletteDebts'),orderBy('createdAt','desc')),snap=>{
  debtAdminList.innerHTML=snap.empty?'<div class="empty">등록된 업보가 없어요.</div>':snap.docs.map(d=>{
    const x=d.data(),items=debtItemsOf(x),done=items.filter(i=>i.completed).length;
    return `<article class="manage-row debt-manage-card">
      <div class="debt-manage-main"><div class="debt-manage-head"><div><h3>${esc(x.viewerName||'이름 없음')}</h3><p>${esc(x.viewerId||'아이디 미등록')}</p></div><div class="debt-count-badges"><span>🔥 전체 ${items.length}</span><span>⏳ 남음 ${items.length-done}</span><span>✅ 완료 ${done}</span></div></div>
      <div class="debt-admin-items">${items.map(i=>`<div class="debt-admin-row ${i.completed?'is-complete':''}"><span>${esc(i.content||'')}</span><div class="mini"><button class="soft" data-debt-inline-edit data-doc-id="${d.id}" data-item-id="${i.id}">수정</button><button class="soft" data-debt-toggle="${d.id}" data-item="${i.id}">${i.completed?'되돌리기':'완료'}</button><button class="danger" data-debt-item-delete="${d.id}" data-item="${i.id}">삭제</button></div></div>`).join('')||'<div class="empty">내용이 없어요.</div>'}</div></div>
      <button class="danger" data-debt-card-delete="${d.id}">카드 전체 삭제</button>
    </article>`;
  }).join('');
  debtAdminList.querySelectorAll('[data-debt-toggle]').forEach(b=>b.addEventListener('click',async()=>{
    const ref=doc(db,'rouletteDebts',b.dataset.debtToggle),s=await getDoc(ref);if(!s.exists())return;
    const items=debtItemsOf(s.data()).map(i=>i.id===b.dataset.item?{...i,completed:!i.completed}:i);
    await updateDoc(ref,{items,updatedAt:serverTimestamp()});
  }));
  debtAdminList.querySelectorAll('[data-debt-item-delete]').forEach(b=>b.addEventListener('click',async()=>{
    if(!confirm('이 업보 내용만 삭제할까요?'))return;
    const ref=doc(db,'rouletteDebts',b.dataset.debtItemDelete),s=await getDoc(ref);if(!s.exists())return;
    const items=debtItemsOf(s.data()).filter(i=>i.id!==b.dataset.item);
    await updateDoc(ref,{items,updatedAt:serverTimestamp()});
  }));
  debtAdminList.querySelectorAll('[data-debt-card-delete]').forEach(b=>b.addEventListener('click',async()=>{
    if(confirm('이 시청자의 업보 카드 전체를 삭제할까요?'))await deleteDoc(doc(db,'rouletteDebts',b.dataset.debtCardDelete));
  }));
});


// V7.14 YouTube 링크 자동 정보 불러오기
const musicUrlInput=document.querySelector('[data-music-url]');
const musicTitleInput=document.querySelector('[data-music-title]');
const musicAuthorInput=document.querySelector('[data-music-author]');
const musicFetchButton=document.querySelector('[data-fetch-music-info]');
const musicFetchStatus=document.querySelector('[data-music-fetch-status]');

async function fetchMusicMetadata(){
  const url=(musicUrlInput?.value||'').trim();
  if(!url){if(musicFetchStatus)musicFetchStatus.textContent='유튜브 링크를 먼저 입력해 주세요.';return}
  if(musicFetchButton)musicFetchButton.disabled=true;
  if(musicFetchStatus)musicFetchStatus.textContent='영상 정보를 불러오는 중...';
  try{
    const endpoint='https://www.youtube.com/oembed?format=json&url='+encodeURIComponent(url);
    const response=await fetch(endpoint);
    if(!response.ok)throw new Error('영상 정보를 가져올 수 없어요.');
    const data=await response.json();
    if(musicTitleInput)musicTitleInput.value=data.title||'';
    if(musicAuthorInput)musicAuthorInput.value=data.author_name||'';
    if(musicFetchStatus)musicFetchStatus.textContent='제목과 채널명을 가져왔어요. 이제 홈 화면 저장을 눌러 주세요.';
  }catch(err){
    console.error(err);
    if(musicFetchStatus)musicFetchStatus.textContent='자동으로 가져오지 못했어요. 공개 영상인지 링크를 확인해 주세요.';
  }finally{
    if(musicFetchButton)musicFetchButton.disabled=false;
  }
}
musicFetchButton?.addEventListener('click',fetchMusicMetadata);
musicUrlInput?.addEventListener('change',fetchMusicMetadata);
musicUrlInput?.addEventListener('paste',()=>setTimeout(fetchMusicMetadata,80));

// V7.26 바로가기 버튼 관리 — 입력 중 DOM 재생성 금지
const homeLinksManager=document.querySelector('[data-home-links-manager]');
const homeLinksStatus=document.querySelector('[data-home-links-status]');
let homeLinksDraft=[];
let homeLinksInitialized=false;
let homeLinksSaving=false;
const defaultHomeLinks=[
  {id:'main',icon:'📺',label:'유바미 본채널',url:'#',color:'#8b5cf6'},
  {id:'sub',icon:'🎬',label:'유바미 서브채널',url:'#',color:'#ec4899'},
  {id:'vod',icon:'▶',label:'다시보기 채널',url:'#',color:'#f97360'},
  {id:'x',icon:'𝕏',label:'X 트위터',url:'#',color:'#38bdf8'},
  {id:'cafe',icon:'☕',label:'팬카페',url:'#',color:'#a855f7'}
];
const linkId=()=>crypto.randomUUID?crypto.randomUUID():String(Date.now()+Math.random());
function normalizeHomeLink(v={}){return{id:v.id||linkId(),icon:v.icon||'🐾',label:v.label||'새 바로가기',url:v.url||'https://'}}
function renderHomeLinks(){
  if(!homeLinksManager)return;
  homeLinksManager.innerHTML=homeLinksDraft.map((item,index)=>`<div class="home-link-edit-row" data-link-id="${item.id}"><input class="field icon-field" data-k="icon" value="${esc(item.icon)}" aria-label="아이콘"><input class="field" data-k="label" value="${esc(item.label)}" placeholder="채널명"><input class="field" data-k="url" value="${esc(item.url)}" placeholder="채널 주소">
      <label class="link-color-field" title="버튼 색상">
        <span>색상</span>
        <input type="color" data-k="color" value="${esc(item.color||'#8b5cf6')}" aria-label="버튼 색상">
      </label><div class="mini"><button type="button" class="soft" data-up ${index===0?'disabled':''}>↑</button><button type="button" class="soft" data-down ${index===homeLinksDraft.length-1?'disabled':''}>↓</button><button type="button" class="danger" data-remove>삭제</button></div></div>`).join('');
}
onSnapshot(doc(db,'home','main'),snap=>{
  if(!snap.exists()||homeLinksInitialized)return;
  const saved=snap.data().links;
  homeLinksDraft=Array.isArray(saved)?saved.map(normalizeHomeLink):defaultHomeLinks.map(normalizeHomeLink);
  homeLinksInitialized=true;
  renderHomeLinks();
});
document.querySelector('[data-add-home-link]')?.addEventListener('click',()=>{homeLinksDraft.push(normalizeHomeLink());renderHomeLinks();homeLinksManager?.querySelector('.home-link-edit-row:last-child [data-k="label"]')?.focus()});
homeLinksManager?.addEventListener('input',e=>{const row=e.target.closest('[data-link-id]'),item=homeLinksDraft.find(v=>v.id===row?.dataset.linkId),key=e.target.dataset.k;if(item&&key)item[key]=e.target.value});
homeLinksManager?.addEventListener('click',e=>{const row=e.target.closest('[data-link-id]');if(!row)return;const i=homeLinksDraft.findIndex(v=>v.id===row.dataset.linkId);if(i<0)return;if(e.target.closest('[data-remove]'))homeLinksDraft.splice(i,1);else if(e.target.closest('[data-up]')&&i>0)[homeLinksDraft[i-1],homeLinksDraft[i]]=[homeLinksDraft[i],homeLinksDraft[i-1]];else if(e.target.closest('[data-down]')&&i<homeLinksDraft.length-1)[homeLinksDraft[i+1],homeLinksDraft[i]]=[homeLinksDraft[i],homeLinksDraft[i+1]];else return;renderHomeLinks()});
document.querySelector('[data-save-home-links]')?.addEventListener('click',async()=>{if(homeLinksSaving)return;homeLinksSaving=true;if(homeLinksStatus)homeLinksStatus.textContent='저장 중...';try{const clean=homeLinksDraft.map(normalizeHomeLink);await setDoc(doc(db,'home','main'),{links:clean},{merge:true});homeLinksDraft=clean;if(homeLinksStatus)homeLinksStatus.textContent='바로가기를 저장했어요.'}catch(err){console.error(err);if(homeLinksStatus)homeLinksStatus.textContent='저장 실패: '+(err?.message||'알 수 없는 오류')}finally{homeLinksSaving=false}});

document.addEventListener('click',async e=>{const b=e.target.closest('[data-debt-inline-edit]');if(!b)return;const ref=doc(db,'rouletteDebts',b.dataset.docId),snap=await getDoc(ref);if(!snap.exists())return;const items=debtItemsOf(snap.data()),item=items.find(x=>x.id===b.dataset.itemId);if(!item)return;const value=prompt('업보 내용을 수정해 주세요.',item.content||'');if(value===null||!value.trim())return;await updateDoc(ref,{items:items.map(x=>x.id===item.id?{...x,content:value.trim()}:x),updatedAt:serverTimestamp()})});


// V7.28 일정 날짜 범위 선택기
function daysInMonth(year,month){return new Date(year,month,0).getDate()}
function fillSelect(select,values,labeler=v=>String(v)){
  if(!select)return;
  const current=select.value;
  select.innerHTML=values.map(v=>`<option value="${v}">${labeler(v)}</option>`).join('');
  if(values.map(String).includes(String(current)))select.value=current;
}
function initScheduleRange(form){
  const now=new Date(),year=now.getFullYear();
  const years=Array.from({length:7},(_,i)=>year-1+i);
  const months=Array.from({length:12},(_,i)=>i+1);
  fillSelect(form.elements.startYear,years,v=>v+'년');
  fillSelect(form.elements.endYear,years,v=>v+'년');
  fillSelect(form.elements.startMonth,months,v=>v+'월');
  fillSelect(form.elements.endMonth,months,v=>v+'월');

  const refreshDays=prefix=>{
    const y=Number(form.elements[prefix+'Year']?.value)||year;
    const m=Number(form.elements[prefix+'Month']?.value)||(now.getMonth()+1);
    const max=daysInMonth(y,m);
    fillSelect(form.elements[prefix+'Day'],Array.from({length:max},(_,i)=>i+1),v=>v+'일');
  };
  ['start','end'].forEach(prefix=>{
    form.elements[prefix+'Year']?.addEventListener('change',()=>refreshDays(prefix));
    form.elements[prefix+'Month']?.addEventListener('change',()=>refreshDays(prefix));
  });

  if(!form.elements.startYear.value)form.elements.startYear.value=year;
  if(!form.elements.startMonth.value)form.elements.startMonth.value=now.getMonth()+1;
  refreshDays('start');
  if(!form.elements.startDay.value)form.elements.startDay.value=now.getDate();

  if(!form.elements.endYear.value)form.elements.endYear.value=form.elements.startYear.value;
  if(!form.elements.endMonth.value)form.elements.endMonth.value=form.elements.startMonth.value;
  refreshDays('end');
  if(!form.elements.endDay.value)form.elements.endDay.value=form.elements.startDay.value;

  form.addEventListener('change',e=>{
    if(e.target===form.elements.startYear||e.target===form.elements.startMonth||e.target===form.elements.startDay){
      const endEmpty=!form.elements.endYear.value||!form.elements.endMonth.value||!form.elements.endDay.value;
      if(endEmpty){
        form.elements.endYear.value=form.elements.startYear.value;
        form.elements.endMonth.value=form.elements.startMonth.value;
        refreshDays('end');
        form.elements.endDay.value=form.elements.startDay.value;
      }
    }
  });
}
document.querySelectorAll('form[data-collection="schedules"]').forEach(initScheduleRange);


function applyScheduleRangeToForm(form,data={}){
  const start=data.startDate||data.date||'';
  const end=data.endDate||start;
  const setDate=(prefix,value)=>{
    if(!value)return;
    const [y,m,d]=value.split('-');
    if(form.elements[prefix+'Year'])form.elements[prefix+'Year'].value=String(Number(y));
    if(form.elements[prefix+'Month'])form.elements[prefix+'Month'].value=String(Number(m));
    form.elements[prefix+'Month']?.dispatchEvent(new Event('change'));
    if(form.elements[prefix+'Day'])form.elements[prefix+'Day'].value=String(Number(d));
  };
  setDate('start',start);setDate('end',end);
}
