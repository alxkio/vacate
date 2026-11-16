import assert from 'node:assert/strict';

// Functional focus/style checks; forced pseudo states do not prove native keyboard delivery.
export async function runPageFocusAcceptance({
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
  const tickets = new Set();
  const cleanupErrors = [];
  let primaryError;
  const captureTicket = async () => {
    await waitFor('!!sessionStorage.getItem("vacate.session.token")');
    const ticket = await evaluate('sessionStorage.getItem("vacate.session.token")');
    assert.ok(ticket, 'A successfully issued fictional session is captured for teardown');
    tickets.add(ticket);
  };
  try {
    await viewport(1440, 1100);
    await navigate(new URL('/config.json', baseUrl).href);
    await evaluate('sessionStorage.clear()');
    const login = new URL('/login.html', baseUrl);
    login.searchParams.set('returnUrl', '/index.html?page=leave');
    await navigate(login.href);
    await waitFor('!!document.querySelector("#login-form")');
    await evaluate(
      `document.querySelector('#username').value='maya';document.querySelector('#password').value='maya';document.querySelector('#login-form').requestSubmit()`,
    );
    await captureTicket();
    await waitFor(
      '!!document.querySelector("vacate-my-leave") && document.activeElement === document.querySelector("main#main")',
    );

    await call('DOM.enable');
    await call('CSS.enable');
    const focusStyle = async (selector, assertStyle) => {
      const { root } = await call('DOM.getDocument');
      const { nodeId } = await call('DOM.querySelector', { nodeId: root.nodeId, selector });
      assert.ok(nodeId, `Focus target missing: ${selector}`);
      await evaluate(`document.querySelector(${JSON.stringify(selector)}).focus()`);
      await call('CSS.forcePseudoState', {
        nodeId,
        forcedPseudoClasses: ['focus', 'focus-visible'],
      });
      try {
        const state = await evaluate(
          `(()=>{const element=document.querySelector(${JSON.stringify(selector)}),style=getComputedStyle(element);return {active:document.activeElement===element,outlineStyle:style.outlineStyle,outlineWidth:parseFloat(style.outlineWidth),outlineColor:style.outlineColor}})()`,
        );
        assert.equal(state.active, true, `The focus target remains operable: ${selector}`);
        assertStyle(state);
      } finally {
        await call('CSS.forcePseudoState', { nodeId, forcedPseudoClasses: [] });
      }
    };
    const noPageFrame = async (context) => {
      assert.equal(
        await evaluate('document.activeElement === document.querySelector("main#main")'),
        true,
        `${context}: navigation retains landmark focus`,
      );
      await focusStyle('main#main', (state) => {
        assert.equal(state.outlineStyle, 'none', `${context}: no outline around the page landmark`);
        // Chrome can report the nominal medium width even when outline-style:none paints no ring.
      });
    };
    const visibleRing = (selector) =>
      focusStyle(selector, (state) => {
        assert.notEqual(
          state.outlineStyle,
          'none',
          `${selector} retains its visible focus indicator`,
        );
        assert.ok(state.outlineWidth >= 2, `${selector} retains a substantial focus indicator`);
        assert.notEqual(
          state.outlineColor,
          'rgba(0, 0, 0, 0)',
          `${selector} focus indicator is not transparent`,
        );
      });

    await noPageFrame('Login return');
    await navigate(await evaluate('location.href'));
    await waitFor(
      '!!document.querySelector("vacate-my-leave") && document.activeElement === document.querySelector("main#main")',
    );
    await noPageFrame('Reload');
    await click('[data-nav=calendar]');
    await waitFor(
      'document.querySelector("#calendar-page")?.hidden === false && document.activeElement === document.querySelector("main#main")',
    );
    await noPageFrame('Page navigation');

    await visibleRing('[data-action=request]');
    await visibleRing('a.skip');
    const beforeSkip = await evaluate('location.pathname + location.search');
    await click('a.skip');
    await noPageFrame('Skip link');
    assert.equal(
      await evaluate('location.pathname + location.search'),
      beforeSkip,
      'Skip link preserves the current page and calendar state',
    );

    const dateSelector = '.month-table-wrap button.day-number[data-date]';
    await waitFor(`!!document.querySelector(${JSON.stringify(dateSelector)})`);
    // A negative tab index must not disable the ring for programmatically focused calendar controls.
    const previousTabindex = await evaluate(
      `(()=>{const button=document.querySelector(${JSON.stringify(dateSelector)});const previous=button.getAttribute('tabindex');button.setAttribute('tabindex','-1');return previous})()`,
    );
    try {
      await visibleRing(dateSelector);
    } finally {
      await evaluate(
        `(()=>{const button=document.querySelector(${JSON.stringify(dateSelector)});${previousTabindex === null ? "button.removeAttribute('tabindex')" : `button.setAttribute('tabindex',${JSON.stringify(previousTabindex)})`}})()`,
      );
    }

    for (const width of [1440, 375, 320]) {
      await viewport(width, 1100);
      await evaluate('document.querySelector("main#main").focus()');
      await noPageFrame(`Viewport ${width}`);
      await screenshot(`page-focus-main-${width}.png`);
      await visibleRing('[data-action=request]');
    }
    await viewport(1440, 1100);
    const adminLogin = new URL('/login.html', baseUrl);
    adminLogin.searchParams.set('returnUrl', '/index.html?page=people');
    const signInAdmin = async () => {
      await evaluate('sessionStorage.clear()');
      await navigate(adminLogin.href);
      await waitFor('!!document.querySelector("#login-form")');
      await evaluate(
        `document.querySelector('#username').value='nora';document.querySelector('#password').value='nora';document.querySelector('#login-form').requestSubmit()`,
      );
      await captureTicket();
      await waitFor(
        '!!document.querySelector("vacate-people section[aria-label]") && document.querySelector("main h1")?.textContent.includes("People") && document.activeElement === document.querySelector("main#main")',
      );
    };
    await signInAdmin();
    await noPageFrame('Administrator login return');

    const openSystem = async () => {
      await click('[data-nav=settings]');
      await waitFor('!!document.querySelector("[data-settings-section=system]")');
      await click('[data-settings-section=system]');
      await waitFor('!!document.querySelector("#display-preferences-form")');
    };
    const setPalette = async (palette) => {
      await evaluate(
        `(()=>{const input=document.querySelector('#display-color-scheme');input.value=${JSON.stringify(palette)};input.dispatchEvent(new Event('change',{bubbles:true}))})()`,
      );
      await click('#display-preferences-form button[type=submit]');
      await waitFor(
        `document.querySelector('.app')?.dataset.colorScheme === ${JSON.stringify(palette)}`,
      );
    };
    await openSystem();
    const previousPalette = await evaluate('document.querySelector("#display-color-scheme").value');
    try {
      await setPalette('c');
      await signInAdmin();
      assert.equal(
        await evaluate('document.querySelector(".app").dataset.colorScheme'),
        'c',
        'Warm brown palette persists after login',
      );
      await noPageFrame('Administrator warm brown login return');
      for (const width of [1440, 375, 320]) {
        await viewport(width, 1100);
        await click('[data-nav=people]');
        await waitFor(
          '!!document.querySelector("vacate-people section[aria-label]") && document.querySelector("main h1")?.textContent.includes("People") && document.activeElement === document.querySelector("main#main")',
        );
        await noPageFrame(`Administrator People / warm brown / ${width}`);
        await navigate(await evaluate('location.href'));
        await waitFor(
          '!!document.querySelector("vacate-people section[aria-label]") && document.querySelector("main h1")?.textContent.includes("People") && document.activeElement === document.querySelector("main#main")',
        );
        assert.equal(
          await evaluate('document.querySelector(".app").dataset.colorScheme'),
          'c',
          'Warm brown palette persists on reload',
        );
        await noPageFrame(`Administrator People reload / warm brown / ${width}`);
        await waitFor('!!document.querySelector(".people-table [data-edit-membership]")');
        await screenshot(`page-focus-admin-people-brown-${width}.png`);
        await visibleRing('.people-table [data-edit-membership]');
        await click('[data-nav=settings]');
        await waitFor(
          '!!document.querySelector("vacate-unified-settings") && document.activeElement === document.querySelector("main#main")',
        );
        await noPageFrame(`Administrator Settings / warm brown / ${width}`);
        await screenshot(`page-focus-admin-settings-brown-${width}.png`);
      }
    } finally {
      try {
        await openSystem();
        await setPalette(previousPalette);
      } catch (error) {
        cleanupErrors.push(
          new Error('The previous administrator palette could not be restored.', { cause: error }),
        );
      }
    }
    assert.deepEqual(errors, [], 'Unexpected page focus browser exceptions');
  } catch (error) {
    primaryError = error;
  } finally {
    try {
      const current = await evaluate('sessionStorage.getItem("vacate.session.token")');
      if (current) tickets.add(current);
    } catch (error) {
      cleanupErrors.push(
        new Error('The final browser session could not be inspected for teardown.', {
          cause: error,
        }),
      );
    }
    const sessionUrl = new URL('/api/auth/sessions/current', baseUrl);
    for (const ticket of tickets) {
      // Attempt both operations and every captured ticket even if an earlier cleanup fails.
      for (const method of ['DELETE', 'GET']) {
        try {
          const response = await fetch(sessionUrl, {
            method,
            signal: AbortSignal.timeout(10000),
            headers: { Authorization: `Bearer ${ticket}` },
          });
          if (method === 'DELETE') {
            assert.ok(
              [204, 401].includes(response.status),
              'The fictional focus-test session is revoked',
            );
          } else {
            assert.equal(response.status, 401, 'Revoked focus-test sessions cannot authenticate');
          }
        } catch (error) {
          cleanupErrors.push(
            new Error(`Focus-test session teardown ${method} failed.`, { cause: error }),
          );
        }
      }
    }
  }
  if (primaryError && cleanupErrors.length) {
    throw new AggregateError(
      [primaryError, ...cleanupErrors],
      'Page focus acceptance and teardown failed.',
      { cause: primaryError },
    );
  }
  if (primaryError) throw primaryError;
  if (cleanupErrors.length)
    throw new AggregateError(cleanupErrors, 'Page focus acceptance teardown failed.');
  console.log(
    'PASS: login return, reload, navigation and skip links retain landmark focus without a page frame; interactive and negative-tabindex calendar controls retain visible focus. Administrator People/reload/Settings also verified in warm brown at desktop/mobile sizes, restoring the previous palette and verifying all captured test sessions are revoked. Forced CSS pseudo states are functional style probes, not native keyboard or assistive-technology evidence.',
  );
}
