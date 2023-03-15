import { Settings } from '../@types/settings.ts'
import { SettingsStatic } from '../utils/settings.ts'

export const createSettings = (): Settings => SettingsStatic.createSettings()
