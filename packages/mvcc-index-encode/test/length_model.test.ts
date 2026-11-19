import { describe, it } from 'mocha';
import { expect } from 'chai';
import { scanGroups } from './helpers/length_model';

describe('length model', () => {
  it('finds 42 scalar groups', () => {
    expect(scanGroups()).to.have.length(42);
  });
});
