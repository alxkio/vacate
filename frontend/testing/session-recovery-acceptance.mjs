import assert from 'node:assert/strict';

// Fail responses in the local test proxy; production endpoints and credentials remain unchanged.
export async function runSessionRecoveryAcceptance({
  evaluate,
  click,
  waitFor,
  navigate,
  viewport,
  screenshot,
  baseUrl,
  errors,
  failResponseOnce,
  resetResponseFault,
}) {
  const tickets = new Set();
  let failure;
  const peopleUrl = new URL('/people', baseUrl).href;
  const loginUrl = new URL('/login.html?returnUrl=%2Findex.html%3Fpage%3Dpeople', baseUrl).href;
  const token = () => evaluate('sessionStorage.getItem("vacate.session.token")');
  const recovery = async (expectedToken, returnPage) => {
    await waitFor(
      '!!document.querySelector("#retry-session") && !document.querySelector("vacate-workspace")',
    );
    assert.ok((await token()) === expectedToken, 'Recoverable errors preserve the saved ticket');
    assert.equal(
      await evaluate('document.querySelector("#login-form")?.getAttribute("aria-busy")'),
      'false',
    );
    assert.equal(
      await evaluate('document.querySelector("#password").value'),
      '',
      'Retry needs no password',
    );
    assert.equal(
      await evaluate('new URLSearchParams(location.search).get("returnUrl")'),
      returnPage,
    );
    await click('#retry-session');
    await waitFor(
      `!document.querySelector('#login-form') && !!document.querySelector('vacate-workspace') && window.VacateMock?.state.page === ${JSON.stringify(new URL(returnPage, baseUrl).pathname.startsWith('/settings') ? 'settings' : 'people')}`,
    );
    assert.ok(
      (await token()) === expectedToken,
      'Recovery reuses the ticket without another sign-in',
    );
  };
  try {
    await viewport(1440, 1100);
    await navigate(new URL('/config.json', baseUrl).href);
    await evaluate('sessionStorage.clear()');
    await navigate(loginUrl);
    await waitFor('!!document.querySelector("#login-form")');
    await evaluate(
      `document.querySelector('#username').value='maya';document.querySelector('#password').value='maya';document.querySelector('#login-form').requestSubmit()`,
    );
    await waitFor(
      '!document.querySelector("#login-form") && !!document.querySelector("vacate-people") && window.VacateMock?.state.page === "people"',
    );
    const saved = await token();
    assert.ok(saved);
    tickets.add(saved);

    for (const [path, width] of [
      ['/api/auth/sessions/current', 1440],
      ['/api/organizations/20000000-0000-4000-8000-000000000100/summary', 375],
    ]) {
      await viewport(width, 1100);
      failResponseOnce(path, 503);
      await navigate(peopleUrl);
      await waitFor('!!document.querySelector("#retry-session")');
      await screenshot(`session-recovery-${width}.png`);
      await recovery(saved, '/people');
      await waitFor(
        'document.querySelectorAll(".people-table tbody tr[data-person]").length === 12',
      );
    }

    failResponseOnce('/api/organizations/20000000-0000-4000-8000-000000000100/summary', 503);
    await click('[data-nav=settings]');
    await waitFor('!!document.querySelector("#retry-session")');
    const settingsReturn = await evaluate('new URLSearchParams(location.search).get("returnUrl")');
    assert.equal(new URL(settingsReturn, baseUrl).pathname, '/settings/profile');
    await recovery(saved, settingsReturn);
    await waitFor('!!document.querySelector("#profile-form")');

    // A session can genuinely expire while the user waits on the recovery screen.
    failResponseOnce('/api/auth/sessions/current', 503);
    await navigate(peopleUrl);
    await waitFor('!!document.querySelector("#retry-session")');
    failResponseOnce('/api/auth/sessions/current', 401);
    await click('#retry-session');
    await waitFor(
      '!!document.querySelector("#login-form") && new URLSearchParams(location.search).get("reason") === "expired"',
    );
    assert.ok(!(await token()), 'Expired tickets are removed');
    assert.equal(
      await evaluate('new URLSearchParams(location.search).get("returnUrl")'),
      '/people',
    );

    // Keep a successfully issued ticket even if the first workspace load fails after sign-in.
    failResponseOnce('/api/auth/sessions/current', 503);
    await evaluate(
      `document.querySelector('#username').value='maya';document.querySelector('#password').value='maya';document.querySelector('#login-form').requestSubmit()`,
    );
    await waitFor('!!document.querySelector("#retry-session")');
    const replacement = await token();
    assert.ok(replacement);
    assert.ok(replacement !== saved, 'A new sign-in issues another ticket');
    tickets.add(replacement);
    await recovery(replacement, '/people');
  } catch (error) {
    failure = error;
    throw error;
  } finally {
    resetResponseFault();
    const cleanupErrors = [];
    try {
      const current = await token();
      if (current) tickets.add(current);
    } catch (error) {
      cleanupErrors.push(error);
    }
    for (const ticket of tickets) {
      try {
        const response = await fetch(new URL('/api/auth/sessions/current', baseUrl), {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${ticket}` },
        });
        assert.ok(
          [204, 401].includes(response.status),
          'Test session is revoked after recovery checks',
        );
        const current = await fetch(new URL('/api/auth/sessions/current', baseUrl), {
          headers: { Authorization: `Bearer ${ticket}` },
        });
        assert.equal(current.status, 401, 'Revoked test tickets cannot authenticate');
      } catch (error) {
        cleanupErrors.push(error);
      }
    }
    if (cleanupErrors.length)
      throw new AggregateError(
        failure ? [failure, ...cleanupErrors] : cleanupErrors,
        'Session recovery teardown failed',
      );
  }
  assert.deepEqual(errors, [], 'Unexpected session recovery browser exceptions');
  console.log(
    'PASS: startup current-user/summary failures and Settings validation failures retain tickets and recover the prior page without credentials; test sessions are revoked.',
  );
}
