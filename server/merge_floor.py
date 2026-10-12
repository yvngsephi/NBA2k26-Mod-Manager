import sys
import os
import zipfile
import shutil

def merge_iff(arena_path, floor_path, out_path=None):
    if not os.path.exists(arena_path) or not os.path.exists(floor_path):
        return False
    if not zipfile.is_zipfile(arena_path) or not zipfile.is_zipfile(floor_path):
        return False

    target_path = out_path if out_path else arena_path
    temp_path = target_path + ".tmp_merge"

    try:
        with zipfile.ZipFile(arena_path, 'r') as a_zip:
            with zipfile.ZipFile(floor_path, 'r') as f_zip:
                arena_names = set(a_zip.namelist())
                with zipfile.ZipFile(temp_path, 'w', compression=zipfile.ZIP_DEFLATED) as out_zip:
                    # Copy all arena items
                    for item in a_zip.infolist():
                        out_zip.writestr(item, a_zip.read(item.filename))
                    # Copy floor items (skip duplicates to avoid zip header conflicts)
                    for item in f_zip.infolist():
                        if item.filename in arena_names:
                            continue
                        out_zip.writestr(item, f_zip.read(item.filename))
        shutil.move(temp_path, target_path)
        return True
    except Exception as e:
        if os.path.exists(temp_path):
            try:
                os.remove(temp_path)
            except:
                pass
        print(f"Merge error: {e}", file=sys.stderr)
        return False

if __name__ == '__main__':
    if len(sys.argv) < 3:
        print("Usage: merge_floor.py <arena_iff> <floor_iff> [out_iff]")
        sys.exit(1)
    arena = sys.argv[1]
    floor = sys.argv[2]
    out = sys.argv[3] if len(sys.argv) > 3 else None
    success = merge_iff(arena, floor, out)
    sys.exit(0 if success else 1)
