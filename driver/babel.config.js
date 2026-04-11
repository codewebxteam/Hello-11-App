module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
      "nativewind/babel",
    ],
    plugins: [
      "react-native-reanimated/plugin",
      ["module-resolver", {
        root: ["."],
        alias: {
          "lodash/isEmpty": "./node_modules/lodash/isEmpty.js",
          "lodash/isFunction": "./node_modules/lodash/isFunction.js",
          "lodash": "./node_modules/lodash",
          "xdate": "./node_modules/xdate",
          "prop-types": "./node_modules/prop-types"
        }
      }]
    ],
  };
};