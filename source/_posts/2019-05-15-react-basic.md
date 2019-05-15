---
title: react源码分析之基础API简要分析(-)
comments: true
toc: true
date: 2019-05-15 11:35:12
tags:
  - 'javascript'
  - 'react'
---

## 开场白

团队是从今年年初开始使用`react`技术栈，之前都是使用`vue`开发，其实团队更换技术栈还是需要有一定的魄力的，因为团队在之前使用vue开发的时候，积累了一套组件库和项目构建工具，开发项目解决问题相对比较成熟了，贸然的更换技术栈这些基本就是从零开始，对个人和团队都是不小的挑战，当然，结果是坚持更换，主要是也能体会`react`的编写风格以及理解它的设计思想，再一个，公司大部分其他端的产品也基本都是沿袭`react`的技术栈，为了更好的迎合公司前端技术的发展，所以还是下定决心了。

到现在为止，其实`react`使用了快大半年了，经历了4个项目，单纯从使用上已经不成问题了，因为我们直接使用的是`reactv16.8.6+`的版本，其实很多新的功能并没有用上，也许是`react`的官方文档跟`vue`的相比，简直弱爆了。所以在空闲之余尝试的去读读源码，理解react到底是怎么实现这些功能的。

这次主要是进行`react`源码的分析，所以我们先从入口文件开始阅读吧

> 这次分析的是reactv16.8.6版本，其他版本未阅读

<!-- more -->

## 基础分析

打开入口文件，以下是`react`源码入口文件的片段代码，可以很清晰的看出，对外暴露的以下这些API

```javascript
// react/src/React.js
const React = {
  Children: {
    map,
    forEach,
    count,
    toArray,
    only,
  },

  createRef,
  Component,
  PureComponent,

  createContext,
  forwardRef,
  lazy,
  memo,

  error,
  warn,

  useCallback,
  useContext,
  useEffect,
  useImperativeHandle,
  useDebugValue,
  useLayoutEffect,
  useMemo,
  useReducer,
  useRef,
  useState,

  Fragment: REACT_FRAGMENT_TYPE,
  Profiler: REACT_PROFILER_TYPE,
  StrictMode: REACT_STRICT_MODE_TYPE,
  Suspense: REACT_SUSPENSE_TYPE,

  createElement: __DEV__ ? createElementWithValidation : createElement,
  cloneElement: __DEV__ ? cloneElementWithValidation : cloneElement,
  createFactory: __DEV__ ? createFactoryWithValidation : createFactory,
  isValidElement: isValidElement,

  version: ReactVersion,

  unstable_ConcurrentMode: REACT_CONCURRENT_MODE_TYPE,

  __SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED: ReactSharedInternals,
}
```

### Children

主要是处理`props.children`上渲染的内容，当`props.children`是多个的时候，在`createElement`的时候会将它转化成数组，如果`props.children`只有一个的时候，其实就是一个dom字符串，这里的`map、forEach`等方法是自定义的遍历方法，后面会单独介绍`ReactChildren`是如何实现这些的。

### createRef

新的`ref`用法，`React`会废弃在标签上直接使用`ref`来定义，例如：<div ref="myRef" />这种`string ref`的用法，将来你只能使用两种方式来使用`ref`，基本代码如下：

```javascript
class App extends React.Component{

  constructor() {
    this.ref = React.createRef() // {current: null}
  }

  render() {
    return <div ref={this.ref} />
    // or
    return <div ref={(node) => this.funRef = node} />
  }

}
```

其实`createRef`源码非常简单，，显而易见，就是返回了`{current: null}`这个对象，全部如下：

```javascript
// react/src/ReactCreateRef.js
import type {RefObject} from 'shared/ReactTypes';
export function createRef(): RefObject {
  const refObject = {
    current: null,
  };
  if (__DEV__) {
    Object.seal(refObject);
  }
  return refObject;
}
```

### Component/PureComponent

一般`Component`用的会比较多，`PureComponent`在早期的版本是没有的，`PureComponent`主要功能就是在使用过程中，自动判断`shouldComponentUpdate`是否需要更新，而`Component`往往需要自己去判断下，`PureComponent`可以说能提高一部分组件的渲染性能，个人其实还是觉得`Component`好用，最起码可以自定义是否更新。

打开`react/src/ReactBaseClasses.js`查看源码文件，其实`PureComponent`是继承了`Component`，只是会多一个`pureComponentPrototype.isPureReactComponent`这个字段来区分是否是`PureComponent`。

这里大家应该会觉得我们经常使用的`Component`类的源码应该非常复杂，但是实际却很是以为，源码加上注释才145行代码，以下贴出`Component`的片段源码：

```javascript
// react/src/ReactBaseClasses.js
function Component(props, context, updater) {
  this.props = props;
  this.context = context;
  this.refs = emptyObject;
  this.updater = updater || ReactNoopUpdateQueue;
}
Component.prototype.isReactComponent = {};
Component.prototype.setState = function(partialState, callback) {
  invariant(
    typeof partialState === 'object' ||
      typeof partialState === 'function' ||
      partialState == null,
    'setState(...): takes an object of state variables to update or a ' +
      'function which returns an object of state variables.',
  );
  this.updater.enqueueSetState(this, partialState, callback, 'setState');
};
Component.prototype.forceUpdate = function(callback) {
  this.updater.enqueueForceUpdate(this, callback, 'forceUpdate');
};
```

你会发现，我们经常使用的`setState`和`forceUpdate`(告诉react组件执行render方法)的更新逻辑并没有写在`Component`中，而是分别交给了`this.updater.enqueueSetState`和`this.updater.enqueueForceUpdate`来执行，***这里会有个疑问，updater是在什么时候挂在到this上的？***

### createContext

跨组件传递的内容组件，该组件导出两个对象`Provider`提供数据，`Consumer`消费数据，有效的解决组件嵌套过深导致的，数据层层传递的噩梦。

基本使用如下：

```jsx
import React from 'react'

const { Provider, Consumer } = React.createContext({
  background: 'red',
  color: 'white'
})

console.log(Provider, Consumer)

const ConsumerComp = () => (
  <Consumer>
    {(context) => {
      return <p style={{background: context.background, color: context.color}}>111111</p>
    }}
  </Consumer>
)

const ProviderComp = (props) => (
  <Provider value={{background: 'green', color: 'white'}}>
    <ConsumerComp/>
  </Provider>
)

export default ProviderComp
```

打开`react/src/ReactContext.js`文件可以查看源码，片段如下：

```javascript
const context: ReactContext<T> = {
    $$typeof: REACT_CONTEXT_TYPE,
    _calculateChangedBits: calculateChangedBits,
    _currentValue: defaultValue,
    _currentValue2: defaultValue,
    _threadCount: 0,
    Provider: (null: any),
    Consumer: (null: any),
  };

  context.Provider = {
    $$typeof: REACT_PROVIDER_TYPE,
    _context: context,
  };

  // 中间省略很多代码
  context.Consumer = context;

  return context;
```

这里能看出，使用`React.createContext`定义的数据会保存两份，分别是`_currentValue`和`_currentValue`，同时`context`默认的`$$typeof`是`REACT_CONTEXT_TYPE`，只是`context.Provider`会重新覆盖`$$typeof`为`REACT_PROVIDER_TYPE`，最后`context.Consumer = context`，这样写`Provider`和`Consumer`相互就是对方的引用，对象上存储的数据都是共享的，主要通过这样实现共享数据。

### forwardRef

通过`class`来定义的组件是可以通过`ref`获取当前组件的实例，但是如果仅仅通过函数创建的组件，如果还用之前`ref`形式创建的话，则组件内部是拿不到该组件的实例的，所以这里就衍生了`forwardRef`这个api了，基本使用如下：

```javascript
const MyButton = React.forwardRef((props, ref) => (
  <button ref={ref} className="MyButton">
    {props.children}
  </button>
));

// 通过ref可以直接操作<button>元素:
const ref = React.createRef();
<MyButton ref={ref}>Click me!</MyButton>;

// 可以理解渲染结果如下
<button ref={ref} className="MyButton">
    Click me!
</button>
```

打开源码`react/src/forwardRef.js`可以看到，其实调用`forwardRef`只是返回了一个对象：

```javascript
return {
  $$typeof: REACT_FORWARD_REF_TYPE,
  render
}
```

这里的render就是外层传进来渲染组件的方法，这里涉及到组件更新的过程，后面会详细介绍。

### lazy

使用React.lazy()等待组件加载的时候 暂停渲染，基本使用如下：

```javascript
const OtherComponent = React.lazy(() => import('./OtherComponent'));

function MyComponent() {
  return (
    <React.Suspense fallback={<Spinner />}>
      <div>
        <OtherComponent />
      </div>
    </React.Suspense>
  );
}
```

打开源码`react/src/ReactLazy.js`可以看到，其实就是返回了一个对象，片段代码如下：

```javascript
lazyType = {
  $$typeof: REACT_LAZY_TYPE,
  _ctor: ctor,
  // React uses these fields to store the result.
  _status: -1,
  _result: null,
}
```

`_status`记录组件渲染的状态，默认是-1，1就是渲染完成。

### memo

说实话，我是没用过这个，通过源码能看出接受两个参数，第一个参数是组件，第二个参数则是个boolean值，片段代码如下：

```javascript
export default function memo<Props>(
  type: React$ElementType,
  compare?: (oldProps: Props, newProps: Props) => boolean,
) {
  if (__DEV__) {
    if (!isValidElementType(type)) {
      warningWithoutStack(
        false,
        'memo: The first argument must be a component. Instead ' +
          'received: %s',
        type === null ? 'null' : typeof type,
      );
    }
  }
  return {
    $$typeof: REACT_MEMO_TYPE,
    type,
    compare: compare === undefined ? null : compare,
  };
}
```

通过查询其他资料了解到，这个api类似于shouldcomponentupdate，第二个boolean主要判断组件是否更新，基本使用如下：

```javascript
import React from "react";
function Child({seconds}){
    console.log('I am rendering');
    return (
        <div>I am update every {seconds} seconds</div>
    )
};
function areEqual(prevProps, nextProps) {
    if(prevProps.seconds===nextProps.seconds){
        return true
    }else {
        return false
    }
}
export default React.memo(Child,areEqual)
```

***use开头的api主要是跟Hooks相关，后面详细介绍***

### 其他

这几个api其实就是一个Symbol类型，这里需要说明下为什么会用Symbol.for()，而不是直接使用Symbol来创建。

> Symbol.for它接受一个字符串作为参数，然后搜索有没有以该参数作为名称的 Symbol 值。如果有，就返回这个Symbol 值，否则就新建并返回一个以该字符串为名称的 Symbol 值。
> 如果你调用Symbol.for("cat")30 次，每次都会返回同一个 Symbol 值，但是调用Symbol("cat")30 次，会返回 30 个不同的 Symbol 值。

```javascript
Fragment: REACT_FRAGMENT_TYPE,
Profiler: REACT_PROFILER_TYPE,
StrictMode: REACT_STRICT_MODE_TYPE,
Suspense: REACT_SUSPENSE_TYPE,
```

以下这四个api都是来自ReactElement.js中的，createElement用来创建ReactElement的；cloneElement克隆一个ReactElement；createFactory是用来创建专门用来创建某一类ReactElement的工厂的；isValidElement用来验证是否是一个ReactElement。其中createElement是最终要的api，会单独详细介绍它。

```javascript
createElement: __DEV__ ? createElementWithValidation : createElement,
cloneElement: __DEV__ ? cloneElementWithValidation : cloneElement,
createFactory: __DEV__ ? createFactoryWithValidation : createFactory,
isValidElement: isValidElement,
```

## 遗留的问题

- 就是在创建`Component`的时候，`this.updater`在什么时候被挂在上的？
- memo如果通过第二个参数进行判断组件是否该渲染？（一般用的很少，索性先提出来）
- forwardRef最后返回的一个对象，里面的render函数如何渲染更新的？
- lazy通过内部定义的`_status`来判断组件是否渲染，在哪里`_status`被改变了？（一般用的很少，索性先提出来）
- createElement到底如何创建的？
- Hooks是什么？
- ReactChildren是如何实现的？


以上就是全部的内容，如果有什么不对的地方，欢迎提[issues](https://github.com/wqzwh/blog/blob/master/source/_posts/2019-05-15-react-basic.md)
































