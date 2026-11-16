/* fun.js —— 成就墙视图；等级、XP、打卡与成就判定统一由 app.js 管理。 */
"use strict";

function renderAchievements() {
  const grid = document.getElementById("achieveGrid");
  if (!grid || typeof ACHIEVEMENTS === "undefined") return;
  const unlocked = store.achievements || {};
  grid.innerHTML = Object.values(ACHIEVEMENTS).map(ach => {
    const earned = !!unlocked[ach.id];
    return `<div class="achieve-card${earned ? " unlocked" : " locked"}">
      <div class="achieve-icon" aria-hidden="true">${ach.icon}</div>
      <div class="achieve-body">
        <h3>${esc(ach.title)}</h3>
        <p>${esc(ach.desc)}</p>
      </div>
      <div class="achieve-state">${earned ? "已解锁" : "未解锁"}</div>
    </div>`;
  }).join("");
}

document.addEventListener("DOMContentLoaded", renderAchievements);
