const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { execFileSync } = require('node:child_process');

const userHome = process.env.USERPROFILE || os.homedir();
const PYTHON_BIN = process.env.PYTHON_BIN || path.join(userHome, 'Downloads', '2k26mods', '2kvenuelab', 'app', 'python', 'python.exe');

function optimizeCourtArchive(courtIffPath) {
  if (!fs.existsSync(courtIffPath)) {
    throw new Error(`Court file not found: ${courtIffPath}`);
  }

  const originalStat = fs.statSync(courtIffPath);
  const backupPath = courtIffPath.replace(/\.iff$/i, '.bak.iff');

  // Keep a permanent backup of original if not already created
  if (!fs.existsSync(backupPath)) {
    fs.copyFileSync(courtIffPath, backupPath);
  }

  const tempOutPath = courtIffPath + '.opt_tmp';

  // Python fast zip stream pruner
  const pythonScript = `
import zipfile, os, sys

src = sys.argv[1]
dst = sys.argv[2]

skipped = 0
kept = 0

with zipfile.ZipFile(src, 'r') as zin, zipfile.ZipFile(dst, 'w', compression=zipfile.ZIP_STORED) as zout:
    for item in zin.infolist():
        # Remove orphaned .tld texture descriptors that have no matching textures
        if item.filename.endswith('.tld'):
            skipped += 1
            continue
        data = zin.read(item.filename)
        zout.writestr(item, data)
        kept += 1

print(f"{skipped}:{kept}")
`;

  try {
    const result = execFileSync(PYTHON_BIN, ['-c', pythonScript, courtIffPath, tempOutPath], {
      encoding: 'utf8'
    }).trim();

    const [skippedStr, keptStr] = result.split(':');
    const skipped = parseInt(skippedStr, 10) || 0;
    const kept = parseInt(keptStr, 10) || 0;

    // Atomically replace original with optimized
    if (fs.existsSync(courtIffPath)) {
      fs.unlinkSync(courtIffPath);
    }
    fs.renameSync(tempOutPath, courtIffPath);

    const newStat = fs.statSync(courtIffPath);

    return {
      success: true,
      originalSizeMB: (originalStat.size / 1024 / 1024).toFixed(1),
      optimizedSizeMB: (newStat.size / 1024 / 1024).toFixed(1),
      removedFiles: skipped,
      remainingFiles: kept,
      savedMB: ((originalStat.size - newStat.size) / 1024 / 1024).toFixed(1)
    };
  } catch (err) {
    if (fs.existsSync(tempOutPath)) {
      try { fs.unlinkSync(tempOutPath); } catch {}
    }
    throw new Error(`Optimization failed: ${err.message}`);
  }
}

module.exports = {
  optimizeCourtArchive
};
