import { Router } from 'oak'

import metrics from '@/routes/api/metrics.ts'
import events from '@/routes/api/events.ts'

const router = new Router()

router.use('/metrics', metrics.routes(), metrics.allowedMethods())

router.use('/events', events.routes(), events.allowedMethods())

export default router
