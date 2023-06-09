import { Request } from 'oak'
import { Buffer } from 'Buffer'
import { expect } from 'chai'
import { afterEach, beforeEach, describe, it } from 'jest'
import Sinon from 'sinon'

import { IWebSocketServerAdapter } from '../../../src/@types/adapters.ts'
import { IEventRepository, IUserRepository } from '../../../src/@types/repositories.ts'
import { WebSocketAdapter } from '../../../src/adapters/web-socket-adapter.ts'
import { webSocketAdapterFactory } from '../../../src/factories/websocket-adapter-factory.ts'
import { SettingsStatic } from '../../../src/utils/settings.ts'

describe('webSocketAdapterFactory', () => {
    let onStub: Sinon.SinonStub
    let createSettingsStub: Sinon.SinonStub

    beforeEach(() => {
        onStub = Sinon.stub()
        createSettingsStub = Sinon.stub(SettingsStatic, 'createSettings')
    })

    afterEach(() => {
        createSettingsStub.restore()
        onStub.reset()
    })

    it('returns a WebSocketAdapter', () => {
        createSettingsStub.returns({
            network: {
                remoteIpHeader: 'remoteIpHeader',
            },
        })
        const eventRepository: IEventRepository = {} as any
        const userRepository: IUserRepository = {} as any

        const client: WebSocket = {
            on: onStub,
        } as any
        onStub.returns(client)
        const headers: Map<string, string> = new Map([
            ['sec-websocket-key', Buffer.from('key', 'utf8').toString('base64')],
        ])
        const request: Request = {
            headers,
            ip: '192.168.0.1',
            socket: {
                remoteAddress: '::1',
            },
        } as any
        const webSocketServerAdapter: IWebSocketServerAdapter = {} as any

        expect(
            webSocketAdapterFactory(eventRepository, userRepository)([
                client,
                request,
                webSocketServerAdapter,
            ]),
        ).to.be.an.instanceOf(WebSocketAdapter)
    })
})
