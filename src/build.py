# Builds index.html from the template + the logo/loader/credit snippets.
# Run from the repo root:  python3 src/build.py
from pathlib import Path
s = Path('src')
t = (s/'index.template.html').read_text()
for k in ['DEFS', 'NEXLYR', 'CLOUDS']:
    t = t.replace('{{%s}}' % k, (s/(k.lower() + '.html')).read_text())
Path('index.html').write_text(t)
print('index.html built,', len(t), 'bytes')
