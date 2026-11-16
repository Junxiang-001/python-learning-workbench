/* Python 学习工作台 · 主逻辑（零依赖，数据存 localStorage） */
"use strict";

/* ================= 存储 ================= */
const STORE_KEY = "pystudy.v1";
const store = loadStore();
function loadStore() {
  try { return JSON.parse(localStorage.getItem(STORE_KEY)) || {}; }
  catch { return {}; }
}
function save() {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(store)); }
  catch { toast("保存失败：浏览器存储不可用"); }
}
store.notes ??= {};       // { chapterId: text }
store.done ??= {};        // { chapterId: true }
store.doneDates ??= {};   // { chapterId: YYYY-MM-DD }
store.noteDates ??= {};   // { chapterId: YYYY-MM-DD }
store.noteRewards ??= {}; // 已发放过笔记 XP 的章节，避免反复删除重写刷分
store.path ??= {};        // { "s0i3": true }
store.pomo ??= {};        // { "2026-11-03": {count, minutes} }
store.days ??= [];        // 学习打卡日期
store.collapsed ??= {};   // 思维导图折叠节点
store.pomoCfg ??= { work: 25, brk: 5 };
store.xp ??= 0;           // 经验值
store.achievements ??= {}; // 成就
store.welcomeSeen ??= false; // 欢迎模态框
store.shownTips ??= [];   // 已显示的提示
store.skipTips ??= false; // 跳过所有提示
store.soundEnabled ??= true; // 音效开关
let restoringBackup = false; // 导入后刷新前，禁止旧页面状态再次写回

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}
function markToday() {
  const t = todayStr();
  if (!store.days.includes(t)) {
    store.days.push(t);
    save();
    renderStreak();
    // 所有首次学习动作共用一个每日打卡入口，保证每天只发一次 XP。
    if (typeof addXP === "function") addXP(3, "每日打卡");
  }
}
function renderStreak() {
  const days = new Set(store.days);
  let streak = 0;
  const d = new Date();
  if (!days.has(todayStr())) d.setDate(d.getDate() - 1); // 今天没学则从昨天数
  for (;;) {
    const s = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
    if (days.has(s)) { streak++; d.setDate(d.getDate() - 1); } else break;
  }
  document.getElementById("streakBadge").textContent =
    streak > 0 ? `连续学习 ${streak} 天` : (store.days.length ? `累计学习 ${store.days.length} 天` : "今天开始打卡");
}

/* ================= 通用 ================= */
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
let toastTimer;
function toast(msg) {
  const t = $("#toast");
  t.textContent = msg; t.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { t.hidden = true; }, 2400);
}
function esc(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/* 极简 Markdown 渲染（标题/粗体/代码/列表/引用/表格/链接/分隔线） */
function mdRender(src) {
  const lines = src.split("\n");
  let html = [], inCode = false, codeBuf = [], listType = null, inTable = false;
  const closeList = () => { if (listType) { html.push(`</${listType}>`); listType = null; } };
  const closeTable = () => { if (inTable) { html.push("</tbody></table>"); inTable = false; } };
  const inline = (s) => esc(s)
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\[([^\]]+)\]\((https?:[^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.trimStart().startsWith("```")) {
      if (inCode) { html.push(`<pre><code>${esc(codeBuf.join("\n"))}</code></pre>`); codeBuf = []; inCode = false; }
      else { closeList(); closeTable(); inCode = true; }
      continue;
    }
    if (inCode) { codeBuf.push(line); continue; }
    if (/^\s*\|.*\|\s*$/.test(line)) {
      closeList();
      const cells = line.trim().slice(1, -1).split("|").map(c => c.trim());
      if (cells.every(c => /^:?-{2,}:?$/.test(c))) continue; // 分隔行
      if (!inTable) { html.push('<table><tbody>'); inTable = true; html.push(`<tr>${cells.map(c=>`<th>${inline(c)}</th>`).join("")}</tr>`); }
      else html.push(`<tr>${cells.map(c=>`<td>${inline(c)}</td>`).join("")}</tr>`);
      continue;
    }
    closeTable();
    const h = line.match(/^(#{1,4})\s+(.*)/);
    if (h) { closeList(); html.push(`<h${h[1].length}>${inline(h[2])}</h${h[1].length}>`); continue; }
    if (/^\s*([-*])\s+/.test(line)) {
      if (listType !== "ul") { closeList(); html.push("<ul>"); listType = "ul"; }
      html.push(`<li>${inline(line.replace(/^\s*[-*]\s+/, ""))}</li>`); continue;
    }
    if (/^\s*\d+\.\s+/.test(line)) {
      if (listType !== "ol") { closeList(); html.push("<ol>"); listType = "ol"; }
      html.push(`<li>${inline(line.replace(/^\s*\d+\.\s+/, ""))}</li>`); continue;
    }
    closeList();
    if (/^\s*>\s?/.test(line)) { html.push(`<blockquote>${inline(line.replace(/^\s*>\s?/, ""))}</blockquote>`); continue; }
    if (/^\s*(---|\*\*\*)\s*$/.test(line)) { html.push("<hr>"); continue; }
    if (line.trim() === "") continue;
    html.push(`<p>${inline(line)}</p>`);
  }
  if (inCode) html.push(`<pre><code>${esc(codeBuf.join("\n"))}</code></pre>`);
  closeList(); closeTable();
  return html.join("\n");
}

/* ================= 视图切换 ================= */
function activateView(name, updateHash = true) {
  const btn = $(`.tab[data-view="${name}"]`);
  if (!btn || !$("#view-" + name)) return;
  $$(".tab").forEach(b => {
    const active = b === btn;
    b.classList.toggle("active", active);
    b.setAttribute("aria-current", active ? "page" : "false");
    b.tabIndex = active ? 0 : -1;
  });
  $$(".view").forEach(v => v.classList.toggle("active", v.id === "view-" + name));
  if (updateHash && location.hash !== "#" + name) location.hash = name;
  if (name === "map") requestAnimationFrame(() => { if (!mapInited) initMapView(); });
  requestAnimationFrame(() => btn.scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" }));
  markToday();
}
$$(".tab").forEach(btn => btn.addEventListener("click", () => activateView(btn.dataset.view)));
window.addEventListener("hashchange", () => {
  const name = location.hash.slice(1);
  const btn = $(`.tab[data-view="${name}"]`);
  if (btn && !btn.classList.contains("active")) activateView(name, false);
});

/* ================= 思维导图 ================= */
let mapInited = false;
const NODE_H = 34, V_GAP = 8, H_GAP = 46;
let flatNodes = [], nodeSeq = 0, selectedNode = null;
let view = { x: 40, y: 40, scale: 1 };

function prepareTree(node, depth = 0, parent = null, path = []) {
  node.id = "n" + (nodeSeq++);
  node.depth = depth; node.parent = parent;
  node.path = [...path, node.n];
  flatNodes.push(node);
  (node.k || []).forEach(c => prepareTree(c, depth + 1, node, node.path));
}
prepareTree(MINDMAP);
// 首次使用默认折叠到一级（总览）；之后记住用户上次的展开状态
if (store.mapInit) {
  // 沿用已保存的折叠状态
} else {
  flatNodes.forEach(n => { if (n.depth >= 1 && n.k) store.collapsed[n.id] = true; });
  store.mapInit = true;
}

function isCollapsed(n) { return !!store.collapsed[n.id]; }
function visibleChildren(n) { return (!isCollapsed(n) && n.k) ? n.k : []; }

function measureText(text, depth) {
  const size = depth === 0 ? 17 : depth === 1 ? 14 : depth === 2 ? 13 : 12.5;
  let w = 0;
  for (const ch of text) w += /[\u2e80-\u9fff\uff00-\uffef]/.test(ch) ? size : size * 0.58;
  return Math.ceil(w) + (depth === 0 ? 44 : 26);
}

/* 布局：水平树，父节点垂直居中于子树 */
function layoutTree() {
  const positions = new Map();
  let cursorY = 0;
  function walk(n) {
    const kids = visibleChildren(n);
    const w = measureText(n.n, n.depth) + (n.k ? 26 : 0);
    const h = n.depth === 0 ? 50 : NODE_H;
    let y;
    if (kids.length === 0) { y = cursorY; cursorY += h + V_GAP; }
    else {
      const childPos = kids.map(walk);
      y = (childPos[0].y + childPos[0].h / 2 + childPos[childPos.length-1].y + childPos[childPos.length-1].h / 2) / 2 - h / 2;
    }
    const x = depthX(n.depth);
    const pos = { node: n, x, y, w, h };
    positions.set(n.id, pos);
    return pos;
  }
  const depthWidths = [];
  flatNodes.forEach(n => {
    const w = measureText(n.n, n.depth) + (n.k ? 26 : 0);
    depthWidths[n.depth] = Math.max(depthWidths[n.depth] || 0, w);
  });
  const depthXs = [0];
  for (let i = 1; i < depthWidths.length; i++) depthXs[i] = depthXs[i-1] + (depthWidths[i-1] || 0) + H_GAP;
  function depthX(d) { return depthXs[d] || 0; }
  walk(MINDMAP);
  return { positions, width: Math.max(...[...positions.values()].map(p => p.x + p.w)), height: cursorY };
}

function renderMap() {
  const { positions, width, height } = layoutTree();
  const world = $("#mapWorld");
  world.style.width = width + "px";
  world.style.height = height + "px";
  let paths = "", nodesHtml = "";
  for (const p of positions.values()) {
    const n = p.node;
    if (n.parent && positions.has(n.parent.id)) {
      const pp = positions.get(n.parent.id);
      const x1 = pp.x + pp.w, y1 = pp.y + pp.h / 2, x2 = p.x, y2 = p.y + p.h / 2;
      const mx = (x1 + x2) / 2;
      paths += `<path d="M${x1},${y1} C${mx},${y1} ${mx},${y2} ${x2},${y2}"/>`;
    }
    const kids = n.k ? n.k.length : 0;
    const toggle = kids ? `<button class="toggle" data-toggle="${n.id}" aria-label="${isCollapsed(n) ? "展开" : "收起"}${esc(n.n)}">${isCollapsed(n) ? `<span class="kid-count">${kids}</span>` : "−"}</button>` : "";
    const hit = n._hit ? " hit" : "";
    const sel = selectedNode === n ? " selected" : "";
    nodesHtml += `<div class="mnode depth-${Math.min(n.depth,3)}${hit}${sel}" data-node="${n.id}" style="left:${p.x}px;top:${p.y}px;height:${p.h}px" role="button" tabindex="0" aria-label="${esc(n.n)}">${esc(n.n)}${toggle}</div>`;
  }
  world.innerHTML = `<svg class="map-links" width="${width}" height="${height}" aria-hidden="true">${paths}</svg>${nodesHtml}`;
  applyTransform();
}
function applyTransform() {
  $("#mapWorld").style.transform = `translate(${view.x}px,${view.y}px) scale(${view.scale})`;
  $("#zoomLabel").textContent = Math.round(view.scale * 100) + "%";
}
function initMapView() {
  mapInited = true;
  renderMap();
  // 初始视图：根节点居左垂直居中，100% 缩放，向右展开阅读
  const world = $("#mapWorld");
  const h = parseFloat(world.style.height) || 1;
  const canvas = $("#mapCanvas");
  view.scale = 1;
  view.x = 40;
  view.y = Math.max(20, (canvas.clientHeight - h) / 2);
  applyTransform();
}
function fitView() {
  const canvas = $("#mapCanvas");
  const world = $("#mapWorld");
  const w = parseFloat(world.style.width) || 1, h = parseFloat(world.style.height) || 1;
  const cw = canvas.clientWidth - 40, ch = canvas.clientHeight - 40;
  view.scale = Math.min(cw / w, ch / h, 1.2);
  view.x = (canvas.clientWidth - w * view.scale) / 2;
  view.y = Math.max(20, (canvas.clientHeight - h * view.scale) / 2);
  applyTransform();
}
function centerOnNode(n) {
  const el = $(`[data-node="${n.id}"]`);
  if (!el) return;
  const canvas = $("#mapCanvas");
  const x = parseFloat(el.style.left), y = parseFloat(el.style.top);
  view.x = canvas.clientWidth / 2 - (x + el.offsetWidth / 2) * view.scale - 100;
  view.y = canvas.clientHeight / 2 - (y + 17) * view.scale;
  applyTransform();
}

/* 节点点击 / 折叠 */
$("#mapWorld").addEventListener("click", (e) => {
  const tg = e.target.closest("[data-toggle]");
  if (tg) {
    e.stopPropagation();
    const n = flatNodes.find(x => x.id === tg.dataset.toggle);
    store.collapsed[n.id] = !store.collapsed[n.id];
    save(); renderMap();
    return;
  }
  const nd = e.target.closest("[data-node]");
  if (nd) {
    selectedNode = flatNodes.find(x => x.id === nd.dataset.node);
    renderMap(); showNodePanel(selectedNode);
    markToday();
  }
});
$("#mapWorld").addEventListener("keydown", (e) => {
  if (e.key === "Enter" || e.key === " ") {
    const nd = e.target.closest("[data-node]");
    if (nd) { e.preventDefault(); nd.click(); }
  }
});
function showNodePanel(n) {
  $("#npTitle").textContent = n.n;
  let html = `<p class="np-path">${n.path.slice(0, -1).join(" › ") || "根节点"}</p>`;
  if (n.d) html += `<div class="md">${mdRender(n.d)}</div>`;
  if (n.c) html += `<pre class="md"><code>${esc(n.c)}</code></pre><button class="btn small" id="npCopy">复制代码</button>`;
  if (!n.d && !n.c) html += `<p style="color:var(--ink-3)">该节点是分类汇总，展开子节点查看具体知识点。</p>`;
  if (n.k) html += `<p style="font-size:12px;color:var(--ink-3);margin-top:12px">包含 ${n.k.length} 个子知识点</p>`;
  $("#npBody").innerHTML = html;
  $("#nodePanel").hidden = false;
  const cp = $("#npCopy");
  if (cp) cp.addEventListener("click", () => copyText(n.c));
}
$("#npClose").addEventListener("click", () => { $("#nodePanel").hidden = true; selectedNode = null; renderMap(); });

/* 搜索 */
$("#mapSearch").addEventListener("input", (e) => {
  const q = e.target.value.trim().toLowerCase();
  flatNodes.forEach(n => { n._hit = false; });
  if (!q) { $("#mapSearchCount").textContent = ""; renderMap(); return; }
  const hits = flatNodes.filter(n =>
    n.n.toLowerCase().includes(q) || (n.d || "").toLowerCase().includes(q) || (n.c || "").toLowerCase().includes(q));
  hits.forEach(n => {
    n._hit = true;
    let p = n.parent;
    while (p) { store.collapsed[p.id] = false; p = p.parent; }
  });
  $("#mapSearchCount").textContent = hits.length ? `${hits.length} 个结果` : "无结果";
  renderMap();
  if (hits.length) centerOnNode(hits[0]);
});

/* 展开/收起/缩放按钮 */
$("#expandAll").addEventListener("click", () => { flatNodes.forEach(n => { store.collapsed[n.id] = false; }); save(); renderMap(); });
$("#collapseAll").addEventListener("click", () => { flatNodes.forEach(n => { if (n.k && n.depth >= 1) store.collapsed[n.id] = true; }); save(); renderMap(); fitView(); });
$("#expandL2").addEventListener("click", () => { flatNodes.forEach(n => { if (n.k) store.collapsed[n.id] = n.depth >= 2; }); save(); renderMap(); fitView(); });
$("#zoomIn").addEventListener("click", () => zoomBy(1.2));
$("#zoomOut").addEventListener("click", () => zoomBy(1 / 1.2));
$("#zoomReset").addEventListener("click", () => { view.scale = 1; applyTransform(); });
$("#fitBtn").addEventListener("click", fitView);
function zoomBy(f, cx, cy) {
  const canvas = $("#mapCanvas");
  cx ??= canvas.clientWidth / 2; cy ??= canvas.clientHeight / 2;
  const ns = Math.min(3, Math.max(0.15, view.scale * f));
  view.x = cx - (cx - view.x) * (ns / view.scale);
  view.y = cy - (cy - view.y) * (ns / view.scale);
  view.scale = ns;
  applyTransform();
}
$("#mapCanvas").addEventListener("wheel", (e) => {
  e.preventDefault();
  const r = e.currentTarget.getBoundingClientRect();
  zoomBy(e.deltaY < 0 ? 1.12 : 1 / 1.12, e.clientX - r.left, e.clientY - r.top);
}, { passive: false });

/* 拖拽平移 */
(() => {
  const canvas = $("#mapCanvas");
  let dragging = false, sx = 0, sy = 0, ox = 0, oy = 0, moved = false;
  canvas.addEventListener("pointerdown", (e) => {
    if (e.target.closest(".mnode")) return;
    dragging = true; moved = false;
    sx = e.clientX; sy = e.clientY; ox = view.x; oy = view.y;
    canvas.classList.add("dragging");
    canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    const dx = e.clientX - sx, dy = e.clientY - sy;
    if (Math.abs(dx) + Math.abs(dy) > 3) moved = true;
    view.x = ox + dx; view.y = oy + dy;
    applyTransform();
  });
  canvas.addEventListener("pointerup", () => { dragging = false; canvas.classList.remove("dragging"); });
})();

/* ================= 章节笔记 ================= */
let curChapter = CHAPTERS[0].id;
function renderChapterNav() {
  const nav = $("#chapterNav");
  nav.innerHTML = CHAPTERS.map(ch => {
    const done = store.done[ch.id], hasNote = (store.notes[ch.id] || "").trim().length > 0;
    const dot = done ? '<span class="ch-dot done" aria-label="已学完">✓</span>' : hasNote ? '<span class="ch-dot hasnote" aria-label="有笔记">●</span>' : "";
    return `<li><button class="chapter-item${ch.id === curChapter ? " active" : ""}" data-ch="${ch.id}"><span class="ch-num">${ch.num}</span><span>${esc(ch.title)}</span>${dot}</button></li>`;
  }).join("");
  const doneCount = CHAPTERS.filter(c => store.done[c.id]).length;
  $("#chapterProgress").textContent = `${doneCount}/${CHAPTERS.length} 章`;
}
$("#chapterNav").addEventListener("click", (e) => {
  const btn = e.target.closest("[data-ch]");
  if (btn) { flushNote(); curChapter = btn.dataset.ch; loadChapter(); }
});
function loadChapter() {
  const ch = CHAPTERS.find(c => c.id === curChapter);
  $("#noteTitle").textContent = `第${ch.num}章 · ${ch.title}`;
  $("#noteTopics").textContent = ch.topics;
  $("#chapterDone").checked = !!store.done[ch.id];
  renderMemoryPack(ch.id);
  const saved = store.notes[ch.id];
  $("#noteArea").value = saved !== undefined ? saved : ch.template;
  $("#noteArea").dataset.dirty = "";
  updateWordCount();
  if (!$("#notePreview").hidden) $("#notePreview").innerHTML = `<div class="md">${mdRender($("#noteArea").value)}</div>`;
  renderChapterNav();
  $("#saveStatus").textContent = saved !== undefined ? "已加载保存的笔记" : "已载入章节模板，直接填写";
  $("#saveStatus").classList.remove("saved");
}
let noteTimer;
$("#noteArea").addEventListener("input", () => {
  $("#noteArea").dataset.dirty = "1";
  $("#saveStatus").textContent = "编辑中…";
  $("#saveStatus").classList.remove("saved");
  clearTimeout(noteTimer);
  noteTimer = setTimeout(flushNote, 700);
  updateWordCount();
});
function flushNote() {
  if (restoringBackup || $("#noteArea").dataset.dirty !== "1") return;
  store.notes[curChapter] = $("#noteArea").value;
  if (store.notes[curChapter].trim()) store.noteDates[curChapter] = todayStr();
  else delete store.noteDates[curChapter];
  const earnedReward = store.notes[curChapter].trim().length >= 80 && !store.noteRewards[curChapter];
  if (earnedReward) store.noteRewards[curChapter] = true;
  $("#noteArea").dataset.dirty = "";
  save(); markToday();
  if (earnedReward) addXP(10, "完成一篇 80 字以上的笔记");
  else checkAchievements();
  if (typeof updateDailyGoalsDisplay === "function") updateDailyGoalsDisplay();
  if (typeof updateDashboard === "function") updateDashboard();
  const t = new Date().toTimeString().slice(0, 8);
  $("#saveStatus").textContent = `已自动保存 ${t}`;
  $("#saveStatus").classList.add("saved");
  renderChapterNav();
}
window.addEventListener("beforeunload", flushNote);
function updateWordCount() {
  const v = $("#noteArea").value;
  const words = v.trim() ? v.trim().split(/\s+/).length : 0;
  $("#wordCount").textContent = `${v.length} 字符 · ${v.split("\n").length} 行 · ${words} 词`;
}
$("#chapterDone").addEventListener("change", (e) => {
  const firstCompletion = e.target.checked && !store.done[curChapter];
  store.done[curChapter] = e.target.checked;
  if (e.target.checked) store.doneDates[curChapter] = todayStr();
  else {
    delete store.done[curChapter];
    delete store.doneDates[curChapter];
  }
  save(); renderChapterNav(); markToday();
  if (firstCompletion) addXP(20, "完成一章学习");
  else {
    checkAchievements();
    if (!e.target.checked) toast("已取消完成标记");
  }
  if (typeof updateDailyGoalsDisplay === "function") updateDailyGoalsDisplay();
  if (typeof updateDashboard === "function") updateDashboard();
});
/* 工具栏 */
$$(".note-toolbar [data-md]").forEach(b => b.addEventListener("click", () => {
  const ta = $("#noteArea"), m = b.dataset.md;
  const { selectionStart: s, selectionEnd: e, value: v } = ta;
  const sel = v.slice(s, e) || "文字";
  ta.value = v.slice(0, s) + m + sel + m + v.slice(e);
  ta.focus(); ta.setSelectionRange(s + m.length, s + m.length + sel.length);
  ta.dispatchEvent(new Event("input"));
}));
$$(".note-toolbar [data-line]").forEach(b => b.addEventListener("click", () => {
  const ta = $("#noteArea"), p = b.dataset.line;
  const s = ta.selectionStart, v = ta.value;
  const ls = v.lastIndexOf("\n", s - 1) + 1;
  ta.value = v.slice(0, ls) + p + v.slice(ls);
  ta.focus(); ta.setSelectionRange(s + p.length, s + p.length);
  ta.dispatchEvent(new Event("input"));
}));
$$(".note-toolbar [data-block]").forEach(b => b.addEventListener("click", () => {
  const ta = $("#noteArea"), block = b.dataset.block;
  const s = ta.selectionStart, v = ta.value;
  ta.value = v.slice(0, s) + "\n" + block + "\n" + v.slice(s);
  ta.focus(); ta.setSelectionRange(s + 5, s + 5);
  ta.dispatchEvent(new Event("input"));
}));
$("#togglePreview").addEventListener("click", () => {
  flushNote();
  const prev = $("#notePreview"), ta = $("#noteArea");
  const show = prev.hidden;
  prev.hidden = !show; ta.hidden = show;
  $("#togglePreview").textContent = show ? "编辑" : "预览";
  if (show) prev.innerHTML = `<div class="md">${mdRender(ta.value)}</div>`;
});
$("#downloadNote").addEventListener("click", () => {
  flushNote();
  const ch = CHAPTERS.find(c => c.id === curChapter);
  download(`第${ch.num}章-${ch.title}.md`, $("#noteArea").value, "text/markdown");
});

/* 记忆包：口诀 / 故事 / 来历 / 避坑，四张卡片随机顺序抽认 */
const MP_META = [
  { key: "mnemonic", cls: "mnemonic", badge: "🧠", title: "一句话记住" },
  { key: "story",    cls: "story",    badge: "📖", title: "冷知识小故事" },
  { key: "origin",   cls: "origin",   badge: "🏺", title: "它从哪来" },
  { key: "tip",      cls: "tip",      badge: "⚡", title: "老鸟避坑指南" },
];
store.mpOpen ??= {};   // 每章记忆包展开状态
store.mpSeen ??= {};   // 看过的章节
function renderMemoryPack(chId) {
  const pack = (typeof MEMORY_PACKS !== "undefined") ? MEMORY_PACKS[chId] : null;
  const box = $("#memoryPack");
  if (!pack) { box.innerHTML = ""; return; }
  const open = !!store.mpOpen[chId];
  const seen = store.mpSeen[chId] ? "✓ 已读" : "NEW 未读";
  let html = `<button class="mp-toggle" id="mpToggle" aria-expanded="${open}">
    <span>🎁 本章记忆包 · 口诀 / 故事 / 来历 / 避坑</span>
    <span style="font-size:11px;font-weight:400">${seen}</span>
    <span class="mp-caret">${open ? "▲ 收起" : "▼ 拆开看看"}</span>
  </button>`;
  if (open) {
    html += `<div class="mp-cards">` + MP_META.map(m => `
      <div class="mp-card ${m.cls}">
        <h4><span class="mp-badge" aria-hidden="true">${m.badge}</span>${m.title}</h4>
        <p>${esc(pack[m.key])}</p>
      </div>`).join("") + `</div>`;
  }
  box.innerHTML = html;
  $("#mpToggle").addEventListener("click", () => {
    store.mpOpen[chId] = !store.mpOpen[chId];
    const firstOpen = store.mpOpen[chId] && !store.mpSeen[chId];
    if (store.mpOpen[chId]) { store.mpSeen[chId] = true; markToday(); }
    save();
    if (firstOpen) addXP(5, "首次展开本章记忆包");
    renderMemoryPack(chId);
  });
}

/* ================= 学习路线 ================= */
function renderPath() {
  $("#pathStages").innerHTML = PATH_STAGES.map((st, si) => `
    <div class="stage">
      <div class="stage-head"><h3>${esc(st.title)}</h3><span class="stage-time">${esc(st.time)}</span></div>
      <p class="stage-goal">${esc(st.goal)}</p>
      <ul>${st.items.map((it, ii) => {
        const key = `s${si}i${ii}`, ck = !!store.path[key];
        return `<li><label class="check-item${ck ? " checked" : ""}"><input type="checkbox" data-path="${key}"${ck ? " checked" : ""}><span>${esc(it.t)}${it.n ? `<span class="item-note">${esc(it.n)}</span>` : ""}</span></label></li>`;
      }).join("")}</ul>
    </div>`).join("");
  updatePathBar();
}
$("#pathStages").addEventListener("change", (e) => {
  const cb = e.target.closest("[data-path]");
  if (!cb) return;
  const firstCompletion = cb.checked && !store.path[cb.dataset.path];
  store.path[cb.dataset.path] = cb.checked;
  if (!cb.checked) delete store.path[cb.dataset.path];
  save(); markToday();
  if (firstCompletion) addXP(5, "完成路线任务");
  cb.closest(".check-item").classList.toggle("checked", cb.checked);
  updatePathBar();
  if (typeof updateDashboard === "function") updateDashboard();
});
function updatePathBar() {
  const total = PATH_STAGES.reduce((n, s) => n + s.items.length, 0);
  const done = Object.keys(store.path).length;
  const pct = Math.round(done / total * 100);
  $("#pathBar").style.width = pct + "%";
  $("#pathPct").textContent = `${pct}%（${done}/${total}）`;
}

/* ================= 速查表 ================= */
function renderCheats(filter = "") {
  const q = filter.trim().toLowerCase();
  const list = CHEATS.filter(c => !q || c.title.toLowerCase().includes(q) || c.tags.includes(q) || c.code.toLowerCase().includes(q));
  $("#cheatList").innerHTML = list.length ? list.map((c, i) => `
    <div class="cheat-card">
      <button class="cheat-head" data-cheat="${i}" aria-expanded="${q ? "true" : "false"}">
        <h3>${esc(c.title)}</h3><span class="cheat-caret">${q ? "▲" : "▼"}</span>
      </button>
      <div class="cheat-body" ${q ? "" : "hidden"}>
        <button class="btn small cheat-copy" data-copy="${i}">复制</button>
        <pre>${esc(c.code)}</pre>
        <p class="cheat-tip">${esc(c.tip)}</p>
      </div>
    </div>`).join("") : `<p style="color:var(--ink-3)">没有匹配的条目</p>`;
  $("#cheatList")._list = list;
}
$("#cheatList").addEventListener("click", (e) => {
  const cp = e.target.closest("[data-copy]");
  if (cp) { copyText($("#cheatList")._list[+cp.dataset.copy].code); return; }
  const hd = e.target.closest("[data-cheat]");
  if (hd) {
    const body = hd.nextElementSibling;
    body.hidden = !body.hidden;
    hd.setAttribute("aria-expanded", String(!body.hidden));
    $(".cheat-caret", hd).textContent = body.hidden ? "▼" : "▲";
  }
});
$("#cheatSearch").addEventListener("input", (e) => renderCheats(e.target.value));

/* ================= 番茄钟 ================= */
let pomo = { mode: "work", left: store.pomoCfg.work * 60, running: false, timer: null };
function pomoDisplay() {
  const m = Math.floor(pomo.left / 60), s = pomo.left % 60;
  const text = `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  $("#pomoTime").textContent = text;
  document.title = pomo.running ? `${text} · ${pomo.mode === "work" ? "专注中" : "休息中"} — Python 学习工作台` : "Python 学习工作台";
  $("#pomoMode").textContent = pomo.mode === "work" ? "专注" : "休息";
  $("#pomoMode").classList.toggle("break", pomo.mode === "break");
  $("#pomoStart").textContent = pomo.running ? "暂停" : "开始";
  $("#pomoSkip").style.visibility = pomo.mode === "break" ? "visible" : "hidden";
}
function pomoTick() {
  pomo.left--;
  if (pomo.left <= 0) {
    clearInterval(pomo.timer); pomo.running = false;
    beep();
    if (pomo.mode === "work") {
      const t = todayStr();
      store.pomo[t] ??= { count: 0, minutes: 0 };
      store.pomo[t].count++;
      store.pomo[t].minutes += store.pomoCfg.work;
      save(); markToday(); renderPomoStats();
      addXP(8, `番茄完成 · 休息 ${store.pomoCfg.brk} 分钟`);
      if (typeof updateDailyGoalsDisplay === "function") updateDailyGoalsDisplay();
      if (typeof updateDashboard === "function") updateDashboard();
      pomo.mode = "break"; pomo.left = store.pomoCfg.brk * 60;
    } else {
      toast("休息结束，开始下一个番茄！");
      pomo.mode = "work"; pomo.left = store.pomoCfg.work * 60;
    }
  }
  pomoDisplay();
}
$("#pomoStart").addEventListener("click", () => {
  if (pomo.running) { clearInterval(pomo.timer); pomo.running = false; }
  else { pomo.running = true; pomo.timer = setInterval(pomoTick, 1000); markToday(); }
  pomoDisplay();
});
$("#pomoReset").addEventListener("click", () => {
  clearInterval(pomo.timer); pomo.running = false;
  pomo.mode = "work"; pomo.left = store.pomoCfg.work * 60;
  pomoDisplay();
});
$("#pomoSkip").addEventListener("click", () => {
  clearInterval(pomo.timer); pomo.running = false;
  pomo.mode = "work"; pomo.left = store.pomoCfg.work * 60;
  pomoDisplay();
});
$("#pomoWorkMin").value = store.pomoCfg.work;
$("#pomoBreakMin").value = store.pomoCfg.brk;
$("#pomoWorkMin").addEventListener("change", (e) => {
  store.pomoCfg.work = Math.min(90, Math.max(5, +e.target.value || 25));
  e.target.value = store.pomoCfg.work; save();
  if (!pomo.running && pomo.mode === "work") { pomo.left = store.pomoCfg.work * 60; pomoDisplay(); }
});
$("#pomoBreakMin").addEventListener("change", (e) => {
  store.pomoCfg.brk = Math.min(30, Math.max(1, +e.target.value || 5));
  e.target.value = store.pomoCfg.brk; save();
  if (!pomo.running && pomo.mode === "break") { pomo.left = store.pomoCfg.brk * 60; pomoDisplay(); }
});
function renderPomoStats() {
  const t = store.pomo[todayStr()] || { count: 0, minutes: 0 };
  $("#pomoCount").textContent = t.count;
  $("#pomoTotal").textContent = Object.values(store.pomo).reduce((n, d) => n + d.minutes, 0);
}
function beep() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    [0, .25, .5].forEach((d, i) => {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination);
      o.frequency.value = 660 + i * 110;
      g.gain.setValueAtTime(.12, ctx.currentTime + d);
      g.gain.exponentialRampToValueAtTime(.001, ctx.currentTime + d + .22);
      o.start(ctx.currentTime + d); o.stop(ctx.currentTime + d + .24);
    });
  } catch { /* 无音频环境则静默 */ }
}

/* ================= 环境指南 / 资源 ================= */
function renderEnv() {
  $("#envList").innerHTML = ENV_GUIDE.map(g => `
    <div class="env-card">
      <h3>${esc(g.title)} <span class="env-tag ${g.tag}">${esc(g.tagText)}</span></h3>
      <p>${esc(g.body)}</p>
      ${g.code ? `<pre>${esc(g.code)}</pre>` : ""}
    </div>`).join("");
}
function renderLinks() {
  $("#linkGroups").innerHTML = LINK_GROUPS.map(g => `
    <div class="link-group">
      <h3>${esc(g.title)}</h3>
      ${g.links.map(l => `<div class="link-row"><a href="${esc(l.url)}" target="_blank" rel="noopener">${esc(l.name)}</a><span>${esc(l.desc)}</span></div>`).join("")}
    </div>`).join("");
}

/* ================= 备份导入导出 ================= */
function download(name, content, mime) {
  const blob = new Blob([content], { type: mime + ";charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  URL.revokeObjectURL(a.href);
}
function copyText(text) {
  navigator.clipboard?.writeText(text).then(() => toast("已复制到剪贴板"))
    .catch(() => {
      const ta = document.createElement("textarea");
      ta.value = text; document.body.appendChild(ta); ta.select();
      document.execCommand("copy"); ta.remove(); toast("已复制到剪贴板");
    });
}
$("#exportBtn").addEventListener("click", () => {
  try {
    flushNote();
    const backup = PythonBackup.createBackup(localStorage, store);
    download(`python学习备份-${todayStr()}-v${PythonBackup.VERSION}.json`, JSON.stringify(backup, null, 2), "application/json");
    toast("完整备份已下载：笔记、练习、复习、方法与主题");
  } catch (error) {
    console.error(error);
    toast("导出失败：现有数据异常，请检查浏览器存储");
  }
});
$("#importBtn").addEventListener("click", () => $("#importFile").click());
$("#importFile").addEventListener("change", (e) => {
  const input = e.target;
  const file = input.files[0];
  if (!file) return;
  if (file.size > 5 * 1024 * 1024) {
    toast("导入失败：备份文件不能超过 5 MB");
    input.value = "";
    return;
  }
  const reader = new FileReader();
  reader.onerror = () => toast("导入失败：无法读取文件");
  reader.onload = () => {
    try {
      // 先完整读取并校验，确认前绝不写入任何存储。
      const backup = PythonBackup.parseBackup(String(reader.result));
      if (!confirm("导入将覆盖当前笔记、练习、复习和方法进度，确定继续吗？")) return;
      restoringBackup = true;
      clearTimeout(noteTimer);
      clearInterval(pomo.timer);
      pomo.running = false;
      PythonBackup.restore(localStorage, backup);
      toast("导入成功，正在重新载入…");
      setTimeout(() => location.reload(), 150);
    } catch (error) {
      restoringBackup = false;
      console.error(error);
      toast("导入失败：" + (error.message || "备份格式不符") + "；原有数据未改动");
    }
  };
  reader.readAsText(file, "utf-8");
  input.value = "";
});

/* ================= 启动 ================= */
renderChapterNav();
loadChapter();
renderPath();
renderCheats();
renderEnv();
renderLinks();
renderPomoStats();
renderStreak();
pomoDisplay();
const hashView = location.hash.slice(1);
if (hashView && $(`#view-${hashView}`)) {
  $(`.tab[data-view="${hashView}"]`)?.click();
} else {
  initMapView();
}

/* ================= 欢迎模态框逻辑 ================= */
function initWelcome() {
  const modal = document.getElementById("welcomeModal");
  const startBtn = document.getElementById("welcomeStart");
  const skipBtn = document.getElementById("welcomeSkip");
  
  // 检查是否是首次访问
  if (!store.welcomeSeen) {
    modal.hidden = false;
  }
  
  function closeWelcome() {
    modal.style.animation = "fadeOut 0.3s ease";
    setTimeout(() => {
      modal.hidden = true;
      store.welcomeSeen = true;
      save();
    }, 300);
  }
  
  startBtn.addEventListener("click", () => {
    closeWelcome();
    // 展开思维导图第一级
    setTimeout(() => {
      document.getElementById("expandL2")?.click();
    }, 400);
  });
  
  skipBtn.addEventListener("click", closeWelcome);
}

/* ================= 等级系统增强 ================= */
const LEVELS = [
  { name: "编程萌新", xp: 0, emoji: "🥚" },
  { name: "语法学徒", xp: 30, emoji: "🐣" },
  { name: "逻辑新手", xp: 80, emoji: "🐥" },
  { name: "数据学徒", xp: 150, emoji: "🦆" },
  { name: "函数大师", xp: 250, emoji: "🦅" },
  { name: "面向对象探索者", xp: 400, emoji: "🚀" },
  { name: "Python 开发者", xp: 600, emoji: "⭐" },
  { name: "代码艺术家", xp: 850, emoji: "🎨" },
  { name: "全栈工程师", xp: 1200, emoji: "🔥" },
  { name: "Python 大师", xp: 1600, emoji: "👑" }
];

function getCurrentLevel(xp) {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (xp >= LEVELS[i].xp) return LEVELS[i];
  }
  return LEVELS[0];
}

function getNextLevel(xp) {
  for (let i = 0; i < LEVELS.length; i++) {
    if (xp < LEVELS[i].xp) return LEVELS[i];
  }
  return null;
}

function updateLevelBadge() {
  const badge = document.getElementById("levelBadge");
  if (!badge) return;
  
  const xp = store.xp || 0;
  const currentLevel = getCurrentLevel(xp);
  const nextLevel = getNextLevel(xp);
  
  badge.querySelector(".level-title").textContent = currentLevel.name;
  badge.querySelector(".level-xp").textContent = `${xp} XP`;
  
  if (nextLevel) {
    const remaining = nextLevel.xp - xp;
    badge.setAttribute("aria-label", `${currentLevel.emoji} ${currentLevel.name} · 距「${nextLevel.name}」还差 ${remaining} XP`);
  } else {
    badge.setAttribute("aria-label", `${currentLevel.emoji} 满级！你已经是 Python 大师了！`);
  }
  
  // 点击徽章跳转到成就墙
  badge.onclick = () => {
    document.querySelector('[data-view="achieve"]')?.click();
  };
}

function addXP(amount, reason) {
  const oldXP = store.xp || 0;
  const newXP = oldXP + amount;
  store.xp = newXP;
  save();
  
  const oldLevel = getCurrentLevel(oldXP);
  const newLevel = getCurrentLevel(newXP);
  
  toast(`+${amount} XP${reason ? ' · ' + reason : ''}`);
  updateLevelBadge();
  if (typeof updateDashboard === "function") updateDashboard();
  
  // 升级了！
  if (oldLevel.name !== newLevel.name) {
    setTimeout(() => {
      showAchievement(newLevel.emoji, `升级了！`, `你现在是「${newLevel.name}」`);
      launchConfetti();
    }, 500);
  }
  
  checkAchievements();
}

/* ================= 今日冷知识 ================= */
const DAILY_FACTS = [
  "Python 的名字来自喜剧团「蒙提·派森」，不是蟒蛇。Guido 当年正在追他们的剧。",
  "Python 之禅（import this）有 19 条格言，但第 20 条永远空着，象征「完美是不存在的」。",
  "Instagram、Spotify、Netflix 都大量使用 Python。你学的不是玩具语言。",
  "Python 的 == 比较值，is 比较身份。None 只有一个实例，所以用 is None。",
  "列表推导式 [x*2 for x in range(10)] 比循环快 2-3 倍，因为在 C 层优化过。",
  "f-string 是 Python 3.6 才加入的。之前大家用 % 和 .format()，现在都过时了。",
  "Python 的 GIL（全局解释器锁）让多线程并行受限，但多进程和异步 I/O 能绕过。",
  "Python 2 已经在 2020 年停止维护。如果还有人让你学 Python 2，赶紧跑。",
  "Python 的缩进不是为了好看，是语法的一部分。混用 Tab 和空格会报错。",
  "dict 在 Python 3.7+ 保证插入顺序，3.6 之前是乱的。老代码可能依赖这个差异。"
];

function initDailyFact() {
  const factText = document.querySelector(".fact-text");
  const nextBtn = document.getElementById("factNext");
  
  if (!factText || !nextBtn) return;
  
  let currentIndex = Math.floor(Math.random() * DAILY_FACTS.length);
  
  nextBtn.addEventListener("click", () => {
    currentIndex = (currentIndex + 1) % DAILY_FACTS.length;
    factText.textContent = DAILY_FACTS[currentIndex];
    factText.style.animation = "none";
    setTimeout(() => {
      factText.style.animation = "fadeIn 0.3s ease";
    }, 10);
  });
}

/* ================= 成就提示动画 ================= */
function showAchievement(icon, title, desc) {
  const toast = document.getElementById("achievementToast");
  if (!toast) return;
  
  toast.querySelector(".achievement-icon").textContent = icon;
  toast.querySelector(".achievement-title").textContent = title;
  toast.querySelector(".achievement-desc").textContent = desc;
  
  toast.hidden = false;
  toast.style.animation = "slideInRight 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55)";
  
  setTimeout(() => {
    toast.style.animation = "fadeOut 0.3s ease";
    setTimeout(() => { toast.hidden = true; }, 300);
  }, 4000);
}

/* ================= 彩带效果 ================= */
function launchConfetti() {
  const canvas = document.getElementById("confetti");
  if (!canvas) return;
  
  const ctx = canvas.getContext("2d");
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  
  const particles = [];
  const colors = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];
  
  for (let i = 0; i < 150; i++) {
    particles.push({
      x: Math.random() * canvas.width,
      y: -20,
      vx: (Math.random() - 0.5) * 4,
      vy: Math.random() * 3 + 2,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: Math.random() * 6 + 3,
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 10
    });
  }
  
  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let stillVisible = false;
    
    particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.1; // 重力
      p.rotation += p.rotationSpeed;
      
      if (p.y < canvas.height + 20) {
        stillVisible = true;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation * Math.PI / 180);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        ctx.restore();
      }
    });
    
    if (stillVisible) {
      requestAnimationFrame(animate);
    }
  }
  
  animate();
}

/* ================= 成就检查系统 ================= */
const ACHIEVEMENTS = {
  first_step: { id: "first_step", icon: "👣", title: "第一步", desc: "完成第一个学习章节", check: () => Object.keys(store.done).length > 0 },
  first_note: { id: "first_note", icon: "📝", title: "初试笔端", desc: "写下第一篇笔记", check: () => Object.values(store.notes).some(n => n && n.trim().length > 0) },
  streak_3: { id: "streak_3", icon: "🔥", title: "三天不缀", desc: "连续学习 3 天", check: () => calculateStreak() >= 3 },
  five_done: { id: "five_done", icon: "📚", title: "小有积累", desc: "完成 5 个学习章节", check: () => Object.keys(store.done).length >= 5 },
  xp_100: { id: "xp_100", icon: "⭐", title: "百点突破", desc: "获得 100 XP", check: () => (store.xp || 0) >= 100 },
  pomo_10: { id: "pomo_10", icon: "⏱️", title: "专注战士", desc: "完成 10 个番茄钟", check: () => Object.values(store.pomo).reduce((sum, day) => sum + (day.count || 0), 0) >= 10 },
  ten_exercises: {
    id: "ten_exercises", icon: "💪", title: "勤加练习", desc: "通过 10 道编程练习",
    check: () => {
      try { return Object.values(JSON.parse(localStorage.getItem("pystudy.exercises.v2")) || {}).filter(p => p && p.passed).length >= 10; }
      catch { return false; }
    }
  },
  all_reviews: {
    id: "all_reviews", icon: "🧠", title: "记忆大师", desc: "完成 30 次记忆卡复习",
    check: () => {
      try { return Object.keys((JSON.parse(localStorage.getItem("pystudy.review.v1")) || {}).states || {}).length >= 30; }
      catch { return false; }
    }
  }
};

function checkAchievements() {
  store.achievements ??= {};
  let changed = false;
  Object.values(ACHIEVEMENTS).forEach(ach => {
    if (!store.achievements[ach.id] && ach.check()) {
      store.achievements[ach.id] = true;
      changed = true;
      setTimeout(() => {
        if (typeof showAchievementCelebration === "function") showAchievementCelebration(ach);
        else showAchievement(ach.icon, `成就解锁：${ach.title}`, ach.desc);
        launchConfetti();
      }, 500);
    }
  });
  if (changed) {
    save();
    if (typeof updateDashboard === "function") updateDashboard();
  }
  if (typeof renderAchievements === "function") renderAchievements();
}

/* ================= 初始化所有新功能 ================= */
document.addEventListener("DOMContentLoaded", () => {
  initDashboard();
  initWelcome();
  initDailyFact();
  updateLevelBadge();
  checkAchievements();
});

// 添加 fadeOut 动画到 CSS（如果需要）
if (!document.querySelector('style#dynamic-animations')) {
  const style = document.createElement('style');
  style.id = 'dynamic-animations';
  style.textContent = `
    @keyframes fadeOut {
      from { opacity: 1; }
      to { opacity: 0; }
    }
  `;
  document.head.appendChild(style);
}

/* 奖励与统计均绑定在上方真实事件处理器中，不再保留未调用的第二套逻辑。 */

/* ================= 每日打卡提示 ================= */
function checkDailyCheckIn() {
  markToday();
}

/* ================= 初始化增强功能 ================= */
document.addEventListener("DOMContentLoaded", () => {
  updateWordCount();
  updatePathBar();
  checkDailyCheckIn();
  // 练习与复习使用独立存储，模块加载后再检查一次相关成就。
  setTimeout(checkAchievements, 1000);
});


/* ================= 快捷指引系统 ================= */
const QUICK_TIPS = [
  {
    id: "first_visit",
    target: "#mapCanvas",
    title: "从思维导图开始",
    content: "点击任意节点查看详细讲解，点击 +/- 展开或收起子节点",
    position: "center",
    show: () => !store.welcomeSeen
  },
  {
    id: "take_notes",
    target: '[data-view="notes"]',
    title: "记笔记很重要",
    content: "每学完一章记下笔记，写满80字可以获得10 XP",
    position: "bottom",
    show: () => store.welcomeSeen && Object.keys(store.notes || {}).length === 0
  },
  {
    id: "use_pomodoro",
    target: '[data-view="pomodoro"]',
    title: "试试番茄钟",
    content: "25分钟专注学习，5分钟休息，科学高效",
    position: "bottom",
    show: () => {
      const totalPomos = Object.values(store.pomo || {}).reduce((sum, day) => sum + (day.count || 0), 0);
      return totalPomos === 0 && store.days.length >= 1;
    }
  },
  {
    id: "check_achievements",
    target: '[data-view="achieve"]',
    title: "查看成就墙",
    content: "看看你已经解锁了哪些成就，还有哪些待完成",
    position: "bottom",
    show: () => (store.xp || 0) >= 30
  }
];

let currentTipIndex = 0;
let tipTimeout = null;

function showNextTip() {
  clearTimeout(tipTimeout);
  
  // 找到下一个应该显示的提示
  const tip = QUICK_TIPS.find((t, i) => i >= currentTipIndex && t.show());
  
  if (!tip) return;
  
  const target = document.querySelector(tip.target);
  if (!target) return;
  
  // 创建提示框
  const tipEl = document.createElement("div");
  tipEl.className = "quick-tip";
  tipEl.innerHTML = `
    <div class="quick-tip-content">
      <h4>${tip.title}</h4>
      <p>${tip.content}</p>
      <div class="quick-tip-actions">
        <button class="btn small accent" onclick="dismissTip('${tip.id}')">知道了</button>
        <button class="btn small ghost" onclick="skipAllTips()">不再提示</button>
      </div>
    </div>
    <div class="quick-tip-arrow"></div>
  `;
  
  document.body.appendChild(tipEl);
  
  // 定位提示框
  const rect = target.getBoundingClientRect();
  if (tip.position === "bottom") {
    tipEl.style.top = (rect.bottom + 10) + "px";
    tipEl.style.left = (rect.left + rect.width / 2) + "px";
    tipEl.style.transform = "translateX(-50%)";
  } else if (tip.position === "center") {
    tipEl.style.top = "50%";
    tipEl.style.left = "50%";
    tipEl.style.transform = "translate(-50%, -50%)";
  }
  
  // 添加动画
  setTimeout(() => {
    tipEl.classList.add("show");
  }, 10);
  
  // 记录已显示
  if (!store.shownTips) store.shownTips = [];
  store.shownTips.push(tip.id);
  save();
  
  currentTipIndex = QUICK_TIPS.indexOf(tip) + 1;
}

function dismissTip(tipId) {
  document.querySelectorAll(".quick-tip").forEach(el => el.remove());
}

function skipAllTips() {
  const tipEl = document.querySelector(".quick-tip");
  if (tipEl) {
    tipEl.classList.remove("show");
    setTimeout(() => tipEl.remove(), 300);
  }
  
  store.skipTips = true;
  save();
}

/* ================= 学习建议系统 ================= */
function getPersonalizedSuggestion() {
  const xp = store.xp || 0;
  const doneCount = Object.keys(store.done || {}).length;
  const noteCount = Object.keys(store.notes || {}).length;
  const pomoCount = Object.values(store.pomo || {}).reduce((sum, day) => sum + (day.count || 0), 0);
  const streak = calculateStreak();
  
  if (doneCount === 0) {
    return {
      icon: "▶",
      title: "做第一道练习",
      desc: "先用 5 分钟写出一行能运行的 Python",
      action: () => document.querySelector('[data-view="practice"]')?.click()
    };
  }
  
  if (noteCount < doneCount) {
    return {
      icon: "📝",
      title: "补充笔记",
      desc: "为已学章节写下笔记，巩固记忆",
      action: () => document.querySelector('[data-view="notes"]')?.click()
    };
  }
  
  if (pomoCount === 0) {
    return {
      icon: "⏱️",
      title: "试试番茄钟",
      desc: "25分钟专注，效率加倍",
      action: () => document.querySelector('[data-view="pomodoro"]')?.click()
    };
  }
  
  if (streak < 3) {
    return {
      icon: "🔥",
      title: "坚持打卡",
      desc: "连续学习3天可解锁「三天不辍」成就",
      action: () => {}
    };
  }
  
  return {
    icon: "🚀",
    title: "继续学习",
    desc: "你已经做得很好了，继续保持！",
    action: () => {}
  };
}

function calculateStreak() {
  const days = new Set(store.days || []);
  let streak = 0;
  const d = new Date();
  if (!days.has(todayStr())) d.setDate(d.getDate() - 1);
  
  for (let i = 0; i < 100; i++) {
    const s = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
    if (days.has(s)) {
      streak++;
      d.setDate(d.getDate() - 1);
    } else {
      break;
    }
  }
  
  return streak;
}

/* ================= 启动指引 ================= */
/* 自动引导气泡已停用。
   理由：它的内容在欢迎弹窗和方法页里都讲过一遍了，做成浮层跟着页面跑只会挡住内容——
   每次切视图弹一个、还要手动关掉，是最伤体验的那种「引导」。
   QUICK_TIPS 数据与 skipAllTips 逻辑保留，将来要做成「帮助」按钮里可翻阅的卡片可直接复用。 */

