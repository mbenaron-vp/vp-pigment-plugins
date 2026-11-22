"""Build the Reconomy group review inbox frame (design page first; deploy later).

py -3.12 -I build_inbox.py
  -> review_inbox.js           deployable body (UTF-8, no escapes, linted against Pigment's safe-code rules)
  -> review_inbox_config.json  bindings, data sources and sinks for create_frame
  -> design.html               artifact-ready design page (mock SDK + frame body)
  -> harness.html              the same page in a full HTML skeleton, for file:// tests
"""
import json, os, sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.dirname(HERE))
from build_frame import lint_frame  # noqa: E402  (the cockpit's lint, one rule set for every frame)

L = lambda name, lid: {'type': 'List', 'name': name, 'listId': lid}
M = lambda name, mid: {'type': 'Metric', 'name': name, 'metricId': mid}
LP = lambda name, lid, tech: {'type': 'ListProperty', 'name': name, 'listId': lid, 'listPropertyTechnicalName': tech}
ENTITY, SCHEME = 'fb8eebb9-af77-4fef-a6be-c363c6efa4e4', '401c68e6-5838-4006-9d52-96fc187b72e9'
bindings = [
    L('versionList', '7237b9e3-c111-4989-9813-67a2b34be6df'),
    L('entityList', ENTITY),
    L('stageList', '968faf24-d0e6-4b6d-be89-bfc3dd15cd32'),
    L('schemeList', SCHEME),
    L('sectorList', '80f19255-3af4-4a7a-88c0-f796c7120a1f'),
    L('plLineList', '5f4546e3-5ea8-4d57-9f05-c572e540ba28'),
    # Dimension-typed list properties; look up the technical names at deploy (search_metrics_and_lists does not return them)
    LP('pSchemeEntity', SCHEME, 'entity_VJ7N2Z'),   # Scheme.Entity
    LP('pEntityLoop', ENTITY, '_loop_17PFVA'),     # Entity.Loop
    M('mWfStatus', 'fea9d168-7762-4dd0-837f-7231f604ff9d'),
    M('mWfComment', 'fc838987-d786-4e58-8b05-8579f88e3017'),
    M('mWfOwner', '53d6b17a-e34f-4499-b274-97048e67b5f0'),
    M('mWfReturn', '6e69bdbb-bb9f-44b7-87bb-c90ef80f0a05'),
    M('mPLR12', '32222d3b-d04e-4091-86c8-86f04afa04d0'),
    M('mCsRevR12', '8c26b5a5-a963-4633-b730-fb693ebda278'),
    M('mCsGpR12', '34444823-22bf-4948-b1ab-158fa1e437cd'),
    M('mMsRevR12', 'cabe83df-837f-4191-97f9-f8ab72ba42b5'),
    M('mMsGpR12', 'f0039da3-fc7f-4d4b-bb27-caf9a23fa7e5'),
    M('mMsIncR12', '657d85c0-dbe5-404b-89e9-7b2831a19415'),
    M('mMsRecR12', '9324581a-7766-479e-a5bd-f3a744527267'),
]
def ds(name, labels, selectors, values):
    return {'name': name, 'labels': [{'binding': b} for b in labels], 'selectors': [{'binding': b} for b in selectors], 'values': [{'binding': b} for b in values]}
sources = [
    ds('dsWFS', ['entityList', 'stageList'], [], ['mWfStatus']),                                   # dimension values
    ds('dsWFC', ['entityList', 'stageList'], [], ['mWfComment', 'mWfOwner', 'mWfReturn']),           # text values
    ds('dsEnt', ['entityList', 'plLineList', 'versionList'], ['versionList'], ['mPLR12']),
    ds('dsSch', ['schemeList', 'versionList'], ['versionList'], ['mCsRevR12', 'mCsGpR12']),
    ds('dsMS', ['sectorList', 'versionList'], ['versionList'], ['mMsRevR12', 'mMsGpR12', 'mMsIncR12', 'mMsRecR12']),
    ds('dsSchEnt', ['schemeList'], [], ['pSchemeEntity']),   # list source, unsubscribed once loaded
    ds('dsEntLoop', ['entityList'], [], ['pEntityLoop']),    # list source, unsubscribed once loaded
]
sinks = [{'name': n, 'binding': b} for n, b in [('statusSink', 'mWfStatus'), ('returnSink', 'mWfReturn')]]

def design_page(body, title='Reconomy Review Inbox'):
    mock = open(os.path.join(HERE, 'mock_sdk.js'), encoding='utf-8').read()
    return ('<title>' + title + '</title>\n'
            '<style>html,body{margin:0;background:#f4f7fa;color:#10283a}</style>\n'
            '<!-- Design page for a Pigment frame: the real frame body runs on a mock SDK. Restyle the styles section and render\n'
            '     strings in the frame-body block; keep ids, data-* attributes, data source and sink names and the SDK calls.\n'
            '     Frames cannot load fonts, images or libraries: system fonts and inline SVG only. -->\n'
            '<div id="app"></div>\n'
            '<script id="mock-sdk">\n' + mock + '\n</script>\n'
            '<script id="frame-body">\n' + body + '\n</script>\n')

if __name__ == '__main__':
    body = open(os.path.join(HERE, 'review_inbox.src.js'), encoding='utf-8').read()
    problems = lint_frame(body)
    if problems:
        sys.exit('Frame breaks Pigment safe-code rules:\n  ' + '\n  '.join(problems))
    for s in sources:
        assert "'" + s['name'] + "'" in body, s['name']
    for k in sinks:
        assert "'" + k['name'] + "'" in body, k['name']
    open(os.path.join(HERE, 'review_inbox.js'), 'w', encoding='utf-8', newline='\n').write(body)
    cfg = {'name': 'Reconomy review inbox', 'bindings': bindings, 'dataSources': sources, 'dataSinks': sinks}
    json.dump(cfg, open(os.path.join(HERE, 'review_inbox_config.json'), 'w', encoding='utf-8'), indent=1)
    page = design_page(body)
    open(os.path.join(HERE, 'design.html'), 'w', encoding='utf-8', newline='\n').write(page)
    open(os.path.join(HERE, 'harness.html'), 'w', encoding='utf-8', newline='\n').write(
        '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body>\n' + page + '</body></html>\n')
    print('body bytes', len(body.encode('utf-8')), 'sources', len(sources), 'sinks', len(sinks), 'bindings', len(bindings), 'lint clean')
