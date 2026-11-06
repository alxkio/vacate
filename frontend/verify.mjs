// Browser acceptance checks and reproducible screenshots. Node.js 22+, local Chrome.
import { spawn } from 'node:child_process';
import { mkdtemp, mkdir, writeFile, readFile, rm } from 'node:fs/promises';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
import { waitForChromeEndpoint } from './testing/chrome-startup.mjs';
const root = dirname(fileURLToPath(import.meta.url));
const profile = await mkdtemp(join(tmpdir(), 'vacate-mock-qa-'));
const output = process.env.MOCK_SCREENSHOT_DIR || join(root, 'previews');
await mkdir(output, { recursive: true });
let server;
let baseUrl = process.env.MOCK_URL;
if (!baseUrl) {
  const dist = resolve(process.env.MOCK_DIST || join(root, 'dist/vacate-web/browser'));
  server = createServer(async (request, response) => {
    if (request.url.startsWith('/api/')) {
      try {
        const chunks = [];
        for await (const chunk of request) chunks.push(chunk);
        const upstream = await fetch(
          (process.env.MOCK_API_URL || 'http://127.0.0.1:7071') + request.url,
          {
            method: request.method,
            headers: {
              ...(request.headers.authorization
                ? { Authorization: request.headers.authorization }
                : {}),
              'Content-Type': 'application/json',
            },
            ...(request.method === 'GET' || request.method === 'HEAD'
              ? {}
              : { body: Buffer.concat(chunks) }),
          },
        );
        response.writeHead(upstream.status, {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store',
        });
        response.end(Buffer.from(await upstream.arrayBuffer()));
      } catch {
        response
          .writeHead(502, { 'Content-Type': 'application/json' })
          .end('{"error":"Demo API unavailable"}');
      }
      return;
    }
    if (request.url === '/config.json') {
      response.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
      response.end(JSON.stringify({ apiBaseUrl: '/api', revision: 'api-browser-acceptance' }));
      return;
    }
    const name =
      decodeURIComponent(new URL(request.url, 'http://localhost').pathname).slice(1) ||
      'index.html';
    const file = resolve(dist, name);
    if (!file.startsWith(dist + '/')) {
      response.writeHead(404).end();
      return;
    }
    try {
      let body;
      try {
        body = await readFile(file);
      } catch {
        if (name.includes('.') && !name.endsWith('.html')) throw Error('Asset missing');
        body = await readFile(join(dist, 'index.html'));
      }
      const type = name.endsWith('.css')
        ? 'text/css'
        : name.endsWith('.svg')
          ? 'image/svg+xml'
          : name.endsWith('.js')
            ? 'text/javascript'
            : name.endsWith('.json')
              ? 'application/json'
              : 'text/html';
      response.writeHead(200, { 'Content-Type': type, 'Cache-Control': 'no-store' });
      response.end(body);
    } catch {
      response.writeHead(404).end();
    }
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}/index.html`;
}
const chrome = spawn(
  process.env.CHROME_BIN || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  [
    ...(process.env.MOCK_HEADFUL === '1' ? [] : ['--headless']),
    // Suppress browser-owned prompts, including password-save UI after fixture sign-in.
    '--enable-automation',
    '--allow-pre-commit-input',
    '--disable-gpu',
    '--disable-background-networking',
    '--no-first-run',
    '--disable-renderer-backgrounding',
    '--disable-backgrounding-occluded-windows',
    '--disable-background-timer-throttling',
    '--no-default-browser-check',
    '--disable-component-update',
    '--remote-debugging-port=0',
    '--window-size=1600,1250',
    ...(process.platform === 'linux' ? ['--no-sandbox'] : []),
    `--user-data-dir=${profile}`,
    'about:blank',
  ],
  { stdio: ['ignore', 'ignore', 'pipe'] },
);
const chromeReady = waitForChromeEndpoint(chrome, { profile, output });
let socket,
  nextId = 0,
  frameSequence = 0;
const waiting = new Map(),
  errors = [];
const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const suiteTimeoutMs = Number(process.env.MOCK_SUITE_TIMEOUT_MS || 300000);
assert.ok(
  Number.isSafeInteger(suiteTimeoutMs) && suiteTimeoutMs >= 300000 && suiteTimeoutMs <= 1800000,
  'MOCK_SUITE_TIMEOUT_MS must be between five and thirty minutes',
);
const deadline = setTimeout(() => {
  for (const pending of waiting.values())
    pending.reject(Error('Browser suite exceeded its configured deadline'));
  waiting.clear();
  chrome.kill('SIGKILL');
  server?.close();
  process.exitCode = 1;
}, suiteTimeoutMs);
try {
  const endpoint = await chromeReady;
  const port = new URL(endpoint).port;
  const targets = await (await fetch(`http://127.0.0.1:${port}/json`)).json();
  socket = new WebSocket(targets.find((target) => target.type === 'page').webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    socket.onopen = resolve;
    socket.onerror = reject;
  });
  socket.onmessage = (message) => {
    const data = JSON.parse(message.data);
    if (data.id) {
      const pending = waiting.get(data.id);
      waiting.delete(data.id);
      data.error ? pending.reject(data.error) : pending.resolve(data.result);
    }
    if (
      data.method === 'Page.navigatedWithinDocument' ||
      (data.method === 'Page.frameNavigated' && !data.params.frame.parentId)
    )
      frameSequence++;
    if (data.method === 'Runtime.exceptionThrown')
      errors.push(
        data.params.exceptionDetails.exception?.description || data.params.exceptionDetails.text,
      );
  };
  const call = (method, params = {}) =>
    new Promise((resolve, reject) => {
      const id = ++nextId;
      const timer = setTimeout(() => {
        waiting.delete(id);
        reject(Error('Browser protocol timeout: ' + method));
      }, 20000);
      waiting.set(id, {
        resolve: (value) => {
          clearTimeout(timer);
          resolve(value);
        },
        reject: (error) => {
          clearTimeout(timer);
          reject(error);
        },
      });
      socket.send(JSON.stringify({ id, method, params }));
    });
  const evaluate = async (expression, userGesture = false) => {
    // Angular schedules template updates. Model distinct user changes across rendered frames.
    if (expression.includes('.dispatchEvent(new Event(')) {
      expression =
        '(async()=>{' +
        expression.replace(
          /\.dispatchEvent\(new Event\((["'])change\1\)\);/g,
          '$&await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));',
        ) +
        ';await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));})()';
    }
    let result;
    try {
      result = await call('Runtime.evaluate', {
        expression,
        returnByValue: true,
        awaitPromise: true,
        userGesture,
      });
    } catch (error) {
      throw Error(error.message + '; expression: ' + expression.slice(0, 180));
    }
    if (result.exceptionDetails) throw Error(JSON.stringify(result.exceptionDetails));
    return result.result.value;
  };
  // Synthetic UI clicks need the same activation context as real user input.
  const click = async (selector) => {
    await waitFor(`!!document.querySelector(${JSON.stringify(selector)})`);
    return selector.includes('logout')
      ? evaluate(`document.querySelector(${JSON.stringify(selector)}).click()`, true)
      : evaluate(
          `(async()=>{document.querySelector(${JSON.stringify(selector)}).click();await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));})()`,
          true,
        );
  };

  const prepareNativeFocus = async ({
    dispatch = call,
    timeoutMs = 5000,
    captureFailure = true,
  } = {}) => {
    const started = Date.now();
    let attempts = 0;
    try {
      do {
        attempts++;
        await dispatch('Page.bringToFront');
        const point = await evaluate(`(async()=>{
          window.__nativeFocusObserver?.abort();
          const observer = new AbortController();
          window.__nativeFocusObserver = observer;
          window.__nativeFocusReady = false;
          const state = window.__nativeFocus = {pointer:false, keyDown:false, keyUp:false, events:[]};
          const anchor = document.querySelector('dialog[open] h2')
            || document.querySelector('#account-dropdown strong')
            || document.querySelector('main h1');
          if (!anchor) throw Error('No inert focus anchor in the current document');
          anchor.scrollIntoView({block:'center', inline:'nearest', behavior:'instant'});
          await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
          const rect = anchor.getBoundingClientRect();
          const point = {x:rect.left + rect.width / 2, y:rect.top + rect.height / 2};
          const hit = document.elementFromPoint(point.x, point.y);
          state.anchor = anchor.tagName;
          state.hit = hit?.tagName;
          state.point = point;
          // Never let focus preparation activate a control or click through an overlay.
          if (!rect.width || !rect.height || !anchor.contains(hit)
            || hit.closest('button, a, input, select, textarea, [role="button"], [contenteditable="true"]')) return null;
          for (const type of ['pointerdown', 'keydown', 'keyup']) document.addEventListener(type, event => {
            state.events.push({type, key:event.key, trusted:event.isTrusted});
            if (type === 'pointerdown') state.pointer = event.isTrusted && anchor.contains(event.target);
            if (event.key === 'Shift' && type === 'keydown') state.keyDown = event.isTrusted;
            if (event.key === 'Shift' && type === 'keyup') state.keyUp = event.isTrusted;
          }, {capture:true, signal:observer.signal});
          return point;
        })()`);
        if (point) {
          await dispatch('Input.dispatchMouseEvent', { type: 'mouseMoved', ...point });
          await dispatch('Input.dispatchMouseEvent', {
            type: 'mousePressed',
            ...point,
            button: 'left',
            buttons: 1,
            clickCount: 1,
          });
          await dispatch('Input.dispatchMouseEvent', {
            type: 'mouseReleased',
            ...point,
            button: 'left',
            buttons: 0,
            clickCount: 1,
          });
          // A modifier probe proves the keyboard path without activating application UI.
          await dispatch('Input.dispatchKeyEvent', {
            type: 'rawKeyDown',
            key: 'Shift',
            code: 'ShiftLeft',
            windowsVirtualKeyCode: 16,
            modifiers: 8,
            location: 1,
          });
          await dispatch('Input.dispatchKeyEvent', {
            type: 'keyUp',
            key: 'Shift',
            code: 'ShiftLeft',
            windowsVirtualKeyCode: 16,
            modifiers: 0,
            location: 1,
          });
          if (
            await evaluate(`window.__nativeFocusReady = document.hasFocus()
              && window.__nativeFocus.pointer && window.__nativeFocus.keyDown && window.__nativeFocus.keyUp`)
          )
            return;
        }
        // Only inert readiness probes repeat. The subsequent application action runs once.
        await pause(100);
      } while (Date.now() - started < timeoutMs);
      const diagnostics = {
        attempts,
        elapsedMs: Date.now() - started,
        browser: browserVersion.product,
        node: process.version,
        platform: process.platform,
        headful: process.env.MOCK_HEADFUL === '1',
        ...(await evaluate(`({focused:document.hasFocus(), visibility:document.visibilityState,
              active:document.activeElement?.tagName, ...window.__nativeFocus})`)),
      };
      // Capture the failed state before closing Chrome; intentional rejection tests opt out.
      if (captureFailure) {
        try {
          const image = await call('Page.captureScreenshot', { format: 'png' });
          await writeFile(
            join(output, 'native-input-failure.png'),
            Buffer.from(image.data, 'base64'),
          );
        } catch (error) {
          diagnostics.screenshotError = error.message;
        }
        try {
          await writeFile(
            join(output, 'native-input-failure.json'),
            JSON.stringify(diagnostics, null, 2),
          );
        } catch (error) {
          diagnostics.artifactError = error.message;
        }
      }
      throw Error('Native input readiness failed: ' + JSON.stringify(diagnostics));
    } finally {
      await evaluate('window.__nativeFocusObserver?.abort()');
    }
  };

  const nativeFocusAcceptance = async () => {
    let attempts = 0;
    // Reproduce delayed input readiness without retrying the subsequent Enter action.
    await prepareNativeFocus({
      dispatch: async (method, params) => {
        if (method === 'Page.bringToFront') attempts++;
        if (attempts <= 3 && method.startsWith('Input.')) return {};
        return call(method, params);
      },
    });
    assert.ok(attempts >= 4, 'Readiness must recover from dropped preparation input');
    assert.equal(await evaluate('window.__nativeFocusReady'), true);

    // Neither a CDP success response nor scripted DOM events prove native delivery.
    for (const delivery of ['none', 'synthetic', 'pointer', 'keyboard']) {
      await assert.rejects(
        prepareNativeFocus({
          timeoutMs: 250,
          captureFailure: delivery === 'none',
          dispatch: async (method, params) => {
            if (!method.startsWith('Input.')) return call(method, params);
            if (delivery === 'pointer' && method === 'Input.dispatchMouseEvent')
              return call(method, params);
            if (delivery === 'keyboard' && method === 'Input.dispatchKeyEvent')
              return call(method, params);
            if (delivery === 'synthetic') {
              if (params.type === 'mousePressed') {
                await evaluate(
                  `document.querySelector('main h1').dispatchEvent(new PointerEvent('pointerdown', {bubbles:true}))`,
                );
              }
              if (method === 'Input.dispatchKeyEvent') {
                await evaluate(
                  `document.dispatchEvent(new KeyboardEvent(${JSON.stringify(params.type === 'keyUp' ? 'keyup' : 'keydown')}, {key:'Shift', bubbles:true}))`,
                );
              }
            }
            return {};
          },
        }),
        /Native input readiness failed:/,
      );
      assert.equal(await evaluate('window.__nativeFocusReady'), false);
      assert.deepEqual(
        await evaluate(
          '({pointer:window.__nativeFocus.pointer, keyDown:window.__nativeFocus.keyDown, keyUp:window.__nativeFocus.keyUp})',
        ),
        {
          pointer: delivery === 'pointer',
          keyDown: delivery === 'keyboard',
          keyUp: delivery === 'keyboard',
        },
        `Incomplete or untrusted ${delivery} delivery must not pass readiness`,
      );
      if (delivery === 'none') {
        const evidence = JSON.parse(
          await readFile(join(output, 'native-input-failure.json'), 'utf8'),
        );
        assert.equal(evidence.browser, browserVersion.product);
        assert.equal(evidence.node, process.version);
        assert.equal(evidence.pointer, false);
        assert.equal(evidence.keyDown, false);
        assert.equal(evidence.keyUp, false);
        const image = await readFile(join(output, 'native-input-failure.png'));
        assert.equal(image.subarray(1, 4).toString(), 'PNG');
        await rm(join(output, 'native-input-failure.json'));
        await rm(join(output, 'native-input-failure.png'));
      }
    }

    // An overlay must block preparation rather than receive a misplaced click.
    await evaluate(`(()=>{
      const blocker = document.createElement('button');
      blocker.id = 'native-focus-blocker';
      blocker.style.cssText = 'position:fixed;inset:0;z-index:2147483647';
      document.body.append(blocker);
    })()`);
    let blockedInput = 0;
    try {
      await assert.rejects(
        prepareNativeFocus({
          timeoutMs: 250,
          captureFailure: false,
          dispatch: async (method, params) => {
            if (method.startsWith('Input.')) blockedInput++;
            return call(method, params);
          },
        }),
        /Native input readiness failed:/,
      );
      assert.equal(blockedInput, 0, 'Preparation must not click an overlay');
    } finally {
      await evaluate('document.querySelector("#native-focus-blocker").remove()');
    }
    assert.equal(await evaluate('document.querySelector("#dialog").open'), false);
    console.log(
      'PASS: native readiness recovers dropped probes, rejects missing/untrusted input and refuses overlays',
    );
  };

  const keyboardClick = async (selector) => {
    await prepareNativeFocus();
    await evaluate(
      'new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)))',
    );
    // Dialog close handlers can restore focus on the next frame.
    await evaluate(`document.querySelector(${JSON.stringify(selector)}).focus()`);
    await waitFor(`document.activeElement === document.querySelector(${JSON.stringify(selector)})`);
    // Capture at the document so replacing an Angular button cannot detach the evidence listener.
    await evaluate(`(()=>{
      window.__keyboardObserver?.abort();
      const observer = new AbortController();
      window.__keyboardObserver = observer;
      window.__keyboardClick = false;
      window.__keyboardKeyTrusted = false;
      window.__keyboardEvents = [];
      for (const type of ['keydown', 'keyup', 'click']) document.addEventListener(type, event => {
        const target = event.target.closest?.(${JSON.stringify(selector)});
        window.__keyboardEvents.push({type, key:event.key, trusted:event.isTrusted, matches:!!target, detail:event.detail});
        if (target && type === 'keydown' && event.key === 'Enter') window.__keyboardKeyTrusted = event.isTrusted;
        if (target && type === 'click') window.__keyboardClick = event.isTrusted && event.detail === 0;
      }, {capture:true, signal:observer.signal});
    })()`);
    await call('Input.dispatchKeyEvent', {
      type: 'keyDown',
      key: 'Enter',
      code: 'Enter',
      windowsVirtualKeyCode: 13,
      text: '\r',
      unmodifiedText: '\r',
    });
    await call('Input.dispatchKeyEvent', {
      type: 'keyUp',
      key: 'Enter',
      code: 'Enter',
      windowsVirtualKeyCode: 13,
    });
    try {
      await waitFor('window.__keyboardKeyTrusted && window.__keyboardClick');
    } catch (error) {
      throw Error(
        error.message +
          '; ' +
          JSON.stringify(
            await evaluate(
              '({nativeFocusReady:window.__nativeFocusReady,events:window.__keyboardEvents,visibility:document.visibilityState,focused:document.hasFocus(),active:document.activeElement?.outerHTML.slice(0,250),dialog:document.querySelector("#dialog")?.open})',
            ),
          ),
      );
    }
    await evaluate(
      'new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)))',
    );
  };
  const waitFor = async (expression) => {
    for (let attempt = 0; attempt < 300; attempt++) {
      try {
        if (await evaluate(expression)) return;
      } catch (error) {
        // Full-document login/logout can destroy an evaluation context between protocol calls.
        if (
          !/^(Inspected target navigated or closed|Execution context was destroyed|Cannot find context)/.test(
            error.message,
          )
        )
          throw error;
      }
      await pause(100);
    }
    throw Error('Browser condition failed: ' + expression);
  };
  const navigate = async (url) => {
    await evaluate('window.__vacateNavigationMarker = true');
    const result = await call('Page.navigate', { url });
    if (result.errorText) throw Error(result.errorText);
    await waitFor('!window.__vacateNavigationMarker && document.readyState === "complete"');
  };
  const historyTo = async (target, label) => {
    // Replacement redirects can change CDP entry IDs; resolve from fresh full-document history.
    const history = await call('Page.getNavigationHistory');
    const entry = target.name
      ? history.entries.find(
          (item) => new URL(item.url).searchParams.get('history') === target.name,
        )
      : history.entries[history.currentIndex + target.delta];
    assert.ok(
      entry,
      `${label}: missing target ${JSON.stringify(target)}; history=${JSON.stringify(history)}`,
    );
    const previous = frameSequence;
    try {
      await call('Page.navigateToHistoryEntry', { entryId: entry.id });
    } catch (error) {
      throw Error(
        `${label}: ${JSON.stringify(error)}; target=${JSON.stringify(entry)}; current history=${JSON.stringify(await call('Page.getNavigationHistory'))}`,
      );
    }
    for (let attempt = 0; attempt < 300 && frameSequence === previous; attempt++) await pause(100);
    assert.ok(frameSequence > previous, `${label}: history navigation did not occur`);
  };
  const load = async (query) => {
    await navigate(baseUrl + query);
    await waitFor(
      'document.readyState === "complete" && !!document.querySelector("#period")?.textContent',
    );
  };
  const saveDisplayPreferences = async (layout, colorScheme) => {
    await click('[data-nav=settings]');
    await waitFor('!!document.querySelector("[data-settings-section=system]")');
    await click('[data-settings-section=system]');
    await waitFor('!!document.querySelector("#display-preferences-form")');
    await evaluate(
      `(()=>{const layout=document.querySelector("#display-layout"),scheme=document.querySelector("#display-color-scheme");layout.value=${JSON.stringify(layout)};layout.dispatchEvent(new Event("change",{bubbles:true}));scheme.value=${JSON.stringify(colorScheme)};scheme.dispatchEvent(new Event("change",{bubbles:true}));})()`,
    );
    await click('#display-preferences-form button[type="submit"]');
    await waitFor(
      'document.querySelector("#display-preferences-status").textContent.includes("saved in this browser")',
    );
    const previousViewport = await evaluate('({width:innerWidth, height:innerHeight})');
    await viewport(375, 1100);
    assert.equal(
      await evaluate('document.documentElement.scrollWidth <= innerWidth'),
      true,
      'System settings mobile overflow',
    );
    assert.equal(
      await evaluate('!!document.querySelector("#profile-form, .membership-card")'),
      false,
    );
    await screenshot(`system-settings-${layout}-${colorScheme}-mobile.png`);
    await viewport(previousViewport.width, previousViewport.height);
    await click('[data-nav=calendar]');
    await waitFor('document.querySelector("#calendar-page")?.hidden === false');
  };
  const viewport = (width, height) =>
    call('Emulation.setDeviceMetricsOverride', {
      width,
      height,
      deviceScaleFactor: 1,
      mobile: false,
    });
  const screenshot = async (name) => {
    await pause(350);
    const result = await call('Page.captureScreenshot', {
      format: 'png',
      captureBeyondViewport: false,
    });
    await writeFile(join(output, name), Buffer.from(result.data, 'base64'));
  };
  await call('Runtime.enable');
  await call('Page.enable');
  const runtimeConfig = await (await fetch(new URL('/config.json', baseUrl))).json();
  assert.equal(typeof runtimeConfig.apiBaseUrl, 'string');
  await call('Page.addScriptToEvaluateOnNewDocument', {
    source: `window.__vacateAcceptanceApiBase = ${JSON.stringify(runtimeConfig.apiBaseUrl.replace(/\/+$/, ''))}`,
  });
  const browserVersion = await call('Browser.getVersion');
  console.log(
    `Browser acceptance: ${browserVersion.product}; Node ${process.version}; ${process.platform}`,
  );
  if (process.env.MOCK_CPU_THROTTLE) {
    const rate = Number(process.env.MOCK_CPU_THROTTLE);
    assert.ok(Number.isFinite(rate) && rate >= 1, 'MOCK_CPU_THROTTLE must be at least 1');
    await call('Emulation.setCPUThrottlingRate', { rate });
  }
  await call('Page.bringToFront');
  await viewport(1600, 1250);
  await navigate(baseUrl);
  await waitFor('document.readyState === "complete" && !!document.querySelector("#login-form")');
  await screenshot('login-desktop.png');
  await viewport(375, 1100);
  await screenshot('login-mobile.png');
  assert.equal(
    await evaluate('document.documentElement.scrollWidth <= innerWidth'),
    true,
    'Login overflows on mobile',
  );
  await viewport(1600, 1250);
  const loginPersonas = [
    ['maya', 'Employee'],
    ['leah', 'Team lead'],
    ['ella', 'Department lead'],
    ['nora', 'Organization admin'],
  ];
  assert.deepEqual(
    await evaluate(
      'Array.from(document.querySelectorAll("#demo-account option")).filter(option=>option.value).map(option=>option.value)',
    ),
    loginPersonas.map(([id]) => id),
    'Exactly one advertised login per review persona',
  );
  for (const [id, label] of loginPersonas) {
    await evaluate(
      `document.querySelector('#demo-account').value=${JSON.stringify(id)};document.querySelector('#demo-account').dispatchEvent(new Event('change'))`,
    );
    assert.equal(await evaluate('document.querySelector("#username").value'), id);
    assert.equal(await evaluate('document.querySelector("#password").value'), id);
    assert.ok(
      (await evaluate('document.querySelector("#persona-description").textContent')).includes(
        label,
      ),
    );
  }
  assert.equal(
    await evaluate('window.VacateFixtures.people.length'),
    12,
    'Retain the full fictional roster',
  );
  const signIn = async (username, password) => {
    await waitFor('document.readyState === "complete" && !!document.querySelector("#login-form")');
    await evaluate(
      `document.querySelector('#username').value=${JSON.stringify(username)};document.querySelector('#password').value=${JSON.stringify(password)};document.querySelector('#login-form').requestSubmit()`,
    );
  };
  await signIn('user', 'admin');
  await waitFor('!document.querySelector("#login-error").hidden');
  assert.equal(await evaluate('window.VacateSession.currentUser()'), null);
  const ready = () =>
    waitFor(
      'document.readyState === "complete" && !!document.querySelector("#period")?.textContent && !document.querySelector("#login-form")',
    );
  const signOut = async () => {
    if (await evaluate('document.querySelector("#dialog")?.open === true')) await closeDialog();
    if (!(await evaluate('!!document.querySelector("[data-action=logout]")')))
      await click('[data-action=account]');
    await waitFor('!!document.querySelector("[data-action=logout]")');
    await click('[data-action="logout"]');
    await waitFor('document.readyState === "complete" && !!document.querySelector("#login-form")');
  };
  const closeDialog = async () => {
    await evaluate('document.querySelector("#dialog").close()');
    await waitFor('!document.querySelector("#dialog").open');
  };
  const baseShortlist = [
    'annual',
    'sick',
    'maternity',
    'paternity',
    'childcare',
    'parental',
    'school',
    'dependent-illness',
    'child-hospitalization',
    'marriage',
    'voting',
    'study',
  ];
  // Independent expected outcomes; do not calculate expected visibility through the implementation facade.
  const blockedShortlist = {
    maya: ['marriage', 'paternity'],
    leah: ['marriage', 'paternity'],
    daria: ['marriage', 'paternity'],
    ravi: ['maternity', 'marriage'],
    nora: ['paternity'],
    noah: [
      'maternity',
      'childcare',
      'parental',
      'school',
      'dependent-illness',
      'child-hospitalization',
      'marriage',
    ],
    theo: ['maternity'],
    iris: [
      'paternity',
      'childcare',
      'parental',
      'school',
      'dependent-illness',
      'child-hospitalization',
    ],
    zoe: [
      'paternity',
      'childcare',
      'parental',
      'school',
      'dependent-illness',
      'child-hospitalization',
    ],
    owen: [
      'maternity',
      'childcare',
      'parental',
      'school',
      'dependent-illness',
      'child-hospitalization',
    ],
    sam: [
      'maternity',
      'childcare',
      'parental',
      'school',
      'dependent-illness',
      'child-hospitalization',
    ],
    // Founder-confirmed unknown family values normalize to false/0 in the API profile.
    ella: ['childcare', 'parental', 'school', 'dependent-illness', 'child-hospitalization'],
  };
  const expectedVisible = (id) =>
    baseShortlist.filter((type) => !blockedShortlist[id].includes(type));
  const parentAccounts = new Set(['leah', 'ravi', 'maya', 'theo', 'daria', 'nora']);
  const balanceGroupOrder = [
    ['maternity', 'paternity', 'childcare', 'parental', 'school'],
    ['dependent-illness', 'child-hospitalization'],
    ['marriage'],
    ['voting'],
    ['study'],
  ];
  const expectedBalanceTypes = (id) => {
    const visible = expectedVisible(id);
    const promoted = [
      'annual',
      ...(parentAccounts.has(id) ? ['school', 'childcare', 'parental'] : []),
    ].filter((type) => visible.includes(type));
    const deferred = ['sick', 'maternity', 'paternity', 'voting', 'military'].filter((type) =>
      visible.includes(type),
    );
    const separated = new Set([...promoted, ...deferred]);
    const regular = visible.filter((type) => !separated.has(type));
    const grouped = balanceGroupOrder.flatMap((group) =>
      group.filter((type) => regular.includes(type)),
    );
    return [...promoted, ...grouped, ...deferred];
  };
  const expectedShortlist = expectedVisible('maya');
  const mayaBalanceTypes = expectedBalanceTypes('maya');
  const requestTypes = () =>
    evaluate('Array.from(document.querySelector("#leave-type").options).map(option=>option.value)');
  const balanceTypes = () =>
    evaluate(
      'Array.from(document.querySelectorAll("[data-balance]")).map(item=>item.dataset.balance)',
    );
  const leaveRequestAcceptance = async () => {
    await load('?scope=self&view=month');
    await click('[data-action=request]');
    await waitFor('!!document.querySelector("#request-form")');
    const set = async (selector, value, event = 'input') => {
      await evaluate(
        `(async()=>{const input=document.querySelector(${JSON.stringify(selector)});input.value=${JSON.stringify(value)};input.dispatchEvent(new Event(${JSON.stringify(event)},{bubbles:true}));await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));})()`,
      );
    };
    const previewReady = () =>
      waitFor(
        'document.querySelector("#request-preview")?.getAttribute("aria-busy") === "false" && !!document.querySelector("#request-amount-preview")',
      );
    await click('#request-type-toggle');
    for (const deniedType of ['marriage', 'disability-supplement']) {
      await set('#leave-type', deniedType, 'change');
      await waitFor(
        'document.querySelector("#request-preview")?.getAttribute("aria-busy") === "false"',
      );
      await evaluate(
        'document.querySelector("#request-form button[type=submit]").disabled=false;document.querySelector("#request-form").requestSubmit()',
      );
      assert.equal(
        await evaluate('!!document.querySelector("#request-form")'),
        true,
        'Forged unavailable selection must not submit',
      );
      assert.equal(await evaluate('!!document.querySelector("#finish-demo")'), false);
    }
    await set('#leave-type', 'annual', 'change');
    await click('#request-type-toggle');
    await set('#start-date', '2026-02-01');
    await set('#end-date', '2026-02-03');
    await previewReady();
    assert.match(
      await evaluate('document.querySelector("#request-amount-preview").textContent'),
      /2 working days/,
    );
    assert.match(
      await evaluate('document.querySelector("#request-preview").textContent'),
      /Non-working/,
    );
    assert.match(await evaluate('document.querySelector("#request-balance").textContent'), /2026/);
    assert.doesNotMatch(
      await evaluate('document.querySelector("#request-balance").textContent'),
      /Sick|Parental/,
    );
    await set('#request-mode', 'duration', 'change');
    await set('#request-amount', '2');
    await previewReady();
    assert.match(
      await evaluate('document.querySelector("#request-amount-preview").textContent'),
      /2026-02-03/,
    );
    await set('#request-unit', 'hours', 'change');
    assert.equal(await evaluate('!!document.querySelector("#end-date")'), false);
    assert.equal(await evaluate('!!document.querySelector("#request-amount")'), false);
    assert.equal(
      await evaluate('document.querySelector("#request-form button[type=submit]").disabled'),
      true,
    );
    assert.match(
      await evaluate('document.querySelector("#request-hourly-notice").textContent'),
      /not available/,
    );
    await set('#request-unit', 'working days', 'change');
    await set('#request-amount', '100');
    await previewReady();
    assert.match(
      await evaluate('document.querySelector("#request-preview").textContent'),
      /negative balance/,
    );
    assert.equal(
      await evaluate('document.querySelector("#request-form button[type=submit]").disabled'),
      true,
    );
    await set('#request-amount', '2');
    await set('#start-date', '2027-06-01');
    await previewReady();
    assert.match(
      await evaluate('document.querySelector("#request-preview").textContent'),
      /No finite|No configured/,
    );
    assert.equal(
      await evaluate('document.querySelector("#request-form button[type=submit]").disabled'),
      true,
    );
    await set('#start-date', '2026-02-01');
    await set('#request-mode', 'range', 'change');
    await set('#end-date', '2026-02-01');
    await previewReady();
    assert.equal(
      await evaluate('document.querySelector("#request-form button[type=submit]").disabled'),
      true,
    );
    await set('#end-date', '2026-02-03');
    await previewReady();
    await waitFor('!document.querySelector("#request-form button[type=submit]").disabled');
    await click('#request-form button[type=submit]');
    await waitFor('!!document.querySelector("#finish-demo")');
    assert.match(
      await evaluate('document.querySelector("#dialog-content").textContent'),
      /saved|already covered/i,
    );
    await click('#finish-demo');
    await click('[data-action=request]');
    await set('#start-date', '2026-02-01');
    await set('#end-date', '2026-02-03');
    await previewReady();
    assert.match(
      await evaluate('document.querySelector("#request-preview").textContent'),
      /All selected working days already/,
    );
    await click('#request-form button[type=submit]');
    await waitFor('!!document.querySelector("#finish-demo")');
    assert.match(
      await evaluate('document.querySelector("#dialog-content").textContent'),
      /No additional request/,
    );
    await click('#finish-demo');
    await load('?scope=self&view=month&date=2026-02-01');
    await waitFor('document.querySelectorAll(\'[data-event^="saved:"]\').length >= 2');
    assert.equal(
      await evaluate('!!document.querySelector(\'[data-event$=":2026-02-01"]\')'),
      false,
      'Excluded Sunday must not appear as saved leave',
    );
    assert.equal(await evaluate('!!document.querySelector(\'[data-event$=":2026-02-02"]\')'), true);
    assert.equal(await evaluate('!!document.querySelector(\'[data-event$=":2026-02-03"]\')'), true);
    await click('[data-nav=leave]');
    await waitFor('!!document.querySelector("#saved-leave-requests [data-saved-request]")');
    assert.match(
      await evaluate('document.querySelector("#saved-leave-requests").textContent'),
      /2026-02-02/,
    );
    assert.doesNotMatch(
      await evaluate('document.querySelector("#saved-leave-requests").textContent'),
      /2026-02-01/,
    );
    await load('?scope=self&view=month&date=2026-10-22');
    console.log(
      'PASS: real leave preview, inclusive dates, Sunday exclusion, duration, disabled hours, negative and unknown balances, zero days, save, persisted calendar/history and fully covered acknowledgement.',
    );
  };
  const organizationAcceptance = async () => {
    // VAC-2 organization configuration, renames, scoped access and reset.
    await signOut();
    await signIn('nora', 'nora');
    await ready();
    const ledgerBefore = await evaluate(
      'JSON.stringify(window.VacateFixtures.balancesFor(window.VacateSession.currentUser()))',
    );
    await click('[data-nav=settings]');
    await click('[data-settings-section=organization]');
    await waitFor('!!document.querySelector("#organization-form")');
    assert.equal(await evaluate('document.querySelectorAll("[data-org-department]").length'), 2);
    assert.equal(await evaluate('document.querySelectorAll("[data-org-team]").length'), 4);
    await evaluate(
      'document.querySelector("#organization-name").value=" ";document.querySelector("#organization-name").dispatchEvent(new Event("input"))',
    );
    await click('#organization-form button[type=submit]');
    await waitFor('document.querySelector("#organization-error")?.textContent.includes("name")');
    await click('#organization-form button[type=button]');
    assert.equal(
      await evaluate('document.querySelector("#organization-name").value'),
      'Northstar Example',
    );
    await evaluate(
      'document.querySelector("#organization-name").value="Northstar Studio";document.querySelector("#organization-name").dispatchEvent(new Event("input"));document.querySelector("#organization-week-6").click()',
    );
    await click('#organization-form button[type=submit]');
    await waitFor(
      'document.querySelector("#organization-status")?.textContent.includes("Updated")',
    );
    assert.match(
      await evaluate('document.querySelector("#organization-name").value'),
      /Northstar Studio/,
    );
    assert.equal(
      await evaluate('window.VacateLeave.workWeekDays'),
      5,
      'Do not invent six-day legal calculations',
    );
    assert.equal(
      await evaluate(
        'JSON.stringify(window.VacateFixtures.balancesFor(window.VacateSession.currentUser()))',
      ),
      ledgerBefore,
    );
    await screenshot('organization-desktop.png');
    await click('[data-org-department=technology]');
    await evaluate(
      'document.querySelector("#org-node-name").value="Engineering";document.querySelector("#org-node-name").dispatchEvent(new Event("input"))',
    );
    await click('#org-rename-form button[type=submit]');
    await waitFor(
      'document.querySelector("#org-view-heading")?.textContent.trim()==="Engineering"',
    );
    await click('[data-org-team=platform]');
    assert.equal(await evaluate('document.querySelectorAll(".org-members li").length'), 3);
    assert.doesNotMatch(
      await evaluate('document.querySelector(".org-members").textContent'),
      /married|children|sole care|Pending|Approved|balance/i,
    );
    await evaluate(
      'document.querySelector("#org-node-name").value="Core Platform";document.querySelector("#org-node-name").dispatchEvent(new Event("input"))',
    );
    await click('#org-rename-form button[type=submit]');
    await waitFor(
      'document.querySelector("#org-view-heading")?.textContent.trim()==="Core Platform"',
    );
    await screenshot('organization-team-desktop.png');
    await click('.org-breadcrumb button:first-child');
    assert.equal(
      await evaluate(
        'document.querySelector("[data-org-department=technology]").textContent.includes("Engineering")',
      ),
      true,
    );
    assert.equal(
      await evaluate(
        'document.querySelector("[data-org-team=platform]").textContent.includes("Core Platform")',
      ),
      true,
    );
    await viewport(375, 1100);
    assert.equal(await evaluate('document.documentElement.scrollWidth<=innerWidth'), true);
    await screenshot('organization-mobile.png');
    await click('[data-org-team=platform]');
    assert.equal(await evaluate('document.documentElement.scrollWidth<=innerWidth'), true);
    await screenshot('organization-team-mobile.png');
    await viewport(1600, 1250);
    await click('[data-nav=settings]');
    await waitFor('!!document.querySelector("#profile-form")');
    assert.match(
      await evaluate('document.querySelector(".membership-card").textContent'),
      /Northstar Studio/,
    );
    assert.match(
      await evaluate('document.querySelector(".membership-card").textContent'),
      /6 days per week/,
    );
    await navigate(baseUrl + '?page=organization&company=foreign');
    await waitFor('!!document.querySelector("#organization-denied")');
    assert.equal(
      await evaluate('document.querySelectorAll("#organization-form,[data-org-team]").length'),
      0,
    );
    await navigate(baseUrl + '?page=organization');
    await waitFor('!!document.querySelector("#organization-form")');
    assert.equal(
      await evaluate('document.querySelector("#organization-name").value'),
      'Northstar Studio',
      'Reload retains API organization settings',
    );
    assert.equal(await evaluate('document.querySelector("#organization-week-6").checked'), true);
    // Employee management belongs to People.
    await click('[data-nav=people]');
    await waitFor('!!document.querySelector(".org-membership-roster")');
    // Membership editor saves through the API and the API response refreshes the page.
    await click('[data-edit-membership=maya]');
    await waitFor('!!document.querySelector("#membership-form")');
    await evaluate(
      'document.querySelector("#membership-form [name=priorService]").value="3.5";document.querySelector("#membership-form [name=priorService]").dispatchEvent(new Event("input"))',
    );
    await click('#membership-form button[type=submit]');
    await waitFor('!document.querySelector("#membership-form")');
    await navigate(baseUrl + '?page=people');
    await waitFor('!!document.querySelector(".org-membership-roster")');
    await click('[data-edit-membership=maya]');
    await waitFor('!!document.querySelector("#membership-form")');
    assert.equal(
      await evaluate('document.querySelector("#membership-form [name=priorService]").value'),
      '3.5',
      'Membership edit survives a new API read on reload',
    );
    await evaluate('document.querySelector("#membership-form").scrollIntoView({block:"start"})');
    await screenshot('membership-admin-desktop.png');
    await viewport(375, 1100);
    await evaluate('document.querySelector("#membership-form").scrollIntoView({block:"start"})');
    assert.equal(
      await evaluate('document.documentElement.scrollWidth<=innerWidth'),
      true,
      'Membership editor mobile overflow',
    );
    await screenshot('membership-admin-mobile.png');
    await click('#membership-form button[type=button]');
    await viewport(1600, 1250);

    await evaluate(
      '(async()=>{const headers={"Content-Type":"application/json",Authorization:"Bearer "+sessionStorage.getItem("vacate.session.token")};for(const [path,body] of [["",{name:"Northstar Example",workWeekDays:5}],["/departments/20000000-0000-4000-8000-000000000300",{name:"Technology"}],["/teams/20000000-0000-4000-8000-000000000400",{name:"Platform"}],["/memberships/20000000-0000-4000-8000-000000000004",{priorService:null}]]){const response=await fetch(window.__vacateAcceptanceApiBase+"/organizations/20000000-0000-4000-8000-000000000100"+path,{method:"PATCH",headers,body:JSON.stringify(body)});if(!response.ok)throw Error("Restore failed");}})()',
    );
    await signOut();
    await signIn('maya', 'maya');
    await ready();
    await navigate(baseUrl + '?page=organization');
    await waitFor('!!document.querySelector("#profile-form")');
    assert.equal(await evaluate('!!document.querySelector("vacate-organization")'), false);
    assert.equal(
      await evaluate(
        'document.querySelectorAll("#organization-form,[data-org-department],[data-org-team]").length',
      ),
      0,
    );
    console.log(
      'PASS: VAC-2 organization settings, company/week edits, cancel/validation, department/team renames, sanitized members, unchanged ledgers, mobile, foreign IDs, retained edits, admin membership HTTP save/reload and mobile.',
    );
  };
  const accountHistoryAcceptance = async () => {
    await signIn('user', 'user');
    await ready();
    await navigate(baseUrl);
    await ready();
    // Real browser Back/Forward traversal, including BFCache where Chrome chooses it.
    // Separate document loads keep untouched private pages in history while logout replaces only its target.
    for (const name of ['maya-one', 'maya-two', 'logout-target']) {
      await load('?history=' + name);
      await click('[data-scope="team"]');
      await click('[data-action="request"]');
      await evaluate('document.querySelector("#start-date").value="2026-11-01"');
    }
    await signOut();
    await historyTo({ name: 'maya-two' }, 'Back after logout');
    await waitFor('document.readyState === "complete" && !!document.querySelector("#login-form")');
    assert.equal(
      await evaluate('window.VacateSession.currentUser()'),
      null,
      'Back after logout restored identity',
    );
    assert.equal(
      await evaluate('!!document.querySelector("#request-form")'),
      false,
      'Back after logout restored private draft',
    );
    await historyTo({ delta: 1 }, 'Forward after logout');
    await waitFor('document.readyState === "complete" && !!document.querySelector("#login-form")');
    assert.equal(
      await evaluate('window.VacateSession.currentUser()'),
      null,
      'Forward after logout restored identity',
    );
    await signIn('nora', 'nora');
    await ready();
    await historyTo({ name: 'maya-one' }, 'Back after account switch');
    await waitFor(
      'document.querySelector("[data-action=account]")?.getAttribute("aria-label") === "Nora Example, account options"',
    );
    await ready();
    assert.equal(
      await evaluate('window.VacateSession.currentUser().id'),
      'nora',
      'History restored prior account after switch',
    );
    assert.equal(
      await evaluate('document.querySelector("[data-action=account]").getAttribute("aria-label")'),
      'Nora Example, account options',
    );
    assert.equal(
      await evaluate('document.querySelector("#dialog").open'),
      false,
      'History restored prior dialog after switch',
    );
    assert.equal(
      await evaluate('document.querySelector("[data-scope=org]").getAttribute("aria-pressed")'),
      'true',
      'History retained prior account scope',
    );
    await click('[data-action="request"]');
    assert.equal(
      await evaluate(
        'document.querySelector("#end-date").value === document.querySelector("#start-date").value',
      ),
      true,
      'History restored draft after switch',
    );
    await closeDialog();
    console.log('PASS: logout and account-switch Back/Forward navigation');
    await signOut();
  };
  const historyAcceptance = async () => {
    await signIn('user', 'user');
    await ready();
    await load('?scope=team&view=week&date=2026-11-05');
    const retainedPeriod = '2 Nov – 8 Nov 2026';
    const waitForRetainedPeriod = (page) =>
      waitFor(
        `(()=>{
        const state = window.VacateMock?.state;
        return document.readyState === 'complete'
          && state?.page === ${JSON.stringify(page)}
          && state.scope === 'team'
          && state.view === 'week'
          && state.date.getFullYear() === 2026
          && state.date.getMonth() === 10
          && state.date.getDate() === 5
          && document.querySelector('#period')?.textContent === ${JSON.stringify(retainedPeriod)};
      })()`,
      );
    // Browser history events can precede Angular bootstrap and its first render.
    // Require the expected state and rendered period, including after full-document restoration.
    await waitForRetainedPeriod('calendar');
    const calendarHistory = await call('Page.getNavigationHistory');
    await click('[data-nav=leave]');
    await waitForRetainedPeriod('leave');
    await click('.navigation-card [data-nav=balances]');
    await waitForRetainedPeriod('balances');
    assert.equal(await evaluate('new URLSearchParams(location.search).get("page")'), 'balances');
    assert.equal(await evaluate('document.querySelector("#calendar-page").hidden'), true);
    assert.equal(
      await evaluate('document.activeElement.id'),
      'main',
      'Page navigation focuses main',
    );
    await historyTo({ delta: -1 }, 'Back from balances to My Leave');
    await waitForRetainedPeriod('leave');
    const beforeCalendarBack = await call('Page.getNavigationHistory');
    await historyTo({ delta: -1 }, 'Back from My Leave to calendar');
    try {
      await waitForRetainedPeriod('calendar');
    } catch (error) {
      throw Error(
        error.message +
          '; calendarHistory=' +
          JSON.stringify({
            currentIndex: calendarHistory.currentIndex,
            entries: calendarHistory.entries.slice(-8),
          }) +
          '; beforeBack=' +
          JSON.stringify({
            currentIndex: beforeCalendarBack.currentIndex,
            entries: beforeCalendarBack.entries.slice(-8),
          }) +
          '; afterBack=' +
          JSON.stringify(await call('Page.getNavigationHistory')) +
          '; workspace=' +
          JSON.stringify(
            await evaluate(
              '({url:location.href,historyState:history.state,state:window.VacateMock?.state,period:document.querySelector("#period")?.textContent})',
            ),
          ),
      );
    }
    assert.equal(await evaluate('document.querySelector("#calendar-page").hidden'), false);
    assert.equal(
      await evaluate('document.querySelector("#period").textContent'),
      retainedPeriod,
      'Back retains calendar period',
    );
    assert.equal(await evaluate('window.VacateMock.state.layout'), 'calendar');
    await historyTo({ delta: 1 }, 'Forward to My Leave');
    await waitForRetainedPeriod('leave');
    await historyTo({ delta: 1 }, 'Forward to balances');
    await waitForRetainedPeriod('balances');
    assert.equal(await evaluate('document.querySelector("#balances-page").hidden'), false);
    await navigate(await evaluate('location.href'));
    await waitForRetainedPeriod('balances');
    assert.equal(
      await evaluate('document.querySelector("#balances-page").hidden'),
      false,
      'Refresh must keep balances page',
    );
    assert.equal(
      await evaluate('document.querySelector("#period").textContent'),
      retainedPeriod,
      'Refresh retains calendar period',
    );
    await click('[data-nav=calendar]');
    await waitForRetainedPeriod('calendar');
    assert.equal(
      await evaluate('document.querySelector("#period").textContent'),
      retainedPeriod,
      'Calendar return retains period',
    );
  };
  const feedbackAcceptance = async () => {
    const login = async (account) => {
      if (await evaluate('!!window.VacateSession.currentUser()')) await signOut();
      await signIn(account, account);
      await ready();
    };
    const select = async (selector, index) =>
      evaluate(
        `(()=>{const element=document.querySelector(${JSON.stringify(selector)});element.selectedIndex=${index};element.dispatchEvent(new Event('change',{bubbles:true}));})()`,
      );
    const policy = async () => {
      await load('?page=settings&section=organization');
      await waitFor('!!document.querySelector("#organization-policy-form")');
    };
    const savePolicy = async () => {
      await click('#organization-policy-form button');
      await waitFor(
        'document.querySelector("#organization-status").textContent.includes("Updated")',
      );
    };
    const patch = async (path, body) =>
      evaluate(
        `fetch(window.__vacateAcceptanceApiBase+'/organizations/20000000-0000-4000-8000-000000000100'+${JSON.stringify(path)},{method:'PATCH',headers:{'Content-Type':'application/json',Authorization:'Bearer '+sessionStorage.getItem('vacate.session.token')},body:JSON.stringify(${JSON.stringify(body)})}).then(response=>response.status)`,
      );
    try {
      await login('maya');
      await load('?page=leave');
      assert.deepEqual(
        await evaluate(
          'Array.from(document.querySelectorAll("[data-used-balance]"),element=>element.dataset.usedBalance)',
        ),
        ['annual', 'carer', 'school'],
      );
      assert.match(
        await evaluate('document.querySelector("[data-used-balance=annual]").textContent'),
        /17.*Pending 3/s,
      );
      assert.match(
        await evaluate('document.querySelector("vacate-my-leave").textContent'),
        /Pending approval/,
      );
      const dates = await evaluate(
        'Array.from(document.querySelectorAll("[data-request-start]"),element=>element.dataset.requestStart)',
      );
      assert.deepEqual(dates, [...dates].sort().reverse());
      await click('[data-action=account]');
      assert.equal(
        await evaluate(
          'document.querySelector("#account-dropdown [data-nav=settings]").textContent.trim()',
        ),
        'Settings',
      );
      await login('nora');
      await policy();
      const before = await evaluate(
        'JSON.stringify(window.VacateFixtures.balancesFor(window.VacateSession.currentUser()))',
      );
      await select('#carryover-enabled', 1);
      await evaluate(
        'document.querySelector("#carryover-years").value="2";document.querySelector("#carryover-years").dispatchEvent(new Event("input",{bubbles:true}))',
      );
      await select('#team-lead-settings', 1);
      await savePolicy();
      await policy();
      assert.equal(await evaluate('document.querySelector("#carryover-years").value'), '2');
      assert.equal(
        await evaluate(
          'JSON.stringify(window.VacateFixtures.balancesFor(window.VacateSession.currentUser()))',
        ),
        before,
      );
      await login('leah');
      await load('?page=settings&section=team');
      await waitFor('!!document.querySelector("#profile-form")');
      assert.equal(
        await evaluate('!!document.querySelector("[data-settings-section=team]")'),
        false,
      );
      await login('daria');
      await policy();
      await select('#team-lead-settings', 0);
      await evaluate(
        'document.querySelector("#carryover-years").value="0";document.querySelector("#carryover-years").dispatchEvent(new Event("input",{bubbles:true}))',
      );
      await savePolicy();
      await login('leah');
      await load('?page=settings&section=team');
      await waitFor('!!document.querySelector("#scope-settings-form")');
      assert.equal(await evaluate('document.querySelector("#settings-node").options.length'), 1);
      assert.match(
        await evaluate('document.querySelector("#settings-node").textContent'),
        /Platform/,
      );
      await select('#scope-vacation-approval', 2);
      await click('#scope-settings-form button');
      await waitFor(
        'document.querySelector("#scope-settings-status").textContent.includes("saved")',
      );
      assert.equal(
        await patch('/teams/20000000-0000-4000-8000-000000000401', {
          requireVacationApproval: true,
        }),
        404,
      );
      await login('ella');
      await load('?page=settings&section=department');
      await waitFor('!!document.querySelector("#scope-settings-form")');
      assert.equal(await evaluate('document.querySelector("#settings-node").options.length'), 1);
      await select('#scope-vacation-approval', 2);
      await click('#scope-settings-form button');
      await waitFor(
        'document.querySelector("#scope-settings-status").textContent.includes("saved")',
      );
      await click('[data-settings-section=team]');
      await waitFor('document.querySelector("#settings-node").options.length === 2');
      assert.match(
        await evaluate('document.querySelector("#settings-node").textContent'),
        /Product.*Operations/s,
      );
      await login('nora');
      await policy();
      await select('#organization-vacation-approval', 1);
      await savePolicy();
      await login('maya');
      await load('?page=leave');
      assert.match(
        await evaluate('document.querySelector("[data-used-balance=annual]").textContent'),
        /14.*Pending 3/s,
      );
    } finally {
      await login('nora');
      assert.equal(
        await patch('', {
          requireVacationApproval: true,
          departmentLeadSettingsEnabled: true,
          teamLeadSettingsEnabled: true,
          carryoverEnabled: false,
          carryoverYears: 0,
        }),
        200,
      );
      assert.equal(
        await patch('/teams/20000000-0000-4000-8000-000000000400', {
          requireVacationApproval: null,
        }),
        200,
      );
      assert.equal(
        await patch('/departments/20000000-0000-4000-8000-000000000301', {
          requireVacationApproval: null,
        }),
        200,
      );
      await login('maya');
    }
    console.log(
      'PASS: feedback header/avatar label, My Leave used balances/pending/date order, owner/HR policy persistence, carryover configuration only, delegated lead scope/revocation and approval hierarchy.',
    );
  };
  if (process.env.MOCK_LEAVE_ONLY === '1') {
    await signIn('maya', 'maya');
    await ready();
    await leaveRequestAcceptance();
    assert.deepEqual(errors, [], 'Unexpected leave browser exceptions');
  } else if (process.env.MOCK_FEEDBACK_ONLY === '1') {
    await feedbackAcceptance();
    assert.deepEqual(errors, [], 'Unexpected feedback acceptance browser exceptions');
  } else if (process.env.MOCK_HISTORY_ONLY === '1') {
    await evaluate(
      'for(let index=0; index<60; index++) history.pushState(null, "", location.href)',
    );
    await accountHistoryAcceptance();
    await historyAcceptance();
    assert.deepEqual(errors, [], 'Unexpected history browser exceptions');
    console.log('PASS: Calendar / My Leave / Balances Back, Forward, refresh and calendar period.');
  } else if (process.env.MOCK_NAVIGATION_ONLY === '1') {
    await signIn('nora', 'nora');
    await ready();
    assert.equal(
      await evaluate('document.querySelectorAll("nav#navigation [data-nav=settings]").length'),
      1,
    );
    assert.equal(
      await evaluate('!!document.querySelector(".topbar .sign-out,.topbar #demo-person")'),
      false,
    );
    assert.match(
      await evaluate('document.querySelector("#workspace-organization").textContent'),
      /Northstar Example/,
    );
    assert.equal(
      await evaluate(
        '!!document.querySelector("nav#navigation [data-nav=organization-settings],nav#navigation [data-nav=balances]")',
      ),
      false,
    );
    await click('[data-nav=settings]');
    await waitFor('!!document.querySelector("#profile-form")');
    assert.equal(
      await evaluate('document.querySelectorAll(".settings-navigation button").length'),
      5,
    );
    await click('[data-settings-section=team]');
    await waitFor('!!document.querySelector("#scope-settings-form")');
    assert.match(
      await evaluate('document.querySelector(".navigation-card").textContent'),
      /Nora.*Example.*you/s,
    );
    await click('[data-settings-section=organization]');
    await waitFor('!!document.querySelector("#organization-form")');
    await screenshot('unified-settings-desktop.png');
    await click('[data-nav=people]');
    await waitFor('document.querySelectorAll("[data-edit-membership]").length === 12');
    await click('[data-edit-membership=maya]');
    await waitFor('!!document.querySelector("#membership-form")');
    await click('[data-nav=admin-balances]');
    await waitFor('document.querySelectorAll(".overview-table tbody tr").length === 12');
    assert.match(
      await evaluate('document.querySelector(".overview-table").textContent'),
      /To confirm/,
    );
    await evaluate(
      'document.querySelector("input[type=search]").value="Maya";document.querySelector("input[type=search]").dispatchEvent(new Event("input",{bubbles:true}))',
    );
    await waitFor('document.querySelectorAll(".overview-table tbody tr").length === 1');
    assert.match(
      await evaluate('document.querySelector(".overview-table tbody").textContent'),
      /Maya/,
    );
    await screenshot('admin-balances-desktop.png');
    await viewport(375, 1000);
    assert.equal(await evaluate('document.documentElement.scrollWidth <= innerWidth'), true);
    await screenshot('admin-balances-mobile.png');
    await load('?page=settings&section=team');
    await waitFor('!!document.querySelector("#scope-settings-form")');
    assert.equal(await evaluate('document.documentElement.scrollWidth <= innerWidth'), true);
    await screenshot('unified-settings-mobile.png');
    await viewport(1600, 1100);
    await click('[data-nav=approvals]');
    await waitFor('window.VacateMock?.state.page === "approvals"');
    assert.match(
      await evaluate('document.querySelector(".navigation-card").textContent'),
      /Approval inbox unavailable/,
    );
    await click('[data-nav=leave]');
    await waitFor('!!document.querySelector("vacate-my-leave")');
    assert.match(
      await evaluate('document.querySelector("vacate-my-leave").textContent'),
      /My requests/,
    );
    await click('.navigation-card [data-nav=balances]');
    await waitFor('!!document.querySelector("vacate-balances")');
    await signOut();
    await signIn('maya', 'maya');
    await ready();
    assert.equal(
      await evaluate(
        '!!document.querySelector("nav#navigation [data-nav=admin-balances],nav#navigation [data-nav=approvals]")',
      ),
      false,
    );
    await load('?page=admin-balances');
    assert.equal(await evaluate('!!document.querySelector(".overview-table")'), false);
    for (const query of [
      '?page=organization',
      '?page=organization-settings',
      '?page=settings&section=organization',
      '?page=settings&section=team',
    ]) {
      await load(query);
      await waitFor('!!document.querySelector("#profile-form")');
      assert.equal(
        await evaluate(
          '!!document.querySelector("vacate-organization, [data-settings-section=organization], [data-settings-section=team]")',
        ),
        false,
      );
      assert.equal(await evaluate('new URL(location.href).searchParams.get("section")'), 'profile');
    }
    assert.deepEqual(
      await evaluate(
        'Array.from(document.querySelectorAll(".settings-navigation button"), button=>button.dataset.settingsSection)',
      ),
      ['profile', 'system'],
    );
    await click('[data-settings-section=system]');
    await waitFor('!!document.querySelector("#display-preferences-form")');
    assert.equal(
      await evaluate('!!document.querySelector("#profile-form, .membership-card")'),
      false,
    );
    await screenshot('employee-system-settings-desktop.png');
    await viewport(375, 1000);
    assert.equal(await evaluate('document.documentElement.scrollWidth <= innerWidth'), true);
    await screenshot('employee-system-settings-mobile.png');
    await viewport(1600, 1100);
    await load('?scope=team');
    assert.match(await evaluate('document.querySelector("#scope-count").textContent'), /3 people/);
    await click('[data-nav=people]');
    await waitFor('document.querySelectorAll("vacate-people [data-person]").length === 12');
    assert.doesNotMatch(
      await evaluate('document.querySelector("vacate-people").textContent'),
      /sole care|married|dependentChildren/,
    );
    await click('[data-action=account]');
    assert.equal(
      await evaluate('!!document.querySelector("#account-dropdown [data-action=logout]")'),
      true,
    );
    await signOut();
    await historyAcceptance();
    assert.deepEqual(errors, [], 'Unexpected navigation browser exceptions');
    console.log(
      'PASS: VAC-20 unified settings, own team, People membership editor/directory, personal leave, admin balance search, employee denials, explicit unavailable approvals, topbar cleanup and desktop/mobile layouts.',
    );
  } else if (process.env.MOCK_ORG_FUNCTIONAL_ONLY === '1') {
    await signIn('nora', 'nora');
    await ready();
    await organizationAcceptance();
    assert.deepEqual(errors, [], 'Unexpected organization exceptions');
  } else if (process.env.MOCK_ORG_NATIVE_ONLY === '1') {
    await signIn('nora', 'nora');
    await ready();
    await navigate(baseUrl + '?page=organization');
    await waitFor('!!document.querySelector("#organization-form")');
    // Focus the actual renderer widget; focus emulation alone can report a false
    // document focus on macOS headless without delivering any native key events.
    await evaluate(
      'window.__keyLog=[];window.__pointerLog=[];document.onkeydown=event=>window.__keyLog.push({key:event.key,trusted:event.isTrusted,target:event.target?.outerHTML.slice(0,180)});document.onmousedown=event=>window.__pointerLog.push({trusted:event.isTrusted,target:event.target?.tagName})',
    );
    const neutral = await evaluate(
      '(()=>{const r=document.querySelector("h1").getBoundingClientRect();return {x:r.left+8,y:r.top+8};})()',
    );
    await call('Input.dispatchMouseEvent', { type: 'mouseMoved', ...neutral });
    await call('Input.dispatchMouseEvent', {
      type: 'mousePressed',
      ...neutral,
      button: 'left',
      clickCount: 1,
    });
    await call('Input.dispatchMouseEvent', {
      type: 'mouseReleased',
      ...neutral,
      button: 'left',
      clickCount: 1,
    });
    await screenshot('organization-keyboard-start.png');
    await keyboardClick('[data-org-department=technology]');
    await waitFor('!!document.querySelector("#org-rename-form")');
    await keyboardClick('[data-org-team=platform]');
    assert.equal(await evaluate('document.querySelectorAll(".org-members li").length'), 3);
    await keyboardClick('.org-breadcrumb button:first-child');
    await keyboardClick('[data-nav=calendar]');
    await keyboardClick('[data-nav=settings]');
    await keyboardClick('[data-settings-section=organization]');
    await waitFor('!!document.querySelector("#organization-form")');
    assert.deepEqual(errors, [], 'Unexpected organization keyboard exceptions');
    console.log('PASS: isolated trusted keyboard department/team/organization navigation');
  } else {
    await evaluate(
      'document.querySelector("#demo-account").value="maya";document.querySelector("#demo-account").dispatchEvent(new Event("change"))',
    );
    assert.equal(await evaluate('document.querySelector("#username").value'), 'maya');
    assert.equal(await evaluate('document.querySelector("#password").value'), 'maya');
    const expected = [
      ['leah', 'Platform', 'Technology', 'lead'],
      ['ravi', 'Platform', 'Technology', 'employee'],
      ['noah', 'Platform', 'Technology', 'employee'],
      ['maya', 'Applications', 'Technology', 'employee'],
      ['theo', 'Applications', 'Technology', 'employee'],
      ['iris', 'Applications', 'Technology', 'employee'],
      ['ella', 'Product', 'Business', 'lead'],
      ['owen', 'Product', 'Business', 'employee'],
      ['zoe', 'Product', 'Business', 'employee'],
      ['daria', 'Operations', 'Business', 'admin'],
      ['nora', 'Operations', 'Business', 'admin'],
      ['sam', 'Operations', 'Business', 'employee'],
    ];
    await signIn('user', 'user');
    await ready();
    assert.equal(
      await evaluate(
        'window.VacateSession.currentUser().id || window.VacateSession.currentUser().personId',
      ),
      'maya',
    );
    assert.equal(await evaluate('!!sessionStorage.getItem("vacate.session.token")'), true);
    // Run trusted keyboard input before history traversal can leave a hidden Chrome renderer.
    const nativeAcceptance = async () => {
      await signOut();
      await signIn('user', 'user');
      await ready();
      await load('?scope=self&view=month');
      assert.equal(await evaluate('!!document.querySelector(".topbar #demo-person")'), false);
      assert.match(
        await evaluate('document.querySelector("#workspace-organization").textContent'),
        /Northstar Example/,
      );
      await nativeFocusAcceptance();
      // Exercise native keyboard behavior on a fresh document, independently of history traversal.
      // Native keyboard activation creates trusted browser input in a fresh document,
      // independently of the synthetic DOM clicks used for the data-oriented checks below.
      await keyboardClick('[data-date="2026-10-01"]');
      try {
        await waitFor(
          'document.querySelector("#dialog").open && document.querySelector("#dialog").contains(document.activeElement)',
        );
      } catch (error) {
        throw Error(
          error.message +
            '; first-date diagnostic: ' +
            JSON.stringify({
              runtimeErrors: errors,
              ...(await evaluate(
                '({dialogOpen:document.querySelector("#dialog").open,dialogText:document.querySelector("#dialog-content").textContent,focused:document.hasFocus(),active:document.activeElement?.outerHTML,pointer:window.__pointerEvidence})',
              )),
            }),
        );
      }
      assert.match(
        await evaluate('document.querySelector("#dialog").textContent'),
        /No leave shown/,
      );
      assert.equal(
        await evaluate('document.hasFocus()'),
        true,
        'Keyboard target document is not focused',
      );
      await evaluate(
        'new Promise(resolve=>{requestAnimationFrame(()=>requestAnimationFrame(resolve));setTimeout(resolve,150)})',
      );
      await evaluate(
        `window.__escapeEvidence=[];document.addEventListener('keydown',event=>window.__escapeEvidence.push({event:'keydown',key:event.key,trusted:event.isTrusted,target:event.target.className}),{once:true,capture:true});document.querySelector('#dialog').addEventListener('cancel',event=>window.__escapeEvidence.push({event:'cancel',trusted:event.isTrusted,prevented:event.defaultPrevented}),{once:true});`,
      );
      await call('Input.dispatchKeyEvent', {
        type: 'keyDown',
        key: 'Escape',
        code: 'Escape',
        windowsVirtualKeyCode: 27,
      });
      await call('Input.dispatchKeyEvent', {
        type: 'keyUp',
        key: 'Escape',
        code: 'Escape',
        windowsVirtualKeyCode: 27,
      });
      try {
        await waitFor('!document.querySelector("#dialog").open');
      } catch (error) {
        throw Error(
          error.message +
            '; Escape diagnostic: ' +
            JSON.stringify(
              await evaluate(
                '({focused:document.hasFocus(),active:document.activeElement.outerHTML,modal:document.querySelector("#dialog").matches(":modal"),activation:{active:navigator.userActivation.isActive,ever:navigator.userActivation.hasBeenActive},events:window.__escapeEvidence})',
              ),
            ),
        );
      }
      assert.equal(
        await evaluate(
          'window.__escapeEvidence.some(event=>event.event === "keydown" && event.key === "Escape" && event.trusted)',
        ),
        true,
        'Escape key was not delivered as trusted browser input',
      );
      assert.equal(await evaluate('document.querySelector("#dialog").open'), false);
      await waitFor('document.activeElement.dataset.date === "2026-10-01"');
      assert.equal(await evaluate('document.activeElement.dataset.date'), '2026-10-01');
      console.log('PASS: trusted keyboard Escape and focus return');
      await load('?scope=self&view=month&native=request');
      await evaluate(
        'window.__requestClickEvidence=[];document.addEventListener("click",event=>window.__requestClickEvidence.push({trusted:event.isTrusted,target:event.target.outerHTML,action:event.target.closest("button")?.dataset.action}),{once:true,capture:true})',
      );
      await keyboardClick('[data-action="request"]');
      try {
        await waitFor('!!document.querySelector("#request-form #leave-type")');
      } catch (error) {
        throw Error(
          error.message +
            '; request-open diagnostic: ' +
            JSON.stringify({
              runtimeErrors: errors,
              ...(await evaluate(
                '({dialogOpen:document.querySelector("#dialog").open,dialogText:document.querySelector("#dialog-content").textContent,active:document.activeElement?.outerHTML,currentUser:window.VacateSession.currentUser()?.id,annualDecision:window.VacateEligibility.decisionFor("annual"),hasFocus:document.hasFocus(),clickEvents:window.__requestClickEvidence})',
              )),
            }),
        );
      }
      assert.deepEqual(await requestTypes(), expectedShortlist, 'Initial chooser defaults');
      assert.equal(
        await evaluate('!!document.querySelector("#leave-type option[value=marriage]")'),
        false,
        'Married Maya must not see marriage in default chooser',
      );
      assert.equal(
        await evaluate('!!document.querySelector(".eligibility-unavailable")'),
        false,
        'Default chooser does not present unavailable type names',
      );
      await keyboardClick('#request-type-toggle');
      assert.equal(
        await evaluate(
          'document.querySelector("#request-type-toggle").getAttribute("aria-expanded")',
        ),
        'true',
      );
      assert.equal(await evaluate('document.activeElement.id'), 'request-type-toggle');
      assert.equal(
        await evaluate('document.querySelector("#leave-type option[value=marriage]").disabled'),
        true,
        'Show all keeps marriage reference disabled for Maya',
      );
      assert.match(
        await evaluate('document.querySelector(".eligibility-unavailable").textContent'),
        /Marriage/,
        'Show all explains unavailable reference types accessibly',
      );
      await evaluate(
        'document.querySelector("#leave-type").value="carer";document.querySelector("#leave-type").dispatchEvent(new Event("change"));document.querySelector("#start-date").value="2026-10-27";document.querySelector("#start-date").dispatchEvent(new Event("input"));document.querySelector("#end-date").value="2026-10-29";document.querySelector("#end-date").dispatchEvent(new Event("input"));document.querySelector("#request-rules").open=true',
      );
      await call('Page.bringToFront');
      await evaluate(
        'document.querySelector("#request-type-toggle").focus();new Promise(resolve=>{requestAnimationFrame(()=>requestAnimationFrame(resolve));setTimeout(resolve,150)})',
      );
      assert.equal(await evaluate('document.activeElement.id'), 'request-type-toggle');
      assert.equal(await evaluate('document.hasFocus()'), true);
      await call('Input.dispatchKeyEvent', {
        type: 'keyDown',
        key: 'Enter',
        code: 'Enter',
        windowsVirtualKeyCode: 13,
        text: '\r',
        unmodifiedText: '\r',
      });
      await call('Input.dispatchKeyEvent', {
        type: 'keyUp',
        key: 'Enter',
        code: 'Enter',
        windowsVirtualKeyCode: 13,
      });
      await waitFor(
        'document.querySelector("#request-type-toggle").getAttribute("aria-expanded") === "false"',
      );
      assert.deepEqual(
        await requestTypes(),
        [...expectedShortlist, 'carer'],
        'Uncommon selection must stay visible',
      );
      assert.equal(await evaluate('document.querySelector("#leave-type").value'), 'carer');
      assert.equal(await evaluate('document.querySelector("#start-date").value'), '2026-10-27');
      assert.equal(await evaluate('document.querySelector("#end-date").value'), '2026-10-29');
      assert.equal(await evaluate('document.querySelector("#request-rules").open'), true);
      assert.match(
        await evaluate('document.querySelector("#request-type-status").textContent'),
        /Carer.*kept visible/,
      );
      await evaluate(
        'document.querySelector("#leave-type").value="annual";document.querySelector("#leave-type").dispatchEvent(new Event("change"))',
      );
      assert.deepEqual(
        await requestTypes(),
        expectedShortlist,
        'Former uncommon selection should leave the short view',
      );
      await evaluate(
        'document.querySelector("#leave-type").value="school";document.querySelector("#leave-type").dispatchEvent(new Event("change"));document.querySelector("#request-unit").value="hours";document.querySelector("#request-unit").dispatchEvent(new Event("change"))',
      );
      await click('#request-type-toggle');
      await click('#request-type-toggle');
      assert.equal(await evaluate('document.querySelector("#leave-type").value'), 'school');
      assert.equal(
        await evaluate('document.querySelector("#request-unit").value'),
        'hours',
        'School hours unit changed across shortlist toggle',
      );
      assert.equal(await evaluate('!!document.querySelector("#request-amount")'), false);
      assert.equal(await evaluate('document.querySelector("#start-date").value'), '2026-10-27');
      assert.equal(await evaluate('!!document.querySelector("#end-date")'), false);
      assert.equal(await evaluate('document.querySelector("#request-rules").open'), true);
      assert.match(
        await evaluate('document.querySelector("#request-hourly-notice").textContent'),
        /not available/,
      );
      await keyboardClick('#dialog .dialog-close');
      await waitFor(
        '!document.querySelector("#dialog").open && document.activeElement.matches("[data-action=request]")',
      );
      console.log(
        'PASS: native keyboard shortlist expansion/collapse, pinned uncommon selection and draft preservation',
      );
      await keyboardClick('[data-action=account]');
      assert.equal(await evaluate('document.activeElement?.dataset.nav'), 'settings');
      await call('Input.dispatchKeyEvent', {
        type: 'keyDown',
        key: 'Escape',
        code: 'Escape',
        windowsVirtualKeyCode: 27,
      });
      await call('Input.dispatchKeyEvent', {
        type: 'keyUp',
        key: 'Escape',
        code: 'Escape',
        windowsVirtualKeyCode: 27,
      });
      await waitFor('!document.querySelector("#account-dropdown")');
      assert.equal(await evaluate('document.activeElement?.dataset.action'), 'account');
      await keyboardClick('[data-action=account]');
      await keyboardClick('#account-dropdown [data-nav=settings]');
      await waitFor('!!document.querySelector("#profile-form")');
      await keyboardClick('[data-nav=calendar]');
      console.log('PASS: trusted keyboard avatar dropdown, settings entry and Escape focus return');
    };
    if (process.env.MOCK_FUNCTIONAL_ONLY !== '1') await nativeAcceptance();
    if (process.env.MOCK_NATIVE_ONLY !== '1') {
      await signOut();
      await navigate(baseUrl);
      await waitFor('!!document.querySelector("#login-form")');
      await signIn('admin', 'admin');
      await ready();
      assert.equal(
        await evaluate(
          'window.VacateSession.currentUser().id || window.VacateSession.currentUser().personId',
        ),
        'nora',
      );
      await signOut();
      for (const [id, team, department, role] of expected) {
        await signIn(id, id);
        await ready();
        assert.equal(
          await evaluate(
            'window.VacateSession.currentUser().id || window.VacateSession.currentUser().personId',
          ),
          id,
        );
        const landing = role === 'admin' ? 'org' : role === 'lead' ? 'department' : 'self';
        assert.equal(
          await evaluate(
            `document.querySelector('[data-scope="${landing}"]').getAttribute('aria-pressed')`,
          ),
          'true',
          id + ' default scope',
        );
        const scopes =
          role === 'employee' ? ['self', 'team', 'org'] : ['self', 'team', 'department', 'org'];
        for (const scope of ['self', 'team', 'department', 'org'])
          assert.equal(
            await evaluate(
              `!!document.querySelector('[data-scope="${scope}"]') && !document.querySelector('[data-scope="${scope}"]').hidden && !document.querySelector('[data-scope="${scope}"]').disabled`,
            ),
            scopes.includes(scope),
            id + '/' + scope + ' scope affordance',
          );
        await click('[data-action="account"]');
        assert.equal(
          await evaluate(
            'document.querySelector("[data-action=account]").getAttribute("aria-expanded")',
          ),
          'true',
        );
        await click('[data-action="account-details"]');
        assert.match(
          await evaluate('document.querySelector("#dialog-content").textContent'),
          new RegExp('Signed in as ' + id + '\\.'),
        );
        await closeDialog();
        assert.equal(
          await evaluate('document.querySelector("#dialog").open'),
          false,
          id + ' stale dialog',
        );
        await click('[data-action="request"]');
        assert.equal(
          await evaluate(
            'document.querySelector("#end-date").value === document.querySelector("#start-date").value',
          ),
          true,
          id + ' stale form end date',
        );
        assert.deepEqual(
          await requestTypes(),
          expectedVisible(id),
          id + ' profile-filtered request defaults / stale selection',
        );
        assert.match(
          await evaluate('document.querySelector("#request-type-status").textContent'),
          new RegExp(`^${expectedVisible(id).length} shortlisted types`),
          id + ' visible shortlist count',
        );
        assert.equal(
          await evaluate(
            'Array.from(document.querySelector("#leave-type").options).every(option=>option.disabled === (window.VacateEligibility.decisionFor(option.value).status === "not-eligible" || window.VacateLeave.getType(option.value).shape === "supplement"))',
          ),
          true,
          id + ' picker must consume account-scoped eligibility',
        );
        if (id === 'noah')
          assert.equal(
            await evaluate('document.querySelector("#leave-type option[value=maternity]")'),
            null,
            'Noah maternity profile restriction hides default option',
          );
        if (id === 'nora')
          assert.equal(
            await evaluate(
              'document.querySelector("#leave-type option[value=maternity]").disabled',
            ),
            false,
            'Nora maternity profile eligibility',
          );
        if (id === 'theo') {
          await click('#request-type-toggle');
          assert.equal(
            await evaluate(
              'document.querySelector("#leave-type option[value=single-parent]").disabled',
            ),
            true,
            'Theo shared-care profile is not single-parent eligible',
          );
          await click('#request-type-toggle');
        }
        await click('#request-type-toggle');
        assert.equal(
          (await requestTypes()).length,
          30,
          id + ' Show all preserves complete reference catalogue',
        );
        for (const blocked of blockedShortlist[id])
          assert.equal(
            await evaluate(
              `document.querySelector('#leave-type option[value="${blocked}"]').disabled`,
            ),
            true,
            id + '/' + blocked + ' remains disabled in reference catalogue',
          );
        await click('#request-type-toggle');
        await closeDialog();
        assert.deepEqual(await balanceTypes(), [], id + ' calendar must not render all balances');
        assert.equal(await evaluate('document.querySelector("#balances-page").hidden'), true);
        await click('[data-nav=leave]');
        await click('.navigation-card [data-nav=balances]');
        assert.deepEqual(
          await balanceTypes(),
          expectedBalanceTypes(id),
          id + ' profile-filtered balance defaults',
        );
        assert.match(
          await evaluate('document.querySelector("#balance-list-status").textContent'),
          new RegExp(`^${expectedVisible(id).length} shortlisted types`),
          id + ' visible balance shortlist count',
        );
        assert.equal(
          await evaluate(
            'Array.from(document.querySelectorAll("[data-balance]")).every(card=>window.VacateEligibility.decisionFor(card.dataset.balance).status === "eligible" || !card.querySelector(".type-bar,.type-percentage"))',
          ),
          true,
          id + ' unconfirmed or unavailable type must not show a numeric personal balance',
        );
        assert.equal(await evaluate('document.querySelector("#calendar-page").hidden'), true);
        assert.equal(
          await evaluate(
            'document.querySelector("nav [data-nav=leave]").getAttribute("aria-current")',
          ),
          'page',
        );
        await click('[data-nav=calendar]');
        const expectedUpcoming = await evaluate(
          `window.VacateFixtures.ownEntries(window.VacateFixtures.person(${JSON.stringify(id)})).filter(entry=>entry.end>='2026-10-22').sort((a,b)=>a.start.localeCompare(b.start)).slice(0,3).map(entry=>entry.id)`,
        );
        assert.deepEqual(
          await evaluate(
            'Array.from(document.querySelectorAll(".upcoming-card [data-event]")).map(button=>button.dataset.event)',
          ),
          expectedUpcoming,
          id + ' own upcoming entries',
        );
        const expectedBalance = await evaluate(
          `window.VacateFixtures.balancesFor(window.VacateFixtures.person(${JSON.stringify(id)})).annual`,
        );
        assert.match(
          await evaluate('document.querySelector("#annual-overview").textContent'),
          new RegExp(
            `${expectedBalance.allocation - expectedBalance.used} / ${expectedBalance.allocation} working days available`,
          ),
          id + ' own annual balance',
        );
        await click('[data-nav="leave"]');
        const ownTitles = await evaluate(
          `window.VacateFixtures.ownEntries(window.VacateFixtures.person(${JSON.stringify(id)})).map(entry=>entry.title)`,
        );
        const personalDialog = await evaluate(
          'document.querySelector("vacate-my-leave").textContent',
        );
        for (const title of ownTitles)
          assert.ok(personalDialog.includes(title), id + ' own request missing');
        const foreignTitles = await evaluate(
          `window.VacateFixtures.entries.filter(entry=>entry.person!==${JSON.stringify(id)}).map(entry=>entry.title)`,
        );
        for (const title of foreignTitles)
          if (!ownTitles.includes(title))
            assert.ok(!personalDialog.includes(title), id + ' foreign private request shown');
        if (id === 'sam')
          assert.match(
            await evaluate('document.querySelector(".upcoming-card").textContent'),
            /no .*request|no .*leave|nothing|empty/i,
            'Sam upcoming empty state',
          );
        await click('[data-nav=calendar]');
        for (const scope of scopes.filter((value) => value !== 'self')) {
          await load('?scope=' + scope + '&view=week');
          const members =
            scope === 'team'
              ? expected.filter((row) => row[1] === team)
              : scope === 'department'
                ? expected.filter((row) => row[2] === department)
                : expected;
          assert.deepEqual(
            await evaluate('window.VacateMock.visiblePeople().map(person=>person.id).sort()'),
            members.map((row) => row[0]).sort(),
            id + '/' + scope + ' member roster',
          );
          if (scope === 'team' || scope === 'department') {
            const expectedGroups =
              scope === 'team'
                ? role === 'admin'
                  ? ['applications', 'operations', 'platform', 'product']
                  : role === 'lead'
                    ? department === 'Technology'
                      ? ['applications', 'platform']
                      : ['operations', 'product']
                    : [team.toLowerCase()]
                : role === 'admin'
                  ? ['business', 'technology']
                  : [department.toLowerCase()];
            assert.deepEqual(
              await evaluate(
                'Array.from(document.querySelector("#scope-group").options).map(option=>option.value).sort()',
              ),
              expectedGroups.sort(),
              id + '/' + scope + ' selectable groups',
            );
            for (const group of expectedGroups) {
              await evaluate(
                `document.querySelector('#scope-group').value=${JSON.stringify(group)};document.querySelector('#scope-group').dispatchEvent(new Event('change'))`,
              );
              const groupMembers = expected
                .filter((row) => row[scope === 'team' ? 1 : 2].toLowerCase() === group)
                .map((row) => row[0])
                .sort();
              assert.deepEqual(
                await evaluate('window.VacateMock.visiblePeople().map(person=>person.id).sort()'),
                groupMembers,
                id + '/' + group + ' selected roster',
              );
            }
          }
          const shared = await evaluate('document.querySelector("#calendar-content").textContent');
          assert.doesNotMatch(
            shared,
            /Pending|Approved|balance|sick|illness/i,
            id + ' shared calendar disclosed private state',
          );
          assert.equal(
            await evaluate(
              'window.VacateLeave.types.some(type=>document.querySelector("#calendar-content").textContent.includes(type.name))',
            ),
            false,
            id + ' shared type',
          );
          if (await evaluate('!!document.querySelector("#calendar-content [data-event]")')) {
            await click('#calendar-content [data-event]');
            assert.doesNotMatch(
              await evaluate('document.querySelector("#dialog-content").textContent'),
              /Pending|Approved|allocation|working days available/i,
              id + ' shared detail',
            );
            assert.equal(
              await evaluate(
                'window.VacateLeave.types.some(type=>document.querySelector("#dialog-content").textContent.includes(type.name))',
              ),
              false,
              id + ' shared detail type',
            );
            await closeDialog();
          }
        }
        await load('?scope=org&group=foreign-company&person=nora&event=nora-annual');
        assert.match(
          await evaluate('document.querySelector("#scope-count").textContent'),
          /^0 people/,
          id + ' invalid group leaked people',
        );
        assert.equal(
          await evaluate('document.querySelectorAll("#calendar-content [data-event]").length'),
          0,
          id + ' query leaked availability',
        );
        const foreignEvent = await evaluate(
          `window.VacateFixtures.entries.find(entry=>entry.person!==${JSON.stringify(id)}).id`,
        );
        await click('[data-scope="self"]');
        await evaluate(
          `{const forged=document.createElement('button');forged.id='forged-event';forged.dataset.event=${JSON.stringify(foreignEvent)};document.body.append(forged);forged.click();forged.remove();}`,
        );
        assert.equal(
          await evaluate(
            'window.VacateLeave.types.some(type=>document.querySelector("#dialog-content").textContent.includes(type.name))',
          ),
          false,
          id + ' guessed private event type',
        );
        if (await evaluate('document.querySelector("#dialog").open')) await closeDialog();
        const directoryScope = scopes.at(-1);
        await load('?scope=' + directoryScope);
        await click('[data-nav="people"]');
        await waitFor(
          '!!document.querySelector(".org-membership-roster") || document.querySelectorAll("vacate-people [data-person]").length === 12',
        );
        assert.equal(
          await evaluate(
            'document.querySelectorAll("vacate-people [data-person],vacate-people [data-edit-membership]").length',
          ),
          12,
          id + ' directory roster',
        );
        assert.equal(
          await evaluate('!!document.querySelector("nav [data-nav=approvals]")'),
          role === 'admin',
        );
        await load('?page=approvals');
        assert.match(
          await evaluate('document.querySelector(".navigation-card").textContent'),
          role === 'admin' ? /unavailable/ : /do not have access/,
        );
        assert.equal(
          await evaluate(
            'document.querySelectorAll(".navigation-card [data-approve],.navigation-card form").length',
          ),
          0,
        );
        assert.equal(
          await evaluate('!!document.querySelector("nav [data-nav=organization-settings]")'),
          false,
        );
        await load('?page=settings&section=organization');
        await waitFor(
          '!!document.querySelector("#organization-form") || !!document.querySelector("#profile-form")',
        );
        assert.equal(
          await evaluate('!!document.querySelector("#organization-form")'),
          role === 'admin',
        );
        assert.deepEqual(
          await evaluate(
            'Array.from(document.querySelectorAll(".settings-navigation button"), button=>button.dataset.settingsSection)',
          ),
          role === 'admin'
            ? ['organization', 'department', 'team', 'profile', 'system']
            : id === 'ella'
              ? ['department', 'team', 'profile', 'system']
              : id === 'leah'
                ? ['team', 'profile', 'system']
                : ['profile', 'system'],
        );
        if (role !== 'admin') {
          assert.equal(await evaluate('!!document.querySelector("vacate-organization")'), false);
          await load('?page=settings&section=team');
          await waitFor(
            '!!document.querySelector("#profile-form") || !!document.querySelector("#scope-settings-form")',
          );
          assert.equal(
            await evaluate('!!document.querySelector("#scope-settings-form")'),
            ['leah', 'ella'].includes(id),
          );
        }
        await click('[data-nav=calendar]');
        await waitFor(
          'window.VacateMock?.state.page === "calendar" && document.querySelector("#calendar-page")?.hidden === false',
        );
        await click('[data-action="request"]');
        await waitFor('document.querySelector("#dialog")?.open === true');
        await evaluate('document.querySelector("#start-date").value="2026-11-01"');
        await signOut();
        if (['noah', 'iris', 'zoe', 'sam'].includes(id))
          console.log('PASS: account/scope/eligibility regression through ' + id);
        await navigate(baseUrl);
        await waitFor('!!document.querySelector("#login-form")');
        assert.equal(await evaluate('sessionStorage.getItem("vacate.demo.account.v2")'), null);
      }
      console.log('PASS: twelve firstname accounts, scopes, own/shared records and resets');
      // Reloading stale or fabricated identity cannot restore a signed-in calendar.
      await evaluate(
        'sessionStorage.setItem("vacate.demo.account.v1","admin");sessionStorage.setItem("vacate.demo.account.v2","unknown")',
      );
      await navigate(baseUrl);
      await waitFor('!!document.querySelector("#login-form")');
      assert.equal(await evaluate('window.VacateSession.currentUser()'), null);
      await accountHistoryAcceptance();
      await historyAcceptance();
      await load('?scope=self&view=month');
      assert.equal(await evaluate('window.VacateLeave.types.length'), 30);
      assert.equal(await evaluate('window.VacateLeave.workWeekDays'), 5);
      assert.equal(await evaluate('new Set(window.VacateLeave.types.map(type=>type.id)).size'), 30);
      assert.deepEqual(await balanceTypes(), [], 'Calendar contains annual overview only');
      const zeroAnnual = await evaluate(
        `(async()=>{const original=window.VacateFixtures;try{window.VacateFixtures={...original,balancesFor:candidate=>{const balances=original.balancesFor(candidate);return balances?{...balances,annual:{...balances.annual,allocation:0,used:0,pending:0}}:null;}};document.querySelector('[data-scope=self]').click();await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));const annual=document.querySelector('#annual-overview');return {text:annual.textContent,bar:!!annual.querySelector('.type-bar'),percentage:!!annual.querySelector('.annual-percentage'),html:annual.innerHTML};}finally{window.VacateFixtures=original;document.querySelector('[data-scope=self]').click();await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));}})()`,
      );
      assert.match(
        zeroAnnual.text,
        /0 \/ 0 working days available/,
        'Known zero allocation must stay distinct from unknown',
      );
      assert.equal(
        zeroAnnual.bar,
        false,
        'Zero allocation must not render divided-by-zero bar widths',
      );
      assert.equal(
        zeroAnnual.percentage,
        false,
        'Zero allocation has no meaningful availability percentage',
      );
      assert.doesNotMatch(
        zeroAnnual.html,
        /NaN|Infinity|null%/,
        'Annual zero allocation must not expose invalid numbers',
      );
      assert.match(
        await evaluate('document.querySelector("#annual-overview").textContent'),
        /17 \/ 25 working days available/,
        'Restore original annual fixture after zero-allocation regression',
      );
      await click('[data-page-link=balances]');
      assert.deepEqual(await balanceTypes(), mayaBalanceTypes);
      assert.match(
        await evaluate('document.querySelector("[data-balance=annual]").textContent'),
        /17 \/ 25 working days available/,
      );
      assert.match(
        await evaluate('document.querySelector("[data-balance=annual]").textContent'),
        /68% available/,
      );
      await click('[data-balance=annual] summary');
      await waitFor(
        'document.querySelector("[data-balance=annual] summary").getAttribute("aria-expanded") === "true"',
      );
      assert.match(
        await evaluate('document.querySelector("[data-balance=annual]").textContent'),
        /10 years here OR 12 total/,
      );
      await click('#balance-toggle');
      assert.equal(await evaluate('document.querySelectorAll("[data-balance]").length'), 30);
      await click('[data-balance=carer] summary');
      await waitFor(
        'document.querySelector("[data-balance=carer] summary").getAttribute("aria-expanded") === "true"',
      );
      await click('#balance-toggle');
      assert.deepEqual(
        await balanceTypes(),
        [...mayaBalanceTypes, 'carer'],
        'Expanded uncommon balance stays visible',
      );
      assert.equal(await evaluate('document.querySelector("[data-balance=carer]").open'), true);
      await click('[data-nav=calendar]');
      await click('[data-nav=leave]');
      await click('.navigation-card [data-nav=balances]');
      assert.equal(
        await evaluate('document.querySelector("[data-balance=carer]").open'),
        true,
        'Page navigation retains expanded uncommon balance',
      );
      assert.deepEqual(
        await balanceTypes(),
        [...mayaBalanceTypes, 'carer'],
        'Page navigation retains the balance catalogue state',
      );
      await click('#balance-toggle');
      assert.equal(
        await evaluate('document.querySelector("[data-balance=maternity] .type-percentage")'),
        null,
      );
      assert.match(
        await evaluate('document.querySelector("[data-balance=parental]").textContent'),
        /2 \/ 4 months available/,
      );
      assert.match(
        await evaluate('document.querySelector("[data-balance=dependent-illness]").textContent'),
        /Eligibility to confirm/,
      );
      assert.equal(
        await evaluate('document.querySelector("[data-balance=childcare] .type-bar")'),
        null,
      );
      assert.equal(await evaluate('document.querySelector("[data-balance=sick] .type-bar")'), null);
      assert.equal(
        await evaluate('document.querySelector("[data-balance=sick] .type-percentage")'),
        null,
      );
      assert.match(
        await evaluate('document.querySelector("[data-balance=sick]").textContent'),
        /Allowance and eligibility to confirm/,
      );
      assert.match(
        await evaluate(
          'document.querySelector("[data-balance=dependent-illness] .type-title").textContent',
        ),
        /Child illness/,
      );
      await click('[data-balance=carer] [data-example-type]');
      assert.equal(await evaluate('document.querySelector("#leave-type").value'), 'carer');
      assert.deepEqual(
        await requestTypes(),
        [...expectedShortlist, 'carer'],
        'Uncommon balance example pinned in chooser',
      );
      await closeDialog();
      await click('[data-example-type=parental]');
      assert.equal(await evaluate('document.querySelector("#leave-type").value'), 'parental');
      await waitFor(
        'document.querySelector("#request-preview")?.getAttribute("aria-busy") === "false"',
      );
      assert.equal(
        await evaluate('document.querySelector("#request-form button[type=submit]").disabled'),
        true,
        'Unknown parental entitlement cannot be submitted',
      );
      await click('#request-type-toggle');
      for (const id of await evaluate(
        'window.VacateLeave.types.filter(type=>type.shape!=="supplement").map(type=>type.id)',
      )) {
        await evaluate(
          `document.querySelector('#leave-type').value=${JSON.stringify(id)};document.querySelector('#leave-type').dispatchEvent(new Event('change'))`,
        );
        assert.equal(
          await evaluate(
            `document.querySelector('#request-rules').textContent.includes(window.VacateLeave.getType(${JSON.stringify(id)}).allowance)`,
          ),
          true,
          `${id} reference allowance panel is stale`,
        );
      }
      await closeDialog();
      await leaveRequestAcceptance();
      for (const scope of ['self', 'team'])
        for (const view of ['year', 'month', 'week', 'day']) {
          await click(`[data-scope="${scope}"]`);
          await click(`[data-view="${view}"]`);
          assert.equal(
            await evaluate(
              `document.querySelector('[data-scope="${scope}"]').getAttribute('aria-pressed')`,
            ),
            'true',
          );
          assert.equal(
            await evaluate(
              `document.querySelector('[data-view="${view}"]').getAttribute('aria-pressed')`,
            ),
            'true',
          );
          assert.ok(
            await evaluate('document.querySelector("#calendar-content").textContent.length > 20'),
          );
          if (scope !== 'self')
            assert.equal(
              await evaluate(
                '/Vacation|Pending|Approved|sick|illness/i.test(document.querySelector("#calendar-content").textContent)',
              ),
              false,
            );
          if (scope !== 'self')
            assert.equal(
              await evaluate(
                'window.VacateLeave.types.some(type=>document.querySelector("#calendar-content").textContent.includes(type.name))',
              ),
              false,
              'Shared calendar disclosed a leave type',
            );
        }
      await click('[data-scope="self"]');
      await click('[data-view="month"]');
      // Isolate native keyboard input from the browser's earlier reportValidity popup.
      // Account/history and date-validation behavior are checked separately above.
      await load('?scope=self&view=month');
      await click('[data-date="2026-10-01"]');
      assert.match(
        await evaluate('document.querySelector("#dialog").textContent'),
        /No leave shown/,
      );
      await closeDialog();
      await click('[data-date="2026-10-26"]');
      assert.match(
        await evaluate('document.querySelector("#dialog").textContent'),
        /Annual leave · Pending/,
      );
      await evaluate('document.querySelector("#dialog").close()');
      await click('[data-scope="team"]');
      await click('#calendar-content [data-event]');
      assert.doesNotMatch(
        await evaluate('document.querySelector("#dialog-content").textContent'),
        /Vacation|Pending|Approved|sick|illness/i,
      );
      await closeDialog();
      await click('[data-view="year"]');
      await click('[data-action="next"]');
      assert.equal(await evaluate('document.querySelector("#period").textContent'), '2027');
      await click('[data-action="today"]');
      assert.equal(await evaluate('document.querySelector("#period").textContent'), '2026');
      await click('[data-action="request"]');
      await waitFor('!!document.querySelector("#request-form")');
      await closeDialog();
      const currentAccount = await evaluate(
        'window.VacateSession.currentUser().id || window.VacateSession.currentUser().personId',
      );
      assert.equal(await evaluate('!!document.querySelector(".directions")'), false);
      for (const preference of [
        { layout: 'calendar', colorScheme: 'a', name: 'calendar' },
        { layout: 'planner', colorScheme: 'c', name: 'planner' },
      ]) {
        await load('?scope=self&view=month');
        await saveDisplayPreferences(preference.layout, preference.colorScheme);
        assert.equal(
          await evaluate('document.querySelector(".app").dataset.layout'),
          preference.layout,
        );
        assert.equal(
          await evaluate('document.querySelector(".app").dataset.colorScheme'),
          preference.colorScheme,
        );
        assert.equal(
          await evaluate(
            'getComputedStyle(document.querySelector(".app")).getPropertyValue("--accent").trim()',
          ),
          preference.colorScheme === 'c' ? '#7e5b3c' : '#12675e',
        );
        const desktopLayout = await evaluate(
          '(()=>{const calendar=document.querySelector(".calendar-card").getBoundingClientRect(),annual=document.querySelector("#annual-overview").getBoundingClientRect();return {calendarTop:calendar.top,annualTop:annual.top,calendarRight:calendar.right,annualLeft:annual.left};})()',
        );
        assert.ok(
          desktopLayout.annualLeft > desktopLayout.calendarRight,
          `${preference.name} annual balance must be top right`,
        );
        assert.ok(
          Math.abs(desktopLayout.calendarTop - desktopLayout.annualTop) < 2,
          `${preference.name} annual balance must align with calendar top`,
        );
        await screenshot(`${preference.name}-desktop.png`);
        await viewport(375, 1100);
        await screenshot(`${preference.name}-mobile.png`);
        const layout = await evaluate(
          '(()=>{const calendar=document.querySelector(".calendar-card").getBoundingClientRect(),annual=document.querySelector("#annual-overview").getBoundingClientRect();return {calendarTop:calendar.top,annualTop:annual.top,calendarBottom:calendar.bottom,annualLeft:annual.left,calendarLeft:calendar.left};})()',
        );
        assert.ok(
          layout.calendarBottom <= layout.annualTop + 1,
          `${preference.name} mobile calendar must precede annual balance`,
        );
        await click('[data-nav=leave]');
        await click('.navigation-card [data-nav=balances]');
        await click('#balance-toggle');
        await click('[data-action="request"]');
        await click('#request-type-toggle');
        await evaluate(
          'document.querySelector("#leave-type").value="postgraduate";document.querySelector("#leave-type").dispatchEvent(new Event("change"))',
        );
        await click('#request-type-toggle');
        assert.equal(await evaluate('document.querySelector("#leave-type").value'), 'postgraduate');
        assert.equal(
          await evaluate(
            'document.querySelector("#dialog").scrollWidth <= document.querySelector("#dialog").clientWidth',
          ),
          true,
          `${preference.name} pinned request overflows on mobile`,
        );
        assert.equal(
          await evaluate('document.documentElement.scrollWidth <= innerWidth'),
          true,
          `${preference.name} request overflows page on mobile`,
        );
        await closeDialog();
        await click('[data-balance=annual] summary');
        assert.equal(
          await evaluate('document.documentElement.scrollWidth <= innerWidth'),
          true,
          `${preference.name} expanded balances overflow on mobile`,
        );
        await click('#balance-toggle');
        await screenshot(`${preference.name}-balances-mobile.png`);
        await click('[data-nav=calendar]');
        for (const view of ['year', 'month', 'week', 'day']) {
          await click(`[data-view="${view}"]`);
          assert.equal(
            await evaluate('document.documentElement.scrollWidth <= innerWidth'),
            true,
            `${preference.name}/${view} overflows on mobile`,
          );
        }
        await viewport(1600, 1250);
      }
      const otherAccount = currentAccount === 'nora' ? 'maya' : 'nora';
      await signOut();
      await signIn(otherAccount, otherAccount);
      await ready();
      assert.equal(await evaluate('document.querySelector(".app").dataset.layout'), 'calendar');
      assert.equal(await evaluate('document.querySelector(".app").dataset.colorScheme'), 'a');
      await signOut();
      await signIn(currentAccount, currentAccount);
      await ready();
      assert.equal(await evaluate('document.querySelector(".app").dataset.layout'), 'planner');
      assert.equal(await evaluate('document.querySelector(".app").dataset.colorScheme'), 'c');
      await saveDisplayPreferences('calendar', 'a');
      console.log('PASS: per-account display preferences, planner layout, and alternate palette');
      await load('?scope=self&view=month');
      await click('[data-action=request]');
      await evaluate(
        'document.querySelector("#start-date").value="2026-11-01";document.querySelector("#start-date").dispatchEvent(new Event("input"))',
      );
      const stalePreview = await evaluate(
        '(async()=>{await window.VacateSession.login("nora","nora");document.querySelector("#request-form").requestSubmit();return !!document.querySelector("#finish-demo");})()',
      );
      assert.equal(
        stalePreview,
        false,
        'Programmatic submit after account change must not complete stale request',
      );
      await waitFor(
        'document.readyState === "complete" && document.querySelector("[data-action=account]")?.getAttribute("aria-label") === "Nora Example, account options"',
      );
      await ready();
      assert.equal(
        await evaluate('document.querySelector("#dialog").open'),
        false,
        'Account-change submit must discard previous private draft',
      );
      assert.equal(
        await evaluate('window.VacateMock.state.scope'),
        'org',
        'Account-change submit restores the new persona default',
      );
      // VAC-12: real form, both settings entrances, account isolation and mobile.
      await signOut();
      await signIn('maya', 'maya');
      await ready();
      await click('[data-nav=settings]');
      await waitFor('!!document.querySelector("#profile-form")');
      assert.equal(await evaluate('document.querySelector("#profile-first-name").value'), 'Maya');
      assert.equal(
        await evaluate(
          'document.querySelectorAll(".membership-card input,.membership-card select,.membership-card button").length',
        ),
        0,
      );
      await evaluate(
        'document.querySelector("#profile-sole-care").click();document.querySelector("#profile-form").requestSubmit()',
      );
      await waitFor(
        'document.querySelector("#profile-error")?.textContent.includes("cannot both")',
      );
      await click('#profile-form button[type=button]');
      assert.equal(await evaluate('document.querySelector("#profile-sole-care").checked'), false);
      await evaluate(
        'document.querySelector("#profile-first-name").value="Maya Updated";document.querySelector("#profile-first-name").dispatchEvent(new Event("input"));document.querySelector("#profile-children").value="0";document.querySelector("#profile-children").dispatchEvent(new Event("input"));document.querySelector("#profile-married").click();document.querySelector("#profile-gender").value="man";document.querySelector("#profile-gender").dispatchEvent(new Event("change"))',
      );
      await click('#profile-form button[type=submit]');
      await waitFor(
        'document.querySelector("#profile-status")?.textContent.includes("Profile saved")',
      );
      assert.match(
        await evaluate(
          'document.querySelector("[data-action=account]").getAttribute("aria-label")',
        ),
        /Maya Updated/,
      );
      assert.equal(
        await evaluate('window.VacateEligibility.decisionFor("childcare").status'),
        'not-eligible',
      );
      assert.equal(
        await evaluate('window.VacateEligibility.decisionFor("marriage").status'),
        'eligible',
      );
      await screenshot('settings-desktop.png');
      await click('[data-nav=calendar]');
      await click('[data-action=account]');
      await click('#account-dropdown [data-nav=settings]');
      await waitFor('!!document.querySelector("#profile-form")');
      assert.equal(
        await evaluate('document.querySelector("#profile-first-name").value'),
        'Maya Updated',
      );
      await viewport(375, 1100);
      assert.equal(
        await evaluate('document.documentElement.scrollWidth <= innerWidth'),
        true,
        'Settings mobile overflow',
      );
      await screenshot('settings-mobile.png');
      await click('[data-action=account]');
      assert.equal(
        await evaluate(
          'document.querySelector("#account-dropdown").getBoundingClientRect().left >= 0',
        ),
        true,
      );
      await click('#account-dropdown [data-action=logout]');
      await waitFor('!!document.querySelector("#login-form")');
      await signIn('nora', 'nora');
      await ready();
      await click('[data-nav=settings]');
      await waitFor('!!document.querySelector("#profile-form")');
      assert.equal(await evaluate('document.querySelector("#profile-first-name").value'), 'Nora');
      assert.equal(
        await evaluate(
          'document.querySelectorAll(".membership-card input,.membership-card select,.membership-card button").length',
        ),
        0,
      );
      // Reload and direct entry reset in-memory edits and retain the current account.
      await viewport(1600, 1250);
      await navigate(baseUrl + '?page=settings');
      await waitFor('!!document.querySelector("#profile-form")');
      assert.equal(await evaluate('document.querySelector("#profile-first-name").value'), 'Nora');
      await signOut();
      await signIn('maya', 'maya');
      await ready();
      await navigate(baseUrl + '?page=settings');
      await waitFor('!!document.querySelector("#profile-form")');
      assert.equal(
        await evaluate('document.querySelector("#profile-first-name").value'),
        'Maya Updated',
      );
      // Restore the seeded profile through the API for repeatable later checks.
      await evaluate(
        'window.VacateSession.currentUser() && fetch(window.__vacateAcceptanceApiBase+"/users/20000000-0000-4000-8000-000000000004",{method:"PATCH",headers:{"Content-Type":"application/json",Authorization:"Bearer "+sessionStorage.getItem("vacate.session.token")},body:JSON.stringify({firstName:"Maya",gender:"woman",married:true,dependentChildren:2,soleCare:false})})',
      );
      console.log(
        'PASS: VAC-12 sidebar/avatar settings, family validation, save/cancel, name/eligibility refresh, read-only membership, keyboard/Escape, mobile, direct entry, account isolation and API persistence.',
      );
      await organizationAcceptance();
      await feedbackAcceptance();
      assert.deepEqual(errors, [], 'Unexpected browser exceptions');
      console.log(
        (process.env.MOCK_FUNCTIONAL_ONLY === '1'
          ? 'PASS: functional mode (native keyboard checks excluded); '
          : 'PASS: ') +
          'all 12 accounts and aliases; independent team/department/org rosters and denied IDs; own records and shared privacy; account resets and Back/Forward; shared 12-type country shortlist with independently expected visible profile subsets, grouped ordering, preserved drafts and pinned uncommon choices/examples; all 30 reference types / 29 catalogue request types with unavailable actions guarded; sick unknown quota and child-only scope; balance units/percentages and projections; all scope/views; calendar-first annual rail, dedicated balances route, mobile balances/requests, own profile/admin organization journeys and responsive screenshots.',
      );
    } else {
      assert.deepEqual(errors, [], 'Unexpected browser exceptions');
      console.log('PASS: isolated trusted keyboard acceptance');
    }
  }
} finally {
  clearTimeout(deadline);
  socket?.close();
  chrome.kill('SIGTERM');
  server?.close();
  await Promise.race([new Promise((resolve) => chrome.once('exit', resolve)), pause(3000)]);
  if (chrome.exitCode === null) chrome.kill('SIGKILL');
  await rm(profile, { recursive: true, force: true, maxRetries: 3, retryDelay: 200 }).catch(
    () => {},
  );
}
