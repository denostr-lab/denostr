import { ServerRequest } from "https://deno.land/std@0.92.0/http/server.ts";

import { Settings } from '../@types/settings.ts'

export const getRemoteAddress = (request: ServerRequest, settings: Settings): string => {
  let header: string | undefined
  // TODO: Remove deprecation warning
  if ('network' in settings && 'remote_ip_header' in settings.network) {
    console.warn(`WARNING: Setting network.remote_ip_header is deprecated and will be removed in a future version.
        Use network.remoteIpHeader instead.`)
    header = settings.network['remote_ip_header'] as string
  } else {
    header = settings.network.remoteIpHeader as string
  }

  const result = (request.headers.get(header) ?? (request?.remoteAddr || request?.conn?.remoteAddr?.hostname || request?.conn?.remoteAddr?.path)) as string

  return result.split(',')[0]
}
