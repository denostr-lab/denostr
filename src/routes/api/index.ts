import { Router } from 'oak'

import metrics from '@/routes/api/metrics.ts'
import events from '@/routes/api/events.ts'
import invoices from '@/routes/api/invoices.ts'

const router = new Router()

router.use('/metrics', metrics.routes(), metrics.allowedMethods())

router.use('/events', events.routes(), events.allowedMethods())

router.use('/invoices', invoices.routes(), invoices.allowedMethods())
export default router
