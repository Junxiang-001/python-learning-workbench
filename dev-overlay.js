/*
 * 开发错误浮层（dev-overlay.js）
 *
 * 目的：改代码排查不再靠猜——任何未捕获异常、Promise 未处理拒绝、
 * console.error 都会被捕获，右上角红色徽标计数，点开看完整堆栈与出处文件行号。
 *
 * 用法：
 *   - 出错自动出现徽标；点击徽标或按 Ctrl+Shift+E 打开/关闭面板
 *   - 代码里想留轨迹：__devOverlay.mark('开始构建报告')，面板「轨迹」里可见
 *   - 面板里点任意一条错误，下方显示完整堆栈
 *
 * 约束：零依赖、file:// 双击可用；不拦截错误继续上报（不替代 devtools）。
 */
(function () {
  if (typeof document === 'undefined') return; // 只在浏览器运行（Node 测试不加载本文件）

  var MAX_ENTRIES = 50;
  var entries = []; // {time, kind, message, source, lineno, colno, stack}
  var badge = null;
  var panel = null;
  var detailIndex = -1;

  function now() {
    return new Date().toTimeString().slice(0, 8);
  }

  function push(entry) {
    entries.push(entry);
    if (entries.length > MAX_ENTRIES) entries.shift();
    renderBadge();
    renderList();
    if (entry.kind === 'error') ensurePanelBuilt();
  }

  // ---------- 捕获 ----------
  window.addEventListener('error', function (e) {
    push({
      time: now(),
      kind: 'error',
      message: String(e.message || e.error),
      source: e.filename || '(页面内联)',
      lineno: e.lineno || 0,
      colno: e.colno || 0,
      stack: (e.error && e.error.stack) || ''
    });
  });

  window.addEventListener('unhandledrejection', function (e) {
    var reason = e.reason;
    push({
      time: now(),
      kind: 'error',
      message: '未处理的 Promise 拒绝: ' + (reason && reason.message ? reason.message : String(reason)),
      source: '(promise)',
      lineno: 0,
      colno: 0,
      stack: (reason && reason.stack) || ''
    });
  });

  var origError = console.error.bind(console);
  console.error = function () {
    var args = Array.prototype.slice.call(arguments);
    push({
      time: now(),
      kind: 'console',
      message: args.map(String).join(' '),
      source: '(console.error)',
      lineno: 0,
      colno: 0,
      stack: new Error().stack || ''
    });
    origError.apply(null, args);
  };

  // ---------- UI ----------
  function css() {
    return '' +
      '#devOverlayBadge{position:fixed;top:10px;right:10px;z-index:99999;min-width:22px;height:22px;' +
      'padding:0 6px;border-radius:11px;background:#d64545;color:#fff;font:700 12px/22px monospace;' +
      'text-align:center;cursor:pointer;box-shadow:0 1px 4px rgba(0,0,0,.35);display:none}' +
      '#devOverlayPanel{position:fixed;top:40px;right:10px;width:min(520px,90vw);max-height:70vh;z-index:99999;' +
      'background:#1e1e1e;color:#e8e8e8;border:1px solid #444;border-radius:8px;font:12px/1.5 monospace;' +
      'display:none;flex-direction:column;overflow:hidden}' +
      '#devOverlayPanel header{padding:8px 10px;background:#2b2b2b;display:flex;justify-content:space-between;align-items:center}' +
      '#devOverlayPanel header b{color:#ff7a7a}' +
      '#devOverlayPanel header button{background:none;border:none;color:#aaa;cursor:pointer;font-size:14px}' +
      '#devOverlayList{overflow-y:auto;padding:6px 0}' +
      '#devOverlayList .item{padding:6px 10px;cursor:pointer;border-bottom:1px solid #333;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}' +
      '#devOverlayList .item:hover{background:#333}' +
      '#devOverlayList .item .loc{color:#8ab4f8}' +
      '#devOverlayList .item .trail{color:#9ccc65}' +
      '#devOverlayDetail{border-top:1px solid #444;padding:8px 10px;max-height:30vh;overflow:auto;white-space:pre-wrap;color:#f0b080;display:none}' +
      '#devOverlayEmpty{padding:14px;text-align:center;color:#888}';
  }

  function injectStyle() {
    if (document.getElementById('devOverlayStyle')) return;
    var s = document.createElement('style');
    s.id = 'devOverlayStyle';
    s.textContent = css();
    document.head.appendChild(s);
  }

  function ensurePanelBuilt() {
    if (panel) return;
    injectStyle();

    badge = document.createElement('div');
    badge.id = 'devOverlayBadge';
    badge.title = '开发错误浮层（Ctrl+Shift+E）';
    badge.addEventListener('click', toggle);
    document.body.appendChild(badge);

    panel = document.createElement('div');
    panel.id = 'devOverlayPanel';
    panel.innerHTML =
      '<header><span><b>错误浮层</b> · ' + location.pathname.split('/').pop() + '</span>' +
      '<span><button id="devOverlayClear" title="清空">清空</button>' +
      '<button id="devOverlayClose" title="关闭">✕</button></span></header>' +
      '<div id="devOverlayList"></div>' +
      '<div id="devOverlayDetail"></div>';
    document.body.appendChild(panel);

    panel.querySelector('#devOverlayClose').addEventListener('click', close);
    panel.querySelector('#devOverlayClear').addEventListener('click', function () {
      entries = [];
      detailIndex = -1;
      renderBadge();
      renderList();
    });
    renderBadge();
  }

  function renderBadge() {
    if (!badge) return;
    var errors = entries.filter(function (e) { return e.kind === 'error'; }).length;
    badge.style.display = errors ? 'block' : 'none';
    badge.textContent = errors;
  }

  function locText(e) {
    if (e.kind === 'trail') return '';
    if (!e.lineno) return e.source;
    var file = (e.source || '').split('/').pop();
    return file + ':' + e.lineno + (e.colno ? ':' + e.colno : '');
  }

  function renderList() {
    if (!panel) return;
    var list = panel.querySelector('#devOverlayList');
    var detail = panel.querySelector('#devOverlayDetail');
    if (!entries.length) {
      list.innerHTML = '<div id="devOverlayEmpty">暂无记录——出错或 console.error 时会显示在这里</div>';
      detail.style.display = 'none';
      return;
    }
    list.innerHTML = entries.map(function (e, i) {
      var cls = e.kind === 'trail' ? 'trail' : 'loc';
      var icon = e.kind === 'trail' ? '·' : e.kind === 'console' ? '◆' : '✖';
      return '<div class="item" data-i="' + i + '">' + icon + ' [' + e.time + '] ' +
        escapeHtml(e.message.slice(0, 120)) +
        (locText(e) ? ' <span class="' + cls + '">' + escapeHtml(locText(e)) + '</span>' : '') +
        '</div>';
    }).join('');
    Array.prototype.forEach.call(list.querySelectorAll('.item'), function (el) {
      el.addEventListener('click', function () { showDetail(Number(el.dataset.i)); });
    });
    if (detailIndex >= 0) showDetail(detailIndex);
  }

  function showDetail(i) {
    var e = entries[i];
    if (!e || !panel) return;
    detailIndex = i;
    var detail = panel.querySelector('#devOverlayDetail');
    detail.style.display = 'block';
    detail.textContent =
      '时间: ' + e.time + '\n类型: ' + e.kind + '\n出处: ' + (e.source || '-') +
      (e.lineno ? '\n行号: ' + e.lineno + ':' + (e.colno || 0) : '') +
      '\n\n' + e.message + (e.stack ? '\n\n--- 堆栈 ---\n' + e.stack : '');
  }

  function escapeHtml(s) {
    return s.replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  function open() {
    ensurePanelBuilt();
    panel.style.display = 'flex';
    renderList();
  }

  function close() {
    if (panel) panel.style.display = 'none';
  }

  function toggle() {
    if (panel && panel.style.display === 'flex') close(); else open();
  }

  window.addEventListener('keydown', function (e) {
    if (e.ctrlKey && e.shiftKey && (e.key === 'E' || e.key === 'e')) toggle();
  });

  // ---------- 对外 API ----------
  window.__devOverlay = {
    mark: function (text) {
      push({ time: now(), kind: 'trail', message: String(text), source: '', lineno: 0, colno: 0, stack: '' });
    },
    open: open,
    close: close,
    entries: function () { return entries.slice(); }
  };
})();
