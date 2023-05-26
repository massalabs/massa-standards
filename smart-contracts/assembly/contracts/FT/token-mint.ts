import {
  Storage,
  Context,
  Address,
  generateEvent,
  createEvent,
} from '@massalabs/massa-as-sdk';
import { Args, bytesToU64, byteToBool, u64ToBytes } from '@massalabs/as-types';
import { totalSupply, TOTAL_SUPPLY_KEY } from './token';
import { _balance, _setBalance } from './token-commons';
import { isOwner } from '../utils/ownership';

const MINT_EVENT_NAME = 'MINT';

/**
 *  Mint tokens on the recipient address
 *
 * @param binaryArgs - `Args` serialized StaticArray<u8> containing:
 * - the recipient's account (address)
 * - the amount of tokens to mint (u64).
 */
export function mint(binaryArgs: StaticArray<u8>): void {
  const args = new Args(binaryArgs);
  const recipient = new Address(
    args.nextString().expect('recipient argument is missing or invalid'),
  );
  const amount = args.nextU64().expect('amount argument is missing or invalid');

  assert(byteToBool(isOwner(Context.caller())), 'Caller is not the owner');

  const isSuccessIncreaseTotalSupply = _increaseTotalSupply(amount);
  assert(
    isSuccessIncreaseTotalSupply,
    'Requested burn amount causes an overflow',
  );

  const isSuccessMint = _mint(recipient, amount);
  assert(isSuccessMint, 'Requested burn amount causes an overflow');

  generateEvent(
    createEvent(MINT_EVENT_NAME, [recipient.toString(), amount.toString()]),
  );
}

/**
 * Adds amount of token to recipient.
 *
 * @param recipient -
 * @param amount -
 * @returns true if the token has been minted
 */
function _mint(recipient: Address, amount: u64): boolean {
  const oldRecipientBalance = _balance(recipient);
  const newRecipientBalance = oldRecipientBalance + amount;

  if (oldRecipientBalance > newRecipientBalance) {
    return false;
  }

  _setBalance(recipient, newRecipientBalance);

  return true;
}

/**
 * Increases the total supply of the token.
 *
 * @param amount - how much you want to increase the total supply
 * @returns true if the total supply has been increased
 */
function _increaseTotalSupply(amount: u64): boolean {
  const oldTotalSupply = totalSupply();
  const newTotalSupply = oldTotalSupply + amount;
  // Overflow
  if (oldTotalSupply > newTotalSupply) {
    return false;
  }
  Storage.set(TOTAL_SUPPLY_KEY, u64ToBytes(newTotalSupply));
  return true;
}
