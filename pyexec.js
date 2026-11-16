/* pyexec.js —— 轻量 Python 子集解释器
 *
 * 目的：让练习场给出「真反馈」——你的代码真的被执行，输出是真的，
 * 报错是真的（带行号和中文解释），而不是拿正则猜你写对没有。
 *
 * 覆盖：字面量 / 运算 / 变量 / input-print / f-string / if-elif-else /
 *       while-for / break-continue / 函数 / 默认参数 / 列表·元组·字典·集合 /
 *       切片 / 推导式 / 字符串与容器常用方法 / 异常 try-except / 类与对象
 * 不覆盖：文件读写、多线程、生成器、装饰器、第三方库（遇到时给出明确的中文提示）
 *
 * 安全：纯 JS 解释执行，没有 eval / Function；语句步数有上限，死循环会被中断。
 * 接口：window.PyExec.run(code, {inputs: []}) -> {ok, stdout, lines, error, uses}
 */
(function () {
  "use strict";

  /* ============================================================
     错误
     ============================================================ */
  class PyError extends Error {
    constructor(type, message, line) {
      super(message);
      this.name = "PyError";
      this.pyType = type;
      this.line = line || 0;
    }
  }
  function raise(type, message, line) {
    throw new PyError(type, message, line);
  }

  /* ============================================================
     值的表示
     ============================================================ */
  class PyFloat { constructor(v) { this.v = v; } }
  class PyTuple { constructor(items) { this.items = items; } }
  function dictKeyEqual(a, b) {
    if (a === b) return true;
    const aNumeric = typeof a === "boolean" || isNum(a);
    const bNumeric = typeof b === "boolean" || isNum(b);
    return aNumeric && bNumeric && Number(nval(a)) === Number(nval(b));
  }
  // Map 保留首次插入的键对象，同时让 True/1、False/0 等等价键共用一项。
  class PyDictMap extends Map {
    constructor(entries) {
      super();
      if (entries) for (const [k, v] of entries) this.set(k, v);
    }
    findKey(key) {
      for (const existing of super.keys()) if (dictKeyEqual(existing, key)) return existing;
      return key;
    }
    has(key) { return super.has(this.findKey(key)); }
    get(key) { return super.get(this.findKey(key)); }
    set(key, value) { return super.set(this.findKey(key), value); }
    delete(key) { return super.delete(this.findKey(key)); }
  }
  class PyDict { constructor(map) { this.map = new PyDictMap(map); } }
  class PySet { constructor(set) { this.set = set || new Set(); } }
  class PyModule { constructor(name, members) { this.name = name; this.members = members; } }
  class PyClass {
    constructor(name, methods, base) {
      this.name = name;
      this.methods = methods;
      this.base = base || null;
      this.classAttrs = new Map();
      this.__callable = true;   // 类名() 就是造对象
    }
    lookup(n) { return this.methods.get(n) || (this.base ? this.base.lookup(n) : null); }
    call(args, kwargs, line) {
      const obj = new PyObj(this);
      // 类属性对实例可见（只读）
      for (const [k, v] of this.classAttrs) obj.dict.set(k, v);
      const init = this.lookup("__init__");
      if (init) init.call([obj, ...args], kwargs, line);
      else if (args.length) {
        raise("TypeError", `${this.name}() 不接受参数：这个类没有定义 __init__`, line);
      }
      return obj;
    }
  }
  class PyObj {
    constructor(cls) { this.cls = cls; this.dict = new Map(); }
    lookup(n) {
      if (this.dict.has(n)) return this.dict.get(n);
      let c = this.cls;
      while (c) { if (c.methods.has(n)) return c.methods.get(n); c = c.base; }
      return undefined;
    }
  }
  class PyFunc {
    constructor(name, params, body, closure) {
      this.__callable = true;
      this.name = name;
      this.params = params;
      this.body = body;
      this.closure = closure;
      // 默认参数在定义函数时求值，并在多次调用之间共享对象。
      this.defaults = params.list.map(p => p.def ? evalNode(p.def, closure) : null);
    }
    call(args, kwargs, line) {
      const isMethod = this.params.self;
      const scope = new Scope(this.closure);
      const positional = this.params.list;      // [{name, def}]
      const star = this.params.star;            // 名字或 null
      const kwstar = this.params.kwstar;        // 名字或 null
      let ai = 0;
      for (const p of positional) {
        if (ai < args.length) { scope.declare(p.name, args[ai++]); }
        else if (kwargs.has(p.name)) { scope.declare(p.name, kwargs.get(p.name)); }
        else if (p.def) { scope.declare(p.name, this.defaults[positional.indexOf(p)]); }
        else if (p.name === this.params.selfName && args.length === 0) {
          raise("TypeError", `${this.name}() 缺少 self`, line);
        } else {
          raise("TypeError", `${this.name}() 少了一个参数：${p.name}`, line);
        }
      }
      const rest = args.slice(ai);
      if (star) scope.declare(star, rest);
      else if (rest.length) {
        raise("TypeError", `${this.name}() 只接受 ${positional.length} 个位置参数，你给了 ${args.length} 个`, line);
      }
      if (kwstar) {
        const d = new PyDict();
        for (const [k, v] of kwargs) {
          if (!positional.some(p => p.name === k)) d.map.set(k, v);
        }
        scope.declare(kwstar, d);
      } else {
        for (const k of kwargs.keys()) {
          if (!positional.some(p => p.name === k)) {
            raise("TypeError", `${this.name}() 没有名为 ${k} 的参数`, line);
          }
        }
      }
      try {
        execBlock(this.body, scope);
      } catch (e) {
        if (e instanceof ReturnSig) return e.value;
        throw e;
      }
      return null;
    }
  }
  class PyBoundMethod {
    constructor(fn, self) { this.__callable = true; this.fn = fn; this.self = self; this.name = fn.name; }
    call(args, kwargs, line) { return this.fn.call([this.self, ...args], kwargs, line); }
  }
  function builtin(name, fn) {
    return {
      __callable: true,
      __builtin: true,
      name,
      call(args, kwargs, line) { return fn(args, kwargs, line); }
    };
  }
  function isCallable(v) { return !!(v && v.__callable); }

  /* ============================================================
     数值 / 字符串 / 容器 基础操作
     ============================================================ */
  const isNum = v => typeof v === "number" || v instanceof PyFloat;
  const nval = v => (v instanceof PyFloat ? v.v : v);
  const mkNum = (v, isFloat) => (isFloat && !Number.isInteger(v) ? new PyFloat(v) : (isFloat ? new PyFloat(v) : v));

  function numRepr(v) {
    if (v instanceof PyFloat) {
      const x = v.v;
      if (Number.isNaN(x)) return "nan";
      if (!Number.isFinite(x)) return x > 0 ? "inf" : "-inf";
      let s = String(x);
      if (!/[.eE]/.test(s)) s += ".0";
      return s.replace(/e([+-])(\d)$/, "e$10$2");
    }
    if (Number.isInteger(v)) return String(v);
    let s = String(v);
    if (!/[.eE]/.test(s)) s += ".0";
    return s;
  }

  function pyRepr(v) {
    if (typeof v === "string") return reprString(v);
    return pyStr(v);
  }
  function reprString(s) {
    const esc = s.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/\r/g, "\\r").replace(/\t/g, "\\t");
    if (esc.includes("'") && !esc.includes('"')) return '"' + esc + '"';
    return "'" + esc.replace(/'/g, "\\'") + "'";
  }
  function pyStr(v) {
    if (v === null || v === undefined) return "None";
    if (v === true) return "True";
    if (v === false) return "False";
    if (typeof v === "string") return v;
    if (isNum(v)) return numRepr(v);
    if (Array.isArray(v)) return "[" + v.map(pyRepr).join(", ") + "]";
    if (v instanceof PyTuple) {
      if (v.items.length === 1) return "(" + pyRepr(v.items[0]) + ",)";
      return "(" + v.items.map(pyRepr).join(", ") + ")";
    }
    if (v instanceof PyDict) {
      const parts = [];
      for (const [k, val] of v.map) parts.push(pyRepr(k) + ": " + pyRepr(val));
      return "{" + parts.join(", ") + "}";
    }
    if (v instanceof PySet) {
      if (!v.set.size) return "set()";
      return "{" + [...v.set].map(pyRepr).join(", ") + "}";
    }
    if (v instanceof PyFunc) return `<function ${v.name}>`;
    if (v instanceof PyBoundMethod) return `<bound method ${v.name}>`;
    if (v.__builtin) return `<built-in function ${v.name}>`;
    if (v instanceof PyClass) return `<class '${v.name}'>`;
    if (v instanceof PyObj) return `<${v.cls.name} 对象>`;
    if (v instanceof PyModule) return `<module '${v.name}'>`;
    return String(v);
  }

  function truthy(v) {
    if (v === null || v === undefined || v === false) return false;
    if (v === true) return true;
    if (isNum(v)) return nval(v) !== 0;
    if (typeof v === "string") return v.length > 0;
    if (Array.isArray(v)) return v.length > 0;
    if (v instanceof PyTuple) return v.items.length > 0;
    if (v instanceof PyDict) return v.map.size > 0;
    if (v instanceof PySet) return v.set.size > 0;
    return true;
  }

  const typeName = v => {
    if (v === null || v === undefined) return "NoneType";
    if (v === true || v === false) return "bool";
    if (typeof v === "string") return "str";
    if (typeof v === "number") return "int";
    if (v instanceof PyFloat) return "float";
    if (Array.isArray(v)) return "list";
    if (v instanceof PyTuple) return "tuple";
    if (v instanceof PyDict) return "dict";
    if (v instanceof PySet) return "set";
    if (v instanceof PyFunc || v instanceof PyBoundMethod || v.__builtin) return "function";
    if (v instanceof PyClass) return "type";
    if (v instanceof PyObj) return v.cls.name;
    return "object";
  };
  const typeLabel = v => `<class '${typeName(v)}'>`;

  function deepEqual(a, b) {
    if (isNum(a) && isNum(b)) return nval(a) === nval(b);
    if (a === b) return true;
    if (typeof a !== typeof b && !(isNum(a) && isNum(b))) {
      if (!(a && b && typeof a === "object" && typeof b === "object")) return false;
    }
    if (Array.isArray(a) && Array.isArray(b)) {
      return a.length === b.length && a.every((x, i) => deepEqual(x, b[i]));
    }
    if (a instanceof PyTuple && b instanceof PyTuple) return deepEqual(a.items, b.items);
    if (a instanceof PyDict && b instanceof PyDict) {
      if (a.map.size !== b.map.size) return false;
      for (const [k, v] of a.map) {
        if (!b.map.has(k)) return false;
        if (!deepEqual(v, b.map.get(k))) return false;
      }
      return true;
    }
    if (a instanceof PySet && b instanceof PySet) {
      if (a.set.size !== b.set.size) return false;
      for (const x of a.set) if (!b.set.has(x)) return false;
      return true;
    }
    return false;
  }

  /* ---- 二元运算 ---- */
  function binop(op, a, b, line) {
    // 集合运算：& | - ^
    if (a instanceof PySet && b instanceof PySet) {
      if (op === "&") return new PySet(new Set([...a.set].filter(x => b.set.has(x))));
      if (op === "|") return new PySet(new Set([...a.set, ...b.set]));
      if (op === "-") return new PySet(new Set([...a.set].filter(x => !b.set.has(x))));
      if (op === "^") return new PySet(new Set([...a.set, ...b.set].filter(x => !(a.set.has(x) && b.set.has(x)))));
    }
    if (op === "%" && typeof a === "string") {
      // 老式 % 占位符：'%s 考了 %d 分' % (name, score)
      const vals = b instanceof PyTuple ? b.items.slice() : [b];
      let vi = 0;
      return a.replace(/%([-+ 0#]*)(\d*)(?:\.(\d+))?([sdifxXr%])/g, (m, flag, width, prec, t) => {
        if (t === "%") return "%";
        if (vi >= vals.length) raise("TypeError", "字符串里的 % 占位符比提供的值多。有几个 %s / %d，后面就要给几个值。", line);
        const v = vals[vi++];
        if (t === "s") return formatValue(v, (width || "") + (prec ? "." + prec : "") + "s");
        if (t === "r") return formatValue(pyRepr(v), "");
        if (t === "f") return formatValue(v, (width || "") + (prec ? "." + prec : "") + "f");
        if (t === "d" || t === "i") return formatValue(v, (width || "") + "d");
        if (t === "x") return Math.trunc(nval(v)).toString(16);
        if (t === "X") return Math.trunc(nval(v)).toString(16).toUpperCase();
        return m;
      });
    }
    if (op === "+") {
      if (typeof a === "string" && typeof b === "string") return a + b;
      if (typeof a === "string" || typeof b === "string") {
        raise("TypeError", `不能这样相加：${typeName(a)} 和 ${typeName(b)}。字符串只能和字符串用 + 拼接，数字要先用 str() 或 f-string 转成文字。`, line);
      }
      if (Array.isArray(a) && Array.isArray(b)) return a.concat(b);
      if (a instanceof PyTuple && b instanceof PyTuple) return new PyTuple(a.items.concat(b.items));
      if (isNum(a) && isNum(b)) return mkNum(nval(a) + nval(b), a instanceof PyFloat || b instanceof PyFloat);
      raise("TypeError", `+ 不支持 ${typeName(a)} 和 ${typeName(b)}`, line);
    }
    if (op === "-" || op === "*" || op === "/" || op === "//" || op === "%" || op === "**") {
      if (op === "*") {
        if (typeof a === "string" && isNum(b)) {
          const count = Math.max(0, Math.floor(nval(b)));
          checkCollectionSize(a.length * count, line, "字符串重复");
          return a.repeat(count);
        }
        if (isNum(a) && typeof b === "string") {
          const count = Math.max(0, Math.floor(nval(a)));
          checkCollectionSize(b.length * count, line, "字符串重复");
          return b.repeat(count);
        }
        if (Array.isArray(a) && isNum(b)) {
          const count = Math.max(0, Math.floor(nval(b)));
          checkCollectionSize(a.length * count, line, "列表重复");
          const out = [];
          for (let i = 0; i < count; i++) for (const item of a) out.push(item);
          return out;
        }
      }
      if (!isNum(a) || !isNum(b)) {
        raise("TypeError", `${op} 只能用于数字，你给的是 ${typeName(a)} 和 ${typeName(b)}`, line);
      }
      const x = nval(a), y = nval(b);
      const f = a instanceof PyFloat || b instanceof PyFloat;
      if (op === "-") return mkNum(x - y, f);
      if (op === "*") return mkNum(x * y, f);
      if (op === "/") {
        if (y === 0) raise("ZeroDivisionError", "不能除以 0。先判断一下除数是不是 0 再除。", line);
        return new PyFloat(x / y);
      }
      if (op === "//") {
        if (y === 0) raise("ZeroDivisionError", "不能整除 0。", line);
        const r = Math.floor(x / y);
        return f ? new PyFloat(r) : r;
      }
      if (op === "%") {
        if (y === 0) raise("ZeroDivisionError", "不能对 0 取余。", line);
        const r = ((x % y) + y) % y;
        return f ? new PyFloat(r) : r;
      }
      if (op === "**") {
        const r = Math.pow(x, y);
        return (!f && y >= 0 && Number.isInteger(r)) ? r : new PyFloat(r);
      }
    }
    raise("TypeError", `不支持的运算符 ${op}`, line);
  }

  function compare(op, a, b, line) {
    if (op === "==") return deepEqual(a, b);
    if (op === "!=") return !deepEqual(a, b);
    if (op === "is") return a === b || (a === null && b === null);
    if (op === "is not") return !(a === b || (a === null && b === null));
    if (op === "in") return contains(b, a, line);
    if (op === "not in") return !contains(b, a, line);
    let x = a, y = b;
    if (isNum(a) && isNum(b)) { x = nval(a); y = nval(b); }
    else if (typeof a === "string" && typeof b === "string") { /* ok */ }
    else if (Array.isArray(a) && Array.isArray(b)) {
      const n = Math.min(a.length, b.length);
      for (let i = 0; i < n; i++) {
        if (deepEqual(a[i], b[i])) continue;
        return compare(op, a[i], b[i], line);
      }
      return compare(op, n, Math.max(a.length, b.length), line);
    }
    else raise("TypeError", `不能比较 ${typeName(a)} 和 ${typeName(b)} 的大小`, line);
    switch (op) {
      case "<": return x < y;
      case "<=": return x <= y;
      case ">": return x > y;
      case ">=": return x >= y;
    }
    raise("TypeError", `不支持的比较 ${op}`, line);
  }

  function contains(container, item, line) {
    if (typeof container === "string") {
      if (typeof item !== "string") raise("TypeError", "字符串里只能用 in 找另一段文字", line);
      return container.includes(item);
    }
    if (Array.isArray(container)) return container.some(x => deepEqual(x, item));
    if (container instanceof PyTuple) return container.items.some(x => deepEqual(x, item));
    if (container instanceof PyDict) return container.map.has(item);
    if (container instanceof PySet) return container.set.has(item);
    raise("TypeError", `in 不能用在这里：${typeName(container)} 不是可遍历的容器`, line);
  }

  function iterate(v, line) {
    if (Array.isArray(v)) return v.slice();
    if (typeof v === "string") return v.split("");
    if (v instanceof PyTuple) return v.items.slice();
    if (v instanceof PyDict) {
      const keys = [...v.map.keys()];
      const ordered = v.__order || keys;
      return ordered.slice();
    }
    if (v instanceof PySet) return [...v.set];
    if (v && v.__order) return v.__order.slice();
    raise("TypeError", `${typeName(v)} 不能被 for 遍历`, line);
  }

  function length(v, line) {
    if (typeof v === "string") return v.length;
    if (Array.isArray(v)) return v.length;
    if (v instanceof PyTuple) return v.items.length;
    if (v instanceof PyDict) return v.map.size;
    if (v instanceof PySet) return v.set.size;
    raise("TypeError", `len() 不能用于 ${typeName(v)}`, line);
  }

  /* ---- f-string 格式化 ---- */
  function formatValue(v, spec) {
    if (!spec) return pyStr(v);
    let rest = spec;
    let type = "";
    const mType = /([sdfe%gx])$/.exec(rest);
    if (mType) { type = mType[1]; rest = rest.slice(0, -1); }
    let prec = null;
    const mPrec = /\.(\d+)/.exec(rest);
    if (mPrec) { prec = parseInt(mPrec[1], 10); rest = rest.replace(/\.\d+/, ""); }
    const comma = rest.includes(",");
    const mWidth = /(\d+)/.exec(rest);
    const width = mWidth ? parseInt(mWidth[1], 10) : 0;
    const mAlign = /([<>^])/.exec(rest);
    const align = mAlign ? mAlign[1] : (isNum(v) ? ">" : "<");
    const zero = /0\d/.test(rest);

    let out;
    const n = nval(v);
    if (type === "f" || type === "F") out = (prec === null ? 6 : prec).toString() && n.toFixed(prec === null ? 6 : prec);
    else if (type === "d") out = String(Math.trunc(n));
    else if (type === "%") out = (n * 100).toFixed(prec === null ? 6 : prec) + "%";
    else if (type === "e") out = n.toExponential(prec === null ? 6 : prec);
    else if (isNum(v)) out = prec === null ? numRepr(v) : n.toFixed(prec);
    else out = pyStr(v);

    if (comma) {
      const parts = out.split(".");
      parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
      out = parts.join(".");
    }
    if (width > out.length) {
      const pad = width - out.length;
      const fill = zero ? "0" : " ";
      if (align === "<") out = out + fill.repeat(pad);
      else if (align === "^") out = fill.repeat(Math.floor(pad / 2)) + out + fill.repeat(Math.ceil(pad / 2));
      else out = fill.repeat(pad) + out;
    }
    return out;
  }

  /* ============================================================
     词法
     ============================================================ */
  const KEYWORDS = new Set([
    "and", "as", "assert", "break", "class", "continue", "def", "del", "elif", "else",
    "except", "finally", "for", "from", "global", "if", "import", "in", "is", "lambda",
    "nonlocal", "not", "or", "pass", "raise", "return", "try", "while", "with", "yield"
  ]);
  const OPS = [
    "**=", "//=", "<<=", ">>=", "==", "!=", "<=", ">=", "//", "**", "+=", "-=", "*=", "/=",
    "%=", "&=", "|=", "^=", "->", "<<", ">>", "+", "-", "*", "/", "%", "<", ">", "=",
    "(", ")", "[", "]", "{", "}", ",", ":", ".", ";", "&", "|", "^", "~", "@"
  ];

  function tokenize(src) {
    const toks = [];
    const n = src.length;
    let i = 0, line = 1, depth = 0, atBol = true;
    const indents = [0];
    const push = (t, v) => toks.push({ t, v, line });

    if (src.charCodeAt(0) === 0xfeff) i = 1;

    while (i < n) {
      if (atBol && depth === 0) {
        const startLine = line;
        let j = i, ind = 0;
        while (j < n && (src[j] === " " || src[j] === "\t")) { ind += src[j] === "\t" ? 4 : 1; j++; }
        if (j >= n) { i = j; break; }
        const ch = src[j];
        if (ch === "\n") { i = j + 1; line++; continue; }
        if (ch === "\r") { i = j + 1; continue; }
        if (ch === "#") { while (j < n && src[j] !== "\n") j++; i = j; continue; }
        const top = indents[indents.length - 1];
        if (ind > top) { indents.push(ind); push("INDENT"); }
        else if (ind < top) {
          while (indents.length > 1 && ind < indents[indents.length - 1]) { indents.pop(); push("DEDENT"); }
          if (ind !== indents[indents.length - 1]) {
            raise("IndentationError", `缩进乱了：第 ${startLine} 行缩进 ${ind} 个空格，对不上上一层的任何缩进。Python 靠缩进划分代码块，同一个块里必须对齐。`, startLine);
          }
        }
        i = j; atBol = false; continue;
      }

      const c = src[i];
      if (c === "\n") {
        line++; i++;
        if (depth === 0) { push("NEWLINE"); atBol = true; }
        continue;
      }
      if (c === " " || c === "\t" || c === "\r") { i++; continue; }
      if (c === "\\" && (src[i + 1] === "\n" || src[i + 1] === "\r")) { i += 2; line++; continue; }
      if (c === "#") { while (i < n && src[i] !== "\n") i++; continue; }

      // 字符串（含 f/r 前缀、三引号）
      const pre = /[fFrRbBuU]{0,2}/.exec(src.slice(i, i + 2))[0];
      const qIdx = i + pre.length;
      if ((src[qIdx] === '"' || src[qIdx] === "'") && /^[fFrRbBuU]{0,2}$/.test(pre)) {
        const quote = src[qIdx];
        const triple = src[qIdx + 1] === quote && src[qIdx + 2] === quote;
        const startLine = line;
        let j = qIdx + (triple ? 3 : 1);
        let out = "";
        let closed = false;
        while (j < n) {
          if (triple && src[j] === quote && src[j + 1] === quote && src[j + 2] === quote) {
            j += 3; closed = true; break;
          }
          if (!triple && src[j] === quote) { j += 1; closed = true; break; }
          if (!triple && src[j] === "\n") break;
          if (src[j] === "\\") {
            const nx = src[j + 1];
            const map = { n: "\n", t: "\t", r: "\r", "\\": "\\", "'": "'", '"': '"', "0": "\0" };
            if (nx === "\n") { line++; j += 2; continue; }
            if (nx === "u") {
              const hex = src.slice(j + 2, j + 6);
              if (/^[0-9a-fA-F]{4}$/.test(hex)) { out += String.fromCharCode(parseInt(hex, 16)); j += 6; continue; }
            }
            out += map[nx] !== undefined ? map[nx] : nx;
            j += 2;
            continue;
          }
          if (src[j] === "\n") line++;
          out += src[j];
          j++;
        }
        if (!closed) {
          raise("SyntaxError", `第 ${startLine} 行的引号没有配对。字符串必须用一个引号开始、同一个引号结束。`, startLine);
        }
        const isF = /f/i.test(pre);
        if (isF) push("FSTRING", out);
        else push("STRING", out);
        i = j; continue;
      }

      // 数字
      if (/[0-9]/.test(c) || (c === "." && /[0-9]/.test(src[i + 1] || ""))) {
        const m = /^(0[xX][0-9a-fA-F]+|0[bB][01]+|\d+\.\d*(?:[eE][+-]?\d+)?|\.\d+(?:[eE][+-]?\d+)?|\d+(?:[eE][+-]?\d+)?)/.exec(src.slice(i));
        const raw = m[0];
        i += raw.length;
        if (/^0[xX]/.test(raw)) push("NUMBER", String(parseInt(raw, 16)));
        else if (/^0[bB]/.test(raw)) push("NUMBER", String(parseInt(raw.slice(2), 2)));
        else if (/[.eE]/.test(raw)) push("NUMBER", raw, true), (toks[toks.length - 1].isFloat = true);
        else push("NUMBER", String(parseInt(raw, 10)));
        continue;
      }

      // 标识符 / 关键字
      if (/[A-Za-z_\u4e00-\u9fff]/.test(c)) {
        let j = i;
        while (j < n && /[A-Za-z0-9_\u4e00-\u9fff]/.test(src[j])) j++;
        const word = src.slice(i, j);
        push(KEYWORDS.has(word) ? "KW" : "NAME", word);
        i = j; continue;
      }

      // 运算符
      let matched = false;
      for (const op of OPS) {
        if (src.startsWith(op, i)) {
          if (op === "(" || op === "[" || op === "{") depth++;
          if (op === ")" || op === "]" || op === "}") depth = Math.max(0, depth - 1);
          push("OP", op);
          i += op.length;
          matched = true;
          break;
        }
      }
      if (matched) continue;

      raise("SyntaxError", `第 ${line} 行有个看不懂的字符：「${c}」。中文标点（，。；：！？）不能出现在代码里，要换成英文的 , . ; : ! ?`, line);
    }

    if (toks.length && toks[toks.length - 1].t !== "NEWLINE" && toks[toks.length - 1].t !== "DEDENT") push("NEWLINE");
    while (indents.length > 1) { indents.pop(); push("DEDENT"); }
    push("EOF");
    return toks;
  }

  /* ============================================================
     语法分析
     ============================================================ */
  class Parser {
    constructor(toks) {
      this.toks = toks;
      this.p = 0;
      this.uses = { for: 0, while: 0, if: 0, def: 0, listcomp: 0, dictcomp: 0, lambda: 0, print: 0, input: 0, try: 0, class: 0, total: 0 };
      this.line = 1;
    }
    peek(o = 0) { return this.toks[this.p + o]; }
    next() {
      const t = this.toks[this.p++];
      if (t) this.line = t.line;
      return t;
    }
    at(t, v) { const x = this.peek(); return x && x.t === t && (v === undefined || x.v === v); }
    eat(t, v) { if (this.at(t, v)) return this.next(); return null; }
    expect(t, v, msg) {
      if (this.at(t, v)) return this.next();
      const got = this.peek();
      raise("SyntaxError", msg || `第 ${got ? got.line : this.line} 行少了东西：这里应该是 ${v || t}，实际是「${got ? got.v : "文件末尾"}」`, got ? got.line : this.line);
    }
    node(type, props) { return Object.assign({ type, line: this.line }, props); }

    parseModule() {
      const body = [];
      while (!this.at("EOF")) {
        if (this.eat("NEWLINE")) continue;
        if (this.eat("INDENT")) continue;
        if (this.eat("DEDENT")) continue;
        body.push(this.parseStatement());
      }
      return body;
    }

    parseBlock() {
      this.expect("OP", ":", "这一行的末尾要有一个英文冒号 :");
      if (this.eat("NEWLINE")) {
        if (!this.at("INDENT")) {
          raise("IndentationError", "冒号后面这一块要有缩进（一般是 4 个空格）。Python 靠缩进判断「哪些行属于这个 if/for/def」。", this.line);
        }
        this.expect("INDENT");
        const body = [];
        while (!this.at("DEDENT") && !this.at("EOF")) {
          if (this.eat("NEWLINE")) continue;
          body.push(this.parseStatement());
        }
        this.eat("DEDENT");
        if (!body.length) raise("SyntaxError", "代码块不能是空的。至少写一行 pass 占位。", this.line);
        return body;
      }
      return [this.parseStatement()];
    }

    parseStatement() {
      const t = this.peek();
      if (!t) raise("SyntaxError", "代码在末尾断了，最后一行可能没写完", this.line);
      this.uses.total++;
      if (t.t === "KW") {
        switch (t.v) {
          case "if": return this.parseIf();
          case "while": this.uses.while++; return this.parseWhile();
          case "for": this.uses.for++; return this.parseFor();
          case "def": this.uses.def++; return this.parseFuncDef();
          case "class": this.uses.class++; return this.parseClassDef();
          case "try": this.uses.try++; return this.parseTry();
          case "return": {
            this.next();
            const has = !this.at("NEWLINE") && !this.at("DEDENT") && !this.at("EOF");
            return this.node("Return", { value: has ? this.parseExprList() : null });
          }
          case "pass": this.next(); return this.node("Pass", {});
          case "break": this.next(); return this.node("Break", {});
          case "continue": this.next(); return this.node("Continue", {});
          case "del": {
            this.next();
            return this.node("Del", { targets: this.parseExprList().items });
          }
          case "import": return this.parseImport();
          case "from": return this.parseFromImport();
          case "raise": {
            this.next();
            const has = !this.at("NEWLINE") && !this.at("EOF");
            return this.node("Raise", { exc: has ? this.parseExpr() : null });
          }
          case "global":
          case "nonlocal": {
            const kind = this.next().v;
            const names = [];
            do {
              names.push(this.expect("NAME", undefined, `${kind} 后面要是变量名`).v);
            } while (this.eat("OP", ","));
            return this.node(kind === "global" ? "Global" : "Nonlocal", { names });
          }
          case "assert": {
            this.next();
            const test = this.parseExpr();
            let msg = null;
            if (this.eat("OP", ",")) msg = this.parseExpr();
            return this.node("Assert", { test, msg });
          }
          case "with":
            this.next();
            raise("SyntaxError", "浏览器版解释器还不支持 with 语句（文件读写要在本地终端里跑）。可以先用 try/except 或去掉 with 试试。", this.line);
        }
      }
      return this.parseSimple();
    }

    parseSimple() {
      const first = this.parseExprList();
      const t = this.peek();
      if (t && t.t === "OP" && t.v === "=") {
        const targets = [];
        let left = first;
        while (this.at("OP", "=")) {
          this.next();
          if (left.type !== "Name" && left.type !== "Tuple" && left.type !== "List" && left.type !== "Index" && left.type !== "Attr") {
            raise("SyntaxError", "等号左边必须是变量名（或列表元素、对象属性）", t.line);
          }
          targets.push(left);
          left = this.parseExprList();
        }
        return this.node("Assign", { targets, value: left });
      }
      if (t && t.t === "OP" && /^(\+|-|\*|\/|\/\/|%|\*\*)=$/.test(t.v)) {
        this.next();
        const value = this.parseExprList();
        return this.node("AugAssign", { target: first, op: t.v.slice(0, -1), value });
      }
      if (first.type === "Tuple" && first.items.length > 1) {
        raise("SyntaxError", "这行像是元组表达式；如果是想给多个变量赋值，请写成 a, b = 1, 2", t ? t.line : this.line);
      }
      return this.node("Expr", { value: first });
    }

    parseExprList() {
      const items = [this.parseExpr()];
      while (this.at("OP", ",")) {
        this.next();
        if (this.at("NEWLINE") || this.at("EOF") || this.at("OP", "=")) break;
        items.push(this.parseExpr());
      }
      if (items.length === 1) return items[0];
      return this.node("Tuple", { items });
    }

    parseIf() {
      this.next();
      const test = this.parseExpr();
      const body = this.parseBlock();
      let orelse = [];
      if (this.at("KW", "elif")) {
        orelse = [this.parseIf()];
      } else if (this.at("KW", "else")) {
        this.next();
        orelse = this.parseBlock();
      }
      this.uses.if++;
      return this.node("If", { test, body, orelse });
    }
    parseWhile() {
      this.next();
      const test = this.parseExpr();
      const body = this.parseBlock();
      let orelse = [];
      if (this.at("KW", "else")) { this.next(); orelse = this.parseBlock(); }
      return this.node("While", { test, body, orelse });
    }
    parseFor() {
      this.next();
      const target = this.parseTargetList();
      if (!this.at("KW", "in")) raise("SyntaxError", "for 循环要写成 for 变量 in 可遍历对象:", this.line);
      this.next();
      const iter = this.parseExpr();
      const body = this.parseBlock();
      let orelse = [];
      if (this.at("KW", "else")) { this.next(); orelse = this.parseBlock(); }
      return this.node("For", { target, iter, body, orelse });
    }
    parseTargetList() {
      const items = [this.parseTarget()];
      while (this.at("OP", ",")) {
        this.next();
        if (this.at("KW", "in")) break;
        items.push(this.parseTarget());
      }
      if (items.length === 1) return items[0];
      return this.node("Tuple", { items });
    }
    parseTarget() {
      const e = this.parsePostfix();
      if (!["Name", "Tuple", "List", "Index", "Attr"].includes(e.type)) {
        raise("SyntaxError", "这里应该是一个变量名（比如 i、name、a[0]）", this.line);
      }
      return e;
    }

    parseParams() {
      const list = [];
      let star = null, kwstar = null, selfName = null;
      this.expect("OP", "(");
      while (!this.at("OP", ")")) {
        if (this.eat("OP", "*")) { star = this.expect("NAME").v; }
        else if (this.eat("OP", "**")) { kwstar = this.expect("NAME").v; }
        else {
          const name = this.expect("NAME", undefined, "参数名必须是变量名").v;
          let def = null;
          if (this.eat("OP", "=")) def = this.parseExpr();
          if (this.at("OP", ":")) { this.next(); this.parseExpr(); } // 类型注解，忽略
          list.push({ name, def });
        }
        if (!this.eat("OP", ",")) break;
      }
      this.expect("OP", ")");
      return { list, star, kwstar, self: false, selfName: list.length ? list[0].name : null };
    }

    parseFuncDef() {
      this.next();
      const name = this.expect("NAME").v;
      const params = this.parseParams();
      if (this.at("OP", "->")) { this.next(); this.parseExpr(); }
      const body = this.parseBlock();
      return this.node("FuncDef", { name, params, body });
    }
    parseClassDef() {
      this.next();
      const name = this.expect("NAME").v;
      let base = null;
      if (this.eat("OP", "(")) {
        if (!this.at("OP", ")")) base = this.parseExpr();
        this.expect("OP", ")");
      }
      const body = this.parseBlock();
      return this.node("ClassDef", { name, base, body, className: name });
    }
    parseTry() {
      this.next();
      const body = this.parseBlock();
      const handlers = [];
      let orelse = [], finalbody = [];
      while (this.at("KW", "except")) {
        this.next();
        let type = null, name = null;
        if (!this.at("OP", ":")) {
          type = this.parseExpr();
          if (this.at("KW", "as")) { this.next(); name = this.expect("NAME").v; }
        }
        handlers.push({ type, name, body: this.parseBlock() });
      }
      if (this.at("KW", "else")) { this.next(); orelse = this.parseBlock(); }
      if (this.at("KW", "finally")) { this.next(); finalbody = this.parseBlock(); }
      if (!handlers.length && !finalbody.length) {
        raise("SyntaxError", "try 后面必须跟 except 或 finally", this.line);
      }
      return this.node("Try", { body, handlers, orelse, finalbody });
    }
    parseImport() {
      this.next();
      const names = [];
      do {
        let mod = this.expect("NAME").v;
        while (this.at("OP", ".")) { this.next(); mod += "." + this.expect("NAME").v; }
        let asName = null;
        if (this.at("KW", "as")) { this.next(); asName = this.expect("NAME").v; }
        names.push({ mod, asName });
      } while (this.eat("OP", ","));
      return this.node("Import", { names });
    }
    parseFromImport() {
      this.next();
      let mod = this.expect("NAME").v;
      while (this.at("OP", ".")) { this.next(); mod += "." + this.expect("NAME").v; }
      if (!this.at("KW", "import")) raise("SyntaxError", "from ... import 语句缺了 import 关键字", this.line);
      this.next();
      const names = [];
      do {
        const n = this.expect("NAME").v;
        let asName = null;
        if (this.at("KW", "as")) { this.next(); asName = this.expect("NAME").v; }
        names.push({ name: n, asName });
      } while (this.eat("OP", ","));
      return this.node("FromImport", { mod, names });
    }

    /* ---- 表达式 ---- */
    parseExpr() { return this.parseTernary(); }
    parseTernary() {
      const body = this.parseOr();
      if (this.at("KW", "if")) {
        this.next();
        const test = this.parseOr();
        if (!this.at("KW", "else")) raise("SyntaxError", "条件表达式要写成 A if 条件 else B，少了 else", this.line);
        this.next();
        const orelse = this.parseExpr();
        return this.node("IfExp", { test, body, orelse });
      }
      return body;
    }
    parseOr() {
      let left = this.parseAnd();
      while (this.at("KW", "or")) {
        this.next();
        const right = this.parseAnd();
        left = this.node("BoolOp", { op: "or", left, right });
      }
      return left;
    }
    parseAnd() {
      let left = this.parseNot();
      while (this.at("KW", "and")) {
        this.next();
        const right = this.parseNot();
        left = this.node("BoolOp", { op: "and", left, right });
      }
      return left;
    }
    parseNot() {
      if (this.at("KW", "not")) { this.next(); return this.node("Un", { op: "not", operand: this.parseNot() }); }
      return this.parseComparison();
    }
    parseComparison() {
      const operands = [this.parseBin(0)];
      const ops = [];
      for (;;) {
        let op = null;
        const t = this.peek();
        if (!t) break;
        if (t.t === "OP" && ["==", "!=", "<", "<=", ">", ">="].includes(t.v)) op = this.next().v;
        else if (t.t === "KW" && t.v === "in") { this.next(); op = "in"; }
        else if (t.t === "KW" && t.v === "is") {
          this.next();
          op = this.at("KW", "not") ? (this.next(), "is not") : "is";
        } else if (t.t === "KW" && t.v === "not" && this.peek(1) && this.peek(1).v === "in") {
          this.next(); this.next(); op = "not in";
        }
        if (!op) break;
        ops.push(op);
        operands.push(this.parseBin(0));
      }
      if (!ops.length) return operands[0];
      return this.node("Compare", { ops, operands });
    }
    parseBin(minPrec) {
      let left = this.parseUnary();
      const PREC = { "+": 6, "-": 6, "*": 7, "/": 7, "//": 7, "%": 7, "**": 9, "<<": 5, ">>": 5, "&": 4, "|": 2, "^": 3 };
      for (;;) {
        const t = this.peek();
        if (!t || t.t !== "OP") break;
        const prec = PREC[t.v];
        if (prec === undefined || prec < minPrec) break;
        this.next();
        const right = t.v === "**" ? this.parseBin(prec) : this.parseBin(prec + 1);
        left = this.node("Bin", { op: t.v, left, right });
      }
      return left;
    }
    parseUnary() {
      const t = this.peek();
      if (t && t.t === "OP" && (t.v === "-" || t.v === "+" || t.v === "~")) {
        this.next();
        return this.node("Un", { op: t.v, operand: this.parseUnary() });
      }
      return this.parsePostfix();
    }
    parsePostfix() {
      let e = this.parseAtom();
      for (;;) {
        if (this.at("OP", ".")) {
          this.next();
          const name = this.expect("NAME", undefined, "点号后面必须是属性名，比如 s.strip").v;
          e = this.node("Attr", { obj: e, name });
        } else if (this.at("OP", "(")) {
          this.next();
          const args = [], kwargs = new Map();
          while (!this.at("OP", ")")) {
            if (this.at("OP", "*")) {
              this.next();
              const v = this.parseExpr();
              args.push({ star: v });
            } else if (this.at("OP", "**")) {
              this.next();
              const v = this.parseExpr();
              args.push({ starstar: v });
            } else if (this.at("NAME") && this.peek(1) && this.peek(1).t === "OP" && this.peek(1).v === "=") {
              const k = this.next().v;
              this.next();
              kwargs.set(k, this.parseExpr());
            } else {
              const first = this.parseExpr();
              if (this.at("KW", "for")) {
                // 生成器表达式：sum(x for x in ...)
                args.push({ value: this.node("GenExp", { elt: first, clauses: this.parseClauses() }) });
              } else args.push({ value: first });
            }
            if (!this.eat("OP", ",")) break;
          }
          this.expect("OP", ")", "函数调用的括号没有闭合，看看是不是少了 )");
          if (e.type === "Name" && e.id === "print") this.uses.print++;
          if (e.type === "Name" && e.id === "input") this.uses.input++;
          e = this.node("Call", { func: e, args, kwargs });
        } else if (this.at("OP", "[")) {
          this.next();
          const parts = [];
          let lower = null, upper = null, step = null, isSlice = false;
          if (!this.at("OP", ":")) lower = this.parseExpr();
          if (this.at("OP", ":")) {
            isSlice = true;
            this.next();
            if (!this.at("OP", ":") && !this.at("OP", "]")) upper = this.parseExpr();
            if (this.at("OP", ":")) { this.next(); if (!this.at("OP", "]")) step = this.parseExpr(); }
          }
          this.expect("OP", "]", "方括号没有闭合，看看是不是少了 ]");
          if (isSlice) e = this.node("Slice", { obj: e, lower, upper, step });
          else e = this.node("Index", { obj: e, index: lower });
        } else break;
      }
      return e;
    }
    parseAtom() {
      const t = this.next();
      if (!t) raise("SyntaxError", "代码在末尾断了，最后一行可能没写完", this.line);
      if (t.t === "NUMBER") return this.node("Num", { value: t.isFloat ? parseFloat(t.v) : parseInt(t.v, 10), isFloat: !!t.isFloat });
      if (t.t === "STRING") {
        const parts = [{ lit: t.v }];
        while (this.at("STRING")) parts.push({ lit: this.next().v });
        return this.node("Str", { value: parts.map(p => p.lit).join("") });
      }
      if (t.t === "FSTRING") {
        let fparts = [{ lit: t.v }];
        while (this.at("FSTRING")) fparts = fparts.concat([{ lit: this.next().v }]);
        return this.node("FStr", { raw: fparts.map(p => p.lit).join("") });
      }
      if (t.t === "NAME") return this.node("Name", { id: t.v });
      if (t.t === "KW") {
        if (t.v === "True") return this.node("Const", { value: true });
        if (t.v === "False") return this.node("Const", { value: false });
        if (t.v === "None") return this.node("Const", { value: null });
        if (t.v === "not") return this.node("Un", { op: "not", operand: this.parseNot() });
        if (t.v === "lambda") {
          this.uses.lambda++;
          const params = this.parseLambdaParams();
          this.expect("OP", ":");
          const body = this.parseExpr();
          return this.node("Lambda", { params, body });
        }
        raise("SyntaxError", `第 ${t.line} 行的 ${t.v} 不能出现在这个位置`, t.line);
      }
      if (t.t === "OP") {
        if (t.v === "(") {
          if (this.at("OP", ")")) { this.next(); return this.node("Tuple", { items: [] }); }
          const first = this.parseExpr();
          if (this.at("OP", ",")) {
            const items = [first];
            while (this.eat("OP", ",")) {
              if (this.at("OP", ")")) break;
              items.push(this.parseExpr());
            }
            this.expect("OP", ")");
            return this.node("Tuple", { items });
          }
          this.expect("OP", ")", "圆括号没有闭合，看看是不是少了 )");
          return first;
        }
        if (t.v === "[") {
          if (this.at("OP", "]")) { this.next(); return this.node("List", { items: [] }); }
          const first = this.parseExpr();
          if (this.at("KW", "for")) { this.uses.listcomp++; return this.parseComprehension("ListComp", first, "]", "["); }
          const items = [first];
          while (this.eat("OP", ",")) {
            if (this.at("OP", "]")) break;
            items.push(this.parseExpr());
          }
          this.expect("OP", "]", "方括号没有闭合，看看是不是少了 ]");
          return this.node("List", { items });
        }
        if (t.v === "{") {
          if (this.at("OP", "}")) { this.next(); return this.node("Dict", { pairs: [] }); }
          const firstKey = this.parseExpr();
          if (this.at("OP", ":")) {
            this.next();
            const firstVal = this.parseExpr();
            if (this.at("KW", "for")) {
              this.uses.dictcomp++;
              return this.parseDictComprehension(firstKey, firstVal);
            }
            const pairs = [{ k: firstKey, v: firstVal }];
            while (this.eat("OP", ",")) {
              if (this.at("OP", "}")) break;
              const k = this.parseExpr();
              this.expect("OP", ":");
              pairs.push({ k, v: this.parseExpr() });
            }
            this.expect("OP", "}", "花括号没有闭合，看看是不是少了 }");
            return this.node("Dict", { pairs });
          }
          if (this.at("KW", "for")) {
            this.uses.listcomp++;
            return this.parseComprehension("SetComp", firstKey, "}", "{");
          }
          const items = [firstKey];
          while (this.eat("OP", ",")) {
            if (this.at("OP", "}")) break;
            items.push(this.parseExpr());
          }
          this.expect("OP", "}", "花括号没有闭合，看看是不是少了 }");
          return this.node("Set", { items });
        }
        if (t.v === "-" || t.v === "+") return this.node("Un", { op: t.v, operand: this.parseUnary() });
      }
      raise("SyntaxError", `第 ${t.line} 行这里写错了：「${t.v || t.t}」。检查一下是不是多了逗号、少了括号或引号。`, t.line);
    }
    parseLambdaParams() {
      const list = [];
      while (this.at("NAME")) {
        const name = this.next().v;
        let def = null;
        if (this.at("OP", "=")) { this.next(); def = this.parseExpr(); }
        list.push({ name, def });
        if (!this.eat("OP", ",")) break;
      }
      return { list, star: null, kwstar: null, self: false };
    }
    parseClauses() {
      const clauses = [];
      while (this.at("KW", "for")) {
        this.next();
        const target = this.parseTargetList();
        if (!this.at("KW", "in")) raise("SyntaxError", "推导式里 for 后面要跟 in", this.line);
        this.next();
        const iter = this.parseOr();
        const conds = [];
        while (this.at("KW", "if")) { this.next(); conds.push(this.parseOr()); }
        clauses.push({ target, iter, conds });
      }
      return clauses;
    }
    parseComprehension(kind, elt, close) {
      const clauses = this.parseClauses();
      this.expect("OP", close);
      return this.node(kind, { elt, clauses });
    }
    parseDictComprehension(k, v) {
      const clauses = this.parseClauses();
      this.expect("OP", "}");
      return this.node("DictComp", { k, v, clauses });
    }
  }

  /* ============================================================
     作用域
     ============================================================ */
  class Scope {
    constructor(parent) {
      this.parent = parent || null;
      this.vars = new Map();
      this.globalNames = new Set();
      this.nonlocalNames = new Set();
    }
    root() { let s = this; while (s.parent) s = s.parent; return s; }
    declare(name, value) { this.vars.set(name, value); }
    declareGlobal(names) { for (const name of names) this.globalNames.add(name); }
    declareNonlocal(names) { for (const name of names) this.nonlocalNames.add(name); }
    get(name, line) {
      let s = this;
      while (s) {
        if (s.vars.has(name)) return s.vars.get(name);
        s = s.parent;
      }
      raise("NameError", `名字 ${name} 没有被定义过。检查拼写（Python 区分大小写），或者是不是在用之前忘了先赋值。`, line);
    }
    has(name) {
      let s = this;
      while (s) { if (s.vars.has(name)) return true; s = s.parent; }
      return false;
    }
    set(name, value, line) {
      if (this.globalNames.has(name)) {
        this.root().vars.set(name, value);
        return;
      }
      if (this.nonlocalNames.has(name)) {
        let s = this.parent;
        // nonlocal 不绑定模块级变量，只找外层函数作用域。
        while (s && s.parent) {
          if (s.vars.has(name)) { s.vars.set(name, value); return; }
          s = s.parent;
        }
        raise("NameError", `nonlocal 变量 ${name} 没有找到外层绑定`, line);
      }
      // 普通赋值属于当前函数/模块作用域，不能意外改写外层变量。
      this.vars.set(name, value);
    }
  }

  class ReturnSig { constructor(v) { this.value = v; } }
  class BreakSig { }
  class ContinueSig { }

  /* ============================================================
     解释执行
     ============================================================ */
  let STEPS = 0;
  const MAX_STEPS = 400000;
  const MAX_COLLECTION_SIZE = 200000;
  let CTX = null; // {out: [], inputs: [], inputIndex}

  function tick() {
    if (++STEPS > MAX_STEPS) {
      raise("RuntimeError", "这段代码跑了 40 万步还没结束，多半是死循环。检查 while 的条件有没有机会变成 False，循环变量有没有在循环体里更新。", 0);
    }
  }

  function checkCollectionSize(size, line, what) {
    if (!Number.isFinite(size) || size > MAX_COLLECTION_SIZE) {
      raise("MemoryError", `${what}太大了，练习里最多创建 ${MAX_COLLECTION_SIZE} 个元素`, line);
    }
  }

  function assignTarget(target, value, scope) {
    switch (target.type) {
      case "Name": scope.set(target.id, value, target.line); return;
      case "Tuple":
      case "List": {
        const items = iterate(value, target.line);
        const targets = target.items;
        if (items.length !== targets.length) {
          raise("ValueError", `解包数量对不上：左边 ${targets.length} 个变量，右边 ${items.length} 个值`, target.line);
        }
        targets.forEach((t, i) => assignTarget(t, items[i], scope));
        return;
      }
      case "Index": {
        const obj = evalNode(target.obj, scope);
        setItem(obj, evalNode(target.index, scope), value, target.line);
        return;
      }
      case "Attr": {
        const obj = evalNode(target.obj, scope);
        if (!(obj instanceof PyObj)) raise("AttributeError", `不能给 ${typeName(obj)} 设置属性`, target.line);
        obj.dict.set(target.name, value);
        return;
      }
    }
    raise("SyntaxError", "这个位置不能赋值", target.line);
  }

  function setItem(obj, key, value, line) {
    if (Array.isArray(obj)) {
      const i = normIndex(key, obj.length, line);
      obj[i] = value;
      return;
    }
    if (obj instanceof PyDict) {
      if (!obj.map.has(key)) (obj.__order || (obj.__order = [])).push(key);
      obj.map.set(key, value);
      return;
    }
    if (obj instanceof PyListProxy) { obj.arr[obj.i] = value; return; }
    raise("TypeError", `${typeName(obj)} 不支持用下标赋值`, line);
  }
  class PyListProxy { constructor(arr, i) { this.arr = arr; this.i = i; } }

  function normIndex(key, len, line, forSlice) {
    if (typeof key === "boolean" || key === null) raise("TypeError", "下标必须是整数，不能是 True/False/None", line);
    if (!isNum(key)) raise("TypeError", `下标必须是整数，你给的是 ${typeName(key)}`, line);
    let i = Math.trunc(nval(key));
    if (i < 0) i += len;
    if (!forSlice && (i < 0 || i >= len)) {
      raise("IndexError", `下标超出范围：这个对象只有 ${len} 个元素（下标 0 到 ${len - 1}），你取了 ${nval(key)}。`, line);
    }
    return i;
  }

  function getItem(obj, key, line) {
    if (typeof obj === "string") {
      const i = normIndex(key, obj.length, line);
      return obj[i];
    }
    if (Array.isArray(obj)) return obj[normIndex(key, obj.length, line)];
    if (obj instanceof PyTuple) return obj.items[normIndex(key, obj.items.length, line)];
    if (obj instanceof PyDict) {
      if (!obj.map.has(key)) {
        raise("KeyError", `字典里没有这个键：${pyRepr(key)}。用 d.get(键, 默认值) 可以避免报错，或者先用 in 判断键在不在。`, line);
      }
      return obj.map.get(key);
    }
    raise("TypeError", `${typeName(obj)} 不能用下标取值`, line);
  }

  function sliceIt(obj, lower, upper, step, scope, line) {
    const isStr = typeof obj === "string";
    let seq = isStr ? obj : (Array.isArray(obj) ? obj : (obj instanceof PyTuple ? obj.items : null));
    if (!seq) raise("TypeError", `${typeName(obj)} 不支持切片`, line);
    const len = seq.length;
    let st = step === null ? 1 : Math.trunc(nval(evalNode(step, scope)));
    if (st === 0) raise("ValueError", "切片步长不能是 0", line);
    const norm = (v, dflt) => {
      if (v === null) return dflt;
      let n = Math.trunc(nval(evalNode(v, scope)));
      if (n < 0) n += len;
      return n;
    };
    let start, end;
    if (st > 0) {
      start = lower === null ? 0 : norm(lower, 0);
      end = upper === null ? len : norm(upper, len);
      start = Math.max(0, Math.min(len, start));
      end = Math.max(0, Math.min(len, end));
    } else {
      start = lower === null ? len - 1 : norm(lower, len - 1);
      end = upper === null ? -1 : norm(upper, -1);
      start = Math.max(-1, Math.min(len - 1, start));
      end = Math.max(-1, Math.min(len - 1, end));
    }
    const out = [];
    if (st > 0) for (let i = start; i < end; i += st) out.push(seq[i]);
    else for (let i = start; i > end; i += st) out.push(seq[i]);
    if (isStr) return out.join("");
    if (obj instanceof PyTuple) return new PyTuple(out);
    return out;
  }

  /* ---- 方法表 ---- */
  const STR_METHODS = {
    strip: (s) => builtin("strip", (a) => {
      const chars = a.length ? a[0] : null;
      if (chars === null) return s.trim();
      const set = new Set(String(chars).split(""));
      let i = 0, j = s.length;
      while (i < j && set.has(s[i])) i++;
      while (j > i && set.has(s[j - 1])) j--;
      return s.slice(i, j);
    }),
    lstrip: (s) => builtin("lstrip", () => s.replace(/^\s+/, "")),
    rstrip: (s) => builtin("rstrip", () => s.replace(/\s+$/, "")),
    upper: (s) => builtin("upper", () => s.toUpperCase()),
    lower: (s) => builtin("lower", () => s.toLowerCase()),
    title: (s) => builtin("title", () => s.replace(/\w\S*/g, w => w[0].toUpperCase() + w.slice(1).toLowerCase())),
    split: (s) => builtin("split", (a) => {
      const sep = a.length ? a[0] : null;
      if (sep === null) return s.trim().split(/\s+/).filter(Boolean);
      return s.split(String(sep));
    }),
    rsplit: (s) => builtin("rsplit", (a) => s.split(a.length ? String(a[0]) : /\s+/)),
    join: (s, line) => builtin("join", (a) => {
      const seq = iterate(a[0], line);
      seq.forEach(x => { if (typeof x !== "string") raise("TypeError", `join 只能拼接字符串，列表里有 ${typeName(x)}。先用 str(x) 转一下。`, line); });
      return seq.join(s);
    }),
    replace: (s) => builtin("replace", (a) => {
      const [from, to, count] = a;
      if (count === undefined) return s.split(String(from)).join(String(to));
      let out = s;
      let n = nval(count);
      let idx = 0;
      const f = String(from), t = String(to);
      while (n-- > 0) {
        const at = out.indexOf(f, idx);
        if (at < 0) break;
        out = out.slice(0, at) + t + out.slice(at + f.length);
        idx = at + t.length;
      }
      return out;
    }),
    find: (s) => builtin("find", (a) => s.indexOf(String(a[0]))),
    rfind: (s) => builtin("rfind", (a) => s.lastIndexOf(String(a[0]))),
    index: (s, line) => builtin("index", (a) => {
      const i = s.indexOf(String(a[0]));
      if (i < 0) raise("ValueError", `substring not found：字符串里找不到「${a[0]}」`, line);
      return i;
    }),
    count: (s) => builtin("count", (a) => s.split(String(a[0])).length - 1),
    startswith: (s) => builtin("startswith", (a) => s.startsWith(String(a[0]))),
    endswith: (s) => builtin("endswith", (a) => s.endsWith(String(a[0]))),
    isdigit: (s) => builtin("isdigit", () => s.length > 0 && /^\d+$/.test(s)),
    isalpha: (s) => builtin("isalpha", () => s.length > 0 && /^\p{L}+$/u.test(s)),
    isspace: (s) => builtin("isspace", () => s.length > 0 && /^\s+$/.test(s)),
    capitalize: (s) => builtin("capitalize", () => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase()),
    zfill: (s) => builtin("zfill", (a) => s.padStart(Math.trunc(nval(a[0])), "0")),
    format: (s) => builtin("format", (a, kw) => {
      let i = 0;
      return s.replace(/\{(\d*)\}/g, (m, d) => {
        if (d === "") return pyStr(a[i++]);
        const idx = parseInt(d, 10);
        return pyStr(a[idx] !== undefined ? a[idx] : kw.get(d));
      });
    }),
    center: (s) => builtin("center", (a) => {
      const w = Math.trunc(nval(a[0])), fill = a[1] === undefined ? " " : String(a[1]);
      const pad = Math.max(0, w - s.length);
      return fill.repeat(Math.floor(pad / 2)) + s + fill.repeat(Math.ceil(pad / 2));
    }),
    ljust: (s) => builtin("ljust", (a) => s.padEnd(Math.trunc(nval(a[0])), a[1] === undefined ? " " : String(a[1]))),
    rjust: (s) => builtin("rjust", (a) => s.padStart(Math.trunc(nval(a[0])), a[1] === undefined ? " " : String(a[1]))),
  };

  const LIST_METHODS = {
    append: (arr) => builtin("append", (a) => { arr.push(a[0]); return null; }),
    extend: (arr, line) => builtin("extend", (a) => { arr.push(...iterate(a[0], line)); return null; }),
    insert: (arr) => builtin("insert", (a) => { arr.splice(normIndex(a[0], arr.length + 1, 0, true), 0, a[1]); return null; }),
    remove: (arr, line) => builtin("remove", (a) => {
      const i = arr.findIndex(x => deepEqual(x, a[0]));
      if (i < 0) raise("ValueError", `list.remove(x): ${pyRepr(a[0])} 不在列表里`, line);
      arr.splice(i, 1); return null;
    }),
    pop: (arr, line) => builtin("pop", (a) => {
      if (!arr.length) raise("IndexError", "从空列表里 pop() 会报错。先用 if 列表: 判断一下。", line);
      const i = a.length ? normIndex(a[0], arr.length, line) : arr.length - 1;
      return arr.splice(i, 1)[0];
    }),
    clear: (arr) => builtin("clear", () => { arr.length = 0; return null; }),
    index: (arr, line) => builtin("index", (a) => {
      const i = arr.findIndex(x => deepEqual(x, a[0]));
      if (i < 0) raise("ValueError", `${pyRepr(a[0])} 不在列表里`, line);
      return i;
    }),
    count: (arr) => builtin("count", (a) => arr.filter(x => deepEqual(x, a[0])).length),
    sort: (arr, line) => builtin("sort", (a, kw) => {
      const key = kw.get("key");
      const rev = truthy(kw.get("reverse"));
      doSort(arr, key, rev, line);
      return null;
    }),
    reverse: (arr) => builtin("reverse", () => { arr.reverse(); return null; }),
    copy: (arr) => builtin("copy", () => arr.slice()),
  };

  function doSort(arr, key, reverse, line) {
    const keyed = arr.map((v, i) => ({ v, i, k: key ? key.call([v], new Map(), line) : v }));
    keyed.sort((x, y) => {
      let r;
      if (isNum(x.k) && isNum(y.k)) r = nval(x.k) - nval(y.k);
      else r = String(pyStr(x.k)).localeCompare(String(pyStr(y.k)));
      if (r === 0) r = x.i - y.i;
      return reverse ? -r : r;
    });
    keyed.forEach((item, i) => { arr[i] = item.v; });
  }

  const DICT_METHODS = {
    get: (d) => builtin("get", (a) => (d.map.has(a[0]) ? d.map.get(a[0]) : (a.length > 1 ? a[1] : null))),
    keys: (d) => builtin("keys", () => { const arr = [...d.map.keys()]; arr.__order = arr.slice(); return arr; }),
    values: (d) => builtin("values", () => [...d.map.values()]),
    items: (d) => builtin("items", () => [...d.map.entries()].map(([k, v]) => new PyTuple([k, v]))),
    update: (d) => builtin("update", (a) => {
      const other = a[0];
      if (other instanceof PyDict) {
        for (const [k, v] of other.map) {
          if (!d.map.has(k)) (d.__order || (d.__order = [])).push(k);
          d.map.set(k, v);
        }
      }
      return null;
    }),
    pop: (d, line) => builtin("pop", (a) => {
      if (!d.map.has(a[0])) raise("KeyError", `字典里没有键 ${pyRepr(a[0])}`, line);
      const v = d.map.get(a[0]);
      d.map.delete(a[0]);
      return v;
    }),
    setdefault: (d) => builtin("setdefault", (a) => {
      if (!d.map.has(a[0])) d.map.set(a[0], a.length > 1 ? a[1] : null);
      return d.map.get(a[0]);
    }),
    copy: (d) => builtin("copy", () => {
      const nd = new PyDict();
      nd.map = new PyDictMap(d.map);
      nd.__order = (d.__order || []).slice();
      return nd;
    }),
  };

  const SET_METHODS = {
    add: (s) => builtin("add", (a) => { s.set.add(a[0]); return null; }),
    remove: (s, line) => builtin("remove", (a) => {
      if (!s.set.has(a[0])) raise("KeyError", `${pyRepr(a[0])} 不在集合里`, line);
      s.set.delete(a[0]); return null;
    }),
    discard: (s) => builtin("discard", (a) => { s.set.delete(a[0]); return null; }),
    union: (s) => builtin("union", (a) => new PySet(new Set([...s.set, ...a[0].set]))),
  };

  function getAttr(obj, name, line) {
    if (obj instanceof PyModule) {
      if (obj.members.has(name)) return obj.members.get(name);
      raise("AttributeError", `模块 ${obj.name} 里没有 ${name}`, line);
    }
    if (obj instanceof PyObj) {
      const v = obj.lookup(name);
      if (v === undefined) raise("AttributeError", `${obj.cls.name} 对象没有属性 ${name}，检查拼写，或看看 __init__ 里有没有 self.${name} = ...`, line);
      return v instanceof PyFunc ? new PyBoundMethod(v, obj) : v;
    }
    if (obj instanceof PyClass) {
      const f = obj.lookup(name);
      if (!f) raise("AttributeError", `类 ${obj.name} 里没有 ${name}`, line);
      return f;
    }
    if (typeof obj === "string") {
      const f = STR_METHODS[name];
      if (f) return f(obj, line);
      raise("AttributeError", `字符串没有 ${name} 这个方法。常用的是 strip / split / join / replace / upper / lower / find。`, line);
    }
    if (Array.isArray(obj)) {
      const f = LIST_METHODS[name];
      if (f) return f(obj, line);
      raise("AttributeError", `列表没有 ${name} 这个方法。常用的是 append / pop / remove / insert / sort / reverse / index / count。`, line);
    }
    if (obj instanceof PyDict) {
      const f = DICT_METHODS[name];
      if (f) return f(obj, line);
      raise("AttributeError", `字典没有 ${name} 这个方法。常用的是 get / keys / values / items / update / pop。`, line);
    }
    if (obj instanceof PySet) {
      const f = SET_METHODS[name];
      if (f) return f(obj, line);
      raise("AttributeError", `集合没有 ${name} 这个方法。`, line);
    }
    if (obj instanceof PyTuple) {
      if (name === "count") return builtin("count", (a) => obj.items.filter(x => deepEqual(x, a[0])).length);
      if (name === "index") return builtin("index", (a) => obj.items.findIndex(x => deepEqual(x, a[0])));
      raise("AttributeError", `元组没有 ${name} 方法`, line);
    }
    if (isNum(obj)) {
      if (name === "bit_length") return builtin("bit_length", () => Math.trunc(nval(obj)).toString(2).length);
      raise("AttributeError", `${typeName(obj)} 没有 ${name} 这个方法`, line);
    }
    raise("AttributeError", `${typeName(obj)} 没有 ${name} 这个方法`, line);
  }

  function evalFString(raw, scope, line) {
    let out = "";
    let i = 0;
    while (i < raw.length) {
      const c = raw[i];
      if (c === "{") {
        if (raw[i + 1] === "{") { out += "{"; i += 2; continue; }
        let depth = 1, j = i + 1;
        let inStr = null;
        while (j < raw.length) {
          const ch = raw[j];
          if (inStr) {
            if (ch === "\\") { j += 2; continue; }
            if (ch === inStr) inStr = null;
            j++; continue;
          }
          if (ch === '"' || ch === "'") { inStr = ch; j++; continue; }
          if (ch === "{" || ch === "(" || ch === "[") depth++;
          else if (ch === "}" || ch === ")" || ch === "]") {
            depth--;
            if (depth === 0) break;
          }
          j++;
        }
        if (depth !== 0) raise("SyntaxError", "f-string 里的花括号没有配对：{ 和 } 要成对出现。", line);
        const inner = raw.slice(i + 1, j);
        let exprSrc = inner, spec = "";
        // 找到顶层的 ':'（不算 :: 或字典里的）
        let d2 = 0, inS = null, colon = -1;
        for (let k = 0; k < inner.length; k++) {
          const ch = inner[k];
          if (inS) { if (ch === inS) inS = null; continue; }
          if (ch === '"' || ch === "'") { inS = ch; continue; }
          if ("([{".includes(ch)) d2++;
          else if (")]}".includes(ch)) d2--;
          else if (ch === ":" && d2 === 0) { colon = k; break; }
        }
        if (colon >= 0) { exprSrc = inner.slice(0, colon); spec = inner.slice(colon + 1); }
        const value = evalInline(exprSrc, scope, line);
        out += formatValue(value, spec.trim());
        i = j + 1;
        continue;
      }
      if (c === "}") {
        if (raw[i + 1] === "}") { out += "}"; i += 2; continue; }
        raise("SyntaxError", "f-string 里出现了单独的 }，如果不是要输出花括号，请检查配对。", line);
      }
      out += c;
      i++;
    }
    return out;
  }

  function evalInline(src, scope, line) {
    const toks = tokenize(src);
    const p = new Parser(toks);
    const expr = p.parseExprList();
    return evalNode(expr, scope);
  }

  function makeModule(name, scope, line) {
    const M = (members) => new PyModule(name, new Map(Object.entries(members)));
    if (name === "math") {
      return M({
        pi: new PyFloat(Math.PI),
        e: new PyFloat(Math.E),
        sqrt: builtin("sqrt", a => new PyFloat(Math.sqrt(nval(a[0])))),
        floor: builtin("floor", a => Math.floor(nval(a[0]))),
        ceil: builtin("ceil", a => Math.ceil(nval(a[0]))),
        pow: builtin("pow", a => new PyFloat(Math.pow(nval(a[0]), nval(a[1])))),
        abs: builtin("abs", a => Math.abs(nval(a[0]))),
      });
    }
    if (name === "random") {
      return M({
        randint: builtin("randint", (a) => {
          const lo = Math.trunc(nval(a[0])), hi = Math.trunc(nval(a[1]));
          return lo + Math.floor(Math.random() * (hi - lo + 1));
        }),
        choice: builtin("choice", (a, kw, ln) => {
          const seq = iterate(a[0], ln);
          return seq[Math.floor(Math.random() * seq.length)];
        }),
      });
    }
    raise("ImportError", `浏览器版解释器没有内置 ${name} 这个库。pandas / numpy / requests 这些要在本地终端 pip install 后用真实 Python 跑；这里只能验证语法和纯 Python 逻辑。`, line);
  }

  function evalNode(node, scope, self) {
    try {
      return evalNodeInner(node, scope);
    } catch (e) {
      if (e instanceof PyError && !e.line) e.line = node.line;
      throw e;
    }
  }

  function evalNodeInner(node, scope) {
    switch (node.type) {
      case "Num": return node.isFloat ? new PyFloat(node.value) : node.value;
      case "Str": return node.value;
      case "FStr": return evalFString(node.raw, scope, node.line);
      case "Const": return node.value;
      case "Name": return scope.get(node.id, node.line);
      case "List": return node.items.map(n => evalNode(n, scope));
      case "Tuple": return new PyTuple(node.items.map(n => evalNode(n, scope)));
      case "Set": {
        const s = new PySet();
        node.items.forEach(n => s.set.add(evalNode(n, scope)));
        return s;
      }
      case "Dict": {
        const d = new PyDict();
        const order = [];
        for (const { k, v } of node.pairs) {
          const key = evalNode(k, scope);
          if (!d.map.has(key)) order.push(key);
          d.map.set(key, evalNode(v, scope));
        }
        d.__order = order;
        return d;
      }
      case "Un": {
        if (node.op === "not") return !truthy(evalNode(node.operand, scope));
        const v = evalNode(node.operand, scope);
        if (!isNum(v)) raise("TypeError", `一元 ${node.op} 只能用于数字`, node.line);
        const n = nval(v);
        if (node.op === "-") return v instanceof PyFloat ? new PyFloat(-n) : -n;
        if (node.op === "+") return v;
        return ~Math.trunc(n);
      }
      case "BoolOp": {
        const l = evalNode(node.left, scope);
        if (node.op === "and") return truthy(l) ? evalNode(node.right, scope) : l;
        return truthy(l) ? l : evalNode(node.right, scope);
      }
      case "Compare": {
        let left = evalNode(node.operands[0], scope);
        for (let i = 0; i < node.ops.length; i++) {
          const right = evalNode(node.operands[i + 1], scope);
          if (!compare(node.ops[i], left, right, node.line)) return false;
          left = right;
        }
        return true;
      }
      case "Bin": return binop(node.op, evalNode(node.left, scope), evalNode(node.right, scope), node.line);
      case "IfExp":
        return truthy(evalNode(node.test, scope)) ? evalNode(node.body, scope) : evalNode(node.orelse, scope);
      case "Index": return getItem(evalNode(node.obj, scope), evalNode(node.index, scope), node.line);
      case "Slice": {
        const obj = evalNode(node.obj, scope);
        return sliceIt(obj, node.lower, node.upper, node.step, scope, node.line);
      }
      case "Attr": return getAttr(evalNode(node.obj, scope), node.name, node.line);
      case "ListComp":
      case "SetComp":
      case "GenExp": {
        const out = [];
        runComp(node.clauses, 0, scope, node.line, () => {
          out.push(evalNode(node.elt, scope));
        });
        return node.type === "SetComp" ? new PySet(new Set(out)) : out;
      }
      case "DictComp": {
        const d = new PyDict();
        const order = [];
        runComp(node.clauses, 0, scope, node.line, () => {
          const k = evalNode(node.k, scope);
          if (!d.map.has(k)) order.push(k);
          d.map.set(k, evalNode(node.v, scope));
        });
        d.__order = order;
        return d;
      }
      case "Lambda": {
        const f = new PyFunc("<lambda>", node.params, [{ type: "Return", value: node.body, line: node.line }], scope);
        return f;
      }
      case "Call": return evalCall(node, scope);
    }
    raise("SyntaxError", `还不支持这种写法（${node.type}）`, node.line);
  }

  function runComp(clauses, idx, scope, line, emit) {
    if (idx >= clauses.length) { emit(); return; }
    const c = clauses[idx];
    const seq = iterate(evalNode(c.iter, scope), line);
    for (const item of seq) {
      tick();
      assignTarget(c.target, item, scope);
      let ok = true;
      for (const cond of c.conds) {
        if (!truthy(evalNode(cond, scope))) { ok = false; break; }
      }
      if (ok) runComp(clauses, idx + 1, scope, line, emit);
    }
  }

  function evalCall(node, scope) {
    const fn = evalNode(node.func, scope);
    const args = [];
    const kwargs = new Map();
    for (const a of node.args) {
      if (a.star !== undefined) {
        const seq = iterate(evalNode(a.star, scope), node.line);
        args.push(...seq);
      } else if (a.starstar !== undefined) {
        const d = evalNode(a.starstar, scope);
        if (!(d instanceof PyDict)) raise("TypeError", "** 后面必须是字典", node.line);
        for (const [k, v] of d.map) kwargs.set(String(k), v);
      } else args.push(evalNode(a.value, scope));
    }
    for (const [k, v] of node.kwargs) kwargs.set(k, evalNode(v, scope));

    if (!isCallable(fn)) {
      const name = node.func.type === "Name" ? node.func.id : node.func.name || "这个对象";
      raise("TypeError", `${name} 不是一个函数，不能用 () 调用。是不是把变量名写错了，或者漏了 . 方法名？`, node.line);
    }
    return fn.call(args, kwargs, node.line);
  }

  /* ============================================================
     语句执行
     ============================================================ */
  function execBlock(stmts, scope) {
    for (const s of stmts) {
      tick();
      execStmt(s, scope);
    }
  }

  function execStmt(node, scope) {
    try {
      execStmtInner(node, scope);
    } catch (e) {
      if (e instanceof PyError && !e.line) e.line = node.line;
      throw e;
    }
  }

  function execStmtInner(node, scope) {
    switch (node.type) {
      case "Expr":
        evalNode(node.value, scope);
        return;
      case "Assign": {
        const v = evalNode(node.value, scope);
        for (const t of node.targets) assignTarget(t, v, scope);
        return;
      }
      case "AugAssign": {
        const cur = evalNode(node.target, scope);
        const v = binop(node.op, cur, evalNode(node.value, scope), node.line);
        assignTarget(node.target, v, scope);
        return;
      }
      case "If": {
        if (truthy(evalNode(node.test, scope))) execBlock(node.body, scope);
        else execBlock(node.orelse, scope);
        return;
      }
      case "While": {
        let guard = 0;
        let broke = false;
        while (truthy(evalNode(node.test, scope))) {
          tick();
          if (++guard > MAX_STEPS) raise("RuntimeError", "while 循环停不下来（死循环）。检查条件里用到的变量有没有在循环体内更新。", node.line);
          try { execBlock(node.body, scope); }
          catch (e) {
            if (e instanceof BreakSig) { broke = true; break; }
            if (e instanceof ContinueSig) continue;
            throw e;
          }
        }
        if (!broke) execBlock(node.orelse, scope);
        return;
      }
      case "For": {
        const seq = iterate(evalNode(node.iter, scope), node.line);
        let broke = false;
        for (const item of seq) {
          tick();
          assignTarget(node.target, item, scope);
          try { execBlock(node.body, scope); }
          catch (e) {
            if (e instanceof BreakSig) { broke = true; break; }
            if (e instanceof ContinueSig) continue;
            throw e;
          }
        }
        if (!broke) execBlock(node.orelse, scope);
        return;
      }
      case "FuncDef": {
        scope.set(node.name, new PyFunc(node.name, node.params, node.body, scope), node.line);
        return;
      }
      case "ClassDef": {
        const bodyScope = new Scope(scope);
        const methods = new Map();
        for (const s of node.body) {
          if (s.type === "FuncDef") methods.set(s.name, new PyFunc(s.name, s.params, s.body, bodyScope));
          else if (s.type === "Assign") {
            const v = evalNode(s.value, scope);
            for (const t of s.targets) if (t.type === "Name") bodyScope.declare(t.id, v);
          }
        }
        let base = null;
        if (node.base) {
          const b = evalNode(node.base, scope);
          if (b instanceof PyClass) base = b;
        }
        const cls = new PyClass(node.name, methods, base);
        cls.classAttrs = bodyScope.vars;
        scope.set(node.name, cls, node.line);
        return;
      }
      case "Return": throw new ReturnSig(node.value === null ? null : evalNode(node.value, scope));
      case "Break": throw new BreakSig();
      case "Continue": throw new ContinueSig();
      case "Global": scope.declareGlobal(node.names); return;
      case "Nonlocal": scope.declareNonlocal(node.names); return;
      case "Pass": return;
      case "Del": {
        for (const t of node.targets) {
          if (t.type === "Name") {
            let s = scope, found = false;
            while (s) { if (s.vars.has(t.id)) { s.vars.delete(t.id); found = true; break; } s = s.parent; }
            if (!found) raise("NameError", `删除失败：${t.id} 不存在`, node.line);
          }
        }
        return;
      }
      case "Import": {
        for (const { mod, asName } of node.names) {
          const top = mod.split(".")[0];
          scope.set(asName || top, makeModule(top, scope, node.line), node.line);
        }
        return;
      }
      case "FromImport": {
        const m = makeModule(node.mod, scope, node.line);
        for (const { name, asName } of node.names) {
          if (!m.members.has(name)) raise("ImportError", `${node.mod} 模块里没有 ${name}`, node.line);
          scope.set(asName || name, m.members.get(name), node.line);
        }
        return;
      }
      case "Raise": {
        if (node.exc === null) raise("RuntimeError", "raise 了一个没有说明的错误", node.line);
        const v = evalNode(node.exc, scope);
        if (typeof v === "string") raise("RuntimeError", v, node.line);
        raise(v instanceof PyObj ? v.cls.name : "RuntimeError", pyStr(v), node.line);
      }
      case "Assert": {
        if (!truthy(evalNode(node.test, scope))) {
          const msg = node.msg ? pyStr(evalNode(node.msg, scope)) : "断言失败";
          raise("AssertionError", msg, node.line);
        }
        return;
      }
      case "Try": {
        let completed = false;
        try {
          try {
            execBlock(node.body, scope);
            completed = true;
          } catch (e) {
            if (e instanceof ReturnSig || e instanceof BreakSig || e instanceof ContinueSig) throw e;
            const pyType = e instanceof PyError ? e.pyType : "Exception";
            let handled = false;
            for (const h of node.handlers) {
              if (h.type === null) { handled = true; }
              else {
                const tv = evalNode(h.type, scope);
                const tn = tv instanceof PyClass ? tv.name : (typeof tv === "string" ? tv : pyStr(tv));
                if (tn === pyType || tn === "Exception" || tn === "BaseException" || (tn === "ValueError" && pyType === "ValueError")) handled = true;
              }
              if (handled) {
                if (h.name) scope.set(h.name, e instanceof PyError ? e.message : String(e), node.line);
                execBlock(h.body, scope);
                break;
              }
            }
            if (!handled) throw e;
          }
          // else 只在 try 主体无异常时执行，且不再受这些 except 保护。
          if (completed) execBlock(node.orelse, scope);
        } finally {
          execBlock(node.finalbody, scope);
        }
        return;
      }
    }
    raise("SyntaxError", `还不支持这种语句（${node.type}）`, node.line);
  }

  /* ============================================================
     内建函数
     ============================================================ */
  function buildBuiltins(ctx) {
    const B = {};
    const def = (name, fn) => { B[name] = builtin(name, fn); };

    def("print", (args, kw) => {
      const sep = kw.has("sep") ? (kw.get("sep") === null ? " " : String(kw.get("sep"))) : " ";
      const end = kw.has("end") ? (kw.get("end") === null ? "\n" : String(kw.get("end"))) : "\n";
      ctx.push(args.map(pyStr).join(sep) + end);
      return null;
    });
    def("len", (a, k, line) => length(a[0], line));
    def("range", (a, k, line) => {
      const ints = a.map(v => {
        if (!isNum(v)) raise("TypeError", "range() 的参数必须是整数", line);
        return Math.trunc(nval(v));
      });
      let start = 0, stop = 0, step = 1;
      if (ints.length === 1) { stop = ints[0]; }
      else if (ints.length === 2) { [start, stop] = ints; }
      else if (ints.length >= 3) { [start, stop, step] = ints; }
      else raise("TypeError", "range() 至少要 1 个参数", line);
      if (step === 0) raise("ValueError", "range() 的步长不能是 0", line);
      // 先算长度再分配，避免 range(10**9) 先耗尽内存。
      const count = Math.max(0, Math.ceil((stop - start) / step));
      checkCollectionSize(count, line, "range() ");
      const out = [];
      if (step > 0) for (let i = start; i < stop; i += step) out.push(i);
      else for (let i = start; i > stop; i += step) out.push(i);
      return out;
    });
    def("int", (a, k, line) => {
      if (!a.length) return 0;
      const v = a[0];
      if (typeof v === "string") {
        const s = v.trim();
        if (!/^[+-]?\d+$/.test(s)) {
          raise("ValueError", `int() 转不了「${v}」：它不是一个纯数字。input() 拿到的是文字，要转成数字用 int()，但内容必须真的能当数字。`, line);
        }
        return parseInt(s, 10);
      }
      if (isNum(v)) return Math.trunc(nval(v));
      raise("TypeError", `int() 不能把 ${typeName(v)} 转成整数`, line);
    });
    def("float", (a, k, line) => {
      if (!a.length) return new PyFloat(0);
      const v = a[0];
      if (typeof v === "string") {
        const s = v.trim();
        if (!/^[+-]?(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?$/.test(s)) {
          raise("ValueError", `float() 转不了「${v}」：不是合法的小数`, line);
        }
        return new PyFloat(parseFloat(s));
      }
      if (isNum(v)) return new PyFloat(nval(v));
      raise("TypeError", `float() 不能把 ${typeName(v)} 转成小数`, line);
    });
    def("str", (a) => (a.length ? pyStr(a[0]) : ""));
    def("bool", (a) => truthy(a[0]));
    def("list", (a, k, line) => (a.length ? iterate(a[0], line) : []));
    def("tuple", (a, k, line) => new PyTuple(a.length ? iterate(a[0], line) : []));
    def("set", (a, k, line) => new PySet(new Set(a.length ? iterate(a[0], line) : [])));
    def("dict", (a) => {
      const d = new PyDict();
      const order = [];
      if (a[0] instanceof PyDict) {
        for (const [k, v] of a[0].map) { d.map.set(k, v); order.push(k); }
      } else if (Array.isArray(a[0])) {
        for (const pair of a[0]) {
          const it = iterate(pair, 0);
          if (!d.map.has(it[0])) order.push(it[0]);
          d.map.set(it[0], it[1]);
        }
      }
      d.__order = order;
      return d;
    });
    def("sum", (a, k, line) => {
      const seq = iterate(a[0], line);
      let total = a.length > 1 ? a[1] : 0;
      for (const x of seq) total = binop("+", total, x, line);
      return total;
    });
    def("max", (a, k, line) => pick(a, line, 1));
    def("min", (a, k, line) => pick(a, line, -1));
    function pick(a, line, dir) {
      const seq = a.length === 1 ? iterate(a[0], line) : a;
      if (!seq.length) raise("ValueError", "max()/min() 不能用在空序列上", line);
      let best = seq[0];
      for (const x of seq) {
        const r = compare(dir > 0 ? ">" : "<", x, best, line);
        if (r) best = x;
      }
      return best;
    }
    def("abs", (a, k, line) => {
      if (!isNum(a[0])) raise("TypeError", "abs() 需要数字", line);
      const v = nval(a[0]);
      return a[0] instanceof PyFloat ? new PyFloat(Math.abs(v)) : Math.abs(v);
    });
    def("round", (a, k, line) => {
      const nd = a.length > 1 ? Math.trunc(nval(a[1])) : 0;
      const v = nval(a[0]);
      const factor = Math.pow(10, nd);
      const x = v * factor;
      const fl = Math.floor(x);
      const diff = x - fl;
      // Python 用「四舍六入五成双」（银行家舍入）：2.5 -> 2，3.5 -> 4
      let r;
      if (Math.abs(diff - 0.5) < 1e-9) r = fl % 2 === 0 ? fl : fl + 1;
      else r = Math.round(x);
      const out = r / factor;
      return nd <= 0 ? out : new PyFloat(out);
    });
    def("sorted", (a, k, line) => {
      const arr = iterate(a[0], line);
      doSort(arr, k.get("key"), truthy(k.get("reverse")), line);
      return arr;
    });
    def("reversed", (a, k, line) => iterate(a[0], line).slice().reverse());
    def("enumerate", (a, k, line) => {
      const start = a.length > 1 ? Math.trunc(nval(a[1])) : 0;
      return iterate(a[0], line).map((v, i) => new PyTuple([i + start, v]));
    });
    def("zip", (a, k, line) => {
      const seqs = a.map(s => iterate(s, line));
      const n = Math.min(...seqs.map(s => s.length));
      const out = [];
      for (let i = 0; i < n; i++) out.push(new PyTuple(seqs.map(s => s[i])));
      return out;
    });
    def("type", (a) => typeLabel(a[0]));
    def("repr", (a) => pyRepr(a[0]));
    def("chr", (a) => String.fromCharCode(nval(a[0])));
    def("ord", (a) => String(a[0]).charCodeAt(0));
    def("any", (a, k, line) => iterate(a[0], line).some(truthy));
    def("all", (a, k, line) => iterate(a[0], line).every(truthy));
    def("isinstance", (a) => typeName(a[0]) === (a[1] instanceof PyClass ? a[1].name : pyStr(a[1])));
    def("input", (a, k, line) => {
      const prompt = a.length ? pyStr(a[0]) : "";
      if (ctx.inputIndex >= ctx.inputs.length) {
        raise("EOFError", `代码里用了 input()${prompt ? `（提示语：「${prompt}」）` : ""}，但练习场不知道用户会输入什么。练习时请直接写一个固定的值，比如 n = 5，或者在这道题的「模拟输入」里填好。`, line);
      }
      const val = ctx.inputs[ctx.inputIndex++];
      // 与真实 Python 在管道输入下的行为一致：只输出提示语，不回显输入值
      ctx.push(prompt);
      return String(val);
    });
    def("open", (a, k, line) => {
      raise("OSError", "浏览器里不能读写本地文件。文件操作要在真实终端里跑：把代码存成 .py，然后 python 文件名.py。", line);
    });
    return B;
  }

  /* ============================================================
     对外接口
     ============================================================ */
  const TYPE_HINTS = {
    SyntaxError: "语法错误：代码的结构不对，Python 读不懂。常见原因是少了冒号、括号没闭合、缩进不一致、引号没配对。",
    IndentationError: "缩进错误：Python 靠缩进（一般是 4 个空格）划分代码块，同一层必须对齐。",
    NameError: "名字错误：用了一个没定义过的变量或函数。检查拼写、大小写，或者是不是忘了先赋值。",
    TypeError: "类型错误：把不能一起运算的类型放在一起了。比如字符串加数字、对数字取下标。",
    ValueError: "值错误：类型对了，但内容不合法。比如 int(\"abc\")。",
    IndexError: "下标越界：取的元素位置超过了范围。记住下标从 0 开始，最后一个的下标是 len-1。",
    KeyError: "键不存在：字典里没有这个键。可以先用 in 判断，或用 d.get(键, 默认值)。",
    ZeroDivisionError: "除以零：除数不能是 0。",
    AttributeError: "属性错误：这个对象没有这个属性或方法，检查拼写。",
    ImportError: "导入错误：没有这个库，或者浏览器环境装不了。",
    RuntimeError: "运行时错误。",
    AssertionError: "断言失败：assert 后面的条件不成立。",
    MemoryError: "内存不够：创建的容器太大了。",
    OSError: "系统错误：文件之类的操作在浏览器里做不了。",
    EOFError: "缺少输入。",
  };

  function run(code, options) {
    const opts = options || {};
    STEPS = 0;
    const rawLines = [];
    CTX = {
      push(text) {
        // 模拟 Python 的换行：end="\n" 会产生新的一行
        const chunk = String(text);
        rawLines.push(chunk);
      },
      inputs: Array.isArray(opts.inputs) ? opts.inputs.slice() : [],
      inputIndex: 0,
    };

    let uses = { for: 0, while: 0, if: 0, def: 0, listcomp: 0, dictcomp: 0, lambda: 0, print: 0, input: 0, try: 0, class: 0, total: 0 };
    let error = null;
    try {
      const src = String(code == null ? "" : code);
      if (!src.trim()) raise("SyntaxError", "还没写任何代码。", 1);
      const tokens = tokenize(src);
      const parser = new Parser(tokens);
      const ast = parser.parseModule();
      uses = parser.uses;

      const root = new Scope(null);
      const builtins = buildBuiltins(CTX);
      for (const [k, v] of Object.entries(builtins)) root.declare(k, v);
      root.declare("True", true);
      root.declare("False", false);
      root.declare("None", null);
      // 异常类名（只用于 except ValueError: 这类写法）
      ["ValueError", "TypeError", "KeyError", "IndexError", "ZeroDivisionError", "Exception", "BaseException",
        "AttributeError", "NameError", "RuntimeError", "OSError", "FileNotFoundError", "ImportError",
        "AssertionError", "StopIteration"].forEach(n => {
        root.declare(n, new PyClass(n, new Map(), null));
      });

      execBlock(ast, root);
    } catch (e) {
      if (e instanceof PyError) {
        error = { type: e.pyType, message: e.message, line: e.line || 0, hint: TYPE_HINTS[e.pyType] || "" };
      } else if (e instanceof ReturnSig) {
        error = { type: "SyntaxError", message: "return 只能写在函数里面。", line: 0, hint: TYPE_HINTS.SyntaxError };
      } else if (e instanceof BreakSig || e instanceof ContinueSig) {
        error = { type: "SyntaxError", message: "break / continue 只能写在循环里面。", line: 0, hint: TYPE_HINTS.SyntaxError };
      } else {
        error = { type: "RuntimeError", message: "解释器内部出错了：" + (e && e.message ? e.message : String(e)), line: 0, hint: "" };
      }
    }

    const raw = rawLines.join("");
    const stdout = raw.replace(/\n$/, "");
    return {
      ok: !error,
      stdout,
      lines: stdout === "" ? [] : stdout.split("\n"),
      error,
      uses
    };
  }

  const api = Object.freeze({ run, PY_VERSION: "3.11（浏览器子集）" });
  if (typeof window !== "undefined") window.PyExec = api;
  if (typeof globalThis !== "undefined") globalThis.PyExec = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})();
