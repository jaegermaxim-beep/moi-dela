/* Мои дела · Cloud Sync beta. Works only after Supabase project is configured. */
(()=>{
'use strict';
const CONFIG_KEY='moi-dela-cloud-config-v1';
const SESSION_KEY='moi-dela-cloud-session-v1';
const $=s=>document.querySelector(s);
const DEFAULT_CONFIG={url:'https://gngbuxdmsrywmjpfyhdk.supabase.co',key:'sb_publishable_TdqXt42Sr5avgVFG5PZ7CQ_yfdX45nC'};
let config={...DEFAULT_CONFIG,...(read(CONFIG_KEY)||{})}, session=read(SESSION_KEY)||null;
let ready=false,busy=false,rerun=false,timer=null;
let state='off',detail='';
function read(k){try{return JSON.parse(localStorage.getItem(k))}catch{return null}}
function write(k,v){try{if(v)localStorage.setItem(k,JSON.stringify(v));else localStorage.removeItem(k)}catch{throw new Error('Браузер не сохраняет параметры облака')}}
function label(){return state==='working'?'Синхронизация…':state==='ok'?'Синхронизировано':state==='offline'?'Нет интернета, изменения сохранены локально':state==='error'?'Ошибка синхронизации':session?'Ожидание синхронизации':'Облако не подключено'}
function updateStatus(){const el=$('[data-cloud-status]');if(el)el.textContent=label()+(detail?' · '+detail:'');}
function status(s,d=''){state=s;detail=d;updateStatus()}
function cleanUrl(url){
 const u=new URL(String(url).trim());
 if(u.protocol!=='https:'||!u.hostname.endsWith('.supabase.co')||u.username||u.password||u.search||u.hash)throw new Error('Нужен HTTPS Project URL вида https://xxxx.supabase.co');
 return u.origin;
}
function cleanKey(key){
 const k=String(key).trim();
 if(k.startsWith('sb_secret_')||k.includes('service_role'))throw new Error('Секретные ключи запрещены в браузере');
 if(!k.startsWith('sb_publishable_')&&!k.startsWith('eyJ'))throw new Error('Используйте Publishable key, не Secret key');
 return k;
}
function headers(access){
 const h={'apikey':config.key,'Content-Type':'application/json'};
 if(access)h.Authorization='Bearer '+access;
 return h;
}
async function request(path,opts={}){
 if(!config.url||!config.key)throw new Error('Сначала сохраните адрес проекта и Publishable key');
 const resp=await fetch(config.url+path,{
  method:opts.method||'POST',
  headers:{...headers(opts.access),...(opts.headers||{})},
  body:opts.body===undefined?undefined:JSON.stringify(opts.body),
  cache:'no-store'
 });
 const txt=await resp.text();
 let body;try{body=txt?JSON.parse(txt):null}catch{body={message:txt.slice(0,140)}}
 if(!resp.ok)throw new Error(String(body?.msg||body?.error_description||body?.message||body?.error||'HTTP '+resp.status).slice(0,220));
 return body;
}
function storeSession(auth){
 if(!auth?.access_token||!auth?.refresh_token)throw new Error('Сеанс не получен. Подтвердите email и войдите');
 session={access_token:auth.access_token,refresh_token:auth.refresh_token,expires_at:Date.now()+(Math.max(60,Number(auth.expires_in)||3600))*1000};
 write(SESSION_KEY,session);
}
async function validToken(){
 if(!session)return null;
 if(Date.now() < session.expires_at-90000)return session.access_token;
 const auth=await request('/auth/v1/token?grant_type=refresh_token',{body:{refresh_token:session.refresh_token}});
 storeSession(auth);return session.access_token;
}
function schedule(ms=900){
 if(!ready||!session||!navigator.onLine)return;
 clearTimeout(timer);timer=setTimeout(()=>sync(),ms);
}
async function sync(){
 if(!ready||!session||!window.MoiDelaBridge)return;
 if(!navigator.onLine){status('offline');return}
 if(busy){rerun=true;return}
 busy=true;rerun=false;status('working');
 try{
  const access=await validToken();
  // Only this authenticated user's rows are accessible (RLS).
  // RPC resolves concurrent versions atomically by item.updatedAt.
  const payload=window.MoiDelaBridge.snapshot();
  const rows=await request('/rest/v1/rpc/moi_dela_sync',{
   body:{p_items:payload},access
  });
  if(!Array.isArray(rows))throw new Error('Неожиданный ответ базы данных');
  window.MoiDelaBridge.mergeRemote(rows.map(r=>r.body).filter(Boolean));
  status('ok',new Date().toLocaleTimeString('ru-RU',{hour:'2-digit',minute:'2-digit'}));
 }catch(err){
  console.error('Cloud sync:',err);
  status(navigator.onLine?'error':'offline',String(err.message||err).slice(0,140));
 }finally{
  busy=false;
  if(rerun){rerun=false;schedule(1500)}
 }
}
function settingsHTML(){
 const connected=!!session;
 const s=label();
 return `<div class="section-head"><h2>Синхронизация устройств</h2></div>
 <div class="panel cloud-panel">
 <div class="setting-row"><div class="col"><strong>Облачный статус</strong><div class="caption" data-cloud-status>${escapeHTML(s+(detail?' · '+detail:''))}</div></div><span style="font-size:22px">☁</span></div>
 <p class="caption" style="padding:0 14px">Задачи сначала сохраняются на этом устройстве. После настройки Supabase изменения синхронизируются через интернет. Личные записи не публикуются на GitHub.</p>
 <form id="cloud-config-form" style="padding:12px 14px" autocomplete="off">
 <label class="field"><span class="field-label">Project URL</span><input class="field-control" required name="url" type="url" value="${escapeHTML(config.url||'')}" placeholder="https://xxxx.supabase.co"></label>
 <label class="field"><span class="field-label">Publishable key</span><input class="field-control" required name="key" type="text" spellcheck="false" value="${escapeHTML(config.key||'')}" placeholder="sb_publishable_..."></label>
 <button class="btn" type="submit">Сохранить параметры облака</button>
 </form>
 ${connected?`<div style="padding:5px 14px 16px"><p class="caption">Выполнен вход. Используй ту же учётную запись на ноутбуке.</p><button class="btn primary" type="button" data-cloud-action="sync">Синхронизировать</button> <button class="btn" type="button" data-cloud-action="logout">Выйти</button></div>`:
 `<form id="cloud-auth-form" style="padding:12px 14px" autocomplete="on">
 <label class="field"><span class="field-label">Электронная почта</span><input class="field-control" name="email" type="email" autocomplete="username" required></label>
 <label class="field"><span class="field-label">Пароль от облачного аккаунта</span><input class="field-control" name="password" type="password" minlength="8" autocomplete="current-password" required></label>
 <div class="sheet-bottom"><button type="submit" class="btn primary" name="cloud-operation" value="signin">Войти</button><button type="submit" class="btn" name="cloud-operation" value="signup">Создать аккаунт</button></div>
 </form>`}
 <p class="caption" style="padding:0 14px 16px">Облачные данные защищены авторизацией и RLS, но не сквозным шифрованием. Сохраняй регулярные защищённые резервные копии.</p>
 </div>`;
}
function escapeHTML(x){return String(x).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]))}
document.addEventListener('submit',async e=>{
 if(e.target.id==='cloud-config-form'){
  e.preventDefault();
  const f=new FormData(e.target);
  try{
   const next={url:cleanUrl(f.get('url')),key:cleanKey(f.get('key'))};
   if(session&&(next.url!==config.url||next.key!==config.key)){
    if(!confirm('Изменение облачного проекта завершит текущий сеанс. Локальные записи останутся. Продолжить?'))return;
    session=null;write(SESSION_KEY,null);
   }
   config=next;write(CONFIG_KEY,config);
   status('off','Параметры сохранены');window.MoiDelaBridge?.refresh();
  }catch(err){status('error',err.message)}
  return;
 }
 if(e.target.id!=='cloud-auth-form')return;
 e.preventDefault();
 const button=e.submitter;
 const operation=button?.value||'signin';
 const f=new FormData(e.target), email=String(f.get('email')||'').trim(),password=String(f.get('password')||'');
 if(!config.url||!config.key){status('error','Сначала сохрани параметры облака');return}
 status('working',operation==='signup'?'Регистрация':'Вход');
 try{
  if(operation==='signup'){
   const auth=await request('/auth/v1/signup',{body:{email,password}});
   if(auth?.access_token){storeSession(auth);status('ok','Аккаунт создан');schedule(0)}
   else status('off','Проверь почту, подтверди email и затем войди');
  }else{
   const auth=await request('/auth/v1/token?grant_type=password',{body:{email,password}});
   storeSession(auth);
   status('off','Вход выполнен');schedule(0);
  }
  window.MoiDelaBridge?.refresh();
 }catch(err){status('error',String(err.message||err))}
});
document.addEventListener('click',e=>{
 const button=e.target.closest('[data-cloud-action]');if(!button)return;
 const action=button.dataset.cloudAction;
 if(action==='sync')sync();
 if(action==='logout'&&confirm('Выйти из облака? Локальные записи останутся на устройстве.')){
  clearTimeout(timer);session=null;write(SESSION_KEY,null);status('off');window.MoiDelaBridge?.refresh();
 }
});
document.addEventListener('moi-dela:ready',()=>{ready=true;status(session?'idle':'off');schedule(500)});
document.addEventListener('moi-dela:changed',()=>{schedule()});
document.addEventListener('visibilitychange',()=>{if(!document.hidden)schedule(200)});
window.addEventListener('online',()=>schedule(300));
window.addEventListener('offline',()=>status('offline'));
setInterval(()=>{if(!document.hidden)schedule(1000)},45000);
window.MoiDelaCloud={settingsHTML,syncNow:sync};
})();
