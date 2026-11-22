"""Build the Reconomy world frame (a 3D globe driven by the model's Country, Loop and Scheme properties).

py -3.12 -I build_world.py
  -> world.js           deployable body (UTF-8, no escapes, passes the Pigment safe-code lint)
  -> world_config.json  bindings and data sources for create_frame (read only: no sinks)
  -> design.html        artifact-ready design page (mock SDK + frame body)
  -> harness.html       the same page with a full HTML skeleton, for file:// tests

List-property bindings carry listPropertyTechnicalName 'TODO_TECHNICAL_NAME': look the technical
names up in Pigment before create_frame (see README.md).
"""
import json, os, sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.dirname(HERE))
from build_frame import lint_frame  # noqa: E402  (parent cockpit build script: same safe-code rules)

TODO = 'TODO_TECHNICAL_NAME'
ENTITY, SCHEME, STATUS = 'fb8eebb9-af77-4fef-a6be-c363c6efa4e4', '401c68e6-5838-4006-9d52-96fc187b72e9', '616c0585-19eb-48ff-b7d7-1f3aab137ff9'
L = lambda name, lid: {'type': 'List', 'name': name, 'listId': lid}
TN = {'entLoop': '_loop_17PFVA', 'entCurrency': 'currency_FPXSRL', 'entCountry': 'country_Z2FTY4', 'entMethod': 'planning_method_6PVZ4B', 'schEntity': 'entity_VJ7N2Z', 'schCountry': 'country_ESWYB9', 'schStream': 'stream_MH3AGY', 'statusProgress': 'progress_19M29E'}  # list-property technical names, read with get_list_items (22 Nov 2026)
LP = lambda name, lid: {'type': 'ListProperty', 'name': name, 'listId': lid, 'listPropertyTechnicalName': TN[name]}
M = lambda name, mid: {'type': 'Metric', 'name': name, 'metricId': mid}
bindings = [
    L('versionList', '7237b9e3-c111-4989-9813-67a2b34be6df'),
    L('entityList', ENTITY),
    L('schemeList', SCHEME),
    L('stageList', '968faf24-d0e6-4b6d-be89-bfc3dd15cd32'),
    L('currencyList', 'b90df34d-1588-455c-98ae-376308ed3ff1'),
    L('plLineList', '5f4546e3-5ea8-4d57-9f05-c572e540ba28'),
    L('statusList', STATUS),
    LP('entLoop', ENTITY), LP('entCurrency', ENTITY), LP('entCountry', ENTITY), LP('entMethod', ENTITY),
    LP('schEntity', SCHEME), LP('schCountry', SCHEME), LP('schStream', SCHEME),
    LP('statusProgress', STATUS),
    M('mPLR12', '32222d3b-d04e-4091-86c8-86f04afa04d0'),
    M('mCsRevR12', '8c26b5a5-a963-4633-b730-fb693ebda278'),
    M('mCsGpR12', '34444823-22bf-4948-b1ab-158fa1e437cd'),
    M('mFx', '460ef88a-2ef9-4a71-8603-f8ecb51cf3a7'),
    M('mWfStatus', 'fea9d168-7762-4dd0-837f-7231f604ff9d'),
    M('mWfComment', 'fc838987-d786-4e58-8b05-8579f88e3017'),
    M('mWfOwner', '53d6b17a-e34f-4499-b274-97048e67b5f0'),
    M('mWfReturn', '6e69bdbb-bb9f-44b7-87bb-c90ef80f0a05'),
]
def ds(name, labels, selectors, values):
    return {'name': name, 'labels': [{'binding': b} for b in labels], 'selectors': [{'binding': b} for b in selectors], 'values': [{'binding': b} for b in values]}
sources = [
    ds('dsEntP', ['entLoop', 'entCurrency', 'entityList'], [], ['entCountry', 'entMethod']),       # list source: Entity (text values)
    ds('dsSchP', ['schEntity', 'schemeList'], [], ['schCountry', 'schStream']),                     # list source: Scheme (text values)
    ds('dsStat', ['statusList'], [], ['statusProgress']),                                           # list source: Workflow Status (number)
    ds('dsEnt', ['entityList', 'plLineList', 'versionList'], ['versionList'], ['mPLR12']),
    ds('dsSch', ['schemeList', 'versionList'], ['versionList'], ['mCsRevR12', 'mCsGpR12']),
    ds('dsFX', ['currencyList', 'versionList'], ['versionList'], ['mFx']),
    ds('dsWFS', ['entityList', 'stageList'], [], ['mWfStatus']),
    ds('dsWFC', ['entityList', 'stageList'], [], ['mWfComment', 'mWfOwner', 'mWfReturn']),
]

def build():
    body = open(os.path.join(HERE, 'world.src.js'), encoding='utf-8').read()
    problems = lint_frame(body)
    if problems:
        sys.exit('Frame breaks Pigment safe-code rules:\n  ' + '\n  '.join(problems))
    for s in sources:
        assert "'" + s['name'] + "'" in body, s['name']
    open(os.path.join(HERE, 'world.js'), 'w', encoding='utf-8', newline='\n').write(body)
    return body

def design_page(body, title='Reconomy World'):
    mock = open(os.path.join(HERE, 'mock_sdk.js'), encoding='utf-8').read()
    return ('<title>' + title + '</title>\n'
            '<style>html,body{margin:0;background:#020D16;color:#EAF3F8}</style>\n'
            '<!-- Design page for a Pigment frame: the real frame body runs on a mock SDK. Restyle inside the frame-body\n'
            '     script block (BRAND block at the top, the styles list, the canvas drawing functions). Frames cannot load\n'
            '     fonts, images or libraries: system fonts, canvas and inline SVG only. -->\n'
            '<div id="app"></div>\n'
            '<script id="mock-sdk">\n' + mock + '\n</script>\n'
            '<script id="frame-body">\n' + body + '\n</script>\n')

if __name__ == '__main__':
    body = build()
    cfg = {'name': 'Reconomy world', 'bindings': bindings, 'dataSources': sources, 'dataSinks': []}
    json.dump(cfg, open(os.path.join(HERE, 'world_config.json'), 'w', encoding='utf-8'), indent=1)
    page = design_page(body)
    open(os.path.join(HERE, 'design.html'), 'w', encoding='utf-8', newline='\n').write(page)
    open(os.path.join(HERE, 'harness.html'), 'w', encoding='utf-8', newline='\n').write(
        '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body>\n' + page + '</body></html>\n')
    print('body bytes', len(body.encode('utf-8')), 'sources', len(sources), 'bindings', len(bindings), 'lint clean')
