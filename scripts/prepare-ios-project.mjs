import { copyFile, mkdir, readFile, writeFile, readdir } from "node:fs/promises";
import { join, resolve } from "node:path";
import { execFileSync } from "node:child_process";

const root = resolve(import.meta.dirname, "..");
const project = join(root, "ios", "App", "App");
const mainStoryboard = join(project, "Base.lproj", "Main.storyboard");
const infoPlist = join(project, "Info.plist");

async function required(path) {
  try { return await readFile(path, "utf8"); }
  catch { throw new Error("Missing generated iOS template file: " + path); }
}

await mkdir(project, {recursive: true});
for (const filename of ["MawaeidiAlarmPlugin.swift", "MawaeidiBridgeViewController.swift"]) {
  await copyFile(join(root, "ios-native", filename), join(project, filename));
}

let storyboard = await required(mainStoryboard);
if (!storyboard.includes('customClass="CAPBridgeViewController"')) {
  throw new Error("Capacitor storyboard layout changed; review before registering iOS bridge.");
}
// Preserve every existing storyboard attribute except the bridged view controller class/module.
storyboard = storyboard.replace(
  /customClass="CAPBridgeViewController"(?: customModule="[^"]*")?(?: customModuleProvider="[^"]*")?/,
  'customClass="MawaeidiBridgeViewController" customModule="App" customModuleProvider="target"'
);
await writeFile(mainStoryboard, storyboard, "utf8");

let plist = await required(infoPlist);
if (!plist.includes("<key>CFBundleDisplayName</key>")) {
  plist = plist.replace(/<\/dict>\s*<\/plist>\s*$/,
    "\t<key>CFBundleDisplayName</key>\n\t<string>مواعيدي</string>\n</dict>\n</plist>\n");
}
await writeFile(infoPlist, plist, "utf8");

const iconFolder = join(project, "Assets.xcassets", "AppIcon.appiconset");
await mkdir(iconFolder, {recursive:true});
const output = join(iconFolder, "AppIcon.png");
execFileSync("sips", ["-s", "format", "png", "-z", "1024", "1024",
  join(root, "icons", "icon-512.png"), "--out", output], {stdio:"inherit"});
await writeFile(join(iconFolder, "Contents.json"),
  JSON.stringify({images:[{filename:"AppIcon.png",idiom:"universal",platform:"ios",size:"1024x1024"}],
    info:{author:"xcode",version:1}},null,2)+"\n","utf8");

console.log("iOS Swift bridge, Arabic name, and approved icon added to generated Xcode project.");
