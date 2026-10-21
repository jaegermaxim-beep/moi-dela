/* Nicole's calm moments: four gentle, distinct scenes per character.
   Offline, non-interactive images with no external resources and no autoplay. */
(function(global){
"use strict";
function shape(name,x,y,scale){
  var p="";
  if(name==="carrot")p='<path d="M-19-44q-30 0-29-22 18-8 32 10 0-35 20-32 15 24-7 37 28-28 38-10-21 22-42 21Z" fill="#88b69b"/><path d="M-26-35Q-65 30-2 84 48 14 20-35Z" fill="#e8a879" stroke="#d89372" stroke-width="5"/><path d="M-21 3h17m-4 23h17" stroke="#f5c5a1" stroke-width="6" stroke-linecap="round"/>';
  if(name==="butterfly")p='<path d="M0 0q-55-73-75-15-5 52 66 32Q-51 89-9 83 20 77 0 5 24 76 48 76q45-27-20-58Q94 44 82-20 49-70 0 0Z" fill="#e6bad7" stroke="#cfa1c7" stroke-width="4"/><path d="M0-15v69" stroke="#80758b" stroke-width="9" stroke-linecap="round"/><circle cx="-38" cy="-12" r="10" fill="#fff0db"/><circle cx="39" cy="-12" r="10" fill="#fff0db"/>';
  if(name==="heart")p='<path d="M0 66-62 8Q-100-31-68-57q30-25 68 12 38-37 68-12 32 26-6 65Z" fill="#e8b6c4"/>';
  if(name==="moon")p='<path d="M29-65A69 69 0 1 0 64 32 75 75 0 0 1 29-65Z" fill="#fff0c9"/>';
  if(name==="cloud")p='<ellipse cx="-22" cy="14" rx="52" ry="26" fill="#fffbef"/><circle cx="-24" cy="-4" r="30" fill="#fffbef"/><circle cx="24" cy="-7" r="35" fill="#fffbef"/>';
  if(name==="flower")p='<path d="M0 17v71" stroke="#8ab899" stroke-width="8"/><ellipse cx="-25" cy="43" rx="23" ry="12" fill="#b4d1a2" transform="rotate(23 -25 43)"/><ellipse cx="23" cy="52" rx="23" ry="12" fill="#b4d1a2" transform="rotate(-23 23 52)"/><g fill="#efc8d6"><ellipse cy="-30" rx="15" ry="26"/><ellipse cy="-30" rx="15" ry="26" transform="rotate(72)"/><ellipse cy="-30" rx="15" ry="26" transform="rotate(144)"/><ellipse cy="-30" rx="15" ry="26" transform="rotate(216)"/><ellipse cy="-30" rx="15" ry="26" transform="rotate(288)"/></g><circle cy="-30" r="13" fill="#ffdfac"/>';
  if(name==="yarn")p='<circle r="58" fill="#e2b4ca" stroke="#bd9ebc" stroke-width="5"/><path d="M-43-24Q15-55 48-12M-54 12q74-35 99 21M-15-55q-25 73 14 111" stroke="#f8e5ee" stroke-width="11" fill="none"/><path d="M47 29q73 23 35 78" stroke="#d5a9c0" stroke-width="6" fill="none"/>';
  if(name==="pillow")p='<rect x="-105" y="-57" width="210" height="114" rx="40" fill="#e5d0df" stroke="#c7b2c9" stroke-width="6"/><path d="M-72-5q70 25 140 0" fill="none" stroke="#fff5ef" stroke-width="8"/>';
  if(name==="blanket")p='<path d="M-138-55Q2-102 147-55l-16 125q-123 45-247 0Z" fill="#e6c6d2" stroke="#dab6c6" stroke-width="6"/><path d="M-120-22q117-46 254-4" fill="none" stroke="#fff5e5" stroke-width="13"/>';
  if(name==="leaf")p='<path d="M-90-4Q-44-104 88-71q17 138-161 144Z" fill="#a5c6a9" stroke="#81ad90" stroke-width="5"/><path d="M-77 60Q-17-11 74-62" stroke="#e4eeca" stroke-width="7" fill="none"/>';
  if(name==="star")p='<path d="M0-54 14-17 53-17 23 7 31 48 0 26-31 48-23 7-53-17-14-17Z" fill="#ffe4aa"/>';
  return '<g transform="translate('+x+' '+y+') scale('+scale+')" aria-hidden="true">'+p+'</g>';
}
function render(kind,page,animalFn){
var cat=kind==="cleo",step=Math.max(0,Math.min(3,Math.trunc(page)||0));
var colors=cat?["#f3e5e7","#f1e8e2","#e8e5e6","#e1e4ed"]:["#eaf1e6","#e2eedf","#e6ece4","#e3e6ee"];
var night=step===3;
var html='<svg xmlns="http://www.w3.org/2000/svg" class="calm-illustration" viewBox="0 0 720 900" role="img" aria-label="'+(cat?"Клео":"Зайчик Ась")+', спокойная сцена '+(step+1)+'">';
html+='<rect width="720" height="900" fill="'+colors[step]+'"/>';
html+='<path d="M0 680q135-52 282 7 183-73 438-14v227H0Z" fill="'+(night?"#c7d1d7":cat?"#e4d3ce":"#c5dcbd")+'"/>';
html+='<path d="M0 783q180-33 355 10 170-59 365-9v116H0Z" fill="'+(night?"#c2cbd4":cat?"#d6c2bf":"#b8d0b0")+'" opacity=".8"/>';
if(step===0){
html+=shape(cat?"yarn":"carrot",125,679,1.0)+shape("leaf",578,685,.8)+shape("cloud",510,150,.84);
if(cat)html+='<path d="M515 240h150v275H515" fill="none" stroke="#d3b1a8" stroke-width="21" stroke-linecap="round"/>';
}else if(step===1){
html+=shape("blanket",360,771,1.45)+shape("flower",120,698,.66)+shape("cloud",550,150,.9);
}else if(step===2){
html+=shape("butterfly",135,311,.56)+shape("flower",575,713,.86)+shape("heart",558,283,.6);
}else{
html+=shape("moon",545,169,.75)+shape("star",120,150,.28)+shape("star",219,229,.18)+shape("pillow",352,749,1.6)+shape("blanket",355,835,1.3);
}
var outer=animalFn(cat?"cleo":"rabbit"),inside=outer.replace(/^<svg[^>]*>/,"").replace(/<\/svg>\s*$/,"");
var translate=step===3?"translate(225 356) scale(1.62 .99)":"translate(205 270) scale(1.76)";
if(step===1)translate="translate(205 298) scale(1.76)";
if(step===2)translate="translate(205 270) scale(1.8)";
html+='<ellipse cx="365" cy="814" rx="168" ry="26" fill="#715e78" opacity=".08"/>';
html+='<g class="calm-character" transform="'+translate+'">'+inside+'</g>';
if(step===3)html+='<g fill="#e4d1cf"><circle cx="516" cy="385" r="7"/><circle cx="538" cy="371" r="5"/></g>';
html+='</svg>';
return html;
}
global.NicoleCalmArt={render:render,steps:4};
})(window);
