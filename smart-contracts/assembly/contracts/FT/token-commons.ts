import { stringToBytes } from '@massalabs/as-types';
import { bytesToU256, u256ToBytes } from '@massalabs/as-types';
import { Address, Storage } from '@massalabs/massa-as-sdk';
import { u256 } from 'as-bignum/assembly';

export const BALANCE_KEY = 'BALANCE';

/**
 * Theses function are intended to be used in different token types (mintable, burnable...).
 * We define them and export in this file to avoid exporting them in the contract entry file,
 * making them callable from the outside world
 *
 */

/**
 * Returns the balance of a given address.
 *
 * @param address - address to get the balance for
 */
export function _balance(address: Address): u256 {
  const key = getBalanceKey(address);
  if (Storage.has(key)) {
    return bytesToU256(Storage.get(key));
  }
  return u256.Zero;
}

/**
 * Sets the balance of a given address.
 *
 * @param address - address to set the balance for
 * @param balance -
 */
export function _setBalance(address: Address, balance: u256): void {
  Storage.set(getBalanceKey(address), u256ToBytes(balance));
}

/**
 * @param address -
 * @returns the key of the balance in the storage for the given address
 */
function getBalanceKey(address: Address): StaticArray<u8> {
  return stringToBytes(BALANCE_KEY + address.toString());
}
