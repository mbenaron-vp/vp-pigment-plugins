"""Turn a rebuilt frame body into update_frame_body edits.

    py -3.12 -I deploy_edits.py             -> deploy_edits.json: [{oldString, newString}, ...] to send as the
                                               edits of one update_frame_body call, and the bodySizeBytes to expect;
                                               a big change is split into deploy_edits_1.json, _2.json ... (one call
                                               each, in order, checking bodySizeBytes after each)
    py -3.12 -I deploy_edits.py --deployed  -> once Pigment confirms that size, copy the new body to deployed.js

deployed.js is an exact copy of the body live in Pigment; <NAME>.js is the new build. Start deployed.js with
--deployed right after create_frame, once search_frames shows the expected size. Each edit is one changed
hunk with enough context to match exactly once; the edits are simulated in order before they are written,
and each string stays under 19,000 characters (the tool's limit is 20,000). A small design change becomes
a few small edits instead of a full resend.
"""
import difflib
import json
import os
import shutil
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from build_frame import BODY_PATH, HERE, read

LIMIT = 19000
BATCH = 18000  # characters of oldString + newString per update_frame_body call
DEPLOYED = os.path.join(HERE, 'deployed.js')


def make_edits(old, new):
    a, b = old.split('\n'), new.split('\n')
    edits = []
    for group in difflib.SequenceMatcher(None, a, b, autojunk=False).get_grouped_opcodes(1):
        i1, i2, j1, j2 = group[0][1], group[-1][2], group[0][3], group[-1][4]
        while True:  # widen the hunk a line at a time until its old text is unique in the live body
            o, n = '\n'.join(a[i1:i2]), '\n'.join(b[j1:j2])
            if o and old.count(o) == 1:
                break
            if i1 == 0 and i2 == len(a):
                sys.exit('Could not make a unique edit; deploy the whole body with update_frame instead.')
            i1, j1 = max(0, i1 - 1), max(0, j1 - 1)
            i2, j2 = min(len(a), i2 + 1), min(len(b), j2 + 1)
        if len(o) > LIMIT or len(n) > LIMIT:
            sys.exit('A changed block is over %d characters (%d / %d): split the change, or deploy in chunks.'
                     % (LIMIT, len(o), len(n)))
        edits.append({'oldString': o, 'newString': n})
    body = old  # simulate in order: each oldString must match exactly once when its turn comes
    for k, e in enumerate(edits):
        c = body.count(e['oldString'])
        if c != 1:
            sys.exit('Edit %d matches %d times after the earlier edits; deploy the whole body instead.' % (k + 1, c))
        body = body.replace(e['oldString'], e['newString'])
    assert body == new, 'the simulated result differs from the new body'
    return edits


if __name__ == '__main__':
    if '--deployed' in sys.argv:
        shutil.copyfile(BODY_PATH, DEPLOYED)
        sys.exit('deployed.js now matches %s' % os.path.basename(BODY_PATH))
    if not os.path.exists(DEPLOYED):
        sys.exit('No deployed.js yet. After create_frame (or a full update_frame) and a matching bodySizeBytes, '
                 'run: py -3.12 -I deploy_edits.py --deployed')
    old, new = read(DEPLOYED), read(BODY_PATH)
    edits = make_edits(old, new) if old != new else []
    # One update_frame_body call per batch of about 18,000 characters; check bodySizeBytes after each batch.
    batches, cur, size = [], [], 0
    for e in edits:
        n = len(e['oldString']) + len(e['newString'])
        if cur and size + n > BATCH:
            batches.append(cur)
            cur, size = [], 0
        cur.append(e)
        size += n
    if cur or not batches:
        batches.append(cur)
    for name in os.listdir(HERE):
        if name.startswith('deploy_edits') and name.endswith('.json'):
            os.remove(os.path.join(HERE, name))
    body = old
    for k, batch in enumerate(batches):
        name = 'deploy_edits.json' if len(batches) == 1 else 'deploy_edits_%d.json' % (k + 1)
        with open(os.path.join(HERE, name), 'w', encoding='utf-8', newline='\n') as f:
            json.dump(batch, f, ensure_ascii=False, indent=1)
        for e in batch:
            body = body.replace(e['oldString'], e['newString'])
        print('%s: %d edit(s), %s characters; expect bodySizeBytes %s'
              % (name, len(batch), format(sum(len(e['oldString']) + len(e['newString']) for e in batch), ','),
                 format(len(body.encode('utf-8')), ',')))
