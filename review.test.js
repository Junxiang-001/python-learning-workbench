/* 复习排期算法测试：node review.test.js */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const context = { window: {}, document: { readyState: 'complete', getElementById: () => null }, console };
context.globalThis = context;
vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(__dirname, 'review.js'), 'utf8'), context);
const R = context.window.PythonReview;

assert.ok(R, 'review.js 应当导出 PythonReview');

// --- 日期工具 ---
assert.equal(R.addDays('2026-11-06', 1), '2026-11-07');
assert.equal(R.addDays('2026-11-30', 1), '2026-12-01');
assert.equal(R.addDays('2026-12-31', 1), '2027-01-01');
assert.equal(R.addDays('2026-03-01', -1), '2026-02-28');
assert.equal(R.daysBetween('2026-11-06', '2026-11-16'), 10);

// --- 首次评「熟了」→ 3 天后 ---
const s1 = R.nextState(null, 'good', '2026-11-06');
assert.equal(s1.interval, 3);
assert.equal(s1.due, '2026-11-09');
assert.equal(s1.reps, 1);

// --- 第二次熟了 → 7 天 ---
const s2 = R.nextState(s1, 'good', '2026-11-09');
assert.equal(s2.interval, 7);
assert.equal(s2.due, '2026-11-16');

// --- 第三次开始按 2.2 倍拉长 ---
const s3 = R.nextState(s2, 'good', '2026-11-16');
assert.equal(s3.interval, 15);
assert.equal(s3.due, '2026-12-01');

// --- 勉强至少隔一天 ---
const h1 = R.nextState(null, 'hard', '2026-11-06');
assert.equal(h1.interval, 1);
assert.equal(h1.due, '2026-11-07');

// --- 忘了：间隔清零、当天再来、lapses+1 ---
const a1 = R.nextState(s2, 'again', '2026-11-16');
assert.equal(a1.interval, 0);
assert.equal(a1.due, '2026-11-16', '忘了的卡当天要再来一次');
assert.equal(a1.lapses, 1);
assert.equal(a1.reps, 0, '忘了要回到起点重新积累');

// 忘了之后重来，间隔重新从 3 天起
const a2 = R.nextState(a1, 'good', '2026-11-16');
assert.equal(a2.interval, 3);

// --- 到期判断 ---
assert.equal(R.isDue({ due: '2026-11-06' }, '2026-11-06'), true, '当天到期就算到期');
assert.equal(R.isDue({ due: '2026-11-05' }, '2026-11-06'), true, '过期未复习也算到期');
assert.equal(R.isDue({ due: '2026-11-07' }, '2026-11-06'), false);
assert.equal(R.isDue(null, '2026-11-06'), false);

// --- 队列：新卡限量 + 交错 ---
const cards = R.CARDS;
const queue = R.buildQueue(cards, {}, '2026-11-06', { newLimit: 5 });
assert.equal(queue.length, 5, '没有历史记录时只给 newLimit 张新卡');
assert.equal(new Set(queue.map(c => c.id)).size, 5, '队列里不该有重复卡');

const manyStates = {};
for (const c of cards) manyStates[c.id] = { due: '2026-11-01', interval: 3, reps: 2, lapses: 0 };
const allDue = R.buildQueue(cards, manyStates, '2026-11-06', { newLimit: 0 });
assert.equal(allDue.length, cards.length, '全部到期时全都要排进来');

// 交错：相邻两张不该来自同一章（除非该章剩下的卡已经没别的可排）
let sameNeighbor = 0;
for (let i = 1; i < allDue.length; i++) {
  if (allDue[i].ch === allDue[i - 1].ch) sameNeighbor++;
}
assert.ok(sameNeighbor <= 1, `交错失败：连续同章 ${sameNeighbor} 次`);
assert.equal(new Set(allDue.map(c => c.id)).size, allDue.length, '交错不能丢卡或重复');

// --- 统计 ---
const st = { states: { c01a: { due: '2026-11-01', interval: 3, lastAt: '2026-11-06' } } };
const counted = R.stats(cards, st.states, '2026-11-06');
assert.equal(counted.due, 1);
assert.equal(counted.done, 1);
assert.equal(counted.total, cards.length);

// --- 卡片库自身质量 ---
const ids = new Set();
for (const c of cards) {
  assert.ok(!ids.has(c.id), `卡片 id 重复: ${c.id}`);
  ids.add(c.id);
  assert.ok(c.front.length >= 8, `${c.id} 问题太短`);
  assert.ok(c.back.length >= 10, `${c.id} 答案太短`);
  assert.ok(/^ch\d+$/.test(c.ch), `${c.id} 章节号不合法: ${c.ch}`);
  assert.equal(c.front.trim().endsWith('？') || c.front.trim().endsWith('?') || c.front.trim().endsWith('。'), true,
    `${c.id} 的问题应该是一句完整的话`);
}
// 覆盖课程前半段所有章节
for (const ch of ['ch01', 'ch02', 'ch03', 'ch04', 'ch05', 'ch06', 'ch07', 'ch08']) {
  assert.ok(cards.some(c => c.ch === ch), `缺少 ${ch} 的卡片`);
}

console.log(`review 测试通过：${cards.length} 张卡片，排期算法 3/7/15 天递增、答错当天回流`);
