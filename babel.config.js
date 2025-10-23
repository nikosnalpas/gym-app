// babel.config.js (or .ts)
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
    plugins: [
      "expo-router/babel",
      [
        "module-resolver",
        {
          root: ["."],
          alias: {
            "@": "./",
            "@src": "./src",
          },
        },
      ],
      "react-native-reanimated/plugin", // MUST be last
    ],
  };
};
