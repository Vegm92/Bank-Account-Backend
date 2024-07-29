import { Account } from "../models/account.model";

export async function getOrCreateAccount(iban: string) {
  let account = await Account.findOne({ id: iban });
  if (!account) {
    account = new Account({ id: iban, balance: 0 });
    await account.save();
  }
  return account;
}
