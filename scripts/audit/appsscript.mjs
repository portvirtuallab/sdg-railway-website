// Recover the user HTML served by a Google Apps Script web app (/exec page) without executing it.
// Usage: node appsscript.mjs <exec.html> <out.html>
import fs from 'node:fs';
const [, , inp, out] = process.argv;
const src = fs.readFileSync(inp, 'utf8');
const start = src.indexOf('goog.script.init("');
if (start < 0) throw new Error('goog.script.init not found');
let i = start + 'goog.script.init("'.length;
let lit = '';
for (; i < src.length; i++) {
  const c = src[i];
  if (c === '\\') {
    lit += c + src[i + 1];
    i++;
    continue;
  }
  if (c === '"') break;
  lit += c;
}
const unescapeJs = (s) =>
  s.replace(/\\(x[0-9a-fA-F]{2}|u[0-9a-fA-F]{4}|.)/g, (_, e) => {
    if (e[0] === 'x' || (e[0] === 'u' && e.length === 5))
      return String.fromCharCode(parseInt(e.slice(1), 16));
    return { n: '\n', t: '\t', r: '\r', b: '\b', f: '\f', v: '\v', 0: '\0' }[e] ?? e;
  });
const json = JSON.parse(unescapeJs(lit));
fs.writeFileSync(out, json.userHtml);
console.log('keys:', Object.keys(json).join(', '), '| userHtml bytes:', json.userHtml.length);
