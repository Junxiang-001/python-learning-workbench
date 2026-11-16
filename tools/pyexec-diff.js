/* 差分测试：同一段代码分别交给真实 Python 和浏览器解释器，比对输出。
 * 用法：node tools/pyexec-diff.js
 */
const { execFileSync } = require('node:child_process');
const path = require('node:path');
const PyExec = require(path.join(__dirname, '..', 'pyexec.js'));

const cases = [
  // 基础输出
  `print("你好，Python！")`,
  `print(1 + 2 * 3)`,
  `print(10 / 4)`,
  `print(10 // 3, 10 % 3, 2 ** 10)`,
  `print(7 / 2)`,
  `print(2.0)`,
  `print(0.1 + 0.2)`,
  `print(True, False, None)`,
  `print("a", 1, 2.5)`,

  // 变量与类型
  `name = "小明"\nprint("你好，" + name)`,
  `a = 8\nb = 5\nprint(a + b)`,
  `x = 5\nx += 3\nprint(x)`,
  `n = 3\nn *= 2\nprint(n)`,
  `print(type(3), type("a"), type(3.5), type(True))`,
  `print(int("42") + 8)`,
  `print(float("3.14") * 2)`,
  `print(str(99) + "分")`,
  `a, b = 1, 2\nprint(a, b)`,

  // f-string
  `name, score = "小明", 95.567\nprint(f"{name}考了{score}分")`,
  `score = 95.567\nprint(f"保留两位: {score:.2f}")`,
  `print(f"百分比: {0.856:.1%}")`,
  `print(f"补零: {7:03d}")`,
  `print(f"千分位: {1234567:,}")`,
  `x = 3\nprint(f"{x + 1} 和 {x * 2}")`,

  // 判断
  `score = 85\nif score >= 90:\n    print("A")\nelif score >= 80:\n    print("B")\nelse:\n    print("C")`,
  `age = 20\nhas_id = True\nif age >= 18 and has_id:\n    print("可以")`,
  `x = 0\nif not x:\n    print("假")`,

  // 循环
  `for i in range(5):\n    print(i)`,
  `for i in range(1, 10, 2):\n    print(i)`,
  `n = 0\nwhile n < 3:\n    n += 1\n    print(n)`,
  `for i in range(10):\n    if i == 2:\n        continue\n    if i > 4:\n        break\n    print(i)`,
  `total = 0\nfor i in range(1, 101):\n    total += i\nprint(total)`,
  `for i in range(1, 4):\n    for j in range(1, i + 1):\n        print(f"{j}*{i}={i*j}", end=" ")\n    print()`,
  `for i, name in enumerate(["A", "B"]):\n    print(i, name)`,
  `s = 0\nfor x in [1, 2, 3, 4]:\n    s += x\nprint(s)`,

  // 字符串
  `s = "  Hello,Python  "\nprint(s.strip())`,
  `s = "a,b,c"\nprint(s.split(","))`,
  `print("-".join(["a", "b", "c"]))`,
  `s = "Hello"\nprint(s.upper(), s.lower(), len(s))`,
  `print("abc".replace("b", "X"))`,
  `print("Python".find("t"))`,
  `s = "hello"\nprint(s[0], s[-1], s[1:3], s[::-1])`,

  // 列表
  `a = [3, 1, 4, 1, 5]\na.append(9)\nprint(a)`,
  `a = [3, 1, 4]\na.sort()\nprint(a)`,
  `a = [1, 2, 3]\nprint(a[1:], a[:-1], len(a), sum(a), max(a), min(a))`,
  `a = [1, 2, 3]\na[0] = 99\nprint(a)`,
  `print([x ** 2 for x in range(5)])`,
  `print([x for x in range(20) if x % 2 == 0])`,
  `print(sorted([3, 1, 2], reverse=True))`,
  `print(list(range(3)))`,
  `a = [[0] * 3 for _ in range(2)]\nprint(a)`,

  // 字典
  `d = {"name": "小明", "age": 18}\nprint(d["name"], d.get("age"))`,
  `d = {"a": 1}\nd["b"] = 2\nprint(d)`,
  `d = {"a": 1, "b": 2}\nfor k, v in d.items():\n    print(k, v)`,
  `d = {"a": 1}\nprint(list(d.keys()), list(d.values()))`,
  `d = {"a": 1}\nprint("a" in d, d.get("z", 0))`,

  // 集合
  `a = {1, 2, 3}\nb = {2, 3, 4}\nprint(sorted(a & b), sorted(a | b), sorted(a - b))`,

  // 函数
  `def greet(name, msg="你好"):\n    return f"{msg}, {name}!"\nprint(greet("小明"))\nprint(greet("Tom", msg="Hi"))`,
  `def total(*nums):\n    return sum(nums)\nprint(total(1, 2, 3))`,
  `def add(a, b):\n    return a + b\nprint(add(2, 3))`,
  `def fact(n):\n    if n <= 1:\n        return 1\n    return n * fact(n - 1)\nprint(fact(5))`,
  `sq = lambda x: x ** 2\nprint(sq(4))`,
  `def f(x, lst=None):\n    if lst is None:\n        lst = []\n    lst.append(x)\n    return lst\nprint(f(1), f(2))`,

  // 类
  `class Student:\n    def __init__(self, name, score):\n        self.name = name\n        self.score = score\n    def report(self):\n        return f"{self.name}: {self.score}"\ns = Student("小明", 98)\nprint(s.report())`,
  `class A:\n    def __init__(self):\n        self.x = 1\n    def inc(self):\n        self.x += 1\n        return self.x\na = A()\nprint(a.inc(), a.inc())`,

  // 异常
  `try:\n    n = int("abc")\nexcept ValueError:\n    print("请输入数字")`,
  `try:\n    print(1 / 0)\nexcept ZeroDivisionError:\n    print("不能除以0")`,
  `try:\n    print("ok")\nfinally:\n    print("结束")`,

  // 数学
  `import math\nprint(math.sqrt(16))`,
  `print(abs(-5), round(3.567, 2), max([1, 5, 3]))`,

  // 综合
  `prices = [12.5, 8, 30]\ntotal = 0\nfor p in prices:\n    total += p\nprint(f"合计: {total:.2f} 元")`,
  `records = [{"n": "A", "v": 3}, {"n": "B", "v": 7}]\ntotal = sum(r["v"] for r in records) if False else 0\nfor r in records:\n    total += r["v"]\nprint(total)`,
  `words = ["apple", "Banana", "cherry"]\nprint([w.lower() for w in words if len(w) > 5])`,
  `print(sum(x for x in range(10)))`,
  `print(sum(r["v"] for r in [{"v": 3}, {"v": 7}]))`,

  // 第二批：更贴近练习场的写法
  `print("%s 考了 %d 分" % ("小明", 95))`,
  `print("%.2f" % 3.14159)`,
  `name = "小明"\nage = 18\nprint("我叫" + name + "，今年" + str(age) + "岁")`,
  `a = [1, 2, 3]\nprint(a * 2, "ab" * 3)`,
  `print(1, 2, 3, sep="-")`,
  `print("不换行", end="")`,
  `d = {"a": 1, "b": 2}\nfor k in d:\n    print(k, d[k])`,
  `print({k: v * 2 for k, v in {"a": 1, "b": 2}.items()})`,
  `x = 5\nprint("大" if x > 3 else "小")`,
  `n = 0\nwhile True:\n    n += 1\n    if n > 3:\n        break\nprint(n)`,
  `a, b = 1, 2\na, b = b, a\nprint(a, b)`,
  `s = "a"\ns += "b"\nprint(s)`,
  `print(3 in [1, 2, 3], "a" in "abc")`,
  `价格 = 12.5\n数量 = 3\nprint(f"总价 {价格 * 数量} 元")`,
  `def calc(price, count=1, rate=0.1):\n    return price * count * (1 + rate)\nprint(calc(100))\nprint(calc(100, 2))\nprint(calc(100, rate=0.2))`,
  `nums = [5, 3, 8, 1]\nnums.sort(reverse=True)\nprint(nums)`,
  `print(max(3, 7, 9), min([4, 2, 8]))`,
  `s = "2026-11-06"\nprint(s.split("-"))`,
  `lines = ["a\\n", "b\\n"]\nprint("".join(x.strip() for x in lines))`,
  `total = 0\nfor i in range(1, 6):\n    if i % 2 == 0:\n        continue\n    total += i\nprint(total)`,
  `words = ["Python", "is", "fun"]\nprint(" ".join(words))`,
  `n = 7\nprint("偶数" if n % 2 == 0 else "奇数")`,
  `a = [1, 2, 3]\nb = a\nb.append(4)\nprint(a)`,
  `print(len("中文"))`,
  `print(str(3.0), int(3.9), round(2.5))`,
  `class Dog:\n    def __init__(self, name):\n        self.name = name\n    def bark(self):\n        return self.name + "：汪"\nd = Dog("旺财")\nprint(d.bark())`,
  `class Counter:\n    def __init__(self):\n        self.n = 0\n    def add(self, k=1):\n        self.n += k\n        return self.n\nc = Counter()\nc.add()\nc.add(5)\nprint(c.n)`,
];

let pass = 0, fail = 0;
const failures = [];
for (const code of cases) {
  let expected;
  try {
    expected = execFileSync('python', ['-X', 'utf8', '-c', code], {
      encoding: 'utf8',
      env: { ...process.env, PYTHONIOENCODING: 'utf-8', PYTHONUTF8: '1' }
    }).replace(/\r\n/g, '\n').replace(/\n$/, '');
  } catch (e) {
    expected = '__PYTHON_ERROR__';
  }
  const got = PyExec.run(code);
  const actual = got.error ? '__PYTHON_ERROR__' : got.stdout;
  if (actual === expected) { pass++; }
  else {
    fail++;
    failures.push({ code, expected, actual, err: got.error });
  }
}
console.log(`通过 ${pass} / ${pass + fail}`);
for (const f of failures) {
  console.log('\n--- 代码 ---\n' + f.code);
  console.log('期望(python): ' + JSON.stringify(f.expected));
  console.log('实际(pyexec): ' + JSON.stringify(f.actual));
  if (f.err) console.log('报错: ' + f.err.type + ' 第' + f.err.line + '行 ' + f.err.message);
}
process.exit(fail ? 1 : 0);
