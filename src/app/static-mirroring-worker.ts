import { anyPass, map, path } from 'ramda'
import { RawData, WebSocket } from 'ws'
import cluster from 'node:cluster'
import { randomUUID } from 'node:crypto'

import { createRelayedEventMessage, createSubscriptionMessage } from '../utils/messages.ts'
import { isEventIdValid, isEventMatchingFilter, isEventSignatureValid } from '../utils/event.ts'
import { Mirror, Settings } from '../@types/settings.ts'
import { createLogger } from '../factories/logger-factory.ts'
import { IRunnable } from '../@types/base.ts'
import { OutgoingEventMessage } from '../@types/messages.ts'
import { RelayedEvent } from '../@types/event.ts'
import { WebSocketServerAdapterEvent } from '../constants/adapter.ts'

const debug = createLogger('static-mirror-worker')

export class StaticMirroringWorker implements IRunnable {
  private client: WebSocket | undefined
  private config: Mirror

  public constructor(
    private readonly settings: () => Settings,
  ) {
    const currentSettings = this.settings()
    console.log('mirroring', currentSettings.mirroring)
    this.config = path(['mirroring', 'static', process.env.MIRROR_INDEX], currentSettings) as Mirror

  }

  public run(): void {
    let since = Math.floor(Date.now() / 1000) - 60*10

    const createMirror = (config: Mirror) => {
      const subscriptionId = `mirror-${randomUUID()}`

      debug('connecting to %s', config.address)

      return new WebSocket(config.address, { timeout: 5000 })
        .on('open', function () {
          debug('connected to %s', config.address)

          if (Array.isArray(config.filters) && config.filters?.length) {
            const filters = config.filters.map((filter) => ({ ...filter, since }))

            debug('subscribing with %s: %o', subscriptionId, filters)

            this.send(JSON.stringify(createSubscriptionMessage(subscriptionId, filters)))
          }
        })
        .on('message', async function (raw: RawData) {
          try {
            const message = JSON.parse(raw.toString('utf8')) as OutgoingEventMessage

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

            if (!await isEventIdValid(event) || !await isEventSignatureValid(event)) {
              return
            }

            since = Math.floor(Date.now() / 1000) - 30

            if (cluster.isWorker && typeof process.send === 'function') {
              debug('%s >> local: %s', config.address, event.id)
              process.send({
                eventName: WebSocketServerAdapterEvent.Broadcast,
                event,
                source: config.address,
              })
            }
          } catch (error) {
            debug('unable to process message: %o', error)
          }
        })
        .on('close', (code, reason) => {
          debug(`disconnected (${code}): ${reason.toString()}`)

          setTimeout(() => {
            this.client.removeAllListeners()
            this.client = createMirror(config)
          }, 5000)
        })
        .on('error', function (error) {
          debug('connection error: %o', error)
        })
    }

    this.client = createMirror(this.config)
  }

  private onMessage(message: { eventName: string, event: unknown, source: string }): void {
    // 必须是广播时间,
    // 消息的源头 不能是自己
    // 如果客户端还没有创建,如果客户端还没有连接
    if (
      message.eventName !== WebSocketServerAdapterEvent.Broadcast
      || message.source === this.config?.address
      || !this.client
      || this.client.readyState !== WebSocket.OPEN
    ) {
      return
    }

    const event = message.event as RelayedEvent

    const eventToRelay = createRelayedEventMessage(event, this.config?.secret)
    const outboundMessage = JSON.stringify(eventToRelay)
    debug('%s >> %s: %s', message.source ?? 'local', this.config?.address, outboundMessage)
    this.client.send(outboundMessage)
  }

  public close(callback?: () => void) {
    debug('closing')
    if (this.client) {
      this.client.terminate()
    }
    if (typeof callback === 'function') {
      callback()
    }
  }
}
