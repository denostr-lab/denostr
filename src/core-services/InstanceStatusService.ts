import { ServiceClass } from './index.ts'

export class InstanceStatusService extends ServiceClass {
    protected name = 'instances'

    constructor() {
        super()

        this.onEvent('watch.instanceStatus', (event) => {
          const { clientAction, data } = event
          if (clientAction === 'inserted') {
            console.log(
              '[services] InstanceStatus onEvent(watch.instanceStatus)',
              data,
            )
          }
        })
    }

    async started(): Promise<void> {
        console.log('[services] InstanceStatus started.')
    }
}
