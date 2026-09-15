from pathlib import Path
import re

index = Path('index.html')
text = index.read_text(encoding='utf-8')

marker = '<style id="world-clock-spacing-v25">'
if marker not in text:
    css = r'''
<style id="world-clock-spacing-v25">
/* World clock v25 — spacing calibration + converter action contrast */
.world-hero-content-v2{
  max-width:none!important;
  width:100%!important;
  grid-template-columns:minmax(0,1fr) 430px!important;
  gap:32px!important;
  padding:20px 48px!important;
}
.world-hero-copy-v2{
  max-width:680px!important;
  justify-self:start!important;
}
.world-hero-now{
  min-width:0!important;
  justify-self:end!important;
  justify-content:flex-end!important;
  gap:18px!important;
}
.world-convert-actions{
  gap:10px!important;
}
.world-convert-actions button{
  min-height:42px!important;
}
.world-convert-actions .secondary{
  background:#2A6179!important;
  border-color:#2A6179!important;
  color:#fff!important;
  box-shadow:0 3px 10px rgba(24,79,103,.10)!important;
}
.world-convert-actions .secondary:hover{
  background:#214F64!important;
  border-color:#214F64!important;
  color:#fff!important;
}
@media(max-width:1200px){
  .world-hero-content-v2{
    grid-template-columns:minmax(0,1fr) 350px!important;
    gap:24px!important;
    padding:20px 28px!important;
  }
  .world-hero-now{justify-content:flex-end!important}
}
@media(max-width:760px){
  .world-hero-content-v2{
    grid-template-columns:1fr!important;
    gap:15px!important;
    padding:17px!important;
  }
  .world-hero-copy-v2,.world-hero-now{justify-self:stretch!important}
  .world-hero-now{justify-content:initial!important}
}
</style>
'''
    if '</head>' not in text:
        raise SystemExit('Missing </head>')
    text = text.replace('</head>', css + '\n</head>', 1)
    index.write_text(text, encoding='utf-8')

sw = Path('sw.js')
sw_text = sw.read_text(encoding='utf-8')
sw_text, count = re.subn(r'mawaeidi-shell-v\d+', 'mawaeidi-shell-v25', sw_text, count=1)
if count != 1:
    raise SystemExit('Could not bump service worker cache')
sw.write_text(sw_text, encoding='utf-8')
