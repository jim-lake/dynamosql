import { ucaWeight } from '../src/uca';

const allUnits = new Set<number>();
const starts = new Set<number>();
const endings = new Set<number>();
const transitions = new Map<number, Set<number>>();

for (let cp = 0; cp <= 0x10ffff; cp++) {
  if (cp >= 0xd800 && cp <= 0xdfff) continue;
  const bytes = ucaWeight(cp);
  const units: number[] = [];
  for (let i = 0; i < bytes.length; i += 2) {
    const unit = ((bytes[i] ?? 0) << 8) | (bytes[i + 1] ?? 0);
    units.push(unit);
    allUnits.add(unit);
  }
  if (units.length === 0) continue;
  starts.add(units[0] ?? 0);
  endings.add(units.at(-1) ?? 0);
  for (let i = 1; i < units.length; i++) {
    const prev = units[i - 1] ?? 0;
    const next = units[i] ?? 0;
    let outgoing = transitions.get(prev);
    if (!outgoing) transitions.set(prev, (outgoing = new Set()));
    outgoing.add(next);
  }
}

const first = [...starts].sort((a, b) => a - b);
const states = [...allUnits].sort((a, b) => a - b);
const incomingStates = [...endings].sort((a, b) => a - b);
const profileIds = new Map<number, number>();
const profiles: number[][] = [];
const profileBySignature = new Map<string, number>();
const lengthsByProfile: Map<number, number>[] = [];

function balancedLengths(
  symbols: number[],
  weights: Map<number, number>
): Map<number, number> {
  const result = new Map<number, number>();
  const prefix = new Float64Array(symbols.length + 1);
  for (let i = 0; i < symbols.length; i++)
    prefix[i + 1] = (prefix[i] ?? 0) + (weights.get(symbols[i] ?? -1) ?? 1);
  function visit(lo: number, hi: number, depth: number): void {
    if (hi - lo === 1) {
      const symbol = symbols[lo] ?? -1;
      result.set(symbol, depth);
      return;
    }
    const target =
      (prefix[lo] ?? 0) + ((prefix[hi] ?? 0) - (prefix[lo] ?? 0)) / 2;
    let mid = lo + 1;
    while (
      mid + 1 < hi &&
      Math.abs((prefix[mid] ?? 0) - target) >
        Math.abs((prefix[mid + 1] ?? 0) - target)
    )
      mid++;
    visit(lo, mid, depth + 1);
    visit(mid, hi, depth + 1);
  }
  visit(0, symbols.length, 0);
  return result;
}

for (const state of states) {
  const internal = [...(transitions.get(state) ?? [])].sort((a, b) => a - b);
  const signature = internal.join(',');
  let profileId = profileBySignature.get(signature);
  if (profileId === undefined) {
    profileId = profiles.length;
    profileBySignature.set(signature, profileId);
    const symbols = [...new Set([...first, ...internal])].sort((a, b) => a - b);
    profiles.push(symbols);
    const weights = new Map<number, number>([[-1, 1]]);
    for (const unit of first) weights.set(unit, 1);
    for (const unit of internal) weights.set(unit, 1024);
    lengthsByProfile.push(balancedLengths([-1, ...symbols], weights));
  }
  profileIds.set(state, profileId);
}

const incomingProfiles = new Map<number, number>();
for (const state of incomingStates)
  incomingProfiles.set(profileIds.get(state)!, state);
incomingProfiles.set(profileBySignature.get('')!, -1);
const worstStartLength = new Map<number, number>();
const worstStartState = new Map<number, number>();
for (const unit of first) {
  let max = 0;
  for (const [profile, state] of incomingProfiles) {
    const size = lengthsByProfile[profile]?.get(unit) ?? Infinity;
    if (size > max) {
      max = size;
      worstStartState.set(unit, state);
    }
  }
  worstStartLength.set(unit, max);
}

let maxScalar = 0;
let witness: number[] = [];
let witnessCp = -1;
let maxEnd = 0;
for (let cp = 0; cp <= 0x10ffff; cp++) {
  if (cp >= 0xd800 && cp <= 0xdfff) continue;
  const bytes = ucaWeight(cp);
  const units: number[] = [];
  for (let i = 0; i < bytes.length; i += 2) {
    units.push(((bytes[i] ?? 0) << 8) | (bytes[i + 1] ?? 0));
  }
  if (units.length === 0) continue;
  let cost = worstStartLength.get(units[0] ?? 0) ?? 0;
  for (let i = 1; i < units.length; i++) {
    const prev = units[i - 1] ?? 0;
    const unit = units[i] ?? 0;
    const profile = profileIds.get(prev) ?? 0;
    cost += lengthsByProfile[profile]?.get(unit) ?? 0;
  }
  if (cost > maxScalar) {
    maxScalar = cost;
    witness = units;
    witnessCp = cp;
  }
}
for (const lengths of lengthsByProfile) {
  const end = lengths.get(-1) ?? 0;
  if (end > maxEnd) maxEnd = end;
}

const witnessCosts = witness.map((unit, i) => {
  const prev = i === 0 ? worstStartState.get(unit) : witness[i - 1];
  const profile =
    prev === undefined || prev === -1
      ? profileBySignature.get('')!
      : profileIds.get(prev)!;
  return {
    unit: unit.toString(16),
    previous: prev?.toString(16) ?? 'START',
    bits: lengthsByProfile[profile]?.get(unit) ?? 0,
  };
});

const repeatedContext = 0xfb40;
const repeatedTargets = witness
  .slice(1)
  .filter((_, i) => witness[i] === repeatedContext);
const repeatedAlphabet = [
  ...new Set([-1, ...first, ...(transitions.get(repeatedContext) ?? [])]),
].sort((a, b) => a - b);
const targetFrequency = new Map<number, number>();
for (const unit of repeatedTargets)
  targetFrequency.set(unit, (targetFrequency.get(unit) ?? 0) + 1);
const compressed: number[] = [];
let inNontargetRun = false;
for (const symbol of repeatedAlphabet) {
  if (targetFrequency.has(symbol)) {
    compressed.push(targetFrequency.get(symbol) ?? 0);
    inNontargetRun = false;
  } else if (!inNontargetRun) {
    compressed.push(0);
    inNontargetRun = true;
  }
}
const prefixWeight = new Uint32Array(compressed.length + 1);
for (let i = 0; i < compressed.length; i++)
  prefixWeight[i + 1] = (prefixWeight[i] ?? 0) + (compressed[i] ?? 0);
const dp = Array.from(
  { length: compressed.length },
  () => new Float64Array(compressed.length)
);
for (let width = 2; width <= compressed.length; width++) {
  for (let lo = 0; lo + width <= compressed.length; lo++) {
    const hi = lo + width;
    const weight = (prefixWeight[hi] ?? 0) - (prefixWeight[lo] ?? 0);
    let best = Infinity;
    for (let mid = lo + 1; mid < hi; mid++) {
      best = Math.min(
        best,
        (dp[lo]?.[mid - 1] ?? 0) + (dp[mid]?.[hi - 1] ?? 0)
      );
    }
    const row = dp[lo];
    if (row) row[hi - 1] = best + weight;
  }
}
const repeatedContextLowerBound = dp[0]?.[compressed.length - 1] ?? 0;

console.log(
  JSON.stringify(
    {
      states: states.length,
      contextProfiles: profiles.length,
      startSymbols: first.length,
      scalarShapes: 'streamed over all Unicode scalar values',
      transitions: [...transitions.values()].reduce(
        (n, set) => n + set.size,
        0
      ),
      maxScalarBits: maxScalar,
      witnessUnits: witness.map((u) => u.toString(16)),
      witnessCodePoint: `U+${witnessCp.toString(16).toUpperCase()}`,
      witnessCosts,
      repeatedContext: `U+${repeatedContext.toString(16).toUpperCase()}`,
      repeatedContextTargetSymbols: repeatedTargets.map((u) => u.toString(16)),
      repeatedContextCompressedAlphabet: compressed.length,
      repeatedContextMinimumTargetBits: repeatedContextLowerBound,
      repeatedContextScalarLowerBound:
        repeatedContextLowerBound + (witness.length - repeatedTargets.length),
      maxEndBits: maxEnd,
      boundForNScalars: `<= ${String(maxScalar)} * n + ${String(maxEnd)} bits`,
    },
    null,
    2
  )
);
