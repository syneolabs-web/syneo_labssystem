import test from 'node:test';
import assert from 'node:assert/strict';
import { worked, breakDuration, completion, series } from '../lib/metrics.js';

test('worked and breakDuration track server-persisted work and break seconds', () => {
  const c1 = { start: 1000, end: null, break_seconds: 300, break_start: null };
  assert.equal(worked(c1, 2000), 700);
  assert.equal(breakDuration(c1, 2000), 300);

  // On active break starting at 1800, current time 2000
  const c2 = { start: 1000, end: null, break_seconds: 300, break_start: 1800 };
  assert.equal(worked(c2, 2000), 500);
  assert.equal(breakDuration(c2, 2000), 500);

  // Completed session ignores any stale break_start so break is never double-counted
  const c3 = { start: 1000, end: 2000, break_seconds: 250, break_start: 1500 };
  assert.equal(worked(c3, 2500), 750);
  assert.equal(breakDuration(c3, 2500), 250);
  assert.equal(worked(c3, 2500) + breakDuration(c3, 2500), 1000);

  // Break seconds cannot exceed total elapsed span
  const c4 = { start: 1000, end: 1500, break_seconds: 900, break_start: null };
  assert.equal(worked(c4, 2000), 0);
  assert.equal(breakDuration(c4, 2000), 500);
});

test('completion and series helpers', () => {
  const comp = completion([
    { status: 'Done' },
    { status: 'In progress' },
    { status: 'In review' },
    { status: 'To do' }
  ]);
  assert.equal(comp.percent, 25);
  assert.equal(comp.done, 1);
  assert.equal(comp.ongoing, 2);
  assert.equal(comp.pending, 1);

  const s = series([], 7, 1700000000);
  assert.equal(s.length, 7);
});

