import { FSWatcher } from 'node:fs'

import { IWebSocketServerAdapter } from '../@types/adapters.ts'
import { IRunnable } from '../@types/base.ts'
import Config from '../config/index.ts'
import { createLogger } from '../factories/logger-factory.ts'
import { SettingsStatic } from '../utils/settings.ts'
import { getMasterDbClient } from '../database/client.ts'

const debug = createLogger('app-worker')
export class AppWorker implements IRunnable {
    private watchers: FSWatcher[] | undefined

    public constructor(
        private readonly adapter: IWebSocketServerAdapter,
    ) {
    }

    public run(): void {
        this.watchers = SettingsStatic.watchSettings()

        const port = Config.PORT || Config.RELAY_PORT || 8008
        this.adapter.listen(typeof port === 'number' ? port : Number(port))
    }

    public close(callback?: () => void) {
        debug('closing')
        if (Array.isArray(this.watchers)) {
            for (const watcher of this.watchers) {
                watcher.close()
            }
        }
        const dbClient = getMasterDbClient()
        dbClient.destroy()
        this.adapter.close(callback)
        debug('closed')
    }
}
