// deno-lint-ignore-file no-explicit-any
import { EventEmitter } from 'events'

import type { EventSignatures } from './Events.ts'
import type { IBroker } from './types/IBroker.ts'
import type { IServiceClass, ServiceClass } from './types/ServiceClass.ts'

export class LocalBroker implements IBroker {
    #methods = new Map<string, (...params: any) => any>()

    #events = new EventEmitter()

    #services = new Set<IServiceClass>()

    destroyService(instance: ServiceClass): void {
        const namespace = instance.getName()

        instance.getEvents().forEach((eventName) => {
            this.#events.removeListener(eventName, instance.emit)
        })

        const methods = instance.constructor?.name === 'Object' ? Object.getOwnPropertyNames(instance) : Object.getOwnPropertyNames(Object.getPrototypeOf(instance))
        for (const method of methods) {
            if (method === 'constructor') {
                continue
            }

            this.#methods.delete(`${namespace}.${method}`)
        }
        instance.stopped()
    }

    createService(instance: IServiceClass): void {
        const namespace = instance.getName()

        this.#services.add(instance)

        instance.created()

        instance.getEvents().forEach((eventName) => {
            this.#events.on(eventName, (...args) => {
                instance.emit(
                    eventName,
                    ...(args as Parameters<EventSignatures[typeof eventName]>),
                )
            })
        })

        const methods = instance.constructor?.name === 'Object' ? Object.getOwnPropertyNames(instance) : Object.getOwnPropertyNames(Object.getPrototypeOf(instance))
        for (const method of methods) {
            if (method === 'constructor') {
                continue
            }
            const i = instance as any

            this.#methods.set(`${namespace}.${method}`, i[method].bind(i))
        }
    }

    onBroadcast(callback: (eventName: string, args: unknown[]) => void): void {
        this.#events.on('broadcast', callback)
    }

    async broadcast<T extends keyof EventSignatures>(
        event: T,
        ...args: Parameters<EventSignatures[T]>
    ): Promise<void> {
        this.broadcastLocal(event, ...args)

        this.#events.emit('broadcast', event, args)
    }

    async broadcastLocal<T extends keyof EventSignatures>(
        event: T,
        ...args: Parameters<EventSignatures[T]>
    ): Promise<void> {
        this.#events.emit(event, ...args)
    }

    async start(): Promise<void> {
        await Promise.all([...this.#services].map((service) => service.started()))
    }
}
