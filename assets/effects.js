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
