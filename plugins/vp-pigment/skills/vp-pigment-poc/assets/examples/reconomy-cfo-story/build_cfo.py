"""Build the Reconomy CFO story frame (read only, no sinks).

py -3.12 -I build_cfo.py
  -> cfo_story.js           deployable body (UTF-8, no escapes, passes the safe-code lint)
  -> cfo_story_config.json  bindings and data sources for create_frame
  -> design.html            artifact-ready design page (mock SDK + frame body)
  -> harness.html           the same page with a full HTML skeleton, for file:// tests
"""
import json, os, sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.dirname(HERE))
from build_frame import lint_frame  # noqa: E402  (the cockpit kit's safe-code lint)

L = lambda name, lid: {'type': 'List', 'name': name, 'listId': lid}
M = lambda name, mid: {'type': 'Metric', 'name': name, 'metricId': mid}
P = lambda name, lid, tech: {'type': 'ListProperty', 'name': name, 'listId': lid, 'listPropertyTechnicalName': tech}
ENTITY = 'fb8eebb9-af77-4fef-a6be-c363c6efa4e4'
bindings = [
    L('versionList', '7237b9e3-c111-4989-9813-67a2b34be6df'),
    L('monthList', '2cb7e6db-e257-48f3-8e47-783adeee3082'),
    L('schemeList', '401c68e6-5838-4006-9d52-96fc187b72e9'),
    L('lineList', '31e98cf8-0555-4edc-87e5-2fe98738149f'),
    L('sectorList', '80f19255-3af4-4a7a-88c0-f796c7120a1f'),
    L('currencyList', 'b90df34d-1588-455c-98ae-376308ed3ff1'),
    L('plLineList', '5f4546e3-5ea8-4d57-9f05-c572e540ba28'),
    L('entityList', ENTITY),
    L('stageList', '968faf24-d0e6-4b6d-be89-bfc3dd15cd32'),
    P('entLoop', ENTITY, '_loop_17PFVA'),          # Entity.Loop (Dimension -> Loop)
    P('entCurrency', ENTITY, 'currency_FPXSRL'),   # Entity.Currency (Dimension -> Currency)
    M('mPLR12', '32222d3b-d04e-4091-86c8-86f04afa04d0'),
    M('mCsRevR12', '8c26b5a5-a963-4633-b730-fb693ebda278'),
    M('mCsGpR12', '34444823-22bf-4948-b1ab-158fa1e437cd'),
    M('mCsBasis', '968ee2ab-6fbe-4538-b3dc-282225944fa5'),
    M('mMsRevR12', 'cabe83df-837f-4191-97f9-f8ab72ba42b5'),
    M('mMsGpR12', 'f0039da3-fc7f-4d4b-bb27-caf9a23fa7e5'),
    M('mMsIncR12', '657d85c0-dbe5-404b-89e9-7b2831a19415'),
    M('mMsRecR12', '9324581a-7766-479e-a5bd-f3a744527267'),
    M('mMsPass', 'c7c76193-e635-43c3-8be4-3471f7091659'),
    M('mMgmtPL', '37383c3b-185b-48b2-8f4c-afb8690045e0'),
    M('mFx', '460ef88a-2ef9-4a71-8603-f8ecb51cf3a7'),
    M('mWfStatus', 'fea9d168-7762-4dd0-837f-7231f604ff9d'),
    M('mWfComment', 'fc838987-d786-4e58-8b05-8579f88e3017'),
    M('mWfOwner', '53d6b17a-e34f-4499-b274-97048e67b5f0'),
    M('mWfReturn', '6e69bdbb-bb9f-44b7-87bb-c90ef80f0a05'),
]
def ds(name, labels, selectors, values):
    return {'name': name, 'labels': [{'binding': b} for b in labels], 'selectors': [{'binding': b} for b in selectors], 'values': [{'binding': b} for b in values]}
sources = [
    ds('dsEnt', ['entityList', 'plLineList', 'versionList'], ['versionList'], ['mPLR12']),
    ds('dsPLM', ['monthList', 'plLineList', 'versionList'], ['versionList', 'monthList'], ['mMgmtPL']),
    ds('dsCS', ['schemeList', 'lineList', 'versionList'], ['versionList'], ['mCsRevR12', 'mCsGpR12']),
    ds('dsCSB', ['schemeList', 'lineList'], [], ['mCsBasis']),
    ds('dsMS', ['sectorList', 'versionList'], ['versionList'], ['mMsRevR12', 'mMsGpR12', 'mMsIncR12', 'mMsRecR12', 'mMsPass']),
    ds('dsFX', ['currencyList', 'versionList'], ['versionList'], ['mFx']),
    ds('dsWFS', ['entityList', 'stageList'], [], ['mWfStatus']),
    ds('dsWFC', ['entityList', 'stageList'], [], ['mWfComment', 'mWfOwner', 'mWfReturn']),
    ds('dsEntP', ['entityList'], [], ['entLoop', 'entCurrency']),   # list data source on Entity
]
sinks = []

def design_page(body, title='Reconomy CFO Story'):
    mock = open(os.path.join(HERE, 'mock_sdk.js'), encoding='utf-8').read()
    return ('<title>' + title + '</title>\n'
            '<style>html,body{margin:0;background:#00344B;color:#181818}</style>\n'
            '<!-- Design page for a Pigment frame: the CFO story. Restyle anything in the frame-body script block\n'
            '     below (BRAND and CFG blocks at the top, the styles list near the end). Keep element ids, data-*\n'
            '     attributes, data source names and the SDK calls. System fonts and inline SVG only.\n'
            '     The mock SDK below is for the design page only. -->\n'
            '<div id="app"></div>\n'
            '<script id="mock-sdk">\n' + mock + '\n</script>\n'
            '<script id="frame-body">\n' + body + '\n</script>\n')

if __name__ == '__main__':
    body = open(os.path.join(HERE, 'cfo_story.src.js'), encoding='utf-8').read()
    problems = lint_frame(body)
    if problems:
        sys.exit('Frame breaks Pigment safe-code rules:\n  ' + '\n  '.join(problems))
    for s in sources:
        assert "'" + s['name'] + "'" in body, s['name']
    open(os.path.join(HERE, 'cfo_story.js'), 'w', encoding='utf-8', newline='\n').write(body)
    cfg = {'name': 'Reconomy CFO story', 'bindings': bindings, 'dataSources': sources, 'dataSinks': sinks}
    json.dump(cfg, open(os.path.join(HERE, 'cfo_story_config.json'), 'w', encoding='utf-8'), indent=1)
    page = design_page(body)
    open(os.path.join(HERE, 'design.html'), 'w', encoding='utf-8', newline='\n').write(page)
    open(os.path.join(HERE, 'harness.html'), 'w', encoding='utf-8', newline='\n').write(
        '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body>\n' + page + '</body></html>\n')
    print('body bytes', len(body.encode('utf-8')), 'sources', len(sources), 'sinks', len(sinks), 'bindings', len(bindings), 'lint clean')
