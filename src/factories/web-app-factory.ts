import { Application } from 'koa';

import csp from 'npm:koa-csp@1.2.0';


import { createLogger } from './logger-factory.ts'
import { createSettings } from './settings-factory.ts'
import router from '../routes/index.ts'

const debug = createLogger('web-app-factory')
const settings = createSettings()

const relayUrl = new URL(settings.info.relay_url)
const webRelayUrl = new URL(relayUrl.toString())
webRelayUrl.protocol = (relayUrl.protocol === 'wss:') ? 'https:' : ':'

const directives = {
  /**
   * TODO: Remove 'unsafe-inline'
   */
  'img-src': ["'self'", 'data:', 'https://cdn.zebedee.io/an/nostr/'],
  'connect-src': ["'self'", settings.info.relay_url as string, webRelayUrl.toString()],
  'default-src': ["'self'"],
  'script-src-attr': ["'unsafe-inline'"],
  'script-src': ["'self'", "'unsafe-inline'", 'https://cdn.jsdelivr.net/npm/', 'https://unpkg.com/', 'https://cdnjs.cloudflare.com/ajax/libs/'],
  'style-src': ["'self'", 'https://cdn.jsdelivr.net/npm/'],
  'font-src': ["'self'", 'https://cdn.jsdelivr.net/npm/'],
}
debug('CSP directives: %o', directives)
export const createWebApp = () => {
  const app = new Application()
  app

    .use(csp.default({enableWarn: false, policy: directives}))
    .use(async (context, next) => {
      try {
        await context.send({
          root: `${Deno.cwd()}/resources/favicon.ico`,
          index: "favicon.ico",
        });
      } catch {
        await next();
      }
    })
    .use(async (context, next) => {
      try {
        await context.send({
          root: `${Deno.cwd()}/resources/css`,
        });
      } catch {
        await next();
      }
    })
    app.use(router.routes());
    app.use(router.allowedMethods());

  return app
}