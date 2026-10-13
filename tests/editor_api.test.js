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

    // 2. Genuine Manifest catalog endpoint with compatibility badges
    const catalogRes = await fetch(`${baseUrl}/api/catalog`);
    assert.equal(catalogRes.status, 200);
    const catalogData = await catalogRes.json();
    assert.equal(catalogData.success, true);
    assert.ok(Array.isArray(catalogData.arenas));
    assert.ok(Array.isArray(catalogData.floors));
    assert.ok(catalogData.arenas.length > 50);

    // Verify compatibility badge metadata
    const sampleArena = catalogData.arenas[0];
    assert.ok(sampleArena.compatibility, 'Arena has compatibility tag');
    assert.ok(sampleArena.badgeLabel, 'Arena has badge label');
    assert.ok(sampleArena.dimension, 'Arena has dimension info');

    const hsGym = catalogData.arenas.find(a => a.code === 'hsgym_int');
    if (hsGym) {
      assert.equal(hsGym.compatibility, 'hs_84ft');
      assert.equal(hsGym.dimension, '84ft');
      assert.equal(hsGym.badgeClass, 'badge-hs');
    }

    // 3. Apply court and floor to a team with Approach 2: Force 84-ft Ruleset
    const applyRes = await fetch(`${baseUrl}/api/editor/apply`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        teamId: 'team_014',
        arenaCode: 'arena_hsgym_int',
        floorCode: 'arena_hsgym_int_floor',
        force84ftRuleset: true
      })
    });
    assert.equal(applyRes.status, 200);
    const applyData = await applyRes.json();
    assert.equal(applyData.success, true);
    assert.equal(applyData.teamId, 'team_014');
    assert.equal(applyData.arenaCode, 'arena_hsgym_int');
    assert.equal(applyData.force84ftRuleset, true);
    assert.equal(applyData.ruleset, '84ft');

    // Verify active config was written with 84ft ruleset metadata
    assert.ok(fs.existsSync(mockConfigPath));
    const saved = JSON.parse(fs.readFileSync(mockConfigPath, 'utf8'));
    assert.equal(saved.activeSlots.team_014.arenaCode, 'arena_hsgym_int');
    assert.equal(saved.activeSlots.team_014.ruleset, '84ft');
    assert.equal(saved.activeSlots.team_014.force84ftRuleset, true);

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

    // 5. Test dynamic roster sync endpoint
    const syncRes = await fetch(`${baseUrl}/api/roster/sync`, { method: 'POST' });
    assert.equal(syncRes.status, 200);
    const syncData = await syncRes.json();
    assert.equal(syncData.success, true);
    assert.ok(Array.isArray(syncData.targets));
    assert.ok(syncData.targets.length >= 31);
  } finally {
    server.close();
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});
