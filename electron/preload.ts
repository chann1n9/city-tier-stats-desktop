import { ipcRenderer, contextBridge, webUtils } from 'electron'

contextBridge.exposeInMainWorld('ipcRenderer', {
  invoke(...args: Parameters<typeof ipcRenderer.invoke>) {
    const [channel, ...omit] = args
    return ipcRenderer.invoke(channel, ...omit)
  },
})

contextBridge.exposeInMainWorld('fileSystem', {
  getPathForFile(file: File) {
    return webUtils.getPathForFile(file)
  },
})
