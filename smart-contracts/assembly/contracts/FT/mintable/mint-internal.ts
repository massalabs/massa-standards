import { Args, bytesToU256, u256ToBytes } from '@massalabs/as-types';
import { _balance, _setBalance } from '../token-internals';
import { Address, Storage, generateEvent } from '@massalabs/massa-as-sdk';
import { TOTAL_SUPPLY_KEY, ft1_totalSupply } from '../token';
import { u256 } from 'as-bignum/assembly';

/**
 * Theses function are internal to the mintable token.
 * We define them and export in this file to avoid exporting them in the contract entry file,
 * making them callable from the outside world.
 *
 */

export const MINT_EVENT = 'MINT';

/**
 *  Mint tokens on the recipient address
 *
 * @param binaryArgs - `Args` serialized StaticArray<u8> containing:
 * - the recipient's account (address)
 * - the amount of tokens to mint (u256).
 */
export function _mint(binaryArgs: StaticArray<u8>): void {
  const args = new Args(binaryArgs);
  const recipient = new Address(
    args.nextString().expect('recipient argument is missing or invalid'),
  );
  const amount = args
    .nextU256()
    .expect('amount argument is missing or invalid');

  _increaseTotalSupply(amount);

  _increaseBalance(recipient, amount);

  generateEvent(
    `${MINT_EVENT}: ${amount.toString()} tokens to ${recipient.toString()}`,
  );
}

/**
 * Adds amount of token to recipient.
 *
 * @param recipient -
 * @param amount -
 */
export function _increaseBalance(recipient: Address, amount: u256): void {
  const oldRecipientBalance = _balance(recipient);
  // @ts-ignore
  const newRecipientBalance = oldRecipientBalance + amount;

  // Check overflow
  assert(
    oldRecipientBalance < newRecipientBalance,
    'Requested mint amount causes an overflow',
  );

  _setBalance(recipient, newRecipientBalance);
}

/**
 * Increases the total supply of the token.
 *
 * @param amount - how much you want to increase the total supply
 */
export function _increaseTotalSupply(amount: u256): void {
  const oldTotalSupply = bytesToU256(ft1_totalSupply([]));
  // @ts-ignore
  const newTotalSupply = oldTotalSupply + amount;

  // Check overflow
  assert(
    oldTotalSupply < newTotalSupply,
    'Requested mint amount causes an overflow',
  );

  Storage.set(TOTAL_SUPPLY_KEY, u256ToBytes(newTotalSupply));
}
