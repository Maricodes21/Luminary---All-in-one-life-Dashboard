// Workspace-root Metro config for Expo tools that start from the repo root.
//
// The real app lives in `mobile/`, but some launchers discover the root
// `App.js` shim and build from here. Mirror the mobile resolver behavior so
// imports like `@/components/ui/Icon` still point at `mobile/*`.

const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const workspaceRoot = __dirname;
const mobileRoot = path.resolve(workspaceRoot, 'mobile');

const config = getDefaultConfig(workspaceRoot);

config.watchFolders = [mobileRoot, path.resolve(workspaceRoot, 'packages')];

config.resolver.nodeModulesPaths = [
  path.resolve(mobileRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

const originalResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName.startsWith('@/')) {
    const target = path.resolve(mobileRoot, moduleName.slice(2));
    const fromDir = path.dirname(context.originModulePath);
    let rel = path.relative(fromDir, target).replace(/\\/g, '/');
    if (!rel.startsWith('.')) rel = './' + rel;
    return context.resolveRequest(context, rel, platform);
  }

  return originalResolveRequest
    ? originalResolveRequest(context, moduleName, platform)
    : context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
