function curry(fn, curArgs) {
  
  return function() {
    /** 
     * let args = [].slice.call(arguments)   //第一种
     * let args = Array.prototype.slice.call(arguments)   //第二种
     * let args = Array.from(arguments)   //第三种
     * let args = [...arguments]
    */

    let args = Array.prototype.slice.call(arguments)

    // 首次调用时，若未提供最后一个参数curArgs，则不用进行args的拼接
    if (curArgs !== undefined) {
      args = args.concat(curArgs)
    }

    
    // fn.length：指该函数有多少个必须要传入的参数，即形参的个数。形参的数量不包括剩余参数个数，仅包括第一个具有默认值之前的参数个数。
    // args.length：函数被调用时实际传参的个数
    if (args.length < fn.length) {
      return curry(fn, args)
    }

    return fn.apply(null, args)
  }
}