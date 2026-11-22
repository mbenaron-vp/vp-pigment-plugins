"""Bring a restyled design page back into the frame source.

    py -3.12 -I pull_design.py <design page saved from the artifact>

Save the page first with the Artifact tool (action read, path index.html). This script:
  - takes the LAST <script id="frame-body"> block on the page (the page's own comment mentions the tag)
  - checks it against Pigment's safe-code rules (lint_frame) and stops if it breaks one
  - puts the story text (STORY_KEYS) back into story.json and rewrites <NAME>.src.js with the
    /*STORY_JSON*/{} placeholder
  - saves the change to the source as last_pull.diff
Then run build_frame.py, test harness.html, and run deploy_edits.py.
"""
import difflib
import json
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from build_frame import HERE, PLACEHOLDER, SRC_PATH, STORY_KEYS, STORY_PATH, lint_frame, read, write

FRAME_BODY = re.compile(r'<script\b[^>]*\bid=["\']frame-body["\'][^>]*>\n?(.*?)\n?</script>', re.S | re.I)
STORY_LINE = re.compile(r'^(\s*var STORY\s*=\s*)(\{.*\});[ \t]*$', re.M)


def main(path):
    html = read(path).replace('\r\n', '\n')
    m = None
    for m in FRAME_BODY.finditer(html):
        pass  # keep the last match: the real block comes after the comment that names it
    if not m:
        sys.exit('No <script id="frame-body"> block in %s: was the frame code moved or renamed in the design?' % path)
    body = m.group(1)
    problems = lint_frame(body)
    if problems:
        sys.exit('The design breaks Pigment frame rules (fix them in the artifact first):\n  ' + '\n  '.join(problems))
    sm = STORY_LINE.search(body)
    if not sm:
        sys.exit('Could not find the one-line "var STORY = {...};" in the frame body.')
    story_in = json.loads(sm.group(2))

    story = json.loads(read(STORY_PATH))
    story_changed = any(story_in.get(k) != story.get(k) for k in STORY_KEYS)
    if story_changed:
        for k in STORY_KEYS:
            story[k] = story_in.get(k)
        write(STORY_PATH, json.dumps(story, ensure_ascii=False, indent=2) + '\n')

    src = body[:sm.start(2)] + PLACEHOLDER + body[sm.end(2):]
    if not src.endswith('\n'):
        src += '\n'
    old = read(SRC_PATH) if os.path.exists(SRC_PATH) else ''
    diff = list(difflib.unified_diff(old.split('\n'), src.split('\n'), 'before', 'design', lineterm='', n=1))
    write(os.path.join(HERE, 'last_pull.diff'), '\n'.join(diff) + '\n')
    write(SRC_PATH, src)
    added = sum(1 for l in diff if l.startswith('+') and not l.startswith('+++'))
    removed = sum(1 for l in diff if l.startswith('-') and not l.startswith('---'))
    print('frame source: %d lines added, %d removed%s; story.json %s'
          % (added, removed, ' (see last_pull.diff)' if diff else '', 'updated' if story_changed else 'unchanged'))


if __name__ == '__main__':
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    main(sys.argv[1])
