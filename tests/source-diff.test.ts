import { describe, expect, it } from 'vitest';
import { classifySnapshot } from '../scripts/sources-check';
import { myersDiff, unifiedDiff } from '../scripts/lib/diff';

describe('unifiedDiff', () => {
  it('produces no output for identical normalized content', () => {
    const text = ['School zone', 'The maximum speed is 30 km/h when children are present.', ''].join(
      '\n',
    );
    expect(unifiedDiff(text, text)).toBe('');
  });

  it('makes a changed numeric value visible as -/+ lines', () => {
    const before = ['The maximum speed is 30 km/h.', 'Stop for the bus.'].join('\n');
    const after = ['The maximum speed is 40 km/h.', 'Stop for the bus.'].join('\n');
    const diff = unifiedDiff(before, after);
    expect(diff).toContain('-The maximum speed is 30 km/h.');
    expect(diff).toContain('+The maximum speed is 40 km/h.');
  });

  it('shows inserted text as an addition, not a removal', () => {
    const before = ['Stop for the bus.'].join('\n');
    const after = ['Stop for the bus.', 'This does not apply to school buses.'].join('\n');
    const diff = unifiedDiff(before, after);
    expect(diff).toContain('+This does not apply to school buses.');
    expect(diff).not.toContain('-This does not apply to school buses.');
  });

  it('shows removed text as a deletion', () => {
    const before = ['Stop for the bus.', 'This is being removed.'].join('\n');
    const after = ['Stop for the bus.'].join('\n');
    const diff = unifiedDiff(before, after);
    expect(diff).toContain('-This is being removed.');
    expect(diff).not.toContain('+This is being removed.');
  });

  it('shows a reworded sentence as a removal plus an addition', () => {
    const before = 'Yield to the bus when it is signalling.';
    const after = 'Give the right of way to the bus when it is signalling.';
    const diff = unifiedDiff(before, after);
    expect(diff).toContain('-Yield to the bus when it is signalling.');
    expect(diff).toContain('+Give the right of way to the bus when it is signalling.');
  });

  it('keeps surrounding context so a human can find the change', () => {
    const before = [
      'Before context line one.',
      'Before context line two.',
      'The changed value.',
      'After context line one.',
      'After context line two.',
    ].join('\n');
    const after = [
      'Before context line one.',
      'Before context line two.',
      'The changed value is now different.',
      'After context line one.',
      'After context line two.',
    ].join('\n');
    const diff = unifiedDiff(before, after);
    expect(diff).toContain(' Before context line two.');
    expect(diff).toContain(' After context line one.');
  });

  it('keeps output bounded on large inputs', () => {
    const base = Array.from({ length: 400 }, (_, i) => `line ${i} of a government page`);
    const before = base.join('\n');
    const after = [...base.slice(0, 100), ...Array.from({ length: 50 }, (_, i) => `replacement ${i}`), ...base.slice(150)].join('\n');
    const diff = unifiedDiff(before, after, { maxLines: 12 });
    expect(diff.split('\n').length).toBeLessThanOrEqual(14);
    expect(diff).toContain('diff truncated');
    expect(diff).toContain('-');
    expect(diff).toContain('+');
  });

  it('emits hunk headers with line numbers', () => {
    const before = ['a', 'b', 'old', 'c'].join('\n');
    const after = ['a', 'b', 'new', 'c'].join('\n');
    const diff = unifiedDiff(before, after);
    expect(diff).toMatch(/^@@ -1,4 \+1,4 @@/);
  });

  it('merges nearby changes into one hunk with correct context on both sides', () => {
    const before = ['l1', 'l2', 'a', 'm', 'b', 'l3', 'l4'].join('\n');
    const after = ['l1', 'l2', 'a', 'X', 'm', 'Y', 'b', 'l3', 'l4'].join('\n');
    const diff = unifiedDiff(before, after);
    expect(diff).toContain('+X');
    expect(diff).toContain('+Y');
    // Both edits live in a single hunk whose header spans the whole region.
    expect(diff.match(/^@@ /g)?.length).toBe(1);
    // The equal line between the edits is shown as context on the new side.
    expect(diff).toContain(' m\n');
    // Context lines on the new side come after their inserted neighbour.
    expect(diff).toContain('+X\n m\n+Y');
  });
});

describe('myersDiff', () => {
  it('produces a valid script for additions, deletions and edits', () => {
    const a = ['alpha', 'beta', 'gamma', 'delta'];
    const b = ['alpha', 'BETA', 'delta', 'epsilon'];
    const ops = myersDiff(a, b);
    // Walk the ops to reconstruct b using b's insert payloads by index.
    const out: string[] = [];
    for (const op of ops) {
      if (op.type === 'equal') {
        out.push(a[op.aIndex]!);
      } else if (op.type === 'delete') {
        continue;
      } else {
        out.push(b[op.bIndex]!);
      }
    }
    expect(out).toEqual(b);
  });

  it('handles empty inputs', () => {
    expect(myersDiff([], [])).toEqual([]);
    const allIns = myersDiff([], ['a', 'b']);
    expect(allIns.every((o) => o.type === 'insert')).toBe(true);
    const allDel = myersDiff(['a', 'b'], []);
    expect(allDel.every((o) => o.type === 'delete')).toBe(true);
  });
});

describe('snapshot lifecycle (classifySnapshot)', () => {
  const HASH = 'a'.repeat(64);
  const OTHER = 'b'.repeat(64);

  it('reports unchanged when hash and snapshot both match', () => {
    expect(classifySnapshot(HASH, true, HASH)).toEqual({ kind: 'unchanged' });
  });

  it('reports changed with a diffable previous snapshot when the hash differs', () => {
    expect(classifySnapshot(HASH, true, OTHER)).toEqual({ kind: 'changed', hasPrevious: true });
  });

  it('reports a first-ever baseline for a source with no recorded hash', () => {
    expect(classifySnapshot(null, false, HASH)).toEqual({ kind: 'new' });
  });

  it('captures a baseline snapshot when the hash matches but no snapshot exists yet', () => {
    expect(classifySnapshot(HASH, false, HASH)).toEqual({ kind: 'baseline-catchup' });
  });

  it('reports changed without a diffable snapshot when bytes differ and none is stored', () => {
    expect(classifySnapshot(HASH, false, OTHER)).toEqual({ kind: 'changed', hasPrevious: false });
  });
});