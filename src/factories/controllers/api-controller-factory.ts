import { EventsController } from '@/controllers/api/events-controller.ts'
import { IController } from '@/@types/controllers.ts'

export const createEventsController = (): IController => {
    return new EventsController()
}
