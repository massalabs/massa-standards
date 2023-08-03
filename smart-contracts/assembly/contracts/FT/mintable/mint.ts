import { onlyOwner } from '../../utils/ownership';
import { _mint } from './mint-internal';

/**
 * Mintable feature for fungible token.
 *
 * Re-export this file in your contract entry file to make it available in the contract.
 *
 * Token mint is restricted to the owner of the contract.
 *
 */

/**
 *  Mint tokens on the recipient address.
 *  Restricted to the owner of the contract.
 *
 * @param binaryArgs - `Args` serialized StaticArray<u8> containing:
 * - the recipient's account (address)
 * - the amount of tokens to mint (u256).
 */
export function ft1_mint(binaryArgs: StaticArray<u8>): void {
  onlyOwner();
  _mint(binaryArgs);
}
