const fs = require('fs')
const path = require('path')

// 命令行参数解析
const minimist = require('minimist')
// 命令行交互
const prompts = require('prompts')

const { red, green, bold } = require('kolorist')

async function init() {
  // --------- 解析参数start ----------
  const argv = minimist(process.argv.slice(2), { boolean: ['force'] })

  let targetDir = argv._[0]

  // 不存在的话，默认'vue-project'
  const defaultProjectName = !targetDir ? 'smile-project' : targetDir
  // 是否强制覆盖当前重名的文件夹
  const forceOverwrite = argv.force

  console.log(defaultProjectName, forceOverwrite, targetDir)

  // --------- 解析参数end ----------

  // --------- 命令行交互 start ---------
  let result = {}
  try {
    result = await prompts(
      [
        {
          type: !targetDir ? null : 'text',
          name: 'projectName',
          message: '工程名称:',
          initial: defaultProjectName,
          onState: (state) => (targetDir = String(state.value).trim() || defaultProjectName),
        },
        {
          name: 'shouldOverwrite',
          // 判断目录是否为空， canSkipEmptying（下面实现）
          type: () => (canSkipEmptying(targetDir) || forceOverwrite ? null : 'confirm'),
          message: () => {
            const dirForPrompt = targetDir === '.' ? 'Current directory' : `Target directory "${targetDir}"`
            return `${dirForPrompt} 已存在。 是否删除?`
          },
        },
        {
          name: 'packageName',
          // isValidPackageName 判断package.name名称是否符合规范 （下面实现）
          type: () => (isValidPackageName(targetDir) ? null : 'text'),
          message: 'package name:',
          // 默认值： 将文件夹名称转为可用的package.name; toValidPackageName(下面实现)
          initial: () => toValidPackageName(targetDir),
          validate: (dir) => isValidPackageName(dir) || '无效的package name',
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
  console.log(result)
  console.log(targetDir)

  // --------- 命令行交互 end ---------

  const {
    projectName,
    packageName = projectName ?? defaultProjectName,
    shouldOverwrite = argv.force,
    projectType = 'component',
  } = result

  const cwd = process.cwd()
  // 获取要创建工程的绝对路径
  const root = path.join(cwd, targetDir)

  // 这里是真正判断是否要覆盖文件夹
  if (fs.existsSync(root) && shouldOverwrite) {
    emptyDir(root) // emptyDir清空文件夹后面实现
  } else if (!fs.existsSync(root)) {
    fs.mkdirSync(root)
  }

  // 提示一下
  console.log(`\n正在搭建工程 ${root}...`)
  const pkg = { name: '@ikun/' + packageName, version: '0.0.0' }
  fs.writeFileSync(path.resolve(root, 'package.json'), JSON.stringify(pkg, null, 2))

  const templateRoot = path.resolve(__dirname, 'templates')

  const { exec, spawn } = require('child_process')
  
  exec(`cp -a ${templateRoot}/.  ${root}`) // 复制文件夹，目标目录可以自动创建

  console.log(`\n搭建工程完成 ${root}...`)

}

init()

// index.js
function canSkipEmptying(dir) {
  if (!fs.existsSync(dir)) {
    return true
  }

  const files = fs.readdirSync(dir)
  if (files.length === 0) {
    return true
  }
  if (files.length === 1 && files[0] === '.git') {
    return true
  }

  return false
}

// 简单实现， 若想完整校验，可使用validate-npm-package-name库来检测
function isValidPackageName(projectName) {
  return /^(?:@[a-z0-9-*~][a-z0-9-*._~]*\/)?[a-z0-9-~][a-z0-9-._~]*$/.test(projectName)
}

function toValidPackageName(projectName) {
  return projectName
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/^[._]/, '')
    .replace(/[^a-z0-9-~]+/g, '-')
}

/**
 * 清空文件夹
 * @param dir 目标文件夹路径
 */
function emptyDir(dir) {
  if (!fs.existsSync(dir)) {
    return
  }

  // 处理目录下的文件和文件夹
  postOrderDirectoryTraverse(
    dir,
    (dir) => fs.rmdirSync(dir),
    (file) => fs.unlinkSync(file)
  )
}

/**
 * 处理目录下的文件和文件夹
 * @param dir 路径
 * @param dirCallback 处理文件夹的操作
 * @param fileCallback 处理文件的操作
 */
function postOrderDirectoryTraverse(dir, dirCallback, fileCallback) {
  for (const filename of fs.readdirSync(dir)) {
    if (filename === '.git') {
      continue
    }
    // 文件/文件夹路径
    const fullpath = path.resolve(dir, filename)
    if (fs.lstatSync(fullpath).isDirectory()) {
      // 若为文件夹，递归处理
      postOrderDirectoryTraverse(fullpath, dirCallback, fileCallback)
      // 对文件夹进行操作
      dirCallback(fullpath)
      continue
    }
    // 对文件进行操作
    fileCallback(fullpath)
  }
}

//复制模板
function renderTemplate(src, dest) {
  const stats = fs.statSync(src)

  /**
   * 若是文件夹，且不是modules目录，则创建文件夹
   * 再遍历文件夹下的内容，再递归处理文件和文件夹
   */
  if (stats.isDirectory()) {
    if (path.basename(src) === 'node_modules') {
      return
    }

    fs.mkdirSync(dest, { recursive: true })
    for (const file of fs.readdirSync(src)) {
      renderTemplate(path.resolve(src, file), path.resolve(dest, file))
    }
    return
  }

  const filename = path.basename(src)

  /**
   * 若是package.json文件已存在，则合并
   */
  if (filename === 'package.json' && fs.existsSync(dest)) {
    // merge instead of overwriting
    const existing = JSON.parse(fs.readFileSync(dest, 'utf8'))
    const newPackage = JSON.parse(fs.readFileSync(src, 'utf8'))
    const pkg = sortDependencies(deepMerge(existing, newPackage))
    fs.writeFileSync(dest, JSON.stringify(pkg, null, 2) + '\n')
    return
  }

  // 有些文件会被git识别，需要特殊处理，例如.gitignore
  if (filename.startsWith('_')) {
    // rename `_file` to `.file`
    dest = path.resolve(path.dirname(dest), filename.replace(/^_/, '.'))
  }
  fs.copyFileSync(src, dest)
}

// 合并package文件的逻辑，不赘述，可以按照自己想要的方式实现，也可以不合并，直接覆盖
const isObject = (val) => val && typeof val === 'object'
const mergeArrayWithDedupe = (a, b) => Array.from(new Set([...a, ...b]))

function deepMerge(target, obj) {
  for (const key of Object.keys(obj)) {
    const oldVal = target[key]
    const newVal = obj[key]

    if (Array.isArray(oldVal) && Array.isArray(newVal)) {
      target[key] = mergeArrayWithDedupe(oldVal, newVal)
    } else if (isObject(oldVal) && isObject(newVal)) {
      target[key] = deepMerge(oldVal, newVal)
    } else {
      target[key] = newVal
    }
  }

  return target
}
function sortDependencies(packageJson) {
  const sorted = {}

  const depTypes = ['dependencies', 'devDependencies', 'peerDependencies', 'optionalDependencies']

  for (const depType of depTypes) {
    if (packageJson[depType]) {
      sorted[depType] = {}

      Object.keys(packageJson[depType])
        .sort()
        .forEach((name) => {
          sorted[depType][name] = packageJson[depType][name]
        })
    }
  }

  return {
    ...packageJson,
    ...sorted,
  }
}
