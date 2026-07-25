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
