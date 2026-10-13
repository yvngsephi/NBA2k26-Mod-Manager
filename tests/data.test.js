const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

test('courts.json exists and has valid court schema', () => {
  const courtsPath = path.join(__dirname, '..', 'data', 'courts.json');
  assert.ok(fs.existsSync(courtsPath), 'courts.json must exist');
  const courts = JSON.parse(fs.readFileSync(courtsPath, 'utf8'));
  assert.ok(Array.isArray(courts), 'courts must be an array');
  assert.ok(courts.length >= 10, 'must have at least 10 initial courts');

  for (const c of courts) {
    assert.ok(c.id, 'court must have an id');
    assert.ok(c.name, 'court must have a name');
    assert.ok(['nba', 'classic', 'street', 'custom'].includes(c.category), `valid category for ${c.id}`);
    assert.ok(c.files, `court must have files definition for ${c.id}`);
  }
});

test('teams.json contains all 30 NBA teams plus Blacktop with genuine codes', () => {
  const teamsPath = path.join(__dirname, '..', 'data', 'teams.json');
  assert.ok(fs.existsSync(teamsPath), 'teams.json must exist');
  const teams = JSON.parse(fs.readFileSync(teamsPath, 'utf8'));
  assert.ok(teams.length >= 31, 'should have at least 30 NBA teams plus Blacktop');
  const currentNBA = teams.filter(t => t.isCurrentNBA);
  assert.equal(currentNBA.length, 30, 'should have exactly 30 current NBA teams');

  for (const t of teams) {
    assert.ok(t.id, 'team must have id');
    assert.ok(t.name, 'team must have name');
    assert.ok(t.abbr, 'team must have abbreviation');
    assert.ok(t.arenaCode, 'team must have default arena code');
    assert.ok(t.floorCode, 'team must have default floor code');
  }
});

test('manifest_catalog.json contains genuine arenas and floors from game manifest', () => {
  const catalogPath = path.join(__dirname, '..', 'data', 'manifest_catalog.json');
  assert.ok(fs.existsSync(catalogPath), 'manifest_catalog.json must exist');
  const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
  assert.ok(Array.isArray(catalog.arenas), 'catalog.arenas must be an array');
  assert.ok(Array.isArray(catalog.floors), 'catalog.floors must be an array');
  assert.ok(catalog.arenas.length > 50, 'must have over 50 real arenas');
  assert.ok(catalog.floors.length > 50, 'must have over 50 real floors');
});
