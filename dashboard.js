/* ================= 仪表盘初始化和更新 ================= */
function initDashboard() {
  updateDashboard();
  
  // 快速操作按钮点击事件
  document.querySelectorAll('.action-btn[data-view]').forEach(btn => {
    btn.addEventListener('click', () => {
      const view = btn.getAttribute('data-view');
      const targetTab = document.querySelector(`.tab[data-view="${view}"]`);
      if (targetTab) targetTab.click();
    });
  });
  
  // 建议按钮点击事件监听（需要在updateDashboardSuggestion中绑定）
}

function updateDashboard() {
  // 计算统计数据
  const doneCount = Object.keys(store.done || {}).length;
  const noteCount = Object.keys(store.notes || {}).length;
  const streak = calculateStreak();
  const achievementCount = Object.keys(store.achievements || {}).length;
  const xp = store.xp || 0;
  
  // 更新统计卡片
  const dashTotalChapters = document.getElementById('dashTotalChapters');
  const dashTotalNotes = document.getElementById('dashTotalNotes');
  const dashStreak = document.getElementById('dashStreak');
  const dashAchievements = document.getElementById('dashAchievements');
  
  if (dashTotalChapters) dashTotalChapters.textContent = doneCount;
  if (dashTotalNotes) dashTotalNotes.textContent = noteCount;
  if (dashStreak) dashStreak.textContent = streak;
  if (dashAchievements) dashAchievements.textContent = achievementCount;
  
  // 更新欢迎问候
  updateDashboardGreeting();
  
  // 更新等级卡片
  updateDashboardLevel();
  
  // 更新学习建议
  updateDashboardSuggestion();
  
  // 更新最近成就
  updateDashboardAchievements();
}

function updateDashboardGreeting() {
  const greeting = document.getElementById('dashGreeting');
  const motivation = document.getElementById('dashMotivation');
  if (!greeting || !motivation) return;
  
  const hour = new Date().getHours();
  let timeGreeting = '';
  if (hour < 6) timeGreeting += '深夜了，注意休息哦';
  else if (hour < 12) timeGreeting += '早上好！';
  else if (hour < 14) timeGreeting += '中午好！';
  else if (hour < 18) timeGreeting += '下午好！';
  else if (hour < 22) timeGreeting += '晚上好！';
  else timeGreeting += '夜深了，早点休息';
  
  greeting.textContent = timeGreeting;
  
  const doneCount = Object.keys(store.done || {}).length;
  if (doneCount === 0) {
    motivation.textContent = '开始你的 Python 学习之旅吧！';
  } else if (doneCount < 5) {
    motivation.textContent = '很棒的开始，继续保持！';
  } else if (doneCount < 10) {
    motivation.textContent = '进步神速，你真是个学习天才！';
  } else {
    motivation.textContent = '已经学了这么多了，太厉害了！';
  }
}

function updateDashboardLevel() {
  const xp = store.xp || 0;
  const currentLevel = getCurrentLevel(xp);
  const nextLevel = getNextLevel(xp);
  
  const dashLevelEmoji = document.getElementById('dashLevelEmoji');
  const dashLevelName = document.getElementById('dashLevelName');
  const dashLevelXP = document.getElementById('dashLevelXP');
  const dashXPFill = document.getElementById('dashXPFill');
  const dashXPPercent = document.getElementById('dashXPPercent');
  const dashNextLevel = document.getElementById('dashNextLevel');
  
  if (dashLevelEmoji) dashLevelEmoji.textContent = currentLevel.emoji;
  if (dashLevelName) dashLevelName.textContent = currentLevel.name;
  
  if (nextLevel) {
    const progress = xp - currentLevel.xp;
    const required = nextLevel.xp - currentLevel.xp;
    const percent = Math.round((progress / required) * 100);
    
    if (dashLevelXP) dashLevelXP.textContent = `${xp} / ${nextLevel.xp} XP`;
    if (dashXPFill) dashXPFill.style.width = `${percent}%`;
    if (dashXPPercent) dashXPPercent.textContent = `${percent}%`;
    if (dashNextLevel) dashNextLevel.textContent = `距离「${nextLevel.name}」还差 ${required - progress} XP`;
  } else {
    if (dashLevelXP) dashLevelXP.textContent = `${xp} XP (已满级)`;
    if (dashXPFill) dashXPFill.style.width = '100%';
    if (dashXPPercent) dashXPPercent.textContent = '100%';
    if (dashNextLevel) dashNextLevel.textContent = '🎉 已达到最高等级！';
  }
}

function updateDashboardSuggestion() {
  const suggestion = getPersonalizedSuggestion();
  const suggestionBox = document.getElementById('dashSuggestion');
  if (!suggestionBox) return;
  
  suggestionBox.innerHTML = `
    <div class="suggestion-icon">${suggestion.icon}</div>
    <div class="suggestion-content">
      <h4 class="suggestion-title">${suggestion.title}</h4>
      <p class="suggestion-desc">${suggestion.desc}</p>
      <button class="btn accent btn-suggestion" id="dashSuggestionBtn">立即开始</button>
    </div>
  `;
  
  // 重新绑定按钮事件
  const btn = document.getElementById('dashSuggestionBtn');
  if (btn && suggestion.action) {
    btn.addEventListener('click', suggestion.action);
  }
}

function updateDashboardAchievements() {
  const container = document.getElementById('dashRecentAchievements');
  if (!container) return;
  
  const unlockedAchievements = [];
  Object.entries(ACHIEVEMENTS).forEach(([id, ach]) => {
    if (store.achievements && store.achievements[id]) {
      unlockedAchievements.push(ach);
    }
  });
  
  if (unlockedAchievements.length === 0) {
    container.innerHTML = '<div class="no-achievements-hint">完成学习任务即可解锁成就！</div>';
  } else {
    // 显示最近3个成就
    const recent = unlockedAchievements.slice(-3);
    container.innerHTML = recent.map(ach => `
      <div class="achievement-preview">
        <div class="achievement-preview-icon">${ach.icon}</div>
        <div class="achievement-preview-title">${ach.title}</div>
        <div class="achievement-preview-desc">${ach.desc}</div>
      </div>
    `).join('');
  }
}
