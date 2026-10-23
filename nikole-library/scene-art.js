/* Mira Nicole · narrative-matched fallback scenes v5.5.
 * 70 scene compositions, all rendered locally as original vector artwork.
 * Never requests private photos or external resources.
 */
(function (global) {
"use strict";
var pages={
 rabbit:[
 ["bedroom","pillow","sun","morning"],
 ["meadow","dew","carrot","morning"],
 ["meadow","butterfly","flowers","day"],
 ["forest","basket","apples","day"],
 ["meadow","hedgehog","picnic","day"],
 ["forest","rain","leaf-cover","day"],
 ["meadow","rainbow","flowers","day"],
 ["cottage","flowers","house","sunset"],
 ["room","drawing","heart","sunset"],
 ["bedroom","pillow","stars","night"]],
 dog:[
 ["bedroom","bone","pillow","morning"],
 ["bedroom","stretch","rug","morning"],
 ["room","window","sun","morning"],
 ["garden","red-ball","flower","day"],
 ["path","red-ball","footprints","day"],
 ["path","footprints","red-ball","day"],
 ["forest","kitten","tree","day"],
 ["garden","kitten","red-ball","day"],
 ["room","bowl","window","sunset"],
 ["bedroom","pillow","moon","night"]],
 cleo:[
 ["bedroom","stretch","pillow","morning"],
 ["room","window","heart","morning"],
 ["room","red-ball","paw","day"],
 ["room","couch","hidden-ball","day"],
 ["room","couch","hidden-ball","day"],
 ["room","red-ball","couch","day"],
 ["room","girl","heart","day"],
 ["garden","girl","red-ball","day"],
 ["room","girl","red-ball","day"],
 ["bedroom","pillow","girl","night"]],
 cow:[
 ["meadow","flowers","tree","morning"],
 ["meadow","grass","flowers","day"],
 ["meadow","music","sun","morning"],
 ["meadow","cloud","flower","day"],
 ["hills","cloud","cloud","day"],
 ["meadow","butterfly","flowers","day"],
 ["pond","water","reeds","day"],
 ["pond","cloud","water","day"],
 ["hills","sunset","tree","sunset"],
 ["meadow","moon","star","night"]],
 chick:[
 ["nest","egg","sun","morning"],
 ["garden","music","sun","morning"],
 ["garden","mother-hen","heart","day"],
 ["garden","gate","tree","day"],
 ["meadow","flower","grass","day"],
 ["meadow","ladybug","flower","day"],
 ["meadow","ladybug","heart","day"],
 ["garden","grain","flower","day"],
 ["garden","mother-hen","house","sunset"],
 ["nest","mother-hen","moon","night"]],
 mouse:[
 ["forest","hole","mushroom","morning"],
 ["forest","hole","sun","morning"],
 ["forest","cloud","leaves","day"],
 ["meadow","grain","flower","day"],
 ["path","grain","hole","day"],
 ["path","snail","flowers","day"],
 ["meadow","snail","heart","day"],
 ["hills","stars","snail","night"],
 ["forest","hole","moon","night"],
 ["bedroom","pillow","stars","night"]],
 dino:[
 ["valley","palm","sun","morning"],
 ["valley","friend-dino","hills","day"],
 ["valley","baby-dino","flowers","day"],
 ["valley","girl","heart","day"],
 ["path","palm","tree","day"],
 ["meadow","flowers","butterfly","day"],
 ["valley","baby-dino","friend-dino","day"],
 ["meadow","red-ball","baby-dino","day"],
 ["valley","girl","heart","sunset"],
 ["valley","stars","moon","night"]]
};
var envColors={
 forest:["#e3f2e8","#c3e5ce","#9ecfb0"],
 meadow:["#e9f4e6","#cfeac0","#a6d794"],
 hills:["#edf2e9","#d5e8bb","#9fcf98"],
 garden:["#f7eaf0","#d7edd1","#a8d4ab"],
 path:["#f4f0db","#e7e5c5","#b7d5aa"],
 cottage:["#f8e9df","#f6d8ce","#cfe0bb"],
 room:["#fff3df","#f4dfd2","#debfae"],
 bedroom:["#f5e6ed","#ead3e8","#d1b4c7"],
 nest:["#fff4d8","#f6e5bd","#dfcf9f"],
 pond:["#e0eff3","#c9e7e8","#b2d7ba"],
 valley:["#e2edf1","#bde0dc","#96cbc2"]
};
function prop(kind,x,y,scale){
 if(!kind)return "";
 var c="";
 switch(kind){
 case "carrot":c='<path d="M0-52q-40-28-45-47Q-5-112 1-67q12-49 42-35 8 27-34 50" fill="#7fb583"/><path d="M-39-39Q-45 18 0 92 43 18 36-39Z" fill="#f6aa5e" stroke="#da8f57" stroke-width="5"/><path d="M-19-4h19M8 17h21M-12 41h17" stroke="#ffdfb0" stroke-width="6" stroke-linecap="round"/>';break;
 case "basket":c='<path d="M-67-11q67 12 134 0l-13 80q-55 29-108 0Z" fill="#c99d68" stroke="#a9794e" stroke-width="7"/><path d="M-50-11q0-92 50-92t50 92" fill="none" stroke="#a77d58" stroke-width="11"/><path d="M-55 8h111M-51 34h102M-48 58h96" stroke="#e1bc88" stroke-width="8"/>';break;
 case "apples":c='<g><circle cx="-48" cy="24" r="28" fill="#e87d79"/><circle cx="15" cy="-8" r="31" fill="#e96760"/><circle cx="51" cy="44" r="30" fill="#e58a71"/><path d="M-45-7l5-18M17-38l5-21M54 14l5-19" stroke="#907957" stroke-width="7" stroke-linecap="round"/><ellipse cx="30" cy="-45" rx="19" ry="9" fill="#8eaf75"/></g>';break;
 case "picnic":c='<path d="M-100 41 41-67 105 26-38 130Z" fill="#eee1d8" stroke="#e3b8a8" stroke-width="6"/><path d="M-72 57 57-43M-40 80 82-10M-10-21 56 62" stroke="#ebc0bb" stroke-width="9"/>'+prop("basket",-30,-15,.5)+prop("apples",50,12,.43);break;
 case "hedgehog":c='<path d="M-76 24Q-88-57-49-72q-18-46 16-16Q-6-117 5-83q38-42 35-2 50-17 30 20 30 48-8 95Z" fill="#957d67" stroke="#745e52" stroke-width="6"/><ellipse cy="25" rx="70" ry="49" fill="#e8c7a8"/><circle cx="19" cy="12" r="6" fill="#4d4a51"/><ellipse cx="56" cy="37" rx="12" ry="9" fill="#a76b74"/><path d="M32 51q12 10 22 0" stroke="#98717a" fill="none" stroke-width="5"/>';break;
 case "rain":c='<g fill="none" stroke="#91c6d7" stroke-width="7" stroke-linecap="round"><path d="M-72-66l-26 56m97-70-25 57m91-54-21 54M-69 20l-23 54m91-63-25 64m94-68-23 59"/></g>';break;
 case "leaf-cover":c='<path d="M-100 28Q-90-96 85-92q44 125-151 165Z" fill="#96c497" stroke="#73aa7c" stroke-width="7"/><path d="M-72 59Q-9-22 64-69" stroke="#d2e7b9" stroke-width="8" fill="none"/>';break;
 case "rainbow":c='<path d="M-105 81a105 105 0 0 1 210 0" stroke="#efa5a8" stroke-width="19" fill="none"/><path d="M-89 81a89 89 0 0 1 178 0" stroke="#f7d493" stroke-width="17" fill="none"/><path d="M-72 81a72 72 0 0 1 144 0" stroke="#b1dca5" stroke-width="17" fill="none"/><path d="M-54 81a54 54 0 0 1 108 0" stroke="#b1ceea" stroke-width="17" fill="none"/>';break;
 case "drawing":c='<path d="M-60 108V-65H64V108Z" fill="#fff9ea" stroke="#bc947e" stroke-width="11"/><path d="M0-65v-36M-49 109l-13 35M51 109l14 35" stroke="#b99272" stroke-width="10" fill="none"/><path d="M-44 38 0-8 43 39" stroke="#8ec48b" stroke-width="8" fill="none"/><circle cx="30" cy="-28" r="17" fill="#ffe19b"/><path d="M-34 41h68" stroke="#deafa6" stroke-width="6"/>';break;
 case "red-ball":c='<circle r="54" fill="#dd6265" stroke="#b95661" stroke-width="6"/><g fill="#ffe1d1"><circle cx="-22" cy="-13" r="7"/><circle cx="25" cy="-20" r="7"/><circle cx="0" cy="27" r="8"/></g>';break;
 case "sun":c='<circle cy="-10" r="37" fill="#ffe59a"/><g stroke="#f4c86e" stroke-width="6" stroke-linecap="round"><path d="M0-66v-10M0 45v12M-53-11h-15M52-11h15M-38-49l-10-10M38 27l10 10M38-49l10-10M-38 27l-10 10"/></g>';break;
 case "sunset":c='<circle cy="-8" r="42" fill="#f9a77f"/><path d="M-63 19H62" stroke="#f6d0a9" stroke-width="8" stroke-linecap="round"/>';break;
 case "moon":c='<path d="M12-54A49 49 0 1 0 49 18 54 54 0 0 1 12-54Z" fill="#ffe6b7"/>';break;
 case "star":case "stars":c='<path d="M0-46 13-14 47-11 20 10 28 45 0 27-28 45-20 10-47-11-13-14Z" fill="#ffe6a0" stroke="#f0ce8a" stroke-width="3"/><circle cx="-54" cy="32" r="6" fill="#ffecb6"/><circle cx="56" cy="-43" r="5" fill="#ffe7a3"/>';break;
 case "cloud":c='<ellipse cx="-28" cy="12" rx="46" ry="25" fill="#fffefa"/><circle cx="-23" cy="-6" r="29" fill="#fffefa"/><circle cx="17" cy="-8" r="31" fill="#fffefa"/><ellipse cx="36" cy="15" rx="37" ry="22" fill="#fffefa"/>';break;
 case "flower":case "flowers":c='<path d="M0 25v64" stroke="#77ad78" stroke-width="9" stroke-linecap="round"/><path d="M-2 69q-45-42-52-5 24 24 52 14" fill="#8fc68b"/><path d="M5 55q47-46 54-12-18 29-54 19" fill="#7abc83"/><g fill="#f7a3b9"><ellipse cy="-22" rx="18" ry="30"/><ellipse cy="-22" rx="18" ry="30" transform="rotate(72)"/><ellipse cy="-22" rx="18" ry="30" transform="rotate(144)"/><ellipse cy="-22" rx="18" ry="30" transform="rotate(216)"/><ellipse cy="-22" rx="18" ry="30" transform="rotate(288)"/></g><circle cy="-22" r="18" fill="#ffe49c"/>';break;
 case "butterfly":c='<ellipse cx="-25" cy="-15" rx="32" ry="45" transform="rotate(-25 -25 -15)" fill="#f5c0d7"/><ellipse cx="25" cy="-15" rx="32" ry="45" transform="rotate(25 25 -15)" fill="#d7c5f0"/><ellipse cx="-23" cy="30" rx="21" ry="27" transform="rotate(16 -23 30)" fill="#eecada"/><ellipse cx="23" cy="30" rx="21" ry="27" transform="rotate(-16 23 30)" fill="#e3d1f5"/><ellipse cy="3" rx="9" ry="36" fill="#866d86"/><path d="M-3-24Q-18-47-31-41M3-24Q18-47 31-41" fill="none" stroke="#866d86" stroke-width="4"/>';break;
 case "tree":case "palm":c='<path d="M-12 85q10-95-2-151h38q-13 90 1 151Z" fill="#ba8f74"/><circle cx="-30" cy="-52" r="51" fill="#a1d19b"/><circle cx="20" cy="-75" r="56" fill="#9dcf9e"/><circle cx="60" cy="-32" r="40" fill="#b2d7a4"/><circle cx="-55" cy="-22" r="40" fill="#add9a6"/>';break;
 case "house":c='<path d="M-72 9 0-64 73 9v91H-72Z" fill="#fff1d9" stroke="#e7baa7" stroke-width="5"/><path d="M-88 12 0-85 88 12Z" fill="#c897a9"/><rect x="-18" y="42" width="37" height="58" rx="17" fill="#b58b80"/><rect x="-57" y="25" width="28" height="26" rx="5" fill="#b9dce4"/><rect x="29" y="25" width="28" height="26" rx="5" fill="#b9dce4"/>';break;
 case "dew":c='<path d="M0-65q-59 68-36 106 14 22 36 22 42 0 42-42Q42-7 0-65Z" fill="#aee7ec" stroke="#74c0ce" stroke-width="5"/><ellipse cx="-15" cy="-2" rx="11" ry="22" transform="rotate(25 -15 -2)" fill="#fff" opacity=".8"/>';break;
 case "hidden-ball":c='<circle r="52" fill="#d76b65" stroke="#ac5355" stroke-width="7"/><path d="M-31 0h62" stroke="#f1b4ad" stroke-width="10"/>';break;
 case "ball":c='<circle r="59" fill="#ef95a8" stroke="#d676a1" stroke-width="5"/><path d="M-41-41Q4-26 7 55M-56 6Q-11-18 51-20" fill="none" stroke="#ffe1ba" stroke-width="15"/><circle cx="-21" cy="-27" r="10" fill="#fff" opacity=".45"/>';break;
 case "bowl":c='<path d="M-70-18h140l-18 76q-44 27-104 0Z" fill="#a7d8e4" stroke="#699db0" stroke-width="5"/><ellipse cy="-18" rx="70" ry="17" fill="#d1f2f8"/><path d="M-45-14q20-12 44 0t45 0" fill="none" stroke="#80b9d0" stroke-width="4"/>';break;
 case "window":c='<rect x="-69" y="-82" width="138" height="164" rx="15" fill="#e4f3f5" stroke="#dcc9bf" stroke-width="13"/><path d="M0-80v160M-68 0H68" stroke="#dcc9bf" stroke-width="11"/><circle cx="33" cy="-47" r="16" fill="#ffe7a9"/>';break;
 case "couch":c='<rect x="-91" y="-38" width="182" height="105" rx="30" fill="#e1bac4" stroke="#c699ab" stroke-width="4"/><rect x="-103" y="-3" width="206" height="67" rx="23" fill="#efced8"/><path d="M-67 59v21M68 59v21" stroke="#a8869a" stroke-width="15" stroke-linecap="round"/>';break;
 case "pillow":c='<rect x="-97" y="-43" width="194" height="97" rx="42" fill="#e6d1e7" stroke="#c5aed0" stroke-width="5"/><path d="M-68-4q67 23 137-4" fill="none" stroke="#fff2f6" stroke-width="8"/><path d="M-24-71q24-25 48 0" stroke="#fff2f6" stroke-width="8" fill="none"/>';break;
 case "hole":c='<ellipse cy="39" rx="91" ry="64" fill="#af8c73"/><ellipse cy="49" rx="70" ry="51" fill="#695f65"/><path d="M-90 46q0-104 88-100 91 0 92 100" fill="none" stroke="#caab8d" stroke-width="12"/>';break;
 case "grain":c='<ellipse cx="0" cy="16" rx="23" ry="48" fill="#e9bb74" transform="rotate(35 0 16)"/><path d="M-12 55Q35-17 2-60" stroke="#9cb970" stroke-width="5" fill="none"/>';break;
 case "snail":c='<path d="M-48 36q-29-24-20-2 12 24 62 25h69q21-4 19-25H12Z" fill="#a8c9a1"/><circle cx="-11" cy="5" r="45" fill="#ecc2a7" stroke="#c9a28f" stroke-width="5"/><path d="M-8-19q39 5 20 34-22 17-35-8" fill="none" stroke="#c98f87" stroke-width="6"/><path d="M55 17v-51m15 52v-49" stroke="#87b09b" stroke-width="6" stroke-linecap="round"/><circle cx="55" cy="-38" r="6" fill="#8f708b"/><circle cx="70" cy="-36" r="6" fill="#8f708b"/>';break;
 case "ladybug":c='<ellipse rx="39" ry="45" fill="#f08a7c"/><path d="M0-41v83" stroke="#654f58" stroke-width="5"/><circle cx="-17" cy="-14" r="7" fill="#654f58"/><circle cx="20" cy="16" r="7" fill="#654f58"/><circle cx="-17" cy="22" r="7" fill="#654f58"/><circle cx="18" cy="-18" r="7" fill="#654f58"/><circle cy="-42" r="19" fill="#654f58"/>';break;
 case "egg":c='<path d="M0-56q48 0 48 73 0 46-48 46t-48-46Q-48-56 0-56Z" fill="#fffcf3" stroke="#e6d7b7" stroke-width="5"/>';break;
 case "nest":c='<ellipse cy="29" rx="89" ry="40" fill="#d9b88e"/><path d="M-79 12q90 56 160-4M-84 22q87 46 170-8" fill="none" stroke="#ae916e" stroke-width="9"/>';break;
 case "heart":c='<path d="M0 68-62 1q-39-48 6-65Q-26-78 0-46 38-88 66-60q34 37-5 76Z" fill="#f2a8bc" stroke="#e396ac" stroke-width="5"/>';break;
 case "water":c='<ellipse cy="20" rx="94" ry="41" fill="#91d6db"/><path d="M-73 7q20-11 42 0t43 0 42 0" stroke="#e9faff" fill="none" stroke-width="6"/>';break;
 case "reeds":case "grass":c='<path d="M-50 72q-12-71-31-83M-30 72q-6-96 21-133M-7 72q25-84 67-109M25 72q24-49 55-36" stroke="#82b181" stroke-width="9" fill="none" stroke-linecap="round"/><ellipse cx="-10" cy="-64" rx="9" ry="28" fill="#bdab86"/>';break;
 case "leaves":c='<path d="M-62-24q31-45 56 0-16 44-56 0ZM0 29q-3-58 39-41 13 49-39 41ZM-40 64q-38-31-3-51 42 13 3 51Z" fill="#93c393"/><path d="M-66 14q69-46 110-65" stroke="#9a9976" stroke-width="5" fill="none"/>';break;
 case "footprints":c='<g fill="#cb9b7b"><ellipse cx="-52" cy="-28" rx="21" ry="34" transform="rotate(-25 -52 -28)"/><ellipse cx="21" cy="20" rx="21" ry="34" transform="rotate(22 21 20)"/><circle cx="-72" cy="-70" r="8"/><circle cx="-47" cy="-76" r="8"/><circle cx="-23" cy="-67" r="8"/><circle cx="-3" cy="-23" r="8"/><circle cx="25" cy="-27" r="8"/><circle cx="44" cy="-17" r="8"/></g>';break;
 case "bone":c='<path d="M-64-38q-25-17-37 11-3 18 12 30-18 13-12 33 16 27 40 11L64-25q22 17 41-4 10-21-11-34 11-26-8-36-22-11-37 12Z" fill="#fff6e7" stroke="#ddcdbb" stroke-width="5"/>';break;
 case "mushroom":c='<path d="M-26 0h52v65h-52Z" fill="#fcf4de"/><path d="M-72 0q7-78 72-78T72 0Z" fill="#efb0b6"/><g fill="#ffeded"><circle cx="-31" cy="-25" r="12"/><circle cx="14" cy="-49" r="13"/><circle cx="41" cy="-20" r="9"/></g>';break;
 case "paw":c='<ellipse cy="30" rx="45" ry="34" fill="#e7ac93"/><circle cx="-42" cy="-26" r="17" fill="#e7ac93"/><circle cx="-13" cy="-43" r="17" fill="#e7ac93"/><circle cx="18" cy="-43" r="17" fill="#e7ac93"/><circle cx="47" cy="-26" r="17" fill="#e7ac93"/>';break;
 case "music":c='<path d="M12-61v91q-38-14-52 14-8 27 20 27 38 0 38-46v-52l52-9v51q-32-10-42 12-9 22 16 26 35 4 35-31v-99Z" fill="#9d83ae"/>';break;
 case "gate":c='<path d="M-87 85V-48l38-22v155M-24 85V-48l38-22v155M40 85V-48l38-22v155" stroke="#e2ba95" stroke-width="17" stroke-linecap="round"/><path d="M-90 12H93M-90 57H93" stroke="#d3a481" stroke-width="11"/>';break;
 case "girl":c='<circle cy="-64" r="39" fill="#f5c9ab"/><path d="M-37-62q-2-43 42-48 49 10 31 50-7-39-36-30-15 26-37 28" fill="#bc9776"/><path d="M-48-9q48-22 96 0l28 90H-76Z" fill="#f2a5b6"/><path d="M-32 44q30 14 64 0" stroke="#fff4d0" stroke-width="10"/><path d="M-60 5q-33 30-39 57m154-57q33 30 39 57" stroke="#f5c9ab" stroke-width="13" stroke-linecap="round"/>';break;
 case "mama-rabbit":case "kitten":case "mother-hen":case "friend-dino":case "baby-dino":return ""; 
 case "stretch":c='<path d="M-70 30q65-90 131-24" stroke="#d4adc5" stroke-width="7" stroke-linecap="round" fill="none"/><path d="M-71-20  -80-43M-18-51l-2-34M41-26l25-30" stroke="#e9becf" stroke-width="8" stroke-linecap="round"/>';break;
 case "sparkles":c='<path d="M0-46q7 38 45 46-38 8-45 46Q-7 8-45 0-7-8 0-46Z" fill="#f1d296"/><circle cx="-52" cy="-37" r="8" fill="#f5bbcc"/><circle cx="53" cy="43" r="7" fill="#fff1b9"/>';break;
 case "rug":c='<ellipse rx="100" ry="54" fill="#efc6d0"/><ellipse rx="75" ry="33" fill="none" stroke="#e6acbf" stroke-width="6"/>';break;
 default:c='<circle r="24" fill="#ead9df"/>';
 }
 return '<g transform="translate('+x+' '+y+') scale('+scale+')" aria-hidden="true">'+c+'</g>';
}

/* Layered picture-book details. All placements are deterministic and lightweight for Safari. */
function pictureDetails(scene,page,time){
var out="",indoor=scene==="room"||scene==="bedroom",dark=time==="night",base=page*37+scene.length*29;
if(indoor){
 // Wallpaper, picture frames, wooden floor boards, lace curtains and a tiny shelf.
 out+='<g opacity=".55">';
 for(var k=0;k<12;k++){
 var wx=32+(k%4)*144,wy=63+Math.floor(k/4)*120;
 out+='<path d="M'+wx+' '+wy+'q14-23 28 0-14 23-28 0Z" fill="#fff7e6" opacity=".55"/><circle cx="'+(wx+14)+'" cy="'+(wy-1)+'" r="4" fill="#e9c7b6"/>';
 }
 out+='</g><path d="M0 824h720M0 879h720" stroke="#cdaea9" stroke-width="4" opacity=".38"/>';
 out+='<path d="M32 576V126Q52 149 67 118M688 576V126q-21 23-35-8" fill="none" stroke="#fff1f1" stroke-width="19" opacity=".52"/>';
 out+='<rect x="28" y="331" width="113" height="13" rx="7" fill="#c49c8a"/><rect x="43" y="294" width="25" height="37" rx="4" fill="#f1b7bd"/><rect x="76" y="277" width="26" height="54" rx="4" fill="#f1dca4"/><rect x="105" y="299" width="19" height="32" rx="4" fill="#a9d3c6"/>';
 return out;
}
out+='<g opacity="'+(dark?".65":".9")+'">';
for(var i=0;i<22;i++){
 var x=(i*117+base*13)%700+10,y=615+(i*79+base*7)%270,k=.45+(i%4)*.12;
 if(x>230&&x<500&&y>665)continue;
 out+='<path d="M'+x+' '+y+'q-11 -16-15 -21m15 21q6-17 17-22" stroke="'+(dark?"#a5b8b3":"#6cae7e")+'" fill="none" stroke-width="'+(3*k)+'" stroke-linecap="round"/>';
 if(i%4===0){out+='<circle cx="'+x+'" cy="'+(y-23)+'" r="'+(8*k)+'" fill="'+(dark?"#dce4cf":i%8===0?"#ffe3a4":"#f5bed0")+'"/><circle cx="'+x+'" cy="'+(y-23)+'" r="'+(3*k)+'" fill="#f2b875"/>'}
}
out+='</g>';
 // Distant bushes and field borders add depth, leaving the character unobstructed.
 out+='<path d="M0 610Q29 572 51 598q13-39 44-21 25-30 47 6v56H0ZM571 619q29-54 53-27 17-42 44-25 33-26 52 24v52H571Z" fill="'+(dark?"#7a9295":"#a0c99a")+'" opacity=".54"/>';
 for(var z=0;z<8;z++){
 var dx=(z*97+base*11)%680+20,dy=165+(z*57)%310;
 if(z%3===0)out+='<path d="M'+dx+' '+dy+'q12-9 25 0 12-9 24 0" stroke="'+(dark?"#d4c9bf":"#f8f8f2")+'" opacity=".73" stroke-width="4" fill="none" stroke-linecap="round"/>';
 else if(!dark)out+='<ellipse cx="'+dx+'" cy="'+dy+'" rx="5" ry="9" transform="rotate('+(z*45)+' '+dx+' '+dy+')" fill="#f8edd6" opacity=".6"/>';
 }
return out;
}
function background(scene,number){
var p=envColors[scene]||envColors.meadow,night=number==="night",sunset=number==="sunset";
var sky=night?"#34445d":sunset?"#fae2d5":p[0],horizon=night?"#6c8492":sunset?"#f2ceb3":p[1],floor=night?"#536873":sunset?"#d6c0a4":p[2];
var bg='<defs><linearGradient id="nicole-sky" x1="0" y1="0" x2=".1" y2="1"><stop offset="0" stop-color="'+sky+'"/><stop offset="1" stop-color="'+horizon+'"/></linearGradient><linearGradient id="nicole-ground" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="'+horizon+'"/><stop offset="1" stop-color="'+floor+'"/></linearGradient></defs><rect width="720" height="900" fill="url(#nicole-sky)"/>';
if(scene==="room"||scene==="bedroom"){
 bg+='<rect y="585" width="720" height="315" fill="'+(night?"#7b7290":"#e9cdb8")+'"/><path d="M0 587H720" stroke="#dfbea8" stroke-width="12"/>';
 bg+=prop("window",580,222,1.08);
 bg+=prop("rug",390,760,1.65);
}else if(scene==="cottage"){
 bg+='<rect y="590" width="720" height="310" fill="'+floor+'"/><path d="M0 590H720" stroke="#e3c4b2" stroke-width="13"/>'+prop("house",580,435,1.1);
}else if(scene==="nest"){
 bg+='<rect y="565" width="720" height="335" fill="#d3e1b4"/>'+prop("nest",350,742,2.4);
}else{
 bg+='<path d="M0 555q150-95 360 6 180-111 360-2v341H0Z" fill="url(#nicole-ground)"/><path d="M0 710q189-91 388-4 141-88 332-28v222H0Z" fill="'+floor+'"/>';
 if(scene==="forest"||scene==="valley")bg+=prop("tree",100,462,1.6)+prop("tree",633,472,1.25);
 if(scene==="meadow"||scene==="garden"||scene==="hills")bg+=prop("tree",629,495,1.15);
 if(scene==="pond")bg+=prop("water",375,713,2.1);
 if(scene==="path")bg+='<path d="M350 530Q245 691 50 900H585Q439 675 419 531Z" fill="#e7d7b3" opacity=".8"/>';
}
if(night)bg+='<circle cx="571" cy="149" r="48" fill="#ffe8bb"/>'+prop("star",130,163,.5)+prop("star",327,91,.28);
else if(sunset)bg+=prop("sunset",573,138,.85);
else bg+=prop("cloud",502,130,.87);
return bg;
}
function sceneArt(id,page,animal){
var series=pages[id];if(!series||page<0||page>9)return animal(id);
var spec=series[page],environment=spec[0],main=spec[1],secondary=spec[2],time=spec[3],night=time==="night";
var centerX=page%3===0?337:page%3===1?373:320;
var y=environment==="room"||environment==="bedroom"?373:environment==="nest"?350:367;
var small=environment==="room"?1:environment==="bedroom"?.92:1;
var body=animal(id).replace(/^<svg[^>]*>/,"").replace(/<\/svg>\s*$/,"");
var art='<svg xmlns="http://www.w3.org/2000/svg" class="story-scene" viewBox="0 0 720 900" role="img" aria-label="Сюжетная иллюстрация страницы '+(page+1)+' сказки '+id+'">';
art+=background(environment,time)+pictureDetails(environment,page,time);
var left=["flower","flowers","ball","red-ball","hidden-ball","butterfly","cloud","sun","sunset","dew","grain","snail","ladybug","mushroom","girl","bowl","egg","hole","bone","basket","apples","picnic","hedgehog","rain","leaf-cover","rainbow","carrot","drawing","footprints","water","pillow","couch","mama-rabbit","mother-hen","kitten","friend-dino","baby-dino","sparkles","paw","heart","music"].includes(main);
var pX=left?140:553,pY=["butterfly","sun","cloud","moon","stars","star","music","sparkles"].includes(main)?265:625;
art+=prop(main,pX,pY,["couch","pillow","ball","red-ball","hole","house","girl","rainbow","picnic"].includes(main)?1.4:1.08);
art+=prop(secondary,left?575:134,["moon","sun","cloud","stars","star","butterfly"].includes(secondary)?225:705,["house","tree","cloud"].includes(secondary)?1.1:.78);
// Secondary characters make the interaction explicitly visible in the correct page.
var friends={"mama-rabbit":"rabbit","kitten":"cleo","mother-hen":"chick","friend-dino":"dino","baby-dino":"dino"};
for(var j=0;j<2;j++){var kind=j===0?main:secondary;if(!friends[kind])continue;
 var friendSvg=animal(friends[kind]).replace(/^<svg[^>]*>/,"").replace(/<\/svg>\s*$/,"");
 var fx=j===0?75:495,fy=j===0?425:446,k=kind==="baby-dino"?.49:kind==="mother-hen"?.66:kind==="mama-rabbit"?.76:.57;
 art+='<g transform="translate('+fx+' '+fy+') scale('+k+')" opacity=".96">'+friendSvg+'</g>';
}
art+='<ellipse cx="'+(centerX+140)+'" cy="779" rx="151" ry="20" fill="#635c71" opacity=".08"/>';
art+='<g transform="translate('+centerX+' '+y+') scale('+small+') rotate('+((page%5-2)*2)+')">'+body+'</g>';
if(night)art+=prop("stars",355,172,.45);
if(main==="leaves")art+=prop("leaves",505,290,.65);
if(main==="hidden-ball")art+=prop("ball",594,741,.44);
// Place Cleo's same red ball physically beneath the sofa, not beside her paw.
if(id==="cleo"&&(page===3||page===4)){
 art+=prop("red-ball",577,776,.48);
 art+=prop("couch",539,666,1.45);
}
// Story props that should move with the plot rather than materialize randomly.
if(id==="rabbit"&&page===3){art+=prop("apples",528,760,.58)+prop("apples",621,792,.42)}
if(id==="rabbit"&&page===4){art+=prop("hedgehog",555,644,.88)}
if(id==="rabbit"&&page===5){art+=prop("leaf-cover",355,470,1.45)+prop("rain",600,367,.8)}
if(id==="rabbit"&&page===6){art+=prop("rainbow",399,253,1.4)}
if(id==="cleo"&&page===0){art+=prop("pillow",345,760,1.2)}
if(id==="cleo"&&page===5){art+=prop("red-ball",548,756,.55)}
if(id==="cleo"&&page===9){art+=prop("pillow",352,762,1.1)}
if(page===9&&["rabbit","dog","cleo","chick","mouse"].includes(id))art+='<g fill="#ae98ba" font-family="sans-serif" font-weight="700"><text x="529" y="339" font-size="39">z</text><text x="563" y="300" font-size="52">z</text><text x="605" y="255" font-size="67">Z</text></g>';
art+='</svg>';
return art;
}
global.NicoleSceneArt={render:sceneArt,books:Object.keys(pages),pageCount:10};
})(window);