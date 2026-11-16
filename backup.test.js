"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const Backup = require("./backup.js");

class MemoryStorage {
  constructor(entries = {}) { this.data = new Map(Object.entries(entries)); this.failOn = null; }
  getItem(key) { return this.data.has(key) ? this.data.get(key) : null; }
  setItem(key, value) {
    if (this.failOn === key) throw new Error("quota");
    this.data.set(key, String(value));
  }
  removeItem(key) { this.data.delete(key); }
}
function completeStores() {
  return {
    "pystudy.v1": { notes: { ch01: "笔记" }, done: { ch01: true }, days: ["2026-11-07"], xp: 30 },
    "pystudy.exercises.v2": { hello: { code: "print('你好')", passed: true, attempts: 1 } },
    "pystudy.selfcheck.v1": { hello: { answer: "yes", at: 1 } },
    "pystudy.review.v1": { states: { c01a: { due: "2026-11-08", interval: 1 } } },
    "pystudy.method.v1": { goal: { deliverable: "脚本" }, manual: {}, manualDate: "" }
  };
}

test("完整备份包含五类数据与主题设置，并可往返恢复", () => {
  const stores = completeStores();
  const source = new MemoryStorage(Object.fromEntries(Object.entries(stores).map(([k, v]) => [k, JSON.stringify(v)])));
  source.setItem("darkMode", "true");
  const backup = Backup.createBackup(source, stores[Backup.MAIN_KEY]);
  assert.deepEqual(Object.keys(backup.stores).sort(), [...Backup.STORAGE_KEYS].sort());
  const parsed = Backup.parseBackup(JSON.stringify(backup));
  const target = new MemoryStorage();
  Backup.restore(target, parsed);
  for (const key of Backup.STORAGE_KEYS) assert.deepEqual(JSON.parse(target.getItem(key)), stores[key]);
  assert.equal(target.getItem("darkMode"), "true");
});

test("兼容旧版仅含主进度的备份", () => {
  const legacy = { notes: { ch01: "旧笔记" }, path: { s0i0: true }, xp: 5 };
  const parsed = Backup.parseBackup(JSON.stringify(legacy));
  assert.equal(parsed.legacy, true);
  assert.deepEqual(parsed.stores[Backup.MAIN_KEY], legacy);
  assert.deepEqual(parsed.stores["pystudy.review.v1"], {});
});

test("拒绝伪装或类型损坏的备份", () => {
  const badValues = [
    "{}",
    JSON.stringify({ notes: [], path: {} }),
    JSON.stringify({ notes: {}, days: {} }),
    JSON.stringify({ notes: {}, xp: -1 }),
    JSON.stringify({ app: "python-study-workbench", version: 99, stores: {} })
  ];
  for (const text of badValues) assert.throws(() => Backup.parseBackup(text));
  const unsafe = completeStores();
  Object.defineProperty(unsafe["pystudy.v1"], "__proto__", { value: { polluted: true }, enumerable: true });
  assert.throws(() => Backup.parseBackup(JSON.stringify({ app: "python-study-workbench", version: 2, stores: unsafe })));
  assert.equal({}.polluted, undefined);
});

test("新版备份缺少任何独立数据存储都会被拒绝", () => {
  const stores = completeStores();
  delete stores["pystudy.exercises.v2"];
  const text = JSON.stringify({ app: "python-study-workbench", version: 2, stores });
  assert.throws(() => Backup.parseBackup(text), /缺少/);
});

test("写入失败时回滚所有键，不留下半份导入", () => {
  const target = new MemoryStorage();
  for (const key of Backup.STORAGE_KEYS) target.setItem(key, JSON.stringify({ old: key }));
  target.setItem("darkMode", "false");
  const before = new Map(target.data);
  target.failOn = "pystudy.review.v1";
  assert.throws(() => Backup.restore(target, { stores: completeStores(), darkMode: true }), /quota/);
  assert.deepEqual(target.data, before);
});
