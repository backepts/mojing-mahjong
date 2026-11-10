// 魔競娛樂麻將間主表後端：Web App（任何人可用），讀寫綁定的這張試算表
// 從番仔麻將天梯複製改寫：沒有東錢、沒有付款碼、一天一桌（場次ID＝日期）

var SHEET = {
  results: '對局紀錄',
  tables: '牌桌',
  players: '玩家',
  log: '修改紀錄',
  overview: '總覽'
};
var HEADERS = {
  results: ['場次ID', '日期', '玩家', '輸贏', '寫入時間'],
  tables: ['場次ID', '日期', '將數', '開局', '結束', '寫入時間'],
  players: ['玩家', '加入日期', '造型'],
  log: ['時間', '動作', '場次ID', '場次', '記帳人', '改前', '改後']
};
// 文字欄（避免 Sheets 自動轉日期／時間）
var TEXT_COLS = { results: 'A:B', tables: 'A:B', players: 'B:B', log: 'A:D' };
var TEXT_COLS2 = { results: 'E:E', tables: 'D:F' };

// 戰況回顧的像素造型（玩家分頁 C 欄）；空白＝網頁依名單順序自動配
var STYLES = ['約克夏', '白貓', '凱蒂風白貓', '白底虎斑', '煙灰長毛', '橘白長毛'];
var INITIAL_PLAYERS = [
  ['Beck', '約克夏'], ['Fanny', '白貓'], ['Angel', '凱蒂風白貓'],
  ['MM', '白底虎斑'], ['Luke', '煙灰長毛'], ['Harry', '橘白長毛']
];

function ss_() {
  return SpreadsheetApp.getActiveSpreadsheet();
}

function sheet_(key) {
  var sh = ss_().getSheetByName(SHEET[key]);
  if (!sh) throw new Error('找不到分頁：' + SHEET[key] + '（請先執行 setup）');
  return sh;
}

function rows_(key) {
  var sh = sheet_(key);
  var n = sh.getLastRow() - 1;
  return n > 0 ? sh.getRange(2, 1, n, sh.getLastColumn()).getValues() : [];
}

function readState_() {
  var prows = rows_('players').filter(function (r) { return String(r[0]).trim(); });
  var players = prows.map(function (r) { return String(r[0]).trim(); });
  var styles = {};
  prows.forEach(function (r) { if (r[2] && String(r[2]).trim()) styles[String(r[0]).trim()] = String(r[2]).trim(); });
  var byId = {};
  rows_('tables').forEach(function (r) {
    var id = String(r[0]);
    byId[id] = { id: id, date: String(r[1]), rounds: Number(r[2]), start: String(r[3] || ''), end: String(r[4] || ''), results: [] };
  });
  rows_('results').forEach(function (r) {
    var s = byId[String(r[0])];
    if (s) s.results.push({ name: String(r[2]), amt: Number(r[3]) });
  });
  var sessions = labelSessions(sortSessions(Object.keys(byId).map(function (k) { return byId[k]; })));
  return { players: players, styles: styles, sessions: sessions };
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

// 寫入時間一律存台北時間文字，不受試算表時區影響
function ts_(d) {
  return Utilities.formatDate(d || new Date(), 'Asia/Taipei', 'yyyy-MM-dd HH:mm:ss');
}

// 改某人的造型（Beck 跟 Claude 說要換時用）；空字串＝改回自動配
function setStyle_(payload) {
  var name = String(payload.name || '').trim(), style = String(payload.style || '').trim();
  if (style && STYLES.indexOf(style) < 0) return { ok: false, error: '不認得的造型：' + style };
  var ps = sheet_('players'), n = ps.getLastRow() - 1;
  var names = n > 0 ? ps.getRange(2, 1, n, 1).getValues().map(function (r) { return String(r[0]).trim(); }) : [];
  var i = names.indexOf(name);
  if (i < 0) return { ok: false, error: '找不到玩家：' + name };
  var cell = ps.getRange(i + 2, 3), before = String(cell.getValue());
  cell.setValue(style);
  sheet_('log').appendRow([ts_(), '改造型', '', '', String(payload.by || ''), JSON.stringify({ name: name, style: before }), JSON.stringify({ name: name, style: style })]);
  return { ok: true, name: name, style: style };
}

function doGet() {
  try {
    var st = readState_();
    return json_({ ok: true, players: st.players, styles: st.styles, sessions: st.sessions });
  } catch (err) {
    return json_({ ok: false, error: String(err.message || err) });
  }
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    var payload = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    lock.waitLock(20000);
    if (payload.action === 'style') return json_(setStyle_(payload));
    if (payload.action !== 'save') return json_({ ok: false, error: '不認得的動作' });
    return json_(saveSession_(payload));
  } catch (err) {
    return json_({ ok: false, error: String(err.message || err) });
  } finally {
    lock.releaseLock();
  }
}

function saveSession_(payload) {
  var st = readState_();
  var prep = prepareSave(payload, st);
  if (prep.error) return { ok: false, error: prep.error };
  var s = prep.session, now = new Date(), stamp = ts_(now);

  if (prep.before) deleteSessionRows_(s.id);

  if (prep.newPlayers.length) {
    var today = Utilities.formatDate(now, 'Asia/Taipei', 'yyyy-MM-dd');
    var ps = sheet_('players');
    ps.getRange(ps.getLastRow() + 1, 1, prep.newPlayers.length, 2)
      .setValues(prep.newPlayers.map(function (n) { return [n, today]; }));
  }

  var rs = sheet_('results');
  rs.getRange(rs.getLastRow() + 1, 1, s.results.length, 5)
    .setValues(s.results.map(function (r) { return [s.id, s.date, r.name, r.amt, stamp]; }));
  var ts = sheet_('tables');
  ts.getRange(ts.getLastRow() + 1, 1, 1, 6).setValues([[s.id, s.date, s.rounds, s.start, s.end, stamp]]);

  var after = readState_();
  var saved = after.sessions.filter(function (x) { return x.id === s.id; })[0];
  sheet_('log').appendRow([
    stamp, prep.before ? '修改' : '新增', s.id, saved.label, prep.by,
    prep.before ? JSON.stringify(stripSession_(prep.before)) : '',
    JSON.stringify(stripSession_(saved))
  ]);
  writeOverview_(after);
  return { ok: true, id: s.id, label: saved.label };
}

function stripSession_(s) {
  return { rounds: s.rounds, start: s.start || '', end: s.end || '', results: s.results };
}

function deleteSessionRows_(id) {
  ['results', 'tables'].forEach(function (key) {
    var sh = sheet_(key);
    var ids = rows_(key).map(function (r) { return String(r[0]); });
    for (var i = ids.length - 1; i >= 0; i--) if (ids[i] === id) sh.deleteRow(i + 2);
  });
}

function writeOverview_(st) {
  var grid = buildOverview(st.players, st.sessions);
  var sh = ss_().getSheetByName(SHEET.overview) || ss_().insertSheet(SHEET.overview);
  sh.clearContents();
  sh.getRange(1, 1, 1, sh.getMaxColumns()).setNumberFormat('@');
  sh.getRange(1, 1, grid.length, grid[0].length).setValues(grid);
  sh.setFrozenRows(1);
  sh.setFrozenColumns(1);
}

// 第一次手動執行：建分頁＋表頭＋初始玩家（含造型）；同時讓 Google 跳出授權。重複執行不會蓋掉資料
function setup() {
  var ss = ss_();
  ss.setSpreadsheetTimeZone('Asia/Taipei');
  Object.keys(HEADERS).forEach(function (key) {
    var sh = ss.getSheetByName(SHEET[key]);
    if (!sh) {
      var blank = ss.getSheets().filter(function (x) { return x.getLastRow() === 0 && Object.keys(SHEET).every(function (k) { return SHEET[k] !== x.getName(); }); })[0];
      sh = blank ? blank.setName(SHEET[key]) : ss.insertSheet(SHEET[key]);
    }
    sh.getRange(TEXT_COLS[key]).setNumberFormat('@');
    if (TEXT_COLS2[key]) sh.getRange(TEXT_COLS2[key]).setNumberFormat('@');
    if (sh.getLastRow() === 0) {
      sh.getRange(1, 1, 1, HEADERS[key].length).setValues([HEADERS[key]]).setFontWeight('bold');
      sh.setFrozenRows(1);
    }
  });
  var ps = ss.getSheetByName(SHEET.players);
  if (ps.getLastRow() === 1) {
    var today = Utilities.formatDate(new Date(), 'Asia/Taipei', 'yyyy-MM-dd');
    ps.getRange(2, 1, INITIAL_PLAYERS.length, 3).setValues(INITIAL_PLAYERS.map(function (p) { return [p[0], today, p[1]]; }));
  }
  writeOverview_(readState_());
  Logger.log('setup 完成：' + ss.getUrl());
}
