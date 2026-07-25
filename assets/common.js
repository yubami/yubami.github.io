
const menu=document.querySelector(".menu"),links=document.querySelector(".links");
if(menu)menu.addEventListener("click",()=>links.classList.toggle("open"));
document.querySelectorAll(".links a").forEach(a=>a.addEventListener("click",()=>links.classList.remove("open")));
const search=document.querySelector("#search");
if(search)search.addEventListener("input",()=>{const q=search.value.toLowerCase();document.querySelectorAll("[data-searchable]").forEach(x=>x.style.display=x.dataset.searchable.toLowerCase().includes(q)?"":"none")});
