from pathlib import Path
import re

index = Path('index.html')
text = index.read_text(encoding='utf-8')

# Replace the hand-drawn inline world map with the downloaded professional SVG asset.
pattern = re.compile(r'<div class="world-map-art" aria-hidden="true"><svg\b.*?</svg></div>', re.S)
replacement = '<div class="world-map-art" aria-hidden="true"><img src="./icons/world-map.svg" alt="" decoding="async"></div>'
text, count = pattern.subn(replacement, text, count=1)
if count != 1:
    raise SystemExit(f'expected exactly one inline world map, replaced {count}')

# Tune map presentation for the dark hero without touching the rest of the clock UI.
text = re.sub(
    r'\.world-map-art\{[^}]*\}',
    '.world-map-art{position:absolute;inset:12px 205px 12px 16px;opacity:1;pointer-events:none;overflow:hidden}',
    text,
    count=1,
)
text = re.sub(
    r'\.world-map-art\s+svg\{[^}]*\}',
    '.world-map-art img{width:100%;height:100%;display:block;object-fit:contain;object-position:center;filter:grayscale(1) brightness(2.1) contrast(.82);opacity:.17;mix-blend-mode:screen}',
    text,
    count=1,
)
# Handle an already-img selector if a previous partial patch exists.
if '.world-map-art img{' not in text:
    marker = '.world-hero-content{'
    if marker not in text:
        raise SystemExit('world hero css marker not found')
    text = text.replace(marker, '.world-map-art img{width:100%;height:100%;display:block;object-fit:contain;object-position:center;filter:grayscale(1) brightness(2.1) contrast(.82);opacity:.17;mix-blend-mode:screen}' + marker, 1)

# Keep the map usable on narrow screens without crowding the clock content.
mobile_marker = '  .world-hero-content{grid-template-columns:1fr'
if mobile_marker in text and '  .world-map-art{inset:10px 10px 10px 10px;opacity:.72}' not in text:
    text = text.replace(mobile_marker, '  .world-map-art{inset:10px;opacity:.72}\n' + mobile_marker, 1)

index.write_text(text, encoding='utf-8')

sw = Path('sw.js')
sw_text = sw.read_text(encoding='utf-8')
if 'mawaeidi-shell-v17' not in sw_text:
    raise SystemExit('expected PWA cache v17 not found')
sw_text = sw_text.replace('mawaeidi-shell-v17', 'mawaeidi-shell-v18', 1)
if '"./icons/world-map.svg"' not in sw_text:
    sw_text = sw_text.replace('  "./icons/icon.svg",', '  "./icons/icon.svg",\n  "./icons/world-map.svg",', 1)
sw.write_text(sw_text, encoding='utf-8')
