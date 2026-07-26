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
function formData(form){const out={};for(const[k,v]of new FormData(form)){if(k!=="_id")out[k]=typeof v==="string"?v.trim():v}if(form.dataset.collection==="instagram")out.downloadAllowed=!!form.elements.downloadAllowed?.checked;if(out.difficulty)out.difficulty=Number(out.difficulty);if(out.debtCount!==undefined&&out.debtCount!=="")out.debtCount=Number(out.debtCount);if(out.sortOrder!==undefined&&out.sortOrder!=="")out.sortOrder=Number(out.sortOrder);if("tags" in out)out.tags=parseTags(out.tags);out.updatedAt=serverTimestamp();return out}

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
 ['songs','notices','schedules','wardrobeCollections','wardrobe','instagram','embers','siteRules'].forEach(name=>{const el=document.querySelector(`[data-list="${name}"]`);onSnapshot(query(collection(db,name),orderBy('createdAt','desc')),snap=>{el.innerHTML=snap.empty?'<div class="empty">등록된 내용이 없어요.</div>':snap.docs.map(d=>{const x=d.data(),heading=name==='rouletteDebts'?`${x.viewerName||'이름 없음'} · 업보 ${Number(x.debtCount)||0}개`:(x.title||'제목 없음')+(x.artist?' · '+x.artist:''),summary=name==='rouletteDebts'?`${x.viewerId||'아이디 미등록'} · ${x.content||''}`:(x.content||x.date||'');return `<div class="manage-row"><div class="manage-copy">${x.imageUrl?`<img src="${esc(x.imageUrl)}" alt="">`:''}<div><h3>${esc(heading)}</h3><p>${esc(summary)}</p>${(x.tags||[]).map(t=>`<span class="tag">#${esc(t)}</span>`).join('')}</div></div><div class="mini"><button class="soft" data-edit="${d.id}">수정</button><button class="danger" data-delete="${d.id}">삭제</button></div></div>`}).join('');el.querySelectorAll('[data-delete]').forEach(b=>b.addEventListener('click',async()=>{if(confirm('정말 삭제할까요?'))await deleteDoc(doc(db,name,b.dataset.delete))}));el.querySelectorAll('[data-edit]').forEach(b=>b.addEventListener('click',()=>{const item=snap.docs.find(d=>d.id===b.dataset.edit),x=item.data(),form=document.querySelector(`form[data-collection="${name}"]`);form.elements._id.value=item.id;for(const e of form.elements){if(!e.name||e.name==='_id')continue;e.type==='checkbox'?e.checked=!!x[e.name]:e.value=e.name==='tags'?(x.tags||[]).map(t=>'#'+t).join(' '):(x[e.name]??'')}if(form.elements.category&&!form.elements.category.value)form.elements.category.value='KPOP';previewAll(form);syncChoiceButtons(form);renderTagPreview(form);form.querySelector('[data-submit]').textContent='수정 저장';form.querySelector('[data-cancel]')?.classList.remove('hidden');form.scrollIntoView({behavior:'smooth',block:'start'})}))})})}


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

// V7.24 바로가기 버튼 관리 — 입력 중 재렌더링 방지
const homeLinksManager=document.querySelector('[data-home-links-manager]');
const homeLinksStatus=document.querySelector('[data-home-links-status]');
let homeLinksDraft=[];
let homeLinksLoaded=false;
let homeLinksEditing=false;
let homeLinksSaving=false;

const defaultHomeLinks=[
  {id:'main',icon:'📺',label:'유바미 본채널',url:'#'},
  {id:'sub',icon:'🎬',label:'유바미 서브채널',url:'#'},
  {id:'vod',icon:'▶',label:'다시보기 채널',url:'#'},
  {id:'x',icon:'𝕏',label:'X 트위터',url:'#'},
  {id:'cafe',icon:'☕',label:'팬카페',url:'#'}
];

const linkId=()=>crypto.randomUUID?crypto.randomUUID():String(Date.now()+Math.random());

function normalizeHomeLink(x={}){
  return {
    id:x.id||linkId(),
    icon:x.icon||'🐾',
    label:x.label||'새 바로가기',
    url:x.url||'https://'
  };
}

function renderHomeLinks({preserveFocus=false}={}){
  if(!homeLinksManager)return;

  const active=document.activeElement;
  const activeRow=preserveFocus?active?.closest?.('[data-link-id]')?.dataset.linkId:null;
  const activeKey=preserveFocus?active?.dataset?.k:null;
  const selectionStart=preserveFocus&&typeof active?.selectionStart==='number'?active.selectionStart:null;
  const selectionEnd=preserveFocus&&typeof active?.selectionEnd==='number'?active.selectionEnd:null;

  homeLinksManager.innerHTML=homeLinksDraft.map((x,index)=>`
    <div class="home-link-edit-row" data-link-id="${x.id}">
      <input class="field icon-field" data-k="icon" value="${esc(x.icon||'🐾')}" aria-label="아이콘">
      <input class="field" data-k="label" value="${esc(x.label||'')}" placeholder="채널명">
      <input class="field" data-k="url" value="${esc(x.url||'')}" placeholder="채널 주소">
      <div class="mini">
        <button type="button" class="soft" data-up ${index===0?'disabled':''}>↑</button>
        <button type="button" class="soft" data-down ${index===homeLinksDraft.length-1?'disabled':''}>↓</button>
        <button type="button" class="danger" data-remove>삭제</button>
      </div>
    </div>`).join('');

  if(activeRow&&activeKey){
    const next=homeLinksManager.querySelector(`[data-link-id="${activeRow}"] [data-k="${activeKey}"]`);
    if(next){
      next.focus();
      if(selectionStart!==null&&selectionEnd!==null){
        try{next.setSelectionRange(selectionStart,selectionEnd)}catch(_){}
      }
    }
  }
}

onSnapshot(doc(db,'home','main'),snap=>{
  if(!snap.exists())return;

  // 최초 1회만 바로 그립니다.
  if(!homeLinksLoaded){
    homeLinksDraft=Array.isArray(snap.data().links)
      ? snap.data().links.map(normalizeHomeLink)
      : defaultHomeLinks.map(normalizeHomeLink);
    homeLinksLoaded=true;
    renderHomeLinks();
    return;
  }

  // 사용자가 입력 중이거나 저장 중이면 DOM을 교체하지 않습니다.
  if(homeLinksEditing||homeLinksSaving)return;

  homeLinksDraft=Array.isArray(snap.data().links)
    ? snap.data().links.map(normalizeHomeLink)
    : defaultHomeLinks.map(normalizeHomeLink);
  renderHomeLinks();
});

document.querySelector('[data-add-home-link]')?.addEventListener('click',()=>{
  homeLinksDraft.push(normalizeHomeLink());
  homeLinksEditing=true;
  renderHomeLinks();
  const last=homeLinksManager?.querySelector('.home-link-edit-row:last-child [data-k="label"]');
  last?.focus();
});

homeLinksManager?.addEventListener('focusin',()=>{
  homeLinksEditing=true;
});

homeLinksManager?.addEventListener('input',e=>{
  const row=e.target.closest('[data-link-id]');
  const item=homeLinksDraft.find(v=>v.id===row?.dataset.linkId);
  const key=e.target.dataset.k;
  if(item&&key){
    item[key]=e.target.value;
    homeLinksEditing=true;
  }
});

homeLinksManager?.addEventListener('click',e=>{
  const row=e.target.closest('[data-link-id]');
  if(!row)return;

  const index=homeLinksDraft.findIndex(v=>v.id===row.dataset.linkId);
  if(index<0)return;

  if(e.target.closest('[data-remove]')){
    homeLinksDraft.splice(index,1);
    homeLinksEditing=true;
    renderHomeLinks();
    return;
  }

  if(e.target.closest('[data-up]')&&index>0){
    [homeLinksDraft[index-1],homeLinksDraft[index]]=[homeLinksDraft[index],homeLinksDraft[index-1]];
    homeLinksEditing=true;
    renderHomeLinks();
    return;
  }

  if(e.target.closest('[data-down]')&&index<homeLinksDraft.length-1){
    [homeLinksDraft[index+1],homeLinksDraft[index]]=[homeLinksDraft[index],homeLinksDraft[index+1]];
    homeLinksEditing=true;
    renderHomeLinks();
  }
});

document.querySelector('[data-save-home-links]')?.addEventListener('click',async()=>{
  homeLinksSaving=true;
  try{
    const clean=homeLinksDraft.map(normalizeHomeLink);
    await setDoc(doc(db,'home','main'),{links:clean},{merge:true});
    homeLinksDraft=clean;
    homeLinksEditing=false;
    if(homeLinksStatus)homeLinksStatus.textContent='바로가기를 저장했어요.';
  }catch(err){
    if(homeLinksStatus)homeLinksStatus.textContent='저장 실패: '+err.message;
  }finally{
    homeLinksSaving=false;
  }
});st.textContent='바로가기를 저장했어요.'}catch(err){st.textContent='저장 실패: '+err.message}});
document.addEventListener('click',async e=>{const b=e.target.closest('[data-debt-inline-edit]');if(!b)return;const ref=doc(db,'rouletteDebts',b.dataset.docId),snap=await getDoc(ref);if(!snap.exists())return;const items=debtItemsOf(snap.data()),item=items.find(x=>x.id===b.dataset.itemId);if(!item)return;const value=prompt('업보 내용을 수정해 주세요.',item.content||'');if(value===null||!value.trim())return;await updateDoc(ref,{items:items.map(x=>x.id===item.id?{...x,content:value.trim()}:x),updatedAt:serverTimestamp()})});
