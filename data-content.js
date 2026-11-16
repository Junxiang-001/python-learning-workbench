/* 内容数据：章节 / 路线 / 速查 / 环境 / 资源 */

/* 黑马程序员《Python 8天从入门到精通》基础篇+进阶篇 章节结构 */
const CHAPTERS = [
  { id: "ch01", num: "01", title: "初识 Python 与环境搭建", topics: "Python 简介 · 解释器安装 · PyCharm · Hello World", template: "## 环境搭建记录\n- Python 版本：\n- IDE：\n\n## 第一个程序\n```python\n\n```\n\n## 疑问\n" },
  { id: "ch02", num: "02", title: "基础语法", topics: "字面量 · 注释 · 变量 · 数据类型 · 类型转换 · 标识符 · 运算符", template: "## 核心概念\n\n## 代码练习\n```python\n\n```\n\n## 踩坑记录\n\n## 疑问\n" },
  { id: "ch03", num: "03", title: "输入输出与字符串格式化", topics: "print · input · f-string · % 占位符 · format", template: "## 三种格式化对比\n| 写法 | 示例 |\n| --- | --- |\n| f-string |  |\n| % |  |\n| format |  |\n\n## 代码练习\n```python\n\n```\n" },
  { id: "ch04", num: "04", title: "判断语句", topics: "if · if-else · if-elif-else · 嵌套判断 · 缩进", template: "## 语法要点\n\n## 练习：成绩分级 / 猜拳游戏\n```python\n\n```\n\n## 踩坑记录\n" },
  { id: "ch05", num: "05", title: "循环语句", topics: "while · for · range · 嵌套循环 · break · continue · 九九乘法表", template: "## while vs for 使用场景\n\n## 练习：九九乘法表\n```python\n\n```\n\n## break 和 continue 的区别\n" },
  { id: "ch06", num: "06", title: "函数", topics: "定义调用 · 参数 · 返回值 · 作用域 · 文档字符串 · lambda", template: "## 函数三要素：名字 / 参数 / 返回值\n\n## 练习\n```python\n\n```\n\n## 局部变量 vs 全局变量\n" },
  { id: "ch07", num: "07", title: "数据容器（一）列表·元组·字符串", topics: "list 增删改查 · 切片 · tuple · str 方法", template: "## 列表常用方法清单\n| 方法 | 作用 |\n| --- | --- |\n| append |  |\n\n## 切片练习\n```python\n\n```\n\n## 字符串方法整理\n" },
  { id: "ch08", num: "08", title: "数据容器（二）集合·字典·综合", topics: "set 去重与运算 · dict 键值对 · 容器对比与选型", template: "## 五种容器对比\n| 容器 | 有序 | 可变 | 重复 | 场景 |\n| --- | --- | --- | --- | --- |\n| 列表 |  |  |  |  |\n| 元组 |  |  |  |  |\n| 字符串 |  |  |  |  |\n| 集合 |  |  |  |  |\n| 字典 |  |  |  |  |\n\n## 练习\n```python\n\n```\n" },
  { id: "ch09", num: "09", title: "函数进阶", topics: "多返回值 · 多种参数形式 · 拆包 · 匿名函数 · 递归", template: "## 参数形式总结\n\n## 递归练习：阶乘\n```python\n\n```\n" },
  { id: "ch10", num: "10", title: "文件操作", topics: "open · 读写模式 · with · 逐行读取 · 文件备份案例", template: "## 读写模式对比：r / w / a\n\n## 练习：文件备份\n```python\n\n```\n\n## 编码问题记录\n" },
  { id: "ch11", num: "11", title: "异常·模块·包", topics: "try-except · 异常传递 · 模块导入 · __name__ · pip · 包", template: "## 常见异常类型\n\n## try 完整结构\n```python\ntry:\n    pass\nexcept:\n    pass\nelse:\n    pass\nfinally:\n    pass\n```\n\n## pip 命令备忘\n" },
  { id: "ch12", num: "12", title: "面向对象基础", topics: "类与对象 · __init__ · self · 属性方法 · 封装", template: "## 类 vs 对象的理解\n\n## 练习：设计一个学生类\n```python\n\n```\n" },
  { id: "ch13", num: "13", title: "面向对象进阶", topics: "继承 · 重写 · 多态 · 类属性 · 类方法静态方法 · 魔术方法", template: "## 三大特性：封装 / 继承 / 多态\n\n## 练习\n```python\n\n```\n" },
  { id: "ch14", num: "14", title: "高阶技巧与闭包装饰器", topics: "闭包 · 装饰器 · 单例模式 · 工厂模式 · 多线程入门", template: "## 装饰器的理解\n\n## 练习：计时装饰器\n```python\n\n```\n" },
  { id: "ch15", num: "15", title: "正则表达式", topics: "re 模块 · 元字符 · match/search/findall · 分组提取", template: "## 常用元字符\n| 符号 | 含义 |\n| --- | --- |\n| \\d |  |\n| \\w |  |\n| . |  |\n| * |  |\n| + |  |\n\n## 练习：提取手机号\n```python\n\n```\n" },
  { id: "ch16", num: "16", title: "数据库 SQL 入门", topics: "MySQL/SQLite · DDL · DML · 查询 · 聚合分组 · Python 操作数据库", template: "## SQL 常用语句\n```sql\n\n```\n\n## Python 连接数据库\n```python\n\n```\n" },
  { id: "ch17", num: "17", title: "数据可视化案例", topics: "pyecharts · JSON · 折线图 · 地图 · 动态柱状图", template: "## JSON 处理\n```python\n\n```\n\n## 可视化案例记录\n" },
  { id: "ch18", num: "18", title: "综合实战项目", topics: "整合全部知识 · 项目结构 · 调试技巧", template: "## 项目思路\n\n## 模块拆分\n\n## 遇到的问题与解决\n" },
];

/* 学习路线（含勾选清单） */
const PATH_STAGES = [
  { title: "今天跑通", time: "今天，约 30–60 分钟", goal: "产出：一个能从终端运行的 hello.py，并记下运行命令和 Python 版本。",
    items: [
      { t: "在终端运行 python --version，确认解释器可用", n: "本机已安装 Python 3.14 ✓" },
      { t: "用现有编辑器新建 hello.py，写入并运行 print(\"Hello, Python!\")" },
      { t: "在终端进入文件所在目录，运行 python hello.py" },
      { t: "故意拼错一个函数名，找到报错行；改正后再次运行" },
    ]},
  { title: "基础语法", time: "约 2–4 周，按掌握程度推进", goal: "产出：一个命令行小程序，能接收输入、做判断和循环、整理数据，并把结果保存到文件。",
    items: [
      { t: "练习变量、数字、字符串和类型转换：编写简易费用计算器" },
      { t: "练习 input、print 和 f-string：显示清楚的输入结果" },
      { t: "练习 if 和循环：完成成绩分级或猜数字程序" },
      { t: "练习列表与字典：记录多条项目并计算合计" },
      { t: "练习函数：把输入、计算、显示拆成可调用函数" },
      { t: "练习文件与异常：保存记录，处理无效输入和文件不存在" },
    ]},
  { title: "小工具实战", time: "约 2–4 周，选一个真实小需求", goal: "产出：一个可重复运行的表格处理脚本，读取原始 Excel，完成清理或汇总，并写出结果文件。",
    items: [
      { t: "选一份可公开或已脱敏的表格，写清楚要减少的手工步骤" },
      { t: "用 pandas 读取 Excel，检查列名、行数和缺失值" },
      { t: "完成一项明确处理：筛选、去重、排序或分组汇总" },
      { t: "将结果写入新的 Excel 文件，不覆盖原始文件" },
      { t: "在虚拟环境安装所需库，并记录运行步骤" },
      { t: "用一份小样本复跑，确认输入不变且输出正确" },
    ]},
  { title: "自动化与 AI", time: "约 2–4 周，按需选做", goal: "产出：一个带说明、可重复执行的自动化脚本；可选接入 AI 完成单一文本任务，并检查输出后再使用。",
    items: [
      { t: "从重复文件整理、定期报表或文本归类中选一个低风险任务" },
      { t: "把脚本整理成明确的输入、处理和输出步骤，补上日志与错误提示" },
      { t: "若任务需要 AI，先用脱敏样例调用模型，并要求返回固定字段" },
      { t: "检查模型结果格式和关键字段；不把密钥或敏感数据写进代码" },
      { t: "保存一份示例输入、预期输出和运行说明，验证可再次运行" },
      { t: "需要定时运行时再配置系统任务；先手动确认脚本稳定" },
    ]},
];

/* 速查表 */
const CHEATS = [
  { title: "变量与数据类型", tags: "变量 类型 int float str bool 转换", code: 'name = "小明"          # str\nage = 18               # int\nheight = 1.75          # float\nis_student = True      # bool\nnothing = None         # 空值\n\nprint(type(age))       # 查类型\nint("123"); float("3.14"); str(100)  # 类型转换', tip: "input() 拿到的永远是字符串，算数前先 int() 或 float()。" },
  { title: "格式化输出 f-string", tags: "格式化 输出 print f-string 小数", code: 'name, score = "小明", 95.567\nprint(f"{name}考了{score}分")\nprint(f"保留两位: {score:.2f}")     # 95.57\nprint(f"百分比: {0.856:.1%}")       # 85.6%\nprint(f"补零: {7:03d}")             # 007\nprint(f"千分位: {1234567:,}")       # 1,234,567', tip: "f-string 是首选，{} 里可以放任何表达式。" },
  { title: "if 条件判断", tags: "if else elif 判断 条件 分支", code: 'score = 85\nif score >= 90:\n    print("A")\nelif score >= 80:\n    print("B")\nelif score >= 60:\n    print("C")\nelse:\n    print("D")\n\n# 组合条件\nif 18 <= age < 60 and has_id:\n    print("可办理")', tip: "冒号别丢，缩进 4 空格。== 是判断，= 是赋值。" },
  { title: "for / while 循环", tags: "循环 for while range break continue", code: 'for i in range(5):          # 0 1 2 3 4\n    print(i)\n\nfor i, name in enumerate(["A","B"]):\n    print(i, name)          # 带下标遍历\n\nn = 0\nwhile n < 3:\n    n += 1\n    if n == 2:\n        continue            # 跳过本轮\n    if n > 5:\n        break               # 终止循环', tip: "range(1, 10, 2) → 1,3,5,7,9，含头不含尾。" },
  { title: "列表操作", tags: "列表 list append 切片 排序 增删改查", code: 'a = [3, 1, 4, 1, 5]\na.append(9)          # 尾部加\na.insert(0, 0)       # 指定位置插\na.remove(1)          # 按值删(第一个)\nx = a.pop()          # 删尾部并返回\ndel a[0]             # 按下标删\na[0] = 99            # 改\n\nprint(a[1:3])        # 切片\nprint(a[::-1])       # 反转\na.sort()             # 升序(原地)\nprint(sorted(a, reverse=True))  # 降序(新列表)\nprint(len(a), sum(a), max(a), min(a))\nprint(4 in a)        # 是否存在', tip: "sort() 改原列表返回 None；sorted() 返回新列表。别写 a = a.sort()！" },
  { title: "列表推导式", tags: "推导式 列表推导式 comprehension", code: 'squares = [x**2 for x in range(10)]\nevens = [x for x in range(20) if x % 2 == 0]\nwords = [s.strip().lower() for s in lines]\nmatrix = [[0]*3 for _ in range(3)]  # 3x3 零矩阵', tip: "读法：把 for 后面每个 x 加工后收集成列表。" },
  { title: "字典操作", tags: "字典 dict 键值 get items", code: 'd = {"name": "小明", "age": 18}\nprint(d["name"])          # 键不存在会报错\nprint(d.get("age", 0))    # 安全取值\nd["city"] = "北京"        # 增/改\ndel d["city"]             # 删\n\nfor k, v in d.items():\n    print(k, v)\n\nprint(list(d.keys()))     # 所有键\nprint(list(d.values()))   # 所有值\nd.update({"age": 19, "tel": "110"})', tip: "遍历用 .items()，判断存在用 in（查的是键）。" },
  { title: "字符串方法", tags: "字符串 str split join strip replace 切片", code: 's = "  Hello,Python  "\ns.strip()               # 去两端空白\ns.lower(); s.upper()    # 大小写\ns.strip().split(",")    # 分割成列表\n"-".join(["a","b"])     # 拼接 → a-b\ns.replace("Py", "py")   # 替换\ns.find("Py")            # 找不到返回 -1\ns.strip().startswith("He")  # True\n"123".isdigit()         # True\nf"{3.14159:.2f}"        # 3.14', tip: "字符串不可变：replace/strip 等返回新字符串，split 返回列表，startswith/isdigit 返回布尔值，find 返回整数下标。" },
  { title: "函数定义", tags: "函数 def return 参数 默认 lambda", code: 'def greet(name, msg="你好"):\n    """打招呼"""\n    return f"{msg}, {name}!"\n\nprint(greet("小明"))\nprint(greet("Tom", msg="Hi"))\n\ndef total(*nums):        # 不定长参数\n    return sum(nums)\n\ndef config(**kw):        # 关键字不定长\n    print(kw)\n\nsq = lambda x: x ** 2    # 匿名函数', tip: "默认参数不要用列表/字典等可变对象。" },
  { title: "文件读写", tags: "文件 open read write with 编码 utf-8", code: '# 读全部\nwith open("a.txt", encoding="utf-8") as f:\n    text = f.read()\n\n# 逐行读(大文件推荐)\nwith open("a.txt", encoding="utf-8") as f:\n    for line in f:\n        print(line.strip())\n\n# 写入(w清空 / a追加)\nwith open("out.txt", "w", encoding="utf-8") as f:\n    f.write("一行内容\\n")', tip: "永远用 with，永远写 encoding=\"utf-8\"，w 模式会清空文件。" },
  { title: "异常处理", tags: "异常 try except 报错 finally", code: 'try:\n    n = int(input("数字: "))\n    result = 100 / n\nexcept ValueError:\n    print("请输入数字")\nexcept ZeroDivisionError:\n    print("不能除以0")\nexcept Exception as e:\n    print(f"其他错误: {e}")\nelse:\n    print("成功:", result)\nfinally:\n    print("总会执行")', tip: "先看具体异常，最后才兜底 Exception。别用裸 except 吞错误。" },
  { title: "类与对象", tags: "类 class 对象 面向对象 self init 继承", code: 'class Student:\n    school = "一中"              # 类属性\n    def __init__(self, name, score):\n        self.name = name         # 实例属性\n        self.score = score\n    def report(self):\n        return f"{self.name}: {self.score}"\n\nclass TopStudent(Student):       # 继承\n    def report(self):            # 重写\n        return super().report() + " ★"\n\ns = TopStudent("小明", 98)\nprint(s.report())', tip: "self 就是「这个对象自己」，实例方法第一个参数固定是它。" },
  { title: "日期时间", tags: "日期 时间 datetime date 今天", code: 'from datetime import date, datetime, timedelta\ntoday = date.today()             # 2026-11-03\nnow = datetime.now()\nprint(now.strftime("%Y-%m-%d %H:%M"))\nd = date.fromisoformat("2026-11-03")  # 字符串转日期\nprint(today + timedelta(days=7))      # 一周后\nprint((date(2026,12,31) - today).days) # 相差天数', tip: "财务对账高频：字符串日期先转 date 对象再比较计算。" },
  { title: "pandas 速查（阶段二用）", tags: "pandas excel 表格 数据处理 筛选 汇总", code: 'import pandas as pd\ndf = pd.read_excel("账目.xlsx")\ndf.head()                        # 看前5行\ndf[df["金额"] > 1000]            # 筛选\ndf.sort_values("金额", ascending=False)\ndf.groupby("部门")["金额"].sum()  # 分组汇总\ndf.dropna()                      # 删空行\ndf.drop_duplicates()             # 去重\npd.merge(a, b, on="单号")        # 两表合并\ndf.to_excel("结果.xlsx", index=False)', tip: "pip install pandas openpyxl 后才能读写 xlsx。" },
  { title: "pip 与虚拟环境", tags: "pip 安装 库 包 venv 虚拟环境 镜像", code: 'pip install pandas               # 装库\npip install pandas -i https://pypi.tuna.tsinghua.edu.cn/simple  # 清华镜像\npip list                         # 已装列表\npip show pandas                  # 库详情\npip freeze > requirements.txt    # 导出依赖\npip install -r requirements.txt  # 按清单安装\n\npython -m venv .venv             # 创建虚拟环境\n.venv\\Scripts\\activate           # Windows 激活\ndeactivate                       # 退出', tip: "每个项目一个虚拟环境，避免库版本互相打架。" },
];

/* 环境指南 */
const ENV_GUIDE = [
  { title: "Python 解释器", tag: "must", tagText: "已就绪", body: "你的电脑已装 Python 3.14（C:\\Python314）。验证方式：打开终端输入 python --version。这是运行一切 Python 代码的引擎。", code: "python --version" },
  { title: "代码编辑器 / IDE", tag: "must", tagText: "必装", body: "写代码的地方。推荐 VS Code（免费轻量，装 Python 扩展即可）或 PyCharm Community（黑马课程同款，开箱即用）。记事本也能写，但没有补全和纠错，效率差十倍。", code: null },
  { title: "终端 / 命令行", tag: "must", tagText: "必会", body: "Windows 上用 PowerShell 或 Terminal。要学会三招：cd 进目录、python 文件名.py 运行脚本、pip 装库。不用精通，够用就行。", code: "cd C:\\learn_python\npython hello.py" },
  { title: "pip 包管理器", tag: "must", tagText: "自带", body: "装 Python 时已自带。第三方库（pandas、requests 等）都靠它安装。国内网络建议用清华镜像加速。", code: "pip install 库名 -i https://pypi.tuna.tsinghua.edu.cn/simple" },
  { title: "虚拟环境 venv", tag: "later", tagText: "第2个月学", body: "给每个项目建独立的库环境。刚开始学可以不管，做第一个正式项目时再养成习惯。", code: "python -m venv .venv\n.venv\\Scripts\\activate" },
  { title: "Git 版本控制", tag: "later", tagText: "第3个月学", body: "代码的「存档系统」，改坏了随时回退。也是 GitHub 的基础。先学四个命令：init、add、commit、log。", code: "git init\ngit add .\ngit commit -m \"我的第一个版本\"" },
  { title: "浏览器开发者工具", tag: "optional", tagText: "选学", body: "按 F12 打开。学爬虫或 Web 开发时才需要，纯基础阶段用不上。" },
  { title: "AI 助手（你已经有了）", tag: "must", tagText: "已就绪", body: "报错看不懂、概念不理解、想要练习题——直接问 AI 是最高效的学习方式。但注意：让 AI 讲解，代码自己敲，别让 AI 代写练习。", code: null },
  { title: "英语（够用就行）", tag: "optional", tagText: "长期", body: "报错信息和高质文档是英文的。不用专门学，遇到查词即可——你的划词翻译工具正好派上用场。" },
];

/* 资源导航 */
const LINK_GROUPS = [
  { title: "主线课程", links: [
    { name: "黑马程序员 Python（B站）", url: "https://www.bilibili.com/video/BV1qW4y1a7fU/", desc: "8天入门到精通，本工作台笔记章节按它组织" },
    { name: "廖雪峰 Python 教程", url: "https://liaoxuefeng.com/books/python/", desc: "中文文字教程口碑之选，当字典查" },
    { name: "Python 官方中文教程", url: "https://docs.python.org/zh-cn/3/tutorial/", desc: "权威参考，后期查漏补缺" },
  ]},
  { title: "动手练习", links: [
    { name: "Exercism Python", url: "https://exercism.org/tracks/python", desc: "免费渐进式练习题，有人工点评" },
    { name: "菜鸟教程 Python", url: "https://www.runoob.com/python3/python3-tutorial.html", desc: "在线运行小例子，随查随试" },
    { name: "Python Tutor 可视化", url: "https://pythontutor.com/", desc: "逐行看代码执行过程，理解变量神器" },
  ]},
  { title: "遇到问题", links: [
    { name: "Stack Overflow", url: "https://stackoverflow.com/", desc: "全球最大编程问答，报错信息直接搜" },
    { name: "Real Python", url: "https://realpython.com/", desc: "高质量英文教程，进阶后常看" },
    { name: "GitHub", url: "https://github.com/", desc: "看别人代码、找现成轮子" },
  ]},
  { title: "通往 AI", links: [
    { name: "Ollama", url: "https://ollama.com/", desc: "本地跑大模型，数据不出内网" },
    { name: "pandas 中文文档", url: "https://www.pypandas.cn/", desc: "阶段二数据处理主战场" },
    { name: "FastAPI 中文文档", url: "https://fastapi.org.org.cn/", desc: "阶段四 Web 接口框架" },
  ]},
];
