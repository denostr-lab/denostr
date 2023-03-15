import { Application, Request } from "oak";
import { propEq } from "ramda";

import {
  IWebSocketAdapter,
  IWebSocketServerAdapter,
} from "../@types/adapters.ts";
import { Factory } from "../@types/base.ts";
import { Event } from "../@types/event.ts";
// import { getRemoteAddress } from '../utils/http.ts'
// import { isRateLimited } from '../handlers/request-handlers/rate-limiter-middleware.ts'
import { Settings } from "../@types/settings.ts";
import {
  WebSocketAdapterEvent,
  WebSocketServerAdapterEvent,
} from "../constants/adapter.ts";
import { createLogger } from "../factories/logger-factory.ts";
import { WebServerAdapter } from "./web-server-adapter.ts";

const debug = createLogger("web-socket-server-adapter");

export class WebSocketServerAdapter extends WebServerAdapter
  implements IWebSocketServerAdapter {
  private webSocketsAdapters: Map<WebSocket, IWebSocketAdapter>;
  public constructor(
    webServer: Application,
    private readonly createWebSocketAdapter: Factory<
      IWebSocketAdapter,
      [WebSocket, Request, IWebSocketServerAdapter]
    >,
    private readonly settings: () => Settings,
  ) {
    debug("created");
    super(webServer);

    this.webSocketsAdapters = new Map();

    this.on(WebSocketServerAdapterEvent.Broadcast, this.onBroadcast.bind(this));
    this.initMiddleWare();
    // this.webSocketServer
    //   .on(WebSocketServerAdapterEvent.Connection, this.onConnection.bind(this))
    //   .on('error', (error: any) => {
    //     debug('error: %o', error)
    //   })
    // this.heartbeatInterval = setInterval(this.onHeartbeat.bind(this), WSS_CLIENT_HEALTH_PROBE_INTERVAL)
  }

  public initMiddleWare() {
    this.webServer.use(async (ctx, next) => {
      if (ctx.isUpgradable) {
        const webSocket = ctx.upgrade();
        const req = ctx.request;
        webSocket.onopen = () => {
          this.webSocketsAdapters.set(
            webSocket,
            this.createWebSocketAdapter([webSocket, req, this]),
          );
        };
      } else {
        await next();
      }
    });
  }
  public close(/*callback?: () => void*/): void {
    super.close(() => {
      debug("closing");
      // clearInterval(this.heartbeatInterval)

      this.webSocketsAdapters.forEach(
        (webSocketAdapter: IWebSocketAdapter, webSocket: WebSocket) => {
          if (webSocketAdapter) {
            debug(
              "terminating client %s: %s",
              webSocketAdapter.getClientId(),
              webSocketAdapter.getClientAddress(),
            );
          }
          webSocket.close();
        },
      );
      debug("closing web socket server");
      // this.webSocketServer.close(() => {
      //   this.webSocketServer.removeAllListeners()
      //   if (typeof callback !== 'undefined') {
      //     callback()
      //   }
      //   debug('closed')
      // })
    });
    this.removeAllListeners();
  }

  private onBroadcast(event: Event) {
    this.webSocketsAdapters.forEach(
      (webSocketAdapter: IWebSocketAdapter, webSocket: WebSocket) => {
        if (!propEq("readyState", WebSocket.OPEN)(webSocket)) {
          return;
        }
        if (!webSocketAdapter) {
          return;
        }
        webSocketAdapter.emit(WebSocketAdapterEvent.Event, event);
      },
    );
  }
  public removeClient = (client: WebSocket) => {
    this.webSocketsAdapters.delete(client);
  };
  public getConnectedClients(): number {
    return Array.from(this.webSocketsAdapters).filter(
      propEq("readyState", WebSocket.OPEN),
    ).length;
  }

  // private async onConnection(client: WebSocket, req: Request) {
  //   try {
  //     const currentSettings = this.settings()
  //     const remoteAddress = getRemoteAddress(req, currentSettings)
  //     // const remoteAddress = '192.168.0.126'
  //     debug('client %s connected: %o', remoteAddress, req.headers)

  //     if (await isRateLimited(remoteAddress, currentSettings)) {
  //       debug('client %s terminated: rate-limited', remoteAddress)
  //       client.close()
  //       return
  //     }

  //     this.webSocketsAdapters.set(client, this.createWebSocketAdapter([client, req, this]))
  //   } catch (e) {
  //     console.info('链接错误的', e)
  //   }

  // }

  // private onHeartbeat() {
  //   this.webSocketsAdapters.forEach((webSocket) => {
  //     const webSocketAdapter = this.webSocketsAdapters.get(webSocket) as IWebSocketAdapter
  //     if (webSocketAdapter) {
  //       webSocketAdapter.emit(WebSocketAdapterEvent.Heartbeat)
  //     }
  //   })
  // }
}
