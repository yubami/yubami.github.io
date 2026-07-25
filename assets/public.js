
import {initializeApp} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";
import {getFirestore,collection,doc,query,orderBy,limit,onSnapshot} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";
import {firebaseConfig} from "./config.js";
const db=getFirestore(initializeApp(firebaseConfig));
const esc=s=>String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));
const br=s=>esc(s).replace(/\n/g,"<br>"), stars=n=>"★".repeat(Number(n)||0)+"☆".repeat(5-(Number(n)||0));
const empty=(el,msg)=>el.innerHTML=`<div class="empty">${esc(msg)}</div>`;
const homeImg=document.querySelector('[data-home-image]'),homeGallery=document.querySelector('[data-home-gallery]'),homeTitle=document.querySelector('[data-home-headline]'),homeDesc=document.querySelector('[data-home-description]');
if(homeImg||homeGallery||homeTitle||homeDesc){onSnapshot(doc(db,'home','main'),s=>{if(!s.exists())return;const x=s.data();
  if(homeImg){if(x.imageUrl){homeImg.innerHTML=`<img src="${esc(x.imageUrl)}" alt="유바미 메인 이미지">`;homeImg.classList.add('has-image')}else{homeImg.innerHTML='';homeImg.classList.remove('has-image')}}
  if(homeGallery){const images=[x.imageUrl,x.imageUrl2,x.imageUrl3,x.imageUrl4].filter(Boolean);homeGallery.dataset.count=String(images.length);homeGallery.innerHTML=images.map((url,i)=>`<figure class="hero-gallery-item item-${i+1}"><img src="${esc(url)}" alt="유바미 메인 사진 ${i+1}"></figure>`).join('');homeGallery.classList.toggle('empty',images.length===0)}
  if(homeTitle&&x.headline!==undefined)homeTitle.innerHTML=br(x.headline||'YUBAMI');if(homeDesc&&x.description!==undefined)homeDesc.innerHTML=br(x.description||'')
})}

const profileRoot=document.querySelector('[data-profile-root]');if(profileRoot){onSnapshot(doc(db,'profile','main'),snap=>{if(!snap.exists())return;const x=snap.data();const set=(sel,val,html=false)=>{const el=document.querySelector(sel);if(el&&val!==undefined)html?el.innerHTML=br(val||''):el.textContent=val||''};set('[data-profile-title]',x.title);set('[data-profile-subtitle]',x.subtitle);set('[data-profile-content]',x.content,true);set('[data-profile-birthday]',x.birthday);set('[data-profile-mbti]',x.mbti);set('[data-profile-main-content]',x.mainContent);const img=document.querySelector('[data-profile-image]');if(img)img.innerHTML=x.imageUrl?`<img src="${esc(x.imageUrl)}" alt="유바미 프로필 사진">`:''})}
function listen(name,render,max){const el=document.querySelector(`[data-collection="${name}"]`);if(!el)return;let q=query(collection(db,name),orderBy("createdAt","desc"));if(max)q=query(collection(db,name),orderBy("createdAt","desc"),limit(max));onSnapshot(q,s=>s.empty?empty(el,el.dataset.empty||"아직 등록된 내용이 없어요."):render(el,s.docs.map(d=>({id:d.id,...d.data()}))),()=>empty(el,"데이터를 불러오지 못했어요."))}
listen("notices",(el,a)=>el.innerHTML=a.map(x=>`<article class="row" data-searchable="${esc((x.title||"")+" "+(x.content||""))}"><div><h3>${esc(x.title||"제목 없음")}</h3><p>${br(x.content||"")}</p></div><span class="pill">${esc(x.date||"공지")}</span></article>`).join(""));
listen("schedules",(el,a)=>el.innerHTML=a.map(x=>`<article class="row" data-searchable="${esc((x.title||"")+" "+(x.content||"")+" "+(x.date||""))}"><div><h3>${esc(x.title||"방송")}</h3><p>${br(x.content||"")}</p></div><span class="pill">${esc(x.date||"일정")}${x.time?" · "+esc(x.time):""}</span></article>`).join(""));
listen("instagram",(el,a)=>el.innerHTML=a.map(x=>`<article class="card photo" data-searchable="${esc((x.title||"")+" "+(x.content||""))}">${x.imageUrl?`<img src="${esc(x.imageUrl)}" alt="">`:""}<div class="copy"><h3>${esc(x.title||"제목 없음")}</h3><p>${br(x.content||"")}</p></div></article>`).join(""));

listen("wardrobe",(el,a)=>{
  const order=[["오리지널","헤어"],["오리지널","의상"],["기존 옷","헤어"],["기존 옷","의상"]];
  const normalized=a.map(x=>({...x,category:x.category||"기존 옷",subcategory:x.subcategory||"의상"}));
  el.innerHTML=order.map(([category,subcategory])=>{
    const items=normalized.filter(x=>x.category===category&&x.subcategory===subcategory);
    return `<section class="wardrobe-section" data-wardrobe-group="${esc(category+'|'+subcategory)}"><div class="wardrobe-section-head"><div><span class="kicker">${esc(category)}</span><h2>${esc(subcategory)}</h2></div><span class="wardrobe-count">${items.length}</span></div><div class="grid wardrobe-grid">${items.length?items.map(x=>`<article class="card photo wardrobe-item" data-searchable="${esc((x.title||"")+" "+(x.content||"")+" "+category+" "+subcategory)}">${x.imageUrl?`<img src="${esc(x.imageUrl)}" alt="${esc(x.title||'옷장 이미지')}">`:""}<div class="copy"><div class="wardrobe-badges"><span class="tag">${esc(category)}</span><span class="tag">${esc(subcategory)}</span></div><h3>${esc(x.title||"제목 없음")}</h3><p>${br(x.content||"")}</p></div></article>`).join(""):`<div class="empty wardrobe-empty">아직 등록된 ${esc(subcategory)}가 없어요.</div>`}</div></section>`;
  }).join("");
  const buttons=[...document.querySelectorAll('[data-wardrobe-filter]')];
  const applyFilter=value=>{document.querySelectorAll('[data-wardrobe-group]').forEach(section=>section.style.display=value==='all'||section.dataset.wardrobeGroup===value?'':'none');buttons.forEach(b=>b.classList.toggle('active',b.dataset.wardrobeFilter===value))};
  buttons.forEach(button=>button.addEventListener('click',()=>applyFilter(button.dataset.wardrobeFilter)));
});
listen("curiosity",(el,a)=>el.innerHTML=a.map(x=>`<article class="card tile" data-searchable="${esc((x.title||"")+" "+(x.content||""))}"><div class="icon">📚</div><h3>${esc(x.title||"호기심 노트")}</h3><p>${br(x.content||"")}</p></article>`).join(""));
listen("songs",(el,a)=>{
  const categories=["KPOP","JPOP","JPOP(한국어 ver)","POP"];
  const normalized=a.map(x=>({...x,category:x.category||"KPOP"}));
  el.innerHTML=categories.map(category=>{
    const songs=normalized.filter(x=>x.category===category);
    return `<section class="card pad song-category-section" data-song-category="${esc(category)}"><div class="song-category-head"><span class="kicker">CATEGORY</span><h2>${esc(category)}</h2><span class="song-count">${songs.length}</span></div><div class="list">${songs.length?songs.map(x=>`<article class="row song-row" data-searchable="${esc((x.artist||"")+" "+(x.title||"")+" "+(x.tags||[]).join(" ")+" "+category)}">${x.imageUrl?`<img class="song-cover" src="${esc(x.imageUrl)}" alt="${esc(x.title||'노래')} 커버">`:''}<div class="song-copy"><div class="song-meta"><span class="tag">${esc(category)}</span><span class="song-artist">${esc(x.artist||"가수 미등록")}</span></div><h3>${esc(x.title||"제목 없음")}</h3><div>${(x.tags||[]).map(t=>`<span class="tag">#${esc(t)}</span>`).join("")}</div></div><span class="stars">${stars(x.difficulty)}</span></article>`).join(""):`<div class="empty">아직 등록된 ${esc(category)} 노래가 없어요.</div>`}</div></section>`;
  }).join("");
  const buttons=[...document.querySelectorAll('[data-song-filter]')];
  const apply=value=>{document.querySelectorAll('[data-song-category]').forEach(section=>section.style.display=value==='all'||section.dataset.songCategory===value?'':'none');buttons.forEach(b=>b.classList.toggle('active',b.dataset.songFilter===value))};
  buttons.forEach(button=>button.addEventListener('click',()=>apply(button.dataset.songFilter)));
});
listen("notices",(el,a)=>el.innerHTML=a.map(x=>`<article class="row"><div><h3>${esc(x.title||"제목 없음")}</h3><p>${br(x.content||"")}</p></div><span class="pill">${esc(x.date||"공지")}</span></article>`).join(""),3);
listen("schedules",(el,a)=>el.innerHTML=a.map(x=>`<article class="row"><div><h3>${esc(x.title||"방송")}</h3><p>${br(x.content||"")}</p></div><span class="pill">${esc(x.date||"일정")}</span></article>`).join(""),1);

listen("embers",(el,a)=>el.innerHTML=a.map(x=>`<article class="card photo ember-card" data-searchable="${esc((x.title||"")+" "+(x.content||"")+" "+(x.number||""))}">${x.imageUrl?`<img src="${esc(x.imageUrl)}" alt="${esc(x.title||'불씨')} 사진">`:""}<div class="copy">${x.number?`<span class="pill">NO. ${esc(x.number)}</span>`:""}<h3>${esc(x.title||"불씨 기록")}</h3><p>${br(x.content||"")}</p></div></article>`).join(""));
