import Config from './config/index.ts'
import { coreServicesFactory } from './factories/core-services-factory.ts'
import { maintenanceWorkerFactory } from './factories/maintenance-worker-factory.ts'
import { staticMirroringWorkerFactory } from './factories/static-mirroring.worker-factory.ts'
import { workerFactory } from './factories/worker-factory.ts'

export const getRunner = async () => {
    await coreServicesFactory()

    switch (Config.WORKER_TYPE) {
        case 'worker':
            return workerFactory()
        case 'maintenance':
            return maintenanceWorkerFactory()
        case 'static-mirroring':
            return staticMirroringWorkerFactory()
        default:
            return workerFactory()
    }
}
if (import.meta.main) {
    (await getRunner()).run()
}
