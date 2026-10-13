// State
let allTeams = [];
let allArenas = [];
let allFloors = [];
let activeSlots = {};
let selectedTeam = null;
let selectedArena = null;
let selectedFloor = null;
let syncFloor = true;
let currentArenaCategory = 'all';
let arenaSearchQuery = '';
let floorSearchQuery = '';
let teamFilterQuery = '';
let currentTeamCategory = 'all';
let gameStatus = { running: false, pid: null, statusMessage: 'Connecting...' };

// DOM Elements
const gameStatusPill = document.getElementById('gameStatusPill');
const gameStatusText = document.getElementById('gameStatusText');
const refreshStatusBtn = document.getElementById('refreshStatusBtn');
const syncRosterBtn = document.getElementById('syncRosterBtn');
const teamCategoryTabs = document.getElementById('teamCategoryTabs');
const teamSearchInput = document.getElementById('teamSearchInput');
const teamList = document.getElementById('teamList');

const teamBadge = document.getElementById('teamBadge');
const teamHeading = document.getElementById('teamHeading');
const teamDefaultArena = document.getElementById('teamDefaultArena');
const teamDefaultFloor = document.getElementById('teamDefaultFloor');
const activeConfigSummary = document.getElementById('activeConfigSummary');

const editorTabs = document.querySelectorAll('.editor-tab');
const tabPanes = document.querySelectorAll('.tab-pane');
const arenaCategoryTabs = document.getElementById('arenaCategoryTabs');
const arenaSearchInput = document.getElementById('arenaSearchInput');
const arenaGrid = document.getElementById('arenaGrid');

const syncFloorCheckbox = document.getElementById('syncFloorCheckbox');
const floorSearchInput = document.getElementById('floorSearchInput');
const floorGrid = document.getElementById('floorGrid');

const dockTargetTeam = document.getElementById('dockTargetTeam');
const dockSelectedArena = document.getElementById('dockSelectedArena');
const dockSelectedFloor = document.getElementById('dockSelectedFloor');
const applyBtn = document.getElementById('applyBtn');
const resetBtn = document.getElementById('resetBtn');
const diagnosticMsg = document.getElementById('diagnosticMsg');
const toast = document.getElementById('toast');

// Court SVG preview generator
function renderCourtSvg(category, code) {
  let wood = '#B87B42';
  let key = '#823719';
  let apron = '#181A1F';
  let line = '#E5E7EB';

  if (category === 'street' || code?.includes('blacktop')) {
    wood = '#3E444F';
    key = '#282E37';
    apron = '#1E232B';
  } else if (category === 'classic') {
    wood = '#9E6430';
    key = '#5E2211';
  } else if (category === 'mods') {
    wood = '#4A505C';
    key = '#323742';
  }

  return `
    <svg class="court-svg" viewBox="0 0 240 110" xmlns="http://www.w3.org/2000/svg">
      <rect x="0" y="0" width="240" height="110" fill="${apron}" rx="3"/>
      <rect x="8" y="6" width="224" height="98" fill="${wood}" rx="2"/>
      <rect x="8" y="6" width="224" height="98" fill="none" stroke="${line}" stroke-width="1.2" opacity="0.75"/>
      <line x1="120" y1="6" x2="120" y2="104" stroke="${line}" stroke-width="1.2" opacity="0.75"/>
      <circle cx="120" cy="55" r="14" fill="none" stroke="${line}" stroke-width="1.2" opacity="0.75"/>
      <rect x="8" y="38" width="36" height="34" fill="${key}" opacity="0.7"/>
      <rect x="8" y="38" width="36" height="34" fill="none" stroke="${line}" stroke-width="1.2" opacity="0.75"/>
      <path d="M 8 20 L 28 20 A 40 40 0 0 1 28 90 L 8 90" fill="none" stroke="${line}" stroke-width="1.2" opacity="0.75"/>
      <rect x="196" y="38" width="36" height="34" fill="${key}" opacity="0.7"/>
      <rect x="196" y="38" width="36" height="34" fill="none" stroke="${line}" stroke-width="1.2" opacity="0.75"/>
      <path d="M 232 20 L 212 20 A 40 40 0 0 0 212 90 L 232 90" fill="none" stroke="${line}" stroke-width="1.2" opacity="0.75"/>
    </svg>
  `;
}

function showToast(msg) {
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2800);
}

function logDiag(text) {
  diagnosticMsg.textContent = text;
}

// Fetch live game connection state
async function fetchGameStatus() {
  try {
    const res = await fetch('/api/game/status');
    const data = await res.json();
    if (data.success) {
      gameStatus = data;
      if (data.activeSlots) {
        activeSlots = data.activeSlots;
      }
      updateStatusUI();
    }
  } catch (err) {
    gameStatusText.textContent = 'API server unreachable';
  }
}

function updateStatusUI() {
  if (gameStatus.running) {
    gameStatusPill.className = 'status-pill status-connected';
    gameStatusText.textContent = `Attached: ${gameStatus.processName} (PID ${gameStatus.pid})`;
    logDiag(`Live process connected (PID ${gameStatus.pid}). Live memory editing active.`);
  } else {
    gameStatusPill.className = 'status-pill status-standby';
    gameStatusText.textContent = 'Standby: NBA 2K26 Offline';
    logDiag('NBA 2K26 offline. Customizations will persist to profile and apply on game launch.');
  }
  renderTeams();
  updateActiveTeamCard();
  updateDock();
}

// Initial Data Load
async function loadInitialData() {
  try {
    const [targetsRes, catalogRes, statusRes] = await Promise.all([
      fetch('/api/targets'),
      fetch('/api/catalog'),
      fetch('/api/game/status')
    ]);

    const targetsData = await targetsRes.json();
    const catalogData = await catalogRes.json();
    const statusData = await statusRes.json();

    if (targetsData.success) {
      allTeams = targetsData.targets || [];
    }
    if (catalogData.success) {
      allArenas = catalogData.arenas || [];
      allFloors = catalogData.floors || [];
    }
    if (statusData.success) {
      gameStatus = statusData;
      activeSlots = statusData.activeSlots || {};
    }

    // Default select Miami Heat (verified 2K26 code 010)
    selectedTeam = allTeams.find(t => t.code === '010' || t.abbr === 'MIA') || allTeams[0];

    updateStatusUI();
    renderTeams();
    renderArenas();
    renderFloors();
    updateActiveTeamCard();
    updateDock();
  } catch (err) {
    console.error('Initialization error:', err);
    logDiag(`Load failed: ${err.message}`);
  }
}

// Render Teams List in Sidebar
function renderTeams() {
  teamList.innerHTML = '';
  const filtered = allTeams.filter(t => {
    if (currentTeamCategory === 'nba_current' && !t.isCurrentNBA) return false;
    if (currentTeamCategory === 'classic' && t.category !== 'classic' && t.category !== 'classic_other') return false;
    if (currentTeamCategory === 'street' && t.category !== 'street') return false;

    if (!teamFilterQuery) return true;
    const q = teamFilterQuery.toLowerCase();
    return t.name.toLowerCase().includes(q) || t.abbr?.toLowerCase().includes(q) || t.code?.includes(q);
  });

  filtered.forEach(team => {
    const item = document.createElement('div');
    const isSelected = selectedTeam && selectedTeam.id === team.id;
    const isModified = Boolean(activeSlots[team.id]);

    item.className = `team-item ${isSelected ? 'active' : ''} ${isModified ? 'modified' : ''}`;
    item.innerHTML = `
      <div class="team-item-left">
        <span class="team-tag">${team.abbr || team.code}</span>
        <span class="team-name">${team.name}</span>
      </div>
      <span class="team-modified-dot" title="Custom court active"></span>
    `;

    item.addEventListener('click', () => {
      selectedTeam = team;
      selectedArena = null;
      selectedFloor = null;
      renderTeams();
      updateActiveTeamCard();
      updateDock();
      renderArenas();
      renderFloors();
    });

    teamList.appendChild(item);
  });
}

// Update Active Team Card in Main Area
function updateActiveTeamCard() {
  if (!selectedTeam) return;

  teamBadge.textContent = selectedTeam.abbr || selectedTeam.code;
  teamHeading.textContent = selectedTeam.name;
  teamDefaultArena.textContent = `${selectedTeam.defaultArena} (${selectedTeam.arenaCode || selectedTeam.code})`;
  teamDefaultFloor.textContent = `${selectedTeam.floorCode || selectedTeam.code}`;

  const currentActive = activeSlots[selectedTeam.id];
  if (currentActive) {
    const arenaName = allArenas.find(a => a.code === currentActive.arenaCode)?.name || currentActive.arenaCode;
    activeConfigSummary.textContent = `${arenaName} [Floor: ${currentActive.floorCode}]`;
    activeConfigSummary.style.color = '#22C55E';
    resetBtn.disabled = false;
  } else {
    activeConfigSummary.textContent = 'Official Default (Unmodified)';
    activeConfigSummary.style.color = '#9CA3AF';
    resetBtn.disabled = true;
  }
}

// Render Arenas Grid
function renderArenas() {
  arenaGrid.innerHTML = '';

  const filtered = allArenas.filter(a => {
    if (currentArenaCategory !== 'all' && a.category !== currentArenaCategory) {
      return false;
    }
    if (arenaSearchQuery) {
      const q = arenaSearchQuery.toLowerCase();
      return a.name.toLowerCase().includes(q) || a.code.toLowerCase().includes(q);
    }
    return true;
  });

  filtered.forEach(arena => {
    const card = document.createElement('div');
    const isSelected = selectedArena && selectedArena.code === arena.code;
    const isCurrentlyActive = activeSlots[selectedTeam?.id]?.arenaCode === arena.code;

    card.className = `court-card ${isSelected ? 'selected' : ''} ${isCurrentlyActive ? 'active-assigned' : ''}`;
    card.innerHTML = `
      <div class="court-preview-box">
        ${renderCourtSvg(arena.category, arena.code)}
      </div>
      <div class="card-info">
        <div class="card-title" title="${arena.name}">${arena.name}</div>
        <div class="card-meta">
          <span class="card-code">${arena.code}</span>
          <span>${arena.shard ? `Shard ${arena.shard}` : 'Mod'}</span>
        </div>
      </div>
    `;

    card.addEventListener('click', () => {
      selectedArena = arena;
      if (syncFloor) {
        // Automatically choose corresponding floor
        const match = allFloors.find(f => f.code === arena.code.replace('_int', '_int') || f.code.includes(arena.rawCode));
        selectedFloor = match || null;
      }
      renderArenas();
      renderFloors();
      updateDock();
    });

    arenaGrid.appendChild(card);
  });
}

// Render Floors Grid
function renderFloors() {
  floorGrid.innerHTML = '';

  const filtered = allFloors.filter(f => {
    if (floorSearchQuery) {
      const q = floorSearchQuery.toLowerCase();
      return f.name.toLowerCase().includes(q) || f.code.toLowerCase().includes(q);
    }
    return true;
  });

  filtered.forEach(floor => {
    const card = document.createElement('div');
    const isSelected = selectedFloor && selectedFloor.code === floor.code;
    const isCurrentlyActive = activeSlots[selectedTeam?.id]?.floorCode === floor.code;

    card.className = `floor-card ${isSelected ? 'selected' : ''} ${isCurrentlyActive ? 'active-assigned' : ''}`;
    card.innerHTML = `
      <div class="card-info">
        <div class="card-title" title="${floor.name}">${floor.name}</div>
        <div class="card-meta">
          <span class="card-code">${floor.code}</span>
          <span>${floor.shard ? `Shard ${floor.shard}` : ''}</span>
        </div>
      </div>
    `;

    card.addEventListener('click', () => {
      selectedFloor = floor;
      renderFloors();
      updateDock();
    });

    floorGrid.appendChild(card);
  });
}

// Update Action Dock
function updateDock() {
  if (!selectedTeam) return;

  dockTargetTeam.textContent = selectedTeam.name;

  if (selectedArena) {
    dockSelectedArena.textContent = `${selectedArena.name} (${selectedArena.code})`;
    applyBtn.disabled = false;
  } else {
    dockSelectedArena.textContent = 'None';
    applyBtn.disabled = true;
  }

  if (selectedFloor) {
    dockSelectedFloor.textContent = `${selectedFloor.name}`;
  } else if (syncFloor && selectedArena) {
    dockSelectedFloor.textContent = 'Auto (Matched to Arena)';
  } else {
    dockSelectedFloor.textContent = 'Default Floor';
  }
}

// Tab Switching
editorTabs.forEach(tab => {
  tab.addEventListener('click', () => {
    editorTabs.forEach(t => t.classList.remove('active'));
    tabPanes.forEach(p => p.classList.remove('active'));

    tab.classList.add('active');
    const targetPane = document.getElementById(tab.dataset.pane);
    if (targetPane) targetPane.classList.add('active');
  });
});

// Category filtering
arenaCategoryTabs.addEventListener('click', (e) => {
  if (!e.target.classList.contains('tab-btn')) return;
  arenaCategoryTabs.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  e.target.classList.add('active');
  currentArenaCategory = e.target.dataset.category;
  renderArenas();
});

// Search inputs
arenaSearchInput.addEventListener('input', (e) => {
  arenaSearchQuery = e.target.value.trim();
  renderArenas();
});

floorSearchInput.addEventListener('input', (e) => {
  floorSearchQuery = e.target.value.trim();
  renderFloors();
});

teamSearchInput.addEventListener('input', (e) => {
  teamFilterQuery = e.target.value.trim();
  renderTeams();
});

// Sync Roster Function
async function syncRoster() {
  if (syncRosterBtn) {
    syncRosterBtn.classList.add('spinning');
    syncRosterBtn.disabled = true;
  }
  logDiag('Syncing loaded roster from NBA 2K26...');

  try {
    const res = await fetch('/api/roster/sync', { method: 'POST' });
    const data = await res.json();
    if (data.success && data.targets) {
      allTeams = data.targets;
      if (!selectedTeam || !allTeams.find(t => t.id === selectedTeam.id)) {
        selectedTeam = allTeams.find(t => t.code === '010' || t.abbr === 'MIA') || allTeams[0];
      }
      renderTeams();
      updateActiveTeamCard();
      updateDock();

      const msg = data.liveRosterScanned
        ? `Synced live roster: ${data.teamCount} teams from active NBA 2K26 game!`
        : `Refreshed roster: ${data.teamCount} verified NBA 2K26 teams ready.`;
      showToast(msg);
      logDiag(msg);
    } else {
      showToast('Roster sync failed');
    }
  } catch (err) {
    showToast(`Sync error: ${err.message}`);
    logDiag(`Roster sync error: ${err.message}`);
  } finally {
    if (syncRosterBtn) {
      syncRosterBtn.classList.remove('spinning');
      syncRosterBtn.disabled = false;
    }
  }
}

syncRosterBtn?.addEventListener('click', syncRoster);

teamCategoryTabs?.addEventListener('click', (e) => {
  const btn = e.target.closest('.team-tab-btn');
  if (!btn) return;
  teamCategoryTabs.querySelectorAll('.team-tab-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  currentTeamCategory = btn.dataset.cat;
  renderTeams();
});

syncFloorCheckbox.addEventListener('change', (e) => {
  syncFloor = e.target.checked;
  if (syncFloor && selectedArena) {
    const match = allFloors.find(f => f.code.includes(selectedArena.rawCode));
    selectedFloor = match || null;
    renderFloors();
    updateDock();
  }
});

// Apply Handler
applyBtn.addEventListener('click', async () => {
  if (!selectedTeam || !selectedArena) return;

  const floorCode = selectedFloor?.code || selectedArena.code.replace('_int', '_int_floor');

  applyBtn.disabled = true;
  applyBtn.textContent = 'Applying...';
  logDiag(`Applying ${selectedArena.name} & Floor to ${selectedTeam.name}...`);

  try {
    const res = await fetch('/api/editor/apply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        teamId: selectedTeam.id,
        arenaCode: selectedArena.code,
        floorCode
      })
    });

    const data = await res.json();
    if (data.success) {
      activeSlots[selectedTeam.id] = {
        arenaCode: selectedArena.code,
        floorCode,
        appliedAt: new Date().toISOString()
      };

      const liveNotice = data.liveMemoryUpdated ? 'Live memory written instantly in game!' : 'Saved to active profile (will apply when game launches)';
      showToast(`${selectedTeam.name} court updated: ${selectedArena.name}!`);
      logDiag(`Applied to ${selectedTeam.name}: Arena ${selectedArena.code}, Floor ${floorCode}. ${liveNotice}`);

      updateActiveTeamCard();
      renderTeams();
      renderArenas();
      renderFloors();
      updateDock();
    } else {
      showToast(`Error: ${data.error || 'Failed to apply'}`);
      logDiag(`Apply failed: ${data.error}`);
    }
  } catch (err) {
    showToast(`Error: ${err.message}`);
    logDiag(`Apply exception: ${err.message}`);
  } finally {
    applyBtn.disabled = false;
    applyBtn.textContent = 'Apply to Team (Live)';
  }
});

// Reset Handler
resetBtn.addEventListener('click', async () => {
  if (!selectedTeam) return;

  resetBtn.disabled = true;
  logDiag(`Resetting ${selectedTeam.name} to default court & floor...`);

  try {
    const res = await fetch('/api/editor/reset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        teamId: selectedTeam.id
      })
    });

    const data = await res.json();
    if (data.success) {
      delete activeSlots[selectedTeam.id];
      selectedArena = null;
      selectedFloor = null;

      showToast(`${selectedTeam.name} reset to official arena & floor.`);
      logDiag(`${selectedTeam.name} restored to default in memory.`);

      updateActiveTeamCard();
      renderTeams();
      renderArenas();
      renderFloors();
      updateDock();
    } else {
      showToast(`Error: ${data.error || 'Failed to reset'}`);
    }
  } catch (err) {
    showToast(`Error: ${err.message}`);
  } finally {
    resetBtn.disabled = false;
  }
});

// Refresh button
refreshStatusBtn.addEventListener('click', () => {
  fetchGameStatus();
});

// Polling for live game process every 3.5 seconds
setInterval(fetchGameStatus, 3500);

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', loadInitialData);
