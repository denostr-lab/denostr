import { expect } from 'chai'
import Sinon from 'sinon'

import { AppWorker } from '../../../src/app/worker.ts'
import { getMasterDbClient, getReadReplicaDbClient} from '../../../src/database/client.ts'
import { workerFactory } from '../../../src/factories/worker-factory.ts'
import { SettingsStatic } from '../../../src/utils/settings.ts'

Deno.test({name: 'workerFactory', fn: async(t) => {
    const createSettingsStub :Sinon.SinonStub = Sinon.stub(SettingsStatic, 'createSettings')
    const getMasterDbClientStub: Sinon.SinonStub = Sinon.stub(
        { getMasterDbClient },
        'getMasterDbClient',
    )
    const getReadReplicaDbClientStub: Sinon.SinonStub = Sinon.stub(
        { getReadReplicaDbClient },
        'getReadReplicaDbClient',
    )




    await t.step('returns an AppWorker', () => {
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
    getReadReplicaDbClientStub.restore()
    getMasterDbClientStub.restore()
    createSettingsStub.restore()
}, sanitizeResources: false, sanitizeOps: false})
