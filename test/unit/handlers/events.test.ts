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

import { MetricsEventsController } from '@/controllers/api/metrics-events-controller.ts'
import { MetricsAmountController } from '@/controllers/api/metrics-amount-controller.ts'
import { AmountRow } from '@/@types/api.ts'
import { MetricsEventsMonthlyController, MetricsEventsYearlyController } from '@/controllers/api/metrics-events-monyear-controller.ts'
import { DBEvent } from '@/@types/event.ts'

const { expect } = chai

describe('http event test', () => {
    // let handler: InvoicesController
    let app: Application
    let req: Request = {}
    let res: Response
    let ctx: RouterContext = {}
    let spy: SinonSpy
    let stub: SinonStub
    const readReplicaEventsModel = {
        find: async () => null,
    }

    beforeEach(() => {
        app = new Application()
        spy = Sinon.spy()
    })
    afterEach(() => {
    })
    describe('event list should be correct data', async () => {
        const dbEvents: DBEvent[] = []
        const fake = Sinon.replace(readReplicaEventsModel, 'find', Sinon.fake.resolves(dbEvents))
        readReplicaEventsModel.events = fake
        const contro = new MetricsEventsController(readReplicaEventsModel)
        ctx.request = {
            url: new URL('http://localhost:8008'),
        }
        ctx.response = new Response('')
        // ctx.response?.body
        await contro.handleRequest(ctx.request, ctx.response, ctx)
        expect(ctx.response.body).to.be.an('object')
        expect(ctx.response.body).to.deep.equal({ status: 'ok', utc: {}, uniquePubkeys: 0, uniquePubkeys24Hours: 0, kinds: {}, eventCount: 0, eventCount24Hours: 0, events: [] })
    })

    describe('metrics amount should be correct data', async () => {
        let app: Application
        let req: Request = {}
        let res: Response
        let ctx: RouterContext = {}
        let spy: SinonSpy
        const readReplicaInvoicesModel = {
            aggregate: async () => null,
        }
        const dbEvents: DBEvent[] = []
        const fake = Sinon.replace(readReplicaInvoicesModel, 'aggregate', Sinon.fake.resolves(dbEvents))
        // readReplicaInvoicesModel.amountArr = fake
        const contro = new MetricsAmountController(readReplicaInvoicesModel)
        ctx.request = {
            url: new URL('http://localhost:8008'),
        }
        ctx.response = new Response('/metrics/amount')
        // ctx.response?.body
        await contro.handleRequest(ctx.request, ctx.response, ctx)
        expect(ctx.response.body).to.be.an('object')
        console.log('ff-------', ctx.response.body)
        expect(ctx.response.body).to.deep.equal({ status: 'ok', total: 0 })
    })

    describe('event monthly should be correct data', async () => {
        let app: Application
        let req: Request = {}
        let res: Response
        let ctx: RouterContext = {}
        let spy: SinonSpy
        let stub: SinonStub
        const readReplicaEventsModel = {
            find: async () => null,
        }
        const dbEvents: DBEvent[] = []
        const fake = Sinon.replace(readReplicaEventsModel, 'find', Sinon.fake.resolves(dbEvents))
        readReplicaEventsModel.events = fake
        const contro = new MetricsEventsMonthlyController(readReplicaEventsModel)
        ctx.request = {
            url: new URL('http://localhost:8008'),
        }
        ctx.response = new Response('/metrics/events/monthly')
        // ctx.response?.body
        await contro.handleRequest(ctx.request, ctx.response, ctx)
        expect(ctx.response.body).to.be.an('object')
        expect(ctx.response.body).to.deep.equal({ status: 'ok', body: {} })
    })

    describe('event yearly should be correct data', async () => {
        let app: Application
        let req: Request = {}
        let res: Response
        let ctx: RouterContext = {}
        let spy: SinonSpy
        let stub: SinonStub
        const readReplicaEventsModel = {
            find: async () => null,
        }
        const dbEvents: DBEvent[] = []
        const fake = Sinon.replace(readReplicaEventsModel, 'find', Sinon.fake.resolves(dbEvents))
        readReplicaEventsModel.events = fake
        const contro = new MetricsEventsYearlyController(readReplicaEventsModel)
        ctx.request = {
            url: new URL('http://localhost:8008'),
        }
        ctx.response = new Response('/metrics/events/yearly')
        // ctx.response?.body
        await contro.handleRequest(ctx.request, ctx.response, ctx)
        expect(ctx.response.body).to.be.an('object')
        expect(ctx.response.body).to.deep.equal({ status: 'ok', body: {} })
    })
})
