const DAYS_ORDER = ['A','B','C','D'];
const DAY_INFO = {
  A:{name:'אימון A',desc:'חזה • כתפיים • יד אחורית',emoji:'🔥'},
  B:{name:'אימון B',desc:'גב • יד קידמית • בטן',emoji:'💪'},
  C:{name:'אימון C',desc:'רגליים • כתפיים',emoji:'🦵'},
  D:{name:'אימון D',desc:'גב • חזה • ידיים',emoji:'⚡'},
};

const WEIGHT_OPTIONS = Array.from({ length: 121 }, (_, i) => (i * 2.5).toFixed(1).replace('.0', ''));
const REPS_OPTIONS = Array.from({ length: 30 }, (_, i) => `${i + 1}`);
const REST_OPTIONS = [45, 60, 75, 90, 120, 150, 180];

function defaultPlan(){
  return [
    {id:1,day:'A',muscle:'חזה',name:'לחיצת חזה עליון במכונה',reps:'6-8',sets:3,weights:[45,45,45],coach:'',rest:120},
    {id:2,day:'A',muscle:'חזה',name:'לחיצת חזה שכיבה במכונה',reps:'8-10',sets:3,weights:[45,40,40],coach:'',rest:90},
    {id:3,day:'A',muscle:'חזה',name:'פרפר במכונה',reps:'12-15',sets:3,weights:[64,59,63],coach:'דרופ סט כל סט — 2 משקלי עבודה (כ-30%)',rest:90},
    {id:4,day:'A',muscle:'חזה',name:'חזה תחתון בכבלים',reps:'10-12',sets:3,weights:[7.5,7.5,7.5],coach:'',rest:90},
    {id:5,day:'A',muscle:'כתפיים',name:'הרחקת כתפיים במכונה',reps:'12-15',sets:3,weights:[27,36,36],coach:'דרופ סט בסט אחרון',rest:90},
    {id:6,day:'A',muscle:'יד אחורית',name:'פשיטת מרפק מאחורי הראש — פולי תחתון',reps:'10-15',sets:3,weights:[25,30,30],coach:'',rest:90},
    {id:7,day:'A',muscle:'יד אחורית',name:'פשיטת מרפק עם מוט ישר / חבל / משולש',reps:'8-10',sets:3,weights:[35,35,35],coach:'דרופ סט בסט אחרון',rest:90},
    {id:8,day:'B',muscle:'גב',name:'משיכה באחיזה רוחב כתפיים — פולי עליון',reps:'8-10',sets:3,weights:[87.5,90,90],coach:'',rest:120},
    {id:9,day:'B',muscle:'גב',name:'משיכה בסופינציה — פולי עליון',reps:'8-10',sets:3,weights:[87.5,87.5,87.5],coach:'',rest:90},
    {id:10,day:'B',muscle:'גב',name:'חתירה במכונה',reps:'8-10',sets:3,weights:[55,55,55],coach:'',rest:90},
    {id:11,day:'B',muscle:'גב',name:'פול אובר עם מוט',reps:'10-12',sets:3,weights:[27.5,27.5,27.5],coach:'דרופ סט כל סט — 2 משקלי עבודה (כ-30%)',rest:90},
    {id:12,day:'B',muscle:'כתפיים',name:'כתף אחורית — מכונה פרפר הפוך / כבל',reps:'10-15',sets:3,weights:[55,55,41],coach:'',rest:90},
    {id:13,day:'B',muscle:'יד קידמית',name:'כפיפת מרפק בשיפוע חיובי 60°',reps:'6,8,10,15',sets:3,weights:[12.5,15,15],coach:'',rest:90},
    {id:14,day:'B',muscle:'יד קידמית',name:'כפיפת מרפק יד-יד במכונה',reps:'20,15,12',sets:3,weights:[45,31.5,38],coach:'עם הגב לפולי + דרופ סט עם הפנים לפולי',rest:90},
    {id:15,day:'B',muscle:'בטן',name:'תרגיל בטן לבחירה',reps:'10-12',sets:3,weights:[0,0,0],coach:'לא חובה',rest:60},
  ];
}

let plan = JSON.parse(localStorage.getItem('plan_v2')||'null') || defaultPlan();
let history = JSON.parse(localStorage.getItem('history_v2')||'[]');
let settings = JSON.parse(localStorage.getItem('settings_v1')||'{"weeklyGoal":4}');
let currentDay = 'A';
let completedSets = {};
let editingId = null;

let wmExercises = [];
let wmIdx = 0;
let wmSetData = {};
let restInterval = null;
let restTotal = 90;
let restRemaining = 0;

function init(){
  document.getElementById('today-date').textContent = new Date().toLocaleDateString('he-IL',{weekday:'long',day:'numeric',month:'long',year:'numeric'});
  fillWheelOptions();
  if(history.length>0){
    const lastDay = history[0].day;
    const idx = DAYS_ORDER.indexOf(lastDay);
    currentDay = DAYS_ORDER[(idx+1)%4];
  }
  loadSets();
  renderDaySelector();
  renderTodayCard();
  renderExercises();
  renderStats();
  renderHistory();
  renderPlan();
  renderInsights();
}

function fillWheelOptions() {
  document.getElementById('e-base-weight').innerHTML = WEIGHT_OPTIONS.map((w) => `<option>${w}</option>`).join('');
  document.getElementById('e-rest').innerHTML = REST_OPTIONS.map((r) => `<option>${r}</option>`).join('');
}

function showPage(p,btn){
  document.querySelectorAll('.page').forEach((x) => x.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach((x) => x.classList.remove('active'));
  document.getElementById('page-'+p).classList.add('active');
  if(btn) btn.classList.add('active');
}

function renderTodayCard(){
  const info = DAY_INFO[currentDay];
  const exes = plan.filter((e) => e.day===currentDay);
  const done = exes.filter((e) => isExDone(e)).length;
  const pct = exes.length ? Math.round(done/exes.length*100) : 0;
  document.getElementById('today-card').innerHTML = `
    <div class="today-label">${info.emoji} ${info.name}</div>
    <div class="today-type">${info.desc}</div>
    <div class="today-sub">${exes.length} תרגילים${done>0?' • '+done+' הושלמו':''}</div>
    <div class="progress-bar"><div class="progress-fill" style="width:${pct}%"></div></div>
  `;
}

function renderInsights() {
  const weekWorkouts = history.filter((h)=>(Date.now()-new Date(h.date).getTime())<7*864e5).length;
  const streak = calculateStreak();
  const prs = calculatePRCount();
  const volume = Math.round(calculateWeeklyVolume());
  document.getElementById('insights-grid').innerHTML = `
    <div class="stat-card"><div class="stat-val">${weekWorkouts}/${settings.weeklyGoal}</div><div class="stat-lbl">יעד שבועי</div></div>
    <div class="stat-card"><div class="stat-val">${streak}</div><div class="stat-lbl">רצף ימים</div></div>
    <div class="stat-card"><div class="stat-val">${prs}</div><div class="stat-lbl">שיאים אישיים</div></div>
    <div class="stat-card"><div class="stat-val">${volume}</div><div class="stat-lbl">נפח שבועי (ק"ג)</div></div>
  `;
}

function calculateStreak() {
  const uniqueDays = [...new Set(history.map((h) => h.date.split('T')[0]))].sort().reverse();
  if (!uniqueDays.length) return 0;
  let streak = 0;
  let date = new Date();
  for (const d of uniqueDays) {
    const key = date.toISOString().split('T')[0];
    if (d === key) {
      streak += 1;
      date.setDate(date.getDate() - 1);
    } else if (streak === 0) {
      date.setDate(date.getDate() - 1);
      if (d === date.toISOString().split('T')[0]) {
        streak += 1;
        date.setDate(date.getDate() - 1);
      } else break;
    } else break;
  }
  return streak;
}

function calculatePRCount() {
  const map = {};
  history.slice().reverse().forEach((session) => {
    session.exercises.forEach((e) => {
      const weight = Math.max(...(e.weights || [0]));
      if (!map[e.name] || weight > map[e.name]) map[e.name] = weight;
    });
  });
  return Object.values(map).filter((w) => w > 0).length;
}

function calculateWeeklyVolume() {
  return history
    .filter((h)=>(Date.now()-new Date(h.date).getTime())<7*864e5)
    .flatMap((h) => h.exercises)
    .reduce((sum, ex) => sum + (ex.weights?.reduce((a,b)=>a+b,0) || 0), 0);
}

function setWeeklyGoal() {
  const next = Number(prompt('מה היעד השבועי שלך לאימונים?', settings.weeklyGoal));
  if (!next || next < 1 || next > 14) return;
  settings.weeklyGoal = next;
  localStorage.setItem('settings_v1', JSON.stringify(settings));
  renderInsights();
  showToast('🎯 יעד עודכן');
}

function exportData() {
  const backup = { plan, history, settings, exportedAt: new Date().toISOString() };
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `abdc-backup-${todayKey()}.json`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('📤 הגיבוי נשמר');
}

function importData(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const payload = JSON.parse(reader.result);
      if (payload.plan) plan = payload.plan;
      if (payload.history) history = payload.history;
      if (payload.settings) settings = payload.settings;
      localStorage.setItem('plan_v2', JSON.stringify(plan));
      localStorage.setItem('history_v2', JSON.stringify(history));
      localStorage.setItem('settings_v1', JSON.stringify(settings));
      renderPlan(); renderExercises(); renderTodayCard(); renderStats(); renderHistory(); renderInsights();
      showToast('📥 הגיבוי נטען בהצלחה');
    } catch {
      alert('קובץ גיבוי לא תקין');
    }
  };
  reader.readAsText(file);
  event.target.value = '';
}

function applyLastSessionWeights() {
  const last = history.find((h) => h.day === currentDay);
  if (!last) return showToast('אין אימון קודם להעתקה');
  let changes = 0;
  plan = plan.map((ex) => {
    const old = last.exercises.find((e) => e.name === ex.name);
    if (!old || ex.day !== currentDay) return ex;
    changes += 1;
    return { ...ex, weights: old.weights || ex.weights };
  });
  localStorage.setItem('plan_v2', JSON.stringify(plan));
  renderExercises();
  showToast(`🔁 עודכנו ${changes} תרגילים`);
}

function renderDaySelector(){
  document.getElementById('day-selector').innerHTML = DAYS_ORDER.map((d) => `
    <button class="day-btn ${d===currentDay?'active':''}" onclick="selectDay('${d}')">
      ${d}<div class="dname">${DAY_INFO[d].desc.split('•')[0].trim()}</div>
    </button>`).join('');
}

function selectDay(d){ currentDay=d; loadSets(); renderDaySelector(); renderTodayCard(); renderExercises(); }
function loadSets(){ completedSets = JSON.parse(localStorage.getItem('sets_'+todayKey()+'_'+currentDay)||'{}'); }
function saveSets(){ localStorage.setItem('sets_'+todayKey()+'_'+currentDay, JSON.stringify(completedSets)); }

function renderExercises(){
  const exes = plan.filter((e) => e.day===currentDay);
  const c = document.getElementById('exercises-container');
  const fb = document.getElementById('finish-btn');
  if(!exes.length){ c.innerHTML='<div class="empty"><div class="em">😴</div><p>אין תרגילים</p></div>'; fb.style.display='none'; return; }
  fb.style.display='block';
  c.innerHTML = exes.map((ex,idx)=>{
    const done = isExDone(ex);
    const suggest = getWeightSuggest(ex);
    let setsHtml = '';
    for(let s=0;s<ex.sets;s++){
      const k=ex.id+'_'+s; const isDone=completedSets[k];
      const w=ex.weights[s]||ex.weights[0]||0;
      setsHtml+=`<div class="set-item ${isDone?'done':''}" onclick="toggleSet(${ex.id},${s},${ex.rest})">
        <div class="slabel">סט ${s+1}</div>
        <div class="sweight">${w>0?w+' ק"ג':'BW'}</div>
        <div class="sreps">${ex.reps}</div>
      </div>`;
    }
    return `<div class="ex-card ${done?'done':''}">
      <div class="ex-header" onclick="toggleCard(${ex.id})">
        <div class="ex-num">${done?'✓':(idx+1)}</div>
        <div class="ex-info">
          <div class="ex-name">${ex.name}</div>
          <div class="ex-meta">${ex.muscle} • ${ex.sets} סטים × ${ex.reps}${ex.weights[0]>0?' • '+ex.weights[0]+' ק"ג':''}</div>
        </div>
      </div>
      <div class="ex-body" id="eb-${ex.id}" style="display:none">
        ${ex.coach?`<div class="coach-tip">🏅 ${ex.coach}</div>`:''}
        ${suggest?`<div class="suggest-up">⬆️ ${suggest}</div>`:''}
        <div class="sets-grid">${setsHtml}</div>
        <div class="rest-info">⏱ מנוחה: ${ex.rest} שניות</div>
      </div>
    </div>`;
  }).join('');
  for(const ex of exes){ if(!isExDone(ex)){document.getElementById('eb-'+ex.id).style.display='block';break;} }
}

function toggleCard(id){ const b=document.getElementById('eb-'+id); b.style.display=b.style.display==='none'?'block':'none'; }
function toggleSet(exId,sIdx,rest){ const k=exId+'_'+sIdx; if(completedSets[k]) delete completedSets[k]; else { completedSets[k]=true; startRest(rest); } saveSets(); renderExercises(); renderTodayCard(); }
function isExDone(ex){ for(let s=0;s<ex.sets;s++) if(!completedSets[ex.id+'_'+s]) return false; return true; }

function getWeightSuggest(ex){
  const logs = history.filter((h) => h.day===ex.day&&h.exercises.some((e) => e.name===ex.name));
  if(logs.length<2) return null;
  const last = logs[0].exercises.find((e) => e.name===ex.name);
  if(last&&last.allDone) return 'כל הסטים הושלמו! שקול להעלות ב-2.5 ק"ג 💪';
  return null;
}

function finishWorkout(){
  const exes = plan.filter((e) => e.day===currentDay);
  if(!exes.filter((e) => isExDone(e)).length){ showToast('⚠️ לא סיימת אף תרגיל'); return; }
  history.unshift({ date:new Date().toISOString(), day:currentDay, dayName:DAY_INFO[currentDay].name, desc:DAY_INFO[currentDay].desc, exercises:exes.map((ex) => ({name:ex.name,muscle:ex.muscle,weights:ex.weights,reps:ex.reps,allDone:isExDone(ex)})) });
  localStorage.setItem('history_v2',JSON.stringify(history));
  localStorage.removeItem('sets_'+todayKey()+'_'+currentDay);
  completedSets={};
  showToast('🎉 אימון הושלם ונשמר! כל הכבוד!');
  renderExercises(); renderTodayCard(); renderHistory(); renderStats(); renderInsights();
}

function startRest(secs){ clearInterval(restInterval); restTotal=secs; restRemaining=secs; document.getElementById('rest-overlay').classList.add('open'); updateRestUI(); restInterval=setInterval(()=>{ restRemaining--; updateRestUI(); if(restRemaining<=0){ clearInterval(restInterval); document.getElementById('rest-overlay').classList.remove('open'); showToast('⏰ הגיע הזמן!'); } },1000); }
function updateRestUI(){ document.getElementById('rest-num').textContent=restRemaining; const deg=(restTotal-restRemaining)/restTotal*360; document.getElementById('rest-circle').style.background=`conic-gradient(var(--accent) ${deg}deg, var(--border) ${deg}deg)`; }
function skipRest(){ clearInterval(restInterval); document.getElementById('rest-overlay').classList.remove('open'); }

function startWorkout(){
  wmExercises = plan.filter((e) => e.day===currentDay);
  if(!wmExercises.length){ showToast('אין תרגילים לאימון זה'); return; }
  wmIdx=0; wmSetData={};
  const saved = JSON.parse(localStorage.getItem('sets_'+todayKey()+'_'+currentDay)||'{}');
  wmExercises.forEach((ex)=>{ wmSetData[ex.id]=Array.from({length:ex.sets},(_,i)=>({weight:ex.weights[i]||ex.weights[0]||0,reps:'',done:!!saved[ex.id+'_'+i]})); });
  document.getElementById('workout-overlay').classList.add('open');
  renderWM();
}

function closeWorkout(){ document.getElementById('workout-overlay').classList.remove('open'); }

function renderSelectOptions(options, selected) {
  return options.map((opt) => `<option value="${opt}" ${String(opt)===String(selected)?'selected':''}>${opt}</option>`).join('');
}

function renderWM(){
  const ex = wmExercises[wmIdx];
  const total = wmExercises.length;
  const pct = Math.round(wmIdx/total*100);
  document.getElementById('wm-badge').textContent = `${DAY_INFO[ex.day].name} ${DAY_INFO[ex.day].emoji}`;
  document.getElementById('wm-title').textContent = ex.name;
  document.getElementById('wm-prog').textContent = `תרגיל ${wmIdx+1} מתוך ${total}`;
  document.getElementById('wm-pfill').style.width = pct+'%';

  const sets = wmSetData[ex.id];
  const setsHtml = sets.map((s,i)=>{
    const isActive = !s.done && sets.slice(0,i).every((x) => x.done);
    const cls = s.done?'wm-done':isActive?'wm-active':'';
    return `<div class="wm-set-row ${cls}">
      <div class="wm-snum">${s.done?'✓':(i+1)}</div>
      <div class="wm-sinfo">
        <div class="wm-starget">סט ${i+1} • יעד: ${ex.reps}</div>
        <div class="wm-shint">${s.done?'הושלם ✓':'בחר בגלגלת ולחץ ✓'}</div>
      </div>
      <div class="wm-sinputs">
        <div class="wm-igroup"><label>משקל</label>
          <select class="wheel-select" ${s.done?'disabled':''} onchange="wmUpdate(${ex.id},${i},'weight',this.value)">${renderSelectOptions(WEIGHT_OPTIONS, s.weight)}</select>
        </div>
        <div class="wm-igroup"><label>חזרות</label>
          <select class="wheel-select" ${s.done?'disabled':''} onchange="wmUpdate(${ex.id},${i},'reps',this.value)">${renderSelectOptions(REPS_OPTIONS, s.reps || 8)}</select>
        </div>
        <button class="wm-scheck" onclick="wmDoneSet(${ex.id},${i},${ex.rest})">✓</button>
      </div>
    </div>`;
  }).join('');

  document.getElementById('wm-body').innerHTML = `<div class="wm-ex-muscle">${ex.muscle}</div><div class="wm-ex-name">${ex.name}</div>${ex.coach?`<div class="wm-coach">🏅 ${ex.coach}</div>`:''}<div class="wm-sets">${setsHtml}</div>`;

  const isLast = wmIdx===total-1;
  const allDone = sets.every((s) => s.done);
  document.getElementById('wm-footer').innerHTML = `${wmIdx>0?`<button class="wm-btn wm-prev" onclick="wmGo(-1)">⟵ הקודם</button>`:'<div></div>'}${isLast&&allDone?`<button class="wm-btn wm-next wm-end" onclick="wmFinish()">🎉 סיים אימון!</button>`:`<button class="wm-btn wm-next" onclick="wmGo(1)">${isLast?'סיים':'הבא ⟶'}</button>`}`;
}

function wmUpdate(exId,i,field,val){ wmSetData[exId][i][field] = field==='weight'?parseFloat(val)||0:val; }
function wmDoneSet(exId,i,rest){ const s=wmSetData[exId][i]; s.done=!s.done; const k=exId+'_'+i; if(s.done){ completedSets[k]=true; saveSets(); startRest(rest); } else { delete completedSets[k]; saveSets(); } renderWM(); renderExercises(); renderTodayCard(); }
function wmGo(dir){ const n=wmIdx+dir; if(n<0||n>=wmExercises.length)return; wmIdx=n; renderWM(); document.getElementById('wm-body').scrollTop=0; }
function wmFinish(){ finishWorkout(); closeWorkout(); }

function renderHistory(){
  const list=document.getElementById('history-list');
  if(!history.length){ list.innerHTML='<div class="empty"><div class="em">📭</div><p>אין אימונים עדיין</p></div>'; return; }
  list.innerHTML=history.slice(0,30).map((h,i)=>{
    const date=new Date(h.date).toLocaleDateString('he-IL',{weekday:'short',day:'numeric',month:'short'});
    const done=h.exercises.filter((e) => e.allDone).length;
    return `<div class="hist-card"><div class="hist-hdr" onclick="toggleHist(${i})"><div><div class="hist-date">${date} — ${h.dayName}</div><div class="hist-type">${h.desc}</div></div><div class="hist-badge">${done}/${h.exercises.length} ✓</div></div><div class="hist-body" id="hb-${i}">${h.exercises.map((e)=>`<div class="hist-row"><span>${e.name}</span><span style="color:var(--muted)">${e.weights&&e.weights[0]>0?e.weights[0]+' ק"ג':'BW'} × ${e.reps}</span>${e.allDone?'<span style="color:var(--green)">✓</span>':''}</div>`).join('')}</div></div>`;
  }).join('');
}
function toggleHist(i){ document.getElementById('hb-'+i).classList.toggle('open'); }

function renderStats(){
  const total=history.length;
  const week=history.filter((h)=>(new Date()-new Date(h.date))<7*864e5).length;
  const allW=history.flatMap((h)=>h.exercises.flatMap((e)=>e.weights||[])).filter((w)=>w>0);
  const maxW=allW.length?Math.max(...allW):0;
  document.getElementById('stats-grid').innerHTML=`<div class="stat-card"><div class="stat-val">${total}</div><div class="stat-lbl">סה"כ אימונים</div></div><div class="stat-card"><div class="stat-val">${week}</div><div class="stat-lbl">השבוע</div></div><div class="stat-card"><div class="stat-val">${history.filter((h,i,a)=>a.findIndex((x)=>x.day===h.day)===i).length}</div><div class="stat-lbl">סוגי אימונים</div></div><div class="stat-card"><div class="stat-val">${maxW}</div><div class="stat-lbl">שיא משקל ק"ג</div></div>`;
}

function renderPlan(){
  document.getElementById('plan-container').innerHTML = DAYS_ORDER.map((d)=>{
    const exes=plan.filter((e)=>e.day===d);
    return `<div class="sec-title">${DAY_INFO[d].emoji} ${DAY_INFO[d].name} — ${DAY_INFO[d].desc}</div>${exes.map((ex)=>`<div class="plan-row" onclick="openEdit(${ex.id})"><div class="plan-muscle">${ex.muscle}</div><div class="plan-name">${ex.name}</div><div class="plan-meta">${ex.sets}×${ex.reps}<br>${ex.weights[0]>0?ex.weights[0]+' ק"ג':'BW'}</div></div>`).join('')}<button class="add-btn" onclick="openAdd('${d}')">+ הוסף תרגיל לאימון ${d}</button>`;
  }).join('');
}

function openEdit(id){
  editingId=id; const ex=plan.find((e)=>e.id===id);
  document.getElementById('modal-title').textContent='✏️ עריכת תרגיל';
  document.getElementById('e-name').value=ex.name;
  document.getElementById('e-muscle').value=ex.muscle;
  document.getElementById('e-day').value=ex.day;
  document.getElementById('e-reps').value=ex.reps;
  document.getElementById('e-sets').value=String(ex.sets);
  document.getElementById('e-base-weight').value=String(ex.weights[0] || 0);
  document.getElementById('e-step-weight').value='0';
  document.getElementById('e-coach').value=ex.coach||'';
  document.getElementById('e-rest').value=String(ex.rest||90);
  document.getElementById('btn-del').style.display='block';
  document.getElementById('modal-overlay').classList.add('open');
}

function openAdd(day){
  editingId=null;
  document.getElementById('modal-title').textContent='+ תרגיל חדש';
  document.getElementById('e-name').value='';
  document.getElementById('e-muscle').value='';
  document.getElementById('e-day').value=day;
  document.getElementById('e-reps').value='10-12';
  document.getElementById('e-sets').value='3';
  document.getElementById('e-base-weight').value='20';
  document.getElementById('e-step-weight').value='0';
  document.getElementById('e-coach').value='';
  document.getElementById('e-rest').value='90';
  document.getElementById('btn-del').style.display='none';
  document.getElementById('modal-overlay').classList.add('open');
}

function closeModal(){ document.getElementById('modal-overlay').classList.remove('open'); }

function saveExercise(){
  const name=document.getElementById('e-name').value.trim();
  if(!name){ alert('הכנס שם תרגיל'); return; }
  const sets=Number(document.getElementById('e-sets').value)||3;
  const base=Number(document.getElementById('e-base-weight').value)||0;
  const step=Number(document.getElementById('e-step-weight').value)||0;
  const weights=Array.from({length:sets},(_,i)=>Math.max(0, +(base + (step*i)).toFixed(2)));
  const data={name,muscle:document.getElementById('e-muscle').value.trim(),day:document.getElementById('e-day').value,reps:document.getElementById('e-reps').value,sets,weights,coach:document.getElementById('e-coach').value.trim(),rest:Number(document.getElementById('e-rest').value)||90};
  if(editingId){ const i=plan.findIndex((e)=>e.id===editingId); plan[i]={...plan[i],...data}; }
  else { plan.push({id:Date.now(),...data}); }
  localStorage.setItem('plan_v2',JSON.stringify(plan));
  closeModal(); renderPlan(); renderExercises(); renderTodayCard();
  showToast('💾 נשמר!');
}

function deleteExercise(){ if(!confirm('למחוק?')) return; plan=plan.filter((e)=>e.id!==editingId); localStorage.setItem('plan_v2',JSON.stringify(plan)); closeModal(); renderPlan(); renderExercises(); renderTodayCard(); showToast('🗑 נמחק'); }
function todayKey(){ return new Date().toISOString().split('T')[0]; }
function showToast(msg){ const t=document.getElementById('toast'); t.textContent=msg; t.classList.add('show'); setTimeout(()=>t.classList.remove('show'),3000); }

init();
