// Browser acceptance checks and reproducible screenshots. Node.js 22+, local Chrome.
import { spawn } from 'node:child_process';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import assert from 'node:assert/strict';
const root = dirname(fileURLToPath(import.meta.url));
const profile = await mkdtemp(join(tmpdir(), 'vacate-mock-qa-'));
const output = join(root, 'previews');
await mkdir(output, { recursive: true });
const chrome = spawn(process.env.CHROME_BIN || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', [
  '--headless', '--disable-gpu', '--disable-background-networking', '--no-first-run',
  '--no-default-browser-check', '--disable-component-update', '--remote-debugging-port=0',
  `--user-data-dir=${profile}`, 'about:blank',
], { stdio: ['ignore', 'ignore', 'pipe'] });
let socket, nextId=0; const waiting=new Map(), errors=[];
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const deadline=setTimeout(()=>{chrome.kill('SIGKILL');process.exitCode=1;},90000);
const endpoint = await new Promise((resolve,reject)=>{
  let log=''; chrome.stderr.on('data',data=>{log+=data;const match=log.match(/DevTools listening on (ws:\/\/[^\s]+)/);if(match)resolve(match[1]);});
  chrome.on('error',reject);chrome.on('exit',code=>reject(new Error(`Chrome exited: ${code}`)));
  setTimeout(()=>reject(new Error('Chrome debugging endpoint unavailable')),20000).unref();
});
try {
  const port=new URL(endpoint).port;
  const targets=await (await fetch(`http://127.0.0.1:${port}/json`)).json();
  socket=new WebSocket(targets.find(target=>target.type==='page').webSocketDebuggerUrl);
  await new Promise((resolve,reject)=>{socket.onopen=resolve;socket.onerror=reject;});
  socket.onmessage=message=>{const data=JSON.parse(message.data);if(data.id){const pending=waiting.get(data.id);waiting.delete(data.id);data.error?pending.reject(data.error):pending.resolve(data.result);}if(data.method==='Runtime.exceptionThrown')errors.push(data.params.exceptionDetails.text);};
  const call=(method,params={})=>new Promise((resolve,reject)=>{const id=++nextId;waiting.set(id,{resolve,reject});socket.send(JSON.stringify({id,method,params}));});
  const evaluate=async expression=>{const result=await call('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(result.exceptionDetails)throw Error(JSON.stringify(result.exceptionDetails));return result.result.value;};
  const click=selector=>evaluate(`document.querySelector(${JSON.stringify(selector)}).click()`);
  const load=async query=>{await call('Page.navigate',{url:pathToFileURL(join(root,'dist/index.html')).href+query});for(let attempt=0;attempt<50;attempt++){if(await evaluate('document.readyState === "complete" && !!document.querySelector("#period")?.textContent'))return;await pause(100);}throw Error('Mock did not render');};
  const viewport=(width,height)=>call('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false});
  const screenshot=async name=>{await pause(150);const result=await call('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});await writeFile(join(output,name),Buffer.from(result.data,'base64'));};
  await call('Runtime.enable');await call('Page.enable');await viewport(1600,1250);
  await load('');
  for(const scope of ['self','team','org'])for(const view of ['year','month','week','day']){
    await click(`[data-scope="${scope}"]`);await click(`[data-view="${view}"]`);
    assert.equal(await evaluate(`document.querySelector('[data-scope="${scope}"]').getAttribute('aria-pressed')`),'true');
    assert.equal(await evaluate(`document.querySelector('[data-view="${view}"]').getAttribute('aria-pressed')`),'true');
    assert.ok(await evaluate('document.querySelector("#calendar-content").textContent.length > 20'));
    if(scope!=='self')assert.equal(await evaluate('/Vacation|Pending|Approved|sick|illness/i.test(document.querySelector("#calendar-content").textContent)'),false);
  }
  await click('[data-scope="self"]');await click('[data-view="month"]');
  await click('[data-date="2026-10-01"]');assert.match(await evaluate('document.querySelector("#dialog").textContent'),/No leave shown/);
  await call('Input.dispatchKeyEvent',{type:'keyDown',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});await call('Input.dispatchKeyEvent',{type:'keyUp',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});
  assert.equal(await evaluate('document.querySelector("#dialog").open'),false);
  assert.equal(await evaluate('document.activeElement.dataset.date'),'2026-10-01');
  await click('[data-date="2026-10-26"]');assert.match(await evaluate('document.querySelector("#dialog").textContent'),/Vacation · Approved/);await evaluate('document.querySelector("#dialog").close()');
  await click('[data-scope="org"]');await click('[data-event="s1"]');assert.doesNotMatch(await evaluate('document.querySelector("#dialog-content").textContent'),/Vacation|Pending|Approved|sick|illness/i);await evaluate('document.querySelector("#dialog").close()');
  await click('[data-view="year"]');await click('[data-action="next"]');assert.equal(await evaluate('document.querySelector("#period").textContent'),'2027');await click('[data-action="today"]');assert.equal(await evaluate('document.querySelector("#period").textContent'),'2026');
  await click('[data-action="request"]');await evaluate('document.querySelector("#request-form").requestSubmit()');assert.match(await evaluate('document.querySelector("#dialog-content").textContent'),/No request was sent or saved/);await click('#finish-demo');
  for(const direction of ['a','b','c']){
    await load(`?direction=${direction}`);await screenshot(`${direction}-desktop.png`);
    await viewport(375,1100);await screenshot(`${direction}-mobile.png`);
    for(const view of ['year','month','week','day']){
      await click(`[data-view="${view}"]`);
      assert.equal(await evaluate('document.documentElement.scrollWidth <= innerWidth'),true,`${direction}/${view} overflows on mobile`);
    }
    await viewport(1600,1250);
  }
  assert.deepEqual(errors,[],'Unexpected browser exceptions');
  console.log('PASS: 12 scope/view combinations; shared-detail privacy; empty/own details; Escape and focus return; year boundary/today; demo request; 12 mobile overflow checks; 6 screenshots.');
} finally {
  clearTimeout(deadline);socket?.close();chrome.kill('SIGTERM');
  await Promise.race([new Promise(resolve=>chrome.once('exit',resolve)),pause(3000)]);
  if(chrome.exitCode===null)chrome.kill('SIGKILL');
  await rm(profile,{recursive:true,force:true,maxRetries:3,retryDelay:200}).catch(()=>{});
}
