/* Build a standalone review copy. The production entry never imports the fixture. */
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const out = path.resolve(process.argv[2] || path.join(root, 'dist', 'index.html'));
const previewFilename = JSON.stringify('./' + path.basename(out));
let html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const fixture = fs.readFileSync(path.join(root, 'tests/fixtures/design-preview.js'), 'utf8');
html = html.replace(/<script src="https:\/\/cdn\.jsdelivr\.net[^>]+><\/script>/, () => `<script>${fixture}</script>`);
html = html.replace('initApp();', 'initDesignPreview();');
html = html.replace(/<link rel="(?:manifest|icon|apple-touch-icon)"[^>]+>/g, '');
html = html.replace(/<link rel="stylesheet" href="\.\/([^"?]+)(?:\?[^"]*)?">/g, (_, file) => `<style>${fs.readFileSync(path.join(root,file),'utf8')}</style>`);
html = html.replace(/<script src="\.\/([^"?]+)(?:\?[^"]*)?"(?: defer)?><\/script>/g, (_, file) => `<script>${fs.readFileSync(path.join(root,file),'utf8').replace(/<\/script/gi, '<\\/script')}</script>`);
html = html.replace('<title>مواعيدي — الوقت أمانة</title>', '<title>مواعيدي — معاينة التصميم</title>');
// No network permissions or account access in the review copy, even if opened online.
html = html.replace('<head>', '<head>\n<meta http-equiv="Content-Security-Policy" content="connect-src \'none\'; form-action \'none\'; worker-src \'none\'">');
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, html);
fs.writeFileSync(path.join(path.dirname(out),'responsive.html'), `<!doctype html><html lang="ar" dir="rtl"><meta charset="utf-8"><title>فحص أحجام مواعيدي</title><style>body{margin:20px;background:#e6eaec;font-family:Arial,sans-serif}nav{display:flex;gap:12px;margin-bottom:16px}a{padding:8px 16px;border-radius:8px;background:white;color:#234b6e}iframe{display:block;margin:auto;border:1px solid #bac9d2;border-radius:16px;background:white}</style><nav><a href="?width=320">320</a><a href="?width=360">360</a><a href="?width=390">390</a><a href="?width=768">768</a><a href="?width=1024">1024</a><a href="?width=1440">1440</a></nav><iframe id="deviceFrame" title="معاينة مواعيدي" height="844"></iframe><script>const p=new URLSearchParams(location.search),frame=document.querySelector('iframe');frame.width=[320,360,390,768,1024,1440].includes(Number(p.get('width')))?Number(p.get('width')):390;frame.src=${previewFilename}+(p.has('signin')?'?signin':'');</script></html>`);
console.log(`Design preview: ${out}`);
