import argparse
import importlib.util
import random
import subprocess
from pathlib import Path

parser = argparse.ArgumentParser()
parser.add_argument('allkeys', type=Path)
parser.add_argument('model', type=Path)
args = parser.parse_args()
spec = importlib.util.spec_from_file_location('weight_stats', args.model)
model = importlib.util.module_from_spec(spec)
spec.loader.exec_module(model)
explicit, _, clipped = model.load_data(str(args.allkeys))
rng = random.Random(20261120)
scalars = {0, 0x3315, 0x337f, 0xfdfa, 0xfdfb, 0x1f1a9, 0x378, 0x10ffff}
for first, last in [(0xac00, 0xd7a3), (0x3400, 0x4dbf), (0x4e00, 0x9fff),
                    (0x17000, 0x18aff), (0x20000, 0x2a6df)]:
    scalars.update([first - 1, first, last, last + 1])
scalars.update(rng.randrange(0x110000) for _ in range(2048))
sequences = []
for line in args.allkeys.read_text().splitlines():
    if ';' in line and line[0] not in '#@':
        codes = line.split(';')[0].split()
        if len(codes) > 1:
            sequences.append(tuple(int(c, 16) for c in codes))
            scalars.update(sequences[-1])
scalars = sorted(cp for cp in scalars if not 0xd800 <= cp <= 0xdfff)
inputs = [(cp,) for cp in scalars] + sequences
queries = []
for seq in inputs:
    literal = ''.join(map(chr, seq)).encode().hex()
    queries.append(f"SELECT HEX(WEIGHT_STRING(_utf8mb4 X'{literal}' COLLATE utf8mb4_0900_as_cs));")
rows = subprocess.check_output(['mysql', '-NB'], input='\n'.join(queries), text=True).splitlines()
single = {}
different = []
contractions = []
for seq, row in zip(inputs, rows, strict=True):
    levels = [[]]
    for i in range(0, len(row), 4):
        weight = int(row[i:i+4], 16)
        if weight:
            levels[-1].append(weight)
        else:
            levels.append([])
    if len(seq) == 1:
        cp, = seq
        single[cp] = levels
        ces = model.weights_for(cp, explicit)
        if levels != [[ce[i] for ce in ces if ce[i]] for i in range(3)]:
            different.append(hex(cp))
    elif levels != [[u for cp in seq for u in single[cp][i]] for i in range(3)]:
        contractions.append(seq)
print('Scalar model differences', len(different), '/', len(scalars), different[:20])
print('Multi-scalar composition differences', len(contractions), '/', len(sequences), contractions[:5])
