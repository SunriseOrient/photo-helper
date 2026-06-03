import { Worker } from 'worker_threads'
import photoHelperTools from '../../../resources/photo-helper-tools.js?asset'
import { BrowserWindow, dialog, ipcMain } from 'electron'

let worker = null
let win
let pendingReject = null

function createWorker() {
  const w = new Worker(photoHelperTools)
  worker = w
  w.on('message', (result) => {
    console.log('work连接器收到信息：', result)
    switch (result.api) {
      case 'sendLog':
        win && win.webContents.send(result.api, result.data)
        break
      case 'updateProgress':
        win && win.webContents.send(result.api, result.data)
        break
      default:
    }
  })
  w.on('error', (error) => {
    console.error('Worker 异常：', error)
    win && win.webContents.send('sendLog', {
      state: 500,
      message: `Worker 异常退出：${error.message}`
    })
    w.terminate()
    if (worker === w) worker = null
    if (pendingReject) {
      pendingReject(error)
      pendingReject = null
    }
  })
  w.on('exit', (code) => {
    if (code !== 0) {
      console.error(`Worker 非正常退出，退出码：${code}`)
    }
    if (worker === w) worker = null
    if (pendingReject) {
      pendingReject(new Error(`Worker 已退出，退出码：${code}`))
      pendingReject = null
    }
  })
}

export function initPhotoHelperToolsConnector() {
  ipcMain.handle('start', (event, option) => {
    if (!worker) createWorker()
    console.log(option)
    win = BrowserWindow.fromWebContents(event.sender)
    worker.postMessage({
      api: 'start',
      data: option
    })

    return new Promise((resolve, reject) => {
      const w = worker
      pendingReject = reject
      const handler = (result) => {
        if (result.api == 'start:end') {
          w.off('message', handler)
          pendingReject = null
          resolve()
        }
      }
      w.on('message', handler)
    })
  })

  ipcMain.handle('select-dir', (event) => {
    return new Promise((resolve, reject) => {
      const win = BrowserWindow.fromWebContents(event.sender)
      dialog
        .showOpenDialog(win, {
          title: '选择文件夹',
          properties: ['openDirectory']
        })
        .then((res) => {
          resolve(res)
        })
        .catch((error) => {
          reject(error)
        })
    })
  })
}
