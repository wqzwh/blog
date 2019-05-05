const fs = require('fs')
const parser = require('@babel/parser')
const traverse = require('@babel/traverse').default
const path = require('path')
const babel = require('@babel/core')

// 单个文件分析输出
const moduleAnalyser = filename => {
  const content = fs.readFileSync(filename, 'utf-8')
  const ast = parser.parse(content, {
    sourceType: 'module'
  })
  const dependencies = {}
  traverse(ast, {
    ImportDeclaration({ node }) {
      const dirname = path.dirname(filename)
      const newFile = './' + path.join(dirname, node.source.value)
      dependencies[node.source.value] = newFile
    }
  })
  const { code } = babel.transformFromAstSync(ast, null, {
    presets: ['@babel/preset-env']
  })

  return {
    filename,
    dependencies,
    code
  }
}

// 生成所有依赖的对象树
const makeDependenciesGraph = entry => {
  const entryModule = moduleAnalyser(entry)
  const graphArray = [entryModule]
  for (let i = 0; i < graphArray.length; i++) {
    const item = graphArray[i]
    const { dependencies } = item
    if (dependencies) {
      for (let j in dependencies) {
        graphArray.push(moduleAnalyser(dependencies[j]))
      }
    }
  }
  const graph = {}
  graphArray.forEach(item => {
    graph[item.filename] = {
      dependencies: item.dependencies,
      code: item.code
    }
  })
  return graph
}

// 根据所有依赖对象树生成浏览器执行代码
const generateCode = entry => {
  const graph = JSON.stringify(makeDependenciesGraph(entry))

  return `
    (function(graph){
      function require(module) {
        function localRequire(path) {
          return require(graph[module].dependencies[path])
        };
        var exports = {};
        (function(require, exports, code){
          eval(code)
        })(localRequire, exports, graph[module].code);
        return exports;
      }
      require('${entry}')
    })(${graph})
  `
}

// 生成文件夹及dist文件
const mkDist = (path, name, codeInfo) => {
  fs.readdir(path, (error, data) => {
    if (error) {
      fs.mkdirSync(path)
    }
    if (data && data.length) {
      fs.unlink(`${path}/${name}`, error => {
        if (error) {
          console.log(error)
          return false
        }
      })
    }
    fs.writeFile(`${path}/${name}`, codeInfo, 'utf8', error => {
      if (error) {
        console.log(error)
        return false
      }
    })
  })
}

const codeInfo = generateCode('./src/index.js')
mkDist('./dist', 'dist.js', codeInfo)
