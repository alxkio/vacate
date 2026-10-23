// Browser acceptance checks and reproducible screenshots. Node.js 22+, local Chrome.
import { spawn } from 'node:child_process';
import { mkdtemp, mkdir, writeFile, readFile, rm } from 'node:fs/promises';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
const root = dirname(fileURLToPath(import.meta.url));
const profile = await mkdtemp(join(tmpdir(), 'vacate-mock-qa-'));
const output = process.env.MOCK_SCREENSHOT_DIR || join(root, 'previews');
await mkdir(output, { recursive: true });
let server;
let baseUrl = process.env.MOCK_URL;
if (!baseUrl) {
  server = createServer(async (request, response) => {
    const name = new URL(request.url, 'http://localhost').pathname.slice(1) || 'index.html';
    if (!['index.html','login.html','mock.css','mock.js','demo-session.js','login.js','leave-types.js','demo-fixtures.js','favicon.svg'].includes(name)) { response.writeHead(404).end(); return; }
    try {
      const type = name.endsWith('.html') ? 'text/html' : name.endsWith('.css') ? 'text/css' : name.endsWith('.svg') ? 'image/svg+xml' : 'text/javascript';
      response.writeHead(200, {'Content-Type': type, 'Cache-Control': 'no-store'});
      response.end(await readFile(join(root,'dist',name)));
    } catch { response.writeHead(500).end(); }
  });
  await new Promise(resolve => server.listen(0,'127.0.0.1',resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}/index.html`;
}
const chrome = spawn(process.env.CHROME_BIN || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', [
  '--headless', '--disable-gpu', '--disable-background-networking', '--no-first-run',
  '--no-default-browser-check', '--disable-component-update', '--remote-debugging-port=0',
  `--user-data-dir=${profile}`, 'about:blank',
], { stdio: ['ignore', 'ignore', 'pipe'] });
let socket, nextId=0, frameSequence=0; const waiting=new Map(), errors=[];
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const deadline=setTimeout(()=>{for(const pending of waiting.values())pending.reject(Error('Browser suite exceeded five minutes'));waiting.clear();chrome.kill('SIGKILL');server?.close();process.exitCode=1;},300000);
try {
const endpoint = await new Promise((resolve,reject)=>{
  let log=''; chrome.stderr.on('data',data=>{log+=data;const match=log.match(/DevTools listening on (ws:\/\/[^\s]+)/);if(match)resolve(match[1]);});
  chrome.on('error',reject);chrome.on('exit',code=>reject(new Error(`Chrome exited: ${code}`)));
  setTimeout(()=>reject(new Error('Chrome debugging endpoint unavailable')),20000).unref();
});
  const port=new URL(endpoint).port;
  const targets=await (await fetch(`http://127.0.0.1:${port}/json`)).json();
  socket=new WebSocket(targets.find(target=>target.type==='page').webSocketDebuggerUrl);
  await new Promise((resolve,reject)=>{socket.onopen=resolve;socket.onerror=reject;});
  socket.onmessage=message=>{const data=JSON.parse(message.data);if(data.id){const pending=waiting.get(data.id);waiting.delete(data.id);data.error?pending.reject(data.error):pending.resolve(data.result);}if(data.method==='Page.navigatedWithinDocument'||(data.method==='Page.frameNavigated'&&!data.params.frame.parentId))frameSequence++;if(data.method==='Runtime.exceptionThrown')errors.push(data.params.exceptionDetails.text);};
  const call=(method,params={})=>new Promise((resolve,reject)=>{const id=++nextId;const timer=setTimeout(()=>{waiting.delete(id);reject(Error('Browser protocol timeout: '+method));},20000);waiting.set(id,{resolve:value=>{clearTimeout(timer);resolve(value);},reject:error=>{clearTimeout(timer);reject(error);}});socket.send(JSON.stringify({id,method,params}));});
  const evaluate=async expression=>{let result;try{result=await call('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});}catch(error){throw Error(error.message+'; expression: '+expression.slice(0,180));}if(result.exceptionDetails)throw Error(JSON.stringify(result.exceptionDetails));return result.result.value;};
  const click=selector=>evaluate(`document.querySelector(${JSON.stringify(selector)}).click()`);
  const pointerClick=async selector=>{
    await call('Page.bringToFront');
    await call('Emulation.setFocusEmulationEnabled',{enabled:true});
    await evaluate(`document.querySelector(${JSON.stringify(selector)}).scrollIntoView({behavior:'instant',block:'center',inline:'center'})`);
    await evaluate('new Promise(resolve=>{requestAnimationFrame(()=>requestAnimationFrame(resolve));setTimeout(resolve,150)})');
    const point=await evaluate(`(()=>{const target=document.querySelector(${JSON.stringify(selector)}),rect=target.getBoundingClientRect(),x=rect.x+rect.width/2,y=rect.y+rect.height/2,hit=document.elementFromPoint(x,y);return {x,y,hit:!!hit&&(hit===target||target.contains(hit)),target:target.outerHTML,over:hit?.outerHTML};})()`);
    assert.ok(point.x>=0&&point.y>=0&&point.hit,'Pointer target obscured: '+JSON.stringify(point));
    const position={x:point.x,y:point.y};
    await call('Input.dispatchMouseEvent',{type:'mouseMoved',...position});
    await call('Input.dispatchMouseEvent',{type:'mousePressed',button:'left',clickCount:1,...position});
    await call('Input.dispatchMouseEvent',{type:'mouseReleased',button:'left',clickCount:1,...position});
  };
  const waitFor=async expression=>{for(let attempt=0;attempt<300;attempt++){if(await evaluate(expression))return;await pause(100);}throw Error('Browser condition failed: '+expression);};
  const navigate=async url=>{
    await evaluate('window.__vacateNavigationMarker = true');
    const result=await call('Page.navigate',{url});
    if(result.errorText)throw Error(result.errorText);
    await waitFor('!window.__vacateNavigationMarker && document.readyState === "complete"');
  };
  const historyTo=async(target,label)=>{
    // Replacement redirects can change CDP entry IDs; resolve from fresh full-document history.
    const history=await call('Page.getNavigationHistory');
    const entry=target.name?history.entries.find(item=>new URL(item.url).searchParams.get('history')===target.name):history.entries[history.currentIndex+target.delta];
    assert.ok(entry,`${label}: missing target ${JSON.stringify(target)}; history=${JSON.stringify(history)}`);
    const previous=frameSequence;
    try {await call('Page.navigateToHistoryEntry',{entryId:entry.id});}
    catch(error){throw Error(`${label}: ${JSON.stringify(error)}; target=${JSON.stringify(entry)}; current history=${JSON.stringify(await call('Page.getNavigationHistory'))}`);}
    for(let attempt=0;attempt<300&&frameSequence===previous;attempt++)await pause(100);
    assert.ok(frameSequence>previous,`${label}: history navigation did not occur`);
  };
  const load=async query=>{await navigate(baseUrl+query);await waitFor('document.readyState === "complete" && !!document.querySelector("#period")?.textContent');};
  const viewport=(width,height)=>call('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false});
  const screenshot=async name=>{await pause(350);const result=await call('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});await writeFile(join(output,name),Buffer.from(result.data,'base64'));};
  await call('Runtime.enable');await call('Page.enable');
  await call('Emulation.setFocusEmulationEnabled',{enabled:true});
  await viewport(1600,1250);
  await navigate(baseUrl);
  await waitFor('document.readyState === "complete" && !!document.querySelector("#login-form")');
  await screenshot('login-desktop.png');await viewport(375,1100);await screenshot('login-mobile.png');
  assert.equal(await evaluate('document.documentElement.scrollWidth <= innerWidth'),true,'Login overflows on mobile');
  await viewport(1600,1250);
  const signIn=async (username,password)=>{await evaluate(`document.querySelector('#username').value=${JSON.stringify(username)};document.querySelector('#password').value=${JSON.stringify(password)};document.querySelector('#login-form').requestSubmit()`);};
  await signIn('user','admin');
  assert.equal(await evaluate('document.querySelector("#login-error").hidden'),false);
  assert.equal(await evaluate('window.VacateDemo.currentUser()'),null);
  const ready = () => waitFor('document.readyState === "complete" && !!document.querySelector("#period")?.textContent && !document.querySelector("#login-form")');
  const signOut = async()=>{await click('[data-action="logout"]');await waitFor('!!document.querySelector("#login-form")');};
  const closeDialog = async()=>{await evaluate('document.querySelector("#dialog").close()');await waitFor('!document.querySelector("#dialog").open');};
  await evaluate('document.querySelector("#demo-account").value="maya";document.querySelector("#demo-account").dispatchEvent(new Event("change"))');
  assert.equal(await evaluate('document.querySelector("#username").value'),'maya');
  assert.equal(await evaluate('document.querySelector("#password").value'),'maya');
  const expected = [
    ['leah','Platform','Technology','lead'], ['ravi','Platform','Technology','employee'], ['noah','Platform','Technology','employee'],
    ['maya','Applications','Technology','employee'], ['theo','Applications','Technology','employee'], ['iris','Applications','Technology','employee'],
    ['ella','Product','Business','lead'], ['owen','Product','Business','employee'], ['zoe','Product','Business','employee'],
    ['daria','Operations','Business','admin'], ['nora','Operations','Business','admin'], ['sam','Operations','Business','employee'],
  ];
  await signIn('user','user');await ready();
  assert.equal(await evaluate('window.VacateDemo.currentUser().id || window.VacateDemo.currentUser().personId'),'maya');
  assert.equal(await evaluate('sessionStorage.getItem("vacate.demo.account.v2")'),'maya');
  // Exercise native keyboard behavior on a fresh document, independently of history traversal.
  // Native keyboard behavior needs a foreground document and actual pointer activation,
  // rather than only synthetic DOM clicks from the data-oriented checks above.
  await pointerClick('[data-date="2026-10-01"]');
  await waitFor('document.querySelector("#dialog").open && document.querySelector("#dialog").contains(document.activeElement)');
  assert.match(await evaluate('document.querySelector("#dialog").textContent'),/No leave shown/);
  assert.equal(await evaluate('document.hasFocus()'),true,'Keyboard target document is not focused');
  await evaluate('new Promise(resolve=>{requestAnimationFrame(()=>requestAnimationFrame(resolve));setTimeout(resolve,150)})');
  await evaluate(`window.__escapeEvidence=[];document.addEventListener('keydown',event=>window.__escapeEvidence.push({event:'keydown',key:event.key,trusted:event.isTrusted,target:event.target.className}),{once:true,capture:true});document.querySelector('#dialog').addEventListener('cancel',event=>window.__escapeEvidence.push({event:'cancel',trusted:event.isTrusted,prevented:event.defaultPrevented}),{once:true});`);
  await call('Input.dispatchKeyEvent',{type:'keyDown',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});await call('Input.dispatchKeyEvent',{type:'keyUp',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});
  try {await waitFor('!document.querySelector("#dialog").open');}
  catch(error){throw Error(error.message+'; Escape diagnostic: '+JSON.stringify(await evaluate('({focused:document.hasFocus(),active:document.activeElement.outerHTML,modal:document.querySelector("#dialog").matches(":modal"),activation:{active:navigator.userActivation.isActive,ever:navigator.userActivation.hasBeenActive},events:window.__escapeEvidence})')));}
  assert.equal(await evaluate('window.__escapeEvidence.some(event=>event.event === "keydown" && event.key === "Escape" && event.trusted)'),true,'Escape key was not delivered as trusted browser input');
  assert.equal(await evaluate('document.querySelector("#dialog").open'),false);
  await waitFor('document.activeElement.dataset.date === "2026-10-01"');
  assert.equal(await evaluate('document.activeElement.dataset.date'),'2026-10-01');
  console.log('PASS: trusted keyboard Escape and focus return');
  await signOut();
  await navigate(baseUrl);await waitFor('!!document.querySelector("#login-form")');
  await signIn('admin','admin');await ready();
  assert.equal(await evaluate('window.VacateDemo.currentUser().id || window.VacateDemo.currentUser().personId'),'nora');
  await signOut();
  for(const [id,team,department,role] of expected) {
    await signIn(id,id);await ready();
    assert.equal(await evaluate('window.VacateDemo.currentUser().id || window.VacateDemo.currentUser().personId'),id);
    const landing=role==='admin'?'org':role==='lead'?'department':'self';
    assert.equal(await evaluate(`document.querySelector('[data-scope="${landing}"]').getAttribute('aria-pressed')`),'true',id+' default scope');
    const scopes=role==='admin'?['self','team','department','org']:role==='lead'?['self','team','department']:['self','team'];
    for(const scope of ['self','team','department','org'])assert.equal(await evaluate(`!!document.querySelector('[data-scope="${scope}"]') && !document.querySelector('[data-scope="${scope}"]').hidden && !document.querySelector('[data-scope="${scope}"]').disabled`),scopes.includes(scope),id+'/'+scope+' scope affordance');
    await click('[data-action="account"]');
    assert.match(await evaluate('document.querySelector("#dialog-content").textContent'),new RegExp('Signed in as '+id+'\\.'));
    await closeDialog();
    assert.equal(await evaluate('document.querySelector("#dialog").open'),false,id+' stale dialog');
    await click('[data-action="request"]');assert.equal(await evaluate('document.querySelector("#request-amount").value'),'3',id+' stale form amount');await closeDialog();
    const expectedUpcoming=await evaluate(`window.VacateFixtures.ownEntries(window.VacateFixtures.person(${JSON.stringify(id)})).filter(entry=>entry.end>='2026-10-22').sort((a,b)=>a.start.localeCompare(b.start)).slice(0,3).map(entry=>entry.id)`);
    assert.deepEqual(await evaluate('Array.from(document.querySelectorAll(".upcoming-card [data-event]")).map(button=>button.dataset.event)'),expectedUpcoming,id+' own upcoming entries');
    const expectedBalance=await evaluate(`window.VacateFixtures.balancesFor(window.VacateFixtures.person(${JSON.stringify(id)})).annual`);
    assert.match(await evaluate('document.querySelector("[data-balance=annual]").textContent'),new RegExp(`${expectedBalance.allocation-expectedBalance.used-expectedBalance.pending} / ${expectedBalance.allocation} working days available`),id+' own balance');
    await click('[data-nav="leave"]');
    const ownTitles=await evaluate(`window.VacateFixtures.ownEntries(window.VacateFixtures.person(${JSON.stringify(id)})).map(entry=>entry.title)`);
    const personalDialog=await evaluate('document.querySelector("#dialog-content").textContent');
    for(const title of ownTitles)assert.ok(personalDialog.includes(title),id+' own request missing');
    const foreignTitles=await evaluate(`window.VacateFixtures.entries.filter(entry=>entry.person!==${JSON.stringify(id)}).map(entry=>entry.title)`);
    for(const title of foreignTitles)if(!ownTitles.includes(title))assert.ok(!personalDialog.includes(title),id+' foreign private request shown');
    if(id==='sam')assert.match(await evaluate('document.querySelector(".upcoming-card").textContent'),/no .*request|no .*leave|nothing|empty/i,'Sam upcoming empty state');
    await closeDialog();
    for(const scope of scopes.filter(value=>value!=='self')) {
      await load('?direction=b&scope='+scope+'&view=week');
      const members=scope==='team'?expected.filter(row=>row[1]===team):scope==='department'?expected.filter(row=>row[2]===department):expected;
      assert.deepEqual(await evaluate('Array.from(document.querySelectorAll(".planner-table tbody tr[data-person]")).map(row=>row.dataset.person).sort()'),members.map(row=>row[0]).sort(),id+'/'+scope+' member roster');
      if(scope==='team'||scope==='department') {
        const expectedGroups=scope==='team'?(role==='admin'?['applications','operations','platform','product']:role==='lead'?(department==='Technology'?['applications','platform']:['operations','product']):[team.toLowerCase()]):(role==='admin'?['business','technology']:[department.toLowerCase()]);
        assert.deepEqual(await evaluate('Array.from(document.querySelector("#scope-group").options).map(option=>option.value).sort()'),expectedGroups.sort(),id+'/'+scope+' selectable groups');
        for(const group of expectedGroups) {
          await evaluate(`document.querySelector('#scope-group').value=${JSON.stringify(group)};document.querySelector('#scope-group').dispatchEvent(new Event('change'))`);
          const groupMembers=expected.filter(row=>row[scope==='team'?1:2].toLowerCase()===group).map(row=>row[0]).sort();
          assert.deepEqual(await evaluate('Array.from(document.querySelectorAll(".planner-table tbody tr[data-person]")).map(row=>row.dataset.person).sort()'),groupMembers,id+'/'+group+' selected roster');
        }
      }
      const shared=await evaluate('document.querySelector("#calendar-content").textContent');
      assert.doesNotMatch(shared,/Pending|Approved|balance|sick|illness/i,id+' shared calendar disclosed private state');
      assert.equal(await evaluate('window.VacateLeave.types.some(type=>document.querySelector("#calendar-content").textContent.includes(type.name))'),false,id+' shared type');
      if(await evaluate('!!document.querySelector("#calendar-content [data-event]")')) {
        await click('#calendar-content [data-event]');
        assert.doesNotMatch(await evaluate('document.querySelector("#dialog-content").textContent'),/Pending|Approved|allocation|working days available/i,id+' shared detail');
        assert.equal(await evaluate('window.VacateLeave.types.some(type=>document.querySelector("#dialog-content").textContent.includes(type.name))'),false,id+' shared detail type');
        await closeDialog();
      }
    }
    await load('?scope=org&group=foreign-company&person=nora&event=nora-annual');
    assert.match(await evaluate('document.querySelector("#scope-count").textContent'),/^0 people/,id+' invalid group leaked people');
    assert.equal(await evaluate('document.querySelectorAll("#calendar-content [data-event]").length'),0,id+' query leaked availability');
    const foreignEvent=await evaluate(`window.VacateFixtures.entries.find(entry=>entry.person!==${JSON.stringify(id)}).id`);
    await click('[data-scope="self"]');
    await evaluate(`{const forged=document.createElement('button');forged.id='forged-event';forged.dataset.event=${JSON.stringify(foreignEvent)};document.body.append(forged);forged.click();forged.remove();}`);
    assert.equal(await evaluate('window.VacateLeave.types.some(type=>document.querySelector("#dialog-content").textContent.includes(type.name))'),false,id+' guessed private event type');
    if(await evaluate('document.querySelector("#dialog").open'))await closeDialog();
    const directoryScope=scopes.at(-1);await load('?scope='+directoryScope);
    await click('[data-nav="people"]');
    const expectedDirectory=(role==='admin'?expected:role==='lead'?expected.filter(row=>row[2]===department):expected.filter(row=>row[1]===team)).map(row=>row[0]).sort();
    assert.deepEqual(await evaluate('Array.from(document.querySelectorAll("#dialog-content [data-person]")).map(item=>item.dataset.person).sort()'),expectedDirectory,id+' directory roster');
    const directory=await evaluate('document.querySelector("#dialog-content").textContent');
    assert.doesNotMatch(directory,/Pending|Approved|allocation|working days available/i,id+' directory private state');
    await closeDialog();
    for(const nav of ['approvals','settings']) {
      assert.equal(await evaluate(`!document.querySelector('[data-nav="${nav}"]').hidden`),role==='admin',id+'/'+nav+' affordance');
      await evaluate(`window.VacateMock.showAdminDestination(${JSON.stringify(nav)})`);
      assert.match(await evaluate('document.querySelector("#dialog-content").textContent'),role==='admin'?/planned|PLANNED/:/Admin access only/);
      assert.equal(await evaluate('document.querySelectorAll("#dialog-content [data-approve],#dialog-content form").length'),0,'Planned page exposes actions');
      await closeDialog();
    }
    await click('[data-action="request"]');
    await evaluate('document.querySelector("#request-amount").value="41"');
    await signOut();
    await navigate(baseUrl);await waitFor('!!document.querySelector("#login-form")');
    assert.equal(await evaluate('sessionStorage.getItem("vacate.demo.account.v2")'),null);
  }
  console.log('PASS: twelve firstname accounts, scopes, own/shared records and resets');
  // Reloading stale or fabricated identity cannot restore a signed-in calendar.
  await evaluate('sessionStorage.setItem("vacate.demo.account.v1","admin");sessionStorage.setItem("vacate.demo.account.v2","unknown")');
  await navigate(baseUrl);await waitFor('!!document.querySelector("#login-form")');
  assert.equal(await evaluate('window.VacateDemo.currentUser()'),null);
  await signIn('user','user');await ready();
  await navigate(baseUrl);await ready();
  // Real browser Back/Forward traversal, including BFCache where Chrome chooses it.
  // Separate document loads keep untouched private pages in history while logout replaces only its target.
  for(const name of ['maya-one','maya-two','logout-target']) {
    await load('?history='+name);await click('[data-scope="team"]');await click('[data-action="request"]');
    await evaluate('document.querySelector("#request-amount").value="41"');
  }
  await signOut();
  await historyTo({name:'maya-two'},'Back after logout');
  await waitFor('document.readyState === "complete" && !!document.querySelector("#login-form")');
  assert.equal(await evaluate('window.VacateDemo.currentUser()'),null,'Back after logout restored identity');
  assert.equal(await evaluate('!!document.querySelector("#request-form")'),false,'Back after logout restored private draft');
  await historyTo({delta:1},'Forward after logout');
  await waitFor('document.readyState === "complete" && !!document.querySelector("#login-form")');
  assert.equal(await evaluate('window.VacateDemo.currentUser()'),null,'Forward after logout restored identity');
  await signIn('nora','nora');await ready();
  await historyTo({name:'maya-one'},'Back after account switch');
  await waitFor('document.querySelector("#demo-person")?.textContent === "Nora"');await ready();
  assert.equal(await evaluate('window.VacateDemo.currentUser().id'),'nora','History restored prior account after switch');
  assert.equal(await evaluate('document.querySelector("#demo-person").textContent'),'Nora');
  assert.equal(await evaluate('document.querySelector("#dialog").open'),false,'History restored prior dialog after switch');
  assert.equal(await evaluate('document.querySelector("[data-scope=org]").getAttribute("aria-pressed")'),'true','History retained prior account scope');
  await click('[data-action="request"]');assert.equal(await evaluate('document.querySelector("#request-amount").value'),'3','History restored draft after switch');await closeDialog();
  console.log('PASS: logout and account-switch Back/Forward navigation');
  await signOut();await signIn('user','user');await ready();
  assert.equal(await evaluate('window.VacateLeave.types.length'),29);
  assert.equal(await evaluate('window.VacateLeave.workWeekDays'),5);
  assert.equal(await evaluate('new Set(window.VacateLeave.types.map(type=>type.id)).size'),29);
  assert.equal(await evaluate('document.querySelectorAll("[data-balance]").length'),3);
  assert.match(await evaluate('document.querySelector("[data-balance=annual]").textContent'),/14 \/ 25 working days available/);
  assert.match(await evaluate('document.querySelector("[data-balance=annual]").textContent'),/56% available/);
  await click('[data-balance=annual] summary');
  await waitFor('document.querySelector("[data-balance=annual] summary").getAttribute("aria-expanded") === "true"');
  assert.match(await evaluate('document.querySelector("[data-balance=annual]").textContent'),/10 years here OR 12 total/);
  await click('#balance-toggle');
  assert.equal(await evaluate('document.querySelectorAll("[data-balance]").length'),29);
  assert.equal(await evaluate('document.querySelector("[data-balance=maternity] .type-percentage")'),null);
  assert.match(await evaluate('document.querySelector("[data-balance=parental]").textContent'),/2 \/ 4 months available/);
  assert.match(await evaluate('document.querySelector("[data-balance=dependent-illness]").textContent'),/Eligibility to confirm/);
  assert.equal(await evaluate('document.querySelector("[data-balance=childcare] .type-bar")'),null);
  await click('[data-example-type=parental]');
  assert.equal(await evaluate('document.querySelector("#leave-type").value'),'parental');
  assert.equal(await evaluate('document.querySelector("#request-unit").value'),'months');
  assert.match(await evaluate('document.querySelector("#request-balance").textContent'),/2 months available → 1 month/);
  assert.equal(await evaluate('document.querySelector("#leave-type option[value=disability-supplement]").disabled'),true);
  for(const id of await evaluate('window.VacateLeave.types.filter(type=>type.shape!=="supplement").map(type=>type.id)')){
    await evaluate(`document.querySelector('#leave-type').value=${JSON.stringify(id)};document.querySelector('#leave-type').dispatchEvent(new Event('change'))`);
    assert.equal(await evaluate(`document.querySelector('#request-allowance').textContent.includes(window.VacateLeave.getType(${JSON.stringify(id)}).allowance)`),true,`${id} allowance panel is stale`);
  }
  await evaluate('document.querySelector("#leave-type").value="school";document.querySelector("#leave-type").dispatchEvent(new Event("change"));document.querySelector("#request-unit").value="hours";document.querySelector("#request-unit").dispatchEvent(new Event("input"))');
  assert.match(await evaluate('document.querySelector("#request-balance").textContent'),/cannot be calculated/);
  await evaluate('document.querySelector("#leave-type").value="annual";document.querySelector("#leave-type").dispatchEvent(new Event("change"));document.querySelector("#request-amount").value="100";document.querySelector("#request-amount").dispatchEvent(new Event("input"))');
  assert.match(await evaluate('document.querySelector("#request-balance").textContent'),/Exceeds.*86 working days/);
  assert.equal(await evaluate('window.VacateLeave.balanceOf("annual").available'),14);
  await evaluate('document.querySelector("#start-date").value="2026-10-29";document.querySelector("#start-date").dispatchEvent(new Event("input"));document.querySelector("#request-form").requestSubmit()');
  assert.equal(await evaluate('document.querySelector("#end-date").validity.customError'),true,'Reversed dates must be rejected');
  await evaluate('document.querySelector("#start-date").value="2026-10-26";document.querySelector("#start-date").dispatchEvent(new Event("input"))');
  assert.equal(await evaluate('document.querySelector("#request-form").checkValidity()'),true,'Correcting the start date must clear the stale end-date error');
  await evaluate('document.querySelector("#request-form").requestSubmit()');
  assert.match(await evaluate('document.querySelector("#dialog-content").textContent'),/Annual leave · 100 working days/);
  await click('#finish-demo');await click('#balance-toggle');
  for(const scope of ['self','team'])for(const view of ['year','month','week','day']){
    await click(`[data-scope="${scope}"]`);await click(`[data-view="${view}"]`);
    assert.equal(await evaluate(`document.querySelector('[data-scope="${scope}"]').getAttribute('aria-pressed')`),'true');
    assert.equal(await evaluate(`document.querySelector('[data-view="${view}"]').getAttribute('aria-pressed')`),'true');
    assert.ok(await evaluate('document.querySelector("#calendar-content").textContent.length > 20'));
    if(scope!=='self')assert.equal(await evaluate('/Vacation|Pending|Approved|sick|illness/i.test(document.querySelector("#calendar-content").textContent)'),false);
    if(scope!=='self')assert.equal(await evaluate('window.VacateLeave.types.some(type=>document.querySelector("#calendar-content").textContent.includes(type.name))'),false,'Shared calendar disclosed a leave type');
  }
  await click('[data-scope="self"]');await click('[data-view="month"]');
  // Isolate native keyboard input from the browser's earlier reportValidity popup.
  // Account/history and date-validation behavior are checked separately above.
  await load('?scope=self&view=month');
  await click('[data-date="2026-10-01"]');
  assert.match(await evaluate('document.querySelector("#dialog").textContent'),/No leave shown/);
  await closeDialog();
  await click('[data-date="2026-10-26"]');assert.match(await evaluate('document.querySelector("#dialog").textContent'),/Annual leave · Pending/);await evaluate('document.querySelector("#dialog").close()');
  await click('[data-scope="team"]');await click('#calendar-content [data-event]');assert.doesNotMatch(await evaluate('document.querySelector("#dialog-content").textContent'),/Vacation|Pending|Approved|sick|illness/i);await closeDialog();
  await click('[data-view="year"]');await click('[data-action="next"]');assert.equal(await evaluate('document.querySelector("#period").textContent'),'2027');await click('[data-action="today"]');assert.equal(await evaluate('document.querySelector("#period").textContent'),'2026');
  await click('[data-action="request"]');await evaluate('document.querySelector("#request-form").requestSubmit()');assert.match(await evaluate('document.querySelector("#dialog-content").textContent'),/No request was sent or saved/);await click('#finish-demo');
  for(const direction of ['a','b','c']){
    await load(`?direction=${direction}`);await screenshot(`${direction}-desktop.png`);
    await viewport(375,1100);await screenshot(`${direction}-mobile.png`);
    await click('#balance-toggle');
    await click('[data-balance=annual] summary');
    assert.equal(await evaluate('document.documentElement.scrollWidth <= innerWidth'),true,`${direction} expanded balances overflow on mobile`);
    await click('#balance-toggle');
    for(const view of ['year','month','week','day']){
      await click(`[data-view="${view}"]`);
      assert.equal(await evaluate('document.documentElement.scrollWidth <= innerWidth'),true,`${direction}/${view} overflows on mobile`);
    }
    await viewport(1600,1250);
  }
  assert.deepEqual(errors,[],'Unexpected browser exceptions');
  console.log('PASS: all 12 canonical accounts and compatibility aliases; independent team/department/org member rosters; own records; negative identity/scope/events; account resets and real Back/Forward traversal; demo login/logout; 29 leave types; all 28 requestable rule panels; balance expansion, units and percentages; excess/unknown projections; shared-detail privacy; all permitted scope/view combinations; 16 mobile overflow checks; 8 screenshots.');
} finally {
  clearTimeout(deadline);socket?.close();chrome.kill('SIGTERM');
  server?.close();
  await Promise.race([new Promise(resolve=>chrome.once('exit',resolve)),pause(3000)]);
  if(chrome.exitCode===null)chrome.kill('SIGKILL');
  await rm(profile,{recursive:true,force:true,maxRetries:3,retryDelay:200}).catch(()=>{});
}
