const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const tauriConfigPath = path.join(__dirname, '..', 'src-tauri', 'tauri.conf.json');

// Read current config
const config = JSON.parse(fs.readFileSync(tauriConfigPath, 'utf8'));
const currentVersion = config.version;

// Parse and bump version (patch level)
const parts = currentVersion.split('.');
parts[2] = parseInt(parts[2], 10) + 1;
const newVersion = parts.join('.');

// Update config
config.version = newVersion;
fs.writeFileSync(tauriConfigPath, JSON.stringify(config, null, 2) + '\n');

console.log(`Version bumped: ${currentVersion} -> ${newVersion}`);

// Run the build
console.log('Starting build...');
try {
  execSync('npm run tauri build', {
    stdio: 'inherit',
    cwd: path.join(__dirname, '..')
  });
  console.log(`\nBuild complete! Version ${newVersion}`);
} catch (error) {
  console.error('Build failed');
  process.exit(1);
}
