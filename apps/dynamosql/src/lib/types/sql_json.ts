export class SQLJson {
  readonly node: unknown;
  constructor(node: unknown) {
    this.node = node;
  }
  toString(): string {
    return JSON.stringify(this.node);
  }
}
