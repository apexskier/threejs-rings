const path = require("path");
const webpack = require("webpack");

module.exports = {
  entry: "./src/index.js",
  output: {
    filename: "main.js",
    path: path.resolve(__dirname, "dist"),
  },
  module: {
    rules: [
      { test: /\.js$/, exclude: /node_modules/, loader: "babel-loader" },
      {
        test: /\.(png|jpg|gif|stl)$/,
        use: [
          {
            loader: "file-loader",
          },
        ],
      },
    ],
  },
  externals: {
    three: "THREE",
  },
  plugins: [
    new webpack.ProvidePlugin({
      THREE: "three",
    }),
  ],
};
