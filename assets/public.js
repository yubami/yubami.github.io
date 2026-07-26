
import {initializeApp} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";
import {getFirestore,collection,doc,query,orderBy,limit,onSnapshot} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";
import {firebaseConfig} from "./config.js";
const db=getFirestore(initializeApp(firebaseConfig));
const esc=s=>String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));
const br=s=>esc(s).replace(/\n/g,"<br>"), stars=n=>"★".repeat(Number(n)||0)+"☆".repeat(5-(Number(n)||0));
const empty=(el,msg)=>el.innerHTML=`<div class="empty">${esc(msg)}</div>`;
const homeImg=document.querySelector('[data-home-image]'),homeGallery=document.querySelector('[data-home-gallery]'),homePortrait=document.querySelector('[data-home-portrait]'),homeTitle=document.querySelector('[data-home-headline]'),homeDesc=document.querySelector('[data-home-description]'),homeMessage=document.querySelector('[data-home-message]'),homeMusicSection=document.querySelector('[data-home-music-section]'),homeMusicTitle=document.querySelector('[data-home-music-title]'),homeMusicAuthor=document.querySelector('[data-home-music-author]'),homeLinks=document.querySelector('[data-home-links]');
if(homeImg||homeGallery||homePortrait||homeTitle||homeDesc||homeMessage||homeMusicSection){onSnapshot(doc(db,'home','main'),s=>{if(!s.exists())return;const x=s.data();
  if(homeImg){if(x.imageUrl){homeImg.innerHTML=`<img src="${esc(x.imageUrl)}" alt="유바미 메인 이미지">`;homeImg.classList.add('has-image')}else{homeImg.innerHTML='';homeImg.classList.remove('has-image')}}
  if(homeGallery){const photos=(x.gallery||[]).slice(0,4);homeGallery.innerHTML=photos.map((url,i)=>`<figure class="hero-photo-card hero-photo-${i+1}"><img src="${esc(url)}" alt="유바미 사진 ${i+1}"></figure>`).join("")}if(homePortrait){
    const portraitUrl=x.imageUrl||x.imageUrl2||x.imageUrl3||x.imageUrl4||'';
    homePortrait.innerHTML=portraitUrl
      ? `<img src="${esc(portraitUrl)}" alt="유바미 메인 사진">`
      : '<div class="hero-portrait-placeholder">사진을 등록해 주세요</div>';
  }
  if(homeTitle&&x.headline!==undefined)homeTitle.innerHTML=br(x.headline||'YUBAMI');if(homeLinks){const a=Array.isArray(x.links)?x.links:[{icon:'📺',label:'유바미 본채널',url:'#'},{icon:'🎬',label:'유바미 서브채널',url:'#'},{icon:'▶',label:'다시보기 채널',url:'#'},{icon:'𝕏',label:'X 트위터',url:'#'},{icon:'☕',label:'팬카페',url:'#'}];homeLinks.innerHTML=a.map((l,i)=>`<a class="cozy-link cozy-link-${i%3}" href="${esc(l.url||'#')}" target="_blank" rel="noopener"><span>${esc(l.icon||'🐾')}</span>${esc(l.label||'바로가기')}<b>↗</b></a>`).join('')}if(homeDesc&&x.description!==undefined)homeDesc.innerHTML=br(x.description||'');if(homeMessage&&x.message!==undefined)homeMessage.innerHTML=br(x.message||'');if(homeMusicSection){homeMusicSection.hidden=!x.musicUrl;homeMusicSection.dataset.musicUrl=x.musicUrl||'';homeMusicSection.dataset.musicTitle=x.musicTitle||'오늘의 추천곡';homeMusicSection.dataset.musicAuthor=x.musicAuthor||'유바미가 좋아하는 음악';if(homeMusicTitle)homeMusicTitle.textContent=x.musicTitle||'오늘의 추천곡';if(homeMusicAuthor)homeMusicAuthor.textContent=x.musicAuthor||'유바미가 좋아하는 음악';window.dispatchEvent(new CustomEvent('yubami-music-change',{detail:{url:x.musicUrl||''}}))}
})}

const profileRoot=document.querySelector('[data-profile-root]');if(profileRoot){onSnapshot(doc(db,'profile','main'),snap=>{if(!snap.exists())return;const x=snap.data();const set=(sel,val,html=false)=>{const el=document.querySelector(sel);if(el&&val!==undefined)html?el.innerHTML=br(val||''):el.textContent=val||''};set('[data-profile-title]',x.title);set('[data-profile-subtitle]',x.subtitle);set('[data-profile-content]',x.content,true);set('[data-profile-birthday]',x.birthday);set('[data-profile-mbti]',x.mbti);set('[data-profile-main-content]',x.mainContent);const img=document.querySelector('[data-profile-image]');if(img)img.innerHTML=x.imageUrl?`<img src="${esc(x.imageUrl)}" alt="유바미 프로필 사진">`:''})}
function listen(name,render,max){const el=document.querySelector(`[data-collection="${name}"]`);if(!el)return;let q=query(collection(db,name),orderBy("createdAt","desc"));if(max)q=query(collection(db,name),orderBy("createdAt","desc"),limit(max));onSnapshot(q,s=>s.empty?empty(el,el.dataset.empty||"아직 등록된 내용이 없어요."):render(el,s.docs.map(d=>({id:d.id,...d.data()}))),()=>empty(el,"데이터를 불러오지 못했어요."))}
listen("notices",(el,a)=>el.innerHTML=a.map(x=>`<article class="row" data-searchable="${esc((x.title||"")+" "+(x.content||""))}"><div><h3>${esc(x.title||"제목 없음")}</h3><p>${br(x.content||"")}</p></div><span class="pill">${esc(x.date||"공지")}</span></article>`).join(""));
listen("schedules",(el,a)=>el.innerHTML=a.map(x=>`<article class="row" data-searchable="${esc((x.title||"")+" "+(x.content||"")+" "+(x.date||""))}"><div><h3>${esc(x.title||"방송")}</h3><p>${br(x.content||"")}</p></div><span class="pill">${esc(x.date||"일정")}${x.time?" · "+esc(x.time):""}</span></article>`).join(""));
listen("instagram",(el,a)=>{
  el.innerHTML=a.map(x=>`<article class="card photo bami-card" tabindex="0" role="button" data-bami-id="${esc(x.id)}" data-searchable="${esc((x.title||"")+" "+(x.content||""))}">${x.imageUrl?`<img src="${esc(x.imageUrl)}" alt="${esc(x.title||'바미스타그램')}">`:""}<div class="copy"><h3>${esc(x.title||"제목 없음")}</h3><p>${br(x.content||"")}</p>${x.downloadAllowed?'<span class="download-ok">⬇ 다운로드 가능</span>':''}</div></article>`).join("");
  const map=new Map(a.map(x=>[x.id,x]));
  const openCard=card=>{const x=map.get(card.dataset.bamiId);if(!x)return;let dialog=document.querySelector('[data-bami-dialog]');if(!dialog){dialog=document.createElement('dialog');dialog.className='bami-dialog';dialog.dataset.bamiDialog='';dialog.innerHTML='<button class="bami-dialog-close" type="button" aria-label="닫기">×</button><div data-bami-detail></div>';document.body.appendChild(dialog);dialog.querySelector('.bami-dialog-close').addEventListener('click',()=>dialog.close());dialog.addEventListener('click',e=>{if(e.target===dialog)dialog.close()})}const detail=dialog.querySelector('[data-bami-detail]');detail.innerHTML=`${x.imageUrl?`<img src="${esc(x.imageUrl)}" alt="${esc(x.title||'바미스타그램')}">`:''}<div class="bami-dialog-copy"><h2>${esc(x.title||'제목 없음')}</h2><p>${br(x.content||'')}</p>${x.downloadAllowed&&x.imageUrl?`<a class="btn primary" href="${esc(cloudinaryDownload(x.imageUrl))}" download target="_blank" rel="noopener">사진 다운로드</a>`:''}</div>`;dialog.showModal()};
  el.querySelectorAll('[data-bami-id]').forEach(card=>{card.addEventListener('click',()=>openCard(card));card.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();openCard(card)}})});
});
function cloudinaryDownload(url){return String(url||'').includes('/upload/')?String(url).replace('/upload/','/upload/fl_attachment/'):url}

const wardrobeRoot=document.querySelector('[data-collection="wardrobe"]');
if(wardrobeRoot){let wardrobeItems=[],wardrobeCollections=[];const renderWardrobe=()=>{const collectionNames=[...new Set([...wardrobeCollections.map(x=>x.title).filter(Boolean),...wardrobeItems.map(x=>x.category).filter(Boolean)])];const sorted=collectionNames.sort((a,b)=>{const aa=wardrobeCollections.find(x=>x.title===a),bb=wardrobeCollections.find(x=>x.title===b);return (Number(aa?.sortOrder)||0)-(Number(bb?.sortOrder)||0)||a.localeCompare(b,'ko')});const filters=document.querySelector('[data-wardrobe-dynamic-filters]');if(filters)filters.innerHTML='<button class="wardrobe-filter active" type="button" data-wardrobe-filter="all">전체</button>'+sorted.map(name=>`<button class="wardrobe-filter" type="button" data-wardrobe-filter="${esc(name)}">${esc(name)}</button>`).join('');wardrobeRoot.innerHTML=sorted.map(category=>{const items=wardrobeItems.filter(x=>(x.category||'미분류')===category);return `<section class="wardrobe-month" data-wardrobe-group="${esc(category)}"><div class="wardrobe-month-head"><div><span class="kicker">COLLECTION</span><h2>${esc(category)}</h2></div><span class="wardrobe-count">${items.length}</span></div>${['의상','헤어'].map(type=>{const group=items.filter(x=>(x.subcategory||'의상')===type);return `<div class="wardrobe-type"><h3>${esc(type)} <small>${group.length}</small></h3><div class="wardrobe-mini-grid">${group.length?group.map(x=>`<article class="wardrobe-mini-card" data-searchable="${esc((x.title||'')+' '+(x.content||'')+' '+category+' '+type)}">${x.imageUrl?`<img src="${esc(x.imageUrl)}" alt="${esc(x.title||type)}">`:''}<div class="wardrobe-mini-copy"><b>${esc(x.title||'제목 없음')}</b>${x.content?`<p>${br(x.content)}</p>`:''}</div></article>`).join(''):`<div class="empty wardrobe-mini-empty">등록된 ${esc(type)}가 없어요.</div>`}</div></div>`}).join('')}</section>`}).join('')||'<div class="empty">아직 만든 옷장 카테고리가 없어요.</div>';const buttons=[...document.querySelectorAll('[data-wardrobe-filter]')];buttons.forEach(button=>button.addEventListener('click',()=>{const value=button.dataset.wardrobeFilter;document.querySelectorAll('[data-wardrobe-group]').forEach(section=>section.style.display=value==='all'||section.dataset.wardrobeGroup===value?'':'none');buttons.forEach(b=>b.classList.toggle('active',b===button))}))};onSnapshot(query(collection(db,'wardrobe'),orderBy('createdAt','desc')),s=>{wardrobeItems=s.docs.map(d=>({id:d.id,...d.data()}));renderWardrobe()});onSnapshot(query(collection(db,'wardrobeCollections'),orderBy('createdAt','desc')),s=>{wardrobeCollections=s.docs.map(d=>({id:d.id,...d.data()}));renderWardrobe()})}


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


listen("siteRules",(el,a)=>{
  const sorted=[...a].sort((x,y)=>(Number(x.sortOrder)||0)-(Number(y.sortOrder)||0));
  el.innerHTML=sorted.map((x,i)=>`<article class="rule-card card"><div class="rule-number">${String(i+1).padStart(2,'0')}</div><div><h2>${esc(x.title||'규칙')}</h2><div class="rule-content">${br(x.content||'')}</div></div></article>`).join('');
});
listen("rouletteDebts",(el,a)=>{
  const normalized=a.map(x=>({...x,items:Array.isArray(x.items)?x.items:(x.content?[{id:'legacy',content:x.content,completed:false}]:[])}));
  el.innerHTML=normalized.map(x=>{const remaining=x.items.filter(i=>!i.completed).length;return `<button type="button" class="debt-card card" data-debt-id="${esc(x.id)}"><div class="debt-count"><strong>${x.items.length}</strong><span>업보</span></div><div class="debt-card-copy"><span class="kicker">VIEWER</span><h2>${esc(x.viewerName||'이름 없음')}</h2><p>남은 업보 ${remaining}개 · 완료 ${x.items.length-remaining}개</p><div class="debt-preview">${x.items.slice(0,3).map(i=>`<span class="${i.completed?'is-complete':''}">${esc(i.content||'')}</span>`).join('')}</div></div><span class="debt-arrow">›</span></button>`}).join('');
  const map=new Map(normalized.map(x=>[x.id,x])),dialog=document.querySelector('[data-debt-dialog]'),detail=document.querySelector('[data-debt-detail]');
  el.querySelectorAll('[data-debt-id]').forEach(button=>button.addEventListener('click',()=>{const x=map.get(button.dataset.debtId);if(!x||!dialog||!detail)return;const remaining=x.items.filter(i=>!i.completed).length;detail.innerHTML=`<div class="kicker">ROULETTE HISTORY</div><h2>${esc(x.viewerName||'이름 없음')}</h2><div class="debt-detail-meta"><span>아이디</span><b>${esc(x.viewerId||'미등록')}</b><span>남은 업보</span><b>${remaining}개</b></div><div class="debt-detail-list">${x.items.map((i,n)=>`<div class="debt-detail-item ${i.completed?'is-complete':''}"><b>${n+1}</b><span>${esc(i.content||'')}</span>${i.completed?'<em>완료</em>':''}</div>`).join('')||'<p>등록된 업보가 없어요.</p>'}</div>`;dialog.showModal()}));
});
document.querySelector('[data-debt-close]')?.addEventListener('click',()=>document.querySelector('[data-debt-dialog]')?.close());
document.querySelector('[data-debt-dialog]')?.addEventListener('click',e=>{if(e.target===e.currentTarget)e.currentTarget.close()});

listen("embers",(el,a)=>el.innerHTML=a.map(x=>`<article class="card photo ember-card" data-searchable="${esc((x.title||"")+" "+(x.content||"")+" "+(x.number||""))}">${x.imageUrl?`<img src="${esc(x.imageUrl)}" alt="${esc(x.title||'불씨')} 사진">`:""}<div class="copy">${x.number?`<span class="pill">NO. ${esc(x.number)}</span>`:""}<h3>${esc(x.title||"불씨 기록")}</h3><p>${br(x.content||"")}</p></div></article>`).join(""));



const debtSubtitle=document.querySelector('[data-debt-subtitle]');if(debtSubtitle){onSnapshot(doc(db,'debtPage','main'),s=>{if(s.exists())debtSubtitle.innerHTML=br(s.data().subtitle||'')})}

const weeklyRoot=document.querySelector('[data-weekly-calendar]');const monthRoot=document.querySelector('[data-month-calendar]');if(weeklyRoot||monthRoot){let allSchedules=[],viewDate=new Date();const dateKey=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;const renderWeek=()=>{if(!weeklyRoot)return;const today=new Date(),day=today.getDay(),monday=new Date(today);monday.setDate(today.getDate()-((day+6)%7));monday.setHours(0,0,0,0);weeklyRoot.innerHTML=Array.from({length:7},(_,i)=>{const d=new Date(monday);d.setDate(monday.getDate()+i);const key=dateKey(d),items=allSchedules.filter(x=>x.date===key);return `<article class="week-day ${key===dateKey(today)?'today':''}"><div class="week-date"><span>${['월','화','수','목','금','토','일'][i]}</span><b>${d.getDate()}</b></div><div class="week-events">${items.length?items.map(x=>`<div class="week-event"><strong>${esc(x.title||'방송')}</strong>${x.time?`<small>${esc(x.time)}</small>`:''}</div>`).join(''):'<span class="week-empty">휴식 또는 미정</span>'}</div></article>`}).join('')};const renderMonth=()=>{if(!monthRoot)return;const y=viewDate.getFullYear(),m=viewDate.getMonth();document.querySelector('[data-calendar-label]').textContent=`${y}년 ${m+1}월`;const first=new Date(y,m,1),last=new Date(y,m+1,0),start=(first.getDay()+6)%7;let html=['월','화','수','목','금','토','일'].map(x=>`<div class="calendar-weekday">${x}</div>`).join('');for(let i=0;i<start;i++)html+='<div class="calendar-cell muted"></div>';for(let d=1;d<=last.getDate();d++){const date=new Date(y,m,d),key=dateKey(date),items=allSchedules.filter(x=>x.date===key);html+=`<div class="calendar-cell ${key===dateKey(new Date())?'today':''}"><div class="calendar-day">${d}</div><div class="calendar-events">${items.map(x=>`<div class="calendar-event"><b>${esc(x.title||'방송')}</b>${x.time?`<small>${esc(x.time)}</small>`:''}${x.content?`<span>${esc(x.content)}</span>`:''}</div>`).join('')}</div></div>`}monthRoot.innerHTML=html};onSnapshot(query(collection(db,'schedules'),orderBy('createdAt','desc')),s=>{allSchedules=s.docs.map(d=>({id:d.id,...d.data()}));renderWeek();renderMonth()});document.querySelector('[data-calendar-prev]')?.addEventListener('click',()=>{viewDate=new Date(viewDate.getFullYear(),viewDate.getMonth()-1,1);renderMonth()});document.querySelector('[data-calendar-next]')?.addEventListener('click',()=>{viewDate=new Date(viewDate.getFullYear(),viewDate.getMonth()+1,1);renderMonth()});document.querySelector('[data-calendar-today]')?.addEventListener('click',()=>{viewDate=new Date();renderMonth()})}


// V7.14 고양이 CD 플레이어
let yubamiMusicPlayer=null;
let yubamiMusicVideoId='';
let yubamiMusicReadyPromise=null;
let yubamiMusicState='paused';

function getYoutubeId(raw){
  try{
    const u=new URL(raw);
    if(u.hostname==='youtu.be')return u.pathname.slice(1).split('/')[0];
    if(u.pathname.startsWith('/shorts/'))return u.pathname.split('/')[2];
    if(u.pathname.startsWith('/embed/'))return u.pathname.split('/')[2];
    return u.searchParams.get('v')||'';
  }catch{return ''}
}
function loadYoutubeAPI(){
  if(window.YT?.Player)return Promise.resolve();
  if(yubamiMusicReadyPromise)return yubamiMusicReadyPromise;
  yubamiMusicReadyPromise=new Promise(resolve=>{
    const previous=window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady=()=>{if(typeof previous==='function')previous();resolve()};
    if(!document.querySelector('script[src="https://www.youtube.com/iframe_api"]')){
      const script=document.createElement('script');
      script.src='https://www.youtube.com/iframe_api';
      document.head.appendChild(script);
    }
  });
  return yubamiMusicReadyPromise;
}
function storedVolume(){
  const raw=localStorage.getItem('yubamiMusicVolume');
  const value=raw===null?70:Number(raw);
  return Number.isFinite(value)?Math.max(0,Math.min(100,value)):70;
}
function syncVolume(value){
  document.querySelectorAll('[data-music-volume]').forEach(el=>el.value=String(value));
  document.querySelectorAll('[data-music-volume-value]').forEach(el=>el.textContent=value+'%');
  document.querySelectorAll('[data-music-mute]').forEach(el=>{el.textContent=value===0?'🔇':'🔊';el.setAttribute('aria-label',value===0?'소리 켜기':'음소거')});
}
function syncPlayState(state){
  yubamiMusicState=state;
  const playing=state==='playing';
  document.querySelectorAll('[data-music-play]').forEach(el=>{el.textContent=playing?'⏸':'▶';el.setAttribute('aria-label',playing?'일시정지':'재생')});
  const cd=document.querySelector('[data-cat-cd]'),stage=document.querySelector('[data-cat-stage]');cd?.classList.toggle('is-playing',playing);if(playing&&stage){stage.classList.remove('play-start');void stage.offsetWidth;stage.classList.add('play-start');setTimeout(()=>stage.classList.remove('play-start'),1200)}
}
function applyVolume(value){
  const normalized=Math.max(0,Math.min(100,Number(value)||0));
  localStorage.setItem('yubamiMusicVolume',String(normalized));
  syncVolume(normalized);
  if(yubamiMusicPlayer?.setVolume){
    yubamiMusicPlayer.setVolume(normalized);
    normalized===0?yubamiMusicPlayer.mute():yubamiMusicPlayer.unMute();
  }
}
async function createMusicPlayer(){
  const section=document.querySelector('[data-home-music-section]');
  const id=getYoutubeId(section?.dataset.musicUrl||'');
  if(!id)return;
  await loadYoutubeAPI();
  if(yubamiMusicPlayer?.destroy){try{yubamiMusicPlayer.destroy()}catch(_){}}
  yubamiMusicVideoId=id;
  yubamiMusicPlayer=new YT.Player('yubamiMusicPlayer',{
    videoId:id,
    playerVars:{
      autoplay:0,controls:0,disablekb:1,fs:0,iv_load_policy:3,modestbranding:1,playsinline:1,rel:0
    },
    events:{
      onReady:event=>{
        const iframe=event.target.getIframe?.();
        if(iframe){
          iframe.classList.add('cat-cd-iframe');
          iframe.setAttribute('tabindex','-1');
        }
        const volume=storedVolume();
        event.target.setVolume(volume);
        if(volume===0)event.target.mute();else event.target.unMute();
        syncVolume(volume);
        syncPlayState('paused');
      },
      onStateChange:event=>{
        if(event.data===YT.PlayerState.PLAYING)syncPlayState('playing');
        if(event.data===YT.PlayerState.PAUSED||event.data===YT.PlayerState.ENDED)syncPlayState('paused');
      }
    }
  });
}
document.addEventListener('click',async e=>{
  const play=e.target.closest('[data-music-play]');
  if(play){
    if(!yubamiMusicPlayer)await createMusicPlayer();
    if(!yubamiMusicPlayer)return;
    if(yubamiMusicState==='playing')yubamiMusicPlayer.pauseVideo();
    else yubamiMusicPlayer.playVideo();
    return;
  }
  const mute=e.target.closest('[data-music-mute]');
  if(mute){
    const current=storedVolume();
    if(current===0){
      const previous=Number(localStorage.getItem('yubamiMusicPreviousVolume'))||70;
      applyVolume(previous);
    }else{
      localStorage.setItem('yubamiMusicPreviousVolume',String(current));
      applyVolume(0);
    }
  }
});
document.addEventListener('input',e=>{
  const slider=e.target.closest('[data-music-volume]');
  if(slider)applyVolume(slider.value);
});
window.addEventListener('yubami-music-change',async e=>{
  const nextId=getYoutubeId(e.detail?.url||'');
  if(!nextId||nextId===yubamiMusicVideoId)return;
  if(yubamiMusicPlayer?.loadVideoById){
    yubamiMusicVideoId=nextId;
    yubamiMusicPlayer.cueVideoById(nextId);
    syncPlayState('paused');
  }
});
document.addEventListener('DOMContentLoaded',()=>{
  syncVolume(storedVolume());
  createMusicPlayer();
});

const bs=document.querySelector('[data-bulssinyang]'),bubble=document.querySelector('[data-bulssinyang-bubble]');const lines=['모닥불 앞에서 쉬다 가냥!','불씨단 안녕!','오늘도 방송 보러 가냥!','10시에 다시 만나냥!','유바미 기다리고 있었냥!'];bs?.addEventListener('click',e=>{e.stopPropagation();bubble.textContent=lines[Math.floor(Math.random()*lines.length)];bubble.hidden=false;clearTimeout(window.bsTimer);window.bsTimer=setTimeout(()=>bubble.hidden=true,2500)});document.addEventListener('pointerdown',e=>{if(e.button!==0)return;const p=document.createElement('span');p.className='click-paw';p.textContent='🐾';p.style.left=e.clientX+'px';p.style.top=e.clientY+'px';p.style.setProperty('--r',(Math.random()*40-20)+'deg');document.body.appendChild(p);p.addEventListener('animationend',()=>p.remove())});
