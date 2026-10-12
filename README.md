# NBA 2K26 Live Court & Floor Editor

A standalone desktop editor and manager for NBA 2K26 that connects directly to the game's native files and live process memory to swap courts, arenas, and floor patterns across all 30 NBA teams and Blacktop mode.

## Features

- **Direct Game Manifest Connection**: Leverages official NBA 2K26 manifest data and Oodle archive shards (`0A`–`4F`) directly with zero file hoarding or duplicate caching.
- **Live Memory Synchronization**: Automatically detects running `NBA2K26.exe` / `mod.exe` process instances and updates stadium pointers (`DEFAULT_STADIUM_POINTER_RVA = 0x7CEC438`) and team records in real-time.
- **All 30 NBA Teams + Blacktop**: Full roster coverage including Eastern and Western conferences, official abbreviations, and authentic default arenas.
- **Dual Selection**: Independent controls for selecting the arena/stadium geometry and court floor surface, with optional automatic matching.
- **Custom Mod Compatibility**: Automatically detects and integrates local downloaded court mods (e.g. from `Mods/courtsko/`).
- **Matte Studio UI**: Modern dark theme interface with live process indicators, SVG court previews, and zero intrusive animations.

## Getting Started

### Prerequisites

- Windows 10/11 (64-bit)
- NBA 2K26 installed via Steam
- Node.js (v18+)

### Running the Application

Double-click `start-manager.bat` in the root folder, or run:

```bash
npm start
```

### Running Tests

```bash
npm test
```

## Architecture

- **Frontend**: HTML5, Vanilla CSS, Vanilla JavaScript running inside an Electron native desktop window.
- **Backend API**: Express server running locally on `http://127.0.0.1:3200`.
- **Connector**: Python bridge utilizing Windows Win32 memory APIs (`kernel32.dll`) for live process inspection and memory updates.
