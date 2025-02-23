/*
 * @Author: mikey.zhaopeng
 * @Date: 2023-09-29 00:27:37
 * @Last Modified by: Sun Rising
 * @Last Modified time: 2023-10-25 10:02:04
 * 相片视频管理工具
 */
const fs = require('fs-extra')
const pify = require('pify')
const path = require('path')
const Exif = require('exif')

class PhotoHelper {
  win

  // 源文件夹
  sourceDir = ''
  // 目标文件夹
  targetDir = ''
  // 其他未符合分类规则的存放文件夹
  otherDir = path.join(this.targetDir, 'TEMP')
  // 处理的文件类型
  imageType = ['.jpg', '.jpeg', '.png', '.arw']
  videoType = ['.mp4', '.3gp']
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
  // 已经移动的文件集合 适用于handleType=move , 先copy再删除
  movedFileList = []

  async run(win, option) {
    try {
      this.checkOption(option)

      this.fileList = []
      this.otherFileList = []

      this.win = win
      this.sourceDir = option.sourceDir
      this.targetDir = option.targetDir
      this.otherDir = path.join(this.targetDir, 'TEMP')
      this.handleType = option.handleType || 'move'
      this.dirStruct = option.dirStruct || ['YYYY-MM']
      this.isOverwrite = option.isOverwrite || true
      this.imageType = option.imageType || ['.jpg', '.jpeg', '.png', '.arw']
      this.videoType = option.videoType || ['.mp4', '.3gp']

      await this.readSourceDir(option.sourceDir)
      await this.getShootTime()
      await this.operateFiles()
      await this.operateOtherFiles()
      if (this.handleType == 'move') {
        await this.operateMovedFileList()
      }
      win.webContents.send('sendLog', {
        state: 200,
        message: '处理完成'
      })
    } catch (error) {
      win.webContents.send('sendLog', {
        state: 500,
        message: error.toString()
      })
      console.error(error)
    }
  }

  checkOption(option) {
    if (!option.sourceDir) throw new Error('sourceDir is required')
    if (!option.targetDir) throw new Error('targetDir is required')
  }

  // 创建函数遍历源文件夹下的所有文件支持子文件夹，把文件名插入到files中
  async readSourceDir(dir) {
    const files = await pify(fs.readdir)(dir)
    for (let index = 0; index < files.length; index++) {
      const file = files[index]
      const filePath = dir + '/' + file
      if (fs.statSync(filePath).isDirectory()) {
        await this.readSourceDir(filePath)
      } else {
        const ext = path.parse(file).ext
        if (this.imageType.concat(this.videoType).includes(ext.toLowerCase())) {
          let rename = file
          if (!this.isOverwrite) {
            rename = getRename(file, this.fileList)
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
            rename = getRename(file, this.otherFileList)
          }
          this.otherFileList.push({
            name: file,
            path: filePath,
            ext,
            rename
          })
        }

        this.win.webContents.send('sendLog', {
          state: 201,
          message: `发现文件 ${filePath}`
        })
      }
    }
  }
  // 获取拍摄时间
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
          const info = fs.statSync(file.path)
          const ctime = info.ctime ?? info.mtime
          if (ctime) {
            file.time = new Date(ctime)
          }
        }
      }

      if (this.videoType.includes(file.ext.toLowerCase())) {
        const info = fs.statSync(file.path)
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

      if (!fs.existsSync(targetPath)) {
        fs.mkdirSync(targetPath, { recursive: true })
      }

      targetPath = path.join(targetPath, file.rename)

      if (this.handleType == 'copy') {
        console.log(`copy ${file.path} --> ${targetPath}`)
        fs.copyFileSync(file.path, targetPath)
        this.win.webContents.send('sendLog', {
          state: 201,
          message: `复制 ${file.path} --> ${targetPath}`
        })
      }

      if (this.handleType == 'move') {
        console.log(`move ${file.path} --> ${targetPath}`)
        fs.copyFileSync(file.path, targetPath)
        this.movedFileList.push(file)
        this.win.webContents.send('sendLog', {
          state: 201,
          message: `移动 ${file.path} --> ${targetPath}`
        })
      }
    }
  }

  async operateOtherFiles() {
    for (let index = 0; index < this.otherFileList.length; index++) {
      const file = this.otherFileList[index]

      if (!fs.existsSync(otherDir)) {
        fs.mkdirSync(otherDir, { recursive: true })
      }

      const targetPath = path.join(otherDir, file.name)

      if (this.handleType == 'copy') {
        console.log(`copy ${file.path} --> ${targetPath}`)
        fs.copyFileSync(file.path, targetPath)
        this.win.webContents.send('sendLog', {
          state: 201,
          message: `复制 ${file.path} --> ${targetPath}`
        })
      }

      if (this.handleType == 'move') {
        console.log(`move ${file.path} --> ${targetPath}`)
        fs.copyFileSync(file.path, targetPath)
        this.movedFileList.push(file)
        this.win.webContents.send('sendLog', {
          state: 201,
          message: `移动 ${file.path} --> ${targetPath}`
        })
      }
    }
  }

  operateMovedFileList() {
    for (let index = 0; index < this.movedFileList.length; index++) {
      const file = this.movedFileList[index]
      fs.removeSync(file.path)
      this.win.webContents.send('sendLog', {
        state: 201,
        message: `清理文件 ${file.path}`
      })
    }
  }

  getRename(fileName, files) {
    const file = files.reverse().find((item) => item.rename.includes(path.parse(fileName).name))
    if (!file) return fileName

    const regex = /\((\d+)\)/ // 匹配括号内的数字
    const match = regex.exec(file.rename)
    if (match && match[1]) {
      const number = match[1]
      return file.rename.replace(regex, `(${parseInt(number) + 1})`)
    } else {
      const fileInfo = path.parse(file.rename)
      return `${fileInfo.name}(1)${fileInfo.ext}`
    }
  }
}

export const photoHelper = new PhotoHelper()
