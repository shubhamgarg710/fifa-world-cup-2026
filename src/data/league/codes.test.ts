import { describe, expect, it } from 'vitest';
import {
  CODE_LENGTH,
  generateCode,
  isWellFormedCode,
  normalizeCode,
  normalizeName,
} from './codes';

const AMBIGUOUS = ['0', 'O', '1', 'I', 'L'];

describe('generateCode', () => {
  it('is 6 chars from the unambiguous alphabet', () => {
    for (let i = 0; i < 200; i++) {
      const c = generateCode();
      expect(c).toHaveLength(CODE_LENGTH);
      for (const ch of AMBIGUOUS) expect(c).not.toContain(ch);
      expect(isWellFormedCode(c)).toBe(true);
    }
  });

  it('is deterministic given the same seeded rng', () => {
    const seq = [0, 0.5, 0.99, 0.2, 0.7, 0.4];
    const make = () => {
      let i = 0;
      return () => seq[i++];
    };
    expect(generateCode(make())).toBe(generateCode(make()));
    // first char with rand()=0 is alphabet[0] = 'A'
    expect(generateCode(make())[0]).toBe('A');
  });
});

describe('normalizeCode', () => {
  it('trims and uppercases', () => {
    expect(normalizeCode(' wc2abc ')).toBe('WC2ABC');
  });
});

describe('isWellFormedCode', () => {
  it('rejects ambiguous chars and wrong length', () => {
    expect(isWellFormedCode('WC2AB')).toBe(false); // too short
    expect(isWellFormedCode('WC2ABO')).toBe(false); // contains O
    expect(isWellFormedCode('wc2abc')).toBe(true); // normalized internally
  });
});

describe('normalizeName', () => {
  it('trims ends and collapses internal whitespace', () => {
    expect(normalizeName(' Alice  B ')).toBe('Alice B');
    expect(normalizeName('Alice')).toBe('Alice');
    expect(normalizeName('Alice ')).toBe('Alice');
  });

  it("makes 'Alice' and 'Alice ' collide", () => {
    expect(normalizeName('Alice')).toBe(normalizeName('Alice '));
  });
});
