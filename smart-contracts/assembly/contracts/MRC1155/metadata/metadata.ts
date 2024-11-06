/**
 *
 * This is an extension to the ERC1155 standard.
 *
 * It allows to store uri for each token id
 * It should be used with the internal functions from metadata-internal
 *
 */

import { _uri } from './metadata-internal';
import { Args, stringToBytes } from '@massalabs/as-types';

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
