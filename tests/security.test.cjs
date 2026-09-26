const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

function load(file, dependencies = {}) {
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText;
  const exports = {};
  vm.runInNewContext(code, { exports, require: (name) => {
    if (!(name in dependencies)) throw new Error(`Unexpected dependency ${name}`);
    return dependencies[name];
  }});
  return exports;
}
const scoring = load('utils/scoring.ts');
const { buildHtml } = load('utils/bodyMapHtml.ts', { '@/utils/scoring': scoring });
const mole = { id: 'test', bodyX: 0.5, bodyY: 0.5, bodyRegion: 'chest', bodyView: 'front', defaultName: 'test', symptomFlags: [], updateLog: [] };

test('record names cannot terminate the embedded script', () => {
  const payload = '</script><script>parent.stolen = true</script>';
  const html = buildHtml([{ ...mole, customName: payload }], true, '#123456', '#ffffff', '#eeeeee');
  assert.equal((html.match(/<script>/g) || []).length, 1);
  assert.equal((html.match(/<\/script>/g) || []).length, 1);
  assert.ok(!html.includes(payload));
  new vm.Script(html.match(/<script>([\s\S]*?)<\/script>/)[1]);
});

test('SVG labels and attributes escape stored markup; unrelated senders are ignored', () => {
  const payload = '"><img src=x onerror=alert(1)>';
  const html = buildHtml([{ ...mole, customName: payload, id: payload }], true, '#123456', '#ffffff', '#eeeeee');
  const elements = new Map();
  const getElement = (id) => {
    if (!elements.has(id)) elements.set(id, {
      style: {}, innerHTML: '', textContent: '', className: '',
      querySelectorAll: () => [], addEventListener() {},
      getBoundingClientRect: () => ({ width: 100, height: 220, top: 0, left: 0 }),
      getAttribute: () => '0 0 100 220',
    });
    return elements.get(id);
  };
  const parent = { postMessage() {} };
  let onMessage;
  const window = { parent, addEventListener: (type, handler) => { onMessage = handler; } };
  vm.runInNewContext(html.match(/<script>([\s\S]*?)<\/script>/)[1], {
    window, document: { getElementById: getElement, querySelectorAll: () => [] },
  });
  onMessage({ source: {}, data: { type: 'selectPart', bodyPart: 'chest' } });
  assert.equal(getElement('det-svg-wrap').innerHTML, '');
  onMessage({ source: parent, data: { type: 'selectPart', bodyPart: 'chest' } });
  const svg = getElement('det-svg-wrap').innerHTML;
  assert.ok(svg.includes('&lt;img'));
  assert.ok(!svg.includes('<img'));
  assert.ok(!svg.includes('data-id=""><'));
});

test('empty observations remain unknown and legacy scoring does not reorder history', () => {
  const record = { ...mole, updateLog: [
    { timestamp: '2026-02-01', sizeMm: 4 }, { timestamp: '2026-01-01', sizeMm: 3 },
  ] };
  assert.equal(scoring.getABCDESummary(record).border, 'Not recorded');
  assert.equal(scoring.getABCDESummary(record).color, 'Not recorded');
  const before = JSON.stringify(record.updateLog);
  scoring.calculateConcernScore(record);
  assert.equal(JSON.stringify(record.updateLog), before);
});
