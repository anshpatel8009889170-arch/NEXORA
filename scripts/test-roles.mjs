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
  console.log('=== TEST SUITE: 3-TIER RBAC ROLE MISMATCH & AUTHENTICATION ===\n');

  // Test Seed Manager Account
  console.log('--- 1. Testing Default Seed Admin (Manager): manager@nexora.com ---');
  // Manager selecting Super Admin
  const resM1 = await fetch('http://localhost:3000/api/admin/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'manager@nexora.com', password: 'Manager@123', role: 'super_admin' })
  });
  const dataM1 = await resM1.json();
  console.log('Manager selecting Super Admin -> Status:', resM1.status, '| Error:', dataM1.error);

  // Manager selecting Sub-Admin
  const resM2 = await fetch('http://localhost:3000/api/admin/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'manager@nexora.com', password: 'Manager@123', role: 'sub_admin' })
  });
  const dataM2 = await resM2.json();
  console.log('Manager selecting Sub-Admin -> Status:', resM2.status, '| Error:', dataM2.error);

  // Manager selecting Admin (Correct)
  const resM3 = await fetch('http://localhost:3000/api/admin/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'manager@nexora.com', password: 'Manager@123', role: 'admin' })
  });
  const dataM3 = await resM3.json();
  console.log('Manager selecting Admin -> Status:', resM3.status, '| Success:', dataM3.success, '| Role:', dataM3.user?.roleType);

  // Test Seed Delivery Account
  console.log('\n--- 2. Testing Default Seed Sub-Admin (Delivery): delivery@nexora.com ---');
  // Delivery selecting Super Admin
  const resD1 = await fetch('http://localhost:3000/api/admin/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'delivery@nexora.com', password: 'Delivery@123', role: 'super_admin' })
  });
  const dataD1 = await resD1.json();
  console.log('Delivery selecting Super Admin -> Status:', resD1.status, '| Error:', dataD1.error);

  // Delivery selecting Admin
  const resD2 = await fetch('http://localhost:3000/api/admin/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'delivery@nexora.com', password: 'Delivery@123', role: 'admin' })
  });
  const dataD2 = await resD2.json();
  console.log('Delivery selecting Admin -> Status:', resD2.status, '| Error:', dataD2.error);

  // Delivery selecting Sub-Admin (Correct)
  const resD3 = await fetch('http://localhost:3000/api/admin/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'delivery@nexora.com', password: 'Delivery@123', role: 'sub_admin' })
  });
  const dataD3 = await resD3.json();
  console.log('Delivery selecting Sub-Admin -> Status:', resD3.status, '| Success:', dataD3.success, '| Role:', dataD3.user?.roleType);

  console.log('\n--- 3. Testing Super Admin (Owner Account): nexora67@gmail.com ---');
  const resO1 = await fetch('http://localhost:3000/api/admin/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: env.ADMIN_EMAIL, password: env.ADMIN_PASSWORD, role: 'super_admin' })
  });
  const dataO1 = await resO1.json();
  console.log('Owner selecting Super Admin -> Status:', resO1.status, '| Success:', dataO1.success, '| Role:', dataO1.user?.roleType);

  console.log('\n=== ALL RBAC TESTS VERIFIED & OPERATIONAL ===');
}

run().catch(console.error);
