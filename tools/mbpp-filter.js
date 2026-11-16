/* 用本项目自带的 pyexec 过滤 MBPP：只保留「题目自带的参考答案 + 断言测试」能被真正执行的题。
 * 这样接进来的每一题，判分都是真的，而不是抄来的答案没人验证过。
 * 用法：node tools/mbpp-filter.js
 */
const fs = require('node:fs');
const path = require('node:path');
const PyExec = require(path.join(__dirname, '..', 'pyexec.js'));

const src = path.join(__dirname, 'mbpp', 'sanitized-mbpp.json');
const raw = JSON.parse(fs.readFileSync(src, 'utf8'));

const ok = [];
const failReason = {};

for (const item of raw) {
  const imports = (item.test_imports || []).join('\n');
  const tests = (item.test_list || []).join('\n');
  const code = `${imports}\n${item.code}\n${tests}\n`;

  // 答案本身要能跑
  const run = PyExec.run(code);
  if (run.error) {
    const key = run.error.type;
    failReason[key] = (failReason[key] || 0) + 1;
    continue;
  }
  // 必须真的产生过断言（有些题 test_list 为空就算通过，不严谨）
  if (!/^assert /m.test(tests)) continue;
  // 题面和答案都要有内容
  if (!item.prompt || !item.code) continue;

  ok.push({
    task_id: item.task_id,
    prompt: item.prompt.trim(),
    code: item.code.trim(),
    test_imports: item.test_imports || [],
    test_list: item.test_list,
    // 这些通道供后续生成中文题干时判断难度
    lines: item.code.split('\n').length,
    uses: run.uses
  });
}

fs.writeFileSync(path.join(__dirname, 'mbpp', 'passing.json'), JSON.stringify(ok, null, 2), 'utf8');

console.log(`原始 ${raw.length} 题，本地解释器能真正跑通 ${ok.length} 题`);
console.log('未通过原因分布：');
Object.entries(failReason).sort((a, b) => b[1] - a[1]).forEach(([k, v]) => console.log(`  ${k}: ${v}`));

const byFeature = { for: 0, while: 0, def: 0, listcomp: 0, try: 0, class: 0 };
for (const t of ok) for (const k of Object.keys(byFeature)) if (t.uses && t.uses[k] > 0) byFeature[k]++;
console.log('通过的题里各语法出现次数：', byFeature);
