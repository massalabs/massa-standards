import { Address, Storage } from '@massalabs/massa-as-sdk';
import { _balance, _setBalance } from '../token-internals';
import { u256 } from 'as-bignum/assembly';
import { bytesToU256, u256ToBytes } from '@massalabs/as-types';
import { TOTAL_SUPPLY_KEY, totalSupply } from '../token';

/**
 * Theses function are internal to the burnable token.
 * We define them and export in this file to avoid exporting them in the contract entry file,
 * making them callable from the outside world.
 *
 */

/**
 * Removes amount of token from addressToBurn.
 *
 * @param addressToBurn -
 * @param amount -
 * @returns true if tokens has been burned
 */
export function _burn(addressToBurn: Address, amount: u256): void {
  const oldRecipientBalance = _balance(addressToBurn);
  // @ts-ignore
  const newRecipientBalance: u256 = oldRecipientBalance - amount;

  // Check underflow
  assert(
    oldRecipientBalance > newRecipientBalance,
    'Requested burn amount causes an underflow of the recipient balance',
  );

  _setBalance(addressToBurn, newRecipientBalance);
}

/**
 * Decreases the total supply of the token.
 *
 * @param amount -
 * @returns true if the total supply has been decreased
 */
export function _decreaseTotalSupply(amount: u256): void {
  const oldTotalSupply = bytesToU256(totalSupply([]));
  // @ts-ignore
  const newTotalSupply: u256 = oldTotalSupply - amount;

  // Check underflow
  assert(
    oldTotalSupply > newTotalSupply,
    'Requested burn amount causes an underflow of the total supply',
  );

  Storage.set(TOTAL_SUPPLY_KEY, u256ToBytes(newTotalSupply));
}
