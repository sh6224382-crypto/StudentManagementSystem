const assert = require('node:assert/strict');
const { after, before, test } = require('node:test');

process.env.CORS_ORIGIN = 'http://localhost:5173,https://admin.example.com';
const app = require('../src/app');

let server;
let baseUrl;

before(async () => {
  server = await new Promise((resolve) => {
    const listener = app.listen(0, () => resolve(listener));
  });
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});

test('health endpoint reports API status', async () => {
  const response = await fetch(`${baseUrl}/health`);

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { status: 'ok' });
});

test('CORS allows each configured frontend origin', async () => {
  for (const origin of ['http://localhost:5173', 'https://admin.example.com']) {
    const response = await fetch(`${baseUrl}/health`, {
      headers: { Origin: origin }
    });

    assert.equal(response.headers.get('access-control-allow-origin'), origin);
  }
});

test('unknown routes return a not found response', async () => {
  const response = await fetch(`${baseUrl}/not-a-route`);

  assert.equal(response.status, 404);
  assert.match((await response.json()).error, /Route not found/);
});

test('student endpoints reject malformed JSON with a client error', async () => {
  const response = await fetch(`${baseUrl}/api/students`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{"firstName":'
  });

  assert.equal(response.status, 400);
});

test('student endpoints reject malformed IDs without querying MongoDB', async () => {
  const response = await fetch(`${baseUrl}/api/students/not-an-object-id`);

  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), { error: 'Invalid student ID' });
});
