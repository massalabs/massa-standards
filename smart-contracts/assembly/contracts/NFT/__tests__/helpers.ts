import { bytesToU64 } from '@massalabs/as-types';
import { getKeys } from '@massalabs/massa-as-sdk';
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
  const prefix = _getOwnedTokensKeyPrefix(owner);
  const keys = getKeys(prefix);

  for (let i = 0; i < keys.length; i++) {
    const tokenIdBytesArray = keys[i].slice(keys[i].length - sizeof<u64>());
    const tokenIdBytes = StaticArray.fromArray<u8>(tokenIdBytesArray);
    const tokenId = bytesToU64(tokenIdBytes);
    tokens.push(tokenId);
  }

  return tokens;
}
