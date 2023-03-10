import { config } from 'dotenv'
config({ export: true})
import { Buffer } from "https://deno.land/std@0.139.0/node/buffer.ts";


import { appFactory } from './factories/app-factory.ts'
import { maintenanceWorkerFactory } from './factories/maintenance-worker-factory.ts'
import { staticMirroringWorkerFactory } from './factories/static-mirroring.worker-factory.ts'
import { workerFactory } from './factories/worker-factory.ts'
declare global {

  interface Window {
    process: {
      cwd: ()=> string,
      env: any
    },
    Buffer: any
  }
}
window.Buffer = Buffer
window.process = {
  cwd: Deno.cwd,
  
  env: new Proxy({}, {
    get: function (_, name: symbol) {
      return Deno.env.get(name.toString())
    },
    set: function (_, name: symbol, value) {
      Deno.env.set(name.toString(), value)
      return value
    },
  }),
}

export const getRunner = () => {
  if (!process.env.WORKER_TYPE) {
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
getRunner().run()
// if (require.main === module) {
//   getRunner().run()
// }
