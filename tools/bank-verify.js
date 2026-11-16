/* 校验整个题库（原 14 题 + 扩展 55 题）：
 *   1. 每道题的参考答案必须真能通过 check()
 *   2. 每种题的初始代码必须通不过
 *   3. 输出型题的 expected 必须和真实 Python 跑出来的一致
 * 用法：node tools/bank-verify.js
 */
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { execFileSync } = require('node:child_process');

const root = path.join(__dirname, '..');
const ctx = { window: {}, document: { readyState: 'complete', getElementById: () => null }, console };
ctx.globalThis = ctx;
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(root, 'pyexec.js'), 'utf8'), ctx);
vm.runInContext(fs.readFileSync(path.join(root, 'exercises-bank.js'), 'utf8'), ctx);
vm.runInContext(fs.readFileSync(path.join(root, 'exercises.js'), 'utf8'), ctx);

const api = ctx.window.PythonExercises;
const all = api.exercises;

const norm = s => String(s).replace(/\r\n/g, '\n')
  .split('\n').map(l => l.replace(/[ \t\u3000]+$/g, '')).join('\n').replace(/\n+$/g, '');

let bad = 0, pyMismatch = 0;
for (const ex of all) {
  const pass = api.check(ex.id, ex.solution);
  if (!pass.passed) {
    bad++;
    console.log(`✗ ${ex.id} 参考答案没通过`);
    if (pass.error) console.log(`   ${pass.error.type}: ${pass.error.message}`);
    if (pass.missing && pass.missing.length) console.log(`   ${pass.missing.join(' / ')}`);
    continue;
  }
  const start = api.check(ex.id, ex.starter);
  if (start.passed) {
    bad++;
    console.log(`✗ ${ex.id} 初始代码直接就通过了`);
  }
  // 输出型：和真实 Python 对一遍
  if (ex.kind !== 'assert' && ex.expected !== undefined) {
    let py = '';
    try {
      py = execFileSync('python', ['-X', 'utf8', '-c', ex.solution], {
        encoding: 'utf8',
        input: (ex.inputs || []).map(String).join('\n') + ((ex.inputs || []).length ? '\n' : ''),
        env: { ...process.env, PYTHONIOENCODING: 'utf-8', PYTHONUTF8: '1' }
      });
    } catch (e) {
      pyMismatch++;
      console.log(`✗ ${ex.id} 在真实 Python 里报错: ${String(e.stderr).split('\n').pop()}`);
      continue;
    }
    if (norm(py) !== norm(ex.expected)) {
      pyMismatch++;
      console.log(`✗ ${ex.id} expected 与真实 Python 输出不一致`);
      console.log(`   expected: ${JSON.stringify(norm(ex.expected))}`);
      console.log(`   python  : ${JSON.stringify(norm(py))}`);
    }
  }
}

console.log(`\n题库共 ${all.length} 道（断言型 ${all.filter(e => e.kind === 'assert').length}、输出型 ${all.filter(e => e.kind !== 'assert').length}）`);
console.log(`难度：`, all.reduce((m, e) => (m[e.level] = (m[e.level] || 0) + 1, m), {}));
console.log(`参考答案问题 ${bad} 个，输出对不上 ${pyMismatch} 个`);
process.exit(bad + pyMismatch ? 1 : 0);
