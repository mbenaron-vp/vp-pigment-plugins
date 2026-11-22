"""Build a Pigment frame from readable source, plus the design page that goes with it.

Copy this kit into specs/<client>/frames/, set NAME and TITLE, fill BINDINGS, SOURCES and SINKS
with the app's ids, then run:

    py -3.12 -I build_frame.py [source.js] [--no-lint]

It writes:
    <NAME>.js            the deployed body: story.json inlined at /*STORY_JSON*/{}, real UTF-8, no escapes
    <NAME>_config.json   bindings, data sources and sinks for create_frame
    design.html          artifact-ready design page: the mock SDK in <script id="mock-sdk"> and the frame
                         body in <script id="frame-body">. Publish it with the Artifact tool (private),
                         let Mike restyle it in claude.ai, then bring it back with pull_design.py
    harness.html         the same page with a full HTML skeleton, for tests in the browser pane

The body must pass lint_frame(), a check against Pigment's safe-code rules, or nothing is written.
--no-lint exists only to rebuild an old deployed baseline that predates the lint.
"""
import json
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))

NAME = 'example_frame'        # the source is <NAME>.src.js, the deployed body <NAME>.js
TITLE = 'Example cockpit'     # the frame's name in Pigment; the design page is "<TITLE> design"
STORY_KEYS = ['explain']      # the story.json keys the frame reads; add 'tour' when it has one
PLACEHOLDER = '/*STORY_JSON*/{}'

SRC_PATH = os.path.join(HERE, NAME + '.src.js')
BODY_PATH = os.path.join(HERE, NAME + '.js')
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

# Pigment's safe-code rules (pigment:building-pigment-frames, "Sandboxed runtime" and
# "Writing safe Frame code"), checked line by line. Comments count too: the rules apply to strings and aliases.
BANNED = [
    (r'\bfetch\s*\(', 'network: fetch'),
    (r'XMLHttpRequest', 'network: XMLHttpRequest'),
    (r'WebSocket|RTCPeerConnection', 'network: WebSocket or WebRTC'),
    (r'localStorage|sessionStorage|indexedDB|document\.cookie', 'storage API'),
    (r'@import', 'CSS @import'),
    (r'\burl\s*\(', 'CSS url()'),
    (r'postMessage|MessageChannel|BroadcastChannel', 'cross-frame messaging'),
    (r'\b(window|self|globalThis)\.(top|parent|opener|frames|frameElement)\b', 'window.top / parent'),
    (r'\beval\s*\(|\bnew\s+Function\b', 'eval / new Function'),
    (r'\bimport\s*\(', 'dynamic import'),
    (r'document\.write', 'document.write'),
    (r'\blocation\s*[.=\[]', 'location'),
    (r'history\.(push|replace)State', 'history.pushState'),
    (r'https?://', 'external URL'),
    (r'\\u[0-9a-fA-F]{4}|\\u\{[0-9a-fA-F]+\}|\\x[0-9a-fA-F]{2}', 'escape sequence (\\u or \\x): use the real character'),
    (r'\batob\s*\(|fromCharCode', 'obfuscation: atob / fromCharCode'),
    (r'<script', '<script> in markup'),
    (r'<[a-zA-Z][^>]*\son[a-z]+\s*=', 'inline on*= handler in markup'),
    (r'javascript:', 'javascript: URL'),
    (r'\b(Shared)?Worker\s*\(', 'Web Worker'),
    (r'set(Timeout|Interval)\s*\(\s*[\'"`]', 'string timer'),
    (r'\bnew\s+Proxy\b|\bReflect\.', 'Proxy / Reflect'),
]


def lint_frame(body):
    """Return 'line N: rule' for every line that breaks one of Pigment's safe-code rules."""
    out = []
    for n, line in enumerate(body.split('\n'), 1):
        for pat, rule in BANNED:
            if re.search(pat, line):
                out.append('line %d: %s' % (n, rule))
    return out


def read(path):
    with open(path, encoding='utf-8') as f:
        return f.read()


def write(path, text):
    with open(path, 'w', encoding='utf-8', newline='\n') as f:
        f.write(text)


def inline_story(src):
    """The source with story.json's STORY_KEYS inlined at the placeholder, as real UTF-8."""
    story = json.loads(read(STORY_PATH))
    missing = [k for k in STORY_KEYS if k not in story]
    assert not missing, 'story.json has no ' + ', '.join(missing)
    assert src.count(PLACEHOLDER) == 1, 'the source needs exactly one ' + PLACEHOLDER + ' placeholder'
    return src.replace(PLACEHOLDER, json.dumps({k: story[k] for k in STORY_KEYS},
                                               ensure_ascii=False, separators=(',', ':')))


def build(src_path=None, lint=True):
    """Return the deployable body, or stop if it breaks Pigment's safe-code rules."""
    body = inline_story(read(src_path or SRC_PATH))
    problems = lint_frame(body) if lint else []
    if problems:
        sys.exit('The frame breaks Pigment safe-code rules:\n  ' + '\n  '.join(problems))
    return body


def check_config(body):
    """Stop on a config that can't work; return notes worth reading."""
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
    # every source and sink name must appear in the body as a quoted string
    quoted = lambda n: ("'%s'" % n) in body or ('"%s"' % n) in body
    unused = [x['name'] for x in SOURCES + SINKS if not quoted(x['name'])]
    assert not unused, 'named in the config but not in the body: ' + ', '.join(unused)
    mock = read(os.path.join(HERE, 'mock_sdk.js'))
    no_mock = [s['name'] for s in SOURCES if not re.search(r'\b%s\s*:' % s['name'], mock)]
    if no_mock:
        notes.append('no generator in mock_sdk.js for: ' + ', '.join(no_mock))
    return notes


def design_page(body):
    """Artifact-ready page: the Artifact publisher adds the HTML skeleton around it."""
    assert '</script' not in body.lower(), 'the body contains </script, which would end its script block early'
    mock = read(os.path.join(HERE, 'mock_sdk.js'))
    return ('<title>' + TITLE + ' design</title>\n'
            '<style>html,body{margin:0;background:#f6f8fb;color:#181818}</style>\n'
            '<!-- Design page for a Pigment frame: the real frame code running on mock data.\n'
            '     Restyle anything inside the frame-body script block below: the CSS in its styles section and the\n'
            '     HTML strings in its render functions. Keep element ids, data-* attributes, the data source and sink\n'
            '     names and the SDK calls. Frames run sandboxed: system fonts only (no Google Fonts, @import or CSS\n'
            '     url()), inline SVG for icons and images, no libraries, CDNs or storage, and a light theme. Put all\n'
            '     CSS inside the frame body: a style tag on this page does not deploy. The mock SDK is for this page only. -->\n'
            '<div id="app"></div>\n'
            '<script id="mock-sdk">\n' + mock + '\n</script>\n'
            '<script id="frame-body">\n' + body + '\n</script>\n')


if __name__ == '__main__':
    lint = '--no-lint' not in sys.argv
    args = [a for a in sys.argv[1:] if not a.startswith('--')]
    body = build(args[0] if args else None, lint)
    notes = check_config(body)
    page = design_page(body)
    cfg = {'name': TITLE, 'bindings': BINDINGS, 'dataSources': SOURCES, 'dataSinks': SINKS}

    write(BODY_PATH, body)
    write(os.path.join(HERE, NAME + '_config.json'), json.dumps(cfg, indent=1))
    write(os.path.join(HERE, 'design.html'), page)
    write(os.path.join(HERE, 'harness.html'),
          '<!doctype html><html><head><meta charset="utf-8">'
          '<meta name="viewport" content="width=device-width,initial-scale=1"></head><body>\n' + page + '</body></html>\n')

    size = len(body.encode('utf-8'))
    print('%s.js: %s bytes, so expect bodySizeBytes %s once deployed; %s'
          % (NAME, format(size, ','), format(size, ','), 'lint clean' if lint else 'LINT SKIPPED'))
    print('%d data sources, %d sinks, %d bindings; wrote %s_config.json, design.html, harness.html'
          % (len(SOURCES), len(SINKS), len(BINDINGS), NAME))
    if size > 20000:
        print('Over 20 KB: create the frame with placeholder lines and fill them with update_frame_body '
              '(strings under 20,000 characters); later changes go through deploy_edits.py')
    for n in notes:
        print('Note: ' + n)
