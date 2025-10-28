/**
 * 禁止同步函数抛出异常
 */
export function catchError(func, errorMessage) {
  return (...args) => {
    try {
      return func(...args)
    } catch (error) {
      console.error(...[errorMessage, error].filter((v) => v))
    }
  }
}
