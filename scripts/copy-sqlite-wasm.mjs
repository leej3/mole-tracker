import { copyFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const source = resolve(root, "node_modules/sql.js/dist/sql-wasm.wasm");
const destination = resolve(root, "public/sql-wasm.wasm");

mkdirSync(dirname(destination), { recursive: true });
copyFileSync(source, destination);
