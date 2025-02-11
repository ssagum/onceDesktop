const path = require("path"); // path 모듈 추가 (필요시)
const rules = require("./webpack.rules");

rules.push({
  test: /\.css$/,
  // 렌더러 번들에서만 CSS를 처리하도록 하고, 만약 preload 파일이 있다면 제외할 수 있습니다.
  exclude: [path.resolve(__dirname, "src/preload.js")],
  use: [
    { loader: "style-loader" },
    { loader: "css-loader" },
    { loader: "postcss-loader" }, // postcss-loader 추가
  ],
});

module.exports = {
  module: {
    rules,
  },
};
