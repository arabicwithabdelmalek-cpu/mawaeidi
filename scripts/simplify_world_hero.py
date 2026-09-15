from pathlib import Path
import re

index = Path('index.html')
text = index.read_text(encoding='utf-8')
original = text

# Remove the large decorative map element entirely.
text = re.sub(r'\n\s*<div class="world-map-art"[^>]*>\s*<img[^>]*>\s*</div>', '', text, count=1)

# Remove obsolete map CSS rules.
text = re.sub(r'\.world-map-art\{[^}]*\}\.world-map-art img\{[^}]*\}\.world-map-grid\{[^}]*\}\.world-map-land\{[^}]*\}\.world-map-land\.soft\{[^}]*\}\n?', '', text, count=1)
text = text.replace('  .world-map-art{inset:10px;opacity:.72}\n', '')

# Make the hero shorter, calmer, and intentionally spacious.
text = re.sub(
    r'(\.world-clock-hero\{[^}]*?)min-height:270px;',
    r'\1min-height:238px;',
    text,
    count=1,
)
text = text.replace(
    '.world-hero-content{position:relative;z-index:2;display:grid;grid-template-columns:minmax(0,1fr) 190px;align-items:center;gap:28px;min-height:270px;padding:29px 34px}',
    '.world-hero-content{position:relative;z-index:2;display:grid;grid-template-columns:minmax(0,680px) 180px;justify-content:space-between;align-items:center;gap:42px;min-height:238px;padding:24px 30px}'
)
text = text.replace('.world-hero-copy{max-width:650px}', '.world-hero-copy{max-width:640px}')
text = text.replace('.world-hero-copy h3{margin:13px 0 5px;font-size:25px;', '.world-hero-copy h3{margin:11px 0 4px;font-size:24px;')
text = text.replace('.world-base-control{display:grid;', '.world-base-control{display:grid;')
text = text.replace('margin-top:16px;', 'margin-top:13px;', 1)
text = text.replace('.world-home-live{display:flex;align-items:baseline;gap:12px;margin-top:14px}', '.world-home-live{display:flex;align-items:baseline;gap:12px;margin-top:11px}')
text = text.replace('.world-home-time{font-size:39px;', '.world-home-time{font-size:37px;')
text = text.replace('width:164px;height:164px;', 'width:154px;height:154px;', 1)

# Keep mobile compact and clean.
text = text.replace('.world-hero-content{grid-template-columns:1fr;min-height:0;padding:21px}', '.world-hero-content{grid-template-columns:1fr;min-height:0;padding:18px}')
text = text.replace('.world-clock-hero{min-height:205px}', '.world-clock-hero{min-height:188px}')

if text == original:
    raise SystemExit('No changes made; anchors may have changed.')

index.write_text(text, encoding='utf-8')

sw = Path('sw.js')
sw_text = sw.read_text(encoding='utf-8')
sw_text = re.sub(r'mawaeidi-shell-v\d+', 'mawaeidi-shell-v20', sw_text, count=1)
sw_text = sw_text.replace('  "./icons/world-map.svg",\n', '')
sw.write_text(sw_text, encoding='utf-8')

map_path = Path('icons/world-map.svg')
if map_path.exists():
    map_path.unlink()
