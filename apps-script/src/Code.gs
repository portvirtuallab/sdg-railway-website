/**
 * SDG Railway – quotation back end (v8).
 *
 * The website (GitHub Pages) calls this web app. Prices, routes and trains are calculated by
 * RailEngine (Engine.gs, generated from src/engine in the website repository: do not edit it here).
 * Master data and every operation live in this Google Sheet.
 *
 *   GET  ?action=catalogue            public master data (tabs listed in RailEngine.PUBLIC_TABS)
 *   POST {action:'options', request}  price and first train for every service (not logged)
 *   POST {action:'quote', request, requote?}   issue a quote or a new version  → QUOTE_LOG + PDF
 *   POST {action:'accept', pin, ref, version}  accept a quote                  → BOOKINGS
 *   POST {action:'orders', pin, bookingRef, orders}  terminal delivery/collection orders
 *   POST {action:'list', pin}         the team's quotes and bookings (trainer code: all)
 *
 * "pin" is the team's access code, checked against the ACCESS_CODES tab. A quote request with a
 * code that is not in the list gets an example quote (reference EXAMPLE) that is not recorded.
 *
 * POST bodies are sent as text/plain JSON so browsers do not need a CORS preflight.
 */

var V8 = {
  TAB_LOG: 'QUOTE_LOG',
  TAB_BOOKINGS: 'BOOKINGS',
  TAB_CODES: 'ACCESS_CODES',
  TAB_HISTORY: 'HISTORY',
  CACHE_KEY: 'v8_catalogue',
};

// ---------------------------------------------------------------- entry points

function doGet(e) {
  var action = (e && e.parameter && e.parameter.action) || 'catalogue';
  return respond_(function () {
    if (action === 'catalogue') return { tables: publicTables_() };
    if (action === 'health') return { ok: true, version: 'v8' };
    throw userError_('Unknown action: ' + action);
  });
}

function doPost(e) {
  return respond_(function () {
    var body = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    switch (body.action) {
      case 'options':
        return apiOptions_(body);
      case 'quote':
        return apiQuote_(body);
      case 'accept':
        return apiAccept_(body);
      case 'orders':
        return apiOrders_(body);
      case 'list':
        return apiList_(body);
      default:
        throw userError_('Unknown action: ' + body.action);
    }
  });
}

function onOpen() {
  try {
    SpreadsheetApp.getUi()
      .createMenu('Railway Quoter')
      .addItem('Set up v8 (adds tabs and columns, never deletes)', 'setupV8')
      .addItem('Clear server cache', 'clearServerCacheV8')
      .addToUi();
  } catch (err) {
    // No UI when run from a trigger or the web app.
  }
}

function clearServerCacheV8() {
  CacheService.getScriptCache().removeAll([V8.CACHE_KEY, 'config_v2', 'scheduleData_v3']);
  return 'Cache cleared.';
}

// ---------------------------------------------------------------- API

function apiOptions_(body) {
  var cat = catalogue_();
  var req = body.request;
  return { options: RailEngine.serviceOptions(cat, req, capacityUsage_()) };
}

function apiQuote_(body) {
  var cat = catalogue_();
  var req = body.request;
  var team = teamByPin_(req && req.pin);
  if (!team) {
    if (body.requote) throw userError_(CODE_ERROR, 'pin');
    // Unknown code: show what the offer would look like, but record nothing.
    var example = RailEngine.buildQuote(cat, req, {
      ref: RailEngine.EXAMPLE_REF,
      version: 1,
      now: new Date(),
      usage: capacityUsage_(),
      team: 'Example – no valid access code',
    });
    return example.ok ? { quote: example.quote, example: true } : { errors: example.errors };
  }

  req.pin = team.pin;
  var lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    var now = new Date();
    var ref, version;
    if (body.requote) {
      var prev = findQuote_(body.requote.ref, null);
      if (
        !prev ||
        (RailEngine.normaliseCode(prev.quote.request.pin) !== team.pin && team.role !== 'trainer')
      )
        throw userError_('Quote ' + body.requote.ref + ' was not found for this team.');
      ref = prev.quote.ref;
      version = maxVersion_(ref) + 1;
    } else {
      ref = nextRef_(V8.TAB_LOG, 1, cat.config.quotePrefix);
      version = 1;
    }
    var result = RailEngine.buildQuote(cat, req, {
      ref: ref,
      version: version,
      now: now,
      usage: capacityUsage_(),
      team: team.name,
    });
    if (!result.ok) return { errors: result.errors };
    var quote = result.quote;

    if (version > 1) setQuoteStatus_(ref, null, 'SUPERSEDED', 'ISSUED');
    var pdf = createPdf_(quote, cat, null);
    appendLog_(quote, team, pdf.fileId);
    history_('QUOTE', ref, version, team.pin, quote.total + ' ' + quote.currency);
    return { quote: quote, pdfUrl: pdf.url };
  } finally {
    lock.releaseLock();
  }
}

function apiAccept_(body) {
  var cat = catalogue_();
  var team = teamByPin_(body.pin);
  if (!team) throw userError_(CODE_ERROR, 'pin');
  var lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    var found = findQuote_(body.ref, body.version);
    if (
      !found ||
      (RailEngine.normaliseCode(found.quote.request.pin) !== team.pin && team.role !== 'trainer')
    )
      throw userError_('Quote ' + body.ref + ' v' + body.version + ' was not found for this team.');
    var quote = found.quote;
    quote.status =
      String(found.status).toLowerCase() === 'issued'
        ? 'issued'
        : String(found.status).toLowerCase();
    var bookingRef = nextRef_(V8.TAB_BOOKINGS, 1, cat.config.bookingPrefix);
    var booking;
    try {
      booking = RailEngine.acceptQuote(cat, quote, {
        bookingRef: bookingRef,
        now: new Date(),
        usage: capacityUsage_(),
      });
    } catch (err) {
      throw userError_(err.message);
    }
    quote.status = 'accepted';
    var handoff = RailEngine.buildHandoff(cat, quote, booking);
    appendBooking_(booking, quote, team, handoff);
    setQuoteStatus_(quote.ref, quote.version, 'ACCEPTED', null, booking.ref);
    history_('ACCEPT', quote.ref, quote.version, team.pin, booking.ref + ' ' + booking.status);
    return { booking: booking, quote: quote, handoff: handoff };
  } finally {
    lock.releaseLock();
  }
}

function apiOrders_(body) {
  var team = teamByPin_(body.pin);
  if (!team) throw userError_(CODE_ERROR, 'pin');
  var sheet = sheet_(V8.TAB_BOOKINGS);
  var data = sheet.getDataRange().getValues();
  var h = headerIndex_(data[0]);
  for (var r = 1; r < data.length; r++) {
    if (String(data[r][h.BookingRef]) !== String(body.bookingRef)) continue;
    if (
      RailEngine.normaliseCode(String(data[r][h.TeamPIN])) !== team.pin &&
      team.role !== 'trainer'
    )
      break;
    var o = body.orders || {};
    var set = function (col, v) {
      sheet.getRange(r + 1, h[col] + 1).setValue(String(v || '').slice(0, 80));
    };
    set('DeliveryDriver', o.deliveryDriver);
    set('DeliveryVehicle', o.deliveryVehicle);
    set('CollectionDriver', o.collectionDriver);
    set('CollectionVehicle', o.collectionVehicle);
    history_('ORDERS', body.bookingRef, '', team.pin, 'Terminal orders updated');
    return { ok: true };
  }
  throw userError_('Booking ' + body.bookingRef + ' was not found for this team.');
}

function apiList_(body) {
  var team = teamByPin_(body.pin);
  if (!team) throw userError_(CODE_ERROR, 'pin');
  var all = team.role === 'trainer';
  var quotes = readQuotes_().filter(function (q) {
    return all || RailEngine.normaliseCode(q.quote.request.pin) === team.pin;
  });
  var bookings = readBookings_().filter(function (b) {
    return all || RailEngine.normaliseCode(b.pin) === team.pin;
  });
  return {
    team: { name: team.name, role: team.role },
    quotes: quotes.map(function (q) {
      q.quote.status = q.status.toLowerCase();
      return q.quote;
    }),
    bookings: bookings.map(function (b) {
      return b.booking;
    }),
  };
}

// ---------------------------------------------------------------- catalogue

function publicTables_() {
  var cache = CacheService.getScriptCache();
  var hit = cache.get(V8.CACHE_KEY);
  if (hit) return JSON.parse(hit);
  var tables = {};
  RailEngine.PUBLIC_TABS.forEach(function (name) {
    tables[name] = table_(name);
  });
  // Internal settings stay private.
  tables.CONFIG = tables.CONFIG.filter(function (r) {
    return ['PdfFolderId', 'SpreadsheetId'].indexOf(String(r.Parameter)) < 0;
  });
  var json = JSON.stringify(tables);
  if (json.length < 95000) cache.put(V8.CACHE_KEY, json, 60);
  return tables;
}

function catalogue_() {
  return RailEngine.buildCatalogue(publicTables_());
}

// ---------------------------------------------------------------- sheet helpers

function sheet_(name) {
  var s = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(name);
  if (!s) throw new Error('Tab ' + name + ' not found. Run Railway Quoter > Set up v8.');
  return s;
}

/** Tab as objects. Dates become text: 1899 dates are times (HH:mm), others YYYY-MM-DD. */
function table_(name) {
  var s = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(name);
  if (!s) return [];
  var values = s.getDataRange().getValues();
  if (values.length < 2) return [];
  var headers = values[0].map(function (x) {
    return String(x || '').trim();
  });
  var tz = Session.getScriptTimeZone();
  var rows = [];
  for (var r = 1; r < values.length; r++) {
    var row = values[r];
    if (row.every(function (v) { return v === '' || v === null; })) continue; // prettier-ignore
    var o = {};
    for (var c = 0; c < headers.length; c++) {
      if (!headers[c]) continue;
      var v = row[c];
      if (v instanceof Date)
        v = Utilities.formatDate(v, tz, v.getFullYear() < 1901 ? 'HH:mm' : 'yyyy-MM-dd');
      o[headers[c]] = v;
    }
    rows.push(o);
  }
  return rows;
}

function headerIndex_(headerRow) {
  var h = {};
  headerRow.forEach(function (name, i) {
    if (String(name).trim()) h[String(name).trim()] = i;
  });
  return h;
}

var CODE_ERROR = 'This access code is not in the SDG Railway list. Check it with your trainer.';

/** Team for an access code of the ACCESS_CODES tab (active rows only), or null. */
function teamByPin_(pin) {
  if (!RailEngine.isCodeFormat(String(pin || ''))) return null;
  var code = RailEngine.normaliseCode(pin);
  var rows = table_(V8.TAB_CODES);
  for (var i = 0; i < rows.length; i++) {
    var t = rows[i];
    if (RailEngine.normaliseCode(String(t.Code)) === code && RailEngine.toBool(t.Active, true))
      return {
        pin: code,
        name: String(t.Team || 'Team ' + code),
        role: String(t.Role || 'student').toLowerCase(),
      };
  }
  return null;
}

/** Next reference such as RWQ00000196 (8 digits, continues the v7 numbering). Call under lock. */
function nextRef_(tabName, column, prefix) {
  var s = sheet_(tabName);
  var last = s.getLastRow();
  var max = 0;
  if (last >= 2) {
    var re = new RegExp('^' + prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '(\\d{8})$');
    s.getRange(2, column, last - 1, 1)
      .getValues()
      .forEach(function (row) {
        var m = String(row[0]).match(re);
        if (m) max = Math.max(max, parseInt(m[1], 10));
      });
  }
  return prefix + String(max + 1).padStart(8, '0');
}

function maxVersion_(ref) {
  var max = 0;
  readLogRows_().forEach(function (r) {
    if (r.ref === ref) max = Math.max(max, r.version);
  });
  return max;
}

function readLogRows_() {
  var s = sheet_(V8.TAB_LOG);
  var data = s.getDataRange().getValues();
  var h = headerIndex_(data[0]);
  var out = [];
  for (var r = 1; r < data.length; r++) {
    out.push({
      row: r + 1,
      ref: String(data[r][h.QuoteRef]),
      version: Number(data[r][h.Version]) || 1,
      status: String(data[r][h.Status] || ''),
      pin: h.TeamPIN === undefined ? '' : String(data[r][h.TeamPIN]),
      json: String(data[r][h.BreakdownJSON] || ''),
    });
  }
  return out;
}

/** v8 quotes only (rows with a TeamPIN and the full quote in BreakdownJSON). */
function readQuotes_() {
  var out = [];
  readLogRows_().forEach(function (r) {
    if (!r.pin) return;
    try {
      var q = JSON.parse(r.json);
      if (q && q.ref) out.push({ quote: q, status: r.status, row: r.row });
    } catch (err) {
      // Not a v8 row.
    }
  });
  return out;
}

function findQuote_(ref, version) {
  var list = readQuotes_().filter(function (q) {
    return q.quote.ref === ref && (version === null || q.quote.version === Number(version));
  });
  if (!list.length) return null;
  list.sort(function (a, b) {
    return b.quote.version - a.quote.version;
  });
  return list[0];
}

function setQuoteStatus_(ref, version, status, onlyIfStatus, bookingRef) {
  var s = sheet_(V8.TAB_LOG);
  var data = s.getDataRange().getValues();
  var h = headerIndex_(data[0]);
  for (var r = 1; r < data.length; r++) {
    if (String(data[r][h.QuoteRef]) !== ref) continue;
    if (version !== null && (Number(data[r][h.Version]) || 1) !== Number(version)) continue;
    if (onlyIfStatus && String(data[r][h.Status]) !== onlyIfStatus) continue;
    s.getRange(r + 1, h.Status + 1).setValue(status);
    if (bookingRef && h.BookingRef !== undefined)
      s.getRange(r + 1, h.BookingRef + 1).setValue(bookingRef);
    var json = String(data[r][h.BreakdownJSON] || '');
    try {
      var q = JSON.parse(json);
      q.status = status.toLowerCase();
      s.getRange(r + 1, h.BreakdownJSON + 1).setValue(JSON.stringify(q));
    } catch (err) {
      // Leave v7 rows untouched.
    }
  }
}

/** Units booked per train (confirmed bookings only). */
function capacityUsage_() {
  var usage = {};
  table_(V8.TAB_BOOKINGS).forEach(function (b) {
    if (String(b.Status) !== 'confirmed' || !b.TrainID) return;
    usage[b.TrainID] = (usage[b.TrainID] || 0) + (Number(b.Units) || 0);
  });
  return usage;
}

function readBookings_() {
  var orders = function (b) {
    return {
      deliveryDriver: String(b.DeliveryDriver || ''),
      deliveryVehicle: String(b.DeliveryVehicle || ''),
      collectionDriver: String(b.CollectionDriver || ''),
      collectionVehicle: String(b.CollectionVehicle || ''),
    };
  };
  return table_(V8.TAB_BOOKINGS).map(function (b) {
    return {
      pin: String(b.TeamPIN),
      booking: {
        ref: String(b.BookingRef),
        quoteRef: String(b.QuoteRef),
        quoteVersion: Number(b.Version) || 1,
        status: String(b.Status),
        createdAt: String(b.Timestamp),
        train: {
          status: String(b.Status) === 'confirmed' ? 'proposed' : 'pending',
          trainId: String(b.TrainID || ''),
          serviceId: String(b.ServiceID || ''),
          serviceName: String(b.ServiceID || ''),
          originTerminalId: String(b.OriginTerminal || ''),
          departure: String(b.Departure || '') || null,
          cutOff: String(b.CutOff || '') || null,
          arrival: String(b.Arrival || '') || null,
          slotsLeft: null,
          reason:
            String(b.Status) === 'confirmed' ? null : 'Train pending confirmation by SDG Railway.',
        },
        terminalOrders: orders(b),
      },
    };
  });
}

// ---------------------------------------------------------------- writing

function appendLog_(quote, team, pdfFileId) {
  var s = sheet_(V8.TAB_LOG);
  var h = headerIndex_(s.getRange(1, 1, 1, s.getLastColumn()).getValues()[0]);
  var r = quote.request;
  var cat = catalogue_();
  var term = function (id) {
    return RailEngine.terminalById(cat, id) || { countryCode: '' };
  };
  var values = {
    QuoteRef: quote.ref,
    Timestamp: new Date(),
    OriginTerminal: quote.route.originTerminal,
    DestTerminal: quote.route.destinationTerminal,
    OriginCountry: term(quote.route.originTerminal).countryCode,
    DestCountry: term(quote.route.destinationTerminal).countryCode,
    Mode: quote.route.mode,
    PathTerminals: quote.route.pathIds.join(' > '),
    DistanceKm: quote.route.distanceKm,
    TransitMin: quote.route.transitMin,
    ServiceID: quote.service.id,
    ServiceLevel: quote.service.level,
    UTIType: r.utiType,
    DG: r.dangerousGoods ? 'YES' : 'NO',
    ADRClass: r.dangerousGoods ? r.dangerousGoods.adrClass : '',
    Units: r.quantity,
    WeightKg: r.grossWeightKg,
    BaseCost: quote.rail.baseFreight,
    SurchargesTotal: quote.rail.surchargesTotal,
    Insurance: quote.rail.insurance,
    TotalCost: quote.total,
    BreakdownJSON: JSON.stringify(quote),
    ContactEmail: '',
    Company: team.name,
    Status: 'ISSUED',
    PdfFileId: pdfFileId || '',
    Version: quote.version,
    TeamPIN: text_(team.pin),
    Requester: r.requester,
    Shipper: r.shipper,
    Consignee: r.consignee,
    Incoterm: r.incoterm,
    OriginPlace: RailEngine.placeName(cat, r.origin),
    DestinationPlace: RailEngine.placeName(cat, r.destination),
    ReadyDate: text_(r.readyDate),
    TrainID: quote.train.trainId,
    Departure: text_(quote.train.departure || ''),
    Arrival: text_(quote.train.arrival || ''),
    DeliveryEstimate: text_(quote.deliveryEstimate || ''),
    RoadTotal: quote.roadTotal,
    ValidUntil: text_(quote.expiresAt),
    BookingRef: '',
  };
  s.appendRow(rowFor_(h, values));
}

function appendBooking_(booking, quote, team, handoff) {
  var s = sheet_(V8.TAB_BOOKINGS);
  var h = headerIndex_(s.getRange(1, 1, 1, s.getLastColumn()).getValues()[0]);
  s.appendRow(
    rowFor_(h, {
      BookingRef: booking.ref,
      Timestamp: new Date(),
      QuoteRef: quote.ref,
      Version: quote.version,
      TeamPIN: text_(team.pin),
      Team: team.name,
      Status: booking.status,
      TrainID: booking.train.trainId,
      ServiceID: quote.service.id,
      OriginTerminal: quote.route.originTerminal,
      DestTerminal: quote.route.destinationTerminal,
      Departure: text_(booking.train.departure),
      CutOff: text_(booking.train.cutOff),
      Arrival: text_(booking.train.arrival),
      Units: quote.request.quantity,
      HandoffJSON: JSON.stringify(handoff),
    }),
  );
}

/** Leading apostrophe: Sheets keeps the value as text (dates, PINs with leading zeros). */
function text_(v) {
  return v === null || v === undefined || v === '' ? '' : "'" + v;
}

function history_(action, ref, version, pin, details) {
  var s = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(V8.TAB_HISTORY);
  if (s) s.appendRow([new Date(), action, ref, version, text_(pin), details]);
}

function rowFor_(h, values) {
  var width = 0;
  Object.keys(h).forEach(function (k) {
    width = Math.max(width, h[k] + 1);
  });
  var row = new Array(width).fill('');
  Object.keys(values).forEach(function (k) {
    if (h[k] !== undefined) row[h[k]] = values[k];
  });
  return row;
}

// ---------------------------------------------------------------- PDF

function createPdf_(quote, cat, booking) {
  var tpl = HtmlService.createTemplateFromFile('QuotePdf');
  tpl.q = quote;
  tpl.cfg = cat.config;
  tpl.booking = booking;
  tpl.places = {
    origin: RailEngine.placeName(cat, quote.request.origin),
    destination: RailEngine.placeName(cat, quote.request.destination),
    path: quote.route.pathIds.map(function (id) {
      var t = RailEngine.terminalById(cat, id);
      return t ? t.name + ' (' + t.city + ', ' + t.countryCode + ')' : id;
    }),
  };
  var blob = tpl
    .evaluate()
    .getAs(MimeType.PDF)
    .setName(quote.ref + (quote.version > 1 ? '-v' + quote.version : '') + '.pdf');
  var folderId = '';
  table_('CONFIG').forEach(function (r) {
    if (String(r.Parameter) === 'PdfFolderId') folderId = String(r.Value || '').trim();
  });
  var folder = null;
  if (folderId) {
    try {
      folder = DriveApp.getFolderById(folderId);
    } catch (err) {
      folder = null;
    }
  }
  var file = (folder || DriveApp.getRootFolder()).createFile(blob);
  return { fileId: file.getId(), url: file.getUrl() };
}

// ---------------------------------------------------------------- responses

function userError_(message, field) {
  var e = new Error(message);
  e.userError = true;
  e.field = field || 'route';
  return e;
}

function respond_(fn) {
  var out;
  try {
    out = fn();
  } catch (err) {
    out =
      err && err.userError
        ? { errors: [{ field: err.field, code: 'required', message: err.message }] }
        : { fatal: 'The quotation service failed: ' + (err && err.message ? err.message : err) };
  }
  return ContentService.createTextOutput(JSON.stringify(out)).setMimeType(
    ContentService.MimeType.JSON,
  );
}
