import { EventEmitter } from 'node:events'
import { Duplex } from 'node:stream'

import { Application } from 'oak'

import { IWebServerAdapter } from '../@types/adapters.ts'
import { createLogger } from '../factories/logger-factory.ts'

const debug = createLogger('web-server-adapter')

export class WebServerAdapter extends EventEmitter implements IWebServerAdapter {
  public constructor(
    protected readonly webServer: Application,
  ) {
    debug('created')
    super()
    // this.webServer
    //   .on('error', this.onError.bind(this))
    //   .on('clientError', this.onClientError.bind(this))
    //   .once('close', this.onClose.bind(this))
    //   .once('listening', this.onListening.bind(this))
  }

  public listen(port: number): void {
    console.info('开始监听', port)
    debug('attempt to listen on port %d', port)
    this.webServer.listen({ port })
  }

  private onListening() {
    debug('olistening for incoming connections')
    debug('listening for incoming connections')
  }

  private onError(error: Error) {
    console.error('web-server-adapter: error:', error)
  }

  private onClientError(error: Error, socket: Duplex) {
    debug('onClientError',error, socket)

    console.error('web-server-adapter: client socket error:', error)
    if (error['code'] === 'ECONNRESET' || !socket.writable) {
      return
    }
    socket.end('HTTP/1.1 400 Bad Request\r\nContent-Type: text/html\r\n')
  }

  public close(callback?: () => void): void {
    debug('closing')
    debug('主动关闭')

    this.webServer.close(() => {
      this.webServer.removeAllListeners()
      this.removeAllListeners()
      if (typeof callback !== 'undefined') {
        callback()
      }
    })
    debug('closed')
  }

  protected onClose(e) {
    debug('stopped listening to incoming connections', e)

    debug('stopped listening to incoming connections')
  }
}
