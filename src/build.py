# Builds index.html and junior.html from their templates + the logo/loader/credit snippets.
# Run from the repo root:  python3 src/build.py
from pathlib import Path
s = Path('src')
for name in ['index', 'junior']:
    t = (s/(name + '.template.html')).read_text()
    for k in ['DEFS', 'NEXLYR', 'CLOUDS']:
        t = t.replace('{{%s}}' % k, (s/(k.lower() + '.html')).read_text())
    Path(name + '.html').write_text(t)
    print(name + '.html built,', len(t), 'bytes')
