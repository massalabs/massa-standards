/**
 * This is an example of an NFT contract that uses the `NFTEnumerable-internals`
 * helper functions to implement enumeration functionality similar to the ERC-721 Enumerable extension.
 *
 * @remarks
 *
 * **Note:** We have diverged from the ERC-721 Enumerable standard in this implementation.
 * On the Massa blockchain, indices are not necessary for token enumeration because we can directly access
 * the storage and structure data in a way that allows developers to easily retrieve the needed values.
 *
 * Instead of maintaining explicit arrays or mappings of token IDs and owner tokens by index,
 * we utilize key prefix querying to retrieve all token IDs and tokens owned by specific addresses.
 * This approach leverages Massa's storage capabilities for efficient data access and simplifies the contract logic.
 *
 * **Benefits of This Approach:**
 * - **Reduced Storage Costs:** Eliminates the need for additional storage structures to maintain indices.
 * - **Simplified Logic:** Streamlines the process of token enumeration, making the contract easier to maintain.
 *
 * **Underlying Storage Structure:**
 *
 * We store important information in the following formats:
 *
 * - **Total Supply:**
 *
 *   [TOTAL_SUPPLY_KEY] = totalSupply
 *   - `TOTAL_SUPPLY_KEY`: A constant key for the total supply of tokens.
 *   - `totalSupply`: A `u256` value representing the total number of tokens in existence.
 *
 * - **Owned Tokens:**
 *
 *   [OWNED_TOKENS_KEY][owner][tokenId] = tokenId
 *   - `OWNED_TOKENS_KEY`: A constant prefix for all owned tokens.
 *   - `owner`: The owner's address.
 *   - `tokenId`: The token ID.
 *   - The value `tokenId` is stored to facilitate easy retrieval.
 *
 * **Retrieving Data Using Key Prefixes:**
 *
 * We utilize the `getKeys` function from the `massa-as-sdk`, which allows us to retrieve all keys that start with a
 * specific prefix. This enables us to:
 * - Retrieve all tokens owned by a specific address by querying keys with the prefix `[OWNED_TOKENS_KEY][owner]`.
 * - Retrieve all existing token IDs by querying keys with the appropriate prefix if needed.
 *
 * **Key Points:**
 * - The `getKeys` function from the `massa-as-sdk` allows us to filter storage keys by a given prefix,
 *  enabling efficient data retrieval.
 *
 * **This file does two things:**
 * 1. It wraps the `NFTEnumerable-internals` functions, manages the deserialization/serialization of the arguments
 *    and return values, and exposes them to the outside world.
 * 2. It implements some custom features that are not part of the ERC-721 standard,
 *    such as `mint`, `burn`, or ownership management.
 *
 * **Important:** The `NFTEnumerable-internals` functions are not supposed to be re-exported by this file.
 */

import { Args, u256ToBytes } from '@massalabs/as-types';
import {
  _constructor,
  _update,
  _transferFrom,
  _totalSupply,
} from './MRC721Enumerable-internals';
import { onlyOwner } from '../../utils/ownership';
import { _setOwner } from '../../utils/ownership-internal';
import { Context, isDeployingContract } from '@massalabs/massa-as-sdk';

/**
 * @param name - the name of the NFT
 * @param symbol - the symbol of the NFT
 * @remarks You must call this function in your contract's constructor or re-write it to fit your needs !
 */
export function mrc721Constructor(name: string, symbol: string): void {
  assert(isDeployingContract());
  _constructor(name, symbol);
  _setOwner(Context.caller().toString());
}

/**
 *
 * @param binaryArgs - serialized arguments representing the address of the sender,
 * the address of the recipient, and the tokenId to transfer.
 *
 * @remarks This function is only callable by the owner of the tokenId or an approved operator.
 */
export function transferFrom(binaryArgs: StaticArray<u8>): void {
  const args = new Args(binaryArgs);
  const from = args.nextString().expect('from argument is missing or invalid');
  const to = args.nextString().expect('to argument is missing or invalid');
  const tokenId = args
    .nextU256()
    .expect('tokenId argument is missing or invalid');
  _transferFrom(from, to, tokenId);
}

/**
 *
 * @param binaryArgs - serialized arguments representing the address of the recipient and the tokenId to mint
 *
 * @remarks This function is only callable by the owner of the contract.
 */
export function mint(binaryArgs: StaticArray<u8>): void {
  onlyOwner();
  const args = new Args(binaryArgs);
  const to = args.nextString().expect('to argument is missing or invalid');
  const tokenId = args
    .nextU256()
    .expect('tokenId argument is missing or invalid');
  _update(to, tokenId, '');
}

/**
 *
 * @param binaryArgs - serialized u256 representing the tokenId to burn
 *
 * @remarks This function is not part of the ERC721 standard.
 * It serves as an example of how to use the NFT-enumerable-internals functions to implement custom features.
 */
export function burn(binaryArgs: StaticArray<u8>): void {
  const args = new Args(binaryArgs);
  const tokenId = args
    .nextU256()
    .expect('tokenId argument is missing or invalid');
  _update('', tokenId, '');
}

/**
 * Returns the total number of tokens.
 * @returns a serialized u256 representing the total supply
 */
export function totalSupply(_: StaticArray<u8>): StaticArray<u8> {
  return u256ToBytes(_totalSupply());
}

/**
 * Expose the ownerAddress function to allow checking the owner of the contract.
 */
export { ownerAddress } from '../../utils/ownership';
/**
 * Expose non-modified functions from MRC721.
 */
export {
  name,
  symbol,
  balanceOf,
  ownerOf,
  getApproved,
  isApprovedForAll,
  approve,
  setApprovalForAll,
} from '../MRC721';
