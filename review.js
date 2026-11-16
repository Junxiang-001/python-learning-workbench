/* review.js —— 今日复习：主动回忆 + 间隔重复 + 交错抽题
 *
 * 三件事各解决一个学习问题：
 *   主动回忆 —— 先自己想，再看答案。只看答案 = 假装学过。
 *   间隔重复 —— 每张卡按遗忘曲线排下一次见面，答错就提前回来。
 *   交错抽题 —— 一次复习里混着不同章节，逼你分辨「这是哪一类问题」，
 *               这比一个章节连刷十题有用得多（虽然感觉更累）。
 *
 * 纯逻辑部分（打卡算法）不依赖 DOM，可以直接用 node 测。
 */
(function () {
  "use strict";

  /* ============================================================
     卡片库
     ============================================================ */
  const CARDS = [
    { id: "c01a", ch: "ch01", topic: "print / input", front: "print() 和 input() 分别干什么？input() 拿回来的东西是什么类型？", back: "print() 把内容显示到屏幕；input() 让程序暂停等你输入，拿回来的永远是**字符串**，要算数必须先 int() 或 float() 转换。" },
    { id: "c01b", ch: "ch01", topic: "缩进", front: "Python 靠什么划分代码块？缩进一般是几个空格？", back: "靠**缩进**（不是大括号）。约定 4 个空格。同一个块里的行必须严格对齐，混用 Tab 和空格会报 IndentationError。" },
    { id: "c02a", ch: "ch02", topic: "赋值", front: "x = x + 1 该怎么读？和数学里的 x + 1 = 3 有什么区别？", back: "读作「把 x 现在的值加 1，再赋回给 x」。= 是赋值动作，不是等式求解；数学里是解方程，代码里是更新变量。" },
    { id: "c02b", ch: "ch02", topic: "= 与 ==", front: "赋值和判断相等分别用哪个符号？", back: "一个等号 `=` 是赋值（贴标签），两个等号 `==` 是判断（问「一样吗」）。这是零基础最常见的错误来源。" },
    { id: "c02c", ch: "ch02", topic: "浮点误差", front: "print(0.1 + 0.2 == 0.3) 输出什么？为什么？", back: "输出 `False`。计算机用二进制存小数，0.1 和 0.2 都存不精确，加起来是 0.30000000000000004。算钱用 decimal 或先转成整数（按分算）。" },
    { id: "c02d", ch: "ch02", topic: "类型", front: "四种基本类型是什么？type() 干什么用？", back: "int（整数）、float（小数）、str（字符串）、bool（True/False）。type(x) 返回 x 的类型，调试时用来确认「它到底是不是我以为的那个东西」。" },
    { id: "c02e", ch: "ch02", topic: "类型转换", front: "int(\"3.5\") 的结果是什么？int(\"abc\") 呢？", back: "int(\"3.5\") 报 ValueError——int 只认整数字面量，要先 float(\"3.5\") 再 int()。int(\"abc\") 也报 ValueError。转换失败就报错，不会给你 0。" },
    { id: "c03a", ch: "ch03", topic: "f-string", front: "把变量 name 插进「你好，XX」这句话，用 f-string 怎么写？", back: "print(f\"你好，{name}\")。f 紧贴引号前面，变量放花括号里，花括号必须是英文的。" },
    { id: "c03b", ch: "ch03", topic: "print 参数", front: "print 默认每次换行。怎么让它不换行？多个值之间的分隔符怎么改？", back: "print(x, end=\"\") 不换行；print(a, b, sep=\"-\") 改分隔符。" },
    { id: "c03c", ch: "ch03", topic: "格式化小数", front: "f-string 里怎么把一个 float 保留两位小数？", back: "f\"{score:.2f}\" → 95.57。冒号后面是格式说明：.2f = 小数点后 2 位的定点数。百分数用 {x:.1%}。" },
    { id: "c04a", ch: "ch04", topic: "分支", front: "if / elif / else 的判断顺序是怎样的？", back: "从上往下逐个判断，命中一个就执行它那一块、然后跳出整条链，后面的条件**完全不看**。所以顺序很重要：先判断范围窄的。" },
    { id: "c04b", ch: "ch04", topic: "语法易错", front: "写 if 最容易漏掉哪两样东西？", back: "条件后面的**英文冒号** `:`，以及下一行的**缩进**。少了任何一个都是 SyntaxError。" },
    { id: "c05a", ch: "ch05", topic: "range", front: "range(1, 10, 2) 会产生哪些数？range 含头含尾？", back: "1, 3, 5, 7, 9。含头不含尾（不含 10）。三个参数是 起点、终点（不含）、步长。" },
    { id: "c05b", ch: "ch05", topic: "break / continue", front: "break 和 continue 的区别？", back: "break 直接结束整个循环；continue 只跳过本轮剩下的代码，继续下一轮。（记：break 是退赛，continue 是系鞋带继续跑）" },
    { id: "c05c", ch: "ch05", topic: "死循环", front: "while 写成死循环了，怎么停下来？写 while 时怎么预防？", back: "终端里按 Ctrl+C 强制中断。预防：写 while 时**先写让条件变假的那一行**（比如 i += 1），再写循环体。" },
    { id: "c05d", ch: "ch05", topic: "遍历时修改", front: "for 循环里一边遍历列表一边 remove 元素，会发生什么？", back: "会跳着删、漏掉元素——迭代器按位置走，删一个后面的全部前移。解决：遍历副本 `for x in a[:]`，或生成新列表。" },
    { id: "c06a", ch: "ch06", topic: "函数三要素", front: "一个函数由哪三部分组成？", back: "名字、参数、返回值（return）。没有 return 的函数返回 None——它只是「做了事」，没有「交出结果」。" },
    { id: "c06b", ch: "ch06", topic: "默认参数", front: "def f(x, lst=[]) 有什么坑？正确写法是什么？", back: "默认值只在**定义时创建一次**，所有调用共享同一个列表，会越积越多。正确写法：lst=None，函数体里再 `if lst is None: lst = []`。" },
    { id: "c06c", ch: "ch06", topic: "return vs print", front: "return 和 print 的区别？", back: "print 把值显示给人看并返回 None，**不会结束函数**；return 把值交给调用它的代码，并结束本次函数调用。要复用结果就必须 return。" },
    { id: "c07a", ch: "ch07", topic: "切片", front: "a[::-1] 是什么？a[1:3] 取的是哪几个？", back: "a[::-1] 是倒序（从头到尾，步长 -1）。a[1:3] 取下标 1 和 2 两个元素，不含下标 3。切片含头不含尾。" },
    { id: "c07b", ch: "ch07", topic: "sort vs sorted", front: "list.sort() 和 sorted(list) 的区别？", back: "a.sort() 原地排序、返回 None（所以别写 a = a.sort()）；sorted(a) 返回新列表、原列表不变。" },
    { id: "c07c", ch: "ch07", topic: "循环拼字符串", front: "为什么循环里大量拼字符串通常推荐 join？", back: "字符串不可变，+= 会创建新字符串并可能反复复制已有内容，数据大时额外开销明显。通常先收集到列表，最后 \"\".join(列表)，代码意图也更清楚。" },
    { id: "c07d", ch: "ch07", topic: "容器选型", front: "要「查改删」用什么？要「按键快速查找」用什么？", back: "有序、要增删改 → 列表 list；按名字/键直达 → 字典 dict（O(1) 查找，比列表遍历快得多）。数据一多差距是数量级的。" },
    { id: "c08a", ch: "ch08", topic: "字典取值", front: "d[\"x\"] 和 d.get(\"x\") 的区别？", back: "键不存在时 d[\"x\"] 抛 KeyError；d.get(\"x\") 返回 None，d.get(\"x\", 0) 返回你给的默认值。不确定键在不在就用 get。" },
    { id: "c08b", ch: "ch08", topic: "集合运算", front: "集合的 & | - 分别对应数学里的什么？举例怎么找两份名单的共同人员？", back: "& 交集、| 并集、- 差集。共同人员：set(a) & set(b)，一行搞定。集合还能自动去重。" },
    { id: "c08c", ch: "ch08", topic: "遍历字典", front: "怎么一次遍历字典的键和值？只想要键呢？", back: "for k, v in d.items(): ... ；只要键直接 for k in d: 或 d.keys()；只要值 d.values()。" },
    { id: "c09a", ch: "ch09", topic: "lambda", front: "lambda 是什么？写一个求平方的 lambda。", back: "匿名函数，只能写一个表达式、自动返回。sq = lambda x: x ** 2。常用于 sorted(key=...) 这种地方。" },
    { id: "c09b", ch: "ch09", topic: "可变参数", front: "*args 和 **kwargs 分别接收什么？", back: "*args 把多余的位置参数收成元组；**kwargs 把多余的关键字参数收成字典。记「一颗星排队，两颗星对号入座」。" },
    { id: "c09c", ch: "ch09", topic: "递归", front: "写递归必须有什么？缺了会怎样？", back: "必须有**出口条件**（base case），且每层都更接近出口。缺了就是无限递归 → RecursionError（栈溢出）。" },
    { id: "c10a", ch: "ch10", topic: "文件模式", front: "open 的 r / w / a 三种模式分别是什么行为？", back: "r 只读（文件不存在报错）；w 写入并**先清空**原内容（最危险）；a 追加到末尾。用 w 打开重要文件前先深呼吸。" },
    { id: "c10b", ch: "ch10", topic: "with", front: "为什么推荐 with open(...) as f: 而不是 f = open(...)？", back: "with 保证离开代码块时自动 close，即使中间报错也关。手动 open 忘 close 会占着文件，Windows 上会导致文件删不掉。" },
    { id: "c10c", ch: "ch10", topic: "编码", front: "读写文本文件为什么要写 encoding=\"utf-8\"？", back: "Windows 中文版默认 GBK，Linux/Mac 默认 UTF-8。不指定就「在我电脑上好好的，到你那就乱码」。规则：永远显式写 utf-8。" },
    { id: "c11a", ch: "ch11", topic: "异常", front: "try / except / else / finally 四个块分别在什么时候执行？", back: "try 里放可能出错的代码；except 捕到对应异常时执行；else 在 try 没出错时执行；finally 无论成功失败都执行（收尾用）。" },
    { id: "c12a", ch: "ch12", topic: "类", front: "__init__ 什么时候执行？self 到底是什么？", back: "__init__ 在创建对象时自动执行，用来初始化属性。self 就是「这个对象自己」，实例方法的第一个参数固定是它，调用时不用手写。" },
    { id: "c13a", ch: "ch13", topic: "继承", front: "继承怎么写？「重写」是什么意思？", back: "class 子类(父类): 就继承了父类的属性和方法。重写 = 在子类里定义同名方法覆盖父类的行为，还可以用 super() 调用父类原版。" },
    { id: "c14a", ch: "ch14", topic: "装饰器", front: "装饰器一句话说是什么？", back: "一个「接收函数、返回新函数」的函数，用来在不改原函数代码的前提下加功能（计时、日志、权限）。写在函数上用 @名字。" },
    { id: "c15a", ch: "ch15", topic: "正则", front: "正则里 \\d、\\w、\\s 分别匹配什么？", back: "\\d 数字 0-9；\\w 字母数字下划线；\\s 空白字符（空格、换行、Tab）。加量词：+ 一个或多个，* 零个或多个，? 零个或一个。" }
  ];

  /* ============================================================
     排期算法（纯函数，可测）
     ============================================================ */
  function pad(n) { return String(n).padStart(2, "0"); }

  function todayStr(date) {
    const d = date || new Date();
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }

  function parseISO(iso) {
    const [y, m, d] = String(iso).split("-").map(Number);
    return new Date(y, (m || 1) - 1, d || 1);
  }

  function addDays(iso, n) {
    const d = parseISO(iso);
    d.setDate(d.getDate() + n);
    return todayStr(d);
  }

  function daysBetween(a, b) {
    const ms = parseISO(b).getTime() - parseISO(a).getTime();
    return Math.round(ms / 86400000);
  }

  function newState() {
    return { due: null, interval: 0, reps: 0, lapses: 0, lastGrade: null, lastAt: null };
  }

  /**
   * 自评之后，这张卡下次什么时候再来。
   * again 忘了 → 今天再来（间隔清零）
   * hard  勉强 → 间隔 ×1.5，至少 1 天
   * good  熟了 → 新卡 3 天 → 7 天 → 之后每次 ×2.2
   */
  function nextState(prev, grade, today) {
    const s = Object.assign(newState(), prev || {});
    const t = today || todayStr();
    if (grade === "again") {
      s.interval = 0;
      s.reps = 0;
      s.lapses = (s.lapses || 0) + 1;
      s.due = t;
    } else if (grade === "hard") {
      s.interval = s.interval < 1 ? 1 : Math.max(1, Math.round(s.interval * 1.5));
      s.reps = (s.reps || 0) + 1;
      s.due = addDays(t, s.interval);
    } else {
      s.interval = s.interval < 1 ? 3 : s.interval < 3 ? 7 : Math.round(s.interval * 2.2);
      s.reps = (s.reps || 0) + 1;
      s.due = addDays(t, s.interval);
    }
    s.lastGrade = grade;
    s.lastAt = t;
    return s;
  }

  function isDue(state, today) {
    return !!(state && state.due && state.due <= today);
  }

  /** 按章节轮转，避免连着出同一章的卡 */
  function interleave(cards) {
    const buckets = new Map();
    for (const c of cards) {
      if (!buckets.has(c.ch)) buckets.set(c.ch, []);
      buckets.get(c.ch).push(c);
    }
    const keys = [...buckets.keys()].sort();
    const out = [];
    let more = true;
    while (more) {
      more = false;
      for (const k of keys) {
        const b = buckets.get(k);
        if (b.length) { out.push(b.shift()); more = true; }
      }
    }
    return out;
  }

  /**
   * 组装今天的队列：到期的先排，再补 N 张新卡，最后交错打散。
   * @param {Array} cards 卡片库
   * @param {Object} states { cardId: state }
   * @param {string} today YYYY-MM-DD
   * @param {{newLimit?: number}} opts
   */
  function buildQueue(cards, states, today, opts) {
    const o = opts || {};
    const newLimit = o.newLimit === undefined ? 6 : o.newLimit;
    const t = today || todayStr();
    const due = cards.filter(c => isDue(states[c.id], t));
    const fresh = cards.filter(c => !states[c.id]).slice(0, newLimit);
    return interleave(due.concat(fresh));
  }

  function stats(cards, states, today) {
    const t = today || todayStr();
    const due = cards.filter(c => isDue(states[c.id], t)).length;
    const fresh = cards.filter(c => !states[c.id]).length;
    const done = cards.filter(c => states[c.id] && states[c.id].lastAt === t).length;
    const mastered = cards.filter(c => states[c.id] && states[c.id].interval >= 21).length;
    return { due, fresh, done, mastered, total: cards.length };
  }

  const api = Object.freeze({
    CARDS, todayStr, addDays, daysBetween, newState, nextState, isDue,
    interleave, buildQueue, stats, cardById: id => CARDS.find(c => c.id === id) || null
  });
  window.PythonReview = api;

  /* ============================================================
     界面
     ============================================================ */
  const STORE_KEY = "pystudy.review.v1";

  function esc(s) {
    return String(s).replace(/[&<>"']/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]));
  }

  function mdLite(s) {
    return esc(s).replace(/\*\*(.+?)\*\*/g, "<b>$1</b>").replace(/`(.+?)`/g, "<code>$1</code>");
  }

  function init() {
    const root = document.getElementById("reviewApp");
    if (!root) return;

    const state = loadState();
    const today = todayStr();

    const dueEl = root.querySelector("#rvDue");
    const newEl = root.querySelector("#rvNew");
    const doneEl = root.querySelector("#rvDone");
    const cardEl = root.querySelector("#rvCard");
    const emptyEl = root.querySelector("#rvEmpty");
    const summaryEl = root.querySelector("#rvSummary");
    const frontEl = root.querySelector("#rvFront");
    const backEl = root.querySelector("#rvBack");
    const backTextEl = root.querySelector("#rvBackText");
    const answerEl = root.querySelector("#rvAnswer");
    const chEl = root.querySelector("#rvCardCh");
    const idxEl = root.querySelector("#rvCardIdx");
    const revealBtn = root.querySelector("#rvReveal");

    let queue = [];
    let pos = 0;
    let attempts = new Map();  // 本次会话每张卡被评了几次
    let sessionCount = 0;
    let sessionGrades = { again: 0, hard: 0, good: 0 };

    function loadState() {
      try { return JSON.parse(localStorage.getItem(STORE_KEY)) || { states: {} }; }
      catch { return { states: {} }; }
    }
    function persist() {
      state.states ??= {};
      try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch { /* 隐私模式 */ }
    }

    function refreshStats() {
      const s = stats(CARDS, state.states, today);
      if (dueEl) dueEl.textContent = s.due;
      if (newEl) newEl.textContent = Math.min(s.fresh, 6);
      if (doneEl) doneEl.textContent = s.done;
      document.querySelectorAll("[data-review-badge]").forEach(el => {
        const n = s.due;
        el.textContent = n > 0 ? String(n) : "";
        el.hidden = n === 0;
      });
      return s;
    }

    function showEmpty(why) {
      cardEl.hidden = true;
      emptyEl.hidden = false;
      const s = stats(CARDS, state.states, today);
      const nextDue = CARDS
        .map(c => state.states[c.id])
        .filter(x => x && x.due && x.due > today)
        .map(x => x.due)
        .sort()[0];
      emptyEl.innerHTML = why === "done-session"
        ? `<h3>这一轮走完了</h3>
           <p>本次复习 ${sessionCount} 张：忘了 ${sessionGrades.again}、勉强 ${sessionGrades.hard}、熟了 ${sessionGrades.good}。</p>
           <p class="empty-note">${nextDue ? `下一批到期在 <b>${esc(nextDue)}</b>（${daysBetween(today, nextDue)} 天后）。` : "题库已经全部排上了。"}今天别再刷了——间隔重复的力量在于「等」，不在于「多」。</p>
           <button class="btn" id="rvAgain" type="button">还有力气，再来一轮</button>`
        : `<h3>今天没有到期的卡</h3>
           <p>${s.fresh > 0 ? `还有 ${s.fresh} 张新卡没开始，可以提前学几张。` : "全部卡片都已经排进复习计划了。"}</p>
           <p class="empty-note">${nextDue ? `下次到期：<b>${esc(nextDue)}</b>。` : ""}没有到期卡的日子里，去练习场写代码比反复刷卡片有用。</p>
           ${s.fresh > 0 ? `<button class="btn accent" id="rvAgain" type="button">学 ${Math.min(s.fresh, 6)} 张新卡</button>` : ""}`;
      emptyEl.querySelector("#rvAgain")?.addEventListener("click", startSession);
      refreshStats();
    }

    function startSession() {
      queue = buildQueue(CARDS, state.states, today, { newLimit: 6 });
      pos = 0;
      attempts = new Map();
      sessionCount = 0;
      sessionGrades = { again: 0, hard: 0, good: 0 };
      summaryEl.hidden = true;
      emptyEl.hidden = true;
      if (!queue.length) { showEmpty("empty"); return; }
      renderCard();
    }

    function renderCard() {
      if (pos >= queue.length) { showEmpty("done-session"); return; }
      const card = queue[pos];
      cardEl.hidden = false;
      chEl.textContent = `${card.ch} · ${card.topic}`;
      idxEl.textContent = `第 ${pos + 1} / ${queue.length} 张`;
      frontEl.innerHTML = mdLite(card.front);
      backTextEl.innerHTML = mdLite(card.back);
      backEl.hidden = true;
      answerEl.value = "";
      answerEl.hidden = false;
      answerEl.focus();

      // 下次间隔预览
      const st = state.states[card.id] || newState();
      const hardNext = nextState(st, "hard", today).interval;
      const goodNext = nextState(st, "good", today).interval;
      const hardHint = root.querySelector("#rvHardHint");
      const goodHint = root.querySelector("#rvGoodHint");
      if (hardHint) hardHint.textContent = hardNext <= 1 ? "明天" : `${hardNext} 天后`;
      if (goodHint) goodHint.textContent = `${goodNext} 天后`;
    }

    function reveal() {
      backEl.hidden = false;
      answerEl.hidden = true;
      revealBtn.textContent = "再看一遍问题";
      revealBtn.dataset.mode = "hide";
      backEl.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
    function unreveal() {
      backEl.hidden = true;
      answerEl.hidden = false;
      revealBtn.textContent = "看答案";
      revealBtn.dataset.mode = "show";
    }

    revealBtn.addEventListener("click", () => {
      if (revealBtn.dataset.mode === "hide") unreveal();
      else reveal();
    });

    function applyGrade(grade) {
      const card = queue[pos];
      if (!card) return;
      const prev = state.states[card.id] || newState();
      state.states[card.id] = nextState(prev, grade, today);
      persist();
      sessionCount++;
      sessionGrades[grade]++;
      const n = (attempts.get(card.id) || 0) + 1;
      attempts.set(card.id, n);

      // 答错的卡当天再出现一次（但最多 3 次，避免卡死）
      if (grade === "again" && n < 3) {
        const at = Math.min(queue.length, pos + 2 + Math.floor(Math.random() * 2));
        queue.splice(at, 0, card);
      }
      pos++;
      refreshStats();
      if (grade === "good" && sessionCount % 5 === 0 && typeof addXP === "function") {
        addXP(6, "复习卡");
      }
      renderCard();
    }

    root.querySelector(".rv-grades")?.addEventListener("click", e => {
      const btn = e.target.closest("[data-grade]");
      if (btn) applyGrade(btn.dataset.grade);
    });

    answerEl?.addEventListener("keydown", e => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") { e.preventDefault(); reveal(); }
    });

    document.addEventListener("keydown", e => {
      const view = document.getElementById("view-review");
      if (!view || !view.classList.contains("active")) return;
      if (e.target && /INPUT|TEXTAREA|SELECT/.test(e.target.tagName) && !(e.key === "Escape")) {
        if (e.key === "Escape") { e.target.blur(); return; }
        return;
      }
      if (e.key === " " || e.key === "Spacebar") { e.preventDefault(); revealBtn.click(); }
      if (!backEl.hidden) {
        if (e.key === "1") applyGrade("again");
        if (e.key === "2") applyGrade("hard");
        if (e.key === "3") applyGrade("good");
      }
    });

    startSession();
    refreshStats();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true });
  else init();
})();
