/* Nicole storybook 4.3. Animal-specific one-tap animations, no network or user data. */
(function(global){
"use strict";
var CSS=String.raw`
.surprise-layer[data-animal="dog"] .hop-rabbit{animation:dog-dash 4.3s ease-in-out both}
.surprise-layer[data-animal="cleo"] .hop-rabbit{animation:cat-stretch 4.3s ease-in-out both}
.surprise-layer[data-animal="cow"] .hop-rabbit{animation:cow-sway 4.3s ease-in-out both}
.surprise-layer[data-animal="chick"] .hop-rabbit{animation:chick-peep 4.3s ease-in-out both}
.surprise-layer[data-animal="mouse"] .hop-rabbit{animation:mouse-scurry 4.3s ease-in-out both}
.surprise-layer[data-animal="dino"] .hop-rabbit{animation:dino-stomp 4.3s ease-in-out both}
.surprise-layer[data-animal="dress"] .hop-rabbit{animation:dress-twirl 4.3s ease-in-out both;width:155px}
.surprise-layer .dress-sprite{display:block;font-size:120px;line-height:1.45;text-align:center;filter:drop-shadow(0 7px 11px #674f6f40)}
.surprise-layer[data-animal="dog"] .animal-tail,.surprise-layer[data-animal="cleo"] .animal-tail,.surprise-layer[data-animal="mouse"] .animal-tail{
transform-box:fill-box;transform-origin:18% 88%;animation:wag-tail .22s ease-in-out infinite alternate}
@keyframes wag-tail{from{transform:rotate(-25deg)}to{transform:rotate(22deg)}}
@keyframes dog-dash{
0%{transform:translate(-180px,0) rotate(-5deg)}15%{transform:translate(calc(19vw - 100px),-75px) rotate(8deg)}
29%{transform:translate(calc(36vw - 90px),0) rotate(-5deg)}45%{transform:translate(calc(53vw - 100px),-98px) rotate(7deg)}
60%{transform:translate(calc(69vw - 85px),0) rotate(-4deg)}79%{transform:translate(calc(85vw - 90px),-68px) rotate(6deg)}
100%{transform:translate(calc(100vw + 180px),0)}}
@keyframes cat-stretch{
0%{transform:translate(calc(50vw - 75px),190px) scale(.6);opacity:0}
19%{transform:translate(calc(50vw - 75px),0) scale(1);opacity:1}
36%{transform:translate(calc(50vw - 75px),0) scale(1.18,.76) rotate(-5deg)}
53%{transform:translate(calc(50vw - 75px),-19px) scale(.9,1.2) rotate(6deg)}
70%{transform:translate(calc(50vw - 75px),0) scale(1.12,.9) rotate(-5deg)}
85%{transform:translate(calc(50vw - 75px),-26px) scale(1)}
100%{transform:translate(calc(100vw + 150px),0);opacity:0}}
@keyframes cow-sway{
0%{transform:translate(calc(50vw - 75px),170px) scale(.6);opacity:0}
20%{transform:translate(calc(50vw - 75px),0) scale(1);opacity:1}
35%{transform:translate(calc(50vw - 75px),-8px) rotate(-13deg)}
49%{transform:translate(calc(50vw - 75px),0) rotate(12deg)}
64%{transform:translate(calc(50vw - 75px),-9px) rotate(-11deg)}
80%{transform:translate(calc(50vw - 75px),0) rotate(10deg)}
100%{transform:translate(calc(50vw - 75px),175px);opacity:0}}
@keyframes chick-peep{
0%{transform:translate(calc(50vw - 75px),180px) scale(.45);opacity:0}
19%{transform:translate(calc(50vw - 75px),0) scale(.95);opacity:1}
29%{transform:translate(calc(50vw - 75px),-95px) rotate(-14deg)}
42%{transform:translate(calc(50vw - 75px),0) rotate(11deg) scale(.91,1.07)}
57%{transform:translate(calc(50vw - 75px),-105px) rotate(13deg)}
72%{transform:translate(calc(50vw - 75px),0) rotate(-11deg)}
84%{transform:translate(calc(50vw - 75px),-65px)}
100%{transform:translate(calc(50vw - 75px),180px);opacity:0}}
@keyframes mouse-scurry{
0%{transform:translate(-180px,0) scale(.75)}
17%{transform:translate(calc(16vw - 100px),-20px) scale(.8)}
34%{transform:translate(calc(38vw - 100px),20px) scale(.78) rotate(-7deg)}
52%{transform:translate(calc(59vw - 100px),-22px) scale(.83) rotate(6deg)}
72%{transform:translate(calc(80vw - 100px),17px) scale(.8) rotate(-5deg)}
88%{transform:translate(calc(93vw - 100px),-16px) scale(.8)}
100%{transform:translate(calc(100vw + 170px),0) scale(.8)}}
@keyframes dino-stomp{
0%{transform:translate(-180px,0) rotate(-6deg)}
17%{transform:translate(calc(17vw - 110px),-21px) rotate(9deg)}
32%{transform:translate(calc(33vw - 100px),0) rotate(-9deg)}
49%{transform:translate(calc(54vw - 100px),-28px) rotate(8deg)}
66%{transform:translate(calc(73vw - 100px),0) rotate(-8deg)}
82%{transform:translate(calc(88vw - 90px),-24px) rotate(7deg)}
100%{transform:translate(calc(100vw + 175px),0)}}
@keyframes dress-twirl{
0%{transform:translate(calc(50vw - 75px),175px) scale(.6) rotate(-30deg);opacity:0}
23%{transform:translate(calc(50vw - 75px),0) scale(.93) rotate(0);opacity:1}
51%{transform:translate(calc(50vw - 75px),-47px) scale(1.18) rotate(360deg)}
77%{transform:translate(calc(50vw - 75px),0) scale(1) rotate(720deg)}
100%{transform:translate(calc(50vw - 75px),175px) scale(.7) rotate(738deg);opacity:0}}
@media(prefers-reduced-motion:reduce){
.surprise-layer .hop-rabbit{animation:none!important;left:50%;bottom:30%;transform:translateX(-50%)!important}
.surprise-layer .animal-tail{animation:none!important}
}
`;
var modes={
rabbit:["rabbit","Прыг-скок! Зайчик Ась! 🐰",["🌸","✨","🦋","🌼","⭐","💛","🌷","✨"]],
dog:["dog","Гав-гав! Собачка Аф! 🐶",["🐾","🦴","💛","🐾","⭐","🦴","✨","🐾"]],
cleo:["cleo","Мяу-мяу! Клео! 🐱",["🐾","💗","✨","🐾","🌸","💛","⭐","🐾"]],
cow:["cow","Му-у-у! Коровка Му! 🐮",["🌼","🌿","🦋","🌸","✨","🌼","🍀","✨"]],
chick:["chick","Пи-пи-пи! Цыплёнок Пипи! 🐥",["🌼","🌾","✨","🌻","💛","🌸","✨","🌼"]],
mouse:["mouse","Пи-пи! Мышка спешит! 🐭",["🧀","✨","🌼","🧀","⭐","💗","🌸","✨"]],
dino:["dino","Топ-топ! Динозаврик! 🦕",["🌿","🌴","✨","🍀","🌸","🍃","⭐","✨"]],
dress:["dress","Красивое платье, Николь! 🌸",["🌼","✨","🌸","💗","🦋","🌷","⭐","🌸"]],
seva:["rabbit","Прыг-скок! Зайчик Сева! 🐇",["🌼","✨","🌷","🌸","💛","🦋","⭐","✨"]],
balloons:["rabbit","Раз, два, три шарика! 🎈",["🎈","✨","🎈","🎈","⭐","💛","🎈","✨"]],
seed:["rabbit","Волшебное семечко! 🌱",["🌱","✨","🌼","🌿","⭐","🌸","🍀","✨"]],
thumbelina:["chick","Дюймовочка и цветочки! 🌺",["🌺","✨","🦋","🌸","⭐","💛","🌷","✨"]],
father:["cow","Папа меня любит! 💛",["💛","🌸","✨","💗","⭐","💛","🌼","✨"]]
};
var currentTimeout=null;
function play(kind,drawAnimal){
var layer=document.getElementById("surpriseLayer");if(!layer)return false;
if(currentTimeout){clearTimeout(currentTimeout);currentTimeout=null}
var spec=modes[kind]||modes.rabbit;
var sprite=kind==="dress"?'<span class="dress-sprite">👗</span>':drawAnimal(spec[0]);
var positions=[["13%","70%","0s"],["36%","23%",".35s"],["71%","48%",".8s"],["85%","75%","1.1s"],["55%","15%",".55s"],["19%","30%",".95s"],["91%","29%","1.4s"],["56%","68%","1.65s"]];
layer.dataset.animal=kind;
layer.innerHTML='<div class="hop-rabbit">'+sprite+'</div>'+positions.map(function(p,i){
return '<span class="surprise-float" style="--x:'+p[0]+';--y:'+p[1]+';--delay:'+p[2]+';--rotate:'+(i%2?"25deg":"-25deg")+'">'+spec[2][i]+'</span>';
}).join("")+'<div class="surprise-message">'+spec[1]+'</div>';
layer.classList.remove("playing");void layer.offsetWidth;layer.classList.add("playing");
if(navigator.vibrate)try{navigator.vibrate(25)}catch(e){}
currentTimeout=setTimeout(function(){layer.classList.remove("playing");layer.innerHTML="";currentTimeout=null},4600);
return true;
}
function hitAnimal(event,cardButton){
if(!cardButton||!event||!event.target||!cardButton.querySelector)return false;
var art=cardButton.querySelector(".art");
if(!art||!art.contains(event.target)||event.target===art)return false;
var closest=event.target.closest?event.target.closest("svg, .import-cover, .bonus-art"):null;
if(!closest)return false;
if(closest.tagName&&String(closest.tagName).toLowerCase()==="svg"&&closest===event.target)return false;
return true;
}
if(document&&document.head){
var style=document.createElement("style");style.textContent=CSS;document.head.appendChild(style);
}
global.NicoleAnimalGames={play:play,hitAnimal:hitAnimal,types:Object.keys(modes)};
})(window);
