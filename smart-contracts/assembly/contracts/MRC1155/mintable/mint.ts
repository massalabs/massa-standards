/**
 *
 * This is an extension to the ERC1155 standard.
 *
 * It allows to mint tokens only by the minter role
 *
 */

import { _mint, _mintBatch } from '../token-internal';
import { Args } from '@massalabs/as-types';

import { u256 } from 'as-bignum/assembly';
import { onlyRole } from '../../utils/accessControl';

export const MINTER_ROLE = 'minter';

/**
 *
 * Mint a specific amount of tokens to an account
 *
 * Emits a TransferSingle event
 *
 * @param to - the account to mint the tokens to
 * @param id - the id of the token to mint
 * @param value - the amount of tokens to mint
 * @param data - additional data to pass to the receiver
 */
export function mint(binaryArgs: StaticArray<u8>): void {
  onlyRole(new Args().add(MINTER_ROLE).serialize());
  const args = new Args(binaryArgs);
  const to = args.nextString().expect('to argument is missing or invalid');
  const id = args.nextU256().expect('id argument is missing or invalid');
  const value = args.nextU256().expect('value argument is missing or invalid');
  const data = args.nextBytes().expect('data argument is missing or invalid');

  _mint(to, id, value, data);
}

/**
 *
 * Mint a batch of tokens to an account
 *
 * Emits a TransferBatch event
 *
 * @param to - the account to mint the tokens to
 * @param ids - the ids of the tokens to mint
 * @param values - the amounts of tokens to mint
 * @param data - additional data to pass to the receiver
 */
export function mintBatch(binaryArgs: StaticArray<u8>): void {
  onlyRole(new Args().add(MINTER_ROLE).serialize());
  const args = new Args(binaryArgs);
  const to = args.nextString().expect('to argument is missing or invalid');
  const ids = args
    .nextFixedSizeArray<u256>()
    .expect('ids argument is missing or invalid');
  const values = args
    .nextFixedSizeArray<u256>()
    .expect('values argument is missing or invalid');
  const data = args.nextBytes().expect('data argument is missing or invalid');

  _mintBatch(to, ids, values, data);
}
