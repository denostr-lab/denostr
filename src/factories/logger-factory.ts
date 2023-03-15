import debug from 'debug'

import Config from '../config/index.ts'

export const createLogger = (
  namespace: string,
  options: { enabled?: boolean; stdout?: boolean } = { enabled: false, stdout: false }
) => {
  const prefix = (Config.WORKER_TYPE || 'primary') as string
  const instance = debug(prefix)
  if (options.enabled) {
    debug.enable(`${prefix}:${namespace}:*`)
  }
  if (options.stdout) {
    instance.log = console.log.bind(console)
  }
  const fn = instance.extend(namespace)

  return fn
}
