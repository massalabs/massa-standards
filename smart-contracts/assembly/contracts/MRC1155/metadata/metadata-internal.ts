import { bytesToString, stringToBytes, u256ToBytes } from '@massalabs/as-types';
import { Storage, createEvent, generateEvent } from '@massalabs/massa-as-sdk';
import { u256 } from 'as-bignum/assembly';
import { URI_EVENT, _uri as superUri } from '../MRC1155-internal';

export const BASE_URI_KEY = stringToBytes('BASE_URI');
export const TOKENS_URI_KEY = stringToBytes('TOKENS_URI');

/**
 * @returns the key for the base uri
 */
function baseUriKey(): StaticArray<u8> {
  return BASE_URI_KEY;
}

/**
 * @param id - the id of the token
 * @returns the key for the token uri
 */
function tokenUrisKey(id: u256): StaticArray<u8> {
  return TOKENS_URI_KEY.concat(u256ToBytes(id));
}

/**
 * Set the base URI for all token IDs
 * @param newBaseUri - the new base URI
 */
export function _setBaseURI(newBaseUri: string): void {
  const baseURIKey = baseUriKey();
  Storage.set(baseURIKey, stringToBytes(newBaseUri));
}

/**
 * @returns the base URI
 */
export function _baseURI(): string {
  return Storage.has(BASE_URI_KEY)
    ? bytesToString(Storage.get(BASE_URI_KEY))
    : '';
}

/**
 * @param id - the id of the token
 * @returns the URI for the token
 */
export function _tokenURI(id: u256): string {
  const tokenUriKey = tokenUrisKey(id);
  const tokenUri = Storage.has(tokenUriKey)
    ? bytesToString(Storage.get(tokenUriKey))
    : '';

  return tokenUri;
}

/**
 * Set the URI for a token
 * @param id - the id of the token
 * @param newUri - the new URI
 */
export function _setURI(id: u256, newUri: string): void {
  const tokenUriKey = tokenUrisKey(id);

  Storage.set(tokenUriKey, stringToBytes(newUri));
  generateEvent(createEvent(URI_EVENT, [newUri, id.toString()]));
}

/**
 * Returns the URI for a given token ID.
 *
 * It returns the base uri concatenated to the tokenUri if the tokenUri is not empty
 * And if it is empty it returns the super uri from token-internal
 *
 * @param id - The token ID
 * @returns the URI for the given token ID
 */
export function _uri(id: u256): string {
  const tokenUri = _tokenURI(id);
  const baseUri = _baseURI();

  return tokenUri != '' ? baseUri.concat(tokenUri) : superUri(id);
}
