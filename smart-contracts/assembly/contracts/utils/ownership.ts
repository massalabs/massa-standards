import {
  Address,
  Context,
  generateEvent,
  Storage,
  createEvent,
} from '@massalabs/massa-as-sdk';
import {
  Args,
} from '@massalabs/as-types';
export const OWNER_KEY = 'OWNER';
export const NOT_SET = 'NOT_SET';

export const CHANGE_OWNER_EVENT_NAME = 'CHANGE_OWNER';

/**
 *  Set the contract owner
 *
 * @param binaryArgs - byte string with the following format:
 * - the address of the new contract owner (address).
 */
export function setOwner(newOwner: string): void {

  const contractOwner = ownerAddress();

  const callerIsOwner = isOwner(Context.caller());
  assert(
    callerIsOwner || contractOwner === NOT_SET,
    'Caller is not the owner',
  );
  Storage.set(OWNER_KEY, newOwner);

  generateEvent(createEvent(CHANGE_OWNER_EVENT_NAME, [newOwner]));
}

/**
 *  Returns the contract owner
 *
 * @returns owner address in bytes
 */
export function ownerAddress(): string {
  return Storage.has(OWNER_KEY) ? Storage.get(OWNER_KEY) : NOT_SET;
}

/**
 * Returns true if address is the owner of the contract.
 *
 * @param address -
 */
export function isOwner(address: Address): boolean {
  // values are bytes array so cannot use ===
  const owner = ownerAddress();
  return address === new Address(owner);
}

/**
 *
 * @param address -
 */
export function ownerKey(address: Address): StaticArray<u8> {
  return new Args().add('owned' + address.toString()).serialize();
}
