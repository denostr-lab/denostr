import { AxiosInstance } from "axios";

import { Factory } from "../@types/base.ts";
import { Pubkey } from "../@types/base.ts";
import {
  CreateInvoiceRequest,
  CreateInvoiceResponse,
  GetInvoiceResponse,
  IPaymentsProcessor,
} from "../@types/clients.ts";
import { Invoice, InvoiceStatus, InvoiceUnit } from "../@types/invoice.ts";
import { Settings } from "../@types/settings.ts";
import { createLogger } from "../factories/logger-factory.ts";
import { deriveFromSecret, hmacSha256 } from "../utils/secret.ts";

const debug = createLogger("lnbits-payments-processor");

export class LNbitsInvoice implements Invoice {
  id: string;
  pubkey: Pubkey;
  bolt11: string;
  amountRequested: bigint;
  amountPaid?: bigint;
  unit: InvoiceUnit;
  status: InvoiceStatus;
  description: string;
  confirmedAt?: Date | null;
  expiresAt: Date | null;
  updatedAt: Date;
  createdAt: Date;
}

export class LNbitsCreateInvoiceResponse implements CreateInvoiceResponse {
  id: string;
  pubkey: string;
  bolt11: string;
  amountRequested: bigint;
  description: string;
  unit: InvoiceUnit;
  status: InvoiceStatus;
  expiresAt: Date | null;
  confirmedAt?: Date | null;
  createdAt: Date;
  rawResponse?: string;
}

export class LNbitsPaymentsProcesor implements IPaymentsProcessor {
  public constructor(
    private httpClient: AxiosInstance,
    private settings: Factory<Settings>,
  ) {}

  public async getInvoice(invoiceId: string): Promise<GetInvoiceResponse> {
    debug("get invoice: %s", invoiceId);
    try {
      const response = await fetch(`/api/v1/payments/${invoiceId}`);
      const data = await response.json();
      const invoice = new LNbitsInvoice();
      invoice.id = data.details.payment_hash;
      invoice.pubkey = data.details.extra.internalId;
      invoice.bolt11 = data.details.bolt11;
      invoice.amountRequested = BigInt(Math.floor(data.details.amount / 1000));
      if (data.paid) {
        invoice.amountPaid = BigInt(Math.floor(data.details.amount / 1000));
      }
      invoice.unit = InvoiceUnit.SATS;
      invoice.status = data.paid
        ? InvoiceStatus.COMPLETED
        : InvoiceStatus.PENDING;
      invoice.description = data.details.memo;
      invoice.confirmedAt = data.paid
        ? new Date(data.details.time * 1000)
        : null;
      invoice.expiresAt = new Date(data.details.expiry * 1000);
      invoice.createdAt = new Date(data.details.time * 1000);
      invoice.updatedAt = new Date();
      return invoice;
    } catch (error) {
      console.error(`Unable to get invoice ${invoiceId}. Reason:`, error);

      throw error;
    }
  }

  public async createInvoice(
    request: CreateInvoiceRequest,
  ): Promise<CreateInvoiceResponse> {
    debug("create invoice: %o", request);
    const {
      amount: amountMsats,
      description,
      requestId: internalId,
    } = request;

    const callbackURL = new URL(
      this.settings().paymentsProcessors?.lnbits?.callbackBaseURL as string,
    );
    const hmacExpiry = (Date.now() + (1 * 24 * 60 * 60 * 1000)).toString();
    callbackURL.searchParams.set(
      "hmac",
      hmacExpiry + ":" +
        hmacSha256(deriveFromSecret("lnbits-callback-hmac-key"), hmacExpiry)
          .toString("hex"),
    );

    const body = {
      amount: Number(amountMsats / 1000n),
      memo: description,
      extra: {
        internalId,
      },
      out: false,
      webhook: callbackURL.toString(),
    };

    try {
      debug("request body: %o", body);
      const response = await fetch("/api/v1/payments", {
        method: "POST", // *GET, POST, PUT, DELETE, etc.
        mode: "cors", // no-cors, *cors, same-origin
        cache: "no-cache", // *default, no-cache, reload, force-cache, only-if-cached
        credentials: "same-origin", // include, *same-origin, omit
        headers: {
          "Content-Type": "application/json",
          // 'Content-Type': 'application/x-www-form-urlencoded',
        },
        redirect: "follow", // manual, *follow, error
        referrerPolicy: "no-referrer", // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
        body: JSON.stringify(body), // body data type must match "Content-Type" header
      });
      const responseData = await response.json();

      // debug('response: %o', response.data)
      const invoiceResponse = await fetch(
        `/api/v1/payments/${encodeURIComponent(responseData.payment_hash)}`,
      );

      const invoice = new LNbitsCreateInvoiceResponse();
      const data = await invoiceResponse.json();
      debug("invoice data response: %o", data);

      invoice.id = data.details.payment_hash;
      invoice.pubkey = data.details.extra.internalId;
      invoice.bolt11 = data.details.bolt11;
      invoice.amountRequested = BigInt(Math.floor(data.details.amount / 1000));
      invoice.unit = InvoiceUnit.SATS;
      invoice.status = data.paid
        ? InvoiceStatus.COMPLETED
        : InvoiceStatus.PENDING;
      invoice.description = data.details.memo;
      invoice.confirmedAt = null;
      invoice.expiresAt = new Date(data.details.expiry * 1000);
      invoice.createdAt = new Date(data.details.time * 1000);
      invoice.rawResponse = JSON.stringify({
        invoiceResponse: invoiceResponse,
        createData: responseData,
      });

      return invoice;
    } catch (error) {
      console.error("Unable to request invoice. Reason:", error.message);

      throw error;
    }
  }
}
