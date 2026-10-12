# NBA 2K26 Court Mod Manager Implementation Plan

> **For agentic workers:** Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a lightweight, local NBA 2K26 Court Mod Manager allowing users to browse game courts/mods and swap them into Blacktop or Team slots in their `Mods` directory with a clean, matte, non-neon UI.

**Architecture:** A local Node.js backend (`server/app.js`, `server/swapper.js`) managing `.iff` asset files and tracking active slot overrides in `data/active_config.json`, paired with a responsive Single-Page Client (`public/`) styled strictly under the matte, minimalist studio design system.

**Tech Stack:** Node.js (v18+), Express 4.x, Node native test runner (`node:test`, `node:assert`), Vanilla HTML5/CSS3/ES6 JavaScript.

**Spec:** [docs/specs/2026-10-12-nba2k26-court-mod-manager-design.md](file:///c:/Users/ASUS%20TUF%20Gaming%20F15/Downloads/Works(game)/nba2kmod/docs/specs/2026-10-12-nba2k26-court-mod-manager-design.md)

## Global Constraints
- Target game directory: `C:\Program Files (x86)\Steam\steamapps\common\NBA 2K26`
- Target mods directory: `C:\Program Files (x86)\Steam\steamapps\common\NBA 2K26\Mods`
- Visual constraints: No neon glows, no emojis, sentence-case only, minimal text.
- Safety: Never alter original game archives; all swaps occur exclusively inside `Mods/` and record applied files for clean resetting.

## Review Focus
1. **Missing or Inaccessible Mods Directory**: Gracefully detect whether the path exists and warn without crashing.
2. **Partial Asset Files**: Some courts only have floor files without custom stadium files; swapper must handle partial file sets without throwing errors.
3. **Clean Reset**: Ensure resetting a slot completely removes previous override files without leaving orphaned `.iff` files in `Mods/`.
4. **Collision Handling**: Overwriting an active slot cleans up the previous swap's files first before copying new ones.

---

### Task 1: Project Scaffolding & Court Database

**Files:**
- Create: `package.json`
- Create: `data/courts.json`
- Create: `data/active_config.json`
- Test: `tests/data.test.js`

**Interfaces:**
- Produces: `courts.json` containing schema:
  `{ id: string, name: string, category: 'nba'|'classic'|'street'|'custom', team?: string, files: { floor?: string, stadium?: string, dorna?: string } }`

- [x] **Step 1: Write the failing test**
- [x] **Step 2: Run test to verify it fails**
- [x] **Step 3: Write minimal implementation**
- [x] **Step 4: Run test to verify it passes**
- [x] **Step 5: Commit changes**

---

### Task 2: Court Swapper Engine

**Files:**
- Create: `server/swapper.js`
- Test: `tests/swapper.test.js`

**Interfaces:**
- Consumes: `data/active_config.json`, `data/courts.json`
- Produces:
  - `validatePaths(configPath)`: returns `{ valid: boolean, modsExists: boolean }`
  - `applyCourt({ slot, courtId, mockModsDir, libraryDir })`: copies/creates mapped files and updates active state
  - `resetSlot({ slot, mockModsDir })`: removes mapped files and clears active state
  - `getActiveState()`: returns current slot assignments

- [x] **Step 1: Write the failing test**
- [x] **Step 2: Run test to verify it fails**
- [x] **Step 3: Write minimal implementation**
- [x] **Step 4: Run test to verify it passes**
- [x] **Step 5: Commit changes**

---

### Task 3: REST API Server

**Files:**
- Create: `server/app.js`
- Test: `tests/api.test.js`

**Interfaces:**
- Produces HTTP routes:
  - `GET /api/status`: `{ success: true, modsPath, modsExists, activeSlots }`
  - `GET /api/courts`: `{ success: true, courts: Court[] }`
  - `POST /api/apply`: Body `{ slot: string, courtId: string }` -> `{ success: true, slot, courtId }`
  - `POST /api/reset`: Body `{ slot: string }` -> `{ success: true, slot }`
  - `POST /api/path`: Body `{ modsPath: string }` -> `{ success: true, modsPath }`

- [x] **Step 1: Write the failing test**
- [x] **Step 2: Run test to verify it fails**
- [x] **Step 3: Write minimal implementation**
- [x] **Step 4: Run test to verify it passes**
- [x] **Step 5: Commit changes**

---

### Task 4: Frontend UI (Matte Studio Dark, No Neon, No Emojis)

**Files:**
- Create: `public/index.html`
- Create: `public/style.css`
- Create: `public/app.js`

**Interfaces:**
- Consumes: `/api/status`, `/api/courts`, `/api/apply`, `/api/reset`

- [x] **Step 1: Create markup `public/index.html`**
- [x] **Step 2: Implement styling `public/style.css`**
- [x] **Step 3: Implement client logic `public/app.js`**
- [x] **Step 4: Commit changes**

---

### Task 5: End-to-End Verification & Browser UI Inspection

- [x] **Step 1: Run all unit and integration tests**
- [x] **Step 2: Start the server and verify in browser**
- [x] **Step 3: Final commit and summary**
