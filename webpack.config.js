const path = require("path");
const webpack = require("webpack");
var CopyPlugin = require("copy-webpack-plugin");
const StatoscopeWebpackPlugin = require("@statoscope/webpack-plugin").default;
const { DuplicatesPlugin } = require("inspectpack/plugin");

const bundleOutputDir = "./dist";

module.exports = (env, argv) => {
  const isDevBuild = argv.mode !== "production";
  console.log("Production build: " + !isDevBuild);
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
            new StatoscopeWebpackPlugin(),
            new CopyPlugin([{ from: "dev/" }]),
            new DuplicatesPlugin({
              // Emit compilation warning or error? (Default: `false`)
              emitErrors: false,
              // Handle all messages with handler function (`(report: string)`)
              // Overrides `emitErrors` output.
              emitHandler: undefined,
              // List of packages that can be ignored. (Default: `[]`)
              // - If a string, then a prefix match of `{$name}/` for each module.
              // - If a regex, then `.test(pattern)` which means you should add slashes
              //   where appropriate.
              //
              // **Note**: Uses posix paths for all matching (e.g., on windows `/` not `\`).
              ignoredPackages: undefined,
              // Display full duplicates information? (Default: `false`)
              verbose: true,
            }),
          ]
        : [
            new webpack.ProvidePlugin({
              process: "process/browser",
              Buffer: ["buffer", "Buffer"],
            }),
            new StatoscopeWebpackPlugin(),
            new CopyPlugin([{ from: "dev/" }]),
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
	  url: require.resolve("url/"),
          "process/browser": require.resolve('process/browser'),
        },
      },
    },
  ];
};
