/* 核对题库：参考答案在真实 Python 里的输出，必须与题目标注的 expected 完全一致。
 * 用法：node tools/exercises-verify.js
 */
const { execFileSync } = require('node:child_process');
const path = require('node:path');
const fs = require('node:fs');
const vm = require('node:vm');

const root = path.join(__dirname, '..');
const ctx = { window: {}, document: { readyState: 'complete', getElementById: () => null }, console };
ctx.globalThis = ctx;
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(root, 'pyexec.js'), 'utf8'), ctx);
vm.runInContext(fs.readFileSync(path.join(root, 'exercises.js'), 'utf8'), ctx);
const api = ctx.window.PythonExercises;

const norm = s => String(s).replace(/\r\n/g, '\n')
  .split('\n').map(l => l.replace(/[ \t\u3000]+$/g, '')).join('\n').replace(/\n+$/g, '');

let bad = 0;
for (const ex of api.exercises) {
  let pyOut = '';
  try {
    const input = (ex.inputs || []).join('\n') + ((ex.inputs || []).length ? '\n' : '');
    pyOut = execFileSync('python', ['-X', 'utf8', '-c', ex.solution], {
      encoding: 'utf8',
      input,
      env: { ...process.env, PYTHONIOENCODING: 'utf-8', PYTHONUTF8: '1' }
    });
  } catch (e) {
    console.log(`✗ ${ex.id} 参考答案在真实 Python 里报错了：${e.stderr}`);
    bad++;
    continue;
  }
  const same = norm(pyOut) === norm(ex.expected);
  const engine = ctx.window.PyExec.run(ex.solution, { inputs: ex.inputs || [] });
  const engineSame = norm(engine.stdout) === norm(ex.expected);
  if (!same || !engineSame) {
    bad++;
    console.log(`\n✗ ${ex.id}`);
    if (!same) {
      console.log('  expected 写的是: ' + JSON.stringify(norm(ex.expected)));
      console.log('  真实 Python 输出: ' + JSON.stringify(norm(pyOut)));
    }
    if (!engineSame) {
      console.log('  浏览器解释器输出: ' + JSON.stringify(norm(engine.stdout)));
    }
  } else {
    console.log(`✓ ${ex.id.padEnd(14)} ${ex.level}  ${JSON.stringify(norm(ex.expected)).slice(0, 60)}`);
  }
}
console.log(bad ? `\n${bad} 道题有问题` : `\n${api.exercises.length} 道题全部与真实 Python 输出一致`);
process.exit(bad ? 1 : 0);
