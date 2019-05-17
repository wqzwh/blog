# 如何使用 vue-ssr 做服务端渲染初体验(三)

### 1、前言

上一节大致介绍了服务端和客户端入口文件代码内容，现在已经可以正常运行你的后端渲染脚手架了，这一节，跟大家分享下如何使用 axios 做 ajax 请求，如何使用 mockjs 做本地假数据，跑通本地基本逻辑，为以后前后端连调做准备。

### 2、前期准备

需要用 npm 安装 axios，mockjs 依赖包,由于 mockjs 只是代码开发的辅助工具，所以安装的时候我会加--save-dev 来区分，具体可以根据自己的需求来定，当然，如果有 mock 服务平台的话，可以直接走 mock 平台造假数据，本地直接访问 mock 平台的接口，例如可以使用阿里的 Rap 平台管理工具生成。

```javascript
npm install axios --save
npm install mockjs --save-dev
```

<!-- more -->

### 3、简要介绍 axios

> 其他请求方式，代码示例如下：

```javascript
axios.request(config);
axios.get(url[,config]);
axios.delete(url[,config]);
axios.head(url[,config]);
axios.post(url[,data[,config]]);
axios.put(url[,data[,config]])
axios.patch(url[,data[,config]])
```

> 具体详细可以点击查看<a href="/2017-05-02/" target="_blank" >axios 基本使用介绍</a>

api.js 完整代码如下：

```javascript
import axios from 'axios'
import qs from 'qs'
import Q from 'q'
/**
 * 兼容 不支持promise 的低版本浏览器
 */
require('es6-promise').polyfill()
import C from '../conf'

axios.defaults.headers.post['Content-Type'] =
  'application/x-www-form-urlencoded; charset=UTF-8'
axios.defaults.withCredentials = true

function ajax(url, type, options) {
  return Q.Promise((resolve, reject) => {
    axios({
      method: type,
      url: C.HOST + url,
      params: type === 'get' ? options : null,
      data: type !== 'get' ? qs.stringify(options) : null
    })
      .then(result => {
        if (result && result.status === 401) {
          // location.href = '/views/401.html'
        }
        if (result && result.status === 200) {
          if (result.data.code === 200) {
            resolve(result.data.data)
          } else if (result.data.code === 401) {
            reject({
              nopms: true,
              msg: result.data.msg
            })
          } else {
            reject({
              error: true,
              msg: result.data.msg
            })
          }
        } else {
          reject({
            errno: result.errno,
            msg: result.msg
          })
        }
      })
      .catch(function(error) {
        console.log(error, url)
      })
  })
}

const config = {
  get(url, options) {
    const _self = this
    return Q.Promise((resolve, reject) => {
      ajax(url, 'get', options).then(
        data => {
          resolve(data)
        },
        error => {
          reject(error)
        }
      )
    })
  },

  post(url, options) {
    const _self = this
    return Q.Promise((resolve, reject) => {
      ajax(url, 'post', options).then(
        data => {
          resolve(data)
        },
        error => {
          reject(error)
        }
      )
    })
  },

  put(url, options) {
    const _self = this
    return Q.Promise((resolve, reject) => {
      ajax(url, 'put', options).then(
        data => {
          resolve(data)
        },
        error => {
          reject(error)
        }
      )
    })
  },

  delete(url, options) {
    const _self = this
    return Q.Promise((resolve, reject) => {
      ajax(url, 'delete', options).then(
        data => {
          resolve(data)
        },
        error => {
          reject(error)
        }
      )
    })
  },

  jsonp(url, options) {
    const _self = this
    return Q.Promise((resolve, reject) => {
      ajax(url, 'jsonp', options).then(
        data => {
          resolve(data)
        },
        error => {
          reject(error)
        }
      )
    })
  }
}

export default config
```

> mockjs 项目基本配置如下：

1、在 public 下新建 conf.js 全局定义请求 url 地址，代码如下：

```javascript
module.exports = {
  HOST: 'http://www.xxx.com',
  DEBUGMOCK: true
}
```

2、在 views/index 根目录下新建 conf.js，定义组件 mock 的请求路径，并且定义是否开始单个组件使用 mock 数据还是线上接口数据，代码如下：

```javascript
const PAGEMOCK = true
const MODULECONF = {
  index: {
    NAME: '首页',
    MOCK: true,
    API: {
      GET: '/api/home'
    }
  }
}
```

3、在组件内部定义 mockjs 来编写 mock 假数据，代码如下：

```javascript
import Mock from 'mockjs'
const mData = {
  index: {
    API: {
      GET: {
        code: 200,
        data: {
          pin: 'wangqi',
          name: '王奇'
        }
      }
    }
  }
}
```

以上就是基本的流程，如果有更好更灵活的使用方案，希望能够参与沟通并且分享，项目工作流已经在 github 上分享，<a href="https://github.com/wqzwh/wq-vue-ssr" target="_blank">点击查看详情</a>
