/* 报错一致性测试：Python 抛什么异常，解释器也要抛同一种 */
const { execFileSync } = require('node:child_process');
const path = require('node:path');
const PyExec = require(path.join(__dirname, '..', 'pyexec.js'));

const cases = [
  `print(1/0)`,
  `print(x)`,
  `int("abc")`,
  `print([1,2][5])`,
  `print({"a":1}["b"])`,
  `print("a" + 1)`,
  `print("abc)`,
  `if True\n  print(1)`,
  `for i in range(3)\n    print(i`,
  `print(len(5))`,
  `x = "5"\nprint(x + 5)`,
  `def f():\nprint(1)`,
  `print([1,2].push(3))`,
  `print("abc".foo())`,
  `a, b = 1, 2, 3`,
];

let pass = 0, fail = 0;
for (const code of cases) {
  let expectedType = '';
  try {
    execFileSync('python', ['-X', 'utf8', '-c', code], { encoding: 'utf8', env: { ...process.env, PYTHONIOENCODING: 'utf-8', PYTHONUTF8: '1' } });
    expectedType = 'NO_ERROR';
  } catch (e) {
    const m = /(\w+(?:Error|Exception|Interrupt))(?::|\s|$)/.exec(String(e.stderr).split('\n').filter(Boolean).pop() || '');
    expectedType = m ? m[1] : 'UNKNOWN';
  }
  const got = PyExec.run(code);
  const actualType = got.error ? got.error.type : 'NO_ERROR';
  const ok = actualType === expectedType;
  if (ok) { pass++; }
  else {
    fail++;
    console.log(`\n--- 代码 ---\n${code}`);
    console.log(`python: ${expectedType}    pyexec: ${actualType}`);
    if (got.error) console.log(`  -> 第${got.error.line}行 ${got.error.message}`);
  }
}
console.log(`报错一致 ${pass} / ${pass + fail}`);
process.exit(fail ? 1 : 0);
