module.exports = {
  /**
   * This is the main entry point for your application, it's the first file
   * that runs in the main process.
   */
  entry: "./src/main.js",
  // Put your normal webpack config below here
  module: {
    rules: require("./webpack.rules"),
  },
  externals: {
    // update-electron-app 모듈은 번들에 포함시키지 않고 런타임에서 require 하도록 함
    "update-electron-app": "commonjs update-electron-app",
  },
};
