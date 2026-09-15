from pathlib import Path

index = Path('index.html')
text = index.read_text(encoding='utf-8')
marker = '</head>'
css = '''\n<style id="section-visibility-v31">\n/* Keep main workspaces mutually exclusive even when their component CSS sets display. */\n#scheduleWorkspace[hidden],\n#worldClockView[hidden],\n#financeView[hidden]{display:none!important}\n</style>\n'''
if 'section-visibility-v31' not in text:
    text = text.replace(marker, css + marker, 1)
else:
    raise SystemExit('section visibility v31 already applied')
index.write_text(text, encoding='utf-8')

sw = Path('sw.js')
sw_text = sw.read_text(encoding='utf-8')
if 'mawaeidi-shell-v30' in sw_text:
    sw_text = sw_text.replace('mawaeidi-shell-v30','mawaeidi-shell-v31')
elif 'mawaeidi-shell-v29' in sw_text:
    sw_text = sw_text.replace('mawaeidi-shell-v29','mawaeidi-shell-v31')
elif 'mawaeidi-shell-v31' not in sw_text:
    raise SystemExit('unexpected cache version')
sw.write_text(sw_text, encoding='utf-8')
print('section visibility v31 applied')
