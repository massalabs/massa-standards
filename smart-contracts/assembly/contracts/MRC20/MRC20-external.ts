import { Address, Storage } from '@massalabs/massa-as-sdk';
import { balanceKey } from './MRC20-internals';

const STORAGE_BYTE_COST = 100_000;
// Base cost of a new ledger entry, expressed in bytes.
const STORAGE_PREFIX_LENGTH = 4;
// Length of the balance key prefix ("BALANCE").
const BALANCE_KEY_PREFIX_LENGTH = 7;

/**
 * Storage cost of creating a fresh MRC20 balance entry (a `BALANCE`-prefixed key
 * holding a u256 value) for an address whose string form has the given length.
 *
 * This is the single source of truth for the byte-cost constants shared by
 * {@link getBalanceEntryCost} and {@link computeMintStorageCost}, so the two
 * cannot drift apart.
 *
 * @param addressLength - length of the address string
 */
function balanceEntryCost(addressLength: i32): u64 {
  const keyLength = BALANCE_KEY_PREFIX_LENGTH + addressLength;
  const valueLength = 4 * sizeof<u64>(); // serialized u256
  return (STORAGE_PREFIX_LENGTH + keyLength + valueLength) * STORAGE_BYTE_COST;
}

/**
 * Returns the coins needed to cover the storage of a new balance entry for
 * `recipient` in the token at `tokenAddress`, or 0 if the entry already exists.
 *
 * Use this from a contract that is about to call `transfer`/`transferFrom` on an
 * external token, so the caller (not the token) pays for the recipient's new
 * balance entry.
 *
 * @param tokenAddress - address of the remote token contract
 * @param recipient - address that will receive the tokens
 */
export function getBalanceEntryCost(
  tokenAddress: string,
  recipient: string,
): u64 {
  if (
    Storage.hasOf(new Address(tokenAddress), balanceKey(new Address(recipient)))
  ) {
    return 0;
  }
  return balanceEntryCost(recipient.length);
}

/**
 * Returns the storage cost of crediting a balance to `receiver` in this
 * contract's own ledger, or 0 if the entry already exists.
 *
 * @param receiver - address whose balance entry would be created
 */
export function computeMintStorageCost(receiver: Address): u64 {
  if (Storage.has(balanceKey(receiver))) {
    return 0;
  }
  return balanceEntryCost(receiver.toString().length);
}
