import { Args, u256ToBytes } from '@massalabs/as-types';
import {
  Address,
  balance,
  Context,
  transferCoins,
  transferRemaining,
} from '@massalabs/massa-as-sdk';
import { burn } from './burnable/burn';
import { u256 } from 'as-bignum/assembly/integer/u256';
import { _mint } from './mintable/mint-internal';
import { computeMintStorageCost } from './MRC20-external';

export * from './MRC20';

/**
 * Wrap wanted value.
 *
 * @param _ - unused but mandatory.
 */
export function deposit(_: StaticArray<u8>): void {
  const recipient = Context.caller();
  const amount = Context.transferredCoins();
  const storageCost = computeMintStorageCost(recipient);
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
  const initialBalance = balance();
  const args = new Args(bs);
  const amount = args.nextU64().expect('amount is missing');
  const recipient = new Address(
    args.nextString().expect('recipient is missing'),
  );
  burn(u256ToBytes(u256.fromU64(amount)));

  // Burning the caller's full balance deletes their balance entry; the runtime
  // refunds that entry's storage deposit to this contract. transferRemaining
  // forwards that refund (and any coins the caller attached) back to the caller
  // so nothing is left locked here. It must run BEFORE the transfer below: it
  // has no debit parameter, so it would otherwise read the intentional
  // withdrawal as overspending and revert with SPENT_MORE_COINS_THAN_SENT.
  transferRemaining(initialBalance);

  transferCoins(recipient, amount);
}
