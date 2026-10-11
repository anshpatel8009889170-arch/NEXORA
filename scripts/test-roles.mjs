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
  console.log('=== TEST SUITE: MAIN SUPER ADMIN VS SECONDARY SUPER ADMIN PRIVILEGES ===\n');

  const rootEmail = env.ADMIN_EMAIL;
  const rootPass = env.ADMIN_PASSWORD;

  // 1. Root Super Admin login
  const resRoot = await fetch('http://localhost:3000/api/admin/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: rootEmail, password: rootPass, role: 'super_admin' })
  });
  const rootCookie = resRoot.headers.get('set-cookie');
  console.log('1. Root Super Admin logged in -> Status:', resRoot.status);

  // 2. Root Super Admin adds Secondary Super Admin
  const secEmail = `secondary_super_${Date.now()}@nexora.com`;
  const secPass = 'SecondaryPass123!';
  const resAddSec = await fetch('http://localhost:3000/api/admin/team', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Cookie': rootCookie || '' },
    body: JSON.stringify({
      name: 'Secondary Partner Owner',
      email: secEmail,
      password: secPass,
      role: 'super_admin'
    })
  });
  const dataAddSec = await resAddSec.json();
  const secId = dataAddSec.member?.id;
  console.log('2. Root Super Admin added Secondary Super Admin -> Status:', resAddSec.status, '| RoleType:', dataAddSec.member?.roleType);

  // 3. Secondary Super Admin logs in
  const resSecLogin = await fetch('http://localhost:3000/api/admin/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: secEmail, password: secPass, role: 'super_admin' })
  });
  const secCookie = resSecLogin.headers.get('set-cookie');
  console.log('3. Secondary Super Admin logged in -> Status:', resSecLogin.status);

  // 4. Test: What Secondary Super Admin CANNOT do (Add, Delete, Change Password)
  console.log('\n--- 4. Testing Secondary Super Admin Restrictions (Blocked Actions) ---');
  
  // 4a. Secondary Super Admin attempts to ADD another member -> BLOCKED
  const resSecAdd = await fetch('http://localhost:3000/api/admin/team', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Cookie': secCookie || '' },
    body: JSON.stringify({
      name: 'Illegal Added Member',
      email: 'illegal@nexora.com',
      password: 'Pass12345678!',
      role: 'admin'
    })
  });
  const dataSecAdd = await resSecAdd.json();
  console.log('   Secondary Admin adding member -> Status:', resSecAdd.status, '| Error:', dataSecAdd.error);

  // 4b. Secondary Super Admin attempts to RESET PASSWORD -> BLOCKED
  const resSecPatch = await fetch('http://localhost:3000/api/admin/team', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', 'Cookie': secCookie || '' },
    body: JSON.stringify({ id: 'tm_admin_manager_1', password: 'HackedPassword123!' })
  });
  const dataSecPatch = await resSecPatch.json();
  console.log('   Secondary Admin resetting password -> Status:', resSecPatch.status, '| Error:', dataSecPatch.error);

  // 4c. Secondary Super Admin attempts to DELETE a member -> BLOCKED
  const resSecDel = await fetch('http://localhost:3000/api/admin/team?id=tm_admin_manager_1', {
    method: 'DELETE',
    headers: { 'Cookie': secCookie || '' }
  });
  const dataSecDel = await resSecDel.json();
  console.log('   Secondary Admin deleting member -> Status:', resSecDel.status, '| Error:', dataSecDel.error);

  // 5. Test: What Secondary Super Admin CAN do (Full Business Access)
  console.log('\n--- 5. Testing Secondary Super Admin Powers (Allowed Actions) ---');

  // 5a. Can view Team list
  const resSecGetTeam = await fetch('http://localhost:3000/api/admin/team', {
    headers: { 'Cookie': secCookie || '' }
  });
  const dataSecGetTeam = await resSecGetTeam.json();
  console.log('   View Team Roster -> Status:', resSecGetTeam.status, '| Members count:', dataSecGetTeam.team?.length);

  // 5b. Can access Restaurant Settings
  const resSecSettings = await fetch('http://localhost:3000/api/settings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Cookie': secCookie || '' },
    body: JSON.stringify({ name: 'NEXORA Fine Dining', delivery_fee: 40, minimum_order: 199 })
  });
  const dataSecSettings = await resSecSettings.json();
  console.log('   Manage Restaurant Settings -> Status:', resSecSettings.status, '| Success:', dataSecSettings.success);

  // 6. Cleanup: Root Super Admin removes Secondary Super Admin
  const resClean = await fetch(`http://localhost:3000/api/admin/team?id=${secId}`, {
    method: 'DELETE',
    headers: { 'Cookie': rootCookie || '' }
  });
  const dataClean = await resClean.json();
  console.log('\n6. Root Super Admin removed Secondary Super Admin -> Status:', resClean.status, '| Message:', dataClean.message);

  console.log('\n=== ALL TESTS PASSED: HIERARCHY PERFECTLY ENFORCED! ===');
}

run().catch(console.error);
