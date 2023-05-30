import { Factory } from '@/@types/base.ts'
import { CreateInvoiceRequest, CreateInvoiceResponse, GetInvoiceResponse, IPaymentsProcessor } from '@/@types/clients.ts'
import { createLogger } from '@/factories/logger-factory.ts'
import { fromOpenNodeInvoice } from '@/utils/transform.ts'
import { Settings } from '@/@types/settings.ts'
import { HTTPClient } from '@/utils/http.ts'

const debug = createLogger('opennode-payments-processor')

export class OpenNodePaymentsProcesor implements IPaymentsProcessor {
    public constructor(
        private httpClient: HTTPClient,
        private settings: Factory<Settings>,
    ) {}

    public async getInvoice(invoiceId: string): Promise<GetInvoiceResponse> {
        debug('get invoice: %s', invoiceId)

        try {
            const response = await this.httpClient.get(`/v2/charge/${invoiceId}`)

            return fromOpenNodeInvoice(response.data.data)
        } catch (error) {
            console.error(`Unable to get invoice ${invoiceId}. Reason:`, error)

            throw error
        }
    }

    public async createInvoice(request: CreateInvoiceRequest): Promise<CreateInvoiceResponse> {
        debug('create invoice: %o', request)
        const {
            amount: amountMsats,
            description,
            requestId,
        } = request

        const amountSats = Number(amountMsats / 1000n)

        const body = {
            amount: amountSats,
            description,
            order_id: requestId,
            callback_url: this.settings().paymentsProcessors?.opennode?.callbackBaseURL,
            ttl: 10,
        }

        try {
            debug('request body: %o', body)
            const response = await this.httpClient.post('/v1/charges', body)

            const result = fromOpenNodeInvoice(response.data.data)

            debug('result: %o', result)

            return result
        } catch (error) {
            console.error('Unable to request invoice. Reason:', error.message)

            throw error
        }
    }
}
