import { Args } from '@massalabs/as-types';
import { _setBaseURI } from '../metadata/metadata-internal';
import { onlyOwner } from '../../utils';
import { isDeployingContract } from '@massalabs/massa-as-sdk';
import { constructor as mrc721Constructor } from '../enumerable';

const NAME = 'MassaNft';
const SYMBOL = 'MNFT';
const BASE_URI = 'ipfs://QmW77ZQQ7Jm9q8WuLbH8YZg2K7T9Qnjbzm7jYVQQrJY5Yd';

export function constructor(_binaryArgs: StaticArray<u8>): void {
  assert(isDeployingContract());
  mrc721Constructor(NAME, SYMBOL);
  _setBaseURI(BASE_URI);
}

/**
 * Set the base URI for all token IDs
 * @param newBaseUri - the new base URI
 */
export function setBaseURI(_args: StaticArray<u8>): void {
  onlyOwner();
  const args = new Args(_args);
  const newBaseUri = args
    .nextString()
    .expect('newBaseUri argument is missing or invalid');

  _setBaseURI(newBaseUri);
}

export {
  isApprovedForAll,
  setApprovalForAll,
  totalSupply,
  getApproved,
  approve,
  transferFrom,
  balanceOf,
  symbol,
  name,
  // mint, // Add this line if you want your contract to be able to mint tokens
  // burn, // Add this line if you want your contract to be able to burn tokens
} from '../enumerable/MRC721Enumerable';
export { uri } from '../metadata/metadata';
export { setOwner, ownerAddress } from '../../utils/ownership';
