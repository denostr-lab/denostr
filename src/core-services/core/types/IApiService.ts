import type { EventSignatures } from '../Events.ts'
import type { IBroker } from './IBroker.ts'
import type { IServiceClass } from './ServiceClass.ts'

export interface IApiService {
    setBroker(broker: IBroker): void

    destroyService(instance: IServiceClass): void

    registerService(instance: IServiceClass): void

    broadcast<T extends keyof EventSignatures>(
        event: T,
        ...args: Parameters<EventSignatures[T]>
    ): Promise<void>

    broadcastLocal<T extends keyof EventSignatures>(
        event: T,
        ...args: Parameters<EventSignatures[T]>
    ): Promise<void>

    start(): Promise<void>
}
