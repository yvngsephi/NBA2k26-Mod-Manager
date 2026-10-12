# NBA 2K26 Live Court & Floor Editor Implementation Plan

> **For agentic workers:** Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Provide an in-game live editor and manager for NBA 2K26 that allows selecting and switching courts and floors for any team in real-time without extracting any archive files from disk.

**Architecture:** A lightweight Win32 live memory connector (`game_connector.py`) detects the running `NBA2K26.exe` process and writes arena/floor IDs into the stadium pointer table (`DEFAULT_STADIUM_POINTER_RVA = 0x7CEC438`) and team records. The Node/Express backend exposes live status, catalog, and apply/reset endpoints, and the Electron frontend delivers a clean matte studio UI with zero emojis and minimal text.

**Tech Stack:** Node.js, Express, Python 3.14 (ctypes Win32 API), Electron, Vanilla HTML5/CSS3.

---

### Task 1: Enrich Team Data and Manifest Catalog
**Files:**
- Modify: `data/teams.json`
- Test: `tests/data.test.js`

- [ ] **Step 1: Write test for enriched team data and manifest catalog**
- [ ] **Step 2: Run test to verify failure**
- [ ] **Step 3: Update `data/teams.json` with all 30 NBA teams, codes, and default arena/floor IDs**
- [ ] **Step 4: Run test to verify pass**

---

### Task 2: Live Connector and Express API Integration
**Files:**
- Modify: `server/app.js`
- Test: `tests/api.test.js`

- [ ] **Step 1: Write tests for `/api/game/status`, `/api/catalog`, `/api/editor/apply`, `/api/editor/reset`**
- [ ] **Step 2: Run test to verify failure**
- [ ] **Step 3: Implement endpoints in `server/app.js` integrating with `server/game_connector.py`**
- [ ] **Step 4: Run test to verify pass**

---

### Task 3: UI Redesign for Team Court & Floor Editor
**Files:**
- Modify: `public/index.html`
- Modify: `public/style.css`
- Modify: `public/app.js`

- [ ] **Step 1: Update `public/index.html` with live status indicator, team selector, arena grid, and floor picker**
- [ ] **Step 2: Update `public/style.css` with matte studio dark aesthetic, crisp typography, and responsive panels**
- [ ] **Step 3: Update `public/app.js` with live status polling, dual court/floor selection, and instant apply/reset**

---

### Task 4: Verification and Smoke Test
- [ ] **Step 1: Run complete test suite (`npm test`)**
- [ ] **Step 2: Verify Electron application startup**
