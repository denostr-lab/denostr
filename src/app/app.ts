// import { Cluster, Worker } from 'cluster'
// import { cpus, hostname } from 'os'
// import { path, pathEq } from 'ramda'
// import { FSWatcher } from 'fs'
// import Config from '../config/index.ts'

// import { addOnion } from '../tor/client'
// import { createLogger } from '../factories/logger-factory'
// import { IRunnable } from '../@types/base'
// import packageJson from '../../package.json'
// import { Serializable } from 'child_process'
// import { Settings } from '../@types/settings'
// import { SettingsStatic } from '../utils/settings'

// const debug = createLogger('app-primary')

// export class App implements IRunnable {
//   private workers: WeakMap<Worker, Record<string, string>>
//   private watchers: FSWatcher[] | undefined

//   public constructor(
//     private readonly process: NodeJS.Process,
//     private readonly cluster: Cluster,
//     private readonly settings: () => Settings,
//   ) {
//     debug('starting')

//     this.workers = new WeakMap()

//     this.cluster
//       .on('message', this.onClusterMessage.bind(this))
//       .on('exit', this.onClusterExit.bind(this))

//     this.process
//       .on('SIGTERM', this.onExit.bind(this))

//     debug('started')
//   }

//   public run(): void {

//     const torHiddenServicePort = Config.HIDDEN_SERVICE_PORT ? Number(Config.HIDDEN_SERVICE_PORT) : 80
//     const port = Config.RELAY_PORT ? Number(Config.RELAY_PORT) : 8008

//     const logCentered = (input: string, width: number) => {
//       const start = (width - input.length) >> 1
//       console.log(' '.repeat(start), input)
//     }
//     logCentered(`v${packageJson.version}`, width)
//     logCentered(`NIPs implemented: ${packageJson.supportedNips}`, width)
//     const paymentsEnabled = pathEq(['payments', 'enabled'], true, settings)
//     logCentered(`Pay-to-relay ${paymentsEnabled ? 'enabled' : 'disabled'}`, width)
//     if (paymentsEnabled) {
//       logCentered(`Payments provider: ${path(['payments', 'processor'], settings)}`, width)
//     }

//     if (paymentsEnabled && (typeof this.Config.SECRET !== 'string' ||
//this.Config.SECRET === '' || this.Config.SECRET === 'changeme')) {
//       console.error('Please configure the secret using the SECRET environment variable.')
//       this.process.exit(1)
//     }

//     const workerCount = Config.WORKER_COUNT
//       ? Number(Config.WORKER_COUNT)
//       : this.settings().workers?.count || cpus().length

//     const createWorker = (env: Record<string, string>) => {
//       const worker = this.cluster.fork(env)
//       this.workers.set(worker, env)
//     }

//     for (let i = 0; i < workerCount; i++) {
//       debug('starting worker')
//       createWorker({
//         WORKER_TYPE: 'worker',
//       })
//     }
//     logCentered(`${workerCount} client workers started`, width)

//     createWorker({
//       WORKER_TYPE: 'maintenance',
//     })

//     logCentered('1 maintenance worker started', width)
//     const mirrors = settings?.mirroring?.static

//     if (Array.isArray(mirrors) && mirrors.length) {
//       for (let i = 0; i < mirrors.length; i++) {
//         createWorker({
//           WORKER_TYPE: 'static-mirroring',
//           MIRROR_INDEX: i.toString(),
//         })
//       }
//       logCentered(`${mirrors.length} static-mirroring worker started`, width)
//     }

//     debug('settings: %O', settings)

//     const host = `${hostname()}:${port}`
//     addOnion(torHiddenServicePort, host).then(value=>{
//       logCentered(`Tor hidden service: ${value}:${torHiddenServicePort}`, width)
//     }, () => {
//       logCentered('Tor hidden service: disabled', width)
//     })
//   }

//   private onClusterMessage(source: Worker, message: Serializable) {
//     debug('message received from worker %s: %o', source.process.pid, message)
//     for (const worker of Object.values(this.cluster.workers as any) as Worker[]) {
//       if (source.id === worker.id) {
//         continue
//       }

//       debug('sending message to worker %s: %o', worker.process.pid, message)
//       worker.send(message)
//     }
//   }

// }
