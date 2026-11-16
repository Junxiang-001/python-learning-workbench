/* ================= 工作台增强功能 ================= */

// ===== 深色模式切换 =====
function initDarkMode() {
  const darkModeToggle = document.getElementById('darkModeToggle');
  if (!darkModeToggle) return;
  
  const applyTheme = isDark => {
    document.body.classList.toggle('dark-mode', isDark);
    darkModeToggle.textContent = isDark ? '☀️' : '🌙';
    darkModeToggle.setAttribute('aria-pressed', String(isDark));
    darkModeToggle.setAttribute('aria-label', isDark ? '切换浅色模式' : '切换深色模式');
    darkModeToggle.setAttribute("aria-label", isDark ? '切换浅色模式' : '切换深色模式');
  };
  
  applyTheme(localStorage.getItem('darkMode') === 'true');
  darkModeToggle.addEventListener('click', () => {
    const isDark = !document.body.classList.contains('dark-mode');
    applyTheme(isDark);
    localStorage.setItem('darkMode', String(isDark));
    initLearningChart();
  });
}

// ===== 学习统计图表 =====
function initLearningChart() {
  const canvas = document.getElementById('learningChart');
  if (!canvas) return;
  
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.offsetWidth * 2; // Retina支持
  const height = canvas.height = 200;
  
  // 获取最近7天的学习数据
  const days = getLast7Days();
  const data = days.map(day => getLearningDataForDay(day));
  
  drawChart(ctx, width, height, days, data);
}

function getLocalDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getLast7Days() {
  const result = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    result.push(getLocalDateKey(d));
  }
  return result;
}

function getLearningDataForDay(day) {
  // 统计当天的学习分钟数（从pomo数据）
  if (!store.pomo || !store.pomo[day]) return 0;
  return store.pomo[day].minutes || 0;
}

function drawChart(ctx, width, height, labels, data) {
  const padding = 40;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;
  const maxValue = Math.max(...data, 1);
  
  ctx.clearRect(0, 0, width, height);
  ctx.strokeStyle = getComputedStyle(document.body).getPropertyValue('--accent');
  ctx.fillStyle = getComputedStyle(document.body).getPropertyValue('--accent-soft');
  ctx.lineWidth = 3;
  
  // 绘制柱状图
  const barWidth = chartWidth / data.length;
  data.forEach((value, i) => {
    const barHeight = (value / maxValue) * chartHeight;
    const x = padding + i * barWidth + barWidth * 0.2;
    const y = padding + chartHeight - barHeight;
    const w = barWidth * 0.6;
    
    // 渐变填充
    const gradient = ctx.createLinearGradient(x, y, x, y + barHeight);
    gradient.addColorStop(0, getComputedStyle(document.body).getPropertyValue('--accent'));
    gradient.addColorStop(1, getComputedStyle(document.body).getPropertyValue('--accent-2'));
    ctx.fillStyle = gradient;
    ctx.fillRect(x, y, w, barHeight);
    
    // 标签
    ctx.fillStyle = getComputedStyle(document.body).getPropertyValue('--ink-3');
    ctx.font = '12px var(--sans)';
    ctx.textAlign = 'center';
    const label = Number(labels[i].slice(-2)) + '日';
    ctx.fillText(label, x + w / 2, padding + chartHeight + 20);
  });
}

// ===== 学习日历可视化 =====
function initStreakCalendar() {
  const container = document.getElementById('streakCalendar');
  if (!container) return;
  
  const days = getLast30Days();
  const html = days.map(day => {
    const hasStudy = store.days && store.days.includes(day);
    const date = new Date(day).getDate();
    return `
      <div class="calendar-day ${hasStudy ? 'studied' : ''}" aria-label="${day}">
        <span class="calendar-day-num">${date}</span>
      </div>
    `;
  }).join('');
  
  container.innerHTML = `
    <div class="calendar-grid">
      ${html}
    </div>
  `;
}

function getLast30Days() {
  const result = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    result.push(getLocalDateKey(d));
  }
  return result;
}

// ===== 每日目标系统 =====
function initDailyGoals() {
  if (!store.dailyGoals) {
    store.dailyGoals = {
      studyMinutes: 25,  // 默认目标：25分钟
      completeChapters: 1,  // 默认目标：完成1章
      writeNotes: 1  // 默认目标：写1篇笔记
    };
    save();
  }
  
  updateDailyGoalsDisplay();
}

function updateDailyGoalsDisplay() {
  const container = document.getElementById('dailyGoalsContainer');
  if (!container) return;
  
  const today = todayStr();
  const todayMinutes = getLearningDataForDay(today);
  const todayChapters = getTodayCompletedChapters();
  const todayNotes = getTodayNotes();
  
  const goals = store.dailyGoals;
  
  const html = `
    <div class="daily-goal">
      <div class="goal-icon">⏱️</div>
      <div class="goal-info">
        <div class="goal-name">今日专注</div>
        <div class="goal-progress">
          <div class="goal-bar">
            <div class="goal-fill" style="width: ${Math.min(100, (todayMinutes / goals.studyMinutes) * 100)}%"></div>
          </div>
          <div class="goal-text">${todayMinutes} / ${goals.studyMinutes} 分钟</div>
        </div>
      </div>
    </div>
    <div class="daily-goal">
      <div class="goal-icon">📚</div>
      <div class="goal-info">
        <div class="goal-name">完成章节</div>
        <div class="goal-progress">
          <div class="goal-bar">
            <div class="goal-fill" style="width: ${Math.min(100, (todayChapters / goals.completeChapters) * 100)}%"></div>
          </div>
          <div class="goal-text">${todayChapters} / ${goals.completeChapters} 章</div>
        </div>
      </div>
    </div>
    <div class="daily-goal">
      <div class="goal-icon">✍️</div>
      <div class="goal-info">
        <div class="goal-name">编写笔记</div>
        <div class="goal-progress">
          <div class="goal-bar">
            <div class="goal-fill" style="width: ${Math.min(100, (todayNotes / goals.writeNotes) * 100)}%"></div>
          </div>
          <div class="goal-text">${todayNotes} / ${goals.writeNotes} 篇</div>
        </div>
      </div>
    </div>
  `;
  
  container.innerHTML = html;
}

function getTodayCompletedChapters() {
  const today = todayStr();
  return Object.values(store.doneDates || {}).filter(date => date === today).length;
}

function getTodayNotes() {
  const today = todayStr();
  return Object.values(store.noteDates || {}).filter(date => date === today).length;
}

// ===== 成就解锁庆祝动画 =====
function showAchievementCelebration(achievement) {
  const overlay = document.createElement('div');
  overlay.className = 'achievement-overlay';
  overlay.innerHTML = `
    <div class="achievement-celebration">
      <div class="achievement-firework">🎉</div>
      <div class="achievement-icon-big">${achievement.icon}</div>
      <h2 class="achievement-unlocked-title">成就解锁！</h2>
      <h3 class="achievement-unlocked-name">${achievement.title}</h3>
      <p class="achievement-unlocked-desc">${achievement.desc}</p>
      <button class="btn accent achievement-close-btn">太棒了！</button>
    </div>
  `;
  
  document.body.appendChild(overlay);
  
  // 延迟显示动画
  setTimeout(() => overlay.classList.add('show'), 10);
  
  // 关闭按钮
  overlay.querySelector('.achievement-close-btn').addEventListener('click', () => {
    overlay.classList.remove('show');
    setTimeout(() => overlay.remove(), 300);
  });
  
  // 播放音效（如果用户允许）
  playAchievementSound();
}

function playAchievementSound() {
  // 使用Web Audio API生成简单的成就音效
  if (!store.soundEnabled) return;
  
  try {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    
    // 创建一个愉快的音符序列
    const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
    notes.forEach((freq, i) => {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = freq;
      oscillator.type = 'sine';
      
      const startTime = audioContext.currentTime + i * 0.15;
      gainNode.gain.setValueAtTime(0.3, startTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.3);
      
      oscillator.start(startTime);
      oscillator.stop(startTime + 0.3);
    });
  } catch (e) {
    // 静默失败
  }
}

// ===== 快捷键支持 =====
function initKeyboardShortcuts() {
  document.addEventListener('keydown', (e) => {
    // Alt + 数字键切换标签页
    if (e.altKey && e.key >= '1' && e.key <= '9') {
      e.preventDefault();
      const tabs = document.querySelectorAll('.tab');
      const index = parseInt(e.key) - 1;
      if (tabs[index]) tabs[index].click();
    }
    
    // Ctrl/Cmd + K 打开快速搜索
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      const searchInput = document.querySelector('input[placeholder*="搜索"]');
      if (searchInput) searchInput.focus();
    }
    
    // Ctrl/Cmd + S 保存当前笔记
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      const noteArea = document.querySelector('textarea[aria-label*="笔记"]');
      if (noteArea && document.activeElement === noteArea) {
        e.preventDefault();
        // 触发保存（已有自动保存，这里添加视觉反馈）
        showToast('笔记已保存 ✓');
      }
    }
  });
}

function showToast(message, duration = 2000) {
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  document.body.appendChild(toast);
  
  setTimeout(() => toast.classList.add('show'), 10);
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

// ===== 学习提醒功能 =====
function initStudyReminder() {
  if (!store.studyReminder) {
    store.studyReminder = {
      enabled: false,
      time: '20:00',
      lastReminder: null
    };
    save();
  }
  
  // 每分钟检查一次是否需要提醒
  setInterval(checkStudyReminder, 60000);
  checkStudyReminder(); // 立即检查一次
}

function checkStudyReminder() {
  if (!store.studyReminder.enabled) return;
  
  const now = new Date();
  const today = todayStr();
  const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  
  // 如果今天已经提醒过，或者还没到设定时间，跳过
  if (store.studyReminder.lastReminder === today) return;
  if (currentTime < store.studyReminder.time) return;
  
  // 检查今天是否已经学习过
  const hasStudiedToday = store.days && store.days.includes(today);
  if (hasStudiedToday) {
    store.studyReminder.lastReminder = today;
    save();
    return;
  }
  
  // 发送提醒
  showStudyReminderNotification();
  store.studyReminder.lastReminder = today;
  save();
}

function showStudyReminderNotification() {
  showToast('该学习 Python 啦！⏰', 5000);
  
  // 如果浏览器支持，发送桌面通知
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification('Python 学习工作台', {
      body: '该学习 Python 啦！',
      icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y="75" font-size="75">🐍</text></svg>'
    });
  }
}

// ===== 统计面板增强 =====
function initEnhancedStats() {
  const statsContainer = document.getElementById('enhancedStats');
  if (!statsContainer) return;
  
  const totalStudyMinutes = Object.values(store.pomo || {}).reduce((sum, day) => sum + (day.minutes || 0), 0);
  const totalSessions = Object.values(store.pomo || {}).reduce((sum, day) => sum + (day.count || 0), 0);
  const avgSessionMinutes = totalSessions > 0 ? Math.round(totalStudyMinutes / totalSessions) : 0;
  
  statsContainer.innerHTML = `
    <div class="stat-card">
      <div class="stat-icon">⏱️</div>
      <div class="stat-value">${totalStudyMinutes}</div>
      <div class="stat-label">总学习分钟</div>
    </div>
    <div class="stat-card">
      <div class="stat-icon">🎯</div>
      <div class="stat-value">${totalSessions}</div>
      <div class="stat-label">番茄钟次数</div>
    </div>
    <div class="stat-card">
      <div class="stat-icon">📊</div>
      <div class="stat-value">${avgSessionMinutes}</div>
      <div class="stat-label">平均时长(分)</div>
    </div>
  `;
}

// ===== 初始化所有增强功能 =====
function initAllEnhancements() {
  initDarkMode();
  initKeyboardShortcuts();
  initStudyReminder();
  
  // 当切换到仪表盘视图时初始化图表和日历
  document.querySelectorAll('.tab[data-view="dashboard"]').forEach(tab => {
    tab.addEventListener('click', () => {
      setTimeout(() => {
        initLearningChart();
        initStreakCalendar();
        initDailyGoals();
        initEnhancedStats();
      }, 100);
    });
  });
  
  // 如果当前就是仪表盘，立即初始化
  if (document.querySelector('#view-dashboard.active')) {
    setTimeout(() => {
      initLearningChart();
      initStreakCalendar();
      initDailyGoals();
      initEnhancedStats();
    }, 100);
  }
}

// 在DOM加载完成后初始化
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAllEnhancements);
} else {
  initAllEnhancements();
}
