import { readFileSync } from "node:fs";

import {
  NextFunction,
  Response,
  RouterContext,
  Status,
} from "../../@types/controllers.ts";
import { createSettings as settings } from "../../factories/settings-factory.ts";

let pageCache: string;

export const getTermsRequestHandler = async (
  ctx: RouterContext,
  next: NextFunction,
) => {
  const { info: { name } } = settings();
  const res: Response = ctx.response;
  if (!pageCache) {
    pageCache = readFileSync("./resources/terms.html", "utf8").replaceAll(
      "{{name}}",
      name,
    );
  }
  res.status = Status.OK;
  res.headers.set("content-type", "text/html; charset=utf8");
  res.body = pageCache;
  await next();
};
