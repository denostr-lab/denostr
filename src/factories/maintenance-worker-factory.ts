import { createPaymentsService } from './payments-service-factory.ts'
import { createSettings } from './settings-factory.ts'
import { MaintenanceWorker } from '../app/maintenance-worker.ts'

export const maintenanceWorkerFactory = () => {
  return new MaintenanceWorker(process, createPaymentsService(), createSettings)
}
