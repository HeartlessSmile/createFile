const fs = require('fs')
function canSkipEmptying(filePath, fileName) {
  let dir = filePath + '/' + fileName
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

function toHump(name) {
  return name
    .replace(/\_(\w)/g, function (all, letter) {
      return letter.toUpperCase()
    })
    .replace(/\-(\w)/g, function (all, letter) {
      return letter.toUpperCase()
    })
}

function toLine(name) {
  return name.replace(/([A-Z])/g, '_$1').toLowerCase()
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

module.exports = {
  canSkipEmptying,
  toHump,
  emptyDir,
}
