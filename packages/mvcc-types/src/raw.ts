/*
 * Raw DynamoDB attribute shapes. The codebase does not use the document client,
 * so items arrive as attribute members: N is a decimal string, B is a
 * Uint8Array, BOOL is a boolean, and NULL is `true`. These match the members of
 * @aws-sdk/client-dynamodb's AttributeValue, which src/sdk_compat.ts verifies
 * at compile time. Declared locally so the published types have no runtime
 * or type dependency on the SDK.
 */

export interface StringAttr {
  S: string;
  N?: never;
  B?: never;
  BOOL?: never;
  NULL?: never;
}

export interface NumberAttr {
  N: string;
  S?: never;
  B?: never;
  BOOL?: never;
  NULL?: never;
}

export interface BinaryAttr {
  B: Uint8Array;
  S?: never;
  N?: never;
  BOOL?: never;
  NULL?: never;
}

export interface BoolAttr {
  BOOL: boolean;
  S?: never;
  N?: never;
  B?: never;
  NULL?: never;
}

export interface NullAttr {
  NULL: true;
  S?: never;
  N?: never;
  B?: never;
  BOOL?: never;
}

/** Partition or sort key attributes: native N, S, or B. Never NULL. */
export type KeyAttr = StringAttr | NumberAttr | BinaryAttr;

/** Non-key user attributes: native N, S, B, or NULL. */
export type ColumnAttr = StringAttr | NumberAttr | BinaryAttr | NullAttr;
