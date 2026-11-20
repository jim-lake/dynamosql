import { computeCurve, scanGroups } from './gap_length_model';

const groups = scanGroups();
for (const gaps of [
  [1, 3, 5],
  Array.from({ length: 10 }, (_, i) => i),
  Array.from({ length: 20 }, (_, i) => i),
]) {
  const direct = 121 - gaps.length;
  for (const variant of ['as_ci', 'as_cs'] as const) {
    const curve = computeCurve(variant, 132, groups, gaps, direct);
    const cutoff = curve.maxBytes.findIndex((b) => b > 1012) - 1;
    const witness = curve.witnesses[cutoff] ?? [];
    console.log(
      variant,
      gaps.join(','),
      cutoff,
      curve.maxBytes.slice(cutoff, cutoff + 2),
      [...new Set(witness)].map((cp) => cp.toString(16))
    );
  }
}
