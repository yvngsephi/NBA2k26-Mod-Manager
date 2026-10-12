const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createApp } = require('../server/app');

test('API endpoints return expected responses and handle apply/reset', async (t) => {
  const tmpDir = path.join(__dirname, 'tmp_api');
  const mockModsDir = path.join(tmpDir, 'Mods');
  const mockConfigPath = path.join(tmpDir, 'active_config.json');

  fs.rmSync(tmpDir, { recursive: true, force: true });
  fs.mkdirSync(mockModsDir, { recursive: true });

  const app = createApp({
    configPath: mockConfigPath,
    modsPath: mockModsDir
  });

  const server = app.listen(0);
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    // 1. GET /api/courts
    const courtsRes = await fetch(`${baseUrl}/api/courts`);
    assert.equal(courtsRes.status, 200);
    const courtsData = await courtsRes.json();
    assert.equal(courtsData.success, true);
    assert.ok(Array.isArray(courtsData.courts));
    assert.ok(courtsData.courts.length > 0);

    // 2. GET /api/status
    const statusRes = await fetch(`${baseUrl}/api/status`);
    assert.equal(statusRes.status, 200);
    const statusData = await statusRes.json();
    assert.equal(statusData.success, true);
    assert.equal(statusData.modsExists, true);

    // 3. POST /api/apply
    const applyRes = await fetch(`${baseUrl}/api/apply`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        slot: 'blacktop',
        courtId: 'builtin-madison-square-garden'
      })
    });
    assert.equal(applyRes.status, 200);
    const applyData = await applyRes.json();
    assert.equal(applyData.success, true);
    assert.equal(applyData.slot, 'blacktop');
    assert.equal(applyData.courtId, 'builtin-madison-square-garden');

    // 4. POST /api/reset
    const resetRes = await fetch(`${baseUrl}/api/reset`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slot: 'blacktop' })
    });
    assert.equal(resetRes.status, 200);
    const resetData = await resetRes.json();
    assert.equal(resetData.success, true);

  } finally {
    server.close();
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});
