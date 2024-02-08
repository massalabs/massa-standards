import {
  stringToBytes,
  bytesToU256,
  bytesToString,
  boolToByte,
  byteToBool,
  u256ToBytes,
  Args,
} from '@massalabs/as-types';
import { Storage, Context, Address } from '@massalabs/massa-as-sdk';

import { u256 } from 'as-bignum/assembly';

export const NAME_KEY = stringToBytes('NAME');
export const SYMBOL_KEY = stringToBytes('SYMBOL');

export const BALANCE_KEY_PREFIX = 'BALANCE';
export const OWNER_KEY_PREFIX = 'OWNER';
export const ALLOWANCE_KEY_PREFIX = 'ALLOWANCE';
export const OPERATOR_ALLOWANCE_KEY_PREFIX = 'OPERATOR_ALLOWANCE';

/**
 * Constructs a new NFT contract.
 * @param binaryArgs - the binary arguments name and symbol
 */
export function _constructor(binaryArgs: StaticArray<u8>): void {
  const args = new Args(binaryArgs);
  const name = args.nextString().expect('Invalid name');
  const symbol = args.nextString().expect('Invalid symbol');
  Storage.set(NAME_KEY, stringToBytes(name));
  Storage.set(SYMBOL_KEY, stringToBytes(symbol));
}

/**
 * @param address - address to get the balance for
 * @returns the key of the balance in the storage for the given address
 */
function balanceKey(address: Address): StaticArray<u8> {
  return stringToBytes(BALANCE_KEY_PREFIX + address.toString());
}

/**
 * @param tokenId - the tokenID of the owner
 * @returns the key of the owner in the storage for the given tokenId
 */
function ownerKey(tokenId: u256): StaticArray<u8> {
  return stringToBytes(OWNER_KEY_PREFIX + tokenId.toString());
}

/**
 * @param tokenId - the tokenID of the approved token
 * @returns the key of the allowance in the storage for the given owner and spender
 */
function allowanceKey(tokenId: u256): StaticArray<u8> {
  return stringToBytes(ALLOWANCE_KEY_PREFIX + tokenId.toString());
}

/**
 *
 * @param owner - the address of the owner
 * @param operator - the address of the operator
 * @returns The key of the operator allowance in the storage for the given owner and operator
 */
function operatorAllowanceKey(
  owner: Address,
  operator: Address,
): StaticArray<u8> {
  return stringToBytes(
    OPERATOR_ALLOWANCE_KEY_PREFIX +
      owner.toString().concat(operator.toString()),
  );
}

/**
 * Count all NFTs assigned to an owner.
 *
 * @param owner - An address for whom to query the balance
 */
export function _balanceOf(owner: Address): u256 {
  const key = balanceKey(owner);
  if (Storage.has(key)) {
    return bytesToU256(Storage.get(key));
  }
  return u256.Zero;
}

/**
 * Returns the owner of a given tokenId.
 *
 * @param tokenId - The identifier for an NFT
 * @returns the address of the owner of the NFT
 */
export function _ownerOf(tokenId: u256): Address {
  const key = ownerKey(tokenId);
  if (Storage.has(key)) {
    return new Address(bytesToString(Storage.get(key)));
  }
  return new Address();
}

/**
 * Returns the name of the contract.
 */
export function _name(): string {
  if (Storage.has(NAME_KEY)) {
    return bytesToString(Storage.get(NAME_KEY));
  }
  return '';
}

/**
 * Returns the symbol of the contract.
 */
export function _symbol(): string {
  if (Storage.has(SYMBOL_KEY)) {
    return bytesToString(Storage.get(SYMBOL_KEY));
  }
  return '';
}

/**
 * Change or reaffirm the approved address for an NFT
 *
 * @param tokenId - The NFT to approve
 * @param approved - The new approved NFT controller
 */
export function _approve(approved: Address, tokenId: u256): void {
  assert(_isAuthorized(Context.caller(), tokenId), 'Unauthorized');
  const key = allowanceKey(tokenId);
  Storage.set(key, stringToBytes(approved.toString()));
}

/**
 * Get the approved address for a single NFT
 * @param tokenId - Id of the NFT
 * @returns Address of the approved owner of the NFT
 */
export function _getApproved(tokenId: u256): Address {
  const key = allowanceKey(tokenId);
  if (Storage.has(key)) {
    return new Address(bytesToString(Storage.get(key)));
  }
  return new Address();
}

/**
 * Returns the allowance set on the owner's account for the spender.
 *
 * @param operator - address of the operator
 * @param tokenId - tokenId of the token
 * @returns
 */
export function _isApproved(operator: Address, tokenId: u256): bool {
  const allowKey = allowanceKey(tokenId);
  if (Storage.has(allowKey)) {
    return bytesToString(Storage.get(allowKey)) == operator.toString();
  }
  return false;
}

/**
 * Enable or disable approval for a third party ("operator") to manage all of `Context.caller`'s assets
 *
 * @param operator - Address to add to the set of authorized operators
 * @param approved - True if the operator is approved, false to revoke approval
 */
export function _setApprovalForAll(operator: Address, approved: bool): void {
  const key = operatorAllowanceKey(Context.caller(), operator);
  Storage.set(key, boolToByte(approved));
}

/**
 * Query if an address is an authorized operator for another address
 * @param owner - The address that owns the NFTs
 * @param operator - The address that acts on behalf of the owner
 * @returns
 */
export function _isApprovedForAll(owner: Address, operator: Address): bool {
  const key = operatorAllowanceKey(owner, operator);
  if (Storage.has(key)) {
    return byteToBool(Storage.get(key));
  }
  return false;
}

/**
 * Returns whether operator is allowed to manage tokenId.
 *
 * @param operator - address of the operator
 * @param tokenId - The NFT to be managed
 * @returns
 */
function _isAuthorized(operator: Address, tokenId: u256): bool {
  return (
    _isApproved(operator, tokenId) ||
    _isApprovedForAll(_ownerOf(tokenId), operator) ||
    _ownerOf(tokenId) == operator
  );
}

export function _update(to: Address, tokenId: u256, auth: Address): void {
  const from = _ownerOf(tokenId);
  if (auth != new Address()) {
    assert(_isAuthorized(auth, tokenId), 'Unauthorized');
  }
  if (from != new Address()) {
    // clear the approval
    _approve(new Address(), tokenId);
    // update the balance of the from
    const fromBalance = bytesToU256(Storage.get(balanceKey(from)));
    Storage.set(balanceKey(from), u256ToBytes(fromBalance - u256.One));
  }
  if (to != new Address()) {
    const toBalanceKey = balanceKey(to);
    // update the balance of the to
    if (Storage.has(toBalanceKey)) {
      Storage.set(
        toBalanceKey,
        u256ToBytes(bytesToU256(Storage.get(toBalanceKey)) + u256.One),
      );
    } else {
      Storage.set(toBalanceKey, u256ToBytes(u256.One));
    }
    // update the owner of the token
    Storage.set(ownerKey(tokenId), stringToBytes(to.toString()));
  }
}

export function _safeTransferFrom(
  from: Address,
  to: Address,
  tokenId: u256,
): void {
  assert(_isAuthorized(Context.caller(), tokenId), 'Unauthorized');
  _update(to, tokenId, from);
}
