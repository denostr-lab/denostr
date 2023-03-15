import {
  NextFunction,
  Request,
  Response,
  RouterContext,
} from "../../@types/controllers.ts";
import { createGetInvoiceStatusController } from "../../factories/get-invoice-status-controller-factory.ts";

export const getInvoiceStatusRequestHandler = async (
  ctx: RouterContext,
  next: NextFunction,
) => {
  const req: Request = ctx.request;
  const res: Response = ctx.response;
  const controller = createGetInvoiceStatusController();
  await controller.handleRequest(req, res, ctx);
  await next();
};
