const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { SwapperEngine } = require('../server/swapper');

test('SwapperEngine applies court files to target slot and resets cleanly', () => {
  const tmpDir = path.join(__dirname, 'tmp');
  const mockModsDir = path.join(tmpDir, 'Mods');
  const mockLibDir = path.join(tmpDir, 'library');
  const mockConfigPath = path.join(tmpDir, 'active_config.json');

  fs.rmSync(tmpDir, { recursive: true, force: true });
  fs.mkdirSync(mockModsDir, { recursive: true });
  fs.mkdirSync(path.join(mockLibDir, 'msg'), { recursive: true });

  fs.writeFileSync(path.join(mockLibDir, 'msg', 'arena_blacktop_ext.iff'), 'dummy-court-content');

  const swapper = new SwapperEngine({
    configPath: mockConfigPath,
    modsPath: mockModsDir,
    libraryDir: mockLibDir
  });

  // Apply to blacktop
  const result = swapper.applyCourt({
    slot: 'blacktop',
    courtId: 'madison-square-garden',
    courtName: 'Madison Square Garden',
    sourceFiles: {
      blacktop: path.join(mockLibDir, 'msg', 'arena_blacktop_ext.iff')
    }
  });

  assert.equal(result.success, true);
  assert.ok(fs.existsSync(path.join(mockModsDir, 'levels', 'arena_blacktop_ext.iff')));

  // Verify active state
  const state = swapper.getActiveState();
  assert.equal(state.activeSlots.blacktop.courtId, 'madison-square-garden');
  assert.deepEqual(state.activeSlots.blacktop.appliedFiles, ['levels/arena_blacktop_ext.iff']);

  // Reset blacktop
  const resetResult = swapper.resetSlot('blacktop');
  assert.equal(resetResult.success, true);
  assert.equal(fs.existsSync(path.join(mockModsDir, 'levels', 'arena_blacktop_ext.iff')), false);
  assert.equal(swapper.getActiveState().activeSlots.blacktop, undefined);

  // Cleanup
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

test('SwapperEngine handles fallback when source file is provided', () => {
  const tmpDir = path.join(__dirname, 'tmp_partial');
  const mockModsDir = path.join(tmpDir, 'Mods');
  const mockConfigPath = path.join(tmpDir, 'active_config.json');

  fs.rmSync(tmpDir, { recursive: true, force: true });
  fs.mkdirSync(mockModsDir, { recursive: true });

  const dummyFloor = path.join(tmpDir, 'only_floor.iff');
  fs.writeFileSync(dummyFloor, 'partial-floor');

  const swapper = new SwapperEngine({
    configPath: mockConfigPath,
    modsPath: mockModsDir
  });

  const result = swapper.applyCourt({
    slot: 'blacktop',
    courtId: 'custom-floor-only',
    courtName: 'Custom Floor Only',
    sourceFiles: {
      floor: dummyFloor
    }
  });

  assert.equal(result.success, true);
  assert.ok(fs.existsSync(path.join(mockModsDir, 'levels', 'arena_blacktop_ext.iff')));

  fs.rmSync(tmpDir, { recursive: true, force: true });
});
