/**
 *
 * This is an extension to the MRC1155 standard.
 *
 * It allows to burn tokens in a permissionless way
 */

import { Args } from '@massalabs/as-types';
import {
  MRC1155_MISSING_APPROVAL_FOR_ALL_ERROR,
  _burn,
  _burnBatch,
  _isApprovedForAll,
} from '../MRC1155-internal';
import { Context } from '@massalabs/massa-as-sdk';

import { u256 } from 'as-bignum/assembly';

/**
 *
 * Burn a specific amount of tokens with the approval mechanism.
 *
 * Emits a TransferSingle event.
 *
 * @param account - the account to burn the tokens from
 * @param id - the id of the token to burn
 * @param value - the amount of tokens to burn
 */
export function burn(binaryArgs: StaticArray<u8>): void {
  const sender = Context.caller().toString();
  const args = new Args(binaryArgs);
  const account = args
    .nextString()
    .expect('account argument is missing or invalid');
  const id = args.nextU256().expect('id argument is missing or invalid');
  const value = args.nextU256().expect('value argument is missing or invalid');
  assert(
    account == sender || _isApprovedForAll(account, sender),
    MRC1155_MISSING_APPROVAL_FOR_ALL_ERROR,
  );

  _burn(account, id, value);
}

/**
 *
 * Burn a batch of tokens with the approval mechanism.
 *
 * Emits a TransferBatch event.
 *
 * @param account - the account to burn the tokens from
 * @param ids - the ids of the tokens to burn
 * @param values - the amounts of tokens to burn
 */
export function burnBatch(binaryArgs: StaticArray<u8>): void {
  const sender = Context.caller().toString();
  const args = new Args(binaryArgs);
  const account = args
    .nextString()
    .expect('account argument is missing or invalid');
  const ids = args
    .nextFixedSizeArray<u256>()
    .expect('ids argument is missing or invalid');
  const values = args
    .nextFixedSizeArray<u256>()
    .expect('values argument is missing or invalid');
  assert(
    account == sender || _isApprovedForAll(account, sender),
    MRC1155_MISSING_APPROVAL_FOR_ALL_ERROR,
  );

  _burnBatch(account, ids, values);
}
