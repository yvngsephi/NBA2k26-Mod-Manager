const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createApp } = require('../server/app');

test('Editor API endpoints provide live status, catalog, and apply/reset without file extraction', async () => {
  const tmpDir = path.join(__dirname, 'tmp_editor_api');
  const mockConfigPath = path.join(tmpDir, 'active_config.json');

  fs.rmSync(tmpDir, { recursive: true, force: true });
  fs.mkdirSync(tmpDir, { recursive: true });

  const app = createApp({
    configPath: mockConfigPath
  });

  const server = app.listen(0);
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    // 1. Live game status endpoint
    const statusRes = await fetch(`${baseUrl}/api/game/status`);
    assert.equal(statusRes.status, 200);
    const statusData = await statusRes.json();
    assert.equal(statusData.success, true);
    assert.ok('running' in statusData);
    assert.ok('statusMessage' in statusData);

    // 2. Genuine Manifest catalog endpoint
    const catalogRes = await fetch(`${baseUrl}/api/catalog`);
    assert.equal(catalogRes.status, 200);
    const catalogData = await catalogRes.json();
    assert.equal(catalogData.success, true);
    assert.ok(Array.isArray(catalogData.arenas));
    assert.ok(Array.isArray(catalogData.floors));
    assert.ok(catalogData.arenas.length > 50);

    // 3. Apply court and floor to a team (e.g. Miami Heat to United Center arena and floor)
    const applyRes = await fetch(`${baseUrl}/api/editor/apply`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        teamId: 'team_014',
        arenaCode: 'arena_003_int',
        floorCode: 'floor_003_int'
      })
    });
    assert.equal(applyRes.status, 200);
    const applyData = await applyRes.json();
    assert.equal(applyData.success, true);
    assert.equal(applyData.teamId, 'team_014');
    assert.equal(applyData.arenaCode, 'arena_003_int');
    assert.equal(applyData.floorCode, 'floor_003_int');

    // Verify active config was written
    assert.ok(fs.existsSync(mockConfigPath));
    const saved = JSON.parse(fs.readFileSync(mockConfigPath, 'utf8'));
    assert.equal(saved.activeSlots.team_014.arenaCode, 'arena_003_int');
    assert.equal(saved.activeSlots.team_014.floorCode, 'floor_003_int');

    // 4. Reset team back to default
    const resetRes = await fetch(`${baseUrl}/api/editor/reset`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        teamId: 'team_014'
      })
    });
    assert.equal(resetRes.status, 200);
    const resetData = await resetRes.json();
    assert.equal(resetData.success, true);

    const savedAfterReset = JSON.parse(fs.readFileSync(mockConfigPath, 'utf8'));
    assert.equal(savedAfterReset.activeSlots.team_014, undefined);
  } finally {
    server.close();
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});
