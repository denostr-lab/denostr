import {
  getMasterDbClient,
  getReadReplicaDbClient,
} from "../database/client.ts";
import { EventRepository } from "../repositories/event-repository.ts";
import { InvoiceRepository } from "../repositories/invoice-repository.ts";
import { UserRepository } from "../repositories/user-repository.ts";
import { PaymentsService } from "../services/payments-service.ts";
import { createPaymentsProcessor } from "./payments-processor-factory.ts";
import { createSettings } from "./settings-factory.ts";

export const createPaymentsService = () => {
  const dbClient = getMasterDbClient();
  const rrDbClient = getReadReplicaDbClient();
  const invoiceRepository = new InvoiceRepository(dbClient);
  const userRepository = new UserRepository(dbClient);
  const paymentsProcessor = createPaymentsProcessor();
  const eventRepository = new EventRepository(dbClient, rrDbClient);

  return new PaymentsService(
    dbClient,
    paymentsProcessor,
    userRepository,
    invoiceRepository,
    eventRepository,
    createSettings,
  );
};
