/* Nicole storybook 4.4. Animal-specific one-tap animations, no network or user data. */
(function(global){
"use strict";
var CSS=String.raw`
/* Big, recognisable species acting with ears, eyes, tails, wings and paws. */
.surprise-layer .hop-rabbit{left:50%;bottom:23%;width:clamp(170px,48vw,260px);height:clamp(235px,58vw,315px);transform:translateX(-50%)}
.surprise-layer .hop-rabbit svg{overflow:visible}
.surprise-layer .animal-voice{
position:absolute;left:50%;top:27%;transform:translateX(-50%);padding:13px 20px;
border:4px solid #fff;background:#fff0ccf2;color:#73496d;border-radius:26px 26px 26px 8px;
font-size:clamp(23px,6vw,31px);font-weight:950;white-space:nowrap;box-shadow:0 7px 18px #60416c30;
opacity:0;animation:voice-pop 4.3s ease-in-out forwards
}
.surprise-layer .animal-voice:after{content:"";position:absolute;bottom:-16px;left:22%;border-style:solid;border-width:15px 18px 0 0;border-color:#fff0cc transparent transparent transparent}
.surprise-layer .animal-prop{position:absolute;left:13%;bottom:23%;font-size:50px;opacity:0;animation:prop-bounce 3.8s ease-in-out .35s forwards}
.surprise-layer[data-animal="rabbit"] .hop-rabbit,.surprise-layer[data-animal="seva"] .hop-rabbit,.surprise-layer[data-animal="balloons"] .hop-rabbit,.surprise-layer[data-animal="seed"] .hop-rabbit{
animation:rabbit-giant-hops 4.5s ease-in-out both}
.surprise-layer[data-animal="dog"] .hop-rabbit{animation:puppy-woof 4.45s ease-in-out both}
.surprise-layer[data-animal="cleo"] .hop-rabbit{animation:cat-hello 4.45s ease-in-out both}
.surprise-layer[data-animal="cow"] .hop-rabbit,.surprise-layer[data-animal="father"] .hop-rabbit{animation:cow-munch 4.4s ease-in-out both}
.surprise-layer[data-animal="chick"] .hop-rabbit,.surprise-layer[data-animal="thumbelina"] .hop-rabbit{animation:chick-dance 4.45s ease-in-out both}
.surprise-layer[data-animal="mouse"] .hop-rabbit{animation:mouse-hide-seek 4.45s ease-in-out both}
.surprise-layer[data-animal="dino"] .hop-rabbit{animation:dino-heavy-steps 4.45s ease-in-out both}
.surprise-layer[data-animal="dress"] .hop-rabbit{animation:dress-twirl 4.4s ease-in-out both;width:155px}
.surprise-layer .dress-sprite{display:block;font-size:126px;line-height:1.45;text-align:center;filter:drop-shadow(0 7px 11px #674f6f40)}
/* All body-part transform origins are local to the SVG box, not the screen. */
.surprise-layer .animal-ear-left,.surprise-layer .animal-ear-right,.surprise-layer .animal-cat-ears,.surprise-layer .animal-cow-ears,
.surprise-layer .animal-tail,.surprise-layer .animal-nose,.surprise-layer .animal-whiskers,.surprise-layer .animal-mouth,
.surprise-layer .animal-eyes,.surprise-layer .animal-head,.surprise-layer .animal-chew,.surprise-layer .animal-tongue,
.surprise-layer .animal-paw-left,.surprise-layer .animal-paw-right,.surprise-layer .animal-beak,
.surprise-layer .animal-wing-left,.surprise-layer .animal-wing-right,.surprise-layer .animal-foot-left,.surprise-layer .animal-foot-right{
transform-box:fill-box;transform-origin:center center}
.surprise-layer .animal-ear-left,.surprise-layer .animal-ear-right,.surprise-layer .animal-cat-ears,.surprise-layer .animal-cow-ears{transform-origin:center 95%}
.surprise-layer .animal-tail{transform-origin:10% 85%}
.surprise-layer .animal-wing-left{transform-origin:90% 15%}
.surprise-layer .animal-wing-right{transform-origin:10% 15%}
.surprise-layer .animal-head{transform-origin:center 84%}
.surprise-layer .animal-paw-left,.surprise-layer .animal-paw-right{transform-origin:center 5%}
.surprise-layer .animal-eyes{transform-origin:center center}
.surprise-layer .animal-tongue{opacity:0}
.surprise-layer .animal-bark-lines{opacity:0}
.surprise-layer .animal-beak-inside{opacity:0}
.surprise-layer[data-animal="rabbit"] .animal-ear-left,.surprise-layer[data-animal="seva"] .animal-ear-left{animation:rabbit-ear-left .67s ease-in-out infinite alternate}
.surprise-layer[data-animal="rabbit"] .animal-ear-right,.surprise-layer[data-animal="seva"] .animal-ear-right{animation:rabbit-ear-right .76s ease-in-out infinite alternate}
.surprise-layer[data-animal="rabbit"] .animal-nose,.surprise-layer[data-animal="seva"] .animal-nose{animation:nose-sniff .26s ease-in-out infinite alternate}
.surprise-layer[data-animal="rabbit"] .animal-whiskers,.surprise-layer[data-animal="seva"] .animal-whiskers{animation:whisker-twitch .28s ease-in-out infinite alternate}
.surprise-layer[data-animal="rabbit"] .animal-tail,.surprise-layer[data-animal="seva"] .animal-tail{animation:bunny-fluff .45s ease-in-out infinite alternate}
.surprise-layer[data-animal="dog"] .animal-tail{animation:happy-wag .16s ease-in-out infinite alternate}
.surprise-layer[data-animal="dog"] .animal-head{animation:head-nod .43s ease-in-out infinite alternate}
.surprise-layer[data-animal="dog"] .animal-ear-left{animation:floppy-left .4s ease-in-out infinite alternate}
.surprise-layer[data-animal="dog"] .animal-ear-right{animation:floppy-right .44s ease-in-out infinite alternate}
.surprise-layer[data-animal="dog"] .animal-mouth{animation:jaw-bark .23s ease-in-out infinite alternate}
.surprise-layer[data-animal="dog"] .animal-tongue{animation:tongue-bark .45s ease-in-out infinite alternate}
.surprise-layer[data-animal="dog"] .animal-bark-lines{animation:bark-glow .5s ease-in-out infinite alternate}
.surprise-layer[data-animal="dog"] .animal-paw-left{animation:paw-hello .75s ease-in-out infinite alternate}
.surprise-layer[data-animal="cleo"] .animal-tail{animation:slow-tail-swirl 1.25s ease-in-out infinite alternate}
.surprise-layer[data-animal="cleo"] .animal-head{animation:cat-look 1.1s ease-in-out infinite alternate}
.surprise-layer[data-animal="cleo"] .animal-eyes{animation:kitten-blink 2.15s ease-in-out infinite}
.surprise-layer[data-animal="cleo"] .animal-paw-left{animation:cat-bat 1.15s ease-in-out infinite alternate}
.surprise-layer[data-animal="cleo"] .animal-whiskers{animation:whisker-twitch .64s ease-in-out infinite alternate}
.surprise-layer[data-animal="cow"] .animal-chew,.surprise-layer[data-animal="father"] .animal-chew{animation:cow-chew .7s ease-in-out infinite alternate}
.surprise-layer[data-animal="cow"] .animal-head,.surprise-layer[data-animal="father"] .animal-head{animation:cow-head-bob 1.28s ease-in-out infinite alternate}
.surprise-layer[data-animal="cow"] .animal-cow-ears,.surprise-layer[data-animal="father"] .animal-cow-ears{animation:cow-ear-flick 1.9s ease-in-out infinite}
.surprise-layer[data-animal="chick"] .animal-wing-left,.surprise-layer[data-animal="thumbelina"] .animal-wing-left{animation:flap-left .25s ease-in-out infinite alternate}
.surprise-layer[data-animal="chick"] .animal-wing-right,.surprise-layer[data-animal="thumbelina"] .animal-wing-right{animation:flap-right .25s ease-in-out infinite alternate}
.surprise-layer[data-animal="chick"] .animal-beak,.surprise-layer[data-animal="thumbelina"] .animal-beak{animation:beak-open .25s ease-in-out infinite alternate}
.surprise-layer[data-animal="chick"] .animal-beak-inside,.surprise-layer[data-animal="thumbelina"] .animal-beak-inside{animation:beak-inside .25s ease-in-out infinite alternate}
.surprise-layer[data-animal="mouse"] .animal-whiskers{animation:whisker-twitch .22s ease-in-out infinite alternate}
.surprise-layer[data-animal="mouse"] .animal-nose-twitch{animation:nose-sniff .18s ease-in-out infinite alternate}
.surprise-layer[data-animal="mouse"] .animal-tail{animation:mouse-tail 1.2s ease-in-out infinite alternate}
.surprise-layer[data-animal="mouse"] .animal-eyes{animation:kitten-blink 1.7s ease-in-out infinite}
.surprise-layer[data-animal="dino"] .animal-foot-left{animation:dino-foot .58s ease-in-out infinite alternate}
.surprise-layer[data-animal="dino"] .animal-foot-right{animation:dino-foot .58s ease-in-out -.29s infinite alternate}
@keyframes rabbit-giant-hops{
0%{transform:translate(calc(-50vw - 260px),0) rotate(-5deg)}
14%{transform:translate(calc(-34vw - 90px),-98px) rotate(6deg)}
25%{transform:translate(calc(-20vw - 90px),0) rotate(-4deg)}
39%{transform:translate(-50%,-128px) rotate(7deg)}
52%{transform:translate(-50%,0) rotate(-5deg)}
69%{transform:translate(calc(14vw - 70px),-112px) rotate(6deg)}
81%{transform:translate(calc(31vw - 70px),0) rotate(-3deg)}
100%{transform:translate(calc(50vw + 220px),-54px) rotate(7deg)}
}
@keyframes puppy-woof{
0%{transform:translate(-50%,180px) scale(.7);opacity:0}
14%{transform:translate(-50%,0) scale(1);opacity:1}
28%{transform:translate(-50%,-24px) rotate(-5deg) scale(1.06)}
40%{transform:translate(-50%,0) rotate(4deg) scale(.98)}
54%{transform:translate(-50%,-28px) rotate(-4deg)}
69%{transform:translate(-50%,0) rotate(3deg)}
84%{transform:translate(-50%,-17px) rotate(0)}
100%{transform:translate(-50%,170px) scale(.85);opacity:0}
}
@keyframes cat-hello{
0%{transform:translate(-50%,165px) scale(.76);opacity:0}
18%{transform:translate(-50%,0) scale(1);opacity:1}
39%{transform:translate(-50%,0) scale(1.15,.84)}
60%{transform:translate(-50%,-13px) scale(.96,1.15)}
81%{transform:translate(-50%,0) scale(1.1,.91)}
100%{transform:translate(-50%,175px) scale(.9);opacity:0}
}
@keyframes cow-munch{
0%{transform:translate(-50%,160px) scale(.75);opacity:0}
18%{transform:translate(-50%,0) scale(1);opacity:1}
37%{transform:translate(-50%,-13px) rotate(-6deg)}
58%{transform:translate(-50%,0) rotate(6deg)}
79%{transform:translate(-50%,-12px) rotate(-3deg)}
100%{transform:translate(-50%,165px) scale(.85);opacity:0}
}
@keyframes chick-dance{
0%{transform:translate(-50%,160px) scale(.72);opacity:0}
16%{transform:translate(-50%,0) scale(1);opacity:1}
30%{transform:translate(-50%,-93px) rotate(-13deg)}
44%{transform:translate(-50%,0) rotate(10deg)}
59%{transform:translate(-50%,-105px) rotate(13deg)}
73%{transform:translate(-50%,0) rotate(-10deg)}
86%{transform:translate(-50%,-55px)}
100%{transform:translate(-50%,165px);opacity:0}
}
@keyframes mouse-hide-seek{
0%{transform:translate(calc(-50vw - 230px),0) scale(.76)}
20%{transform:translate(calc(-30vw - 80px),-21px) scale(.76)}
36%{transform:translate(calc(-7vw - 80px),21px) scale(.8) rotate(-9deg)}
53%{transform:translate(calc(9vw - 80px),-17px) scale(.76) rotate(8deg)}
72%{transform:translate(calc(29vw - 80px),19px) scale(.76) rotate(-8deg)}
100%{transform:translate(calc(50vw + 200px),0) scale(.74)}
}
@keyframes dino-heavy-steps{
0%{transform:translate(-50%,160px) scale(.78);opacity:0}
18%{transform:translate(-50%,0) rotate(-5deg);opacity:1}
32%{transform:translate(-50%,-25px) rotate(6deg)}
47%{transform:translate(-50%,0) rotate(-6deg)}
62%{transform:translate(-50%,-28px) rotate(6deg)}
78%{transform:translate(-50%,0) rotate(-4deg)}
100%{transform:translate(-50%,170px) rotate(4deg);opacity:0}
}
@keyframes dress-twirl{
0%{transform:translate(-50%,170px) scale(.62) rotate(-25deg);opacity:0}
24%{transform:translate(-50%,0) scale(1) rotate(0);opacity:1}
52%{transform:translate(-50%,-50px) scale(1.22) rotate(360deg)}
78%{transform:translate(-50%,0) scale(1) rotate(720deg)}
100%{transform:translate(-50%,170px) scale(.75) rotate(742deg);opacity:0}
}
@keyframes voice-pop{
0%,10%{opacity:0;transform:translate(-50%,25px) scale(.7)}
19%,72%{opacity:1;transform:translate(-50%,0) scale(1)}
82%{opacity:1;transform:translate(-50%,-8px) scale(1.1)}
100%{opacity:0;transform:translate(-50%,-20px) scale(.9)}
}
@keyframes prop-bounce{
0%,12%{opacity:0;transform:translateY(60px) rotate(-15deg)}
30%,67%{opacity:1;transform:translateY(0) rotate(8deg)}
100%{opacity:0;transform:translateY(-45px) rotate(35deg)}
}
@keyframes rabbit-ear-left{from{transform:rotate(-14deg)}to{transform:rotate(16deg)}}
@keyframes rabbit-ear-right{from{transform:rotate(13deg)}to{transform:rotate(-18deg)}}
@keyframes nose-sniff{from{transform:translateY(0) scale(1)}to{transform:translateY(-2px) scale(1.18)}}
@keyframes whisker-twitch{from{transform:rotate(-6deg) translateX(-2px)}to{transform:rotate(7deg) translateX(3px)}}
@keyframes bunny-fluff{from{transform:scale(.83)}to{transform:scale(1.2)}}
@keyframes happy-wag{from{transform:rotate(-27deg)}to{transform:rotate(25deg)}}
@keyframes head-nod{from{transform:rotate(-6deg) translateY(-2px)}to{transform:rotate(6deg) translateY(3px)}}
@keyframes floppy-left{from{transform:rotate(-11deg)}to{transform:rotate(14deg)}}
@keyframes floppy-right{from{transform:rotate(14deg)}to{transform:rotate(-11deg)}}
@keyframes jaw-bark{from{transform:translateY(0) scaleY(.65)}to{transform:translateY(6px) scaleY(1.5)}}
@keyframes tongue-bark{from{opacity:0;transform:scaleY(.4)}to{opacity:1;transform:scaleY(1)}}
@keyframes bark-glow{from{opacity:.1}to{opacity:1}}
@keyframes paw-hello{from{transform:rotate(-9deg)}to{transform:rotate(25deg)}}
@keyframes slow-tail-swirl{from{transform:rotate(-26deg)}to{transform:rotate(32deg)}}
@keyframes cat-look{from{transform:rotate(-8deg)}to{transform:rotate(9deg)}}
@keyframes kitten-blink{0%,40%,50%,100%{transform:scaleY(1)}45%{transform:scaleY(.05)}}
@keyframes cat-bat{from{transform:rotate(-6deg) translateY(0)}to{transform:rotate(36deg) translateY(-18px)}}
@keyframes cow-chew{from{transform:translateX(-6px) scaleY(.75)}to{transform:translateX(7px) scaleY(1.2)}}
@keyframes cow-head-bob{from{transform:translateY(-4px) rotate(-5deg)}to{transform:translateY(4px) rotate(5deg)}}
@keyframes cow-ear-flick{0%,75%,100%{transform:rotate(0)}85%{transform:rotate(-12deg)}}
@keyframes flap-left{from{transform:rotate(7deg)}to{transform:rotate(-42deg)}}
@keyframes flap-right{from{transform:rotate(-7deg)}to{transform:rotate(42deg)}}
@keyframes beak-open{from{transform:scaleY(.78)}to{transform:scaleY(1.5)}}
@keyframes beak-inside{from{opacity:.15}to{opacity:1}}
@keyframes mouse-tail{from{transform:rotate(-20deg)}to{transform:rotate(26deg)}}
@keyframes dino-foot{from{transform:translateY(0) rotate(-3deg)}to{transform:translateY(-14px) rotate(6deg)}}
.surprise-layer[data-animal="dino"] .animal-tail{animation:slow-tail-swirl .65s ease-in-out infinite alternate}
.surprise-layer[data-animal="dino"] .animal-eyes{animation:kitten-blink 1.9s ease-in-out infinite}
.surprise-layer[data-animal="dino"] .animal-paw-left{animation:paw-hello .5s ease-in-out infinite alternate}
.surprise-layer[data-animal="dino"] .animal-paw-right{animation:paw-hello .5s ease-in-out -.25s infinite alternate}
.surprise-layer[data-animal="dino"] .animal-prop{font-size:63px;left:66%;bottom:17%}
.surprise-layer[data-animal="dog"] .animal-voice{background:#fff7e0}
.surprise-layer[data-animal="cleo"] .animal-voice{background:#ffe3ec}
.surprise-layer[data-animal="chick"] .animal-voice{background:#fff1ab}
.surprise-layer[data-animal="cow"] .animal-voice{background:#eeffdb}

@media(prefers-reduced-motion:reduce){
.surprise-layer .hop-rabbit{animation:none!important;left:50%!important;bottom:30%;transform:translateX(-50%)!important}
.surprise-layer svg .animal-ear-left,.surprise-layer svg .animal-ear-right,.surprise-layer svg .animal-tail,.surprise-layer svg .animal-head,.surprise-layer svg .animal-wing-left,.surprise-layer svg .animal-wing-right,.surprise-layer svg .animal-foot-left,.surprise-layer svg .animal-foot-right,.surprise-layer svg .animal-eyes,.surprise-layer svg .animal-beak,.surprise-layer svg .animal-nose,.surprise-layer svg .animal-mouth,.surprise-layer svg .animal-whiskers,.surprise-layer svg .animal-chew{animation:none!important}
.surprise-layer .animal-voice,.surprise-layer .animal-prop{animation:none!important;opacity:1}
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
var voices={rabbit:"Прыг!",dog:"ГАВ! ГАВ!",cleo:"Мяу!",cow:"Мууу!",chick:"Пи-пи!",mouse:"Пи-пи!",dino:"ТОП! ТОП!",seva:"Прыг!",balloons:"Ура!",seed:"Расти!",thumbelina:"Привет!",father:"Люблю!"};
var props={rabbit:"🥕",dog:"🦴",cleo:"🧶",cow:"🌼",chick:"🌾",mouse:"🧀",dino:"🌿"};
var positions=[["13%","70%","0s"],["36%","23%",".35s"],["71%","48%",".8s"],["85%","75%","1.1s"],["55%","15%",".55s"],["19%","30%",".95s"],["91%","29%","1.4s"],["56%","68%","1.65s"]];
layer.dataset.animal=kind;
layer.innerHTML='<div class="hop-rabbit">'+sprite+'</div>'+positions.map(function(p,i){
return '<span class="surprise-float" style="--x:'+p[0]+';--y:'+p[1]+';--delay:'+p[2]+';--rotate:'+(i%2?"25deg":"-25deg")+'">'+spec[2][i]+'</span>';
}).join("")+(voices[kind]?'<div class="animal-voice">'+voices[kind]+'</div>':'')+(props[kind]?'<div class="animal-prop">'+props[kind]+'</div>':'')+'<div class="surprise-message">'+spec[1]+'</div>';
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
