import { asCsLevel1Codes } from '../src/uca';

const codes = asCsLevel1Codes();
let runs: number[] = [];
let run = 0;
for (let u = 0; u < 0x10000; u++) {
  const size = codes.length[u] ?? 0;
  if (size === 2) run++;
  else if (size === 1 && run > 0) {
    runs.push(run);
    run = 0;
  }
}
if (run > 0) runs.push(run);
const leadsForRuns = runs.reduce((s, r) => s + Math.ceil(r / 256), 0);
const twoByte = runs.reduce((s, r) => s + r, 0);
console.log(
  JSON.stringify({
    runs: runs.length,
    twoByte,
    leadsForRuns,
    oneByteLeads: 27,
    total: leadsForRuns + 27,
    budget: 254,
  })
);
