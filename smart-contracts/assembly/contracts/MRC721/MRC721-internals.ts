/**
 * This file contains the internals functions of a MRC721 contract as defined by the ERC721 standard.
 * https://eips.ethereum.org/EIPS/eip-721
 *
 * DO NOT DEPLOY THIS CONTRACT.
 *
 * This file is NOT meant to be deployed on its own.
 * The functions exposed by this file are meant to be imported and used inside an MRC721 implementation contract.
 * This file can be seen as a library of helper functions that can be used to implement an MRC721 contract.
 *
 * The goal of having one separate file for the internals of the MC721 contract is
 * 1. To abstract the complexity of storage access.
 * 2. To guarantee that the storage is accessed in a consistent and gas efficient way.
 * 3. To allow developers to focus on the business logic of their MRC721 contracts.
 *
 * Please check the ./MRC721.ts file for an example of how to use this file.
 *
 */

import {
  stringToBytes,
  bytesToU256,
  bytesToString,
  boolToByte,
  byteToBool,
  u256ToBytes,
} from '@massalabs/as-types';
import { Storage, Context } from '@massalabs/massa-as-sdk';

import { u256 } from 'as-bignum/assembly';

export const NAME_KEY: StaticArray<u8> = [0x01];
export const SYMBOL_KEY: StaticArray<u8> = [0x02];

export const BALANCE_KEY_PREFIX: StaticArray<u8> = [0x03];
export const OWNER_KEY_PREFIX: StaticArray<u8> = [0x04];
export const ALLOWANCE_KEY_PREFIX: StaticArray<u8> = [0x05];
export const OPERATOR_ALLOWANCE_KEY_PREFIX: StaticArray<u8> = [0x06];

/**
 * Constructs a new MRC721 contract.
 * @param binaryArgs - the binary arguments name and symbol
 *
 * @remarks This function shouldn't be directly exported by the implementation contract.
 * It is meant to be called by the constructor of the implementation contract.
 * Please check the MRC721.ts file for an example of how to use this function.
 */
export function _constructor(name: string, symbol: string): void {
  Storage.set(NAME_KEY, stringToBytes(name));
  Storage.set(SYMBOL_KEY, stringToBytes(symbol));
}

/**
 * @param address - address to get the balance for
 * @returns the key of the balance in the storage for the given address
 */
export function balanceKey(address: string): StaticArray<u8> {
  return BALANCE_KEY_PREFIX.concat(stringToBytes(address));
}

/**
 * @param tokenId - the tokenID of the owner
 * @returns the key of the owner in the storage for the given tokenId
 */
export function ownerKey(tokenId: u256): StaticArray<u8> {
  return OWNER_KEY_PREFIX.concat(u256ToBytes(tokenId));
}

/**
 * @param tokenId - the tokenID of the approved token
 * @returns the key of the allowance in the storage for the given owner and spender
 */
function allowanceKey(tokenId: u256): StaticArray<u8> {
  return ALLOWANCE_KEY_PREFIX.concat(u256ToBytes(tokenId));
}

/**
 *
 * @param owner - the address of the owner
 * @param operator - the address of the operator
 * @returns The key of the operator allowance in the storage for the given owner and operator
 */
function operatorAllowanceKey(
  owner: string,
  operator: string,
): StaticArray<u8> {
  return OPERATOR_ALLOWANCE_KEY_PREFIX.concat(
    stringToBytes(owner).concat(stringToBytes(operator)),
  );
}

/**
 * Count all NFTs assigned to an owner.
 *
 * @param owner - An address for whom to query the balance
 */
export function _balanceOf(owner: string): u256 {
  const key = balanceKey(owner);
  return Storage.has(key) ? bytesToU256(Storage.get(key)) : u256.Zero;
}

/**
 * Returns the owner of a given tokenId.
 *
 * @param tokenId - The identifier for an NFT
 * @returns the address of the owner of the NFT or an empty string if the NFT is not owned
 */
export function _ownerOf(tokenId: u256): string {
  const key = ownerKey(tokenId);
  return Storage.has(key) ? bytesToString(Storage.get(key)) : '';
}

/**
 * Returns the name of the contract or an empty string if the name is not set.
 */
export function _name(): string {
  return Storage.has(NAME_KEY) ? bytesToString(Storage.get(NAME_KEY)) : '';
}

/**
 * Returns the symbol of the contract or an empty string if the symbol is not set.
 */
export function _symbol(): string {
  return Storage.has(SYMBOL_KEY) ? bytesToString(Storage.get(SYMBOL_KEY)) : '';
}

/**
 * Change ,reaffirm or revoke the approved address for an NFT.
 * Checks that the caller is the NFT owner or has been approved by the owner.
 *
 * @param tokenId - The NFT to approve
 * @param approved - The new approved NFT operator
 *
 * @remarks If approved is the zero address, the function will clear the approval for the NFT by deleting the key.
 *
 */
export function _approve(approved: string, tokenId: u256): void {
  assert(_isAuthorized(Context.caller().toString(), tokenId), 'Unauthorized');
  const key = allowanceKey(tokenId);
  approved != ''
    ? Storage.set(key, stringToBytes(approved))
    : Storage.has(key)
    ? Storage.del(key)
    : '';
}

/**
 * Get the approved address for a single NFT
 * @param tokenId - Id of the NFT
 * @returns Address of the approved owner of the NFT or an empty string if no address is approved.
 */
export function _getApproved(tokenId: u256): string {
  const key = allowanceKey(tokenId);
  return Storage.has(key) ? bytesToString(Storage.get(key)) : '';
}

/**
 * Returns the allowance set on the owner's account for the spender.
 *
 * @param operator - address of the operator
 * @param tokenId - tokenId of the token
 * @returns true if the operator is approved, false if not
 */
export function _isApproved(operator: string, tokenId: u256): bool {
  const allowKey = allowanceKey(tokenId);
  return Storage.has(allowKey)
    ? bytesToString(Storage.get(allowKey)) == operator
    : false;
}

/**
 * Enable or disable approval for a third party ("operator") to manage all of `Context.caller`'s assets.
 *
 * @param operator - Address to add to the set of authorized operators
 * @param approved - True if the operator is approved, false to revoke approval
 *
 * @remarks deletes the key if approved is false
 */
export function _setApprovalForAll(operator: string, approved: bool): void {
  const key = operatorAllowanceKey(Context.caller().toString(), operator);
  approved ? Storage.set(key, boolToByte(true)) : Storage.del(key);
}

/**
 * Query if an address is an authorized operator for another address
 * @param owner - The address that owns the NFTs
 * @param operator - The address that acts on behalf of the owner
 * @returns true if the operator is approved for all, false if not
 */
export function _isApprovedForAll(owner: string, operator: string): bool {
  const key = operatorAllowanceKey(owner, operator);
  return Storage.has(key) ? byteToBool(Storage.get(key)) : false;
}

/**
 * Returns whether operator is allowed to manage tokenId.
 *
 * @param operator - address of the operator
 * @param tokenId - The NFT to be managed
 * @returns true if operator is allowed to manage the NFT, false if not. The three possibilities are:
 * 1. The owner of the NFT
 * 2. The operator has been approved by the owner
 * 3. The operator has been approved for all NFTs by the owner
 */
export function _isAuthorized(operator: string, tokenId: u256): bool {
  return (
    _ownerOf(tokenId) == operator ||
    _isApproved(operator, tokenId) ||
    _isApprovedForAll(_ownerOf(tokenId), operator)
  );
}

/**
 * Transfers `tokenId` from its current owner to `to`,
 * or alternatively mints if the current owner is the zero address.
 * or alternatively burns if the `to` is the zero address.
 *
 * @param to - the address to transfer the token to. If the address is the zero address, the token is burned.
 * @param tokenId - the token to transfer. If the owner is the zero address, i.e., the token isn't owned,
 * the token gets minted.
 * @param auth - the address of the operator. If the 'auth' is non 0,
 * then this function will check that 'auth' is either the owner of the token,
 * or approved to operate on the token (by the owner). If `auth` is 0, then no check is performed.
 *
 * @remarks This function is a helper function for functions such as `transfer`, `transferFrom`, `mint` or `burn`.
 * It is not meant to be called directly as it does not check for the caller's permissions.
 * For example if you were to wrap this helper in a `transfer` function,
 * you should check that the caller is the owner of the token, and then call the _update function.
 */
export function _update(to: string, tokenId: u256, auth: string): string {
  const from = _ownerOf(tokenId);
  assert(to != from, 'The from and to addresses are the same');
  if (auth != '') {
    assert(_isAuthorized(auth, tokenId), 'Unauthorized');
  }
  if (from != '') {
    // clear the approval
    _approve('', tokenId);
    // update the balance of the from
    const fromBalance = bytesToU256(Storage.get(balanceKey(from)));
    assert(fromBalance > u256.Zero, 'Insufficient balance');
    // @ts-ignore
    Storage.set(balanceKey(from), u256ToBytes(fromBalance - u256.One));
  }
  if (to != '') {
    const toBalanceKey = balanceKey(to);
    // update the balance of the to
    if (Storage.has(toBalanceKey)) {
      const toBalance = bytesToU256(Storage.get(toBalanceKey));
      assert(toBalance < u256.Max, 'Balance overflow');
      // @ts-ignore
      Storage.set(toBalanceKey, u256ToBytes(toBalance + u256.One));
    } else {
      Storage.set(toBalanceKey, u256ToBytes(u256.One));
    }
    // update the owner of the token
    Storage.set(ownerKey(tokenId), stringToBytes(to.toString()));
  } else {
    // burn the token
    Storage.del(ownerKey(tokenId));
  }

  return from;
}

/**
 * Transfers the ownership of an NFT from one address to another address.
 * @param from - The address of the current owner
 * @param to - The address of the new owner
 * @param tokenId - The NFT to transfer
 *
 * @remarks This function can be called by the current owner of the NFT or an authorized operator.
 * If the caller is not the owner, it must be an authorized operator to execute the function.
 *
 **/
export function _transferFrom(from: string, to: string, tokenId: u256): void {
  assert(
    _isAuthorized(Context.caller().toString(), tokenId),
    'Unauthorized caller',
  );
  assert(from == _ownerOf(tokenId), 'Unauthorized from');
  assert(to != '', 'Unauthorized to');
  assert(Storage.has(ownerKey(tokenId)), 'Nonexistent token');
  _update(to, tokenId, from);
}

/**
 * TOD0: Implement the safeTransferFrom function.
 * To do so you need to verify that the recipient is a contract and supports the ERC721Receiver interface.
 *
 * see: https://github.com/massalabs/massa-standards/issues/146
 */
