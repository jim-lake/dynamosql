export interface ParsedArgs {
  positional: string[];
  flags: Record<string, string>;
}

export function parseArgs(argv: string[]): ParsedArgs {
  const positional: string[] = [];
  const flags: Record<string, string> = {};
  for (const arg of argv) {
    const match = /^--([\w-]+)(?:=(.*))?$/.exec(arg);
    if (match) {
      const [, key = '', value = 'true'] = match;
      flags[key] = value;
    } else {
      positional.push(arg);
    }
  }
  return { positional, flags };
}
