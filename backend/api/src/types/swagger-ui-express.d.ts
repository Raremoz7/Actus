declare module "swagger-ui-express" {
  import type { RequestHandler } from "express";

  export const serve: RequestHandler[];
  export function setup(...args: any[]): RequestHandler;
  const _default: {
    serve: RequestHandler[];
    setup: (...args: any[]) => RequestHandler;
  };
  export default _default;
}

