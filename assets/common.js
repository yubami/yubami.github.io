const THEME_KEY="yubami-theme";
const root=document.documentElement;
const savedTheme=localStorage.getItem(THEME_KEY);
const initialTheme=savedTheme==="morning"||savedTheme==="night"?savedTheme:"night";

function applyTheme(theme){
  root.dataset.theme=theme;
  localStorage.setItem(THEME_KEY,theme);
  document.querySelectorAll("[data-theme-choice]").forEach(button=>{
    const active=button.dataset.themeChoice===theme;
    button.classList.toggle("active",active);
    button.setAttribute("aria-pressed",String(active));
  });
  const meta=document.querySelector('meta[name="theme-color"]');
  if(meta)meta.content=theme==="morning"?"#dff1ff":"#080d28";
}
applyTheme(initialTheme);
document.querySelectorAll("[data-theme-choice]").forEach(button=>button.addEventListener("click",()=>applyTheme(button.dataset.themeChoice)));

const menu=document.querySelector(".menu"),links=document.querySelector(".links");
if(menu&&links)menu.addEventListener("click",()=>links.classList.toggle("open"));
document.querySelectorAll(".links a").forEach(a=>a.addEventListener("click",()=>links?.classList.remove("open")));
const search=document.querySelector("#search");
if(search)search.addEventListener("input",()=>{const q=search.value.toLowerCase();document.querySelectorAll("[data-searchable]").forEach(x=>x.style.display=x.dataset.searchable.toLowerCase().includes(q)?"":"none")});

// V8.8 — official-site polish (public pages only)
(()=>{
  if(document.body.closest('.admin-page') || location.pathname.includes('/admin/')) return;
  const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;

  // A lightweight first-visit loading scene. It never blocks Firebase/data loading.
  if(!sessionStorage.getItem('yubami-loader-seen') && !reduce){
    const loader=document.createElement('div');
    loader.className='site-loader';
    loader.setAttribute('aria-hidden','true');
    loader.innerHTML='<div class="site-loader-inner"><div class="site-loader-cat">🔥🐈</div><div class="site-loader-title">YUBAMI</div><div class="site-loader-copy">불꽃 고양이의 공간을 여는 중</div><div class="site-loader-dots"><i></i><i></i><i></i></div></div>';
    document.body.prepend(loader);
    sessionStorage.setItem('yubami-loader-seen','1');
    const hide=()=>{loader.classList.add('is-hidden');setTimeout(()=>loader.remove(),650)};
    addEventListener('load',()=>setTimeout(hide,420),{once:true});
    setTimeout(hide,2200);
  }

  // Reveal major sections as they enter the viewport.
  const revealTargets=[...document.querySelectorAll('main > section, main .shell > .page-title, main .shell > .lead, main .shell > .toolbar, main .shell > .grid, main .shell > .list, main .shell > .card, main .shell > [data-collection], .quick-strip > *, .home-grid > *')];
  revealTargets.forEach((el,index)=>{el.dataset.reveal='';el.style.transitionDelay=`${Math.min(index%6,5)*55}ms`});
  if(revealTargets.length){
    document.documentElement.classList.add('reveal-ready');
    if('IntersectionObserver' in window&&!reduce){
      const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('is-visible');observer.unobserve(entry.target)}}),{threshold:.08,rootMargin:'0px 0px -40px'});
      revealTargets.forEach(el=>observer.observe(el));
    }else revealTargets.forEach(el=>el.classList.add('is-visible'));
  }

  // Smooth transition between internal HTML pages, excluding downloads/new tabs/hash links.
  document.addEventListener('click',event=>{
    const anchor=event.target.closest('a[href]');
    if(!anchor||event.defaultPrevented||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey) return;
    if(anchor.target==='_blank'||anchor.hasAttribute('download')) return;
    const url=new URL(anchor.href,location.href);
    if(url.origin!==location.origin||url.pathname===location.pathname&&url.search===location.search||anchor.getAttribute('href').startsWith('#')) return;
    if(!/\.html$|\/$/.test(url.pathname)) return;
    event.preventDefault();
    document.body.classList.add('is-page-leaving');
    setTimeout(()=>location.href=url.href,reduce?0:230);
  });
})();
