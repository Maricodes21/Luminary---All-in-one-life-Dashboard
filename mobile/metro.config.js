// Metro configured for our npm workspaces monorepo.
// Watches the repo root so changes in `packages/design-system` hot-reload.

const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '..');

const config = getDefaultConfig(projectRoot);

// 1. Watch all files in the monorepo.
config.watchFolders = [monorepoRoot];

// 2. Resolve modules from this app and the monorepo root.
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
];

// 3. Force a single React across workspaces.
config.resolver.disableHierarchicalLookup = true;

module.exports = config;
