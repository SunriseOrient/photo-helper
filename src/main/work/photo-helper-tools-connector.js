import { Worker } from 'worker_threads'
import photoHelperTools from '../../../resources/photo-helper-tools.js?asset'
import { BrowserWindow, dialog, ipcMain } from 'electron'

const worker = new Worker(photoHelperTools)
worker.on('message', (result) => {
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

let win

export function initPhotoHelperToolsConnector() {
  ipcMain.handle('start', (event, option) => {
    console.log(option)
    win = BrowserWindow.fromWebContents(event.sender)
    worker.postMessage({
      api: 'start',
      data: option
    })

    return new Promise((resolve) => {
      worker.on('message', (result) => result.api == 'start:end' && resolve())
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
