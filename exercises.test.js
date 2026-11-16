/* 练习场逻辑测试：node exercises.test.js
 * 关键断言：每道题的参考答案必须真能通过，初始代码必须过不了。
 * 任何一条挂掉，说明题库或判分有虚假通过。
 */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = __dirname;
const context = {
  window: {},
  document: { readyState: "complete", getElementById: () => null },
  console,
};
context.globalThis = context;
vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(root, 'pyexec.js'), 'utf8'), context);
vm.runInContext(fs.readFileSync(path.join(root, 'exercises-bank.js'), 'utf8'), context);
vm.runInContext(fs.readFileSync(path.join(root, 'exercises.js'), 'utf8'), context);

const api = context.window.PythonExercises;
assert.ok(api, 'exercises.js 应当导出 PythonExercises');
assert.ok(context.window.PyExec, 'pyexec.js 应当导出 PyExec');
assert.equal(api.exercises.length >= 60, true, '题库至少有 60 题');

const seen = new Set();
for (const ex of api.exercises) {
  assert.ok(!seen.has(ex.id), `题目 id 重复: ${ex.id}`);
  seen.add(ex.id);
  for (const field of ['title', 'level', 'concept', 'prompt', 'condition', 'starter', 'solution']) {
    assert.ok(typeof ex[field] === 'string' && ex[field].length > 0, `${ex.id} 缺字段 ${field}`);
  }
  assert.ok(['入门', '进阶', '挑战'].includes(ex.level), `${ex.id} 难度标签不合法: ${ex.level}`);
  assert.ok(Array.isArray(ex.hints) && ex.hints.length >= 2, `${ex.id} 至少要有 2 条渐进提示`);

  // 参考答案必须通过
  const pass = api.check(ex.id, ex.solution);
  assert.equal(pass.passed, true, `${ex.id} 的参考答案没通过，判分有 bug：${JSON.stringify(pass.missing)}`);

  // 初始代码必须通不过（否则这道题等于白送）
  const fail = api.check(ex.id, ex.starter);
  assert.equal(fail.passed, false, `${ex.id} 的初始代码竟然直接通过`);
}

// 判分细节
const hello = api.check('hello', 'print("你好，Python！")');
assert.equal(hello.passed, true);
assert.equal(hello.stdout, '你好，Python！');

const wrongText = api.check('hello', 'print("你好")');
assert.equal(wrongText.passed, false);
assert.equal(wrongText.error, null, '输出不对但不该当成报错');

const syntaxErr = api.check('hello', 'print("abc');
assert.equal(syntaxErr.status, 'error');
assert.equal(syntaxErr.error.type, 'SyntaxError');
assert.ok(syntaxErr.error.line >= 1, '语法错误要带行号');

const nameErr = api.check('hello', 'print(abc)');
assert.equal(nameErr.status, 'error');
assert.equal(nameErr.error.type, 'NameError');

// 输出对但没用变量 —— 必须判不通过并给出原因
const noVar = api.check('vars', 'print("你好，小明")');
assert.equal(noVar.outputOk, true, '输出本身是对的');
assert.equal(noVar.passed, false, '没用变量就不该算通过');
assert.match(noVar.missing.join(' '), /变量/);

// 输出对但没用循环
const noLoop = api.check('loop-range', 'print(1)\nprint(2)\nprint(3)\nprint(4)\nprint(5)');
assert.equal(noLoop.outputOk, true);
assert.equal(noLoop.passed, false);
assert.match(noLoop.missing.join(' '), /循环/);

// 用了 sum() 偷懒
const cheat = api.check('list-total', 'amounts = [12, 7, 30]\nprint(sum(amounts))');
assert.equal(cheat.outputOk, true);
assert.equal(cheat.passed, false, '这题不许用 sum()');

// 模拟输入
const withInput = api.check('input-sum', 'a = int(input())\nb = int(input())\nprint(a + b)');
assert.equal(withInput.passed, true, 'input 题应当能读到模拟输入');

// 空代码
const empty = api.check('hello', '   ');
assert.equal(empty.passed, false);

// 不存在的题
assert.equal(api.check('nope', 'print(1)').passed, false);

// 传入空值不应抛异常
assert.equal(api.check('hello', null).passed, false);

// 结构要求必须来自真实代码，注释和字符串不能伪造，也不能误伤合法写法。
// [名称, 题目 id, 代码, 是否应通过]；所有例子的输出本身都正确。
const structureCases = [
  ['vars 注释伪造变量使用', 'vars', 'name = "小明"\nprint("你好，小明")  # print(name)', false],
  ['vars 字符串伪造变量使用', 'vars', 'name = "小明"\nprint("你好，小明")\n"print(name)"', false],
  ['calc 注释伪造变量相加', 'calc', 'a = 8\nb = 5\nprint(13)  # print(a + b)', false],
  ['calc 字符串伪造变量相加', 'calc', 'a = 8\nb = 5\nprint(13)\n"print(a + b)"', false],
  ['input-sum 直接写死结果', 'input-sum', 'print(42)', false],
  ['input-sum 注释伪造 int', 'input-sum', 'print(42)  # int(input())', false],
  ['input-sum 字符串伪造 int', 'input-sum', 'print(42)\n"int(input())"', false],
  ['input-sum 三引号字符串伪造 int', 'input-sum', 'print(42)\n"""\nint(input())\n"""', false],
  ['fstring 普通字符串伪造插值', 'fstring', 'name = "小明"\nscore = 95\nprint("小明 考了 95 分")\n\'f"{name}\'', false],
  ['branch 注释伪造分支', 'branch', 'score = 85\nprint("B")  # if ... elif ...', false],
  ['str-clean 注释伪造方法调用', 'str-clean', 's = "  Hello,Python  "\nprint("hello|python")  # strip() split() lower()', false],
  ['dict-sum 字符串伪造遍历和判断', 'dict-sum', 'record = {"工资": 1200, "房租": 800, "奖金": 1500}\nprint(2700)\n"record.items() if amount > 1000"', false],
  ['func-def 注释伪造默认参数', 'func-def', 'def calc(price, count):\n    return price * count\nprint(calc(12.5, 3))  # count=1', false],
  ['own-str-format 字符串伪造格式说明符', 'own-str-format', 'amount = 1234567.891\nprint("1,234,567.89 元")\n":,.2f"', false],
  ['own-str-slice 字符串伪造切片', 'own-str-slice', 's = "财务部的Python"\nprint("财务部")\n"[:3]"', false],
  ['own-list-append 注释伪造 append', 'own-list-append', 'print(3)\nprint(6)\nprint(9)  # nums.append(3)', false],
  ['own-max-min 注释伪造 max 和 min', 'own-max-min', 'scores = [78, 92, 65, 88]\nprint("最高 92，最低 65")  # max(scores) min(scores)', false],
  ['own-comprehension 字符串伪造推导式', 'own-comprehension', 'print("[3, 6, 9, 12, 15, 18]")\n"[x for x in range(1, 21) if x % 3 == 0]"', false],
  ['own-set-diff 注释伪造差集', 'own-set-diff', 'print("李四")  # all_people - arrived', false],
  ['own-dict-count 字符串伪造 get', 'own-dict-count', 'words = ["苹果", "香蕉", "苹果", "橙子", "苹果"]\nprint("{\'苹果\': 3, \'香蕉\': 1, \'橙子\': 1}")\n"counts.get(w, 0)"', false],
  ['own-try 注释伪造异常处理', 'own-try', 'text = "abc"\nprint("输入不是数字")  # try: ... except ValueError:', false],
  ['own-class-simple 字符串伪造类结构', 'own-class-simple', 'print("书名：Python入门，价格：59")\n"class Book def info __init__"', false],
  ['vars f-string 是合法变量使用', 'vars', 'name = "小明"\nprint(f"你好，{name}")', true],
  ['calc 字符串出现其他代码不影响合法答案', 'calc', 'a = 8\nb = 5\nnote = "print(13)"\nprint(a + b)', true],
  ['input-sum 分步转换是合法答案', 'input-sum', 'a = input()\nb = input()\na = int(a)\nb = int(b)\nprint(a + b)', true],
  ['list-total 注释提到 sum 不误伤', 'list-total', 'amounts = [12, 7, 30]\ntotal = 0\nfor amount in amounts:\n    total += amount\nprint(total)\n# 不要直接调用 sum()', true],
  ['list-total 字符串提到 sum 不误伤', 'list-total', 'amounts = [12, 7, 30]\ntotal = 0\nfor amount in amounts:\n    total += amount\nprint(total)\n"sum() 是另一种写法"', true],
  ['own-max-min f-string 表达式是合法调用', 'own-max-min', 'scores = [78, 92, 65, 88]\nprint(f"最高 {max(scores)}，最低 {min(scores)}")', true],
];
const structureFailures = [];
for (const [name, id, code, expected] of structureCases) {
  const result = api.check(id, code);
  if (result.outputOk !== true) {
    structureFailures.push(name + '：测试前提失效，输出本身不正确');
  } else if (result.passed !== expected) {
    structureFailures.push(name + '：期望 passed=' + expected + '，实际=' + result.passed);
  }
}
assert.deepEqual(structureFailures, [], '结构校验回归失败：\n' + structureFailures.join('\n'));

console.log(`exercises 测试通过：${api.exercises.length} 道题，参考答案全通过、初始代码全不通过；${structureCases.length} 条结构回归通过`);
