/* exercises.js —— 练习场
 *
 * 和旧版的区别：不再用正则猜你写对没有，而是把代码交给 pyexec.js 真跑一遍，
 * 拿真实输出和真实报错来判定。判分分三层：
 *   1. 能不能跑（语法 / 运行时错误，带行号和中文解释）
 *   2. 输出对不对（和真实 Python 的输出逐行比）
 *   3. 结构对不对（该用循环的用了没、该用变量的用没）
 * 三层都过才算通过。
 */
(function () {
  "use strict";

  /* ============================================================
     题库 —— expected 全部由真实 Python 3.14 跑出来核对过
     ============================================================ */
  const EXERCISES = [
    {
      id: "hello",
      chapter: "ch01",
      level: "入门",
      title: "打印第一句话",
      concept: "print() 把括号里的内容显示到屏幕上。文字要放在引号里，否则 Python 会当成变量名去找。",
      prompt: "用 print() 输出这个句子：你好，Python！",
      condition: "运行后屏幕上出现「你好，Python！」，标点要用中文全角（，和！）。",
      starter: "# 在下面写你的第一行代码\n",
      expected: "你好，Python！",
      hints: [
        "print 后面要跟一对英文括号，文字放在引号里。",
        "括号和引号都必须是英文半角的：print(\"...\")，不是 print（\"...\"）。",
        'print("你好，Python！")'
      ],
      solution: 'print("你好，Python！")',
      solutionNote: "print(内容) —— 括号里的内容会被显示出来。"
    },
    {
      id: "vars",
      chapter: "ch02",
      level: "入门",
      title: "变量就是贴标签",
      concept: "name = \"小明\" 是把「小明」贴上 name 这张便利贴。之后写 name，就等于写小明的名字。",
      prompt: "定义变量 name 为「小明」，然后输出：你好，小明",
      condition: "必须用变量 name 拼出这句话——把「小明」直接写死在 print 里不算。",
      starter: 'name = "小明"\n# 用 name 拼出「你好，小明」\n',
      expected: "你好，小明",
      checks: [
        {
          test: (code) => /print\s*\([^)]*\bname\b/.test(code),
          message: "输出对了，但没用上变量：print 里要出现 name，而不是把「小明」直接写进去。变量的意义就是改一处、处处生效。"
        }
      ],
      hints: [
        "把固定文字和变量用 + 拼起来。",
        'print("你好，" + name)',
        '也可以写成 f-string：print(f"你好，{name}")'
      ],
      solution: 'name = "小明"\nprint("你好，" + name)',
      solutionNote: "字符串 + 字符串 是拼接；字符串 + 数字会报错，要先 str()。"
    },
    {
      id: "fstring",
      chapter: "ch03",
      level: "入门",
      title: "f-string 填空",
      concept: "字符串前加 f，花括号里可以直接写变量或表达式——这是 Python 现在最推荐的写法。",
      prompt: '已知 name = "小明"、score = 95，输出：小明 考了 95 分',
      condition: "必须用 f-string（字符串前面有 f，变量放在花括号里）。",
      starter: 'name = "小明"\nscore = 95\n# 用 f-string 输出：小明 考了 95 分\n',
      expected: "小明 考了 95 分",
      checks: [
        {
          test: (code) => /f["'][^"']*\{/.test(code),
          message: "输出对了，但没用 f-string：这题要求字符串前加 f，把变量写进花括号里。"
        }
      ],
      hints: [
        '写法是 print(f"...{变量}...")，f 要紧贴在引号前面。',
        'print(f"{name} 考了 {score} 分")',
        '注意花括号是 { }，不是中文的｛｝，也不是圆括号。'
      ],
      solution: 'name = "小明"\nscore = 95\nprint(f"{name} 考了 {score} 分")',
      solutionNote: "f-string 让「文字 + 变量」不用再拆开拼接，读起来就是一句话。"
    },
    {
      id: "calc",
      chapter: "ch02",
      level: "入门",
      title: "让 Python 当计算器",
      concept: "Python 支持 + - * / // % ** 这些运算，括号优先，和数学一样。",
      prompt: "创建 a = 8、b = 5，输出 a + b 的结果。",
      condition: "输出 13，并且代码里要真的出现变量 a 和 b。",
      starter: "a = 8\nb = 5\n# 输出 a 加 b\n",
      expected: "13",
      checks: [
        {
          test: (code) => /print\s*\(\s*a\s*\+\s*b\s*\)/.test(code),
          message: "输出对了，但没用变量相加：要写 print(a + b)，而不是直接 print(13)。"
        }
      ],
      hints: ["print 里可以直接写算式。", "print(a + b)"],
      solution: "a = 8\nb = 5\nprint(a + b)",
      solutionNote: "尝试改成 a - b、a * b、a / b，看看 / 的结果为什么带小数点。"
    },
    {
      id: "input-sum",
      chapter: "ch03",
      level: "入门",
      title: "接收输入再计算",
      concept: "input() 拿到的是字符串，要算数必须先 int() 转成整数。这是零基础最常踩的坑。",
      prompt: "用 input() 读两次输入，输出这两个数相加的结果。（本题模拟输入：12 和 30）",
      condition: "输出 42，并且代码里必须用 int() 转换过输入。",
      starter: "# 读两个数，相加\n",
      expected: "42",
      inputs: ["12", "30"],
      checks: [
        {
          test: (code) => /\bint\s*\(\s*(input|.*input)/.test(code) || /\bint\s*\(\s*\w+\s*\)/.test(code),
          message: "输出对了，但如果没写 int()，一旦输入变成 3 和 4，你会得到 \"34\" 而不是 7。试试改成 int(input())。"
        }
      ],
      hints: [
        "a = int(input()) 这样一步到位：input 读进来，int 转成数字。",
        "两个 input() 会按顺序各读一行。",
        "a = int(input())\nb = int(input())\nprint(a + b)"
      ],
      solution: "a = int(input())\nb = int(input())\nprint(a + b)",
      solutionNote: "去掉 int() 再运行一次，看输出变成什么——这就是「字符串相加是拼接」。"
    },
    {
      id: "branch",
      chapter: "ch04",
      level: "入门",
      title: "成绩分级",
      concept: "if / elif / else 从上往下判断，命中一个就走人，后面的不再看。",
      prompt: '已知 score = 85，按规则输出等级：90 分及以上输出 A，80 分及以上输出 B，其余输出 C。',
      condition: "输出 B，并且代码里要用 if 和 elif。",
      starter: "score = 85\n# 按分数输出等级\n",
      expected: "B",
      checks: [
        {
          test: (code) => /\bif\b/.test(code) && /\belif\b/.test(code),
          message: "输出对了，但这题要练分支结构：请用 if / elif / else，而不是直接 print(\"B\")。"
        }
      ],
      hints: [
        "先判断 score >= 90，再 elif score >= 80，最后 else。",
        "每个条件后面都要有英文冒号，然后换行缩进 4 个空格。",
        'if score >= 90:\n    print("A")\nelif score >= 80:\n    print("B")\nelse:\n    print("C")'
      ],
      solution: 'score = 85\nif score >= 90:\n    print("A")\nelif score >= 80:\n    print("B")\nelse:\n    print("C")',
      solutionNote: "把 score 改成 95 和 50 各跑一次，验证三个分支都通。"
    },
    {
      id: "loop-range",
      chapter: "ch05",
      level: "入门",
      title: "让循环重复干活",
      concept: "for i in range(1, 6) 会依次取 1、2、3、4、5——range 含头不含尾，这是最容易记错的地方。",
      prompt: "用 for 循环输出 1 到 5，每个数字占一行。",
      condition: "输出 5 行：1、2、3、4、5，且必须用 for 循环。",
      starter: "# 用 for 循环输出 1 到 5\n",
      expected: "1\n2\n3\n4\n5",
      checks: [
        {
          test: (code, uses) => uses.for >= 1,
          message: "输出对了，但这题要练循环：请用 for 循环输出，而不是写五行 print。"
        }
      ],
      hints: [
        "range(1, 6) 会产生 1 到 5。",
        "for i in range(1, 6): 下面缩进写 print(i)。",
        "for i in range(1, 6):\n    print(i)"
      ],
      solution: "for i in range(1, 6):\n    print(i)",
      solutionNote: "range 的终点不包含在内。要 1 到 5 就写 range(1, 6)。"
    },
    {
      id: "while-sum",
      chapter: "ch05",
      level: "进阶",
      title: "用 while 累加",
      concept: "while 适合「不知道要循环多少次」的场景。写 while 时，先想好条件怎么变成 False，否则就是死循环。",
      prompt: "用 while 循环计算 1 + 2 + 3 + … + 100 的结果并输出。",
      condition: "输出 5050，必须用 while，不能用 sum(range(...)) 直接算。",
      starter: "# 用 while 求 1 到 100 的和\n",
      expected: "5050",
      checks: [
        {
          test: (code, uses) => uses.while >= 1,
          message: "输出对了，但这题要练 while：请用 while 循环累加，而不是 sum() 或 for。"
        }
      ],
      hints: [
        "需要一个变量记总数，一个变量记当前数字。",
        "每轮把当前数字加到总数上，然后把数字 +1，这样条件最终会变 False。",
        "total = 0\ni = 1\nwhile i <= 100:\n    total += i\n    i += 1\nprint(total)"
      ],
      solution: "total = 0\ni = 1\nwhile i <= 100:\n    total += i\n    i += 1\nprint(total)",
      solutionNote: "试着把 i += 1 删掉再运行——解释器会告诉你死循环，这就是 while 最经典的事故。"
    },
    {
      id: "list-total",
      chapter: "ch07",
      level: "进阶",
      title: "遍历列表求和",
      concept: "列表是有序的容器。for x in 列表 会把每个元素依次取出来，不需要管下标。",
      prompt: "已知 amounts = [12, 7, 30]，用循环把它们加起来并输出总和。",
      condition: "输出 49，必须用 for 遍历列表，不能用 sum()。",
      starter: "amounts = [12, 7, 30]\n# 用循环求总和\n",
      expected: "49",
      checks: [
        {
          test: (code, uses) => uses.for >= 1 && !/sum\s*\(/.test(code),
          message: "这题要练「手动遍历」：用 for 一个个累加，不要直接 sum()。真实项目里该用 sum，练习里得先知道它替你做了什么。"
        }
      ],
      hints: [
        "先设 total = 0，再依次加上每个元素。",
        "for amount in amounts: 然后把 amount 加到 total 上。",
        "amounts = [12, 7, 30]\ntotal = 0\nfor amount in amounts:\n    total += amount\nprint(total)"
      ],
      solution: "amounts = [12, 7, 30]\ntotal = 0\nfor amount in amounts:\n    total += amount\nprint(total)",
      solutionNote: "看懂之后再写 print(sum(amounts))，你就知道 sum 替你做了什么。"
    },
    {
      id: "str-clean",
      chapter: "ch07",
      level: "进阶",
      title: "清洗一段脏文本",
      concept: "字符串不可变：strip / split / lower 都返回新字符串，必须用变量接住，原字符串不会变。",
      prompt: '已知 s = "  Hello,Python  "，去掉两端空格、按逗号切开、全部转小写，然后用 | 把两段拼起来输出。',
      condition: "输出 hello|python，必须用上 strip、split、lower 和 join。",
      starter: 's = "  Hello,Python  "\n# 清洗后输出 hello|python\n',
      expected: "hello|python",
      checks: [
        {
          test: (code) => /strip\s*\(/.test(code) && /split\s*\(/.test(code) && /lower\s*\(/.test(code),
          message: "输出对了，但没走完这题要练的四步：strip() 去空格、split() 切分、lower() 转小写、join() 拼回去。"
        }
      ],
      hints: [
        "strip() 去掉两端空白，split(\",\") 按逗号切成列表。",
        "切完是 [\"Hello\", \"Python\"]，再对每个元素 lower()。",
        's = "  Hello,Python  "\nparts = s.strip().split(",")\nresult = "|".join(p.lower() for p in parts)\nprint(result)'
      ],
      solution: 's = "  Hello,Python  "\nparts = s.strip().split(",")\nresult = "|".join(p.lower() for p in parts)\nprint(result)',
      solutionNote: "也可以用列表推导式：[p.lower() for p in parts]，两种写法都对。"
    },
    {
      id: "dict-sum",
      chapter: "ch08",
      level: "进阶",
      title: "按条件汇总字典",
      concept: "字典是键值对，遍历用 .items() 一次拿到键和值。查键用 [] 会报错，用 .get() 更安全。",
      prompt: "已知 record = {\"工资\": 1200, \"房租\": 800, \"奖金\": 1500}，把所有金额大于 1000 的项相加并输出。",
      condition: "输出 2700，必须遍历字典，并且用条件判断筛掉小于等于 1000 的项。",
      starter: 'record = {"工资": 1200, "房租": 800, "奖金": 1500}\n# 汇总金额大于 1000 的项\n',
      expected: "2700",
      checks: [
        {
          test: (code) => /\.items\s*\(\s*\)/.test(code) && /\bif\b/.test(code),
          message: "输出对了，但这题要练字典遍历 + 条件筛选：请用 for ... in record.items() 配合 if 判断。"
        }
      ],
      hints: [
        "for name, amount in record.items(): 能同时拿到键和值。",
        "在循环里 if amount > 1000: 才累加。",
        'total = 0\nfor name, amount in record.items():\n    if amount > 1000:\n        total += amount\nprint(total)'
      ],
      solution: 'record = {"工资": 1200, "房租": 800, "奖金": 1500}\ntotal = 0\nfor name, amount in record.items():\n    if amount > 1000:\n        total += amount\nprint(total)',
      solutionNote: "这就是「筛选 + 汇总」的最小原型，财务对账天天用这个形状。"
    },
    {
      id: "func-def",
      chapter: "ch06",
      level: "进阶",
      title: "把重复的算法装进函数",
      concept: "函数 = 名字 + 参数 + 返回值。写三遍以上就该抽成函数，这是 DRY 原则。",
      prompt: "定义函数 calc(price, count=1)，返回 price * count。然后输出 calc(12.5, 3) 的结果。",
      condition: "输出 37.5，必须定义函数，并且 count 要有默认值 1。",
      starter: "# 定义 calc 函数\n",
      expected: "37.5",
      checks: [
        {
          test: (code, uses) => uses.def >= 1 && /count\s*=\s*1/.test(code),
          message: "输出对了，但没按要求定义函数：需要有 def calc(price, count=1) 这样的默认参数。"
        }
      ],
      hints: [
        "def calc(price, count=1): 冒号换行缩进，return 结果。",
        "默认参数写在参数名后面用等号连，调用时不传就用默认值。",
        "def calc(price, count=1):\n    return price * count\n\nprint(calc(12.5, 3))"
      ],
      solution: "def calc(price, count=1):\n    return price * count\n\nprint(calc(12.5, 3))",
      solutionNote: "再试试 print(calc(12.5))，看默认参数怎么起作用的。"
    },
    {
      id: "nine-nine",
      chapter: "ch05",
      level: "挑战",
      title: "九九乘法表",
      concept: "嵌套循环：外层管行，内层管这一行有几列。几乎所有中国程序员的第一个嵌套循环都是它。",
      prompt: "用嵌套 for 循环输出九九乘法表的 9 行，每行形如 1*1=1，列之间用空格分隔。",
      condition: "输出 9 行，最后一行为 1*9=9 2*9=18 … 9*9=81，必须有嵌套循环。",
      starter: "# 外层 i 从 1 到 9，内层 j 从 1 到 i\n",
      expected: [
        "1*1=1",
        "1*2=2 2*2=4",
        "1*3=3 2*3=6 3*3=9",
        "1*4=4 2*4=8 3*4=12 4*4=16",
        "1*5=5 2*5=10 3*5=15 4*5=20 5*5=25",
        "1*6=6 2*6=12 3*6=18 4*6=24 5*6=30 6*6=36",
        "1*7=7 2*7=14 3*7=21 4*7=28 5*7=35 6*7=42 7*7=49",
        "1*8=8 2*8=16 3*8=24 4*8=32 5*8=40 6*8=48 7*8=56 8*8=64",
        "1*9=9 2*9=18 3*9=27 4*9=36 5*9=45 6*9=54 7*9=63 8*9=72 9*9=81"
      ].join("\n"),
      checks: [
        {
          test: (code, uses) => uses.for >= 2,
          message: "输出对了，但这题的意义就在嵌套循环：要有两个 for，外层管行、内层管列。"
        }
      ],
      hints: [
        "外层 for i in range(1, 10)，内层 for j in range(1, i + 1)。",
        "同一行不换行要用 print(..., end=\" \")，一行结束再单独 print() 换行。",
        'for i in range(1, 10):\n    for j in range(1, i + 1):\n        print(f"{j}*{i}={i*j}", end=" ")\n    print()'
      ],
      solution: 'for i in range(1, 10):\n    for j in range(1, i + 1):\n        print(f"{j}*{i}={i*j}", end=" ")\n    print()',
      solutionNote: "内层的 range(1, i+1) 是关键：第几行就打印几列。"
    },
    {
      id: "class-bank",
      chapter: "ch12",
      level: "挑战",
      title: "写一个账户类",
      concept: "类把「数据」和「操作数据的方法」装在一起。self 就是「这个对象自己」，__init__ 在创建对象时自动执行。",
      prompt: "定义 BankAccount 类：__init__ 接收初始余额，deposit(amount) 加钱，withdraw(amount) 扣钱（余额不足则不变）。创建余额 100 的账户，存入 250，取出 50，输出最终余额。",
      condition: "输出 300，必须定义类和 __init__，并且用方法修改余额。",
      starter: "# 定义 BankAccount 类\n",
      expected: "300",
      checks: [
        {
          test: (code, uses) => uses.class >= 1 && /__init__/.test(code) && /self\s*\./.test(code),
          message: "输出对了，但这题要练类：需要 class 定义、__init__ 初始化和 self.属性。"
        }
      ],
      hints: [
        "__init__(self, balance=0) 里写 self.balance = balance。",
        "deposit 里写 self.balance += amount，withdraw 里写 self.balance -= amount。",
        "class BankAccount:\n    def __init__(self, balance=0):\n        self.balance = balance\n    def deposit(self, amount):\n        self.balance += amount\n    def withdraw(self, amount):\n        if amount <= self.balance:\n            self.balance -= amount\n\nacc = BankAccount(100)\nacc.deposit(250)\nacc.withdraw(50)\nprint(acc.balance)"
      ],
      solution: "class BankAccount:\n    def __init__(self, balance=0):\n        self.balance = balance\n    def deposit(self, amount):\n        self.balance += amount\n    def withdraw(self, amount):\n        if amount <= self.balance:\n            self.balance -= amount\n\nacc = BankAccount(100)\nacc.deposit(250)\nacc.withdraw(50)\nprint(acc.balance)",
      solutionNote: "类的好处：余额永远不会被外部随手指改，只能通过方法改，规则集中在一处。"
    }
  ];

  /* ============================================================
     判分
     ============================================================ */
  function normOut(text) {
    return String(text == null ? "" : text)
      .replace(/\r\n/g, "\n")
      .split("\n")
      .map(line => line.replace(/[ \t\u3000]+$/g, ""))
      .join("\n")
      .replace(/\n+$/g, "");
  }

  /**
   * 为遗留的正则结构要求生成等长的「真实代码视图」。
   * 注释和字符串字面内容只保留空白，不能冒充代码；f-string 的求值表达式
   * 仍是代码，必须保留，否则 print(f"{name}") 会被误判。字符串识别规则
   * 与 PyExec 词法器一致；for / while 等结构仍直接复用 PyExec Parser 的 uses。
   */
  function structuralSource(source) {
    const chars = source.split("");

    function blank(start, end) {
      const to = Math.min(end, chars.length);
      for (let i = Math.max(0, start); i < to; i++) {
        if (chars[i] !== "\n" && chars[i] !== "\r") chars[i] = " ";
      }
    }

    function restore(start, end) {
      const to = Math.min(end, chars.length);
      for (let i = Math.max(0, start); i < to; i++) chars[i] = source[i];
    }

    function stringAt(start) {
      // 与 PyExec 相同，支持最多两个字符串前缀字符及三引号。
      const prefix = /^[fFrRbBuU]{0,2}/.exec(source.slice(start, start + 2))[0];
      const quoteAt = start + prefix.length;
      const quote = source[quoteAt];
      if (quote !== "\"" && quote !== "'") return null;
      const triple = source[quoteAt + 1] === quote && source[quoteAt + 2] === quote;
      return {
        start,
        quoteAt,
        quote,
        triple,
        isF: /f/i.test(prefix),
        contentAt: quoteAt + (triple ? 3 : 1)
      };
    }

    function stringEnd(info) {
      let i = info.contentAt;
      while (i < source.length) {
        if (source[i] === "\\") { i += 2; continue; }
        if (info.triple && source[i] === info.quote && source[i + 1] === info.quote && source[i + 2] === info.quote) {
          return { closeAt: i, end: i + 3 };
        }
        if (!info.triple && source[i] === info.quote) return { closeAt: i, end: i + 1 };
        // 未闭合字符串会由 PyExec 报错；这里仍保证遮罩不会越行。
        if (!info.triple && (source[i] === "\n" || source[i] === "\r")) return { closeAt: i, end: i };
        i++;
      }
      return { closeAt: source.length, end: source.length };
    }

    function expressionEnd(start, limit) {
      let depth = 1;
      let i = start + 1;
      while (i < limit) {
        if (source[i] === "#") {
          while (i < limit && source[i] !== "\n") i++;
          continue;
        }
        const nested = stringAt(i);
        if (nested) {
          const end = stringEnd(nested).end;
          if (end > limit) return -1;
          i = end;
          continue;
        }
        if (source[i] === "\\") { i += 2; continue; }
        if (source[i] === "{") depth++;
        else if (source[i] === "}") {
          depth--;
          if (depth === 0) return i;
        }
        i++;
      }
      return -1;
    }

    function maskString(info, limit) {
      const bounds = stringEnd(info);
      const closeAt = Math.min(bounds.closeAt, limit);
      const end = Math.min(bounds.end, limit);
      if (!info.isF) {
        blank(info.start, end);
        return end;
      }

      // 规范化 f 前缀和开引号，让单引号、三引号、fr/rf 都按真实 f-string 判定。
      blank(info.start, info.quoteAt);
      if (info.quoteAt > info.start) chars[info.quoteAt - 1] = "f";
      if (info.triple) {
        blank(info.quoteAt + 1, info.contentAt);
        blank(bounds.closeAt + 1, end);
      }
      blank(info.contentAt, closeAt);

      // 只恢复真正插值的表达式；字面文本和 {{ / }} 转义仍保持遮罩。
      let i = info.contentAt;
      while (i < closeAt) {
        if (source[i] === "\\") { i += 2; continue; }
        if ((source[i] === "{" && source[i + 1] === "{") || (source[i] === "}" && source[i + 1] === "}")) {
          i += 2;
          continue;
        }
        if (source[i] === "{") {
          const expressionEndAt = expressionEnd(i, closeAt);
          if (expressionEndAt < 0) break;
          restore(i, expressionEndAt + 1);
          maskRange(i + 1, expressionEndAt);
          i = expressionEndAt + 1;
          continue;
        }
        i++;
      }
      return end;
    }

    function maskRange(start, end) {
      let i = start;
      while (i < end) {
        if (source[i] === "#") {
          const commentStart = i;
          while (i < end && source[i] !== "\n") i++;
          blank(commentStart, i);
          continue;
        }
        const info = stringAt(i);
        if (info) {
          i = maskString(info, end);
          continue;
        }
        i++;
      }
    }

    maskRange(0, source.length);
    return chars.join("");
  }

  /**
   * 结构要求判定。题库是从 JSON 生成进来到，函数没法序列化，
   * 所以支持两种写法：
   *   { test: (code, uses) => bool, message }         —— 写在 exercises.js 里
   *   { re: "正则", message } / { minFor: 2, message } —— 可从题库文件加载
   */
  function checkRequirements(list, source, uses, run) {
    const missing = [];
    const codeOnly = structuralSource(source);
    for (const c of list) {
      let ok = true;
      if (typeof c.test === "function") ok = c.test(codeOnly, uses, run);
      else if (c.re) ok = new RegExp(c.re).test(codeOnly);
      else if (c.minFor !== undefined) ok = ((uses && uses.for) || 0) >= c.minFor;
      else if (c.minWhile !== undefined) ok = ((uses && uses.while) || 0) >= c.minWhile;
      if (!ok) missing.push(c.message);
    }
    return missing;
  }

  function findExercise(id) {
    return EXERCISES.find(item => item.id === id) || null;
  }

  function runCode(code, exercise) {
    if (!window.PyExec) {
      return { ok: false, stdout: "", lines: [], error: { type: "InternalError", message: "解释器没有加载", line: 0 }, uses: {} };
    }
    return window.PyExec.run(code, { inputs: exercise && exercise.inputs ? exercise.inputs : [] });
  }

  /**
   * 三层判定：能跑 / 输出对 / 结构对
   * @returns {{status:'pass'|'fail'|'error', passed:boolean, stdout, expected, error, missing, hint}}
   */
  function check(id, code, options) {
    const opts = options || {};
    const exercise = findExercise(id);
    const source = String(code == null ? "" : code);

    if (!exercise) {
      return {
        status: "fail", passed: false, stdout: "", expected: "",
        error: null, missing: ["没有找到这道题"], hint: "题目 id 不存在。"
      };
    }

    const run = runCode(source, exercise);

    if (run.error) {
      return {
        status: "error", passed: false,
        stdout: "", expected: exercise.expected, error: run.error, missing: [],
        hint: (run.error.hint || "") + " " + (run.error.message || "")
      };
    }

    // ---- 断言题（MBPP 题型）：写一个函数，用题目自带的测试用例判分 ----
    if (Array.isArray(exercise.tests) && exercise.tests.length) {
      const results = [];
      let firstError = null;
      for (let i = 0; i < exercise.tests.length; i++) {
        const r = runCode(source + "\n" + exercise.tests[i] + "\n", exercise);
        const ok = !r.error;
        results.push({
          index: i,
          passed: ok,
          code: exercise.tests[i],
          error: r.error || null,
          stdout: normOut(r.stdout)
        });
        if (!ok && !firstError) firstError = r.error;
      }
      const passedCount = results.filter(r => r.passed).length;
      const allPassed = passedCount === results.length;
      const missing = [];
      if (!allPassed) {
        if (firstError && firstError.type === "AssertionError") {
          missing.push(`第 ${results.find(r => !r.passed).index + 1} 个测试用例没通过：函数的结果和预期不一样。先拿这组输入手算一遍，再对照代码。`);
          if (/return None|None/.test(source) || !/return\b/.test(source)) {
            missing.push("函数里好像没有 return：没有 return 的函数返回 None，断言一定失败。");
          }
        }
      }
      if (exercise.checks) {
        missing.push(...checkRequirements(exercise.checks, source, runCode(source, exercise).uses, null));
      }
      return {
        status: allPassed && missing.length === 0
          ? "pass"
          : (firstError && firstError.type !== "AssertionError" && !results.some(r => r.passed) ? "error" : "fail"),
        passed: allPassed && missing.length === 0,
        tested: true,
        tests: results,
        passedCount,
        total: results.length,
        stdout: "",
        expected: "",
        error: allPassed ? null : firstError,
        missing,
        hint: opts.withHint === false ? "" : (Array.isArray(exercise.hints) ? exercise.hints[0] : "")
      };
    }

    const actual = normOut(run.stdout);
    const expected = normOut(exercise.expected);
    const outputOk = actual === expected;
    const missing = [];

    if (!outputOk) {
      if (!actual && expected) {
        missing.push("程序跑完了，但什么都没输出——是不是忘了 print()？");
      } else {
        missing.push("输出和题目要求不一样。");
      }
    }

    // 结构要求
    if (exercise.checks) {
      missing.push(...checkRequirements(exercise.checks, source, run.uses, run));
    }

    const passed = outputOk && missing.length === 0;
    const nextHint = passed ? "" : (Array.isArray(exercise.hints) ? exercise.hints[0] : "");

    return {
      status: passed ? "pass" : "fail",
      passed,
      outputOk,
      stdout: actual,
      expected,
      lines: run.lines,
      uses: run.uses,
      error: null,
      missing,
      hint: opts.withHint === false ? "" : nextHint
    };
  }

  // 接入扩展题库（MBPP 中文化 + 章节自出题），由 tools/build-bank.js 生成
  if (typeof window !== "undefined" && Array.isArray(window.PY_EXERCISE_BANK)) {
    const existing = new Set(EXERCISES.map(e => e.id));
    for (const item of window.PY_EXERCISE_BANK) {
      if (!existing.has(item.id)) { EXERCISES.push(item); existing.add(item.id); }
    }
  }

  const api = Object.freeze({ exercises: EXERCISES, check, normOut });
  window.PythonExercises = api;

  /* ============================================================
     界面
     ============================================================ */
  const STORAGE_KEY = "pystudy.exercises.v2";
  const SELF_CHECK_KEY = "pystudy.selfcheck.v1";

  function esc(s) {
    return String(s).replace(/[&<>"']/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]));
  }

  function init() {
    const root = document.getElementById("exerciseApp");
    if (!root) return;

    const listEl = root.querySelector("#exerciseList");
    const progressEl = root.querySelector("#exerciseProgress");
    const levelEl = root.querySelector("#exerciseLevel");
    const titleEl = root.querySelector("#exerciseTitle");
    const conceptEl = root.querySelector("#exerciseConcept");
    const promptEl = root.querySelector("#exercisePrompt");
    const conditionEl = root.querySelector("#exerciseCondition");
    const sourceEl = root.querySelector("#exerciseSource");
    const editor = root.querySelector("#exerciseCode");
    const result = root.querySelector("#exerciseResult");
    const hintBox = root.querySelector("#exerciseHintBox");
    const selfCheck = root.querySelector("#exerciseSelfCheck");
    const runBtn = root.querySelector("#exerciseRun");
    const resetBtn = root.querySelector("#exerciseReset");
    const hintBtn = root.querySelector("#exerciseHint");
    const solutionBtn = root.querySelector("#exerciseSolution");
    const solutionBox = root.querySelector("#exerciseSolutionBox");

    let progress = {};
    try { progress = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; } catch { progress = {}; }
    let selfChecks = {};
    try { selfChecks = JSON.parse(localStorage.getItem(SELF_CHECK_KEY)) || {}; } catch { selfChecks = {}; }

    let current = EXERCISES[0];
    let hintIndex = 0;
    let redoMode = false;

    function persist() {
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(progress)); } catch { /* 隐私模式下静默 */ }
    }
    function persistSelfCheck() {
      try { localStorage.setItem(SELF_CHECK_KEY, JSON.stringify(selfChecks)); } catch { /* 同上 */ }
    }
    function state(id) {
      progress[id] ??= { code: null, passed: false, attempts: 0, mastered: false };
      return progress[id];
    }

    function renderList() {
      // 按课程章节排（ch01 → ch18），同一章内按难度。这样能跟着课程顺序往下走，
      // 而不是被拼音顺序打散——「交错练习」靠复习队列承担，练习场保持可预期。
      const order = { "入门": 0, "进阶": 1, "挑战": 2 };
      const sorted = [...EXERCISES].sort((a, b) =>
        String(a.chapter || "ch99").localeCompare(String(b.chapter || "ch99")) ||
        (order[a.level] - order[b.level]) ||
        a.title.localeCompare(b.title, "zh"));
      listEl.innerHTML = sorted.map(item => {
        const st = progress[item.id] || {};
        const mark = st.mastered ? "✓✓" : st.passed ? "✓" : "";
        return `<button class="ex-item${item.id === current.id ? " is-current" : ""}" data-ex="${item.id}" type="button">
          <span class="ex-item-mark">${mark}</span>
          <span class="ex-item-body">
            <span class="ex-item-title">${esc(item.title)}</span>
            <span class="ex-item-meta">${esc(item.level)} · ${esc(item.chapter)}</span>
          </span>
        </button>`;
      }).join("");
    }

    function renderProgress() {
      const passed = EXERCISES.filter(item => progress[item.id]?.passed).length;
      const mastered = EXERCISES.filter(item => progress[item.id]?.mastered).length;
      progressEl.textContent = `通过 ${passed}/${EXERCISES.length} · 掌握 ${mastered}`;
    }

    function selectExercise(id) {
      current = findExercise(id) || EXERCISES[0];
      hintIndex = 0;
      redoMode = false;
      const st = state(current.id);
      levelEl.textContent = current.level;
      levelEl.dataset.level = current.level;
      titleEl.textContent = current.title;
      conceptEl.textContent = current.concept;
      promptEl.textContent = current.prompt;
      conditionEl.textContent = current.condition;
      if (sourceEl) {
        sourceEl.textContent = current.source ? `题目来源：${current.source}` : "";
        sourceEl.hidden = !current.source;
      }
      editor.value = st.code != null ? st.code : current.starter;
      result.hidden = true;
      hintBox.hidden = true;
      hintBox.textContent = "";
      selfCheck.hidden = true;
      if (solutionBox) { solutionBox.hidden = true; solutionBox.textContent = ""; }
      renderList();
      renderProgress();
      editor.focus();
    }

    function saveCode() {
      const st = state(current.id);
      st.code = editor.value;
      persist();
    }

    editor.addEventListener("input", saveCode);

    listEl.addEventListener("click", e => {
      const btn = e.target.closest("[data-ex]");
      if (btn) selectExercise(btn.dataset.ex);
    });

    function renderError(outcome) {
      const err = outcome.error;
      const lines = editor.value.split("\n");
      const lineText = err.line && lines[err.line - 1] !== undefined ? lines[err.line - 1] : "";
      return `<div class="res-error">
        <div class="res-error-head">
          <span class="err-type">${esc(err.type)}</span>
          ${err.line ? `<span class="err-line">第 ${err.line} 行</span>` : ""}
        </div>
        ${lineText ? `<pre class="err-code"><code>${esc(lineText)}</code></pre>` : ""}
        <p class="err-msg">${esc(err.message)}</p>
        ${err.hint ? `<p class="err-hint">${esc(err.hint)}</p>` : ""}
      </div>`;
    }

    function renderDiff(outcome) {
      const a = outcome.stdout === "" ? "（没有任何输出）" : outcome.stdout;
      return `<div class="res-diff">
        <div class="res-col">
          <div class="res-col-head">你的程序输出</div>
          <pre class="res-out${outcome.stdout === "" ? " is-empty" : ""}">${esc(a)}</pre>
        </div>
        <div class="res-col">
          <div class="res-col-head">题目要求</div>
          <pre class="res-out">${esc(outcome.expected)}</pre>
        </div>
      </div>`;
    }

    function renderTests(outcome) {
      const rows = outcome.tests.map(t => `
        <li class="tcase ${t.passed ? "is-ok" : "is-bad"}">
          <span class="tcase-mark">${t.passed ? "✓" : "✗"}</span>
          <code>${esc(t.code.replace(/^assert\s+/, ""))}</code>
          ${!t.passed && t.error ? `<span class="tcase-err">${esc(t.error.type)}：${esc(t.error.message)}</span>` : ""}
        </li>`).join("");
      return `<div class="res-tests">
        <div class="res-col-head">测试用例 ${outcome.passedCount}/${outcome.total} 通过</div>
        <ul class="tcase-list">${rows}</ul>
      </div>`;
    }

    function handleRun() {
      saveCode();
      const st = state(current.id);
      st.attempts = (st.attempts || 0) + 1;
      const outcome = check(current.id, editor.value, { withHint: false });
      persist();

      result.hidden = false;
      selfCheck.hidden = true;

      if (outcome.status === "error") {
        result.className = "result-panel is-error";
        const isSyntax = outcome.error && /Syntax|Indentation/.test(outcome.error.type);
        result.innerHTML = `<div class="res-head"><strong>${isSyntax ? "语法没通过" : "代码没跑通"}</strong>
          <span class="res-sub">先修掉这个错误，再谈结果对不对</span></div>` + renderError(outcome);
        return;
      }

      if (outcome.passed) {
        const firstTime = !st.passed;
        st.passed = true;
        st.lastAt = Date.now();
        persist();
        result.className = "result-panel is-pass";
        result.innerHTML = `<div class="res-head"><strong>通过</strong>
          <span class="res-sub">你的代码真的跑过了解释器，不是拿正则猜的</span></div>
          ${outcome.tested ? renderTests(outcome) : `<pre class="res-out">${esc(outcome.stdout)}</pre>`}
          ${redoMode ? `<p class="res-note">第二遍也对了——这道题进入「已掌握」。隔 3 天再回来写一遍，才算真的记住。</p>` : ""}`;
        if (redoMode) {
          st.mastered = true;
          st.masteredAt = Date.now();
          redoMode = false;
          persist();
          if (typeof addXP === "function") addXP(15, "练习已掌握");
        } else if (firstTime && typeof addXP === "function") {
          addXP(10, "练习通过");
        }
        renderProgress();
        renderList();
        showSelfCheck();
        return;
      }

      result.className = "result-panel is-fail";
      let html = `<div class="res-head"><strong>${outcome.tested ? `${outcome.passedCount}/${outcome.total} 个测试用例通过` : "能跑，但没达标"}</strong>
        <span class="res-sub">${outcome.tested ? "函数的结果和预期不一样，逐个用例看差在哪" : "输出和题目要求不一样，或者少了题目要练的东西"}</span></div>`;
      html += outcome.tested ? renderTests(outcome) : renderDiff(outcome);
      if (outcome.missing.length) {
        html += `<ul class="res-missing">${outcome.missing.map(m => `<li>${esc(m)}</li>`).join("")}</ul>`;
      }
      result.innerHTML = html;
    }

    function showSelfCheck() {
      if (!selfCheck) return;
      selfCheck.hidden = false;
      selfCheck.innerHTML = `<p class="sc-q">先别关。合上刚才的代码：不看答案，你能从空白把它再写一遍吗？</p>
        <div class="sc-options">
          <button class="btn small" data-sc="yes" type="button">能，我重写一遍</button>
          <button class="btn small" data-sc="maybe" type="button">勉强，先记下来</button>
          <button class="btn small" data-sc="no" type="button">不能，需要再看</button>
        </div>
        <p class="sc-note">说「能」的话，编辑区会被清空——真写出来的才算真会。</p>`;
    }

    selfCheck?.addEventListener("click", e => {
      const btn = e.target.closest("[data-sc]");
      if (!btn) return;
      const answer = btn.dataset.sc;
      selfChecks[current.id] = { answer, at: Date.now() };
      persistSelfCheck();
      if (answer === "yes") {
        editor.value = "";
        redoMode = true;
        selfCheck.hidden = true;
        result.hidden = true;
        editor.focus();
        if (typeof toast === "function") toast("编辑区已清空：从空白再写一遍，写完点运行");
        return;
      }
      selfCheck.hidden = true;
      if (typeof toast === "function") {
        toast(answer === "no"
          ? "诚实是好事：点「看答案」，对照着把每一步弄懂，明天再来"
          : "记下来了。明天第一件事就是重写它——隔一天还记得，才算进脑子");
      }
    });

    runBtn.addEventListener("click", handleRun);

    editor.addEventListener("keydown", e => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        handleRun();
      }
      if (e.key === "Tab") {
        e.preventDefault();
        const start = editor.selectionStart;
        const end = editor.selectionEnd;
        const value = editor.value;
        editor.value = value.slice(0, start) + "    " + value.slice(end);
        editor.selectionStart = editor.selectionEnd = start + 4;
        saveCode();
      }
    });

    resetBtn.addEventListener("click", () => {
      editor.value = current.starter;
      saveCode();
      result.hidden = true;
      hintBox.hidden = true;
      editor.focus();
    });

    hintBtn.addEventListener("click", () => {
      const hints = current.hints || [];
      if (!hints.length) {
        if (typeof toast === "function") toast("这题没有提示，先按题目要求试试");
        return;
      }
      hintBox.hidden = false;
      hintBox.textContent = `提示 ${Math.min(hintIndex + 1, hints.length)}/${hints.length}：${hints[hintIndex]}`;
      hintIndex = Math.min(hintIndex + 1, hints.length - 1);
    });

    solutionBtn?.addEventListener("click", () => {
      if (!solutionBox) return;
      solutionBox.hidden = false;
      solutionBox.className = "solution-box";
      solutionBox.innerHTML = `<div class="sol-head">参考答案 <span>先自己写，卡住了再看</span></div>
        <pre class="res-out"><code>${esc(current.solution)}</code></pre>
        <p class="sol-note">${esc(current.solutionNote || "")}</p>
        <button class="btn small" id="solutionRetry" type="button">我要自己再写一遍</button>`;
      solutionBox.querySelector("#solutionRetry")?.addEventListener("click", () => {
        solutionBox.hidden = true;
        editor.value = current.starter;
        saveCode();
        result.hidden = true;
        editor.focus();
      });
    });

    renderList();
    renderProgress();
    selectExercise(EXERCISES[0].id);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true });
  else init();
})();
