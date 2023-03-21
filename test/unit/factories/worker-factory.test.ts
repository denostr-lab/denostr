import { expect } from 'chai'
import { afterEach, beforeEach, describe, it } from 'jest'
import Sinon from 'sinon'

import { AppWorker } from '../../../src/app/worker.ts'
import { getMasterDbClient, getReadReplicaDbClient} from '../../../src/database/client.ts'
import { workerFactory } from '../../../src/factories/worker-factory.ts'
import { SettingsStatic } from '../../../src/utils/settings.ts'

describe({name: 'workerFactory', fn: () => {
    let createSettingsStub: Sinon.SinonStub
    let getMasterDbClientStub: Sinon.SinonStub
    let getReadReplicaDbClientStub: Sinon.SinonStub

    beforeEach(() => {
        createSettingsStub = Sinon.stub(SettingsStatic, 'createSettings')
        getMasterDbClientStub = Sinon.stub(
            { getMasterDbClient },
            'getMasterDbClient',
        )
        getReadReplicaDbClientStub = Sinon.stub(
            { getReadReplicaDbClient },
            'getReadReplicaDbClient',
        )
    })

    afterEach(() => {
        getReadReplicaDbClientStub.restore()
        getMasterDbClientStub.restore()
        createSettingsStub.restore()
    })

    it('returns an AppWorker', () => {
        createSettingsStub.returns({
            info: {
                relay_url: 'http://localhost:8008',
            },
            network: {},
        })

        const worker = workerFactory()
        expect(worker).to.be.an.instanceOf(AppWorker)
        worker.close()
    })
},sanitizeOps: false, sanitizeResources: false })
