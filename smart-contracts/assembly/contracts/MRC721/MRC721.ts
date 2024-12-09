/**
 *
 * This is an example of an NFT contract that uses the NFT-internals
 * helper functions to implement the ERC721 standard.
 *
 * This files does basically two things:
 * 1. It wraps the NFT-internals functions, manages the deserialize/serialize of the arguments and return values,
 *    and exposes them to the outside world.
 * 2. It implements some custom features that are not part of the ERC721 standard, like mint, burn or ownership.
 *
 * The NFT-internals functions are not supposed to be re-exported by this file.
 */

import {
  Args,
  boolToByte,
  stringToBytes,
  u256ToBytes,
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
} from './MRC721-internals';
import { onlyOwner } from '../utils/ownership';

import { Context, isDeployingContract } from '@massalabs/massa-as-sdk';
import { _setOwner } from '../utils/ownership-internal';

/**
 * @param binaryArgs - serialized strings representing the name and the symbol of the NFT
 *
 * @remarks This is the constructor of the contract. It can only be called once, when the contract is being deployed.
 * It expects two serialized arguments: the name and the symbol of the NFT.
 * Once the constructor has handled the deserialization, of the arguments,
 * it calls the _constructor function from the NFT-internals.
 *
 * Finally, it sets the owner of the contract to the caller of the constructor.
 */
export function constructor(name: string, symbol: string): void {
  assert(isDeployingContract());

  _constructor(name, symbol);
  _setOwner(Context.caller().toString());
}

export function name(): StaticArray<u8> {
  return stringToBytes(_name());
}

export function symbol(): StaticArray<u8> {
  return stringToBytes(_symbol());
}

/**
 *
 * @param binaryArgs - serialized string representing the address whose balance we want to check
 * @returns a serialized u256 representing the balance of the address
 * @remarks As we can see, instead of checking the storage directly,
 * we call the _balanceOf function from the NFT-internals.
 */
export function balanceOf(binaryArgs: StaticArray<u8>): StaticArray<u8> {
  const args = new Args(binaryArgs);
  const address = args
    .nextString()
    .expect('address argument is missing or invalid');
  return u256ToBytes(_balanceOf(address));
}

/**
 *
 * @param binaryArgs - serialized u256 representing the tokenId whose owner we want to check
 * @returns a serialized string representing the address of owner of the tokenId
 */
export function ownerOf(binaryArgs: StaticArray<u8>): StaticArray<u8> {
  const args = new Args(binaryArgs);
  const tokenId = args
    .nextU256()
    .expect('tokenId argument is missing or invalid');
  return stringToBytes(_ownerOf(tokenId));
}

/**
 *
 * @param binaryArgs - serialized u256 representing the tokenId whose approved address we want to check
 * @returns a serialized string representing the address of the approved address of the tokenId
 */
export function getApproved(binaryArgs: StaticArray<u8>): StaticArray<u8> {
  const args = new Args(binaryArgs);
  const tokenId = args
    .nextU256()
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
    .nextU256()
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
 * the address of the recipient and the tokenId to transfer.
 *
 * @remarks This function is only callable by the owner of the tokenId or an approved operator.
 *
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
 *
 * This function is not part of the ERC721 standard.
 * It serves as an example of how to use the NFT-internals functions to implement custom features.
 * Here we make use of the _update function from the NFT-internals to mint a new token.
 * Indeed, by calling _update with a non-existing tokenId, we are creating a new token.
 *
 * We also make sure that the mint feature is only callable by the owner of the contract
 * by using the onlyOwner modifier.
 *
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
 * It serves as an example of how to use the NFT-internals functions to implement custom features.
 * Here we make use of the _update function from the NFT-internals to burn a token.
 * Indeed, by calling _update with the zero address as a recipient, we are burning the token.
 *
 * We also made sure that the burn feature is only callable by the owner of the token or an approved operator.
 * Indeed, the _update function will check if the caller is the owner of the token or an approved operator.
 *
 */
export function burn(binaryArgs: StaticArray<u8>): void {
  const args = new Args(binaryArgs);
  const tokenId = args
    .nextU256()
    .expect('tokenId argument is missing or invalid');
  _update('', tokenId, '');
}

/**
 * Here we re-export the ownerAddress function from the ownership file.
 * This will allow the outside world to check the owner of the contract.
 * However we do not re-export any function from the NFT-internals file.
 * This is because the NFT-internals functions are not supposed to be called directly by the outside world.
 */
export { ownerAddress } from '../utils/ownership';
