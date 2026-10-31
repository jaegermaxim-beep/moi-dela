/* Offline SVG fallback for lemon-dress story. These are original, schematic
 illustrations, not a reproduction of the family's ten detailed illustrations. */
(function(global){"use strict";
function flower(x,y,r,c){return '<g transform="translate('+x+' '+y+')"><g fill="'+c+'">'+[0,60,120,180,240,300].map(a=>'<ellipse cx="0" cy="-'+(r*.7)+'" rx="'+(r*.43)+'" ry="'+(r*.72)+'" transform="rotate('+a+')" />').join('')+'</g><circle r="'+(r*.32)+'" fill="#f7d687"/></g>'}
function leaf(x,y,s){return '<g transform="translate('+x+' '+y+') scale('+s+')"><path d="M0 0Q-50-86 17-105Q66-40 0 0Z" fill="#91b88b"/><path d="M0 0 17-92" stroke="#d4e6b5" stroke-width="6"/></g>'}
function lemon(x,y,s){return '<g transform="translate('+x+' '+y+') scale('+s+')"><ellipse rx="21" ry="29" fill="#f3cc53" stroke="#e8ad42" stroke-width="3"/><path d="M3-27q23-19 33-11Q25-13 3-27" fill="#83ad80"/></g>'}
function background(n){
var inside=[0,1,2,7,8,9].includes(n),evening=n>=7;
var sky=evening?"#e8d2c8":"#c6dff1";
var bg='<defs><linearGradient id="ds'+n+'" x1="0" y1="0" x2="0" y2="1"><stop stop-color="'+(n===9?"#b0c5d9":"#fff0cf")+'"/><stop offset="1" stop-color="'+(inside?"#f6e0d4":"#dbe9d0")+'"/></linearGradient></defs><rect width="720" height="900" fill="url(#ds'+n+')"/>';
if(inside){
bg+='<rect x="20" y="16" width="680" height="735" rx="28" fill="#fff5e5" opacity=".6"/><path d="M0 745h720v155H0Z" fill="#d6bdaa"/><g stroke="#bca493" stroke-width="3" opacity=".5"><path d="M0 799h720M0 855h720"/></g>';
bg+='<rect x="55" y="50" width="250" height="365" rx="14" fill="#d3b4a1"/><rect x="71" y="66" width="218" height="335" fill="'+sky+'"/><path d="M180 67v335M72 230h215" stroke="#fff7e4" stroke-width="16"/>';
bg+='<path d="M80 74Q139 205 88 407M280 71Q218 205 275 407" fill="none" stroke="#f5d6c6" stroke-width="35" opacity=".7"/>';
bg+='<rect x="440" y="93" width="237" height="576" rx="22" fill="#f5e8d8" stroke="#c8a48f" stroke-width="13"/>';
for(var q=0;q<4;q++)bg+='<path d="M'+(470+q*52)+' 120v477" stroke="#d8b4a3" stroke-width="3"/>';
bg+='<rect x="454" y="608" width="205" height="35" rx="9" fill="#d9bbac"/>';
} else{
bg+='<path d="M0 606Q155 545 330 606q200-100 390-16v310H0Z" fill="#c9dfb6"/><path d="M0 710Q145 649 340 718q210-100 380-9v191H0Z" fill="#a9cfac"/>';
bg+='<path d="M-10 660q43-61 85-22t79-4q43-61 97 5v100H0M580 664q45-49 86-13t69-7v100H565" fill="#8dbb90" opacity=".7"/>';
for(var j=0;j<9;j++){var cx=32+j*80,cy=655+(j*37)%170;bg+=flower(cx,cy,12+(j%3)*3,j%2?"#e7b1b8":"#f4dfc7")}
bg+='<path d="M20 835Q360 775 700 841" stroke="#ead9ba" stroke-width="27" fill="none"/>';
}
for(var k=0;k<7;k++){var fx=28+(k*101)%677,fy=45+(k*67)%160;bg+=flower(fx,fy,8+(k%3)*2,k%2?"#edc2cc":"#f4dfb9")}
return bg;
}
function child(n){
var sitting=n===8,lying=n===9;
var transform=lying?"translate(350 600) rotate(65) scale(.84)":sitting?"translate(345 520) scale(.94)":"translate(325 485) scale(.96)";
var c='<g transform="'+transform+'">';
if(!lying)c+='<g stroke="#ddbd9b" stroke-width="27" stroke-linecap="round"><path d="M-35 215l-13 125M36 215l16 125"/></g><g fill="#f8f4e9"><ellipse cx="-48" cy="347" rx="27" ry="14"/><ellipse cx="53" cy="347" rx="27" ry="14"/></g>';
var dresscolor=n===1||n===2||n===3||n===4||n===5||n===6||n===7||n===8||n===9?"#f7d474":"#eac96a";
c+='<path d="M-67 1Q0-25 67 1L110 220Q0 273-108 220Z" fill="'+dresscolor+'" stroke="#d7a974" stroke-width="5"/>';
c+='<path d="M-64 41Q0 58 64 41" stroke="#fff8d0" stroke-width="8" fill="none"/>';
for(var j=0;j<9;j++){var x=-74+(j%5)*38,y=97+Math.floor(j/5)*84+(j%2)*18;c+=lemon(x,y,.46)+flower(x+23,y+17,8,"#e68899")}
c+='<path d="M-59 10l-42-49m158 49 42-49" stroke="#d8a27b" stroke-width="20" stroke-linecap="round"/>';
c+='<g fill="#dba88a"><circle cx="-100" cy="-38" r="12"/><circle cx="101" cy="-38" r="12"/></g>';
c+='<rect x="-64" y="-130" width="128" height="145" rx="60" fill="#f5c9a3"/>';
c+='<path d="M-65-76Q-106-205 0-216q101-7 65 140Q48-167 27-158q-40 30-92 82" fill="#e6b375"/><path d="M-67-136Q-26-226 51-170" fill="none" stroke="#e8bc7e" stroke-width="20" stroke-linecap="round"/>';
c+='<g fill="#5e514d"><circle cx="-20" cy="-92" r="6"/><circle cx="26" cy="-92" r="6"/></g><ellipse cy="-68" rx="9" ry="6" fill="#d69688"/><path d="M-16-50q16 16 31 0" fill="none" stroke="#c28378" stroke-width="5" stroke-linecap="round"/>';
c+='<g fill="#e8b5a2"><path d="M-60-21l-22-13 7 33 18-13m112-6 22-14-7 33-18-12"/></g></g>';
return c;
}
function bunny(x,y,s){
return '<g transform="translate('+x+' '+y+') scale('+s+')"><ellipse cx="0" cy="96" rx="65" ry="58" fill="#d2a979"/><ellipse cx="-35" cy="-45" rx="20" ry="83" transform="rotate(-16 -35 -45)" fill="#d9b58b"/><ellipse cx="36" cy="-45" rx="20" ry="83" transform="rotate(17 36 -45)" fill="#d9b58b"/><circle cy="4" r="69" fill="#e0be99"/><path d="M-64 68q58 16 126 0v92h-126Z" fill="#7da9cf"/><circle cx="-22" cy="6" r="6" fill="#403c43"/><circle cx="26" cy="6" r="6" fill="#403c43"/><ellipse cy="32" rx="9" ry="6" fill="#d28f97"/><path d="M0 38q-8 11-17 3m17-3q8 11 17 3" stroke="#8d7479" stroke-width="4" fill="none"/></g>';
}
function props(n){
var p="";
if(n===0||n===1||n===7||n===8)p+='<g transform="translate(520 260)"><path d="M0-35q48-65 95 0v176H0Z" fill="#e2c1af" stroke="#b99481" stroke-width="11"/><path d="M-2-6q37-22 96 0" stroke="#b78e7c" stroke-width="5"/><path d="M5 18q40-18 79 0" stroke="#b78e7c" stroke-width="5"/></g>';
if(n===2)p+='<rect x="510" y="133" width="154" height="396" rx="72" fill="#e0bda1" stroke="#c09b81" stroke-width="16"/><rect x="526" y="147" width="122" height="368" rx="55" fill="#bcdce2"/>';
if(n===3)p+='<path d="M210 630q150 82 271 0" stroke="#fff0d5" stroke-width="9" stroke-dasharray="13 16" fill="none"/>'+bunny(560,656,.56);
if(n===4)p+='<g transform="translate(375 330)"><path d="M0 0q-73-87-95-19 13 54 84 31Q-72 92-13 75 0 47 0 0q42 93 76 70 37-29-8-58 78 31 83-19-12-60-65-13Z" fill="#f2c5d4" stroke="#d6a5c5" stroke-width="5"/><path d="M0-12v75" stroke="#8b7182" stroke-width="9"/></g>';
if(n===5)p+=bunny(148,671,.76)+'<path d="M395 638q105 23 198-29" stroke="#b08d66" stroke-width="17" fill="none"/>'+flower(530,567,25,"#fff0df")+flower(579,560,25,"#fff0df");
if(n===6)p+='<path d="M495 295q-68 120-29 282q29-23 60-2-38-167 35-250" fill="#83b684"/>'+leaf(500,480,1.1);
if(n===7)p+='<path d="M600 500v175" stroke="#c09982" stroke-width="17"/><path d="M535 512q58-56 129-7" fill="none" stroke="#b79384" stroke-width="16"/>';
if(n===8)p+=bunny(135,693,.56)+'<g transform="translate(535 690)">'+lemon(0,0,2)+'</g>';
if(n===9){p+='<path d="M-10 695h740" stroke="#d4b1a5" stroke-width="23"/><path d="M105 595q208 70 404 0" stroke="#e1b7b9" stroke-width="22" fill="none"/>';p+='<g transform="translate(200 115)"><circle r="54" fill="#f8e8b7"/><path d="M26-38a47 47 0 1 0 0 75q-36-37 0-75" fill="#d4dfeb"/></g>'; }
return p;
}
function render(page){
var n=Math.max(0,Math.min(9,Math.floor(Number(page)||0)));
var result='<svg class="story-scene dress-illustration" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 720 900" aria-label="Сцена '+(n+1)+' истории про лимонное платье" role="img">';
result+=background(n);
if(n!==9)result+=child(n);
result+=props(n);
if(n===9)result+=child(n);
if(n===3||n===4||n===5||n===6)for(var i=0;i<10;i++)result+=flower(21+i*72,630+(i*37)%175,9+i%4,"#f3cad3");
result+='</svg>';
return result;
}
global.NicoleDressArt={render:render,pages:10};
})(window);
