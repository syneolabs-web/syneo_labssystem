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

import { saveRecord, getWorkspaceState, deleteRecord, closeDatabase } from '../lib/db.js';

test('Project and Task Date Tracking & RBAC enforcement', { skip: skipDbTests }, async t => {
  const adminUser = {
    id: 'usr_admin_test_1',
    name: 'Admin Boss',
    email: 'admin@syneolab.com',
    role: 'admin'
  };

  const assignedMember = {
    id: 'usr_member_test_assigned',
    name: 'Assigned Member',
    email: 'assigned@syneolab.com',
    role: 'member'
  };

  const unassignedMember = {
    id: 'usr_member_test_unassigned',
    name: 'Unassigned Member',
    email: 'unassigned@syneolab.com',
    role: 'member'
  };

  let projectId;
  let taskId;

  await t.test('Admin can create a project with startDate and due (deadline)', async () => {
    projectId = await saveRecord(
      'projects',
      null,
      {
        title: 'Q4 Product Redesign',
        description: 'Complete overhaul of user workspace',
        startDate: '2026-10-01',
        due: '2026-12-31',
        status: 'Active',
        lead: adminUser.id,
        members: [adminUser.id, assignedMember.id]
      },
      adminUser
    );

    assert.ok(projectId);

    // Verify persisted state through getWorkspaceState
    const state = await getWorkspaceState(adminUser);
    const proj = state.projects.find(r => r.id === projectId);
    assert.ok(proj);
    assert.equal(proj.title, 'Q4 Product Redesign');
    assert.equal(proj.startDate, '2026-10-01');
    assert.equal(proj.due, '2026-12-31');
    assert.equal(proj.status, 'Active');
  });

  await t.test('Non-admin member cannot create or modify projects', async () => {
    await assert.rejects(
      async () => {
        await saveRecord(
          'projects',
          null,
          {
            title: 'Hacked Project',
            status: 'Active'
          },
          assignedMember
        );
      },
      { message: /Administrator access required/ }
    );

    await assert.rejects(
      async () => {
        await saveRecord(
          'projects',
          projectId,
          {
            title: 'Modified by Member',
            status: 'Completed'
          },
          assignedMember
        );
      },
      { message: /Administrator access required/ }
    );
  });

  await t.test('Admin can create task with kickoff date, deadline, and assigned members', async () => {
    taskId = await saveRecord(
      'tasks',
      null,
      {
        title: 'Design high-fidelity dashboard mockups',
        description: 'Deliver clean Figma components and layouts',
        project: projectId,
        assignee: assignedMember.id,
        assignees: [assignedMember.id],
        startDate: '2026-10-05',
        due: '2026-10-20',
        priority: 'High',
        status: 'To do',
        estimateHours: 16,
        department: 'Design'
      },
      adminUser
    );

    assert.ok(taskId);

    const state = await getWorkspaceState(adminUser);
    const task = state.tasks.find(r => r.id === taskId);
    assert.ok(task);
    assert.equal(task.title, 'Design high-fidelity dashboard mockups');
    assert.equal(task.startDate, '2026-10-05');
    assert.equal(task.due, '2026-10-20');
    assert.equal(task.priority, 'High');
    assert.equal(task.estimateHours, 16);
    assert.equal(task.owner, adminUser.id);
  });

  await t.test('Assigned team member CAN update execution fields of Admin-assigned task', async () => {
    await saveRecord(
      'tasks',
      taskId,
      {
        status: 'In progress',
        blocked: true,
        blockerNote: 'Awaiting design system token update',
        deliverableUrl: 'https://figma.com/design/syneo-token-mock',
        subtasks: [{ id: '1', title: 'Export SVGs', done: true }]
      },
      assignedMember
    );

    const state = await getWorkspaceState(assignedMember);
    const task = state.tasks.find(r => r.id === taskId);
    assert.ok(task);
    assert.equal(task.status, 'In progress');
    assert.equal(task.blocked, true);
    assert.equal(task.blockerNote, 'Awaiting design system token update');
    assert.equal(task.deliverableUrl, 'https://figma.com/design/syneo-token-mock');
    assert.equal(task.subtasks[0].title, 'Export SVGs');
    assert.equal(task.subtasks[0].done, true);
  });

  await t.test('Assigned team member CANNOT modify administrative scope of Admin-assigned task', async () => {
    // Attempt to tamper with title, priority, dates, deadline, project, assignees, and estimate
    await saveRecord(
      'tasks',
      taskId,
      {
        title: 'Employee Hacked Title',
        priority: 'Low',
        startDate: '2026-12-01',
        due: '2026-12-25',
        estimateHours: 1,
        project: 'other_proj',
        assignee: unassignedMember.id,
        assignees: [unassignedMember.id],
        department: 'Marketing',
        status: 'Done'
      },
      assignedMember
    );

    const state = await getWorkspaceState(assignedMember);
    const task = state.tasks.find(r => r.id === taskId);
    assert.ok(task);

    // Structural scope fields MUST stay locked to Admin-assigned original values!
    assert.equal(task.title, 'Design high-fidelity dashboard mockups');
    assert.equal(task.priority, 'High');
    assert.equal(task.startDate, '2026-10-05');
    assert.equal(task.due, '2026-10-20');
    assert.equal(task.estimateHours, 16);
    assert.equal(task.project, projectId);
    assert.equal(task.assignee, assignedMember.id);
    assert.equal(task.department, 'Design');

    // Only execution field (status) is updated
    assert.equal(task.status, 'Done');
  });

  await t.test('Unassigned employee CANNOT update Admin-assigned task (403 Forbidden)', async () => {
    await assert.rejects(
      async () => {
        await saveRecord(
          'tasks',
          taskId,
          {
            status: 'In progress',
            blockerNote: 'Unauthorized intrusion'
          },
          unassignedMember
        );
      },
      {
        message: /Least-privilege RBAC: This task was assigned by an administrator. Only assigned team members can update it./
      }
    );
  });

  // Clean up test documents
  if (taskId) await deleteRecord(taskId, adminUser);
  if (projectId) await deleteRecord(projectId, adminUser);
  await closeDatabase();
});
