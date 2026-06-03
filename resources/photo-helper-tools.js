/*
 * @Author: mikey.zhaopeng
 * @Date: 2023-09-29 00:27:37
 * @Last Modified by: Sun Rising
 * @Last Modified time: 2025-02-22 20:17:26
 * 相片视频管理工具
 */
const fs = require('fs-extra')
const pify = require('pify')
const path = require('path')
const Exif = require('exif')

const { parentPort } = require('worker_threads')

class PhotoHelper {
  // 源文件夹
  sourceDir = ''
  // 目标文件夹
  targetDir = ''
  // 其他未符合分类规则的存放文件夹
  otherDir = path.join(this.targetDir, 'TEMP')
  // 处理的文件类型
  imageType = ['.jpg', '.jpeg', '.png', '.arw']
  videoType = ['.mp4', '.3gp', '.mov']
  // 处理方式
  handleType = 'copy'
  // 目录结构 ["YYYY", "MM"] | ['YYYY-MM']
  dirStruct = ['YYYY-MM']
  // 重名是否覆盖
  isOverwrite = true

  // 文件对象集合
  fileList = []
  // 其它文件集合
  otherFileList = []
  // 已经操作的文件集合
  operatedFileList = []

  async run(option) {
    try {
      this.checkOption(option)

      this.fileList = []
      this.otherFileList = []
      this.operatedFileList = []

      this.sourceDir = option.sourceDir
      this.targetDir = option.targetDir
      this.otherDir = path.join(this.targetDir, 'TEMP')
      this.handleType = option.handleType || 'copy'
      this.dirStruct = option.dirStruct || ['YYYY-MM']
      this.isOverwrite = option.isOverwrite ?? true
      this.imageType = option.imageType || ['.jpg', '.jpeg', '.png', '.arw']
      this.videoType = option.videoType || ['.mp4', '.3gp', '.mov']

      await this.readSourceDir(option.sourceDir)
      this.sendWebContents('updateProgress', {
        total: this.fileList.length + this.otherFileList.length,
        handle: 0
      })
      await this.getShootTime()
      await this.operateFiles()
      await this.operateOtherFiles()
      this.sendWebContents('sendLog', {
        state: 200,
        message: '处理完成'
      })
    } catch (error) {
      this.sendWebContents('sendLog', {
        state: 500,
        message: error.toString()
      })
      console.error(error)
    }
  }

  checkOption(option) {
    if (!option.sourceDir) throw new Error('sourceDir is required')
    if (!option.targetDir) throw new Error('targetDir is required')
    if (path.resolve(option.sourceDir) === path.resolve(option.targetDir))
      throw new Error('源文件夹和目标文件夹不能相同')
  }

  sendWebContents(key, data) {
    parentPort.postMessage({
      api: key,
      data
    })
  }

  async readSourceDir(dir) {
    const files = await fs.readdir(dir)
    for (let index = 0; index < files.length; index++) {
      const file = files[index]
      const filePath = path.join(dir, file)
      const stat = await fs.stat(filePath)
      if (stat.isDirectory()) {
        await this.readSourceDir(filePath)
      } else {
        const ext = path.parse(file).ext
        if (this.imageType.concat(this.videoType).includes(ext.toLowerCase())) {
          let rename = file
          if (!this.isOverwrite) {
            rename = this.getRename(file, this.fileList)
          }
          this.fileList.push({
            name: file,
            path: filePath,
            ext,
            rename
          })
        } else {
          let rename = file
          if (!this.isOverwrite) {
            rename = this.getRename(file, this.otherFileList)
          }
          this.otherFileList.push({
            name: file,
            path: filePath,
            ext,
            rename
          })
        }

        this.sendWebContents('sendLog', {
          state: 201,
          message: `发现文件 ${filePath}`
        })
      }
    }
  }

  async getShootTime() {
    let noTimeFile = new Map()
    for (let index = 0; index < this.fileList.length; index++) {
      const file = this.fileList[index]
      if (this.imageType.includes(file.ext.toLowerCase())) {
        try {
          const imgInfo = await pify(Exif.ExifImage)({
            image: file.path
          })
          const createDate = imgInfo.exif.CreateDate ?? imgInfo.image.ModifyDate
          if (createDate) {
            const createDateArr = createDate.split(' ')
            const ymr = createDateArr[0].replace(/:/g, '-')
            file.time = new Date(ymr + ' ' + createDateArr[1])
          }
        } catch (error) {}

        if (!file.time) {
          const info = await fs.stat(file.path)
          const ctime = info.ctime ?? info.mtime
          if (ctime) {
            file.time = new Date(ctime)
          }
        }
      }

      if (this.videoType.includes(file.ext.toLowerCase())) {
        const info = await fs.stat(file.path)
        const ctime = info.ctime ?? info.mtime
        if (ctime) {
          file.time = new Date(ctime)
        }
      }

      if (!file.time) {
        noTimeFile.set(index, file)
      }
    }

    Array.from(noTimeFile.keys()).forEach((index) => {
      this.fileList[index] = null
      this.otherFileList.push(noTimeFile.get(index))
    })

    this.fileList = this.fileList.filter((file) => file != null)
  }

  async operateFiles() {
    for (let index = 0; index < this.fileList.length; index++) {
      const file = this.fileList[index]
      let targetPath = path.join(this.targetDir)
      this.dirStruct.forEach((dir) => {
        const month = file.time.getMonth() + 1
        const monthString = month > 9 ? month : '0' + month

        if (dir == 'YYYY') {
          targetPath = path.join(targetPath, file.time.getFullYear() + '')
        }
        if (dir == 'MM') {
          targetPath = path.join(targetPath, monthString + '')
        }
        if (dir == 'YYYY-MM') {
          targetPath = path.join(targetPath, file.time.getFullYear() + '-' + monthString)
        }
      })

      await fs.ensureDir(targetPath)
      targetPath = path.join(targetPath, file.rename)

      if (this.handleType == 'move') {
        console.log(`move ${file.path} --> ${targetPath}`)
        await fs.copy(file.path, targetPath)
        await fs.remove(file.path)
        this.sendWebContents('sendLog', {
          state: 201,
          message: `移动 ${file.path} --> ${targetPath}`
        })
      } else {
        console.log(`copy ${file.path} --> ${targetPath}`)
        await fs.copy(file.path, targetPath)
        this.sendWebContents('sendLog', {
          state: 201,
          message: `复制 ${file.path} --> ${targetPath}`
        })
      }
      this.operatedFileList.push(file)
      this.sendWebContents('updateProgress', {
        total: this.fileList.length + this.otherFileList.length,
        handle: this.operatedFileList.length
      })
    }
  }

  async operateOtherFiles() {
    for (let index = 0; index < this.otherFileList.length; index++) {
      const file = this.otherFileList[index]

      await fs.ensureDir(this.otherDir)

      const targetPath = path.join(this.otherDir, file.rename)

      if (this.handleType == 'move') {
        console.log(`move ${file.path} --> ${targetPath}`)
        await fs.copy(file.path, targetPath)
        await fs.remove(file.path)
        this.sendWebContents('sendLog', {
          state: 201,
          message: `移动 ${file.path} --> ${targetPath}`
        })
      } else {
        console.log(`copy ${file.path} --> ${targetPath}`)
        await fs.copy(file.path, targetPath)
        this.sendWebContents('sendLog', {
          state: 201,
          message: `复制 ${file.path} --> ${targetPath}`
        })
      }
      this.operatedFileList.push(file)

      this.sendWebContents('updateProgress', {
        total: this.fileList.length + this.otherFileList.length,
        handle: this.operatedFileList.length
      })
    }
  }

  getRename(fileName, files) {
    const baseName = path.parse(fileName).name
    const ext = path.parse(fileName).ext
    let maxNum = 0
    for (const item of files) {
      const itemName = path.parse(item.rename).name
      if (itemName === baseName) {
        maxNum = Math.max(maxNum, 1)
      }
      const match = itemName.match(new RegExp(`^${baseName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\((\\d+)\\)$`))
      if (match) {
        maxNum = Math.max(maxNum, parseInt(match[1]) + 1)
      }
    }
    return maxNum > 0 ? `${baseName}(${maxNum})${ext}` : fileName
  }
}

const photoHelper = new PhotoHelper()

parentPort.on('message', (message) => {
  console.log('work接收到信息：', message)
  switch (message.api) {
    case 'start':
      photoHelper.run(message.data).finally(() => {
        parentPort.postMessage({ api: 'start:end' })
      })
      break
    default:
  }
})
