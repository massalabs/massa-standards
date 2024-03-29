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

const STORAGE_BYTE_COST = 100_000;
const STORAGE_PREFIX_LENGTH = 4;
const BALANCE_KEY_PREFIX_LENGTH = 7;

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

export function computeStorageCost(receiver: Address): u64 {
  if (Storage.hasOf(Context.callee(), balanceKey(receiver))) {
    return 0;
  }
  const baseLength = STORAGE_PREFIX_LENGTH;
  const keyLength = BALANCE_KEY_PREFIX_LENGTH + receiver.toString().length;
  const valueLength = sizeof<u256>();
  return (baseLength + keyLength + valueLength) * STORAGE_BYTE_COST;
}
