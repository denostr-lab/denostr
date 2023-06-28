import EventEmitter from 'events'

import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import { afterAll, afterEach, beforeAll, beforeEach, describe, it } from 'jest'
import { helpers, IController, Request, Response, RouterContext, Status } from '@/@types/controllers.ts'
import Sinon, { SinonFakeTimers, SinonSpy, SinonStub } from 'sinon'
import sinonChai from 'sinon-chai'
import { Application, Router } from 'oak'

chai.use(sinonChai)
chai.use(chaiAsPromised)

import Config from '../../../src/config/index.ts'

import { InvoicesController } from '../../../src/controllers/api/invoices-controller.ts'
// import { IWebSocketAdapter } from '../../../src/@types/adapters.ts'
// import { Event } from '../../../src/@types/event.ts'
// import { IncomingEventMessage, MessageType } from '../../../src/@types/messages.ts'
// import { IUserRepository } from '../../../src/@types/repositories.ts'
// import { EventLimits, Settings } from '../../../src/@types/settings.ts'
// import { WebSocketAdapterEvent } from '../../../src/constants/adapter.ts'
// import { EventKinds } from '../../../src/constants/base.ts'
// import { EventMessageHandler } from '../../../src/handlers/event-message-handler.ts'

const { expect } = chai

describe('http invoice test', () => {
    // let handler: InvoicesController
    let app: Application
    let req: Request = {}
    let res: Response
    let ctx: RouterContext = {}
    let spy: SinonSpy
    let stub: SinonStub
    const masterInvoicesModel = {
        paginate: async () => null,
    }

    beforeEach(() => {
        app = new Application()
        spy = Sinon.spy()
    })
    afterEach(() => {
    })
    describe('invoices list should be correct data', async () => {
        const fake = Sinon.replace(masterInvoicesModel, 'paginate', Sinon.fake.resolves({ docs: [] }))
        masterInvoicesModel.paginate = fake
        const contro = new InvoicesController(masterInvoicesModel)
        ctx.request = {
            url: new URL('http://localhost:8008'),
        }
        ctx.response = new Response('')
        // ctx.response?.body
        await contro.handleRequest(ctx.request, ctx.response, ctx)

        expect(ctx.response.body).to.be.an('object')
        expect(ctx.response.body).to.deep.equal({ docs: [] })
    })
})
