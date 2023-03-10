import cluster from 'node:cluster'
import process from 'node:process'

import { App } from '../app/app.ts'
import { SettingsStatic } from '../utils/settings.ts'

export const appFactory = () => {
  return new App(process, cluster, SettingsStatic.createSettings)
}
