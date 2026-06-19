import { existsSync } from "node:fs";
import { spawnSync } from "node:child_process";

const port = process.env.PORT || process.env.WEBSITES_PORT || "8080";

console.log("[GameDash] Azure startup", {
  port,
  node: process.version,
  cwd: process.cwd(),
  distExists: existsSync("dist"),
  indexExists: existsSync("dist/index.html"),
  serveInstalled: existsSync("node_modules/serve"),
});

if (!existsSync("dist/index.html")) {
  console.error("[GameDash] dist/index.html missing — run npm run build first");
  process.exit(1);
}

const result = spawnSync("npx", ["serve", "-s", "dist", "-l", port], {
  stdio: "inherit",
  shell: true,
});

process.exit(result.status ?? 1);
