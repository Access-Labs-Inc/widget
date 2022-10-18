const path = require("path");
const webpack = require("webpack");
var copyWebpackPlugin = require("copy-webpack-plugin");

const bundleOutputDir = "./dist";

module.exports = (env) => {
  const isDevBuild = !(env && env.prod);
  return [
    {
      entry: "./src/index.ts",
      devtool: isDevBuild ? "inline-source-map" : false,
      output: {
        filename: "widget.js",
        path: path.resolve(bundleOutputDir),
      },
      devServer: {
        static: bundleOutputDir,
      },
      plugins: isDevBuild
        ? [
            new webpack.ProvidePlugin({
              process: "process/browser",
              Buffer: ["buffer", "Buffer"],
            }),
            new copyWebpackPlugin([{ from: "dev/" }]),
          ]
        : [
            new webpack.ProvidePlugin({
              process: "process/browser",
              Buffer: ["buffer", "Buffer"],
            }),
          ],
      optimization: {
        minimize: !isDevBuild,
      },
      mode: isDevBuild ? "development" : "production",
      module: {
        rules: [
          // packs SVG's discovered in url() into bundle
          { test: /\.svg/, use: "svg-url-loader" },
          {
            test: /\.css$/i,
            use: [
              {
                loader: "style-loader",
              },
              {
                // allows import CSS as modules
                loader: "css-loader",
                options: {
                  modules: {
                    // css class names format
                    localIdentName: "[name]-[local]-[hash:base64:5]",
                  },
                  sourceMap: isDevBuild,
                },
              },
            ],
          },
          // use babel-loader for TS and JS modeles,
          // starting v7 Babel babel-loader can transpile TS into JS,
          // so no need for ts-loader
          // note, that in dev we still use tsc for type checking
          {
            test: /\.(js|ts|tsx|jsx)$/,
            exclude: [/node_modules/, /access-protocol/],
            use: [
              {
                loader: "babel-loader",
                options: {
                  presets: [
                    ["@babel/preset-env"],
                    [
                      // enable transpiling ts => js
                      "@babel/typescript",
                      // tell babel to compile JSX using into Preact
                      { jsxPragma: "h" },
                    ],
                  ],
                  plugins: [
                    // syntax sugar found in React components
                    "@babel/proposal-class-properties",
                    "@babel/proposal-object-rest-spread",
                    // transpile JSX/TSX to JS
                    [
                      "@babel/plugin-transform-react-jsx",
                      {
                        // we use Preact, which has `Preact.h` instead of `React.createElement`
                        pragma: "h",
                        pragmaFrag: "Fragment",
                      },
                    ],
                    "babel-plugin-macros",
                    "babel-plugin-styled-components",
                  ],
                },
              },
            ],
          },
        ],
      },
      resolve: {
        extensions: ["*", ".js", ".ts", ".tsx"],
        alias: {
          react: "preact/compat",
          "react-dom": "preact/compat",
        },
        fallback: {
          crypto: require.resolve("crypto-browserify"),
          stream: require.resolve("stream-browserify"),
          path: require.resolve("path-browserify"),
          buffer: require.resolve("buffer"),
          zlib: require.resolve("browserify-zlib"),
        },
      },
    },
  ];
};
