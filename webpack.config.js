const rules = require("./webpack.rules");
const plugins = require("./webpack.plugins");

module.exports = {
  module: {
    rules,
  },
  plugins: [...plugins],
  resolve: {
    extensions: [".js", ".jsx", ".css"],
    fallback: {
      path: false,
      fs: false,
      crypto: false,
    },
  },
};
