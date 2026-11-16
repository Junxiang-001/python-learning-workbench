/* 生成 exercises-bank.js：把 MBPP（Apache-2.0）里本地解释器能真正跑通的题，
 * 配上中文题干与章节归属；再加上按课程章节自己出的题。
 * 用法：node tools/build-bank.js
 */
const fs = require('node:fs');
const path = require('node:path');

const passing = JSON.parse(fs.readFileSync(path.join(__dirname, 'mbpp', 'passing.json'), 'utf8'));
const byId = new Map(passing.map(t => [t.task_id, t]));

/* ---------- MBPP 精选中文化：task_id -> 说明 ---------- */
const PICK = {
  3:   { t: "判断不是素数", ch: "ch05", lv: "进阶", c: "素数只能被 1 和自己整除。判断「不是素数」要把 1 和小于等于 1 的数单独处理。", p: "写一个函数，判断传入的整数 n 是不是非素数（合数或 1）。", cond: "函数名必须是 is_not_prime，对 2 返回 False、对 4 返回 True。", h: ["小于等于 1 的数既不是素数也不是合数，题目要求算「非素数」。", "从 2 试到 n-1，能整除就说明不是素数。"] },
  65:  { t: "把嵌套列表压平再求和", ch: "ch07", lv: "进阶", c: "列表里还能放列表。压平就是把所有层剥开变成一层，再逐个相加。", p: "写一个函数，把嵌套列表压平，并返回所有元素的总和。", cond: "函数名必须是 flatten_list，接受嵌套列表，返回一个数字。", h: ["两层 for 循环：外层取子列表，内层取元素。", "也可以在函数里再递归处理更深的嵌套。"] },
  79:  { t: "判断单词长度的奇偶", ch: "ch04", lv: "入门", c: "len() 拿长度，% 2 判断奇偶。这是条件判断最常见的写法。", p: "写一个函数，判断传入单词的长度是不是奇数。", cond: "函数名必须是 is_odd_length，用 len() 和 % 2 判断。", h: ["len(word) % 2 == 1 就是奇数长度。", "空字符串长度为 0，是偶数。"] },
  90:  { t: "找最长单词的长度", ch: "ch07", lv: "入门", c: "遍历列表时用一个变量记住「目前最长的」，是比较类问题的通用套路。", p: "写一个函数，返回列表中长度最长的单词有多长。", cond: "函数名必须是 longest_word，返回一个整数。", h: ["先把第一个单词的长度当作最大值。", "后面每个都比一比，更大就替换。"] },
  96:  { t: "数一个数的因数有几个", ch: "ch05", lv: "进阶", c: "从 1 试到 n，能整除 n 的就是因数。数出来的个数就是答案。", p: "写一个函数，返回整数 n 一共有多少个因数。", cond: "函数名必须是 divisor，对 12 应返回 6。", h: ["1 和 n 本身都算因数。", "用 for 循环加一个计数器。"] },
  128: { t: "挑出比 n 长的单词", ch: "ch07", lv: "入门", c: "过滤列表：遍历 + if + append，或者一行列表推导式。", p: "写一个函数，从单词列表里挑出长度大于 n 的单词。", cond: "函数名必须是 long_words，返回一个新列表。", h: ["创建一个空列表，把符合条件的 append 进去。", "也可以用列表推导式一行写完。"] },
  141: { t: "给列表排序", ch: "ch07", lv: "入门", c: "Python 自带排序，不用自己写算法。sorted() 返回新列表。", p: "写一个函数，返回把输入列表排序后的结果。", cond: "函数名必须是 heap_queue，返回排好序的新列表。", h: ["return sorted(列表) 就够了。", "注意 sorted() 不改原列表。"] },
  145: { t: "数组里最大的一对差值", ch: "ch07", lv: "进阶", c: "嵌套遍历取两两组合，是「找最大值」类问题的暴力解法。", p: "写一个函数，返回数组中任意两个元素相减能得到的最大差。", cond: "函数名必须是 max_difference，返回一个数字。", h: ["两层循环枚举所有 (i, j) 组合。", "用一个变量记录目前为止的最大差。"] },
  161: { t: "从列表里去掉另一列表的元素", ch: "ch07", lv: "进阶", c: "集合的 in 判断比列表快，判重用 set 更省事。", p: "写一个函数，把 list1 里所有出现在 list2 中的元素去掉，返回剩下的。", cond: "函数名必须是 remove_elements，返回一个新列表。", h: ["先把 list2 转成 set，判断快得多。", "用列表推导式过滤最简洁。"] },
  168: { t: "数一个数在列表里出现几次", ch: "ch07", lv: "入门", c: "统计次数有两种写法：list.count() 一行搞定，或者自己写循环。", p: "写一个函数，返回某个数字在列表里出现的次数。", cond: "函数名必须是 frequency，返回一个整数。", h: ["列表自带 count() 方法。", "自己写的话就用循环加计数器。"] },
  170: { t: "求指定区间的元素和", ch: "ch07", lv: "入门", c: "切片 array[start:end+1] 取出区间，再 sum() 求和。", p: "写一个函数，返回列表里从下标 start 到 end（含两端）的元素之和。", cond: "函数名必须是 sum_range_list，注意 end 是包含在内的。", h: ["切片含头不含尾，所以终点要 +1。", "sum(列表[起点:终点+1]) 即可。"] },
  226: { t: "去掉奇数位置的字符", ch: "ch07", lv: "入门", c: "字符串可以按位置取字符。下标从 0 开始，所以「奇数位置」是下标 1、3、5……", p: "写一个函数，去掉字符串中下标为奇数的字符，返回剩下的。", cond: "函数名必须是 odd_values_string，对 \"abcdef\" 应返回 \"ace\"。", h: ["切片加步长 s[::2] 取的就是偶数下标。", "注意题目说的是下标为奇数，不是第 1、3、5 个。"] },
  250: { t: "数元组里某个元素出现几次", ch: "ch07", lv: "入门", c: "元组和列表一样支持遍历和 count()。", p: "写一个函数，统计元素 x 在元组里出现了几次。", cond: "函数名必须是 count_occurrence，返回一个整数。", h: ["元组也有 count() 方法。", "或者用循环自己数。"] },
  270: { t: "偶数位置上的偶数和", ch: "ch07", lv: "进阶", c: "两个条件同时成立才累加：位置是偶数，值也是偶数。", p: "写一个函数，求列表里「下标为偶数且数值为偶数」的元素之和。", cond: "函数名必须是 even_position_even_sum，对 [2, 4, 6, 8] 应返回 8。", h: ["用 enumerate 同时拿到下标和值。", "两个判断用 and 连起来。"] },
  272: { t: "取出每个元组的最后一个元素", ch: "ch07", lv: "入门", c: "元组取末位用 [-1]，或者 index(len-1)。", p: "写一个函数，返回列表中每个元组的最后一个元素组成的新列表。", cond: "函数名必须是 rear_elements，返回列表。", h: ["对每个元组取 [-1]。", "列表推导式：[x[-1] for x in 列表]。"] },
  295: { t: "求一个数所有因数之和", ch: "ch05", lv: "进阶", c: "和「因数个数」是同一套遍历，只是把计数换成累加。", p: "写一个函数，返回整数 n 所有因数相加的和。", cond: "函数名必须是 sum_div，对 12 应返回 28。", h: ["12 的因数是 1、2、3、4、6、12。", "能整除就加进总和。"] },
  394: { t: "判断元组里有没有重复", ch: "ch08", lv: "入门", c: "元组长度和转成集合后的长度一样，就说明没有重复。", p: "写一个函数，判断元组里的元素是不是全都不重复。", cond: "函数名必须是 check_distinct，返回 True 或 False。", h: ["len(set(tup)) == len(tup) 就是没有重复。", "集合会自动去重。"] },
  412: { t: "去掉列表里的奇数", ch: "ch07", lv: "入门", c: "筛选列表：条件取反时要小心，题目要的是留下偶数。", p: "写一个函数，返回列表里所有的偶数。", cond: "函数名必须是 remove_odd，返回新列表。", h: ["x % 2 == 0 表示偶数。", "用列表推导式过滤。"] },
  413: { t: "取每个元组的第 n 个元素", ch: "ch07", lv: "进阶", c: "元组下标从 0 开始，题目里的 n 是按位置数还是从 0 数，要看清。", p: "写一个函数，从元组列表里取出每个元组的第 n 个元素。", cond: "函数名必须是 extract_nth_element，返回列表。", h: ["先试着用 0 和 1 跑一遍看结果对不对。", "注意边界，n 不能超过元组长度。"] },
  421: { t: "用分隔符把元组连成字符串", ch: "ch07", lv: "入门", c: "join 是字符串拼接的标准做法，但它只接受字符串元素。", p: "写一个函数，用分隔符把元组里的各个元素连成一个字符串。", cond: "函数名必须是 concatenate_tuple，返回字符串。", h: ["\"分隔符\".join(元组)。", "元素不是字符串时先转换。"] },
  436: { t: "挑出列表里的负数", ch: "ch07", lv: "入门", c: "条件判断 + 过滤，负数就是小于 0。", p: "写一个函数，返回列表里所有的负数。", cond: "函数名必须是 neg_nos，返回新列表。", h: ["x < 0 就是负数。", "0 既不是正数也不是负数。"] },
  443: { t: "找最大的负数", ch: "ch07", lv: "进阶", c: "在「满足条件的一批数」里找最大，要先过滤再取 max。", p: "写一个函数，返回列表里最大的那个负数。", cond: "函数名必须是 largest_neg，返回一个数。", h: ["先筛出所有负数，再取 max()。", "如果列表里没有负数要返回 None。"] },
  456: { t: "反转列表里的每个字符串", ch: "ch07", lv: "入门", c: "字符串反转用切片 [::-1]，步长 -1 表示倒着走。", p: "写一个函数，把列表里每个字符串都反转，返回新列表。", cond: "函数名必须是 reverse_string_list，用切片实现。", h: ["s[::-1] 就是反转后的字符串。", "对列表每个元素做这件事用推导式。"] },
  460: { t: "取每个子列表的第一个元素", ch: "ch07", lv: "入门", c: "二维列表：外层循环取子列表，内层取第一个元素。", p: "写一个函数，返回列表里每个子列表的第一个元素。", cond: "函数名必须是 first_elements，返回列表。", h: ["x[0] 就是子列表的第一个元素。", "注意子列表为空时会报错。"] },
  479: { t: "取一个数的首位数字", ch: "ch02", lv: "进阶", c: "数字不能直接取下表，要先转成字符串，取第一个字符，再转回整数。", p: "写一个函数，返回整数 n 的第一位数字。", cond: "函数名必须是 first_digit，返回整数。", h: ["str(n)[0] 拿到的是字符，要 int() 转回来。", "负数要先取绝对值。"] },
  554: { t: "只留下列表里的奇数", ch: "ch07", lv: "入门", c: "和上一题刚好相反：这次留下奇数。", p: "写一个函数，返回列表里的所有奇数。", cond: "函数名必须是 odd_num_list，返回新列表。", h: ["x % 2 == 1 就是奇数。", "用列表推导式最快。"] },
  565: { t: "把字符串拆成字符列表", ch: "ch07", lv: "入门", c: "list(字符串) 就能把每个字符拆出来。", p: "写一个函数，把字符串拆成单个字符组成的列表。", cond: "函数名必须是 split_string，返回列表。", h: ["list(\"abc\") 得到 ['a','b','c']。", "也可以用列表推导式遍历。"] },
  572: { t: "合并多个列表并去重", ch: "ch08", lv: "进阶", c: "先去重再合并，或者合并后去重，两种思路都行。", p: "写一个函数，把两个列表合并，并去掉重复的数字。", cond: "函数名必须是 count_duplic, 注意去重后顺序不要求。", h: ["set(列表1 + 列表2) 一行去重。", "要保留顺序就用 for 循环加 in 判断。"] },
  573: { t: "唯一数字的乘积", ch: "ch08", lv: "进阶", c: "先用集合去掉重复，再把剩下的乘起来。", p: "写一个函数，返回列表里所有不重复数字的乘积。", cond: "函数名必须是 unique_product，返回一个数。", h: ["set(列表) 得到不重复的元素。", "乘法的初始值要用 1，不是 0。"] },
  63:  { t: "元组对里最大的差", ch: "ch07", lv: "进阶", c: "每个元组是一对数，先算每个元组内部的差，再取最大。", p: "写一个函数，返回元组列表里，每对数相减的差中的最大值。", cond: "函数名必须是 max_difference_between_tuples，返回一个数。", h: ["先对每个元组算 abs(a - b) 或 a - b。", "再取这些差的最大值。"] },
  75:  { t: "筛出整组都能被 k 整除的元组", ch: "ch07", lv: "进阶", c: "元组里每个元素都要满足条件，用 all() 或循环判断。", p: "写一个函数，从元组列表里挑出「每个元素都能被 k 整除」的那些元组。", cond: "函数名必须是 find_tuples，返回列表。", h: ["all(x % k == 0 for x in tup) 判断整组。", "外层再套一层遍历所有元组。"] },
  104: { t: "给每个子列表排序", ch: "ch07", lv: "进阶", c: "对列表里每个子列表分别排序，用推导式最直接。", p: "写一个函数，把列表里每个子列表内部的字符串排好序。", cond: "函数名必须是 sort_sublists，返回新的列表。", h: ["[sorted(sub) for sub in 列表]。", "sorted 返回新列表，不改变原数据。"] },
  140: { t: "把多个列表压平成集合", ch: "ch08", lv: "进阶", c: "集合会自动去重，压平后再转集合一步到位。", p: "写一个函数，把嵌套列表压平并去掉重复数字，返回集合。", cond: "函数名必须是 flatten_list，返回 set。", h: ["先收集所有元素到列表，再 set() 去重。", "注意这里返回的是集合不是列表。"] },
  165: { t: "数有几个字符和字母表位置对得上", ch: "ch07", lv: "挑战", c: "enumerate 同时拿下标和字符，ord() 拿 ASCII 码。大小写要统一再比。", p: "写一个函数，统计字符串里「字符下标」和它在字母表中的位置刚好相同的字符有几个（不区分大小写）。", cond: "函数名必须是 count_char_position，返回整数。", h: ["把字符串转小写，避免大小写干扰。", "ord(ch) - ord('a') 得到字母在表中的位置（从 0 开始）。"] },
  172: { t: "数子串出现了几次", ch: "ch07", lv: "入门", c: "字符串 count() 直接返回子串出现次数。", p: "写一个函数，统计子串 'std' 在给定字符串里出现了几次。", cond: "函数名必须是 count_occurrence，返回整数。", h: ["字符串有 count() 方法。", "注意区分大小写。"] },
  251: { t: "在每个元素前插入同一个元素", ch: "ch07", lv: "进阶", c: "遍历的同时要产出两个元素，用 append 两次或嵌套推导式。", p: "写一个函数，在列表每个元素前面插入指定元素，返回新列表。", cond: "函数名必须是 insert_element，返回列表。", h: ["建一个空列表，每个元素前面先 append 插入值，再 append 自己。", "也可以用 [x for item in 列表 for x in (插入值, item)]。"] },
  265: { t: "每 n 个切一段", ch: "ch07", lv: "进阶", c: "用 range(start, len, n) 配合切片就能分段。", p: "写一个函数，把列表按每 n 个元素切分成若干段，返回列表的列表。", cond: "函数名必须是 list_split，返回二维列表。", h: ["range(0, len(列表), n) 产生每段起点。", "用切片 [i:i+n] 取这一段。"] },
  414: { t: "判断有没有共同元素", ch: "ch08", lv: "入门", c: "集合求交集最快；不用集合的话就是两层循环。", p: "写一个函数，判断两个序列里有没有任何一个元素是共同的。", cond: "函数名必须是 is_contained，返回 True 或 False。", h: ["set(a) & set(b) 非空就说明有共同元素。", "也可以用 any(x in b for x in a)。"] },
  417: { t: "找所有元组的共同首元素", ch: "ch07", lv: "挑战", c: "先取每个元组的第一个元素，再看这些元素是不是全都一样。", p: "写一个函数，判断一组元组的第一个元素是不是都相同，是就返回该元素。", cond: "函数名必须是 find_common，都相同返回该值，否则返回 False。", h: ["先取出 [t[0] for t in 列表]。", "再用 len(set(结果)) == 1 判断是否全相同。"] },
  420: { t: "前 n 个偶数的立方和", ch: "ch05", lv: "进阶", c: "前 n 个偶数是 2、4、6……，立方后求和。", p: "写一个函数，求前 n 个偶数的立方和。", cond: "函数名必须是 cube_sum，对 n=2 应返回 72（2³+4³）。", h: ["第 i 个偶数是 2*(i+1)。", "用 for 循环累加 i**3。"] },
  431: { t: "两个列表有没有交集", ch: "ch08", lv: "入门", c: "集合交集判断，比两层循环快得多。", p: "写一个函数，判断两个列表是否至少有一个共同元素。", cond: "函数名必须是 common_element，返回 True 或 False。", h: ["set(a) & set(b) 即可。", "也可以用 any(x in b for x in a)。"] },
  444: { t: "按 k 截短每个元组", ch: "ch07", lv: "进阶", c: "元组切片同样支持 [start:end]，截取前 k 个就是 [:k]。", p: "写一个函数，把元组列表里每个元组只保留前 k 个元素。", cond: "函数名必须是 trim_tuples，返回元组列表。", h: ["tup[:k] 取前 k 个。", "对每个元组做这件事用推导式。"] },
  450: { t: "挑出指定长度的字符串", ch: "ch07", lv: "入门", c: "和「挑出比 n 长的词」一样，只是条件换成等于。", p: "写一个函数，从字符串列表里挑出长度正好等于 n 的那些。", cond: "函数名必须是 extract_string，返回列表。", h: ["len(s) == n 才保留。", "用列表推导式过滤。"] }
};

const LEVEL_ORDER = { "入门": 0, "进阶": 1, "挑战": 2 };

function firstDefLine(code) {
  const m = code.match(/^def\s+\w+\s*\([^)]*\)\s*:/m);
  return m ? m[0] : null;
}

const bank = [];
let missing = [];

for (const [idStr, meta] of Object.entries(PICK)) {
  const id = Number(idStr);
  const item = byId.get(id);
  if (!item) { missing.push(id); continue; }
  const defLine = firstDefLine(item.code);
  if (!defLine) { missing.push(id); continue; }
  const fname = (defLine.match(/def\s+(\w+)/) || [])[1];
  // 题干里的函数名一律以参考答案里的定义为准，手写必然写错
  const cond = /函数名必须是/.test(meta.cond)
    ? meta.cond.replace(/函数名必须是\s*\w+/, `函数名必须是 ${fname}`)
    : `函数名必须是 ${fname}。${meta.cond}`.trim();

  bank.push({
    id: `mbpp-${id}`,
    kind: "assert",
    level: meta.lv,
    chapter: meta.ch,
    title: meta.t,
    concept: meta.c,
    prompt: meta.p,
    condition: cond,
    starter: `${defLine}\n    # 在这里写你的实现\n    pass\n`,
    tests: item.test_list,
    hints: meta.h,
    solution: item.code,
    solutionNote: "这是官方的参考答案。对照着看你的思路差在哪一步。",
    source: `MBPP #${id}（Google Research，Apache-2.0）`
  });
}

/* ---------- 按课程章节自己出的题（输出型，贴合零基础与财务场景） ---------- */
const OWN = [
  {
    id: "own-str-slice", chapter: "ch07", level: "入门",
    title: "按位置切出文字", concept: "字符串切片 s[起点:终点] 含头不含尾，步长 -1 表示倒着取。",
    prompt: "已知 s = \"财务部的Python\"，用切片取出「财务部」三个字并输出。",
    condition: "输出 财务部，必须用切片，不能把字直接写死在 print 里。",
    starter: 's = "财务部的Python"\n# 用切片取出前三个字\n',
    expected: "财务部",
    checks: [{ re: "\\[", message: "输出对了，但这题要练切片：请用 s[:3] 这样的写法。" }],
    hints: ["前三个字的切片是 s[:3]。", "print(s[:3])"],
    solution: 's = "财务部的Python"\nprint(s[:3])',
    solutionNote: "试试 s[::-1] 看会得到什么。"
  },
  {
    id: "own-list-append", chapter: "ch07", level: "入门",
    title: "往列表里追加并遍历", concept: "append 在末尾加一个元素；for 循环把列表逐个取出来。",
    prompt: "建一个空列表，用 append 依次加入 3、6、9，然后遍历输出每个数。",
    condition: "输出三行：3、6、9。必须用 append 加元素，不能直接写列表字面量。",
    starter: "nums = []\n# 用 append 加入 3、6、9\n",
    expected: "3\n6\n9",
    checks: [{ re: "\\.append\\s*\\(", message: "要用 append 一个个加进去，而不是一开始就写成 [3, 6, 9]。" }],
    hints: ["nums.append(3) 加一个。", "加完用 for n in nums: print(n) 输出。"],
    solution: "nums = []\nnums.append(3)\nnums.append(6)\nnums.append(9)\nfor n in nums:\n    print(n)",
    solutionNote: "也可以用 nums += [3,6,9] 或 extend，但 append 是逐个加最直观的写法。"
  },
  {
    id: "own-dict-count", chapter: "ch08", level: "进阶",
    title: "用字典统计出现次数", concept: "字典的 get(键, 默认值) 让「第一次遇到就记 1、之后加 1」变得很顺。",
    prompt: '已知 words = ["苹果", "香蕉", "苹果", "橙子", "苹果"]，统计每个词出现几次并输出字典。',
    condition: "输出 {'苹果': 3, '香蕉': 1, '橙子': 1}，必须用字典累加，不能手写结果。",
    starter: 'words = ["苹果", "香蕉", "苹果", "橙子", "苹果"]\ncounts = {}\n# 遍历统计\n',
    expected: "{'苹果': 3, '香蕉': 1, '橙子': 1}",
    checks: [{ re: "\\.get\\s*\\(|in\\s+counts", message: "要用 get(键, 0) + 1 或者先判断键在不在，才能正确累加。" }],
    hints: ["counts[w] = counts.get(w, 0) + 1 一行就完成计数。", "最后 print(counts)。"],
    solution: 'words = ["苹果", "香蕉", "苹果", "橙子", "苹果"]\ncounts = {}\nfor w in words:\n    counts[w] = counts.get(w, 0) + 1\nprint(counts)',
    solutionNote: "这是词频统计的标准写法，处理流水摘要、报销类别都靠它。"
  },
  {
    id: "own-set-diff", chapter: "ch08", level: "进阶",
    title: "用集合找「谁没来」", concept: "集合差集 A - B 就是「在 A 里但不在 B 里」。",
    prompt: '已知全部 = {"张三", "李四", "王五"}，已到 = {"张三", "王五"}，用集合运算输出没到的人。',
    condition: "输出 李四，必须用集合差集，不能直接写名字。",
    starter: 'all_people = {"张三", "李四", "王五"}\narrived = {"张三", "王五"}\n# 用集合差集\n',
    expected: "李四",
    checks: [{ re: "-\\s*arrived|difference", message: "要用差集 all_people - arrived，而不是手动挑出来。" }],
    hints: ["差集运算符是减号：all_people - arrived。", "结果是一个集合，遍历输出即可。"],
    solution: 'all_people = {"张三", "李四", "王五"}\narrived = {"张三", "王五"}\nfor name in all_people - arrived:\n    print(name)',
    solutionNote: "集合运算比两层循环快得多，名单越大差距越明显。"
  },
  {
    id: "own-comprehension", chapter: "ch07", level: "进阶",
    title: "列表推导式一行筛数", concept: "推导式把「遍历 + 判断 + 收集」压成一行，读法是「把 for 后面每个 x 加工后收集起来」。",
    prompt: "用一行列表推导式，从 range(1, 21) 里挑出所有能被 3 整除的数，并输出。",
    condition: "输出 [3, 6, 9, 12, 15, 18]，必须用列表推导式，不能用 for 循环 append。",
    starter: "# 用一行推导式完成\n",
    expected: "[3, 6, 9, 12, 15, 18]",
    checks: [{ re: "\\[[^\\]]*for[^\\]]*\\]", message: "这题要练推导式：写成 [x for x in ... if ...] 的形式。" }],
    hints: ["结构是 [x for x in range(1, 21) if 条件]。", "条件写 x % 3 == 0。"],
    solution: "print([x for x in range(1, 21) if x % 3 == 0])",
    solutionNote: "推导式不是炫技，它是 Python 里表达「筛选/映射」最直接的语法。"
  },
  {
    id: "own-func-default", chapter: "ch06", level: "进阶",
    title: "带默认参数的函数", concept: "默认参数让调用时可以少传：不传就用默认值。",
    prompt: "定义函数 tax(amount, rate=0.06)，返回 amount * rate。输出 tax(1000) 和 tax(1000, 0.13)。",
    condition: "输出两行：60.0 和 130.0，必须有默认参数 rate=0.06。",
    starter: "# 定义 tax 函数\n",
    expected: "60.0\n130.0",
    checks: [{ re: "rate\\s*=\\s*0\\.06", message: "要有默认参数：def tax(amount, rate=0.06)。" }],
    hints: ["def tax(amount, rate=0.06): 下面 return amount * rate。", "两次调用分别 print。"],
    solution: "def tax(amount, rate=0.06):\n    return amount * rate\n\nprint(tax(1000))\nprint(tax(1000, 0.13))",
    solutionNote: "去掉小数点后的 .0 试试：print(amount * rate) 会显示 60.0 而不是 60，这是 float 和 int 的区别。"
  },
  {
    id: "own-try", chapter: "ch11", level: "进阶",
    title: "用 try 接住错误", concept: "错误不接住程序就崩。try/except 让「出错」变成一种可以处理的情况。",
    prompt: '对字符串 "abc" 调 int()，用 try/except 接住 ValueError，输出「输入不是数字」。',
    condition: "输出 输入不是数字，并且必须用 try/except 捕获 ValueError。",
    starter: 'text = "abc"\n# 用 try/except 接住转换失败\n',
    expected: "输入不是数字",
    checks: [{ re: "try\\s*:", message: "必须用 try/except 结构，不能直接 print 那句话。" }, { re: "except", message: "还差 except 分支：try 后面必须有 except 才能接住错误。" }],
    hints: ["try 里放 int(text)，except ValueError 里 print 提示。", "except 后面要写具体的异常类型。"],
    solution: 'text = "abc"\ntry:\n    n = int(text)\n    print(n)\nexcept ValueError:\n    print("输入不是数字")',
    solutionNote: "别写裸 except:——它会把所有错误（包括你自己写错的变量名）一起吞掉。"
  },
  {
    id: "own-class-simple", chapter: "ch12", level: "挑战",
    title: "写一个最小的类", concept: "类把数据和操作绑在一起；__init__ 在创建对象时自动执行，self 指对象自己。",
    prompt: '定义类 Book，__init__ 接收 title 和 price，方法 info() 返回 "书名：价格" 格式的字符串。创建 Book("Python入门", 59) 并输出 info()。',
    condition: "输出 书名：Python入门，价格：59，必须定义类和 __init__。",
    starter: "class Book:\n    # 补全 __init__ 和 info\n",
    expected: "书名：Python入门，价格：59",
    checks: [{ re: "class\\s+Book", message: "要有 class Book。" }, { re: "__init__", message: "还差 __init__ 方法。" }, { re: "def\\s+info", message: "还差 info 方法。" }],
    hints: ["__init__(self, title, price) 里写 self.title = title。", "info 里 return f\"书名：{self.title}，价格：{self.price}\"。"],
    solution: 'class Book:\n    def __init__(self, title, price):\n        self.title = title\n        self.price = price\n\n    def info(self):\n        return f"书名：{self.title}，价格：{self.price}"\n\nb = Book("Python入门", 59)\nprint(b.info())',
    solutionNote: "方法第一个参数永远是 self，调用时不用手动传。"
  },
  {
    id: "own-nested-loop", chapter: "ch05", level: "进阶",
    title: "嵌套循环打印表格", concept: "外层管行，内层管列。打印「几行几列」的东西全靠它。",
    prompt: "用嵌套循环输出一个 3 行 4 列的星号方阵，每行 4 个星号。",
    condition: "输出 3 行，每行 4 个星号（****），必须用嵌套 for 循环。",
    starter: "# 外层 3 次，内层 4 次\n",
    expected: "****\n****\n****",
    checks: [{ minFor: 2, message: "这题要练嵌套循环：两个 for，外层管行、内层管列。" }],
    hints: ["外层 for i in range(3)，内层 for j in range(4)。", "内层用 print(\"*\", end=\"\")，内层结束后单独 print() 换行。"],
    solution: 'for i in range(3):\n    for j in range(4):\n        print("*", end="")\n    print()',
    solutionNote: "把内层的 range(4) 改成 range(i+1) 就变成三角形了。"
  },
  {
    id: "own-while-guess", chapter: "ch05", level: "进阶",
    title: "while 循环猜数字", concept: "while 适合「不知道要转几次」的场景，条件满足就一直转。",
    prompt: "秘密数字是 7，从 1 开始每次加 2 地猜（1、3、5、7……），猜到就停，输出最后猜中的数字。",
    condition: "输出 7，必须用 while 循环，不能用 range 直接算。",
    starter: "secret = 7\nguess = 1\n# 用 while 一直猜\n",
    expected: "7",
    checks: [{ minWhile: 1, message: "这题要练 while：条件成立就一直循环。" }],
    hints: ["while guess <= secret: 里面 guess += 2。", "循环结束后 print(guess) 会打印 9，所以要在循环里判断相等就 break，或者循环条件写 guess != secret。"],
    solution: "secret = 7\nguess = 1\nwhile guess != secret:\n    guess += 2\nprint(guess)",
    solutionNote: "while 的两个常见死法：条件永远真（忘更新变量）、条件一开始就假（一次都不执行）。"
  },
  {
    id: "own-str-format", chapter: "ch03", level: "入门",
    title: "金额千分位显示", concept: "f-string 的格式说明符 :, 会自动加千分位，:,.2f 还能保留两位小数。",
    prompt: "已知金额 amount = 1234567.891，输出「1,234,567.89 元」。",
    condition: "输出 1,234,567.89 元，要用 f-string 的格式化，不能手动拼逗号。",
    starter: "amount = 1234567.891\n# 千分位 + 两位小数\n",
    expected: "1,234,567.89 元",
    checks: [{ re: ":,\\.2f|:,\\s*\\.2f", message: "要用格式说明符：{amount:,.2f}。" }],
    hints: ["写法是 f\"{amount:,.2f} 元\"。", "逗号管千分位，.2f 管两位小数。"],
    solution: 'amount = 1234567.891\nprint(f"{amount:,.2f} 元")',
    solutionNote: "财务场景里这条几乎天天用，比手动拼字符串靠谱得多。"
  },
  {
    id: "own-max-min", chapter: "ch07", level: "入门",
    title: "找最大值和最小值", concept: "max() 和 min() 一行拿到极值；想同时知道位置就用 index()。",
    prompt: "已知成绩 [78, 92, 65, 88]，输出最高分和最低分，格式「最高 92，最低 65」。",
    condition: "输出 最高 92，最低 65，必须用 max() 和 min()。",
    starter: "scores = [78, 92, 65, 88]\n# 取最高最低\n",
    expected: "最高 92，最低 65",
    checks: [{ re: "max\\s*\\(", message: "要用 max()。" }, { re: "min\\s*\\(", message: "还要用 min()。" }],
    hints: ["最高分是 max(scores)。", "用 f-string 拼成一句话输出。"],
    solution: 'scores = [78, 92, 65, 88]\nprint(f"最高 {max(scores)}，最低 {min(scores)}")',
    solutionNote: "空列表调 max() 会报错，真实项目里要先判断列表非空。"
  }
];

for (const o of OWN) bank.push(Object.assign({ kind: "output" }, o));

/* ---------- 排序并输出 ---------- */
const LEVEL_ORDER_ = LEVEL_ORDER;
bank.sort((a, b) => (LEVEL_ORDER_[a.level] - LEVEL_ORDER_[b.level]) || a.chapter.localeCompare(b.chapter) || a.title.localeCompare(b.title, 'zh'));

const header = `/* exercises-bank.js —— 扩展题库（自动生成，勿手改）
 *
 * 来源：
 *   1. MBPP（Mostly Basic Python Problems，Google Research，Apache-2.0）
 *      只收「题目自带参考答案 + 断言测试，能被本项目 pyexec 真正执行通过」的题，
 *      题干已中文化，判分仍用 MBPP 原始 assert 用例 —— 所以判分是真的。
 *   2. 按课程章节自出的题（输出型），贴零基础与财务场景。
 *
 * 重新生成：node tools/build-bank.js
 */
`;

const body = `window.PY_EXERCISE_BANK = ${JSON.stringify(bank, null, 2)};\n`;
fs.writeFileSync(path.join(__dirname, '..', 'exercises-bank.js'), header + body, 'utf8');

console.log(`生成 ${bank.length} 道题（MBPP ${bank.filter(b => b.kind === 'assert').length} + 自出 ${bank.filter(b => b.kind === 'output').length}）`);
console.log('难度分布：', bank.reduce((m, b) => (m[b.level] = (m[b.level] || 0) + 1, m), {}));
console.log('章节分布：', bank.reduce((m, b) => (m[b.chapter] = (m[b.chapter] || 0) + 1, m), {}));
if (missing.length) console.log('跳过（数据缺失）:', missing);
