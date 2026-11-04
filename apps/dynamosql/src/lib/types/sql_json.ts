export class JsonRaw {
  readonly text: string;
  constructor(text: string) {
    this.text = text;
  }
}

export class SQLJson {
  readonly node: unknown;
  constructor(node: unknown) {
    this.node = node;
  }
  toString(): string {
    return _serialize(this.node);
  }
}

function _serialize(node: unknown): string {
  if (node instanceof JsonRaw) {
    return node.text;
  } else if (node === undefined) {
    return 'null';
  } else if (Array.isArray(node)) {
    return `[${node.map((item) => _serialize(item)).join(', ')}]`;
  } else if (typeof node === 'object' && node !== null) {
    const record = node as Record<string, unknown>;
    const member_list = Object.keys(record)
      .sort(_compareKeys)
      .map((key) => `${JSON.stringify(key)}: ${_serialize(record[key])}`);
    return `{${member_list.join(', ')}}`;
  }
  return JSON.stringify(node);
}

function _compareKeys(a: string, b: string): number {
  const a_bytes = Buffer.from(a);
  const b_bytes = Buffer.from(b);
  return a_bytes.length - b_bytes.length || Buffer.compare(a_bytes, b_bytes);
}
