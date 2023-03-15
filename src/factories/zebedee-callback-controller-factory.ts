import { IController } from "../@types/controllers.ts";
import { ZebedeeCallbackController } from "../controllers/callbacks/zebedee-callback-controller.ts";
import { createPaymentsService } from "./payments-service-factory.ts";

export const createZebedeeCallbackController = (): IController => {
  return new ZebedeeCallbackController(
    createPaymentsService(),
  );
};
