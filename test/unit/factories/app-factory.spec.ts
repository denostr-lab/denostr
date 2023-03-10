import { expect } from 'chai'

import { App } from '../../../src/app/app.ts'
import { appFactory } from '../../../src/factories/app-factory.ts'

describe('appFactory', () => {
  it('returns an App', () => {
    expect(appFactory()).to.be.an.instanceOf(App)
  })
})
