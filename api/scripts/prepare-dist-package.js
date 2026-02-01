/**
 * Prepare package.json for Azure Functions deployment
 * Changes "main" from "dist/index.js" to "index.js" since we're deploying from dist folder
 */

const fs = require('fs');
const path = require('path');

const packageJsonPath = path.join(__dirname, '..', 'package.json');
const distPackageJsonPath = path.join(__dirname, '..', 'dist', 'package.json');

// Read original package.json
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

// Modify for dist deployment
packageJson.main = 'index.js'; // Changed from "dist/index.js"

// Remove devDependencies to reduce size
delete packageJson.devDependencies;

// Remove scripts that don't make sense in production
packageJson.scripts = {
  start: 'func start'
};

// Write to dist folder
fs.writeFileSync(distPackageJsonPath, JSON.stringify(packageJson, null, 2));

console.log('✅ Prepared package.json for Azure Functions deployment');
