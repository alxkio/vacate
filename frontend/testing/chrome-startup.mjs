import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

// Chrome publishes an ephemeral endpoint to stderr and to its fresh profile directory.
export function waitForChromeEndpoint(
  chrome,
  { profile, output, timeoutMs = 20000, pollMs = 100 },
) {
  let stderr = '';
  chrome.stderr.on('data', (chunk) => {
    stderr = (stderr + chunk.toString()).slice(-65536);
  });

  return new Promise((resolve, reject) => {
    let settled = false;
    let polling = false;
    const clean = () => {
      clearTimeout(timeout);
      clearInterval(poll);
      chrome.off('error', onError);
      chrome.off('exit', onExit);
      chrome.stderr.off('data', onData);
    };
    const succeed = (endpoint) => {
      if (settled) return;
      settled = true;
      clean();
      resolve(endpoint);
    };
    const fail = async (message) => {
      if (settled) return;
      settled = true;
      clean();
      const diagnostic = {
        message,
        executable: chrome.spawnfile,
        node: process.version,
        platform: process.platform,
        exitCode: chrome.exitCode,
        signalCode: chrome.signalCode,
        timeoutMs,
      };
      try {
        await mkdir(output, { recursive: true });
        await writeFile(
          join(output, 'chrome-startup.json'),
          JSON.stringify(diagnostic, null, 2) + '\n',
        );
        await writeFile(join(output, 'chrome-stderr.log'), stderr);
      } catch (error) {
        message += `; could not save startup diagnostics: ${error.message}`;
      }
      reject(new Error(`${message}\nChrome stderr (tail):\n${stderr.slice(-4096) || '(empty)'}`));
    };
    const onData = () => {
      const match = stderr.match(
        /DevTools listening on (ws:\/\/[^\s]+\/devtools\/browser\/[a-zA-Z0-9-]+)(?=\s)/,
      );
      if (match) succeed(match[1]);
    };
    const onError = (error) => void fail(`Chrome could not start: ${error.message}`);
    const onExit = (code, signal) =>
      void fail(`Chrome exited before debugging was ready: code=${code}, signal=${signal}`);
    const readEndpoint = async () => {
      if (settled || polling) return;
      polling = true;
      try {
        const [port, browserPath] = (await readFile(join(profile, 'DevToolsActivePort'), 'utf8'))
          .trim()
          .split(/\r?\n/);
        if (
          /^\d+$/.test(port) &&
          Number(port) > 0 &&
          Number(port) <= 65535 &&
          /^\/devtools\/browser\/[a-zA-Z0-9-]+$/.test(browserPath)
        ) {
          succeed(`ws://127.0.0.1:${port}${browserPath}`);
        }
      } catch (error) {
        if (error.code !== 'ENOENT')
          void fail(`Cannot read Chrome debugging endpoint: ${error.message}`);
      } finally {
        polling = false;
      }
    };
    const timeout = setTimeout(
      () => void fail(`Chrome debugging endpoint unavailable after ${timeoutMs}ms`),
      timeoutMs,
    );
    const poll = setInterval(() => void readEndpoint(), pollMs);
    chrome.on('error', onError);
    chrome.on('exit', onExit);
    chrome.stderr.on('data', onData);
    void readEndpoint();
  });
}
