# react 源码分析之 ReactElement 分析（二）

## 开场白

`render`函数想必是每个`react`开发者必会写到的一个方法，即使是些函数式组件那么`return`一个带标签的字符串肯定会用到，最终能使得浏览器识别标签，主要依赖`babel`以及`babel`相关的`react`插件转化成`React.createElement`形式的代码创建 dom 元素，那么到底`React.createElement`做了什么？为什么上一篇文章说，`props.children`不完全是数据类型？下面就来回答以上这两个疑问。

<!-- more -->

## 分析

> 从入口文件看，`ReactElement.js`源码中会暴露 createElement、cloneElement、createFactory、isValidElement，这里只做 createElement 详细介绍

需要弄清楚，`return` 出来的字符串到底被转成什么样的形式，例如下面的转换前和转换后的代码：

```javascript
// 转换前
;<div data-set="111">
  <span ref="span">aaa</span>
  <span key="1">bbb</span>
  <span>ccc</span>
</div>

// 转换后
React.createElement(
  'div',
  {
    'data-set': '111'
  },
  React.createElement(
    'span',
    {
      ref: 'span'
    },
    'aaa'
  ),
  React.createElement(
    'span',
    {
      key: '1'
    },
    'bbb'
  ),
  React.createElement('span', null, 'ccc')
)
```

> 这里故意增加了`data-set`、`ref`、`key`几个属性

其实很好理解，就是转换成了`React.createElement`函数去执行，那么可以打开`/react/src/ReactElement.js`源码，只需要关注两个方法`createElement`和`ReactElement`，源码片段如下：

> 可以不考虑**DEV**包含的代码，这里主要是开发模式下使用的

```javascript
const ReactElement = function(type, key, ref, self, source, owner, props) {
  const element = {
    $$typeof: REACT_ELEMENT_TYPE,
    type: type,
    key: key,
    ref: ref,
    props: props,
    _owner: owner
  }
  // 省略了__DEV__代码块
  return element
}

export function createElement(type, config, children) {
  let propName
  const props = {}
  let key = null
  let ref = null
  let self = null
  let source = null
  if (config != null) {
    if (hasValidRef(config)) {
      ref = config.ref
    }
    if (hasValidKey(config)) {
      key = '' + config.key
    }
    self = config.__self === undefined ? null : config.__self
    source = config.__source === undefined ? null : config.__source
    for (propName in config) {
      if (
        hasOwnProperty.call(config, propName) &&
        !RESERVED_PROPS.hasOwnProperty(propName)
      ) {
        props[propName] = config[propName]
      }
    }
  }
  const childrenLength = arguments.length - 2
  if (childrenLength === 1) {
    props.children = children
  } else if (childrenLength > 1) {
    const childArray = Array(childrenLength)
    for (let i = 0; i < childrenLength; i++) {
      childArray[i] = arguments[i + 2]
    }
    // 省略了__DEV__代码块
    props.children = childArray
  }
  if (type && type.defaultProps) {
    const defaultProps = type.defaultProps
    for (propName in defaultProps) {
      if (props[propName] === undefined) {
        props[propName] = defaultProps[propName]
      }
    }
  }
  // 省略了__DEV__代码块
  return ReactElement(
    type,
    key,
    ref,
    self,
    source,
    ReactCurrentOwner.current,
    props
  )
}
```

配合上面的示例代码，可以很清晰的看出，`createElement` 接受的三个参数：

- type，可以是原生标签（div、span）；可以是自定义组件（Component）；可以是原生组件（Fragment）；函数组件（function）
- config，代表的是标签或者组件上附带的属性（data-set、key、ref 等等）
- children，代表嵌套包含的组件或者子组件`React.createElement`整个返回值

从源码中可以看出，会对 ref 和 key 这两种特殊的属性都遍历出来，统一赋值给当前的`reactElement`上。

这里定义`const childrenLength = arguments.length - 2;`主要是因为可以支持嵌套多级组件，通过`arguments.length - 2`就能获取到除了前两个参数剩下参数的个数，当`childrenLength === 1`时，`props.children`就是包含的一个子组件，并不是数组，可以理解为一个`reactElement`对象，但是`childrenLength > 1`的时候，`props.children`就是个数组，所以之前说`props.children`可能是对象，可能是数组。

`type && type.defaultProps`这个 if 语句代码块主要是在设置默认值使用的，比较简单。

最终会调用`ReactElement`函数，然后返回一个代表是`ReactElement`的对象（通过`$$typeof`属性判断）

其实`createElement`和`ReactElement`只是将 props、ref、key 做了赋值操作，并没有之前想的那样会有很复杂的逻辑，解决了最开始的两个问题。

## 遗留的问题

通过以上分析，可以解释开篇最开始的两个疑问，但是又会有新的疑问：

- 源码中`ReactCurrentOwner`是什么东东？
- 在`createElement`的函数中`type`是如何判断是哪种类型的，在源码中并没有这样的逻辑？

以上就是全部的内容，如果有什么不对的地方，欢迎提[issues](https://github.com/wqzwh/blog/blob/master/2019/2019-05-16-react-ReactElement.md)
