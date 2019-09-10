var path = require("path");
const TerserPlugin = require("terser-webpack-plugin");
const CopyPlugin = require("copy-webpack-plugin");

function getConfig(appName, template) {
  let appSource = template;
  if (!template) {
    appSource = appName;
  }

  const optimization = {
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          output: {
            comments: false
          }
        }
      })
    ]
  }

  if (appSource !== 'dynamic') {
    optimization.splitChunks = {
      cacheGroups: {
        vendor: {
          chunks: "all",
          name: "firebase",
          test: /[\\/]node_modules[\\/]@?firebase[\\/]/,
          enforce: true
        }
      }
    }
  } else {
    optimization.splitChunks = {
      name: (module, chunks) => {
        return chunks[0].name;
      }
    }
  }
  const config = {
    mode: "production",
    entry: {
      [appName]: `./src/${appName}.js`
    },
    output: {
      path: path.resolve(__dirname, `build/${appName}`),
      filename: 'index.js',
      chunkFilename: "[name].bundle.js"
    },
    module: {
      rules: [
        {
          test: /\.js$/,
          loader: "babel-loader",
          options: {
            presets: [
              [
                "@babel/preset-env",
                {
                  targets: {
                    node: "10"
                  }
                }
              ]
            ],
            plugins: ["@babel/plugin-syntax-dynamic-import"]
          }
        }
      ]
    },
    resolve: {
      mainFields: ["browser", "main"]
    },
    stats: {
      colors: true
    },
    devtool: "source-map",
    devServer: {
      contentBase: "./build",
      watchContentBase: true,
      compress: true
    },
    plugins: [new CopyPlugin([
        { from: "./src/static/*.css", to: "./", flatten: true },
        { from: `./src/static/${appSource}.html`, to: `./index.html` },
    ])],
    optimization
  };
  return config;
}

module.exports = [
  getConfig("full"),
  getConfig("split"),
  getConfig("dynamic"),
  getConfig("full-split", /* CHANGE WHEN UPDATING VERSION */ "full"),
  getConfig("full-split-dynamic", /* CHANGE WHEN UPDATING VERSION */ "full")
];
