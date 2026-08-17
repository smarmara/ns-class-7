/**
 * A small, dependency-free line diff used by the source checker to show a
 * maintainer what actually changed in an official source.
 *
 * The previous normalized content is stored as a snapshot (one file per
 * source) so the checker can render a genuine old-versus-new report instead
 * of just printing the first lines of the current page.
 *
 * Myers' O(ND) edit script keeps this fast for realistic government pages
 * (a few thousand lines with a handful of edits). Output is bounded so a
 * fully rewritten page cannot flood the report or the terminal.
 */

export interface DiffOptions {
  /** Number of unchanged lines of context around each change. */
  context?: number;
  /** Hard cap on the number of lines rendered in the output. */
  maxLines?: number;
}

type Op =
  | { type: 'equal'; aIndex: number; bIndex: number }
  | { type: 'delete'; aIndex: number }
  | { type: 'insert'; bIndex: number };

interface ChangeRun {
  /** 0-based old-text index where this run begins; deletions start here. */
  oldStart: number;
  oldCount: number;
  /** 0-based new-text index where this run begins; insertions start here. */
  newStart: number;
  newCount: number;
}

/**
 * Render a unified-style diff of two texts.
 *
 * Returns an empty string when the texts are identical. Each change is
 * surrounded by `context` unchanged lines and uses the familiar `-`/`+`
 * markers, so a changed number or a reworded sentence is immediately visible.
 * Output never exceeds `maxLines` lines.
 */
export function unifiedDiff(oldText: string, newText: string, options: DiffOptions = {}): string {
  const context = options.context ?? 2;
  const maxLines = options.maxLines ?? 80;

  const oldLines = oldText.split('\n');
  const newLines = newText.split('\n');

  if (oldText === newText) return '';

  const ops = myersDiff(oldLines, newLines);
  const runs = changeRuns(ops);
  if (runs.length === 0) return '';

  const hunks = buildHunks(runs, oldLines.length, newLines.length, context);
  const out: string[] = [];

  for (const hunk of hunks) {
    if (out.length >= maxLines) break;

    const oldLen = hunk.oldEnd - hunk.oldStart;
    const newLen = hunk.newEnd - hunk.newStart;
    out.push(`@@ -${hunk.oldStart + 1}${oldLen === 1 ? '' : `,${oldLen}`} +${hunk.newStart + 1}${newLen === 1 ? '' : `,${newLen}`} @@`);

    const inDeleted = (i: number) =>
      hunk.runs.some((r) => i >= r.oldStart && i < r.oldStart + r.oldCount);
    for (let i = hunk.oldStart; i < hunk.oldEnd; i++) {
      out.push(inDeleted(i) ? `-${oldLines[i]}` : ` ${oldLines[i]}`);
      if (out.length >= maxLines) break;
    }

    const inInserted = (i: number) =>
      hunk.runs.some((r) => i >= r.newStart && i < r.newStart + r.newCount);
    for (let i = hunk.newStart; i < hunk.newEnd; i++) {
      out.push(inInserted(i) ? `+${newLines[i]}` : ` ${newLines[i]}`);
      if (out.length >= maxLines) break;
    }
  }

  const truncated = out.length >= maxLines;
  if (truncated) {
    const remaining = runs.reduce((n, r) => n + r.oldCount + r.newCount, 0);
    out.push(`… diff truncated — ${remaining}+ more changed line(s) not shown`);
  }

  return out.join('\n');
}

interface Hunk {
  oldStart: number;
  oldEnd: number;
  newStart: number;
  newEnd: number;
  runs: ChangeRun[];
}

/**
 * Group change runs into hunks, merging runs whose context regions overlap so
 * a block of nearby edits reads as one diff section with a single header.
 */
function buildHunks(runs: ChangeRun[], oldLen: number, newLen: number, context: number): Hunk[] {
  const hunks: Hunk[] = [];
  let current: Hunk | null = null;

  const open = (run: ChangeRun): Hunk => {
    const hunk: Hunk = {
      oldStart: Math.max(0, run.oldStart - context),
      oldEnd: Math.min(oldLen, run.oldStart + run.oldCount + context),
      newStart: Math.max(0, run.newStart - context),
      newEnd: Math.min(newLen, run.newStart + run.newCount + context),
      runs: [run],
    };
    hunks.push(hunk);
    return hunk;
  };

  for (const run of runs) {
    if (!current) {
      current = open(run);
      continue;
    }
    const last = current.runs[current.runs.length - 1]!;
    const gap = run.oldStart - (last.oldStart + last.oldCount);
    if (gap < 2 * context) {
      current.oldEnd = Math.min(oldLen, run.oldStart + run.oldCount + context);
      current.newEnd = Math.min(newLen, run.newStart + run.newCount + context);
      current.runs.push(run);
    } else {
      current = open(run);
    }
  }

  return hunks;
}

/** Group the edit script into contiguous blocks of change. */
function changeRuns(ops: Op[]): ChangeRun[] {
  const runs: ChangeRun[] = [];
  let oldIndex = 0;
  let newIndex = 0;
  let run: ChangeRun | null = null;

  const begin = (): ChangeRun => ({
    oldStart: oldIndex,
    oldCount: 0,
    newStart: newIndex,
    newCount: 0,
  });

  for (const op of ops) {
    if (op.type === 'equal') {
      if (run) {
        runs.push(run);
        run = null;
      }
      oldIndex++;
      newIndex++;
      continue;
    }
    if (!run) run = begin();
    if (op.type === 'delete') {
      run.oldCount++;
      oldIndex++;
    } else {
      run.newCount++;
      newIndex++;
    }
  }
  if (run) runs.push(run);
  return runs;
}

/**
 * Myers O(ND) shortest edit script between two arrays.
 *
 * Returns the sequence of operations to turn `a` into `b`, in order. Both
 * arrays must contain comparable (primitive) values.
 */
export function myersDiff<T>(a: readonly T[], b: readonly T[]): Op[] {
  const N = a.length;
  const M = b.length;
  if (N === 0 && M === 0) return [];

  const MAX = N + M;
  const offset = MAX;
  const v = new Int32Array(2 * MAX + 1);
  const trace: Int32Array[] = [];
  let foundD = -1;

  for (let d = 0; d <= MAX; d++) {
    const snapshot = v.slice();
    for (let k = -d; k <= d; k += 2) {
      let x: number;
      if (k === -d || (k !== d && v[offset + k - 1]! < v[offset + k + 1]!)) {
        x = v[offset + k + 1]!; // down
      } else {
        x = v[offset + k - 1]! + 1; // right
      }
      let y = x - k;
      while (x < N && y < M && a[x] === b[y]) {
        x++;
        y++;
      }
      v[offset + k] = x;
      if (x >= N && y >= M) {
        foundD = d;
        break;
      }
    }
    trace.push(snapshot);
    if (foundD !== -1) break;
  }

  if (foundD === -1) {
    // Unreachable for finite inputs; guard so the function still returns a
    // coherent result rather than throwing.
    return allDifferent(a, b);
  }

  return backtrack(a, b, trace, foundD, offset);
}

function backtrack<T>(a: readonly T[], b: readonly T[], trace: Int32Array[], d: number, offset: number): Op[] {
  const ops: Op[] = [];
  let x = a.length;
  let y = b.length;

  for (; d > 0; d--) {
    const v = trace[d]!;
    const k = x - y;
    let prevK: number;
    if (k === -d || (k !== d && v[offset + k - 1]! < v[offset + k + 1]!)) {
      prevK = k + 1;
    } else {
      prevK = k - 1;
    }
    const prevX = v[offset + prevK]!;
    const prevY = prevX - prevK;

    while (x > prevX && y > prevY) {
      ops.push({ type: 'equal', aIndex: x - 1, bIndex: y - 1 });
      x--;
      y--;
    }

    if (x === prevX) {
      ops.push({ type: 'insert', bIndex: y - 1 });
      y--;
    } else {
      ops.push({ type: 'delete', aIndex: x - 1 });
      x--;
    }
  }

  // The d=0 frontier leaves a diagonal run of equal lines before the first edit.
  while (x > 0 && y > 0) {
    ops.push({ type: 'equal', aIndex: x - 1, bIndex: y - 1 });
    x--;
    y--;
  }

  return ops.reverse();
}

/** Degenerate fallback used only if Myers somehow fails to converge. */
function allDifferent<T>(a: readonly T[], b: readonly T[]): Op[] {
  const ops: Op[] = a.map((_, i) => ({ type: 'delete' as const, aIndex: i }));
  return ops.concat(b.map((_, i) => ({ type: 'insert' as const, bIndex: i })));
}