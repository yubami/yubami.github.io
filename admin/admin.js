import {initializeApp} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";
import {getAuth,signInWithEmailAndPassword,signOut,onAuthStateChanged} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";
import {getFirestore,collection,addDoc,updateDoc,deleteDoc,doc,getDoc,setDoc,query,orderBy,onSnapshot,serverTimestamp} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";
import {firebaseConfig,ADMIN_EMAIL} from "../assets/config.js";

const app=initializeApp(firebaseConfig),auth=getAuth(app),db=getFirestore(app),$=s=>document.querySelector(s);
const REPO="yubami/yubami.github.io",BRANCH="main";
const esc=s=>String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));
const parseTags=value=>[...new Set(String(value||"").split(/[#,\s]+/).map(x=>x.trim()).filter(Boolean))];

$("#loginForm").addEventListener("submit",async e=>{e.preventDefault();$("#loginStatus").textContent="로그인 중...";try{const c=await signInWithEmailAndPassword(auth,$("#email").value.trim(),$("#password").value);if(c.user.email!==ADMIN_EMAIL){await signOut(auth);throw new Error()}$("#loginStatus").textContent=""}catch{$("#loginStatus").textContent="이메일 또는 비밀번호를 확인해 주세요."}});
$("#logout").addEventListener("click",()=>signOut(auth));
document.querySelectorAll("[data-panel]").forEach(b=>b.addEventListener("click",()=>{document.querySelectorAll("[data-panel]").forEach(x=>x.classList.remove("active"));document.querySelectorAll(".panel").forEach(x=>x.classList.remove("active"));b.classList.add("active");$("#panel-"+b.dataset.panel).classList.add("active")}));

function preview(form,url){const box=form.querySelector('.image-preview');if(box)box.innerHTML=url?`<img src="${esc(url)}" alt="미리보기">`:''}
function renderTagPreview(form){const box=form.querySelector('.tag-preview'),input=form.querySelector('.tag-input');if(!box||!input)return;box.innerHTML=parseTags(input.value).map(t=>`<span class="tag">#${esc(t)}</span>`).join('')}
function reset(form){form.reset();if(form.elements._id)form.elements._id.value="";form.querySelector("[data-submit]").textContent="저장";form.querySelector("[data-cancel]")?.classList.add("hidden");preview(form,"");renderTagPreview(form)}
function formData(form){const out={};for(const[k,v]of new FormData(form)){if(k!=="_id")out[k]=typeof v==="string"?v.trim():v}if(out.difficulty)out.difficulty=Number(out.difficulty);if("tags" in out)out.tags=parseTags(out.tags);out.updatedAt=serverTimestamp();return out}

async function loadImages(select,keepValue=""){
  const folder=select.dataset.folder,path=`assets/images/${folder}`;
  select.disabled=true;select.innerHTML='<option value="">사진 목록 불러오는 중...</option>';
  try{
    const response=await fetch(`https://api.github.com/repos/${REPO}/contents/${path}?ref=${BRANCH}`,{headers:{Accept:"application/vnd.github+json"}});
    if(!response.ok)throw new Error(`GitHub 응답 ${response.status}`);
    const files=(await response.json()).filter(x=>x.type==="file"&&!x.name.startsWith('.')&&/\.(png|jpe?g|webp|gif)$/i.test(x.name));
    select.innerHTML='<option value="">사진 사용 안 함</option>'+files.map(x=>`<option value="/assets/images/${folder}/${encodeURIComponent(x.name)}">${esc(x.name)}</option>`).join('');
    if(keepValue&&![...select.options].some(o=>o.value===keepValue)){select.insertAdjacentHTML('beforeend',`<option value="${esc(keepValue)}">현재 저장된 사진</option>`)}
    select.value=keepValue||"";
  }catch(err){select.innerHTML='<option value="">목록 불러오기 실패 — GitHub 폴더 확인</option>';const status=select.form?.querySelector('.save-status');if(status)status.textContent='사진 폴더를 불러오지 못했어요. GitHub 배포가 끝났는지 확인해 주세요.';console.error(err)}finally{select.disabled=false;preview(select.form,select.value)}
}
async function refreshAllImages(){await Promise.all([...document.querySelectorAll('.image-picker')].map(s=>loadImages(s,s.value)))}

document.querySelectorAll('.image-picker').forEach(s=>s.addEventListener('change',()=>preview(s.form,s.value)));
document.querySelectorAll('.refresh-images').forEach(b=>b.addEventListener('click',()=>loadImages(b.form,b.form.querySelector('.image-picker')?.value||"")));
document.querySelectorAll('.tag-input').forEach(i=>i.addEventListener('input',()=>renderTagPreview(i.form)));

async function loadHome(){const f=document.querySelector('.singleton-form'),snap=await getDoc(doc(db,'home','main'));if(snap.exists()){const x=snap.data();for(const e of f.elements)if(e.name&&x[e.name]!==undefined)e.value=x[e.name];await loadImages(f.elements.imageUrl,x.imageUrl||"")}else await loadImages(f.elements.imageUrl)}

let started=false;
onAuthStateChanged(auth,user=>{const ok=user&&user.email===ADMIN_EMAIL;$("#loginView").classList.toggle("hidden",ok);$("#adminView").classList.toggle("hidden",!ok);if(ok){$("#adminEmail").textContent=user.email;if(!started){started=true;start()}}});

function start(){
  loadHome();
  [...document.querySelectorAll('.image-picker')].filter(s=>s.dataset.folder!=="home").forEach(s=>loadImages(s));
  const homeForm=document.querySelector('.singleton-form');
  homeForm.addEventListener('submit',async e=>{e.preventDefault();const b=homeForm.querySelector('[data-submit]'),status=homeForm.querySelector('.save-status');b.disabled=true;if(status)status.textContent='저장 중...';try{await setDoc(doc(db,'home','main'),formData(homeForm),{merge:true});if(status)status.textContent='저장 완료! 일반 사이트에서 Ctrl+F5로 확인해 주세요.';alert('홈 화면이 저장됐어요!')}catch(err){console.error(err);const permission=err?.code==='permission-denied'||String(err?.message||'').includes('permissions');if(status)status.textContent=permission?'저장 권한이 없어요. ZIP 안의 firestore.rules를 Firebase에 게시해 주세요.':'저장 실패: '+(err?.message||'알 수 없는 오류');alert(status?.textContent||'저장 중 오류가 발생했어요.')}finally{b.disabled=false}});
  document.querySelectorAll('.content-form').forEach(form=>{
    form.addEventListener('submit',async e=>{e.preventDefault();const b=form.querySelector('[data-submit]');b.disabled=true;try{const id=form.elements._id.value,data=formData(form);if(id)await updateDoc(doc(db,form.dataset.collection,id),data);else await addDoc(collection(db,form.dataset.collection),{...data,createdAt:serverTimestamp()});reset(form)}catch(err){alert(err.message||'저장 중 오류가 발생했어요.')}finally{b.disabled=false}});
    form.querySelector('[data-cancel]').addEventListener('click',()=>reset(form));
  });
  ['songs','notices','schedules','wardrobe','instagram','curiosity'].forEach(name=>{
    const el=document.querySelector(`[data-list="${name}"]`);
    onSnapshot(query(collection(db,name),orderBy('createdAt','desc')),snap=>{
      el.innerHTML=snap.empty?'<div class="empty">등록된 내용이 없어요.</div>':snap.docs.map(d=>{const x=d.data();return `<div class="manage-row"><div class="manage-copy">${x.imageUrl?`<img src="${esc(x.imageUrl)}" alt="">`:''}<div><h3>${esc(x.title||'제목 없음')}${x.artist?' · '+esc(x.artist):''}</h3><p>${esc(x.content||x.date||'')}</p>${(x.tags||[]).map(t=>`<span class="tag">#${esc(t)}</span>`).join('')}</div></div><div class="mini"><button class="soft" data-edit="${d.id}">수정</button><button class="danger" data-delete="${d.id}">삭제</button></div></div>`}).join('');
      el.querySelectorAll('[data-delete]').forEach(b=>b.addEventListener('click',async()=>{if(confirm('정말 삭제할까요?'))await deleteDoc(doc(db,name,b.dataset.delete))}));
      el.querySelectorAll('[data-edit]').forEach(b=>b.addEventListener('click',async()=>{const item=snap.docs.find(d=>d.id===b.dataset.edit),x=item.data(),form=document.querySelector(`form[data-collection="${name}"]`);form.elements._id.value=item.id;for(const e of form.elements){if(!e.name||e.name==='_id')continue;e.value=e.name==='tags'?(x.tags||[]).map(t=>'#'+t).join(' '):(x[e.name]??'')}if(form.querySelector('.image-picker'))await loadImages(form.querySelector('.image-picker'),x.imageUrl||"");preview(form,x.imageUrl||"");renderTagPreview(form);form.querySelector('[data-submit]').textContent='수정 저장';form.querySelector('[data-cancel]').classList.remove('hidden');form.scrollIntoView({behavior:'smooth',block:'start'})}));
    });
  });
}
