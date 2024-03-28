import { Args, u256ToBytes } from '@massalabs/as-types';
import {
  Address,
  Context,
  Storage,
  transferCoins,
} from '@massalabs/massa-as-sdk';
import { burn } from './burnable/burn';
import { u256 } from 'as-bignum/assembly/integer/u256';
import { _mint } from './mintable/mint-internal';
import { balanceKey } from './token-internals';

export * from './token';

/**
 * Wrap wanted value.
 *
 * @param _ - unused but mandatory.
 */
export function deposit(_: StaticArray<u8>): void {
  const recipient = Context.caller();
  const amount = Context.transferredCoins();
  const storageCost = computeStorageCost(recipient);
  assert(
    amount > storageCost,
    'Transferred amount is not enough to cover storage cost',
  );
  _mint(
    new Args()
      .add(recipient)
      .add(u256.fromU64(amount - storageCost))
      .serialize(),
  );
}

/**
 * Unwrap wanted value.
 *
 * @param bs - serialized StaticArray<u8> containing
 * - the amount to withdraw (u64)
 * - the recipient's account (String).
 */
export function withdraw(bs: StaticArray<u8>): void {
  const args = new Args(bs);
  const amount = args.nextU64().expect('amount is missing');
  const recipient = new Address(
    args.nextString().expect('recipient is missing'),
  );
  burn(u256ToBytes(u256.fromU64(amount)));
  transferCoins(recipient, amount);
}

function computeStorageCost(receiver: Address): u64 {
  let cost = 0;
  if (!Storage.hasOf(Context.callee(), balanceKey(receiver))) {
    // baseCost = NEW_LEDGER_ENTRY_COST = STORAGE_BYTE_COST * 4 = 100_000 * 4 = 400_000
    cost = 400_000;
    // eslint-disable-next-line max-len
    // keyCost = LEDGER_COST_PER_BYTE * stringToBytes(BALANCE_KEY_PREFIX + receiver).length = 100_000 * (7 + receiver.length)
    cost += 100_000 * (7 + receiver.toString().length);
    // valCost = LEDGER_COST_PER_BYTE * u256ToBytes(u256.Zero).length = 100_000 * 32 = 3_200_000
    cost += 3_200_000;
  }
  return cost;
}
