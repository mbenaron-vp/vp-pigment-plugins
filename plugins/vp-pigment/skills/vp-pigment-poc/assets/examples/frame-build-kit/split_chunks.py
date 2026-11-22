"""Split a built frame body into ~15k-char chunks for a create/update_frame + update_frame_body deploy.
Usage: py -3.12 -I split_chunks.py <body.js> <out_dir>. Writes chunk_NN.txt, placeholder.js, expected.json (running bodySizeBytes) and sha256."""
import sys, os, json, hashlib
body_path, out = sys.argv[1], sys.argv[2]
body = open(body_path, encoding='utf-8').read()
os.makedirs(out, exist_ok=True)
for f in os.listdir(out): os.remove(os.path.join(out, f))
LIM, chunks, cur = 15000, [], ''
for line in body.splitlines(keepends=True):
    assert len(line) < LIM, 'line too long: %d' % len(line)
    if len(cur) + len(line) > LIM: chunks.append(cur); cur = ''
    cur += line
if cur: chunks.append(cur)
assert ''.join(chunks) == body
marks = ['/*@@P%02d@@*/' % (i + 1) for i in range(len(chunks))]
assert not any(m in body for m in marks)
ph = ''.join(marks); size = len(ph.encode()); exp = []
for i, c in enumerate(chunks):
    open(os.path.join(out, 'chunk_%02d.txt' % (i + 1)), 'w', encoding='utf-8', newline='').write(c)
    size += len(c.encode()) - len(marks[i].encode()); exp.append(size)
open(os.path.join(out, 'placeholder.js'), 'w', encoding='utf-8', newline='').write(ph)
json.dump({'chunks': len(chunks), 'expected_after_each': exp, 'final_bytes': len(body.encode()), 'sha256': hashlib.sha256(body.encode()).hexdigest()}, open(os.path.join(out, 'expected.json'), 'w'), indent=1)
print(len(chunks), 'chunks; expected', exp, 'sha', hashlib.sha256(body.encode()).hexdigest()[:12])
