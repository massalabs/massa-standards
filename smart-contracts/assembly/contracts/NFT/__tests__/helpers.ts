import { bytesToU64 } from '@massalabs/as-types';
import { getKeys, Storage } from '@massalabs/massa-as-sdk';
import { _getOwnedTokensKeyPrefix } from '../NFTEnumerable-internals';

/**
 * Returns the all the tokens owned by a specific address.
 *
 * @param owner - The address of the owner.
 *
 * @returns An array of u64 representing the tokens owned by the address.
 *
 */
export function getOwnedTokens(owner: string): u64[] {
  const tokens: u64[] = [];
  const keys = getKeys(_getOwnedTokensKeyPrefix(owner));

  for (let i = 0; i < keys.length; i++) {
    tokens.push(bytesToU64(Storage.get(keys[i])));
  }
  return tokens;
}
