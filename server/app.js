const express = require('express');
const path = require('node:path');
const fs = require('node:fs');
const os = require('node:os');
const { execFileSync } = require('node:child_process');
const { SwapperEngine } = require('./swapper');
const { optimizeCourtArchive } = require('./optimizer');

const userHome = process.env.USERPROFILE || os.homedir();
const PYTHON_BIN = process.env.PYTHON_BIN || path.join(userHome, 'Downloads', '2k26mods', '2kvenuelab', 'app', 'python', 'python.exe');
const CONNECTOR_SCRIPT = path.join(__dirname, 'game_connector.py');

function loadCourts(courtsPath) {
  try {
    const p = courtsPath || path.join(__dirname, '..', 'data', 'courts.json');
    if (fs.existsSync(p)) {
      return JSON.parse(fs.readFileSync(p, 'utf8'));
    }
  } catch (err) {
    console.error('Error loading courts:', err);
  }
  return [];
}

function loadTeams(teamsPath) {
  try {
    const p = teamsPath || path.join(__dirname, '..', 'data', 'teams.json');
    if (fs.existsSync(p)) {
      return JSON.parse(fs.readFileSync(p, 'utf8'));
    }
  } catch (err) {
    console.error('Error loading teams:', err);
  }
  return [];
}

function loadManifestCatalog() {
  const p = path.join(__dirname, '..', 'data', 'manifest_catalog.json');
  if (fs.existsSync(p)) {
    try {
      return JSON.parse(fs.readFileSync(p, 'utf8'));
    } catch {
      // Fallback
    }
  }
  return { arenas: [], floors: [] };
}

function runConnector(command, args = []) {
  if (fs.existsSync(PYTHON_BIN) && fs.existsSync(CONNECTOR_SCRIPT)) {
    try {
      const stdout = execFileSync(PYTHON_BIN, [CONNECTOR_SCRIPT, command, ...args], {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore'],
        timeout: 4000
      });
      return JSON.parse(stdout);
    } catch {
      // Fall through to fallback
    }
  }

  // Fallback when outside Windows or test environment
  if (command === 'status') {
    return {
      running: false,
      pid: null,
      processName: null,
      statusMessage: 'Standby: NBA 2K26 not running. Changes will save to profile and apply on launch.'
    };
  }
  return { success: true };
}

function createApp(options = {}) {
  const app = express();
  app.use(express.json());

  const publicDir = options.publicDir || path.join(__dirname, '..', 'public');
  if (fs.existsSync(publicDir)) {
    app.use(express.static(publicDir));
  }

  const configPath = options.configPath || path.join(__dirname, '..', 'data', 'active_config.json');

  const swapper = new SwapperEngine({
    configPath,
    modsPath: options.modsPath,
    libraryDir: options.libraryDir
  });

  const courts = loadCourts(options.courtsPath);
  let targets = loadTeams(options.teamsPath);

  // Targets endpoint
  app.get('/api/targets', (req, res) => {
    res.json({
      success: true,
      targets
    });
  });

  // Dynamic Roster Sync / Refresh endpoint
  const handleRosterSync = (req, res) => {
    const rosterResult = runConnector('roster');
    if (rosterResult && rosterResult.teams && rosterResult.teams.length > 0) {
      targets = rosterResult.teams;
    } else {
      targets = loadTeams(options.teamsPath);
    }
    res.json({
      success: true,
      liveRosterScanned: rosterResult?.liveRosterScanned || false,
      teamCount: targets.length,
      targets
    });
  };
  app.get('/api/roster/sync', handleRosterSync);
  app.post('/api/roster/sync', handleRosterSync);

  // Legacy status endpoint
  app.get('/api/status', (req, res) => {
    const pathCheck = swapper.validatePaths();
    const state = swapper.getActiveState();
    res.json({
      success: true,
      modsPath: pathCheck.modsPath,
      modsExists: pathCheck.modsExists,
      activeSlots: state.activeSlots
    });
  });

  // Live game status endpoint
  app.get('/api/game/status', (req, res) => {
    const connectorStatus = runConnector('status');
    const state = swapper.getActiveState();
    res.json({
      success: true,
      ...connectorStatus,
      activeSlots: state.activeSlots
    });
  });

  // Genuine Manifest catalog endpoint
  app.get('/api/catalog', (req, res) => {
    const catalog = loadManifestCatalog();
    const localMods = swapper.scanRealCourts();

    const formattedMods = localMods.map(m => ({
      id: m.id,
      code: m.id.replace('real-', 'mod_'),
      rawCode: m.id,
      name: `${m.name} (Custom Mod)`,
      category: 'mods',
      path: m.files?.blacktop || '',
      size: m.fileSize || 0,
      isLocalMod: true
    }));

    res.json({
      success: true,
      arenas: [...catalog.arenas, ...formattedMods],
      floors: catalog.floors
    });
  });

  // Courts library
  app.get('/api/courts', (req, res) => {
    const realCourts = swapper.scanRealCourts();
    const realIds = new Set(realCourts.map(c => c.id));
    const combined = [...realCourts, ...courts.filter(c => !realIds.has(c.id))];
    res.json({
      success: true,
      courts: combined
    });
  });

  // Editor Apply endpoint (Live Memory + Active Config, 0 file extraction)
  app.post('/api/editor/apply', (req, res) => {
    const { teamId, arenaCode, floorCode } = req.body;
    if (!teamId || !arenaCode) {
      return res.status(400).json({ success: false, error: 'teamId and arenaCode are required' });
    }

    const effectiveFloor = floorCode || arenaCode.replace('_int', '_int_floor');
    const team = targets.find(t => t.id === teamId || t.code === teamId || t.abbr === teamId);
    const targetArenaCode = team?.arenaCode;
    const targetFloorCode = team?.floorCode;

    // 1. Deploy court and floor to mods slot directly from game manifest or local mod
    try {
      swapper.applyCourt({
        slot: teamId,
        courtId: arenaCode,
        arenaCode,
        floorCode: effectiveFloor,
        targetArenaCode,
        targetFloorCode
      });
    } catch (err) {
      console.error('File deployment warning:', err.message);
    }

    // 2. Call connector to write live memory if game is running
    const liveResult = runConnector('apply', [teamId, arenaCode, effectiveFloor]);

    res.json({
      success: true,
      teamId,
      arenaCode,
      floorCode: effectiveFloor,
      liveMemoryUpdated: liveResult?.liveMemoryUpdated || false,
      processAttached: liveResult?.processAttached || false
    });
  });

  // Editor Reset endpoint
  app.post('/api/editor/reset', (req, res) => {
    const { teamId } = req.body;
    if (!teamId) {
      return res.status(400).json({ success: false, error: 'teamId is required' });
    }

    const team = targets.find(t => t.id === teamId || t.code === teamId || t.abbr === teamId);
    try {
      swapper.resetSlot(teamId, team?.arenaCode, team?.floorCode);
    } catch (err) {
      console.error('Reset slot error:', err.message);
    }

    // If game running, reset in memory to default
    if (team && team.arenaCode) {
      runConnector('apply', [teamId, team.arenaCode, team.floorCode || team.arenaCode]);
    }

    res.json({
      success: true,
      teamId
    });
  });

  // Legacy Apply court endpoint
  app.post('/api/apply', (req, res) => {
    const { slot, courtId } = req.body;
    if (!slot || !courtId) {
      return res.status(400).json({ success: false, error: 'Slot and courtId are required' });
    }

    const realCourts = swapper.scanRealCourts();
    const allCourts = [...realCourts, ...courts];
    const court = allCourts.find(c => c.id === courtId);
    if (!court) {
      return res.status(404).json({ success: false, error: 'Court not found in database' });
    }

    try {
      const result = swapper.applyCourt({
        slot,
        courtId: court.id,
        courtName: court.name,
        sourceFiles: court.files
      });
      res.json(result);
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Legacy Reset target slot
  app.post('/api/reset', (req, res) => {
    const { slot } = req.body;
    if (!slot) {
      return res.status(400).json({ success: false, error: 'Slot is required' });
    }

    try {
      const result = swapper.resetSlot(slot);
      res.json(result);
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Update mods path configuration
  app.post('/api/path', (req, res) => {
    const { modsPath } = req.body;
    if (!modsPath) {
      return res.status(400).json({ success: false, error: 'modsPath is required' });
    }
    const result = swapper.setModsPath(modsPath);
    res.json({ success: true, ...result });
  });

  return app;
}

if (require.main === module) {
  const PORT = process.env.PORT || 3200;
  const app = createApp();
  app.listen(PORT, () => {
    console.log(`NBA 2K26 Court & Floor Editor server listening on http://localhost:${PORT}`);
  });
}

module.exports = {
  createApp,
  loadCourts
};
