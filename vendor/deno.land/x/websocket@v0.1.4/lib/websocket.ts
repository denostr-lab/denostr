import { EventEmitter } from './../deps.ts'
import { Application } from 'oak'


import { WebSocketError } from './errors.ts'

export enum WebSocketState {
  CONNECTING = 0,
  OPEN = 1,
  CLOSING = 2,
  CLOSED = 3,
}

export type EventTypesMap = { [key: string]: (...params: any[]) => void };
export type DefaultServerEventTypes = {
  connection: (ws: WebSocketClient, url: string) => void;
  error: (err: Error | unknown) => void; // unknown is an "any" error in catch case - maybe worth wrapping?
};

export class GenericEventEmitter<EventTypes extends EventTypesMap> extends EventEmitter {
  on <K extends keyof EventTypes>(eventType: K, listener: EventTypes[K]): this;
  /** @deprecated unsafe fallback to EventEmitter.on (no typeguards) */
  on (...params: Parameters<EventEmitter['on']>): this;
  on (...params: Parameters<EventEmitter['on']>): this { return super.on(...params) }

  emit <K extends keyof EventTypes>(eventType: K, ...params: Parameters<EventTypes[K]>): boolean;
  /** @deprecated unsafe fallback to EventEmitter.emit (no typeguards) */
  emit (...params: Parameters<EventEmitter['emit']>): boolean;
  emit (...params: Parameters<EventEmitter['emit']>): boolean { return super.emit(...params) }
}

export class WebSocketServer extends GenericEventEmitter<DefaultServerEventTypes> {
  clients: Set<WebSocketAcceptedClient> = new Set<WebSocketAcceptedClient>()
  
  constructor(
    private server: Application,
  ) {
    super()
    this.connect()
  }
  async connect() {
    this.server.use(async(ctx, next)=>{
      const req = ctx.request
      if (ctx.isUpgradable) {
        
        const websocket = ctx.upgrade()
        
        const ws: WebSocketAcceptedClient = new WebSocketAcceptedClient(websocket)
        this.clients.add(ws)
        this.emit('connection', ws, req)
      } else {
        await next()
      }
    })
  }
  async close() {
    this.server?.close()
    this.clients.clear()
  }
}

export type DefaultClientEventTypes<AllowedMessageEventContent> = {
  open: () => void;
  message: (data: AllowedMessageEventContent) => void;
  ping: (data: Uint8Array) => void;
  pong: (data: Uint8Array) => void;
  close: (code?: number | WebSocketError | unknown) => void; // unknown is an "any" error in catch - maybe worth wrapping?
  error: () => void;
};

export interface WebSocketClient extends EventEmitter {
  send(message: string | Uint8Array): void;
  close(code: number, reason?: string): void;
  closeForce(): void;
  isClosed: boolean | undefined;
}

type WebSocketAcceptedClientAllowedMessageEventContent = string | Uint8Array;
type DefaultAcceptedClientEventTypes = DefaultClientEventTypes<WebSocketAcceptedClientAllowedMessageEventContent>;
export class WebSocketAcceptedClient extends GenericEventEmitter<DefaultAcceptedClientEventTypes>
 implements WebSocketClient {
  readyState: number = WebSocket.CONNECTING
  webSocket: WebSocket
  constructor(sock: WebSocket) {
    super()
    this.webSocket = sock
    this.init()
  }
  init() {
    this.webSocket.onopen = () => {
      this.readyState = WebSocket.OPEN
      this.emit('open')
    }
    this.webSocket.onmessage = (message) => {
      this.readyState = WebSocket.OPEN
      this.emit('message', message)
    }
    this.webSocket.onclose = (error) => {
      this.readyState = WebSocket.CLOSED
      this.emit('close', error)
    }
    this.webSocket.onerror = (error) => {
      this.readyState = WebSocket.CLOSED
      this.emit('error', error)
    }
  }

  async send(message: string | Uint8Array) {
    try {
      if (this.readyState === WebSocket.CONNECTING) {
        throw new WebSocketError(
          'WebSocket is not open: state 0 (CONNECTING)',
          )
      }
      return this.webSocket.send(message)
    } catch (error) {
      this.emit('close', error.message)
    }
  }
  close (code = 1000, reason?: string): void {
    if (
      this.readyState === WebSocket.CLOSING ||
      this.readyState === WebSocket.CLOSED
    ) {
      return
    }
    {this.webSocket.close(code, reason)}
  }
  closeForce() {
    if (
      this.readyState === WebSocket.CLOSING ||
      this.readyState === WebSocket.CLOSED
    ) {
      return
    }
    return this.webSocket.close()
  }
  get isClosed(): boolean | undefined {
    return this.webSocket.readyState === WebSocket.CLOSED
  }
}

export class StandardWebSocketClient extends GenericEventEmitter<DefaultClientEventTypes<any>>
  implements WebSocketClient {
  webSocket?: WebSocket
  constructor(private endpoint?: string) {
    super()
    if (this.endpoint !== undefined) {
      this.webSocket = new WebSocket(endpoint!)
      this.webSocket.onopen = () => this.emit('open')
      this.webSocket.onmessage = (message) => this.emit('message', message)
      this.webSocket.onclose = () => this.emit('close')
      this.webSocket.onerror = () => this.emit('error')
    }
  }
  async ping(message?: string | Uint8Array) {
    if (this.webSocket?.readyState === WebSocketState.CONNECTING) {
      throw new WebSocketError(
        'WebSocket is not open: state 0 (CONNECTING)',
        )
    }
    return this.webSocket!.send('ping')
  }
  async send(message: string | Uint8Array) {
    if (this.webSocket?.readyState === WebSocketState.CONNECTING) {
      throw new WebSocketError(
        'WebSocket is not open: state 0 (CONNECTING)',
        )
    }
    return this.webSocket!.send(message)
  }
  async close(code = 1000, reason?: string): Promise<void> {
    if (
      this.webSocket!.readyState === WebSocketState.CLOSING ||
      this.webSocket!.readyState === WebSocketState.CLOSED
    ) {
      return
    }
    return this.webSocket!.close(code, reason!)
  }
  closeForce(): void {
    throw new Error('Method not implemented.')
  }
  get isClosed(): boolean | undefined {
    return this.webSocket.readyState === WebSocketState.CLOSING ||
      this.webSocket.readyState === WebSocketState.CLOSED
  }
}
