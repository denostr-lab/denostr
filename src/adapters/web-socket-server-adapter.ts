import { Application, Request } from 'oak'
import { propEq } from 'ramda'

import { IWebSocketAdapter, IWebSocketServerAdapter } from '../@types/adapters.ts'
import { Factory } from '../@types/base.ts'
import { Event } from '../@types/event.ts'
import { getRemoteAddress } from '../utils/http.ts'
import { isRateLimited } from '../handlers/request-handlers/rate-limiter-middleware.ts'
import { Settings } from '../@types/settings.ts'
import { WebSocketAdapterEvent, WebSocketServerAdapterEvent } from '../constants/adapter.ts'
import { createLogger } from '../factories/logger-factory.ts'
import { WebServerAdapter } from './web-server-adapter.ts'
import { Context } from '../@types/controllers.ts'

const debug = createLogger('web-socket-server-adapter')

export class WebSocketServerAdapter extends WebServerAdapter implements IWebSocketServerAdapter {
    private webSocketsAdapters: Map<WebSocket, IWebSocketAdapter>
    public constructor(
        webServer: Application,
        private readonly createWebSocketAdapter: Factory<
            IWebSocketAdapter,
            [WebSocket, Request, IWebSocketServerAdapter]
        >,
        private readonly settings: () => Settings,
    ) {
        debug('created')
        super(webServer)

        this.webSocketsAdapters = new Map()

        this.on(WebSocketServerAdapterEvent.Broadcast, this.onBroadcast.bind(this))
        this.initMiddleWare()
    }

    public initMiddleWare() {
        this.webServer.use(async (ctx, next) => {
            if (ctx.isUpgradable) {
                const webSocket = ctx.upgrade()
                webSocket.onopen = () => this.onConnection(ctx, webSocket)
                webSocket.onerror = (error) => {
                    debug('error: %o', error)
                }
            } else {
                await next()
            }
        })
    }
    public close(callback?: () => void): void {
        super.close(() => {
            debug('closing')
            this.webSocketsAdapters.forEach(
                (webSocketAdapter: IWebSocketAdapter, webSocket: WebSocket) => {
                    if (webSocketAdapter) {
                        debug(
                            'terminating client %s: %s',
                            webSocketAdapter.getClientId(),
                            webSocketAdapter.getClientAddress(),
                        )
                    }
                    webSocket.close()
                },
            )
            callback?.()
            debug('closed')
        })
        this.removeAllListeners()
    }

    private onBroadcast(event: Event) {
        this.webSocketsAdapters.forEach(
            (webSocketAdapter: IWebSocketAdapter, webSocket: WebSocket) => {
                if (!propEq('readyState', WebSocket.OPEN)(webSocket)) {
                    return
                }
                if (!webSocketAdapter) {
                    return
                }
                webSocketAdapter.emit(WebSocketAdapterEvent.Event, event)
            },
        )
    }

    public removeClient = (client: WebSocket) => {
        this.webSocketsAdapters.delete(client)
    }

    public getConnectedClients(): number {
        return Array.from(this.webSocketsAdapters).filter(
            propEq('readyState', WebSocket.OPEN),
        ).length
    }

    private async onConnection(ctx: Context, client: WebSocket) {
        const req: Request = ctx.request
        const currentSettings = this.settings()
        const remoteAddress = getRemoteAddress(req, currentSettings)
        debug('client %s connected: %o', remoteAddress, req.headers)

        if (await isRateLimited(remoteAddress, currentSettings)) {
            debug('client %s terminated: rate-limited', remoteAddress)
            client.close()
            return
        }

        this.webSocketsAdapters.set(client, this.createWebSocketAdapter([client, req, this]))
    }
}
