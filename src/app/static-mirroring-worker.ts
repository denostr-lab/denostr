import { anyPass, map, path } from 'ramda'

import { IRunnable } from '../@types/base.ts'
import { OutgoingEventMessage } from '../@types/messages.ts'
import { Mirror, Settings } from '../@types/settings.ts'
import Config from '../config/index.ts'
import { createLogger } from '../factories/logger-factory.ts'
import { isEventIdValid, isEventMatchingFilter, isEventSignatureValid } from '../utils/event.ts'
import { createSubscriptionMessage } from '../utils/messages.ts'

const debug = createLogger('static-mirror-worker')

export class StaticMirroringWorker implements IRunnable {
    private client: WebSocket | undefined
    private config: Mirror

    public constructor(
        private readonly settings: () => Settings,
    ) {
        const currentSettings = this.settings()
        console.log('mirroring', currentSettings.mirroring)
        this.config = path(
            ['mirroring', 'static', Config.MIRROR_INDEX],
            currentSettings,
        ) as Mirror
    }

    public run(): void {
        let since = Math.floor(Date.now() / 1000) - 60 * 10

        const createMirror = (config: Mirror) => {
            const subscriptionId = `mirror-${crypto.randomUUID()}`

            debug('connecting to %s', config.address)
            const websocket = new WebSocket(config.address)

            websocket.onopen = function () {
                debug('connected to %s', config.address)

                if (Array.isArray(config.filters) && config.filters?.length) {
                    const filters = config.filters.map((filter) => ({
                        ...filter,
                        since,
                    }))

                    debug('subscribing with %s: %o', subscriptionId, filters)

                    this.send(
                        JSON.stringify(createSubscriptionMessage(subscriptionId, filters)),
                    )
                }
            }
            websocket.onmessage = async function (raw: MessageEvent) {
                try {
                    const message = JSON.parse(
                        raw.data.toString('utf8'),
                    ) as OutgoingEventMessage

                    if (!Array.isArray(message)) {
                        return
                    }

                    if (message[0] !== 'EVENT' || message[1] !== subscriptionId) {
                        debug('%s >> local: %o', config.address, message)
                        return
                    }

                    const event = message[2]

                    if (!anyPass(map(isEventMatchingFilter, config.filters))(event)) {
                        return
                    }

                    if (
                        !await isEventIdValid(event) || !await isEventSignatureValid(event)
                    ) {
                        return
                    }

                    since = Math.floor(Date.now() / 1000) - 30
                    // 应该在这里 createRelayedEventMessage(event) 然后其他的地方监听数据库变化自己
                    // if (cluster.isWorker && typeof process.send === 'function') {
                    //   debug('%s >> local: %s', config.address, event.id)
                    //   process.send({
                    //     eventName: WebSocketServerAdapterEvent.Broadcast,
                    //     event,
                    //     source: config.address,
                    //   })
                    // }
                } catch (error) {
                    debug('unable to process message: %o', error)
                }
            }
            websocket.onclose = (ev: CloseEvent) => {
                debug(`disconnected (${ev.code}): ${ev.reason.toString()}`)

                setTimeout(() => {
                    this.client = createMirror(config)
                }, 5000)
            }
            websocket.onerror = function (error) {
                debug('connection error: %o', error)
            }
            return websocket
        }

        this.client = createMirror(this.config)
    }

    public close(callback?: () => void) {
        debug('closing')
        if (this.client) {
            this.client.close()
        }
        if (typeof callback === 'function') {
            callback()
        }
    }
}
