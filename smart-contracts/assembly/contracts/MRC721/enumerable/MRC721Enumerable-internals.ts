/**
 * This file provides internal functions to support token enumeration functionality for the NFT contract on Massa.
 * It utilizes key prefix querying to retrieve all token IDs and tokens owned by specific addresses
 * in the datastore without maintaining explicit indices.
 */

import { Context, Storage } from '@massalabs/massa-as-sdk';
import { u256 } from 'as-bignum/assembly';
import { bytesToU256, stringToBytes, u256ToBytes } from '@massalabs/as-types';
import {
  _isAuthorized,
  _ownerOf,
  ownerKey,
  _update as _updateBase,
  _constructor as _constructorBase,
} from '../MRC721-internals';
export const TOTAL_SUPPLY_KEY: StaticArray<u8> = stringToBytes('totalSupply');
export const OWNED_TOKENS_KEY: StaticArray<u8> = stringToBytes('ownedTokens');

/**
 * Constructs a new NFT contract.
 * @param binaryArgs - the binary arguments name and symbol
 *
 * @remarks This function shouldn't be directly exported by the implementation contract.
 * It is meant to be called by the constructor of the implementation contract.
 * Please check the NFTEnumerable-example.ts file for an example of how to use this function.
 */
export function _constructor(name: string, symbol: string): void {
  _constructorBase(name, symbol);
  Storage.set(TOTAL_SUPPLY_KEY, u256ToBytes(u256.Zero));
}

/* -------------------------------------------------------------------------- */
/*                                TOTAL SUPPLY                                */
/* -------------------------------------------------------------------------- */

/**
 * Returns the total number of tokens in existence.
 */
export function _totalSupply(): u256 {
  return bytesToU256(Storage.get(TOTAL_SUPPLY_KEY));
}

/**
 * Increases the total supply by the given delta.
 * @param delta - The amount to increase the total supply by.
 *
 * @throws Will throw an error if the addition of delta to currentSupply exceeds u256.Max.
 */
export function _increaseTotalSupply(delta: u256): void {
  const currentSupply = _totalSupply();
  const maxAllowedDelta = u256.sub(u256.Max, currentSupply);
  assert(u256.le(delta, maxAllowedDelta), 'Total supply overflow');
  const newSupply = u256.add(currentSupply, delta);
  Storage.set(TOTAL_SUPPLY_KEY, u256ToBytes(newSupply));
}

/**
 * Decreases the total supply by the given delta.
 * @param delta - The amount to decrease the total supply by.
 *
 * @throws Will throw an error if `delta` exceeds the current total supply, causing an underflow.
 */
export function _decreaseTotalSupply(delta: u256): void {
  const currentSupply = _totalSupply();
  assert(u256.le(delta, currentSupply), 'Total supply underflow');
  const newSupply = u256.sub(currentSupply, delta);
  Storage.set(TOTAL_SUPPLY_KEY, u256ToBytes(newSupply));
}

/* -------------------------------------------------------------------------- */
/*                                 OWNED TOKENS                               */
/* -------------------------------------------------------------------------- */

/**
 * Returns the key prefix for the owned tokens of an owner.
 * @param owner - The owner's address.
 */
export function _getOwnedTokensKeyPrefix(owner: string): StaticArray<u8> {
  return OWNED_TOKENS_KEY.concat(stringToBytes(owner));
}

/**
 * Adds a token to the owner's list of tokens.
 * @param owner - The owner's address.
 * @param tokenId - The token ID to add.
 */
function _addTokenToOwnerEnumeration(owner: string, tokenId: u256): void {
  const key = _getOwnedTokensKeyPrefix(owner).concat(u256ToBytes(tokenId));
  Storage.set(key, []);
}

/**
 * Removes a token from the owner's list of tokens.
 * @param owner - The owner's address.
 * @param tokenId - The token ID to remove.
 */
function _removeTokenFromOwnerEnumeration(owner: string, tokenId: u256): void {
  const key = _getOwnedTokensKeyPrefix(owner).concat(u256ToBytes(tokenId));
  Storage.del(key);
}

/* -------------------------------------------------------------------------- */
/*                                    UPDATE                                  */
/* -------------------------------------------------------------------------- */

/**
 * Updates the token ownership and enumerations.
 * @param to - The address to transfer the token to.
 * @param tokenId - The token ID.
 * @param auth - The address authorized to perform the update.
 */
export function _update(to: string, tokenId: u256, auth: string): void {
  const previousOwner = _updateBase(to, tokenId, auth);

  // Mint
  if (previousOwner == '') {
    _addTokenToOwnerEnumeration(to, tokenId);
    _increaseTotalSupply(u256.One);
  } else {
    // Transfer
    if (to != '' && to != previousOwner) {
      _removeTokenFromOwnerEnumeration(previousOwner, tokenId);
      _addTokenToOwnerEnumeration(to, tokenId);
    }
    // Burn
    else if (to == '') {
      _removeTokenFromOwnerEnumeration(previousOwner, tokenId);
      _decreaseTotalSupply(u256.One);
    }
  }
}

/* -------------------------------------------------------------------------- */
/*                           EXPORT NECESSARY FUNCTIONS                       */
/* -------------------------------------------------------------------------- */

/**
 * Transfers a token from one address to another.
 * @param from - The current owner's address.
 * @param to - The new owner's address.
 * @param tokenId - The token ID to transfer.
 */
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

export {
  _approve,
  _balanceOf,
  _getApproved,
  _isApprovedForAll,
  _name,
  _ownerOf,
  _setApprovalForAll,
  _symbol,
} from '../MRC721-internals';
