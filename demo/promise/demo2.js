// 立即执行
const p = new Promise((resolve, reject) => {
  resolve(100)
})

p.then((res) => {
  console.log('成功', res) // 立即输出100
}, (err) => {
  console.log('失败', err)
})

const p0 = new Promise((resolve, reject) => {
  reject(100)
})

p0.then((res) => {
  console.log('成功', res) 
}, (err) => {
  console.log('失败', err) // 立即输出100
})

// 异步执行
const p1 = new Promise((resolve, reject) => {
  setTimeout(() => {
    resolve(100)
  }, 1000)
})

p1.then((res) => {
    console.log('成功', res) // 相隔1s输出100
}, (err) => {
  console.log('失败', err)
})

// 添加then方法
function MyPromise(executor) {
  // 默认增加一个标记代表是promise
  this.Prototype = 'Promise'
  // 默认状态pending
  this.PromiseState = 'pending'
  // 定义返回的结果变量
  this.PromiseResult = undefined

  this.fulfilledArr = [] // 收集成功的回调函数
  this.rejectedArr = [] // 收集失败的回调函数

  const _this = this

  function resolve(value) {
    if (_this.PromiseState !== 'pending') return
    // 如果执行resolve，状态变为fulfilled
    _this.PromiseState = 'fulfilled'
    // 终值为传进来的值
    _this.PromiseResult = value

    _this.fulfilledArr.forEach(fn => fn(value))
  }

  function reject(reason) {
    if (_this.PromiseState !== 'pending') return
    // 如果执行reject，状态变为rejected
    _this.PromiseState = 'rejected'
    // 终值为传进来的reason
    _this.PromiseResult = reason

    _this.rejectedArr.forEach(fn => fn(reason))
  }
  // 执行函数
  try {
    executor(resolve, reject)
  } catch (error) {
    reject(error)
  }
}

MyPromise.prototype.then = function (fulfilled, rejected) {
  if(this.PromiseState === 'fulfilled'){
    typeof fulfilled === 'function' && fulfilled(this.PromiseResult)
  }
  if(this.PromiseState === 'rejected'){
      typeof rejected === 'function' && rejected(this.PromiseResult)
  }

  // 当promise中是异步的时候，then在异步未执行完成之前都是pending状态，因此，将此时的回调函数收集起来
  if(this.PromiseState === 'pending'){
    typeof fulfilled === 'function' && this.fulfilledArr.push(fulfilled)
    typeof rejected === 'function' && this.rejectedArr.push(rejected)
  }

}