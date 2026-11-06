import { Validator } from '@cfworker/json-schema';

import { SQLError } from '../../error';
import { assertArgCount } from '../helpers/arg_count';
import { SQLJson } from '../types/sql_json';

import { getValue } from './evaluate';
import { _isRecord, _parseDocument } from './func_json_common';

import type { EvaluationState, EvaluationResult } from './evaluate';
import type { Schema, ValidationResult } from '@cfworker/json-schema';
import type { Function } from 'node-sql-parser/build/mysql';

const DATA_KEYWORDS = ['const', 'enum', 'default', 'examples'];
const LATER_DRAFT_KEYWORDS = [
  'const',
  'contains',
  'propertyNames',
  'if',
  'then',
  'else',
];
const SCHEMA_MAP_KEYWORDS = [
  'properties',
  'patternProperties',
  'definitions',
  '$defs',
  'dependentSchemas',
];

export function json_schema_valid(
  expr: Function,
  state: EvaluationState
): EvaluationResult {
  assertArgCount(expr, 2, 2);
  const schema = getValue(expr.args.value[0], state);
  const doc = getValue(expr.args.value[1], state);
  if (schema.err) {
    return schema;
  }
  if (doc.err) {
    return doc;
  }
  if (schema.value === null || doc.value === null) {
    const type = schema.type === 'null' ? 'null' : 'longlong';
    return { err: null, value: null, type };
  }
  const result = _validate(schema, doc, 'json_schema_valid');
  return { err: null, value: result.valid ? 1 : 0, type: 'longlong' };
}

export function json_schema_validation_report(
  expr: Function,
  state: EvaluationState
): EvaluationResult {
  assertArgCount(expr, 2, 2);
  const schema = getValue(expr.args.value[0], state);
  const doc = getValue(expr.args.value[1], state);
  if (schema.err) {
    return schema;
  }
  if (doc.err) {
    return doc;
  }
  if (schema.value === null || doc.value === null) {
    const type = schema.type === 'null' ? 'null' : 'json';
    return { err: null, value: null, type };
  }
  const result = _validate(schema, doc, 'json_schema_validation_report');
  const report: Record<string, unknown> = { valid: result.valid };
  const leaf = result.errors.at(-1);
  const parent = result.errors.at(-2);
  if (leaf !== undefined) {
    // A failing false subschema is reported under its parent keyword.
    const failed =
      leaf.keyword === 'false' && parent !== undefined ? parent : leaf;
    const schema_location = failed.keywordLocation.slice(
      0,
      -(failed.keyword.length + 1)
    );
    report.reason = `The JSON document location '${leaf.instanceLocation}' failed requirement '${failed.keyword}' at JSON Schema location '${schema_location}'`;
    report['schema-location'] = schema_location;
    report['document-location'] = leaf.instanceLocation;
    report['schema-failed-keyword'] = failed.keyword;
  }
  return { err: null, value: new SQLJson(report), type: 'json' };
}

function _validate(
  schema_arg: EvaluationResult,
  doc_arg: EvaluationResult,
  fn_name: string
): ValidationResult {
  const schema = _parseDocument(schema_arg, fn_name, 1);
  const instance = _parseDocument(doc_arg, fn_name, 2);
  if (!_isRecord(schema)) {
    throw new SQLError({
      message: `Invalid JSON type in argument 1 to function ${fn_name}; an object is required.`,
    });
  }
  // MySQL applies only draft 4 keywords and ignores the format keyword.
  return new Validator(_withoutIgnoredKeywords(schema) as Schema, '4').validate(
    instance
  );
}

function _withoutIgnoredKeywords(node: unknown): unknown {
  if (Array.isArray(node)) {
    return node.map(_withoutIgnoredKeywords);
  }
  if (!_isRecord(node)) {
    return node;
  }
  const stripped: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(node)) {
    if (key === 'format' && typeof value === 'string') {
      continue;
    }
    if (LATER_DRAFT_KEYWORDS.includes(key)) {
      continue;
    }
    if (DATA_KEYWORDS.includes(key)) {
      stripped[key] = value;
    } else if (SCHEMA_MAP_KEYWORDS.includes(key) && _isRecord(value)) {
      stripped[key] = Object.fromEntries(
        Object.entries(value).map(([name, sub]) => [
          name,
          _withoutIgnoredKeywords(sub),
        ])
      );
    } else {
      stripped[key] = _withoutIgnoredKeywords(value);
    }
  }
  return stripped;
}
