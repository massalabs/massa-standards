import { Args, u256ToBytes } from '@massalabs/as-types';
import { Address, Context, transferCoins } from '@massalabs/massa-as-sdk';
import { burn } from './burnable/burn';
import { u256 } from 'as-bignum/assembly/integer/u256';
import { _mint } from './mintable/mint-internal';

export * from './token';

/**
 * Wrap wanted value.
 *
 * @param _ - unused but mandatory.
 */
export function deposit(_: StaticArray<u8>): void {
  const amount = Context.transferredCoins();
  const recipient = Context.caller();
  assert(amount > 0, 'Payment must be more than 0 MAS');

  const args = new Args().add(recipient).add(u256.fromU64(amount)).serialize();
  _mint(args);
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
  const recipient = new Address(args.nextString().expect('recipient is missing'));

  assert(amount > 0, 'Payment must be more than 0 WMAS');

  burn(u256ToBytes(u256.fromU64(amount)));
  transferCoins(recipient, amount);
}
