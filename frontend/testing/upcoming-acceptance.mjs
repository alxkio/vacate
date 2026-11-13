import assert from 'node:assert/strict';

// Save real requests on a disposable seeded API; reference dates are not an upcoming oracle.
export async function runUpcomingAcceptance({
  evaluate,
  click,
  waitFor,
  navigate,
  viewport,
  screenshot,
  baseUrl,
  apiUrl,
}) {
  const page = (query = '') => new URL('/index.html' + query, baseUrl).href;
  const set = (selector, value) =>
    evaluate(
      `document.querySelector(${JSON.stringify(selector)}).value=${JSON.stringify(value)};document.querySelector(${JSON.stringify(selector)}).dispatchEvent(new Event('input',{bubbles:true}));`,
    );
  assert.ok(
    ['127.0.0.1', 'localhost', '::1'].includes(new URL(apiUrl).hostname),
    'Use a disposable local API.',
  );
  const tokens = new Set();
  let ownerToken;
  let adminToken;
  let root;
  let date;
  let before;
  let failure;
  let baseline = new Set();
  let initialRecords;
  let initialCalendar;
  const canonical = (records) => records.map((record) => JSON.stringify(record)).sort();
  const request = async (method, path, token, body) => {
    const response = await fetch(apiUrl + '/api/' + path, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: 'Bearer ' + token } : {}),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      signal: AbortSignal.timeout(15000),
    });
    const text = await response.text();
    return { status: response.status, data: text ? JSON.parse(text) : null };
  };
  const http = (method, path, body) => request(method, path, ownerToken, body);
  const login = async (alias) => {
    await evaluate('sessionStorage.clear()');
    await navigate(new URL('/login.html', baseUrl).href);
    await waitFor('!!document.querySelector("#login-form")');
    await set('#username', alias);
    await set('#password', alias);
    await evaluate('document.querySelector("#login-form").requestSubmit()', true);
    await waitFor('!!document.querySelector("#period")');
    const token = await evaluate('sessionStorage.getItem("vacate.session.token")');
    tokens.add(token);
    return token;
  };

  try {
    await viewport(1440, 1100);
    await navigate(page());
    ownerToken = await login('leah');
    const session = await http('GET', 'auth/sessions/current');
    assert.equal(session.status, 200);
    assert.ok(
      session.data.profile.username.endsWith('@example.invalid'),
      'Use fictional development accounts.',
    );
    root = `organizations/${session.data.profile.membership.companyId}/leave`;
    before = session.data.profile.membership.balance;
    const initial = await http('GET', root + '/requests');
    assert.equal(initial.status, 200);
    baseline = new Set(initial.data.map((record) => record.guid));
    initialRecords = canonical(initial.data);
    const initialDates = await http('GET', root + '/calendar');
    assert.equal(initialDates.status, 200);
    initialCalendar = canonical(initialDates.data);
    const adminSession = await request('POST', 'auth/sessions', null, {
      username: 'nora',
      password: 'nora',
    });
    assert.equal(adminSession.status, 200);
    adminToken = adminSession.data.accessToken;
    tokens.add(adminToken);
    const candidates = await evaluate(`(()=>{
    const now = new Date();
    return Array.from({length:21},(_,index)=>{
      const date=new Date(now.getFullYear(),now.getMonth(),now.getDate()+7+index);
      return [date.getFullYear(),String(date.getMonth()+1).padStart(2,'0'),String(date.getDate()).padStart(2,'0')].join('-');
    });
  })()`);
    for (const candidate of candidates) {
      const preview = await http('POST', root + '/preview', {
        leaveTypeId: 'annual',
        unit: 'days',
        mode: 'range',
        startDate: candidate,
        endDate: candidate,
      });
      assert.equal(preview.status, 200, JSON.stringify(preview));
      if (preview.data.canSubmit && preview.data.newDates.includes(candidate)) {
        date = candidate;
        break;
      }
    }
    assert.ok(date, 'The fictional employee needs an available future working day and balance.');
    await navigate(page('?scope=self&view=month&date=' + date));
    await waitFor('!!document.querySelector("[data-action=request]")');
    await click('[data-action=request]');
    await waitFor(
      'document.querySelector("#dialog")?.open && !!document.querySelector("#start-date")',
    );
    await set('#start-date', date);
    await set('#end-date', date);
    await waitFor(
      'document.querySelector("#request-preview")?.getAttribute("aria-busy") === "false" && document.querySelector("#request-form button[type=submit]")?.disabled === false',
    );
    await click('#request-form button[type=submit]');
    await waitFor('!!document.querySelector("#finish-demo")');
    const saved = await http('GET', root + '/requests');
    assert.equal(saved.status, 200);
    const record = saved.data.find(
      (request) =>
        !baseline.has(request.guid) &&
        request.leaveTypeId === 'annual' &&
        request.dates.length === 1 &&
        request.dates[0].date === date,
    );
    assert.ok(record, 'UI submission must create a new saved future request.');
    assert.ok(['Approved', 'Pending'].includes(record.dates[0].status));
    const eventId = `saved:${record.guid}:${date}`;
    await click('#finish-demo');

    // Reload to verify server persistence rather than only a local optimistic entry.
    await navigate(page('?scope=self&view=month&date=' + date));
    const upcoming = `.upcoming-card [data-event="${eventId}"]`;
    const calendar = `#calendar-content [data-event="${eventId}"]`;
    await waitFor(
      `!!document.querySelector(${JSON.stringify(upcoming)}) && !!document.querySelector(${JSON.stringify(calendar)})`,
    );
    const text = await evaluate(`document.querySelector(${JSON.stringify(upcoming)}).textContent`);
    assert.match(text, /Annual leave/);
    assert.ok(text.includes(record.dates[0].status), 'Upcoming status matches the saved request.');
    for (const width of [1440, 375]) {
      await viewport(width, 1100);
      assert.equal(
        await evaluate(
          `(()=>{const r=document.querySelector(${JSON.stringify(upcoming)}).getBoundingClientRect();return r.width>0&&r.height>0})()`,
        ),
        true,
      );
      await screenshot(`saved-future-upcoming-${width}.png`);
    }
    await click(upcoming);
    await waitFor(
      'document.querySelector("#dialog")?.open && !!document.querySelector("#workspace-dialog-title")',
    );
    const details = await evaluate('document.querySelector("#dialog-content").textContent');
    assert.match(details, /YOUR REQUEST/);
    assert.match(details, /Annual leave/);
    assert.ok(details.includes(record.dates[0].status));
    await screenshot('saved-future-request-details-mobile.png');
    const otherToken = await login('ravi');
    const other = await request('GET', 'auth/sessions/current', otherToken);
    assert.equal(other.status, 200);
    assert.ok(other.data.profile.username.startsWith('ravi@'));
    await navigate(page('?scope=self&view=month&date=' + date));
    await waitFor(
      '!!document.querySelector(".upcoming-card") && document.querySelector(".calendar-footer button")?.getAttribute("aria-disabled") === "false" && !document.querySelector(".load-feedback")',
    );
    assert.equal(
      await evaluate(`!!document.querySelector(${JSON.stringify(upcoming)})`),
      false,
      'Another employee must not see Leah’s own upcoming request.',
    );
  } catch (error) {
    failure = error;
  } finally {
    const cleanupErrors = [];
    try {
      if (date && ownerToken && adminToken) {
        // Discover the new record even if the browser failed immediately after server commit.
        const current = await http('GET', root + '/requests');
        assert.equal(current.status, 200);
        const created = current.data.filter(
          (record) =>
            !baseline.has(record.guid) && record.dates.some((entry) => entry.date === date),
        );
        for (const record of created) {
          try {
            assert.equal(record.source, 'EmployeeRequest');
            const deleted = await request('DELETE', root + '/requests/' + record.guid, adminToken);
            assert.equal(
              deleted.status,
              204,
              'Administrator teardown must delete the test request.',
            );
          } catch (error) {
            cleanupErrors.push(error);
          }
        }
        const remaining = await http('GET', root + '/requests');
        const calendar = await http('GET', root + '/calendar');
        assert.equal(remaining.status, 200);
        assert.equal(calendar.status, 200);
        assert.deepEqual(
          canonical(remaining.data),
          initialRecords,
          'Restore exactly the original request records.',
        );
        assert.deepEqual(
          canonical(calendar.data),
          initialCalendar,
          'Restore exactly the original calendar records.',
        );
        for (const record of created) {
          assert.ok(!remaining.data.some((entry) => entry.guid === record.guid));
          assert.ok(!calendar.data.some((entry) => entry.requestGuid === record.guid));
        }
        const restored = await http('GET', 'auth/sessions/current');
        assert.equal(restored.status, 200);
        const balance = restored.data.profile.membership.balance;
        for (const field of ['used', 'pending', 'available'])
          assert.equal(balance[field], before[field], 'Teardown restores ' + field);
      }
    } catch (error) {
      cleanupErrors.push(error);
    }
    for (const token of tokens) {
      try {
        const revoked = await request('DELETE', 'auth/sessions/current', token);
        assert.equal(revoked.status, 204);
        assert.equal((await request('GET', 'auth/sessions/current', token)).status, 401);
      } catch (error) {
        cleanupErrors.push(error);
      }
    }
    if (cleanupErrors.length)
      throw new AggregateError(
        [...(failure ? [failure] : []), ...cleanupErrors],
        'Upcoming test or teardown failed.',
      );
  }
  if (failure) throw failure;
  console.log(
    'PASS: future request created through UI, visualized at desktop/mobile, isolated from another account, then permanently deleted by admin with records/calendar/balances restored.',
  );
}
