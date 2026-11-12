import * as churn from './churn';
import * as deleteScenario from './delete';
import * as insert from './insert';
import * as join from './join';
import * as selectGroup from './select_group';
import * as selectPoint from './select_point';
import * as selectScan from './select_scan';
import * as update from './update';

import type { CaseDef } from '../types';

export interface BenchCase {
  id: string;
  scenario: string;
  def: CaseDef;
}

const SCENARIOS: Record<string, CaseDef[]> = {
  select_scan: selectScan.cases,
  select_point: selectPoint.cases,
  select_group: selectGroup.cases,
  join: join.cases,
  insert: insert.cases,
  update: update.cases,
  delete: deleteScenario.cases,
  churn: churn.cases,
};

export function allCases(): BenchCase[] {
  return Object.entries(SCENARIOS).flatMap(([scenario, defs]) =>
    defs.map((def) => ({ id: `${scenario}/${def.name}`, scenario, def }))
  );
}

export function selectCases(filter: string[]): BenchCase[] {
  return allCases().filter(
    (c) =>
      filter.length === 0 ||
      filter.some((f) => f === c.scenario || f === c.id)
  );
}

export function findCaseDef(id: string): CaseDef | undefined {
  return allCases().find((c) => c.id === id)?.def;
}
