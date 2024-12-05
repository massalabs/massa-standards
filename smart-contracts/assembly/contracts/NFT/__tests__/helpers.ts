import { bytesToU256 } from '@massalabs/as-types';
import { getKeys } from '@massalabs/massa-as-sdk';
import { u256 } from 'as-bignum/assembly';
import { _getOwnedTokensKeyPrefix } from '../NFTEnumerable-internals';

const SIZE_OF_U256 = 32;

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
  const prefix = _getOwnedTokensKeyPrefix(owner);
  const keys = getKeys(prefix);

  for (let i = 0; i < keys.length; i++) {
    const tokenIdBytesArray = keys[i].slice(keys[i].length - SIZE_OF_U256);
    const tokenIdBytes = StaticArray.fromArray<u8>(tokenIdBytesArray);
    const tokenId = bytesToU256(tokenIdBytes);
    tokens.push(tokenId);
  }

  return tokens;
}
