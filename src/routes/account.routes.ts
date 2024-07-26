import express, { Request, Response } from "express";
import { logger } from "../config/logger";
import { getOrCreateAccount } from "../utils/account.utils";
import { Transaction } from "../models/transaction.model";
import mongoose from "mongoose";

const router = express.Router();

router.post("/deposit", async (req: Request, res: Response) => {
  logger.info("Processing deposit request");
  const { amount } = req.body;
  if (typeof amount !== "number" || amount <= 0) {
    logger.warn(`Deposit failed: Invalid amount - ${amount}`);
    return res.status(400).json({ success: false, message: "Invalid amount" });
  }

  try {
    const account = await getOrCreateAccount();
    if (account && account.balance !== null && account.balance !== undefined) {
      account.balance += amount;
      await account.save();

      const transaction = new Transaction({
        accountId: account.id,
        date: new Date(),
        amount: amount,
        balance: account.balance,
        type: "deposit",
      });
      await transaction.save();

      logger.info(`Deposit successful. New balance: ${account.balance}`);
      res.json({
        success: true,
        message: "Deposit successful",
        data: account,
      });
    } else {
      logger.error("Account or account balance is null/undefined");
      res
        .status(500)
        .json({ success: false, message: "Internal server error" });
    }
  } catch (error: unknown) {
    if (error instanceof mongoose.Error) {
      logger.error(`Deposit failed: ${error.message}`);
    } else {
      logger.error(`Deposit failed: Unknown error`);
    }
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

router.post("/withdraw", async (req: Request, res: Response) => {
  logger.info("Processing withdrawal request");
  const { amount } = req.body;
  if (typeof amount !== "number" || amount <= 0) {
    logger.warn(`Withdrawal failed: Invalid amount - ${amount}`);
    return res.status(400).json({ success: false, message: "Invalid amount" });
  }

  try {
    const account = await getOrCreateAccount();
    if (account && account.balance !== null && account.balance !== undefined) {
      if (account.balance < amount) {
        logger.warn(
          `Withdrawal failed: Insufficient funds. Attempted: ${amount}, Available: ${account.balance}`
        );
        return res
          .status(400)
          .json({ success: false, message: "Insufficient funds" });
      }

      account.balance -= amount;
      await account.save();

      const transaction = new Transaction({
        accountId: account.id,
        date: new Date(),
        amount: -amount,
        balance: account.balance,
        type: "withdrawal",
      });
      await transaction.save();

      logger.info(`Withdrawal successful. New balance: ${account.balance}`);
      res.json({
        success: true,
        message: "Withdrawal successful",
        data: account,
      });
    } else {
      logger.error("Account or account balance is null/undefined");
      res
        .status(500)
        .json({ success: false, message: "Internal server error" });
    }
  } catch (error: unknown) {
    if (error instanceof mongoose.Error) {
      logger.error(`Withdrawal failed: ${error.message}`);
    } else {
      logger.error(`Withdrawal failed: Unknown error`);
    }
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

export default router;
