import { EventsController } from '@/controllers/api/events-controller.ts'
import { InvoicesController } from '@/controllers/api/invoices-controller.ts'
import { masterInvoicesModel } from '@/database/models/Invoices.ts'
import { IController } from '@/@types/controllers.ts'
import { MetricsAmountController } from '@/controllers/api/metrics-amount-controller.ts'
import { MetricsEventsController } from '@/controllers/api/metrics-events-controller.ts'
import { MetricsEventsMonthlyController, MetricsEventsYearlyController } from '@/controllers/api/metrics-events-monyear-controller.ts'
import { readReplicaInvoicesModel } from '@/database/models/Invoices.ts'
import { readReplicaEventsModel } from '@/database/models/Events.ts'

export const createEventsController = (): IController => {
    return new EventsController()
}

export const createInvoicesController = (): IController => {
    return new InvoicesController(masterInvoicesModel)
}

export const createMetricsAmountController = (): IController => {
    return new MetricsAmountController(readReplicaInvoicesModel)
}

export const createMetricsEventsController = (): IController => {
    return new MetricsEventsController(readReplicaEventsModel)
}
export const createMetricsEventsMonthlyController = (): IController => {
    return new MetricsEventsMonthlyController(readReplicaEventsModel)
}

export const createMetricsEventsYearlyController = (): IController => {
    return new MetricsEventsYearlyController(readReplicaEventsModel)
}
