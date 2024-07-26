import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema({
  accountId: { type: String, required: true },
  date: { type: Date, required: true },
  amount: { type: Number, required: true },
  balance: { type: Number, required: true },
  type: { type: String, enum: ["deposit", "withdrawal"], required: true },
});

export const Transaction = mongoose.model("Transaction", transactionSchema);
