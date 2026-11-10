const UNIQUE_CONSTRAINT_TYPES: string[] = [
  'unique',
  'unique key',
  'unique index',
];

export function isUniqueConstraint(constraint_type: unknown): boolean {
  return UNIQUE_CONSTRAINT_TYPES.includes(String(constraint_type));
}

export function uniqueIndexName(
  name: string | null | undefined,
  column_list: string[],
  used_list: string[]
): string {
  if (name) {
    return name;
  }
  const base = column_list[0] ?? '';
  const taken = new Set(used_list.map((item) => item.toLowerCase()));
  let candidate = base;
  for (let suffix = 2; taken.has(candidate.toLowerCase()); suffix++) {
    candidate = `${base}_${suffix}`;
  }
  return candidate;
}
