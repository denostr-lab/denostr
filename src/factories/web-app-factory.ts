import { Application, etag } from 'oak'
import csp from 'oak-csp'
import router from "@/routes/index.ts"
import { createSettings } from "@/factories/settings-factory.ts"

const getDirectives = () => {
    const settings = createSettings()
    const relayUrl = new URL(settings.info.relay_url)
    const webRelayUrl = new URL(relayUrl.toString())
    webRelayUrl.protocol = (relayUrl.protocol === 'wss:') ? 'https:' : ':'
    const directives = {
        /**
         * TODO: Remove 'unsafe-inline'
         */
        'img-src': ['\'self\'', 'data:', 'https://cdn.zebedee.io/an/nostr/'],
        'connect-src': [
            '\'self\'',
            settings.info.relay_url as string,
            webRelayUrl.toString(),
        ],
        'default-src': ['\'self\''],
        'script-src-attr': ['\'unsafe-inline\''],
        'script-src': [
            '\'self\'',
            '\'unsafe-inline\'',
            'https://cdn.jsdelivr.net/npm/',
            'https://unpkg.com/',
            'https://cdnjs.cloudflare.com/ajax/libs/',
        ],
        'style-src': ['\'self\'', 'https://cdn.jsdelivr.net/npm/'],
        'font-src': ['\'self\'', 'https://cdn.jsdelivr.net/npm/'],
    }

    return directives
}

export const createWebApp = () => {
    const app = new Application()
    app.use(etag.factory())
        .use(router.routes())
        .use(router.allowedMethods())
        .use(csp({ enableWarn: false, policy: getDirectives() }))

    return app
}
