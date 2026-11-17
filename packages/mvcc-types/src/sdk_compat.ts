/*
 * Compile-time check that the local attribute shapes in raw.ts are valid
 * AttributeValue members of @aws-sdk/client-dynamodb. Each local shape must be
 * assignable to its SDK member, so any value typed here is accepted by the SDK.
 * This file is not reachable from src/index.ts, so rollup never bundles it and
 * the published declarations do not reference the SDK. It exists only for ts:check.
 */
import type { AttributeValue } from '@aws-sdk/client-dynamodb';
import type * as Raw from './raw';

export type AssertAssignable<_T extends _U, _U> = true;

export type _StringIsSdk = AssertAssignable<
  Raw.StringAttr,
  AttributeValue.SMember
>;
export type _NumberIsSdk = AssertAssignable<
  Raw.NumberAttr,
  AttributeValue.NMember
>;
export type _BinaryIsSdk = AssertAssignable<
  Raw.BinaryAttr,
  AttributeValue.BMember
>;
export type _BoolIsSdk = AssertAssignable<
  Raw.BoolAttr,
  AttributeValue.BOOLMember
>;
export type _NullIsSdk = AssertAssignable<
  Raw.NullAttr,
  AttributeValue.NULLMember
>;
