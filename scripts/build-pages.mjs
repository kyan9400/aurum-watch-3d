// Builds the GitHub Pages mirror into out/ (cross-platform, no extra deps).
import { spawnSync } from "node:child_process";
import { writeFileSync, existsSync } from "node:fs";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const nextBin = require.resolve("next/dist/bin/next");

const result = spawnSync(process.execPath, [nextBin, "build"], {
  stdio: "inherit",
  env: { ...process.env, GH_PAGES: "1" },
});
if (result.status !== 0) process.exit(result.status ?? 1);

if (!existsSync("out")) {
  console.error("build:pages: out/ was not created");
  process.exit(1);
}
// stop Jekyll from hiding the _next folder
writeFileSync("out/.nojekyll", "");
console.log("build:pages: out/ ready for GitHub Pages");
