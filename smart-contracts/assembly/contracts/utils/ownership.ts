import { Storage } from '@massalabs/massa-as-sdk';
import { Args, boolToByte, stringToBytes } from '@massalabs/as-types';
import {
  OWNER_KEY,
  _isOwner,
  _onlyOwner,
  _setOwner,
} from './ownership-internal';

/**
 *  Set the contract owner
 *
 * @param binaryArgs - byte string with the following format:
 * - the address of the new contract owner (address).
 */

export function setOwner(binaryArgs: StaticArray<u8>): void {
  const args = new Args(binaryArgs);
  const newOwner = args
    .nextString()
    .expect('newOwnerAddress argument is missing or invalid');

  _setOwner(newOwner);
}

/**
 *  Returns the contract owner
 *
 * @returns owner address in bytes
 */
export function ownerAddress(_: StaticArray<u8>): StaticArray<u8> {
  if (!Storage.has(OWNER_KEY)) {
    return [];
  }

  return stringToBytes(Storage.get(OWNER_KEY));
}

/**
 * Returns true if address is the owner of the contract.
 *
 * @param address -
 */
export function isOwner(binaryArgs: StaticArray<u8>): StaticArray<u8> {
  if (!Storage.has(OWNER_KEY)) {
    return [0]; // false
  }
  const address = new Args(binaryArgs)
    .nextString()
    .expect('address argument is missing or invalid');
  return boolToByte(_isOwner(address));
}

/**
 * Throws if the caller is not the owner.
 *
 * @param address -
 */
export function onlyOwner(): void {
  _onlyOwner();
}
