import test from 'node:test';
import assert from 'node:assert/strict';
import { isSuperAdmin, isAdminRole, cleanUser } from '../lib/db.js';

test('isSuperAdmin correctly identifies syneolabs@gmail.com and super_admin role', () => {
  // syneolabs@gmail.com is always super admin (case-insensitive and trimmed)
  assert.equal(isSuperAdmin({ email: 'syneolabs@gmail.com' }), true);
  assert.equal(isSuperAdmin({ email: '  SYNEOLABS@GMAIL.COM  ' }), true);
  assert.equal(isSuperAdmin({ email: 'SyneoLabs@gmail.com', role: 'admin' }), true);

  // Users with explicit role 'super_admin'
  assert.equal(isSuperAdmin({ email: 'founder@syneolab.com', role: 'super_admin' }), true);
  assert.equal(isSuperAdmin({ isSuperAdmin: true }), true);

  // Regular admins and members are NOT super admin
  assert.equal(isSuperAdmin({ email: 'john@example.com', role: 'admin' }), false);
  assert.equal(isSuperAdmin({ email: 'jane@example.com', role: 'member' }), false);
  assert.equal(isSuperAdmin(null), false);
  assert.equal(isSuperAdmin(undefined), false);
});

test('isAdminRole permits both admin and super_admin, rejects member', () => {
  assert.equal(isAdminRole({ role: 'admin' }), true);
  assert.equal(isAdminRole({ role: 'super_admin' }), true);
  assert.equal(isAdminRole({ email: 'syneolabs@gmail.com', role: 'member' }), true);
  assert.equal(isAdminRole({ role: 'member' }), false);
  assert.equal(isAdminRole(null), false);
});

test('cleanUser retains role for self/admin and hides admin role from members', () => {
  const superUser = {
    _id: 'usr_super',
    name: 'Super Admin',
    email: 'syneolabs@gmail.com',
    role: 'admin',
    department: 'Management'
  };

  // Viewer is Admin or Self
  const cleanedForAdmin = cleanUser(superUser, true, 'usr_viewer_admin');
  assert.equal(cleanedForAdmin.isSuperAdmin, true);
  assert.equal(cleanedForAdmin.role, 'super_admin');

  // Viewer is another Employee (RBAC least privilege hiding)
  const cleanedForMember = cleanUser(superUser, false, 'usr_other_member');
  assert.equal(cleanedForMember.role, 'member');
  assert.equal(cleanedForMember.isSuperAdmin, true);

  // Member viewing themselves sees their own info
  const memberUser = {
    _id: 'usr_mem1',
    name: 'Engineer One',
    email: 'eng@example.com',
    role: 'member',
    department: 'Engineering'
  };
  const cleanedSelf = cleanUser(memberUser, false, 'usr_mem1');
  assert.equal(cleanedSelf.role, 'member');
  assert.equal(cleanedSelf.name, 'Engineer One');
});
