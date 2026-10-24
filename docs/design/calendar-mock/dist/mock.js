'use strict';
// Synthetic fixtures only. The tab's demo session does not authorize API access.
(() => {
const demoUser = window.VacateDemo.currentUser();
if(!demoUser)return;
const fixtures=window.VacateFixtures;
const viewerId=demoUser.id;
function ensureSession(){if(window.VacateDemo.currentUser()?.id===viewerId)return true;location.replace(new URL('login.html',location.href).href);return false;}
const defaultScope=demoUser.capability==='admin'?'org':demoUser.capability==='lead'?'department':'self';
const scopes=fixtures.allowedScopes(demoUser);
document.querySelector('[data-action=account]').textContent=demoUser.initials;
document.querySelector('[data-action=account]').setAttribute('aria-label',`${demoUser.name}, demo account`);
document.querySelector('#demo-person').textContent=demoUser.name;
for(const button of document.querySelectorAll('[data-scope]'))button.hidden=!scopes.includes(button.dataset.scope);
for(const button of document.querySelectorAll('[data-nav=approvals],[data-nav=settings]'))button.hidden=demoUser.capability!=='admin';
document.querySelector('#demo-role').textContent = demoUser ? `${demoUser.role} preview` : '';
const DEMO_TODAY = new Date(2026, 9, 22);
const {types:leaveTypes,shortlistIds,typeLabel,typeGroups,getType,balanceOf} = window.VacateLeave;
const shortlist=shortlistIds.map(getType);
const escapeHtml = value => String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const typeName = id => getType(id)?typeLabel(getType(id)):'Leave';
// Consume the account-scoped response facade; policy facts never live in this view.
const eligibilityFor = id => window.VacateEligibility?.decisionFor(id) || {status:'to-confirm',reasonCode:'response-unavailable',reason:'Eligibility has not been confirmed.',policyVersion:'unavailable'};
const eligibilityLabel = decision => decision.status==='eligible'?'Eligible':decision.status==='not-eligible'?'Not eligible':'Eligibility to confirm';
const visibleShortlist = () => shortlist.filter(type=>eligibilityFor(type.id).status!=='not-eligible');
const formatAmount = (amount,unit) => `${amount} ${amount===1?({'working days':'working day',days:'day',months:'month',weeks:'week',hours:'hour','hours per day':'hour per day'}[unit] || unit):unit}`;
let showAllBalances = false;
const expandedBalances = new Set();
const people=fixtures.people;
const entries=fixtures.ownEntries(demoUser);
const params = new URLSearchParams(location.search);
const state = { page: params.get('page')==='balances'?'balances':'calendar', direction: 'a', scope: defaultScope, groupId: null, denied: false, view: 'month', date: new Date(DEMO_TODAY) };
if (['a','b','c'].includes(params.get('direction'))) state.direction = params.get('direction');
if (state.direction === 'b') state.view = 'week';
if (state.direction === 'c') state.view = 'year';
if(params.has('scope'))state.scope=params.get('scope');
state.groupId=params.get('group')||params.get(state.scope==='team'?'team':state.scope==='department'?'department':'company');
if(params.has('company')&&params.get('company')!==demoUser.companyId)state.denied=true;
if(!scopes.includes(state.scope))state.denied=true;
if (['year','month','week','day'].includes(params.get('view'))) state.view = params.get('view');
if(/^\d{4}-\d{2}-\d{2}$/.test(params.get('date')||'')){const [year,month,day]=params.get('date').split('-').map(Number);const date=new Date(year,month-1,day);if(date.getFullYear()===year&&date.getMonth()===month-1&&date.getDate()===day)state.date=date;}
const $ = selector => document.querySelector(selector);
const dateKey = date => `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
const dateFromKey = key => { const [y,m,d] = key.split('-').map(Number); return new Date(y,m-1,d); };
const addDays = (date, days) => new Date(date.getFullYear(),date.getMonth(),date.getDate()+days);
const monthName = (date, style = 'long') => date.toLocaleDateString('en-GB',{month:style});
const fullDate = date => date.toLocaleDateString('en-GB',{weekday:'long',day:'numeric',month:'long',year:'numeric'});
const shortDate = key => dateFromKey(key).toLocaleDateString('en-GB',{day:'numeric',month:'short'});
const weekStart = date => addDays(date,-((date.getDay()+6)%7));
const scopeName = () => state.denied?'Unavailable scope':state.scope==='self'?'My calendar':state.scope==='team'?`${fixtures.teams.find(team=>team.id===(state.groupId||demoUser.teamId))?.name || 'Unavailable'} team`:state.scope==='department'?`${fixtures.departments.find(department=>department.id===(state.groupId||demoUser.departmentId))?.name || 'Unavailable'} department`:fixtures.company.name;
const visiblePeople = () => state.denied?[]:fixtures.peopleFor(demoUser,state.scope,state.groupId);
const visibleEntries = () => state.denied?[]:state.scope==='self'?(visiblePeople().length?entries:[]):fixtures.availabilityFor(demoUser,state.scope,state.groupId);
const entriesOn = date => visibleEntries().filter(entry=>dateKey(date)>=entry.start && dateKey(date)<=entry.end);
const personFor = entry => people.find(person=>person.id===entry.person);
const labelFor = entry => state.scope === 'self' ? `${typeName(entry.type)} · ${entry.status}` : `${personFor(entry).name} · Away`;
const classFor = entry => state.scope === 'self' ? entry.status.toLowerCase() : 'away';
const eventButton = entry => `<button class="event ${classFor(entry)}" data-event="${entry.id}" title="${labelFor(entry)}">${state.scope==='self'?(entry.status==='Approved'?'✓ ':'◷ '):''}${labelFor(entry)}</button>`;
function renderGroupFilter() {
  const groups=state.scope==='team'?fixtures.allowedTeams(demoUser):state.scope==='department'?fixtures.allowedDepartments(demoUser):[];
  $('#scope-group-label').hidden=!groups.length;
  $('#scope-group').innerHTML=groups.map(group=>`<option value="${group.id}">${group.name}</option>`).join('');
  if(groups.length)$('#scope-group').value=state.groupId||(state.scope==='team'?demoUser.teamId:demoUser.departmentId);
  $('#scope-count').textContent=`${visiblePeople().length} ${visiblePeople().length===1?'person':'people'}`;
}
function allowanceMarkup(type) {
  const milestones = type.id==='annual'?`<table class="service-tiers"><caption>Annual service milestones · reference, not an automatic calculation</caption><thead><tr><th>Basis</th><th>5-day week</th></tr></thead><tbody><tr><th>First calendar year</th><td>20 prorated</td></tr><tr><th>Second year / at 12 months</th><td>21 basis</td></tr><tr><th>Third year / at 24 months</th><td>22</td></tr><tr><th>10 years here OR 12 total</th><td>25</td></tr><tr><th>25 total years</th><td>26</td></tr></tbody></table>`:'';
  return `<p class="allowance-limit">${escapeHtml(type.allowance)}</p><p>${escapeHtml(type.rules)}</p>${type.requestScope?`<p class="request-scope">${escapeHtml(type.requestScope)}</p>`:''}${milestones}<p class="allowance-source">${type.sourceUrl?`<a href="${escapeHtml(type.sourceUrl)}" target="_blank" rel="noopener noreferrer">${escapeHtml(type.source)} (opens a new tab)</a>`:escapeHtml(type.source)}</p>`;
}
function renderAnnualOverview() {
  const balance=eligibilityFor('annual').status==='eligible'?balanceOf('annual'):null;
  const balanceUrl=new URL(location.href);for(const [key,value] of Object.entries({page:'balances',direction:state.direction,scope:state.scope,view:state.view,date:dateKey(state.date)}))balanceUrl.searchParams.set(key,value);if(state.groupId)balanceUrl.searchParams.set('group',state.groupId);else balanceUrl.searchParams.delete('group');
  $('#annual-overview').innerHTML=`<div class="annual-heading"><h2>Annual leave</h2><span>Your balance</span></div>${balance?`<p class="annual-available"><strong>${balance.available}</strong> <span>/ ${balance.allocation} working days available</span></p>${balance.percentage!==null?`<p class="annual-percentage">${balance.percentage}% available</p>`:''}${balance.allocation>0?`<div class="type-bar" role="group" aria-label="Annual leave: allocation ${balance.allocation}, used ${balance.used}, pending ${balance.pending}, available ${balance.available} working days"><span class="bar-used" style="width:${balance.used/balance.allocation*100}%" aria-hidden="true"></span><span class="bar-pending" style="width:${balance.pending/balance.allocation*100}%" aria-hidden="true"></span><span class="bar-available" style="width:${balance.available/balance.allocation*100}%" aria-hidden="true"></span></div>`:''}<div class="bar-legend"><span>Used <b>${balance.used}</b></span><span>Pending <b>${balance.pending}</b></span><span>Available <b>${balance.available}</b></span></div><p class="annual-period">${escapeHtml(balance.period)} · Five-day workweek</p>`:'<p class="empty">Your annual balance is to confirm.</p>'}<a class="inline-link" href="${escapeHtml(balanceUrl.href)}" data-page-link="balances">View all balances <span aria-hidden="true">→</span></a>`;
}
function renderBalances() {
  const pinned=leaveTypes.filter(type=>!shortlistIds.includes(type.id)&&expandedBalances.has(type.id)&&eligibilityFor(type.id).status!=='not-eligible');
  const shown = showAllBalances?leaveTypes:visibleShortlist();
  const groups=typeGroups(shown);
  if(!showAllBalances&&pinned.length)groups.push({name:'Expanded types',types:pinned});
  $('#balance-types').innerHTML=groups.map(group=>`<section class="balance-group" aria-label="${escapeHtml(group.name)}"><h3>${escapeHtml(group.name)}</h3><div class="balance-types">${group.types.map(type=>{
    const decision=eligibilityFor(type.id);
    const balance=decision.status==='eligible'?balanceOf(type.id):null;
    const label=typeLabel(type);
    const stateLabel=decision.status==='not-eligible'?'Not eligible':balance?`${balance.available} / ${balance.allocation} ${type.unit} available`:type.id==='sick'?'Allowance and eligibility to confirm':decision.status==='to-confirm'?'Eligibility to confirm':({event:'Per qualifying event',schedule:'Schedule arrangement',variable:'No fixed allowance',supplement:'Annual allocation supplement'})[type.shape] || 'Eligibility to confirm';
    const bar=balance&&balance.allocation>0?`<div class="type-bar" role="group" aria-label="${escapeHtml(`${label}: allocation ${balance.allocation}, used ${balance.used}, pending ${balance.pending}, available ${balance.available} ${type.unit}`)}"><span class="bar-used" style="width:${balance.used/balance.allocation*100}%" aria-hidden="true"></span><span class="bar-pending" style="width:${balance.pending/balance.allocation*100}%" aria-hidden="true"></span><span class="bar-available" style="width:${balance.available/balance.allocation*100}%" aria-hidden="true"></span></div>`:'';
    return `<details class="type-balance" data-balance="${type.id}" data-eligibility="${decision.status}" ${expandedBalances.has(type.id)?'open':''}><summary aria-expanded="${expandedBalances.has(type.id)}"><span class="type-title">${escapeHtml(label)}</span><span class="type-quantity">${stateLabel}</span>${balance?.percentage!==null&&balance?`<span class="type-percentage">${balance.percentage}% available</span>`:''}<span class="type-period">${escapeHtml(balance?.period || type.basis)}</span>${bar}</summary><div class="type-balance-body"><p class="eligibility-message">${escapeHtml(eligibilityLabel(decision))}: ${escapeHtml(decision.reason)}</p>${balance?`<div class="bar-legend"><span>Used <b>${balance.used}</b></span><span>Pending <b>${balance.pending}</b></span><span>Available <b>${balance.available}</b></span></div><p>Allocation: <b>${balance.allocation} ${type.unit}</b>. ${escapeHtml(balance.note)}</p><p>Used includes approved deductions, including upcoming leave. Pending reservations are counted separately.</p>`:'<p>No available balance is assumed until the applicable event, schedule or eligibility is confirmed.</p>'}<span class="pay-label">${type.pay}</span><h4>Allowance and rules</h4>${allowanceMarkup(type)}${type.shape==='supplement'?'<p>Handled in the annual allocation; not requested as extra leave.</p>':`<button class="inline-link" data-example-type="${type.id}" ${decision.status==='not-eligible'?'disabled':''} aria-describedby="eligibility-${type.id}">Preview ${escapeHtml(label.toLowerCase())} example →</button><p id="eligibility-${type.id}" class="example-eligibility">${escapeHtml(decision.reason)}</p>`}</div></details>`;
  }).join('')}</div></section>`).join('');
  document.querySelectorAll('[data-balance]').forEach(details=>details.addEventListener('toggle',()=>{details.querySelector('summary').setAttribute('aria-expanded',String(details.open));details.open?expandedBalances.add(details.dataset.balance):expandedBalances.delete(details.dataset.balance);}));
  $('#balance-toggle').textContent=showAllBalances?'Show shortlisted types':`Show all ${leaveTypes.length} types`;
  $('#balance-toggle').setAttribute('aria-expanded',String(showAllBalances));
  $('#balance-list-status').textContent=showAllBalances?`All ${leaveTypes.length} reference types shown; unavailable request actions are disabled.`:`${shown.length} shortlisted types shown for your profile.${pinned.length?` ${pinned.length} expanded types kept visible.`:''} Known-unavailable types remain in Show all.`;
}
function renderUpcoming() {
  const upcoming=entries.filter(entry=>entry.person===viewerId&&entry.end>=dateKey(DEMO_TODAY)).sort((a,b)=>a.start.localeCompare(b.start)).slice(0,3);
  $('.upcoming-card').innerHTML=`<div class="panel-title"><h2>Coming up for you</h2><span>↗</span></div>${upcoming.length?upcoming.map(entry=>`<button class="upcoming-event" data-event="${entry.id}"><span class="date-tile"><small>${monthName(dateFromKey(entry.start),'short').toUpperCase()}</small>${dateFromKey(entry.start).getDate()}</span><span><strong>${entry.title}</strong><span>${shortDate(entry.start)}–${shortDate(entry.end)} · ${typeName(entry.type)}</span><span class="status ${entry.status.toLowerCase()}">${entry.status==='Approved'?'✓':'◷'} ${entry.status}</span></span></button>`).join(''):'<p class="empty" id="upcoming-empty">No upcoming leave for you.</p>'}<button class="inline-link" data-nav="leave">View my leave <span>→</span></button>`;
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
  return `<p class="planner-description">${state.scope==='self'?'Your all-day leave':'People in '+scopeName()+' · availability only'} · ${state.view==='month'?'Scroll to explore the month':'All-day absences'}</p><div class="planner-scroll"><table class="planner-table" style="min-width:${Math.max(700,165+dates.length*64)}px"><caption class="sr-only">${scopeName()} · ${periodLabel()}</caption><thead><tr><th class="person-cell" scope="col">${visiblePeople().length} ${state.scope==='self'?'person':'people'}</th>${dates.map(date=>`<th scope="col" class="${dateKey(date)===dateKey(DEMO_TODAY)?'today-col':''}"><small>${date.toLocaleDateString('en-GB',{weekday:'short'})}</small>${date.getDate()}</th>`).join('')}</tr></thead><tbody>${visiblePeople().map(person=>`<tr data-person="${person.id}"><th scope="row" class="person-cell"><span class="person-name"><span class="person-avatar">${person.initials}</span><span>${person.name}${person.id===viewerId?' (you)':''}<small>${person.team}</small></span></span></th>${dates.map(date=>{const entry=entriesOn(date).find(entry=>entry.person===person.id);return `<td class="${date.getDay()===0||date.getDay()===6?'weekend':''} ${dateKey(date)===dateKey(DEMO_TODAY)?'today-col':''}">${entry?`<button class="planner-away" data-event="${entry.id}" aria-label="${person.name}, ${fullDate(date)}, ${state.scope==='self'?entry.status:'Away'}">${state.scope==='self'?entry.status:'Away'}</button>`:''}</td>`;}).join('')}</tr>`).join('')}</tbody></table></div>${agenda(dates,true)}`;
}
function render() {
  if(!ensureSession())return;
  renderGroupFilter();
  $('.app').dataset.direction=state.direction;
  $('.app').dataset.page=state.page;
  $('#calendar-page').hidden=state.page!=='calendar';
  $('#balances-page').hidden=state.page!=='balances';
  $('.breadcrumb').innerHTML=`Workspace <span>/</span> ${state.page==='balances'?'My balances':'Calendar'}`;
  $('h1').innerHTML=state.page==='balances'?'Your leave, in balance<span>.</span>':'Your time, in view<span>.</span>';
  document.title=`Vacate · ${state.page==='balances'?'My balances':'Calendar design studio'}`;
  $('.skip').textContent=state.page==='balances'?'Skip to balances':'Skip to calendar';
  for(const button of document.querySelectorAll('.nav-item')){const active=button.dataset.nav===state.page;button.classList.toggle('selected',active);if(active)button.setAttribute('aria-current','page');else button.removeAttribute('aria-current');}
  if(state.page==='balances')renderBalances();else $('#balance-types').innerHTML='';
  renderAnnualOverview();
  document.querySelectorAll('[data-direction]').forEach(button=>{if(button.tagName==='BUTTON') button.setAttribute('aria-pressed',String(button.dataset.direction===state.direction));});
  document.querySelectorAll('[data-scope]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.scope===state.scope)));
  document.querySelectorAll('[data-view]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.view===state.view)));
  $('#period').textContent=periodLabel();
  $('#calendar-caption').textContent=scopeName()+(state.scope==='self'?' · Your leave requests':' · Permitted availability');
  $('#scope-note').textContent=state.scope==='self'?'Only your requests and balances':'Availability only · same demo company';
  $('#subtitle').textContent=state.page==='balances'?'Your own allowances, eligibility and rules. Each leave type keeps its own unit and period.':state.direction==='b'?'A shared view of time away. A little easier to plan together.':state.direction==='c'?'See the year ahead. Make space for your next break.':'Plan your next break. Keep your team in the picture.';
  $('.calendar-meta>span:last-child').innerHTML=state.scope==='self'?'<span class="tiny-square approved"></span> Approved <span class="tiny-square pending"></span> Pending':'<span class="tiny-square" style="background:#6e8ac4"></span> Away · availability only';
  $('#calendar-footnote').textContent=state.view==='year'?'Select a month to explore dates':state.direction==='b'?'Select an absence to see availability':'Select a date to see details';
  $('#calendar-content').innerHTML=state.denied||!visiblePeople().length?'<p class="empty scope-denied" role="status">This scope or group is unavailable to this demo account. Choose an allowed scope.</p>':state.view==='year'?yearCalendar():state.view==='day'?agenda([state.date]):state.direction==='b'?planner():state.view==='week'?weekCalendar():monthCalendar();
  $('#date-details').innerHTML='<span class="eyebrow">A LITTLE CONTEXT</span><h2>Pick a day</h2><p>Select a date or an absence to see what’s planned.</p>';
  $('#announcement').textContent=state.page==='balances'?'Your own leave balances':`${scopeName()}, ${state.view} view, ${periodLabel()}`;
}
function navigatePage(page) {
  if(!ensureSession())return;
  const url=new URL(location.href);
  url.searchParams.set('page',state.page);url.searchParams.set('direction',state.direction);url.searchParams.set('scope',state.scope);url.searchParams.set('view',state.view);url.searchParams.set('date',dateKey(state.date));
  if(state.groupId)url.searchParams.set('group',state.groupId);else url.searchParams.delete('group');
  history.replaceState({vacatePage:state.page,date:dateKey(state.date)},'',url);
  state.page=page==='balances'?'balances':'calendar';url.searchParams.set('page',state.page);
  history.pushState({vacatePage:state.page,date:dateKey(state.date)},'',url);
  render();$('.mobile-menu').setAttribute('aria-expanded','false');$('#navigation').classList.remove('open');$('#main').focus();
}
window.addEventListener('popstate',event=>{if(!ensureSession())return;const query=new URLSearchParams(location.search);state.page=query.get('page')==='balances'?'balances':'calendar';if(['a','b','c'].includes(query.get('direction')))state.direction=query.get('direction');if(['self','team','department','org'].includes(query.get('scope')))state.scope=query.get('scope');state.groupId=query.get('group');state.denied=!scopes.includes(state.scope)||query.has('company')&&query.get('company')!==demoUser.companyId;if(['year','month','week','day'].includes(query.get('view')))state.view=query.get('view');if(event.state?.date)state.date=dateFromKey(event.state.date);render();$('#main').focus();});
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
  if(!ensureSession())return;
  // Personal cards are deliberately independent of shared calendar scope.
  const personal=entries.find(entry=>entry.id===id);
  const personalCard=!!trigger?.closest('.insights');
  const own=!!personal&&(state.scope==='self'||personalCard);
  const entry=own?personal:visibleEntries().find(item=>item.id===id);
  if(!entry){showDialog('<h2>Unavailable request</h2><p>This entry is outside the current demo scope. Private request details are not shared.</p>',trigger);return;}
  showDialog(`<span class="eyebrow">${own?'YOUR REQUEST':'AVAILABILITY'}</span><h2>${own?entry.title:personFor(entry).name+' · Away'}</h2><p>${shortDate(entry.start)} – ${shortDate(entry.end)} ${dateFromKey(entry.end).getFullYear()} · All day</p><p>${own?typeName(entry.type)+' · '+entry.status:'Availability in your demo company. Private request details are not shared.'}</p><p>Fictional sample · no changes can be made here.</p>`,trigger);
}
function requestForm(trigger, initialType='annual', example=false) {
  if(!ensureSession())return;
  if(!getType(initialType)||getType(initialType).shape==='supplement'){showDialog('<h2>Leave type unavailable</h2><p>This type cannot be requested. Annual allocation supplements are handled within the annual allocation.</p>',trigger);return;}
  if(eligibilityFor(initialType).status==='not-eligible'){showDialog(`<h2>Leave type unavailable</h2><p>${escapeHtml(eligibilityFor(initialType).reason)}</p>`,trigger);return;}
  let showAllRequestTypes=false;
  showDialog(`<span class="eyebrow">${example?'ILLUSTRATIVE TYPE EXAMPLE':'DEMO INTERACTION'}</span><h2>Plan your time away.</h2><p>Preview a request for ${demoUser.name} using fictional data. Nothing is submitted or saved.</p><form id="request-form"><label for="leave-type">Leave type</label><select id="leave-type" aria-describedby="request-type-status request-eligibility"></select><button class="inline-link type-toggle" id="request-type-toggle" type="button" aria-expanded="false" aria-controls="leave-type">Show all leave types</button><p id="request-type-status" class="form-hint" role="status"></p><p id="request-eligibility" class="eligibility-message" role="status"></p><p id="request-allowance" class="request-allowance"></p><details id="request-rules" class="request-rules"><summary>Allowance and rules</summary><div id="request-rule-content"></div></details><div class="form-row"><div><label for="start-date">From</label><input id="start-date" type="date" value="2026-10-26" required></div><div><label for="end-date">To</label><input id="end-date" type="date" value="2026-10-28" required></div></div><div class="form-row"><div><label for="request-amount">Preview amount</label><input id="request-amount" type="number" min="1" step="1" value="3" required></div><div><label for="request-unit">Unit</label><select id="request-unit"></select></div></div><p class="form-hint">Enter an illustrative amount. Working days and other units are not calculated from these dates.</p><p id="request-balance" class="request-balance" aria-live="polite"></p><button class="primary" type="submit">Preview demo request →</button></form>`,trigger);
  function renderTypeOptions(selectedId) {
    const shown=showAllRequestTypes?leaveTypes:visibleShortlist();
    const groups=typeGroups(shown);
    const pinned=!showAllRequestTypes&&!shortlistIds.includes(selectedId)&&eligibilityFor(selectedId).status!=='not-eligible'?getType(selectedId):null;
    if(pinned)groups.push({name:'Your selected type',types:[pinned]});
    $('#leave-type').innerHTML=groups.map(group=>`<optgroup label="${escapeHtml(group.name)}">${group.types.map(type=>`<option value="${type.id}" ${type.id===selectedId?'selected':''} ${type.shape==='supplement'||eligibilityFor(type.id).status==='not-eligible'?'disabled':''}>${escapeHtml(typeLabel(type))}${type.shape==='supplement'?' — annual allocation adjustment':eligibilityFor(type.id).status==='not-eligible'?` — Not eligible: ${escapeHtml(eligibilityFor(type.id).reason)}`:eligibilityFor(type.id).status==='to-confirm'?' — To confirm':''}</option>`).join('')}</optgroup>`).join('');
    $('#request-type-toggle').textContent=showAllRequestTypes?'Show shortlisted types':'Show all leave types';
    $('#request-type-toggle').setAttribute('aria-expanded',String(showAllRequestTypes));
    $('#request-type-status').textContent=showAllRequestTypes?`All ${leaveTypes.length} reference types shown; unavailable types and the annual allocation supplement cannot be requested.`:`${shown.length} shortlisted types shown for your profile.${pinned?` Your selected type, ${typeLabel(pinned)}, is also kept visible.`:''} Known-unavailable types remain in Show all.`;
    document.querySelector('.eligibility-unavailable')?.remove();
    const unavailable=showAllRequestTypes?leaveTypes.filter(type=>type.shape!=='supplement'&&eligibilityFor(type.id).status==='not-eligible'):[];
    if(unavailable.length)$('#request-type-status').insertAdjacentHTML('afterend',`<details class="request-rules eligibility-unavailable"><summary>Unavailable types for this account (${unavailable.length})</summary><ul class="dialog-list">${unavailable.map(type=>`<li>${escapeHtml(typeLabel(type))}<small>${escapeHtml(eligibilityFor(type.id).reason)}</small></li>`).join('')}</ul></details>`);
  }
  renderTypeOptions(initialType);
  $('#request-type-toggle').addEventListener('click',()=>{const selectedId=$('#leave-type').value;showAllRequestTypes=!showAllRequestTypes;renderTypeOptions(selectedId);if($('#leave-type').value!==selectedId)updateType();});
  function projection(type) {
    const decision=eligibilityFor(type?.id);
    if(decision.status==='not-eligible')return {text:`Not eligible: ${decision.reason}`,excess:false};
    if(decision.status!=='eligible')return {text:'Eligibility to confirm. Balance cannot be calculated in this demo for this amount, period or unit.',excess:false};
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
    if(!type){$('#request-eligibility').textContent='Choose an available leave type.';$('#request-form button[type=submit]').disabled=true;return;}
    const decision=eligibilityFor(type.id);
    $('#request-eligibility').textContent=`${eligibilityLabel(decision)}: ${decision.reason}`;
    $('#request-form button[type=submit]').disabled=decision.status==='not-eligible'||type.shape==='supplement';
    $('#request-allowance').textContent=`${type.allowance} · ${type.pay}`;
    $('#request-rule-content').innerHTML=allowanceMarkup(type);
    const units=type.id==='school'?['working days','hours']:[type.unit];
    $('#request-unit').innerHTML=units.map(unit=>`<option>${unit}</option>`).join('');
    $('#request-amount').value=type.id==='annual'?'3':'1';
    updateProjection();
  }
  $('#leave-type').addEventListener('change',()=>{const selectedId=$('#leave-type').value;if(!showAllRequestTypes)renderTypeOptions(selectedId);updateType();});
  for(const selector of ['#request-unit','#request-amount','#start-date','#end-date']) $(selector).addEventListener('input',updateProjection);
  for(const selector of ['#start-date','#end-date']) $(selector).addEventListener('input',()=>$('#end-date').setCustomValidity(''));
  updateType();
  if(example)$('#request-rules').open=true;
  $('#request-form').addEventListener('submit',event=>{
    event.preventDefault();if(!ensureSession())return;const selectedType=getType($('#leave-type').value);if(!selectedType||selectedType.shape==='supplement'){$('#request-eligibility').textContent='This type cannot be requested. Choose a requestable leave type.';return;}const decision=eligibilityFor(selectedType.id);if(decision.status==='not-eligible'){$('#request-eligibility').textContent=`Not eligible: ${decision.reason}`;return;}const start=$('#start-date'),end=$('#end-date');end.setCustomValidity('');
    if(end.value<start.value){end.setCustomValidity('Choose an end date on or after the start date.');end.reportValidity();return;}
    const type=getType($('#leave-type').value),amount=Number($('#request-amount').value),unit=$('#request-unit').value,result=projection(type);
    $('#dialog-content').innerHTML=`<span class="eyebrow">DEMO ONLY</span><h2>Your preview is ready.</h2><p>${escapeHtml(typeLabel(type))} · ${escapeHtml(formatAmount(amount,unit))}</p><p>${shortDate(start.value)} – ${shortDate(end.value)} ${dateFromKey(end.value).getFullYear()}</p><p class="eligibility-message">${escapeHtml(eligibilityLabel(decision))}: ${escapeHtml(decision.reason)}</p><p class="request-balance ${result.excess?'over-allowance':''}">${escapeHtml(result.text)}</p><p>No request was sent or saved. Eligibility is an illustrative account-scoped mock decision, not an entitlement determination. Working-day calculations and approval routing are not validated by this preview.</p><button class="primary" id="finish-demo">Back to ${state.page==='balances'?'balances':'calendar'}</button>`;
    $('#finish-demo').addEventListener('click',()=>dialog.close());$('#finish-demo').focus();
  });
}
document.addEventListener('click',event=>{
  if(!ensureSession())return;
  const pageLink=event.target.closest('[data-page-link]');if(pageLink){event.preventDefault();navigatePage(pageLink.dataset.pageLink);return;}
  const button=event.target.closest('button');if(!button||button.disabled)return;
  if(button.id==='balance-toggle'){showAllBalances=!showAllBalances;renderBalances();return;}
  if(button.dataset.exampleType){requestForm(button,button.dataset.exampleType,true);return;}
  if(button.dataset.direction){state.direction=button.dataset.direction;state.scope=defaultScope;state.groupId=null;state.denied=false;state.view=state.direction==='b'?'week':state.direction==='c'?'year':'month';render();return;}
  if(button.dataset.scope){state.scope=button.dataset.scope;state.groupId=null;state.denied=!scopes.includes(state.scope);render();return;}
  if(button.dataset.view){state.view=button.dataset.view;render();return;}
  if(button.dataset.month!==undefined){state.date=new Date(state.date.getFullYear(),Number(button.dataset.month),1);state.view='month';render();$('.views [data-view=month]').focus();return;}
  if(button.dataset.date){showDate(dateFromKey(button.dataset.date),button);return;}
  if(button.dataset.event){showEvent(button.dataset.event,button);return;}
  if(button.classList.contains('mobile-menu')){const open=button.getAttribute('aria-expanded')!=='true';button.setAttribute('aria-expanded',String(open));$('#navigation').classList.toggle('open',open);return;}
  if(button.dataset.nav){const nav=button.dataset.nav;
    if(nav==='calendar'||nav==='balances'){navigatePage(nav);return;}
    if(nav==='leave'){showDialog(`<h2>Your leave</h2><p>Fictional requests for ${demoUser.name}. Balance figures are illustrative.</p><ul class="dialog-list">`+entries.filter(e=>e.person===viewerId).map(e=>`<li>${e.title}<small>${shortDate(e.start)} – ${shortDate(e.end)} · ${typeName(e.type)} · ${e.status}</small></li>`).join('')+'</ul>',button);return;}
    if(nav==='people'){showDialog('<h2>People in this scope</h2><p>Fictional colleagues permitted by the current calendar filter. Availability only; no private requests or balances.</p><ul class="dialog-list">'+visiblePeople().map(p=>`<li data-person="${p.id}">${p.name}<small>${p.title} · ${p.team}</small></li>`).join('')+'</ul>'+(!visiblePeople().length?'<p class="empty">No people in this scope.</p>':''),button);return;}
    if(nav==='approvals'||nav==='settings'){showAdminDestination(nav,button);return;}
  }
  const action=button.dataset.action;
  if(action==='today'){state.date=new Date(DEMO_TODAY);render();}
  if(action==='previous'||action==='next'){const delta=action==='previous'?-1:1,date=state.date;
    state.date=state.view==='year'?new Date(date.getFullYear()+delta,date.getMonth(),1):state.view==='month'?new Date(date.getFullYear(),date.getMonth()+delta,1):addDays(date,delta*(state.view==='week'?7:1));render();}
  if(action==='request')requestForm(button);
  if(action==='help')showDialog('<h2>A little guide</h2><p>Compare A, B and C above, then try the scope and period controls. Select dates or leave entries for details. Today returns to the fixed demo date, 22 October 2026.</p><p>Week and day views show all-day absences. On a small screen, detailed calendars become readable agendas. All interactions use local fictional data.</p>',button);
  if(action==='account')showDialog(`<h2>${demoUser.name}</h2><p>${demoUser.title} · ${demoUser.role} preview</p><p>${fixtures.company.name} · ${demoUser.team}</p><p>Signed in as ${demoUser.username}. Public fictional browser simulation. All fixture assets are downloadable; these presentation checks do not provide secure authentication or authorization.</p><button class="primary" data-action="logout">Sign out</button>`,button);
  if(action==='logout')window.VacateDemo.logout();
});
function showAdminDestination(nav,trigger){
  if(!ensureSession())return;
  const label=nav==='approvals'?'Approvals':'Organization settings';
  if(demoUser.capability!=='admin'){showDialog(`<h2>Admin access only</h2><p>${label} is unavailable to this demo persona. Team-lead titles do not grant admin capability.</p>`,trigger);return;}
  showDialog(`<span class="eyebrow">PLANNED · ${nav==='approvals'?'VAC-4':'VAC-2'}</span><h2>${label}</h2><p>This entry is reserved for admin personas. ${nav==='approvals'?'The approval inbox is planned; there are no approval or self-approval actions yet.':'The settings preview is planned; no company configuration can be changed yet.'}</p><p>Shared calendars continue to show availability only.</p>`,trigger);
}
$('#scope-group').addEventListener('change',event=>{if(!ensureSession())return;state.groupId=event.target.value;state.denied=!fixtures.peopleFor(demoUser,state.scope,state.groupId).length;render();});
window.VacateMock=Object.freeze({showEvent,showAdminDestination,state,visiblePeople,visibleEntries});
renderUpcoming();
render();
})();
