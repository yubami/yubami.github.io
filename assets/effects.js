(()=>{
 const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
 const ambient=document.getElementById('ambientLights');
 if(ambient&&!reduce){
   const count=innerWidth<600?9:16;
   for(let i=0;i<count;i++){
     const light=document.createElement('i');
     light.className='ambient-light';
     light.style.setProperty('--x',`${4+Math.random()*92}%`);
     light.style.setProperty('--size',`${3+Math.random()*7}px`);
     light.style.setProperty('--duration',`${10+Math.random()*12}s`);
     light.style.setProperty('--delay',`${-Math.random()*18}s`);
     light.style.setProperty('--drift',`${-35+Math.random()*70}px`);
     ambient.append(light);
   }
 }
 const layer=document.getElementById('cursorStars');
 if(!layer||reduce||matchMedia('(pointer: coarse)').matches)return;
 let last=0;
 addEventListener('pointermove',e=>{
   const now=performance.now(); if(now-last<55)return; last=now;
   const star=document.createElement('b'); star.className='cursor-star';
   star.textContent=Math.random()>.65?'✦':'·';
   star.style.left=`${e.clientX}px`;star.style.top=`${e.clientY}px`;
   star.style.setProperty('--dx',`${-14+Math.random()*28}px`);
   star.style.setProperty('--dy',`${-8-Math.random()*22}px`);
   star.style.fontSize=`${8+Math.random()*9}px`;
   layer.append(star);setTimeout(()=>star.remove(),850);
 });
})();

/* V8.9 decorative sky only: no data, navigation, auth or admin logic */
(()=>{
 const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
 const body=document.body;
 if(!body||document.querySelector('.cute-sky-layer')) return;
 const sky=document.createElement('div');
 sky.className='cute-sky-layer';
 sky.setAttribute('aria-hidden','true');
 const cloudKinds=['cat','','paw','cat','','paw'];
 cloudKinds.forEach((kind,index)=>{
   const cloud=document.createElement('i');
   cloud.className=`cute-cloud ${kind}`.trim();
   cloud.style.setProperty('--y',`${7+(index*15)%78}vh`);
   cloud.style.setProperty('--scale',String(.58+(index%3)*.18));
   cloud.style.setProperty('--speed',`${38+index*7}s`);
   cloud.style.animationDelay=`-${index*9}s`;
   if(kind==='cat') cloud.innerHTML='<span class="ear left"></span><span class="ear right"></span><span class="blush"></span>';
   sky.append(cloud);
 });
 for(let i=0;i<(innerWidth<700?10:18);i++){
   const sparkle=document.createElement('b');
   sparkle.className='morning-sparkle';
   sparkle.style.left=`${3+Math.random()*94}%`;
   sparkle.style.top=`${4+Math.random()*88}%`;
   sparkle.style.setProperty('--twinkle',`${2.4+Math.random()*3.6}s`);
   sparkle.style.animationDelay=`-${Math.random()*4}s`;
   sky.append(sparkle);
 }
 body.prepend(sky);
 if(reduce)return;
 const wipe=document.createElement('div');
 wipe.className='theme-cloud-wipe';
 wipe.setAttribute('aria-hidden','true');
 wipe.innerHTML='<i></i><i></i><i></i>';
 body.append(wipe);
 let previous=document.documentElement.dataset.theme;
 new MutationObserver(()=>{
   const current=document.documentElement.dataset.theme;
   if(current===previous)return;
   previous=current;
   wipe.classList.remove('show');
   void wipe.offsetWidth;
   wipe.classList.add('show');
 }).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});
 wipe.addEventListener('animationend',()=>wipe.classList.remove('show'));
})();
