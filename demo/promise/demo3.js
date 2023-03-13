// 链式调用，实际用的比较少
const p = new MyPromise((resolve, reject) => {
  resolve(100)
}).then((res) => {
  return 3 * res
}, (err) => {
console.log('失败', err)
}).then((res) => {
  console.log('成功', res) // 300
}, (err) => {
console.log('失败', err)
})

const p1 = new MyPromise((resolve, reject) => {
  resolve(100)
}).then(res => {
  return new MyPromise((resolve, reject) => {
    resolve(3 * res)
  })
}, err => {})
.then(res => console.log(res), // 输出300
      err => console.log(err))

// 实现then的链式调用
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

  const resPromise = new MyPromise((resolve2, reject2) => {

    function resolvePromise(prevValue, rso2, rej2) {
      if (prevValue instanceof MyPromise) {
        prevValue.then(rso2, rej2)
      } else {
        rso2(prevValue)
      }
    }

    if(this.PromiseState === 'fulfilled'){
      const prev = fulfilled(this.PromiseResult) // 上一个then返回的值
      typeof fulfilled === 'function' && resolvePromise(prev, resolve2, reject2)
    }
    if(this.PromiseState === 'rejected'){
        typeof rejected === 'function' && rejected(this.PromiseResult)
    }
  
    // 当promise中是异步的时候，then在异步未执行完成之前都是pending状态，因此，将此时的回调函数收集起来
    if(this.PromiseState === 'pending'){
      typeof fulfilled === 'function' && this.fulfilledArr.push(resolvePromise.bind(this, fulfilled))
      typeof rejected === 'function' && this.rejectedArr.push(rejected)
    }
  })
  return resPromise
}
