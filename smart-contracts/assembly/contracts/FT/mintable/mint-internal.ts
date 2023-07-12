import { bytesToU256, u256ToBytes } from '@massalabs/as-types';
import { _balance, _setBalance } from '../token-internals';
import { Address, Storage } from '@massalabs/massa-as-sdk';
import { TOTAL_SUPPLY_KEY, totalSupply } from '../token';
import { u256 } from 'as-bignum/assembly';

/**
 * Theses function are internal to the mintable token.
 * We define them and export in this file to avoid exporting them in the contract entry file,
 * making them callable from the outside world.
 *
 */

/**
 * Adds amount of token to recipient.
 *
 * @param recipient -
 * @param amount -
 * @returns true if the token has been minted
 */
export function _mint(recipient: Address, amount: u256): void {
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
 * @returns true if the total supply has been increased
 */
export function _increaseTotalSupply(amount: u256): void {
  const oldTotalSupply = bytesToU256(totalSupply([]));
  // @ts-ignore
  const newTotalSupply = oldTotalSupply + amount;

  // Check overflow
  assert(
    oldTotalSupply < newTotalSupply,
    'Requested mint amount causes an overflow',
  );

  Storage.set(TOTAL_SUPPLY_KEY, u256ToBytes(newTotalSupply));
}
