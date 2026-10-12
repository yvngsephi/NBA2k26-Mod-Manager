"""
NBA 2K26 Live Memory & File Connector
Connects directly to NBA 2K26 process while running, or manages active profile when game is offline.
Zero file extraction from game archives. Reads/writes stadium & floor descriptors directly in memory.
"""

from __future__ import annotations

import ctypes
from ctypes import wintypes
import json
import os
import re
import sys
from pathlib import Path

# Windows Win32 constants
PROCESS_VM_READ = 0x0010
PROCESS_VM_WRITE = 0x0020
PROCESS_VM_OPERATION = 0x0008
PROCESS_QUERY_INFORMATION = 0x0400
TH32CS_SNAPPROCESS = 0x00000002
TH32CS_SNAPMODULE = 0x00000008
TH32CS_SNAPMODULE32 = 0x00000010
INVALID_HANDLE_VALUE = wintypes.HANDLE(-1).value

DEFAULT_STADIUM_POINTER_RVA = 0x7CEC438
DEFAULT_STADIUM_STRIDE = 4792
DEFAULT_GAME_PATH = r"C:\Program Files (x86)\Steam\steamapps\common\NBA 2K26"
DEFAULT_MODS_PATH = r"C:\Program Files (x86)\Steam\steamapps\common\NBA 2K26\Mods"

kernel32 = ctypes.WinDLL("kernel32", use_last_error=True)
psapi = ctypes.WinDLL("psapi", use_last_error=True)


class PROCESSENTRY32W(ctypes.Structure):
    _fields_ = [
        ("dwSize", wintypes.DWORD),
        ("cntUsage", wintypes.DWORD),
        ("th32ProcessID", wintypes.DWORD),
        ("th32DefaultHeapID", ctypes.c_size_t),
        ("th32ModuleID", wintypes.DWORD),
        ("cntThreads", wintypes.DWORD),
        ("th32ParentProcessID", wintypes.DWORD),
        ("pcPriClassBase", wintypes.LONG),
        ("dwFlags", wintypes.DWORD),
        ("szExeFile", wintypes.WCHAR * 260),
    ]


class MODULEENTRY32W(ctypes.Structure):
    _fields_ = [
        ("dwSize", wintypes.DWORD),
        ("th32ModuleID", wintypes.DWORD),
        ("th32ProcessID", wintypes.DWORD),
        ("GlblcntUsage", wintypes.DWORD),
        ("ProccntUsage", wintypes.DWORD),
        ("modBaseAddr", ctypes.c_void_p),
        ("modBaseSize", wintypes.DWORD),
        ("hModule", wintypes.HMODULE),
        ("szModule", wintypes.WCHAR * 256),
        ("szExePath", wintypes.WCHAR * 260),
    ]


def find_nba2k_process() -> dict[str, object] | None:
    snapshot = kernel32.CreateToolhelp32Snapshot(TH32CS_SNAPPROCESS, 0)
    if snapshot == INVALID_HANDLE_VALUE:
        return None

    entry = PROCESSENTRY32W()
    entry.dwSize = ctypes.sizeof(PROCESSENTRY32W)

    success = kernel32.Process32FirstW(snapshot, ctypes.byref(entry))
    candidates = []
    while success:
        name = entry.szExeFile.lower()
        if "nba2k26" in name or name == "mod.exe":
            candidates.append({
                "pid": int(entry.th32ProcessID),
                "name": entry.szExeFile
            })
        success = kernel32.Process32NextW(snapshot, ctypes.byref(entry))

    kernel32.CloseHandle(snapshot)
    if candidates:
        # Prefer NBA2K26.exe if multiple
        for c in candidates:
            if "nba2k26" in c["name"].lower():
                return c
        return candidates[0]
    return None


def get_module_base(pid: int, module_name: str = "nba2k26.exe") -> int | None:
    snapshot = kernel32.CreateToolhelp32Snapshot(TH32CS_SNAPMODULE | TH32CS_SNAPMODULE32, pid)
    if snapshot == INVALID_HANDLE_VALUE:
        return None

    entry = MODULEENTRY32W()
    entry.dwSize = ctypes.sizeof(MODULEENTRY32W)

    success = kernel32.Module32FirstW(snapshot, ctypes.byref(entry))
    target_base = None
    while success:
        if module_name.lower() in entry.szModule.lower():
            target_base = entry.modBaseAddr
            break
        success = kernel32.Module32NextW(snapshot, ctypes.byref(entry))

    kernel32.CloseHandle(snapshot)
    return target_base


def read_memory(handle: wintypes.HANDLE, address: int, length: int) -> bytes | None:
    buffer = (ctypes.c_char * length)()
    bytes_read = ctypes.c_size_t()
    if kernel32.ReadProcessMemory(handle, ctypes.c_void_p(address), buffer, length, ctypes.byref(bytes_read)):
        return bytes(buffer[:bytes_read.value])
    return None


def write_memory(handle: wintypes.HANDLE, address: int, data: bytes) -> bool:
    buffer = (ctypes.c_char * len(data)).from_buffer_copy(data)
    written = ctypes.c_size_t()
    if kernel32.WriteProcessMemory(handle, ctypes.c_void_p(address), buffer, len(data), ctypes.byref(written)):
        return written.value == len(data)
    return False


def get_game_status() -> dict[str, object]:
    proc = find_nba2k_process()
    if proc:
        return {
            "running": True,
            "pid": proc["pid"],
            "processName": proc["name"],
            "statusMessage": f"Attached to {proc['name']} (PID: {proc['pid']})"
        }
    return {
        "running": False,
        "pid": None,
        "processName": None,
        "statusMessage": "Standby: NBA 2K26 not running. Changes will save to profile and apply on launch."
    }


def scan_local_mod_courts(mods_dir: str = DEFAULT_MODS_PATH) -> list[dict[str, object]]:
    courts = []
    courtsko = Path(mods_dir) / "courtsko"
    if not courtsko.exists():
        return courts

    for item in courtsko.iterdir():
        if item.is_dir():
            iff_path = item / "arena_blacktop_ext.iff"
            if iff_path.exists():
                size = iff_path.stat().st_size
                name = item.name.title()
                courts.append({
                    "id": f"mod-{item.name.lower().replace(' ', '-')}",
                    "code": f"mod_{item.name.lower().replace(' ', '_')}",
                    "rawCode": item.name,
                    "name": f"{name} (Custom Mod)",
                    "category": "mods",
                    "path": str(iff_path),
                    "size": size,
                    "isLocalMod": True
                })
    return courts


def get_full_catalog() -> dict[str, object]:
    catalog_path = Path(__file__).resolve().parent.parent / "data" / "manifest_catalog.json"
    data = {"arenas": [], "floors": []}
    if catalog_path.exists():
        try:
            with open(catalog_path, "r", encoding="utf-8") as f:
                data = json.load(f)
        except Exception:
            pass

    # Add local mod courts
    mod_courts = scan_local_mod_courts()
    combined_arenas = data.get("arenas", []) + mod_courts

    return {
        "arenas": combined_arenas,
        "floors": data.get("floors", [])
    }


def apply_assignment(team_code: str, arena_code: str, floor_code: str) -> dict[str, object]:
    """
    Applies arena and floor directly to the game process if running,
    and updates active_config.json.
    """
    config_path = Path(__file__).resolve().parent.parent / "data" / "active_config.json"
    config = {"modsPath": DEFAULT_MODS_PATH, "activeSlots": {}}
    if config_path.exists():
        try:
            with open(config_path, "r", encoding="utf-8") as f:
                config = json.load(f)
        except Exception:
            pass

    slot_key = f"team_{team_code}" if not team_code.startswith("team_") and team_code != "blacktop" else team_code
    config.setdefault("activeSlots", {})[slot_key] = {
        "teamCode": team_code,
        "arenaCode": arena_code,
        "floorCode": floor_code,
        "appliedAt": "now"
    }

    with open(config_path, "w", encoding="utf-8") as f:
        json.dump(config, f, indent=2)

    # If running, write directly into game memory
    proc = find_nba2k_process()
    memory_written = False
    details = []

    if proc:
        pid = int(proc["pid"])
        handle = kernel32.OpenProcess(
            PROCESS_VM_READ | PROCESS_VM_WRITE | PROCESS_VM_OPERATION | PROCESS_QUERY_INFORMATION,
            False,
            pid
        )
        if handle and handle != INVALID_HANDLE_VALUE:
            try:
                base_addr = get_module_base(pid, proc["name"])
                if base_addr:
                    stadium_ptr_addr = base_addr + DEFAULT_STADIUM_POINTER_RVA
                    ptr_bytes = read_memory(handle, stadium_ptr_addr, 8)
                    if ptr_bytes and len(ptr_bytes) == 8:
                        table_base = int.from_bytes(ptr_bytes, "little")
                        if 0x10000 < table_base < 0x7FFFFFFFFFFF:
                            # Stride walk up to 60 rows to find matching arena or write directly
                            target_arena_bytes = (arena_code.replace(".iff", "")[:32] + "\x00").encode("latin1")
                            target_floor_bytes = (floor_code.replace(".iff", "")[:38] + "\x00").encode("latin1")

                            # Calculate row index if numerical
                            raw_team = team_code.replace("team_", "")
                            if raw_team.isdigit():
                                row_idx = int(raw_team)
                                row_addr = table_base + row_idx * DEFAULT_STADIUM_STRIDE
                                # Write arena_id at 0xBA
                                ok1 = write_memory(handle, row_addr + 0xBA, target_arena_bytes)
                                # Write floor_id at 0xE0
                                ok2 = write_memory(handle, row_addr + 0xE0, target_floor_bytes)
                                if ok1 and ok2:
                                    memory_written = True
                                    details.append(f"Written to stadium row {row_idx} at 0x{row_addr:X}")
            finally:
                kernel32.CloseHandle(handle)

    return {
        "success": True,
        "liveMemoryUpdated": memory_written,
        "processAttached": bool(proc),
        "team": team_code,
        "arena": arena_code,
        "floor": floor_code,
        "details": details
    }


def main():
    if len(sys.argv) > 1:
        cmd = sys.argv[1]
        if cmd == "status":
            print(json.dumps(get_game_status()))
        elif cmd == "catalog":
            print(json.dumps(get_full_catalog()))
        elif cmd == "apply" and len(sys.argv) >= 5:
            team = sys.argv[2]
            arena = sys.argv[3]
            floor = sys.argv[4]
            print(json.dumps(apply_assignment(team, arena, floor)))
        else:
            print(json.dumps({"error": f"Unknown command {cmd}"}))
    else:
        print(json.dumps(get_game_status()))


if __name__ == "__main__":
    main()
