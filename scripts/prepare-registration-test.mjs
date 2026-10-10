import { mkdirSync, cpSync, writeFileSync } from "node:fs";
import { build } from "esbuild";
mkdirSync(".build/test-site", { recursive: true });
cpSync("public/registration", ".build/test-site/registration", {
  recursive: true,
});
writeFileSync(
  ".build/test-site/index.html",
  '<!doctype html><meta charset="utf-8"><title>Masked registration regression</title><style>body{font:18px system-ui;max-width:900px;margin:48px auto}button{padding:14px}pre{white-space:pre-wrap}</style><h1>ITKElastix browser regression</h1><p>Synthetic images only. No uploads.</p><button id="run">Run masked registration tests</button><pre id="results">Ready</pre><script type="module" src="/test.js"></script>',
);
await build({
  entryPoints: ["tests/registration-browser.ts"],
  outfile: ".build/test-site/test.js",
  bundle: true,
  format: "esm",
  platform: "browser",
});
await build({
  entryPoints: ["tests/registration-fixture.ts"],
  outfile: ".build/registration-fixture.mjs",
  bundle: true,
  format: "esm",
  platform: "node",
});
const { pair } = await import("../.build/registration-fixture.mjs");
const { deflateSync } = await import("node:zlib");
function crc32(data) {
  let c = 0xffffffff;
  for (const b of data) {
    c ^= b;
    for (let j = 0; j < 8; j++) c = (c >>> 1) ^ (c & 1 ? 0xedb88320 : 0);
  }
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const t = Buffer.from(type),
    size = Buffer.alloc(4),
    crc = Buffer.alloc(4);
  size.writeUInt32BE(data.length);
  crc.writeUInt32BE(crc32(Buffer.concat([t, data])));
  return Buffer.concat([size, t, data, crc]);
}
function png(image) {
  const header = Buffer.alloc(13);
  header.writeUInt32BE(image.width, 0);
  header.writeUInt32BE(image.height, 4);
  header[8] = 8;
  header[9] = 2;
  const bytes = Buffer.alloc((image.width * 3 + 1) * image.height);
  for (let y = 0; y < image.height; y++)
    for (let x = 0; x < image.width; x++) {
      const v = Math.max(
          0,
          Math.min(255, Math.round(image.pixels[y * image.width + x] * 255)),
        ),
        i = y * (image.width * 3 + 1) + 1 + x * 3;
      bytes[i] = v;
      bytes[i + 1] = v;
      bytes[i + 2] = v;
    }
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", header),
    chunk("IDAT", deflateSync(bytes)),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}
const { fixed, moving } = pair(true),
  photos = [fixed, moving].map((im, i) => {
    const data = png(im);
    writeFileSync(`.build/synthetic-skin-${i}.png`, data);
    return {
      id: `photo-${i}`,
      moleId: "test-spot",
      localUri: `data:image/png;base64,${data.toString("base64")}`,
      capturedAt: `2026-10-0${i + 1}T12:00:00Z`,
    };
  });
const SQL = await (await import("sql.js")).default(),
  db = new SQL.Database();
db.run(
  "CREATE TABLE app_storage (key TEXT PRIMARY KEY NOT NULL,value TEXT NOT NULL)",
);
const data = {
  account: {
    onboardingComplete: true,
    disclaimerAccepted: true,
    reminderMonthlyEnabled: false,
    passcodeEnabled: false,
    activeProfileId: "test-profile",
  },
  profiles: [
    {
      id: "test-profile",
      name: "Synthetic alignment test",
      avatar: "person",
      bodyType: "male",
      createdAt: "2026-10-01T12:00:00Z",
    },
  ],
  moles: [
    {
      id: "test-spot",
      profileId: "test-profile",
      defaultName: "Synthetic skin pair",
      bodyRegion: "chest",
      bodyView: "front",
      bodyX: 0.5,
      bodyY: 0.5,
      bodyZ: 0,
      firstNoticedDate: "2026-10-01",
      symptomFlags: [],
      createdAt: "2026-10-01T12:00:00Z",
      updatedAt: "2026-10-02T12:00:00Z",
      photos,
      updateLog: [],
    },
  ],
};
for (const [key, value] of Object.entries(data))
  db.run("INSERT INTO app_storage VALUES (?,?)", [
    "@mole_tracker/" + key,
    JSON.stringify(value),
  ]);
writeFileSync(".build/synthetic-alignment.sqlite", db.export());
db.close();
