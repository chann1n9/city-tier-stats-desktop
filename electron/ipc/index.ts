import { registerAppIpc } from './appIpc'
import { registerFilesIpc } from './filesIpc'
import { registerRulesIpc } from './rulesIpc'
import { registerRunsIpc } from './runsIpc'

export function registerIpcHandlers() {
  registerAppIpc()
  registerFilesIpc()
  registerRulesIpc()
  registerRunsIpc()
}
