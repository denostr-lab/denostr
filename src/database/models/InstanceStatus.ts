import mongoose from 'npm:mongoose'

import { getMasterDbClient } from '../client.ts'

export interface InstanceStatusInput {
    name: string
    pid: number
    extraInformation: {
        host: string
        port: string | number
        tcpPort?: number
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

export interface InstanceStatusDocument extends InstanceStatusInput, mongoose.Document {
    _createdAt: Date
    _updatedAt: Date
}

const InstanceStatusSchema = new mongoose.Schema({
    _id: String,
    name: String,
    pid: Number,
    extraInformation: {
        host: {
            type: String,
            required: true,
            default: '127.0.0.1',
        },
        port: {
            type: mongoose.Schema.Types.Mixed,
            required: true,
            default: '8008',
        },
        tcpPort: Number,
        os: {
            vendor: String,
            platform: String,
            arch: String,
            uptime: Number,
            loadavg: Array,
            totalmem: Number,
            freemem: Number,
            cpus: Number,
            usageMemory: {
                rss: Number,
                heapTotal: Number,
                heapUsed: Number,
                external: Number,
            },
        },
        denoVersion: String,
    },
})

InstanceStatusSchema.index({ 'extraInformation.tcpPort': 1 }, {
    background: true,
})

export const InstanceStatusModel = getMasterDbClient().model<InstanceStatusDocument>(
    'InstanceStatus',
    InstanceStatusSchema,
    'instances',
)
