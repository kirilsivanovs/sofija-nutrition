/**
 * Prepare package.json for Azure Functions deployment
 * Changes "main" from "dist/index.js" to "index.js" since we're deploying from dist folder
 */

const fs = require('fs');
const path = require('path');

const packageJsonPath = path.join(__dirname, '..', 'package.json');
const distPackageJsonPath = path.join(__dirname, '..', 'dist', 'package.json');
const distLocalSettingsPath = path.join(__dirname, '..', 'dist', 'local.settings.json');

// Read original package.json
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

// Modify for dist deployment
// Use index.js as the single entry point (Azure Functions v4 programming model).
// index.js imports all function files, which self-register via app.http().
// See: https://learn.microsoft.com/en-us/azure/azure-functions/functions-reference-node?pivots=nodejs-model-v4#registering-a-function
packageJson.main = 'index.js';

// Remove devDependencies to reduce size
delete packageJson.devDependencies;

// Remove scripts that don't make sense in production
packageJson.scripts = {
  start: 'func start'
};

// Write to dist folder
fs.writeFileSync(distPackageJsonPath, JSON.stringify(packageJson, null, 2));

// Remove local-only settings if they exist in dist
if (fs.existsSync(distLocalSettingsPath)) {
  fs.rmSync(distLocalSettingsPath, { force: true });
}

console.log('✅ Prepared package.json for Azure Functions deployment');
