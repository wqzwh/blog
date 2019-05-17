
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
      require('./src/index.js')
    })({"./src/index.js":{"dependencies":{"./msg.js":"./src/msg.js"},"code":"\"use strict\";\n\nvar _msg = _interopRequireDefault(require(\"./msg.js\"));\n\nfunction _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { \"default\": obj }; }\n\nconsole.log(_msg[\"default\"]);"},"./src/msg.js":{"dependencies":{"./word.js":"./src/word.js"},"code":"\"use strict\";\n\nObject.defineProperty(exports, \"__esModule\", {\n  value: true\n});\nexports[\"default\"] = void 0;\n\nvar _word = _interopRequireDefault(require(\"./word.js\"));\n\nfunction _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { \"default\": obj }; }\n\nvar msg = \"say \".concat(_word[\"default\"]);\nvar _default = msg;\nexports[\"default\"] = _default;"},"./src/word.js":{"dependencies":{},"code":"\"use strict\";\n\nObject.defineProperty(exports, \"__esModule\", {\n  value: true\n});\nexports[\"default\"] = void 0;\nvar word = 'wangqi';\nvar _default = word;\nexports[\"default\"] = _default;"}})
  