const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");
const { indexedDB, IDBDatabase } = require("fake-indexeddb");
const initSqlJs = require("sql.js");
const cache = new Map();
function load(file) {
  file = path.resolve(file);
  if (cache.has(file)) return cache.get(file);
  const exports = {};
  cache.set(file, exports);
  vm.runInNewContext(
    ts.transpileModule(fs.readFileSync(file, "utf8"), {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
      },
    }).outputText,
    {
      exports,
      Uint8Array,
      Map,
      Set,
      Date,
      Number,
      JSON,
      Error,
      console,
      indexedDB,
      require: (name) =>
        name.startsWith(".")
          ? load(path.resolve(path.dirname(file), name + ".ts"))
          : require(name),
    },
  );
  return exports;
}
const model = load("lib/model.ts"),
  validation = load("lib/validation.ts"),
  codec = load("lib/database.ts"),
  store = load("lib/browser-store.ts"),
  report = load("lib/report.ts"),
  alignment = load("lib/alignment.ts");
const png =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=";
function fixture() {
  const data = model.emptyArchive();
  data.account.onboardingComplete = true;
  data.account.activeProfileId = "p1";
  data.profiles = [
    {
      id: "p1",
      name: "Synthetic profile",
      avatar: "person",
      bodyType: "male",
      createdAt: "2026-09-01T12:00:00Z",
    },
  ];
  data.moles = [
    {
      id: "m1",
      profileId: "p1",
      defaultName: "Test spot",
      bodyRegion: "chest",
      bodyView: "front",
      bodyX: 0.5,
      bodyY: 0.5,
      bodyZ: 0,
      firstNoticedDate: "2026-09-01",
      symptomFlags: [],
      createdAt: "2026-09-01T12:00:00Z",
      updatedAt: "2026-09-01T12:00:00Z",
      photos: [
        {
          id: "photo1",
          moleId: "m1",
          localUri: png,
          capturedAt: "2026-09-01T12:00:00Z",
        },
      ],
      updateLog: [
        {
          id: "log1",
          moleId: "m1",
          timestamp: "2026-09-01T12:00:00Z",
          note: "Synthetic note",
          sizeMm: 4,
        },
      ],
    },
  ];
  return data;
}
let SQL;
test.before(async () => {
  SQL = await initSqlJs();
});
test("SQLite round trip preserves every photo and observation, plus unknown fields", () => {
  const original = fixture();
  original.moles[0].futureNote = "preserve";
  const bytes = codec.encodeDatabase(SQL, original);
  const restored = codec.decodeDatabase(SQL, bytes);
  assert.equal(JSON.stringify(restored), JSON.stringify(original));
});
test("legacy schema migrates without changing records", () => {
  const data = fixture(),
    db = new SQL.Database();
  db.run(
    "CREATE TABLE app_storage (key TEXT PRIMARY KEY NOT NULL,value TEXT NOT NULL)",
  );
  for (const k of ["account", "profiles", "moles"])
    db.run("INSERT INTO app_storage VALUES (?,?)", [
      `@mole_tracker/${k}`,
      JSON.stringify(data[k]),
    ]);
  const restored = codec.decodeDatabase(SQL, db.export());
  assert.equal(JSON.stringify(restored), JSON.stringify(data));
  db.close();
});
test("import rejects triggers, future versions, malformed data and truncated files", () => {
  const data = fixture();
  for (const sql of [
    "CREATE TRIGGER bad AFTER INSERT ON app_storage BEGIN DELETE FROM app_storage; END",
    "PRAGMA user_version=99",
  ]) {
    const db = new SQL.Database(codec.encodeDatabase(SQL, data));
    db.run(sql);
    assert.throws(() => codec.decodeDatabase(SQL, db.export()));
    db.close();
  }
  const db = new SQL.Database(codec.encodeDatabase(SQL, data));
  db.run(
    "UPDATE app_storage SET value='not json' WHERE key='@mole_tracker/moles'",
  );
  assert.throws(() => codec.decodeDatabase(SQL, db.export()));
  db.close();
  assert.throws(() => codec.decodeDatabase(SQL, new Uint8Array(50)));
});
test("domain validation rejects remote media, duplicates, orphan data, invalid dates and ranges", () => {
  const cases = [
    (d) => (d.moles[0].photos[0].localUri = "https://example.org/tracker.png"),
    (d) =>
      (d.moles[0].photos[0].localUri = "data:image/svg+xml;base64,PHN2Zz4="),
    (d) => (d.moles[0].profileId = "missing"),
    (d) => (d.moles[0].photos[0].id = "m1"),
    (d) => (d.moles[0].photos[0].moleId = "missing"),
    (d) => (d.moles[0].firstNoticedDate = "2026-02-30"),
    (d) => (d.moles[0].latestSizeMm = NaN),
    (d) => (d.moles[0].bodyX = 2),
    (d) => (d.account.activeProfileId = "missing"),
  ];
  for (const mutate of cases) {
    const data = fixture();
    mutate(data);
    assert.throws(() => validation.validateArchive(data));
  }
});
test("atomic browser store rejects stale tabs and preserves the old bytes on abort", async () => {
  const first = codec.encodeDatabase(SQL, fixture());
  const revision = await store.writeBytes(first, 0);
  assert.equal(revision, 1);
  const candidate = fixture();
  candidate.moles[0].customName = "New";
  const bytes = codec.encodeDatabase(SQL, candidate);
  const attempts = await Promise.allSettled([
    store.writeBytes(bytes, 1),
    store.writeBytes(first, 1),
  ]);
  assert.equal(attempts.filter((x) => x.status === "fulfilled").length, 1);
  const before = await store.readBytes();
  const original = IDBDatabase.prototype.transaction;
  IDBDatabase.prototype.transaction = function (...args) {
    const tx = original.apply(this, args);
    if (args[1] === "readwrite") queueMicrotask(() => tx.abort());
    return tx;
  };
  try {
    await assert.rejects(store.writeBytes(first, before.revision));
  } finally {
    IDBDatabase.prototype.transaction = original;
  }
  const after = await store.readBytes();
  assert.equal(after.revision, before.revision);
  assert.deepEqual(after.bytes, before.bytes);
  await assert.rejects(store.writeBytes(first, 0), /Another tab/);
});
test("report includes only selected profile records and escapes stored markup", () => {
  const data = fixture();
  data.profiles[0].name = "<script>test</script>";
  data.moles[0].updateLog[0].note = "<img onerror=alert(1)>";
  const other = {
    ...data.moles[0],
    id: "other",
    profileId: "p2",
    defaultName: "EXCLUDED",
  };
  const html = report.buildReport(
    data.profiles[0],
    [data.moles[0], other],
    true,
  );
  assert.ok(!html.includes("<script>"));
  assert.ok(!html.includes("<img onerror"));
  assert.ok(!html.includes("EXCLUDED"));
  assert.ok(html.includes(png));
  assert.ok(!report.buildReport(data.profiles[0], [], true).includes(png));
});
test("affine controls produce identity, rotation, translation and nonsingular shear", () => {
  assert.deepEqual(
    [...alignment.affineMatrix(alignment.identityAlignment)],
    [1, 0, 0, 1, 0, 0],
  );
  const [a, b, c, d, x, y] = alignment.affineMatrix({
    x: 10,
    y: 20,
    rotation: 90,
    scale: 2,
    stretch: 1,
    shear: 0,
  });
  assert.ok(Math.abs(a) < 1e-9 && Math.abs(d) < 1e-9);
  assert.equal(b, 2);
  assert.equal(c, -2);
  assert.equal(x, 10);
  assert.equal(y, 20);
  const m = alignment.affineMatrix({
    ...alignment.identityAlignment,
    shear: 0.5,
  });
  assert.equal(m[0] * m[3] - m[1] * m[2], 1);
  assert.throws(() =>
    alignment.affineMatrix({ ...alignment.identityAlignment, scale: 0 }),
  );
});
