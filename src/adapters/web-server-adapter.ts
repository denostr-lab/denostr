import { EventEmitter } from 'events'

import { Application } from 'oak'

import { IWebServerAdapter } from '../@types/adapters.ts'
import { createLogger } from '../factories/logger-factory.ts'

const debug = createLogger('web-server-adapter')

export class WebServerAdapter extends EventEmitter implements IWebServerAdapter {
    private controller: AbortController | undefined
    public constructor(
        protected readonly webServer: Application,
    ) {
        debug('created')
        super()
    }

    public listen(port: number): void {
        debug('attempt to listen on port %d', port)
        this.controller = new AbortController()
        const { signal } = this.controller
        this.webServer.listen({ port, signal })
        this.webServer.addEventListener('error', ({ error }) => this.onError(error))
    }

    private onError(error: Error) {
        console.error('web-server-adapter: error:', error)
    }

    public close(callback?: () => void): void {
        debug('closing')
        this.controller?.abort?.()
        callback?.()
        this.removeAllListeners()
        debug('closed')
    }

    protected onClose() {
        debug('stopped listening to incoming connections')
    }
}
