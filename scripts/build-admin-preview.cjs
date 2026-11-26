const fs=require("node:fs"),path=require("node:path");
const root=path.resolve(__dirname,".."),out=path.join(root,"admin-preview-dist");
fs.mkdirSync(out,{recursive:true});
let html=fs.readFileSync(path.join(root,"admin.html"),"utf8");
const remote=/<script src="https:\/\/cdn\.jsdelivr\.net\/[^"]+" defer><\/script>/;
if(!remote.test(html))throw Error("Expected admin SDK script missing");
html=html.replace(remote,'<script src="./admin-demo-fixture.js" defer></script>');
html=html.replace("<head>","<head>\n<meta http-equiv=\"Content-Security-Policy\" content=\"default-src 'self'; connect-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data:; object-src 'none'; form-action 'none'; base-uri 'none'\">");
html=html.replace('<main class="shell">','<main class="shell"><p class="notice" style="margin:0 0 14px;background:#e6f4ef;color:#176c63">نسخة مراجعة — جميع الحسابات والزيارات افتراضية، وعمليات التعديل معطلة.</p>');
html=html.replaceAll('href="https://arabicwithabdelmalek-cpu.github.io/mawaeidi/"','href="./index.html"');
for(const m of html.matchAll(/(?:src|href)="\.\/([^"?#]+)(?:\?[^"]*)?"/g)){const f=m[1];if(f==="index.html"||f==="admin-demo-fixture.js")continue;const dest=path.join(out,f);fs.mkdirSync(path.dirname(dest),{recursive:true});fs.copyFileSync(path.join(root,f),dest)}
fs.copyFileSync(path.join(root,"tests/fixtures/admin-demo-fixture.js"),path.join(out,"admin-demo-fixture.js"));
fs.writeFileSync(path.join(out,"index.html"),html);
