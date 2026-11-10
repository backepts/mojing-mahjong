// node test/core.test.js
const assert = require('assert');
const C = require('../gas/core.js');

const players = ['Beck', 'Fanny', 'MM', 'Luke'];
const s1 = { id: '2026-11-07', date: '2026-11-07', rounds: 12, start: '', end: '', results: [{ name: 'Beck', amt: 700 }, { name: 'Luke', amt: -700 }] };
const state = () => ({ players: players.slice(), sessions: [JSON.parse(JSON.stringify(s1))] });
const ok = { by: 'Beck', date: '2026-11-14', rounds: 12, results: [{ name: 'Beck', amt: 1200 }, { name: 'Fanny', amt: -800 }, { name: 'MM', amt: -400 }] };

// 標籤＝日期
assert.deepStrictEqual(C.labelSessions([{ date: '2026-01-05' }, { date: '2026-11-14' }]).map(s => s.label), ['1/5', '11/14']);

// 正常新增：場次ID＝日期
let r = C.prepareSave(ok, state());
assert.ifError(r.error);
assert.strictEqual(r.session.id, '2026-11-14');
assert.strictEqual(r.session.rounds, 12);
assert.strictEqual(r.session.start, '');
assert.deepStrictEqual(r.newPlayers, []);
assert.strictEqual(r.session.house, undefined);

// 開局／結束時間：可不填；填就要兩個一起、格式 HH:MM（過午夜可以）
r = C.prepareSave(Object.assign({}, ok, { start: '19:30', end: '01:10' }), state());
assert.ifError(r.error);
assert.strictEqual(r.session.end, '01:10');

// 新玩家
r = C.prepareSave(Object.assign({}, ok, { results: [{ name: ' 新朋友 ', amt: 500 }, { name: 'Beck', amt: -500 }] }), state());
assert.deepStrictEqual(r.newPlayers, ['新朋友']);

// 擋
const bad = [
  [{ results: [{ name: 'Beck', amt: 1200 }, { name: 'Fanny', amt: -800 }] }, '帳不平'],
  [{ by: '' }, '我是誰'],
  [{ results: [{ name: 'Beck', amt: 0 }] }, '至少要 2'],
  [{ results: [{ name: 'Beck', amt: 500 }, { name: 'Beck', amt: -500 }] }, '重複'],
  [{ results: [{ name: 'Beck', amt: 0.5 }, { name: 'MM', amt: -0.5 }] }, '金額不對'],
  [{ results: [{ name: '將數', amt: 500 }, { name: 'MM', amt: -500 }] }, '不能用'],
  [{ date: '2026/11/14' }, '日期'],
  [{ date: '2026-11-07' }, '已經記過'],
  [{ rounds: 0 }, '將數'],
  [{ rounds: '' }, '將數'],
  [{ rounds: 2.5 }, '將數'],
  [{ start: '19:30' }, '一起填'],
  [{ start: '7:30', end: '9:00' }, '一起填'],
  [{ start: '19:30', end: '19:30' }, '不能一樣'],
];
bad.forEach(([patch, msg]) => {
  const res = C.prepareSave(Object.assign({}, ok, patch), state());
  assert.ok(res.error && res.error.includes(msg), JSON.stringify(patch) + ' → ' + res.error);
});

// 修改：沿用原本日期（就算送來別的日期），帶出改前
r = C.prepareSave({ id: '2026-11-07', by: 'MM', date: '2099-01-01', rounds: 8, results: [{ name: 'Beck', amt: 300 }, { name: 'Luke', amt: -300 }] }, state());
assert.ifError(r.error);
assert.strictEqual(r.session.id, '2026-11-07');
assert.strictEqual(r.before.results[0].amt, 700);
assert.ok(C.prepareSave({ id: 'nope', by: 'MM', rounds: 8, results: ok.results }, state()).error.includes('找不到'));

// 總覽版型
const grid = C.buildOverview(players, state().sessions);
assert.deepStrictEqual(grid[0], ['日期', '11/7']);
assert.deepStrictEqual(grid[1], ['Beck', 700]);
assert.deepStrictEqual(grid[2], ['Fanny', '']);
assert.deepStrictEqual(grid[grid.length - 1], ['將數', 12]);
assert.strictEqual(grid.length, 1 + players.length + 2);

console.log('全部通過');
