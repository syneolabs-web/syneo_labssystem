import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

// Auto-load .env.local if present
if (fs.existsSync('.env.local')) {
  const content = fs.readFileSync('.env.local', 'utf8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx !== -1) {
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim().replace(/^['"]|['"]$/g, '');
      if (!process.env[key]) process.env[key] = val;
    }
  }
}

const skipDbTests = !process.env.MONGODB_URI && 'set MONGODB_URI or run against dev environment with database';

import { saveRecord, deleteRecord, getWorkspaceState, closeDatabase } from '../lib/db.js';

test('Pulse Single Daily Check-in Enforcement', { skip: skipDbTests }, async t => {
  const memberA = {
    id: 'usr_pulse_test_member_a_' + Date.now(),
    name: 'Member Alpha',
    email: 'alpha@syneolab.com',
    role: 'member'
  };

  const memberB = {
    id: 'usr_pulse_test_member_b_' + Date.now(),
    name: 'Member Beta',
    email: 'beta@syneolab.com',
    role: 'member'
  };

  let standupAId;
  let standupBId;

  await t.test('Member A can post their daily check-in for today', async () => {
    standupAId = await saveRecord(
      'standups',
      null,
      {
        title: 'Building notification module',
        mood: 'Focused',
        yesterday: 'Finished auth flow',
        blockers: ''
      },
      memberA
    );
    assert.ok(standupAId, 'First standup created successfully');
  });

  await t.test('Member A cannot post a duplicate check-in for the same day (rejected with 400)', async () => {
    await assert.rejects(
      async () => {
        await saveRecord(
          'standups',
          null,
          {
            title: 'Duplicate check-in attempt',
            mood: 'Energized',
            yesterday: '',
            blockers: ''
          },
          memberA
        );
      },
      err => {
        assert.equal(err.status, 400);
        assert.match(err.message, /already checked in today/i);
        return true;
      }
    );
  });

  await t.test('Member A CAN edit their existing check-in for today', async () => {
    const updatedId = await saveRecord(
      'standups',
      standupAId,
      {
        title: 'Building notification module (Updated)',
        mood: 'Energized',
        yesterday: 'Finished auth flow and wrote tests',
        blockers: 'Waiting on staging API key'
      },
      memberA
    );
    assert.equal(updatedId, standupAId, 'Editing existing check-in keeps same record ID');
  });

  await t.test('Member B CAN post their own daily check-in for today', async () => {
    standupBId = await saveRecord(
      'standups',
      null,
      {
        title: 'Reviewing design system components',
        mood: 'Focused',
        yesterday: '',
        blockers: ''
      },
      memberB
    );
    assert.ok(standupBId, 'Member B check-in created successfully');
  });

  let goalId;
  await t.test('Goal current progress accepts 89, 100, and clamps values > 100 to 100', async () => {
    goalId = await saveRecord(
      'goals',
      null,
      {
        title: 'Q4 Frontend Velocity',
        currentValue: 89,
        targetValue: 100,
        period: 'quarterly',
        status: 'On track'
      },
      memberA
    );
    assert.ok(goalId, 'Goal created');
    let ws = await getWorkspaceState(memberA);
    let g = ws.goals.find(item => item.id === goalId);
    assert.equal(g.currentValue, 89, 'Current value 89 accepted');

    // Update to 100
    await saveRecord(
      'goals',
      goalId,
      {
        currentValue: 100
      },
      memberA
    );
    ws = await getWorkspaceState(memberA);
    g = ws.goals.find(item => item.id === goalId);
    assert.equal(g.currentValue, 100, 'Current value 100 accepted');
    assert.equal(g.status, 'Completed', '100% progress automatically completes goal');

    // Attempt to set 250 -> clamped to 100
    await saveRecord(
      'goals',
      goalId,
      {
        currentValue: 250
      },
      memberA
    );
    ws = await getWorkspaceState(memberA);
    g = ws.goals.find(item => item.id === goalId);
    assert.equal(g.currentValue, 100, 'Current value clamped to maximum 100');
  });

  await t.test('Clean up test records', async () => {
    if (standupAId) await deleteRecord(standupAId, memberA);
    if (standupBId) await deleteRecord(standupBId, memberB);
    if (goalId) await deleteRecord(goalId, memberA);
    await closeDatabase();
  });
});
