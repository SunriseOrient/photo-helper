import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import packageInfo from '../../package.json'

const api = {
  start: (option) => ipcRenderer.invoke('start', option),
  selectDir: () => ipcRenderer.invoke('select-dir'),
  listenLog(cb) {
    ipcRenderer.on('sendLog', (event, args) => {
      cb && cb(args)
    })
  },
  listenProgress(cb) {
    ipcRenderer.on('updateProgress', (event, args) => {
      cb && cb(args)
    })
  },
  packageInfo: packageInfo
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  window.electron = electronAPI
  window.api = api
}
