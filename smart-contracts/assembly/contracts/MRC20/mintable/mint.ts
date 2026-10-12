import { onlyOwner } from '../../utils/ownership';
import { _mint } from './mint-internal';
import { balance, transferRemaining } from '@massalabs/massa-as-sdk';

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
 *
 * @remarks Reconciles coins via {@link transferRemaining} so the caller pays for
 * the recipient's new balance entry instead of the contract (excess coins are
 * refunded). It must be the outermost/only reconciliation: to compose, use
 * `_mint` from `mint-internal` and reconcile once at your outer boundary.
 */
export function mint(binaryArgs: StaticArray<u8>): void {
  const initialBalance = balance();
  onlyOwner();
  _mint(binaryArgs);
  transferRemaining(initialBalance);
}
