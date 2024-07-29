import mongoose, { Document, Schema } from "mongoose";

interface IAccount extends Document {
  id: string;
  balance: number;
}

const AccountSchema: Schema = new Schema({
  id: { type: String, required: true, unique: true },
  balance: { type: Number, required: true },
});

export const Account = mongoose.model<IAccount>("Account", AccountSchema);
