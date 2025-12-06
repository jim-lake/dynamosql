import { localSnakeCaseRule } from './rules/case_rules.js';

export const rules = { 'local-snake-case': localSnakeCaseRule };
export const recommended = [
  { files: ['**/*.ts', '**/*.js'], rules: { 'local-snake-case': 'error' } },
];
export const plugin = { rules: { 'local-snake-case': localSnakeCaseRule } };
