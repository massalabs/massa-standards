import {
  Storage,
  Context,
  Address,
  generateEvent,
  createEvent,
} from '@massalabs/massa-as-sdk';
import { u64ToBytes } from '@massalabs/as-types';
import { totalSupply, TOTAL_SUPPLY_KEY } from './token';
import { _balance, _setBalance } from './token-commons';

const BURN_EVENT_NAME = 'BURN';

/**
 * Burn tokens from the caller address
 *
 * @param binaryArgs - byte string with the following format:
 * - the amount of tokens to burn obn the caller address (u64).
 */
@massaExport()
export function burn(amount: u64): void {
  const isDecreaseTotalSupplySuccess = _decreaseTotalSupply(amount);

  assert(
    isDecreaseTotalSupplySuccess,
    'Requested burn amount causes an underflow',
  );

  const isBurnSuccess = _burn(Context.caller(), amount);
  assert(isBurnSuccess, 'Requested burn amount causes an underflow');

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
function _burn(addressToBurn: Address, amount: u64): boolean {
  const oldRecipientBalance: u64 = _balance(addressToBurn);
  const newRecipientBalance: u64 = oldRecipientBalance - amount;

  // Check underflow
  if (oldRecipientBalance < newRecipientBalance) {
    return false;
  }
  _setBalance(addressToBurn, newRecipientBalance);
  return true;
}

/**
 * Decreases the total supply of the token.
 *
 * @param amount -
 * @returns true if the total supply has been decreased
 */
function _decreaseTotalSupply(amount: u64): boolean {
  const oldTotalSupply: u64 = totalSupply();
  const newTotalSupply: u64 = oldTotalSupply - amount;

  // Underflow
  if (oldTotalSupply < newTotalSupply) {
    return false;
  }
  Storage.set(TOTAL_SUPPLY_KEY, u64ToBytes(newTotalSupply));
  return true;
}
