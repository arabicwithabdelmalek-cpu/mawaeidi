import { copyFile, cp, mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const output = join(root, "mobile-dist");

const rootFiles = [
  "account-page.js",
  "account.js",
  "app-main.js",
  "backup-manager.js",
  "day-order.js",
  "manifest.webmanifest",
  "mobile-app.css",
  "native-bridge.js",
  "sw.js"
];

await mkdir(output, { recursive: true });

for (const file of rootFiles) {
  await copyFile(join(root, file), join(output, file));
}

await cp(join(root, "icons"), join(output, "icons"), { recursive: true });
await cp(join(root, "students"), join(output, "students"), {
  recursive: true,
  filter: source => !source.includes(`${join("students", "tests")}`)
});

const sourceHtml = await readFile(join(root, "index.html"), "utf8");
const mobileHtml = sourceHtml.replace(
  "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.115.0/dist/umd/supabase.min.js",
  "./vendor/supabase.min.js"
);

if (mobileHtml === sourceHtml) {
  throw new Error("Supabase browser bundle reference was not found in index.html");
}

await writeFile(join(output, "index.html"), mobileHtml, "utf8");
await mkdir(join(output, "vendor"), { recursive: true });
await copyFile(
  join(root, "node_modules", "@supabase", "supabase-js", "dist", "umd", "supabase.js"),
  join(output, "vendor", "supabase.min.js")
);

console.log("Prepared the bundled Mawaeidi mobile web app in mobile-dist/.");
