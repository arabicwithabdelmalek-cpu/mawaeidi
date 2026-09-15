from pathlib import Path

index = Path('index.html')
html = index.read_text(encoding='utf-8')
marker = '/* world-map-silhouette-fix-v19 */'
css = r'''
/* world-map-silhouette-fix-v19 */
.world-map-art{
  position:absolute!important;
  left:20%!important;
  right:auto!important;
  top:9%!important;
  bottom:auto!important;
  width:58%!important;
  height:82%!important;
  opacity:1!important;
  pointer-events:none!important;
  background:transparent!important;
  filter:none!important;
}
.world-map-art img{
  display:block!important;
  width:100%!important;
  height:100%!important;
  object-fit:contain!important;
  object-position:center!important;
  opacity:.12!important;
  filter:grayscale(1) brightness(0) invert(1)!important;
}
@supports ((-webkit-mask-image:url("")) or (mask-image:url(""))){
  .world-map-art{
    background:rgba(255,255,255,.115)!important;
    -webkit-mask-image:url("./icons/world-map.svg")!important;
    mask-image:url("./icons/world-map.svg")!important;
    -webkit-mask-repeat:no-repeat!important;
    mask-repeat:no-repeat!important;
    -webkit-mask-position:center!important;
    mask-position:center!important;
    -webkit-mask-size:contain!important;
    mask-size:contain!important;
  }
  .world-map-art img{display:none!important}
}
@media(max-width:720px){
  .world-map-art{
    left:7%!important;
    top:12%!important;
    width:86%!important;
    height:60%!important;
  }
  .world-map-art img{opacity:.09!important}
  @supports ((-webkit-mask-image:url("")) or (mask-image:url(""))){
    .world-map-art{background:rgba(255,255,255,.09)!important}
  }
}
'''
if marker not in html:
    if '</style>' not in html:
        raise SystemExit('style close tag not found')
    html = html.replace('</style>', css + '\n</style>', 1)
    index.write_text(html, encoding='utf-8')

sw = Path('sw.js')
s = sw.read_text(encoding='utf-8')
s = s.replace('mawaeidi-shell-v18', 'mawaeidi-shell-v19')
if '"./icons/world-map.svg"' not in s:
    s = s.replace('"./icons/icon.svg",', '"./icons/icon.svg",\n  "./icons/world-map.svg",')
sw.write_text(s, encoding='utf-8')
