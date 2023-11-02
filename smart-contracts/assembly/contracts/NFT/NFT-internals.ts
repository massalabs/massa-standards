import { stringToBytes, bytesToU64, u64ToBytes } from '@massalabs/as-types';
import { Storage, Context, validateAddress } from '@massalabs/massa-as-sdk';

import {
  approvedForAllTokenKey,
  approvedTokenKey,
  counterKey,
  nft1_ownerOf,
  ownerKey,
  ownerTokenKey,
} from './NFT';

/**
 * Increment the NFT counter
 */
export function _increment(): void {
  const currentID = bytesToU64(Storage.get(counterKey));
  const newID = currentID + 1;
  Storage.set(counterKey, u64ToBytes(newID));
}

export function _updateBalanceOf(address: string, increment: boolean): void {
  const balanceKey = stringToBytes('balanceOf_' + address);
  const number = increment ? 1 : -1;

  if (Storage.has(balanceKey)) {
    const balance = bytesToU64(Storage.get(balanceKey));
    const newBalance = balance + number;
    Storage.set(balanceKey, u64ToBytes(newBalance));
  } else {
    assert(number == 1, 'Balance cannot be negative');
    Storage.set(balanceKey, u64ToBytes(1));
  }
}

export function _getBalanceOf(address: string): u64 {
  const balanceKey = stringToBytes('balanceOf_' + address);

  if (!Storage.has(balanceKey)) return 0;

  return bytesToU64(Storage.get(balanceKey));
}

/**
 * @returns true if the caller is the creator of the SC
 */
export function _onlyOwner(): bool {
  return Context.caller().toString() == Storage.get(ownerKey);
}

/**
 * @param tokenId - the tokenID
 * @returns true if the caller is token's owner
 */
export function _isTokenOwner(address: string, tokenId: u64): bool {
  // as we need to compare two byteArrays, we need to compare the pointers
  // we transform our byte array to their pointers and we compare them
  const left = nft1_ownerOf(u64ToBytes(tokenId));
  return (
    memory.compare(
      changetype<usize>(left),
      changetype<usize>(stringToBytes(address)),
      left.length,
    ) == 0
  );
}

/**
 * @param tokenId - the tokenID
 * @returns true if the token is minted
 */
export function _onlyMinted(tokenId: u64): bool {
  return Storage.has(ownerTokenKey + tokenId.toString());
}

/**
 * Internal function returning the currentSupply
 * @returns u64
 */
export function _currentSupply(): u64 {
  return bytesToU64(Storage.get(counterKey));
}

// ==================================================== //
// ====                 TRANSFER                   ==== //
// ==================================================== //

export function _transfer(
  caller: string,
  owner: string,
  recipient: string,
  tokenId: u64,
): void {
  assertIsMinted(tokenId);
  assertIsOwner(owner, tokenId);
  assertNotSelfTransfer(owner, recipient);
  assertIsApproved(owner, caller, tokenId);

  _removeApproval(tokenId);
  _updateBalanceOf(owner, false);
  _updateBalanceOf(recipient, true);

  Storage.set(ownerTokenKey + tokenId.toString(), recipient);
}

// ==================================================== //
// ====                 APPROVAL                   ==== //
// ==================================================== //

/**
 * Store the approved address for a token
 *
 * @param owner - owner address
 * @param spenderAddress - spender address
 * @param tokenId - The token ID to approve
 */
export function _approve(
  tokenId: u64,
  owner: string,
  spenderAddress: string,
): void {
  assertIsMinted(tokenId);
  assertIsOwner(owner, tokenId);
  assert(!_isApproved(spenderAddress, tokenId), 'Already approved');

  const key = approvedTokenKey + tokenId.toString();
  Storage.set(key, spenderAddress);
}

/**
 * Removes the approval of the token
 * @param tokenId - the tokenID
 */
function _removeApproval(tokenId: u64): void {
  const key = approvedTokenKey + tokenId.toString();
  Storage.set(key, '');
}

export function _getApproved(tokenId: u64): string {
  const key = approvedTokenKey + tokenId.toString();
  if (!Storage.has(key)) return '';

  return Storage.get(key);
}

export function _isApproved(address: string, tokenId: u64): bool {
  if (address.length === 0) return false;
  const approvedAddress = _getApproved(tokenId);
  return approvedAddress === address;
}

export function _setApprovalForAll(
  owner: string,
  operator: string,
  approved: bool,
): void {
  assert(owner != operator, 'Not allowed to set approval for all for yourself');

  const key = approvedForAllTokenKey + owner + operator;

  Storage.set(key, approved.toString());
}

export function _isApprovedForAll(owner: string, operator: string): bool {
  const key = approvedForAllTokenKey + owner + operator;

  if (!Storage.has(key)) return false;

  const approved = Storage.get(key);

  return approved == 'true';
}

// ==================================================== //
// ====             General Assertions             ==== //
// ==================================================== //

export function assertIsMinted(tokenId: u64): void {
  assert(_onlyMinted(tokenId), `Token ${tokenId.toString()} is not minted`);
}

export function assertIsOwner(address: string, tokenId: u64): void {
  assert(
    _isTokenOwner(address, tokenId),
    `${address} is not the owner of ${tokenId.toString()}`,
  );
}

function assertIsApproved(owner: string, caller: string, tokenId: u64): void {
  assert(
    _isApproved(caller, tokenId) ||
      _isApprovedForAll(owner, caller) ||
      owner === caller,
    `${caller} is not allowed to transfer this token`,
  );
}

export function assertNotSelfTransfer(owner: string, recipient: string): void {
  assert(
    owner != recipient,
    'The owner and the recipient must be different addresses',
  );
}

export function assertAddressIsValid(address: string): void {
  assert(validateAddress(address), 'Address is not valid');
}

// ==================================================== //
// ====                 EVENTS                     ==== //
// ==================================================== //

/**
 * Constructs a pretty formatted event with given key and arguments.
 *
 * @remarks
 * The result is meant to be used with the {@link generateEvent} function.
 * It is useful to generate events from an array.
 *
 * @param key - the string event key.
 *
 * @param args - the string array arguments.
 *
 * @returns the stringified event.
 *
 */
export function createEvent(key: string, args: Array<string>): string {
  return `${key}:`.concat(args.join(','));
}
