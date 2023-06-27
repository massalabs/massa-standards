import {
  Storage,
  Context,
  Address,
  generateEvent,
  createEvent,
} from '@massalabs/massa-as-sdk';
import { Args, bytesToU256, u256ToBytes } from '@massalabs/as-types';
import { totalSupply, TOTAL_SUPPLY_KEY } from './token';
import { _balance, _setBalance } from './token-commons';
import { u256 } from 'as-bignum/assembly';

const BURN_EVENT_NAME = 'BURN';

/**
 * Burn tokens from the caller address
 *
 * @param binaryArgs - byte string with the following format:
 * - the amount of tokens to burn obn the caller address (u256).
 */
export function burn(binaryArgs: StaticArray<u8>): void {
  const args = new Args(binaryArgs);
  const amount = args
    .nextU256()
    .expect('amount argument is missing or invalid');

  _decreaseTotalSupply(amount);

  _burn(Context.caller(), amount);

  generateEvent(
    createEvent(BURN_EVENT_NAME, [
      Context.caller().toString(),
      amount.toString(),
    ]),
  );
}

/**
 * Removes amount of token from addressToBurn.
 *
 * @param addressToBurn -
 * @param amount -
 * @returns true if tokens has been burned
 */
export function _burn(addressToBurn: Address, amount: u256): void {
  const oldRecipientBalance = _balance(addressToBurn);
  // @ts-ignore
  const newRecipientBalance: u256 = oldRecipientBalance - amount;

  // Check underflow
  assert(
    oldRecipientBalance > newRecipientBalance,
    'Requested burn amount causes an underflow',
  );

  _setBalance(addressToBurn, newRecipientBalance);
}

/**
 * Decreases the total supply of the token.
 *
 * @param amount -
 * @returns true if the total supply has been decreased
 */
export function _decreaseTotalSupply(amount: u256): void {
  const oldTotalSupply = bytesToU256(totalSupply([]));
  // @ts-ignore
  const newTotalSupply: u256 = oldTotalSupply - amount;

  // Check underflow
  assert(
    oldTotalSupply > newTotalSupply,
    'Requested burn amount causes an underflow',
  );

  Storage.set(TOTAL_SUPPLY_KEY, u256ToBytes(newTotalSupply));
}
