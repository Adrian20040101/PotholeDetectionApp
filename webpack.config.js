const createExpoWebpackConfigAsync = require('@expo/webpack-config');

module.exports = async function(env, argv) {
  const config = await createExpoWebpackConfigAsync(env, argv);

  config.module.rules.push({
    test: /\.ttf$/,
    loader: "url-loader",
    include: [
      path.resolve(__dirname, "node_modules/react-native-vector-icons"),
      path.resolve(__dirname, "node_modules/@expo/vector-icons")
    ]
  });

  return config;
};
