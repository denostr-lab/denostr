import { MaintenanceWorker } from "../app/maintenance-worker.ts";
import { createPaymentsService } from "./payments-service-factory.ts";
import { createSettings } from "./settings-factory.ts";

export const maintenanceWorkerFactory = () => {
  return new MaintenanceWorker(createPaymentsService(), createSettings);
};
