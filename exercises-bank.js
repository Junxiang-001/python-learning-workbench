/* exercises-bank.js —— 扩展题库（自动生成，勿手改）
 *
 * 来源：
 *   1. MBPP（Mostly Basic Python Problems，Google Research，Apache-2.0）
 *      只收「题目自带参考答案 + 断言测试，能被本项目 pyexec 真正执行通过」的题，
 *      题干已中文化，判分仍用 MBPP 原始 assert 用例 —— 所以判分是真的。
 *   2. 按课程章节自出的题（输出型），贴零基础与财务场景。
 *
 * 重新生成：node tools/build-bank.js
 */
window.PY_EXERCISE_BANK = [
  {
    "kind": "output",
    "id": "own-str-format",
    "chapter": "ch03",
    "level": "入门",
    "title": "金额千分位显示",
    "concept": "f-string 的格式说明符 :, 会自动加千分位，:,.2f 还能保留两位小数。",
    "prompt": "已知金额 amount = 1234567.891，输出「1,234,567.89 元」。",
    "condition": "输出 1,234,567.89 元，要用 f-string 的格式化，不能手动拼逗号。",
    "starter": "amount = 1234567.891\n# 千分位 + 两位小数\n",
    "expected": "1,234,567.89 元",
    "checks": [
      {
        "re": ":,\\.2f|:,\\s*\\.2f",
        "message": "要用格式说明符：{amount:,.2f}。"
      }
    ],
    "hints": [
      "写法是 f\"{amount:,.2f} 元\"。",
      "逗号管千分位，.2f 管两位小数。"
    ],
    "solution": "amount = 1234567.891\nprint(f\"{amount:,.2f} 元\")",
    "solutionNote": "财务场景里这条几乎天天用，比手动拼字符串靠谱得多。"
  },
  {
    "id": "mbpp-79",
    "kind": "assert",
    "level": "入门",
    "chapter": "ch04",
    "title": "判断单词长度的奇偶",
    "concept": "len() 拿长度，% 2 判断奇偶。这是条件判断最常见的写法。",
    "prompt": "写一个函数，判断传入单词的长度是不是奇数。",
    "condition": "函数名必须是 word_len，用 len() 和 % 2 判断。",
    "starter": "def word_len(s):\n    # 在这里写你的实现\n    pass\n",
    "tests": [
      "assert word_len(\"Hadoop\") == False",
      "assert word_len(\"great\") == True",
      "assert word_len(\"structure\") == True"
    ],
    "hints": [
      "len(word) % 2 == 1 就是奇数长度。",
      "空字符串长度为 0，是偶数。"
    ],
    "solution": "def word_len(s): \n    s = s.split(' ')   \n    for word in s:    \n        if len(word)%2!=0: \n            return True  \n        else:\n          return False",
    "solutionNote": "这是官方的参考答案。对照着看你的思路差在哪一步。",
    "source": "MBPP #79（Google Research，Apache-2.0）"
  },
  {
    "kind": "output",
    "id": "own-str-slice",
    "chapter": "ch07",
    "level": "入门",
    "title": "按位置切出文字",
    "concept": "字符串切片 s[起点:终点] 含头不含尾，步长 -1 表示倒着取。",
    "prompt": "已知 s = \"财务部的Python\"，用切片取出「财务部」三个字并输出。",
    "condition": "输出 财务部，必须用切片，不能把字直接写死在 print 里。",
    "starter": "s = \"财务部的Python\"\n# 用切片取出前三个字\n",
    "expected": "财务部",
    "checks": [
      {
        "re": "\\[",
        "message": "输出对了，但这题要练切片：请用 s[:3] 这样的写法。"
      }
    ],
    "hints": [
      "前三个字的切片是 s[:3]。",
      "print(s[:3])"
    ],
    "solution": "s = \"财务部的Python\"\nprint(s[:3])",
    "solutionNote": "试试 s[::-1] 看会得到什么。"
  },
  {
    "id": "mbpp-565",
    "kind": "assert",
    "level": "入门",
    "chapter": "ch07",
    "title": "把字符串拆成字符列表",
    "concept": "list(字符串) 就能把每个字符拆出来。",
    "prompt": "写一个函数，把字符串拆成单个字符组成的列表。",
    "condition": "函数名必须是 split，返回列表。",
    "starter": "def split(word):\n    # 在这里写你的实现\n    pass\n",
    "tests": [
      "assert split('python') == ['p','y','t','h','o','n']",
      "assert split('Name') == ['N','a','m','e']",
      "assert split('program') == ['p','r','o','g','r','a','m']"
    ],
    "hints": [
      "list(\"abc\") 得到 ['a','b','c']。",
      "也可以用列表推导式遍历。"
    ],
    "solution": "def split(word): \n    return [char for char in word]",
    "solutionNote": "这是官方的参考答案。对照着看你的思路差在哪一步。",
    "source": "MBPP #565（Google Research，Apache-2.0）"
  },
  {
    "id": "mbpp-456",
    "kind": "assert",
    "level": "入门",
    "chapter": "ch07",
    "title": "反转列表里的每个字符串",
    "concept": "字符串反转用切片 [::-1]，步长 -1 表示倒着走。",
    "prompt": "写一个函数，把列表里每个字符串都反转，返回新列表。",
    "condition": "函数名必须是 reverse_string_list，用切片实现。",
    "starter": "def reverse_string_list(stringlist):\n    # 在这里写你的实现\n    pass\n",
    "tests": [
      "assert reverse_string_list(['Red', 'Green', 'Blue', 'White', 'Black'])==['deR', 'neerG', 'eulB', 'etihW', 'kcalB']",
      "assert reverse_string_list(['john','amal','joel','george'])==['nhoj','lama','leoj','egroeg']",
      "assert reverse_string_list(['jack','john','mary'])==['kcaj','nhoj','yram']"
    ],
    "hints": [
      "s[::-1] 就是反转后的字符串。",
      "对列表每个元素做这件事用推导式。"
    ],
    "solution": "def reverse_string_list(stringlist):\n    result = [x[::-1] for x in stringlist]\n    return result",
    "solutionNote": "这是官方的参考答案。对照着看你的思路差在哪一步。",
    "source": "MBPP #456（Google Research，Apache-2.0）"
  },
  {
    "id": "mbpp-141",
    "kind": "assert",
    "level": "入门",
    "chapter": "ch07",
    "title": "给列表排序",
    "concept": "Python 自带排序，不用自己写算法。sorted() 返回新列表。",
    "prompt": "写一个函数，返回把输入列表排序后的结果。",
    "condition": "函数名必须是 pancake_sort，返回排好序的新列表。",
    "starter": "def pancake_sort(nums):\n    # 在这里写你的实现\n    pass\n",
    "tests": [
      "assert pancake_sort([15, 79, 25, 38, 69]) == [15, 25, 38, 69, 79]",
      "assert pancake_sort([98, 12, 54, 36, 85]) == [12, 36, 54, 85, 98]",
      "assert pancake_sort([41, 42, 32, 12, 23]) == [12, 23, 32, 41, 42]"
    ],
    "hints": [
      "return sorted(列表) 就够了。",
      "注意 sorted() 不改原列表。"
    ],
    "solution": "def pancake_sort(nums):\n    arr_len = len(nums)\n    while arr_len > 1:\n        mi = nums.index(max(nums[0:arr_len]))\n        nums = nums[mi::-1] + nums[mi+1:len(nums)]\n        nums = nums[arr_len-1::-1] + nums[arr_len:len(nums)]\n        arr_len -= 1\n    return nums",
    "solutionNote": "这是官方的参考答案。对照着看你的思路差在哪一步。",
    "source": "MBPP #141（Google Research，Apache-2.0）"
  },
  {
    "id": "mbpp-170",
    "kind": "assert",
    "level": "入门",
    "chapter": "ch07",
    "title": "求指定区间的元素和",
    "concept": "切片 array[start:end+1] 取出区间，再 sum() 求和。",
    "prompt": "写一个函数，返回列表里从下标 start 到 end（含两端）的元素之和。",
    "condition": "函数名必须是 sum_range_list，注意 end 是包含在内的。",
    "starter": "def sum_range_list(list1, m, n):\n    # 在这里写你的实现\n    pass\n",
    "tests": [
      "assert sum_range_list([2,1,5,6,8,3,4,9,10,11,8,12], 8, 10) == 29",
      "assert sum_range_list([2,1,5,6,8,3,4,9,10,11,8,12], 5, 7) == 16",
      "assert sum_range_list([2,1,5,6,8,3,4,9,10,11,8,12], 7, 10) == 38"
    ],
    "hints": [
      "切片含头不含尾，所以终点要 +1。",
      "sum(列表[起点:终点+1]) 即可。"
    ],
    "solution": "def sum_range_list(list1, m, n):                                                                                                                                                                                                \n    sum_range = 0                                                                                                                                                                                                         \n    for i in range(m, n+1, 1):                                                                                                                                                                                        \n        sum_range += list1[i]                                                                                                                                                                                                  \n    return sum_range",
    "solutionNote": "这是官方的参考答案。对照着看你的思路差在哪一步。",
    "source": "MBPP #170（Google Research，Apache-2.0）"
  },
  {
    "id": "mbpp-272",
    "kind": "assert",
    "level": "入门",
    "chapter": "ch07",
    "title": "取出每个元组的最后一个元素",
    "concept": "元组取末位用 [-1]，或者 index(len-1)。",
    "prompt": "写一个函数，返回列表中每个元组的最后一个元素组成的新列表。",
    "condition": "函数名必须是 rear_extract，返回列表。",
    "starter": "def rear_extract(test_list):\n    # 在这里写你的实现\n    pass\n",
    "tests": [
      "assert rear_extract([(1, 'Rash', 21), (2, 'Varsha', 20), (3, 'Kil', 19)]) == [21, 20, 19]",
      "assert rear_extract([(1, 'Sai', 36), (2, 'Ayesha', 25), (3, 'Salman', 45)]) == [36, 25, 45]",
      "assert rear_extract([(1, 'Sudeep', 14), (2, 'Vandana', 36), (3, 'Dawood', 56)]) == [14, 36, 56]"
    ],
    "hints": [
      "对每个元组取 [-1]。",
      "列表推导式：[x[-1] for x in 列表]。"
    ],
    "solution": "def rear_extract(test_list):\n  res = [lis[-1] for lis in test_list]\n  return (res)",
    "solutionNote": "这是官方的参考答案。对照着看你的思路差在哪一步。",
    "source": "MBPP #272（Google Research，Apache-2.0）"
  },
  {
    "id": "mbpp-460",
    "kind": "assert",
    "level": "入门",
    "chapter": "ch07",
    "title": "取每个子列表的第一个元素",
    "concept": "二维列表：外层循环取子列表，内层取第一个元素。",
    "prompt": "写一个函数，返回列表里每个子列表的第一个元素。",
    "condition": "函数名必须是 Extract，返回列表。",
    "starter": "def Extract(lst):\n    # 在这里写你的实现\n    pass\n",
    "tests": [
      "assert Extract([[1, 2], [3, 4, 5], [6, 7, 8, 9]]) == [1, 3, 6]",
      "assert Extract([[1,2,3],[4, 5]]) == [1,4]",
      "assert Extract([[9,8,1],[1,2]]) == [9,1]"
    ],
    "hints": [
      "x[0] 就是子列表的第一个元素。",
      "注意子列表为空时会报错。"
    ],
    "solution": "def Extract(lst): \n    return [item[0] for item in lst]",
    "solutionNote": "这是官方的参考答案。对照着看你的思路差在哪一步。",
    "source": "MBPP #460（Google Research，Apache-2.0）"
  },
  {
    "id": "mbpp-412",
    "kind": "assert",
    "level": "入门",
    "chapter": "ch07",
    "title": "去掉列表里的奇数",
    "concept": "筛选列表：条件取反时要小心，题目要的是留下偶数。",
    "prompt": "写一个函数，返回列表里所有的偶数。",
    "condition": "函数名必须是 remove_odd，返回新列表。",
    "starter": "def remove_odd(l):\n    # 在这里写你的实现\n    pass\n",
    "tests": [
      "assert remove_odd([1,2,3]) == [2]",
      "assert remove_odd([2,4,6]) == [2,4,6]",
      "assert remove_odd([10,20,3]) == [10,20]"
    ],
    "hints": [
      "x % 2 == 0 表示偶数。",
      "用列表推导式过滤。"
    ],
    "solution": "def remove_odd(l):\n    for i in l:\n        if i % 2 != 0:\n            l.remove(i)\n    return l",
    "solutionNote": "这是官方的参考答案。对照着看你的思路差在哪一步。",
    "source": "MBPP #412（Google Research，Apache-2.0）"
  },
  {
    "id": "mbpp-226",
    "kind": "assert",
    "level": "入门",
    "chapter": "ch07",
    "title": "去掉奇数位置的字符",
    "concept": "字符串可以按位置取字符。下标从 0 开始，所以「奇数位置」是下标 1、3、5……",
    "prompt": "写一个函数，去掉字符串中下标为奇数的字符，返回剩下的。",
    "condition": "函数名必须是 odd_values_string，对 \"abcdef\" 应返回 \"ace\"。",
    "starter": "def odd_values_string(str):\n    # 在这里写你的实现\n    pass\n",
    "tests": [
      "assert odd_values_string('abcdef') == 'ace'",
      "assert odd_values_string('python') == 'pto'",
      "assert odd_values_string('data') == 'dt'",
      "assert odd_values_string('lambs') == 'lms'"
    ],
    "hints": [
      "切片加步长 s[::2] 取的就是偶数下标。",
      "注意题目说的是下标为奇数，不是第 1、3、5 个。"
    ],
    "solution": "def odd_values_string(str):\n  result = \"\" \n  for i in range(len(str)):\n    if i % 2 == 0:\n      result = result + str[i]\n  return result",
    "solutionNote": "这是官方的参考答案。对照着看你的思路差在哪一步。",
    "source": "MBPP #226（Google Research，Apache-2.0）"
  },
  {
    "id": "mbpp-168",
    "kind": "assert",
    "level": "入门",
    "chapter": "ch07",
    "title": "数一个数在列表里出现几次",
    "concept": "统计次数有两种写法：list.count() 一行搞定，或者自己写循环。",
    "prompt": "写一个函数，返回某个数字在列表里出现的次数。",
    "condition": "函数名必须是 frequency，返回一个整数。",
    "starter": "def frequency(a,x):\n    # 在这里写你的实现\n    pass\n",
    "tests": [
      "assert frequency([1,2,3], 4) == 0",
      "assert frequency([1,2,2,3,3,3,4], 3) == 3",
      "assert frequency([0,1,2,3,1,2], 1) == 2"
    ],
    "hints": [
      "列表自带 count() 方法。",
      "自己写的话就用循环加计数器。"
    ],
    "solution": "def frequency(a,x): \n    count = 0  \n    for i in a: \n      if i == x: \n        count += 1\n\n    return count",
    "solutionNote": "这是官方的参考答案。对照着看你的思路差在哪一步。",
    "source": "MBPP #168（Google Research，Apache-2.0）"
  },
  {
    "id": "mbpp-250",
    "kind": "assert",
    "level": "入门",
    "chapter": "ch07",
    "title": "数元组里某个元素出现几次",
    "concept": "元组和列表一样支持遍历和 count()。",
    "prompt": "写一个函数，统计元素 x 在元组里出现了几次。",
    "condition": "函数名必须是 count_X，返回一个整数。",
    "starter": "def count_X(tup, x):\n    # 在这里写你的实现\n    pass\n",
    "tests": [
      "assert count_X((10, 8, 5, 2, 10, 15, 10, 8, 5, 8, 8, 2),4) == 0",
      "assert count_X((10, 8, 5, 2, 10, 15, 10, 8, 5, 8, 8, 2),10) == 3",
      "assert count_X((10, 8, 5, 2, 10, 15, 10, 8, 5, 8, 8, 2),8) == 4"
    ],
    "hints": [
      "元组也有 count() 方法。",
      "或者用循环自己数。"
    ],
    "solution": "def count_X(tup, x): \n    count = 0\n    for ele in tup: \n        if (ele == x): \n            count = count + 1\n    return count",
    "solutionNote": "这是官方的参考答案。对照着看你的思路差在哪一步。",
    "source": "MBPP #250（Google Research，Apache-2.0）"
  },
  {
    "id": "mbpp-172",
    "kind": "assert",
    "level": "入门",
    "chapter": "ch07",
    "title": "数子串出现了几次",
    "concept": "字符串 count() 直接返回子串出现次数。",
    "prompt": "写一个函数，统计子串 'std' 在给定字符串里出现了几次。",
    "condition": "函数名必须是 count_occurance，返回整数。",
    "starter": "def count_occurance(s):\n    # 在这里写你的实现\n    pass\n",
    "tests": [
      "assert count_occurance(\"letstdlenstdporstd\") == 3",
      "assert count_occurance(\"truststdsolensporsd\") == 1",
      "assert count_occurance(\"makestdsostdworthit\") == 2",
      "assert count_occurance(\"stds\") == 1",
      "assert count_occurance(\"\") == 0"
    ],
    "hints": [
      "字符串有 count() 方法。",
      "注意区分大小写。"
    ],
    "solution": "def count_occurance(s):\n  count = 0\n  for i in range(len(s) - 2):\n    if (s[i] == 's' and s[i+1] == 't' and s[i+2] == 'd'):\n      count = count + 1\n  return count",
    "solutionNote": "这是官方的参考答案。对照着看你的思路差在哪一步。",
    "source": "MBPP #172（Google Research，Apache-2.0）"
  },
  {
    "id": "mbpp-128",
    "kind": "assert",
    "level": "入门",
    "chapter": "ch07",
    "title": "挑出比 n 长的单词",
    "concept": "过滤列表：遍历 + if + append，或者一行列表推导式。",
    "prompt": "写一个函数，从单词列表里挑出长度大于 n 的单词。",
    "condition": "函数名必须是 long_words，返回一个新列表。",
    "starter": "def long_words(n, str):\n    # 在这里写你的实现\n    pass\n",
    "tests": [
      "assert long_words(3,\"python is a programming language\")==['python','programming','language']",
      "assert long_words(2,\"writing a program\")==['writing','program']",
      "assert long_words(5,\"sorting list\")==['sorting']"
    ],
    "hints": [
      "创建一个空列表，把符合条件的 append 进去。",
      "也可以用列表推导式一行写完。"
    ],
    "solution": "def long_words(n, str):\n    word_len = []\n    txt = str.split(\" \")\n    for x in txt:\n        if len(x) > n:\n            word_len.append(x)\n    return word_len",
    "solutionNote": "这是官方的参考答案。对照着看你的思路差在哪一步。",
    "source": "MBPP #128（Google Research，Apache-2.0）"
  },
  {
    "id": "mbpp-436",
    "kind": "assert",
    "level": "入门",
    "chapter": "ch07",
    "title": "挑出列表里的负数",
    "concept": "条件判断 + 过滤，负数就是小于 0。",
    "prompt": "写一个函数，返回列表里所有的负数。",
    "condition": "函数名必须是 neg_nos，返回新列表。",
    "starter": "def neg_nos(list1):\n    # 在这里写你的实现\n    pass\n",
    "tests": [
      "assert neg_nos([-1,4,5,-6]) == [-1,-6]",
      "assert neg_nos([-1,-2,3,4]) == [-1,-2]",
      "assert neg_nos([-7,-6,8,9]) == [-7,-6]"
    ],
    "hints": [
      "x < 0 就是负数。",
      "0 既不是正数也不是负数。"
    ],
    "solution": "def neg_nos(list1):\n  out = []\n  for num in list1: \n    if num < 0: \n      out.append(num)\n  return out",
    "solutionNote": "这是官方的参考答案。对照着看你的思路差在哪一步。",
    "source": "MBPP #436（Google Research，Apache-2.0）"
  },
  {
    "id": "mbpp-450",
    "kind": "assert",
    "level": "入门",
    "chapter": "ch07",
    "title": "挑出指定长度的字符串",
    "concept": "和「挑出比 n 长的词」一样，只是条件换成等于。",
    "prompt": "写一个函数，从字符串列表里挑出长度正好等于 n 的那些。",
    "condition": "函数名必须是 extract_string，返回列表。",
    "starter": "def extract_string(str, l):\n    # 在这里写你的实现\n    pass\n",
    "tests": [
      "assert extract_string(['Python', 'list', 'exercises', 'practice', 'solution'] ,8)==['practice', 'solution']",
      "assert extract_string(['Python', 'list', 'exercises', 'practice', 'solution'] ,6)==['Python']",
      "assert extract_string(['Python', 'list', 'exercises', 'practice', 'solution'] ,9)==['exercises']"
    ],
    "hints": [
      "len(s) == n 才保留。",
      "用列表推导式过滤。"
    ],
    "solution": "def extract_string(str, l):\n    result = [e for e in str if len(e) == l] \n    return result",
    "solutionNote": "这是官方的参考答案。对照着看你的思路差在哪一步。",
    "source": "MBPP #450（Google Research，Apache-2.0）"
  },
  {
    "kind": "output",
    "id": "own-list-append",
    "chapter": "ch07",
    "level": "入门",
    "title": "往列表里追加并遍历",
    "concept": "append 在末尾加一个元素；for 循环把列表逐个取出来。",
    "prompt": "建一个空列表，用 append 依次加入 3、6、9，然后遍历输出每个数。",
    "condition": "输出三行：3、6、9。必须用 append 加元素，不能直接写列表字面量。",
    "starter": "nums = []\n# 用 append 加入 3、6、9\n",
    "expected": "3\n6\n9",
    "checks": [
      {
        "re": "\\.append\\s*\\(",
        "message": "要用 append 一个个加进去，而不是一开始就写成 [3, 6, 9]。"
      }
    ],
    "hints": [
      "nums.append(3) 加一个。",
      "加完用 for n in nums: print(n) 输出。"
    ],
    "solution": "nums = []\nnums.append(3)\nnums.append(6)\nnums.append(9)\nfor n in nums:\n    print(n)",
    "solutionNote": "也可以用 nums += [3,6,9] 或 extend，但 append 是逐个加最直观的写法。"
  },
  {
    "id": "mbpp-421",
    "kind": "assert",
    "level": "入门",
    "chapter": "ch07",
    "title": "用分隔符把元组连成字符串",
    "concept": "join 是字符串拼接的标准做法，但它只接受字符串元素。",
    "prompt": "写一个函数，用分隔符把元组里的各个元素连成一个字符串。",
    "condition": "函数名必须是 concatenate_tuple，返回字符串。",
    "starter": "def concatenate_tuple(test_tup):\n    # 在这里写你的实现\n    pass\n",
    "tests": [
      "assert concatenate_tuple((\"ID\", \"is\", 4, \"UTS\") ) == 'ID-is-4-UTS'",
      "assert concatenate_tuple((\"QWE\", \"is\", 4, \"RTY\") ) == 'QWE-is-4-RTY'",
      "assert concatenate_tuple((\"ZEN\", \"is\", 4, \"OP\") ) == 'ZEN-is-4-OP'"
    ],
    "hints": [
      "\"分隔符\".join(元组)。",
      "元素不是字符串时先转换。"
    ],
    "solution": "def concatenate_tuple(test_tup):\n    delim = \"-\"\n    res = ''.join([str(ele) + delim for ele in test_tup])\n    res = res[ : len(res) - len(delim)]\n    return (str(res))",
    "solutionNote": "这是官方的参考答案。对照着看你的思路差在哪一步。",
    "source": "MBPP #421（Google Research，Apache-2.0）"
  },
  {
    "kind": "output",
    "id": "own-max-min",
    "chapter": "ch07",
    "level": "入门",
    "title": "找最大值和最小值",
    "concept": "max() 和 min() 一行拿到极值；想同时知道位置就用 index()。",
    "prompt": "已知成绩 [78, 92, 65, 88]，输出最高分和最低分，格式「最高 92，最低 65」。",
    "condition": "输出 最高 92，最低 65，必须用 max() 和 min()。",
    "starter": "scores = [78, 92, 65, 88]\n# 取最高最低\n",
    "expected": "最高 92，最低 65",
    "checks": [
      {
        "re": "max\\s*\\(",
        "message": "要用 max()。"
      },
      {
        "re": "min\\s*\\(",
        "message": "还要用 min()。"
      }
    ],
    "hints": [
      "最高分是 max(scores)。",
      "用 f-string 拼成一句话输出。"
    ],
    "solution": "scores = [78, 92, 65, 88]\nprint(f\"最高 {max(scores)}，最低 {min(scores)}\")",
    "solutionNote": "空列表调 max() 会报错，真实项目里要先判断列表非空。"
  },
  {
    "id": "mbpp-90",
    "kind": "assert",
    "level": "入门",
    "chapter": "ch07",
    "title": "找最长单词的长度",
    "concept": "遍历列表时用一个变量记住「目前最长的」，是比较类问题的通用套路。",
    "prompt": "写一个函数，返回列表中长度最长的单词有多长。",
    "condition": "函数名必须是 len_log，返回一个整数。",
    "starter": "def len_log(list1):\n    # 在这里写你的实现\n    pass\n",
    "tests": [
      "assert len_log([\"python\",\"PHP\",\"bigdata\"]) == 7",
      "assert len_log([\"a\",\"ab\",\"abc\"]) == 3",
      "assert len_log([\"small\",\"big\",\"tall\"]) == 5"
    ],
    "hints": [
      "先把第一个单词的长度当作最大值。",
      "后面每个都比一比，更大就替换。"
    ],
    "solution": "def len_log(list1):\n    max=len(list1[0])\n    for i in list1:\n        if len(i)>max:\n            max=len(i)\n    return max",
    "solutionNote": "这是官方的参考答案。对照着看你的思路差在哪一步。",
    "source": "MBPP #90（Google Research，Apache-2.0）"
  },
  {
    "id": "mbpp-554",
    "kind": "assert",
    "level": "入门",
    "chapter": "ch07",
    "title": "只留下列表里的奇数",
    "concept": "和上一题刚好相反：这次留下奇数。",
    "prompt": "写一个函数，返回列表里的所有奇数。",
    "condition": "函数名必须是 Split，返回新列表。",
    "starter": "def Split(list):\n    # 在这里写你的实现\n    pass\n",
    "tests": [
      "assert Split([1,2,3,4,5,6]) == [1,3,5]",
      "assert Split([10,11,12,13]) == [11,13]",
      "assert Split([7,8,9,1]) == [7,9,1]"
    ],
    "hints": [
      "x % 2 == 1 就是奇数。",
      "用列表推导式最快。"
    ],
    "solution": "def Split(list): \n    od_li = [] \n    for i in list: \n        if (i % 2 != 0): \n            od_li.append(i)  \n    return od_li",
    "solutionNote": "这是官方的参考答案。对照着看你的思路差在哪一步。",
    "source": "MBPP #554（Google Research，Apache-2.0）"
  },
  {
    "id": "mbpp-431",
    "kind": "assert",
    "level": "入门",
    "chapter": "ch08",
    "title": "两个列表有没有交集",
    "concept": "集合交集判断，比两层循环快得多。",
    "prompt": "写一个函数，判断两个列表是否至少有一个共同元素。",
    "condition": "函数名必须是 common_element，返回 True 或 False。",
    "starter": "def common_element(list1, list2):\n    # 在这里写你的实现\n    pass\n",
    "tests": [
      "assert common_element([1,2,3,4,5], [5,6,7,8,9])==True",
      "assert common_element([1,2,3,4,5], [6,7,8,9])==None",
      "assert common_element(['a','b','c'], ['d','b','e'])==True"
    ],
    "hints": [
      "set(a) & set(b) 即可。",
      "也可以用 any(x in b for x in a)。"
    ],
    "solution": "def common_element(list1, list2):\n     result = False\n     for x in list1:\n         for y in list2:\n             if x == y:\n                 result = True\n                 return result",
    "solutionNote": "这是官方的参考答案。对照着看你的思路差在哪一步。",
    "source": "MBPP #431（Google Research，Apache-2.0）"
  },
  {
    "id": "mbpp-414",
    "kind": "assert",
    "level": "入门",
    "chapter": "ch08",
    "title": "判断有没有共同元素",
    "concept": "集合求交集最快；不用集合的话就是两层循环。",
    "prompt": "写一个函数，判断两个序列里有没有任何一个元素是共同的。",
    "condition": "函数名必须是 overlapping，返回 True 或 False。",
    "starter": "def overlapping(list1,list2):\n    # 在这里写你的实现\n    pass\n",
    "tests": [
      "assert overlapping([1,2,3,4,5],[6,7,8,9]) == False",
      "assert overlapping([1,2,3],[4,5,6]) == False",
      "assert overlapping([1,4,5],[1,4,5]) == True"
    ],
    "hints": [
      "set(a) & set(b) 非空就说明有共同元素。",
      "也可以用 any(x in b for x in a)。"
    ],
    "solution": "def overlapping(list1,list2):  \n    for i in range(len(list1)): \n        for j in range(len(list2)): \n            if(list1[i]==list2[j]): \n                return True\n    return False",
    "solutionNote": "这是官方的参考答案。对照着看你的思路差在哪一步。",
    "source": "MBPP #414（Google Research，Apache-2.0）"
  },
  {
    "id": "mbpp-394",
    "kind": "assert",
    "level": "入门",
    "chapter": "ch08",
    "title": "判断元组里有没有重复",
    "concept": "元组长度和转成集合后的长度一样，就说明没有重复。",
    "prompt": "写一个函数，判断元组里的元素是不是全都不重复。",
    "condition": "函数名必须是 check_distinct，返回 True 或 False。",
    "starter": "def check_distinct(test_tup):\n    # 在这里写你的实现\n    pass\n",
    "tests": [
      "assert check_distinct((1, 4, 5, 6, 1, 4)) == False",
      "assert check_distinct((1, 4, 5, 6)) == True",
      "assert check_distinct((2, 3, 4, 5, 6)) == True"
    ],
    "hints": [
      "len(set(tup)) == len(tup) 就是没有重复。",
      "集合会自动去重。"
    ],
    "solution": "def check_distinct(test_tup):\n  res = True\n  temp = set()\n  for ele in test_tup:\n    if ele in temp:\n      res = False\n      break\n    temp.add(ele)\n  return res",
    "solutionNote": "这是官方的参考答案。对照着看你的思路差在哪一步。",
    "source": "MBPP #394（Google Research，Apache-2.0）"
  },
  {
    "id": "mbpp-479",
    "kind": "assert",
    "level": "进阶",
    "chapter": "ch02",
    "title": "取一个数的首位数字",
    "concept": "数字不能直接取下表，要先转成字符串，取第一个字符，再转回整数。",
    "prompt": "写一个函数，返回整数 n 的第一位数字。",
    "condition": "函数名必须是 first_Digit，返回整数。",
    "starter": "def first_Digit(n) :\n    # 在这里写你的实现\n    pass\n",
    "tests": [
      "assert first_Digit(123) == 1",
      "assert first_Digit(456) == 4",
      "assert first_Digit(12) == 1"
    ],
    "hints": [
      "str(n)[0] 拿到的是字符，要 int() 转回来。",
      "负数要先取绝对值。"
    ],
    "solution": "def first_Digit(n) :  \n    while n >= 10:  \n        n = n / 10 \n    return int(n)",
    "solutionNote": "这是官方的参考答案。对照着看你的思路差在哪一步。",
    "source": "MBPP #479（Google Research，Apache-2.0）"
  },
  {
    "id": "mbpp-3",
    "kind": "assert",
    "level": "进阶",
    "chapter": "ch05",
    "title": "判断不是素数",
    "concept": "素数只能被 1 和自己整除。判断「不是素数」要把 1 和小于等于 1 的数单独处理。",
    "prompt": "写一个函数，判断传入的整数 n 是不是非素数（合数或 1）。",
    "condition": "函数名必须是 is_not_prime，对 2 返回 False、对 4 返回 True。",
    "starter": "def is_not_prime(n):\n    # 在这里写你的实现\n    pass\n",
    "tests": [
      "assert is_not_prime(2) == False",
      "assert is_not_prime(10) == True",
      "assert is_not_prime(35) == True",
      "assert is_not_prime(37) == False"
    ],
    "hints": [
      "小于等于 1 的数既不是素数也不是合数，题目要求算「非素数」。",
      "从 2 试到 n-1，能整除就说明不是素数。"
    ],
    "solution": "import math\ndef is_not_prime(n):\n    result = False\n    for i in range(2,int(math.sqrt(n)) + 1):\n        if n % i == 0:\n            result = True\n    return result",
    "solutionNote": "这是官方的参考答案。对照着看你的思路差在哪一步。",
    "source": "MBPP #3（Google Research，Apache-2.0）"
  },
  {
    "id": "mbpp-420",
    "kind": "assert",
    "level": "进阶",
    "chapter": "ch05",
    "title": "前 n 个偶数的立方和",
    "concept": "前 n 个偶数是 2、4、6……，立方后求和。",
    "prompt": "写一个函数，求前 n 个偶数的立方和。",
    "condition": "函数名必须是 cube_Sum，对 n=2 应返回 72（2³+4³）。",
    "starter": "def cube_Sum(n):\n    # 在这里写你的实现\n    pass\n",
    "tests": [
      "assert cube_Sum(2) == 72",
      "assert cube_Sum(3) == 288",
      "assert cube_Sum(4) == 800"
    ],
    "hints": [
      "第 i 个偶数是 2*(i+1)。",
      "用 for 循环累加 i**3。"
    ],
    "solution": "def cube_Sum(n): \n    sum = 0\n    for i in range(1,n + 1): \n        sum += (2*i)*(2*i)*(2*i) \n    return sum",
    "solutionNote": "这是官方的参考答案。对照着看你的思路差在哪一步。",
    "source": "MBPP #420（Google Research，Apache-2.0）"
  },
  {
    "kind": "output",
    "id": "own-nested-loop",
    "chapter": "ch05",
    "level": "进阶",
    "title": "嵌套循环打印表格",
    "concept": "外层管行，内层管列。打印「几行几列」的东西全靠它。",
    "prompt": "用嵌套循环输出一个 3 行 4 列的星号方阵，每行 4 个星号。",
    "condition": "输出 3 行，每行 4 个星号（****），必须用嵌套 for 循环。",
    "starter": "# 外层 3 次，内层 4 次\n",
    "expected": "****\n****\n****",
    "checks": [
      {
        "minFor": 2,
        "message": "这题要练嵌套循环：两个 for，外层管行、内层管列。"
      }
    ],
    "hints": [
      "外层 for i in range(3)，内层 for j in range(4)。",
      "内层用 print(\"*\", end=\"\")，内层结束后单独 print() 换行。"
    ],
    "solution": "for i in range(3):\n    for j in range(4):\n        print(\"*\", end=\"\")\n    print()",
    "solutionNote": "把内层的 range(4) 改成 range(i+1) 就变成三角形了。"
  },
  {
    "id": "mbpp-295",
    "kind": "assert",
    "level": "进阶",
    "chapter": "ch05",
    "title": "求一个数所有因数之和",
    "concept": "和「因数个数」是同一套遍历，只是把计数换成累加。",
    "prompt": "写一个函数，返回整数 n 所有因数相加的和。",
    "condition": "函数名必须是 sum_div，对 12 应返回 28。",
    "starter": "def sum_div(number):\n    # 在这里写你的实现\n    pass\n",
    "tests": [
      "assert sum_div(8)==7",
      "assert sum_div(12)==16",
      "assert sum_div(7)==1"
    ],
    "hints": [
      "12 的因数是 1、2、3、4、6、12。",
      "能整除就加进总和。"
    ],
    "solution": "def sum_div(number):\n    divisors = [1]\n    for i in range(2, number):\n        if (number % i)==0:\n            divisors.append(i)\n    return sum(divisors)",
    "solutionNote": "这是官方的参考答案。对照着看你的思路差在哪一步。",
    "source": "MBPP #295（Google Research，Apache-2.0）"
  },
  {
    "id": "mbpp-96",
    "kind": "assert",
    "level": "进阶",
    "chapter": "ch05",
    "title": "数一个数的因数有几个",
    "concept": "从 1 试到 n，能整除 n 的就是因数。数出来的个数就是答案。",
    "prompt": "写一个函数，返回整数 n 一共有多少个因数。",
    "condition": "函数名必须是 divisor，对 12 应返回 6。",
    "starter": "def divisor(n):\n    # 在这里写你的实现\n    pass\n",
    "tests": [
      "assert divisor(15) == 4",
      "assert divisor(12) == 6",
      "assert divisor(9) == 3"
    ],
    "hints": [
      "1 和 n 本身都算因数。",
      "用 for 循环加一个计数器。"
    ],
    "solution": "def divisor(n):\n  for i in range(n):\n    x = len([i for i in range(1,n+1) if not n % i])\n  return x",
    "solutionNote": "这是官方的参考答案。对照着看你的思路差在哪一步。",
    "source": "MBPP #96（Google Research，Apache-2.0）"
  },
  {
    "kind": "output",
    "id": "own-while-guess",
    "chapter": "ch05",
    "level": "进阶",
    "title": "while 循环猜数字",
    "concept": "while 适合「不知道要转几次」的场景，条件满足就一直转。",
    "prompt": "秘密数字是 7，从 1 开始每次加 2 地猜（1、3、5、7……），猜到就停，输出最后猜中的数字。",
    "condition": "输出 7，必须用 while 循环，不能用 range 直接算。",
    "starter": "secret = 7\nguess = 1\n# 用 while 一直猜\n",
    "expected": "7",
    "checks": [
      {
        "minWhile": 1,
        "message": "这题要练 while：条件成立就一直循环。"
      }
    ],
    "hints": [
      "while guess <= secret: 里面 guess += 2。",
      "循环结束后 print(guess) 会打印 9，所以要在循环里判断相等就 break，或者循环条件写 guess != secret。"
    ],
    "solution": "secret = 7\nguess = 1\nwhile guess != secret:\n    guess += 2\nprint(guess)",
    "solutionNote": "while 的两个常见死法：条件永远真（忘更新变量）、条件一开始就假（一次都不执行）。"
  },
  {
    "kind": "output",
    "id": "own-func-default",
    "chapter": "ch06",
    "level": "进阶",
    "title": "带默认参数的函数",
    "concept": "默认参数让调用时可以少传：不传就用默认值。",
    "prompt": "定义函数 tax(amount, rate=0.06)，返回 amount * rate。输出 tax(1000) 和 tax(1000, 0.13)。",
    "condition": "输出两行：60.0 和 130.0，必须有默认参数 rate=0.06。",
    "starter": "# 定义 tax 函数\n",
    "expected": "60.0\n130.0",
    "checks": [
      {
        "re": "rate\\s*=\\s*0\\.06",
        "message": "要有默认参数：def tax(amount, rate=0.06)。"
      }
    ],
    "hints": [
      "def tax(amount, rate=0.06): 下面 return amount * rate。",
      "两次调用分别 print。"
    ],
    "solution": "def tax(amount, rate=0.06):\n    return amount * rate\n\nprint(tax(1000))\nprint(tax(1000, 0.13))",
    "solutionNote": "去掉小数点后的 .0 试试：print(amount * rate) 会显示 60.0 而不是 60，这是 float 和 int 的区别。"
  },
  {
    "id": "mbpp-444",
    "kind": "assert",
    "level": "进阶",
    "chapter": "ch07",
    "title": "按 k 截短每个元组",
    "concept": "元组切片同样支持 [start:end]，截取前 k 个就是 [:k]。",
    "prompt": "写一个函数，把元组列表里每个元组只保留前 k 个元素。",
    "condition": "函数名必须是 trim_tuple，返回元组列表。",
    "starter": "def trim_tuple(test_list, K):\n    # 在这里写你的实现\n    pass\n",
    "tests": [
      "assert trim_tuple([(5, 3, 2, 1, 4), (3, 4, 9, 2, 1),(9, 1, 2, 3, 5), (4, 8, 2, 1, 7)], 2) == '[(2,), (9,), (2,), (2,)]'",
      "assert trim_tuple([(5, 3, 2, 1, 4), (3, 4, 9, 2, 1), (9, 1, 2, 3, 5), (4, 8, 2, 1, 7)], 1) == '[(3, 2, 1), (4, 9, 2), (1, 2, 3), (8, 2, 1)]'",
      "assert trim_tuple([(7, 8, 4, 9), (11, 8, 12, 4),(4, 1, 7, 8), (3, 6, 9, 7)], 1) == '[(8, 4), (8, 12), (1, 7), (6, 9)]'"
    ],
    "hints": [
      "tup[:k] 取前 k 个。",
      "对每个元组做这件事用推导式。"
    ],
    "solution": "def trim_tuple(test_list, K):\n  res = []\n  for ele in test_list:\n    N = len(ele)\n    res.append(tuple(list(ele)[K: N - K]))\n  return (str(res))",
    "solutionNote": "这是官方的参考答案。对照着看你的思路差在哪一步。",
    "source": "MBPP #444（Google Research，Apache-2.0）"
  },
  {
    "id": "mbpp-65",
    "kind": "assert",
    "level": "进阶",
    "chapter": "ch07",
    "title": "把嵌套列表压平再求和",
    "concept": "列表里还能放列表。压平就是把所有层剥开变成一层，再逐个相加。",
    "prompt": "写一个函数，把嵌套列表压平，并返回所有元素的总和。",
    "condition": "函数名必须是 recursive_list_sum，接受嵌套列表，返回一个数字。",
    "starter": "def recursive_list_sum(data_list):\n    # 在这里写你的实现\n    pass\n",
    "tests": [
      "assert recursive_list_sum(([1, 2, [3,4],[5,6]]))==21",
      "assert recursive_list_sum(([7, 10, [15,14],[19,41]]))==106",
      "assert recursive_list_sum(([10, 20, [30,40],[50,60]]))==210"
    ],
    "hints": [
      "两层 for 循环：外层取子列表，内层取元素。",
      "也可以在函数里再递归处理更深的嵌套。"
    ],
    "solution": "def recursive_list_sum(data_list):\n\ttotal = 0\n\tfor element in data_list:\n\t\tif type(element) == type([]):\n\t\t\ttotal = total + recursive_list_sum(element)\n\t\telse:\n\t\t\ttotal = total + element\n\treturn total",
    "solutionNote": "这是官方的参考答案。对照着看你的思路差在哪一步。",
    "source": "MBPP #65（Google Research，Apache-2.0）"
  },
  {
    "id": "mbpp-161",
    "kind": "assert",
    "level": "进阶",
    "chapter": "ch07",
    "title": "从列表里去掉另一列表的元素",
    "concept": "集合的 in 判断比列表快，判重用 set 更省事。",
    "prompt": "写一个函数，把 list1 里所有出现在 list2 中的元素去掉，返回剩下的。",
    "condition": "函数名必须是 remove_elements，返回一个新列表。",
    "starter": "def remove_elements(list1, list2):\n    # 在这里写你的实现\n    pass\n",
    "tests": [
      "assert remove_elements([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], [2, 4, 6, 8]) == [1, 3, 5, 7, 9, 10]",
      "assert remove_elements([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], [1, 3, 5, 7]) == [2, 4, 6, 8, 9, 10]",
      "assert remove_elements([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], [5, 7]) == [1, 2, 3, 4, 6, 8, 9, 10]"
    ],
    "hints": [
      "先把 list2 转成 set，判断快得多。",
      "用列表推导式过滤最简洁。"
    ],
    "solution": "def remove_elements(list1, list2):\n    result = [x for x in list1 if x not in list2]\n    return result",
    "solutionNote": "这是官方的参考答案。对照着看你的思路差在哪一步。",
    "source": "MBPP #161（Google Research，Apache-2.0）"
  },
  {
    "id": "mbpp-104",
    "kind": "assert",
    "level": "进阶",
    "chapter": "ch07",
    "title": "给每个子列表排序",
    "concept": "对列表里每个子列表分别排序，用推导式最直接。",
    "prompt": "写一个函数，把列表里每个子列表内部的字符串排好序。",
    "condition": "函数名必须是 sort_sublists，返回新的列表。",
    "starter": "def sort_sublists(input_list):\n    # 在这里写你的实现\n    pass\n",
    "tests": [
      "assert sort_sublists(([\"green\", \"orange\"], [\"black\", \"white\"], [\"white\", \"black\", \"orange\"]))==[['green', 'orange'], ['black', 'white'], ['black', 'orange', 'white']]",
      "assert sort_sublists(([\" red \",\"green\" ],[\"blue \",\" black\"],[\" orange\",\"brown\"]))==[[' red ', 'green'], [' black', 'blue '], [' orange', 'brown']]",
      "assert sort_sublists(([\"zilver\",\"gold\"], [\"magnesium\",\"aluminium\"], [\"steel\", \"bronze\"]))==[['gold', 'zilver'],['aluminium', 'magnesium'], ['bronze', 'steel']]"
    ],
    "hints": [
      "[sorted(sub) for sub in 列表]。",
      "sorted 返回新列表，不改变原数据。"
    ],
    "solution": "def sort_sublists(input_list):\n    result = [sorted(x, key = lambda x:x[0]) for x in input_list] \n    return result",
    "solutionNote": "这是官方的参考答案。对照着看你的思路差在哪一步。",
    "source": "MBPP #104（Google Research，Apache-2.0）"
  },
  {
    "kind": "output",
    "id": "own-comprehension",
    "chapter": "ch07",
    "level": "进阶",
    "title": "列表推导式一行筛数",
    "concept": "推导式把「遍历 + 判断 + 收集」压成一行，读法是「把 for 后面每个 x 加工后收集起来」。",
    "prompt": "用一行列表推导式，从 range(1, 21) 里挑出所有能被 3 整除的数，并输出。",
    "condition": "输出 [3, 6, 9, 12, 15, 18]，必须用列表推导式，不能用 for 循环 append。",
    "starter": "# 用一行推导式完成\n",
    "expected": "[3, 6, 9, 12, 15, 18]",
    "checks": [
      {
        "re": "\\[[^\\]]*for[^\\]]*\\]",
        "message": "这题要练推导式：写成 [x for x in ... if ...] 的形式。"
      }
    ],
    "hints": [
      "结构是 [x for x in range(1, 21) if 条件]。",
      "条件写 x % 3 == 0。"
    ],
    "solution": "print([x for x in range(1, 21) if x % 3 == 0])",
    "solutionNote": "推导式不是炫技，它是 Python 里表达「筛选/映射」最直接的语法。"
  },
  {
    "id": "mbpp-265",
    "kind": "assert",
    "level": "进阶",
    "chapter": "ch07",
    "title": "每 n 个切一段",
    "concept": "用 range(start, len, n) 配合切片就能分段。",
    "prompt": "写一个函数，把列表按每 n 个元素切分成若干段，返回列表的列表。",
    "condition": "函数名必须是 list_split，返回二维列表。",
    "starter": "def list_split(S, step):\n    # 在这里写你的实现\n    pass\n",
    "tests": [
      "assert list_split(['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n'],3)==[['a', 'd', 'g', 'j', 'm'], ['b', 'e', 'h', 'k', 'n'], ['c', 'f', 'i', 'l']]",
      "assert list_split([1,2,3,4,5,6,7,8,9,10,11,12,13,14],3)==[[1,4,7,10,13], [2,5,8,11,14], [3,6,9,12]]",
      "assert list_split(['python','java','C','C++','DBMS','SQL'],2)==[['python', 'C', 'DBMS'], ['java', 'C++', 'SQL']]"
    ],
    "hints": [
      "range(0, len(列表), n) 产生每段起点。",
      "用切片 [i:i+n] 取这一段。"
    ],
    "solution": "def list_split(S, step):\n    return [S[i::step] for i in range(step)]",
    "solutionNote": "这是官方的参考答案。对照着看你的思路差在哪一步。",
    "source": "MBPP #265（Google Research，Apache-2.0）"
  },
  {
    "id": "mbpp-270",
    "kind": "assert",
    "level": "进阶",
    "chapter": "ch07",
    "title": "偶数位置上的偶数和",
    "concept": "两个条件同时成立才累加：位置是偶数，值也是偶数。",
    "prompt": "写一个函数，求列表里「下标为偶数且数值为偶数」的元素之和。",
    "condition": "函数名必须是 sum_even_and_even_index，对 [2, 4, 6, 8] 应返回 8。",
    "starter": "def sum_even_and_even_index(arr):\n    # 在这里写你的实现\n    pass\n",
    "tests": [
      "assert sum_even_and_even_index([5, 6, 12, 1, 18, 8]) == 30",
      "assert sum_even_and_even_index([3, 20, 17, 9, 2, 10, 18, 13, 6, 18]) == 26",
      "assert sum_even_and_even_index([5, 6, 12, 1]) == 12"
    ],
    "hints": [
      "用 enumerate 同时拿到下标和值。",
      "两个判断用 and 连起来。"
    ],
    "solution": "def sum_even_and_even_index(arr):  \n    i = 0\n    sum = 0\n    for i in range(0, len(arr),2): \n        if (arr[i] % 2 == 0) : \n            sum += arr[i]  \n    return sum",
    "solutionNote": "这是官方的参考答案。对照着看你的思路差在哪一步。",
    "source": "MBPP #270（Google Research，Apache-2.0）"
  },
  {
    "id": "mbpp-413",
    "kind": "assert",
    "level": "进阶",
    "chapter": "ch07",
    "title": "取每个元组的第 n 个元素",
    "concept": "元组下标从 0 开始，题目里的 n 是按位置数还是从 0 数，要看清。",
    "prompt": "写一个函数，从元组列表里取出每个元组的第 n 个元素。",
    "condition": "函数名必须是 extract_nth_element，返回列表。",
    "starter": "def extract_nth_element(list1, n):\n    # 在这里写你的实现\n    pass\n",
    "tests": [
      "assert extract_nth_element([('Greyson Fulton', 98, 99), ('Brady Kent', 97, 96), ('Wyatt Knott', 91, 94), ('Beau Turnbull', 94, 98)] ,0)==['Greyson Fulton', 'Brady Kent', 'Wyatt Knott', 'Beau Turnbull']",
      "assert extract_nth_element([('Greyson Fulton', 98, 99), ('Brady Kent', 97, 96), ('Wyatt Knott', 91, 94), ('Beau Turnbull', 94, 98)] ,2)==[99, 96, 94, 98]",
      "assert extract_nth_element([('Greyson Fulton', 98, 99), ('Brady Kent', 97, 96), ('Wyatt Knott', 91, 94), ('Beau Turnbull', 94, 98)],1)==[98, 97, 91, 94]"
    ],
    "hints": [
      "先试着用 0 和 1 跑一遍看结果对不对。",
      "注意边界，n 不能超过元组长度。"
    ],
    "solution": "def extract_nth_element(list1, n):\n    result = [x[n] for x in list1]\n    return result",
    "solutionNote": "这是官方的参考答案。对照着看你的思路差在哪一步。",
    "source": "MBPP #413（Google Research，Apache-2.0）"
  },
  {
    "id": "mbpp-75",
    "kind": "assert",
    "level": "进阶",
    "chapter": "ch07",
    "title": "筛出整组都能被 k 整除的元组",
    "concept": "元组里每个元素都要满足条件，用 all() 或循环判断。",
    "prompt": "写一个函数，从元组列表里挑出「每个元素都能被 k 整除」的那些元组。",
    "condition": "函数名必须是 find_tuples，返回列表。",
    "starter": "def find_tuples(test_list, K):\n    # 在这里写你的实现\n    pass\n",
    "tests": [
      "assert find_tuples([(6, 24, 12), (7, 9, 6), (12, 18, 21)], 6) == [(6, 24, 12)]",
      "assert find_tuples([(5, 25, 30), (4, 2, 3), (7, 8, 9)], 5) == [(5, 25, 30)]",
      "assert find_tuples([(7, 9, 16), (8, 16, 4), (19, 17, 18)], 4) == [(8, 16, 4)]"
    ],
    "hints": [
      "all(x % k == 0 for x in tup) 判断整组。",
      "外层再套一层遍历所有元组。"
    ],
    "solution": "def find_tuples(test_list, K):\n  res = [sub for sub in test_list if all(ele % K == 0 for ele in sub)]\n  return res",
    "solutionNote": "这是官方的参考答案。对照着看你的思路差在哪一步。",
    "source": "MBPP #75（Google Research，Apache-2.0）"
  },
  {
    "id": "mbpp-145",
    "kind": "assert",
    "level": "进阶",
    "chapter": "ch07",
    "title": "数组里最大的一对差值",
    "concept": "嵌套遍历取两两组合，是「找最大值」类问题的暴力解法。",
    "prompt": "写一个函数，返回数组中任意两个元素相减能得到的最大差。",
    "condition": "函数名必须是 max_Abs_Diff，返回一个数字。",
    "starter": "def max_Abs_Diff(arr):\n    # 在这里写你的实现\n    pass\n",
    "tests": [
      "assert max_Abs_Diff((2,1,5,3)) == 4",
      "assert max_Abs_Diff((9,3,2,5,1)) == 8",
      "assert max_Abs_Diff((3,2,1)) == 2"
    ],
    "hints": [
      "两层循环枚举所有 (i, j) 组合。",
      "用一个变量记录目前为止的最大差。"
    ],
    "solution": "def max_Abs_Diff(arr): \n    n = len(arr)\n    minEle = arr[0] \n    maxEle = arr[0] \n    for i in range(1, n): \n        minEle = min(minEle,arr[i]) \n        maxEle = max(maxEle,arr[i]) \n    return (maxEle - minEle)",
    "solutionNote": "这是官方的参考答案。对照着看你的思路差在哪一步。",
    "source": "MBPP #145（Google Research，Apache-2.0）"
  },
  {
    "id": "mbpp-63",
    "kind": "assert",
    "level": "进阶",
    "chapter": "ch07",
    "title": "元组对里最大的差",
    "concept": "每个元组是一对数，先算每个元组内部的差，再取最大。",
    "prompt": "写一个函数，返回元组列表里，每对数相减的差中的最大值。",
    "condition": "函数名必须是 max_difference，返回一个数。",
    "starter": "def max_difference(test_list):\n    # 在这里写你的实现\n    pass\n",
    "tests": [
      "assert max_difference([(3, 5), (1, 7), (10, 3), (1, 2)]) == 7",
      "assert max_difference([(4, 6), (2, 17), (9, 13), (11, 12)]) == 15",
      "assert max_difference([(12, 35), (21, 27), (13, 23), (41, 22)]) == 23"
    ],
    "hints": [
      "先对每个元组算 abs(a - b) 或 a - b。",
      "再取这些差的最大值。"
    ],
    "solution": "def max_difference(test_list):\n  temp = [abs(b - a) for a, b in test_list]\n  res = max(temp)\n  return (res)",
    "solutionNote": "这是官方的参考答案。对照着看你的思路差在哪一步。",
    "source": "MBPP #63（Google Research，Apache-2.0）"
  },
  {
    "id": "mbpp-251",
    "kind": "assert",
    "level": "进阶",
    "chapter": "ch07",
    "title": "在每个元素前插入同一个元素",
    "concept": "遍历的同时要产出两个元素，用 append 两次或嵌套推导式。",
    "prompt": "写一个函数，在列表每个元素前面插入指定元素，返回新列表。",
    "condition": "函数名必须是 insert_element，返回列表。",
    "starter": "def insert_element(list,element):\n    # 在这里写你的实现\n    pass\n",
    "tests": [
      "assert insert_element(['Red', 'Green', 'Black'] ,'c')==['c', 'Red', 'c', 'Green', 'c', 'Black']",
      "assert insert_element(['python', 'java'] ,'program')==['program', 'python', 'program', 'java']",
      "assert insert_element(['happy', 'sad'] ,'laugh')==['laugh', 'happy', 'laugh', 'sad']"
    ],
    "hints": [
      "建一个空列表，每个元素前面先 append 插入值，再 append 自己。",
      "也可以用 [x for item in 列表 for x in (插入值, item)]。"
    ],
    "solution": "def insert_element(list,element):\n list = [v for elt in list for v in (element, elt)]\n return list",
    "solutionNote": "这是官方的参考答案。对照着看你的思路差在哪一步。",
    "source": "MBPP #251（Google Research，Apache-2.0）"
  },
  {
    "id": "mbpp-443",
    "kind": "assert",
    "level": "进阶",
    "chapter": "ch07",
    "title": "找最大的负数",
    "concept": "在「满足条件的一批数」里找最大，要先过滤再取 max。",
    "prompt": "写一个函数，返回列表里最大的那个负数。",
    "condition": "函数名必须是 largest_neg，返回一个数。",
    "starter": "def largest_neg(list1):\n    # 在这里写你的实现\n    pass\n",
    "tests": [
      "assert largest_neg([1,2,3,-4,-6]) == -6",
      "assert largest_neg([1,2,3,-8,-9]) == -9",
      "assert largest_neg([1,2,3,4,-1]) == -1"
    ],
    "hints": [
      "先筛出所有负数，再取 max()。",
      "如果列表里没有负数要返回 None。"
    ],
    "solution": "def largest_neg(list1): \n    max = list1[0] \n    for x in list1: \n        if x < max : \n             max = x  \n    return max",
    "solutionNote": "这是官方的参考答案。对照着看你的思路差在哪一步。",
    "source": "MBPP #443（Google Research，Apache-2.0）"
  },
  {
    "id": "mbpp-140",
    "kind": "assert",
    "level": "进阶",
    "chapter": "ch08",
    "title": "把多个列表压平成集合",
    "concept": "集合会自动去重，压平后再转集合一步到位。",
    "prompt": "写一个函数，把嵌套列表压平并去掉重复数字，返回集合。",
    "condition": "函数名必须是 extract_singly，返回 set。",
    "starter": "def extract_singly(test_list):\n    # 在这里写你的实现\n    pass\n",
    "tests": [
      "assert set(extract_singly([(3, 4, 5), (4, 5, 7), (1, 4)])) == set([3, 4, 5, 7, 1])",
      "assert set(extract_singly([(1, 2, 3), (4, 2, 3), (7, 8)])) == set([1, 2, 3, 4, 7, 8])",
      "assert set(extract_singly([(7, 8, 9), (10, 11, 12), (10, 11)])) == set([7, 8, 9, 10, 11, 12])"
    ],
    "hints": [
      "先收集所有元素到列表，再 set() 去重。",
      "注意这里返回的是集合不是列表。"
    ],
    "solution": "def extract_singly(test_list):\n  res = []\n  temp = set()\n  for inner in test_list:\n    for ele in inner:\n      if not ele in temp:\n        temp.add(ele)\n        res.append(ele)\n  return (res)",
    "solutionNote": "这是官方的参考答案。对照着看你的思路差在哪一步。",
    "source": "MBPP #140（Google Research，Apache-2.0）"
  },
  {
    "id": "mbpp-572",
    "kind": "assert",
    "level": "进阶",
    "chapter": "ch08",
    "title": "合并多个列表并去重",
    "concept": "先去重再合并，或者合并后去重，两种思路都行。",
    "prompt": "写一个函数，把两个列表合并，并去掉重复的数字。",
    "condition": "函数名必须是 two_unique_nums, 注意去重后顺序不要求。",
    "starter": "def two_unique_nums(nums):\n    # 在这里写你的实现\n    pass\n",
    "tests": [
      "assert two_unique_nums([1,2,3,2,3,4,5]) == [1, 4, 5]",
      "assert two_unique_nums([1,2,3,2,4,5]) == [1, 3, 4, 5]",
      "assert two_unique_nums([1,2,3,4,5]) == [1, 2, 3, 4, 5]"
    ],
    "hints": [
      "set(列表1 + 列表2) 一行去重。",
      "要保留顺序就用 for 循环加 in 判断。"
    ],
    "solution": "def two_unique_nums(nums):\n  return [i for i in nums if nums.count(i)==1]",
    "solutionNote": "这是官方的参考答案。对照着看你的思路差在哪一步。",
    "source": "MBPP #572（Google Research，Apache-2.0）"
  },
  {
    "id": "mbpp-573",
    "kind": "assert",
    "level": "进阶",
    "chapter": "ch08",
    "title": "唯一数字的乘积",
    "concept": "先用集合去掉重复，再把剩下的乘起来。",
    "prompt": "写一个函数，返回列表里所有不重复数字的乘积。",
    "condition": "函数名必须是 unique_product，返回一个数。",
    "starter": "def unique_product(list_data):\n    # 在这里写你的实现\n    pass\n",
    "tests": [
      "assert unique_product([10, 20, 30, 40, 20, 50, 60, 40]) ==  720000000",
      "assert unique_product([1, 2, 3, 1,]) == 6",
      "assert unique_product([7, 8, 9, 0, 1, 1]) == 0"
    ],
    "hints": [
      "set(列表) 得到不重复的元素。",
      "乘法的初始值要用 1，不是 0。"
    ],
    "solution": "def unique_product(list_data):\n    temp = list(set(list_data))\n    p = 1\n    for i in temp:\n        p *= i\n    return p",
    "solutionNote": "这是官方的参考答案。对照着看你的思路差在哪一步。",
    "source": "MBPP #573（Google Research，Apache-2.0）"
  },
  {
    "kind": "output",
    "id": "own-set-diff",
    "chapter": "ch08",
    "level": "进阶",
    "title": "用集合找「谁没来」",
    "concept": "集合差集 A - B 就是「在 A 里但不在 B 里」。",
    "prompt": "已知全部 = {\"张三\", \"李四\", \"王五\"}，已到 = {\"张三\", \"王五\"}，用集合运算输出没到的人。",
    "condition": "输出 李四，必须用集合差集，不能直接写名字。",
    "starter": "all_people = {\"张三\", \"李四\", \"王五\"}\narrived = {\"张三\", \"王五\"}\n# 用集合差集\n",
    "expected": "李四",
    "checks": [
      {
        "re": "-\\s*arrived|difference",
        "message": "要用差集 all_people - arrived，而不是手动挑出来。"
      }
    ],
    "hints": [
      "差集运算符是减号：all_people - arrived。",
      "结果是一个集合，遍历输出即可。"
    ],
    "solution": "all_people = {\"张三\", \"李四\", \"王五\"}\narrived = {\"张三\", \"王五\"}\nfor name in all_people - arrived:\n    print(name)",
    "solutionNote": "集合运算比两层循环快得多，名单越大差距越明显。"
  },
  {
    "kind": "output",
    "id": "own-dict-count",
    "chapter": "ch08",
    "level": "进阶",
    "title": "用字典统计出现次数",
    "concept": "字典的 get(键, 默认值) 让「第一次遇到就记 1、之后加 1」变得很顺。",
    "prompt": "已知 words = [\"苹果\", \"香蕉\", \"苹果\", \"橙子\", \"苹果\"]，统计每个词出现几次并输出字典。",
    "condition": "输出 {'苹果': 3, '香蕉': 1, '橙子': 1}，必须用字典累加，不能手写结果。",
    "starter": "words = [\"苹果\", \"香蕉\", \"苹果\", \"橙子\", \"苹果\"]\ncounts = {}\n# 遍历统计\n",
    "expected": "{'苹果': 3, '香蕉': 1, '橙子': 1}",
    "checks": [
      {
        "re": "\\.get\\s*\\(|in\\s+counts",
        "message": "要用 get(键, 0) + 1 或者先判断键在不在，才能正确累加。"
      }
    ],
    "hints": [
      "counts[w] = counts.get(w, 0) + 1 一行就完成计数。",
      "最后 print(counts)。"
    ],
    "solution": "words = [\"苹果\", \"香蕉\", \"苹果\", \"橙子\", \"苹果\"]\ncounts = {}\nfor w in words:\n    counts[w] = counts.get(w, 0) + 1\nprint(counts)",
    "solutionNote": "这是词频统计的标准写法，处理流水摘要、报销类别都靠它。"
  },
  {
    "kind": "output",
    "id": "own-try",
    "chapter": "ch11",
    "level": "进阶",
    "title": "用 try 接住错误",
    "concept": "错误不接住程序就崩。try/except 让「出错」变成一种可以处理的情况。",
    "prompt": "对字符串 \"abc\" 调 int()，用 try/except 接住 ValueError，输出「输入不是数字」。",
    "condition": "输出 输入不是数字，并且必须用 try/except 捕获 ValueError。",
    "starter": "text = \"abc\"\n# 用 try/except 接住转换失败\n",
    "expected": "输入不是数字",
    "checks": [
      {
        "re": "try\\s*:",
        "message": "必须用 try/except 结构，不能直接 print 那句话。"
      },
      {
        "re": "except",
        "message": "还差 except 分支：try 后面必须有 except 才能接住错误。"
      }
    ],
    "hints": [
      "try 里放 int(text)，except ValueError 里 print 提示。",
      "except 后面要写具体的异常类型。"
    ],
    "solution": "text = \"abc\"\ntry:\n    n = int(text)\n    print(n)\nexcept ValueError:\n    print(\"输入不是数字\")",
    "solutionNote": "别写裸 except:——它会把所有错误（包括你自己写错的变量名）一起吞掉。"
  },
  {
    "id": "mbpp-165",
    "kind": "assert",
    "level": "挑战",
    "chapter": "ch07",
    "title": "数有几个字符和字母表位置对得上",
    "concept": "enumerate 同时拿下标和字符，ord() 拿 ASCII 码。大小写要统一再比。",
    "prompt": "写一个函数，统计字符串里「字符下标」和它在字母表中的位置刚好相同的字符有几个（不区分大小写）。",
    "condition": "函数名必须是 count_char_position，返回整数。",
    "starter": "def count_char_position(str1):\n    # 在这里写你的实现\n    pass\n",
    "tests": [
      "assert count_char_position(\"xbcefg\") == 2",
      "assert count_char_position(\"ABcED\") == 3",
      "assert count_char_position(\"AbgdeF\") == 5"
    ],
    "hints": [
      "把字符串转小写，避免大小写干扰。",
      "ord(ch) - ord('a') 得到字母在表中的位置（从 0 开始）。"
    ],
    "solution": "def count_char_position(str1): \n    count_chars = 0\n    for i in range(len(str1)):\n        if ((i == ord(str1[i]) - ord('A')) or \n            (i == ord(str1[i]) - ord('a'))): \n            count_chars += 1\n    return count_chars",
    "solutionNote": "这是官方的参考答案。对照着看你的思路差在哪一步。",
    "source": "MBPP #165（Google Research，Apache-2.0）"
  },
  {
    "id": "mbpp-417",
    "kind": "assert",
    "level": "挑战",
    "chapter": "ch07",
    "title": "找所有元组的共同首元素",
    "concept": "先取每个元组的第一个元素，再看这些元素是不是全都一样。",
    "prompt": "写一个函数，判断一组元组的第一个元素是不是都相同，是就返回该元素。",
    "condition": "函数名必须是 group_tuples，都相同返回该值，否则返回 False。",
    "starter": "def group_tuples(Input):\n    # 在这里写你的实现\n    pass\n",
    "tests": [
      "assert group_tuples([('x', 'y'), ('x', 'z'), ('w', 't')]) == [('x', 'y', 'z'), ('w', 't')]",
      "assert group_tuples([('a', 'b'), ('a', 'c'), ('d', 'e')]) == [('a', 'b', 'c'), ('d', 'e')]",
      "assert group_tuples([('f', 'g'), ('f', 'g'), ('h', 'i')]) == [('f', 'g', 'g'), ('h', 'i')]"
    ],
    "hints": [
      "先取出 [t[0] for t in 列表]。",
      "再用 len(set(结果)) == 1 判断是否全相同。"
    ],
    "solution": "def group_tuples(Input): \n\tout = {} \n\tfor elem in Input: \n\t\ttry: \n\t\t\tout[elem[0]].extend(elem[1:]) \n\t\texcept KeyError: \n\t\t\tout[elem[0]] = list(elem) \n\treturn [tuple(values) for values in out.values()]",
    "solutionNote": "这是官方的参考答案。对照着看你的思路差在哪一步。",
    "source": "MBPP #417（Google Research，Apache-2.0）"
  },
  {
    "kind": "output",
    "id": "own-class-simple",
    "chapter": "ch12",
    "level": "挑战",
    "title": "写一个最小的类",
    "concept": "类把数据和操作绑在一起；__init__ 在创建对象时自动执行，self 指对象自己。",
    "prompt": "定义类 Book，__init__ 接收 title 和 price，方法 info() 返回 \"书名：价格\" 格式的字符串。创建 Book(\"Python入门\", 59) 并输出 info()。",
    "condition": "输出 书名：Python入门，价格：59，必须定义类和 __init__。",
    "starter": "class Book:\n    # 补全 __init__ 和 info\n",
    "expected": "书名：Python入门，价格：59",
    "checks": [
      {
        "re": "class\\s+Book",
        "message": "要有 class Book。"
      },
      {
        "re": "__init__",
        "message": "还差 __init__ 方法。"
      },
      {
        "re": "def\\s+info",
        "message": "还差 info 方法。"
      }
    ],
    "hints": [
      "__init__(self, title, price) 里写 self.title = title。",
      "info 里 return f\"书名：{self.title}，价格：{self.price}\"。"
    ],
    "solution": "class Book:\n    def __init__(self, title, price):\n        self.title = title\n        self.price = price\n\n    def info(self):\n        return f\"书名：{self.title}，价格：{self.price}\"\n\nb = Book(\"Python入门\", 59)\nprint(b.info())",
    "solutionNote": "方法第一个参数永远是 self，调用时不用手动传。"
  }
];
