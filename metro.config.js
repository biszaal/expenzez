const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add polyfills for Node.js modules
config.resolver.alias = {
  ...config.resolver.alias,
  'buffer': require.resolve('buffer'),
};

// Add platforms support
config.resolver.platforms = ['web', 'native', 'ios', 'android'];

module.exports = config;