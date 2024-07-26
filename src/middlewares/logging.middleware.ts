import { Request, Response, NextFunction } from "express";
import { logger } from "../config/logger";

export const logRequests = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  logger.info(`New Request - Method: ${req.method}, URL: ${req.url}`);
  logger.debug(`Request Body: ${JSON.stringify(req.body)}`);
  logger.debug(`Request Query: ${JSON.stringify(req.query)}`);
  next();
};
