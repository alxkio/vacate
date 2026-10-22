'use strict';
// Synthetic fixtures only. The tab's demo session does not authorize API access.
const demoUser = window.VacateDemo.currentUser();
document.querySelector('#demo-role').textContent = demoUser ? `${demoUser.role} preview` : '';
const DEMO_TODAY = new Date(2026, 9, 22);
const {types:leaveTypes,getType,balanceOf} = window.VacateLeave;
const escapeHtml = value => String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const typeName = id => getType(id)?.name || 'Leave';
const formatAmount = (amount,unit) => `${amount} ${amount===1?({'working days':'working day',days:'day',months:'month',weeks:'week',hours:'hour','hours per day':'hour per day'}[unit] || unit):unit}`;
let showAllBalances = false;
const expandedBalances = new Set();
const people = [
  { id: 'alex', name: 'Alex Morgan', initials: 'AM', team: 'Product' },
  { id: 'jules', name: 'Jules Rivera', initials: 'JR', team: 'Product' },
  { id: 'sam', name: 'Sam Chen', initials: 'SC', team: 'Product' },
  { id: 'mia', name: 'Mia Bennett', initials: 'MB', team: 'Product' },
  { id: 'leo', name: 'Leo Martin', initials: 'LM', team: 'Engineering' },
  { id: 'ava', name: 'Ava Ellis', initials: 'AE', team: 'Engineering' },
  { id: 'noah', name: 'Noah Brooks', initials: 'NB', team: 'Operations' },
];
const entries = [
  { id: 'own-jul', person: 'alex', start: '2026-07-13', end: '2026-07-17', status: 'Approved', type: 'annual', title: 'Summer, somewhere slow' },
  { id: 'own-sep', person: 'alex', start: '2026-09-11', end: '2026-09-11', status: 'Approved', type: 'annual', title: 'A long weekend' },
  { id: 'own-carer', person: 'alex', start: '2026-10-07', end: '2026-10-08', status: 'Approved', type: 'carer', title: 'Time to care' },
  { id: 'own-school', person: 'alex', start: '2026-10-16', end: '2026-10-16', status: 'Approved', type: 'school', title: 'A school visit' },
  { id: 'own-oct', person: 'alex', start: '2026-10-26', end: '2026-10-28', status: 'Approved', type: 'annual', title: 'A little autumn pause' },
  { id: 'own-study', person: 'alex', start: '2026-11-05', end: '2026-11-06', status: 'Approved', type: 'study', title: 'Exam time' },
  { id: 'own-dec', person: 'alex', start: '2026-12-21', end: '2026-12-22', status: 'Pending', type: 'annual', title: 'A winter reset' },
  { id: 'j1', person: 'jules', start: '2026-10-19', end: '2026-10-23' },
  { id: 's1', person: 'sam', start: '2026-10-22', end: '2026-10-23' },
  { id: 'm1', person: 'mia', start: '2026-10-27', end: '2026-10-30' },
  { id: 'l1', person: 'leo', start: '2026-10-21', end: '2026-10-23' },
  { id: 'a1', person: 'ava', start: '2026-10-22', end: '2026-10-26' },
  { id: 'n1', person: 'noah', start: '2026-10-26', end: '2026-10-30' },
];
const params = new URLSearchParams(location.search);
const state = { direction: 'a', scope: 'self', view: 'month', date: new Date(DEMO_TODAY) };
if (['a','b','c'].includes(params.get('direction'))) state.direction = params.get('direction');
if (state.direction === 'b') { state.scope = 'team'; state.view = 'week'; }
if (state.direction === 'c') state.view = 'year';
if (['self','team','org'].includes(params.get('scope'))) state.scope = params.get('scope');
if (['year','month','week','day'].includes(params.get('view'))) state.view = params.get('view');
const $ = selector => document.querySelector(selector);
const dateKey = date => `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
const dateFromKey = key => { const [y,m,d] = key.split('-').map(Number); return new Date(y,m-1,d); };
const addDays = (date, days) => new Date(date.getFullYear(),date.getMonth(),date.getDate()+days);
const monthName = (date, style = 'long') => date.toLocaleDateString('en-GB',{month:style});
const fullDate = date => date.toLocaleDateString('en-GB',{weekday:'long',day:'numeric',month:'long',year:'numeric'});
const shortDate = key => dateFromKey(key).toLocaleDateString('en-GB',{day:'numeric',month:'short'});
const weekStart = date => addDays(date,-((date.getDay()+6)%7));
const scopeName = () => ({self:'My calendar',team:'Product team',org:'Northstar Studio'})[state.scope];
const visiblePeople = () => people.filter(person => state.scope === 'self' ? person.id === 'alex' : state.scope === 'team' ? person.team === 'Product' : true);
const visibleEntries = () => entries.filter(entry => visiblePeople().some(person=>person.id===entry.person));
const entriesOn = date => visibleEntries().filter(entry=>dateKey(date)>=entry.start && dateKey(date)<=entry.end);
const personFor = entry => people.find(person=>person.id===entry.person);
const labelFor = entry => state.scope === 'self' ? `${typeName(entry.type)} · ${entry.status}` : `${personFor(entry).name} · Away`;
const classFor = entry => state.scope === 'self' ? entry.status.toLowerCase() : 'away';
const eventButton = entry => `<button class="event ${classFor(entry)}" data-event="${entry.id}" title="${labelFor(entry)}">${state.scope==='self'?(entry.status==='Approved'?'✓ ':'◷ '):''}${labelFor(entry)}</button>`;
function allowanceMarkup(type) {
  const milestones = type.id==='annual'?`<table class="service-tiers"><caption>Annual service milestones · reference, not an automatic calculation</caption><thead><tr><th>Basis</th><th>5-day week</th></tr></thead><tbody><tr><th>First calendar year</th><td>20 prorated</td></tr><tr><th>Second year / at 12 months</th><td>21 basis</td></tr><tr><th>Third year / at 24 months</th><td>22</td></tr><tr><th>10 years here OR 12 total</th><td>25</td></tr><tr><th>25 total years</th><td>26</td></tr></tbody></table>`:'';
  return `<p class="allowance-limit">${escapeHtml(type.allowance)}</p><p>${escapeHtml(type.rules)}</p>${milestones}<p class="allowance-source">${escapeHtml(type.source)}</p>`;
}
function renderBalances() {
  const shown = showAllBalances?leaveTypes:leaveTypes.filter(type=>['annual','carer','study'].includes(type.id));
  $('#balance-types').innerHTML=shown.map(type=>{
    const balance=balanceOf(type.id);
    const stateLabel=balance?`${balance.available} / ${balance.allocation} ${type.unit} available`:({event:'Per qualifying event',schedule:'Schedule arrangement',variable:'No fixed allowance',supplement:'Annual allocation supplement'})[type.shape] || 'Eligibility to confirm';
    const bar=balance?`<div class="type-bar" role="group" aria-label="${escapeHtml(`${type.name}: allocation ${balance.allocation}, used ${balance.used}, pending ${balance.pending}, available ${balance.available} ${type.unit}`)}"><span class="bar-used" style="width:${balance.used/balance.allocation*100}%" aria-hidden="true"></span><span class="bar-pending" style="width:${balance.pending/balance.allocation*100}%" aria-hidden="true"></span><span class="bar-available" style="width:${balance.available/balance.allocation*100}%" aria-hidden="true"></span></div>`:'';
    return `<details class="type-balance" data-balance="${type.id}" ${expandedBalances.has(type.id)?'open':''}><summary aria-expanded="${expandedBalances.has(type.id)}"><span class="type-title">${type.name}</span><span class="type-quantity">${stateLabel}</span>${balance?`<span class="type-percentage">${balance.percentage}% available</span>`:''}<span class="type-period">${escapeHtml(balance?.period || type.basis)}</span>${bar}</summary><div class="type-balance-body">${balance?`<div class="bar-legend"><span>Used <b>${balance.used}</b></span><span>Pending <b>${balance.pending}</b></span><span>Available <b>${balance.available}</b></span></div><p>Allocation: <b>${balance.allocation} ${type.unit}</b>. ${escapeHtml(balance.note)}</p><p>Used includes approved deductions, including upcoming leave. Pending reservations are counted separately.</p>`:'<p>No available balance is assumed until the applicable event, schedule or eligibility is confirmed.</p>'}<span class="pay-label">${type.pay}</span><h3>Allowance and rules</h3>${allowanceMarkup(type)}${type.shape==='supplement'?'<p>Handled in the annual allocation; not requested as extra leave.</p>':`<button class="inline-link" data-example-type="${type.id}">Preview ${type.name.toLowerCase()} example →</button>`}</div></details>`;
  }).join('');
  document.querySelectorAll('[data-balance]').forEach(details=>details.addEventListener('toggle',()=>{details.querySelector('summary').setAttribute('aria-expanded',String(details.open));details.open?expandedBalances.add(details.dataset.balance):expandedBalances.delete(details.dataset.balance);}));
  $('#balance-toggle').textContent=showAllBalances?'Show fewer types':`Show all ${leaveTypes.length} types`;
  $('#balance-toggle').setAttribute('aria-expanded',String(showAllBalances));
}
function renderUpcoming() {
  const upcoming=entries.filter(entry=>entry.person==='alex'&&entry.end>=dateKey(DEMO_TODAY)).sort((a,b)=>a.start.localeCompare(b.start)).slice(0,3);
  $('.upcoming-card').innerHTML=`<div class="panel-title"><h2>Coming up for you</h2><span>↗</span></div>${upcoming.map(entry=>`<button class="upcoming-event" data-event="${entry.id}"><span class="date-tile"><small>${monthName(dateFromKey(entry.start),'short').toUpperCase()}</small>${dateFromKey(entry.start).getDate()}</span><span><strong>${entry.title}</strong><span>${shortDate(entry.start)}–${shortDate(entry.end)} · ${typeName(entry.type)}</span><span class="status ${entry.status.toLowerCase()}">${entry.status==='Approved'?'✓':'◷'} ${entry.status}</span></span></button>`).join('')}<button class="inline-link" data-nav="leave">View my leave <span>→</span></button>`;
}
function periodLabel() {
  if (state.view==='year') return String(state.date.getFullYear());
  if (state.view==='month') return `${monthName(state.date)} ${state.date.getFullYear()}`;
  if (state.view==='day') return state.date.toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'});
  const first=weekStart(state.date),last=addDays(first,6);
  return `${first.getDate()} ${monthName(first,'short')} – ${last.getDate()} ${monthName(last,'short')} ${last.getFullYear()}`;
}
function datesInPeriod() {
  if(state.view==='day') return [state.date];
  if(state.view==='week') return Array.from({length:7},(_,i)=>addDays(weekStart(state.date),i));
  const start=new Date(state.date.getFullYear(),state.view==='year'?0:state.date.getMonth(),1);
  const end=new Date(state.date.getFullYear(),state.view==='year'?12:state.date.getMonth()+1,0);
  const dates=[]; for(let date=start;date<=end;date=addDays(date,1)) dates.push(date); return dates;
}
function agenda(dates, mobile=false) {
  const shown=state.view==='day'||state.view==='week'?dates:dates.filter(date=>entriesOn(date).length);
  return `<div class="agenda ${mobile?'agenda-mobile':''}">${shown.length?shown.map(date=>`<section class="agenda-day"><h3>${date.toLocaleDateString('en-GB',{weekday:'short',day:'numeric',month:'short'})}<small>All day</small></h3>${entriesOn(date).map(entry=>`<button class="agenda-event ${classFor(entry)}" data-event="${entry.id}"><span>${state.scope==='self'?entry.title:personFor(entry).name}<small>${shortDate(entry.start)} – ${shortDate(entry.end)}${state.scope==='self'?' · '+typeName(entry.type):''}</small></span><span>${state.scope==='self'?entry.status:'Away'}</span></button>`).join('')||'<p class="empty">No leave shown for this date.</p>'}</section>`).join(''):'<p class="empty">No leave shown for this period. Try October or December 2026 to explore the sample requests.</p>'}</div>`;
}
function monthCalendar() {
  const first=new Date(state.date.getFullYear(),state.date.getMonth(),1), start=weekStart(first);
  const weeks=Math.ceil((((first.getDay()+6)%7)+new Date(first.getFullYear(),first.getMonth()+1,0).getDate())/7);
  let html='<div class="month-table-wrap"><table class="month-table"><caption class="sr-only">'+periodLabel()+' · '+scopeName()+'</caption><thead><tr>'+['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(day=>`<th scope="col">${day}</th>`).join('')+'</tr></thead><tbody>';
  for(let week=0;week<weeks;week++) { html+='<tr>'; for(let day=0;day<7;day++) { const date=addDays(start,week*7+day),items=entriesOn(date); html+=`<td class="${day>4?'weekend':''}"><button class="day-number ${dateKey(date)===dateKey(DEMO_TODAY)?'today':''} ${date.getMonth()!==state.date.getMonth()?'outside':''}" data-date="${dateKey(date)}" aria-label="${fullDate(date)}, ${items.length} entries">${date.getDate()}</button>${items.slice(0,2).map(eventButton).join('')}${items.length>2?`<button class="more" data-date="${dateKey(date)}">+${items.length-2} more</button>`:''}</td>`;} html+='</tr>'; }
  return html+'</tbody></table></div>'+agenda(datesInPeriod(),true);
}
function yearCalendar() {
  return '<div class="year-grid">'+Array.from({length:12},(_,month)=>{
    const first=new Date(state.date.getFullYear(),month,1),offset=(first.getDay()+6)%7,count=new Date(first.getFullYear(),month+1,0).getDate();
    const days=Array.from({length:offset},()=>'<div class="mini-day blank">0</div>').join('')+Array.from({length:count},(_,i)=>{
      const date=new Date(first.getFullYear(),month,i+1),items=entriesOn(date);
      return `<div class="mini-day ${items.length?(state.scope!=='self'?'has-away':items.some(e=>e.status==='Pending')?'has-pending':'has-event'):''} ${dateKey(date)===dateKey(DEMO_TODAY)?'is-today':''}" title="${fullDate(date)}${items.length?': '+items.length+' entries':''}">${i+1}</div>`;
    }).join('');
    const total=visibleEntries().filter(e=>dateFromKey(e.start).getFullYear()===first.getFullYear()&&dateFromKey(e.start).getMonth()===month).length;
    return `<section class="mini-month"><button class="month-name" data-month="${month}">${monthName(first)}</button><div class="mini-days">${['M','T','W','T','F','S','S'].map(d=>`<span aria-hidden="true">${d}</span>`).join('')}${days}</div><button class="month-summary" data-month="${month}">${total?total+' '+(state.scope==='self'?'requests':'absences'):'Open month'} →</button></section>`;
  }).join('')+'</div>';
}
function weekCalendar() {
  const dates=datesInPeriod();
  return `<div class="week-table"><table class="month-table"><caption class="sr-only">All-day absences · ${periodLabel()}</caption><thead><tr>${dates.map(date=>`<th scope="col">${date.toLocaleDateString('en-GB',{weekday:'short'})}<small>${date.getDate()} ${monthName(date,'short')}</small></th>`).join('')}</tr></thead><tbody><tr>${dates.map(date=>`<td class="${date.getDay()===0||date.getDay()===6?'weekend':''}"><button class="day-number ${dateKey(date)===dateKey(DEMO_TODAY)?'today':''}" data-date="${dateKey(date)}" aria-label="${fullDate(date)}">${date.getDate()}</button>${entriesOn(date).map(eventButton).join('')||'<small>No leave shown</small>'}</td>`).join('')}</tr></tbody></table></div>${agenda(dates,true)}`;
}
function planner() {
  const dates=state.view==='month'?datesInPeriod():Array.from({length:7},(_,i)=>addDays(weekStart(state.date),i));
  return `<p class="planner-description">${state.scope==='self'?'Your all-day leave':'People in '+scopeName()+' · availability only'} · ${state.view==='month'?'Scroll to explore the month':'All-day absences'}</p><div class="planner-scroll"><table class="planner-table" style="min-width:${Math.max(700,165+dates.length*64)}px"><caption class="sr-only">${scopeName()} · ${periodLabel()}</caption><thead><tr><th class="person-cell" scope="col">${visiblePeople().length} ${state.scope==='self'?'person':'people'}</th>${dates.map(date=>`<th scope="col" class="${dateKey(date)===dateKey(DEMO_TODAY)?'today-col':''}"><small>${date.toLocaleDateString('en-GB',{weekday:'short'})}</small>${date.getDate()}</th>`).join('')}</tr></thead><tbody>${visiblePeople().map(person=>`<tr><th scope="row" class="person-cell"><span class="person-name"><span class="person-avatar">${person.initials}</span><span>${person.name}${person.id==='alex'?' (you)':''}<small>${person.team}</small></span></span></th>${dates.map(date=>{const entry=entriesOn(date).find(entry=>entry.person===person.id);return `<td class="${date.getDay()===0||date.getDay()===6?'weekend':''} ${dateKey(date)===dateKey(DEMO_TODAY)?'today-col':''}">${entry?`<button class="planner-away" data-event="${entry.id}" aria-label="${person.name}, ${fullDate(date)}, ${state.scope==='self'?entry.status:'Away'}">${state.scope==='self'?entry.status:'Away'}</button>`:''}</td>`;}).join('')}</tr>`).join('')}</tbody></table></div>${agenda(dates,true)}`;
}
function render() {
  $('.app').dataset.direction=state.direction;
  document.querySelectorAll('[data-direction]').forEach(button=>{if(button.tagName==='BUTTON') button.setAttribute('aria-pressed',String(button.dataset.direction===state.direction));});
  document.querySelectorAll('[data-scope]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.scope===state.scope)));
  document.querySelectorAll('[data-view]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.view===state.view)));
  $('#period').textContent=periodLabel();
  $('#calendar-caption').textContent=scopeName()+(state.scope==='self'?' · Your leave requests':' · Permitted availability');
  $('#scope-note').textContent=state.scope==='self'?'Only your requests and balances':'Availability only · same demo company';
  $('#subtitle').textContent=state.direction==='b'?'A shared view of time away. A little easier to plan together.':state.direction==='c'?'See the year ahead. Make space for your next break.':'Plan your next break. Keep your team in the picture.';
  $('.calendar-meta>span:last-child').innerHTML=state.scope==='self'?'<span class="tiny-square approved"></span> Approved <span class="tiny-square pending"></span> Pending':'<span class="tiny-square" style="background:#6e8ac4"></span> Away · availability only';
  $('#calendar-footnote').textContent=state.view==='year'?'Select a month to explore dates':state.direction==='b'?'Select an absence to see availability':'Select a date to see details';
  $('#calendar-content').innerHTML=state.view==='year'?yearCalendar():state.view==='day'?agenda([state.date]):state.direction==='b'?planner():state.view==='week'?weekCalendar():monthCalendar();
  $('#date-details').innerHTML='<span class="eyebrow">A LITTLE CONTEXT</span><h2>Pick a day</h2><p>Select a date or an absence to see what’s planned.</p>';
  $('#announcement').textContent=`${scopeName()}, ${state.view} view, ${periodLabel()}`;
}
let dialogTrigger;
const dialog=$('#dialog');
function showDialog(html,trigger) {dialogTrigger=trigger||document.activeElement;dialogTrigger?.focus();$('#dialog-content').innerHTML=html;dialog.showModal();}
dialog.addEventListener('close',()=>{dialogTrigger?.focus();});
function showDate(date,trigger) {
  const items=entriesOn(date);
  const content=`<h2>${fullDate(date)}</h2><p>${scopeName()} · All-day absences</p>${items.length?`<ul class="dialog-list">${items.map(entry=>`<li>${labelFor(entry)}<small>${shortDate(entry.start)} – ${shortDate(entry.end)}</small></li>`).join('')}</ul>`:'<p class="dialog-empty">No leave shown for this date.</p>'}`;
  $('#date-details').innerHTML=`<span class="eyebrow">SELECTED DATE</span><h2>${date.toLocaleDateString('en-GB',{day:'numeric',month:'short'})}</h2><p>${items.length?items.map(labelFor).join('<br>'):'No leave shown for this date.'}</p>`;
  showDialog(content,trigger);
}
function showEvent(id,trigger) {
  // Upcoming personal cards intentionally use an own projection in every scope.
  const entry=entries.find(e=>e.id===id);if(!entry)return;
  const isPersonalCard=!!trigger?.closest('.insights');
  const own=entry.person==='alex'&&(state.scope==='self'||isPersonalCard);
  showDialog(`<span class="eyebrow">${own?'YOUR REQUEST':'AVAILABILITY'}</span><h2>${own?entry.title:personFor(entry).name+' · Away'}</h2><p>${shortDate(entry.start)} – ${shortDate(entry.end)} ${dateFromKey(entry.end).getFullYear()} · All day</p><p>${own?typeName(entry.type)+' · '+entry.status:'Availability in your demo company. Private request details are not shared.'}</p><p>Fictional sample · no changes can be made here.</p>`,trigger);
}
function requestForm(trigger, initialType='annual', example=false) {
  const groups=[...new Set(leaveTypes.map(type=>type.group))];
  const options=groups.map(group=>`<optgroup label="${group}">${leaveTypes.filter(type=>type.group===group).map(type=>`<option value="${type.id}" ${type.id===initialType?'selected':''} ${type.shape==='supplement'?'disabled':''}>${type.name}${type.shape==='supplement'?' — annual allocation adjustment':''}</option>`).join('')}</optgroup>`).join('');
  showDialog(`<span class="eyebrow">${example?'ILLUSTRATIVE TYPE EXAMPLE':'DEMO INTERACTION'}</span><h2>Plan your time away.</h2><p>Preview a request using fictional data. Nothing is submitted or saved.</p><form id="request-form"><label for="leave-type">Leave type</label><select id="leave-type">${options}</select><p id="request-allowance" class="request-allowance"></p><details id="request-rules" class="request-rules"><summary>Allowance and rules</summary><div id="request-rule-content"></div></details><div class="form-row"><div><label for="start-date">From</label><input id="start-date" type="date" value="2026-10-26" required></div><div><label for="end-date">To</label><input id="end-date" type="date" value="2026-10-28" required></div></div><div class="form-row"><div><label for="request-amount">Preview amount</label><input id="request-amount" type="number" min="1" step="1" value="3" required></div><div><label for="request-unit">Unit</label><select id="request-unit"></select></div></div><p class="form-hint">Enter an illustrative amount. Working days and other units are not calculated from these dates.</p><p id="request-balance" class="request-balance" aria-live="polite"></p><button class="primary" type="submit">Preview demo request →</button></form>`,trigger);
  function projection(type) {
    const balance=balanceOf(type.id),amount=Number($('#request-amount').value),unit=$('#request-unit').value;
    const periodMatches=!balance?.period.includes('2026')||[$('#start-date').value,$('#end-date').value].every(date=>date.startsWith('2026-'));
    if(!balance||unit!==type.unit||!periodMatches||!Number.isFinite(amount)||amount<=0) return {text:'Balance cannot be calculated in this demo for this amount, period or unit.',excess:false};
    const after=balance.available-amount;
    return {text:after<0?`Exceeds the illustrative available balance by ${Math.abs(after)} ${unit}. No request will be submitted.`:`Demo preview: ${formatAmount(balance.available,unit)} available → ${formatAmount(after,unit)} after this request.`,excess:after<0};
  }
  function updateProjection() {
    const result=projection(getType($('#leave-type').value));
    $('#request-balance').textContent=result.text;
    $('#request-balance').classList.toggle('over-allowance',result.excess);
  }
  function updateType() {
    const type=getType($('#leave-type').value);
    $('#request-allowance').textContent=`${type.allowance} · ${type.pay}`;
    $('#request-rule-content').innerHTML=allowanceMarkup(type);
    const units=type.id==='school'?['working days','hours']:[type.unit];
    $('#request-unit').innerHTML=units.map(unit=>`<option>${unit}</option>`).join('');
    $('#request-amount').value=type.id==='annual'?'3':'1';
    updateProjection();
  }
  $('#leave-type').addEventListener('change',updateType);
  for(const selector of ['#request-unit','#request-amount','#start-date','#end-date']) $(selector).addEventListener('input',updateProjection);
  for(const selector of ['#start-date','#end-date']) $(selector).addEventListener('input',()=>$('#end-date').setCustomValidity(''));
  updateType();
  if(example)$('#request-rules').open=true;
  $('#request-form').addEventListener('submit',event=>{
    event.preventDefault();const start=$('#start-date'),end=$('#end-date');end.setCustomValidity('');
    if(end.value<start.value){end.setCustomValidity('Choose an end date on or after the start date.');end.reportValidity();return;}
    const type=getType($('#leave-type').value),amount=Number($('#request-amount').value),unit=$('#request-unit').value,result=projection(type);
    $('#dialog-content').innerHTML=`<span class="eyebrow">DEMO ONLY</span><h2>Your preview is ready.</h2><p>${escapeHtml(type.name)} · ${escapeHtml(formatAmount(amount,unit))}</p><p>${shortDate(start.value)} – ${shortDate(end.value)} ${dateFromKey(end.value).getFullYear()}</p><p class="request-balance ${result.excess?'over-allowance':''}">${escapeHtml(result.text)}</p><p>No request was sent or saved. Eligibility, working-day calculations and approval routing are not validated by this preview.</p><button class="primary" id="finish-demo">Back to calendar</button>`;
    $('#finish-demo').addEventListener('click',()=>dialog.close());$('#finish-demo').focus();
  });
}
document.addEventListener('click',event=>{
  const button=event.target.closest('button');if(!button)return;
  if(button.id==='balance-toggle'){showAllBalances=!showAllBalances;renderBalances();return;}
  if(button.dataset.exampleType){requestForm(button,button.dataset.exampleType,true);return;}
  if(button.dataset.direction){state.direction=button.dataset.direction;state.scope=state.direction==='b'?'team':'self';state.view=state.direction==='b'?'week':state.direction==='c'?'year':'month';render();return;}
  if(button.dataset.scope){state.scope=button.dataset.scope;render();return;}
  if(button.dataset.view){state.view=button.dataset.view;render();return;}
  if(button.dataset.month!==undefined){state.date=new Date(state.date.getFullYear(),Number(button.dataset.month),1);state.view='month';render();$('.views [data-view=month]').focus();return;}
  if(button.dataset.date){showDate(dateFromKey(button.dataset.date),button);return;}
  if(button.dataset.event){showEvent(button.dataset.event,button);return;}
  if(button.classList.contains('mobile-menu')){const open=button.getAttribute('aria-expanded')!=='true';button.setAttribute('aria-expanded',String(open));$('#navigation').classList.toggle('open',open);return;}
  if(button.dataset.nav){const nav=button.dataset.nav;
    if(nav==='calendar'){document.querySelectorAll('[data-nav]').forEach(b=>b.classList.toggle('selected',b.dataset.nav==='calendar'&&b.classList.contains('nav-item')));$('#main').focus();return;}
    if(nav==='leave'){showDialog('<h2>Your leave</h2><p>Fictional requests for Alex Morgan. Balance figures are illustrative.</p><ul class="dialog-list">'+entries.filter(e=>e.person==='alex').map(e=>`<li>${e.title}<small>${shortDate(e.start)} – ${shortDate(e.end)} · ${typeName(e.type)} · ${e.status}</small></li>`).join('')+'</ul>',button);return;}
    if(nav==='people'){showDialog('<h2>Meet the demo company</h2><p>Fictional people for comparing calendar layouts.</p><ul class="dialog-list">'+people.map(p=>`<li>${p.name}<small>${p.team}</small></li>`).join('')+'</ul>',button);return;}
    showDialog('<h2>Approvals</h2><p>This destination shows where an authorized approver’s inbox could live. Approval actions and permissions are outside this calendar study.</p>',button);return;
  }
  const action=button.dataset.action;
  if(action==='today'){state.date=new Date(DEMO_TODAY);render();}
  if(action==='previous'||action==='next'){const delta=action==='previous'?-1:1,date=state.date;
    state.date=state.view==='year'?new Date(date.getFullYear()+delta,date.getMonth(),1):state.view==='month'?new Date(date.getFullYear(),date.getMonth()+delta,1):addDays(date,delta*(state.view==='week'?7:1));render();}
  if(action==='request')requestForm(button);
  if(action==='help')showDialog('<h2>A little guide</h2><p>Compare A, B and C above, then try the scope and period controls. Select dates or leave entries for details. Today returns to the fixed demo date, 22 October 2026.</p><p>Week and day views show all-day absences. On a small screen, detailed calendars become readable agendas. All interactions use local fictional data.</p>',button);
  if(action==='account')showDialog(`<h2>Alex Morgan</h2><p>${demoUser?.role || 'User'} demo · Northstar Studio</p><p>Signed in as ${demoUser?.username || 'user'}. Both demo accounts explore the same fictional company. Production permissions remain to be agreed.</p><button class="primary" data-action="logout">Sign out</button>`,button);
  if(action==='logout')window.VacateDemo.logout();
});
renderBalances();
renderUpcoming();
render();
