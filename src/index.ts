import cluster from 'node:cluster'

import dotenv from 'dotenv'
dotenv.config()

import { appFactory } from './factories/app-factory.ts'
import { maintenanceWorkerFactory } from './factories/maintenance-worker-factory.ts'
import { staticMirroringWorkerFactory } from './factories/static-mirroring.worker-factory.ts'
import { workerFactory } from './factories/worker-factory.ts'

export const getRunner = () => {
  if (cluster.isPrimary) {
    return appFactory()
  } else {
    switch (process.env.WORKER_TYPE) {
      case 'worker':
        return workerFactory()
      case 'maintenance':
        return maintenanceWorkerFactory()
      case 'static-mirroring':
        return staticMirroringWorkerFactory()
      default:
        throw new Error(`Unknown worker: ${process.env.WORKER_TYPE}`)
    }
  }
}

// if (require.main === module) {
//   getRunner().run()
// }
