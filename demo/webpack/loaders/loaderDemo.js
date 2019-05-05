// 不能使用箭头函数
// this.callback 可以传递其他参数给外层
const loaderUtils = require('loader-utils')
module.exports = function(source) {
  const options = loaderUtils.getOptions(this)
  let result = ''
  if (options.tryCatch) {
    result = `try { ${source} } catch(err) {
      console.log(err.name)
      console.log(err.message)
      console.log(err.stack)
    }`
  }
  return result || source
}

// 异步loader
// this.async

// module.exports = function(source) {
//   const options = loaderUtils.getOptions(this)
//   const callback = this.async()
//   setTimeout(() => {
//     const result = source.replace('wq', options.flag)
//     callback(null, result)
//   }, 1000)
// }
