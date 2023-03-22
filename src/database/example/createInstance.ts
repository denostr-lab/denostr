// no-explicit-any
import { faker } from 'npm:@faker-js/faker'
import mongoose from 'npm:mongoose'

import { InstanceStatusModel } from '../models/InstanceStatus.ts'

const sleep = (ms = 1000) => new Promise((resolve) => setTimeout(resolve, ms))

async function createInstance() {
    const mongoUri = Deno.env.get('MONGO_URI') as string
    await mongoose.connect(mongoUri, {
        keepAlive: true,
    })
    console.log('Connected to database')

    await sleep(10 * 1000)

    faker.locale = 'zh_CN'

    const InstanceStatus = new InstanceStatusModel()
    const instance = {
        _id: faker.database.mongodbObjectId(),
        name: faker.internet.userName(),
        pid: faker.datatype.number({ min: 1, max: 65535 }),
        extraInformation: {
            host: faker.internet.ipv4(),
            port: faker.internet.port(),
            os: {
                vendor: Deno.build.vendor,
                platform: Deno.build.os,
                arch: Deno.build.arch,
                uptime: Deno.osUptime(),
                loadavg: Deno.loadavg(),
                totalmem: Deno.systemMemoryInfo().total,
                freemem: Deno.systemMemoryInfo().free,
                cpus: navigator.hardwareConcurrency,
                usageMemory: Deno.memoryUsage(),
            },
            denoVersion: Deno.version.deno,
        },
    }
    InstanceStatus.set(instance)
    InstanceStatus._createdAt = new Date()
    InstanceStatus._updatedAt = new Date()
    const model = await InstanceStatus.save()
    console.log('doc -----', model)

    await sleep(5 * 1000)
    model.set('name', 'hello')
    const _updateData = await InstanceStatus.save()
    console.log('updateData -----', _updateData)

    await sleep(10 * 1000)
    const _removeData = await InstanceStatus.deleteOne()
    console.log('removeData -----', _removeData)

    await mongoose.disconnect()
}

createInstance()
