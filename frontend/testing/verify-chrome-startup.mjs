// Run with node --test; these exercise the harness without an Angular app or browser.
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { PassThrough } from 'node:stream';
import test from 'node:test';
import { waitForChromeEndpoint } from './chrome-startup.mjs';

async function fixture(t) {
  const directory = await mkdtemp(join(tmpdir(), 'vacate-chrome-startup-test-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const chrome = new EventEmitter();
  chrome.stderr = new PassThrough();
  chrome.spawnfile = '/synthetic/chrome';
  chrome.exitCode = null;
  chrome.signalCode = null;
  return { chrome, profile: directory, output: directory, timeoutMs: 200, pollMs: 5 };
}

test('discovers a stderr endpoint split across output chunks', async (t) => {
  const config = await fixture(t);
  const ready = waitForChromeEndpoint(config.chrome, config);
  config.chrome.stderr.write('DevTools listening on ws://127.0.0.1:');
  config.chrome.stderr.write('9222/devtools/browser/test-id\n');
  assert.equal(await ready, 'ws://127.0.0.1:9222/devtools/browser/test-id');
});

test('discovers the profile endpoint when Chrome does not announce it on stderr', async (t) => {
  const config = await fixture(t);
  const ready = waitForChromeEndpoint(config.chrome, config);
  await writeFile(join(config.profile, 'DevToolsActivePort'), '9223\n/devtools/browser/test-id\n');
  assert.equal(await ready, 'ws://127.0.0.1:9223/devtools/browser/test-id');
});

test('ignores a partial port file until its browser path is written', async (t) => {
  const config = await fixture(t);
  await writeFile(join(config.profile, 'DevToolsActivePort'), '9223\n');
  const ready = waitForChromeEndpoint(config.chrome, config);
  await writeFile(
    join(config.profile, 'DevToolsActivePort'),
    '9223\n/devtools/browser/complete-id\n',
  );
  assert.equal(await ready, 'ws://127.0.0.1:9223/devtools/browser/complete-id');
});

test('early exit includes Chrome stderr and saves startup diagnostics', async (t) => {
  const config = await fixture(t);
  const ready = waitForChromeEndpoint(config.chrome, config);
  config.chrome.stderr.write('browser startup failed\n');
  config.chrome.exitCode = 1;
  config.chrome.emit('exit', 1, null);
  await assert.rejects(ready, /code=1.*signal=null[\s\S]*browser startup failed/);
  assert.equal(JSON.parse(await readFile(join(config.output, 'chrome-startup.json'))).exitCode, 1);
  assert.match(
    await readFile(join(config.output, 'chrome-stderr.log'), 'utf8'),
    /browser startup failed/,
  );
});

test('missing executable reports the spawn error rather than waiting for a timeout', async (t) => {
  const config = await fixture(t);
  const ready = waitForChromeEndpoint(config.chrome, config);
  config.chrome.emit('error', new Error('spawn chrome ENOENT'));
  await assert.rejects(ready, /Chrome could not start: spawn chrome ENOENT/);
});

test('missing or invalid endpoints still fail within the original startup deadline', async (t) => {
  const config = { ...(await fixture(t)), timeoutMs: 30 };
  await writeFile(join(config.profile, 'DevToolsActivePort'), '99999\n/not-a-browser-endpoint\n');
  await assert.rejects(
    waitForChromeEndpoint(config.chrome, config),
    /Chrome debugging endpoint unavailable after 30ms/,
  );
  assert.equal(
    JSON.parse(await readFile(join(config.output, 'chrome-startup.json'))).timeoutMs,
    30,
  );
});
