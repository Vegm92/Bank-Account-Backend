import { Account } from "../models/account.model";

export async function getOrCreateAccount(accountId = "default") {
  let account = await Account.findOne({ id: accountId });
  if (!account) {
    account = new Account({ id: accountId, balance: 0 });
    await account.save();
  }
  return account;
}
