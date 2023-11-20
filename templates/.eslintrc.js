// https://eslint.org/docs/user-guide/configuring
// off" 或 0 - 关闭该规则
// "warn" 或 1 - 启用并警告（不影响现有代码）
// "error" 或 2 - 启用并报错（错误代码 1）
module.exports = {
  root: true,
  parserOptions: {
    parser: 'babel-eslint'
  },
  env: {
    browser: true,
    commonjs: true,
    es6: true,
    node: true
  },
  extends: [
    // https://github.com/vuejs/eslint-plugin-vue#priority-a-essential-error-prevention
    // consider switching to `plugin:vue/strongly-recommended` or `plugin:vue/recommended` for stricter rules.
    'plugin:vue/essential',
    'standard' // 采用 standard style
  ],
  // required to lint *.vue files
  plugins: ['vue', 'prettier'],
  // add your custom rules here
  rules: {
    eqeqeq: 'off', // 可以使用== 和!=
    semi: ['warn', 'never'], // 句尾不需要;
    indent: ['error', 2], // 两个空格缩进
    'no-debugger': process.env.NODE_ENV === 'production' ? 2 : 1,
    'no-trailing-spaces': 2, // 不允许在行尾出现尾随空格
    'no-multi-spaces': 2, // 禁止多个空格
    'no-unused-vars': 0, // 无用变量提醒
    'one-var': 'off', // 每行可以声明多个变量
    'no-undef': 0, // 可以使用未声明变量
    camelcase: 0, // 不强制驼峰写法
    'no-redeclare': 1, // 禁止同一范围声明多个变量
    'standard/object-curly-even-spacing': 0,
    'no-mixed-operators': 0,
    'vue/no-parsing-error': 0,
    'no-array-constructor': 0,
    'no-useless-escape': 0,
    'no-unused-expressions': 0,
    'no-self-assign': 0,
    'no-eval': 0,
    'no-tabs': 0,
    'invalid-first-character-of-tag-name': 0,
    'space-before-function-paren': 0,

    'spaced-comment': 0,
    'no-tabs': 0,
    'standard/no-callback-literal': 0,
    'eol-last': 0,
    'no-extra-boolean-cast': 0,
    'no-unneeded-ternary': 0,
    'handle-callback-err': 0,
    'vue/require-valid-default-prop': 0,
    'vue/valid-template-root': 0,
    'vue/valid-v-else': 0,
    'space-before-blocks': 1,
    'no-proto': 0 // 可以使用__proto__
  }
}
