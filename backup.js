/* backup.js —— 版本化完整备份、严格校验与失败回滚（浏览器 / Node 可用） */
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.PythonBackup = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const VERSION = 2;
  const MAIN_KEY = "pystudy.v1";
  const STORAGE_KEYS = Object.freeze([
    MAIN_KEY,
    "pystudy.exercises.v2",
    "pystudy.selfcheck.v1",
    "pystudy.review.v1",
    "pystudy.method.v1"
  ]);
  const MAIN_OBJECTS = [
    "notes", "done", "doneDates", "noteDates", "noteRewards", "path", "pomo", "collapsed",
    "mpOpen", "mpSeen", "achievements", "dailyGoals"
  ];
  const MAIN_BOOLEANS = ["welcomeSeen", "skipTips", "soundEnabled", "mapInit"];
  const KNOWN_MAIN_KEYS = new Set([...MAIN_OBJECTS, ...MAIN_BOOLEANS,
    "days", "shownTips", "pomoCfg", "xp", "dailyGoals", "contract"]);

  function isRecord(value) {
    return value !== null && typeof value === "object" && !Array.isArray(value);
  }
  function fail(message) { throw new Error(message); }
  function assertRecord(value, name) {
    if (!isRecord(value)) fail(name + " 必须是对象");
  }
  function assertSafeJson(value) {
    const stack = [value];
    let visited = 0;
    while (stack.length) {
      const item = stack.pop();
      if (!item || typeof item !== "object") continue;
      if (++visited > 100000) fail("备份内容过大");
      for (const [key, child] of Object.entries(item)) {
        if (key === "__proto__" || key === "prototype" || key === "constructor") {
          fail("备份包含不安全的字段");
        }
        stack.push(child);
      }
    }
  }
  function assertStringMap(value, name) {
    if (value === undefined) return;
    assertRecord(value, name);
    for (const entry of Object.values(value)) {
      if (typeof entry !== "string") fail(name + " 的内容必须是字符串");
    }
  }
  function assertDateList(value, name) {
    if (value === undefined) return;
    if (!Array.isArray(value) || value.some(v => typeof v !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(v))) {
      fail(name + " 必须是日期字符串数组");
    }
  }
  function validateMain(main) {
    assertRecord(main, "主进度");
    for (const key of MAIN_OBJECTS) {
      if (main[key] !== undefined) assertRecord(main[key], "主进度." + key);
    }
    assertStringMap(main.notes, "主进度.notes");
    assertStringMap(main.doneDates, "主进度.doneDates");
    assertStringMap(main.noteDates, "主进度.noteDates");
    assertDateList(main.days, "主进度.days");
    if (main.shownTips !== undefined && (!Array.isArray(main.shownTips) || main.shownTips.some(v => typeof v !== "string"))) {
      fail("主进度.shownTips 必须是字符串数组");
    }
    for (const key of MAIN_BOOLEANS) {
      if (main[key] !== undefined && typeof main[key] !== "boolean") fail("主进度." + key + " 必须是布尔值");
    }
    if (main.xp !== undefined && (!Number.isSafeInteger(main.xp) || main.xp < 0)) fail("主进度.xp 必须是非负整数");
    if (main.pomoCfg !== undefined) {
      assertRecord(main.pomoCfg, "主进度.pomoCfg");
      for (const key of ["work", "brk"]) {
        if (main.pomoCfg[key] !== undefined && (!Number.isFinite(main.pomoCfg[key]) || main.pomoCfg[key] <= 0 || main.pomoCfg[key] > 180)) {
          fail("番茄钟时长无效");
        }
      }
    }
    if (main.pomo !== undefined) {
      for (const day of Object.values(main.pomo)) {
        assertRecord(day, "番茄钟记录");
        for (const key of ["count", "minutes"]) {
          if (day[key] !== undefined && (!Number.isFinite(day[key]) || day[key] < 0)) fail("番茄钟统计无效");
        }
      }
    }
    return main;
  }
  function validateStores(stores) {
    assertRecord(stores, "stores");
    assertSafeJson(stores);
    for (const key of STORAGE_KEYS) {
      if (!Object.prototype.hasOwnProperty.call(stores, key)) fail("备份缺少 " + key);
      assertRecord(stores[key], key);
    }
    validateMain(stores[MAIN_KEY]);
    const review = stores["pystudy.review.v1"];
    if (review.states !== undefined) {
      assertRecord(review.states, "复习.states");
      for (const state of Object.values(review.states)) assertRecord(state, "复习卡片记录");
    }
    const method = stores["pystudy.method.v1"];
    if (method.goal !== undefined) assertRecord(method.goal, "方法.goal");
    if (method.manual !== undefined) assertRecord(method.manual, "方法.manual");
    for (const state of Object.values(stores["pystudy.exercises.v2"])) assertRecord(state, "练习记录");
    for (const state of Object.values(stores["pystudy.selfcheck.v1"])) assertRecord(state, "自测记录");
    return stores;
  }
  function readStored(storage, key) {
    const raw = storage.getItem(key);
    if (raw === null) return {};
    const value = JSON.parse(raw);
    assertRecord(value, key);
    return value;
  }
  function createBackup(storage, mainStore) {
    const stores = {};
    for (const key of STORAGE_KEYS) stores[key] = key === MAIN_KEY ? mainStore : readStored(storage, key);
    validateStores(stores);
    const darkMode = storage.getItem("darkMode");
    return {
      app: "python-study-workbench",
      version: VERSION,
      exportedAt: new Date().toISOString(),
      stores: JSON.parse(JSON.stringify(stores)),
      preferences: { darkMode: darkMode === null ? null : darkMode === "true" }
    };
  }
  function parseBackup(text) {
    if (typeof text !== "string" || text.length > 5 * 1024 * 1024) fail("备份文件过大或无法读取");
    let data;
    try { data = JSON.parse(text); } catch { fail("不是有效的 JSON 文件"); }
    assertSafeJson(data);
    if (isRecord(data) && data.app === "python-study-workbench") {
      if (data.version !== VERSION) fail("不支持的备份版本");
      validateStores(data.stores);
      const darkMode = data.preferences?.darkMode ?? null;
      if (darkMode !== null && typeof darkMode !== "boolean") fail("主题设置无效");
      return { stores: data.stores, darkMode, legacy: false };
    }
    // 兼容旧版：文件本身就是 pystudy.v1 的内容。
    assertRecord(data, "备份");
    if (!Object.keys(data).some(key => KNOWN_MAIN_KEYS.has(key))) fail("不是本工作台的备份文件");
    validateMain(data);
    const stores = {};
    for (const key of STORAGE_KEYS) stores[key] = key === MAIN_KEY ? data : {};
    return { stores, darkMode: null, legacy: true };
  }
  function restore(storage, backup) {
    validateStores(backup.stores);
    const keys = [...STORAGE_KEYS, "darkMode"];
    const snapshot = new Map(keys.map(key => [key, storage.getItem(key)]));
    const rollback = () => {
      for (const [key, value] of snapshot) {
        if (value === null) storage.removeItem(key);
        else storage.setItem(key, value);
      }
    };
    try {
      // 主进度最后写入；任何存储异常都恢复所有旧值。
      for (const key of STORAGE_KEYS.slice(1)) storage.setItem(key, JSON.stringify(backup.stores[key]));
      storage.setItem(MAIN_KEY, JSON.stringify(backup.stores[MAIN_KEY]));
      if (backup.darkMode === null) storage.removeItem("darkMode");
      else storage.setItem("darkMode", String(backup.darkMode));
    } catch (error) {
      try { rollback(); } catch { /* 保留原始异常，由界面提示存储不可用 */ }
      throw error;
    }
  }
  return Object.freeze({ VERSION, MAIN_KEY, STORAGE_KEYS, createBackup, parseBackup, restore, validateMain, validateStores });
});
