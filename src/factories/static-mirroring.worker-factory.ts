import { StaticMirroringWorker } from '../app/static-mirroring-worker.ts'
import { createSettings } from './settings-factory.ts'

export const staticMirroringWorkerFactory = () => {
  return new StaticMirroringWorker(createSettings)
}
