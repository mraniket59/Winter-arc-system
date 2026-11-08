'use strict';
const KEY='winterArcSystemV1';
const RANKS=[['E',1,5],['D',6,10],['C',11,20],['B',21,35],['A',36,50],['S',51,75],['National Level',76,9999]];
const STATS={str:'Strength',int:'Intelligence',dis:'Discipline',end:'Endurance',foc:'Focus'};
const DIFFS=['Easy','Normal','Hard','Extreme'];
const DQ=[['q1','Morning Routine','Wake on time, freshen up, plan the day',20,'Easy','dis'],['q2','Workout','Strength training session',40,'Hard','str'],['q3','Running / Cardio','20+ minutes of running or cardio',30,'Normal','end'],['q4','Study','Two focused hours',40,'Hard','int'],['q5','Reading','Read 20 pages',20,'Easy','int'],['q6','Skill Development','Practice coding or another skill',30,'Normal','foc'],['q7','Content Creation','Create or publish content',30,'Normal','foc'],['q8','Hydration','Drink 3 litres of water',10,'Easy','end'],['q9','Sleep Schedule','In bed on time, 7+ hours',20,'Normal','dis'],['q10','Screen-Time Management','Stay under your screen limit',20,'Normal','dis']].map(a=>({id:a[0],name:a[1],desc:a[2],xp:a[3],diff:a[4],stat:a[5]}));
const BD=[['b1','Complete 5 workout sessions',5,150],['b2','Study for 25 hours',25,250],['b3','Complete 7 days of morning routines',7,150],['b4','Finish a personal project',1,300]];
const $=s=>document.querySelector(s);
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const dkey=d=>d.toLocaleDateString('en-CA');
const today=()=>dkey(new Date());
const addDays=(k,n)=>{const d=new Date(k+'T00:00:00');d.setDate(d.getDate()+n);return dkey(d)};
const weekKey=()=>{const d=new Date();d.setDate(d.getDate()-(d.getDay()+6)%7);return dkey(d)};
const need=l=>100+50*(l-1);
function lv(xp){let l=1;while(xp>=need(l)){xp-=need(l);l++}return{l,cur:xp,max:need(l)}}
const rankOf=l=>RANKS.find(r=>l>=r[1]&&l<=r[2]);
const rname=l=>{const r=rankOf(l)[0];return r==='National Level'?r:r+'-Rank'};
const bar=(p,c)=>`<div class="bar ${c||''}"><i style="width:${Math.max(0,Math.min(100,p))}%"></i></div>`;
const TABS=[['dash','System','◈'],['quests','Quests','✦'],['status','Status','♜'],['boss','Boss','☠'],['stats','Stats','▤'],['set','Settings','⚙']];
let tab='dash',S,deferred=null;

function defaults(){return{name:'ANIKET',xp:0,pts:0,total:0,stats:{str:5,int:5,dis:5,end:5,foc:5},quests:DQ.map(q=>({...q})),days:{},xpDay:{},fails:[],last:null,greet:'',boss:{week:'',items:[]},cfg:{pen:false,penXp:10}}}
function load(){try{const r=JSON.parse(localStorage.getItem(KEY));if(r&&Array.isArray(r.quests))return Object.assign(defaults(),r)}catch(e){}return defaults()}
function save(){try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){toast('STORAGE FULL OR BLOCKED','bad')}}
function toast(m,k){const e=document.createElement('div');e.className='toast '+(k||'');e.textContent=m;$('#toasts').appendChild(e);setTimeout(()=>e.remove(),3100)}
function rankUp(l){$('#rankup').innerHTML=`<div><small>RANK UP!</small><h1>${rname(l)}</h1><small>Tap to continue</small></div>`;$('#rankup').hidden=false;toast('RANK UP!','up');setTimeout(()=>$('#rankup').hidden=true,4000)}
function gain(x,t){const b=lv(S.xp).l;S.xp=Math.max(0,S.xp+x);if(x>0)S.xpDay[t]=(S.xpDay[t]||0)+x;const a=lv(S.xp).l;
 if(a>b){S.pts+=3*(a-b);toast('LEVEL UP! LEVEL '+a+' (+'+3*(a-b)+' stat points)','up');if(rankOf(a)[0]!==rankOf(b)[0])rankUp(a)}}
function complete(id){const t=today(),d=S.days[t]||(S.days[t]={done:[],total:S.quests.length});const q=S.quests.find(x=>x.id===id);
 if(!q||d.done.includes(id))return;d.done.push(id);S.total++;S.stats[q.stat]++;gain(q.xp,t);
 toast('QUEST COMPLETED +'+q.xp+' XP');setTimeout(()=>toast('WINTER ARC PROGRESS UPDATED'),400)}
function closeDay(k){const d=S.days[k]||(S.days[k]={done:[],total:0});if(d.closed)return 0;let n=0;
 S.quests.forEach(q=>{if(!d.done.includes(q.id)){n++;S.fails.push({date:k,name:q.name});if(S.cfg.pen)gain(-S.cfg.penXp,k)}});
 d.total=S.quests.length;d.closed=true;S.fails=S.fails.slice(-300);return n}
function rollover(){const t=today();if(!S.last){S.last=t;return 0}let d=S.last,n=0,c=0;
 while(d<t&&c++<400){n+=closeDay(d);d=addDays(d,1)}S.last=t;return n}
function weekCheck(){const w=weekKey();if(S.boss.week!==w||!S.boss.items.length){const old=S.boss.items,keep=old.length?old:BD.map(b=>({id:b[0],name:b[1],target:b[2],xp:b[3]}));
 S.boss={week:w,items:keep.map(b=>({id:b.id,name:b.name,target:b.target,xp:b.xp,p:0,claimed:false}))}}}
const ok=k=>{const d=S.days[k];if(!d)return false;const n=k===today()?S.quests.length:d.total;return n>0&&d.done.length/n>=0.7};
function streaks(){const t=today();let cur=0,k=ok(t)?t:addDays(t,-1);while(ok(k)){cur++;k=addDays(k,-1)}
 let best=0,run=0,prev=null;Object.keys(S.days).sort().forEach(k=>{if(ok(k)){run=prev&&addDays(prev,1)===k?run+1:1;prev=k;best=Math.max(best,run)}});return{cur,best:Math.max(best,cur)}}
const sumXp=n=>{let s=0;for(let i=0;i<n;i++)s+=S.xpDay[addDays(today(),-i)]||0;return s};

function qRow(q,edit){const d=S.days[today()],dn=d&&d.done.includes(q.id);
 return `<div class="q ${dn?'done':''}"><button class="chk" data-a="done" data-v="${q.id}" ${dn?'disabled':''} aria-label="Complete ${esc(q.name)}">${dn?'✔':'○'}</button>
 <div><b>${esc(q.name)}</b><span class=m>${esc(q.desc)}</span><br><span class="tag ${q.diff}">${q.diff}</span> <span class=m>+${q.xp} XP · ${STATS[q.stat]}</span></div>
 ${edit?`<div style="flex:none"><button class="sm ghost" data-a=eq data-v="${q.id}">Edit</button> <button class="sm danger" data-a=dq data-v="${q.id}">Del</button></div>`:''}</div>`}
const V={
dash(){const L=lv(S.xp),st=streaks(),d=S.days[today()]||{done:[]},n=S.quests.length,p=n?Math.round(d.done.length/n*100):0,left=S.quests.filter(q=>!d.done.includes(q.id));
 return `<section class=card><div class=row><div><small>PLAYER</small><h2>${esc(S.name)}</h2></div><div class=badge>${rname(L.l)}</div></div>
 <div class=row><span>LEVEL ${L.l}</span><span class=m>${L.cur} / ${L.max} XP</span></div>${bar(L.cur/L.max*100)}
 <table><tr><td>Total XP<b>${S.xp}</b></td><td>Streak<b>🔥 ${st.cur}</b></td><td>Quests done<b>${S.total}</b></td></tr></table></section>
 <section class=card><h3>TODAY'S PROGRESS</h3><div class=row><span>${d.done.length} / ${n} quests</span><span>${p}%</span></div>${bar(p,'g')}<small>Reach 70% to keep your streak alive.</small></section>
 <section class=card><h3>REMAINING QUESTS</h3>${left.length?left.map(q=>qRow(q)).join(''):'<p class=m>All quests cleared. Rest well, Hunter.</p>'}</section>`},
quests(){const f=S.fails.slice(-15).reverse();
 return `<section class=card><div class=row><h3>DAILY QUESTS</h3><button class=pri data-a=addq>+ New quest</button></div>${S.quests.length?S.quests.map(q=>qRow(q,1)).join(''):'<p class=m>No quests. Add one to begin.</p>'}</section>
 <section class=card><h3>FAILURE HISTORY</h3>${f.length?`<table><tr><th>Date</th><th>Quest</th></tr>${f.map(x=>`<tr><td>${x.date}</td><td>${esc(x.name)}</td></tr>`).join('')}</table>`:'<p class=m>No failed quests yet.</p>'}</section>`},
status(){const L=lv(S.xp),mx=Math.max(20,...Object.values(S.stats));
 return `<section class=card><h3>PLAYER STATUS</h3><div class=row><span>${esc(S.name)}</span><span class=badge>${rname(L.l)}</span></div><div class=row><span>Level ${L.l}</span><span class=m>${S.xp} XP</span></div>${bar(L.cur/L.max*100)}
 <div class=row><span>Unspent stat points</span><b>${S.pts}</b></div></section>
 <section class=card><h3>ATTRIBUTES</h3>${Object.keys(STATS).map(k=>`<div class=row><span>${STATS[k]}</span><span><b>${S.stats[k]}</b> ${S.pts>0?`<button class="sm pri" data-a=pt data-v=${k}>+1</button>`:''}</span></div>${bar(S.stats[k]/mx*100)}`).join('')}
 <small>Each quest raises its linked stat by 1. Every level-up grants 3 points.</small></section>
 <section class=card><h3>RANKS</h3><table><tr><th>Rank</th><th>Levels</th></tr>${RANKS.map(r=>`<tr class="${rankOf(L.l)===r?'me':''}"><td>${r[0]==='National Level'?r[0]:r[0]+'-Rank'}</td><td>${r[1]}${r[2]>999?'+':'–'+r[2]}</td></tr>`).join('')}</table></section>`},
boss(){return `<section class=card><div class=row><h3>WEEKLY BOSS QUESTS</h3><button class=pri data-a=addb>+ New</button></div><small>Week of ${S.boss.week}. Resets every Monday.</small>
 ${S.boss.items.map(b=>`<div class=q style="display:block"><b>${esc(b.name)}</b><div class=row><span class=m>${b.p} / ${b.target} · Reward ${b.xp} XP</span><span>${Math.round(b.p/b.target*100)}%</span></div>${bar(b.p/b.target*100,b.p>=b.target?'g':'')}
 <div class=row><span><button class="sm ghost" data-a=bm data-v="${b.id}">−1</button> <button class="sm" data-a=bp data-v="${b.id}">+1</button></span>
 <span>${b.claimed?'<span class=Easy>✔ Claimed</span>':`<button class="sm pri" data-a=bc data-v="${b.id}" ${b.p>=b.target?'':'disabled'}>Claim</button>`} <button class="sm danger" data-a=bd data-v="${b.id}">Del</button></span></div></div>`).join('')||'<p class=m>No boss quests. Add one.</p>'}</section>`},
stats(){const st=streaks(),t=today(),days=[];for(let i=6;i>=0;i--)days.push(addDays(t,-i));const mx=Math.max(1,...days.map(k=>S.xpDay[k]||0));
 const wk=[];for(let w=3;w>=0;w--){let s=0;for(let i=0;i<7;i++)s+=S.xpDay[addDays(t,-w*7-i)]||0;wk.push(s)}const wm=Math.max(1,...wk);
 let dn=0,tt=0,good=0;for(let i=0;i<30;i++){const k=addDays(t,-i),d=S.days[k];if(!d)continue;dn+=d.done.length;tt+=k===t?S.quests.length:d.total;if(ok(k))good++}
 const pct=tt?Math.round(dn/tt*100):0,cons=Math.round(good/30*100);
 return `<section class=card><h3>OVERVIEW</h3><table><tr><td>Today XP<b>${S.xpDay[t]||0}</b></td><td>7-day XP<b>${sumXp(7)}</b></td><td>30-day XP<b>${sumXp(30)}</b></td></tr>
 <tr><td>Completion (30d)<b>${pct}%</b></td><td>Consistency<b>${cons}%</b></td><td>Streak / Best<b>${st.cur} / ${st.best}</b></td></tr></table>${bar(pct,'g')}</section>
 <section class=card><h3>DAILY XP (LAST 7 DAYS)</h3><div class=chart>${days.map(k=>`<div><i style="height:${(S.xpDay[k]||0)/mx*85}%"></i>${new Date(k+'T00:00:00').toLocaleDateString('en',{weekday:'short'})}</div>`).join('')}</div></section>
 <section class=card><h3>WEEKLY XP (LAST 4 WEEKS)</h3><div class=chart>${wk.map((v,i)=>`<div><i style="height:${v/wm*85}%"></i>${i===3?'This wk':(3-i)+'w ago'}<br>${v}</div>`).join('')}</div></section>`},
set(){return `<section class=card><h3>SETTINGS</h3><label>Player name<input id=sn maxlength=20 value="${esc(S.name)}"></label>
 <label><input type=checkbox id=sp ${S.cfg.pen?'checked':''}> Deduct XP for each failed quest (optional penalty)</label>
 <label>Penalty XP per failed quest (0–100)<input id=sx type=number min=0 max=100 value=${S.cfg.penXp}></label></section>
 <section class=card><h3>BACKUP</h3><div class=row><button class=pri data-a=exp>Export JSON</button><button data-a=imp>Import JSON</button></div><input type=file id=fi accept=".json,application/json" hidden>
 ${deferred?'<div class=row><button class=pri data-a=inst>Install app</button></div>':''}</section>
 <section class=card><h3>DANGER ZONE</h3><button class=danger data-a=rst>Reset all progress</button></section>`}};

function render(){const L=lv(S.xp);$('#hdr').textContent='LV '+L.l+' · '+rname(L.l);
 $('#nav').innerHTML=TABS.map(t=>`<button data-a=tab data-v=${t[0]} class="${tab===t[0]?'on':''}"><i>${t[2]}</i>${t[1]}</button>`).join('');$('#app').innerHTML=V[tab]()}
function dlg(html,fn){const d=$('#dlg');d.innerHTML=`<form method=dialog>${html}<p class=err id=err></p><div class=row><button value=x class=ghost>Cancel</button><button id=okb class=pri>Save</button></div></form>`;
 $('#okb').onclick=e=>{e.preventDefault();const m=fn();if(m)$('#err').textContent=m;else{d.close();save();render()}};d.showModal()}
const opts=(a,sel)=>a.map(x=>`<option value="${x[0]}" ${x[0]===sel?'selected':''}>${x[1]}</option>`).join('');
function qDlg(id){const q=S.quests.find(x=>x.id===id)||{name:'',desc:'',xp:20,diff:'Normal',stat:'dis'};
 dlg(`<h3>${id?'EDIT':'NEW'} QUEST</h3><label>Name<input id=f1 maxlength=40 value="${esc(q.name)}"></label><label>Description<input id=f2 maxlength=100 value="${esc(q.desc)}"></label>
 <label>XP reward (1–500)<input id=f3 type=number min=1 max=500 value=${q.xp}></label><label>Difficulty<select id=f4>${opts(DIFFS.map(x=>[x,x]),q.diff)}</select></label>
 <label>Linked stat<select id=f5>${opts(Object.entries(STATS),q.stat)}</select></label>`,()=>{
  const n=$('#f1').value.trim(),x=Number($('#f3').value);if(!n)return 'Enter a quest name.';if(!Number.isInteger(x)||x<1||x>500)return 'XP must be a whole number from 1 to 500.';
  const o={name:n,desc:$('#f2').value.trim(),xp:x,diff:$('#f4').value,stat:$('#f5').value};
  if(id)Object.assign(q,o);else S.quests.push({id:'u'+Date.now(),...o})})}
function bDlg(){dlg(`<h3>NEW BOSS QUEST</h3><label>Name<input id=f1 maxlength=60></label><label>Target count (1–1000)<input id=f2 type=number min=1 max=1000 value=5></label><label>Reward XP (1–1000)<input id=f3 type=number min=1 max=1000 value=100></label>`,()=>{
 const n=$('#f1').value.trim(),t=Number($('#f2').value),x=Number($('#f3').value);if(!n)return 'Enter a name.';if(!Number.isInteger(t)||t<1||t>1000)return 'Target must be 1–1000.';if(!Number.isInteger(x)||x<1||x>1000)return 'Reward must be 1–1000.';
 S.boss.items.push({id:'u'+Date.now(),name:n,target:t,xp:x,p:0,claimed:false})})}
function exportData(){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(S,null,1)],{type:'application/json'}));a.download='winter-arc-backup-'+today()+'.json';a.click();toast('BACKUP EXPORTED')}
function importData(f){const r=new FileReader();r.onload=()=>{try{const o=JSON.parse(r.result);if(!o||!Array.isArray(o.quests)||typeof o.xp!=='number'||typeof o.stats!=='object')throw 0;
 S=Object.assign(defaults(),o);weekCheck();save();render();toast('BACKUP IMPORTED')}catch(e){toast('INVALID BACKUP FILE','bad')}};r.readAsText(f)}
const boss=id=>S.boss.items.find(b=>b.id===id);
document.addEventListener('click',e=>{if(e.target.closest('#rankup')){$('#rankup').hidden=true;return}
 const b=e.target.closest('[data-a]');if(!b)return;const a=b.dataset.a,v=b.dataset.v;
 if(a==='tab'){tab=v;scrollTo(0,0)}else if(a==='done')complete(v);else if(a==='addq')return qDlg();else if(a==='eq')return qDlg(v);
 else if(a==='dq'){if(!confirm('Delete this quest?'))return;S.quests=S.quests.filter(q=>q.id!==v)}
 else if(a==='pt'){if(S.pts>0){S.pts--;S.stats[v]++}}
 else if(a==='addb')return bDlg();
 else if(a==='bp'){const x=boss(v);if(x&&x.p<x.target){x.p++;if(x.p===x.target)toast('BOSS DEFEATED! CLAIM YOUR REWARD','up')}}
 else if(a==='bm'){const x=boss(v);if(x&&x.p>0&&!x.claimed)x.p--}
 else if(a==='bc'){const x=boss(v);if(x&&x.p>=x.target&&!x.claimed){x.claimed=true;gain(x.xp,today());toast('BOSS REWARD +'+x.xp+' XP')}}
 else if(a==='bd'){if(!confirm('Delete this boss quest?'))return;S.boss.items=S.boss.items.filter(x=>x.id!==v)}
 else if(a==='exp')return exportData();else if(a==='imp')return $('#fi').click();
 else if(a==='inst'){deferred.prompt();deferred=null}
 else if(a==='rst'){if(confirm('Reset ALL progress?')&&confirm('This cannot be undone. Really reset?')){S=defaults();S.last=today();weekCheck();toast('SYSTEM INITIALIZED')}else return}
 save();render()});
document.addEventListener('change',e=>{const i=e.target;
 if(i.id==='sn'){const n=i.value.trim();if(n){S.name=n.slice(0,20)}else{i.value=S.name;toast('NAME CANNOT BE EMPTY','bad')}}
 else if(i.id==='sp')S.cfg.pen=i.checked;
 else if(i.id==='sx'){const x=Number(i.value);if(Number.isInteger(x)&&x>=0&&x<=100)S.cfg.penXp=x;else{i.value=S.cfg.penXp;toast('ENTER 0–100','bad')}}
 else if(i.id==='fi'&&i.files[0]){importData(i.files[0]);i.value='';return}
 else return;save();render()});
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferred=e;if(tab==='set')render()});
(function boot(){const first=!localStorage.getItem(KEY);S=load();const f=rollover();weekCheck();
 if(first)toast('SYSTEM INITIALIZED');if(S.greet!==today()){S.greet=today();setTimeout(()=>toast('DAILY QUESTS HAVE ARRIVED'),first?900:100)}
 if(f)setTimeout(()=>toast('DAILY QUEST FAILED: '+f+' unfinished','bad'),1000);
 save();render();if('serviceWorker'in navigator)navigator.serviceWorker.register('service-worker.js').catch(()=>{})})();
