/* Nicole Storybook 6.2 — editorially paired original illustrated scenes.
   Vector drawings are an offline alternative to personally imported artwork.
   One moon maximum per scene; no remote images, no tracking. */
(function(global){"use strict";
const BOOKS={
dog:{"name":"Собачка Аф и маленький котёнок","short":"Собачка Аф","emoji":"🐶","card":"#f6dfcf","badge":"Дружба начинается с внимания","text":["Утром щенок Аф проснулся. Рядом с подушкой лежал его красный мячик.","Аф выбежал в сад и громко залаял: «Гав-гав! Поиграем!»","Под кустом сидел маленький котёнок. От громкого лая он испугался.","Аф заметил котёнка и остановился. «Кажется, я его напугал», — подумал он.","Щенок присел поодаль и тихо сказал: «Привет! Я Аф».","Котёнок осторожно вышел из-под куста. Аф подождал, не торопя его.","Вдруг красный мячик закатился под деревянную скамейку.","Котёнок пролез под скамейку и вытолкнул мячик лапкой. Аф терпеливо ждал.","Теперь Аф мягко покатил мячик котёнку. Друзья играли по очереди.","Вечером Аф и котёнок отдыхали рядом. Аф понял: дружба начинается с доброты и внимания."]},
chick:{"name":"Цыплёнок Пипи и цветок для мамы","short":"Цыплёнок Пипи","emoji":"🐥","card":"#fff0bb","badge":"Береги красоту вокруг","text":["Цыплёнок Пипи проснулся в гнёздышке рядом с мамой-курочкой.","Во дворе мама принесла ему зёрнышки. Пипи захотел сделать ей подарок.","У дорожки Пипи увидел красивый розовый цветок.","Он уже потянулся к стебельку клювом, чтобы сорвать цветок.","Но на цветок прилетела пчела. Она собирала сладкий нектар.","Пипи остановился: «Если сорвать цветок, пчеле будет нечего собирать».","Цыплёнок оставил цветок расти и нашёл на земле опавшие лепестки.","Пипи аккуратно сложил лепестки сердечком перед мамой-курочкой.","Мама раскрыла крылышко и ласково обняла Пипи: «Какой заботливый подарок!»","Вечером цветок всё ещё цвёл, а пчела прилетела снова. Пипи понял: красоту можно беречь."]},

cow:{name:"Корова Му и мост дружбы",short:"Му",emoji:"🐮",card:"#dfeecb",badge:"Вместе получается лучше",text:[
"У речки корова Му услышала тихое «кря-кря». На другом берегу стоял утёнок.",
"Утёнок хотел к маме-утке, но боялся заходить в глубокую воду один.",
"Му хотела сразу перейти речку, но остановилась: вода была слишком быстрой.",
"На берегу Му заметила доски от старого деревянного мостика.",
"Му попробовала поднять тяжёлую доску. Одной ей не удалось.",
"«Поможете мне?» — попросила Му зайчика Ася и ёжика. Друзья согласились.",
"Вместе друзья положили доски на низкие крепкие опоры над ручьём.",
"Мама-утка осторожно провела утёнка по мостику на другую сторону.",
"«Кря-кря!» — утёнок обнял маму. Друзья радовались вместе с ним.",
"Му улыбнулась: «Просить помощи — не стыдно. Вместе мы можем больше!»"]},
dino:{name:"Николь и добрый динозавр",short:"Динозавры",emoji:"🦕",card:"#d9ece9",badge:"Сила — это забота",text:[
"Николь пришла в долину динозавров и встретила маленького Тимми.",
"Тимми показал ей цветочную полянку. Он берег каждый колокольчик.",
"На поляну вышел огромный добрый Бобо. Ему тоже хотелось поиграть.",
"Бобо не заметил цветочек и случайно наступил рядом с ним большой лапой.",
"Тимми расстроился, а Бобо опустил голову: «Я совсем не хотел!»",
"Николь предложила: «Давайте посадим новые цветы и позаботимся о них».",
"Тимми сделал маленькие лунки, а Бобо принёс воду в большом листе.",
"Николь положила семена в землю. Друзья осторожно полили грядку.",
"Через несколько дней появились зелёные ростки. Все пришли посмотреть!",
"Теперь Бобо ходил осторожно. «Быть сильным — значит беречь маленьких!»"]},
mouse:{name:"Мышка Пипи и улитка",short:"Мышка",emoji:"🐭",card:"#eee1f2",badge:"Даже маленький может помочь",text:[
"Под корнями старого дуба жила маленькая мышка Пипи.",
"После дождя Пипи выглянула из норки. Листочки блестели от капель.",
"На тропинке мышка увидела улитку, которая медленно ползла домой.",
"Перед улиткой была большая лужа. «Как мне перебраться?» — вздохнула она.",
"Пипи нашла широкий зелёный лист и осторожно положила его на лужицу.",
"Улитка начала переползать по листочку. Пипи ждала рядом и подбадривала её.",
"«Спасибо!» — улыбнулась улитка. «Ты маленькая, но очень добрая!»",
"На небе зажглась первая звезда. Пипи помахала подруге на прощание.",
"Мышка побежала к своему дубу и спряталась в тёплой норке.",
"Перед сном Пипи подумала: «Для доброго дела необязательно быть большим»." ]},
hedgehog:{name:"Ёжик Шуршик и большое яблоко",short:"Шуршик",emoji:"🦔",card:"#f4dfcc",badge:"Делиться радостью",text:[
"Ёжик Шуршик нашёл под яблоней большое красное яблоко.",
"«Я сам донесу его домой!» — решил Шуршик и толкнул яблоко носом.",
"Яблоко застряло между корнями дерева. Ёжик тужился, но оно не двигалось.",
"Мимо прыгал зайчик Ась. «Хочешь, я помогу?» — спросил он.",
"Ёжик кивнул. Друзья вместе осторожно покатили яблоко по тропинке.",
"На поляне они встретили белочку Рыжулю. У неё урчал животик.",
"«Пойдём с нами!» — предложил Шуршик. Он придумал поделиться яблоком.",
"Друзья устроили пикник и разделили яблоко на три вкусных кусочка.",
"Шуршик посмотрел на счастливых друзей. Ему стало теплее, чем от яблока.",
"Вечером ёжик понял: когда делишься добром, радости становится больше."]},
duck:{name:"Утёнок Кря и смелый шажок",short:"Утёнок Кря",emoji:"🦆",card:"#dcf1e9",badge:"Смелость растёт понемногу",text:[
"Утёнок Кря жил с мамой возле тихого пруда.",
"Братья плавали у берега, а Кря стоял в травке и волновался.",
"«Я боюсь воды», — прошептал он. Мама присела рядом.",
"«Не торопись, — сказала мама. — Можно начать с одного маленького шага».",
"Кря осторожно опустил одну лапку в мелкую тёплую воду.",
"Потом он вошёл по колени. Мама-утка всё время была рядом.",
"На воде проплывал зелёный листочек. Кря поплыл за ним вдоль берега.",
"«Кря-кря! У меня получается!» — обрадовался утёнок.",
"Он вернулся к маме и прижался к её мягкому крылу.",
"Кря запомнил: не нужно спешить. Смелость растёт шаг за шагом."]},
squirrel:{name:"Белочка Рыжуля и зимний запас",short:"Рыжуля",emoji:"🐿️",card:"#f9e2c8",badge:"Забота о других",text:[
"Рыжая белочка Рыжуля собирала орешки под большим дубом.",
"Она сложила орешки в корзинку: один, два, три, четыре!",
"На ветке рядом сидела маленькая синичка и грустно смотрела вниз.",
"«Я не нашла ни одного зёрнышка», — тихо сказала птица.",
"Рыжуля задумалась: «Я запасаю на зиму, но подруге сейчас голодно».",
"Белочка отложила себе орешки, а синичке нашла семечки у сосны.",
"Вместе они наполнили маленькую кормушку вкусными зёрнышками.",
"Синичка весело запела. На её песенку прилетели другие птицы.",
"Рыжуля укрыла корзинку с орешками в сухом дупле.",
"Она поняла: помогать друзьям можно, не забывая о своих нуждах."]},
elephant:{name:"Слонёнок Топ и тихая сила",short:"Слонёнок Топ",emoji:"🐘",card:"#e3e7f8",badge:"Заботливая сила",text:[
"Слонёнок Топ гулял по лугу и топал большими ногами: топ-топ!",
"От громкого топота испугались бабочки и улетели с цветов.",
"«Почему они улетели?» — удивился Топ.",
"Маленький зайчик сказал: «Ты добрый, но шаги у тебя очень громкие».",
"Топ попробовал сделать тихий шаг. Потом ещё один.",
"У ручейка Топ увидел маленького жука перед глубокой лужицей.",
"Слонёнок осторожно положил широкий лист над водой, как мостик.",
"Жук перебрался на другую сторону. «Спасибо, Топ!»",
"Бабочки вернулись на цветы, а Топ смотрел на них спокойно.",
"Теперь Топ знал: настоящая сила нужна, чтобы помогать и беречь."]}
};
const L={
dog:[["bedroom","day","wake",[["pillow",495,759,1.1],["red-ball",554,732,0.59]]],["garden","day","bark",[["red-ball",533,730,0.65],["flowers",120,688,0.7]]],["garden","day","listen",[["kitten",550,611,0.48],["bush",553,602,1.2]]],["garden","day","stop",[["kitten",554,615,0.5],["bush",563,585,1.06],["thought",472,282,0.66]]],["garden","day","sit",[["kitten",560,631,0.5],["bush",575,566,1.12],["hello",460,278,0.7]]],["garden","day","wait",[["kitten",550,580,0.63],["bush",577,562,0.82],["hearts",422,264,0.45]]],["garden","day","notice",[["red-ball",553,773,0.66],["bench",530,698,1.05],["kitten",142,575,0.49]]],["garden","day","wait",[["red-ball",548,775,0.54],["kitten",544,813,0.55],["bench",534,702,1.12]]],["meadow","day","gentle",[["kitten",548,566,0.7],["red-ball",355,754,0.72],["ball-trail",424,728,0.73]]],["room","sunset","sleep",[["kitten",540,574,0.66],["red-ball",542,743,0.45],["pillow",382,786,1.06]]]],
chick:[["nest","day","wake",[["hen",532,515,0.66],["straw",375,769,0.85]]],["garden","day","happy",[["hen",532,527,0.63],["grain",520,735,0.86]]],["garden","day","see",[["pink-flower",557,612,1.05],["flowers",122,698,0.6]]],["garden","day","reach",[["pink-flower",528,631,1.05],["reach-lines",459,574,0.63]]],["garden","day","surprise",[["pink-flower",541,654,1.1],["bee",559,580,0.48]]],["garden","day","think",[["bee",553,572,0.51],["pink-flower",550,666,1.03],["thought",392,241,0.5]]],["garden","day","discover",[["pink-flower",567,604,0.97],["fallen-petals",485,768,1.03]]],["garden","day","arrange",[["hen",550,531,0.65],["petal-heart",387,777,0.98]]],["garden","day","hug",[["hen",507,519,0.86],["petal-heart",600,749,0.53],["hearts",351,240,0.57]]],["garden","sunset","smile",[["bee",563,573,0.50],["pink-flower",564,658,1.1],["hen",132,578,0.47]]]],

cow:[
["river","day","listen",[["duck",573,430,.56],["water",380,680,1.7]]],
["river","day","concern",[["duck",570,480,.6],["mother-duck",115,425,.58],["water",370,670,1.8]]],
["river","day","think",[["water",360,680,1.8],["waves",490,575,.8]]],
["river","day","discover",[["planks",550,605,1.07],["water",350,706,1.6]]],
["river","day","effort",[["plank",547,684,1.3],["water",350,690,1.4]]],
["meadow","day","ask",[["rabbit",525,525,.58],["hedgehog",600,740,.66],["plank",147,705,.9]]],
["river","day","work",[["bridge",367,650,1.2],["hedgehog",591,739,.56],["rabbit",122,556,.49]]],
["river","day","encourage",[["bridge",367,655,1.2],["mother-duck",522,605,.53],["duck",448,600,.42]]],
["meadow","sunset","happy",[["mother-duck",506,593,.62],["duck",600,636,.44],["rabbit",130,650,.49],["hearts",380,250,.7]]],
["meadow","sunset","smile",[["rabbit",535,564,.6],["hedgehog",154,699,.63],["hearts",379,235,.8]]]
],
dino:[
["valley","day","hello",[["girl",115,553,.59],["dino-small",556,561,.53],["ferns",460,721,.9]]],
["meadow","day","show",[["flowers",542,629,1.0],["dino-small",115,600,.55],["bellflowers",590,691,.7]]],
["valley","day","arrival",[["dino-large",538,482,.86],["dino-small",145,626,.45]]],
["meadow","day","oops",[["crushed-flower",570,754,1.0],["flowers",105,668,.8],["dino-small",591,548,.42]]],
["meadow","day","sad",[["dino-small",545,590,.56],["crushed-flower",522,751,1.0],["hearts",360,240,.6]]],
["garden","day","idea",[["girl",147,556,.68],["seeds",542,709,.9],["flowers",569,543,.7]]],
["garden","day","work",[["dino-small",134,596,.58],["watering-leaf",537,563,1.05],["soil",359,800,1.2]]],
["garden","day","plant",[["girl",125,555,.6],["seeds",530,700,.8],["soil",375,780,1.15]]],
["garden","day","delight",[["sprouts",548,722,.93],["dino-small",132,591,.56],["girl",615,544,.48]]],
["meadow","sunset","care",[["dino-small",565,584,.55],["flowers",128,699,.8],["sprouts",586,738,.5]]]
],
mouse:[
["forest","day","home",[["hole",540,630,.95],["tree",596,480,1.2]]],
["forest","day","peek",[["hole",557,645,1.0],["rain-drops",132,343,.85]]],
["path","day","notice",[["snail",542,691,.75],["leaf",142,626,.9]]],
["pond","day","concern",[["snail",528,638,.8],["puddle",356,729,1.12]]],
["pond","day","idea",[["leaf-bridge",384,715,1.14],["snail",584,631,.63]]],
["pond","day","wait",[["leaf-bridge",380,709,1.13],["snail",382,622,.69]]],
["meadow","day","happy",[["snail",536,656,.84],["hearts",371,253,.8]]],
["forest","dusk","wave",[["snail",533,718,.65],["single-star",580,187,.52]]],
["forest","dusk","home",[["hole",563,629,1.1],["single-star",552,170,.57]]],
["forest","night","sleep",[["hole",550,634,1.15],["pillow",350,785,.65]]]
],
hedgehog:[
["orchard","day","discover",[["apple",541,641,1.08],["tree",576,390,1.16]]],
["orchard","day","push",[["apple",533,744,1.09],["footprints",161,799,.6]]],
["forest","day","stuck",[["apple",522,757,.98],["roots",530,692,1.05]]],
["forest","day","ask",[["rabbit",538,557,.76],["apple",140,775,.66]]],
["path","day","work",[["rabbit",530,560,.66],["apple",348,755,.89]]],
["meadow","day","notice",[["squirrel",538,552,.64],["apple",167,733,.66]]],
["meadow","day","idea",[["squirrel",522,542,.64],["rabbit",128,559,.64],["apple",380,724,.82]]],
["meadow","day","share",[["picnic",385,768,1.0],["rabbit",130,542,.54],["squirrel",557,543,.54]]],
["meadow","sunset","happy",[["rabbit",133,571,.56],["squirrel",547,566,.56],["hearts",375,255,.8]]],
["forest","sunset","smile",[["apple",545,737,.65],["hearts",340,239,.6]]]
],
duck:[
["pond","day","home",[["mother-duck",530,595,.74],["reeds",98,652,.6]]],
["pond","day","watch",[["mother-duck",537,551,.63],["duck",605,675,.44],["waves",420,710,1.0]]],
["pond","day","afraid",[["puddle",545,752,.81],["mother-duck",123,572,.57]]],
["pond","day","listen",[["mother-duck",524,581,.8],["hearts",403,215,.5]]],
["pond","day","try",[["ripples",531,743,.93],["mother-duck",133,584,.55]]],
["pond","day","wade",[["ripples",523,750,.9],["mother-duck",116,590,.6]]],
["pond","day","swim",[["leaf",535,690,.64],["ripples",500,774,1.1]]],
["pond","day","happy",[["mother-duck",516,565,.68],["hearts",390,216,.7]]],
["pond","sunset","hug",[["mother-duck",518,572,.8],["hearts",369,256,.65]]],
["nest","sunset","sleep",[["mother-duck",536,550,.66],["pillow",378,767,.73]]]
],
squirrel:[
["forest","day","gather",[["nut",535,716,.77],["tree",553,431,1.04]]],
["forest","day","count",[["basket",545,679,.99],["nuts",560,611,.77]]],
["forest","day","notice",[["bird",553,452,.65],["tree",604,502,.96]]],
["forest","day","listen",[["bird",553,461,.75],["empty-feeder",552,605,.7]]],
["forest","day","think",[["basket",540,682,.75],["nuts",561,611,.69]]],
["forest","day","share",[["bird",568,457,.71],["seeds",521,712,.82]]],
["forest","day","work",[["feeder",522,660,1.03],["seeds",564,742,.56]]],
["forest","day","happy",[["birds",547,468,.7],["feeder",575,647,.81]]],
["forest","sunset","store",[["tree-hole",547,512,1.1],["basket",555,704,.73]]],
["forest","sunset","smile",[["bird",562,490,.55],["hearts",381,249,.7]]]
],
elephant:[
["meadow","day","stomp",[["flowers",565,691,.8],["footprints",140,776,.8]]],
["meadow","day","surprised",[["butterflies",526,355,1.0],["flowers",590,663,.76]]],
["meadow","day","question",[["butterflies",552,380,.64],["hearts",385,272,.48]]],
["meadow","day","listen",[["rabbit",542,551,.58],["flowers",118,727,.7]]],
["meadow","day","tiptoe",[["flowers",554,697,.87],["footprints",128,771,.5]]],
["pond","day","discover",[["beetle",540,672,.78],["puddle",550,772,.92]]],
["pond","day","help",[["leaf-bridge",524,736,.93],["beetle",529,676,.53]]],
["pond","day","happy",[["beetle",545,674,.61],["hearts",377,255,.61]]],
["meadow","day","calm",[["butterflies",538,389,.75],["flowers",545,709,.83]]],
["meadow","sunset","smile",[["rabbit",538,570,.56],["hearts",390,248,.7]]]
]};
function fmt(v){return Number(v).toFixed(1)}
function flower(x,y,s,c){return '<g transform="translate('+x+' '+y+') scale('+s+')"><path d="M0 0V70" stroke="#759b69" stroke-width="7" fill="none"/><path d="M0 42q-32-25-36-4q25 19 36 11M0 57q31-30 39-11-28 19-39 17" fill="#8ab78b"/><g fill="'+(c||"#ecc2c8")+'">'+[0,60,120,180,240,300].map(t=>'<ellipse cx="0" cy="-19" rx="13" ry="21" transform="rotate('+t+')"/>').join("")+'</g><circle r="10" fill="#f5db83"/></g>'}
function shrubs(seed,night){let out='';for(let i=0;i<34;i++){let x=(seed*43+i*81)%728-9,y=568+(i*61+seed*8)%308,k=.55+(i%5)*.14; if(x>200&&x<515&&y<765)continue;out+='<path d="M'+x+' '+y+'q-15-25-24-18m24 18q10-25 27-18" stroke="'+(night?"#97b8ab":"#7faa84")+'" stroke-width="'+fmt(4*k)+'" stroke-linecap="round" fill="none"/>';if(i%3===0)out+=flower(x,y-18,.3+(i%3)*.07,i%2?"#e8c3dc":"#fbdfb0");}return out;}
function backdrop(setting,t,seed){
let night=t==="night",sunset=t==="sunset",dusk=t==="dusk",water=setting==="pond"||setting==="river",forest=setting==="forest"||setting==="orchard";
let top=night?"#253a57":dusk?"#7685a1":sunset?"#eeb9a9":"#e3edf2",mid=night?"#647889":dusk?"#c5b5c5":sunset?"#fbe2c4":"#f6f0d5",ground=night?"#69847e":water?"#c5dbbf":forest?"#b6cda5":"#bad6a3";
let s='<defs><linearGradient id="bg-ns" x2="0" y2="1"><stop stop-color="'+top+'"/><stop offset="1" stop-color="'+mid+'"/></linearGradient><linearGradient id="hill-ns" x2="0" y2="1"><stop stop-color="'+ground+'"/><stop offset="1" stop-color="#94b18c"/></linearGradient><filter id="ns-grain"><feTurbulence type="fractalNoise" baseFrequency=".57" numOctaves="2" seed="'+seed+'" stitchTiles="stitch"/></filter></defs>';
s+='<rect width="720" height="900" fill="url(#bg-ns)"/><path d="M0 435q130-100 270-26 180-111 450-1v490H0Z" fill="'+(night?"#65817f":"#cadabd")+'" opacity=".72"/><path d="M0 540q184-92 370 15 178-89 350-30v375H0Z" fill="url(#hill-ns)"/><path d="M0 750q180-88 360-17t360-39v206H0Z" fill="'+(night?"#4b6e6b":"#9fbc94")+'" opacity=".72"/>';
if(water)s+='<path d="M0 608Q175 576 360 619q180 31 360-14v211Q475 793 360 811q-130-44-360-1Z" fill="#9ccbc9" stroke="#e8ebdc" stroke-width="10"/><g stroke="#e6eee5" opacity=".75" stroke-width="5" fill="none"><path d="M30 678q50-19 105 0M247 720q74-20 152-4M523 661q74-17 144 0M445 770q65-18 130-4"/></g>';
if(forest)for(let i=0;i<4;i++){let x=35+i*196-32,h=200+(i%2)*70;s+='<path d="M'+x+' 580v-'+h+'" stroke="#a28d78" stroke-width="37" stroke-linecap="round"/><g fill="'+(night?"#74998d":"#8eba8d")+'"><circle cx="'+x+'" cy="'+(410-h/2)+'" r="86"/><circle cx="'+(x+53)+'" cy="'+(423-h/2)+'" r="72"/><circle cx="'+(x-48)+'" cy="'+(435-h/2)+'" r="65"/></g><g stroke="#c7dfb9" stroke-width="4" opacity=".7"><path d="M'+x+' '+(540-h/2)+'q-35-50-65-46"/></g>';}
if(setting==="valley")for(let i=0;i<4;i++)s+='<path d="M'+(20+i*192)+' 535q-34-180 36-244t80 244" fill="'+(i%2?"#9ac4af":"#b0cdb5")+'" opacity=".8"/>';
if(setting==="garden")s+='<path d="M0 601h720" stroke="#d5c4a4" stroke-width="20"/><g fill="none" stroke="#d6b99b" stroke-width="11">'+Array.from({length:9},(_,i)=>'<path d="M'+(20+i*89)+' 539v150"/>').join("")+'</g>';
if(setting==="bedroom"||setting==="room"){s+='<rect x="0" y="0" width="720" height="900" fill="'+(sunset?"#efd9ce":"#f5e8d5")+'"/><rect y="641" width="720" height="259" fill="#d8bda7"/><rect x="50" y="48" width="244" height="300" rx="19" fill="#c5a894"/><rect x="66" y="65" width="212" height="263" rx="10" fill="'+(sunset?"#edb8ab":"#bfdfe6")+'"/><path d="M172 65v263M68 197h208" stroke="#fff8e7" stroke-width="15"/><path d="M535 412v253" stroke="#b69d88" stroke-width="13"/><rect x="460" y="348" width="155" height="65" rx="28" fill="#ddc9bb"/>';}
if(setting==="nest")s+='<ellipse cx="380" cy="799" rx="275" ry="86" fill="#c4a886"/><ellipse cx="380" cy="755" rx="226" ry="70" fill="#e6d0aa"/>';
if(setting!=="bedroom"&&setting!=="room")s+=shrubs(seed,night);
if(night||dusk){for(let i=0;i<16;i++){let x=(i*127+seed*31)%680+24,y=74+(i*71)%252;s+='<circle cx="'+x+'" cy="'+y+'" r="'+(i%4+2)+'" fill="#fff1bd"/>';}s+='<path d="M601 72a43 43 0 1 0 35 75A48 48 0 0 1 601 72Z" fill="#ffe5af"/>';} else if(sunset)s+='<circle cx="604" cy="123" r="43" fill="#f9c092" opacity=".8"/>';else if(setting!=="bedroom"&&setting!=="room")s+='<g fill="#fffaf3" opacity=".8"><ellipse cx="560" cy="138" rx="95" ry="29"/><circle cx="533" cy="116" r="38"/><circle cx="600" cy="118" r="34"/></g>';
s+='<rect width="720" height="900" opacity=".10" filter="url(#ns-grain)" pointer-events="none"/>';
return s;
}
function animalArt(kind,base){
if(["cow","dino","mouse","rabbit","chick","cleo","dog"].includes(kind)&&base){let b=base(kind);return b.replace(/^<svg[^>]*>/,"").replace(/<\/svg>\s*$/,"")}
let c={hen:"#efe1c8",hedgehog:"#a97e5c",duck:"#f0d77a",squirrel:"#d99b61",elephant:"#aebecf",bird:"#8caab8","mother-duck":"#e6d9b4","dino-small":"#80beb1","dino-large":"#7db1a5"}[kind]||"#e4d1ad";
let ears="",extra="",tail="",features="";
if(kind==="hedgehog"){ears='<path d="M65 182 35 140 95 147 99 97 140 123 182 74 201 123 265 108 251 170" fill="#806b64"/>';extra='<path d="M93 202q58 30 127 0" stroke="#efe2be" stroke-width="15" fill="none"/>';}
if(kind==="hen"){ears='<path d="M108 102q-22-62 5-45 19-33 38 6 20-29 34 5 12 22-15 49" fill="#ce7772"/><path d="M226 166l50 15-50 24" fill="#e9ae60"/>';extra='<path d="M90 233q-48-31-36 22 21 27 57-1" fill="#e8cfb2"/><path d="M185 223q59-24 48 32-31 22-63 0" fill="#ead4b2"/>';}
if(kind==="duck"||kind==="mother-duck"){extra='<path d="M182 168h89q-8 28-88 19Z" fill="#ecaf63"/><path d="M113 226q-45-20-31 17 32 22 66 2" fill="#f7e3a0"/>';}
if(kind==="squirrel"){ears='<path d="M83 145 74 88l55 28M206 119l55-39-18 86" fill="#b98154"/>';tail='<path d="M212 263q92 35 75-64-7-51-54-37" stroke="#bf834e" stroke-width="54" fill="none" stroke-linecap="round"/>';}
if(kind==="elephant"){ears='<ellipse cx="78" cy="173" rx="61" ry="74" fill="#9baabf"/><ellipse cx="230" cy="173" rx="61" ry="74" fill="#9baabf"/><ellipse cx="78" cy="173" rx="39" ry="53" fill="#d4b7c2"/><ellipse cx="230" cy="173" rx="39" ry="53" fill="#d4b7c2"/>';extra='<path d="M171 188q46 35 30 79-18 38-50 2" stroke="#aebecf" stroke-width="43" fill="none" stroke-linecap="round"/>';}
if(kind==="bird"){ears='<path d="M-10 217q92-141 194-4" fill="#b0caca"/><path d="M95 115l16-31 23 29" fill="#91b8c1"/>';extra='<path d="M183 187l42 20-44 16" fill="#e1b57d"/>';}
if(kind==="dino-small"||kind==="dino-large"){ears='<path d="M73 180 53 158l29-16-8-27 36 10 11-32 36 29 22-25 11 30" fill="#9fc7a7"/>';tail='<path d="M215 278q86 25 74-49" stroke="'+c+'" stroke-width="27" fill="none"/>';}
return tail+'<ellipse cx="151" cy="277" rx="83" ry="67" fill="'+c+'" stroke="#a78c7b" stroke-width="4"/>'+ears+'<ellipse cx="155" cy="175" rx="94" ry="88" fill="'+c+'" stroke="#ac9586" stroke-width="4"/><ellipse cx="155" cy="298" rx="48" ry="36" fill="#fff0df" opacity=".7"/>'+extra+'<circle cx="126" cy="169" r="7" fill="#4e4449"/><circle cx="191" cy="169" r="7" fill="#4e4449"/><circle cx="128" cy="166" r="2.4" fill="#fff"/><circle cx="193" cy="166" r="2.4" fill="#fff"/><ellipse cx="158" cy="192" rx="10" ry="7" fill="#c88b8e"/><path d="M145 211q13 12 26 0" stroke="#987f82" fill="none" stroke-width="5"/><g fill="'+c+'"><ellipse cx="95" cy="326" rx="38" ry="19"/><ellipse cx="213" cy="326" rx="38" ry="19"/></g>'+features;
}
function actor(kind,x,y,s,pose,base){
let b=animalArt(kind,base),angle=pose==="oops"?-8:pose==="tiptoe"?-5:pose==="push"?11:pose==="effort"?-11:pose==="sad"?8:pose==="look"?-5:pose==="bark"?-10:pose==="reach"?11:pose==="hug"?-8:pose==="sleep"?17:pose==="stop"?-2:0;
return '<g transform="translate('+x+' '+y+') rotate('+angle+') scale('+s+')"><ellipse cx="165" cy="338" rx="99" ry="12" fill="#594c54" opacity=".13"/>'+b+'</g>'}
function extra(kind,x,y,k,base){
let v="";
switch(kind){
case "red-ball":v='<circle cy="-4" r="49" fill="#db6866" stroke="#ad5556" stroke-width="6"/><path d="M-31-13q33-17 58 7" fill="none" stroke="#f4b6a3" stroke-width="11"/><circle cx="-23" cy="-25" r="9" fill="#ffd8bf" opacity=".8"/>';break;
case "bench":v='<g fill="#c99e7c" stroke="#997153" stroke-width="6"><path d="M-137-95h274v29h-274Z"/><path d="M-141-50h282v37h-282Z"/><path d="M-112-12h26v140h-26ZM88-12h26v140H88Z"/></g><path d="M-136-17H133" stroke="#efd1a6" stroke-width="9"/>';break;
case "bush":v='<g fill="#92bc8d"><ellipse cx="-71" cy="17" rx="75" ry="60"/><ellipse cx="-11" cy="-30" rx="75" ry="65"/><ellipse cx="74" cy="1" rx="77" ry="66"/></g><g fill="#b7d7a6"><ellipse cx="-46" cy="-25" rx="35" ry="27"/><ellipse cx="76" cy="-32" rx="31" ry="25"/></g>';break;
case "thought":v='<g fill="#f6f1df" opacity=".91"><circle cx="0" cy="-30" r="35"/><circle cx="29" cy="-52" r="12"/><circle cx="48" cy="-64" r="7"/></g><path d="M-15-34q15-18 30 0" stroke="#c09c96" stroke-width="6" fill="none"/>';break;
case "hello":v='<path d="M-88-68q0-56 88-56t88 56v73q-48 26-88 5l-52 26 9-45q-45-18-45-59Z" fill="#fffbeb" stroke="#ddc4a7" stroke-width="7"/><path d="M-45-61h90M-20-32h40" stroke="#cfa4a9" stroke-width="7" stroke-linecap="round"/>';break;
case "ball-trail":v='<path d="M-105 0q40-47 73 0t67 0 70 0" stroke="#f5deb5" stroke-width="11" stroke-dasharray="15 18" fill="none"/>';break;
case "pink-flower":v=flower(0,0,1.55,"#e9a8b8");break;
case "straw":v='<g fill="none" stroke="#d6b77d" stroke-width="10">'+Array.from({length:7},(_,i)=>'<path d="M'+(-125+i*37)+' 63q-13-72 10-112"/>').join("")+'</g>';break;
case "bee":v='<g fill="#f7d486" stroke="#9c8063" stroke-width="5"><ellipse cx="0" cy="10" rx="44" ry="29"/></g><path d="M-15-15v51M14-16v50" stroke="#594a4c" stroke-width="13"/><g fill="#fff9eb" opacity=".82"><ellipse cx="-19" cy="-28" rx="20" ry="31" transform="rotate(-25 -19 -28)"/><ellipse cx="17" cy="-28" rx="20" ry="31" transform="rotate(25 17 -28)"/></g><circle cx="35" cy="7" r="5" fill="#4b4042"/>';break;
case "reach-lines":v='<g stroke="#e5ba90" stroke-width="7" stroke-linecap="round"><path d="M-36 40-77 22M-7 18-13-34M32 36 64 6"/></g>';break;
case "fallen-petals":v='<g fill="#dfa1bc">'+[[-72,30,-23],[-12,2,16],[43,39,54],[81,-12,-38]].map(v=>'<ellipse cx="'+v[0]+'" cy="'+v[1]+'" rx="17" ry="28" transform="rotate('+v[2]+' '+v[0]+' '+v[1]+')"/>').join("")+'</g>';break;
case "petal-heart":v='<g fill="#e9a3bb" stroke="#d98dab" stroke-width="2">'+[[-64,-36,-25],[-50,-62,10],[-20,-73,38],[6,-52,-15],[27,-75,-24],[55,-63,29],[71,-35,55],[55,0,80],[32,22,43],[0,51,-3],[-32,23,-45],[-59,-9,-72]].map(z=>'<ellipse cx="'+z[0]+'" cy="'+z[1]+'" rx="13" ry="23" transform="rotate('+z[2]+' '+z[0]+' '+z[1]+')"/>').join("")+'</g>';break;
case "kitten":case "hen":case "mother-duck":case "duck":case "hedgehog":case "rabbit":case "squirrel":case "dino-small":case "dino-large":case "bird":return actor(kind==="kitten"?"cleo":kind,x-120,y-200,k,"",base);
case "girl":v='<circle cy="-46" r="48" fill="#f4c6a7"/><path d="M-50-55q-18-82 52-84 65-2 54 85Q23-113-4-105q-29 11-46 50" fill="#e8bd82"/><path d="M-35 12q35-32 75 0l44 100H-83Z" fill="#f2cf73"/><circle cx="-15" cy="-47" r="4" fill="#55454d"/><circle cx="20" cy="-47" r="4" fill="#55454d"/><path d="M-11-28q12 13 25-1" stroke="#b9857e" stroke-width="4" fill="none"/>';break;
case "water":case "puddle":case "ripples":case "waves":v='<ellipse rx="122" ry="29" fill="#b1d6d2" stroke="#e6f0eb" stroke-width="7"/><path d="M-77 1q32-17 65 0t75 0" stroke="#f3f9eb" stroke-width="5" fill="none"/>';break;
case "planks":case "plank":case "bridge":v='<path d="M-122 53 89-52 127-23-91 88Z" fill="#c4996d" stroke="#98744f" stroke-width="9"/><path d="M-99 46 106-36M-56 65 121-15" stroke="#e2bf8e" stroke-width="6"/>';if(kind==="bridge")v+='<path d="M-110 62v97M108-28v99" stroke="#927456" stroke-width="20"/>';break;
case "bellflowers":case "flowers":case "sprouts":for(let i=0;i<5;i++)v+=flower(-90+i*44,-29+(i%2)*27,kind==="sprouts"?.5:.9,i%2?"#c6bbe8":"#f2c6d4");break;
case "crushed-flower":v='<path d="M-60 37q67-65 142-4" stroke="#6e9a70" stroke-width="9" fill="none"/>'+flower(70,25,.66,"#c0abdc");break;
case "seeds":case "grain":case "nut":case "nuts":v=[[-42,10],[8,-20],[44,24],[3,41],[-22,-42]].map((a,i)=>'<ellipse cx="'+a[0]+'" cy="'+a[1]+'" rx="16" ry="21" transform="rotate('+(i*33)+' '+a[0]+' '+a[1]+')" fill="#c69c60" stroke="#a27b4e" stroke-width="4"/>').join("");break;
case "watering-leaf":case "leaf":case "leaf-bridge":v='<path d="M-125 55Q-106-99 116-90q54 153-236 184Z" fill="#9cbf8a" stroke="#74a474" stroke-width="9"/><path d="M-111 77Q0-12 106-73" fill="none" stroke="#d5e7b6" stroke-width="10"/>';break;
case "apple":v='<path d="M-69-3q-33-83 33-83 38 0 41 25 38-47 77-6 40 76-6 144Q2 127-45 82q-29-31-24-85" fill="#e5786e" stroke="#ba5f59" stroke-width="8"/><path d="M6-68q6-47 23-58" stroke="#8d7155" stroke-width="9"/><ellipse cx="50" cy="-105" rx="28" ry="12" fill="#7cac78"/>';break;
case "basket":case "picnic":v='<path d="M-95-18h190L76 86H-77Z" fill="#c8a077" stroke="#9a7656" stroke-width="8"/><path d="M-70-21q0-110 70-110T70-21" stroke="#ac8962" stroke-width="13" fill="none"/><path d="M-85 16h173M-80 47h159" stroke="#e1c194" stroke-width="9"/>';break;
case "hole":case "tree-hole":v='<ellipse rx="96" ry="81" fill="#c1a27a" stroke="#e8c99d" stroke-width="14"/><ellipse rx="63" ry="57" fill="#5e565d"/>';break;
case "snail":v='<path d="M-88 37q80 30 170 0" fill="none" stroke="#a3b995" stroke-width="24" stroke-linecap="round"/><circle cx="-27" cy="-12" r="50" fill="#cbab93" stroke="#9f8576" stroke-width="6"/><path d="M-59-20q28-58 60-3t-18 43q-38-9-16-29" stroke="#a98186" stroke-width="8" fill="none"/><path d="M46 27v-77M66 27v-77" stroke="#8ba88a" stroke-width="8"/><circle cx="46" cy="-55" r="7" fill="#51444c"/><circle cx="66" cy="-55" r="7" fill="#51444c"/>';break;
case "feeder":case "empty-feeder":v='<path d="M-81-49 0-110 81-49v91H-81Z" fill="#e4c9aa" stroke="#b89672" stroke-width="7"/><path d="M-98-43 0-125 98-43" fill="none" stroke="#c9a27f" stroke-width="18"/><rect x="-61" y="-23" width="122" height="60" rx="12" fill="#f8edcf"/><path d="M0-125v-42" stroke="#96775d" stroke-width="8"/>';break;
case "pillow":v='<rect x="-113" y="-60" width="225" height="120" rx="44" fill="#e8c9d4" stroke="#cda9bb" stroke-width="8"/>';break;
case "beetle":v='<ellipse rx="37" ry="44" fill="#c69b6d"/><ellipse rx="31" ry="34" fill="#a3aa65"/><path d="M0-30v69" stroke="#7e8158" stroke-width="5"/><circle cx="-15" cy="-9" r="6" fill="#eadba4"/><circle cx="16" cy="10" r="6" fill="#eadba4"/>';break;
case "butterflies":v=extra("butterfly",-65,-23,.76)+extra("butterfly",53,-55,.59)+extra("butterfly",82,46,.43);break;
case "butterfly":v='<g fill="#ecc7d5"><ellipse cx="-20" cy="-20" rx="31" ry="46" transform="rotate(-25 -20 -20)"/><ellipse cx="20" cy="-20" rx="31" ry="46" transform="rotate(25 20 -20)"/></g><path d="M0-31v70" stroke="#8a6e76" stroke-width="9"/>';break;
case "rain-drops":v='<g stroke="#96bcc8" stroke-width="7" stroke-linecap="round"><path d="M-44-60l-23 56m82-65-22 55m70-36-25 59"/></g>';break;
case "single-star":v='<path d="M0-52 14-14 54-12 22 12 31 51 0 30-31 51-22 12-54-12-14-14Z" fill="#f6d99d"/>';break;
case "footprints":v='<g fill="#b79e8d">'+[[-68,-14],[-18,25],[36,-21],[88,21]].map(z=>'<ellipse cx="'+z[0]+'" cy="'+z[1]+'" rx="13" ry="23" transform="rotate(31 '+z[0]+' '+z[1]+')"/>').join("")+'</g>';break;
case "soil":case "roots":v='<path d="M-135 57Q0-19 135 57v39H-135Z" fill="#a68969"/><g stroke="#816a55" stroke-width="8" fill="none"><path d="M-90 0Q-61 60-120 93M80-35Q55 54 110 75"/></g>';break;
case "ferns":case "reeds":v='<g fill="none" stroke="#729c73" stroke-width="10"><path d="M-45 72 0-75 45 72M0-75q-52 24-77 63M0-75q63 35 85 54"/></g>';break;
case "hearts":v='<path d="M0 52Q-115-28-60-69q45-20 60 25 28-60 72-23 46 48-72 119" fill="#eaa8ac"/>';break;
case "birds":v=extra("bird",-55,12,.6,base)+extra("bird",74,-37,.43,base);break;
default:v=flower(0,0,.8);
}
return '<g transform="translate('+x+' '+y+') scale('+k+')">'+v+'</g>';
}
function scene(id,index,base){
if(!L[id]||index<0||index>9)return "";
const layout=L[id][index],setting=layout[0],time=layout[1],pose=layout[2],items=layout[3],mainX=(index%3===0?298:index%3===1?327:284),mainY=391;
let s='<svg xmlns="http://www.w3.org/2000/svg" class="story-scene rich-story-scene" viewBox="0 0 720 900" role="img" aria-label="Страница '+(index+1)+' сказки '+BOOKS[id].name+'">';
s+=backdrop(setting,time,index+id.length*5);
// Foreground props are staged in the order the action requires.
for(let i=0;i<items.length;i++){let it=items[i];s+=extra(it[0],it[1],it[2],it[3],base)}
let kind=id==="cow"?"cow":id==="dino"?"dino":id==="mouse"?"mouse":id;
let heroScale=id==="elephant"?.99:id==="cow"?.98:id==="dino"?.92:.88;
if(id==="dog"&&index===9)s+='<g transform="translate(40 200) scale(1 .76)">'+actor(kind,mainX,mainY,heroScale,"sleep",base)+'</g>';
else if(id==="dog"&&(index===4||index===5))s+='<g transform="translate(0 55) scale(1 .86)">'+actor(kind,mainX,mainY,heroScale,pose,base)+'</g>';
else if(id==="chick"&&index===0)s+='<g transform="translate(5 35) scale(1 .88)">'+actor(kind,mainX,mainY,heroScale,pose,base)+'</g>';
else s+=actor(kind,mainX,mainY,heroScale,pose,base);
if(id==="dog"&&index===1)s+='<g><path d="M442 418q38-28 62-2m-51 46q41-12 63 10" fill="none" stroke="#cfa06e" stroke-width="9" stroke-linecap="round"/><text x="494" y="370" font-size="45" font-family="sans-serif" font-weight="800" fill="#91686b">ГАВ!</text></g>';
if(id==="dog"&&index===2)s+='<text x="610" y="425" font-size="50" font-family="sans-serif" font-weight="800" fill="#a5797e">!</text>';
if(id==="chick"&&index===8)s+='<path d="M520 603q-37 91-113 14" fill="none" stroke="#e9d4b7" stroke-width="25" stroke-linecap="round"/>';
if(id==="cow"&&index===7)s+=extra("duck",456,610,.44,base);
if(id==="dino"&&index===7)s+=extra("seeds",385,746,.6,base);
if(id==="mouse"&&index===9)s+=extra("pillow",394,791,.64,base);
s+='<path d="M24 854Q359 871 694 852" fill="none" stroke="#fff7e2" stroke-width="7" opacity=".8"/><g fill="#eecbd2">'+flower(45,827,.48)+flower(663,812,.5)+'</g></svg>';
return s;
}
global.NicoleStoryUpgrade={books:BOOKS,render:scene,ids:Object.keys(BOOKS),apply:function(stories){Object.keys(BOOKS).forEach(id=>{let entry=BOOKS[id],old=stories.find(s=>s.id===id);if(old){old.text=entry.text.slice();old.name=entry.name;old.short=entry.short;old.badge=entry.badge;}else stories.push({id,name:entry.name,short:entry.short,emoji:entry.emoji,card:entry.card,badge:entry.badge,extra:true,text:entry.text.slice()})})},icon:function(id){let entry=BOOKS[id];return entry?'<svg class="new-animal-cover" viewBox="0 0 310 345" xmlns="http://www.w3.org/2000/svg" aria-label="'+entry.name+'" role="img"><ellipse cx="154" cy="333" rx="97" ry="10" fill="#62545c" opacity=".09"/>'+animalArt(id)+'</svg>':""}};
})(window);
