import type { EventSignatures } from '../Events.ts'
import type { IServiceClass } from './ServiceClass.ts'

export interface IBroker {
    destroyService(service: IServiceClass): void
    createService(service: IServiceClass, serviceDependencies?: string[]): void
    broadcast<T extends keyof EventSignatures>(
        event: T | string | number | symbol,
        ...args: Parameters<EventSignatures[T]>
    ): Promise<void>
    broadcastLocal<T extends keyof EventSignatures>(
        event: T | string | number | symbol,
        ...args: Parameters<EventSignatures[T]>
    ): Promise<void>
    start(): Promise<void>
}
