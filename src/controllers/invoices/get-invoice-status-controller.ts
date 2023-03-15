import {
  IController,
  Request,
  Response,
  RouterContext,
  Status,
} from "../../@types/controllers.ts";
import { IInvoiceRepository } from "../../@types/repositories.ts";
import { createLogger } from "../../factories/logger-factory.ts";

const debug = createLogger("get-invoice-status-controller");

export class GetInvoiceStatusController implements IController {
  public constructor(
    private readonly invoiceRepository: IInvoiceRepository,
  ) {}

  public async handleRequest(
    _request: Request,
    response: Response,
    ctx: RouterContext,
  ): Promise<void> {
    const params = ctx.params;
    const invoiceId = params.invoiceId;
    if (typeof invoiceId !== "string" || !invoiceId) {
      debug("invalid invoice id: %s", invoiceId);
      response.headers.set("content-type", "application/json");
      response.status = Status.BadRequest;
      response.body = { id: invoiceId, status: "invalid invoice" };
      return;
    }

    try {
      debug("fetching invoice: %s", invoiceId);
      const invoice = await this.invoiceRepository.findById(invoiceId);

      if (!invoice) {
        ctx.send;
        debug("invoice not found: %s", invoiceId);
        response.headers.set("content-type", "application/json");
        response.status = Status.NotFound;
        response.body = { id: invoiceId, status: "not found" };
        return;
      }
      response.headers.set("content-type", "application/json");
      response.status = Status.OK;
      response.body = { id: invoiceId, status: invoice.status };
    } catch (error) {
      console.error(
        `get-invoice-status-controller: unable to get invoice ${invoiceId}:`,
        error,
      );
      response.headers.set("content-type", "application/json");
      response.status = Status.InternalServerError;
      response.body = { id: invoiceId, status: "error" };
    }
  }
}
