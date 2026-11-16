/* method.js —— 把学习方法变成界面上能看见的东西
 *
 * 两块：
 *   「我要做出来的东西」—— 产出锚。没有它，学什么都没方向（方法 01）。
 *   「今天只做这三件」  —— 跑通一件事 / 复习 / 讲一遍（方法 02、03、06）。
 *
 * 三件事的勾是自动判定的：练习通过过、复习过、今天写过笔记，都会自己打勾，
 * 不需要手动点。手动能点只是兜底（比如你在别处写了代码）。
 */
(function () {
  "use strict";

  const KEY = "pystudy.method.v1";

  function pad(n) { return String(n).padStart(2, "0"); }
  function todayStr(d) {
    const t = d || new Date();
    return `${t.getFullYear()}-${pad(t.getMonth() + 1)}-${pad(t.getDate())}`;
  }
  function fromTs(ts) {
    if (!ts) return "";
    const d = new Date(ts);
    if (Number.isNaN(d.getTime())) return "";
    return todayStr(d);
  }

  function load() {
    try {
      const raw = JSON.parse(localStorage.getItem(KEY)) || {};
      raw.goal ??= { deliverable: "", forWhom: "", due: "" };
      raw.manual ??= {};
      raw.manualDate ??= "";
      return raw;
    } catch {
      return { goal: { deliverable: "", forWhom: "", due: "" }, manual: {}, manualDate: "" };
    }
  }
  function persist(data) {
    try { localStorage.setItem(KEY, JSON.stringify(data)); } catch { /* 隐私模式静默 */ }
  }

  /* ---------- 从别处读「今天做过什么」 ---------- */
  function readJSON(key) {
    try { return JSON.parse(localStorage.getItem(key)) || {}; } catch { return {}; }
  }

  function didPracticeToday(today) {
    const p = readJSON("pystudy.exercises.v2");
    return Object.values(p).some(v => v && ((v.lastAt && fromTs(v.lastAt) === today) || (v.masteredAt && fromTs(v.masteredAt) === today)));
  }
  function didChapterToday(today) {
    const dates = (typeof store !== "undefined" && store?.doneDates) || {};
    return Object.values(dates).includes(today);
  }
  function reviewDoneToday(today) {
    if (!window.PythonReview) return 0;
    const rv = readJSON("pystudy.review.v1");
    return window.PythonReview.stats(window.PythonReview.CARDS, rv.states || {}, today).done;
  }
  function didNoteToday(today) {
    const dates = (typeof store !== "undefined" && store?.noteDates) || {};
    if (Object.values(dates).includes(today)) return true;
    const notes = (typeof store !== "undefined" && store?.notes) || {};
    return Object.keys(notes).some(k => String(notes[k] || "").trim().length >= 40 && store.noteDates?.[k] === today);
  }

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]));
  }

  /* ---------- 产出契约 ---------- */
  function buildContractCard(data) {
    const card = document.createElement("div");
    card.className = "dash-card contract-card";
    card.id = "contractCard";
    card.innerHTML = `
      <h3>我要做出来的东西</h3>
      <p class="contract-hint">「最有用」只来自这里：先定你拿它干什么，再定学什么。</p>
      <div class="contract-fields">
        <label>产出 · 能交出去的东西
          <input id="contractDeliverable" type="text" maxlength="80" placeholder="例：一个整理 Excel 流水的小脚本">
        </label>
        <div class="contract-row">
          <label>给谁用
            <input id="contractForWhom" type="text" maxlength="30" placeholder="自己 / 同事">
          </label>
          <label>什么时候交
            <input id="contractDue" type="date">
          </label>
        </div>
      </div>
      <p class="contract-state" id="contractState"></p>`;

    const deliverable = card.querySelector("#contractDeliverable");
    const forWhom = card.querySelector("#contractForWhom");
    const due = card.querySelector("#contractDue");
    const stateEl = card.querySelector("#contractState");

    deliverable.value = data.goal.deliverable || "";
    forWhom.value = data.goal.forWhom || "";
    due.value = data.goal.due || "";

    function renderState() {
      const g = data.goal;
      if (!g.deliverable) {
        stateEl.innerHTML = `<span class="contract-empty">还没写。先写一句：你要做出什么、给谁用、什么时候交。</span>`;
        return;
      }
      const bits = [`产出：<b>${esc(g.deliverable)}</b>`];
      if (g.forWhom) bits.push(`给 <b>${esc(g.forWhom)}</b> 用`);
      if (g.due) {
        const left = Math.round((new Date(g.due) - new Date(todayStr())) / 86400000);
        if (Number.isNaN(left)) bits.push("");
        else if (left > 0) bits.push(`还有 <b>${left}</b> 天`);
        else if (left === 0) bits.push(`<b>就是今天</b>交`);
        else bits.push(`已过期 <b>${-left}</b> 天——要么改期，要么砍范围`);
      }
      stateEl.innerHTML = bits.filter(Boolean).join(" · ");
    }

    function onChange() {
      data.goal.deliverable = deliverable.value.trim();
      data.goal.forWhom = forWhom.value.trim();
      data.goal.due = due.value;
      persist(data);
      renderState();
    }
    [deliverable, forWhom, due].forEach(el => {
      el.addEventListener("change", onChange);
      el.addEventListener("blur", onChange);
    });

    renderState();
    return card;
  }

  /* ---------- 今天只做这三件 ---------- */
  function buildTodayCard() {
    const card = document.createElement("div");
    card.className = "dash-card today-card";
    card.id = "todayCard";
    card.innerHTML = `
      <h3>今天只做这三件</h3>
      <ul class="today-list" id="todayList">
        <li data-t="loop">
          <span class="tick">1</span>
          <span><span class="t-label">跑通一件事</span>
          <span class="t-sub">最小闭环：写出来、能运行、有结果</span></span>
          <button class="t-go" data-go="practice" type="button">练习场 →</button>
        </li>
        <li data-t="review">
          <span class="tick">2</span>
          <span><span class="t-label">把到期的问题过一遍</span>
          <span class="t-sub" id="todayReviewSub">先自己想，再看答案</span></span>
          <button class="t-go" data-go="review" type="button">复习 →</button>
        </li>
        <li data-t="output">
          <span class="tick">3</span>
          <span><span class="t-label">讲一遍，或写下来</span>
          <span class="t-sub">讲不出来的，就是还没学会</span></span>
          <button class="t-go" data-go="notes" type="button">记笔记 →</button>
        </li>
      </ul>
      <p class="today-note" id="todayNote"></p>`;
    return card;
  }

  function refreshToday(card) {
    if (!card) return;
    const today = todayStr();
    const data = load();
    const manual = data.manualDate === today ? data.manual : {};

    const reviewCount = reviewDoneToday(today);
    const status = {
      loop: didPracticeToday(today) || didChapterToday(today) || !!manual.loop,
      review: reviewCount > 0 || !!manual.review,
      output: didNoteToday(today) || !!manual.output
    };

    card.querySelectorAll("[data-t]").forEach(li => {
      const done = !!status[li.dataset.t];
      li.classList.toggle("is-done", done);
      const tick = li.querySelector(".tick");
      if (tick) tick.textContent = done ? "✓" : String(["loop", "review", "output"].indexOf(li.dataset.t) + 1);
      li.dataset.done = done ? "1" : "";
    });

    const sub = card.querySelector("#todayReviewSub");
    if (sub) {
      const st = window.PythonReview
        ? window.PythonReview.stats(window.PythonReview.CARDS, readJSON("pystudy.review.v1").states || {}, today)
        : null;
      sub.textContent = !st ? "先自己想，再看答案"
        : st.due > 0 ? `今天有 ${st.due} 张到期${reviewCount ? ` · 已刷 ${reviewCount}` : ""}`
        : reviewCount > 0 ? `今天已复习 ${reviewCount} 张，够了`
        : "今天没有到期的卡";
    }

    // 首页问候卡右侧补一行状态，别让那张卡空得只剩两句话
    const welcome = document.querySelector(".welcome-card");
    if (welcome) {
      let row = welcome.querySelector(".welcome-stats");
      if (!row) {
        row = document.createElement("div");
        row.className = "welcome-stats";
        welcome.appendChild(row);
      }
      const streak = typeof calculateStreak === "function" ? calculateStreak() : 0;
      const n = [status.loop, status.review, status.output].filter(Boolean).length;
      row.innerHTML =
        `<span>连续 <b>${streak}</b> 天</span>` +
        `<span>今日 <b>${n}</b>/3 件</span>` +
        `<span>到期 <b>${reviewCount}</b> 张</span>`;
    }

    const note = card.querySelector("#todayNote");
    if (note) {
      const n = [status.loop, status.review, status.output].filter(Boolean).length;
      note.textContent = n === 3
        ? "三件都做了。今天到此为止——多刷不会更牢，只会更烦。"
        : n === 0
          ? "一件都还没开始。挑最容易的那件先做，5 分钟就够。"
          : `还差 ${3 - n} 件。不用全做，但「跑通一件事」优先级最高。`;
    }
  }

  /* ---------- 挂到首页 ---------- */
  function init() {
    const grid = document.querySelector(".dashboard-grid");
    if (!grid) return;

    const data = load();
    const contract = buildContractCard(data);
    const today = buildTodayCard();

    grid.insertBefore(today, grid.firstChild);
    grid.insertBefore(contract, today);

    refreshToday(today);

    // 点了「去练习场」等按钮
    today.addEventListener("click", e => {
      const btn = e.target.closest("[data-go]");
      if (btn) {
        document.querySelector(`.tab[data-view="${btn.dataset.go}"]`)?.click();
        return;
      }
      // 点整行也能跳
      const li = e.target.closest("[data-t]");
      if (!li) return;
      const map = { loop: "practice", review: "review", output: "notes" };
      document.querySelector(`.tab[data-view="${map[li.dataset.t]}"]`)?.click();
    });

    // 切视图时刷新（练习完回来能看到勾）
    document.querySelectorAll(".tab").forEach(tab => {
      tab.addEventListener("click", () => setTimeout(() => refreshToday(today), 60));
    });
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden) refreshToday(today);
    });
    window.addEventListener("focus", () => refreshToday(today));
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true });
  else init();
})();
