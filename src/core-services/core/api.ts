// deno-lint-ignore-file ban-ts-comment
/* eslint-disable @typescript-eslint/ban-ts-comment */
import type { EventSignatures } from './Events.ts'
import type { IApiService } from './types/IApiService.ts'
import type { IBroker } from './types/IBroker.ts'
import type { IServiceClass } from './types/ServiceClass.ts'

export class Api implements IApiService {
    #services: Set<IServiceClass> = new Set<IServiceClass>()

    // @ts-ignore
    #broker: IBroker

    setBroker(broker: IBroker): void {
        this.#broker = broker

        this.#services.forEach((service) => this.#broker?.createService(service))
    }

    destroyService(instance: IServiceClass): void {
        if (!this.#services.has(instance)) {
            return
        }

        if (this.#broker) {
            this.#broker.destroyService(instance)
        }

        this.#services.delete(instance)
    }

    registerService(
        instance: IServiceClass,
        serviceDependencies?: string[],
    ): void {
        this.#services.add(instance)

        instance.setApi(this)

        if (this.#broker) {
            this.#broker.createService(instance, serviceDependencies)
        }
    }

    async broadcast<T extends keyof EventSignatures>(
        event: T | string | number | symbol,
        ...args: Parameters<EventSignatures[T]>
    ): Promise<void> {
        return this.#broker?.broadcast(event, ...args)
    }

    async broadcastLocal<T extends keyof EventSignatures>(
        event: T | string | number | symbol,
        ...args: Parameters<EventSignatures[T]>
    ): Promise<void> {
        return this.#broker?.broadcastLocal(event, ...args)
    }

    async start(): Promise<void> {
        if (!this.#broker) {
            throw new Error('No broker set to start.')
        }
        await this.#broker.start()
    }
}

// Singleton instance of the Service API
export const api = new Api()
