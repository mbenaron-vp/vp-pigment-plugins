"""Build a Pigment frame from readable source.

Copy this kit into specs/<client>/frames/, set NAME and TITLE, fill BINDINGS,
SOURCES and SINKS with the app's ids, then run:

    py -3.12 -I build_frame.py

It writes:
    <NAME>.js            the deployed body: story.json inlined at /*STORY_JSON*/{}, ASCII only
    <NAME>_config.json   bindings, data sources and sinks for create_frame
    harness.html         mock SDK and body in one page; open it from file:// in the browser pane

It stops (AssertionError) if a check fails, before writing anything.
"""
import json
import os
import re

HERE = os.path.dirname(os.path.abspath(__file__))

NAME = 'example_frame'        # the source is <NAME>.src.js
TITLE = 'Example cockpit'     # the frame's name in Pigment
STORY_KEYS = ['explain']      # the story.json keys the frame reads; add 'tour' when it has one

# story.json lives in the client folder (one up from frames/); the kit's sample sits next to this script
STORY_PATH = next(p for p in (os.path.join(os.path.dirname(HERE), 'story.json'),
                              os.path.join(HERE, 'story.json')) if os.path.exists(p))


def L(name, list_id):
    return {'type': 'List', 'name': name, 'listId': list_id}


def M(name, metric_id):
    return {'type': 'Metric', 'name': name, 'metricId': metric_id}


# Ids from the app (search_metrics_and_lists). Lists xxxList, metrics mXxx.
BINDINGS = [
    L('regionList', '00000000-0000-0000-0000-000000000001'),
    L('versionList', '00000000-0000-0000-0000-000000000002'),
    M('mRevenue', '00000000-0000-0000-0000-000000000011'),
    M('mGrossProfit', '00000000-0000-0000-0000-000000000012'),
    M('mGrowth', '00000000-0000-0000-0000-000000000013'),
]


def ds(name, labels, selectors, values):
    return {'name': name,
            'labels': [{'binding': b} for b in labels],
            'selectors': [{'binding': b} for b in selectors],
            'values': [{'binding': b} for b in values]}


# Data sources dsXxx: labels (list bindings, in order), selectors (lists the frame filters on), values.
# One value type per source: a text or dimension property needs its own source.
SOURCES = [
    ds('dsRegion', ['regionList', 'versionList'], ['versionList'], ['mRevenue', 'mGrossProfit', 'mGrowth']),
]

# Sinks xxxSink: each binding must be a metric or list that accepts input.
SINKS = [{'name': n, 'binding': b} for n, b in [
    ('growthSink', 'mGrowth'),
]]


def ascii_escape(text):
    """Escape every non-ASCII character as \\uXXXX (a surrogate pair outside the BMP)."""
    out = []
    for c in text:
        o = ord(c)
        if o < 128:
            out.append(c)
        elif o <= 0xFFFF:
            out.append('\\u%04x' % o)
        else:
            o -= 0x10000
            out.append('\\u%04x\\u%04x' % (0xD800 + (o >> 10), 0xDC00 + (o & 0x3FF)))
    return ''.join(out)


def stored_bytes(body):
    """The bodySizeBytes Pigment reports: it stores each non-ASCII \\uXXXX escape as the real character."""
    pair = re.compile(r'\\u(d[89ab][0-9a-f]{2})\\u(d[c-f][0-9a-f]{2})', re.I)
    s = pair.sub(lambda m: chr(0x10000 + ((int(m.group(1), 16) - 0xD800) << 10)
                               + (int(m.group(2), 16) - 0xDC00)), body)
    s = re.sub(r'\\u([0-9a-f]{4})',
               lambda m: chr(int(m.group(1), 16)) if int(m.group(1), 16) >= 0x80 else m.group(0), s, flags=re.I)
    return len(s.encode('utf-8', 'surrogatepass'))


def read(path):
    with open(path, encoding='utf-8') as f:
        return f.read()


def write(path, text, encoding='utf-8'):
    with open(path, 'w', encoding=encoding, newline='\n') as f:
        f.write(text)


# ---- body ----
src = read(os.path.join(HERE, NAME + '.src.js'))
story = json.loads(read(STORY_PATH))
missing_keys = [k for k in STORY_KEYS if k not in story]
assert not missing_keys, 'story.json has no ' + ', '.join(missing_keys)
assert src.count('/*STORY_JSON*/{}') == 1, 'the source needs exactly one /*STORY_JSON*/{} placeholder'
story_js = json.dumps({k: story[k] for k in STORY_KEYS}, ensure_ascii=True, separators=(',', ':'))
body = ascii_escape(src.replace('/*STORY_JSON*/{}', story_js))
assert '/*STORY_JSON*/' not in body
body.encode('ascii')  # raises if anything non-ASCII is left

# ---- config ----
names = {b['name'] for b in BINDINGS}
notes = []
for s in SOURCES:
    for part in ('labels', 'selectors', 'values'):
        for b in s[part]:
            assert b['binding'] in names, '%s uses %s, which is not in BINDINGS' % (s['name'], b['binding'])
    for b in s['selectors']:
        if b['binding'] not in [x['binding'] for x in s['labels']]:
            notes.append('%s filters on %s, which is not one of its labels: the mock can only filter on labels'
                         % (s['name'], b['binding']))
for k in SINKS:
    assert k['binding'] in names, '%s writes to %s, which is not in BINDINGS' % (k['name'], k['binding'])
cfg = {'name': TITLE, 'bindings': BINDINGS, 'dataSources': SOURCES, 'dataSinks': SINKS}

# ---- every source and sink name must appear in the body as a quoted string ----
def quoted(n):
    return ("'%s'" % n) in body or ('"%s"' % n) in body


unused = [s['name'] for s in SOURCES if not quoted(s['name'])] + [k['name'] for k in SINKS if not quoted(k['name'])]
assert not unused, 'named in the config but not in the body: ' + ', '.join(unused)

# ---- harness ----
mock = read(os.path.join(HERE, 'mock_sdk.js'))
no_mock = [s['name'] for s in SOURCES if not re.search(r'\b%s\s*:' % s['name'], mock)]
assert '</script' not in body.lower(), 'the body contains </script, which would break harness.html'
html = ('<!doctype html><html><head><meta charset="utf-8">'
        '<meta name="viewport" content="width=device-width,initial-scale=1">'
        '<title>' + TITLE + ' harness</title><style>body{margin:0}</style></head>'
        '<body><div id="app"></div><script>\n' + mock + '\n</script><script>\n' + body + '\n</script></body></html>')

# ---- write ----
write(os.path.join(HERE, NAME + '.js'), body, encoding='ascii')
write(os.path.join(HERE, NAME + '_config.json'), json.dumps(cfg, indent=1))
write(os.path.join(HERE, 'harness.html'), html)

size = len(body.encode('ascii'))
print('%s.js: %s bytes; Pigment will report bodySizeBytes %s' % (NAME, format(size, ','), format(stored_bytes(body), ',')))
print('%d data sources, %d sinks, %d bindings' % (len(SOURCES), len(SINKS), len(BINDINGS)))
if size > 20000:
    print('Over 20 KB: create with placeholder lines and send in chunks (frames.md, "Delivering through the MCP")')
if no_mock:
    notes.append('no generator in mock_sdk.js for: ' + ', '.join(no_mock))
for n in notes:
    print('Note: ' + n)
