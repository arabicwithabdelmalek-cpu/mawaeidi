from pathlib import Path
import re

index = Path('index.html')
text = index.read_text(encoding='utf-8')
original = text

# Add a small, low-contrast world map watermark inside the hero.
hero_anchor = '<section class="world-clock-hero">\n      <div class="world-hero-content">'
replacement = '<section class="world-clock-hero">\n      <div class="world-map-watermark" aria-hidden="true"><img src="./icons/world-map.svg" alt="" decoding="async"></div>\n      <div class="world-hero-content">'
if hero_anchor not in text:
    raise SystemExit('Hero anchor not found')
text = text.replace(hero_anchor, replacement, 1)

css_anchor = '.world-clock-hero::after{content:"";position:absolute;inset:auto -8% -54% auto;width:390px;height:390px;border:1px solid rgba(255,255,255,.10);border-radius:50%;box-shadow:0 0 0 48px rgba(255,255,255,.018),0 0 0 96px rgba(255,255,255,.014);pointer-events:none}\n'
map_css = '.world-map-watermark{position:absolute;z-index:1;left:50%;top:50%;width:min(30vw,440px);transform:translate(-50%,-50%);pointer-events:none;opacity:.11}.world-map-watermark img{display:block;width:100%;height:auto;filter:brightness(0) invert(1);opacity:1}\n'
if css_anchor not in text:
    raise SystemExit('CSS anchor not found')
text = text.replace(css_anchor, css_anchor + map_css, 1)

# Tone down the decorative ring so it does not compete with the map.
text = text.replace('border:1px solid rgba(255,255,255,.10);border-radius:50%;box-shadow:0 0 0 48px rgba(255,255,255,.018),0 0 0 96px rgba(255,255,255,.014)', 'border:1px solid rgba(255,255,255,.055);border-radius:50%;box-shadow:0 0 0 48px rgba(255,255,255,.010),0 0 0 96px rgba(255,255,255,.008)', 1)

# Mobile: keep the map as a very faint accent, not a dominant block.
mobile_anchor = '  .world-hero-content{grid-template-columns:1fr;min-height:0;padding:18px}.world-analog-clock{display:none}'
mobile_replacement = '  .world-map-watermark{width:72%;opacity:.055;left:48%;top:54%}\n  .world-hero-content{grid-template-columns:1fr;min-height:0;padding:18px}.world-analog-clock{display:none}'
if mobile_anchor not in text:
    raise SystemExit('Mobile anchor not found')
text = text.replace(mobile_anchor, mobile_replacement, 1)

if text == original:
    raise SystemExit('No index changes made')
index.write_text(text, encoding='utf-8')

sw = Path('sw.js')
sw_text = sw.read_text(encoding='utf-8')
sw_text = re.sub(r'mawaeidi-shell-v\d+', 'mawaeidi-shell-v21', sw_text, count=1)
if '"./icons/world-map.svg"' not in sw_text:
    sw_text = sw_text.replace('  "./icons/icon.svg",\n', '  "./icons/icon.svg",\n  "./icons/world-map.svg",\n', 1)
sw.write_text(sw_text, encoding='utf-8')
