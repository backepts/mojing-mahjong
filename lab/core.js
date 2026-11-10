// 純邏輯（不碰 SpreadsheetApp），本機可用 node 跑 test/core.test.js 驗證
// 魔競娛樂麻將間：一天只打一桌（場次ID＝日期）、沒有東錢，帳平＝大家輸贏合計 0

var MAX_NAME_LEN = 20;
var MAX_AMOUNT = 1000000;
var RESERVED_NAMES = ['日期', '將數'];

var TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

function trimStr_(s) {
  return String(s == null ? '' : s).trim();
}

// '2026-10-23' → '10/23'
function shortDate_(date) {
  var p = date.split('-');
  return Number(p[1]) + '/' + Number(p[2]);
}

function labelSessions(sessions) {
  sessions.forEach(function (s) { s.label = shortDate_(s.date); });
  return sessions;
}

function sortSessions(sessions) {
  return sessions.sort(function (a, b) { return a.date < b.date ? -1 : a.date > b.date ? 1 : 0; });
}

// 驗證送出內容；成功回 { session, newPlayers, before, by }，失敗回 { error }
function prepareSave(payload, state) {
  payload = payload || {};
  var by = trimStr_(payload.by);
  if (!by) return { error: '請先選「我是誰」' };
  if (by.length > MAX_NAME_LEN) return { error: '記帳人名稱太長' };

  var before = null, date;
  if (payload.id) {
    before = state.sessions.filter(function (s) { return s.id === payload.id; })[0];
    if (!before) return { error: '找不到要修改的那一桌，可能已被別人改過，請重新整理' };
    date = before.date;
  } else {
    date = trimStr_(payload.date);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || isNaN(new Date(date + 'T00:00:00').getTime())) return { error: '日期格式不對' };
    if (state.sessions.some(function (s) { return s.date === date; })) return { error: shortDate_(date) + ' 已經記過一桌了，要改請用「修改舊的」' };
  }

  var results = Array.isArray(payload.results) ? payload.results : [];
  if (results.length < 2) return { error: '至少要 2 個人' };
  var seen = {}, clean = [];
  for (var i = 0; i < results.length; i++) {
    var name = trimStr_(results[i] && results[i].name);
    var amt = Number(results[i] && results[i].amt);
    if (!name) return { error: '有玩家沒有名字' };
    if (name.length > MAX_NAME_LEN) return { error: '名字太長：' + name };
    if (RESERVED_NAMES.indexOf(name) >= 0) return { error: '不能用「' + name + '」當玩家名字' };
    if (seen[name]) return { error: '重複的玩家：' + name };
    seen[name] = true;
    if (!Number.isInteger(amt) || Math.abs(amt) > MAX_AMOUNT) return { error: name + ' 的金額不對' };
    clean.push({ name: name, amt: amt });
  }

  var rounds = Number(payload.rounds);
  if (!Number.isInteger(rounds) || rounds < 1 || rounds > 100) return { error: '將數不對（要 1～100 的整數）' };

  // 開局／結束時間可不填；要填就兩個一起填（HH:MM），結束比開局早＝過了午夜
  var start = trimStr_(payload.start), end = trimStr_(payload.end);
  if (start || end) {
    if (!TIME_RE.test(start) || !TIME_RE.test(end)) return { error: '開局和結束時間要一起填，格式像 19:30' };
    if (start === end) return { error: '開局和結束時間不能一樣' };
  }

  var sum = clean.reduce(function (a, r) { return a + r.amt; }, 0);
  if (sum !== 0) return { error: '帳不平：大家輸贏合計 ' + sum + '，要等於 0' };

  var newPlayers = clean.map(function (r) { return r.name; })
    .filter(function (n) { return state.players.indexOf(n) < 0; });

  return {
    session: { id: date, date: date, rounds: rounds, start: start, end: end, results: clean },
    newPlayers: newPlayers,
    before: before || null,
    by: by
  };
}

// 總覽分頁（人工看用）：A1 日期、每位玩家一列、空一列、將數列
function buildOverview(players, sessions) {
  sessions = labelSessions(sortSessions(sessions.slice()));
  var grid = [['日期'].concat(sessions.map(function (s) { return s.label; }))];
  players.forEach(function (p) {
    grid.push([p].concat(sessions.map(function (s) {
      var r = s.results.filter(function (x) { return x.name === p; })[0];
      return r ? r.amt : '';
    })));
  });
  grid.push([''].concat(sessions.map(function () { return ''; })));
  grid.push(['將數'].concat(sessions.map(function (s) { return s.rounds; })));
  return grid;
}

if (typeof module !== 'undefined') {
  module.exports = { labelSessions: labelSessions, sortSessions: sortSessions, prepareSave: prepareSave, buildOverview: buildOverview };
}
