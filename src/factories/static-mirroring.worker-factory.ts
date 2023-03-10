import { createSettings } from './settings-factory.ts'
import { StaticMirroringWorker } from '../app/static-mirroring-worker.ts'

export const staticMirroringWorkerFactory = () => {
  return new StaticMirroringWorker(process, createSettings)
}
