// Simple local test for /api/students/bulk-text
// Usage: node server/scripts/test-bulk-text.js
// Optional env: API_BASE (default http://localhost:4001/api), PASS (default aryan123)

const base = process.env.API_BASE || 'http://localhost:4001/api';
const username = 'Aryan';
const password = process.env.PASS || 'aryan123';

async function main() {
  try {
    const loginRes = await fetch(base + '/auth/login', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    if (!loginRes.ok) {
      const txt = await loginRes.text();
      throw new Error('Login failed: ' + loginRes.status + ' ' + txt);
    }
    const { token } = await loginRes.json();
    if (!token) throw new Error('No token in login response');

    const text = 'Bulk Local A, STU-901, 9999999999\nBulk Local B, STU-902';
    const bulkRes = await fetch(base + '/students/bulk-text', {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: 'Bearer ' + token },
      body: JSON.stringify({ text }),
    });
    const bulk = await bulkRes.json().catch(() => ({}));
    if (!bulkRes.ok) throw new Error('Bulk error: ' + bulkRes.status + ' ' + JSON.stringify(bulk));
    console.log('Bulk result:', bulk);

    const listRes = await fetch(base + '/students', {
      headers: { authorization: 'Bearer ' + token },
    });
    const students = await listRes.json();
    console.log('Students total:', students.length);
    console.log('Last few:', students.slice(-3));
  } catch (e) {
    console.error('TEST FAILED:', e);
    process.exit(1);
  }
}

main();
