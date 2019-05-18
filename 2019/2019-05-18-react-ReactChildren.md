# react 源码分析之 ReactChildren 分析（三）

## 回顾之前

在第一篇 `react` 基础 `api` 介绍的时候，遗留的问题中就包含 `ReactChildren` 到底是如何实现的，在分析之前，肯定会有一个疑问，这个 api 在实际场景中使用的比较少，而且从入口文件中也能大致了解到，暴露出的 api 其实也是类数组的方法，支持使用原生的 `for` 循环重新定义了 `map`、`forEach` 等方法。

经过前面两篇文章的介绍，可以基本了解到，`react` 组件其实就是一个带有很多属性的一个对象，既然重新实现了 `map、forEach` 方法，那么也就是循环创建对象，如果出现嵌套过深的组件，这样循环创建对象是不是会非常消耗性能？那么不妨咱们可以带着这个疑问来分析这个全局 `api`。

> 这里只会重点分析下 map 的过程，其余几个 api 相对比较简单

## 分析

先列出几个重点相关的函数：

- mapChildren
- mapIntoWithKeyPrefixInternal
- getPooledTraverseContext
- traverseAllChildren
- traverseAllChildrenImpl
- mapSingleChildIntoContext
- releaseTraverseContext

### mapChildren

这个函数只是定义一个 `result` 数组，通过调用 `mapIntoWithKeyPrefixInternal` 函数，最终返回 `result` 数组

```javascript
function mapChildren(children, func, context) {
  if (children == null) {
    return children
  }
  const result = []
  mapIntoWithKeyPrefixInternal(children, result, null, func, context)
  return result
}
```

### mapIntoWithKeyPrefixInternal

这个函数定义 `traverseContext` 变量接收 `getPooledTraverseContext` 函数的返回值，之后作为参数再次调用 `traverseAllChildren` 函数，最终调用 `releaseTraverseContext` 函数

`mapChildren` 函数中传进来的 `result` 其实就是这里的 `array` 参数，那么我们就要分析，`getPooledTraverseContext`、`traverseAllChildren`、`releaseTraverseContext` 谁最终改变了 `array` 数组的值，带着这个疑问可以继续往下分析。

```javascript
function mapIntoWithKeyPrefixInternal(children, array, prefix, func, context) {
  let escapedPrefix = ''
  if (prefix != null) {
    escapedPrefix = escapeUserProvidedKey(prefix) + '/'
  }
  const traverseContext = getPooledTraverseContext(
    array,
    escapedPrefix,
    func,
    context
  )
  traverseAllChildren(children, mapSingleChildIntoContext, traverseContext)
  releaseTraverseContext(traverseContext)
}
```

### getPooledTraverseContext

先弄清楚，上一个函数传进来的 `array` 就是这个函数参数 `mapResult`，这里出现了判断 `traverseContextPool.length` 是否存在，如果存在则会在 `traverseContextPool` 数组中末尾取出一个值，然后进行对象赋值，如果不存在则返回一个新创建的对象，并且赋值。

那么问题来了，为什么这里会去定义一个 `traverseContextPool` 变量呢？在哪里改变了这个数组？带着这个疑问继续往下分析

```javascript
const traverseContextPool = []
function getPooledTraverseContext(
  mapResult,
  keyPrefix,
  mapFunction,
  mapContext
) {
  if (traverseContextPool.length) {
    const traverseContext = traverseContextPool.pop()
    traverseContext.result = mapResult
    traverseContext.keyPrefix = keyPrefix
    traverseContext.func = mapFunction
    traverseContext.context = mapContext
    traverseContext.count = 0
    return traverseContext
  } else {
    return {
      result: mapResult,
      keyPrefix: keyPrefix,
      func: mapFunction,
      context: mapContext,
      count: 0
    }
  }
}
```

### traverseAllChildren/traverseAllChildrenImpl

这两个函数其实主要是 `traverseAllChildren` 直接调用了 `traverseAllChildrenImpl` 函数，参数原封不动的传递下去，只是在调用钱做了一个判断，`children` 是否为 `null`，这个大家很好理解，那么，可以具体看下 `traverseAllChildrenImpl` 这个函数的逻辑。

先搞清楚 `traverseAllChildrenImpl` 接受的几个参数意义：

- children 就是 props.children 上的内容，上面文章介绍过，可能出现的类型是 string，number，object，array
- nameSoFar 跟路径相关，不做详解
- callback 回调函数，其实就是 mapSingleChildIntoContext 这个函数
- traverseContext getPooledTraverseContext 函数的返回值，就是返回被赋值好的一个对象

下面贴出 `traverseAllChildrenImpl`，关键的代码片段

```javascript
let invokeCallback = false

if (children === null) {
  invokeCallback = true
} else {
  switch (type) {
    case 'string':
    case 'number':
      invokeCallback = true
      break
    case 'object':
      switch (children.$$typeof) {
        case REACT_ELEMENT_TYPE:
        case REACT_PORTAL_TYPE:
          invokeCallback = true
      }
  }
}

if (invokeCallback) {
  callback(
    traverseContext,
    children,
    nameSoFar === '' ? SEPARATOR + getComponentKey(children, 0) : nameSoFar
  )
  return 1
}

let child
let nextName
let subtreeCount = 0 // Count of children found in the current subtree.
const nextNamePrefix = nameSoFar === '' ? SEPARATOR : nameSoFar + SUBSEPARATOR

if (Array.isArray(children)) {
  for (let i = 0; i < children.length; i++) {
    child = children[i]
    nextName = nextNamePrefix + getComponentKey(child, i)
    subtreeCount += traverseAllChildrenImpl(
      child,
      nextName,
      callback,
      traverseContext
    )
  }
} else {
  const iteratorFn = getIteratorFn(children)
  if (typeof iteratorFn === 'function') {
    // 省略__DEV__代码
    const iterator = iteratorFn.call(children)
    let step
    let ii = 0
    while (!(step = iterator.next()).done) {
      child = step.value
      nextName = nextNamePrefix + getComponentKey(child, ii++)
      subtreeCount += traverseAllChildrenImpl(
        child,
        nextName,
        callback,
        traverseContext
      )
    }
  } else if (type === 'object') {
    let addendum = ''
    // 省略__DEV__代码
    const childrenString = '' + children
    invariant(
      false,
      'Objects are not valid as a React child (found: %s).%s',
      childrenString === '[object Object]'
        ? 'object with keys {' + Object.keys(children).join(', ') + '}'
        : childrenString,
      addendum
    )
  }
}

return subtreeCount
```

> 函数返回 `subtreeCount` 这个数据主要是给 `Child` 上面的`count`API 使用的，用来记录 `props.children` 中找到的子项数，如果单纯分析 map 相关的函数，这里可以不需要考虑这个返回值

其实这里需要抓住 `invokeCallback` 这个变量的真假判断即可，如果传进来的是数组，那么这里递归调用，只有传入 `string、number、object、以及\$\$typeof 要是 REACT_ELEMENT_TYPE 或者 REACT_PORTAL_TYPE`这个类型的就会触发 `callback` 回调函数。

### mapSingleChildIntoContext

参数含义：

- bookKeeping 就是 getPooledTraverseContext 函数的返回值，就是返回被赋值好的一个对象
- child 这里的 child 只会是 string、number、object 里面的一种
- childKey 暂时不做分析

```javascript
function mapSingleChildIntoContext(bookKeeping, child, childKey) {
  const { result, keyPrefix, func, context } = bookKeeping

  let mappedChild = func.call(context, child, bookKeeping.count++)
  if (Array.isArray(mappedChild)) {
    mapIntoWithKeyPrefixInternal(mappedChild, result, childKey, c => c)
  } else if (mappedChild != null) {
    if (isValidElement(mappedChild)) {
      mappedChild = cloneAndReplaceKey(
        mappedChild,
        keyPrefix +
          (mappedChild.key && (!child || child.key !== mappedChild.key)
            ? escapeUserProvidedKey(mappedChild.key) + '/'
            : '') +
          childKey
      )
    }
    result.push(mappedChild)
  }
}
```

这里的 `func` 其实就是我们在使用`React.Children.map`函数传入的回调函数，这里会定义`mappedChild`变量来接受回调函数的返回值，并且判读`mappedChild`是否为数组，如果为数组则会继续调用`mapIntoWithKeyPrefixInternal`，这个函数就是`mapChildren`函数内部触发一个函数方法，这里其实又是一个递归函数的调用。

当`mappedChild`不是数组，则这里会改变`result`的值，终于找到改变`result`变量的地方了

### releaseTraverseContext

片段代码如下：

```js
const POOL_SIZE = 10
function releaseTraverseContext(traverseContext) {
  traverseContext.result = null
  traverseContext.keyPrefix = null
  traverseContext.func = null
  traverseContext.context = null
  traverseContext.count = 0
  if (traverseContextPool.length < POOL_SIZE) {
    traverseContextPool.push(traverseContext)
  }
}
```

终于找到了`traverseContextPool`被改变的地方，你可能会觉得，`getPooledTraverseContext`这个函数`pop`取值，这里`push`增加值，那是不是`traverseContextPool`这个变量只会有一个值，奇妙的地方就在`mapSingleChildIntoContext`这个函数中会再次调用`mapIntoWithKeyPrefixInternal`函数（只有当回调函数返回的是一个数组才会调用）。

可能这么说很难理解，贴上一段示例代码，基本如下：

```js
React.Children.map(props.children, c => [c])
```

例如上面的示例代码，当你返回的是一个数组，就会使得`traverseContextPool`再次被`push`一个缓存对象，如果回调循环嵌套多了，可以减少很多对象创建提高性能，不至于频繁的创建和销毁对象。

## 总结

这里的`map`函数主要实现的两个功能：

- 根据自定义回调函数遍历所有的子组件
- 根据内部`POOL_SIZE`和`traverseContextPool`来判断是否需要缓存创建对象，提高性能，通过嵌套递归去实现的。

`React.Children`这个全局 API 相对比较独立，可以当作工具函数使用，里面并没有与更新操作相关的内容。
