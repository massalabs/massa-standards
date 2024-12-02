import { bytesToU256 } from '@massalabs/as-types';
import { getKeys, Storage } from '@massalabs/massa-as-sdk';
import { u256 } from 'as-bignum/assembly';
import { _getOwnedTokensKeyPrefix } from '../NFTEnumerable-internals';

/**
 * Returns the all the tokens owned by a specific address.
 *
 * @param owner - The address of the owner.
 *
 * @returns An array of u256 representing the tokens owned by the address.
 *
 */
export function getOwnedTokens(owner: string): u256[] {
  const tokens: u256[] = [];
  const keys = getKeys(_getOwnedTokensKeyPrefix(owner));

  for (let i = 0; i < keys.length; i++) {
    tokens.push(bytesToU256(Storage.get(keys[i])));
  }
  return tokens;
}
