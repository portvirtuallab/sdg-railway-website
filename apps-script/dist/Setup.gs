/**
 * Railway Quoter > Set up v8. Safe to run more than once: it only ADDS what is missing
 * (tabs, header columns, CONFIG parameters, seed rows in new tabs). It never clears, reorders or
 * overwrites existing data. Seed data comes from Seed.gs (generated from apps-script/seed/v8-seed.json).
 */
function setupV8() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var done = [];

  // 1. SURCHARGES A1 must be "SurchargeCode": without it the codes are lost (PDF shows "()")
  //    and the first-match families (DOCS-, TERM-TAX-O-, ...) do not work.
  var sur = ss.getSheetByName('SURCHARGES');
  if (sur && String(sur.getRange(1, 1).getValue()).trim() === '') {
    sur.getRange(1, 1).setValue('SurchargeCode');
    done.push('SURCHARGES: header A1 set to SurchargeCode');
  }

  // 2. CONFIG parameters.
  var cfg = ss.getSheetByName('CONFIG');
  if (cfg) {
    var have = cfg
      .getRange(1, 1, Math.max(1, cfg.getLastRow()), 1)
      .getValues()
      .map(function (r) {
        return String(r[0]).trim();
      });
    V8_SEED.config.forEach(function (row) {
      if (have.indexOf(row[0]) < 0) {
        cfg.appendRow(row);
        done.push('CONFIG: ' + row[0] + ' = ' + row[1]);
      }
    });
  }

  // 3. New columns at the end of existing tabs.
  Object.keys(V8_SEED.addColumns).forEach(function (tab) {
    var s = ss.getSheetByName(tab);
    if (!s) return;
    var headers = s
      .getRange(1, 1, 1, Math.max(1, s.getLastColumn()))
      .getValues()[0]
      .map(function (h) {
        return String(h).trim();
      });
    V8_SEED.addColumns[tab].forEach(function (name) {
      if (headers.indexOf(name) >= 0) return;
      var col = lastHeaderColumn_(headers) + 1;
      s.getRange(1, col).setValue(name).setFontWeight('bold');
      headers[col - 1] = name;
      done.push(tab + ': column ' + name);
    });
  });

  // 4. Fill new columns only where the cell is empty.
  Object.keys(V8_SEED.fillColumns).forEach(function (tab) {
    var spec = V8_SEED.fillColumns[tab];
    var s = ss.getSheetByName(tab);
    if (!s) return;
    var data = s.getDataRange().getValues();
    var h = headerIndex_(data[0]);
    for (var r = 1; r < data.length; r++) {
      var values = spec.rows[String(data[r][h[spec.key]])];
      if (!values) continue;
      Object.keys(values).forEach(function (col) {
        if (h[col] === undefined || data[r][h[col]] !== '') return;
        s.getRange(r + 1, h[col] + 1).setValue(values[col]);
      });
    }
  });

  // 5. New tabs with their seed rows (only when the tab does not exist yet).
  Object.keys(V8_SEED.newTabs).forEach(function (tab) {
    if (ss.getSheetByName(tab)) return;
    var spec = V8_SEED.newTabs[tab];
    var s = ss.insertSheet(tab);
    s.getRange(1, 1, 1, spec.headers.length).setValues([spec.headers]).setFontWeight('bold');
    s.setFrozenRows(1);
    if (spec.rows.length) {
      // PINs and IDs as text so leading zeros survive.
      s.getRange(2, 1, spec.rows.length, spec.headers.length).setNumberFormat('@');
      s.getRange(2, 1, spec.rows.length, spec.headers.length).setValues(spec.rows);
    }
    s.setTabColor('#2a7d40');
    done.push(
      'New tab ' + tab + (spec.rows.length ? ' with ' + spec.rows.length + ' example rows' : ''),
    );
  });
  var codes = ss.getSheetByName('ACCESS_CODES');
  if (codes) codes.getRange('A:A').setNumberFormat('@');

  clearServerCacheV8();
  var msg = done.length
    ? 'Set up v8:\n- ' + done.join('\n- ')
    : 'Nothing to add: the Sheet is already set up for v8.';
  try {
    SpreadsheetApp.getUi().alert(msg);
  } catch (err) {
    Logger.log(msg);
  }
  return msg;
}

function lastHeaderColumn_(headers) {
  for (var i = headers.length - 1; i >= 0; i--) if (headers[i]) return i + 1;
  return 0;
}
