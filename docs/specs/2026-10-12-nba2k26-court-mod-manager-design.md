# NBA 2K26 Court Mod Manager Specification

**Date**: 2026-10-12  
**Status**: Draft for User Review  

---

## 1. Overview and Objective

The **NBA 2K26 Court Mod Manager** is a dedicated local desktop manager designed to inspect, preview, and swap NBA 2K26 courts and arenas before launching games.

### Core Objectives
1. Provide a comprehensive library of built-in courts (30 current NBA arenas, classic arenas, and street/blacktop parks) alongside user-imported custom court mods.
2. Enable 1-click swapping into target game slots—specifically **Blacktop** (playing street games in NBA arenas or custom parks) and **NBA Team slots** (customizing or swapping team home arenas).
3. Safely manage `.iff` asset files inside the game's `Mods/` directory (`C:\Program Files (x86)\Steam\steamapps\common\NBA 2K26\Mods`) with instant revert/reset capability.
4. Adhere strictly to the design brief: clean, restrained, functional, **no emojis, no neon glow, and minimal text**.

---

## 2. Visual Design System (`frontend-design`)

### Visual Identity
- **Tone**: Hardware rack / studio precision tool. Quiet, disciplined, functional.
- **Palette Tokens**:
  - `bg-base`: `#121316` (deep neutral charcoal background)
  - `bg-surface`: `#1A1C21` (elevated panels, cards, and drawers)
  - `border`: `#2B2F38` (subtle structural divider lines)
  - `text-primary`: `#E5E7EB` (high-contrast off-white)
  - `text-secondary`: `#8C92A0` (muted labels and metadata)
  - `accent`: `#C86432` (matte basketball leather / court wood tone; zero neon glow)
  - `accent-active`: `#2E7D32` (restrained olive green for active slot indicator)
- **Typography**:
  - Standard system sans-serif (`Segoe UI`, `Inter`, system default).
  - Sentence case for all headings and button labels.
  - Zero decorative emojis or exclamation marks.
- **Layout & Structure**:
  - **Header Bar**: Displays connection status to `Mods/` path and target slot selector (`Blacktop` or `Team`).
  - **Category Filter Tabs**: Restrained text tabs: `All Courts`, `NBA Teams`, `Classic Arenas`, `Street Parks`, `Custom Mods`.
  - **Library Grid**: Minimalist cards displaying court floor diagram/preview, arena name, and location/team.
  - **Active Slot Status & Action Footer**: Shows the current court active in the chosen slot with `Apply Court` and `Reset Default` actions.

---

## 3. System Architecture & Tech Stack

```
+-------------------------------------------------------------+
|                      Browser Client                         |
|   (Vanilla HTML5 / Modern CSS / Vanilla ES6 Javascript)     |
+-------------------------------------------------------------+
                              |
                     REST API (HTTP/JSON)
                              |
+-------------------------------------------------------------+
|                   Local Node.js Server                      |
|                  (Native HTTP / Express)                    |
+-------------------------------------------------------------+
       |                                              |
       v                                              v
+-------------------------------+   +-------------------------+
|      Local Court Vault        |   |    NBA 2K26 Game Path   |
| (data/courts.json, library/)  |   |    .../NBA 2K26/Mods/   |
+-------------------------------+   +-------------------------+
```

### Components
1. **Backend Server (`server/app.js`)**:
   - Lightweight Node.js local service running on `http://localhost:3200`.
   - Handles file operations: scanning `Mods/`, copying/symlinking `.iff` files, maintaining active state.
   - Provides JSON endpoints:
     - `GET /api/status`: Validates game directory and returns active target slot status.
     - `GET /api/courts`: Returns all available courts with metadata and preview images.
     - `POST /api/apply`: Deploys chosen court files to the target slot in `Mods/`.
     - `POST /api/reset`: Restores target slot to vanilla state by removing mapped override files.
     - `POST /api/import`: Accepts custom `.iff` files or folders into the user library.
2. **Frontend UI (`public/index.html`, `public/style.css`, `public/app.js`)**:
   - Single-page interface.
   - Pure vanilla JavaScript with zero external runtime framework overhead.
   - Fast instant updates without full-page reloads.

---

## 4. Court Swapping Mechanics & Asset Mapping

### NBA 2K Asset Structure
Arena assets consist of three primary `.iff` archives:
1. `floor_###.iff`: The hardwood floor texture, baseline lettering, and court paint.
2. `stadium_###.iff`: The 3D stadium geometry, hoops, stanchions, seating bowl, and lighting profile.
3. `dorna_###.iff`: Courtside rotating LED advertising boards and scorer's table displays.

### Slot Target Mapping
- **Blacktop Target (`blacktop`)**:
  - Target files: `stadium_street.iff` / `floor_street_*.iff` (or target street court IDs).
  - When an arena is applied to Blacktop, the manager copies or links the selected arena's `stadium` and `floor` into the `Mods/` folder renamed to match the street slot.
- **Team Target (`team_<code/id>`)**:
  - Target files: `floor_<id>.iff`, `stadium_<id>.iff`, `dorna_<id>.iff`.
  - Swaps any arena into an existing NBA team's home slot.

### State Tracking
The manager persists applied overrides in `data/active_config.json`:
```json
{
  "gamePath": "C:\\Program Files (x86)\\Steam\\steamapps\\common\\NBA 2K26",
  "modsPath": "C:\\Program Files (x86)\\Steam\\steamapps\\common\\NBA 2K26\\Mods",
  "activeSlots": {
    "blacktop": {
      "courtId": "madison-square-garden",
      "courtName": "Madison Square Garden",
      "appliedFiles": ["stadium_street.iff", "floor_street.iff"],
      "timestamp": "2026-10-12T16:30:00Z"
    }
  }
}
```

---

## 5. Error Handling & Safety Measures

1. **Path Verification**:
   - Automatically checks for the presence of the `NBA 2K26` folder and `Mods/` directory on startup.
   - If missing or unreadable, the user can configure or select a custom folder path via the settings drawer.
2. **Safe File Operations**:
   - Before applying an override, previous mapped files recorded in `active_config.json` are cleanly unlinked/removed.
   - Base game archive files outside `Mods/` are never written to or modified.
3. **Graceful Fallbacks**:
   - If a custom mod only includes a `floor_###.iff` but lacks a custom `stadium_###.iff`, the manager applies the floor while keeping the stadium default, clearly indicating partial file coverage.

---

## 6. Implementation Stages & Verification Plan

1. **Phase 1: Backend Foundation**:
   - Set up `package.json`, Express/Node service, directory manager, and `courts.json` library dataset.
2. **Phase 2: File Swapping Engine**:
   - Implement slot mapping, file copy/symlink logic, and state file management.
   - Automated tests for apply, reset, and safety unlinking.
3. **Phase 3: Frontend Interface**:
   - Construct clean UI according to the design tokens (matte dark, no neon, no emojis, restrained typography).
   - Court card visual grid, filter tabs, target slot dropdown, and swap action.
4. **Phase 4: End-to-End Verification**:
   - Test Blacktop court swap flow.
   - Test reset flow.
   - Inspect UI layout and verify behavior with browser subagent.
