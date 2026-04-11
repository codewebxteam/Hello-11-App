const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require('nativewind/metro');
const path = require('path');
 
const config = getDefaultConfig(__dirname);

// Resolution Fix: Help Metro find lodash subpaths used by react-native-calendars
config.resolver.extraNodeModules = {
  'lodash/isEmpty': path.resolve(__dirname, 'node_modules/lodash/isEmpty.js'),
  'lodash/isFunction': path.resolve(__dirname, 'node_modules/lodash/isFunction.js'),
  'lodash': path.resolve(__dirname, 'node_modules/lodash'),
};
 
module.exports = withNativeWind(config, { input: './global.css' });