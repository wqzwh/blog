const path = require('path')
const ExampleWebpackPlugin = require('./plugins/example-webpack.plugin')

module.exports = {
  mode: 'development',
  entry: {
    main: './index.js'
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js'
  },
  resolveLoader: {
    modules: ['node_modules', './loaders/']
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        use: [
          {
            loader: 'loaderDemo',
            options: {
              tryCatch: true
            }
          }
        ]
      }
    ]
  },
  plugins: [
    new ExampleWebpackPlugin({
      flag: true
    })
  ]
}
