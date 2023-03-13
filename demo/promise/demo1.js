// const p = new Promise((resolve, reject) => {})
// console.log(p)

// const p1 = new Promise((resolve, reject) => {
//   resolve('成功')
//   reject('失败')
// })
// console.log(p1)

// const p2 = new Promise((resolve, reject) => {
//   reject('失败')
//   resolve('成功')
// })
// console.log(p2)

// const p3 = new Promise((resolve, reject) => {
//   throw('错误')
// })
// console.log(p3)

// 实现状态转换代码
function MyPromise(executor) {
  // 默认增加一个标记代表是promise
  this.Prototype = 'Promise'
  // 默认状态pending
  this.PromiseState = 'pending'
  // 定义返回的结果变量
  this.PromiseResult = undefined

  const _this = this

  function resolve(value) {
    if (_this.PromiseState !== 'pending') return
    // 如果执行resolve，状态变为fulfilled
    _this.PromiseState = 'fulfilled'
    // 终值为传进来的值
    _this.PromiseResult = value
  }

  function reject(reason) {
    if (_this.PromiseState !== 'pending') return
    // 如果执行reject，状态变为rejected
    _this.PromiseState = 'rejected'
    // 终值为传进来的reason
    _this.PromiseResult = reason
  }
  // 执行函数
  try {
    executor(resolve, reject)
  } catch (error) {
    reject(error)
  }
}

const p = new MyPromise((resolve, reject) => {})
console.log(p)

const p1 = new MyPromise((resolve, reject) => {
  resolve('成功')
  reject('失败')
})
console.log(p1)

const p2 = new MyPromise((resolve, reject) => {
  reject('失败')
  resolve('成功')
})
console.log(p2)

const p3 = new MyPromise((resolve, reject) => {
  throw('错误')
})
console.log(p3)