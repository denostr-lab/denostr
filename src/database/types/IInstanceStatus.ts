import type { IRecord } from './IRecord.ts'

export interface IInstanceStatus extends IRecord {
    name: string
    pid: number
    extraInformation: {
        host: string
        version: string
        port: string | number
        tcpPort: number
        os: {
            vendor: string
            platform: string
            arch: string
            uptime: number
            loadavg: number[]
            totalmem: number
            freemem: number
            cpus: number
            usageMemory: {
                rss: number
                heapTotal: number
                heapUsed: number
                external: number
            }
        }
        denoVersion: string
    }
}
