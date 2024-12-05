import {
  stringToBytes,
  Args,
  u256ToBytes,
  boolToByte,
} from '@massalabs/as-types';
import { Storage, Context } from '@massalabs/massa-as-sdk';
import { _isOwner } from '../utils/ownership-internal';
import {
  _name,
  _symbol,
  _balanceOf,
  _ownerOf,
  _transferFrom,
  _approve,
  _setApprovalForAll,
  _getApproved,
  _isApprovedForAll,
} from './NFT-internals';

/**
 * Get the name of the NFT collection
 * @returns name of the NFT collection
 */
export function name(): StaticArray<u8> {
  return stringToBytes(_name());
}

/**
 * Get the symbol of the NFT collection
 * @returns symbol of the NFT collection
 */
export function symbol(): StaticArray<u8> {
  return stringToBytes(_symbol());
}

/**
 * Returns the number of tokens owned by the address
 * @param binaryArgs - (address: string)
 * @returns Number of tokens owned by the address in u256 as bytes
 */
export function balanceOf(binaryArgs: StaticArray<u8>): StaticArray<u8> {
  const args = new Args(binaryArgs);
  const address = args
    .nextString()
    .expect('address argument is missing or invalid');
  return u256ToBytes(_balanceOf(address));
}

/**
 * Get the owner of the token
 * @param binaryArgs - (tokenId: u256)
 * @returns Address of the owner of the token
 */
export function ownerOf(binaryArgs: StaticArray<u8>): StaticArray<u8> {
  const args = new Args(binaryArgs);
  const tokenId = args
    .nextU256()
    .expect('tokenId argument is missing or invalid');
  const owner = _ownerOf(tokenId);
  if (owner == '') {
    throw new Error('Token id not found');
  }
  return stringToBytes(owner);
}

/**
 * Transfer token from one address to another
 * @param binaryArgs - (from: string, to: string, tokenId: u256)
 */
export function transferFrom(binaryArgs: StaticArray<u8>): void {
  if (Storage.has(buildLockedKey()) && !_isOwner(Context.caller().toString())) {
    throw new Error('Transfer is locked');
  }
  const args = new Args(binaryArgs);
  const from = args.nextString().expect('from argument is missing or invalid');
  const to = args.nextString().expect('to argument is missing or invalid');
  const tokenId = args
    .nextU256()
    .expect('tokenId argument is missing or invalid');
  _transferFrom(from, to, tokenId);
}

/**
 * Approve the address to transfer the token
 * @param binaryArgs - (to: string, tokenId: u256)
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
 * Set approval for all tokens of the owner
 * @param binaryArgs - (to: string, approved: bool)
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
 * Get the address approved to transfer the token or empty address if none
 * @param binaryArgs - (tokenId: u256)
 * @returns Address of the approved address
 */
export function getApproved(binaryArgs: StaticArray<u8>): StaticArray<u8> {
  const args = new Args(binaryArgs);
  const tokenId = args
    .nextU256()
    .expect('tokenId argument is missing or invalid');
  return stringToBytes(_getApproved(tokenId));
}

/**
 * Returns if the operator is approved to transfer the tokens of the owner
 * @param binaryArgs - (owner: string, operator: string)
 * @returns Bool as bytes
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
