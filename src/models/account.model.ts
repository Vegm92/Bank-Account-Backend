import mongoose from "mongoose";

const accountSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  balance: { type: Number, required: true },
});

export const Account = mongoose.model("Account", accountSchema);
