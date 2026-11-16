import assert from 'node:assert/strict';

// Paired functional checks against disposable fictional data, not native-input certification.
export async function runNavigationRoutesAcceptance({
  evaluate,
  click,
  waitFor,
  navigate,
  viewport,
  screenshot,
  baseUrl,
  apiUrl,
  fixtureGuid,
}) {
  assert.ok(
    ['localhost', '127.0.0.1', '::1'].includes(new URL(apiUrl).hostname),
    'Only a disposable local API may be mutated',
  );
  const tokens = new Set();
  const person = fixtureGuid('maya');
  let adminToken;
  let membershipPath;
  let allocation;
  let changed = false;
  let createdRequest;
  let leavePath;
  const api = async (method, path, token, body) => {
    const response = await fetch(`${apiUrl}/api/${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: 'Bearer ' + token } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    const raw = await response.text();
    return { status: response.status, data: raw ? JSON.parse(raw) : null };
  };
  const set = async (selector, value) =>
    evaluate(
      `(()=>{const el=document.querySelector(${JSON.stringify(selector)});el.value=${JSON.stringify(value)};el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}));})()`,
    );
  const login = async (alias, destination = '/calendar') => {
    await navigate(new URL('/config.json', baseUrl).href);
    await evaluate('sessionStorage.clear()');
    await navigate(new URL('/login?returnUrl=' + encodeURIComponent(destination), baseUrl).href);
    await waitFor('!!document.querySelector("#login-form")');
    await set('#username', alias);
    await set('#password', alias);
    await click('#login-form button[type=submit]');
    await waitFor('!!window.VacateMock && !!sessionStorage.getItem("vacate.session.token")');
    const token = await evaluate('sessionStorage.getItem("vacate.session.token")');
    tokens.add(token);
    return token;
  };
  const open = async (path) => navigate(new URL(path, baseUrl).href);
  const shots = async (name) => {
    for (const width of [1440, 375, 320]) {
      await viewport(width, 1100);
      assert.equal(
        await evaluate('document.documentElement.scrollWidth<=innerWidth'),
        true,
        `${name} fits ${width}px`,
      );
      await screenshot(`clean-routes-${name}-${width}.png`);
    }
    await viewport(1440, 1100);
  };
  try {
    await viewport(1440, 1100);
    adminToken = await login('nora', `/people/${person}?scope=org&year=2026`);
    await waitFor('document.querySelector("#person-detail-heading")?.textContent.includes("Maya")');
    assert.equal(
      await evaluate('location.pathname'),
      `/people/${person}`,
      'Login resumes GUID destination',
    );
    assert.equal(
      await evaluate('!!document.querySelector("[name=married], [name=dependentChildren]")'),
      false,
      'No private family fields',
    );
    await shots('person');
    const current = await api('GET', 'auth/sessions/current', adminToken);
    assert.equal(current.status, 200);
    const company = current.data.profile.membership.companyId;
    membershipPath = `organizations/${company}/memberships/${person}`;
    const baseline = await api('GET', membershipPath, adminToken);
    assert.equal(baseline.status, 200);
    allocation = baseline.data.membership.balance.customAllocation;
    const membership = baseline.data.membership.guid;
    await open(`/people/${person}/memberships/${membership}?scope=org&year=2026`);
    await waitFor('!!document.querySelector("#membership-form")');
    await shots('membership');
    const updated = (allocation ?? baseline.data.membership.balance.allocation ?? 30) + 1;
    await set('[name=customAllocation]', String(updated));
    changed = true;
    await click('#membership-form button[type=submit]');
    await waitFor(
      `location.pathname===${JSON.stringify('/people/' + person)} && !!document.querySelector('.person-tabs') && !document.querySelector('#membership-form')`,
    );
    assert.equal(
      (await api('GET', membershipPath, adminToken)).data.membership.balance.customAllocation,
      updated,
      'GUID membership route saves through existing API',
    );
    await open(`/people/${person}/memberships/30000000-0000-4000-8000-000000000099`);
    await waitFor(
      'document.querySelector("vacate-person-detail")?.textContent.includes("Person unavailable")',
    );
    assert.equal(await evaluate('!!document.querySelector("#membership-form")'), false);
    await open('/people/10000000-0000-4000-8000-000000000099');
    await waitFor(
      'document.querySelector("vacate-person-detail")?.textContent.includes("Person unavailable")',
    );
    await open('/index.html?page=people&scope=org&view=month&date=2026-11-14');
    await waitFor('!!document.querySelector("vacate-people table tbody tr[data-person]")');
    assert.equal(
      await evaluate('location.pathname + location.search'),
      '/people',
      'Legacy People omits default organisation and year state',
    );
    assert.equal(
      await evaluate(
        'new URLSearchParams(location.search).has("date") || new URLSearchParams(location.search).has("view")',
      ),
      false,
      'Legacy People drops Calendar-only state',
    );
    assert.equal(
      await evaluate(
        '!!document.querySelector("vacate-people h2, .people-legend, .people-scroll-hint")',
      ),
      false,
    );
    await set('vacate-people .people-filters select', 'team:' + fixtureGuid('applications'));
    await waitFor('document.querySelectorAll("vacate-people tbody tr[data-person]").length===3');
    assert.equal(
      await evaluate('new URLSearchParams(location.search).get("group")'),
      fixtureGuid('applications'),
    );
    await set('vacate-people .people-filters select', 'all');
    await waitFor(
      'document.querySelectorAll("vacate-people tbody tr[data-person]").length===12 && !location.search',
    );
    await click(`[data-edit-person="${person}"]`);
    await waitFor('!!document.querySelector("#membership-form")');
    assert.equal(
      await evaluate('location.pathname'),
      `/people/${person}/memberships/${membership}`,
    );
    await open(`/people/${person}/leave?year=2026`);
    await waitFor(
      'document.querySelector("vacate-person-detail")?.textContent.includes("Recorded leave · 2026")',
    );
    await open('/calendar?scope=org&view=month&date=2026-11-05');
    await waitFor(
      'document.querySelector("#period")?.textContent.includes("November 2026") && !new URLSearchParams(location.search).has("date")',
    );
    for (const width of [375, 320]) {
      await viewport(width, 1100);
      const grid = await evaluate(`(()=>{
        const grid=document.querySelector('.month-table-wrap');
        const cells=[...grid.querySelectorAll('tbody tr:first-child td')];
        return {visible:grid.getBoundingClientRect().height>0, columns:grid.querySelectorAll('thead th').length,
          sameRow:cells.every(cell=>Math.abs(cell.getBoundingClientRect().top-cells[0].getBoundingClientRect().top)<1),
          overflow:document.documentElement.scrollWidth>innerWidth,
          agenda:[...document.querySelectorAll('.agenda-mobile')].some(node=>node.getBoundingClientRect().height>0),
          context:!!document.querySelector('#date-details'),
          promotion:document.body.textContent.includes('View all company colleagues'),
          fictional:/fictional/i.test(document.body.innerText)};
      })()`);
      assert.deepEqual(grid, {
        visible: true,
        columns: 7,
        sameRow: true,
        overflow: false,
        agenda: false,
        context: false,
        promotion: false,
        fictional: false,
      });
      await screenshot(`lean-calendar-month-${width}.png`);
      await click('.month-table-wrap [data-date="2026-11-05"]');
      await waitFor('document.querySelector("#dialog")?.open');
      await click('#dialog .dialog-close');
      await waitFor('!document.querySelector("#dialog").open');
    }
    await viewport(1440, 1100);
    await open('/settings');
    await waitFor('!!document.querySelector("#profile-form")');
    assert.deepEqual(
      await evaluate(
        'Array.from(document.querySelectorAll(".settings-navigation button"), button=>button.textContent.trim())',
      ),
      ['Profile', 'Organization', 'Departments', 'Teams', 'System'],
    );
    await click('[data-settings-section=system]');
    await waitFor('!!document.querySelector("#display-layout")');
    await set('#display-layout', 'planner');
    await click('[data-nav=calendar]');
    await waitFor('!!document.querySelector(".planner-table")');
    await click('[data-view=month]');
    await viewport(375, 1100);
    assert.equal(
      await evaluate(
        'document.querySelector(".mobile-month-calendar .month-table-wrap").getBoundingClientRect().height>0 && document.querySelectorAll(".mobile-month-calendar thead th").length===7 && document.documentElement.scrollWidth<=innerWidth',
      ),
      true,
      'Planner Month remains a seven-column mobile calendar',
    );
    await screenshot('lean-planner-month-375.png');
    await open('/settings/system');
    await waitFor('!!document.querySelector("#display-layout")');
    await set('#display-layout', 'calendar');
    await click('[data-nav=calendar]');
    await waitFor('!!document.querySelector("#period")');
    await click('[data-action=request]');
    await waitFor(
      '!!document.querySelector("#request-type-info") && !document.querySelector("#request-preview").getAttribute("aria-busy").includes("true")',
    );
    assert.equal(await evaluate('document.querySelector("#request-type-status").hidden'), true);
    assert.equal(await evaluate('!!document.querySelector("#request-eligibility")'), false);
    await click('#request-type-info');
    assert.equal(await evaluate('document.querySelector("#request-type-status").hidden'), false);
    for (const width of [375, 320]) {
      await viewport(width, 1100);
      assert.equal(
        await evaluate(
          'document.documentElement.scrollWidth<=innerWidth && parseFloat(getComputedStyle(document.querySelector(".request-actions")).gap)>=12',
        ),
        true,
        'Request actions retain spacing on mobile',
      );
      await screenshot(`lean-request-${width}.png`);
    }
    await click('#dialog .dialog-close');
    await viewport(1440, 1100);
    await open('/calendar?scope=org&view=week&date=2026-11-05');
    await waitFor('window.VacateMock?.state.view==="week"');
    await click('[data-nav=leave]');
    await waitFor('location.pathname==="/leave" && !!document.querySelector("vacate-my-leave")');
    assert.equal(await evaluate('new URLSearchParams(location.search).has("date")'), false);
    await click('[data-nav=calendar]');
    await waitFor(
      'location.pathname==="/calendar" && document.querySelector("#period")?.textContent==="2 Nov – 8 Nov 2026"',
    );
    await evaluate('history.back()');
    await waitFor('location.pathname==="/leave"');
    await evaluate('history.forward()');
    await waitFor('location.pathname==="/calendar" && window.VacateMock?.state.view==="week"');
    const memberSession = await api('POST', 'auth/sessions', null, {
      username: 'maya',
      password: 'maya',
    });
    assert.equal(memberSession.status, 200);
    const memberToken = memberSession.data.accessToken;
    tokens.add(memberToken);
    leavePath = `organizations/${company}/leave/requests`;
    let draft;
    let preview;
    for (let offset = 3; offset < 35; offset++) {
      const date = new Date();
      date.setDate(date.getDate() + offset);
      draft = {
        leaveTypeId: 'annual',
        unit: 'days',
        mode: 'duration',
        startDate: date.toISOString().slice(0, 10),
        duration: 1,
      };
      preview = await api('POST', `organizations/${company}/leave/preview`, memberToken, draft);
      if (preview.status === 200 && preview.data.canSubmit && preview.data.newDates.length === 1)
        break;
    }
    assert.equal(preview.data.canSubmit, true);
    const submission = await api('POST', leavePath, memberToken, {
      ...draft,
      idempotencyKey: crypto.randomUUID(),
      previewFingerprint: preview.data.fingerprint,
    });
    assert.equal(submission.status, 200);
    createdRequest = submission.data.request.guid;
    await open(`/leave/requests/${createdRequest}`);
    await waitFor(
      'document.querySelector("vacate-request-detail")?.textContent.includes("unavailable for your account")',
    );
    await open('/help');
    await waitFor('!!document.querySelector("vacate-help")');
    assert.equal(
      await evaluate(
        'document.querySelector("vacate-help").textContent.includes("Feedback submission is not available")',
      ),
      true,
    );
    await shots('help');
    const inbox = await api('GET', `organizations/${company}/admin/approvals`, adminToken);
    assert.equal(inbox.status, 200);
    assert.ok(
      inbox.data.some((r) => r.requestGuid === createdRequest),
      'Created pending request is assigned to the administrator',
    );
    await open(`/approvals/${createdRequest}`);
    await waitFor('!!document.querySelector("#approval-review-heading")');
    assert.equal(await evaluate('location.pathname'), `/approvals/${createdRequest}`);
    await click('vacate-approvals .admin-actions .primary');
    await waitFor(
      'location.pathname==="/approvals" && document.querySelector("vacate-approvals .admin-success")?.textContent.includes("approved")',
    );
    const own = await login('maya', '/leave');
    await waitFor('!!document.querySelector("vacate-my-leave")');
    const requests = await api('GET', `organizations/${company}/leave/requests`, own);
    assert.equal(requests.status, 200);
    assert.ok(
      requests.data.some((r) => r.guid === createdRequest),
      'Own saved request is visible',
    );
    await open(`/leave/requests/${createdRequest}`);
    await waitFor('!!document.querySelector("vacate-request-detail vacate-cancel-request")');
    await open(`/people/${person}/memberships/${membership}`);
    await waitFor(
      'document.querySelector("vacate-person-detail")?.textContent.includes("Person unavailable")',
    );
    assert.equal(
      await evaluate('!!document.querySelector("#membership-form")'),
      false,
      'Employee cannot render private membership editor',
    );
    assert.equal(
      (await api('GET', membershipPath, own)).status,
      404,
      'Server also denies employee membership read',
    );
    await open('/settings/organization');
    await waitFor('!!document.querySelector("#profile-form")');
    assert.equal(await evaluate('location.pathname'), '/settings/profile');
    await open('/');
    await waitFor('location.pathname==="/calendar"');
    console.log(
      'PASS: clean and legacy routes, GUID login return, person/membership save and denials, request/approval links, Calendar history, Help and 1440/375/320px layouts.',
    );
  } finally {
    if (createdRequest)
      assert.equal(
        (await api('DELETE', leavePath + '/' + createdRequest, adminToken)).status,
        204,
        'Remove only the test-created personal request',
      );
    if (changed) {
      const restored = await api('PATCH', membershipPath, adminToken, {
        customAllocation: allocation,
      });
      assert.equal(restored.status, 200, 'Restore original fictional allocation');
    }
    for (const token of tokens)
      assert.equal(
        (await api('DELETE', 'auth/sessions/current', token)).status,
        204,
        'Revoke captured fictional session',
      );
  }
}
