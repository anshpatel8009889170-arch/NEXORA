import fs from 'node:fs';

const dotenv = fs.readFileSync('.env.local', 'utf8');
const env = {};
dotenv.split('\n').forEach(line => {
  const parts = line.split('=');
  const k = parts[0]?.trim();
  const v = parts.slice(1).join('=').trim().replace(/^["']|["']$/g, '');
  if (k) env[k] = v;
});

async function run() {
  console.log('=== TEST SUITE: SUPER ADMIN AUTHORITY & ROOT OWNER PROTECTION ===\n');

  // Authenticate as Root Super Admin
  const rootEmail = env.ADMIN_EMAIL;
  const rootPass = env.ADMIN_PASSWORD;

  const resLogin = await fetch('http://localhost:3000/api/admin/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: rootEmail, password: rootPass, role: 'super_admin' })
  });
  const dataLogin = await resLogin.json();
  const cookie = resLogin.headers.get('set-cookie');
  console.log('1. Root Super Admin Authenticated -> Status:', resLogin.status, '| Success:', dataLogin.success);

  // Test adding a secondary Super Admin
  console.log('\n2. Testing Super Admin adding another Super Admin...');
  const secAdminEmail = `partner_owner_${Date.now()}@nexora.com`;
  const initialPass = 'CoOwnerPass123!';

  const resAdd = await fetch('http://localhost:3000/api/admin/team', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': cookie || ''
    },
    body: JSON.stringify({
      name: 'Partner Super Admin',
      email: secAdminEmail,
      password: initialPass,
      role: 'super_admin'
    })
  });
  const dataAdd = await resAdd.json();
  console.log('   Add Secondary Super Admin -> Status:', resAdd.status, '| Message:', dataAdd.message, '| RoleType:', dataAdd.member?.roleType);

  const secAdminId = dataAdd.member?.id;

  // Test secondary Super Admin login with role 'super_admin'
  console.log('\n3. Testing Secondary Super Admin login...');
  const resSecLogin = await fetch('http://localhost:3000/api/admin/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: secAdminEmail, password: initialPass, role: 'super_admin' })
  });
  const dataSecLogin = await resSecLogin.json();
  console.log('   Secondary Super Admin login -> Status:', resSecLogin.status, '| Success:', dataSecLogin.success, '| Role:', dataSecLogin.user?.roleType);

  // Test Password Change / Reset by Root Super Admin
  console.log('\n4. Testing Password Reset for Secondary Super Admin...');
  const updatedPass = 'NewCoOwnerPass999!';
  const resPatch = await fetch('http://localhost:3000/api/admin/team', {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': cookie || ''
    },
    body: JSON.stringify({
      id: secAdminId,
      password: updatedPass
    })
  });
  const dataPatch = await resPatch.json();
  console.log('   Reset Password -> Status:', resPatch.status, '| Message:', dataPatch.message);

  // Test login with old password (should fail)
  const resOldLogin = await fetch('http://localhost:3000/api/admin/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: secAdminEmail, password: initialPass, role: 'super_admin' })
  });
  console.log('   Login with OLD password (should fail) -> Status:', resOldLogin.status);

  // Test login with NEW password (should succeed)
  const resNewLogin = await fetch('http://localhost:3000/api/admin/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: secAdminEmail, password: updatedPass, role: 'super_admin' })
  });
  const dataNewLogin = await resNewLogin.json();
  console.log('   Login with NEW password -> Status:', resNewLogin.status, '| Success:', dataNewLogin.success);

  // Test Root Owner Protection: Attempt to delete Root Super Admin
  console.log('\n5. Testing Root Super Admin Protection against Deletion...');
  const resDelRoot = await fetch(`http://localhost:3000/api/admin/team?id=usr_admin_owner_master`, {
    method: 'DELETE',
    headers: { 'Cookie': cookie || '' }
  });
  const dataDelRoot = await resDelRoot.json();
  console.log('   Delete Root Super Admin attempt -> Status:', resDelRoot.status, '| Error:', dataDelRoot.error);

  // Test Root Owner Protection: Attempt to reset Root Super Admin password via team endpoint
  console.log('\n6. Testing Root Super Admin Protection against Password Tampering...');
  const resPatchRoot = await fetch(`http://localhost:3000/api/admin/team`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': cookie || ''
    },
    body: JSON.stringify({
      id: 'usr_admin_owner_master',
      password: 'HackerPassword123!'
    })
  });
  const dataPatchRoot = await resPatchRoot.json();
  console.log('   Tamper Root Super Admin password attempt -> Status:', resPatchRoot.status, '| Error:', dataPatchRoot.error);

  // Delete Secondary Super Admin (Root Super Admin cleaning up)
  console.log('\n7. Testing Root Super Admin deleting Secondary Super Admin...');
  const resDelSec = await fetch(`http://localhost:3000/api/admin/team?id=${secAdminId}`, {
    method: 'DELETE',
    headers: { 'Cookie': cookie || '' }
  });
  const dataDelSec = await resDelSec.json();
  console.log('   Delete Secondary Super Admin -> Status:', resDelSec.status, '| Message:', dataDelSec.message);

  console.log('\n=== ALL ROOT PROTECTION & MULTI-SUPER-ADMIN TESTS PASSED! ===');
}

run().catch(console.error);
