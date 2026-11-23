export function validateUcaRows(collation, requested, lines) {
  const expected = new Set(requested);
  const seen = new Map();
  for (const fields of lines) {
    const id = Number(fields[0]);
    if (fields.length !== 2) {
      throw new Error(
        `${collation}: row for scalar ${id} has ${fields.length} fields, expected 2`
      );
    }
    if (String(id) !== fields[0] || !expected.has(id)) {
      throw new Error(
        `${collation}: unexpected scalar ${JSON.stringify(fields[0])} in batch`
      );
    }
    if (seen.has(id)) {
      throw new Error(`${collation}: duplicate row for scalar ${id}`);
    }
    seen.set(id, fields[1]);
  }
  for (const id of requested) {
    if (!seen.has(id)) {
      throw new Error(`${collation}: missing row for scalar ${id}`);
    }
  }
  return requested.map((id) => [id, seen.get(id)]);
}
