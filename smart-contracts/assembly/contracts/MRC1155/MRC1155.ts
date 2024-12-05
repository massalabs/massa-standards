/**
 *
 * This file contains the implementation of the ERC1155 token standard.
 *
 * It can be extended with the following extensions:
 * - mintable
 * - burnable
 * - metadata
 *
 * The extensions are implemented in separate files and can be imported as separate modules.
 *
 * The contract is meant to be used as a base contract for a specific Multi-NFT contract.
 */

import {
  Args,
  boolToByte,
  fixedSizeArrayToBytes,
  stringToBytes,
  u256ToBytes,
} from '@massalabs/as-types';
import {
  _balanceOf,
  _constructor,
  _balanceOfBatch,
  _uri,
  _setApprovalForAll,
  _isApprovedForAll,
  _safeTransferFrom,
  _safeBatchTransferFrom,
  ERC1155_MISSING_APPROVAL_FOR_ALL_ERROR,
  ERC1155_INVALID_ARRAY_LENGTH_ERROR,
} from './MRC1155-internal';

import { Context, isDeployingContract } from '@massalabs/massa-as-sdk';

import { u256 } from 'as-bignum/assembly';
import { _setOwner } from '../utils/ownership-internal';

/**
 * Constructs a new Multi-NFT contract.
 *
 * @param uri - the URI for the NFT contract
 */
export function constructor(binaryArgs: StaticArray<u8>): void {
  assert(isDeployingContract());
  const args = new Args(binaryArgs);
  const uri = args.nextString().expect('uri argument is missing or invalid');

  _setOwner(Context.caller().toString());

  _constructor(uri);
}

/**
 *
 * Get the URI for a token id
 *
 * @param id - the id of the token
 *
 * @returns the URI for the token
 *
 */
export function uri(binaryArgs: StaticArray<u8>): StaticArray<u8> {
  const args = new Args(binaryArgs);
  const id = args.nextU256().expect('id argument is missing or invalid');

  return stringToBytes(_uri(id));
}

/**
 *
 * Get the balance of a specific token for an address
 *
 * @param owner - the address to get the balance for
 * @param id - the id of the token to get the balance for
 *
 * @returns the balance of the token for the address
 */
export function balanceOf(binaryArgs: StaticArray<u8>): StaticArray<u8> {
  const args = new Args(binaryArgs);
  const owner = args
    .nextString()
    .expect('owner argument is missing or invalid');
  const id = args.nextU256().expect('id argument is missing or invalid');

  return u256ToBytes(_balanceOf(owner, id));
}

/**
 *
 * Get the balance of multiple tokens for multiples addresses
 *
 * @param owners - the addresses to get the balance for
 * @param ids - the ids of the tokens to get the balance for
 *
 * @returns the balances of the tokens for the addresses
 */
export function balanceOfBatch(binaryArgs: StaticArray<u8>): StaticArray<u8> {
  const args = new Args(binaryArgs);
  const owners = args
    .nextStringArray()
    .expect('owners argument is missing or invalid');
  const ids = args
    .nextFixedSizeArray<u256>()
    .expect('ids argument is missing or invalid');
  assert(owners.length == ids.length, ERC1155_INVALID_ARRAY_LENGTH_ERROR);

  const balances = _balanceOfBatch(owners, ids);
  return fixedSizeArrayToBytes<u256>(balances);
}

/**
 *
 * Set the approval status of an operator for a specific token
 *
 * Emits an ApprovalForAll event
 *
 * @param operator - the operator to set the approval for
 * @param approved - the new approval status
 */
export function setApprovalForAll(binaryArgs: StaticArray<u8>): void {
  const sender = Context.caller().toString();
  const args = new Args(binaryArgs);
  const operator = args
    .nextString()
    .expect('operator argument is missing or invalid');
  const approved = args
    .nextBool()
    .expect('approved argument is missing or invalid');

  _setApprovalForAll(sender, operator, approved);
}

/**
 *
 * Check if an operator is approved for all tokens of an owner
 *
 * @param owner - the owner of the tokens
 * @param operator - the operator to check
 *
 * @returns true if the operator is approved for all tokens of the owner
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
 * Safe transfer of a specific amount of tokens to an address.
 * The receiving address can implement the onERC1155Received interface to be called once a transfer happens.
 *
 * Emits a TransferSingle event.
 *
 * @param from - the account to transfer the tokens from
 * @param to - the account to transfer the tokens to
 * @param id - the id of the token to transfer
 * @param value - the amount of tokens to transfer
 * @param data - additional data to pass to the receiver
 */
export function safeTransferFrom(binaryArgs: StaticArray<u8>): void {
  const sender = Context.caller().toString();
  const args = new Args(binaryArgs);
  const from = args.nextString().expect('from argument is missing or invalid');
  const to = args.nextString().expect('to argument is missing or invalid');
  const id = args.nextU256().expect('id argument is missing or invalid');
  const value = args.nextU256().expect('value argument is missing or invalid');
  const data = args.nextBytes().expect('data argument is missing or invalid');
  assert(
    from == sender || _isApprovedForAll(from, sender),
    ERC1155_MISSING_APPROVAL_FOR_ALL_ERROR,
  );

  _safeTransferFrom(from, to, id, value, data);
}

/**
 *
 * Safe transfer of a batch of tokens to an address.
 * The receiving address can implement the onERC1155BatchReceived interface to be called once a transfer happens.
 *
 * Emits a TransferBatch event.
 *
 * @param from - the account to transfer the tokens from
 * @param to - the account to transfer the tokens to
 * @param ids - the ids of the tokens to transfer
 * @param values - the amounts of tokens to transfer
 * @param data - additional data to pass to the receiver
 */
export function safeBatchTransferFrom(binaryArgs: StaticArray<u8>): void {
  const sender = Context.caller().toString();
  const args = new Args(binaryArgs);
  const from = args.nextString().expect('from argument is missing or invalid');
  const to = args.nextString().expect('to argument is missing or invalid');
  const ids = args
    .nextFixedSizeArray<u256>()
    .expect('ids argument is missing or invalid');
  const values = args
    .nextFixedSizeArray<u256>()
    .expect('values argument is missing or invalid');
  const data = args.nextBytes().expect('data argument is missing or invalid');
  assert(
    from == sender || _isApprovedForAll(from, sender),
    ERC1155_MISSING_APPROVAL_FOR_ALL_ERROR,
  );

  _safeBatchTransferFrom(from, to, ids, values, data);
}
