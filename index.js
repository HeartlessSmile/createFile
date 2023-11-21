#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const nunjucks = require('nunjucks')
// 命令行参数解析
const minimist = require('minimist')
// 命令行交互
const prompts = require('prompts')

const { red, green, bold, bgRed, bgGreen, yellow, bgYellow } = require('kolorist')

const { canSkipEmptying, toHump, emptyDir } = require('./utils')

async function init() {
  // --------- 解析参数start ----------
  const argv = minimist(process.argv.slice(2), { boolean: ['force'] })

  let targetDir = argv._[0]

  // 不存在的话，默认'vue-project'
  let result = {}
  const defaultFilePath = '/Users/smile/Desktop/szyh/declare-page/src'
  const defaultProjectName = !targetDir ? 'smile-project' : targetDir

  // 是否强制覆盖当前重名的文件夹

  const forceOverwrite = argv.force

  // --------- 解析参数end ----------

  // --------- 命令行交互 start ---------

  try {
    let filePath = ''
    let fileName = ''
    let pageType = 'page'
    result = await prompts(
      [
        // 创建文件夹的位置
        {
          type: 'text',
          name: 'filePath',
          message: '创建文件位置:',
          initial: defaultFilePath,
          validate: (value) => (fs.existsSync(value) ? true : '当前文件夹不存在'),
          onState: (state) => (filePath = String(state.value).trim() || defaultFilePath),
        },
        {
          type: 'text',
          name: 'fileName',
          message: '文件夹名称:',
          initial: defaultProjectName,
          validate: (value) => (value ? true : '当前参数必填'),
          onState: (state) => (fileName = String(state.value).trim()),
        },
        {
          name: 'shouldOverwrite',
          // 判断目录是否为空， canSkipEmptying（下面实现）
          type: () => (canSkipEmptying(filePath, fileName) || forceOverwrite ? null : 'confirm'),
          message: () => {
            return `${fileName} 已存在。 是否删除?`
          },
        },
        {
          type: 'select',
          name: 'midProjectPath',
          message: '项目位置',
          // initial: 'components/declare',
          choices: [
            { title: '税务申报', value: 'components/declare' },
            { title: '税务运维', value: 'components/declare-back' },
            { title: '税务档案', value: 'components/tax-file' },
          ],
          validate: (value) => (value ? true : '当前参数必填'),
        },
        {
          type: 'toggle',
          name: 'hasApi',
          message: '是否创建API',
          initial: true,
          active: 'yes',
          inactive: 'no',
        },
        {
          type: 'select',
          name: 'template',
          message: '模板',
          // initial: 'components/declare',
          choices: [
            { title: '页面列表', value: 'page' },
            { title: 'tabs页面列表', value: 'tabs' },
          ],
          validate: (value) => (value ? true : '当前参数必填'),
          onState: (state) => (pageType = String(state.value).trim()),
        },
        {
          name: 'tabs',
          // 判断目录是否为空， canSkipEmptying（下面实现）
          type: () => (pageType == 'tabs' ? 'list' : null),
          message: '请输入tabs',
          validate: (value) => (value ? true : '当前参数必填'),
        },
      ],

      {
        onCancel: () => {
          throw new Error(red('✖') + ' 操作已退出')
        },
      }
    )
  } catch (cancelled) {
    console.log(cancelled.message)
    process.exit(1)
  }

  // --------- 命令行交互 end ---------
  const {
    fileName = defaultProjectName,
    filePath = defaultFilePath,
    hasApi = true,
    hasColumnCheck,
    hasTool,
    shouldOverwrite = argv.force,
    midProjectPath = 'components/declare',
    template,
    tabs,
  } = result
  midApiPath = 'api'
  if (midProjectPath == 'components/declare-back') {
    midApiPath = 'api/declare-back'
  } else if (midProjectPath == 'components/tax-file') {
    midApiPath = 'api/tax-file'
  }
  console.log(midProjectPath, midApiPath)
  const cwd = process.cwd()
  // 获取要创建工程的绝对路径
  const fileNamePath = path.join(filePath, midProjectPath, fileName)
  // 这里是真正判断是否要覆盖文件夹
  if (fs.existsSync(fileNamePath) && shouldOverwrite) {
    emptyDir(fileNamePath) // emptyDir清空文件夹后面实现
  } else if (!fs.existsSync(fileNamePath)) {
    fs.mkdirSync(fileNamePath)
  }

  const humpFileName = toHump(fileName)

  console.log('开始创建项目:', green(fileNamePath))

  const templateRoot = path.resolve(__dirname, 'pageTemplates')
  const { exec, spawn } = require('child_process')
  // 创建Api并且引入
  if (hasApi) {
    const apiPath = path.join(templateRoot, 'api.js')
    let apiName = humpFileName + 'Api'
    fs.copyFileSync(apiPath, path.join(filePath, midApiPath, apiName + '.js'))

    // 读取api文件重写  判断引入位置
    if (midProjectPath == 'components/declare-back' || midProjectPath == 'components/tax-file') {
      let apiPath = path.join(filePath, midApiPath, apiName + '.js')
      let apiContent = fs.readFileSync(apiPath, 'utf-8')
      apiContent = apiContent.replace('import { base } from "../../static/globaljs/global.js";','import { base } from "../../../static/globaljs/global.js";')
      fs.writeFileSync(apiPath, apiContent, 'utf-8')
    } 


    let apiIndexPath = path.join(filePath, midApiPath, 'index.js')
    let apiIndexContent = fs.readFileSync(apiIndexPath, 'utf-8')
    if (!apiIndexContent.includes(apiName)) {
      let exportIndex = apiIndexContent.indexOf('export')
      apiIndexContent =
        apiIndexContent.slice(0, exportIndex) +
        `import ${apiName} from "./${apiName}.js";\n` +
        apiIndexContent.slice(exportIndex)

      let exportIndex2 = apiIndexContent.indexOf('}')
      apiIndexContent = `${apiIndexContent.slice(0, exportIndex2)} \t${apiName},\n ${apiIndexContent.slice(
        exportIndex2
      )}\n`
      fs.writeFileSync(apiIndexPath, apiIndexContent, 'utf-8')
      console.log(green(`创建${apiName} api成功`))
    } else {
      console.log(yellow(`api/index.js中已存在该${apiName} api`))
    }
  }

  // 读取模板内容
  let templatePath = path.join(templateRoot, 'index.vue')
  let templateContent = fs.readFileSync(templatePath, 'utf-8')
  templateContent = templateContent.replace('##apiFileName##', humpFileName + 'Api')
  if (template == 'page') {
    templateContent = templateContent.replace('##fileName##', humpFileName)

    fs.writeFileSync(path.join(fileNamePath, 'index.vue'), templateContent, 'utf-8')
  } else {
    for (let i = 0; i < tabs.length; i++) {
      let tab = tabs[i]
      let tabPath = path.join(fileNamePath, tab)
      if (!fs.existsSync(tabPath)) {
        templateContent = templateContent.replace('##fileName##', tab)
        fs.mkdirSync(tabPath)
        fs.writeFileSync(path.join(tabPath, 'index.vue'), templateContent, 'utf-8')
      }
    }
    nunjucks.configure(templateRoot, { autoescape: true })
    let str = nunjucks.render('tabs.ejs', { tabs, fileName:humpFileName })
    fs.writeFileSync(path.join(fileNamePath, 'index.vue'), str, 'utf-8')
  }

  console.log(`\n搭建工程完成 ${fileNamePath}...`)
}

init()
