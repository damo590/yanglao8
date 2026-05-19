const assert = require("node:assert/strict");

const leaderboardApi = require("../api/leaderboard.js");
const { __test } = leaderboardApi;

assert.ok(__test, "leaderboard api should expose test helpers");

const seedState = __test.normalizeState({
  version: 1,
  updatedAt: 1,
  day: { key: "2026-04-27", entries: [] },
  week: { key: "2026-W18", entries: [{ name: "A", score: 80, acc: 90, cost: 20, ts: 1 }] },
  month: { key: "2026-04", entries: [] }
});

const nextWeek = __test.upsertScope(seedState.week, "2026-W18", { name: "B", score: 95, acc: 100, cost: 18, ts: 2 });
assert.equal(nextWeek.total, 2, "same-key weekly submissions should increment the weekly total");
assert.equal(nextWeek.entries.length, 2, "same-key weekly submissions should remain on the leaderboard");

const resetWeek = __test.upsertScope(nextWeek, "2026-W19", { name: "C", score: 88, acc: 92, cost: 17, ts: 3 });
assert.equal(resetWeek.total, 1, "a new weekly bucket should reset the live completion total");
assert.equal(resetWeek.entries.length, 1, "a new weekly bucket should start a fresh leaderboard");

console.log("leaderboard-api checks passed");
