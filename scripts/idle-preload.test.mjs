import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import ts from 'typescript';
import { readFileSync } from 'node:fs';
const code = ts.transpileModule(readFileSync('src/lib/idle-preload.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
}).outputText;
function setup(connection, idle = false) {
  const timers = new Map();
  let next = 1,
    loads = 0,
    eligible = true;
  const window = {
    setTimeout: (fn, delay) => {
      const id = next++;
      timers.set(id, { fn, delay });
      return id;
    },
    clearTimeout: (id) => timers.delete(id),
    addEventListener() {},
    removeEventListener() {},
  };
  if (idle) {
    window.requestIdleCallback = (fn) => window.setTimeout(fn, 0);
    window.cancelIdleCallback = window.clearTimeout;
  }
  const document = { readyState: 'complete', visibilityState: 'visible' };
  const exports = {};
  vm.runInNewContext(code, { exports, window, document, navigator: { connection } });
  const cancel = exports.scheduleIdlePreload(
    () => {
      loads++;
      return Promise.resolve();
    },
    () => eligible,
  );
  return {
    cancel,
    document,
    timers,
    loads: () => loads,
    leave: () => {
      eligible = false;
    },
    flush() {
      for (const [id, { fn }] of [...timers]) {
        timers.delete(id);
        fn();
      }
    },
  };
}
test('unknown capability browsers get one delayed bounded warmup', () => {
  const s = setup(undefined);
  assert.equal(s.timers.size, 1);
  assert.equal([...s.timers.values()][0].delay, 3000);
  s.flush();
  s.flush();
  assert.equal(s.loads(), 1);
});
test('known slow and save-data networks do not speculate', () => {
  for (const connection of [
    { effectiveType: '3g' },
    { effectiveType: '4g', saveData: true },
    { effectiveType: '4g', rtt: 400 },
    { effectiveType: '' },
  ]) {
    const s = setup(connection, true);
    s.flush();
    s.flush();
    assert.equal(s.loads(), 0);
  }
});
test('leaving, hiding and cancelling prevent fallback warmup', () => {
  for (const action of ['leave', 'hidden', 'cancel']) {
    const s = setup(undefined);
    if (action === 'hidden') s.document.visibilityState = 'hidden';
    else s[action]();
    s.flush();
    s.flush();
    assert.equal(s.loads(), 0);
  }
});
