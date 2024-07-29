import mongoose, { Document, Schema } from "mongoose";

interface ITransaction extends Document {
  accountId: string;
  date: Date;
  amount: number;
  balance: number;
  type: "deposit" | "withdrawal" | "transfer_out" | "transfer_in";
}

const TransactionSchema: Schema = new Schema({
  accountId: { type: String, required: true },
  date: { type: Date, required: true },
  amount: { type: Number, required: true },
  balance: { type: Number, required: true },
  type: {
    type: String,
    required: true,
    enum: ["deposit", "withdrawal", "transfer_out", "transfer_in"],
  },
});

export const Transaction = mongoose.model<ITransaction>(
  "Transaction",
  TransactionSchema
);
