# Builds index.html and junior.html from their templates.
# The navbar, footer and chat (src/nav.html, foot.html, chat.html) are shared, so both pages always match.
# Run from the repo root:  python3 src/build.py
from pathlib import Path
s = Path('src')
for name in ['index', 'junior']:
    t = (s/(name + '.template.html')).read_text()
    for k in ['NAV', 'FOOT', 'CHAT', 'DEFS', 'NEXLYR', 'CLOUDS']:
        f = s/(k.lower() + '.html')
        t = t.replace('{{%s}}' % k, f.read_text() if f.exists() else '')
    Path(name + '.html').write_text(t)
    print(name + '.html built,', len(t), 'bytes')
