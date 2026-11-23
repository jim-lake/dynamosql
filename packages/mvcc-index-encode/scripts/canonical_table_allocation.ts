import { canonicalString } from '../src/canonical_string';

const collation = 'utf8mb4_0900_as_cs';
const mb = (bytes: number): number => Math.round((bytes / 1e6) * 100) / 100;
const arrayBuffers = (): number => process.memoryUsage().arrayBuffers;

const afterImport = arrayBuffers();
canonicalString('', collation);
const afterEmpty = arrayBuffers();
canonicalString('Customer', collation);
const afterFirstNonempty = arrayBuffers();

console.log({
  collation,
  afterImportMB: mb(afterImport),
  afterEmptyCallMB: mb(afterEmpty),
  afterFirstNonemptyCallMB: mb(afterFirstNonempty),
  emptyCallDeltaMB: mb(afterEmpty - afterImport),
  nonemptyCallDeltaMB: mb(afterFirstNonempty - afterEmpty),
});
