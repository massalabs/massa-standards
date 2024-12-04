/**
 * This is an example of an NFT contract that uses the `NFTEnumerable-internals`
 * helper functions to implement enumeration functionality similar to the ERC-721 Enumerable extension.
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
 *   - `totalSupply`: A `u64` value representing the total number of tokens in existence.
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

import {
  Args,
  boolToByte,
  stringToBytes,
  u64ToBytes,
} from '@massalabs/as-types';
import {
  _approve,
  _balanceOf,
  _constructor,
  _getApproved,
  _isApprovedForAll,
  _name,
  _ownerOf,
  _setApprovalForAll,
  _symbol,
  _update,
  _transferFrom,
  _totalSupply,
} from './NFTEnumerable-internals';
import { setOwner, onlyOwner } from '../utils/ownership';
import { Context, isDeployingContract } from '@massalabs/massa-as-sdk';

const NAME = 'MASSA_NFT';
const SYMBOL = 'NFT';

/**
 * @param binaryArgs - serialized strings representing the name and the symbol of the NFT
 *
 * @remarks This is the constructor of the contract. It can only be called once, when the contract is being deployed.
 * It expects two serialized arguments: the name and the symbol of the NFT.
 * Once the constructor has handled the deserialization of the arguments,
 * it calls the _constructor function from the NFT-enumerable-internals.
 *
 * Finally, it sets the owner of the contract to the caller of the constructor.
 */
export function constructor(_: StaticArray<u8>): void {
  assert(isDeployingContract());
  _constructor(NAME, SYMBOL);
  setOwner(new Args().add(Context.caller().toString()).serialize());
}

export function name(): string {
  return _name();
}

export function symbol(): string {
  return _symbol();
}

/**
 *
 * @param binaryArgs - serialized string representing the address whose balance we want to check
 * @returns a serialized u64 representing the balance of the address
 */
export function balanceOf(binaryArgs: StaticArray<u8>): StaticArray<u8> {
  const args = new Args(binaryArgs);
  const address = args
    .nextString()
    .expect('address argument is missing or invalid');
  return u64ToBytes(_balanceOf(address));
}

/**
 *
 * @param binaryArgs - serialized u64 representing the tokenId whose owner we want to check
 * @returns a serialized string representing the address of owner of the tokenId
 */
export function ownerOf(binaryArgs: StaticArray<u8>): StaticArray<u8> {
  const args = new Args(binaryArgs);
  const tokenId = args
    .nextU64()
    .expect('tokenId argument is missing or invalid');
  return stringToBytes(_ownerOf(tokenId));
}

/**
 *
 * @param binaryArgs - serialized u64 representing the tokenId whose approved address we want to check
 * @returns a serialized string representing the address of the approved address of the tokenId
 */
export function getApproved(binaryArgs: StaticArray<u8>): StaticArray<u8> {
  const args = new Args(binaryArgs);
  const tokenId = args
    .nextU64()
    .expect('tokenId argument is missing or invalid');
  return stringToBytes(_getApproved(tokenId));
}

/**
 *
 * @param binaryArgs - serialized strings representing the address of an owner and an operator
 * @returns a serialized u8 representing a boolean value indicating if
 * the operator is approved for all the owner's tokens
 */
export function isApprovedForAll(binaryArgs: StaticArray<u8>): StaticArray<u8> {
  const args = new Args(binaryArgs);
  const owner = args
    .nextString()
    .expect('owner argument is missing or invalid');
  const operator = args
    .nextString()
    .expect('operator argument is missing or invalid');
  return boolToByte(_isApprovedForAll(owner, operator));
}

/**
 *
 * @param binaryArgs - serialized strings representing the address of the recipient and the tokenId to approve
 * @remarks This function is only callable by the owner of the tokenId or an approved operator.
 * Indeed, this will be checked by the _approve function of the NFT-internals.
 *
 */
export function approve(binaryArgs: StaticArray<u8>): void {
  const args = new Args(binaryArgs);
  const to = args.nextString().expect('to argument is missing or invalid');
  const tokenId = args
    .nextU64()
    .expect('tokenId argument is missing or invalid');
  _approve(to, tokenId);
}

/**
 *
 * @param binaryArgs - serialized arguments representing the address of the operator and a boolean value indicating
 * if the operator should be approved for all the caller's tokens
 *
 */
export function setApprovalForAll(binaryArgs: StaticArray<u8>): void {
  const args = new Args(binaryArgs);
  const to = args.nextString().expect('to argument is missing or invalid');
  const approved = args
    .nextBool()
    .expect('approved argument is missing or invalid');
  _setApprovalForAll(to, approved);
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
    .nextU64()
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
    .nextU64()
    .expect('tokenId argument is missing or invalid');
  _update(to, tokenId, '');
}

/**
 *
 * @param binaryArgs - serialized u64 representing the tokenId to burn
 *
 * @remarks This function is not part of the ERC721 standard.
 * It serves as an example of how to use the NFT-enumerable-internals functions to implement custom features.
 */
export function burn(binaryArgs: StaticArray<u8>): void {
  const args = new Args(binaryArgs);
  const tokenId = args
    .nextU64()
    .expect('tokenId argument is missing or invalid');
  _update('', tokenId, '');
}

/**
 * Returns the total number of tokens.
 * @returns a serialized u64 representing the total supply
 */
export function totalSupply(_: StaticArray<u8>): StaticArray<u8> {
  return u64ToBytes(_totalSupply());
}

/**
 * Expose the ownerAddress function to allow checking the owner of the contract.
 */
export { ownerAddress } from '../utils/ownership';
