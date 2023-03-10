import { Cluster, Worker } from 'cluster'
import { cpus, hostname } from 'node:os'
import { path, pathEq } from 'ramda'
import { FSWatcher } from 'node:fs'

import { addOnion } from '../tor/client.ts'
import { createLogger } from '../factories/logger-factory.ts'
import { IRunnable } from '../@types/base.ts'
import packageJson from '../../package.json' assert { type: 'json' }
import { Serializable } from 'node:child_process'
import { Settings } from '../@types/settings.ts'
import { SettingsStatic } from '../utils/settings.ts'

import {
  readableStreamFromReader,
  writableStreamFromWriter,
} from 'https://deno.land/std@0.171.0/streams/conversion.ts'
import { mergeReadableStreams } from 'https://deno.land/std@0.171.0/streams/merge.ts'

const debug = createLogger('app-primary')

export class App implements IRunnable {
  private workers: WeakMap<Worker, Record<string, string>>
  private watchers: FSWatcher[] | undefined

  public constructor(
    private readonly process: NodeJS.Process,
    private readonly cluster: Cluster,
    private readonly settings: () => Settings,
  ) {
    debug('starting')
    this.workers = new WeakMap()

    // this.cluster
    //   .on('message', this.onClusterMessage.bind(this))
    //   .on('exit', this.onClusterExit.bind(this))

    // this.process
    //   .on('SIGTERM', this.onExit.bind(this))

    debug('started')
  }

  public async run(): Promise<void> {
    const settings = this.settings()
    this.watchers = SettingsStatic.watchSettings()
    console.log(`
 ███▄    █  ▒█████    ██████ ▄▄▄█████▓ ██▀███  ▓█████ ▄▄▄       ███▄ ▄███▓
 ██ ▀█   █ ▒██▒  ██▒▒██    ▒ ▓  ██▒ ▓▒▓██ ▒ ██▒▓█   ▀▒████▄    ▓██▒▀█▀ ██▒
▓██  ▀█ ██▒▒██░  ██▒░ ▓██▄   ▒ ▓██░ ▒░▓██ ░▄█ ▒▒███  ▒██  ▀█▄  ▓██    ▓██░
▓██▒  ▐▌██▒▒██   ██░  ▒   ██▒░ ▓██▓ ░ ▒██▀▀█▄  ▒▓█  ▄░██▄▄▄▄██ ▒██    ▒██
▒██░   ▓██░░ ████▓▒░▒██████▒▒  ▒██▒ ░ ░██▓ ▒██▒░▒████▒▓█   ▓██▒▒██▒   ░██▒
░ ▒░   ▒ ▒ ░ ▒░▒░▒░ ▒ ▒▓▒ ▒ ░  ▒ ░░   ░ ▒▓ ░▒▓░░░ ▒░ ░▒▒   ▓▒█░░ ▒░   ░  ░
░ ░░   ░ ▒░  ░ ▒ ▒░ ░ ░▒  ░ ░    ░      ░▒ ░ ▒░ ░ ░  ░ ▒   ▒▒ ░░  ░      ░
   ░   ░ ░ ░ ░ ░ ▒  ░  ░  ░    ░        ░░   ░    ░    ░   ▒   ░      ░
         ░     ░ ░        ░              ░        ░  ░     ░  ░       ░`)
    const width = 74
    const torHiddenServicePort = process.env.HIDDEN_SERVICE_PORT ? Number(process.env.HIDDEN_SERVICE_PORT) : 80
    const port = process.env.RELAY_PORT ? Number(process.env.RELAY_PORT) : 8008

    const logCentered = (input: string, width: number) => {
      const start = (width - input.length) >> 1
      console.log(' '.repeat(start), input)
    }
    logCentered(`v${packageJson.version}`, width)
    logCentered(`NIPs implemented: ${packageJson.supportedNips}`, width)
    const paymentsEnabled = pathEq(['payments', 'enabled'], true, settings)
    logCentered(`Pay-to-relay ${paymentsEnabled ? 'enabled' : 'disabled'}`, width)
    if (paymentsEnabled) {
      logCentered(`Payments provider: ${path(['payments', 'processor'], settings)}`, width)
    }
    const file = await Deno.open('./process_output.txt', {
      read: true,
      write: true,
      create: true,
    })
    const fileWriter = await writableStreamFromWriter(file)
    if (paymentsEnabled && (typeof this.process.env.SECRET !== 'string' || this.process.env.SECRET === '' || this.process.env.SECRET === 'changeme')) {
      console.error('Please configure the secret using the SECRET environment variable.')
      this.process.exit(1)
    }

    let workerCount = process.env.WORKER_COUNT
      ? Number(process.env.WORKER_COUNT)
      : this.settings().workers?.count || cpus().length
      workerCount = 1
    const createWorker = (env: Record<string, string>) => {
      // const worker = this.cluster.fork(env)
      console.info('喀什跑再说', env)
      const p = Deno.run({
        cmd: [
          'npm',
          'run',
          'deno_dev',

        ],
        env,
        stdout: 'piped',
        stderr: 'piped',
      })
      // example of combining stdout and stderr while sending to a file
const stdout = readableStreamFromReader(p.stdout)
const stderr = readableStreamFromReader(p.stderr)
const joined = mergeReadableStreams(stdout, stderr)
// returns a promise that resolves when the process is killed/closed
joined.pipeTo(fileWriter).then((e) => console.log('pipe join done', e))
      console.info('喀什跑再说', p)

      this.workers.set(p, env)
    }

    for (let i = 0; i < workerCount; i++) {
      debug('starting worker')
      createWorker({
        WORKER_TYPE: 'worker',
      })
    }
    logCentered(`${workerCount} client workers started`, width)

    // createWorker({
    //   WORKER_TYPE: 'maintenance',
    // })

    logCentered('1 maintenance worker started', width)
    const mirrors = settings?.mirroring?.static

    // if (Array.isArray(mirrors) && mirrors.length) {
    //   for (let i = 0; i < mirrors.length; i++) {
    //     createWorker({
    //       WORKER_TYPE: 'static-mirroring',
    //       MIRROR_INDEX: i.toString(),
    //     })
    //   }
    //   logCentered(`${mirrors.length} static-mirroring worker started`, width)
    // }

    debug('settings: %O', settings)

    const host = `${hostname()}:${port}`
    addOnion(torHiddenServicePort, host).then(value=>{
      logCentered(`Tor hidden service: ${value}:${torHiddenServicePort}`, width)
    }, () => {
      logCentered('Tor hidden service: disabled', width)
    })
  }

  private onClusterMessage(source: Worker, message: Serializable) {
    debug('message received from worker %s: %o', source.process.pid, message)
    for (const worker of Object.values(this.cluster.workers as any) as Worker[]) {
      if (source.id === worker.id) {
        continue
      }

      debug('sending message to worker %s: %o', worker.process.pid, message)
      worker.send(message)
    }
  }

  private onClusterExit(deadWorker: Worker, code: number, signal: string)  {
    debug('worker %s died', deadWorker.process.pid)

    if (code === 0 || signal === 'SIGINT') {
      return
    }
    setTimeout(() => {
      debug('starting worker')
      const workerEnv = this.workers.get(deadWorker)
      if (!workerEnv) {
        throw new Error('Mistakes were made')
      }
      const newWorker = this.cluster.fork(workerEnv)
      this.workers.set(newWorker, workerEnv)

      debug('started worker %s', newWorker.process.pid)
    }, 10000)
  }

  private onExit() {
    console.log('exiting')
    this.close(() => {
      this.process.exit(0)
    })
  }

  public close(callback?: (...args: any[]) => void): void {
    console.log('close')
    if (Array.isArray(this.watchers)) {
      for (const watcher of this.watchers) {
        watcher.close()
      }
    }
    if (typeof callback === 'function') {
      callback()
    }
  }
}