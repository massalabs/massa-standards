import { Address, generateEvent } from '@massalabs/massa-as-sdk';
import { Args } from '@massalabs/as-types';
import { _balance, _setBalance } from '../token-commons';
import { onlyOwner } from '../../utils/ownership';
import { _increaseTotalSupply, _mint } from './mint-internal';


/**
 * Mintable ability for fungible token.
 * 
 * Re-export this file in your contract entry file to make it available in the contract.
 * 
 * Token mint is restricted to the owner of the contract.
 *
 */

export const MINT_EVENT = 'MINTED';

/**
 *  Mint tokens on the recipient address
 *
 * @param binaryArgs - `Args` serialized StaticArray<u8> containing:
 * - the recipient's account (address)
 * - the amount of tokens to mint (u256).
 */
export function mint(binaryArgs: StaticArray<u8>): void {
  onlyOwner();
  const args = new Args(binaryArgs);
  const recipient = new Address(
    args.nextString().expect('recipient argument is missing or invalid'),
  );
  const amount = args
    .nextU256()
    .expect('amount argument is missing or invalid');

  _increaseTotalSupply(amount);

  _mint(recipient, amount);

  generateEvent(
    `${MINT_EVENT}: ${amount.toString()} tokens to ${recipient.toString()}`,
  );
}

