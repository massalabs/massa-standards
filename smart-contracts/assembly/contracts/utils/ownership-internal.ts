import {
  Context,
  Storage,
  createEvent,
  generateEvent,
} from '@massalabs/massa-as-sdk';

export const OWNER_KEY = 'OWNER';

export const CHANGE_OWNER_EVENT_NAME = 'CHANGE_OWNER';

/**
 * Sets the contract owner. This function is to be called from a smart contract.
 *
 * @param newOwner - The address of the new contract owner.
 *
 * Emits a CHANGE_OWNER event upon successful execution.
 */
export function _setOwner(newOwner: string): void {
  if (Storage.has(OWNER_KEY)) {
    _onlyOwner();
  }
  Storage.set(OWNER_KEY, newOwner);

  generateEvent(createEvent(CHANGE_OWNER_EVENT_NAME, [newOwner]));
}

/**
 * Checks if the given account is the owner of the contract.
 *
 * @param account - The address of the account to check.
 * @returns true if the account is the owner, false otherwise.
 */
export function _isOwner(account: string): bool {
  if (!Storage.has(OWNER_KEY)) {
    return false;
  }
  return account === Storage.get(OWNER_KEY);
}

/**
 * Check if the caller is the contract owner.
 *
 * @throws Will throw an error if the caller is not the owner or if the owner is not set.
 */
export function _onlyOwner(): void {
  assert(Storage.has(OWNER_KEY), 'Owner is not set');
  const owner = Storage.get(OWNER_KEY);
  assert(Context.caller().toString() === owner, 'Caller is not the owner');
}
