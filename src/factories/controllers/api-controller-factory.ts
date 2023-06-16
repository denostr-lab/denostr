import { EventsController } from '@/controllers/api/events-controller.ts'
import { InvoicesController } from '@/controllers/api/invoices-controller.ts'
import { IController } from '@/@types/controllers.ts'

export const createEventsController = (): IController => {
    return new EventsController()
}

export const createInvoicesController = (): IController => {
    return new InvoicesController()
}
