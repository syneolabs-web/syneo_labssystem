import test from 'node:test';
import assert from 'node:assert/strict';
import { worked, breakDuration, completion, series, calculateMemberStreaks } from '../lib/metrics.js';

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

test('calculateMemberStreaks accurately tracks current streak, all-time record, and rhythm', () => {
  const userId = 'user-1';
  const refDate = '2026-10-24';

  // 3-day consecutive standup up to today (2026-10-22, 2026-10-23, 2026-10-24)
  // Plus an older 5-day historical streak (2026-09-01 to 2026-09-05)
  const standups = [
    { owner: userId, date: '2026-10-24', title: 'Finished sprint tasks' },
    { owner: userId, date: '2026-10-23', title: 'Reviewed pull requests' },
    { owner: userId, date: '2026-10-22', title: 'Backend schema design' },
    { owner: userId, date: '2026-09-01', title: 'Day 1' },
    { owner: userId, date: '2026-09-02', title: 'Day 2' },
    { owner: userId, date: '2026-09-03', title: 'Day 3' },
    { owner: userId, date: '2026-09-04', title: 'Day 4' },
    { owner: userId, date: '2026-09-05', title: 'Day 5' }
  ];

  // 2-day consecutive clock (2026-10-23, 2026-10-24)
  const t24 = Math.floor(new Date('2026-10-24T09:00:00Z').getTime() / 1000);
  const t23 = Math.floor(new Date('2026-10-23T09:00:00Z').getTime() / 1000);
  const clocks = [
    { user_id: userId, start: t24, end: t24 + 14400 },
    { user_id: userId, start: t23, end: t23 + 28800 }
  ];

  const res = calculateMemberStreaks(userId, standups, clocks, refDate, t24 + 15000);

  assert.equal(res.checkinStreak, 3);
  assert.equal(res.checkedToday, true);
  assert.equal(res.bestCheckinStreak, 5); // 5-day historical record
  assert.equal(res.clockStreak, 2);
  assert.equal(res.clockedToday, true);
  assert.equal(res.bestClockStreak, 2);
  assert.equal(res.totalCheckins, 8);
  assert.equal(res.totalClockDays, 2);
  assert.equal(res.last14Days.length, 14);
  assert.equal(res.last7Days.length, 7);
  assert.equal(res.last14Days[13].isToday, true);
  assert.equal(res.last14Days[13].hasCheckin, true);
  assert.equal(res.last14Days[13].hasClock, true);
});

