import { Request, Response, Status } from "../../@types/controllers.ts";
import { createZebedeeCallbackController } from "../../factories/zebedee-callback-controller-factory.ts";

export const postZebedeeCallbackRequestHandler = async (
  req: Request,
  res: Response,
) => {
  const controller = createZebedeeCallbackController();

  try {
    await controller.handleRequest(req, res);
  } catch (_) {
    res.status = Status.InternalServerError;
    res.headers.set("content-type", "text-plain");
    res.body = "Error handling request";
  }
};
