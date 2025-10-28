import { electronApp, is, optimizer } from '@electron-toolkit/utils'
import { BrowserWindow, app, shell } from 'electron'
import { join } from 'path'
import icon from '../../resources/icon.png?asset'
import { initPhotoHelperToolsConnector } from './work/photo-helper-tools-connector'
import { enableLog } from './utils/enable-log'

enableLog()

function createWindow() {
  const mainWindow = new BrowserWindow({
    icon,
    width: 844,
    height: 706,
    minHeight: 706,
    minWidth: 500,
    show: false,
    titleBarStyle: 'hidden',
    titleBarOverlay: {
      height: 60,
      symbolColor: '#9CA3AF',
      color: '#fff'
    },
    autoHideMenuBar: true,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.electron')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  createWindow()
  initPhotoHelperToolsConnector()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
