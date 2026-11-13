import assert from 'node:assert/strict';

export async function runFeedbackAcceptance({
  evaluate,
  click,
  waitFor,
  navigate,
  viewport,
  screenshot,
  call,
  baseUrl,
  errors,
  prepareNativeFocus,
}) {
  const page = (query = '') => new URL('/index.html' + query, baseUrl).href;
  const set = async (selector, value) =>
    evaluate(
      `document.querySelector(${JSON.stringify(selector)}).value=${JSON.stringify(value)};document.querySelector(${JSON.stringify(selector)}).dispatchEvent(new Event('input',{bubbles:true}));document.querySelector(${JSON.stringify(selector)}).dispatchEvent(new Event('change',{bubbles:true}));`,
    );
  const login = async (actor) => {
    await waitFor('!!document.querySelector("#login-form")');
    await set('#username', actor);
    await set('#password', actor);
    await click('#login-form button[type=submit]');
    await waitFor('!!document.querySelector(".app")');
  };
  await viewport(1440, 1100);
  await navigate(page());
  await waitFor('!!document.querySelector("#login-form")');
  assert.equal(
    await evaluate(
      'document.querySelector(".login-today").textContent.trim() === String(new Date().getDate())',
    ),
    true,
  );
  await screenshot('feedback-login-desktop.png');
  await login('maya');
  assert.equal(
    await evaluate(
      'document.querySelector("#period").textContent.includes(new Date().toLocaleDateString("en-GB",{month:"long"}))',
    ),
    true,
  );
  await navigate(page('?page=people'));
  await waitFor('document.querySelectorAll("vacate-people tbody tr").length === 12');
  assert.equal(await evaluate('!!document.querySelector("[data-edit-membership]")'), false);
  assert.equal(
    await evaluate(
      '!!document.querySelector("tbody .same-team") && !!document.querySelector("tbody .same-department") && !!document.querySelector("tbody .company-colleague")',
    ),
    true,
  );
  for (const width of [1440, 375, 320]) {
    await viewport(width, 1100);
    await screenshot(`feedback-people-${width}.png`);
    assert.equal(await evaluate('document.documentElement.scrollWidth <= innerWidth'), true);
  }
  await click('.topbar a.brand');
  await waitFor('document.querySelector(".app")?.dataset.page === "calendar"');
  await click('[data-action=request]');
  await waitFor(
    'document.querySelector("#dialog")?.open && !!document.querySelector("#start-date")',
  );
  await set('#start-date', '2026-11-10');
  await set('#end-date', '2026-11-09');
  await waitFor('document.querySelector("#end-date").getAttribute("aria-invalid") === "true"');
  assert.equal(
    await evaluate('document.querySelector("#request-form button[type=submit]").disabled'),
    true,
  );
  await screenshot('feedback-request-invalid-mobile.png');
  await set('#end-date', '2026-11-10');
  await waitFor('!!document.querySelector("#request-amount-preview")');
  assert.equal(await evaluate('!!document.querySelector(".field-warning")'), true);
  assert.equal(
    await evaluate('document.querySelector("#end-date").getAttribute("aria-invalid")'),
    'false',
  );
  await screenshot('feedback-request-past-warning-mobile.png');
  await evaluate('document.querySelector("#dialog").close()');
  await navigate(page('?page=people'));
  await waitFor('document.querySelectorAll("vacate-people tbody tr").length === 12');
  await evaluate(
    '(async()=>{await fetch("/api/auth/sessions/current",{method:"DELETE",headers:{Authorization:"Bearer "+sessionStorage.getItem("vacate.session.token")}})})()',
  );
  await click('vacate-people button.secondary');
  await waitFor('!!document.querySelector("#login-form")');
  assert.equal(
    await evaluate('new URLSearchParams(location.search).get("returnUrl")'),
    '/index.html?page=people',
  );
  await login('maya');
  await waitFor('document.querySelectorAll("vacate-people tbody tr").length === 12');
  await evaluate('sessionStorage.clear()');
  await navigate(new URL('/login.html', baseUrl).href);
  await login('nora');
  await navigate(page('?page=people'));
  await waitFor('!!document.querySelector("[data-edit-membership=maya]")');
  await evaluate("document.querySelector('[data-edit-membership=maya]').focus()");
  await click('[data-edit-membership=maya]');
  await waitFor('!!document.querySelector("#membership-form")');
  await click('#membership-form .org-secondary');
  assert.equal(await evaluate('document.activeElement?.dataset.editMembership'), 'maya');
  await navigate(page('?page=settings&section=organization'));
  await waitFor('!!document.querySelector("#organization-policy-form")');
  assert.equal(
    await evaluate(
      'document.querySelector("#organization-form").compareDocumentPosition(document.querySelector("#organization-policy-form")) & Node.DOCUMENT_POSITION_FOLLOWING',
    ),
    4,
  );
  assert.equal(
    await evaluate(
      'document.querySelectorAll("#organization-policy-form input[role=switch]").length',
    ),
    4,
  );
  for (const width of [1440, 375]) {
    await viewport(width, 1100);
    await screenshot(`feedback-settings-${width}.png`);
  }
  if (process.env.MOCK_FEEDBACK_SKIP_NATIVE === '1') {
    console.log(
      'UNVERIFIED: native keyboard delivery explicitly skipped; inspect native-input-failure.json from the failed readiness run.',
    );
    await evaluate('document.querySelector("#organization-policy-form").scrollIntoView()');
  } else {
    await prepareNativeFocus();
    await evaluate(
      'document.querySelector("#organization-policy-form").scrollIntoView();document.querySelector("#organization-vacation-approval").focus()',
    );
    const approval = await evaluate(
      'document.querySelector("#organization-vacation-approval").checked',
    );
    for (const type of ['keyDown', 'keyUp'])
      await call('Input.dispatchKeyEvent', {
        type,
        key: ' ',
        code: 'Space',
        windowsVirtualKeyCode: 32,
      });
    assert.equal(
      await evaluate('document.querySelector("#organization-vacation-approval").checked'),
      !approval,
    );
    for (const type of ['keyDown', 'keyUp'])
      await call('Input.dispatchKeyEvent', {
        type,
        key: ' ',
        code: 'Space',
        windowsVirtualKeyCode: 32,
      });
  }
  await screenshot('feedback-policy-switches-mobile.png');
  const openCreate = async (kind) => {
    await evaluate(
      `(()=>{const button = Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim() === 'Add ${kind}');button.focus();button.click()})()`,
    );
    await waitFor('document.querySelector(".structure-dialog")?.open');
  };
  await openCreate('department');
  assert.equal(
    await evaluate('document.querySelector(".structure-dialog button[type=submit]").disabled'),
    true,
  );
  await set('[name=createName]', 'Browser check department');
  await call('Network.enable');
  await call('Network.setBlockedURLs', { urls: ['*/api/organizations/*/departments'] });
  await click('.structure-dialog button[type=submit]');
  await waitFor('!!document.querySelector(".structure-dialog [role=alert]")');
  assert.equal(
    await evaluate('document.querySelector("[name=createName]").value'),
    'Browser check department',
  );
  await call('Network.setBlockedURLs', { urls: [] });
  await click('.structure-dialog button[type=submit]');
  await waitFor(
    '!document.querySelector(".structure-dialog").open && document.querySelector(".org-departments").textContent.includes("Browser check department")',
  );
  assert.equal(await evaluate('document.activeElement.textContent.trim()'), 'Add department');
  await openCreate('team');
  await set('[name=createName]', 'Browser check team');
  await screenshot('feedback-add-team-mobile.png');
  await click('.structure-dialog button[type=submit]');
  await waitFor(
    '!document.querySelector(".structure-dialog").open && document.querySelector(".org-direct-teams").textContent.includes("Browser check team")',
  );
  await navigate(page('?page=settings&section=system&view=week'));
  await waitFor('!!document.querySelector("#display-layout")');
  await set('#display-layout', 'planner');
  await waitFor('document.querySelector(".app").dataset.layout === "planner"');
  await set('#display-layout', 'calendar');
  await waitFor('document.querySelector(".app").dataset.layout === "calendar"');
  await click('.topbar a.brand');
  await waitFor('!!document.querySelector("#period")');
  assert.equal(await evaluate('document.querySelector(".app").dataset.layout'), 'calendar');
  await screenshot('feedback-calendar-mobile.png');
  await evaluate(
    '(async()=>{await fetch("/api/auth/sessions/current",{method:"DELETE",headers:{Authorization:"Bearer "+sessionStorage.getItem("vacate.session.token")}})})()',
  );
  await click('[data-action=help]');
  await waitFor('!!document.querySelector("#login-form")');
  assert.equal(
    await evaluate('new URLSearchParams(location.search).get("returnUrl")'),
    '/index.html',
  );
  await login('nora');
  await waitFor('!!document.querySelector("#period")');
  assert.deepEqual(errors, []);
  console.log(
    'PASS: owner feedback, current dates, invalid/past requests, employee/admin directory, focus, structure save/recovery, immediate preferences, logo and real session-expiry return journey; desktop/mobile without page overflow.',
  );
}
