import { catchError } from '../utils/catch-error'
import { app } from 'electron'
import log from 'electron-log/main'
import { join } from 'path'
import { version } from '../../../package.json'
/**
 * 启动日志收集
 */
export const enableLog = catchError(() => {
  const MaxSize = 1048576 * 3
  const logPath = join(app.getPath('logs'), 'info_all.log')
  console.log(`日志文件路径: ${logPath}`)

  log.transports.file.resolvePathFn = () => logPath
  log.transports.file.format = `[v${version}][{y}-{m}-{d} {h}:{i}:{s}.{ms}]{text}`
  log.transports.file.maxSize = MaxSize

  console.log = (...agrs) => log.log('[info]', ...agrs)
  console.warn = (...agrs) => log.log('[warn]', ...agrs)
  console.error = (...agrs) => log.log('[error]', ...agrs)
})
