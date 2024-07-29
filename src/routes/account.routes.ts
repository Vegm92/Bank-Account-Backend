import express, { Request, Response } from "express";
import { logger } from "../config/logger";
import { getOrCreateAccount } from "../utils/account.utils";
import { Transaction } from "../models/transaction.model";
import mongoose from "mongoose";
import { Account } from "../models/account.model";

const router = express.Router();

router.post("/deposit", async (req: Request, res: Response) => {
  logger.info("Processing deposit request");
  const { amount, iban } = req.body;
  logger.info(`Deposit request for IBAN: ${iban}, Amount: ${amount}`);

  if (typeof amount !== "number" || amount <= 0) {
    logger.warn(`Deposit failed: Invalid amount - ${amount}`);
    return res.status(400).json({ success: false, message: "Invalid amount" });
  }

  try {
    logger.info("Attempting to get or create account");
    const account = await getOrCreateAccount(iban);
    logger.info(`Account retrieved/created: ${JSON.stringify(account)}`);

    if (account && account.balance !== null && account.balance !== undefined) {
      account.balance += amount;
      logger.info("Saving updated account balance");
      try {
        const savedAccount = await account.save();
        logger.info(
          `Account saved successfully: ${JSON.stringify(savedAccount)}`
        );
      } catch (saveError) {
        logger.error(`Error saving account: ${saveError}`);
        throw saveError;
      }

      logger.info("Creating transaction record");
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
  const { amount, iban } = req.body;
  if (typeof amount !== "number" || amount <= 0) {
    logger.warn(`Withdrawal failed: Invalid amount - ${amount}`);
    return res.status(400).json({ success: false, message: "Invalid amount" });
  }

  try {
    const account = await getOrCreateAccount(iban);
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
        data: { balance: account.balance },
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

router.post("/transfer", async (req: Request, res: Response) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    logger.info("Processing transfer request");
    const { amount, senderIBAN, recipientIBAN } = req.body;

    if (!amount || !senderIBAN || !recipientIBAN) {
      logger.warn(
        `Transfer failed: Missing required fields - Amount: ${amount}, Sender: ${senderIBAN}, Recipient: ${recipientIBAN}`
      );
      return res
        .status(400)
        .json({ success: false, message: "Missing required fields" });
    }

    if (senderIBAN === recipientIBAN) {
      logger.warn(
        `Transfer failed: Sender and recipient are the same - IBAN: ${senderIBAN}`
      );
      return res.status(400).json({
        success: false,
        message: "Sender and recipient cannot be the same",
      });
    }

    const transferAmount = parseFloat(amount);
    if (isNaN(transferAmount) || transferAmount <= 0) {
      logger.warn(`Transfer failed: Invalid amount - ${amount}`);
      return res
        .status(400)
        .json({ success: false, message: "Invalid transfer amount" });
    }

    const senderAccount = await Account.findOne({ id: senderIBAN }).session(
      session
    );
    const recipientAccount = await Account.findOne({
      id: recipientIBAN,
    }).session(session);

    if (!senderAccount || !recipientAccount) {
      logger.warn(
        `Transfer failed: Account not found - Sender: ${senderIBAN}, Recipient: ${recipientIBAN}`
      );
      return res.status(404).json({
        success: false,
        message: "Sender or recipient account not found",
      });
    }

    if (senderAccount.balance < transferAmount) {
      logger.warn(
        `Transfer failed: Insufficient funds - Sender: ${senderIBAN}, Amount: ${transferAmount}, Balance: ${senderAccount.balance}`
      );
      return res
        .status(400)
        .json({ success: false, message: "Insufficient funds" });
    }

    senderAccount.balance -= transferAmount;
    recipientAccount.balance += transferAmount;

    await senderAccount.save();
    await recipientAccount.save();

    await Transaction.create(
      [
        {
          accountId: senderIBAN,
          date: new Date(),
          amount: -transferAmount,
          balance: senderAccount.balance,
          type: "transfer_out",
        },
        {
          accountId: recipientIBAN,
          date: new Date(),
          amount: transferAmount,
          balance: recipientAccount.balance,
          type: "transfer_in",
        },
      ],
      { session }
    );

    await session.commitTransaction();
    logger.info(
      `Transfer successful - From: ${senderIBAN}, To: ${recipientIBAN}, Amount: ${transferAmount}`
    );
    res.json({
      success: true,
      message: "Transfer successful",
      data: { balance: senderAccount.balance },
    });
  } catch (error: unknown) {
    await session.abortTransaction();

    if (error instanceof Error) {
      logger.error(`Transfer failed: ${error.message}`);
    } else {
      logger.error("Transfer failed: Unknown error");
    }

    res.status(500).json({
      success: false,
      message: "An error occurred while processing the transfer",
    });
  } finally {
    session.endSession();
  }
});

router.get("/account-info", async (req: Request, res: Response) => {
  logger.info("Fetching account information");
  const { iban } = req.query;

  if (!iban || typeof iban !== "string") {
    logger.warn(`Account info request failed: Invalid IBAN - ${iban}`);
    return res.status(400).json({ success: false, message: "Invalid IBAN" });
  }

  try {
    const account = await getOrCreateAccount(iban);
    if (account && account.balance !== null && account.balance !== undefined) {
      logger.info(`Account info fetched successfully for IBAN: ${iban}`);
      res.json({
        success: true,
        data: { balance: account.balance },
      });
    } else {
      logger.error("Account or account balance is null/undefined");
      res
        .status(500)
        .json({ success: false, message: "Internal server error" });
    }
  } catch (error: unknown) {
    if (error instanceof mongoose.Error) {
      logger.error(`Account info fetch failed: ${error.message}`);
    } else {
      logger.error(`Account info fetch failed: Unknown error`);
    }
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

router.get("/statement", async (req: Request, res: Response) => {
  logger.info("Fetching account statement");
  const { iban } = req.query;

  if (!iban || typeof iban !== "string") {
    logger.warn(`Statement request failed: Invalid IBAN - ${iban}`);
    return res.status(400).json({ success: false, message: "Invalid IBAN" });
  }

  try {
    const transactions = await Transaction.find({ accountId: iban }).sort({
      date: -1,
    });
    logger.info(`Statement fetched successfully for IBAN: ${iban}`);
    res.json({
      success: true,
      data: transactions,
    });
  } catch (error: unknown) {
    if (error instanceof mongoose.Error) {
      logger.error(`Statement fetch failed: ${error.message}`);
    } else {
      logger.error(`Statement fetch failed: Unknown error`);
    }
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

router.get("/test-db", async (req: Request, res: Response) => {
  try {
    const account = new Account({ id: "test-iban", balance: 0 });
    await account.save();
    res.json({ success: true, message: "Database test successful" });
  } catch (error) {
    logger.error(`Database test failed: ${error}`);
    res.status(500).json({ success: false, message: "Database test failed" });
  }
});

router.get("/other-ibans", async (req: Request, res: Response) => {
  try {
    const { currentIBAN } = req.query;

    if (!currentIBAN || typeof currentIBAN !== "string") {
      return res
        .status(400)
        .json({ success: false, message: "Current IBAN is required" });
    }

    const otherAccounts = await Account.find(
      { id: { $ne: currentIBAN } },
      "id"
    ).limit(5);
    const otherIBANs = otherAccounts.map((account) => account.id);

    logger.info(`Retrieved ${otherIBANs.length} other IBANs`);
    res.json({ success: true, data: otherIBANs });
  } catch (error) {
    logger.error("Failed to fetch other IBANs:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch other IBANs" });
  }
});

export default router;
