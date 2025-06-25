const { getDefaultConfig } = require('@expo/metro-config');

const defaultConfig = getDefaultConfig(__dirname);

// Add .cjs extension support for Firebase
defaultConfig.resolver.sourceExts.push('cjs');

// Disable package exports to prevent Firebase module resolution issues
defaultConfig.resolver.unstable_enablePackageExports = false;

module.exports = defaultConfig; 