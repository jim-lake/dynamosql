export function testNamespace(): string {
  const namespace = process.env.DYNAMO_NAMESPACE;
  if (!namespace) {
    throw new Error('DYNAMO_NAMESPACE must be set in .env');
  }
  return namespace;
}
