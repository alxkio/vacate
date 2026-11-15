import assert from 'node:assert/strict';

// Mutates fictional records on a disposable seeded API. Never targets a hosted environment by default.
export async function runAdminAcceptance({
  evaluate,
  click,
  waitFor,
  navigate,
  viewport,
  screenshot,
  call,
  baseUrl,
  errors,
}) {
  console.log(
    'Admin functional mode: trusted native keyboard and screen-reader checks are separate.',
  );
  const today = new Date().toISOString().slice(0, 10);
  assert.ok(
    today >= '2026-11-10' && today <= '2026-12-14',
    `The seeded 2026 acceptance fixture requires future December dates and 2026 personnel totals; refresh fixture dates/allowances before reuse (${today}).`,
  );
  const company = '20000000-0000-4000-8000-000000000100';
  const path = `organizations/${company}/admin/`;
  const page = (query) => new URL('/index.html' + (query || ''), baseUrl).href;
  const set = (selector, value) =>
    evaluate(
      `document.querySelector(${JSON.stringify(selector)}).value=${JSON.stringify(value)};document.querySelector(${JSON.stringify(selector)}).dispatchEvent(new Event('input',{bubbles:true}));document.querySelector(${JSON.stringify(selector)}).dispatchEvent(new Event('change',{bubbles:true}));`,
    );
  const button = async (text, within = 'document') => {
    await evaluate(
      `(()=>{const button=Array.from(${within}.querySelectorAll('button')).find(b=>b.textContent.trim().startsWith(${JSON.stringify(text)}));if(!button)throw Error('Button missing: '+${JSON.stringify(text)});button.focus();button.click()})()`,
      true,
    );
  };
  const http = (method, resource, body) =>
    evaluate(
      `(async()=>{const response=await fetch('/api/'+${JSON.stringify(resource)},{method:${JSON.stringify(method)},headers:{Authorization:'Bearer '+sessionStorage.getItem('vacate.session.token'),'Content-Type':'application/json'},${body === undefined ? '' : 'body:JSON.stringify(' + JSON.stringify(body) + '),'} }); const text=await response.text();return {status:response.status,data:text?JSON.parse(text):null}})()`,
    );
  const login = async (actor) => {
    await evaluate('sessionStorage.clear()');
    await navigate(new URL('/login.html', baseUrl).href);
    await waitFor('!!document.querySelector("#login-form")');
    await set('#username', actor);
    await set('#password', actor);
    await click('#login-form button[type=submit]');
    await waitFor('!!document.querySelector("#period")');
    return (await http('GET', 'auth/sessions/current')).data;
  };
  const screenshotWidths = async (name) => {
    for (const width of [1440, 375, 320]) {
      await viewport(width, 1100);
      await screenshot(`${name}-${width}.png`);
      assert.equal(
        await evaluate('document.documentElement.scrollWidth <= innerWidth'),
        true,
        `${name} page overflow ${width}: ${JSON.stringify(await evaluate(`({innerWidth,docWidth:document.documentElement.scrollWidth,bodyWidth:document.body.scrollWidth,overflowing:Array.from(document.querySelectorAll('body *')).filter(el=>{const r=el.getBoundingClientRect();return r.right>innerWidth||r.left<0}).map(el=>({tag:el.tagName,cls:el.className,right:el.getBoundingClientRect().right,width:el.getBoundingClientRect().width,scroll:el.scrollWidth,client:el.clientWidth,overflow:getComputedStyle(el).overflowX})).slice(0,35)})`))}`,
      );
    }
  };
  const openCalendar = async () => {
    await navigate(page('?page=settings&section=organization'));
    await waitFor(
      '!!document.querySelector("#company-calendar-heading") && !!document.querySelector("vacate-company-calendar table")',
    );
  };
  const createRequest = async (startDate, endDate) => {
    const response = await http('POST', `organizations/${company}/leave/requests`, {
      leaveTypeId: 'annual',
      unit: 'days',
      mode: 'range',
      startDate,
      endDate,
      idempotencyKey: crypto.randomUUID(),
    });
    assert.equal(response.status, 200, JSON.stringify(response));
    return response.data.request.guid;
  };

  await viewport(1440, 1100);
  await navigate(page());
  await login('nora');
  await openCalendar();
  const calendar = await http('GET', path + 'calendar');
  assert.equal(calendar.status, 200);
  const noraGuid = calendar.data.candidates.find((p) => p.displayName.startsWith('Nora')).guid;
  const dariaGuid = calendar.data.candidates.find((p) => p.displayName.startsWith('Daria')).guid;
  await set('[name=assignmentScope]', 'organization');
  await set('[name=assignedApprover]', noraGuid);
  await button('Save approver assignment');
  await waitFor('document.querySelector("vacate-approver-settings").textContent.includes("saved")');
  await screenshotWidths('admin-settings');

  await button('Add recurring holiday');
  await waitFor('document.querySelector("vacate-company-calendar dialog")?.open');
  await set('vacate-company-calendar [name=name]', 'Recurring test holiday');
  await set('vacate-company-calendar [name=month]', '12');
  await set('vacate-company-calendar [name=day]', '15');
  await call('Network.enable');
  await call('Network.setBlockedURLs', { urls: ['*/admin/holidays'] });
  await button(
    'Save recurring holiday',
    'document.querySelector("vacate-company-calendar dialog")',
  );
  await waitFor('!!document.querySelector("vacate-company-calendar dialog [role=alert]")');
  assert.equal(
    await evaluate('document.querySelector("vacate-company-calendar [name=name]").value'),
    'Recurring test holiday',
  );
  await screenshot('admin-holiday-save-error-mobile.png');
  await call('Network.setBlockedURLs', { urls: [] });
  await button(
    'Save recurring holiday',
    'document.querySelector("vacate-company-calendar dialog")',
  );
  await waitFor(
    '!document.querySelector("vacate-company-calendar dialog").open && document.querySelector("vacate-company-calendar").textContent.includes("Recurring test holiday")',
  );

  const foreign = await http('POST', 'organizations', { name: 'Other synthetic company' });
  assert.equal(foreign.status, 201);
  await login('maya');
  await viewport(1440, 1100);
  await navigate(page('?scope=self&view=month&date=2026-10-01'));
  await waitFor(`!!document.querySelector('[data-date="2026-10-01"]')`);
  assert.equal(
    await evaluate(
      `(()=>{const date=document.querySelector('[data-date="2026-10-01"]');date.focus();return document.activeElement===date})()`,
    ),
    true,
  );
  await screenshot('calendar-historical-fixture-target.png');
  const preview = await http('POST', `organizations/${company}/leave/preview`, {
    leaveTypeId: 'annual',
    unit: 'days',
    mode: 'range',
    startDate: '2026-12-14',
    endDate: '2026-12-16',
  });
  assert.equal(preview.status, 200);
  assert.equal(preview.data.workingDates.length, 2);
  assert.ok(preview.data.excludedDates.some((date) => date.date === '2026-12-15'));
  await click('[data-action=request]');
  await waitFor(
    'document.querySelector("#dialog")?.open && !!document.querySelector("#start-date")',
  );
  await set('#start-date', '2026-12-14');
  await set('#end-date', '2026-12-16');
  await waitFor('document.querySelector("#request-form button[type=submit]")?.disabled === false');
  await click('#request-form button[type=submit]');
  await waitFor('!!document.querySelector("#finish-demo")');
  await screenshot('admin-company-holiday-request-saved.png');
  const mayaRequests = await http('GET', `organizations/${company}/leave/requests`);
  const requestGuid = mayaRequests.data.find((r) =>
    r.dates.some((d) => d.date === '2026-12-14'),
  ).guid;
  assert.ok(
    mayaRequests.data
      .find((r) => r.guid === requestGuid)
      .dates.every((d) => d.status === 'Pending'),
    'The approval journey must exercise pending dates, not past-date approval bypass.',
  );
  for (const resource of ['calendar', 'approvals', 'personnel?year=2026'])
    assert.ok([403, 404].includes((await http('GET', path + resource)).status));

  await login('nora');
  await navigate(page('?page=approvals'));
  await waitFor('document.querySelector("vacate-approvals")?.textContent.includes("Maya")');
  await screenshotWidths('admin-assigned-inbox');
  await openCalendar();
  await set('[name=assignedApprover]', dariaGuid);
  await button('Save approver assignment');
  await waitFor('document.querySelector("vacate-approver-settings").textContent.includes("saved")');
  assert.equal(
    (await http('GET', path + 'approvals')).data.some((r) => r.requestGuid === requestGuid),
    false,
  );
  assert.ok(
    [403, 404, 409].includes(
      (await http('POST', path + `approvals/${requestGuid}/decision`, { decision: 'approve' }))
        .status,
    ),
  );

  await login('daria');
  await navigate(page('?page=approvals'));
  await waitFor('document.querySelector("vacate-approvals")?.textContent.includes("Maya")');
  await button('Review', 'document.querySelector("vacate-approvals")');
  await waitFor('!!document.querySelector("#approval-review-heading")');
  await screenshot('admin-approval-review-mobile.png');
  await button('Approve request');
  await waitFor(
    'document.querySelector("vacate-approvals [role=status]")?.textContent.includes("approved")',
  );
  assert.equal(
    (await http('GET', path + 'approvals')).data.some((r) => r.requestGuid === requestGuid),
    false,
  );
  const selfRequest = await createRequest('2026-12-21', '2026-12-21');
  const selfDecision = await http('POST', path + `approvals/${selfRequest}/decision`, {
    decision: 'approve',
  });
  assert.equal(selfDecision.status, 200);
  assert.ok(selfDecision.data.dates.every((d) => d.status === 'Approved'));
  assert.equal(
    (await http('POST', path + `approvals/${selfRequest}/decision`, { decision: 'decline' }))
      .status,
    409,
  );

  await login('maya');
  const declineRequest = await createRequest('2026-12-22', '2026-12-22');
  await login('daria');
  assert.equal(
    (await http('POST', path + `approvals/${declineRequest}/decision`, { decision: 'decline' }))
      .status,
    200,
  );
  const before = (await http('GET', path + 'personnel?year=2026')).data;
  await openCalendar();
  await button('Add closure');
  await waitFor('document.querySelector("vacate-company-calendar dialog").open');
  await set('vacate-company-calendar [name=name]', 'No deduction closure');
  await set('vacate-company-calendar [name=startDate]', '2026-12-23');
  await set('vacate-company-calendar [name=endDate]', '2026-12-23');
  await button('Preview closure');
  await waitFor(
    'document.querySelector("vacate-company-calendar dialog").textContent.includes("Publish closure")',
  );
  await screenshot('admin-closure-preview-mobile.png');
  await button('Publish closure');
  await waitFor(
    '!document.querySelector("vacate-company-calendar dialog").open && !!document.querySelector("#closure-results-heading")',
  );
  const noDeduction = (await http('GET', path + 'personnel?year=2026')).data;
  assert.deepEqual(
    noDeduction.map((p) => [p.userGuid, p.used, p.pending, p.available]),
    before.map((p) => [p.userGuid, p.used, p.pending, p.available]),
  );
  const noDeductionClosure = (await http('GET', path + 'calendar')).data.closures.find(
    (closure) => closure.name === 'No deduction closure',
  );
  assert.ok(noDeductionClosure);
  for (const person of noDeduction) {
    const generated = person.requests.filter(
      (request) => request.closureGuid === noDeductionClosure.guid,
    );
    const result = noDeductionClosure.results.find((result) => result.userGuid === person.userGuid);
    assert.equal(generated.length, result.outcome === 'recorded' ? 1 : 0);
    for (const record of generated) {
      assert.equal(record.source, 'CompanyClosure');
      assert.equal(record.leaveTypeId, 'company-closure');
      assert.deepEqual(record.dates, [
        { date: '2026-12-23', status: 'Approved', entitlementYear: 2026, canCancel: false },
      ]);
    }
  }
  assert.ok(
    noDeduction.some((p) =>
      p.requests.some((r) => r.source === 'CompanyClosure' && r.leaveTypeId === 'company-closure'),
    ),
  );

  await button('Add closure');
  await waitFor('document.querySelector("vacate-company-calendar dialog").open');
  await set('vacate-company-calendar [name=name]', 'Annual partial closure');
  await set('vacate-company-calendar [name=startDate]', '2026-12-01');
  await set('vacate-company-calendar [name=endDate]', '2026-12-31');
  await click('vacate-company-calendar [name=deductAnnualLeave]');
  await button('Preview closure');
  await waitFor(
    'document.querySelector("vacate-company-calendar dialog").textContent.includes("Publish closure")',
  );
  await button('Publish closure');
  await waitFor(
    '!document.querySelector("vacate-company-calendar dialog").open && document.querySelector("vacate-company-calendar").textContent.includes("Annual partial closure")',
  );
  const savedCalendar = (await http('GET', path + 'calendar')).data;
  const closure = savedCalendar.closures.find((c) => c.name === 'Annual partial closure');
  assert.ok(closure.results.some((r) => r.outcome === 'recorded'));
  assert.ok(closure.results.some((r) => r.outcome === 'skipped'));
  assert.ok(closure.results.some((r) => r.outcome === 'skipped' && /balance/i.test(r.reason)));
  const closureReplay = await http('POST', path + 'closures', {
    name: closure.name,
    startDate: closure.startDate,
    endDate: closure.endDate,
    deductAnnualLeave: true,
    idempotencyKey: closure.idempotencyKey,
  });
  assert.equal(closureReplay.status, 200);
  assert.equal(closureReplay.data.guid, closure.guid);
  await screenshotWidths('admin-closure-partial-results');

  await navigate(page('?page=people'));
  await waitFor('!!document.querySelector("vacate-people")');
  await waitFor(
    'document.querySelectorAll("vacate-people [data-person]").length===12 && document.querySelector("vacate-people table").textContent.includes("Allocation")',
  );
  await screenshotWidths('admin-personnel');
  await button('Recorded leave', 'document.querySelector("vacate-people")');
  await waitFor('!!document.querySelector("#person-history")');
  await screenshot('admin-personnel-recorded-history-mobile.png');

  assert.equal(
    (await http('GET', `organizations/${foreign.data.guid}/admin/calendar`)).status,
    404,
  );
  await login('maya');
  await navigate(page('?page=people'));
  await waitFor('!!document.querySelector("vacate-people")');
  assert.equal(
    await evaluate(
      'document.querySelector("vacate-person-detail").textContent.includes("Personnel leave overview")',
    ),
    false,
  );
  await navigate(page('?page=leave'));
  await waitFor(
    'document.querySelector("vacate-my-leave")?.textContent.includes("Company closure")',
  );
  await screenshot('admin-closure-employee-history-mobile.png');
  assert.deepEqual(errors, []);
  console.log(
    'PASS: admin calendar, holiday exclusion/save recovery, automatic non-deducting and annual partial closures, publish replay, rerouting, assigned/self approval, decline, personnel, employee and foreign-tenant denial, desktop/mobile.',
  );
}
