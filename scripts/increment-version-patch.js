const fs = require('fs');
const path = require('path');

const packageJsonPath = path.join(__dirname, '..', 'package.json');
const packageJson = require(packageJsonPath);

// Split version into major, minor, and patch
const [major, minor, patch] = packageJson.version.split('.').map(Number);

// Increment patch version
packageJson.version = `${major}.${minor}.${patch + 1}`;

// Write back to package.json
fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');

console.log(`Version incremented to ${packageJson.version}`);
