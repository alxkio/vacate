import assert from 'node:assert/strict';

// Mutates and restores only personal requests on a disposable local fixture API.
export async function runLeavePeopleAcceptance({
  evaluate,
  click,
  waitFor,
  navigate,
  viewport,
  screenshot,
  baseUrl,
  apiUrl,
}) {
  assert.ok(['localhost', '127.0.0.1', '::1'].includes(new URL(apiUrl).hostname));
  const tokens = new Set();
  const requests = [];
  let admin;
  const company = '20000000-0000-4000-8000-000000000100';
  const root = `organizations/${company}/leave`;
  const api = async (method, path, token, body) => {
    const response = await fetch(apiUrl + '/api/' + path, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: 'Bearer ' + token } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    const text = await response.text();
    return { status: response.status, data: text ? JSON.parse(text) : null };
  };
  const set = (selector, value) =>
    evaluate(
      `(()=>{const el=document.querySelector(${JSON.stringify(selector)});el.value=${JSON.stringify(value)};el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}));})()`,
    );
  const button = (text, parent = 'document') =>
    evaluate(
      `(()=>{const el=Array.from(${parent}.querySelectorAll('button')).find(el=>el.textContent.trim().startsWith(${JSON.stringify(text)}));if(!el)throw Error('Missing button '+${JSON.stringify(text)});el.click()})()`,
      true,
    );
  const page = (query) => new URL('/index.html?' + query, baseUrl).href;
  const login = async (alias) => {
    await navigate(new URL('/login.html', baseUrl).href);
    await waitFor('!!document.querySelector("#login-form")');
    await set('#username', alias);
    await set('#password', alias);
    await click('#login-form button[type=submit]');
    await waitFor('!!document.querySelector("#period")');
    const token = await evaluate('sessionStorage.getItem("vacate.session.token")');
    tokens.add(token);
    return token;
  };
  const shots = async (name) => {
    for (const width of [1440, 375, 320]) {
      await viewport(width, 1000);
      await screenshot(`${name}-${width}.png`);
      assert.equal(
        await evaluate('document.documentElement.scrollWidth <= innerWidth'),
        true,
        `Page overflow: ${name} ${width}: ${JSON.stringify(await evaluate(`({doc:document.documentElement.scrollWidth,body:document.body.scrollWidth,innerWidth,blocks:Array.from(document.querySelectorAll('html,body,.app,main,vacate-my-leave,.navigation-card,.history-table')).map(el=>({tag:el.tagName,cls:el.className,width:el.getBoundingClientRect().width,scroll:el.scrollWidth,overflow:getComputedStyle(el).overflowX}))})`))}: ${JSON.stringify(await evaluate(`Array.from(document.querySelectorAll('html,body,.app,main,vacate-my-leave,.navigation-card,.history-table,body *')).filter(el=>{const r=el.getBoundingClientRect();return r.right>innerWidth && el.clientWidth>0}).slice(0,16).map(el=>({tag:el.tagName,cls:el.className,width:el.getBoundingClientRect().width,right:el.getBoundingClientRect().right,overflow:getComputedStyle(el).overflowX}))`))}`,
      );
    }
  };
  try {
    const adminLogin = await api('POST', 'auth/sessions', null, {
      username: 'nora',
      password: 'nora',
    });
    assert.equal(adminLogin.status, 200);
    admin = adminLogin.data.accessToken;
    tokens.add(admin);
    const owner = await login('maya');
    const initial = await api('GET', root + '/requests', owner);
    assert.equal(initial.status, 200);
    const expired = initial.data
      .flatMap((request) => request.dates)
      .filter((day) => day.status === 'Expired');
    assert.ok(
      expired.every((day) => day.canCancel === false),
      'Expired history is read-only',
    );
    const now = new Date();
    let draft;
    let preview;
    for (let offset = 3; offset < 35; offset++) {
      const start = new Date(now);
      start.setDate(start.getDate() + offset);
      const startDate = start.toISOString().slice(0, 10);
      draft = { leaveTypeId: 'annual', unit: 'days', mode: 'duration', startDate, duration: 2 };
      preview = await api('POST', root + '/preview', owner, draft);
      if (preview.status === 200 && preview.data.canSubmit && preview.data.newDates.length === 2)
        break;
    }
    assert.equal(preview.data.canSubmit, true);
    const saved = await api('POST', root + '/requests', owner, {
      ...draft,
      idempotencyKey: crypto.randomUUID(),
      previewFingerprint: preview.data.fingerprint,
    });
    assert.equal(saved.status, 200);
    const guid = saved.data.request.guid;
    requests.push(guid);
    const dates = saved.data.request.dates.map((day) => day.date);
    await navigate(page('page=leave'));
    await waitFor(`document.querySelectorAll('[data-saved-request="${guid}"]').length===2`);
    assert.equal(await evaluate('document.querySelector("vacate-my-leave > details").open'), false);
    assert.equal(await evaluate('!!document.querySelector("#reference-history")'), false);
    const tablePresentation = async () =>
      evaluate(`(()=>{
      const table=document.querySelector('vacate-data-table table');
      const heading=table.querySelector('thead th');
      const cell=table.querySelector('tbody td');
      const header=getComputedStyle(heading), row=getComputedStyle(cell);
      return {collapse:getComputedStyle(table).borderCollapse,headerFont:header.fontSize,
        headerPadding:header.padding,rowFont:row.fontSize,rowPadding:row.padding,
        region:table.parentElement.getAttribute('role'),tabindex:table.parentElement.tabIndex};
    })()`);
    const leaveTablePresentation = await tablePresentation();
    if (expired.length)
      assert.equal(
        await evaluate(
          'document.querySelector("#saved-leave-requests").textContent.includes("Expired")',
        ),
        true,
      );
    await shots('my-leave-collapsed');
    await evaluate(
      'document.querySelector("#saved-leave-requests").scrollIntoView({block:"center"})',
    );
    await shots('my-leave-table');
    await click('vacate-my-leave > details > summary');
    await waitFor('document.querySelector("vacate-my-leave > details").open');
    await shots('my-leave-expanded');
    await click('vacate-my-leave > details > summary');
    await set('vacate-my-leave .history-filters select', 'Pending');
    assert.equal(
      await evaluate(`document.querySelectorAll('[data-saved-request="${guid}"]').length`),
      2,
    );
    await set('vacate-my-leave .history-filters input[type=date]', dates[1]);
    await waitFor(`document.querySelectorAll('[data-saved-request="${guid}"]').length===1`);
    await button('Clear filters', 'document.querySelector("vacate-my-leave")');
    await click(`[data-saved-request="${guid}"] button`);
    await button('Cancel / modify request', 'document.querySelector(".request-editor")');
    assert.equal(
      await evaluate(
        'document.querySelectorAll(".request-editor input[type=checkbox]:checked").length',
      ),
      2,
    );
    // Keep the first date selected and preserve the second for calendar cancellation.
    await evaluate(
      `(()=>{const boxes=document.querySelectorAll('.request-editor input[type=checkbox]');if(!boxes[0].checked)boxes[0].click();if(boxes[1].checked)boxes[1].click();})()`,
      true,
    );
    await button('Confirm cancellation', 'document.querySelector(".request-editor")');
    await waitFor('!document.querySelector(".request-editor")');
    let history = await api('GET', root + '/requests', owner);
    assert.deepEqual(
      history.data.find((r) => r.guid === guid).dates.map((d) => d.status),
      ['Cancelled', 'Pending'],
    );
    await navigate(page(`page=calendar&scope=self&view=month&date=${dates[1]}`));
    await waitFor(`!!document.querySelector('[data-date="${dates[1]}"]')`);
    await click(`[data-date="${dates[1]}"]`);
    await waitFor('!!document.querySelector("dialog[open] vacate-cancel-request button")');
    await button('Cancel / modify request', 'document.querySelector("dialog[open]")');
    await shots('calendar-cancel-dates');
    await button('Confirm cancellation', 'document.querySelector("dialog[open]")');
    await waitFor('!document.querySelector("dialog[open]")');
    history = await api('GET', root + '/requests', owner);
    assert.deepEqual(
      history.data.find((r) => r.guid === guid).dates.map((d) => d.status),
      ['Cancelled', 'Cancelled'],
    );
    const calendar = await api('GET', root + '/calendar', owner);
    assert.equal(
      calendar.data.some((d) => d.requestGuid === guid),
      false,
    );
    const after = await api('POST', root + '/preview', owner, draft);
    assert.deepEqual(
      after.data.balances,
      preview.data.balances,
      'Cancellation restores the original accounting',
    );
    await navigate(page('page=people'));
    await waitFor('document.querySelectorAll("vacate-people [data-person]").length===12');
    assert.equal(await evaluate('document.querySelectorAll("vacate-people .you-label").length'), 1);
    await set('vacate-people select', 'team');
    await waitFor('document.querySelectorAll("vacate-people [data-person]").length<12');
    await shots('people-my-team');
    assert.equal(
      await evaluate(
        'document.querySelector("vacate-people table").textContent.includes("Allocation")',
      ),
      false,
    );
    await evaluate('sessionStorage.clear()');
    await login('nora');
    await navigate(page('page=people'));
    await waitFor(
      'document.querySelectorAll("vacate-people [data-person]").length===12 && !document.querySelector("vacate-people [role=status]")',
    );
    assert.deepEqual(
      await tablePresentation(),
      leaveTablePresentation,
      'Nora’s combined directory/balances and My Leave use the same table design',
    );
    assert.equal(
      await evaluate('!!document.querySelector("nav [data-nav=admin-balances]")'),
      false,
    );
    await set('vacate-people input[type=search]', 'Maya');
    await waitFor('document.querySelectorAll("vacate-people [data-person]").length===1');
    await button('Recorded leave', 'document.querySelector("vacate-people")');
    await waitFor('!!document.querySelector("#person-history")');
    await shots('people-admin-balances-history');
    await navigate(page('page=admin-balances'));
    await waitFor('!!document.querySelector("vacate-people")');
    assert.equal(await evaluate('document.querySelectorAll("vacate-people").length'), 1);
    assert.equal(await evaluate('!!document.querySelector("vacate-admin-balances")'), false);
    console.log(
      'PASS: unified history/filtering, collapsed/expanded balances, partial and calendar cancellation, balance restoration, You/scope/search, unified admin balances/history, legacy route and desktop/mobile layouts.',
    );
  } finally {
    for (const guid of requests)
      assert.equal((await api('DELETE', root + '/requests/' + guid, admin)).status, 204);
    for (const token of tokens) {
      assert.equal((await api('DELETE', 'auth/sessions/current', token)).status, 204);
      assert.equal((await api('GET', 'auth/sessions/current', token)).status, 401);
    }
  }
}
