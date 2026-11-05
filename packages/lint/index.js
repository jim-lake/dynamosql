import { localSnakeCaseRule } from './rules/case_rules.js';
import { noBareNodeSqlParserRule } from './rules/import_rules.js';

export const rules = {
  'local-snake-case': localSnakeCaseRule,
  'no-bare-node-sql-parser': noBareNodeSqlParserRule,
};
export const recommended = [
  { files: ['**/*.ts', '**/*.js'], rules: { 'local-snake-case': 'error' } },
];
export const plugin = { rules };
