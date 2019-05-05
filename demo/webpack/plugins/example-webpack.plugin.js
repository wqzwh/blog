class ExampleWebpackPlugin {
  constructor(opts) {}

  apply(compiler) {
    compiler.hooks.compile.tap('ExampleWebpackPlugin', compilation => {
      console.log('同步complie时刻')
    })

    compiler.hooks.emit.tapAsync('ExampleWebpackPlugin', (compilation, cb) => {
      let filelist = 'In this build:\n\n'

      for (const filename in compilation.assets) {
        filelist += '- ' + filename + '\n'
      }

      // 新定义一个filelist.md文件，并且插入到最终打包的目录中
      compilation.assets['filelist.md'] = {
        source() {
          // 返回文件的内容
          return filelist
        },
        size() {
          // 返回文件的大小
          return filelist.length
        }
      }
      cb()
    })
  }
}

module.exports = ExampleWebpackPlugin
