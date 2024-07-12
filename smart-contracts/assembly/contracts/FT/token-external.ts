import { Address, Storage } from '@massalabs/massa-as-sdk';
import { balanceKey } from './token-internals';

export function getCoinAddressCreation(
  tokenAddress: string,
  recipient: string,
): u64 {
  let cost = 0;
  if (
    !Storage.hasOf(
      new Address(tokenAddress),
      balanceKey(new Address(recipient)),
    )
  ) {
    // baseCost = NEW_LEDGER_ENTRY_COST = STORAGE_BYTE_COST * 4 = 100_000 * 4 = 400_000
    cost = 400_000;
    // keyCost =
    // LEDGER_COST_PER_BYTE * stringToBytes(BALANCE_KEY_PREFIX + receiver).length = 100_000 * (7 + receiver.length)
    cost += 100_000 * (7 + recipient.length);
    // valCost = LEDGER_COST_PER_BYTE * u256ToBytes(u256.Zero).length = 100_000 * 32 = 3_200_000
    cost += 3_200_000;
  }

  return cost;
}
