import { expect } from 'chai'
import { afterEach,beforeEach, describe, it } from 'jest'
import Sinon from 'sinon'

import { AppWorker } from '../../../src/app/worker.ts'
import * as databaseClientModule from '../../../src/database/client.ts'
import { workerFactory } from '../../../src/factories/worker-factory.ts'
import { SettingsStatic } from '../../../src/utils/settings.ts'


describe('workerFactory', () => {
  let createSettingsStub: Sinon.SinonStub
  let getMasterDbClientStub: Sinon.SinonStub
  let getReadReplicaDbClientStub: Sinon.SinonStub

  beforeEach(() => {
    createSettingsStub = Sinon.stub(SettingsStatic, 'createSettings')
    getMasterDbClientStub = Sinon.stub(databaseClientModule, 'getMasterDbClient')
    getReadReplicaDbClientStub = Sinon.stub(databaseClientModule, 'getReadReplicaDbClient')
  })

  afterEach(() => {
    getReadReplicaDbClientStub.restore()
    getMasterDbClientStub.restore()
    createSettingsStub.restore()
  })

  it('returns an AppWorker', () => {
    createSettingsStub.returns({
      info: {
        relay_url: 'url',
      },
      network: {

      },
    })

    const worker = workerFactory()
    expect(worker).to.be.an.instanceOf(AppWorker)
    worker.close()
  })
})
